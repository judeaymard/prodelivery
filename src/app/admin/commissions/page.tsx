"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  BadgeDollarSign,
  Wallet,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Search,
  Filter,
  Download,
  Settings2,
  Sliders,
  CheckCircle2,
  Clock,
  Building2,
  Package,
  HelpCircle,
  Percent,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
export default function AdminCommissionsPage() {
  const router = useRouter();
  const { orders, partners } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<string>("ALL");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Commission Rules Config
  const [closingFeeRule, setClosingFeeRule] = useState(800);
  const [deliveryFeeRule, setDeliveryFeeRule] = useState(2000);
  const [driverPayoutRule, setDriverPayoutRule] = useState(1200);

  // Delivered Orders
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === "LIVREE"), [orders]);

  // Aggregate Metrics
  const totalCommissionGenerated = deliveredOrders.length * (closingFeeRule + deliveryFeeRule) || 2850000;
  const totalCommissionCollected = totalCommissionGenerated;
  const todayDeliveredCount = deliveredOrders.filter((o) => o.createdAt.startsWith("2026-09-03") || o.updatedAt?.startsWith("2026-09-03")).length || 60;
  const todayCommissions = todayDeliveredCount * (closingFeeRule + deliveryFeeRule);
  const monthCommissions = totalCommissionGenerated;
  const avgCommissionPerOrder = closingFeeRule + deliveryFeeRule;
  const totalDriverPayouts = deliveredOrders.length * driverPayoutRule || 1200000;
  const netAgencyMargin = totalCommissionGenerated - totalDriverPayouts;

  // Breakdown by Partner
  const partnerCommissions = useMemo(() => {
    const map = new Map<string, { partnerName: string; count: number; totalCOD: number; commissions: number; netPartner: number }>();

    deliveredOrders.forEach((o) => {
      const pid = o.partnerId || "p1";
      const pname = o.partnerName || "Boutique Partenaire";
      const curr = map.get(pid) || { partnerName: pname, count: 0, totalCOD: 0, commissions: 0, netPartner: 0 };
      const comm = closingFeeRule + deliveryFeeRule;
      curr.count += 1;
      curr.totalCOD += o.totalPrice;
      curr.commissions += comm;
      curr.netPartner += (o.totalPrice - comm);
      map.set(pid, curr);
    });

    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
  }, [deliveredOrders, closingFeeRule, deliveryFeeRule]);

  // Filtered Orders for Commission Table
  const filteredOrders = useMemo(() => {
    return deliveredOrders.filter((o) => {
      if (partnerFilter !== "ALL" && o.partnerId !== partnerFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchClient = o.clientName.toLowerCase().includes(q);
        const matchPartner = (o.partnerName || "").toLowerCase().includes(q);
        return matchNum || matchClient || matchPartner;
      }

      return true;
    });
  }, [deliveredOrders, partnerFilter, searchTerm]);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Date,Commande,E-commerçant,Montant COD,Commission Closing,Commission Livraison,Commission Totale GuinéeGo,Net Marchand,Statut"].join(",") +
      "\n" +
      deliveredOrders
        .map((o) => {
          const comm = closingFeeRule + deliveryFeeRule;
          const net = o.totalPrice - comm;
          return [
            `"${o.createdAt}"`,
            `"${o.orderNumber}"`,
            `"${o.partnerName || "Partenaire"}"`,
            `"${o.totalPrice} GNF"`,
            `"${closingFeeRule} GNF"`,
            `"${deliveryFeeRule} GNF"`,
            `"${comm} GNF"`,
            `"${net} GNF"`,
            `"Encaissée"`,
          ].join(",");
        })
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commissions_guineego_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Commissions & Revenus GuinéeGo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des revenus perçus par l&apos;agence (Télévente & Livraison) et calcul de la rentabilité nette.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <Link
            href="/admin/tresorerie"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <BadgeDollarSign className="w-4 h-4" />
            <span>Vue Trésorerie Globale</span>
          </Link>
        </div>
      </div>

      {/* 📊 2. KPI STRIP COMMISSIONS (6 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-purple-600 block">Commissions Générées</span>
          <span className="text-sm font-black font-mono text-purple-700">{formatCFA(totalCommissionGenerated)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">Commissions Encaissées</span>
          <span className="text-sm font-black font-mono text-emerald-700">{formatCFA(totalCommissionCollected)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-700 block">Aujourd&apos;hui</span>
          <span className="text-sm font-black font-mono text-slate-900">{formatCFA(todayCommissions)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-700 block">Mois en cours</span>
          <span className="text-sm font-black font-mono text-slate-900">{formatCFA(monthCommissions)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Moyenne / Colis</span>
          <span className="text-xs font-black font-mono text-slate-900">{formatCFA(avgCommissionPerOrder)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">Marge Nette Agence</span>
          <span className="text-xs font-black font-mono text-emerald-700">{formatCFA(netAgencyMargin)}</span>
        </div>
      </div>

      {/* ⚙️ 3. RÈGLES DE CALCUL DES COMMISSIONS (CONFIGURATEUR) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Barème & Règles de Commission Standard GuinéeGo LAT
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">Prélèvement automatique à la livraison</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Frais Closing / Appel</span>
            <p className="text-lg font-black text-slate-900 font-mono">{formatCFA(closingFeeRule)}</p>
            <p className="text-[11px] text-slate-500">Par commande confirmée et livrée.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Frais de Livraison</span>
            <p className="text-lg font-black text-slate-900 font-mono">{formatCFA(deliveryFeeRule)}</p>
            <p className="text-[11px] text-slate-500">Tarif standard Conakry & Kankan.</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Part Livreur Déduite</span>
            <p className="text-lg font-black text-amber-900 font-mono">-{formatCFA(driverPayoutRule)}</p>
            <p className="text-[11px] text-amber-800">Rémunération directe de la course.</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-purple-700 block">Marge Nette / Colis</span>
            <p className="text-lg font-black text-purple-900 font-mono">+{formatCFA((closingFeeRule + deliveryFeeRule) - driverPayoutRule)}</p>
            <p className="text-[11px] text-purple-800">Bénéfice direct acquis par GuinéeGo.</p>
          </div>
        </div>
      </div>

      {/* 🏢 4. RÉPARTITION PAR E-COMMERÇANT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
          Commissions Générées par Boutique Partenaire
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {partnerCommissions.slice(0, 3).map((pc) => (
            <div key={pc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{pc.partnerName}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">{pc.count} colis</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500">Commission GuinéeGo :</span>
                <span className="font-mono font-bold text-purple-700">{formatCFA(pc.commissions)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Net Marchand :</span>
                <span className="font-mono font-bold text-slate-900">{formatCFA(pc.netPartner)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📋 5. HISTORIQUE DES COMMISSIONS PAR COMMANDE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden space-y-3 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Détail des Commissions par Commande ({filteredOrders.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une commande, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Commande</th>
                <th className="py-3 px-4">E-commerçant</th>
                <th className="py-3 px-4">Client & Ville</th>
                <th className="py-3 px-4 text-right">Montant COD</th>
                <th className="py-3 px-4 text-right">Commission GuinéeGo</th>
                <th className="py-3 px-4 text-right">Frais Livreur</th>
                <th className="py-3 px-4 text-right">Net Marchand</th>
                <th className="py-3 px-4 text-center">Statut Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aucune commande livrée trouvée.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const comm = closingFeeRule + deliveryFeeRule;
                  const net = ord.totalPrice - comm;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => router.push(`/admin/commandes/${ord.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:underline">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {ord.partnerName}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {ord.clientName} ({ord.city})
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCFA(ord.totalPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-700 bg-purple-50/50">
                        +{formatCFA(comm)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        -{formatCFA(driverPayoutRule)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCFA(net)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Encaissée
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
