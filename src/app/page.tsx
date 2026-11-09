"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BetPlay,
  GAME_MODALITIES,
  GameModalityConfig,
  GameModalityId,
  RecordedPOSTicket,
  SCFDTransactionLog,
} from "@/types/simulator";
import {
  ANIMALITOS_38_FIGURES,
  buildFullTirajePlays,
  buildSCFDPayload,
  formatBs,
  generateDeterministicSha256,
  getTotalCombinationsCount,
  isPlaysFullTiraje,
} from "@/lib/cryptoUtils";
import { Module1POS } from "@/components/Module1POS";
import { Module2FinancialCalculator } from "@/components/Module2FinancialCalculator";
import { ModuleMoneyRouteIGF } from "@/components/ModuleMoneyRouteIGF";
import { Module4TributosEntes } from "@/components/Module4TributosEntes";
import { Module3TelemetryConsole } from "@/components/Module3TelemetryConsole";
import { Module5TransactionalHub } from "@/components/Module5TransactionalHub";
import { Module4Roadmap } from "@/components/Module4Roadmap";
import {
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  Moon,
  Network,
  Printer,
  ShieldCheck,
  Sun,
  Terminal,
} from "lucide-react";



type ActiveTabId =
  | "module1"
  | "module2"
  | "module_igf"
  | "module_tributos"
  | "module3"
  | "module4";

