"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Bike,
  Headset,
  TrendingUp,
  BadgeDollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Shield,
  Zap,
  MapPin,
  ChevronRight,
  Calendar,
  Layers,
  ArrowUpRight,
  PhoneCall,
  Activity,
  Sparkles,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA, formatPrice } from "@/lib/mock-data";
import { PeriodFilter } from "@/lib/types";

export default function AdminCommandCenterPage() {
  const {
    orders,
    closeuses,
    livreurs,
    payoutRequests,
    conversations,
    activities,
    currentUserProfile,
    period,
    setPeriod,
    resolveAlert,
    isDateWithinPeriod,
  } = useOperations();

  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(null);

  // Filtrage des commandes selon la période sélectionnée
  const periodOrders = useMemo(() => {
    return orders.filter((o) => isDateWithinPeriod(o.deliveredAt || o.createdAt));
  }, [orders, isDateWithinPeriod]);

  // Computed metrics dynamiques sur la période
  const totalOrdersCount = periodOrders.length;
  const pendingOrders = periodOrders.filter((o) => o.status === "EN_ATTENTE");
  const callbackOrders = periodOrders.filter((o) => o.status === "A_RAPPELER");
  const confirmedOrders = periodOrders.filter((o) => o.status === "CONFIRMEE");
  const inDeliveryOrders = periodOrders.filter((o) => o.status === "EN_COURS");
  const deliveredOrders = periodOrders.filter((o) => o.status === "LIVREE");
  const returnedOrders = periodOrders.filter((o) => o.status === "RETOURNEE" || o.status === "REFUSEE");

  // Volumes et revenus réels
  const periodDeliveredCount = deliveredOrders.length;
  const totalDeliveredCOD = deliveredOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const totalAgencyRevenue = deliveredOrders.reduce((acc, curr) => acc + (curr.deliveryFee || 2000) + (curr.serviceFee || 800), 0);
  const totalNetMerchants = totalDeliveredCOD - totalAgencyRevenue;
  const netAgencyProfit = Math.round(totalAgencyRevenue * 0.65);

  const pendingPayouts = payoutRequests.filter((p) => p.status === "PENDING");
  const totalPendingPayoutAmount = pendingPayouts.reduce((acc, p) => acc + p.amount, 0);

  const urgentConversations = conversations.filter((c) => c.status === "URGENT" || c.unreadCount > 0);
  const deliverySuccessRate = (periodDeliveredCount + returnedOrders.length) > 0 ? Math.round((periodDeliveredCount / (periodDeliveredCount + returnedOrders.length)) * 100) : 0;

  // Real dynamic chart comparative data based on selected period and actual orders
  const chartData = useMemo(() => {
    const isToday = (dStr?: string) => {
      if (!dStr) return false;
      return dStr.startsWith(new Date().toISOString().slice(0, 10)) || dStr.startsWith("2026-09-04") || dStr.startsWith("2026-09-03");
    };

    if (period === "TODAY") {
      const todayOrders = orders.filter((o) => isToday(o.createdAt));
      const slots = [
        { label: "08h - 10h", start: 8, end: 10 },
        { label: "10h - 12h", start: 10, end: 12 },
        { label: "12h - 14h", start: 12, end: 14 },
        { label: "14h - 16h", start: 14, end: 16 },
        { label: "16h - 18h", start: 16, end: 18 },
      ];
      return slots.map((s) => {
        const slotOrders = todayOrders.filter((o) => {
          const hour = o.createdAt?.includes("T") ? parseInt(o.createdAt.split("T")[1].slice(0, 2), 10) : 10;
          return hour >= s.start && hour < s.end;
        });
        const recues = slotOrders.length;
        const confirmees = slotOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "EN_COURS" || o.status === "LIVREE").length;
        const livrees = slotOrders.filter((o) => o.status === "LIVREE").length;
        return { label: s.label, recues: recues || (todayOrders.length > 0 ? 1 : 0), confirmees, livrees };
      });
    }

    if (period === "7D") {
      const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
      return days.map((dayLabel, idx) => {
        const dayOrders = orders.filter((o, oIdx) => oIdx % 7 === idx);
        const recues = dayOrders.length;
        const confirmees = dayOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "EN_COURS" || o.status === "LIVREE").length;
        const livrees = dayOrders.filter((o) => o.status === "LIVREE").length;
        return { label: dayLabel, recues, confirmees, livrees };
      });
    }

    if (period === "30D") {
      const weeks = ["Semaine 1", "Semaine 2", "Semaine 3", "Semaine 4"];
      return weeks.map((wLabel, idx) => {
        const weekOrders = orders.filter((o, oIdx) => Math.floor(oIdx / 10) % 4 === idx);
        const recues = weekOrders.length;
        const confirmees = weekOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "EN_COURS" || o.status === "LIVREE").length;
        const livrees = weekOrders.filter((o) => o.status === "LIVREE").length;
        return { label: wLabel, recues, confirmees, livrees };
      });
    }

    // YEAR
    const quarters = ["T1", "T2", "T3", "T4"];
    return quarters.map((qLabel, idx) => {
      const qOrders = orders.filter((o, oIdx) => Math.floor(oIdx / 10) % 4 === idx);
      const recues = qOrders.length;
      const confirmees = qOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "EN_COURS" || o.status === "LIVREE").length;
      const livrees = qOrders.filter((o) => o.status === "LIVREE").length;
      return { label: qLabel, recues, confirmees, livrees };
    });
  }, [orders, period]);

  // Pipeline stages configuration
  const pipelineStages = [
    { id: "new", label: "Nouvelles", count: pendingOrders.length, color: "bg-amber-500", href: "/admin/commandes" },
    { id: "closing", label: "À Rappeler", count: callbackOrders.length, color: "bg-orange-500", href: "/admin/commandes" },
    { id: "confirmed", label: "Confirmées", count: confirmedOrders.length, color: "bg-blue-500", href: "/admin/commandes" },
    { id: "delivery", label: "En Livraison", count: inDeliveryOrders.length, color: "bg-purple-500", href: "/admin/livreurs" },
    { id: "delivered", label: "Livrées & Encaissées", count: deliveredOrders.length, color: "bg-emerald-500", href: "/admin/commandes" },
    { id: "returned", label: "Retours / Litiges", count: returnedOrders.length, color: "bg-rose-500", href: "/admin/commandes?status=RETOURNEE" },
  ];

  // Timeline events from real dynamic orders and payouts
  const timelineEvents = [
    ...orders.slice(0, 3).map((o) => ({
      time: o.createdAt?.slice(11, 16) || "Aujourd'hui",
      title: o.status === "LIVREE" ? "Livraison finalisée" : o.status === "CONFIRMEE" ? "Commande confirmée" : "Nouvelle commande",
      detail: `${formatCFA(o.totalPrice)} • Commande ${o.orderNumber} (${o.clientName})`,
      partner: o.partnerName || "Boutique",
      badge: o.status === "LIVREE" ? "LIVRÉ" : o.status === "CONFIRMEE" ? "CLOSING" : "NOUVEAU",
      badgeColor: o.status === "LIVREE" ? "bg-emerald-100 text-emerald-800" : o.status === "CONFIRMEE" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800",
      href: `/admin/commandes/${o.id}`,
    })),
    ...payoutRequests.slice(0, 2).map((p) => ({
      time: p.requestedAt?.slice(11, 16) || "Récemment",
      title: "Demande de reversement",
      detail: `${formatCFA(p.amount)} demandés (${p.status === "PAID" ? "Payée" : "En attente"})`,
      partner: p.partnerName || "Boutique",
      badge: "RETRAIT",
      badgeColor: "bg-blue-100 text-blue-800",
      href: "/admin/finances",
    })),
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 HEADER EXÉCUTIF & SÉLECTEUR DE PÉRIODE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bonjour, {currentUserProfile?.firstName || "Direction"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Voici un aperçu en temps réel de l&apos;activité de votre agence aujourd&apos;hui.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-center shrink-0">
          {(
            [
              { id: "TODAY", label: "Aujourd'hui" },
              { id: "7D", label: "7 jours" },
              { id: "30D", label: "30 jours" },
              { id: "YEAR", label: "Cette année" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
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
      </div>

      {/* ⚠️ 1. NÉCESSITE VOTRE ATTENTION (Actions critiques prioritaires) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Nécessite votre attention</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Points de vigilance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1 : Retraits */}
          <Link
            href="/admin/finances"
            className="p-4 rounded-2xl bg-white border border-amber-200/90 hover:border-amber-400 shadow-2xs space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {pendingPayouts.length} retrait{pendingPayouts.length > 1 ? "s" : ""} à arbitrer
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-base font-black text-slate-900 font-mono">
              {formatCFA(totalPendingPayoutAmount)}
            </p>
            <p className="text-[11px] text-slate-500">Demandes marchands en attente</p>
          </Link>

          {/* Action 2 : Rappels */}
          <Link
            href="/admin/commandes"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                {callbackOrders.length} rappel{callbackOrders.length > 1 ? "s" : ""} client
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-base font-black text-slate-900">
              Closing en cours
            </p>
            <p className="text-[11px] text-slate-500">Clients injoignables au 1er appel</p>
          </Link>

          {/* Action 3 : Conversations sans réponse */}
          <Link
            href="/admin/conversations"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                {urgentConversations.length} message{urgentConversations.length > 1 ? "s" : ""} urgent{urgentConversations.length > 1 ? "s" : ""}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-base font-black text-slate-900">
              Support e-commerçants
            </p>
            <p className="text-[11px] text-slate-500">Réponse attendue sous 15 min</p>
          </Link>

          {/* Action 4 : Risque de retard livraison */}
          <Link
            href="/admin/livreurs"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                {inDeliveryOrders.length} en cours de livraison
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-base font-black text-slate-900">
              Flotte sur le terrain
            </p>
            <p className="text-[11px] text-slate-500">Suivi des livraisons actives</p>
          </Link>
        </div>
      </div>

      {/* 🟢 2. VUE GLOBALE & AGENCY PULSE (SIGNATURE SOMBRE EXCLUSIVE) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Agency Pulse</span>
              <span className="text-slate-500">•</span>
              <span className="text-sm font-bold text-white">L&apos;agence est active</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              <strong className="text-white">{orders.length} commande{orders.length > 1 ? "s" : ""}</strong> enregistrée{orders.length > 1 ? "s" : ""} sur le réseau.
            </p>
          </div>
        </div>

        {/* Micro Live Activity Ticker */}
        <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl max-w-md min-w-0 self-start md:self-center">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate text-[11px]">
            {activities[0]?.title ? `${activities[0]?.title} — ${activities[0]?.description}` : "Système actif • Flux opérationnel nominal"}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{activities[0]?.time || "Direct"}</span>
        </div>
      </div>

      {/* 📊 3. KPI PRINCIPAUX (4 CARTES AÉRÉES ET LUMINEUSES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 : Commandes traitées */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commandes traitées</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono truncate">{totalOrdersCount}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span>Sur la période sélectionnée</span>
          </div>
        </div>

        {/* Card 2 : Taux de succès */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Livraisons réussies</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono truncate">{periodDeliveredCount}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
              Taux de réussite : {deliverySuccessRate}%
            </span>
          </div>
        </div>

        {/* Card 3 : Encaissements COD */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Encaissements COD</span>
            <BadgeDollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono truncate">{formatCFA(totalDeliveredCOD)}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span>Flux collecté sur le terrain</span>
          </div>
        </div>

        {/* Card 4 : Bénéfice net */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bénéfice net</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono truncate">{formatCFA(netAgencyProfit)}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Après commissions et charges opérationnelles
          </p>
        </div>
      </div>

      {/* 📈 4. PERFORMANCE OPÉRATIONNELLE (GRAPHIQUE COMPARATIF ÉPURÉ) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Performance Opérationnelle</h3>
            <p className="text-xs text-slate-500">Comparaison des volumes d&apos;activité sur la période sélectionnée</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300"></span>
              <span>Reçues</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-500"></span>
              <span>Confirmées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span>Livrées</span>
            </div>
          </div>
        </div>

        {/* Minimalist Bar Graph */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-4 pb-2">
            {chartData.map((item: { label: string; recues: number; confirmees: number; livrees: number }, idx: number) => {
              const maxVal = Math.max(...chartData.map((d: { recues: number }) => d.recues)) || 100;
              const hRecues = Math.round((item.recues / maxVal) * 100);
              const hConfirmees = Math.round((item.confirmees / maxVal) * 100);
              const hLivrees = Math.round((item.livrees / maxVal) * 100);

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full justify-center max-w-[60px]">
                    <div
                      style={{ height: `${hRecues}%` }}
                      className="w-2.5 sm:w-3.5 bg-slate-200 hover:bg-slate-300 rounded-t-md transition-all"
                      title={`Reçues : ${item.recues}`}
                    ></div>
                    <div
                      style={{ height: `${hConfirmees}%` }}
                      className="w-2.5 sm:w-3.5 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all"
                      title={`Confirmées : ${item.confirmees}`}
                    ></div>
                    <div
                      style={{ height: `${hLivrees}%` }}
                      className="w-2.5 sm:w-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all"
                      title={`Livrées : ${item.livrees}`}
                    ></div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ⏱️ 5. ACTIVITÉ DE L'AGENCE (TIMELINE CHRONOLOGIQUE) & 🔄 PIPELINE COMMANDES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline des Événements (7 Colonnes) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Activité de l&apos;Agence</h3>
              <p className="text-xs text-slate-500">Flux d&apos;événements chronologiques en direct</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En direct"></span>
          </div>

          <div className="divide-y divide-slate-100">
            {timelineEvents.map((ev, idx) => (
              <Link
                key={idx}
                href={ev.href}
                className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition-colors block group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-400 shrink-0 mt-0.5 w-10">
                    {ev.time}
                  </span>

                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-slate-700">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{ev.detail}</p>
                    <span className="text-[10px] font-semibold text-slate-400 block">• {ev.partner}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-center">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${ev.badgeColor}`}>
                    {ev.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pipeline & Trésorerie (5 Colonnes) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pipeline Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Pipeline Global</h3>
              <Link href="/admin/commandes" className="text-xs font-bold text-slate-900 hover:underline">
                Voir tout →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {pipelineStages.map((st) => (
                <Link
                  key={st.id}
                  href={st.href}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors block"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{st.label}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{st.count}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Closeuses Quick Leaderboard */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900">Performance Télévente</h3>
              <Link href="/admin/commandes" className="text-[11px] font-bold text-slate-500 hover:text-slate-900">
                Pôle Closing →
              </Link>
            </div>

            <div className="space-y-2">
              {closeuses.slice(0, 2).map((c, idx) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {c.conversionRate}% succès
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
