import { NextRequest, NextResponse } from "next/server";
import { getConversations, saveConversation, getPartners } from "@/lib/server-db";
import { Conversation, ChatMessage } from "@/lib/types";

export async function GET() {
  try {
    const conversations = await getConversations();
    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    console.error("Erreur récupération des conversations:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id: customId,
      partnerId,
      partnerName,
      companyName,
      phone,
      initialMessage,
      requestHuman = false,
      forceNew = false,
    } = body;

    if (!partnerId && !companyName) {
      return NextResponse.json(
        { error: "Identifiant ou nom de la boutique requis." },
        { status: 400 }
      );
    }

    const conversations = await getConversations();
    const partners = await getPartners();
    const partner = partners.find((p) => p.id === partnerId);

    const effectiveCompanyName = companyName || partner?.companyName || "Boutique Partenaire";
    const effectivePartnerName = partnerName || partner?.fullName || "E-commerçant";
    const effectivePhone = phone || partner?.phone || "+229 00 00 00 00";

    // Vérifier si une conversation ACTIVE (non résolue) existe déjà pour ce partenaire
    let conv = !forceNew
      ? conversations.find(
          (c) =>
            (c.partnerId === partnerId || c.companyName === effectiveCompanyName) &&
            c.status !== "RESOLVED"
        )
      : null;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    if (conv) {
      // Mettre à jour la conversation existante
      if (requestHuman && (!conv.assignedAgentName || conv.status === "UNASSIGNED")) {
        conv.status = "WAITING";
        conv.priority = "HIGH";
      }

      if (initialMessage) {
        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender: "PARTNER",
          senderName: effectiveCompanyName,
          text: initialMessage,
          sentAt: timeStr,
        };
        conv.messages.push(newMsg);
        conv.lastMessage = initialMessage;
        conv.lastMessageAt = "À l'instant";
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
      await saveConversation(conv);
      return NextResponse.json({ success: true, conversation: conv });
    }

    // Créer une nouvelle conversation
    const newConvId = customId || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const initialMessages: ChatMessage[] = [];

    if (initialMessage) {
      initialMessages.push({
        id: `msg_${Date.now()}`,
        sender: "PARTNER",
        senderName: effectiveCompanyName,
        text: initialMessage,
        sentAt: timeStr,
      });
    }

    const newConversation: Conversation = {
      id: newConvId,
      partnerId: partnerId || `p_${Date.now()}`,
      partnerName: effectivePartnerName,
      companyName: effectiveCompanyName,
      phone: effectivePhone,
      lastMessage: initialMessage || "Nouvelle demande de support",
      lastMessageAt: "À l'instant",
      unreadCount: initialMessage ? 1 : 0,
      status: requestHuman ? "WAITING" : "OPEN",
      priority: requestHuman ? "HIGH" : "NORMAL",
      messages: initialMessages,
      assignmentHistory: [],
    };

    await saveConversation(newConversation);
    return NextResponse.json({ success: true, conversation: newConversation }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création/mise à jour conversation:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
