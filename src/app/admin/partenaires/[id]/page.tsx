"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
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
  Building2,
  ExternalLink,
  Ban,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Mail,
  MapPin,
  Globe,
  Wallet,
  FileCheck,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Partner, PartnerStatus, Order, PayoutRequest } from "@/lib/types";
import DailyClosureModal from "@/components/DailyClosureModal";

export default function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    partners,
    orders,
    payoutRequests,
    conversations,
    updatePartner,
    suspendPartner,
    reactivatePartner,
  } = useOperations();

  const partner = partners.find((p) => p.id === resolvedParams.id) || partners[0];

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!partner) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-900">Boutique partenaire introuvable.</p>
        <Link href="/admin/partenaires" className="text-xs text-slate-500 hover:underline mt-2 inline-block">
          ← Retour à la liste des e-commerçants
        </Link>
      </div>
    );
  }

  // Merchant orders
  const merchantOrders = orders.filter(
    (o) => o.partnerId === partner.id || o.partnerName === partner.companyName
  );

  // Merchant payouts
  const merchantPayouts = payoutRequests.filter(
    (p) => p.partnerId === partner.id || p.partnerName.toLowerCase().includes(partner.companyName.toLowerCase())
  );

  // Merchant active alerts
  const pendingPayoutTotal = merchantPayouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const deliveredCount = merchantOrders.filter((o) => o.status === "LIVREE").length;
  const completedCount = merchantOrders.filter((o) => ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)).length;
  const realDeliverySuccessRate = completedCount > 0 ? Math.round((deliveredCount / completedCount) * 100) : (partner.deliverySuccessRate || 0);

  const confirmedCount = merchantOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
  const realConfirmationRate = merchantOrders.length > 0 ? Math.round((confirmedCount / merchantOrders.length) * 100) : (partner.confirmationRate || 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const realOrdersToday = merchantOrders.filter((o) => o.createdAt?.startsWith(todayStr)).length;
  const realOrdersMonth = merchantOrders.length > 0 ? merchantOrders.length : (partner.ordersCountMonth || 0);

  const realAvgBasket = merchantOrders.length > 0
    ? Math.round(merchantOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) / merchantOrders.length)
    : 0;

  const returnCount = merchantOrders.filter((o) => ["RETOURNEE", "REFUSEE"].includes(o.status)).length;
  const realReturnRate = completedCount > 0 ? Math.round((returnCount / completedCount) * 100) : 0;

  const realGmv = merchantOrders.filter((o) => o.status === "LIVREE").reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const realDeliveryFees = merchantOrders.filter((o) => o.status === "LIVREE").reduce((sum, o) => sum + (o.deliveryFee || partner.deliveryFeeDefault || 0), 0);
  const realAgencyCommission = merchantOrders.filter((o) => o.status === "LIVREE").reduce((sum, o) => sum + (o.serviceFee || partner.agencyCommissionDefault || 0), 0);
  const realNetPayouts = merchantPayouts.filter((p) => p.status === "PAID" || p.status === "APPROVED").reduce((sum, p) => sum + p.amount, 0);

  const isLowDeliveryRate = realDeliverySuccessRate < 70 && completedCount > 0;
  const isHighBalanceDue = (partner.availableBalance || 0) > 3000000;

  // 7-day activity dynamic data
  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayIso = d.toISOString().slice(0, 10);
    const dayLabel = weekDays[d.getDay()];
    const dayOrders = merchantOrders.filter((o) => o.createdAt?.startsWith(dayIso));
    const dayDelivered = dayOrders.filter((o) => o.status === "LIVREE").length;
    return { day: dayLabel, orders: dayOrders.length, delivered: dayDelivered };
  });
  const maxDayCount = Math.max(...weekActivity.map((w) => w.orders), 1);

  // Timeline events from real orders and payouts
  const timelineEvents = [
    ...merchantOrders.slice(0, 3).map((o) => ({
      time: o.createdAt?.slice(0, 10) || "Récemment",
      text: `Commande ${o.orderNumber} (${o.products || 'Article'}) — ${o.status === "LIVREE" ? "Livrée & Encaissée" : "En cours"}`,
      icon: o.status === "LIVREE" ? CheckCircle2 : Package,
    })),
    ...merchantPayouts.slice(0, 2).map((p) => ({
      time: p.requestedAt?.slice(0, 10) || "Récemment",
      text: `Demande de retrait de ${formatCFA(p.amount)} (${p.status === "PAID" ? "Payée" : "En attente"})`,
      icon: Wallet,
    })),
  ];

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(partner.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleConfirmSuspension = () => {
    suspendPartner(partner.id, suspendReason.trim() || "Suspension administrative par la direction.");
    setShowSuspendModal(false);
    setSuspendReason("");
  };

  const getStatusBadge = (status?: PartnerStatus) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return { label: "À vérifier", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
      case "ONBOARDING":
        return { label: "En onboarding", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" };
      case "INACTIVE":
        return { label: "Inactif", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
      case "SUSPENDED":
        return { label: "Suspendu", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
      case "ACTIVE":
      default:
        return { label: "Actif", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    }
  };

  const badge = getStatusBadge(partner.status);
  return (
    <div className="space-y-6 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/admin/partenaires" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>E-commerçants</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 font-bold">{partner.companyName}</span>
      </div>

      {/* 👑 EXECUTIVE HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            {partner.companyName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {partner.companyName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                <span>{badge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-700">{partner.fullName}</span>
              <span>•</span>
              <span className="font-mono">{partner.phone}</span>
              <span>•</span>
              <span>Inscrit le {partner.createdAt}</span>
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowClosureModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Générer le bordereau de clôture journalière de ce marchand"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Bilan Journalier PDF</span>
          </button>

          <button
            onClick={() => router.push(`/admin/conversations?partner=${partner.id}`)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contacter</span>
          </button>

          <a
            href={`tel:${partner.phone.replace(/\s+/g, "")}`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Appeler</span>
          </a>

          {partner.status === "SUSPENDED" ? (
            <button
              onClick={() => reactivatePartner(partner.id)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              Réactiver
            </button>
          ) : (
            <button
              onClick={() => setShowSuspendModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
            >
              Suspendre
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ SECTION ALERTES D'ATTENTION */}
      {(isHighBalanceDue || isLowDeliveryRate || partner.status === "SUSPENDED" || pendingPayoutTotal > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {isHighBalanceDue && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">Solde important à reverser ({formatCFA(partner.availableBalance || 0)})</span>
                <span className="text-[11px] text-amber-800">Un virement périodique est recommandé pour ce partenaire.</span>
              </div>
            </div>
          )}

          {pendingPayoutTotal > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-2.5 text-purple-950">
              <BadgeDollarSign className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold block">Demande de retrait en cours ({formatCFA(pendingPayoutTotal)})</span>
                <Link href="/admin/finances" className="text-[11px] text-purple-800 underline font-bold">
                  Consulter et valider dans Trésorerie →
                </Link>
              </div>
            </div>
          )}

          {partner.status === "SUSPENDED" && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-950 col-span-1 sm:col-span-2">
              <Ban className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">Boutique actuellement suspendue</span>
                <span className="text-[11px] text-rose-800">{partner.suspensionReason || "Opérations temporairement bloquées par la direction."}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. VUE D'ENSEMBLE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Vue d&apos;ensemble & Volume Opérationnel
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Colis Auj.</span>
                <span className="text-base font-black text-slate-900">{realOrdersToday}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Colis ce mois</span>
                <span className="text-base font-black text-slate-900">{realOrdersMonth}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Taux Confirmation</span>
                <span className="text-base font-black text-slate-900">{realConfirmationRate}%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Taux Livraison</span>
                <span className="text-base font-black text-emerald-700">{realDeliverySuccessRate}%</span>
              </div>
            </div>
          </div>

          {/* 2. PERFORMANCE DE LA BOUTIQUE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Performance de la Boutique
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

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Panier Moyen</span>
                <span className="text-sm font-black font-mono text-slate-900">{formatCFA(realAvgBasket)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Taux de Retour</span>
                <span className="text-sm font-black font-mono text-slate-900">{realReturnRate} %</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Délai Moyen</span>
                <span className="text-sm font-black font-mono text-purple-700">{merchantOrders.length > 0 ? "2h 30m" : "—"}</span>
              </div>
            </div>

            {/* 7-Day Histogram */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Flux des 7 derniers jours</span>
              <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
                {weekActivity.map((w, idx) => {
                  const barHeight = Math.round((w.orders / maxDayCount) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{w.orders}</span>
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
          {/* 3. PARCOURS D'ONBOARDING */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Progression d&apos;Intégration (Onboarding)
              </h3>
              <span className="font-bold text-slate-900 text-xs">
                Étape {partner.onboardingStep || 6} / 6
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px]">
              {[
                { step: 1, label: "Compte créé", done: true },
                { step: 2, label: "Boutique connectée", done: (partner.onboardingStep || 6) >= 2 },
                { step: 3, label: "Conditions acceptées", done: (partner.onboardingStep || 6) >= 3 },
                { step: 4, label: "Paiement configuré", done: (partner.onboardingStep || 6) >= 4 },
                { step: 5, label: "1ère commande", done: (partner.onboardingStep || 6) >= 5 },
                { step: 6, label: "Compte activé", done: (partner.onboardingStep || 6) >= 6 },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    item.done
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="font-bold block">{item.step}. {item.label}</span>
                  <span className="text-[9px] font-black">{item.done ? "✓ Complété" : "En attente"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. COMMANDES RÉCENTES DE LA BOUTIQUE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Commandes Récentes ({merchantOrders.length})
              </h3>
              <Link
                href={`/admin/commandes?merchant=${partner.id}`}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Voir toutes les commandes</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {merchantOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune commande enregistrée pour cette boutique.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {merchantOrders.slice(0, 5).map((ord) => (
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

          {/* 5. RETRAITS RÉCENTS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Demandes de Retrait & Règlements
              </h3>
              <Link
                href="/admin/finances"
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Module Trésorerie</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {merchantPayouts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucun retrait récent enregistré.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {merchantPayouts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{formatCFA(p.amount)}</span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.operator} • {p.phone} • {p.requestedAt}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {p.status === "APPROVED" ? "Payé" : p.status === "PENDING" ? "En attente" : "Refusé"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. HISTORIQUE D'ACTIVITÉ */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Historique des Activités
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
          {/* 1. FINANCES DU MARCHAND */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Trésorerie & Règlements
            </span>

            {/* Solde Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 block">Solde disponible à reverser</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCFA(partner.availableBalance || 0)}
              </span>
              <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                <span>En attente : {formatCFA(partner.pendingBalance || 0)}</span>
                <span>Dernier virement : {partner.lastPayoutDate || "Récemment"}</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Volume total traité (GMV) :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(realGmv)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Frais de livraison déduits :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(realDeliveryFees)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Commission closing agence :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(realAgencyCommission)}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-100 font-bold">
                <span>Net cumulé reversé :</span>
                <span className="font-mono font-black text-emerald-600">
                  {formatCFA(realNetPayouts)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. PARAMÈTRES COMMERCIAUX */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Paramètres Commerciaux
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif Livraison Client :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(partner.deliveryFeeDefault || 2000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commission Agence :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(partner.agencyCommissionDefault || 800)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode de Reversement :</span>
                <span className="font-bold text-slate-800">Mobile Money / USDT</span>
              </div>
            </div>
          </div>

          {/* 3. CONTACT DIRECT */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Coordonnées de la Boutique
            </span>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div>
                <p className="font-bold text-slate-900">{partner.fullName}</p>
                <p className="font-mono text-slate-600">{partner.phone}</p>
                <p className="text-[10px] text-slate-400">{partner.email}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">Adresse de ramassage :</span>
                <span className="font-medium text-slate-800">{partner.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyPhone}
                className="py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-center"
              >
                {copiedPhone ? "Copié !" : "Copier Tel"}
              </button>
              <a
                href={`tel:${partner.phone.replace(/\s+/g, "")}`}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer text-center"
              >
                Appeler
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ MODAL DE SUSPENSION SÉCURISÉE */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Suspendre {partner.companyName} ?</h3>
                <p className="text-xs text-slate-500">Cette action bloquera la création de nouveaux colis.</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Motif de la suspension *</label>
              <textarea
                rows={3}
                placeholder="Indiquez le motif précis de la décision..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Confirmer la Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 MODAL BORDEREAU DE CLÔTURE JOURNALIÈRE */}
      {partner && (
        <DailyClosureModal
          isOpen={showClosureModal}
          onClose={() => setShowClosureModal(false)}
          partner={partner}
          orders={orders}
        />
      )}
    </div>
  );
}
