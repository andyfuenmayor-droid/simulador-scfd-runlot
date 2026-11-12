"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  RaffleModalityId,
  RAFFLE_MODALITIES,
  RecordedRaffleTicket,
} from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  generateDeterministicSha256,
} from "@/lib/cryptoUtils";
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Car,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  Download,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Percent,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  X,
} from "lucide-react";

interface Module1RifasPOSProps {
  onEmitRaffleTicket?: (ticket: RecordedRaffleTicket) => void;
  onClearRaffleTickets?: () => void;
  emittedRaffleTickets?: RecordedRaffleTicket[];
  onGoToCalculator?: () => void;
  onGoToIGF?: () => void;
}

interface RafflePlayItem {
  id: string;
  number: string;
  option: string;
  amountUsd: number;
  amountBs: number;
  combinationsCount: number;
  isFullTirajeSummary?: boolean;
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
  const is3Digits = activeRaffleId === "rifa_triples_1000";
  const drawShortTag = is3Digits ? "Triple Táchira" : "Súper Gana";

  // Parámetros interactivos editables con conexión al API del BCV
  const [bcvRate, setBcvRate] = useState<number>(904.45);
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

  // Precio unitario por defecto
  const [tirajeUnitUsd, setTirajeUnitUsd] = useState<number>(
    config.defaultTicketPriceUsd
  );
  const [seriesName, setSeriesName] = useState<string>("A");

  // Entrada de nuevo boleto individual en caja
  const [newBoletoNum, setNewBoletoNum] = useState<string>("748");
  const [newBoletoUsd, setNewBoletoUsd] = useState<number>(
    config.defaultTicketPriceUsd
  );

  // Modal de Liquidación y Retención Modelo 3 SENIAT
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState<boolean>(false);

