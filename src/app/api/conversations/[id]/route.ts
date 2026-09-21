import { NextRequest, NextResponse } from "next/server";
import { getConversationById, saveConversation } from "@/lib/server-db";
import { ChatMessage } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conv = await getConversationById(id);
    if (!conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    return NextResponse.json({ success: true, conversation: conv });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assignedAgentName, assignedAgentRole, closedByName } = body;

    const conv = await getConversationById(id);
    if (!conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    if (status) {
      conv.status = status;
    }
    if (assignedAgentName !== undefined) {
      conv.assignedAgentName = assignedAgentName;
    }
    if (assignedAgentRole !== undefined) {
      conv.assignedAgentRole = assignedAgentRole;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Si clôture de conversation, ajouter le message de clôture officiel
    if (status === "RESOLVED") {
      const closerLabel = closedByName || assignedAgentName || "l'équipe ENO LIVRAISON";
      const closeMsg: ChatMessage = {
        id: `msg_resolved_${Date.now()}`,
        sender: "BOT",
        senderName: "Support ENO LIVRAISON",
        text: `🔒 Cette discussion a été clôturée par ${closerLabel}. Merci d'avoir contacté le service support ENO LIVRAISON. Vous pouvez démarrer une nouvelle discussion à tout moment pour toute autre question.`,
        sentAt: timeStr,
        isInternalNote: false,
      };
      conv.messages.push(closeMsg);
      conv.lastMessage = "Conversation clôturée";
      conv.lastMessageAt = timeStr;
      conv.unreadCount = 0;
    } else if (status === "OPEN") {
      conv.lastMessageAt = "À l'instant";
    }

    await saveConversation(conv);

    return NextResponse.json({
      success: true,
      conversation: conv,
    });
  } catch (error: any) {
    console.error("Erreur mise à jour conversation:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
