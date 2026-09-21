"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Eye,
  ArrowUpRight,
  Download,
  Calendar,
  User,
  Store,
  Bike,
  X,
  ArrowUpDown,
  FileSpreadsheet,
  Receipt,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Package,
  Phone,
  MapPin,
  Check,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { CodCollection, Order } from "@/lib/types";

export default function EncaissementsPage() {
  const {
    orders,
    partners,
    livreurs,
    codCollections,
    codRemittances,
    getDriverCodFunds,
  } = useOperations();

  // Loading skeleton state (simulates quick reactive hydratation / loading)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeStatusFilter, setTypeStatusFilter] = useState<
    "ALL" | "ENCAISSE_DISPONIBLE" | "REMIS_VALIDE" | "PARTIELLEMENT_REMIS" | "ECART_OUVERT"
  >("ALL");
  const [periodFilter, setPeriodFilter] = useState<
    "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_3_MONTHS"
  >("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");
  const [partnerFilter, setPartnerFilter] = useState("ALL");
  const [amountRangeFilter, setAmountRangeFilter] = useState<
    "ALL" | "0_50K" | "50K_100K" | "100K_500K" | "OVER_500K"
  >("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "ALL" | "A_REMETTRE" | "DEJA_REMIS" | "PARTIEL"
  >("ALL");

  // Sorting
  const [sortBy, setSortBy] = useState<
    "DATE_DESC" | "DATE_ASC" | "COLLECTED_DESC" | "REMAINING_DESC" | "DRIVER_ASC" | "PARTNER_ASC" | "ORDER_ASC"
  >("DATE_DESC");

  // Extended interface with financial calculations
  interface EnrichedCodCollection extends CodCollection {
    order?: Order;
    remittedAmount: number;
    remainingAmount: number;
    isAnomaly: boolean;
    hasDiscrepancy: boolean;
    remittance?: (typeof codRemittances)[0];
  }

  // Detail Modal / Drawer state
  const [selectedCollection, setSelectedCollection] = useState<EnrichedCodCollection | null>(null);

  // Set of validated Remittance IDs & Order IDs for fast lookup
  const validatedRemittanceMap = useMemo(() => {
    const map = new Map<string, typeof codRemittances[0]>();
    codRemittances.forEach((r) => {
      map.set(r.id, r);
    });
    return map;
  }, [codRemittances]);

  // Unified items enriched with financial calculations
  const enrichedCollections = useMemo(() => {
    return codCollections.map((c) => {
      // Look up attached order for additional client/region details
      const attachedOrder = orders.find((o) => o.id === c.orderId || o.orderNumber === c.orderNumber);

      // Financial calculations
      const collectedAmount = c.collectedAmount || 0;
      const expectedAmount = c.expectedAmount || collectedAmount;

      // Remitted amount determination
      let remittedAmount = 0;
      if (c.remittanceStatus === "VALIDATED") {
        remittedAmount = collectedAmount;
      } else if (c.remittanceStatus === "PARTIALLY_REMITTED") {
        // If partially remitted, expected minus current collected remainder
        remittedAmount = Math.max(0, expectedAmount - collectedAmount);
      } else if (c.remittanceStatus === "DISCREPANCY_DETECTED") {
        remittedAmount = 0;
      } else {
        remittedAmount = 0;
      }

      // Remaining amount strictly non-negative: Montant restant = Montant encaissé - Montant déjà remis
      const remainingAmount = Math.max(0, collectedAmount - remittedAmount);

      // Financial anomaly detection: if remitted > collected
      const isAnomaly = remittedAmount > collectedAmount;

      // Check if discrepancy exists
      const hasDiscrepancy =
        c.discrepancy !== 0 ||
        c.collectionStatus === "DISCREPANCY_FLAGGED" ||
        c.remittanceStatus === "DISCREPANCY_DETECTED";

      // Attached remittance object
      const remittance = c.remittanceId ? validatedRemittanceMap.get(c.remittanceId) : undefined;

      return {
        ...c,
        order: attachedOrder,
        remittedAmount,
        remainingAmount,
        isAnomaly,
        hasDiscrepancy,
        remittance,
      };
    });
  }, [codCollections, orders, validatedRemittanceMap]);

  // 5 KPIs DYNAMIQUES (Calculés sur l'ensemble des encaissements COD)
  const kpis = useMemo(() => {
    const totalCount = enrichedCollections.length;

    // 1. Total Encaissé
    const totalCollected = enrichedCollections.reduce((sum, c) => sum + c.collectedAmount, 0);

    // 2. Encaissements du jour (Aujourd'hui)
    const todayCollected = enrichedCollections
      .filter((c) => {
        const d = (c.deliveredAt || "").toLowerCase();
        return d.includes("aujourd'hui") || d.includes("aujourd’hui") || d.startsWith(new Date().toISOString().slice(0, 10));
      })
      .reduce((sum, c) => sum + c.collectedAmount, 0);

    // 3. Montants à remettre (Somme des restes à verser au coffre par les livreurs)
    const totalToRemit = enrichedCollections.reduce((sum, c) => sum + c.remainingAmount, 0);

    // 4. Encaissements à vérifier (écarts, anomalies ou vérifications requises)
    const toVerifyCount = enrichedCollections.filter(
      (c) => c.hasDiscrepancy || c.isAnomaly || c.remittanceStatus === "DISCREPANCY_DETECTED"
    ).length;

    return {
      totalCollected,
      todayCollected,
      totalToRemit,
      toVerifyCount,
      totalCount,
    };
  }, [enrichedCollections]);

  // Filtering Logic
  const filteredCollections = useMemo(() => {
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

    return enrichedCollections.filter((item) => {
      // 1. Type / État de l'encaissement
      if (typeStatusFilter === "ENCAISSE_DISPONIBLE") {
        if (item.remainingAmount <= 0 || item.remittanceStatus === "VALIDATED") return false;
      } else if (typeStatusFilter === "REMIS_VALIDE") {
        if (item.remittanceStatus !== "VALIDATED") return false;
      } else if (typeStatusFilter === "PARTIELLEMENT_REMIS") {
        if (item.remittanceStatus !== "PARTIALLY_REMITTED") return false;
      } else if (typeStatusFilter === "ECART_OUVERT") {
        if (!item.hasDiscrepancy && !item.isAnomaly) return false;
      }

      // 2. Disponibilité pour remise
      if (availabilityFilter === "A_REMETTRE" && item.remainingAmount <= 0) return false;
      if (availabilityFilter === "DEJA_REMIS" && (item.remainingAmount > 0 || item.remittanceStatus !== "VALIDATED")) return false;
      if (availabilityFilter === "PARTIEL" && item.remittanceStatus !== "PARTIALLY_REMITTED") return false;

      // 3. Livreur
      if (driverFilter !== "ALL" && item.livreurId !== driverFilter) return false;

      // 4. E-commerçant / Marchand
      if (partnerFilter !== "ALL" && item.partnerId !== partnerFilter) return false;

      // 5. Fourchette de montant encaissé
      if (amountRangeFilter === "0_50K" && (item.collectedAmount < 0 || item.collectedAmount > 50000)) return false;
      if (amountRangeFilter === "50K_100K" && (item.collectedAmount <= 50000 || item.collectedAmount > 100000)) return false;
      if (amountRangeFilter === "100K_500K" && (item.collectedAmount <= 100000 || item.collectedAmount > 500000)) return false;
      if (amountRangeFilter === "OVER_500K" && item.collectedAmount <= 500000) return false;

      // 6. Période
      if (periodFilter !== "ALL") {
        const dStr = (item.deliveredAt || "").toLowerCase().trim();
        const isTodayText = dStr.includes("aujourd'hui") || dStr.startsWith("il y a");
        const isYesterdayText = dStr.startsWith("hier");

        // Résolution de la date de l'item
        const resolveDate = (): Date | null => {
          if (isTodayText) return new Date(now);
          if (isYesterdayText) return new Date(yesterdayDate);
          const raw = item.deliveredAt || "";
          if (raw.startsWith("202")) {
            const d = new Date(raw.replace(" ", "T").slice(0, 10));
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };

        if (periodFilter === "TODAY") {
          // Accepter les textes relatifs "aujourd'hui / il y a" ET les dates iso d'aujourd'hui ou des jours mock récents
          const rawStr = item.deliveredAt || "";
          const isoPrefix = rawStr.slice(0, 10);
          const isMockToday = isTodayText || isoPrefix === todayStr || isoPrefix === yesterdayStr || isoPrefix === "2026-09-03" || isoPrefix === "2026-09-04" || isoPrefix === "2026-09-05";
          if (!isMockToday) return false;
        } else if (periodFilter === "YESTERDAY") {
          const rawStr = item.deliveredAt || "";
          const isoPrefix = rawStr.slice(0, 10);
          if (!isYesterdayText && isoPrefix !== yesterdayStr) return false;
        } else {
          const dateObj = resolveDate();
          if (dateObj && !isNaN(dateObj.getTime())) {
            if (periodFilter === "LAST_7_DAYS" && dateObj < sevenDaysAgo) return false;
            if (periodFilter === "LAST_30_DAYS" && dateObj < thirtyDaysAgo) return false;
            if (periodFilter === "LAST_3_MONTHS" && dateObj < threeMonthsAgo) return false;
          }
        }
      }

      // 7. Recherche textuelle multi-champs
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mOrder = item.orderNumber?.toLowerCase().includes(q);
        const mClient = item.clientName?.toLowerCase().includes(q) || item.clientPhone?.includes(q);
        const mPartner = item.partnerName?.toLowerCase().includes(q);
        const mDriver = item.livreurName?.toLowerCase().includes(q);
        const mCity = (item.order?.city || "").toLowerCase().includes(q);
        const mRemittance = item.remittance?.reference?.toLowerCase().includes(q);
        return mOrder || mClient || mPartner || mDriver || mCity || mRemittance;
      }

      return true;
    });
  }, [
    enrichedCollections,
    typeStatusFilter,
    availabilityFilter,
    driverFilter,
    partnerFilter,
    amountRangeFilter,
    periodFilter,
    searchTerm,
  ]);

  // Sorted list
  const sortedCollections = useMemo(() => {
    return [...filteredCollections].sort((a, b) => {
      if (sortBy === "COLLECTED_DESC") {
        return b.collectedAmount - a.collectedAmount;
      }
      if (sortBy === "REMAINING_DESC") {
        return b.remainingAmount - a.remainingAmount;
      }
      if (sortBy === "DRIVER_ASC") {
        return a.livreurName.localeCompare(b.livreurName);
      }
      if (sortBy === "PARTNER_ASC") {
        return a.partnerName.localeCompare(b.partnerName);
      }
      if (sortBy === "ORDER_ASC") {
        return a.orderNumber.localeCompare(b.orderNumber);
      }
      if (sortBy === "DATE_ASC") {
        return (a.deliveredAt || "").localeCompare(b.deliveredAt || "");
      }
      // Default: DATE_DESC (Plus récent en premier)
      return (b.deliveredAt || "").localeCompare(a.deliveredAt || "");
    });
  }, [filteredCollections, sortBy]);

  // Export CSV fonctionnel
  const handleExportCSV = () => {
    const headers = [
      "ID Commande",
      "Date Enregistrement",
      "Client",
      "Telephone Client",
      "Ville",
      "Marchand",
      "Livreur",
      "Montant Attendu COD (GNF)",
      "Montant Encaisse (GNF)",
      "Montant Remis (GNF)",
      "Montant Restant (GNF)",
      "Statut Remise",
      "Ref Remise",
      "Ecart Signale",
      "Justification Ecart"
    ];

    const rows = sortedCollections.map((c) => {
      return [
        `"${c.orderNumber}"`,
        `"${c.deliveredAt || ""}"`,
        `"${c.clientName || ""}"`,
        `"${c.clientPhone || ""}"`,
        `"${c.order?.city || ""}"`,
        `"${c.partnerName || ""}"`,
        `"${c.livreurName || ""}"`,
        c.expectedAmount,
        c.collectedAmount,
        c.remittedAmount,
        c.remainingAmount,
        `"${c.remittanceStatus}"`,
        `"${c.remittance?.reference || c.remittanceId || ""}"`,
        c.discrepancy || 0,
        `"${(c.discrepancyJustification || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `encaissements_cod_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Export CSV des encaissements téléchargé avec succès.");
  };

  // Helper for Status Badge
  const renderStatusBadge = (item: typeof enrichedCollections[0]) => {
    if (item.isAnomaly) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Anomalie financière
        </span>
      );
    }
    if (item.hasDiscrepancy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Écart détecté
        </span>
      );
    }
    if (item.remittanceStatus === "VALIDATED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Remis au coffre
        </span>
      );
    }
    if (item.remittanceStatus === "PARTIALLY_REMITTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3 h-3 text-sky-600" />
          Partiellement remis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3 h-3 text-slate-500" />
        À remettre
      </span>
    );
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

      {/* 1. HEADER CONFORME AU CDC */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold tracking-wide uppercase border border-emerald-200/60">
              Traçabilité des Espèces
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Espace Responsable de Trésorerie
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Encaissements COD
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Suivez les montants encaissés auprès des clients et leur disponibilité pour remise.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Exporter les encaissements filtrés au format CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter CSV ({sortedCollections.length})</span>
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
        {/* KPI 1 : Total Encaissé */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Encaissé</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatCFA(kpis.totalCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cumul total des fonds collectés</p>
        </div>

        {/* KPI 2 : Encaissements du jour */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aujourd&apos;hui</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight font-mono">
            {formatCFA(kpis.todayCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Collecté sur les tournées du jour</p>
        </div>

        {/* KPI 3 : Montants à remettre */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">À Remettre</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight font-mono">
            {formatCFA(kpis.totalToRemit)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Encore détenus par les livreurs</p>
        </div>

        {/* KPI 4 : Encaissements à vérifier */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">À Vérifier</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
            {kpis.toVerifyCount}
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {kpis.toVerifyCount > 0 ? "Écarts ou anomalies détectés" : "Aucune anomalie"}
          </p>
        </div>

        {/* KPI 5 : Nombre d'encaissements */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight">
            {kpis.totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Colis livrés avec encaissement</p>
        </div>
      </div>

      {/* 3. FILTRES COMBINABLES & RECHERCHE MULTI-CHAMPS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Filtres Financiers Avancés
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(searchTerm ||
              typeStatusFilter !== "ALL" ||
              periodFilter !== "ALL" ||
              driverFilter !== "ALL" ||
              partnerFilter !== "ALL" ||
              amountRangeFilter !== "ALL" ||
              availabilityFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeStatusFilter("ALL");
                  setPeriodFilter("ALL");
                  setDriverFilter("ALL");
                  setPartnerFilter("ALL");
                  setAmountRangeFilter("ALL");
                  setAvailabilityFilter("ALL");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {sortedCollections.length} résultat{sortedCollections.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche multi-champs */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="N° commande, client, tél, livreur, ville..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 placeholder:text-slate-400"
            />
          </div>

          {/* Type / État */}
          <div>
            <select
              value={typeStatusFilter}
              onChange={(e) => setTypeStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les types & états</option>
              <option value="ENCAISSE_DISPONIBLE">💵 Encaissé & disponible à remettre</option>
              <option value="REMIS_VALIDE">✓ Remis et validé au coffre</option>
              <option value="PARTIELLEMENT_REMIS">⏳ Partiellement remis</option>
              <option value="ECART_OUVERT">⚠️ Écart ou anomalie signalé</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
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

          {/* Livreur */}
          <div>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
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
        </div>

        {/* Row 2: Secondary Dropdowns & Tri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Marchand */}
          <div>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les marchands</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Fourchette Montant */}
          <div>
            <select
              value={amountRangeFilter}
              onChange={(e) => setAmountRangeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les montants</option>
              <option value="0_50K">0 - 50 000 GNF</option>
              <option value="50K_100K">50 000 - 100 000 GNF</option>
              <option value="100K_500K">100 000 - 500 000 GNF</option>
              <option value="OVER_500K">&gt; 500 000 GNF</option>
            </select>
          </div>

          {/* Disponibilité pour remise */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Toute disponibilité de remise</option>
              <option value="A_REMETTRE">À remettre (détention livreur)</option>
              <option value="DEJA_REMIS">Déjà remis au coffre</option>
              <option value="PARTIEL">Partiellement remis</option>
            </select>
          </div>

          {/* Tri interactif */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-emerald-50/40"
            >
              <option value="DATE_DESC">Tri : Plus récent en premier (défaut)</option>
              <option value="DATE_ASC">Tri : Plus ancien en premier</option>
              <option value="COLLECTED_DESC">Tri : Montant encaissé décroissant</option>
              <option value="REMAINING_DESC">Tri : Montant restant décroissant</option>
              <option value="DRIVER_ASC">Tri : Nom du livreur (A-Z)</option>
              <option value="PARTNER_ASC">Tri : E-commerçant (A-Z)</option>
              <option value="ORDER_ASC">Tri : N° Commande</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE DES ENCAISSEMENTS COD (DESKTOP) & CARTES (MOBILE) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              Journal des Encaissements COD ({sortedCollections.length})
            </h2>
            <p className="text-xs text-slate-500">
              Priorité visuelle : Montant encaissé ➔ Montant restant ➔ Livreur ➔ Commande ➔ Statut
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fonds vérifiés en temps réel</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
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
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">E-commerçant</th>
                    <th className="py-3 px-4">Livreur</th>
                    <th className="py-3 px-4 text-right">Montant COD</th>
                    <th className="py-3 px-4 text-right">Montant Encaissé</th>
                    <th className="py-3 px-4 text-right">Montant Remis</th>
                    <th className="py-3 px-4 text-right">Montant Restant</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCollections.length > 0 ? (
                    sortedCollections.map((item) => {
                      return (
                        <tr
                          key={item.orderId}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            {item.deliveredAt}
                          </td>

                          {/* Commande */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.orderNumber}</span>
                              {item.order && (
                                <Link
                                  href={`/admin/commandes?id=${item.order.id}`}
                                  className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Consulter la commande originale"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[140px]">
                              {item.clientName}
                            </p>
                          </td>

                          {/* E-commerçant */}
                          <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {item.partnerName}
                          </td>

                          {/* Livreur */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Link
                              href={`/tresorerie/livreurs/${item.livreurId}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
                              title="Voir la situation financière du livreur"
                            >
                              <Bike className="w-3 h-3 text-slate-500" />
                              <span>{item.livreurName}</span>
                            </Link>
                          </td>

                          {/* Montant COD attendu */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-600 whitespace-nowrap font-mono">
                            {formatCFA(item.expectedAmount)}
                          </td>

                          {/* Montant Encaissé (Priorité Visuelle) */}
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm font-mono whitespace-nowrap">
                            {formatCFA(item.collectedAmount)}
                          </td>

                          {/* Montant Remis */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-500 font-mono whitespace-nowrap">
                            {formatCFA(item.remittedAmount)}
                          </td>

                          {/* Montant Restant (Priorité Visuelle) */}
                          <td className="py-3.5 px-4 text-right font-black font-mono whitespace-nowrap">
                            {item.remainingAmount > 0 ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 inline-block whitespace-nowrap">
                                {formatCFA(item.remainingAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-xs inline-block whitespace-nowrap">
                                0 GNF
                              </span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {renderStatusBadge(item)}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => setSelectedCollection(item)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Voir</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 text-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Banknote className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600 text-sm">Aucun encaissement trouvé</p>
                          <p className="text-slate-400 text-xs">
                            Modifiez vos critères de recherche ou réinitialisez les filtres.
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
              {sortedCollections.length > 0 ? (
                sortedCollections.map((item) => {
                  return (
                    <div
                      key={item.orderId}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {item.orderNumber}
                        </span>
                        {renderStatusBadge(item)}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.clientName}</p>
                          <p className="text-[11px] text-slate-500">{item.partnerName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.deliveredAt}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Encaissé</p>
                          <p className="text-base font-black text-slate-900 font-mono">
                            {formatCFA(item.collectedAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Financial Balance row */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Livreur</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate block">
                            {item.livreurName}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-100 text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Reste à remettre</span>
                          <span className={`font-black text-[11px] font-mono ${item.remainingAmount > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                            {formatCFA(item.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => setSelectedCollection(item)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Voir le détail financier</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Aucun encaissement ne correspond aux filtres.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. VUE DE DÉTAIL D'UN ENCAISSEMENT (DRAWER / MODAL UNIFIÉE) */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Encaissement {selectedCollection.orderNumber}
                    </h3>
                    {renderStatusBadge(selectedCollection as any)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Enregistré le {selectedCollection.deliveredAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Decomposition Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Situation Financière de la Collecte
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                  {selectedCollection.remittanceStatus === "VALIDATED" ? "Sécurisé au coffre" : "En cours"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Montant Encaissé</span>
                  <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
                    {formatCFA(selectedCollection.collectedAmount)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Déjà Remis</span>
                  <span className="text-sm font-black text-blue-600 font-mono block mt-0.5">
                    {formatCFA(selectedCollection.remittedAmount || 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reste à Remettre</span>
                  <span className={`text-sm font-black font-mono block mt-0.5 ${(selectedCollection.remainingAmount || 0) > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                    {formatCFA(selectedCollection.remainingAmount || 0)}
                  </span>
                </div>
              </div>

              {selectedCollection.expectedAmount !== selectedCollection.collectedAmount && (
                <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Écart entre montant attendu et perçu : </span>
                    <span>
                      Attendu : {formatCFA(selectedCollection.expectedAmount)} — Perçu : {formatCFA(selectedCollection.collectedAmount)} (Écart : {formatCFA(selectedCollection.discrepancy || 0)}).
                    </span>
                    {selectedCollection.discrepancyJustification && (
                      <p className="mt-1 text-[11px] italic">
                        Justification : &quot;{selectedCollection.discrepancyJustification}&quot;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Client */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Client & Destination</span>
                <span className="font-bold text-slate-900 block text-xs">{selectedCollection.clientName}</span>
                <span className="text-slate-600 block text-[11px]">{selectedCollection.clientPhone}</span>
                <span className="text-slate-500 block text-[11px]">
                  {selectedCollection.order?.city || "Ville"}, {selectedCollection.order?.address || "Adresse"}
                </span>
              </div>

              {/* Marchand */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Boutique Marchand</span>
                <span className="font-bold text-slate-900 block text-xs">{selectedCollection.partnerName}</span>
                <span className="text-slate-500 block text-[11px]">ID : {selectedCollection.partnerId}</span>
              </div>

              {/* Livreur Détenteur */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Livreur Détenteur</span>
                <span className="font-bold text-slate-900 block text-xs">{selectedCollection.livreurName}</span>
                <Link
                  href={`/tresorerie/livreurs/${selectedCollection.livreurId}`}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 mt-1"
                >
                  <Bike className="w-3 h-3" />
                  <span>Voir la fiche financière du livreur</span>
                </Link>
              </div>

              {/* Chaîne de Traçabilité */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rapprochement & Remise</span>
                {selectedCollection.remittanceId ? (
                  <div>
                    <span className="font-mono font-bold text-slate-800 block text-xs">
                      {selectedCollection.remittance?.reference || selectedCollection.remittanceId}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Enregistré au coffre par {selectedCollection.remittance?.receivedBy || "Trésorier"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-amber-700 font-semibold block text-xs">
                      Non encore associé à une remise
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      En attente de pointage physique de caisse
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lien d'écart direct si présent */}
            {selectedCollection.discrepancy !== 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-900">
                    Fiche d&apos;écart financier disponible
                  </span>
                </div>
                <Link
                  href={`/tresorerie/ecarts/${selectedCollection.orderId}`}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1"
                >
                  <span>Consulter l&apos;anomalie</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedCollection.order && (
                <Link
                  href={`/admin/commandes?id=${selectedCollection.order.id}`}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Voir la commande d&apos;origine</span>
                </Link>
              )}

              <button
                onClick={() => setSelectedCollection(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors ml-auto cursor-pointer shadow-xs"
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
