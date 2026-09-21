"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Filter,
  X,
  CreditCard,
  Building,
  Check,
  Ban,
  Smartphone,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowDownLeft,
  Info,
  Lock,
  RefreshCw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Hash,
  Send,
  Printer
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { PayoutRequest, PayoutStatus, Partner, PayoutOperator } from "@/lib/types";

// Onglets Internes selon le cahier des charges
export type RetraitsTab = 
  | "ALL"           // Demandes de retrait
  | "TO_VALIDATE"   // À valider (PENDING & IN_VERIFICATION)
  | "IN_TREATMENT"  // Virements en cours (APPROVED & IN_TREATMENT)
  | "HISTORY"       // Historique (PAID & VALIDATED)
  | "ISSUES";       // Échecs / anomalies (REJECTED, FAILED, BLOCKED)

function RetraitsVirementsContent() {
  const searchParams = useSearchParams();
  const initialPartnerFilter = searchParams.get("partnerId") || "ALL";

  const { 
    payoutRequests, 
    partners, 
    orders,
    platformSettings,
    approveWithdrawal, 
    payWithdrawal, 
    rejectWithdrawal, 
    blockWithdrawal, 
    activeTreasuryManager,
    logAuditEvent 
  } = useOperations();

  // Loading Skeleton
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // Toast notification
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
          id: activeTreasuryManager?.id || "usr-treasury",
          name: activeTreasuryManager?.name || "Responsable Trésorerie",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "WITHDRAWALS_MODULE_VIEWED",
        actionLabel: "Consultation du module Retraits & Virements",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: "RETRAITS_VIREMENTS",
        entityReference: "PAYOUTS_REGISTRY",
        severity: "INFO",
        result: "SUCCESS",
        description: "Consultation du registre central des retraits et exécutions de virements",
      });
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Onglet sélectionné
  const [activeTab, setActiveTab] = useState<RetraitsTab>("ALL");

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>(initialPartnerFilter);
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [selectedAmountRange, setSelectedAmountRange] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modale / Drawer de Détail
  const [selectedPayoutForDetail, setSelectedPayoutForDetail] = useState<PayoutRequest | null>(null);

  // Modale de Validation / Approbation
  const [selectedPayoutForApprove, setSelectedPayoutForApprove] = useState<PayoutRequest | null>(null);
  const [approveNoteInput, setApproveNoteInput] = useState("");

  // Modale de Confirmation Avant Règlement (Étape de virement effectif)
  const [selectedPayoutForPayment, setSelectedPayoutForPayment] = useState<PayoutRequest | null>(null);
  const [paymentReferenceInput, setPaymentReferenceInput] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modale de Refus avec Motif Obligatoire
  const [selectedPayoutForReject, setSelectedPayoutForReject] = useState<PayoutRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Modale de Blocage avec Justification Obligatoire
  const [selectedPayoutForBlock, setSelectedPayoutForBlock] = useState<PayoutRequest | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState("");

  // Pagination (12 demandes par page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Calcul du Solde Marchand en temps réel (Synchronisé exactement avec Soldes Marchands)
  const getPartnerFinancialPosition = (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return { availableBalance: 0, partnerName: "Marchand Inconnu" };

    const partnerOrders = orders.filter((o) => o.partnerId === partnerId && o.status === "LIVREE");
    const codEncaisser = partnerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const commRate = partner.agencyCommissionDefault ?? (platformSettings?.financial?.defaultCommissionRate ?? 5);
    const commissionsEno = Math.round(codEncaisser * (commRate / 100));
    const autresDeductions = partnerOrders.reduce((sum, o) => sum + (o.serviceFee || 0), 0);

    const partnerPayouts = payoutRequests.filter((p) => p.partnerId === partnerId);
    const dejaReverse = partnerPayouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const calculatedBalance = Math.max(0, codEncaisser - commissionsEno - autresDeductions - dejaReverse);
    const availableBalance = partner.availableBalance !== undefined && partner.availableBalance > 0
      ? partner.availableBalance
      : calculatedBalance;

    return {
      availableBalance,
      partnerName: partner.companyName || partner.fullName,
      phone: partner.phone,
      email: partner.email,
      status: partner.status,
    };
  };

  // 1. KPI Cards en haut de page (calculés en temps réel)
  const kpis = useMemo(() => {
    // À traiter : PENDING & IN_VERIFICATION
    const toTreatRequests = payoutRequests.filter(
      (p) => p.status === "PENDING" || p.status === "IN_VERIFICATION"
    );
    const toTreatCount = toTreatRequests.length;
    const toTreatAmount = toTreatRequests.reduce((sum, p) => sum + p.amount, 0);

    // Virements en cours : APPROVED & IN_TREATMENT
    const inTreatmentCount = payoutRequests.filter(
      (p) => p.status === "APPROVED" || p.status === "IN_TREATMENT"
    ).length;

    // Versé sur la période : PAID
    const paidAmount = payoutRequests
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    // Échecs / anomalies : FAILED, REJECTED, BLOCKED
    const issuesCount = payoutRequests.filter(
      (p) => p.status === "FAILED" || p.status === "REJECTED" || p.status === "BLOCKED"
    ).length;

    return {
      toTreatCount,
      toTreatAmount,
      inTreatmentCount,
      paidAmount,
      issuesCount,
    };
  }, [payoutRequests]);

  // 2. Filtrage & Organisation des demandes
  const filteredPayouts = useMemo(() => {
    return payoutRequests.filter((p) => {
      // Filtre Onglet
      if (activeTab === "TO_VALIDATE") {
        if (p.status !== "PENDING" && p.status !== "IN_VERIFICATION") return false;
      } else if (activeTab === "IN_TREATMENT") {
        if (p.status !== "APPROVED" && p.status !== "IN_TREATMENT") return false;
      } else if (activeTab === "HISTORY") {
        if (p.status !== "PAID" && p.status !== "VALIDATED") return false;
      } else if (activeTab === "ISSUES") {
        if (p.status !== "FAILED" && p.status !== "REJECTED" && p.status !== "BLOCKED") return false;
      }

      // Filtre Statut Spécifique
      if (selectedStatusFilter !== "ALL" && p.status !== selectedStatusFilter) {
        return false;
      }

      // Filtre Partenaire
      if (selectedPartnerFilter !== "ALL" && p.partnerId !== selectedPartnerFilter) {
        return false;
      }

      // Filtre Opérateur / Méthode
      if (selectedOperatorFilter !== "ALL" && p.operator !== selectedOperatorFilter) {
        return false;
      }

      // Filtre Tranche de Montant
      if (selectedAmountRange === "0_100K" && (p.amount <= 0 || p.amount > 100000)) return false;
      if (selectedAmountRange === "100K_500K" && (p.amount <= 100000 || p.amount > 500000)) return false;
      if (selectedAmountRange === "OVER_500K" && p.amount <= 500000) return false;

      // Recherche textuelle
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = p.id.toLowerCase().includes(q);
        const matchPartner = p.partnerName.toLowerCase().includes(q);
        const matchPhone = (p.phone || p.leekpayPhone || "").includes(q);
        const matchRef = (p.paymentReference || p.txReference || "").toLowerCase().includes(q);
        if (!matchId && !matchPartner && !matchPhone && !matchRef) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [
    payoutRequests,
    activeTab,
    selectedStatusFilter,
    selectedPartnerFilter,
    selectedOperatorFilter,
    selectedAmountRange,
    searchTerm
  ]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredPayouts.length / pageSize) || 1;
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayouts.slice(start, start + pageSize);
  }, [filteredPayouts, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedStatusFilter, selectedPartnerFilter, selectedOperatorFilter, selectedAmountRange]);

  // Badges de statut conformes au design system
  const renderStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            En attente
          </span>
        );
      case "IN_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            À vérifier
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            Approuvé
          </span>
        );
      case "IN_TREATMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
            En traitement
          </span>
        );
      case "PAID":
      case "VALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Payé
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Ban className="w-3 h-3 text-slate-500" />
            Refusé
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Échoué
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Lock className="w-3 h-3 text-rose-700" />
            Bloqué
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
            <X className="w-3 h-3" />
            Annulé
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

  // Icône et libellé de méthode de paiement
  const renderOperatorBadge = (operator: PayoutOperator, p: PayoutRequest) => {
    return (
      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
        {operator === "LEEKPAY" && (
          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
            LeekPay
          </span>
        )}
        {operator === "BINANCE_PAY" && (
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
            Binance Pay
          </span>
        )}
        {operator === "USDT" && (
          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black">
            USDT TRC-20
          </span>
        )}
        {operator === "MTN" && (
          <span className="px-2 py-0.5 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 text-[10px] font-black">
            MTN MoMo
          </span>
        )}
        {operator === "MOOV" && (
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black">
            Moov Money
          </span>
        )}
        {operator === "WAVE" && (
          <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-black">
            Wave
          </span>
        )}
        <span className="text-[11px] font-mono text-slate-500 truncate max-w-[120px]">
          {p.phone || p.binancePayId || (p.cryptoAddress ? p.cryptoAddress.slice(0, 8) + '...' : '')}
        </span>
      </div>
    );
  };

  // Actions de validation & exécution
  const handleConfirmApprove = () => {
    if (!selectedPayoutForApprove) return;
    approveWithdrawal(selectedPayoutForApprove.id, approveNoteInput.trim() || "Vérifié et approuvé pour virement.");
    showToast(`✓ Demande ${selectedPayoutForApprove.id} approuvée avec succès.`);
    setSelectedPayoutForApprove(null);
    setApproveNoteInput("");
  };

  const handleOpenPaymentConfirm = (payout: PayoutRequest) => {
    setSelectedPayoutForPayment(payout);
    setPaymentReferenceInput(`VR-${payout.operator}-${Date.now().toString().slice(-6)}`);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutForPayment || !paymentReferenceInput.trim()) return;

    // Protection solde : double vérification
    const fin = getPartnerFinancialPosition(selectedPayoutForPayment.partnerId);
    if (selectedPayoutForPayment.amount > fin.availableBalance && selectedPayoutForPayment.status !== "APPROVED") {
      showToast("❌ Erreur : Le montant demandé dépasse le solde actuellement disponible.");
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      payWithdrawal(
        selectedPayoutForPayment.id,
        paymentReferenceInput.trim(),
        activeTreasuryManager?.name || "Amina Tidjani (Trésorerie)"
      );
      setIsProcessingPayment(false);
      showToast(`✓ Virement de ${formatCFA(selectedPayoutForPayment.amount)} exécuté et archivé au Grand Livre.`);
      setSelectedPayoutForPayment(null);
    }, 400);
  };

  const handleConfirmReject = () => {
    if (!selectedPayoutForReject || !rejectReasonInput.trim()) {
      showToast("⚠️ Le motif du refus est obligatoire.");
      return;
    }
    rejectWithdrawal(selectedPayoutForReject.id, rejectReasonInput.trim());
    showToast(`Demande ${selectedPayoutForReject.id} rejetée. Fonds restitués au solde du marchand.`);
    setSelectedPayoutForReject(null);
    setRejectReasonInput("");
  };

  const handleConfirmBlock = () => {
    if (!selectedPayoutForBlock || !blockReasonInput.trim()) {
      showToast("⚠️ La justification du blocage est obligatoire.");
      return;
    }
    blockWithdrawal(selectedPayoutForBlock.id, blockReasonInput.trim());
    showToast(`🛑 Demande ${selectedPayoutForBlock.id} bloquée pour vérification approfondie.`);
    setSelectedPayoutForBlock(null);
    setBlockReasonInput("");
  };

  // Export CSV officiel
  const handleExportCSV = () => {
    if (filteredPayouts.length === 0) {
      showToast("Aucune demande à exporter.");
      return;
    }

    const headers = [
      "Référence",
      "Marchand",
      "Montant",
      "Méthode",
      "Date Demande",
      "Statut",
      "Référence Virement",
      "Motif Refus / Échec"
    ];

    const rows = filteredPayouts.map((p) => [
      `"${p.id}"`,
      `"${p.partnerName.replace(/"/g, '""')}"`,
      p.amount,
      `"${p.operator}"`,
      `"${p.requestedAt}"`,
      `"${p.status}"`,
      `"${p.paymentReference || p.txReference || ""}"`,
      `"${(p.rejectionReason || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `retraits_virements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Export CSV des Retraits & Virements téléchargé.");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
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
              Règlements & Décaissements
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-purple-600" />
            Retraits &amp; Virements
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gestion du règlement effectif des avoirs dus aux e-commerçants. Transformation sécurisée des soldes marchands disponibles en virements certifiés.
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
            href="/tresorerie/ecommercants"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            <span>Voir Soldes Marchands</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI CARDS EN HAUT DE PAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* À traiter */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">À Traiter</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
              {kpis.toTreatCount}
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {isLoading ? "..." : kpis.toTreatCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Demandes nécessitant action</p>
        </div>

        {/* Montant à verser */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Montant à Verser</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">
            {isLoading ? "..." : formatCFA(kpis.toTreatAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumul des retraits en attente</p>
        </div>

        {/* Virements en cours */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">En Cours</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
              {kpis.inTreatmentCount}
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">
            {isLoading ? "..." : kpis.inTreatmentCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Règlements en traitement</p>
        </div>

        {/* Versé sur la période */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Versé Période</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {isLoading ? "..." : formatCFA(kpis.paidAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total payé avec succès</p>
        </div>

        {/* Échecs / anomalies */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Échecs / Alertes</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs">
              {kpis.issuesCount}
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {isLoading ? "..." : kpis.issuesCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Refusés, échoués ou bloqués</p>
        </div>
      </div>

      {/* 3. ONGLETS PRINCIPAUX INTERNES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { id: "ALL", label: "Demandes de retrait", count: payoutRequests.length },
          { id: "TO_VALIDATE", label: "À valider", count: kpis.toTreatCount, highlight: kpis.toTreatCount > 0 },
          { id: "IN_TREATMENT", label: "Virements en cours", count: kpis.inTreatmentCount },
          { id: "HISTORY", label: "Historique", count: payoutRequests.filter(p => p.status === "PAID").length },
          { id: "ISSUES", label: "Échecs / anomalies", count: kpis.issuesCount, alert: kpis.issuesCount > 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as RetraitsTab)}
            className={`px-4 py-3 border-b-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              tab.alert 
                ? "bg-rose-100 text-rose-700" 
                : tab.highlight 
                ? "bg-amber-100 text-amber-800" 
                : activeTab === tab.id 
                ? "bg-purple-100 text-purple-800" 
                : "bg-slate-100 text-slate-600"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. BARRE DE RECHERCHE ET FILTRES */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par référence, marchand, téléphone, référence virement..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtre Marchand */}
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les marchands</option>
              {partners.map((prt) => (
                <option key={prt.id} value={prt.id}>
                  {prt.companyName}
                </option>
              ))}
            </select>

            {/* Filtre Moyen de paiement */}
            <select
              value={selectedOperatorFilter}
              onChange={(e) => setSelectedOperatorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les méthodes</option>
              <option value="LEEKPAY">LeekPay</option>
              <option value="BINANCE_PAY">Binance Pay</option>
              <option value="USDT">USDT TRC-20</option>
              <option value="MTN">MTN MoMo</option>
              <option value="MOOV">Moov Money</option>
              <option value="WAVE">Wave</option>
            </select>

            {/* Filtre Tranche Montant */}
            <select
              value={selectedAmountRange}
              onChange={(e) => setSelectedAmountRange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les montants</option>
              <option value="0_100K">0 - 100 000 GNF</option>
              <option value="100K_500K">100 000 - 500 000 GNF</option>
              <option value="OVER_500K">&gt; 500 000 GNF</option>
            </select>

            {/* Réinitialiser */}
            {(searchTerm || selectedPartnerFilter !== "ALL" || selectedOperatorFilter !== "ALL" || selectedAmountRange !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedPartnerFilter("ALL");
                  setSelectedOperatorFilter("ALL");
                  setSelectedAmountRange("ALL");
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. TABLEAU PRINCIPAL DES DEMANDES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-600" />
              Demandes de Retrait &amp; Règlements ({filteredPayouts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Vérification préalable du solde disponible avant tout ordre de virement.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400">
            Page {currentPage} sur {totalPages}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Marchand</th>
                <th className="py-3 px-4 text-right">Solde Disponible</th>
                <th className="py-3 px-4 text-right">Montant Demandé</th>
                <th className="py-3 px-4">Moyen de Règlement</th>
                <th className="py-3 px-4">Date Demande</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayouts.length > 0 ? (
                paginatedPayouts.map((p) => {
                  const fin = getPartnerFinancialPosition(p.partnerId);
                  const isExceedingBalance = p.amount > fin.availableBalance && p.status !== "PAID" && p.status !== "APPROVED";

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPayoutForDetail(p)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Référence */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.id}
                      </td>

                      {/* Marchand */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 border border-purple-100">
                            {p.partnerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.partnerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {p.partnerId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Solde disponible avant retrait */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <span className={`font-bold whitespace-nowrap ${isExceedingBalance ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatCFA(fin.availableBalance)}
                        </span>
                        {isExceedingBalance && (
                          <span className="block text-[10px] text-rose-600 font-bold whitespace-nowrap">Solde insuffisant</span>
                        )}
                      </td>

                      {/* Montant demandé */}
                      <td className="py-3.5 px-4 text-right font-black text-sm text-purple-700 whitespace-nowrap font-mono">
                        {formatCFA(p.amount)}
                      </td>

                      {/* Moyen de règlement */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderOperatorBadge(p.operator, p)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                        {new Date(p.requestedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(p.requestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(p.status)}
                      </td>

                      {/* Actions rapides contextuelles selon le statut */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* En attente : Voir ou Vérifier */}
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPayoutForApprove(p);
                                  setApproveNoteInput("Contrôle de sécurité validé par la trésorerie.");
                                }}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition cursor-pointer"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => setSelectedPayoutForReject(p)}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                              >
                                Refuser
                              </button>
                            </>
                          )}

                          {/* À vérifier : Approuver / Refuser / Bloquer */}
                          {p.status === "IN_VERIFICATION" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPayoutForApprove(p);
                                  setApproveNoteInput("Vérification terminée et conforme.");
                                }}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition cursor-pointer"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => setSelectedPayoutForBlock(p)}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer"
                              >
                                Bloquer
                              </button>
                            </>
                          )}

                          {/* Approuvé : Lancer le règlement */}
                          {p.status === "APPROVED" && (
                            <button
                              onClick={() => handleOpenPaymentConfirm(p)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Régler</span>
                            </button>
                          )}

                          {/* En traitement : Suivi */}
                          {p.status === "IN_TREATMENT" && (
                            <button
                              onClick={() => handleOpenPaymentConfirm(p)}
                              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              Finaliser Virement
                            </button>
                          )}

                          {/* Échecs : Voir Erreur */}
                          {p.status === "FAILED" && (
                            <button
                              onClick={() => setSelectedPayoutForDetail(p)}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              Voir Erreur
                            </button>
                          )}

                          {/* Bouton Détail universel */}
                          <button
                            onClick={() => setSelectedPayoutForDetail(p)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            title="Consulter la fiche"
                          >
                            <Eye className="w-4 h-4" />
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
                        <Wallet className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Aucune demande trouvée</p>
                      <p className="text-xs text-slate-400">
                        Aucun retrait ne correspond aux critères sélectionnés.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {paginatedPayouts.length > 0 ? (
            paginatedPayouts.map((p) => {
              const fin = getPartnerFinancialPosition(p.partnerId);
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPayoutForDetail(p)}
                  className="p-4 space-y-3 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{p.id}</span>
                        {renderStatusBadge(p.status)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{p.partnerName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-base text-purple-700">{formatCFA(p.amount)}</span>
                      <span className="block text-[10px] text-slate-400">
                        Solde dispo: {formatCFA(fin.availableBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-200/60">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Moyen de paiement :</span>
                      {renderOperatorBadge(p.operator, p)}
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Date :</span>
                      <span>{new Date(p.requestedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedPayoutForDetail(p)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Fiche Détail</span>
                    </button>

                    {p.status === "APPROVED" && (
                      <button
                        onClick={() => handleOpenPaymentConfirm(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Régler</span>
                      </button>
                    )}
                    {p.status === "PENDING" && (
                      <button
                        onClick={() => {
                          setSelectedPayoutForApprove(p);
                          setApproveNoteInput("Contrôle de sécurité validé.");
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Approuver
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs px-4">
              Aucune demande trouvée avec ce filtre.
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {/* 6. MODAL / DRAWER DE DÉTAIL D'UNE DEMANDE */}
      {selectedPayoutForDetail && (() => {
        const fin = getPartnerFinancialPosition(selectedPayoutForDetail.partnerId);
        const remainingBalanceAfter = Math.max(0, fin.availableBalance - selectedPayoutForDetail.amount);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 animate-scale-up space-y-6">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">Retrait {selectedPayoutForDetail.id}</h3>
                      {renderStatusBadge(selectedPayoutForDetail.status)}
                    </div>
                    <p className="text-xs text-slate-500">
                      Demandé le {new Date(selectedPayoutForDetail.requestedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayoutForDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Situation Financière du Marchand */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Solde disponible avant retrait :</span>
                  <span className="font-bold text-slate-900">{formatCFA(fin.availableBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-purple-700 font-bold">
                  <span>Montant demandé pour virement :</span>
                  <span className="text-sm">−{formatCFA(selectedPayoutForDetail.amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-200/80 text-slate-800 font-black">
                  <span>Solde restant après règlement :</span>
                  <span className="text-emerald-700 text-sm">{formatCFA(remainingBalanceAfter)}</span>
                </div>
              </div>

              {/* Informations du Virement & Compte Récepteur Masqué */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Marchand bénéficiaire :</span>
                  <span className="font-bold text-slate-900">{selectedPayoutForDetail.partnerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Méthode de paiement :</span>
                  <span className="font-bold text-slate-900">{selectedPayoutForDetail.operator}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Coordonnées de virement :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedPayoutForDetail.phone || selectedPayoutForDetail.binancePayId || selectedPayoutForDetail.cryptoAddress || "N/A"}
                  </span>
                </div>
                {selectedPayoutForDetail.paymentReference && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Référence de virement :</span>
                    <span className="font-mono font-bold text-emerald-700">{selectedPayoutForDetail.paymentReference}</span>
                  </div>
                )}
                {selectedPayoutForDetail.adminProcessorName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Opérateur / Valideur :</span>
                    <span className="font-semibold text-slate-800">{selectedPayoutForDetail.adminProcessorName}</span>
                  </div>
                )}
                {selectedPayoutForDetail.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] mt-2">
                    <span className="font-bold block">Motif de rejet / anomalie :</span>
                    {selectedPayoutForDetail.rejectionReason}
                  </div>
                )}
              </div>

              {/* Historique du Retrait */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  Journal de traçabilité de l&apos;opération
                </h4>
                <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{new Date(selectedPayoutForDetail.requestedAt).toLocaleString('fr-FR')}</span>
                    <span className="font-bold text-slate-800">Demande créée par le marchand</span>
                  </div>
                  {selectedPayoutForDetail.approvedAt && (
                    <div className="flex items-center justify-between text-indigo-700">
                      <span>{new Date(selectedPayoutForDetail.approvedAt).toLocaleString('fr-FR')}</span>
                      <span className="font-bold">Retrait approuvé par la Trésorerie</span>
                    </div>
                  )}
                  {selectedPayoutForDetail.paidAt && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>{new Date(selectedPayoutForDetail.paidAt).toLocaleString('fr-FR')}</span>
                      <span>Virement confirmé &amp; lettré au Grand Livre</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons d'actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPayoutForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Fermer
                </button>
                {selectedPayoutForDetail.status === "APPROVED" && (
                  <button
                    onClick={() => {
                      const p = selectedPayoutForDetail;
                      setSelectedPayoutForDetail(null);
                      handleOpenPaymentConfirm(p);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lancer le Règlement</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. MODALE DE CONFIRMATION AVANT RÈGLEMENT */}
      {selectedPayoutForPayment && (() => {
        const fin = getPartnerFinancialPosition(selectedPayoutForPayment.partnerId);
        const remainingAfter = Math.max(0, fin.availableBalance - selectedPayoutForPayment.amount);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirmation avant virement</h3>
                  <p className="text-xs text-slate-500">Règlement irrévocable de fonds marchand</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Marchand :</span>
                  <span className="font-bold text-slate-900">{selectedPayoutForPayment.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant à virer :</span>
                  <span className="font-black text-purple-700 text-sm">{formatCFA(selectedPayoutForPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Solde disponible :</span>
                  <span className="font-bold text-slate-800">{formatCFA(fin.availableBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Moyen de règlement :</span>
                  <span className="font-bold text-slate-900">{selectedPayoutForPayment.operator}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black">
                  <span className="text-slate-900">Solde restant après règlement :</span>
                  <span className="text-emerald-700">{formatCFA(remainingAfter)}</span>
                </div>
              </div>

              <form onSubmit={handleExecutePayment} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Référence de Virement / Transaction Bancaire
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReferenceInput}
                    onChange={(e) => setPaymentReferenceInput(e.target.value)}
                    placeholder="Ex: LK-PAY-984210, MTN-TX-88412..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayoutForPayment(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? "Traitement..." : "Confirmer le virement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 8. MODALE D'APPROBATION */}
      {selectedPayoutForApprove && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Approuver la demande</h3>
                <p className="text-xs text-slate-500">{selectedPayoutForApprove.id} • {selectedPayoutForApprove.partnerName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Vous autorisez la demande de retrait de <span className="font-bold text-slate-900">{formatCFA(selectedPayoutForApprove.amount)}</span>. La demande passera à l&apos;état <span className="font-bold text-indigo-600">Approuvé</span> et sera prête pour exécution.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Note interne de vérification (optionnelle)
              </label>
              <textarea
                value={approveNoteInput}
                onChange={(e) => setApproveNoteInput(e.target.value)}
                placeholder="Ex: Contrôle de solvabilité effectué..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayoutForApprove(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
              >
                Confirmer l&apos;approbation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODALE DE REFUS AVEC MOTIF OBLIGATOIRE */}
      {selectedPayoutForReject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Refuser la demande de retrait</h3>
                <p className="text-xs text-slate-500">{selectedPayoutForReject.id} • {selectedPayoutForReject.partnerName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Le rejet d&apos;une demande réintègre immédiatement les <span className="font-bold text-slate-900">{formatCFA(selectedPayoutForReject.amount)}</span> dans le solde disponible du marchand.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">
                Motif obligatoire du refus *
              </label>
              <textarea
                required
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Ex: Solde insuffisant, informations bancaires invalides, litige commande..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600 bg-slate-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayoutForReject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                Refuser et Notifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODALE DE BLOCAGE TEMPORAIRE */}
      {selectedPayoutForBlock && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Bloquer temporairement</h3>
                <p className="text-xs text-slate-500">{selectedPayoutForBlock.id} • {selectedPayoutForBlock.partnerName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Cette action suspend temporairement l&apos;opération pour anomalie, suspicion de fraude ou contrôle d&apos;audit.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">
                Justification du blocage *
              </label>
              <textarea
                required
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                placeholder="Ex: Détection d'anomalie financière, discordance sur le relevé..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-slate-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayoutForBlock(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmBlock}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
              >
                Bloquer la Demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RetraitsVirementsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm font-medium">Chargement des retraits et virements...</div>}>
      <RetraitsVirementsContent />
    </Suspense>
  );
}
