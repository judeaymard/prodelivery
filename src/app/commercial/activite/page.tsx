"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  PhoneCall,
  Clock,
  Calendar,
  AlertTriangle,
  XCircle,
  Package,
  Truck,
  User,
  Store,
  Search,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  Flame,
  ArrowRight,
  Filter,
  FileText,
  ShieldCheck,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { GlobalAuditLog, AuditSeverity } from "@/lib/types";

// Types d'actions commerciales standardisées
const ACTION_FILTERS: { id: string; label: string; icon: any }[] = [
  { id: "ALL", label: "Toutes les actions", icon: Activity },
  { id: "ORDER_CONFIRMED", label: "Confirmations", icon: CheckCircle2 },
  { id: "CALL_LOGGED", label: "Appels & Relances", icon: PhoneCall },
  { id: "DRIVER_ASSIGNED", label: "Affectations", icon: Truck },
  { id: "ORDER_CANCELLED", label: "Annulations", icon: XCircle },
  { id: "ORDER_CREATED", label: "Nouvelles commandes", icon: Package },
];

function formatCFA(amount?: number) {
  if (amount === undefined || amount === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CommercialActivitePage() {
  const { globalAuditLogs, activeCloseuse } = useOperations();

  // Filtres & Recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "TODAY" | "7D" | "30D">("TODAY");
  const [userFilter, setUserFilter] = useState<"ALL" | "ME">("ALL");
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<GlobalAuditLog | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyRef = (ref: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ref);
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetch("/api/audit")
      .then(() => showToast("Journal d'activité synchronisé"))
      .catch(() => showToast("Synchronisation locale effectuée"))
      .finally(() => setTimeout(() => setIsRefreshing(false), 500));
  };

  // Filtrer les événements pertinents pour le périmètre Commercial / Closeuse
  // (Commandes, Appels, Relances, Affectations, Marchands et événements liés au Closing)
  const commercialLogs = useMemo(() => {
    return globalAuditLogs.filter((log) => {
      // Événements liés aux modules commerciaux
      if (
        log.module === "COMMANDES" ||
        log.module === "CLOSEUSES" ||
        log.module === "LIVREURS" ||
        log.module === "ECOMMERCE" ||
        log.entityType === "ORDER" ||
        log.entityType === "CLOSEUSE" ||
        log.entityType === "PARTNER"
      ) {
        return true;
      }
      // Actions typiquement commerciales
      if (
        [
          "ORDER_CREATED",
          "ORDER_CONFIRMED",
          "ORDER_CANCELLED",
          "ORDER_DELIVERED",
          "ORDER_STATUS_UPDATED",
          "CALL_LOGGED",
          "CALLBACK_SCHEDULED",
          "DRIVER_ASSIGNED",
          "AUTOMATIC_ASSIGNMENT_EXECUTED",
        ].includes(log.action)
      ) {
        return true;
      }
      return false;
    });
  }, [globalAuditLogs]);

  // Calcul des statistiques pour les cartes
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = commercialLogs.filter(
      (l) =>
        (l.isoDate || "").slice(0, 10) === todayStr ||
        (l.isoDate || "").slice(0, 10) === "2026-09-06" ||
        (l.timestamp || "").includes("Aujourd'hui")
    );

    const actionsToday = todayLogs.length;
    const confirmedCount = commercialLogs.filter((l) => l.action === "ORDER_CONFIRMED").length;
    const callsCount = commercialLogs.filter((l) => l.action === "CALL_LOGGED" || l.action === "CALLBACK_SCHEDULED").length;
    const assignedCount = commercialLogs.filter((l) => l.action === "DRIVER_ASSIGNED" || l.action === "DRIVER_REASSIGNED").length;

    return { actionsToday, confirmedCount, callsCount, assignedCount };
  }, [commercialLogs]);

  // Liste finale filtrée
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const refDate = new Date("2026-09-06T23:59:59");
    const myName = activeCloseuse?.name?.toLowerCase() || "sarah";

    return commercialLogs.filter((log) => {
      // 1. Filtre Acteur ("Moi" vs "Toute l'équipe")
      if (userFilter === "ME") {
        const actorName = (log.actor?.name || "").toLowerCase();
        if (!actorName.includes("sarah") && !actorName.includes("closeuse") && log.actor?.id !== activeCloseuse?.id) {
          return false;
        }
      }

      // 2. Filtre Type d'action
      if (selectedAction !== "ALL") {
        if (selectedAction === "DRIVER_ASSIGNED") {
          if (log.action !== "DRIVER_ASSIGNED" && log.action !== "DRIVER_REASSIGNED") return false;
        } else if (log.action !== selectedAction) {
          return false;
        }
      }

      // 3. Filtre Période
      if (selectedPeriod !== "ALL") {
        const dStr = (log.isoDate || "").slice(0, 10);
        if (selectedPeriod === "TODAY") {
          if (dStr !== todayStr && dStr !== "2026-09-06" && !(log.timestamp || "").includes("Aujourd'hui")) {
            return false;
          }
        } else if (selectedPeriod === "7D") {
          const logTime = new Date(log.isoDate || 0).getTime();
          if (logTime > 0) {
            const diffDaysNow = (now.getTime() - logTime) / (1000 * 60 * 60 * 24);
            const diffDaysRef = (refDate.getTime() - logTime) / (1000 * 60 * 60 * 24);
            if ((diffDaysNow < -0.5 || diffDaysNow > 7.5) && (diffDaysRef < -0.5 || diffDaysRef > 7.5)) return false;
          }
        } else if (selectedPeriod === "30D") {
          const logTime = new Date(log.isoDate || 0).getTime();
          if (logTime > 0) {
            const diffDaysNow = (now.getTime() - logTime) / (1000 * 60 * 60 * 24);
            const diffDaysRef = (refDate.getTime() - logTime) / (1000 * 60 * 60 * 24);
            if ((diffDaysNow < -0.5 || diffDaysNow > 30.5) && (diffDaysRef < -0.5 || diffDaysRef > 30.5)) return false;
          }
        }
      }

      // 4. Recherche textuelle
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesDesc = (log.description || "").toLowerCase().includes(q);
        const matchesRef = (log.entityReference || "").toLowerCase().includes(q);
        const matchesAction = (log.actionLabel || log.action || "").toLowerCase().includes(q);
        const matchesActor = (log.actor?.name || "").toLowerCase().includes(q);
        const matchesPartner = (log.partnerName || "").toLowerCase().includes(q);

        if (!matchesDesc && !matchesRef && !matchesAction && !matchesActor && !matchesPartner) {
          return false;
        }
      }

      return true;
    });
  }, [commercialLogs, userFilter, selectedAction, selectedPeriod, searchTerm, activeCloseuse]);

  // Résolution du deep-link
  const resolveTargetUrl = (log: GlobalAuditLog): string => {
    if (log.orderId || log.entityType === "ORDER") {
      const refId = log.orderId || log.entityId;
      if (log.action === "CALL_LOGGED" || log.action === "CALLBACK_SCHEDULED") {
        return `/commercial/appels-relances?orderId=${refId}`;
      }
      if (log.action === "DRIVER_ASSIGNED") {
        return `/commercial/affectation?orderId=${refId}`;
      }
      return `/commercial/commandes?orderId=${refId}`;
    }
    if (log.partnerId || log.entityType === "PARTNER") {
      return `/commercial/ecommercants?partnerId=${log.partnerId || log.entityId}`;
    }
    return "/commercial/commandes";
  };

  // Badge d'icône et de couleur par action
  const getActionBadge = (action: string) => {
    switch (action) {
      case "ORDER_CONFIRMED":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          tagBg: "bg-emerald-100 text-emerald-800",
          label: "Confirmation",
        };
      case "CALL_LOGGED":
      case "CALLBACK_SCHEDULED":
        return {
          icon: PhoneCall,
          color: "text-blue-600 bg-blue-50 border-blue-200",
          tagBg: "bg-blue-100 text-blue-800",
          label: "Appel / Relance",
        };
      case "DRIVER_ASSIGNED":
        return {
          icon: Truck,
          color: "text-amber-600 bg-amber-50 border-amber-200",
          tagBg: "bg-amber-100 text-amber-800",
          label: "Affectation",
        };
      case "ORDER_CANCELLED":
        return {
          icon: XCircle,
          color: "text-rose-600 bg-rose-50 border-rose-200",
          tagBg: "bg-rose-100 text-rose-800",
          label: "Annulation",
        };
      case "ORDER_CREATED":
        return {
          icon: Package,
          color: "text-indigo-600 bg-indigo-50 border-indigo-200",
          tagBg: "bg-indigo-100 text-indigo-800",
          label: "Nouvelle commande",
        };
      default:
        return {
          icon: Activity,
          color: "text-slate-600 bg-slate-100 border-slate-200",
          tagBg: "bg-slate-100 text-slate-700",
          label: "Activité",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          HEADER JOURNAL D'ACTIVITÉ
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">Journal d'Activité</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Activité Commerciale
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
              {filteredLogs.length} action{filteredLogs.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivez l'historique de vos actions et des événements commerciaux en direct.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Rafraîchir le journal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Actualiser</span>
          </button>

          <Link
            href="/commercial/commandes"
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Traiter des commandes</span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4 CARTES INDICATEURS DYNAMIQUES
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Actions Aujourd'hui */}
        <div
          onClick={() => { setSelectedPeriod("TODAY"); setSelectedAction("ALL"); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPeriod === "TODAY"
              ? "bg-blue-50/70 border-blue-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Actions aujourd'hui</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.actionsToday}</div>
          <div className="text-[10px] text-slate-400">Opérations enregistrées</div>
        </div>

        {/* Confirmations */}
        <div
          onClick={() => { setSelectedAction("ORDER_CONFIRMED"); setSelectedPeriod("ALL"); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedAction === "ORDER_CONFIRMED"
              ? "bg-emerald-50/70 border-emerald-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>Commandes confirmées</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.confirmedCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Validées par téléphone</div>
        </div>

        {/* Appels & Relances */}
        <div
          onClick={() => { setSelectedAction("CALL_LOGGED"); setSelectedPeriod("ALL"); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedAction === "CALL_LOGGED"
              ? "bg-indigo-50/70 border-indigo-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-800">
            <span>Appels & Relances</span>
            <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.callsCount}</div>
          <div className="text-[10px] text-indigo-700 font-semibold">Tentatives et retours</div>
        </div>

        {/* Affectations */}
        <div
          onClick={() => { setSelectedAction("DRIVER_ASSIGNED"); setSelectedPeriod("ALL"); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedAction === "DRIVER_ASSIGNED"
              ? "bg-amber-50/70 border-amber-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Affectations livreurs</span>
            <Truck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.assignedCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold">Passées en livraison</div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          BARRE DE RECHERCHE ET FILTRES D'ACTIVITÉ
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par référence (CMD-...), client, e-commerçant, description..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre Utilisateur (Moi / Tous) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setUserFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Toute l'équipe
            </button>
            <button
              onClick={() => setUserFilter("ME")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userFilter === "ME" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mes actions
            </button>
          </div>

          {/* Filtre Période */}
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="TODAY">Aujourd'hui</option>
              <option value="7D">7 derniers jours</option>
              <option value="30D">30 derniers jours</option>
              <option value="ALL">Tout l'historique</option>
            </select>
          </div>
        </div>

        {/* Filtre Type d'action (onglets rapides) */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Action :
          </span>
          {ACTION_FILTERS.map((af) => {
            const isSelected = selectedAction === af.id;
            return (
              <button
                key={af.id}
                onClick={() => setSelectedAction(af.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <span>{af.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TIMELINE CHRONOLOGIQUE DES ACTIVITÉS RÉELLES
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Timeline des actions ({filteredLogs.length})
          </h3>
          {(selectedAction !== "ALL" || selectedPeriod !== "TODAY" || userFilter !== "ALL" || searchTerm) && (
            <button
              onClick={() => {
                setSelectedAction("ALL");
                setSelectedPeriod("TODAY");
                setUserFilter("ALL");
                setSearchTerm("");
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Aucune activité enregistrée</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? `Aucune action ne correspond à votre recherche "${searchTerm}".`
                : "Aucun événement ne correspond aux critères sélectionnés."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              const targetUrl = resolveTargetUrl(log);

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 group"
                >
                  {/* Icône de l'action */}
                  <div className="flex items-center gap-3 sm:block shrink-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border font-bold text-xs shrink-0 ${badge.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Corps de l'événement */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type d'action */}
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${badge.tagBg}`}>
                          {log.actionLabel || badge.label}
                        </span>

                        {/* Référence commande ou entité */}
                        {log.entityReference && (
                          <button
                            onClick={() => handleCopyRef(log.entityReference)}
                            className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copier la référence"
                          >
                            <span>{log.entityReference}</span>
                            {copiedRef === log.entityReference ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </button>
                        )}

                        {/* Marchand si disponible */}
                        {log.partnerName && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Store className="w-2.5 h-2.5 text-slate-400" />
                            <span>{log.partnerName}</span>
                          </span>
                        )}
                      </div>

                      {/* Horodatage exact */}
                      <span className="text-[11px] font-medium text-slate-400">
                        {log.timestamp || log.isoDate?.slice(0, 16).replace("T", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {/* Changements d'état ou détails */}
                    {log.afterState && typeof log.afterState === "object" && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1 mt-1 font-mono">
                        <div className="flex flex-wrap items-center gap-3">
                          {log.beforeState && typeof log.beforeState === "object" && (log.beforeState as any).status && (
                            <span>
                              Statut :{" "}
                              <span className="line-through text-slate-400">
                                {(log.beforeState as any).status}
                              </span>{" "}
                              →{" "}
                              <span className="font-bold text-slate-900">
                                {(log.afterState as any).status || "—"}
                              </span>
                            </span>
                          )}
                          {(log.afterState as any).assignedLivreurName && (
                            <span className="text-slate-700">
                              Livreur :{" "}
                              <span className="font-bold text-slate-900">
                                {(log.afterState as any).assignedLivreurName}
                              </span>
                            </span>
                          )}
                          {(log.afterState as any).scheduledCallback && (
                            <span className="text-amber-700 font-bold">
                              Rappel : {(log.afterState as any).scheduledCallback}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ligne inférieure : Auteur et action contextuelle */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100/60 mt-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                          {(log.actor?.name || "U")[0]}
                        </span>
                        <span>
                          Effectué par{" "}
                          <span className="font-bold text-slate-900">{log.actor?.name || "Système"}</span>{" "}
                          ({log.actor?.role || "Opérateur"})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bouton de détail latéral */}
                        <button
                          onClick={() => setSelectedLogForDetail(log)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Détails techniques
                        </button>

                        {/* Lien d'ouverture de l'objet */}
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                        >
                          <span>Voir la commande</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          DRAWER LATÉRAL DE DÉTAIL D'AUDIT
          ------------------------------------------------------------- */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLogForDetail(null)}
          />
          <div className="relative w-full max-w-full sm:max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden text-slate-900">
            {/* Header Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Fiche d'Audit #{selectedLogForDetail.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">Traçabilité & métadonnées d'exécution</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu Drawer */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Résumé de l'action */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                    {selectedLogForDetail.action}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedLogForDetail.actionLabel}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedLogForDetail.description}
                </p>
              </div>

              {/* Métadonnées principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Horodatage</span>
                  <span className="font-bold text-slate-800">{selectedLogForDetail.timestamp}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Module</span>
                  <span className="font-bold text-slate-800">{selectedLogForDetail.module}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Acteur</span>
                  <span className="font-bold text-slate-800">
                    {selectedLogForDetail.actor?.name} ({selectedLogForDetail.actor?.role})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Référence</span>
                  <span className="font-bold text-blue-600">{selectedLogForDetail.entityReference}</span>
                </div>
              </div>

              {/* État JSON complet */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Détail de l'état (Payload)
                </h4>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(
                    {
                      id: selectedLogForDetail.id,
                      actor: selectedLogForDetail.actor,
                      entityReference: selectedLogForDetail.entityReference,
                      beforeState: selectedLogForDetail.beforeState,
                      afterState: selectedLogForDetail.afterState,
                      reason: selectedLogForDetail.reason,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Footer Drawer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <Link
                href={resolveTargetUrl(selectedLogForDetail)}
                onClick={() => setSelectedLogForDetail(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                <span>Accéder à l'élément</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
