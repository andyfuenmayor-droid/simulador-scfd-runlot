"use client";

import React, { useState } from "react";
import { RaffleConfig } from "@/types/simulator";
import { formatBs, formatIntBs } from "@/lib/cryptoUtils";
import { CheckCircle2, Copy, QrCode, ShieldAlert } from "lucide-react";

export interface RafflePlayItem {
  id: string;
  number: string;
  option: string;
  amountUsd: number;
  amountBs: number;
  combinationsCount: number;
  isFullTirajeSummary?: boolean;
}

interface ThermalTicketsRifasProps {
  modality: RaffleConfig;
  plays: RafflePlayItem[];
  ticketNumber: string;
  series?: string;
  dateTimeStr?: string;
  bcvRate: number;
  ticketPriceUsd: number;
  sha256Hash: string;
}

export const ThermalTicketsRifas: React.FC<ThermalTicketsRifasProps> = ({
  modality,
  plays,
  ticketNumber,
  series = "A",
  dateTimeStr = "15/12/2026 14:30:00",
  bcvRate,
  ticketPriceUsd,
  sha256Hash,
}) => {
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const is3Digits = modality.id === "rifa_triples_1000";
  const drawShortTag = is3Digits ? "Triple Táchira" : "Súper Gana";

  // Cálculos de Emisión y Totales en Taquilla
  const totalComb = plays.reduce(
    (acc, p) => acc + (p.combinationsCount || 1),
    0
  );
  const totalFacialUsd = plays.reduce(
    (acc, p) => acc + (p.amountUsd || 0),
    0
  );
  const totalFacialBs = totalFacialUsd * bcvRate;

  const isFullTirajeActive =
    plays.some((p) => p.isFullTirajeSummary) ||
    totalComb >= modality.totalNumbers;

  // Plan de Premios Oficial Homologado
  const totalEmissionUsd = modality.totalNumbers * ticketPriceUsd;
  const totalEmissionBs = totalEmissionUsd * bcvRate;

  const vehiclePrizeUsd = totalEmissionUsd * (modality.vehiclePrizePercentage / 100);
  const vehiclePrizeBs = vehiclePrizeUsd * bcvRate;
  const cashPrizeUsd = modality.defaultCashPrizeUsd;
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

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ==================================================================
            COLUMNA 1 (IZQUIERDA - ROJO): MODELO 1 TICKET ACTUAL RÍGIDO (CONALOT 2025-001)
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
                  {modality.lotteryDrawReference}
                </div>
                <div>
                  <span className="font-bold">Modalidad:</span> {modality.name}
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>
                    <span className="font-bold">Serie:</span> {series} (Art. 15)
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
                  MODO: TIRAJE COMPLETO ({modality.numberRangeLabel} ={" "}
                  {modality.totalNumbers.toLocaleString()} boletos × Bs.{" "}
                  {formatIntBs(ticketPriceUsd * bcvRate)} [${ticketPriceUsd} USD])
                </div>
              )}

              {/* Encabezado Lista Simple */}
              <div className="flex justify-between font-bold text-[10px] border-b border-dashed !border-slate-400 pb-1 mb-1.5 !text-slate-950">
                <span>DESCRIPCIÓN / BOLETO EMITIDO</span>
                <span>MONTO FACIAL</span>
              </div>

              {/* Filas de boletos (Solo Valor Facial) */}
              <div className="space-y-1 mb-2 min-h-[48px]">
                {plays.map((play) => (
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
                    ${vehiclePrizeUsd.toLocaleString()} USD (Bs. {formatIntBs(vehiclePrizeBs)})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>2. Premios Secundarios Metálico:</span>
                  <strong className="!text-slate-950">
                    ${cashPrizeUsd.toLocaleString()} USD (Bs. {formatIntBs(cashPrizeBs)})
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
                  <span>Canon Beneficencia IOBPAS ({drawShortTag}):</span>
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
                  <span>Fecha: {dateTimeStr}</span>
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
                  <span>Sorteo: {modality.lotteryDrawReference}</span>
                  <span>Serie: {series} (Art. 15)</span>
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
                  TALONARIO Y TIRAJE COMPLETO HOMOLOGADO ({modality.numberRangeLabel} ={" "}
                  {modality.totalNumbers.toLocaleString()} boletos × ${ticketPriceUsd})
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
                  {plays.map((play) => (
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
                          ? `${play.combinationsCount}×${formatIntBs(ticketPriceUsd * bcvRate)}`
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
                    RESUMEN {isFullTirajeActive ? `TIRAJE COMPLETO (${modality.totalNumbers.toLocaleString()} OPCIONES)` : `${totalComb} BOLETOS EN CAJA`}:
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
                      {modality.vehicleName}
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
                    {sha256Hash.slice(0, 24)}...
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
              : `Copiar Sello Criptográfico SHA-256 (${sha256Hash.slice(0, 16)}...)`}
          </span>
        </button>
      </div>
    </div>
  );
};

