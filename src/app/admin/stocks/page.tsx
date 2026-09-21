"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Boxes, Package, Plus, Minus, Building, Check, Store, ArrowRight, X } from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Product } from "@/lib/types";

export default function AdminStocksPage() {
  const { products, partners, addProduct, adjustProductStock } = useOperations();
  const [selectedPartner, setSelectedPartner] = useState<string>("ALL");

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetPartnerId, setTargetPartnerId] = useState(partners[0]?.id || "");
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    addProduct({
      name: newProdName.toUpperCase(),
      price: parseInt(newProdPrice) || 0,
      initialStock: parseInt(newProdStock) || 0,
      remainingStock: parseInt(newProdStock) || 0,
      deliveredCount: 0,
      partnerId: targetPartnerId || partners[0]?.id || "",
      createdAt: new Date().toISOString().split("T")[0],
    });

    setShowAddModal(false);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdStock("");
  };

  const filteredProducts = products.filter(
    (prod) => selectedPartner === "ALL" || prod.partnerId === selectedPartner
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Entrepôt & Stocks Marchands</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventaire physique des marchandises entreposées dans les locaux ENO à Cotonou et Calavi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs max-w-md">
        <div className="relative">
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">🏢 Tous les Marchands Partenaires</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName} ({p.fullName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((prod) => {
          const partner = partners.find((p) => p.id === prod.partnerId);
          const isLowStock = prod.remainingStock <= 10;

          return (
            <div
              key={prod.id}
              className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {partner?.companyName || "Marchand Partenaire"}
                  </span>
                  {isLowStock ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Stock Faible
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      En Stock
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-1">{prod.name}</h3>
                <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{formatCFA(prod.price)}</p>
              </div>

              {/* Progress & Remaining */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Stock restant :</span>
                  <span className="font-black text-slate-900">{prod.remainingStock} unités</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Livrées :</span>
                  <span className="font-bold text-emerald-600">{prod.deliveredCount} remis</span>
                </div>

                {/* Stock Controls */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-bold text-slate-400">Ajustement inventaire :</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustProductStock(prod.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => adjustProductStock(prod.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL AJOUT PRODUIT */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Enregistrer un Produit en Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Marchand Partenaire</label>
                <select
                  value={targetPartnerId}
                  onChange={(e) => setTargetPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} ({p.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Désignation du Produit</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex: ROULEAU DESSIN MAGIQUE"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Prix Client (F CFA)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="7800"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantité Déposée</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
