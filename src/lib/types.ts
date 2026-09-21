export type UserRole =
  | 'PDG'
  | 'SUPER_ADMIN'
  | 'CLOSEUSE'
  | 'CLOSER'
  | 'LIVREUR'
  | 'DELIVERY_AGENT'
  | 'PARTNER'
  | 'MERCHANT'
  | 'TREASURY_MANAGER'
  | 'LOGISTICS_MANAGER';

// Statuts de commande
export type OrderStatus =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'EN_COURS'
  | 'LIVREE'
  | 'A_RAPPELER'
  | 'REFUSEE'
  | 'ANNULEE'
  | 'RETOURNEE';

// Couleurs et labels des statuts
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  CONFIRMEE: { label: 'Confirmée', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  EN_COURS: { label: 'En livraison', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  LIVREE: { label: 'Livrée & Encaissée', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  A_RAPPELER: { label: 'À rappeler', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  REFUSEE: { label: 'Refusée', color: 'text-red-500', bg: 'bg-red-500/10' },
  ANNULEE: { label: 'Annulée', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  RETOURNEE: { label: 'Retournée', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

// Commande
export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  region: string;
  address: string;
  city: string;
  products: string;
  quantity: number;
  totalPrice: number;
  deliveryFee: number;
  serviceFee: number;
  status: OrderStatus;
  comment?: string;
  availability?: string;
  availabilityLocation?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  partnerId: string;
  partnerName?: string;
  // Affectations & Suivi Opérationnel
  assignedCloseuseId?: string;
  assignedCloseuseName?: string;
  assignedLivreurId?: string;
  assignedLivreurName?: string;
  closingNotes?: string;
  callCount?: number;
  codCollected?: boolean;
  deliveryTimeSlot?: string;
  source?: 'Shopify' | 'YouCan' | 'Import IA' | 'ENO' | string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledCallback?: string;
  lastCallResult?: 'CONTACT_ESTABLISHED' | 'NO_ANSWER' | 'CALLBACK_REQUESTED' | 'WRONG_NUMBER' | 'CLIENT_REFUSED' | string;
  lastCallAt?: string;
}

// Statuts opérationnels des livreurs
export type LivreurStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'PAUSED' | 'OFFLINE' | 'UNAVAILABLE';

// Profil Livreur
export interface LivreurProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  zone: string;
  secondaryZones?: string[];
  avatarUrl?: string;
  vehicle: string;
  licensePlate?: string;
  isActive: boolean;
  availabilityStatus?: LivreurStatus;
  mustChangePassword?: boolean;
  temporaryCode?: string;
  assignedOrdersCount: number;
  maxActiveCapacity?: number;
  deliveredTodayCount: number;
  deliveredWeekCount?: number;
  deliveredMonthCount?: number;
  failedTodayCount?: number;
  cashCollectedToday: number;
  commissionPerDelivery?: number;
  successRate?: number;
  avgDeliveryTimeMinutes?: number;
  lastActivityAt?: string;
}

// Statuts opérationnels des closeuses
export type CloseuseStatus = 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE' | 'UNAVAILABLE';

// Profil Closeuse
export interface CloseuseProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  availabilityStatus?: CloseuseStatus;
  mustChangePassword?: boolean;
  temporaryCode?: string;
  callsTodayCount: number;
  confirmedTodayCount: number;
  confirmedWeekCount?: number;
  confirmedMonthCount?: number;
  cancelledTodayCount?: number;
  unreachableTodayCount?: number;
  callbacksScheduledToday?: number;
  conversionRate: number;
  maxActiveOrders?: number;
  maxActiveConversations?: number;
  activeOrdersCount?: number;
  activeConversationsCount?: number;
  commissionPerConfirmation?: number;
  avgProcessingTimeMinutes?: number;
  languages?: string[];
  zones?: string[];
  skills?: string[];
  lastActivityAt?: string;
}

// Opérateurs de Retrait (LeekPay, Binance Pay, USDT, etc.)
export type PayoutOperator = 'LEEKPAY' | 'BINANCE_PAY' | 'USDT' | 'MTN' | 'MOOV' | 'WAVE' | 'ORANGE' | 'USDT_TRC20';

export type PayoutStatus =
  | 'PENDING'
  | 'IN_VERIFICATION'
  | 'APPROVED'
  | 'IN_TREATMENT'
  | 'VALIDATED'
  | 'PAID'
  | 'REJECTED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED';

// Demande de Retrait Financier E-commerçant
export interface PayoutRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  reservedAmount?: number;
  operator: PayoutOperator;
  phone?: string;
  countryCode?: string;
  leekpayPhone?: string;
  leekpayCountry?: string;
  binancePayId?: string;
  binanceEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  cryptoEstimatedUsdt?: number;
  requestedAt: string;
  status: PayoutStatus;
  balanceBefore?: number;
  balanceAfter?: number;
  validatedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  adminProcessorName?: string;
  paymentReference?: string;
  txReference?: string;
  rejectionReason?: string;
  internalNote?: string;
}

// Statuts d'Encaissement COD
export type CodCollectionStatus =
  | 'PENDING'
  | 'COLLECTED'
  | 'PARTIALLY_COLLECTED'
  | 'NOT_COLLECTED'
  | 'DISCREPANCY_FLAGGED';

// Statuts de Remise de Fonds par le Livreur
export type RemittanceDeliveryStatus =
  | 'HELD_BY_DRIVER'
  | 'REMITTANCE_PENDING'
  | 'REMITTED'
  | 'VALIDATED'
  | 'DISCREPANCY_DETECTED'
  | 'PARTIALLY_REMITTED';

// Fiche Encaissement COD
export interface CodCollection {
  orderId: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string;
  clientName: string;
  clientPhone: string;
  livreurId: string;
  livreurName: string;
  expectedAmount: number;
  collectedAmount: number;
  discrepancy: number;
  discrepancyJustification?: string;
  collectionStatus: CodCollectionStatus;
  remittanceStatus: RemittanceDeliveryStatus;
  deliveredAt: string;
  remittanceId?: string;
}

// Statuts d'un Employé / Responsable
export type EmployeeStatus = 'ACTIF' | 'EN_PAUSE' | 'DESACTIVE';

// Profil du Responsable de Trésorerie
export interface TreasuryManagerProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  zone: string; // adresse ou zone de travail
  status: EmployeeStatus;
  avatar?: string;
  createdAt: string;
  lastActiveAt: string;
  remittancesReceivedCount: number;
  totalFundsReceived: number;
  discrepanciesFlaggedCount: number;
  notes?: string;
}

// Synthèse financière COD unifiée par livreur (Source Unique de Vérité)
export interface DriverCodFinancialSummary {
  livreurId: string;
  livreurName: string;
  livreurPhone?: string;
  livreurZone?: string;
  livreurAvatar?: string;
  totalCodCollected: number;
  totalFundsRemitted: number;
  fundsToRemit: number; // Toujours >= 0 (Montant réellement dû sur colis non encore remis)
  unremittedOrdersCount: number;
  unremittedOrderIds: string[];
  lastRemittanceDate?: string;
  nextRemittanceDeadline?: string;
  holdingDuration?: string;
  operationalStatus?: 'À recevoir' | 'Échéance proche' | 'En retard' | 'Remise partielle' | 'Écart détecté' | 'En vérification';
  ceilingThreshold: number; // Seuil d'alerte (ex: 100 000 ou 150 000 FCFA)
  statusLevel: 'ZERO' | 'NORMAL' | 'ATTENTION' | 'URGENT';
  statusLabel: string;
  openDiscrepanciesCount?: number;
  openDiscrepancyAmount?: number;
  hasDiscrepancy?: boolean;
  isAnomaly?: boolean;
  oldestCollectionDate?: string;
}

// Statuts d'une Opération de Remise de Fonds
export type RemittanceStatus =
  | 'PENDING_VALIDATION'
  | 'VALIDATED'
  | 'PARTIALLY_VALIDATED'
  | 'DISCREPANCY_DETECTED'
  | 'DISPUTED';

// Opération de Remise de Fonds Livreur
export interface CodRemittance {
  id: string;
  reference: string;
  livreurId: string;
  livreurName: string;
  amountExpected: number;
  amountDeclared: number;
  receivedAmount?: number;
  amountValidated?: number;
  discrepancyAmount?: number;
  discrepancyJustification?: string;
  discrepancyReason?: string;
  ordersCount: number;
  orderIds: string[];
  period: string;
  createdAt: string;
  receivedAt?: string;
  receivedBy?: string;
  receivedById?: string;
  validatedAt?: string;
  validatedBy?: string;
  status: RemittanceStatus;
  notes?: string;
}

// Journal d'Audit Financier Non-Destructif
export interface FinancialAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetType: 'REMITTANCE' | 'WITHDRAWAL' | 'ORDER' | 'PARTNER' | 'DISCREPANCY' | 'TRANSACTION';
  targetId: string;
  amount?: number;
  details: string;
}

