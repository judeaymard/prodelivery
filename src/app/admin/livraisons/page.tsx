"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bike,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Phone,
  ArrowRight,
  Shield,
  Package,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function AdminLivraisonsPage() {
  const { orders, livreurs, markOrderDelivered } = useOperations();
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const inDeliveryOrders = orders.filter((o) => o.status === "EN_COURS" || o.status === "CONFIRMEE");
  const deliveredTodayOrders = orders.filter((o) => o.status === "LIVREE");

  const filteredOrders = inDeliveryOrders.filter((ord) => {
    const matchesZone = selectedZone === "ALL" || ord.city.toLowerCase().includes(selectedZone.toLowerCase());
    const matchesSearch =
      ord.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.clientPhone.includes(searchTerm);
    return matchesZone && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Suivi des Livraisons en Direct</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision temps réel des colis en cours d&apos;acheminement et des tournées coursiers.
          </p>
        </div>

        <Link
          href="/admin/livreurs"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors self-start sm:self-center"
        >
          <Bike className="w-4 h-4" />
          <span>Gestion de la Flotte</span>
        </Link>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">En Cours de Livraison</span>
          <p className="text-3xl font-black text-slate-900">{inDeliveryOrders.length}</p>
          <p className="text-[11px] text-slate-400">Colis actuellement en sacoche</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Livrées Aujourd&apos;hui</span>
          <p className="text-3xl font-black text-emerald-600">{deliveredTodayOrders.length}</p>
          <p className="text-[11px] text-slate-400">Colis remis avec succès</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Livreurs Déployés</span>
          <p className="text-3xl font-black text-slate-900">{livreurs.length}</p>
          <p className="text-[11px] text-slate-400">Conakry, Kankan, Kindia</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs">
        <div className="sm:col-span-5">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">Toutes les Zones de Livraison</option>
            <option value="Conakry">Conakry (Kaloum, Dixinn, Ratoma, Matam, Matoto)</option>
            <option value="Kankan">Abomey-Kankan (Tankpè, IITA, Zogbadjè)</option>
            <option value="Mamou">Mamou & Ouando</option>
          </select>
        </div>

        <div className="sm:col-span-7 relative">
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

      {/* Active Deliveries Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Réf & Marchand</th>
                <th className="py-3.5 px-5">Client & Destination</th>
                <th className="py-3.5 px-5">Montant COD</th>
                <th className="py-3.5 px-5">Coursier Assigné</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Aucune livraison en cours pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                      <p className="text-[11px] text-slate-400">{ord.partnerName || "—"}</p>
                    </td>

                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{ord.clientName}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ord.city} • {ord.address}</span>
                      </p>
                    </td>

                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {formatCFA(ord.totalPrice)}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Bike className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ord.assignedLivreurName || "En cours d'attribution"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ord.deliveryTimeSlot || "Créneau standard"}</span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {ord.status === "EN_COURS" ? "En route" : "Prête"}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => markOrderDelivered(ord.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Valider Remise
                      </button>
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
