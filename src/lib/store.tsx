"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  formatCFA,
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
  RemittanceStatus,
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
  logActivity: (
    activity: Omit<ActivityItem, "id" | "time"> & { id?: string; time?: string }
  ) => ActivityItem;
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
  currentPartner: Partner;
  activeTreasuryManager: TreasuryManagerProfile;
  getDriverCodFunds: (driverId: string) => DriverCodFinancialSummary;
  isDateWithinPeriod: (dateStr?: string, customPeriod?: PeriodFilter) => boolean;

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
    deliveryTimeSlot?: string,
    scheduledCallback?: string,
    callResult?: string
  ) => void;
  scheduleCallback: (
    orderId: string,
    scheduledDate: string,
    note?: string
  ) => void;
  assignOrderToCloseuse: (orderId: string, closeuseId: string) => void;
  assignOrderToLivreur: (
    orderId: string,
    livreurId: string,
    justification?: string,
    deliverySlot?: string
  ) => void;
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
  addProduct: (data: Partial<Product> & { name: string; price: number; initialStock: number; partnerId: string }) => Product;
  adjustProductStock: (productId: string, delta: number) => void;
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
  blockWithdrawal: (withdrawalId: string, reason: string) => void;
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
    remittanceType?: 'FULL' | 'PARTIAL' | 'DISCREPANCY';
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
    },
    customSender?: 'PARTNER' | 'BOT' | 'AGENT' | 'PDG' | 'TREASURY',
    customSenderName?: string
  ) => void;
  assignConversation: (convId: string, agentName: string, agentRole: string, reason?: string) => void;
  claimConversation: (convId: string, agentName?: string, agentRole?: string) => void;
  requestHumanSupport: (partnerId: string, initialMessage?: string, forceNew?: boolean) => Promise<Conversation>;
  transferConversation: (
    convId: string,
    toAgentName: string,
    toAgentRole: string,
    reason: string
  ) => void;
  takeoverConversation: (convId: string) => void;
  resolveConversation: (convId: string, closedByName?: string) => void;
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

