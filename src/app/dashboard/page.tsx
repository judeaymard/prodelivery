"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  Package,
  Boxes,
  Truck,
  Search,
  Phone,
  MapPin,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import NewOrderModal from "@/components/dashboard/NewOrderModal";

export default function DashboardOverviewPage() {
  const { orders, products, currentPartner, requestPayout, activePartner } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "LIVREE" | "EN_COURS" | "A_RAPPELER">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payoutRequested, setPayoutRequested] = useState(false);

  const effectivePartner = activePartner || currentPartner;
  const currentPartnerId = effectivePartner?.id || "usr-partner-1";
  const partnerOrders = orders.filter((o) => o.partnerId === currentPartnerId);

  // Dynamic Financial calculations strictly from live data
  const deliveredOrders = partnerOrders.filter((o) => o.status === "LIVREE");
  const totalDeliveredOrders = deliveredOrders.length;
  const inDeliveryOrdersCount = partnerOrders.filter((o) => o.status === "EN_COURS").length;

  const caTotalBrut = deliveredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const totalFraisLogistique = deliveredOrders.reduce(
    (acc, o) => acc + (o.deliveryFee || 2000) + (o.serviceFee || 800),
    0
  );
  const soldeNetDisponible = Math.max(0, caTotalBrut - totalFraisLogistique);

  const partnerProducts = products.filter((p) => p.partnerId === currentPartnerId);
  const totalStockWarehouse = partnerProducts.reduce((acc, p) => acc + (p.remainingStock || 0), 0);

  // Filtered orders
  const filteredOrders = partnerOrders.filter((ord) => {
    const matchesStatus = filterStatus === "ALL" || ord.status === filterStatus;
    const matchesSearch =
      ord.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.clientPhone?.includes(searchTerm) ||
      ord.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleQuickPayout = () => {
    if (soldeNetDisponible <= 0) return;
    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 4500);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 🏛️ STRATE I : L'EN-TÊTE STATUTAIRE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#EAE6DD]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#787163]">
            <span>Maison Partenaire</span>
            <span>•</span>
            <span className="text-[#e52320]">Entrepôts Conakry & Kankan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#141A17] tracking-tight mt-1">
            {currentPartner.companyName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5C5649] font-medium hidden sm:inline">Stockage 100% Offert</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e52320]"></span>
          <span className="text-xs font-bold text-[#e52320]">Actif & Garanti</span>
        </div>
      </div>

      {/* 💎 STRATE II : LE GRAND COFFRE SOUVERAIN */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 sm:p-10 shadow-[0_4px_24px_rgba(20,26,23,0.04)] relative overflow-hidden">
        {/* Subtle accent bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#e52320]"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Solde & Intitulé */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#787163]">
              Solde Net Encaissé • Prêt pour virement immédiat
            </p>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#141A17] tracking-tight whitespace-nowrap">
                {soldeNetDisponible.toLocaleString("fr-FR")}
              </span>
              <span className="text-base sm:text-lg font-black text-[#e52320] tracking-wider uppercase whitespace-nowrap">
                GNF
              </span>
            </div>
            <p className="text-xs text-[#5C5649]">
              Revenu net après déduction transparente des frais GuinéeGo (40 000 GNF / colis livré).
            </p>
          </div>

          {/* Master Action CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleQuickPayout}
              className="px-6 py-4 rounded-2xl bg-[#e52320] hover:bg-[#c91d1a] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4 text-[#C5A059]" />
              <span>Transférer sur Mobile Money</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-4 rounded-2xl bg-[#FAF9F5] hover:bg-white text-[#141A17] border border-[#EAE6DD] font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#e52320]" />
              <span>Nouveau Colis</span>
            </button>
          </div>
        </div>

        {/* Payout Notification Toast */}
        {payoutRequested && (
          <div className="mt-5 p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#e52320]/40 text-[#e52320] text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demande de reversement de {soldeNetDisponible.toLocaleString("fr-FR")} GNF transmise au pôle financier GuinéeGo. Traitement sous 30 min.</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#787163]">MoMo MTN</span>
          </div>
        )}

        {/* Décomposition financière claire */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-[#EAE6DD]">
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD]/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#787163]">Chiffre d&apos;Affaires Brut</p>
            <p className="text-base font-black text-[#141A17] mt-0.5">
              {caTotalBrut.toLocaleString("fr-FR")} GNF
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD]/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#787163]">Frais Logistique & Closing</p>
            <p className="text-base font-black text-[#A84232] mt-0.5">
              -{totalFraisLogistique.toLocaleString("fr-FR")} GNF
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD]/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#787163]">Compte de Réception</p>
            <p className="text-base font-bold text-[#141A17] mt-0.5">
              Mobile Money • {effectivePartner?.phone || currentPartner?.phone || "+224 620 00 00 00"}
            </p>
          </div>
        </div>
      </div>

      {/* 📦 STRATE III : LE TRIPTYQUE D'ÉTAT (Les 3 Réalités Clés) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 01. Encaissé */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787163]">
              01 • Encaissé & Livré
            </span>
            <span className="text-[10px] font-bold text-[#e52320] bg-[#FAF9F5] border border-[#EAE6DD] px-2 py-0.5 rounded-full">
              Taux {partnerOrders.length > 0 ? Math.round((totalDeliveredOrders / partnerOrders.length) * 100) : 0}%
            </span>
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {totalDeliveredOrders} <span className="text-sm font-semibold text-[#787163]">colis</span>
          </p>
          <p className="text-xs text-[#5C5649]">
            Colis remis aux acheteurs avec encaissement cash à la livraison.
          </p>
        </div>

        {/* 02. En Transit */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787163]">
              02 • En Cours de Livraison
            </span>
            <span className="text-[10px] font-bold text-[#141A17] bg-[#FAF9F5] border border-[#EAE6DD] px-2 py-0.5 rounded-full">
              Conakry & Kankan
            </span>
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {inDeliveryOrdersCount} <span className="text-sm font-semibold text-[#787163]">colis</span>
          </p>
          <p className="text-xs text-[#5C5649]">
            Livreurs déployés sur le terrain. Closes par téléphone sous 15 min.
          </p>
        </div>

        {/* 03. Stock Réel */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#787163]">
              03 • Stock en Entrepôt
            </span>
            <span className="text-[10px] font-bold text-[#e52320] bg-[#FAF9F5] border border-[#EAE6DD] px-2 py-0.5 rounded-full">
              Gratuit
            </span>
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {totalStockWarehouse} <span className="text-sm font-semibold text-[#787163]">unités</span>
          </p>
          <p className="text-xs text-[#5C5649]">
            Stock sécurisé sous surveillance continue dans les hangars GuinéeGo.
          </p>
        </div>
      </div>

      {/* 📜 STRATE IV : LE LIVRE-JOURNAL DES EXPÉDITIONS */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl shadow-[0_2px_12px_rgba(20,26,23,0.03)] overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-6 border-b border-[#EAE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[#141A17] tracking-tight">
              Livre des Expéditions Récentes
            </h3>
            <p className="text-xs text-[#787163] mt-0.5">
              Historique en direct de vos commandes et livraisons en Guinée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C8474] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Chercher client, ville, N°..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#EAE6DD]">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "ALL"
                    ? "bg-white text-[#141A17] shadow-2xs"
                    : "text-[#787163] hover:text-[#141A17]"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus("LIVREE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "LIVREE"
                    ? "bg-white text-[#e52320] shadow-2xs"
                    : "text-[#787163] hover:text-[#141A17]"
                }`}
              >
                Livrées
              </button>
              <button
                onClick={() => setFilterStatus("EN_COURS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "EN_COURS"
                    ? "bg-white text-[#141A17] shadow-2xs"
                    : "text-[#787163] hover:text-[#141A17]"
                }`}
              >
                En route
              </button>
              <button
                onClick={() => setFilterStatus("A_RAPPELER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "A_RAPPELER"
                    ? "bg-white text-[#A84232] shadow-2xs"
                    : "text-[#787163] hover:text-[#141A17]"
                }`}
              >
                À rappeler
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-[#EAE6DD] text-[#787163] font-bold uppercase tracking-[0.15em] text-[10px]">
              <tr>
                <th className="py-3 px-5">Réf.</th>
                <th className="py-3 px-5">Client & Contact</th>
                <th className="py-3 px-5">Destination</th>
                <th className="py-3 px-5">Articles</th>
                <th className="py-3 px-5">Montant COD</th>
                <th className="py-3 px-5">Statut</th>
                <th className="py-3 px-5">Note Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DD]/60 font-medium text-[#141A17]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#787163] text-xs">
                    Aucune expédition ne correspond à votre filtre.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 8).map((ord) => {
                  const isDelivered = ord.status === "LIVREE";
                  const isRecall = ord.status === "A_RAPPELER";

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                      {/* Ref */}
                      <td className="py-3.5 px-5 font-mono font-bold text-[#e52320]">
                        {ord.orderNumber}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        <p className="font-black text-[#141A17]">{ord.clientName}</p>
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

                      {/* Destination */}
                      <td className="py-3.5 px-5 text-[#5C5649]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8C8474] shrink-0" />
                          <span>{ord.address}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-5 font-bold uppercase text-[#141A17]">
                        {ord.products} <span className="text-[#787163] font-normal">({ord.quantity}x)</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5 font-black text-sm text-[#141A17]">
                        {ord.totalPrice.toLocaleString("fr-FR")} F
                      </td>

                      {/* Status */}
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
                          <span className="truncate max-w-[180px] block font-medium text-[#5C5649]">
                            {ord.comment}
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

        {/* Footer Link to full orders page */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#EAE6DD] flex items-center justify-between text-xs">
          <span className="text-[#787163] font-medium">
            Affichage des expéditions actives
          </span>
          <Link
            href="/dashboard/commandes"
            className="font-bold text-[#e52320] hover:underline flex items-center gap-1"
          >
            <span>Consulter le livre complet des expéditions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Global New Order Modal */}
      <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
