import {
  Order,
  Partner,
  Product,
  LivreurProfile,
  CloseuseProfile,
  PayoutRequest,
  ActivityItem,
  Conversation,
  AgencyAlert,
  FinancialTransaction,
  CodCollection,
  CodRemittance,
  FinancialAuditLog,
  TreasuryManagerProfile,
  GlobalAuditLog,
  AuditSessionLog,
  PlatformNotification,
  PlatformUser,
  RoleDefinition,
  PermissionDefinition,
  PlatformSettings,
} from './types';

export const enoAgencies = [
  {
    id: 'cotonou',
    city: 'Cotonou',
    title: 'Agence Principale Littoral & Atlantique',
    coverage: 'Cotonou • Abomey-Calavi • Porto-Novo',
    primaryPhone: '+229 01 64 29 18 84',
    secondaryPhone: '+229 01 93 83 79 06',
    whatsapp: '2290164291884',
    address: 'Cadjehoun / Haie Vive, Cotonou, Bénin',
    status: 'Ouvert • 08h00 - 20h30',
    hubLead: 'Responsable Opérations Cotonou',
  },
  {
    id: 'lokossa',
    city: 'Lokossa',
    title: 'Agence Régionale Mono & Couffo',
    coverage: 'Lokossa • Mono • Couffo • Athiémé',
    primaryPhone: '+229 01 67 51 00 82',
    secondaryPhone: null,
    whatsapp: '2290167510082',
    address: 'Avenue Principale, Face Gare, Lokossa, Bénin',
    status: 'Ouvert • 08h00 - 19h00',
    hubLead: 'Responsable Antenne Lokossa',
  },
];

export const enoSocials = {
  tiktok: {
    handle: '@enolivraison',
    url: 'https://www.tiktok.com/@enolivraison',
    followers: '1 157+',
    likes: '4 351+',
    label: 'TikTok Officiel',
  },
  facebook: {
    name: 'Eno Livraison',
    url: 'https://www.facebook.com/enolivraison',
    label: 'Page Facebook',
  },
  instagram: {
    handle: '@enolivraison',
    url: 'https://www.instagram.com/enolivraison',
    label: 'Instagram',
  },
  whatsappCotonou: 'https://wa.me/2290164291884?text=Bonjour%20ENO%20LIVRAISON%2C%20je%20souhaite%20confier%20mes%20colis%20%C3%A0%20Cotonou',
  whatsappLokossa: 'https://wa.me/2290167510082?text=Bonjour%20ENO%20LIVRAISON%2C%20je%20souhaite%20confier%20mes%20colis%20%C3%A0%20Lokossa',
};

export const currentPartner: Partner = {
  id: 'p1',
  fullName: 'Partenaire Principal',
  companyName: 'Ma Boutique',
  email: 'partenaire@enolivraison.com',
  phone: '+229 01 64 29 18 84',
  address: 'Cadjehoun, Cotonou, Bénin',
  city: 'Cotonou',
  isActive: true,
  isApproved: true,
  status: 'ACTIVE',
  category: 'Commerce Général',
  websiteUrl: 'https://maboutique.bj',
  deliveryFeeDefault: 2000,
  agencyCommissionDefault: 800,
  onboardingStep: 6,
  availableBalance: 0,
  pendingBalance: 0,
  ordersCountToday: 0,
  ordersCountMonth: 0,
  gmvProcessed: 0,
  confirmationRate: 0,
  deliverySuccessRate: 0,
  lastPayoutDate: 'Aucun retrait',
  lastActivityAt: 'Nouveau compte',
  createdAt: '2026-09-17',
};

export const partners: Partner[] = [
  currentPartner,
];

export const livreurs: LivreurProfile[] = [
  {
    id: 'liv-1',
    name: 'Paul Agossou',
    email: 'paul.agossou@enolivraison.com',
    phone: '+229 01 95 12 34 56',
    zone: 'Cotonou Centre',
    secondaryZones: ['Cadjehoun', 'Akpakpa'],
    vehicle: 'Moto Yamaha YB-125',
    licensePlate: 'RB-4589-AF',
    isActive: true,
    availabilityStatus: 'AVAILABLE',
    mustChangePassword: false,
    assignedOrdersCount: 0,
    maxActiveCapacity: 8,
    deliveredTodayCount: 0,
    deliveredWeekCount: 0,
    deliveredMonthCount: 0,
    failedTodayCount: 0,
    cashCollectedToday: 0,
    commissionPerDelivery: 1500,
    successRate: 0,
    avgDeliveryTimeMinutes: 0,
    lastActivityAt: 'À l\'instant',
  },
];