// Types d'opérations du Grand Livre de Trésorerie
export type TransactionType =
  | 'ENCAISSEMENT_COD'
  | 'LIVRAISON_ENCAISSEE'
  | 'REMISE_LIVREUR'
  | 'REMISE_COMPLEMENTAIRE'
  | 'CREDIT_MARCHAND'
  | 'MONTANT_RESERVE'
  | 'RETRAIT'
  | 'VIREMENT'
  | 'COMMISSION_ENO'
  | 'COMMISSION_AGENCE'
  | 'COMMISSION_CLOSEUSE'
  | 'COMMISSION_LIVREUR'
  | 'RAPPROCHEMENT'
  | 'ECART'
  | 'RESOLUTION_ECART'
  | 'CORRECTION_VALIDEE'
  | 'DEPENSE'
  | 'AJUSTEMENT';

export interface FinancialTransaction {
  id: string;
  txReference: string;
  date: string;
  type: TransactionType;
  label: string;
  partnerId?: string;
  partnerName?: string;
  livreurId?: string;
  livreurName?: string;
  orderNumber?: string;
  orderId?: string;
  sourceType?: 'ENCAISSEMENT' | 'REMISE' | 'RETRAIT' | 'COMMISSION' | 'ECART' | 'MANUEL';
  sourceId?: string;
  sourceRef?: string;
  accountOrigin?: string;
  accountDestination?: string;
  balanceBefore?: number;
  inflow: number; // Entrée de fonds
  outflow: number; // Sortie de fonds
  balanceAfter: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string;
}