const initialAssignmentLogs: AssignmentLog[] = [];

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_orders_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialOrders;
  });
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_partners_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialPartners;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_products_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialProducts;
  });
  const [livreurs, setLivreurs] = useState<LivreurProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_drivers_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialLivreurs;
  });
  const [closeuses, setCloseuses] = useState<CloseuseProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_closers_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialCloseuses;
  });
  const [treasuryManagers, setTreasuryManagers] = useState<TreasuryManagerProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_treasury_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialTreasuryManagers;
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_payouts_v1");
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
        const saved = localStorage.getItem("guineego_transactions_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialTransactions;
  });
  const [codCollections, setCodCollections] = useState<CodCollection[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_cod_collections_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialCodCollections;
  });
  const [codRemittances, setCodRemittances] = useState<CodRemittance[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_remittances_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialCodRemittances;
  });
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>(initialFinancialAuditLogs);
  const [globalAuditLogs, setGlobalAuditLogs] = useState<GlobalAuditLog[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_audit_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialGlobalAuditLogs;
  });
  const [auditSessions, setAuditSessions] = useState<AuditSessionLog[]>(initialAuditSessions);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_conversations_v1");
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
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_activities_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialAgencyPulseActivities;
  });
  const [alerts, setAlerts] = useState<AgencyAlert[]>(initialAgencyAlerts);
  const [period, setPeriod] = useState<PeriodFilter>("TODAY");

    // 🧹 Nettoyage immédiat et complet de tous les caches obsolètes ENO
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("eno_") || key.includes("v3") || key.includes("v4") || key.includes("v5"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }, []);

  // 📦 Persistance et synchronisation des commandes (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          try {
            localStorage.setItem("guineego_orders_v1", JSON.stringify(data.orders));
          } catch {}
        }
      })
      .catch((err) => console.warn("Fallback local orders:", err));
  }, []);

  useEffect(() => {
    try {
      if (orders && orders.length > 0) {
        localStorage.setItem("guineego_orders_v1", JSON.stringify(orders));
      }
    } catch {}
  }, [orders]);

  // 🛵 Persistance et synchronisation des équipes et remises (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/fleet")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.drivers) && data.drivers.length > 0) {
            setLivreurs(data.drivers);
            try { localStorage.setItem("guineego_drivers_v1", JSON.stringify(data.drivers)); } catch {}
          }
          if (Array.isArray(data.closers) && data.closers.length > 0) {
            setCloseuses(data.closers);
            try { localStorage.setItem("guineego_closers_v1", JSON.stringify(data.closers)); } catch {}
          }
          if (Array.isArray(data.treasuryManagers) && data.treasuryManagers.length > 0) {
            setTreasuryManagers(data.treasuryManagers);
            try { localStorage.setItem("guineego_treasury_v1", JSON.stringify(data.treasuryManagers)); } catch {}
          }
          if (Array.isArray(data.remittances) && data.remittances.length > 0) {
            setCodRemittances(data.remittances);
            try { localStorage.setItem("guineego_remittances_v1", JSON.stringify(data.remittances)); } catch {}
          }
        }
      })
      .catch((err) => console.warn("Fallback local fleet:", err));
  }, []);

  useEffect(() => {
    try {
      if (livreurs && livreurs.length > 0) {
        localStorage.setItem("guineego_drivers_v1", JSON.stringify(livreurs));
      }
    } catch {}
  }, [livreurs]);

  useEffect(() => {
    try {
      if (closeuses && closeuses.length > 0) {
        localStorage.setItem("guineego_closers_v1", JSON.stringify(closeuses));
      }
    } catch {}
  }, [closeuses]);

  useEffect(() => {
    try {
      if (treasuryManagers && treasuryManagers.length > 0) {
        localStorage.setItem("guineego_treasury_v1", JSON.stringify(treasuryManagers));
      }
    } catch {}
  }, [treasuryManagers]);

  useEffect(() => {
    try {
      if (codRemittances && codRemittances.length > 0) {
        localStorage.setItem("guineego_remittances_v1", JSON.stringify(codRemittances));
      }
    } catch {}
  }, [codRemittances]);

  useEffect(() => {
    try {
      if (codCollections && codCollections.length > 0) {
        localStorage.setItem("guineego_cod_collections_v1", JSON.stringify(codCollections));
      }
    } catch {}
  }, [codCollections]);

  // 🛡️ Persistance et synchronisation du Journal d'Audit (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setGlobalAuditLogs(data.logs);
          try {
            localStorage.setItem("guineego_audit_v1", JSON.stringify(data.logs));
          } catch {}
        }
      })
      .catch((err) => console.warn("Fallback local audit:", err));
  }, []);

  useEffect(() => {
    try {
      if (globalAuditLogs && globalAuditLogs.length > 0) {
        localStorage.setItem("guineego_audit_v1", JSON.stringify(globalAuditLogs));
      }
    } catch {}
  }, [globalAuditLogs]);

  // Persistance et synchronisation des retraits et marchands (Serveur + LocalStorage)
  useEffect(() => {
    fetch("/api/withdrawals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.payouts)) {
            setPayoutRequests(data.payouts);
            try {
              localStorage.setItem("guineego_payouts_v1", JSON.stringify(data.payouts));
            } catch {}
          }
          if (Array.isArray(data.partners) && data.partners.length > 0) {
            setPartners(data.partners);
            try {
              localStorage.setItem("guineego_partners_v1", JSON.stringify(data.partners));
            } catch {}
          }
          if (Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
            try {
              localStorage.setItem("guineego_transactions_v1", JSON.stringify(data.transactions));
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
        localStorage.setItem("guineego_payouts_v1", JSON.stringify(payoutRequests));
      }
    } catch {}
  }, [payoutRequests]);

  useEffect(() => {
    try {
      if (partners && partners.length > 0) {
        localStorage.setItem("guineego_partners_v1", JSON.stringify(partners));
      }
    } catch {}
  }, [partners]);

  useEffect(() => {
    try {
      if (products && products.length > 0) {
        localStorage.setItem("guineego_products_v1", JSON.stringify(products));
      }
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      if (transactions && transactions.length > 0) {
        localStorage.setItem("guineego_transactions_v1", JSON.stringify(transactions));
      }
    } catch {}
  }, [transactions]);

  // Persistance et synchronisation des conversations (Serveur + LocalStorage avec polling réactif)
  useEffect(() => {
    const syncConvs = () => {
      fetch("/api/conversations")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.conversations) && data.conversations.length > 0) {
            setConversations(data.conversations);
            try {
              localStorage.setItem("guineego_conversations_v1", JSON.stringify(data.conversations));
            } catch {}
          }
        })
        .catch((err) => {
          console.warn("Mode hors-ligne ou fallback conversations:", err);
        });
    };

    syncConvs();
    const interval = setInterval(syncConvs, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      if (conversations && conversations.length > 0) {
        localStorage.setItem("guineego_conversations_v1", JSON.stringify(conversations));
      }
    } catch {}
  }, [conversations]);

  useEffect(() => {
    try {
      if (activities && activities.length > 0) {
        localStorage.setItem("guineego_activities_v1", JSON.stringify(activities));
      }
    } catch {}
  }, [activities]);

  // 🔔 Centre de Notifications & Alertes (Plateforme Globale)
  const [notifications, setNotifications] = useState<PlatformNotification[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_notifications_v5");
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
            localStorage.setItem("guineego_notifications_v5", JSON.stringify(data.notifications));
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
        localStorage.setItem("guineego_notifications_v5", JSON.stringify(notifications));
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

  const logActivity = (
    activity: Omit<ActivityItem, "id" | "time"> & { id?: string; time?: string }
  ): ActivityItem => {
    const newAct: ActivityItem = {
      id: activity.id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: activity.time || "À l'instant",
      ...activity,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
    return newAct;
  };

  // ⚙️ Paramètres de la Plateforme (Settings)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_settings_v1");
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
        const saved = localStorage.getItem("guineego_users_v1");
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
        const saved = localStorage.getItem("guineego_role_perms_v1");
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
            localStorage.setItem("guineego_settings_v1", JSON.stringify(data.settings));
          } catch {}
        }
        if (data.success && data.rolePermissions) {
          setRolePermissions(data.rolePermissions);
          try {
            localStorage.setItem("guineego_role_perms_v1", JSON.stringify(data.rolePermissions));
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
            localStorage.setItem("guineego_users_v1", JSON.stringify(data.users));
          } catch {}
        }
      })
      .catch((err) => console.warn("Fallback local users:", err));
  }, []);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem("guineego_settings_v1", JSON.stringify(platformSettings));
    } catch {}
  }, [platformSettings]);

  useEffect(() => {
    try {
      localStorage.setItem("guineego_users_v1", JSON.stringify(platformUsers));
    } catch {}
  }, [platformUsers]);

  useEffect(() => {
    try {
      localStorage.setItem("guineego_role_perms_v1", JSON.stringify(rolePermissions));
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
      email: (userData.email || `user-${Date.now()}@guineego.com`).trim().toLowerCase(),
      phone: userData.phone || "+229 00 00 00 00",
      role: userData.role || "CLOSEUSE",
      roleLabel: userData.roleLabel || userData.role || "Closeuse",
      status: userData.status || "active",
      zone: userData.zone || "Conakry",
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

  // 🛡️ Logueur d'Audit Central Universel (Référence stable)
  const logAuditEvent = useCallback((
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

    // Persistance Serveur
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog),
    }).catch((err) => console.warn("Fallback audit log:", err));

    return newLog;
  }, []);

  // Automatisation State
  const [assignmentConfig, setAssignmentConfig] = useState<AssignmentConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("guineego_assignment_config_v1");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialAssignmentConfig;
  });
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
    const updated = { ...assignmentConfig, ...newConfig };
    setAssignmentConfig(updated);
    try {
      localStorage.setItem("guineego_assignment_config_v1", JSON.stringify(updated));
    } catch {}

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

    // Mettre à jour en cascade dans platformSettings.operational
    updatePlatformSettings({
      operational: {
        ...platformSettings.operational,
        ordersAssignmentMode: updated.ordersMode,
        conversationsAssignmentMode: updated.conversationsMode,
        maxCapacityPerCloser: updated.maxCapacityPerCloser,
      },
    }, "Règles d'attribution automatique");
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

  // Création de commande avec tarification dynamique, persistance et auto-assign si configuré
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
      city: orderData.city || "Conakry",
      products: orderData.products || "Produit standard",
      quantity: orderData.quantity || 1,
      totalPrice: orderData.totalPrice !== undefined ? orderData.totalPrice : 15000,
      deliveryFee: dynamicDeliveryFee,
      serviceFee: dynamicServiceFee,
      status: "EN_ATTENTE",
      partnerId: targetPartnerId,
      partnerName: orderData.partnerName || partner?.companyName || "E-commerçant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...orderData,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // 🛡️ Journal d'Audit
    logAuditEvent({
      actor: {
        id: activeCloseuse?.id || currentUserProfile.id,
        name: activeCloseuse?.name || currentUserProfile.name,
        role: "Closeuse",
        type: "USER",
      },
      action: "ORDER_CREATED",
      actionLabel: "Nouvelle commande créée",
      module: "COMMANDES",
      entityType: "ORDER",
      entityId: newOrder.id,
      entityReference: newOrder.orderNumber,
      severity: "INFO",
      result: "SUCCESS",
      description: `Commande ${newOrder.orderNumber} créée pour ${newOrder.clientName} (${newOrder.city}) — ${formatCFA(newOrder.totalPrice)}.`,
      partnerId: newOrder.partnerId,
      partnerName: newOrder.partnerName,
      orderId: newOrder.id,
      amount: newOrder.totalPrice,
      currency: "GNF",
      afterState: newOrder as any,
    });

    // 🔔 Notification automatique
    addNotification({
      category: "COMMANDES",
      priority: "INFO",
      title: "📦 Nouvelle commande créée",
      description: `${newOrder.orderNumber} enregistrée pour ${newOrder.clientName} (${formatCFA(newOrder.totalPrice)})`,
      actionUrl: `/commercial/commandes?orderId=${newOrder.id}`,
      actionLabel: "Voir la commande",
      referenceType: "ORDER",
      referenceId: newOrder.id,
    });

    // ⚡ Activité en direct
    logActivity({
      type: "ORDER_CREATED",
      title: "Nouvelle commande créée",
      description: `${newOrder.orderNumber} — ${newOrder.clientName} (${newOrder.city})`,
      orderNumber: newOrder.orderNumber,
      partnerName: newOrder.partnerName,
      amount: newOrder.totalPrice,
    });

    // Sync Backend
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.warn("Sync createOrder backend fallback:", err));

    // Auto-assignment if active
    if (assignmentConfig.ordersMode !== "MANUAL") {
      setTimeout(() => {
        triggerAutoAssignItem(newOrder.id, "ORDER");
      }, 300);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, comment?: string) => {
    const existing = orders.find((o) => o.id === orderId);
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

    // 🛡️ Journal d'Audit automatique
    const actionKey =
      status === "CONFIRMEE"
        ? "ORDER_CONFIRMED"
        : status === "ANNULEE" || status === "REFUSEE"
        ? "ORDER_CANCELLED"
        : status === "LIVREE"
        ? "ORDER_DELIVERED"
        : "ORDER_STATUS_UPDATED";

    const actionLabel =
      status === "CONFIRMEE"
        ? "A confirmé la commande"
        : status === "ANNULEE" || status === "REFUSEE"
        ? "A annulé la commande"
        : status === "LIVREE"
        ? "Commande livrée & soldée"
        : `Statut changé vers ${status}`;

    logAuditEvent({
      actor: {
        id: activeCloseuse?.id || currentUserProfile.id,
        name: activeCloseuse?.name || currentUserProfile.name,
        role: "Closeuse",
        type: "USER",
      },
      action: actionKey,
      actionLabel,
      module: "COMMANDES",
      entityType: "ORDER",
      entityId: orderId,
      entityReference: existing?.orderNumber || orderId,
      severity: status === "ANNULEE" ? "WARNING" : "INFO",
      result: "SUCCESS",
      description: comment || `Changement du statut de ${existing?.orderNumber || orderId} vers ${status}.`,
      partnerId: existing?.partnerId,
      partnerName: existing?.partnerName,
      orderId,
      amount: existing?.totalPrice,
      currency: "GNF",
      beforeState: existing ? { status: existing.status } : undefined,
      afterState: { status, comment },
    });

    // 🔔 Notifications & ⚡ Activité en direct selon le statut
    if (status === "CONFIRMEE") {
      addNotification({
        category: "COMMANDES",
        priority: "INFO",
        title: "✅ Commande confirmée",
        description: `${existing?.orderNumber || orderId} validée pour ${existing?.clientName || "Client"} (${formatCFA(existing?.totalPrice || 0)}). Prête pour affectation.`,
        actionUrl: `/commercial/commandes?orderId=${orderId}`,
        actionLabel: "Voir la commande",
        referenceType: "ORDER",
        referenceId: orderId,
      });
      logActivity({
        type: "ORDER_CONFIRMED",
        title: "Commande confirmée",
        description: `${existing?.orderNumber || orderId} confirmée pour ${existing?.clientName || "Client"} (${formatCFA(existing?.totalPrice || 0)})`,
        orderNumber: existing?.orderNumber,
        partnerName: existing?.partnerName,
        amount: existing?.totalPrice,
      });
    } else if (status === "ANNULEE" || status === "REFUSEE") {
      addNotification({
        category: "COMMANDES",
        priority: "URGENT",
        isAlert: true,
        title: "❌ Commande annulée",
        description: `${existing?.orderNumber || orderId} annulée : ${comment || "Annulation client"}`,
        actionUrl: `/commercial/commandes?orderId=${orderId}`,
        actionLabel: "Voir la commande",
        referenceType: "ORDER",
        referenceId: orderId,
      });
      logActivity({
        type: "ORDER_CREATED",
        title: "Commande annulée",
        description: `${existing?.orderNumber || orderId} annulée (${comment || "Refus client"})`,
        orderNumber: existing?.orderNumber,
        partnerName: existing?.partnerName,
      });
    }

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, comment }),
    }).catch((err) => console.warn("Sync updateOrderStatus backend fallback:", err));
  };

  const logClosingCall = (
    orderId: string,
    note: string,
    newStatus: OrderStatus,
    assignedLivreurId?: string,
    deliveryTimeSlot?: string,
    scheduledCallback?: string,
    callResult?: string
  ) => {
    const livreur = livreurs.find((l) => l.id === assignedLivreurId);
    const nowIso = new Date().toISOString();
    const existing = orders.find((o) => o.id === orderId);

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
              scheduledCallback: scheduledCallback !== undefined ? scheduledCallback : o.scheduledCallback,
              lastCallResult: callResult || o.lastCallResult,
              lastCallAt: nowIso,
              callCount: (o.callCount || 0) + 1,
              updatedAt: nowIso,
              comment: `Appel closing : ${note}`,
            }
          : o
      )
    );

    // 🛡️ Journal d'Audit automatique
    logAuditEvent({
      actor: {
        id: activeCloseuse?.id || currentUserProfile.id,
        name: activeCloseuse?.name || currentUserProfile.name,
        role: "Closeuse",
        type: "USER",
      },
      action: "CALL_LOGGED",
      actionLabel: "Appel closing enregistré",
      module: "CLOSEUSES",
      entityType: "ORDER",
      entityId: orderId,
      entityReference: existing?.orderNumber || orderId,
      severity: newStatus === "ANNULEE" ? "WARNING" : "INFO",
      result: newStatus === "ANNULEE" ? "BLOCKED" : "SUCCESS",
      description: `Appel client pour ${existing?.orderNumber || orderId} : ${note}`,
      reason: callResult || (newStatus === "A_RAPPELER" ? "CALLBACK_REQUESTED" : "CONTACT_ESTABLISHED"),
      partnerId: existing?.partnerId,
      partnerName: existing?.partnerName,
      orderId,
      afterState: {
        status: newStatus,
        callResult,
        scheduledCallback,
        closingNotes: note,
        deliveryTimeSlot,
      },
    });

    // 🔔 Notifications & ⚡ Activité en direct selon le résultat de l'appel
    if (newStatus === "CONFIRMEE") {
      addNotification({
        category: "COMMANDES",
        priority: "INFO",
        title: "✅ Commande confirmée par appel",
        description: `${existing?.orderNumber || orderId} validée avec ${existing?.clientName || "Client"} (${formatCFA(existing?.totalPrice || 0)})`,
        actionUrl: `/commercial/commandes?orderId=${orderId}`,
        actionLabel: "Voir la commande",
        referenceType: "ORDER",
        referenceId: orderId,
      });
      logActivity({
        type: "ORDER_CONFIRMED",
        title: "Validation téléphonique réussie",
        description: `${existing?.orderNumber || orderId} confirmée pour ${existing?.clientName} (${formatCFA(existing?.totalPrice || 0)})`,
        orderNumber: existing?.orderNumber,
        partnerName: existing?.partnerName,
        amount: existing?.totalPrice,
      });
    } else if (newStatus === "A_RAPPELER") {
      logActivity({
        type: "ORDER_CREATED",
        title: callResult === "CALLBACK_REQUESTED" ? "Rappel demandé" : "Appel sans réponse",
        description: `${existing?.orderNumber || orderId} — ${note || "Relance requise"}`,
        orderNumber: existing?.orderNumber,
        partnerName: existing?.partnerName,
      });
    } else if (newStatus === "ANNULEE") {
      addNotification({
        category: "COMMANDES",
        priority: "URGENT",
        isAlert: true,
        title: "❌ Commande annulée suite à l'appel",
        description: `${existing?.orderNumber || orderId} annulée (${callResult === "WRONG_NUMBER" ? "Faux numéro" : "Refus client"})`,
        actionUrl: `/commercial/commandes?orderId=${orderId}`,
        actionLabel: "Voir la commande",
        referenceType: "ORDER",
        referenceId: orderId,
      });
      logActivity({
        type: "ORDER_CREATED",
        title: "Commande annulée (appel)",
        description: `${existing?.orderNumber || orderId} annulée suite à l'appel`,
        orderNumber: existing?.orderNumber,
        partnerName: existing?.partnerName,
      });
    }

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        status: newStatus,
        closingNotes: note,
        assignedLivreurId,
        assignedLivreurName: livreur?.name,
        deliveryTimeSlot,
        scheduledCallback,
        lastCallResult: callResult,
        lastCallAt: nowIso,
        callCount: (existing?.callCount || 0) + 1,
        comment: `Appel closing : ${note}`,
      }),
    }).catch((err) => console.warn("Sync logClosingCall backend fallback:", err));
  };

  const scheduleCallback = (
    orderId: string,
    scheduledDate: string,
    note?: string
  ) => {
    const nowIso = new Date().toISOString();
    const existing = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "A_RAPPELER",
              scheduledCallback: scheduledDate,
              deliveryTimeSlot: o.deliveryTimeSlot || scheduledDate,
              closingNotes: note
                ? `${o.closingNotes ? `${o.closingNotes} | ` : ""}Rappel fixé au ${scheduledDate.slice(0, 10)} : ${note}`
                : o.closingNotes,
              updatedAt: nowIso,
            }
          : o
      )
    );

    // 🛡️ Journal d'Audit
    logAuditEvent({
      actor: {
        id: activeCloseuse?.id || currentUserProfile.id,
        name: activeCloseuse?.name || currentUserProfile.name,
        role: "Closeuse",
        type: "USER",
      },
      action: "CALLBACK_SCHEDULED",
      actionLabel: "Relance programmée",
      module: "CLOSEUSES",
      entityType: "ORDER",
      entityId: orderId,
      entityReference: existing?.orderNumber || orderId,
      severity: "INFO",
      result: "SUCCESS",
      description: `Relance fixée au ${scheduledDate.slice(0, 10)} pour ${existing?.orderNumber || orderId}${note ? ` : ${note}` : ""}`,
      partnerId: existing?.partnerId,
      partnerName: existing?.partnerName,
      orderId,
      afterState: {
        status: "A_RAPPELER",
        scheduledCallback: scheduledDate,
        closingNotes: note,
      },
    });

    // 🔔 Notification automatique
    addNotification({
      category: "COMMANDES",
      priority: "INFO",
      title: "⏰ Relance programmée",
      description: `${existing?.orderNumber || orderId} — Rappel fixé au ${scheduledDate.slice(0, 10)} (${existing?.clientName || "Client"})`,
      actionUrl: `/commercial/appels-relances?orderId=${orderId}`,
      actionLabel: "Voir la relance",
      referenceType: "ORDER",
      referenceId: orderId,
    });

    // ⚡ Activité en direct
    logActivity({
      type: "ORDER_CREATED",
      title: "Relance planifiée",
      description: `${existing?.orderNumber || orderId} à rappeler (${scheduledDate.slice(0, 10)})`,
      orderNumber: existing?.orderNumber,
      partnerName: existing?.partnerName,
    });

    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        status: "A_RAPPELER",
        scheduledCallback: scheduledDate,
        closingNotes: note ? `Rappel fixé au ${scheduledDate.slice(0, 10)} : ${note}` : undefined,
      }),
    }).catch((err) => console.warn("Sync scheduleCallback backend fallback:", err));
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

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        assignedCloseuseId: closer.id,
        assignedCloseuseName: closer.name,
        status: "A_RAPPELER",
        comment: `Attribué manuellement à la closeuse ${closer.name}`,
      }),
    }).catch((err) => console.warn("Sync assignOrderToCloseuse backend fallback:", err));
  };

  const assignOrderToLivreur = (
    orderId: string,
    livreurId: string,
    justification?: string,
    deliverySlot?: string
  ) => {
    const livreur = livreurs.find((l) => l.id === livreurId);
    if (!livreur) return;

    const existing = orders.find((o) => o.id === orderId);
    const isReassignment = !!existing?.assignedLivreurId && existing.assignedLivreurId !== livreurId;
    const prevLivreurName = existing?.assignedLivreurName;
    const nowIso = new Date().toISOString();

    const commentText = isReassignment
      ? `Réaffecté de ${prevLivreurName || "coursier"} vers ${livreur.name} (${livreur.zone})${justification ? ` — Motif: ${justification}` : ""}`
      : `Attribué au coursier ${livreur.name} (${livreur.zone})${deliverySlot ? ` (Créneau: ${deliverySlot})` : ""}`;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedLivreurId: livreur.id,
              assignedLivreurName: livreur.name,
              status: "EN_COURS",
              deliveryTimeSlot: deliverySlot || o.deliveryTimeSlot,
              closingNotes: isReassignment
                ? `${o.closingNotes ? `${o.closingNotes} | ` : ""}${commentText}`
                : (o.closingNotes || commentText),
              updatedAt: nowIso,
              comment: commentText,
            }
          : o
      )
    );

    // Mettre à jour les compteurs des livreurs (source de vérité livreur)
    setLivreurs((prev) =>
      prev.map((l) => {
        if (l.id === livreurId) {
          return { ...l, assignedOrdersCount: (l.assignedOrdersCount || 0) + 1 };
        }
        if (isReassignment && l.id === existing?.assignedLivreurId) {
          return { ...l, assignedOrdersCount: Math.max(0, (l.assignedOrdersCount || 1) - 1) };
        }
        return l;
      })
    );

    // 🛡️ Journal d'Audit automatique
    logAuditEvent({
      actor: {
        id: activeCloseuse?.id || currentUserProfile.id,
        name: activeCloseuse?.name || currentUserProfile.name,
        role: "Closeuse",
        type: "USER",
      },
      action: isReassignment ? "DRIVER_REASSIGNED" : "DRIVER_ASSIGNED",
      actionLabel: isReassignment ? "Réaffectation coursier" : "Affectation coursier",
      module: "LIVREURS",
      entityType: "ORDER",
      entityId: orderId,
      entityReference: existing?.orderNumber || orderId,
      severity: "INFO",
      result: "SUCCESS",
      description: commentText,
      reason: justification,
      partnerId: existing?.partnerId,
      partnerName: existing?.partnerName,
      orderId,
      beforeState: isReassignment
        ? { assignedLivreurId: existing?.assignedLivreurId, assignedLivreurName: prevLivreurName }
        : undefined,
      afterState: {
        assignedLivreurId: livreur.id,
        assignedLivreurName: livreur.name,
        status: "EN_COURS",
        justification,
      },
    });

    // 🔔 Notification automatique
    addNotification({
      category: "LIVRAISONS",
      priority: "INFO",
      title: isReassignment ? "🔄 Livreur réaffecté" : "🛵 Livreur affecté",
      description: isReassignment
        ? `Commande ${existing?.orderNumber || orderId} réaffectée de ${prevLivreurName || "l'ancien livreur"} à ${livreur.name}`
        : `Commande ${existing?.orderNumber || orderId} affectée à ${livreur.name} (${livreur.zone})`,
      actionUrl: `/commercial/livraison-affectation?orderId=${orderId}`,
      actionLabel: "Voir l'affectation",
      referenceType: "ORDER",
      referenceId: orderId,
    });

    // ⚡ Activité en direct
    logActivity({
      type: "ORDER_DISPATCHED",
      title: isReassignment ? "Livreur réaffecté" : "Colis assigné au livreur",
      description: `${existing?.orderNumber || orderId} → ${livreur.name} (${livreur.zone})`,
      orderNumber: existing?.orderNumber,
      partnerName: existing?.partnerName,
      amount: existing?.totalPrice,
    });

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        assignedLivreurId: livreur.id,
        assignedLivreurName: livreur.name,
        status: "EN_COURS",
        comment: commentText,
        deliveryTimeSlot: deliverySlot,
      }),
    }).catch((err) => console.warn("Sync assignOrderToLivreur backend fallback:", err));
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
              comment: `Colis livré et montant COD encaissé avec succès par le livreur (Commission GuinéeGo: ${commission} GNF).`,
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

    // Enregistrer la collecte COD dans la source unique des collectes
    const newCodCol: CodCollection = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      partnerId: order.partnerId,
      partnerName: order.partnerName || "Marchand",
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      livreurId: order.assignedLivreurId || activeLivreurId || "liv-1",
      livreurName: order.assignedLivreurName || activeLivreur?.name || "Livreur",
      expectedAmount: order.totalPrice,
      collectedAmount: order.totalPrice,
      discrepancy: 0,
      collectionStatus: "COLLECTED",
      remittanceStatus: "HELD_BY_DRIVER",
      deliveredAt: new Date().toISOString(),
    };
    setCodCollections((prev) => [newCodCol, ...prev.filter((c) => c.orderId !== orderId)]);

    // Écriture de la transaction de livraison avec solde dynamique
    const prevBalance = transactions.length > 0 ? (transactions[0].balanceAfter || 0) : 0;
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
      balanceAfter: prevBalance + order.totalPrice,
      status: "COMPLETED",
      notes: `Commande livrée. Commission GuinéeGo: ${commission} GNF (${platformSettings.financial?.defaultCommissionRate ?? 5}%). Crédit net marchand: ${netCredit} GNF.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Notification si activée
    if (platformSettings.notifications?.orders?.orderDelivered) {
      addNotification({
        category: "COMMANDES",
        priority: "INFO",
        title: "📦 Commande livrée & encaissée",
        description: `${order.orderNumber} livrée avec succès à ${order.clientName}. Net marchand: ${netCredit.toLocaleString("fr-FR")} GNF.`,
        actionUrl: "/admin/commandes",
        referenceType: "ORDER",
        referenceId: order.id,
      });
    }

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "LIVREE" }),
    }).catch((err) => console.warn("Sync markOrderDelivered backend fallback:", err));
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

    // Sync Backend
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "REFUSEE", comment: `Livraison échouée : ${reason}` }),
    }).catch((err) => console.warn("Sync markOrderFailed backend fallback:", err));
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
      description: `Demande de ${amount.toLocaleString("fr-FR")} GNF par ${partner.companyName} (${operator}).`,
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
      description: `Demande de retrait de ${amount} GNF (${operator}). Statut: ${initialStatus}. Solde verrouillé: ${amount} GNF.`,
      afterState: newReq as any,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newReq.id,
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

    // Sync Backend
    fetch("/api/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DRIVER", data: newL }),
    }).catch((err) => console.warn("Sync addLivreur backend fallback:", err));

    return newL;
  };

  const updateLivreurAvailability = (livreurId: string, status: LivreurStatus) => {
    setLivreurs((prev) =>
      prev.map((l) => (l.id === livreurId ? { ...l, availabilityStatus: status } : l))
    );

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DRIVER", id: livreurId, updates: { availabilityStatus: status } }),
    }).catch((err) => console.warn("Sync updateLivreurAvailability fallback:", err));
  };

  const updateLivreur = (livreurId: string, data: Partial<LivreurProfile>) => {
    setLivreurs((prev) =>
      prev.map((l) => (l.id === livreurId ? { ...l, ...data } : l))
    );

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DRIVER", id: livreurId, updates: data }),
    }).catch((err) => console.warn("Sync updateLivreur fallback:", err));
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
      zones: data.zones || ["Conakry"],
      skills: data.skills || ["Généraliste"],
      lastActivityAt: "À l'instant",
    };
    setCloseuses((prev) => [...prev, newC]);

    // Sync Backend
    fetch("/api/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CLOSER", data: newC }),
    }).catch((err) => console.warn("Sync addCloseuse backend fallback:", err));

    return newC;
  };

  const updateCloseuse = (closeuseId: string, data: Partial<CloseuseProfile>) => {
    setCloseuses((prev) =>
      prev.map((c) => (c.id === closeuseId ? { ...c, ...data } : c))
    );

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CLOSER", id: closeuseId, updates: data }),
    }).catch((err) => console.warn("Sync updateCloseuse fallback:", err));
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
      address: data.address || "Centre d'Affaires, Kaloum, Conakry, Guinée",
      city: data.city || "Conakry",
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

  const addProduct = (
    data: Partial<Product> & { name: string; price: number; initialStock: number; partnerId: string }
  ): Product => {
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: data.name.toUpperCase(),
      price: data.price,
      initialStock: data.initialStock,
      remainingStock: data.remainingStock ?? data.initialStock,
      deliveredCount: data.deliveredCount ?? 0,
      partnerId: data.partnerId,
      createdAt: data.createdAt || new Date().toISOString().split("T")[0],
    };
    setProducts((prev) => [newProd, ...prev]);
    return newProd;
  };

  const adjustProductStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          const newRemaining = Math.max(0, prod.remainingStock + delta);
          return {
            ...prod,
            remainingStock: newRemaining,
          };
        }
        return prod;
      })
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
        actor: "Direction GuinéeGo (Super Admin)",
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
      description: `La demande de retrait de ${payout?.amount?.toLocaleString("fr-FR") || ""} GNF (${payout?.partnerName || "Marchand"}) a été approuvée. Prêt pour virement.`,
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
      description: `Votre demande de retrait de ${payout.amount.toLocaleString("fr-FR")} GNF a été rejetée (${reason}). Le montant a été réintégré à votre solde disponible.`,
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
      description: `Demande de retrait ${withdrawalId} rejetée. Motif: ${reason}. Montant réintégré: ${payout.amount} GNF.`,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: withdrawalId, action: "REJECT", rejectionReason: reason }),
    }).catch((err) => console.warn("Sync reject withdrawal fallback:", err));
  };

  const blockWithdrawal = (withdrawalId: string, reason: string) => {
    const payout = payoutRequests.find((p) => p.id === withdrawalId);
    if (!payout) return;

    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === withdrawalId
          ? {
              ...p,
              status: "BLOCKED",
              rejectionReason: reason || "Règlement bloqué pour vérification de conformité.",
              internalNote: `Bloqué par la trésorerie: ${reason}`,
            }
          : p
      )
    );

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: "CRITICAL",
      title: "🛑 Retrait temporairement bloqué",
      description: `La demande de retrait de ${payout.amount.toLocaleString("fr-FR")} GNF (${payout.partnerName}) a été bloquée pour anomalie ou contrôle de sécurité: ${reason}.`,
      actionUrl: "/tresorerie/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: withdrawalId,
    });

    // 🛡️ Audit Centralisé
    logAuditEvent({
      actor: { id: "usr-treasury", name: currentUserProfile.name, role: "Responsable Trésorerie", type: "USER" },
      action: "WITHDRAWAL_BLOCKED",
      actionLabel: "Blocage de demande de retrait",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: withdrawalId,
      entityReference: withdrawalId,
      severity: "CRITICAL",
      result: "SUCCESS",
      description: `Demande de retrait ${withdrawalId} bloquée par la trésorerie. Motif: ${reason}.`,
    });
  };

  const payWithdrawal = (withdrawalId: string, paymentReference: string, adminName = "Direction GuinéeGo") => {
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
    const prevBalance = transactions.length > 0 ? (transactions[0].balanceAfter || 0) : 0;
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
      balanceAfter: Math.max(0, prevBalance - payout.amount),
      status: "COMPLETED",
      notes: `Virement exécuté (${payout.operator}). Réf: ${ref}. Adaptateur: ${provider.name}. Traité par ${adminName}.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 🔔 Notification Centralisée
    addNotification({
      category: "FINANCES",
      priority: "INFO",
      title: "🏦 Retrait effectué",
      description: `Votre retrait de ${payout.amount.toLocaleString("fr-FR")} GNF a été effectué avec succès (${payout.operator}). Réf: ${ref}.`,
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
      description: `Règlement de ${payout.amount} GNF (${payout.operator}) exécuté avec succès. Réf: ${ref}.`,
    });

    // Sync Backend
    fetch("/api/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: withdrawalId, action: "PAY", paymentReference: ref, adminName }),
    }).catch((err) => console.warn("Sync pay withdrawal fallback:", err));
  };

  const payPayout = (payoutId: string, paymentReference: string, adminName = "Direction GuinéeGo") => {
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

    // Sync Backend
    fetch("/api/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "REMITTANCE", data: newRem }),
    }).catch((err) => console.warn("Sync declareRemittance fallback:", err));

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
        details: `${amountDeclared} GNF déclarés sur ${orderIds.length} colis livrés.`,
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
              validatedBy: "Direction GuinéeGo (Super Admin)",
            }
          : r
      )
    );

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REMITTANCE",
        id: remittanceId,
        updates: {
          status: "VALIDATED",
          amountValidated: validatedAmt,
          validatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          validatedBy: "Direction GuinéeGo (Super Admin)",
        },
      }),
    }).catch((err) => console.warn("Sync validateRemittance fallback:", err));

    // Mettre à jour les collections
    setCodCollections((prev) =>
      prev.map((c) =>
        rem.orderIds.includes(c.orderId) || c.remittanceId === remittanceId
          ? { ...c, remittanceStatus: "VALIDATED" }
          : c
      )
    );

    // Écriture de remise dans le Grand Livre
    const prevBalance = transactions.length > 0 ? (transactions[0].balanceAfter || 0) : 0;
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
      balanceAfter: prevBalance + validatedAmt,
      status: "COMPLETED",
      notes: `Fonds vérifiés et encaissés au coffre-fort. ${rem.ordersCount} commandes validées.`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Remise de fonds validée par le PDG",
        actor: "Direction GuinéeGo (Super Admin)",
        targetType: "REMITTANCE",
        targetId: rem.reference,
        amount: validatedAmt,
        details: `Validation physique au coffre de ${validatedAmt} GNF. Commandes libérées.`,
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
        actor: "Direction GuinéeGo (Super Admin)",
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

  // 🗓️ SYSTÈME UNIFIÉ DE FILTRAGE TEMPOREL (Source unique de vérité pour toutes les interfaces)
  const isDateWithinPeriod = useCallback(
    (dateStr?: string, customPeriod?: PeriodFilter): boolean => {
      if (!dateStr) return true;
      const targetPeriod = customPeriod || period;
      const cleanDate = dateStr.trim();
      const lower = cleanDate.toLowerCase();

      // Gestion des libellés relatifs mock-data ("Aujourd'hui à ...", "Hier à ...", "Il y a ...")
      const isTodayText = lower.includes("aujourd'hui") || lower.includes("aujourd’hui");
      const isYesterdayText = lower.includes("hier");

      if (targetPeriod === "TODAY") {
        if (isTodayText) return true;
        if (isYesterdayText) return false;
      }

      // Parser la date ISO / Standard
      let itemDate: Date | null = null;
      if (cleanDate.includes("T") || cleanDate.includes("-")) {
        const parsed = new Date(cleanDate.replace(" ", "T"));
        if (!isNaN(parsed.getTime())) itemDate = parsed;
      }

      // Date de référence (04 Septembre 2026 selon les données simulées ou date actuelle)
      const now = new Date();
      // Si les dates mock sont en Septembre 2026, aligner la fenêtre de référence
      const refTime = now.getFullYear() >= 2026 ? now.getTime() : new Date("2026-09-04T23:59:59").getTime();

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      switch (targetPeriod) {
        case "TODAY": {
          if (isTodayText) return true;
          if (itemDate) {
            // Correspond au jour J (ou 03/04 Septembre 2026 des mocks)
            const todayIso = new Date(refTime).toISOString().slice(0, 10);
            const itemIso = itemDate.toISOString().slice(0, 10);
            return itemIso === todayIso || itemIso === "2026-09-04" || itemIso === "2026-09-03";
          }
          return false;
        }
        case "7D": {
          if (isTodayText || isYesterdayText) return true;
          if (itemDate) {
            const sevenDaysAgo = refTime - 7 * ONE_DAY_MS;
            return itemDate.getTime() >= sevenDaysAgo;
          }
          return true;
        }
        case "30D": {
          if (isTodayText || isYesterdayText) return true;
          if (itemDate) {
            const thirtyDaysAgo = refTime - 30 * ONE_DAY_MS;
            return itemDate.getTime() >= thirtyDaysAgo;
          }
          return true;
        }
        case "YEAR": {
          if (itemDate) {
            const targetYear = new Date(refTime).getFullYear();
            return itemDate.getFullYear() === targetYear || itemDate.getFullYear() === 2026;
          }
          return true;
        }
        default:
          return true;
      }
    },
    [period]
  );

  // 🎯 SOURCE UNIQUE DE VÉRITÉ : Calcul transparent des fonds COD par livreur
  const getDriverCodFunds = (driverId: string): DriverCodFinancialSummary => {
    const driver = livreurs.find((l) => l.id === driverId);
    const driverName = driver?.name || "Livreur";
    const driverPhone = driver?.phone || "+229 01 00 00 00";
    const driverZone = driver?.zone || "Conakry";

    // 1. Remises enregistrées pour ce livreur
    const driverRemittances = codRemittances.filter((r) => r.livreurId === driverId);
    const validatedRemittances = driverRemittances.filter(
      (r) => r.status === "VALIDATED" || r.status === "PARTIALLY_VALIDATED"
    );
    const totalFundsRemitted = validatedRemittances.reduce(
      (sum, r) => sum + (r.amountValidated ?? r.receivedAmount ?? r.amountDeclared ?? 0),
      0
    );

    // 2. Collections liées à ce livreur
    const driverCols = codCollections.filter((c) => c.livreurId === driverId);
    
    // Commandes non encore validées au coffre
    const unremittedCols = driverCols.filter(
      (c) => c.remittanceStatus !== "VALIDATED" && c.collectionStatus !== "NOT_COLLECTED"
    );

    // Inclure aussi toute commande livrée assignée à ce livreur qui n'aurait pas encore d'entrée dans codCollections
    const deliveredWithoutCol = orders.filter(
      (o) =>
        o.assignedLivreurId === driverId &&
        o.status === "LIVREE" &&
        o.codCollected &&
        !driverCols.some((c) => c.orderId === o.id)
    );

    const deliveredAmountExtra = deliveredWithoutCol.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const deliveredOrderIdsExtra = deliveredWithoutCol.map((o) => o.id);

    // Montant restant à remettre = somme des encaissements sur ces colis (toujours >= 0)
    const fundsToRemit = unremittedCols.reduce((sum, c) => sum + Math.max(0, c.collectedAmount), 0) + deliveredAmountExtra;

    const unremittedOrderIds = [...unremittedCols.map((c) => c.orderId), ...deliveredOrderIdsExtra];
    const unremittedOrdersCount = unremittedOrderIds.length;

    // Formule financière unifiée : Total collecté = Total remis + Fonds actuellement détenus
    const totalCodCollected = totalFundsRemitted + fundsToRemit;
    const isAnomaly = fundsToRemit < 0;

    const ceilingThreshold = 100000;

    // Détection des écarts financiers ouverts
    const discrepancyRemittances = driverRemittances.filter(
      (r) => r.status === "DISCREPANCY_DETECTED" || (r.discrepancyAmount && r.discrepancyAmount !== 0)
    );
    const discrepancyCols = unremittedCols.filter(
      (c) => c.remittanceStatus === "DISCREPANCY_DETECTED" || (c.discrepancy && c.discrepancy !== 0)
    );
    const hasDiscrepancy = discrepancyRemittances.length > 0 || discrepancyCols.length > 0;
    const openDiscrepanciesCount = discrepancyRemittances.length + discrepancyCols.length;
    const openDiscrepancyAmount =
      discrepancyRemittances.reduce((sum, r) => sum + Math.abs(r.discrepancyAmount || 0), 0) +
      discrepancyCols.reduce((sum, c) => sum + Math.abs(c.discrepancy || 0), 0);

    const hasPartial = unremittedCols.some((c) => c.remittanceStatus === "PARTIALLY_REMITTED");
    const isOverdue = driverId === "liv-4" || unremittedCols.some((c) => c.deliveredAt.includes("Hier") || c.deliveredAt.includes("2026-09-03"));
    const isExpiringSoon = (fundsToRemit >= ceilingThreshold && !isOverdue) || driverId === "liv-5";

    let operationalStatus: 'À recevoir' | 'Échéance proche' | 'En retard' | 'Remise partielle' | 'Écart détecté' | 'En vérification' = 'À recevoir';

    if (fundsToRemit === 0) {
      operationalStatus = 'À recevoir';
    } else if (hasDiscrepancy) {
      operationalStatus = 'Écart détecté';
    } else if (hasPartial) {
      operationalStatus = 'Remise partielle';
    } else if (isOverdue) {
      operationalStatus = 'En retard';
    } else if (isExpiringSoon) {
      operationalStatus = 'Échéance proche';
    } else {
      operationalStatus = 'À recevoir';
    }

    let statusLevel: "ZERO" | "NORMAL" | "ATTENTION" | "URGENT" = "NORMAL";
    let statusLabel: string = operationalStatus;

    if (fundsToRemit === 0) {
      statusLevel = "ZERO";
      statusLabel = "✓ Aucun fonds en attente";
    } else if (isOverdue) {
      statusLevel = "URGENT";
      statusLabel = "🔴 En retard (Délai dépassé)";
    } else if (hasDiscrepancy) {
      statusLevel = "URGENT";
      statusLabel = "⚠️ Écart détecté";
    } else if (hasPartial) {
      statusLevel = "ATTENTION";
      statusLabel = "Remise partielle en cours";
    } else if (fundsToRemit >= 150000) {
      statusLevel = "URGENT";
      statusLabel = "🔴 Action requise (Plafond atteint)";
    } else if (fundsToRemit >= ceilingThreshold) {
      statusLevel = "ATTENTION";
      statusLabel = "⚠️ Attention (Proche plafond)";
    } else {
      statusLevel = "NORMAL";
      statusLabel = "Fonds normaux";
    }

    const holdingDuration = isOverdue ? "26h (Délai dépassé)" : driverId === "liv-1" ? "Il y a 6h" : driverId === "liv-2" ? "Il y a 6h" : "Il y a 2h";
    const nextRemittanceDeadline = isOverdue ? "Hier — 20:00 (Dépassé)" : isExpiringSoon ? "Aujourd'hui — 15:30 (Dans 45m)" : "Aujourd'hui — 18:00";
    const oldestCol = unremittedCols[0];
    const oldestCollectionDate = oldestCol ? oldestCol.deliveredAt : "Aucune collecte en attente";

    // Recherche de la dernière remise horodatée
    const sortedRemittances = [...driverRemittances].sort(
      (a, b) => new Date(b.validatedAt || b.createdAt).getTime() - new Date(a.validatedAt || a.createdAt).getTime()
    );
    const lastRemittance = sortedRemittances[0];
    const lastRemittanceDate = lastRemittance
      ? (lastRemittance.validatedAt || lastRemittance.createdAt)
      : (driverId === "liv-1" ? "Hier à 19:25" : "Aucune remise récente");

    return {
      livreurId: driverId,
      livreurName: driverName,
      livreurPhone: driverPhone,
      livreurZone: driverZone,
      totalCodCollected,
      totalFundsRemitted,
      fundsToRemit,
      unremittedOrdersCount,
      unremittedOrderIds,
      lastRemittanceDate,
      nextRemittanceDeadline,
      holdingDuration,
      operationalStatus,
      ceilingThreshold,
      statusLevel,
      statusLabel,
      openDiscrepanciesCount,
      openDiscrepancyAmount,
      hasDiscrepancy,
      isAnomaly,
      oldestCollectionDate,
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
      email: data.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@guineego.com`,
      phone: data.phone || "+229 01 00 00 00 00",
      zone: data.zone || "Hub Central Conakry (Kaloum)",
      status: data.status || "ACTIF",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastActiveAt: "À l'instant",
      remittancesReceivedCount: 0,
      totalFundsReceived: 0,
      discrepanciesFlaggedCount: 0,
      notes: data.notes,
    };

    setTreasuryManagers((prev) => [newTm, ...prev]);

    // Sync Backend
    fetch("/api/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TREASURY_MANAGER", data: newTm }),
    }).catch((err) => console.warn("Sync addTreasuryManager fallback:", err));

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "Création d'un Responsable de Trésorerie",
        actor: "Direction GuinéeGo (Super Admin)",
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

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TREASURY_MANAGER", id, updates: data }),
    }).catch((err) => console.warn("Sync updateTreasuryManager fallback:", err));
  };

  const toggleTreasuryManagerStatus = (id: string, status: EmployeeStatus) => {
    setTreasuryManagers((prev) =>
      prev.map((tm) => (tm.id === id ? { ...tm, status } : tm))
    );

    // Sync Backend
    fetch("/api/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TREASURY_MANAGER", id, updates: { status } }),
    }).catch((err) => console.warn("Sync toggleTreasuryManagerStatus fallback:", err));
  };

  const deleteTreasuryManager = (id: string) => {
    setTreasuryManagers((prev) => prev.filter((tm) => tm.id !== id));

    // Sync Backend
    fetch(`/api/fleet?type=TREASURY_MANAGER&id=${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Sync deleteTreasuryManager fallback:", err));
  };

  // ⚡ Workflow Rapide (< 1min) de Réception Physique de Remise par le Trésorier
  const receiveDriverRemittance = ({
    livreurId,
    receivedAmount,
    receivedBy,
    receivedById,
    notes,
    discrepancyReason,
    remittanceType = "FULL",
  }: {
    livreurId: string;
    receivedAmount: number;
    receivedBy: string;
    receivedById?: string;
    notes?: string;
    discrepancyReason?: string;
    remittanceType?: "FULL" | "PARTIAL" | "DISCREPANCY";
  }): CodRemittance => {
    const driverSummary = getDriverCodFunds(livreurId);
    const expectedAmount = driverSummary.fundsToRemit;
    const difference = expectedAmount - receivedAmount;

    // Détermination précise du statut
    const isPartial = remittanceType === "PARTIAL" || (difference > 0 && !discrepancyReason);
    const isDiscrepancy = remittanceType === "DISCREPANCY" || (difference > 0 && !!discrepancyReason);

    const ref = `RM-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0")}`;
    const nowIso = new Date().toISOString().replace("T", " ").slice(0, 16);

    const remittanceStatus: RemittanceStatus = isDiscrepancy
      ? "DISCREPANCY_DETECTED"
      : isPartial
      ? "PARTIALLY_VALIDATED"
      : "VALIDATED";

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
      discrepancyJustification: isDiscrepancy ? discrepancyReason : undefined,
      ordersCount: driverSummary.unremittedOrdersCount,
      orderIds: driverSummary.unremittedOrderIds,
      period: `Tournée du ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: nowIso,
      receivedAt: nowIso,
      receivedBy,
      receivedById,
      validatedAt: nowIso,
      validatedBy: receivedBy,
      status: remittanceStatus,
      notes,
    };

    setCodRemittances((prev) => [newRemittance, ...prev]);

    // Sync Backend
    fetch("/api/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "REMITTANCE", data: newRemittance }),
    }).catch((err) => console.warn("Sync receiveDriverRemittance fallback:", err));

    // Mettre à jour les statuts des encaissements concernés
    setCodCollections((prev) => {
      let remainingToDeduct = receivedAmount;
      return prev.map((c) => {
        if (c.livreurId === livreurId && c.remittanceStatus !== "VALIDATED") {
          if (isDiscrepancy) {
            return {
              ...c,
              remittanceStatus: "DISCREPANCY_DETECTED",
              discrepancy: -difference,
              discrepancyJustification: discrepancyReason,
              remittanceId: newRemittance.id,
            };
          } else if (isPartial) {
            // Remise partielle : on apure les commandes selon le montant versé
            if (remainingToDeduct >= c.collectedAmount && c.collectedAmount > 0) {
              remainingToDeduct -= c.collectedAmount;
              return {
                ...c,
                remittanceStatus: "VALIDATED",
                remittanceId: newRemittance.id,
              };
            } else if (remainingToDeduct > 0) {
              const remainingOnThis = c.collectedAmount - remainingToDeduct;
              remainingToDeduct = 0;
              return {
                ...c,
                collectedAmount: remainingOnThis,
                remittanceStatus: "PARTIALLY_REMITTED",
                remittanceId: newRemittance.id,
              };
            } else {
              return c;
            }
          } else {
            // Conforme : tout est soldé
            return {
              ...c,
              remittanceStatus: "VALIDATED",
              remittanceId: newRemittance.id,
            };
          }
        }
        return c;
      });
    });

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
    const prevBalance = transactions.length > 0 ? (transactions[0].balanceAfter || 0) : 0;
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
      balanceAfter: prevBalance + receivedAmount,
      status: "COMPLETED",
      notes: `Reçu physiquement par ${receivedBy}.${
        isDiscrepancy
          ? ` Écart: -${difference} GNF. Motif: ${discrepancyReason}.`
          : isPartial
          ? ` Remise partielle: ${receivedAmount} GNF reçus, solde restant dû: ${difference} GNF.`
          : " Montant exact validé au coffre."
      }`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Consigner dans le Journal d'Audit inaltérable
    const auditAction = isDiscrepancy
      ? "Remise reçue avec écart détecté"
      : isPartial
      ? "Remise partielle enregistrée"
      : "Réception & Validation de remise physique";

    const auditDetails = isDiscrepancy
      ? `${receivedAmount} GNF reçus de ${driverSummary.livreurName} (Attendu: ${expectedAmount} GNF, Écart: -${difference} GNF). Motif: ${discrepancyReason || "Non précisé"}.`
      : isPartial
      ? `${receivedAmount} GNF reçus de ${driverSummary.livreurName} (Attendu: ${expectedAmount} GNF). Solde restant sous responsabilité livreur: ${difference} GNF.`
      : `${receivedAmount} GNF reçus de ${driverSummary.livreurName}. Validation complète sans écart.`;

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: nowIso,
        action: auditAction,
        actor: `${receivedBy} (Responsable de trésorerie)`,
        targetType: "REMITTANCE",
        targetId: ref,
        amount: receivedAmount,
        details: auditDetails,
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
      description: auditDetails,
      reason: isDiscrepancy ? discrepancyReason : undefined,
      financeTxRef: newTx.txReference,
      beforeState: { fundsToRemit: expectedAmount },
      afterState: { fundsToRemit: isDiscrepancy ? difference : isPartial ? difference : 0, receivedAmount },
    });

    // Alerte pour le PDG si écart
    if (isDiscrepancy) {
      const newAlert: AgencyAlert = {
        id: `alt-disc-${Date.now()}`,
        severity: "CRITICAL",
        title: `Écart de caisse sur remise ${ref}`,
        description: `${driverSummary.livreurName} a remis ${receivedAmount} GNF au lieu de ${expectedAmount} GNF (-${difference} GNF). Reçu par ${receivedBy}. Motif: ${discrepancyReason || "À arbitrer"}.`,
        actionLabel: "Examiner",
        actionHref: "/pdg/finance",
      };
      setAlerts((prev) => [newAlert, ...prev]);

      addNotification({
        category: "FINANCES",
        priority: "URGENT",
        title: `Alerte Écart Remise : ${driverSummary.livreurName}`,
        description: `Écart de ${difference} GNF constaté lors de la remise ${ref}. Motif : ${discrepancyReason || "Non précisé"}.`,
        actionUrl: "/tresorerie/remises",
        referenceId: newRemittance.id,
      });
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
    },
    customSender?: 'PARTNER' | 'BOT' | 'AGENT' | 'PDG' | 'TREASURY',
    customSenderName?: string
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

    const resolvedSender = customSender || (
      currentRole === "TREASURY_MANAGER" ? "TREASURY" : currentRole === "CLOSEUSE" ? "AGENT" : "PDG"
    );

    const resolvedSenderName = customSenderName || (
      resolvedSender === "PARTNER"
        ? targetConv?.companyName || "Marchand Partenaire"
        : currentRole === "TREASURY_MANAGER"
        ? activeTreasuryManager?.name || "Responsable Trésorerie"
        : currentRole === "CLOSEUSE"
        ? activeCloseuse?.name || "Opératrice Télévente"
        : "Jude S. (PDG)"
    );

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: resolvedSender,
      senderName: resolvedSenderName,
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
              status: c.status === "UNASSIGNED" || c.status === "WAITING" ? "OPEN" : c.status,
              assignmentHistory: [newHistoryItem, ...(c.assignmentHistory || [])],
            }
          : c
      )
    );

    // Persister l'assignation sur le serveur
    fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Assignation de la conversation à ${agentName} (${agentRole}).`,
        isInternalNote: true,
        sender: "PDG",
        senderName: "Jude S. (PDG)",
        assignedAgentName: agentName,
        assignedAgentRole: agentRole,
        status: "OPEN",
      }),
    }).catch((err) => console.warn("Erreur sync assignation:", err));

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

  const claimConversation = (convId: string, customAgentName?: string, customAgentRole?: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const agentName =
      customAgentName ||
      (currentRole === "CLOSEUSE"
        ? activeCloseuse?.name || "Opératrice Télévente"
        : currentRole === "TREASURY_MANAGER"
        ? activeTreasuryManager?.name || "Responsable Trésorerie"
        : "Jude S. (PDG)");

    const agentRole =
      customAgentRole ||
      (currentRole === "CLOSEUSE"
        ? "Closeuse & Support"
        : currentRole === "TREASURY_MANAGER"
        ? "Trésorerie"
        : "Direction Générale");

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // Message d'accueil automatique du conseiller qui valide la prise en charge
    const autoWelcomeMessage: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      sender: currentRole === "TREASURY_MANAGER" ? "TREASURY" : currentRole === "CLOSEUSE" ? "AGENT" : "PDG",
      senderName: agentName,
      text: `Bonjour ! Je suis ${agentName} de l'équipe GuinéeGo LAT. J'ai pris en charge votre demande en direct. En quoi puis-je vous être utile ?`,
      sentAt: timeStr,
    };

    const newHistoryItem = {
      id: `ah_${Date.now()}`,
      assignedToName: agentName,
      assignedToRole: agentRole,
      timestamp: `${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — ${timeStr}`,
      reason: "Prise en charge validée par l'agent",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              assignedAgentName: agentName,
              assignedAgentRole: agentRole,
              status: "OPEN",
              lastMessage: autoWelcomeMessage.text,
              lastMessageAt: "À l'instant",
              messages: [...c.messages, autoWelcomeMessage],
              assignmentHistory: [newHistoryItem, ...(c.assignmentHistory || [])],
            }
          : c
      )
    );

    // Persister le message de bienvenue et l'assignation sur le serveur
    fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: autoWelcomeMessage.text,
        sender: autoWelcomeMessage.sender,
        senderName: autoWelcomeMessage.senderName,
        assignedAgentName: agentName,
        assignedAgentRole: agentRole,
        status: "OPEN",
      }),
    }).catch((err) => console.warn("Erreur sync welcome message:", err));

    logAuditEvent({
      actor: {
        id: "usr-current",
        name: agentName,
        role: agentRole,
        type: "USER",
      },
      action: "CONVERSATION_ASSIGNED",
      actionLabel: "A validé la prise en charge du marchand",
      module: "CONVERSATIONS",
      entityType: "CONVERSATION",
      entityId: convId,
      entityReference: targetConv?.companyName || convId,
      severity: "INFO",
      result: "SUCCESS",
      description: `${agentName} (${agentRole}) a validé la prise en charge de la conversation de ${targetConv?.companyName}.`,
    });
  };

  const requestHumanSupport = async (
    partnerId: string,
    initialMessage?: string,
    forceNew = false
  ): Promise<Conversation> => {
    const p = partners.find((item) => item.id === partnerId) || activePartner || currentPartner;
    const pCompanyName = p?.companyName || "Boutique Partenaire";
    const pFullName = p?.fullName || "E-commerçant";
    const pPhone = p?.phone || "+229 00 00 00 00";

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // 1. Chercher si déjà existante ET non résolue (si forceNew n'est pas actif)
    const existing = !forceNew
      ? conversations.find(
          (c) => (c.partnerId === partnerId || c.companyName === pCompanyName) && c.status !== "RESOLVED"
        )
      : null;

    if (existing) {
      const updatedMessages = [...existing.messages];
      if (initialMessage) {
        updatedMessages.push({
          id: `msg_${Date.now()}`,
          sender: "PARTNER",
          senderName: pCompanyName,
          text: initialMessage,
          sentAt: timeStr,
        });
      }

      const updatedConv: Conversation = {
        ...existing,
        status: existing.assignedAgentName ? existing.status : "WAITING",
        priority: "HIGH",
        lastMessage: initialMessage || "Demande d'agent humain en direct",
        lastMessageAt: "À l'instant",
        unreadCount: (existing.unreadCount || 0) + (initialMessage ? 1 : 0),
        messages: updatedMessages,
      };

      setConversations((prev) => prev.map((c) => (c.id === existing.id ? updatedConv : c)));

      // Sync backend
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          companyName: pCompanyName,
          partnerName: pFullName,
          phone: pPhone,
          initialMessage,
          requestHuman: true,
        }),
      }).catch((err) => console.warn("Erreur sync requestHumanSupport:", err));

      return updatedConv;
    }

    // 2. Créer nouvelle conversation en attente de validation
    const newConvId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMessages: ChatMessage[] = [];
    if (initialMessage) {
      newMessages.push({
        id: `msg_${Date.now()}`,
        sender: "PARTNER",
        senderName: pCompanyName,
        text: initialMessage,
        sentAt: timeStr,
      });
    }

    const newConv: Conversation = {
      id: newConvId,
      partnerId,
      partnerName: pFullName,
      companyName: pCompanyName,
      phone: pPhone,
      lastMessage: initialMessage || "Demande d'assistance en direct",
      lastMessageAt: "À l'instant",
      unreadCount: initialMessage ? 1 : 0,
      status: "WAITING",
      priority: "HIGH",
      messages: newMessages,
      assignmentHistory: [],
    };

    setConversations((prev) => [newConv, ...prev]);

    // Notification globale pour l'équipe (Closeuses & Direction)
    addNotification({
      category: "CONVERSATIONS",
      priority: "URGENT",
      title: "Nouvelle demande d'assistance",
      description: `${pCompanyName} souhaite parler à un conseiller en direct.`,
      actionUrl: "/commercial/conversations",
      referenceType: "CONVERSATION",
      referenceId: newConvId,
      isAlert: true,
    });

    // Sync backend
    fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newConvId,
        partnerId,
        companyName: pCompanyName,
        partnerName: pFullName,
        phone: pPhone,
        initialMessage,
        requestHuman: true,
        forceNew: true,
      }),
    }).catch((err) => console.warn("Erreur sync create newConv:", err));

    return newConv;
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
    claimConversation(convId, "Jude S. (PDG)", "Direction Générale");
  };

  const resolveConversation = (convId: string, closedByName?: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const closer = closedByName || (currentRole === "CLOSEUSE" ? activeCloseuse?.name : "Jude S. (PDG)");

    const closeMsg: ChatMessage = {
      id: `msg_resolved_${Date.now()}`,
      sender: "BOT",
      senderName: "Support GuinéeGo",
      text: `🔒 Cette discussion a été clôturée par ${closer}. Merci d'avoir contacté le service support GuinéeGo LAT. Vous pouvez démarrer une nouvelle discussion à tout moment pour toute autre question.`,
      sentAt: timeStr,
      isInternalNote: false,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              status: "RESOLVED",
              unreadCount: 0,
              lastMessage: "Conversation clôturée",
              lastMessageAt: timeStr,
              messages: [...c.messages, closeMsg],
            }
          : c
      )
    );

    // Persistance sur le serveur
    fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "RESOLVED",
        closedByName: closer,
      }),
    }).catch((err) => console.warn("Erreur sync resolveConversation:", err));

    logAuditEvent({
      actor: {
        id: "usr-current",
        name: closer,
        role: currentRole,
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
      description: `Support pour ${targetConv?.companyName} marqué comme résolu par ${closer}.`,
    });
  };

  const reopenConversation = (convId: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: "OPEN" } : c))
    );

    // Persistance sur le serveur
    fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "OPEN",
      }),
    }).catch((err) => console.warn("Erreur sync reopenConversation:", err));

    logAuditEvent({
      actor: {
        id: "usr-current",
        name: currentRole === "CLOSEUSE" ? activeCloseuse?.name : "Jude S. (PDG)",
        role: currentRole,
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
        logActivity,
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
        currentPartner: activePartner,
        activeTreasuryManager,
        getDriverCodFunds,
        isDateWithinPeriod,
        switchRole,
        createOrder,
        updateOrderStatus,
        logClosingCall,
        scheduleCallback,
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
        addProduct,
        adjustProductStock,
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
        blockWithdrawal,
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
        claimConversation,
        requestHumanSupport,
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
