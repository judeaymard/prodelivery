"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  orders as initialOrders,
  partners as initialPartners,
  products as initialProducts,
  livreurs as initialLivreurs,
  closeuses as initialCloseuses,
  initialPayoutRequests,
  initialAgencyPulseActivities,
  initialConversations,
  initialAgencyAlerts,
  initialPlatformNotifications,
  initialPlatformUsers,
  initialPlatformSettings,
  initialRolePermissionsMap,
  currentPartner,
} from "./mock-data";
import {
  calculateDeliveryFee,
  calculateClosingFee,
  calculateCommission,
  calculateOrderTotal,
  validateWithdrawalRequest,
} from "./pricing-service";
import { getPaymentProvider } from "./payment-providers";
import {
  Order,
  Partner,
  Product,
  LivreurProfile,
  CloseuseProfile,
  PayoutRequest,
  PayoutOperator,
  PayoutStatus,
  UserRole,
  OrderStatus,
  Conversation,
  ActivityItem,
  AgencyAlert,
  PlatformNotification,
  PlatformUser,
  PlatformUserStatus,
  PlatformSettings,
  RoleDefinition,
  PermissionDefinition,
  PeriodFilter,
  ChatMessage,
  ChatAttachment,
  AssignmentConfig,
  AssignmentLog,
  AssignmentMode,
  LivreurStatus,
  CloseuseStatus,
  FinancialTransaction,
  CodCollection,
  CodRemittance,
  FinancialAuditLog,
  TreasuryManagerProfile,
  EmployeeStatus,
  DriverCodFinancialSummary,
  GlobalAuditLog,
  AuditSessionLog,
  AuditModule,
  AuditSeverity,
  AuditResult,
  AuditEntityType,
  AuditActorType,
} from "./types";
import {
  initialTransactions,
  initialCodCollections,
  initialCodRemittances,
  initialFinancialAuditLogs,
  initialTreasuryManagers,
  initialGlobalAuditLogs,
  initialAuditSessions,
} from "./mock-data";

interface OperationsContextType {
  // Entités & Données
  orders: Order[];
  partners: Partner[];
  products: Product[];
  livreurs: LivreurProfile[];
  closeuses: CloseuseProfile[];
  treasuryManagers: TreasuryManagerProfile[];
  payoutRequests: PayoutRequest[];
  transactions: FinancialTransaction[];
  codCollections: CodCollection[];
  codRemittances: CodRemittance[];
  auditLogs: FinancialAuditLog[];
  conversations: Conversation[];
  activities: ActivityItem[];
  alerts: AgencyAlert[];
  period: PeriodFilter;

  // Automatisation des Attributions
  assignmentConfig: AssignmentConfig;
  assignmentLogs: AssignmentLog[];
  closerAvailability: Record<string, CloseuseStatus>;

  // Session & Rôles
  currentRole: UserRole;
  activeLivreurId: string;
  activeCloseuseId: string;
  activePartnerId: string;
  activeTreasuryManagerId: string;
  activeLivreur: LivreurProfile;
  activeCloseuse: CloseuseProfile;
  activePartner: Partner;
  activeTreasuryManager: TreasuryManagerProfile;
  getDriverCodFunds: (driverId: string) => DriverCodFinancialSummary;

  // Actions
  setPeriod: (period: PeriodFilter) => void;
  switchRole: (role: UserRole, specificId?: string) => void;
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, comment?: string) => void;
  logClosingCall: (
    orderId: string,
    note: string,
    newStatus: OrderStatus,
    assignedLivreurId?: string,
    deliveryTimeSlot?: string
  ) => void;
  assignOrderToCloseuse: (orderId: string, closeuseId: string) => void;
  assignOrderToLivreur: (orderId: string, livreurId: string) => void;
  markOrderDelivered: (orderId: string) => void;
  markOrderFailed: (orderId: string, reason: string) => void;
  requestPayout: (
    amount: number,
    operator: PayoutOperator,
    phone: string,
    countryCode?: string,
    cryptoAddress?: string,
    cryptoNetwork?: string,
    binancePayId?: string,
    binanceEmail?: string
  ) => PayoutRequest;
  addLivreur: (data: {
    name: string;
    email: string;
    phone: string;
    zone: string;
    secondaryZones?: string[];
    vehicle: string;
    licensePlate?: string;
    maxActiveCapacity?: number;
    commissionPerDelivery?: number;
    availabilityStatus?: LivreurStatus;
  }) => LivreurProfile;
  updateLivreurAvailability: (livreurId: string, status: LivreurStatus) => void;
  updateLivreur: (livreurId: string, data: Partial<LivreurProfile>) => void;
  reassignLivreurOrders: (fromLivreurId: string, toLivreurId: string) => void;
  addCloseuse: (data: {
    name: string;
    email: string;
    phone: string;
    languages?: string[];
    zones?: string[];
    skills?: string[];
    maxActiveOrders?: number;
    maxActiveConversations?: number;
    commissionPerConfirmation?: number;
    availabilityStatus?: CloseuseStatus;
  }) => CloseuseProfile;
  updateCloseuse: (closeuseId: string, data: Partial<CloseuseProfile>) => void;
  reassignCloseuseOrders: (fromCloseuseId: string, toCloseuseId: string) => void;
  addPartner: (data: Partial<Partner>) => Partner;
  updatePartner: (partnerId: string, data: Partial<Partner>) => void;
  suspendPartner: (partnerId: string, reason: string) => void;
  reactivatePartner: (partnerId: string) => void;
  changePassword: (newPassword: string) => void;
  approvePayout: (payoutId: string) => void;
  validatePayout: (payoutId: string) => void;
  payPayout: (payoutId: string, paymentReference: string, adminName?: string) => void;
  rejectPayout: (payoutId: string, reason?: string) => void;
  verifyWithdrawal: (withdrawalId: string, internalNote?: string) => void;
  approveWithdrawal: (withdrawalId: string, internalNote?: string) => void;
  rejectWithdrawal: (withdrawalId: string, reason: string) => void;
  payWithdrawal: (withdrawalId: string, paymentReference: string, adminName?: string) => void;
  addTreasuryManager: (data: Partial<TreasuryManagerProfile>) => TreasuryManagerProfile;
  updateTreasuryManager: (id: string, data: Partial<TreasuryManagerProfile>) => void;
  toggleTreasuryManagerStatus: (id: string, status: EmployeeStatus) => void;
  deleteTreasuryManager: (id: string) => void;
  receiveDriverRemittance: (params: {
    livreurId: string;
    receivedAmount: number;
    receivedBy: string;
    receivedById?: string;
    notes?: string;
    discrepancyReason?: string;
  }) => CodRemittance;
  declareRemittance: (livreurId: string, amountDeclared: number, orderIds: string[], notes?: string) => CodRemittance;
  validateRemittance: (remittanceId: string, amountValidated?: number) => void;
  disputeRemittance: (remittanceId: string, notes: string) => void;
  reportCodDiscrepancy: (orderId: string, actualAmount: number, justification: string) => void;
  addTransaction: (data: Partial<FinancialTransaction>) => FinancialTransaction;
  sendConversationMessage: (
    convId: string,
    text: string,
    isInternalNote?: boolean,
    attachments?: ChatAttachment[] | {
      name: string;
      url?: string;
      type?: "IMAGE" | "PDF" | "DOC";
      size?: string;
    }
  ) => void;
  assignConversation: (convId: string, agentName: string, agentRole: string, reason?: string) => void;
  transferConversation: (
    convId: string,
    toAgentName: string,
    toAgentRole: string,
    reason: string
  ) => void;
  takeoverConversation: (convId: string) => void;
  resolveConversation: (convId: string) => void;
  reopenConversation: (convId: string) => void;
  escalateConversation: (convId: string, reason: string) => void;
  smartAutoAssignConversation: (convId: string) => boolean;
  resolveAlert: (alertId: string) => void;

  // 🛡️ Audit & Traçabilité Centrale
  globalAuditLogs: GlobalAuditLog[];
  auditSessions: AuditSessionLog[];
  logAuditEvent: (
    params: Omit<GlobalAuditLog, "id" | "timestamp" | "isoDate"> & {
      timestamp?: string;
      isoDate?: string;
    }
  ) => GlobalAuditLog;

  // 🔔 Centre de Notifications & Alertes
  notifications: PlatformNotification[];
  unreadNotificationsCount: number;
  criticalAlertsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  resolveNotificationAlert: (id: string) => void;
  addNotification: (
    notification: Omit<PlatformNotification, "id" | "createdAt" | "isoDate" | "isRead"> & {
      id?: string;
      createdAt?: string;
      isoDate?: string;
      isRead?: boolean;
    }
  ) => PlatformNotification;
  deleteNotification: (id: string) => void;

  // ⚙️ Paramètres, Utilisateurs & Permissions
  platformSettings: PlatformSettings;
  platformUsers: PlatformUser[];
  rolePermissions: Record<string, string[]>;
  currentUserProfile: PlatformUser;
  updatePlatformSettings: (newSettings: Partial<PlatformSettings>, sectionName?: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<PlatformUser>) => void;
  createPlatformUser: (user: Partial<PlatformUser>) => PlatformUser;
  updatePlatformUserStatus: (userId: string, status: PlatformUserStatus, reason?: string) => void;
  updateRolePermissions: (roleId: string, permissions: string[]) => void;
  hasPermission: (permissionId: string) => boolean;

  // Méthodes d'Automatisation
  updateAssignmentConfig: (newConfig: Partial<AssignmentConfig>) => void;
  updateCloserAvailability: (closerId: string, status: CloseuseStatus) => void;
  simulateAssignment: (type: "ORDER" | "CONVERSATION") => {
    winner: CloseuseProfile | null;
    reason: string;
    modeUsed: AssignmentMode;
    breakdown: { closer: CloseuseProfile; load: number; status: string; eligible: boolean }[];
  };
  triggerAutoAssignItem: (itemId: string, type: "ORDER" | "CONVERSATION") => boolean;
}

const initialAssignmentConfig: AssignmentConfig = {
  ordersMode: "SMART_AUTO",
  conversationsMode: "SMART_AUTO",
  maxCapacityPerCloser: 15,
  autoRedistribute: true,
  redistributeTimeoutMinutes: 30,
  prioritizeUrgent: true,
  notifyOnAssign: true,
  useRoundRobinOnTie: true,
  queueUnassigned: true,
};

