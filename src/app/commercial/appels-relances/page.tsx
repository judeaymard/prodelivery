"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PhoneCall,
  Phone,
  PhoneOff,
  PhoneForwarded,
  Clock,
  Calendar,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
  RotateCcw,
  User,
  MapPin,
  Package,
  Store,
  Truck,
  Copy,
  Check,
  Eye,
  ArrowUpDown,
  X,
  Flame,
  ChevronRight,
  Sparkles,
  History,
  CheckCheck,
  Plus,
  ArrowRight,
  ShieldAlert,
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

// Helpers de dates
function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const target = dateStr.slice(0, 10);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  return target === todayStr || target === "2026-09-06";
}

function isDateOverdue(dateStr?: string, status?: OrderStatus): boolean {
  if (!dateStr) return false;
  if (status !== "A_RAPPELER" && status !== "EN_ATTENTE") return false;
  const now = new Date();
  // Comparaison timestamp
  const targetTime = new Date(dateStr).getTime();
  const nowTime = now.getTime();
  // S'il s'agit d'une date passée par rapport à now
  return targetTime < nowTime;
}

// Badge de qualification du dernier appel
function getLastResultBadge(result?: string) {
  switch (result) {
    case "CONTACT_ESTABLISHED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          Joint & Confirmé
        </span>
      );
    case "NO_ANSWER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
          <PhoneOff className="w-2.5 h-2.5 text-amber-600" />
          Sans réponse
        </span>
      );
    case "CALLBACK_REQUESTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[10px] font-bold border border-orange-200">
          <CalendarClock className="w-2.5 h-2.5 text-orange-600" />
          Rappel demandé
        </span>
      );
    case "WRONG_NUMBER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
          Numéro faux
        </span>
      );
    case "CLIENT_REFUSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          <XCircle className="w-2.5 h-2.5 text-slate-500" />
          Refus client
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
          Premier contact requis
        </span>
      );
  }
}

// Badge de priorité d'appel
function getCallPriorityBadge(order: Order) {
  const isOverdue = isDateOverdue(order.scheduledCallback, order.status);
  const isToday = isDateToday(order.scheduledCallback);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 animate-pulse">
        <Flame className="w-2.5 h-2.5 text-rose-600" />
        En retard
      </span>
    );
  }
  if (isToday) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold border border-orange-200">
        <Clock className="w-2.5 h-2.5 text-orange-600" />
        Aujourd'hui
      </span>
    );
  }
  if (order.status === "EN_ATTENTE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
        <PhoneCall className="w-2.5 h-2.5 text-amber-600" />
        À appeler
      </span>
    );
  }
  if (order.scheduledCallback) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200">
        <Calendar className="w-2.5 h-2.5 text-blue-600" />
        Planifié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
      Standard
    </span>
  );
}

