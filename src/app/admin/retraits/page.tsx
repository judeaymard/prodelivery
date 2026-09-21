"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  BadgeDollarSign,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  ChevronRight,
  ExternalLink,
  Ban,
  ArrowRight,
  Plus,
  Sliders,
  Lock,
  Globe,
  Coins,
  ShieldAlert,
  Info,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { PayoutRequest, PayoutOperator, PayoutStatus } from "@/lib/types";
import { validateWithdrawalRequest } from "@/lib/pricing-service";

export default function AdminRetraitsPage() {
  const router = useRouter();
  const {
    payoutRequests,
    partners,
    platformSettings,
    validatePayout,
    payPayout,
    rejectPayout,
    requestPayout,
  } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showPayModal, setShowPayModal] = useState<PayoutRequest | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<PayoutRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulaire de création de retrait
  const [newPartnerId, setNewPartnerId] = useState(partners[0]?.id || "");
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newOperator, setNewOperator] = useState<PayoutOperator>("LEEKPAY");
  const [newPhone, setNewPhone] = useState("+229 97 00 11 22");
  const [newCryptoAddress, setNewCryptoAddress] = useState("");
  const [newCryptoNetwork, setNewCryptoNetwork] = useState("TRC20");
  const [newBinanceId, setNewBinanceId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const selectedPartner = partners.find((p) => p.id === newPartnerId) || partners[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Paramètres financiers actifs (Source de Vérité)
  const minThreshold = platformSettings.financial?.minWithdrawalThreshold ?? 10000;
  const doubleValidationLimit = platformSettings.financial?.requireDoubleValidationAbove ?? 500000;
  const processingDelayHours = platformSettings.financial?.payoutProcessingDelayHours ?? 24;
  const gateways = platformSettings.paymentGateways;

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    return payoutRequests.filter((p) => {
      const currentStatus = p.status || "PENDING";

      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && currentStatus !== "PENDING" && currentStatus !== "IN_VERIFICATION") return false;
        if (statusFilter === "APPROVED" && currentStatus !== "APPROVED" && currentStatus !== "VALIDATED") return false;
        if (statusFilter === "PAID" && currentStatus !== "PAID") return false;
        if (statusFilter === "REJECTED" && currentStatus !== "REJECTED" && currentStatus !== "FAILED") return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = p.id.toLowerCase().includes(q);
        const matchPartner = p.partnerName.toLowerCase().includes(q);
        const matchPhone = (p.phone || p.leekpayPhone || "").includes(q);
        const matchOperator = p.operator.toLowerCase().includes(q);
        return matchId || matchPartner || matchPhone || matchOperator;
      }

      return true;
    });
  }, [payoutRequests, statusFilter, searchTerm]);

  // Aggregate Metrics
  const totalAvailableBalanceToPay = partners.reduce((acc, p) => acc + (p.availableBalance || 0), 0);
  const pendingPayouts = payoutRequests.filter((p) => p.status === "PENDING" || p.status === "IN_VERIFICATION");
  const pendingAmount = pendingPayouts.reduce((acc, p) => acc + p.amount, 0);

  const approvedPayouts = payoutRequests.filter((p) => p.status === "VALIDATED" || p.status === "APPROVED");
  const approvedAmount = approvedPayouts.reduce((acc, p) => acc + p.amount, 0);

  const paidPayouts = payoutRequests.filter((p) => p.status === "PAID");
  const paidAmount = paidPayouts.reduce((acc, p) => acc + p.amount, 0);

  const rejectedPayouts = payoutRequests.filter((p) => p.status === "REJECTED" || p.status === "FAILED");

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const validation = validateWithdrawalRequest(
        platformSettings,
        selectedPartner,
        newAmount,
        newOperator,
        {
          phone: newPhone,
          cryptoAddress: newCryptoAddress,
          cryptoNetwork: newCryptoNetwork,
          binancePayId: newBinanceId,
        }
      );

      if (!validation.isValid) {
        setFormError(validation.errors.join(" | "));
        return;
      }

      requestPayout(
        newAmount,
        newOperator,
        newPhone,
        "+229",
        newCryptoAddress || undefined,
        newCryptoNetwork || undefined,
        newBinanceId || undefined
      );

      setShowCreateModal(false);
      setNewAmount(50000);
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement de la demande.");
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !paymentRefInput.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await payPayout(showPayModal.id, paymentRefInput.trim(), "Super Admin GuinéeGo");
      setShowPayModal(null);
      setPaymentRefInput("");
      if (selectedPayout && selectedPayout.id === showPayModal.id) {
        setSelectedPayout({
          ...selectedPayout,
          status: "PAID",
          paymentReference: paymentRefInput.trim(),
          paidAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal || isProcessing) return;

    setIsProcessing(true);
    try {
      await rejectPayout(showRejectModal.id, rejectionReasonInput.trim() || "Demande refusée par la direction.");
      setShowRejectModal(null);
      setRejectionReasonInput("");
      if (selectedPayout && selectedPayout.id === showRejectModal.id) {
        setSelectedPayout({
          ...selectedPayout,
          status: "REJECTED",
          rejectionReason: rejectionReasonInput.trim() || "Demande refusée par la direction.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case "PENDING":
        return { label: "En attente", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
      case "IN_VERIFICATION":
        return { label: "En vérification", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" };
      case "VALIDATED":
      case "APPROVED":
        return { label: "Approuvé (À payer)", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" };
      case "PAID":
        return { label: "Payé ✓", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
      case "REJECTED":
        return { label: "Rejeté", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
      case "FAILED":
        return { label: "Échoué", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
      default:
        return { label: status, color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID Retrait,E-commerçant,Montant,Opérateur,Téléphone/Adresse,Date Demande,Statut,Référence Paiement"].join(",") +
      "\n" +
      payoutRequests
        .map((p) =>
          [
            `"${p.id}"`,
            `"${p.partnerName}"`,
            `"${p.amount} GNF"`,
            `"${p.operator}"`,
            `"${p.phone || p.cryptoAddress || "-"}"`,
            `"${p.requestedAt}"`,
            `"${p.status}"`,
            `"${p.paymentReference || p.txReference || "-"}"`,
          ].join(",")
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retraits_marchands_guineego_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Retraits E-commerçants</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Workflow complet de validation, verrouillage transactionnel et reversement des fonds marchands.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Initier un Retrait</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <Link
            href="/admin/parametres?tab=financial"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Règles Paramètres</span>
          </Link>
        </div>
      </div>

      {/* ⚙️ 2. BANNIÈRE RÈGLES MÉTIER ACTIVES (SOURCE DE VÉRITÉ PARAMÈTRES) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                SOURCE DE VÉRITÉ ACTIVE
              </span>
              <h3 className="text-xs font-bold text-slate-200">Règles Financières Consommées en Direct</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Ces paramètres proviennent de <Link href="/admin/parametres" className="text-emerald-400 underline font-semibold">Paramètres &gt; Paiements & Finances</Link> et s'appliquent immédiatement à chaque nouveau retrait.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Seuil Minimum</span>
              <span className="font-mono font-bold text-white text-xs">{formatCFA(minThreshold)}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Délai Traitement</span>
              <span className="font-mono font-bold text-white text-xs">{processingDelayHours} heures</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Double Validation</span>
              <span className="font-mono font-bold text-amber-400 text-xs">&gt; {formatCFA(doubleValidationLimit)}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Passerelles Actives</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${gateways?.leekpay?.enabled ? "bg-emerald-400" : "bg-rose-500"}`} title="LeekPay" />
                <span className={`w-2 h-2 rounded-full ${gateways?.binancePay?.enabled ? "bg-amber-400" : "bg-rose-500"}`} title="Binance Pay" />
                <span className={`w-2 h-2 rounded-full ${gateways?.usdtCrypto?.enabled ? "bg-cyan-400" : "bg-rose-500"}`} title="USDT" />
                <span className="text-[10px] text-slate-300 font-mono">
                  {Number(gateways?.leekpay?.enabled || 0) + Number(gateways?.binancePay?.enabled || 0) + Number(gateways?.usdtCrypto?.enabled || 0)}/3
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 3. KPI STRIP RETRAITS (6 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Solde à Reverser</span>
          <span className="text-sm font-black font-mono text-slate-900">{formatCFA(totalAvailableBalanceToPay)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 block">En Attente</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black font-mono text-amber-700">{pendingPayouts.length}</span>
            <span className="text-[10px] text-amber-600 font-mono">({formatCFA(pendingAmount)})</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 block">Approuvés (À Payer)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black font-mono text-blue-700">{approvedPayouts.length}</span>
            <span className="text-[10px] text-blue-600 font-mono">({formatCFA(approvedAmount)})</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">Retraits Payés</span>
          <span className="text-sm font-black font-mono text-emerald-700">{paidPayouts.length}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-rose-600 block">Rejetés / Échecs</span>
          <span className="text-sm font-black font-mono text-rose-700">{rejectedPayouts.length}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">Total Reversé</span>
          <span className="text-xs font-black font-mono text-emerald-700">{formatCFA(paidAmount)}</span>
        </div>
      </div>

      {/* 🔎 4. BARRE DE RECHERCHE ET FILTRES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par ID, boutique, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "PENDING", label: `En attente (${pendingPayouts.length})` },
            { id: "APPROVED", label: `Approuvés (${approvedPayouts.length})` },
            { id: "PAID", label: "Payés" },
            { id: "REJECTED", label: "Rejetés" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white font-black shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 5. TABLEAU DES RETRAITS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">ID Retrait</th>
                <th className="py-3.5 px-5">E-commerçant</th>
                <th className="py-3.5 px-5">Montant</th>
                <th className="py-3.5 px-5">Moyen de Paiement</th>
                <th className="py-3.5 px-5">Coordonnées / Réseau</th>
                <th className="py-3.5 px-5">Date Demande</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Aucune demande de retrait ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => {
                  const badge = getStatusBadge(payout.status);
                  const isHighValue = payout.amount >= doubleValidationLimit;

                  return (
                    <tr
                      key={payout.id}
                      onClick={() => setSelectedPayout(payout)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900 group-hover:underline">
                        {payout.id.toUpperCase()}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 block">{payout.partnerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Boutique Marchande</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{formatCFA(payout.amount)}</span>
                          {isHighValue && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300" title="Montant élevé : double validation requise">
                              2FA
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-800 text-[11px] border border-slate-200 inline-flex items-center gap-1">
                          {payout.operator === "BINANCE_PAY" && <Coins className="w-3 h-3 text-amber-500" />}
                          {payout.operator === "USDT" && <Globe className="w-3 h-3 text-cyan-500" />}
                          {payout.operator}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {payout.cryptoAddress ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs block">
                              {payout.cryptoAddress.slice(0, 8)}...{payout.cryptoAddress.slice(-6)}
                            </span>
                            <span className="text-[9px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                              {payout.cryptoNetwork || "TRC20"}
                            </span>
                          </div>
                        ) : payout.binancePayId ? (
                          <span className="font-mono font-semibold text-amber-800">
                            ID: {payout.binancePayId}
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-slate-800">
                            {payout.countryCode} {payout.phone}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px]">
                        {payout.requestedAt?.replace("T", " ")?.slice(0, 16) || "Récemment"}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {(payout.status === "PENDING" || payout.status === "IN_VERIFICATION") && (
                            <>
                              <button
                                onClick={() => validatePayout(payout.id)}
                                className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 cursor-pointer"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => setShowRejectModal(payout)}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 cursor-pointer"
                              >
                                Rejeter
                              </button>
                            </>
                          )}

                          {(payout.status === "VALIDATED" || payout.status === "APPROVED") && (
                            <button
                              onClick={() => setShowPayModal(payout)}
                              className="px-3 py-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-[11px] shadow-xs cursor-pointer"
                            >
                              Payer & Virement
                            </button>
                          )}

                          {payout.status === "PAID" && (
                            <button
                              onClick={() => setSelectedPayout(payout)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 cursor-pointer"
                            >
                              Détails
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredPayouts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Aucun retrait trouvé.</div>
          ) : (
            filteredPayouts.map((payout) => {
              const badge = getStatusBadge(payout.status);
              return (
                <div
                  key={payout.id}
                  onClick={() => setSelectedPayout(payout)}
                  className="p-4 space-y-2 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{payout.partnerName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-sm">{formatCFA(payout.amount)}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {payout.operator}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">{payout.requestedAt?.replace("T", " ")?.slice(0, 16)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ➕ 6. MODAL INITIALISATION D'UN RETRAIT (TEST DU WORKFLOW COMPLET) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Initier une Demande de Retrait</h3>
                  <p className="text-xs text-slate-500">Validation temps réel selon la configuration active</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWithdrawal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Boutique Marchande *</label>
                <select
                  value={newPartnerId}
                  onChange={(e) => setNewPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-slate-800"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} (Solde : {formatCFA(p.availableBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Montant Demandé (GNF) *</label>
                  <span className="text-[10px] text-slate-500 font-mono">Min. configuré : {formatCFA(minThreshold)}</span>
                </div>
                <input
                  type="number"
                  min={minThreshold}
                  step={1000}
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-black text-sm focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Choix Moyen de Paiement avec blocage si désactivé dans Paramètres */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Moyen de Paiement *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!gateways?.leekpay?.enabled}
                    onClick={() => setNewOperator("LEEKPAY")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      newOperator === "LEEKPAY"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                        : !gateways?.leekpay?.enabled
                        ? "border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="block font-bold text-xs">LeekPay</span>
                    <span className="text-[9px] text-slate-500 block">Mobile Money</span>
                    {!gateways?.leekpay?.enabled && (
                      <span className="text-[8px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
                        <Lock className="w-2.5 h-2.5" /> Désactivé
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!gateways?.binancePay?.enabled}
                    onClick={() => setNewOperator("BINANCE_PAY")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      newOperator === "BINANCE_PAY"
                        ? "border-amber-500 bg-amber-50/50 text-amber-950 font-bold"
                        : !gateways?.binancePay?.enabled
                        ? "border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="block font-bold text-xs">Binance Pay</span>
                    <span className="text-[9px] text-slate-500 block">Crypto direct</span>
                    {!gateways?.binancePay?.enabled && (
                      <span className="text-[8px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
                        <Lock className="w-2.5 h-2.5" /> Désactivé
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!gateways?.usdtCrypto?.enabled}
                    onClick={() => setNewOperator("USDT")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      newOperator === "USDT"
                        ? "border-cyan-600 bg-cyan-50/50 text-cyan-950 font-bold"
                        : !gateways?.usdtCrypto?.enabled
                        ? "border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="block font-bold text-xs">USDT Crypto</span>
                    <span className="text-[9px] text-slate-500 block">TRC20 / Polygon</span>
                    {!gateways?.usdtCrypto?.enabled && (
                      <span className="text-[8px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
                        <Lock className="w-2.5 h-2.5" /> Désactivé
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Champs conditionnels selon opérateur */}
              {newOperator === "LEEKPAY" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Numéro Mobile Money Réception *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+229 97 00 00 00"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-800"
                  />
                </div>
              )}

              {newOperator === "BINANCE_PAY" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Binance Pay ID / Email Binance *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 284918274 ou merchant@binance.com"
                    value={newBinanceId}
                    onChange={(e) => setNewBinanceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-800"
                  />
                </div>
              )}

              {newOperator === "USDT" && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Réseau Blockchain Obligatoire *</label>
                    <select
                      value={newCryptoNetwork}
                      onChange={(e) => setNewCryptoNetwork(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-slate-800"
                    >
                      <option value="TRC20">TRON (TRC20) — Recommandé</option>
                      <option value="POLYGON">Polygon (USDT POS)</option>
                      <option value="BEP20">BNB Smart Chain (BEP20)</option>
                      <option value="ERC20">Ethereum (ERC20)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adresse de Wallet USDT *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TXYZ1234567890abcdef..."
                      value={newCryptoAddress}
                      onChange={(e) => setNewCryptoAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Résumé de verrouillage */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sécurité Financière</span>
                <p className="text-[11px] text-slate-600">
                  Le montant de <strong className="text-slate-900 font-mono">{formatCFA(newAmount)}</strong> sera immédiatement <strong>verrouillé</strong> sur le solde disponible du marchand pour éviter tout double débit.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirmer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 7. FICHE DÉTAILLÉE D'UN RETRAIT (MODAL / DRAWER) */}
      {selectedPayout && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">
                  Fiche Retrait #{selectedPayout.id.toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setSelectedPayout(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3.5 text-xs">
              {/* Partner Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">E-commerçant</span>
                <p className="text-sm font-black text-slate-900">{selectedPayout.partnerName}</p>
                <p className="text-slate-500 text-[11px]">Boutique Partenaire certifiée GuinéeGo</p>
              </div>

              {/* Amount & Balances */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Montant Demandé</span>
                <p className="text-2xl font-black font-mono text-emerald-400">{formatCFA(selectedPayout.amount)}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Solde avant : {formatCFA(selectedPayout.balanceBefore || 0)}</span>
                  <span>Solde après : {formatCFA(selectedPayout.balanceAfter || 0)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Coordonnées de Règlement
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Moyen choisi :</span>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {selectedPayout.operator}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Compte Réception :</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">
                      {selectedPayout.cryptoAddress || selectedPayout.binancePayId || `${selectedPayout.countryCode || ""} ${selectedPayout.phone || selectedPayout.leekpayPhone || ""}`}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedPayout.cryptoAddress || selectedPayout.binancePayId || selectedPayout.phone || selectedPayout.leekpayPhone || "", selectedPayout.id)}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-400 cursor-pointer"
                    >
                      {copiedId === selectedPayout.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {selectedPayout.cryptoNetwork && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Réseau Blockchain :</span>
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {selectedPayout.cryptoNetwork}
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline & Metadata */}
              <div className="space-y-1.5 text-[11px] text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Date de demande :</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedPayout.requestedAt?.replace("T", " ")?.slice(0, 16)}</span>
                </div>
                {selectedPayout.approvedAt && (
                  <div className="flex justify-between">
                    <span>Date d'approbation :</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedPayout.approvedAt?.replace("T", " ")?.slice(0, 16)}</span>
                  </div>
                )}
                {selectedPayout.paidAt && (
                  <div className="flex justify-between">
                    <span>Date de paiement :</span>
                    <span className="font-mono font-semibold text-emerald-700">{selectedPayout.paidAt?.replace("T", " ")?.slice(0, 16)}</span>
                  </div>
                )}
                {selectedPayout.paymentReference && (
                  <div className="flex justify-between">
                    <span>Référence virement :</span>
                    <span className="font-mono font-bold text-purple-700">{selectedPayout.paymentReference}</span>
                  </div>
                )}
                {selectedPayout.adminProcessorName && (
                  <div className="flex justify-between">
                    <span>Traité par :</span>
                    <span className="font-semibold text-slate-900">{selectedPayout.adminProcessorName}</span>
                  </div>
                )}
                {selectedPayout.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <span className="font-bold block">Motif de rejet :</span>
                    <span>{selectedPayout.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                {(selectedPayout.status === "PENDING" || selectedPayout.status === "IN_VERIFICATION") && (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectModal(selectedPayout);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      Rejeter
                    </button>
                    <button
                      onClick={() => {
                        validatePayout(selectedPayout.id);
                        setSelectedPayout({ ...selectedPayout, status: "APPROVED", approvedAt: new Date().toISOString() });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Approuver la demande
                    </button>
                  </>
                )}

                {(selectedPayout.status === "VALIDATED" || selectedPayout.status === "APPROVED") && (
                  <button
                    onClick={() => {
                      setShowPayModal(selectedPayout);
                    }}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
                  >
                    Exécuter le Paiement
                  </button>
                )}

                {selectedPayout.status === "PAID" && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Retrait payé et archivé</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💳 8. MODAL DE PAIEMENT */}
      {showPayModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Enregistrer le Virement Réel</h3>
                <p className="text-xs text-slate-500">{showPayModal.partnerName} • {formatCFA(showPayModal.amount)}</p>
              </div>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Bénéficiaire &amp; Coordonnées</span>
                <p className="font-bold text-slate-900">{showPayModal.operator} : {showPayModal.cryptoAddress || showPayModal.binancePayId || showPayModal.phone}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Référence de Transaction / TxID (Obligatoire) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MT-984214, MoMo Ref, TxID Blockchain..."
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Montant décaissé :</span>
                  <span>{formatCFA(showPayModal.amount)}</span>
                </div>
                <p className="text-[10px] text-emerald-700">
                  Cette validation débitera définitivement le solde marchand et enregistrera la transaction au Grand Livre.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !paymentRefInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Traitement en cours...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer le Paiement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ 9. MODAL DE REJET */}
      {showRejectModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Rejeter la Demande</h3>
                <p className="text-xs text-slate-500">{showRejectModal.partnerName} • {formatCFA(showRejectModal.amount)}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif du Rejet *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Coordonnées erronées, compte en vérification..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                <Info className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                Le montant verrouillé ({formatCFA(showRejectModal.amount)}) sera immédiatement <strong>restitué</strong> au solde disponible du marchand.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(null)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Rejet en cours...</span>
                  ) : (
                    <span>Confirmer le Rejet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
