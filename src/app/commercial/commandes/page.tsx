"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Phone,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Plus,
  Truck,
  MapPin,
  Calendar,
  CalendarClock,
  User,
  Store,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Upload,
  ArrowUpDown,
  X,
  XCircle,
  PhoneOff,
  Copy,
  Check,
  Eye,
  FileText,
  BadgeAlert,
  Bike,
  ShieldCheck,
  RefreshCw,
  Flame,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { Order, OrderStatus } from "@/lib/types";

// Formatage GNF
function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Badge de source d'origine
function getSourceBadge(source: string) {
  switch (source) {
    case "Shopify":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Shopify
        </span>
      );
    case "YouCan":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          YouCan
        </span>
      );
    case "Import IA":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
          Import IA
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          ENO
        </span>
      );
  }
}

// Badge de priorité
function getPriorityBadge(priority: string) {
  switch (priority) {
    case "URGENT":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
          <Flame className="w-2.5 h-2.5 text-rose-600" />
          Urgent
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
          Important
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
          Normal
        </span>
      );
  }
}

// Badge de Statut standardisé ENO
function getStatusBadge(status: OrderStatus, hasDriver: boolean) {
  switch (status) {
    case "EN_ATTENTE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
          <PhoneCall className="w-2.5 h-2.5" />
          À appeler
        </span>
      );
    case "A_RAPPELER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold border border-orange-200">
          <RefreshCw className="w-2.5 h-2.5" />
          À relancer
        </span>
      );
    case "CONFIRMEE":
      return hasDriver ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Confirmée
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
          <Truck className="w-2.5 h-2.5" />
          À affecter
        </span>
      );
    case "EN_COURS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
          <Truck className="w-2.5 h-2.5" />
          En livraison
        </span>
      );
    case "LIVREE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <ShieldCheck className="w-2.5 h-2.5" />
          Livrée
        </span>
      );
    case "ANNULEE":
    case "REFUSEE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          <XCircle className="w-2.5 h-2.5" />
          Annulée
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
          {status}
        </span>
      );
  }
}

// Détection de source fiable
function resolveOrderSource(o: Order): "Shopify" | "YouCan" | "Import IA" | "ENO" {
  if (o.source === "Shopify" || o.source === "YouCan" || o.source === "Import IA" || o.source === "ENO") {
    return o.source;
  }
  const num = (o.orderNumber || "").toUpperCase();
  const cmt = (o.comment || "").toLowerCase();
  if (num.startsWith("SH-") || num.includes("SHOPIFY") || cmt.includes("shopify")) return "Shopify";
  if (num.startsWith("YC-") || num.includes("YOUCAN") || cmt.includes("youcan")) return "YouCan";
  if (num.startsWith("CMD-IA") || cmt.includes("import ia") || cmt.includes("whatsapp")) return "Import IA";
  return "ENO";
}

