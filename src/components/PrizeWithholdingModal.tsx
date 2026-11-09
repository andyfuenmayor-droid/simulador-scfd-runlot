"use client";

import React, { useState, useEffect } from "react";
import { BetPlay, GameModalityConfig, GAME_MODALITIES } from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  generateDeterministicSha256,
  generateSeniatWithholdingXML,
} from "@/lib/cryptoUtils";
import {
  Award,
  CheckCircle2,
  Copy,
  FileCode2,
  LogOut,
  Printer,
  QrCode,
  Send,
  ShieldCheck,
  UserCheck,
  X,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";

export interface PrizeWithholdingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Parámetros Modalidad 1: Triples y Terminales
  triplesModality?: GameModalityConfig;
  triplesPlays?: BetPlay[];
  triplesTicketNumber?: string;
  triplesDrawNumber?: string;
  // Parámetros Modalidad 2: Sorteos de Figuras "Animalitos"
  animalitosModality?: GameModalityConfig;
  animalitosPlays?: BetPlay[];
  animalitosTicketNumber?: string;
  animalitosDrawNumber?: string;
  // Propiedades comunes / retrocompatibilidad
  initialTab?: "triples" | "animalitos" | "both";
  dateTimeStr?: string;
  onEmitWithholdingToSCFD?: (data: {
    winnerId: string;
    winningPlay: BetPlay;
    grossPrize: number;
    igfWithheld: number;
    netPaid: number;
    certificateHash: string;
  }) => void;
  // Retrocompatibilidad con interfaz simple anterior
  modality?: GameModalityConfig;
  plays?: BetPlay[];
  ticketNumber?: string;
  drawNumber?: string;
}

