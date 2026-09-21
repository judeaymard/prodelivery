"use client";

import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Bike,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Package,
  PackageCheck,
  Plus,
  Receipt,
  Scale,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  AlertTriangle,
  FileText,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { RemittanceStatus } from "@/lib/types";

export default function RemiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const {
    codRemittances,
    codCollections,
    livreurs,
    orders,
    activeTreasuryManager,
    receiveDriverRemittance,
  } = useOperations();

  // Trouver la remise par ID ou reference
  const remittance = useMemo(() => {
    return codRemittances.find(
      (r) =>
        r.id === id ||
        r.reference.toLowerCase() === id.toLowerCase() ||
        r.orderIds.includes(id)
    );
  }, [codRemittances, id]);

  // Livreur associe
  const livreur = useMemo(() => {
    if (!remittance) return null;
    return (
      livreurs.find((l) => l.id === remittance.livreurId) || {
        id: remittance.livreurId,
        name: remittance.livreurName,
        phone: "+229 97 00 00 00",
        zone: "Conakry",
        status: "ACTIF" as const,
        avatar: "",
        totalDeliveries: 0,
        rating: 4.8,
      }
    );
  }, [remittance, livreurs]);

  // Calculs financiers stricts
  const expectedAmount = remittance?.amountExpected ?? 0;
  const receivedAmount = remittance
    ? remittance.receivedAmount || remittance.amountValidated || remittance.amountDeclared || 0
    : 0;

  // Formule stricte : Reste >= 0, jamais negatif
  const rawDifference = expectedAmount - receivedAmount;
  const remainingToReceive = Math.max(0, rawDifference);
  const isSurplusAnomaly = receivedAmount > expectedAmount;
  const surplusAmount = isSurplusAnomaly ? receivedAmount - expectedAmount : 0;

  // Verification de l'ecart
  const hasDiscrepancy =
    (remittance?.discrepancyAmount && remittance.discrepancyAmount !== 0) ||
    remittance?.status === "DISCREPANCY_DETECTED";

  const discrepancyAmount = Math.abs(
    remittance?.discrepancyAmount || (rawDifference > 0 ? rawDifference : 0)
  );

  // Commandes concernees
  const associatedCollections = useMemo(() => {
    if (!remittance) return [];
    return codCollections.filter(
      (c) =>
        c.remittanceId === remittance.id ||
        remittance.orderIds.includes(c.orderId) ||
        remittance.orderIds.includes(c.orderNumber)
    );
  }, [remittance, codCollections]);

  // Fallback si pas directement dans codCollections
  const associatedOrders = useMemo(() => {
    if (associatedCollections.length > 0) {
      return associatedCollections.map((c) => ({
        orderId: c.orderId,
        orderNumber: c.orderNumber,
        partnerName: c.partnerName,
        clientName: c.clientName,
        collectedAmount: c.collectedAmount,
        expectedAmount: c.expectedAmount,
        deliveredAt: c.deliveredAt,
        status: c.remittanceStatus,
      }));
    }
    if (!remittance) return [];
    return remittance.orderIds.map((orderId, idx) => {
      const matchOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      return {
        orderId: matchOrder?.id || orderId,
        orderNumber: matchOrder?.orderNumber || `CMD-${1040 + idx}`,
        partnerName: matchOrder?.partnerName || "Marchand Partenaire",
        clientName: matchOrder?.clientName || "Client Réceptionnaire",
        collectedAmount:
          matchOrder?.totalPrice || Math.round(expectedAmount / (remittance.ordersCount || 1)),
        expectedAmount:
          matchOrder?.totalPrice || Math.round(expectedAmount / (remittance.ordersCount || 1)),
        deliveredAt: matchOrder?.deliveredAt || remittance.createdAt,
        status: remittance.status === "VALIDATED" ? "VALIDATED" : "PENDING",
      };
    });
  }, [associatedCollections, remittance, orders, expectedAmount]);

  // Modale de complement de remise si partielle
  const [showComplementModal, setShowComplementModal] = useState(false);
  const [complementInput, setComplementInput] = useState(remainingToReceive.toString());
  const [complementNotes, setComplementNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveComplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittance || !livreur) return;
    const compAmount = parseInt(complementInput) || 0;
    if (compAmount <= 0) return;

    setIsSubmitting(true);
    try {
      receiveDriverRemittance({
        livreurId: livreur.id,
        receivedAmount: compAmount,
        receivedBy: activeTreasuryManager?.name || "Amina Tidjani",
        receivedById: activeTreasuryManager?.id || "tm-1",
        notes: `Complement de remise pour ${remittance.reference}. ${complementNotes}`.trim(),
        remittanceType: compAmount >= remainingToReceive ? "FULL" : "PARTIAL",
      });

      setShowComplementModal(false);
      setToastMessage(`✓ Complement de ${formatCFA(compAmount)} enregistre avec succes.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: RemittanceStatus | undefined) => {
    switch (status) {
      case "VALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Validee
          </span>
        );
      case "PARTIALLY_VALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-4 h-4 text-sky-600" />
            Partielle
          </span>
        );
      case "DISCREPANCY_DETECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Ecart detecte
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            En contestation
          </span>
        );
      case "PENDING_VALIDATION":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            En attente de pointage
          </span>
        );
    }
  };

  if (!remittance) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Receipt className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Remise introuvable</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          La reference &ldquo;{id}&rdquo; ne correspond a aucun bordereau de remise enregistre dans le systeme de tresorerie.
        </p>
        <div className="pt-2">
          <Link
            href="/tresorerie/remises"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux remises livreurs</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium flex-1">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/tresorerie/remises"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour aux remises</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-slate-500">
            {remittance.reference}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {livreur && (
            <Link
              href={`/tresorerie/livreurs/${livreur.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fiche financiere du livreur</span>
            </Link>
          )}
          {hasDiscrepancy && (
            <Link
              href={`/tresorerie/ecarts/${remittance.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Voir l&apos;ecart associe</span>
            </Link>
          )}
        </div>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                {remittance.reference}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {remittance.period || "Tournee de livraison"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bordereau de Remise Livreur
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enregistre le {remittance.validatedAt || remittance.receivedAt || remittance.createdAt}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(remittance.status)}
            {remittance.status === "PARTIALLY_VALIDATED" && remainingToReceive > 0 && (
              <button
                onClick={() => setShowComplementModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enregistrer un complement</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: RESUME FINANCIER (ATTENDU, REMIS, RESTE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Montant Attendu */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Montant attendu
          </span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            {formatCFA(expectedAmount)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Total des fonds COD assignes aux {associatedOrders.length} colis
          </span>
        </div>

        {/* Montant Remis */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Montant remis au coffre
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight mt-1">
            {formatCFA(receivedAmount)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Espèces physiquement comptees et validees
          </span>
        </div>

        {/* Reste a recevoir (Prioritaire si > 0) */}
        <div
          className={`p-5 rounded-3xl border shadow-xs transition-all ${
            remainingToReceive > 0
              ? "bg-rose-50/70 border-rose-200 ring-2 ring-rose-500/20"
              : isSurplusAnomaly
              ? "bg-indigo-50/70 border-indigo-200"
              : "bg-emerald-50/50 border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                remainingToReceive > 0
                  ? "text-rose-700"
                  : isSurplusAnomaly
                  ? "text-indigo-700"
                  : "text-emerald-700"
              }`}
            >
              {remainingToReceive > 0
                ? "Reste a recevoir"
                : isSurplusAnomaly
                ? "Excedent (Anomalie)"
                : "Solde de la remise"}
            </span>
            {remainingToReceive > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-800">
                Action requise
              </span>
            )}
          </div>

          <div
            className={`text-2xl font-black tracking-tight mt-1 ${
              remainingToReceive > 0
                ? "text-rose-600 font-black"
                : isSurplusAnomaly
                ? "text-indigo-700"
                : "text-emerald-600"
            }`}
          >
            {remainingToReceive > 0
              ? formatCFA(remainingToReceive)
              : isSurplusAnomaly
              ? `+${formatCFA(surplusAmount)}`
              : "0 GNF (Entierement solde)"}
          </div>

          <span
            className={`text-xs mt-1 block ${
              remainingToReceive > 0
                ? "text-rose-700 font-medium"
                : isSurplusAnomaly
                ? "text-indigo-600"
                : "text-emerald-700"
            }`}
          >
            {remainingToReceive > 0
              ? "Montant restant du sous la responsabilite du coursier"
              : isSurplusAnomaly
              ? "Surplus d'espèces consigne en ajustement de caisse"
              : "Aucun reliquat ni solde en suspens"}
          </span>
        </div>
      </div>

      {/* ALERTE ECART SI PRESENT */}
      {hasDiscrepancy && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-900">
                Ecart financier constate de {formatCFA(discrepancyAmount)}
              </h4>
              <p className="text-xs text-rose-700 mt-0.5 max-w-xl">
                {remittance.discrepancyJustification ||
                  remittance.discrepancyReason ||
                  "Une anomalie ou un montant manquant a ete consigne lors du pointage d'espèces."}
              </p>
            </div>
          </div>
          <Link
            href={`/tresorerie/ecarts/${remittance.id}`}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <span>Traiter dans Ecarts Financiers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* SECTION 2: LIVREUR & RESPONSABLE VALIDATEUR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Livreur concerne */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-slate-500" />
            Livreur concerne
          </span>
          {livreur ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center border border-slate-200">
                  {livreur.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{livreur.name}</div>
                  <div className="text-xs text-slate-500">
                    {livreur.phone} • {livreur.zone}
                  </div>
                </div>
              </div>
              <Link
                href={`/tresorerie/livreurs/${livreur.id}`}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Consulter la fiche livreur"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-xs text-slate-600">{remittance.livreurName}</div>
          )}
        </div>

        {/* Traçabilite & Validation */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Validation &amp; Coffre-Fort
          </span>
          <div className="pt-1 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Receptionne &amp; valide par :</span>
              <strong className="text-slate-900">
                {remittance.validatedBy || remittance.receivedBy || "Amina Tidjani"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date et heure de validation :</span>
              <span className="text-slate-800 font-medium">
                {remittance.validatedAt || remittance.receivedAt || remittance.createdAt}
              </span>
            </div>
            {remittance.notes && (
              <div className="pt-2 border-t border-slate-100 text-slate-600 italic">
                &ldquo;{remittance.notes}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: CHAÎNE DE TRAÇABILITÉ (ORIGINE DU MONTANT) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-600" />
          Chaîne de Traçabilite Financiere (Origine des fonds)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Commandes</span>
            <div className="font-bold text-slate-900">{associatedOrders.length} colis livres</div>
            <div className="text-[11px] text-slate-500">Clients finaux</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">2. Encaissement COD</span>
            <div className="font-bold text-emerald-600">{formatCFA(expectedAmount)}</div>
            <div className="text-[11px] text-slate-500">Espèces collectees</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">3. Remise Caisse</span>
            <div className="font-bold text-slate-900">{formatCFA(receivedAmount)}</div>
            <div className="text-[11px] text-slate-500">Pointage au Hub</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">4. Grand Livre</span>
            <div className="font-bold text-slate-900">Ecriture generee</div>
            <div className="text-[11px] text-emerald-600 font-medium">TX-REM-{remittance.reference}</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: COMMANDES CONCERNÉES (TABLEAU DÉTAILLÉ) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Commandes Concernees ({associatedOrders.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Colis dont les fonds ont fait l&apos;objet de cette remise financiere.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">N° Commande</th>
                <th className="py-3 px-4">E-commerçant</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Date de livraison</th>
                <th className="py-3 px-4 text-right">Montant COD</th>
                <th className="py-3 px-4 text-right">Encaisse</th>
                <th className="py-3 px-4 text-right">Reste</th>
                <th className="py-3 px-4">Statut Remise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {associatedOrders.map((ord, idx) => (
                <tr key={`${ord.orderId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href="/admin/commandes"
                      className="font-mono font-bold text-slate-900 hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      {ord.orderNumber}
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {ord.partnerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {ord.clientName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {ord.deliveredAt}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                    {formatCFA(ord.expectedAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                    {formatCFA(ord.collectedAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {remittance.status === "VALIDATED" ? "0 GNF" : formatCFA(remainingToReceive)}
                  </td>
                  <td className="py-3.5 px-4">
                    {remittance.status === "VALIDATED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Apuree
                      </span>
                    ) : remittance.status === "PARTIALLY_VALIDATED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        Partielle
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Ecart
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ENREGISTRER UN COMPLEMENT (POUR REMISE PARTIELLE) */}
      {showComplementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  Apurement de solde
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Enregistrer un complement de remise
                </h3>
              </div>
              <button
                onClick={() => setShowComplementModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComplement} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bordereau :</span>
                  <span className="font-mono font-bold text-slate-900">{remittance.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Livreur :</span>
                  <strong className="text-slate-900">{livreur?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reste attendu :</span>
                  <strong className="text-rose-600 font-black">{formatCFA(remainingToReceive)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Montant du complement verse (GNF) *
                </label>
                <input
                  type="number"
                  value={complementInput}
                  onChange={(e) => setComplementInput(e.target.value)}
                  min="500"
                  step="500"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-lg font-black text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Observations
                </label>
                <input
                  type="text"
                  value={complementNotes}
                  onChange={(e) => setComplementNotes(e.target.value)}
                  placeholder="Ex : Reglement du reliquat de tournee..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComplementModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || parseInt(complementInput) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs disabled:bg-slate-300"
                >
                  {isSubmitting ? "Enregistrement..." : `Valider ${formatCFA(parseInt(complementInput) || 0)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
