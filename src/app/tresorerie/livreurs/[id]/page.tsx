"use client";

import React, { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Package,
  Phone,
  Receipt,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function TresorerieLivreurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const driverId = resolvedParams.id;

  const {
    livreurs,
    codCollections,
    codRemittances,
    getDriverCodFunds,
    logAuditEvent,
  } = useOperations();

  // Selected driver
  const livreur = useMemo(() => {
    return livreurs.find((l) => l.id === driverId) || livreurs[0];
  }, [livreurs, driverId]);

  // Financial summary for this driver
  const summary = useMemo(() => {
    return getDriverCodFunds(driverId);
  }, [driverId, getDriverCodFunds]);

  // Historical remittances for this driver
  const driverRemittances = useMemo(() => {
    return codRemittances.filter((r) => r.livreurId === driverId);
  }, [codRemittances, driverId]);

  // Unremitted or recent collections for this driver
  const driverCollections = useMemo(() => {
    return codCollections.filter((c) => c.livreurId === driverId);
  }, [codCollections, driverId]);

  // Filter unremitted collections (making up current funds)
  const unremittedCollections = useMemo(() => {
    const unremitted = driverCollections.filter(
      (c) => c.remittanceStatus !== "VALIDATED" && c.collectionStatus !== "NOT_COLLECTED"
    );
    if (unremitted.length === 0 && summary.fundsToRemit > 0) {
      return driverCollections;
    }
    return unremitted;
  }, [driverCollections, summary.fundsToRemit]);

  // Open discrepancies for this driver
  const openDiscrepancies = useMemo(() => {
    const fromRemittances = driverRemittances.filter(
      (r) => r.status === "DISCREPANCY_DETECTED" || (r.discrepancyAmount && r.discrepancyAmount !== 0)
    );
    const fromCollections = driverCollections.filter(
      (c) => c.remittanceStatus === "DISCREPANCY_DETECTED" || (c.discrepancy && c.discrepancy !== 0)
    );
    return {
      remittances: fromRemittances,
      collections: fromCollections,
      totalCount: fromRemittances.length + fromCollections.length,
      amount:
        fromRemittances.reduce((sum, r) => sum + Math.abs(r.discrepancyAmount || 0), 0) +
        fromCollections.reduce((sum, c) => sum + Math.abs(c.discrepancy || 0), 0),
    };
  }, [driverRemittances, driverCollections]);

  // Timeframe state for visual analytics (7 jours, 30 jours, 3 mois)
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("30D");

  // Audit trace upon viewing driver
  useEffect(() => {
    if (livreur) {
      try {
        logAuditEvent?.({
          actor: {
            id: "usr-treasury",
            name: "Amina Tidjani",
            role: "Responsable Trésorerie",
            type: "USER",
          },
          action: "TREASURY_DRIVER_VIEWED",
          actionLabel: `Consultation fiche financière: ${livreur.name}`,
          module: "TRESORERIE",
          entityType: "LIVREUR",
          entityId: livreur.id,
          entityReference: `LIV-${livreur.id}`,
          severity: "INFO",
          result: "SUCCESS",
          description: `Consultation de la fiche financière du livreur ${livreur.name} (${formatCFA(summary.fundsToRemit)} détenus)`,
        });
      } catch {
        // safe fallback
      }
    }
  }, [livreur?.id]);

  // Audit trace on timeframe change / financial history inspection
  useEffect(() => {
    if (livreur) {
      try {
        logAuditEvent?.({
          actor: {
            id: "usr-treasury",
            name: "Amina Tidjani",
            role: "Responsable Trésorerie",
            type: "USER",
          },
          action: "TREASURY_DRIVER_FINANCIAL_HISTORY_VIEWED",
          actionLabel: `Audit historique financier: ${livreur.name}`,
          module: "TRESORERIE",
          entityType: "LIVREUR",
          entityId: livreur.id,
          entityReference: `LIV-${livreur.id}`,
          severity: "INFO",
          result: "SUCCESS",
          description: `Inspection de l'historique financier et cadence de remise (${timeframe})`,
        });
      } catch {
        // safe fallback
      }
    }
  }, [timeframe]);

  // Handle click on "Enregistrer une remise"
  const handleStartRemittance = () => {
    try {
      logAuditEvent?.({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "TREASURY_DRIVER_REMITTANCE_STARTED",
        actionLabel: `Démarrage remise: ${livreur?.name}`,
        module: "TRESORERIE",
        entityType: "REMITTANCE",
        entityId: driverId,
        entityReference: `REM-LIV-${driverId}`,
        severity: "INFO",
        result: "SUCCESS",
        description: `Initialisation d'une procédure de remise pour ${livreur?.name} (${formatCFA(summary.fundsToRemit)})`,
      });
    } catch {
      // safe fallback
    }
    router.push(`/tresorerie/remises?driverId=${driverId}&action=new`);
  };

  // Mock periods for the chart based on timeframe
  const chartData = useMemo(() => {
    if (timeframe === "7D") {
      return [
        { label: "Lun", collectes: 45000, remises: 45000 },
        { label: "Mar", collectes: 60000, remises: 60000 },
        { label: "Mer", collectes: 55000, remises: 55000 },
        { label: "Jeu", collectes: 40000, remises: 40000 },
        { label: "Ven", collectes: 70000, remises: 0 },
        { label: "Sam", collectes: 42000, remises: 0 },
        { label: "Dim", collectes: 38000, remises: 0 },
      ];
    }
    if (timeframe === "30D") {
      return [
        { label: "Semaine 1", collectes: 650000, remises: 650000 },
        { label: "Semaine 2", collectes: 720000, remises: 720000 },
        { label: "Semaine 3", collectes: 580000, remises: 580000 },
        { label: "Semaine 4", collectes: 500000, remises: 350000 },
      ];
    }
    return [
      { label: "Mois 1", collectes: 2100000, remises: 2100000 },
      { label: "Mois 2", collectes: 2450000, remises: 2450000 },
      { label: "Mois 3 (En cours)", collectes: 2450000, remises: 2300000 },
    ];
  }, [timeframe]);

  if (!livreur) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-3xl border border-slate-200 space-y-3 my-12">
        <p className="text-sm font-bold text-slate-900">Livreur introuvable.</p>
        <Link
          href="/tresorerie/livreurs"
          className="text-xs font-bold text-blue-600 hover:underline inline-block"
        >
          Retour à la liste des livreurs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ==================================================
          NAVIGATION & RETOUR
          ================================================== */}
      <div className="flex items-center justify-between">
        <Link
          href="/tresorerie/livreurs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux livreurs
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/tresorerie/remises"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            Journal des remises
          </Link>
        </div>
      </div>

      {/* ==================================================
          11. HEADER DU LIVREUR (VUE FINANCIÈRE)
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-xl shrink-0 shadow-md">
              {livreur.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  {livreur.id}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {livreur.zone}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {livreur.phone}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {livreur.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                {summary.hasDiscrepancy || summary.operationalStatus === "Écart détecté" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    🟠 Écart ouvert
                  </span>
                ) : summary.operationalStatus === "En retard" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    🔴 Remise en retard
                  </span>
                ) : summary.fundsToRemit > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    À remettre
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    🟢 Situation normale
                  </span>
                )}
                <span className="text-xs text-slate-400">• Flotte active</span>
              </div>
            </div>
          </div>

          {/* Action principale : Enregistrer une remise */}
          {summary.fundsToRemit > 0 ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleStartRemittance}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-lg"
              >
                <Banknote className="w-4 h-4" />
                <span>Enregistrer une remise</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tous les fonds COD de ce livreur sont en règle au coffre.</span>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          20. BANNIÈRE D'ALERTE ÉCART SI PRÉSENT
          ================================================== */}
      {openDiscrepancies.totalCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ⚠ Écart financier ouvert sur ce livreur
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Montant en suspens : <strong className="text-amber-700">{formatCFA(openDiscrepancies.amount || 0)}</strong> • Statut :{" "}
                <span className="font-semibold text-slate-700">En cours d&apos;examen contradictoire</span>
              </p>
            </div>
          </div>
          <Link
            href={`/tresorerie/ecarts/${openDiscrepancies.remittances[0]?.id || openDiscrepancies.collections[0]?.orderId || ""}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <span>Voir l&apos;écart</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ==================================================
          12. RÉSUMÉ FINANCIER (4 CARTES COHÉRENTES)
          ================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOTAL COLLECTÉ */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total collecté</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCFA(summary.totalCodCollected)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Cumul historique encaissé</p>
        </div>

        {/* TOTAL REMIS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total remis</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCFA(summary.totalFundsRemitted)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Validé au coffre central</p>
        </div>

        {/* FONDS ACTUELLEMENT DÉTENUS (Formule = Collecté - Remis) */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Fonds actuellement détenus</p>
          <p className="text-2xl font-black text-blue-800 font-mono mt-1">
            {formatCFA(summary.fundsToRemit)}
          </p>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">
            {summary.fundsToRemit > 0 ? "Espèces en circulation" : "Solde régularisé"}
          </p>
        </div>

        {/* ÉCARTS OUVERTS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Écarts ouverts</p>
          <p
            className={`text-2xl font-black mt-1 ${
              openDiscrepancies.totalCount > 0 ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {openDiscrepancies.totalCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {openDiscrepancies.totalCount > 0 ? formatCFA(openDiscrepancies.amount) : "Aucun litige"}
          </p>
        </div>
      </div>

      {/* ==================================================
          13. SITUATION ACTUELLE (SECTION PRIORITAIRE)
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Situation actuelle</h2>
          </div>
          <span className="text-[11px] text-slate-500">Source : Encaissements temps réel</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Montant à remettre</span>
            <p className="text-lg font-black text-blue-700 font-mono mt-1">
              {formatCFA(summary.fundsToRemit)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Commandes concernées</span>
            <p className="text-lg font-black text-slate-900 mt-1">
              {summary.unremittedOrdersCount} colis
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Plus ancienne collecte</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {summary.oldestCollectionDate || "Il y a 6 heures"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Échéance</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {summary.nextRemittanceDeadline}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Statut</span>
            <p className="text-xs font-black text-slate-900 mt-1">
              {summary.fundsToRemit > 0 ? "À remettre" : "À jour"}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          14. COMMANDES CONCERNÉES (FONDEMENT DES FONDS)
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Commandes composant les fonds actuellement détenus ({unremittedCollections.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Traçabilité unitaire</span>
        </div>

        {unremittedCollections.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Aucun colis en attente de versement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">ID commande</th>
                  <th className="py-3 px-3">E-commerçant</th>
                  <th className="py-3 px-3">Date livraison</th>
                  <th className="py-3 px-3 text-right">Montant COD</th>
                  <th className="py-3 px-3 text-right">Montant collecté</th>
                  <th className="py-3 px-3 text-right">Montant déjà remis</th>
                  <th className="py-3 px-3 text-right">Montant restant</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unremittedCollections.map((col) => {
                  const remittedAmount =
                    col.remittanceStatus === "VALIDATED" ? col.collectedAmount : 0;
                  const remainingAmount =
                    col.remittanceStatus === "VALIDATED" ? 0 : col.collectedAmount;

                  return (
                    <tr key={col.orderId} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID Commande avec lien */}
                      <td className="py-3 px-3 font-bold">
                        <Link
                          href={`/admin/commandes/${col.orderId}`}
                          className="text-blue-600 hover:text-blue-800 font-mono inline-flex items-center gap-1"
                        >
                          <span>{col.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      {/* E-commerçant */}
                      <td className="py-3 px-3 text-slate-800 font-medium">{col.partnerName}</td>

                      {/* Date livraison */}
                      <td className="py-3 px-3 text-slate-500">{col.deliveredAt}</td>

                      {/* Montant COD prévu */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {formatCFA(col.expectedAmount)}
                      </td>

                      {/* Montant collecté */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCFA(col.collectedAmount)}
                      </td>

                      {/* Montant déjà remis */}
                      <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                        {formatCFA(remittedAmount)}
                      </td>

                      {/* Montant restant */}
                      <td className="py-3 px-3 text-right font-black text-blue-700 font-mono">
                        {formatCFA(remainingAmount)}
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-3 text-center">
                        {col.remittanceStatus === "VALIDATED" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Remis
                          </span>
                        ) : col.remittanceStatus === "DISCREPANCY_DETECTED" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Écart
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            À remettre
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================
          16. ÉVOLUTION DES FONDS (VISUALISATION UTILE)
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Évolution des collectes vs remises
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi de la cadence de restitution physique des espèces
            </p>
          </div>

          {/* Sélecteur de période */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "7D", label: "7 jours" },
                { id: "30D", label: "30 jours" },
                { id: "90D", label: "3 mois" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeframe(btn.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframe === btn.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualisation en barres horizontales comparatives */}
        <div className="space-y-3 pt-2">
          {chartData.map((item, idx) => {
            const maxVal = Math.max(
              ...chartData.map((d) => Math.max(d.collectes, d.remises)),
              1
            );
            const collectesPct = (item.collectes / maxVal) * 100;
            const remisesPct = (item.remises / maxVal) * 100;

            return (
              <div key={idx} className="space-y-1 bg-slate-50/60 p-3 rounded-xl">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{item.label}</span>
                  <div className="flex gap-4 text-[11px]">
                    <span className="text-blue-700">Collecté : {formatCFA(item.collectes)}</span>
                    <span className="text-emerald-700">Remis : {formatCFA(item.remises)}</span>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  {/* Collectes Bar */}
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${collectesPct}%` }}
                    />
                  </div>
                  {/* Remises Bar */}
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${remisesPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          15. HISTORIQUE DES REMISES
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Historique des remises ({driverRemittances.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Piste inaltérable</span>
        </div>

        {driverRemittances.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Aucune remise enregistrée pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">Référence</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Montant attendu</th>
                  <th className="py-3 px-3 text-right">Montant reçu</th>
                  <th className="py-3 px-3 text-right">Écart</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-3">Reçu par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driverRemittances.map((rem) => {
                  const discrepancy = rem.discrepancyAmount || 0;
                  return (
                    <tr key={rem.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {rem.reference}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {rem.validatedAt || rem.createdAt}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {formatCFA(rem.amountExpected)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {formatCFA(rem.amountValidated || rem.receivedAmount || rem.amountDeclared)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">
                        {discrepancy !== 0 ? (
                          <span className="text-rose-600">-{formatCFA(Math.abs(discrepancy))}</span>
                        ) : (
                          <span className="text-slate-400">0 GNF</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            rem.status === "VALIDATED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rem.status === "DISCREPANCY_DETECTED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {rem.status === "VALIDATED"
                            ? "Validée"
                            : rem.status === "DISCREPANCY_DETECTED"
                            ? "Écart détecté"
                            : "Partiellement validée"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {rem.validatedBy || rem.receivedBy || "Trésorier"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================
          17. ALERTES DU LIVREUR
          ================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-600" />
          Alertes actives du livreur
        </h2>

        <div className="space-y-2">
          {summary.fundsToRemit > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
              <span className="font-bold text-base leading-none">⚠</span>
              <div>
                <strong>{formatCFA(summary.fundsToRemit)} à remettre au coffre.</strong>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  Montant collecté en attente de décharge physique par le trésorier.
                </p>
              </div>
            </div>
          )}

          {summary.operationalStatus === "En retard" && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <span className="font-bold text-base leading-none">🔴</span>
              <div>
                <strong>Fonds détenus depuis plus de 24 heures.</strong>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  L&apos;échéance réglementaire de remise des espèces a été dépassée.
                </p>
              </div>
            </div>
          )}

          {openDiscrepancies.totalCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <span className="font-bold text-base leading-none">🟠</span>
              <div>
                <strong>Une remise ou collecte précédente possède un écart ouvert.</strong>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Vérification contradictoire nécessaire avec le livreur et le commerçant.
                </p>
              </div>
            </div>
          )}

          {summary.fundsToRemit === 0 && openDiscrepancies.totalCount === 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aucune alerte active pour ce livreur. Situation financière exemplaire.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