export const PrizeWithholdingModal: React.FC<PrizeWithholdingModalProps> = ({
  isOpen,
  onClose,
  triplesModality = GAME_MODALITIES.triples,
  triplesPlays = [],
  triplesTicketNumber = "00012345",
  triplesDrawNumber = "4501",
  animalitosModality = GAME_MODALITIES.animalitos,
  animalitosPlays = [],
  animalitosTicketNumber = "00012346",
  animalitosDrawNumber = "4502",
  initialTab = "both",
  dateTimeStr = "02/11/2026 16:30:00",
  onEmitWithholdingToSCFD,
  // Fallbacks retrocompatibles
  modality,
  plays,
  ticketNumber,
  drawNumber,
}) => {
  // Configuración de modalidades efectivas
  const effectiveTriplesModality = modality?.id === "triples" ? modality : triplesModality;
  const effectiveAnimalitosModality = modality?.id === "animalitos" ? modality : animalitosModality;

  // Jugadas efectivas (filtrando resúmenes de tiraje para selección unitaria)
  const effectiveTriplesPlays = (
    plays && modality?.id === "triples" ? plays : triplesPlays
  ).filter((p) => !p.isFullTirajeSummary);

  const effectiveAnimalitosPlays = (
    plays && modality?.id === "animalitos" ? plays : animalitosPlays
  ).filter((p) => !p.isFullTirajeSummary);

  // Estados de pestaña activa ("triples" | "animalitos" | "both")
  const [activeTab, setActiveTab] = useState<"triples" | "animalitos" | "both">(initialTab);

  // Estados para Liquidación #1: Triples
  const [triplesSelectedPlayId, setTriplesSelectedPlayId] = useState<string>(
    effectiveTriplesPlays[0]?.id || "default-triples"
  );
  const [triplesWinnerDocId, setTriplesWinnerDocId] = useState<string>("V-18.456.789");
  const [triplesTransmitted, setTriplesTransmitted] = useState<boolean>(false);

  // Estados para Liquidación #2: Animalitos
  const [animalitosSelectedPlayId, setAnimalitosSelectedPlayId] = useState<string>(
    effectiveAnimalitosPlays[0]?.id || "default-animalitos"
  );
  const [animalitosWinnerDocId, setAnimalitosWinnerDocId] = useState<string>("V-24.589.123");
  const [animalitosTransmitted, setAnimalitosTransmitted] = useState<boolean>(false);

  // Estado del Modal XML Oficial SENIAT
  const [showXmlModal, setShowXmlModal] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  // Modo de impresión térmica (para el contenedor aislado #thermal-print-container)
  const [printMode, setPrintMode] = useState<"triples" | "animalitos" | "both">("both");

  // Actualizar IDs seleccionados cuando se carguen las jugadas
  useEffect(() => {
    if (effectiveTriplesPlays.length > 0 && !effectiveTriplesPlays.some((p) => p.id === triplesSelectedPlayId)) {
      setTriplesSelectedPlayId(effectiveTriplesPlays[0].id);
    }
  }, [effectiveTriplesPlays, triplesSelectedPlayId]);

  useEffect(() => {
    if (effectiveAnimalitosPlays.length > 0 && !effectiveAnimalitosPlays.some((p) => p.id === animalitosSelectedPlayId)) {
      setAnimalitosSelectedPlayId(effectiveAnimalitosPlays[0].id);
    }
  }, [effectiveAnimalitosPlays, animalitosSelectedPlayId]);

  // Tecla Escape para salir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ============================================================================
  // CÁLCULOS MATEMÁTICOS Y FISCALES: LIQUIDACIÓN #1 (TRIPLES)
  // ============================================================================
  const winningPlayTriples: BetPlay =
    effectiveTriplesPlays.find((p) => p.id === triplesSelectedPlayId) ||
    effectiveTriplesPlays[0] || { id: "default-triples", option: "000 Zulia", amount: 1000 };

  const triplesBetAmount = Number(winningPlayTriples.amount) || 1000;
  const triplesGrossPrize = triplesBetAmount * effectiveTriplesModality.multiplier; // Bs. 600.000
  const triplesIgf16 = triplesGrossPrize * 0.16; // Bs. 96.000
  const triplesNetPaid = triplesGrossPrize - triplesIgf16; // Bs. 504.000

  const triplesTicketNum = ticketNumber && modality?.id === "triples" ? ticketNumber : triplesTicketNumber;
  const triplesDrawNum = drawNumber && modality?.id === "triples" ? drawNumber : triplesDrawNumber;

  const triplesHash = generateDeterministicSha256(
    `ART18::${triplesTicketNum}::${triplesDrawNum}::triples::${winningPlayTriples.option}::${triplesBetAmount}::${triplesWinnerDocId}`
  );

  // ============================================================================
  // CÁLCULOS MATEMÁTICOS Y FISCALES: LIQUIDACIÓN #2 (ANIMALITOS)
  // ============================================================================
  const winningPlayAnimalitos: BetPlay =
    effectiveAnimalitosPlays.find((p) => p.id === animalitosSelectedPlayId) ||
    effectiveAnimalitosPlays[0] || { id: "default-anim", option: "01 Carnero", amount: 1000 };

  const animalitosBetAmount = Number(winningPlayAnimalitos.amount) || 1000;
  const animalitosGrossPrize = animalitosBetAmount * effectiveAnimalitosModality.multiplier; // Bs. 30.000
  const animalitosIgf16 = animalitosGrossPrize * 0.16; // Bs. 4.800
  const animalitosNetPaid = animalitosGrossPrize - animalitosIgf16; // Bs. 25.200

  const animalitosTicketNum = ticketNumber && modality?.id === "animalitos" ? ticketNumber : animalitosTicketNumber;
  const animalitosDrawNum = drawNumber && modality?.id === "animalitos" ? drawNumber : animalitosDrawNumber;

  const animalitosHash = generateDeterministicSha256(
    `ART18::${animalitosTicketNum}::${animalitosDrawNum}::animalitos::${winningPlayAnimalitos.option}::${animalitosBetAmount}::${animalitosWinnerDocId}`
  );

  // ============================================================================
  // TOTAL CONSOLIDADO EN CAJA (AMBAS LIQUIDACIONES)
  // ============================================================================
  const totalGrossPrizes = triplesGrossPrize + animalitosGrossPrize; // Bs. 630.000
  const totalIgfWithheld = triplesIgf16 + animalitosIgf16; // Bs. 100.800
  const totalNetCashPaid = triplesNetPaid + animalitosNetPaid; // Bs. 529.200

  // ============================================================================
  // GENERACIÓN OFICIAL DE XML SENIAT (DECRETO 1.808 - CONCEPTO 077 - PLANILLA 99029)
  // ============================================================================
  const xmlItems =
    activeTab === "triples"
      ? [
          {
            rifRetenido: triplesWinnerDocId.trim() || "V-18456789",
            numeroTicket: `TKT-${triplesTicketNum}`,
            numeroControl: `CTL-${triplesDrawNum}-RUN009-TRIPLES`,
            fechaOperacion: dateTimeStr.split(" ")[0] || "02/11/2026",
            montoOperacion: triplesGrossPrize,
            porcentajeRetencion: 16.0,
            montoRetenido: triplesIgf16,
          },
        ]
      : activeTab === "animalitos"
      ? [
          {
            rifRetenido: animalitosWinnerDocId.trim() || "V-24589123",
            numeroTicket: `TKT-${animalitosTicketNum}`,
            numeroControl: `CTL-${animalitosDrawNum}-RUN009-ANIMALITOS`,
            fechaOperacion: dateTimeStr.split(" ")[0] || "02/11/2026",
            montoOperacion: animalitosGrossPrize,
            porcentajeRetencion: 16.0,
            montoRetenido: animalitosIgf16,
          },
        ]
      : [
          {
            rifRetenido: triplesWinnerDocId.trim() || "V-18456789",
            numeroTicket: `TKT-${triplesTicketNum}`,
            numeroControl: `CTL-${triplesDrawNum}-RUN009-TRIPLES`,
            fechaOperacion: dateTimeStr.split(" ")[0] || "02/11/2026",
            montoOperacion: triplesGrossPrize,
            porcentajeRetencion: 16.0,
            montoRetenido: triplesIgf16,
          },
          {
            rifRetenido: animalitosWinnerDocId.trim() || "V-24589123",
            numeroTicket: `TKT-${animalitosTicketNum}`,
            numeroControl: `CTL-${animalitosDrawNum}-RUN009-ANIMALITOS`,
            fechaOperacion: dateTimeStr.split(" ")[0] || "02/11/2026",
            montoOperacion: animalitosGrossPrize,
            porcentajeRetencion: 16.0,
            montoRetenido: animalitosIgf16,
          },
        ];

  const generatedXml = generateSeniatWithholdingXML({
    rifAgente: "J-98765432-1",
    periodo: "202611",
    items: xmlItems,
  });

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  // ============================================================================
  // TRANSMISIÓN TELEMÁTICA A SCFD
  // ============================================================================
  const handleTransmitTriples = () => {
    if (onEmitWithholdingToSCFD) {
      onEmitWithholdingToSCFD({
        winnerId: triplesWinnerDocId.trim() || "V-18.456.789",
        winningPlay: winningPlayTriples,
        grossPrize: triplesGrossPrize,
        igfWithheld: triplesIgf16,
        netPaid: triplesNetPaid,
        certificateHash: triplesHash,
      });
    }
    setTriplesTransmitted(true);
  };

  const handleTransmitAnimalitos = () => {
    if (onEmitWithholdingToSCFD) {
      onEmitWithholdingToSCFD({
        winnerId: animalitosWinnerDocId.trim() || "V-24.589.123",
        winningPlay: winningPlayAnimalitos,
        grossPrize: animalitosGrossPrize,
        igfWithheld: animalitosIgf16,
        netPaid: animalitosNetPaid,
        certificateHash: animalitosHash,
      });
    }
    setAnimalitosTransmitted(true);
  };

  const handleTransmitBoth = () => {
    handleTransmitTriples();
    handleTransmitAnimalitos();
  };

  // ============================================================================
  // IMPRESIÓN AISLADA EN 80MM
  // ============================================================================
  const triggerPrint = (mode: "triples" | "animalitos" | "both") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  // ============================================================================
  // COMPONENTE VISUAL: TICKET TÉRMICO MODELO 3 (15 LÍNEAS EXACTAS • BLANCO PURO)
  // ============================================================================
  const renderThermalReceipt = (params: {
    modalityName: string;
    factor: number;
    ticketNum: string;
    drawNum: string;
    winnerDoc: string;
    optionText: string;
    betAmt: number;
    gross: number;
    igf: number;
    net: number;
    hash: string;
    headerBadge: string;
    isTransmitted?: boolean;
  }) => {
    return (
      <div className="w-full max-w-[430px] select-text">
        <div className="thermal-edge-top" />
        <div
          className="thermal-ticket !bg-white !text-slate-950 font-mono px-4 py-4 text-[11px] leading-[1.42] border-x border-slate-300"
          style={{ backgroundColor: "#ffffff", color: "#020617" }}
        >
          {/* LÍNEA 1 */}
          <div className="text-center font-extrabold text-[11.5px] !text-slate-950">
            01| SENIAT / CONALOT - RETENCIÓN PREMIO (ART. 18)
          </div>
          {/* LÍNEA 2 */}
          <div className="text-center font-bold text-[10.5px] !text-slate-900">
            02| AGENTE RETENCIÓN: Lotería Oficial C.A. J-98765432-1
          </div>
          {/* LÍNEA 3 */}
          <div
            className="text-center font-extrabold text-[10px] my-0.5 py-0.5 rounded"
            style={{ backgroundColor: "#ecfdf5", color: "#065f46" }}
          >
            03| CDAPUESTAS SYS-RUN-009 | RUNLOT: RUN-0089 | COMP: #R-{params.ticketNum.slice(-4)}
          </div>
          {/* LÍNEA 4 */}
          <div className="text-[10.5px] !text-slate-950">
            04| <span className="font-bold">TAQUILLA PAGADORA:</span> Centro de Apuestas La Favorita
          </div>
          {/* LÍNEA 5 */}
          <div className="text-[10.5px] !text-slate-950">
            05| <span className="font-bold">RIF TAQUILLA:</span> J-12345678-9 | <span className="font-bold">FECHA:</span> {dateTimeStr}
          </div>
          {/* LÍNEA 6 */}
          <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
            06| ----------------------------------------------
          </div>
          {/* LÍNEA 7 */}
          <div className="text-[11px] !text-slate-950 font-bold">
            07| CÉDULA / RIF GANADOR: {params.winnerDoc || "V-18.456.789"}
          </div>
          {/* LÍNEA 8 */}
          <div className="text-[10.5px] !text-slate-950">
            08| <span className="font-bold">TICKET ORIGEN:</span> #{params.ticketNum} | <span className="font-bold">SORTEO:</span> #{params.drawNum}
          </div>
          {/* LÍNEA 9 */}
          <div className="text-[10.5px] !text-slate-950">
            09| <span className="font-bold">MODALIDAD:</span> {params.modalityName} ({params.factor}x)
          </div>
          {/* LÍNEA 10 */}
          <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
            10| ----------------------------------------------
          </div>
          {/* LÍNEA 11: Encabezado Tabla 1 Línea */}
          <div
            className="grid items-center font-extrabold text-[9.5px] !text-slate-950 whitespace-nowrap"
            style={{ gridTemplateColumns: "25% 15% 21% 18% 21%" }}
          >
            <div className="pr-1">11| OPCIÓN</div>
            <div className="text-right px-1">APUEST</div>
            <div className="text-right px-1">PREMIO BRUTO</div>
            <div className="text-right px-1">IGF 16%</div>
            <div className="text-right pl-1">NETO PAGO</div>
          </div>
          {/* LÍNEA 12: Cálculo Exacto 1 Línea */}
          <div
            className="grid items-center font-bold text-[10px] py-1 my-0.5 rounded px-1 whitespace-nowrap"
            style={{
              gridTemplateColumns: "25% 15% 21% 18% 21%",
              backgroundColor: "#f8fafc",
            }}
          >
            <div className="truncate !text-slate-950 pr-1">
              12| {params.optionText}
            </div>
            <div className="text-right !text-slate-900 px-1">
              {formatIntBs(params.betAmt)}
            </div>
            <div className="text-right !text-slate-950 font-extrabold px-1">
              {formatIntBs(params.gross)}
            </div>
            <div
              className="text-right font-extrabold px-1"
              style={{ color: "#dc2626" }}
            >
              -{formatIntBs(params.igf)}
            </div>
            <div
              className="text-right font-extrabold pl-1"
              style={{ color: "#15803d" }}
            >
              {formatIntBs(params.net)}
            </div>
          </div>
          {/* LÍNEA 13 */}
          <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
            13| ----------------------------------------------
          </div>
          {/* LÍNEA 14 */}
          <div className="text-[10px] font-bold !text-slate-900">
            14| BASE LEGAL: Art. 18 Prov. SNAT/2026/00093 (16% IGF)
          </div>
          {/* LÍNEA 15 */}
          <div className="flex items-center justify-between pt-1 mt-0.5 border-t !border-slate-300 text-[10px] font-extrabold !text-slate-950">
            <span className="flex items-center gap-1 truncate">
              <QrCode
                className="w-3.5 h-3.5 shrink-0 inline"
                style={{ color: "#059669" }}
              />
              15| CERT. API SCFD • HASH: {params.hash.slice(0, 14).toUpperCase()}
            </span>
            <span style={{ color: params.isTransmitted ? "#059669" : "#d97706" }}>
              {params.isTransmitted ? "[SCFD: OK-200]" : "[LISTO ART. 18]"}
            </span>
          </div>
        </div>
        <div className="thermal-edge-bottom" />
      </div>
    );
  };

  return (
    <>
      {/* ====================================================================
          CONTENEDOR EXCLUSIVO DE IMPRESIÓN (AISLADO EN CSS @MEDIA PRINT)
      ==================================================================== */}
      <div id="thermal-print-container" className="hidden">
        {(printMode === "triples" || printMode === "both") && (
          <div className={printMode === "both" ? "print-page-break" : ""}>
            {renderThermalReceipt({
              modalityName: "Triples y Terminales",
              factor: effectiveTriplesModality.multiplier,
              ticketNum: triplesTicketNum,
              drawNum: triplesDrawNum,
              winnerDoc: triplesWinnerDocId,
              optionText: winningPlayTriples.option,
              betAmt: triplesBetAmount,
              gross: triplesGrossPrize,
              igf: triplesIgf16,
              net: triplesNetPaid,
              hash: triplesHash,
              headerBadge: "LIQUIDACIÓN #1",
              isTransmitted: triplesTransmitted,
            })}
          </div>
        )}

        {(printMode === "animalitos" || printMode === "both") && (
          <div>
            {renderThermalReceipt({
              modalityName: 'Sorteos de Figuras "Animalitos"',
              factor: effectiveAnimalitosModality.multiplier,
              ticketNum: animalitosTicketNum,
              drawNum: animalitosDrawNum,
              winnerDoc: animalitosWinnerDocId,
              optionText: winningPlayAnimalitos.option,
              betAmt: animalitosBetAmount,
              gross: animalitosGrossPrize,
              igf: animalitosIgf16,
              net: animalitosNetPaid,
              hash: animalitosHash,
              headerBadge: "LIQUIDACIÓN #2",
              isTransmitted: animalitosTransmitted,
            })}
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL PRINCIPAL EN PANTALLA
      ==================================================================== */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
          {/* Header del Modal */}
          <div className="sticky top-0 z-20 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-slate-100 flex items-center gap-2">
                    Motor de Liquidación y Retención de Premios (Art. 18 — Modelo 3)
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-300 font-black shadow-sm">
                      2 Liquidaciones en Taquilla
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Comprobante Simplificado de Retención de Premio (80 mm, 15 líneas) • Enteramiento Instantáneo SCFD
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-600 dark:bg-red-600/20 border border-red-300 dark:border-red-500/40 text-red-800 hover:text-white dark:text-red-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono cursor-pointer"
                  title="Salir / Cerrar (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>SALIR</span>
                </button>
              </div>
            </div>

            {/* BARRA SUPERIOR DE RESUMEN CONSOLIDADO DE TAQUILLA (2 PREMIOS) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400">
                    Premios Acertados (2 Sorteos)
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-slate-950 dark:text-white mt-0.5">
                    Bs. {formatBs(totalGrossPrizes, 2)}
                  </div>
                </div>
                <div className="text-[10.5px] font-mono text-slate-700 dark:text-slate-300 font-bold text-right">
                  Triples: 600k<br />Anim: 30k
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-red-950/40 border border-rose-300 dark:border-red-700/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-red-300">
                    Retención Total 16% IGF (Art. 18)
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                    -Bs. {formatBs(totalIgfWithheld, 2)}
                  </div>
                </div>
                <div className="text-[10.5px] font-mono text-rose-900 dark:text-rose-300 font-black text-right">
                  -96.000 (Triples)<br />-4.800 (Anim.)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300">
                    Efectivo Total Desembolsado (84%)
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Bs. {formatBs(totalNetCashPaid, 2)}
                  </div>
                </div>
                <div className="text-[10.5px] font-mono text-emerald-900 dark:text-emerald-300 font-black text-right">
                  504.000 (Triples)<br />25.200 (Anim.)
                </div>
              </div>
            </div>

            {/* PESTAÑAS SELECTORAS DE LIQUIDACIÓN */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/70">
              <button
                type="button"
                onClick={() => setActiveTab("both")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 border ${
                  activeTab === "both"
                    ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950/50"
                    : "bg-slate-100 dark:bg-slate-950/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ambas Liquidaciones (2 Comprobantes • Bs. 100.800 Retención)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("triples")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
                  activeTab === "triples"
                    ? "bg-amber-100 dark:bg-amber-600/30 text-amber-900 dark:text-amber-200 border-amber-500 font-extrabold shadow-sm"
                    : "bg-slate-100 dark:bg-slate-950/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800"
                }`}
              >
                <span>Liq #1: Triples (Bs. 600.000 | Ret. -Bs. 96.000)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("animalitos")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
                  activeTab === "animalitos"
                    ? "bg-emerald-100 dark:bg-emerald-600/30 text-emerald-900 dark:text-emerald-200 border-emerald-500 font-extrabold shadow-sm"
                    : "bg-slate-100 dark:bg-slate-950/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800"
                }`}
              >
                <span>Liq #2: Animalitos (Bs. 30.000 | Ret. -Bs. 4.800)</span>
              </button>
            </div>
          </div>

          {/* Cuerpo en 2 columnas con scroll */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Columna Izquierda: Parámetros y Acciones */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* 1. SECCIÓN TRIPLES */}
                {(activeTab === "triples" || activeTab === "both") && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border-2 border-amber-300 dark:border-amber-700/60 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-400 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Liquidación #1: Triples y Terminales (600x)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                        Ticket #{triplesTicketNum}
                      </span>
                    </div>

                    {/* Selector de jugada ganadora Triples */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-300 mb-1">
                        Opción Ganadora Triples (Sorteo #{triplesDrawNum}):
                      </label>
                      <select
                        value={triplesSelectedPlayId}
                        onChange={(e) => setTriplesSelectedPlayId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                      >
                        {effectiveTriplesPlays.slice(0, 50).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.option} — Apuesta Bs. {formatIntBs(p.amount)} (Bruto: Bs. {formatIntBs(Number(p.amount) * 600)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cédula Ganador Triples */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-300 mb-1">
                        Cédula / RIF Ganador Triples:
                      </label>
                      <div className="relative">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={triplesWinnerDocId}
                          onChange={(e) => setTriplesWinnerDocId(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 font-mono text-xs font-bold"
                          placeholder="V-18.456.789"
                        />
                      </div>
                    </div>

                    {/* Desglose Triples */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400">Bruto (600x)</div>
                        <div className="font-extrabold text-slate-950 dark:text-slate-100 text-xs">Bs. {formatIntBs(triplesGrossPrize)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-red-950/40 border border-rose-300 dark:border-red-800/40 shadow-sm">
                        <div className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-red-300">IGF 16%</div>
                        <div className="font-extrabold text-rose-700 dark:text-rose-300 text-xs">-Bs. {formatIntBs(triplesIgf16)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 shadow-sm">
                        <div className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300">Neto (84%)</div>
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs">Bs. {formatIntBs(triplesNetPaid)}</div>
                      </div>
                    </div>

                    {/* Botón Liquidar Triples por Separado */}
                    <button
                      type="button"
                      onClick={handleTransmitTriples}
                      className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-mono cursor-pointer ${
                        triplesTransmitted
                          ? "bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-300 shadow-sm"
                          : "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/50"
                      }`}
                    >
                      {triplesTransmitted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>✓ Triples Liquidado (Retenido: Bs. {formatIntBs(triplesIgf16)})</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Liquidar Triples por Separado (Retener: -Bs. {formatIntBs(triplesIgf16)})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 2. SECCIÓN ANIMALITOS */}
                {(activeTab === "animalitos" || activeTab === "both") && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border-2 border-emerald-300 dark:border-emerald-700/60 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-400 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Liquidación #2: Animalitos (30x)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                        Ticket #{animalitosTicketNum}
                      </span>
                    </div>

                    {/* Selector de figura ganadora Animalitos */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-300 mb-1">
                        Figura Ganadora (Sorteo #{animalitosDrawNum}):
                      </label>
                      <select
                        value={animalitosSelectedPlayId}
                        onChange={(e) => setAnimalitosSelectedPlayId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                      >
                        {effectiveAnimalitosPlays.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.option} — Apuesta Bs. {formatIntBs(p.amount)} (Bruto: Bs. {formatIntBs(Number(p.amount) * 30)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cédula Ganador Animalitos */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-300 mb-1">
                        Cédula / RIF Ganador Animalitos:
                      </label>
                      <div className="relative">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={animalitosWinnerDocId}
                          onChange={(e) => setAnimalitosWinnerDocId(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 font-mono text-xs font-bold"
                          placeholder="V-24.589.123"
                        />
                      </div>
                    </div>

                    {/* Desglose Animalitos */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400">Bruto (30x)</div>
                        <div className="font-extrabold text-slate-950 dark:text-slate-100 text-xs">Bs. {formatIntBs(animalitosGrossPrize)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-red-950/40 border border-rose-300 dark:border-red-800/40 shadow-sm">
                        <div className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-red-300">IGF 16%</div>
                        <div className="font-extrabold text-rose-700 dark:text-rose-300 text-xs">-Bs. {formatIntBs(animalitosIgf16)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 shadow-sm">
                        <div className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300">Neto (84%)</div>
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs">Bs. {formatIntBs(animalitosNetPaid)}</div>
                      </div>
                    </div>

                    {/* Botón Liquidar Animalitos por Separado */}
                    <button
                      type="button"
                      onClick={handleTransmitAnimalitos}
                      className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-mono cursor-pointer ${
                        animalitosTransmitted
                          ? "bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-300 shadow-sm"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                      }`}
                    >
                      {animalitosTransmitted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>✓ Animalitos Liquidado (Retenido: Bs. {formatIntBs(animalitosIgf16)})</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Liquidar Animalitos por Separado (Retener: -Bs. {formatIntBs(animalitosIgf16)})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* BOTONES DE TRANSMISIÓN Y XML */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTransmitBoth}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-all cursor-pointer font-mono"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {triplesTransmitted && animalitosTransmitted
                        ? "Ambas Liquidaciones Transmitidas a SCFD (Re-enviar)"
                        : "Liquidar Ambas Liquidaciones Simultáneamente (Bs. 100.800 Total)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowXmlModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all font-mono"
                  >
                    <FileCode2 className="w-4 h-4 text-blue-400" />
                    Generar XML SENIAT Multi-Ticket (Decreto 1.808 - Concepto 077)
                  </button>

                  {(triplesTransmitted || animalitosTransmitted) && (
                    <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-300 text-xs flex items-center gap-2 font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                      <span>
                        {triplesTransmitted && animalitosTransmitted
                          ? `Ambas retenciones (Bs. ${formatIntBs(totalIgfWithheld)}) registradas en Consola Telemática SCFD.`
                          : triplesTransmitted
                          ? `Retención Triples (Bs. ${formatIntBs(triplesIgf16)}) registrada en Consola Telemática SCFD.`
                          : `Retención Animalitos (Bs. ${formatIntBs(animalitosIgf16)}) registrada en Consola Telemática SCFD.`}
                      </span>
                    </div>
                  )}

                  {/* Panel Informativo: Ruta del Dinero Taquilla */}
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 space-y-1 font-sans shadow-sm">
                    <div className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-400">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Conciliación de Caja CDAPUESTAS (Art. 65 LISLR)
                    </div>
                    <div className="space-y-0.5 text-slate-800 dark:text-slate-300 text-xs font-mono">
                      <div>• <strong>Efectivo Total Pagado (84%):</strong> <span className="text-emerald-700 dark:text-emerald-400 font-bold">Bs. {formatBs(totalNetCashPaid, 2)}</span> entregados en taquilla.</div>
                      <div>• <strong>Retención 16% IGF (Art. 18):</strong> <span className="text-rose-700 dark:text-rose-300 font-bold">Bs. {formatBs(totalIgfWithheld, 2)}</span> protegidos para Operadora.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Comprobantes Térmicos Modelo 3 (15 Líneas Exactas • 80mm) */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 sm:p-5">
                <div className="w-full mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {activeTab === "both"
                      ? "2 Comprobantes Modelo 3 (Art. 18 — 80 mm)"
                      : activeTab === "triples"
                      ? "Comprobante #1: Triples (80 mm • 15 Líneas)"
                      : "Comprobante #2: Animalitos (80 mm • 15 Líneas)"}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                    PAPEL BLANCO PURO • ENTERAMIENTO SCFD
                  </span>
                </div>

                {/* Despliegue de los comprobantes térmicos: UNO ARRIBA Y EL OTRO DEBAJO CON SEPARADOR */}
                {activeTab === "both" ? (
                  <div className="w-full flex flex-col items-center">
                    {/* TICKET 1 ARRIBA: TRIPLES */}
                    <div className="w-full max-w-[440px] flex flex-col items-center">
                      <div className="w-full flex items-center justify-between text-[11px] font-extrabold font-mono text-amber-900 dark:text-amber-400 mb-1.5 px-1 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                          1. Liquidación: Triples y Terminales (600x)
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                          Ticket #{triplesTicketNum}
                        </span>
                      </div>
                      {renderThermalReceipt({
                        modalityName: "Triples y Terminales",
                        factor: effectiveTriplesModality.multiplier,
                        ticketNum: triplesTicketNum,
                        drawNum: triplesDrawNum,
                        winnerDoc: triplesWinnerDocId,
                        optionText: winningPlayTriples.option,
                        betAmt: triplesBetAmount,
                        gross: triplesGrossPrize,
                        igf: triplesIgf16,
                        net: triplesNetPaid,
                        hash: triplesHash,
                        headerBadge: "LIQUIDACIÓN #1",
                        isTransmitted: triplesTransmitted,
                      })}
                    </div>

                    {/* SEPARADOR ESTÉTICO ENTRE AMBOS TICKETS */}
                    <div className="w-full max-w-[440px] my-5 flex items-center gap-2 sm:gap-3">
                      <div className="flex-1 border-t-2 border-dashed border-slate-400 dark:border-slate-600/70" />
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-bold flex items-center gap-2 shadow-md shrink-0">
                        <span>✂️</span>
                        <span>SEPARADOR • CORTE DE PAPEL TÉRMICO (80 MM)</span>
                        <span>✂️</span>
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-slate-400 dark:border-slate-600/70" />
                    </div>

                    {/* TICKET 2 DEBAJO: ANIMALITOS */}
                    <div className="w-full max-w-[440px] flex flex-col items-center">
                      <div className="w-full flex items-center justify-between text-[11px] font-extrabold font-mono text-emerald-900 dark:text-emerald-400 mb-1.5 px-1 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          2. Liquidación: Sorteos de Figuras "Animalitos" (30x)
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                          Ticket #{animalitosTicketNum}
                        </span>
                      </div>
                      {renderThermalReceipt({
                        modalityName: 'Sorteos de Figuras "Animalitos"',
                        factor: effectiveAnimalitosModality.multiplier,
                        ticketNum: animalitosTicketNum,
                        drawNum: animalitosDrawNum,
                        winnerDoc: animalitosWinnerDocId,
                        optionText: winningPlayAnimalitos.option,
                        betAmt: animalitosBetAmount,
                        gross: animalitosGrossPrize,
                        igf: animalitosIgf16,
                        net: animalitosNetPaid,
                        hash: animalitosHash,
                        headerBadge: "LIQUIDACIÓN #2",
                        isTransmitted: animalitosTransmitted,
                      })}
                    </div>

                    {/* RESUMEN CONSOLIDADO DEBAJO DE AMBOS TICKETS */}
                    <div className="w-full max-w-[440px] mt-5 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-slate-200 space-y-1 shadow-md">
                      <div className="text-[10px] uppercase font-extrabold text-slate-600 dark:text-slate-400 tracking-wider">
                        Consolidado Oficial de Ambos Comprobantes en Taquilla:
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">Premios Ganadores Brutos:</span>
                        <span className="font-extrabold text-slate-950 dark:text-white">Bs. {formatIntBs(totalGrossPrizes)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Retención Total 16% IGF (Art. 18):</span>
                        <span className="text-rose-700 dark:text-rose-400 font-extrabold">-Bs. {formatIntBs(totalIgfWithheld)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800 font-extrabold">
                        <span className="text-slate-900 dark:text-slate-100">Efectivo Total Entregado al Ganador:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">Bs. {formatIntBs(totalNetCashPaid)}</span>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "triples" ? (
                  renderThermalReceipt({
                    modalityName: "Triples y Terminales",
                    factor: effectiveTriplesModality.multiplier,
                    ticketNum: triplesTicketNum,
                    drawNum: triplesDrawNum,
                    winnerDoc: triplesWinnerDocId,
                    optionText: winningPlayTriples.option,
                    betAmt: triplesBetAmount,
                    gross: triplesGrossPrize,
                    igf: triplesIgf16,
                    net: triplesNetPaid,
                    hash: triplesHash,
                    headerBadge: "LIQUIDACIÓN #1",
                    isTransmitted: triplesTransmitted,
                  })
                ) : (
                  renderThermalReceipt({
                    modalityName: 'Sorteos de Figuras "Animalitos"',
                    factor: effectiveAnimalitosModality.multiplier,
                    ticketNum: animalitosTicketNum,
                    drawNum: animalitosDrawNum,
                    winnerDoc: animalitosWinnerDocId,
                    optionText: winningPlayAnimalitos.option,
                    betAmt: animalitosBetAmount,
                    gross: animalitosGrossPrize,
                    igf: animalitosIgf16,
                    net: animalitosNetPaid,
                    hash: animalitosHash,
                    headerBadge: "LIQUIDACIÓN #2",
                    isTransmitted: animalitosTransmitted,
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer del Modal (Sticky Bottom) con Botones de Impresión Aislada */}
          <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>Retención del 16% consolidada en Taquilla y declarada por Operadora</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => triggerPrint(activeTab === "both" ? "both" : activeTab)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all font-mono border border-slate-300 dark:border-slate-700 cursor-pointer shadow-sm"
                title="Imprime exclusivamente el comprobante térmico en formato 80mm exacto"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>
                  {activeTab === "both"
                    ? "Imprimir Ambos Tickets (80 mm)"
                    : activeTab === "triples"
                    ? "Imprimir Ticket Triples (80 mm)"
                    : "Imprimir Ticket Animalitos (80 mm)"}
                </span>
              </button>

              {activeTab !== "both" && (
                <button
                  type="button"
                  onClick={() => triggerPrint("both")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 font-mono border border-slate-300 dark:border-slate-700 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Imprimir Ambos (2 Recibos)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-red-950/60 font-mono tracking-wide cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>SALIR / CERRAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL PREVIEW XML SENIAT OFICIAL (DECRETO 1.808 - CONCEPTO 077)
      ==================================================================== */}
      {showXmlModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Archivo XML Oficial SENIAT — Decreto 1.808 (Concepto 077)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {xmlItems.length} registros de retención • Planilla SENIAT 99029 • Retención Total: Bs. {formatIntBs(xmlItems.reduce((a, b) => a + b.montoRetenido, 0))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowXmlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950/90 text-emerald-300">
              <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
                {generatedXml}
              </pre>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Formato UTF-8 • Agente: J-98765432-1 • Alícuota: 16% • Registros: {xmlItems.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedXml ? "¡Copiado al Portapapeles!" : "Copiar XML"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