export default function SimulatorDashboardPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<ActiveTabId>("module1");
  const [activeModalityId, setActiveModalityId] =
    useState<GameModalityId>("animalitos");

  // Jugadas activas cargadas por defecto: Tiraje Completo en Triples (1.000 comb.) y Animalitos (38 figuras)
  const [playsByModality, setPlaysByModality] = useState<
    Record<GameModalityId, BetPlay[]>
  >(() => ({
    animalitos: buildFullTirajePlays("animalitos", 1000),
    triples: buildFullTirajePlays("triples", 1000),
  }));

  const [ticketSequence, setTicketSequence] = useState<number>(12347);
  const [drawNumber] = useState<string>("4501");
  const [dateTimeStr, setDateTimeStr] = useState<string>("02/11/2026 16:30:00");
  const [timestampMs, setTimestampMs] = useState<number>(1793651400000);

  // Tickets o Tirajes efectivamente emitidos en caja cargados por defecto con tiraje completo
  const [emittedTickets, setEmittedTickets] = useState<RecordedPOSTicket[]>(() => {
    const tripPlays = buildFullTirajePlays("triples", 1000);
    const animPlays = buildFullTirajePlays("animalitos", 1000);
    const timeStr = "02/11/2026 16:30:00";
    const timeMs = 1793651400000;

    const tripPayload = buildSCFDPayload({
      ticketNumber: "00012345",
      drawNumber: "4501",
      modality: "triples",
      modalityName: GAME_MODALITIES.triples.name,
      multiplier: GAME_MODALITIES.triples.multiplier,
      plays: tripPlays,
      timestampMs: timeMs,
    });

    const animPayload = buildSCFDPayload({
      ticketNumber: "00012346",
      drawNumber: "4501",
      modality: "animalitos",
      modalityName: GAME_MODALITIES.animalitos.name,
      multiplier: GAME_MODALITIES.animalitos.multiplier,
      plays: animPlays,
      timestampMs: timeMs + 1500,
    });

    const tripRecord: RecordedPOSTicket = {
      ticketNumber: "00012345",
      drawNumber: "4501",
      timestamp: timeStr,
      modalityId: "triples",
      modalityName: GAME_MODALITIES.triples.shortName,
      multiplier: 600,
      plays: tripPlays,
      isFullTiraje: true,
      tirajeOptionCount: 1000,
      unitBetAmount: 1000,
      totalFacial: 1000000,
      guaranteedOrMaxGrossPrize: 600000,
      guaranteedOrMaxIgf16: 96000,
      guaranteedOrMaxNetPrize: 504000,
      sha256Hash: String(tripPayload.hmac_sha256_signature || ""),
      status: "EMITIDO_EN_CAJA",
    };

    const animRecord: RecordedPOSTicket = {
      ticketNumber: "00012346",
      drawNumber: "4501",
      timestamp: timeStr,
      modalityId: "animalitos",
      modalityName: GAME_MODALITIES.animalitos.shortName,
      multiplier: 30,
      plays: animPlays,
      isFullTiraje: true,
      tirajeOptionCount: 38,
      unitBetAmount: 1000,
      totalFacial: 38000,
      guaranteedOrMaxGrossPrize: 30000,
      guaranteedOrMaxIgf16: 4800,
      guaranteedOrMaxNetPrize: 25200,
      sha256Hash: String(animPayload.hmac_sha256_signature || ""),
      status: "EMITIDO_EN_CAJA",
    };

    return [tripRecord, animRecord];
  });

  useEffect(() => {
    const savedTheme = (localStorage.getItem("scfd_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("scfd_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  const currentModality = GAME_MODALITIES[activeModalityId];
  const currentPlays = playsByModality[activeModalityId];
  const ticketNumberStr = String(ticketSequence).padStart(8, "0");

  // Payload y Hash SHA-256 sincronizados en tiempo real con el estado actual del POS
  const currentSCFDPayload = useMemo(() => {
    return buildSCFDPayload({
      ticketNumber: ticketNumberStr,
      drawNumber,
      modality: activeModalityId,
      modalityName: currentModality.name,
      multiplier: currentModality.multiplier,
      plays: currentPlays,
      timestampMs,
    });
  }, [
    ticketNumberStr,
    drawNumber,
    activeModalityId,
    currentModality.name,
    currentModality.multiplier,
    currentPlays,
    timestampMs,
  ]);

  const sha256Hash = String(currentSCFDPayload.hmac_sha256_signature || "");

  // Registro del Ticket / Tiraje activo en pantalla POS
  const activeTicketRecord: RecordedPOSTicket = useMemo(() => {
    const totalFacial = currentPlays.reduce(
      (acc, p) => acc + (Number(p.amount) || 0),
      0
    );
    const fullTiraje = isPlaysFullTiraje(activeModalityId, currentPlays);
    const tirajeOptionCount = getTotalCombinationsCount(currentPlays);
    const unitBetAmount =
      tirajeOptionCount > 0 ? totalFacial / tirajeOptionCount : 0;

    // En Tiraje Completo, exactamente 1 opción gana (unitBetAmount * multiplier)
    const guaranteedOrMaxGrossPrize = fullTiraje
      ? unitBetAmount * currentModality.multiplier
      : currentPlays.reduce(
          (acc, p) => acc + (Number(p.amount) || 0) * currentModality.multiplier,
          0
        );

    const guaranteedOrMaxIgf16 = Number(
      (guaranteedOrMaxGrossPrize * 0.16).toFixed(2)
    );
    const guaranteedOrMaxNetPrize = Number(
      (guaranteedOrMaxGrossPrize - guaranteedOrMaxIgf16).toFixed(2)
    );

    return {
      ticketNumber: ticketNumberStr,
      drawNumber,
      timestamp: dateTimeStr,
      modalityId: activeModalityId,
      modalityName: currentModality.shortName,
      multiplier: currentModality.multiplier,
      plays: currentPlays,
      isFullTiraje: fullTiraje,
      tirajeOptionCount,
      unitBetAmount,
      totalFacial,
      guaranteedOrMaxGrossPrize,
      guaranteedOrMaxIgf16,
      guaranteedOrMaxNetPrize,
      sha256Hash,
      status: "EN_PANTALLA_POS",
    };
  }, [
    currentPlays,
    currentModality.multiplier,
    currentModality.shortName,
    ticketNumberStr,
    drawNumber,
    dateTimeStr,
    activeModalityId,
    sha256Hash,
  ]);

  // Si hay tickets emitidos en caja, la base contable son ÚNICAMENTE los tickets emitidos en caja.
  // Si aún no se ha emitido ningún ticket en caja pero hay jugadas activas en la pantalla del POS con venta > 0,
  // usamos ese ticket activo como vista previa en tiempo real (sin duplicar jamás con los emitidos).
  // Si no hay jugadas ni tickets emitidos, la lista está vacía (Bs. 0,00).
  const recordedTicketsForCalc: RecordedPOSTicket[] = useMemo(() => {
    if (emittedTickets.length > 0) {
      return emittedTickets;
    }
    if (currentPlays.length > 0 && activeTicketRecord.totalFacial > 0) {
      return [activeTicketRecord];
    }
    return [];
  }, [emittedTickets, currentPlays.length, activeTicketRecord]);

  const totalSalesRecordedInPOS = useMemo(() => {
    return recordedTicketsForCalc.reduce((acc, t) => acc + t.totalFacial, 0);
  }, [recordedTicketsForCalc]);

  // Bitácora de transacciones en vivo para el Módulo 3 cargada con los tirajes iniciales
  const [telemetryLogs, setTelemetryLogs] = useState<SCFDTransactionLog[]>(() => {
    const tripPlays = buildFullTirajePlays("triples", 1000);
    const animPlays = buildFullTirajePlays("animalitos", 1000);
    const timeMs = 1793651400000;

    const tripPayload = buildSCFDPayload({
      ticketNumber: "00012345",
      drawNumber: "4501",
      modality: "triples",
      modalityName: GAME_MODALITIES.triples.name,
      multiplier: GAME_MODALITIES.triples.multiplier,
      plays: tripPlays,
      timestampMs: timeMs,
    });

    const animPayload = buildSCFDPayload({
      ticketNumber: "00012346",
      drawNumber: "4501",
      modality: "animalitos",
      modalityName: GAME_MODALITIES.animalitos.name,
      multiplier: GAME_MODALITIES.animalitos.multiplier,
      plays: animPlays,
      timestampMs: timeMs + 1500,
    });

    return [
      {
        id: "log-init-anim",
        type: "TICKET_EMISSION",
        httpStatus: 201,
        statusText: "FULL_TIRAJE_SCFD_OK",
        timestamp: "16:30:02",
        timestampMs: timeMs + 1500,
        payload: animPayload,
      },
      {
        id: "log-init-trip",
        type: "TICKET_EMISSION",
        httpStatus: 201,
        statusText: "FULL_TIRAJE_SCFD_OK",
        timestamp: "16:30:00",
        timestampMs: timeMs,
        payload: tripPayload,
      },
    ];
  });

  const handleSelectModality = (id: GameModalityId) => {
    setActiveModalityId(id);
  };

  const handleUpdatePlays = (updatedPlays: BetPlay[]) => {
    setPlaysByModality((prev) => ({
      ...prev,
      [activeModalityId]: updatedPlays,
    }));
  };

  const handleUpdatePlaysByModality = (
    modalityId: GameModalityId,
    updatedPlays: BetPlay[]
  ) => {
    setPlaysByModality((prev) => ({
      ...prev,
      [modalityId]: updatedPlays,
    }));
  };

  const getFormattedNow = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return {
      full: `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`,
      timeOnly: `${hh}:${min}:${ss}`,
      ms: now.getTime(),
    };
  };

  const handleEmitNewTicket = () => {
    const nowInfo = getFormattedNow();

    const emittedRecord: RecordedPOSTicket = {
      ...activeTicketRecord,
      timestamp: nowInfo.full,
      status: "EMITIDO_EN_CAJA",
    };
    setEmittedTickets((prev) => [emittedRecord, ...prev]);

    const emittedPayload = buildSCFDPayload({
      ticketNumber: ticketNumberStr,
      drawNumber,
      modality: activeModalityId,
      modalityName: currentModality.name,
      multiplier: currentModality.multiplier,
      plays: currentPlays,
      timestampMs: nowInfo.ms,
    });

    const newLog: SCFDTransactionLog = {
      id: `log-${nowInfo.ms}-${Math.random().toString(36).slice(2, 6)}`,
      type: "TICKET_EMISSION",
      httpStatus: 201,
      statusText: "SCFD_VALIDATED_OK",
      timestamp: nowInfo.timeOnly,
      timestampMs: nowInfo.ms,
      payload: emittedPayload,
    };

    setTelemetryLogs((prev) => [newLog, ...prev]);

    const nextSeq = ticketSequence + 1;
    setTicketSequence(nextSeq);
    setDateTimeStr(nowInfo.full);
    setTimestampMs(nowInfo.ms);
  };

  // Permite activar el Tiraje Completo directamente desde el Módulo 2 o el Módulo 1
  const handleSimulateFullTirajeFromCalc = (
    modalityId: GameModalityId,
    unitBetAmount: number
  ) => {
    const targetMod = GAME_MODALITIES[modalityId];
    const fullPlays = buildFullTirajePlays(modalityId, unitBetAmount);
    const nowInfo = getFormattedNow();

    setActiveModalityId(modalityId);
    setPlaysByModality((prev) => ({
      ...prev,
      [modalityId]: fullPlays,
    }));

    const totalFacial = targetMod.tirajeTotalOptions * unitBetAmount;
    const grossPrize = unitBetAmount * targetMod.multiplier;
    const igf16 = Number((grossPrize * 0.16).toFixed(2));
    const netPrize = Number((grossPrize - igf16).toFixed(2));

    const payload = buildSCFDPayload({
      ticketNumber: ticketNumberStr,
      drawNumber,
      modality: modalityId,
      modalityName: targetMod.name,
      multiplier: targetMod.multiplier,
      plays: fullPlays,
      timestampMs: nowInfo.ms,
    });

    const newTirajeRecord: RecordedPOSTicket = {
      ticketNumber: ticketNumberStr,
      drawNumber,
      timestamp: nowInfo.full,
      modalityId,
      modalityName: targetMod.shortName,
      multiplier: targetMod.multiplier,
      plays: fullPlays,
      isFullTiraje: true,
      tirajeOptionCount: targetMod.tirajeTotalOptions,
      unitBetAmount,
      totalFacial,
      guaranteedOrMaxGrossPrize: grossPrize,
      guaranteedOrMaxIgf16: igf16,
      guaranteedOrMaxNetPrize: netPrize,
      sha256Hash: String(payload.hmac_sha256_signature || ""),
      status: "EMITIDO_EN_CAJA",
    };

    // Reemplazamos la caja con este Tiraje Completo para que el análisis sea 100% puro y exacto
    setEmittedTickets([newTirajeRecord]);

    const newLog: SCFDTransactionLog = {
      id: `log-tiraje-${nowInfo.ms}`,
      type: "TICKET_EMISSION",
      httpStatus: 201,
      statusText: "FULL_TIRAJE_SCFD_OK",
      timestamp: nowInfo.timeOnly,
      timestampMs: nowInfo.ms,
      payload,
    };

    setTelemetryLogs((prev) => [newLog, ...prev]);
    setTicketSequence((prev) => prev + 1);
    setDateTimeStr(nowInfo.full);
    setTimestampMs(nowInfo.ms);
  };

  const handleRemoveEmittedTicket = (ticketNumToRemove: string) => {
    setEmittedTickets((prev) => {
      const filtered = prev.filter((t) => t.ticketNumber !== ticketNumToRemove);
      if (filtered.length === 0) {
        setPlaysByModality({
          animalitos: [],
          triples: [],
        });
      }
      return filtered;
    });
  };

  const handleClearEmittedTickets = () => {
    setEmittedTickets([]);
    setTelemetryLogs([]);
    setPlaysByModality({
      animalitos: [],
      triples: [],
    });
  };

  const handleEmitWithholdingToSCFD = (data: {
    winnerId: string;
    winningPlay: BetPlay;
    grossPrize: number;
    igfWithheld: number;
    netPaid: number;
    certificateHash: string;
  }) => {
    const nowInfo = getFormattedNow();
    const payload = {
      transaction_uuid: `scfd-art18-${ticketNumberStr}-${data.certificateHash.slice(0, 10)}`,
      timestamp_ms: nowInfo.ms,
      event_type: "PRIZE_SETTLEMENT_AND_IGF_WITHHOLDING_ART_18",
      runlot_system_id: "SYS-RUNLOT-CORE-V4.2",
      runlot_operator_id: "RUN-OP-0089 (Lotería Oficial C.A. J-98765432-1)",
      runlot_agency_id: "RUN-AG-0412 (Centro de Apuestas La Favorita J-12345678-9)",
      runlot_code: "RUN-0089",
      tax_regime: "ART_18_PRIZE_WITHHOLDING_16_PCT",
      winner_identification: data.winnerId,
      origin_ticket_number: ticketNumberStr,
      draw_number: `#${drawNumber}`,
      modality: currentModality.name,
      winning_option: data.winningPlay.option,
      facial_amount: data.winningPlay.amount,
      potential_prize: data.grossPrize,
      igf_withholding_16: Number(data.igfWithheld.toFixed(2)),
      net_prize_paid: Number(data.netPaid.toFixed(2)),
      hmac_sha256_signature: data.certificateHash,
    };

    const newLog: SCFDTransactionLog = {
      id: `log-art18-${nowInfo.ms}`,
      type: "PRIZE_WITHHOLDING",
      httpStatus: 200,
      statusText: "ART_18_IGF_WITHHELD",
      timestamp: nowInfo.timeOnly,
      timestampMs: nowInfo.ms,
      payload,
    };

    setTelemetryLogs((prev) => [newLog, ...prev]);
  };

  const handleTriggerPrizeFromHub = () => {
    handleEmitWithholdingToSCFD({
      winnerId: "V-18.945.120",
      winningPlay: { id: "p-win", option: "748 Zulia", amount: 1000 },
      grossPrize: 600000,
      igfWithheld: 96000,
      netPaid: 504000,
      certificateHash: "7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069",
    });
  };

  const handleSimulateClandestinePlay = () => {
    const nowInfo = getFormattedNow();
    const errHash = generateDeterministicSha256(`CLANDESTINE::${nowInfo.ms}`);
    const clandestinePayload = {
      error_code: "HTTP_403_FORBIDDEN_CLANDESTINE_OPERATION_DETECTED",
      transaction_uuid: `blocked-${errHash.slice(0, 12)}`,
      timestamp_ms: nowInfo.ms,
      runlot_system_id: null,
      runlot_operator_id: "UNREGISTERED_ILLEGAL_BANK",
      runlot_agency_id: "UNKNOWN_POS_TERMINAL",
      runlot_code: null,
      tax_regime: "ILLEGAL_EVASION_ATTEMPT",
      facial_amount: 200,
      potential_prize: 6000,
      igf_withholding_16: 0,
      enforcement_action: {
        status: "BLOCKED_BY_SCFD_API_GATEWAY",
        qr_seal_issued: false,
        alert_dispatched_to: [
          "SENIAT - División de Fiscalización Nacional",
          "CONALOT - Dirección de Control de Juegos e Inspección",
        ],
        reason:
          "Ausencia de certificado digital RUNLOT válido y firma HMAC-SHA256.",
      },
      hmac_sha256_signature: "INVALID_OR_MISSING_SIGNATURE",
    };

    const newLog: SCFDTransactionLog = {
      id: `log-403-${nowInfo.ms}`,
      type: "CLANDESTINE_REJECTED",
      httpStatus: 403,
      statusText: "CLANDESTINE_OPERATION_DETECTED",
      timestamp: nowInfo.timeOnly,
      timestampMs: nowInfo.ms,
      payload: clandestinePayload,
    };

    setTelemetryLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ====================================================================
          HEADER EJECUTIVO DE ALTO NIVEL (MESA TÉCNICA SENIAT / CONALOT)
      ==================================================================== */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    Mesa Técnica SENIAT / CONALOT
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Providencia SNAT/2026/00093 • Disposición Final Sexta
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Simulador Ejecutivo de Reforma Tributaria y Fiscalización Digital en Tiempo Real (SCFD / RUNLOT)
                </h1>
              </div>
            </div>

            {/* Indicadores Rápidos de Estado y Selector de Tema */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer font-bold text-xs shadow-sm bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500"
                title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Modo Oscuro</span>
                  </>
                )}
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-slate-300">
                  {emittedTickets.length > 0
                    ? `Ventas Grabadas (${emittedTickets.length}): `
                    : "Ticket/Tiraje POS: "}
                  <strong className="text-emerald-400">
                    Bs. {formatBs(totalSalesRecordedInPOS, 2)}
                  </strong>
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-300">
                Modalidad Activa:{" "}
                <strong className="text-blue-400">
                  {currentModality.shortName} ({currentModality.multiplier}x • Payout {currentModality.standardPayoutPct}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Barra de Navegación de los 6 Módulos Interactivos */}
          <nav className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("module1")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module1"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Printer
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module1" ? "text-blue-400" : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center justify-between">
                  <span>Módulo 1</span>
                  {emittedTickets.length > 0 && (
                    <span className="px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[8px]">
                      {emittedTickets.length}
                    </span>
                  )}
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Terminal POS 80mm
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("module2")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module2"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Calculator
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module2"
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between">
                  <span>Módulo 2</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px]">
                    GGR
                  </span>
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Calculadora 3 Niveles
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("module_igf")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module_igf"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module_igf"
                    ? "text-amber-400"
                    : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
                  <span>Módulo 3</span>
                  <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px]">
                    16% IGF
                  </span>
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Ruta del Dinero 16%
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("module_tributos")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module_tributos"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50 ring-1 ring-blue-400"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Building2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module_tributos"
                    ? "text-cyan-400"
                    : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between">
                  <span>Módulo 4</span>
                  <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8px]">
                    4 Entes
                  </span>
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Tributos & Proyección
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("module3")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module3"
                  ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/50"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Network
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module3" ? "text-indigo-400" : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center justify-between">
                  <span>Módulo 5</span>
                  <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[8px]">
                    Switch
                  </span>
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Switch Transaccional
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("module4")}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "module4"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <CalendarClock
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "module4"
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Módulo 6
                </div>
                <div className="text-xs font-extrabold leading-tight truncate">
                  Hoja de Ruta 180 Días
                </div>
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* ====================================================================
          CONTENIDO PRINCIPAL DEL MÓDULO ACTIVO
      ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "module1" && (
          <Module1POS
            modalities={GAME_MODALITIES}
            activeModalityId={activeModalityId}
            onSelectModality={handleSelectModality}
            plays={currentPlays}
            playsByModality={playsByModality}
            onUpdatePlaysByModality={handleUpdatePlaysByModality}
            timestampMs={timestampMs}
            onUpdatePlays={handleUpdatePlays}
            ticketNumber={ticketNumberStr}
            drawNumber={drawNumber}
            dateTimeStr={dateTimeStr}
            sha256Hash={sha256Hash}
            onEmitNewTicket={handleEmitNewTicket}
            emittedTicketsCount={emittedTickets.length}
            totalEmittedBs={emittedTickets.reduce(
              (acc, t) => acc + t.totalFacial,
              0
            )}
            onEmitWithholdingToSCFD={handleEmitWithholdingToSCFD}
          />
        )}

        {activeTab === "module2" && (
          <Module2FinancialCalculator
            activeModalityId={activeModalityId}
            recordedTickets={recordedTicketsForCalc}
            hasEmittedTickets={emittedTickets.length > 0}
            onRemoveTicket={handleRemoveEmittedTicket}
            onClearEmittedTickets={handleClearEmittedTickets}
            onGoToPOS={() => setActiveTab("module1")}
          />
        )}

        {activeTab === "module_igf" && (
          <ModuleMoneyRouteIGF
            recordedTickets={recordedTicketsForCalc}
            onGoToPOS={() => setActiveTab("module1")}
            onGoToModule2={() => setActiveTab("module2")}
            onEmitWithholdingToSCFD={handleEmitWithholdingToSCFD}
          />
        )}

        {activeTab === "module_tributos" && (
          <Module4TributosEntes
            recordedTickets={recordedTicketsForCalc}
            onGoToPOS={() => setActiveTab("module1")}
            onGoToModule2={() => setActiveTab("module2")}
          />
        )}

        {activeTab === "module3" && (
          <Module5TransactionalHub
            recordedTickets={recordedTicketsForCalc}
            onEmitValidTicket={handleEmitNewTicket}
            onEmitWithholdingPrize={handleTriggerPrizeFromHub}
          />
        )}

        {activeTab === "module4" && <Module4Roadmap />}
      </main>

      {/* ====================================================================
          FOOTER EJECUTIVO INSTITUCIONAL
      ==================================================================== */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Simulador Ejecutivo SCFD / RUNLOT • Modelo GGR (CIAT) + Operaciones por Cuenta de Terceros (Arts. 32 y 33 Providencia SNAT/2026/00093)
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Papel Térmico Físico Homologado: 80 mm (48 col)
          </div>
        </div>
      </footer>
    </div>
  );
}
