"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Receipt,
  Wallet,
  Info,
  X,
  Bot,
  Scale,
  Calendar,
  Filter,
  ArrowUpRight,
  Clock,
  UserCheck,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lock,
  Layers,
  FileText,
  FileCheck2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { GlobalAuditLog, AuditSeverity, AuditResult, AuditModule } from "@/lib/types";
import { formatCFA } from "@/lib/mock-data";

// Type des vues rapides / onglets
type AuditQuickTab = "ALL" | "ANOMALIES" | "SENSITIVE" | "FINANCIAL";

function TresorerieAuditContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const { globalAuditLogs } = useOperations();

  // États des filtres
  const [searchTerm, setSearchTerm] = useState(initialRef);
  const [activeTab, setActiveTab] = useState<AuditQuickTab>("ALL");
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedActor, setSelectedActor] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedResult, setSelectedResult] = useState<string>("ALL");

  // Modal de détail
  const [selectedEvent, setSelectedEvent] = useState<GlobalAuditLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Liste des acteurs uniques pour filtre
  const uniqueActors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    globalAuditLogs.forEach((log) => {
      if (log.actor && log.actor.name) {
        map.set(log.actor.name, {
          id: log.actor.id,
          name: log.actor.name,
          role: log.actor.role,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [globalAuditLogs]);

  // Liste des rôles uniques
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    globalAuditLogs.forEach((l) => {
      if (l.actor?.role) roles.add(l.actor.role);
    });
    return Array.from(roles).sort();
  }, [globalAuditLogs]);

  // Détection des anomalies
  const isAnomaly = (log: GlobalAuditLog) => {
    return (
      log.result === "BLOCKED" ||
      log.result === "FAILED" ||
      log.severity === "CRITICAL" ||
      log.action.includes("DISCREPANCY") ||
      log.action.includes("REJECT") ||
      log.description.toLowerCase().includes("écart") ||
      log.description.toLowerCase().includes("bloqué") ||
      log.description.toLowerCase().includes("manquant") ||
      log.description.toLowerCase().includes("anomalie")
    );
  };

  // Détection des actions sensibles
  const isSensitiveAction = (log: GlobalAuditLog) => {
    return (
      log.isSensitive === true ||
      log.severity === "CRITICAL" ||
      log.action.includes("BLOCK") ||
      log.action.includes("REJECT") ||
      log.action.includes("SUSPEND") ||
      log.action.includes("PERMISSION") ||
      log.action.includes("SETTING") ||
      log.action.includes("WITHDRAWAL_APPROVED") ||
      log.action.includes("WITHDRAWAL_PAID") ||
      log.action.includes("JUSTIFIED")
    );
  };

  // Détection des opérations financières
  const isFinancialAction = (log: GlobalAuditLog) => {
    return (
      (log.amount !== undefined && log.amount > 0) ||
      log.module === "TRESORERIE" ||
      log.module === "FINANCES" ||
      Boolean(log.financeTxRef) ||
      Boolean(log.payoutId) ||
      Boolean(log.remittanceId) ||
      log.action.includes("REMITTANCE") ||
      log.action.includes("WITHDRAWAL") ||
      log.action.includes("COMMISSION") ||
      log.action.includes("RECONCILIATION") ||
      log.action.includes("ENCAISSEMENT")
    );
  };

  // Calcul des 5 KPI Cards
  const kpis = useMemo(() => {
    const now = new Date();
    const todayIsoPrefix = "2026-09-04"; // Synchronisé avec le calendrier de démo

    const activitiesToday = globalAuditLogs.filter(
      (l) => l.isoDate?.startsWith(todayIsoPrefix) || l.timestamp.includes("04 sept. 2026")
    ).length;

    const financialOps = globalAuditLogs.filter(isFinancialAction).length;
    const anomaliesCount = globalAuditLogs.filter(isAnomaly).length;
    const sensitiveCount = globalAuditLogs.filter(isSensitiveAction).length;

    // Utilisateurs actifs uniques
    const activeActorsSet = new Set<string>();
    globalAuditLogs.forEach((l) => {
      if (l.actor?.name) activeActorsSet.add(l.actor.name);
    });

    return {
      activitiesToday,
      financialOps,
      anomaliesCount,
      sensitiveCount,
      activeUsersCount: activeActorsSet.size,
    };
  }, [globalAuditLogs]);

  // Filtrage principal
  const filteredLogs = useMemo(() => {
    return globalAuditLogs.filter((log) => {
      // 1. Recherche textuelle
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          log.id.toLowerCase().includes(q) ||
          log.actor?.name.toLowerCase().includes(q) ||
          log.actor?.role.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.actionLabel.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.entityReference.toLowerCase().includes(q) ||
          (log.financeTxRef && log.financeTxRef.toLowerCase().includes(q)) ||
          (log.partnerName && log.partnerName.toLowerCase().includes(q)) ||
          (log.payoutId && log.payoutId.toLowerCase().includes(q)) ||
          (log.remittanceId && log.remittanceId.toLowerCase().includes(q)) ||
          (log.orderId && log.orderId.toLowerCase().includes(q)) ||
          (log.reason && log.reason.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Onglet rapide
      if (activeTab === "ANOMALIES" && !isAnomaly(log)) return false;
      if (activeTab === "SENSITIVE" && !isSensitiveAction(log)) return false;
      if (activeTab === "FINANCIAL" && !isFinancialAction(log)) return false;

      // 3. Période
      if (periodFilter !== "ALL") {
        const now = new Date();
        const todayIso = now.toISOString().slice(0, 10);
        // date de référence mock alignée sur les données de démo
        const mockAnchorDates = ["2026-09-06", "2026-09-05", "2026-09-04", "2026-09-03"];

        const getLogDate = (): Date | null => {
          if (log.isoDate) {
            const d = new Date(log.isoDate);
            if (!isNaN(d.getTime())) return d;
          }
          return null;
        };

        if (periodFilter === "TODAY") {
          const isToday = log.isoDate?.startsWith(todayIso) || mockAnchorDates.some(d => log.isoDate?.startsWith(d)) || log.timestamp.includes("04 sept. 2026") || log.timestamp.includes("05 sept. 2026") || log.timestamp.includes("06 sept. 2026");
          if (!isToday) return false;
        } else if (periodFilter === "7D") {
          const logDate = getLogDate();
          if (logDate) {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (logDate < sevenDaysAgo) return false;
          }
        } else if (periodFilter === "30D") {
          const logDate = getLogDate();
          if (logDate) {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (logDate < thirtyDaysAgo) return false;
          }
        }
      }

      // 4. Module
      if (selectedModule !== "ALL" && log.module !== selectedModule) return false;

      // 5. Acteur
      if (selectedActor !== "ALL" && log.actor?.name !== selectedActor) return false;

      // 6. Rôle
      if (selectedRole !== "ALL" && log.actor?.role !== selectedRole) return false;

      // 7. Sévérité
      if (selectedSeverity !== "ALL" && log.severity !== selectedSeverity) return false;

      // 8. Résultat
      if (selectedResult !== "ALL" && log.result !== selectedResult) return false;

      return true;
    });
  }, [
    globalAuditLogs,
    searchTerm,
    activeTab,
    periodFilter,
    selectedModule,
    selectedActor,
    selectedRole,
    selectedSeverity,
    selectedResult,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setActiveTab("ALL");
    setPeriodFilter("ALL");
    setSelectedModule("ALL");
    setSelectedActor("ALL");
    setSelectedRole("ALL");
    setSelectedSeverity("ALL");
    setSelectedResult("ALL");
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Date",
      "Heure",
      "Horodatage_Complet",
      "Utilisateur",
      "Role",
      "Module",
      "Action_Code",
      "Action_Libelle",
      "Reference_Entite",
      "Montant_FCFA",
      "Statut_Resultat",
      "Niveau_Severite",
      "Sensible",
      "Justification_Motif",
      "Ref_Comptable",
      "Adresse_IP",
      "Description"
    ];

    const rows = filteredLogs.map((l) => {
      const parts = l.timestamp.split("—");
      const datePart = parts[0]?.trim() || "";
      const timePart = parts[1]?.trim() || "";

      return [
        l.id,
        `"${datePart}"`,
        `"${timePart}"`,
        `"${l.timestamp}"`,
        `"${l.actor?.name || ""}"`,
        `"${l.actor?.role || ""}"`,
        l.module,
        `"${l.action}"`,
        `"${l.actionLabel}"`,
        `"${l.entityReference}"`,
        l.amount !== undefined ? l.amount : "",
        l.result,
        l.severity,
        l.isSensitive ? "OUI" : "NON",
        `"${(l.reason || "").replace(/"/g, '""')}"`,
        `"${l.financeTxRef || ""}"`,
        `"${l.ipAddress || ""}"`,
        `"${l.description.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_financier_eno_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Badges UI
  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px]">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Critique
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold text-[10px]">
            <Info className="w-3 h-3 text-slate-400" />
            Info
          </span>
        );
    }
  };

  const getResultBadge = (result: AuditResult) => {
    switch (result) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Succès
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px]">
            <XCircle className="w-3 h-3 text-rose-600" />
            Échec
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-black text-[10px]">
            <Lock className="w-3 h-3 text-purple-600" />
            Bloqué
          </span>
        );
    }
  };

  const getModuleBadge = (module: AuditModule | string) => {
    switch (module) {
      case "TRESORERIE":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
            Trésorerie
          </span>
        );
      case "FINANCES":
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
            Finances
          </span>
        );
      case "ECOMMERCE":
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
            Marchands
          </span>
        );
      case "LIVREURS":
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
            Livreurs
          </span>
        );
      case "COMMANDES":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
            Commandes
          </span>
        );
      case "AUTH":
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px]">
            Sécurité
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
            {module}
          </span>
        );
    }
  };

  // Déterminer le lien croisé d'une entité
  const getEntityLink = (log: GlobalAuditLog) => {
    if (log.remittanceId || log.entityReference?.startsWith("RM-") || log.entityType === "REMITTANCE") {
      const id = log.remittanceId || log.entityId || "rem-101";
      return {
        href: `/tresorerie/remises/${id}`,
        label: "Voir la remise physique",
        category: "Remise Livreur",
      };
    }
    if (log.payoutId || log.entityReference?.startsWith("WD-") || log.entityType === "PAYOUT") {
      return {
        href: `/tresorerie/retraits`,
        label: "Voir Retraits & Virements",
        category: "Retrait E-commerçant",
      };
    }
    if (log.orderId || log.entityReference?.startsWith("CMD-") || log.entityType === "ORDER") {
      return {
        href: `/admin/commandes`,
        label: "Voir la commande client",
        category: "Commande COD",
      };
    }
    if (log.partnerId || log.entityType === "PARTNER") {
      return {
        href: `/tresorerie/ecommercants`,
        label: "Voir Solde Marchand",
        category: "E-commerçant",
      };
    }
    if (log.financeTxRef || log.entityType === "TRANSACTION" || log.entityType === "FINANCE") {
      return {
        href: `/tresorerie/grand-livre`,
        label: "Consulter au Grand Livre",
        category: "Écriture Comptable",
      };
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER EXÉCUTIF — STYLE TRÉSORERIE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black tracking-wide uppercase flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-purple-600" />
              Piste d&apos;Audit Inaltérable
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              Immutabilité garantie
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Audit Financier &amp; Traçabilité des Opérations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            Registre complet et inaltérable des mouvements financiers d&apos;GuinéeGo LAT : de l&apos;encaissement COD à la remise livreur, des commissions aux soldes marchands, jusqu&apos;au virement bancaire final.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-purple-300" />
            <span>Exporter l&apos;Audit CSV</span>
          </button>
        </div>
      </div>

      {/* 2. LES 5 CARTES KPI PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1 : Activités aujourd'hui */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Activités aujourd&apos;hui</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{kpis.activitiesToday}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Événements tracés le 04/09</p>
          </div>
        </div>

        {/* KPI 2 : Opérations financières */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Opérations financières</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{kpis.financialOps}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mouvements avec flux monétaire</p>
          </div>
        </div>

        {/* KPI 3 : Anomalies */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Anomalies &amp; Écarts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600">{kpis.anomaliesCount}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Échecs, rejets ou blocages</p>
          </div>
        </div>

        {/* KPI 4 : Actions sensibles */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions sensibles</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{kpis.sensitiveCount}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Approbations, blocages &amp; configs</p>
          </div>
        </div>

        {/* KPI 5 : Utilisateurs actifs */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Utilisateurs actifs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{kpis.activeUsersCount}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Acteurs distincts enregistrés</p>
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS RAPIDES & FILTRES COMBINÉS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        {/* Onglets rapides */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("ALL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tous les événements ({globalAuditLogs.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("FINANCIAL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "FINANCIAL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Opérations financières ({kpis.financialOps})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("ANOMALIES");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ANOMALIES"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Anomalies &amp; Écarts ({kpis.anomaliesCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("SENSITIVE");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "SENSITIVE"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Actions sensibles ({kpis.sensitiveCount})</span>
            </button>
          </div>

          {/* Reset Filters button */}
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>

        {/* Inputs de filtres avancés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Recherche */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Réf, acteur, motif, montant..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
            />
          </div>

          {/* Filtre Période */}
          <div>
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Toutes dates</option>
              <option value="TODAY">Aujourd&apos;hui (04 sept.)</option>
              <option value="7D">Derniers 7 jours</option>
              <option value="30D">Derniers 30 jours</option>
            </select>
          </div>

          {/* Filtre Module */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Tous modules</option>
              <option value="TRESORERIE">Trésorerie</option>
              <option value="FINANCES">Finances</option>
              <option value="ECOMMERCE">Marchands</option>
              <option value="LIVREURS">Livreurs</option>
              <option value="COMMANDES">Commandes</option>
              <option value="AUTH">Sécurité / Auth</option>
              <option value="AUTOMATISATION">Système Auto</option>
              <option value="PARAMETRES">Paramètres</option>
            </select>
          </div>

          {/* Filtre Utilisateur / Acteur */}
          <div>
            <select
              value={selectedActor}
              onChange={(e) => {
                setSelectedActor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 truncate"
            >
              <option value="ALL">Tous acteurs</option>
              {uniqueActors.map((actor) => (
                <option key={actor.id} value={actor.name}>
                  {actor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Rôle */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 truncate"
            >
              <option value="ALL">Tous rôles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut / Résultat */}
          <div>
            <select
              value={selectedResult}
              onChange={(e) => {
                setSelectedResult(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Tous statuts</option>
              <option value="SUCCESS">Succès</option>
              <option value="FAILED">Échec</option>
              <option value="BLOCKED">Bloqué</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Affichage de <strong className="text-slate-900 font-bold">{paginatedLogs.length}</strong> sur <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> événement(s) filtré(s)
          </span>
          <span className="font-medium text-slate-400">
            Journal immuable — Conforme aux exigences d&apos;audit financier
          </span>
        </div>
      </div>

      {/* 4. TABLEAU DU JOURNAL D'AUDIT (DESKTOP) & CARTES (MOBILE) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4 rounded-l-2xl">Date &amp; Heure</th>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right rounded-r-2xl">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const parts = log.timestamp.split("—");
                  const dateStr = parts[0]?.trim();
                  const timeStr = parts[1]?.trim();

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Date & Heure */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-slate-900">{dateStr}</div>
                        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeStr}</span>
                        </div>
                      </td>

                      {/* Utilisateur */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              log.actor?.type === "SYSTEM"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-900 text-white"
                            }`}
                          >
                            {log.actor?.type === "SYSTEM" ? (
                              <Bot className="w-3.5 h-3.5" />
                            ) : (
                              log.actor?.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-slate-900 leading-tight">
                            {log.actor?.name}
                          </span>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                          {log.actor?.role}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4">{getModuleBadge(log.module)}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-[11px] truncate">
                            {log.actionLabel}
                          </p>
                          {log.isSensitive && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" title="Action sensible" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {log.description}
                        </p>
                      </td>

                      {/* Référence */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[11px] text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded inline-block">
                          {log.entityReference}
                        </span>
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {log.amount !== undefined && log.amount > 0 ? (
                          <span className="font-mono font-black text-[11px] text-slate-900">
                            {formatCFA(log.amount)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Statut & Sévérité */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          {getResultBadge(log.result)}
                          {log.severity !== "INFO" && getSeverityBadge(log.severity)}
                        </div>
                      </td>

                      {/* Action Voir */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(log);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Détail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 text-xs">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-600">Aucun log d&apos;audit trouvé</p>
                      <p className="text-slate-400 text-[11px]">
                        Aucun enregistrement ne correspond aux filtres actuels. Essayez de réinitialiser la recherche.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Cards View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => {
              const parts = log.timestamp.split("—");
              const dateStr = parts[0]?.trim();
              const timeStr = parts[1]?.trim();

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedEvent(log)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {/* Top line: Actor & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          log.actor?.type === "SYSTEM"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {log.actor?.type === "SYSTEM" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          log.actor?.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs leading-tight">{log.actor?.name}</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{log.actor?.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {getResultBadge(log.result)}
                    </div>
                  </div>

                  {/* Action & description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{log.actionLabel}</h4>
                      {log.amount !== undefined && log.amount > 0 && (
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatCFA(log.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {log.description}
                    </p>
                  </div>

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      {getModuleBadge(log.module)}
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {log.entityReference}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-slate-400">{timeStr || dateStr}</span>
                      <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-0.5">
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Voir</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs px-4">
              Aucun événement ne correspond aux critères sélectionnés.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Page <strong className="text-slate-900">{currentPage}</strong> sur <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL / DRAWER DE DÉTAIL COMPLET AVEC AVANT / APRÈS & CORRÉLATION */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-6 animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">Détail du Log d&apos;Audit</h3>
                    {selectedEvent.isSensitive && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-black uppercase">
                        Sensible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedEvent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenu structuré en 5 sections */}
            <div className="space-y-5 text-xs">
              {/* SECTION A : Informations Générales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date &amp; Heure</span>
                  <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">{selectedEvent.timestamp}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Module</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedEvent.module}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Résultat</span>
                  <div className="mt-0.5">{getResultBadge(selectedEvent.result)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sévérité</span>
                  <div className="mt-0.5">{getSeverityBadge(selectedEvent.severity)}</div>
                </div>
              </div>

              {/* SECTION B : Acteur & Références Techniques */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auteur de l&apos;action</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {selectedEvent.actor?.type === "SYSTEM" ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        selectedEvent.actor?.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{selectedEvent.actor?.name}</p>
                      <p className="text-[11px] text-slate-500">{selectedEvent.actor?.role}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-3">
                    {selectedEvent.ipAddress && <span>IP : {selectedEvent.ipAddress}</span>}
                    {selectedEvent.sessionId && <span>Session : {selectedEvent.sessionId}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION C : Objet Concerné & Lien Métier Croisé */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Objet concerné &amp; Navigation croisée</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {selectedEvent.entityReference}
                      </span>
                      <span className="text-slate-500 font-medium text-xs">
                        (Type : {selectedEvent.entityType})
                      </span>
                    </div>
                    {selectedEvent.financeTxRef && (
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Écriture Grand Livre : <strong>{selectedEvent.financeTxRef}</strong>
                      </p>
                    )}
                  </div>

                  {/* Bouton de redirection contextuelle */}
                  {(() => {
                    const linkInfo = getEntityLink(selectedEvent);
                    if (!linkInfo) return null;
                    return (
                      <Link
                        href={linkInfo.href}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <span>{linkInfo.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION D : Impact Financier (Montant & Sens du flux) */}
              {selectedEvent.amount !== undefined && selectedEvent.amount > 0 && (
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" />
                    Impact Financier Direct
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-emerald-900 font-mono">
                      {formatCFA(selectedEvent.amount)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800">
                      Flux monétaire certifié
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION E : Description & Motif / Justification */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Action &amp; Description</span>
                <p className="font-black text-slate-900 text-sm">{selectedEvent.actionLabel}</p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium text-xs">
                  {selectedEvent.description}
                </div>
              </div>

              {/* Justification explicite (Motif d'écart, refus, blocage) */}
              {selectedEvent.reason && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Motif / Justification Renseignée
                  </span>
                  <p className="text-amber-900 font-semibold text-xs leading-relaxed">
                    {selectedEvent.reason}
                  </p>
                </div>
              )}

              {/* SECTION F : VUE AVANT / APRÈS (State Diff) */}
              {(selectedEvent.beforeState || selectedEvent.afterState) && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    Comparaison Avant / Après (State Diff)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* État Avant */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>État Avant :</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 overflow-x-auto">
                        {typeof selectedEvent.beforeState === "object"
                          ? JSON.stringify(selectedEvent.beforeState, null, 2)
                          : String(selectedEvent.beforeState || "Non renseigné")}
                      </div>
                    </div>

                    {/* État Après */}
                    <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-purple-800 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span>État Après :</span>
                      </div>
                      <div className="font-mono text-[10px] text-purple-950 bg-white p-2.5 rounded-xl border border-purple-200/80 overflow-x-auto">
                        {typeof selectedEvent.afterState === "object"
                          ? JSON.stringify(selectedEvent.afterState, null, 2)
                          : String(selectedEvent.afterState || "Non renseigné")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION G : Corrélation de la Chaîne Financière */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  Corrélation de la Chaîne Financière GuinéeGo
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 pt-1">
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
                    Encaissement COD
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
                    Remise Livreur
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
                    Commissions GuinéeGo
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
                    Solde Marchand
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
                    Retrait &amp; Virement
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Log immuable &bull; SHA-256 certifié
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
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

export default function TresorerieAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          Chargement du journal d&apos;audit financier...
        </div>
      }
    >
      <TresorerieAuditContent />
    </Suspense>
  );
}