export const closeuses: CloseuseProfile[] = [
  {
    id: 'cls-1',
    name: 'Sarah Kone',
    email: 'sarah.kone@enolivraison.com',
    phone: '+229 01 92 33 44 55',
    isActive: true,
    availabilityStatus: 'AVAILABLE',
    mustChangePassword: false,
    callsTodayCount: 0,
    confirmedTodayCount: 0,
    confirmedWeekCount: 0,
    confirmedMonthCount: 0,
    cancelledTodayCount: 0,
    unreachableTodayCount: 0,
    callbacksScheduledToday: 0,
    conversionRate: 0,
    maxActiveOrders: 15,
    maxActiveConversations: 5,
    activeOrdersCount: 0,
    activeConversationsCount: 0,
    commissionPerConfirmation: 750,
    avgProcessingTimeMinutes: 0,
    languages: ['Français', 'Fon'],
    zones: ['Cotonou', 'Calavi'],
    skills: ['Télévente', 'Closing'],
    lastActivityAt: 'À l\'instant',
  },
];

export const initialPayoutRequests: PayoutRequest[] = [];

export const products: Product[] = [];

export const orders: Order[] = [];

export const initialAgencyPulseActivities: ActivityItem[] = [];

export const initialConversations: Conversation[] = [];

export const initialAgencyAlerts: AgencyAlert[] = [];

export const initialTransactions: FinancialTransaction[] = [];

export const initialCodCollections: CodCollection[] = [];

export const initialCodRemittances: CodRemittance[] = [];

export const initialFinancialAuditLogs: FinancialAuditLog[] = [];

export const initialTreasuryManagers: TreasuryManagerProfile[] = [
  {
    id: 'tm-1',
    firstName: 'Amina',
    lastName: 'Tidjani',
    name: 'Amina Tidjani',
    email: 'amina.tidjani@enolivraison.com',
    phone: '+229 01 65 44 22 11',
    zone: 'Caisse Centrale Cotonou',
    status: 'ACTIF',
    createdAt: '2026-02-01',
    lastActiveAt: 'À l\'instant',
    remittancesReceivedCount: 0,
    totalFundsReceived: 0,
    discrepanciesFlaggedCount: 0,
  },
];

export const initialGlobalAuditLogs: GlobalAuditLog[] = [];

export const initialAuditSessions: AuditSessionLog[] = [];

export const initialPlatformNotifications: PlatformNotification[] = [];

