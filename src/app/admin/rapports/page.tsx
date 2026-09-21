"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Table,
  Filter,
  Building2,
  Bike,
  PhoneCall,
  DollarSign,
  ArrowDownToLine,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function AdminRapportsPage() {
  const { period, setPeriod } = useOperations();
  const [downloadingTarget, setDownloadingTarget] = useState<string | null>(null);

  const handleExport = async (target: string) => {
    setDownloadingTarget(target);
    try {
      const res = await fetch(`/api/reports?type=export&target=${target}&period=${period}`);
      if (!res.ok) throw new Error("Erreur export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-eno-${target}-${period.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
    } finally {
      setDownloadingTarget(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Rapports d&apos;Activité & Exports</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold">CSV / EXCEL</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Génération et téléchargement des rapports comptables, logistiques et télévente basés sur les données réelles.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-center shrink-0">
          {(
            [
              { id: "TODAY", label: "Aujourd'hui" },
              { id: "7D", label: "7 jours" },
              { id: "30D", label: "30 jours" },
              { id: "THIS_MONTH", label: "Ce mois" },
              { id: "YEAR", label: "Cette année" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === t.id
                  ? "bg-white text-slate-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rapport 1 : Global & Commandes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Table className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Rapport des Commandes</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export exhaustif de toutes les commandes avec coordonnées clients, statuts et montants réels.
            </p>
          </div>
          <button
            onClick={() => handleExport("orders")}
            disabled={downloadingTarget === "orders"}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingTarget === "orders" ? "Exportation..." : "Télécharger (CSV)"}</span>
          </button>
        </div>

        {/* Rapport 2 : Financier & COD */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Rapport Financier & Trésorerie</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Grand livre complet, entrées/sorties de fonds, déductions de commissions et soldes marchands.
            </p>
          </div>
          <button
            onClick={() => handleExport("finance")}
            disabled={downloadingTarget === "finance"}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingTarget === "finance" ? "Exportation..." : "Télécharger (CSV)"}</span>
          </button>
        </div>

        {/* Rapport 3 : Logistique & Livraisons */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Rapport Flotte & Tournées</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Performance par coursier, colis livrés, taux de succès par zone et montants collectés.
            </p>
          </div>
          <button
            onClick={() => handleExport("delivery")}
            disabled={downloadingTarget === "delivery"}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingTarget === "delivery" ? "Exportation..." : "Télécharger (CSV)"}</span>
          </button>
        </div>

        {/* Rapport 4 : Marchands & Partenaires */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Rapport des Marchands</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chiffre d&apos;affaires brut généré par boutique, commissions GuinéeGo et soldes disponibles.
            </p>
          </div>
          <button
            onClick={() => handleExport("merchants")}
            disabled={downloadingTarget === "merchants"}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingTarget === "merchants" ? "Exportation..." : "Télécharger (CSV)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
