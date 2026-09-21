"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BadgeDollarSign,
  Bike,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  UserCheck,
  Eye,
  Layers,
  Banknote,
  Vault,
  X,
  ArrowRight,
  TrendingUp,
  Zap,
  Scale,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Percent,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { DriverCodFinancialSummary, PeriodFilter, CodRemittance, PayoutRequest } from "@/lib/types";

export default function TresorerieDashboardPage() {
  const {
    orders,
    livreurs,
    partners,
    payoutRequests,
    transactions,
    codCollections,
    codRemittances,
    activeTreasuryManager,
    period,
    setPeriod,
    getDriverCodFunds,
    isDateWithinPeriod,
    receiveDriverRemittance,
    approveWithdrawal,
    payWithdrawal,
  } = useOperations();

  // Search & Modal States
  const [showQuickRemittanceModal, setShowQuickRemittanceModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("liv-1");
  const [receivedAmountInput, setReceivedAmountInput] = useState<string>("");
  const [remittanceNotesInput, setRemittanceNotesInput] = useState<string>("");
  const [discrepancyReasonInput, setDiscrepancyReasonInput] = useState<string>("");
  // Cash register status toggle (consistent with sidebar)
  const [cashRegisterStatus, setCashRegisterStatus] = useState<"OUVERTE" | "CLOTUREE">("OUVERTE");

  // Pay Modal for Quick Payout
  const [selectedPayoutForPay, setSelectedPayoutForPay] = useState<PayoutRequest | null>(null);
  const [payoutPaymentRef, setPayoutPaymentRef] = useState<string>("");

  // 1. Core KPIs (Accurate calculations from Single Source of Truth & Filtered by Period)
  const deliveredOrdersPeriod = useMemo(() => {
    return orders.filter((o) => o.status === "LIVREE" && isDateWithinPeriod(o.deliveredAt || o.createdAt));
  }, [orders, isDateWithinPeriod]);

  // Total COD Encaissé sur la période (Dynamique selon TODAY, 7D, 30D, YEAR)
  const totalEncaissePeriod = useMemo(() => {
    return deliveredOrdersPeriod.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [deliveredOrdersPeriod]);

  // Total Fonds en transit chez les livreurs (À Remettre)
  const allDriversSummaries = useMemo(() => {
    return livreurs.map((l) => getDriverCodFunds(l.id));
  }, [livreurs, getDriverCodFunds]);

  const totalFondsARemettre = allDriversSummaries.reduce((sum, d) => sum + d.fundsToRemit, 0);
  const driversWithFundsCount = allDriversSummaries.filter((d) => d.fundsToRemit > 0).length;

  // Remises en attente de pointage au coffre
  const pendingRemittances = useMemo(() => {
    return codRemittances.filter((r) => r.status === "PENDING_VALIDATION");
  }, [codRemittances]);

  // Retraits payés aux e-commerçants sur la période
  const paidPayoutsPeriod = useMemo(() => {
    return payoutRequests.filter((p) => p.status === "PAID" && isDateWithinPeriod(p.paidAt || p.requestedAt));
  }, [payoutRequests, isDateWithinPeriod]);

  const totalReversemarchandsPeriod = useMemo(() => {
    return paidPayoutsPeriod.reduce((sum, p) => sum + p.amount, 0);
  }, [paidPayoutsPeriod]);

  // Écarts de caisse à contrôler
  const discrepanciesRemittances = useMemo(() => {
    return codRemittances.filter(
      (r) => r.status === "DISCREPANCY_DETECTED" || (r.discrepancyAmount && r.discrepancyAmount > 0)
    );
  }, [codRemittances]);

  const totalDiscrepanciesAmount = useMemo(() => {
    return discrepanciesRemittances.reduce((sum, r) => sum + Math.abs(r.discrepancyAmount || 0), 0);
  }, [discrepanciesRemittances]);

  // 2. Bloc Prioritaire "À Traiter" (Actionable tasks)
  const pendingPayouts = useMemo(() => {
    return payoutRequests.filter((p) => p.status === "PENDING" || p.status === "APPROVED");
  }, [payoutRequests]);

  const actionableTasks = useMemo(() => {
    const list: Array<{
      id: string;
      type: "REMISE" | "RETRAIT" | "ECART";
      reference: string;
      actor: string;
      amount: number;
      date: string;
      status: string;
      actionLabel: string;
      actionUrl: string;
      onAction?: () => void;
    }> = [];

    // Remises en attente
    pendingRemittances.forEach((r) => {
      list.push({
        id: r.id,
        type: "REMISE",
        reference: r.reference,
        actor: r.livreurName,
        amount: r.amountDeclared || r.amountExpected,
        date: r.createdAt?.slice(0, 10) || "Aujourd'hui",
        status: "En attente pointage",
        actionLabel: "Pointer & Valider",
        actionUrl: "/tresorerie/remises",
      });
    });

    // Retraits marchands en attente
    pendingPayouts.forEach((p) => {
      list.push({
        id: p.id,
        type: "RETRAIT",
        reference: p.id,
        actor: p.partnerName,
        amount: p.amount,
        date: p.requestedAt?.slice(0, 10) || "Aujourd'hui",
        status: p.status === "APPROVED" ? "Approuvé (À décaisser)" : "En attente d'accord",
        actionLabel: p.status === "APPROVED" ? "Décaisser" : "Vérifier",
        actionUrl: "/tresorerie/retraits",
        onAction: () => {
          setSelectedPayoutForPay(p);
          setPayoutPaymentRef(`MTN-MANUAL-${Date.now().toString().slice(-6)}`);
        },
      });
    });

    // Écarts non résolus
    discrepanciesRemittances.forEach((r) => {
      list.push({
        id: r.id,
        type: "ECART",
        reference: r.reference,
        actor: r.livreurName,
        amount: Math.abs(r.discrepancyAmount || 0),
        date: r.receivedAt?.slice(0, 10) || r.createdAt?.slice(0, 10) || "Aujourd'hui",
        status: "Écart à arbitrer",
        actionLabel: "Examiner",
        actionUrl: "/tresorerie/reconciliation",
      });
    });

    return list.slice(0, 5);
  }, [pendingRemittances, pendingPayouts, discrepanciesRemittances]);

  // 3. Opérations Récentes (Grand Livre / Transactions)

  // 4. Opérations Récentes (Grand Livre / Transactions)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  // Handlers for quick remittance modal
  const handleOpenRemittanceModal = (driverId?: string) => {
    const dId = driverId || livreurs[0]?.id || "liv-1";
    setSelectedDriverId(dId);
    const sum = getDriverCodFunds(dId);
    setReceivedAmountInput(sum.fundsToRemit.toString());
    setRemittanceNotesInput("");
    setDiscrepancyReasonInput("");
    setShowQuickRemittanceModal(true);
  };

  const handleSubmitRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivedAmountInput) return;

    const receivedAmt = parseInt(receivedAmountInput) || 0;
    receiveDriverRemittance({
      livreurId: selectedDriverId,
      receivedAmount: receivedAmt,
      receivedBy: activeTreasuryManager?.name || "Amina Tidjani",
      receivedById: activeTreasuryManager?.id || "usr-tresor-1",
      notes: remittanceNotesInput.trim() || undefined,
      discrepancyReason: discrepancyReasonInput.trim() || undefined,
    });

    setShowQuickRemittanceModal(false);
    setReceivedAmountInput("");
    setRemittanceNotesInput("");
    setDiscrepancyReasonInput("");
  };

  const handleConfirmPayPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutForPay || !payoutPaymentRef.trim()) return;
    payWithdrawal(
      selectedPayoutForPay.id,
      payoutPaymentRef.trim(),
      activeTreasuryManager?.name || "Responsable Trésorerie"
    );
    setSelectedPayoutForPay(null);
    setPayoutPaymentRef("");
  };

  const selectedDriverFunds = useMemo(() => {
    return getDriverCodFunds(selectedDriverId);
  }, [selectedDriverId, getDriverCodFunds]);

  const inputAmt = parseInt(receivedAmountInput) || 0;
  const currentDiscrepancy = selectedDriverFunds.fundsToRemit - inputAmt;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto pb-16">
      {/* 1. 👑 HEADER EXÉCUTIF TRÉSORIER AVEC SÉLECTEUR DE PÉRIODE — EXACT DESIGN PDG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <span>GuinéeGo LAT</span>
            <span>•</span>
            <span className="text-slate-700">Responsable Trésorerie</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Vue d&apos;ensemble de la trésorerie GuinéeGo LAT — Contrôle des encaissements COD, remises coursiers et décaissements marchands.
          </p>
        </div>

        {/* Controls: Period Selector & Cash Register Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto max-w-full">
            {(
              [
                { id: "TODAY", label: "Aujourd'hui" },
                { id: "7D", label: "7j" },
                { id: "30D", label: "30j" },
                { id: "YEAR", label: "Année" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  period === t.id
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Cash Register Status Toggle */}
          <button
            onClick={() => setCashRegisterStatus(prev => prev === "OUVERTE" ? "CLOTUREE" : "OUVERTE")}
            aria-label="Statut de la caisse"
            aria-pressed={cashRegisterStatus === "OUVERTE"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer text-xs font-bold shadow-2xs shrink-0"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                cashRegisterStatus === "OUVERTE" ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-400"
              }`}
            />
            <span className={cashRegisterStatus === "OUVERTE" ? "text-emerald-700 font-black" : "text-slate-600 font-semibold"}>
              {cashRegisterStatus === "OUVERTE" ? "Caisse Ouverte" : "Caisse Clôturée"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. 📊 4 KPI PRINCIPAUX RÉELLEMENT UTILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Encaissements de la période */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {period === "TODAY" ? "Encaissements du jour" : period === "7D" ? "Encaissements (7j)" : period === "30D" ? "Encaissements (30j)" : "Encaissements de l'année"}
            </span>
            <Banknote className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-mono truncate whitespace-nowrap">
            {formatCFA(totalEncaissePeriod)}
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold flex-wrap">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>{deliveredOrdersPeriod.length} commandes livrées</span>
            <span className="text-slate-400 font-normal">encaissées</span>
          </div>
        </div>

        {/* KPI 2 : À Remettre (Fonds en transit coursiers) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              À remettre
            </span>
            <Bike className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 tracking-tight font-mono truncate whitespace-nowrap">
            {formatCFA(totalFondsARemettre)}
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-700 font-medium flex-wrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{driversWithFundsCount} livreur(s) en tournée</span>
          </div>
        </div>

        {/* KPI 3 : Remis aux E-commerçants (Retraits décaissés) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Remis aux e-commerçants
            </span>
            <Wallet className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-mono truncate whitespace-nowrap">
            {formatCFA(totalReversemarchandsPeriod)}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500 flex-wrap">
            <span>{paidPayoutsPeriod.length} retraits payés sur la période</span>
          </div>
        </div>

        {/* KPI 4 : Écarts à contrôler */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Écarts à contrôler
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 tracking-tight font-mono truncate whitespace-nowrap">
            {formatCFA(totalDiscrepanciesAmount)}
          </p>
          <div className="flex items-center gap-1 text-xs text-rose-600 font-medium flex-wrap">
            <span>{discrepanciesRemittances.length} dossier(s) signalé(s)</span>
          </div>
        </div>
      </div>

      {/* 3. 🚨 BLOC PRIORITAIRE "À TRAITER" (TÂCHES DIRECTES TRÉSORIER) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Opérations à Traiter en Priorité</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tâches en attente de vérification, pointage au coffre ou décaissement manuel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenRemittanceModal()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Réceptionner une remise</span>
            </button>
          </div>
        </div>

        {actionableTasks.length > 0 ? (
          <>
            {/* Desktop & Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Type</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Acteur concerné</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actionableTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Type */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {task.type === "REMISE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                            <Receipt className="w-3 h-3 text-amber-600" />
                            Remise Livreur
                          </span>
                        )}
                        {task.type === "RETRAIT" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                            <Wallet className="w-3 h-3 text-blue-600" />
                            Retrait Marchand
                          </span>
                        )}
                        {task.type === "ECART" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Écart de Caisse
                          </span>
                        )}
                      </td>

                      {/* Référence */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {task.reference}
                      </td>

                      {/* Acteur */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {task.actor}
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono text-sm">
                        {formatCFA(task.amount)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {task.date}
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {task.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {task.onAction ? (
                          <button
                            onClick={task.onAction}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                          >
                            {task.actionLabel}
                          </button>
                        ) : (
                          <Link
                            href={task.actionUrl}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{task.actionLabel}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {actionableTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {task.type === "REMISE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                        <Receipt className="w-3 h-3 text-amber-700" />
                        Remise Livreur
                      </span>
                    )}
                    {task.type === "RETRAIT" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-bold">
                        <Wallet className="w-3 h-3 text-blue-700" />
                        Retrait Marchand
                      </span>
                    )}
                    {task.type === "ECART" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-700" />
                        Écart de Caisse
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {task.reference}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{task.actor}</p>
                      <p className="text-[11px] text-slate-500">{task.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 font-mono">
                        {formatCFA(task.amount)}
                      </p>
                      <span className="inline-block text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    {task.onAction ? (
                      <button
                        onClick={task.onAction}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{task.actionLabel}</span>
                      </button>
                    ) : (
                      <Link
                        href={task.actionUrl}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{task.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-100 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-900">Toutes les opérations prioritaires sont à jour</p>
            <p className="text-[11px] text-slate-400">Aucune remise ni retrait en attente d&apos;arbitrage.</p>
          </div>
        )}
      </div>



      {/* 5. 📑 OPÉRATIONS RÉCENTES & ACCÈS DIRECT AU GRAND LIVRE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-700" />
              <span>Dernières Opérations Enregistrées</span>
            </h3>
            <p className="text-xs text-slate-500">
              Journal d&apos;écriture comptable en temps réel.
            </p>
          </div>

          <Link
            href="/tresorerie/transactions"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Voir toutes les transactions</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">Date / Heure</th>
                <th className="py-3 px-4">Réf. Écriture</th>
                <th className="py-3 px-4">Libellé &amp; Type</th>
                <th className="py-3 px-4">Partenaire / Coursier</th>
                <th className="py-3 px-4 text-right">Flux</th>
                <th className="py-3 px-4 text-right">Solde Après</th>
                <th className="py-3 px-4 text-center rounded-r-xl">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {tx.txReference || tx.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{tx.label}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{tx.type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {tx.partnerName || tx.livreurName || "GuinéeGo Trésorerie"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    {tx.inflow && tx.inflow > 0 ? (
                      <span className="text-emerald-600">+ {formatCFA(tx.inflow)}</span>
                    ) : tx.outflow && tx.outflow > 0 ? (
                      <span className="text-rose-600">- {formatCFA(tx.outflow)}</span>
                    ) : (
                      <span className="text-slate-400">0 GNF</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-medium">
                    {formatCFA(tx.balanceAfter || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {tx.txReference || tx.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  {tx.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{tx.label}</p>
                <p className="text-[11px] text-slate-500">{tx.partnerName || tx.livreurName || "GuinéeGo Trésorerie"}</p>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">{tx.date}</span>
                <div className="text-right">
                  {tx.inflow && tx.inflow > 0 ? (
                    <span className="font-mono font-black text-emerald-600">+ {formatCFA(tx.inflow)}</span>
                  ) : tx.outflow && tx.outflow > 0 ? (
                    <span className="font-mono font-black text-rose-600">- {formatCFA(tx.outflow)}</span>
                  ) : (
                    <span className="font-mono text-slate-400">0 GNF</span>
                  )}
                  <p className="text-[10px] text-slate-400">Solde: {formatCFA(tx.balanceAfter || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MODAL : ENREGISTREMENT RAPIDE REMISE PHYSIQUE (< 1 MIN) */}
      {showQuickRemittanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 animate-fade-in-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Enregistrement Remise Physique</h3>
                  <p className="text-xs text-slate-500">Workflow rapide de réception caisse &lt; 1 minute</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickRemittanceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRemittance} className="space-y-4">
              {/* Step 1: Choix du livreur */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Livreur effectuant le versement</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedDriverId(id);
                    const sum = getDriverCodFunds(id);
                    setReceivedAmountInput(sum.fundsToRemit.toString());
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {formatCFA(getDriverCodFunds(l.id).fundsToRemit)} à remettre
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Récapitulatif attendu */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Montant COD théorique attendu :</span>
                  <span className="font-black text-slate-900 text-sm font-mono">
                    {formatCFA(selectedDriverFunds.fundsToRemit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Colis livrés rattachés :</span>
                  <span className="font-bold text-slate-700">
                    {selectedDriverFunds.unremittedOrdersCount} commande(s)
                  </span>
                </div>
              </div>

              {/* Step 3: Montant Reçu en Espèces */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Montant effectivement compté &amp; reçu (GNF)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Billets / Espèces</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    value={receivedAmountInput}
                    onChange={(e) => setReceivedAmountInput(e.target.value)}
                    placeholder="Ex: 150000"
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-300 font-mono font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    GNF
                  </span>
                </div>
              </div>

              {/* Dynamic Comparison & Écart Badge */}
              {receivedAmountInput !== "" && (
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    currentDiscrepancy === 0
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/80 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      {currentDiscrepancy === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        {currentDiscrepancy === 0
                          ? "Montant conforme (0 GNF d'écart)"
                          : `Écart de caisse détecté : ${formatCFA(Math.abs(currentDiscrepancy))}`}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono">
                      {currentDiscrepancy > 0 ? "Manquant livreur" : currentDiscrepancy < 0 ? "Surplus" : "Exact"}
                    </span>
                  </div>

                  {currentDiscrepancy !== 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-rose-200">
                      <label className="text-[11px] font-bold text-rose-900 block">
                        Justification obligatoire de l&apos;écart *
                      </label>
                      <input
                        type="text"
                        required
                        value={discrepancyReasonInput}
                        onChange={(e) => setDiscrepancyReasonInput(e.target.value)}
                        placeholder="Ex: Monnaie rendue / report de paiement client..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes facultatives */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Notes ou observations (facultatif)</label>
                <input
                  type="text"
                  value={remittanceNotesInput}
                  onChange={(e) => setRemittanceNotesInput(e.target.value)}
                  placeholder="Remarques particulières..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickRemittanceModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Vault className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Valider et verser au coffre-fort</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL : DÉCAISSEMENT DIRECT D'UN RETRAIT MARCHAND */}
      {selectedPayoutForPay && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fade-in-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Décaissement de Retrait</h3>
                  <p className="text-[11px] text-slate-500">Réf : {selectedPayoutForPay.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayoutForPay(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayPayout} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Partenaire :</span>
                  <span className="font-bold text-slate-900">{selectedPayoutForPay.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Montant à reverser :</span>
                  <span className="font-black text-slate-900 text-sm font-mono">{formatCFA(selectedPayoutForPay.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Opérateur :</span>
                  <span className="font-semibold text-slate-700">{selectedPayoutForPay.operator} ({selectedPayoutForPay.phone})</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Référence de transaction MoMo / Virement *</label>
                <input
                  type="text"
                  required
                  value={payoutPaymentRef}
                  onChange={(e) => setPayoutPaymentRef(e.target.value)}
                  placeholder="Ex: MTN-MANUAL-789456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutForPay(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs"
                >
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
