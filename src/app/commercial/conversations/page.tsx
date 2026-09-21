"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Lock,
  Headset,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Phone,
  Store,
  Sparkles,
  UserCheck,
  Shield,
  ArrowLeft,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  UserPlus,
  Info,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import {
  Conversation,
  ChatMessage,
  ChatAttachment,
} from "@/lib/types";
import { uploadAttachmentReal } from "@/lib/attachments";

export default function CommercialConversationsPage() {
  const {
    conversations,
    orders,
    partners,
    closeuses,
    treasuryManagers,
    activeCloseuse,
    sendConversationMessage,
    claimConversation,
    assignConversation,
    transferConversation,
    resolveConversation,
    reopenConversation,
  } = useOperations();

  const currentUserName = activeCloseuse?.name || "Opératrice Télévente";
  const currentUserRole = "Closeuse & Support";

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || "");
  const [filterTab, setFilterTab] = useState<"ALL" | "WAITING" | "MY_CONVS" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Attachments / Images pour closeuse
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Composer
  const [messageInput, setMessageInput] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetAgent, setTransferTargetAgent] = useState<string>("Jude S. (PDG)");
  const [transferTargetRole, setTransferTargetRole] = useState<string>("Direction Générale");
  const [transferReasonInput, setTransferReasonInput] = useState("");

  // Mobile navigation
  const [mobileView, setMobileView] = useState<"LIST" | "CHAT" | "DETAILS">("LIST");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // KPIs
  const waitingCount = useMemo(
    () =>
      conversations.filter(
        (c) => c.status === "WAITING" || (!c.assignedAgentName && c.status !== "RESOLVED")
      ).length,
    [conversations]
  );

  const myConversationsCount = useMemo(
    () => conversations.filter((c) => c.assignedAgentName === currentUserName && c.status !== "RESOLVED").length,
    [conversations, currentUserName]
  );

  const resolvedCount = useMemo(
    () => conversations.filter((c) => c.status === "RESOLVED").length,
    [conversations]
  );

  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  const openCount = useMemo(
    () => conversations.filter((c) => c.status === "OPEN" || c.status === "WAITING").length,
    [conversations]
  );

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Onglets
      if (filterTab === "WAITING") {
        if (c.status !== "WAITING" && !!c.assignedAgentName) return false;
        if (c.status === "RESOLVED") return false;
      } else if (filterTab === "MY_CONVS") {
        if (c.assignedAgentName !== currentUserName) return false;
        if (c.status === "RESOLVED") return false;
      } else if (filterTab === "RESOLVED") {
        if (c.status !== "RESOLVED") return false;
      } else if (filterTab === "ALL") {
        if (c.status === "RESOLVED") return false;
      }

      // Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.companyName?.toLowerCase().includes(q) ||
          c.partnerName?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.lastMessage?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [conversations, filterTab, searchQuery, currentUserName]);

  // Si aucune conversation active n'est définie, prendre la première
  useEffect(() => {
    if (!activeConvId && filteredConversations.length > 0) {
      setActiveConvId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConvId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConvId) || filteredConversations[0] || null,
    [conversations, activeConvId, filteredConversations]
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeConvId, activeConversation?.messages?.length]);

  // Fiche marchand associée
  const currentPartner = useMemo(() => {
    if (!activeConversation) return null;
    return (
      partners.find(
        (p) =>
          p.id === activeConversation.partnerId ||
          p.companyName === activeConversation.companyName
      ) || null
    );
  }, [partners, activeConversation]);

  // Commandes récentes du marchand
  const partnerOrders = useMemo(() => {
    if (!currentPartner && !activeConversation) return [];
    const pId = currentPartner?.id || activeConversation?.partnerId;
    const cName = currentPartner?.companyName || activeConversation?.companyName;
    return orders
      .filter((o) => o.partnerId === pId || o.partnerName === cName)
      .slice(0, 5);
  }, [orders, currentPartner, activeConversation]);

  // Upload de fichier / photo par la closeuse
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeConversation) return;

    setIsUploading(true);
    const uploadedList: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const att = await uploadAttachmentReal(
          files[i],
          activeConversation.id,
          currentUserName,
          () => {},
          currentUserRole
        );
        uploadedList.push(att);
      } catch (err) {
        console.warn("Erreur upload closeuse:", err);
      }
    }

    setPendingAttachments((prev) => [...prev, ...uploadedList]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Envoi de message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    const hasAttachments = pendingAttachments.length > 0;
    if (!messageInput.trim() && !hasAttachments) return;

    sendConversationMessage(
      activeConversation.id,
      messageInput.trim(),
      isInternalNote,
      hasAttachments ? pendingAttachments : undefined,
      "AGENT",
      currentUserName
    );

    setMessageInput("");
    setPendingAttachments([]);
    setIsInternalNote(false);
    setTimeout(scrollToBottom, 50);
  };

  // Envoi d'une réponse rapide pré-remplie
  const handleQuickReply = (text: string) => {
    if (!activeConversation) return;
    sendConversationMessage(
      activeConversation.id,
      text,
      false,
      undefined,
      "AGENT",
      currentUserName
    );
    setTimeout(scrollToBottom, 50);
  };

  // Prise en charge
  const handleClaim = (convId: string) => {
    claimConversation(convId, currentUserName, currentUserRole);
  };

  // Transfert
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !transferReasonInput.trim()) return;

    transferConversation(
      activeConversation.id,
      transferTargetAgent,
      transferTargetRole,
      transferReasonInput.trim()
    );

    setShowTransferModal(false);
    setTransferReasonInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full gap-2.5 font-sans overflow-hidden p-1 sm:p-2">
      {/* 🟢 TOP BAR STATISTIQUES CLOSEUSE */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                Support Marchands &amp; Télévente
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                Espace Closeuse
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              Connectée en tant que <strong className="text-slate-800">{currentUserName}</strong> ({currentUserRole})
            </p>
          </div>
        </div>

        {/* Badges compteurs rapides */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Toutes ({openCount})</span>
          </button>

          <button
            onClick={() => setFilterTab("WAITING")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "WAITING"
                ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>En attente : {waitingCount}</span>
          </button>

          <button
            onClick={() => setFilterTab("MY_CONVS")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "MY_CONVS"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mes fils : {myConversationsCount}</span>
          </button>

          <button
            onClick={() => setFilterTab("RESOLVED")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "RESOLVED"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Résolues ({resolvedCount})</span>
          </button>
        </div>
      </div>

      {/* 📱 COMMUTATEUR VUE MOBILE (Si écran étroit) */}
      <div className="xl:hidden flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <button
          onClick={() => setMobileView("LIST")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            mobileView === "LIST" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Conversations ({filteredConversations.length})
        </button>
        <button
          onClick={() => setMobileView("CHAT")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            mobileView === "CHAT" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Discussion
        </button>
        <button
          onClick={() => setMobileView("DETAILS")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            mobileView === "DETAILS" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Fiche Marchand
        </button>
      </div>

      {/* 🟢 CORPS PRINCIPAL : 3 COLONNES */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-2.5 overflow-hidden">
        {/* COLONNE 1 : LISTE DES DEMANDES MARCHANDS (3.5 / 12) */}
        <div
          className={`xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col min-h-0 overflow-hidden ${
            mobileView === "LIST" ? "flex" : "hidden xl:flex"
          }`}
        >
          {/* Recherche */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une boutique, téléphone..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Filtres tabs rapides */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterTab("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  filterTab === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Toutes ({openCount})
              </button>
              <button
                onClick={() => setFilterTab("WAITING")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  filterTab === "WAITING"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                En attente ({waitingCount})
              </button>
              <button
                onClick={() => setFilterTab("MY_CONVS")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  filterTab === "MY_CONVS"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Mes fils ({myConversationsCount})
              </button>
              <button
                onClick={() => setFilterTab("RESOLVED")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  filterTab === "RESOLVED"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Résolues ({resolvedCount})
              </button>
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const isWaiting = conv.status === "WAITING" || (!conv.assignedAgentName && conv.status !== "RESOLVED");
              const isMine = conv.assignedAgentName === currentUserName;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileView("CHAT");
                  }}
                  className={`p-3 cursor-pointer transition-all hover:bg-slate-50 relative ${
                    isSelected ? "bg-emerald-50/60 border-l-4 border-emerald-600" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {conv.companyName || "Boutique Marchand"}
                        </span>
                        {isWaiting && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" title="En attente de prise en charge" />
                        )}
                        {isMine && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                            Moi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.partnerName} • <span className="font-mono">{conv.phone}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                        &laquo; {conv.lastMessage} &raquo;
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">{conv.lastMessageAt || "Récemment"}</span>
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="inline-block mt-1 px-1.5 py-0.2 bg-rose-500 text-white font-black text-[10px] rounded-full">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Aucune conversation dans cet onglet.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE 2 : DISCUSSION ACTIVE (5 / 12) */}
        <div
          className={`xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col min-h-0 overflow-hidden ${
            mobileView === "CHAT" ? "flex" : "hidden xl:flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* En-tête conversation */}
              <div className="p-3 border-b border-slate-100 bg-white flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => setMobileView("LIST")}
                      className="xl:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {activeConversation.companyName?.charAt(0) || "M"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {activeConversation.companyName}
                        </h2>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeConversation.status === "WAITING"
                              ? "bg-amber-100 text-amber-800"
                              : activeConversation.status === "RESOLVED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {activeConversation.status === "WAITING"
                            ? "En attente"
                            : activeConversation.status === "RESOLVED"
                            ? "Résolue"
                            : "Ouverte"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {activeConversation.partnerName} • <span className="font-mono">{activeConversation.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions rapides header */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://wa.me/${activeConversation.phone?.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1"
                      title="Ouvrir sur WhatsApp"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                      title="Transférer à un collègue ou au PDG"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    {activeConversation.status === "RESOLVED" ? (
                      <button
                        onClick={() => reopenConversation(activeConversation.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                        title="Réouvrir la discussion"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Réouvrir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => resolveConversation(activeConversation.id, currentUserName)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clôturer définitivement la conversation"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Clôturer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* BANNIÈRE DE VALIDATION SI EN ATTENTE */}
                {(!activeConversation.assignedAgentName || activeConversation.status === "WAITING") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <p className="text-xs text-amber-900 font-medium truncate">
                        Demande non assignée : validez la prise en charge pour répondre.
                      </p>
                    </div>
                    <button
                      onClick={() => handleClaim(activeConversation.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0 animate-pulse"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Prendre en charge</span>
                    </button>
                  </div>
                )}

                {/* Statut de l'agent assigné & bouton Prendre la main si assigné à un autre */}
                {activeConversation.assignedAgentName && activeConversation.status !== "WAITING" && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Pris en charge par : <strong className="text-slate-800">{activeConversation.assignedAgentName}</strong> ({activeConversation.assignedAgentRole || "Support"})
                      </span>
                    </div>
                    {activeConversation.status !== "RESOLVED" && activeConversation.assignedAgentName !== currentUserName && (
                      <button
                        onClick={() => handleClaim(activeConversation.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                        title="Prendre la main sur cette discussion"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Prendre la main</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Flux des messages */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 bg-[#FAF9F5]/40">
                {activeConversation.messages.map((m: ChatMessage) => {
                  const isPartner = m.sender === "PARTNER";
                  const isInternal = m.isInternalNote;

                  if (isInternal) {
                    return (
                      <div
                        key={m.id}
                        className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-xs text-amber-950 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-amber-800">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Note Interne • {m.senderName}</span>
                          </span>
                          <span className="font-mono text-amber-600">{m.sentAt}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isPartner ? "items-start" : "items-end"}`}
                    >
                      <span className="text-[10px] font-bold text-slate-500 mb-1 px-1 flex items-center gap-1">
                        <span>{isPartner ? `🏬 ${m.senderName || activeConversation.companyName}` : `👩‍💼 ${m.senderName}`}</span>
                        <span className="text-slate-400 font-normal font-mono">({m.sentAt})</span>
                      </span>

                      <div
                        className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-2xs ${
                          isPartner
                            ? "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                            : "bg-emerald-700 text-white rounded-tr-xs"
                        }`}
                      >
                        {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}

                        {/* Pièces jointes / images (Taille compacte) */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {m.attachments.filter((a) => a.type === "IMAGE").length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {m.attachments
                                  .filter((a) => a.type === "IMAGE")
                                  .map((img) => (
                                    <div
                                      key={img.id}
                                      onClick={() => setLightboxUrl(img.url || img.thumbnailUrl || null)}
                                      className="relative rounded-xl overflow-hidden w-28 h-24 sm:w-36 sm:h-28 bg-black/10 border border-slate-200/80 cursor-pointer group shadow-2xs shrink-0"
                                      title="Cliquer pour agrandir"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url || img.thumbnailUrl}
                                        alt={img.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                        Agrandir
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                            {m.attachments
                              .filter((a) => a.type !== "IMAGE")
                              .map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-lg flex items-center gap-1.5 text-[11px] ${
                                    isPartner ? "bg-slate-100 text-slate-800" : "bg-white/20 text-white"
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{doc.fileName}</span>
                                </a>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions rapides (Canned responses pour closeuse) */}
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Réponses rapides :
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Bonjour ! Je vérifie immédiatement le statut de vos livraisons.")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold truncate shrink-0 cursor-pointer"
                >
                  Suivi de livraison
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Votre ramassage de stock a bien été validé et transmis à notre pôle logistique.")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold truncate shrink-0 cursor-pointer"
                >
                  Ramassage validé
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Le client a été contacté par notre équipe et la commande est bien confirmée.")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold truncate shrink-0 cursor-pointer"
                >
                  Client confirmé
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Je fais le point immédiatement avec la trésorerie concernant votre demande de virement.")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold truncate shrink-0 cursor-pointer"
                >
                  Point Trésorerie
                </button>
              </div>

              {/* Formulaire de saisie message */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className={isInternalNote ? "text-amber-800 font-bold flex items-center gap-1" : ""}>
                      {isInternalNote && <Lock className="w-3 h-3 text-amber-600" />}
                      Note interne confidentielle (invisible pour le marchand)
                    </span>
                  </label>
                </div>

                {/* Aperçu des pièces jointes prêtes */}
                {pendingAttachments.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] shrink-0"
                      >
                        <ImageIcon className="w-3 h-3 text-emerald-600" />
                        <span className="max-w-[110px] truncate text-slate-700">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
                    title="Joindre une photo ou capture d'écran"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      isInternalNote
                        ? "Écrire une note interne pour vos collègues closeuses ou le PDG..."
                        : `Répondre en direct à ${activeConversation.companyName}... (Entrée pour envoyer)`
                    }
                    rows={2}
                    className={`flex-1 p-2.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none ${
                      isInternalNote
                        ? "bg-amber-50/50 border-amber-300 focus:ring-amber-500"
                        : "bg-white border-slate-200 focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isUploading}
                    className={`p-2.5 rounded-xl text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    title="Envoyer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <h3 className="text-sm font-bold text-slate-700">Aucune conversation sélectionnée</h3>
              <p className="text-xs text-slate-500 mt-1">Sélectionnez une demande dans la liste pour démarrer l&apos;assistance.</p>
            </div>
          )}
        </div>

        {/* COLONNE 3 : FICHE MARCHAND & COMMANDES LIÉES (3.5 / 12) */}
        <div
          className={`xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col min-h-0 overflow-hidden ${
            mobileView === "DETAILS" ? "flex" : "hidden xl:flex"
          }`}
        >
          {activeConversation && (
            <div className="p-3.5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* En-tête fiche */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fiche E-commerçant</span>
                  </span>
                  <button
                    onClick={() => setMobileView("CHAT")}
                    className="xl:hidden p-1 rounded text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <p className="text-xs font-black text-slate-900">{activeConversation.companyName}</p>
                  <p className="text-xs text-slate-600">{activeConversation.partnerName}</p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Téléphone :</span>
                    <span className="font-mono font-bold text-slate-800">{activeConversation.phone}</span>
                  </div>
                  {currentPartner && (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Ville :</span>
                        <span className="font-semibold text-slate-800">{currentPartner.city || "Conakry"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Solde dispo :</span>
                        <span className="font-mono font-black text-emerald-600">
                          {formatCFA(currentPartner.availableBalance || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Commandes récentes du marchand pour assistance rapide */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span>Colis récents ({partnerOrders.length})</span>
                  </span>
                  <Link
                    href="/commercial/commandes"
                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>

                <div className="space-y-1.5">
                  {partnerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                        <span className="text-slate-800">{ord.orderNumber}</span>
                        <span className="text-emerald-700">{formatCFA(ord.totalPrice)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{ord.clientName} {ord.city ? `(${ord.city})` : ""}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="truncate">Livreur : {ord.assignedLivreurName || "Non affecté"}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold uppercase">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {partnerOrders.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Aucune commande récente liée.
                    </p>
                  )}
                </div>
              </div>

              {/* Équipe closeuses & réattribution */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Headset className="w-3.5 h-3.5 text-slate-500" />
                  <span>Réattribuer ce marchand</span>
                </span>

                <div className="space-y-1">
                  {closeuses.map((cls) => {
                    const isAssigned = activeConversation.assignedAgentName === cls.name;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => assignConversation(activeConversation.id, cls.name, "Closeuse")}
                        className={`w-full p-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isAssigned
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold"
                            : "hover:bg-slate-50 text-slate-700 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Headset className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cls.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{cls.phone}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 MODALE DE TRANSFERT */}
      {showTransferModal && activeConversation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Transférer la conversation</h3>
                  <p className="text-xs text-slate-500">{activeConversation.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transférer à :</label>
                <select
                  value={transferTargetAgent}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setTransferTargetAgent(selected);
                    if (selected.includes("PDG")) setTransferTargetRole("Direction Générale");
                    else if (selected.includes("Trésor") || selected.includes("Koffi")) setTransferTargetRole("Trésorerie");
                    else setTransferTargetRole("Closeuse");
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <optgroup label="Direction">
                    <option value="Jude S. (PDG)">Jude S. (PDG) — Direction Générale</option>
                  </optgroup>
                  <optgroup label="Closeuses">
                    {closeuses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} — Closeuse
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Trésorerie">
                    {treasuryManagers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} — Responsable Trésorerie
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motif du transfert (requis) :
                </label>
                <textarea
                  required
                  rows={3}
                  value={transferReasonInput}
                  onChange={(e) => setTransferReasonInput(e.target.value)}
                  placeholder="Ex : Marchand demande une dérogation tarifaire spéciale ou un point sur son virement..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  Confirmer le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Pop-up Closeuse */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Photo agrandie"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
