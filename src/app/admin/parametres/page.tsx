"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  Building,
  Bell,
  Save,
  CheckCircle2,
  Users,
  Key,
  Lock,
  Smartphone,
  CreditCard,
  Truck,
  Sparkles,
  Sliders,
  DollarSign,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Ban,
  Check,
  Copy,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Mail,
  Phone,
  MapPin,
  Laptop,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Radio,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import {
  PlatformUser,
  PlatformUserStatus,
  UserRole,
  PlatformSettings,
  RoleDefinition,
  PermissionDefinition,
} from "@/lib/types";
import { platformRoles, platformPermissions } from "@/lib/mock-data";

export default function AdminParametresPage() {
  const {
    platformSettings,
    platformUsers,
    rolePermissions,
    currentUserProfile,
    updatePlatformSettings,
    updateUserProfile,
    createPlatformUser,
    updatePlatformUserStatus,
    updateRolePermissions,
    hasPermission,
    globalAuditLogs,
    auditSessions,
  } = useOperations();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    | "PROFILE"
    | "USERS"
    | "ROLES"
    | "OPERATIONS"
    | "FINANCE"
    | "NOTIFICATIONS"
    | "GENERAL"
    | "SECURITY"
    | "AUDIT"
  >("PROFILE");

  // Notifications feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // 1. STATE & HANDLERS: PROFILE
  // =========================================================================
  const [profileForm, setProfileForm] = useState({
    firstName: currentUserProfile.firstName || "",
    lastName: currentUserProfile.lastName || "",
    email: currentUserProfile.email || "",
    phone: currentUserProfile.phone || "",
    zone: currentUserProfile.zone || "",
  });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      name: `${profileForm.firstName} ${profileForm.lastName}`,
      phone: profileForm.phone,
      zone: profileForm.zone,
    });
    showToast("Profil personnel mis à jour avec succès !");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showToast("Demande de changement de mot de passe traitée avec succès !");
  };

  // =========================================================================
  // 2. STATE & HANDLERS: USERS
  // =========================================================================
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [suspendModalUser, setSuspendModalUser] = useState<PlatformUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "CLOSEUSE" as UserRole,
    zone: "Conakry",
    status: "active" as PlatformUserStatus,
  });

  const filteredUsers = useMemo(() => {
    return platformUsers.filter((u) => {
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone.includes(q);
        const matchesRole = u.roleLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesRole) return false;
      }
      if (userRoleFilter !== "ALL" && u.role !== userRoleFilter) return false;
      if (userStatusFilter !== "ALL" && u.status !== userStatusFilter) return false;
      return true;
    });
  }, [platformUsers, userSearch, userRoleFilter, userStatusFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email) {
      alert("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    createPlatformUser({
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
      email: newUserForm.email,
      phone: newUserForm.phone,
      role: newUserForm.role,
      roleLabel: platformRoles.find((r) => r.id === newUserForm.role)?.label || newUserForm.role,
      status: newUserForm.status,
      zone: newUserForm.zone,
    });
    setCreateUserModalOpen(false);
    setNewUserForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "CLOSEUSE",
      zone: "Conakry",
      status: "active",
    });
    showToast("Nouvel utilisateur créé avec succès dans l'annuaire !");
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalUser) return;
    const newStatus: PlatformUserStatus =
      suspendModalUser.status === "suspended" ? "active" : "suspended";
    updatePlatformUserStatus(suspendModalUser.id, newStatus, suspendReason || undefined);
    setSuspendModalUser(null);
    setSuspendReason("");
    showToast(
      `Statut du compte ${suspendModalUser.name} mis à jour (${newStatus === "suspended" ? "Suspendu" : "Réactivé"}) !`
    );
  };

  // =========================================================================
  // 3. STATE & HANDLERS: ROLES & PERMISSIONS
  // =========================================================================
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<UserRole>("SUPER_ADMIN");
  const [rolePermissionsDraft, setRolePermissionsDraft] = useState<Record<string, string[]>>(rolePermissions);

  const togglePermissionForRole = (roleId: string, permId: string) => {
    if (roleId === "PDG") return; // Sovereignty lock
    setRolePermissionsDraft((prev) => {
      const currentPerms = prev[roleId] || [];
      const has = currentPerms.includes(permId);
      const updated = has
        ? currentPerms.filter((p) => p !== permId)
        : [...currentPerms, permId];
      return { ...prev, [roleId]: updated };
    });
  };

  const handleSavePermissions = () => {
    Object.entries(rolePermissionsDraft).forEach(([roleId, perms]) => {
      updateRolePermissions(roleId, perms);
    });
    showToast("Matrice des rôles et permissions enregistrée avec succès !");
  };

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const map: Record<string, PermissionDefinition[]> = {};
    platformPermissions.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, []);

  // =========================================================================
  // 4. STATE & HANDLERS: OPERATIONAL SETTINGS
  // =========================================================================
  const [opForm, setOpForm] = useState(platformSettings.operational);

  const handleSaveOperational = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({ operational: opForm }, "Paramètres opérationnels");
    showToast("Paramètres opérationnels enregistrés avec succès !");
  };

  // =========================================================================
  // 5. STATE & HANDLERS: FINANCIAL & PAYMENT SETTINGS
  // =========================================================================
  const [finForm, setFinForm] = useState(platformSettings.financial);
  const [gatewaysForm, setGatewaysForm] = useState(platformSettings.paymentGateways);

  const handleSaveFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings(
      { financial: finForm, paymentGateways: gatewaysForm },
      "Paramètres financiers et passerelles"
    );
    showToast("Paramètres financiers et passerelles de paiement enregistrés !");
  };

  // =========================================================================
  // 6. STATE & HANDLERS: NOTIFICATIONS PREFERENCES
  // =========================================================================
  const [notifPrefForm, setNotifPrefForm] = useState(platformSettings.notifications);

  const handleSaveNotifPref = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({ notifications: notifPrefForm }, "Préférences de notifications");
    showToast("Préférences de notifications mises à jour !");
  };

  // =========================================================================
  // 7. STATE & HANDLERS: GENERAL SETTINGS
  // =========================================================================
  const [genForm, setGenForm] = useState(platformSettings.general);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({ general: genForm }, "Configuration générale");
    showToast("Configuration générale enregistrée !");
  };

  // =========================================================================
  // 8. STATE & HANDLERS: SECURITY
  // =========================================================================
  const [secForm, setSecForm] = useState(platformSettings.security);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({ security: secForm }, "Paramètres de sécurité");
    showToast("Paramètres de sécurité enregistrés !");
  };

  // Audit Logs filtered for settings & users
  const settingsAuditLogs = useMemo(() => {
    return globalAuditLogs.filter(
      (log) => log.module === "PARAMETRES" || log.module === "UTILISATEURS" || log.module === "AUTH"
    );
  }, [globalAuditLogs]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto pb-16">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Gouvernance & Contrôle Global GuinéeGo LAT 2027
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Paramètres & Permissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Centre de configuration, gestion des utilisateurs, contrôle granulaire des accès et règles opérationnelles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            Dernière mise à jour : <strong className="text-slate-700">{platformSettings.lastUpdated}</strong>
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION TABS (ERP Style) */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PROFILE"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Mon Profil</span>
          </button>

          <button
            onClick={() => setActiveTab("USERS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "USERS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Utilisateurs ({platformUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ROLES")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ROLES"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rôles & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab("OPERATIONS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "OPERATIONS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Opérations</span>
          </button>

          <button
            onClick={() => setActiveTab("FINANCE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "FINANCE"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Paiements & Finances</span>
          </button>

          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "NOTIFICATIONS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("GENERAL")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "GENERAL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Général</span>
          </button>

          <button
            onClick={() => setActiveTab("SECURITY")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "SECURITY"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sécurité</span>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "AUDIT"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit ({settingsAuditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: MON PROFIL                                                       */}
      {/* ======================================================================= */}
      {activeTab === "PROFILE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left card: Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
                {currentUserProfile.firstName.slice(0, 1)}
                {currentUserProfile.lastName.slice(0, 1)}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{currentUserProfile.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{currentUserProfile.email}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUserProfile.roleLabel}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Statut du compte :</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Actif (Vérifié)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Authentification 2FA :</span>
                <span className="font-bold text-slate-700">Activée ({currentUserProfile.twoFactorMethod || "App"})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Date de création :</span>
                <span className="font-medium text-slate-700">{currentUserProfile.createdAt}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Dernière connexion :</span>
                <span className="font-medium text-slate-700">{currentUserProfile.lastLoginAt}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Gouvernance Souveraine</span>
              </div>
              <p>
                Le rôle de Président Directeur Général détient l&apos;intégralité des droits d&apos;arbitrage et de configuration.
              </p>
            </div>
          </div>

          {/* Right card: Form */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Modifier mes informations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mettez à jour vos coordonnées personnelles et de contact direct.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Prénom</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email professionnel</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    title="L'email principal ne peut être modifié que par l'administrateur système"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Identifiant de session unique</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone direct</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Zone / Bureau d&apos;attache</label>
                <input
                  type="text"
                  value={profileForm.zone}
                  onChange={(e) => setProfileForm({ ...profileForm, zone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Changer mon mot de passe</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer mon profil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: UTILISATEURS (Annuaire & Gestion)                                */}
      {/* ======================================================================= */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Top Bar: Search, Filters & Create */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone ou rôle..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="PDG">👑 PDG</option>
                <option value="SUPER_ADMIN">🛡️ Admin Général</option>
                <option value="TREASURY_MANAGER">💰 Trésorerie</option>
                <option value="LOGISTICS_MANAGER">🚚 Logistique</option>
                <option value="CLOSEUSE">📞 Closeuses</option>
                <option value="LIVREUR">🛵 Livreurs</option>
                <option value="PARTNER">🏢 Marchands</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tous statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactif</option>
              </select>

              <button
                onClick={() => setCreateUserModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Utilisateur</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Utilisateur</th>
                    <th className="py-3.5 px-4">Rôle</th>
                    <th className="py-3.5 px-4">Zone / Antenne</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4">2FA</th>
                    <th className="py-3.5 px-4">Dernière Activité</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.status === "suspended";
                    const isPDG = u.role === "PDG";

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.firstName.slice(0, 1)}
                              {u.lastName.slice(0, 1)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.name}</span>
                              <span className="text-[11px] text-slate-400 block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              u.role === "PDG"
                                ? "bg-slate-900 text-white"
                                : u.role === "TREASURY_MANAGER"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.role === "CLOSEUSE"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "LIVREUR"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {u.roleLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                          {u.zone || "Conakry"}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : u.status === "suspended"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {u.status === "active"
                              ? "Actif"
                              : u.status === "suspended"
                              ? "Suspendu"
                              : "En attente"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.is2FAEnabled ? (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Actif</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Désactivé</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                          {u.lastActiveAt || "N/A"}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          {!isPDG ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSuspendModalUser(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  isSuspended
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                }`}
                              >
                                {isSuspended ? "Réactiver" : "Suspendre"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Souverain</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: RÔLES & PERMISSIONS (Matrice Interactive)                        */}
      {/* ======================================================================= */}
      {activeTab === "ROLES" && (
        <div className="space-y-6">
          {/* Roles Carousel / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformRoles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoleForMatrix(r.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                  selectedRoleForMatrix === r.id
                    ? "bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-sm"
                    : "bg-white border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${r.badgeBg} ${r.badgeText}`}
                  >
                    {r.label.split(" ")[0]}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{r.userCount} membre(s)</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-3">{r.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>
              </div>
            ))}
          </div>

          {/* Matrix Actions Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Matrice des Permissions : Rôle {selectedRoleForMatrix}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cochez ou décochez les autorisations accordées à ce groupe d&apos;utilisateurs.
              </p>
            </div>

            <button
              onClick={handleSavePermissions}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer la matrice</span>
            </button>
          </div>

          {/* Permissions Accordion / Categorized List */}
          <div className="space-y-4">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div
                key={category}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {category}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold ml-auto">
                    {perms.length} permission(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((p) => {
                    const isPDG = selectedRoleForMatrix === "PDG";
                    const currentPerms = rolePermissionsDraft[selectedRoleForMatrix] || [];
                    const isGranted = isPDG || currentPerms.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isPDG && togglePermissionForRole(selectedRoleForMatrix, p.id)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                          isPDG
                            ? "bg-slate-50/60 border-slate-200 cursor-not-allowed opacity-90"
                            : isGranted
                            ? "bg-slate-900/5 border-slate-900/30 cursor-pointer"
                            : "bg-white border-slate-200/70 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            {p.isSensitive && (
                              <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                Sensible
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{p.description}</p>
                          <span className="text-[9px] font-mono text-slate-400 block pt-1">
                            key: {p.id}
                          </span>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isGranted ? (
                            <span className="w-5 h-5 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-lg border border-slate-300 flex items-center justify-center" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 4: PARAMÈTRES OPÉRATIONNELS                                         */}
      {/* ======================================================================= */}
      {activeTab === "OPERATIONS" && (
        <form onSubmit={handleSaveOperational} className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Règles d&apos;attribution et de dispatching</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurez l&apos;algorithme d&apos;attribution intelligente des commandes et conversations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mode d&apos;attribution des Commandes
                </label>
                <select
                  value={opForm.ordersAssignmentMode}
                  onChange={(e) => setOpForm({ ...opForm, ordersAssignmentMode: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                >
                  <option value="SMART_AUTO">⚡ Attribution Automatique Intelligente (Charge active)</option>
                  <option value="ROUND_ROBIN">🔄 Rotation Round Robin (Tour de rôle)</option>
                  <option value="MANUAL">✋ Attribution Manuelle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Capacité maximale par closeuse
                </label>
                <input
                  type="number"
                  value={opForm.maxCapacityPerCloser}
                  onChange={(e) =>
                    setOpForm({ ...opForm, maxCapacityPerCloser: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  min={1}
                  max={50}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Délais et seuils d&apos;alerte de livraison
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Délai standard estimé (minutes)
                  </label>
                  <input
                    type="number"
                    value={opForm.estimatedDeliveryMinutes}
                    onChange={(e) =>
                      setOpForm({ ...opForm, estimatedDeliveryMinutes: parseInt(e.target.value) || 120 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Seuil d&apos;alerte de retard critique (heures)
                  </label>
                  <input
                    type="number"
                    value={opForm.criticalDelayHours}
                    onChange={(e) =>
                      setOpForm({ ...opForm, criticalDelayHours: parseInt(e.target.value) || 4 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Plafond max espèces COD par livreur (GNF)
                  </label>
                  <input
                    type="number"
                    value={opForm.maxDriverCodCeilingFCFA}
                    onChange={(e) =>
                      setOpForm({ ...opForm, maxDriverCodCeilingFCFA: parseInt(e.target.value) || 150000 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Génère une alerte critique en cas de dépassement
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Horaires opérationnels (Ouverture - Fermeture)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={opForm.operatingHoursStart}
                      onChange={(e) => setOpForm({ ...opForm, operatingHoursStart: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <span className="text-slate-400">à</span>
                    <input
                      type="time"
                      value={opForm.operatingHoursEnd}
                      onChange={(e) => setOpForm({ ...opForm, operatingHoursEnd: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les paramètres opérationnels</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================= */}
      {/* TAB 5: PAIEMENTS & FINANCES (LeekPay, Binance, USDT)                     */}
      {/* ======================================================================= */}
      {activeTab === "FINANCE" && (
        <form onSubmit={handleSaveFinancial} className="space-y-6 max-w-4xl">
          {/* Base Tariffs & Commission Rules */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Tarification & Règles de Reversement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Définissez les seuils de retrait et taux de commission par défaut pour les marchands.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Frais de Closing par Colis (GNF)
                </label>
                <input
                  type="number"
                  value={finForm.defaultClosingFee}
                  onChange={(e) =>
                    setFinForm({ ...finForm, defaultClosingFee: parseInt(e.target.value) || 800 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Frais de Livraison Standard (GNF)
                </label>
                <input
                  type="number"
                  value={finForm.defaultDeliveryFee}
                  onChange={(e) =>
                    setFinForm({ ...finForm, defaultDeliveryFee: parseInt(e.target.value) || 2000 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Commission Agence par Défaut (%)
                </label>
                <input
                  type="number"
                  value={finForm.defaultCommissionRate}
                  onChange={(e) =>
                    setFinForm({ ...finForm, defaultCommissionRate: parseFloat(e.target.value) || 5 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Seuil Minimal de Retrait Marchand (GNF)
                </label>
                <input
                  type="number"
                  value={finForm.minWithdrawalThreshold}
                  onChange={(e) =>
                    setFinForm({ ...finForm, minWithdrawalThreshold: parseInt(e.target.value) || 10000 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Délai de traitement garanti (heures)
                </label>
                <input
                  type="number"
                  value={finForm.payoutProcessingDelayHours}
                  onChange={(e) =>
                    setFinForm({ ...finForm, payoutProcessingDelayHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways Config */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Passerelles de Paiement Intégrées</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Sécurité Serveur Certifiée
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Les clés secrètes et signatures API sont chiffrées côté serveur et ne sont jamais exposées au client.
              </p>
            </div>

            {/* Gateway 1: LeekPay */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                    LP
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">LeekPay Mobile Money</h4>
                    <p className="text-[11px] text-slate-500">MTN MoMo, Moov Money, Orange Money, Wave</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Actif • Production
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Clé Publique (Live) :</span>
                  <input
                    type="text"
                    value={gatewaysForm.leekpay.publicKeyMasked}
                    disabled
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Statut Webhook :</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold mt-1">
                    <Check className="w-3.5 h-3.5" />
                    Connecté & Vérifié
                  </span>
                </div>
              </div>
            </div>

            {/* Gateway 2: Binance Pay */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    BN
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Binance Pay Merchant</h4>
                    <p className="text-[11px] text-slate-500">Virements crypto instantanés sans frais</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Actif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Merchant ID :</span>
                  <input
                    type="text"
                    value={gatewaysForm.binancePay.merchantIdMasked}
                    disabled
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Devises supportées :</span>
                  <span className="font-bold text-slate-700 mt-1 block">USDT, BUSD, BNB</span>
                </div>
              </div>
            </div>

            {/* Gateway 3: USDT Crypto Direct */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    ₮
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">USDT Stablecoin (On-chain)</h4>
                    <p className="text-[11px] text-slate-500">Reversement direct sur wallet crypto</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Actif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Réseau par défaut configuré :</label>
                  <select
                    value={gatewaysForm.usdtCrypto.defaultNetwork}
                    onChange={(e) =>
                      setGatewaysForm({
                        ...gatewaysForm,
                        usdtCrypto: { ...gatewaysForm.usdtCrypto, defaultNetwork: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                  >
                    <option value="TRC-20 (Tron)">TRC-20 (Tron) • Recommandé (Frais faibles)</option>
                    <option value="BEP-20 (BNB Smart Chain)">BEP-20 (BNB Smart Chain)</option>
                    <option value="ERC-20 (Ethereum)">ERC-20 (Ethereum)</option>
                    <option value="Polygon">Polygon (PoS)</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Adresse de Trésorerie Dépositaire :</span>
                  <input
                    type="text"
                    value={gatewaysForm.usdtCrypto.walletAddressMasked}
                    disabled
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer la configuration financière</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================= */}
      {/* TAB 6: NOTIFICATIONS PREFERENCES                                        */}
      {/* ======================================================================= */}
      {activeTab === "NOTIFICATIONS" && (
        <form onSubmit={handleSaveNotifPref} className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Préférences du Centre d&apos;Alertes</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez les événements qui déclenchent une notification prioritaire pour la direction.
              </p>
            </div>

            {/* Commandes */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                📦 Commandes & Ventes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.orders.newOrder}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        orders: { ...notifPrefForm.orders, newOrder: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Nouvelle commande créée</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.orders.unassignedOrder}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        orders: { ...notifPrefForm.orders, unassignedOrder: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Commande sans closeuse &gt; 15 min</span>
                </label>
              </div>
            </div>

            {/* Livraisons */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                🚚 Livraisons & Flotte
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.deliveries.criticalDelay}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        deliveries: { ...notifPrefForm.deliveries, criticalDelay: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Retard de tournée critique (&gt; 4h)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.deliveries.failedDelivery}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        deliveries: { ...notifPrefForm.deliveries, failedDelivery: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Échec de livraison répété / Client injoignable</span>
                </label>
              </div>
            </div>

            {/* Finances */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                💰 Finances & Trésorerie
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.finances.newPayoutRequest}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        finances: { ...notifPrefForm.finances, newPayoutRequest: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Demande de retrait marchand reçue</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefForm.finances.codDiscrepancy}
                    onChange={(e) =>
                      setNotifPrefForm({
                        ...notifPrefForm,
                        finances: { ...notifPrefForm.finances, codDiscrepancy: e.target.checked },
                      })
                    }
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-800">Écart de caisse COD déclaré vs encaissé</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les préférences</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================= */}
      {/* TAB 7: CONFIGURATION GÉNÉRALE                                           */}
      {/* ======================================================================= */}
      {activeTab === "GENERAL" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Identité & Coordonnées de l&apos;Entreprise</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Renseignements légaux et canaux de communication officiels affichés aux clients.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom de la Plateforme</label>
                <input
                  type="text"
                  value={genForm.platformName}
                  onChange={(e) => setGenForm({ ...genForm, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Raison Sociale Légal</label>
                <input
                  type="text"
                  value={genForm.companyName}
                  onChange={(e) => setGenForm({ ...genForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email de Contact</label>
                <input
                  type="email"
                  value={genForm.supportEmail}
                  onChange={(e) => setGenForm({ ...genForm, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone Principal</label>
                <input
                  type="text"
                  value={genForm.supportPhone}
                  onChange={(e) => setGenForm({ ...genForm, supportPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Officiel</label>
                <input
                  type="text"
                  value={genForm.whatsappContact}
                  onChange={(e) => setGenForm({ ...genForm, whatsappContact: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Devise Principale</label>
                <input
                  type="text"
                  value={genForm.currency}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fuseau Horaire</label>
                <input
                  type="text"
                  value={genForm.timezone}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Format de Date</label>
                <input
                  type="text"
                  value={genForm.dateFormat}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les informations générales</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================= */}
      {/* TAB 8: SÉCURITÉ & SESSIONS                                              */}
      {/* ======================================================================= */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handleSaveSecurity} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Règles de Sécurité & Accès</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Contrôles d&apos;authentification renforcée et politiques d&apos;expiration des sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">2FA Obligatoire pour les Administrateurs</h4>
                  <p className="text-[11px] text-slate-500">Exige un code OTP ou SMS pour tout rôle de gestion</p>
                </div>
                <input
                  type="checkbox"
                  checked={secForm.enforce2FAForAdmins}
                  onChange={(e) => setSecForm({ ...secForm, enforce2FAForAdmins: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Audit exhaustif des actions sensibles</h4>
                  <p className="text-[11px] text-slate-500">Enregistre l&apos;IP, l&apos;empreinte et le diff d&apos;état</p>
                </div>
                <input
                  type="checkbox"
                  checked={secForm.auditAllAdminActions}
                  onChange={(e) => setSecForm({ ...secForm, auditAllAdminActions: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Expiration de session inactive (minutes)
                </label>
                <input
                  type="number"
                  value={secForm.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSecForm({ ...secForm, sessionTimeoutMinutes: parseInt(e.target.value) || 120 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tentatives max avant verrouillage temporaire
                </label>
                <input
                  type="number"
                  value={secForm.maxFailedLoginAttempts}
                  onChange={(e) =>
                    setSecForm({ ...secForm, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les paramètres de sécurité</span>
              </button>
            </div>
          </form>

          {/* Active Sessions List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Sessions Actives Récentes</h3>
            <div className="divide-y divide-slate-100">
              {auditSessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {s.userName} • {s.device} ({s.browser})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        IP: {s.ipAddress} • {s.location} • Connecté à {s.loginAt}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 9: AUDIT LOGS (Historique des modifications)                        */}
      {/* ======================================================================= */}
      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs space-y-4 p-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Traçabilité des Paramètres & Utilisateurs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Journal immuable de toutes les modifications apportées à la gouvernance et aux droits d&apos;accès.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date / Heure</th>
                  <th className="py-3 px-4">Auteur</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Cible / Référence</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Sévérité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settingsAuditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-medium text-[11px]">
                      {l.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {l.actor.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {l.entityReference}
                    </td>
                    <td className="py-3 px-4 text-slate-700 min-w-[240px]">
                      {l.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          l.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : l.severity === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        {l.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: NOUVEL UTILISATEUR                                               */}
      {/* ======================================================================= */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-fade-in-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Créer un Nouvel Utilisateur</h3>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Professionnel *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone / Hub</label>
                  <input
                    type="text"
                    value={newUserForm.zone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rôle Attribué *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="SUPER_ADMIN">🛡️ Super Administrateur</option>
                  <option value="TREASURY_MANAGER">💰 Responsable de Trésorerie</option>
                  <option value="LOGISTICS_MANAGER">🚚 Responsable Logistique</option>
                  <option value="CLOSEUSE">📞 Closeuse Télévente</option>
                  <option value="LIVREUR">🛵 Livreur / Coursier</option>
                  <option value="PARTNER">🏢 E-commerçant / Marchand</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
                <strong>Information :</strong> Le compte sera créé avec le statut actif et un email d&apos;invitation sécurisé sera préparé.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: SUSPENDRE / RÉACTIVER UTILISATEUR                                 */}
      {/* ======================================================================= */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in-up space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-black text-slate-900">
                {suspendModalUser.status === "suspended" ? "Réactiver le compte" : "Suspendre le compte"}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir {suspendModalUser.status === "suspended" ? "réactiver" : "suspendre"} l&apos;accès de{" "}
              <strong>{suspendModalUser.name}</strong> ({suspendModalUser.roleLabel}) ?
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Motif d&apos;audit (obligatoire pour traçabilité)
              </label>
              <textarea
                rows={2}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ex: Écart de caisse récurrent, fin de contrat, demande de l'administrateur..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSuspendModalUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSuspend}
                className={`px-4 py-2 text-white rounded-xl font-bold shadow-xs ${
                  suspendModalUser.status === "suspended"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirmer l&apos;action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CHANGER DE MOT DE PASSE                                          */}
      {/* ======================================================================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Changer de Mot de Passe</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
