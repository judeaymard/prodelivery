"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  ChevronRight,
  Package,
  Wallet,
  Phone,
  Store,
  Sparkles,
  UserCheck,
  Shield,
  ArrowRight,
  ArrowLeft,
  Tag,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Bot,
  Zap,
  RotateCcw,
  Check,
  SlidersHorizontal,
  Mail,
  UserPlus,
  Layers,
  Flame,
  Clock4,
  Eye,
  Info,
  ChevronDown,
  ArrowDown,
  Download,
  Upload,
  RefreshCw,
  Maximize2,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import {
  Conversation,
  ChatMessage,
  ChatAttachment,
  ConversationStatus,
  ConversationPriority,
} from "@/lib/types";
import {
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENT_SIZE_LABEL,
  validateAttachmentFile,
  uploadAttachmentReal,
  formatFileSize,
} from "@/lib/attachments";

interface PendingUploadItem {
  id: string;
  file: File;
  previewUrl?: string;
  name: string;
  sizeFormatted: string;
  type: "IMAGE" | "PDF" | "DOC";
  progress: number;
  status: "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
  uploadedAttachment?: ChatAttachment;
  errorMessage?: string;
}

export default function CommunicationHubPage() {
  const {
    conversations,
    orders,
    partners,
    closeuses,
    treasuryManagers,
    currentRole,
    activeCloseuse,
    activeTreasuryManager,
    activePartner: sessionPartner,
    sendConversationMessage,
    assignConversation,
    claimConversation,
    transferConversation,
    takeoverConversation,
    resolveConversation,
    reopenConversation,
    escalateConversation,
    smartAutoAssignConversation,
  } = useOperations();

  const currentUserName = useMemo(() => {
    if (currentRole === "TREASURY_MANAGER") return activeTreasuryManager?.name || "Responsable Trésorerie";
    if (currentRole === "CLOSEUSE") return activeCloseuse?.name || "Opératrice Télévente";
    if (currentRole === "PARTNER") return sessionPartner?.companyName || "E-commerçant";
    return "Jude S. (PDG)";
  }, [currentRole, activeTreasuryManager, activeCloseuse, sessionPartner]);

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || "conv-1");
  const [filterQuick, setFilterQuick] = useState<"ALL" | "UNREAD" | "WAITING" | "URGENT" | "UNANSWERED" | "MY_CONVS">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Composer states
  const [messageInput, setMessageInput] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  // Real Upload Queue States
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadErrorNotification, setUploadErrorNotification] = useState<string | null>(null);

  // Lightbox / Image Viewer State
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    name: string;
    size?: string;
  } | null>(null);

  // Hidden File Inputs & Popover Menu
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement | null>(null);

  // Fermeture automatique du menu au clic extérieur ou touche Échap
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setShowAttachmentMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAttachmentMenu]);

  // Mobile / Tablet view navigation: 'LIST' | 'CHAT' | 'DETAILS'
  const [mobileView, setMobileView] = useState<"LIST" | "CHAT" | "DETAILS">("LIST");

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetAgent, setTransferTargetAgent] = useState<string>("Jude S. (PDG)");
  const [transferTargetRole, setTransferTargetRole] = useState<string>("Direction Générale");
  const [transferReasonInput, setTransferReasonInput] = useState("");

  // Scroll management & auto-scroll to latest message
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  const activePartner = useMemo(() => {
    return partners.find((p) => p.id === activeConversation?.partnerId) || partners[0];
  }, [partners, activeConversation]);

  const partnerOrders = useMemo(() => {
    return orders.filter(
      (o) => o.partnerId === activePartner?.id || o.partnerName === activeConversation?.companyName
    );
  }, [orders, activePartner, activeConversation]);

  // Global KPIs Calculation
  const openCount = useMemo(() => {
    return conversations.filter((c) => c.status !== "RESOLVED").length;
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const urgentCount = useMemo(() => {
    return conversations.filter((c) => c.status === "URGENT" || c.priority === "URGENT" || c.priority === "HIGH").length;
  }, [conversations]);

  const waitingCount = useMemo(() => {
    return conversations.filter((c) => c.status === "WAITING").length;
  }, [conversations]);

  const unansweredCount = useMemo(() => {
    return conversations.filter((c) => (c.unreadCount && c.unreadCount > 0) || c.status === "WAITING").length;
  }, [conversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Quick Filters
      if (filterQuick === "UNREAD" && (!c.unreadCount || c.unreadCount === 0)) return false;
      if (filterQuick === "WAITING" && c.status !== "WAITING") return false;
      if (filterQuick === "URGENT" && c.status !== "URGENT" && c.priority !== "URGENT" && c.priority !== "HIGH") return false;
      if (filterQuick === "UNANSWERED" && (!c.unreadCount || c.unreadCount === 0) && c.status !== "WAITING") return false;
      if (filterQuick === "MY_CONVS" && c.assignedAgentName !== "Jude S. (PDG)" && c.assignedAgentName !== "Jude (PDG)") return false;

      // 2. Dropdown Filters
      if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
      if (filterPriority !== "ALL" && c.priority !== filterPriority) return false;
      if (filterAgent !== "ALL" && c.assignedAgentName !== filterAgent) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.partnerName?.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          (c.relatedOrderNumber && c.relatedOrderNumber.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [conversations, filterQuick, filterStatus, filterPriority, filterAgent, searchQuery]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [activeConvId, scrollToBottom]);

  useEffect(() => {
    if (!showScrollBottomBtn) {
      scrollToBottom("smooth");
    }
  }, [activeConversation?.messages?.length, showScrollBottomBtn, scrollToBottom]);

  // Track scroll position in chat stream
  const handleChatScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottomBtn(isScrolledUp);
  };

  // Process & upload incoming real files
  const processFilesForUpload = useCallback((files: FileList | File[]) => {
    if (!files || files.length === 0 || !activeConversation) return;

    Array.from(files).forEach((file) => {
      const validation = validateAttachmentFile(file);
      if (!validation.isValid) {
        setUploadErrorNotification(validation.error || "Fichier non autorisé.");
        setTimeout(() => setUploadErrorNotification(null), 5000);
        return;
      }

      const tempId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const fileType = isImg ? "IMAGE" : isPdf ? "PDF" : "DOC";

      let previewUrl: string | undefined = undefined;
      if (isImg) {
        previewUrl = URL.createObjectURL(file);
      }

      const uploadItem: PendingUploadItem = {
        id: tempId,
        file,
        previewUrl,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        type: fileType,
        progress: 0,
        status: "UPLOADING",
      };

      setPendingUploads((prev) => [...prev, uploadItem]);

      // Execute Real Upload
      uploadAttachmentReal(
        file,
        activeConversation.id,
        currentUserName,
        (percent) => {
          setPendingUploads((prev) =>
            prev.map((item) => (item.id === tempId ? { ...item, progress: percent } : item))
          );
        },
        currentRole
      )
        .then((uploadedAttachment) => {
          setPendingUploads((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: 100,
                    status: "UPLOADED",
                    uploadedAttachment,
                  }
                : item
            )
          );
        })
        .catch((err) => {
          setPendingUploads((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    status: "FAILED",
                    errorMessage: err.message || "Échec d'envoi",
                  }
                : item
            )
          );
        });
    });
  }, [activeConversation, currentUserName, currentRole]);

  // Retry failed upload
  const handleRetryUpload = (item: PendingUploadItem) => {
    if (!activeConversation) return;
    setPendingUploads((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "UPLOADING", progress: 0, errorMessage: undefined } : i))
    );

    uploadAttachmentReal(
      item.file,
      activeConversation.id,
      currentUserName,
      (percent) => {
        setPendingUploads((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
        );
      },
      currentRole
    )
      .then((uploadedAttachment) => {
        setPendingUploads((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  progress: 100,
                  status: "UPLOADED",
                  uploadedAttachment,
                }
              : i
          )
        );
      })
      .catch((err) => {
        setPendingUploads((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "FAILED",
                  errorMessage: err.message || "Échec d'envoi",
                }
              : i
          )
        );
      });
  };

  // Remove pending file before send
  const handleRemovePendingUpload = (id: string) => {
    setPendingUploads((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesForUpload(e.dataTransfer.files);
    }
  };

  // Clipboard Paste handler (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      processFilesForUpload(e.clipboardData.files);
    }
  };

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;

    const readyAttachments: ChatAttachment[] = pendingUploads
      .filter((u) => u.status === "UPLOADED" && u.uploadedAttachment)
      .map((u) => u.uploadedAttachment!);

    const isUploadingAny = pendingUploads.some((u) => u.status === "UPLOADING");
    if (isUploadingAny) {
      setUploadErrorNotification("Veuillez patienter que tous les fichiers terminent leur chargement.");
      setTimeout(() => setUploadErrorNotification(null), 4000);
      return;
    }

    if (!messageInput.trim() && readyAttachments.length === 0) return;

    sendConversationMessage(
      activeConversation.id,
      messageInput.trim(),
      isInternalNote,
      readyAttachments.length > 0 ? readyAttachments : undefined
    );

    setMessageInput("");
    setPendingUploads([]);
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  // Handle transfer
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

  // Helper status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "URGENT":
      case "ESCALATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Escaladée</span>
          </span>
        );
      case "WAITING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <span>En attente</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <span>En cours</span>
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 shrink-0">
            <span>Résolue</span>
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <span>Ouverte</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full gap-2 sm:gap-2.5 font-sans overflow-hidden">
      {/* Hidden Real File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files) processFilesForUpload(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={(e) => {
          if (e.target.files) processFilesForUpload(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* 1. TOP ULTRA-COMPACT EXECUTIVE SUMMARY BAR (Shrink-0) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-slate-900 text-white shrink-0 shadow-2xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span>Conversations &amp; Support Marchands</span>
              <span className="hidden md:inline-block px-2 py-0.2 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Live CRM
              </span>
            </h1>
          </div>
        </div>

        {/* 6 High-Density KPI Badges in a clean horizontal strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-center">
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Ouvertes</span>
            <span className="text-xs font-black text-slate-900">{openCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200/70 shrink-0">
            <span className="text-[9px] font-bold text-blue-600 uppercase mr-1">Non lues</span>
            <span className="text-xs font-black text-blue-700">{unreadCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200/70 shrink-0">
            <span className="text-[9px] font-bold text-rose-600 uppercase mr-1">Urgentes</span>
            <span className="text-xs font-black text-rose-700">{urgentCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/70 shrink-0">
            <span className="text-[9px] font-bold text-amber-600 uppercase mr-1">En attente</span>
            <span className="text-xs font-black text-amber-700">{waitingCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200/70 shrink-0">
            <span className="text-[9px] font-bold text-purple-600 uppercase mr-1">Sans réponse</span>
            <span className="text-xs font-black text-purple-700">{unansweredCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/70 shrink-0">
            <span className="text-[9px] font-bold text-emerald-600 uppercase mr-1">Délai moy.</span>
            <span className="text-xs font-black text-emerald-700">8 min</span>
          </div>
        </div>
      </div>

      {/* Responsive View Switcher (Visible on < xl screens) */}
      <div className="xl:hidden flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <button
          onClick={() => setMobileView("LIST")}
          className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
            mobileView === "LIST" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Conversations ({filteredConversations.length})
        </button>
        <button
          onClick={() => setMobileView("CHAT")}
          className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
            mobileView === "CHAT" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {activeConversation ? activeConversation.companyName : "Fil Actif"}
        </button>
        <button
          onClick={() => setMobileView("DETAILS")}
          className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
            mobileView === "DETAILS" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Fiche Marchand
        </button>
      </div>

      {/* 2. MAIN 3-PANEL VIEWPORT-FITTED WORKSPACE */}
      <div className="flex-1 min-h-0 flex flex-col xl:grid xl:grid-cols-12 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* ======================================================== */}
        {/* 1. LEFT PANEL: CONVERSATIONS LIST (3 Columns on XL)       */}
        {/* ======================================================== */}
        <div
          className={`xl:col-span-3 border-r border-slate-200/80 flex flex-col min-h-0 h-full bg-white ${
            mobileView !== "LIST" ? "hidden xl:flex" : "flex flex-1"
          }`}
        >
          {/* Search Box & Filters Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher boutique, contact, #CMD..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "ALL", label: "Toutes" },
                { id: "UNREAD", label: "Non lues" },
                { id: "WAITING", label: "À traiter" },
                { id: "URGENT", label: "🔥 Urgentes" },
                { id: "MY_CONVS", label: "Mes fils" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterQuick(pill.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    filterQuick === pill.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">Tous statuts</option>
                <option value="OPEN">🟢 Ouverte</option>
                <option value="WAITING">🟡 En attente</option>
                <option value="IN_PROGRESS">🔵 En cours</option>
                <option value="ESCALATED">🔴 Escaladée</option>
                <option value="RESOLVED">⚫ Résolue</option>
              </select>

              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">Tous les agents</option>
                <option value="Jude S. (PDG)">Jude S. (PDG)</option>
                {closeuses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} (Closeuse)
                  </option>
                ))}
                {treasuryManagers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} (Trésorier)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation Items Feed (Scrollable internally) */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.map((c) => {
              const isSelected = c.id === activeConversation?.id;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    setMobileView("CHAT");
                  }}
                  className={`w-full p-3 text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-50/90 border-l-4 border-l-slate-900 shadow-2xs"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Avatar with unread indicator */}
                  <div className="relative w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {c.companyName?.charAt(0) || "M"}
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{c.companyName}</h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {c.lastMessageAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mb-1 font-normal">
                      {c.lastMessage}
                    </p>

                    <div className="flex flex-wrap items-center gap-1">
                      {getStatusBadge(c.status)}

                      {c.assignedAgentName && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-semibold truncate max-w-[105px] flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{c.assignedAgentName}</span>
                        </span>
                      )}

                      {c.relatedOrderNumber && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-mono font-bold shrink-0">
                          {c.relatedOrderNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">Aucune conversation trouvée</p>
                <p className="text-[11px]">Modifiez vos filtres ou effectuez une autre recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. MIDDLE PANEL: CHAT THREAD (6 Columns on XL)            */}
        {/* ======================================================== */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`xl:col-span-6 flex flex-col min-h-0 h-full bg-slate-50/40 border-r border-slate-200/80 relative ${
            mobileView !== "CHAT" ? "hidden xl:flex" : "flex flex-1"
          }`}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white animate-fade-in border-4 border-dashed border-white/50">
              <Upload className="w-12 h-12 text-white animate-bounce mb-3" />
              <h3 className="text-base font-black">Déposer les fichiers ici</h3>
              <p className="text-xs text-slate-300 mt-1">Photos, PDF, Word, Excel jusqu&apos;à 20 MB</p>
            </div>
          )}

          {/* Toast Notification for errors */}
          {uploadErrorNotification && (
            <div className="absolute top-16 left-4 right-4 z-40 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadErrorNotification}</span>
              </div>
              <button onClick={() => setUploadErrorNotification(null)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeConversation ? (
            <>
              {/* Thread Top Header: 2-Tier Layout ensuring ZERO overlap */}
              <div className="p-3 sm:p-3.5 border-b border-slate-200/80 bg-white shrink-0 space-y-2">
                {/* Tier 1: Merchant Profile Info & Full Title */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => setMobileView("LIST")}
                      className="xl:hidden p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer"
                      title="Retour à la liste"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {activeConversation.companyName?.charAt(0) || "M"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {activeConversation.companyName}
                        </h3>
                        {getStatusBadge(activeConversation.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {activeConversation.partnerName} • <span className="text-slate-400 font-mono">{activeConversation.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Assigned agent indicator */}
                  {activeConversation.assignedAgentName && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{activeConversation.assignedAgentName}</span>
                    </div>
                  )}
                </div>

                {/* Tier 2: Dedicated Quick Actions Toolbar */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 overflow-x-auto no-scrollbar shrink-0">
                  {(!activeConversation.assignedAgentName || activeConversation.status === "WAITING") && (
                    <button
                      onClick={() =>
                        claimConversation(
                          activeConversation.id,
                          currentUserName,
                          currentRole === "CLOSEUSE"
                            ? "Closeuse & Support"
                            : currentRole === "TREASURY_MANAGER"
                            ? "Trésorerie"
                            : "Direction Générale"
                        )
                      }
                      className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm animate-pulse"
                      title="Valider la gérance et prendre en main ce marchand avec message d'accueil automatique"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Valider la Gérance</span>
                    </button>
                  )}

                  <button
                    onClick={() => takeoverConversation(activeConversation.id)}
                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                    title="Prendre en charge immédiatement cette conversation"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Prendre (PDG)</span>
                  </button>

                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Transférer à une closeuse ou au trésorier"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Transférer</span>
                  </button>

                  {activeConversation.status === "RESOLVED" ? (
                    <button
                      onClick={() => reopenConversation(activeConversation.id)}
                      className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-200 shrink-0"
                      title="Réouvrir la conversation"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Réouvrir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => resolveConversation(activeConversation.id, currentUserName)}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Clôturer et marquer comme résolue"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Résoudre</span>
                    </button>
                  )}

                  {/* Toggle Details on Tablet / Mobile */}
                  <button
                    onClick={() => setMobileView("DETAILS")}
                    className="xl:hidden px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-200 shrink-0"
                    title="Voir la fiche marchand et commandes liées"
                  >
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Fiche Marchand</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Stream (Internal Scroll ONLY) */}
              <div
                ref={messageContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto space-y-3 relative"
              >
                {activeConversation.messages.map((m) => {
                  const isPartner = m.sender === "PARTNER";
                  const isBot = m.sender === "BOT";
                  const isTreasury = m.sender === "TREASURY";
                  const isInternal = m.isInternalNote;

                  // Resolve attachments (array or legacy format)
                  const messageAttachments: ChatAttachment[] = m.attachments || (
                    m.attachmentName
                      ? [
                          {
                            id: `att_legacy_${m.id}`,
                            fileName: m.attachmentName,
                            mimeType: m.attachmentType === "PDF" ? "application/pdf" : m.attachmentType === "IMAGE" ? "image/jpeg" : "application/octet-stream",
                            fileSize: m.attachmentSize || "Fichier",
                            fileSizeBytes: 0,
                            url: m.attachmentUrl || "",
                            type: m.attachmentType || "DOC",
                            createdAt: m.sentAt,
                            status: "UPLOADED",
                          },
                        ]
                      : []
                  );

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isInternal
                          ? "items-center my-2"
                          : isPartner
                          ? "items-start"
                          : isBot
                          ? "items-center my-1"
                          : "items-end"
                      }`}
                    >
                      {!isInternal && !isBot && (
                        <span className="text-[10px] text-slate-400 mb-1 px-1 font-medium">
                          {m.senderName} • {m.sentAt}
                        </span>
                      )}

                      <div
                        className={`p-3 rounded-2xl max-w-[88%] sm:max-w-[80%] text-xs leading-relaxed ${
                          isInternal
                            ? "w-full bg-amber-50/95 border-2 border-amber-300 text-amber-950 font-medium shadow-xs"
                            : isPartner
                            ? "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs"
                            : isBot
                            ? "bg-slate-100 text-slate-600 rounded-xl text-center py-2 px-4 max-w-sm text-[11px]"
                            : isTreasury
                            ? "bg-emerald-900 text-emerald-50 rounded-br-xs shadow-xs"
                            : "bg-slate-900 text-white rounded-br-xs shadow-xs"
                        }`}
                      >
                        {isInternal && (
                          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 mb-2 gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                              <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>NOTE INTERNE (Confidentiel)</span>
                            </div>
                            <span className="text-[10px] text-amber-700 font-bold shrink-0">{m.sentAt}</span>
                          </div>
                        )}

                        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}

                        {/* Real Multi-Attachments Rendering */}
                        {messageAttachments.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {/* 1. Photos Grid (Taille compacte) */}
                            {messageAttachments.filter((a) => a.type === "IMAGE").length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {messageAttachments
                                  .filter((a) => a.type === "IMAGE")
                                  .map((img) => (
                                    <button
                                      key={img.id}
                                      type="button"
                                      onClick={() =>
                                        setLightboxImage({
                                          url: img.url,
                                          name: img.fileName,
                                          size: img.fileSize,
                                        })
                                      }
                                      className="group relative rounded-xl overflow-hidden border border-slate-200/60 bg-black/10 w-28 h-24 sm:w-36 sm:h-28 shrink-0 flex items-center justify-center cursor-pointer hover:opacity-95 transition-all shadow-2xs"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url || "/images/placeholder_doc.png"}
                                        alt={img.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[10px] font-bold">
                                        <Maximize2 className="w-3 h-3" />
                                        <span>Agrandir</span>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}

                            {/* 2. Documents List (PDF, DOC, XLS, CSV) */}
                            {messageAttachments
                              .filter((a) => a.type !== "IMAGE")
                              .map((doc) => (
                                <div
                                  key={doc.id}
                                  className={`p-2 rounded-xl flex items-center gap-2.5 ${
                                    isPartner || isInternal
                                      ? "bg-slate-100/90 text-slate-800 border border-slate-200"
                                      : "bg-white/10 text-white border border-white/20"
                                  }`}
                                >
                                  {doc.type === "PDF" ? (
                                    <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                                  ) : (
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[11px] truncate">{doc.fileName}</p>
                                    <p className="text-[9px] opacity-70 font-mono">{doc.fileSize}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Ouvrir le fichier dans un nouvel onglet"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Ouvrir</span>
                                    </a>
                                    <a
                                      href={doc.url}
                                      download={doc.fileName}
                                      className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-[10px] font-bold inline-flex items-center cursor-pointer transition-colors"
                                      title="Télécharger"
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Anchor for auto-scroll */}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Floating "Scroll to Bottom / Nouveau message" Indicator */}
              {showScrollBottomBtn && (
                <button
                  onClick={() => scrollToBottom("smooth")}
                  className="absolute bottom-20 right-6 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer z-10 animate-bounce"
                >
                  <span>Derniers messages</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Message Composer Footer (ALWAYS FIXED AT THE BOTTOM OF VIEWPORT) */}
              <form
                onSubmit={handleSendMessage}
                onPaste={handlePaste}
                className={`p-2.5 sm:p-3 bg-white border-t space-y-1.5 shrink-0 transition-colors ${
                  isInternalNote ? "border-amber-300 bg-amber-50/30" : "border-slate-200/80"
                }`}
              >
                {/* Switcher Mode: Réponse vs Note Interne */}
                <div className="flex items-center justify-between text-xs px-0.5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        !isInternalNote
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      💬 Réponse Marchand
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                        isInternalNote
                          ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                          : "text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>Note Interne</span>
                    </button>
                  </div>
                </div>

                {/* Pre-Send Real Multi-Attachment Preview Tray */}
                {pendingUploads.length > 0 && (
                  <div className="max-h-36 overflow-y-auto p-1.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    {pendingUploads.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {item.type === "IMAGE" && item.previewUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-7 h-7 rounded-md object-cover shrink-0 border"
                            />
                          ) : item.type === "PDF" ? (
                            <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 gap-2">
                              <span className="truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {item.sizeFormatted}
                              </span>
                            </div>

                            {/* Real progress or status */}
                            {item.status === "UPLOADING" && (
                              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 transition-all duration-200"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            )}

                            {item.status === "FAILED" && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-rose-600 font-bold">
                                  {item.errorMessage || "Échec d'envoi"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRetryUpload(item)}
                                  className="text-[10px] text-blue-600 font-bold underline cursor-pointer inline-flex items-center gap-0.5"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Réessayer</span>
                                </button>
                              </div>
                            )}

                            {item.status === "UPLOADED" && (
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Prêt à l&apos;envoi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePendingUpload(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                          title="Supprimer cette pièce jointe"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input row with unified ➕ Ajouter button */}
                <div className="flex items-center gap-2">
                  {/* Bouton Unique d'Ajout + Popover Menu */}
                  <div className="relative" ref={attachmentMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu((prev) => !prev)}
                      className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 shadow-2xs ${
                        showAttachmentMenu
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300"
                      }`}
                      title="Ajouter une photo ou un fichier"
                      aria-expanded={showAttachmentMenu}
                      aria-haspopup="true"
                    >
                      <Plus className={`w-4 h-4 transition-transform duration-150 ${showAttachmentMenu ? "rotate-45" : ""}`} />
                      <span className="hidden sm:inline">Ajouter</span>
                    </button>

                    {/* Popover Menu Photo & Fichier */}
                    {showAttachmentMenu && (
                      <div
                        className="absolute left-0 bottom-full mb-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                        role="menu"
                      >
                        <div className="space-y-0.5">
                          {/* Option 1: Photo */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachmentMenu(false);
                              photoInputRef.current?.click();
                            }}
                            className="w-full p-2 text-left rounded-lg hover:bg-slate-50 flex items-center gap-2.5 text-xs transition-colors cursor-pointer group"
                            role="menuitem"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900">Photo</p>
                              <p className="text-[10px] text-slate-400 truncate">JPG, PNG, WEBP, GIF</p>
                            </div>
                          </button>

                          {/* Option 2: Fichier */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachmentMenu(false);
                              fileInputRef.current?.click();
                            }}
                            className="w-full p-2 text-left rounded-lg hover:bg-slate-50 flex items-center gap-2.5 text-xs transition-colors cursor-pointer group"
                            role="menuitem"
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 flex items-center justify-center shrink-0">
                              <Paperclip className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900">Fichier</p>
                              <p className="text-[10px] text-slate-400 truncate">PDF, Word, Excel, CSV</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bouton direct Photo */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 hover:border-blue-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 shadow-2xs"
                    title="Envoyer une photo / capture d'écran"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? "Rédiger une note confidentielle invisible pour le marchand..."
                        : `Écrire à ${activeConversation.companyName}... (Entrée pour envoyer)`
                    }
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all min-w-0 ${
                      isInternalNote
                        ? "bg-amber-50/50 border-amber-300 text-amber-950 placeholder:text-amber-500 focus:ring-2 focus:ring-amber-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() && pendingUploads.length === 0}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>Envoyer</span>
                    <Send className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
              Sélectionnez une conversation pour afficher le fil.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. RIGHT PANEL: CONTEXTUAL CRM & LINKED RESOURCES (3 Cols)*/}
        {/* ======================================================== */}
        <div
          className={`xl:col-span-3 flex flex-col min-h-0 h-full bg-white ${
            mobileView !== "DETAILS" ? "hidden xl:flex" : "flex flex-1"
          }`}
        >
          {/* Header on mobile view */}
          <div className="xl:hidden flex items-center justify-between p-3 border-b border-slate-100 shrink-0">
            <button
              onClick={() => setMobileView("CHAT")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la conversation</span>
            </button>
          </div>

          {activeConversation && activePartner ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4">
              {/* 1. FICHE E-COMMERÇANT */}
              <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                    Fiche E-commerçant
                  </span>
                  <Link
                    href={`/admin/partenaires/${activePartner.id}`}
                    className="text-[11px] font-bold text-slate-900 hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Voir profil</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                    {activeConversation.companyName?.charAt(0) || "M"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {activeConversation.companyName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{activeConversation.partnerName}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      Partenaire Actif
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-0.5">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{activeConversation.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activePartner.city || "Conakry"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Solde dispo : <strong className="text-slate-900">{formatCFA(activePartner.availableBalance || 520000)}</strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* 2. COMMANDES LIÉES */}
              <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Package className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Commandes Liées ({partnerOrders.length})</span>
                  </span>
                  <Link href="/admin/commandes" className="text-[10px] font-bold text-slate-900 hover:underline shrink-0">
                    Tout voir
                  </Link>
                </div>

                <div className="space-y-1.5">
                  {partnerOrders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                        <Link href={`/admin/commandes/${ord.id}`} className="hover:text-blue-600 underline">
                          {ord.orderNumber}
                        </Link>
                        <span className="text-emerald-600">{formatCFA(ord.totalPrice)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{ord.clientName}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="truncate">Livreur : {ord.assignedLivreurName || "Non affecté"}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold uppercase shrink-0">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {partnerOrders.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">Aucune commande récente liée.</p>
                  )}
                </div>
              </div>

              {/* 3. ASSIGNATION & GESTION DES CAPACITÉS */}
              <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Headset className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Pôle Opérateurs &amp; Charge</span>
                  </span>
                  <button
                    onClick={() => smartAutoAssignConversation(activeConversation.id)}
                    className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    title="Attribuer automatiquement à la closeuse la plus disponible"
                  >
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>Smart Assign</span>
                  </button>
                </div>

                <div className="space-y-1">
                  {/* PDG option */}
                  <button
                    onClick={() => assignConversation(activeConversation.id, "Jude S. (PDG)", "Direction Générale")}
                    className={`w-full p-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      activeConversation.assignedAgentName === "Jude S. (PDG)" ||
                      activeConversation.assignedAgentName === "Jude (PDG)"
                        ? "bg-slate-900 text-white font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Jude S. (PDG)</span>
                    </div>
                    <span className="text-[10px] opacity-80 shrink-0">Direction</span>
                  </button>

                  {/* Closeuses list with capacities */}
                  {closeuses.map((cls) => {
                    const isAssigned = activeConversation.assignedAgentName === cls.name;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => assignConversation(activeConversation.id, cls.name, "Closeuse")}
                        className={`w-full p-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isAssigned
                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-300"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Headset className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cls.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {cls.activeConversationsCount || 3} / {cls.maxActiveConversations || 5} fils
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. HISTORIQUE DU PARCOURS / AUDIT */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock4 className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Historique des Assignations</span>
                </span>

                <div className="space-y-2 pl-2 border-l border-slate-200 text-xs">
                  {activeConversation.assignmentHistory && activeConversation.assignmentHistory.length > 0 ? (
                    activeConversation.assignmentHistory.map((hist) => (
                      <div key={hist.id} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{hist.timestamp}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-[11px]">
                          {hist.assignedToName} ({hist.assignedToRole})
                        </p>
                        {hist.reason && (
                          <p className="text-[10px] text-slate-500 italic">&quot;{hist.reason}&quot;</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[11px] italic">Aucun transfert d&apos;agent pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. FULL-SCREEN IMAGE LIGHTBOX / VISIONNEUSE              */}
      {/* ======================================================== */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in"
        >
          {/* Lightbox Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between text-white pb-3 border-b border-white/10"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold truncate">{lightboxImage.name}</h4>
              <p className="text-xs text-slate-400 font-mono">{lightboxImage.size || "Image HD"}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lightboxImage.url}
                download={lightboxImage.name}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center p-4 max-w-5xl max-h-[80vh] w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Lightbox Footer */}
          <p className="text-xs text-slate-400 pb-2">
            Cliquez en dehors de l&apos;image ou sur la croix pour fermer
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL DE TRANSFERT D'AGENT AVEC JUSTIFICATION        */}
      {/* ======================================================== */}
      {showTransferModal && activeConversation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-slate-900 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Transférer la Conversation</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              {/* Agent selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Sélectionner le nouvel agent</label>
                <select
                  value={transferTargetAgent}
                  onChange={(e) => {
                    const name = e.target.value;
                    setTransferTargetAgent(name);
                    if (name.includes("PDG")) setTransferTargetRole("Direction Générale");
                    else if (name.includes("AGOSSOU") || name.includes("MENSAH")) setTransferTargetRole("Responsable Trésorerie");
                    else setTransferTargetRole("Closeuse Senior");
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white cursor-pointer"
                >
                  <option value="Jude S. (PDG)">Jude S. (Direction Générale)</option>
                  {closeuses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} (Pôle Télévente / Closeuse)
                    </option>
                  ))}
                  {treasuryManagers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (Pôle Trésorerie / Finance)
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Motif obligatoire du transfert *</label>
                <input
                  type="text"
                  required
                  value={transferReasonInput}
                  onChange={(e) => setTransferReasonInput(e.target.value)}
                  placeholder="Ex: Question complexe de paiement / Demande d'arbitrage PDG..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Confirmer le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
