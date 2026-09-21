"use client";

import React, { useState } from "react";
import {
  Search,
  Calendar,
  Filter,
  MessageSquare,
  Phone,
  Plus,
  Download,
  MapPin,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { ORDER_STATUS_CONFIG } from "@/lib/types";
import NewOrderModal from "@/components/dashboard/NewOrderModal";

export default function CommandesPage() {
  const { orders, activePartner, currentPartner } = useOperations();
  const partnerId = activePartner?.id || currentPartner.id;
  const partnerOrders = orders.filter((o) => o.partnerId === partnerId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status counters
  const totalCount = partnerOrders.length;
  const deliveredCount = partnerOrders.filter((o) => o.status === "LIVREE").length;
  const recallCount = partnerOrders.filter((o) => o.status === "A_RAPPELER").length;
  const inProgressCount = partnerOrders.filter((o) => o.status === "EN_COURS").length;
  const refusedCount = partnerOrders.filter((o) => o.status === "REFUSEE").length;

  const filteredOrders = partnerOrders.filter((ord) => {
    const matchesSearch =
      ord.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.clientPhone.includes(searchTerm) ||
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || ord.status === selectedStatus;
    const matchesDate = !selectedDate || ord.createdAt.startsWith(selectedDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = "N° Commande,Client,Téléphone,Adresse,Produits,Quantité,Prix Total,Statut,Date\n";
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.clientName}","${o.clientPhone}","${o.address}","${o.products}",${o.quantity},${o.totalPrice},"${o.status}","${o.createdAt}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `expeditions-eno-livraison-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#EAE6DD]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#787163]">
            <span>Journal Logistique</span>
            <span>•</span>
            <span className="text-[#e52320]">{filteredOrders.length} expéditions enregistrées</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-[#141A17] tracking-tight mt-1">
            Livre des Expéditions
          </h2>
          <p className="text-xs text-[#787163] mt-1">
            Suivi complet de vos clôtures d&apos;appels, livraisons physiques et encaissements Cash On Delivery.
          </p>
        </div>

        {/* Top Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#EAE6DD] hover:bg-[#FAF9F5] text-[#141A17] text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#e52320]" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#141A17] hover:bg-[#e52320] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Nouvelle Expédition</span>
          </button>
        </div>
      </div>

      {/* 📊 STATUS COUNTER PILLS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Tous */}
        <button
          onClick={() => setSelectedStatus("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === "ALL"
              ? "bg-white border-[#e52320] shadow-xs"
              : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-[#787163] font-bold uppercase tracking-wider mb-1">
            <span>Toutes</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#141A17]"></span>
          </div>
          <p className="text-2xl font-black text-[#141A17]">{totalCount}</p>
        </button>

        {/* Livrées */}
        <button
          onClick={() => setSelectedStatus("LIVREE")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === "LIVREE"
              ? "bg-white border-[#e52320] shadow-xs"
              : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-[#e52320] font-bold uppercase tracking-wider mb-1">
            <span>Livrées</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e52320]"></span>
          </div>
          <p className="text-2xl font-black text-[#e52320]">{deliveredCount}</p>
        </button>

        {/* A Rappeler */}
        <button
          onClick={() => setSelectedStatus("A_RAPPELER")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === "A_RAPPELER"
              ? "bg-white border-[#e52320] shadow-xs"
              : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-[#A84232] font-bold uppercase tracking-wider mb-1">
            <span>À rappeler</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#A84232]"></span>
          </div>
          <p className="text-2xl font-black text-[#A84232]">{recallCount}</p>
        </button>

        {/* En Cours */}
        <button
          onClick={() => setSelectedStatus("EN_COURS")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === "EN_COURS"
              ? "bg-white border-[#e52320] shadow-xs"
              : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-[#141A17] font-bold uppercase tracking-wider mb-1">
            <span>En cours</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#141A17]"></span>
          </div>
          <p className="text-2xl font-black text-[#141A17]">{inProgressCount}</p>
        </button>

        {/* Refusées */}
        <button
          onClick={() => setSelectedStatus("REFUSEE")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === "REFUSEE"
              ? "bg-white border-[#e52320] shadow-xs"
              : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-[#787163] font-bold uppercase tracking-wider mb-1">
            <span>Refusées</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#787163]"></span>
          </div>
          <p className="text-2xl font-black text-[#787163]">{refusedCount}</p>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white border border-[#EAE6DD] p-3.5 rounded-2xl shadow-2xs">
        {/* Date Filter */}
        <div className="sm:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8474]">
            <Calendar className="w-3.5 h-3.5 text-[#e52320]" />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div className="sm:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8474]">
            <Filter className="w-3.5 h-3.5 text-[#e52320]" />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
          >
            <option value="ALL">Tous les statuts d&apos;expédition</option>
            <option value="LIVREE">Livrée (Cash Encaissé)</option>
            <option value="A_RAPPELER">À rappeler (Relance Closeuse)</option>
            <option value="EN_COURS">En cours de livraison</option>
            <option value="CONFIRMEE">Confirmée par Téléphone</option>
            <option value="EN_ATTENTE">En attente de prise en charge</option>
            <option value="REFUSEE">Refusée client</option>
            <option value="ANNULEE">Annulée</option>
            <option value="RETOURNEE">Retournée entrepôt</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8474]">
            <Search className="w-3.5 h-3.5 text-[#8C8474]" />
          </div>
          <input
            type="text"
            placeholder="Chercher client, téléphone, N°, quartier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ORDERS DATA TABLE */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl shadow-[0_2px_12px_rgba(20,26,23,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-[#EAE6DD] text-[#787163] font-bold uppercase tracking-[0.15em] text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">N° Commande</th>
                <th className="py-3.5 px-5">Client & Contact</th>
                <th className="py-3.5 px-5">Destination</th>
                <th className="py-3.5 px-5">Articles</th>
                <th className="py-3.5 px-3 text-center">Qté</th>
                <th className="py-3.5 px-5">Prix Total</th>
                <th className="py-3.5 px-5">Frais GuinéeGo</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5">Note Closeuse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DD]/60 font-medium text-[#141A17]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#787163] text-xs">
                    Aucune expédition ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isDelivered = ord.status === "LIVREE";
                  const isRecall = ord.status === "A_RAPPELER";

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF9F5]/70 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-5 font-medium text-[#5C5649]">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(ord.createdAt))}
                      </td>

                      {/* Order Number */}
                      <td className="py-3.5 px-5 font-mono font-bold text-[#e52320]">{ord.orderNumber}</td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-[#141A17]">{ord.clientName}</p>
                        <a
                          href={`https://wa.me/${ord.clientPhone.replace(/\s+/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#787163] hover:text-[#e52320] flex items-center gap-1 mt-0.5 font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{ord.clientPhone}</span>
                        </a>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-5 text-[#5C5649]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8C8474] shrink-0" />
                          <span>{ord.address}</span>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-5 text-[#141A17] uppercase font-bold">{ord.products}</td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-center font-bold text-[#141A17]">{ord.quantity}</td>

                      {/* Total Price */}
                      <td className="py-3.5 px-5 font-black text-[#141A17] text-sm">
                        {ord.totalPrice.toLocaleString("fr-FR")} GNF
                      </td>

                      {/* Fees */}
                      <td className="py-3.5 px-5 text-[11px] text-[#5C5649]">
                        <span className="font-bold text-[#141A17]">2 800 F</span> (Closing + Liv)
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isDelivered
                              ? "bg-[#FAF9F5] text-[#e52320] border-[#e52320]/30"
                              : isRecall
                              ? "bg-[#FAF9F5] text-[#A84232] border-[#A84232]/30"
                              : "bg-[#FAF9F5] text-[#141A17] border-[#141A17]/30"
                          }`}
                        >
                          {isDelivered ? "LIVRÉE" : isRecall ? "À RAPPELER" : "EN ROUTE"}
                        </span>
                      </td>

                      {/* Comment */}
                      <td className="py-3.5 px-5 text-[#787163] text-xs">
                        {ord.comment ? (
                          <span className="flex items-center gap-1.5 font-medium text-[#5C5649]">
                            <MessageSquare className="w-3.5 h-3.5 text-[#e52320] shrink-0" />
                            <span className="truncate max-w-[200px]">{ord.comment}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global New Order Modal */}
      <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
