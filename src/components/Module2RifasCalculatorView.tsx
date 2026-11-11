"use client";

import React, { useState } from "react";
import { RaffleModalityId, RAFFLE_MODALITIES } from "@/types/simulator";
import { formatBs } from "@/lib/cryptoUtils";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  Coins,
  DollarSign,
  Folder,
  FolderOpen,
  Info,
  Landmark,
  Layers,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Store,
  Ticket,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface Module2RifasCalculatorViewProps {
  onGoToPOS?: () => void;
}

type RifasFolderLevel = "nivel1" | "nivel2" | "nivel3";

export const Module2RifasCalculatorView: React.FC<
  Module2RifasCalculatorViewProps
> = ({ onGoToPOS }) => {
  const [activeFolder, setActiveFolder] =
    useState<RifasFolderLevel>("nivel3"); // Por defecto Nivel 3 para ver la comparativa de la Operadora
  const [activeRaffleId, setActiveRaffleId] =
    useState<RaffleModalityId>("rifa_triples_1000");

  const [bcvRate, setBcvRate] = useState<number>(40);
  const [soldPercentage, setSoldPercentage] = useState<number>(100);

  const config = RAFFLE_MODALITIES[activeRaffleId];
  const ticketPriceUsd = config.defaultTicketPriceUsd;

  // Cálculos de Emisión Total
  const totalEmissionUsd = config.totalNumbers * ticketPriceUsd;
  const totalEmissionBs = totalEmissionUsd * bcvRate;

  // Premios
  const vehiclePrizeUsd =
    totalEmissionUsd * (config.vehiclePrizePercentage / 100);
  const vehiclePrizeBs = vehiclePrizeUsd * bcvRate;
  const cashPrizeUsd = config.defaultCashPrizeUsd;
  const cashPrizeBs = cashPrizeUsd * bcvRate;
  const totalPrizesUsd = vehiclePrizeUsd + cashPrizeUsd;
  const totalPrizesBs = vehiclePrizeBs + cashPrizeBs;

  // Boletos vendidos según slider
  const soldCount = Math.round((config.totalNumbers * soldPercentage) / 100);
  const actualSalesUsd = soldCount * ticketPriceUsd;
  const actualSalesBs = actualSalesUsd * bcvRate;

  // --- COLUMNA 1: ESQUEMA VIGENTE PROVIDENCIA CONALOT/P/2025-001 ---
  // Aporte especial anticipado 7% CONALOT s/ 100% emisión (Art. 28)
  const conalotAdvance7Usd = totalEmissionUsd * 0.07;
  const conalotAdvance7Bs = conalotAdvance7Usd * bcvRate;

  // Software homologado 1,5% s/ Venta
  const softwareFee15Usd = actualSalesUsd * 0.015;
  const softwareFee15Bs = softwareFee15Usd * bcvRate;

  // Tasa RUNLOT y Solvencia en TCMMV (Art. 32)
  const runlotSolvencyFeeUsd = 500;
  const runlotSolvencyFeeBs = runlotSolvencyFeeUsd * bcvRate;

  // Impuesto SENIAT 10% s/ Facial (Esquema Antiguo s/ Venta Bruta)
  const seniatFacial10Usd = actualSalesUsd * 0.1;
  const seniatFacial10Bs = seniatFacial10Usd * bcvRate;

  // Comisión Red clandestina (Art. 27 prohíbe red, pero si operase al 15%):
  const commNetworkVigenteUsd = actualSalesUsd * 0.15;
  const commNetworkVigenteBs = commNetworkVigenteUsd * bcvRate;

  // Resultado Nivel 3 Vigente (Déficit / Quiebra):
  const operadoraBalanceVigenteUsd =
    actualSalesUsd -
    totalPrizesUsd -
    conalotAdvance7Usd -
    softwareFee15Usd -
    runlotSolvencyFeeUsd -
    seniatFacial10Usd -
    commNetworkVigenteUsd;
  const operadoraBalanceVigenteBs = operadoraBalanceVigenteUsd * bcvRate;

  // --- COLUMNA 2: REFORMA PROPUESTA GGR + RED CDAPUESTAS ---
  // Nivel 1: Taquilla (Comisión 10% bajo Cuentas de Terceros Arts. 32-33)
  const taquillaComm10Usd = actualSalesUsd * 0.1;
  const taquillaComm10Bs = taquillaComm10Usd * bcvRate;
  const taquillaIae25Usd = taquillaComm10Usd * 0.025; // 2,5% LOCAPTEM sobre comisión
  const taquillaIae25Bs = taquillaIae25Usd * bcvRate;
  const taquillaNetMarginUsd = taquillaComm10Usd - taquillaIae25Usd;
  const taquillaNetMarginBs = taquillaNetMarginUsd * bcvRate;

  // Nivel 2: Comercializadora (Spread 5% bajo Cuentas de Terceros)
  const comerSpread5Usd = actualSalesUsd * 0.05;
  const comerSpread5Bs = comerSpread5Usd * bcvRate;
  const comerIae25Usd = comerSpread5Usd * 0.025; // 2,5% s/ spread
  const comerIae25Bs = comerIae25Usd * bcvRate;
  const comerNetMarginUsd = comerSpread5Usd - comerIae25Usd;
  const comerNetMarginBs = comerNetMarginUsd * bcvRate;

  // Nivel 3: Operadora sobre GGR Real
  const netSalesReceivedByOperadoraUsd =
    actualSalesUsd - taquillaComm10Usd - comerSpread5Usd; // 85% de venta
  const netSalesReceivedByOperadoraBs =
    netSalesReceivedByOperadoraUsd * bcvRate;

  // GGR de la Rifa: Venta Efectiva - Premios (si venta cubre premios)
  const ggrRealRifaUsd = Math.max(0, actualSalesUsd - totalPrizesUsd);
  const ggrRealRifaBs = ggrRealRifaUsd * bcvRate;

  // Tributación armonizada s/ GGR:
  const seniatGgr10Usd = ggrRealRifaUsd * 0.1;
  const seniatGgr10Bs = seniatGgr10Usd * bcvRate;

  const iobpasGgr5Usd = ggrRealRifaUsd * 0.05; // 5% para la Lotería del Táchira titular del sorteo
  const iobpasGgr5Bs = iobpasGgr5Usd * bcvRate;

  const scfdFeeUsd = 50; // Tarifa razonable de timestampping
  const scfdFeeBs = scfdFeeUsd * bcvRate;

  // Superávit Operativo Neto Operadora Reforma:
  const operadoraSurplusReformaUsd =
    netSalesReceivedByOperadoraUsd -
    totalPrizesUsd -
    seniatGgr10Usd -
    iobpasGgr5Usd -
    scfdFeeUsd;
  const operadoraSurplusReformaBs = operadoraSurplusReformaUsd * bcvRate;

  return (
    <div className="space-y-6">
      {/* ====================================================================
          HEADER DEL MÓDULO 2 (RIFAS)
      ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-[11px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Calculadora Financiera 3 Niveles
                </span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Colapso Providencia 2025-001 vs. Reforma GGR
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Matriz Económica de Rifas: Taquilla, Comercializadora y Operadora
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Modalidad de Rifa en Módulo 2 */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveRaffleId("rifa_triples_1000")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRaffleId === "rifa_triples_1000"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Triples (1.000 Núm)
              </button>
              <button
                type="button"
                onClick={() => setActiveRaffleId("rifa_supergana_10000")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRaffleId === "rifa_supergana_10000"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Menor (10.000 Núm)
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">BCV:</span>{" "}
              <strong className="text-emerald-400">Bs. {formatBs(bcvRate, 2)}</strong>
            </div>
          </div>
        </div>

        {/* Resumen de Emisión y Control Deslizante de Venta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono">
          <div>
            <div className="text-slate-500 text-[11px]">Tiraje Autorizado:</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {config.totalNumbers.toLocaleString()} boletos × ${ticketPriceUsd} USD
            </div>
            <div className="text-[10.5px] text-purple-300">
              Total Emisión: ${totalEmissionUsd.toLocaleString()} USD
            </div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px]">Premio Vehículo (70%):</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              ${vehiclePrizeUsd.toLocaleString()} USD
            </div>
            <div className="text-[10.5px] text-amber-400">
              Bs. {formatBs(vehiclePrizeBs, 2)}
            </div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px]">Premios Metálico:</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              ${cashPrizeUsd.toLocaleString()} USD
            </div>
            <div className="text-[10.5px] text-emerald-400">
              Bs. {formatBs(cashPrizeBs, 2)}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Boletos Vendidos:</span>
              <strong className="text-white">{soldPercentage}%</strong>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={soldPercentage}
              onChange={(e) => setSoldPercentage(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
              <span>Venta: ${actualSalesUsd.toLocaleString()}</span>
              <span>Bs. {formatBs(actualSalesBs, 0)}</span>
            </div>
          </div>
        </div>

        {/* ====================================================================
            CARPETAS DE NAVEGACIÓN: NIVEL 1, NIVEL 2, NIVEL 3
        ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {/* Carpeta Nivel 1 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel1")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeFolder === "nivel1"
                ? "bg-blue-600/20 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/40"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            <Store
              className={`w-5 h-5 shrink-0 ${
                activeFolder === "nivel1" ? "text-blue-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                Nivel 1
              </div>
              <div className="text-xs font-bold truncate">Taquillas y Puntos POS</div>
              <div className="text-[10px] font-mono text-slate-400">
                Comisión 10% Cuentas Terceros
              </div>
            </div>
          </button>

          {/* Carpeta Nivel 2 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel2")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeFolder === "nivel2"
                ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/40"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            <Building2
              className={`w-5 h-5 shrink-0 ${
                activeFolder === "nivel2" ? "text-amber-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Nivel 2
              </div>
              <div className="text-xs font-bold truncate">Comercializadoras Máster</div>
              <div className="text-[10px] font-mono text-slate-400">
                Spread 5% Intermediación
              </div>
            </div>
          </button>

          {/* Carpeta Nivel 3 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel3")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeFolder === "nivel3"
                ? "bg-purple-600/20 border-purple-500 text-white shadow-lg ring-1 ring-purple-500/40"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            <ShieldCheck
              className={`w-5 h-5 shrink-0 ${
                activeFolder === "nivel3" ? "text-purple-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                Nivel 3
              </div>
              <div className="text-xs font-bold truncate">Operadora Concesionaria</div>
              <div className="text-[10px] font-mono text-slate-400">
                GGR Real vs. Aporte 7% Confiscatorio
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ====================================================================
          TABLA COMPARATIVA DE 2 COLUMNAS SEGÚN EL NIVEL SELECCIONADO
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ====================================================================
            COLUMNA IZQUIERDA: COLAPSO PROVIDENCIA CONALOT/P/2025-001 (VIGENTE)
        ==================================================================== */}
        <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Columna 1: Colapso Providencia 2025-001 (Vigente)
              </h3>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/30">
              Modelo Rígido y Confiscatorio
            </span>
          </div>

          {activeFolder === "nivel1" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 leading-relaxed">
                <strong>🚨 Art. 27 Providencia 2025-001:</strong> Prohíbe expresamente las redes de distribución y comercialización independiente. Las taquillas y agencias no están reconocidas formalmente como puntos de venta de rifas, obligándolas a operar en la clandestinidad.
              </div>

              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Venta de Boletos Captada:</span>
                  <span className="font-bold text-white">
                    ${actualSalesUsd.toLocaleString()} USD (Bs. {formatBs(actualSalesBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950 text-rose-400">
                  <span>Comisión Pactada Clandestina (10%):</span>
                  <span>+${taquillaComm10Usd.toLocaleString()} USD</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-rose-950/30 text-rose-300">
                  <div>
                    <div>IAE Municipal sobre Venta Facial (5%):</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Alcaldía no reconoce cuenta de terceros
                    </div>
                  </div>
                  <span className="font-bold">
                    -${(actualSalesUsd * 0.05).toLocaleString()} USD (-50% Comisión)
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/60 font-bold text-rose-300">
                  <span>Riesgo Operativo Taquilla:</span>
                  <span>CLAUSURA Y MULTAS SENIAT</span>
                </div>
              </div>
            </div>
          )}

          {activeFolder === "nivel2" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 leading-relaxed">
                <strong>🚨 Exclusión de Comercializadoras:</strong> La Providencia 2025-001 no contempla contratos de intermediación ni figuras de Agente Máster. Toda comercializadora que preste logística o recaude dinero de rifas queda en infracción tributaria flagrante.
              </div>

              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Volumen Intermediado:</span>
                  <span className="font-bold text-white">
                    ${actualSalesUsd.toLocaleString()} USD
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950 text-rose-400">
                  <span>Margen Comercial Teórico (5%):</span>
                  <span>+${comerSpread5Usd.toLocaleString()} USD</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-rose-950/30 text-rose-300">
                  <div>
                    <div>Pretensión Fiscal Alcaldías (5% s/ Total):</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Al no existir factura por cuenta de terceros
                    </div>
                  </div>
                  <span className="font-bold">
                    -${(actualSalesUsd * 0.05).toLocaleString()} USD (-100% Margen)
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/60 font-bold text-rose-300">
                  <span>Resultado Comercializadora:</span>
                  <span>INVIABLE / PÉRDIDA NETA</span>
                </div>
              </div>
            </div>
          )}

          {activeFolder === "nivel3" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 leading-relaxed">
                <strong>🚨 Asfixia Financiera de la Operadora de Rifas:</strong> La combinación del aporte anticipado del 7% sobre toda la emisión autorizada (se venda o no), cánones de software del 1,5%, solvencias en TCMMV y el impuesto SENIAT s/ venta bruta conducen a la quiebra operativa inevitable.
              </div>

              <div className="space-y-2 font-mono text-[11.5px]">
                <div className="flex justify-between p-2 rounded bg-slate-950 font-bold text-white">
                  <span>Venta Total de Boletos:</span>
                  <span>
                    ${actualSalesUsd.toLocaleString()} USD (Bs. {formatBs(actualSalesBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-1.5 rounded bg-slate-950/60 text-slate-300">
                  <span>(-) Premio Vehículo 0 Km (70%):</span>
                  <span className="text-rose-400">
                    -${vehiclePrizeUsd.toLocaleString()} USD (-Bs. {formatBs(vehiclePrizeBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-1.5 rounded bg-slate-950/60 text-slate-300">
                  <span>(-) Premios Metálico ($1.000):</span>
                  <span className="text-rose-400">
                    -${cashPrizeUsd.toLocaleString()} USD (-Bs. {formatBs(cashPrizeBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-1.5 rounded bg-amber-950/20 text-amber-300 font-bold">
                  <span>(=) Margen Bruto Previo a Cargas:</span>
                  <span>${(actualSalesUsd - totalPrizesUsd).toLocaleString()} USD</span>
                </div>

                {/* Desglose de Cargas Confiscatorias */}
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1 text-rose-200 text-[11px]">
                  <div className="flex justify-between font-bold text-rose-300">
                    <span>1. Aporte Especial CONALOT (7% s/ 100% Emisión - Art. 28):</span>
                    <span>-${conalotAdvance7Usd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>2. Software Homologado Rifas (1,5% s/ Venta):</span>
                    <span>-${softwareFee15Usd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>3. Costo RUNLOT y Solvencia en TCMMV (Art. 32):</span>
                    <span>-${runlotSolvencyFeeUsd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>4. Impuesto SENIAT s/ Valor Facial Bruto (10%):</span>
                    <span>-${seniatFacial10Usd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5. Costo Red de Venta Clandestina (15%):</span>
                    <span>-${commNetworkVigenteUsd.toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-950 border-2 border-rose-500 font-black text-rose-300 text-sm">
                  <span>(=) DÉFICIT OPERATIVO FINAL:</span>
                  <span>
                    -${Math.abs(operadoraBalanceVigenteUsd).toLocaleString()} USD
                    <span className="block text-[10px] font-normal text-rose-400">
                      (-Bs. {formatBs(Math.abs(operadoraBalanceVigenteBs), 2)})
                    </span>
                  </span>
                </div>

                <div className="text-[10px] text-center text-rose-400 italic">
                  * Inviabilidad financiera: La Operadora pierde el {Math.abs((operadoraBalanceVigenteUsd / totalEmissionUsd) * 100).toFixed(1)}% de la emisión total autorizada.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            COLUMNA DERECHA: SOSTENIBILIDAD REFORMA PROPUESTA GGR + RED CDAPUESTAS
        ==================================================================== */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Columna 2: Sostenibilidad Reforma Propuesta GGR
              </h3>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Arts. 32-33 SENIAT + CDAPUESTAS
            </span>
          </div>

          {activeFolder === "nivel1" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 leading-relaxed">
                <strong>✓ Legalización bajo Cuentas de Terceros:</strong> La Taquilla actúa como comisionista recaudador bajo los Arts. 32 y 33 de la Providencia SNAT/2026/00093. Los fondos captados son de terceros y no integran su base imponible propia.
              </div>

              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Venta en Taquilla:</span>
                  <span className="font-bold text-white">
                    ${actualSalesUsd.toLocaleString()} USD (Bs. {formatBs(actualSalesBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950 text-emerald-400 font-bold">
                  <span>(+) Comisión Legal Taquilla (10%):</span>
                  <span>
                    +${taquillaComm10Usd.toLocaleString()} USD (+Bs. {formatBs(taquillaComm10Bs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-blue-950/30 text-blue-300">
                  <div>
                    <div>(−) IAE Municipal 2,5% (LOCAPTEM Art. 29 num. 1):</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Calculado estrictamente sobre su comisión
                    </div>
                  </div>
                  <span className="font-bold">
                    -${taquillaIae25Usd.toFixed(2)} USD (-Bs. {formatBs(taquillaIae25Bs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 font-black text-emerald-300 text-sm">
                  <span>(=) MARGEN NETO LIBRE TAQUILLA:</span>
                  <span>
                    +${taquillaNetMarginUsd.toFixed(2)} USD
                    <span className="block text-[10px] font-normal text-emerald-400">
                      (+Bs. {formatBs(taquillaNetMarginBs, 2)} • 97,5% Retenido)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeFolder === "nivel2" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 leading-relaxed">
                <strong>✓ Intermediación Homologada RUNLOT:</strong> La Comercializadora opera como agente máster de distribución, suministro de papel térmico de 80 mm y liquidación de saldos bajo contrato de comisión mercantil transparente.
              </div>

              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Volumen Distribuido en Red:</span>
                  <span className="font-bold text-white">
                    ${actualSalesUsd.toLocaleString()} USD
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950 text-emerald-400 font-bold">
                  <span>(+) Spread Comercializadora (5%):</span>
                  <span>
                    +${comerSpread5Usd.toLocaleString()} USD (+Bs. {formatBs(comerSpread5Bs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-blue-950/30 text-blue-300">
                  <div>
                    <div>(−) IAE Municipal 2,5% sobre Spread:</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Gravamen municipal conforme a LOCAPTEM
                    </div>
                  </div>
                  <span className="font-bold">
                    -${comerIae25Usd.toFixed(2)} USD (-Bs. {formatBs(comerIae25Bs, 2)})
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 font-black text-emerald-300 text-sm">
                  <span>(=) MARGEN NETO PROPIO COMERCIALIZADORA:</span>
                  <span>
                    +${comerNetMarginUsd.toFixed(2)} USD
                    <span className="block text-[10px] font-normal text-emerald-400">
                      (+Bs. {formatBs(comerNetMarginBs, 2)})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeFolder === "nivel3" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 leading-relaxed">
                <strong>✓ Modelo GGR Racional y Sostenible:</strong> La Operadora entera tributos exclusivamente sobre el ingreso bruto real del juego (Venta Efectiva menos Premios), reservando el canon de beneficencia para la Lotería del Táchira.
              </div>

              <div className="space-y-2 font-mono text-[11.5px]">
                <div className="flex justify-between p-2 rounded bg-slate-950 font-bold text-white">
                  <span>Venta Neta Recibida de Red (85%):</span>
                  <span>
                    ${netSalesReceivedByOperadoraUsd.toLocaleString()} USD (Bs. {formatBs(netSalesReceivedByOperadoraBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-1.5 rounded bg-slate-950/60 text-slate-300">
                  <span>(-) Costo Premio Vehículo 0 Km:</span>
                  <span className="text-rose-400">
                    -${vehiclePrizeUsd.toLocaleString()} USD (-Bs. {formatBs(vehiclePrizeBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-1.5 rounded bg-slate-950/60 text-slate-300">
                  <span>(-) Premios Metálico ($1.000):</span>
                  <span className="text-rose-400">
                    -${cashPrizeUsd.toLocaleString()} USD (-Bs. {formatBs(cashPrizeBs, 2)})
                  </span>
                </div>

                <div className="flex justify-between p-2 rounded bg-emerald-950/40 border border-emerald-500/40 font-extrabold text-emerald-300">
                  <span>(=) GGR Real de la Rifa (Venta − Premios):</span>
                  <span>
                    ${ggrRealRifaUsd.toLocaleString()} USD (Bs. {formatBs(ggrRealRifaBs, 2)})
                  </span>
                </div>

                {/* Desglose Tributario Armonizado sobre GGR */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-amber-300">
                    <span>1. Impuesto SENIAT s/ Juegos (10% s/ GGR):</span>
                    <span>-${seniatGgr10Usd.toLocaleString()} USD (-Bs. {formatBs(seniatGgr10Bs, 2)})</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>2. Canon Beneficencia IOBPAS Táchira (5% s/ GGR):</span>
                    <span>-${iobpasGgr5Usd.toLocaleString()} USD (-Bs. {formatBs(iobpasGgr5Bs, 2)})</span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span>3. Supervisión Telemática SCFD / RUNLOT:</span>
                    <span>-${scfdFeeUsd} USD (-Bs. {formatBs(scfdFeeBs, 2)})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950 border-2 border-emerald-500 font-black text-emerald-300 text-sm">
                  <span>(=) SUPERÁVIT OPERATIVO NETO OPERADORA:</span>
                  <span>
                    +${operadoraSurplusReformaUsd.toLocaleString()} USD
                    <span className="block text-[10px] font-normal text-emerald-400">
                      (+Bs. {formatBs(operadoraSurplusReformaBs, 2)})
                    </span>
                  </span>
                </div>

                <div className="text-[10px] text-center text-emerald-400">
                  ✓ Operación solvente, rentable y fiscalmente blindada ante el SENIAT y CONALOT.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
