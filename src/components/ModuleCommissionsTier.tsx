"use client";

import React, { useState } from "react";
import {
  CommissionTierConfig,
  CommissionTierId,
} from "@/types/simulator";
import { formatBs } from "@/lib/cryptoUtils";
import {
  ChevronDown,
  ChevronUp,
  Sliders,
  Store,
  Layers,
  Sparkles,
  TrendingUp,
  Scale,
  Award,
  Building2,
  Landmark,
  Percent,
} from "lucide-react";

export const COMMISSION_TIERS: Record<
  "tramo1" | "tramo2" | "tramo3" | "tramo_master_34" | "tramo_comercializadora_25",
  CommissionTierConfig
> = {
  tramo_comercializadora_25: {
    id: "tramo_comercializadora_25",
    name: "Pacto Ejecutivo 25% Total (Spread Propio 5%)",
    label: "Pacto 25% (5% Diferencial)",
    rangeLabel: "Triples: 20% Taquilla / 5% Spread Comercializadora",
    minSales: 0,
    maxSales: null,
    taquillaCommPct: 20,
    spreadMasterPct: 5,
    description: "Comisión Operadora 25% (Bs. 250.000) − 20% Taquilla (Bs. 200.000) = Diferencial 5% (Bs. 50.000)",
  },
  tramo1: {
    id: "tramo1",
    name: "Tramo 1 (Agencias Estándar / Baja Facturación)",
    label: "Tramo 1: Estándar",
    rangeLabel: "Venta hasta Bs. 500.000,00",
    minSales: 0,
    maxSales: 500000,
    taquillaCommPct: 18,
    spreadMasterPct: 8,
    description: "Comisión Taquilla 18% | Spread Máster 8% (Total Red: 26%)",
  },
  tramo2: {
    id: "tramo2",
    name: "Tramo 2 (Agencias de Alto Rendimiento - Nivel CDAPUESTAS)",
    label: "Tramo 2: Alto Rendimiento",
    rangeLabel: "Venta de Bs. 500.001,00 a Bs. 2.000.000,00",
    minSales: 500001,
    maxSales: 2000000,
    taquillaCommPct: 20,
    spreadMasterPct: 10,
    description: "Comisión Taquilla 20% | Spread Máster 10% (Total Red: 30%)",
  },
  tramo3: {
    id: "tramo3",
    name: "Tramo 3 (Macro-Agencias / Franquicias Exclusivas)",
    label: "Tramo 3: Macro-Agencias",
    rangeLabel: "Venta superior a Bs. 2.000.000,00",
    minSales: 2000001,
    maxSales: null,
    taquillaCommPct: 22,
    spreadMasterPct: 12,
    description: "Comisión Taquilla 22% | Spread Máster 12% (Total Red: 34%)",
  },
  tramo_master_34: {
    id: "tramo_master_34",
    name: "Pacto Máster Comercializadora (Esquema Original Imagen)",
    label: "Pacto Máster: 14% Spread",
    rangeLabel: "Triples Venta Bs. 1.000.000,00",
    minSales: 0,
    maxSales: null,
    taquillaCommPct: 20,
    spreadMasterPct: 14,
    description: "Comisión Taquilla 20% | Spread Máster 14% (Total Red: 34% • Resultado Bs. 210.250,00 Triples)",
  },
};

interface ModuleCommissionsTierProps {
  selectedTier: CommissionTierId;
  taquillaPct: number;
  spreadPct: number;
  comercializadoraSharePct: number;
  operadoraSharePct: number;
  onSelectTier: (tierId: CommissionTierId) => void;
  onUpdateShares: (comercializadoraPct: number) => void;
  onUpdateCustomRates?: (taquilla: number, spread: number) => void;
  grossSales: number;
  netWinAmount: number;
  comercializadoraFinalCommTotal: number;
  comercializadoraNetWinShareAmount: number;
  comercializadoraTotalResult: number;
  operadoraSurplusReforma: number;
}

