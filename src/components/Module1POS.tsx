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
  buildSCFDPayload,
  formatBs,
  formatIntBs,
  getTotalCombinationsCount,
  isPlaysFullTiraje,
} from "@/lib/cryptoUtils";
import {
  ArrowLeft,
  Award,
  Coins,
  Eye,
  Layers,
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
  playsByModality?: Record<GameModalityId, BetPlay[]>;
  onUpdatePlaysByModality?: (
    modalityId: GameModalityId,
    plays: BetPlay[]
  ) => void;
  timestampMs?: number;
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
  playsByModality,
  onUpdatePlaysByModality,
  timestampMs,
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
  const [tirajeUnitBet, setTirajeUnitBet] = useState<number>(1000);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState<boolean>(false);
  const [forceShowBoth, setForceShowBoth] = useState<boolean>(false);
  const [panelViewMode, setPanelViewMode] = useState<
    "ambas" | "triples" | "animalitos"
  >("ambas");

  // Jugadas activas por modalidad para permitir visualizar ambos tickets separados si existen jugadas en ambos
  const animalitosPlays =
    playsByModality?.animalitos && playsByModality.animalitos.length > 0
      ? playsByModality.animalitos
      : activeModalityId === "animalitos"
      ? plays
      : [];

  const triplesPlays =
    playsByModality?.triples && playsByModality.triples.length > 0
      ? playsByModality.triples
      : activeModalityId === "triples"
      ? plays
      : [];

  const hasAnimalitosPlays = animalitosPlays.length > 0;
  const hasTriplesPlays = triplesPlays.length > 0;
  const showBoth = (hasAnimalitosPlays && hasTriplesPlays) || forceShowBoth;

  // Secuencia e identificación SCFD para tickets separados e independientes
  const triplesTicketNumber =
    activeModalityId === "triples" ? ticketNumber : "00012345";
  const animalitosTicketNumber =
    activeModalityId === "animalitos" ? ticketNumber : "00012346";

  const animalitosPayload = buildSCFDPayload({
    ticketNumber: animalitosTicketNumber,
    drawNumber,
    modality: "animalitos",
    modalityName: modalities.animalitos.name,
    multiplier: modalities.animalitos.multiplier,
    plays: animalitosPlays,
    timestampMs: timestampMs || Date.now(),
  });
  const animalitosHash = String(
    animalitosPayload.hmac_sha256_signature || sha256Hash
  );

  const triplesPayload = buildSCFDPayload({
    ticketNumber: triplesTicketNumber,
    drawNumber,
    modality: "triples",
    modalityName: modalities.triples.name,
    multiplier: modalities.triples.multiplier,
    plays: triplesPlays,
    timestampMs: (timestampMs || Date.now()) + 1500,
  });
  const triplesHash = String(
    triplesPayload.hmac_sha256_signature || sha256Hash
  );

  // Cálculos matemáticos rigurosos para Animalitos (38 figuras)
  const animalitosFacial = animalitosPlays.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const animalitosFullTiraje = isPlaysFullTiraje("animalitos", animalitosPlays);
  const animalitosComb = getTotalCombinationsCount(animalitosPlays);
  const animalitosUnitBet =
    animalitosComb > 0
      ? animalitosFacial / animalitosComb
      : Number(animalitosPlays[0]?.amount) || 0;
  const animalitosGrossPrize = animalitosFullTiraje
    ? animalitosUnitBet * modalities.animalitos.multiplier
    : animalitosPlays.reduce(
        (acc, p) =>
          acc + (Number(p.amount) || 0) * modalities.animalitos.multiplier,
        0
      );
  const animalitosIgf16 = animalitosGrossPrize * 0.16;
  const animalitosNetPrize = animalitosGrossPrize - animalitosIgf16;

  // Cálculos matemáticos rigurosos para Triples (1.000 comb.)
  const triplesFacial = triplesPlays.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const triplesFullTiraje = isPlaysFullTiraje("triples", triplesPlays);
  const triplesComb = getTotalCombinationsCount(triplesPlays);
  const triplesUnitBet =
    triplesComb > 0
      ? triplesFacial / triplesComb
      : Number(triplesPlays[0]?.amount) || 0;
  const triplesGrossPrize = triplesFullTiraje
    ? triplesUnitBet * modalities.triples.multiplier
    : triplesPlays.reduce(
        (acc, p) =>
          acc + (Number(p.amount) || 0) * modalities.triples.multiplier,
        0
      );
  const triplesIgf16 = triplesGrossPrize * 0.16;
  const triplesNetPrize = triplesGrossPrize - triplesIgf16;

  // TOTALES COMBINADOS (AMBAS COMPRAS POR DEFECTO EN TAQUILLA):
  const combinedTotalFacial = animalitosFacial + triplesFacial;
  const combinedTotalComb = animalitosComb + triplesComb;
  const combinedGrossPrize = animalitosGrossPrize + triplesGrossPrize;
  const combinedIgf16 = animalitosIgf16 + triplesIgf16;
  const combinedNetPrize = animalitosNetPrize + triplesNetPrize;

  const fullTirajeActive =
    activeModalityId === "triples" ? triplesFullTiraje : animalitosFullTiraje;

  const handleUpdateModalityPlays = (
    targetModality: GameModalityId,
    newPlays: BetPlay[]
  ) => {
    if (onUpdatePlaysByModality) {
      onUpdatePlaysByModality(targetModality, newPlays);
    }
    if (targetModality === activeModalityId) {
      onUpdatePlays(newPlays);
    }
  };

  const handleModalitySwitch = (id: GameModalityId) => {
    onSelectModality(id);
  };

  const handleAmountChange = (
    targetModality: GameModalityId,
    id: string,
    value: number
  ) => {
    const safeVal = Math.max(1, Math.min(100000000, value || 0));
    const targetPlays =
      targetModality === "triples" ? triplesPlays : animalitosPlays;
    const updated = targetPlays.map((p) =>
      p.id === id ? { ...p, amount: safeVal } : p
    );
    handleUpdateModalityPlays(targetModality, updated);
  };

  const handleOptionChange = (
    targetModality: GameModalityId,
    id: string,
    optionText: string
  ) => {
    const targetPlays =
      targetModality === "triples" ? triplesPlays : animalitosPlays;
    const updated = targetPlays.map((p) =>
      p.id === id ? { ...p, option: optionText } : p
    );
    handleUpdateModalityPlays(targetModality, updated);
  };

  const handleRemovePlay = (targetModality: GameModalityId, id: string) => {
    const targetPlays =
      targetModality === "triples" ? triplesPlays : animalitosPlays;
    const updated = targetPlays.filter((p) => p.id !== id);
    handleUpdateModalityPlays(targetModality, updated);
  };

  const handleClearModalityPlays = (targetModality: GameModalityId) => {
    handleUpdateModalityPlays(targetModality, []);
  };

  const handleClearAllBoth = () => {
    handleUpdateModalityPlays("triples", []);
    handleUpdateModalityPlays("animalitos", []);
  };

  const handleResetDefaultsForModality = (targetModality: GameModalityId) => {
    const defPlays = modalities[targetModality].defaultPlays.map((p) => ({
      ...p,
      id: `${p.id}-${Date.now()}`,
    }));
    handleUpdateModalityPlays(targetModality, defPlays);
  };

  const handleReloadFullTirajesBoth = () => {
    const tripFull = buildFullTirajePlays("triples", 1000);
    const animFull = buildFullTirajePlays("animalitos", 1000);
    handleUpdateModalityPlays("triples", tripFull);
    handleUpdateModalityPlays("animalitos", animFull);
  };

  const handleLoadFullTiraje = (
    targetModality: GameModalityId = activeModalityId,
    customUnitBet?: number
  ) => {
    const unitAmt = Math.max(1, customUnitBet ?? tirajeUnitBet);
    if (customUnitBet !== undefined) {
      setTirajeUnitBet(unitAmt);
    }
    const fullPlays = buildFullTirajePlays(targetModality, unitAmt);
    handleUpdateModalityPlays(targetModality, fullPlays);
  };

  // Variables para la vista individual activa cuando no es "ambas"
  const currentViewPlays =
    panelViewMode === "triples"
      ? triplesPlays
      : panelViewMode === "animalitos"
      ? animalitosPlays
      : plays;

  const currentViewModalityId: GameModalityId =
    panelViewMode === "triples"
      ? "triples"
      : panelViewMode === "animalitos"
      ? "animalitos"
      : activeModalityId;

  const currentViewModality = modalities[currentViewModalityId];

  const currentViewFacial =
    panelViewMode === "triples"
      ? triplesFacial
      : panelViewMode === "animalitos"
      ? animalitosFacial
      : plays.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const currentViewFullTiraje =
    panelViewMode === "triples"
      ? triplesFullTiraje
      : panelViewMode === "animalitos"
      ? animalitosFullTiraje
      : isPlaysFullTiraje(activeModalityId, plays);

  const currentViewComb =
    panelViewMode === "triples"
      ? triplesComb
      : panelViewMode === "animalitos"
      ? animalitosComb
      : getTotalCombinationsCount(plays);

  const currentViewGross =
    panelViewMode === "triples"
      ? triplesGrossPrize
      : panelViewMode === "animalitos"
      ? animalitosGrossPrize
      : currentViewFullTiraje
      ? (currentViewComb > 0 ? currentViewFacial / currentViewComb : 0) *
        modality.multiplier
      : plays.reduce(
          (acc, p) => acc + (Number(p.amount) || 0) * modality.multiplier,
          0
        );

  const currentViewIgf = currentViewGross * 0.16;
  const currentViewNet = currentViewGross - currentViewIgf;

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
        <div
          id="tour-pos-capture"
          className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  2. Captura de Jugadas en Taquilla POS{" "}
                  {panelViewMode === "ambas" ? (
                    <span className="text-emerald-400 font-extrabold">
                      (2 Compras Cargadas • {combinedTotalComb} Opciones)
                    </span>
                  ) : panelViewMode === "triples" ? (
                    <span className="text-amber-400 font-extrabold">
                      (Triples • {triplesComb} Opciones)
                    </span>
                  ) : (
                    <span className="text-blue-400 font-extrabold">
                      (Animalitos • {animalitosComb} Opciones)
                    </span>
                  )}
                </h3>
              </div>

              {/* Selector de Vista: Ambas Compras (Por Defecto) / Triples / Animalitos */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPanelViewMode("ambas")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    panelViewMode === "ambas"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Ver ambas compras cargadas por defecto en taquilla"
                >
                  🧾 Ambas Compras (Bs. {formatIntBs(combinedTotalFacial)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelViewMode("triples");
                    onSelectModality("triples");
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    panelViewMode === "triples"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Ver y editar jugadas individuales de Triples"
                >
                  🎲 Triples (1.000)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelViewMode("animalitos");
                    onSelectModality("animalitos");
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    panelViewMode === "animalitos"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Ver y editar jugadas individuales de Animalitos"
                >
                  🐾 Animalitos (38)
                </button>
              </div>
            </div>

            {/* Barra de Acciones y Controles Contextuales */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {panelViewMode === "ambas" ? (
                <>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Tiraje dual precargado: Triples (1.000 comb.) + Animalitos (38 fig.)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReloadFullTirajesBoth}
                      className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
                      title="Recargar ambos tirajes completos a Bs. 1.000 cada combinación"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      Recargar Ambos Tirajes
                    </button>
                    {(animalitosPlays.length > 0 || triplesPlays.length > 0) && (
                      <button
                        type="button"
                        onClick={handleClearAllBoth}
                        className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
                        title="Vaciar ambas compras en taquilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Vaciar Taquilla
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPanelViewMode("ambas")}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver a Ambas Compras (Bs. {formatIntBs(combinedTotalFacial)})
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetDefaultsForModality(currentViewModalityId)}
                      className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
                      title={`Cargar las jugadas de ejemplo de ${currentViewModality.shortName}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      Jugadas Ejemplo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadFullTiraje(currentViewModalityId)}
                      className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 transition-all shadow-sm cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Tiraje Completo ({currentViewModality.tirajeTotalOptions})
                    </button>
                    {currentViewPlays.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearModalityPlays(currentViewModalityId)}
                        className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
                        title={`Vaciar jugadas de ${currentViewModality.shortName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Vaciar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* CUERPO DEL PANEL: VISTA COMBINADA AMBAS COMPRAS vs VISTA DE EDICIÓN INDIVIDUAL */}
            {panelViewMode === "ambas" ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 mb-4">
                {/* COMPRA #1: TRIPLES Y TERMINALES TRADICIONALES */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 hover:border-amber-500/60 transition-all space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                        🎲
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          Compra #1: Triples y Terminales Tradicionales
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Ticket #{triplesTicketNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Sorteo #{drawNumber} • Tiraje Completo (000 al 999 • {triplesComb} combinaciones)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPanelViewMode("triples");
                        onSelectModality("triples");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      ✏️ Ver / Editar Jugadas ({triplesComb})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/20 font-mono text-xs">
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Monto Facial</div>
                      <div className="font-extrabold text-amber-400 text-sm">
                        Bs. {formatBs(triplesFacial, 2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">1 Ganador (600x)</div>
                      <div className="font-extrabold text-blue-400 text-sm">
                        Bs. {formatIntBs(triplesGrossPrize)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">IGF 16% (Art. 18)</div>
                      <div className="font-extrabold text-red-400 text-sm">
                        -Bs. {formatIntBs(triplesIgf16)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Neto a Pagar</div>
                      <div className="font-extrabold text-emerald-400 text-sm">
                        Bs. {formatIntBs(triplesNetPrize)}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10.5px] font-mono text-slate-400 truncate bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60">
                    <span className="text-amber-400/80 font-semibold mr-1">Opciones:</span>
                    {triplesPlays.length > 0 ? (
                      triplesPlays.map((p) => `${p.option} (Bs. ${formatIntBs(Number(p.amount) || 0)})`).join(" • ")
                    ) : (
                      <span className="text-slate-500 italic">Sin jugadas cargadas</span>
                    )}
                  </div>
                </div>

                {/* COMPRA #2: SORTEOS DE ANIMALITOS */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/40 hover:border-blue-500/60 transition-all space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs">
                        🐾
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          Compra #2: Sorteos de Figuras &ldquo;Animalitos&rdquo;
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            Ticket #{animalitosTicketNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Sorteo #{drawNumber} • Tiraje Completo (01 al 38 • {animalitosComb} figuras)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPanelViewMode("animalitos");
                        onSelectModality("animalitos");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      ✏️ Ver / Editar Jugadas ({animalitosComb})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/20 font-mono text-xs">
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Monto Facial</div>
                      <div className="font-extrabold text-blue-400 text-sm">
                        Bs. {formatBs(animalitosFacial, 2)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">1 Ganador (30x)</div>
                      <div className="font-extrabold text-blue-400 text-sm">
                        Bs. {formatIntBs(animalitosGrossPrize)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">IGF 16% (Art. 18)</div>
                      <div className="font-extrabold text-red-400 text-sm">
                        -Bs. {formatIntBs(animalitosIgf16)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Neto a Pagar</div>
                      <div className="font-extrabold text-emerald-400 text-sm">
                        Bs. {formatIntBs(animalitosNetPrize)}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10.5px] font-mono text-slate-400 truncate bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60">
                    <span className="text-blue-400/80 font-semibold mr-1">Opciones:</span>
                    {animalitosPlays.length > 0 ? (
                      animalitosPlays.slice(0, 8).map((p) => `${p.option} (Bs. ${formatIntBs(Number(p.amount) || 0)})`).join(" • ") + (animalitosPlays.length > 8 ? ` • ... (+${animalitosPlays.length - 8} figuras)` : "")
                    ) : (
                      <span className="text-slate-500 italic">Sin jugadas cargadas</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* VISTA DE EDICIÓN DE JUGADAS INDIVIDUALES (TRIPLES O ANIMALITOS) */
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 mb-4">
                {currentViewPlays.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-2">
                    <div className="text-xs font-bold text-slate-300">
                      Sin jugadas en {currentViewModality.shortName} (Bs. 0,00)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pulse el botón <strong className="text-blue-400">Tiraje Completo ({currentViewModality.tirajeTotalOptions})</strong> o <strong className="text-emerald-400">Jugadas Ejemplo</strong> arriba para cargar opciones.
                    </p>
                  </div>
                ) : (
                  currentViewPlays.map((play, idx) => {
                    const combCount = play.combinationsCount || 1;
                    const unitBet =
                      combCount > 0
                        ? (Number(play.amount) || 0) / combCount
                        : Number(play.amount) || 0;
                    const gross = unitBet * currentViewModality.multiplier;
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
                              handleOptionChange(currentViewModalityId, play.id, e.target.value)
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
                                currentViewModalityId,
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
                            onClick={() => handleRemovePlay(currentViewModalityId, play.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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
            )}
          </div>

          {/* BARRA RESUMEN DE LIQUIDACIÓN EN TIEMPO REAL (TOTAL CAPTADO) */}
          <div
            id="tour-pos-summary"
            className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
          >
            {panelViewMode === "ambas" ? (
              <>
                <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/50 shadow-md shadow-blue-950/40">
                  <div className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">
                    Total Captado (Ambas • {combinedTotalComb} Opc.)
                  </div>
                  <div className="font-mono font-extrabold text-base text-white mt-0.5">
                    Bs. {formatBs(combinedTotalFacial, 2)}
                  </div>
                  <div className="text-[9.5px] text-blue-200/70 font-mono mt-0.5">
                    Triples: Bs. 1M + Anim: Bs. 38k
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Premios Ganadores (600x + 30x)
                  </div>
                  <div className="font-mono font-extrabold text-base text-blue-400 mt-0.5">
                    Bs. {formatIntBs(combinedGrossPrize)}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                    Bs. 600.000 + Bs. 30.000
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Retención IGF (16% Art. 18)
                  </div>
                  <div className="font-mono font-extrabold text-base text-red-400 mt-0.5">
                    -Bs. {formatIntBs(combinedIgf16)}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                    -Bs. 96.000 + -Bs. 4.800
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-sm">
                  <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
                    Neto Total a Pagar Ganadores
                  </div>
                  <div className="font-mono font-extrabold text-base text-emerald-400 mt-0.5">
                    Bs. {formatIntBs(combinedNetPrize)}
                  </div>
                  <div className="text-[9.5px] text-emerald-200/70 font-mono mt-0.5">
                    Bs. 504.000 + Bs. 25.200
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Total Captado ({currentViewComb} Opc.)
                  </div>
                  <div className="font-mono font-extrabold text-base text-white mt-0.5">
                    Bs. {formatBs(currentViewFacial, 2)}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                    {panelViewMode === "triples"
                      ? "Triples Tradicionales"
                      : "Sorteos Animalitos"}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {currentViewFullTiraje
                      ? `1 Premio Ganador (${currentViewModality.multiplier}x)`
                      : `Premio Bruto (${currentViewModality.multiplier}x)`}
                  </div>
                  <div className="font-mono font-extrabold text-base text-blue-400 mt-0.5">
                    Bs. {formatIntBs(currentViewGross)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Retención IGF (16%)
                  </div>
                  <div className="font-mono font-extrabold text-base text-red-400 mt-0.5">
                    -Bs. {formatIntBs(currentViewIgf)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Neto a Pagar Ganador
                  </div>
                  <div className="font-mono font-extrabold text-base text-emerald-400 mt-0.5">
                    Bs. {formatIntBs(currentViewNet)}
                  </div>
                </div>
              </>
            )}
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setForceShowBoth(!forceShowBoth)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showBoth
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Alternar entre ver ambos tickets (Triples y Animalitos) o solo el activo"
            >
              <Layers className="w-4 h-4" />
              {showBoth ? "Mostrando Ambos Tickets (Separados)" : "Ver Ambos Tickets (Triples + Animalitos)"}
            </button>
            <button
              type="button"
              onClick={() => setIsPrizeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 self-start md:self-auto transition-all"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              Abrir Modelo 3: Comprobante (Art. 18)
            </button>
          </div>
        </div>

        {showBoth ? (
          <div className="space-y-12">
            {/* TICKET 1: TRIPLES Y TERMINALES TRADICIONALES */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm">
                    🎲
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Ticket de Triples y Terminales Tradicionales
                      {activeModalityId === "triples" ? (
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
                      Sorteo #{drawNumber} • Modalidad: 3 Cifras (Multiplicador {modalities.triples.multiplier}x / Payout {modalities.triples.standardPayoutPct}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Total Facial Apostado:</span>
                    <span className="font-mono font-extrabold text-sm text-amber-400">
                      Bs. {formatBs(triplesPlays.reduce((a, b) => a + (Number(b.amount) || 0), 0), 2)}
                    </span>
                  </div>
                  {activeModalityId !== "triples" && (
                    <button
                      type="button"
                      onClick={() => onSelectModality("triples")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Editar en Taquilla
                    </button>
                  )}
                </div>
              </div>

              <ThermalTickets
                modality={modalities.triples}
                plays={triplesPlays}
                ticketNumber={triplesTicketNumber}
                drawNumber={drawNumber}
                dateTimeStr={dateTimeStr}
                sha256Hash={triplesHash}
              />
            </div>

            {/* SEPARADOR VISUAL DE CORTE DE ROLLO TÉRMICO */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t-2 border-dashed border-slate-700/80"></div>
              <span className="flex-shrink mx-4 font-mono text-xs text-slate-400 bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 flex items-center gap-2 shadow-md">
                <span className="text-amber-400 text-sm">✂</span>
                <span className="font-bold text-slate-300">Línea de Separación e Impresión Térmica Independiente (80 mm)</span>
                <span className="text-amber-400 text-sm">✂</span>
              </span>
              <div className="flex-grow border-t-2 border-dashed border-slate-700/80"></div>
            </div>

            {/* TICKET 2: SORTEOS DE FIGURAS ANIMALITOS */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-sm">
                    🐾
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Ticket de Sorteos de Figuras &ldquo;Animalitos&rdquo;
                      {activeModalityId === "animalitos" ? (
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
                      Sorteo #{drawNumber} • Modalidad: 38 Figuras (Multiplicador {modalities.animalitos.multiplier}x / Payout {modalities.animalitos.standardPayoutPct}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Total Facial Apostado:</span>
                    <span className="font-mono font-extrabold text-sm text-blue-400">
                      Bs. {formatBs(animalitosPlays.reduce((a, b) => a + (Number(b.amount) || 0), 0), 2)}
                    </span>
                  </div>
                  {activeModalityId !== "animalitos" && (
                    <button
                      type="button"
                      onClick={() => onSelectModality("animalitos")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Editar en Taquilla
                    </button>
                  )}
                </div>
              </div>

              <ThermalTickets
                modality={modalities.animalitos}
                plays={animalitosPlays}
                ticketNumber={animalitosTicketNumber}
                drawNumber={drawNumber}
                dateTimeStr={dateTimeStr}
                sha256Hash={animalitosHash}
              />
            </div>
          </div>
        ) : (
          <ThermalTickets
            modality={modality}
            plays={plays}
            ticketNumber={ticketNumber}
            drawNumber={drawNumber}
            dateTimeStr={dateTimeStr}
            sha256Hash={sha256Hash}
          />
        )}
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
