"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Share2,
  PowerOff,
  Power,
  KeyRound,
  Clock,
  Radio,
  Lock,
  Eye,
  EyeOff,
  History,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";

interface GuestInfo {
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastPulseAt: string;
  expiresAt: string;
  fingerprint: string;
  isOnlineNow: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  ip: string;
  event: string;
  success: boolean;
}

interface MobileStatus {
  accessCode: string;
  accessEnabled: boolean;
  tokenDurationMinutes: number;
  sessionVersion: number;
  codeUpdatedAt: string;
  hasCustomPin: boolean;
  activeGuest: GuestInfo | null;
  accessLogs: LogEntry[];
}

export default function LlaveMovilPage() {
  const [ownerPin, setOwnerPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [rememberPin, setRememberPin] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<MobileStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Estado para clave manual de invitado
  const [customGuestCode, setCustomGuestCode] = useState("");

  // Estado para cambiar el PIN Maestro del propietario desde el celular
  const [showPinChange, setShowPinChange] = useState(false);
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [confirmOwnerPin, setConfirmOwnerPin] = useState("");

  const executeMobileAction = useCallback(
    async (
      action: string,
      pinToUse: string,
      extraPayload: Record<string, unknown> = {},
      silent = false
    ) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch("/api/auth/mobile-control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            ownerPin: pinToUse,
            ...extraPayload,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (!silent) {
            setFeedback({
              type: "err",
              text: data.error || "Error de autorización",
            });
          }
          if (res.status === 401) {
            setIsUnlocked(false);
            try {
              localStorage.removeItem("scfd_owner_pin");
            } catch {}
          }
          return false;
        }

        if (data.status) {
          setStatus(data.status);
        }
        if (data.message && !silent) {
          setFeedback({ type: "ok", text: data.message });
        }
        setIsUnlocked(true);
        return true;
      } catch {
        if (!silent) {
          setFeedback({
            type: "err",
            text: "Error de red conectando con el servidor.",
          });
        }
        return false;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  // Auto-desbloqueo si el propietario guardó su PIN en su teléfono
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem("scfd_owner_pin");
      if (savedPin) {
        setOwnerPin(savedPin);
        executeMobileAction("get_status", savedPin, {}, true);
      }
    } catch {}
  }, [executeMobileAction]);

  // Refresco en tiempo real cada 4 segundos cuando el panel móvil está abierto
  useEffect(() => {
    if (!isUnlocked || !ownerPin) return;
    const interval = setInterval(() => {
      executeMobileAction("get_status", ownerPin, {}, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isUnlocked, ownerPin, executeMobileAction]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const ok = await executeMobileAction("get_status", ownerPin);
    if (ok && rememberPin) {
      try {
        localStorage.setItem("scfd_owner_pin", ownerPin.trim());
      } catch {}
    }
  };

  const handleCopyCode = async () => {
    if (!status) return;
    try {
      await navigator.clipboard.writeText(status.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    if (!status) return;
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://simulador.site";
    const text = [
      "*ACCESO AUTORIZADO — SIMULADOR SCFD / RUNLOT*",
      `🔗 *Enlace:* ${origin}`,
      `🔑 *Código de Acceso:* ${status.accessCode}`,
      `⏱️ *Validez de Sesión:* ${status.tokenDurationMinutes} minutos`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSaveCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGuestCode.trim()) return;
    const ok = await executeMobileAction("set_custom_code", ownerPin, {
      customCode: customGuestCode.trim(),
    });
    if (ok) setCustomGuestCode("");
  };

  const handleSaveNewOwnerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOwnerPin.trim().length < 4) {
      setFeedback({
        type: "err",
        text: "El nuevo PIN Maestro debe tener al menos 4 caracteres.",
      });
      return;
    }
    if (newOwnerPin.trim() !== confirmOwnerPin.trim()) {
      setFeedback({
        type: "err",
        text: "La confirmación del nuevo PIN no coincide.",
      });
      return;
    }

    const updatedPin = newOwnerPin.trim();
    const ok = await executeMobileAction("change_owner_pin", ownerPin, {
      newOwnerPin: updatedPin,
    });
    if (ok) {
      setOwnerPin(updatedPin);
      if (rememberPin) {
        try {
          localStorage.setItem("scfd_owner_pin", updatedPin);
        } catch {}
      }
      setNewOwnerPin("");
      setConfirmOwnerPin("");
      setShowPinChange(false);
    }
  };

  const handleLockPhonePanel = () => {
    try {
      localStorage.removeItem("scfd_owner_pin");
    } catch {}
    setIsUnlocked(false);
    setOwnerPin("");
    setStatus(null);
  };

  // ============================================================================
  // VISTA 1: BLOQUEO CON PIN MAESTRO EN EL TELÉFONO
  // ============================================================================
  if (!isUnlocked || !status) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center p-4">
        <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              LLAVE MÓVIL PRIVADA • PROPIETARIO
            </div>
            <h1 className="text-lg font-black text-white">
              Control Remoto CDAPUESTAS
            </h1>
            <p className="text-xs text-slate-400">
              Ingrese su <strong className="text-white">PIN Maestro Personal</strong> para recibir el código de acceso activo o cortar sesiones en vivo.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                feedback.type === "err"
                  ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
                  : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                PIN Maestro de Propietario
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? "text" : "password"}
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  placeholder="PIN Maestro"
                  autoFocus
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold tracking-wider focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPin}
                onChange={(e) => setRememberPin(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500"
              />
              <span>Recordar llave maestra en este teléfono</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider font-mono shadow-lg shadow-emerald-950/60 cursor-pointer"
            >
              {loading ? "Abriendo Llave Móvil..." : "Abrir Control Móvil"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: PANEL DE CONTROL REMOTO EN EL TELÉFONO DEL PROPIETARIO
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3.5 sm:p-5 pb-12">
      <div className="max-w-md mx-auto space-y-4">
        {/* Cabecera Móvil */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                LLAVE MÓVIL • CDAPUESTAS
              </div>
              <div className="text-xs font-extrabold text-white">
                Control de Acceso Remoto
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLockPhonePanel}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>

        {/* Notificación de acción */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-mono font-bold border flex items-center justify-between ${
              feedback.type === "err"
                ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[10px] underline ml-2"
            >
              OK
            </button>
          </div>
        )}

        {/* TARJETA 1: VISOR Y RECEPTOR DEL CÓDIGO DE ACCESO ACTIVO */}
        <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-300 font-extrabold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-400" />
              Código de Acceso Vigente
            </span>
            <span
              className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border ${
                status.accessEnabled
                  ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                  : "bg-rose-950 text-rose-300 border-rose-500/50"
              }`}
            >
              {status.accessEnabled ? "🟢 HABILITADO" : "🔴 BLOQUEADO"}
            </span>
          </div>

          {/* Pantalla Grande del Código */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Entregue este código al invitado para entrar:
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white select-all py-1">
              {status.accessCode}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Versión #{status.sessionVersion} • Duración:{" "}
              <strong className="text-emerald-400">
                {status.tokenDurationMinutes} min
              </strong>
            </div>
          </div>

          {/* Botones Rápidos: Copiar, WhatsApp y Generar Nuevo */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              executeMobileAction("generate_random_code", ownerPin)
            }
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Generar Nuevo Código en 1 Toque</span>
          </button>
        </div>

        {/* TARJETA 2: RADAR DE CONEXIÓN EN VIVO Y BOTÓN ROJO DE EXPULSIÓN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Radio
                className={`w-4 h-4 ${
                  status.activeGuest?.isOnlineNow
                    ? "text-emerald-400 animate-pulse"
                    : "text-slate-500"
                }`}
              />
              Radar de Invitado en Vivo
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Pulso cada 4s
            </span>
          </div>

          {status.activeGuest ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between font-bold text-emerald-300">
                <span>
                  {status.activeGuest.isOnlineNow
                    ? "🟢 INVITADO VIENDO EL PROYECTO AHORA"
                    : "🟡 SESIÓN ABIERTA RECIENTEMENTE"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                • <strong>IP Invitado:</strong> {status.activeGuest.ip}
              </div>
              <div className="text-[11px] text-slate-300">
                • <strong>Huella SHA-256:</strong>{" "}
                {status.activeGuest.fingerprint}
              </div>
              <div className="text-[10.5px] text-slate-400 truncate">
                • <strong>Equipo:</strong> {status.activeGuest.userAgent}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-400">
              ⚪ Ningún invitado conectado en este instante.
            </div>
          )}

          {/* Botón Rojo de Corte Instantáneo o Rehabilitación */}
          {status.accessEnabled ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => executeMobileAction("cut_access", ownerPin)}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 cursor-pointer"
            >
              <PowerOff className="w-4 h-4" />
              <span>🛑 Cortar Acceso / Expulsar Invitado Ahora</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => executeMobileAction("enable_access", ownerPin)}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>🟢 Rehabilitar Acceso con el Código Actual</span>
            </button>
          )}
        </div>

        {/* TARJETA 3: CLAVE MANUAL Y DURACIÓN DE LA SESIÓN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Duración del Permiso del Invitado
            </label>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs">
              {[
                { label: "15 min", val: 15 },
                { label: "30 min", val: 30 },
                { label: "1 hora", val: 60 },
                { label: "4 horas", val: 240 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    executeMobileAction("set_duration", ownerPin, {
                      durationMinutes: opt.val,
                    })
                  }
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    status.tokenDurationMinutes === opt.val
                      ? "bg-amber-500/25 border-amber-400 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSaveCustomCode}
            className="pt-3 border-t border-slate-800 space-y-2.5"
          >
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
              ✏️ O Escribir una Clave Personalizada Manual:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customGuestCode}
                onChange={(e) => setCustomGuestCode(e.target.value)}
                placeholder="Ej: Seniat2026*"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !customGuestCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs cursor-pointer"
              >
                Activar
              </button>
            </div>
          </form>
        </div>

        {/* TARJETA 4: CAMBIAR MI PROPIO PIN MAESTRO DESDE EL CELULAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPinChange(!showPinChange)}
            className="w-full p-4 flex items-center justify-between text-xs font-mono font-bold text-slate-200 hover:bg-slate-800/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>🔐 Cambiar mi PIN Maestro de Propietario</span>
            </span>
            {showPinChange ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showPinChange && (
            <form
              onSubmit={handleSaveNewOwnerPin}
              className="p-4 pt-0 border-t border-slate-800/80 space-y-3"
            >
              <p className="text-[11px] text-slate-400 pt-2">
                Define el PIN con el que entras desde tu teléfono a esta pantalla (`/llave-movil`).
              </p>
              <input
                type="password"
                value={newOwnerPin}
                onChange={(e) => setNewOwnerPin(e.target.value)}
                placeholder="Nuevo PIN Maestro (mín. 4 caracteres)"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold"
              />
              <input
                type="password"
                value={confirmOwnerPin}
                onChange={(e) => setConfirmOwnerPin(e.target.value)}
                placeholder="Confirmar Nuevo PIN Maestro"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-extrabold text-xs uppercase cursor-pointer"
              >
                Guardar Nuevo PIN en el Servidor
              </button>
            </form>
          )}
        </div>

        {/* TARJETA 5: BITÁCORA RECIENTE DE ACCESOS */}
        {status.accessLogs && status.accessLogs.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              Últimos Eventos de Seguridad
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {status.accessLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[10.5px] font-mono flex items-start justify-between gap-2"
                >
                  <span
                    className={
                      log.success ? "text-slate-300" : "text-rose-400 font-bold"
                    }
                  >
                    {log.event}
                  </span>
                  <span className="text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

