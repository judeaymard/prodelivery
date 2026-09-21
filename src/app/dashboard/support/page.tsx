"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  Clock,
  UserCheck,
  Phone,
  ArrowUpRight,
  Maximize2,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { currentPartner } from "@/lib/mock-data";
import { Conversation, ChatMessage, ChatAttachment } from "@/lib/types";
import { uploadAttachmentReal } from "@/lib/attachments";

export default function MerchantSupportPage() {
  const {
    conversations,
    activePartner,
    currentPartner: storePartner,
    requestHumanSupport,
    sendConversationMessage,
    resolveConversation,
    reopenConversation,
  } = useOperations();

  const partner = activePartner || storePartner || currentPartner;
  const partnerId = partner?.id || "p1";
  const partnerCompanyName = partner?.companyName || "Ma Boutique";

  // Toutes les conversations de ce partenaire
  const partnerConversations = useMemo(() => {
    return conversations
      .filter(
        (c) => c.partnerId === partnerId || c.companyName === partnerCompanyName
      )
      .sort((a, b) => {
        // Mettre les actives en premier puis par ID/date
        if (a.status !== "RESOLVED" && b.status === "RESOLVED") return -1;
        if (a.status === "RESOLVED" && b.status !== "RESOLVED") return 1;
        return (b.id || "").localeCompare(a.id || "");
      });
  }, [conversations, partnerId, partnerCompanyName]);

  const [activeConvId, setActiveConvId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Pièces jointes / images en cours de téléversement
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Visionneuse / Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sélection automatique de la première conversation disponible
  useEffect(() => {
    if (!activeConvId && partnerConversations.length > 0) {
      setActiveConvId(partnerConversations[0].id);
    }
  }, [partnerConversations, activeConvId]);

  const activeConversation = useMemo(() => {
    return partnerConversations.find((c) => c.id === activeConvId) || partnerConversations[0] || null;
  }, [partnerConversations, activeConvId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages?.length, isSending]);

  // Filtrage des conversations
  const filteredConversations = useMemo(() => {
    return partnerConversations.filter((c) => {
      if (filterStatus === "ACTIVE" && c.status === "RESOLVED") return false;
      if (filterStatus === "RESOLVED" && c.status !== "RESOLVED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          c.lastMessage?.toLowerCase().includes(q) ||
          c.assignedAgentName?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q);
        if (!matchText) return false;
      }
      return true;
    });
  }, [partnerConversations, filterStatus, searchQuery]);

  // KPIs
  const activeCount = useMemo(
    () => partnerConversations.filter((c) => c.status !== "RESOLVED").length,
    [partnerConversations]
  );
  const resolvedCount = useMemo(
    () => partnerConversations.filter((c) => c.status === "RESOLVED").length,
    [partnerConversations]
  );

  // Démarrer une nouvelle discussion
  const handleStartNewDiscussion = async (initialText?: string) => {
    setIsSending(true);
    try {
      const newConv = await requestHumanSupport(
        partnerId,
        initialText || "Bonjour, j'ai une nouvelle demande d'assistance.",
        true
      );
      if (newConv?.id) {
        setActiveConvId(newConv.id);
        setMessageInput("");
        setPendingAttachments([]);
      }
    } catch (err) {
      console.warn("Erreur création discussion:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Upload d'image / document
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const convId = activeConversation?.id || `conv_${Date.now()}`;
    setIsUploading(true);
    setUploadError(null);

    const uploadedList: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const att = await uploadAttachmentReal(
          file,
          convId,
          partnerCompanyName,
          () => {},
          "PARTNER"
        );
        uploadedList.push(att);
      } catch (err: any) {
        setUploadError(err.message || "Échec d'envoi de l'image");
      }
    }

    setPendingAttachments((prev) => [...prev, ...uploadedList]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Envoi du message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation) {
      if (messageInput.trim() || pendingAttachments.length > 0) {
        handleStartNewDiscussion(messageInput.trim() || "Image jointe");
      }
      return;
    }

    if (!messageInput.trim() && pendingAttachments.length === 0) return;

    sendConversationMessage(
      activeConversation.id,
      messageInput.trim(),
      false,
      pendingAttachments.length > 0 ? pendingAttachments : undefined,
      "PARTNER",
      partnerCompanyName
    );

    setMessageInput("");
    setPendingAttachments([]);
    setTimeout(scrollToBottom, 50);
  };

  const isCurrentResolved = activeConversation?.status === "RESOLVED";

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full p-2 sm:p-4 gap-3 font-sans overflow-hidden">
      {/* 🟢 TOP HEADER STATS & ACTION */}
      <div className="bg-white p-4 rounded-3xl border border-[#EAE6DD] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#e52320] text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#141A17] tracking-tight truncate">
                Centre d&apos;Assistance &amp; Support Direct
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                Service Client 24/7
              </span>
            </div>
            <p className="text-xs text-[#787163] truncate mt-0.5">
              Échangez en direct avec vos closeuses dédiées et la direction GuinéeGo LAT.
            </p>
          </div>
        </div>

        {/* Bouton Nouvelle Discussion */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/2290197362906"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#25D366]/30"
          >
            <Phone className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp Direct</span>
          </a>

          <button
            type="button"
            onClick={() => handleStartNewDiscussion()}
            disabled={isSending}
            className="px-4 py-2 rounded-xl bg-[#e52320] hover:bg-[#c91d1a] text-white font-black text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Demande</span>
          </button>
        </div>
      </div>

      {/* 🟢 CORPS PRINCIPAL (2 ou 3 colonnes) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* COLONNE GAUCHE : HISTORIQUE DES TICKETS / CONVERSATIONS (4 / 12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE6DD] shadow-2xs flex flex-col min-h-0 overflow-hidden">
          {/* Barre de recherche et filtres */}
          <div className="p-3.5 border-b border-[#EAE6DD] bg-[#FAF9F5]/60 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8474] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans mes échanges..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320]"
              />
            </div>

            {/* Onglets rapides */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                  filterStatus === "ALL"
                    ? "bg-[#141A17] text-white shadow-xs"
                    : "bg-white text-[#5C5649] border border-[#EAE6DD] hover:bg-slate-50"
                }`}
              >
                Toutes ({partnerConversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("ACTIVE")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                  filterStatus === "ACTIVE"
                    ? "bg-[#e52320] text-white shadow-xs"
                    : "bg-white text-[#5C5649] border border-[#EAE6DD] hover:bg-slate-50"
                }`}
              >
                En cours ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("RESOLVED")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                  filterStatus === "RESOLVED"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-white text-[#5C5649] border border-[#EAE6DD] hover:bg-slate-50"
                }`}
              >
                Clôturées ({resolvedCount})
              </button>
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE6DD]/60 min-h-0">
            {filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const isResolved = conv.status === "RESOLVED";
              const isWaiting = conv.status === "WAITING" || (!conv.assignedAgentName && !isResolved);

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 relative ${
                    isSelected ? "bg-[#e52320]/5 border-l-4 border-[#e52320]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isResolved
                              ? "bg-slate-100 text-slate-600"
                              : isWaiting
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isResolved ? "Clôturée" : isWaiting ? "En attente" : "En cours"}
                        </span>
                        {conv.assignedAgentName && !isResolved && (
                          <span className="text-[10px] text-[#e52320] font-bold flex items-center gap-1 truncate">
                            <UserCheck className="w-3 h-3" />
                            {conv.assignedAgentName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#141A17] font-semibold mt-1.5 line-clamp-1">
                        {conv.lastMessage || "Demande d'assistance"}
                      </p>
                      <p className="text-[10px] text-[#8C8474] mt-1 font-mono">
                        Réf: #{conv.id.slice(-8)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#8C8474] font-mono block">
                        {conv.lastMessageAt || "Récemment"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-[#8C8474] space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">Aucune conversation trouvée.</p>
                <button
                  type="button"
                  onClick={() => handleStartNewDiscussion()}
                  className="px-3 py-1.5 rounded-xl bg-[#e52320] text-white text-xs font-bold mt-2"
                >
                  Démarrer une discussion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE CENTRE : DISCUSSION INTERACTIVE ACTIVE (8 / 12) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAE6DD] shadow-2xs flex flex-col min-h-0 overflow-hidden">
          {activeConversation ? (
            <>
              {/* En-tête de la discussion active */}
              <div className="p-4 border-b border-[#EAE6DD] bg-white flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#e52320] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      {activeConversation.assignedAgentName?.charAt(0) || "E"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-[#141A17] truncate">
                          {activeConversation.assignedAgentName
                            ? `Conseiller dédié : ${activeConversation.assignedAgentName}`
                            : "Support GuinéeGo LAT"}
                        </h2>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCurrentResolved
                              ? "bg-slate-100 text-slate-600"
                              : activeConversation.status === "WAITING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCurrentResolved
                            ? "Clôturée"
                            : activeConversation.status === "WAITING"
                            ? "En attente"
                            : "En cours"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#787163] truncate">
                        {activeConversation.assignedAgentRole || "Équipe Télévente & Direction"} • Réf: #{activeConversation.id}
                      </p>
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrentResolved ? (
                      <button
                        type="button"
                        onClick={() => handleStartNewDiscussion()}
                        className="px-3 py-1.5 rounded-xl bg-[#e52320] text-white hover:bg-[#c91d1a] text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Nouveau fil</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => resolveConversation(activeConversation.id, partnerCompanyName)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Marquer la question comme résolue"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Clôturer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bandeau d'attente si non assigné */}
                {!isCurrentResolved && activeConversation.status === "WAITING" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-amber-900 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <p className="text-[11px] font-medium leading-tight">
                      Votre demande a été notifiée aux <strong>closeuses</strong> et à la <strong>direction</strong>. Un agent va prendre la main et vous répondre en direct.
                    </p>
                  </div>
                )}
              </div>

              {/* Flux des messages */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 min-h-0 bg-[#FAF9F5]/50">
                {activeConversation.messages.map((m: ChatMessage) => {
                  if (m.isInternalNote) return null; // Ne pas montrer les notes confidentielles au marchand
                  const isPartner = m.sender === "PARTNER";
                  const attachments = m.attachments || [];

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isPartner ? "items-end" : "items-start"}`}
                    >
                      {!isPartner && (
                        <span className="text-[10px] font-black text-[#e52320] mb-1 px-1 flex items-center gap-1">
                          <span>👩‍💼 {m.senderName}</span>
                          <span className="text-[#8C8474] font-normal font-mono">({m.sentAt})</span>
                        </span>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs leading-relaxed shadow-2xs ${
                          isPartner
                            ? "bg-[#e52320] text-white rounded-tr-xs"
                            : "bg-white border border-[#EAE6DD] text-[#141A17] rounded-tl-xs"
                        }`}
                      >
                        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}

                        {/* Rendu des pièces jointes / photos */}
                        {attachments.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {/* Images (Taille compacte) */}
                            {attachments.filter((a) => a.type === "IMAGE").length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {attachments
                                  .filter((a) => a.type === "IMAGE")
                                  .map((img) => (
                                    <div
                                      key={img.id}
                                      onClick={() => setLightboxUrl(img.url || img.thumbnailUrl || null)}
                                      className="relative rounded-xl overflow-hidden w-28 h-24 sm:w-36 sm:h-28 bg-black/10 border border-white/20 cursor-pointer group shadow-2xs shrink-0"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url || img.thumbnailUrl}
                                        alt={img.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                        <Maximize2 className="w-3 h-3" />
                                        <span>Agrandir</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* Documents */}
                            {attachments
                              .filter((a) => a.type !== "IMAGE")
                              .map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 rounded-xl flex items-center gap-2 text-xs transition-colors ${
                                    isPartner
                                      ? "bg-white/10 hover:bg-white/20 text-white"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span className="truncate flex-1 font-medium">{doc.fileName}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                                </a>
                              ))}
                          </div>
                        )}

                        {isPartner && (
                          <span className="text-[9px] text-emerald-200 block text-right mt-1.5 font-mono">
                            {m.sentAt}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Carte de clôture si résolue */}
                {isCurrentResolved && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-3xl text-center space-y-3 my-3 animate-fade-in shadow-2xs">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Cette discussion a été clôturée</p>
                      <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                        Votre demande précédente a été résolue par notre équipe. Si vous avez une nouvelle question ou une livraison à signaler, cliquez ci-dessous pour ouvrir un nouveau fil.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartNewDiscussion()}
                      className="px-5 py-2.5 bg-[#e52320] hover:bg-[#c91d1a] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Démarrer une nouvelle discussion</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Aperçu des pièces jointes sélectionnées avant envoi */}
              {pendingAttachments.length > 0 && (
                <div className="px-4 py-2.5 bg-[#FAF9F5] border-t border-[#EAE6DD] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[11px] font-bold text-[#787163] shrink-0">
                    Fichiers prêts :
                  </span>
                  {pendingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 bg-white border border-[#EAE6DD] rounded-xl px-2.5 py-1 text-xs shrink-0 shadow-2xs"
                    >
                      {att.type === "IMAGE" ? (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span className="text-[11px] font-medium text-[#141A17] truncate max-w-[120px]">
                        {att.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notification d'erreur d'upload */}
              {uploadError && (
                <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    {uploadError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Formulaire de saisie et envoi d'images */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-white border-t border-[#EAE6DD] flex items-center gap-2.5 shrink-0"
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

                {/* Bouton joindre image / fichier */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl border border-[#EAE6DD] hover:border-[#e52320] hover:bg-[#FAF9F5] text-[#5C5649] hover:text-[#e52320] transition-colors cursor-pointer shrink-0"
                  title="Joindre une photo, capture d'écran ou bordereau"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={
                    isCurrentResolved
                      ? "Cette discussion est clôturée. Tapez pour lancer un nouveau fil..."
                      : "Écrivez votre message ou joignez une image..."
                  }
                  className="flex-1 px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-semibold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white placeholder:text-[#8C8474]"
                />

                <button
                  type="submit"
                  disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isUploading}
                  className="px-4 py-2.5 rounded-xl bg-[#e52320] hover:bg-[#c91d1a] disabled:opacity-40 disabled:hover:bg-[#e52320] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Envoyer</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C8474]">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-[#e52320]" />
              <h3 className="text-sm font-black text-[#141A17]">Aucune discussion active</h3>
              <p className="text-xs text-[#787163] mt-1 max-w-sm">
                Sélectionnez une discussion à gauche ou démarrez un nouvel échange pour parler à votre conseiller.
              </p>
              <button
                type="button"
                onClick={() => handleStartNewDiscussion()}
                className="mt-4 px-4 py-2 bg-[#e52320] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Démarrer une discussion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 LIGHTBOX PLEIN ÉCRAN */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Photo agrandie"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
