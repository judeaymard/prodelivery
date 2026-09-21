"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CalendarClock,
  ArrowRight,
  ExternalLink,
  Store,
  Truck,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Zap,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  PhoneOff,
  Percent,
  CheckCheck,
  Flame,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { Order, OrderStatus, Partner } from "@/lib/types";

// Formatage GNF
function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formatage de date
function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function PerformanceCommercialePage() {
  const router = useRouter();
  const { orders, partners, activeCloseuse } = useOperations();

  // Période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "7D" | "30D" | "ALL">("TODAY");

  // Filtre partenaire éventuel
  const [selectedPartner, setSelectedPartner] = useState<string>("ALL");

  // -------------------------------------------------------------
  // 1. FILTRAGE DES COMMANDES SELON LA PÉRIODE CHOISIE
  // -------------------------------------------------------------
  const periodFilteredOrders = useMemo(() => {
    // Référence temporelle du système et date actuelle
    const refDate = new Date("2026-09-06T23:59:59Z");
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();

    return orders.filter((order) => {
      // Filtre Marchand si actif
      if (selectedPartner !== "ALL" && order.partnerId !== selectedPartner) {
        return false;
      }

      if (selectedPeriod === "ALL") return true;

      const orderDateStr = order.createdAt?.slice(0, 10);
      if (!orderDateStr) return false;

      if (selectedPeriod === "TODAY") {
        return orderDateStr === todayStr || orderDateStr === "2026-09-06";
      }

      const orderTime = new Date(orderDateStr).getTime();
      const diffDaysNow = Math.floor((now.getTime() - orderTime) / (1000 * 3600 * 24));
      const diffDaysRef = Math.floor((refDate.getTime() - orderTime) / (1000 * 3600 * 24));

      if (selectedPeriod === "7D") {
        return (diffDaysNow >= 0 && diffDaysNow <= 7) || (diffDaysRef >= 0 && diffDaysRef <= 7);
      }

      if (selectedPeriod === "30D") {
        return (diffDaysNow >= 0 && diffDaysNow <= 30) || (diffDaysRef >= 0 && diffDaysRef <= 30);
      }

      return true;
    });
  }, [orders, selectedPeriod, selectedPartner]);

  // -------------------------------------------------------------
  // 2. CALCUL DES KPI CLÉS DE PERFORMANCE
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const totalOrders = periodFilteredOrders.length;

    // Commandes ayant reçu une action de closing
    const processedOrders = periodFilteredOrders.filter(
      (o) => o.status !== "EN_ATTENTE" || (o.callCount && o.callCount > 0)
    ).length;

    // Somme réelle des appels tentés
    const totalCalls = periodFilteredOrders.reduce(
      (sum, o) => sum + (o.callCount && o.callCount > 0 ? o.callCount : o.lastCallResult ? 1 : 0),
      0
    );

    // Commandes confirmées
    const confirmedOrders = periodFilteredOrders.filter((o) =>
      ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)
    ).length;

    // Commandes annulées ou refusées
    const cancelledOrders = periodFilteredOrders.filter((o) =>
      ["ANNULEE", "REFUSEE", "RETOURNEE"].includes(o.status)
    ).length;

    // En attente / À relancer
    const pendingOrders = periodFilteredOrders.filter((o) =>
      ["EN_ATTENTE", "A_RAPPELER"].includes(o.status)
    ).length;

    // Commandes livrées avec succès
    const deliveredOrders = periodFilteredOrders.filter((o) => o.status === "LIVREE").length;

    // Commandes affectées à un coursier
    const assignedOrders = periodFilteredOrders.filter((o) => !!o.assignedLivreurId).length;

    // Clients contactés (Joints ou ayant répondu)
    const contactedOrders = periodFilteredOrders.filter(
      (o) =>
        o.lastCallResult === "CONTACT_ESTABLISHED" ||
        o.lastCallResult === "CALLBACK_REQUESTED" ||
        o.lastCallResult === "CLIENT_REFUSED" ||
        ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)
    ).length;

    // Relances en retard (scheduledCallback antérieur à now)
    const overdueCallbacks = periodFilteredOrders.filter((o) => {
      if (o.status !== "A_RAPPELER" && o.status !== "EN_ATTENTE") return false;
      if (!o.scheduledCallback) return false;
      const nowIso = new Date().toISOString();
      return o.scheduledCallback < nowIso || o.scheduledCallback < "2026-09-06T23:59:59";
    }).length;

    // Taux de confirmation réel = Confirmées / Traitées
    const confirmationRate =
      processedOrders > 0 ? Math.round((confirmedOrders / processedOrders) * 100) : 0;

    // Taux de contact réel = Contactés / Total commandes reçues
    const contactRate =
      totalOrders > 0 ? Math.round((contactedOrders / totalOrders) * 100) : 0;

    // Taux d'annulation = Annulées / Traitées
    const cancellationRate =
      processedOrders > 0 ? Math.round((cancelledOrders / processedOrders) * 100) : 0;

    // Taux de concrétisation logistique = Livrées / Confirmées
    const deliveryRate =
      confirmedOrders > 0 ? Math.round((deliveredOrders / confirmedOrders) * 100) : 0;

    // Chiffre d'affaires généré par les commandes confirmées
    const gmvConfirmed = periodFilteredOrders
      .filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status))
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    return {
      totalOrders,
      processedOrders,
      totalCalls,
      confirmedOrders,
      cancelledOrders,
      pendingOrders,
      deliveredOrders,
      assignedOrders,
      contactedOrders,
      overdueCallbacks,
      confirmationRate,
      contactRate,
      cancellationRate,
      deliveryRate,
      gmvConfirmed,
    };
  }, [periodFilteredOrders]);

  // -------------------------------------------------------------
  // 3. ENTONNOIR COMMERCIAL RÉEL (FUNNEL)
  // -------------------------------------------------------------
  const funnelSteps = useMemo(() => {
    const total = stats.totalOrders;
    return [
      {
        label: "1. Commandes reçues",
        count: total,
        pct: 100,
        color: "bg-slate-800",
        barColor: "bg-slate-700",
      },
      {
        label: "2. Traitées / Appels tentés",
        count: stats.processedOrders,
        pct: total > 0 ? Math.round((stats.processedOrders / total) * 100) : 0,
        color: "bg-blue-600",
        barColor: "bg-blue-500",
      },
      {
        label: "3. Contact client établi",
        count: stats.contactedOrders,
        pct: total > 0 ? Math.round((stats.contactedOrders / total) * 100) : 0,
        color: "bg-indigo-600",
        barColor: "bg-indigo-500",
      },
      {
        label: "4. Commandes confirmées",
        count: stats.confirmedOrders,
        pct: total > 0 ? Math.round((stats.confirmedOrders / total) * 100) : 0,
        color: "bg-emerald-600",
        barColor: "bg-emerald-500",
      },
      {
        label: "5. Coursier affecté",
        count: stats.assignedOrders,
        pct: total > 0 ? Math.round((stats.assignedOrders / total) * 100) : 0,
        color: "bg-amber-600",
        barColor: "bg-amber-500",
      },
      {
        label: "6. Colis livrés",
        count: stats.deliveredOrders,
        pct: total > 0 ? Math.round((stats.deliveredOrders / total) * 100) : 0,
        color: "bg-teal-600",
        barColor: "bg-teal-500",
      },
    ];
  }, [stats]);

  // -------------------------------------------------------------
  // 4. RÉPARTITION DES COMMANDES PAR CANAL SOURCE
  // -------------------------------------------------------------
  const performanceBySource = useMemo(() => {
    const sources = ["Shopify", "YouCan", "Import IA", "ENO"];

    return sources.map((src) => {
      const srcOrders = periodFilteredOrders.filter((o) => (o.source || "ENO") === src);
      const total = srcOrders.length;
      const confirmed = srcOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
      const cancelled = srcOrders.filter((o) => ["ANNULEE", "REFUSEE"].includes(o.status)).length;
      const processed = total - srcOrders.filter((o) => o.status === "EN_ATTENTE" && (!o.callCount || o.callCount === 0)).length;
      const rate = processed > 0 ? Math.round((confirmed / processed) * 100) : 0;

      return {
        source: src,
        total,
        confirmed,
        cancelled,
        rate,
      };
    });
  }, [periodFilteredOrders]);

  // -------------------------------------------------------------
  // 5. PERFORMANCE PAR E-COMMERÇANT PARTENAIRE
  // -------------------------------------------------------------
  const performanceByPartner = useMemo(() => {
    return partners.map((p) => {
      const pOrders = periodFilteredOrders.filter((o) => o.partnerId === p.id);
      const total = pOrders.length;
      const confirmed = pOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
      const cancelled = pOrders.filter((o) => ["ANNULEE", "REFUSEE"].includes(o.status)).length;
      const processed = total - pOrders.filter((o) => o.status === "EN_ATTENTE" && (!o.callCount || o.callCount === 0)).length;
      const rate = processed > 0 ? Math.round((confirmed / processed) * 100) : 0;
      const gmv = pOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      return {
        id: p.id,
        name: p.companyName,
        total,
        confirmed,
        cancelled,
        rate,
        gmv,
      };
    }).filter((p) => p.total > 0).sort((a, b) => b.total - a.total);
  }, [periodFilteredOrders, partners]);

  // -------------------------------------------------------------
  // 6. HISTORIQUE D'ACTIVITÉ TEMPORELLE RÉELLE (GRAPHIQUE CONNECTÉ)
  // -------------------------------------------------------------
  const chartData = useMemo(() => {
    // Cas 1 : Période "Aujourd'hui" -> Découpage horaire de la journée (créneaux de 2h)
    if (selectedPeriod === "TODAY") {
      const slots = [
        { label: "08h-10h", start: 8, end: 10 },
        { label: "10h-12h", start: 10, end: 12 },
        { label: "12h-14h", start: 12, end: 14 },
        { label: "14h-16h", start: 14, end: 16 },
        { label: "16h-18h", start: 16, end: 18 },
        { label: "18h-20h", start: 18, end: 20 },
      ];

      return slots.map((s) => {
        const slotOrders = periodFilteredOrders.filter((o) => {
          if (!o.createdAt) return false;
          const dateObj = new Date(o.createdAt);
          const h = isNaN(dateObj.getHours()) ? parseInt(o.createdAt.slice(11, 13) || "0", 10) : dateObj.getHours();
          return h >= s.start && h < s.end;
        });

        const total = slotOrders.length;
        const confirmed = slotOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
        const cancelled = slotOrders.filter((o) => ["ANNULEE", "REFUSEE"].includes(o.status)).length;

        return {
          key: s.label,
          label: s.label,
          subLabel: "Aujourd'hui",
          total,
          confirmed,
          cancelled,
        };
      });
    }

    // Cas 2 : Période "7 derniers jours" -> Découpage jour par jour sur les 7 derniers jours
    if (selectedPeriod === "7D") {
      const days: { key: string; label: string; subLabel: string; total: number; confirmed: number; cancelled: number }[] = [];
      const baseDate = new Date("2026-09-06T12:00:00");
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayOrders = periodFilteredOrders.filter((o) => (o.createdAt?.slice(0, 10) || "") === dateStr);
        const total = dayOrders.length;
        const confirmed = dayOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
        const cancelled = dayOrders.filter((o) => ["ANNULEE", "REFUSEE"].includes(o.status)).length;

        const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
        const dayNum = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

        days.push({
          key: dateStr,
          label: dayNum,
          subLabel: dayName,
          total,
          confirmed,
          cancelled,
        });
      }
      return days;
    }

    // Cas 3 : "30D" ou "ALL" -> Agrégation par date réelle avec commandes
    const map = new Map<string, { key: string; label: string; subLabel: string; total: number; confirmed: number; cancelled: number }>();
    periodFilteredOrders.forEach((o) => {
      const d = o.createdAt?.slice(0, 10) || "2026-09-06";
      if (!map.has(d)) {
        map.set(d, {
          key: d,
          label: formatDate(d),
          subLabel: "",
          total: 0,
          confirmed: 0,
          cancelled: 0,
        });
      }
      const item = map.get(d)!;
      item.total++;
      if (["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)) {
        item.confirmed++;
      } else if (["ANNULEE", "REFUSEE"].includes(o.status)) {
        item.cancelled++;
      }
    });

    const result = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    return result.length > 0 ? result : [
      { key: "today", label: "Aujourd'hui", subLabel: "", total: 0, confirmed: 0, cancelled: 0 }
    ];
  }, [periodFilteredOrders, selectedPeriod]);

  const maxChartCount = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.total), 1);
    return Math.max(maxVal, 5);
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          HEADER PERFORMANCE COMMERCIALE
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">Performance</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Performance Commerciale
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analysez votre activité commerciale et vos résultats en temps réel.
          </p>
        </div>

        {/* Sélecteur de Période Réactif */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setSelectedPeriod("TODAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === "TODAY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setSelectedPeriod("7D")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === "7D"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setSelectedPeriod("30D")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === "30D"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => setSelectedPeriod("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Toutes
            </button>
          </div>

          {/* Filtre Marchand */}
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs cursor-pointer focus:outline-none"
          >
            <option value="ALL">Tous les marchands</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5 KPI PRINCIPAUX DYNAMIQUES
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Commandes traitées */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Commandes traitées</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.processedOrders}</div>
          <div className="text-[10px] text-slate-400">Sur {stats.totalOrders} reçues</div>
        </div>

        {/* Appels effectués */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Appels passés</span>
            <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalCalls}</div>
          <div className="text-[10px] text-indigo-700 font-semibold">
            Taux contact: {stats.contactRate}%
          </div>
        </div>

        {/* Commandes confirmées */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700">Confirmées</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.confirmedOrders}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            CA : {formatCFA(stats.gmvConfirmed)}
          </div>
        </div>

        {/* Commandes annulées */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">Annulées / Refusées</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.cancelledOrders}</div>
          <div className="text-[10px] text-rose-600 font-semibold">
            Taux annulation: {stats.cancellationRate}%
          </div>
        </div>

        {/* Taux de confirmation */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-blue-50/50 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900">Taux de confirmation</span>
            <Percent className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            {stats.processedOrders > 0 ? `${stats.confirmationRate}%` : "—"}
          </div>
          <div className="text-[10px] text-blue-700 font-semibold">
            Confirmées / Traitées
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          GRAPHIQUE D'ACTIVITÉ RÉELLE ET ENTONNOIR COMMERCIAL
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entonnoir de conversion (Funnel réel) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Entonnoir de Closing Réel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Taux de progression à chaque étape de la commande
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{step.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900">{step.count}</span>
                    <span className="text-[10px] text-slate-400">({step.pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${step.barColor}`}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Taux de livraison final :</span>
            <span className="font-black text-teal-700">{stats.deliveryRate}%</span>
          </div>
        </div>

        {/* Visualisation de l'Activité Journalière */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                {selectedPeriod === "TODAY"
                  ? "Activité par Créneau Horaire (Aujourd'hui)"
                  : selectedPeriod === "7D"
                  ? "Activité sur les 7 Derniers Jours"
                  : "Activité Commerciale par Date"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPeriod === "TODAY"
                  ? "Flux horaire des commandes enregistrées en direct"
                  : "Volume des commandes réelles reçues, confirmées et refusées"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span>Reçues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Confirmées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                <span>Annulées</span>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 space-y-4">
            {/* Grille dynamique selon le nombre de colonnes avec scroll horizontal fluide sur mobile */}
            <div className="overflow-x-auto no-scrollbar pb-2">
              <div className={`grid gap-2 sm:gap-3 items-end h-52 border-b border-slate-100 pb-2 min-w-[320px] ${
                chartData.length <= 6 ? "grid-cols-6 min-w-[340px]" : chartData.length === 7 ? "grid-cols-7 min-w-[420px]" : "grid-cols-4 sm:grid-cols-8 min-w-[480px]"
              }`}>
                {chartData.map((item) => {
                  const totalHeight = Math.max(Math.round((item.total / maxChartCount) * 100), item.total > 0 ? 8 : 2);
                  const confirmedHeight = Math.max(Math.round((item.confirmed / maxChartCount) * 100), item.confirmed > 0 ? 8 : 2);
                  const cancelledHeight = Math.max(Math.round((item.cancelled / maxChartCount) * 100), item.cancelled > 0 ? 8 : 2);

                  return (
                    <div key={item.key} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Indicateur chiffré direct au-dessus des barres */}
                      <div className="text-[10px] font-black text-slate-700 opacity-80 group-hover:opacity-100 mb-1">
                        {item.total > 0 ? item.total : "-"}
                      </div>

                      <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-36">
                        {/* Barre Total reçues */}
                        <div
                          className="w-2.5 sm:w-4 bg-blue-500 rounded-t-md transition-all group-hover:bg-blue-600 relative cursor-pointer"
                          style={{ height: `${item.total > 0 ? totalHeight : 4}%` }}
                          title={`Total reçues : ${item.total}`}
                        />
                        {/* Barre Confirmées */}
                        <div
                          className="w-2.5 sm:w-4 bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-600 relative cursor-pointer"
                          style={{ height: `${item.confirmed > 0 ? confirmedHeight : 4}%` }}
                          title={`Confirmées : ${item.confirmed}`}
                        />
                        {/* Barre Annulées */}
                        <div
                          className="w-2.5 sm:w-4 bg-rose-400 rounded-t-md transition-all group-hover:bg-rose-500 relative cursor-pointer"
                          style={{ height: `${item.cancelled > 0 ? cancelledHeight : 4}%` }}
                          title={`Annulées : ${item.cancelled}`}
                        />
                      </div>

                      {/* Libellé de l'axe X */}
                      <div className="text-center pt-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block whitespace-nowrap">
                          {item.label}
                        </span>
                        {item.subLabel && (
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note d'explication de synchronisation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-400 pt-1">
              <span>Synchronisé en direct avec les commandes ({periodFilteredOrders.length} commandes filtrées)</span>
              <span className="font-semibold text-slate-600">Échelle max : {maxChartCount} cmd</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          PERFORMANCE PAR CANAL (SHOPIFY, YOUCAN, IA, GUINÉEGO)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canaux / Sources */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Performance par Canal de Vente
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Efficacité du closing selon la plateforme d'acquisition
            </p>
          </div>

          <div className="space-y-3">
            {performanceBySource.map((s) => (
              <div
                key={s.source}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    s.source === "Shopify"
                      ? "bg-emerald-100 text-emerald-800"
                      : s.source === "YouCan"
                      ? "bg-indigo-100 text-indigo-800"
                      : s.source === "Import IA"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-slate-200 text-slate-800"
                  }`}>
                    {s.source.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{s.source}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.total} commande{s.total > 1 ? "s" : ""} • {s.confirmed} confirmée{s.confirmed > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-slate-900 text-sm">
                    {s.total > 0 ? `${s.rate}%` : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400">Taux closing</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Points d'attention & Insights Métier */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Points d'Attention & Actions Recommandées
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculés automatiquement à partir des flux de commandes actuels
            </p>
          </div>

          <div className="space-y-3">
            {/* Insight 1 : Commandes sans livreur */}
            {stats.confirmedOrders - stats.assignedOrders > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-rose-900">
                    {stats.confirmedOrders - stats.assignedOrders} commande(s) confirmée(s) sans coursier
                  </div>
                  <p className="text-rose-700 mt-0.5 leading-relaxed text-[11px]">
                    Ces commandes risquent un retard de livraison. Affectez un livreur disponible dès maintenant.
                  </p>
                  <Link
                    href="/commercial/livraison-affectation"
                    className="inline-flex items-center gap-1 font-bold text-rose-800 hover:underline mt-1 text-[11px]"
                  >
                    Gérer les affectations →
                  </Link>
                </div>
              </div>
            )}

            {/* Insight 2 : Relances à traiter */}
            {stats.overdueCallbacks > 0 && (
              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
                <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-orange-900">
                    {stats.overdueCallbacks} relance(s) téléphonique(s) en retard
                  </div>
                  <p className="text-orange-700 mt-0.5 leading-relaxed text-[11px]">
                    Des clients ayant demandé à être rappelés ont dépassé leur créneau. Rappelez-les pour sécuriser la commande.
                  </p>
                  <Link
                    href="/commercial/appels-relances"
                    className="inline-flex items-center gap-1 font-bold text-orange-800 hover:underline mt-1 text-[11px]"
                  >
                    Ouvrir les relances →
                  </Link>
                </div>
              </div>
            )}

            {/* Insight 3 : Commandes en attente de premier appel */}
            {stats.pendingOrders > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-blue-900">
                    {stats.pendingOrders} nouvelle(s) commande(s) à qualifier
                  </div>
                  <p className="text-blue-700 mt-0.5 leading-relaxed text-[11px]">
                    Le délai de contact moyen impacte directement le taux de confirmation. Lancez la file de télévente.
                  </p>
                  <Link
                    href="/commercial/commandes"
                    className="inline-flex items-center gap-1 font-bold text-blue-800 hover:underline mt-1 text-[11px]"
                  >
                    Traiter les commandes →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TABLEAU DE PERFORMANCE PAR E-COMMERÇANT
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            Performance Détaillée par Boutique Partenaire
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {performanceByPartner.length} boutique(s) active(s) sur la période
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Boutique Marchande</th>
                <th className="py-3 px-3">Commandes Reçues</th>
                <th className="py-3 px-3">Confirmées</th>
                <th className="py-3 px-3">Annulées</th>
                <th className="py-3 px-3">Taux de Closing</th>
                <th className="py-3 px-3">Volume d'affaires (GMV)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performanceByPartner.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                        {p.name.charAt(0)}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.total}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{p.confirmed}</td>
                  <td className="py-3 px-3 font-medium text-rose-700">{p.cancelled}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900">{p.rate}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${p.rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{formatCFA(p.gmv)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/commercial/commandes?partner=${encodeURIComponent(p.id)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>Commandes</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
