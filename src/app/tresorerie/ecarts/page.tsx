"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Bike,
  ExternalLink,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
  User,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function EcartsIndexPage() {
  const { codRemittances, codCollections, livreurs } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");

  // Aggregate all discrepancies across remittances and collections
  const ecartsList = useMemo(() => {
    const list: Array<{
      id: string;
      reference: string;
      type: "REMISE" | "COLLECTE";
      livreurId?: string;
      livreurName: string;
      amountExpected: number;
      amountCollected: number;
      discrepancyAmount: number;
      reason: string;
      date: string;
      status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
      orderNumber?: string;
    }> = [];

    // 1. From remittances
    codRemittances.forEach((r) => {
      if (r.discrepancyAmount && r.discrepancyAmount !== 0) {
        list.push({
          id: r.id,
          reference: r.reference,
          type: "REMISE",
          livreurId: r.livreurId,
          livreurName: r.livreurName,
          amountExpected: r.amountExpected || (r.receivedAmount || r.amountDeclared) + Math.abs(r.discrepancyAmount),
          amountCollected: r.receivedAmount || r.amountDeclared,
          discrepancyAmount: Math.abs(r.discrepancyAmount),
          reason: r.discrepancyJustification || r.discrepancyReason || "Écart lors du pointage de caisse",
          date: r.createdAt,
          status: r.status === "VALIDATED" ? "RESOLVED" : "OPEN",
        });
      }
    });

    // 2. From collections with discrepancies
    codCollections.forEach((c) => {
      if (c.discrepancy && c.discrepancy !== 0) {
        // avoid duplicates if already attached to remittance
        const alreadyInList = list.some((item) => item.id === c.orderId || item.reference === c.orderNumber);
        if (!alreadyInList) {
          const l = livreurs.find((liv) => liv.id === c.livreurId);
          list.push({
            id: c.orderId,
            reference: c.orderNumber,
            type: "COLLECTE",
            livreurId: c.livreurId,
            livreurName: l?.name || "Coursier",
            amountExpected: c.expectedAmount,
            amountCollected: c.collectedAmount,
            discrepancyAmount: Math.abs(c.discrepancy),
            reason: c.discrepancyJustification || "Écart de collecte client",
            date: c.deliveredAt,
            status: "OPEN",
            orderNumber: c.orderNumber,
          });
        }
      }
    });

    return list;
  }, [codRemittances, codCollections, livreurs]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = ecartsList.length;
    const totalAmount = ecartsList.reduce((sum, e) => sum + e.discrepancyAmount, 0);
    const openCount = ecartsList.filter((e) => e.status === "OPEN").length;
    return {
      totalCount,
      totalAmount,
      openCount,
    };
  }, [ecartsList]);

  // Filtered list
  const filteredEcarts = useMemo(() => {
    return ecartsList.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (driverFilter !== "ALL" && e.livreurId !== driverFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchRef = e.reference.toLowerCase().includes(q);
        const matchDriver = e.livreurName.toLowerCase().includes(q);
        const matchReason = e.reason.toLowerCase().includes(q);
        return matchRef || matchDriver || matchReason;
      }
      return true;
    });
  }, [ecartsList, statusFilter, driverFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold tracking-wide uppercase border border-rose-200/60">
              Contrôle &amp; Traçabilité
            </span>
            <span className="text-xs text-slate-400 font-medium">Espace Responsable de Trésorerie</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Écarts Financiers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Centre de gestion et d&apos;arbitrage des anomalies entre montants théoriques attendus et montants réellement encaissés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tresorerie/reconciliation"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Matrice de Réconciliation</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Anomalies</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.totalCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">{kpis.openCount} écart(s) en cours d&apos;examen</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Volume Cumulé des Écarts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {formatCFA(kpis.totalAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Impact potentiel sur la trésorerie</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut Traitement</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            100% Tracés
          </div>
          <p className="text-xs text-slate-500 mt-1">Aucune perte silencieuse</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher référence, coursier, motif..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          <div className="relative">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les coursiers</option>
              {livreurs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="OPEN">🔴 Ouvert / En examen</option>
              <option value="RESOLVED">✓ Résolu / Validé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Discrepancies */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Journal des Écarts Détectés ({filteredEcarts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Chaque anomalie fait l&apos;objet d&apos;un dossier contradictoire auditable.
            </p>
          </div>
        </div>

        {filteredEcarts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Aucun écart constaté</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Toutes les collectes et remises sont parfaitement équilibrées selon les filtres sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-4">Référence</th>
                  <th className="py-3.5 px-4">Coursier</th>
                  <th className="py-3.5 px-4 text-right">Attendu</th>
                  <th className="py-3.5 px-4 text-right">Reçu / Collecté</th>
                  <th className="py-3.5 px-4 text-right">Écart</th>
                  <th className="py-3.5 px-4">Motif / Justification</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEcarts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/tresorerie/ecarts/${item.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        {item.reference}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.livreurName}</div>
                      {item.livreurId && (
                        <Link
                          href={`/tresorerie/livreurs/${item.livreurId}`}
                          className="text-[10px] text-slate-500 hover:underline hover:text-slate-900"
                        >
                          Voir compte
                        </Link>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                      {formatCFA(item.amountExpected)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCFA(item.amountCollected)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-rose-600">
                      -{formatCFA(item.discrepancyAmount)}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                      {item.reason}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {item.date}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tresorerie/ecarts/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all shadow-2xs"
                      >
                        <span>Examiner</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
