import { FinancialTransaction, PayoutRequest, CodRemittance } from "../types";

export interface SyncPayloadMap {
  SAVE_ORDER: any;
  SAVE_PARTNER: any;
  SAVE_PAYOUT: PayoutRequest;
  SAVE_TRANSACTION: FinancialTransaction;
  SAVE_REMITTANCE: CodRemittance;
  SAVE_AUDIT: any;
}

/**
 * Envoie de façon asynchrone et non-bloquante les mutations vers la base serveur
 */
export async function syncToServer<K extends keyof SyncPayloadMap>(action: K, payload: SyncPayloadMap[K]): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    return res.ok;
  } catch {
    // Si déconnecté, la persistance locale prend le relais
    return false;
  }
}
