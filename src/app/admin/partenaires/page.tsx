"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  PowerOff,
  MoreVertical,
  MapPin,
  TrendingUp,
  Package,
  Phone,
  Shield,
  X,
  ChevronRight,
  Sparkles,
  DollarSign,
  Layers,
  Building2,
  ExternalLink,
  MessageSquare,
  BadgeDollarSign,
  AlertCircle,
  Ban,
  Check,
  FileCheck,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { Partner, PartnerStatus } from "@/lib/types";
import DailyClosureModal from "@/components/DailyClosureModal";
export default function AdminPartenairesPage() {
  const router = useRouter();
  const {
    partners,
    orders,
    payoutRequests,
    addPartner,
    suspendPartner,
    reactivatePartner,
  } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [closurePartner, setClosurePartner] = useState<Partner | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [suspendModalPartner, setSuspendModalPartner] = useState<Partner | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Form state for adding partner
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("+229 01 ");
  const [newEmail, setNewEmail] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newCategory, setNewCategory] = useState("Cosmétique & Beauté");
  const [newCity, setNewCity] = useState("Conakry");
  const [newAddress, setNewAddress] = useState("Centre d'Affaires, Kaloum, Conakry");
  const [newDeliveryFee, setNewDeliveryFee] = useState("2000");
  const [newCommission, setNewCommission] = useState("800");
  const [newStatus, setNewStatus] = useState<PartnerStatus>("ACTIVE");

  // Helper: compute pending withdrawal for a merchant
  const getPendingWithdrawal = (partnerId: string) => {
    return payoutRequests
      .filter((p) => p.partnerId === partnerId && p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Helper: compute orders for a merchant
  const getPartnerOrdersCountToday = (partnerId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => o.partnerId === partnerId && o.createdAt?.startsWith(todayStr)).length;
  };

  // Helper: compute monthly orders for a merchant
  const getPartnerOrdersCountMonth = (partnerId: string, p: Partner) => {
    const storeCount = orders.filter((o) => o.partnerId === partnerId).length;
    return storeCount > 0 ? storeCount : (p.ordersCountMonth || 0);
  };

  // Helper: compute rates
  const getPartnerConfirmationRate = (partnerId: string, p: Partner) => {
    const pOrders = orders.filter((o) => o.partnerId === partnerId);
    if (pOrders.length === 0) return p.confirmationRate || 0;
    const confirmed = pOrders.filter((o) => ["CONFIRMEE", "EN_COURS", "LIVREE"].includes(o.status)).length;
    return Math.round((confirmed / pOrders.length) * 100);
  };

  const getPartnerDeliveryRate = (partnerId: string, p: Partner) => {
    const pOrders = orders.filter((o) => o.partnerId === partnerId);
    const completed = pOrders.filter((o) => ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)).length;
    if (completed === 0) return p.deliverySuccessRate || 0;
    const delivered = pOrders.filter((o) => o.status === "LIVREE").length;
    return Math.round((delivered / completed) * 100);
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const status = p.status || (p.isActive ? "ACTIVE" : "INACTIVE");

      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && status !== "ACTIVE") return false;
        if (statusFilter === "ONBOARDING" && status !== "ONBOARDING") return false;
        if (statusFilter === "PENDING_VERIFICATION" && status !== "PENDING_VERIFICATION") return false;
        if (statusFilter === "INACTIVE" && status !== "INACTIVE") return false;
        if (statusFilter === "SUSPENDED" && status !== "SUSPENDED") return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCompany = p.companyName.toLowerCase().includes(q);
        const matchName = p.fullName.toLowerCase().includes(q);
        const matchPhone = p.phone.includes(q);
        const matchEmail = (p.email || "").toLowerCase().includes(q);
        return matchCompany || matchName || matchPhone || matchEmail;
      }

      return true;
    });
  }, [partners, statusFilter, searchTerm]);

  // Compute 8 Fleet/Merchant KPIs
  const totalActivePartners = partners.filter((p) => p.status === "ACTIVE" || p.isActive).length;
  const newThisMonth = partners.filter((p) => (p.onboardingStep && p.onboardingStep < 6) || p.status === "ONBOARDING").length;
  const activeToday = partners.filter((p) => orders.some((o) => o.partnerId === p.id)).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalOrdersToday = orders.filter((o) => o.createdAt?.startsWith(todayStr)).length;
  const totalGmvProcessed = orders.filter((o) => o.status === "LIVREE").reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const deliveredOrdersCount = orders.filter((o) => o.status === "LIVREE").length;
  const totalCompletedOrders = orders.filter((o) => ["LIVREE", "REFUSEE", "RETOURNEE", "ANNULEE"].includes(o.status)).length;
  const deliverySuccessRate = totalCompletedOrders > 0 ? `${Math.round((deliveredOrdersCount / totalCompletedOrders) * 100)} %` : "0 %";
  const totalBalanceDue = partners.reduce((sum, p) => sum + (p.availableBalance || 0), 0);
  const pendingPayoutsCount = payoutRequests.filter((p) => p.status === "PENDING").length;
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newPhone) return;

    addPartner({
      companyName: newCompanyName.trim(),
      fullName: newFullName.trim() || newCompanyName.trim(),
      email: newEmail.trim() || `contact@${newCompanyName.toLowerCase().replace(/\s+/g, "")}.bj`,
      phone: newPhone.trim(),
      websiteUrl: newWebsite.trim(),
      category: newCategory,
      city: newCity,
      address: newAddress,
      deliveryFeeDefault: parseInt(newDeliveryFee) || 2000,
      agencyCommissionDefault: parseInt(newCommission) || 800,
      status: newStatus,
      onboardingStep: newStatus === "ONBOARDING" ? 2 : 6,
    });

    setShowAddModal(false);
    setNewCompanyName("");
    setNewFullName("");
    setNewPhone("+229 01 ");
  };

  const handleConfirmSuspension = () => {
    if (!suspendModalPartner) return;
    suspendPartner(suspendModalPartner.id, suspendReason.trim() || "Suspension administrative par la direction.");
    setSuspendModalPartner(null);
    setSuspendReason("");
  };

  const getStatusBadge = (status?: PartnerStatus) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return { label: "À vérifier", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
      case "ONBOARDING":
        return { label: "En onboarding", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" };
      case "INACTIVE":
        return { label: "Inactif", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
      case "SUSPENDED":
        return { label: "Suspendu", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" };
      case "ACTIVE":
      default:
        return { label: "Actif", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Boutique,Propriétaire,Téléphone,Email,Statut,Solde,Taux Livraison,GMV"].join(",") +
      "\n" +
      partners
        .map((p) =>
          [
            `"${p.companyName}"`,
            `"${p.fullName}"`,
            `"${p.phone}"`,
            `"${p.email}"`,
            `"${p.status || "ACTIVE"}"`,
            `"${p.availableBalance || 0} GNF"`,
            `"${p.deliverySuccessRate || 0}%"`,
            `"${p.gmvProcessed || 0} GNF"`,
          ].join(",")
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecommercants_guineego_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">E-commerçants</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilotez vos boutiques partenaires, leurs commandes, leurs performances et leurs finances.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un e-commerçant</span>
          </button>
        </div>
      </div>

      {/* 📊 2. KPI STRIP (8 KPI) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Actifs</span>
          <span className="text-lg font-black text-slate-900">{totalActivePartners}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-purple-600 block">Nouveaux</span>
          <span className="text-lg font-black text-purple-600">{newThisMonth}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">Actifs Auj.</span>
          <span className="text-lg font-black text-emerald-600">{activeToday}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-700 block">Colis Auj.</span>
          <span className="text-lg font-black text-slate-900 font-mono">{totalOrdersToday}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Volume GMV</span>
          <span className="text-xs font-black font-mono text-slate-900">{formatCFA(totalGmvProcessed)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">Livraisons</span>
          <span className="text-lg font-black text-emerald-700">{deliverySuccessRate}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">À Reverser</span>
          <span className="text-xs font-black font-mono text-slate-900">{formatCFA(totalBalanceDue)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 block">Retraits Attente</span>
          <span className="text-lg font-black text-amber-600">{pendingPayoutsCount}</span>
        </div>
      </div>
      {/* 🔍 3. RECHERCHE & FILTRES RAPIDES */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une boutique, un marchand, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "ACTIVE", label: "Actifs" },
            { id: "ONBOARDING", label: "En onboarding" },
            { id: "PENDING_VERIFICATION", label: "À vérifier" },
            { id: "INACTIVE", label: "Inactifs" },
            { id: "SUSPENDED", label: "Suspendus" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white font-black shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 4. TABLEAU DES E-COMMERÇANTS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Boutique</th>
                <th className="py-3.5 px-5">Propriétaire</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5">Colis Auj.</th>
                <th className="py-3.5 px-5">Colis Mois</th>
                <th className="py-3.5 px-5">Taux Confir.</th>
                <th className="py-3.5 px-5">Taux Livr.</th>
                <th className="py-3.5 px-5">Solde Dispo</th>
                <th className="py-3.5 px-5">Retrait Attente</th>
                <th className="py-3.5 px-5">Dernière Activité</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    Aucune boutique partenaire ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((part) => {
                  const badge = getStatusBadge(part.status);
                  const ordersToday = getPartnerOrdersCountToday(part.id);
                  const ordersMonth = getPartnerOrdersCountMonth(part.id, part);
                  const confRate = getPartnerConfirmationRate(part.id, part);
                  const delRate = getPartnerDeliveryRate(part.id, part);
                  const pendingWithdrawal = getPendingWithdrawal(part.id);

                  return (
                    <tr
                      key={part.id}
                      onClick={() => router.push(`/admin/partenaires/${part.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {part.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:underline">{part.companyName}</p>
                            <span className="text-[10px] text-slate-400">{part.category || "E-commerce"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-800">{part.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{part.phone}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {ordersToday}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        {ordersMonth}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {confRate}%
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">
                        {delRate}%
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {formatCFA(part.availableBalance || 0)}
                      </td>

                      <td className="py-3.5 px-5 font-mono">
                        {pendingWithdrawal > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {formatCFA(pendingWithdrawal)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 GNF</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                        {part.lastActivityAt || "Récemment"}
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpenId(actionMenuOpenId === part.id ? null : part.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === part.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-20 text-xs">
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  router.push(`/admin/partenaires/${part.id}`);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                Voir la fiche complète
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  router.push(`/admin/commandes?merchant=${part.id}`);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                Voir les commandes
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  router.push(`/admin/finances?merchant=${part.id}`);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                              >
                                Voir les finances
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setClosurePartner(part);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 font-bold text-emerald-800 flex items-center gap-1.5"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Bilan Clôture Journalière</span>
                              </button>
                              <a
                                href={`tel:${part.phone.replace(/\s+/g, "")}`}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-medium text-slate-800 block"
                              >
                                Appeler le marchand
                              </a>
                              <div className="border-t border-slate-100 my-1"></div>
                              {part.status === "SUSPENDED" ? (
                                <button
                                  onClick={() => {
                                    reactivatePartner(part.id);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 text-emerald-700 font-bold"
                                >
                                  Réactiver la boutique
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSuspendModalPartner(part);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-700 font-bold"
                                >
                                  Suspendre la boutique
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredPartners.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Aucune boutique trouvée.</div>
          ) : (
            filteredPartners.map((part) => {
              const badge = getStatusBadge(part.status);
              return (
                <div
                  key={part.id}
                  onClick={() => router.push(`/admin/partenaires/${part.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {part.companyName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{part.companyName}</h4>
                        <p className="text-[10px] text-slate-400">{part.fullName} • {part.city}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Solde Dispo</span>
                      <span className="font-bold text-slate-900 font-mono text-[10px]">
                        {formatCFA(part.availableBalance || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Colis Mois</span>
                      <span className="font-bold text-slate-900 font-mono">{getPartnerOrdersCountMonth(part.id, part)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Taux Livr.</span>
                      <span className="font-bold text-emerald-700">{getPartnerDeliveryRate(part.id, part)}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* 📝 MODAL + AJOUTER UN E-COMMERÇANT */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">Ajouter une Boutique E-commerce</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Identité de l&apos;entreprise
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom de la Boutique *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Royal Shoes BJ"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom du Propriétaire *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gildas TOSSOU"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Ex: contact@royalshoes.bj"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Boutique & Produits
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                    >
                      <option value="Cosmétique & Beauté">Cosmétique & Beauté</option>
                      <option value="Mode & Prêt-à-porter">Mode & Prêt-à-porter</option>
                      <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                      <option value="Chaussures & Maroquinerie">Chaussures & Maroquinerie</option>
                      <option value="Maison & Décoration">Maison & Décoration</option>
                      <option value="Généraliste">Généraliste</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Site Web / Réseau Social</label>
                    <input
                      type="text"
                      placeholder="Ex: https://royalshoes.bj"
                      value={newWebsite}
                      onChange={(e) => setNewWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ville Principale</label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adresse de Collecte</label>
                    <input
                      type="text"
                      placeholder="Ex: Haie Vive, Rue 410"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Conditions Commerciales
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Frais Livraison Client (GNF)</label>
                    <input
                      type="number"
                      value={newDeliveryFee}
                      onChange={(e) => setNewDeliveryFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Commission Closing (GNF)</label>
                    <input
                      type="number"
                      value={newCommission}
                      onChange={(e) => setNewCommission(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block mb-1">Statut Initial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PartnerStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="ACTIVE">🟢 Actif (Prêt à opérer)</option>
                  <option value="ONBOARDING">🔵 En onboarding (Configuration en cours)</option>
                  <option value="PENDING_VERIFICATION">🟡 À vérifier (Contrôle requis)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Créer l&apos;E-commerçant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE CONFIRMATION DE SUSPENSION */}
      {suspendModalPartner && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Suspendre la Boutique ?</h3>
                <p className="text-xs text-slate-500">{suspendModalPartner.companyName}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-900">
              <p className="font-bold">Conséquences de la suspension :</p>
              <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                <li>Blocage immédiat de la création de nouvelles commandes.</li>
                <li>Mise en pause des paiements et retraits en cours.</li>
                <li>Notification administrative envoyée au propriétaire.</li>
              </ul>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Motif de la suspension *</label>
              <textarea
                rows={3}
                placeholder="Ex: Non-respect des conditions de conformité, contestations répétées..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setSuspendModalPartner(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Confirmer la Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 MODAL BORDEREAU DE CLÔTURE JOURNALIÈRE DU MARCHAND */}
      {closurePartner && (
        <DailyClosureModal
          isOpen={!!closurePartner}
          onClose={() => setClosurePartner(null)}
          partner={closurePartner}
          orders={orders}
        />
      )}
    </div>
  );
}
