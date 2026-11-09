// ============================================================================
// CONFIGURACIÓN JWT COMPATIBLE CON EDGE RUNTIME Y NODE.JS (SCFD / RUNLOT)
// ============================================================================

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "cdapuestas_scfd_runlot_secret_key_ultra_segura_2026_art32_33"
);

export const SESSION_COOKIE_NAME = "cdapuestas_session";
export const OWNER_COOKIE_NAME = "cdapuestas_owner_key";

export interface GuestTokenPayload {
  sub: string;
  terminal: string;
  runlot: string;
  ip: string;
  fingerprint: string;
  sessionVersion: number;
  durationMinutes: number;
  iat?: number;
  exp?: number;
}

/**
 * Determina si la cookie debe llevar el flag `secure: true`.
 * Crítico para servidores accedidos por IP vía HTTP (ej. http://67.205.150.98:3000):
 * si se activa `secure: true` en HTTP sin SSL, los navegadores descartan la cookie.
 */
export function shouldUseSecureCookie(request: Request): boolean {
  if (process.env.FORCE_SECURE_COOKIE === "true") return true;
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "https") return true;
  try {
    const url = new URL(request.url);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

