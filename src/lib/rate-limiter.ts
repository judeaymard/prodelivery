/**
 * Rate Limiter Léger In-Memory
 * GuinéeGo LAT 2027 — Phase 5 Security Hardening
 * 
 * Protection anti-bruteforce et limitation de fréquence sur les routes sensibles
 * (authentification, décaissement, création de commandes).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Nettoyage périodique toutes les 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  totalLimit: number;
}

/**
 * Vérifie et applique une limite de requêtes par clé (ex: IP ou Identifiant)
 * 
 * @param key Identifiant unique du demandeur (IP, user ID, email)
 * @param limit Nombre maximal de requêtes autorisées sur la période
 * @param windowSeconds Durée de la fenêtre en secondes
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
      totalLimit: limit,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetSeconds = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      totalLimit: limit,
    };
  }

  return {
    allowed: true,
    remaining,
    resetSeconds,
    totalLimit: limit,
  };
}
