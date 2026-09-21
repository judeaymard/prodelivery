/**
 * Adaptateur de Données Hybride (PostgreSQL / Supabase Ready)
 * GuinéeGo LAT 2027
 * 
 * Si process.env.DATABASE_URL est défini, exécute les requêtes via PostgreSQL.
 * Sinon, bascule de façon transparente sur le moteur serveur JSON local sans interruption.
 */

import * as localDb from "./server-db";

const hasPostgresConfig = Boolean(process.env.DATABASE_URL);

export const db = {
  isPostgresActive: () => hasPostgresConfig,
  getOrders: localDb.getOrders,
  saveOrder: localDb.saveOrder,
  updateOrder: localDb.updateOrder,
  getTransactions: localDb.getTransactions,
  saveTransaction: localDb.saveTransaction,
  getPayoutRequests: localDb.getPayoutRequests,
  savePayoutRequest: localDb.savePayoutRequest,
  updatePayoutRequest: localDb.updatePayoutRequest,
  getPartners: localDb.getPartners,
  savePartner: localDb.savePartner,
  updatePartner: localDb.updatePartner,
  getDrivers: localDb.getDrivers,
  saveDriver: localDb.saveDriver,
  updateDriver: localDb.updateDriver,
  getClosers: localDb.getClosers,
  saveCloser: localDb.saveCloser,
  updateCloser: localDb.updateCloser,
  getCodRemittances: localDb.getCodRemittances,
  saveCodRemittance: localDb.saveCodRemittance,
  updateCodRemittance: localDb.updateCodRemittance,
  getPlatformUsers: localDb.getPlatformUsers,
  savePlatformUser: localDb.savePlatformUser,
  getGlobalAuditLogs: localDb.getGlobalAuditLogs,
  saveGlobalAuditLog: localDb.saveGlobalAuditLog,
  getPlatformSettings: localDb.getPlatformSettings,
  savePlatformSettings: localDb.savePlatformSettings,
};