export const ModuleCommissionsTier: React.FC<ModuleCommissionsTierProps> = ({
  selectedTier,
  taquillaPct,
  spreadPct,
  comercializadoraSharePct,
  operadoraSharePct,
  onSelectTier,
  onUpdateShares,
  onUpdateCustomRates,
  grossSales,
  netWinAmount,
  comercializadoraFinalCommTotal,
  comercializadoraNetWinShareAmount,
  comercializadoraTotalResult,
  operadoraSurplusReforma,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    selectedTier === "custom"
  );

  const totalCommPct = taquillaPct + spreadPct;

  // Determinar en qué tramo califica el volumen de ventas actual
  const autoTierId: CommissionTierId =
    grossSales <= 500000
      ? "tramo1"
      : grossSales <= 2000000
      ? "tramo2"
      : "tramo3";

  const handleTierClick = (id: CommissionTierId) => {
    setIsCustomMode(false);
    onSelectTier(id);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdateShares(val);
  };

  const presetShares = [
    { label: "50% / 50% (Paritario)", comer: 50 },
    { label: "40% / 60% (Pro-Operadora)", comer: 40 },
    { label: "60% / 40% (Pro-Comercializadora)", comer: 60 },
    { label: "45% / 55%", comer: 45 },
    { label: "35% / 65%", comer: 35 },
  ];

  return (
    <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden transition-all">
      {/* BARRA DE ENCABEZADO COLAPSABLE */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-slate-950 hover:bg-slate-950/80 transition-all text-left border-b border-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                ⚙️ Configuración Dinámica: Escalas de Comisión por Volumen y Participación Net Win
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                En Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulador paramétrico de acuerdos comerciales y tramos de rentabilidad para la red CDAPUESTAS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-500/40 text-blue-300 font-bold">
              Taquilla: {taquillaPct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold">
              Spread: {spreadPct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold">
              Reparto: {comercializadoraSharePct}% / {operadoraSharePct}%
            </span>
          </div>

          <div className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            {isOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* CONTENIDO DESPLEGABLE */}
      {isOpen && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* SUB-ÁREA A: COMISIONES POR ESCALA (TIERS POR VOLUMEN) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    A. Escalas de Comisión por Volumen Facial (Tiers)
                  </h4>
                </div>
                <span className="text-[10.5px] font-mono text-slate-400">
                  Venta actual:{" "}
                  <strong className="text-emerald-400 font-bold">
                    Bs. {formatBs(grossSales, 2)}
                  </strong>
                </span>
              </div>

              {/* TARJETAS DE TRAMOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* TRAMO 1 */}
                <div
                  onClick={() => handleTierClick("tramo1")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTier === "tramo1"
                      ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                        {COMMISSION_TIERS.tramo1.label}
                      </span>
                      {autoTierId === "tramo1" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          Rango Activo
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-white">
                      Hasta Bs. 500k
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>
                        Taquilla:{" "}
                        <strong className="text-blue-400">
                          {COMMISSION_TIERS.tramo1.taquillaCommPct}%
                        </strong>
                      </div>
                      <div>
                        Spread Máster:{" "}
                        <strong className="text-amber-400">
                          {COMMISSION_TIERS.tramo1.spreadMasterPct}%
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-300 font-bold flex justify-between">
                    <span>Total Red:</span>
                    <span className="text-emerald-400">26% Total</span>
                  </div>
                </div>

                {/* TRAMO 2 (POR DEFECTO) */}
                <div
                  onClick={() => handleTierClick("tramo2")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTier === "tramo2"
                      ? "bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-300">
                        {COMMISSION_TIERS.tramo2.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        Nivel CDAPUESTAS
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white">
                      Bs. 500k a 2.000k
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>
                        Taquilla:{" "}
                        <strong className="text-blue-400">
                          {COMMISSION_TIERS.tramo2.taquillaCommPct}%
                        </strong>
                      </div>
                      <div>
                        Spread Máster:{" "}
                        <strong className="text-amber-400">
                          {COMMISSION_TIERS.tramo2.spreadMasterPct}%
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-300 font-bold flex justify-between">
                    <span>Total Red:</span>
                    <span className="text-emerald-400">30% Total</span>
                  </div>
                </div>

                {/* TRAMO 3 */}
                <div
                  onClick={() => handleTierClick("tramo3")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTier === "tramo3"
                      ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-purple-300">
                        {COMMISSION_TIERS.tramo3.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                        Exclusivo
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white">
                      Más de Bs. 2.000k
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>
                        Taquilla:{" "}
                        <strong className="text-blue-400">
                          {COMMISSION_TIERS.tramo3.taquillaCommPct}%
                        </strong>
                      </div>
                      <div>
                        Spread Máster:{" "}
                        <strong className="text-amber-400">
                          {COMMISSION_TIERS.tramo3.spreadMasterPct}%
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-300 font-bold flex justify-between">
                    <span>Total Red:</span>
                    <span className="text-emerald-400">34% Total</span>
                  </div>
                </div>

                {/* TRAMO 4: PACTO MÁSTER HISTÓRICO (REF. IMAGEN) */}
                <div
                  onClick={() => handleTierClick("tramo_master_34")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTier === "tramo_master_34"
                      ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-300">
                        {COMMISSION_TIERS.tramo_master_34.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        Ref. Imagen
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white">
                      Bs. 1.000k (34% Total)
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                      <div>
                        Taquilla:{" "}
                        <strong className="text-blue-400">
                          {COMMISSION_TIERS.tramo_master_34.taquillaCommPct}%
                        </strong>
                      </div>
                      <div>
                        Spread Máster:{" "}
                        <strong className="text-amber-400 font-bold">
                          {COMMISSION_TIERS.tramo_master_34.spreadMasterPct}%
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-300 font-bold flex justify-between">
                    <span>Resultado Triples:</span>
                    <span className="text-emerald-400 font-bold">+Bs. 210.250</span>
                  </div>
                </div>
              </div>

              {/* DETALLE DEL TRAMO ACTIVO */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    Tramo Seleccionado:{" "}
                    <strong className="text-white">
                      {selectedTier === "tramo1"
                        ? COMMISSION_TIERS.tramo1.name
                        : selectedTier === "tramo2"
                        ? COMMISSION_TIERS.tramo2.name
                        : selectedTier === "tramo3"
                        ? COMMISSION_TIERS.tramo3.name
                        : "Personalizado"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    Comisión Total de Red:{" "}
                    <strong className="text-emerald-400 font-bold">
                      {totalCommPct}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* SUB-ÁREA B: EDITOR DESLIZANTE DE PARTICIPACIÓN SOCIETARIA (NET WIN SHARES) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    B. Reparto Societario Net Win / GGR
                  </h4>
                </div>
                <span className="text-[10.5px] font-mono text-amber-300 font-bold">
                  Suma: 100%
                </span>
              </div>

              {/* VISUALIZADOR DE BARRAS DE REPARTO */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 font-bold">
                      Comercializadora:
                    </span>
                    <span className="text-amber-400 font-extrabold text-sm">
                      {comercializadoraSharePct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 font-bold">Operadora:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      {operadoraSharePct}%
                    </span>
                  </div>
                </div>

                {/* BARRA BICOLOR DE REPARTO */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${comercializadoraSharePct}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-200"
                    title={`Comercializadora: ${comercializadoraSharePct}%`}
                  />
                  <div
                    style={{ width: `${operadoraSharePct}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                    title={`Operadora: ${operadoraSharePct}%`}
                  />
                </div>

                {/* SLIDER INTERACTIVO */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>30% Máster</span>
                    <span className="text-slate-300 font-bold">
                      Deslizar para ajustar proporción
                    </span>
                    <span>70% Máster</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={70}
                    step={1}
                    value={comercializadoraSharePct}
                    onChange={handleSliderChange}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* PRESETS RÁPIDOS */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                    Acuerdos Comerciales Frecuentes:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presetShares.map((p) => {
                      const isSelected = comercializadoraSharePct === p.comer;
                      return (
                        <button
                          key={p.comer}
                          type="button"
                          onClick={() => onUpdateShares(p.comer)}
                          className={`text-[10px] font-mono px-2 py-1 rounded border transition-all ${
                            isSelected
                              ? "bg-amber-500/25 border-amber-500 text-amber-300 font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IMPACTO EN VIVO: TARJETA RESUMEN DE RESULTADOS COMPARATIVOS */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-sans font-bold uppercase text-slate-400">
                Pote Net Win / GGR a Repartir
              </span>
              <div className="text-base font-extrabold text-white mt-0.5">
                Bs. {formatBs(netWinAmount, 2)}
              </div>
              <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                Base calculada tras premios y comisiones
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-amber-800/40">
              <span className="text-[10px] font-sans font-bold uppercase text-amber-400">
                Resultado Neto Comercializadora ({comercializadoraSharePct}% NW)
              </span>
              <div className="text-base font-extrabold text-amber-300 mt-0.5">
                +Bs. {formatBs(comercializadoraTotalResult, 2)}
              </div>
              <div className="text-[10px] font-sans text-slate-300 mt-0.5">
                Comisión Final Bs. {formatBs(comercializadoraFinalCommTotal, 2)} + NW Bs. {formatBs(comercializadoraNetWinShareAmount, 2)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-800/40">
              <span className="text-[10px] font-sans font-bold uppercase text-emerald-400">
                Superávit Operadora ({operadoraSharePct}% NW)
              </span>
              <div className="text-base font-extrabold text-emerald-300 mt-0.5">
                +Bs. {formatBs(operadoraSurplusReforma, 2)}
              </div>
              <div className="text-[10px] font-sans text-slate-300 mt-0.5">
                Superávit neto sostenible tras impuestos de juego
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
