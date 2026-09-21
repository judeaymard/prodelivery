"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Users,
  Headset,
  Bike,
  MessageSquare,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { useOperations } from "@/lib/store";

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpotlightSearchModal({ isOpen, onClose }: SpotlightSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { orders, partners, closeuses, livreurs, conversations } = useOperations();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const filteredOrders = cleanQuery
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(cleanQuery) ||
          o.clientName.toLowerCase().includes(cleanQuery) ||
          o.clientPhone.includes(cleanQuery) ||
          o.city.toLowerCase().includes(cleanQuery) ||
          (o.partnerName && o.partnerName.toLowerCase().includes(cleanQuery))
      ).slice(0, 4)
    : [];

  const filteredPartners = cleanQuery
    ? partners.filter(
        (p) =>
          p.companyName.toLowerCase().includes(cleanQuery) ||
          p.fullName.toLowerCase().includes(cleanQuery) ||
          p.email.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const filteredCloseuses = cleanQuery
    ? closeuses.filter((c) => c.name.toLowerCase().includes(cleanQuery)).slice(0, 2)
    : [];

  const filteredLivreurs = cleanQuery
    ? livreurs.filter((l) => l.name.toLowerCase().includes(cleanQuery) || l.zone.toLowerCase().includes(cleanQuery)).slice(0, 2)
    : [];

  const filteredConversations = cleanQuery
    ? conversations.filter(
        (c) =>
          c.partnerName.toLowerCase().includes(cleanQuery) ||
          c.companyName.toLowerCase().includes(cleanQuery) ||
          c.lastMessage.toLowerCase().includes(cleanQuery)
      ).slice(0, 2)
    : [];

  const hasResults =
    filteredOrders.length > 0 ||
    filteredPartners.length > 0 ||
    filteredCloseuses.length > 0 ||
    filteredLivreurs.length > 0 ||
    filteredConversations.length > 0;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 animate-fade-in-up font-sans cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh] cursor-default"
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-700 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une commande (#CMD), un marchand, un livreur, un message..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {/* Bouton croix unique : efface le texte si du texte est saisi, sinon ferme la modal */}
          <button
            onClick={() => {
              if (query) {
                setQuery("");
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title={query ? "Effacer le texte" : "Fermer"}
            aria-label={query ? "Effacer le texte" : "Fermer la recherche"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {!query ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900">Recherche Instantanée Command Center</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Tapez le numéro d&apos;un colis (#CMD), le nom d&apos;une boutique, d&apos;un coursier ou d&apos;une closeuse.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-bold text-slate-900">Aucun résultat trouvé pour &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400">Vérifiez l&apos;orthographe ou essayez un autre mot-clé.</p>
            </div>
          ) : (
            <>
              {/* 📦 Commandes */}
              {filteredOrders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    Commandes ({filteredOrders.length})
                  </span>
                  <div className="space-y-1.5">
                    {filteredOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => navigateTo("/admin/commandes")}
                        className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">{o.orderNumber}</span>
                              <span className="text-[10px] text-slate-500 font-medium">• {o.clientName}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{o.city} • {o.totalPrice.toLocaleString("fr-FR")} F CFA</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 👥 E-commerçants */}
              {filteredPartners.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    E-commerçants Partenaires ({filteredPartners.length})
                  </span>
                  <div className="space-y-1.5">
                    {filteredPartners.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigateTo(`/admin/partenaires`)}
                        className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.companyName}</p>
                            <p className="text-[11px] text-slate-400">{p.fullName} • {p.phone}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 💬 Conversations */}
              {filteredConversations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    Conversations ({filteredConversations.length})
                  </span>
                  <div className="space-y-1.5">
                    {filteredConversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigateTo("/admin/conversations")}
                        className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{c.companyName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{c.lastMessage}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 🛵 Livreurs & Closeuses */}
              {(filteredLivreurs.length > 0 || filteredCloseuses.length > 0) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    Équipe Opérations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredLivreurs.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => navigateTo("/admin/livreurs")}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                          <Bike className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{l.name}</p>
                          <p className="text-[10px] text-slate-400">Livreur • {l.zone}</p>
                        </div>
                      </button>
                    ))}

                    {filteredCloseuses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigateTo("/admin/commandes")}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                          <Headset className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400">Closeuse ({c.conversionRate}% succès)</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
