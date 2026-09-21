"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  RefreshCw,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { DriverCodFinancialSummary } from "@/lib/types";

type FinancialStatusFilter =
  | "ALL"
  | "NO_FUNDS"
  | "TO_REMIT"
  | "EXPIRING_SOON"
  | "OVERDUE"
  | "DISCREPANCY";

type AmountRangeFilter = "ALL" | "0_50K" | "50K_100K" | "100K_500K" | "OVER_500K";

type SortField = "FUNDS_TO_REMIT" | "TOTAL_COLLECTED" | "ORDERS_COUNT" | "LAST_REMITTANCE" | "NAME";

export default function TresorerieLivreursPage() {
  const { livreurs, getDriverCodFunds, logAuditEvent } = useOperations();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FinancialStatusFilter>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [amountFilter, setAmountFilter] = useState<AmountRangeFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("FUNDS_TO_REMIT");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simulated initial loading for real skeleton testing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Trace audit access (once on mount)
  useEffect(() => {
    try {
      logAuditEvent?.({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "TREASURY_DRIVER_VIEWED",
        actionLabel: "Consultation globale des livreurs COD",
        module: "TRESORERIE",
        entityType: "LIVREUR",
        entityId: "ALL_DRIVERS",
        entityReference: "TOUS_LIVREURS",
        severity: "INFO",
        result: "SUCCESS",
        description: "Consultation de la situation financière globale des livreurs COD",
      });
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate financial data for all drivers
  const driversFinancials = useMemo(() => {
    return livreurs.map((l) => {
      const summary = getDriverCodFunds(l.id);
      return {
        livreur: l,
        summary,
      };
    });
  }, [livreurs, getDriverCodFunds]);

  // Unique zones
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>();
    livreurs.forEach((l) => {
      if (l.zone) zones.add(l.zone);
    });
    return Array.from(zones);
  }, [livreurs]);

  // Global KPIs
  const kpis = useMemo(() => {
    const totalActive = livreurs.filter((l) => l.isActive).length;
    const withFunds = driversFinancials.filter((d) => d.summary.fundsToRemit > 0);
    const totalHeld = withFunds.reduce((sum, d) => sum + d.summary.fundsToRemit, 0);
    const overdueCount = driversFinancials.filter(
      (d) => d.summary.operationalStatus === "En retard"
    ).length;
    const discrepanciesCount = driversFinancials.filter(
      (d) => d.summary.hasDiscrepancy || d.summary.operationalStatus === "Écart détecté"
    ).length;

    return {
      totalActive,
      holdingCount: withFunds.length,
      totalHeld,
      overdueCount,
      discrepanciesCount,
    };
  }, [livreurs, driversFinancials]);

  // Filtering logic
  const filteredDrivers = useMemo(() => {
    return driversFinancials.filter(({ livreur, summary }) => {
      // 1. Search filter (nom, prénom, téléphone, ID)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = livreur.name.toLowerCase().includes(q);
        const matchPhone = (livreur.phone || "").toLowerCase().includes(q);
        const matchId = livreur.id.toLowerCase().includes(q);
        const matchZone = (livreur.zone || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchZone) return false;
      }

      // 2. Financial status filter
      if (statusFilter === "NO_FUNDS" && summary.fundsToRemit > 0) return false;
      if (statusFilter === "TO_REMIT" && summary.fundsToRemit <= 0) return false;
      if (statusFilter === "EXPIRING_SOON" && summary.operationalStatus !== "Échéance proche") return false;
      if (statusFilter === "OVERDUE" && summary.operationalStatus !== "En retard") return false;
      if (
        statusFilter === "DISCREPANCY" &&
        !summary.hasDiscrepancy &&
        summary.operationalStatus !== "Écart détecté"
      )
        return false;

      // 3. Zone filter
      if (zoneFilter !== "ALL" && livreur.zone !== zoneFilter) return false;

      // 4. Amount range filter
      if (amountFilter === "0_50K" && (summary.fundsToRemit < 0 || summary.fundsToRemit > 50000))
        return false;
      if (amountFilter === "50K_100K" && (summary.fundsToRemit < 50000 || summary.fundsToRemit > 100000))
        return false;
      if (
        amountFilter === "100K_500K" &&
        (summary.fundsToRemit < 100000 || summary.fundsToRemit > 500000)
      )
        return false;
      if (amountFilter === "OVER_500K" && summary.fundsToRemit <= 500000) return false;

      return true;
    });
  }, [driversFinancials, searchTerm, statusFilter, zoneFilter, amountFilter]);

  // Sorting logic (par défaut: fonds détenus décroissants)
  const sortedDrivers = useMemo(() => {
    return [...filteredDrivers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "FUNDS_TO_REMIT":
          comparison = b.summary.fundsToRemit - a.summary.fundsToRemit;
          break;
        case "TOTAL_COLLECTED":
          comparison = b.summary.totalCodCollected - a.summary.totalCodCollected;
          break;
        case "ORDERS_COUNT":
          comparison = b.summary.unremittedOrdersCount - a.summary.unremittedOrdersCount;
          break;
        case "LAST_REMITTANCE":
          comparison = (b.summary.lastRemittanceDate || "").localeCompare(
            a.summary.lastRemittanceDate || ""
          );
          break;
        case "NAME":
          comparison = a.livreur.name.localeCompare(b.livreur.name);
          break;
        default:
          comparison = b.summary.fundsToRemit - a.summary.fundsToRemit;
      }
      return sortAsc ? -comparison : comparison;
    });
  }, [filteredDrivers, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getStatusBadge = (summary: DriverCodFinancialSummary) => {
    if (summary.hasDiscrepancy || summary.operationalStatus === "Écart détecté") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          🟠 Écart ouvert
        </span>
      );
    }
    if (summary.operationalStatus === "En retard") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          🔴 Remise en retard
        </span>
      );
    }
    if (summary.operationalStatus === "Échéance proche" || summary.fundsToRemit >= 100000) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          🟡 Échéance proche
        </span>
      );
    }
    if (summary.fundsToRemit > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          À remettre
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        🟢 Situation normale
      </span>
    );
  };

  if (hasError) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white border border-rose-200 rounded-3xl shadow-xs space-y-4 my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Impossible de charger les informations financières des livreurs.
        </h2>
        <p className="text-xs text-slate-500">
          Une erreur de synchronisation est survenue lors de la récupération des fonds COD.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 400);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ==================================================
          3. HEADER DU MODULE
          ================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider">
              Trésorerie • Fonds COD
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Situation financière des livreurs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Suivez les fonds COD collectés, les remises effectuées et les montants encore détenus par chaque livreur.
          </p>
        </div>

        {/* Action / Lien direct remises */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/tresorerie/remises"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            Remises au coffre
          </Link>
        </div>
      </div>

      {/* ==================================================
          4. KPI PRINCIPAUX
          ================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-slate-100 rounded-2xl animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Livreurs actifs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.totalActive}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Flotte en mission</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Détenant des fonds</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{kpis.holdingCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">À régulariser</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total actuellement détenu</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCFA(kpis.totalHeld)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Fonds en circulation</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remises en retard</p>
            <p className={`text-2xl font-black mt-1 ${kpis.overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {kpis.overdueCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">&gt; 24h sans dépôt</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Écarts ouverts</p>
            <p className={`text-2xl font-black mt-1 ${kpis.discrepanciesCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {kpis.discrepanciesCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Sous examen</p>
          </div>
        </div>
      )}

      {/* ==================================================
          5 & 6. RECHERCHE ET FILTRES
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un livreur (nom, prénom, téléphone, ID)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

          {/* Sélecteur de statut rapide */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(
              [
                { id: "ALL", label: "Tous" },
                { id: "TO_REMIT", label: "Fonds à remettre" },
                { id: "EXPIRING_SOON", label: "Échéance proche" },
                { id: "OVERDUE", label: "En retard" },
                { id: "DISCREPANCY", label: "Écart ouvert" },
                { id: "NO_FUNDS", label: "Sans fonds" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bouton pour afficher les filtres avancés (Zone & Tranche de montant) */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              zoneFilter !== "ALL" || amountFilter !== "ALL"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres avancés</span>
            {(zoneFilter !== "ALL" || amountFilter !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        {/* Panneau dépliable Filtres avancés */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Zone opérationnelle
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Toutes les zones ({uniqueZones.length})</option>
                {uniqueZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Tranche de montant détenu
              </label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value as AmountRangeFilter)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les montants</option>
                <option value="0_50K">0 – 50 000 GNF</option>
                <option value="50K_100K">50 000 – 100 000 GNF</option>
                <option value="100K_500K">100 000 – 500 000 GNF</option>
                <option value="OVER_500K">Plus de 500 000 GNF</option>
              </select>
            </div>

            {(zoneFilter !== "ALL" || amountFilter !== "ALL") && (
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={() => {
                    setZoneFilter("ALL");
                    setAmountFilter("ALL");
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================
          7, 8, 9. LISTE DES LIVREURS (DESKTOP & MOBILE)
          ================================================== */}
      {isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sortedDrivers.length === 0 ? (
        /* ==================================================
            22. ÉTAT VIDE
            ================================================== */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-black text-slate-900">
            ✓ Aucun livreur ne détient actuellement de fonds COD.
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Toutes les collectes connues ont été remises ou sont en cours de traitement.
          </p>
          {(searchTerm || statusFilter !== "ALL" || zoneFilter !== "ALL" || amountFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setZoneFilter("ALL");
                setAmountFilter("ALL");
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-block"
            >
              Effacer les filtres de recherche
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none"
                      onClick={() => handleSort("NAME")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Livreur</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Zone</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none text-center"
                      onClick={() => handleSort("ORDERS_COUNT")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Commandes</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none text-right"
                      onClick={() => handleSort("TOTAL_COLLECTED")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Total collecté</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Total remis</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none text-right"
                      onClick={() => handleSort("FUNDS_TO_REMIT")}
                    >
                      <div className="flex items-center justify-end gap-1.5 text-blue-700">
                        <span>Fonds détenus</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none"
                      onClick={() => handleSort("LAST_REMITTANCE")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Dernière remise</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sortedDrivers.map(({ livreur, summary }) => {
                    const hasFunds = summary.fundsToRemit > 0;
                    return (
                      <tr
                        key={livreur.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          hasFunds ? "bg-white" : "bg-slate-50/30"
                        }`}
                      >
                        {/* Livreur */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {livreur.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/tresorerie/livreurs/${livreur.id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                              >
                                {livreur.name}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{livreur.phone}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">{livreur.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700">{livreur.zone || "—"}</span>
                        </td>

                        {/* Commandes concernées */}
                        <td className="py-3.5 px-4 text-center">
                          {summary.unremittedOrdersCount > 0 ? (
                            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {summary.unremittedOrdersCount} cmd
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">0 cmd</span>
                          )}
                        </td>

                        {/* Total collecté */}
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          {formatCFA(summary.totalCodCollected)}
                        </td>

                        {/* Total remis */}
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                          {formatCFA(summary.totalFundsRemitted)}
                        </td>

                        {/* Fonds actuellement détenus (priorité visuelle) */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm block ${
                              summary.fundsToRemit > 0 ? "text-blue-700 font-mono" : "text-slate-400"
                            }`}
                          >
                            {formatCFA(summary.fundsToRemit)}
                          </span>
                          {summary.isAnomaly && (
                            <span className="text-[10px] text-rose-600 font-bold block">
                              ⚠️ Anomalie détectée
                            </span>
                          )}
                        </td>

                        {/* Dernière remise */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {summary.lastRemittanceDate || "Aucune remise"}
                        </td>

                        {/* Statut */}
                        <td className="py-3.5 px-4">{getStatusBadge(summary)}</td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/tresorerie/livreurs/${livreur.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all"
                          >
                            <span>Voir</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= MOBILE CARDS (RESPONSIVE) ================= */}
          <div className="block md:hidden space-y-3">
            {sortedDrivers.map(({ livreur, summary }) => (
              <div
                key={livreur.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-xs shrink-0 border border-slate-200">
                      {livreur.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{livreur.name}</h3>
                      <p className="text-[11px] text-slate-500">{livreur.zone} • {livreur.phone}</p>
                    </div>
                  </div>
                  <div>{getStatusBadge(summary)}</div>
                </div>

                {/* Métriques financières de la carte */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fonds Détenus</span>
                    <p className="text-base font-black text-blue-700 font-mono mt-0.5">
                      {formatCFA(summary.fundsToRemit)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Commandes</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      📦 {summary.unremittedOrdersCount} en attente
                    </p>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Collecté: {formatCFA(summary.totalCodCollected)}</span>
                    <span>Remis: {formatCFA(summary.totalFundsRemitted)}</span>
                  </div>
                </div>

                {/* Pied de carte avec action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    🕐 {summary.lastRemittanceDate || "Aucune remise"}
                  </span>
                  <Link
                    href={`/tresorerie/livreurs/${livreur.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
                  >
                    <span>Voir la situation</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
