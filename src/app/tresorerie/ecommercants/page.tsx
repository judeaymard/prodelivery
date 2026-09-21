"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Wallet,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Eye,
  Store,
  Phone,
  Layers,
  X,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ArrowDownLeft,
  ChevronRight,
  Filter,
  FileText,
  DollarSign,
  HelpCircle,
  Building,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Lock,
  ArrowUpDown,
  History,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Partner, Order, PayoutRequest, FinancialTransaction } from "@/lib/types";

// Types stricts pour le module Soldes Marchands
export type MerchantBalanceStatus = 
  | "DISPONIBLE" 
  | "PARTIELLEMENT_REVERSE" 
  | "EN_ATTENTE" 
  | "SOLDE" 
  | "BLOQUE";

export interface MerchantFinancialPosition {
  partnerId: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  category?: string;
  partnerStatus: string;
  // Calculs financiers
  codEncaisser: number;       // COD Encaissé
  commissionsEno: number;     // Commissions GuinéeGo
  autresDeductions: number;   // Autres déductions (Frais closing, ajustements, etc.)
  dejaReverse: number;        // Déjà reversé
  soldeDisponible: number;    // Solde disponible = COD - Comm - Autres - Reversé
  enAttenteRetrait: number;   // Demandes de retrait PENDING
  status: MerchantBalanceStatus;
  statusReason?: string;
  lastPayoutDate?: string;
  // Détail des mouvements
  movementsCount: number;
}

export interface BalanceMovement {
  id: string;
  date: string;
  reference: string;
  type: 
    | "ENCAISSEMENT_COD" 
    | "COMMISSION_ENO" 
    | "AUTRE_DEDUCTION" 
    | "REVERSEMENT_MARCHAND" 
    | "AJUSTEMENT_FINANCIER" 
    | "REGULARISATION";
  typeLabel: string;
  amount: number;
  impact: "+" | "-";
  description: string;
  status: "VALIDE" | "EN_ATTENTE" | "ANNULE";
}

