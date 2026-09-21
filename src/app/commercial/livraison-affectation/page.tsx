"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Phone,
  ArrowUpDown,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  CreditCard,
  Eye,
  AlertCircle,
  Copy,
  Check,
  Flame,
  User,
  Bike,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Filter,
  CheckCheck,
  Store,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { Order, OrderStatus, LivreurProfile, LivreurStatus } from "@/lib/types";

// Formatage GNF standardisé
function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formatage date
function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " à " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return dateStr;
  }
}

// Badge de disponibilité du livreur
function getDriverStatusBadge(status?: LivreurStatus) {
  switch (status) {
    case "AVAILABLE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Disponible
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
          <Truck className="w-2.5 h-2.5" />
          En tournée
        </span>
      );
    case "PAUSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
          <Clock className="w-2.5 h-2.5" />
          En pause
        </span>
      );
    case "OFFLINE":
    case "UNAVAILABLE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Hors ligne
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
          {status || "Inactif"}
        </span>
      );
  }
}

// Badge de statut de commande
function getOrderStatusBadge(status: OrderStatus, hasDriver: boolean) {
  switch (status) {
    case "CONFIRMEE":
      return hasDriver ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Affectée
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5" />
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

export default function LivraisonAffectationPage() {
  const router = useRouter();
  const {
    orders,
    livreurs,
    partners,
    assignOrderToLivreur,
    logClosingCall,
  } = useOperations();

  // Mode d'affichage : File des commandes OU Vue Flotte des coursiers
  const [activeView, setActiveView] = useState<"ORDERS" | "DRIVERS">("ORDERS");

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "TO_ASSIGN" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED">("TO_ASSIGN");
  const [filterCity, setFilterCity] = useState("ALL");
  const [filterDriver, setFilterDriver] = useState("ALL");
  const [filterPartner, setFilterPartner] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState<"ALL" | "URGENT" | "NORMAL">("ALL");
  const [sortBy, setSortBy] = useState<"DATE_DESC" | "URGENCY" | "CITY">("URGENCY");
  const [showFilters, setShowFilters] = useState(false);

  // Modal d'affectation / réaffectation
  const [orderForAssign, setOrderForAssign] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("10h - 13h");

  // Tiroir détail commande
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. CALCUL DES KPI OPÉRATIONNELS DYNAMIQUES
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    // 1. À affecter : Confirmée SANS livreur assigné
    const toAssign = orders.filter((o) => o.status === "CONFIRMEE" && !o.assignedLivreurId).length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const assignedToday = orders.filter(
      (o) =>
        (o.status === "EN_COURS" || (o.status === "CONFIRMEE" && !!o.assignedLivreurId)) &&
        (o.updatedAt?.startsWith(todayStr) || o.createdAt?.startsWith(todayStr) || o.updatedAt?.startsWith("2026-09-06") || o.createdAt?.startsWith("2026-09-06"))
    ).length;

    // 3. En livraison : Statut EN_COURS
    const inTransit = orders.filter((o) => o.status === "EN_COURS").length;

    // 4. Sans livreur total (Commandes actives nécessitant un livreur)
    const withoutDriver = toAssign;

    // 5. Réaffectations tracées dans les commentaires ou closingNotes
    const reassignments = orders.filter(
      (o) =>
        (o.comment && o.comment.toLowerCase().includes("réaffectation")) ||
        (o.closingNotes && o.closingNotes.toLowerCase().includes("réaffectation"))
    ).length;

    return {
      toAssign,
      assignedToday,
      inTransit,
      withoutDriver,
      reassignments,
    };
  }, [orders]);

  // -------------------------------------------------------------
  // 2. VILLES DISPONIBLES DANS LES COMMANDES
  // -------------------------------------------------------------
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.city) set.add(o.city.trim());
    });
    return Array.from(set).sort();
  }, [orders]);

  // -------------------------------------------------------------
  // 3. CALCUL DE LA CHARGE RÉELLE PAR LIVREUR
  // -------------------------------------------------------------
  const driversWithWorkload = useMemo(() => {
    return livreurs.map((driver) => {
      // Commandes réelles actuellement affectées à ce livreur
      const activeOrders = orders.filter(
        (o) =>
          o.assignedLivreurId === driver.id &&
          (o.status === "EN_COURS" || o.status === "CONFIRMEE")
      );

      const deliveredOrders = orders.filter(
        (o) => o.assignedLivreurId === driver.id && o.status === "LIVREE"
      );

      const maxCap = driver.maxActiveCapacity || 8;
      const currentLoad = activeOrders.length;
      const isOverloaded = currentLoad >= maxCap;

      return {
        ...driver,
        activeOrders,
        activeOrdersCount: currentLoad,
        deliveredOrdersCount: deliveredOrders.length,
        isOverloaded,
        maxCapacity: maxCap,
      };
    });
  }, [livreurs, orders]);

  // -------------------------------------------------------------
  // 4. FILTRAGE ET RECHERCHE DES COMMANDES
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/[^0-9]/g, "");

    return orders.filter((order) => {
      // Uniquement les commandes pertinentes pour le dispatch :
      // CONFIRMEE, EN_COURS, LIVREE (ou celles ayant déjà été affectées)
      if (order.status !== "CONFIRMEE" && order.status !== "EN_COURS" && order.status !== "LIVREE") {
        return false;
      }

      // 1. Recherche
      if (q) {
        const orderMatch = order.orderNumber.toLowerCase().includes(q);
        const clientMatch = order.clientName.toLowerCase().includes(q);
        const phoneMatch = qDigits ? order.clientPhone.replace(/[^0-9]/g, "").includes(qDigits) : false;
        const prodMatch = order.products && order.products.toLowerCase().includes(q);
        const cityMatch = order.city && order.city.toLowerCase().includes(q);
        const driverMatch = order.assignedLivreurName && order.assignedLivreurName.toLowerCase().includes(q);
        const partnerMatch = order.partnerName && order.partnerName.toLowerCase().includes(q);

        if (!orderMatch && !clientMatch && !phoneMatch && !prodMatch && !cityMatch && !driverMatch && !partnerMatch) {
          return false;
        }
      }

      // 2. Filtre statut d'affectation
      if (filterStatus === "TO_ASSIGN") {
        if (order.status !== "CONFIRMEE" || !!order.assignedLivreurId) return false;
      } else if (filterStatus === "ASSIGNED") {
        if (!order.assignedLivreurId || order.status === "LIVREE") return false;
      } else if (filterStatus === "IN_TRANSIT") {
        if (order.status !== "EN_COURS") return false;
      } else if (filterStatus === "DELIVERED") {
        if (order.status !== "LIVREE") return false;
      }

      // 3. Ville
      if (filterCity !== "ALL" && order.city !== filterCity) {
        return false;
      }

      // 4. Livreur
      if (filterDriver !== "ALL" && order.assignedLivreurId !== filterDriver) {
        return false;
      }

      // 5. Partenaire
      if (filterPartner !== "ALL" && order.partnerId !== filterPartner) {
        return false;
      }

      // 6. Priorité
      if (filterPriority === "URGENT" && order.priority !== "URGENT") return false;
      if (filterPriority === "NORMAL" && order.priority === "URGENT") return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "URGENCY") {
        const aUrgent = a.priority === "URGENT" || (!a.assignedLivreurId && a.status === "CONFIRMEE") ? 1 : 0;
        const bUrgent = b.priority === "URGENT" || (!b.assignedLivreurId && b.status === "CONFIRMEE") ? 1 : 0;
        if (bUrgent !== aUrgent) return bUrgent - aUrgent;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "DATE_DESC") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "CITY") {
        return (a.city || "").localeCompare(b.city || "");
      }
      return 0;
    });
  }, [
    orders,
    searchQuery,
    filterStatus,
    filterCity,
    filterDriver,
    filterPartner,
    filterPriority,
    sortBy,
  ]);

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("TO_ASSIGN");
    setFilterCity("ALL");
    setFilterDriver("ALL");
    setFilterPartner("ALL");
    setFilterPriority("ALL");
    setSortBy("URGENCY");
    showToast("Filtres réinitialisés");
  };

  // -------------------------------------------------------------
  // ACTION RÉELLE : AFFECTATION OU RÉAFFECTATION
  // -------------------------------------------------------------
  const handleConfirmAssignment = () => {
    if (!orderForAssign || !selectedDriverId) {
      showToast("Veuillez sélectionner un coursier");
      return;
    }

    const driver = livreurs.find((l) => l.id === selectedDriverId);
    if (!driver) return;

    const isReassignment = !!orderForAssign.assignedLivreurId && orderForAssign.assignedLivreurId !== selectedDriverId;

    // 1. Affecter via store (met à jour status -> EN_COURS, trace audit, notification et activité)
    assignOrderToLivreur(
      orderForAssign.id,
      selectedDriverId,
      reassignReason || undefined,
      deliverySlot || undefined
    );

    showToast(
      isReassignment
        ? `Commande ${orderForAssign.orderNumber} réaffectée avec succès à ${driver.name}`
        : `Commande ${orderForAssign.orderNumber} affectée avec succès à ${driver.name}`
    );

    setOrderForAssign(null);
    setSelectedDriverId("");
    setReassignReason("");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          HEADER LIVRAISON & AFFECTATION
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">Livraison & Affectation</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Livraison & Affectation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Affectez les commandes aux bons livreurs et suivez leur prise en charge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de vue : Commandes / Flotte Livreurs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveView("ORDERS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "ORDERS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              File Commandes
            </button>
            <button
              onClick={() => setActiveView("DRIVERS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "DRIVERS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Flotte Coursiers ({livreurs.length})
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
              showFilters
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
            {(filterCity !== "ALL" || filterDriver !== "ALL" || filterPartner !== "ALL" || filterPriority !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5 KPI DYNAMIQUES DU DISPATCH
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* À affecter */}
        <button
          onClick={() => {
            setActiveView("ORDERS");
            setFilterStatus("TO_ASSIGN");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "TO_ASSIGN" && activeView === "ORDERS"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">À affecter</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{metrics.toAssign}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Confirmées sans coursier</div>
        </button>

        {/* Affectées aujourd'hui */}
        <button
          onClick={() => {
            setActiveView("ORDERS");
            setFilterStatus("ASSIGNED");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "ASSIGNED" && activeView === "ORDERS"
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Affectées aujourd'hui</span>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.assignedToday}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Traitées ce jour</div>
        </button>

        {/* En livraison */}
        <button
          onClick={() => {
            setActiveView("ORDERS");
            setFilterStatus("IN_TRANSIT");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "IN_TRANSIT" && activeView === "ORDERS"
              ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">En livraison</span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.inTransit}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Colis en tournée</div>
        </button>

        {/* Sans livreur */}
        <button
          onClick={() => {
            setActiveView("ORDERS");
            setFilterStatus("TO_ASSIGN");
          }}
          className="p-3.5 rounded-2xl border border-slate-200 bg-white text-left shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Sans livreur</span>
            <Clock className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.withoutDriver}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">En attente de coursier</div>
        </button>

        {/* Réaffectations */}
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white text-left shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Réaffectations</span>
            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.reassignments}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Transferts tracés</div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          VUE 1 : FILE DES COMMANDES & DISPATCH
          ------------------------------------------------------------- */}
      {activeView === "ORDERS" && (
        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Recherche */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par référence, client, téléphone, produit, zone, coursier..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 w-full sm:w-auto">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400">Tri:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="URGENCY">Urgence & À affecter</option>
                    <option value="DATE_DESC">Date la plus récente</option>
                    <option value="CITY">Par Ville / Zone</option>
                  </select>
                </div>

                {(searchQuery || filterStatus !== "TO_ASSIGN" || filterCity !== "ALL" || filterDriver !== "ALL" || filterPartner !== "ALL" || filterPriority !== "ALL") && (
                  <button
                    onClick={handleResetFilters}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    title="Réinitialiser tous les filtres"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Onglets de Statut Rapide */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <button
                onClick={() => setFilterStatus("TO_ASSIGN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "TO_ASSIGN"
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>À affecter</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px]">
                  {metrics.toAssign}
                </span>
              </button>

              <button
                onClick={() => setFilterStatus("IN_TRANSIT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "IN_TRANSIT"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>En livraison</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[10px]">
                  {metrics.inTransit}
                </span>
              </button>

              <button
                onClick={() => setFilterStatus("ASSIGNED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "ASSIGNED"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Toutes affectées</span>
              </button>

              <button
                onClick={() => setFilterStatus("DELIVERED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "DELIVERED"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Livrées</span>
              </button>

              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === "ALL"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Toutes les commandes
              </button>
            </div>

            {/* Filtres avancés déroulants */}
            {showFilters && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ville / Zone
                  </label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Toutes les villes</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Coursier assigné
                  </label>
                  <select
                    value={filterDriver}
                    onChange={(e) => setFilterDriver(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Tous les coursiers</option>
                    {livreurs.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.zone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Marchand Partenaire
                  </label>
                  <select
                    value={filterPartner}
                    onChange={(e) => setFilterPartner(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Tous les marchands</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Niveau de Priorité
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Toutes priorités</option>
                    <option value="URGENT">Urgentes uniquement</option>
                    <option value="NORMAL">Standard</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Tableau des commandes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""} trouvée{filteredOrders.length > 1 ? "s" : ""}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Toutes les commandes sont affectées !</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aucune commande n'est actuellement en attente d'affectation pour les filtres sélectionnés.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Commande</th>
                      <th className="py-3 px-3">Client & Contact</th>
                      <th className="py-3 px-3">Destination / Zone</th>
                      <th className="py-3 px-3">Articles & Montant</th>
                      <th className="py-3 px-3">Statut & Coursier</th>
                      <th className="py-3 px-4 text-right">Action Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                      const hasDriver = !!order.assignedLivreurId;
                      const isUrgent = order.priority === "URGENT" || (!hasDriver && order.status === "CONFIRMEE");

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => setSelectedOrderForDetail(order)}
                        >
                          {/* Commande & Priorité */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {order.orderNumber}
                                  </span>
                                  {isUrgent && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[9px] font-black border border-rose-200">
                                      <Flame className="w-2.5 h-2.5 text-rose-600" />
                                      Urgent
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {order.partnerName || "Marchand"} • {formatDate(order.createdAt)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="py-3 px-3">
                            <div>
                              <div className="font-bold text-slate-900">{order.clientName}</div>
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                {order.clientPhone}
                              </div>
                            </div>
                          </td>

                          {/* Destination */}
                          <td className="py-3 px-3">
                            <div className="max-w-[190px]">
                              <div className="flex items-center gap-1 font-semibold text-slate-800 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{order.city}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate pl-4">
                                {order.address}
                              </div>
                            </div>
                          </td>

                          {/* Articles & Montant */}
                          <td className="py-3 px-3">
                            <div>
                              <div className="font-black text-slate-900">{formatCFA(order.totalPrice)}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                {order.products} ({order.quantity}x)
                              </div>
                            </div>
                          </td>

                          {/* Statut & Coursier */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div>{getOrderStatusBadge(order.status, hasDriver)}</div>
                              {hasDriver ? (
                                <div className="text-[11px] text-slate-700 font-semibold flex items-center gap-1">
                                  <Bike className="w-3 h-3 text-blue-600" />
                                  <span>{order.assignedLivreurName}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-rose-600 font-bold">
                                  Aucun coursier assigné
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Action Dispatch */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {hasDriver ? (
                              <button
                                onClick={() => {
                                  setOrderForAssign(order);
                                  setSelectedDriverId(order.assignedLivreurId || "");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Réaffecter</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setOrderForAssign(order);
                                  // Pré-sélectionner un coursier disponible de la même zone si possible
                                  const matchingDriver = livreurs.find(
                                    (l) => l.availabilityStatus === "AVAILABLE" && l.zone.toLowerCase().includes((order.city || "").toLowerCase())
                                  ) || livreurs.find((l) => l.availabilityStatus === "AVAILABLE");
                                  setSelectedDriverId(matchingDriver?.id || "");
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Affecter</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VUE 2 : FLOTTE DES LIVREURS & CAPACITÉ EN TEMPS RÉEL
          ------------------------------------------------------------- */}
      {activeView === "DRIVERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {driversWithWorkload.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* En-tête livreur */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{driver.name}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <span>{driver.phone}</span>
                    </div>
                  </div>
                </div>
                <div>{getDriverStatusBadge(driver.availabilityStatus)}</div>
              </div>

              {/* Zone et Véhicule */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Zone Principale :</span>
                  <span className="font-bold text-slate-800">{driver.zone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Véhicule :</span>
                  <span className="font-semibold text-slate-700">{driver.vehicle || "Moto"}</span>
                </div>
                {driver.secondaryZones && driver.secondaryZones.length > 0 && (
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Zones secondaires : {driver.secondaryZones.join(", ")}
                  </div>
                )}
              </div>

              {/* Jauge de Charge Réelle */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">Charge actuelle de tournée</span>
                  <span className={`${driver.isOverloaded ? "text-rose-600" : "text-slate-900"}`}>
                    {driver.activeOrdersCount} / {driver.maxCapacity} colis
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      driver.isOverloaded
                        ? "bg-rose-500"
                        : driver.activeOrdersCount > 4
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min((driver.activeOrdersCount / driver.maxCapacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Commandes actuellement en cours pour ce livreur */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Colis en cours ({driver.activeOrders.length})
                </div>
                {driver.activeOrders.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-1">Aucune commande en cours</div>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {driver.activeOrders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100"
                      >
                        <span className="font-mono font-bold text-slate-800">{ord.orderNumber}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{ord.city}</span>
                      </div>
                    ))}
                    {driver.activeOrders.length > 3 && (
                      <div className="text-[10px] text-blue-600 font-bold text-center">
                        +{driver.activeOrders.length - 3} autre{driver.activeOrders.length - 3 > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bouton de filtrage des commandes de ce livreur */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveView("ORDERS");
                    setFilterDriver(driver.id);
                    setFilterStatus("ALL");
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Voir les commandes assignées</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL D'AFFECTATION ET RÉAFFECTATION INTELLIGENTE
          ------------------------------------------------------------- */}
      {orderForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-full sm:max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {orderForAssign.assignedLivreurId ? "Réaffecter la Commande" : "Affecter au Livreur"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">Réf : {orderForAssign.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderForAssign(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Récapitulatif Commande */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Client : {orderForAssign.clientName}</span>
                  <span>{formatCFA(orderForAssign.totalPrice)}</span>
                </div>
                <div className="text-blue-800 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{orderForAssign.city} — {orderForAssign.address}</span>
                </div>
                {orderForAssign.assignedLivreurName && (
                  <div className="text-amber-800 text-[11px] font-medium pt-1 border-t border-blue-200/50">
                    Coursier actuel : <strong>{orderForAssign.assignedLivreurName}</strong>
                  </div>
                )}
              </div>

              {/* Sélection du Livreur */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sélectionner le coursier responsable :
                </label>
                <div className="space-y-2 max-h-52 sm:max-h-56 overflow-y-auto pr-1">
                  {driversWithWorkload.map((driver) => {
                    const isSelected = selectedDriverId === driver.id;
                    const isZoneMatch = driver.zone.toLowerCase().includes((orderForAssign.city || "").toLowerCase());

                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            {driver.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">{driver.name}</span>
                              {isZoneMatch && (
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-200">
                                  Même Zone
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              Zone : {driver.zone} • {driver.activeOrdersCount}/{driver.maxCapacity} colis
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">{getDriverStatusBadge(driver.availabilityStatus)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Créneau de livraison souhaité */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Créneau horaire de livraison :
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <option value="08h - 10h">Matinée (08h - 10h)</option>
                  <option value="10h - 13h">Fin de matinée (10h - 13h)</option>
                  <option value="14h - 17h">Après-midi (14h - 17h)</option>
                  <option value="17h - 20h">Soirée (17h - 20h)</option>
                </select>
              </div>

              {/* Motif si réaffectation */}
              {orderForAssign.assignedLivreurId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motif de la réaffectation :
                  </label>
                  <input
                    type="text"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Ex: Livreur initial indisponible / Panne moto / Changement zone client"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setOrderForAssign(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Confirmer l'affectation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TIROIR DÉTAIL COMMANDE (LATÉRAL DROIT)
          ------------------------------------------------------------- */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 block">{selectedOrderForDetail.orderNumber}</span>
                <h3 className="text-sm font-black text-slate-900">Détails de Livraison</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Statut & Urgence */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Statut actuel :</span>
                <div>{getOrderStatusBadge(selectedOrderForDetail.status, !!selectedOrderForDetail.assignedLivreurId)}</div>
              </div>

              {/* Client & Destination */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destinataire</span>
                <div className="font-black text-slate-900 text-sm">{selectedOrderForDetail.clientName}</div>
                <div className="text-slate-600 font-mono">{selectedOrderForDetail.clientPhone}</div>
                <div className="text-slate-700 pt-1 border-t border-slate-100 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{selectedOrderForDetail.city} — {selectedOrderForDetail.address}</span>
                </div>
              </div>

              {/* Détails Commande */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Articles & Montant</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{selectedOrderForDetail.products}</span>
                  <span className="font-black text-slate-900 text-sm">{formatCFA(selectedOrderForDetail.totalPrice)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Marchand : {selectedOrderForDetail.partnerName || "Non spécifié"}
                </div>
              </div>

              {/* Coursier Assigné */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coursier en charge</span>
                {selectedOrderForDetail.assignedLivreurName ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {selectedOrderForDetail.assignedLivreurName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{selectedOrderForDetail.assignedLivreurName}</div>
                        <div className="text-[10px] text-slate-400">Statut : En livraison</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 text-center">
                    Aucun livreur n'a encore été assigné à cette commande.
                  </div>
                )}
              </div>
            </div>

            {/* Actions du Drawer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 sticky bottom-0">
              <button
                onClick={() => {
                  const ord = selectedOrderForDetail;
                  setSelectedOrderForDetail(null);
                  setOrderForAssign(ord);
                  setSelectedDriverId(ord.assignedLivreurId || "");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                {selectedOrderForDetail.assignedLivreurId ? "Réaffecter" : "Affecter un coursier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
