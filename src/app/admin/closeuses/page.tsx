"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headset,
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
  MessageSquare,
  Globe,
  Layers,
  Award,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { CloseuseProfile, CloseuseStatus } from "@/lib/types";
export default function AdminCloseusesPage() {
  const router = useRouter();
  const { closeuses, orders, conversations, addCloseuse, updateCloserAvailability } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Form state for adding closeuse
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+229 01 ");
  const [newEmail, setNewEmail] = useState("");
  const [newLanguages, setNewLanguages] = useState("Français, Fon, Yoruba");
  const [newZones, setNewZones] = useState("Conakry, Kankan");
  const [newSkills, setNewSkills] = useState("High-Ticket, Cosmétique");
  const [newMaxOrders, setNewMaxOrders] = useState("15");
  const [newMaxConvs, setNewMaxConvs] = useState("5");
  const [newCommission, setNewCommission] = useState("750");
  const [newStatus, setNewStatus] = useState<CloseuseStatus>("AVAILABLE");

  // Helper: compute active load for a closer
  const getCloserActiveOrders = (closerId: string, closerName: string) => {
    return orders.filter(
      (o) =>
        (o.assignedCloseuseId === closerId || o.assignedCloseuseName === closerName) &&
        (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || o.status === "CONFIRMEE")
    ).length;
  };

  const getCloserPendingConfirmation = (closerId: string, closerName: string) => {
    return orders.filter(
      (o) =>
        (o.assignedCloseuseId === closerId || o.assignedCloseuseName === closerName) &&
        (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER")
    ).length;
  };

  const getCloserActiveConversations = (closerName: string) => {
    return conversations.filter((c) => c.assignedAgentName === closerName && c.status === "IN_PROGRESS").length;
  };

  // Filtered closeuses
  const filteredCloseuses = useMemo(() => {
    return closeuses.filter((c) => {
      const status = c.availabilityStatus || "AVAILABLE";

      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && !c.isActive) return false;
        if (statusFilter !== "ACTIVE" && status !== statusFilter) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = (c.email || "").toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail;
      }

      return true;
    });
  }, [closeuses, statusFilter, searchTerm]);

  // Compute 7 KPIs
  const totalCloseuses = closeuses.length;
  const availableNow = closeuses.filter((c) => (c.availabilityStatus || "AVAILABLE") === "AVAILABLE").length;
  const busyCount = closeuses.filter((c) => c.availabilityStatus === "BUSY").length;
  const totalActiveOrders = closeuses.reduce((sum, c) => sum + getCloserActiveOrders(c.id, c.name), 0);
  const totalCapacity = closeuses.reduce((sum, c) => sum + (c.maxActiveOrders || 15), 0);
  const avgLoad = totalCapacity > 0 ? `${Math.round((totalActiveOrders / totalCapacity) * 100)} %` : "0 %";
  const toConfirmCount = orders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER").length;
  const confirmedCount = orders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
  const confirmationRate = orders.length > 0 ? `${Math.round((confirmedCount / orders.length) * 100)} %` : "0 %";
  const totalCommissions = closeuses.reduce((sum, c) => sum + ((c.confirmedTodayCount || 0) * (c.commissionPerConfirmation || 750)), 0);
  const handleCreateCloseuse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName || !newPhone) return;

    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    addCloseuse({
      name: fullName,
      email: newEmail || `${newLastName.toLowerCase()}@guineego.com`,
      phone: newPhone,
      languages: newLanguages.split(",").map((s) => s.trim()).filter(Boolean),
      zones: newZones.split(",").map((s) => s.trim()).filter(Boolean),
      skills: newSkills.split(",").map((s) => s.trim()).filter(Boolean),
      maxActiveOrders: parseInt(newMaxOrders) || 15,
      maxActiveConversations: parseInt(newMaxConvs) || 5,
      commissionPerConfirmation: parseInt(newCommission) || 750,
      availabilityStatus: newStatus,
    });

    setShowAddModal(false);
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("+229 01 ");
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

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Nom,Téléphone,Statut,Charge,Confirmations Aujourd'hui,Taux,Commissions"].join(",") +
      "\n" +
      closeuses
        .map((c) =>
          [
            `"${c.name}"`,
            `"${c.phone}"`,
            `"${c.availabilityStatus || "AVAILABLE"}"`,
            `"${getCloserActiveOrders(c.id, c.name)}/${c.maxActiveOrders || 15}"`,
            `"${c.confirmedTodayCount || 0}"`,
            `"${c.conversionRate || 80}%"`,
            `"${(c.confirmedTodayCount || 0) * (c.commissionPerConfirmation || 750)} GNF"`,
          ].join(",")
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `closeuses_guineego_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Closeuses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez votre équipe de confirmation, leurs disponibilités, leurs performances et leur charge de travail.
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
            <span>Ajouter une closeuse</span>
          </button>
        </div>
      </div>

      {/* 📊 2. KPI STRIP (7 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Closeuses Actives</span>
          <span className="text-lg font-black text-slate-900">{totalCloseuses}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Disponibles</span>
          <span className="text-lg font-black text-emerald-600">{availableNow}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">En Discussion</span>
          <span className="text-lg font-black text-amber-600">{busyCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Charge Moyenne</span>
          <span className="text-lg font-black text-slate-900">{avgLoad}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">À Confirmer</span>
          <span className="text-lg font-black text-purple-600">{toConfirmCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Taux Confir.</span>
          <span className="text-lg font-black text-emerald-700">{confirmationRate}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Commissions</span>
          <span className="text-sm font-black font-mono text-slate-900">{formatCFA(totalCommissions)}</span>
        </div>
      </div>
      {/* 🟢 3. ÉTAT DE L'ÉQUIPE EN TEMPS RÉEL */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">État de l&apos;équipe en temps réel</h2>
            <p className="text-xs text-slate-500">Supervision directe de la charge de travail et des flux de confirmation.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Capacité Standard : 15 colis / agent</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {closeuses.map((c) => {
            const badge = getStatusBadge(c.availabilityStatus);
            const activeOrders = getCloserActiveOrders(c.id, c.name);
            const activeConvs = getCloserActiveConversations(c.name);
            const capacity = c.maxActiveOrders || 15;
            const percent = Math.min(100, Math.round((activeOrders / capacity) * 100));

            return (
              <div
                key={c.id}
                onClick={() => router.push(`/admin/closeuses/${c.id}`)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:underline">{c.name}</h4>
                      <p className="text-[10px] text-slate-400">{c.phone}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Charge active :</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeOrders} / {capacity} commandes
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

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>{activeConvs} conversation{activeConvs > 1 ? "s" : ""}</span>
                  </span>
                  <span className="text-slate-400">{c.lastActivityAt || "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔍 4. RECHERCHE & FILTRES RAPIDES */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une closeuse, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "AVAILABLE", label: "Disponibles" },
            { id: "BUSY", label: "Occupées" },
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
      {/* 📋 5. TABLEAU PRINCIPAL DES CLOSEUSES */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Closeuse</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5">Charge Active</th>
                <th className="py-3.5 px-5">À Confirmer</th>
                <th className="py-3.5 px-5">Conversations</th>
                <th className="py-3.5 px-5">Confirmées Auj.</th>
                <th className="py-3.5 px-5">Taux Confir.</th>
                <th className="py-3.5 px-5">Commissions</th>
                <th className="py-3.5 px-5">Dernière Activité</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCloseuses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    Aucune opératrice ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredCloseuses.map((cls) => {
                  const badge = getStatusBadge(cls.availabilityStatus);
                  const activeOrders = getCloserActiveOrders(cls.id, cls.name);
                  const pendingConfirm = getCloserPendingConfirmation(cls.id, cls.name);
                  const activeConvs = getCloserActiveConversations(cls.name);
                  const capacity = cls.maxActiveOrders || 15;
                  const commissionToday = (cls.confirmedTodayCount || 0) * (cls.commissionPerConfirmation || 750);

                  return (
                    <tr
                      key={cls.id}
                      onClick={() => router.push(`/admin/closeuses/${cls.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {cls.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:underline">{cls.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{cls.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono">
                        <span className="font-bold text-slate-900">{activeOrders}</span>
                        <span className="text-slate-400"> / {capacity} max</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {pendingConfirm} en attente
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>{activeConvs} ouverte{activeConvs > 1 ? "s" : ""}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">
                        {cls.confirmedTodayCount || 0} confirmées
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {cls.conversionRate || 0}%
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {formatCFA(commissionToday)}
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                        {cls.lastActivityAt || "—"}
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpenId(actionMenuOpenId === cls.id ? null : cls.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === cls.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-20 text-xs">
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  router.push(`/admin/closeuses/${cls.id}`);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                Voir fiche complète
                              </button>
                              <button
                                onClick={() => {
                                  updateCloserAvailability(cls.id, cls.availabilityStatus === "AVAILABLE" ? "PAUSED" : "AVAILABLE");
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                {cls.availabilityStatus === "AVAILABLE" ? "Mettre en pause" : "Rendre disponible"}
                              </button>
                              <a
                                href={`tel:${cls.phone.replace(/\s+/g, "")}`}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800 block"
                              >
                                Appeler l&apos;opératrice
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
          {filteredCloseuses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Aucune opératrice trouvée.</div>
          ) : (
            filteredCloseuses.map((cls) => {
              const badge = getStatusBadge(cls.availabilityStatus);
              const activeOrders = getCloserActiveOrders(cls.id, cls.name);
              const capacity = cls.maxActiveOrders || 15;
              return (
                <div
                  key={cls.id}
                  onClick={() => router.push(`/admin/closeuses/${cls.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {cls.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{cls.name}</h4>
                        <p className="text-[10px] text-slate-400">{cls.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Charge</span>
                      <span className="font-bold text-slate-900">{activeOrders} / {capacity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Confirmées</span>
                      <span className="font-bold text-emerald-700">{cls.confirmedTodayCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Conversion</span>
                      <span className="font-bold text-slate-900">{cls.conversionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* 📝 MODAL + AJOUTER UNE CLOSEUSE */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Headset className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">Ajouter une Nouvelle Closeuse</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCloseuse} className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Informations Personnelles
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                    <input
                      type="text"
                      placeholder="Ex: Sarah"
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
                      placeholder="Ex: ADANHO"
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
                      placeholder="Ex: sarah.a@guineego.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Compétences & Spécialités
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Langues maîtrisées</label>
                    <input
                      type="text"
                      placeholder="Ex: Français, Fon, Yoruba"
                      value={newLanguages}
                      onChange={(e) => setNewLanguages(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Zones couvertes</label>
                    <input
                      type="text"
                      placeholder="Ex: Conakry, Kankan, Kindia"
                      value={newZones}
                      onChange={(e) => setNewZones(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Types de commandes / Compétences</label>
                  <input
                    type="text"
                    placeholder="Ex: High-Ticket, Cosmétique, B2B, Vente Express"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Capacité & Rémunération
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Commandes</label>
                    <input
                      type="number"
                      value={newMaxOrders}
                      onChange={(e) => setNewMaxOrders(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Conversations</label>
                    <input
                      type="number"
                      value={newMaxConvs}
                      onChange={(e) => setNewMaxConvs(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Commission (GNF)</label>
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
                  onChange={(e) => setNewStatus(e.target.value as CloseuseStatus)}
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
                  Créer la Closeuse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
