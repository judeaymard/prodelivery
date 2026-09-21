"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Headset,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  BadgeDollarSign,
  TrendingUp,
  Package,
  Check,
  X,
  ChevronRight,
  MoreVertical,
  Plus,
  PauseCircle,
  PlayCircle,
  Shield,
  Activity,
  Calendar,
  Globe,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { CloseuseStatus, Order, Conversation } from "@/lib/types";
export default function AdminCloseuseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    closeuses,
    orders,
    conversations,
    updateCloserAvailability,
    updateCloseuse,
    reassignCloseuseOrders,
  } = useOperations();

  const closeuse = closeuses.find((c) => c.id === resolvedParams.id) || closeuses[0];

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTargetCloserId, setSelectedTargetCloserId] = useState<string>("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!closeuse) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-900">Closeuse introuvable.</p>
        <Link href="/admin/closeuses" className="text-xs text-slate-500 hover:underline mt-2 inline-block">
          ← Retour à l&apos;équipe de confirmation
        </Link>
      </div>
    );
  }

  // Assigned orders
  const assignedOrders = orders.filter(
    (o) => o.assignedCloseuseId === closeuse.id || o.assignedCloseuseName === closeuse.name
  );
  const activeAssignedOrders = assignedOrders.filter(
    (o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || o.status === "CONFIRMEE"
  );
  const pendingConfirmOrders = assignedOrders.filter(
    (o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER"
  );

  // Closer conversations
  const closerConversations = conversations.filter(
    (c) => c.assignedAgentName === closeuse.name
  );

  // Capacities
  const maxOrders = closeuse.maxActiveOrders || 0;
  const currentOrders = activeAssignedOrders.length || closeuse.activeOrdersCount || 0;
  const remainingOrders = maxOrders > 0 ? Math.max(0, maxOrders - currentOrders) : 0;
  const ordersPercent = maxOrders > 0 ? Math.min(100, Math.round((currentOrders / maxOrders) * 100)) : 0;

  const maxConvs = closeuse.maxActiveConversations || 0;
  const currentConvs = closerConversations.length || closeuse.activeConversationsCount || 0;
  const remainingConvs = maxConvs > 0 ? Math.max(0, maxConvs - currentConvs) : 0;
  const convsPercent = maxConvs > 0 ? Math.min(100, Math.round((currentConvs / maxConvs) * 100)) : 0;

  // Available alternative closers for emergency reassignment
  const availableAlternatives = closeuses.filter(
    (c) => c.id !== closeuse.id && (c.availabilityStatus || "AVAILABLE") === "AVAILABLE"
  );

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(closeuse.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleExecuteReassignment = () => {
    if (!selectedTargetCloserId) return;
    reassignCloseuseOrders(closeuse.id, selectedTargetCloserId);
    setShowReassignModal(false);
  };

  const getStatusBadge = (status?: CloseuseStatus) => {
    switch (status) {
      case "BUSY":
        return { label: "Occupée", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
      case "PAUSED":
        return { label: "En pause", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" };
      case "OFFLINE":
        return { label: "Hors ligne", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
      case "UNAVAILABLE":
        return { label: "Indisponible", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
      case "AVAILABLE":
      default:
        return { label: "Disponible", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    }
  };

  const badge = getStatusBadge(closeuse.availabilityStatus);
  
  // 7-day dynamic confirmation activity
  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = weekDays[d.getDay()];
    const isoDate = d.toISOString().slice(0, 10);
    const count = assignedOrders.filter(
      (o) => (o.status === "CONFIRMEE" || o.status === "LIVREE") && o.updatedAt?.startsWith(isoDate)
    ).length;
    return { day: dayStr, count };
  });
  const maxDayCount = Math.max(...weekActivity.map((w) => w.count), 1);

  // Dynamic timeline events based on actual assigned orders
  const timelineEvents = assignedOrders.slice(0, 5).map((o) => ({
    time: o.updatedAt ? new Date(o.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récemment",
    text: `Commande ${o.orderNumber || o.id} • ${o.status === "CONFIRMEE" ? "Confirmée" : o.status === "LIVREE" ? "Livrée" : o.status}`,
    icon: o.status === "CONFIRMEE" || o.status === "LIVREE" ? CheckCircle2 : Package,
  }));

  const isAlertActive =
    pendingConfirmOrders.length > 0 &&
    (closeuse.availabilityStatus === "UNAVAILABLE" || closeuse.availabilityStatus === "PAUSED" || closeuse.availabilityStatus === "OFFLINE");

  return (
    <div className="space-y-6 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/admin/closeuses" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Closeuses</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 font-bold">{closeuse.name}</span>
      </div>

      {/* 👑 EXECUTIVE HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            {closeuse.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {closeuse.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                <span>{badge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-mono">{closeuse.phone}</span>
              <span>•</span>
              <span>{closeuse.email}</span>
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={closeuse.availabilityStatus || "AVAILABLE"}
            onChange={(e) => updateCloserAvailability(closeuse.id, e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors cursor-pointer border-none"
          >
            <option value="AVAILABLE">🟢 Disponible</option>
            <option value="BUSY">🟡 Occupée</option>
            <option value="PAUSED">🔵 En pause</option>
            <option value="OFFLINE">⚪ Hors ligne</option>
            <option value="UNAVAILABLE">🔴 Indisponible</option>
          </select>

          {pendingConfirmOrders.length > 0 && (
            <button
              onClick={() => setShowReassignModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réaffecter ({pendingConfirmOrders.length})</span>
            </button>
          )}

          <a
            href={`tel:${closeuse.phone.replace(/\s+/g, "")}`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Appeler</span>
          </a>
        </div>
      </div>

      {/* ⚠️ ALERTE DE RÉAFFECTATION SI INDISPONIBLE AVEC COMMANDES */}
      {isAlertActive && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">
                Attention : Cette opératrice possède {pendingConfirmOrders.length} commande(s) en attente alors qu&apos;elle est actuellement {badge.label.toLowerCase()}.
              </p>
              <p className="text-amber-800 text-[11px]">
                Pour maintenir la cadence de confirmation, vous pouvez réaffecter ses dossiers en 1-click.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowReassignModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Réaffecter maintenant
          </button>
        </div>
      )}
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. CHARGE ACTUELLE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Charge Actuelle & Capacité
              </h3>
              <span className="text-xs font-mono font-bold text-slate-900">
                Capacité Max : {maxOrders} commandes • {maxConvs} chats
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Orders load */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Commandes actives</span>
                  <span className="font-mono font-bold text-slate-900">{currentOrders} / {maxOrders}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${ordersPercent}%` }}
                    className={`h-full rounded-full transition-all ${
                      ordersPercent > 80 ? "bg-rose-500" : ordersPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {remainingOrders} place(s) restante(s)
                </span>
              </div>

              {/* Conversations load */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Conversations simultanées</span>
                  <span className="font-mono font-bold text-slate-900">{currentConvs} / {maxConvs}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${convsPercent}%` }}
                    className={`h-full rounded-full transition-all ${
                      convsPercent > 80 ? "bg-rose-500" : convsPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {remainingConvs} place(s) restante(s)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Langues maîtrisées</span>
                <div className="flex flex-wrap gap-1.5">
                  {(closeuse.languages || ["Français", "Fon", "Yoruba"]).map((l, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Spécialités / Compétences</span>
                <div className="flex flex-wrap gap-1.5">
                  {(closeuse.skills || ["High-Ticket", "Cosmétique"]).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERFORMANCE ANALYTIQUE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Performance de Confirmation
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                {(["7D", "30D", "90D"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === r ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {r === "7D" ? "7 jours" : r === "30D" ? "30 jours" : "90 jours"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Appels émis</span>
                <span className="text-base font-black text-slate-900">{closeuse.callsTodayCount || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Confirmées auj.</span>
                <span className="text-base font-black text-emerald-700">{closeuse.confirmedTodayCount || assignedOrders.filter((o) => (o.status === "CONFIRMEE" || o.status === "LIVREE") && o.updatedAt?.startsWith(new Date().toISOString().slice(0, 10))).length}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Taux Conversion</span>
                <span className="text-base font-black text-slate-900">
                  {closeuse.conversionRate ? `${closeuse.conversionRate}%` : assignedOrders.length > 0 ? `${Math.round((assignedOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "LIVREE").length / assignedOrders.length) * 100)}%` : "0%"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Temps Moyen</span>
                <span className="text-base font-black text-purple-700">{closeuse.avgProcessingTimeMinutes ? `${closeuse.avgProcessingTimeMinutes} min` : "—"}</span>
              </div>
            </div>

            {/* 7-Day Histogram */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Confirmations quotidiennes</span>
              <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
                {weekActivity.map((w, idx) => {
                  const barHeight = Math.round((w.count / maxDayCount) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{w.count}</span>
                      <div className="w-full bg-slate-100 rounded-lg h-16 flex items-end overflow-hidden">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-full bg-slate-900 rounded-lg transition-all"
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{w.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. FUNNEL DE CONFIRMATION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Funnel de Confirmation (Aujourd&apos;hui)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">1. Reçues</span>
                <span className="text-sm font-black text-slate-900">{assignedOrders.length}</span>
                <span className="text-[9px] text-slate-400 block">Assignées</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
                <span className="text-[10px] text-amber-700 block font-bold">2. À Contacter</span>
                <span className="text-sm font-black text-amber-900">{assignedOrders.filter((o) => o.status === "EN_ATTENTE").length}</span>
                <span className="text-[9px] text-amber-600 block">En attente</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-0.5">
                <span className="text-[10px] text-blue-700 block font-bold">3. Relances</span>
                <span className="text-sm font-black text-blue-900">{assignedOrders.filter((o) => o.status === "A_RAPPELER").length}</span>
                <span className="text-[9px] text-blue-600 block">À rappeler</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-0.5">
                <span className="text-[10px] text-emerald-700 block font-bold">4. Confirmées</span>
                <span className="text-sm font-black text-emerald-900">{assignedOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "LIVREE").length}</span>
                <span className="text-[9px] text-emerald-600 block">Validées</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-purple-700 block font-bold">5. Livrées</span>
                <span className="text-sm font-black text-purple-900">{assignedOrders.filter((o) => o.status === "LIVREE").length}</span>
                <span className="text-[9px] text-purple-600 block">Succès</span>
              </div>
            </div>
          </div>
          {/* 4. COMMANDES ASSIGNÉES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Commandes Assignées ({assignedOrders.length})
              </h3>
              <Link
                href="/admin/commandes"
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Toutes les commandes</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {assignedOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune commande assignée pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {assignedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => router.push(`/admin/commandes/${ord.id}`)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 hover:underline">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{ord.city}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{ord.clientName} • {ord.products}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 block">{formatCFA(ord.totalPrice)}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. CONVERSATIONS ACTIVES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Conversations Actives ({closerConversations.length})
              </h3>
              <span className="text-xs text-slate-400">Canal WhatsApp / GSM</span>
            </div>

            {closerConversations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs text-center">
                Aucune conversation active assignée actuellement.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {closerConversations.map((conv) => (
                  <div key={conv.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{conv.partnerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{conv.phone}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] truncate max-w-xs">{conv.lastMessage}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">{conv.lastMessageAt}</span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        WhatsApp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. HISTORIQUE & TIMELINE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Historique des Activités Récentes
            </h3>

            <div className="space-y-3 pt-1 text-xs">
              {timelineEvents.map((ev, idx) => {
                const Icon = ev.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{ev.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. COMMISSIONS & RÉMUNÉRATION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Commissions & Rémunération
            </span>

            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 block">Tarif par confirmation</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCFA(closeuse.commissionPerConfirmation || 0)}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Gains aujourd&apos;hui :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA((closeuse.confirmedTodayCount || 0) * (closeuse.commissionPerConfirmation || 0))}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Gains cette semaine :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA((closeuse.confirmedWeekCount || 0) * (closeuse.commissionPerConfirmation || 0))}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                <span>Total ce mois :</span>
                <span className="font-mono font-black text-emerald-600">
                  {formatCFA((closeuse.confirmedMonthCount || 0) * (closeuse.commissionPerConfirmation || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* 2. MOTEUR D'ATTRIBUTION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Smart Assignment Engine
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Statut de Dispatch :</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  closeuse.availabilityStatus === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                }`}>
                  {closeuse.availabilityStatus === "AVAILABLE" ? "Éligible au flux" : "Exclue du dispatch"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Le moteur distribue automatiquement selon : Disponibilité → Capacité restante → Moindre charge → Round Robin persistant.
              </p>
            </div>
          </div>

          {/* 3. CONTACT DIRECT */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact Opératrice
            </span>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-mono font-bold text-slate-900">{closeuse.phone}</p>
                <span className="text-[10px] text-slate-400">{closeuse.email}</span>
              </div>
              <button
                onClick={handleCopyPhone}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-[10px] text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedPhone ? "Copié !" : "Copier"}
              </button>
            </div>

            <a
              href={`tel:${closeuse.phone.replace(/\s+/g, "")}`}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer block text-center"
            >
              <Phone className="w-3.5 h-3.5 inline" />
              <span>Appel Téléphonique Direct</span>
            </a>
          </div>
        </div>
      </div>

      {/* 🔄 MODAL RÉAFFECTATION D'URGENCE */}
      {showReassignModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Réaffecter les Commandes</h3>
                <p className="text-xs text-slate-500">Transférez les {pendingConfirmOrders.length} dossier(s) en attente à une collègue disponible.</p>
              </div>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Sélectionnez la closeuse réceptrice :</label>
              {availableAlternatives.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  Aucune autre closeuse n&apos;est actuellement disponible.
                </p>
              ) : (
                availableAlternatives.map((alt) => {
                  const altMax = alt.maxActiveOrders || 15;
                  const altCurrent = (alt.activeOrdersCount || 0);
                  const altRemaining = Math.max(0, altMax - altCurrent);
                  return (
                    <button
                      key={alt.id}
                      onClick={() => setSelectedTargetCloserId(alt.id)}
                      className={`w-full p-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${
                        selectedTargetCloserId === alt.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          selectedTargetCloserId === alt.id ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                        }`}>
                          <Headset className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{alt.name}</h4>
                          <p className={`text-[10px] ${selectedTargetCloserId === alt.id ? "text-slate-300" : "text-slate-400"}`}>
                            {(alt.skills || []).join(", ") || "Généraliste"}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold ${
                        selectedTargetCloserId === alt.id ? "text-emerald-400" : "text-emerald-700"
                      }`}>
                        {altRemaining} place(s) libre(s)
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                disabled={!selectedTargetCloserId}
                onClick={handleExecuteReassignment}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Transférer les Commandes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
