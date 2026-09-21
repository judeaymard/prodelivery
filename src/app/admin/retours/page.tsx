"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  AlertTriangle,
  Search,
  Package,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function AdminRetoursPage() {
  const { orders } = useOperations();
  const [searchTerm, setSearchTerm] = useState("");

  const returnedOrders = orders.filter((o) => o.status === "RETOURNEE" || o.status === "REFUSEE");

  const filteredRetours = returnedOrders.filter((ord) =>
    ord.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ord.clientPhone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestion des Retours & Litiges</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des colis non aboutis, retours en stock entrepôt et motif de refus client.
          </p>
        </div>

        <Link
          href="/admin/commandes"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors self-start sm:self-center"
        >
          <Package className="w-4 h-4" />
          <span>Toutes les Commandes</span>
        </Link>
      </div>

      {/* 3 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Total Retours / Refus</span>
          <p className="text-3xl font-black text-slate-900">{returnedOrders.length}</p>
          <p className="text-[11px] text-slate-400">Taux de retour : ~8%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valeur Marchandises</span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {formatCFA(returnedOrders.reduce((acc, curr) => acc + curr.totalPrice, 0))}
          </p>
          <p className="text-[11px] text-slate-400">À réintégrer dans l&apos;inventaire</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Taux Réintégration</span>
          <p className="text-3xl font-black text-emerald-600">100%</p>
          <p className="text-[11px] text-slate-400">Entrepôt central Conakry</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher client, colis (#CMD), téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Réf & Marchand</th>
                <th className="py-3.5 px-5">Client & Destination</th>
                <th className="py-3.5 px-5">Montant Colis</th>
                <th className="py-3.5 px-5">Motif Signalé</th>
                <th className="py-3.5 px-5">Statut Entrepôt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRetours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Aucun retour enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                filteredRetours.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                      <p className="text-[11px] text-slate-400">{ord.partnerName || "Marchand"}</p>
                    </td>

                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{ord.clientName}</p>
                      <p className="text-[11px] text-slate-400">{ord.city}</p>
                    </td>

                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {formatCFA(ord.totalPrice)}
                    </td>

                    <td className="py-3.5 px-5 text-rose-700 font-semibold">
                      {ord.comment || "Client indisponible lors du passage"}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                        Stock Réintégré
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