const initialAssignmentLogs: AssignmentLog[] = [
  {
    id: "log-1",
    timestamp: "11:42",
    itemType: "ORDER",
    itemRef: "CMD-2458",
    assignedToCloserName: "Marie Dossou",
    assignedToCloserId: "cls-2",
    modeUsed: "SMART_AUTO",
    reason: "Charge active la plus faible (4 commandes)",
    success: true,
  },
  {
    id: "log-2",
    timestamp: "11:15",
    itemType: "CONVERSATION",
    itemRef: "Dossou Fashion",
    assignedToCloserName: "Sarah K.",
    assignedToCloserId: "cls-1",
    modeUsed: "SMART_AUTO",
    reason: "Égalité de charge, rotation Round Robin appliquée",
    success: true,
  },
  {
    id: "log-3",
    timestamp: "10:30",
    itemType: "ORDER",
    itemRef: "CMD-20412",
    assignedToCloserName: "Carine A.",
    assignedToCloserId: "cls-3",
    modeUsed: "SMART_AUTO",
    reason: "Rotation équitable début de journée",
    success: true,
  },
];

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_partners_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialPartners;
  });
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [livreurs, setLivreurs] = useState<LivreurProfile[]>(initialLivreurs);
  const [closeuses, setCloseuses] = useState<CloseuseProfile[]>(initialCloseuses);
  const [treasuryManagers, setTreasuryManagers] = useState<TreasuryManagerProfile[]>(initialTreasuryManagers);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_payouts_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialPayoutRequests;
  });
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_transactions_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialTransactions;
  });
  const [codCollections, setCodCollections] = useState<CodCollection[]>(initialCodCollections);
  const [codRemittances, setCodRemittances] = useState<CodRemittance[]>(initialCodRemittances);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>(initialFinancialAuditLogs);
  const [globalAuditLogs, setGlobalAuditLogs] = useState<GlobalAuditLog[]>(initialGlobalAuditLogs);
  const [auditSessions, setAuditSessions] = useState<AuditSessionLog[]>(initialAuditSessions);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_conversations_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialConversations;
  });
  const [activities, setActivities] = useState<ActivityItem[]>(initialAgencyPulseActivities);
  const [alerts, setAlerts] = useState<AgencyAlert[]>(initialAgencyAlerts);
  const [period, setPeriod] = useState<PeriodFilter>("TODAY");

  // Persistance et synchronisation des retraits et marchands (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/withdrawals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.payouts) && data.payouts.length > 0) {
            setPayoutRequests(data.payouts);
            try {
              localStorage.setItem("eno_payouts_v3", JSON.stringify(data.payouts));
            } catch {}
          }
          if (Array.isArray(data.partners) && data.partners.length > 0) {
            setPartners(data.partners);
            try {
              localStorage.setItem("eno_partners_v3", JSON.stringify(data.partners));
            } catch {}
          }
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions(data.transactions);
            try {
              localStorage.setItem("eno_transactions_v3", JSON.stringify(data.transactions));
            } catch {}
          }
        }
      })
      .catch((err) => {
        console.warn("Mode hors-ligne ou fallback withdrawals:", err);
      });
  }, []);

  useEffect(() => {
    try {
      if (payoutRequests && payoutRequests.length > 0) {
        localStorage.setItem("eno_payouts_v3", JSON.stringify(payoutRequests));
      }
    } catch {}
  }, [payoutRequests]);

  useEffect(() => {
    try {
      if (partners && partners.length > 0) {
        localStorage.setItem("eno_partners_v3", JSON.stringify(partners));
      }
    } catch {}
  }, [partners]);

  useEffect(() => {
    try {
      if (transactions && transactions.length > 0) {
        localStorage.setItem("eno_transactions_v3", JSON.stringify(transactions));
      }
    } catch {}
  }, [transactions]);

  // Persistance et synchronisation des conversations (Serveur + LocalStorage)
  useEffect(() => {
    // Synchronisation en arrière-plan depuis le backend persistant
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.conversations) && data.conversations.length > 0) {
          setConversations(data.conversations);
          try {
            localStorage.setItem("eno_conversations_v3", JSON.stringify(data.conversations));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("Mode hors-ligne ou fallback conversations:", err);
      });
  }, []);

  useEffect(() => {
    try {
      if (conversations && conversations.length > 0) {
        localStorage.setItem("eno_conversations_v3", JSON.stringify(conversations));
      }
    } catch {}
  }, [conversations]);

  // 🔔 Centre de Notifications & Alertes (Plateforme Globale)
  const [notifications, setNotifications] = useState<PlatformNotification[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_notifications_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialPlatformNotifications;
  });

  // Persistance et synchronisation des notifications (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          setNotifications(data.notifications);
          try {
            localStorage.setItem("eno_notifications_v3", JSON.stringify(data.notifications));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("Mode hors-ligne ou fallback notifications:", err);
      });
  }, []);

  useEffect(() => {
    try {
      if (notifications && notifications.length > 0) {
        localStorage.setItem("eno_notifications_v3", JSON.stringify(notifications));
      }
    } catch {}
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const criticalAlertsCount = notifications.filter(
    (n) => n.priority === "CRITICAL" && n.alertStatus !== "RESOLVED"
  ).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_READ", id }),
    }).catch(() => {});
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    }).catch(() => {});
  };

  const resolveNotificationAlert = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, alertStatus: "RESOLVED", isRead: true } : n))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RESOLVE_ALERT", id }),
    }).catch(() => {});
  };

  const addNotification = (
    params: Omit<PlatformNotification, "id" | "createdAt" | "isoDate" | "isRead"> & {
      id?: string;
      createdAt?: string;
      isoDate?: string;
      isRead?: boolean;
    }
  ): PlatformNotification => {
    const now = new Date();
    const formattedDate =
      params.createdAt ||
      now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
        " à " +
        now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newNotification: PlatformNotification = {
      id: params.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: params.category,
      priority: params.priority,
      title: params.title,
      description: params.description,
      isRead: params.isRead ?? false,
      createdAt: formattedDate,
      isoDate: params.isoDate || now.toISOString(),
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
      isAlert: params.isAlert ?? (params.priority === "CRITICAL" || params.priority === "URGENT"),
      alertStatus:
        params.alertStatus ||
        (params.priority === "CRITICAL" || params.priority === "URGENT" ? "ACTIVE" : undefined),
      actor: params.actor,
      metadata: params.metadata,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNotification),
    }).catch(() => {});

    return newNotification;
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ⚙️ Paramètres de la Plateforme (Settings)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_settings_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
    }
    return initialPlatformSettings;
  });

  // 👥 Utilisateurs de la Plateforme (Users)
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_users_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialPlatformUsers;
  });

  // 🛡️ Permissions des Rôles
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("eno_role_perms_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
    }
    return initialRolePermissionsMap;
  });

  // Profil Utilisateur Connecté (Acteur Principal PDG par défaut)
  const [currentUserProfile, setCurrentUserProfile] = useState<PlatformUser>(() => {
    return initialPlatformUsers[0];
  });

  // Sync avec le serveur en tâche de fond
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setPlatformSettings(data.settings);
          try {
            localStorage.setItem("eno_settings_v3", JSON.stringify(data.settings));
          } catch {}
        }
        if (data.success && data.rolePermissions) {
          setRolePermissions(data.rolePermissions);
          try {
            localStorage.setItem("eno_role_perms_v3", JSON.stringify(data.rolePermissions));
          } catch {}
        }
      })
      .catch((err) => console.warn("Fallback local settings:", err));

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          setPlatformUsers(data.users);
          try {
            localStorage.setItem("eno_users_v3", JSON.stringify(data.users));
          } catch {}
        }
      })
      .catch((err) => console.warn("Fallback local users:", err));
  }, []);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem("eno_settings_v3", JSON.stringify(platformSettings));
    } catch {}
  }, [platformSettings]);

  useEffect(() => {
    try {
      localStorage.setItem("eno_users_v3", JSON.stringify(platformUsers));
    } catch {}
  }, [platformUsers]);

  useEffect(() => {
    try {
      localStorage.setItem("eno_role_perms_v3", JSON.stringify(rolePermissions));
    } catch {}
  }, [rolePermissions]);

  // Vérification de permission granulaire
  const hasPermission = (permissionId: string): boolean => {
    if (currentRole === "PDG") return true;
    const permissionsForRole = rolePermissions[currentRole] || [];
    if (permissionsForRole.includes("*") || permissionsForRole.includes(permissionId)) {
      return true;
    }
    if (currentUserProfile.customPermissions?.includes(permissionId)) {
      return true;
    }
    return false;
  };

  // 1. Mise à jour des paramètres
  const updatePlatformSettings = async (
    newSettings: Partial<PlatformSettings>,
    sectionName = "Configuration générale"
  ): Promise<boolean> => {
    const prev = { ...platformSettings };
    const merged: PlatformSettings = {
      ...platformSettings,
      ...newSettings,
      general: { ...platformSettings.general, ...(newSettings.general || {}) },
      operational: { ...platformSettings.operational, ...(newSettings.operational || {}) },
      financial: { ...platformSettings.financial, ...(newSettings.financial || {}) },
      paymentGateways: {
        ...platformSettings.paymentGateways,
        ...(newSettings.paymentGateways || {}),
      },
      notifications: {
        ...platformSettings.notifications,
        ...(newSettings.notifications || {}),
      },
      security: { ...platformSettings.security, ...(newSettings.security || {}) },
      lastUpdated:
        new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " à " +
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      updatedBy: currentUserProfile.name,
    };

    setPlatformSettings(merged);

    // Audit log
    logAuditEvent({
      actor: {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        role: currentUserProfile.roleLabel,
        type: "USER",
      },
      action: "SETTINGS_UPDATED",
      actionLabel: `Modification de ${sectionName}`,
      module: "PARAMETRES",
      entityType: "SETTING",
      entityId: "platform-settings",
      entityReference: `CONFIG-${sectionName.toUpperCase().slice(0, 8)}`,
      severity: "WARNING",
      result: "SUCCESS",
      description: `Mise à jour des paramètres de la section ${sectionName}.`,
      beforeState: prev as any,
      afterState: merged as any,
      isSensitive: true,
    });

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: merged, updatedBy: currentUserProfile.name }),
      });
      return true;
    } catch {
      return false;
    }
  };

  // 2. Mise à jour du profil utilisateur connecté
  const updateUserProfile = (updates: Partial<PlatformUser>) => {
    const prev = { ...currentUserProfile };
    const updated = { ...currentUserProfile, ...updates };
    setCurrentUserProfile(updated);

    // Mettre également à jour dans platformUsers
    setPlatformUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === updated.id ? updated : u))
    );

    logAuditEvent({
      actor: {
        id: updated.id,
        name: updated.name,
        role: updated.roleLabel,
        type: "USER",
      },
      action: "PROFILE_UPDATED",
      actionLabel: "Mise à jour du profil personnel",
      module: "UTILISATEURS",
      entityType: "USER",
      entityId: updated.id,
      entityReference: updated.name,
      severity: "INFO",
      result: "SUCCESS",
      description: "Modification des coordonnées personnelles de l'utilisateur connecté.",
      beforeState: prev as any,
      afterState: updated as any,
    });

    fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: updated.id, updates }),
    }).catch(() => {});
  };

  // 3. Création d'utilisateur
  const createPlatformUser = (userData: Partial<PlatformUser>): PlatformUser => {
    const newUser: PlatformUser = {
      id: userData.id || `usr-${Date.now()}`,
      firstName: (userData.firstName || "Nouveau").trim(),
      lastName: (userData.lastName || "Utilisateur").trim(),
      name: `${(userData.firstName || "Nouveau").trim()} ${(userData.lastName || "Utilisateur").trim()}`,
      email: (userData.email || `user-${Date.now()}@enolivraison.com`).trim().toLowerCase(),
      phone: userData.phone || "+229 00 00 00 00",
      role: userData.role || "CLOSEUSE",
      roleLabel: userData.roleLabel || userData.role || "Closeuse",
      status: userData.status || "active",
      zone: userData.zone || "Cotonou",
      createdAt: new Date().toISOString().slice(0, 10),
      lastActiveAt: "Nouveau compte",
      is2FAEnabled: userData.is2FAEnabled ?? false,
      notes: userData.notes || "",
    };

    setPlatformUsers((prev) => [newUser, ...prev]);

    logAuditEvent({
      actor: {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        role: currentUserProfile.roleLabel,
        type: "USER",
      },
      action: "USER_CREATED",
      actionLabel: `Création de l'utilisateur ${newUser.name}`,
      module: "UTILISATEURS",
      entityType: "USER",
      entityId: newUser.id,
      entityReference: newUser.name,
      severity: "WARNING",
      result: "SUCCESS",
      description: `Création d'un nouveau compte avec le rôle ${newUser.roleLabel}.`,
      afterState: newUser as any,
      isSensitive: true,
    });

    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    return newUser;
  };

  // 4. Changement de statut utilisateur (suspendre, réactiver)
  const updatePlatformUserStatus = (
    userId: string,
    status: PlatformUserStatus,
    reason?: string
  ) => {
    const targetUser = platformUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const prevStatus = targetUser.status;

    setPlatformUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );

    const isSuspension = status === "suspended";

    logAuditEvent({
      actor: {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        role: currentUserProfile.roleLabel,
        type: "USER",
      },
      action: isSuspension ? "USER_SUSPENDED" : "USER_STATUS_UPDATED",
      actionLabel: isSuspension
        ? `Suspension du compte ${targetUser.name}`
        : `Changement de statut pour ${targetUser.name} (${status})`,
      module: "UTILISATEURS",
      entityType: "USER",
      entityId: targetUser.id,
      entityReference: targetUser.name,
      severity: isSuspension ? "CRITICAL" : "WARNING",
      result: "SUCCESS",
      description: `Le compte ${targetUser.name} est passé de ${prevStatus} à ${status}.${reason ? ` Motif : ${reason}` : ""}`,
      reason,
      beforeState: { status: prevStatus },
      afterState: { status },
      isSensitive: true,
    });

    fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, updates: { status } }),
    }).catch(() => {});
  };

  // 5. Mise à jour des permissions d'un rôle
  const updateRolePermissions = (roleId: string, permissions: string[]) => {
    const prev = rolePermissions[roleId] || [];
    setRolePermissions((prevMap) => ({ ...prevMap, [roleId]: permissions }));

    logAuditEvent({
      actor: {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        role: currentUserProfile.roleLabel,
        type: "USER",
      },
      action: "ROLE_PERMISSIONS_UPDATED",
      actionLabel: `Mise à jour des permissions du rôle ${roleId}`,
      module: "PARAMETRES",
      entityType: "ROLE",
      entityId: roleId,
      entityReference: `ROLE-${roleId}`,
      severity: "CRITICAL",
      result: "SUCCESS",
      description: `Modification de la matrice de permissions pour le rôle ${roleId} (${permissions.length} permissions accordées).`,
      beforeState: { permissions: prev },
      afterState: { permissions },
      isSensitive: true,
    });

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ROLE_PERMISSIONS", roleId, permissions }),
    }).catch(() => {});
  };

  // 🛡️ Logueur d'Audit Central Universel
  const logAuditEvent = (
    params: Omit<GlobalAuditLog, "id" | "timestamp" | "isoDate"> & {
      timestamp?: string;
      isoDate?: string;
    }
  ): GlobalAuditLog => {
    const now = new Date();
    const formattedTimestamp =
      params.timestamp ||
      now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
        " — " +
        now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const newLog: GlobalAuditLog = {
      id: `aud-glob-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedTimestamp,
      isoDate: params.isoDate || now.toISOString(),
      actor: params.actor,
      action: params.action,
      actionLabel: params.actionLabel,
      module: params.module,
      entityType: params.entityType,
      entityId: params.entityId,
      entityReference: params.entityReference,
      severity: params.severity,
      result: params.result,
      description: params.description,
      reason: params.reason,
      beforeState: params.beforeState,
      afterState: params.afterState,
      ipAddress: params.ipAddress || (params.actor.type === "USER" ? "41.85.160.22" : undefined),
      sessionId: params.sessionId,
      userAgent: params.userAgent,
      financeTxRef: params.financeTxRef,
      isSensitive: params.isSensitive,
    };

    setGlobalAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // Automatisation State
  const [assignmentConfig, setAssignmentConfig] = useState<AssignmentConfig>(initialAssignmentConfig);
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLog[]>(initialAssignmentLogs);
  const [closerAvailability, setCloserAvailability] = useState<Record<string, CloseuseStatus>>({
    "cls-1": "AVAILABLE",
    "cls-2": "BUSY",
    "cls-3": "PAUSED",
  });
  const [roundRobinPointer, setRoundRobinPointer] = useState<number>(0);

  // Session State
  const [currentRole, setCurrentRole] = useState<UserRole>("PDG");
  const [activeLivreurId, setActiveLivreurId] = useState<string>("liv-1");
  const [activeCloseuseId, setActiveCloseuseId] = useState<string>("cls-1");
  const [activePartnerId, setActivePartnerId] = useState<string>("p1");
  const [activeTreasuryManagerId, setActiveTreasuryManagerId] = useState<string>("tm-1");

  // Rôle Switcher
  const switchRole = (role: UserRole, specificId?: string) => {
    setCurrentRole(role);
    if (role === "LIVREUR" && specificId) setActiveLivreurId(specificId);
    if (role === "CLOSEUSE" && specificId) setActiveCloseuseId(specificId);
    if (role === "PARTNER" && specificId) setActivePartnerId(specificId);
    if (role === "TREASURY_MANAGER" && specificId) setActiveTreasuryManagerId(specificId);
  };

  // Helper: compute active load for a closer
  const getCloserActiveLoad = (closerId: string, closerName: string) => {
    return orders.filter(
      (o) =>
        (o.assignedCloseuseId === closerId || o.assignedCloseuseName === closerName) &&
        (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER" || o.status === "CONFIRMEE")
    ).length;
  };

  // 1. Mise à jour de la configuration d'attribution
  const updateAssignmentConfig = (newConfig: Partial<AssignmentConfig>) => {
    const prevConfig = { ...assignmentConfig };
    setAssignmentConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      logAuditEvent({
        actor: {
          id: "usr-pdg",
          name: "Jude S. (PDG)",
          role: "Super Admin",
          type: "USER",
        },
        action: "ASSIGNMENT_CONFIG_UPDATED",
        actionLabel: "Modification des règles d'attribution",
        module: "AUTOMATISATION",
        entityType: "SETTING",
        entityId: "conf-attribution",
        entityReference: "RÈGLES-ATTRIB",
        severity: "WARNING",
        result: "SUCCESS",
        description: "Mise à jour des règles d'attribution automatique des commandes et conversations.",
        beforeState: prevConfig,
        afterState: updated,
        isSensitive: true,
      });
      return updated;
    });
  };

  // 2. Mise à jour de la disponibilité d'une closeuse
  const updateCloserAvailability = (closerId: string, status: CloseuseStatus) => {
    setCloserAvailability((prev) => ({ ...prev, [closerId]: status }));
    setCloseuses((prev) =>
      prev.map((c) => (c.id === closerId ? { ...c, availabilityStatus: status } : c))
    );
  };

  // 3. Simulateur d'attribution algorithmique 4 étapes
  const simulateAssignment = (
    type: "ORDER" | "CONVERSATION"
  ): {
    winner: CloseuseProfile | null;
    reason: string;
    modeUsed: AssignmentMode;
    breakdown: { closer: CloseuseProfile; load: number; status: string; eligible: boolean }[];
  } => {
    // 🎯 Source de Vérité Centrale : Consomme directement platformSettings.operational
    const mode: AssignmentMode =
      type === "ORDER"
        ? platformSettings.operational?.ordersAssignmentMode || assignmentConfig.ordersMode
        : platformSettings.operational?.conversationsAssignmentMode || assignmentConfig.conversationsMode;

    const maxCapacity =
      platformSettings.operational?.maxCapacityPerCloser || assignmentConfig.maxCapacityPerCloser || 20;

    if (mode === "MANUAL") {
      return {
        winner: null,
        reason: "Mode Manuel actif : Les éléments sont placés dans la file d'attente sans attribution automatique.",
        modeUsed: "MANUAL",
        breakdown: closeuses.map((c) => ({
          closer: c,
          load: getCloserActiveLoad(c.id, c.name),
          status: closerAvailability[c.id] || "AVAILABLE",
          eligible: false,
        })),
      };
    }

    const breakdown = closeuses.map((c) => {
      const status = closerAvailability[c.id] || "AVAILABLE";
      const load = getCloserActiveLoad(c.id, c.name);
      const eligible = status === "AVAILABLE" && load < maxCapacity;
      return { closer: c, load, status, eligible };
    });

    const eligibleClosers = breakdown.filter((b) => b.eligible);

    if (eligibleClosers.length === 0) {
      return {
        winner: null,
        reason: "Toutes les closeuses ont atteint leur capacité maximale ou sont indisponibles. L'élément sera mis en file d'attente.",
        modeUsed: mode,
        breakdown,
      };
    }

    if (mode === "ROUND_ROBIN") {
      const winnerIndex = roundRobinPointer % eligibleClosers.length;
      const winner = eligibleClosers[winnerIndex].closer;
      return {
        winner,
        reason: `Distribution Round Robin équitable (Tour de rôle, position ${winnerIndex + 1}/${eligibleClosers.length})`,
        modeUsed: "ROUND_ROBIN",
        breakdown,
      };
    }

    // SMART_AUTO
    const minLoad = Math.min(...eligibleClosers.map((b) => b.load));
    const lowestLoadClosers = eligibleClosers.filter((b) => b.load === minLoad);

    if (lowestLoadClosers.length === 1) {
      const winner = lowestLoadClosers[0].closer;
      return {
        winner,
        reason: `${winner.name} sélectionnée — charge active la plus faible (${minLoad} commandes actives).`,
        modeUsed: "SMART_AUTO",
        breakdown,
      };
    }

    // Tie-breaker Round Robin
    const winnerIndex = roundRobinPointer % lowestLoadClosers.length;
    const winner = lowestLoadClosers[winnerIndex].closer;
    return {
      winner,
      reason: `${winner.name} sélectionnée — égalité de charge (${minLoad} commandes), rotation Round Robin secondaire appliquée.`,
      modeUsed: "SMART_AUTO",
      breakdown,
    };
  };

  // 4. Déclenchement de l'attribution automatique réelle
  const triggerAutoAssignItem = (itemId: string, type: "ORDER" | "CONVERSATION") => {
    const sim = simulateAssignment(type);
    if (!sim.winner) return false;

    const winner = sim.winner;
    const newPointer = roundRobinPointer + 1;
    setRoundRobinPointer(newPointer);

    if (type === "ORDER") {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === itemId
            ? {
                ...o,
                assignedCloseuseId: winner.id,
                assignedCloseuseName: winner.name,
                status: "A_RAPPELER",
                updatedAt: new Date().toISOString(),
                comment: `Attribution automatique : ${sim.reason}`,
              }
            : o
        )
      );
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === itemId
            ? {
                ...c,
                assignedAgentName: winner.name,
                assignedAgentRole: "Closeuse",
                status: "IN_PROGRESS",
              }
            : c
        )
      );
    }

    // Log the assignment
    const newLog: AssignmentLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      itemType: type,
      itemRef: itemId,
      assignedToCloserName: winner.name,
      assignedToCloserId: winner.id,
      modeUsed: sim.modeUsed,
      reason: sim.reason,
      success: true,
    };
    setAssignmentLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    return true;
  };

  // Création de commande avec tarification dynamique et auto-assign si configuré
  const createOrder = (orderData: Partial<Order>): Order => {
    const count = orders.length + 1;
    const orderNumber = `CMD-BJ${String(count).padStart(4, "0")}`;
    const targetPartnerId = orderData.partnerId || activePartnerId;
    const partner = partners.find((p) => p.id === targetPartnerId);

    // 🎯 Source de Vérité Centrale : Tarification issue de platformSettings
    const dynamicDeliveryFee = calculateDeliveryFee(
      platformSettings,
      { deliveryFee: orderData.deliveryFee },
      partner
    );
    const dynamicServiceFee = calculateClosingFee(
      platformSettings,
      { closingFee: orderData.serviceFee },
      partner
    );

    const newOrder: Order = {
      id: `cmd_${Date.now()}`,
      orderNumber,
      clientName: orderData.clientName || "Nouveau Client",
      clientPhone: orderData.clientPhone || "+229 01 00 00 00",
      region: orderData.region || "Littoral",
      address: orderData.address || "Adresse standard",
      city: orderData.city || "Cotonou",
      products: orderData.products || "Produit standard",
      quantity: orderData.quantity || 1,
      totalPrice: orderData.totalPrice !== undefined ? orderData.totalPrice : 15000,
      deliveryFee: dynamicDeliveryFee,
      serviceFee: dynamicServiceFee,
      status: "EN_ATTENTE",
      partnerId: targetPartnerId,
      partnerName: orderData.partnerName || partner?.companyName || "E-commerçant",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      ...orderData,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Auto-assignment if active
    if (assignmentConfig.ordersMode !== "MANUAL") {
      setTimeout(() => {
        triggerAutoAssignItem(newOrder.id, "ORDER");
      }, 300);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, comment?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
              comment: comment || o.comment,
              deliveredAt: status === "LIVREE" ? new Date().toISOString() : o.deliveredAt,
              codCollected: status === "LIVREE" ? true : o.codCollected,
            }
          : o
      )
    );
  };

  const logClosingCall = (
    orderId: string,
    note: string,
    newStatus: OrderStatus,
    assignedLivreurId?: string,
    deliveryTimeSlot?: string
  ) => {
    const livreur = livreurs.find((l) => l.id === assignedLivreurId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              closingNotes: note,
              assignedLivreurId: assignedLivreurId || o.assignedLivreurId,
              assignedLivreurName: livreur?.name || o.assignedLivreurName,
              deliveryTimeSlot: deliveryTimeSlot || o.deliveryTimeSlot,
              callCount: (o.callCount || 0) + 1,
              updatedAt: new Date().toISOString(),
              comment: `Appel closing : ${note}`,
            }
          : o
      )
    );
  };

  const assignOrderToCloseuse = (orderId: string, closeuseId: string) => {
    const closer = closeuses.find((c) => c.id === closeuseId);
    if (!closer) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedCloseuseId: closer.id,
              assignedCloseuseName: closer.name,
              status: o.status === "EN_ATTENTE" ? "A_RAPPELER" : o.status,
              updatedAt: new Date().toISOString(),
              comment: `Attribué manuellement à la closeuse ${closer.name}`,
            }
          : o
      )
    );
  };

  const assignOrderToLivreur = (orderId: string, livreurId: string) => {
    const livreur = livreurs.find((l) => l.id === livreurId);
    if (!livreur) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedLivreurId: livreur.id,
              assignedLivreurName: livreur.name,
              status: "EN_COURS",
              updatedAt: new Date().toISOString(),
              comment: `Attribué au coursier ${livreur.name} (${livreur.zone})`,
            }
          : o
      )
    );
  };

  const markOrderDelivered = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // 🎯 Source de Vérité Centrale : Calcul de la commission au moment de la livraison
    const commission = calculateCommission(platformSettings, order.totalPrice);
    const netCredit = Math.max(0, order.totalPrice - (order.deliveryFee || 2000) - (order.serviceFee || 800) - commission);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "LIVREE",
              deliveredAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              codCollected: true,
              comment: `Colis livré et montant COD encaissé avec succès par le livreur (Commission ENO: ${commission} FCFA).`,
            }
          : o
      )
    );

    // Créditer le solde marchand
    if (order.partnerId) {
      setPartners((prev) =>
        prev.map((p) =>
          p.id === order.partnerId
            ? { ...p, availableBalance: (p.availableBalance || 0) + netCredit }
            : p
        )
      );
    }

    // Écriture de la transaction de livraison
    const newTx: FinancialTransaction = {
      id: `tx-del-${Date.now()}`,
      txReference: `TX-CMD-${order.orderNumber || Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "LIVRAISON_ENCAISSEE",
      label: `Encaissement ${order.orderNumber} - ${order.clientName}`,
      partnerId: order.partnerId,
      partnerName: order.partnerName,
      inflow: order.totalPrice,
      outflow: (order.deliveryFee || 2000) + (order.serviceFee || 800) + commission,
      balanceAfter: 14850000 + order.totalPrice,
      status: "COMPLETED",
      notes: `Commande livrée. Commission ENO: ${commission} FCFA (${platformSettings.financial?.defaultCommissionRate ?? 5}%). Crédit net marchand: ${netCredit} FCFA.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Notification si activée
    if (platformSettings.notifications?.orders?.orderDelivered) {
      addNotification({
        category: "COMMANDES",
        priority: "INFO",
        title: "📦 Commande livrée & encaissée",
        description: `${order.orderNumber} livrée avec succès à ${order.clientName}. Net marchand: ${netCredit.toLocaleString("fr-FR")} FCFA.`,
        actionUrl: "/admin/commandes",
        referenceType: "ORDER",
        referenceId: order.id,
      });
    }
  };

  const markOrderFailed = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "REFUSEE",
              updatedAt: new Date().toISOString(),
              comment: `Livraison échouée : ${reason}`,
            }
          : o
      )
    );
  };

  const requestPayout = (
    amount: number,
    operator: PayoutOperator,
    phone: string,
    countryCode = "+229",
    cryptoAddress?: string,
    cryptoNetwork?: string,
    binancePayId?: string,
    binanceEmail?: string
  ): PayoutRequest => {
    const partner = partners.find((p) => p.id === activePartnerId) || currentPartner;

    // 🎯 Source de Vérité Centrale : Validation selon la configuration active
    const validation = validateWithdrawalRequest(
      platformSettings,
      partner,
      amount,
      operator,
      { phone, cryptoAddress, cryptoNetwork, binancePayId, binanceEmail }
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.join(" | "));
    }

    const initialStatus: PayoutStatus = validation.isAutoApproved ? "APPROVED" : "PENDING";
    const balanceBefore = partner.availableBalance || 0;
    const balanceAfter = Math.max(0, balanceBefore - amount);

    // 🔒 Verrouillage Transactionnel du Solde
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partner.id
          ? { ...p, availableBalance: balanceAfter }
          : p
      )
    );

    const newReq: PayoutRequest = {
      id: `WDR-${Date.now().toString().slice(-6)}`,
      partnerId: partner.id,
      partnerName: partner.companyName,
      amount,
      reservedAmount: amount, // Montant réservé / verrouillé
      operator,
      phone,
      countryCode,
      cryptoAddress,
      cryptoNetwork,
      binancePayId,
      binanceEmail,
      cryptoEstimatedUsdt: cryptoAddress ? Math.round(amount / 655) : undefined,
      requestedAt: new Date().toISOString(),
      status: initialStatus,
      balanceBefore,
      balanceAfter,
      txReference: `TX-REQ-${Date.now().toString().slice(-6)}`,
    };

    setPayoutRequests((prev) => [newReq, ...prev]);

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: validation.requiresDoubleValidation ? "CRITICAL" : "INFO",
      title: "Nouvelle demande de retrait",
      description: `Demande de ${amount.toLocaleString("fr-FR")} FCFA par ${partner.companyName} (${operator}).`,
      actionUrl: "/admin/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: newReq.id,
    });

    // 🛡️ Audit Centralisé
    logAuditEvent({
      actor: {
        id: partner.id,
        name: partner.companyName,
        role: "Marchand",
        type: "USER",
      },
      action: "WITHDRAWAL_CREATED",
      actionLabel: "Création de demande de retrait",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: newReq.id,
      entityReference: newReq.id,
      severity: "INFO",
      result: "SUCCESS",
      description: `Demande de retrait de ${amount} FCFA (${operator}). Statut: ${initialStatus}. Solde verrouillé: ${amount} FCFA.`,
      afterState: newReq as any,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: partner.id,
        partnerName: partner.companyName,
        amount,
        operator,
        phone,
        countryCode,
        cryptoAddress,
        cryptoNetwork,
        binancePayId,
        binanceEmail,
        idempotencyKey: newReq.id,
        availableBalance: balanceBefore,
      }),
    }).catch((err) => console.warn("Sync withdrawal backend fallback:", err));

    return newReq;
  };

  const addLivreur = (data: {
    name: string;
    email: string;
    phone: string;
    zone: string;
    secondaryZones?: string[];
    vehicle: string;
    licensePlate?: string;
    maxActiveCapacity?: number;
    commissionPerDelivery?: number;
    availabilityStatus?: LivreurStatus;
  }): LivreurProfile => {
    const newL: LivreurProfile = {
      id: `liv-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      zone: data.zone,
      secondaryZones: data.secondaryZones || [],
      vehicle: data.vehicle,
      licensePlate: data.licensePlate || "RB-0000-XX",
      isActive: true,
      availabilityStatus: data.availabilityStatus || "AVAILABLE",
      mustChangePassword: true,
      temporaryCode: Math.floor(100000 + Math.random() * 900000).toString(),
      assignedOrdersCount: 0,
      maxActiveCapacity: data.maxActiveCapacity || 8,
      deliveredTodayCount: 0,
      deliveredWeekCount: 0,
      deliveredMonthCount: 0,
      failedTodayCount: 0,
      cashCollectedToday: 0,
      commissionPerDelivery: data.commissionPerDelivery || 1500,
      successRate: 100,
      avgDeliveryTimeMinutes: 30,
      lastActivityAt: "À l'instant",
    };
    setLivreurs((prev) => [...prev, newL]);
    return newL;
  };

  const updateLivreurAvailability = (livreurId: string, status: LivreurStatus) => {
    setLivreurs((prev) =>
      prev.map((l) => (l.id === livreurId ? { ...l, availabilityStatus: status } : l))
    );
  };

  const updateLivreur = (livreurId: string, data: Partial<LivreurProfile>) => {
    setLivreurs((prev) =>
      prev.map((l) => (l.id === livreurId ? { ...l, ...data } : l))
    );
  };

  const reassignLivreurOrders = (fromLivreurId: string, toLivreurId: string) => {
    const targetLivreur = livreurs.find((l) => l.id === toLivreurId);
    if (!targetLivreur) return;

    let count = 0;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.assignedLivreurId === fromLivreurId && (o.status === "EN_COURS" || o.status === "CONFIRMEE")) {
          count++;
          return {
            ...o,
            assignedLivreurId: targetLivreur.id,
            assignedLivreurName: targetLivreur.name,
            updatedAt: new Date().toISOString(),
            comment: `Réassigné à ${targetLivreur.name} (${targetLivreur.zone})`,
          };
        }
        return o;
      })
    );

    setLivreurs((prev) =>
      prev.map((l) => {
        if (l.id === fromLivreurId) return { ...l, assignedOrdersCount: 0 };
        if (l.id === toLivreurId) return { ...l, assignedOrdersCount: l.assignedOrdersCount + count };
        return l;
      })
    );
  };

  const addCloseuse = (data: {
    name: string;
    email: string;
    phone: string;
    languages?: string[];
    zones?: string[];
    skills?: string[];
    maxActiveOrders?: number;
    maxActiveConversations?: number;
    commissionPerConfirmation?: number;
    availabilityStatus?: CloseuseStatus;
  }): CloseuseProfile => {
    const newC: CloseuseProfile = {
      id: `cls-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      isActive: true,
      availabilityStatus: data.availabilityStatus || "AVAILABLE",
      mustChangePassword: true,
      temporaryCode: Math.floor(100000 + Math.random() * 900000).toString(),
      callsTodayCount: 0,
      confirmedTodayCount: 0,
      confirmedWeekCount: 0,
      confirmedMonthCount: 0,
      cancelledTodayCount: 0,
      unreachableTodayCount: 0,
      callbacksScheduledToday: 0,
      conversionRate: 85,
      maxActiveOrders: data.maxActiveOrders || 15,
      maxActiveConversations: data.maxActiveConversations || 5,
      activeOrdersCount: 0,
      activeConversationsCount: 0,
      commissionPerConfirmation: data.commissionPerConfirmation || 750,
      avgProcessingTimeMinutes: 4.5,
      languages: data.languages || ["Français", "Fon"],
      zones: data.zones || ["Cotonou"],
      skills: data.skills || ["Généraliste"],
      lastActivityAt: "À l'instant",
    };
    setCloseuses((prev) => [...prev, newC]);
    return newC;
  };

  const updateCloseuse = (closeuseId: string, data: Partial<CloseuseProfile>) => {
    setCloseuses((prev) =>
      prev.map((c) => (c.id === closeuseId ? { ...c, ...data } : c))
    );
  };

  const reassignCloseuseOrders = (fromCloseuseId: string, toCloseuseId: string) => {
    const targetCloser = closeuses.find((c) => c.id === toCloseuseId);
    if (!targetCloser) return;

    let count = 0;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.assignedCloseuseId === fromCloseuseId && (o.status === "EN_ATTENTE" || o.status === "A_RAPPELER")) {
          count++;
          return {
            ...o,
            assignedCloseuseId: targetCloser.id,
            assignedCloseuseName: targetCloser.name,
            updatedAt: new Date().toISOString(),
            comment: `Réassigné à la closeuse ${targetCloser.name}`,
          };
        }
        return o;
      })
    );
  };

  const addPartner = (data: Partial<Partner>): Partner => {
    const newP: Partner = {
      id: `p-${Date.now()}`,
      fullName: data.fullName || "Propriétaire",
      companyName: data.companyName || "Nouvelle Boutique",
      email: data.email || "contact@boutique.bj",
      phone: data.phone || "+229 01 00 00 00",
      address: data.address || "Cotonou, Bénin",
      city: data.city || "Cotonou",
      isActive: true,
      isApproved: true,
      status: data.status || "ACTIVE",
      category: data.category || "Généraliste",
      websiteUrl: data.websiteUrl || "",
      deliveryFeeDefault: data.deliveryFeeDefault || 2000,
      agencyCommissionDefault: data.agencyCommissionDefault || 800,
      onboardingStep: data.onboardingStep || 1,
      availableBalance: 0,
      pendingBalance: 0,
      ordersCountToday: 0,
      ordersCountMonth: 0,
      gmvProcessed: 0,
      confirmationRate: 0,
      deliverySuccessRate: 0,
      lastPayoutDate: "Nouveau",
      lastActivityAt: "À l'instant",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPartners((prev) => [...prev, newP]);
    return newP;
  };

  const updatePartner = (partnerId: string, data: Partial<Partner>) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, ...data } : p))
    );
  };

  const suspendPartner = (partnerId: string, reason: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              isActive: false,
              status: "SUSPENDED",
              suspensionReason: reason,
              lastActivityAt: `Suspendu le ${new Date().toLocaleDateString("fr-FR")}`,
            }
          : p
      )
    );
  };

  const reactivatePartner = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              isActive: true,
              status: "ACTIVE",
              suspensionReason: undefined,
              lastActivityAt: "Réactivé à l'instant",
            }
          : p
      )
    );
  };

  const changePassword = (_newPassword: string) => {};

  const approvePayout = (payoutId: string) => {
    approveWithdrawal(payoutId);
  };

  const validatePayout = (payoutId: string) => {
    approveWithdrawal(payoutId);
  };

  const verifyWithdrawal = (withdrawalId: string, internalNote?: string) => {
    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === withdrawalId
          ? {
              ...p,
              status: "IN_VERIFICATION",
              internalNote: internalNote || p.internalNote,
            }
          : p
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Demande de retrait mise en vérification",
        actor: "Direction ENO (Super Admin)",
        targetType: "WITHDRAWAL",
        targetId: withdrawalId,
        details: internalNote || "Contrôle de sécurité des coordonnées de paiement.",
      },
      ...prev,
    ]);
  };

  const approveWithdrawal = (withdrawalId: string, internalNote?: string) => {
    const payout = payoutRequests.find((p) => p.id === withdrawalId);
    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === withdrawalId
          ? {
              ...p,
              status: "APPROVED",
              approvedAt: new Date().toISOString(),
              internalNote: internalNote || p.internalNote,
              txReference: p.txReference || `TX-VAL-${Date.now()}`,
            }
          : p
      )
    );

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: "INFO",
      title: "Retrait approuvé",
      description: `La demande de retrait de ${payout?.amount?.toLocaleString("fr-FR") || ""} FCFA (${payout?.partnerName || "Marchand"}) a été approuvée. Prêt pour virement.`,
      actionUrl: "/admin/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: withdrawalId,
    });

    // 🛡️ Audit Centralisé
    logAuditEvent({
      actor: { id: "USR-PDG-001", name: currentUserProfile.name, role: "Super Admin", type: "USER" },
      action: "WITHDRAWAL_APPROVED",
      actionLabel: "Approbation de demande de retrait",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: withdrawalId,
      entityReference: withdrawalId,
      severity: "WARNING",
      result: "SUCCESS",
      description: `Demande de retrait ${withdrawalId} approuvée par ${currentUserProfile.name}.`,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: withdrawalId, action: "APPROVE", internalNote }),
    }).catch((err) => console.warn("Sync approve withdrawal fallback:", err));
  };

  const rejectWithdrawal = (withdrawalId: string, reason: string) => {
    const payout = payoutRequests.find((p) => p.id === withdrawalId);
    if (!payout) return;

    // Restituer le montant réservé au solde disponible
    if (payout.partnerId) {
      setPartners((prev) =>
        prev.map((prt) =>
          prt.id === payout.partnerId
            ? {
                ...prt,
                availableBalance: (prt.availableBalance || 0) + (payout.reservedAmount || payout.amount),
              }
            : prt
        )
      );
    }

    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === withdrawalId
          ? {
              ...p,
              status: "REJECTED",
              reservedAmount: 0,
              rejectionReason: reason || "Demande refusée par la direction.",
            }
          : p
      )
    );

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: "URGENT",
      title: "⚠️ Retrait rejeté",
      description: `Votre demande de retrait de ${payout.amount.toLocaleString("fr-FR")} FCFA a été rejetée (${reason}). Le montant a été réintégré à votre solde disponible.`,
      actionUrl: "/admin/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: withdrawalId,
    });

    // 🛡️ Audit Centralisé
    logAuditEvent({
      actor: { id: "USR-PDG-001", name: currentUserProfile.name, role: "Super Admin", type: "USER" },
      action: "WITHDRAWAL_REJECTED",
      actionLabel: "Rejet de demande de retrait",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: withdrawalId,
      entityReference: withdrawalId,
      severity: "WARNING",
      result: "SUCCESS",
      description: `Demande de retrait ${withdrawalId} rejetée. Motif: ${reason}. Montant réintégré: ${payout.amount} FCFA.`,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: withdrawalId, action: "REJECT", rejectionReason: reason }),
    }).catch((err) => console.warn("Sync reject withdrawal fallback:", err));
  };

  const payWithdrawal = (withdrawalId: string, paymentReference: string, adminName = "Direction ENO") => {
    const payout = payoutRequests.find((p) => p.id === withdrawalId);
    if (!payout || payout.status === "PAID") return;

    const partner = partners.find((p) => p.id === payout.partnerId);
    const balanceBefore = (partner?.availableBalance || 0) + (payout.reservedAmount || payout.amount);
    const balanceAfter = Math.max(0, partner?.availableBalance || 0);

    // Exécution de l'adaptateur de paiement
    const provider = getPaymentProvider(payout.operator, platformSettings);
    const ref = paymentReference || `REF-${Date.now().toString().slice(-6)}`;

    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === withdrawalId
          ? {
              ...p,
              status: "PAID",
              paidAt: new Date().toISOString(),
              paymentReference: ref,
              adminProcessorName: adminName,
              reservedAmount: 0,
              balanceBefore,
              balanceAfter,
              txReference: `TX-PAY-${Date.now()}`,
            }
          : p
      )
    );

    // Mettre à jour la date du dernier virement partenaire
    if (partner) {
      setPartners((prev) =>
        prev.map((prt) =>
          prt.id === partner.id
            ? {
                ...prt,
                lastPayoutDate: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
              }
            : prt
        )
      );
    }

    // Ajouter l'écriture comptable au Grand Livre de Trésorerie
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      txReference: `TX-RET-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "RETRAIT",
      label: `Retrait Marchand ${payout.partnerName} (${payout.operator})`,
      partnerId: payout.partnerId,
      partnerName: payout.partnerName,
      inflow: 0,
      outflow: payout.amount,
      balanceAfter: 14850000 - payout.amount,
      status: "COMPLETED",
      notes: `Virement exécuté (${payout.operator}). Réf: ${ref}. Adaptateur: ${provider.name}. Traité par ${adminName}.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: "INFO",
      title: "🏦 Retrait effectué",
      description: `Votre retrait de ${payout.amount.toLocaleString("fr-FR")} FCFA a été effectué avec succès (${payout.operator}). Réf: ${ref}.`,
      actionUrl: "/admin/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: withdrawalId,
    });

    // 🛡️ Audit Centralisé
    logAuditEvent({
      actor: { id: "USR-PDG-001", name: adminName, role: "Super Admin", type: "USER" },
      action: "WITHDRAWAL_PAID",
      actionLabel: "Virement de retrait payé & archivé",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: withdrawalId,
      entityReference: withdrawalId,
      severity: "INFO",
      result: "SUCCESS",
      description: `Règlement de ${payout.amount} FCFA (${payout.operator}) exécuté avec succès. Réf: ${ref}.`,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: withdrawalId, action: "PAY", paymentReference: ref, adminName }),
    }).catch((err) => console.warn("Sync pay withdrawal fallback:", err));
  };

  const payPayout = (payoutId: string, paymentReference: string, adminName = "Direction ENO") => {
    payWithdrawal(payoutId, paymentReference, adminName);
  };

  const rejectPayout = (payoutId: string, reason?: string) => {
    rejectWithdrawal(payoutId, reason || "Demande refusée par la direction.");
  };

  const declareRemittance = (
    livreurId: string,
    amountDeclared: number,
    orderIds: string[],
    notes?: string
  ): CodRemittance => {
    const livreur = livreurs.find((l) => l.id === livreurId);
    const newRem: CodRemittance = {
      id: `rem-${Date.now()}`,
      reference: `REM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      livreurId,
      livreurName: livreur?.name || "Livreur",
      amountExpected: amountDeclared,
      amountDeclared,
      ordersCount: orderIds.length,
      orderIds,
      period: `Remise du ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "PENDING_VALIDATION",
      notes,
    };

    setCodRemittances((prev) => [newRem, ...prev]);

    // Mettre à jour les statuts de remise des commandes concernées
    setCodCollections((prev) =>
      prev.map((c) =>
        orderIds.includes(c.orderId)
          ? { ...c, remittanceStatus: "REMITTANCE_PENDING", remittanceId: newRem.id }
          : c
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Remise de fonds déclarée par le livreur",
        actor: livreur?.name || "Livreur",
        targetType: "REMITTANCE",
        targetId: newRem.reference,
        amount: amountDeclared,
        details: `${amountDeclared} FCFA déclarés sur ${orderIds.length} colis livrés.`,
      },
      ...prev,
    ]);

    return newRem;
  };

  const validateRemittance = (remittanceId: string, amountValidated?: number) => {
    const rem = codRemittances.find((r) => r.id === remittanceId);
    if (!rem) return;

    const validatedAmt = amountValidated ?? rem.amountDeclared;

    setCodRemittances((prev) =>
      prev.map((r) =>
        r.id === remittanceId
          ? {
              ...r,
              status: "VALIDATED",
              amountValidated: validatedAmt,
              validatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
              validatedBy: "Direction ENO (Super Admin)",
            }
          : r
      )
    );

    // Mettre à jour les collections
    setCodCollections((prev) =>
      prev.map((c) =>
        rem.orderIds.includes(c.orderId) || c.remittanceId === remittanceId
          ? { ...c, remittanceStatus: "VALIDATED" }
          : c
      )
    );

    // Écriture de remise dans le Grand Livre
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      txReference: `TX-REM-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "REMISE_LIVREUR",
      label: `Remise de fonds ${rem.livreurName} (${rem.reference})`,
      livreurId: rem.livreurId,
      livreurName: rem.livreurName,
      inflow: validatedAmt,
      outflow: 0,
      balanceAfter: 14850000 + validatedAmt,
      status: "COMPLETED",
      notes: `Fonds vérifiés et encaissés au coffre-fort. ${rem.ordersCount} commandes validées.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Remise de fonds validée par le PDG",
        actor: "Direction ENO (Super Admin)",
        targetType: "REMITTANCE",
        targetId: rem.reference,
        amount: validatedAmt,
        details: `Validation physique au coffre de ${validatedAmt} FCFA. Commandes libérées.`,
      },
      ...prev,
    ]);
  };

  const disputeRemittance = (remittanceId: string, notes: string) => {
    setCodRemittances((prev) =>
      prev.map((r) =>
        r.id === remittanceId
          ? {
              ...r,
              status: "DISPUTED",
              notes: `${r.notes ? r.notes + " | " : ""}Contestation PDG: ${notes}`,
            }
          : r
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Remise de fonds contestée par la direction",
        actor: "Direction ENO (Super Admin)",
        targetType: "REMITTANCE",
        targetId: remittanceId,
        details: `Motif de contestation: ${notes}`,
      },
      ...prev,
    ]);
  };

  const reportCodDiscrepancy = (orderId: string, actualAmount: number, justification: string) => {
    setCodCollections((prev) =>
      prev.map((c) => {
        if (c.orderId === orderId) {
          const discrepancy = actualAmount - c.expectedAmount;
          return {
            ...c,
            collectedAmount: actualAmount,
            discrepancy,
            discrepancyJustification: justification,
            collectionStatus: discrepancy !== 0 ? "DISCREPANCY_FLAGGED" : "COLLECTED",
            remittanceStatus: discrepancy !== 0 ? "DISCREPANCY_DETECTED" : c.remittanceStatus,
          };
        }
        return c;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Écart d'encaissement signalé",
        actor: "Opérations / Livreur",
        targetType: "DISCREPANCY",
        targetId: orderId,
        amount: actualAmount,
        details: `Justification enregistrée: ${justification}`,
      },
      ...prev,
    ]);
  };

  // 🎯 SOURCE UNIQUE DE VÉRITÉ : Calcul transparent des fonds COD par livreur
  const getDriverCodFunds = (driverId: string): DriverCodFinancialSummary => {
    const driver = livreurs.find((l) => l.id === driverId);
    const driverName = driver?.name || "Livreur";

    // Collections liées à ce livreur
    const driverCols = codCollections.filter((c) => c.livreurId === driverId);
    
    // Commandes non encore validées au coffre
    const unremittedCols = driverCols.filter(
      (c) => c.remittanceStatus !== "VALIDATED" && c.collectionStatus !== "NOT_COLLECTED"
    );

    // Montant restant à remettre = somme des encaissements sur ces colis (toujours >= 0)
    let fundsToRemit = unremittedCols.reduce((sum, c) => sum + Math.max(0, c.collectedAmount), 0);
    
    // Si aucune collection mock n'existe encore pour ce livreur, attribuer une valeur cohérente non-négative
    if (driverCols.length === 0) {
      fundsToRemit = driverId === "liv-1" ? 150000 : driverId === "liv-2" ? 50000 : driverId === "liv-3" ? 0 : 75000;
    }

    const unremittedOrderIds = unremittedCols.map((c) => c.orderId);
    const unremittedOrdersCount = unremittedCols.length > 0 ? unremittedCols.length : (fundsToRemit > 0 ? 3 : 0);

    const totalCodCollected = 2500000;
    const totalFundsRemitted = Math.max(0, totalCodCollected - fundsToRemit);

    const ceilingThreshold = 100000;

    let statusLevel: "ZERO" | "NORMAL" | "ATTENTION" | "URGENT" = "NORMAL";
    let statusLabel = "Fonds normaux";

    if (fundsToRemit === 0) {
      statusLevel = "ZERO";
      statusLabel = "✓ Aucun fonds en attente";
    } else if (fundsToRemit >= 150000) {
      statusLevel = "URGENT";
      statusLabel = "🔴 Action requise (Plafond dépassé)";
    } else if (fundsToRemit >= ceilingThreshold) {
      statusLevel = "ATTENTION";
      statusLabel = "⚠️ Attention (Proche plafond)";
    } else {
      statusLevel = "NORMAL";
      statusLabel = "Fonds normaux";
    }

    return {
      livreurId: driverId,
      livreurName: driverName,
      totalCodCollected,
      totalFundsRemitted,
      fundsToRemit,
      unremittedOrdersCount,
      unremittedOrderIds,
      lastRemittanceDate: "Aujourd'hui à 10:42",
      nextRemittanceDeadline: "Aujourd'hui — 18:00",
      ceilingThreshold,
      statusLevel,
      statusLabel,
    };
  };

  // 👥 Gestion des Responsables de Trésorerie par le PDG
  const addTreasuryManager = (data: Partial<TreasuryManagerProfile>): TreasuryManagerProfile => {
    const firstName = data.firstName || "Nouveau";
    const lastName = data.lastName || "Responsable";
    const newTm: TreasuryManagerProfile = {
      id: `tm-${Date.now()}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: data.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@enolivraison.com`,
      phone: data.phone || "+229 01 00 00 00 00",
      zone: data.zone || "Hub Central Cotonou",
      status: data.status || "ACTIF",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastActiveAt: "À l'instant",
      remittancesReceivedCount: 0,
      totalFundsReceived: 0,
      discrepanciesFlaggedCount: 0,
      notes: data.notes,
    };

    setTreasuryManagers((prev) => [newTm, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Création d'un Responsable de Trésorerie",
        actor: "Direction ENO (Super Admin)",
        targetType: "PARTNER",
        targetId: newTm.id,
        details: `Compte trésorier créé pour ${newTm.name} (${newTm.zone}).`,
      },
      ...prev,
    ]);

    return newTm;
  };

  const updateTreasuryManager = (id: string, data: Partial<TreasuryManagerProfile>) => {
    setTreasuryManagers((prev) =>
      prev.map((tm) => {
        if (tm.id === id) {
          const updated = { ...tm, ...data };
          if (data.firstName || data.lastName) {
            updated.name = `${updated.firstName} ${updated.lastName}`.trim();
          }
          return updated;
        }
        return tm;
      })
    );
  };

  const toggleTreasuryManagerStatus = (id: string, status: EmployeeStatus) => {
    setTreasuryManagers((prev) =>
      prev.map((tm) => (tm.id === id ? { ...tm, status } : tm))
    );
  };

  const deleteTreasuryManager = (id: string) => {
    setTreasuryManagers((prev) => prev.filter((tm) => tm.id !== id));
  };

  // ⚡ Workflow Rapide (< 1min) de Réception Physique de Remise par le Trésorier
  const receiveDriverRemittance = ({
    livreurId,
    receivedAmount,
    receivedBy,
    receivedById,
    notes,
    discrepancyReason,
  }: {
    livreurId: string;
    receivedAmount: number;
    receivedBy: string;
    receivedById?: string;
    notes?: string;
    discrepancyReason?: string;
  }): CodRemittance => {
    const driverSummary = getDriverCodFunds(livreurId);
    const expectedAmount = driverSummary.fundsToRemit;
    const difference = expectedAmount - receivedAmount;
    const isDiscrepancy = difference > 0;

    const ref = `RM-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString().replace("T", " ").slice(0, 16);

    const newRemittance: CodRemittance = {
      id: `rem-${Date.now()}`,
      reference: ref,
      livreurId,
      livreurName: driverSummary.livreurName,
      amountExpected: expectedAmount,
      amountDeclared: receivedAmount,
      receivedAmount,
      amountValidated: receivedAmount,
      discrepancyAmount: isDiscrepancy ? difference : 0,
      discrepancyReason: isDiscrepancy ? discrepancyReason : undefined,
      ordersCount: driverSummary.unremittedOrdersCount,
      orderIds: driverSummary.unremittedOrderIds,
      period: `Tournée du ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: nowIso,
      receivedAt: nowIso,
      receivedBy,
      receivedById,
      validatedAt: nowIso,
      validatedBy: receivedBy,
      status: isDiscrepancy ? "DISCREPANCY_DETECTED" : "VALIDATED",
      notes,
    };

    setCodRemittances((prev) => [newRemittance, ...prev]);

    // Mettre à jour les statuts des encaissements concernés
    setCodCollections((prev) =>
      prev.map((c) => {
        if (c.livreurId === livreurId && c.remittanceStatus !== "VALIDATED") {
          return {
            ...c,
            remittanceStatus: isDiscrepancy ? "DISCREPANCY_DETECTED" : "VALIDATED",
            remittanceId: newRemittance.id,
          };
        }
        return c;
      })
    );

    // Mettre à jour les statistiques du trésorier qui a reçu les fonds
    if (receivedById) {
      setTreasuryManagers((prev) =>
        prev.map((tm) =>
          tm.id === receivedById
            ? {
                ...tm,
                remittancesReceivedCount: tm.remittancesReceivedCount + 1,
                totalFundsReceived: tm.totalFundsReceived + receivedAmount,
                discrepanciesFlaggedCount: isDiscrepancy
                  ? tm.discrepanciesFlaggedCount + 1
                  : tm.discrepanciesFlaggedCount,
                lastActiveAt: "À l'instant",
              }
            : tm
        )
      );
    }

    // Ajouter l'écriture comptable au Grand Livre
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      txReference: `TX-REM-${ref}`,
      date: nowIso,
      type: "REMISE_LIVREUR",
      label: `Remise d'espèces ${driverSummary.livreurName} (${ref})`,
      livreurId,
      livreurName: driverSummary.livreurName,
      inflow: receivedAmount,
      outflow: 0,
      balanceAfter: 15200000 + receivedAmount,
      status: "COMPLETED",
      notes: `Reçu physiquement par ${receivedBy}.${isDiscrepancy ? ` Écart: -${difference} FCFA.` : " Montant exact validé au coffre."}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Consigner dans le Journal d'Audit inaltérable
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: nowIso,
        action: isDiscrepancy ? "Remise reçue avec écart détecté" : "Réception & Validation de remise physique",
        actor: `${receivedBy} (Responsable de trésorerie)`,
        targetType: "REMITTANCE",
        targetId: ref,
        amount: receivedAmount,
        details: isDiscrepancy
          ? `${receivedAmount} FCFA reçus de ${driverSummary.livreurName} (Attendu: ${expectedAmount} FCFA, Écart: -${difference} FCFA). Motif: ${discrepancyReason || "Non précisé"}.`
          : `${receivedAmount} FCFA reçus de ${driverSummary.livreurName}. Validation complète sans écart.`,
      },
      ...prev,
    ]);

    // Consigner dans le Journal Global d'Audit de la Plateforme
    logAuditEvent({
      actor: {
        id: receivedById || "tm-1",
        name: receivedBy,
        role: "Responsable de trésorerie",
        type: "USER",
      },
      action: isDiscrepancy ? "REMITTANCE_DISCREPANCY_FLAGGED" : "REMITTANCE_VALIDATED",
      actionLabel: isDiscrepancy ? "A réceptionné une remise avec écart" : "A validé la remise au coffre",
      module: "TRESORERIE",
      entityType: "REMITTANCE",
      entityId: newRemittance.id,
      entityReference: ref,
      severity: isDiscrepancy ? "WARNING" : "INFO",
      result: "SUCCESS",
      description: isDiscrepancy
        ? `Remise ${ref} reçue avec un écart de ${difference} FCFA (Attendu: ${expectedAmount} FCFA, Reçu: ${receivedAmount} FCFA). Motif: ${discrepancyReason || "Non précisé"}`
        : `Remise ${ref} de ${receivedAmount} FCFA validée intégralement et déposée au coffre-fort.`,
      reason: isDiscrepancy ? discrepancyReason : undefined,
      financeTxRef: newTx.txReference,
      beforeState: { fundsToRemit: expectedAmount },
      afterState: { fundsToRemit: isDiscrepancy ? difference : 0, receivedAmount },
    });

    // Alerte pour le PDG si écart
    if (isDiscrepancy) {
      const newAlert: AgencyAlert = {
        id: `alt-disc-${Date.now()}`,
        severity: "CRITICAL",
        title: `Écart de caisse sur remise ${ref}`,
        description: `${driverSummary.livreurName} a remis ${receivedAmount} FCFA au lieu de ${expectedAmount} FCFA (-${difference} FCFA). Reçu par ${receivedBy}. Motif: ${discrepancyReason || "À arbitrer"}.`,
        actionLabel: "Examiner",
        actionHref: "/pdg/finance",
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    return newRemittance;
  };

  const addTransaction = (data: Partial<FinancialTransaction>): FinancialTransaction => {
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      txReference: data.txReference || `TX-${Date.now().toString().slice(-6)}`,
      date: data.date || new Date().toISOString().replace("T", " ").slice(0, 16),
      type: data.type || "AJUSTEMENT",
      label: data.label || "Opération financière",
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      livreurId: data.livreurId,
      livreurName: data.livreurName,
      orderNumber: data.orderNumber,
      inflow: data.inflow || 0,
      outflow: data.outflow || 0,
      balanceAfter: data.balanceAfter || 14850000,
      status: data.status || "COMPLETED",
      notes: data.notes,
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const sendConversationMessage = (
    convId: string,
    text: string,
    isInternalNote = false,
    attachments?: ChatAttachment[] | {
      name: string;
      url?: string;
      type?: "IMAGE" | "PDF" | "DOC";
      size?: string;
    }
  ) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const now = new Date();
    const sentAtStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Normaliser les pièces jointes
    let normalizedAttachments: ChatAttachment[] = [];
    if (Array.isArray(attachments)) {
      normalizedAttachments = attachments;
    } else if (attachments && attachments.name) {
      normalizedAttachments = [
        {
          id: `att_${Date.now()}`,
          fileName: attachments.name,
          mimeType:
            attachments.type === "PDF"
              ? "application/pdf"
              : attachments.type === "IMAGE"
              ? "image/jpeg"
              : "application/octet-stream",
          fileSize: attachments.size || "Fichier",
          fileSizeBytes: 0,
          url: attachments.url || "",
          type: attachments.type || "DOC",
          createdAt: now.toISOString(),
          status: "UPLOADED",
        },
      ];
    }

    const hasAttachments = normalizedAttachments.length > 0;
    const attachmentSummary = hasAttachments
      ? ` (${normalizedAttachments.length} pièce${normalizedAttachments.length > 1 ? "s" : ""} jointe${normalizedAttachments.length > 1 ? "s" : ""})`
      : "";

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: currentRole === "TREASURY_MANAGER" ? "TREASURY" : currentRole === "CLOSEUSE" ? "AGENT" : "PDG",
      senderName:
        currentRole === "TREASURY_MANAGER"
          ? activeTreasuryManager?.name || "Responsable Trésorerie"
          : currentRole === "CLOSEUSE"
          ? activeCloseuse?.name || "Opératrice Télévente"
          : "Jude S. (PDG)",
      text,
      sentAt: sentAtStr,
      isInternalNote,
      attachments: normalizedAttachments,
      // Rétrocompatibilité
      attachmentName: normalizedAttachments[0]?.fileName,
      attachmentUrl: normalizedAttachments[0]?.url,
      attachmentType: normalizedAttachments[0]?.type,
      attachmentSize: normalizedAttachments[0]?.fileSize,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: isInternalNote
                ? `[Note Interne] ${text || "Fichier joint"}${attachmentSummary}`
                : `${text || "Fichier joint"}${attachmentSummary}`,
              lastMessageAt: "À l'instant",
              status: c.status === "RESOLVED" ? "OPEN" : c.status,
              messages: [...c.messages, newMessage],
            }
          : c
      )
    );

    // Persistance asynchrone sur le serveur
    fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        isInternalNote,
        attachments: normalizedAttachments,
        sender: newMessage.sender,
        senderName: newMessage.senderName,
      }),
    }).catch((err) => {
      console.warn("Erreur synchronisation message serveur:", err);
    });

    // Audit log central
    logAuditEvent({
      actor: {
        id: "usr-current",
        name: newMessage.senderName,
        role: currentRole,
        type: "USER",
      },
      action: hasAttachments ? "ATTACHMENT_UPLOADED" : isInternalNote ? "INTERNAL_NOTE_CREATED" : "MESSAGE_SENT",
      actionLabel: hasAttachments
        ? `A envoyé ${normalizedAttachments.length} pièce(s) jointe(s)`
        : isInternalNote
        ? "A rédigé une note interne confidentielle"
        : "A envoyé un message support",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "INFO",
      result: "SUCCESS",
      description: hasAttachments
        ? `Fichiers envoyés à ${targetConv?.companyName} : ${normalizedAttachments.map((a) => a.fileName).join(", ")}`
        : isInternalNote
        ? `Note interne ajoutée à la conversation ${targetConv?.companyName} : "${text.slice(0, 60)}..."`
        : `Message support envoyé à ${targetConv?.companyName} : "${text.slice(0, 60)}..."`,
    });
  };

  const assignConversation = (convId: string, agentName: string, agentRole: string, reason?: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const nowIso = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newHistoryItem = {
      id: `ah_${Date.now()}`,
      assignedToName: agentName,
      assignedToRole: agentRole,
      timestamp: `${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — ${nowIso}`,
      reason: reason || "Assignation manuelle",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              assignedAgentName: agentName,
              assignedAgentRole: agentRole,
              status: c.status === "UNASSIGNED" ? "OPEN" : c.status,
              assignmentHistory: [newHistoryItem, ...(c.assignmentHistory || [])],
            }
          : c
      )
    );

    logAuditEvent({
      actor: {
        id: "usr-pdg",
        name: "Jude S. (PDG)",
        role: "Super Admin",
        type: "USER",
      },
      action: "CONVERSATION_ASSIGNED",
      actionLabel: "A assigné la conversation",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "INFO",
      result: "SUCCESS",
      description: `Conversation ${targetConv?.companyName} assignée à ${agentName} (${agentRole}).`,
      reason,
      beforeState: { assignedAgentName: targetConv?.assignedAgentName },
      afterState: { assignedAgentName: agentName, assignedAgentRole: agentRole },
    });
  };

  const transferConversation = (
    convId: string,
    toAgentName: string,
    toAgentRole: string,
    reason: string
  ) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const prevAgent = targetConv?.assignedAgentName || "Non assigné";
    const nowIso = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newHistoryItem = {
      id: `ah_${Date.now()}`,
      assignedToName: toAgentName,
      assignedToRole: toAgentRole,
      timestamp: `${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — ${nowIso}`,
      reason: `Transféré depuis ${prevAgent} : ${reason}`,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              assignedAgentName: toAgentName,
              assignedAgentRole: toAgentRole,
              assignmentHistory: [newHistoryItem, ...(c.assignmentHistory || [])],
            }
          : c
      )
    );

    logAuditEvent({
      actor: {
        id: "usr-pdg",
        name: "Jude S. (PDG)",
        role: "Super Admin",
        type: "USER",
      },
      action: "CONVERSATION_TRANSFERRED",
      actionLabel: "A transféré la conversation",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "WARNING",
      result: "SUCCESS",
      description: `Transfert de ${prevAgent} vers ${toAgentName} (${toAgentRole}). Motif : ${reason}`,
      reason,
      beforeState: { assignedAgentName: prevAgent },
      afterState: { assignedAgentName: toAgentName, assignedAgentRole: toAgentRole },
    });
  };

  const takeoverConversation = (convId: string) => {
    assignConversation(convId, "Jude S. (PDG)", "Direction Générale", "Prise en charge directe par le PDG (Takeover)");
  };

  const resolveConversation = (convId: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: "RESOLVED", unreadCount: 0 } : c))
    );

    logAuditEvent({
      actor: {
        id: "usr-pdg",
        name: "Jude S. (PDG)",
        role: "Super Admin",
        type: "USER",
      },
      action: "CONVERSATION_RESOLVED",
      actionLabel: "A marqué la conversation comme résolue",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "INFO",
      result: "SUCCESS",
      description: `Support pour ${targetConv?.companyName} marqué comme résolu avec succès.`,
    });
  };

  const reopenConversation = (convId: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: "OPEN" } : c))
    );

    logAuditEvent({
      actor: {
        id: "usr-pdg",
        name: "Jude S. (PDG)",
        role: "Super Admin",
        type: "USER",
      },
      action: "CONVERSATION_REOPENED",
      actionLabel: "A réouvert la conversation",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "INFO",
      result: "SUCCESS",
      description: `Conversation ${targetConv?.companyName} réouverte pour suivi.`,
    });
  };

  const escalateConversation = (convId: string, reason: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: "ESCALATED", priority: "URGENT" } : c))
    );

    logAuditEvent({
      actor: {
        id: "usr-pdg",
        name: "Jude S. (PDG)",
        role: "Super Admin",
        type: "USER",
      },
      action: "CONVERSATION_ESCALATED",
      actionLabel: "A escaladé la conversation en urgence",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "CRITICAL",
      result: "SUCCESS",
      description: `Escalade critique de la conversation ${targetConv?.companyName}. Raison : ${reason}`,
      reason,
    });
  };

  const smartAutoAssignConversation = (convId: string): boolean => {
    const simulation = simulateAssignment("CONVERSATION");
    if (!simulation.winner) return false;

    assignConversation(
      convId,
      simulation.winner.name,
      "Closeuse",
      simulation.reason
    );
    return true;
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const activeLivreur = livreurs.find((l) => l.id === activeLivreurId) || livreurs[0];
  const activeCloseuse = closeuses.find((c) => c.id === activeCloseuseId) || closeuses[0];
  const activePartner = partners.find((p) => p.id === activePartnerId) || currentPartner;
  const activeTreasuryManager = treasuryManagers.find((t) => t.id === activeTreasuryManagerId) || treasuryManagers[0];

  return (
    <OperationsContext.Provider
      value={{
        orders,
        partners,
        products,
        livreurs,
        closeuses,
        treasuryManagers,
        payoutRequests,
        transactions,
        codCollections,
        codRemittances,
        auditLogs,
        conversations,
        activities,
        alerts,
        period,
        assignmentConfig,
        assignmentLogs,
        closerAvailability,
        setPeriod,
        currentRole,
        activeLivreurId,
        activeCloseuseId,
        activePartnerId,
        activeTreasuryManagerId,
        activeLivreur,
        activeCloseuse,
        activePartner,
        activeTreasuryManager,
        getDriverCodFunds,
        switchRole,
        createOrder,
        updateOrderStatus,
        logClosingCall,
        assignOrderToCloseuse,
        assignOrderToLivreur,
        markOrderDelivered,
        markOrderFailed,
        requestPayout,
        addLivreur,
        updateLivreurAvailability,
        updateLivreur,
        reassignLivreurOrders,
        addCloseuse,
        updateCloseuse,
        reassignCloseuseOrders,
        addPartner,
        updatePartner,
        suspendPartner,
        reactivatePartner,
        changePassword,
        approvePayout,
        validatePayout,
        payPayout,
        rejectPayout,
        verifyWithdrawal,
        approveWithdrawal,
        rejectWithdrawal,
        payWithdrawal,
        addTreasuryManager,
        updateTreasuryManager,
        toggleTreasuryManagerStatus,
        deleteTreasuryManager,
        receiveDriverRemittance,
        declareRemittance,
        validateRemittance,
        disputeRemittance,
        reportCodDiscrepancy,
        addTransaction,
        sendConversationMessage,
        assignConversation,
        transferConversation,
        takeoverConversation,
        resolveConversation,
        reopenConversation,
        escalateConversation,
        smartAutoAssignConversation,
        resolveAlert,
        globalAuditLogs,
        auditSessions,
        logAuditEvent,
        notifications,
        unreadNotificationsCount,
        criticalAlertsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resolveNotificationAlert,
        addNotification,
        deleteNotification,
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
        updateAssignmentConfig,
        updateCloserAvailability,
        simulateAssignment,
        triggerAutoAssignItem,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error("useOperations must be used within an OperationsProvider");
  }
  return context;
}