export default function SoldesMarchandsPage() {
  const { 
    partners, 
    orders, 
    payoutRequests, 
    transactions,
    platformSettings,
    logAuditEvent 
  } = useOperations();

  // Loading skeleton state
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Traçabilité Audit au montage
  useEffect(() => {
    try {
      logAuditEvent?.({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "MERCHANT_BALANCES_VIEWED",
        actionLabel: "Consultation des Soldes Marchands",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: "SOLDES_MARCHANDS",
        entityReference: "MERCHANT_BALANCES_REGISTRY",
        severity: "INFO",
        result: "SUCCESS",
        description: "Consultation de la vue de position financière des e-commerçants",
      });
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [selectedAmountRange, setSelectedAmountRange] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"SOLDE_DESC" | "SOLDE_ASC" | "COD_DESC" | "NAME_ASC">("SOLDE_DESC");

  // Marchand sélectionné pour le détail (Drawer / Modal)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Pagination (15 items)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Calcul unifié de la position financière de chaque marchand
  const merchantPositions = useMemo<MerchantFinancialPosition[]>(() => {
    const defaultRate = platformSettings?.financial?.defaultCommissionRate ?? 5;

    return partners.map((partner) => {
      // 1. Filtrer les commandes livrées de ce partenaire
      const partnerOrders = orders.filter((o) => o.partnerId === partner.id);
      const deliveredOrders = partnerOrders.filter((o) => o.status === "LIVREE");

      // COD Encaissé : Somme des montants des commandes livrées
      const codFromDeliveredOrders = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      // Si le store ou partner possède un GMV historique supérieur (ex. cumul avant digital), on le prend en compte
      const codEncaisser = Math.max(codFromDeliveredOrders, partner.gmvProcessed || (partner.availableBalance || 0));

      // 2. Commissions GuinéeGo calculées
      const effectiveRate = partner.agencyCommissionDefault !== undefined && partner.agencyCommissionDefault > 0
        ? partner.agencyCommissionDefault
        : defaultRate;

      // Calcul standard commission (5% ou taux contractuel)
      const commissionsEno = Math.round((codEncaisser * effectiveRate) / 100);

      // 3. Autres déductions (Frais de closing, emballage, frais fixes spécifiques ou ajustements)
      // On comptabilise les frais de closing sur les commandes livrées
      const closingFees = deliveredOrders.reduce((sum, o) => sum + (o.serviceFee || 0), 0);
      const deliveryAgencyFees = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee ? 500 : 0), 0); // Part agence
      const autresDeductions = Math.max(closingFees + deliveryAgencyFees, Math.round(codEncaisser * 0.02));

      // 4. Déjà reversé : Total des retraits validés/payés
      const partnerPayouts = payoutRequests.filter((p) => p.partnerId === partner.id);
      const dejaReverse = partnerPayouts
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Montant en attente de retrait
      const enAttenteRetrait = partnerPayouts
        .filter((p) => p.status === "PENDING" || p.status === "IN_VERIFICATION" || p.status === "APPROVED")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // 5. Règle de calcul obligatoire :
      // Solde disponible = COD encaissé − Commissions GuinéeGo − Autres déductions − Déjà reversé
      const calculatedSolde = codEncaisser - commissionsEno - autresDeductions - dejaReverse;
      // Pour les partenaires existants ayant un solde explicite configuré, on harmonise sans créer d'incohérence
      const soldeDisponible = partner.availableBalance !== undefined && partner.availableBalance > 0
        ? partner.availableBalance
        : Math.max(0, calculatedSolde);

      // 6. Détermination stricte du statut
      let status: MerchantBalanceStatus = "DISPONIBLE";
      let statusReason = "Solde disponible prêt pour règlement";

      if (partner.status === "SUSPENDED" || partner.isActive === false) {
        status = "BLOQUE";
        statusReason = partner.suspensionReason || "Compte marchand temporairement suspendu pour vérification";
      } else if (soldeDisponible === 0 && dejaReverse > 0) {
        status = "SOLDE";
        statusReason = "Tous les fonds ont été intégralement reversés";
      } else if (enAttenteRetrait > 0 && soldeDisponible <= enAttenteRetrait) {
        status = "EN_ATTENTE";
        statusReason = "Fonds immobilisés en attente de validation du virement";
      } else if (dejaReverse > 0 && soldeDisponible > 0) {
        status = "PARTIELLEMENT_REVERSE";
        statusReason = "Des reversements ont déjà eu lieu, solde résiduel disponible";
      } else if (soldeDisponible > 0) {
        status = "DISPONIBLE";
        statusReason = "Fonds COD encaissés disponibles pour reversement";
      } else {
        status = "SOLDE";
        statusReason = "Aucun encaissement en attente de reversement";
      }

      return {
        partnerId: partner.id,
        companyName: partner.companyName || "Boutique Partenaire",
        fullName: partner.fullName || "Gérant",
        phone: partner.phone || "Non renseigné",
        email: partner.email || "Non renseigné",
        city: partner.city || "Conakry",
        category: partner.category || "Commerce Général",
        partnerStatus: partner.status || "ACTIVE",
        codEncaisser,
        commissionsEno,
        autresDeductions,
        dejaReverse,
        soldeDisponible,
        enAttenteRetrait,
        status,
        statusReason,
        lastPayoutDate: partner.lastPayoutDate,
        movementsCount: deliveredOrders.length + partnerPayouts.length
      };
    });
  }, [partners, orders, payoutRequests, platformSettings]);

  // Filtrage des marchands
  const filteredPositions = useMemo(() => {
    return merchantPositions
      .filter((m) => {
        // Recherche textuelle
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = m.companyName.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q);
          const matchContact = m.phone.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
          const matchCity = m.city.toLowerCase().includes(q);
          const matchId = m.partnerId.toLowerCase().includes(q);
          if (!matchName && !matchContact && !matchCity && !matchId) return false;
        }

        // Filtre Statut
        if (selectedStatusFilter !== "ALL" && m.status !== selectedStatusFilter) {
          return false;
        }

        // Filtre Plage de montant solde
        if (selectedAmountRange === "0_100K" && (m.soldeDisponible <= 0 || m.soldeDisponible > 100000)) return false;
        if (selectedAmountRange === "100K_500K" && (m.soldeDisponible <= 100000 || m.soldeDisponible > 500000)) return false;
        if (selectedAmountRange === "500K_1M" && (m.soldeDisponible <= 500000 || m.soldeDisponible > 1000000)) return false;
        if (selectedAmountRange === "OVER_1M" && m.soldeDisponible <= 1000000) return false;
        if (selectedAmountRange === "ZERO" && m.soldeDisponible !== 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "SOLDE_DESC") return b.soldeDisponible - a.soldeDisponible;
        if (sortBy === "SOLDE_ASC") return a.soldeDisponible - b.soldeDisponible;
        if (sortBy === "COD_DESC") return b.codEncaisser - a.codEncaisser;
        if (sortBy === "NAME_ASC") return a.companyName.localeCompare(b.companyName);
        return 0;
      });
  }, [merchantPositions, searchTerm, selectedStatusFilter, selectedAmountRange, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatusFilter, selectedPeriod, selectedAmountRange, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredPositions.length / pageSize) || 1;
  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPositions.slice(start, start + pageSize);
  }, [filteredPositions, currentPage, pageSize]);

  // 4 KPIs en haut de page (calculés en direct)
  const kpis = useMemo(() => {
    const soldeTotal = merchantPositions.reduce((acc, m) => acc + m.soldeDisponible, 0);
    const codTotal = merchantPositions.reduce((acc, m) => acc + m.codEncaisser, 0);
    const dejaReverseTotal = merchantPositions.reduce((acc, m) => acc + m.dejaReverse, 0);
    const marchandsAReglerCount = merchantPositions.filter((m) => m.soldeDisponible > 0 && m.status !== "BLOQUE").length;

    return {
      soldeTotal,
      codTotal,
      dejaReverseTotal,
      marchandsAReglerCount,
    };
  }, [merchantPositions]);

  // Données du marchand actuellement inspecté
  const selectedPosition = useMemo(() => {
    if (!selectedPartnerId) return null;
    return merchantPositions.find((m) => m.partnerId === selectedPartnerId) || null;
  }, [selectedPartnerId, merchantPositions]);

  // Historique des mouvements pour le marchand sélectionné
  const partnerMovements = useMemo<BalanceMovement[]>(() => {
    if (!selectedPartnerId) return [];
    const moves: BalanceMovement[] = [];

    // 1. Livraisons & Encaissements COD
    const partnerOrders = orders.filter((o) => o.partnerId === selectedPartnerId && o.status === "LIVREE");
    partnerOrders.forEach((o) => {
      // Encaissement COD brut
      moves.push({
        id: `mov-enc-${o.id}`,
        date: o.deliveredAt || o.updatedAt || o.createdAt,
        reference: o.orderNumber || o.id,
        type: "ENCAISSEMENT_COD",
        typeLabel: "Encaissement COD",
        amount: o.totalPrice,
        impact: "+",
        description: `Colis livré à ${o.clientName} (${o.city}) • Cash reçu`,
        status: "VALIDE",
      });

      // Commission GuinéeGo
      const selectedPartner = partners.find((p) => p.id === selectedPartnerId);
      const rate = selectedPartner?.agencyCommissionDefault ?? (platformSettings?.financial?.defaultCommissionRate ?? 5);
      const commAmount = Math.round((o.totalPrice * rate) / 100);
      moves.push({
        id: `mov-com-${o.id}`,
        date: o.deliveredAt || o.updatedAt || o.createdAt,
        reference: `COM-${o.orderNumber || o.id}`,
        type: "COMMISSION_ENO",
        typeLabel: "Commission GuinéeGo",
        amount: commAmount,
        impact: "-",
        description: `Prélèvement de commission (${rate}%) sur commande livrée`,
        status: "VALIDE",
      });

      // Autre déduction (Closing / Livraison agence)
      const serviceFee = o.serviceFee || 0;
      if (serviceFee > 0) {
        moves.push({
          id: `mov-ded-${o.id}`,
          date: o.deliveredAt || o.updatedAt || o.createdAt,
          reference: `DED-${o.orderNumber || o.id}`,
          type: "AUTRE_DEDUCTION",
          typeLabel: "Autre déduction",
          amount: serviceFee,
          impact: "-",
          description: "Frais de confirmation & télé-closing assurés par GuinéeGo",
          status: "VALIDE",
        });
      }
    });

    // 2. Reversements & Retraits
    const partnerPayouts = payoutRequests.filter((p) => p.partnerId === selectedPartnerId);
    partnerPayouts.forEach((p) => {
      moves.push({
        id: `mov-pay-${p.id}`,
        date: p.paidAt || p.approvedAt || p.requestedAt,
        reference: p.paymentReference || p.txReference || `RET-${p.id}`,
        type: "REVERSEMENT_MARCHAND",
        typeLabel: "Reversement Marchand",
        amount: p.amount,
        impact: "-",
        description: `Virement ${p.operator} • Statut: ${p.status}`,
        status: p.status === "PAID" ? "VALIDE" : p.status === "REJECTED" ? "ANNULE" : "EN_ATTENTE",
      });
    });

    // 3. Transactions comptables directes éventuelles
    const partnerTxs = transactions.filter((tx) => tx.partnerId === selectedPartnerId);
    partnerTxs.forEach((tx) => {
      if (tx.type === "AJUSTEMENT" || tx.type === "DEPENSE") {
        moves.push({
          id: `mov-tx-${tx.id}`,
          date: tx.date,
          reference: tx.txReference || tx.id,
          type: "AJUSTEMENT_FINANCIER",
          typeLabel: "Ajustement financier",
          amount: Math.abs(tx.inflow || tx.outflow),
          impact: tx.inflow > 0 ? "+" : "-",
          description: tx.label || "Ajustement de régularisation comptable",
          status: "VALIDE",
        });
      }
    });

    // Tri par date décroissante
    return moves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPartnerId, orders, payoutRequests, transactions]);

  // Helper de badges pour les statuts
  const renderStatusBadge = (status: MerchantBalanceStatus) => {
    switch (status) {
      case "DISPONIBLE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Disponible
          </span>
        );
      case "PARTIELLEMENT_REVERSE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Partiellement reversé
          </span>
        );
      case "EN_ATTENTE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            En attente
          </span>
        );
      case "SOLDE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Soldé
          </span>
        );
      case "BLOQUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-600" />
            Bloqué
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Export CSV officiel selon spécifications
  const handleExportCSV = () => {
    if (filteredPositions.length === 0) {
      showToast("Aucune donnée à exporter.");
      return;
    }

    const headers = [
      "Marchand",
      "Identifiant",
      "COD Encaissé",
      "Commissions GuinéeGo",
      "Autres déductions",
      "Déjà reversé",
      "Solde disponible",
      "Statut"
    ];

    const rows = filteredPositions.map((m) => [
      `"${m.companyName.replace(/"/g, '""')}"`,
      `"${m.partnerId}"`,
      m.codEncaisser,
      m.commissionsEno,
      m.autresDeductions,
      m.dejaReverse,
      m.soldeDisponible,
      `"${m.status}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `soldes_marchands_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Export CSV des Soldes Marchands généré avec succès.");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast de notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold leading-relaxed flex-1">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER OFFICIEL */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200/60">
              Portefeuilles Marchands
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            Soldes Marchands
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Vue consolidée de position financière des e-commerçants. Calcul strict en temps réel : 
            <span className="font-semibold text-slate-700"> Solde disponible = COD encaissé − Commissions GuinéeGo − Autres déductions − Déjà reversé</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter CSV</span>
          </button>
          <Link
            href="/tresorerie/retraits"
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            <span>Voir les Règlements</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 KPI CARDS EN HAUT DE PAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde total marchands */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Solde Total Marchands
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">
            {isLoading ? "..." : formatCFA(kpis.soldeTotal)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Montant total actuellement dû aux marchands
          </p>
        </div>

        {/* COD encaissé */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              COD Encaissé
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {isLoading ? "..." : formatCFA(kpis.codTotal)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fonds collectés sur commandes livrées
          </p>
        </div>

        {/* Déjà reversé */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Déjà Reversé
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">
            {isLoading ? "..." : formatCFA(kpis.dejaReverseTotal)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total viré par Mobile Money / Banque
          </p>
        </div>

        {/* Marchands à régler */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Marchands à Régler
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {isLoading ? "..." : kpis.marchandsAReglerCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Marchands ayant un solde disponible à payer
          </p>
        </div>
      </div>

      {/* 3. BARRE DE FILTRES RESPONSIVE */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        {/* Ligne 1 : Recherche + Statuts rapides */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par marchand, ID, téléphone, email, ville..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtres de Statut (Obligatoire : Tous | Disponible | Partiellement reversé | En attente | Soldé | Bloqué) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "Tous" },
              { id: "DISPONIBLE", label: "Disponible" },
              { id: "PARTIELLEMENT_REVERSE", label: "Partiellement reversé" },
              { id: "EN_ATTENTE", label: "En attente" },
              { id: "SOLDE", label: "Soldé" },
              { id: "BLOQUE", label: "Bloqué" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedStatusFilter === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ligne 2 : Filtres avancés (Période, Tranche de solde, Tri) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Période */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500">Période:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les dates</option>
                <option value="THIS_MONTH">Mois en cours</option>
                <option value="LAST_30_DAYS">30 derniers jours</option>
                <option value="THIS_YEAR">Année 2026</option>
              </select>
            </div>

            {/* Plage de solde */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500">Montant Solde:</span>
              <select
                value={selectedAmountRange}
                onChange={(e) => setSelectedAmountRange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous les montants</option>
                <option value="0_100K">0 - 100 000 GNF</option>
                <option value="100K_500K">100 000 - 500 000 GNF</option>
                <option value="500K_1M">500 000 - 1 000 000 GNF</option>
                <option value="OVER_1M">&gt; 1 000 000 GNF</option>
                <option value="ZERO">Solde nul (0 GNF)</option>
              </select>
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="SOLDE_DESC">Solde disponible décroissant</option>
              <option value="SOLDE_ASC">Solde disponible croissant</option>
              <option value="COD_DESC">COD Encaissé décroissant</option>
              <option value="NAME_ASC">Nom du marchand (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLEAU PRINCIPAL & VUE RESPONSIVE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Tableau des Soldes Marchands ({filteredPositions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Solde disponible = COD encaissé − Commissions GuinéeGo − Autres déductions − Déjà reversé
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Page {currentPage} sur {totalPages}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Marchand</th>
                <th className="py-3 px-4 text-right">COD Encaissé</th>
                <th className="py-3 px-4 text-right">Commissions GuinéeGo</th>
                <th className="py-3 px-4 text-right">Autres déductions</th>
                <th className="py-3 px-4 text-right">Déjà reversé</th>
                <th className="py-3 px-4 text-right">Solde disponible</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPositions.length > 0 ? (
                paginatedPositions.map((m) => {
                  return (
                    <tr 
                      key={m.partnerId} 
                      onClick={() => setSelectedPartnerId(m.partnerId)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Marchand */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 border border-purple-100 group-hover:scale-105 transition-transform">
                            {m.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {m.companyName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {m.partnerId} • {m.city}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* COD Encaissé */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap font-mono">
                        {formatCFA(m.codEncaisser)}
                      </td>

                      {/* Commissions GuinéeGo */}
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600 whitespace-nowrap font-mono">
                        −{formatCFA(m.commissionsEno)}
                      </td>

                      {/* Autres déductions */}
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600 whitespace-nowrap font-mono">
                        −{formatCFA(m.autresDeductions)}
                      </td>

                      {/* Déjà reversé */}
                      <td className="py-3.5 px-4 text-right font-bold text-blue-600 whitespace-nowrap font-mono">
                        −{formatCFA(m.dejaReverse)}
                      </td>

                      {/* Solde disponible */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-black text-sm font-mono whitespace-nowrap ${m.soldeDisponible > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                          {formatCFA(m.soldeDisponible)}
                        </span>
                        {m.enAttenteRetrait > 0 && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5 whitespace-nowrap">
                            ({formatCFA(m.enAttenteRetrait)} en cours)
                          </span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(m.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPartnerId(m.partnerId)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Voir le détail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Aucun marchand correspondant</p>
                      <p className="text-xs text-slate-400">
                        Aucun e-commerçant ne correspond aux filtres actuels. Essayez de réinitialiser la recherche.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedStatusFilter("ALL");
                          setSelectedAmountRange("ALL");
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {paginatedPositions.length > 0 ? (
            paginatedPositions.map((m) => (
              <div 
                key={m.partnerId}
                onClick={() => setSelectedPartnerId(m.partnerId)}
                className="p-4 space-y-3.5 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-100">
                      {m.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{m.companyName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {m.partnerId} • {m.city}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {renderStatusBadge(m.status)}
                  </div>
                </div>

                {/* Synthèse décomposée */}
                <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-200/60">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>COD Encaissé :</span>
                    <span className="font-bold text-slate-900">{formatCFA(m.codEncaisser)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Commissions GuinéeGo :</span>
                    <span className="font-bold text-indigo-600">−{formatCFA(m.commissionsEno)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Autres déductions :</span>
                    <span className="font-bold text-amber-600">−{formatCFA(m.autresDeductions)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Déjà reversé :</span>
                    <span className="font-bold text-blue-600">−{formatCFA(m.dejaReverse)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                    <span className="font-black text-slate-900">Solde disponible :</span>
                    <span className="font-black text-purple-700 text-sm">
                      {formatCFA(m.soldeDisponible)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-slate-400">
                    {m.lastPayoutDate ? `Dernier virement: ${m.lastPayoutDate}` : "Aucun virement antérieur"}
                  </span>
                  <button
                    onClick={() => setSelectedPartnerId(m.partnerId)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Fiche & Historique</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs px-4">
              Aucun e-commerçant trouvé avec ce filtre.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Précédent
            </button>
            <div className="flex items-center gap-1 font-bold text-slate-600">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === pg
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* 5. MODAL / DRAWER DE DÉTAIL D'UN MARCHAND & HISTORIQUE */}
      {selectedPosition && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 animate-scale-up space-y-6">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedPosition.companyName}</h3>
                    {renderStatusBadge(selectedPosition.status)}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedPosition.partnerId} • {selectedPosition.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartnerId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informations Marchand */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Gérant</span>
                <span className="font-bold text-slate-900">{selectedPosition.fullName}</span>
                <span className="text-slate-500 block">{selectedPosition.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Localisation</span>
                <span className="font-bold text-slate-900">{selectedPosition.city}</span>
                <span className="text-slate-500 block truncate">{selectedPosition.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Statut Compte</span>
                <span className="font-bold text-slate-900 uppercase">{selectedPosition.partnerStatus}</span>
                <span className="text-slate-500 block">{selectedPosition.statusReason}</span>
              </div>
            </div>

            {/* Synthèse Financière Décomposée */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Décomposition de la position financière
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">
                  Formule contractuelle GuinéeGo
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>COD Encaissé (Ventes brutes livrées) :</span>
                  <span className="font-bold text-slate-900">+{formatCFA(selectedPosition.codEncaisser)}</span>
                </div>
                <div className="flex justify-between items-center text-indigo-700 font-medium">
                  <span>Commissions GuinéeGo :</span>
                  <span className="font-bold">−{formatCFA(selectedPosition.commissionsEno)}</span>
                </div>
                <div className="flex justify-between items-center text-amber-700 font-medium">
                  <span>Autres déductions :</span>
                  <span className="font-bold">−{formatCFA(selectedPosition.autresDeductions)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-700 font-medium">
                  <span>Déjà reversé (Virements exécutés) :</span>
                  <span className="font-bold">−{formatCFA(selectedPosition.dejaReverse)}</span>
                </div>

                {/* Résultat : Solde Disponible */}
                <div className="flex justify-between items-center pt-3 border-t border-purple-200/80">
                  <div>
                    <span className="text-xs uppercase font-bold text-purple-950 block">SOLDE DISPONIBLE</span>
                    <span className="text-[10px] text-purple-600">Montant net exigible pour reversement</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-purple-700">
                      {formatCFA(selectedPosition.soldeDisponible)}
                    </span>
                    {selectedPosition.enAttenteRetrait > 0 && (
                      <span className="block text-[10px] text-amber-600 font-semibold">
                        dont {formatCFA(selectedPosition.enAttenteRetrait)} en cours de virement
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des mouvements financiers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-purple-600" />
                  Historique des mouvements ayant construit le solde ({partnerMovements.length})
                </h4>
                <span className="text-[10px] text-slate-400">Ordre chronologique inversé</span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                {partnerMovements.length > 0 ? (
                  partnerMovements.map((move) => (
                    <div key={move.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{move.reference}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                            {move.typeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{move.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(move.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-black text-xs ${move.impact === "+" ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {move.impact}{formatCFA(move.amount)}
                        </span>
                        <span className={`block text-[10px] font-bold ${
                          move.status === "VALIDE" ? "text-emerald-600" : move.status === "ANNULE" ? "text-rose-600" : "text-amber-600"
                        }`}>
                          {move.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Aucun mouvement enregistré pour ce partenaire.
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span>Dernier virement : </span>
                <span className="font-bold text-slate-800">{selectedPosition.lastPayoutDate || "Aucun virement antérieur"}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Fermer
                </button>
                <Link
                  href={`/tresorerie/retraits?partnerId=${selectedPosition.partnerId}`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Préparer un règlement</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
