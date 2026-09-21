"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Wallet,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Download,
  X,
  CreditCard,
} from "lucide-react";
import { useOperations } from "@/lib/store";

export default function FinancesPage() {
  const { orders, currentPartner, activePartner, requestPayout, payoutRequests } = useOperations();
  const effectivePartner = activePartner || currentPartner;
  const currentPartnerId = effectivePartner?.id || "usr-partner-1";
  const partnerOrders = orders.filter((o) => o.partnerId === currentPartnerId);

  const deliveredOrders = partnerOrders.filter((o) => o.status === "LIVREE");
  const deliveredOrdersCount = deliveredOrders.length;
  const totalOrdersCount = partnerOrders.length;

  const caTotal = deliveredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const commissions = deliveredOrders.reduce((acc, o) => acc + (o.deliveryFee || 0) + (o.serviceFee || 0), 0);
  const dejaRetire = payoutRequests
    .filter((p) => p.partnerId === currentPartnerId && (p.status === "PAID" || p.status === "APPROVED"))
    .reduce((sum, p) => sum + p.amount, 0);
  const revenuNet = effectivePartner?.availableBalance !== undefined && effectivePartner.availableBalance > 0
    ? effectivePartner.availableBalance
    : Math.max(0, caTotal - commissions - dejaRetire);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(revenuNet > 0 ? String(revenuNet) : "0");
  const [payoutMethod, setPayoutMethod] = useState<"MTN" | "MOOV" | "WAVE">("MTN");

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(payoutAmount) <= 0) return;
    requestPayout(Number(payoutAmount), payoutMethod as any, effectivePartner?.phone || currentPartner?.phone || "");
    setPayoutSuccess(true);
    setShowPayoutModal(false);
    setTimeout(() => setPayoutSuccess(false), 5000);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#EAE6DD]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#787163]">
            <span>Livre de Caisse</span>
            <span>•</span>
            <span className="text-[#e52320]">Comptabilité 100% Transparente</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-[#141A17] tracking-tight mt-1">
            Coffre & Reversements
          </h2>
          <p className="text-xs text-[#787163] mt-1">
            Suivi des encaissements physiques Cash On Delivery et virement immédiat de vos fonds.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowPayoutModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#e52320] hover:bg-[#c91d1a] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 self-start sm:self-auto"
        >
          <Smartphone className="w-4 h-4 text-[#C5A059]" />
          <span>Débloquer vers Mobile Money</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Payout Success Toast Notification */}
      {payoutSuccess && (
        <div className="p-4 rounded-2xl bg-white border border-[#e52320] text-[#e52320] text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#e52320]" />
            <span>
              Demande de virement de {Number(payoutAmount).toLocaleString("fr-FR")} GNF transmise avec succès vers votre compte {payoutMethod} MoMo !
            </span>
          </div>
          <span className="text-[10px] bg-[#FAF9F5] border border-[#EAE6DD] text-[#e52320] px-2.5 py-0.5 rounded-full uppercase font-bold">
            Traité sous 30 min
          </span>
        </div>
      )}

      {/* 💎 4 SUMMARY NOBLE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Net Disponible */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e52320]">
              Net Disponible
            </span>
            <Wallet className="w-4 h-4 text-[#e52320]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#e52320] tracking-tight truncate whitespace-nowrap">
            {revenuNet.toLocaleString("fr-FR")} <span className="text-xs font-semibold text-[#787163]">GNF</span>
          </p>
          <p className="text-xs text-[#5C5649]">Prêt pour virement immédiat</p>
        </div>

        {/* Chiffre d'affaires brut */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#787163]">
              CA Brut Encaissé
            </span>
            <TrendingUp className="w-4 h-4 text-[#8C8474]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#141A17] tracking-tight truncate whitespace-nowrap">
            {caTotal.toLocaleString("fr-FR")} <span className="text-xs font-semibold text-[#787163]">GNF</span>
          </p>
          <p className="text-xs text-[#5C5649]">Total collecté par les livreurs</p>
        </div>

        {/* Frais Logistiques Déduits */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A84232]">
              Frais GuinéeGo Déduits
            </span>
            <span className="text-[10px] font-bold text-[#A84232] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#EAE6DD] whitespace-nowrap">
              -2 800 F / colis
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#A84232] tracking-tight truncate whitespace-nowrap">
            -{commissions.toLocaleString("fr-FR")} <span className="text-xs font-semibold text-[#787163]">GNF</span>
          </p>
          <p className="text-xs text-[#5C5649]">800 F Closing + 2 000 F Livraison</p>
        </div>

        {/* Taux de Conversion */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#787163]">
              Colis Encaissés
            </span>
            <span className="text-[10px] font-bold text-[#e52320] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#EAE6DD] whitespace-nowrap">
              Succès
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#141A17] tracking-tight truncate whitespace-nowrap">
            {deliveredOrdersCount} <span className="text-xs font-semibold text-[#787163]">/ {totalOrdersCount} commandes</span>
          </p>
          <p className="text-xs text-[#5C5649]">Cash collecté sans incident</p>
        </div>
      </div>

      {/* 📜 DÉTAIL DES FRAIS PAR LIVRAISON */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(20,26,23,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#141A17] tracking-tight">
            Barème Tarifaire Transparent
          </h3>
          <span className="text-[10px] font-bold text-[#e52320] uppercase tracking-wider bg-[#FAF9F5] border border-[#EAE6DD] px-2.5 py-1 rounded-full">
            Zéro Frais Caché
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FAF9F5] border border-[#EAE6DD] p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-[#787163] uppercase tracking-wider">Service Closing Téléphonique</p>
            <p className="text-xl font-black text-[#141A17] mt-1">800 GNF</p>
            <p className="text-[11px] text-[#5C5649] mt-0.5">Appel sous 15 min & confirmation client</p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#EAE6DD] p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-[#787163] uppercase tracking-wider">Livraison Express Urbaine</p>
            <p className="text-xl font-black text-[#141A17] mt-1">2 000 GNF</p>
            <p className="text-[11px] text-[#5C5649] mt-0.5">Déploiement livreur Conakry & Régions</p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#EAE6DD] p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-[#e52320] uppercase tracking-wider">Total Retenu par Commande Livrée</p>
            <p className="text-xl font-black text-[#e52320] mt-1">2 800 GNF</p>
            <p className="text-[11px] text-[#5C5649] mt-0.5">Facturé uniquement si le client paie</p>
          </div>
        </div>
      </div>

      {/* 📜 HISTORIQUE DU LIVRE FINANCIER */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl shadow-[0_2px_12px_rgba(20,26,23,0.03)] overflow-hidden">
        <div className="p-6 border-b border-[#EAE6DD] flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#141A17] tracking-tight">
              Journal des Commissions & Reversements
            </h3>
            <p className="text-xs text-[#787163] mt-0.5">
              Détail ligne par ligne pour chaque commande livrée.
            </p>
          </div>

          <button className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] text-[#141A17] text-xs font-bold border border-[#EAE6DD] flex items-center gap-1.5 transition-all shadow-2xs">
            <Download className="w-3.5 h-3.5 text-[#e52320]" />
            <span>Relevé PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-[#EAE6DD] text-[#787163] font-bold uppercase tracking-[0.15em] text-[10px]">
              <tr>
                <th className="py-3 px-5">Réf.</th>
                <th className="py-3 px-5">Client</th>
                <th className="py-3 px-5">Encaissé COD</th>
                <th className="py-3 px-5">Frais GuinéeGo</th>
                <th className="py-3 px-5">Net Marchand</th>
                <th className="py-3 px-5">Statut</th>
                <th className="py-3 px-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DD]/60 font-medium text-[#141A17]">
              {orders.slice(0, 8).map((ord) => {
                const isDelivered = ord.status === "LIVREE";
                return (
                  <tr key={ord.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#e52320]">{ord.orderNumber}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-[#141A17]">{ord.clientName}</p>
                      <p className="text-[11px] text-[#787163]">{ord.clientPhone}</p>
                    </td>
                    <td className="py-3.5 px-5 font-black text-[#141A17]">
                      {ord.totalPrice.toLocaleString("fr-FR")} GNF
                    </td>
                    <td className="py-3.5 px-5 font-bold">
                      {isDelivered ? <span className="text-[#A84232]">-2 800 F</span> : <span className="text-[#8C8474]">—</span>}
                    </td>
                    <td className="py-3.5 px-5 font-black">
                      {isDelivered ? (
                        <span className="text-[#e52320]">
                          {(ord.totalPrice - 2800).toLocaleString("fr-FR")} F
                        </span>
                      ) : (
                        <span className="text-[#8C8474]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isDelivered
                            ? "bg-[#FAF9F5] text-[#e52320] border-[#e52320]/30"
                            : "bg-[#FAF9F5] text-[#A84232] border-[#A84232]/30"
                        }`}
                      >
                        {isDelivered ? "ENCAISSÉE" : "À RAPPELER"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#787163]">24/08/2026</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 MOBILE MONEY PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-[#141A17]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
              <div>
                <h3 className="text-base font-black text-[#141A17]">Virement Mobile Money Immédiat</h3>
                <p className="text-xs text-[#787163] mt-0.5">Transfert traité sous 30 minutes sans frais</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD] text-[#8C8474] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              {/* Operator selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#141A17] uppercase">Opérateur Mobile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["MTN", "MOOV", "WAVE"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayoutMethod(method)}
                      className={`py-3 rounded-xl border text-xs font-black transition-all ${
                        payoutMethod === method
                          ? "bg-white border-[#e52320] text-[#e52320] shadow-2xs"
                          : "bg-[#FAF9F5] border-[#EAE6DD] text-[#787163] hover:text-[#141A17]"
                      }`}
                    >
                      {method} MoMo
                    </button>
                  ))}
                </div>
              </div>

              {/* Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#141A17] uppercase">Numéro Destinataire</label>
                <input
                  type="text"
                  defaultValue={currentPartner?.phone || ""}
                  className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#141A17] uppercase">Montant à Retirer (GNF)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  max={revenuNet}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-base font-black text-[#e52320] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  required
                />
                <p className="text-[11px] text-[#787163]">
                  Solde maximum retirable : <strong className="text-[#141A17]">{revenuNet.toLocaleString("fr-FR")} GNF</strong>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE6DD] text-xs font-bold text-[#5C5649] hover:bg-[#FAF9F5]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#e52320] hover:bg-[#c91d1a] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Valider le Virement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
