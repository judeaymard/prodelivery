"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  Download,
  ArrowUpDown,
  Phone,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order } from "@/lib/types";

export default function LivreurHistoriquePage() {
  const { orders, activeLivreur } = useOperations();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<"ALL" | "LIVREE" | "REFUSEE" | "RETOURNEE">("ALL");

  // Historique complet des courses terminées du livreur
  const pastOrders = useMemo(() => {
    if (!activeLivreur) return [];
    return orders.filter(
      (o) =>
        o.assignedLivreurId === activeLivreur.id &&
        ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)
    );
  }, [orders, activeLivreur]);

  // Filtrage
  const filteredOrders = useMemo(() => {
    return pastOrders.filter((order) => {
      if (filterOutcome !== "ALL" && order.status !== filterOutcome) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.clientName.toLowerCase().includes(q) ||
          (order.clientPhone || "").toLowerCase().includes(q) ||
          (order.city || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pastOrders, filterOutcome, searchTerm]);

  // Synthèse des performances historiques
  const stats = useMemo(() => {
    const total = pastOrders.length;
    const delivered = pastOrders.filter((o) => o.status === "LIVREE").length;
    const failed = total - delivered;
    const totalCod = pastOrders
      .filter((o) => o.status === "LIVREE")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 100;

    return { total, delivered, failed, totalCod, rate };
  }, [pastOrders]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <History className="w-3 h-3 text-emerald-600" />
            <span>Historique & Archives</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Historique des Courses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez l'ensemble de vos courses terminées, livrées ou clôturées
          </p>
        </div>
      </div>

      {/* KPI Historiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Courses archivées</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500 font-semibold">colis clôturés</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Livrées avec succès</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.delivered}</p>
          <span className="text-[10px] text-emerald-600/80 font-semibold">taux : {stats.rate}%</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider">Échecs / Retours</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.failed}</p>
          <span className="text-[10px] text-rose-500/80 font-semibold">refus ou reports</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total COD Encaissé</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCFA(stats.totalCod)}</p>
          <span className="text-[10px] text-slate-500 font-semibold">sur les livrées</span>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par n° commande, nom client, ville..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setFilterOutcome("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterOutcome === "ALL" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilterOutcome("LIVREE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterOutcome === "LIVREE" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Livrées ({stats.delivered})
          </button>
          <button
            onClick={() => setFilterOutcome("REFUSEE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterOutcome === "REFUSEE" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Refusées ({pastOrders.filter((o) => o.status === "REFUSEE").length})
          </button>
          <button
            onClick={() => setFilterOutcome("RETOURNEE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterOutcome === "RETOURNEE" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Retournées ({pastOrders.filter((o) => o.status === "RETOURNEE").length})
          </button>
        </div>
      </div>

      {/* Liste des courses historiques */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Aucune archive disponible</p>
            <p className="text-[11px] text-slate-400">Les courses traitées s'afficheront ici au fur et à mesure.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "LIVREE";
              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{order.orderNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {order.partnerName || "Marchand"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDelivered
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isDelivered ? "Livrée & Encaissée" : `Échec (${order.status})`}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 truncate">{order.clientName}</p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span>{order.address}, {order.city || order.region}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Colis : {order.products} (Qté : {order.quantity || 1})
                    </p>
                    {order.deliveredAt && (
                      <p className="text-[10px] text-slate-400">
                        Date de clôture : {order.deliveredAt}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-[9px] text-slate-400 uppercase font-extrabold">Montant</span>
                    <p className="text-base font-black text-slate-900">{formatCFA(order.totalPrice)}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isDelivered ? "Encaissé en espèces" : "Non encaissé"}
                    </span>
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
