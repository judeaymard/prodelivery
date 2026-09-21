"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Calendar,
  Eye,
  ArrowRight,
  RefreshCw,
  Globe,
  Laptop,
  Smartphone,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileCode,
  FileSpreadsheet,
  Lock,
  Activity,
  Zap,
  Info,
  BadgeAlert,
  Hash,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { formatCFA } from "@/lib/mock-data";
import {
  GlobalAuditLog,
  AuditSessionLog,
  AuditModule,
  AuditSeverity,
  AuditResult,
  AuditActorType,
} from "@/lib/types";

export default function GlobalAuditPage() {
  const { globalAuditLogs, auditSessions } = useOperations();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"LOGS" | "TIMELINE" | "SESSIONS">("LOGS");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedActorType, setSelectedActorType] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedResult, setSelectedResult] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"TODAY" | "24H" | "7D" | "30D" | "ALL">("TODAY");
  const [quickFilter, setQuickFilter] = useState<"ALL" | "ANOMALIES" | "SENSITIVE" | "AUTOMATIONS" | "FAILURES" | "USERS">("ALL");
  const [entityFilter, setEntityFilter] = useState<string | null>(null);

  // Selected event for detail drawer
  const [selectedEvent, setSelectedEvent] = useState<GlobalAuditLog | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Anomaly detector helper
  const isAnomalyLog = (log: GlobalAuditLog) => {
    return (
      log.result === "BLOCKED" ||
      log.result === "FAILED" ||
      log.severity === "CRITICAL" ||
      log.action === "DISCREPANCY_FLAGGED" ||
      log.action === "CAPACITY_UPDATED" ||
      log.action.includes("DISCREPANCY") ||
      log.action.includes("BLOCKED") ||
      log.action.includes("FAIL") ||
      log.description.toLowerCase().includes("écart") ||
      log.description.toLowerCase().includes("bloqué") ||
      log.description.toLowerCase().includes("non autorisé") ||
      log.description.toLowerCase().includes("tentative")
    );
  };

  // Filter Reset Handlers
  const handleInspectAnomalies = () => {
    setSearchTerm("");
    setSelectedModule("ALL");
    setSelectedActorType("ALL");
    setSelectedSeverity("ALL");
    setSelectedResult("ALL");
    setEntityFilter(null);
    setTimeRange("ALL");
    setQuickFilter("ANOMALIES");
    setActiveTab("LOGS");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedModule("ALL");
    setSelectedActorType("ALL");
    setSelectedSeverity("ALL");
    setSelectedResult("ALL");
    setEntityFilter(null);
    setTimeRange("ALL");
    setQuickFilter("ALL");
    setActiveTab("LOGS");
  };

  // Executive KPIs calculation
  const totalActionsToday = useMemo(() => {
    return globalAuditLogs.length;
  }, [globalAuditLogs]);

  const activeUsersCount = useMemo(() => {
    return auditSessions.filter((s) => s.status === "ACTIVE").length;
  }, [auditSessions]);

  const sensitiveActionsCount = useMemo(() => {
    return globalAuditLogs.filter((l) => l.isSensitive || l.severity === "CRITICAL").length;
  }, [globalAuditLogs]);

  const autoEventsCount = useMemo(() => {
    return globalAuditLogs.filter((l) => l.actor.type === "SYSTEM").length;
  }, [globalAuditLogs]);

  const anomaliesCount = useMemo(() => {
    return globalAuditLogs.filter(isAnomalyLog).length;
  }, [globalAuditLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return globalAuditLogs.filter((log) => {
      // 1. Entity Filter
      if (entityFilter && log.entityReference !== entityFilter && log.entityId !== entityFilter) {
        return false;
      }

      // 2. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          log.actor.name.toLowerCase().includes(q) ||
          log.actor.role.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.actionLabel.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.entityReference.toLowerCase().includes(q) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      // 3. Quick Filters
      if (quickFilter === "ANOMALIES" && !isAnomalyLog(log)) return false;
      if (quickFilter === "SENSITIVE" && !log.isSensitive && log.severity !== "CRITICAL") return false;
      if (quickFilter === "AUTOMATIONS" && log.actor.type !== "SYSTEM") return false;
      if (quickFilter === "FAILURES" && log.result === "SUCCESS" && log.severity !== "CRITICAL") return false;
      if (quickFilter === "USERS" && log.actor.type !== "USER") return false;

      // 4. Dropdowns
      if (selectedModule !== "ALL" && log.module !== selectedModule) return false;
      if (selectedActorType !== "ALL" && log.actor.type !== selectedActorType) return false;
      if (selectedSeverity !== "ALL" && log.severity !== selectedSeverity) return false;
      if (selectedResult !== "ALL" && log.result !== selectedResult) return false;

      return true;
    });
  }, [
    globalAuditLogs,
    entityFilter,
    searchTerm,
    quickFilter,
    selectedModule,
    selectedActorType,
    selectedSeverity,
    selectedResult,
  ]);

  // Export handlers
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eno-audit-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportModal(false);
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Date",
      "Acteur",
      "Role",
      "Type",
      "Action",
      "Module",
      "Entité",
      "Resultat",
      "Severite",
      "Description",
      "IP",
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actor.name}"`,
      `"${l.actor.role}"`,
      l.actor.type,
      `"${l.actionLabel}"`,
      l.module,
      `"${l.entityReference}"`,
      l.result,
      l.severity,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ipAddress || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eno-audit-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShowExportModal(false);
  };

  // Badge helpers
  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Critique
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Attention
          </span>
        );
      case "INFO":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
            <Info className="w-3 h-3 text-slate-500" />
            Normal
          </span>
        );
    }
  };

  const getResultBadge = (result: AuditResult) => {
    switch (result) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Succès
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">
            <XCircle className="w-3 h-3 text-rose-600" />
            Échec
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-black text-[10px]">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            Bloqué
          </span>
        );
    }
  };

  const getModuleBadgeColor = (mod: AuditModule) => {
    switch (mod) {
      case "COMMANDES":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CLOSEUSES":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "LIVREURS":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ECOMMERCE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "TRESORERIE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FINANCES":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "AUTOMATISATION":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "AUTH":
        return "bg-slate-900 text-white border-slate-900";
      case "PARAMETRES":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "UTILISATEURS":
        return "bg-violet-50 text-violet-700 border-violet-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER EXECUTIVE AUDIT */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Gouvernance &amp; Sécurité — Supervision PDG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Journal d&apos;Audit Global</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                Actif &amp; Inaltérable
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Traçabilité exhaustive et temps réel de toutes les actions : commandes, attributions automatiques, mouvements financiers, modifications de paramètres et alertes de sécurité.
            </p>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exporter le registre</span>
          </button>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <ShieldAlert className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 2. 5 EXECUTIVE KPIS (INTERACTIVE) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Actions aujourd'hui */}
        <div
          onClick={handleResetFilters}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all col-span-2 sm:col-span-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">Actions aujourd&apos;hui</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {totalActionsToday.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
            <span>Journal système en temps réel</span>
          </div>
        </div>

        {/* KPI 2: Utilisateurs actifs */}
        <div
          onClick={() => setActiveTab("SESSIONS")}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">Utilisateurs actifs</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {activeUsersCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Opérateurs &amp; Marchands
          </div>
        </div>

        {/* KPI 3: Actions sensibles */}
        <div
          onClick={() => {
            setSearchTerm("");
            setSelectedModule("ALL");
            setSelectedActorType("ALL");
            setSelectedSeverity("ALL");
            setSelectedResult("ALL");
            setEntityFilter(null);
            setQuickFilter("SENSITIVE");
            setActiveTab("LOGS");
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors">Actions sensibles</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 tracking-tight">
            {sensitiveActionsCount}
          </div>
          <div className="text-[11px] font-medium text-amber-600 mt-1">
            Finances &amp; Paramètres
          </div>
        </div>

        {/* KPI 4: Actions automatiques */}
        <div
          onClick={() => {
            setSearchTerm("");
            setSelectedModule("ALL");
            setSelectedActorType("ALL");
            setSelectedSeverity("ALL");
            setSelectedResult("ALL");
            setEntityFilter(null);
            setQuickFilter("AUTOMATIONS");
            setActiveTab("LOGS");
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">Événements automatiques</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 tracking-tight">
            {autoEventsCount}
          </div>
          <div className="text-[11px] font-medium text-indigo-500 mt-1">
            Smart Assign &amp; Alertes
          </div>
        </div>

        {/* KPI 5: Anomalies */}
        <div
          onClick={handleInspectAnomalies}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-600 transition-colors">Anomalies &amp; Écarts</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 tracking-tight">
            {anomaliesCount}
          </div>
          <div className="text-[11px] font-medium text-rose-500 mt-1">
            Bloqués ou Écarts
          </div>
        </div>
      </div>

      {/* 3. ZONE D'ATTENTION & SIGNAUX D'AUDIT */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
            <BadgeAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Activité nécessitant votre attention (Supervision PDG)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {anomaliesCount > 0
                ? `${anomaliesCount} événement(s) suspect(s) et ${sensitiveActionsCount} action(s) sensible(s) répertoriés dans les registres d'audit.`
                : "Aucune anomalie suspecte détectée. Tous les journaux d'audit sont conformes."}
            </p>
          </div>
        </div>

        <button
          onClick={handleInspectAnomalies}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-xs hover:shadow active:scale-95 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Examiner les anomalies ({anomaliesCount})</span>
        </button>
      </div>

      {/* 4. MAIN AUDIT WORKSPACE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Subtabs */}
        <div className="px-6 pt-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("LOGS")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "LOGS"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Journal Global ({filteredLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "TIMELINE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chronologie Visuelle</span>
            </button>

            <button
              onClick={() => setActiveTab("SESSIONS")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "SESSIONS"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Sessions &amp; Connexions ({auditSessions.length})</span>
            </button>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 sm:pb-0">
            <button
              onClick={handleResetFilters}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                quickFilter === "ALL" && !entityFilter
                  ? "bg-slate-200 text-slate-900 font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tous
            </button>
            <button
              onClick={handleInspectAnomalies}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                quickFilter === "ANOMALIES"
                  ? "bg-rose-500 text-white font-bold shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Anomalies ({anomaliesCount})</span>
            </button>
            <button
              onClick={() => {
                setQuickFilter("SENSITIVE");
                setEntityFilter(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                quickFilter === "SENSITIVE"
                  ? "bg-amber-100 text-amber-900 font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⚡ Sensibles
            </button>
            <button
              onClick={() => {
                setQuickFilter("AUTOMATIONS");
                setEntityFilter(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                quickFilter === "AUTOMATIONS"
                  ? "bg-indigo-100 text-indigo-900 font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              🤖 Automatisations
            </button>
            <button
              onClick={() => {
                setQuickFilter("FAILURES");
                setEntityFilter(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                quickFilter === "FAILURES"
                  ? "bg-rose-100 text-rose-900 font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              ❌ Échecs &amp; Bloqués
            </button>
          </div>
        </div>

        {/* Entity filter indicator */}
        {entityFilter && (
          <div className="px-6 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs">
            <span className="text-blue-900 font-medium flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Filtrage actif sur l&apos;objet : <strong>{entityFilter}</strong>
            </span>
            <button
              onClick={() => setEntityFilter(null)}
              className="text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Effacer le filtre objet</span>
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/40 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher utilisateur, commande, action, IP..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            {/* Module Select */}
            <div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Tous les modules</option>
                <option value="COMMANDES">Commandes</option>
                <option value="CLOSEUSES">Closeuses</option>
                <option value="LIVREURS">Livreurs</option>
                <option value="ECOMMERCE">E-commerçants</option>
                <option value="TRESORERIE">Trésorerie</option>
                <option value="FINANCES">Finances</option>
                <option value="AUTOMATISATION">Automatisation</option>
                <option value="AUTH">Authentification &amp; Sécurité</option>
                <option value="PARAMETRES">Paramètres</option>
                <option value="UTILISATEURS">Gestion Utilisateurs</option>
              </select>
            </div>

            {/* Source Select */}
            <div>
              <select
                value={selectedActorType}
                onChange={(e) => setSelectedActorType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="USER">👤 Utilisateurs humains</option>
                <option value="SYSTEM">🤖 Système / Algorithmes</option>
              </select>
            </div>

            {/* Sévérité Select */}
            <div>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Toutes sévérités</option>
                <option value="INFO">Normal (Info)</option>
                <option value="WARNING">Attention (Warning)</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>
          </div>
        </div>

        {/* TAB 1: LOGS TABLE */}
        {activeTab === "LOGS" && (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Date / Heure</th>
                    <th className="py-3 px-4">Utilisateur / Source</th>
                    <th className="py-3 px-4">Action &amp; Module</th>
                    <th className="py-3 px-4">Objet concerné</th>
                    <th className="py-3 px-4 text-center">Résultat</th>
                    <th className="py-3 px-4 text-center">Niveau</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Date / Heure */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap text-[11px]">
                        {log.timestamp}
                      </td>

                      {/* Utilisateur / Source */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              log.actor.type === "SYSTEM"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-900 text-white"
                            }`}
                          >
                            {log.actor.type === "SYSTEM" ? (
                              <Bot className="w-3.5 h-3.5" />
                            ) : (
                              log.actor.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{log.actor.name}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">{log.actor.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Action & Module */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{log.actionLabel}</p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getModuleBadgeColor(
                              log.module
                            )}`}
                          >
                            {log.module}
                          </span>
                        </div>
                      </td>

                      {/* Objet concerné */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntityFilter(log.entityReference);
                          }}
                          className="font-mono font-bold text-xs text-slate-800 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                          title="Filtrer uniquement cet objet"
                        >
                          {log.entityReference}
                        </button>
                      </td>

                      {/* Résultat */}
                      <td className="py-3.5 px-4 text-center">{getResultBadge(log.result)}</td>

                      {/* Niveau */}
                      <td className="py-3.5 px-4 text-center">{getSeverityBadge(log.severity)}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-semibold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedEvent(log)}
                  className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">{log.timestamp}</span>
                    <div className="flex items-center gap-1.5">
                      {getResultBadge(log.result)}
                      {getSeverityBadge(log.severity)}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        log.actor.type === "SYSTEM"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {log.actor.type === "SYSTEM" ? <Bot className="w-3.5 h-3.5" /> : log.actor.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900">{log.actionLabel}</p>
                      <p className="text-[11px] text-slate-600">
                        {log.actor.name} ({log.actor.role})
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">Objet : {log.entityReference}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <ShieldAlert className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Aucun événement d&apos;audit ne correspond aux critères</p>
                <p className="text-xs text-slate-500">Essayez de réinitialiser la recherche ou de modifier les filtres.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Réinitialiser tous les filtres</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VISUAL TIMELINE */}
        {activeTab === "TIMELINE" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
              {filteredLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      log.severity === "CRITICAL"
                        ? "bg-rose-500"
                        : log.severity === "WARNING"
                        ? "bg-amber-500"
                        : "bg-slate-900"
                    }`}
                  />

                  {/* Event content card */}
                  <div
                    onClick={() => setSelectedEvent(log)}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{log.timestamp}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getModuleBadgeColor(
                            log.module
                          )}`}
                        >
                          {log.module}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getResultBadge(log.result)}
                        {getSeverityBadge(log.severity)}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {log.actor.type === "SYSTEM" ? <Bot className="w-3.5 h-3.5" /> : log.actor.name.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-slate-900">
                          {log.actor.name} ({log.actor.role}) — {log.actionLabel}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
                        {log.reason && (
                          <p className="text-[11px] text-indigo-700 font-medium bg-indigo-50/60 p-2 rounded-xl mt-2">
                            💡 <strong>Raison :</strong> {log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SESSIONS & AUTH */}
        {activeTab === "SESSIONS" && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sessions Actives &amp; Événements de Connexion</h3>
              <p className="text-xs text-slate-500">
                Surveillance de l&apos;intégrité des accès, géolocalisation des connexions et détection des tentatives suspectes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Utilisateur</th>
                    <th className="py-3 px-4">Appareil &amp; Navigateur</th>
                    <th className="py-3 px-4">Adresse IP</th>
                    <th className="py-3 px-4">Localisation</th>
                    <th className="py-3 px-4">Connexion</th>
                    <th className="py-3 px-4">Dernière activité</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Statut Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>
                          <p>{sess.userName}</p>
                          <p className="text-[10px] text-slate-400">{sess.userRole}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          {sess.device.includes("Apple") || sess.device.includes("ThinkPad") || sess.device.includes("Dell") ? (
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>
                            {sess.device} • {sess.browser}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{sess.ipAddress}</td>
                      <td className="py-3.5 px-4 text-slate-600">{sess.location}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">{sess.loginAt}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">{sess.lastActiveAt}</td>
                      <td className="py-3.5 px-4 text-right">
                        {sess.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Session Active
                          </span>
                        )}
                        {sess.status === "FAILED_ATTEMPT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black text-[10px] border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Échec / Suspect
                          </span>
                        )}
                        {sess.status === "EXPIRED" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                            Expirée
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. DRAWER D'INSPECTION DÉTAILLÉE D'UN ÉVÉNEMENT */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-scale-up space-y-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    selectedEvent.severity === "CRITICAL"
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : selectedEvent.severity === "WARNING"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedEvent.actionLabel}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID Log : {selectedEvent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">Module :</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getModuleBadgeColor(
                    selectedEvent.module
                  )}`}
                >
                  {selectedEvent.module}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700">Résultat :</span>
                {getResultBadge(selectedEvent.result)}
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700">Sévérité :</span>
                {getSeverityBadge(selectedEvent.severity)}
              </div>

              {/* Actor & Execution Context Card */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  Origine &amp; Contexte d&apos;Exécution
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Acteur / Initiateur</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedEvent.actor.name}</p>
                    <p className="text-slate-500 text-[11px]">{selectedEvent.actor.role}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Type Source</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedEvent.actor.type === "SYSTEM" ? "🤖 Système Automatisé" : "👤 Utilisateur Connecté"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Horodatage Exact</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedEvent.timestamp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Adresse IP &amp; Session</span>
                    <p className="font-mono text-slate-800 mt-0.5">
                      {selectedEvent.ipAddress || "Interne (Local)"} {selectedEvent.sessionId ? `• ${selectedEvent.sessionId}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-600" />
                  Objet / Ressource Concernée
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900">{selectedEvent.entityReference}</span>
                    <p className="text-slate-500 text-[11px]">Type d&apos;entité : {selectedEvent.entityType}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEntityFilter(selectedEvent.entityReference);
                      setSelectedEvent(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Voir toute l&apos;activité de cet objet
                  </button>
                </div>
              </div>

              {/* Description & Reason */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Description Détaillée</span>
                <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.reason && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Justification &amp; Algorithme</span>
                  <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium leading-relaxed">
                    💡 {selectedEvent.reason}
                  </div>
                </div>
              )}

              {/* BEFORE / AFTER DIFF (Crucial feature) */}
              {(selectedEvent.beforeState || selectedEvent.afterState) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                    Comparaison d&apos;État : Avant ➔ Après
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                        État Avant
                      </span>
                      <pre className="text-[11px] font-mono text-rose-950 overflow-x-auto whitespace-pre-wrap">
                        {typeof selectedEvent.beforeState === "object"
                          ? JSON.stringify(selectedEvent.beforeState, null, 2)
                          : selectedEvent.beforeState || "N/A (Création)"}
                      </pre>
                    </div>

                    {/* After */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        État Après
                      </span>
                      <pre className="text-[11px] font-mono text-emerald-950 overflow-x-auto whitespace-pre-wrap">
                        {typeof selectedEvent.afterState === "object"
                          ? JSON.stringify(selectedEvent.afterState, null, 2)
                          : selectedEvent.afterState || "N/A (Suppression)"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Audit Cross-link if applicable */}
              {selectedEvent.financeTxRef && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Écriture comptable liée : {selectedEvent.financeTxRef}</p>
                      <p className="text-[11px] text-emerald-700">Consignée au Grand Livre de Trésorerie</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/tresorerie"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Ouvrir Trésorerie</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Immutability Seal Footer */}
              <div className="p-3 rounded-xl bg-slate-100 text-slate-500 text-[10px] text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>
                  Cet événement est certifié immuable. Aucune altération ou suppression d&apos;historique n&apos;est autorisée.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL D'EXPORT DU JOURNAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-black text-slate-900">Exporter le Journal d&apos;Audit</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Exportez les <strong>{filteredLogs.length}</strong> événements d&apos;audit correspondant à vos filtres actuels.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportCsv}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center"
              >
                <FileSpreadsheet className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Format CSV</span>
                  <span className="text-[10px] text-slate-400">Pour Excel &amp; Tableurs</span>
                </div>
              </button>

              <button
                onClick={handleExportJson}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center"
              >
                <FileCode className="w-7 h-7 text-indigo-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Format JSON</span>
                  <span className="text-[10px] text-slate-400">Pour API &amp; SIEM</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
