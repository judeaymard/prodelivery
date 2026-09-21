import { NextRequest, NextResponse } from "next/server";
import { saveMessageToConversation, getConversationById, saveConversation } from "@/lib/server-db";
import { ChatMessage, ChatAttachment } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await req.json();
    const {
      text = "",
      isInternalNote = false,
      attachments = [],
      sender = "PDG",
      senderName = "Jude S. (PDG)",
      assignedAgentName,
      assignedAgentRole,
      status,
    } = body;

    const conv = await getConversationById(conversationId);
    if (!conv) {
      return NextResponse.json(
        { error: "Conversation introuvable." },
        { status: 404 }
      );
    }

    const now = new Date();
    const sentAt = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const normalizedAttachments: ChatAttachment[] = Array.isArray(attachments)
      ? attachments
      : [];

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender,
      senderName,
      text,
      sentAt,
      isInternalNote,
      attachments: normalizedAttachments,
      attachmentName: normalizedAttachments[0]?.fileName,
      attachmentUrl: normalizedAttachments[0]?.url,
      attachmentType: normalizedAttachments[0]?.type,
      attachmentSize: normalizedAttachments[0]?.fileSize,
    };

    const convUpdates = assignedAgentName
      ? {
          assignedAgentName,
          assignedAgentRole: assignedAgentRole || "Support",
          status: (status || "OPEN") as any,
        }
      : undefined;

    const result = await saveMessageToConversation(conversationId, newMessage, convUpdates);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        conversation: result.conversation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur ajout de message:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de l'enregistrement du message." },
      { status: 500 }
    );
  }
}
