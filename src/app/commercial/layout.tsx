"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PhoneCall,
  Users,
  Store,
  Truck,
  TrendingUp,
  Bell,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  LogOut,
  ArrowRight,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  Headset,
  MessageSquare,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import SpotlightSearchModal from "@/components/admin/SpotlightSearchModal";
import HubSwitcher from "@/components/HubSwitcher";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  hasPulse?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState<"ALL" | "UNREAD" | "ALERTS">("ALL");

  const {
    orders,
    activeCloseuse,
    conversations,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useOperations();

  const waitingConversationsCount = useMemo(
    () => conversations.filter((c) => c.status === "WAITING" || (!c.assignedAgentName && c.status !== "RESOLVED")).length,
    [conversations]
  );

  const toCallCount = useMemo(
    () => orders.filter((o) => o.status === "EN_ATTENTE").length,
    [orders]
  );
  const toCallbackCount = useMemo(
    () => orders.filter((o) => o.status === "A_RAPPELER").length,
    [orders]
  );
  const toAssignCount = useMemo(
    () => orders.filter((o) => o.status === "CONFIRMEE" && !o.assignedLivreurId).length,
    [orders]
  );

  const totalNotifications = unreadNotificationsCount;
  const displayBadgeText =
    totalNotifications > 9 ? "9+" : totalNotifications > 0 ? `${totalNotifications}` : undefined;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navSections: NavSection[] = [
    {
      title: "ESPACE COMMERCIAL",
      items: [
        { id: "nav-command-center", label: "Command Center", href: "/commercial", icon: LayoutDashboard },
      ],
    },
    {
      title: "TRAITEMENT",
      items: [
        {
          id: "nav-commandes",
          label: "Commandes",
          href: "/commercial/commandes",
          icon: Package,
          badge: toCallCount > 0 ? toCallCount : undefined,
          badgeColor: "bg-slate-900 text-white",
          hasPulse: toCallCount > 0,
        },
        {
          id: "nav-appels",
          label: "Appels & Relances",
          href: "/commercial/appels-relances",
          icon: PhoneCall,
          badge: toCallbackCount > 0 ? toCallbackCount : undefined,
          badgeColor: "bg-amber-500 text-slate-950 font-black",
          hasPulse: toCallbackCount > 0,
        },
      ],
    },
    {
      title: "RÉSEAU & SUPPORT",
      items: [
        { id: "nav-clients", label: "Clients", href: "/commercial/clients", icon: Users },
        { id: "nav-ecommercants", label: "E-commerçants", href: "/commercial/ecommercants", icon: Store },
        {
          id: "nav-conversations",
          label: "Support Marchands",
          href: "/commercial/conversations",
          icon: MessageSquare,
          badge: waitingConversationsCount > 0 ? waitingConversationsCount : undefined,
          badgeColor: "bg-rose-500 text-white font-black",
          hasPulse: waitingConversationsCount > 0,
        },
      ],
    },
    {
      title: "OPÉRATIONS",
      items: [
        {
          id: "nav-affectation",
          label: "Livraison & Affectation",
          href: "/commercial/affectation",
          icon: Truck,
          badge: toAssignCount > 0 ? toAssignCount : undefined,
          badgeColor: "bg-rose-500 text-white font-black",
          hasPulse: toAssignCount > 0,
        },
      ],
    },
    {
      title: "SUIVI",
      items: [
        { id: "nav-performance", label: "Performance", href: "/commercial/performance", icon: TrendingUp },
        {
          id: "nav-notifications",
          label: "Notifications",
          href: "/commercial/notifications",
          icon: Bell,
          badge: totalNotifications > 0 ? totalNotifications : undefined,
          badgeColor: "bg-rose-500 text-white font-bold",
        },
        { id: "nav-activite", label: "Activité", href: "/commercial/activite", icon: Activity },
      ],
    },
  ];

  const isItemActive = (href: string) => {
    if (href === "/commercial") return pathname === "/commercial";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getPageMeta = () => {
    if (pathname === "/commercial") return { title: "Command Center", subtitle: "Pilotez vos commandes, relances et confirmations depuis un seul espace." };
    if (pathname === "/commercial/commandes") return { title: "Commandes", subtitle: "Traitement et télévente" };
    if (pathname === "/commercial/appels-relances" || pathname === "/commercial/appels") return { title: "Appels & Relances", subtitle: "Gestion des contacts et rappels" };
    if (pathname === "/commercial/clients") return { title: "Clients", subtitle: "Base clients et historique" };
    if (pathname === "/commercial/ecommercants") return { title: "E-commerçants", subtitle: "Marchands et portefeuilles" };
    if (pathname === "/commercial/affectation" || pathname === "/commercial/livraison-affectation") return { title: "Livraison & Affectation", subtitle: "Dispatch et suivi livreurs" };
    if (pathname === "/commercial/performance") return { title: "Performance", subtitle: "Mes indicateurs et statistiques" };
    if (pathname === "/commercial/notifications") return { title: "Notifications", subtitle: "Centre d'alertes" };
    if (pathname === "/commercial/activite") return { title: "Activité", subtitle: "Journal de mes actions" };
    return { title: "Espace Commercial", subtitle: "Télévente et suivi des commandes" };
  };

  const pageMeta = getPageMeta();
  const closeuseName = activeCloseuse?.name?.split(" ")[0] || "Sarah";
  const closeuseInitials = activeCloseuse?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "SC";

  return (
    <div className="bg-[#F8FAFC] text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white min-h-screen">
      <SpotlightSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* SIDEBAR DESKTOP */}
      <aside
        aria-label="Navigation Espace Commercial"
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)] ${
          sidebarCollapsed ? "w-16 p-2" : "w-56 lg:w-64 p-3"
        }`}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
          <Link href="/commercial" aria-label="Accueil Commercial ENO LIVRAISON" className="flex items-center gap-2 group min-w-0">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Image src="/images/eno_livraison_logo.png" alt="Logo ENO LIVRAISON" width={32} height={32} className="object-contain p-0.5" priority />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-xs font-black tracking-tight text-slate-900 block leading-tight">ENO LIVRAISON</span>
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Espace Commercial</span>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? "Agrandir" : "Réduire"} className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className={`my-2 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 transition-all ${sidebarCollapsed ? "p-1.5 flex flex-col items-center justify-center gap-1" : "p-2 flex items-center justify-between"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs" title={activeCloseuse?.name || "Sarah Kone"}>
              {closeuseInitials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{activeCloseuse?.name || "Sarah Kone"}</h4>
                <p className="text-[9px] text-slate-500 truncate leading-tight flex items-center gap-1"><Headset className="w-2.5 h-2.5" /><span>Commerciale</span></p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${activeCloseuse?.availabilityStatus === "AVAILABLE" ? "bg-emerald-500" : activeCloseuse?.availabilityStatus === "BUSY" ? "bg-amber-500" : "bg-slate-400"}`} />
          )}
        </div>

        <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-0.5">
              {!sidebarCollapsed && <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-0.5 block select-none">{sec.title}</span>}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);
                  return (
                    <div key={item.id} className="block">
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`group relative flex items-center justify-between rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          sidebarCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
                        } ${isActive ? "bg-slate-900 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`} />
                          {!sidebarCollapsed && <span className="truncate leading-tight">{item.label}</span>}
                        </div>
                        {!sidebarCollapsed && item.badge !== undefined && (typeof item.badge === "string" || item.badge > 0) && (
                          <div className="flex items-center gap-1 shrink-0">
                            {item.hasPulse && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                            <span role="status" aria-live="polite" className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-2 mt-1 border-t border-slate-200/80 space-y-1 shrink-0">
          <button onClick={() => router.push("/partenaire")} className={`flex items-center gap-2 w-full rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${sidebarCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"}`} title="Déconnexion">
            <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span className="text-[11px]">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <Link href="/commercial" className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 bg-white">
            <Image src="/images/eno_livraison_logo.png" alt="ENO Livraison" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block leading-none">ENO COMMERCIAL</span>
            <span className="text-[9px] font-semibold text-slate-500">Closeuse</span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <HubSwitcher />
          <button onClick={() => setSearchModalOpen(true)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"><Search className="w-4 h-4" /></button>
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            {displayBadgeText && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">{displayBadgeText}</span>}
          </button>
          <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div role="dialog" aria-modal="true" className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-white h-full p-4 overflow-y-auto space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">{closeuseInitials}</div>
                <span className="text-xs font-black text-slate-900">Menu Commercial</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 px-2 block">{sec.title}</span>
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);
                    return (
                      <Link key={item.id} href={item.href} onClick={() => setMobileSidebarOpen(false)} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${isActive ? "bg-slate-900 text-white font-bold" : "text-slate-600 hover:bg-slate-100"}`}>
                        <div className="flex items-center gap-2.5"><Icon className="w-4 h-4" /><span>{item.label}</span></div>
                        {item.badge !== undefined && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.badgeColor}`}>{item.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100">
              <button onClick={() => { setMobileSidebarOpen(false); router.push("/partenaire"); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50">
                <LogOut className="w-4 h-4" /><span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex bg-white border-b border-slate-200/80 px-6 py-3 items-center justify-between sticky top-0 z-20 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span>GuinéeGo LAT</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700">{pageMeta.title}</span>
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">{pageMeta.title}</h1>
          </div>

          <button onClick={() => setSearchModalOpen(true)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 text-xs font-medium w-44 md:w-60 lg:w-80 transition-all cursor-pointer shadow-2xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="flex-1 text-left text-[11px] truncate">Rechercher (commande, client, livreur…)</span>
          </button>

          <div className="flex items-center gap-3 relative">
            <HubSwitcher />
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className={`relative p-2 rounded-xl border transition-all cursor-pointer ${notificationsOpen ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"}`} title="Notifications">
              <Bell className="w-4 h-4" />
              {displayBadgeText && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">{displayBadgeText}</span>}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-slate-950/20 md:bg-transparent" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 animate-fade-in-up flex flex-col overflow-hidden text-slate-900">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Bell className="w-3.5 h-3.5" /></div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Notifications</h4>
                        <p className="text-[10px] text-slate-500">{totalNotifications > 0 ? `${totalNotifications} non lue(s)` : "Toutes à jour"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalNotifications > 0 && <button onClick={() => markAllNotificationsAsRead()} className="px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"><CheckCheck className="w-3 h-3 text-emerald-600" /><span>Tout lire</span></button>}
                      <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1">
                    {(["ALL", "UNREAD", "ALERTS"] as const).map((f) => (
                      <button key={f} onClick={() => setDropdownFilter(f)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${dropdownFilter === f ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        {f === "ALERTS" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {f === "ALL" ? `Toutes (${notifications.length})` : f === "UNREAD" ? "Non lues" : "Alertes"}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                    {notifications.filter((n) => {
                      if (dropdownFilter === "UNREAD") return !n.isRead;
                      if (dropdownFilter === "ALERTS") return n.isAlert || n.priority === "CRITICAL" || n.priority === "URGENT";
                      return true;
                    }).slice(0, 15).map((n) => {
                      const isCritical = n.priority === "CRITICAL";
                      const isUrgent = n.priority === "URGENT";
                      return (
                        <div key={n.id} className={`p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 relative ${!n.isRead ? "bg-slate-50/40" : "bg-white"}`}>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-xs" />}
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${isCritical ? "bg-rose-100 text-rose-700 border border-rose-200" : isUrgent ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                            {isCritical ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : isUrgent ? <Clock className="w-4 h-4 text-amber-600" /> : <Info className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${isCritical ? "bg-rose-50 text-rose-700 border border-rose-200" : isUrgent ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-700"}`}>{n.category}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{n.createdAt}</span>
                            </div>
                            <h5 className={`text-xs leading-snug ${!n.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{n.title}</h5>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.description}</p>
                            <div className="pt-1 flex items-center justify-between gap-2">
                              {n.actionUrl ? <Link href={n.actionUrl} onClick={() => { markNotificationAsRead(n.id); setNotificationsOpen(false); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-blue-600 transition-colors"><span>{n.actionLabel || "Voir"}</span><ArrowRight className="w-3 h-3" /></Link> : <span />}
                              {!n.isRead && <button onClick={() => markNotificationAsRead(n.id)} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">Marquer lu</button>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {notifications.filter((n) => {
                      if (dropdownFilter === "UNREAD") return !n.isRead;
                      if (dropdownFilter === "ALERTS") return n.isAlert || n.priority === "CRITICAL" || n.priority === "URGENT";
                      return true;
                    }).length === 0 && (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto"><CheckCheck className="w-5 h-5 text-emerald-600" /></div>
                        <p className="text-xs font-bold text-slate-800">Aucune notification</p>
                        <p className="text-[11px] text-slate-400">Toutes les notifications ont été lues.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                    <Link href="/commercial/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                      <span>Voir toutes les notifications</span><ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">{closeuseInitials}</div>
              <div className="hidden lg:block">
                <p className="text-[11px] font-bold text-slate-900 leading-tight">{closeuseName}</p>
                <p className="text-[9px] text-slate-500 leading-tight">Commerciale</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-14 md:pt-0 p-3 sm:p-6 lg:p-8 max-w-screen-2xl w-full mx-auto space-y-6 min-w-0">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200/80 px-4 sm:px-8 py-3.5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>GuinéeGo LAT © 2027 — Espace Commercial & Télévente</p>
          <p className="text-[11px] text-slate-400">Command Center Closeuse • Source Unique de Vérité</p>
        </footer>
      </div>
    </div>
  );
}
