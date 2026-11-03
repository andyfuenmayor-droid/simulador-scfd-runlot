"use client";

import React, { useState } from "react";
import { SCFDTransactionLog } from "@/types/simulator";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  Lock,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";

interface Module3TelemetryConsoleProps {
  currentPayload: Record<string, unknown>;
  logs: SCFDTransactionLog[];
  onSimulateValidTransaction: () => void;
  onSimulateClandestinePlay: () => void;
}

export const Module3TelemetryConsole: React.FC<
  Module3TelemetryConsoleProps
> = ({
  currentPayload,
  logs,
  onSimulateValidTransaction,
  onSimulateClandestinePlay,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [clandestineAlertActive, setClandestineAlertActive] =
    useState<boolean>(false);

  const activeLog = logs.find((l) => l.id === selectedLogId) || null;
  const displayedPayload = activeLog ? activeLog.payload : currentPayload;
  const displayedStatus = activeLog ? activeLog.httpStatus : 201;

  const handleTriggerClandestine = () => {
    setClandestineAlertActive(true);
    onSimulateClandestinePlay();
    setSelectedLogId(null);
  };

  const handleTriggerValid = () => {
    setClandestineAlertActive(false);
    onSimulateValidTransaction();
    setSelectedLogId(null);
  };

  return (
    <div className="space-y-8">
      {/* ====================================================================
          ENCABEZADO Y BOTONES DE SIMULACIÓN TELEMÁTICA
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Radio className="w-4 h-4 animate-pulse" />
              Módulo 3 • Fiscalización Digital en Tiempo Real (SCFD / RUNLOT)
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Consola Telemática API Gateway SENIAT / CONALOT
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerValid}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Transmitir Jugada Homologada (RUNLOT OK)
            </button>
            <button
              type="button"
              onClick={handleTriggerClandestine}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/60 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Simular Jugada No Homologada (Sin RUNLOT)
            </button>
          </div>
        </div>

        {/* ====================================================================
            SIMULADOR VISUAL DEL FLUJO EN TIEMPO REAL (3 NODOS)
            [POS Taquilla] -> [Sistema Homologado RUNLOT] -> [API Gateway SCFD SENIAT/CONALOT]
        ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          {/* NODO 1: POS Taquilla */}
          <div className="lg:col-span-3 p-4 rounded-xl bg-slate-950 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-blue-400 uppercase">
                NODO 1 • ORIGEN
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                TLS 1.3 mTLS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  [POS Taquilla]
                </h3>
                <p className="text-xs text-slate-400">
                  Centro de Apuestas La Favorita
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Agencia: RUN-AG-0412
                </p>
              </div>
            </div>
          </div>

          {/* Flecha 1 */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-1">
            <div className="text-[10px] font-mono text-slate-400 mb-1">
              JSON + HMAC
            </div>
            <ArrowRight className="w-6 h-6 text-blue-400 hidden lg:block" />
          </div>

          {/* NODO 2: Sistema Homologado RUNLOT */}
          <div
            className={`lg:col-span-3 p-4 rounded-xl border transition-all ${
              clandestineAlertActive
                ? "bg-red-950/30 border-red-600"
                : "bg-slate-950 border-emerald-700/60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                NODO 2 • VALIDADOR CONALOT
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  clandestineAlertActive
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {clandestineAlertActive ? "SIN CREDENCIAL" : "RUN-0089 ACTIVO"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  clandestineAlertActive
                    ? "bg-red-600/20 border-red-500/40 text-red-400"
                    : "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                }`}
              >
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Plataforma CDAPUESTAS
                </h3>
                <p className="text-xs text-slate-300">
                  Sistema: CDAPUESTAS | RUNLOT: SYS-RUN-009
                </p>
                <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  POS & Kioscos Autoservicio ("Anúnciate") • Homologado
                </p>
              </div>
            </div>
          </div>

          {/* Flecha 2 */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-1">
            <div className="text-[10px] font-mono text-slate-400 mb-1">
              {clandestineAlertActive ? "HTTP 403" : "HTTP 201"}
            </div>
            <ArrowRight
              className={`w-6 h-6 hidden lg:block ${
                clandestineAlertActive ? "text-red-500" : "text-emerald-400"
              }`}
            />
          </div>

          {/* NODO 3: API Gateway SCFD SENIAT/CONALOT */}
          <div
            className={`lg:col-span-3 p-4 rounded-xl border transition-all ${
              clandestineAlertActive
                ? "bg-red-950/40 border-red-500 shadow-lg shadow-red-950/50"
                : "bg-slate-950 border-blue-600/60 shadow-lg shadow-blue-950/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-blue-300 uppercase">
                NODO 3 • ESTADO VENEZOLANO
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                <Lock className="w-3 h-3 text-emerald-400" /> SHA-256
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  [API Gateway SCFD SENIAT/CONALOT]
                </h3>
                <p className="text-xs text-slate-400">
                  Auditoría Tributaria y Control de Premios
                </p>
                <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  Latencia Promedio: 18 ms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            ALERTA EN VIVO SI SE DISPARA JUGADA CLANDESTINA (HTTP 403 FORBIDDEN)
        ==================================================================== */}
        {clandestineAlertActive && (
          <div className="p-5 rounded-2xl bg-red-950/60 border-2 border-red-500 text-red-100 shadow-2xl animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-mono font-extrabold text-sm md:text-base text-red-300 tracking-wide">
                    HTTP 403 FORBIDDEN - CLANDESTINE_OPERATION_DETECTED
                  </div>
                  <p className="text-xs text-red-100/90 mt-1 leading-relaxed">
                    El API Gateway SCFD rechazó instantáneamente una transacción sin certificado criptográfico{" "}
                    <strong>RUNLOT</strong> válido. El ticket carece de Hash de Validación SCFD (inválido ante el público) y se ha generado una alerta georreferenciada automática para la División de Fiscalización del{" "}
                    <strong>SENIAT y CONALOT</strong>, erradicando las bancas ilegales en tiempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClandestineAlertActive(false)}
                className="px-3.5 py-2 rounded-xl bg-red-900/80 hover:bg-red-800 border border-red-400/50 text-xs font-bold text-white shrink-0 self-start md:self-center"
              >
                Restaurar Flujo Homologado
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          VISOR DE PAYLOAD JSON EN VIVO Y BITÁCORA DE TRANSACCIONES SCFD
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (7 cols): Visor de Payload JSON en Vivo */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Visor de Payload JSON en Vivo (API SCFD v1/transactions)
              </span>
            </div>
            <span
              className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded border ${
                displayedStatus === 403
                  ? "bg-red-950/90 border-red-600 text-red-300"
                  : "bg-emerald-950/90 border-emerald-600 text-emerald-300"
              }`}
            >
              {displayedStatus === 403
                ? "HTTP 403 FORBIDDEN"
                : "HTTP 201 CREATED"}
            </span>
          </div>

          {/* Campos Clave Destacados del Payload */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">tax_regime</span>
              <span className="text-emerald-400 font-bold truncate block">
                {String(displayedPayload.tax_regime || "THIRD_PARTY_CUSTODY_ART_32_33")}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">facial_amount</span>
              <span className="text-white font-bold">
                Bs. {String(displayedPayload.facial_amount ?? "0.00")}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">potential_prize</span>
              <span className="text-blue-400 font-bold">
                Bs. {String(displayedPayload.potential_prize ?? "0.00")}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">igf_withholding_16</span>
              <span className="text-amber-400 font-bold">
                Bs. {String(displayedPayload.igf_withholding_16 ?? "0.00")}
              </span>
            </div>
          </div>

          <div className="p-5 bg-slate-950 flex-1 overflow-x-auto">
            <pre className="text-xs font-mono leading-relaxed text-emerald-300">
              {JSON.stringify(displayedPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Columna Derecha (5 cols): Stream de Eventos de Auditoría en Tiempo Real */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Bitácora de Auditoría Telemática ({logs.length} Eventos)
              </span>
            </div>
            {selectedLogId && (
              <button
                type="button"
                onClick={() => setSelectedLogId(null)}
                className="text-[11px] text-blue-400 hover:underline font-medium"
              >
                Ver Ticket Activo POS
              </button>
            )}
          </div>

          <div className="p-4 space-y-2.5 max-h-[520px] overflow-y-auto flex-1">
            {logs.map((log) => {
              const isSelected = log.id === selectedLogId;
              const isRejected = log.httpStatus === 403;
              const isPrize = log.type === "PRIZE_WITHHOLDING";

              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-500"
                      : isRejected
                      ? "bg-red-950/25 border-red-800/80 hover:border-red-600"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10.5px] font-mono font-extrabold px-2 py-0.5 rounded ${
                        isRejected
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : isPrize
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      HTTP {log.httpStatus} • {log.statusText}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                    {isRejected ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">
                      UUID: {String(log.payload.transaction_uuid || "")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/80">
                    <span>
                      RUNLOT:{" "}
                      <strong
                        className={
                          isRejected ? "text-red-400" : "text-emerald-400"
                        }
                      >
                        {String(log.payload.runlot_code || "MISSING_INVALID")}
                      </strong>
                    </span>
                    <span>
                      Facial: Bs. {String(log.payload.facial_amount ?? "0.00")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

