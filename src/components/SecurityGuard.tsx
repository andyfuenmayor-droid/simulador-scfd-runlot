"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, Lock, LogOut } from "lucide-react";

export default function SecurityGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [remainingMin, setRemainingMin] = useState<number | null>(null);

  // 1. Protección Antidebugger y Anticopia (F12, Ctrl+Shift+I/J/C, Ctrl+U, Clic Derecho)
  useEffect(() => {
    const showRestrictedNotice = (msg: string) => {
      setSecurityWarning(msg);
      setTimeout(() => {
        setSecurityWarning(null);
      }, 3500);
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (pathname.startsWith("/llave-movil")) return;
      e.preventDefault();
      showRestrictedNotice(
        "Inspección deshabilitada: Propiedad intelectual protegida (RUNLOT / CDAPUESTAS)."
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const isDevToolsShortcut =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (key === "I" || key === "J" || key === "C")) ||
        (e.metaKey && e.altKey && (key === "I" || key === "J" || key === "C")) ||
        ((e.ctrlKey || e.metaKey) && key === "U");

      if (isDevToolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
        showRestrictedNotice(
          "Acción restringida por protocolos de seguridad y fiscalización RUNLOT / CDAPUESTAS."
        );
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  // 2. Pulso en Tiempo Real cada 4 segundos para detectar corte de acceso desde el teléfono (/llave-movil)
  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/llave-movil")) {
      return;
    }

    let active = true;

    const checkSessionPulse = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });
        if (!active) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errParam =
            data.reason === "access_disabled" || data.reason === "code_rotated"
              ? "revoked"
              : "session_expired";
          router.replace(`/login?error=${errParam}`);
          return;
        }

        const data = await res.json();
        if (typeof data.remainingSeconds === "number") {
          setRemainingMin(Math.ceil(data.remainingSeconds / 60));
        }
      } catch {
        // Silencioso ante micro-cortes de red
      }
    };

    checkSessionPulse();
    const timer = setInterval(checkSessionPulse, 4000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pathname, router]);

  const handleGuestLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  };

  return (
    <>
      {/* Notificación flotante de bloqueo antidebugger */}
      {securityWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] bg-rose-950/95 border-2 border-rose-500 text-rose-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-bounce">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-bold leading-snug">{securityWarning}</span>
        </div>
      )}

      {/* Indicador discreto de sesión temporal autorizada (solo en el simulador principal, oculto al imprimir) */}
      {pathname === "/" && (
        <div className="print:hidden bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-[11px] font-mono flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Sesión Temporal Cifrada <strong className="text-emerald-400">SCFD / RUNLOT</strong>
              {remainingMin !== null ? ` • Validez restante: ${remainingMin} min` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={handleGuestLogout}
            className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/40 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Salir</span>
          </button>
        </div>
      )}

      {children}
    </>
  );
}

