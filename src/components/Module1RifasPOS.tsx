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
  ThermalTicketsRifas,
  RafflePlayItem,
} from "./ThermalTicketsRifas";
import {
  AlertTriangle,
  Award,
  Car,
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
  Zap,
} from "lucide-react";

interface Module1RifasPOSProps {
  onEmitRaffleTicket?: (ticket: RecordedRaffleTicket) => void;
  onClearRaffleTickets?: () => void;
  emittedRaffleTickets?: RecordedRaffleTicket[];
  onGoToCalculator?: () => void;
  onGoToIGF?: () => void;
}

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
        option: `SERIE 003 AL 9997 (9.995 BOLETOS)`,
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

// Generador de jugadas de ejemplo por defecto
const buildDefaultPlays = (
  modalityId: RaffleModalityId,
  unitUsd: number,
  rate: number
): RafflePlayItem[] => {
  const is3 = modalityId === "rifa_triples_1000";
  const tag = is3 ? "Triple Táchira" : "Súper Gana";
  const priceBs = unitUsd * rate;

  if (is3) {
    return [
      {
        id: "r1",
        number: "748",
        option: `748 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r2",
        number: "123",
        option: `123 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r3",
        number: "050",
        option: `050 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r4",
        number: "999",
        option: `999 ${tag}`,
        amountUsd: unitUsd,
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
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r2",
        number: "0123",
        option: `0123 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r3",
        number: "8890",
        option: `8890 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
      {
        id: "r4",
        number: "9999",
        option: `9999 ${tag}`,
        amountUsd: unitUsd,
        amountBs: priceBs,
        combinationsCount: 1,
      },
    ];
  }
};

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

  // Tasa BCV Oficial
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

  // Precios por modalidad: 1.000 números en $30 y 10.000 números en $5
  const [unitPriceByModality, setUnitPriceByModality] = useState<
    Record<RaffleModalityId, number>
  >({
    rifa_triples_1000: 30,
    rifa_supergana_10000: 5,
  });

  // Jugadas cargadas por defecto para AMBAS modalidades con TIRAJE COMPLETO
  const [playsByModality, setPlaysByModality] = useState<
    Record<RaffleModalityId, RafflePlayItem[]>
  >(() => ({
    rifa_triples_1000: buildFullTirajePlaysList("rifa_triples_1000", 30, 904.45),
    rifa_supergana_10000: buildFullTirajePlaysList(
      "rifa_supergana_10000",
      5,
      904.45
    ),
  }));

  // Sincronizar montos en Bs cuando cambia la tasa BCV
  useEffect(() => {
    setPlaysByModality((prev) => ({
      rifa_triples_1000: prev.rifa_triples_1000.map((p) => ({
        ...p,
        amountBs: p.amountUsd * bcvRate,
      })),
      rifa_supergana_10000: prev.rifa_supergana_10000.map((p) => ({
        ...p,
        amountBs: p.amountUsd * bcvRate,
      })),
    }));
  }, [bcvRate]);

  // Modalidad activa
  const config = RAFFLE_MODALITIES[activeRaffleId];
  const is3Digits = activeRaffleId === "rifa_triples_1000";
  const drawShortTag = is3Digits ? "Triple Táchira" : "Súper Gana";
  const currentUnitUsd = unitPriceByModality[activeRaffleId];
  const currentPlays = playsByModality[activeRaffleId];

  // Entrada rápida de nuevo boleto individual
  const [seriesName, setSeriesName] = useState<string>("A");
  const [newBoletoNum, setNewBoletoNum] = useState<string>("748");
  const [newBoletoUsd, setNewBoletoUsd] = useState<number>(30);

  // Alternador para ver ambos tickets impresos en el rollo de 80 mm
  const [showBothTickets, setShowBothTickets] = useState<boolean>(true);

  // Modal de Retención Modelo 3 SENIAT
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState<boolean>(false);

  // Simulador de Traba Operativa (Arts. 20 y 25 Providencia CONALOT/P/2025-001)
  const [soldPercentage, setSoldPercentage] = useState<number>(85);
  const [simulatedDrawnNumber, setSimulatedDrawnNumber] = useState<
    string | null
  >(null);
  const [isDrawnSold, setIsDrawnSold] = useState<boolean | null>(null);

  // Selección de modalidad
  const handleSelectModality = (id: RaffleModalityId) => {
    setActiveRaffleId(id);
    const unitPrice = unitPriceByModality[id];
    setNewBoletoUsd(unitPrice);
    setNewBoletoNum(id === "rifa_triples_1000" ? "748" : "4512");
    setSimulatedDrawnNumber(null);
    setIsDrawnSold(null);
  };

  // Cambio de precio unitario del tiraje activo
  const handleUnitPriceChange = (valUsd: number) => {
    const safeUsd = Math.max(1, valUsd || 0);
    setUnitPriceByModality((prev) => ({
      ...prev,
      [activeRaffleId]: safeUsd,
    }));
    // Si tiene tiraje completo, actualizar la lista
    setPlaysByModality((prev) => {
      const active = prev[activeRaffleId];
      const isFull = active.some((p) => p.isFullTirajeSummary);
      if (isFull) {
        return {
          ...prev,
          [activeRaffleId]: buildFullTirajePlaysList(
            activeRaffleId,
            safeUsd,
            bcvRate
          ),
        };
      }
      return prev;
    });
  };

  // Cargar Tiraje Completo
  const handleLoadFullTiraje = () => {
    const unit = unitPriceByModality[activeRaffleId];
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: buildFullTirajePlaysList(activeRaffleId, unit, bcvRate),
    }));
  };

  // Cargar Boletos Ejemplo
  const handleLoadExamplePlays = () => {
    const unit = unitPriceByModality[activeRaffleId];
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: buildDefaultPlays(activeRaffleId, unit, bcvRate),
    }));
  };

  // Vaciar jugadas
  const handleClearAllPlays = () => {
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: [],
    }));
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
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: [item, ...prev[activeRaffleId]],
    }));
  };

  const handleRemovePlay = (id: string) => {
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: prev[activeRaffleId].filter((p) => p.id !== id),
    }));
  };

  const handleOptionChange = (id: string, text: string) => {
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: prev[activeRaffleId].map((p) =>
        p.id === id ? { ...p, option: text } : p
      ),
    }));
  };

  const handleAmountChange = (id: string, usdVal: number) => {
    const safeUsd = Math.max(1, usdVal || 0);
    setPlaysByModality((prev) => ({
      ...prev,
      [activeRaffleId]: prev[activeRaffleId].map((p) =>
        p.id === id
          ? {
              ...p,
              amountUsd: safeUsd,
              amountBs: safeUsd * bcvRate,
            }
          : p
      ),
    }));
  };

  // Totales de la modalidad activa
  const totalComb = currentPlays.reduce(
    (acc, p) => acc + (p.combinationsCount || 1),
    0
  );
  const totalFacialUsd = currentPlays.reduce(
    (acc, p) => acc + (p.amountUsd || 0),
    0
  );
  const totalFacialBs = totalFacialUsd * bcvRate;

  const isFullTirajeActive =
    currentPlays.some((p) => p.isFullTirajeSummary) ||
    totalComb >= config.totalNumbers;

  // Emisión Oficial Autorizada Modalidad Activa
  const totalEmissionUsd = config.totalNumbers * currentUnitUsd;
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

  // Simulador de Traba Operativa (Arts. 20 y 25)
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

  // Cálculos Consolidados de AMBAS modalidades
  const tripPlays = playsByModality.rifa_triples_1000;
  const superPlays = playsByModality.rifa_supergana_10000;

  const tripFacialUsd = tripPlays.reduce((a, b) => a + (b.amountUsd || 0), 0);
  const tripFacialBs = tripFacialUsd * bcvRate;
  const tripPrizesUsd = tripFacialUsd * 0.7 + 1000;
  const tripPrizesBs = tripPrizesUsd * bcvRate;
  const tripIgf16Usd = tripPrizesUsd * 0.16;
  const tripIgf16Bs = tripIgf16Usd * bcvRate;
  const tripNetUsd = tripPrizesUsd - tripIgf16Usd;
  const tripNetBs = tripNetUsd * bcvRate;

  const superFacialUsd = superPlays.reduce((a, b) => a + (b.amountUsd || 0), 0);
  const superFacialBs = superFacialUsd * bcvRate;
  const superPrizesUsd = superFacialUsd * 0.7 + 1000;
  const superPrizesBs = superPrizesUsd * bcvRate;
  const superIgf16Usd = superPrizesUsd * 0.16;
  const superIgf16Bs = superIgf16Usd * bcvRate;
  const superNetUsd = superPrizesUsd - superIgf16Usd;
  const superNetBs = superNetUsd * bcvRate;

  const combinedTotalFacialUsd = tripFacialUsd + superFacialUsd;
  const combinedTotalFacialBs = tripFacialBs + superFacialBs;
  const combinedPrizesUsd = tripPrizesUsd + superPrizesUsd;
  const combinedPrizesBs = tripPrizesBs + superPrizesBs;
  const combinedIgf16Usd = tripIgf16Usd + superIgf16Usd;
  const combinedIgf16Bs = tripIgf16Bs + superIgf16Bs;
  const combinedNetUsd = tripNetUsd + superNetUsd;
  const combinedNetBs = tripNetBs + superNetBs;

  // Hashes determinísticos de ambos tickets
  const tripHash = useMemo(
    () =>
      generateDeterministicSha256(
        `RIFA-TRIPLES-1000-${unitPriceByModality.rifa_triples_1000}-${tripFacialBs}-${bcvRate}`
      ),
    [unitPriceByModality.rifa_triples_1000, tripFacialBs, bcvRate]
  );

  const superHash = useMemo(
    () =>
      generateDeterministicSha256(
        `RIFA-SUPERGANA-10000-${unitPriceByModality.rifa_supergana_10000}-${superFacialBs}-${bcvRate}`
      ),
    [unitPriceByModality.rifa_supergana_10000, superFacialBs, bcvRate]
  );

  // Emisión a SCFD
  const ticketNumberStr = useMemo(() => {
    return String(emittedRaffleTickets.length + 1).padStart(6, "0");
  }, [emittedRaffleTickets.length]);

  const handleEmitToSCFD = () => {
    const isFull = isFullTirajeActive;
    const primaryNumber =
      currentPlays[0]?.number || (is3Digits ? "748" : "4512");

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
      ticketPriceUsd: currentUnitUsd,
      ticketPriceBs: currentUnitUsd * bcvRate,
      bcvRate,
      vehiclePrizeUsd,
      vehiclePrizeBs,
      cashPrizeUsd,
      cashPrizeBs,
      cashIgf16Usd,
      cashIgf16Bs,
      vehicleIgf16Usd,
      vehicleIgf16Bs,
      sha256Hash: is3Digits ? tripHash : superHash,
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
    return (
      acc +
      (t.isFullTiraje ? t.totalTirajeBs || t.ticketPriceBs : t.ticketPriceBs)
    );
  }, 0);

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
              {/* Opción A: Triples 1.000 a $30 */}
              <button
                type="button"
                onClick={() => handleSelectModality("rifa_triples_1000")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  activeRaffleId === "rifa_triples_1000"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Opción A
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    1.000 Núm • $30
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Rifa de Triples (3 Cifras)
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <div>• Tiraje: <strong>1.000 boletos (000 al 999)</strong></div>
                  <div>• Sorteo: <strong>Triple Táchira (16:30 hrs)</strong></div>
                  <div>
                    • Emisión: <strong>$30.000 USD</strong> (Bs.{" "}
                    {formatIntBs(30000 * bcvRate)})
                  </div>
                  <div>• Retorno: <strong>Vehículo ($21k) + Metálico ($1k)</strong></div>
                </div>
              </button>

              {/* Opción B: Rifa Menor 10.000 a $5 */}
              <button
                type="button"
                onClick={() => handleSelectModality("rifa_supergana_10000")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  activeRaffleId === "rifa_supergana_10000"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Opción B
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    10.000 Núm • $5
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Rifa Menor (4 Cifras)
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <div>• Tiraje: <strong>10.000 boletos (0000 al 9999)</strong></div>
                  <div>• Sorteo: <strong>Súper Gana (Lot. Táchira)</strong></div>
                  <div>
                    • Emisión: <strong>$50.000 USD</strong> (Bs.{" "}
                    {formatIntBs(50000 * bcvRate)})
                  </div>
                  <div>• Retorno: <strong>Vehículo ($35k) + Metálico ($1k)</strong></div>
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
                  {is3Digits ? "73.3% Emisión" : "72.0% Emisión"}
                </div>
                <div className="text-[9px] text-slate-500">
                  {is3Digits ? "$21k Vehíc + $1k Met" : "$35k Vehíc + $1k Met"}
                </div>
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
                    <RotateCcw
                      className={`w-2.5 h-2.5 ${
                        isFetchingBcv ? "animate-spin text-amber-400" : ""
                      }`}
                    />
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
                    value={currentUnitUsd}
                    onChange={(e) =>
                      handleUnitPriceChange(parseFloat(e.target.value) || 1)
                    }
                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-extrabold shadow-sm"
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    = Bs. {formatIntBs(currentUnitUsd * bcvRate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadFullTiraje}
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
                    Vehículo (${formatIntBs(vehiclePrizeUsd)}) + Metálico ($1.000)
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
                    -Bs. {formatIntBs(cashIgf16Bs)} (Metál) • -Bs.{" "}
                    {formatIntBs(vehicleIgf16Bs)} (Vehíc)
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
                  <span className="text-amber-400 font-bold">
                    70% Mínimo (Art. 20)
                  </span>
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
                  onClick={handleLoadExamplePlays}
                  className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 border border-emerald-500/40 transition-all shadow-sm cursor-pointer font-mono"
                  title="Cargar boletos de ejemplo por defecto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  Boletos Ejemplo
                </button>
                <button
                  type="button"
                  onClick={handleLoadFullTiraje}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 transition-all shadow-sm cursor-pointer font-mono"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Tiraje Completo ({config.totalNumbers.toLocaleString()})
                </button>
                {currentPlays.length > 0 && (
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
              {currentPlays.length === 0 ? (
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
                currentPlays.map((play, idx) => {
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

            {/* ==============================================================
                BARRA RESUMEN DE TOTAL CONSOLIDADO EN CAJA (AMBAS VENTAS DE RIFA)
                (EXACTAMENTE IGUAL A MODULE1POS.TSX)
            ============================================================== */}
            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <div className="text-[10.5px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2 flex flex-wrap items-center justify-between gap-1">
                <span>Total Consolidado en Caja (Ambas Ventas de Rifa • 11.000 Boletos)</span>
                <span className="text-purple-400 font-medium">
                  Triples 1.000 ($30): ${tripFacialUsd.toLocaleString()} + Rifa Menor 10.000 ($5): ${superFacialUsd.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-purple-400 dark:border-purple-500/40 shadow-sm">
                  <div className="text-[10px] text-purple-900 dark:text-purple-300 uppercase font-extrabold tracking-wider">
                    Total Captado (Ambas)
                  </div>
                  <div className="font-mono font-black text-base text-slate-950 dark:text-white mt-0.5">
                    Bs. {formatBs(combinedTotalFacialBs, 2)}
                  </div>
                  <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-mono font-bold mt-0.5">
                    ${combinedTotalFacialUsd.toLocaleString()} USD ($30k + $50k)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                    Premios Ganadores
                  </div>
                  <div className="font-mono font-black text-base text-purple-700 dark:text-purple-400 mt-0.5">
                    Bs. {formatIntBs(combinedPrizesBs)}
                  </div>
                  <div className="text-[9.5px] text-slate-600 dark:text-slate-500 font-mono font-bold mt-0.5">
                    ${combinedPrizesUsd.toLocaleString()} USD ($22k + $36k)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-slate-950 border-2 border-rose-300 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-rose-800 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                    Retención IGF (16% Art. 18)
                  </div>
                  <div className="font-mono font-black text-base text-rose-700 dark:text-red-400 mt-0.5">
                    -Bs. {formatIntBs(combinedIgf16Bs)}
                  </div>
                  <div className="text-[9.5px] text-rose-900 dark:text-slate-500 font-mono font-extrabold mt-0.5">
                    -${combinedIgf16Usd.toLocaleString()} USD (-$3.5k + -$5.7k)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-950 border-2 border-emerald-400 dark:border-emerald-500/40 shadow-sm">
                  <div className="text-[10px] text-emerald-900 dark:text-emerald-300 uppercase font-extrabold tracking-wider">
                    Neto Total Ganadores
                  </div>
                  <div className="font-mono font-black text-base text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Bs. {formatIntBs(combinedNetBs)}
                  </div>
                  <div className="text-[9.5px] text-emerald-900 dark:text-slate-400 font-mono font-extrabold mt-0.5">
                    ${combinedNetUsd.toLocaleString()} USD ($18.4k + $30.2k)
                  </div>
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              Contraste Técnico Físico en Papel Térmico de 80 mm (Ancho 48 Columnas)
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Boletos Térmicos 80 mm (Lado a Lado: Modelo Actual vs. Propuesta SCFD)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBothTickets(!showBothTickets)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showBothTickets
                  ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Alternar entre ver ambos tickets o solo el activo"
            >
              <Layers className="w-4 h-4" />
              {showBothTickets
                ? "Mostrando Ambos Tickets (Separados)"
                : "Ver Ambos Tickets (Triples 1.000 + Súper Gana 10.000)"}
            </button>
            <button
              type="button"
              onClick={() => setIsPrizeModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Abrir Modelo 3: Comprobante (Art. 18)</span>
            </button>
          </div>
        </div>

        {showBothTickets ? (
          <div className="space-y-12">
            {/* TICKET 1: RIFA DE TRIPLES (1.000 NÚMEROS • SORTEO TRIPLE TÁCHIRA @ $30 USD) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-sm">
                    🎲
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Ticket de Rifa de Triples (1.000 Números • 000 al 999)
                      {activeRaffleId === "rifa_triples_1000" ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          En Edición Activa
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700">
                          Cargado en Taquilla
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sorteo: Triple Táchira (16:30 hrs) • Precio Unitario: $30 USD • Emisión Total: $30.000 USD (Bs. {formatIntBs(30000 * bcvRate)})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">
                      Total Facial Autorizado:
                    </span>
                    <span className="font-mono font-extrabold text-sm text-purple-400">
                      Bs. {formatBs(tripFacialBs, 2)} ($30.000 USD)
                    </span>
                  </div>
                  {activeRaffleId !== "rifa_triples_1000" && (
                    <button
                      type="button"
                      onClick={() => handleSelectModality("rifa_triples_1000")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Editar en Taquilla
                    </button>
                  )}
                </div>
              </div>

              <ThermalTicketsRifas
                modality={RAFFLE_MODALITIES.rifa_triples_1000}
                plays={tripPlays}
                ticketNumber="TIRAJE-000001"
                series="A"
                dateTimeStr="15/12/2026 14:30:00"
                bcvRate={bcvRate}
                ticketPriceUsd={unitPriceByModality.rifa_triples_1000}
                sha256Hash={tripHash}
              />
            </div>

            {/* SEPARADOR VISUAL DE CORTE DE ROLLO TÉRMICO */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t-2 border-dashed border-slate-700/80"></div>
              <span className="flex-shrink mx-4 font-mono text-xs text-slate-400 bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 flex items-center gap-2 shadow-md">
                <span className="text-purple-400 text-sm">✂</span>
                <span className="font-bold text-slate-300">
                  Línea de Separación e Impresión Térmica Independiente de Rifa (80 mm)
                </span>
                <span className="text-purple-400 text-sm">✂</span>
              </span>
              <div className="flex-grow border-t-2 border-dashed border-slate-700/80"></div>
            </div>

            {/* TICKET 2: RIFA MENOR 4 CIFRAS (10.000 NÚMEROS • SORTEO SÚPER GANA @ $5 USD) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm">
                    🎟️
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Ticket de Rifa Menor (10.000 Números • 0000 al 9999)
                      {activeRaffleId === "rifa_supergana_10000" ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          En Edición Activa
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700">
                          Cargado en Taquilla
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sorteo: Súper Gana (Lot. Táchira) • Precio Unitario: $5 USD • Emisión Total: $50.000 USD (Bs. {formatIntBs(50000 * bcvRate)})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">
                      Total Facial Autorizado:
                    </span>
                    <span className="font-mono font-extrabold text-sm text-amber-400">
                      Bs. {formatBs(superFacialBs, 2)} ($50.000 USD)
                    </span>
                  </div>
                  {activeRaffleId !== "rifa_supergana_10000" && (
                    <button
                      type="button"
                      onClick={() => handleSelectModality("rifa_supergana_10000")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Editar en Taquilla
                    </button>
                  )}
                </div>
              </div>

              <ThermalTicketsRifas
                modality={RAFFLE_MODALITIES.rifa_supergana_10000}
                plays={superPlays}
                ticketNumber="TIRAJE-000002"
                series="A"
                dateTimeStr="15/12/2026 14:30:00"
                bcvRate={bcvRate}
                ticketPriceUsd={unitPriceByModality.rifa_supergana_10000}
                sha256Hash={superHash}
              />
            </div>
          </div>
        ) : (
          <ThermalTicketsRifas
            modality={config}
            plays={currentPlays}
            ticketNumber={ticketNumberStr}
            series={seriesName}
            dateTimeStr="15/12/2026 14:30:00"
            bcvRate={bcvRate}
            ticketPriceUsd={currentUnitUsd}
            sha256Hash={is3Digits ? tripHash : superHash}
          />
        )}
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
                  MODELO 3 • ARTÍCULO 18 PROVIDENCIA SNAT/2026/00093
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-200 pb-2">
                <div>
                  <strong className="text-slate-900">Agente de Retención:</strong>
                  <div>OPERADORA OFICIAL DE RIFAS C.A.</div>
                  <div className="text-slate-600">RIF: J-40897654-2</div>
                </div>
                <div>
                  <strong className="text-slate-900">Punto de Cobro:</strong>
                  <div>Centro Apuestas La Favorita (Taquilla 01)</div>
                  <div className="text-slate-600">RUNLOT: RUN-AG-0412</div>
                </div>
              </div>

              <div className="space-y-1 text-[10.5px]">
                <div className="flex justify-between">
                  <span>Modalidad de Rifa:</span>
                  <strong>{config.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sorteo de Referencia:</span>
                  <span>{config.lotteryDrawReference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Boleto Ganador:</span>
                  <strong className="text-purple-900">
                    #{is3Digits ? "748" : "4512"} (Serie A)
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>Premio en Especie ({config.vehicleName}):</span>
                  <strong>
                    ${vehiclePrizeUsd.toLocaleString()} USD (Bs.{" "}
                    {formatIntBs(vehiclePrizeBs)})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Premio en Metálico (Aproximación en Taquilla):</span>
                  <strong>
                    ${cashPrizeUsd.toLocaleString()} USD (Bs.{" "}
                    {formatIntBs(cashPrizeBs)})
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span>Base Imponible Total del Premio:</span>
                  <strong>
                    ${totalPrizesUsd.toLocaleString()} USD (Bs.{" "}
                    {formatIntBs(totalPrizesBs)})
                  </strong>
                </div>
                <div className="flex justify-between text-rose-700 font-extrabold">
                  <span>Total Retención 16% IGF (Art. 18 SENIAT):</span>
                  <span>
                    -${totalIgf16Usd.toLocaleString()} USD (-Bs.{" "}
                    {formatIntBs(totalIgf16Bs)})
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 font-black border-t-2 border-slate-900 pt-1 text-xs">
                  <span>Neto Efectivo + Especie Liberada:</span>
                  <span>
                    ${totalNetPrizeUsd.toLocaleString()} USD (Bs.{" "}
                    {formatIntBs(totalNetPrizeBs)})
                  </span>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 border border-slate-300 text-[9px] text-slate-700 leading-tight">
                <strong>Fundamento Legal:</strong> Retención practicada de conformidad
                con el Artículo 65 de la Ley de Impuesto sobre la Renta (LISLR), el
                Decreto 1.808 (Concepto 077) y el Artículo 18 de la Providencia
                SNAT/2026/00093. Se expide el presente comprobante a los fines de la
                declaración informativa mensual del contribuyente.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrizeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    "Comprobante Modelo 3 SENIAT descargado en formato homologado."
                  );
                  setIsPrizeModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Comprobante Modelo 3</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
