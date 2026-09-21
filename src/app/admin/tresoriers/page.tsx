"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  PowerOff,
  MoreVertical,
  MapPin,
  TrendingUp,
  Phone,
  Mail,
  X,
  BadgeDollarSign,
  Landmark,
  FileText,
  Activity,
  Edit2,
  Check,
  Building2,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import { TreasuryManagerProfile, EmployeeStatus } from "@/lib/types";

export default function AdminTresoriersPage() {
  const router = useRouter();
  const {
    treasuryManagers,
    codRemittances,
    auditLogs,
    addTreasuryManager,
    updateTreasuryManager,
    toggleTreasuryManagerStatus,
    deleteTreasuryManager,
  } = useOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [selectedManagerDetail, setSelectedManagerDetail] = useState<TreasuryManagerProfile | null>(null);
  const [editingManager, setEditingManager] = useState<TreasuryManagerProfile | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("+229 01 ");
  const [formZone, setFormZone] = useState("Hub Central Conakry (Kaloum)");
  const [formStatus, setFormStatus] = useState<EmployeeStatus>("ACTIF");
  const [formNotes, setFormNotes] = useState("");

  const filteredManagers = useMemo(() => {
    return treasuryManagers.filter((tm) => {
      if (statusFilter !== "ALL" && tm.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          tm.name.toLowerCase().includes(q) ||
          tm.email.toLowerCase().includes(q) ||
          tm.phone.includes(q) ||
          tm.zone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [treasuryManagers, statusFilter, searchTerm]);

  // Executive KPIs
  const totalManagers = treasuryManagers.length;
  const activeCount = treasuryManagers.filter((t) => t.status === "ACTIF").length;
  const totalRemittancesReceived = treasuryManagers.reduce((s, t) => s + t.remittancesReceivedCount, 0);
  const totalFundsManaged = treasuryManagers.reduce((s, t) => s + t.totalFundsReceived, 0);
  const totalDiscrepanciesFlagged = treasuryManagers.reduce((s, t) => s + t.discrepanciesFlaggedCount, 0);

  const handleCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName || !formPhone) return;

    addTreasuryManager({
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      email: formEmail.trim() || `${formFirstName.toLowerCase()}.${formLastName.toLowerCase()}@guineego.com`,
      phone: formPhone.trim(),
      zone: formZone,
      status: formStatus,
      notes: formNotes.trim(),
    });

    setShowAddModal(false);
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("+229 01 ");
    setFormNotes("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;
    updateTreasuryManager(editingManager.id, {
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      zone: formZone,
      status: formStatus,
      notes: formNotes.trim(),
    });
    setEditingManager(null);
  };
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto">
      {/* 👑 HEADER EXÉCUTIF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
              GESTION ÉQUIPE
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Responsables de Trésorerie
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez les caissiers et trésoriers habilités à recevoir physiquement les fonds COD et valider les remises de la flotte.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/tresorerie"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Landmark className="w-4 h-4" />
            <span>Ouvrir Espace Trésorerie →</span>
          </Link>
          <button
            onClick={() => {
              setFormFirstName("");
              setFormLastName("");
              setFormEmail("");
              setFormPhone("+229 01 ");
              setFormZone("Hub Central Conakry (Kaloum)");
              setFormStatus("ACTIF");
              setFormNotes("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un responsable</span>
          </button>
        </div>
      </div>

      {/* 📊 5 KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Effectif Trésorerie</span>
          <p className="text-xl font-black font-mono text-slate-900">{totalManagers}</p>
          <span className="text-[10px] text-slate-500 block">{activeCount} actifs sur le terrain</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">🟢 Trésoriers Actifs</span>
          <p className="text-xl font-black font-mono text-emerald-700">{activeCount}</p>
          <span className="text-[10px] text-emerald-800 block">Permanence caisse assurée</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">Remises Traitées</span>
          <p className="text-xl font-black font-mono text-slate-900">{totalRemittancesReceived}</p>
          <span className="text-[10px] text-slate-500 block">Dépôts physiques contrôlés</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Total Fonds Encaissés</span>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-700">{formatCFA(totalFundsManaged)}</p>
          <span className="text-[10px] text-emerald-800 block">Espèces sécurisées au coffre</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">Écarts Signalés</span>
          <p className="text-xl font-black font-mono text-amber-700">{totalDiscrepanciesFlagged}</p>
          <span className="text-[10px] text-amber-800 block">Anomalies tracées et loggées</span>
        </div>
      </div>

      {/* 🔍 RECHERCHE & FILTRES */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un responsable, téléphone, email ou zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "ACTIF", label: "🟢 Actifs" },
            { id: "EN_PAUSE", label: "🟡 En pause" },
            { id: "DESACTIVE", label: "🔴 Désactivés" },
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

      {/* 📋 TABLEAU DES RESPONSABLES DE TRÉSORERIE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Responsable</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5">Hub / Zone de Caisse</th>
                <th className="py-3.5 px-5 text-center">Remises Reçues</th>
                <th className="py-3.5 px-5 text-right">Fonds Encaissés</th>
                <th className="py-3.5 px-5 text-center">Écarts Signalés</th>
                <th className="py-3.5 px-5">Dernière Activité</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Aucun responsable de trésorerie ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                filteredManagers.map((tm) => (
                  <tr
                    key={tm.id}
                    onClick={() => setSelectedManagerDetail(tm)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {tm.firstName.charAt(0)}{tm.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:underline">{tm.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{tm.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        tm.status === "ACTIF"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : tm.status === "EN_PAUSE"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {tm.status === "ACTIF" ? "🟢 Actif" : tm.status === "EN_PAUSE" ? "🟡 En pause" : "🔴 Désactivé"}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800">{tm.zone}</span>
                      <span className="text-[10px] text-slate-400 block">{tm.email}</span>
                    </td>

                    <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">
                      {tm.remittancesReceivedCount}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">
                      {formatCFA(tm.totalFundsReceived)}
                    </td>

                    <td className="py-3.5 px-5 text-center font-mono font-bold">
                      {tm.discrepanciesFlaggedCount > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {tm.discrepanciesFlaggedCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {tm.lastActiveAt}
                    </td>

                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingManager(tm);
                            setFormFirstName(tm.firstName);
                            setFormLastName(tm.lastName);
                            setFormEmail(tm.email);
                            setFormPhone(tm.phone);
                            setFormZone(tm.zone);
                            setFormStatus(tm.status);
                            setFormNotes(tm.notes || "");
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            toggleTreasuryManagerStatus(
                              tm.id,
                              tm.status === "ACTIF" ? "EN_PAUSE" : "ACTIF"
                            )
                          }
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                        >
                          {tm.status === "ACTIF" ? "Mettre en pause" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ➕ MODAL 1 : AJOUTER UN RESPONSABLE DE TRÉSORERIE */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Créer un Responsable de Trésorerie</h3>
                  <p className="text-xs text-slate-500">Création d&apos;un compte opérationnel avec rôle TREASURY_MANAGER.</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManager} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Baptiste"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AGOSSOU"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Professionnel</label>
                  <input
                    type="email"
                    placeholder="Ex: jb.agossou@guineego.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hub ou Zone de Caisse Assignée *</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="Hub Central Conakry (Kaloum)">Hub Central Conakry (Kaloum)</option>
                  <option value="Hub Secondaire Kankan (Arconville)">Hub Secondaire Kankan (Arconville)</option>
                  <option value="Hub Mamou">Hub Mamou</option>
                  <option value="Hub Conakry Est (Matoto)">Hub Conakry Est (Matoto)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Statut Initial</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EmployeeStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="ACTIF">🟢 Actif (Prêt à encaisser)</option>
                  <option value="EN_PAUSE">🟡 En pause</option>
                  <option value="DESACTIVE">🔴 Désactivé</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Attribution</label>
                <textarea
                  rows={2}
                  placeholder="Notes sur les habilitations de caisse ou horaires..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Créer le Compte Trésorier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ MODAL 2 : MODIFIER UN RESPONSABLE */}
      {editingManager && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Modifier {editingManager.name}</h3>
              <button onClick={() => setEditingManager(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hub / Zone de Caisse</label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Statut</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EmployeeStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="ACTIF">🟢 Actif</option>
                  <option value="EN_PAUSE">🟡 En pause</option>
                  <option value="DESACTIVE">🔴 Désactivé</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingManager(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-xs cursor-pointer hover:bg-slate-800"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📜 MODAL 3 : FICHE ACTIVITÉ & AUDIT TRAIL DU TRÉSORIER */}
      {selectedManagerDetail && (
        <div className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {selectedManagerDetail.firstName.charAt(0)}{selectedManagerDetail.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedManagerDetail.name}</h3>
                  <p className="text-xs text-slate-500">{selectedManagerDetail.zone} • {selectedManagerDetail.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedManagerDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Remises Reçues</span>
                <p className="text-base font-black font-mono text-slate-900">{selectedManagerDetail.remittancesReceivedCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Encaissé</span>
                <p className="text-base font-black font-mono text-emerald-800">{formatCFA(selectedManagerDetail.totalFundsReceived)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Écarts Signalés</span>
                <p className="text-base font-black font-mono text-amber-900">{selectedManagerDetail.discrepanciesFlaggedCount}</p>
              </div>
            </div>

            {/* Remises reçues par ce responsable */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dernières Remises Traitées par ce Responsable
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3 text-xs">
                {codRemittances.map((rem) => (
                  <div key={rem.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{rem.reference}</span>
                      <p className="text-[11px] text-slate-500">{rem.livreurName} • {rem.period}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 block">{formatCFA(rem.amountDeclared)}</span>
                      <span className="text-[9px] font-mono text-slate-400">{rem.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedManagerDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
