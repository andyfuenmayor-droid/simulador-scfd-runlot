import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET, SESSION_COOKIE_NAME } from "@/lib/jwtConfig";
import { readAuthStore, writeAuthStore } from "@/lib/authStore";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, reason: "no_token" },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const store = readAuthStore();

    // Verificar si el propietario revocó el acceso o rotó el código desde /llave-movil
    if (
      !store.accessEnabled ||
      typeof payload.sessionVersion !== "number" ||
      payload.sessionVersion !== store.sessionVersion
    ) {
      if (store.activeGuest) {
        store.activeGuest = null;
        writeAuthStore(store);
      }
      const res = NextResponse.json(
        {
          authenticated: false,
          reason: !store.accessEnabled ? "access_disabled" : "code_rotated",
        },
        { status: 401 }
      );
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = payload.exp || nowSec;
    const remainingSeconds = Math.max(0, expSec - nowSec);

    // Actualizar pulso en vivo para que el teléfono del propietario vea al invitado conectado
    if (store.activeGuest) {
      store.activeGuest.lastPulseAt = new Date().toISOString();
      writeAuthStore(store);
    }

    return NextResponse.json({
      authenticated: true,
      user: payload.sub || "cdapuestas",
      terminal: payload.terminal || "SYS-RUN-009",
      runlot: payload.runlot || "RUN-0089",
      fingerprint: String(payload.fingerprint || "").slice(0, 12).toUpperCase(),
      remainingSeconds,
    });
  } catch {
    const res = NextResponse.json(
      { authenticated: false, reason: "expired_or_invalid" },
      { status: 401 }
    );
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }
}

