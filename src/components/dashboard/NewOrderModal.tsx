"use client";

import React, { useState } from "react";
import { X, User, Calendar, Truck, CheckCircle2, Package } from "lucide-react";
import { Order, Product } from "@/lib/types";
import { useOperations } from "@/lib/store";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

export default function NewOrderModal({ isOpen, onClose, onOrderCreated }: NewOrderModalProps) {
  const { createOrder, products } = useOperations();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [region, setRegion] = useState("Conakry");
  const [zone, setZone] = useState("");
  const [orderDate, setOrderDate] = useState("2026-08-26");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || { id: "p1", name: "Article", price: 10000, initialStock: 100, remainingStock: 50, deliveredCount: 50, partnerId: "p1" });
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const commission = 40000; // 15 000 GNF service closing + 25 000 GNF livraison

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    const created = createOrder({
      clientName: clientName.toUpperCase(),
      clientPhone,
      region,
      address: zone ? `${zone.toUpperCase()}, ${region}` : region,
      city: region,
      products: selectedProduct.name,
      quantity,
      totalPrice: selectedProduct.price * quantity,
      deliveryFee: 25000,
      serviceFee: 15000,
      comment: "NOUVELLE LIVRAISON (CONFIRMATION GUINÉEGO EN COURS)",
      availability: deliveryDate,
      availabilityLocation: deliveryLocation,
    });

    if (onOrderCreated) {
      onOrderCreated(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141A17]/40 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-white border border-[#EAE6DD] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-[#141A17]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EAE6DD] bg-[#FAF9F5]">
          <div>
            <h3 className="text-base font-black text-[#141A17]">Nouvelle Livraison Client</h3>
            <p className="text-xs text-[#787163] mt-0.5">Clôture d&apos;appel sous 15 min & livraison express en Guinée</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#EAE6DD] text-[#8C8474] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Client Details */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#787163]">
              Destinataire (Acheteur en Guinée)
            </label>
            <input
              type="text"
              required
              placeholder="Nom complet du client *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
            />

            <input
              type="tel"
              required
              placeholder="Téléphone WhatsApp / Appel (ex: +224 620 00 00 00) *"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
              >
                <option value="Conakry">Conakry (Grand Conakry)</option>
                <option value="Kaloum">Kaloum</option>
                <option value="Dixinn">Dixinn</option>
                <option value="Matam">Matam</option>
                <option value="Ratoma">Ratoma</option>
                <option value="Matoto">Matoto</option>
                <option value="Kankan">Kankan</option>
                <option value="Kindia">Kindia</option>
                <option value="Labé">Labé</option>
                <option value="Mamou">Mamou</option>
                <option value="Nzérékoré">Nzérékoré</option>
                <option value="Autre région Guinée">Autre région Guinée</option>
                
                
                
                
                
                
                
              </select>

              <input
                type="text"
                placeholder="Quartier (Kaloum, Kipé, Madina, Lambanyi...)"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs text-[#141A17] placeholder:text-[#8C8474] focus:outline-none focus:border-[#e52320] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Product Select */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#787163]">
              Article en Stock
            </label>
            <div className="space-y-2">
              {products.slice(0, 2).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProduct.id === prod.id
                      ? "bg-[#FAF9F5] border-[#e52320] shadow-2xs"
                      : "bg-white border-[#EAE6DD] hover:border-[#D9D3C7]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#e52320] border border-[#EAE6DD]">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#141A17] uppercase">{prod.name}</p>
                      <p className="text-[11px] text-[#787163]">
                        {prod.price.toLocaleString("fr-FR")} GNF • Dispo : <span className="text-[#e52320] font-bold">{prod.remainingStock}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-bold text-[#787163]">Qté:</span>
                    <input
                      type="number"
                      min={1}
                      max={prod.remainingStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 px-2 py-1 bg-[#FAF9F5] border border-[#EAE6DD] rounded-lg text-xs font-black text-[#141A17] text-center focus:outline-none focus:border-[#e52320]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Breakdown */}
          <div className="bg-[#FAF9F5] border border-[#EAE6DD] rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#141A17] block">Retenue Logistique GuinéeGo</span>
              <span className="text-[10px] text-[#787163]">15 000 GNF Closing + 25 000 GNF Livraison</span>
            </div>
            <span className="font-black text-[#A84232]">-{commission * quantity} GNF</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#e52320] hover:bg-[#c91d1a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Enregistrer & Lancer le Closing</span>
          </button>
        </form>
      </div>
    </div>
  );
}
