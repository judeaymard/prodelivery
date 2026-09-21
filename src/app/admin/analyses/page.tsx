"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Package,
  CheckCircle2,
  Calendar,
  Layers,
  Bike,
  PhoneCall,
  MapPin,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { OverviewMetrics, DeliveryAnalytics, CloserAnalytics } from "@/lib/reporting-service";

export default function AdminAnalysesPage() {
  const { period, setPeriod } = useOperations();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [delivery, setDelivery] = useState<DeliveryAnalytics | null>(null);
  const [closers, setClosers] = useState<CloserAnalytics | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [overRes, delRes, clsRes] = await Promise.all([
        fetch(`/api/reports?type=overview&period=${period}`),
        fetch(`/api/reports?type=delivery&period=${period}`),
        fetch(`/api/reports?type=closers&period=${period}`),
      ]);

      const [overJson, delJson, clsJson] = await Promise.all([
        overRes.json(),
        delRes.json(),
        clsRes.json(),
      ]);

      if (overJson.success) setOverview(overJson.data);
      if (delJson.success) setDelivery(delJson.data);
      if (clsJson.success) setClosers(clsJson.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Analyses de Performance</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">LIVE DATA</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicateurs réels de conversion télévente, délais d&apos;acheminement et performance financière.
          </p>
        </div>

        {/* Period Selector Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            {(
              [
                { id: "TODAY", label: "Aujourd'hui" },
                { id: "7D", label: "7 jours" },
                { id: "30D", label: "30 jours" },
                { id: "THIS_MONTH", label: "Ce mois" },
                { id: "YEAR", label: "Cette année" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === t.id
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Taux de Livraison Réussi</span>
          <p className="text-3xl font-black text-emerald-600">
            {loading ? "..." : `${overview?.deliverySuccessRate ?? 0}%`}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {overview?.deliveredOrders ?? 0} colis livrés sur {overview?.totalOrders ?? 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Volume COD Collecté</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {loading ? "..." : formatCFA(overview?.totalCODCollected ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold">Total espèces encaissées</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Commissions GuinéeGo Acquises</span>
          <p className="text-2xl sm:text-3xl font-black text-purple-700">
            {loading ? "..." : formatCFA(overview?.totalEnoCommissions ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Frais de livraison + closing</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Conversion Télévente</span>
          <p className="text-3xl font-black text-blue-600">
            {loading ? "..." : `${closers?.conversionRate ?? 0}%`}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {closers?.confirmedCount ?? 0} confirmations sur {closers?.totalAssigned ?? 0}
          </p>
        </div>
      </div>

      {/* Real Time Series Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Évolution de l&apos;Activité Réelle</h3>
            <p className="text-xs text-slate-500">Volume des commandes créées et livrées sur la période sélectionnée</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Source : data/orders.json</span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Chargement des graphiques...
          </div>
        ) : overview?.timeSeries && overview.timeSeries.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {overview.timeSeries.slice(-14).map((pt) => {
                const maxOrders = Math.max(...overview.timeSeries.map((p) => p.ordersCount), 5);
                const heightPct = Math.round((pt.ordersCount / maxOrders) * 100);
                const deliveredHeightPct = Math.round((pt.deliveredCount / maxOrders) * 100);

                return (
                  <div key={pt.date} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-24 w-full flex items-end justify-center gap-1">
                      <div
                        style={{ height: `${Math.max(heightPct, 6)}%` }}
                        className="w-3 bg-blue-400 rounded-t-sm transition-all"
                        title={`Commandes: ${pt.ordersCount}`}
                      />
                      <div
                        style={{ height: `${Math.max(deliveredHeightPct, 6)}%` }}
                        className="w-3 bg-emerald-500 rounded-t-sm transition-all"
                        title={`Livrées: ${pt.deliveredCount}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{pt.label}</span>
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                      <span className="text-blue-600">{pt.ordersCount}</span> / <span className="text-emerald-600">{pt.deliveredCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-400" />
                <span>Commandes Reçues</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>Commandes Livrées & Encaissées</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-xs">
            Aucune commande enregistrée sur cette période.
          </div>
        )}
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Performance par Zone Géographique</h3>
          </div>

          <div className="space-y-3">
            {delivery?.zoneBreakdown && delivery.zoneBreakdown.length > 0 ? (
              delivery.zoneBreakdown.map((z) => (
                <div key={z.zone} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{z.zone}</p>
                    <p className="text-[11px] text-slate-400">
                      {z.deliveredOrders} livrées sur {z.totalOrders} ({z.successRate}% succès)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{formatCFA(z.totalCOD)}</p>
                    <span className="text-[10px] font-bold text-emerald-600">COD Encaissé</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée de zone disponible.</p>
            )}
          </div>
        </div>

        {/* Closer Performances */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Performance Closeuses (Télévente)</h3>
          </div>

          <div className="space-y-3">
            {closers?.closerPerformances && closers.closerPerformances.length > 0 ? (
              closers.closerPerformances.map((c) => (
                <div key={c.closerId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{c.closerName}</p>
                    <p className="text-[11px] text-slate-400">
                      {c.confirmedOrders} confirmées sur {c.assignedOrders} assignées ({c.callCount} appels)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                      {c.conversionRate}%
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Taux conversion</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée télévente sur cette période.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
