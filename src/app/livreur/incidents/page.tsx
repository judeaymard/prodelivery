"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Phone,
  Package,
  Clock,
  MapPin,
  HelpCircle,
  FileText,
  Search,
  MessageSquare,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order } from "@/lib/types";

export default function LivreurIncidentsPage() {
  const {
    orders,
    activeLivreur,
    markOrderFailed,
    logActivity,
    addNotification,
  } = useOperations();

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [incidentReason, setIncidentReason] = useState("Client absent");
  const [incidentComment, setIncidentComment] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Commandes actives assignées à ce livreur pouvant faire l'objet d'un incident
  const activeOrders = useMemo(() => {
    if (!activeLivreur) return [];
    return orders.filter(
      (o) =>
        o.assignedLivreurId === activeLivreur.id &&
        (o.status === "EN_COURS" || o.status === "CONFIRMEE")
    );
  }, [orders, activeLivreur]);

  // Historique des incidents récents enregistrés pour ce livreur
  const incidentOrders = useMemo(() => {
    if (!activeLivreur) return [];
    return orders.filter(
      (o) =>
        o.assignedLivreurId === activeLivreur.id &&
        ["REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)
    );
  }, [orders, activeLivreur]);

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      triggerToast("Veuillez sélectionner un colis concerné.");
      return;
    }

    const targetOrder = orders.find((o) => o.id === selectedOrderId);
    if (!targetOrder) return;

    const fullReason = `${incidentReason}${incidentComment ? ` : ${incidentComment}` : ""}`;
    markOrderFailed(targetOrder.id, fullReason);

    logActivity({
      type: "ORDER_CREATED",
      title: "Incident / Échec livraison",
      description: `${targetOrder.orderNumber} : ${fullReason} (signalé par ${activeLivreur?.name})`,
      orderNumber: targetOrder.orderNumber,
      partnerName: targetOrder.partnerName,
      amount: targetOrder.totalPrice,
    });

    addNotification({
      category: "INCIDENTS",
      priority: "URGENT",
      title: `Échec livraison ${targetOrder.orderNumber}`,
      description: `${activeLivreur?.name} a signalé : ${fullReason}. Relance requise par l'équipe commerciale.`,
      actionUrl: "/commercial/commandes",
      referenceId: targetOrder.id,
    });

    triggerToast(`⚠️ Incident consigné pour ${targetOrder.orderNumber}. L'équipe commerciale a été alertée.`);
    setSelectedOrderId("");
    setIncidentComment("");
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
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Signalement Terrain & Incidents</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Incidents de Livraison</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Signalez rapidement les refus, absences ou anomalies pour arbitrage immédiat par les closeuses
        </p>
      </div>

      {/* Formulaire de déclaration d'incident rapide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Déclarer un Problème Terrain</h2>
            <p className="text-[11px] text-slate-400">Le colis sera réaffecté ou relancé par le standard téléphonique</p>
          </div>
        </div>

        <form onSubmit={handleSubmitIncident} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Colis / Commande concernée</label>
            {activeOrders.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                Vous n'avez aucun colis en cours de livraison susceptible d'être signalé.
              </p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-400 focus:bg-white"
                required
              >
                <option value="">Sélectionnez le colis...</option>
                {activeOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.clientName} ({o.city}) — {formatCFA(o.totalPrice)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Motif de l'incident ou de l'échec</label>
            <select
              value={incidentReason}
              onChange={(e) => setIncidentReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="Client absent">Client absent au point de rendez-vous</option>
              <option value="Client injoignable">Client injoignable au téléphone (3+ appels)</option>
              <option value="Adresse introuvable">Adresse erronée / zone inaccessible</option>
              <option value="Refus du colis">Refus du client (prix non conforme / changement d'avis)</option>
              <option value="Client sans espèces">Fonds insuffisants / pas d'espèces disponibles</option>
              <option value="Report demandé">Client sollicite un report à une autre date/heure</option>
              <option value="Colis endommagé">Colis avarié ou endommagé au transport</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Précisions utiles pour la commerciale (facultatif)</label>
            <textarea
              value={incidentComment}
              onChange={(e) => setIncidentComment(e.target.value)}
              placeholder="Ex : Le client était au travail, il propose de livrer demain matin à 09h..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={activeOrders.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmettre l'incident</span>
          </button>
        </form>
      </div>

      {/* Registre des incidents consignés */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Historique de vos Signalements ({incidentOrders.length})
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Traces des colis refusés ou retournés</p>
          </div>
        </div>

        {incidentOrders.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Aucun incident enregistré</p>
            <p className="text-[11px] text-slate-400">Toutes vos livraisons se déroulent sans encombre.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900">{order.orderNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {order.status === "REFUSEE" ? "Refusée" : "Retournée"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{order.clientName} · {order.city}</p>
                  {order.comment && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      Motif : {order.comment}
                    </p>
                  )}
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase font-extrabold">Montant</span>
                  <p className="text-sm font-black text-slate-900">{formatCFA(order.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
