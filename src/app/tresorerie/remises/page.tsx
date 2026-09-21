"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  ArrowUpDown,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Vault,
  Eye,
  Filter,
  X,
  Banknote,
  Bike,
  Layers,
  Phone,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Info,
  Calendar,
  User,
  PackageCheck,
  FileText,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { CodRemittance, DriverCodFinancialSummary, CodCollection } from "@/lib/types";

function RemisesPageContent() {
  const searchParams = useSearchParams();
  const {
    codRemittances,
    codCollections,
    livreurs,
    activeTreasuryManager,
    getDriverCodFunds,
    receiveDriverRemittance,
  } = useOperations();

  // Navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<"A_RECEVOIR" | "FONDS_DETENUS" | "HISTORIQUE">("A_RECEVOIR");

  // Search & Filter state for Remises à recevoir
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<
    "TOUTES" | "A_RECEVOIR" | "ECHEANCE_PROCHE" | "EN_RETARD" | "PARTIELLES" | "ECART_DETECTE"
  >("TOUTES");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("ALL");

  // Search & Filter state for Historique (Complet selon CDC)
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historyDriverFilter, setHistoryDriverFilter] = useState("ALL");
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<
    "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_3_MONTHS"
  >("ALL");
  const [historyAmountRangeFilter, setHistoryAmountRangeFilter] = useState<
    "ALL" | "0_50K" | "50K_100K" | "100K_500K" | "OVER_500K"
  >("ALL");
  const [historySortBy, setHistorySortBy] = useState<
    "REMAINING_DESC" | "EXPECTED_DESC" | "REMITTED_DESC" | "DATE_DESC" | "DRIVER_ASC" | "STATUS"
  >("REMAINING_DESC");

  // Search & Filter state for Livreurs détenant des fonds
  const [fundsSearchTerm, setFundsSearchTerm] = useState("");
  const [fundsStatusFilter, setFundsStatusFilter] = useState("ALL");
  const [fundsZoneFilter, setFundsZoneFilter] = useState("ALL");

  // Modal State for New Remittance Workflow
  const initialDriverId = useMemo(() => {
    const driverIdParam = searchParams.get("driverId") || searchParams.get("livreurId");
    if (driverIdParam && livreurs.some((l) => l.id === driverIdParam)) {
      return driverIdParam;
    }
    return livreurs[0]?.id || "liv-1";
  }, [searchParams, livreurs]);

  const shouldOpenModalInitial = useMemo(() => {
    const actionParam = searchParams.get("action");
    const remiseParam = searchParams.get("remise");
    return actionParam === "new" || remiseParam === "true";
  }, [searchParams]);

  const [showNewRemittanceModal, setShowNewRemittanceModal] = useState(shouldOpenModalInitial);
  const [selectedDriverId, setSelectedDriverId] = useState(initialDriverId);
  const [receivedAmountInput, setReceivedAmountInput] = useState("");
  const [remittanceTypeSelection, setRemittanceTypeSelection] = useState<"AUTO" | "PARTIAL" | "DISCREPANCY">("AUTO");
  const [remittanceNotesInput, setRemittanceNotesInput] = useState("");
  const [discrepancyReasonInput, setDiscrepancyReasonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Drawer State (Voir le détail)
  const [inspectDriverId, setInspectDriverId] = useState<string | null>(null);

  // Inspect Historical Remittance Modal State
  const [inspectHistoryRemittance, setInspectHistoryRemittance] = useState<CodRemittance | null>(null);

  // Success Toast state
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const triggerToast = (msg: string) => {
    setSuccessToast({ show: true, message: msg });
    setTimeout(() => {
      setSuccessToast({ show: false, message: "" });
    }, 4500);
  };

  // 1. Calculations for Drivers with pending COD remittances
  const driversFinancials = useMemo(() => {
    return livreurs.map((l) => {
      const summary = getDriverCodFunds(l.id);
      const cols = codCollections.filter((c) => c.livreurId === l.id && c.remittanceStatus !== "VALIDATED");
      return {
        livreur: l,
        summary,
        collections: cols,
      };
    });
  }, [livreurs, getDriverCodFunds, codCollections]);

  // List of drivers who have COD to remit (or with recent activity/discrepancy)
  const pendingRemittancesList = useMemo(() => {
    return driversFinancials.filter((item) => {
      return item.summary.fundsToRemit > 0 || item.summary.operationalStatus === "Écart détecté";
    });
  }, [driversFinancials]);

  // 2. 6 KPIs Financiers Conformes
  const kpis = useMemo(() => {
    // 1. Fonds à recevoir
    const totalFunds = pendingRemittancesList.reduce((sum, item) => sum + item.summary.fundsToRemit, 0);

    // 2. Remises en attente (tournées non encore apurées)
    const pendingCount = pendingRemittancesList.filter(
      (item) => item.summary.fundsToRemit > 0 && item.summary.operationalStatus !== "En retard"
    ).length;

    // 3. Remises aujourd'hui (fonds validés reçus aujourd'hui)
    const todayStr = new Date().toISOString().slice(0, 10);
    const remittedTodayTotal = codRemittances
      .filter((r) => r.createdAt && r.createdAt.startsWith(todayStr))
      .reduce((sum, r) => sum + (r.receivedAmount || r.amountValidated || r.amountDeclared || 0), 0);
    const remittedTodayCount = codRemittances.filter(
      (r) => r.createdAt && r.createdAt.startsWith(todayStr)
    ).length;

    // 4. Remises partielles
    const partialCount = codRemittances.filter(
      (r) => r.status === "PARTIALLY_VALIDATED"
    ).length + pendingRemittancesList.filter((i) => i.summary.operationalStatus === "Remise partielle").length;

    // 5. Remises en retard
    const overdueCount = pendingRemittancesList.filter(
      (item) => item.summary.operationalStatus === "En retard"
    ).length;

    // 6. Écarts ouverts liés aux remises
    const discrepanciesCount = codRemittances.filter(
      (r) => r.status === "DISCREPANCY_DETECTED" || ((r.discrepancyAmount || 0) !== 0)
    ).length;

    const concernedDriversCount = pendingRemittancesList.filter((item) => item.summary.fundsToRemit > 0).length;

    return {
      remisesCount: pendingRemittancesList.length,
      totalFunds,
      pendingCount,
      remittedTodayTotal,
      remittedTodayCount,
      partialCount,
      overdueCount,
      discrepanciesCount,
      concernedDriversCount,
    };
  }, [pendingRemittancesList, codRemittances]);

  // Available unique zones
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>();
    livreurs.forEach((l) => {
      if (l.zone) zones.add(l.zone);
    });
    return Array.from(zones);
  }, [livreurs]);

  // 3. Filtered list for "Remises à recevoir"
  const filteredPendingRemittances = useMemo(() => {
    return pendingRemittancesList.filter(({ livreur, summary, collections }) => {
      // Quick filter
      if (quickFilter === "A_RECEVOIR" && summary.operationalStatus !== "À recevoir") return false;
      if (quickFilter === "ECHEANCE_PROCHE" && summary.operationalStatus !== "Échéance proche") return false;
      if (quickFilter === "EN_RETARD" && summary.operationalStatus !== "En retard") return false;
      if (quickFilter === "PARTIELLES" && summary.operationalStatus !== "Remise partielle") return false;
      if (quickFilter === "ECART_DETECTE" && summary.operationalStatus !== "Écart détecté") return false;

      // Zone filter
      if (selectedZoneFilter !== "ALL" && livreur.zone !== selectedZoneFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = livreur.name.toLowerCase().includes(q);
        const matchPhone = (livreur.phone || "").toLowerCase().includes(q);
        const matchZone = (livreur.zone || "").toLowerCase().includes(q);
        const matchOrders = collections.some((c) => c.orderNumber.toLowerCase().includes(q));
        return matchName || matchPhone || matchZone || matchOrders;
      }

      return true;
    });
  }, [pendingRemittancesList, quickFilter, selectedZoneFilter, searchTerm]);

  // Filtered list for History with all combinable filters & strict sorting
  const filteredHistoryRemittances = useMemo(() => {
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

    const list = codRemittances.filter((r) => {
      // 1. Status Filter
      if (historyStatusFilter !== "ALL" && r.status !== historyStatusFilter) return false;

      // 2. Driver Filter
      if (historyDriverFilter !== "ALL" && r.livreurId !== historyDriverFilter) return false;

      // 3. Period Filter
      if (historyPeriodFilter !== "ALL" && r.createdAt) {
        const rDate = new Date(r.createdAt);
        const rDateStr = r.createdAt.slice(0, 10);
        if (historyPeriodFilter === "TODAY" && rDateStr !== todayStr) return false;
        if (historyPeriodFilter === "YESTERDAY" && rDateStr !== yesterdayStr) return false;
        if (historyPeriodFilter === "LAST_7_DAYS" && rDate < sevenDaysAgo) return false;
        if (historyPeriodFilter === "LAST_30_DAYS" && rDate < thirtyDaysAgo) return false;
        if (historyPeriodFilter === "LAST_3_MONTHS" && rDate < threeMonthsAgo) return false;
      }

      // 4. Amount Range Filter (based on received or expected)
      const amt = r.receivedAmount || r.amountValidated || r.amountDeclared || 0;
      if (historyAmountRangeFilter === "0_50K" && (amt < 0 || amt > 50000)) return false;
      if (historyAmountRangeFilter === "50K_100K" && (amt < 50000 || amt > 100000)) return false;
      if (historyAmountRangeFilter === "100K_500K" && (amt < 100000 || amt > 500000)) return false;
      if (historyAmountRangeFilter === "OVER_500K" && amt < 500000) return false;

      // 5. Search Term (ref, driver, orders, notes)
      if (historySearchTerm.trim()) {
        const q = historySearchTerm.toLowerCase();
        const matchRef = r.reference.toLowerCase().includes(q);
        const matchDriver = r.livreurName.toLowerCase().includes(q);
        const matchNotes = (r.notes || "").toLowerCase().includes(q);
        const matchOrders = r.orderIds ? r.orderIds.some((id) => id.toLowerCase().includes(q)) : false;
        return matchRef || matchDriver || matchNotes || matchOrders;
      }

      return true;
    });

    // Tri par défaut : remises avec le plus grand montant restant à recevoir en premier
    return list.sort((a, b) => {
      const remainingA = Math.max(0, (a.amountExpected || 0) - (a.receivedAmount || a.amountValidated || a.amountDeclared || 0));
      const remainingB = Math.max(0, (b.amountExpected || 0) - (b.receivedAmount || b.amountValidated || b.amountDeclared || 0));

      if (historySortBy === "REMAINING_DESC") {
        if (remainingB !== remainingA) return remainingB - remainingA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (historySortBy === "EXPECTED_DESC") {
        return (b.amountExpected || 0) - (a.amountExpected || 0);
      }
      if (historySortBy === "REMITTED_DESC") {
        const remA = a.receivedAmount || a.amountValidated || a.amountDeclared || 0;
        const remB = b.receivedAmount || b.amountValidated || b.amountDeclared || 0;
        return remB - remA;
      }
      if (historySortBy === "DATE_DESC") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (historySortBy === "DRIVER_ASC") {
        return a.livreurName.localeCompare(b.livreurName);
      }
      if (historySortBy === "STATUS") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [
    codRemittances,
    historyStatusFilter,
    historyDriverFilter,
    historyPeriodFilter,
    historyAmountRangeFilter,
    historySearchTerm,
    historySortBy,
  ]);

  // Export CSV function for filtered remittances
  const handleExportRemittancesCSV = () => {
    const headers = [
      "Reference",
      "Date",
      "Livreur",
      "Montant Attendu (GNF)",
      "Montant Remis (GNF)",
      "Reste a Recevoir (GNF)",
      "Ecart (GNF)",
      "Nombre Commandes",
      "Receptionne Par",
      "Statut",
    ];

    const rows = filteredHistoryRemittances.map((r) => {
      const received = r.receivedAmount || r.amountValidated || r.amountDeclared || 0;
      const remaining = Math.max(0, (r.amountExpected || 0) - received);
      const diff = r.discrepancyAmount || 0;
      return [
        r.reference,
        r.validatedAt || r.receivedAt || r.createdAt,
        `"${r.livreurName}"`,
        r.amountExpected,
        received,
        remaining,
        diff,
        r.ordersCount || (r.orderIds ? r.orderIds.length : 0),
        `"${r.validatedBy || r.receivedBy || "Trésorier"}"`,
        r.status,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `remises_tresorerie_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("✓ Export CSV des remises téléchargé avec succès.");
  };

  // List & filter for "Livreurs détenant des fonds"
  const driversHoldingFundsList = useMemo(() => {
    return driversFinancials.filter((item) => item.summary.fundsToRemit > 0);
  }, [driversFinancials]);

  const filteredDriversHoldingFunds = useMemo(() => {
    return driversHoldingFundsList.filter(({ livreur, summary }) => {
      if (fundsStatusFilter !== "ALL" && summary.operationalStatus !== fundsStatusFilter) return false;
      if (fundsZoneFilter !== "ALL" && livreur.zone !== fundsZoneFilter) return false;
      if (fundsSearchTerm.trim()) {
        const q = fundsSearchTerm.toLowerCase();
        const matchName = livreur.name.toLowerCase().includes(q);
        const matchPhone = (livreur.phone || "").toLowerCase().includes(q);
        const matchZone = (livreur.zone || "").toLowerCase().includes(q);
        return matchName || matchPhone || matchZone;
      }
      return true;
    });
  }, [driversHoldingFundsList, fundsStatusFilter, fundsZoneFilter, fundsSearchTerm]);

  // Driver summary calculation for the active modal
  const selectedDriverFunds = useMemo(() => {
    return getDriverCodFunds(selectedDriverId);
  }, [selectedDriverId, getDriverCodFunds]);

  const selectedDriverProfile = useMemo(() => {
    return livreurs.find((l) => l.id === selectedDriverId) || livreurs[0];
  }, [livreurs, selectedDriverId]);

  const selectedDriverOrders = useMemo(() => {
    return codCollections.filter(
      (c) => c.livreurId === selectedDriverId && c.remittanceStatus !== "VALIDATED"
    );
  }, [codCollections, selectedDriverId]);

  // Inspected driver data for drawer
  const inspectedDriverData = useMemo(() => {
    if (!inspectDriverId) return null;
    const l = livreurs.find((item) => item.id === inspectDriverId);
    if (!l) return null;
    const summary = getDriverCodFunds(l.id);
    const cols = codCollections.filter((c) => c.livreurId === l.id && c.remittanceStatus !== "VALIDATED");
    const driverHistory = codRemittances.filter((r) => r.livreurId === l.id).slice(0, 3);
    return {
      livreur: l,
      summary,
      collections: cols,
      history: driverHistory,
    };
  }, [inspectDriverId, livreurs, getDriverCodFunds, codCollections, codRemittances]);

  // Open Remittance Modal handler
  const handleOpenNewRemittance = (driverId?: string) => {
    const dId = driverId || (pendingRemittancesList[0]?.livreur.id || livreurs[0]?.id || "liv-1");
    setSelectedDriverId(dId);
    const sum = getDriverCodFunds(dId);
    setReceivedAmountInput(sum.fundsToRemit.toString());
    setRemittanceTypeSelection("AUTO");
    setRemittanceNotesInput("");
    setDiscrepancyReasonInput("");
    setIsSubmitting(false);
    setShowNewRemittanceModal(true);
  };

  // Calculations for current input in Remittance Modal
  const inputAmt = parseInt(receivedAmountInput) || 0;
  const expectedAmt = selectedDriverFunds.fundsToRemit;
  const difference = expectedAmt - inputAmt;
  const isExactMatch = inputAmt === expectedAmt && expectedAmt > 0;
  const isLesser = inputAmt < expectedAmt && inputAmt > 0;
  const isGreater = inputAmt > expectedAmt;

  // Effective mode when amount is lesser
  const effectiveMode = useMemo(() => {
    if (isExactMatch) return "CONFORME";
    if (isLesser) {
      if (remittanceTypeSelection === "DISCREPANCY") return "DISCREPANCY";
      if (remittanceTypeSelection === "PARTIAL") return "PARTIAL";
      return "PARTIAL"; // default to partial
    }
    if (isGreater) return "EXCESS";
    return "CONFORME";
  }, [isExactMatch, isLesser, isGreater, remittanceTypeSelection]);

  // Submit remittance with anti-double submission protection
  const handleSaveRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivedAmountInput || isSubmitting) return;

    if (inputAmt <= 0) return;

    // Compulsory justification for discrepancy
    if (effectiveMode === "DISCREPANCY") {
      if (!discrepancyReasonInput.trim() || discrepancyReasonInput.trim().length < 10) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const modeParam = effectiveMode === "DISCREPANCY" ? "DISCREPANCY" : effectiveMode === "PARTIAL" ? "PARTIAL" : "FULL";

      const createdRemittance = receiveDriverRemittance({
        livreurId: selectedDriverId,
        receivedAmount: inputAmt,
        receivedBy: activeTreasuryManager?.name || "Amina Tidjani",
        receivedById: activeTreasuryManager?.id || "tm-1",
        notes: remittanceNotesInput.trim() || undefined,
        discrepancyReason: effectiveMode === "DISCREPANCY" ? discrepancyReasonInput.trim() : undefined,
        remittanceType: modeParam,
      });

      setShowNewRemittanceModal(false);
      setInspectDriverId(null);

      triggerToast(
        effectiveMode === "CONFORME"
          ? `✓ Remise ${createdRemittance.reference} validée au coffre avec succès (${formatCFA(inputAmt)}).`
          : effectiveMode === "PARTIAL"
          ? `✓ Remise partielle ${createdRemittance.reference} enregistrée. Solde restant : ${formatCFA(difference)}.`
          : `⚠️ Remise ${createdRemittance.reference} enregistrée avec écart de ${formatCFA(difference)} signalé.`
      );
    } catch (err) {
      console.error("Erreur validation remise:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Status Badge helper
  const renderStatusBadge = (status: DriverCodFinancialSummary["operationalStatus"]) => {
    switch (status) {
      case "En retard":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            En retard
          </span>
        );
      case "Échéance proche":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Échéance proche
          </span>
        );
      case "Remise partielle":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Remise partielle
          </span>
        );
      case "Écart détecté":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Écart détecté
          </span>
        );
      case "En vérification":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            En vérification
          </span>
        );
      case "À recevoir":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            À recevoir
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium leading-relaxed flex-1">
            {successToast.message}
          </div>
          <button
            onClick={() => setSuccessToast({ show: false, message: "" })}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold tracking-wide uppercase border border-emerald-200/60">
              Caisse Opérationnelle
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Remises à recevoir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Suivez les fonds remis par les livreurs, les montants à recevoir et les remises nécessitant une vérification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Navigation Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
            <button
              onClick={() => setActiveMainTab("A_RECEVOIR")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === "A_RECEVOIR"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              À recevoir ({kpis.remisesCount})
            </button>
            <button
              onClick={() => setActiveMainTab("FONDS_DETENUS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === "FONDS_DETENUS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Livreurs détenant des fonds ({kpis.concernedDriversCount})
            </button>
            <button
              onClick={() => setActiveMainTab("HISTORIQUE")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === "HISTORIQUE"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Historique ({codRemittances.length})
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => handleOpenNewRemittance()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Enregistrer une remise</span>
          </button>
        </div>
      </div>

      {/* 2. 6 KPIS DYNAMIQUES DU TABLEAU DE BORD (SECTION 3 DU CAHIER DES CHARGES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1 : Fonds à recevoir */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fonds à recevoir
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight truncate">
            {formatCFA(kpis.totalFunds)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Espèces en circulation</p>
        </div>

        {/* KPI 2 : Remises en attente */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Remises en attente
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {kpis.pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Tournées à pointer</p>
        </div>

        {/* KPI 3 : Remises aujourd'hui */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Remises aujourd'hui
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
            {formatCFA(kpis.remittedTodayTotal)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">{kpis.remittedTodayCount} reçue(s)</p>
        </div>

        {/* KPI 4 : Remises partielles */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Remises partielles
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 tracking-tight">
            {kpis.partialCount}
          </div>
          <p className="text-[11px] text-sky-600 mt-0.5 font-medium">Avec solde restant</p>
        </div>

        {/* KPI 5 : Remises en retard */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Remises en retard
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
            {kpis.overdueCount}
          </div>
          <p className="text-[11px] text-rose-500 mt-0.5 font-medium">Échéance dépassée</p>
        </div>

        {/* KPI 6 : Écarts ouverts liés aux remises */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Écarts ouverts
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">
            {kpis.discrepanciesCount}
          </div>
          <p className="text-[11px] text-orange-500 mt-0.5 font-medium">À arbitrer / vérifier</p>
        </div>
      </div>

      {activeMainTab === "A_RECEVOIR" ? (
        <>
          {/* 3. QUICK FILTER PILLS & SEARCH BAR */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            {/* Top row: search & zone dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un livreur, téléphone, numéro de colis (CMD-1048...)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={selectedZoneFilter}
                  onChange={(e) => setSelectedZoneFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Toutes les zones</option>
                  {uniqueZones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom row: Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <button
                onClick={() => setQuickFilter("TOUTES")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "TOUTES"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Toutes ({pendingRemittancesList.length})
              </button>

              <button
                onClick={() => setQuickFilter("A_RECEVOIR")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "A_RECEVOIR"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                À recevoir (
                {pendingRemittancesList.filter((i) => i.summary.operationalStatus === "À recevoir").length})
              </button>

              <button
                onClick={() => setQuickFilter("ECHEANCE_PROCHE")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "ECHEANCE_PROCHE"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Échéance proche (
                {pendingRemittancesList.filter((i) => i.summary.operationalStatus === "Échéance proche").length})
              </button>

              <button
                onClick={() => setQuickFilter("EN_RETARD")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "EN_RETARD"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                🔴 En retard (
                {pendingRemittancesList.filter((i) => i.summary.operationalStatus === "En retard").length})
              </button>

              <button
                onClick={() => setQuickFilter("PARTIELLES")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "PARTIELLES"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                }`}
              >
                Partielles (
                {pendingRemittancesList.filter((i) => i.summary.operationalStatus === "Remise partielle").length})
              </button>

              <button
                onClick={() => setQuickFilter("ECART_DETECTE")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  quickFilter === "ECART_DETECTE"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                ⚠️ Écart détecté (
                {pendingRemittancesList.filter((i) => i.summary.operationalStatus === "Écart détecté").length})
              </button>
            </div>
          </div>

          {/* 4. MAIN TABLE OF REMISES À RECEVOIR */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Pointage des Fonds en Circulation ({filteredPendingRemittances.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Livreurs détenant actuellement des encaissements COD à sécuriser au coffre-fort.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Formule : Encaissements collectés attribués − Remises validées
              </span>
            </div>

            {filteredPendingRemittances.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Aucune remise à recevoir</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tous les fonds collectés ont été pointés et sécurisés au coffre, ou aucun livreur ne correspond aux filtres appliqués.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-3.5 px-4">Livreur</th>
                        <th className="py-3.5 px-4">Colis concernés</th>
                        <th className="py-3.5 px-4">Montant à remettre</th>
                        <th className="py-3.5 px-4">Dernière remise</th>
                        <th className="py-3.5 px-4">Depuis</th>
                        <th className="py-3.5 px-4">Échéance</th>
                        <th className="py-3.5 px-4">Statut</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPendingRemittances.map(({ livreur, summary, collections }) => {
                        const initials = livreur.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2);

                        return (
                          <tr
                            key={livreur.id}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            {/* Livreur Info */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {livreur.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <a
                                        href={`tel:${livreur.phone}`}
                                        className="hover:text-slate-900 hover:underline"
                                      >
                                        {livreur.phone}
                                      </a>
                                    </span>
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]">{livreur.zone}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Colis concernés */}
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                                  <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
                                  {summary.unremittedOrdersCount} colis
                                </span>
                                {collections.length > 0 && (
                                  <div className="text-[10px] text-slate-400 font-mono flex flex-wrap gap-1">
                                    {collections.slice(0, 3).map((c) => (
                                      <span key={c.orderId} className="hover:text-slate-700">
                                        {c.orderNumber}
                                      </span>
                                    ))}
                                    {collections.length > 3 && (
                                      <span>+{collections.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Montant à remettre (Bien lisible en grand format) */}
                            <td className="py-4 px-4">
                              <div className="text-base font-black text-slate-900 tracking-tight">
                                {formatCFA(summary.fundsToRemit)}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Espèces COD
                              </span>
                            </td>

                            {/* Dernière remise */}
                            <td className="py-4 px-4">
                              <div className="text-slate-700 font-medium">
                                {summary.lastRemittanceDate || "Aucune"}
                              </div>
                              <span className="text-[10px] text-slate-400">Pointage caisse</span>
                            </td>

                            {/* Depuis (Durée détention) */}
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                  summary.operationalStatus === "En retard"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {summary.holdingDuration || "4h"}
                              </span>
                            </td>

                            {/* Échéance */}
                            <td className="py-4 px-4">
                              <div
                                className={`font-semibold text-xs ${
                                  summary.operationalStatus === "En retard"
                                    ? "text-rose-600 font-bold"
                                    : "text-slate-700"
                                }`}
                              >
                                {summary.nextRemittanceDeadline}
                              </div>
                            </td>

                            {/* Statut */}
                            <td className="py-4 px-4">
                              {renderStatusBadge(summary.operationalStatus)}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                <Link
                                  href={`/tresorerie/livreurs/${livreur.id}`}
                                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                                  title="Fiche financière complète"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => setInspectDriverId(livreur.id)}
                                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                                  title="Aperçu rapide des colis"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenNewRemittance(livreur.id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Enregistrer</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (md:hidden) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredPendingRemittances.map(({ livreur, summary, collections }) => {
                    const initials = livreur.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2);

                    return (
                      <div key={livreur.id} className="p-4 space-y-3">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{livreur.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {livreur.zone}
                              </div>
                            </div>
                          </div>
                          {renderStatusBadge(summary.operationalStatus)}
                        </div>

                        {/* Amount & parcels */}
                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              À remettre
                            </span>
                            <div className="text-lg font-black text-slate-900">
                              {formatCFA(summary.fundsToRemit)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Colis
                            </span>
                            <div className="text-xs font-bold text-slate-800">
                              {summary.unremittedOrdersCount} colis ({summary.holdingDuration})
                            </div>
                          </div>
                        </div>

                        {/* Timing details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <div>
                            Échéance :{" "}
                            <span
                              className={`font-semibold ${
                                summary.operationalStatus === "En retard" ? "text-rose-600" : "text-slate-800"
                              }`}
                            >
                              {summary.nextRemittanceDeadline}
                            </span>
                          </div>
                          <a
                            href={`tel:${livreur.phone}`}
                            className="text-slate-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            Appeler
                          </a>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <Link
                            href={`/tresorerie/livreurs/${livreur.id}`}
                            className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Fiche financière"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span>Fiche</span>
                          </Link>
                          <button
                            onClick={() => setInspectDriverId(livreur.id)}
                            className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Détail</span>
                          </button>
                          <button
                            onClick={() => handleOpenNewRemittance(livreur.id)}
                            className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Encaisser</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      ) : activeMainTab === "FONDS_DETENUS" ? (
        /* ========================================================================= */
        /* VUE : LIVREURS DÉTENTANT DES FONDS                                        */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fundsSearchTerm}
                  onChange={(e) => setFundsSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, téléphone, zone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="relative">
                <select
                  value={fundsZoneFilter}
                  onChange={(e) => setFundsZoneFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Toutes les zones</option>
                  {uniqueZones.map((z) => (
                    <option key={z} value={z}>
                      Zone : {z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  value={fundsStatusFilter}
                  onChange={(e) => setFundsStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="À recevoir">À recevoir</option>
                  <option value="Échéance proche">Échéance proche</option>
                  <option value="En retard">En retard</option>
                  <option value="Remise partielle">Remise partielle</option>
                  <option value="Écart détecté">Écart détecté</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
              <span className="font-medium">
                {filteredDriversHoldingFunds.length} coursier(s) détiennent actuellement un total de{" "}
                <strong className="text-slate-900 font-black">
                  {formatCFA(
                    filteredDriversHoldingFunds.reduce((sum, item) => sum + item.summary.fundsToRemit, 0)
                  )}
                </strong>
              </span>
              <Link
                href="/tresorerie/livreurs"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Accéder au répertoire financier global</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Table Livreurs détenant des fonds */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  Livreurs Détenant Actuellement des Fonds ({filteredDriversHoldingFunds.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Vue synthétique de l&apos;encours de trésorerie détenu par chaque livreur actif.
                </p>
              </div>
            </div>

            {filteredDriversHoldingFunds.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Aucun livreur ne détient de fonds</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tous les coursiers sont à jour de leurs remises ou aucun livreur ne correspond aux filtres.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-3.5 px-4">Livreur</th>
                        <th className="py-3.5 px-4 text-right">Montant Détenu</th>
                        <th className="py-3.5 px-4">Dernière Remise</th>
                        <th className="py-3.5 px-4">Ancienne Collecte</th>
                        <th className="py-3.5 px-4">Statut</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDriversHoldingFunds.map(({ livreur, summary, collections }) => {
                        const initials = livreur.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2);

                        // Oldest collection date/duration
                        const oldestCollection = collections.length > 0 ? collections[0].deliveredAt : summary.holdingDuration;

                        return (
                          <tr key={livreur.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Livreur */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {livreur.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                    <span>{livreur.phone}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]">{livreur.zone}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Montant détenu */}
                            <td className="py-4 px-4 text-right">
                              <div className="text-base font-black text-slate-900 tracking-tight">
                                {formatCFA(summary.fundsToRemit)}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {summary.unremittedOrdersCount} commande(s)
                              </span>
                            </td>

                            {/* Dernière remise */}
                            <td className="py-4 px-4">
                              <div className="text-slate-800 font-medium">
                                {summary.lastRemittanceDate || "Aucune"}
                              </div>
                              <span className="text-[10px] text-slate-400">Pointage caisse</span>
                            </td>

                            {/* Ancienne collecte */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-800">
                                {oldestCollection || "Aujourd&apos;hui"}
                              </div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] mt-0.5 ${
                                  summary.operationalStatus === "En retard"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {summary.holdingDuration}
                              </span>
                            </td>

                            {/* Statut */}
                            <td className="py-4 px-4">
                              {renderStatusBadge(summary.operationalStatus)}
                            </td>

                            {/* Actions: Voir (fiche complète) + Pointer remise */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/tresorerie/livreurs/${livreur.id}`}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Consulter la fiche financière du livreur"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Voir</span>
                                </Link>
                                <button
                                  onClick={() => handleOpenNewRemittance(livreur.id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Pointer remise</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredDriversHoldingFunds.map(({ livreur, summary }) => {
                    const initials = livreur.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2);

                    return (
                      <div key={livreur.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{livreur.name}</div>
                              <div className="text-[11px] text-slate-500">{livreur.zone} • {livreur.phone}</div>
                            </div>
                          </div>
                          {renderStatusBadge(summary.operationalStatus)}
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Montant Détenu
                            </span>
                            <div className="text-lg font-black text-slate-900">
                              {formatCFA(summary.fundsToRemit)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Détention
                            </span>
                            <div className="text-xs font-bold text-slate-800">
                              {summary.holdingDuration}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Link
                            href={`/tresorerie/livreurs/${livreur.id}`}
                            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Voir fiche</span>
                          </Link>
                          <button
                            onClick={() => handleOpenNewRemittance(livreur.id)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pointer remise</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 7. SECTION HISTORIQUE DES REMISES                                         */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            {/* Ligne 1 : Recherche, Livreur, Statut */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Rechercher référence, livreur, commande..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="relative">
                <select
                  value={historyDriverFilter}
                  onChange={(e) => setHistoryDriverFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Tous les livreurs</option>
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="VALIDATED">✓ Validée</option>
                  <option value="PARTIALLY_VALIDATED">⚠️ Partielle</option>
                  <option value="DISCREPANCY_DETECTED">🔴 Écart détecté</option>
                  <option value="PENDING_VALIDATION">⏳ En attente</option>
                </select>
              </div>
            </div>

            {/* Ligne 2 : Filtres Combinés Période, Tranche de Montant et Tri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <select
                  value={historyPeriodFilter}
                  onChange={(e) => setHistoryPeriodFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Toutes les périodes</option>
                  <option value="TODAY">Aujourd&apos;hui</option>
                  <option value="YESTERDAY">Hier</option>
                  <option value="LAST_7_DAYS">7 derniers jours</option>
                  <option value="LAST_30_DAYS">30 derniers jours</option>
                  <option value="LAST_3_MONTHS">3 derniers mois</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={historyAmountRangeFilter}
                  onChange={(e) => setHistoryAmountRangeFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="ALL">Tous les montants</option>
                  <option value="0_50K">0 - 50 000 GNF</option>
                  <option value="50K_100K">50 000 - 100 000 GNF</option>
                  <option value="100K_500K">100 000 - 500 000 GNF</option>
                  <option value="OVER_500K">&gt; 500 000 GNF</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={historySortBy}
                  onChange={(e) => setHistorySortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                >
                  <option value="REMAINING_DESC">Tri : Reste à recevoir (Plus élevé d&apos;abord)</option>
                  <option value="EXPECTED_DESC">Tri : Montant attendu (Décroissant)</option>
                  <option value="REMITTED_DESC">Tri : Montant remis (Décroissant)</option>
                  <option value="DATE_DESC">Tri : Date &amp; Heure (Plus récent)</option>
                  <option value="DRIVER_ASC">Tri : Livreur (A - Z)</option>
                  <option value="STATUS">Tri : Statut</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-700" />
                  Bordereaux de Remises &amp; Pointages ({filteredHistoryRemittances.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Journal inaltérable avec horodatage, montants reçus et justification des écarts.
                </p>
              </div>
              <button
                onClick={handleExportRemittancesCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exporter (CSV)</span>
              </button>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Livreur</th>
                    <th className="py-3 px-4">Date / Heure</th>
                    <th className="py-3 px-4 text-right">Montant attendu</th>
                    <th className="py-3 px-4 text-right">Montant remis</th>
                    <th className="py-3 px-4 text-right">Reste à recevoir</th>
                    <th className="py-3 px-4 text-center">Commandes</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryRemittances.map((rem) => {
                    const isDiscrepant = (rem.discrepancyAmount && rem.discrepancyAmount !== 0) || rem.status === "DISCREPANCY_DETECTED";

                    return (
                      <tr key={rem.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <Link
                            href={`/tresorerie/remises/${rem.id}`}
                            className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            {rem.reference}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <Link
                            href={`/tresorerie/livreurs/${rem.livreurId}`}
                            className="hover:text-emerald-600 hover:underline"
                          >
                            {rem.livreurName}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {rem.validatedAt || rem.receivedAt || rem.createdAt}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {formatCFA(rem.amountExpected)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {formatCFA(rem.receivedAmount || rem.amountValidated || rem.amountDeclared)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          {(() => {
                            const rec = rem.receivedAmount || rem.amountValidated || rem.amountDeclared || 0;
                            const rest = Math.max(0, (rem.amountExpected || 0) - rec);
                            return rest > 0 ? (
                              <span className="text-rose-600">{formatCFA(rest)}</span>
                            ) : (
                              <span className="text-slate-400">0 GNF</span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {rem.ordersCount || (rem.orderIds ? rem.orderIds.length : 0)} colis
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {rem.status === "VALIDATED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              ✓ Validée
                            </span>
                          ) : rem.status === "PARTIALLY_VALIDATED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                              Partielle
                            </span>
                          ) : rem.status === "DISCREPANCY_DETECTED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              🔴 Écart
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                              ⏳ En attente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/tresorerie/remises/${rem.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Voir</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile History Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredHistoryRemittances.map((rem) => (
                <div key={rem.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">{rem.reference}</span>
                    <span className="text-[11px] text-slate-400">{rem.createdAt}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">{rem.livreurName}</div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">
                      Reçu : <strong className="text-emerald-600">{formatCFA(rem.receivedAmount || rem.amountDeclared)}</strong>
                    </span>
                    <Link
                      href={`/tresorerie/remises/${rem.id}`}
                      className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1"
                    >
                      Voir le détail <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TIROIR LATERAL (DRAWER) DE DETAIL : "Voir le détail"                  */}
      {/* ========================================================================= */}
      {inspectDriverId && inspectedDriverData && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                  {inspectedDriverData.livreur.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {inspectedDriverData.livreur.name}
                    </h3>
                    {renderStatusBadge(inspectedDriverData.summary.operationalStatus)}
                  </div>
                  <p className="text-xs text-slate-500">
                    {inspectedDriverData.livreur.zone} • {inspectedDriverData.livreur.vehicle || "Moto"} ({inspectedDriverData.livreur.licensePlate || "RB-1234"})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectDriverId(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Summary Financial Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Total Fonds à Remettre
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {inspectedDriverData.summary.holdingDuration} de détention
                  </span>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {formatCFA(inspectedDriverData.summary.fundsToRemit)}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Colis concernés</span>
                    <strong className="text-white">
                      {inspectedDriverData.summary.unremittedOrdersCount} commandes
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Dernière remise</span>
                    <strong className="text-white">
                      {inspectedDriverData.summary.lastRemittanceDate}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Table of "Commandes concernées" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Commandes Concernées ({inspectedDriverData.collections.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">Détail des colis livrés</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">N° Commande</th>
                        <th className="py-2.5 px-3">E-commerçant</th>
                        <th className="py-2.5 px-3">Livré le</th>
                        <th className="py-2.5 px-3 text-right">Attendu</th>
                        <th className="py-2.5 px-3 text-right">Collecté</th>
                        <th className="py-2.5 px-3 text-right">Reste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectedDriverData.collections.map((col) => (
                        <tr key={col.orderId} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <Link
                              href={`/admin/commandes`}
                              className="font-mono font-bold text-slate-900 hover:text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              {col.orderNumber}
                              <ArrowUpRight className="w-3 h-3 text-slate-400" />
                            </Link>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                              {col.clientName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {col.partnerName}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {col.deliveredAt}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-medium">
                            {formatCFA(col.expectedAmount)}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-600 font-bold">
                            {formatCFA(col.collectedAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            {col.remittanceStatus === "VALIDATED" ? (
                              <span className="text-slate-400 font-normal">0 GNF</span>
                            ) : (
                              <span className="text-slate-900">{formatCFA(col.collectedAmount)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historique récent du livreur */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-700" />
                  Dernières remises enregistrées
                </h4>
                {inspectedDriverData.history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune remise antérieure consignée.</p>
                ) : (
                  <div className="space-y-2">
                    {inspectedDriverData.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{h.reference}</div>
                          <span className="text-[11px] text-slate-500">{h.createdAt}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">
                            {formatCFA(h.receivedAmount || h.amountDeclared)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {h.status === "VALIDATED" ? "✓ Validé" : h.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Sticky Footer Action */}
            <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectDriverId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <Link
                  href={`/tresorerie/livreurs/${inspectedDriverData.livreur.id}`}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fiche complète</span>
                </Link>
              </div>
              <button
                onClick={() => {
                  const dId = inspectedDriverData.livreur.id;
                  setInspectDriverId(null);
                  handleOpenNewRemittance(dId);
                }}
                className="flex-1 min-w-[200px] py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Pointer la remise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WORKFLOW D'ENREGISTREMENT DE REMISE (MODAL EN 4 ÉTAPES CLAIRES)        */}
      {/* ========================================================================= */}
      {showNewRemittanceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/60">
                  Pointage Caisse Direct
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  Enregistrer une remise physique
                </h3>
              </div>
              <button
                onClick={() => setShowNewRemittanceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRemittance} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* ÉTAPE 1 : Récapitulatif Livreur & Fonds */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. Sélection du livreur &amp; Récapitulatif
                  </label>
                  <span className="text-[11px] text-slate-400">Source unique de vérité</span>
                </div>

                <div className="relative">
                  <select
                    value={selectedDriverId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDriverId(id);
                      const sum = getDriverCodFunds(id);
                      setReceivedAmountInput(sum.fundsToRemit.toString());
                    }}
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-xs"
                  >
                    {livreurs.map((l) => {
                      const s = getDriverCodFunds(l.id);
                      return (
                        <option key={l.id} value={l.id}>
                          {l.name} — {formatCFA(s.fundsToRemit)} à remettre ({s.unremittedOrdersCount} colis)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Recap Driver Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Montant attendu au coffre :</span>
                    <strong className="text-base font-black text-slate-900">
                      {formatCFA(expectedAmt)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Commandes concernées :</span>
                    <strong className="text-slate-800">
                      {selectedDriverFunds.unremittedOrdersCount} colis (
                      {selectedDriverOrders.map((o) => o.orderNumber).slice(0, 3).join(", ") || "—"}
                      {selectedDriverOrders.length > 3 ? "..." : ""})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Dernière remise :</span>
                    <span className="text-slate-700">{selectedDriverFunds.lastRemittanceDate}</span>
                  </div>
                </div>
              </div>

              {/* ÉTAPE 2 : Saisie du Montant Réellement Reçu */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Montant Réellement Reçu en Espèces (GNF) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setReceivedAmountInput(expectedAmt.toString());
                      setRemittanceTypeSelection("AUTO");
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Montant exact ({formatCFA(expectedAmt)})
                  </button>
                </div>

                {/* Big numeric input */}
                <div className="relative">
                  <input
                    type="number"
                    value={receivedAmountInput}
                    onChange={(e) => setReceivedAmountInput(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="500"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 text-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 bg-white tracking-tight"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    GNF
                  </span>
                </div>

                {/* Real-time Dynamic Feedback */}
                {isExactMatch && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">✓ Montant conforme</strong>
                      <span>Aucun écart détecté. Les {formatCFA(inputAmt)} seront sécurisés et les {selectedDriverFunds.unremittedOrdersCount} colis entièrement soldés.</span>
                    </div>
                  </div>
                )}

                {/* When received is less than expected: Choix Remise Partielle VS Écart */}
                {isLesser && (
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">
                        Montant reçu inférieur à l&apos;attendu ({formatCFA(inputAmt)} vs {formatCFA(expectedAmt)})
                      </span>
                      <span className="font-black text-amber-800">
                        Différence : -{formatCFA(difference)}
                      </span>
                    </div>

                    <p className="text-amber-800 text-[11px]">
                      Veuillez qualifier la nature de cette opération pour le Grand Livre :
                    </p>

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-amber-100/70 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRemittanceTypeSelection("PARTIAL")}
                        className={`py-2 px-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          effectiveMode === "PARTIAL"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-amber-900 hover:bg-amber-100"
                        }`}
                      >
                        Remise partielle (Solde dû)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemittanceTypeSelection("DISCREPANCY")}
                        className={`py-2 px-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          effectiveMode === "DISCREPANCY"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-rose-900 hover:bg-rose-100"
                        }`}
                      >
                        Écart constaté (Manquant)
                      </button>
                    </div>

                    {/* Case B: Remise Partielle */}
                    {effectiveMode === "PARTIAL" && (
                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Info className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Attention : Remise partielle</span>
                        </div>
                        <p className="text-sky-800">
                          Un solde de <strong>{formatCFA(difference)}</strong> restera sous la responsabilité du livreur {selectedDriverProfile?.name}. Le livreur restera affiché dans la liste des remises à recevoir avec ce montant mis à jour.
                        </p>
                      </div>
                    )}

                    {/* Case C : Écart constaté (Justification obligatoire) */}
                    {effectiveMode === "DISCREPANCY" && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Écart de caisse détecté : -{formatCFA(difference)}</span>
                        </div>
                        <p className="text-rose-800">
                          Le livreur déclare un montant manquant. Une justification est obligatoire pour soumettre cette opération et sera notifiée au PDG.
                        </p>

                        <div>
                          <label className="block text-[11px] font-bold text-rose-900 mb-1">
                            Motif de l&apos;écart / Justification (obligatoire - min 10 caractères) *
                          </label>
                          <textarea
                            value={discrepancyReasonInput}
                            onChange={(e) => setDiscrepancyReasonInput(e.target.value)}
                            placeholder="Ex : Colis ouvert, client a payé moins, espèces égarées lors de la tournée..."
                            rows={2}
                            required
                            className="w-full p-2.5 rounded-xl border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                          />
                          <div className="flex justify-between text-[10px] text-rose-600 mt-1">
                            <span>
                              {discrepancyReasonInput.trim().length < 10
                                ? `Minimum 10 caractères requis (${discrepancyReasonInput.trim().length}/10)`
                                : "✓ Justification valide"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Case Greater */}
                {isGreater && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Excédent constaté : +{formatCFA(inputAmt - expectedAmt)}. Le surplus sera consigné comme ajustement de caisse.
                    </span>
                  </div>
                )}
              </div>

              {/* ÉTAPE 3 : Traçabilité & Référence */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Traçabilité &amp; Notes
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Réceptionné par</span>
                    <strong className="text-slate-800">
                      {activeTreasuryManager?.name || "Amina Tidjani"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Horodatage auto</span>
                    <strong className="text-slate-800">
                      {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Notes internes optionnelles
                  </label>
                  <input
                    type="text"
                    value={remittanceNotesInput}
                    onChange={(e) => setRemittanceNotesInput(e.target.value)}
                    placeholder="Ex : Espèces comptées au Hub central, coupures vérifiées..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* ÉTAPE 4 : Validation & Protection anti-double clic */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    inputAmt <= 0 ||
                    (effectiveMode === "DISCREPANCY" && discrepancyReasonInput.trim().length < 10)
                  }
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting ||
                    inputAmt <= 0 ||
                    (effectiveMode === "DISCREPANCY" && discrepancyReasonInput.trim().length < 10)
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : effectiveMode === "DISCREPANCY"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 active:scale-98"
                      : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 active:scale-98"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement sécurisé en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>
                        Confirmer la réception de {formatCFA(inputAmt)}
                      </span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Idempotent &amp; inaltérable • Écritures Grand Livre et Journal d&apos;audit générées automatiquement.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTORICAL REMITTANCE DETAIL MODAL                                        */}
      {/* ========================================================================= */}
      {inspectHistoryRemittance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {inspectHistoryRemittance.reference}
                </span>
                <p className="text-xs text-slate-500">Bordereau de caisse</p>
              </div>
              <button
                onClick={() => setInspectHistoryRemittance(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Livreur :</span>
                <strong className="text-slate-900">{inspectHistoryRemittance.livreurName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date de validation :</span>
                <span className="text-slate-800">{inspectHistoryRemittance.validatedAt || inspectHistoryRemittance.createdAt}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Montant attendu :</span>
                <span className="text-slate-700">{formatCFA(inspectHistoryRemittance.amountExpected)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Montant réellement validé :</span>
                <strong className="text-emerald-600 text-sm">{formatCFA(inspectHistoryRemittance.receivedAmount || inspectHistoryRemittance.amountDeclared)}</strong>
              </div>
              {inspectHistoryRemittance.discrepancyAmount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600 font-bold">
                  <span>Écart constaté :</span>
                  <span>-{formatCFA(Math.abs(inspectHistoryRemittance.discrepancyAmount))}</span>
                </div>
              ) : null}
              {inspectHistoryRemittance.discrepancyJustification && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block mb-0.5">Motif de l&apos;écart :</span>
                  <span>{inspectHistoryRemittance.discrepancyJustification}</span>
                </div>
              )}
              {inspectHistoryRemittance.notes && (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-700">
                  <span className="font-bold block mb-0.5">Notes internes :</span>
                  <span>{inspectHistoryRemittance.notes}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setInspectHistoryRemittance(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RemisesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm font-medium">Chargement des remises...</div>}>
      <RemisesPageContent />
    </Suspense>
  );
}