export const platformRoles: RoleDefinition[] = [
  {
    id: 'PDG',
    label: 'Super Administrateur / PDG',
    category: 'DIRECTION',
    description: 'Accès total à toutes les opérations, finances et configurations de la plateforme.',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-500',
    userCount: 2,
    isSystem: true,
    defaultPermissions: ['orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'finances.view', 'finances.payouts.approve', 'finances.payouts.pay', 'settings.manage'],
  },
  {
    id: 'CLOSEUSE',
    label: 'Équipe Commerciale & Closing',
    category: 'OPERATIONS',
    description: 'Gestion des télévendeuses/closeuses, des appels clients et confirmation des commandes.',
    color: 'blue',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-500',
    userCount: 4,
    isSystem: true,
    defaultPermissions: ['orders.view', 'orders.create', 'orders.edit'],
  },
  {
    id: 'LIVREUR',
    label: 'Flotte de Livraison',
    category: 'OPERATIONS',
    description: 'Chauffeurs et coursiers pour acheminement colis et encaissement COD.',
    color: 'amber',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-500',
    userCount: 6,
    isSystem: true,
    defaultPermissions: ['orders.view', 'orders.edit'],
  },
  {
    id: 'TREASURY_MANAGER',
    label: 'Responsable Trésorerie & Caisse',
    category: 'FINANCE',
    description: 'Pointage du coffre-fort, validation des remises livreurs et paiement des retraits.',
    color: 'purple',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-500',
    userCount: 2,
    isSystem: true,
    defaultPermissions: ['orders.view', 'finances.view', 'finances.payouts.approve', 'finances.payouts.pay'],
  },
  {
    id: 'PARTNER',
    label: 'E-Commerçant Partenaire',
    category: 'PARTENAIRE',
    description: 'Portail marchand pour le suivi des stocks, livraisons et retraits Mobile Money.',
    color: 'slate',
    badgeBg: 'bg-slate-500/10',
    badgeText: 'text-slate-500',
    userCount: 12,
    isSystem: true,
    defaultPermissions: ['orders.view', 'orders.create'],
  },
];

export const platformPermissions: PermissionDefinition[] = [
  { id: 'orders.view', name: 'Voir les commandes', category: 'COMMANDES', description: 'Consulter le livre de commandes' },
  { id: 'orders.create', name: 'Créer une commande', category: 'COMMANDES', description: 'Ajouter une commande manuellement ou via webhook' },
  { id: 'orders.edit', name: 'Modifier une commande', category: 'COMMANDES', description: 'Modifier les détails ou le statut' },
  { id: 'orders.delete', name: 'Supprimer une commande', category: 'COMMANDES', description: 'Annuler ou supprimer définitivement' },
  { id: 'finances.view', name: 'Voir la trésorerie', category: 'FINANCES', description: 'Consulter le grand livre et les soldes' },
  { id: 'finances.payouts.approve', name: 'Approuver les retraits', category: 'FINANCES', description: 'Valider les demandes de retrait' },
  { id: 'finances.payouts.pay', name: 'Payer les retraits', category: 'FINANCES', description: 'Décaisser via Mobile Money / Crypto' },
  { id: 'settings.manage', name: 'Gérer les paramètres', category: 'PARAMETRES', description: 'Modifier les configurations système' },
];

export const initialRolePermissionsMap: Record<string, string[]> = {
  PDG: ['orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'finances.view', 'finances.payouts.approve', 'finances.payouts.pay', 'settings.manage'],
  CLOSEUSE: ['orders.view', 'orders.create', 'orders.edit'],
  LIVREUR: ['orders.view', 'orders.edit'],
  TREASURY_MANAGER: ['orders.view', 'finances.view', 'finances.payouts.approve', 'finances.payouts.pay'],
  PARTNER: ['orders.view', 'orders.create'],
};

export const initialPlatformUsers: PlatformUser[] = [
  {
    id: 'usr-pdg',
    firstName: 'Jude',
    lastName: 'Sinaberogui',
    name: 'Jude Sinaberogui',
    email: 'jude@enolivraison.com',
    phone: '+229 01 64 29 18 84',
    role: 'PDG',
    roleLabel: 'Président Directeur Général',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-01-01',
    avatarUrl: '/avatars/jude.jpg',
  },
  {
    id: 'usr-admin-1',
    firstName: 'Marc',
    lastName: 'Kouassi',
    name: 'Marc Kouassi',
    email: 'marc.kouassi@enolivraison.com',
    phone: '+229 01 93 83 79 06',
    role: 'SUPER_ADMIN',
    roleLabel: 'Administrateur Général',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-01-15',
  },
  {
    id: 'usr-tresor-1',
    firstName: 'Amina',
    lastName: 'Tidjani',
    name: 'Amina Tidjani',
    email: 'amina.tidjani@enolivraison.com',
    phone: '+229 01 65 44 22 11',
    role: 'TREASURY_MANAGER',
    roleLabel: 'Responsable de Trésorerie',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-02-01',
  },
  {
    id: 'usr-logist-1',
    firstName: 'Moussa',
    lastName: 'Dossou',
    name: 'Moussa Dossou',
    email: 'moussa.dossou@enolivraison.com',
    phone: '+229 01 67 51 00 82',
    role: 'LOGISTICS_MANAGER',
    roleLabel: 'Responsable Logistique',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-02-10',
  },
  {
    id: 'usr-closer-1',
    firstName: 'Sarah',
    lastName: 'Kone',
    name: 'Sarah Kone',
    email: 'sarah.kone@enolivraison.com',
    phone: '+229 01 92 33 44 55',
    role: 'CLOSEUSE',
    roleLabel: 'Closeuse Télévente',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-02-15',
  },
  {
    id: 'usr-driver-1',
    firstName: 'Paul',
    lastName: 'Agossou',
    name: 'Paul Agossou',
    email: 'paul.agossou@enolivraison.com',
    phone: '+229 01 95 12 34 56',
    role: 'LIVREUR',
    roleLabel: 'Livreur Moto',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-03-01',
  },
  {
    id: 'usr-partner-1',
    firstName: 'Partenaire',
    lastName: 'Principal',
    name: 'Ma Boutique',
    email: 'partenaire@enolivraison.com',
    phone: '+229 01 64 29 18 84',
    role: 'PARTNER',
    roleLabel: 'E-commerçant Partenaire',
    status: 'active',
    customPermissions: [],
    lastLoginAt: 'Nouveau compte',
    createdAt: '2026-01-15',
  },
];

export const initialPlatformSettings: PlatformSettings = {
  general: {
    platformName: 'ENO LIVRAISON',
    companyName: 'ENO LOGISTICS TECH SARL',
    logoUrl: '/images/eno_livraison_logo.png',
    supportEmail: 'contact@enolivraison.com',
    supportPhone: '+229 01 64 29 18 84',
    secondaryPhone: '+229 01 93 83 79 06',
    whatsappContact: '+229 01 64 29 18 84',
    headquartersAddress: 'Cadjehoun / Haie Vive, Rue 340, Cotonou, Bénin',
    currency: 'FCFA',
    timezone: 'Africa/Porto-Novo (GMT+1)',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false,
    allowPublicRegistration: true,
  },
  operational: {
    ordersAssignmentMode: 'SMART_AUTO',
    conversationsAssignmentMode: 'SMART_AUTO',
    maxCapacityPerCloser: 15,
    maxCapacityPerDriver: 20,
    estimatedDeliveryMinutes: 120,
    criticalDelayHours: 4,
    autoRedistribute: true,
    redistributeTimeoutMinutes: 30,
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:30',
    sundayDeliveries: false,
    requireDeliveryPhotoConfirmation: true,
    enableCodSecurityLimits: true,
    maxDriverCodCeilingFCFA: 150000,
  },
  financial: {
    defaultClosingFee: 800,
    defaultDeliveryFee: 2000,
    defaultCommissionRate: 5,
    minWithdrawalThreshold: 10000,
    maxDailyWithdrawalLimit: 5000000,
    payoutProcessingDelayHours: 24,
    autoApprovePayoutsBelow: 50000,
    requireDoubleValidationAbove: 500000,
    codReconciliationDeadlineHours: 24,
  },
  paymentGateways: {
    leekpay: {
      enabled: true,
      environment: 'PRODUCTION',
      status: 'ACTIVE',
      webhookConfigured: true,
      supportedChannels: ['MTN Mobile Money', 'Moov Money Bénin', 'Orange Money CI', 'Wave Côte d\'Ivoire'],
      publicKeyMasked: 'pk_live_••••••••••••••••94f2',
      apiEndpoint: 'https://api.leekpay.com/v1',
    },
    binancePay: {
      enabled: true,
      status: 'ACTIVE',
      merchantIdMasked: 'BNP_••••••••2841',
      webhookConfigured: true,
      supportedCurrencies: ['USDT', 'BUSD', 'BNB'],
    },
    usdtCrypto: {
      enabled: true,
      status: 'ACTIVE',
      supportedNetworks: ['TRC-20 (Tron)', 'BEP-20 (BNB Smart Chain)', 'ERC-20 (Ethereum)', 'Polygon'],
      defaultNetwork: 'TRC-20 (Tron)',
      walletAddressMasked: 'TXk7••••••••••••••••••••••••••3z8K',
      minWithdrawalUsdt: 20,
    },
  },
  notifications: {
    orders: {
      newOrder: true,
      unassignedOrder: true,
      cancelledOrder: true,
      orderDelivered: true,
    },
    deliveries: {
      delayedDelivery: true,
      failedDelivery: true,
      criticalDelay: true,
    },
    finances: {
      newPayoutRequest: true,
      codDiscrepancy: true,
      highValueRemittance: true,
      withdrawalPaid: true,
    },
    system: {
      criticalIncident: true,
      securityAlert: true,
      dailyBackupSummary: true,
      userSuspension: true,
    },
  },
  security: {
    enforce2FAForAdmins: true,
    sessionTimeoutMinutes: 120,
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    requirePasswordChangeDays: 90,
    ipWhitelistEnabled: false,
    allowedIps: ['41.85.160.22', '197.234.221.10'],
    auditAllAdminActions: true,
  },
  lastUpdated: '15 sept. 2026 à 21:00',
  updatedBy: 'Jude S. (PDG)',
};

export function getPartnerOrders(partnerId: string): Order[] {
  return orders.filter((o) => o.partnerId === partnerId);
}

export function getPartnerProducts(partnerId: string): Product[] {
  return products.filter((p) => p.partnerId === partnerId);
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CMD-BJ';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
