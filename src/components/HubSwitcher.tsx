"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Crown,
  ShieldCheck,
  BadgeDollarSign,
  Headset,
  Bike,
  Store,
  ChevronDown,
  ArrowRight,
  Layers,
  Check,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { UserRole } from "@/lib/types";

interface HubPortal {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  userDefault: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeText: string;
  activeMatch: (pathname: string) => boolean;
}

const PORTALS: HubPortal[] = [
  {
    id: "pdg",
    name: "Direction Générale (PDG)",
    role: "PDG",
    roleLabel: "Président Directeur Général",
    userDefault: "Jude Sinaberogui",
    href: "/pdg",
    icon: Crown,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    activeMatch: (p) => p.startsWith("/pdg"),
  },
  {
    id: "admin",
    name: "Administration Générale",
    role: "SUPER_ADMIN",
    roleLabel: "Super Administrateur",
    userDefault: "Marc Kouassi",
    href: "/admin",
    icon: ShieldCheck,
    color: "text-slate-800 bg-slate-100 border-slate-200",
    badgeBg: "bg-slate-900",
    badgeText: "text-white",
    activeMatch: (p) => p.startsWith("/admin"),
  },
  {
    id: "tresorerie",
    name: "Trésorerie & Caisse",
    role: "TREASURY_MANAGER",
    roleLabel: "Responsable Caisse",
    userDefault: "Amina Tidjani",
    href: "/tresorerie",
    icon: BadgeDollarSign,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    activeMatch: (p) => p.startsWith("/tresorerie"),
  },
  {
    id: "commercial",
    name: "Télévente & Commercial",
    role: "CLOSEUSE",
    roleLabel: "Closeuse Télévente",
    userDefault: "Sarah Kone",
    href: "/commercial",
    icon: Headset,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    activeMatch: (p) => p.startsWith("/commercial"),
  },
  {
    id: "livreur",
    name: "Flotte & Coursiers",
    role: "LIVREUR",
    roleLabel: "Livreur Moto",
    userDefault: "Paul Agossou",
    href: "/livreur",
    icon: Bike,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    activeMatch: (p) => p.startsWith("/livreur"),
  },
  {
    id: "dashboard",
    name: "Portail E-commerçant",
    role: "PARTNER",
    roleLabel: "Marchand Partenaire",
    userDefault: "Ma Boutique",
    href: "/dashboard",
    icon: Store,
    color: "text-emerald-700 bg-emerald-50/80 border-emerald-200",
    badgeBg: "bg-emerald-700",
    badgeText: "text-white",
    activeMatch: (p) => p.startsWith("/dashboard"),
  },
];

interface HubSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function HubSwitcher({ compact = false, className = "" }: HubSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { switchRole } = useOperations();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPortal = PORTALS.find((portal) => portal.activeMatch(pathname)) || PORTALS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (portal: HubPortal) => {
    switchRole(portal.role);
    setIsOpen(false);
    router.push(portal.href);
  };

  const CurrentIcon = currentPortal.icon;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
            : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90"
        } ${compact ? "p-1.5" : "px-2.5 sm:px-3 py-1.5"}`}
        title="Passerelle des Espaces ENO"
        aria-label="Changer d'espace"
      >
        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
          isOpen ? "bg-white/20 text-white" : currentPortal.color
        }`}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>

        {!compact && (
          <div className="hidden sm:flex flex-col text-left min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 leading-none">
              Espace
            </span>
            <span className="text-xs font-black truncate leading-tight mt-0.5">
              {currentPortal.name.split(" ")[0]}
            </span>
          </div>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/20 md:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 animate-fade-in-up overflow-hidden text-slate-900">
            {/* Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Passerelle des Espaces</h4>
                  <p className="text-[10px] text-slate-500">Bascule instantanée inter-rôles</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live ENO
              </span>
            </div>

            {/* Portals List */}
            <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto no-scrollbar">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                const isActive = portal.activeMatch(pathname);

                return (
                  <button
                    key={portal.id}
                    onClick={() => handleSelect(portal)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-bold"
                        : "hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isActive
                            ? "bg-white/10 text-white border-white/20"
                            : portal.color
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate leading-tight">
                          {portal.name}
                        </p>
                        <p
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {portal.userDefault} • {portal.roleLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      {isActive ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Toutes les interfaces partagent le même store en temps réel
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
