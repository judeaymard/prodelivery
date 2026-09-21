"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Wallet,
  TrendingUp,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Bike,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  DollarSign,
  X,
  CreditCard,
  Sliders,
  ShieldCheck,
  Ban,
  Calculator,
  Activity,
  Calendar,
  Eye,
  FileText,
  UserCheck,
  Smartphone,
  Globe,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import {
  FinancialTransaction,
  TransactionType,
  PayoutRequest,
  PayoutOperator,
  PayoutStatus,
  CodCollection,
  CodCollectionStatus,
  RemittanceDeliveryStatus,
  CodRemittance,
  RemittanceStatus,
  FinancialAuditLog,
} from "@/lib/types";
type FinanceTab =
  | "OVERVIEW"
  | "COD_COLLECTIONS"
  | "DRIVER_FUNDS"
  | "MERCHANT_BALANCES"
  | "WITHDRAWALS"
  | "TRANSACTIONS"
  | "COMMISSIONS";

export default function PdgFinancePage() {
  const router = useRouter();
  const {
    orders,
    partners,
    livreurs,
    payoutRequests,
    transactions,
    codCollections,
    codRemittances,
    auditLogs,
    declareRemittance,
    validateRemittance,
    disputeRemittance,
    reportCodDiscrepancy,
    verifyWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    payWithdrawal,
    addTransaction,
    getDriverCodFunds,
  } = useOperations();

  const [activeTab, setActiveTab] = useState<FinanceTab>("OVERVIEW");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [showRemittanceModal, setShowRemittanceModal] = useState(false);
  const [remittanceLivreurId, setRemittanceLivreurId] = useState("liv-1");
  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [remittanceNotes, setRemittanceNotes] = useState("");

  const [examiningRemittance, setExaminingRemittance] = useState<CodRemittance | null>(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  const [selectedDiscrepancyOrder, setSelectedDiscrepancyOrder] = useState<CodCollection | null>(null);
  const [actualCollectedInput, setActualCollectedInput] = useState("");
  const [discrepancyJustification, setDiscrepancyJustification] = useState("");

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PayoutRequest | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [showPayModal, setShowPayModal] = useState<PayoutRequest | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<PayoutRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  const [showCalculationOrder, setShowCalculationOrder] = useState<{
    orderNumber: string;
    collected: number;
    deliveryFee: number;
    agencyCommission: number;
    netPartner: number;
  } | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Core Financial Metrics (Calculs dynamiques connectés à la source de vérité)
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === "LIVREE"), [orders]);
  
  // Total COD collected by drivers
  const totalCodCollected = useMemo(() => {
    const fromCols = codCollections.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const fromOrders = orders
      .filter((o) => o.status === "LIVREE" && o.codCollected && !codCollections.some((c) => c.orderId === o.id))
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return fromCols + fromOrders;
  }, [codCollections, orders]);

  // Funds still held by drivers in their pockets
  const fundsHeldByDrivers = useMemo(() => {
    return livreurs.reduce((sum, l) => sum + getDriverCodFunds(l.id).fundsToRemit, 0);
  }, [livreurs, getDriverCodFunds]);

  // Funds remitted and verified in agency safe
  const fundsRemittedToAgency = useMemo(() => {
    return codRemittances
      .filter((r) => r.status === "VALIDATED" || r.status === "PARTIALLY_VALIDATED")
      .reduce((sum, r) => sum + (r.amountValidated ?? r.receivedAmount ?? r.amountDeclared ?? 0), 0);
  }, [codRemittances]);

  // Total due to merchants (Available + Pending)
  const totalDueToMerchants = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.availableBalance || 0) + (p.pendingBalance || 0), 0);
  }, [partners]);

  // Pending withdrawal count
  const pendingWithdrawalCount = useMemo(() => {
    return payoutRequests.filter((p) => p.status === "PENDING" || p.status === "IN_VERIFICATION").length;
  }, [payoutRequests]);

  // Net agency revenue
  const agencyRevenues = useMemo(() => {
    return orders
      .filter((o) => o.status === "LIVREE")
      .reduce((sum, o) => sum + (o.serviceFee || 800) + (o.deliveryFee || 2000) + Math.round((o.totalPrice * 0.05)), 0);
  }, [orders]);

  // Driver breakdown
  const driverFundsSummary = useMemo(() => {
    return livreurs.map((l) => {
      const funds = getDriverCodFunds(l.id);
      return {
        livreur: l,
        ordersCount: funds.unremittedOrdersCount,
        totalExpected: funds.totalCodCollected,
        totalCollected: funds.totalCodCollected,
        totalRemitted: funds.totalFundsRemitted,
        remainingHeld: funds.fundsToRemit,
        lastRemittance: funds.lastRemittanceDate,
        status: funds.fundsToRemit > 100000 ? "ATTENTION_PLAFOND" : "NORMAL",
      };
    });
  }, [livreurs, getDriverCodFunds]);

  // Handlers
  const handleCreateRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittanceAmount) return;
    const amt = parseInt(remittanceAmount) || 0;
    const driverFunds = getDriverCodFunds(remittanceLivreurId);
    declareRemittance(remittanceLivreurId, amt, driverFunds.unremittedOrderIds, remittanceNotes);
    setShowRemittanceModal(false);
    setRemittanceAmount("");
    setRemittanceNotes("");
  };

  const handleSaveDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancyOrder || !actualCollectedInput) return;
    const actual = parseInt(actualCollectedInput) || 0;
    reportCodDiscrepancy(selectedDiscrepancyOrder.orderId, actual, discrepancyJustification);
    setSelectedDiscrepancyOrder(null);
    setActualCollectedInput("");
    setDiscrepancyJustification("");
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !paymentRefInput.trim()) return;
    payWithdrawal(showPayModal.id, paymentRefInput.trim(), "Super Admin PDG");
    setShowPayModal(null);
    setPaymentRefInput("");
    if (selectedWithdrawal && selectedWithdrawal.id === showPayModal.id) {
      setSelectedWithdrawal({
        ...selectedWithdrawal,
        status: "PAID",
        paymentReference: paymentRefInput.trim(),
        paidAt: new Date().toISOString(),
      });
    }
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;
    rejectWithdrawal(showRejectModal.id, rejectionReasonInput.trim() || "Demande refusée par le PDG.");
    setShowRejectModal(null);
    setRejectionReasonInput("");
    if (selectedWithdrawal && selectedWithdrawal.id === showRejectModal.id) {
      setSelectedWithdrawal({
        ...selectedWithdrawal,
        status: "REJECTED",
        rejectionReason: rejectionReasonInput.trim() || "Demande refusée par le PDG.",
      });
    }
  };
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER EXÉCUTIF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
              FINANCE 2027
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Finance & Trésorerie</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivez les encaissements COD, les fonds détenus par la flotte et les reversements aux e-commerçants.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRemittanceModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Remise de fonds</span>
          </button>
        </div>
      </div>

      {/* 📑 2. NAVIGATION INTERNE (7 ONGLETS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {[
          { id: "OVERVIEW", label: "Vue d'ensemble", icon: Layers },
          { id: "COD_COLLECTIONS", label: "Encaissements COD", icon: BadgeDollarSign },
          { id: "DRIVER_FUNDS", label: "Fonds détenus (Livreurs)", icon: Bike },
          { id: "MERCHANT_BALANCES", label: "Reversements e-commerçants", icon: Building2 },
          { id: "WITHDRAWALS", label: "Demandes de retrait", icon: Landmark, badge: pendingWithdrawalCount },
          { id: "TRANSACTIONS", label: "Transactions", icon: FileText },
          { id: "COMMISSIONS", label: "Commissions & revenus", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white font-black shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-amber-400 text-slate-950" : "bg-amber-500 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 🌟 ONGLET 1 : VUE D'ENSEMBLE                                             */}
      {/* ========================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* 6 KPI STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">💵 COD Collecté</span>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900">{formatCFA(totalCodCollected)}</p>
              <span className="text-[10px] text-slate-500 block">Total collecté ce mois</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">💰 Détenus Livreurs</span>
              <p className="text-base sm:text-lg font-black font-mono text-amber-700">{formatCFA(fundsHeldByDrivers)}</p>
              <span className="text-[10px] text-amber-800 block">Encore sur le terrain</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">🏦 Remis à l&apos;Agence</span>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-700">{formatCFA(fundsRemittedToAgency)}</p>
              <span className="text-[10px] text-emerald-800 block">Validés au coffre</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">👥 Dû E-commerçants</span>
              <p className="text-base sm:text-lg font-black font-mono text-blue-700">{formatCFA(totalDueToMerchants)}</p>
              <span className="text-[10px] text-blue-800 block">Solde total partenaires</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 block">⏳ Retraits Attente</span>
              <p className="text-base sm:text-lg font-black font-mono text-rose-700">{pendingWithdrawalCount}</p>
              <span className="text-[10px] text-rose-800 block">Demandes à arbitrer</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">📈 Revenus Agence</span>
              <p className="text-base sm:text-lg font-black font-mono text-purple-700">{formatCFA(agencyRevenues)}</p>
              <span className="text-[10px] text-purple-800 block">Commissions acquises</span>
            </div>
          </div>

          {/* ⚠️ BLOC « NÉCESSITE VOTRE ATTENTION » */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
                Nécessite votre attention
              </h2>
            </div>

            {(() => {
              const driversWithPendingFunds = livreurs.filter((l) => getDriverCodFunds(l.id).fundsToRemit > 0);
              const collectionsWithDiscrepancy = codCollections.filter((c) => (c.discrepancy || 0) !== 0);
              const pendingPayoutList = payoutRequests.filter((p) => p.status === "PENDING");

              if (driversWithPendingFunds.length === 0 && collectionsWithDiscrepancy.length === 0 && pendingPayoutList.length === 0) {
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <span className="font-bold text-slate-800 block">Trésorerie équilibrée</span>
                    <p className="text-[11px] text-slate-400">Aucune anomalie de caisse, fonds non remis ou retrait en attente.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {driversWithPendingFunds.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-amber-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-amber-700" />
                        <span>Fonds détenus sur le terrain</span>
                      </span>
                      <p className="text-[11px] text-amber-800">
                        {driversWithPendingFunds[0].name} détient {formatCFA(getDriverCodFunds(driversWithPendingFunds[0].id).fundsToRemit)} à remettre.
                      </p>
                      <button
                        onClick={() => setActiveTab("DRIVER_FUNDS")}
                        className="text-[10px] font-bold text-amber-900 underline mt-1 block cursor-pointer"
                      >
                        Exiger remise de fonds →
                      </button>
                    </div>
                  )}

                  {collectionsWithDiscrepancy.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-rose-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                        <span>Écart signalé sur {collectionsWithDiscrepancy[0].orderNumber}</span>
                      </span>
                      <p className="text-[11px] text-rose-800">
                        Montant attendu : {formatCFA(collectionsWithDiscrepancy[0].expectedAmount)} | Collecté : {formatCFA(collectionsWithDiscrepancy[0].collectedAmount)}.
                      </p>
                      <button
                        onClick={() => setActiveTab("COD_COLLECTIONS")}
                        className="text-[10px] font-bold text-rose-900 underline mt-1 block cursor-pointer"
                      >
                        Examiner la justification →
                      </button>
                    </div>
                  )}

                  {pendingPayoutList.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1 text-purple-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-purple-700" />
                        <span>Demande de retrait en attente</span>
                      </span>
                      <p className="text-[11px] text-purple-800">
                        {pendingPayoutList[0].partnerName} demande {formatCFA(pendingPayoutList[0].amount)} ({pendingPayoutList[0].operator}).
                      </p>
                      <button
                        onClick={() => setActiveTab("WITHDRAWALS")}
                        className="text-[10px] font-bold text-purple-900 underline mt-1 block cursor-pointer"
                      >
                        Valider et payer →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 🔄 SCHÉMA DU CYCLE COD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Cycle de Vie Financier COD (Règle d&apos;Arbitrage GuinéeGo LAT)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
              {[
                { step: "1", title: "Commande Livrée", sub: "Client paie en espèces" },
                { step: "2", title: "COD Collecté", sub: "Détenu par le livreur" },
                { step: "3", title: "Remise Espèces", sub: "Dépôt physique à l'agence" },
                { step: "4", title: "Validation PDG", sub: "Contrôle caisse & écarts" },
                { step: "5", title: "Calcul Net", sub: "Brut - Livraison - Comm." },
                { step: "6", title: "Crédit Solde", sub: "Devient disponible" },
                { step: "7", title: "Demande Retrait", sub: "LeekPay / Binance / USDT" },
                { step: "8", title: "Virement Payé", sub: "Réf. de paiement enregistrée" },
              ].map((s) => (
                <div key={s.step} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold inline-flex items-center justify-center text-[9px]">
                    {s.step}
                  </span>
                  <p className="font-bold text-slate-900">{s.title}</p>
                  <p className="text-slate-500 text-[9px]">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 📜 JOURNAL D'AUDIT FINANCIER RÉCENT */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Journal d&apos;Audit Financier Non-Destructif
              </h2>
              <span className="text-[10px] font-bold text-slate-500">Traçabilité intégrale 100% auditable</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 font-mono text-[10px] text-slate-600">
                        {log.targetId}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{log.timestamp} • Par {log.actor}</p>
                  </div>

                  {log.amount && (
                    <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                      {formatCFA(log.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💵 ONGLET 2 : ENCAISSEMENTS COD                                          */}
      {/* ========================================================================= */}
      {activeTab === "COD_COLLECTIONS" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Encaissements COD par Commande</h2>
              <p className="text-xs text-slate-500">Liste des commandes livrées et traçabilité des montants collectés.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">E-commerçant</th>
                  <th className="py-3 px-4">Client & Tél</th>
                  <th className="py-3 px-4">Livreur</th>
                  <th className="py-3 px-4 text-right">Attendu</th>
                  <th className="py-3 px-4 text-right">Collecté</th>
                  <th className="py-3 px-4 text-center">Statut Encaissement</th>
                  <th className="py-3 px-4 text-center">Statut Remise</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {codCollections.map((col) => (
                  <tr key={col.orderId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{col.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{col.partnerName}</td>
                    <td className="py-3 px-4 text-slate-600">{col.clientName}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{col.livreurName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCFA(col.expectedAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCFA(col.collectedAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        col.collectionStatus === "DISCREPANCY_FLAGGED"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {col.collectionStatus === "DISCREPANCY_FLAGGED" ? "Écart Signalé" : "Collecté"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        col.remittanceStatus === "VALIDATED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : col.remittanceStatus === "REMITTED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : col.remittanceStatus === "DISCREPANCY_DETECTED"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {col.remittanceStatus === "VALIDATED"
                          ? "Validé Agence"
                          : col.remittanceStatus === "REMITTED"
                          ? "Remis (En attente)"
                          : col.remittanceStatus === "DISCREPANCY_DETECTED"
                          ? "Écart Détecté"
                          : "Détenu Livreur"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDiscrepancyOrder(col);
                          setActualCollectedInput(col.collectedAmount.toString());
                          setDiscrepancyJustification(col.discrepancyJustification || "");
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        Signaler / Ajuster Écart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 🏍️ ONGLET 3 : FONDS DÉTENUS PAR LES LIVREURS                            */}
      {/* ========================================================================= */}
      {activeTab === "DRIVER_FUNDS" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Encaissements Détenus par la Flotte</h2>
                <p className="text-xs text-slate-500">Suivi en direct des espèces en possession des livreurs et remises.</p>
              </div>
              <button
                onClick={() => setShowRemittanceModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Déclarer une Remise</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Livreur</th>
                    <th className="py-3 px-4 text-center">Colis Concernés</th>
                    <th className="py-3 px-4 text-right">Attendu</th>
                    <th className="py-3 px-4 text-right">Collecté</th>
                    <th className="py-3 px-4 text-right">Déjà Remis</th>
                    <th className="py-3 px-4 text-right">Restant à Remettre</th>
                    <th className="py-3 px-4">Dernière Remise</th>
                    <th className="py-3 px-4 text-center">Statut Flotte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {driverFundsSummary.map((d) => (
                    <tr key={d.livreur.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{d.livreur.name}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">{d.ordersCount} colis</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatCFA(d.totalExpected)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatCFA(d.totalCollected)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{formatCFA(d.totalRemitted)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-700 text-sm">{formatCFA(d.remainingHeld)}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{d.lastRemittance}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.remainingHeld > 150000
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                          {d.remainingHeld > 150000 ? "⚠️ Plafond Élevé" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLEAU DES REMISES DE FONDS & VALIDATION PDG */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              Historique des Remises de Fonds à l&apos;Agence
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Livreur</th>
                    <th className="py-3 px-4 text-right">Attendu</th>
                    <th className="py-3 px-4 text-right">Déclaré</th>
                    <th className="py-3 px-4 text-right">Écart</th>
                    <th className="py-3 px-4 text-center">Colis</th>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4 text-center">Statut Remise</th>
                    <th className="py-3 px-4 text-right">Actions PDG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {codRemittances.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{rem.reference}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{rem.livreurName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCFA(rem.amountExpected)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCFA(rem.amountDeclared)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {rem.discrepancyAmount ? (
                          <span className="text-rose-600 font-mono">{formatCFA(rem.discrepancyAmount)}</span>
                        ) : (
                          <span className="text-slate-400">0 GNF</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{rem.ordersCount}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{rem.createdAt}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rem.status === "VALIDATED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : rem.status === "PARTIALLY_VALIDATED"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : rem.status === "DISPUTED"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          {rem.status === "VALIDATED"
                            ? "Validée au Coffre"
                            : rem.status === "PARTIALLY_VALIDATED"
                            ? "Validée avec Écart"
                            : rem.status === "DISPUTED"
                            ? "Contestée"
                            : "En Attente de Validation"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rem.status === "PENDING_VALIDATION" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => validateRemittance(rem.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              ✓ Valider Caisse
                            </button>
                            <button
                              onClick={() => setExaminingRemittance(rem)}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 cursor-pointer"
                            >
                              Contester
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {rem.validatedBy || "Traité"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏢 ONGLET 4 : REVERSEMENTS & SOLDES E-COMMERÇANTS                         */}
      {/* ========================================================================= */}
      {activeTab === "MERCHANT_BALANCES" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Soldes Disponibles & En Attente des Marchands</h2>
              <p className="text-xs text-slate-500">
                Séparation claire entre montant en attente de validation et solde immédiatement retirable.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Boutique</th>
                  <th className="py-3 px-4">Propriétaire</th>
                  <th className="py-3 px-4 text-right">Montant en Attente</th>
                  <th className="py-3 px-4 text-right">Solde Disponible</th>
                  <th className="py-3 px-4 text-right">Montant Retiré</th>
                  <th className="py-3 px-4">Dernier Règlement</th>
                  <th className="py-3 px-4 text-right">Détail du Calcul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {partners.map((p) => {
                  const pendingAmt = p.pendingBalance || 0;
                  const availAmt = p.availableBalance || 0;
                  const withdrawnAmt = payoutRequests
                    .filter((po) => po.partnerId === p.id && po.status === "PAID")
                    .reduce((sum, po) => sum + po.amount, 0);

                  const partnerDeliveredOrders = orders.filter(
                    (o) => o.partnerId === p.id && o.status === "LIVREE"
                  );
                  const lastDeliveredOrder = partnerDeliveredOrders[partnerDeliveredOrders.length - 1];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.companyName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.fullName}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        {formatCFA(pendingAmt)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatCFA(availAmt)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCFA(withdrawnAmt)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                        {p.lastPayoutDate || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (lastDeliveredOrder) {
                              const collected = lastDeliveredOrder.totalPrice || 0;
                              const deliveryFee = lastDeliveredOrder.deliveryFee || 0;
                              const agencyCommission = lastDeliveredOrder.serviceFee || 0;
                              const netPartner = Math.max(0, collected - deliveryFee - agencyCommission);
                              setShowCalculationOrder({
                                orderNumber: lastDeliveredOrder.orderNumber || "—",
                                collected,
                                deliveryFee,
                                agencyCommission,
                                netPartner,
                              });
                            } else {
                              setShowCalculationOrder({
                                orderNumber: "Aucune commande livrée",
                                collected: 0,
                                deliveryFee: 0,
                                agencyCommission: 0,
                                netPartner: 0,
                              });
                            }
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                        >
                          Voir détail calcul
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏦 ONGLET 5 : DEMANDES DE RETRAIT                                        */}
      {/* ========================================================================= */}
      {activeTab === "WITHDRAWALS" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Demandes de Retrait E-commerçants</h2>
              <p className="text-xs text-slate-500">
                Paiements par prestataires (LeekPay, Binance Pay, USDT) avec réservation temporaire de solde.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">ID Retrait</th>
                  <th className="py-3 px-4">Boutique</th>
                  <th className="py-3 px-4 text-right">Montant Demandé</th>
                  <th className="py-3 px-4">Moyen de Réception</th>
                  <th className="py-3 px-4">Coordonnées Prestataire</th>
                  <th className="py-3 px-4">Date Demande</th>
                  <th className="py-3 px-4 text-center">Statut Retrait</th>
                  <th className="py-3 px-4 text-right">Actions PDG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payoutRequests.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedWithdrawal(p);
                      setInternalNoteInput(p.internalNote || "");
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:underline">
                      {p.id.toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.partnerName}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {formatCFA(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-800 text-[11px] border border-slate-200">
                        {p.operator}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-[11px]">
                      {p.operator === "LEEKPAY" && (p.leekpayPhone || p.phone)}
                      {p.operator === "BINANCE_PAY" && `PayID: ${p.binancePayId}`}
                      {p.operator === "USDT" && `${p.cryptoAddress?.slice(0, 8)}... (${p.cryptoEstimatedUsdt ? `${p.cryptoEstimatedUsdt} USDT` : "—"})`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {p.requestedAt.replace("T", " ")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : p.status === "APPROVED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : p.status === "IN_VERIFICATION"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : p.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {p.status === "PAID"
                          ? "Payé"
                          : p.status === "APPROVED"
                          ? "Approuvé (À Payer)"
                          : p.status === "IN_VERIFICATION"
                          ? "En Vérification"
                          : p.status === "REJECTED"
                          ? "Refusé"
                          : "En Attente"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => approveWithdrawal(p.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] cursor-pointer"
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => verifyWithdrawal(p.id)}
                              className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold text-[11px] border border-purple-200 cursor-pointer"
                            >
                              Vérifier
                            </button>
                          </>
                        )}
                        {p.status === "APPROVED" && (
                          <button
                            onClick={() => setShowPayModal(p)}
                            className="px-3 py-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            Payer Virement
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(p);
                            setInternalNoteInput(p.internalNote || "");
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                        >
                          Fiche
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 📜 ONGLET 6 : TRANSACTIONS & GRAND LIVRE                                 */}
      {/* ========================================================================= */}
      {activeTab === "TRANSACTIONS" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Grand Livre des Transactions</h2>
              <p className="text-xs text-slate-500">Tous les flux financiers, écritures comptables et mouvements de fonds.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Libellé</th>
                  <th className="py-3 px-4">Partie Concernée</th>
                  <th className="py-3 px-4 text-right">Entrée (+)</th>
                  <th className="py-3 px-4 text-right">Sortie (-)</th>
                  <th className="py-3 px-4 text-right">Solde Après</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{tx.date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:underline">{tx.txReference}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">{tx.label}</td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.partnerName || tx.livreurName || "-"}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {tx.inflow > 0 ? `+${formatCFA(tx.inflow)}` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      {tx.outflow > 0 ? `-${formatCFA(tx.outflow)}` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCFA(tx.balanceAfter)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📈 ONGLET 7 : COMMISSIONS & REVENUS                                      */}
      {/* ========================================================================= */}
      {activeTab === "COMMISSIONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Commission Agence</span>
              <p className="text-xl font-black font-mono text-purple-700">2 450 000 GNF</p>
              <p className="text-[11px] text-slate-500">Revenus nets acquis ce mois</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">Commissions Closeuses</span>
              <p className="text-xl font-black font-mono text-slate-900">920 000 GNF</p>
              <p className="text-[11px] text-slate-500">750 GNF / confirmation livrée</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">Commissions Livreurs</span>
              <p className="text-xl font-black font-mono text-slate-900">1 840 000 GNF</p>
              <p className="text-[11px] text-slate-500">1 200 à 1 500 GNF / course</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Marge Nette Agence</span>
              <p className="text-xl font-black font-mono text-emerald-700">1 530 000 GNF</p>
              <p className="text-[11px] text-emerald-800">Rentabilité nette consolidée</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 MODALS & DRAWERS ACTIONNABLES                                          */}
      {/* ========================================================================= */}

      {/* MODAL 1: CRÉER UNE REMISE DE FONDS */}
      {showRemittanceModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">Déclarer une Remise de Fonds</h3>
              </div>
              <button onClick={() => setShowRemittanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRemittance} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Livreur *</label>
                <select
                  value={remittanceLivreurId}
                  onChange={(e) => setRemittanceLivreurId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant Déposé en Espèces (GNF) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 80000"
                  value={remittanceAmount}
                  onChange={(e) => setRemittanceAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Emplacement Caisse</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Dépôt effectué auprès du caissier Hub Cadjehoun..."
                  value={remittanceNotes}
                  onChange={(e) => setRemittanceNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRemittanceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Enregistrer la Remise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DÉCLARATION / ARBITRAGE D'ÉCART */}
      {selectedDiscrepancyOrder && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Arbitrage d&apos;Écart COD</h3>
                <p className="text-xs text-slate-500">{selectedDiscrepancyOrder.orderNumber} • {selectedDiscrepancyOrder.partnerName}</p>
              </div>
            </div>

            <form onSubmit={handleSaveDiscrepancy} className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant attendu :</span>
                  <span className="font-mono font-bold text-slate-900">{formatCFA(selectedDiscrepancyOrder.expectedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Livreur :</span>
                  <span className="font-semibold text-slate-900">{selectedDiscrepancyOrder.livreurName}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant Réellement Collecté (GNF) *</label>
                <input
                  type="number"
                  required
                  value={actualCollectedInput}
                  onChange={(e) => setActualCollectedInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Justification Obligatoire de l&apos;Écart *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Client a refusé le second article après accord téléphonique du vendeur..."
                  value={discrepancyJustification}
                  onChange={(e) => setDiscrepancyJustification(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDiscrepancyOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Enregistrer et Valider l&apos;Écart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FICHE DÉTAILLÉE DU RETRAIT & SÉCURITÉ */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">
                  Fiche Retrait #{selectedWithdrawal.id.toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Partner Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Boutique Demandeur</span>
                <p className="text-sm font-black text-slate-900">{selectedWithdrawal.partnerName}</p>
              </div>

              {/* Amount & Reserved */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Montant Demandé</span>
                <p className="text-2xl font-black font-mono text-emerald-400">{formatCFA(selectedWithdrawal.amount)}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Solde avant : {formatCFA(selectedWithdrawal.balanceBefore || 0)}</span>
                  <span className="text-amber-300 font-bold">Montant réservé : {formatCFA(selectedWithdrawal.amount)}</span>
                </div>
              </div>

              {/* Provider Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Prestataire & Coordonnées ({selectedWithdrawal.operator})
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Moyen :</span>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {selectedWithdrawal.operator}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Coordonnées :</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <span>
                      {selectedWithdrawal.operator === "LEEKPAY" && (selectedWithdrawal.leekpayPhone || selectedWithdrawal.phone)}
                      {selectedWithdrawal.operator === "BINANCE_PAY" && `PayID: ${selectedWithdrawal.binancePayId}`}
                      {selectedWithdrawal.operator === "USDT" && `${selectedWithdrawal.cryptoAddress} (${selectedWithdrawal.cryptoNetwork || "TRC-20"})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note interne */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Note Interne PDG</label>
                <input
                  type="text"
                  placeholder="Ex: Vérification KYC et conformité validées..."
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                {selectedWithdrawal.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(selectedWithdrawal)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      Refuser (Restituer solde)
                    </button>
                    <button
                      onClick={() => {
                        approveWithdrawal(selectedWithdrawal.id, internalNoteInput);
                        setSelectedWithdrawal({ ...selectedWithdrawal, status: "APPROVED" });
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      ✓ Approuver
                    </button>
                  </>
                )}

                {selectedWithdrawal.status === "APPROVED" && (
                  <button
                    onClick={() => setShowPayModal(selectedWithdrawal)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
                  >
                    Exécuter Paiement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PAIEMENT DU RETRAIT */}
      {showPayModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Enregistrer le Virement</h3>
                <p className="text-xs text-slate-500">{showPayModal.partnerName} • {formatCFA(showPayModal.amount)}</p>
              </div>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prestataire</span>
                <p className="font-bold text-slate-900">{showPayModal.operator}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Référence de Paiement Transactionnelle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LK-PAY-984214 ou Binance Order ID..."
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirmer et Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DÉTAIL DU CALCUL DU SOLDE MARCHAND */}
      {showCalculationOrder && (
        <div className="fixed inset-0 z-110 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">
                  Détail du Calcul Financier ({showCalculationOrder.orderNumber})
                </h3>
              </div>
              <button onClick={() => setShowCalculationOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Montant COD Collecté :</span>
                  <span className="font-mono font-bold text-slate-900">+{formatCFA(showCalculationOrder.collected)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Frais de Livraison Conakry :</span>
                  <span className="font-mono font-bold">-{formatCFA(showCalculationOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Commission Télévente Agence :</span>
                  <span className="font-mono font-bold">-{formatCFA(showCalculationOrder.agencyCommission)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Net Crédité sur Solde :</span>
                  <span className="font-mono text-emerald-700">+{formatCFA(showCalculationOrder.netPartner)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Ce montant devient éligible au retrait dès la validation physique de la remise de fonds par le PDG.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowCalculationOrder(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
