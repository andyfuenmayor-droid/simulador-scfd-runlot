"use client";

import React, { useState, useMemo } from "react";
import { RecordedPOSTicket } from "@/types/simulator";
import {
  ConnectedSystemNode,
  ForensicTransactionRecord,
} from "@/types/transactionalHub";
import {
  getInitialConnectedNodes,
  computeVaultsFromTickets,
  createForensicRecordFromTicket,
  simulateClandestineForensicRecord,
  simulatePreDrawCloseRecord,
} from "@/lib/transactionalSwitchEngine";
import { formatBs } from "@/lib/cryptoUtils";
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Building2,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCheck2,
  HardDrive,
  Key,
  Landmark,
  Layers,
  Lock,
  Network,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Store,
  Terminal,
  UserCheck,
  Zap,
} from "lucide-react";

interface Module5TransactionalHubProps {
  recordedTickets: RecordedPOSTicket[];
  onEmitValidTicket: () => void;
  onEmitWithholdingPrize: () => void;
}

export const Module5TransactionalHub: React.FC<
  Module5TransactionalHubProps
> = ({ recordedTickets, onEmitValidTicket, onEmitWithholdingPrize }) => {
  const [nodes, setNodes] = useState<ConnectedSystemNode[]>(() =>
    getInitialConnectedNodes()
  );
  const [activeTabSubView, setActiveTabSubView] = useState<
    "switch" | "nodes" | "vaults" | "forensic" | "json_api"
  >("switch");

  // Historial de transacciones forenses en memoria
  const [forensicHistory, setForensicHistory] = useState<
    ForensicTransactionRecord[]
  >(() => {
    if (recordedTickets.length > 0) {
      return recordedTickets.map((t) => createForensicRecordFromTicket(t));
    }
    // Si no hay tickets aún, generamos un ticket demo homologado
    return [
      createForensicRecordFromTicket({
        ticketNumber: "00012345",
        drawNumber: "4501",
        timestamp: "06/11/2026 12:30:00",
        modalityId: "animalitos",
        modalityName: "Animalitos (30x)",
        multiplier: 30,
        plays: [
          { id: "p1", option: "04 Tigre", amount: 100, combinationsCount: 1 },
          { id: "p2", option: "12 Caballo", amount: 100, combinationsCount: 1 },
        ],
        isFullTiraje: false,
        tirajeOptionCount: 38,
        unitBetAmount: 100,
        totalFacial: 200,
        guaranteedOrMaxGrossPrize: 3000,
        guaranteedOrMaxIgf16: 480,
        guaranteedOrMaxNetPrize: 2520,
        sha256Hash:
          "5BA4E235D134123E1076DFD669D08B7B8749DF963FE101267448B0ADF3C025F4",
        status: "EMITIDO_EN_CAJA",
      }),
    ];
  });

  const [selectedTxId, setSelectedTxId] = useState<string>(
    forensicHistory[0]?.txId || ""
  );
  const [simulatedAlertActive, setSimulatedAlertActive] =
    useState<boolean>(false);
  const [copiedTxId, setCopiedTxId] = useState<boolean>(false);

  // Última transacción activa
  const activeTx = useMemo(() => {
    return (
      forensicHistory.find((tx) => tx.txId === selectedTxId) ||
      forensicHistory[0] ||
      null
    );
  }, [forensicHistory, selectedTxId]);

  // Cajas acumuladas de los entes del Estado calculadas en vivo
  const stateVaults = useMemo(() => {
    return computeVaultsFromTickets(recordedTickets);
  }, [recordedTickets]);

  // Manejador para emitir jugada certificada en vivo
  const handleTriggerCertPlay = () => {
    setSimulatedAlertActive(false);
    onEmitValidTicket();

    // Actualizamos contador de los nodos
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        processedCount: n.processedCount + 1,
        lastHeartbeat: new Date().toLocaleTimeString("es-VE", { hour12: false }),
      }))
    );

    // Si hay tickets recientes, creamos el registro
    const latestTicket = recordedTickets[0];
    if (latestTicket) {
      const newForensic = createForensicRecordFromTicket(latestTicket);
      setForensicHistory((prev) => [newForensic, ...prev.slice(0, 49)]);
      setSelectedTxId(newForensic.txId);
    }
  };

  // Manejador para simular liquidación de premio con retención 16% IGF
  const handleTriggerPrizeWithholding = () => {
    setSimulatedAlertActive(false);
    onEmitWithholdingPrize();

    const now = new Date();
    const prizeTxId = `TX-PRIZE-WIN-${now.getTime()}`;
    const prizeRecord: ForensicTransactionRecord = {
      txId: prizeTxId,
      ticketNumber: "00012345",
      drawNumber: "4501",
      timestamp: now.toLocaleString("es-VE"),
      timestampMs: now.getTime(),
      type: "PAGO_PREMIO_IGF",
      status: "LIQUIDADA_CON_RETENCION",
      modalityName: "Triples Tradicionales (Premio Acertado)",
      totalFacial: 1000,
      premiosNetos84: 504000,
      retencionIgf16: 96000,
      ggr: 0,
      taquillaComision: 200,
      comercializadoraSpread: 50,
      operadoraNetWin: 0,
      sistemaItCanon1Pct: 10,
      seniatShare: 96000,
      conalotShare: 5,
      iobpasShare: 0,
      alcaldiaShare: 6.25,
      sha256Payload:
        "7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069",
      signerName: "Operadora Concesionaria • Agente Único de Retención",
      runlotAgencia: "RUN-AG-0412",
      runlotOperadora: "RUN-OP-987654",
      runlotSoftware: "RUN-SYS-019 (CDAPUESTAS v4.2)",
      httpStatusCode: 200,
      rawPayload: {
        tipo_operacion: "PAGO_PREMIO_GANADOR",
        premio_facial_bruto: 600000,
        tasa_retencion_igf: "16.00%",
        monto_retenido_seniat: 96000,
        neto_entregado_apostador: 504000,
        formulario_tributario: "PLANILLA_SENIAT_99029_XML",
        agente_retencion_rif: "J-98765432-1",
      },
    };

    setForensicHistory((prev) => [prizeRecord, ...prev.slice(0, 49)]);
    setSelectedTxId(prizeTxId);
  };

  // Manejador para simular jugada clandestina interceptada
  const handleTriggerClandestine = () => {
    setSimulatedAlertActive(true);
    const alertRecord = simulateClandestineForensicRecord();
    setForensicHistory((prev) => [alertRecord, ...prev.slice(0, 49)]);
    setSelectedTxId(alertRecord.txId);
  };

  // Manejador para simular cierre pre-sorteo de CONALOT
  const handleTriggerPreDrawClose = () => {
    setSimulatedAlertActive(false);
    const lockRecord = simulatePreDrawCloseRecord();
    setForensicHistory((prev) => [lockRecord, ...prev.slice(0, 49)]);
    setSelectedTxId(lockRecord.txId);
  };

  const handleCopyHash = () => {
    if (activeTx?.sha256Payload) {
      navigator.clipboard.writeText(activeTx.sha256Payload);
      setCopiedTxId(true);
      setTimeout(() => setCopiedTxId(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. HEADER PRINCIPAL DEL CONMUTADOR TRANSACCIONAL
      ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Switch Transaccional Nacional
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Zero-Trust Interconnected Mesh
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Módulo 5: Sistema Transaccional Interconectado SCFD-RUNLOT & Entes del Estado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conmutación, validación criptográfica y liquidación simultánea entre plataformas privadas y los 4 entes públicos
              </p>
            </div>
          </div>

          {/* Métricas rápidas de telemetría de red */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                Nodos: <strong className="text-slate-900 dark:text-white font-bold">{nodes.length}/9 Activos</strong>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              Latencia Media: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">24 ms</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              Cripto: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">TLS 1.3 + SHA-256</strong>
            </div>
          </div>
        </div>

        {/* ====================================================================
            2. BOTONES DE ACCIÓN DEL SIMULADOR DE EVENTOS TRANSACCIONALES
        ==================================================================== */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Disparadores de Transacciones en Vivo:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTriggerCertPlay}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Emitir Jugada Certificada (RUNLOT OK)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerPrizeWithholding}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Pagar Premio (Retención 16% IGF)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerClandestine}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Simular Clandestino (Sin RUNLOT)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerPreDrawClose}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Cierre Pre-Sorteo (CONALOT)</span>
            </button>
          </div>
        </div>

        {/* Alerta Roja Clandestina (Condicional) */}
        {simulatedAlertActive && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <strong className="block text-sm font-bold">
                  ALERTA ROJA FISCAL [HTTP 403 FORBIDDEN] • INTERCEPTACIÓN EN SWITCH RUNLOT
                </strong>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  Jugada emitida desde terminal sin certificado RUNLOT válido. Protocolo SCFD activó bloqueo telemático y notificó a la División de Fiscalización SENIAT y Dirección de Control CONALOT.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-[11px] font-bold shrink-0">
              Violación Art. 30.2
            </span>
          </div>
        )}

        {/* Pestañas de Navegación Interna del Módulo 5 */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {[
            { id: "switch", label: "1. Conmutador Interconectado (Switch Diagram)", icon: Network },
            { id: "vaults", label: "2. Bóvedas de Liquidación Estatal", icon: Landmark },
            { id: "nodes", label: "3. Monitor de Nodos RUNLOT", icon: Server },
            { id: "forensic", label: "4. Trazabilidad Forense & Auditoría", icon: Eye },
            { id: "json_api", label: "5. Consola Técnica JSON SCFD", icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTabSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTabSubView(
                    tab.id as "switch" | "nodes" | "vaults" | "forensic" | "json_api"
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                    : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          VISTA 1: DIAGRAMA INTERACTIVO DEL CONMUTADOR MULTILATERAL (SWITCH)
      ==================================================================== */}
      {activeTabSubView === "switch" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-500" />
                  Arquitectura de Conmutación Transaccional en Vivo (3 Polos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualiza cómo viaja cada transacción desde el punto de venta a través del núcleo RUNLOT hacia los 4 entes del Estado
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                Transmisión Continua TLS 1.3
              </span>
            </div>

            {/* Malla de los 3 Polos */}
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
              {/* POLO 1: RED PRIVADA & SISTEMAS (Col 1-3) */}
              <div className="lg:col-span-3 space-y-3">
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Polo 1: Red Privada</span>
                  <Terminal className="w-3.5 h-3.5" />
                </div>

                {/* Taquilla POS */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-500" /> Taquilla POS #0412
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      ONLINE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Centro de Apuestas La Favorita
                  </div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex justify-between">
                    <span>RUNLOT: RUN-AG-0412</span>
                    <span>18 ms</span>
                  </div>
                </div>

                {/* Sistema Informático */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-500" /> Plataforma Software IT
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                      1% CANON
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    SYS-CDAPUESTAS v4.2
                  </div>
                  <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 flex justify-between">
                    <span>RUNLOT: RUN-SYS-019</span>
                    <span>14 ms</span>
                  </div>
                </div>

                {/* Operadora de Lotería */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Operadora Máster
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      AGENTE 16%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lotería Oficial Concesionaria C.A.
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex justify-between">
                    <span>RUNLOT: RUN-OP-987654</span>
                    <span>31 ms</span>
                  </div>
                </div>
              </div>

              {/* FLECHA 1 (Col 4) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0 text-indigo-500">
                <div className="hidden lg:flex flex-col items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 rotate-90 my-2">mTLS 1.3</span>
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>
                <div className="lg:hidden flex items-center gap-2 my-1">
                  <span className="text-[10px] font-mono">↓ mTLS 1.3</span>
                </div>
              </div>

              {/* POLO 2: CONMUTADOR CENTRAL RUNLOT / SCFD (Col 5-7) */}
              <div className="lg:col-span-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-400 dark:border-indigo-600/50 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-500" /> Polo 2: Switch Central
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Núcleo Transaccional SCFD
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Resolución CONALOT 002-2026 • Motor de Compensación & Sellado Criptográfico
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Validación RUNLOT:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">7 Categorías OK</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Firma HMAC-SHA256:</span>
                    <strong className="text-indigo-700 dark:text-indigo-300 font-mono font-bold">Inviolable</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cuenta Terceros:</span>
                    <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">Arts. 32-33 OK</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cierre Pre-Sorteo:</span>
                    <strong className="text-blue-700 dark:text-blue-400 font-mono font-bold">T-60s Sincronizado</strong>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/80 text-[10px] font-mono text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-center font-bold">
                  Sello Fiscal QR generado en 6 ms
                </div>
              </div>

              {/* FLECHA 2 (Col 8) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0 text-emerald-500">
                <div className="hidden lg:flex flex-col items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 rotate-90 my-2">Enrutamiento</span>
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>
                <div className="lg:hidden flex items-center gap-2 my-1">
                  <span className="text-[10px] font-mono">↓ Liquidación Inmediata</span>
                </div>
              </div>

              {/* POLO 3: ENTES DEL ESTADO (Col 9-11) */}
              <div className="lg:col-span-3 space-y-2.5">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Polo 3: Entes del Estado</span>
                  <Landmark className="w-3.5 h-3.5" />
                </div>

                {/* SENIAT */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5" /> SENIAT (Tesoro)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                      Bs. {formatBs(stateVaults.seniatIgf16 + stateVaults.seniatJuegos10, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Planilla 99029 (16% IGF) + 10% s/ GGR</div>
                </div>

                {/* CONALOT */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> CONALOT (Regulador)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400">
                      Bs. {formatBs(stateVaults.conalotSupervision, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Tasas telemáticas y homologación RUNLOT</div>
                </div>

                {/* IOBPAS */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> IOBPAS (Beneficencia)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Bs. {formatBs(stateVaults.iobpasCanonGgr, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Propuesta: 5% s/ GGR Todos (Hoy: 5% Trip / 1% Anim Facial)</div>
                </div>

                {/* Alcaldías */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Alcaldías (IAE)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                      Bs. {formatBs(stateVaults.alcaldiasIae, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">2,50% armonizado LOCAPTEM s/ comisiones</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VISTA 2: BÓVEDAS DE LIQUIDACIÓN ESTATAL (CLEARINGHOUSE VAULTS)
      ==================================================================== */}
      {activeTabSubView === "vaults" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-500" />
                  Bóvedas de Liquidación en Tiempo Real hacia las Cajas del Estado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fondos públicos enterados instantáneamente a partir de los tickets emitidos en el simulador
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total Liquidado al Estado:</span>
                <span className="font-mono text-base font-extrabold text-amber-700 dark:text-amber-400">
                  Bs. {formatBs(stateVaults.totalStateSettled, 2)}
                </span>
              </div>
            </div>

            {/* 4 Bóvedas Oficiales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bóveda SENIAT */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4" /> SENIAT (Tesoro)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                    XML 99029
                  </span>
                </div>
                <div className="font-mono text-lg font-black text-amber-700 dark:text-amber-400">
                  Bs. {formatBs(stateVaults.seniatIgf16 + stateVaults.seniatJuegos10, 2)}
                </div>
                <div className="space-y-1 text-[11px] font-mono border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>16% IGF (Premios):</span>
                    <strong className="text-amber-600 dark:text-amber-300">Bs. {formatBs(stateVaults.seniatIgf16, 2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>10% s/ GGR (Juegos):</span>
                    <strong className="text-amber-600 dark:text-amber-300">Bs. {formatBs(stateVaults.seniatJuegos10, 2)}</strong>
                  </div>
                </div>
              </div>

              {/* Bóveda CONALOT */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> CONALOT (Supervisión)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                    SCFD CORE
                  </span>
                </div>
                <div className="font-mono text-lg font-black text-purple-700 dark:text-purple-400">
                  Bs. {formatBs(stateVaults.conalotSupervision, 2)}
                </div>
                <div className="space-y-1 text-[11px] font-mono border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Cánones Telemáticos:</span>
                    <strong className="text-purple-600 dark:text-purple-300">Activos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Corte Antifraude:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Inalterable</strong>
                  </div>
                </div>
              </div>

              {/* Bóveda IOBPAS */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> IOBPAS (Beneficencia)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    HOSPITALES
                  </span>
                </div>
                <div className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">
                  Bs. {formatBs(stateVaults.iobpasCanonGgr, 2)}
                </div>
                <div className="space-y-1 text-[11px] font-mono border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Propuesta (Todos s/ GGR):</span>
                    <strong className="text-emerald-600 dark:text-emerald-300">5,00%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hoy (s/ Valor Facial):</span>
                    <strong className="text-rose-500 dark:text-rose-400">5% Trip / 1% Anim</strong>
                  </div>
                </div>
              </div>

              {/* Bóveda Alcaldías */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Alcaldías Municipales
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                    LOCAPTEM
                  </span>
                </div>
                <div className="font-mono text-lg font-black text-blue-700 dark:text-blue-400">
                  Bs. {formatBs(stateVaults.alcaldiasIae, 2)}
                </div>
                <div className="space-y-1 text-[11px] font-mono border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Alícuota Armonizada:</span>
                    <strong className="text-blue-600 dark:text-blue-300">2,50%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Imponible:</span>
                    <strong className="text-blue-600 dark:text-blue-300">Comisiones</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VISTA 3: MONITOR DE NODOS Y CONEXIONES RUNLOT (HEALTH CHECK)
      ==================================================================== */}
      {activeTabSubView === "nodes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-500" />
                  Monitor de Nodos y Sujetos Obligados en el Ecosistema RUNLOT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Auditoría en tiempo real de certificados digitales, latencia, versión de binarios y estado de conexión
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNodes(getInitialConnectedNodes())}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refrescar Nodos</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Nodo / Sujeto Obligado</th>
                    <th className="p-3">Código RUNLOT</th>
                    <th className="p-3 text-center">Estatus</th>
                    <th className="p-3 text-right">Latencia</th>
                    <th className="p-3">Protocolo</th>
                    <th className="p-3">Certificado / Hash Binario</th>
                    <th className="p-3 text-right">Tx Procesadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {node.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {node.entityDescription}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {node.runlotCode}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {node.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {node.latencyMs} ms
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {node.protocol}
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-xs">
                          {node.digitalCert}
                        </div>
                        {node.binarySha256 && (
                          <div className="text-[9px] font-mono text-purple-600 dark:text-purple-400 truncate max-w-xs">
                            SHA: {node.binarySha256.slice(0, 20)}...
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {node.processedCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VISTA 4: TRAZABILIDAD FORENSE & AUDITORÍA DE TRANSACCIÓN
      ==================================================================== */}
      {activeTabSubView === "forensic" && activeTx && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  Inspector Forense Criptográfico de la Transacción
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desglose matemático integral y cadena de custodia digital de la transacción seleccionada
                </p>
              </div>

              {/* Selector de Transacción */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Ver Tx:</span>
                <select
                  value={selectedTxId}
                  onChange={(e) => setSelectedTxId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {forensicHistory.map((tx) => (
                    <option key={tx.txId} value={tx.txId}>
                      [{tx.status}] {tx.txId.slice(0, 18)}... (Bs. {formatBs(tx.totalFacial, 0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cabecera del Bloque Forense */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">ID Transacción:</span>
                  <strong className="text-indigo-700 dark:text-indigo-400 font-bold">
                    {activeTx.txId}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Timestamp:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{activeTx.timestamp}</strong>
                </div>
                <div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeTx.status === "CERTIFICADA"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                        : activeTx.status === "LIQUIDADA_CON_RETENCION"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300"
                        : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300"
                    }`}
                  >
                    {activeTx.status} [HTTP {activeTx.httpStatusCode}]
                  </span>
                </div>
              </div>

              {/* Hash y Firma Digital */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-500" /> Sello Digital SHA-256 (Inviolable):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTxId ? "¡Copiado!" : "Copiar Hash"}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 break-all select-all font-bold">
                  {activeTx.sha256Payload}
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Firmante: {activeTx.signerName}</span>
                  <span>Software: {activeTx.runlotSoftware}</span>
                </div>
              </div>
            </div>

            {/* Reparto Matemático Céntimo a Céntimo de esta Transacción */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                Desglose de Liquidación Instantánea del Valor Facial (Bs. {formatBs(activeTx.totalFacial, 2)}):
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Apostador (84%)</div>
                  <div className="font-bold text-slate-900 dark:text-white">Bs. {formatBs(activeTx.premiosNetos84, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">SENIAT (16% IGF)</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">Bs. {formatBs(activeTx.retencionIgf16, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/40">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400">Taquilla (Neto)</div>
                  <div className="font-bold text-blue-700 dark:text-blue-400">Bs. {formatBs(activeTx.taquillaComision, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">Comercializ.</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">Bs. {formatBs(activeTx.comercializadoraSpread, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/40">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400">Sistema IT (1%)</div>
                  <div className="font-bold text-purple-700 dark:text-purple-400">Bs. {formatBs(activeTx.sistemaItCanon1Pct, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Operadora (Net)</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">Bs. {formatBs(activeTx.operadoraNetWin, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">IOBPAS (Canon)</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">Bs. {formatBs(activeTx.iobpasShare, 2)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/40">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400">Alcaldía (IAE)</div>
                  <div className="font-bold text-blue-700 dark:text-blue-400">Bs. {formatBs(activeTx.alcaldiaShare, 2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VISTA 5: CONSOLA TÉCNICA JSON SCFD (PARA PROGRAMADORES Y AUDITORES)
      ==================================================================== */}
      {activeTabSubView === "json_api" && activeTx && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-500" />
                  Payload JSON Puro del API REST SCFD
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estructura estándar de la trama transmitida al API Gateway del Estado venezolano
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                Endpoint: <code className="text-indigo-600 dark:text-indigo-400">POST /v1/scfd/tickets/emit</code>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <pre className="leading-relaxed">
                {JSON.stringify(activeTx.rawPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

