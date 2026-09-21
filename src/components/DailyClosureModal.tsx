"use client";

import React, { useRef } from "react";
import { Order, Partner } from "@/lib/types";
import { formatCFA } from "@/lib/mock-data";
import {
  Printer,
  Download,
  Share2,
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  Ban,
  Package,
  Wallet,
  Building2,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

interface DailyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
  orders: Order[];
  dateStr?: string;
}

export default function DailyClosureModal({
  isOpen,
  onClose,
  partner,
  orders,
  dateStr,
}: DailyClosureModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const todayStr = dateStr || new Date().toISOString().slice(0, 10);
  const displayDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Filtrer les commandes du partenaire (actives / du jour)
  const partnerOrders = orders.filter((o) => o.partnerId === partner.id);

  const delivered = partnerOrders.filter((o) => o.status === "LIVREE");
  const inProgress = partnerOrders.filter((o) => o.status === "EN_COURS" || o.status === "CONFIRMEE");
  const pending = partnerOrders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER");
  const cancelled = partnerOrders.filter((o) => o.status === "ANNULEE" || o.status === "REFUSEE" || o.status === "RETOURNEE");

  const totalCollectedCOD = delivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDeliveryFees = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const totalServiceFees = delivered.reduce((sum, o) => sum + (o.serviceFee || 0), 0);
  const totalDeductions = totalDeliveryFees + totalServiceFees;
  const netDueToPartner = Math.max(0, totalCollectedCOD - totalDeductions);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*BILAN JOURNALIER ENO LIVRAISON* 📦
📅 *Date :* ${displayDate}
🏪 *Boutique :* ${partner.companyName} (${partner.fullName})

📊 *RÉSUMÉ DES ACTIVITÉS :*
- Total commandes traitées : ${partnerOrders.length}
- Colis livrés & encaissés : ${delivered.length}
- Colis en cours de livraison : ${inProgress.length}
- Annulés / Refusés : ${cancelled.length}

💰 *BILAN FINANCIER DU JOUR :*
- Total Brut Encaissé (COD) : ${formatCFA(totalCollectedCOD)}
- Frais de livraison & services : -${formatCFA(totalDeductions)}
👉 *NET DISPONIBLE / À REVERSER :* *${formatCFA(netDueToPartner)}*

_Généré par la plateforme officielle ENO LIVRAISON Bénin._`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = (partner.phone || "").replace(/[^0-9]/g, "");
    const targetUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up my-auto">
        {/* BARRE D'ACTIONS DU MODAL (non imprimée) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Bilan Journalier de Clôture</h3>
              <p className="text-[11px] text-slate-400">{partner.companyName} • {todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Envoyer le résumé sur WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZONE DU DOCUMENT FORMAT ÉDITION / PDF / IMPRESSION */}
        <div ref={printRef} className="p-6 sm:p-10 space-y-6 text-slate-900 bg-white" id="printable-daily-closure">
          {/* Entête Officielle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                ENO
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">ENO LIVRAISON</h1>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                  Logistique E-commerce & Recouvrement COD
                </p>
                <p className="text-[10px] text-slate-500">Cotonou • Lokossa • Porto-Novo • Bénin</p>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                Bordereau de Clôture Journalière
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1 capitalize">{displayDate}</p>
              <p className="text-[10px] text-slate-400 font-mono">RÉF : CLOT-{partner.id.slice(-4)}-{todayStr.replace(/-/g, "")}</p>
            </div>
          </div>

          {/* Fiche Partenaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Boutique E-commerce Partenaire
              </span>
              <p className="font-black text-slate-900 text-sm">{partner.companyName}</p>
              <p className="text-slate-600">Gérant : {partner.fullName}</p>
              <p className="text-slate-600">Contact : {partner.phone}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Opérateur Logistique
              </span>
              <p className="font-bold text-slate-800">Agence Centrale ENO Livraison</p>
              <p className="text-slate-600">contact@enolivraison.bj</p>
              <p className="text-slate-600">+229 01 64 29 18 84</p>
            </div>
          </div>

          {/* 4 Indicateurs Clés de la Journée */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Colis</span>
              <p className="text-xl font-black text-slate-900">{partnerOrders.length}</p>
              <span className="text-[10px] text-slate-500">Pris en charge</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Livrés & Encaissés</span>
              <p className="text-xl font-black text-emerald-700">{delivered.length}</p>
              <span className="text-[10px] text-emerald-600 font-medium">100% encaissés</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">En Tournée</span>
              <p className="text-xl font-black text-blue-700">{inProgress.length}</p>
              <span className="text-[10px] text-blue-600 font-medium">À finaliser</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Non Livrés</span>
              <p className="text-xl font-black text-rose-700">{cancelled.length}</p>
              <span className="text-[10px] text-rose-600 font-medium">Annulés/Refus</span>
            </div>
          </div>

          {/* Tableau Récapitulatif Financier COD */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span>Décompte Financier de Clôture</span>
              <span className="text-emerald-400">Devise : FCFA</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Total Encaissé Cash On Delivery (Espèces collectées)</span>
                <span className="font-bold font-mono text-slate-900">{formatCFA(totalCollectedCOD)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-rose-600">
                <span>Frais de livraison appliqués ({delivered.length} colis livrés)</span>
                <span className="font-bold font-mono">- {formatCFA(totalDeliveryFees)}</span>
              </div>
              {totalServiceFees > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-rose-600">
                  <span>Frais de télévente / closing confirmés</span>
                  <span className="font-bold font-mono">- {formatCFA(totalServiceFees)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 text-sm font-black text-emerald-800 bg-emerald-50/80 p-3 rounded-xl">
                <span>SOLDE NET À REVERSER AU MARCHAND</span>
                <span className="text-base font-mono font-black">{formatCFA(netDueToPartner)}</span>
              </div>
            </div>
          </div>

          {/* Liste Détaillée des Colis Livrés */}
          {delivered.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Détail des Colis Encaissés ({delivered.length})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="py-2 px-3">Réf.</th>
                      <th className="py-2 px-3">Client & Téléphone</th>
                      <th className="py-2 px-3">Ville / Zone</th>
                      <th className="py-2 px-3 text-right">Prix Client</th>
                      <th className="py-2 px-3 text-right">Frais Livr.</th>
                      <th className="py-2 px-3 text-right">Net Marchand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {delivered.map((ord) => {
                      const net = (ord.totalPrice || 0) - (ord.deliveryFee || 0) - (ord.serviceFee || 0);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{ord.orderNumber}</td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block">{ord.clientName}</span>
                            <span className="text-slate-400 text-[10px]">{ord.clientPhone}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{ord.city || "Cotonou"}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCFA(ord.totalPrice)}</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600">-{formatCFA(ord.deliveryFee)}</td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">{formatCFA(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures & Mentions */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Pour le Partenaire :</p>
              <div className="mt-8 border-b border-dashed border-slate-300 w-3/4"></div>
              <p className="text-[9px] text-slate-400 mt-1">Date et Signature / Bon pour accord</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-700">Pour ENO LIVRAISON :</p>
              <div className="mt-8 border-b border-dashed border-slate-300 w-3/4 ml-auto"></div>
              <p className="text-[9px] text-emerald-700 font-bold mt-1">Visa Trésorerie & Caisse Centrale</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
