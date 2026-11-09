import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import {
  JWT_SECRET,
  SESSION_COOKIE_NAME,
  shouldUseSecureCookie,
} from "@/lib/jwtConfig";
import {
  readAuthStore,
  writeAuthStore,
  sha256Hash,
  generateDeviceFingerprint,
  appendAccessLog,
} from "@/lib/authStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCode = (body.accessCode || body.password || "").trim();
    const username = (body.username || "cdapuestas").trim();
    const terminalId = (body.terminalId || "SYS-RUN-009").trim();
    const runlotCode = (body.runlotCode || "RUN-0089").trim();

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Navegador Web";

    const store = readAuthStore();

    // 1. Verificar si el propietario cortó el acceso desde su teléfono
    if (!store.accessEnabled) {
      appendAccessLog(
        store,
        clientIp,
        "Intento de ingreso con acceso bloqueado desde móvil",
        false
      );
      writeAuthStore(store);
      return NextResponse.json(
        {
          success: false,
          error:
            "El acceso a la presentación se encuentra cerrado en este momento. Solicite habilitación al propietario.",
        },
        { status: 403 }
      );
    }

    // 2. Validar Código de Acceso único (case-insensitive para códigos tipo SCFD-1234, exacto para claves)
    const isCodeValid =
      rawCode === store.accessCode ||
      rawCode.toUpperCase() === store.accessCode.toUpperCase() ||
      sha256Hash(rawCode) === store.accessCodeHash;

    if (!rawCode || !isCodeValid) {
      appendAccessLog(
        store,
        clientIp,
        `Código inválido ingresado (${rawCode.slice(0, 3)}***)`,
        false
      );
      writeAuthStore(store);
      return NextResponse.json(
        {
          success: false,
          error:
            "Código de acceso inválido o expirado. Solicite el código vigente al propietario del proyecto.",
        },
        { status: 401 }
      );
    }

    // 3. Generar huella digital única anti-copia de sesión (SHA-256)
    const deviceFingerprint = generateDeviceFingerprint(
      terminalId,
      runlotCode,
      clientIp
    );

    const durationMinutes = store.tokenDurationMinutes || 30;
    const maxAgeSeconds = durationMinutes * 60;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000);

    // 4. Firmar Token Temporal JWT con versión de sesión para revocación instantánea
    const accessToken = await new SignJWT({
      sub: username,
      terminal: terminalId,
      runlot: runlotCode,
      ip: clientIp,
      fingerprint: deviceFingerprint,
      sessionVersion: store.sessionVersion,
      durationMinutes,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${durationMinutes}m`)
      .sign(JWT_SECRET);

    // 5. Registrar invitado activo para visualización en vivo desde el teléfono (/llave-movil)
    store.activeGuest = {
      ip: clientIp,
      userAgent: userAgent.slice(0, 90),
      connectedAt: now.toISOString(),
      lastPulseAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fingerprint: deviceFingerprint.slice(0, 16).toUpperCase(),
      terminal: terminalId,
      runlot: runlotCode,
    };
    appendAccessLog(
      store,
      clientIp,
      `Acceso concedido (${durationMinutes} min) • Terminal ${terminalId}`,
      true
    );
    writeAuthStore(store);

    const response = NextResponse.json({
      success: true,
      message: "Autenticación exitosa en red CDAPUESTAS / SCFD",
      expiresIn: maxAgeSeconds,
      fingerprint: deviceFingerprint.slice(0, 16).toUpperCase(),
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err) {
    console.error("[CDAPUESTAS LOGIN ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Error interno en el servidor de autenticación" },
      { status: 500 }
    );
  }
}

