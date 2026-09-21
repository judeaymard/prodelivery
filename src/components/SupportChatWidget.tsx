"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  ExternalLink,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Clock,
  ChevronDown,
  UserCheck,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Maximize2,
  Paperclip,
  FileText,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { ChatMessage, Conversation, ChatAttachment } from "@/lib/types";
import { uploadAttachmentReal } from "@/lib/attachments";

const SUGGESTED_QUESTIONS = [
  "👩‍💼 Parler à un agent ENO livraison en direct",
  "📦 Comment suivre mes livraisons ?",
  "💸 Quand mon retrait est-il validé ?",
  "🚚 Programmer un ramassage de stock",
];

export default function SupportChatWidget() {
  const {
    conversations,
    currentPartner,
    activePartner,
    requestHumanSupport,
    sendConversationMessage,
  } = useOperations();

  const effectivePartner = activePartner || currentPartner;
  const partnerId = effectivePartner?.id || "usr-partner-1";
  const partnerCompanyName = effectivePartner?.companyName || "Boutique Partenaire";

  // Toutes les conversations associées à ce partenaire
  const partnerConvs = useMemo(() => {
    return conversations.filter(
      (c) => c.partnerId === partnerId || c.companyName === partnerCompanyName
    );
  }, [conversations, partnerId, partnerCompanyName]);

  // Conversation active (non résolue)
  const activeConv = useMemo(() => {
    return partnerConvs.find((c) => c.status !== "RESOLVED");
  }, [partnerConvs]);

  // Dernière conversation archivée/résolue pour l'historique si aucune active
  const lastResolvedConv = useMemo(() => {
    return partnerConvs.find((c) => c.status === "RESOLVED");
  }, [partnerConvs]);

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Conversation affichée (sélectionnée, active, ou dernière résolue)
  const displayedConv = useMemo(() => {
    if (selectedConvId) {
      const found = partnerConvs.find((c) => c.id === selectedConvId);
      if (found) return found;
    }
    return activeConv || lastResolvedConv || null;
  }, [selectedConvId, partnerConvs, activeConv, lastResolvedConv]);

  const isResolved = displayedConv?.status === "RESOLVED";

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isWaitingAgent, setIsWaitingAgent] = useState(false);

  // Upload d'images
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, displayedConv?.messages?.length, isTyping, pendingAttachments.length]);

  // Si la conversation est assignée à un agent humain réel
  const assignedAgentName = displayedConv?.assignedAgentName;
  const isAssigned =
    !isResolved &&
    !!assignedAgentName &&
    displayedConv?.status !== "UNASSIGNED" &&
    displayedConv?.status !== "WAITING";

  // Démarrer une nouvelle discussion
  const handleStartNewChat = async (textToSend?: string) => {
    setIsWaitingAgent(true);
    setIsTyping(true);

    try {
      const newConv = await requestHumanSupport(
        partnerId,
        textToSend || "Bonjour, je souhaite être mis en relation avec un conseiller en direct.",
        true
      );
      if (newConv?.id) {
        setSelectedConvId(newConv.id);
        setInputMessage("");
        setPendingAttachments([]);
      }
    } catch (err) {
      console.warn("Erreur démarrage nouvelle discussion:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRequestAgent = async () => {
    if (isResolved || !displayedConv) {
      await handleStartNewChat("Bonjour, je souhaite être mis en relation avec un conseiller en direct.");
      return;
    }

    setIsWaitingAgent(true);
    setIsTyping(true);

    try {
      await requestHumanSupport(partnerId, "Bonjour, je souhaite être mis en relation avec un conseiller en direct.");
    } catch (err) {
      console.warn("Erreur requestHumanSupport:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Upload d'image dans le widget
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const convId = displayedConv?.id || `conv_${Date.now()}`;
    setIsUploading(true);
    const uploadedList: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const att = await uploadAttachmentReal(
          files[i],
          convId,
          partnerCompanyName,
          () => {},
          "PARTNER"
        );
        uploadedList.push(att);
      } catch (err) {
        console.warn("Erreur upload widget:", err);
      }
    }

    setPendingAttachments((prev) => [...prev, ...uploadedList]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputMessage;
    const hasAttachments = pendingAttachments.length > 0;
    if (!text.trim() && !hasAttachments) return;

    if (textToSend === undefined) setInputMessage("");
    const toSendAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    // Si la conversation précédente était résolue/clôturée ou absente, démarrer un nouveau fil
    if (isResolved || !displayedConv) {
      setIsTyping(true);
      try {
        const newConv = await requestHumanSupport(
          partnerId,
          text.trim() || "Image jointe",
          true
        );
        if (newConv?.id) {
          setSelectedConvId(newConv.id);
          if (toSendAttachments.length > 0) {
            sendConversationMessage(
              newConv.id,
              text.trim(),
              false,
              toSendAttachments,
              "PARTNER",
              partnerCompanyName
            );
          }
        }
      } catch (err) {
        console.warn("Erreur envoi message nouveau fil:", err);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const lower = text.toLowerCase();

    // 1. Détection de demande d'agent humain
    if (
      lower.includes("agent") ||
      lower.includes("humain") ||
      lower.includes("conseiller") ||
      lower.includes("quelqu'un") ||
      lower.includes("parler")
    ) {
      await handleRequestAgent();
      return;
    }

    // 2. Envoi direct dans la discussion en cours
    sendConversationMessage(
      displayedConv.id,
      text.trim(),
      false,
      toSendAttachments.length > 0 ? toSendAttachments : undefined,
      "PARTNER",
      partnerCompanyName
    );
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* 🟢 FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-[#0D5940] hover:bg-[#093D2C] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-[0_8px_25px_rgba(13,89,64,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20 cursor-pointer"
          aria-label="Ouvrir le chat support"
        >
          {/* Pulsing ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>

          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-white shrink-0 border border-white/30">
            <Image
              src="/images/eno_livraison_logo.png"
              alt="Logo ENO"
              fill
              className="object-contain p-0.5"
            />
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-black tracking-tight leading-none">Support ENO</p>
            <p className="text-[10px] text-emerald-200 font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isAssigned ? `${assignedAgentName} en ligne` : "Assistance & Support"}
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="sm:hidden absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 💬 CHAT BOX WINDOW */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#FAF9F5] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#EAE6DD] flex flex-col overflow-hidden animate-fade-in-up">
          {/* 1. Header (Charte ENO Vert Profond) */}
          <div className="bg-[#0D5940] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-[#093D2C] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-2xl overflow-hidden bg-white shrink-0 border-2 border-emerald-400/40 shadow-xs flex items-center justify-center">
                {isAssigned ? (
                  <span className="text-lg">👩‍💼</span>
                ) : (
                  <Image
                    src="/images/eno_livraison_logo.png"
                    alt="Logo Support"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm tracking-tight truncate">
                    {isAssigned ? assignedAgentName : "Support ENO LIVRAISON"}
                  </h3>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-black rounded-full uppercase shrink-0 ${
                      isResolved
                        ? "bg-slate-200 text-slate-800"
                        : "bg-emerald-400 text-[#093D2C]"
                    }`}
                  >
                    {isResolved ? "Clôturée" : "En direct"}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-100/90 font-medium flex items-center gap-1 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isResolved ? "bg-slate-300" : "bg-emerald-400 animate-pulse"
                    }`}
                  ></span>
                  {isResolved
                    ? "Discussion clôturée • Nouveau fil disponible"
                    : isAssigned
                    ? "Conseillère dédiée connectée"
                    : "Équipe & Direction connectées"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Bouton ouvrir la page complète avec historiques */}
              <Link
                href="/dashboard/support"
                title="Ouvrir le support complet & historiques"
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Bandeau statut si en attente d'un agent */}
          {!isAssigned && !isResolved && displayedConv?.status === "WAITING" && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-center gap-2 text-amber-900 text-xs shrink-0 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
              <p className="text-[11px] font-medium leading-snug">
                Demande transmise aux <strong>closeuses</strong> et à la <strong>direction</strong>. Un conseiller va valider d&apos;ici quelques instants.
              </p>
            </div>
          )}

          {/* 3. Messages Stream */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs">
            {/* Message de bienvenue initial */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#0D5940] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                ENO
              </div>
              <div className="bg-white border border-[#EAE6DD] text-[#141A17] p-3 rounded-2xl rounded-tl-xs shadow-2xs max-w-[85%] space-y-1">
                <p className="font-semibold text-[11px] leading-relaxed">
                  Bonjour ! 👋 Bienvenue sur le support officiel d&apos;ENO LIVRAISON. Vous pouvez poser une question ci-dessous, joindre des photos de colis ou demander une closeuse en direct.
                </p>
                <span className="text-[9px] text-[#787163] block text-right font-medium">Support ENO</span>
              </div>
            </div>

            {/* Messages réels de la conversation */}
            {displayedConv?.messages?.map((m: ChatMessage) => {
              if (m.isInternalNote) return null; // Ne pas afficher les notes confidentielles au marchand
              const isPartner = m.sender === "PARTNER";
              const attachments = m.attachments || [];

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isPartner ? "items-end" : "items-start"}`}
                >
                  {!isPartner && (
                    <span className="text-[10px] font-bold text-emerald-800 mb-1 px-1 flex items-center gap-1">
                      <span>👩‍💼 {m.senderName}</span>
                      <span className="text-slate-400 font-normal font-mono">({m.sentAt})</span>
                    </span>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-2xs ${
                      isPartner
                        ? "bg-[#0D5940] text-white rounded-tr-xs"
                        : "bg-white border border-[#EAE6DD] text-[#141A17] rounded-tl-xs"
                    }`}
                  >
                    {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                    {/* Images jointes dans le message */}
                    {attachments.filter((a) => a.type === "IMAGE").length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {attachments
                          .filter((a) => a.type === "IMAGE")
                          .map((img) => (
                            <div
                              key={img.id}
                              onClick={() => setLightboxUrl(img.url || img.thumbnailUrl || null)}
                              className="relative rounded-xl overflow-hidden aspect-video bg-black/10 border border-white/20 cursor-pointer group"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url || img.thumbnailUrl}
                                alt={img.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                Agrandir
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Documents joints */}
                    {attachments
                      .filter((a) => a.type !== "IMAGE")
                      .map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 p-1.5 rounded-lg bg-black/10 flex items-center gap-1.5 text-[11px] hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate">{doc.fileName}</span>
                        </a>
                      ))}

                    {isPartner && (
                      <span className="text-[9px] text-emerald-200 block text-right mt-1 font-mono">
                        {m.sentAt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Carte de clôture si résolue */}
            {isResolved && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-center space-y-2.5 my-2 animate-fade-in shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Cette discussion a été clôturée</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Votre demande précédente a été résolue. Besoin d&apos;aide pour une autre question ou un suivi ?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewChat()}
                  className="px-4 py-2 bg-[#0D5940] hover:bg-[#093D2C] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 mx-auto transition-transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Démarrer une nouvelle discussion</span>
                </button>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-[#EAE6DD] text-[#787163] w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. Suggestions chips */}
          {(!isAssigned || isResolved) && displayedConv?.status !== "WAITING" && (
            <div className="px-3 py-1.5 bg-[#F3EFE6]/60 border-t border-[#EAE6DD] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white border border-[#EAE6DD] hover:border-[#0D5940] text-[11px] font-bold text-[#5C5649] hover:text-[#0D5940] transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 5. Aperçu des images sélectionnées prêtes à l'envoi */}
          {pendingAttachments.length > 0 && (
            <div className="px-3 py-1.5 bg-white border-t border-[#EAE6DD] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] shrink-0"
                >
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  <span className="max-w-[100px] truncate text-slate-700">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-600 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 6. Formulaire de saisie avec bouton photo */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-[#EAE6DD] flex items-center gap-2 shrink-0"
          >
            {/* Input caché de fichiers */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />

            {/* Bouton joindre image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0D5940] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Joindre une photo ou capture"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isResolved
                  ? "Écrivez pour démarrer une nouvelle discussion..."
                  : isAssigned
                  ? `Message pour ${assignedAgentName}...`
                  : displayedConv?.status === "WAITING"
                  ? "Votre message pour l'équipe..."
                  : "Écrivez votre message..."
              }
              className="flex-1 px-3.5 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#0D5940] focus:bg-white"
            />

            <button
              type="submit"
              disabled={(!inputMessage.trim() && pendingAttachments.length === 0) || isUploading}
              className="p-2.5 rounded-xl bg-[#0D5940] hover:bg-[#093D2C] disabled:opacity-40 disabled:hover:bg-[#0D5940] text-white transition-all shadow-xs shrink-0 cursor-pointer"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Lightbox Pop-up */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Aperçu"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
