"use client";

import React, { useState } from "react";
import {
  Package,
  Boxes,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useOperations } from "@/lib/store";

export default function StocksPage() {
  const { products, addProduct, activePartner, currentPartner } = useOperations();
  const partnerId = activePartner?.id || currentPartner?.id || "usr-partner-1";
  const partnerProducts = products.filter((p) => p.partnerId === partnerId);

  const [searchTerm, setSearchTerm] = useState("");
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");

  const filteredProducts = partnerProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInitial = partnerProducts.reduce((acc, p) => acc + p.initialStock, 0);
  const totalRemaining = partnerProducts.reduce((acc, p) => acc + p.remainingStock, 0);
  const totalDelivered = partnerProducts.reduce((acc, p) => acc + p.deliveredCount, 0);
  const flowRate = totalInitial > 0 ? Math.round((totalDelivered / totalInitial) * 100) : 0;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) return;

    addProduct({
      name: newProdName.toUpperCase(),
      price: Number(newProdPrice),
      initialStock: Number(newProdStock),
      remainingStock: Number(newProdStock),
      deliveredCount: 0,
      partnerId,
    });

    setNewProdName("");
    setNewProdPrice("");
    setNewProdStock("");
    setShowRestockModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#EAE6DD]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#787163]">
            <span>Entrepôts GuinéeGo</span>
            <span>•</span>
            <span className="text-[#e52320]">Stockage 100% Offert • Conakry & Kankan</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-[#141A17] tracking-tight mt-1">
            Inventaire & Entrepôts
          </h2>
          <p className="text-xs text-[#787163] mt-1">
            Vos marchandises sont gardées sous scellé et surveillance 24h/24 sans frais de location.
          </p>
        </div>

        <button
          onClick={() => setShowRestockModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#141A17] hover:bg-[#e52320] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Déposer du Stock</span>
        </button>
      </div>

      {/* 📊 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock initial */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#787163]">
              Stock Initial Déposé
            </span>
            <Boxes className="w-4 h-4 text-[#8C8474]" />
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {totalInitial} <span className="text-xs font-semibold text-[#787163]">unités</span>
          </p>
          <p className="text-xs text-[#5C5649]">Total confié à GuinéeGo</p>
        </div>

        {/* Stock restant */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e52320]">
              Disponible Immédiat
            </span>
            <Package className="w-4 h-4 text-[#e52320]" />
          </div>
          <p className="text-3xl font-black text-[#e52320] tracking-tight">
            {totalRemaining} <span className="text-xs font-semibold text-[#787163]">unités</span>
          </p>
          <p className="text-xs text-[#5C5649]">Prêt pour expédition rapide</p>
        </div>

        {/* Produits livrés */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#787163]">
              Colis Livrés
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#e52320]" />
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {totalDelivered} <span className="text-xs font-semibold text-[#787163]">remis</span>
          </p>
          <p className="text-xs text-[#5C5649]">Encaissés aux acheteurs</p>
        </div>

        {/* Taux d'écoulement */}
        <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#787163]">
              Taux d&apos;Écoulement
            </span>
            <TrendingUp className="w-4 h-4 text-[#C5A059]" />
          </div>
          <p className="text-3xl font-black text-[#141A17] tracking-tight">
            {flowRate}%
          </p>
          <p className="text-xs text-[#5C5649]">Vitesse de rotation du stock</p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-[#EAE6DD] p-3.5 rounded-2xl shadow-2xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#8C8474] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une référence en stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white"
          />
        </div>
        <span className="text-xs text-[#787163] font-medium hidden sm:inline">
          {filteredProducts.length} référence(s) répertoriée(s)
        </span>
      </div>

      {/* PRODUCTS LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => {
          const isLowStock = prod.remainingStock < 15;
          const percentage = Math.round((prod.remainingStock / prod.initialStock) * 100);

          return (
            <div
              key={prod.id}
              className="bg-white border border-[#EAE6DD] rounded-3xl p-6 shadow-2xs space-y-4 hover:border-[#e52320]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#141A17] uppercase tracking-tight">{prod.name}</h3>
                    <p className="text-base font-black text-[#e52320] mt-0.5">
                      {prod.price.toLocaleString("fr-FR")} GNF
                    </p>
                  </div>

                  {isLowStock ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#A84232]/30 text-[#A84232] text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Stock Faible
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#e52320]/30 text-[#e52320] text-[10px] font-bold uppercase shrink-0">
                      Optimal
                    </span>
                  )}
                </div>

                {/* Stock Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#5C5649]">
                    <span>Réserve entrepôt</span>
                    <span className="font-bold text-[#141A17]">{percentage}% restant</span>
                  </div>
                  <div className="w-full bg-[#FAF9F5] border border-[#EAE6DD] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLowStock ? "bg-[#A84232]" : "bg-[#e52320]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 3 Metrics Row */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#EAE6DD] text-center">
                <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE6DD]">
                  <p className="text-[10px] font-bold text-[#787163] uppercase">Déposé</p>
                  <p className="text-sm font-black text-[#141A17] mt-0.5">{prod.initialStock}</p>
                </div>
                <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE6DD]">
                  <p className="text-[10px] font-bold text-[#e52320] uppercase">Restant</p>
                  <p className="text-sm font-black text-[#e52320] mt-0.5">{prod.remainingStock}</p>
                </div>
                <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE6DD]">
                  <p className="text-[10px] font-bold text-[#787163] uppercase">Livrés</p>
                  <p className="text-sm font-black text-[#141A17] mt-0.5">{prod.deliveredCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RESTOCK MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 bg-[#141A17]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DD] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
              <div>
                <h3 className="text-base font-black text-[#141A17]">Déposer du Stock en Entrepôt</h3>
                <p className="text-xs text-[#787163] mt-0.5">Dépôt gratuit à Conakry ou Kankan</p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#EAE6DD] text-[#8C8474] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#141A17] uppercase">Nom du Produit</label>
                <input
                  type="text"
                  placeholder="Ex: MONTRE LUXE CURREN GOLD"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Prix Unitaire (GNF)</label>
                  <input
                    type="number"
                    placeholder="18000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Quantité à Déposer</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#787163] bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE6DD]">
                ℹ️ Après validation, notre équipe entrepôt étiquettera vos cartons et mettra à jour votre solde de pièces en temps réel.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE6DD] text-xs font-bold text-[#5C5649] hover:bg-[#FAF9F5]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#141A17] hover:bg-[#e52320] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Confirmer le Dépôt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
