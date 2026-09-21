"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BadgeDollarSign,
  Banknote,
  Receipt,
  Scale,
  Users,
  Wallet,
  Percent,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock,
  ChevronDown,
  Bell,
  Search,
  Headset,
  Bike,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Vault,
  TrendingUp,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { formatCFA } from "@/lib/mock-data";
import SpotlightSearchModal from "@/components/admin/SpotlightSearchModal";
import HubSwitcher from "@/components/HubSwitcher";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  badgeTooltip?: string;
  subtext?: string;
  hasPulse?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function TresorerieLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cashRegisterStatus, setCashRegisterStatus] = useState<"OUVERTE" | "CLOTUREE">("OUVERTE");

  const {
    currentRole,
    switchRole,
    activeTreasuryManager,
    codRemittances,
    payoutRequests,
    unreadNotificationsCount,
    getDriverCodFunds,
    livreurs,
    orders,
  } = useOperations();

  // Metrics for badges & indicators
  const pendingRemittances = useMemo(
    () => codRemittances.filter((r) => r.status === "PENDING_VALIDATION"),
    [codRemittances]
  );
  const pendingRemittancesCount = pendingRemittances.length;
  const pendingRemittancesTotal = pendingRemittances.reduce((acc, r) => acc + (r.receivedAmount || r.amountDeclared || 0), 0);

  const pendingPayouts = useMemo(
    () => payoutRequests.filter((p) => p.status === "PENDING"),
    [payoutRequests]
  );
  const pendingPayoutsCount = pendingPayouts.length;
  const pendingPayoutsTotal = pendingPayouts.reduce((acc, p) => acc + (p.amount || 0), 0);

  const discrepancies = useMemo(
    () => codRemittances.filter(
      (r) => r.status === "DISCREPANCY_DETECTED" || (r.discrepancyAmount && r.discrepancyAmount !== 0)
    ),
    [codRemittances]
  );
  const discrepanciesCount = discrepancies.length;
  const discrepanciesTotal = discrepancies.reduce((acc, r) => acc + Math.abs(r.discrepancyAmount || 0), 0);

  const deliveredOrdersTotal = useMemo(() => {
    return orders
      .filter((o) => o.status === "LIVREE")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [orders]);

  const totalNotifications = unreadNotificationsCount;
  const displayBadgeText = totalNotifications > 9 ? "9+" : totalNotifications > 0 ? `${totalNotifications}` : undefined;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      title: "ESPACE TRÉSORERIE",
      items: [
        {
          id: "nav-dashboard",
          label: "Tableau de bord",
          href: "/tresorerie",
          icon: LayoutDashboard,
          subtext: "Vue d'ensemble",
        },
      ],
    },
    {
      title: "OPÉRATIONS",
      items: [
        {
          id: "nav-encaissements",
          label: "Encaissements COD",
          href: "/tresorerie/encaissements",
          icon: Banknote,
          subtext: "Colis livrés",
        },
        {
          id: "nav-remises",
          label: "Remises Livreurs",
          href: "/tresorerie/remises",
          icon: Receipt,
          subtext: "Pointage & dépôts",
          badge: isMounted && pendingRemittancesCount > 0 ? pendingRemittancesCount : undefined,
          badgeColor: "bg-amber-500 text-slate-950 font-black",
          badgeTooltip: isMounted ? `${pendingRemittancesCount} remise(s) à pointer • Total: ${formatCFA(pendingRemittancesTotal)}` : undefined,
          hasPulse: isMounted && pendingRemittancesCount > 0,
        },
      ],
    },
    {
      title: "FINANCES",
      items: [
        {
          id: "nav-transactions",
          label: "Grand Livre & Journal",
          href: "/tresorerie/transactions",
          icon: FileSpreadsheet,
          subtext: "Flux comptables",
        },
        {
          id: "nav-commissions",
          label: "Commissions GuinéeGo",
          href: "/tresorerie/commissions",
          icon: Percent,
          subtext: "Revenus agence",
        },
      ],
    },
    {
      title: "E-COMMERÇANTS",
      items: [
        {
          id: "nav-ecommercants",
          label: "Soldes Marchands",
          href: "/tresorerie/ecommercants",
          icon: Users,
          subtext: "Portefeuilles",
        },
        {
          id: "nav-retraits",
          label: "Retraits & Virements",
          href: "/tresorerie/retraits",
          icon: Wallet,
          badge: isMounted && pendingPayoutsCount > 0 ? pendingPayoutsCount : undefined,
          badgeColor: pendingPayoutsCount > 2 ? "bg-rose-500 text-white font-black" : "bg-amber-500 text-slate-950 font-black",
          badgeTooltip: isMounted ? `${pendingPayoutsCount} demande(s) en attente • Montant: ${formatCFA(pendingPayoutsTotal)}` : undefined,
          hasPulse: isMounted && pendingPayoutsCount > 0,
        },
      ],
    },
    {
      title: "CONTRÔLE & TRAÇABILITÉ",
      items: [
        {
          id: "nav-reconciliation",
          label: "Rapprochements & Écarts",
          href: "/tresorerie/reconciliation",
          icon: Scale,
          subtext: "Contrôle & anomalies",
          badge: isMounted && discrepanciesCount > 0 ? discrepanciesCount : undefined,
          badgeColor: "bg-rose-600 text-white font-black animate-pulse shadow-xs",
          badgeTooltip: isMounted ? `${discrepanciesCount} écart(s) détecté(s) • Cumul: ${formatCFA(discrepanciesTotal)}` : undefined,
          hasPulse: isMounted && discrepanciesCount > 0,
        },
        {
          id: "nav-audit",
          label: "Audit Financier",
          href: "/tresorerie/audit",
          icon: History,
          subtext: "Piste inaltérable",
        },
      ],
    },
  ];

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    setRoleMenuOpen(false);
    if (role === "PDG") router.push("/admin");
    else if (role === "CLOSEUSE" || role === "CLOSER") router.push("/commercial");
    else if (role === "LIVREUR") router.push("/livreur");
    else if (role === "PARTNER") router.push("/dashboard");
    else if (role === "TREASURY_MANAGER") router.push("/tresorerie");
  };

  const isItemActive = (href: string) => {
    if (href === "/tresorerie") {
      return pathname === "/tresorerie";
    }
    if (href === "/tresorerie/remises") {
      return (
        pathname === "/tresorerie/remises" ||
        pathname.startsWith("/tresorerie/remises/") ||
        pathname.startsWith("/tresorerie/livreurs")
      );
    }
    if (href === "/tresorerie/reconciliation") {
      return (
        pathname === "/tresorerie/reconciliation" ||
        pathname.startsWith("/tresorerie/reconciliation/") ||
        pathname.startsWith("/tresorerie/ecarts")
      );
    }
    if (href === "/tresorerie/transactions" || href === "/tresorerie/grand-livre") {
      return (
        pathname === "/tresorerie/transactions" ||
        pathname.startsWith("/tresorerie/transactions/") ||
        pathname === "/tresorerie/grand-livre" ||
        pathname.startsWith("/tresorerie/grand-livre/")
      );
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getPageMeta = () => {
    if (pathname === "/tresorerie") return { title: "Tableau de bord", subtitle: "Vue d'ensemble de la trésorerie GuinéeGo LAT" };
    if (pathname === "/tresorerie/encaissements") return { title: "Encaissements COD", subtitle: "Suivi unitaire des montants perçus par commande" };
    if (pathname === "/tresorerie/remises") return { title: "Remises de Fonds Livreurs", subtitle: "Pointage, vérification et versement au coffre" };
    if (pathname.startsWith("/tresorerie/livreurs")) return { title: "Situation financière des livreurs", subtitle: "Suivi des fonds COD et remises des livreurs" };
    if (pathname === "/tresorerie/transactions" || pathname === "/tresorerie/grand-livre") return { title: "Grand Livre & Journal", subtitle: "Consultez les mouvements financiers enregistrés et suivez l'évolution des flux de trésorerie." };
    if (pathname === "/tresorerie/ecommercants") return { title: "Soldes & Portefeuilles E-commerçants", subtitle: "Gestion des avoirs et réserves marchands" };
    if (pathname === "/tresorerie/retraits") return { title: "Retraits E-commerçants", subtitle: "Validation et décaissements Mobile Money / Virement" };
    if (pathname === "/tresorerie/commissions") return { title: "Commissions GuinéeGo LAT", subtitle: "Ventilation et suivi des revenus de l'agence" };
    if (pathname === "/tresorerie/reconciliation") return { title: "Rapprochements & Écarts", subtitle: "Contrôle d'intégrité COD attendu vs encaissé vs versé" };
    if (pathname.startsWith("/tresorerie/ecarts")) return { title: "Écarts financiers", subtitle: "Analyse et résolution des anomalies financières" };
    if (pathname === "/tresorerie/audit") return { title: "Journal d'Audit Financier", subtitle: "Piste d'audit inaltérable des opérations de trésorerie" };
    return { title: "Espace Trésorerie", subtitle: "Supervision des flux et caisse terrain" };
  };

  const pageMeta = getPageMeta();

  return (
    <div className="bg-[#F8FAFC] text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white min-h-screen">
      {/* 🔍 Spotlight Search Modal */}
      <SpotlightSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* 🚀 COMPACT & INDEPENDENT SIDEBAR (Desktop) */}
      <aside
        aria-label="Navigation Espace Trésorerie"
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)] ${
          sidebarCollapsed ? "w-16 p-2" : "w-56 lg:w-64 p-3"
        }`}
      >
        {/* 1. Header Brand */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
          <Link
            href="/tresorerie"
            aria-label="Accueil Espace Trésorerie GuinéeGo"
            className="flex items-center gap-2 group min-w-0"
          >
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/images/guineego_logo.jpg"
                alt="Logo GuinéeGo LAT"
                width={32}
                height={32}
                className="object-contain p-0.5"
                priority
              />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-xs font-black tracking-tight text-slate-900 block leading-tight">
                  GuinéeGo LAT
                </span>
                <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">
                  Trésorerie &amp; Caisse
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Agrandir le menu latéral" : "Réduire le menu latéral"}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Agrandir" : "Réduire"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* 2. Profile Badge (Responsable Trésorerie & Caisse) */}
        <div className={`my-2 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 transition-all ${
          sidebarCollapsed ? "p-1.5 flex flex-col items-center justify-center gap-1" : "p-2 flex items-center justify-between"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs"
              title={`${activeTreasuryManager?.name || "Amina Tidjani"} • Trésorier`}
            >
              {activeTreasuryManager?.name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "TM"}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {activeTreasuryManager?.name || "Amina Tidjani"}
                </h4>
                <p className="text-[9px] text-slate-500 truncate leading-tight flex items-center gap-1">
                  <span>Trésorerie</span>
                  <span>•</span>
                  <span className={cashRegisterStatus === "OUVERTE" ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                    {cashRegisterStatus === "OUVERTE" ? "Caisse Ouverte" : "Clôturée"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Caisse Status Toggle */}
          <button
            onClick={() => setCashRegisterStatus(cashRegisterStatus === "OUVERTE" ? "CLOTUREE" : "OUVERTE")}
            className="cursor-pointer group flex items-center gap-1 shrink-0"
            title={`Statut Caisse : ${cashRegisterStatus === "OUVERTE" ? "Active (Cliquer pour clôturer)" : "Clôturée (Cliquer pour ouvrir)"}`}
            aria-label={`Statut de la caisse : ${cashRegisterStatus}`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                cashRegisterStatus === "OUVERTE"
                  ? "bg-emerald-500 ring-2 ring-emerald-200 shadow-xs"
                  : "bg-slate-400"
              }`}
            />
          </button>
        </div>

        {/* 3. Navigation Links */}
        <nav
          role="navigation"
          aria-label="Navigation principale"
          className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1"
        >
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-0.5">
              {!sidebarCollapsed && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-0.5 block select-none">
                  {sec.title}
                </span>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.href);

                  return (
                    <div key={item.id} className="block">
                      <Link
                        href={item.href}
                        suppressHydrationWarning
                        aria-current={isActive ? "page" : undefined}
                        className={`group relative flex items-center justify-between rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          sidebarCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
                        } ${
                          isActive
                            ? "bg-slate-900 text-white font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                        title={sidebarCollapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ""}` : item.badgeTooltip || item.label}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />
                          {!sidebarCollapsed && (
                            <div className="min-w-0 flex flex-col">
                              <span className="truncate leading-tight">{item.label}</span>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        {item.badge !== undefined && (typeof item.badge === "string" || item.badge > 0) && (
                          <div className="flex items-center gap-1 shrink-0">
                            {item.hasPulse && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            )}
                            <span
                              role="status"
                              aria-live="polite"
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
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

        {/* 4. Bottom Actions */}
        <div className="pt-2 mt-1 border-t border-slate-200/80 space-y-1 shrink-0">

          <button
            onClick={() => router.push("/partenaire")}
            className={`flex items-center gap-2 w-full rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
              sidebarCollapsed ? "p-2 justify-center" : "px-2.5 py-1.5"
            }`}
            title="Déconnexion de l'Espace Trésorerie"
            aria-label="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span className="text-[11px]">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <Link href="/tresorerie" className="flex items-center gap-2" aria-label="Accueil Trésorerie GuinéeGo">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 bg-white">
            <Image src="/images/guineego_logo.jpg" alt="Logo GuinéeGo LAT" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block leading-none">GUINÉEGO TRÉSORERIE</span>
            <span className="text-[9px] font-semibold text-slate-500">Caisse &amp; Flux</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <HubSwitcher compact />
          <button
            onClick={() => setSearchModalOpen(true)}
            aria-label="Ouvrir la recherche"
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Recherche"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-expanded={mobileSidebarOpen}
            aria-label={mobileSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation mobile Trésorerie"
          className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex"
        >
          <div className="w-4/5 max-w-xs bg-white h-full p-4 overflow-y-auto space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  TM
                </div>
                <span className="text-xs font-black text-slate-900">Menu Trésorerie</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Fermer le menu"
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick cash status in mobile */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Statut Caisse</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                {cashRegisterStatus}
              </span>
            </div>

            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 px-2 block">{sec.title}</span>
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          isActive ? "bg-slate-900 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100 space-y-1">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  router.push("/partenaire");
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar — EXACT MATCH WITH PDG TOPBAR */}
        <header className="hidden md:flex bg-white border-b border-slate-200/80 px-6 py-3 items-center justify-between sticky top-0 z-20 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Breadcrumb & Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span>GuinéeGo LAT</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700">{pageMeta.title}</span>
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">
              {pageMeta.title}
            </h1>
          </div>

          {/* Actions & Hub Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 text-xs font-medium w-44 md:w-60 lg:w-72 transition-all cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 text-left text-[11px] truncate">Rechercher (remise, marchand, colis...)</span>
            </button>
            <HubSwitcher />
          </div>

        </header>

        {/* Main Content Body */}
        <main className="flex-1 pt-14 md:pt-0 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-4 sm:px-8 py-3.5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>GuinéeGo LAT © 2027 — Espace Trésorerie &amp; Caisse</p>
          <p className="text-[11px] text-slate-400">Source Unique de Vérité • Double Écriture Grand Livre</p>
        </footer>
      </div>
    </div>
  );
}
