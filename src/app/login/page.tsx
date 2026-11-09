"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Fingerprint,
  Server,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "session_expired") {
      setErrorMsg(
        "El tiempo de su sesión temporal ha finalizado. Ingrese un código vigente para continuar."
      );
    } else if (err === "revoked") {
      setErrorMsg(
        "El acceso a la presentación ha sido cerrado o rotado por el propietario del proyecto."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMsg("Por favor ingrese el Código de Acceso Autorizado.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          username: "cdapuestas",
          terminalId: "SYS-RUN-009",
          runlotCode: "RUN-0089",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error || "Código de acceso inválido o no autorizado."
        );
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMsg("Error de conexión con el nodo de seguridad SCFD.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Efecto visual de fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[280px] bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Barra superior institucional */}
      <header className="relative z-10 max-w-5xl w-full mx-auto pt-2 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold">
                CDAPUESTAS • SCFD / RUNLOT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                Acceso Protegido JWT
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              Propuesta Técnica y Reforma Tributaria (SENIAT / CONALOT)
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nodo Homologado: SYS-RUN-009</span>
        </div>
      </header>

      {/* Tarjeta Central de Login Único */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-emerald-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Acceso a Presentación Ejecutiva
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingrese el <strong className="text-slate-200">Código Temporal de Acceso</strong> suministrado por el propietario del proyecto para visualizar el Simulador Tributario SCFD / RUNLOT.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-2">
                Código / Clave de Acceso Autorizado
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCode ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ej: SCFD-XXXX o clave asignada"
                  autoFocus
                  autoComplete="off"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-bold tracking-wider placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  title={showCode ? "Ocultar código" : "Mostrar código"}
                >
                  {showCode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 transition-all cursor-pointer font-mono"
            >
              <span>
                {loading
                  ? "Verificando Token Criptográfico..."
                  : "Ingresar al Simulador SCFD"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                Huella Anti-Copia:
              </span>
              <span className="text-slate-300 font-bold">SHA-256 + JWT HS256</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Marco Normativo:</span>
              <span className="text-amber-400 font-bold">
                Prov. SNAT/2026/00093
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de página de propiedad intelectual */}
      <footer className="relative z-10 text-center text-[11px] font-mono text-slate-500 pb-2">
        Propiedad Intelectual Protegida • Prohibida su reproducción o inspección sin autorización expresa.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
          Cargando módulo de seguridad SCFD...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

