"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  BadgeDollarSign,
  MessageSquare,
  CheckCircle2,
  Package,
  Bike,
  ArrowRight,
  Search,
  Filter,
  CheckCheck,
  RotateCcw,
  Download,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Copy,
  Check,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  AlertCircle,
  Inbox,
  Truck,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { PlatformNotification, NotificationPriority, NotificationCategory } from "@/lib/types";

export default function AdminNotificationsPage() {
  const {
    notifications,
    unreadNotificationsCount,
    criticalAlertsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resolveNotificationAlert,
  } = useOperations();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "UNREAD" | "READ" | "ACTIVE_ALERTS">("ALL");
  const [selectedPriority, setSelectedPriority] = useState<"ALL" | NotificationPriority>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | NotificationCategory>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const [viewMode, setViewMode] = useState<"FEED" | "TABLE">("FEED");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Copy helper
  const handleCopyRef = (refId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedId(refId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "Priorité", "Catégorie", "Titre", "Description", "Référence", "Date", "Statut Lecture", "Statut Alerte"];
    const rows = filteredNotifications.map((n) => [
      n.id,
      n.priority,
      n.category,
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.description.replace(/"/g, '""')}"`,
      n.referenceId || "N/A",
      n.createdAt,
      n.isRead ? "Lu" : "Non Lu",
      n.alertStatus || "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guineego_notifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = notifications.length;
    const critical = notifications.filter((n) => n.priority === "CRITICAL" && n.alertStatus !== "RESOLVED").length;
    const urgent = notifications.filter((n) => n.priority === "URGENT" && n.alertStatus !== "RESOLVED").length;
    const info = notifications.filter((n) => n.priority === "INFO").length;
    const unread = notifications.filter((n) => !n.isRead).length;

    return { total, critical, urgent, info, unread };
  }, [notifications]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesDesc = n.description.toLowerCase().includes(q);
        const matchesRef = n.referenceId ? n.referenceId.toLowerCase().includes(q) : false;
        const matchesCategory = n.category.toLowerCase().includes(q);
        const matchesActor = n.actor ? n.actor.name.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc && !matchesRef && !matchesCategory && !matchesActor) {
          return false;
        }
      }

      // Status
      if (selectedStatus === "UNREAD" && n.isRead) return false;
      if (selectedStatus === "READ" && !n.isRead) return false;
      if (selectedStatus === "ACTIVE_ALERTS" && (!n.isAlert || n.alertStatus === "RESOLVED")) return false;

      // Priority
      if (selectedPriority !== "ALL" && n.priority !== selectedPriority) return false;

      // Category
      if (selectedCategory !== "ALL" && n.category !== selectedCategory) return false;

      return true;
    });
  }, [notifications, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto pb-12">
      {/* 1. HEADER HERO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Centre de Surveillance GuinéeGo LAT 2027
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Notifications & Centre d&apos;Alertes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Surveillance centralisée des alertes, signaux opérationnels et événements de la plateforme.
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>

          {metrics.unread > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tout marquer comme lu</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exporter les alertes en CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Critiques */}
        <div
          onClick={() => {
            setSelectedPriority("CRITICAL");
            setSelectedStatus("ALL");
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === "CRITICAL"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">
              Critiques
            </span>
            <span className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-950">{metrics.critical}</span>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">Action immédiate</p>
          </div>
        </div>

        {/* Urgentes */}
        <div
          onClick={() => {
            setSelectedPriority("URGENT");
            setSelectedStatus("ALL");
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === "URGENT"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
              Urgentes
            </span>
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{metrics.urgent}</span>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">À arbitrer rapidement</p>
          </div>
        </div>

        {/* Non Lues */}
        <div
          onClick={() => {
            setSelectedStatus("UNREAD");
            setSelectedPriority("ALL");
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
            selectedStatus === "UNREAD"
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
              Non Lues
            </span>
            <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
              <Bell className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-950">{metrics.unread}</span>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">Nouveaux signaux</p>
          </div>
        </div>

        {/* Infos */}
        <div
          onClick={() => {
            setSelectedPriority("INFO");
            setSelectedStatus("ALL");
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === "INFO"
              ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Informations
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Info className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.info}</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Mises à jour flux</p>
          </div>
        </div>

        {/* Total */}
        <div
          onClick={() => {
            setSelectedStatus("ALL");
            setSelectedPriority("ALL");
            setSelectedCategory("ALL");
            setSearchQuery("");
          }}
          className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Total Événements
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.total}</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Flux traçabilité</p>
          </div>
        </div>
      </div>

      {/* 3. MULTI-FILTER BAR & SEARCH */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par mot-clé, #CMD-2458, #RET-841, partenaire, coursier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Effacer
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode("FEED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "FEED" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Vue Flux Détail
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "TABLE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Vue Tableau
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedStatus === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedStatus("UNREAD")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedStatus === "UNREAD" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Non lus ({metrics.unread})
            </button>
            <button
              onClick={() => setSelectedStatus("ACTIVE_ALERTS")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedStatus === "ACTIVE_ALERTS" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alertes actives
            </button>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setSelectedPriority("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedPriority === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Toutes priorités
            </button>
            <button
              onClick={() => setSelectedPriority("CRITICAL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedPriority === "CRITICAL" ? "bg-rose-600 text-white" : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              🔴 Critique
            </button>
            <button
              onClick={() => setSelectedPriority("URGENT")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedPriority === "URGENT" ? "bg-amber-500 text-slate-950 font-black" : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              🟠 Urgente
            </button>
            <button
              onClick={() => setSelectedPriority("INFO")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedPriority === "INFO" ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"
              }`}
            >
              🔵 Info
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Toutes catégories ({notifications.length})</option>
            <option value="COMMANDES">📦 Commandes & Ventes</option>
            <option value="LIVRAISONS">🚚 Livraisons & Tournées</option>
            <option value="LIVREURS">🛵 Livreurs & Caisses COD</option>
            <option value="ECOMMERCE">🏢 E-commerçants & Marchands</option>
            <option value="FINANCES">💰 Finances, Trésorerie & Retraits</option>
            <option value="CONVERSATIONS">💬 Conversations & Support</option>
            <option value="INCIDENTS">⚠️ Incidents & Litiges</option>
            <option value="SYSTEME">⚙️ Système & Sécurité</option>
          </select>

          {/* Reset Filters button if active */}
          {(selectedStatus !== "ALL" || selectedPriority !== "ALL" || selectedCategory !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("ALL");
                setSelectedPriority("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN STREAM / TABLE VIEW */}
      {viewMode === "FEED" ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isCritical = n.priority === "CRITICAL";
            const isUrgent = n.priority === "URGENT";

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all relative ${
                  !n.isRead
                    ? "bg-white border-slate-300 shadow-sm"
                    : "bg-slate-50/50 border-slate-200/80 hover:bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Pill & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Unread blue beacon */}
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5 ring-4 ring-blue-100" />
                    )}

                    {/* Priority Icon Pill */}
                    <div
                      className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold text-sm ${
                        isCritical
                          ? "bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                          : isUrgent
                          ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-xs"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : isUrgent ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Top Badges line */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-600 text-white"
                              : isUrgent
                              ? "bg-amber-500 text-slate-950 font-black"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {n.priority}
                        </span>

                        {/* Category Badge */}
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {n.category}
                        </span>

                        {/* Reference Tag if present */}
                        {n.referenceId && (
                          <button
                            onClick={() => handleCopyRef(n.referenceId!)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Cliquer pour copier la référence"
                          >
                            <span>#{n.referenceId}</span>
                            {copiedId === n.referenceId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        )}

                        {/* Alert Status Pill */}
                        {n.isAlert && n.alertStatus && (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              n.alertStatus === "ACTIVE"
                                ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {n.alertStatus === "ACTIVE" ? "Alerte Active" : "Résolue"}
                          </span>
                        )}

                        {/* Actor Info if available */}
                        {n.actor && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            par <span className="text-slate-600 font-semibold">{n.actor.name}</span>
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-[11px] text-slate-400 font-medium ml-auto">
                          {n.createdAt}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                        {n.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {n.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        onClick={() => markNotificationAsRead(n.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>{n.actionLabel || "Traiter"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <div className="flex items-center gap-1.5">
                      {n.isAlert && n.alertStatus === "ACTIVE" && (
                        <button
                          onClick={() => resolveNotificationAlert(n.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Marquer l'alerte comme résolue"
                        >
                          Résoudre
                        </button>
                      )}

                      <button
                        onClick={() => markNotificationAsRead(n.id)}
                        className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        {n.isRead ? "Lu" : "Marquer lu"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Aucune notification trouvée</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Aucun événement ou alerte ne correspond à vos critères de recherche et filtres actuels.
              </p>
              <button
                onClick={() => {
                  setSelectedStatus("ALL");
                  setSelectedPriority("ALL");
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Priorité</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Titre & Message</th>
                  <th className="py-3 px-4">Auteur / Source</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.map((n) => (
                  <tr key={n.id} className={`hover:bg-slate-50/80 transition-colors ${!n.isRead ? "bg-blue-50/20" : ""}`}>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          n.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-700"
                            : n.priority === "URGENT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {n.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700">
                      {n.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {n.referenceId || "—"}
                    </td>
                    <td className="py-3 px-4 min-w-[280px]">
                      <p className={`font-bold ${!n.isRead ? "text-slate-900" : "text-slate-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{n.description}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {n.actor?.name || "Système"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {n.createdAt}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {n.actionUrl ? (
                        <Link
                          href={n.actionUrl}
                          onClick={() => markNotificationAsRead(n.id)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 inline-flex items-center gap-1"
                        >
                          <span>{n.actionLabel || "Voir"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
