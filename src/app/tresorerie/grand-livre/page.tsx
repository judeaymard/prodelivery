"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Search,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Eye,
  X,
  CreditCard,
  Building,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Banknote,
  Bike,
  Store,
  FileText,
  Clock,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { FinancialTransaction, TransactionType } from "@/lib/types";

export default function GrandLivreJournalPage() {
  const {
    transactions,
    codCollections,
    codRemittances,
    payoutRequests,
    orders,
    partners,
    livreurs,
    logAuditEvent,
  } = useOperations();

  // Skeleton loading state
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
        action: "GENERAL_LEDGER_VIEWED",
        actionLabel: "Consultation du Grand Livre & Journal",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: "GRAND_LIVRE",
        entityReference: "JOURNAL_COMPTABLE",
        severity: "INFO",
        result: "SUCCESS",
        description: "Consultation centralisée des écritures comptables et mouvements de trésorerie",
      });
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedDirectionFilter, setSelectedDirectionFilter] = useState<"ALL" | "INFLOW" | "OUTFLOW">("ALL");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<"ALL" | "LIVREUR" | "PARTNER" | "ENO">("ALL");
  const [selectedAmountRange, setSelectedAmountRange] = useState<"ALL" | "0_50K" | "50K_100K" | "100K_500K" | "OVER_500K">("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_3_MONTHS" | "THIS_YEAR"
  >("ALL");

  // Sorting
  const [sortBy, setSortBy] = useState<
    "DATE_DESC" | "DATE_ASC" | "AMOUNT_DESC" | "AMOUNT_ASC" | "REF_ASC" | "TYPE_ASC"
  >("DATE_DESC");

  // Pagination (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected transaction for detail modal
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);

  // Consolidated ledger entries from real store data (Source of Truth)
  const unifiedLedgerEntries = useMemo(() => {
    // 1. Existing central transactions
    const list: FinancialTransaction[] = [...transactions];

    // 2. Synthesize entries from validated / discrepancy remittances if not already present
    codRemittances.forEach((r) => {
      const alreadyIncluded = list.some(
        (t) => t.sourceId === r.id || t.sourceRef === r.reference || (t.txReference && t.txReference.includes(r.reference))
      );
      if (!alreadyIncluded) {
        const amt = r.amountValidated ?? r.receivedAmount ?? r.amountDeclared ?? 0;
        list.push({
          id: `tx-rem-${r.id}`,
          txReference: r.reference,
          date: r.validatedAt || r.receivedAt || r.createdAt,
          type: "REMISE_LIVREUR",
          label: `Remise de fonds livreur — ${r.livreurName}`,
          livreurId: r.livreurId,
          livreurName: r.livreurName,
          sourceType: "REMISE",
          sourceId: r.id,
          sourceRef: r.reference,
          accountOrigin: `Livreur (${r.livreurName})`,
          accountDestination: "Coffre-fort GuinéeGo",
          inflow: amt,
          outflow: 0,
          balanceAfter: 15200000, // baseline estimate
          status: r.status === "VALIDATED" ? "COMPLETED" : "PENDING",
          notes: r.notes || (r.discrepancyAmount ? `Écart constaté: ${formatCFA(Math.abs(r.discrepancyAmount))}` : "Versement au coffre"),
        });

        // If remittance has a discrepancy, record complementary discrepancy entry
        if (r.discrepancyAmount && r.discrepancyAmount !== 0) {
          list.push({
            id: `tx-ecart-${r.id}`,
            txReference: `ECART-${r.reference}`,
            date: r.validatedAt || r.createdAt,
            type: "ECART",
            label: `Écart signalé sur remise ${r.reference}`,
            livreurId: r.livreurId,
            livreurName: r.livreurName,
            sourceType: "ECART",
            sourceId: r.id,
            sourceRef: r.reference,
            accountOrigin: "Caisse Courante",
            accountDestination: "Compte d'Attente Écarts",
            inflow: 0,
            outflow: Math.abs(r.discrepancyAmount),
            balanceAfter: 15200000 - Math.abs(r.discrepancyAmount),
            status: "PENDING",
            notes: r.discrepancyJustification || r.discrepancyReason || "Écart de remise en cours d'investigation",
          });
        }
      }
    });

    // 3. Synthesize entries from payout requests if not present
    payoutRequests.forEach((p) => {
      const alreadyIncluded = list.some(
        (t) => t.sourceId === p.id || t.sourceRef === p.id || t.txReference === p.txReference
      );
      if (!alreadyIncluded && (p.status === "PAID" || p.status === "APPROVED" || p.status === "PENDING")) {
        list.push({
          id: `tx-wd-${p.id}`,
          txReference: p.txReference || `TX-WD-${p.id}`,
          date: p.paidAt || p.approvedAt || p.requestedAt,
          type: "RETRAIT",
          label: `Retrait marchand ${p.partnerName} (${p.operator})`,
          partnerId: p.partnerId,
          partnerName: p.partnerName,
          sourceType: "RETRAIT",
          sourceId: p.id,
          sourceRef: p.id,
          accountOrigin: "Compte Marchand GuinéeGo",
          accountDestination: `Compte ${p.operator} Marchand`,
          balanceBefore: p.balanceBefore,
          inflow: 0,
          outflow: p.amount,
          balanceAfter: p.balanceAfter || (14500000 - p.amount),
          status: p.status === "PAID" ? "COMPLETED" : "PENDING",
          notes: p.internalNote || `Demande de reversement ${p.operator}`,
        });
      }
    });

    return list;
  }, [transactions, codRemittances, payoutRequests]);

  // Filtering unified entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    return unifiedLedgerEntries.filter((tx) => {
      // 1. Type Filter
      if (selectedTypeFilter !== "ALL") {
        if (selectedTypeFilter === "ENCAISSEMENT" && tx.type !== "ENCAISSEMENT_COD" && tx.type !== "LIVRAISON_ENCAISSEE") return false;
        if (selectedTypeFilter === "REMISE" && tx.type !== "REMISE_LIVREUR" && tx.type !== "REMISE_COMPLEMENTAIRE") return false;
        if (selectedTypeFilter === "RETRAIT" && tx.type !== "RETRAIT" && tx.type !== "VIREMENT") return false;
        if (selectedTypeFilter === "COMMISSION" && !tx.type.includes("COMMISSION")) return false;
        if (selectedTypeFilter === "ECART" && tx.type !== "ECART" && tx.type !== "RESOLUTION_ECART") return false;
        if (selectedTypeFilter === "AJUSTEMENT" && tx.type !== "AJUSTEMENT" && tx.type !== "CORRECTION_VALIDEE") return false;
      }

      // 2. Status Filter
      if (selectedStatusFilter !== "ALL") {
        if (selectedStatusFilter === "COMPLETED" && tx.status !== "COMPLETED") return false;
        if (selectedStatusFilter === "PENDING" && tx.status !== "PENDING") return false;
        if (selectedStatusFilter === "CANCELLED" && tx.status !== "CANCELLED") return false;
      }

      // 3. Direction (Sens)
      if (selectedDirectionFilter === "INFLOW" && (!tx.inflow || tx.inflow <= 0)) return false;
      if (selectedDirectionFilter === "OUTFLOW" && (!tx.outflow || tx.outflow <= 0)) return false;

      // 4. Entity Filter
      if (selectedEntityFilter === "LIVREUR" && !tx.livreurId && !tx.livreurName) return false;
      if (selectedEntityFilter === "PARTNER" && !tx.partnerId && !tx.partnerName) return false;
      if (selectedEntityFilter === "ENO" && (tx.livreurId || tx.partnerId)) return false;

      // 5. Amount Range
      const opAmount = (tx.inflow || 0) + (tx.outflow || 0);
      if (selectedAmountRange === "0_50K" && (opAmount < 0 || opAmount > 50000)) return false;
      if (selectedAmountRange === "50K_100K" && (opAmount <= 50000 || opAmount > 100000)) return false;
      if (selectedAmountRange === "100K_500K" && (opAmount <= 100000 || opAmount > 500000)) return false;
      if (selectedAmountRange === "OVER_500K" && opAmount <= 500000) return false;

      // 6. Period Filter
      if (selectedPeriod !== "ALL") {
        const dStr = tx.date || "";
        const isTodayText = dStr.toLowerCase().includes("aujourd'hui") || dStr.toLowerCase().includes("aujourd’hui");
        const isYesterdayText = dStr.toLowerCase().includes("hier");

        if (selectedPeriod === "TODAY") {
          if (!isTodayText && !dStr.startsWith(todayStr)) return false;
        } else if (selectedPeriod === "YESTERDAY") {
          if (!isYesterdayText && !dStr.startsWith(yesterdayStr)) return false;
        } else {
          let dateObj: Date | null = null;
          if (dStr.startsWith("202")) {
            dateObj = new Date(dStr.slice(0, 10));
          } else if (isTodayText) {
            dateObj = now;
          } else if (isYesterdayText) {
            dateObj = yesterdayDate;
          }

          if (dateObj && !isNaN(dateObj.getTime())) {
            if (selectedPeriod === "LAST_7_DAYS" && dateObj < sevenDaysAgo) return false;
            if (selectedPeriod === "LAST_30_DAYS" && dateObj < thirtyDaysAgo) return false;
            if (selectedPeriod === "LAST_3_MONTHS" && dateObj < threeMonthsAgo) return false;
            if (selectedPeriod === "THIS_YEAR" && dateObj < thisYearStart) return false;
          }
        }
      }

      // 7. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mRef = (tx.txReference || tx.id).toLowerCase().includes(q);
        const mLabel = (tx.label || "").toLowerCase().includes(q);
        const mPartner = (tx.partnerName || "").toLowerCase().includes(q);
        const mDriver = (tx.livreurName || "").toLowerCase().includes(q);
        const mOrder = (tx.orderNumber || "").toLowerCase().includes(q);
        const mType = tx.type.toLowerCase().includes(q);
        const mNotes = (tx.notes || "").toLowerCase().includes(q);
        return mRef || mLabel || mPartner || mDriver || mOrder || mType || mNotes;
      }

      return true;
    });
  }, [
    unifiedLedgerEntries,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedDirectionFilter,
    selectedEntityFilter,
    selectedAmountRange,
    selectedPeriod,
    searchTerm,
  ]);

  // Sorted entries
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const amtA = (a.inflow || 0) + (a.outflow || 0);
      const amtB = (b.inflow || 0) + (b.outflow || 0);

      if (sortBy === "AMOUNT_DESC") return amtB - amtA;
      if (sortBy === "AMOUNT_ASC") return amtA - amtB;
      if (sortBy === "REF_ASC") return (a.txReference || a.id).localeCompare(b.txReference || b.id);
      if (sortBy === "TYPE_ASC") return a.type.localeCompare(b.type);
      if (sortBy === "DATE_ASC") return (a.date || "").localeCompare(b.date || "");
      // Default: DATE_DESC (Plus récent en premier)
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [filteredEntries, sortBy]);

  // Paginated slice
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEntries.slice(start, start + pageSize);
  }, [sortedEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedEntries.length / pageSize) || 1;

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedDirectionFilter,
    selectedEntityFilter,
    selectedAmountRange,
    selectedPeriod,
    sortBy,
  ]);

  // Dynamic KPIs calculated from visible / filtered entries
  const kpis = useMemo(() => {
    const totalInflow = filteredEntries.reduce((sum, tx) => sum + (tx.inflow || 0), 0);
    const totalOutflow = filteredEntries.reduce((sum, tx) => sum + (tx.outflow || 0), 0);
    const netBalance = totalInflow - totalOutflow;
    const operationsCount = filteredEntries.length;

    // Available cash balance in central ledger (baseline + net)
    const baselineTreasury = 14500000;
    const estimatedAvailable = baselineTreasury + netBalance;

    return {
      totalInflow,
      totalOutflow,
      netBalance,
      operationsCount,
      estimatedAvailable,
    };
  }, [filteredEntries]);

  // Export CSV
  const handleExportCSV = () => {
    try {
      logAuditEvent?.({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "GENERAL_LEDGER_EXPORT_STARTED",
        actionLabel: "Export CSV Grand Livre",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: "EXPORT_LEDGER",
        entityReference: `EXPORT_${new Date().toISOString().slice(0, 10)}`,
        severity: "INFO",
        result: "SUCCESS",
        description: `Export de ${sortedEntries.length} écritures comptables du Grand Livre`,
      });
    } catch {}

    const headers = [
      "Date",
      "Reference",
      "Type Operation",
      "Libelle",
      "Compte Origine",
      "Compte Destination",
      "Entree (GNF)",
      "Sortie (GNF)",
      "Solde Apres (GNF)",
      "Statut",
      "Tiers Concerne",
      "N Commande",
      "Piece Source",
      "Notes"
    ];

    const rows = sortedEntries.map((tx) => [
      `"${tx.date || ""}"`,
      `"${tx.txReference || tx.id}"`,
      `"${tx.type}"`,
      `"${(tx.label || "").replace(/"/g, '""')}"`,
      `"${tx.accountOrigin || (tx.inflow ? "Tiers / Caisse" : "Trésorerie GuinéeGo")}"`,
      `"${tx.accountDestination || (tx.outflow ? "Bénéficiaire" : "Coffre-fort GuinéeGo")}"`,
      tx.inflow || 0,
      tx.outflow || 0,
      tx.balanceAfter || 0,
      `"${tx.status}"`,
      `"${tx.partnerName || tx.livreurName || "Caisse Centrale"}"`,
      `"${tx.orderNumber || ""}"`,
      `"${tx.sourceRef || tx.sourceId || ""}"`,
      `"${(tx.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "﻿" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `grand_livre_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Export CSV du Grand Livre téléchargé avec succès.");
  };

  // Helper for human-friendly Type Label & Badge
  const renderTypeBadge = (type: TransactionType) => {
    switch (type) {
      case "ENCAISSEMENT_COD":
      case "LIVRAISON_ENCAISSEE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Encaissement COD
          </span>
        );
      case "REMISE_LIVREUR":
      case "REMISE_COMPLEMENTAIRE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Receipt className="w-3 h-3 text-blue-600" />
            Remise Livreur
          </span>
        );
      case "RETRAIT":
      case "VIREMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            Retrait Marchand
          </span>
        );
      case "COMMISSION_ENO":
      case "COMMISSION_AGENCE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            Commission GuinéeGo
          </span>
        );
      case "ECART":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Écart Constaté
          </span>
        );
      case "RESOLUTION_ECART":
      case "CORRECTION_VALIDEE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            Régularisation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {type.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* SUCCESS TOAST */}
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
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold tracking-wide uppercase border border-slate-200">
              Comptabilité Centrale
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Grand Livre & Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Consultez les mouvements financiers enregistrés et suivez l&apos;évolution des flux de trésorerie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Exporter les écritures filtrées en CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter ({sortedEntries.length})</span>
          </button>

          <Link
            href="/tresorerie/remises?action=new"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Pointage Remise</span>
          </Link>
        </div>
      </div>

      {/* 2. 5 KPIS DYNAMIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1 : Total Entrées */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entrées</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight font-mono">
            + {formatCFA(kpis.totalInflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Encaissements & dépôts au coffre</p>
        </div>

        {/* KPI 2 : Total Sorties */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sorties</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight font-mono">
            - {formatCFA(kpis.totalOutflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Retraits marchands & décaissements</p>
        </div>

        {/* KPI 3 : Net des mouvements */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net des Mouvements</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${kpis.netBalance >= 0 ? "text-blue-600" : "text-amber-600"}`}>
            {kpis.netBalance >= 0 ? "+ " : "- "}{formatCFA(Math.abs(kpis.netBalance))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Différence Entrées - Sorties</p>
        </div>

        {/* KPI 4 : Trésorerie Estimée */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trésorerie Actuelle</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatCFA(kpis.estimatedAvailable)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Position de caisse globale</p>
        </div>

        {/* KPI 5 : Nombre d'opérations */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Écritures</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {kpis.operationsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lignes d&apos;écritures enregistrées</p>
        </div>
      </div>

      {/* 3. FILTRES COMBINABLES & RECHERCHE AVANCÉE */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Filtres Comptables & Période
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(searchTerm ||
              selectedTypeFilter !== "ALL" ||
              selectedStatusFilter !== "ALL" ||
              selectedDirectionFilter !== "ALL" ||
              selectedEntityFilter !== "ALL" ||
              selectedAmountRange !== "ALL" ||
              selectedPeriod !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTypeFilter("ALL");
                  setSelectedStatusFilter("ALL");
                  setSelectedDirectionFilter("ALL");
                  setSelectedEntityFilter("ALL");
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
              {sortedEntries.length} écriture{sortedEntries.length > 1 ? "s" : ""} trouvée{sortedEntries.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Row 1: Search, Type, Status, Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans le journal..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 placeholder:text-slate-400"
            />
          </div>

          {/* Type d'opération */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les types d&apos;opérations</option>
              <option value="ENCAISSEMENT">📦 Encaissements COD</option>
              <option value="REMISE">💵 Remises Livreurs</option>
              <option value="RETRAIT">🏦 Retraits & Virements Marchands</option>
              <option value="COMMISSION">📈 Commissions GuinéeGo</option>
              <option value="ECART">⚠️ Écarts de caisse</option>
              <option value="AJUSTEMENT">⚙️ Ajustements & Régularisations</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Toutes les périodes</option>
              <option value="TODAY">Aujourd&apos;hui</option>
              <option value="YESTERDAY">Hier</option>
              <option value="LAST_7_DAYS">7 derniers jours</option>
              <option value="LAST_30_DAYS">30 derniers jours</option>
              <option value="LAST_3_MONTHS">3 derniers mois</option>
              <option value="THIS_YEAR">Cette année</option>
            </select>
          </div>

          {/* Statut comptable */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="COMPLETED">✓ Validée / Enregistrée</option>
              <option value="PENDING">⏳ En attente de validation</option>
              <option value="CANCELLED">✕ Annulée / Rejetée</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sens, Entité, Fourchette Montant, Tri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Sens du flux */}
          <div>
            <select
              value={selectedDirectionFilter}
              onChange={(e) => setSelectedDirectionFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les sens de flux</option>
              <option value="INFLOW">➕ Entrée de fonds (+)</option>
              <option value="OUTFLOW">➖ Sortie de fonds (-)</option>
            </select>
          </div>

          {/* Entité concernée */}
          <div>
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Toutes les entités</option>
              <option value="LIVREUR">🛵 Livreurs</option>
              <option value="PARTNER">🏬 E-commerçants</option>
              <option value="ENO">🏛️ GuinéeGo Agence</option>
            </select>
          </div>

          {/* Montant */}
          <div>
            <select
              value={selectedAmountRange}
              onChange={(e) => setSelectedAmountRange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les montants</option>
              <option value="0_50K">0 - 50 000 GNF</option>
              <option value="50K_100K">50 000 - 100 000 GNF</option>
              <option value="100K_500K">100 000 - 500 000 GNF</option>
              <option value="OVER_500K">&gt; 500 000 GNF</option>
            </select>
          </div>

          {/* Tri interactif */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-100"
            >
              <option value="DATE_DESC">Tri : Plus récent en premier (défaut)</option>
              <option value="DATE_ASC">Tri : Plus ancien en premier</option>
              <option value="AMOUNT_DESC">Tri : Montant décroissant</option>
              <option value="AMOUNT_ASC">Tri : Montant croissant</option>
              <option value="REF_ASC">Tri : Référence (A-Z)</option>
              <option value="TYPE_ASC">Tri : Type d&apos;opération (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE DU GRAND LIVRE (DESKTOP) & CARTES MOBILES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-800" />
              Journal Chronologique des Opérations ({sortedEntries.length})
            </h2>
            <p className="text-xs text-slate-500">
              Présentation fidèle et inaltérable des mouvements de fonds et d&apos;avoirs
            </p>
          </div>

          {/* Pagination status */}
          <div className="text-xs text-slate-500 font-medium">
            Affichage page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> ({sortedEntries.length} écritures)
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
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
                    <th className="py-3 px-4">Type d&apos;Opération</th>
                    <th className="py-3 px-4">Description / Libellé</th>
                    <th className="py-3 px-4">Tiers Lié</th>
                    <th className="py-3 px-4 text-right">Entrée (+)</th>
                    <th className="py-3 px-4 text-right">Sortie (-)</th>
                    <th className="py-3 px-4 text-right">Solde Après</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEntries.length > 0 ? (
                    paginatedEntries.map((tx) => {
                      const hasInflow = tx.inflow && tx.inflow > 0;
                      const hasOutflow = tx.outflow && tx.outflow > 0;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            {tx.date}
                          </td>

                          {/* Reference */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {tx.txReference || tx.id}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderTypeBadge(tx.type)}
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate" title={tx.label}>
                            {tx.label}
                          </td>

                          {/* Tiers Lié */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {tx.partnerName ? (
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <Store className="w-3 h-3 text-slate-400" />
                                <span>{tx.partnerName}</span>
                              </span>
                            ) : tx.livreurName ? (
                              <Link
                                href={`/tresorerie/livreurs/${tx.livreurId || ""}`}
                                className="font-semibold text-slate-800 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                              >
                                <Bike className="w-3 h-3 text-slate-400" />
                                <span>{tx.livreurName}</span>
                              </Link>
                            ) : (
                              <span className="text-slate-400">Trésorerie Centrale</span>
                            )}
                          </td>

                          {/* Entrée */}
                          <td className="py-3.5 px-4 text-right font-black font-mono text-sm whitespace-nowrap">
                            {hasInflow ? (
                              <span className="text-emerald-600">+ {formatCFA(tx.inflow)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Sortie */}
                          <td className="py-3.5 px-4 text-right font-black font-mono text-sm whitespace-nowrap">
                            {hasOutflow ? (
                              <span className="text-rose-600">- {formatCFA(tx.outflow)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Solde Après */}
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-600 whitespace-nowrap">
                            {formatCFA(tx.balanceAfter)}
                          </td>

                          {/* Statut */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {tx.status === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Validée
                              </span>
                            ) : tx.status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <X className="w-3 h-3 text-rose-600" />
                                Annulée
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Voir</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 text-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600 text-sm">Aucun mouvement financier trouvé</p>
                          <p className="text-slate-400 text-xs">
                            Aucune opération ne correspond à vos critères de recherche.
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
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((tx) => {
                  const hasInflow = tx.inflow && tx.inflow > 0;
                  const hasOutflow = tx.outflow && tx.outflow > 0;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {tx.txReference || tx.id}
                        </span>
                        {renderTypeBadge(tx.type)}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">{tx.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {tx.partnerName || tx.livreurName || "Trésorerie Centrale"} • {tx.date}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Mouvement</span>
                          {hasInflow ? (
                            <span className="font-black text-emerald-600 font-mono text-sm block mt-0.5">
                              + {formatCFA(tx.inflow)}
                            </span>
                          ) : hasOutflow ? (
                            <span className="font-black text-rose-600 font-mono text-sm block mt-0.5">
                              - {formatCFA(tx.outflow)}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 block mt-0.5">0 GNF</span>
                          )}
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-100 text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Solde Après</span>
                          <span className="font-mono font-black text-slate-800 text-sm block mt-0.5">
                            {formatCFA(tx.balanceAfter)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Détail comptable</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Aucune opération ne correspond à vos critères.
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

      {/* 5. MODALE DÉTAIL D'OPÉRATION COMPTABLE */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Écriture {selectedTx.txReference || selectedTx.id}
                    </h3>
                    {renderTypeBadge(selectedTx.type)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Enregistrée le {selectedTx.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Impact Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Impact Financier
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  Statut : {selectedTx.status === "COMPLETED" ? "Validée" : selectedTx.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-200">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Montant du Flux</span>
                  {selectedTx.inflow > 0 ? (
                    <span className="text-base font-black text-emerald-600 font-mono block mt-0.5">
                      + {formatCFA(selectedTx.inflow)}
                    </span>
                  ) : selectedTx.outflow > 0 ? (
                    <span className="text-base font-black text-rose-600 font-mono block mt-0.5">
                      - {formatCFA(selectedTx.outflow)}
                    </span>
                  ) : (
                    <span className="text-base font-black text-slate-400 font-mono block mt-0.5">0 GNF</span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Solde Après Écriture</span>
                  <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                    {formatCFA(selectedTx.balanceAfter)}
                  </span>
                </div>
              </div>
            </div>

            {/* Descriptive & Accounting Grid */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Libellé de l&apos;Opération</span>
                <p className="font-bold text-slate-900 text-sm leading-snug">{selectedTx.label}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Compte Origine</span>
                  <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
                    {selectedTx.accountOrigin || (selectedTx.inflow ? "Tiers / Encaissé" : "Trésorerie GuinéeGo")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Compte Destination</span>
                  <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
                    {selectedTx.accountDestination || (selectedTx.outflow ? "Bénéficiaire" : "Coffre-fort GuinéeGo")}
                  </span>
                </div>
              </div>

              {/* Tiers & Documents sources */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Liens & Pièces Justificatives</span>
                <div className="flex flex-wrap gap-2">
                  {selectedTx.livreurId && (
                    <Link
                      href={`/tresorerie/livreurs/${selectedTx.livreurId}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Bike className="w-3.5 h-3.5 text-slate-500" />
                      <span>Fiche Livreur : {selectedTx.livreurName}</span>
                    </Link>
                  )}

                  {selectedTx.orderNumber && (
                    <Link
                      href={`/admin/commandes?search=${selectedTx.orderNumber}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:text-blue-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Commande {selectedTx.orderNumber}</span>
                    </Link>
                  )}

                  {selectedTx.sourceType === "REMISE" && selectedTx.sourceId && (
                    <Link
                      href={`/tresorerie/remises/${selectedTx.sourceId}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:text-purple-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>Bordereau Remise</span>
                    </Link>
                  )}

                  {selectedTx.sourceType === "ECART" && selectedTx.sourceId && (
                    <Link
                      href={`/tresorerie/ecarts/${selectedTx.sourceId}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Fiche d&apos;Écart</span>
                    </Link>
                  )}

                  {selectedTx.partnerId && (
                    <Link
                      href="/tresorerie/ecommercants"
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>Solde Marchand</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedTx.notes && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-700">
                  <span className="font-bold text-emerald-950 block text-[10px] uppercase">Notes Comptables :</span>
                  <p className="mt-1 leading-relaxed text-xs">{selectedTx.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTx(null)}
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
