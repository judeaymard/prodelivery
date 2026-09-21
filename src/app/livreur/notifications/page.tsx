"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Package,
  Truck,
  Wallet,
  Clock,
  CheckCheck,
  Filter,
} from "lucide-react";
import { useOperations } from "@/lib/store";

export default function LivreurNotificationsPage() {
  const {
    notifications,
    activeLivreur,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useOperations();

  const [filterCategory, setFilterCategory] = useState<"ALL" | "LIVRAISONS" | "INCIDENTS" | "FINANCES">("ALL");

  // Notifications filtrées pour ce coursier
  const driverNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.category === "LIVRAISONS" ||
        n.category === "COMMANDES" ||
        n.category === "INCIDENTS" ||
        n.category === "FINANCES" ||
        n.actor?.id === activeLivreur?.id
    );
  }, [notifications, activeLivreur]);

  const filteredNotifs = useMemo(() => {
    if (filterCategory === "ALL") return driverNotifications;
    return driverNotifications.filter((n) => n.category === filterCategory);
  }, [driverNotifications, filterCategory]);

  const unreadCount = driverNotifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "LIVRAISONS":
      case "COMMANDES":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "INCIDENTS":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "FINANCES":
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <Bell className="w-3 h-3 text-emerald-600" />
            <span>Alertes & Missions</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mises à jour des commandes, affectations de tournées et alertes financières
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            filterCategory === "ALL" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Toutes ({driverNotifications.length})
        </button>
        <button
          onClick={() => setFilterCategory("LIVRAISONS")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            filterCategory === "LIVRAISONS" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          Livraisons
        </button>
        <button
          onClick={() => setFilterCategory("INCIDENTS")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            filterCategory === "INCIDENTS" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          Incidents
        </button>
        <button
          onClick={() => setFilterCategory("FINANCES")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            filterCategory === "FINANCES" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          Finances / COD
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Aucune notification</p>
            <p className="text-[11px] text-slate-400">Vous êtes à jour dans vos alertes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifs.map((notif) => {
              const isUrgent = notif.priority === "URGENT";
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    !notif.isRead ? "bg-slate-50/90 hover:bg-slate-100/80" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{notif.title}</h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {isUrgent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-snug">{notif.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
