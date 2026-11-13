"use client";

import React, { useState, useMemo, useEffect } from "react";
import { formatBs, formatIntBs } from "@/lib/cryptoUtils";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gavel,
  Info,
  Landmark,
  Layers,
  Percent,
  RotateCcw,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
  Table,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { RecordedRaffleTicket, RAFFLE_MODALITIES } from "@/types/simulator";

interface Module4RifasTributosProyeccionViewProps {
  onGoToPOS?: () => void;
  onGoToModule2?: () => void;
  emittedRaffleTickets?: RecordedRaffleTicket[];
}

type RifasSubTabId =
  | "matriz_tributaria"
  | "proyecciones_rifas"
  | "colision_legal"
  | "entes_detalle";

export const Module4RifasTributosProyeccionView: React.FC<
  Module4RifasTributosProyeccionViewProps
> = ({ onGoToPOS, onGoToModule2, emittedRaffleTickets = [] }) => {
  const [activeSubTab, setActiveSubTab] =
    useState<RifasSubTabId>("matriz_tributaria");

  // Tasa BCV Oficial
  const [bcvRate, setBcvRate] = useState<number>(904.45);
  const [isFetchingBcv, setIsFetchingBcv] = useState<boolean>(false);

  const fetchBcvRate = async () => {
    try {
      setIsFetchingBcv(true);
      const res = await fetch("/api/bcv");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.rate === "number" && data.rate > 0) {
          setBcvRate(data.rate);
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

  // Modalidad seleccionada para la Matriz Tributaria
  const [selectedMatrizModality, setSelectedMatrizModality] = useState<
    "triples" | "supergana" | "ambas"
  >("ambas");

  // Parámetros interactivos del Simulador de Proyecciones de Rifas
  const [sorteosAlMes, setSorteosAlMes] = useState<number>(2); // 2 sorteos de rifa por mes
  const [pctTriplesMix, setPctTriplesMix] = useState<number>(50); // 50% Triples ($30) y 50% Súper Gana ($5)
  const [cuorumVentaPct, setCuorumVentaPct] = useState<number>(85); // 85% de boletos vendidos
  const [numTaquillasRifas, setNumTaquillasRifas] = useState<number>(500); // 500 taquillas en la red
  const [numComercializadorasRifas, setNumComercializadorasRifas] =
    useState<number>(10);
  const [horizonteDias, setHorizonteDias] = useState<number>(180); // 180 días (Semestre)
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // Datos base de las modalidades de Rifa
  const tripConfig = RAFFLE_MODALITIES.rifa_triples_1000;
  const superConfig = RAFFLE_MODALITIES.rifa_supergana_10000;

  // Precios oficiales definidos
  const priceTriplesUsd = 30; // $30 USD
  const totalTriplesTickets = 1000; // 1.000 boletos
  const totalTriplesEmissionUsd = priceTriplesUsd * totalTriplesTickets; // $30.000 USD
  const vehTriplesPrizeUsd = totalTriplesEmissionUsd * 0.7; // $21.000 USD (70%)
  const cashTriplesPrizeUsd = 1000; // $1.000 USD
  const totalTriplesPrizesUsd = vehTriplesPrizeUsd + cashTriplesPrizeUsd; // $22.000 USD
  const ggrTriplesUsd = totalTriplesEmissionUsd - totalTriplesPrizesUsd; // $8.000 USD

  const priceSuperUsd = 5; // $5 USD
  const totalSuperTickets = 10000; // 10.000 boletos
  const totalSuperEmissionUsd = priceSuperUsd * totalSuperTickets; // $50.000 USD
  const vehSuperPrizeUsd = totalSuperEmissionUsd * 0.7; // $35.000 USD (70%)
  const cashSuperPrizeUsd = 1000; // $1.000 USD
  const totalSuperPrizesUsd = vehSuperPrizeUsd + cashSuperPrizeUsd; // $36.000 USD
  const ggrSuperUsd = totalSuperEmissionUsd - totalSuperPrizesUsd; // $14.000 USD

  // Totales de una emisión combinada (1 emisión Triples + 1 emisión Súper Gana)
  const totalCombinedEmissionUsd =
    totalTriplesEmissionUsd + totalSuperEmissionUsd; // $80.000 USD
  const totalCombinedPrizesUsd =
    totalTriplesPrizesUsd + totalSuperPrizesUsd; // $58.000 USD
  const totalCombinedGgrUsd = totalCombinedEmissionUsd - totalCombinedPrizesUsd; // $22.000 USD

  // =========================================================================
  // CÁLCULOS MATEMÁTICOS DEL SIMULADOR DE PROYECCIONES MULTI-ACTOR
  // =========================================================================
  const mesesProyeccion = horizonteDias / 30;
  const totalSorteosPeriodo = Math.round(mesesProyeccion * sorteosAlMes);

  // Distribución de emisiones según el Mix
  const sorteosTriples = Math.round(
    (totalSorteosPeriodo * pctTriplesMix) / 100
  );
  const sorteosSuper = Math.max(0, totalSorteosPeriodo - sorteosTriples);

  // Emisión Teórica Total Autorizada
  const emisionTotalPeriodoUsd =
    sorteosTriples * totalTriplesEmissionUsd +
    sorteosSuper * totalSuperEmissionUsd;
  const emisionTotalPeriodoBs = emisionTotalPeriodoUsd * bcvRate;

  // Venta Efectiva según Cuórum de Venta (slider %)
  const cuorumRatio = cuorumVentaPct / 100;
  const ventaEfectivaPeriodoUsd = emisionTotalPeriodoUsd * cuorumRatio;
  const ventaEfectivaPeriodoBs = ventaEfectivaPeriodoUsd * bcvRate;

  // Premios Entregados (Vehículos + Metálico)
  // Nota legal: Según Art. 20 y 25, si se alcanza el cuórum (>=70%), los premios se entregan íntegros
  const totalVehiculosEntregados = totalSorteosPeriodo;
  const costoTotalPremiosPeriodoUsd =
    sorteosTriples * totalTriplesPrizesUsd +
    sorteosSuper * totalSuperPrizesUsd;
  const costoTotalPremiosPeriodoBs = costoTotalPremiosPeriodoUsd * bcvRate;

  // GGR Real Generado en el Período (Venta Efectiva - Premios)
  const ggrRealPeriodoUsd = Math.max(
    0,
    ventaEfectivaPeriodoUsd - costoTotalPremiosPeriodoUsd
  );
  const ggrRealPeriodoBs = ggrRealPeriodoUsd * bcvRate;

  // --- REFORMA PROPUESTA SCFD / CUENTAS DE TERCEROS ---
  // Comisiones de la Red
  const comisionTaquillasTotalUsd = ventaEfectivaPeriodoUsd * 0.1; // 10% de comisión
  const comisionTaquillasTotalBs = comisionTaquillasTotalUsd * bcvRate;
  const comisionPromedioPorTaquillaUsd =
    numTaquillasRifas > 0 ? comisionTaquillasTotalUsd / numTaquillasRifas : 0;

  const comisionComercializadorasTotalUsd = ventaEfectivaPeriodoUsd * 0.05; // 5% spread
  const comisionComercializadorasTotalBs =
    comisionComercializadorasTotalUsd * bcvRate;

  // Tributos Municipales (Alcaldías): 2,5% IAE sobre comisión de taquilla y comercializadora
  const iaeAlcaldiasTaquillaUsd = comisionTaquillasTotalUsd * 0.025;
  const iaeAlcaldiasComerUsd = comisionComercializadorasTotalUsd * 0.025;
  const iaeAlcaldiasTotalUsd = iaeAlcaldiasTaquillaUsd + iaeAlcaldiasComerUsd;
  const iaeAlcaldiasTotalBs = iaeAlcaldiasTotalUsd * bcvRate;

  // Beneficencia Pública IOBPAS (Lotería del Táchira): 5% sobre GGR Real
  const beneficenciaIobpasReformaUsd = ggrRealPeriodoUsd * 0.05;
  const beneficenciaIobpasReformaBs = beneficenciaIobpasReformaUsd * bcvRate;

  // SENIAT: Impuesto a los Juegos de Envite o Azar (10% sobre GGR Real)
  const seniatJuegosReformaUsd = ggrRealPeriodoUsd * 0.1;
  const seniatJuegosReformaBs = seniatJuegosReformaUsd * bcvRate;

  // SENIAT: Retenciones del 16% IGF (Metálico + Especie con Comprobante Modelo 3)
  const retencionIgfMetalicoPeriodoUsd =
    totalSorteosPeriodo * (1000 * 0.16);
  const retencionIgfVehiculosPeriodoUsd =
    (sorteosTriples * vehTriplesPrizeUsd +
      sorteosSuper * vehSuperPrizeUsd) *
    0.16;
  const retencionIgfTotalPeriodoUsd =
    retencionIgfMetalicoPeriodoUsd + retencionIgfVehiculosPeriodoUsd;
  const retencionIgfTotalPeriodoBs = retencionIgfTotalPeriodoUsd * bcvRate;

  const recaudacionTotalSeniatReformaUsd =
    seniatJuegosReformaUsd + retencionIgfTotalPeriodoUsd;
  const recaudacionTotalSeniatReformaBs =
    recaudacionTotalSeniatReformaUsd * bcvRate;

  // Gran Total Recaudado para el Estado venezolano (SENIAT + IOBPAS + Alcaldías)
  const aporteTotalEstadoReformaUsd =
    recaudacionTotalSeniatReformaUsd +
    beneficenciaIobpasReformaUsd +
    iaeAlcaldiasTotalUsd;
  const aporteTotalEstadoReformaBs = aporteTotalEstadoReformaUsd * bcvRate;

  // Balance Operadoras bajo Reforma SCFD (Venta recibida neta - Premios - IOBPAS - SENIAT - IAE propio)
  const ingresosNetosOperadorasUsd =
    ventaEfectivaPeriodoUsd -
    comisionTaquillasTotalUsd -
    comisionComercializadorasTotalUsd;
  const balanceOperadorasReformaUsd =
    ingresosNetosOperadorasUsd -
    costoTotalPremiosPeriodoUsd -
    beneficenciaIobpasReformaUsd -
    seniatJuegosReformaUsd;
  const balanceOperadorasReformaBs = balanceOperadorasReformaUsd * bcvRate;

  // --- RÉGIMEN VIGENTE PROVIDENCIA CONALOT/P/2025-001 (INVIABILIDAD) ---
  // Aporte Anticipado CONALOT 7% sobre 100% de emisión autorizada (Art. 28)
  const conalotAnticipado7VigenteUsd = emisionTotalPeriodoUsd * 0.07;
  const conalotAnticipado7VigenteBs = conalotAnticipado7VigenteUsd * bcvRate;

  // Peaje Software Homologado Privado 1,5%
  const softwarePrivado15VigenteUsd = ventaEfectivaPeriodoUsd * 0.015;
  const softwarePrivado15VigenteBs = softwarePrivado15VigenteUsd * bcvRate;

  // Beneficencia IOBPAS en Régimen Vigente
  const beneficenciaIobpasVigenteUsd = 0; // 0,00% Despojo

  // SENIAT pretendido s/ Facial (10% s/ Venta)
  const seniatFacialVigenteUsd = ventaEfectivaPeriodoUsd * 0.1;

  // Balance Operadoras bajo Régimen Vigente (Quiebra Garantizada)
  const balanceOperadorasVigenteUsd =
    ventaEfectivaPeriodoUsd -
    costoTotalPremiosPeriodoUsd -
    conalotAnticipado7VigenteUsd -
    softwarePrivado15VigenteUsd -
    seniatFacialVigenteUsd -
    ventaEfectivaPeriodoUsd * 0.15; // Comisión red informal si opera
  const balanceOperadorasVigenteBs = balanceOperadorasVigenteUsd * bcvRate;

  // Función de Descarga CSV de la Proyección
  const handleExportProyeccionCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "=== PROYECCIÓN FINANCIERA Y TRIBUTARIA DE RIFAS CDAPUESTAS / SCFD ===",
        `Horizonte Temporal: ${horizonteDias} Días (${mesesProyeccion} Meses)`,
        `Tasa Oficial BCV: Bs. ${bcvRate}`,
        `Sorteos al Mes: ${sorteosAlMes} (Total Período: ${totalSorteosPeriodo} Sorteos)`,
        `Mix de Emisiones: ${pctTriplesMix}% Triples 1.000 ($30) / ${100 - pctTriplesMix}% Rifa Menor 10.000 ($5)`,
        `Cuórum de Venta Efectivo: ${cuorumVentaPct}%`,
        `Red de Taquillas: ${numTaquillasRifas} | Comercializadoras: ${numComercializadorasRifas}`,
        "",
        "CONCEPTO,RÉGIMEN VIGENTE CONALOT 2025-001 (USD),REFORMA PROPUESTA SCFD GGR (USD),DIFERENCIA / IMPACTO",
        `Venta Efectiva Colocada,$${ventaEfectivaPeriodoUsd.toFixed(2)},$${ventaEfectivaPeriodoUsd.toFixed(2)},Transparente en tiempo real`,
        `Costo Premios (Vehículos + Metálico),$${costoTotalPremiosPeriodoUsd.toFixed(2)},$${costoTotalPremiosPeriodoUsd.toFixed(2)},100% Garantizados`,
        `Beneficencia Pública IOBPAS (Lot. Táchira),$${beneficenciaIobpasVigenteUsd.toFixed(2)},$${beneficenciaIobpasReformaUsd.toFixed(2)},+${beneficenciaIobpasReformaUsd.toFixed(2)} USD para Hospitales`,
        `SENIAT Impuesto a los Juegos,$${seniatFacialVigenteUsd.toFixed(2)},$${seniatJuegosReformaUsd.toFixed(2)},Armonizado s/ GGR`,
        `SENIAT Retención 16% IGF (Modelo 3),$${retencionIgfTotalPeriodoUsd.toFixed(2)},$${retencionIgfTotalPeriodoUsd.toFixed(2)},Enteramiento bancarizado`,
        `Alcaldías (IAE 2.5% LOCAPTEM),$0.00 (Litigios),$${iaeAlcaldiasTotalUsd.toFixed(2)},Paz tributaria municipal`,
        `Comisiones Taquillas POS,$0.00 (Prohibidas Art. 27),$${comisionTaquillasTotalUsd.toFixed(2)},Sustento 500+ familias`,
        `Aporte Anticipado CONALOT (7% Emisión),$${conalotAnticipado7VigenteUsd.toFixed(2)},$0.00 (Inconstitucional Art. 317),Eliminación de asfixia`,
        `Balance Neto Operadoras de Rifa,$${balanceOperadorasVigenteUsd.toFixed(2)} (QUIEBRA),$${balanceOperadorasReformaUsd.toFixed(2)} (SUPERÁVIT),Viabilidad y formalidad`,
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PROYECCION_RIFAS_SCFD_${horizonteDias}_DIAS_${numTaquillasRifas}_TAQUILLAS.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          BANNER SUPERIOR EJECUTIVO: RÉGIMEN TRIBUTARIO & PROYECCIÓN DE RIFAS
      ==================================================================== */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold uppercase">
                  Módulo 4 • Régimen Tributario y Proyecciones de Rifas
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  CONALOT/P/2025-001 vs. Reforma SCFD
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Matriz Tributaria y Proyección Multi-Actor de Rifas
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                Evaluación integral de la carga fiscal en los 4 entes (Alcaldías,
                IOBPAS Lotería del Táchira, SENIAT y CONALOT) y simulador a gran
                escala demostrando la viabilidad de la intermediación comercial por
                Cuentas de Terceros frente al colapso del régimen vigente.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2 font-mono text-xs shrink-0">
            <div className="px-3 py-2 bg-slate-950/80 border border-purple-500/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-sans flex items-center justify-center gap-1">
                <span>Tasa Oficial BCV</span>
                <button
                  type="button"
                  onClick={fetchBcvRate}
                  disabled={isFetchingBcv}
                  className="hover:text-purple-400 text-slate-400 cursor-pointer"
                  title="Actualizar API oficial del BCV"
                >
                  <RotateCcw
                    className={`w-3 h-3 ${isFetchingBcv ? "animate-spin text-amber-400" : ""}`}
                  />
                </button>
              </div>
              <div className="text-purple-300 font-extrabold text-sm">
                Bs. {formatBs(bcvRate, 2)}
              </div>
            </div>
            <div className="px-3 py-2 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase font-sans">
                Rifa Triples • Rifa Menor
              </div>
              <div className="text-emerald-400 font-extrabold text-sm">
                $30 USD • $5 USD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BARRA DE SUB-NAVEGACIÓN (SUBCARPETAS DE MÓDULO 4 EN RIFAS)
      ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("matriz_tributaria")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeSubTab === "matriz_tributaria"
              ? "bg-purple-600/25 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/40"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          }`}
        >
          <Table
            className={`w-5 h-5 shrink-0 ${
              activeSubTab === "matriz_tributaria"
                ? "text-purple-400"
                : "text-slate-500"
            }`}
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
              Subcarpeta 1
            </div>
            <div className="text-xs font-extrabold truncate">
              Matriz Tributaria (4 Entes)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("proyecciones_rifas")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeSubTab === "proyecciones_rifas"
              ? "bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/40"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-slate-700"
          }`}
        >
          <TrendingUp
            className={`w-5 h-5 shrink-0 ${
              activeSubTab === "proyecciones_rifas"
                ? "text-emerald-400 animate-pulse"
                : "text-slate-500"
            }`}
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
              Subcarpeta 2
            </div>
            <div className="text-xs font-extrabold truncate">
              Proyección Multi-Actor
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("colision_legal")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeSubTab === "colision_legal"
              ? "bg-rose-950/70 border-rose-500 text-white shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/40"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-slate-700"
          }`}
        >
          <Scale
            className={`w-5 h-5 shrink-0 ${
              activeSubTab === "colision_legal"
                ? "text-rose-400 animate-pulse"
                : "text-slate-500"
            }`}
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">
              Subcarpeta 3
            </div>
            <div className="text-xs font-extrabold truncate">
              Colisión CONALOT / IOBPAS
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("entes_detalle")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeSubTab === "entes_detalle"
              ? "bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/40"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-blue-300 hover:border-slate-700"
          }`}
        >
          <Landmark
            className={`w-5 h-5 shrink-0 ${
              activeSubTab === "entes_detalle"
                ? "text-blue-400"
                : "text-slate-500"
            }`}
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">
              Subcarpeta 4
            </div>
            <div className="text-xs font-extrabold truncate">
              Desglose por Ente Fiscal
            </div>
          </div>
        </button>
      </div>

      {/* ====================================================================
          SUBCARPETA 1: MATRIZ TRIBUTARIA DE RIFAS (4 ENTES FISCALES)
      ==================================================================== */}
      {activeSubTab === "matriz_tributaria" && (
        <div className="space-y-6">
          {/* Selector de Modalidad de Rifa para la Matriz */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase font-mono">
                Modalidad en Evaluación Fiscal:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMatrizModality("triples")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedMatrizModality === "triples"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                Triples 1.000 ($30 USD)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMatrizModality("supergana")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedMatrizModality === "supergana"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                Rifa Menor 10.000 ($5 USD)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMatrizModality("ambas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedMatrizModality === "ambas"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                Ambas Consolidadas ($80k USD)
              </button>
            </div>
          </div>

          {/* TABLA COMPARATIVA MAESTRA: RÉGIMEN VIGENTE vs REFORMA SCFD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-purple-400" />
                  <span>
                    Matriz Comparativa de Tributación en Rifas: Providencia
                    2025-001 vs. Reforma SCFD Cuentas de Terceros
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Análisis comparativo de impacto en los 4 Entes del Estado y la
                  Cadena de Comercialización.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-300">
                {selectedMatrizModality === "triples" &&
                  "Emisión: $30.000 USD (Bs. 27.133.500)"}
                {selectedMatrizModality === "supergana" &&
                  "Emisión: $50.000 USD (Bs. 45.222.500)"}
                {selectedMatrizModality === "ambas" &&
                  "Emisión Combinada: $80.000 USD (Bs. 72.356.000)"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-950/80 text-slate-300">
                    <th className="py-3 px-3">Actor / Ente Fiscal</th>
                    <th className="py-3 px-3">Concepto Impositivo</th>
                    <th className="py-3 px-3 text-rose-400">
                      Régimen Vigente (CONALOT 2025-001)
                    </th>
                    <th className="py-3 px-3 text-emerald-400">
                      Reforma Propuesta (SCFD GGR + Terceros)
                    </th>
                    <th className="py-3 px-3">Base Legal & Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {/* Fila 1: Taquillas */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-400" />
                      1. Taquillas POS
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Comisión y Tributo IAE Municipal
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      Prohibida Intermediación (Art. 27)
                      <div className="text-[10px] text-slate-500 font-normal">
                        O acumulación ilegal del 100% facial
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      Comisión 10% bajo Cuentas Terceros
                      <div className="text-[10px] text-emerald-300 font-normal">
                        Tributa solo 2,5% IAE sobre comisión ($75 / $125 USD)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Arts. 32-33 Providencia SENIAT/2026/00093 + LOCAPTEM
                    </td>
                  </tr>

                  {/* Fila 2: Comercializadoras */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      2. Comercializadora
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Spread de Distribución y Logística
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      Excluida por Art. 27 (Red clandestina)
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      Spread 5% bajo mandato ($1.500 / $2.500 USD)
                      <div className="text-[10px] text-emerald-300 font-normal">
                        IAE 2,5% sobre spread ($37,50 / $62,50 USD)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Mandato con representación y Reporte Z consolidado
                    </td>
                  </tr>

                  {/* Fila 3: Alcaldías */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-400" />
                      3. Alcaldías (Municipios)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Impuesto a las Actividades Económicas (IAE)
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      Pretensión 10% s/ Facial ($3.000 / $5.000 USD)
                      <div className="text-[10px] text-slate-500 font-normal">
                        Confiscatorio e incobrable (cierre de taquillas)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      2,5% s/ Comisiones de la Red ($112,50 / $187,50 USD)
                      <div className="text-[10px] text-emerald-300 font-normal">
                        100% Recaudable sin litigiosidad
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Clasificador Armonizado LOCAPTEM (Art. 29.1)
                    </td>
                  </tr>

                  {/* Fila 4: IOBPAS */}
                  <tr className="hover:bg-slate-800/40 bg-purple-950/20">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      4. IOBPAS (Lot. Táchira)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Canon de Beneficencia Pública Regional
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      0,00% ($0 USD) • DESPOJO
                      <div className="text-[10px] text-slate-500 font-normal">
                        Usa sorteos Triple Táchira y Súper Gana gratis
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      5,00% s/ GGR Real ($400 / $700 USD)
                      <div className="text-[10px] text-emerald-300 font-normal">
                        Recursos directos para hospitales y obras sociales
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Art. 1 Ley Nacional de Lotería y fe pública institucional
                    </td>
                  </tr>

                  {/* Fila 5: SENIAT - Impuesto a los Juegos */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      5. SENIAT (Impuesto Juegos)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Tributo Nacional de Envite o Azar
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      10%-15% s/ Venta Bruta
                      <div className="text-[10px] text-slate-500 font-normal">
                        Agrava la quiebra de la operadora
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      10,00% s/ GGR Real ($800 / $1.400 USD)
                      <div className="text-[10px] text-emerald-300 font-normal">
                        Base imponible técnica: Venta - Vehículo - Metálico
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Estándar CIAT / Modelo GGR + Deducibilidad ISLR Art. 27
                    </td>
                  </tr>

                  {/* Fila 6: SENIAT - Retención 16% IGF */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      6. SENIAT (Retención 16% IGF)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Impuesto a las Ganancias Fortuitas
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      Incertidumbre en premios en especie
                      <div className="text-[10px] text-slate-500 font-normal">
                        Falta de Comprobante Modelo 3 para vehículos
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      Liquidación Dual Certificada:
                      <div className="text-[10px] text-emerald-300 font-normal">
                        Metálico ($160 USD) + Vehículo ($3.360 / $5.600 USD)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Art. 65 LISLR + Art. 18 Prov. 00093 + Concepto 077
                    </td>
                  </tr>

                  {/* Fila 7: CONALOT */}
                  <tr className="hover:bg-slate-800/40 bg-rose-950/20">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      7. CONALOT & RUNLOT
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Aporte Especial & Software Privado
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-bold">
                      7% Anticipado s/ 100% Emisión + 1,5% Software
                      <div className="text-[10px] text-rose-300 font-normal">
                        -$2.550 USD (Triples) / -$4.250 USD (Súper Gana)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      Supervisión Telemática API SCFD
                      <div className="text-[10px] text-emerald-300 font-normal">
                        Eliminación de cobros confiscatorios y peajes privados
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Violación Reserva Legal Tributaria (Art. 317 CRBV)
                    </td>
                  </tr>

                  {/* Fila 8: Operadora Titular */}
                  <tr className="hover:bg-slate-800/40 bg-slate-950 font-bold">
                    <td className="py-3 px-3 text-white flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-emerald-400" />
                      8. Operadora de Rifa
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Resultado Operativo y Viabilidad del Sorteo
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-black">
                      QUIEBRA Y DÉFICIT
                      <div className="text-[10px] text-rose-300 font-bold">
                        -$3.650 USD (Triples) / -$4.650 USD (Súper Gana)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-black">
                      SUPERÁVIT SOSTENIBLE
                      <div className="text-[10px] text-emerald-300 font-bold">
                        +$4.000 USD (Triples) / +$7.000 USD (Súper Gana)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      Garantiza la entrega del Vehículo 0 Km y solvencia formal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBCARPETA 2: PROYECCIÓN DE RIFAS A GRAN ESCALA (MULTI-ACTOR)
      ==================================================================== */}
      {activeSubTab === "proyecciones_rifas" && (
        <div className="space-y-6">
          {/* Panel de Controles Interactivos de Proyección */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <span>
                    Simulador Interactivo de Proyecciones Multi-Actor (Rifas a Gran
                    Escala)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modifique las variables operativas para proyectar la recaudación
                  fiscal, fondos de beneficencia IOBPAS y sostenibilidad de la
                  red.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportProyeccionCsv}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950"
              >
                <Download className="w-4 h-4" />
                <span>
                  {copiedCsv ? "✓ CSV Descargado" : "Exportar Proyección (CSV)"}
                </span>
              </button>
            </div>

            {/* Grid de Controles Deslizantes e Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Control 1: Sorteos al Mes */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-white">Sorteos al Mes:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {sorteosAlMes} Emisiones
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={sorteosAlMes}
                  onChange={(e) => setSorteosAlMes(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 mensual</span>
                  <span>Quincenal (2)</span>
                  <span>Semanal (4)</span>
                </div>
              </div>

              {/* Control 2: Mix de Modalidades */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-white">Mix Modalidades:</span>
                  <span className="text-purple-400 font-extrabold text-xs">
                    {pctTriplesMix}% Triples / {100 - pctTriplesMix}% Súper Gana
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={pctTriplesMix}
                  onChange={(e) => setPctTriplesMix(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>100% Súper Gana</span>
                  <span>50 / 50</span>
                  <span>100% Triples</span>
                </div>
              </div>

              {/* Control 3: Cuórum de Venta Efectivo */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-white">Cuórum de Venta:</span>
                  <span
                    className={`font-extrabold text-sm ${
                      cuorumVentaPct < 70 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {cuorumVentaPct}% Boletos
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={cuorumVentaPct}
                  onChange={(e) => setCuorumVentaPct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>50%</span>
                  <span className="text-amber-400 font-bold">70% Mín. (Art. 20)</span>
                  <span>100% Total</span>
                </div>
              </div>

              {/* Control 4: Horizonte de Proyección */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Horizonte:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHorizonteDias(30)}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      horizonteDias === 30
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    30 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorizonteDias(90)}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      horizonteDias === 90
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    90 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorizonteDias(180)}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      horizonteDias === 180
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    180 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorizonteDias(365)}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      horizonteDias === 365
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    365 Días
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs de Tamaño de Red */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">
                  Red de Taquillas Minoristas Activas:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    step={50}
                    value={numTaquillasRifas}
                    onChange={(e) =>
                      setNumTaquillasRifas(Math.max(1, Number(e.target.value)))
                    }
                    className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold text-center"
                  />
                  <span className="text-slate-500 text-[11px]">Puntos POS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">
                  Comercializadoras Intermediarias:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={numComercializadorasRifas}
                    onChange={(e) =>
                      setNumComercializadorasRifas(
                        Math.max(1, Number(e.target.value))
                      )
                    }
                    className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold text-center"
                  />
                  <span className="text-slate-500 text-[11px]">Empresas</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 TARJETAS DE RESULTADOS PROYECTADOS CLAVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Tarjeta 1: Ventas Efectivas Proyectadas */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <span className="text-slate-400 text-[11px] uppercase font-bold">
                Ventas Efectivas ({horizonteDias} Días):
              </span>
              <div className="text-xl font-black text-white">
                ${ventaEfectivaPeriodoUsd.toLocaleString()} USD
              </div>
              <div className="text-[10.5px] text-slate-500">
                Bs. {formatBs(ventaEfectivaPeriodoBs, 2)}
              </div>
              <div className="text-[10px] text-purple-400 font-semibold pt-1 border-t border-slate-800">
                {totalSorteosPeriodo} Sorteos Realizados
              </div>
            </div>

            {/* Tarjeta 2: Premios Entregados (Vehículos 0 Km) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <span className="text-slate-400 text-[11px] uppercase font-bold">
                Premios Entregados:
              </span>
              <div className="text-xl font-black text-emerald-400">
                ${costoTotalPremiosPeriodoUsd.toLocaleString()} USD
              </div>
              <div className="text-[10.5px] text-slate-500">
                Bs. {formatBs(costoTotalPremiosPeriodoBs, 2)}
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold pt-1 border-t border-slate-800">
                {totalVehiculosEntregados} Vehículos 0 Km + Metálico
              </div>
            </div>

            {/* Tarjeta 3: Beneficencia Lotería del Táchira */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border-2 border-purple-500/50 space-y-1 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 text-[11px] uppercase font-bold">
                  Beneficencia IOBPAS (5% GGR):
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">
                  Lot. Táchira
                </span>
              </div>
              <div className="text-xl font-black text-purple-300">
                ${beneficenciaIobpasReformaUsd.toLocaleString()} USD
              </div>
              <div className="text-[10.5px] text-slate-400">
                Bs. {formatBs(beneficenciaIobpasReformaBs, 2)}
              </div>
              <div className="text-[10px] text-rose-400 font-semibold pt-1 border-t border-slate-800 flex justify-between">
                <span>Vigente: $0 USD (Despojo)</span>
                <span className="text-emerald-400">✓ Restituido</span>
              </div>
            </div>

            {/* Tarjeta 4: Recaudación SENIAT Proyectada */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/50 space-y-1 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 text-[11px] uppercase font-bold">
                  Recaudación SENIAT:
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                  GGR + 16% IGF
                </span>
              </div>
              <div className="text-xl font-black text-emerald-400">
                ${recaudacionTotalSeniatReformaUsd.toLocaleString()} USD
              </div>
              <div className="text-[10.5px] text-slate-400">
                Bs. {formatBs(recaudacionTotalSeniatReformaBs, 2)}
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold pt-1 border-t border-slate-800">
                100% Bancarizado con Modelo 3
              </div>
            </div>
          </div>

          {/* TABLA COMPARATIVA DE IMPACTO MULTI-ACTOR EN EL PERÍODO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>
                Cuadro Comparativo de Impacto en el Período ({horizonteDias} Días /{" "}
                {totalSorteosPeriodo} Emisiones de Rifa)
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                    <th className="py-2.5 px-3">Actor / Destino de Fondos</th>
                    <th className="py-2.5 px-3 text-rose-400">
                      Régimen Vigente Providencia
                    </th>
                    <th className="py-2.5 px-3 text-emerald-400">
                      Reforma Propuesta SCFD
                    </th>
                    <th className="py-2.5 px-3">Impacto / Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      Beneficencia Pública IOBPAS (Lot. Táchira)
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">
                      $0,00 USD (0%)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${beneficenciaIobpasReformaUsd.toLocaleString()} USD
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      +${beneficenciaIobpasReformaUsd.toLocaleString()} USD para
                      salud pública
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      SENIAT (Impuesto Juegos GGR 10%)
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      ${seniatFacialVigenteUsd.toLocaleString()} USD (Facial)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${seniatJuegosReformaUsd.toLocaleString()} USD
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      Gravamen técnico sobre GGR Real
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      SENIAT (Retenciones 16% IGF Enteradas)
                    </td>
                    <td className="py-2.5 px-3 text-amber-400">
                      Riesgo de omisión
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${retencionIgfTotalPeriodoUsd.toLocaleString()} USD
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {totalVehiculosEntregados} Comprobantes Modelo 3 emitidos
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      Alcaldías (IAE 2,5% sobre comisiones)
                    </td>
                    <td className="py-2.5 px-3 text-rose-400">
                      $0 USD (Litigios y clausuras)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${iaeAlcaldiasTotalUsd.toLocaleString()} USD
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      Paz tributaria municipal LOCAPTEM
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      Red de {numTaquillasRifas} Taquillas Minoristas
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">
                      Ilegalizadas por Art. 27
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${comisionTaquillasTotalUsd.toLocaleString()} USD (Total)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300 font-bold">
                      ~${comisionPromedioPorTaquillaUsd.toFixed(2)} USD /
                      taquilla
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      Aporte Anticipado CONALOT (7% Emisión)
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">
                      -${conalotAnticipado7VigenteUsd.toLocaleString()} USD
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      $0,00 USD (Eliminado)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      Cese de confiscación anticipada
                    </td>
                  </tr>

                  <tr className="bg-slate-950 font-bold">
                    <td className="py-3 px-3 text-white">
                      Balance Operadoras de Rifa
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-black">
                      ${balanceOperadorasVigenteUsd.toLocaleString()} USD
                      (QUIEBRA)
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-black">
                      +${balanceOperadorasReformaUsd.toLocaleString()} USD
                      (SUPERÁVIT)
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-black">
                      Continuidad empresarial formal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBCARPETA 3: ANÁLISIS DE COLISIÓN LEGAL (CONALOT vs. IOBPAS)
      ==================================================================== */}
      {activeSubTab === "colision_legal" && (
        <div className="space-y-6">
          {/* BANNER PRINCIPAL DE DICTAMEN LEGAL */}
          <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-purple-950/70 border-2 border-rose-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                  <Scale className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold uppercase">
                      Dictamen Jurídico • Derecho Administrativo & Tributario
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      G.O. #42.981 (CONALOT/P/2025-001)
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Análisis de Colisión Legal: Providencia de Rifas
                    CONALOT/P/2025-001 vs. Ley Nacional de Lotería e IOBPAS
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                    Evaluación de incompatibilidad estructural entre la regulación
                    de rifas dictada por CONALOT (09/01/2025), el mandato de
                    beneficencia pública regional de las Instituciones Oficiales
                    de Beneficencia Pública y Asistencia Social (IOBPAS), la
                    Reserva Legal Tributaria (Art. 317 CRBV) y la Providencia
                    SENIAT/2026/00093.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2 font-mono text-xs shrink-0">
                <div className="px-3 py-2 bg-slate-950/80 border border-rose-500/30 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-sans">
                    Canon IOBPAS en Rifa
                  </div>
                  <div className="text-rose-400 font-extrabold text-sm">
                    0,00% (Despojo)
                  </div>
                </div>
                <div className="px-3 py-2 bg-slate-950/80 border border-purple-500/30 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-sans">
                    Aporte Anticipado CONALOT
                  </div>
                  <div className="text-purple-400 font-extrabold text-sm">
                    7,00% s/ 100% Emisión
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 TARJETAS EJECUTIVAS DE CONFLICTO Y SOLUCIÓN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TARJETA 1: RESPONSABILIDAD SIN BENEFICIO IOBPAS */}
            <div className="bg-slate-900 border-2 border-rose-500/30 hover:border-rose-500/60 transition-all rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Conflicto 1 • Despojo Operativo
                  </span>
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>

                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>1. Responsabilidad sin Beneficio para las IOBPAS</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="p-3 bg-slate-950/70 border border-rose-900/40 rounded-xl">
                    <p className="font-semibold text-rose-300 mb-1">
                      Dependencia técnica de Sorteos Oficiales:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Las rifas autorizadas por CONALOT utilizan obligatoriamente
                      los sorteos oficiales de las IOBPAS (
                      <strong className="text-white">Triple Táchira</strong> para
                      1.000 números y{" "}
                      <strong className="text-white">Súper Gana</strong> para
                      10.000 números, Art. 7 núms. 6 y 7). El Art. 6 (núms. 3, 5 y
                      11) del Reglamento de Rifas exige que la apuesta sea
                      respaldada e interconectada al servidor de la IOBPAS para
                      gozar de fe pública.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <p className="font-semibold text-amber-300 mb-1">
                      Asignación del 0% de ingresos y lavado de manos:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pese a utilizar su infraestructura, marca y fe pública, la
                      Providencia CONALOT/P/2025-001 asigna{" "}
                      <strong className="text-rose-400">0% de ingresos</strong> a
                      la IOBPAS. Simultáneamente, en el{" "}
                      <strong className="text-white">Art. 31</strong>, CONALOT se
                      exime de toda responsabilidad civil, laboral o mercantil
                      frente a ganadores, dejando a la IOBPAS y al operador
                      expuestos al reclamo público.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-rose-400 font-bold flex items-center justify-between">
                <span>Vulneración:</span>
                <span className="text-slate-400">
                  Art. 1 Ley Nacional de Lotería
                </span>
              </div>
            </div>

            {/* TARJETA 2: DESVÍO DEL 7% ANTICIPADO Y RESERVA LEGAL */}
            <div className="bg-slate-900 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Conflicto 2 • Ilegalidad Fiscal
                  </span>
                  <AlertTriangle className="w-5 h-5 text-purple-400" />
                </div>

                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>2. Desvío del 7% Anticipado y Violación Constitucional</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="p-3 bg-slate-950/70 border border-purple-900/40 rounded-xl">
                    <p className="font-semibold text-purple-300 mb-1">
                      Violación de la Reserva Legal Tributaria (Art. 317 CRBV):
                    </p>
                    <p className="text-[11px] text-slate-400">
                      El <strong className="text-white">Art. 28</strong> de la
                      Providencia crea un &quot;Aporte Especial&quot; del 7% sobre
                      el 100% del valor total de la emisión, cobrado de manera
                      anticipada antes de vender un solo boleto. Un ente regulador
                      no tiene potestad legislativa para crear tributos ni
                      exacciones parafiscales confiscatorias mediante una simple
                      providencia administrativa.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <p className="font-semibold text-rose-300 mb-1">
                      Peaje privado del 1,5% y RUNLOT en TCMMV:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Adicionalmente, se impone un pago del 1,5% de las ventas
                      brutas por &quot;uso de software homologado&quot; y aranceles
                      en TCMMV (Art. 32). Esto desvía los recursos genuinos de la
                      beneficencia hacia esquemas privados, provocando el colapso
                      financiero inmediato de cualquier rifa legal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-purple-400 font-bold flex items-center justify-between">
                <span>Vulneración:</span>
                <span className="text-slate-400">
                  Art. 317 Constitución de la República
                </span>
              </div>
            </div>

            {/* TARJETA 3: SOLUCIÓN DE ARMONIZACIÓN PROPUESTA */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 hover:border-emerald-500/70 transition-all rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Solución • Arquitectura SCFD
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>3. Solución Técnica de Armonización Institucional</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="p-3 bg-slate-950/70 border border-emerald-900/40 rounded-xl">
                    <p className="font-semibold text-emerald-300 mb-1">
                      Migración al Modelo GGR y Restitución del Canon:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sustituir el 7% anticipado sobre emisión por un gravamen
                      exclusivo sobre el{" "}
                      <strong className="text-white">GGR Real</strong> (Ventas
                      Efectivas menos Costo del Vehículo y Metálico). Se restituye
                      un <strong className="text-emerald-400">canon del 5%</strong>{" "}
                      directo a la IOBPAS titular del sorteo (Lotería del Táchira)
                      para financiar la beneficencia regional.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <p className="font-semibold text-blue-300 mb-1">
                      Supervisión Telemática Abierta (Switch SCFD / RUNLOT):
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Eliminar el cobro del 1,5% de software privado. La
                      trazabilidad de cada boleto se transmite en milisegundos
                      mediante la API estándar SCFD / RUNLOT, garantizando control
                      fiscal en tiempo real sin costos confiscatorios ni
                      distorsiones de mercado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400 font-bold flex items-center justify-between">
                <span>Resultado:</span>
                <span className="text-emerald-300">
                  Viabilidad, Legalidad y Beneficencia
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBCARPETA 4: ANÁLISIS DETALLADO POR ENTE FISCAL (RIFAS)
      ==================================================================== */}
      {activeSubTab === "entes_detalle" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ente 1: Alcaldías */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>1. Alcaldías (Municipios) & Régimen de Cuentas de Terceros</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Bajo la Providencia SNAT/2026/00093 (Arts. 32 y 33), las Taquillas
              de lotería que vendan boletos de rifas actúan como{" "}
              <strong>recaudadores por cuenta de terceros</strong>. Los fondos de
              la venta de boletos no constituyen ingreso bruto propio, evitando
              que las municipalidades pretendan pechar el valor comercial del
              vehículo 0 Km. La base imponible municipal es exclusivamente la
              comisión del 10% cobrada por la taquilla, gravada con la alícuota
              armonizada del 2,5% según el clasificador LOCAPTEM.
            </p>
          </div>

          {/* Ente 2: IOBPAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>2. IOBPAS (Lotería del Táchira) & Beneficencia Pública</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              La Providencia CONALOT/P/2025-001 obliga a utilizar los sorteos
              oficiales registrados de las IOBPAS (
              <em>Triple Táchira</em> a las 16:30 hrs y <em>Súper Gana</em>), pero
              inconstitucionalmente despoja a las IOBPAS de su legítimo canon de
              beneficencia. La propuesta SCFD restituye el canon del 5% sobre el
              GGR de la rifa en favor de la IOBPAS titular del sorteo,
              restableciendo el mandato legal del Art. 1 de la Ley Nacional de
              Lotería.
            </p>
          </div>

          {/* Ente 3: SENIAT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>3. SENIAT: Impuesto sobre GGR y Retención Dual 16% IGF</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              En materia de rifas, el SENIAT liquida en dos vertientes: a) El
              Impuesto a los Juegos de Envite o Azar del 10% aplicado sobre el GGR
              real de la rifa, y b) La retención del 16% del Impuesto a las
              Ganancias Fortuitas (Art. 65 LISLR). En metálico se retiene $160 USD
              en caja, y en especie el ganador entera el 16% sobre el valor del
              vehículo ante la Operadora como requisito previo indispensable para
              la emisión del Comprobante Modelo 3 y la entrega del bien.
            </p>
          </div>

          {/* Ente 4: CONALOT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>4. CONALOT & RUNLOT: Supervisión sin Peajes Confiscatorios</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              El cobro anticipado del 7% sobre toda la emisión autorizado en el
              Art. 28 de la Providencia 2025-001 viola el principio de no
              confiscatoriedad y la capacidad contributiva, asfixiando a la
              operadora antes de realizar el sorteo. La solución armonizada radica
              en la supervisión telemática abierta mediante la API SCFD / RUNLOT,
              con tasas de fiscalización proporcionales al volumen transaccional
              real y sin intermediaciones tecnológicas privadas abusivas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
