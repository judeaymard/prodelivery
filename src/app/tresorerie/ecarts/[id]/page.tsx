"use client";

import React, { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  ExternalLink,
  Package,
  Scale,
  ShieldAlert,
  User,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";

export default function EcartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { codRemittances, codCollections, livreurs, orders } = useOperations();

  const id = resolvedParams.id;

  // Search by remittance ID, remittance reference, or order ID/number
  const remittanceMatch = useMemo(() => {
    return codRemittances.find(
      (r) =>
        r.id === id ||
        r.reference.toLowerCase() === id.toLowerCase() ||
        r.orderIds.includes(id)
    );
  }, [codRemittances, id]);

  const collectionMatch = useMemo(() => {
    return codCollections.find(
      (c) =>
        c.orderId === id ||
        c.orderNumber.toLowerCase() === id.toLowerCase() ||
        (remittanceMatch && remittanceMatch.orderIds.includes(c.orderId))
    );
  }, [codCollections, id, remittanceMatch]);

  const livreur = useMemo(() => {
    const livId = remittanceMatch?.livreurId || collectionMatch?.livreurId;
    return livreurs.find((l) => l.id === livId);
  }, [livreurs, remittanceMatch, collectionMatch]);

  const order = useMemo(() => {
    const ordId = collectionMatch?.orderId || id;
    return orders.find((o) => o.id === ordId || o.orderNumber === id);
  }, [orders, collectionMatch, id]);

  const discrepancyAmount = Math.abs(
    remittanceMatch?.discrepancyAmount || collectionMatch?.discrepancy || 0
  );

  const expectedAmount =
    remittanceMatch?.amountExpected || collectionMatch?.expectedAmount || (order?.totalPrice ?? 0);
  const collectedAmount =
    remittanceMatch?.amountDeclared || collectionMatch?.collectedAmount || Math.max(0, expectedAmount - discrepancyAmount);

  const justification =
    remittanceMatch?.discrepancyJustification ||
    remittanceMatch?.discrepancyReason ||
    collectionMatch?.discrepancyJustification ||
    "—";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </button>

        <div className="flex items-center gap-2">
          {livreur && (
            <Link
              href={`/tresorerie/livreurs/${livreur.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Bike className="w-3.5 h-3.5" />
              Fiche financière du livreur
            </Link>
          )}
          <Link
            href="/tresorerie/reconciliation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            Rapprochement global
          </Link>
        </div>
      </div>

      {/* Bannière principale de l'écart */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2.5 py-0.5 rounded-md">
                  Écart financier ouvert
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Réf : {remittanceMatch?.reference || collectionMatch?.orderNumber || id}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                Écart de {formatCFA(discrepancyAmount)}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Statut : <strong className="text-amber-700">En cours d&apos;examen contradictoire</strong> • Détecté lors du contrôle de trésorerie.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs border border-amber-200 rounded-2xl p-4 text-right shrink-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Impact sur la caisse</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">-{formatCFA(discrepancyAmount)}</p>
          </div>
        </div>
      </div>

      {/* Cartes de confrontation financière */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Montant Théorique Attendu</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCFA(expectedAmount)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Prix COD prévu sur le bordereau</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Montant Réel Reçu</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{formatCFA(collectedAmount)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Espèces remises par le livreur</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Écart Constaté</p>
          <p className="text-2xl font-black text-rose-600 mt-1">-{formatCFA(discrepancyAmount)}</p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">Manquant à apurer</p>
        </div>
      </div>

      {/* Détails de l'anomalie et justification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Motif & Justification Opérationnelle</h2>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1">Déclaration enregistrée :</p>
            {justification}
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date de détection</span>
              <span className="font-semibold text-slate-800">
                {remittanceMatch?.createdAt || collectionMatch?.deliveredAt || "04 septembre 2026 — 09:40"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Type de contrôle</span>
              <span className="font-semibold text-slate-800">Comptage physique & Rapprochement bordereau</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Agent de contrôle</span>
              <span className="font-semibold text-slate-800">
                {remittanceMatch?.validatedBy || "Amina Tidjani (Trésorière)"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Intervenants Concernés</h2>
          </div>

          <div className="space-y-3 text-xs">
            {livreur && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                    {livreur.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{livreur.name}</p>
                    <p className="text-slate-500 text-[11px]">{livreur.phone} • Zone: {livreur.zone}</p>
                  </div>
                </div>
                <Link
                  href={`/tresorerie/livreurs/${livreur.id}`}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1"
                >
                  Voir fiche <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {order && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center text-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Commande {order.orderNumber}</p>
                    <p className="text-slate-500 text-[11px]">Client: {order.clientName} • {order.address}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-700">{formatCFA(order.totalPrice)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