export default function AppelsRelancesPage() {
  const router = useRouter();
  const {
    orders,
    partners,
    livreurs,
    activeCloseuse,
    updateOrderStatus,
    logClosingCall,
    scheduleCallback,
    assignOrderToLivreur,
  } = useOperations();

  // États de filtres & recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<"PRIORITY" | "SCHEDULED_TIME" | "CALLS_COUNT" | "NEWEST" | "AMOUNT_HIGH">("PRIORITY");

  // Filtres avancés
  const [filterPartner, setFilterPartner] = useState<string>("ALL");
  const [filterCity, setFilterCity] = useState<string>("ALL");
  const [filterLastResult, setFilterLastResult] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  // Tiroirs et Modales
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [orderForCall, setOrderForCall] = useState<Order | null>(null);
  const [orderForReschedule, setOrderForReschedule] = useState<Order | null>(null);
  const [orderForConfirm, setOrderForConfirm] = useState<Order | null>(null);
  const [orderForCancel, setOrderForCancel] = useState<Order | null>(null);

  // Formulaire d'appel
  const [callResult, setCallResult] = useState<
    "CONTACT_ESTABLISHED" | "NO_ANSWER" | "WRONG_NUMBER" | "CALLBACK_REQUESTED" | "CLIENT_REFUSED"
  >("CONTACT_ESTABLISHED");
  const [callNote, setCallNote] = useState("");
  const [callScheduledDate, setCallScheduledDate] = useState("");
  const [callDeliverySlot, setCallDeliverySlot] = useState("");

  // Formulaire Reprogrammation
  const [rescheduleDate, setRescheduleDate] = useState("2026-09-06");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("15h00");
  const [rescheduleNote, setRescheduleNote] = useState("");

  // Formulaire Annulation
  const [cancelReason, setCancelReason] = useState("Client refuse la commande / Changement d'avis");
  const [cancelDetails, setCancelDetails] = useState("");

  // Copier Téléphone
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // CALCULS DYNAMIQUES DES KPIS D'APPELS
  // -------------------------------------------------------------
  const kpiToCall = useMemo(
    () => orders.filter((o) => o.status === "EN_ATTENTE" && (!o.callCount || o.callCount === 0)).length,
    [orders]
  );

  const kpiToCallbackToday = useMemo(
    () => orders.filter((o) => o.status === "A_RAPPELER" && o.scheduledCallback && isDateToday(o.scheduledCallback)).length,
    [orders]
  );

  const kpiOverdue = useMemo(
    () => orders.filter((o) => o.status === "A_RAPPELER" && o.scheduledCallback && isDateOverdue(o.scheduledCallback, o.status)).length,
    [orders]
  );

  const kpiNoAnswer = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "A_RAPPELER" &&
          (o.lastCallResult === "NO_ANSWER" || (!o.scheduledCallback && (o.callCount || 0) > 0))
      ).length,
    [orders]
  );

  const kpiCalledToday = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.lastCallAt && isDateToday(o.lastCallAt)) ||
          ((o.callCount || 0) > 0 && isDateToday(o.updatedAt))
      ).length,
    [orders]
  );

  const kpiScheduledTotal = useMemo(
    () => orders.filter((o) => o.status === "A_RAPPELER" && o.scheduledCallback).length,
    [orders]
  );

  // -------------------------------------------------------------
  // ONGLETS / FILES OPÉRATIONNELLES
  // -------------------------------------------------------------
  const tabs = [
    { id: "ALL", label: "Tous les suivis", count: orders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER").length },
    { id: "OVERDUE", label: "En retard", count: kpiOverdue, badgeCls: "bg-rose-100 text-rose-800 font-black", urgent: kpiOverdue > 0 },
    { id: "TODAY", label: "À rappeler aujourd'hui", count: kpiToCallbackToday, badgeCls: "bg-orange-100 text-orange-800" },
    { id: "TO_CALL", label: "À appeler", count: kpiToCall, badgeCls: "bg-amber-100 text-amber-800" },
    { id: "NO_ANSWER", label: "Sans réponse", count: kpiNoAnswer, badgeCls: "bg-slate-100 text-slate-800" },
    { id: "SCHEDULED", label: "Programmées", count: kpiScheduledTotal },
    { id: "HISTORY", label: "Historique / Traités", count: orders.filter((o) => (o.callCount || 0) > 0).length },
  ];

  // -------------------------------------------------------------
  // LISTES DE MARCHANDS ET ZONES UNIQUES
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterPartner !== "ALL") count++;
    if (filterCity !== "ALL") count++;
    if (filterLastResult !== "ALL") count++;
    if (filterPriority !== "ALL") count++;
    return count;
  }, [filterPartner, filterCity, filterLastResult, filterPriority]);

  // -------------------------------------------------------------
  // MOTEUR DE FILTRAGE ET RECHERCHE TOLÉRANTE
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. Filtrage par Onglet / File
        if (activeTab === "ALL") {
          // Tous les appels actifs nécessitant action
          if (o.status !== "EN_ATTENTE" && o.status !== "A_RAPPELER") return false;
        } else if (activeTab === "OVERDUE") {
          if (o.status !== "A_RAPPELER" || !o.scheduledCallback || !isDateOverdue(o.scheduledCallback, o.status)) {
            return false;
          }
        } else if (activeTab === "TODAY") {
          if (o.status !== "A_RAPPELER" || !o.scheduledCallback || !isDateToday(o.scheduledCallback)) {
            return false;
          }
        } else if (activeTab === "TO_CALL") {
          if (o.status !== "EN_ATTENTE" || (o.callCount && o.callCount > 0)) {
            return false;
          }
        } else if (activeTab === "NO_ANSWER") {
          if (
            o.status !== "A_RAPPELER" ||
            (o.lastCallResult !== "NO_ANSWER" && (o.scheduledCallback || !o.callCount))
          ) {
            return false;
          }
        } else if (activeTab === "SCHEDULED") {
          if (o.status !== "A_RAPPELER" || !o.scheduledCallback) {
            return false;
          }
        } else if (activeTab === "HISTORY") {
          if (!o.callCount || o.callCount === 0) {
            return false;
          }
        }

        // 2. Recherche tolérante
        if (searchTerm.trim()) {
          const cleanTerm = searchTerm.toLowerCase().replace(/[-_#+\\s]/g, "");
          const cleanPhone = (o.clientPhone || "").replace(/[-_+\\s]/g, "");
          const cleanNumber = (o.orderNumber || "").toLowerCase().replace(/[-_#\\s]/g, "");
          const cleanName = (o.clientName || "").toLowerCase();
          const cleanProduct = (o.products || "").toLowerCase();
          const cleanPartner = (o.partnerName || "").toLowerCase();
          const cleanCity = (o.city || "").toLowerCase();

          const rawTerm = searchTerm.toLowerCase().trim();

          const match =
            cleanNumber.includes(cleanTerm) ||
            cleanPhone.includes(cleanTerm) ||
            cleanName.includes(rawTerm) ||
            cleanProduct.includes(rawTerm) ||
            cleanPartner.includes(rawTerm) ||
            cleanCity.includes(rawTerm);

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

        // 5. Filtre Résultat dernier appel
        if (filterLastResult !== "ALL") {
          if (filterLastResult === "NONE" && o.lastCallResult) return false;
          if (filterLastResult !== "NONE" && o.lastCallResult !== filterLastResult) return false;
        }

        // 6. Filtre Priorité
        if (filterPriority !== "ALL") {
          if (filterPriority === "OVERDUE" && !isDateOverdue(o.scheduledCallback, o.status)) return false;
          if (filterPriority === "TODAY" && !isDateToday(o.scheduledCallback)) return false;
          if (filterPriority === "NORMAL" && (isDateOverdue(o.scheduledCallback, o.status) || isDateToday(o.scheduledCallback))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PRIORITY") {
          // 1. En retard (Urgentissime)
          const aOverdue = isDateOverdue(a.scheduledCallback, a.status);
          const bOverdue = isDateOverdue(b.scheduledCallback, b.status);
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;

          // 2. Rappels prévus aujourd'hui
          const aToday = isDateToday(a.scheduledCallback);
          const bToday = isDateToday(b.scheduledCallback);
          if (aToday && !bToday) return -1;
          if (!aToday && bToday) return 1;

          // 3. Commandes en attente de premier appel
          const aToCall = a.status === "EN_ATTENTE";
          const bToCall = b.status === "EN_ATTENTE";
          if (aToCall && !bToCall) return -1;
          if (!aToCall && bToCall) return 1;

          // 4. Par date de rappel programmée la plus proche
          if (a.scheduledCallback && b.scheduledCallback) {
            return new Date(a.scheduledCallback).getTime() - new Date(b.scheduledCallback).getTime();
          }

          // 5. Par date de commande
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }

        if (sortBy === "SCHEDULED_TIME") {
          if (a.scheduledCallback && b.scheduledCallback) {
            return new Date(a.scheduledCallback).getTime() - new Date(b.scheduledCallback).getTime();
          }
          if (a.scheduledCallback) return -1;
          if (b.scheduledCallback) return 1;
          return 0;
        }

        if (sortBy === "CALLS_COUNT") {
          return (b.callCount || 0) - (a.callCount || 0);
        }

        if (sortBy === "NEWEST") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }

        if (sortBy === "AMOUNT_HIGH") {
          return b.totalPrice - a.totalPrice;
        }

        return 0;
      });
  }, [
    orders,
    activeTab,
    searchTerm,
    filterPartner,
    filterCity,
    filterLastResult,
    filterPriority,
    sortBy,
    availablePartners,
  ]);

  // Copier téléphone
  const handleCopyPhone = (orderId: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(orderId);
    showToast(`Numéro ${phone} copié`);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // -------------------------------------------------------------
  // ACTION D'APPEL & QUALIFICATION COMPLÈTE
  // -------------------------------------------------------------
  const handleSaveCallInteraction = () => {
    if (!orderForCall) return;

    let targetStatus: OrderStatus = "A_RAPPELER";
    let commentStr = "";
    let callbackDateToPersist: string | undefined = undefined;

    if (callResult === "CONTACT_ESTABLISHED") {
      targetStatus = "CONFIRMEE";
      commentStr = `Validation téléphonique réussie par ${activeCloseuse?.name || "la Closeuse"}. ${
        callDeliverySlot ? `Créneau souhaité : ${callDeliverySlot}. ` : ""
      }${callNote ? `Note : ${callNote}` : ""}`;
    } else if (callResult === "NO_ANSWER") {
      targetStatus = "A_RAPPELER";
      commentStr = `Tentative d'appel sans réponse. ${callNote ? `Note : ${callNote}` : ""}`;
    } else if (callResult === "CALLBACK_REQUESTED") {
      targetStatus = "A_RAPPELER";
      callbackDateToPersist = callScheduledDate ? `${callScheduledDate}T15:00:00.000Z` : "2026-09-07T10:00:00.000Z";
      commentStr = `Demande de rappel client. Créneau : ${callDeliverySlot || "À confirmer"}. ${
        callNote ? `Note : ${callNote}` : ""
      }`;
    } else {
      targetStatus = "ANNULEE";
      commentStr = `Annulation suite à l'appel : ${
        callResult === "WRONG_NUMBER" ? "Numéro faux ou inexistant" : "Client refuse la commande"
      }. ${callNote ? `Détails : ${callNote}` : ""}`;
    }

    logClosingCall(
      orderForCall.id,
      commentStr,
      targetStatus,
      undefined,
      callDeliverySlot,
      callbackDateToPersist,
      callResult
    );

    showToast(`Interaction enregistrée pour ${orderForCall.orderNumber} (${targetStatus})`);
    setOrderForCall(null);
    setCallNote("");
    setCallScheduledDate("");
    setCallDeliverySlot("");
  };

  // -------------------------------------------------------------
  // PROGRAMMATION OU REPORT D'UNE RELANCE
  // -------------------------------------------------------------
  const handleSaveReschedule = () => {
    if (!orderForReschedule) return;

    const fullScheduled = `${rescheduleDate}T15:00:00.000Z`;
    const fullNote = `Relance fixée au ${rescheduleDate} (${rescheduleTimeSlot})${
      rescheduleNote ? ` : ${rescheduleNote}` : ""
    }`;

    scheduleCallback(orderForReschedule.id, fullScheduled, fullNote);

    showToast(`Relance programmée pour ${orderForReschedule.orderNumber} le ${rescheduleDate} à ${rescheduleTimeSlot}`);
    setOrderForReschedule(null);
    setRescheduleNote("");
  };

  // -------------------------------------------------------------
  // CONFIRMATION DIRECTE DE COMMANDE
  // -------------------------------------------------------------
  const handleConfirmOrder = () => {
    if (!orderForConfirm) return;
    updateOrderStatus(
      orderForConfirm.id,
      "CONFIRMEE",
      "Commande confirmée par la Closeuse via le module Appels & Relances."
    );
    showToast(`Commande ${orderForConfirm.orderNumber} confirmée avec succès`);
    setOrderForConfirm(null);
  };

  // -------------------------------------------------------------
  // ANNULATION AVEC MOTIF
  // -------------------------------------------------------------
  const handleCancelOrder = () => {
    if (!orderForCancel) return;
    const fullReason = `${cancelReason}${cancelDetails ? ` — ${cancelDetails}` : ""}`;
    updateOrderStatus(orderForCancel.id, "ANNULEE", fullReason);
    showToast(`Commande ${orderForCancel.orderNumber} annulée`);
    setOrderForCancel(null);
    setCancelDetails("");
  };

  // Réinitialisation complète des filtres
  const handleResetFilters = () => {
    setActiveTab("ALL");
    setSearchTerm("");
    setFilterPartner("ALL");
    setFilterCity("ALL");
    setFilterLastResult("ALL");
    setFilterPriority("ALL");
    setSortBy("PRIORITY");
    showToast("Filtres réinitialisés");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. EN-TÊTE DU MODULE APPELS & RELANCES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Appels & Relances</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
              {filteredOrders.length} relance(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organisez vos appels, suivez vos relances et ne laissez aucune commande sans suivi.
          </p>
        </div>

        {/* Actions d'en-tête */}
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

          <Link
            href="/commercial/commandes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            Module Commandes
          </Link>
        </div>
      </div>

      {/* ── 2. KPI DYNAMIQUES DU CENTRE D'APPEL ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            id: "TO_CALL",
            label: "À appeler",
            value: kpiToCall,
            icon: PhoneCall,
            color: "text-amber-600",
            bg: "bg-amber-50",
            urgent: kpiToCall > 0,
            desc: "Nouveaux clients",
          },
          {
            id: "TODAY",
            label: "À rappeler aujourd'hui",
            value: kpiToCallbackToday,
            icon: CalendarClock,
            color: "text-orange-600",
            bg: "bg-orange-50",
            urgent: kpiToCallbackToday > 0,
            desc: "Créneaux du jour",
          },
          {
            id: "OVERDUE",
            label: "En retard",
            value: kpiOverdue,
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-50",
            urgent: kpiOverdue > 0,
            desc: "Échéances dépassées",
          },
          {
            id: "NO_ANSWER",
            label: "Sans réponse",
            value: kpiNoAnswer,
            icon: PhoneOff,
            color: "text-slate-600",
            bg: "bg-slate-100",
            desc: "Tentatives infructueuses",
          },
          {
            id: "HISTORY",
            label: "Appels passés",
            value: kpiCalledToday,
            icon: CheckCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            desc: "Activité récente",
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
              <p className="text-[10px] text-slate-700 font-bold mt-1 truncate">{k.label}</p>
              <p className="text-[9px] text-slate-400 truncate">{k.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ── 3. BARRE DE FILES & RECHERCHE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 shadow-xs">
        {/* Onglets de files */}
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

        {/* Champ de recherche & Tri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par client, téléphone (+229...), référence (#10482), produit ou marchand..."
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
                <option value="PRIORITY">Priorité (Urgences & Retards)</option>
                <option value="SCHEDULED_TIME">Heure de relance prévue</option>
                <option value="CALLS_COUNT">Nombre d'appels décroissant</option>
                <option value="NEWEST">Plus récentes</option>
                <option value="AMOUNT_HIGH">Montant COD élevé</option>
              </select>
            </div>
          </div>
        </div>

        {/* TIROIR DES FILTRES COMBINATOIRES */}
        {showFiltersDrawer && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 animate-fade-in-up">
            {/* Marchand */}
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

            {/* Ville / Zone */}
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

            {/* Résultat dernier appel */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Résultat dernier appel
              </label>
              <select
                value={filterLastResult}
                onChange={(e) => setFilterLastResult(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Tous les résultats</option>
                <option value="NONE">Aucun appel passé</option>
                <option value="NO_ANSWER">Sans réponse</option>
                <option value="CALLBACK_REQUESTED">Demande de rappel</option>
                <option value="CONTACT_ESTABLISHED">Contact établi</option>
                <option value="CLIENT_REFUSED">Refus client</option>
                <option value="WRONG_NUMBER">Numéro erroné</option>
              </select>
            </div>

            {/* Niveau d'urgence */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Échéance</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Toutes les échéances</option>
                <option value="OVERDUE">En retard uniquement</option>
                <option value="TODAY">Aujourd'hui uniquement</option>
                <option value="NORMAL">Rappels ultérieurs</option>
              </select>
            </div>

            {/* Bouton Réinitialiser */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-200/60 mt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredOrders.length} relance(s) trouvée(s).
              </span>
              <button
                onClick={handleResetFilters}
                className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                Réinitialiser les filtres
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
            {filterLastResult !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Résultat : {filterLastResult}
                <button onClick={() => setFilterLastResult("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterPriority !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Échéance : {filterPriority}
                <button onClick={() => setFilterPriority("ALL")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {/* ── 4. LISTE OPÉRATIONNELLE DES APPELS & RELANCES ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1020px]">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Priorité & Échéance</th>
                <th className="px-4 py-3 text-left">Client & Contact</th>
                <th className="px-4 py-3 text-left">Commande & Montant</th>
                <th className="px-4 py-3 text-left">Marchand & Zone</th>
                <th className="px-4 py-3 text-center">Tentatives</th>
                <th className="px-4 py-3 text-left">Dernier résultat & Note</th>
                <th className="px-4 py-3 text-left">Prochaine action</th>
                <th className="px-4 py-3 text-right">Actions rapides</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((o) => {
                const isOverdue = isDateOverdue(o.scheduledCallback, o.status);
                const isToday = isDateToday(o.scheduledCallback);

                return (
                  <tr
                    key={o.id}
                    className={`hover:bg-slate-50/70 transition-colors group ${
                      isOverdue ? "bg-rose-50/30" : isToday ? "bg-orange-50/20" : ""
                    }`}
                  >
                    {/* Priorité & Échéance */}
                    <td className="px-4 py-3.5">
                      <div>
                        {getCallPriorityBadge(o)}
                        {o.scheduledCallback && (
                          <p className="text-[10px] font-mono text-slate-500 mt-1 font-semibold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            {o.scheduledCallback.slice(0, 10)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Client & Téléphone */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{o.clientName}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <a
                            href={`tel:${o.clientPhone}`}
                            className="hover:underline hover:text-slate-900 font-bold"
                            title="Lancer l'appel"
                          >
                            {o.clientPhone}
                          </a>
                          <button
                            onClick={() => handleCopyPhone(o.id, o.clientPhone)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Copier"
                          >
                            {copiedPhoneId === o.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Commande & Montant */}
                    <td className="px-4 py-3.5">
                      <div>
                        <button
                          onClick={() => setSelectedOrderForDetail(o)}
                          className="font-mono font-black text-slate-900 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {o.orderNumber}
                        </button>
                        <p className="font-semibold text-slate-800 truncate max-w-[140px] text-[11px] mt-0.5">
                          {o.products}
                        </p>
                        <p className="font-black text-slate-900 text-[11px]">{formatCFA(o.totalPrice)}</p>
                      </div>
                    </td>

                    {/* Marchand & Zone */}
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-medium text-slate-700 block truncate max-w-[110px]">
                          {o.partnerName || "—"}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          {o.city}
                        </span>
                      </div>
                    </td>

                    {/* Tentatives */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            (o.callCount || 0) >= 3
                              ? "bg-rose-100 text-rose-800"
                              : (o.callCount || 0) > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {o.callCount || 0}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          {(o.callCount || 0) === 1 ? "tentative" : "tentatives"}
                        </span>
                      </div>
                    </td>

                    {/* Dernier résultat & Note */}
                    <td className="px-4 py-3.5">
                      <div className="max-w-[180px]">
                        {getLastResultBadge(o.lastCallResult)}
                        {o.closingNotes ? (
                          <p className="text-[10px] text-slate-600 truncate mt-1 italic" title={o.closingNotes}>
                            "{o.closingNotes}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-1">Aucune note consignée</p>
                        )}
                      </div>
                    </td>

                    {/* Prochaine action */}
                    <td className="px-4 py-3.5">
                      {o.status === "CONFIRMEE" ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Commande validée
                        </span>
                      ) : o.scheduledCallback ? (
                        <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-orange-500" />
                          <span>Rappel prévu</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 text-amber-600" />
                          Premier contact
                        </span>
                      )}
                    </td>

                    {/* Actions rapides */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Appeler & enregistrer */}
                        <button
                          onClick={() => {
                            setOrderForCall(o);
                            setCallResult("CONTACT_ESTABLISHED");
                            setCallNote("");
                            setCallDeliverySlot("");
                            setCallScheduledDate("2026-09-06");
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                          title="Lancer l'appel et enregistrer le résultat"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>

                        {/* Programmer / Reporter */}
                        <button
                          onClick={() => {
                            setOrderForReschedule(o);
                            setRescheduleDate("2026-09-06");
                            setRescheduleTimeSlot("16h00");
                            setRescheduleNote("");
                          }}
                          className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer shadow-2xs"
                          title="Programmer ou reporter une relance"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>

                        {/* Confirmer la commande */}
                        {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") && (
                          <button
                            onClick={() => setOrderForConfirm(o)}
                            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                            title="Confirmer la commande"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Annuler */}
                        {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") && (
                          <button
                            onClick={() => {
                              setOrderForCancel(o);
                              setCancelReason("Client refuse la commande / Changement d'avis");
                              setCancelDetails("");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Annuler la commande"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Détails */}
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <PhoneOff className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">Aucun appel ou relance dans cette file</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Toutes les relances de cette catégorie ont été traitées avec succès !
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Réinitialiser la vue
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de liste */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <span>
            Affichage de <strong>{filteredOrders.length}</strong> relance(s)
          </span>
          <span className="text-[11px] text-slate-400">Synchronisation immédiate avec le Command Center</span>
        </div>
      </div>

      {/* ========================================================
          5. MODALE : APPEL & QUALIFICATION IMMÉDIATE
      ======================================================== */}
      {orderForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Appel & Qualification Client</h3>
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

            {/* Téléphone & Bouton Appel */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Numéro de téléphone</span>
                <span className="font-mono font-black text-slate-900 text-sm">{orderForCall.clientPhone}</span>
              </div>
              <a
                href={`tel:${orderForCall.clientPhone}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Lancer l'appel
              </a>
            </div>

            {/* Qualification du résultat */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Résultat réel de l'appel *
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: "CONTACT_ESTABLISHED",
                    label: "Client joint — Commande confirmée",
                    icon: CheckCircle2,
                    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
                    desc: "La commande passera directement en CONFIRMÉE",
                  },
                  {
                    id: "NO_ANSWER",
                    label: "Sans réponse / Injoignable",
                    icon: PhoneOff,
                    cls: "text-amber-700 bg-amber-50 border-amber-200",
                    desc: "Incrémente le compteur de tentatives",
                  },
                  {
                    id: "CALLBACK_REQUESTED",
                    label: "Demande de rappel / Report",
                    icon: CalendarClock,
                    cls: "text-orange-700 bg-orange-50 border-orange-200",
                    desc: "Permet de choisir une date et heure de relance",
                  },
                  {
                    id: "WRONG_NUMBER",
                    label: "Numéro erroné ou inexistant",
                    icon: AlertTriangle,
                    cls: "text-rose-700 bg-rose-50 border-rose-200",
                    desc: "Passe la commande en ANNULÉE",
                  },
                  {
                    id: "CLIENT_REFUSED",
                    label: "Client refuse la commande",
                    icon: XCircle,
                    cls: "text-rose-700 bg-rose-50 border-rose-200",
                    desc: "Passe la commande en ANNULÉE",
                  },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setCallResult(res.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      callResult === res.id
                        ? `ring-2 ring-slate-900 ${res.cls}`
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <res.icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{res.label}</p>
                      <p className="text-[10px] font-normal text-slate-500">{res.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Si rappel demandé */}
              {callResult === "CALLBACK_REQUESTED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-orange-50/50 border border-orange-200 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Date du rappel
                    </label>
                    <input
                      type="date"
                      value={callScheduledDate}
                      onChange={(e) => setCallScheduledDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Créneau / Heure
                    </label>
                    <input
                      type="text"
                      value={callDeliverySlot}
                      onChange={(e) => setCallDeliverySlot(e.target.value)}
                      placeholder="Ex: 16h30 ou matin"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Note d'interaction
                </label>
                <textarea
                  value={callNote}
                  onChange={(e) => setCallNote(e.target.value)}
                  placeholder="Notes sur les exigences client, disponibilité..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleSaveCallInteraction}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Enregistrer le résultat
              </button>
              <button
                onClick={() => setOrderForCall(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODALE : PROGRAMMER OU REPORTER UNE RELANCE
      ======================================================== */}
      {orderForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Programmer une relance</h3>
                  <p className="text-[11px] text-slate-500">{orderForReschedule.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderForReschedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">Client : <strong className="text-slate-900">{orderForReschedule.clientName}</strong></p>
              <p className="text-slate-500">Téléphone : <strong className="text-slate-900 font-mono">{orderForReschedule.clientPhone}</strong></p>
              {orderForReschedule.scheduledCallback && (
                <p className="text-rose-600 font-semibold pt-1">
                  Échéance précédente : {orderForReschedule.scheduledCallback.slice(0, 10)}
                </p>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Date de rappel *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Créneau horaire *</label>
                  <select
                    value={rescheduleTimeSlot}
                    onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 font-semibold"
                  >
                    <option value="09h30">09h30 (Matin)</option>
                    <option value="11h00">11h00 (Midi)</option>
                    <option value="14h30">14h30 (Début d'après-midi)</option>
                    <option value="16h00">16h00 (Fin d'après-midi)</option>
                    <option value="18h00">18h00 (Soirée)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Instruction / Note de relance
                </label>
                <textarea
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="Ex : Rappeler après sa réunion du matin..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:border-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleSaveReschedule}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black hover:bg-orange-700 transition-colors cursor-pointer shadow-xs"
              >
                Confirmer la programmation
              </button>
              <button
                onClick={() => setOrderForReschedule(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. MODALE : CONFIRMATION DIRECTE
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

            <p className="text-xs text-slate-600">
              Voulez-vous valider et confirmer la commande de <strong>{orderForConfirm.clientName}</strong> ({formatCFA(orderForConfirm.totalPrice)}) ? Elle sera prête pour l'affectation de coursier.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Confirmer la commande
              </button>
              <button
                onClick={() => setOrderForConfirm(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. MODALE : ANNULATION AVEC MOTIF
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

            <div className="space-y-3 text-xs">
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
                  <option value="Client a déjà acheté ailleurs">Client a déjà acheté ailleurs</option>
                  <option value="Autre motif">Autre motif</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Précisions
                </label>
                <textarea
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  placeholder="Détails pour le marchand..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Confirmer l'annulation
              </button>
              <button
                onClick={() => setOrderForCancel(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          9. TIROIR LATÉRAL : DÉTAIL RAPIDE & HISTORIQUE D'APPELS
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
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-base">
                    {selectedOrderForDetail.orderNumber}
                  </span>
                  {getCallPriorityBadge(selectedOrderForDetail)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marchand : {selectedOrderForDetail.partnerName || "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1 text-xs">
              {/* Client */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Coordonnées Client</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom :</span>
                  <strong className="text-slate-900">{selectedOrderForDetail.clientName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Téléphone :</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${selectedOrderForDetail.clientPhone}`} className="font-mono font-bold underline text-slate-900">
                      {selectedOrderForDetail.clientPhone}
                    </a>
                    <button
                      onClick={() => handleCopyPhone(selectedOrderForDetail.id, selectedOrderForDetail.clientPhone)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zone :</span>
                  <span className="font-medium text-slate-800">{selectedOrderForDetail.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Adresse :</span>
                  <span className="text-slate-700 text-right max-w-[200px]">{selectedOrderForDetail.address}</span>
                </div>
              </div>

              {/* Colis */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Articles & Montant COD</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Article(s) :</span>
                  <strong className="text-slate-900">{selectedOrderForDetail.products}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant COD :</span>
                  <strong className="text-slate-900 text-sm font-mono">{formatCFA(selectedOrderForDetail.totalPrice)}</strong>
                </div>
              </div>

              {/* Suivi Commercial */}
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200 space-y-2.5">
                <p className="text-[10px] font-extrabold uppercase text-orange-800">Suivi Téléphonique</p>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Nombre de tentatives :</span>
                  <span className="font-black px-2 py-0.5 rounded-full bg-white text-slate-900 border border-orange-200">
                    {selectedOrderForDetail.callCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Dernier résultat :</span>
                  {getLastResultBadge(selectedOrderForDetail.lastCallResult)}
                </div>
                {selectedOrderForDetail.scheduledCallback && (
                  <div className="flex justify-between items-center pt-1 border-t border-orange-200/60">
                    <span className="text-slate-600">Prochaine relance :</span>
                    <span className="font-bold text-orange-900 font-mono">
                      {selectedOrderForDetail.scheduledCallback.slice(0, 10)}
                    </span>
                  </div>
                )}
                {selectedOrderForDetail.closingNotes && (
                  <div className="pt-1 text-slate-700 italic text-[11px] bg-white p-2.5 rounded-xl border border-orange-100">
                    "{selectedOrderForDetail.closingNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Actions depuis le Drawer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white sticky bottom-0">
              <button
                onClick={() => {
                  const ord = selectedOrderForDetail;
                  setSelectedOrderForDetail(null);
                  setOrderForCall(ord);
                  setCallResult("CONTACT_ESTABLISHED");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Appeler client
              </button>
              <button
                onClick={() => {
                  const ord = selectedOrderForDetail;
                  setSelectedOrderForDetail(null);
                  setOrderForReschedule(ord);
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Programmer relance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
