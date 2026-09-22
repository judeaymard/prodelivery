import { promises as fs } from "fs";
import path from "path";
import type { BrandConfig } from "./brand-config.types";
import {
  Conversation,
  ChatMessage,
  ChatAttachment,
  PlatformNotification,
  PlatformUser,
  PlatformSettings,
  PayoutRequest,
  Order,
  FinancialTransaction,
  GlobalAuditLog,
  Partner,
  LivreurProfile,
  CloseuseProfile,
  TreasuryManagerProfile,
  CodRemittance,
} from "./types";
import {
  initialConversations,
  initialPlatformNotifications,
  initialPlatformUsers,
  initialPlatformSettings,
  initialRolePermissionsMap,
  initialPayoutRequests,
  orders as initialOrders,
  initialTransactions,
  initialGlobalAuditLogs,
  partners as initialPartners,
  livreurs as initialLivreurs,
  closeuses as initialCloseuses,
  initialTreasuryManagers,
  initialCodRemittances,
} from "./mock-data";

const DATA_DIR = path.join(process.cwd(), "data");
const CONVERSATIONS_FILE = path.join(DATA_DIR, "conversations.json");
const ATTACHMENTS_FILE = path.join(DATA_DIR, "attachments.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ROLES_PERMISSIONS_FILE = path.join(DATA_DIR, "roles_permissions.json");
const PAYOUTS_FILE = path.join(DATA_DIR, "payouts.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");
const PARTNERS_FILE = path.join(DATA_DIR, "partners.json");
const DRIVERS_FILE = path.join(DATA_DIR, "drivers.json");
const CLOSERS_FILE = path.join(DATA_DIR, "closers.json");
const TREASURY_FILE = path.join(DATA_DIR, "treasury.json");
const REMITTANCES_FILE = path.join(DATA_DIR, "remittances.json");
const STORAGE_DIR = path.join(process.cwd(), "storage", "attachments");
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "conversations");

/**
 * Initialise les répertoires et fichiers de persistance serveur si nécessaire.
 */
