"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Bike,
  Headset,
  MapPin,
  Store,
  Calendar,
  ChevronRight,
  ArrowUpDown,
  X,
  Sparkles,
  Phone,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Order, OrderStatus } from "@/lib/types";

export default function AdminCommandesPage() {
  const router = useRouter();
  const {
    orders,
    partners,
    closeuses,
    livreurs,
    createOrder,
    assignOrderToCloseuse,
    assignOrderToLivreur,
  } = useOperations();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Advanced filters
  const [filterPartner, setFilterPartner] = useState<string>("ALL");
  const [filterCloseuse, setFilterCloseuse] = useState<string>("ALL");
  const [filterLivreur, setFilterLivreur] = useState<string>("ALL");
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "AMOUNT_HIGH" | "AMOUNT_LOW">("NEWEST");

  // Add Order Form State
  const [newOrderClient, setNewOrderClient] = useState("");
  const [newOrderPhone, setNewOrderPhone] = useState("+229 01 ");
  const [newOrderCity, setNewOrderCity] = useState("Conakry");
  const [newOrderAddress, setNewOrderAddress] = useState("");
  const [newOrderProduct, setNewOrderProduct] = useState("");
  const [newOrderPrice, setNewOrderPrice] = useState("15000");
  const [newOrderPartnerId, setNewOrderPartnerId] = useState(partners[0]?.id || "");

  // Computed metrics
  const totalCount = orders.length;
  const activeCount = orders.filter((o) => o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || o.status === "CONFIRMEE" || o.status === "EN_COURS").length;
  const attentionCount = orders.filter((o) => o.status === "A_RAPPELER" || o.status === "EN_ATTENTE" || o.status === "REFUSEE").length;
  const deliveredTodayCount = orders.filter((o) => o.status === "LIVREE").length;

  // Active filters count
  const activeFiltersCount = (filterPartner !== "ALL" ? 1 : 0) +
    (filterCloseuse !== "ALL" ? 1 : 0) +
    (filterLivreur !== "ALL" ? 1 : 0) +
    (filterZone !== "ALL" ? 1 : 0);

  // Status Tabs Definition
  const statusTabs = [
    { id: "ALL", label: "Toutes", count: orders.length },
    { id: "EN_ATTENTE", label: "Nouvelles", count: orders.filter((o) => o.status === "EN_ATTENTE").length },
    { id: "A_RAPPELER", label: "À rappeler", count: orders.filter((o) => o.status === "A_RAPPELER").length },
    { id: "CONFIRMEE", label: "Confirmées", count: orders.filter((o) => o.status === "CONFIRMEE").length },
    { id: "EN_COURS", label: "En livraison", count: orders.filter((o) => o.status === "EN_COURS").length },
    { id: "LIVREE", label: "Livrées", count: orders.filter((o) => o.status === "LIVREE").length },
    { id: "RETOURNEE", label: "Retours", count: orders.filter((o) => o.status === "RETOURNEE" || o.status === "REFUSEE").length },
    { id: "ANNULEE", label: "Annulées", count: orders.filter((o) => o.status === "ANNULEE").length },
  ];

  // Filtering & Sorting Logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Tab filter
        if (activeTab !== "ALL") {
          if (activeTab === "RETOURNEE") {
            if (o.status !== "RETOURNEE" && o.status !== "REFUSEE") return false;
          } else if (o.status !== activeTab) {
            return false;
          }
        }

        // Partner filter
        if (filterPartner !== "ALL" && o.partnerId !== filterPartner && o.partnerName !== filterPartner) {
          return false;
        }

        // Closer filter
        if (filterCloseuse !== "ALL" && o.assignedCloseuseName !== filterCloseuse) {
          return false;
        }

        // Driver filter
        if (filterLivreur !== "ALL" && o.assignedLivreurName !== filterLivreur) {
          return false;
        }

        // Zone filter
        if (filterZone !== "ALL" && !o.city.toLowerCase().includes(filterZone.toLowerCase())) {
          return false;
        }

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesNum = o.orderNumber.toLowerCase().includes(q);
          const matchesClient = o.clientName.toLowerCase().includes(q);
          const matchesPhone = o.clientPhone.includes(q);
          const matchesPartner = (o.partnerName || "").toLowerCase().includes(q);
          const matchesProd = (o.products || "").toLowerCase().includes(q);
          return matchesNum || matchesClient || matchesPhone || matchesPartner || matchesProd;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "OLDEST") return (a.id > b.id ? 1 : -1);
        if (sortBy === "AMOUNT_HIGH") return b.totalPrice - a.totalPrice;
        if (sortBy === "AMOUNT_LOW") return a.totalPrice - b.totalPrice;
        return (b.id > a.id ? 1 : -1); // NEWEST
      });
  }, [orders, activeTab, filterPartner, filterCloseuse, filterLivreur, filterZone, searchTerm, sortBy]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderClient || !newOrderPhone || !newOrderProduct) return;

    const partner = partners.find((p) => p.id === newOrderPartnerId) || partners[0];

    createOrder({
      clientName: newOrderClient,
      clientPhone: newOrderPhone,
      city: newOrderCity,
      address: newOrderAddress || "Adresse standard",
      products: newOrderProduct,
      totalPrice: parseInt(newOrderPrice) || 15000,
      partnerId: partner.id,
      partnerName: partner.companyName,
      status: "EN_ATTENTE",
      quantity: 1,
    });

    setShowAddModal(false);
    setNewOrderClient("");
    setNewOrderPhone("+229 01 ");
    setNewOrderProduct("");
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "LIVREE":
        return { label: "Livrée", color: "bg-emerald-100 text-emerald-800" };
      case "EN_COURS":
        return { label: "En livraison", color: "bg-purple-100 text-purple-800" };
      case "CONFIRMEE":
        return { label: "Confirmée", color: "bg-blue-100 text-blue-800" };
      case "A_RAPPELER":
        return { label: "À rappeler", color: "bg-orange-100 text-orange-800" };
      case "RETOURNEE":
      case "REFUSEE":
        return { label: "Retour", color: "bg-rose-100 text-rose-800" };
      case "ANNULEE":
        return { label: "Annulée", color: "bg-slate-100 text-slate-600" };
      case "EN_ATTENTE":
      default:
        return { label: "Nouvelle", color: "bg-amber-100 text-amber-800" };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 1. HEADER & INTRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">COMMANDES</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez et suivez l&apos;ensemble des commandes de votre réseau.
          </p>
        </div>

        {/* 4 COMPACT METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/70">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
            <span className="text-sm font-black text-slate-900">{totalCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] text-purple-700 block font-semibold">Actives</span>
            <span className="text-sm font-black text-purple-700">{activeCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] text-amber-700 block font-semibold">À Suivre</span>
            <span className="text-sm font-black text-amber-700">{attentionCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] text-emerald-700 block font-semibold">Livrées</span>
            <span className="text-sm font-black text-emerald-700">{deliveredTodayCount}</span>
          </div>
        </div>
      </div>

      {/* 2. BARRE D'ACTIONS & RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Omnibox Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par #CMD, client, téléphone, boutique ou produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeFiltersCount > 0
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-slate-900 text-[9px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une commande</span>
          </button>
        </div>
      </div>

      {/* 3. FILTRES AVANCÉS DRAWER */}
      {showFiltersDrawer && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Filtres Avancés</span>
            <button
              onClick={() => {
                setFilterPartner("ALL");
                setFilterCloseuse("ALL");
                setFilterLivreur("ALL");
                setFilterZone("ALL");
                setSortBy("NEWEST");
              }}
              className="text-xs text-slate-400 hover:text-slate-800 font-bold"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {/* E-commerçant */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">E-commerçant</label>
              <select
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="ALL">Tous les marchands</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.companyName}>{p.companyName}</option>
                ))}
              </select>
            </div>

            {/* Closeuse */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Closeuse</label>
              <select
                value={filterCloseuse}
                onChange={(e) => setFilterCloseuse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="ALL">Toutes les closeuses</option>
                {closeuses.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Livreur */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Livreur</label>
              <select
                value={filterLivreur}
                onChange={(e) => setFilterLivreur(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="ALL">Tous les livreurs</option>
                {livreurs.map((l) => (
                  <option key={l.id} value={l.name}>{l.name} ({l.zone})</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Zone de livraison</label>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="ALL">Toutes les zones</option>
                <option value="Conakry">Cotonou</option>
                <option value="Kankan">Abomey-Kankan</option>
                <option value="Mamou">Mamou</option>
              </select>
            </div>

            {/* Trier par */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              >
                <option value="NEWEST">Plus récent</option>
                <option value="OLDEST">Plus ancien</option>
                <option value="AMOUNT_HIGH">Montant décroissant</option>
                <option value="AMOUNT_LOW">Montant croissant</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 4. ONGLETS DES STATUTS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {statusTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === t.id
                ? "bg-slate-900 text-white font-black shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 5. LISTE DES COMMANDES (Desktop Table + Mobile Cards) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Réf & Date</th>
                <th className="py-3.5 px-5">Client & Destination</th>
                <th className="py-3.5 px-5">E-commerçant</th>
                <th className="py-3.5 px-5">Article(s)</th>
                <th className="py-3.5 px-5">Montant COD</th>
                <th className="py-3.5 px-5">Closeuse</th>
                <th className="py-3.5 px-5">Livreur</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5 text-right">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Aucune commande ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const isBlocked = ord.status === "EN_ATTENTE";
                  const isCallback = ord.status === "A_RAPPELER";

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => router.push(`/admin/commandes/${ord.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          {isBlocked && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Nouvelle en attente"></span>}
                          {isCallback && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Client à rappeler"></span>}
                          <span className="font-mono font-bold text-slate-900 group-hover:underline">
                            {ord.orderNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{ord.createdAt}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{ord.clientName}</p>
                        <p className="text-[11px] text-slate-400">{ord.city} • {ord.clientPhone}</p>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-800">{ord.partnerName || "Marchand"}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-900">{ord.products}</span>
                        <span className="text-[10px] text-slate-400 block">Qté: {ord.quantity}</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {formatCFA(ord.totalPrice)}
                      </td>

                      <td className="py-3.5 px-5">
                        {ord.assignedCloseuseName ? (
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Headset className="w-3 h-3 text-slate-400" />
                            <span>{ord.assignedCloseuseName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non attribuée</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        {ord.assignedLivreurName ? (
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Bike className="w-3 h-3 text-slate-400" />
                            <span>{ord.assignedLivreurName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non attribué</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucune commande trouvée.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              return (
                <div
                  key={ord.id}
                  onClick={() => router.push(`/admin/commandes/${ord.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{ord.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{ord.clientName} ({ord.city})</p>
                    <p className="text-slate-500">{ord.products} • {formatCFA(ord.totalPrice)}</p>
                    <p className="text-[10px] text-slate-400">Marchand : {ord.partnerName}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Closeuse: {ord.assignedCloseuseName || "—"}</span>
                    <span>Coursier: {ord.assignedLivreurName || "—"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📝 MODAL + AJOUTER UNE COMMANDE MANUELLE */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">Enregistrer une Commande</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">E-commerçant / Boutique</label>
                <select
                  value={newOrderPartnerId}
                  onChange={(e) => setNewOrderPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.companyName} ({p.fullName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom du Client</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean Kouassi"
                    value={newOrderClient}
                    onChange={(e) => setNewOrderClient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone Client</label>
                  <input
                    type="tel"
                    required
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ville / Zone</label>
                  <select
                    value={newOrderCity}
                    onChange={(e) => setNewOrderCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Conakry">Cotonou</option>
                    <option value="Abomey-Kankan">Abomey-Kankan</option>
                    <option value="Mamou">Mamou</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Adresse & Repère</label>
                  <input
                    type="text"
                    placeholder="Ex: Cadjehoun, face pharmacie"
                    value={newOrderAddress}
                    onChange={(e) => setNewOrderAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom du Produit</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Montre Luxe Quartz"
                    value={newOrderProduct}
                    onChange={(e) => setNewOrderProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Montant Total COD (GNF)</label>
                  <input
                    type="number"
                    required
                    value={newOrderPrice}
                    onChange={(e) => setNewOrderPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer"
                >
                  Créer la Commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
