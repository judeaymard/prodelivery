/**
 * Script de Purge Intégrale des Données Fictives et Assainissement
 * ENO LIVRAISON - Bénin
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_ATTACHMENTS_DIR = path.join(process.cwd(), "storage", "attachments");
const PUBLIC_UPLOADS_CONV_DIR = path.join(process.cwd(), "public", "uploads", "conversations");

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function removeDirectoryContents(dirPath) {
  if (!(await fileExists(dirPath))) return;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
  }
}

async function runPurge() {
  console.log("🧹 Début de la purge intégrale des données fictives ENO LIVRAISON...\n");

  // 1. Vider les tables opérationnelles de test
  const emptyTables = [
    "conversations.json",
    "attachments.json",
    "notifications.json",
    "audit.json",
    "remittances.json",
    "orders.json",
    "payouts.json",
    "transactions.json",
  ];

  for (const table of emptyTables) {
    const filePath = path.join(DATA_DIR, table);
    await fs.writeFile(filePath, JSON.stringify([], null, 2), "utf-8");
    console.log(`✅ ${table} : réinitialisé à []`);
  }

  // 2. Nettoyer les fichiers uploads physiques
  await removeDirectoryContents(STORAGE_ATTACHMENTS_DIR);
  console.log(`✅ Dossier de stockage storage/attachments/ : vidé`);

  await removeDirectoryContents(PUBLIC_UPLOADS_CONV_DIR);
  console.log(`✅ Dossier public/uploads/conversations/ : vidé`);

  // 3. Réinitialiser les compteurs des closeuses dans closers.json
  const closersPath = path.join(DATA_DIR, "closers.json");
  if (await fileExists(closersPath)) {
    const raw = await fs.readFile(closersPath, "utf-8");
    const closers = JSON.parse(raw);
    const cleanedClosers = closers.map((c) => ({
      ...c,
      callsTodayCount: 0,
      confirmedTodayCount: 0,
      confirmedWeekCount: 0,
      confirmedMonthCount: 0,
      cancelledTodayCount: 0,
      unreachableTodayCount: 0,
      callbacksScheduledToday: 0,
      conversionRate: 0,
      activeOrdersCount: 0,
      activeConversationsCount: 0,
      avgProcessingTimeMinutes: 0,
      lastActivityAt: "Nouveau compte",
    }));
    await fs.writeFile(closersPath, JSON.stringify(cleanedClosers, null, 2), "utf-8");
    console.log(`✅ closers.json : ${cleanedClosers.length} closeuses réinitialisées avec compteurs à 0`);
  }

  // 4. Réinitialiser les compteurs des livreurs dans drivers.json
  const driversPath = path.join(DATA_DIR, "drivers.json");
  if (await fileExists(driversPath)) {
    const raw = await fs.readFile(driversPath, "utf-8");
    const drivers = JSON.parse(raw);
    const cleanedDrivers = drivers.map((d) => ({
      ...d,
      assignedOrdersCount: 0,
      deliveredTodayCount: 0,
      deliveredWeekCount: 0,
      deliveredMonthCount: 0,
      failedTodayCount: 0,
      cashCollectedToday: 0,
      avgDeliveryTimeMinutes: 0,
      successRate: 100,
      lastActivityAt: "Nouveau compte",
      availabilityStatus: "AVAILABLE",
    }));
    await fs.writeFile(driversPath, JSON.stringify(cleanedDrivers, null, 2), "utf-8");
    console.log(`✅ drivers.json : ${cleanedDrivers.length} livreurs réinitialisés avec compteurs à 0`);
  }

  // 5. Réinitialiser la trésorerie dans treasury.json
  const treasuryPath = path.join(DATA_DIR, "treasury.json");
  if (await fileExists(treasuryPath)) {
    const raw = await fs.readFile(treasuryPath, "utf-8");
    const treasury = JSON.parse(raw);
    const cleanedTreasury = treasury.map((t) => ({
      ...t,
      remittancesReceivedCount: 0,
      totalFundsReceived: 0,
      discrepanciesFlaggedCount: 0,
      lastActiveAt: "Nouveau compte",
    }));
    await fs.writeFile(treasuryPath, JSON.stringify(cleanedTreasury, null, 2), "utf-8");
    console.log(`✅ treasury.json : ${cleanedTreasury.length} trésoriers réinitialisés avec montants à 0 FCFA`);
  }

  // 6. Nettoyer les partenaires dans partners.json
  const partnersPath = path.join(DATA_DIR, "partners.json");
  const cleanPartnerList = [
    {
      id: "p1",
      fullName: "Partenaire Principal",
      companyName: "Ma Boutique",
      email: "partenaire@enolivraison.com",
      phone: "+229 01 64 29 18 84",
      address: "Cadjehoun / Haie Vive, Cotonou, Bénin",
      city: "Cotonou",
      isActive: true,
      isApproved: true,
      status: "ACTIVE",
      category: "Commerce Général",
      websiteUrl: "https://maboutique.bj",
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
      lastPayoutDate: "Aucun retrait",
      lastActivityAt: "Nouveau compte",
      createdAt: "2026-09-17",
    },
  ];
  await fs.writeFile(partnersPath, JSON.stringify(cleanPartnerList, null, 2), "utf-8");
  console.log(`✅ partners.json : compte fictif supprimé, partenaire officiel configuré à 0 FCFA`);

  // 7. Nettoyer les utilisateurs dans users.json
  const usersPath = path.join(DATA_DIR, "users.json");
  const cleanUsersList = [
    {
      id: "usr-pdg",
      firstName: "Jude",
      lastName: "Sinaberogui",
      name: "Jude Sinaberogui",
      email: "jude@enolivraison.com",
      phone: "+229 01 64 29 18 84",
      role: "PDG",
      roleLabel: "Président Directeur Général",
      status: "active",
      avatarUrl: "/avatars/jude.jpg",
      createdAt: "2026-01-01",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Siège Cotonou (Cadjehoun)",
      is2FAEnabled: true,
      twoFactorMethod: "AUTHENTICATOR",
      notes: "",
    },
    {
      id: "usr-admin-1",
      firstName: "Marc",
      lastName: "Kouassi",
      name: "Marc Kouassi",
      email: "marc.kouassi@enolivraison.com",
      phone: "+229 01 93 83 79 06",
      role: "SUPER_ADMIN",
      roleLabel: "Administrateur Général",
      status: "active",
      createdAt: "2026-01-15",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Agence Principale Cotonou",
      is2FAEnabled: true,
      twoFactorMethod: "SMS",
      notes: "",
    },
    {
      id: "usr-tresor-1",
      firstName: "Amina",
      lastName: "Tidjani",
      name: "Amina Tidjani",
      email: "amina.tidjani@enolivraison.com",
      phone: "+229 01 65 44 22 11",
      role: "TREASURY_MANAGER",
      roleLabel: "Responsable de Trésorerie",
      status: "active",
      createdAt: "2026-02-01",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Caisse Centrale Cotonou",
      is2FAEnabled: true,
      twoFactorMethod: "AUTHENTICATOR",
      notes: "",
    },
    {
      id: "usr-logist-1",
      firstName: "Moussa",
      lastName: "Dossou",
      name: "Moussa Dossou",
      email: "moussa.dossou@enolivraison.com",
      phone: "+229 01 67 51 00 82",
      role: "LOGISTICS_MANAGER",
      roleLabel: "Responsable Logistique",
      status: "active",
      createdAt: "2026-02-10",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Hub Lokossa",
      is2FAEnabled: false,
      notes: "",
    },
    {
      id: "usr-closer-1",
      firstName: "Sarah",
      lastName: "Kone",
      name: "Sarah Kone",
      email: "sarah.kone@enolivraison.com",
      phone: "+229 01 92 33 44 55",
      role: "CLOSEUSE",
      roleLabel: "Closeuse Télévente",
      status: "active",
      createdAt: "2026-02-15",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Pôle Télévente Cotonou",
      is2FAEnabled: false,
      notes: "",
    },
    {
      id: "usr-driver-1",
      firstName: "Paul",
      lastName: "Agossou",
      name: "Paul Agossou",
      email: "paul.agossou@enolivraison.com",
      phone: "+229 01 95 12 34 56",
      role: "LIVREUR",
      roleLabel: "Livreur Moto",
      status: "active",
      createdAt: "2026-03-01",
      lastLoginAt: "Nouveau compte",
      lastActiveAt: "En ligne",
      zone: "Cotonou Centre",
      is2FAEnabled: false,
      notes: "",
    },
    {
      id: "usr-partner-1",
      firstName: "Partenaire",
      lastName: "Principal",
      name: "Ma Boutique",
      email: "partenaire@enolivraison.com",
      phone: "+229 01 64 29 18 84",
      role: "PARTNER",
      roleLabel: "Partenaire E-commerçant",
      status: "active",
      createdAt: "2026-09-17",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  ];
  await fs.writeFile(usersPath, JSON.stringify(cleanUsersList, null, 2), "utf-8");
  console.log(`✅ users.json : faux comptes de test supprimés, contacts officiels ENO LIVRAISON Bénin enregistrés`);

  console.log("\n🎉 Purge serveur terminée avec succès !");
}

runPurge().catch((err) => {
  console.error("❌ Erreur pendant la purge :", err);
  process.exit(1);
});
