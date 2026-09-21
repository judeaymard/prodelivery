"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Bike,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  AlertCircle,
  Truck,
  TrendingUp,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { LivreurStatus } from "@/lib/types";

export default function LivreurProfilPage() {
  const {
    activeLivreur,
    activeLivreurId,
    livreurs,
    switchRole,
    updateLivreurAvailability,
  } = useOperations();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentStatus: LivreurStatus = activeLivreur?.availabilityStatus || "AVAILABLE";

  const handleSetStatus = (status: LivreurStatus) => {
    if (!activeLivreur) return;
    updateLivreurAvailability(activeLivreur.id, status);
    triggerToast(`Statut mis à jour : ${status === "AVAILABLE" ? "Disponible" : status === "IN_TRANSIT" ? "En tournée" : status === "PAUSED" ? "En pause" : "Hors ligne"}`);
  };

  const initials = activeLivreur?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "CR";

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 md:top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
          <User className="w-3 h-3 text-emerald-600" />
          <span>Profil & Disponibilité</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mon Profil Coursier</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gérez votre statut opérationnel en direct et consultez vos paramètres de tournée
        </p>
      </div>

      {/* Carte d'identité du coursier */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{activeLivreur?.name || "Coursier GuinéeGo"}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{activeLivreur?.phone || "—"}</span>
              {activeLivreur?.email && (
                <>
                  <span>·</span>
                  <span>{activeLivreur.email}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Zone : {activeLivreur?.zone || "—"}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Véhicule : {activeLivreur?.vehicle || "Moto"}
              </span>
            </div>
          </div>
        </div>

        {/* Sélecteur de test profil */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 sm:text-right">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Changer de compte coursier :
          </span>
          <select
            value={activeLivreurId}
            onChange={(e) => switchRole("LIVREUR", e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-500 cursor-pointer"
          >
            {livreurs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.zone.split(" ")[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sélecteur de Statut Opérationnel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Statut Opérationnel en Direct</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Votre statut détermine si l'algorithme d'affectation et les closeuses peuvent vous attribuer de nouveaux colis
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => handleSetStatus("AVAILABLE")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentStatus === "AVAILABLE"
                ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold">Disponible</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Prêt à recevoir des courses</p>
          </button>

          <button
            onClick={() => handleSetStatus("IN_TRANSIT")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentStatus === "IN_TRANSIT"
                ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold">En tournée</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sur la route / livraisons</p>
          </button>

          <button
            onClick={() => handleSetStatus("PAUSED")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentStatus === "PAUSED"
                ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-500"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold">En pause</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Arrêt temporaire</p>
          </button>

          <button
            onClick={() => handleSetStatus("OFFLINE")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentStatus === "OFFLINE"
                ? "bg-slate-100 border-slate-500 text-slate-900 shadow-xs ring-1 ring-slate-500"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-bold">Hors ligne</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Service clôturé</p>
          </button>
        </div>
      </div>

      {/* Métriques de performance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Mes Statistiques & Performance
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Indicateurs consolidés sur l'ensemble de votre activité</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Taux de réussite</span>
            <p className="text-xl font-black text-emerald-700 mt-1">
              {activeLivreur?.successRate ? `${activeLivreur.successRate}%` : "0%"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Livrées aujourd'hui</span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {activeLivreur?.deliveredTodayCount || 0}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Capacité active max</span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {activeLivreur?.maxActiveCapacity ? `${activeLivreur.maxActiveCapacity} colis` : "—"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Temps moyen course</span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {activeLivreur?.avgDeliveryTimeMinutes ? `${activeLivreur.avgDeliveryTimeMinutes} min` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
