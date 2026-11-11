"use client";

import React, { useState, useMemo } from "react";
import {
  RaffleModalityId,
  RAFFLE_MODALITIES,
  RecordedRaffleTicket,
} from "@/types/simulator";
import { formatBs, generateDeterministicSha256 } from "@/lib/cryptoUtils";
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
} from "lucide-react";

interface Module1RifasPOSProps {
  onEmitRaffleTicket?: (ticket: RecordedRaffleTicket) => void;
  emittedRaffleTickets?: RecordedRaffleTicket[];
  onGoToCalculator?: () => void;
  onGoToIGF?: () => void;
}

export const Module1RifasPOS: React.FC<Module1RifasPOSProps> = ({
  onEmitRaffleTicket,
  emittedRaffleTickets = [],
  onGoToCalculator,
  onGoToIGF,
}) => {
  // Modalidad seleccionada (Opción A o B)
  const [activeRaffleId, setActiveRaffleId] =
    useState<RaffleModalityId>("rifa_triples_1000");

  const config = RAFFLE_MODALITIES[activeRaffleId];

  // Parámetros interactivos editables
  const [bcvRate, setBcvRate] = useState<number>(40);
  const [ticketPriceUsd, setTicketPriceUsd] = useState<number>(
    config.defaultTicketPriceUsd
  );
  const [cashPrizeUsd, setCashPrizeUsd] = useState<number>(
    config.defaultCashPrizeUsd
  );
  const [selectedNumber, setSelectedNumber] = useState<string>("748");
  const [seriesName, setSeriesName] = useState<string>("A");

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
  const prizePayoutPercentage =
    totalEmissionUsd > 0 ? (totalPrizesUsd / totalEmissionUsd) * 100 : 0;

  // Boletos vendidos según el control deslizante
  const soldCount = Math.round((config.totalNumbers * soldPercentage) / 100);
  const unsoldCount = config.totalNumbers - soldCount;
  const actualSalesUsd = soldCount * ticketPriceUsd;
  const actualSalesBs = actualSalesUsd * bcvRate;

  // Hash SHA-256 determinístico del ticket en pantalla
  const ticketSha256 = useMemo(() => {
    return generateDeterministicSha256(
      `RIFA-${activeRaffleId}-${seriesName}-${selectedNumber}-${ticketPriceBs}-${vehiclePrizeBs}-${cashPrizeBs}`
    );
  }, [
    activeRaffleId,
    seriesName,
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

  // Emisión formal en taquilla
  const handleEmitTicket = () => {
    const ticketRecord: RecordedRaffleTicket = {
      ticketNumber: `RIF-${String(emittedRaffleTickets.length + 1).padStart(6, "0")}`,
      series: seriesName,
      selectedNumber: selectedNumber.padStart(
        activeRaffleId === "rifa_triples_1000" ? 3 : 4,
        "0"
      ),
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

  const handleCopyHash = () => {
    navigator.clipboard.writeText(ticketSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

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
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Tasa Oficial BCV:</span>{" "}
              <strong className="text-emerald-400">
                Bs. {formatBs(bcvRate, 2)} / USD
              </strong>
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
              Amarrada formalmente al sorteo oficial de las 16:30 hrs de la Lotería del Táchira. Tiraje cerrado y verificable de 1.000 combinaciones.
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
              Emisión de 10.000 boletos vinculada al juego Súper Gana de la Lotería del Táchira. Ideal para sorteos masivos de escala estadal y nacional.
            </div>
          </button>
        </div>
      </div>

      {/* ====================================================================
          GRID PRINCIPAL: PANEL DE CONTROL DE LA RIFA (IZQ) VS TICKETS (DER)
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ====================================================================
            PANEL IZQUIERDO: CONFIGURACIÓN Y SIMULADOR DE TRABA (COL-7)
        ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Datos de Emisión y Precio del Boleto */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    1. Configuración de Emisión y Precio del Boleto
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {config.numberRangeLabel} • Sorteo: {config.lotteryDrawReference}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
                Serie {seriesName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                  Precio Unitario Boleto:
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={ticketPriceUsd}
                    onChange={(e) =>
                      setTicketPriceUsd(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <span className="block text-[10px] font-mono text-emerald-400 mt-0.5">
                  = Bs. {formatBs(ticketPriceBs, 2)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                  Tasa Oficial BCV (Bs./USD):
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={bcvRate}
                  onChange={(e) => setBcvRate(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
                <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                  Factor de conversión
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                  Número a Jugar en Caja:
                </label>
                <input
                  type="text"
                  maxLength={activeRaffleId === "rifa_triples_1000" ? 3 : 4}
                  value={selectedNumber}
                  onChange={(e) =>
                    setSelectedNumber(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-extrabold text-base text-center tracking-widest focus:border-amber-500 focus:outline-none"
                  placeholder={activeRaffleId === "rifa_triples_1000" ? "000" : "0000"}
                />
                <span className="block text-[10px] font-mono text-slate-400 text-center mt-0.5">
                  Número asignado en ticket
                </span>
              </div>
            </div>

            {/* Barra Resumen de la Emisión Total */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Tiraje Total Autorizado ({config.totalNumbers.toLocaleString()} boletos):
              </span>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">
                  ${totalEmissionUsd.toLocaleString()} USD
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  Bs. {formatBs(totalEmissionBs, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Configuración de Premios (Vehículo 70% + $1.000 Metálico) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    2. Plan de Premios: Especie (70%) + Metálico ($1.000)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Art. 14 y Art. 21 de la Providencia CONALOT/P/2025-001
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                Retorno: {prizePayoutPercentage.toFixed(1)}% de Emisión
              </span>
            </div>

            {/* Premio Principal en Especie: Vehículo 0 Km (70% del Tiraje) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Car className="w-5 h-5 text-amber-400" />
                  <span>Premio Principal en Especie: {config.vehicleName}</span>
                </div>
                <span className="text-xs font-mono font-extrabold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/40">
                  70% del Tiraje (70 de 100)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Valor comercial de factura original según Art. 14 de la Providencia:
                la Operadora garantiza el vehículo 0 Km nuevo de concesionario, con certificado de origen, serial NIV y placa de circulación.
              </p>
              <div className="pt-2 border-t border-amber-900/40 flex flex-wrap items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Valor Comercial Factura:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold">
                    ${vehiclePrizeUsd.toLocaleString()} USD
                  </span>
                  <span className="text-amber-400 font-extrabold">
                    (Bs. {formatBs(vehiclePrizeBs, 2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Box Configurable de Premios Secundarios en Metálico ($1.000 USD) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Premios Secundarios en Metálico (Aproximaciones / Terminales)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Efectivo en Taquilla
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 font-semibold mb-1">
                    Monto Metálico Total (USD):
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={cashPrizeUsd}
                      onChange={(e) =>
                        setCashPrizeUsd(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Equivalente en Bs.:</span>
                    <strong className="text-white">Bs. {formatBs(cashPrizeBs, 2)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Retención 16% IGF:</span>
                    <span className="text-rose-400">-Bs. {formatBs(cashIgf16Bs, 2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-0.5">
                    <span>Neto a Entregar (84%):</span>
                    <span>Bs. {formatBs(cashNetPaidBs, 2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Simulador de Traba Operativa (Art. 20 y Art. 25 Providencia) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    3. Simulador de Traba Operativa (Art. 20 y Art. 25 Providencia)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cuórum de Venta Obligatorio (70%) y Contradicción de Repetición de Sorteos
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/30">
                Punto Crítico Regulatorio
              </span>
            </div>

            {/* Slider de % de Boletos Vendidos */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold">
                  Porcentaje de Boletos Vendidos:
                </span>
                <span
                  className={`text-sm font-black px-2.5 py-0.5 rounded ${
                    soldPercentage < 70
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {soldPercentage}% ({soldCount.toLocaleString()} de{" "}
                  {config.totalNumbers.toLocaleString()} boletos)
                </span>
              </div>

              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={soldPercentage}
                onChange={(e) => setSoldPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>50% (Colapso)</span>
                <span className="font-bold text-amber-400">70% Cuórum Mínimo (Art. 20)</span>
                <span>100% (Venta Total)</span>
              </div>
            </div>

            {/* ALERTA ARTÍCULO 20 (< 70% DE VENTA) */}
            {soldPercentage < 70 && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border-2 border-rose-500/70 text-rose-200 text-xs space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 font-extrabold text-sm text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>TRABA ART. 20: SUSPENSIÓN OBLIGATORIA DE LA RIFA</span>
                </div>
                <p className="leading-relaxed">
                  Al venderse solo el <strong>{soldPercentage}%</strong> (menos del 70%), el organizador está <strong>legalmente impedido</strong> de realizar el sorteo. Debe suspender la rifa y solicitar prórroga formal ante CONALOT con al menos <strong>15 días continuos de anticipación</strong>. Si CONALOT no responde o niega la prórroga, el organizador debe devolver el dinero a cada comprador, perdiendo el 7% anticipado ya cobrado por CONALOT (Art. 28).
                </p>
              </div>
            )}

            {/* BOTÓN Y SIMULADOR DE CONTRADICCIÓN DEL ARTÍCULO 25 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Simular Extracción de Sorteo de Lotería del Táchira</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Verifica si el número favorecido cayó en boletos vendidos o no vendidos
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateDraw}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🎲 Extraer Número Sorteo</span>
                </button>
              </div>

              {simulatedDrawnNumber !== null && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-300">Número Extraído en Táchira:</span>
                    <strong className="text-lg font-black text-amber-300 tracking-wider">
                      {simulatedDrawnNumber}
                    </strong>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isDrawnSold
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {isDrawnSold ? "✓ BOLETO VENDIDO" : "✗ BOLETO NO VENDIDO"}
                    </span>
                  </div>

                  {!isDrawnSold && (
                    <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>CONTRADICCIÓN TÉCNICA DEL ARTÍCULO 25:</span>
                      </div>
                      <p>
                        El número <strong>{simulatedDrawnNumber}</strong> está entre los <strong>{unsoldCount.toLocaleString()}</strong> boletos no vendidos. El Art. 25 de la Providencia 2025-001 obliga a <em>«repetir el sorteo el mismo día hábil hasta que haya un ganador»</em>.
                      </p>
                      <p className="text-amber-100 font-semibold">
                        ⚠️ <strong>Imposibilidad Física y Técnica:</strong> La rifa usa el sorteo oficial de la Lotería del Táchira (Triple Táchira o Súper Gana), el cual solo rueda <strong>UNA VEZ AL DÍA</strong> según Gaceta Oficial. El organizador NO puede obligar a la Lotería del Táchira a volver a encender sus esferas de sorteo el mismo día. La norma fue redactada sin considerar la realidad de los sorteos de lotería.
                      </p>
                    </div>
                  )}

                  {isDrawnSold && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        ¡Premio Adjudicado Exitosamente! El boleto <strong>{simulatedDrawnNumber}</strong> fue vendido. Procede la retención del 16% IGF y la entrega del vehículo 0 Km y el premio en metálico.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de Emitir Boleto en Caja */}
            <button
              type="button"
              onClick={handleEmitTicket}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>Emitir Boleto Térmico Oficial (Serie {seriesName} • No. {selectedNumber})</span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            PANEL DERECHO: TICKETS TÉRMICOS 80MM (FONDO BLANCO PURO) (COL-5)
        ==================================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="w-full max-w-[430px] flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                🎟️
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Boleto Térmico 80 mm (Providencia 2025-001)
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Arts. 32-33 SENIAT
            </span>
          </div>

          {/* Papel Térmico Físico Blanco Puro (#ffffff) */}
          <div className="w-full max-w-[430px] select-text shadow-2xl">
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

              {/* Encabezado Institucional de la Rifa */}
              <div className="text-center font-black text-[12px] tracking-tight !text-slate-950">
                OPERADORA DE RIFAS Y JUEGOS C.A.
              </div>
              <div className="text-center font-bold text-[10px] !text-slate-800">
                RIF: J-40897654-2 • CONCESIÓN OFICIAL
              </div>
              <div className="text-center text-[9.5px] !text-purple-900 font-bold mb-1">
                RUNLOT: RUN-RIF-2026-0042 • SOLVENCIA: SOLV-CONALOT-0089
              </div>

              {/* Badge de Recaudación Cuenta de Terceros */}
              <div
                className="w-full py-1 px-2 mb-2 text-center font-extrabold text-[10px] tracking-wide uppercase rounded border-2"
                style={{
                  backgroundColor: "#ecfdf5",
                  borderColor: "#059669",
                  color: "#065f46",
                }}
              >
                Recaudación por Cuenta de Terceros (Arts. 32-33)
              </div>

              {/* Punto de Venta Emisor */}
              <div className="border-b border-dashed !border-slate-300 pb-1.5 mb-1.5 text-[10px] !text-slate-900">
                <div className="flex justify-between">
                  <span>
                    <strong className="!text-slate-950">Punto Emisor:</strong> Centro Apuestas La Favorita
                  </span>
                  <span>
                    <strong className="!text-slate-950">Taquilla:</strong> 01
                  </span>
                </div>
                <div className="flex justify-between text-[9px] !text-slate-600">
                  <span>RUNLOT Punto: RUN-AG-0412</span>
                  <span>Fecha: 15/12/2026 14:30</span>
                </div>
              </div>

              {/* Datos de la Modalidad y Referencia Lotería del Táchira */}
              <div className="bg-slate-100 p-2 rounded mb-2 text-[10.5px] !text-slate-950 space-y-0.5">
                <div className="font-extrabold text-center text-purple-900">
                  {config.name}
                </div>
                <div className="text-[9.5px] text-center font-semibold !text-slate-700">
                  Sorteo de Referencia: {config.lotteryDrawReference}
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-slate-300">
                  <span>
                    <strong>Serie:</strong> {seriesName} (Art. 15)
                  </span>
                  <span>
                    <strong>Tiraje Total:</strong> {config.totalNumbers.toLocaleString()} boletos
                  </span>
                </div>
              </div>

              {/* NÚMERO JUGADO EN GRANDE */}
              <div className="text-center py-2.5 my-1.5 border-2 border-dashed !border-slate-800 rounded bg-slate-50">
                <div className="text-[9px] uppercase tracking-widest font-extrabold !text-slate-600">
                  NÚMERO ASIGNADO EN BOLETO
                </div>
                <div className="text-3xl font-black tracking-widest !text-slate-950 my-0.5">
                  {selectedNumber.padStart(
                    activeRaffleId === "rifa_triples_1000" ? 3 : 4,
                    "0"
                  )}
                </div>
                <div className="text-[10px] font-bold text-emerald-800">
                  VALOR BOLETO: Bs. {formatBs(ticketPriceBs, 2)} (${ticketPriceUsd} USD)
                </div>
              </div>

              {/* DETALLE DEL PLAN DE PREMIOS */}
              <div className="border-t border-b !border-slate-300 py-2 my-2 space-y-1.5 text-[10px]">
                <div className="font-extrabold uppercase !text-slate-900 text-center text-[10.5px]">
                  --- PLAN DE PREMIOS HOMOLOGADO ---
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold !text-slate-950">
                      1. PREMIO PRINCIPAL (ESPECIE):
                    </div>
                    <div className="text-[9px] !text-slate-600">
                      {config.vehicleName} (Factura Concesionario)
                    </div>
                  </div>
                  <strong className="!text-slate-950 text-right">
                    ${vehiclePrizeUsd.toLocaleString()} USD
                    <span className="block text-[8.5px] font-normal !text-slate-600">
                      (Bs. {formatBs(vehiclePrizeBs, 2)})
                    </span>
                  </strong>
                </div>

                <div className="flex justify-between items-start pt-1 border-t border-dotted !border-slate-300">
                  <div>
                    <div className="font-bold !text-slate-950">
                      2. PREMIOS SECUNDARIOS (METÁLICO):
                    </div>
                    <div className="text-[9px] !text-slate-600">
                      Aproximaciones / Terminales en Caja
                    </div>
                  </div>
                  <strong className="!text-slate-950 text-right">
                    ${cashPrizeUsd.toLocaleString()} USD
                    <span className="block text-[8.5px] font-normal !text-slate-600">
                      (Bs. {formatBs(cashPrizeBs, 2)})
                    </span>
                  </strong>
                </div>
              </div>

              {/* RETENCIÓN 16% IGF SENIAT (CONCEPTO 077) */}
              <div className="bg-slate-50 p-2 rounded border !border-slate-300 mb-2 space-y-1 text-[9.5px] !text-slate-900">
                <div className="font-extrabold uppercase text-center text-[10px] !text-slate-950">
                  LIQUIDACIÓN TRIBUTARIA 16% IGF (ART. 18 SENIAT)
                </div>
                <div className="flex justify-between">
                  <span>Premios Metálico: Retención en Caja (16%):</span>
                  <span className="font-bold text-rose-700">
                    -Bs. {formatBs(cashIgf16Bs, 2)} (-${cashIgf16Usd} USD)
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Neto a Pagar en Efectivo (84%):</span>
                  <span>Bs. {formatBs(cashNetPaidBs, 2)} (${cashNetPaidUsd} USD)</span>
                </div>
                <div className="pt-1 border-t border-slate-200 text-[9px] !text-slate-700 leading-snug">
                  * <strong>Premio en Especie (Vehículo):</strong> El ganador entera/deposita el 16% (Bs. {formatBs(vehicleIgf16Bs, 2)}) ante la Operadora para emitir Comprobante Modelo 3 y suscribir Acta de Entrega (Art. 25).
                </div>
              </div>

              {/* QR Y FIRMA CRIPTOGRÁFICA SCFD */}
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

              {/* Leyenda de descargo */}
              <div className="text-center text-[8px] !text-slate-500 pt-2 mt-2 border-t !border-slate-200">
                La Taquilla actúa exclusivamente como intermediario recaudador por cuenta de terceros. Toda reclamación de premios corresponde ante la Operadora autorizada por CONALOT.
              </div>
            </div>
            <div className="thermal-edge-bottom" />
          </div>

          {/* Botón para Copiar Hash SHA-256 del Ticket */}
          <button
            type="button"
            onClick={handleCopyHash}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>
              {copiedHash
                ? "✓ Hash SHA-256 Copiado al Portapapeles"
                : "Copiar Hash SHA-256 del Boleto"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
