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
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { PayoutOperator } from "@/lib/types";

const AFRICAN_COUNTRIES = [
  { code: "+229", country: "Bénin", flag: "🇧🇯" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", country: "Sénégal", flag: "🇸🇳" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+237", country: "Cameroun", flag: "🇨🇲" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+224", country: "Guinée Conakry", flag: "🇬🇳" },
  { code: "+222", country: "Mauritanie", flag: "🇲🇷" },
  { code: "+236", country: "Centrafrique (RCA)", flag: "🇨🇫" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+243", country: "RDC", flag: "🇨🇩" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+242", country: "Congo Brazza", flag: "🇨🇬" },
];

const OPERATORS: { id: PayoutOperator; name: string; tag: string; isCrypto?: boolean }[] = [
  { id: "MTN", name: "MTN MoMo", tag: "Bénin, CI, Cameroun" },
  { id: "MOOV", name: "Moov Money", tag: "Bénin, CI, Togo, BF" },
  { id: "WAVE", name: "Wave", tag: "Sénégal, CI, Bénin" },
  { id: "ORANGE", name: "Orange Money", tag: "CI, Sénégal, Mali, Guinée, RCA" },
  { id: "USDT_TRC20", name: "USDT (TRC-20)", tag: "Mauritanie, Burundi, International", isCrypto: true },
  { id: "BINANCE_PAY", name: "Binance Pay", tag: "0% frais • Instantané mondial", isCrypto: true },
];

export default function FinancesPage() {
  const { orders, activePartner, requestPayout, payoutRequests } = useOperations();

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutStep, setPayoutStep] = useState<"FORM" | "PENDING_ADMIN">("FORM");
  const [payoutCountryCode, setPayoutCountryCode] = useState("+229");
  const [payoutPhone, setPayoutPhone] = useState("01 97 36 29 06");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutOperator>("MTN");
  const [payoutAmount, setPayoutAmount] = useState("252400");

  const partnerOrders = orders.filter((o) => o.partnerId === activePartner.id);
  const partnerDeliveredOrders = partnerOrders.filter((o) => o.status === "LIVREE");

  const deliveredOrdersCount = partnerDeliveredOrders.length || 38;
  const totalOrdersCount = partnerOrders.length || 77;
  const caTotal = partnerDeliveredOrders.reduce((acc, o) => acc + o.totalPrice, 0) || 358800;
  const commissions = deliveredOrdersCount * 2800; // 38 * 2800 F
  const initialRevenuNet = Math.max(0, caTotal - commissions); // 252 400 F

  const activePendingPayout = payoutRequests.find(
    (p) => p.partnerId === activePartner.id && (p.status === "PENDING" || p.status === "IN_VERIFICATION" || p.status === "APPROVED")
  );
  const pendingAmount = activePendingPayout ? activePendingPayout.amount : 0;
  const revenuNetDisponible = activePartner.availableBalance !== undefined ? activePartner.availableBalance : Math.max(0, initialRevenuNet - pendingAmount);

  const isCryptoMethod = payoutMethod === "USDT_TRC20" || payoutMethod === "BINANCE_PAY";
  const estimatedUsdt = Math.round((Number(payoutAmount || 0) / 600) * 100) / 100;

  const feeAmountCFA =
    payoutMethod === "BINANCE_PAY"
      ? 0
      : payoutMethod === "USDT_TRC20"
      ? 600
      : payoutMethod === "ORANGE" || payoutCountryCode !== "+229"
      ? Math.round(Number(payoutAmount || 0) * 0.01)
      : 0;

  const netAmountCFA = Math.max(0, Number(payoutAmount || 0) - feeAmountCFA);
  const netEstimatedUSDT =
    payoutMethod === "BINANCE_PAY"
      ? estimatedUsdt
      : payoutMethod === "USDT_TRC20"
      ? Math.max(0, Math.round((estimatedUsdt - 1) * 100) / 100)
      : null;

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    requestPayout(
      Number(payoutAmount),
      payoutMethod,
      payoutPhone,
      payoutCountryCode,
      cryptoAddress,
      payoutMethod === "USDT_TRC20" ? "TRC-20 (Tron)" : payoutMethod === "BINANCE_PAY" ? "Binance Pay" : undefined
    );
    setPayoutStep("PENDING_ADMIN");
  };

  const handleCloseModal = () => {
    setShowPayoutModal(false);
    setTimeout(() => {
      setPayoutStep("FORM");
    }, 300);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up w-full max-w-full min-w-0">
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-2 border-b border-[#EAE6DD] min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase text-[#787163] truncate">
            <span>Livre de Caisse</span>
            <span>•</span>
            <span className="text-[#0D5940]">Comptabilité 100% Transparente</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#141A17] tracking-tight mt-1 truncate">
            Coffre & Reversements
          </h2>
          <p className="text-xs text-[#787163] mt-1 leading-normal">
            Suivi des encaissements physiques Cash On Delivery et virement immédiat de vos fonds.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setShowPayoutModal(true);
            setPayoutStep("FORM");
          }}
          disabled={revenuNetDisponible <= 0}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto ${
            revenuNetDisponible <= 0
              ? "bg-[#FAF9F5] border border-[#EAE6DD] text-[#787163] cursor-not-allowed"
              : "bg-[#0D5940] hover:bg-[#093D2C] text-white active:scale-95"
          }`}
        >
          <Smartphone className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>{revenuNetDisponible <= 0 ? "Solde en cours de retrait" : "Demande de retrait"}</span>
          <ArrowUpRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* ⏳ BANNIÈRE STATUTAIRE SI RETRAIT EN ATTENTE DE VALIDATION ADMIN */}
      {activePendingPayout && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 text-amber-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-950">
                Retrait de {activePendingPayout.amount.toLocaleString("fr-FR")} F CFA en cours de validation
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 truncate">
                Destination :{" "}
                <strong>
                  {activePendingPayout.operator === "USDT_TRC20"
                    ? `USDT (TRC-20) • ${activePendingPayout.cryptoAddress || "Tron Wallet"} (≈ ${activePendingPayout.cryptoEstimatedUsdt || Math.round(activePendingPayout.amount / 600)} USDT)`
                    : activePendingPayout.operator === "BINANCE_PAY"
                    ? `Binance Pay • ${activePendingPayout.cryptoAddress || "Binance ID"} (≈ ${activePendingPayout.cryptoEstimatedUsdt || Math.round(activePendingPayout.amount / 600)} USDT)`
                    : `${activePendingPayout.operator} Money (${activePendingPayout.countryCode} ${activePendingPayout.phone})`}
                </strong>{" "}
                • Demandé à {new Date(activePendingPayout.requestedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-white border border-amber-300 text-amber-800 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
            Validation Admin en cours (~quelques min)
          </span>
        </div>
      )}

      {/* 💎 4 SYNCHRONIZED FINANCIAL METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        {/* 01. Revenu Net Encaissé */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787163] truncate">01 • Solde Net Disponible</span>
            <span className="w-2 h-2 rounded-full bg-[#0D5940] shrink-0"></span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl sm:text-3xl font-black text-[#141A17]">{revenuNetDisponible.toLocaleString("fr-FR")}</span>
              <span className="text-xs font-bold text-[#0D5940] uppercase">F CFA</span>
            </div>
            <p className="text-[11px] text-[#5C5649] mt-1 leading-normal truncate">
              {pendingAmount > 0
                ? `⏳ ${pendingAmount.toLocaleString("fr-FR")} F en attente admin`
                : "Prêt pour virement MoMo immédiat"}
            </p>
          </div>
        </div>

        {/* 02. Chiffre d'Affaires Brut */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787163] truncate">02 • Total Brut Encaissé</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#787163] shrink-0" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl sm:text-3xl font-black text-[#141A17]">{caTotal.toLocaleString("fr-FR")}</span>
              <span className="text-xs font-bold text-[#787163] uppercase">F CFA</span>
            </div>
            <p className="text-[11px] text-[#5C5649] mt-1 leading-normal truncate">
              {deliveredOrdersCount} colis livrés et payés
            </p>
          </div>
        </div>

        {/* 03. Frais de Prestation */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787163] truncate">03 • Frais Logistique & Closing</span>
            <span className="text-[10px] font-bold text-[#A84232] bg-[#FAF9F5] border border-[#EAE6DD] px-1.5 py-0.5 rounded shrink-0">Déduit</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-2xl sm:text-3xl font-black text-[#A84232]">-{commissions.toLocaleString("fr-FR")}</span>
              <span className="text-xs font-bold text-[#A84232] uppercase">F CFA</span>
            </div>
            <p className="text-[11px] text-[#5C5649] mt-1 leading-normal truncate">
              2 800 F / colis livré (stockage offert)
            </p>
          </div>
        </div>

        {/* 04. Compte de Versement */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787163] truncate">04 • Compte MoMo</span>
            <span className="text-[10px] font-bold text-[#0D5940] bg-[#FAF9F5] border border-[#EAE6DD] px-1.5 py-0.5 rounded shrink-0">Actif</span>
          </div>
          <div className="mt-3">
            <p className="text-base sm:text-lg font-black text-[#141A17] truncate">
              {payoutMethod} MoMo
            </p>
            <p className="text-[11px] text-[#787163] mt-1 font-mono font-medium truncate">
              {payoutCountryCode} {payoutPhone}
            </p>
          </div>
        </div>
      </div>

      {/* 📜 HISTORIQUE DES TRANSACTIONS */}
      <div className="bg-white border border-[#EAE6DD] rounded-3xl shadow-[0_2px_12px_rgba(20,26,23,0.03)] overflow-hidden w-full min-w-0">
        <div className="p-4 sm:p-6 border-b border-[#EAE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#141A17]">Livre des Flux Financiers</h3>
            <p className="text-xs text-[#787163] mt-0.5">Détail des encaissements COD et déductions logistiques par colis.</p>
          </div>
          <button
            onClick={() => alert("Téléchargement du grand livre comptable (CSV)...")}
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#EAE6DD] text-xs font-bold text-[#141A17] flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#0D5940]" />
            <span>Grand Livre CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
            <thead className="bg-[#FAF9F5] border-b border-[#EAE6DD] text-[#787163] font-bold uppercase tracking-[0.15em] text-[10px]">
              <tr>
                <th className="py-3 px-5">Réf. Colis</th>
                <th className="py-3 px-5">Date & Heure</th>
                <th className="py-3 px-5">Client</th>
                <th className="py-3 px-5">Montant Encaissé</th>
                <th className="py-3 px-5">Frais Prestation</th>
                <th className="py-3 px-5">Net Partenaire</th>
                <th className="py-3 px-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DD]/60 font-medium text-[#141A17]">
              {orders.slice(0, 7).map((ord) => {
                const fee = 2800;
                const net = ord.totalPrice - fee;
                return (
                  <tr key={ord.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0D5940]">{ord.orderNumber}</td>
                    <td className="py-3.5 px-5 text-[#787163]">24 Oct, 14:30</td>
                    <td className="py-3.5 px-5 font-black">{ord.clientName}</td>
                    <td className="py-3.5 px-5 font-bold">{ord.totalPrice.toLocaleString("fr-FR")} F</td>
                    <td className="py-3.5 px-5 text-[#A84232] font-semibold">-{fee.toLocaleString("fr-FR")} F</td>
                    <td className="py-3.5 px-5 font-black text-[#0D5940]">{net.toLocaleString("fr-FR")} F CFA</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF9F5] text-[#0D5940] border border-[#0D5940]/30">
                        Encaissé COD
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 MODAL DE RETRAIT DE BÉNÉFICES AVEC VALIDATION ADMIN */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-[#141A17]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
              <div>
                <h3 className="text-base font-black text-[#141A17]">Demande de Retrait</h3>
                <p className="text-xs text-[#787163] mt-0.5">Reversement de vos bénéfices marchands</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD] text-[#8C8474] flex items-center justify-center hover:text-[#141A17]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payoutStep === "FORM" ? (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {/* 1. CHOIX DU MODE DE PAIEMENT */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#787163] flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#0D5940]" />
                    <span>1. Mode de paiement</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATORS.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setPayoutMethod(op.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          payoutMethod === op.id
                            ? "bg-white border-[#0D5940] shadow-xs"
                            : "bg-[#FAF9F5] border-[#EAE6DD] hover:border-[#D9D3C7]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${payoutMethod === op.id ? "text-[#0D5940]" : "text-[#141A17]"}`}>
                            {op.name}
                          </span>
                          {op.isCrypto ? (
                            <span className="text-[9px] bg-amber-500/10 text-amber-700 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/20">
                              Crypto
                            </span>
                          ) : (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                payoutMethod === op.id ? "bg-[#0D5940]" : "bg-[#EAE6DD]"
                              }`}
                            ></span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#787163] mt-0.5">{op.tag}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. COORDONNÉES DE RÉCEPTION (MOBILE MONEY OU CRYPTO) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#787163] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#0D5940]" />
                    <span>
                      {payoutMethod === "USDT_TRC20"
                        ? "2. Adresse Wallet USDT (Réseau TRC-20)"
                        : payoutMethod === "BINANCE_PAY"
                        ? "2. Identifiant Binance Pay / Email"
                        : "2. Numéro de compte Mobile Money"}
                    </span>
                  </label>

                  {isCryptoMethod ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        placeholder={
                          payoutMethod === "USDT_TRC20"
                            ? "Ex: T9yD14Nj9j7xAB4dbGeiX9h8unkKHX... (TRC-20)"
                            : "Ex: 284910244 ou email@binance.com"
                        }
                        className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-mono font-bold text-[#141A17] focus:outline-none focus:border-[#0D5940] focus:bg-white"
                        required
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#787163] px-1">
                        <span>Estimation : <strong className="text-[#0D5940] font-mono font-bold">≈ {estimatedUsdt} USDT</strong></span>
                        <span className="text-[10px] bg-emerald-50 text-[#0D5940] px-2 py-0.5 rounded font-bold border border-emerald-200">
                          1 USDT = 600 F CFA
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={payoutCountryCode}
                        onChange={(e) => setPayoutCountryCode(e.target.value)}
                        className="px-2.5 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#0D5940] focus:bg-white shrink-0"
                      >
                        {AFRICAN_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.country})
                          </option>
                        ))}
                      </select>

                      <input
                        type="tel"
                        value={payoutPhone}
                        onChange={(e) => setPayoutPhone(e.target.value)}
                        placeholder="01 97 00 00 00"
                        className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#0D5940] focus:bg-white"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* 3. MONTANT DU RETRAIT */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#787163]">
                      3. Montant du retrait
                    </label>
                    <span className="text-[11px] text-[#787163]">
                      Disponible : <strong className="text-[#0D5940]">{revenuNetDisponible.toLocaleString("fr-FR")} F</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      value={payoutAmount}
                      max={revenuNetDisponible}
                      min={1000}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-lg font-black text-[#0D5940] focus:outline-none focus:border-[#0D5940] focus:bg-white"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#787163]">
                      F CFA
                    </span>
                  </div>

                  {/* Raccourcis */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPayoutAmount("50000")}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] hover:bg-white border border-[#EAE6DD] text-[11px] font-bold text-[#141A17]"
                    >
                      50 000 F
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutAmount("100000")}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] hover:bg-white border border-[#EAE6DD] text-[11px] font-bold text-[#141A17]"
                    >
                      100 000 F
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(revenuNetDisponible.toString())}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#0D5940] text-[11px] font-bold text-[#0D5940]"
                    >
                      Tout retirer
                    </button>
                  </div>
                </div>

                {/* ℹ️ RÉCAPITULATIF TRANSPARENT DES FRAIS & NET */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#EAE6DD] text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[#787163]">
                    <span>
                      Frais de transfert ({payoutMethod === "BINANCE_PAY" ? "Binance Pay" : payoutMethod === "USDT_TRC20" ? "Réseau Tron" : payoutMethod}) :
                    </span>
                    <span className="font-bold text-[#141A17]">
                      {feeAmountCFA === 0
                        ? "0 F (0% Gratuit)"
                        : `${feeAmountCFA.toLocaleString("fr-FR")} F CFA (${payoutMethod === "USDT_TRC20" ? "1 USDT fixe" : "1%"})`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-[#EAE6DD]">
                    <span className="font-bold text-[#141A17]">Net réel transféré :</span>
                    <span className="font-black text-[#0D5940] text-sm font-mono">
                      {isCryptoMethod
                        ? `${netEstimatedUSDT} USDT (≈ ${netAmountCFA.toLocaleString("fr-FR")} F)`
                        : `${netAmountCFA.toLocaleString("fr-FR")} F CFA`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#787163] italic pt-0.5">
                    {payoutMethod === "BINANCE_PAY"
                      ? "⚡ Virement instantané sans aucun frais réseau."
                      : payoutMethod === "USDT_TRC20"
                      ? "⛓️ 1 USDT de frais de gaz réseau Tron TRC-20."
                      : "📱 Virement validé par l'administrateur sous quelques minutes."}
                  </p>
                </div>

                {/* 4. ACTION SUBMIT */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-[#EAE6DD] text-xs font-bold text-[#5C5649] hover:bg-[#FAF9F5]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0D5940] hover:bg-[#093D2C] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Lancer la demande de retrait</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* ÉCRAN DE CONFIRMATION / EN ATTENTE VALIDATION ADMIN */
              <div className="space-y-5 text-center py-2 animate-fade-in-up">
                <div className="w-14 h-14 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-[#141A17]">
                    Demande de Retrait Transmise !
                  </h4>
                  <p className="text-xs text-[#5C5649] leading-relaxed max-w-sm mx-auto">
                    Veuillez patienter quelques minutes pendant que l&apos;administrateur valide votre demande de retrait.
                  </p>
                </div>

                {/* Détails du virement à venir */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EAE6DD] text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#EAE6DD]">
                    <span className="text-[#787163]">Montant demandé :</span>
                    <span className="font-black text-[#0D5940] text-sm">
                      {Number(payoutAmount || 0).toLocaleString("fr-FR")} F CFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#787163]">Compte de versement :</span>
                    <span className="font-bold text-[#141A17] font-mono text-[11px] truncate max-w-[200px]">
                      {payoutMethod === "USDT_TRC20"
                        ? `USDT TRC-20 (${cryptoAddress || "Adresse Tron"}) ≈ ${estimatedUsdt} $`
                        : payoutMethod === "BINANCE_PAY"
                        ? `Binance Pay (${cryptoAddress || "ID"}) ≈ ${estimatedUsdt} $`
                        : `${payoutMethod} (${payoutCountryCode} ${payoutPhone})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#787163]">Statut actuel :</span>
                    <span className="font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md text-[10px] uppercase">
                      En attente de validation admin
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#787163] leading-relaxed">
                  Dès que l&apos;administrateur approuve la demande, les fonds sont virés directement sur votre compte {isCryptoMethod ? "Crypto (USDT)" : "Mobile Money"}.
                </p>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 rounded-2xl bg-[#141A17] hover:bg-[#0D5940] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Compris, je patiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
