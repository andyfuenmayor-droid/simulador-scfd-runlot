"use client";

import React, { useState } from "react";
import {
  BetPlay,
  GameModalityConfig,
  GameModalityId,
} from "@/types/simulator";
import { ThermalTickets } from "./ThermalTickets";
import { PrizeWithholdingModal } from "./PrizeWithholdingModal";
import {
  buildFullTirajePlays,
  formatBs,
  formatIntBs,
  getTotalCombinationsCount,
  isPlaysFullTiraje,
} from "@/lib/cryptoUtils";
import {
  Award,
  Coins,
  Layers,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

interface Module1POSProps {
  modalities: Record<GameModalityId, GameModalityConfig>;
  activeModalityId: GameModalityId;
  onSelectModality: (id: GameModalityId) => void;
  plays: BetPlay[];
  onUpdatePlays: (plays: BetPlay[]) => void;
  ticketNumber: string;
  drawNumber: string;
  dateTimeStr: string;
  sha256Hash: string;
  onEmitNewTicket: () => void;
  emittedTicketsCount: number;
  totalEmittedBs: number;
  onEmitWithholdingToSCFD: (data: {
    winnerId: string;
    winningPlay: BetPlay;
    grossPrize: number;
    igfWithheld: number;
    netPaid: number;
    certificateHash: string;
  }) => void;
}

export const Module1POS: React.FC<Module1POSProps> = ({
  modalities,
  activeModalityId,
  onSelectModality,
  plays,
  onUpdatePlays,
  ticketNumber,
  drawNumber,
  dateTimeStr,
  sha256Hash,
  onEmitNewTicket,
  emittedTicketsCount,
  totalEmittedBs,
  onEmitWithholdingToSCFD,
}) => {
  const modality = modalities[activeModalityId];
  const [newOption, setNewOption] = useState<string>(
    modality.catalogOptions[0] || ""
  );
  const [newAmount, setNewAmount] = useState<number>(
    activeModalityId === "animalitos" ? 100 : 50
  );
  const [tirajeUnitBet, setTirajeUnitBet] = useState<number>(1000);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState<boolean>(false);

  const handleModalitySwitch = (id: GameModalityId) => {
    onSelectModality(id);
    const nextMod = modalities[id];
    setNewOption(nextMod.catalogOptions[0] || "");
    setNewAmount(id === "animalitos" ? 100 : 50);
  };

  const handleAmountChange = (id: string, value: number) => {
    const safeVal = Math.max(1, Math.min(100000000, value || 0));
    onUpdatePlays(
      plays.map((p) => (p.id === id ? { ...p, amount: safeVal } : p))
    );
  };

  const handleOptionChange = (id: string, optionText: string) => {
    onUpdatePlays(
      plays.map((p) => (p.id === id ? { ...p, option: optionText } : p))
    );
  };

  const handleRemovePlay = (id: string) => {
    onUpdatePlays(plays.filter((p) => p.id !== id));
  };

  const handleClearAllPlays = () => {
    onUpdatePlays([]);
  };

  const handleAddPlay = (customOption?: string) => {
    const optToAdd = (customOption ?? newOption).trim();
    if (!optToAdd) return;
    const nextPlay: BetPlay = {
      id: `play-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      option: optToAdd,
      amount: Math.max(1, Number(newAmount) || 50),
      combinationsCount: 1,
    };
    onUpdatePlays([...plays, nextPlay]);
  };

  const handleResetDefaults = () => {
    onUpdatePlays(
      modality.defaultPlays.map((p) => ({
        ...p,
        id: `${p.id}-${Date.now()}`,
      }))
    );
  };

  const handleLoadFullTiraje = (customUnitBet?: number) => {
    const unitAmt = Math.max(1, customUnitBet ?? tirajeUnitBet);
    if (customUnitBet !== undefined) {
      setTirajeUnitBet(customUnitBet);
    }
    const fullPlays = buildFullTirajePlays(activeModalityId, unitAmt);
    onUpdatePlays(fullPlays);
  };

  const totalFacial = plays.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const fullTirajeActive = isPlaysFullTiraje(activeModalityId, plays);
  const totalComb = getTotalCombinationsCount(plays);
  const effectiveUnitBet =
    totalComb > 0 ? totalFacial / totalComb : Number(plays[0]?.amount) || 0;

  // En Tiraje Completo, exactamente 1 combinación gana (effectiveUnitBet * multiplier).
  const displayGrossPrize = fullTirajeActive
    ? effectiveUnitBet * modality.multiplier
    : plays.reduce(
        (acc, p) => acc + (Number(p.amount) || 0) * modality.multiplier,
        0
      );
  const totalIgf16 = displayGrossPrize * 0.16;
  const totalNetPrize = displayGrossPrize - totalIgf16;

  return (
    <div className="space-y-8">
      {/* ====================================================================
          BARRA SUPERIOR: SELECTOR DE MODALIDAD + TERMINAL POS INTERACTIVO
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selector de Modalidad de Juego (Sincronización Dinámica Total) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                1. Selector de Modalidad de Juego
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                  Sincronización Total
                </span>
              </div>
            </div>

            <div id="tour-pos-modalities" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Opción A: Animalitos */}
              <button
                type="button"
                onClick={() => handleModalitySwitch("animalitos")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  activeModalityId === "animalitos"
                    ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950/50"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Opción A
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    30x
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Sorteos de Figuras &ldquo;Animalitos&rdquo;
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>• Tiraje: <strong>38 figuras (01 al 38)</strong></div>
                  <div>• Premio: <strong>30x</strong> la apuesta</div>
                  <div>• Payout matemático (30/38): <strong>78,95%</strong></div>
                </div>
              </button>

              {/* Opción B: Triples y Terminales */}
              <button
                type="button"
                onClick={() => handleModalitySwitch("triples")}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  activeModalityId === "triples"
                    ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950/50"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Opción B
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    600x
                  </span>
                </div>
                <div className="font-bold text-sm leading-snug mb-1">
                  Triples y Terminales Tradicionales
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>• Tiraje: <strong>1.000 comb. (000 al 999)</strong></div>
                  <div>• Premio: <strong>600x</strong> la apuesta</div>
                  <div>• Payout estándar: <strong>60%</strong></div>
                </div>
              </button>
            </div>

            {/* Resumen de Parámetros Activos */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-center">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Multiplicador
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  {modality.multiplier}x
                </div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Payout / Tiraje
                </div>
                <div className="text-base font-extrabold text-blue-400">
                  {modality.standardPayoutPct}% ({modality.tirajeTotalOptions})
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">
                  Retención IGF
                </div>
                <div className="text-base font-extrabold text-amber-400">
                  16% (Art. 18)
                </div>
              </div>
            </div>

            {/* ==============================================================
                GENERADOR DE TIRAJE COMPLETO DEL SORTEO (01-38 / 000-999)
            ============================================================== */}
            <div id="tour-pos-tiraje" className="mt-4 p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-500/40 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Simular Tiraje Completo ({modality.tirajeRangeLabel})
                </span>
                {fullTirajeActive && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    TIRAJE ACTIVO
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    Apuesta c/u Bs.:
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={100}
                    value={tirajeUnitBet}
                    onChange={(e) =>
                      setTirajeUnitBet(
                        Math.max(1, parseFloat(e.target.value) || 0)
                      )
                    }
                    className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-extrabold shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadFullTiraje()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Cargar {modality.tirajeTotalOptions} Opciones
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-mono text-slate-600 dark:text-slate-400">
                <span>
                  Venta Tiraje: Bs.{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {formatBs(
                      tirajeUnitBet * modality.tirajeTotalOptions,
                      0
                    )}
                  </strong>
                </span>
                <span>
                  1 Ganador ({modality.multiplier}x): Bs.{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatBs(tirajeUnitBet * modality.multiplier, 0)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Ejecutivas: Emitir Ticket y Pagar Premio Art. 18 */}
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="tour-pos-emit-btn"
                type="button"
                onClick={onEmitNewTicket}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {fullTirajeActive
                  ? `Emitir Tiraje #${ticketNumber} a SCFD`
                  : `Emitir Ticket #${ticketNumber} a SCFD`}
              </button>
              <button
                id="tour-pos-prize-btn"
                type="button"
                onClick={() => setIsPrizeModalOpen(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Pagar Premio (Art. 18)
              </button>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">
                Tickets / Tirajes Emitidos en Caja:
              </span>
              <span className="font-bold text-emerald-400">
                {emittedTicketsCount}{" "}
                {emittedTicketsCount === 1 ? "Emitido" : "Emitidos"} (Bs.{" "}
                {formatBs(totalEmittedBs, 2)})
              </span>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Editor en Vivo de Jugadas de la Taquilla POS */}
        <div id="tour-pos-capture" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  2. Captura de Jugadas en Taquilla POS ({totalComb}{" "}
                  {totalComb === 1 ? "Opción" : "Opciones"} Activas)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 border border-emerald-500/40 transition-all shadow-sm"
                  title="Cargar las 2 jugadas de ejemplo por defecto de esta modalidad"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  Jugadas Ejemplo
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadFullTiraje()}
                  className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 transition-all shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Tiraje Completo ({modality.tirajeTotalOptions})
                </button>
                {plays.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPlays}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
                    title="Vaciar jugadas en pantalla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Jugadas Activas */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 mb-4">
              {plays.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Sin jugadas por defecto en taquilla (Bs. 0,00)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pulse el botón <strong className="text-blue-400">Tiraje Completo ({modality.tirajeTotalOptions})</strong> arriba o agregue jugadas manualmente.
                  </p>
                </div>
              ) : (
                plays.map((play, idx) => {
                  const combCount = play.combinationsCount || 1;
                  const unitBet =
                    combCount > 0
                      ? (Number(play.amount) || 0) / combCount
                      : Number(play.amount) || 0;
                  const gross = unitBet * modality.multiplier;
                  const igf = gross * 0.16;
                  const net = gross - igf;
                  return (
                    <div
                      key={play.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border ${
                        play.isFullTirajeSummary
                          ? "bg-blue-950/30 border-blue-500/40"
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
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-3 flex items-center gap-1">
                        <span className="text-xs text-slate-400 font-mono">Bs.</span>
                        <input
                          type="number"
                          min={1}
                          step={10}
                          value={play.amount}
                          onChange={(e) =>
                            handleAmountChange(
                              play.id,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="hidden sm:block sm:col-span-4 text-right font-mono text-[11px]">
                        <div className="text-slate-300">
                          Premio 1 Ganador: <strong>{formatIntBs(gross)}</strong> |{" "}
                          <span className="text-red-400">-{formatIntBs(igf)}</span>
                        </div>
                        <div className="text-emerald-400 font-bold">
                          Neto: Bs. {formatIntBs(net)}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePlay(play.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Eliminar jugada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Agregar Nueva Jugada + Catálogo Rápido */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                >
                  {modality.catalogOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">Monto Bs.</span>
                  <input
                    type="number"
                    min={1}
                    step={10}
                    value={newAmount}
                    onChange={(e) =>
                      setNewAmount(parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddPlay()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Jugada
                </button>
              </div>

              {/* Botones rápidos de opciones */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mr-1">
                  Clic Rápido:
                </span>
                {modality.catalogOptions.slice(0, 6).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAddPlay(opt)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barra Resumen de Liquidación en Tiempo Real */}
          <div id="tour-pos-summary" className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                Total Captado ({totalComb} Opc.)
              </div>
              <div className="font-mono font-extrabold text-sm text-white">
                Bs. {formatBs(totalFacial, 2)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                {fullTirajeActive
                  ? `1 Premio Ganador (${modality.multiplier}x)`
                  : `Premio Bruto (${modality.multiplier}x)`}
              </div>
              <div className="font-mono font-extrabold text-sm text-blue-400">
                Bs. {formatIntBs(displayGrossPrize)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                Retención IGF (16%)
              </div>
              <div className="font-mono font-extrabold text-sm text-red-400">
                -Bs. {formatIntBs(totalIgf16)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                Neto a Pagar Ganador
              </div>
              <div className="font-mono font-extrabold text-sm text-emerald-400">
                Bs. {formatIntBs(totalNetPrize)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          VISTA COMPARATIVA LADO A LADO DE TICKETS DE 80 MM (MODELO 1 vs MODELO 2)
      ==================================================================== */}
      <div id="tour-pos-tickets" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              Contraste Técnico Físico en Papel Térmico de 80 mm (Ancho 48 Columnas)
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Comparativa en Vivo: Factura Rígida (Art. 30.2) vs. Ticket Simplificado Cuenta de Terceros (Arts. 32-33)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsPrizeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 self-start md:self-auto transition-all"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            Abrir Modelo 3: Comprobante de Retención (Art. 18)
          </button>
        </div>

        <ThermalTickets
          modality={modality}
          plays={plays}
          ticketNumber={ticketNumber}
          drawNumber={drawNumber}
          dateTimeStr={dateTimeStr}
          sha256Hash={sha256Hash}
        />
      </div>

      {/* Modal Modelo 3: Liquidación y Retención de Premios (Art. 18) */}
      <PrizeWithholdingModal
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        modality={modality}
        plays={plays}
        ticketNumber={ticketNumber}
        drawNumber={drawNumber}
        dateTimeStr={dateTimeStr}
        onEmitWithholdingToSCFD={onEmitWithholdingToSCFD}
      />
    </div>
  );
};
