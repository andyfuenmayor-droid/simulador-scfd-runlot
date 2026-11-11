import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET, SESSION_COOKIE_NAME } from "@/lib/jwtConfig";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas y enlace de llave móvil (protegido por su propio PIN Maestro)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/bcv") ||
    pathname === "/login" ||
    pathname.startsWith("/llave-movil") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Obtener el token temporal desde la cookie HttpOnly o cabecera Authorization
  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Acceso denegado: Token temporal ausente o expirado" },
        { status: 401 }
      );
    }
    return NextResponse.rewrite(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    if (
      payload.ip &&
      payload.ip !== clientIp &&
      process.env.NODE_ENV === "production"
    ) {
      console.warn(
        `[CDAPUESTAS SECURITY] Alerta de IP cambiada para sesión ${payload.sub}`
      );
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Token temporal inválido o expirado" },
        { status: 403 }
      );
    }
    const response = NextResponse.redirect(
      new URL("/login?error=session_expired", request.url)
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

