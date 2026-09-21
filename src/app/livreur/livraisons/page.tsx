"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Check,
  Send,
  Calendar,
  Wallet,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order, OrderStatus } from "@/lib/types";

export default function MesLivraisonsPage() {
  const {
    orders,
    activeLivreur,
    markOrderDelivered,
    markOrderFailed,
    updateOrderStatus,
    logActivity,
  } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CONFIRMEE" | "EN_COURS" | "LIVREE" | "FAILED">("ALL");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Modales
  const [codModalOrder, setCodModalOrder] = useState<Order | null>(null);
  const [codAmountInput, setCodAmountInput] = useState("");
  const [incidentModalOrder, setIncidentModalOrder] = useState<Order | null>(null);
  const [incidentReason, setIncidentReason] = useState("Client absent");
  const [incidentComment, setIncidentComment] = useState("");

  const triggerToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  // Commandes assignées au coursier actif
  const driverOrders = useMemo(() => {
    if (!activeLivreur) return [];
    return orders.filter((o) => o.assignedLivreurId === activeLivreur.id);
  }, [orders, activeLivreur]);

  // Filtrage et recherche
  const filteredOrders = useMemo(() => {
    return driverOrders.filter((order) => {
      // Filtre statut
      if (filterStatus === "CONFIRMEE" && order.status !== "CONFIRMEE") return false;
      if (filterStatus === "EN_COURS" && order.status !== "EN_COURS") return false;
      if (filterStatus === "LIVREE" && order.status !== "LIVREE") return false;
      if (
        filterStatus === "FAILED" &&
        !["REFUSEE", "RETOURNEE", "ANNULEE"].includes(order.status)
      ) {
        return false;
      }

      // Recherche texte
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNumber = order.orderNumber.toLowerCase().includes(query);
        const matchClient = order.clientName.toLowerCase().includes(query);
        const matchPhone = (order.clientPhone || "").toLowerCase().includes(query);
        const matchCity = (order.city || order.region || "").toLowerCase().includes(query);
        const matchProduct = (order.products || "").toLowerCase().includes(query);
        return matchNumber || matchClient || matchPhone || matchCity || matchProduct;
      }

      return true;
    });
  }, [driverOrders, filterStatus, searchTerm]);

  // Compteurs pour onglets
  const counts = useMemo(() => {
    return {
      all: driverOrders.length,
      toTake: driverOrders.filter((o) => o.status === "CONFIRMEE").length,
      inTransit: driverOrders.filter((o) => o.status === "EN_COURS").length,
      delivered: driverOrders.filter((o) => o.status === "LIVREE").length,
      failed: driverOrders.filter((o) => ["REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)).length,
    };
  }, [driverOrders]);

  // Actions métier réelles
  const handleTakeCharge = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `Colis pris en charge par ${activeLivreur?.name}`);
    logActivity({
      type: "ORDER_CREATED",
      title: "Colis pris en charge",
      description: `${order.orderNumber} pris en charge par ${activeLivreur?.name}`,
      orderNumber: order.orderNumber,
      partnerName: order.partnerName,
      amount: order.totalPrice,
    });
    triggerToast(`Colis ${order.orderNumber} pris en charge !`);
  };

  const handleStartDelivery = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `En route vers ${order.clientName}`);
    triggerToast(`En route vers ${order.clientName}`);
  };

  const handleConfirmArrival = (order: Order) => {
    updateOrderStatus(order.id, "EN_COURS", `Arrivé chez le client (${order.city})`);
    triggerToast(`Arrivé chez ${order.clientName}`);
  };

  const handleConfirmDelivery = (order: Order) => {
    setCodModalOrder(order);
    setCodAmountInput(String(order.totalPrice || 0));
  };

  const submitDeliveryAndCod = () => {
    if (!codModalOrder) return;
    markOrderDelivered(codModalOrder.id);
    triggerToast(`✅ ${codModalOrder.orderNumber} marquée LIVRÉE & ${formatCFA(Number(codAmountInput) || codModalOrder.totalPrice)} encaissés !`);
    setCodModalOrder(null);
  };

  const submitIncidentReport = () => {
    if (!incidentModalOrder) return;
    const fullReason = `${incidentReason}${incidentComment ? ` : ${incidentComment}` : ""}`;
    markOrderFailed(incidentModalOrder.id, fullReason);
    triggerToast(`⚠️ Incident consigné pour ${incidentModalOrder.orderNumber}.`);
    setIncidentModalOrder(null);
    setIncidentComment("");
  };

  const handleCallClient = (phone?: string) => {
    if (!phone) return;
    window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self");
  };

  const handleNavigate = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}, Guinée`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Toast d'action */}
      {actionSuccessToast && (
        <div className="fixed top-16 md:top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <Package className="w-3 h-3 text-emerald-600" />
            <span>Tournée : {activeLivreur?.name || "Coursier"}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mes Livraisons</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi et exécution des courses assignées pour votre zone
          </p>
        </div>

        <Link
          href="/livreur/cod"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Remettre les fonds COD</span>
        </Link>
      </div>

      {/* Barre de recherche & Filtres rapides */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par n° commande, client, téléphone, quartier, produit..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Onglets de filtrage */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Toutes ({counts.all})
          </button>
          <button
            onClick={() => setFilterStatus("CONFIRMEE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === "CONFIRMEE"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            À prendre en charge ({counts.toTake})
          </button>
          <button
            onClick={() => setFilterStatus("EN_COURS")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === "EN_COURS"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            En cours ({counts.inTransit})
          </button>
          <button
            onClick={() => setFilterStatus("LIVREE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === "LIVREE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Livrées ({counts.delivered})
          </button>
          <button
            onClick={() => setFilterStatus("FAILED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === "FAILED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Échecs / Refus ({counts.failed})
          </button>
        </div>
      </div>

      {/* Liste des commandes */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 p-10 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Aucune commande trouvée</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aucun colis ne correspond à vos filtres actuels. Modifiez vos critères ou votre recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === "LIVREE";
            const isFailed = ["REFUSEE", "RETOURNEE", "ANNULEE"].includes(order.status);
            const isReady = order.status === "CONFIRMEE";
            const inTransit = order.status === "EN_COURS";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs hover:shadow-sm transition-all space-y-4"
              >
                {/* Header de la carte */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{order.orderNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {order.partnerName || "Marchand"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDelivered
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isFailed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : inTransit
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isReady
                          ? "À prendre en charge"
                          : inTransit
                          ? "En tournée"
                          : isDelivered
                          ? "Livrée & Encaissée"
                          : "Échec / Refus"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{order.clientName}</h3>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Montant COD</span>
                    <p className="text-lg font-black text-emerald-700 leading-tight">
                      {formatCFA(order.totalPrice)}
                    </p>
                    {order.deliveryTimeSlot && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-0.5">
                        <Clock className="w-3 h-3" />
                        {order.deliveryTimeSlot}
                      </span>
                    )}
                  </div>
                </div>

                {/* Infos Colis et Adresse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Adresse :</span>
                    </div>
                    <p className="text-slate-800 font-medium pl-5">
                      {order.address || "Adresse indiquée par le client"}, {order.city || order.region}
                    </p>
                    {order.availabilityLocation && (
                      <p className="text-slate-500 text-[10px] pl-5 italic">
                        Repère : {order.availabilityLocation}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                      <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Article :</span>
                    </div>
                    <p className="text-slate-800 font-medium pl-5">
                      {order.products} (Qté : {order.quantity || 1})
                    </p>
                    {order.comment && (
                      <p className="text-amber-800 text-[10px] pl-5">
                        Note : {order.comment}
                      </p>
                    )}
                  </div>
                </div>

                {/* Boutons d'action rapides (Appel & GPS) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCallClient(order.clientPhone)}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Appeler {order.clientPhone}</span>
                  </button>

                  <button
                    onClick={() => handleNavigate(order.address, order.city || order.region)}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ouvrir GPS</span>
                  </button>
                </div>

                {/* Boutons de workflow opérationnel */}
                {!isDelivered && !isFailed && (
                  <div className="pt-1 border-t border-slate-100">
                    {isReady && (
                      <button
                        onClick={() => handleTakeCharge(order)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span>PRENDRE EN CHARGE CE COLIS</span>
                      </button>
                    )}

                    {inTransit && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleStartDelivery(order)}
                            className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5 text-blue-600" />
                            <span>En route</span>
                          </button>
                          <button
                            onClick={() => handleConfirmArrival(order)}
                            className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Arrivé</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => handleConfirmDelivery(order)}
                            className="sm:col-span-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>LIVRER & ENCAISSER ({formatCFA(order.totalPrice)})</span>
                          </button>
                          <button
                            onClick={() => setIncidentModalOrder(order)}
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Échec</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'encaissement COD */}
      {codModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Confirmation de Livraison</h3>
              </div>
              <button
                onClick={() => setCodModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">
                Commande : <strong className="text-slate-900">{codModalOrder.orderNumber}</strong>
              </p>
              <p className="text-slate-600">
                Client : <strong className="text-slate-900">{codModalOrder.clientName}</strong>
              </p>
              <p className="text-slate-600">
                Produit : <strong className="text-slate-900">{codModalOrder.products}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Montant COD Encaissé en Espèces (GNF)</label>
              <input
                type="number"
                value={codAmountInput}
                onChange={(e) => setCodAmountInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-lg font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Montant attendu : {formatCFA(codModalOrder.totalPrice)}. Recomptez les espèces avant de valider.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setCodModalOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={submitDeliveryAndCod}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirmer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'incident */}
      {incidentModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Signaler un Échec de Livraison</h3>
              </div>
              <button
                onClick={() => setIncidentModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Motif standard d'échec</label>
              <select
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              >
                <option value="Client absent">Client absent au rendez-vous</option>
                <option value="Client injoignable">Client injoignable au téléphone</option>
                <option value="Adresse introuvable">Adresse erronée / introuvable</option>
                <option value="Refus du colis">Refus du client (prix / non conforme)</option>
                <option value="Client sans espèces">Fonds insuffisants / pas d'espèces</option>
                <option value="Report demandé">Client demande un report ultérieur</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Commentaire explicatif (facultatif)</label>
              <textarea
                value={incidentComment}
                onChange={(e) => setIncidentComment(e.target.value)}
                placeholder="Précisez le motif pour permettre à la closeuse de relancer..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIncidentModalOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={submitIncidentReport}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enregistrer l'échec</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
