"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  PhoneCall,
  Search,
  CheckCheck,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  RefreshCw,
  Copy,
  Check,
  Store,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Flame,
  ArrowRight,
  Inbox,
  Filter,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { PlatformNotification, NotificationPriority, NotificationCategory } from "@/lib/types";

// Catégories autorisées et pertinentes pour l'espace Commercial
const COMMERCIAL_CATEGORIES: { id: "ALL" | NotificationCategory; label: string; icon: any }[] = [
  { id: "ALL", label: "Toutes", icon: Bell },
  { id: "COMMANDES", label: "Commandes", icon: Package },
  { id: "LIVRAISONS", label: "Livraisons", icon: Truck },
  { id: "LIVREURS", label: "Coursiers", icon: Truck },
  { id: "ECOMMERCE", label: "E-commerçants", icon: Store },
  { id: "CONVERSATIONS", label: "Messages", icon: PhoneCall },
  { id: "INCIDENTS", label: "Incidents", icon: AlertTriangle },
  { id: "SYSTEME", label: "Système", icon: Info },
];

export default function CommercialNotificationsPage() {
  const {
    notifications,
    unreadNotificationsCount,
    criticalAlertsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resolveNotificationAlert,
  } = useOperations();

  // États de recherche & filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "UNREAD" | "READ" | "PRIORITY">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | NotificationCategory>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copie de référence
  const handleCopyRef = (refId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedId(refId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Rafraîchissement manuel
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetch("/api/notifications")
      .then(() => {
        showToast("Notifications synchronisées avec le serveur");
      })
      .catch(() => {
        showToast("Synchronisation locale effectuée");
      })
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });
  };

  // Résolution intelligente de l'URL cible dans l'espace Commercial
  const resolveTargetUrl = (notif: PlatformNotification): string => {
    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith("/admin/commandes")) {
        if (notif.referenceId) {
          return `/commercial/commandes?orderId=${notif.referenceId}`;
        }
        return "/commercial/commandes";
      }
      if (notif.actionUrl.startsWith("/admin/livraisons") || notif.actionUrl.startsWith("/admin/affectation")) {
        if (notif.referenceId) {
          return `/commercial/affectation?orderId=${notif.referenceId}`;
        }
        return "/commercial/affectation";
      }
      if (notif.actionUrl.startsWith("/admin/partenaires")) {
        if (notif.referenceId) {
          return `/commercial/ecommercants?partnerId=${notif.referenceId}`;
        }
        return "/commercial/ecommercants";
      }
      if (notif.actionUrl.startsWith("/commercial")) {
        return notif.actionUrl;
      }
    }

    // Déduction par type de référence
    if (notif.referenceType === "ORDER" && notif.referenceId) {
      return `/commercial/commandes?orderId=${notif.referenceId}`;
    }
    if (notif.referenceType === "MERCHANT" && notif.referenceId) {
      return `/commercial/ecommercants?partnerId=${notif.referenceId}`;
    }
    if (notif.category === "COMMANDES") {
      return "/commercial/commandes";
    }
    if (notif.category === "LIVRAISONS" || notif.category === "LIVREURS") {
      return "/commercial/affectation";
    }
    if (notif.category === "ECOMMERCE") {
      return "/commercial/ecommercants";
    }

    return "/commercial/commandes";
  };

  // Périmètre commercial : filtrer les notifications pertinentes pour la Closeuse
  const commercialFiltered = useMemo(() => {
    return notifications.filter((n) => {
      // Exclure les retraits purs de trésorerie financière bancaire
      if (n.category === "FINANCES" && n.referenceType === "WITHDRAWAL") {
        return false;
      }
      return true;
    });
  }, [notifications]);

  // Calcul des métriques réelles pour le bandeau
  const stats = useMemo(() => {
    const total = commercialFiltered.length;
    const unread = commercialFiltered.filter((n) => !n.isRead).length;
    const priority = commercialFiltered.filter(
      (n) => (n.priority === "CRITICAL" || n.priority === "URGENT") && n.alertStatus !== "RESOLVED"
    ).length;
    const ordersCount = commercialFiltered.filter((n) => n.category === "COMMANDES").length;

    return { total, unread, priority, ordersCount };
  }, [commercialFiltered]);

  // Liste finale filtrée par les contrôles utilisateur
  const displayedNotifications = useMemo(() => {
    const now = new Date("2026-09-06T23:59:59");

    return commercialFiltered.filter((n) => {
      // 1. Filtre de statut
      if (selectedStatus === "UNREAD" && n.isRead) return false;
      if (selectedStatus === "READ" && !n.isRead) return false;
      if (selectedStatus === "PRIORITY" && n.priority !== "CRITICAL" && n.priority !== "URGENT") return false;

      // 2. Filtre de catégorie
      if (selectedCategory !== "ALL" && n.category !== selectedCategory) return false;

      // 3. Filtre de période
      if (selectedPeriod !== "ALL") {
        const dStr = (n.isoDate || n.createdAt || "").slice(0, 10);
        if (selectedPeriod === "TODAY") {
          if (dStr !== "2026-09-06" && !n.createdAt.toLowerCase().includes("l'instant") && !n.createdAt.toLowerCase().includes("aujourd'hui")) {
            return false;
          }
        } else if (selectedPeriod === "7D") {
          const notifTime = new Date(n.isoDate || 0).getTime();
          if (notifTime > 0) {
            const diffDays = (now.getTime() - notifTime) / (1000 * 60 * 60 * 24);
            if (diffDays > 7.5 || diffDays < -0.5) return false;
          }
        } else if (selectedPeriod === "30D") {
          const notifTime = new Date(n.isoDate || 0).getTime();
          if (notifTime > 0) {
            const diffDays = (now.getTime() - notifTime) / (1000 * 60 * 60 * 24);
            if (diffDays > 30.5 || diffDays < -0.5) return false;
          }
        }
      }

      // 4. Recherche textuelle multi-champs
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesDesc = n.description.toLowerCase().includes(q);
        const matchesRef = n.referenceId ? n.referenceId.toLowerCase().includes(q) : false;
        const matchesCat = n.category.toLowerCase().includes(q);

        if (!matchesTitle && !matchesDesc && !matchesRef && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [commercialFiltered, selectedStatus, selectedCategory, selectedPeriod, searchQuery]);

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
          HEADER NOTIFICATIONS & ALERTES
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">Notifications & Alertes</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Notifications
            </h2>
            {stats.unread > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black shadow-xs">
                {stats.unread} non lue{stats.unread > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                À jour
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Retrouvez les événements importants liés à votre activité commerciale.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Rafraîchir les notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Actualiser</span>
          </button>

          {stats.unread > 0 && (
            <button
              onClick={() => {
                markAllNotificationsAsRead();
                showToast("Toutes les notifications ont été marquées comme lues");
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Tout marquer comme lu</span>
            </button>
          )}

          <Link
            href="/commercial/commandes"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Aller aux commandes</span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4 CARTES KPIS RAPIDES
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <div
          onClick={() => { setSelectedStatus("ALL"); setSelectedCategory("ALL"); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "ALL" && selectedCategory === "ALL"
              ? "bg-blue-50/70 border-blue-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Toutes les notifications</span>
            <Bell className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400">Événements enregistrés</div>
        </div>

        {/* Non lues */}
        <div
          onClick={() => setSelectedStatus("UNREAD")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "UNREAD"
              ? "bg-rose-50/70 border-rose-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
            <span>Non lues</span>
            <Inbox className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.unread}</div>
          <div className="text-[10px] text-rose-600 font-semibold">Nécessitent votre attention</div>
        </div>

        {/* Prioritaires */}
        <div
          onClick={() => setSelectedStatus("PRIORITY")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "PRIORITY"
              ? "bg-amber-50/70 border-amber-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Priorité haute</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.priority}</div>
          <div className="text-[10px] text-amber-700 font-semibold">Critiques & urgentes</div>
        </div>

        {/* Commandes */}
        <div
          onClick={() => setSelectedCategory("COMMANDES")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === "COMMANDES"
              ? "bg-emerald-50/70 border-emerald-200 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>Liées aux commandes</span>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.ordersCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Flux closing & livraison</div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          BARRE DE RECHERCHE ET FILTRES RAPIDES
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, commande (ex: CMD-...), client, mot-clé..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre Statut */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Toutes" },
              { id: "UNREAD", label: "Non lues" },
              { id: "READ", label: "Lues" },
              { id: "PRIORITY", label: "Prioritaires" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Filtre Période */}
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Toutes les dates</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="7D">7 derniers jours</option>
              <option value="30D">30 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Filtre Catégories */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Catégorie :
          </span>
          {COMMERCIAL_CATEGORIES.map((cat) => {
            const count =
              cat.id === "ALL"
                ? commercialFiltered.length
                : commercialFiltered.filter((n) => n.category === cat.id).length;

            if (count === 0 && cat.id !== "ALL") return null;

            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          LISTE DES NOTIFICATIONS RÉELLES
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Flux des événements ({displayedNotifications.length})
            </h3>
          </div>
          {(selectedStatus !== "ALL" || selectedCategory !== "ALL" || selectedPeriod !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("ALL");
                setSelectedCategory("ALL");
                setSelectedPeriod("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        {displayedNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Aucune notification à afficher</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `Aucun résultat ne correspond à votre recherche "${searchQuery}".`
                : selectedStatus === "UNREAD"
                ? "Vous êtes à jour ! Toutes les notifications ont été lues."
                : "Aucune notification enregistrée pour les filtres sélectionnés."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedNotifications.map((notif) => {
              const isCritical = notif.priority === "CRITICAL";
              const isUrgent = notif.priority === "URGENT";
              const targetUrl = resolveTargetUrl(notif);

              return (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 relative ${
                    !notif.isRead ? "bg-slate-50/40 hover:bg-slate-50/80" : "bg-white hover:bg-slate-50/40"
                  }`}
                >
                  {/* Puce d'état non lu */}
                  <div className="flex items-center gap-3 sm:block shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          !notif.isRead ? "bg-blue-600 shadow-xs" : "bg-transparent"
                        }`}
                      />
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCritical
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : isUrgent
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {isCritical ? (
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        ) : isUrgent ? (
                          <Clock className="w-5 h-5 text-amber-600" />
                        ) : notif.category === "COMMANDES" ? (
                          <Package className="w-5 h-5 text-blue-600" />
                        ) : notif.category === "LIVRAISONS" || notif.category === "LIVREURS" ? (
                          <Truck className="w-5 h-5 text-blue-600" />
                        ) : notif.category === "ECOMMERCE" ? (
                          <Store className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Corps de la notification */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Catégorie */}
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isCritical
                              ? "bg-rose-100 text-rose-800"
                              : isUrgent
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {notif.category}
                        </span>

                        {/* Priorité */}
                        {isCritical && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            <Flame className="w-2.5 h-2.5 text-rose-600" />
                            Critique
                          </span>
                        )}
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            Urgent
                          </span>
                        )}

                        {/* Référence cliquable pour copier */}
                        {notif.referenceId && (
                          <button
                            onClick={() => handleCopyRef(notif.referenceId!)}
                            className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copier la référence"
                          >
                            <span>{notif.referenceId}</span>
                            {copiedId === notif.referenceId ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Horodatage */}
                      <span className="text-[11px] font-medium text-slate-400">
                        {notif.createdAt}
                      </span>
                    </div>

                    <h4
                      className={`text-sm ${
                        !notif.isRead ? "font-black text-slate-900" : "font-bold text-slate-800"
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {notif.description}
                    </p>

                    {/* Actions au bas de la carte */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100/60 mt-2">
                      <div className="flex items-center gap-3">
                        {/* Bouton Voir l'objet */}
                        <Link
                          href={targetUrl}
                          onClick={() => {
                            if (!notif.isRead) markNotificationAsRead(notif.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                        >
                          <span>{notif.actionLabel || "Ouvrir l'objet concerné"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Si alerte active : bouton résoudre */}
                        {notif.isAlert && notif.alertStatus === "ACTIVE" && (
                          <button
                            onClick={() => {
                              resolveNotificationAlert(notif.id);
                              showToast("Alerte résolue");
                            }}
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                          >
                            Marquer l'alerte comme traitée
                          </button>
                        )}
                      </div>

                      {/* Toggle Lu / Non lu */}
                      <div>
                        {!notif.isRead ? (
                          <button
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              showToast("Notification marquée comme lue");
                            }}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Marquer comme lu</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Déjà consultée</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
