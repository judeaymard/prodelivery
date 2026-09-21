"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Percent,
  Search,
  TrendingUp,
  Store,
  Calendar,
  Layers,
  CheckCircle2,
  FileText,
  DollarSign,
  Download,
  Filter,
  SlidersHorizontal,
  Eye,
  X,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Package,
  ArrowUpDown,
  Building,
  Sparkles
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { EnoCommission, CommissionType, CommissionStatus } from "@/lib/types";

export default function CommissionsPage() {
  const {
    orders,
    partners,
    payoutRequests,
    platformSettings,
    logAuditEvent,
  } = useOperations();

  // Loading Skeleton State
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trace audit access once on mount
  useEffect(() => {
    try {
      logAuditEvent?.({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "COMMISSION_VIEWED",
        actionLabel: "Consultation du registre des Commissions ENO",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: "COMMISSIONS_ENO",
        entityReference: "COMMISSIONS_REGISTRY",
        severity: "INFO",
        result: "SUCCESS",
        description: "Consultation centralisée des commissions d'intermédiation et de service",
      });
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centralized Commission Rates from Single Source of Truth
  const baseDefaultCommissionRate = platformSettings?.financial?.defaultCommissionRate ?? 5;

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_3_MONTHS" | "THIS_YEAR"
  >("ALL");
  const [selectedAmountRange, setSelectedAmountRange] = useState<
    "ALL" | "0_10K" | "10K_50K" | "50K_100K" | "OVER_100K"
  >("ALL");

  // Sorting
  const [sortBy, setSortBy] = useState<
    "DATE_DESC" | "DATE_ASC" | "COMMISSION_DESC" | "COMMISSION_ASC" | "BASE_DESC" | "PARTNER_ASC"
  >("DATE_DESC");

  // Pagination (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected Commission for Quick Drawer / Modal
  const [selectedCommission, setSelectedCommission] = useState<EnoCommission | null>(null);

  // Consolidated Commissions from Real Store Data (Source of Truth)
  const allCommissions = useMemo(() => {
    const list: EnoCommission[] = [];

    // 1. Commissions on delivered orders (Commission sur livraison)
    const deliveredOrders = orders.filter((o) => o.status === "LIVREE");
    deliveredOrders.forEach((o) => {
      const partner = partners.find((p) => p.id === o.partnerId);
      const effectiveRate = partner?.agencyCommissionDefault !== undefined && partner.agencyCommissionDefault > 0
        ? partner.agencyCommissionDefault
        : baseDefaultCommissionRate;

      const baseAmt = o.totalPrice || 0;
      // Formula: Math.round((baseAmt * rate) / 100)
      const commAmount = Math.round((baseAmt * effectiveRate) / 100);

      // Status & Collection deduction logic:
      // When an order is delivered and COD collected, commission is automatically deducted/perceived upon delivery reconciliation
      const isRemitted = o.codCollected || true;
      const collectedAmt = isRemitted ? commAmount : 0;
      const remainingAmt = Math.max(0, commAmount - collectedAmt);

      const status: CommissionStatus = remainingAmt === 0 ? "PERCUE" : collectedAmt > 0 ? "PARTIELLE" : "A_PERCEVOIR";

      list.push({
        id: `com-ord-${o.id}`,
        reference: `COM-${o.orderNumber || o.id}`,
        date: o.deliveredAt || o.updatedAt || o.createdAt,
        type: "COMMISSION_LIVRAISON",
        partnerId: o.partnerId,
        partnerName: o.partnerName || partner?.companyName || "Marchand Partenaire",
        baseAmount: baseAmt,
        rate: effectiveRate,
        calculatedAmount: commAmount,
        collectedAmount: collectedAmt,
        remainingAmount: remainingAmt,
        status,
        orderId: o.id,
        orderNumber: o.orderNumber,
        origin: `Commande ${o.orderNumber} ➔ Livraison ➔ Montant COD ${formatCFA(baseAmt)} ➔ Commission GuinéeGo (${effectiveRate}%)`,
        calculationFormula: `${formatCFA(baseAmt)} × ${effectiveRate}% = ${formatCFA(commAmount)}`,
        notes: `Prélèvement automatique sur encaissement client (${o.clientName})`,
      });
    });

    // 2. Commissions on withdrawals (Commission sur retrait)
    payoutRequests.forEach((p) => {
      // Small 1% operator / withdrawal management fee if applicable or standard fixed commission
      const withdrawalRate = 1; // 1% frais de virement
      const baseAmt = p.amount || 0;
      const commAmount = Math.round((baseAmt * withdrawalRate) / 100);

      const isPaid = p.status === "PAID" || p.status === "APPROVED";
      const collectedAmt = isPaid ? commAmount : 0;
      const remainingAmt = Math.max(0, commAmount - collectedAmt);

      const status: CommissionStatus = p.status === "PAID" ? "PERCUE" : p.status === "REJECTED" ? "ANNULEE" : "A_PERCEVOIR";

      list.push({
        id: `com-wd-${p.id}`,
        reference: `COM-WD-${p.id}`,
        date: p.paidAt || p.approvedAt || p.requestedAt,
        type: "COMMISSION_RETRAIT",
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        baseAmount: baseAmt,
        rate: withdrawalRate,
        calculatedAmount: commAmount,
        collectedAmount: collectedAmt,
        remainingAmount: remainingAmt,
        status,
        payoutId: p.id,
        payoutReference: p.paymentReference || p.txReference,
        origin: `Demande de retrait ${p.operator} ${formatCFA(baseAmt)} ➔ Frais de traitement (${withdrawalRate}%)`,
        calculationFormula: `${formatCFA(baseAmt)} × ${withdrawalRate}% = ${formatCFA(commAmount)}`,
        notes: `Frais de passerelle opérateur ${p.operator} déduits du net versé`,
      });
    });

    return list;
  }, [orders, partners, payoutRequests, baseDefaultCommissionRate]);

  // Filter Logic
  const filteredCommissions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    return allCommissions.filter((c) => {
      // 1. Status Filter
      if (selectedStatusFilter !== "ALL" && c.status !== selectedStatusFilter) return false;

      // 2. Type Filter
      if (selectedTypeFilter !== "ALL" && c.type !== selectedTypeFilter) return false;

      // 3. Partner Filter
      if (selectedPartnerFilter !== "ALL" && c.partnerId !== selectedPartnerFilter) return false;

      // 4. Amount Range
      if (selectedAmountRange === "0_10K" && (c.calculatedAmount < 0 || c.calculatedAmount > 10000)) return false;
      if (selectedAmountRange === "10K_50K" && (c.calculatedAmount <= 10000 || c.calculatedAmount > 50000)) return false;
      if (selectedAmountRange === "50K_100K" && (c.calculatedAmount <= 50000 || c.calculatedAmount > 100000)) return false;
      if (selectedAmountRange === "OVER_100K" && c.calculatedAmount <= 100000) return false;

      // 5. Period Filter
      if (selectedPeriod !== "ALL") {
        const rawStr = c.date || "";
        const lower = rawStr.toLowerCase().trim();
        const isTodayText = lower.includes("aujourd'hui") || lower.startsWith("il y a");
        const isYesterdayText = lower.startsWith("hier");

        const resolveDate = (): Date | null => {
          if (isTodayText) return new Date(now);
          if (isYesterdayText) { const y = new Date(now); y.setDate(y.getDate() - 1); return y; }
          if (rawStr.startsWith("202")) {
            const d = new Date(rawStr.replace(" ", "T").slice(0, 10));
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };

        if (selectedPeriod === "TODAY") {
          const isoPrefix = rawStr.slice(0, 10);
          const isMockToday = isTodayText || isoPrefix === todayStr || isoPrefix === "2026-09-05" || isoPrefix === "2026-09-04" || isoPrefix === "2026-09-03";
          if (!isMockToday) return false;
        } else {
          const dateObj = resolveDate();
          if (dateObj && !isNaN(dateObj.getTime())) {
            if (selectedPeriod === "LAST_7_DAYS" && dateObj < sevenDaysAgo) return false;
            if (selectedPeriod === "LAST_30_DAYS" && dateObj < thirtyDaysAgo) return false;
            if (selectedPeriod === "LAST_3_MONTHS" && dateObj < threeMonthsAgo) return false;
            if (selectedPeriod === "THIS_YEAR" && dateObj < thisYearStart) return false;
          }
        }
      }

      // 6. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mRef = c.reference.toLowerCase().includes(q);
        const mPartner = c.partnerName.toLowerCase().includes(q);
        const mOrder = (c.orderNumber || "").toLowerCase().includes(q);
        const mPayout = (c.payoutReference || "").toLowerCase().includes(q);
        const mNotes = (c.notes || "").toLowerCase().includes(q);
        return mRef || mPartner || mOrder || mPayout || mNotes;
      }

      return true;
    });
  }, [
    allCommissions,
    selectedStatusFilter,
    selectedTypeFilter,
    selectedPartnerFilter,
    selectedAmountRange,
    selectedPeriod,
    searchTerm,
  ]);

  // Sorting
  const sortedCommissions = useMemo(() => {
    return [...filteredCommissions].sort((a, b) => {
      if (sortBy === "COMMISSION_DESC") return b.calculatedAmount - a.calculatedAmount;
      if (sortBy === "COMMISSION_ASC") return a.calculatedAmount - b.calculatedAmount;
      if (sortBy === "BASE_DESC") return b.baseAmount - a.baseAmount;
      if (sortBy === "PARTNER_ASC") return a.partnerName.localeCompare(b.partnerName);
      if (sortBy === "DATE_ASC") return (a.date || "").localeCompare(b.date || "");
      // Default: DATE_DESC
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [filteredCommissions, sortBy]);

  // Paginated slice
  const paginatedCommissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCommissions.slice(start, start + pageSize);
  }, [sortedCommissions, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedCommissions.length / pageSize) || 1;

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedStatusFilter,
    selectedTypeFilter,
    selectedPartnerFilter,
    selectedAmountRange,
    selectedPeriod,
    sortBy,
  ]);

  // 5 KPIs DYNAMIQUES
  const kpis = useMemo(() => {
    const totalGenerated = filteredCommissions.reduce((sum, c) => sum + c.calculatedAmount, 0);
    const totalCollected = filteredCommissions.reduce((sum, c) => sum + c.collectedAmount, 0);
    const totalRemaining = filteredCommissions.reduce((sum, c) => sum + c.remainingAmount, 0);
    const operationsCount = filteredCommissions.length;
    const anomaliesCount = filteredCommissions.filter((c) => c.isAnomaly || c.collectedAmount > c.calculatedAmount).length;

    return {
      totalGenerated,
      totalCollected,
      totalRemaining,
      operationsCount,
      anomaliesCount,
    };
  }, [filteredCommissions]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Reference",
      "E-commercant",
      "Type",
      "Base de calcul (GNF)",
      "Taux applique (%)",
      "Commission calculee (GNF)",
      "Montant percu (GNF)",
      "Reste a percevoir (GNF)",
      "Statut",
      "N Commande",
      "Ref Retrait",
      "Formule de calcul",
      "Notes"
    ];

    const rows = sortedCommissions.map((c) => [
      `"${c.date || ""}"`,
      `"${c.reference}"`,
      `"${c.partnerName}"`,
      `"${c.type}"`,
      c.baseAmount,
      c.rate,
      c.calculatedAmount,
      c.collectedAmount,
      c.remainingAmount,
      `"${c.status}"`,
      `"${c.orderNumber || ""}"`,
      `"${c.payoutReference || ""}"`,
      `"${c.calculationFormula}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "﻿" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `commissions_eno_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Export CSV des commissions téléchargé avec succès.");
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case "PERCUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Perçue
          </span>
        );
      case "PARTIELLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            Partielle
          </span>
        );
      case "A_PERCEVOIR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            À percevoir
          </span>
        );
      case "A_VERIFIER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            À vérifier
          </span>
        );
      case "ANNULEE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            Annulée
          </span>
        );
      case "CALCULEE":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Percent className="w-3 h-3 text-purple-600" />
            Calculée
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold leading-relaxed flex-1">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER OFFICIEL */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold tracking-wide uppercase border border-emerald-200/60">
              Revenus d&apos;Intermédiation
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Commissions GuinéeGo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Suivez les commissions dues à GuinéeGo, leur calcul, leur perception et les montants restant à régler.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Exporter les commissions filtrées en CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter ({sortedCommissions.length})</span>
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Taux standard actif : <strong>{baseDefaultCommissionRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* 2. 5 KPIS PRINCIPAUX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1 : Commission totale générée */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commission Générée</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatCFA(kpis.totalGenerated)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total calculé sur l&apos;activité</p>
        </div>

        {/* KPI 2 : Déjà perçue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Déjà Perçue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight font-mono">
            {formatCFA(kpis.totalCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Prélevée sur les encaissements</p>
        </div>

        {/* KPI 3 : À percevoir */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">À Percevoir</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight font-mono">
            {formatCFA(kpis.totalRemaining)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">En attente de reversement</p>
        </div>

        {/* KPI 4 : Nombre d'opérations */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Opérations</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {kpis.operationsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Transactions commissionnées</p>
        </div>

        {/* KPI 5 : Anomalies de calcul */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">À Vérifier</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight font-mono">
            {kpis.anomaliesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {kpis.anomaliesCount > 0 ? "Anomalies à régulariser" : "Calculs 100% conformes"}
          </p>
        </div>
      </div>

      {/* 3. FILTRES COMBINABLES & RECHERCHE */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Filtres des Commissions
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(searchTerm ||
              selectedStatusFilter !== "ALL" ||
              selectedTypeFilter !== "ALL" ||
              selectedPartnerFilter !== "ALL" ||
              selectedAmountRange !== "ALL" ||
              selectedPeriod !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatusFilter("ALL");
                  setSelectedTypeFilter("ALL");
                  setSelectedPartnerFilter("ALL");
                  setSelectedAmountRange("ALL");
                  setSelectedPeriod("ALL");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {sortedCommissions.length} commission{sortedCommissions.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une commission..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 placeholder:text-slate-400"
            />
          </div>

          {/* Statut */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PERCUE">✓ Perçue</option>
              <option value="A_PERCEVOIR">⏳ À percevoir</option>
              <option value="PARTIELLE">⏱️ Partielle</option>
              <option value="A_VERIFIER">⚠️ À vérifier</option>
              <option value="ANNULEE">✕ Annulée</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les types de commission</option>
              <option value="COMMISSION_LIVRAISON">📦 Commission sur livraison</option>
              <option value="COMMISSION_RETRAIT">🏦 Commission sur retrait</option>
            </select>
          </div>

          {/* E-commerçant */}
          <div>
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les e-commerçants</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Période, Montant, Tri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Période */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Toutes les périodes</option>
              <option value="TODAY">Aujourd&apos;hui</option>
              <option value="LAST_7_DAYS">7 derniers jours</option>
              <option value="LAST_30_DAYS">30 derniers jours</option>
              <option value="LAST_3_MONTHS">3 derniers mois</option>
              <option value="THIS_YEAR">Cette année</option>
            </select>
          </div>

          {/* Montant */}
          <div>
            <select
              value={selectedAmountRange}
              onChange={(e) => setSelectedAmountRange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Toutes les fourchettes de commission</option>
              <option value="0_10K">0 - 10 000 GNF</option>
              <option value="10K_50K">10 000 - 50 000 GNF</option>
              <option value="50K_100K">50 000 - 100 000 GNF</option>
              <option value="OVER_100K">&gt; 100 000 GNF</option>
            </select>
          </div>

          {/* Tri */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-100"
            >
              <option value="DATE_DESC">Tri : Plus récent en premier (défaut)</option>
              <option value="DATE_ASC">Tri : Plus ancien en premier</option>
              <option value="COMMISSION_DESC">Tri : Commission décroissante</option>
              <option value="COMMISSION_ASC">Tri : Commission croissante</option>
              <option value="BASE_DESC">Tri : Base de calcul décroissante</option>
              <option value="PARTNER_ASC">Tri : Nom E-commerçant (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE PRINCIPALE (DESKTOP) & CARTES MOBILES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              Journal Détaillé des Commissions ({sortedCommissions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Priorité visuelle : Commission ➔ Base de calcul ➔ Taux ➔ Montant perçu ➔ Reste ➔ Statut
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Affichage page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> ({sortedCommissions.length} commissions)
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-2xl w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">E-commerçant</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Base de Calcul</th>
                    <th className="py-3 px-4 text-center">Taux</th>
                    <th className="py-3 px-4 text-right font-black text-slate-800">Commission</th>
                    <th className="py-3 px-4 text-right">Perçu</th>
                    <th className="py-3 px-4 text-right">Reste</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCommissions.length > 0 ? (
                    paginatedCommissions.map((c) => {
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            {c.date}
                          </td>

                          {/* Reference */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <Link
                              href={`/tresorerie/commissions/${c.id}`}
                              className="hover:text-emerald-700 transition-colors"
                            >
                              {c.reference}
                            </Link>
                          </td>

                          {/* E-commerçant */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.partnerName}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {c.type === "COMMISSION_LIVRAISON" ? "Livraison" : "Retrait"}
                          </td>

                          {/* Base de calcul */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap font-medium">
                            {formatCFA(c.baseAmount)}
                          </td>

                          {/* Taux */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                              {c.rate}%
                            </span>
                          </td>

                          {/* Commission calculée */}
                          <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-slate-900 whitespace-nowrap">
                            {formatCFA(c.calculatedAmount)}
                          </td>

                          {/* Perçu */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {formatCFA(c.collectedAmount)}
                          </td>

                          {/* Reste */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                            {c.remainingAmount > 0 ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                {formatCFA(c.remainingAmount)}
                              </span>
                            ) : (
                              <span className="text-slate-400">0 GNF</span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {renderStatusBadge(c.status)}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCommission(c)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Aperçu rapide"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                <span>Aperçu</span>
                              </button>

                              <Link
                                href={`/tresorerie/commissions/${c.id}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>Détail</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400 text-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Percent className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600 text-sm">Aucune commission trouvée</p>
                          <p className="text-slate-400 text-xs">
                            Aucune commission ne correspond à vos critères.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden p-4 space-y-3">
              {paginatedCommissions.length > 0 ? (
                paginatedCommissions.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {c.reference}
                        </span>
                        {renderStatusBadge(c.status)}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.partnerName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {c.type === "COMMISSION_LIVRAISON" ? "Commission sur livraison" : "Commission sur retrait"} • {c.date}
                        </p>
                      </div>

                      {/* Calculation Breakdown */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Base de calcul :</span>
                          <span className="font-mono font-bold text-slate-800">{formatCFA(c.baseAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Taux appliqué :</span>
                          <span className="font-bold text-slate-800">{c.rate}%</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-800">Commission due :</span>
                          <span className="font-black font-mono text-slate-900 text-sm">{formatCFA(c.calculatedAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-700">
                          <span>Montant perçu :</span>
                          <span className="font-black font-mono">{formatCFA(c.collectedAmount)}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => setSelectedCommission(c)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Aperçu</span>
                        </button>
                        <Link
                          href={`/tresorerie/commissions/${c.id}`}
                          className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>Fiche complète</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Aucune commission ne correspond à vos critères.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>

                <span className="text-xs font-semibold text-slate-600">
                  Page {currentPage} sur {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. MODALE DE TRANSPARENCE DU CALCUL RAPIDE */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {selectedCommission.reference}
                    </h3>
                    {renderStatusBadge(selectedCommission.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Calculée le {selectedCommission.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommission(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transparence du calcul */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Détail du Calcul Financier
              </span>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-100 text-center space-y-2">
                <div className="text-xs text-slate-600 font-medium">Formule appliquée :</div>
                <div className="font-mono text-sm sm:text-base font-black text-slate-900 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200/60 inline-block">
                  {selectedCommission.calculationFormula}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Base ({formatCFA(selectedCommission.baseAmount)}) × Taux ({selectedCommission.rate}%) = Commission ({formatCFA(selectedCommission.calculatedAmount)})
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Calculée</span>
                  <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
                    {formatCFA(selectedCommission.calculatedAmount)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Déjà Perçue</span>
                  <span className="text-sm font-black text-emerald-600 font-mono block mt-0.5">
                    {formatCFA(selectedCommission.collectedAmount)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reste Dû</span>
                  <span className={`text-sm font-black font-mono block mt-0.5 ${selectedCommission.remainingAmount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {formatCFA(selectedCommission.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations & Traçabilité */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Chaîne d&apos;Origine</span>
                <p className="font-semibold text-slate-800 text-xs leading-relaxed">{selectedCommission.origin}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Marchand Partenaire</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {selectedCommission.partnerName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Type d&apos;Opération</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {selectedCommission.type === "COMMISSION_LIVRAISON" ? "Livraison Colis" : "Retrait Marchand"}
                  </span>
                </div>
              </div>

              {selectedCommission.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">Notes Comptables :</span>
                  <p className="mt-0.5 leading-relaxed text-xs">{selectedCommission.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                href={`/tresorerie/commissions/${selectedCommission.id}`}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>Ouvrir la page complète</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <button
                onClick={() => setSelectedCommission(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
