"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  BadgeDollarSign,
  Wallet,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function AdminCommissionsPage() {
  const { orders } = useOperations();

  const deliveredOrders = orders.filter((o) => o.status === "LIVREE");
  const totalCOD = deliveredOrders.reduce((acc, curr) => acc + curr.totalPrice, 0) || 1847500;
  const closingCommissions = deliveredOrders.length * 800;
  const deliveryCommissions = deliveredOrders.length * 2000;
  const totalRevenue = closingCommissions + deliveryCommissions;
  const driverPay = Math.round(deliveryCommissions * 0.6);
  const netAgencyProfit = totalRevenue - driverPay;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Commissions & Revenus Agence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Détail de la rentabilité opérationnelle (800 GNF Closing + 2 000 GNF Livraison par colis livré).
          </p>
        </div>

        <Link
          href="/admin/finances"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors self-start sm:self-center"
        >
          <BadgeDollarSign className="w-4 h-4" />
          <span>Arbitrage des Retraits</span>
        </Link>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenu Brut Prestations</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{formatCFA(totalRevenue)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Sur {deliveredOrders.length} colis livrés</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rémunération Coursiers</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-700 font-mono">{formatCFA(driverPay)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Charges directes de livraison</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Marge Nette Agence</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{formatCFA(netAgencyProfit)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Après charges opérationnelles</p>
        </div>
      </div>

      {/* Breakdown Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h3 className="text-base font-black text-slate-900">Grille Tarifaire des Prestations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Prestation de Télévente & Closing</span>
            <p className="text-slate-500">800 GNF facturés uniquement sur commande confirmée et livrée.</p>
            <p className="font-mono font-bold text-slate-900 pt-1">Total collecté : {formatCFA(closingCommissions)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Prestation Logistique & Livraison</span>
            <p className="text-slate-500">2 000 GNF par colis remis au client final à Conakry et Kankan.</p>
            <p className="font-mono font-bold text-slate-900 pt-1">Total collecté : {formatCFA(deliveryCommissions)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
