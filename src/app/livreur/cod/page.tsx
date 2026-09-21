"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  Send,
  Check,
  History,
  Info,
  Clock,
  Banknote,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { CodRemittance, CodCollection } from "@/lib/types";

export default function LivreurCodPage() {
  const {
    activeLivreur,
    getDriverCodFunds,
    codCollections,
    codRemittances,
    receiveDriverRemittance,
    logAuditEvent,
  } = useOperations();

  const [remitModalOpen, setRemitModalOpen] = useState(false);
  const [remitAmount, setRemitAmount] = useState("");
  const [remitNotes, setRemitNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synthèse financière temps réel pour le livreur
  const financialSummary = useMemo(() => {
    if (!activeLivreur) {
      return {
        livreurId: "",
        livreurName: "",
        fundsToRemit: 0,
        totalFundsRemitted: 0,
        totalCodCollected: 0,
        unremittedOrdersCount: 0,
        unremittedOrderIds: [],
        statusLabel: "À jour",
        statusLevel: "NORMAL" as const,
        ceilingPercentage: 0,
        ceilingThreshold: 100000,
      };
    }
    return getDriverCodFunds(activeLivreur.id);
  }, [activeLivreur, getDriverCodFunds, codRemittances, codCollections]);

  // Historique des remises du livreur
  const driverRemittances = useMemo(() => {
    if (!activeLivreur) return [];
    return codRemittances.filter((r) => r.livreurId === activeLivreur.id);
  }, [activeLivreur, codRemittances]);

  // Historique des encaissements / collections de ce livreur
  const driverCollections = useMemo(() => {
    if (!activeLivreur) return [];
    return codCollections.filter((c) => c.livreurId === activeLivreur.id);
  }, [activeLivreur, codCollections]);

  const handleOpenRemitModal = () => {
    setRemitAmount(String(financialSummary.fundsToRemit));
    setRemitModalOpen(true);
  };

  const handleConfirmRemittance = () => {
    if (!activeLivreur) return;
    const amountNum = Number(remitAmount);
    if (!amountNum || amountNum <= 0) return;

    // Enregistrement de la remise
    receiveDriverRemittance({
      livreurId: activeLivreur.id,
      receivedAmount: amountNum,
      receivedBy: "Caisse Centrale (Hub GuinéeGo)",
      notes: remitNotes || `Versement des espèces de la tournée par ${activeLivreur.name}`,
      remittanceType: amountNum < financialSummary.fundsToRemit ? "PARTIAL" : "FULL",
    });

    logAuditEvent({
      actor: {
        id: activeLivreur.id,
        name: activeLivreur.name,
        role: "LIVREUR",
        type: "USER",
      },
      action: "REMITTANCE_VALIDATED",
      actionLabel: "Versement d'espèces COD",
      module: "TRESORERIE",
      entityType: "REMITTANCE",
      entityId: `rem-${Date.now()}`,
      entityReference: `VER-${activeLivreur.id}`,
      severity: "INFO",
      result: "SUCCESS",
      description: `Versement de ${formatCFA(amountNum)} par le coursier ${activeLivreur.name} au coffre GuinéeGo.`,
    });

    triggerToast(`✅ Versement de ${formatCFA(amountNum)} consigné avec succès au coffre !`);
    setRemitModalOpen(false);
    setRemitNotes("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 md:top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <Wallet className="w-3 h-3 text-emerald-600" />
            <span>Gestion de Caisse & COD</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collectes / COD</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des fonds encaissés, plafond autorisé et remises d'espèces au hub
          </p>
        </div>

        {financialSummary.fundsToRemit > 0 && (
          <button
            onClick={handleOpenRemitModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Effectuer un versement</span>
          </button>
        )}
      </div>

      {/* Synthèse financière globale */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Fonds actuellement détenus
          </span>
          <p className="text-2xl font-black text-emerald-700 leading-tight">
            {formatCFA(financialSummary.fundsToRemit)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Sur {financialSummary.unremittedOrdersCount} colis livrés non apurés
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Total versé au coffre
          </span>
          <p className="text-2xl font-black text-slate-900 leading-tight">
            {formatCFA(financialSummary.totalFundsRemitted)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Remises déjà validées par la trésorerie
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Statut du Plafond
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                financialSummary.statusLevel === "URGENT"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : financialSummary.statusLevel === "ATTENTION"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {financialSummary.statusLabel}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${
                financialSummary.statusLevel === "URGENT"
                  ? "bg-rose-500"
                  : financialSummary.statusLevel === "ATTENTION"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{
                width: `${
                  financialSummary.ceilingThreshold > 0
                    ? Math.min(
                        100,
                        Math.round((financialSummary.fundsToRemit / financialSummary.ceilingThreshold) * 100)
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Plafond standard autorisé : {financialSummary.ceilingThreshold ? formatCFA(financialSummary.ceilingThreshold) : "Non défini"}
          </p>
        </div>
      </div>

      {/* Historique des remises d'espèces */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Historique de vos Remises au Coffre ({driverRemittances.length})
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Bordereaux de décharge physique enregistrés</p>
          </div>
        </div>

        {driverRemittances.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Aucune remise effectuée pour l'instant</p>
            <p className="text-[11px] text-slate-400">Vos bordereaux de remise d'espèces apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {driverRemittances.map((rem) => {
              const isValidated = rem.status === "VALIDATED";
              const isDiscrepancy = rem.status === "DISCREPANCY_DETECTED";

              return (
                <div
                  key={rem.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{rem.reference}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isValidated
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isDiscrepancy
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isValidated
                          ? "Validée au coffre"
                          : isDiscrepancy
                          ? "Écart constaté"
                          : "En cours"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Reçu par : <strong className="text-slate-800">{rem.receivedBy}</strong> · {rem.ordersCount} commande(s)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Date : {rem.receivedAt || rem.createdAt}
                    </p>
                    {rem.notes && (
                      <p className="text-[10px] text-slate-500 italic">
                        Note : {rem.notes}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-[9px] text-slate-400 uppercase font-extrabold">Montant versé</span>
                    <p className="text-base font-black text-slate-900">
                      {formatCFA(rem.receivedAmount || rem.amountDeclared)}
                    </p>
                    {isDiscrepancy && rem.discrepancyAmount && (
                      <span className="text-[10px] font-bold text-rose-600">
                        Écart : -{formatCFA(rem.discrepancyAmount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de versement d'espèces */}
      {remitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Effectuer un Versement</h3>
              </div>
              <button
                onClick={() => setRemitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Fonds sous votre responsabilité :</span>
                <strong className="text-slate-900 font-bold">{formatCFA(financialSummary.fundsToRemit)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Colis correspondants :</span>
                <strong className="text-slate-900 font-bold">{financialSummary.unremittedOrdersCount} colis</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Montant versé en espèces (GNF)</label>
              <input
                type="number"
                value={remitAmount}
                onChange={(e) => setRemitAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-lg font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Observations / Référence hub (facultatif)</label>
              <input
                type="text"
                value={remitNotes}
                onChange={(e) => setRemitNotes(e.target.value)}
                placeholder="Ex : Remise physique au hub de Ganhi..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setRemitModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRemittance}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirmer le versement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
