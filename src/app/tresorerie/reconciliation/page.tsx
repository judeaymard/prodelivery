"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
  Bike,
  Vault,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function ReconciliationPage() {
  const { orders, livreurs, codRemittances, getDriverCodFunds } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");

  // 1. Total COD Livré
  const deliveredOrders = useMemo(() => {
    return orders.filter((o) => o.status === "LIVREE");
  }, [orders]);

  const totalCodTheorique = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [deliveredOrders]);

  // 2. Total Pointé au Coffre
  const validatedRemittances = useMemo(() => {
    return codRemittances.filter(
      (r) => r.status === "VALIDATED" || r.status === "PARTIALLY_VALIDATED"
    );
  }, [codRemittances]);

  const totalCoffreReel = useMemo(() => {
    return validatedRemittances.reduce(
      (sum, r) => sum + (r.amountValidated || r.receivedAmount || r.amountDeclared),
      0
    );
  }, [validatedRemittances]);

  // 3. Synthèse par coursier
  const driverSummaries = useMemo(() => {
    return livreurs.map((l) => {
      const summary = getDriverCodFunds(l.id);
      const driverRemittances = codRemittances.filter((r) => r.livreurId === l.id);
      const validatedTotal = driverRemittances
        .filter((r) => r.status === "VALIDATED" || r.status === "PARTIALLY_VALIDATED")
        .reduce((sum, r) => sum + (r.amountValidated || r.receivedAmount || r.amountDeclared), 0);

      const driverDiscrepancies = driverRemittances
        .filter((r) => r.discrepancyAmount && r.discrepancyAmount !== 0)
        .map((r) => ({
          ref: r.reference,
          amount: r.discrepancyAmount || 0,
          reason: r.discrepancyReason || r.discrepancyJustification || "Écart non justifié",
        }));

      return {
        ...summary,
        driver: l,
        validatedTotal,
        discrepancies: driverDiscrepancies,
        isConforme: driverDiscrepancies.length === 0,
      };
    });
  }, [livreurs, codRemittances, getDriverCodFunds]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return driverSummaries.filter((d) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return d.livreurName.toLowerCase().includes(q) || d.statusLabel.toLowerCase().includes(q);
      }
      return true;
    });
  }, [driverSummaries, searchTerm]);

  // 4. Total fonds en circulation
  const totalFondsEnCirculation = useMemo(() => {
    return driverSummaries.reduce((sum, d) => sum + d.fundsToRemit, 0);
  }, [driverSummaries]);

  // Total discrepancies
  const totalDiscrepanciesAmount = useMemo(() => {
    return codRemittances.reduce((sum, r) => sum + Math.abs(r.discrepancyAmount || 0), 0);
  }, [codRemittances]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. TOP CARDS : MATRICE QUADRIPARTITE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. COD Livré (Théorique)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCFA(totalCodTheorique)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sur l&apos;ensemble des colis livrés</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Validé au Coffre</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Vault className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatCFA(totalCoffreReel)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Espèces comptées et sécurisées</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Fonds en Circulation</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {formatCFA(totalFondsEnCirculation)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Détenus par les coursiers en tournée</p>
        </div>

        <Link
          href="/tresorerie/ecarts"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 transition-all group block"
          title="Consulter le centre de gestion des écarts financiers"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-600 transition-colors">
              4. Écarts Traités
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {formatCFA(totalDiscrepanciesAmount)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">Total des écarts justifiés</p>
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5 group-hover:underline">
              Gérer <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* 2. RECONCILIATION AUDIT MATRIX */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              Matrice de Réconciliation &amp; Rapprochement par Coursier
            </h2>
            <p className="text-xs text-slate-500">
              Contrôle strict : COD Collecté = Fonds Versés au Coffre + Fonds Restant à Remettre + Écarts Justifiés.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher coursier..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Livreur</th>
                <th className="py-3 px-4 text-center">Colis non remis</th>
                <th className="py-3 px-4 text-right">Validé au Coffre</th>
                <th className="py-3 px-4 text-right">Fonds en Attente</th>
                <th className="py-3 px-4 text-center">Écarts Signalés</th>
                <th className="py-3 px-4 text-right">Statut Conformité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.map((item) => {
                const hasPendingFunds = item.fundsToRemit > 0;
                const hasDiscrepancy = item.discrepancies.length > 0;

                return (
                  <tr key={item.livreurId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {item.livreurName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.livreurName}</p>
                          <p className="text-[10px] text-slate-400">{item.statusLabel}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {item.unremittedOrdersCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px]">
                          {item.unremittedOrdersCount} colis
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap font-mono">
                      {formatCFA(item.validatedTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap font-mono">
                      {hasPendingFunds ? (
                        <span className="text-slate-900">{formatCFA(item.fundsToRemit)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] whitespace-nowrap">0 GNF (À jour)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {hasDiscrepancy ? (
                        <div className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{item.discrepancies.length} écart(s)</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                          0 écart
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {hasDiscrepancy ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 whitespace-nowrap">
                          Écart à Examiner
                        </span>
                      ) : hasPendingFunds ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 whitespace-nowrap">
                          En Cours de Tournée
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                          ✓ Conforme
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {hasDiscrepancy && (
                          <Link
                            href="/tresorerie/ecarts"
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 border border-rose-200/60 shrink-0 whitespace-nowrap"
                            title="Consulter et traiter les écarts"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Voir l&apos;écart</span>
                          </Link>
                        )}
                        <Link
                          href={`/tresorerie/livreurs/${item.livreurId}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                          title="Fiche financière détaillée"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Détail</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden p-4 space-y-3">
          {filteredSummaries.map((item) => {
            const hasPendingFunds = item.fundsToRemit > 0;
            const hasDiscrepancy = item.discrepancies.length > 0;

            return (
              <div
                key={item.livreurId}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {item.livreurName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.livreurName}</p>
                      <p className="text-[10px] text-slate-400">{item.statusLabel}</p>
                    </div>
                  </div>
                  <div>
                    {hasDiscrepancy ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        Écart
                      </span>
                    ) : hasPendingFunds ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        En tournée
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Conforme
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Validé Coffre</span>
                    <span className="font-bold text-emerald-700">{formatCFA(item.validatedTotal)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Fonds en Attente</span>
                    <span className="font-bold text-slate-900">{formatCFA(item.fundsToRemit)}</span>
                  </div>
                </div>

                {hasDiscrepancy ? (
                  <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{item.discrepancies.length} anomalie(s)</span>
                    </span>
                    <Link
                      href="/tresorerie/ecarts"
                      className="text-rose-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Traiter</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : null}

                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={`/tresorerie/livreurs/${item.livreurId}`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <span>Fiche financière coursier</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
