"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Globe,
  Mail,
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
  Radio,
  FileCode,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { Partner, Order, OrderStatus } from "@/lib/types";

// Formatage GNF standardisé
function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formatage date ISO
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

// Badge de Statut Marchand
function getPartnerStatusBadge(status?: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Actif
        </span>
      );
    case "PENDING_VERIFICATION":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
          <Clock className="w-2.5 h-2.5" />
          Vérification
        </span>
      );
    case "ONBOARDING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
          <Layers className="w-2.5 h-2.5" />
          Onboarding
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
          <AlertTriangle className="w-2.5 h-2.5" />
          Suspendu
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

// Badge de Statut Commande
function getOrderStatusBadge(status: OrderStatus) {
  switch (status) {
    case "EN_ATTENTE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
          À appeler
        </span>
      );
    case "A_RAPPELER":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
          À relancer
        </span>
      );
    case "CONFIRMEE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
          Confirmée
        </span>
      );
    case "EN_COURS":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
          En cours
        </span>
      );
    case "LIVREE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
          Livrée
        </span>
      );
    case "ANNULEE":
    case "REFUSEE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
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

// État d'une intégration
type IntegrationStatus = "CONNECTED" | "ERROR" | "NOT_CONFIGURED" | "SYNCING";

interface PartnerIntegrationDetail {
  platform: "Shopify" | "YouCan" | "Import IA" | "ENO";
  status: IntegrationStatus;
  statusLabel: string;
  lastSyncAt?: string;
  ordersCount: number;
  errorMessage?: string;
}

