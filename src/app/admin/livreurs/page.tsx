"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  PowerOff,
  MoreVertical,
  MapPin,
  TrendingUp,
  Package,
  Phone,
  Shield,
  X,
  ChevronRight,
  Sparkles,
  DollarSign,
  Layers,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { LivreurProfile, LivreurStatus, DriverCodFinancialSummary } from "@/lib/types";
export default function AdminLivreursPage() {
  const router = useRouter();
  const { livreurs, orders, addLivreur, updateLivreurAvailability, getDriverCodFunds, codCollections } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [selectedDriverFundsModal, setSelectedDriverFundsModal] = useState<DriverCodFinancialSummary | null>(null);

  // Form state for adding driver
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+229 01 ");
  const [newEmail, setNewEmail] = useState("");
  const [newZone, setNewZone] = useState("Conakry Centre");
  const [newSecondaryZones, setNewSecondaryZones] = useState("Akpakpa, Cadjehoun");
  const [newVehicle, setNewVehicle] = useState("Moto Yamaha YB-125");
  const [newPlate, setNewPlate] = useState("RB-0000-XX");
  const [newCapacity, setNewCapacity] = useState("8");
  const [newCommission, setNewCommission] = useState("1500");
  const [newStatus, setNewStatus] = useState<LivreurStatus>("AVAILABLE");

  // Filtered drivers
  const filteredLivreurs = useMemo(() => {
    return livreurs.filter((l) => {
      const status = l.availabilityStatus || "AVAILABLE";

      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && !l.isActive) return false;
        if (statusFilter !== "ACTIVE" && status !== statusFilter) return false;
      }

      if (zoneFilter !== "ALL" && !l.zone.toLowerCase().includes(zoneFilter.toLowerCase())) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchPhone = l.phone.includes(q);
        const matchZone = l.zone.toLowerCase().includes(q);
        return matchName || matchPhone || matchZone;
      }

      return true;
    });
  }, [livreurs, statusFilter, zoneFilter, searchTerm]);

  // Compute Fleet KPIs
  const totalDrivers = livreurs.length;
  const availableNow = livreurs.filter((l) => (l.availabilityStatus || "AVAILABLE") === "AVAILABLE").length;
  const inTransitCount = livreurs.filter((l) => l.availabilityStatus === "IN_TRANSIT").length;
  const unavailableCount = livreurs.filter((l) => l.availabilityStatus === "PAUSED" || l.availabilityStatus === "OFFLINE" || l.availabilityStatus === "UNAVAILABLE").length;
  const activeOrdersCount = orders.filter((o) => o.status === "EN_COURS").length;
  const deliveredCount = orders.filter((o) => o.status === "LIVREE").length;
  const completedCount = orders.filter((o) => ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)).length;
  const fleetSuccessRate = completedCount > 0 ? `${Math.round((deliveredCount / completedCount) * 100)} %` : "0 %";
  const pendingCommissions = livreurs.reduce(
    (sum, l) => sum + ((l.commissionPerDelivery || 0) * (l.deliveredTodayCount || 0)),
    0
  );
  const handleCreateLivreur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName || !newPhone) return;

    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    addLivreur({
      name: fullName,
      email: newEmail || `${newLastName.toLowerCase()}@guineego.com`,
      phone: newPhone,
      zone: newZone,
      secondaryZones: newSecondaryZones.split(",").map((s) => s.trim()).filter(Boolean),
      vehicle: newVehicle,
      licensePlate: newPlate,
      maxActiveCapacity: parseInt(newCapacity) || 8,
      commissionPerDelivery: parseInt(newCommission) || 1500,
      availabilityStatus: newStatus,
    });

    setShowAddModal(false);
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("+229 01 ");
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

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Nom,Téléphone,Zone,Statut,Capacité,Taux Réussite,Gains"].join(",") +
      "\n" +
      livreurs
        .map((l) =>
          [
            `"${l.name}"`,
            `"${l.phone}"`,
            `"${l.zone}"`,
            `"${l.availabilityStatus || "AVAILABLE"}"`,
            `"${l.assignedOrdersCount}/${l.maxActiveCapacity || 8}"`,
            `"${l.successRate || 0}%"`,
            `"${(l.deliveredTodayCount || 0) * (l.commissionPerDelivery || 1500)} GNF"`,
          ].join(",")
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `flotte_livreurs_guineego_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Flotte Livreurs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez votre équipe de livraison, leurs disponibilités, leurs performances et leurs affectations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un livreur</span>
          </button>
        </div>
      </div>

      {/* 📊 2. KPI DE LA FLOTTE (7 KPI Strip) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Livreurs Actifs</span>
          <span className="text-lg font-black text-slate-900">{totalDrivers}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Disponibles</span>
          <span className="text-lg font-black text-emerald-600">{availableNow}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">En Livraison</span>
          <span className="text-lg font-black text-amber-600">{inTransitCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Indisponibles</span>
          <span className="text-lg font-black text-slate-700">{unavailableCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Colis en Cours</span>
          <span className="text-lg font-black text-purple-600">{activeOrdersCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Taux Réussite</span>
          <span className="text-lg font-black text-slate-900">{fleetSuccessRate}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Commissions</span>
          <span className="text-sm font-black font-mono text-slate-900">{formatCFA(pendingCommissions)}</span>
        </div>
      </div>
      {/* 🟢 3. ÉTAT DE LA FLOTTE EN TEMPS RÉEL */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">État de la flotte en temps réel</h2>
            <p className="text-xs text-slate-500">Aperçu direct de la disponibilité et de la charge active sur le terrain.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Actualisé en continu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {livreurs.map((l) => {
            const badge = getStatusBadge(l.availabilityStatus);
            const capacity = l.maxActiveCapacity || 8;
            const current = l.assignedOrdersCount;
            const percent = Math.min(100, Math.round((current / capacity) * 100));

            return (
              <div
                key={l.id}
                onClick={() => router.push(`/admin/livreurs/${l.id}`)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {l.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:underline">{l.name}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{l.zone}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Charge :</span>
                    <span className="font-mono font-bold text-slate-800">
                      {current} / {capacity} commandes
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all ${
                        percent > 80 ? "bg-rose-500" : percent > 50 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    ></div>
                  </div>
                </div>

                {/* 💰 Fonds COD à remettre (Source Unique de Vérité) */}
                {(() => {
                  const codSummary = getDriverCodFunds(l.id);
                  const isZero = codSummary.fundsToRemit === 0;
                  const isUrgent = codSummary.statusLevel === "URGENT";
                  const isAttention = codSummary.statusLevel === "ATTENTION";

                  return (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Fonds COD à remettre</span>
                        <p className={`text-xs font-black font-mono ${isUrgent ? "text-rose-700" : isAttention ? "text-amber-700" : isZero ? "text-emerald-700" : "text-slate-900"}`}>
                          {formatCFA(codSummary.fundsToRemit)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDriverFundsModal(codSummary);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          isZero
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isUrgent
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : isAttention
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {codSummary.statusLabel}
                      </button>
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Dernière activité :</span>
                  <span className="font-medium text-slate-600">{l.lastActivityAt || "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔍 4. BARRE DE RECHERCHE & FILTRES RAPIDES */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un livreur, téléphone ou zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "AVAILABLE", label: "Disponibles" },
            { id: "IN_TRANSIT", label: "En livraison" },
            { id: "PAUSED", label: "En pause" },
            { id: "OFFLINE", label: "Hors ligne" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white font-black shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
      {/* 📋 5. TABLEAU DES LIVREURS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Livreur</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5">Zone Principale</th>
                <th className="py-3.5 px-5">Commandes Actives</th>
                <th className="py-3.5 px-5">Livraisons Aujourd&apos;hui</th>
                <th className="py-3.5 px-5">Taux Réussite</th>
                <th className="py-3.5 px-5 text-right">💰 Fonds COD à Remettre</th>
                <th className="py-3.5 px-5">Commissions</th>
                <th className="py-3.5 px-5">Dernière Activité</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLivreurs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    Aucun livreur ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredLivreurs.map((liv) => {
                  const badge = getStatusBadge(liv.availabilityStatus);
                  const capacity = liv.maxActiveCapacity || 8;
                  const commissionToday = (liv.deliveredTodayCount || 0) * (liv.commissionPerDelivery || 1500);
                  const codSummary = getDriverCodFunds(liv.id);
                  const isZero = codSummary.fundsToRemit === 0;
                  const isUrgent = codSummary.statusLevel === "URGENT";
                  const isAttention = codSummary.statusLevel === "ATTENTION";

                  return (
                    <tr
                      key={liv.id}
                      onClick={() => router.push(`/admin/livreurs/${liv.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {liv.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:underline">{liv.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{liv.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-800">{liv.zone}</span>
                        {liv.secondaryZones && liv.secondaryZones.length > 0 && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            +{liv.secondaryZones.join(", ")}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono">
                        <span className="font-bold text-slate-900">{liv.assignedOrdersCount}</span>
                        <span className="text-slate-400"> / {capacity} max</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-emerald-700">{liv.deliveredTodayCount} livrées</span>
                        <span className="text-[10px] text-slate-400 block">{liv.failedTodayCount || 0} échec</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {liv.successRate || 0}%
                      </td>

                      {/* 💰 Fonds COD à Remettre */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => setSelectedDriverFundsModal(codSummary)}
                            className={`font-mono font-black text-sm hover:underline cursor-pointer ${
                              isUrgent ? "text-rose-700" : isAttention ? "text-amber-700" : isZero ? "text-emerald-700" : "text-slate-900"
                            }`}
                          >
                            {formatCFA(codSummary.fundsToRemit)}
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
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
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {formatCFA(commissionToday)}
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                        {liv.lastActivityAt || "—"}
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpenId(actionMenuOpenId === liv.id ? null : liv.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === liv.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-20 text-xs">
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  router.push(`/admin/livreurs/${liv.id}`);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                Voir fiche détaillée
                              </button>
                              <button
                                onClick={() => {
                                  updateLivreurAvailability(liv.id, liv.availabilityStatus === "AVAILABLE" ? "PAUSED" : "AVAILABLE");
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                {liv.availabilityStatus === "AVAILABLE" ? "Mettre en pause" : "Rendre disponible"}
                              </button>
                              <a
                                href={`tel:${liv.phone.replace(/\s+/g, "")}`}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800 block"
                              >
                                Appeler le coursier
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredLivreurs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Aucun coursier trouvé.</div>
          ) : (
            filteredLivreurs.map((liv) => {
              const badge = getStatusBadge(liv.availabilityStatus);
              const capacity = liv.maxActiveCapacity || 8;
              return (
                <div
                  key={liv.id}
                  onClick={() => router.push(`/admin/livreurs/${liv.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {liv.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{liv.name}</h4>
                        <p className="text-[10px] text-slate-400">{liv.zone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Charge</span>
                      <span className="font-bold text-slate-900">{liv.assignedOrdersCount} / {capacity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Livrées auj.</span>
                      <span className="font-bold text-emerald-700">{liv.deliveredTodayCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Taux</span>
                      <span className="font-bold text-slate-900">{liv.successRate || 0}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* 📝 MODAL + AJOUTER UN LIVREUR */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">Ajouter un Nouveau Livreur</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLivreur} className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Informations Personnelles
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                    <input
                      type="text"
                      placeholder="Ex: David"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: KOUASSI"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email professionnel</label>
                    <input
                      type="email"
                      placeholder="Ex: david.k@guineego.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Informations Professionnelles
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Zone Principale</label>
                    <select
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                    >
                      <option value="Conakry Centre">Conakry Centre</option>
                      <option value="Conakry Nord">Conakry Nord</option>
                      <option value="Conakry Littoral">Conakry Littoral</option>
                      <option value="Abomey-Kankan">Abomey-Kankan</option>
                      <option value="Mamou">Mamou</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Zones Secondaires</label>
                    <input
                      type="text"
                      placeholder="Ex: Akpakpa, Cadjehoun"
                      value={newSecondaryZones}
                      onChange={(e) => setNewSecondaryZones(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Type de Véhicule</label>
                    <input
                      type="text"
                      placeholder="Ex: Moto Yamaha YB-125"
                      value={newVehicle}
                      onChange={(e) => setNewVehicle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Immatriculation</label>
                    <input
                      type="text"
                      placeholder="Ex: RB-4589-AF"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Capacité Max (Colis)</label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Commission / Livraison (GNF)</label>
                    <input
                      type="number"
                      value={newCommission}
                      onChange={(e) => setNewCommission(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block mb-1">Disponibilité Initiale</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LivreurStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="AVAILABLE">🟢 Disponible</option>
                  <option value="UNAVAILABLE">🔴 Indisponible</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Créer le Livreur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 MODAL: DÉTAIL DES FONDS COD À REMETTRE (PARTIE 10) */}
      {selectedDriverFundsModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                  💰
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Fonds COD à Remettre — {selectedDriverFundsModal.livreurName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Traçabilité exacte des encaissements sur colis livrés non encore validés en caisse.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverFundsModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Collecté Historique</span>
                <p className="text-base font-black font-mono text-slate-900">{formatCFA(selectedDriverFundsModal.totalCodCollected)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Remis et Validé</span>
                <p className="text-base font-black font-mono text-emerald-800">{formatCFA(selectedDriverFundsModal.totalFundsRemitted)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fonds à Remettre</span>
                <p className={`text-base font-black font-mono ${selectedDriverFundsModal.statusLevel === "URGENT" ? "text-rose-400" : "text-amber-400"}`}>
                  {formatCFA(selectedDriverFundsModal.fundsToRemit)}
                </p>
              </div>
            </div>

            {/* Order breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Colis concernés ({selectedDriverFundsModal.unremittedOrdersCount})
              </h4>

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
                    {codCollections
                      .filter(
                        (c) =>
                          c.livreurId === selectedDriverFundsModal.livreurId &&
                          c.remittanceStatus !== "VALIDATED"
                      )
                      .map((c) => (
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

                    {codCollections.filter(
                      (c) =>
                        c.livreurId === selectedDriverFundsModal.livreurId &&
                        c.remittanceStatus !== "VALIDATED"
                    ).length === 0 && (
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
                        {formatCFA(selectedDriverFundsModal.fundsToRemit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDriverFundsModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
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
