/**
 * Service d'Authentification et de Session Cryptographique
 * GuinéeGo LAT 2027 — Phase 5 Security Hardening
 * 
 * Basé sur Web Crypto API (HMAC SHA-256) pour une compatibilité totale
 * avec le Edge Runtime Next.js (middleware) et Node.js (API routes).
 */

import { UserRole } from "./types";

const SESSION_COOKIE_NAME = "eno_session";
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 heures

// Secret de signature serveur cryptographique
const AUTH_SECRET_STRING = process.env.AUTH_SECRET || (
  process.env.NODE_ENV === "production"
    ? (() => {
        console.warn("⚠️ [SECURITY WARNING] AUTH_SECRET non défini en production ! Utilisation de la clé d'urgence.");
        return "3be14e2f44a03ca8013cc0346526f4e8b574ed9edc44f2bd17272c55b3f6c31098d3ee914ee7f5273cfea82ea59c5e99";
      })()
    : "eno_livraison_secure_hmac_secret_key_2027_production_hardening"
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  partnerId?: string;
  livreurId?: string;
  closeuseId?: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Encode une chaîne en Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Encode un Uint8Array en base64url
 */
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Décode une chaîne base64url en UTF-8
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Obtient la clé cryptographique HMAC SHA-256
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = stringToUint8Array(AUTH_SECRET_STRING);
  return await crypto.subtle.importKey(
    "raw",
    keyData as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Crée un token de session signé (Header.Payload.Signature)
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "createdAt" | "expiresAt">,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    createdAt: now,
    expiresAt: now + maxAgeSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(stringToUint8Array(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(stringToUint8Array(JSON.stringify(fullPayload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToUint8Array(dataToSign) as unknown as BufferSource
  );
  const encodedSignature = base64UrlEncode(signatureBuffer);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Vérifie et déchiffre un token de session signé
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const key = await getCryptoKey();
    
    // Décodage de la signature
    const signatureBinary = atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"));
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      stringToUint8Array(dataToVerify) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Vérifier l'expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Construit l'en-tête Set-Cookie pour une session sécurisée
 */
export function buildSessionCookie(token: string, maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS): string {
  const isProduction = process.env.NODE_ENV === "production";
  const secureFlag = isProduction ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secureFlag}`;
}

/**
 * Construit l'en-tête Set-Cookie pour détruire une session (Logout)
 */
export function buildClearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const secureFlag = isProduction ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`;
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
