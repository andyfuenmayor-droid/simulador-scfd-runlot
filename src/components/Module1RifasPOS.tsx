"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  RaffleModalityId,
  RAFFLE_MODALITIES,
  RecordedRaffleTicket,
} from "@/types/simulator";
import { formatBs, formatIntBs, generateDeterministicSha256 } from "@/lib/cryptoUtils";
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Car,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  HelpCircle,
  Info,
  Layers,
  Percent,
  Printer,
  QrCode,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Trash2,
} from "lucide-react";

interface Module1RifasPOSProps {
  onEmitRaffleTicket?: (ticket: RecordedRaffleTicket) => void;
  onClearRaffleTickets?: () => void;
  emittedRaffleTickets?: RecordedRaffleTicket[];
  onGoToCalculator?: () => void;
  onGoToIGF?: () => void;
}

export const Module1RifasPOS: React.FC<Module1RifasPOSProps> = ({
  onEmitRaffleTicket,
  onClearRaffleTickets,
  emittedRaffleTickets = [],
  onGoToCalculator,
  onGoToIGF,
}) => {
  // Modalidad seleccionada (Opción A o B)
  const [activeRaffleId, setActiveRaffleId] =
    useState<RaffleModalityId>("rifa_triples_1000");

  const config = RAFFLE_MODALITIES[activeRaffleId];

  // Parámetros interactivos editables con conexión al API del BCV
  const [bcvRate, setBcvRate] = useState<number>(901.62);
  const [isFetchingBcv, setIsFetchingBcv] = useState<boolean>(false);
  const [bcvSource, setBcvSource] = useState<string>("API BCV Oficial");
  const [bcvLastUpdated, setBcvLastUpdated] = useState<string>("");

  const fetchBcvRate = async () => {
    try {
      setIsFetchingBcv(true);
      const res = await fetch("/api/bcv");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.rate === "number" && data.rate > 0) {
          setBcvRate(data.rate);
          setBcvSource(data.source || "Banco Central de Venezuela");
          if (data.lastUpdated) {
            try {
              const d = new Date(data.lastUpdated);
              setBcvLastUpdated(d.toLocaleDateString("es-VE"));
            } catch {
              setBcvLastUpdated("");
            }
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener la tasa BCV:", err);
    } finally {
      setIsFetchingBcv(false);
    }
  };

  useEffect(() => {
    fetchBcvRate();
  }, []);

  const [ticketPriceUsd, setTicketPriceUsd] = useState<number>(
    config.defaultTicketPriceUsd
  );
  const [cashPrizeUsd, setCashPrizeUsd] = useState<number>(
    config.defaultCashPrizeUsd
  );
  const [selectedNumber, setSelectedNumber] = useState<string>("748");
  const [seriesName, setSeriesName] = useState<string>("A");

  // Modo de visualización de los boletos térmicos (Unitario vs. Tiraje Completo)
  const [ticketViewMode, setTicketViewMode] = useState<
    "unitario" | "tiraje_completo"
  >("unitario");

  // Simulador de Traba Operativa (Art. 20 y Art. 25 Providencia CONALOT/P/2025-001)
  const [soldPercentage, setSoldPercentage] = useState<number>(85);
  const [simulatedDrawnNumber, setSimulatedDrawnNumber] = useState<string | null>(
    null
  );
  const [isDrawnSold, setIsDrawnSold] = useState<boolean | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Cuando cambia la modalidad, actualizamos el precio sugerido y número por defecto
  const handleSelectModality = (id: RaffleModalityId) => {
    setActiveRaffleId(id);
    const newConfig = RAFFLE_MODALITIES[id];
    setTicketPriceUsd(newConfig.defaultTicketPriceUsd);
    setSelectedNumber(id === "rifa_triples_1000" ? "748" : "4512");
    setSimulatedDrawnNumber(null);
    setIsDrawnSold(null);
  };

  // Cálculos de Emisión y Premiación
  const totalEmissionUsd = config.totalNumbers * ticketPriceUsd;
  const totalEmissionBs = totalEmissionUsd * bcvRate;
  const ticketPriceBs = ticketPriceUsd * bcvRate;

  // Premio Vehículo 0 Km: 70% del tiraje total (70 de 100)
  const vehiclePrizeUsd = totalEmissionUsd * (config.vehiclePrizePercentage / 100);
  const vehiclePrizeBs = vehiclePrizeUsd * bcvRate;

  // Premio Secundario en Metálico
  const cashPrizeBs = cashPrizeUsd * bcvRate;

  // Retenciones 16% IGF
  const cashIgf16Usd = cashPrizeUsd * 0.16;
  const cashIgf16Bs = cashPrizeBs * 0.16;
  const cashNetPaidUsd = cashPrizeUsd - cashIgf16Usd;
  const cashNetPaidBs = cashPrizeBs - cashIgf16Bs;

  const vehicleIgf16Usd = vehiclePrizeUsd * 0.16;
  const vehicleIgf16Bs = vehiclePrizeBs * 0.16;

  // Totales de Premiación (Vehículo 70% + Metálico)
  const totalPrizesUsd = vehiclePrizeUsd + cashPrizeUsd;
  const totalPrizesBs = vehiclePrizeBs + cashPrizeBs;

  // Retención Total 16% IGF (Metálico + Vehículo)
  const totalIgf16Usd = cashIgf16Usd + vehicleIgf16Usd;
  const totalIgf16Bs = cashIgf16Bs + vehicleIgf16Bs;
  const totalNetPrizeUsd = totalPrizesUsd - totalIgf16Usd;
  const totalNetPrizeBs = totalPrizesBs - totalIgf16Bs;

  // Filas para la tabla térmica (igual que en Triples tradicional)
  const is3Digits = activeRaffleId === "rifa_triples_1000";
  const drawShortTag = is3Digits ? "Táchira" : "Súper Gana";

  const samplePlays = useMemo(() => {
    if (ticketViewMode === "unitario") {
      const paddedNum = selectedNumber.padStart(is3Digits ? 3 : 4, "0");
      return [
        {
          id: `single-${paddedNum}`,
          option: `${paddedNum} ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
      ];
    }

    if (is3Digits) {
      return [
        {
          id: "000",
          option: `000 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "001",
          option: `001 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "002",
          option: `002 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "serie-middle",
          option: `SERIE 003 AL 997`,
          amount: ticketPriceBs * 995,
          amountUsd: ticketPriceUsd * 995,
          isSummary: true,
          combCount: 995,
        },
        {
          id: "998",
          option: `998 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "999",
          option: `999 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
      ];
    } else {
      return [
        {
          id: "0000",
          option: `0000 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "0001",
          option: `0001 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "0002",
          option: `0002 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "serie-middle",
          option: `SERIE 0003 AL 9997`,
          amount: ticketPriceBs * 9995,
          amountUsd: ticketPriceUsd * 9995,
          isSummary: true,
          combCount: 9995,
        },
        {
          id: "9998",
          option: `9998 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
        {
          id: "9999",
          option: `9999 ${drawShortTag}`,
          amount: ticketPriceBs,
          amountUsd: ticketPriceUsd,
          isSummary: false,
          combCount: 1,
        },
      ];
    }
  }, [
    ticketViewMode,
    selectedNumber,
    is3Digits,
    drawShortTag,
    ticketPriceBs,
    ticketPriceUsd,
  ]);

  // Boletos vendidos según el control deslizante
  const soldCount = Math.round((config.totalNumbers * soldPercentage) / 100);
  const unsoldCount = config.totalNumbers - soldCount;

  // Hash SHA-256 determinístico del ticket en pantalla
  const ticketSha256 = useMemo(() => {
    return generateDeterministicSha256(
      `RIFA-${activeRaffleId}-${seriesName}-${ticketViewMode === "unitario" ? selectedNumber : "FULL_TIRAJE"}-${ticketPriceBs}-${vehiclePrizeBs}-${cashPrizeBs}`
    );
  }, [
    activeRaffleId,
    seriesName,
    ticketViewMode,
    selectedNumber,
    ticketPriceBs,
    vehiclePrizeBs,
    cashPrizeBs,
  ]);

  // Simulación de Sorteo Oficial de la Lotería del Táchira
  const handleSimulateDraw = () => {
    const max = config.totalNumbers;
    const rand = Math.floor(Math.random() * max);
    const padLen = activeRaffleId === "rifa_triples_1000" ? 3 : 4;
    const drawnStr = String(rand).padStart(padLen, "0");
    setSimulatedDrawnNumber(drawnStr);

    // Si el número aleatorio es menor o igual al % vendido, asumimos que fue vendido
    const wasSold = rand < soldCount;
    setIsDrawnSold(wasSold);
  };

  // Emisión de Boleto Individual
  const handleEmitUnitaryTicket = () => {
    const ticketRecord: RecordedRaffleTicket = {
      ticketNumber: `RIF-${String(emittedRaffleTickets.length + 1).padStart(6, "0")}`,
      series: seriesName,
      selectedNumber: selectedNumber.padStart(
        activeRaffleId === "rifa_triples_1000" ? 3 : 4,
        "0"
      ),
      isFullTiraje: false,
      drawReference: config.lotteryDrawReference,
      drawDate: "15/12/2026",
      modalityId: activeRaffleId,
      modalityName: config.name,
      ticketPriceUsd,
      ticketPriceBs,
      bcvRate,
      vehiclePrizeUsd,
      vehiclePrizeBs,
      cashPrizeUsd,
      cashPrizeBs,
      cashIgf16Usd,
      cashIgf16Bs,
      vehicleIgf16Usd,
      vehicleIgf16Bs,
      sha256Hash: ticketSha256,
      runlotCode: "RUN-RIF-2026-0042",
      solvencyCode: "SOLV-CONALOT-0089",
      timestamp: new Date().toLocaleString("es-VE"),
      status: "EMITIDO_EN_CAJA",
    };

    if (onEmitRaffleTicket) {
      onEmitRaffleTicket(ticketRecord);
    }
  };

  // Emisión del Tiraje Completo Autorizado
  const handleEmitFullTiraje = () => {
    const ticketRecord: RecordedRaffleTicket = {
      ticketNumber: `TIRAJE-${String(emittedRaffleTickets.length + 1).padStart(6, "0")}`,
      series: seriesName,
      selectedNumber:
        activeRaffleId === "rifa_triples_1000"
          ? "000 AL 999 (TIRAJE COMPLETO)"
          : "0000 AL 9999 (TIRAJE COMPLETO)",
      isFullTiraje: true,
      totalTirajeTickets: config.totalNumbers,
      totalTirajeUsd: totalEmissionUsd,
      totalTirajeBs: totalEmissionBs,
      drawReference: config.lotteryDrawReference,
      drawDate: "15/12/2026",
      modalityId: activeRaffleId,
      modalityName: config.name,
      ticketPriceUsd,
      ticketPriceBs,
      bcvRate,
      vehiclePrizeUsd,
      vehiclePrizeBs,
      cashPrizeUsd,
      cashPrizeBs,
      cashIgf16Usd,
      cashIgf16Bs,
      vehicleIgf16Usd,
      vehicleIgf16Bs,
      sha256Hash: ticketSha256,
      runlotCode: "RUN-RIF-2026-0042",
      solvencyCode: "SOLV-CONALOT-0089",
      timestamp: new Date().toLocaleString("es-VE"),
      status: "EMITIDO_EN_CAJA",
    };

    if (onEmitRaffleTicket) {
      onEmitRaffleTicket(ticketRecord);
    }
    setTicketViewMode("tiraje_completo");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(ticketSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const totalEmittedRifasBs = emittedRaffleTickets.reduce((acc, t) => {
    return acc + (t.isFullTiraje ? t.totalTirajeBs || t.ticketPriceBs : t.ticketPriceBs);
  }, 0);

  return (
    <div className="space-y-8">
      {/* ====================================================================
          BANNER SUPERIOR DE LA VERTICAL DE RIFAS (CONALOT/P/2025-001)
      ==================================================================== */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 shrink-0">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Providencia CONALOT/P/2025-001
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Sorteos de Referencia: Lotería del Táchira (IOBPAS)
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Premio 70% en Especie + Metálico
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Módulo 1: Taquilla y Emisión de Boletos de Rifas (80 mm)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Evaluación técnica y operativa de la Providencia CONALOT/P/2025-001. Simulación de emisión térmica con serie continua (Art. 15), premios mixtos (Vehículo 70% + $1.000 en metálico), retención dual del 16% IGF (Art. 18 SENIAT) y diagnóstico de las trabas de cuórum de venta (Art. 20) y repetición de sorteos (Art. 25).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Tasa Oficial BCV:</span>{" "}
              <strong className="text-emerald-400">
                Bs. {formatBs(bcvRate, 2)} / USD
              </strong>
              <button
                type="button"
                onClick={fetchBcvRate}
                disabled={isFetchingBcv}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer"
                title="Sincronizar en tiempo real con API oficial del BCV"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isFetchingBcv ? "animate-spin text-amber-400" : ""}`} />
              </button>
            </div>
            {onGoToCalculator && (
              <button
                type="button"
                onClick={onGoToCalculator}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Ver Calculadora de Rifas (Módulo 2)</span>
              </button>
            )}
          </div>
        </div>

        {/* ====================================================================
            SELECTOR MAESTRO DE MODALIDAD DE RIFA (OPCIÓN A VS OPCIÓN B)
        ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-purple-900/40">
          {/* Opción A */}
          <button
            type="button"
            onClick={() => handleSelectModality("rifa_triples_1000")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeRaffleId === "rifa_triples_1000"
                ? "bg-gradient-to-br from-purple-600/30 to-blue-600/20 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs border border-purple-500/40">
                  A
                </span>
                <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-purple-300">
                  Opción A • Rifa de Triples (3 Cifras)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Art. 7 num. 6
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-1">
              1.000 Números (000 al 999) • Sorteo Triple Táchira
            </div>
            <div className="text-xs text-slate-400 leading-snug">
              Amarrada formalmente al sorteo oficial de las 16:30 hrs de la Lotería del Táchira. Tiraje cerrado de 1.000 combinaciones (Total Emisión: $10.000 USD / Bs. 400.000).
            </div>
          </button>

          {/* Opción B */}
          <button
            type="button"
            onClick={() => handleSelectModality("rifa_supergana_10000")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeRaffleId === "rifa_supergana_10000"
                ? "bg-gradient-to-br from-purple-600/30 to-emerald-600/20 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs border border-purple-500/40">
                  B
                </span>
                <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-emerald-300">
                  Opción B • Rifa Menor (4 Cifras)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Art. 7 num. 7
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-1">
              10.000 Números (0000 al 9999) • Sorteo Súper Gana
            </div>
            <div className="text-xs text-slate-400 leading-snug">
              Emisión de 10.000 boletos vinculada al sorteo Súper Gana de la Lotería del Táchira. Gran escala (Total Emisión: $100.000 USD / Bs. 4.000.000).
            </div>
          </button>
        </div>
      </div>

      {/* ====================================================================
          3 TARJETAS SUPERIORES: CONFIGURACIÓN, PLAN DE PREMIOS Y TRABA OPERATIVA
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Datos de Emisión y Precio del Boleto */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    1. Emisión y Precio del Boleto
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {config.numberRangeLabel}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                Serie {seriesName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                  Precio Boleto ($):
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={ticketPriceUsd}
                    onChange={(e) =>
                      setTicketPriceUsd(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <span className="block text-[10px] font-mono text-emerald-400 mt-0.5">
                  = Bs. {formatBs(ticketPriceBs, 2)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>Tasa BCV (Bs.):</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Conexión API en vivo" />
                  </label>
                  <button
                    type="button"
                    onClick={fetchBcvRate}
                    disabled={isFetchingBcv}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Actualizar tasa desde el API oficial del BCV"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isFetchingBcv ? "animate-spin text-amber-400" : ""}`} />
                    <span>{isFetchingBcv ? "Consultando..." : "API BCV"}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step={0.01}
                    value={bcvRate}
                    onChange={(e) =>
                      setBcvRate(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                  <span className="text-emerald-400 flex items-center gap-1">
                    ✓ En vivo BCV
                  </span>
                  {bcvLastUpdated && (
                    <span className="text-slate-500">{bcvLastUpdated}</span>
                  )}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                  Número en Caja:
                </label>
                <input
                  type="text"
                  maxLength={activeRaffleId === "rifa_triples_1000" ? 3 : 4}
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-purple-500/60 text-amber-300 font-mono font-black text-center text-sm focus:outline-none tracking-widest"
                />
                <span className="block text-[10px] font-mono text-purple-300 mt-0.5 text-center">
                  Boleto unitario
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/60 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Tiraje Total Autorizado:</span>
            <div className="text-right">
              <span className="font-extrabold text-white">
                ${totalEmissionUsd.toLocaleString()} USD
              </span>
              <span className="block text-[11px] text-emerald-400 font-bold">
                Bs. {formatBs(totalEmissionBs, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Plan de Premios: Especie (70%) + Metálico ($1.000) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    2. Plan de Premios Homologado
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Vehículo 0 Km (70%) + Metálico ($1.000)
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Retorno: 80% Emisión
              </span>
            </div>

            {/* Premio Principal Especie: Vehículo 70% */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vehículo 0 Km (70% Tiraje)</span>
                </span>
                <span className="font-mono font-extrabold text-amber-300">
                  ${vehiclePrizeUsd.toLocaleString()} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{config.vehicleName}</span>
                <span className="text-emerald-400 font-bold">
                  Bs. {formatBs(vehiclePrizeBs, 2)}
                </span>
              </div>
            </div>

            {/* Box Editable: Premios Secundarios Metálico */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blue-400" />
                  <span>Premios Secundarios en Metálico</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Aproximaciones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={cashPrizeUsd}
                    onChange={(e) =>
                      setCashPrizeUsd(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                  />
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold shrink-0">
                  = Bs. {formatBs(cashPrizeBs, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidación Rápida IGF 16% */}
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Retención IGF 16% Metálico:</span>
            <span className="text-rose-400 font-bold">
              -Bs. {formatBs(cashIgf16Bs, 2)} (-${cashIgf16Usd} USD)
            </span>
          </div>
        </div>

        {/* Card 3: Simulador de Traba Operativa (Art. 20 y Art. 25 Providencia) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    3. Traba Operativa (Arts. 20 y 25)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cuórum 70% & Contradicción Sorteo
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                Crítico
              </span>
            </div>

            {/* Slider de % de Boletos Vendidos */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold">Venta Efectiva:</span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded ${
                    soldPercentage < 70
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {soldPercentage}% ({soldCount.toLocaleString()} boletos)
                </span>
              </div>

              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={soldPercentage}
                onChange={(e) => setSoldPercentage(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between text-[9.5px] font-mono text-slate-500">
                <span>50% (Colapso)</span>
                <span className="font-bold text-amber-400">70% Mínimo (Art. 20)</span>
                <span>100% (Total)</span>
              </div>
            </div>

            {/* ALERTA ARTÍCULO 20 (< 70% DE VENTA) */}
            {soldPercentage < 70 && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>SUSPENSIÓN OBLIGATORIA (ART. 20)</span>
                </div>
                <p className="leading-tight text-slate-300">
                  Al venderse solo el {soldPercentage}%, el sorteo debe suspenderse ante CONALOT con 15 días de anticipación o devolver el dinero, perdiendo el 7% ya pagado (Art. 28).
                </p>
              </div>
            )}

            {/* BOTÓN SIMULAR SORTEO TÁCHIRA */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sorteo Lotería del Táchira</span>
                </span>
                <button
                  type="button"
                  onClick={handleSimulateDraw}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                >
                  🎲 Extraer Número
                </button>
              </div>

              {simulatedDrawnNumber !== null && (
                <div className="pt-1.5 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400">Extraído:</span>
                  <strong className="text-amber-300 text-xs">
                    {simulatedDrawnNumber}
                  </strong>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                      isDrawnSold
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {isDrawnSold ? "✓ VENDIDO" : "✗ NO VENDIDO"}
                  </span>
                </div>
              )}

              {simulatedDrawnNumber !== null && !isDrawnSold && (
                <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] leading-tight">
                  ⚠️ <strong>Contradicción Art. 25:</strong> Ordena repetir sorteo el mismo día hábil, lo cual es físicamente imposible pues la Lotería del Táchira transmite solo una vez al día.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BARRA DE ACCIONES DE EMISIÓN EN CAJA (POS CONTROLS)
      ==================================================================== */}
      <div className="bg-slate-900 border-2 border-purple-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>Consola de Emisión en Caja (80 mm)</span>
              {emittedRaffleTickets.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/40">
                  {emittedRaffleTickets.length} Registro(s) en Caja
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Emite boletos unitarios o talonarios completos para alimentar la contabilidad de Rifas
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Botón 1: Emitir Boleto Individual */}
          <button
            type="button"
            onClick={handleEmitUnitaryTicket}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Emitir Boleto Individual (#{selectedNumber})</span>
          </button>

          {/* Botón 2: Emitir Tiraje Completo Autorizado */}
          <button
            type="button"
            onClick={handleEmitFullTiraje}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>
              Emitir Tiraje Completo ({config.totalNumbers.toLocaleString()} Boletos • Bs. {formatBs(totalEmissionBs, 2)})
            </span>
          </button>

          {/* Botón 3: Limpiar Emisiones */}
          {emittedRaffleTickets.length > 0 && onClearRaffleTickets && (
            <button
              type="button"
              onClick={onClearRaffleTickets}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
              title="Reiniciar Emisiones de Rifas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          SECCIÓN COMPARATIVA DE BOLETOS TÉRMICOS 80 MM (LADO A LADO)
          Modelo 1 (Régimen Actual Vigente) vs. Modelo 2 (Propuesta Reforma SCFD)
      ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Comprobantes Térmicos Físicos 80 mm (Comparativa de Modelos)</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Contraste técnico: La trampa de la Providencia CONALOT/P/2025-001 vs. El amparo legal de la Reforma SCFD (Arts. 32-33 SENIAT)
            </p>
          </div>

          {/* Selector de Vista: Boleto Individual vs. Tiraje Completo */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTicketViewMode("unitario")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketViewMode === "unitario"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Boleto Individual (#{selectedNumber})</span>
            </button>
            <button
              type="button"
              onClick={() => setTicketViewMode("tiraje_completo")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketViewMode === "tiraje_completo"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tiraje Completo ({config.totalNumbers.toLocaleString()} Boletos)</span>
            </button>
          </div>
        </div>

        {/* GRID DE DOS COLUMNAS LADO A LADO */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start justify-center">
          {/* ====================================================================
              COLUMNA 1 (IZQUIERDA - ROJO): MODELO 1 VIGENTE (COLAPSO CONALOT 2025-001)
          ==================================================================== */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-xs font-bold">
                  1
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  Modelo 1: Boleto Actual Vigente (Colapso)
                </h4>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 font-mono">
                CONALOT/P/2025-001
              </span>
            </div>

            {/* Contenedor Papel Térmico 80mm Fondo Blanco Puro (#ffffff) */}
            <div className="w-full max-w-[450px] select-text shadow-2xl">
              <div className="thermal-edge-top" />
              <div
                className="thermal-ticket !bg-white !text-slate-950 font-mono px-4 py-4 text-[11px] leading-[1.35] border-x border-slate-300"
                style={{ backgroundColor: "#ffffff", color: "#020617" }}
              >
                {/* Regla de medición 80mm / 48 col */}
                <div className="flex justify-between items-center text-[9px] !text-slate-500 border-b border-dashed !border-slate-300 pb-1 mb-2">
                  <span>PAPEL TÉRMICO 80 MM (48 COL)</span>
                  <span>FACTURACIÓN DIRECTA OPERADORA</span>
                </div>

                {/* Encabezado Institucional Rígido */}
                <div className="text-center font-black text-[12px] tracking-tight !text-slate-950">
                  OPERADORA OFICIAL DE RIFAS C.A.
                </div>
                <div className="text-center font-bold text-[10px] !text-slate-800">
                  RIF: J-40897654-2 • CONCESIÓN CONALOT
                </div>
                <div className="text-center text-[9.5px] !text-rose-900 font-bold mb-1.5">
                  VENTA DIRECTA OBLIGATORIA (ART. 27 PROVIDENCIA)
                </div>

                {/* Badge Rojo de Alerta: FACTURA FISCAL DIRECTA / RIESGO ART. 27 */}
                <div
                  className="w-full py-1 px-2 mb-2.5 text-center font-extrabold text-[10.5px] tracking-wider uppercase rounded border-2"
                  style={{
                    backgroundColor: "#fee2e2",
                    borderColor: "#dc2626",
                    color: "#991b1b",
                  }}
                >
                  [ ! ] FACTURA FISCAL DIRECTA / RIESGO ART. 27 [ ! ]
                </div>

                {/* Datos de la Prohibición del Art. 27 */}
                <div className="space-y-0.5 text-[10px] !text-slate-950 border-b border-dashed !border-slate-400 pb-2 mb-2 bg-slate-50 p-2 rounded">
                  <div>
                    <span className="font-bold">Intermediación Comercial:</span> PROHIBIDA (Art. 27)
                  </div>
                  <div>
                    <span className="font-bold">Canal Autorizado:</span> Venta Directa de la Operadora
                  </div>
                  <div>
                    <span className="font-bold">Sorteo de Referencia:</span> {config.lotteryDrawReference}
                  </div>
                  <div>
                    <span className="font-bold">Modalidad:</span> {config.name}
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>
                      <span className="font-bold">Serie:</span> {seriesName} (Art. 15)
                    </span>
                    <span>
                      <span className="font-bold">Sorteo:</span> #4501
                    </span>
                  </div>
                </div>

                {/* Detalle según modo unitario o tiraje completo */}
                {ticketViewMode === "unitario" ? (
                  <div className="text-center py-2 my-1.5 border border-dashed !border-rose-700 rounded bg-rose-50/50">
                    <div className="text-[9px] uppercase tracking-widest font-extrabold !text-rose-900">
                      NÚMERO ASIGNADO EN BOLETO
                    </div>
                    <div className="text-2xl font-black tracking-widest !text-slate-950 my-0.5">
                      {selectedNumber.padStart(
                        activeRaffleId === "rifa_triples_1000" ? 3 : 4,
                        "0"
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-rose-900">
                      VALOR BOLETO: Bs. {formatBs(ticketPriceBs, 2)} (${ticketPriceUsd} USD)
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-1.5 mb-2 text-center font-bold text-[10px] rounded border"
                    style={{
                      backgroundColor: "#fef2f2",
                      color: "#991b1b",
                      borderColor: "#fecaca",
                    }}
                  >
                    MODO: TIRAJE COMPLETO ({config.numberRangeLabel} ={" "}
                    {config.totalNumbers.toLocaleString()} boletos × Bs.{" "}
                    {formatIntBs(ticketPriceBs)} [${ticketPriceUsd} USD])
                  </div>
                )}

                {/* Encabezado Lista Simple */}
                <div className="flex justify-between font-bold text-[10px] border-b border-dashed !border-slate-400 pb-1 mb-1.5 !text-slate-950">
                  <span>DESCRIPCIÓN / BOLETO EMITIDO</span>
                  <span>MONTO FACIAL</span>
                </div>

                {/* Filas de boletos (Solo Valor Facial) */}
                <div className="space-y-1 mb-2 min-h-[48px]">
                  {samplePlays.map((play) => (
                    <div
                      key={play.id}
                      className={`flex justify-between items-center text-[10px] !text-slate-950 ${
                        play.isSummary
                          ? "py-0.5 px-1 rounded font-bold border border-dashed bg-slate-100 border-slate-300"
                          : ""
                      }`}
                    >
                      <span className="font-semibold">{play.option}</span>
                      <span className="font-bold">
                        {play.isSummary
                          ? `Bs. ${formatIntBs(play.amount)}`
                          : `Bs. ${formatIntBs(play.amount)} ($${play.amountUsd})`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cierre Total Factura y Serial Máquina Fiscal */}
                <div className="border-t-2 border-b-2 border-double !border-slate-900 py-1.5 my-2">
                  <div className="flex justify-between items-center font-extrabold text-[11px] !text-slate-950">
                    <span>TOTAL FACTURA:</span>
                    <span>
                      Bs.{" "}
                      {formatIntBs(
                        ticketViewMode === "unitario"
                          ? ticketPriceBs
                          : totalEmissionBs
                      )}
                      <span className="text-[9px] font-normal ml-1 text-slate-700">
                        ($
                        {ticketViewMode === "unitario"
                          ? ticketPriceUsd
                          : totalEmissionUsd.toLocaleString()}{" "}
                        USD)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px] !text-slate-700 mt-0.5">
                    <span>BASE IMPONIBLE ACUMULADA (100%):</span>
                    <span>
                      Bs.{" "}
                      {formatIntBs(
                        ticketViewMode === "unitario"
                          ? ticketPriceBs
                          : totalEmissionBs
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-center font-bold text-[10px] !text-slate-950 tracking-wide my-1">
                  MÁQUINA FISCAL SERIAL: Z1A2345678
                </div>

                {/* Plan de Premios en Modelo Actual */}
                <div className="border-t border-b !border-slate-300 py-1.5 my-2 space-y-1 text-[10px]">
                  <div className="font-bold uppercase !text-slate-900 text-center">
                    --- PLAN DE PREMIOS OFICIAL ---
                  </div>
                  <div className="flex justify-between">
                    <span>1. Vehículo 0 Km (70% Emisión):</span>
                    <strong className="!text-slate-950">${vehiclePrizeUsd.toLocaleString()} USD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Premios Secundarios Metálico:</span>
                    <strong className="!text-slate-950">${cashPrizeUsd.toLocaleString()} USD</strong>
                  </div>
                </div>

                {/* Cargas e Inviabilidad Financiera del Régimen Vigente */}
                <div className="bg-rose-50 p-2 rounded border !border-rose-300 mb-2 space-y-1 text-[9.5px] !text-rose-950">
                  <div className="font-extrabold uppercase text-center text-rose-900">
                    CARGAS CONFISCATORIAS (PROVIDENCIA 2025-001)
                  </div>
                  <div className="flex justify-between">
                    <span>Aporte Anticipado CONALOT (7% s/ 100% Emisión):</span>
                    <strong className="text-rose-700">
                      -Bs. {formatBs(totalEmissionBs * 0.07, 2)} (-${totalEmissionUsd * 0.07} USD)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Peaje Software Homologado Privado (1,5%):</span>
                    <strong className="text-rose-700">
                      -Bs. {formatBs(totalEmissionBs * 0.015, 2)} (-${totalEmissionUsd * 0.015} USD)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Canon Beneficencia IOBPAS (Triple Táchira):</span>
                    <strong className="text-slate-700">Bs. 0,00 (0,00% Despojo)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Responsabilidad de Premios (Art. 31):</span>
                    <strong className="text-slate-700">CONALOT Exenta</strong>
                  </div>
                </div>

                {/* Alerta de Sorteo Desierto del Art. 25 */}
                <div className="border border-dashed !border-rose-400 p-2 rounded mb-2 text-[9.5px] text-rose-950 bg-rose-50/30 leading-snug">
                  <strong>Traba Art. 25:</strong> Si el número no se vendió, la norma ordena repetir el sorteo el mismo día. <strong>Imposibilidad absoluta:</strong> El sorteo oficial de la Lotería del Táchira es único al día.
                </div>

                {/* Alerta Roja Inferior del Ticket */}
                <div
                  className="mt-2 p-2.5 rounded border text-[10px] leading-snug"
                  style={{
                    backgroundColor: "#fef2f2",
                    borderColor: "#f87171",
                    color: "#7f1d1d",
                  }}
                >
                  <div className="flex items-start gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      PELIGRO FISCAL: La Operadora colapsa en déficit antes de vender boletos y la Taquilla que lo expenda es sancionada por no existir marco de Cuentas de Terceros.
                    </span>
                  </div>
                </div>
              </div>
              <div className="thermal-edge-bottom" />
            </div>
          </div>

          {/* ====================================================================
              COLUMNA 2 (DERECHA - VERDE): MODELO 2 PROPUESTA REFORMA SCFD (SOSTENIBILIDAD)
          ==================================================================== */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold">
                  2
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  Modelo 2: Boleto Propuesto con Reforma
                </h4>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono">
                Arts. 32-33 SENIAT
              </span>
            </div>

            {/* Contenedor Papel Térmico 80mm Fondo Blanco Puro (#ffffff) */}
            <div className="w-full max-w-[450px] select-text shadow-2xl">
              <div className="thermal-edge-top" />
              <div
                className="thermal-ticket !bg-white !text-slate-950 font-mono px-4 py-4 text-[11px] leading-[1.35] border-x border-slate-300"
                style={{ backgroundColor: "#ffffff", color: "#020617" }}
              >
                {/* Regla de medición 80mm / 48 col */}
                <div className="flex justify-between items-center text-[9px] !text-slate-500 border-b border-dashed !border-slate-300 pb-1 mb-2">
                  <span>PAPEL TÉRMICO 80 MM (48 COL)</span>
                  <span>HOMOLOGADO RUNLOT • CDAPUESTAS</span>
                </div>

                {/* Encabezado Institucional Homologado */}
                <div className="text-center font-black text-[12px] tracking-tight !text-slate-950">
                  RECAUDACIÓN POR CUENTA DE TERCEROS
                </div>
                <div className="text-center font-bold text-[9.5px] !text-slate-800">
                  (ARTS. 32 Y 33 PROVIDENCIA SNAT/2026/00093)
                </div>

                {/* Badge Verde: COMPROBANTE HOMOLOGADO SCFD / RUNLOT */}
                <div
                  className="w-full py-1 px-2 my-1.5 text-center font-extrabold text-[10px] tracking-wide uppercase rounded border-2"
                  style={{
                    backgroundColor: "#ecfdf5",
                    borderColor: "#059669",
                    color: "#065f46",
                  }}
                >
                  [ ✓ ] COMPROBANTE HOMOLOGADO SCFD / RUNLOT [ ✓ ]
                </div>

                {/* Datos de los 3 Niveles en Regla */}
                <div className="space-y-0.5 text-[10px] !text-slate-950 border-b border-dashed !border-slate-400 pb-1.5 mb-1.5 bg-slate-50 p-2 rounded">
                  <div className="flex justify-between">
                    <span>
                      <strong className="!text-slate-950">Punto Emisor:</strong> Centro Apuestas La Favorita
                    </span>
                    <span>
                      <strong className="!text-slate-950">Taquilla:</strong> 01
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] !text-slate-600">
                    <span>RIF: J-12345678-9 • RUNLOT: RUN-AG-0412</span>
                    <span>Fecha: 15/12/2026 14:30</span>
                  </div>
                  <div className="pt-0.5 border-t border-slate-200">
                    <span className="font-bold">Operadora Titular:</span> Operadora de Rifas C.A. (RUN-OP-987654)
                  </div>
                  <div className="flex justify-between text-emerald-900 font-bold">
                    <span>IOBPAS Titular: Lotería del Táchira</span>
                    <span>Canon: 5% GGR Beneficencia</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600 pt-0.5">
                    <span>Sorteo: {config.lotteryDrawReference}</span>
                    <span>Serie: {seriesName} (Art. 15)</span>
                  </div>
                </div>

                {/* Detalle según modo unitario o tiraje completo */}
                {ticketViewMode === "unitario" ? (
                  <div className="text-center py-2 my-1.5 border border-dashed !border-emerald-600 rounded bg-emerald-50/40">
                    <div className="text-[9px] uppercase tracking-widest font-extrabold !text-emerald-900">
                      NÚMERO ASIGNADO EN BOLETO
                    </div>
                    <div className="text-2xl font-black tracking-widest !text-slate-950 my-0.5">
                      {selectedNumber.padStart(
                        activeRaffleId === "rifa_triples_1000" ? 3 : 4,
                        "0"
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-900">
                      VALOR BOLETO: Bs. {formatBs(ticketPriceBs, 2)} (${ticketPriceUsd} USD)
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-1.5 mb-2 text-center font-bold text-[10px] rounded border"
                    style={{
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      borderColor: "#a7f3d0",
                    }}
                  >
                    TALONARIO Y TIRAJE COMPLETO HOMOLOGADO ({config.numberRangeLabel} ={" "}
                    {config.totalNumbers.toLocaleString()} boletos)
                  </div>
                )}

                {/* Tabla Ultra Compacta en 1 sola línea por jugada (5 Columnas - EXACTAMENTE COMO TRIPLES) */}
                <div className="mb-2">
                  <div
                    className="grid items-center font-extrabold text-[9px] border-b-2 !border-slate-900 pb-1 mb-1 !text-slate-950 whitespace-nowrap"
                    style={{
                      gridTemplateColumns: "25% 15% 21% 18% 21%",
                    }}
                  >
                    <div className="text-left pr-1">OPCIÓN</div>
                    <div className="text-right px-1">APUEST</div>
                    <div className="text-right px-1">PREMIO BRUTO</div>
                    <div className="text-right px-1">IGF 16%</div>
                    <div className="text-right pl-1">NETO COBRAR</div>
                  </div>

                  <div className="space-y-1 min-h-[48px]">
                    {samplePlays.map((play) => (
                      <div
                        key={play.id}
                        className="grid items-center text-[9.5px] border-b border-dotted !border-slate-300 py-0.5 whitespace-nowrap"
                        style={{
                          gridTemplateColumns: "25% 15% 21% 18% 21%",
                          backgroundColor: play.isSummary
                            ? "#f8fafc"
                            : "transparent",
                        }}
                      >
                        <div
                          className="font-bold !text-slate-950 truncate pr-1"
                          title={play.option}
                        >
                          {play.option}
                        </div>
                        <div className="text-right font-semibold !text-slate-900 px-1">
                          {play.isSummary
                            ? `${play.combCount}×${formatIntBs(ticketPriceBs)}`
                            : formatIntBs(play.amount)}
                        </div>
                        <div className="text-right font-bold !text-slate-950 px-1">
                          {formatIntBs(totalPrizesBs)}
                        </div>
                        <div
                          className="text-right font-bold px-1"
                          style={{ color: "#dc2626" }}
                        >
                          -{formatIntBs(totalIgf16Bs)}
                        </div>
                        <div
                          className="text-right font-extrabold pl-1"
                          style={{ color: "#15803d" }}
                        >
                          {formatIntBs(totalNetPrizeBs)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen Tiraje Completo / Retención 16% (IGUAL QUE TRIPLES) */}
                <div className="p-2 my-1.5 rounded border border-dashed !border-slate-400 bg-slate-50 text-[9.5px] space-y-1">
                  <div className="font-extrabold !text-slate-950 uppercase border-b border-slate-200 pb-0.5 flex justify-between items-center">
                    <span>
                      RESUMEN{" "}
                      {ticketViewMode === "unitario"
                        ? "BOLETO EN CAJA"
                        : `TIRAJE COMPLETO (${config.totalNumbers.toLocaleString()} OPCIONES)`}
                      :
                    </span>
                    <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Régimen Cuentas Terceros
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• 1 Ganador Garantizado ({drawShortTag}):</span>
                    <strong className="!text-slate-950">
                      Bs. {formatIntBs(totalPrizesBs)}
                      <span className="text-[8.5px] font-normal text-slate-600 ml-1">
                        (${totalPrizesUsd.toLocaleString()} USD)
                      </span>
                    </strong>
                  </div>
                  <div className="text-[8.5px] text-slate-600 pl-2">
                    Vehículo 0 Km (${vehiclePrizeUsd.toLocaleString()} USD) + Metálico (${cashPrizeUsd.toLocaleString()} USD)
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-rose-700">
                      • Retención Total IGF 16% (Art. 18 SENIAT):
                    </span>
                    <span className="text-rose-700">
                      -Bs. {formatIntBs(totalIgf16Bs)}
                      <span className="text-[8.5px] font-normal ml-1">
                        (-${totalIgf16Usd.toLocaleString()} USD)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-extrabold text-emerald-800">
                    <span>• Premio Neto Total a Cobrar/Entregar:</span>
                    <span>
                      Bs. {formatIntBs(totalNetPrizeBs)}
                      <span className="text-[8.5px] font-normal text-emerald-700 ml-1">
                        (${totalNetPrizeUsd.toLocaleString()} USD)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Detalle del Plan de Premios Homologado */}
                <div className="border-t border-b !border-slate-300 py-1.5 my-1.5 space-y-1 text-[9.5px]">
                  <div className="font-extrabold uppercase !text-slate-900 text-center text-[10px]">
                    --- PLAN DE PREMIOS HOMOLOGADO ---
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold !text-slate-950">
                        1. Premio Principal (Especie):
                      </div>
                      <div className="text-[8.5px] !text-slate-600">
                        {config.vehicleName}
                      </div>
                    </div>
                    <strong className="!text-slate-950 text-right">
                      ${vehiclePrizeUsd.toLocaleString()} USD
                      <span className="block text-[8px] font-normal !text-slate-600">
                        (Bs. {formatBs(vehiclePrizeBs, 2)})
                      </span>
                    </strong>
                  </div>

                  <div className="flex justify-between items-start pt-1 border-t border-dotted !border-slate-300">
                    <div>
                      <div className="font-bold !text-slate-950">
                        2. Premios Secundarios (Metálico):
                      </div>
                      <div className="text-[8.5px] !text-slate-600">
                        Aproximaciones en Caja
                      </div>
                    </div>
                    <strong className="!text-slate-950 text-right">
                      ${cashPrizeUsd.toLocaleString()} USD
                      <span className="block text-[8px] font-normal !text-slate-600">
                        (Bs. {formatBs(cashPrizeBs, 2)})
                      </span>
                    </strong>
                  </div>
                </div>

                {/* Liquidación 16% IGF SENIAT (Desglose Dual Metálico vs. Vehículo) */}
                <div className="bg-slate-50 p-2 rounded border !border-slate-300 mb-2 space-y-1 text-[9px] !text-slate-900">
                  <div className="font-extrabold uppercase text-center text-[9.5px] !text-slate-950">
                    LIQUIDACIÓN DUAL 16% IGF (ART. 18 SENIAT + ART. 65 LISLR)
                  </div>
                  <div className="flex justify-between">
                    <span>a) Metálico (${cashPrizeUsd.toLocaleString()}): Retención Caja (16%):</span>
                    <span className="font-bold text-rose-700">
                      -Bs. {formatBs(cashIgf16Bs, 2)} (-${cashIgf16Usd} USD)
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 pl-2">
                    <span>→ Neto Efectivo en Caja (84%):</span>
                    <span>
                      Bs. {formatBs(cashNetPaidBs, 2)} (${cashNetPaidUsd} USD)
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 flex justify-between">
                    <span>
                      b) Vehículo (${vehiclePrizeUsd.toLocaleString()}): Entero Ganador (16%):
                    </span>
                    <span className="font-bold text-amber-800">
                      Bs. {formatBs(vehicleIgf16Bs, 2)} (${vehicleIgf16Usd} USD)
                    </span>
                  </div>
                  <div className="text-[8.5px] !text-slate-600 pl-2 leading-snug">
                    * Ganador entera/deposita el 16% ante la Operadora para emitir
                    Comprobante Modelo 3 SENIAT y suscribir Acta Notariada (Art. 25).
                  </div>
                </div>

                {/* Total Captado Terceros */}
                <div className="border-t-2 border-b-2 border-double !border-slate-900 py-1.5 my-2">
                  <div className="flex justify-between items-center font-extrabold text-[11px] !text-slate-950">
                    <span>TOTAL CAPTADO (TERCEROS):</span>
                    <span>
                      Bs.{" "}
                      {formatIntBs(
                        ticketViewMode === "unitario"
                          ? ticketPriceBs
                          : totalEmissionBs
                      )}
                      <span className="text-[9px] font-normal ml-1 text-slate-700">
                        ($
                        {ticketViewMode === "unitario"
                          ? ticketPriceUsd
                          : totalEmissionUsd.toLocaleString()}{" "}
                        USD)
                      </span>
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-600 italic">
                    &quot;Fondos en custodia (Arts. 32-33 Providencia). Base
                    imponible propia s/comisión (Art. 29.1)&quot;
                  </div>
                </div>

                {/* QR y Firma Criptográfica SCFD */}
                <div className="flex items-center justify-between pt-1 border-t border-dashed !border-slate-400">
                  <div className="w-14 h-14 bg-slate-900 rounded p-1 flex items-center justify-center text-white shrink-0">
                    <QrCode className="w-12 h-12" />
                  </div>
                  <div className="ml-2 flex-1 text-[8.5px] !text-slate-600 font-mono leading-tight">
                    <div>
                      <strong>Sello Criptográfico SCFD:</strong>
                    </div>
                    <div className="truncate text-slate-800 font-bold">
                      {ticketSha256.slice(0, 24)}...
                    </div>
                    <div>Certificado: CIV #241.890 (SUSCERTE)</div>
                    <div>Inviolable • Transmitido a la nube SCFD</div>
                  </div>
                </div>

                {/* Alerta Verde Inferior del Ticket */}
                <div
                  className="mt-2 p-2.5 rounded border text-[10px] leading-snug"
                  style={{
                    backgroundColor: "#ecfdf5",
                    borderColor: "#6ee7b7",
                    color: "#065f46",
                  }}
                >
                  <div className="flex items-start gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      PROTECCIÓN TRIBUTARIA TOTAL: La Taquilla tributa solo 2,5% IAE sobre su comisión (LOCAPTEM). No acumula el vehículo como ingreso y la Beneficencia del Táchira recibe su 5% en tiempo real.
                    </span>
                  </div>
                </div>
              </div>
              <div className="thermal-edge-bottom" />
            </div>
          </div>
        </div>

        {/* Botón para Copiar Hash SHA-256 del Ticket */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleCopyHash}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>
              {copiedHash
                ? "✓ Hash SHA-256 Copiado al Portapapeles"
                : "Copiar Hash SHA-256 del Comprobante Térmico"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