// Statuts des E-commerçants
export type PartnerStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'ONBOARDING' | 'INACTIVE' | 'SUSPENDED';

// Partenaire (E-commerçant)
export interface Partner {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  isActive: boolean;
  isApproved: boolean;
  status?: PartnerStatus;
  avatarUrl?: string;
  createdAt: string;
  notes?: string;
  category?: string;
  websiteUrl?: string;
  deliveryFeeDefault?: number;
  agencyCommissionDefault?: number;
  onboardingStep?: number;
  availableBalance?: number;
  pendingBalance?: number;
  lastActivityAt?: string;
  deliverySuccessRate?: number;
  confirmationRate?: number;
  ordersCountToday?: number;
  ordersCountMonth?: number;
  gmvProcessed?: number;
  lastPayoutDate?: string;
  suspensionReason?: string;
}

// Produit (Stock)
export interface Product {
  id: string;
  name: string;
  price: number;
  initialStock: number;
  remainingStock: number;
  deliveredCount: number;
  partnerId: string;
  createdAt?: string;
}

// Statuts et Types des Commissions ENO
export type CommissionType =
  | 'COMMISSION_LIVRAISON'
  | 'COMMISSION_RETRAIT'
  | 'COMMISSION_TRANSACTION'
  | 'COMMISSION_SERVICE';

export type CommissionStatus =
  | 'CALCULEE'
  | 'A_PERCEVOIR'
  | 'PARTIELLE'
  | 'PERCUE'
  | 'A_VERIFIER'
  | 'ANNULEE';

