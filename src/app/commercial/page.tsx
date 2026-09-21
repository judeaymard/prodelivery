"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Package,
  Truck,
  User,
  MapPin,
  ChevronRight,
  Plus,
  Eye,
  UserCheck,
  X,
  Phone,
  BarChart3,
  Activity,
  RefreshCw,
  Zap,
  Star,
  Store,
  ArrowUpRight,
  Bell,
  Upload,
  Calendar,
  FileCheck,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order, OrderStatus, Partner } from "@/lib/types";
import DailyClosureModal from "@/components/DailyClosureModal";

function getStatusPill(status: OrderStatus) {
  const cfg: Record<string, { label: string; cls: string }> = {
    EN_ATTENTE: { label: "À appeler", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    A_RAPPELER: { label: "À relancer", cls: "bg-orange-50 text-orange-700 border border-orange-200" },
    CONFIRMEE: { label: "Confirmée", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    EN_COURS: { label: "En livraison", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    LIVREE: { label: "Livrée", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    ANNULEE: { label: "Annulée", cls: "bg-slate-100 text-slate-500 border border-slate-200" },
    REFUSEE: { label: "Refusée", cls: "bg-red-50 text-red-700 border border-red-200" },
    RETOURNEE: { label: "Retournée", cls: "bg-purple-50 text-purple-700 border border-purple-200" },
  };
  const c = cfg[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>;
}

function getPriorityDot(status: OrderStatus) {
  if (status === "EN_ATTENTE") return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Priorité haute" />;
  if (status === "A_RAPPELER") return <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" title="Relance urgente" />;
  if (status === "CONFIRMEE") return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="À affecter" />;
  return <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />;
}

function AssignDriverDrawer({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const { livreurs, assignOrderToLivreur, logClosingCall } = useOperations();
  const [selectedLivreurId, setSelectedLivreurId] = useState<string | null>(null);
  const [reassignReason, setReassignReason] = useState("");

  const availableLivreurs = useMemo(
    () => livreurs.filter((l) => l.isActive && l.availabilityStatus !== "OFFLINE"),
    [livreurs]
  );

  const handleAssign = () => {
    if (!selectedLivreurId) return;
    assignOrderToLivreur(order.id, selectedLivreurId, reassignReason || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs" onClick={onClose}>
      <div className="w-full max-w-full sm:max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-black text-slate-900">Affecter un livreur</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{order.orderNumber} — {order.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 m-3 sm:m-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shrink-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Détails Commande</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-400">Client :</span><p className="font-bold text-slate-900">{order.clientName}</p></div>
            <div><span className="text-slate-400">Téléphone :</span><p className="font-bold text-slate-900">{order.clientPhone}</p></div>
            <div><span className="text-slate-400">Ville / Zone :</span><p className="font-bold text-slate-900">{order.city} ({order.region || 'Guinée'})</p></div>
            <div><span className="text-slate-400">Montant COD :</span><p className="font-bold text-slate-900">{formatCFA(order.totalPrice)}</p></div>
            <div className="sm:col-span-2"><span className="text-slate-400">Articles :</span><p className="font-bold text-slate-900">{order.products} × {order.quantity}</p></div>
            <div className="sm:col-span-2"><span className="text-slate-400">Adresse de livraison :</span><p className="font-semibold text-slate-700">{order.address}</p></div>
          </div>
        </div>

        {order.assignedLivreurId && (
          <div className="px-4 pb-2 shrink-0">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <p className="text-[11px] font-bold text-amber-800">⚠️ Réaffectation — Livreur actuel : {order.assignedLivreurName || 'Attribué'}</p>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Motif de changement de livreur..."
                className="w-full text-xs rounded-lg border border-amber-300 bg-white p-2 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="flex-1 p-4 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">Sélectionnez le livreur</p>
          {availableLivreurs.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">Aucun livreur actif disponible pour le moment.</div>
          )}
          {availableLivreurs.map((l) => {
            const isSelected = selectedLivreurId === l.id;
            const statusColors: Record<string, string> = {
              AVAILABLE: "bg-emerald-100 text-emerald-700",
              IN_TRANSIT: "bg-indigo-100 text-indigo-700",
              PAUSED: "bg-amber-100 text-amber-700",
            };
            const statusLabels: Record<string, string> = {
              AVAILABLE: "Disponible",
              IN_TRANSIT: "En course",
              PAUSED: "En pause",
            };
            const st = l.availabilityStatus || "AVAILABLE";
            return (
              <button
                key={l.id}
                onClick={() => setSelectedLivreurId(l.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? "border-slate-900 bg-slate-50 shadow-xs" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{l.name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{l.zone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColors[st] || "bg-slate-100 text-slate-500"}`}>
                      {statusLabels[st] || st}
                    </span>
                    <span className="text-[9px] text-slate-400">{l.assignedOrdersCount} colis en cours</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
          <button
            onClick={handleAssign}
            disabled={!selectedLivreurId || (!!order.assignedLivreurId && !reassignReason.trim())}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Confirmer l'affectation
          </button>
          <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommercialCommandCenterPage() {
  const router = useRouter();
  const {
    orders,
    livreurs,
    partners,
    activities,
    activeCloseuse,
    notifications,
    conversations,
    claimConversation,
    updateOrderStatus,
    logClosingCall,
  } = useOperations();

  const [assignDrawerOrder, setAssignDrawerOrder] = useState<Order | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<"TODAY" | "7D" | "30D">("TODAY");
  const [closurePartner, setClosurePartner] = useState<Partner | null>(null);

  // Conversations en attente de prise en charge par une closeuse
  const waitingConversations = useMemo(
    () => conversations.filter((c) => c.status === "WAITING" || (!c.assignedAgentName && c.status !== "RESOLVED")),
    [conversations]
  );

  // Métriques
  const toCallOrders = useMemo(() => orders.filter((o) => o.status === "EN_ATTENTE"), [orders]);
  const toRelanceOrders = useMemo(() => orders.filter((o) => o.status === "A_RAPPELER"), [orders]);
  const toConfirmOrders = useMemo(() => orders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER"), [orders]);
  const confirmedOrders = useMemo(() => orders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)), [orders]);
  const toAssignOrders = useMemo(() => orders.filter((o) => o.status === "CONFIRMEE" && !o.assignedLivreurId), [orders]);

  const totalProcessed = orders.filter((o) => o.status !== "EN_ATTENTE").length;
  const confirmedToday = confirmedOrders.length;
  const conversionRate = totalProcessed > 0 ? Math.round((confirmedToday / totalProcessed) * 100) : 0;

  // Priorités
  const priorityOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || (o.status === "CONFIRMEE" && !o.assignedLivreurId))
      .slice(0, 10);
  }, [orders]);

  // Alertes opérationnelles
  const alerts = useMemo(() => {
    const list: { id: string; type: string; message: string; orderId?: string; orderNumber?: string }[] = [];
    orders.forEach((o) => {
      if (o.status === "CONFIRMEE" && !o.assignedLivreurId) {
        list.push({ id: `alert-nolivreur-${o.id}`, type: "NO_DRIVER", message: `${o.orderNumber} confirmée mais sans livreur assigné`, orderId: o.id, orderNumber: o.orderNumber });
      }
      if (o.status === "A_RAPPELER" && (o.callCount || 0) >= 3) {
        list.push({ id: `alert-recall-${o.id}`, type: "EXCESS_CALLS", message: `${o.orderNumber} — 3+ tentatives sans réponse client`, orderId: o.id, orderNumber: o.orderNumber });
      }
    });
    return list.slice(0, 5);
  }, [orders]);

  // Performance par e-commerçant
  const partnerPerf = useMemo(() => {
    return partners.slice(0, 6).map((p) => {
      const pOrders = orders.filter((o) => o.partnerId === p.id);
      const confirmed = pOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
      const cancelled = pOrders.filter((o) => o.status === "ANNULEE").length;
      const rate = pOrders.length > 0 ? Math.round((confirmed / pOrders.length) * 100) : 0;
      return { partner: p, total: pOrders.length, confirmed, cancelled, pending: pOrders.filter((o) => o.status === "EN_ATTENTE").length, rate };
    }).sort((a, b) => b.total - a.total);
  }, [orders, partners]);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const closeuseName = activeCloseuse?.name?.split(" ")[0] || "Sarah";

  const kpis = [
    {
      label: "À appeler",
      value: toCallOrders.length,
      icon: PhoneCall,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      href: "/commercial/commandes",
      urgent: toCallOrders.length > 0,
    },
    {
      label: "À relancer",
      value: toRelanceOrders.length,
      icon: RefreshCw,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      href: "/commercial/appels-relances",
      urgent: toRelanceOrders.length > 0,
    },
    {
      label: "À confirmer",
      value: toConfirmOrders.length,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      href: "/commercial/commandes",
      urgent: false,
    },
    {
      label: "Confirmées aujourd'hui",
      value: confirmedToday,
      icon: Star,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      href: "/commercial/commandes",
      urgent: false,
    },
    {
      label: "Taux de confirmation",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      href: "/commercial/performance",
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE DU COMMAND CENTER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Bonjour, {closeuseName} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{today}</p>
          <p className="text-xs text-slate-400 mt-1">
            Voici ce qui nécessite votre attention aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => router.push("/commercial/commandes")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle commande
          </button>
          <button
            onClick={() => router.push("/commercial/commandes?import=true")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Importer une commande (IA)
          </button>
          <Link
            href="/commercial/notifications"
            className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className={`group relative bg-white rounded-2xl border ${k.urgent ? "border-slate-300 shadow-xs" : "border-slate-200"} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
            >
              {k.urgent && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 leading-none">{k.value}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-snug">{k.label}</p>
              <ChevronRight className="absolute bottom-3 right-3 w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* ── CORPS DE TABLEAU DE BORD (2/3 + 1/3) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* COLONNE GAUCHE (2/3) */}
        <div className="xl:col-span-2 space-y-5">

          {/* 🔔 DEMANDES D'ASSISTANCE MARCHANDS EN DIRECT */}
          {waitingConversations.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-500/30 animate-pulse-subtle">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <h3 className="text-sm font-black text-white">
                    Demandes de Support Marchand en Attente ({waitingConversations.length})
                  </h3>
                </div>
                <Link
                  href="/commercial/conversations"
                  className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-1"
                >
                  Ouvrir le Hub <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-2">
                {waitingConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-white">{conv.companyName}</span>
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.2 rounded-full">
                          En attente de prise en charge
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 truncate">
                        &laquo; {conv.lastMessage} &raquo;
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {conv.partnerName} • {conv.phone} • {conv.lastMessageAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          claimConversation(
                            conv.id,
                            activeCloseuse?.name || "Opératrice Télévente",
                            "Closeuse & Support"
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Prendre en charge</span>
                      </button>
                      <Link
                        href="/commercial/conversations"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        title="Voir le fil complet"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRIORITÉS DU JOUR */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Priorités du jour
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{priorityOrders.length} commandes nécessitent une action immédiate</p>
              </div>
              <Link href="/commercial/commandes" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {priorityOrders.length === 0 && (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aucune action immédiate requise</p>
                  <p className="text-[11px] text-slate-400">Toutes les commandes en cours sont à jour.</p>
                </div>
              )}
              {priorityOrders.map((o) => (
                <div key={o.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {getPriorityDot(o.status)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{o.orderNumber}</span>
                          {getStatusPill(o.status)}
                          {o.callCount && o.callCount > 0 && (
                            <span className="text-[9px] text-slate-400 font-semibold">{o.callCount} appel(s)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mt-0.5 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          {o.clientName}
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{o.clientPhone}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{o.city}
                          <span>·</span>
                          {o.products}
                          <span>·</span>
                          <span className="font-bold text-slate-600">{formatCFA(o.totalPrice)}</span>
                        </p>
                        {o.partnerName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            <span className="font-semibold">Marchand:</span> {o.partnerName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {(o.status === "EN_ATTENTE" || o.status === "A_RAPPELER") && (
                        <>
                          <a
                            href={`tel:${o.clientPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-700 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            {o.status === "A_RAPPELER" ? "Relancer" : "Appeler"}
                          </a>
                          <button
                            onClick={() => {
                              updateOrderStatus(o.id, "CONFIRMEE", "Confirmée depuis Command Center");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmer
                          </button>
                          <button
                            onClick={() => updateOrderStatus(o.id, "ANNULEE", "Annulée depuis Command Center")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            Annuler
                          </button>
                        </>
                      )}
                      {o.status === "CONFIRMEE" && !o.assignedLivreurId && (
                        <button
                          onClick={() => setAssignDrawerOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          <Truck className="w-3 h-3" />
                          Affecter
                        </button>
                      )}
                      <Link
                        href={`/commercial/commandes?orderId=${o.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RELANCES IMMINENTES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Relances imminentes
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{toRelanceOrders.length} commande(s) en attente de rappel</p>
              </div>
              <Link href="/commercial/appels-relances" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {toRelanceOrders.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <PhoneOff className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  Aucune relance imminente.
                </div>
              )}
              {toRelanceOrders.map((o) => (
                <div key={o.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{o.orderNumber}</span>
                        <span className="text-[9px] bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full font-bold">{o.callCount || 1} tentative(s)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{o.clientName} · {o.clientPhone}</p>
                      {o.comment && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{o.comment}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={`tel:${o.clientPhone}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold hover:bg-orange-600 transition-colors">
                        <Phone className="w-3 h-3" />Appeler
                      </a>
                      <button
                        onClick={() => updateOrderStatus(o.id, "EN_ATTENTE", "Reporté depuis Command Center")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />Reporter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* À AFFECTER */}
          {toAssignOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-500" />
                    À affecter
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{toAssignOrders.length} commande(s) confirmées sans livreur</p>
                </div>
                <Link href="/commercial/affectation" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {toAssignOrders.map((o) => (
                  <div key={o.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{o.orderNumber}</span>
                          {getStatusPill(o.status)}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{o.clientName} · <span className="text-slate-400">{o.city}</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{o.products} · <span className="font-bold text-slate-600">{formatCFA(o.totalPrice)}</span></p>
                      </div>
                      <button
                        onClick={() => setAssignDrawerOrder(o)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Affecter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE (1/3) */}
        <div className="space-y-5">

          {/* ACTIVITÉ RÉCENTE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Activité récente
              </h3>
              <Link href="/commercial/activite" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5">
                Voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.slice(0, 8).map((a, i) => (
                <div key={a.id || i} className="px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                  <p className="text-[11px] font-bold text-slate-900 leading-snug">{a.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{a.description}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="py-6 text-center text-[11px] text-slate-400">Aucune activité récente.</div>
              )}
            </div>
          </div>

          {/* ALERTES OPÉRATIONNELLES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Alertes opérationnelles
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {alerts.length === 0 && (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-[11px] text-slate-400">Aucune alerte active.</p>
                </div>
              )}
              {alerts.map((a) => (
                <div key={a.id} className="px-4 py-2.5 hover:bg-amber-50/40 transition-colors flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">{a.message}</p>
                    {a.orderNumber && (
                      <Link href="/commercial/commandes" className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 mt-0.5">
                        Traiter <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MA PERFORMANCE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                Ma performance
              </h3>
              <div className="flex items-center gap-1">
                {(["TODAY", "7D", "30D"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPerformancePeriod(p)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${performancePeriod === p ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
                  >
                    {p === "TODAY" ? "Auj." : p}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: "Commandes traitées", value: totalProcessed, icon: Package },
                { label: "Confirmées", value: confirmedToday, icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Appels effectués", value: activeCloseuse?.callsTodayCount || 0, icon: PhoneCall, color: "text-blue-600" },
                { label: "Annulées", value: activeCloseuse?.cancelledTodayCount || 0, icon: X, color: "text-rose-500" },
                { label: "Taux de confirmation", value: `${conversionRate}%`, icon: TrendingUp, color: conversionRate >= 70 ? "text-emerald-600" : "text-amber-600" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${m.color || "text-slate-400"}`} />
                      <span className="text-[11px] text-slate-600 font-semibold truncate">{m.label}</span>
                    </div>
                    <span className={`text-xs font-black ${m.color || "text-slate-900"}`}>{m.value}</span>
                  </div>
                );
              })}
              <div className="pt-2">
                <Link href="/commercial/performance" className="w-full text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                  Voir la performance complète <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE PAR E-COMMERÇANT ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              Performance par e-commerçant
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Suivi par marchand partenaire</p>
          </div>
          <Link href="/commercial/ecommercants" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[540px]">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Marchand</th>
                <th className="px-4 py-3 text-center">Reçues</th>
                <th className="px-4 py-3 text-center">Confirmées</th>
                <th className="px-4 py-3 text-center">Annulées</th>
                <th className="px-4 py-3 text-center">En attente</th>
                <th className="px-4 py-3 text-center">Taux</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partnerPerf.map(({ partner, total, confirmed, cancelled, pending, rate }) => (
                <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        {(partner.companyName || partner.fullName || "MC").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{partner.companyName || partner.fullName}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{partner.category || "E-commerce"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">{total}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-emerald-700">{confirmed}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-slate-500">{cancelled}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-amber-600">{pending}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${rate >= 70 ? "bg-emerald-50 text-emerald-700" : rate >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                      {rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setClosurePartner(partner)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200"
                        title="Bilan Journalier de Clôture"
                      >
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        <span>Bilan Clôture</span>
                      </button>
                      <Link
                        href="/commercial/commandes"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Commandes <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {partnerPerf.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">Aucun e-commerçant enregistré.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIROIR D'AFFECTATION LIVREUR */}
      {assignDrawerOrder && (
        <AssignDriverDrawer
          order={assignDrawerOrder}
          onClose={() => setAssignDrawerOrder(null)}
        />
      )}

      {/* 📄 MODAL BORDEREAU DE CLÔTURE JOURNALIÈRE DU MARCHAND */}
      {closurePartner && (
        <DailyClosureModal
          isOpen={!!closurePartner}
          onClose={() => setClosurePartner(null)}
          partner={closurePartner}
          orders={orders}
        />
      )}
    </div>
  );
}