  // Simulador de Traba Operativa (Arts. 20 y 25 Providencia CONALOT/P/2025-001)
  const [soldPercentage, setSoldPercentage] = useState<number>(85);
  const [simulatedDrawnNumber, setSimulatedDrawnNumber] = useState<string | null>(
    null
  );
  const [isDrawnSold, setIsDrawnSold] = useState<boolean | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Generador de jugadas de ejemplo por defecto
  const buildDefaultPlays = (
    modalityId: RaffleModalityId,
    rate: number
  ): RafflePlayItem[] => {
    const is3 = modalityId === "rifa_triples_1000";
    const tag = is3 ? "Triple Táchira" : "Súper Gana";
    const priceUsd = RAFFLE_MODALITIES[modalityId].defaultTicketPriceUsd;
    const priceBs = priceUsd * rate;

    if (is3) {
      return [
        {
          id: "r1",
          number: "748",
          option: `748 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r2",
          number: "123",
          option: `123 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r3",
          number: "050",
          option: `050 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r4",
          number: "999",
          option: `999 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
      ];
    } else {
      return [
        {
          id: "r1",
          number: "4512",
          option: `4512 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r2",
          number: "0123",
          option: `0123 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r3",
          number: "8890",
          option: `8890 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
        {
          id: "r4",
          number: "9999",
          option: `9999 ${tag}`,
          amountUsd: priceUsd,
          amountBs: priceBs,
          combinationsCount: 1,
        },
      ];
    }
  };

  // Generador de Tiraje Completo
  const buildFullTirajePlaysList = (
    modalityId: RaffleModalityId,
    unitUsd: number,
    rate: number
  ): RafflePlayItem[] => {
    const is3 = modalityId === "rifa_triples_1000";
    const tag = is3 ? "Triple Táchira" : "Súper Gana";
    const unitBs = unitUsd * rate;

    if (is3) {
      return [
        {
          id: "ft-000",
          number: "000",
          option: `000 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-001",
          number: "001",
          option: `001 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-002",
          number: "002",
          option: `002 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-middle",
          number: "003-997",
          option: `SERIE 003 AL 997 (995 BOLETOS)`,
          amountUsd: unitUsd * 995,
          amountBs: unitBs * 995,
          combinationsCount: 995,
          isFullTirajeSummary: true,
        },
        {
          id: "ft-998",
          number: "998",
          option: `998 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-999",
          number: "999",
          option: `999 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
      ];
    } else {
      return [
        {
          id: "ft-0000",
          number: "0000",
          option: `0000 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-0001",
          number: "0001",
          option: `0001 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-0002",
          number: "0002",
          option: `0002 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-middle",
          number: "0003-9997",
          option: `SERIE 0003 AL 9997 (9.995 BOLETOS)`,
          amountUsd: unitUsd * 9995,
          amountBs: unitBs * 9995,
          combinationsCount: 9995,
          isFullTirajeSummary: true,
        },
        {
          id: "ft-9998",
          number: "9998",
          option: `9998 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
        {
          id: "ft-9999",
          number: "9999",
          option: `9999 ${tag}`,
          amountUsd: unitUsd,
          amountBs: unitBs,
          combinationsCount: 1,
        },
      ];
    }
  };

  // Lista interactiva de boletos en taquilla
  const [rafflePlays, setRafflePlays] = useState<RafflePlayItem[]>(() =>
    buildDefaultPlays("rifa_triples_1000", 904.45)
  );

  // Recalcular montos en Bs cuando cambia la tasa BCV
  useEffect(() => {
    setRafflePlays((prev) =>
      prev.map((p) => ({
        ...p,
        amountBs: p.amountUsd * bcvRate,
      }))
    );
  }, [bcvRate]);

  // Selección de modalidad
  const handleSelectModality = (id: RaffleModalityId) => {
    setActiveRaffleId(id);
    const newConfig = RAFFLE_MODALITIES[id];
    setTirajeUnitUsd(newConfig.defaultTicketPriceUsd);
    setNewBoletoUsd(newConfig.defaultTicketPriceUsd);
    setNewBoletoNum(id === "rifa_triples_1000" ? "748" : "4512");
    setRafflePlays(buildDefaultPlays(id, bcvRate));
    setSimulatedDrawnNumber(null);
    setIsDrawnSold(null);
  };

  // Acciones de la barra de jugadas
  const handleResetDefaults = () => {
    setRafflePlays(buildDefaultPlays(activeRaffleId, bcvRate));
  };

  const handleLoadFullTiraje = (customUnitUsd?: number) => {
    const unit = customUnitUsd ?? tirajeUnitUsd;
    setRafflePlays(buildFullTirajePlaysList(activeRaffleId, unit, bcvRate));
  };

  const handleClearAllPlays = () => {
    setRafflePlays([]);
  };

  // Agregar boleto individual
  const handleAddBoleto = () => {
    const padLen = is3Digits ? 3 : 4;
    const cleanNum = newBoletoNum.trim().padStart(padLen, "0");
    const item: RafflePlayItem = {
      id: `play-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      number: cleanNum,
      option: `${cleanNum} ${drawShortTag}`,
      amountUsd: Math.max(1, newBoletoUsd),
      amountBs: Math.max(1, newBoletoUsd) * bcvRate,
      combinationsCount: 1,
    };
    setRafflePlays((prev) => [item, ...prev]);
  };

  const handleRemovePlay = (id: string) => {
    setRafflePlays((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOptionChange = (id: string, text: string) => {
    setRafflePlays((prev) =>
      prev.map((p) => (p.id === id ? { ...p, option: text } : p))
    );
  };

  const handleAmountChange = (id: string, usdVal: number) => {
    const safeUsd = Math.max(1, usdVal || 0);
    setRafflePlays((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              amountUsd: safeUsd,
              amountBs: safeUsd * bcvRate,
            }
          : p
      )
    );
  };

  // Totales de la Taquilla POS
  const totalComb = rafflePlays.reduce(
    (acc, p) => acc + (p.combinationsCount || 1),
    0
  );
  const totalFacialUsd = rafflePlays.reduce(
    (acc, p) => acc + (p.amountUsd || 0),
    0
  );
  const totalFacialBs = totalFacialUsd * bcvRate;

  const isFullTirajeActive =
    rafflePlays.some((p) => p.isFullTirajeSummary) ||
    totalComb >= config.totalNumbers;

  // Cálculos de Emisión Oficial Autorizada
  const totalEmissionUsd = config.totalNumbers * tirajeUnitUsd;
  const totalEmissionBs = totalEmissionUsd * bcvRate;

  // Plan de Premios Oficial (70% Vehículo + $1.000 Metálico)
  const vehiclePrizeUsd = totalEmissionUsd * 0.7;
  const vehiclePrizeBs = vehiclePrizeUsd * bcvRate;
  const cashPrizeUsd = config.defaultCashPrizeUsd;
  const cashPrizeBs = cashPrizeUsd * bcvRate;

  const totalPrizesUsd = vehiclePrizeUsd + cashPrizeUsd;
  const totalPrizesBs = vehiclePrizeBs + cashPrizeBs;

  // Retenciones 16% IGF SENIAT
  const cashIgf16Usd = cashPrizeUsd * 0.16;
  const cashIgf16Bs = cashPrizeBs * 0.16;
  const cashNetPaidUsd = cashPrizeUsd - cashIgf16Usd;
  const cashNetPaidBs = cashPrizeBs - cashIgf16Bs;

  const vehicleIgf16Usd = vehiclePrizeUsd * 0.16;
  const vehicleIgf16Bs = vehiclePrizeBs * 0.16;

  const totalIgf16Usd = cashIgf16Usd + vehicleIgf16Usd;
  const totalIgf16Bs = cashIgf16Bs + vehicleIgf16Bs;
  const totalNetPrizeUsd = totalPrizesUsd - totalIgf16Usd;
  const totalNetPrizeBs = totalPrizesBs - totalIgf16Bs;

  // Premios mostrados en la barra inferior (1 Ganador)
  const displayGrossPrize = totalPrizesBs;
  const displayIgf16 = totalIgf16Bs;
  const displayNetPrize = totalNetPrizeBs;

  // Traba operativa (Arts. 20 y 25)
  const soldCount = Math.round((config.totalNumbers * soldPercentage) / 100);
  const handleSimulateDraw = () => {
    const max = config.totalNumbers;
    const rand = Math.floor(Math.random() * max);
    const padLen = is3Digits ? 3 : 4;
    const drawnStr = String(rand).padStart(padLen, "0");
    setSimulatedDrawnNumber(drawnStr);
    const wasSold = rand < soldCount;
    setIsDrawnSold(wasSold);
  };

  // Hash SHA-256 determinístico del ticket en pantalla
  const ticketSha256 = useMemo(() => {
    return generateDeterministicSha256(
      `RIFA-${activeRaffleId}-${seriesName}-${totalComb}-${totalFacialBs}-${totalPrizesBs}-${Date.now().toString().slice(0, 7)}`
    );
  }, [
    activeRaffleId,
    seriesName,
    totalComb,
    totalFacialBs,
    totalPrizesBs,
  ]);

  // Emisión a SCFD
  const ticketNumberStr = useMemo(() => {
    return String(emittedRaffleTickets.length + 1).padStart(6, "0");
  }, [emittedRaffleTickets.length]);

  const handleEmitToSCFD = () => {
    const isFull = isFullTirajeActive;
    const primaryNumber =
      rafflePlays[0]?.number || (is3Digits ? "748" : "4512");

    const record: RecordedRaffleTicket = {
      ticketNumber: isFull ? `TIRAJE-${ticketNumberStr}` : `RIF-${ticketNumberStr}`,
      series: seriesName,
      selectedNumber: isFull
        ? `${config.numberRangeLabel} (TIRAJE COMPLETO)`
        : primaryNumber,
      isFullTiraje: isFull,
      totalTirajeTickets: isFull ? config.totalNumbers : totalComb,
      totalTirajeUsd: totalFacialUsd,
      totalTirajeBs: totalFacialBs,
      drawReference: config.lotteryDrawReference,
      drawDate: "15/12/2026",
      modalityId: activeRaffleId,
      modalityName: config.name,
      ticketPriceUsd: tirajeUnitUsd,
      ticketPriceBs: tirajeUnitUsd * bcvRate,
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
      onEmitRaffleTicket(record);
    }
  };

  const totalEmittedRifasBs = emittedRaffleTickets.reduce((acc, t) => {
    return acc + (t.isFullTiraje ? t.totalTirajeBs || t.ticketPriceBs : t.ticketPriceBs);
  }, 0);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(ticketSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* ====================================================================
          BARRA SUPERIOR: SELECTOR DE MODALIDAD + TERMINAL POS INTERACTIVO
          (ESTRUCTURA IDÉNTICA A MODULE1POS.TSX)
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================================================================
            COLUMNA IZQUIERDA (lg:col-span-5): PARÁMETROS, TIRAJE Y RETENCIÓN
        ================================================================ */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-purple-400" />
                1. Selector de Modalidad de Rifa (CONALOT/P/2025-001)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium font-mono">
                  Sincronización Total
                </span>
              </div>
            </div>

            {/* Selector Opción A vs Opción B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Opción A: Triples 1.000 */}
              <button
                type="button"
                onClick={() => handleSelectModality("rifa_triples_1000")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  activeRaffleId === "rifa_triples_1000"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Opción A
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    1.000 Núm
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Rifa de Triples (3 Cifras)
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <div>• Tiraje: <strong>1.000 boletos (000 al 999)</strong></div>
                  <div>• Sorteo: <strong>Triple Táchira (16:30 hrs)</strong></div>
                  <div>
                    • Emisión: $10.000 USD (Bs. {formatIntBs(10000 * bcvRate)})
                  </div>
                  <div>• Retorno: <strong>80% (Vehículo 70% + $1k)</strong></div>
                </div>
              </button>

              {/* Opción B: Rifa Menor 10.000 */}
              <button
                type="button"
                onClick={() => handleSelectModality("rifa_supergana_10000")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  activeRaffleId === "rifa_supergana_10000"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Opción B
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    10.000 Núm
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Rifa Menor (4 Cifras)
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <div>• Tiraje: <strong>10.000 boletos (0000 al 9999)</strong></div>
                  <div>• Sorteo: <strong>Súper Gana (Lot. Táchira)</strong></div>
                  <div>
                    • Emisión: $100.000 USD (Bs. {formatIntBs(100000 * bcvRate)})
                  </div>
                  <div>• Retorno: <strong>80% (Vehículo 70% + $1k)</strong></div>
                </div>
              </button>
            </div>

            {/* Resumen de Parámetros Activos (KPIs 3 columnas) */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-center">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold font-mono">
                  Retorno Premios
                </div>
                <div className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                  80% Emisión
                </div>
                <div className="text-[9px] text-slate-500">70% Vehíc + $1k</div>
              </div>

              <div className="border-x border-slate-800 px-1">
                <div className="text-[10px] uppercase text-slate-400 font-semibold font-mono flex items-center justify-center gap-1">
                  <span>Tasa BCV</span>
                  <button
                    type="button"
                    onClick={fetchBcvRate}
                    disabled={isFetchingBcv}
                    className="hover:text-emerald-400 cursor-pointer text-slate-400"
                    title="Actualizar API oficial del BCV"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isFetchingBcv ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-blue-400 font-mono truncate">
                  Bs. {formatBs(bcvRate, 2)}
                </div>
                <div className="text-[9px] text-emerald-400 flex items-center justify-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En vivo API</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold font-mono">
                  Retención IGF
                </div>
                <div className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                  16% (Art. 18)
                </div>
                <div className="text-[9px] text-slate-500">Modelo 3 SENIAT</div>
              </div>
            </div>

            {/* ==============================================================
                SIMULAR TIRAJE COMPLETO (TALONARIO COMPLETO 1.000 / 10.000)
            ============================================================== */}
            <div className="mt-4 p-3.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-500/40 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Simular Tiraje Completo ({config.numberRangeLabel})
                </span>
                {isFullTirajeActive && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    TIRAJE ACTIVO
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    Precio Boleto ($):
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={tirajeUnitUsd}
                    onChange={(e) =>
                      setTirajeUnitUsd(
                        Math.max(1, parseFloat(e.target.value) || 0)
                      )
                    }
                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-extrabold shadow-sm"
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    = Bs. {formatIntBs(tirajeUnitUsd * bcvRate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadFullTiraje()}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer font-mono"
                >
                  Cargar {config.totalNumbers.toLocaleString()} Boletos
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-mono text-slate-600 dark:text-slate-400">
                <span>
                  Venta Tiraje: Bs.{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {formatIntBs(totalEmissionBs)}
                  </strong>{" "}
                  (${totalEmissionUsd.toLocaleString()} USD)
                </span>
                <span>
                  1 Ganador: Bs.{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatIntBs(totalPrizesBs)}
                  </strong>{" "}
                  (${totalPrizesUsd.toLocaleString()} USD)
                </span>
              </div>
            </div>

            {/* ==============================================================
                MÓDULO DE LIQUIDACIÓN Y RETENCIÓN IGF (ART. 18 — MODELO 3)
            ============================================================== */}
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500/60 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Módulo de Liquidación y Retención IGF (Art. 18)
                </span>
                <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-300 shadow-sm">
                  Modelo 3 • 16% IGF
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400">
                    Premios Acertados ({drawShortTag}):
                  </div>
                  <div className="font-black text-slate-950 dark:text-white text-sm mt-0.5">
                    Bs. {formatIntBs(totalPrizesBs)}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                    Vehículo ($7k) + Metálico ($1k)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-red-950/40 border border-rose-300 dark:border-red-700/60">
                  <div className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-red-300">
                    Retención 16% IGF (Art. 18):
                  </div>
                  <div className="font-black text-rose-700 dark:text-rose-300 text-sm mt-0.5">
                    -Bs. {formatIntBs(totalIgf16Bs)}
                  </div>
                  <div className="text-[10px] text-rose-900 dark:text-rose-300 font-black mt-0.5">
                    -144k (Metál) • -1.01M (Vehíc)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrizeModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer font-mono"
              >
                <Award className="w-4 h-4 text-emerald-100" />
                <span>Pagar Premio / Liquidar Retención IGF (Art. 18)</span>
              </button>
            </div>

            {/* ==============================================================
                SIMULADOR DE TRABA OPERATIVA (ARTS. 20 Y 25 PROVIDENCIA)
            ============================================================== */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Traba Operativa (Arts. 20 y 25 Providencia)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    soldPercentage < 70
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {soldPercentage}% Vendido ({soldCount} boletos)
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>50% (Colapso)</span>
                  <span className="text-amber-400 font-bold">70% Mínimo (Art. 20)</span>
                  <span>100% (Total)</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={soldPercentage}
                  onChange={(e) => setSoldPercentage(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <div className="text-[10.5px]">
                  {simulatedDrawnNumber ? (
                    <span>
                      Número Extraído:{" "}
                      <strong className="text-amber-300 font-mono text-sm font-black">
                        #{simulatedDrawnNumber}
                      </strong>{" "}
                      {isDrawnSold ? (
                        <span className="text-emerald-400 font-bold">
                          (✓ VENDIDO)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          (✗ NO VENDIDO - Traba Art. 25)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Sorteo Oficial: {config.lotteryDrawReference}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSimulateDraw}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Extraer Número
                </button>
              </div>
            </div>
          </div>

          {/* Acciones Ejecutivas: Emitir Ticket a SCFD */}
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2.5">
            <button
              type="button"
              onClick={handleEmitToSCFD}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition-all cursor-pointer font-mono"
            >
              <Printer className="w-4 h-4" />
              {isFullTirajeActive
                ? `Emitir Tiraje #${ticketNumberStr} a SCFD`
                : `Emitir Ticket #${ticketNumberStr} a SCFD`}
            </button>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">
                Boletos / Tirajes Emitidos en Caja:
              </span>
              <span className="font-bold text-emerald-400">
                {emittedRaffleTickets.length}{" "}
                {emittedRaffleTickets.length === 1 ? "Emitido" : "Emitidos"} (Bs.{" "}
                {formatBs(totalEmittedRifasBs, 2)})
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================
            COLUMNA DERECHA (lg:col-span-7): CAPTURA DE BOLETOS EN TAQUILLA POS
        ================================================================ */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  2. Captura de Boletos en Taquilla POS ({totalComb}{" "}
                  {totalComb === 1 ? "Boleto" : "Boletos"} Activos)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 border border-emerald-500/40 transition-all shadow-sm cursor-pointer font-mono"
                  title="Cargar boletos de ejemplo por defecto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  Boletos Ejemplo
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadFullTiraje()}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 transition-all shadow-sm cursor-pointer font-mono"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Tiraje Completo ({config.totalNumbers.toLocaleString()})
                </button>
                {rafflePlays.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPlays}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors cursor-pointer font-mono"
                    title="Vaciar boletos en pantalla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar
                  </button>
                )}
              </div>
            </div>

            {/* Formulario de Entrada Rápida de Boletos */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  Número:
                </span>
                <input
                  type="text"
                  maxLength={is3Digits ? 3 : 4}
                  value={newBoletoNum}
                  onChange={(e) => setNewBoletoNum(e.target.value)}
                  placeholder={is3Digits ? "000" : "0000"}
                  className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-purple-500/50 text-amber-300 font-mono font-bold text-center text-xs focus:outline-none tracking-wider"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  Precio ($):
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={newBoletoUsd}
                  onChange={(e) =>
                    setNewBoletoUsd(Math.max(1, parseFloat(e.target.value) || 0))
                  }
                  className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-center text-xs focus:outline-none"
                />
                <span className="text-[10px] font-mono text-slate-400">
                  = Bs. {formatIntBs(newBoletoUsd * bcvRate)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddBoleto}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Boleto</span>
              </button>
            </div>

            {/* Lista Interactiva de Boletos Activos en Pantalla */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 mb-4">
              {rafflePlays.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-2">
                  <div className="text-xs font-bold text-slate-300 font-mono">
                    Sin boletos cargados en taquilla (Bs. 0,00)
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Pulse el botón{" "}
                    <strong className="text-purple-400">
                      Tiraje Completo ({config.totalNumbers.toLocaleString()})
                    </strong>{" "}
                    o{" "}
                    <strong className="text-emerald-400">Boletos Ejemplo</strong>{" "}
                    arriba para cargar boletos del talonario.
                  </p>
                </div>
              ) : (
                rafflePlays.map((play, idx) => {
                  const gross = totalPrizesBs;
                  const igf = totalIgf16Bs;
                  const net = totalNetPrizeBs;

                  return (
                    <div
                      key={play.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border ${
                        play.isFullTirajeSummary
                          ? "bg-purple-950/30 border-purple-500/40"
                          : "bg-slate-950 border-slate-800/90"
                      }`}
                    >
                      <div className="col-span-1 text-center font-mono text-xs text-slate-500 font-bold">
                        #{idx + 1}
                      </div>

                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="text"
                          value={play.option}
                          readOnly={Boolean(play.isFullTirajeSummary)}
                          onChange={(e) =>
                            handleOptionChange(play.id, e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-3 flex items-center gap-1">
                        <span className="text-xs text-slate-400 font-mono">
                          Bs.
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={100}
                          value={play.amountBs}
                          readOnly={Boolean(play.isFullTirajeSummary)}
                          onChange={(e) =>
                            handleAmountChange(
                              play.id,
                              parseFloat(e.target.value) / bcvRate
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="hidden sm:block sm:col-span-4 text-right font-mono text-[11px]">
                        <div className="text-slate-300">
                          Premio 1 Ganador:{" "}
                          <strong>{formatIntBs(gross)}</strong> |{" "}
                          <span className="text-red-400">
                            -{formatIntBs(igf)} (16%)
                          </span>
                        </div>
                        <div className="text-emerald-400 font-bold">
                          Neto: Bs. {formatIntBs(net)}
                        </div>
                      </div>

                      <div className="col-span-4 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePlay(play.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Eliminar boleto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ==============================================================
                SUB-TOTAL DE LA MODALIDAD ACTIVA EN PANTALLA
                (EXACTAMENTE IGUAL A MODULE1POS.TSX)
            ============================================================== */}
            <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-purple-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg font-bold text-sm bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-400 dark:border-purple-500/30">
                  🎟️
                </span>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white uppercase">
                    Sub-Total {config.name} ({totalComb}{" "}
                    {totalComb === 1 ? "Boleto" : "Boletos"} en Pantalla)
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    1 Ganador ({drawShortTag}): Bs.{" "}
                    <strong className="text-slate-900 dark:text-white">
                      {formatIntBs(displayGrossPrize)}
                    </strong>{" "}
                    • Retención IGF:{" "}
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      -{formatIntBs(displayIgf16)}
                    </span>{" "}
                    • Neto:{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Bs. {formatIntBs(displayNetPrize)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Sub-Total Captado:
                </div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  Bs. {formatBs(totalFacialBs, 2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    (${totalFacialUsd.toLocaleString()} USD)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECCIÓN INFERIOR: BOLETOS TÉRMICOS DE 80 MM (LADO A LADO)
          (EXACTAMENTE IGUAL A MODULE1POS.TSX CON BLANCO PURO #ffffff)
      ==================================================================== */}
      <div className="pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-extrabold text-white">
                Boletos Térmicos 80 mm (Lado a Lado: Modelo Actual vs. Propuesta SCFD)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualización idéntica al ticket físico de 80 mm (48 columnas) bajo
              la Providencia CONALOT/P/2025-001 y la Reforma SNAT/2026/00093.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* ==================================================================
              COLUMNA 1 (IZQUIERDA - ROJO): MODELO 1 TICKET ACTUAL RÍGIDO
          ================================================================== */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-xs font-bold font-mono">
                  1
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Modelo 1: Ticket Actual Rígido (CONALOT 2025-001)
                </h4>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 font-mono">
                Art. 27 Prohibición
              </span>
            </div>

            {/* Contenedor Papel Térmico 80mm Blanco Puro */}
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

                {/* Badge Rojo de Alerta */}
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
                    <span className="font-bold">Intermediación Comercial:</span>{" "}
                    PROHIBIDA (Art. 27)
                  </div>
                  <div>
                    <span className="font-bold">Canal Autorizado:</span> Venta
                    Directa de la Operadora
                  </div>
                  <div>
                    <span className="font-bold">Sorteo de Referencia:</span>{" "}
                    {config.lotteryDrawReference}
                  </div>
                  <div>
                    <span className="font-bold">Modalidad:</span> {config.name}
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>
                      <span className="font-bold">Serie:</span> {seriesName}{" "}
                      (Art. 15)
                    </span>
                    <span>
                      <span className="font-bold">Sorteo:</span> #4501
                    </span>
                  </div>
                </div>

                {/* Modo Tiraje Completo / Detalle de Emisión */}
                {isFullTirajeActive && (
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
                    {formatIntBs(tirajeUnitUsd * bcvRate)} [${tirajeUnitUsd} USD])
                  </div>
                )}

                {/* Encabezado Lista Simple */}
                <div className="flex justify-between font-bold text-[10px] border-b border-dashed !border-slate-400 pb-1 mb-1.5 !text-slate-950">
                  <span>DESCRIPCIÓN / BOLETO EMITIDO</span>
                  <span>MONTO FACIAL</span>
                </div>

                {/* Filas de boletos (Solo Valor Facial) */}
                <div className="space-y-1 mb-2 min-h-[48px]">
                  {rafflePlays.map((play) => (
                    <div
                      key={play.id}
                      className={`flex justify-between items-center text-[10px] !text-slate-950 ${
                        play.isFullTirajeSummary
                          ? "py-0.5 px-1 rounded font-bold border border-dashed bg-slate-100 border-slate-300"
                          : ""
                      }`}
                    >
                      <span className="font-semibold">{play.option}</span>
                      <span className="font-bold">
                        {play.isFullTirajeSummary
                          ? `Bs. ${formatIntBs(play.amountBs)}`
                          : `Bs. ${formatIntBs(play.amountBs)} ($${play.amountUsd})`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cierre Total Factura y Serial Máquina Fiscal */}
                <div className="border-t-2 border-b-2 border-double !border-slate-900 py-1.5 my-2">
                  <div className="flex justify-between items-center font-extrabold text-[11px] !text-slate-950">
                    <span>TOTAL FACTURA:</span>
                    <span>
                      Bs. {formatIntBs(totalFacialBs)}
                      <span className="text-[9px] font-normal ml-1 text-slate-700">
                        (${totalFacialUsd.toLocaleString()} USD)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px] !text-slate-700 mt-0.5">
                    <span>BASE IMPONIBLE ACUMULADA (100%):</span>
                    <span>Bs. {formatIntBs(totalFacialBs)}</span>
                  </div>
                </div>

                <div className="text-center font-bold text-[10px] !text-slate-950 tracking-wide my-1">
                  MÁQUINA FISCAL SERIAL: Z1A2345678
                </div>

                {/* Plan de Premios Oficial */}
                <div className="border-t border-b !border-slate-300 py-1.5 my-2 space-y-1 text-[10px]">
                  <div className="font-bold uppercase !text-slate-900 text-center">
                    --- PLAN DE PREMIOS OFICIAL ---
                  </div>
                  <div className="flex justify-between">
                    <span>1. Vehículo 0 Km (70% Emisión):</span>
                    <strong className="!text-slate-950">
                      ${vehiclePrizeUsd.toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Premios Secundarios Metálico:</span>
                    <strong className="!text-slate-950">
                      ${cashPrizeUsd.toLocaleString()} USD
                    </strong>
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
                      -Bs. {formatBs(totalEmissionBs * 0.07, 2)} (-$
                      {totalEmissionUsd * 0.07} USD)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Peaje Software Homologado Privado (1,5%):</span>
                    <strong className="text-rose-700">
                      -Bs. {formatBs(totalEmissionBs * 0.015, 2)} (-$
                      {totalEmissionUsd * 0.015} USD)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Canon Beneficencia IOBPAS (Triple Táchira):</span>
                    <strong className="text-rose-700">
                      Bs. 0,00 (0,00% Despojo)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Responsabilidad de Premios (Art. 31):</span>
                    <strong className="text-slate-900">CONALOT Exenta</strong>
                  </div>
                </div>

                {/* Alerta de la Traba del Art. 25 */}
                <div className="p-2 rounded border border-dashed !border-amber-400 bg-amber-50 text-[9.5px] text-amber-950 space-y-0.5 mb-2 leading-tight">
                  <div className="font-bold text-amber-900">
                    Traba Art. 25: Si el número no se vendió, la norma ordena
                    repetir el sorteo el mismo día. Imposibilidad absoluta: El
                    sorteo oficial de la Lotería del Táchira es único al día.
                  </div>
                </div>

                {/* Alerta de Peligro Fiscal Inferior */}
                <div
                  className="mt-2 p-2.5 rounded border text-[10px] leading-snug"
                  style={{
                    backgroundColor: "#fee2e2",
                    borderColor: "#fca5a5",
                    color: "#991b1b",
                  }}
                >
                  <div className="flex items-start gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      PELIGRO FISCAL: La Operadora colapsa en déficit antes de
                      vender boletos y la Taquilla que lo expenda es sancionada por
                      no existir marco de Cuentas de Terceros.
                    </span>
                  </div>
                </div>
              </div>
              <div className="thermal-edge-bottom" />
            </div>
          </div>

          {/* ==================================================================
              COLUMNA 2 (DERECHA - VERDE): MODELO 2 BOLETO HOMOLOGADO SCFD
          ================================================================== */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono">
                  2
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Modelo 2: Boleto Propuesto con Reforma SCFD
                </h4>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono">
                Arts. 32-33 SENIAT
              </span>
            </div>

            {/* Contenedor Papel Térmico 80mm Blanco Puro */}
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
                      <strong className="!text-slate-950">Punto Emisor:</strong>{" "}
                      Centro Apuestas La Favorita
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
                    <span className="font-bold">Operadora Titular:</span> Operadora
                    de Rifas C.A. (RUN-OP-987654)
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

                {/* Modo Tiraje Completo */}
                {isFullTirajeActive && (
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

                {/* Tabla 5 Columnas (EXACTAMENTE COMO TRIPLES) */}
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
                    {rafflePlays.map((play) => (
                      <div
                        key={play.id}
                        className="grid items-center text-[9.5px] border-b border-dotted !border-slate-300 py-0.5 whitespace-nowrap"
                        style={{
                          gridTemplateColumns: "25% 15% 21% 18% 21%",
                          backgroundColor: play.isFullTirajeSummary
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
                          {play.isFullTirajeSummary
                            ? `${play.combinationsCount}×${formatIntBs(tirajeUnitUsd * bcvRate)}`
                            : formatIntBs(play.amountBs)}
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
                      RESUMEN {isFullTirajeActive ? `TIRAJE COMPLETO (${config.totalNumbers.toLocaleString()} OPCIONES)` : `${totalComb} BOLETOS EN CAJA`}:
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
                    Vehículo 0 Km (${vehiclePrizeUsd.toLocaleString()} USD) +
                    Metálico (${cashPrizeUsd.toLocaleString()} USD)
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
                    <span>
                      a) Metálico (${cashPrizeUsd.toLocaleString()}): Retención
                      Caja (16%):
                    </span>
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
                      b) Vehículo (${vehiclePrizeUsd.toLocaleString()}): Entero
                      Ganador (16%):
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
                      Bs. {formatIntBs(totalFacialBs)}
                      <span className="text-[9px] font-normal ml-1 text-slate-700">
                        (${totalFacialUsd.toLocaleString()} USD)
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
                      PROTECCIÓN TRIBUTARIA TOTAL: La Taquilla tributa solo 2,5%
                      IAE sobre su comisión (LOCAPTEM). No acumula el vehículo como
                      ingreso y la Beneficencia del Táchira recibe su 5% en tiempo
                      real.
                    </span>
                  </div>
                </div>
              </div>
              <div className="thermal-edge-bottom" />
            </div>
          </div>
        </div>

        {/* Botón para Copiar Hash SHA-256 del Ticket */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleCopyHash}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>
              {copiedHash
                ? "✓ Hash SHA-256 Copiado al Portapapeles"
                : `Copiar Sello Criptográfico SHA-256 (${ticketSha256.slice(0, 16)}...)`}
            </span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODAL DE LIQUIDACIÓN Y RETENCIÓN IGF (MODELO 3 SENIAT)
      ==================================================================== */}
      {isPrizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Liquidación Tributaria 16% IGF • Comprobante Modelo 3</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrizeModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white text-slate-950 font-mono p-4 rounded-xl text-[11px] leading-relaxed space-y-2 shadow-inner">
              <div className="text-center font-extrabold text-xs border-b border-slate-300 pb-1">
                REPÚBLICA BOLIVARIANA DE VENEZUELA • SENIAT
                <div className="text-[10px] font-normal text-slate-700">
                  COMPROBANTE DE RETENCIÓN DE IMPUESTO A LAS GANANCIAS FORTUITAS
                </div>
                <div className="text-[9.5px] font-bold text-purple-900">
                  MODELO 3 • ART. 18 PROVIDENCIA SNAT/2026/00093
                </div>
              </div>

              <div className="space-y-1 text-[10px]">
                <div>
                  <strong>Agente de Retención:</strong> Operadora de Rifas y
                  Loterías C.A.
                </div>
                <div>
                  <strong>RIF Agente:</strong> J-98765432-1 |{" "}
                  <strong>RUNLOT:</strong> RUN-OP-987654
                </div>
                <div>
                  <strong>Beneficiario (Ganador):</strong> CI V-18.456.789 • Juan
                  Pérez
                </div>
                <div>
                  <strong>Boleto Ganador:</strong> RIF-000748 (Serie {seriesName}
                  ) • {config.lotteryDrawReference}
                </div>
                <div>
                  <strong>Concepto:</strong> 077 - Ganancias Fortuitas en Especie
                  y Metálico
                </div>
                <div>
                  <strong>Bien Adjudicado:</strong> {config.vehicleName} (Serial
                  NIV: 8AJ765432109)
                </div>
                <div>
                  <strong>Base Imponible Total:</strong> Bs.{" "}
                  {formatBs(totalPrizesBs, 2)} (${totalPrizesUsd.toLocaleString()}{" "}
                  USD)
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>1. Metálico ($1.000): Retención en Caja (16%):</span>
                    <strong className="text-rose-700">
                      -Bs. {formatBs(cashIgf16Bs, 2)} (-${cashIgf16Usd} USD)
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold pl-2">
                    <span>→ Neto en Efectivo Entregado (84%):</span>
                    <span>
                      Bs. {formatBs(cashNetPaidBs, 2)} (${cashNetPaidUsd} USD)
                    </span>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>
                      2. Vehículo ($7.000): Entero Previo Ganador (16%):
                    </span>
                    <strong className="text-amber-800">
                      Bs. {formatBs(vehicleIgf16Bs, 2)} (${vehicleIgf16Usd} USD)
                    </strong>
                  </div>
                  <div className="text-[9px] text-slate-600 pl-2">
                    * Enterado ante la Operadora para adjudicar factura de concesionario y placas.
                  </div>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1 text-purple-900">
                  <span>TOTAL RETENCIÓN 16% IGF:</span>
                  <span>
                    -Bs. {formatBs(totalIgf16Bs, 2)} (-$
                    {totalIgf16Usd.toLocaleString()} USD)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
                <span>Certificado CIV #241.890 (SUSCERTE)</span>
                <span>Firma Telemática SCFD</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrizeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
