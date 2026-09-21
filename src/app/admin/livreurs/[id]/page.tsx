"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  Phone,
  MapPin,
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
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { LivreurStatus, Order, DriverCodFinancialSummary } from "@/lib/types";
export default function AdminLivreurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    livreurs,
    orders,
    codCollections,
    codRemittances,
    getDriverCodFunds,
    updateLivreurAvailability,
    updateLivreur,
    reassignLivreurOrders,
  } = useOperations();

  const livreur = livreurs.find((l) => l.id === resolvedParams.id) || livreurs[0];

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTargetLivreurId, setSelectedTargetLivreurId] = useState<string>("");
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneInput, setNewZoneInput] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showFundsDetailModal, setShowFundsDetailModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"OPERATIONS" | "FINANCES">("OPERATIONS");

  if (!livreur) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-slate-900">Livreur introuvable.</p>
        <Link href="/admin/livreurs" className="text-xs text-slate-500 hover:underline mt-2 inline-block">
          ← Retour à la liste de la flotte
        </Link>
      </div>
    );
  }

  // Assigned orders for this driver
  const assignedOrders = orders.filter(
    (o) => o.assignedLivreurId === livreur.id || o.assignedLivreurName === livreur.name
  );
  const activeAssignedOrders = assignedOrders.filter(
    (o) => o.status === "EN_COURS" || o.status === "CONFIRMEE"
  );

  const capacity = livreur.maxActiveCapacity || 8;
  const currentAssigned = activeAssignedOrders.length;
  const remainingCapacity = Math.max(0, capacity - currentAssigned);
  const capacityPercent = Math.min(100, Math.round((currentAssigned / capacity) * 100));

  // Available alternative drivers for reassignment
  const availableAlternatives = livreurs.filter(
    (l) => l.id !== livreur.id && (l.availabilityStatus || "AVAILABLE") === "AVAILABLE"
  );

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(livreur.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneInput.trim()) return;
    const currentZones = livreur.secondaryZones || [];
    updateLivreur(livreur.id, {
      secondaryZones: [...currentZones, newZoneInput.trim()],
    });
    setNewZoneInput("");
    setShowAddZoneModal(false);
  };

  const handleExecuteReassignment = () => {
    if (!selectedTargetLivreurId) return;
    reassignLivreurOrders(livreur.id, selectedTargetLivreurId);
    setShowReassignModal(false);
  };

  const getStatusBadge = (status?: LivreurStatus) => {
    switch (status) {
      case "IN_TRANSIT":
        return { label: "En livraison", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
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

  const badge = getStatusBadge(livreur.availabilityStatus);
  const todayStr = new Date().toISOString().slice(0, 10);
  const deliveredOrders = assignedOrders.filter((o) => o.status === "LIVREE");
  const completedOrders = assignedOrders.filter((o) => ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status));
  const realDeliveredToday = livreur.deliveredTodayCount || deliveredOrders.filter((o) => o.deliveredAt?.startsWith(todayStr) || o.createdAt?.startsWith(todayStr)).length;
  const realDeliveredWeek = livreur.deliveredWeekCount || deliveredOrders.length;
  const realDeliveredMonth = livreur.deliveredMonthCount || deliveredOrders.length;
  const realSuccessRate = completedOrders.length > 0 ? Math.round((deliveredOrders.length / completedOrders.length) * 100) : (livreur.successRate || 0);

  // 7-day delivery activity for chart
  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayIso = d.toISOString().slice(0, 10);
    const dayLabel = weekDays[d.getDay()];
    const count = deliveredOrders.filter((o) => (o.deliveredAt || o.createdAt || "").startsWith(dayIso)).length;
    return { day: dayLabel, count };
  });
  const maxDayCount = Math.max(...weekActivity.map((w) => w.count), 1);

  // Real timeline events from assigned orders and remittances
  const driverRemittances = codRemittances.filter((r) => r.livreurId === livreur.id);
  const timelineEvents = [
    ...assignedOrders.slice(0, 3).map((o) => ({
      time: o.deliveredAt?.slice(0, 10) || o.createdAt?.slice(0, 10) || "Récemment",
      text: `Commande ${o.orderNumber} (${o.products || 'Colis'}) — ${o.status === "LIVREE" ? "Livrée avec succès" : o.status}`,
      icon: o.status === "LIVREE" ? CheckCircle2 : Package,
    })),
    ...driverRemittances.slice(0, 2).map((r) => ({
      time: r.createdAt?.slice(0, 10) || "Récemment",
      text: `Remise COD de ${formatCFA(r.amountDeclared)} (${r.status === "VALIDATED" ? "Validée" : "En attente"})`,
      icon: BadgeDollarSign,
    })),
  ];

  const isAlertActive =
    activeAssignedOrders.length > 0 &&
    (livreur.availabilityStatus === "UNAVAILABLE" || livreur.availabilityStatus === "PAUSED" || livreur.availabilityStatus === "OFFLINE");

  return (
    <div className="space-y-6 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/admin/livreurs" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Flotte Livreurs</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 font-bold">{livreur.name}</span>
      </div>

      {/* 👑 EXECUTIVE HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            {livreur.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {livreur.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                <span>{badge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{livreur.zone}</span>
              <span>•</span>
              <span className="font-mono">{livreur.phone}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={livreur.availabilityStatus || "AVAILABLE"}
            onChange={(e) => updateLivreurAvailability(livreur.id, e.target.value as LivreurStatus)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors cursor-pointer border-none"
          >
            <option value="AVAILABLE">🟢 Disponible</option>
            <option value="IN_TRANSIT">🟡 En livraison</option>
            <option value="PAUSED">🔵 En pause</option>
            <option value="OFFLINE">⚪ Hors ligne</option>
            <option value="UNAVAILABLE">🔴 Indisponible</option>
          </select>

          {activeAssignedOrders.length > 0 && (
            <button
              onClick={() => setShowReassignModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réaffecter ({activeAssignedOrders.length})</span>
            </button>
          )}

          <a
            href={`tel:${livreur.phone.replace(/\s+/g, "")}`}
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
                Attention : Ce coursier possède {activeAssignedOrders.length} commande(s) active(s) alors qu&apos;il est actuellement {badge.label.toLowerCase()}.
              </p>
              <p className="text-amber-800 text-[11px]">
                Pour éviter tout retard de livraison, vous pouvez réaffecter immédiatement ses colis à un livreur disponible.
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

      {/* 📑 NAVIGATION SOUS-ONGLETS */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setActiveSubTab("OPERATIONS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "OPERATIONS"
              ? "bg-slate-900 text-white font-black shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          📦 Opérations & Tournées
        </button>
        <button
          onClick={() => setActiveSubTab("FINANCES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "FINANCES"
              ? "bg-slate-900 text-white font-black shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>💰 Situation & Historique Financier COD</span>
          {(() => {
            const codSummary = getDriverCodFunds(livreur.id);
            if (codSummary.fundsToRemit > 0) {
              return (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {formatCFA(codSummary.fundsToRemit)}
                </span>
              );
            }
            return null;
          })()}
        </button>
      </div>

      {/* 💰 SECTION 1 : SITUATION FINANCIÈRE COD (PARTIE 9) */}
      {(() => {
        const codSummary = getDriverCodFunds(livreur.id);
        const isZero = codSummary.fundsToRemit === 0;
        const isUrgent = codSummary.statusLevel === "URGENT";
        const isAttention = codSummary.statusLevel === "ATTENTION";

        return (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">💰</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Situation Financière COD (Caisse Terrain)
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isZero
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : isUrgent
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : isAttention
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {codSummary.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total COD Collecté</span>
                <p className="text-base font-black font-mono text-slate-900">{formatCFA(codSummary.totalCodCollected)}</p>
                <span className="text-[10px] text-slate-500">Historique global</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Remis & Validé</span>
                <p className="text-base font-black font-mono text-emerald-800">{formatCFA(codSummary.totalFundsRemitted)}</p>
                <span className="text-[10px] text-emerald-700">Validé au coffre</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setShowFundsDetailModal(true)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fonds à Remettre</span>
                  <span className="text-[10px] text-amber-300 font-bold underline">Détail →</span>
                </div>
                <p className={`text-base font-black font-mono ${isUrgent ? "text-rose-400" : "text-amber-400"}`}>
                  {formatCFA(codSummary.fundsToRemit)}
                </p>
                <span className="text-[10px] text-slate-300 block">{codSummary.unremittedOrdersCount} colis non remis</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dernière Remise</span>
                <p className="text-xs font-bold text-slate-900">{codSummary.lastRemittanceDate}</p>
                <span className="text-[10px] text-slate-500">Hub Cadjehoun</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prochaine Échéance</span>
                <p className="text-xs font-bold text-slate-900">{codSummary.nextRemittanceDeadline}</p>
                <span className="text-[10px] text-slate-500">Plafond: {formatCFA(codSummary.ceilingThreshold)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Colis Concernés</span>
                  <p className="text-base font-black font-mono text-slate-900">{codSummary.unremittedOrdersCount} colis</p>
                </div>
                <button
                  onClick={() => setShowFundsDetailModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] cursor-pointer"
                >
                  Voir les colis
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSubTab === "FINANCES" ? (
            /* 📜 ONGLET HISTORIQUE FINANCIER COMPLET (PARTIE 16) */
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-base font-black text-slate-900">Historique Financier du Livreur</h3>
                  <p className="text-xs text-slate-500">Traçabilité inaltérable des encaissements, remises reçues et écarts constatés.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Référence</th>
                      <th className="py-2.5 px-3 text-right">Attendu</th>
                      <th className="py-2.5 px-3 text-right">Reçu / Encaissé</th>
                      <th className="py-2.5 px-3 text-right">Écart</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {codRemittances
                      .filter((r) => r.livreurId === livreur.id)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{r.createdAt}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">Remise Espèces</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.reference}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCFA(r.amountExpected)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{formatCFA(r.amountDeclared)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {r.discrepancyAmount ? (
                              <span className="text-rose-600 font-mono">-{formatCFA(r.discrepancyAmount)}</span>
                            ) : (
                              <span className="text-slate-400">0 GNF</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              r.status === "VALIDATED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}>
                              {r.status === "VALIDATED" ? "Validée" : "En attente"}
                            </span>
                          </td>
                        </tr>
                      ))}

                    {codCollections
                      .filter((c) => c.livreurId === livreur.id)
                      .map((c) => (
                        <tr key={c.orderId} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{c.deliveredAt}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">Encaissement Colis</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.orderNumber}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCFA(c.expectedAmount)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{formatCFA(c.collectedAmount)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {c.discrepancy ? (
                              <span className="text-rose-600 font-mono">{formatCFA(c.discrepancy)}</span>
                            ) : (
                              <span className="text-slate-400">0 GNF</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-800 border-blue-200">
                              {c.collectionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* 1. PROFIL & PARAMÈTRES DE CAPACITÉ */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                    Capacité & Véhicule
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {currentAssigned} / {capacity} commandes actives
                  </span>
                </div>

            {/* Capacity Visual Gauge */}
            <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Capacité utilisée :</span>
                <span className="font-bold text-slate-900">{remainingCapacity} place(s) disponible(s)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${capacityPercent}%` }}
                  className={`h-full rounded-full transition-all ${
                    capacityPercent > 80 ? "bg-rose-500" : capacityPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Véhicule assigné</span>
                <p className="font-bold text-slate-900 mt-0.5">{livreur.vehicle}</p>
                <span className="text-[10px] text-slate-400 font-mono block">Plaque : {livreur.licensePlate || "—"}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-medium">Zones couvertes</span>
                  <button
                    onClick={() => setShowAddZoneModal(true)}
                    className="text-[10px] text-slate-900 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-bold text-[10px]">
                    ★ {livreur.zone}
                  </span>
                  {(livreur.secondaryZones || []).map((z, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px]">
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERFORMANCE ANALYTIQUE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Performance Opérationnelle
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Aujourd&apos;hui</span>
                <span className="text-base font-black text-emerald-700">{realDeliveredToday} livrée{realDeliveredToday > 1 ? "s" : ""}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Cette Semaine</span>
                <span className="text-base font-black text-slate-900">{realDeliveredWeek} colis</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Taux Réussite</span>
                <span className="text-base font-black text-slate-900">{realSuccessRate}%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Temps Moyen</span>
                <span className="text-base font-black text-purple-700">{assignedOrders.length > 0 ? `${livreur.avgDeliveryTimeMinutes || 35} min` : "—"}</span>
              </div>
            </div>

            {/* 7-Day Activity Chart */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Activité des 7 derniers jours</span>
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
          {/* 3. COMMANDES DU LIVREUR */}
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

          {/* 4. HISTORIQUE DU LIVREUR */}
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
            </>
          )}
        </div>
        {/* RIGHT COLUMN (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. COMMISSIONS & RÉMUNÉRATION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Commissions & Revenus
            </span>

            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 block">Commission par livraison</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCFA(livreur.commissionPerDelivery || 1500)}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Gains aujourd&apos;hui :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(realDeliveredToday * (livreur.commissionPerDelivery || 1500))}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Gains cette semaine :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCFA(realDeliveredWeek * (livreur.commissionPerDelivery || 1500))}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                <span>Total ce mois :</span>
                <span className="font-mono font-black text-emerald-600">
                  {formatCFA(realDeliveredMonth * (livreur.commissionPerDelivery || 1500))}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DISPONIBILITÉ & MOTEUR D'ATTRIBUTION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Moteur d&apos;Attribution
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Statut de Dispatch :</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  livreur.availabilityStatus === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                }`}>
                  {livreur.availabilityStatus === "AVAILABLE" ? "Éligible aux colis" : "Exclu du dispatch"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Le moteur intelligent distribue les colis aux coursiers disponibles ayant une capacité restante.
              </p>
            </div>
          </div>

          {/* 3. CONTACT DIRECT */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact Coursier
            </span>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-mono font-bold text-slate-900">{livreur.phone}</p>
                <span className="text-[10px] text-slate-400">{livreur.email}</span>
              </div>
              <button
                onClick={handleCopyPhone}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-[10px] text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedPhone ? "Copié !" : "Copier"}
              </button>
            </div>

            <a
              href={`tel:${livreur.phone.replace(/\s+/g, "")}`}
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
                <p className="text-xs text-slate-500">Transférez les {activeAssignedOrders.length} colis en cours à un autre coursier.</p>
              </div>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Sélectionnez le coursier récepteur :</label>
              {availableAlternatives.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  Aucun autre coursier n&apos;est actuellement disponible sur la zone.
                </p>
              ) : (
                availableAlternatives.map((alt) => {
                  const altCap = alt.maxActiveCapacity || 8;
                  const altRemaining = Math.max(0, altCap - alt.assignedOrdersCount);
                  return (
                    <button
                      key={alt.id}
                      onClick={() => setSelectedTargetLivreurId(alt.id)}
                      className={`w-full p-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${
                        selectedTargetLivreurId === alt.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          selectedTargetLivreurId === alt.id ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                        }`}>
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{alt.name}</h4>
                          <p className={`text-[10px] ${selectedTargetLivreurId === alt.id ? "text-slate-300" : "text-slate-400"}`}>
                            {alt.zone}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold ${
                        selectedTargetLivreurId === alt.id ? "text-emerald-400" : "text-emerald-700"
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
                disabled={!selectedTargetLivreurId}
                onClick={handleExecuteReassignment}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Transférer les Commandes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL AJOUTER UNE ZONE */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Ajouter une Zone</h3>
              <button onClick={() => setShowAddZoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du quartier / Zone</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Haie Vive, Agla, Tankpè..."
                  value={newZoneInput}
                  onChange={(e) => setNewZoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 MODAL DÉTAIL DES FONDS COD À REMETTRE (PARTIE 10) */}
      {showFundsDetailModal && (() => {
        const codSummary = getDriverCodFunds(livreur.id);
        const unremittedList = codCollections.filter(
          (c) => c.livreurId === livreur.id && c.remittanceStatus !== "VALIDATED"
        );

        return (
          <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                    💰
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Fonds COD Détenus — {livreur.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Détail commande par commande des sommes collectées en espèces et restant à remettre.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFundsDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Collecté Historique</span>
                  <p className="text-base font-black font-mono text-slate-900">{formatCFA(codSummary.totalCodCollected)}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Remis et Validé</span>
                  <p className="text-base font-black font-mono text-emerald-800">{formatCFA(codSummary.totalFundsRemitted)}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fonds à Remettre</span>
                  <p className="text-base font-black font-mono text-amber-400">{formatCFA(codSummary.fundsToRemit)}</p>
                </div>
              </div>

              {/* Table breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="py-2.5 px-3">Commande</th>
                      <th className="py-2.5 px-3">E-commerçant</th>
                      <th className="py-2.5 px-3">Date Livraison</th>
                      <th className="py-2.5 px-3 text-right">Attendu</th>
                      <th className="py-2.5 px-3 text-right">Collecté</th>
                      <th className="py-2.5 px-3 text-right">À Remettre</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {unremittedList.map((c) => (
                      <tr key={c.orderId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.orderNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{c.partnerName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{c.deliveredAt}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCFA(c.expectedAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatCFA(c.collectedAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700">{formatCFA(c.collectedAmount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Non Remis
                          </span>
                        </td>
                      </tr>
                    ))}

                    {unremittedList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          Aucun encaissement en attente de remise pour ce coursier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 uppercase text-[10px] tracking-wider text-slate-500">
                        TOTAL FONDS À REMETTRE
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-amber-700 text-sm">
                        {formatCFA(codSummary.fundsToRemit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowFundsDetailModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
