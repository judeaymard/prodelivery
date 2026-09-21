"use client";

import React, { use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOperations } from "@/lib/store";
import { 
  ArrowLeft, 
  Percent, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  Building2, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Receipt,
  Info,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Printer
} from "lucide-react";
import { formatCFA } from "@/lib/mock-data";
import { EnoCommission, CommissionType, CommissionStatus, Partner } from "@/lib/types";

export default function CommissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const commissionId = decodeURIComponent(resolvedParams.id);
  const router = useRouter();

  const { 
    orders, 
    partners, 
    payoutRequests, 
    platformSettings, 
    logAuditEvent 
  } = useOperations();

  // Audit trail conforme au store
  useEffect(() => {
    try {
      logAuditEvent({
        actor: {
          id: "usr-treasury",
          name: "Amina Tidjani",
          role: "Responsable Trésorerie",
          type: "USER",
        },
        action: "COMMISSION_DETAILS_VIEWED",
        actionLabel: "Consultation fiche détaillée de commission",
        module: "TRESORERIE",
        entityType: "FINANCE",
        entityId: commissionId,
        entityReference: commissionId,
        severity: "INFO",
        result: "SUCCESS",
        description: `Consultation de la fiche détaillée de commission: ${commissionId}`,
      });
    } catch {
      // safe fallback
    }
  }, [commissionId, logAuditEvent]);

  const baseDefaultCommissionRate = platformSettings?.financial?.defaultCommissionRate ?? 5;

  const commission = useMemo<EnoCommission | null>(() => {
    // 1. Recherche parmi les livraisons
    for (const o of orders) {
      if (o.status === "LIVREE") {
        const orderComId = `com-ord-${o.id}`;
        if (orderComId === commissionId) {
          const partner = partners.find((p: Partner) => p.id === o.partnerId);
          const effectiveRate = partner?.agencyCommissionDefault !== undefined && partner.agencyCommissionDefault > 0
            ? partner.agencyCommissionDefault
            : baseDefaultCommissionRate;

          const baseAmt = o.totalPrice || 0;
          const commAmount = Math.round((baseAmt * effectiveRate) / 100);
          const collectedAmt = commAmount;
          const remainingAmt = Math.max(0, commAmount - collectedAmt);
          const status: CommissionStatus = remainingAmt === 0 ? "PERCUE" : collectedAmt > 0 ? "PARTIELLE" : "A_PERCEVOIR";

          return {
            id: orderComId,
            reference: `COM-${o.orderNumber || o.id}`,
            date: o.deliveredAt || o.updatedAt || o.createdAt,
            type: "COMMISSION_LIVRAISON" as CommissionType,
            partnerId: o.partnerId,
            partnerName: o.partnerName || partner?.companyName || "Marchand Partenaire",
            baseAmount: baseAmt,
            rate: effectiveRate,
            calculatedAmount: commAmount,
            collectedAmount: collectedAmt,
            remainingAmount: remainingAmt,
            status,
            orderId: o.id,
            orderNumber: o.orderNumber,
            origin: `Commande ${o.orderNumber} ➔ Livraison ➔ Montant COD ${formatCFA(baseAmt)} ➔ Commission GuinéeGo (${effectiveRate}%)`,
            calculationFormula: `${formatCFA(baseAmt)} × ${effectiveRate}% = ${formatCFA(commAmount)}`,
            notes: `Prélèvement automatique sur encaissement client (${o.clientName}). Taux contractuel appliqué : ${effectiveRate}%.`,
          };
        }
      }
    }

    // 2. Recherche parmi les retraits
    for (const p of payoutRequests) {
      const payoutComId = `com-wd-${p.id}`;
      if (payoutComId === commissionId) {
        const withdrawalRate = 1; // 1% frais de passerelle / virement
        const baseAmt = p.amount || 0;
        const commAmount = Math.round((baseAmt * withdrawalRate) / 100);
        const isPaid = p.status === "PAID" || p.status === "APPROVED";
        const collectedAmt = isPaid ? commAmount : 0;
        const remainingAmt = Math.max(0, commAmount - collectedAmt);
        const status: CommissionStatus = p.status === "PAID" ? "PERCUE" : p.status === "REJECTED" ? "ANNULEE" : "A_PERCEVOIR";

        return {
          id: payoutComId,
          reference: `COM-WD-${p.id}`,
          date: p.paidAt || p.approvedAt || p.requestedAt,
          type: "COMMISSION_RETRAIT" as CommissionType,
          partnerId: p.partnerId,
          partnerName: p.partnerName,
          baseAmount: baseAmt,
          rate: withdrawalRate,
          calculatedAmount: commAmount,
          collectedAmount: collectedAmt,
          remainingAmount: remainingAmt,
          status,
          payoutId: p.id,
          payoutReference: p.paymentReference || p.txReference,
          origin: `Demande de retrait ${p.operator} ${formatCFA(baseAmt)} ➔ Frais de traitement (${withdrawalRate}%)`,
          calculationFormula: `${formatCFA(baseAmt)} × ${withdrawalRate}% = ${formatCFA(commAmount)}`,
          notes: `Frais de passerelle opérateur ${p.operator} déduits du net versé.`,
        };
      }
    }

    return null;
  }, [commissionId, orders, partners, payoutRequests, baseDefaultCommissionRate]);

  if (!commission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Commission Introuvable</h2>
          <p className="text-sm text-slate-500 mb-6">
            La commission référencée <span className="font-mono font-bold text-slate-800">{commissionId}</span> n'existe pas ou a été archivée.
          </p>
          <Link
            href="/tresorerie/commissions"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste des commissions
          </Link>
        </div>
      </div>
    );
  }

  // Statut helper
  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case "PERCUE":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Perçue intégralement",
          desc: "Fonds effectivement retenus ou encaissés sur le compte de commissions GuinéeGo"
        };
      case "A_PERCEVOIR":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          label: "À percevoir",
          desc: "Commission calculée exigible, en attente de déduction ou d'apurement"
        };
      case "PARTIELLE":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Percent,
          label: "Perception Partielle",
          desc: "Une fraction de la commission reste à recouvrer"
        };
      case "A_VERIFIER":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertTriangle,
          label: "À vérifier / Anomalie",
          desc: "Écart de facturation ou perception discordante avec l'assiette contractuelle"
        };
      case "ANNULEE":
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          icon: AlertCircle,
          label: "Annulée",
          desc: "Commande retournée, annulée ou opération financière rejetée"
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-200",
          icon: HelpCircle,
          label: status,
          desc: "Statut non spécifié"
        };
    }
  };

  const badgeInfo = getStatusBadge(commission.status);
  const StatusIcon = badgeInfo.icon;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* 1. Fil d'Ariane & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/tresorerie" className="hover:text-slate-800 transition">Trésorerie</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/tresorerie/commissions" className="hover:text-slate-800 transition">Commissions GuinéeGo</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold font-mono">{commission.reference}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Fiche Commission {commission.reference}
              </h1>
              <p className="text-xs text-slate-500">
                Identifiant système : <span className="font-mono text-slate-600 font-semibold">{commission.id}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tresorerie/commissions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimer Fiche
          </button>
        </div>
      </div>

      {/* 2. Bandeau de Statut & Synthèse */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${badgeInfo.bg}`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider opacity-75">Statut de la Commission</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-white/80 border border-current">
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              {badgeInfo.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 shrink-0">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 mb-0.5">Date Calcul</div>
            <div className="text-sm font-bold text-slate-800">
              {new Date(commission.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 mb-0.5">Type Opération</div>
            <div className="text-sm font-bold text-slate-800">
              {commission.type === "COMMISSION_LIVRAISON" ? "Livraison Marchande" :
               commission.type === "COMMISSION_RETRAIT" ? "Retrait Partenaire" :
               commission.type === "COMMISSION_TRANSACTION" ? "Transaction Interne" : "Service Spécial"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bloc Maître : Transparence absolue du calcul */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Formule & Transparence du Calcul</h2>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
            Règle comptable : Assiette (Base) × Taux = Commission Dûe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Base de calcul */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Base de calcul</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCFA(commission.baseAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Assiette brute de la commande ou du retrait marchand.
            </p>
          </div>

          {/* Multiplié par */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Taux Appliqué</span>
              <Percent className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600 tracking-tight">
              {commission.rate.toFixed(2)} %
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Taux contractuel ou barème standard plateforme.
            </p>
          </div>

          {/* Commission Théorique / Calculée */}
          <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">3. Commission Calculée</span>
              <Receipt className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700 tracking-tight">
              {formatCFA(commission.calculatedAmount)}
            </div>
            <p className="text-xs text-indigo-600/80 mt-2">
              Montant contractuel exigible par GuinéeGo.
            </p>
          </div>

          {/* État de perception & Reste */}
          <div className={`p-5 rounded-2xl border ${commission.remainingAmount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${commission.remainingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                4. Reste à percevoir
              </span>
              <ShieldCheck className={`w-4 h-4 ${commission.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div className={`text-2xl font-black tracking-tight ${commission.remainingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {formatCFA(commission.remainingAmount)}
            </div>
            <p className={`text-xs mt-2 ${commission.remainingAmount > 0 ? 'text-amber-700/80' : 'text-emerald-700/80'}`}>
              {formatCFA(commission.collectedAmount)} déjà encaissés ({Math.round((commission.collectedAmount / (commission.calculatedAmount || 1)) * 100)}%).
            </p>
          </div>
        </div>

        {/* Formule Mathématique Visuelle */}
        <div className="mt-6 p-4 bg-slate-900 text-slate-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Formule :</span>
            <span className="text-amber-400 font-bold">{formatCFA(commission.baseAmount)}</span>
            <span>×</span>
            <span className="text-indigo-400 font-bold">{commission.rate}%</span>
            <span>=</span>
            <span className="text-emerald-400 font-bold">{formatCFA(commission.calculatedAmount)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Perçu :</span>
            <span className="text-emerald-400 font-bold">{formatCFA(commission.collectedAmount)}</span>
            <span>|</span>
            <span>Reste :</span>
            <span className="text-amber-400 font-bold">{formatCFA(commission.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* 4. Détails Entité & Opération Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Entité Concernée */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Entité & Partenaire Redevable</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600">
                E-commerçant
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                <span className="text-slate-500">Nom du Partenaire :</span>
                <span className="font-bold text-slate-900">{commission.partnerName}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                <span className="text-slate-500">Identifiant Marchand :</span>
                <span className="font-mono font-semibold text-slate-700">{commission.partnerId}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-500">Statut Financier :</span>
                <span className="text-emerald-600 font-bold">Actif & Conforme</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/tresorerie/ecommercants"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
            >
              <Building2 className="w-4 h-4" />
              Consulter le compte marchand
            </Link>
          </div>
        </div>

        {/* Opération Source d'Origine */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Opération Source d'Origine</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700">
                {commission.type}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                <span className="text-slate-500">Référence Source :</span>
                <span className="font-mono font-bold text-slate-900">{commission.orderNumber || commission.payoutReference || commission.reference}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                <span className="text-slate-500">Date d'Exécution :</span>
                <span className="font-semibold text-slate-800">
                  {new Date(commission.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-500">Traçabilité :</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs truncate">{commission.origin}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            {commission.type === "COMMISSION_LIVRAISON" ? (
              <Link
                href="/tresorerie/encaissements"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
                Voir dans Encaissements COD
              </Link>
            ) : commission.type === "COMMISSION_RETRAIT" ? (
              <Link
                href="/tresorerie/retraits"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
                Voir le bordereau de retrait
              </Link>
            ) : (
              <Link
                href="/tresorerie/grand-livre"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
                Consulter au Grand Livre
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 5. Chaîne de Traçabilité Financière */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Chaîne d'Origine & Traçabilité Complète</h2>
        </div>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
          {/* Étape 1 : Commande initiale */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
            <h4 className="text-sm font-bold text-slate-900">1. Création de l'opération source</h4>
            <p className="text-xs text-slate-500 mt-1">
              Opération enregistrée sous la référence <span className="font-mono font-bold text-slate-800">{commission.reference}</span>. Assiette financière brute : <span className="font-bold text-slate-900">{formatCFA(commission.baseAmount)}</span>.
            </p>
          </div>

          {/* Étape 2 : Application du barème de commissions */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
            <h4 className="text-sm font-bold text-slate-900">2. Application du Barème Contractuel GuinéeGo</h4>
            <p className="text-xs text-slate-500 mt-1">
              Taux contractuel de <span className="font-bold text-indigo-600">{commission.rate}%</span> calculé sur la base financière, générant une commission exigible de <span className="font-bold text-slate-900">{formatCFA(commission.calculatedAmount)}</span>.
            </p>
          </div>

          {/* Étape 3 : Exécution & Perception */}
          <div className="relative">
            <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${commission.status === "PERCUE" ? "bg-emerald-600 ring-emerald-50" : "bg-amber-500 ring-amber-50"} ring-4`} />
            <h4 className="text-sm font-bold text-slate-900">3. Perception & Écriture Comptable</h4>
            <p className="text-xs text-slate-500 mt-1">
              {commission.status === "PERCUE" 
                ? `Encaissement certifié de ${formatCFA(commission.collectedAmount)}. Crédit effectif du compte de commissions GuinéeGo et apurement de la créance.`
                : `Commission en cours d'apurement. Reste exigible : ${formatCFA(commission.remainingAmount)}.`}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Notes Comptables & Immutabilité */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Règle de non-altération comptable : </span>
          {commission.notes} Cette pièce justificative est horodatée et garantie immuable. Toute modification ultérieure de barème ne rétroagit pas sur cette écriture historique.
        </div>
      </div>
    </div>
  );
}