export interface EnoCommission {
  id: string;
  reference: string;
  date: string;
  type: CommissionType;
  partnerId: string;
  partnerName: string;
  baseAmount: number;
  rate: number; // en % (lu depuis la configuration ou contrat partenaire)
  calculatedAmount: number;
  collectedAmount: number; // Déjà perçu / prélevé
  remainingAmount: number; // Reste à percevoir
  status: CommissionStatus;
  orderId?: string;
  orderNumber?: string;
  payoutId?: string;
  payoutReference?: string;
  origin: string; // Description de la chaîne d'origine
  calculationFormula: string;
  notes?: string;
  isAnomaly?: boolean;
}

// Stats du dashboard
export interface DashboardStats {
  chiffreAffaires: number;
  revenuNet: number;
  nombreCommandes: number;
  tauxConfirmation: number;
  tauxLivraison: number;
  tauxRetour: number;
}

// Finance
export interface FinanceData {
  chiffreAffairesTotal: number;
  commissionsPrelevees: number;
  revenuNet: number;
  commandesLivrees: number;
  commandesTotal: number;
  fraisService: number;
  fraisLivraison: number;
  totalParProduit: number;
}

// Période sélectionnée
export type PeriodFilter = 'TODAY' | '7D' | '30D' | 'YEAR';

// Événement d'activité en direct (Agency Pulse)
export interface ActivityItem {
  id: string;
  type: 'ORDER_CREATED' | 'ORDER_CONFIRMED' | 'ORDER_DISPATCHED' | 'ORDER_DELIVERED' | 'PAYOUT_REQUESTED' | 'MESSAGE_RECEIVED';
  title: string;
  description: string;
  time: string;
  orderNumber?: string;
  partnerName?: string;
  amount?: number;
}

// Statuts et Priorités de Conversation
export type ConversationStatus = 'OPEN' | 'WAITING' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'UNASSIGNED' | 'URGENT';
export type ConversationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ConversationAssignmentHistory {
  id: string;
  assignedToName: string;
  assignedToRole: string;
  timestamp: string;
  reason?: string;
}

// Modèle complet de pièce jointe
export type AttachmentStatus = 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED' | 'CANCELLED';

export interface ChatAttachment {
  id: string;
  messageId?: string;
  conversationId?: string;
  uploadedBy?: string;
  uploadedByRole?: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  fileSizeBytes: number;
  storagePath?: string;
  url: string;
  type: 'IMAGE' | 'PDF' | 'DOC';
  thumbnailUrl?: string;
  createdAt: string;
  status: AttachmentStatus;
  progress?: number; // 0 à 100
  error?: string;
}

// Message de conversation
export interface ChatMessage {
  id: string;
  sender: 'PARTNER' | 'BOT' | 'AGENT' | 'PDG' | 'TREASURY';
  senderName: string;
  text: string;
  sentAt: string;
  isInternalNote?: boolean;
  attachments?: ChatAttachment[];
  // Rétrocompatibilité
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: 'IMAGE' | 'PDF' | 'DOC';
  attachmentSize?: string;
}

// Conversation du Hub de Communication
export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  companyName: string;
  avatarUrl?: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ConversationStatus | string;
  priority: ConversationPriority | string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentRole?: string;
  relatedOrderNumber?: string;
  messages: ChatMessage[];
  assignmentHistory?: ConversationAssignmentHistory[];
  firstResponseTimeMinutes?: number;
  avgResponseTimeMinutes?: number;
  slaStatus?: 'NORMAL' | 'WARNING_SLA' | 'BREACHED_SLA';
}

// ==========================================
// 🔔 SYSTÈME DE NOTIFICATIONS & CENTRE D'ALERTES
// ==========================================

export type NotificationPriority = 'CRITICAL' | 'URGENT' | 'INFO';

export type NotificationCategory =
  | 'COMMANDES'
  | 'LIVRAISONS'
  | 'LIVREURS'
  | 'ECOMMERCE'
  | 'FINANCES'
  | 'CONVERSATIONS'
  | 'INCIDENTS'
  | 'SYSTEME';

export type NotificationReferenceType =
  | 'ORDER'
  | 'DELIVERY'
  | 'DRIVER'
  | 'MERCHANT'
  | 'WITHDRAWAL'
  | 'TRANSACTION'
  | 'CONVERSATION'
  | 'INCIDENT'
  | 'SYSTEM';

