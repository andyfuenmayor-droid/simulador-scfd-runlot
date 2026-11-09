import { NextResponse } from "next/server";
import {
  readAuthStore,
  writeAuthStore,
  verifyOwnerPin,
  sha256Hash,
  generateRandomAccessCode,
  appendAccessLog,
} from "@/lib/authStore";

function buildSanitizedStatus(store: ReturnType<typeof readAuthStore>) {
  let isOnlineNow = false;
  if (store.activeGuest?.lastPulseAt) {
    const diffMs =
      Date.now() - new Date(store.activeGuest.lastPulseAt).getTime();
    isOnlineNow = diffMs < 12000; // Activo en los últimos 12 segundos
  }

  return {
    accessCode: store.accessCode,
    accessEnabled: store.accessEnabled,
    tokenDurationMinutes: store.tokenDurationMinutes,
    sessionVersion: store.sessionVersion,
    codeUpdatedAt: store.codeUpdatedAt,
    hasCustomPin: Boolean(store.customOwnerPinHash),
    activeGuest: store.activeGuest
      ? {
          ...store.activeGuest,
          isOnlineNow,
        }
      : null,
    accessLogs: store.accessLogs || [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ownerPin, customCode, durationMinutes, newOwnerPin } = body;

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    // Validar PIN Maestro del Propietario en cada operación
    if (!verifyOwnerPin(ownerPin)) {
      const store = readAuthStore();
      appendAccessLog(
        store,
        clientIp,
        "Intento fallido de PIN Maestro en /llave-movil",
        false
      );
      writeAuthStore(store);
      return NextResponse.json(
        {
          success: false,
          error: "PIN Maestro incorrecto. Acceso denegado al control móvil.",
        },
        { status: 401 }
      );
    }

    const store = readAuthStore();

    if (action === "get_status") {
      return NextResponse.json({
        success: true,
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "generate_random_code") {
      const newCode = generateRandomAccessCode();
      store.accessCode = newCode;
      store.accessCodeHash = sha256Hash(newCode);
      store.accessEnabled = true;
      store.sessionVersion += 1;
      store.codeUpdatedAt = new Date().toISOString();
      store.activeGuest = null;
      appendAccessLog(
        store,
        clientIp,
        `Nuevo código aleatorio generado desde móvil: ${newCode}`,
        true
      );
      writeAuthStore(store);

      return NextResponse.json({
        success: true,
        message: `Nuevo código ${newCode} activado. Sesiones anteriores revocadas.`,
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "set_custom_code") {
      const cleanCustom = String(customCode || "").trim();
      if (cleanCustom.length < 4) {
        return NextResponse.json(
          {
            success: false,
            error: "El código o clave debe tener al menos 4 caracteres.",
          },
          { status: 400 }
        );
      }

      store.accessCode = cleanCustom;
      store.accessCodeHash = sha256Hash(cleanCustom);
      store.accessEnabled = true;
      store.sessionVersion += 1;
      store.codeUpdatedAt = new Date().toISOString();
      store.activeGuest = null;
      appendAccessLog(
        store,
        clientIp,
        "Clave de acceso personalizada actualizada desde móvil",
        true
      );
      writeAuthStore(store);

      return NextResponse.json({
        success: true,
        message: "Nueva clave de acceso activada y sesiones previas cerradas.",
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "cut_access") {
      store.accessEnabled = false;
      store.sessionVersion += 1;
      store.activeGuest = null;
      appendAccessLog(
        store,
        clientIp,
        "🛑 ACCESO CORTADO / INVITADO EXPULSADO DESDE MÓVIL",
        true
      );
      writeAuthStore(store);

      return NextResponse.json({
        success: true,
        message: "Acceso cortado. Cualquier invitado conectado ha sido expulsado.",
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "enable_access") {
      store.accessEnabled = true;
      store.sessionVersion += 1;
      appendAccessLog(
        store,
        clientIp,
        "🟢 Acceso al Simulador rehabilitado desde móvil",
        true
      );
      writeAuthStore(store);

      return NextResponse.json({
        success: true,
        message: "Acceso al Simulador habilitado nuevamente.",
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "set_duration") {
      const mins = Number(durationMinutes);
      if ([15, 30, 60, 240].includes(mins)) {
        store.tokenDurationMinutes = mins;
        appendAccessLog(
          store,
          clientIp,
          `Duración de token ajustada a ${mins} minutos`,
          true
        );
        writeAuthStore(store);
      }
      return NextResponse.json({
        success: true,
        message: `Duración ajustada a ${store.tokenDurationMinutes} minutos.`,
        status: buildSanitizedStatus(store),
      });
    }

    if (action === "change_owner_pin") {
      const cleanNewPin = String(newOwnerPin || "").trim();
      if (cleanNewPin.length < 4) {
        return NextResponse.json(
          {
            success: false,
            error: "El nuevo PIN Maestro debe tener al menos 4 caracteres.",
          },
          { status: 400 }
        );
      }

      store.customOwnerPinHash = sha256Hash(cleanNewPin);
      appendAccessLog(
        store,
        clientIp,
        "🔐 PIN Maestro de Propietario actualizado desde móvil",
        true
      );
      writeAuthStore(store);

      return NextResponse.json({
        success: true,
        newPin: cleanNewPin,
        message: "Tu PIN Maestro personal ha sido actualizado exitosamente.",
        status: buildSanitizedStatus(store),
      });
    }

    return NextResponse.json(
      { success: false, error: "Acción no reconocida" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[MOBILE CONTROL ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Error procesando comando móvil" },
      { status: 500 }
    );
  }
}

