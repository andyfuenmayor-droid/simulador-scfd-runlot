import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/jwtConfig";
import { readAuthStore, writeAuthStore, appendAccessLog } from "@/lib/authStore";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  const store = readAuthStore();
  if (store.activeGuest) {
    store.activeGuest = null;
  }
  appendAccessLog(store, clientIp, "Sesión finalizada manualmente", true);
  writeAuthStore(store);

  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada correctamente",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