export interface PlatformNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  isoDate: string;
  actionUrl?: string;
  actionLabel?: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
  isAlert?: boolean;
  alertStatus?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  actor?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, unknown>;
}

// Alerte du Centre d'Attention (Rétrocompatibilité)
export interface AgencyAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  count?: number;
}

// Modes & Configuration d'Attribution Automatique
export type AssignmentMode = 'SMART_AUTO' | 'ROUND_ROBIN' | 'MANUAL';

export interface AssignmentConfig {
  ordersMode: AssignmentMode;
  conversationsMode: AssignmentMode;
  maxCapacityPerCloser: number;
  autoRedistribute: boolean;
  redistributeTimeoutMinutes: number;
  prioritizeUrgent: boolean;
  notifyOnAssign: boolean;
  useRoundRobinOnTie: boolean;
  queueUnassigned: boolean;
}

export interface AssignmentLog {
  id: string;
  timestamp: string;
  itemType: 'ORDER' | 'CONVERSATION';
  itemRef: string;
  assignedToCloserName: string;
  assignedToCloserId: string;
  modeUsed: AssignmentMode;
  reason: string;
  success: boolean;
}

// ==========================================
// 🛡️ SYSTÈME GLOBAL D'AUDIT & TRAÇABILITÉ
// ==========================================

export type AuditActorType = 'USER' | 'SYSTEM';

export type AuditModule =
  | 'COMMANDES'
  | 'CLOSEUSES'
  | 'LIVREURS'
  | 'ECOMMERCE'
  | 'TRESORERIE'
  | 'FINANCES'
  | 'CONVERSATIONS'
  | 'AUTOMATISATION'
  | 'PARAMETRES'
  | 'UTILISATEURS'
  | 'AUTH'
  | 'SYSTEME';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AuditResult = 'SUCCESS' | 'FAILED' | 'BLOCKED';

export type AuditEntityType =
  | 'ORDER'
  | 'USER'
  | 'ROLE'
  | 'LIVREUR'
  | 'CLOSEUSE'
  | 'PARTNER'
  | 'TREASURY_MANAGER'
  | 'REMITTANCE'
  | 'PAYOUT'
  | 'FINANCE'
  | 'TRANSACTION'
  | 'CONVERSATION'
  | 'SETTING'
  | 'SESSION'
  | 'RULE'
  | 'SYSTEM';

export interface AuditActor {
  id: string;
  name: string;
  role: string;
  type: AuditActorType;
}

export interface GlobalAuditLog {
  id: string;
  timestamp: string; // Ex: "04 sept. 2026 — 10:42:18"
  isoDate: string;
  actor: AuditActor;
  action: string; // Ex: "ORDER_CONFIRMED", "REMITTANCE_VALIDATED", "USER_CREATED", "CAPACITY_UPDATED"
  actionLabel: string; // Ex: "A validé la remise", "A confirmé la commande"
  module: AuditModule;
  entityType: AuditEntityType;
  entityId: string;
  entityReference: string; // Ex: "CMD-1048", "RM-1045", "LIV-01"
  severity: AuditSeverity;
  result: AuditResult;
  description: string;
  reason?: string; // Ex: Justification de l'écart ou raison de l'assignation intelligente
  beforeState?: Record<string, unknown> | string;
  afterState?: Record<string, unknown> | string;
  ipAddress?: string;
  sessionId?: string;
  userAgent?: string;
  financeTxRef?: string; // Lien direct avec le Journal Financier si pertinent
  isSensitive?: boolean;
  amount?: number;
  currency?: string;
  partnerId?: string;
  partnerName?: string;
  orderId?: string;
  payoutId?: string;
  remittanceId?: string;
}

export interface AuditSessionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  loginAt: string;
  lastActiveAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'FAILED_ATTEMPT';
  failureReason?: string;
}

// ==========================================
// ⚙️ PARAMÈTRES, UTILISATEURS & PERMISSIONS
// ==========================================

export type PlatformUserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  status: PlatformUserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  zone?: string;
  is2FAEnabled?: boolean;
  twoFactorMethod?: 'SMS' | 'AUTHENTICATOR' | 'EMAIL';
  customPermissions?: string[];
  mustChangePassword?: boolean;
  notes?: string;
}