// Détection de priorité fiable
function resolveOrderPriority(o: Order): "URGENT" | "HIGH" | "NORMAL" {
  if (o.priority === "URGENT" || o.priority === "HIGH" || o.priority === "NORMAL") {
    return o.priority;
  }
  if (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") return "URGENT";
  if (o.status === "CONFIRMEE" && !o.assignedLivreurId) return "HIGH";
  return "NORMAL";
}

export default function CommercialCommandesPage() {
  const router = useRouter();
  const {
    orders,
    partners,
    livreurs,
    activeCloseuse,
    createOrder,
    updateOrderStatus,
    logClosingCall,
    assignOrderToLivreur,
  } = useOperations();

  // États de recherche & filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<"PRIORITY" | "NEWEST" | "OLDEST" | "AMOUNT_HIGH" | "AMOUNT_LOW">("PRIORITY");

  // Filtres avancés
  const [filterPartner, setFilterPartner] = useState<string>("ALL");
  const [filterCity, setFilterCity] = useState<string>("ALL");
  const [filterLivreur, setFilterLivreur] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<"ALL" | "TODAY" | "YESTERDAY" | "7D" | "30D">("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  // Tiroirs et modales
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [orderForAssign, setOrderForAssign] = useState<Order | null>(null);
  const [orderForCall, setOrderForCall] = useState<Order | null>(null);
  const [orderForCancel, setOrderForCancel] = useState<Order | null>(null);
  const [orderForConfirm, setOrderForConfirm] = useState<Order | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // État de sélection multiple (Bulk)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Feedback copie
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Formulaire d'appel
  const [callResult, setCallResult] = useState<
    "CONTACT_ESTABLISHED" | "NO_ANSWER" | "WRONG_NUMBER" | "CALLBACK_REQUESTED" | "CLIENT_REFUSED"
  >("CONTACT_ESTABLISHED");
  const [callNote, setCallNote] = useState("");
  const [callDeliverySlot, setCallDeliverySlot] = useState("");

  // Formulaire d'annulation
  const [cancelReason, setCancelReason] = useState("Client refuse la commande / Changement d'avis");
  const [cancelDetails, setCancelDetails] = useState("");

  // Formulaire d'affectation
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [reassignJustification, setReassignJustification] = useState("");

  // Formulaire Confirmation avec affectation directe facultative
  const [confirmDriverId, setConfirmDriverId] = useState<string>("");
  const [confirmNote, setConfirmNote] = useState("");

  // Formulaire Import IA & Détection doublons
  const [rawImportText, setRawImportText] = useState("");
  const [parsedImportData, setParsedImportData] = useState<{
    clientName: string;
    clientPhone: string;
    city: string;
    address: string;
    products: string;
    quantity: number;
    price: number;
    partnerId: string;
  } | null>(null);
  const [detectedDuplicate, setDetectedDuplicate] = useState<Order | null>(null);

  // Formulaire Nouvelle Commande
  const [manualClient, setManualClient] = useState("");
  const [manualPhone, setManualPhone] = useState("+229 ");
  const [manualCity, setManualCity] = useState("Conakry");
  const [manualAddress, setManualAddress] = useState("");
  const [manualProduct, setManualProduct] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualPrice, setManualPrice] = useState(15000);
  const [manualPartnerId, setManualPartnerId] = useState(partners[0]?.id || "p1");

  // -------------------------------------------------------------
  // CALCULS DES KPIS DYNAMIQUES & RIGOUROUX
  // -------------------------------------------------------------
  const kpiTotal = orders.length;
  const kpiToCall = useMemo(() => orders.filter((o) => o.status === "EN_ATTENTE").length, [orders]);
  const kpiToRelance = useMemo(() => orders.filter((o) => o.status === "A_RAPPELER").length, [orders]);
  const kpiToConfirm = useMemo(
    () => orders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER").length,
    [orders]
  );
  const kpiConfirmed = useMemo(() => orders.filter((o) => o.status === "CONFIRMEE").length, [orders]);
  const kpiToAssign = useMemo(
    () => orders.filter((o) => o.status === "CONFIRMEE" && !o.assignedLivreurId).length,
    [orders]
  );

  // -------------------------------------------------------------
  // ONGLETS DE VUES RAPIDES
  // -------------------------------------------------------------
  const tabs = [
    { id: "ALL", label: "Toutes", count: kpiTotal },
    { id: "EN_ATTENTE", label: "À appeler", count: kpiToCall, badgeCls: "bg-amber-100 text-amber-800" },
    { id: "A_RAPPELER", label: "À relancer", count: kpiToRelance, badgeCls: "bg-orange-100 text-orange-800" },
    { id: "TO_CONFIRM", label: "À confirmer", count: kpiToConfirm },
    { id: "CONFIRMEE", label: "Confirmées", count: kpiConfirmed },
    { id: "TO_ASSIGN", label: "À affecter", count: kpiToAssign, badgeCls: "bg-rose-100 text-rose-800" },
    { id: "EN_COURS", label: "En livraison", count: orders.filter((o) => o.status === "EN_COURS").length },
    { id: "LIVREE", label: "Livrées", count: orders.filter((o) => o.status === "LIVREE").length },
    {
      id: "ANNULEE",
      label: "Annulées",
      count: orders.filter((o) => o.status === "ANNULEE" || o.status === "REFUSEE").length,
    },
  ];

  // -------------------------------------------------------------
  // LISTES DE RÉFÉRENCE NORMALISÉES
  // -------------------------------------------------------------
  const availablePartners = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => {
      if (p.companyName) map.set(p.id, p.companyName);
    });
    orders.forEach((o) => {
      if (o.partnerName && !map.has(o.partnerId)) {
        map.set(o.partnerId || o.partnerName, o.partnerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [partners, orders]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.city) set.add(o.city.trim());
    });
    return Array.from(set).sort();
  }, [orders]);

  // Nombre de filtres avancés actifs (hors onglet et recherche)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterPartner !== "ALL") count++;
    if (filterCity !== "ALL") count++;
    if (filterLivreur !== "ALL") count++;
    if (filterSource !== "ALL") count++;
    if (filterDate !== "ALL") count++;
    if (filterPriority !== "ALL") count++;
    return count;
  }, [filterPartner, filterCity, filterLivreur, filterSource, filterDate, filterPriority]);

  // -------------------------------------------------------------
  // MOTEUR DE FILTRAGE COMBINATOIRE & RECHERCHE TOLÉRANTE
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    return orders
      .filter((o) => {
        // 1. Filtre par Onglet / Statut opérationnel
        if (activeTab === "EN_ATTENTE" && o.status !== "EN_ATTENTE") return false;
        if (activeTab === "A_RAPPELER" && o.status !== "A_RAPPELER") return false;
        if (activeTab === "TO_CONFIRM" && o.status !== "EN_ATTENTE" && o.status !== "A_RAPPELER") return false;
        if (activeTab === "CONFIRMEE" && o.status !== "CONFIRMEE") return false;
        if (activeTab === "TO_ASSIGN" && !(o.status === "CONFIRMEE" && !o.assignedLivreurId)) return false;
        if (activeTab === "EN_COURS" && o.status !== "EN_COURS") return false;
        if (activeTab === "LIVREE" && o.status !== "LIVREE") return false;
        if (activeTab === "ANNULEE" && o.status !== "ANNULEE" && o.status !== "REFUSEE") return false;

        // 2. Recherche tolérante multi-champs
        if (searchTerm.trim()) {
          const cleanTerm = searchTerm.toLowerCase().replace(/[-_#+\\s]/g, "");
          const cleanPhone = (o.clientPhone || "").replace(/[-_+\\s]/g, "");
          const cleanNumber = (o.orderNumber || "").toLowerCase().replace(/[-_#\\s]/g, "");
          const cleanName = (o.clientName || "").toLowerCase();
          const cleanProduct = (o.products || "").toLowerCase();
          const cleanPartner = (o.partnerName || "").toLowerCase();
          const cleanCity = (o.city || "").toLowerCase();
          const cleanAddress = (o.address || "").toLowerCase();
          const cleanDriver = (o.assignedLivreurName || "").toLowerCase();

          const rawTerm = searchTerm.toLowerCase().trim();

          const match =
            cleanNumber.includes(cleanTerm) ||
            cleanPhone.includes(cleanTerm) ||
            cleanName.includes(rawTerm) ||
            cleanProduct.includes(rawTerm) ||
            cleanPartner.includes(rawTerm) ||
            cleanCity.includes(rawTerm) ||
            cleanAddress.includes(rawTerm) ||
            cleanDriver.includes(rawTerm);

          if (!match) return false;
        }

        // 3. Filtre Marchand
        if (filterPartner !== "ALL") {
          const partnerObj = availablePartners.find((p) => p.id === filterPartner);
          const matchPartner =
            o.partnerId === filterPartner ||
            o.partnerName === filterPartner ||
            (partnerObj && o.partnerName === partnerObj.name);
          if (!matchPartner) return false;
        }

        // 4. Filtre Ville / Zone
        if (filterCity !== "ALL" && o.city.trim().toLowerCase() !== filterCity.trim().toLowerCase()) {
          return false;
        }

        // 5. Filtre Livreur
        if (filterLivreur !== "ALL") {
          if (filterLivreur === "NONE" && o.assignedLivreurId) return false;
          if (filterLivreur !== "NONE" && o.assignedLivreurId !== filterLivreur) return false;
        }

        // 6. Filtre Source
        if (filterSource !== "ALL") {
          const resolved = resolveOrderSource(o);
          if (filterSource === "SHOPIFY" && resolved !== "Shopify") return false;
          if (filterSource === "YOUCAN" && resolved !== "YouCan") return false;
          if (filterSource === "IA" && resolved !== "Import IA") return false;
          if (filterSource === "ENO" && resolved !== "ENO") return false;
        }

        // 7. Filtre Date
        if (filterDate !== "ALL") {
          const dStr = (o.createdAt || o.updatedAt || "").slice(0, 10);
          if (filterDate === "TODAY") {
            if (dStr !== todayStr && dStr !== "2026-09-06") return false;
          } else if (filterDate === "YESTERDAY") {
            if (dStr !== yesterdayStr && dStr !== "2026-09-05") return false;
          } else if (filterDate === "7D") {
            const orderTimestamp = new Date(dStr || now).getTime();
            const diffDays = (now.getTime() - orderTimestamp) / (1000 * 60 * 60 * 24);
            if (diffDays > 7.5 || diffDays < -0.5) return false;
          } else if (filterDate === "30D") {
            const orderTimestamp = new Date(dStr || now).getTime();
            const diffDays = (now.getTime() - orderTimestamp) / (1000 * 60 * 60 * 24);
            if (diffDays > 30.5 || diffDays < -0.5) return false;
          }
        }

        // 8. Filtre Priorité
        if (filterPriority !== "ALL") {
          const p = resolveOrderPriority(o);
          if (filterPriority !== p) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PRIORITY") {
          const pRank: Record<string, number> = { URGENT: 1, HIGH: 2, NORMAL: 3 };
          const pA = pRank[resolveOrderPriority(a)] || 3;
          const pB = pRank[resolveOrderPriority(b)] || 3;
          if (pA !== pB) return pA - pB;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "NEWEST") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "AMOUNT_HIGH") {
          return b.totalPrice - a.totalPrice;
        }
        if (sortBy === "AMOUNT_LOW") {
          return a.totalPrice - b.totalPrice;
        }
        return 0;
      });
  }, [
    orders,
    activeTab,
    searchTerm,
    filterPartner,
    filterCity,
    filterLivreur,
    filterSource,
    filterDate,
    filterPriority,
    sortBy,
    availablePartners,
  ]);

  // -------------------------------------------------------------
  // GESTION DU COPIER TÉLÉPHONE
  // -------------------------------------------------------------
  const handleCopyPhone = (orderId: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(orderId);
    showToast(`Numéro ${phone} copié dans le presse-papier`);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // -------------------------------------------------------------
  // ACTION D'APPEL & QUALIFICATION
  // -------------------------------------------------------------
  const handleCallOrder = () => {
    if (!orderForCall) return;

    let targetStatus: OrderStatus = "A_RAPPELER";
    let commentStr = "";

    if (callResult === "CONTACT_ESTABLISHED") {
      targetStatus = "CONFIRMEE";
      commentStr = `Validation téléphonique réussie. Client joint par ${activeCloseuse?.name || "la Closeuse"}. ${
        callDeliverySlot ? `Créneau souhaité : ${callDeliverySlot}. ` : ""
      }${callNote ? `Note : ${callNote}` : ""}`;
    } else if (callResult === "NO_ANSWER") {
      targetStatus = "A_RAPPELER";
      commentStr = `Appel sans réponse. Client injoignable. Nouvelle tentative requise. ${callNote}`;
    } else if (callResult === "CALLBACK_REQUESTED") {
      targetStatus = "A_RAPPELER";
      commentStr = `Demande de report / rappel. Créneau demandé : ${callDeliverySlot || "À préciser"}. ${callNote}`;
    } else {
      targetStatus = "ANNULEE";
      commentStr = `Commande annulée lors de l'appel : ${
        callResult === "WRONG_NUMBER" ? "Numéro faux ou invalide" : "Client refuse l'achat"
      }. Détails : ${callNote}`;
    }

    logClosingCall(orderForCall.id, commentStr, targetStatus, undefined, callDeliverySlot);

    showToast(`Appel enregistré avec succès : ${orderForCall.orderNumber} passée en ${targetStatus}`);
    setOrderForCall(null);
    setCallNote("");
    setCallDeliverySlot("");
  };

  // -------------------------------------------------------------
  // CONFIRMATION DE COMMANDE
  // -------------------------------------------------------------
  const handleConfirmOrder = () => {
    if (!orderForConfirm) return;

    if (confirmDriverId) {
      updateOrderStatus(
        orderForConfirm.id,
        "CONFIRMEE",
        confirmNote || "Commande confirmée après validation téléphonique. Prête pour affectation."
      );
      assignOrderToLivreur(orderForConfirm.id, confirmDriverId, confirmNote || undefined);
      const driver = livreurs.find((l) => l.id === confirmDriverId);
      showToast(`Commande ${orderForConfirm.orderNumber} confirmée et affectée à ${driver?.name || "livreur"}`);
    } else {
      updateOrderStatus(
        orderForConfirm.id,
        "CONFIRMEE",
        confirmNote || "Commande confirmée après validation téléphonique. Prête pour affectation."
      );
      showToast(`Commande ${orderForConfirm.orderNumber} confirmée avec succès (À affecter)`);
    }

    setOrderForConfirm(null);
    setConfirmDriverId("");
    setConfirmNote("");
  };

  // -------------------------------------------------------------
  // ANNULATION DE COMMANDE
  // -------------------------------------------------------------
  const handleCancelOrder = () => {
    if (!orderForCancel) return;
    const fullReason = `${cancelReason}${cancelDetails ? ` — ${cancelDetails}` : ""}`;
    updateOrderStatus(orderForCancel.id, "ANNULEE", fullReason);

    showToast(`Commande ${orderForCancel.orderNumber} annulée (${cancelReason})`);
    setOrderForCancel(null);
    setCancelDetails("");
  };

  // -------------------------------------------------------------
  // AFFECTATION OU RÉAFFECTATION DE LIVREUR
  // -------------------------------------------------------------
  const handleAssignDriver = () => {
    if (!orderForAssign || !selectedDriverId) return;
    const driver = livreurs.find((l) => l.id === selectedDriverId);
    const isReassign = !!orderForAssign.assignedLivreurId && orderForAssign.assignedLivreurId !== selectedDriverId;

    assignOrderToLivreur(orderForAssign.id, selectedDriverId, reassignJustification || undefined);

    showToast(
      isReassign
        ? `Commande ${orderForAssign.orderNumber} réaffectée avec succès à ${driver?.name || selectedDriverId}`
        : `Commande ${orderForAssign.orderNumber} affectée à ${driver?.name || selectedDriverId} avec succès`
    );
    setOrderForAssign(null);
    setSelectedDriverId("");
    setReassignJustification("");
  };

  // -------------------------------------------------------------
  // PARSER IMPORT IA & DÉTECTION DOUBLONS
  // -------------------------------------------------------------
  const handleParseImport = (text: string) => {
    setRawImportText(text);
    if (!text.trim()) {
      setParsedImportData(null);
      setDetectedDuplicate(null);
      return;
    }

    const lines = text.split("\n");
    let name = "";
    let phone = "";
    let city = "Conakry";
    let address = "";
    let products = "Article commandé";
    let qty = 1;
    let price = 15000;

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("nom") || lower.includes("client")) {
        name = line.replace(/nom|client|:|-/gi, "").trim();
      } else if (lower.includes("tel") || lower.includes("num") || lower.includes("whatsapp")) {
        phone = line.replace(/tel|num|telephone|whatsapp|:|-/gi, "").trim();
      } else if (lower.includes("ville")) {
        city = line.replace(/ville|:|-/gi, "").trim();
      } else if (lower.includes("adresse") || lower.includes("quartier")) {
        address = line.replace(/adresse|quartier|:|-/gi, "").trim();
      } else if (lower.includes("produit") || lower.includes("article")) {
        products = line.replace(/produit|article|item|:|-/gi, "").trim();
      } else if (lower.includes("quantite") || lower.includes("qte")) {
        const parsedQ = parseInt(line.replace(/\D/g, ""), 10);
        if (!isNaN(parsedQ) && parsedQ > 0) qty = parsedQ;
      } else if (lower.includes("prix") || lower.includes("montant") || lower.includes("total")) {
        const parsedP = parseInt(line.replace(/\D/g, ""), 10);
        if (!isNaN(parsedP) && parsedP > 0) price = parsedP;
      }
    });

    if (!name && lines.length > 0 && lines[0].trim().length > 2) {
      name = lines[0].trim();
    }
    if (!phone) {
      const phoneMatch = text.match(/(\+?229)?[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/);
      if (phoneMatch) phone = phoneMatch[0].trim();
    }

    if (phone) {
      const cleanTargetPhone = phone.replace(/\s+/g, "");
      const dup = orders.find((o) => o.clientPhone.replace(/\s+/g, "") === cleanTargetPhone);
      setDetectedDuplicate(dup || null);
    } else {
      setDetectedDuplicate(null);
    }

    setParsedImportData({
      clientName: name || "Client extrait",
      clientPhone: phone || "",
      city: city || "",
      address: address || "",
      products: products || "",
      quantity: qty,
      price: price,
      partnerId: partners[0]?.id || "",
    });
  };

  const handleCreateImportedOrder = () => {
    if (!parsedImportData) return;
    const newOrd = createOrder({
      orderNumber: `CMD-IA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      clientName: parsedImportData.clientName,
      clientPhone: parsedImportData.clientPhone,
      city: parsedImportData.city,
      address: parsedImportData.address,
      region: "Littoral",
      products: parsedImportData.products,
      quantity: parsedImportData.quantity,
      totalPrice: parsedImportData.price,
      deliveryFee: partners.find((p) => p.id === parsedImportData.partnerId)?.deliveryFeeDefault || 0,
      serviceFee: partners.find((p) => p.id === parsedImportData.partnerId)?.agencyCommissionDefault || 0,
      status: "EN_ATTENTE",
      comment: "Commande extraite par Import IA WhatsApp/Message. À appeler en priorité.",
      partnerId: parsedImportData.partnerId,
      partnerName: partners.find((p) => p.id === parsedImportData.partnerId)?.companyName || "Marchand",
      assignedCloseuseId: activeCloseuse?.id,
      assignedCloseuseName: activeCloseuse?.name,
      source: "Import IA",
      priority: "URGENT",
    });

    showToast(`Commande ${newOrd.orderNumber} importée avec succès via IA`);
    setShowImportModal(false);
    setRawImportText("");
    setParsedImportData(null);
    setDetectedDuplicate(null);
    setSelectedOrderForDetail(newOrd);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find((p) => p.id === manualPartnerId);
    const newOrd = createOrder({
      orderNumber: `CMD-GN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      clientName: manualClient,
      clientPhone: manualPhone,
      city: manualCity,
      address: manualAddress,
      region: "Littoral",
      products: manualProduct,
      quantity: manualQty,
      totalPrice: manualPrice,
      deliveryFee: 2000,
      serviceFee: 800,
      status: "EN_ATTENTE",
      comment: "Commande manuelle créée par la Closeuse.",
      partnerId: manualPartnerId,
      partnerName: partner?.companyName || partner?.fullName || "Boutique Partenaire",
      assignedCloseuseId: activeCloseuse?.id,
      assignedCloseuseName: activeCloseuse?.name,
      source: "ENO",
      priority: "HIGH",
    });

    showToast(`Commande manuelle ${newOrd.orderNumber} créée avec succès`);
    setShowNewOrderModal(false);
    setManualClient("");
    setManualPhone("+229 ");
    setManualAddress("");
    setManualProduct("");
    setSelectedOrderForDetail(newOrd);
  };

  // -------------------------------------------------------------
  // ACTIONS BULK (LOT)
  // -------------------------------------------------------------
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handleBulkConfirm = () => {
    let count = 0;
    selectedOrderIds.forEach((id) => {
      const o = orders.find((ord) => ord.id === id);
      if (o && (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER")) {
        updateOrderStatus(id, "CONFIRMEE", "Confirmation groupée via l'Espace Commercial");
        count++;
      }
    });
    showToast(`${count} commande(s) confirmée(s) avec succès`);
    setSelectedOrderIds([]);
  };

  // Réinitialisation complète des filtres
  const handleResetAllFilters = () => {
    setActiveTab("ALL");
    setSearchTerm("");
    setFilterPartner("ALL");
    setFilterCity("ALL");
    setFilterLivreur("ALL");
    setFilterSource("ALL");
    setFilterDate("ALL");
    setFilterPriority("ALL");
    setSortBy("PRIORITY");
    showToast("Tous les filtres ont été réinitialisés");
  };

  return (
    <div className="space-y-6">
      {/* Toast de Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. EN-TÊTE DU MODULE COMMANDES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Commandes</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
              {filteredOrders.length} / {kpiTotal}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Traitez, confirmez et pilotez les commandes GuinéeGo LAT depuis un seul tableau opérationnel.
          </p>
        </div>

        {/* Boutons d'action globale */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
              showFiltersDrawer || activeFiltersCount > 0
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Importer (IA)
          </button>

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* ── 2. KPI INTERACTIFS CLIQUABLES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: "ALL", label: "Total", value: kpiTotal, icon: Package, color: "text-slate-700", bg: "bg-slate-100" },
          {
            id: "EN_ATTENTE",
            label: "À appeler",
            value: kpiToCall,
            icon: PhoneCall,
            color: "text-amber-600",
            bg: "bg-amber-50",
            urgent: kpiToCall > 0,
          },
          {
            id: "A_RAPPELER",
            label: "À relancer",
            value: kpiToRelance,
            icon: RefreshCw,
            color: "text-orange-600",
            bg: "bg-orange-50",
            urgent: kpiToRelance > 0,
          },
          {
            id: "TO_CONFIRM",
            label: "À confirmer",
            value: kpiToConfirm,
            icon: CheckCircle2,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            id: "CONFIRMEE",
            label: "Confirmées",
            value: kpiConfirmed,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            id: "TO_ASSIGN",
            label: "À affecter",
            value: kpiToAssign,
            icon: Truck,
            color: "text-rose-600",
            bg: "bg-rose-50",
            urgent: kpiToAssign > 0,
          },
        ].map((k) => {
          const Icon = k.icon;
          const isSelected = activeTab === k.id;
          return (
            <button
              key={k.id}
              onClick={() => setActiveTab(k.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {k.urgent && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              <p className="text-xl font-black text-slate-900 leading-none">{k.value}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate">{k.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── 3. BARRE DE VUES RAPIDES & RECHERCHE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 shadow-xs">
        {/* Onglets rapides */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-slate-100">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.badgeCls || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Champ de recherche tolérant & Tri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par référence (#10482, SH-..., CMD-...), client, téléphone (+229...), produit ou marchand..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tri :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 border-none focus:outline-none cursor-pointer pr-1"
              >
                <option value="PRIORITY">Priorité (Action urgente)</option>
                <option value="NEWEST">Plus récentes</option>
                <option value="OLDEST">Plus anciennes</option>
                <option value="AMOUNT_HIGH">Montant décroissant</option>
                <option value="AMOUNT_LOW">Montant croissant</option>
              </select>
            </div>
          </div>
        </div>

        {/* TIROIR / BARRE DES FILTRES AVANCÉS COMPLÈTE & FONCTIONNELLE */}
        {showFiltersDrawer && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 animate-fade-in-up">
            {/* 1. Marchand */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">E-commerçant</label>
              <select
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Tous les marchands</option>
                {availablePartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Ville / Zone */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Ville / Zone</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Toutes les zones</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Livreur affecté */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Livreur affecté</label>
              <select
                value={filterLivreur}
                onChange={(e) => setFilterLivreur(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="NONE">Sans livreur (À affecter)</option>
                {livreurs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Canal d'origine / Source */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Canal d'origine</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="SHOPIFY">Shopify</option>
                <option value="YOUCAN">YouCan</option>
                <option value="IA">Import IA (WhatsApp)</option>
                <option value="ENO">Création GuinéeGo</option>
              </select>
            </div>

            {/* 5. Date / Période */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Date / Période</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Toutes les dates</option>
                <option value="TODAY">Aujourd'hui</option>
                <option value="YESTERDAY">Hier</option>
                <option value="7D">7 derniers jours</option>
                <option value="30D">30 derniers jours</option>
              </select>
            </div>

            {/* 6. Priorité */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Priorité</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Toutes les priorités</option>
                <option value="URGENT">Urgent (Action rapide)</option>
                <option value="HIGH">Important</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>

            {/* Bouton Réinitialiser au bas du drawer si actif */}
            <div className="lg:col-span-6 flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredOrders.length} commande(s) correspondent à vos critères.
              </span>
              <button
                onClick={handleResetAllFilters}
                className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                Réinitialiser tous les filtres
              </button>
            </div>
          </div>
        )}

        {/* Pilules des filtres actifs */}
        {activeFiltersCount > 0 && !showFiltersDrawer && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Filtres actifs :</span>
            {filterPartner !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Marchand : {availablePartners.find((p) => p.id === filterPartner)?.name || filterPartner}
                <button onClick={() => setFilterPartner("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterCity !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Zone : {filterCity}
                <button onClick={() => setFilterCity("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterLivreur !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Livreur : {filterLivreur === "NONE" ? "Sans livreur" : livreurs.find((l) => l.id === filterLivreur)?.name}
                <button onClick={() => setFilterLivreur("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterSource !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Source : {filterSource}
                <button onClick={() => setFilterSource("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterDate !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Date : {filterDate}
                <button onClick={() => setFilterDate("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterPriority !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Priorité : {filterPriority}
                <button onClick={() => setFilterPriority("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetAllFilters}
              className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Effacer tout
            </button>
          </div>
        )}

        {/* Barre d'actions groupées (Bulk) */}
        {selectedOrderIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs animate-fade-in-up">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {selectedOrderIds.length} commande(s) sélectionnée(s)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkConfirm}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
              >
                Confirmer la sélection
              </button>
              <button
                onClick={() => setSelectedOrderIds([])}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Désélectionner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. TABLEAU DES COMMANDES ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1020px]">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left">Commande & Source</th>
                <th className="px-4 py-3 text-left">Client & Téléphone</th>
                <th className="px-4 py-3 text-left">Produit</th>
                <th className="px-4 py-3 text-left">Marchand</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-center">Priorité</th>
                <th className="px-4 py-3 text-right">Montant COD</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-left">Livreur</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((o) => {
                const hasDriver = !!o.assignedLivreurId;
                const isSelected = selectedOrderIds.includes(o.id);
                const source = resolveOrderSource(o);
                const priority = resolveOrderPriority(o);

                return (
                  <tr
                    key={o.id}
                    className={`hover:bg-slate-50/70 transition-colors group ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {/* Checkbox de sélection */}
                    <td className="px-3 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(o.id)}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </td>

                    {/* Commande & Source */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForDetail(o)}
                            className="font-black text-slate-900 font-mono hover:text-blue-600 hover:underline cursor-pointer"
                          >
                            {o.orderNumber}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {getSourceBadge(source)}
                          <span className="text-[10px] text-slate-400">
                            {(o.createdAt || "").slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Client & Téléphone */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                          {o.clientName}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <a
                            href={`tel:${o.clientPhone}`}
                            className="hover:underline hover:text-slate-900"
                            title="Lancer l'appel"
                          >
                            {o.clientPhone}
                          </a>
                          <button
                            onClick={() => handleCopyPhone(o.id, o.clientPhone)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Copier le numéro"
                          >
                            {copiedPhoneId === o.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {o.callCount && o.callCount > 0 ? (
                          <span className="text-[9px] text-amber-700 font-bold">
                            {o.callCount} appel(s) effectué(s)
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Produit */}
                    <td className="px-4 py-3.5">
                      <div className="max-w-[150px]">
                        <p className="font-semibold text-slate-800 truncate" title={o.products}>
                          {o.products}
                        </p>
                        <p className="text-[10px] text-slate-400">Qté : {o.quantity || 1}</p>
                      </div>
                    </td>

                    {/* E-commerçant */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-700 truncate max-w-[120px] block" title={o.partnerName}>
                        {o.partnerName || "—"}
                      </span>
                    </td>

                    {/* Localisation */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[95px] font-medium">{o.city}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 truncate max-w-[120px] block" title={o.address}>
                        {o.address}
                      </span>
                    </td>

                    {/* Priorité */}
                    <td className="px-4 py-3.5 text-center">
                      {getPriorityBadge(priority)}
                    </td>

                    {/* Montant COD */}
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCFA(o.totalPrice)}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(o.status, hasDriver)}
                    </td>

                    {/* Livreur */}
                    <td className="px-4 py-3.5">
                      {o.assignedLivreurName ? (
                        <div className="flex items-center gap-1 text-slate-800 font-semibold">
                          <Bike className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[110px]">{o.assignedLivreurName}</span>
                        </div>
                      ) : o.status === "CONFIRMEE" ? (
                        <button
                          onClick={() => setOrderForAssign(o)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Truck className="w-3 h-3" />
                          Affecter livreur
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions Contextuelles */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Bouton d'appel & qualification */}
                        {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") && (
                          <button
                            onClick={() => {
                              setOrderForCall(o);
                              setCallResult("CONTACT_ESTABLISHED");
                              setCallNote("");
                              setCallDeliverySlot("");
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                            title="Appeler le client et consigner l'interaction"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bouton Confirmer */}
                        {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") && (
                          <button
                            onClick={() => {
                              setOrderForConfirm(o);
                              setConfirmDriverId("");
                              setConfirmNote("");
                            }}
                            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                            title="Confirmer la commande"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bouton Affecter Livreur */}
                        {o.status === "CONFIRMEE" && !o.assignedLivreurId && (
                          <button
                            onClick={() => {
                              setOrderForAssign(o);
                              setSelectedDriverId("");
                              setReassignJustification("");
                            }}
                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                            title="Affecter un livreur"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bouton Annuler */}
                        {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || o.status === "CONFIRMEE") && (
                          <button
                            onClick={() => {
                              setOrderForCancel(o);
                              setCancelReason("Client refuse la commande / Changement d'avis");
                              setCancelDetails("");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Annuler la commande avec motif"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bouton Voir Détails */}
                        <button
                          onClick={() => setSelectedOrderForDetail(o)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Voir la fiche complète"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">Aucune commande trouvée</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Modifiez vos critères de recherche ou réinitialisez les filtres.
                    </p>
                    <button
                      onClick={handleResetAllFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Réinitialiser tous les filtres
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau avec pagination / comptage */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <span>
            Affichage de <strong>{filteredOrders.length}</strong> sur <strong>{kpiTotal}</strong> commandes
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Toutes les données sont synchronisées en direct</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. TIROIR LATÉRAL : FICHE DÉTAILLÉE DE LA COMMANDE
      ======================================================== */}
      {selectedOrderForDetail && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedOrderForDetail(null)}
        >
          <div
            className="w-full max-w-full sm:max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du tiroir */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-base">
                    {selectedOrderForDetail.orderNumber}
                  </span>
                  {getSourceBadge(resolveOrderSource(selectedOrderForDetail))}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Créée le {(selectedOrderForDetail.createdAt || "").slice(0, 10)} {selectedOrderForDetail.partnerName ? `via ${selectedOrderForDetail.partnerName}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Statut & Priorité */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Statut Actuel
                  </span>
                  {getStatusBadge(selectedOrderForDetail.status, !!selectedOrderForDetail.assignedLivreurId)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Niveau Priorité
                  </span>
                  {getPriorityBadge(resolveOrderPriority(selectedOrderForDetail))}
                </div>
              </div>

              {/* Informations Client */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Coordonnées Client
                </p>
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nom complet :</span>
                    <span className="font-black text-slate-900">{selectedOrderForDetail.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Téléphone direct :</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedOrderForDetail.clientPhone}`}
                        className="font-bold text-slate-900 underline font-mono"
                      >
                        {selectedOrderForDetail.clientPhone}
                      </a>
                      <button
                        onClick={() => handleCopyPhone(selectedOrderForDetail.id, selectedOrderForDetail.clientPhone)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copier"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Ville / Zone :</span>
                    <span className="font-bold text-slate-800">{selectedOrderForDetail.city}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Adresse de livraison :</span>
                    <span className="font-medium text-slate-700 text-right max-w-[220px]">
                      {selectedOrderForDetail.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détails du Colis */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Détails du Colis & Articles
                </p>
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Article(s) :</span>
                    <span className="font-bold text-slate-900">{selectedOrderForDetail.products}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Quantité :</span>
                    <span className="font-black text-slate-900">{selectedOrderForDetail.quantity || 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">E-commerçant / Boutique :</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrderForDetail.partnerName || "—"}
                    </span>
                  </div>
                  {selectedOrderForDetail.comment && (
                    <div className="pt-2 border-t border-slate-100 text-slate-600 italic text-[11px]">
                      "{selectedOrderForDetail.comment}"
                    </div>
                  )}
                </div>
              </div>

              {/* Décomposition Financière */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Décomposition Financière COD
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Montant total à encaisser (COD) :</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {formatCFA(selectedOrderForDetail.totalPrice)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Frais de livraison :</span>
                    <span>{formatCFA(selectedOrderForDetail.deliveryFee || 2000)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Commission closing :</span>
                    <span>{formatCFA(selectedOrderForDetail.serviceFee || 800)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Reversé au marchand :</span>
                    <span>
                      {formatCFA(
                        selectedOrderForDetail.totalPrice -
                          (selectedOrderForDetail.deliveryFee || 2000) -
                          (selectedOrderForDetail.serviceFee || 800)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Affectation Logistique */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Affectation Logistique
                </p>
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Livreur affecté :</span>
                    {selectedOrderForDetail.assignedLivreurName ? (
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Bike className="w-3 h-3 text-slate-600" />
                        {selectedOrderForDetail.assignedLivreurName}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Non affecté (En attente)</span>
                    )}
                  </div>
                  {selectedOrderForDetail.deliveryTimeSlot && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Créneau de livraison :</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedOrderForDetail.deliveryTimeSlot}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chronologie de traitement */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Chronologie de traitement
                </p>
                <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                  <div className="relative">
                    <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-slate-400" />
                    <p className="font-bold text-slate-800">Commande enregistrée</p>
                    <p className="text-[10px] text-slate-400">{selectedOrderForDetail.createdAt}</p>
                  </div>
                  {selectedOrderForDetail.callCount && selectedOrderForDetail.callCount > 0 ? (
                    <div className="relative">
                      <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-amber-500" />
                      <p className="font-bold text-slate-800">Appel(s) commercial consigné(s)</p>
                      <p className="text-[10px] text-slate-400">{selectedOrderForDetail.callCount} tentative(s)</p>
                    </div>
                  ) : null}
                  {selectedOrderForDetail.status === "CONFIRMEE" ||
                  selectedOrderForDetail.status === "EN_COURS" ||
                  selectedOrderForDetail.status === "LIVREE" ? (
                    <div className="relative">
                      <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500" />
                      <p className="font-bold text-slate-800">Commande validée & confirmée</p>
                      <p className="text-[10px] text-slate-400">Prête pour affectation logistique</p>
                    </div>
                  ) : null}
                  {selectedOrderForDetail.assignedLivreurName && (
                    <div className="relative">
                      <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="font-bold text-slate-800">
                        Livreur assigné : {selectedOrderForDetail.assignedLivreurName}
                      </p>
                      <p className="text-[10px] text-slate-400">En cours de distribution</p>
                    </div>
                  )}
                  {selectedOrderForDetail.status === "LIVREE" && (
                    <div className="relative">
                      <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="font-bold text-slate-800">Colis remis & fonds COD encaissés</p>
                      <p className="text-[10px] text-slate-400">
                        {selectedOrderForDetail.deliveredAt || "Livraison effectuée"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Contextuelles dans le Drawer */}
            <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white sticky bottom-0">
              <button
                onClick={() => {
                  const ord = selectedOrderForDetail;
                  setSelectedOrderForDetail(null);
                  setOrderForCall(ord);
                  setCallResult("CONTACT_ESTABLISHED");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                Appeler client
              </button>

              {selectedOrderForDetail.status === "CONFIRMEE" && !selectedOrderForDetail.assignedLivreurId && (
                <button
                  onClick={() => {
                    const ord = selectedOrderForDetail;
                    setSelectedOrderForDetail(null);
                    setOrderForAssign(ord);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Affecter livreur
                </button>
              )}

              {(selectedOrderForDetail.status === "EN_ATTENTE" || selectedOrderForDetail.status === "A_RAPPELER") && (
                <button
                  onClick={() => {
                    const ord = selectedOrderForDetail;
                    setSelectedOrderForDetail(null);
                    setOrderForConfirm(ord);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODALE : ENREGISTREMENT D'APPEL CLIENT
      ======================================================== */}
      {orderForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Enregistrer l'appel client</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {orderForCall.orderNumber} — {orderForCall.clientName}
                </p>
              </div>
              <button
                onClick={() => setOrderForCall(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Téléphone :</span>
              <a href={`tel:${orderForCall.clientPhone}`} className="font-bold text-slate-900 underline font-mono">
                {orderForCall.clientPhone}
              </a>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Résultat de l'interaction
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: "CONTACT_ESTABLISHED",
                    label: "Client joint — Commande validée",
                    icon: CheckCircle2,
                    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
                  },
                  {
                    id: "NO_ANSWER",
                    label: "Sans réponse / Injoignable",
                    icon: PhoneOff,
                    cls: "text-amber-700 bg-amber-50 border-amber-200",
                  },
                  {
                    id: "CALLBACK_REQUESTED",
                    label: "Demande de rappel / Report",
                    icon: CalendarClock,
                    cls: "text-orange-700 bg-orange-50 border-orange-200",
                  },
                  {
                    id: "WRONG_NUMBER",
                    label: "Numéro incorrect ou inexistant",
                    icon: AlertTriangle,
                    cls: "text-rose-700 bg-rose-50 border-rose-200",
                  },
                  {
                    id: "CLIENT_REFUSED",
                    label: "Client refuse la commande",
                    icon: XCircle,
                    cls: "text-rose-700 bg-rose-50 border-rose-200",
                  },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setCallResult(res.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      callResult === res.id
                        ? `ring-2 ring-slate-900 ${res.cls}`
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <res.icon className="w-4 h-4 shrink-0" />
                    <span>{res.label}</span>
                  </button>
                ))}
              </div>

              {callResult === "CALLBACK_REQUESTED" && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Créneau de rappel souhaité
                  </label>
                  <input
                    type="text"
                    value={callDeliverySlot}
                    onChange={(e) => setCallDeliverySlot(e.target.value)}
                    placeholder="Ex: 16h30 ou demain matin"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Commentaire / Notes
                </label>
                <textarea
                  value={callNote}
                  onChange={(e) => setCallNote(e.target.value)}
                  placeholder="Précisions utiles sur le contact client..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleCallOrder}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Enregistrer l'appel
              </button>
              <button
                onClick={() => setOrderForCall(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. MODALE : CONFIRMER LA COMMANDE AVEC OPTION AFFECTATION
      ======================================================== */}
      {orderForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Confirmer la commande</h3>
                  <p className="text-[11px] text-slate-500">{orderForConfirm.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderForConfirm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Client :</span>
                <span className="font-bold text-slate-900">{orderForConfirm.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zone / Adresse :</span>
                <span className="font-semibold text-slate-800">
                  {orderForConfirm.city} — {orderForConfirm.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Articles :</span>
                <span className="font-bold text-slate-900">{orderForConfirm.products}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Montant COD :</span>
                <span className="font-black text-slate-900">{formatCFA(orderForConfirm.totalPrice)}</span>
              </div>
            </div>

            {/* Option directe d'affectation de livreur */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Affecter un livreur immédiatement (optionnel)
              </label>
              <select
                value={confirmDriverId}
                onChange={(e) => setConfirmDriverId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-900"
              >
                <option value="">Laisser en "À affecter"</option>
                {livreurs
                  .filter((l) => l.isActive)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.zone}) — {l.availabilityStatus || "Disponible"}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Note de confirmation
              </label>
              <input
                type="text"
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                placeholder="Ex: Client confirmé disponible dès 14h..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Confirmer la commande
              </button>
              <button
                onClick={() => setOrderForConfirm(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. MODALE : ANNULATION AVEC MOTIF OBLIGATOIRE
      ======================================================== */}
      {orderForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Annuler la commande</h3>
                  <p className="text-[11px] text-slate-500">{orderForCancel.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderForCancel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Motif d'annulation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-900"
                >
                  <option value="Client refuse la commande / Changement d'avis">
                    Client refuse la commande / Changement d'avis
                  </option>
                  <option value="Client injoignable après multiples tentatives">
                    Client injoignable après multiples tentatives
                  </option>
                  <option value="Numéro faux, incorrect ou inexistant">
                    Numéro faux, incorrect ou inexistant
                  </option>
                  <option value="Doublon de commande">Doublon de commande</option>
                  <option value="Client a déjà acheté ailleurs">Client a déjà acheté ailleurs</option>
                  <option value="Hors zone de livraison couverte">Hors zone de livraison couverte</option>
                  <option value="Autre motif">Autre motif</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Détails complémentaires
                </label>
                <textarea
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  placeholder="Notes sur la raison de l'annulation..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleCancelOrder}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Confirmer l'annulation
              </button>
              <button
                onClick={() => setOrderForCancel(null)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          9. TIROIR LATÉRAL : AFFECTATION / RÉAFFECTATION LIVREUR
      ======================================================== */}
      {orderForAssign && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setOrderForAssign(null)}
        >
          <div
            className="w-full max-w-full sm:max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-black text-slate-900">Affectation de livreur</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {orderForAssign.orderNumber} — {orderForAssign.clientName}
                </p>
              </div>
              <button
                onClick={() => setOrderForAssign(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Destination & Colis</p>
              <div className="flex justify-between">
                <span className="text-slate-400">Zone :</span>
                <span className="font-bold text-slate-900">{orderForAssign.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Adresse :</span>
                <span className="font-semibold text-slate-700">{orderForAssign.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant COD :</span>
                <span className="font-bold text-slate-900">{formatCFA(orderForAssign.totalPrice)}</span>
              </div>
            </div>

            {orderForAssign.assignedLivreurId && (
              <div className="px-4 pb-2">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <p className="text-[11px] font-bold text-amber-800">⚠️ Réaffectation de livreur</p>
                  <input
                    type="text"
                    value={reassignJustification}
                    onChange={(e) => setReassignJustification(e.target.value)}
                    placeholder="Justification obligatoire pour réaffecter..."
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-2">
                Sélectionnez le livreur disponible
              </p>
              {livreurs
                .filter((l) => l.isActive && l.availabilityStatus !== "OFFLINE")
                .map((l) => {
                  const isSelected = selectedDriverId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedDriverId(l.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected ? "border-slate-900 bg-slate-50 shadow-xs" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {l.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{l.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {l.zone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            {l.availabilityStatus || "Disponible"}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">{l.assignedOrdersCount} colis</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId || (!!orderForAssign.assignedLivreurId && !reassignJustification.trim())}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirmer l'affectation
              </button>
              <button
                onClick={() => setOrderForAssign(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          10. MODALE : IMPORTER UNE COMMANDE (IA) & DOUBLONS
      ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-lg bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Importer une commande (IA)</h3>
                  <p className="text-[11px] text-slate-500">Collez un message client WhatsApp ou texte brut</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Message brut à analyser
              </label>
              <textarea
                rows={4}
                value={rawImportText}
                onChange={(e) => handleParseImport(e.target.value)}
                placeholder="Ex : Bonjour je veux commander la montre noire. Nom : Mamadou Diallo, Tel : 620 00 00 00, Ville : Conakry, Kaloum..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>

            {detectedDuplicate && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Alerte : Doublon potentiel détecté !</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Une commande ({detectedDuplicate.orderNumber}) existe déjà pour le numéro{" "}
                    <strong>{detectedDuplicate.clientPhone}</strong> ({detectedDuplicate.clientName}).
                  </p>
                </div>
              </div>
            )}

            {parsedImportData && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">
                  Données extraites automatiquement
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Client :</span>{" "}
                    <strong className="text-slate-900">{parsedImportData.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Téléphone :</span>{" "}
                    <strong className="text-slate-900 font-mono">{parsedImportData.clientPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Ville :</span>{" "}
                    <strong className="text-slate-900">{parsedImportData.city}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Adresse :</span>{" "}
                    <span className="text-slate-700">{parsedImportData.address}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Produit :</span>{" "}
                    <strong className="text-slate-900">{parsedImportData.products}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Montant :</span>{" "}
                    <strong className="text-slate-900">{formatCFA(parsedImportData.price)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleCreateImportedOrder}
                disabled={!parsedImportData}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Créer la commande GuinéeGo
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          11. MODALE : CRÉATION MANUELLE DE COMMANDE
      ======================================================== */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-lg bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Nouvelle commande manuelle</h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Nom client *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualClient}
                    onChange={(e) => setManualClient(e.target.value)}
                    placeholder="Ex: Christian KOSSOU"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+229 01 97..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Ville</label>
                  <select
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-semibold"
                  >
                    <option value="Conakry">Cotonou</option>
                    <option value="Abomey-Kankan">Abomey-Kankan</option>
                    <option value="Mamou">Mamou</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Parakou">Parakou</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Marchand</label>
                  <select
                    value={manualPartnerId}
                    onChange={(e) => setManualPartnerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-semibold"
                  >
                    {availablePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Adresse précise
                </label>
                <input
                  type="text"
                  required
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Ex: Haie Vive, face pharmacie"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Article(s)</label>
                  <input
                    type="text"
                    required
                    value={manualProduct}
                    onChange={(e) => setManualProduct(e.target.value)}
                    placeholder="Désignation de l'article"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Prix total (GNF)
                  </label>
                  <input
                    type="number"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-black"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Enregistrer la commande
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
