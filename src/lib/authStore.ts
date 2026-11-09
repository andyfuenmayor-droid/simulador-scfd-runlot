import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface GuestConnectionInfo {
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastPulseAt: string;
  expiresAt: string;
  fingerprint: string;
  terminal: string;
  runlot: string;
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  ip: string;
  event: string;
  success: boolean;
}

export interface AuthStoreData {
  accessCode: string;
  accessCodeHash: string;
  customOwnerPinHash: string | null;
  accessEnabled: boolean;
  sessionVersion: number;
  tokenDurationMinutes: number;
  codeUpdatedAt: string;
  activeGuest: GuestConnectionInfo | null;
  accessLogs: AccessLogEntry[];
}

const STORE_FILE_PATH = path.join(process.cwd(), ".auth-credentials.json");

export function sha256Hash(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text.trim() + "_scfd_salt_2026")
    .digest("hex");
}

export function generateDeviceFingerprint(
  terminalId: string,
  runlotCode: string,
  clientIp: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${terminalId}-${runlotCode}-${clientIp}`)
    .digest("hex");
}

function getDefaultStore(): AuthStoreData {
  const defaultCode = process.env.DEFAULT_ACCESS_CODE || "Cdapuestas2026*";
  return {
    accessCode: defaultCode,
    accessCodeHash: sha256Hash(defaultCode),
    customOwnerPinHash: null, // Cuando es null, acepta "2026*" y "Edgar2026*"
    accessEnabled: true,
    sessionVersion: 1,
    tokenDurationMinutes: 30,
    codeUpdatedAt: new Date().toISOString(),
    activeGuest: null,
    accessLogs: [],
  };
}

export function readAuthStore(): AuthStoreData {
  try {
    if (!fs.existsSync(STORE_FILE_PATH)) {
      const initial = getDefaultStore();
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AuthStoreData>;
    const defaults = getDefaultStore();
    return {
      ...defaults,
      ...parsed,
      accessLogs: Array.isArray(parsed.accessLogs) ? parsed.accessLogs : [],
    };
  } catch {
    return getDefaultStore();
  }
}

export function writeAuthStore(data: AuthStoreData): AuthStoreData {
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[CDAPUESTAS AUTH] Error guardando .auth-credentials.json:", err);
  }
  return data;
}

export function appendAccessLog(
  store: AuthStoreData,
  ip: string,
  event: string,
  success: boolean
): void {
  const entry: AccessLogEntry = {
    id: crypto.randomBytes(4).toString("hex"),
    timestamp: new Date().toISOString(),
    ip,
    event,
    success,
  };
  store.accessLogs = [entry, ...(store.accessLogs || [])].slice(0, 15);
}

/**
 * Verifica si el PIN Maestro ingresado desde /llave-movil es válido.
 * Por defecto acepta "2026*" y "Edgar2026*". Si el propietario definió un PIN nuevo,
 * valida contra el hash del nuevo PIN.
 */
export function verifyOwnerPin(inputPin: string): boolean {
  const cleanPin = (inputPin || "").trim();
  if (!cleanPin) return false;

  const store = readAuthStore();
  if (store.customOwnerPinHash) {
    return sha256Hash(cleanPin) === store.customOwnerPinHash;
  }

  return cleanPin === "2026*" || cleanPin === "Edgar2026*";
}

/**
 * Genera un código corto legible para dictar o enviar por WhatsApp desde el teléfono
 * Ejemplo: "SCFD-4829"
 */
export function generateRandomAccessCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `SCFD-${digits}`;
}