export interface RoleDefinition {
  id: UserRole;
  label: string;
  category: 'DIRECTION' | 'FINANCE' | 'OPERATIONS' | 'PARTENAIRE';
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  userCount: number;
  isSystem: boolean;
  defaultPermissions: string[];
}

export type PermissionCategory =
  | 'COMMANDES'
  | 'LIVRAISONS'
  | 'CLOSEUSES'
  | 'LIVREURS'
  | 'ECOMMERCE'
  | 'CONVERSATIONS'
  | 'FINANCES'
  | 'NOTIFICATIONS'
  | 'UTILISATEURS'
  | 'PARAMETRES'
  | 'AUDIT';

export interface PermissionDefinition {
  id: string;
  category: PermissionCategory;
  name: string;
  description: string;
  isSensitive?: boolean;
}

export interface GeneralSettings {
  platformName: string;
  companyName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  secondaryPhone: string;
  whatsappContact: string;
  headquartersAddress: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
}

export interface OperationalSettings {
  ordersAssignmentMode: AssignmentMode;
  conversationsAssignmentMode: AssignmentMode;
  maxCapacityPerCloser: number;
  maxCapacityPerDriver: number;
  estimatedDeliveryMinutes: number;
  criticalDelayHours: number;
  autoRedistribute: boolean;
  redistributeTimeoutMinutes: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  sundayDeliveries: boolean;
  requireDeliveryPhotoConfirmation: boolean;
  enableCodSecurityLimits: boolean;
  maxDriverCodCeilingFCFA: number;
}

export interface FinancialSettings {
  defaultClosingFee: number;
  defaultDeliveryFee: number;
  defaultCommissionRate: number; // en %
  minWithdrawalThreshold: number; // en FCFA
  maxDailyWithdrawalLimit: number; // en FCFA
  payoutProcessingDelayHours: number;
  autoApprovePayoutsBelow: number;
  requireDoubleValidationAbove: number;
  codReconciliationDeadlineHours: number;
}

export interface PaymentGatewayConfig {
  leekpay: {
    enabled: boolean;
    environment: 'PRODUCTION' | 'SANDBOX';
    status: 'ACTIVE' | 'PENDING_CONFIG' | 'INACTIVE';
    webhookConfigured: boolean;
    supportedChannels: string[];
    publicKeyMasked: string;
    apiEndpoint: string;
  };
  binancePay: {
    enabled: boolean;
    status: 'ACTIVE' | 'PENDING_CONFIG' | 'INACTIVE';
    merchantIdMasked: string;
    webhookConfigured: boolean;
    supportedCurrencies: string[];
  };
  usdtCrypto: {
    enabled: boolean;
    status: 'ACTIVE' | 'PENDING_CONFIG' | 'INACTIVE';
    supportedNetworks: string[];
    defaultNetwork: string;
    walletAddressMasked: string;
    minWithdrawalUsdt: number;
  };
}

export interface NotificationPreferences {
  orders: {
    newOrder: boolean;
    unassignedOrder: boolean;
    cancelledOrder: boolean;
    orderDelivered: boolean;
  };
  deliveries: {
    delayedDelivery: boolean;
    failedDelivery: boolean;
    criticalDelay: boolean;
  };
  finances: {
    newPayoutRequest: boolean;
    codDiscrepancy: boolean;
    highValueRemittance: boolean;
    withdrawalPaid: boolean;
  };
  system: {
    criticalIncident: boolean;
    securityAlert: boolean;
    dailyBackupSummary: boolean;
    userSuspension: boolean;
  };
}

export interface SecuritySettings {
  enforce2FAForAdmins: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  requirePasswordChangeDays: number;
  ipWhitelistEnabled: boolean;
  allowedIps: string[];
  auditAllAdminActions: boolean;
}

export interface PlatformSettings {
  general: GeneralSettings;
  operational: OperationalSettings;
  financial: FinancialSettings;
  paymentGateways: PaymentGatewayConfig;
  notifications: NotificationPreferences;
  security: SecuritySettings;
  lastUpdated: string;
  updatedBy: string;
}