export async function initDatabase(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });

    // Initialisation du fichier conversations.json s'il n'existe pas
    try {
      await fs.access(CONVERSATIONS_FILE);
    } catch {
      await fs.writeFile(
        CONVERSATIONS_FILE,
        JSON.stringify(initialConversations, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier attachments.json s'il n'existe pas
    try {
      await fs.access(ATTACHMENTS_FILE);
    } catch {
      await fs.writeFile(ATTACHMENTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    // Initialisation du fichier notifications.json s'il n'existe pas
    try {
      await fs.access(NOTIFICATIONS_FILE);
    } catch {
      await fs.writeFile(
        NOTIFICATIONS_FILE,
        JSON.stringify(initialPlatformNotifications, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier settings.json s'il n'existe pas
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(
        SETTINGS_FILE,
        JSON.stringify(initialPlatformSettings, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier users.json s'il n'existe pas
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(
        USERS_FILE,
        JSON.stringify(initialPlatformUsers, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier partners.json s'il n'existe pas
    try {
      await fs.access(PARTNERS_FILE);
    } catch {
      await fs.writeFile(
        PARTNERS_FILE,
        JSON.stringify(initialPartners, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier roles_permissions.json s'il n'existe pas
    try {
      await fs.access(ROLES_PERMISSIONS_FILE);
    } catch {
      await fs.writeFile(
        ROLES_PERMISSIONS_FILE,
        JSON.stringify(initialRolePermissionsMap, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier payouts.json s'il n'existe pas
    try {
      await fs.access(PAYOUTS_FILE);
    } catch {
      await fs.writeFile(
        PAYOUTS_FILE,
        JSON.stringify(initialPayoutRequests, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier orders.json s'il n'existe pas
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(
        ORDERS_FILE,
        JSON.stringify(initialOrders, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier transactions.json s'il n'existe pas
    try {
      await fs.access(TRANSACTIONS_FILE);
    } catch {
      await fs.writeFile(
        TRANSACTIONS_FILE,
        JSON.stringify(initialTransactions, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier audit.json s'il n'existe pas
    try {
      await fs.access(AUDIT_FILE);
    } catch {
      await fs.writeFile(
        AUDIT_FILE,
        JSON.stringify(initialGlobalAuditLogs, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier drivers.json s'il n'existe pas
    try {
      await fs.access(DRIVERS_FILE);
    } catch {
      await fs.writeFile(
        DRIVERS_FILE,
        JSON.stringify(initialLivreurs, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier closers.json s'il n'existe pas
    try {
      await fs.access(CLOSERS_FILE);
    } catch {
      await fs.writeFile(
        CLOSERS_FILE,
        JSON.stringify(initialCloseuses, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier treasury.json s'il n'existe pas
    try {
      await fs.access(TREASURY_FILE);
    } catch {
      await fs.writeFile(
        TREASURY_FILE,
        JSON.stringify(initialTreasuryManagers, null, 2),
        "utf-8"
      );
    }

    // Initialisation du fichier remittances.json s'il n'existe pas
    try {
      await fs.access(REMITTANCES_FILE);
    } catch {
      await fs.writeFile(
        REMITTANCES_FILE,
        JSON.stringify(initialCodRemittances, null, 2),
        "utf-8"
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données serveur:", error);
  }
}

/**
 * Récupère l'ensemble des conversations enregistrées côté serveur.
 */
export async function getConversations(): Promise<Conversation[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture conversations.json:", error);
  }
  return initialConversations;
}

/**
 * Récupère une conversation spécifique par son identifiant.
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const conversations = await getConversations();
  return conversations.find((c) => c.id === id) || null;
}

/**
 * Enregistre ou met à jour une conversation.
 */
export async function saveConversation(conversation: Conversation): Promise<Conversation> {
  await initDatabase();
  const conversations = await getConversations();
  const index = conversations.findIndex((c) => c.id === conversation.id);

  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  await fs.writeFile(
    CONVERSATIONS_FILE,
    JSON.stringify(conversations, null, 2),
    "utf-8"
  );
  return conversation;
}

/**
 * Récupère l'ensemble des métadonnées de pièces jointes enregistrées.
 */
export async function getAttachments(): Promise<ChatAttachment[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(ATTACHMENTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture attachments.json:", error);
  }
  return [];
}

/**
 * Récupère une pièce jointe par son identifiant unique.
 */
export async function getAttachmentById(id: string): Promise<ChatAttachment | null> {
  const attachments = await getAttachments();
  return attachments.find((a) => a.id === id) || null;
}

/**
 * Enregistre une nouvelle pièce jointe dans la base de données.
 */
export async function saveAttachment(attachment: ChatAttachment): Promise<ChatAttachment> {
  await initDatabase();
  const attachments = await getAttachments();
  const index = attachments.findIndex((a) => a.id === attachment.id);

  if (index >= 0) {
    attachments[index] = attachment;
  } else {
    attachments.unshift(attachment);
  }

  await fs.writeFile(
    ATTACHMENTS_FILE,
    JSON.stringify(attachments, null, 2),
    "utf-8"
  );
  return attachment;
}

/**
 * Enregistre un message dans une conversation et relie les pièces jointes associées.
 */
export async function saveMessageToConversation(
  conversationId: string,
  message: ChatMessage,
  convUpdates?: {
    assignedAgentName?: string;
    assignedAgentRole?: string;
    status?: Conversation["status"];
  }
): Promise<{ conversation: Conversation; message: ChatMessage }> {
  await initDatabase();
  const conversations = await getConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);

  let targetConv: Conversation;
  if (convIndex >= 0) {
    targetConv = conversations[convIndex];
  } else {
    targetConv = {
      id: conversationId,
      partnerId: "p1",
      partnerName: "Client Inconnu",
      companyName: conversationId,
      phone: "+229 00 00 00 00",
      lastMessage: message.text || "Nouvelle conversation",
      lastMessageAt: "À l'instant",
      unreadCount: 0,
      status: "OPEN",
      priority: "NORMAL",
      messages: [],
    };
    conversations.unshift(targetConv);
  }

  // Mettre à jour les pièces jointes avec le messageId
  if (message.attachments && message.attachments.length > 0) {
    const attachments = await getAttachments();
    let updatedAttachments = false;

    for (const att of message.attachments) {
      const attIndex = attachments.findIndex((a) => a.id === att.id);
      if (attIndex >= 0) {
        attachments[attIndex].messageId = message.id;
        attachments[attIndex].conversationId = conversationId;
        updatedAttachments = true;
      } else {
        attachments.push({
          ...att,
          messageId: message.id,
          conversationId,
        });
        updatedAttachments = true;
      }
    }

    if (updatedAttachments) {
      await fs.writeFile(
        ATTACHMENTS_FILE,
        JSON.stringify(attachments, null, 2),
        "utf-8"
      );
    }
  }

  // Appliquer les métadonnées d'assignation ou de statut si fournies
  if (convUpdates?.assignedAgentName) {
    targetConv.assignedAgentName = convUpdates.assignedAgentName;
    targetConv.assignedAgentRole = convUpdates.assignedAgentRole || "Support";
  }
  if (convUpdates?.status) {
    targetConv.status = convUpdates.status;
  } else if (targetConv.status === "RESOLVED") {
    targetConv.status = "OPEN";
  }

  // Ajouter le message à la conversation
  const updatedMessages = [...targetConv.messages, message];
  const hasAtts = message.attachments && message.attachments.length > 0;
  const attLabel = hasAtts
    ? ` (${message.attachments!.length} pièce${message.attachments!.length > 1 ? "s" : ""} jointe${message.attachments!.length > 1 ? "s" : ""})`
    : "";

  targetConv.messages = updatedMessages;
  targetConv.lastMessage = `${message.text || "Fichier joint"}${attLabel}`;
  targetConv.lastMessageAt = "À l'instant";

  await fs.writeFile(
    CONVERSATIONS_FILE,
    JSON.stringify(conversations, null, 2),
    "utf-8"
  );

  return { conversation: targetConv, message };
}

/**
 * Vérifie si un utilisateur a le droit d'accéder à une pièce jointe selon les règles de permission.
 */
export async function checkAttachmentAccess(
  attachment: ChatAttachment,
  userRole?: string,
  userId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Sans rôle spécifié ou rôle système PDG / Direction
  if (!userRole || userRole === "PDG" || userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return { allowed: true };
  }

  // Responsable de trésorerie : accès aux pièces jointes de la plateforme
  if (userRole === "TREASURY_MANAGER" || userRole === "TREASURY") {
    return { allowed: true };
  }

  // Trouver la conversation associée
  if (attachment.conversationId) {
    const conv = await getConversationById(attachment.conversationId);
    if (!conv) {
      return { allowed: false, reason: "Conversation introuvable." };
    }

    // Closeuse : autorisée si la conversation est assignée à elle ou non assignée
    if (userRole === "CLOSEUSE" || userRole === "AGENT") {
      if (!conv.assignedAgentId || conv.assignedAgentId === userId || !userId) {
        return { allowed: true };
      }
      return { allowed: true }; // Closeuses de l'agence autorisées à consulter les supports
    }

    // E-commerçant / Partenaire : autorisé seulement pour ses propres conversations
    if (userRole === "PARTNER" || userRole === "ECOMMERCANT") {
      if (userId && conv.partnerId && conv.partnerId !== userId) {
        return {
          allowed: false,
          reason: "Vous n'êtes pas autorisé à accéder aux fichiers de cette conversation.",
        };
      }
      return { allowed: true };
    }
  }

  return { allowed: true };
}

/**
 * Récupère l'ensemble des notifications depuis le serveur persistant.
 */
export async function getNotifications(): Promise<PlatformNotification[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture notifications.json:", error);
  }
  return initialPlatformNotifications;
}

/**
 * Enregistre ou met à jour une notification.
 */
export async function saveNotification(
  notification: PlatformNotification
): Promise<PlatformNotification> {
  await initDatabase();
  const notifications = await getNotifications();
  const index = notifications.findIndex((n) => n.id === notification.id);

  if (index >= 0) {
    notifications[index] = notification;
  } else {
    notifications.unshift(notification);
  }

  await fs.writeFile(
    NOTIFICATIONS_FILE,
    JSON.stringify(notifications, null, 2),
    "utf-8"
  );
  return notification;
}

/**
 * Marque une notification spécifique comme lue.
 */
export async function markNotificationRead(
  id: string
): Promise<PlatformNotification | null> {
  await initDatabase();
  const notifications = await getNotifications();
  const index = notifications.findIndex((n) => n.id === id);

  if (index >= 0) {
    notifications[index].isRead = true;
    await fs.writeFile(
      NOTIFICATIONS_FILE,
      JSON.stringify(notifications, null, 2),
      "utf-8"
    );
    return notifications[index];
  }
  return null;
}

/**
 * Marque l'ensemble des notifications comme lues.
 */
export async function markAllNotificationsRead(): Promise<PlatformNotification[]> {
  await initDatabase();
  const notifications = await getNotifications();
  const updated = notifications.map((n) => ({ ...n, isRead: true }));

  await fs.writeFile(
    NOTIFICATIONS_FILE,
    JSON.stringify(updated, null, 2),
    "utf-8"
  );
  return updated;
}

/**
 * Résout une alerte active.
 */
export async function resolveNotificationAlert(
  id: string
): Promise<PlatformNotification | null> {
  await initDatabase();
  const notifications = await getNotifications();
  const index = notifications.findIndex((n) => n.id === id);

  if (index >= 0) {
    notifications[index].alertStatus = "RESOLVED";
    notifications[index].isRead = true;
    await fs.writeFile(
      NOTIFICATIONS_FILE,
      JSON.stringify(notifications, null, 2),
      "utf-8"
    );
    return notifications[index];
  }
  return null;
}

// ==========================================
// ⚙️ GESTION DES PARAMÈTRES (SETTINGS)
// ==========================================

export async function getPlatformSettings(): Promise<PlatformSettings> {
  await initDatabase();
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture settings.json:", error);
  }
  return initialPlatformSettings;
}

export async function savePlatformSettings(
  settings: PlatformSettings
): Promise<PlatformSettings> {
  await initDatabase();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  return settings;
}

/**
 * Récupère la configuration de marque (White-Label) depuis settings.json.
 * Lit uniquement la section `brand` du fichier.
 * Si la section n'existe pas encore, construit un fallback minimal
 * à partir des champs `general` existants.
 *
 * ⚠️ Ne retourne JAMAIS de données sensibles (clés API, mots de passe, IPs).
 */
export async function getBrandConfig(): Promise<BrandConfig> {
  await initDatabase();
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(data);

    // La section brand existe — on la retourne directement avec médias garantis
    if (parsed?.brand && typeof parsed.brand === "object") {
      const b = parsed.brand;
      return {
        ...b,
        media: {
          heroImage: b.media?.heroImage || "/images/eno_courier_bike.png",
          secondaryImage: b.media?.secondaryImage || "/images/eno_delivery_handover.png",
          ctaImage: b.media?.ctaImage || "/images/scms_superhero.jpg",
          closingImage: b.media?.closingImage || "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif",
          closingBackImage: b.media?.closingBackImage || "/images/closing_phone_3d.jpg",
          riderImage: b.media?.riderImage || "/images/eno_courier_bike.png",
          faviconUrl: b.media?.faviconUrl || "/favicon.ico",
          ...(b.media || {}),
        },
      } as BrandConfig;
    }

    // Fallback : construire un BrandConfig minimal depuis general
    const g = parsed?.general ?? {};
    const fallback: BrandConfig = {
      identity: {
        displayName: g.platformName ?? "Plateforme",
        legalName: g.companyName ?? "Société",
        logoUrl: g.logoUrl ?? "/images/logo.png",
        tagline: "Vos colis, notre priorité",
        primaryColor: "#0d8f4f",
        accentColor: "#e52320",
        darkBgColor: "#071710",
        country: "Guinée",
        countryCode: g.countryCode ?? "+224",
      },
      media: {
        heroImage: "/images/eno_courier_bike.png",
        secondaryImage: "/images/eno_delivery_handover.png",
        ctaImage: "/images/scms_superhero.jpg",
        closingImage: "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif",
        closingBackImage: "/images/closing_phone_3d.jpg",
        riderImage: "/images/eno_courier_bike.png",
        faviconUrl: "/favicon.ico",
      },
      agencies: [],
      socials: {
        tiktok: { handle: "@plateforme", url: "#", label: "TikTok" },
        facebook: { name: "Plateforme", url: "#", label: "Facebook" },
        instagram: { handle: "@plateforme", url: "#", label: "Instagram" },
        whatsappPrimary: g.whatsappContact
          ? `https://wa.me/${g.whatsappContact.replace(/[^0-9]/g, "")}`
          : "#",
      },
      stats: {
        agencyCount: 0,
        parcelsDelivered: "0+",
        yearsActive: "—",
      },
      pricing: {
        closingFeeDisplay: "—",
        deliveryFeeDisplay: "—",
        currencyDisplay: g.currency ?? "FCFA",
      },
      hero: {
        headline: g.platformName ?? "Livraison Express",
        subtext: "Votre partenaire logistique.",
        coverageCities: [],
      },
      closing: {
        languages: "Français",
        callDelay: "< 15 min",
        conversionRate: "—",
        paymentMethods: [],
      },
      faq: [],
      registrationCities: [],
      recruitment: {},
    };
    return fallback;
  } catch (error) {
    console.error("Erreur lecture brand config depuis settings.json:", error);
    // Fallback minimal en cas d'erreur I/O
    return {
      identity: {
        displayName: "Plateforme",
        legalName: "Société",
        logoUrl: "/images/logo.png",
        tagline: "Vos colis, notre priorité",
        primaryColor: "#0d8f4f",
        accentColor: "#e52320",
        darkBgColor: "#071710",
        country: "—",
        countryCode: "+224",
      },
      agencies: [],
      socials: {
        tiktok: { handle: "@plateforme", url: "#" },
        facebook: { name: "Plateforme", url: "#" },
        instagram: { handle: "@plateforme", url: "#" },
        whatsappPrimary: "#",
      },
      stats: {},
      pricing: {},
      hero: { headline: "Plateforme", subtext: "" },
      closing: {},
      faq: [],
      registrationCities: [],
      recruitment: {},
    };
  }
}

// Verrou en mémoire pour sérialiser les écritures concurrentes de configuration
let brandConfigWriteLock: Promise<void> = Promise.resolve();

/**
 * Exécute l'écriture atomique de la configuration de marque dans settings.json.
 * Stratégie : écriture dans un fichier .tmp unique puis fs.rename atomique.
 */
async function executeAtomicSaveBrandConfig(
  brandConfig: BrandConfig
): Promise<BrandConfig> {
  const tmpFile = `${SETTINGS_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
  let current: Record<string, unknown> = {};

  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    current = JSON.parse(data);
  } catch {
    current = { ...initialPlatformSettings };
  }

  const timestamp =
    new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " à " +
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const currentGeneral =
    typeof current.general === "object" && current.general !== null
      ? (current.general as Record<string, unknown>)
      : {};

  const updated = {
    ...current,
    general: {
      ...currentGeneral,
      ...(brandConfig.identity?.displayName
        ? { platformName: brandConfig.identity.displayName }
        : {}),
      ...(brandConfig.identity?.legalName
        ? { companyName: brandConfig.identity.legalName }
        : {}),
      ...(brandConfig.identity?.logoUrl
        ? { logoUrl: brandConfig.identity.logoUrl }
        : {}),
    },
    brand: {
      ...brandConfig,
      lastUpdated: timestamp,
    },
    lastUpdated: timestamp,
  };

  try {
    // 1. Écriture dans le fichier temporaire
    await fs.writeFile(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
    // 2. Remplacement atomique du fichier de destination
    await fs.rename(tmpFile, SETTINGS_FILE);
    return updated.brand as BrandConfig;
  } catch (err) {
    // Nettoyage immédiat du fichier temporaire résiduel en cas d'échec
    try {
      await fs.unlink(tmpFile);
    } catch {}
    throw err;
  }
}

/**
 * Enregistre la configuration de marque dans settings.json de manière atomique et concurrente-sûre.
 * Fusionne avec le fichier existant (merge strict sur la clé `brand`).
 * Préserve intégralement les autres sections (general, operational, financial, security, etc.).
 */
export async function saveBrandConfig(
  brandConfig: BrandConfig
): Promise<BrandConfig> {
  await initDatabase();

  // File d'attente asynchrone pour éviter tout écrasement concurrent
  const currentLock = brandConfigWriteLock;
  let releaseLock: () => void;
  brandConfigWriteLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  try {
    await currentLock;
    return await executeAtomicSaveBrandConfig(brandConfig);
  } finally {
    releaseLock!();
  }
}


// ==========================================
// 👥 GESTION DES UTILISATEURS (USERS)
// ==========================================

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture users.json:", error);
  }
  return initialPlatformUsers;
}

export async function savePlatformUser(user: PlatformUser): Promise<PlatformUser> {
  await initDatabase();
  const users = await getPlatformUsers();
  const index = users.findIndex((u) => u.id === user.id);

  if (index >= 0) {
    users[index] = user;
  } else {
    users.unshift(user);
  }

  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  return user;
}

export async function updatePlatformUser(
  id: string,
  updates: Partial<PlatformUser>
): Promise<PlatformUser | null> {
  await initDatabase();
  const users = await getPlatformUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return users[index];
  }
  return null;
}

// ==========================================
// 🛡️ GESTION DES RÔLES & PERMISSIONS
// ==========================================

export async function getRolePermissions(): Promise<Record<string, string[]>> {
  await initDatabase();
  try {
    const data = await fs.readFile(ROLES_PERMISSIONS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture roles_permissions.json:", error);
  }
  return initialRolePermissionsMap;
}

export async function saveRolePermissions(
  roleId: string,
  permissions: string[]
): Promise<Record<string, string[]>> {
  await initDatabase();
  const map = await getRolePermissions();
  map[roleId] = permissions;
  await fs.writeFile(ROLES_PERMISSIONS_FILE, JSON.stringify(map, null, 2), "utf-8");
  return map;
}

// ==========================================
// 🏦 GESTION DES RETRAITS (PAYOUTS)
// ==========================================

export async function getPayoutRequests(): Promise<PayoutRequest[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(PAYOUTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture payouts.json:", error);
  }
  return initialPayoutRequests;
}

export async function savePayoutRequest(payout: PayoutRequest): Promise<PayoutRequest> {
  await initDatabase();
  const payouts = await getPayoutRequests();
  const index = payouts.findIndex((p) => p.id === payout.id);
  if (index >= 0) {
    payouts[index] = payout;
  } else {
    payouts.unshift(payout);
  }
  await fs.writeFile(PAYOUTS_FILE, JSON.stringify(payouts, null, 2), "utf-8");
  return payout;
}

export async function updatePayoutRequest(
  id: string,
  updates: Partial<PayoutRequest>
): Promise<PayoutRequest | null> {
  await initDatabase();
  const payouts = await getPayoutRequests();
  const index = payouts.findIndex((p) => p.id === id);
  if (index >= 0) {
    payouts[index] = { ...payouts[index], ...updates };
    await fs.writeFile(PAYOUTS_FILE, JSON.stringify(payouts, null, 2), "utf-8");
    return payouts[index];
  }
  return null;
}

// ==========================================
// 📦 GESTION DES COMMANDES (ORDERS)
// ==========================================

export async function getOrders(): Promise<Order[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture orders.json:", error);
  }
  return initialOrders;
}

export async function saveOrder(order: Order): Promise<Order> {
  await initDatabase();
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return order;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  await initDatabase();
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index >= 0) {
    orders[index] = { ...orders[index], ...updates };
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
    return orders[index];
  }
  return null;
}

// ==========================================
// 💳 GESTION DES TRANSACTIONS FINANCIÈRES
// ==========================================

export async function getTransactions(): Promise<FinancialTransaction[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(TRANSACTIONS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture transactions.json:", error);
  }
  return initialTransactions;
}

export async function saveTransaction(tx: FinancialTransaction): Promise<FinancialTransaction> {
  await initDatabase();
  const list = await getTransactions();
  // Protection Idempotence : Ne pas insérer de doublon si la même référence ou note existe déjà
  const isDuplicate = list.some(
    (t) =>
      t.id === tx.id ||
      (tx.txReference && t.txReference === tx.txReference) ||
      (tx.notes && t.notes && t.notes === tx.notes)
  );
  if (isDuplicate) {
    return tx;
  }
  list.unshift(tx);
  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return tx;
}

// ==========================================
// 🛡️ JOURNAL D'AUDIT GLOBAL
// ==========================================

export async function getGlobalAuditLogs(): Promise<GlobalAuditLog[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(AUDIT_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture audit.json:", error);
  }
  return initialGlobalAuditLogs;
}

export async function saveGlobalAuditLog(log: GlobalAuditLog): Promise<GlobalAuditLog> {
  await initDatabase();
  const list = await getGlobalAuditLogs();
  list.unshift(log);
  await fs.writeFile(AUDIT_FILE, JSON.stringify(list, null, 2), "utf-8");
  return log;
}

// ==========================================
// 🏢 GESTION DES MARCHANDS (PARTNERS)
// ==========================================

export async function getPartners(): Promise<Partner[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(PARTNERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture partners.json:", error);
  }
  return initialPartners;
}

export async function savePartner(partner: Partner): Promise<Partner> {
  await initDatabase();
  const partners = await getPartners();
  const index = partners.findIndex((p) => p.id === partner.id);
  if (index >= 0) {
    partners[index] = partner;
  } else {
    partners.unshift(partner);
  }
  await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2), "utf-8");
  return partner;
}

export async function updatePartner(
  id: string,
  updates: Partial<Partner>
): Promise<Partner | null> {
  await initDatabase();
  const partners = await getPartners();
  const index = partners.findIndex((p) => p.id === id);
  if (index >= 0) {
    partners[index] = { ...partners[index], ...updates };
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2), "utf-8");
    return partners[index];
  }
  return null;
}

// ==========================================
// 🛵 GESTION DES LIVREURS (DRIVERS)
// ==========================================

export async function getDrivers(): Promise<LivreurProfile[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(DRIVERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture drivers.json:", error);
  }
  return initialLivreurs;
}

export async function saveDriver(driver: LivreurProfile): Promise<LivreurProfile> {
  await initDatabase();
  const list = await getDrivers();
  const index = list.findIndex((d) => d.id === driver.id);
  if (index >= 0) {
    list[index] = driver;
  } else {
    list.push(driver);
  }
  await fs.writeFile(DRIVERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return driver;
}

export async function updateDriver(
  id: string,
  updates: Partial<LivreurProfile>
): Promise<LivreurProfile | null> {
  await initDatabase();
  const list = await getDrivers();
  const index = list.findIndex((d) => d.id === id);
  if (index >= 0) {
    list[index] = { ...list[index], ...updates };
    await fs.writeFile(DRIVERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[index];
  }
  return null;
}

// ==========================================
// 📞 GESTION DES CLOSEUSES (CLOSERS)
// ==========================================

export async function getClosers(): Promise<CloseuseProfile[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(CLOSERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture closers.json:", error);
  }
  return initialCloseuses;
}

export async function saveCloser(closer: CloseuseProfile): Promise<CloseuseProfile> {
  await initDatabase();
  const list = await getClosers();
  const index = list.findIndex((c) => c.id === closer.id);
  if (index >= 0) {
    list[index] = closer;
  } else {
    list.push(closer);
  }
  await fs.writeFile(CLOSERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return closer;
}

export async function updateCloser(
  id: string,
  updates: Partial<CloseuseProfile>
): Promise<CloseuseProfile | null> {
  await initDatabase();
  const list = await getClosers();
  const index = list.findIndex((c) => c.id === id);
  if (index >= 0) {
    list[index] = { ...list[index], ...updates };
    await fs.writeFile(CLOSERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[index];
  }
  return null;
}

// ==========================================
// 💰 GESTION DE LA TRÉSORERIE & REMISES (TREASURY)
// ==========================================

export async function getTreasuryManagers(): Promise<TreasuryManagerProfile[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(TREASURY_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture treasury.json:", error);
  }
  return initialTreasuryManagers;
}

export async function saveTreasuryManager(
  manager: TreasuryManagerProfile
): Promise<TreasuryManagerProfile> {
  await initDatabase();
  const list = await getTreasuryManagers();
  const index = list.findIndex((m) => m.id === manager.id);
  if (index >= 0) {
    list[index] = manager;
  } else {
    list.push(manager);
  }
  await fs.writeFile(TREASURY_FILE, JSON.stringify(list, null, 2), "utf-8");
  return manager;
}

export async function updateTreasuryManager(
  id: string,
  updates: Partial<TreasuryManagerProfile>
): Promise<TreasuryManagerProfile | null> {
  await initDatabase();
  const list = await getTreasuryManagers();
  const index = list.findIndex((m) => m.id === id);
  if (index >= 0) {
    list[index] = { ...list[index], ...updates };
    await fs.writeFile(TREASURY_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[index];
  }
  return null;
}

export async function deleteTreasuryManager(id: string): Promise<boolean> {
  await initDatabase();
  const list = await getTreasuryManagers();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length !== list.length) {
    await fs.writeFile(TREASURY_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  }
  return false;
}

export async function getCodRemittances(): Promise<CodRemittance[]> {
  await initDatabase();
  try {
    const data = await fs.readFile(REMITTANCES_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Erreur lecture remittances.json:", error);
  }
  return initialCodRemittances;
}

export async function saveCodRemittance(
  remittance: CodRemittance
): Promise<CodRemittance> {
  await initDatabase();
  const list = await getCodRemittances();
  const index = list.findIndex((r) => r.id === remittance.id);
  if (index >= 0) {
    list[index] = remittance;
  } else {
    list.unshift(remittance);
  }
  await fs.writeFile(REMITTANCES_FILE, JSON.stringify(list, null, 2), "utf-8");
  return remittance;
}

export async function updateCodRemittance(
  id: string,
  updates: Partial<CodRemittance>
): Promise<CodRemittance | null> {
  await initDatabase();
  const list = await getCodRemittances();
  const index = list.findIndex((r) => r.id === id);
  if (index >= 0) {
    list[index] = { ...list[index], ...updates };
    await fs.writeFile(REMITTANCES_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[index];
  }
  return null;
}



