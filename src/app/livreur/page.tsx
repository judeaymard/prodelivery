"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Bike,
  Package,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  AlertTriangle,
  Wallet,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  ChevronRight,
  RefreshCw,
  XCircle,
  RotateCcw,
  Check,
  Send,
  Bell,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order, OrderStatus } from "@/lib/types";

export default function LivreurCommandCenterPage() {
  const {
    orders,
    activeLivreur,
    activeLivreurId,
    markOrderDelivered,
    markOrderFailed,
    updateOrderStatus,
    getDriverCodFunds,
    notifications,
    logActivity,
  } = useOperations();

  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [incidentModalOrder, setIncidentModalOrder] = useState<Order | null>(null);
  const [incidentReason, setIncidentReason] = useState("Client absent");
  const [incidentComment, setIncidentComment] = useState("");
  const [codModalOrder, setCodModalOrder] = useState<Order | null>(null);
  const [codAmountInput, setCodAmountInput] = useState("");

  // Simulation état de chargement initial fluide (pour éviter le clignotement de zéros)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  const triggerToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  // 1. Filtrage strict des commandes réelles assignées au livreur actif
  const driverOrders = useMemo(() => {
    if (!activeLivreur) return [];
    return orders.filter((o) => o.assignedLivreurId === activeLivreur.id);
  }, [orders, activeLivreur]);

  // 2. Livraisons actives du jour (Aujourd'hui & démo)
  const todayOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return driverOrders.filter((o) => {
      const orderDate = (o.createdAt || "").slice(0, 10);
      const isRecent = orderDate === todayStr || orderDate === "2026-09-06" || orderDate === "2026-09-04";
      const isPending = o.status === "CONFIRMEE" || o.status === "EN_COURS";
      return isRecent || isPending;
    });
  }, [driverOrders]);

  // 3. Calculs des métriques "MA JOURNÉE"
  const stats = useMemo(() => {
    const total = todayOrders.length;
    const toTakeCharge = todayOrders.filter((o) => o.status === "CONFIRMEE").length;
    const inTransit = todayOrders.filter((o) => o.status === "EN_COURS").length;
    const completed = todayOrders.filter((o) => o.status === "LIVREE").length;
    const failed = todayOrders.filter((o) => o.status === "REFUSEE" || o.status === "RETOURNEE" || o.status === "ANNULEE").length;
    const remaining = toTakeCharge + inTransit;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      toTakeCharge,
      inTransit,
      completed,
      failed,
      remaining,
      progressPercent,
    };
  }, [todayOrders]);

  // 4. Synthèse financière COD réelle
  const codSummary = useMemo(() => {
    if (!activeLivreur) {
      return {
        expected: 0,
        collected: 0,
        fundsToRemit: 0,
        remitted: 0,
      };
    }
    const funds = getDriverCodFunds(activeLivreur.id);

    // Montant total attendu sur les commandes en cours
    const pendingCodExpected = todayOrders
      .filter((o) => o.status === "EN_COURS" || o.status === "CONFIRMEE")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Montant déjà encaissé aujourd'hui sur les livrées
    const todayCollected = todayOrders
      .filter((o) => o.status === "LIVREE" && o.codCollected)
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    return {
      expected: pendingCodExpected + todayCollected,
      collected: todayCollected,
      fundsToRemit: funds.fundsToRemit,
      remitted: funds.totalFundsRemitted,
      statusLabel: funds.statusLabel,
      statusLevel: funds.statusLevel,
    };
  }, [activeLivreur, getDriverCodFunds, todayOrders]);

  // 5. Identification de la PROCHAINE LIVRAISON prioritaire
  const nextDelivery = useMemo(() => {
    // Priorité 1 : Colis déjà "EN_COURS"
    const inProgress = todayOrders.find((o) => o.status === "EN_COURS");
    if (inProgress) return inProgress;

    // Priorité 2 : Colis "CONFIRMEE" prêts à prendre en charge
    const ready = todayOrders.find((o) => o.status === "CONFIRMEE");
    if (ready) return ready;

    return null;
  }, [todayOrders]);

  // 6. Autres livraisons du jour (hors livraison mise en avant)
  const otherDeliveries = useMemo(() => {
    if (!nextDelivery) return todayOrders;
    return todayOrders.filter((o) => o.id !== nextDelivery.id);
  }, [todayOrders, nextDelivery]);

  // 7. Actions opérationnelles réelles
  const handleTakeCharge = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `Colis pris en charge au hub par ${activeLivreur?.name}.`);
    logActivity({
      type: "ORDER_CREATED",
      title: "Colis pris en charge",
      description: `${order.orderNumber} pris en charge par ${activeLivreur?.name} (${activeLivreur?.zone})`,
      orderNumber: order.orderNumber,
      partnerName: order.partnerName,
      amount: order.totalPrice,
    });
    triggerToast(`Colis ${order.orderNumber} pris en charge avec succès !`);
  };

  const handleStartDelivery = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `Coursier en route vers ${order.clientName} (${order.city || order.region}).`);
    triggerToast(`Tournée démarrée vers ${order.clientName}. Bonne route !`);
  };

  const handleConfirmArrival = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `Arrivé chez le client (${order.address || order.city}).`);
    triggerToast(`Arrivée confirmée chez ${order.clientName}. Préparez le colis !`);
  };

  const handleConfirmDelivery = (order: Order) => {
    // Ouvrir la modal de confirmation d'encaissement COD
    setCodModalOrder(order);
    setCodAmountInput(String(order.totalPrice || 0));
  };

  const submitDeliveryAndCod = () => {
    if (!codModalOrder) return;
    markOrderDelivered(codModalOrder.id);
    triggerToast(`✅ ${codModalOrder.orderNumber} marquée comme LIVRÉE & ${formatCFA(Number(codAmountInput) || codModalOrder.totalPrice)} encaissés !`);
    setCodModalOrder(null);
  };

  const submitIncidentReport = () => {
    if (!incidentModalOrder) return;
    const fullReason = `${incidentReason}${incidentComment ? ` : ${incidentComment}` : ""}`;
    markOrderFailed(incidentModalOrder.id, fullReason);
    triggerToast(`⚠️ Incident signalé pour ${incidentModalOrder.orderNumber}. L'équipe commerciale est alertée.`);
    setIncidentModalOrder(null);
    setIncidentComment("");
  };

  const handleCallClient = (phone?: string) => {
    if (!phone) return;
    window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self");
  };

  const handleNavigate = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}, Guinée`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  // Messages dynamiques d'accueil
  const firstName = activeLivreur?.name?.split(" ")[0] || "Coursier";
  const greetingSubtitle = useMemo(() => {
    if (stats.remaining === 0 && stats.completed > 0) {
      return "Toutes vos livraisons sont terminées. Excellent travail ! 🎉";
    }
    if (stats.remaining > 0) {
      return `Vous avez ${stats.remaining} course${stats.remaining > 1 ? "s" : ""} à finaliser aujourd'hui.`;
    }
    return "Aucune livraison assignée pour l'instant. Tenez-vous prêt !";
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48" />
        <div className="h-28 bg-white border border-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Toast de confirmation d'action */}
      {actionSuccessToast && (
        <div className="fixed top-16 md:top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION IDENTITÉ & EN-TÊTE ACCUEIL                          */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <Bike className="w-3 h-3 text-emerald-600" />
            <span>Secteur : {activeLivreur?.zone || "Conakry"}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{todayFormatted} — {greetingSubtitle}</p>
        </div>

        {/* Accès Rapide & Taux de réussite */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-right">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Succès Livraisons</span>
            <p className="text-sm font-black text-emerald-600 leading-tight">
              {activeLivreur?.successRate ? `${activeLivreur.successRate}%` : "0%"}
            </p>
          </div>

          <Link
            href="/livreur/cod"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Remises COD</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION MA JOURNÉE — COMPTEURS & PROGRESSION                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Ma Journée de Livraison
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Progression des courses confiées</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            {stats.completed} / {stats.total} livrées ({stats.progressPercent}%)
          </span>
        </div>

        {/* Barre de Progression standard GuinéeGo LAT */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>

        {/* Cartes Métriques Réelles (Design standard GuinéeGo LAT KPI) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-600">Total Courses</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <span className="text-[10px] text-slate-500 font-semibold">colis</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-blue-700">En Cours</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-blue-800">{stats.inTransit}</span>
              <span className="text-[10px] text-blue-600/80 font-semibold">sur la route</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-700">Livrées</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-emerald-800">{stats.completed}</span>
              <span className="text-[10px] text-emerald-600/80 font-semibold">terminées</span>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-700">Restantes</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-amber-800">{stats.remaining}</span>
              <span className="text-[10px] text-amber-600/80 font-semibold">à faire</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION COD DU JOUR & CAISSE                                 */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">COD du Jour & Caisse</h3>
              <p className="text-[11px] text-slate-500">Montants encaissés et état de versement</p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {codSummary.statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Attendu aujourd'hui</span>
            <p className="text-lg font-black text-slate-900 mt-0.5 truncate whitespace-nowrap">
              {formatCFA(codSummary.expected)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Encaissé par vous</span>
            <p className="text-lg font-black text-emerald-700 mt-0.5 truncate whitespace-nowrap">
              {formatCFA(codSummary.collected)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Fonds à verser</span>
              <p className="text-lg font-black text-emerald-800 mt-0.5 truncate whitespace-nowrap">
                {formatCFA(codSummary.fundsToRemit)}
              </p>
            </div>
            <Link
              href="/livreur/cod"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 shadow-xs whitespace-nowrap"
            >
              Verser
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION PROCHAINE LIVRAISON PRIORITAIRE                     */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">Prochaine Livraison Prioritaire</h2>
          </div>
          {nextDelivery && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {nextDelivery.status === "CONFIRMEE" ? "À PRENDRE EN CHARGE" : "EN COURS DE ROUTE"}
            </span>
          )}
        </div>

        {nextDelivery ? (
          <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
            {/* Header Commande & Montant */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900">{nextDelivery.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {nextDelivery.partnerName || "Marchand"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {nextDelivery.clientName}
                </h3>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">COD à encaisser</span>
                <p className="text-xl font-black text-emerald-700 leading-tight">
                  {formatCFA(nextDelivery.totalPrice)}
                </p>
                {nextDelivery.deliveryTimeSlot && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-0.5">
                    <Clock className="w-3 h-3" />
                    {nextDelivery.deliveryTimeSlot}
                  </span>
                )}
              </div>
            </div>

            {/* Détails Adresse & Téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Adresse de livraison :</span>
                </div>
                <p className="text-slate-800 font-semibold pl-5">
                  {nextDelivery.address || "Adresse indiquée par le client"}, {nextDelivery.city || nextDelivery.region}
                </p>
                {nextDelivery.availabilityLocation && (
                  <p className="text-slate-500 text-[11px] pl-5 italic">
                    Repère : {nextDelivery.availabilityLocation}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Colis à livrer :</span>
                </div>
                <p className="text-slate-800 font-semibold pl-5">
                  {nextDelivery.products} (Qté : {nextDelivery.quantity || 1})
                </p>
                {nextDelivery.comment && (
                  <p className="text-amber-800 text-[11px] pl-5">
                    Note : {nextDelivery.comment}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons d'Action Terrains Rapides (Appel + GPS) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCallClient(nextDelivery.clientPhone)}
                className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Appeler {nextDelivery.clientPhone}</span>
              </button>

              <button
                onClick={() => handleNavigate(nextDelivery.address, nextDelivery.city || nextDelivery.region)}
                className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Ouvrir GPS</span>
              </button>
            </div>

            {/* ============================================================ */}
            {/* ACTION PRINCIPALE DU WORKFLOW OPÉRATIONNEL                  */}
            {/* ============================================================ */}
            <div className="pt-1">
              {nextDelivery.status === "CONFIRMEE" && (
                <button
                  onClick={() => handleTakeCharge(nextDelivery)}
                  className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>PRENDRE EN CHARGE CE COLIS</span>
                </button>
              )}

              {nextDelivery.status === "EN_COURS" && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStartDelivery(nextDelivery)}
                      className="py-2.5 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Bike className="w-4 h-4 text-blue-600" />
                      <span>En route</span>
                    </button>

                    <button
                      onClick={() => handleConfirmArrival(nextDelivery)}
                      className="py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Arrivé sur place</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleConfirmDelivery(nextDelivery)}
                      className="sm:col-span-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>LIVRER & ENCAISSER LE COD ({formatCFA(nextDelivery.totalPrice)})</span>
                    </button>

                    <button
                      onClick={() => setIncidentModalOrder(nextDelivery)}
                      className="py-3 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Signaler échec</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State Conforme Standard GuinéeGo LAT */
          <div className="bg-white border border-dashed border-slate-300 p-8 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Aucune livraison en attente</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vous avez complété vos livraisons en cours. Les nouvelles affectations apparaîtront ici dès assignation par l'équipe commerciale.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION ACCÈS RAPIDES                                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/livreur/livraisons"
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-col items-center text-center gap-2 transition-colors group shadow-xs cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">Mes livraisons</span>
            <span className="text-[10px] text-slate-500">{todayOrders.length} aujourd'hui</span>
          </div>
        </Link>

        <Link
          href="/livreur/cod"
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-col items-center text-center gap-2 transition-colors group shadow-xs cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">Collectes / COD</span>
            <span className="text-[10px] text-slate-500">{formatCFA(codSummary.fundsToRemit)} à verser</span>
          </div>
        </Link>

        <Link
          href="/livreur/incidents"
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-col items-center text-center gap-2 transition-colors group shadow-xs cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">Signaler incident</span>
            <span className="text-[10px] text-slate-500">Échec ou refus</span>
          </div>
        </Link>

        <Link
          href="/livreur/notifications"
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-col items-center text-center gap-2 transition-colors group shadow-xs cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">Notifications</span>
            <span className="text-[10px] text-slate-500">Alertes & missions</span>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* LISTE DES AUTRES LIVRAISONS DU JOUR                         */}
      {/* ============================================================ */}
      {otherDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Autres Courses du Jour ({otherDeliveries.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Commandes attribuées pour la tournée</p>
            </div>
            <Link href="/livreur/livraisons" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors">
              <span>Tout afficher</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {otherDeliveries.map((order) => {
              const isDelivered = order.status === "LIVREE";
              const isFailed = order.status === "REFUSEE" || order.status === "RETOURNEE" || order.status === "ANNULEE";
              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDelivered
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isFailed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {order.status === "CONFIRMEE"
                          ? "À prendre en charge"
                          : order.status === "EN_COURS"
                          ? "En cours"
                          : order.status === "LIVREE"
                          ? "Livrée"
                          : "Échec"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{order.clientName}</p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span>{order.address}, {order.city || order.region}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-extrabold">Montant COD</span>
                      <p className="text-sm font-black text-slate-900">{formatCFA(order.totalPrice)}</p>
                    </div>

                    {!isDelivered && !isFailed && (
                      <button
                        onClick={() => handleTakeCharge(order)}
                        className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Traiter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL ENCAISSEMENT COD & CONFIRMATION DE LIVRAISON            */}
      {/* ============================================================ */}
      {codModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Confirmation de Livraison</h3>
              </div>
              <button
                onClick={() => setCodModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p className="text-slate-600">
                Commande : <strong className="text-slate-900">{codModalOrder.orderNumber}</strong>
              </p>
              <p className="text-slate-600">
                Client : <strong className="text-slate-900">{codModalOrder.clientName}</strong>
              </p>
              <p className="text-slate-600">
                Produit : <strong className="text-slate-900">{codModalOrder.products}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Montant COD Encaissé en Espèces (GNF)</label>
              <input
                type="number"
                value={codAmountInput}
                onChange={(e) => setCodAmountInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-lg font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Montant attendu : {formatCFA(codModalOrder.totalPrice)}. Recomptez les espèces remises par le destinataire.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setCodModalOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={submitDeliveryAndCod}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirmer encaissement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL SIGNALEMENT D'INCIDENT / ÉCHEC                         */}
      {/* ============================================================ */}
      {incidentModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Signaler un Échec de Livraison</h3>
              </div>
              <button
                onClick={() => setIncidentModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Motif standard d'échec</label>
              <select
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              >
                <option value="Client absent">Client absent au rendez-vous</option>
                <option value="Client injoignable">Client injoignable au téléphone</option>
                <option value="Adresse introuvable">Adresse erronée / introuvable</option>
                <option value="Refus du colis">Refus du client (prix / non conforme)</option>
                <option value="Client sans espèces">Fonds insuffisants / pas d'espèces</option>
                <option value="Report demandé">Client demande un report ultérieur</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Commentaire explicatif (facultatif)</label>
              <textarea
                value={incidentComment}
                onChange={(e) => setIncidentComment(e.target.value)}
                placeholder="Précisez le motif pour permettre à la closeuse de relancer..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIncidentModalOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={submitIncidentReport}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enregistrer l'échec</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
