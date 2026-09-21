"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wallet,
  History,
  AlertTriangle,
  Bell,
  User,
  Wifi,
  WifiOff,
  Bike,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { LivreurStatus } from "@/lib/types";
import HubSwitcher from "@/components/HubSwitcher";

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const {
    orders,
    activeLivreur,
    activeLivreurId,
    livreurs,
    switchRole,
    updateLivreurAvailability,
    notifications,
  } = useOperations();

  // Écoute de l'état réseau pour mobile & PWA
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Enregistrement PWA Service Worker pour fonctionnement hors-ligne
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Calcul du nombre de livraisons actives pour ce coursier
  const activeDeliveriesCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.assignedLivreurId === activeLivreur?.id &&
        (o.status === "EN_COURS" || o.status === "CONFIRMEE")
    ).length;
  }, [orders, activeLivreur]);

  // Notifications non lues pour ce livreur
  const livreurUnreadNotifs = useMemo(() => {
    return notifications.filter(
      (n) =>
        !n.isRead &&
        (n.category === "LIVRAISONS" ||
          n.category === "COMMANDES" ||
          n.category === "INCIDENTS" ||
          n.actor?.id === activeLivreur?.id)
    ).length;
  }, [notifications, activeLivreur]);

  // Items de la Navigation Desktop & Tiroir Mobile
  const navItems = [
    {
      id: "nav-dashboard",
      label: "Command Center",
      href: "/livreur",
      icon: LayoutDashboard,
    },
    {
      id: "nav-livraisons",
      label: "Mes Livraisons",
      href: "/livreur/livraisons",
      icon: Package,
      badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : undefined,
      badgeColor: "bg-emerald-500 text-white font-bold",
    },
    {
      id: "nav-cod",
      label: "Collectes / COD",
      href: "/livreur/cod",
      icon: Wallet,
    },
    {
      id: "nav-historique",
      label: "Historique",
      href: "/livreur/historique",
      icon: History,
    },
    {
      id: "nav-incidents",
      label: "Incidents",
      href: "/livreur/incidents",
      icon: AlertTriangle,
    },
    {
      id: "nav-notifications",
      label: "Notifications",
      href: "/livreur/notifications",
      icon: Bell,
      badge: livreurUnreadNotifs > 0 ? livreurUnreadNotifs : undefined,
      badgeColor: "bg-rose-500 text-white font-bold",
    },
    {
      id: "nav-profil",
      label: "Profil & Disponibilité",
      href: "/livreur/profil",
      icon: User,
    },
  ];

  // Statut actuel du coursier
  const currentStatus: LivreurStatus = activeLivreur?.availabilityStatus || "AVAILABLE";

  const toggleAvailability = () => {
    if (!activeLivreur) return;
    const nextStatus: LivreurStatus =
      currentStatus === "AVAILABLE"
        ? "IN_TRANSIT"
        : currentStatus === "IN_TRANSIT"
        ? "PAUSED"
        : currentStatus === "PAUSED"
        ? "OFFLINE"
        : "AVAILABLE";
    updateLivreurAvailability(activeLivreur.id, nextStatus);
  };

  const getStatusLabel = (status: LivreurStatus) => {
    switch (status) {
      case "AVAILABLE":
        return { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-700", badgeBg: "bg-emerald-50 border-emerald-200" };
      case "IN_TRANSIT":
        return { label: "En tournée", color: "bg-blue-500", text: "text-blue-700", badgeBg: "bg-blue-50 border-blue-200" };
      case "PAUSED":
        return { label: "En pause", color: "bg-amber-500", text: "text-amber-700", badgeBg: "bg-amber-50 border-amber-200" };
      case "OFFLINE":
      default:
        return { label: "Hors ligne", color: "bg-slate-400", text: "text-slate-600", badgeBg: "bg-slate-100 border-slate-200" };
    }
  };

  const statusConfig = getStatusLabel(currentStatus);
  const livreurInitials = activeLivreur?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "CR";

  return (
    <div className="bg-[#F8FAFC] text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white min-h-screen">
      {/* ⚠️ Bandeau Réseau Hors Ligne Réactif */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 fixed top-0 left-0 right-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 animate-bounce shrink-0" />
          <span>Connexion réseau interrompue — Mode local actif. Les actions seront synchronisées dès reconnexion.</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* SIDEBAR DESKTOP (Conforme au standard GuinéeGo LAT Commercial/PDG)     */}
      {/* ============================================================ */}
      <aside
        aria-label="Navigation Espace Livreur"
        className="hidden md:flex flex-col bg-white border-r border-slate-200/90 shrink-0 h-screen sticky top-0 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)] w-56 lg:w-64 p-3"
      >
        {/* Header Marque ENO Livraison */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
          <Link href="/livreur" className="flex items-center gap-2 group min-w-0">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/images/eno_livraison_logo.png"
                alt="Logo ENO Livraison"
                width={32}
                height={32}
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black tracking-tight text-slate-900 block leading-tight">ENO LIVRAISON</span>
              <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Espace Coursier</span>
            </div>
          </Link>
          <HubSwitcher />
        </div>

        {/* Profil Coursier & Statut Opérationnel */}
        <div className="my-2 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 p-2 flex flex-col gap-2">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs"
                title={activeLivreur?.name || "Coursier"}
              >
                {livreurInitials}
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {activeLivreur?.name || "Coursier GuinéeGo"}
                </h4>
                <p className="text-[9px] text-slate-500 truncate leading-tight flex items-center gap-1">
                  <Bike className="w-2.5 h-2.5 text-slate-400" />
                  <span>{activeLivreur?.zone?.split(" ")[0] || "Conakry"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={toggleAvailability}
              className="group relative cursor-pointer"
              title="Cliquer pour changer de disponibilité"
            >
              <span className={`w-2.5 h-2.5 rounded-full block ${statusConfig.color} ring-2 ring-white shadow-2xs`} />
            </button>
          </div>

          {/* Statut cliquable & sélecteur de test multi-coursiers */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[10px]">
            <button
              onClick={toggleAvailability}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${statusConfig.badgeBg} ${statusConfig.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
              <span>{statusConfig.label}</span>
            </button>

            <select
              value={activeLivreurId}
              onChange={(e) => switchRole("LIVREUR", e.target.value)}
              className="bg-white border border-slate-200 text-[10px] text-slate-700 font-semibold rounded-md px-1.5 py-0.5 focus:outline-none focus:border-slate-400 max-w-[95px] truncate cursor-pointer"
              title="Sélectionner un livreur pour les tests"
            >
              {livreurs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name.split(" ")[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Principale Desktop */}
        <nav role="navigation" aria-label="Navigation principale coursier" className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 pt-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-0.5 block select-none">
            Opérations Livreur
          </span>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative flex items-center justify-between rounded-xl text-xs font-semibold px-2.5 py-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span className="truncate leading-tight">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                        isActive ? "bg-white text-slate-950" : item.badgeColor || "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Sidebar Desktop */}
        <div className="p-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-[10px]">PWA Ready</span>
          <Link href="/commercial" className="text-[10px] text-slate-700 hover:text-slate-900 font-bold hover:underline">
            Espace Commercial
          </Link>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* CONTENEUR PRINCIPAL                                         */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0">
        {/* Top Header Mobile */}
        <header className="md:hidden h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
          <Link href="/livreur" className="flex items-center gap-2 min-w-0">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
              <Image
                src="/images/eno_livraison_logo.png"
                alt="Logo ENO Livraison"
                width={28}
                height={28}
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black tracking-tight text-slate-900 block leading-none">ENO LIVRAISON</span>
              <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                {activeLivreur?.name?.split(" ")[0] || "Coursier"}
              </span>
            </div>
          </Link>

          {/* Quick Actions Header Mobile */}
          <div className="flex items-center gap-2">
            <HubSwitcher />
            <button
              onClick={toggleAvailability}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${statusConfig.badgeBg} ${statusConfig.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
              <span>{statusConfig.label}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Drawer Menu Mobile (Clair, compact, identique aux tiroirs GuinéeGo) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    {livreurInitials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs leading-tight">{activeLivreur?.name || "Coursier"}</h4>
                    <p className="text-[10px] text-slate-500">{activeLivreur?.phone || "—"} {activeLivreur?.zone ? `· ${activeLivreur.zone}` : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600 font-semibold">Changer de coursier :</span>
                <select
                  value={activeLivreurId}
                  onChange={(e) => {
                    switchRole("LIVREUR", e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-white border border-slate-200 text-xs text-slate-900 font-bold rounded-lg px-2 py-1 focus:outline-none"
                >
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider px-2 py-1">Navigation</p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-slate-100 mt-2">
                  <Link
                    href="/commercial"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    Basculer vers l'espace Commercial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* ============================================================ */}
      {/* NAVIGATION BASSE MOBILE (BOTTOM TAB BAR - Section 9)        */}
      {/* Accueil | Livraisons | Alertes | Profil                     */}
      {/* ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 flex items-center justify-around z-40 shadow-lg safe-area-pb">
        <Link
          href="/livreur"
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-colors ${
            pathname === "/livreur" ? "text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Accueil</span>
        </Link>

        <Link
          href="/livreur/livraisons"
          className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-colors ${
            pathname.startsWith("/livreur/livraisons") ? "text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Livraisons</span>
          {activeDeliveriesCount > 0 && (
            <span className="absolute top-0 right-3 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center">
              {activeDeliveriesCount}
            </span>
          )}
        </Link>

        <Link
          href="/livreur/notifications"
          className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-colors ${
            pathname.startsWith("/livreur/notifications") ? "text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-5 h-5 mb-0.5" />
          <span>Alertes</span>
          {livreurUnreadNotifs > 0 && (
            <span className="absolute top-0 right-3 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center">
              {livreurUnreadNotifs}
            </span>
          )}
        </Link>

        <Link
          href="/livreur/profil"
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-colors ${
            pathname.startsWith("/livreur/profil") ? "text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profil</span>
        </Link>
      </nav>
    </div>
  );
}