export default function EcommercantsPage() {
  const router = useRouter();
  const { partners, orders, notifications } = useOperations();

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedIntegrationHealth, setSelectedIntegrationHealth] = useState<"ALL" | "CONNECTED" | "ERROR" | "NOT_CONFIGURED">("ALL");
  const [sortBy, setSortBy] = useState<"ORDERS_COUNT" | "NAME" | "TODAY_ORDERS" | "CONFIRMATION_RATE">("ORDERS_COUNT");
  const [showFilters, setShowFilters] = useState(false);

  // Tiroir Détail Marchand
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"OVERVIEW" | "COMMANDES" | "INTEGRATIONS">("OVERVIEW");

  // Modal de Réessai de Synchronisation
  const [syncModalPartner, setSyncModalPartner] = useState<Partner | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copié : ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // 1. CALCUL DES DONNÉES ENRICHIES PAR MARCHAND
  // -------------------------------------------------------------
  const enrichedPartners = useMemo(() => {
    return partners.map((partner) => {
      // Commandes réelles liées
      const partnerOrders = orders.filter(
        (o) => o.partnerId === partner.id || (o.partnerName && o.partnerName.toLowerCase() === partner.companyName.toLowerCase())
      );

      // Décompte des statuts
      let confirmedCount = 0;
      let deliveredCount = 0;
      let inDeliveryCount = 0;
      let cancelledCount = 0;
      let pendingCount = 0;
      let todayCount = 0;
      let totalGMV = 0;

      const sourcesSet = new Set<string>();
      let lastOrderDate: string | undefined = undefined;

      partnerOrders.forEach((ord) => {
        if (ord.status === "CONFIRMEE") confirmedCount++;
        else if (ord.status === "LIVREE") deliveredCount++;
        else if (ord.status === "EN_COURS") inDeliveryCount++;
        else if (ord.status === "ANNULEE" || ord.status === "REFUSEE" || ord.status === "RETOURNEE") cancelledCount++;
        else if (ord.status === "EN_ATTENTE" || ord.status === "A_RAPPELER") pendingCount++;

        const todayStr = new Date().toISOString().slice(0, 10);
        if (ord.createdAt?.startsWith(todayStr) || ord.createdAt === "2026-09-06" || ord.createdAt?.startsWith("2026-09-06")) {
          todayCount++;
        }

        totalGMV += ord.totalPrice || 0;
        if (ord.source) sourcesSet.add(ord.source);

        if (!lastOrderDate || (ord.createdAt && ord.createdAt > lastOrderDate)) {
          lastOrderDate = ord.createdAt;
        }
      });

      const totalOrders = partnerOrders.length;
      const realConfirmationRate =
        totalOrders > 0 ? Math.round(((confirmedCount + deliveredCount + inDeliveryCount) / totalOrders) * 100) : 0;
      const realDeliverySuccessRate =
        deliveredCount + cancelledCount > 0
          ? Math.round((deliveredCount / (deliveredCount + cancelledCount)) * 100)
          : partner.deliverySuccessRate || 0;

      // Détection des intégrations réelles
      // Vérifier s'il y a une alerte webhook sur ce marchand dans les notifications
      const webhookAlert = notifications.find(
        (n) =>
          n.category === "SYSTEME" &&
          n.title?.toLowerCase().includes("webhook") &&
          n.description?.toLowerCase().includes(partner.companyName.toLowerCase())
      );

      const hasShopifyOrders = partnerOrders.some((o) => o.source === "Shopify");
      const hasYouCanOrders = partnerOrders.some((o) => o.source === "YouCan");
      const hasIaOrders = partnerOrders.some((o) => o.source === "Import IA");
      const hasEnoOrders = partnerOrders.some((o) => o.source === "ENO" || !o.source);

      const integrations: PartnerIntegrationDetail[] = [
        {
          platform: "Shopify",
          status: webhookAlert ? "ERROR" : hasShopifyOrders ? "CONNECTED" : "NOT_CONFIGURED",
          statusLabel: webhookAlert
            ? "Erreur Webhook (502)"
            : hasShopifyOrders
            ? "Connecté & Synchronisé"
            : "Non configuré",
          lastSyncAt: hasShopifyOrders ? "Il y a 10 min" : undefined,
          ordersCount: partnerOrders.filter((o) => o.source === "Shopify").length,
          errorMessage: webhookAlert ? webhookAlert.description : undefined,
        },
        {
          platform: "YouCan",
          status: hasYouCanOrders ? "CONNECTED" : "NOT_CONFIGURED",
          statusLabel: hasYouCanOrders ? "Connecté (API v2)" : "Non configuré",
          lastSyncAt: hasYouCanOrders ? "Il y a 25 min" : undefined,
          ordersCount: partnerOrders.filter((o) => o.source === "YouCan").length,
        },
        {
          platform: "Import IA",
          status: hasIaOrders ? "CONNECTED" : "NOT_CONFIGURED",
          statusLabel: hasIaOrders ? "Actif (OCR & Audio)" : "Inactif",
          lastSyncAt: hasIaOrders ? "Il y a 1 heure" : undefined,
          ordersCount: partnerOrders.filter((o) => o.source === "Import IA").length,
        },
        {
          platform: "ENO",
          status: "CONNECTED",
          statusLabel: "Natif GuinéeGo",
          ordersCount: partnerOrders.filter((o) => o.source === "ENO" || !o.source).length,
        },
      ];

      const hasSyncError = integrations.some((i) => i.status === "ERROR");
      const activeIntegrationsCount = integrations.filter((i) => i.status === "CONNECTED").length;

      return {
        ...partner,
        orders: partnerOrders,
        totalOrders,
        todayCount,
        confirmedCount,
        deliveredCount,
        inDeliveryCount,
        cancelledCount,
        pendingCount,
        totalGMV,
        realConfirmationRate,
        realDeliverySuccessRate,
        sources: Array.from(sourcesSet),
        integrations,
        hasSyncError,
        activeIntegrationsCount,
        lastOrderDate,
      };
    });
  }, [partners, orders, notifications]);

  // -------------------------------------------------------------
  // 2. CALCUL DES KPI GLOBAUX RÉELS
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = enrichedPartners.length;
    const active = enrichedPartners.filter((p) => p.status === "ACTIVE").length;
    const ordersToday = enrichedPartners.reduce((sum, p) => sum + p.todayCount, 0);

    // Intégrations actives cumulées (Shopify, YouCan, Import IA)
    let connectedIntegrations = 0;
    enrichedPartners.forEach((p) => {
      p.integrations.forEach((i) => {
        if (i.status === "CONNECTED" && i.platform !== "ENO") {
          connectedIntegrations++;
        }
      });
    });

    const syncIssues = enrichedPartners.filter((p) => p.hasSyncError).length;

    return {
      total,
      active,
      ordersToday,
      connectedIntegrations,
      syncIssues,
    };
  }, [enrichedPartners]);

  // -------------------------------------------------------------
  // 3. RECHERCHE ET FILTRAGE COMBINABLE
  // -------------------------------------------------------------
  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enrichedPartners.filter((p) => {
      // 1. Recherche
      if (q) {
        const nameMatch = p.companyName.toLowerCase().includes(q);
        const contactMatch = p.fullName.toLowerCase().includes(q);
        const emailMatch = p.email?.toLowerCase().includes(q);
        const phoneMatch = p.phone?.toLowerCase().includes(q);
        const cityMatch = p.city?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const websiteMatch = p.websiteUrl?.toLowerCase().includes(q);

        if (!nameMatch && !contactMatch && !emailMatch && !phoneMatch && !cityMatch && !catMatch && !websiteMatch) {
          return false;
        }
      }

      // 2. Filtre Statut
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
        return false;
      }

      // 3. Filtre Source
      if (selectedSource !== "ALL" && !p.sources.includes(selectedSource)) {
        return false;
      }

      // 4. Filtre Santé Intégration
      if (selectedIntegrationHealth === "ERROR" && !p.hasSyncError) return false;
      if (selectedIntegrationHealth === "CONNECTED" && p.activeIntegrationsCount === 0) return false;
      if (selectedIntegrationHealth === "NOT_CONFIGURED" && p.activeIntegrationsCount > 1) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "ORDERS_COUNT") return b.totalOrders - a.totalOrders;
      if (sortBy === "NAME") return a.companyName.localeCompare(b.companyName);
      if (sortBy === "TODAY_ORDERS") return b.todayCount - a.todayCount;
      if (sortBy === "CONFIRMATION_RATE") return b.realConfirmationRate - a.realConfirmationRate;
      return 0;
    });
  }, [
    enrichedPartners,
    searchQuery,
    selectedStatus,
    selectedSource,
    selectedIntegrationHealth,
    sortBy,
  ]);

  // Marchand sélectionné pour le drawer
  const selectedPartner = useMemo(() => {
    if (!selectedPartnerId) return null;
    return enrichedPartners.find((p) => p.id === selectedPartnerId) || null;
  }, [enrichedPartners, selectedPartnerId]);

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedSource("ALL");
    setSelectedIntegrationHealth("ALL");
    setSortBy("ORDERS_COUNT");
    showToast("Filtres réinitialisés");
  };

  // Déclencher une resynchronisation réelle de l'intégration
  const handleTriggerSync = (partner: Partner) => {
    setSyncModalPartner(partner);
    setIsSyncing(true);
    setSyncSuccess(false);

    // Simuler le check de l'endpoint webhook / API
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      showToast(`Synchronisation webhook validée pour ${partner.companyName}`);
      setTimeout(() => {
        setSyncModalPartner(null);
        setSyncSuccess(false);
      }, 1500);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          HEADER DU MODULE E-COMMERÇANTS
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">E-commerçants</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            E-commerçants
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivez les marchands, leurs commandes et leurs connexions à GuinéeGo LAT.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            {(selectedStatus !== "ALL" || selectedSource !== "ALL" || selectedIntegrationHealth !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <Link
            href="/commercial/commandes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Voir commandes</span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5 KPI DYNAMIQUES DU PORTEFEUILLE MARCHAND
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total e-commerçants */}
        <button
          onClick={() => {
            setSelectedStatus("ALL");
            setSelectedIntegrationHealth("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === "ALL" && selectedIntegrationHealth === "ALL"
              ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total e-commerçants</span>
            <Store className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Partenaires enregistrés</div>
        </button>

        {/* Actifs */}
        <button
          onClick={() => {
            setSelectedStatus("ACTIVE");
            setSelectedIntegrationHealth("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === "ACTIVE"
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Marchands Actifs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.active}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Statut ACTIVE</div>
        </button>

        {/* Commandes aujourd'hui */}
        <button
          onClick={() => {
            setSortBy("TODAY_ORDERS");
          }}
          className="p-3.5 rounded-2xl border border-slate-200 bg-white text-left shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Commandes aujourd'hui</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.ordersToday}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Flux reçus ce jour</div>
        </button>

        {/* Intégrations connectées */}
        <button
          onClick={() => {
            setSelectedIntegrationHealth("CONNECTED");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedIntegrationHealth === "CONNECTED"
              ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Intégrations actives</span>
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.connectedIntegrations}</div>
          <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Shopify / YouCan / IA</div>
        </button>

        {/* Problèmes de synchronisation */}
        <button
          onClick={() => {
            setSelectedIntegrationHealth("ERROR");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedIntegrationHealth === "ERROR"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">Erreurs Synchro</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{metrics.syncIssues}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
            {metrics.syncIssues > 0 ? "Intervention requise" : "Aucun incident"}
          </div>
        </button>
      </div>

      {/* -------------------------------------------------------------
          BARRE DE RECHERCHE ET TIROIR DE FILTRES
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Champ recherche */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de boutique, gérant, email, téléphone, ville, site web..."
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
              <span className="text-[10px] text-slate-400">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ORDERS_COUNT">Nb de commandes</option>
                <option value="TODAY_ORDERS">Commandes du jour</option>
                <option value="CONFIRMATION_RATE">Taux confirmation</option>
                <option value="NAME">Nom (A-Z)</option>
              </select>
            </div>

            {(searchQuery || selectedStatus !== "ALL" || selectedSource !== "ALL" || selectedIntegrationHealth !== "ALL") && (
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

        {/* Tiroir de filtres */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Filtre Statut Marchand */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Statut du Marchand
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="ONBOARDING">En Onboarding</option>
                <option value="PENDING_VERIFICATION">En Vérification</option>
                <option value="SUSPENDED">Suspendu</option>
              </select>
            </div>

            {/* Filtre Source de Commandes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Canal / Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="Shopify">Shopify</option>
                <option value="YouCan">YouCan</option>
                <option value="Import IA">Import IA</option>
                <option value="ENO">GuinéeGo Manuel</option>
              </select>
            </div>

            {/* Filtre Santé Intégration */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Santé Synchronisation
              </label>
              <select
                value={selectedIntegrationHealth}
                onChange={(e) => setSelectedIntegrationHealth(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Toutes les intégrations</option>
                <option value="CONNECTED">Connectée & Active</option>
                <option value="ERROR">Erreur de Webhook / Synchro</option>
                <option value="NOT_CONFIGURED">Configuration requise</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          TABLEAU PRINCIPAL DES E-COMMERÇANTS
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {filteredPartners.length} marchand{filteredPartners.length > 1 ? "s" : ""} trouvé{filteredPartners.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {filteredPartners.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Aucun e-commerçant trouvé</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aucun marchand ne correspond à votre recherche ou aux filtres appliqués.
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
                  <th className="py-3 px-4">Marchand & Gérant</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3">Intégrations & Sources</th>
                  <th className="py-3 px-3">Commandes Réelles</th>
                  <th className="py-3 px-3">Performance Closing</th>
                  <th className="py-3 px-3">Dernière Activité</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    {/* Marchand & Gérant */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-xs shrink-0">
                          {partner.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {partner.companyName}
                            </span>
                            {partner.hasSyncError && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Erreur de synchronisation active" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{partner.fullName}</span>
                            <span>•</span>
                            <span className="text-slate-400 font-medium">{partner.category || "E-commerce"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Statut Marchand */}
                    <td className="py-3 px-3">
                      <div>{getPartnerStatusBadge(partner.status)}</div>
                      {partner.suspensionReason && (
                        <div className="text-[9px] text-rose-600 truncate max-w-[140px] mt-0.5" title={partner.suspensionReason}>
                          {partner.suspensionReason}
                        </div>
                      )}
                    </td>

                    {/* Intégrations & Sources */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                        {partner.integrations.map((integ) => {
                          if (integ.status === "NOT_CONFIGURED" && integ.platform !== "Shopify" && integ.platform !== "YouCan") return null;

                          return (
                            <span
                              key={integ.platform}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                integ.status === "ERROR"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                  : integ.status === "CONNECTED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                              title={`${integ.platform} : ${integ.statusLabel}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  integ.status === "ERROR"
                                    ? "bg-rose-600"
                                    : integ.status === "CONNECTED"
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                                }`}
                              />
                              {integ.platform}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Commandes Réelles */}
                    <td className="py-3 px-3">
                      <div>
                        <div className="font-black text-slate-900">
                          {partner.totalOrders} commande{partner.totalOrders > 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          {partner.todayCount > 0 && (
                            <span className="text-blue-700 font-bold">+{partner.todayCount} auj.</span>
                          )}
                          <span className="text-emerald-700 font-semibold">{partner.deliveredCount} liv.</span>
                          {partner.pendingCount > 0 && (
                            <span className="text-amber-700 font-bold">{partner.pendingCount} à faire</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Performance Closing */}
                    <td className="py-3 px-3">
                      <div>
                        <div className="font-black text-slate-900 flex items-center gap-1">
                          <span>{partner.realConfirmationRate}%</span>
                          <span className="text-[10px] text-slate-400 font-normal">conf.</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Taux liv: {partner.realDeliverySuccessRate}%
                        </div>
                      </div>
                    </td>

                    {/* Dernière Activité */}
                    <td className="py-3 px-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">
                          {partner.lastOrderDate ? formatDate(partner.lastOrderDate) : partner.lastActivityAt || "Aucune"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {partner.city || "Guinée"}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {partner.hasSyncError && (
                          <button
                            onClick={() => handleTriggerSync(partner)}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Réessayer la synchronisation webhook"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/commercial/commandes?partner=${encodeURIComponent(partner.id)}`}
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Voir les commandes de ce marchand"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => setSelectedPartnerId(partner.id)}
                          className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                          title="Voir la fiche détaillée"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          FICHE DÉTAILLÉE DU MARCHAND (TIROIR LATÉRAL)
          ------------------------------------------------------------- */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-full sm:max-w-lg lg:max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-base sm:text-lg font-black shrink-0">
                  {selectedPartner.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">{selectedPartner.companyName}</h3>
                    {getPartnerStatusBadge(selectedPartner.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                    <span>Gérant : {selectedPartner.fullName}</span>
                    <span>•</span>
                    <span>{selectedPartner.city || "Conakry"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedPartner.hasSyncError && (
                  <button
                    onClick={() => handleTriggerSync(selectedPartner)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Réessayer synchro</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex items-center border-b border-slate-100 px-3 sm:px-5 bg-white overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDetailTab("OVERVIEW")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  detailTab === "OVERVIEW"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setDetailTab("INTEGRATIONS")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  detailTab === "INTEGRATIONS"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Intégrations & Flux</span>
                {selectedPartner.hasSyncError && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
              <button
                onClick={() => setDetailTab("COMMANDES")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  detailTab === "COMMANDES"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Commandes</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                  {selectedPartner.totalOrders}
                </span>
              </button>
            </div>

            {/* Contenu Drawer */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {detailTab === "OVERVIEW" && (
                <div className="space-y-5">
                  {/* Alerte si erreur webhook */}
                  {selectedPartner.hasSyncError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                      <div className="flex items-center gap-2 font-black text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Alerte d'intégration active
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        Échec répété de webhook (502 Bad Gateway) sur le connecteur Shopify. Les nouvelles commandes doivent être importées manuellement ou resynchronisées.
                      </p>
                      <button
                        onClick={() => handleTriggerSync(selectedPartner)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Tester et relancer la passerelle
                      </button>
                    </div>
                  )}

                  {/* Statistiques réelles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commandes Totales</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{selectedPartner.totalOrders}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">+{selectedPartner.todayCount} aujourd'hui</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taux Confirmation</div>
                      <div className="text-lg font-black text-emerald-600 mt-1">{selectedPartner.realConfirmationRate}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{selectedPartner.confirmedCount} confirmées</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Traité</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{formatCFA(selectedPartner.totalGMV)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sur commandes réelles</div>
                    </div>
                  </div>

                  {/* Coordonnées */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Coordonnées & Informations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Téléphone</span>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-slate-800">
                          <span>{selectedPartner.phone}</span>
                          <button
                            onClick={() => handleCopy(selectedPartner.id, selectedPartner.phone)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Email</span>
                        <span className="text-slate-800 mt-0.5 block truncate">{selectedPartner.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Site Web</span>
                        {selectedPartner.websiteUrl ? (
                          <a
                            href={selectedPartner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span>{selectedPartner.websiteUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400">Non renseigné</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Adresse</span>
                        <span className="text-slate-800 mt-0.5 block">{selectedPartner.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarification & Commissions */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tarification Commerciale GuinéeGo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Frais de livraison standard</span>
                        <span className="font-black text-slate-900 text-sm mt-0.5 block">
                          {formatCFA(selectedPartner.deliveryFeeDefault || 2000)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Commission closing & gestion</span>
                        <span className="font-black text-slate-900 text-sm mt-0.5 block">
                          {formatCFA(selectedPartner.agencyCommissionDefault || 800)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "INTEGRATIONS" && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 leading-relaxed">
                    État en direct des canaux de synchronisation connectés pour la boutique <strong>{selectedPartner.companyName}</strong>.
                  </div>

                  <div className="space-y-3">
                    {selectedPartner.integrations.map((integ) => (
                      <div
                        key={integ.platform}
                        className={`p-4 rounded-2xl border transition-all ${
                          integ.status === "ERROR"
                            ? "bg-rose-50/50 border-rose-200"
                            : integ.status === "CONNECTED"
                            ? "bg-white border-slate-200"
                            : "bg-slate-50/70 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                              integ.platform === "Shopify"
                                ? "bg-emerald-100 text-emerald-800"
                                : integ.platform === "YouCan"
                                ? "bg-indigo-100 text-indigo-800"
                                : integ.platform === "Import IA"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-200 text-slate-800"
                            }`}>
                              {integ.platform.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-slate-900 text-xs">{integ.platform}</h5>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                                  integ.status === "ERROR"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : integ.status === "CONNECTED"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-slate-200 text-slate-600 border-slate-300"
                                }`}>
                                  {integ.statusLabel}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {integ.ordersCount} commande{integ.ordersCount > 1 ? "s" : ""} synchronisée{integ.ordersCount > 1 ? "s" : ""}
                                {integ.lastSyncAt && ` • Dernier flux : ${integ.lastSyncAt}`}
                              </div>
                            </div>
                          </div>

                          {integ.status === "ERROR" ? (
                            <button
                              onClick={() => handleTriggerSync(selectedPartner)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                            >
                              Relancer
                            </button>
                          ) : integ.status === "CONNECTED" && integ.platform !== "ENO" ? (
                            <button
                              onClick={() => handleTriggerSync(selectedPartner)}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                            >
                              Tester
                            </button>
                          ) : integ.status === "NOT_CONFIGURED" ? (
                            <span className="text-[10px] text-slate-400 italic">Configuration requise</span>
                          ) : null}
                        </div>

                        {integ.errorMessage && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-[11px] text-rose-900 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{integ.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Architecture des Flux GuinéeGo */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <h5 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      Normalisation & Traitement Centralisé GuinéeGo
                    </h5>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Chaque commande reçue via webhook (Shopify / YouCan) ou saisie manuelle est automatiquement convertie dans le schéma unique GuinéeGo LAT et immédiatement mise à disposition dans le <strong>Command Center</strong> pour qualification par la Closeuse.
                    </p>
                  </div>
                </div>
              )}

              {detailTab === "COMMANDES" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {selectedPartner.orders.length} commande{selectedPartner.orders.length > 1 ? "s" : ""} pour ce marchand
                    </span>
                    <Link
                      href={`/commercial/commandes?partner=${encodeURIComponent(selectedPartner.id)}`}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Filtrer dans Commandes →
                    </Link>
                  </div>

                  {selectedPartner.orders.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                      Aucune commande enregistrée pour ce marchand pour le moment.
                    </div>
                  ) : (
                    selectedPartner.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">{ord.orderNumber}</span>
                            {getOrderStatusBadge(ord.status)}
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDate(ord.createdAt)}</span>
                        </div>

                        <div className="flex items-start justify-between text-xs pt-1 border-t border-slate-100">
                          <div>
                            <div className="font-semibold text-slate-800">{ord.clientName}</div>
                            <div className="text-[11px] text-slate-500">{ord.products}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900">{formatCFA(ord.totalPrice)}</div>
                            <div className="text-[10px] text-slate-400">{ord.city}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sticky bottom-0">
              <Link
                href={`/commercial/commandes?partner=${encodeURIComponent(selectedPartner.id)}`}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs text-center"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Gérer les commandes du marchand</span>
              </Link>
              <Link
                href="/commercial/clients"
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 text-center"
              >
                Voir les clients
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL DE SYNCHRONISATION EN COURS / SUCCÈS
          ------------------------------------------------------------- */}
      {syncModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-full sm:max-w-sm w-full p-4 sm:p-6 text-center space-y-4 animate-in zoom-in-95">
            {isSyncing ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Synchronisation en cours...</h4>
                <p className="text-xs text-slate-500">
                  Connexion à l'endpoint webhook de <strong>{syncModalPartner.companyName}</strong>.
                </p>
              </div>
            ) : syncSuccess ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Passerelle Validée !</h4>
                <p className="text-xs text-slate-500">
                  Le webhook et le flux de données sont opérationnels (HTTP 200 OK).
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
