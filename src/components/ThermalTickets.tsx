"use client";

import React, { useState } from "react";
import { BetPlay, GameModalityConfig } from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  getTotalCombinationsCount,
  isPlaysFullTiraje,
} from "@/lib/cryptoUtils";
import { CheckCircle2, QrCode, ShieldAlert } from "lucide-react";

interface ThermalTicketsProps {
  modality: GameModalityConfig;
  plays: BetPlay[];
  ticketNumber: string;
  drawNumber: string;
  dateTimeStr: string;
  sha256Hash: string;
}

export const ThermalTickets: React.FC<ThermalTicketsProps> = ({
  modality,
  plays,
  ticketNumber,
  drawNumber,
  dateTimeStr,
  sha256Hash,
}) => {
  const [expandAllAnimalitos, setExpandAllAnimalitos] =
    useState<boolean>(false);

  const totalFacial = plays.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const fullTiraje = isPlaysFullTiraje(modality.id, plays);
  const totalCombinations = getTotalCombinationsCount(plays);
  const unitBet =
    totalCombinations > 0
      ? totalFacial / totalCombinations
      : Number(plays[0]?.amount) || 0;

  // Para Animalitos con 38 figuras, permitimos vista compacta de recibo o desplegar las 38 líneas
  const shouldCompactAnimalitos =
    modality.id === "animalitos" && plays.length > 10 && !expandAllAnimalitos;

  const visiblePlays: BetPlay[] = shouldCompactAnimalitos
    ? [
        ...plays.slice(0, 4),
        {
          id: "compact-anim-middle",
          option: `SERIE 05 AL 36 (${plays.length - 6} FIGURAS)`,
          amount: plays
            .slice(4, plays.length - 2)
            .reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
          combinationsCount: plays.length - 6,
          isFullTirajeSummary: true,
        },
        ...plays.slice(plays.length - 2),
      ]
    : plays;

  return (
    <div className="space-y-4">
      {modality.id === "animalitos" && plays.length > 10 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setExpandAllAnimalitos(!expandAllAnimalitos)}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expandAllAnimalitos
              ? "Compactar Rollo Térmico (Vista Ejecutiva)"
              : `Desplegar las ${plays.length} Figuras (01 al 38) en el Papel Térmico`}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ====================================================================
            IZQUIERDA — MODELO 1: TICKET ACTUAL RÍGIDO (PROVIDENCIA ART. 30 NUM. 2)
        ==================================================================== */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-xs font-bold">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 tracking-wide uppercase">
                Modelo 1: Ticket Actual Rígido
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-red-950/80 border border-rose-300 dark:border-red-800/70 text-rose-800 dark:text-red-300">
              SNAT/2026/00093 Art. 30.2
            </span>
          </div>

          {/* Contenedor Papel Térmico 80mm (48 Columnas) */}
          <div className="w-full max-w-[450px] select-text">
            <div className="thermal-edge-top" />
            <div
              className="thermal-ticket !bg-white !text-slate-950 font-mono px-4 py-4 text-[11.5px] leading-[1.35] border-x border-slate-300"
              style={{ backgroundColor: "#ffffff", color: "#020617" }}
            >
              {/* Regla de medición 80mm / 48 col */}
              <div className="flex justify-between items-center text-[9px] !text-slate-500 border-b border-dashed !border-slate-300 pb-1 mb-2">
                <span>PAPEL TÉRMICO 80 MM (48 COL)</span>
                <span>IMPRESORA FISCAL RÍGIDA</span>
              </div>

              {/* Encabezado Principal */}
              <div className="text-center font-bold text-[12px] tracking-tight !text-slate-950">
                CENTRO DE APUESTAS LA FAVORITA
              </div>
              <div className="text-center font-bold text-[11px] !text-slate-900 mb-2">
                CENTRO DE APUESTAS LA FAVORITA | RIF: J-12345678-9
              </div>

              {/* Badge Rojo de Alerta: SENIAT - FACTURA FISCAL */}
              <div
                className="w-full py-1 px-2 mb-2.5 text-center font-extrabold text-[11px] tracking-wider uppercase rounded border-2"
                style={{
                  backgroundColor: "#fee2e2",
                  borderColor: "#dc2626",
                  color: "#991b1b",
                }}
              >
                [ ! ] SENIAT - FACTURA FISCAL [ ! ]
              </div>

              {/* Datos exigidos Art. 30 num. 2 */}
              <div className="space-y-0.5 text-[11px] !text-slate-950 border-b border-dashed !border-slate-400 pb-2 mb-2">
                <div>
                  <span className="font-bold">Comercializadora:</span> Loterías del Sur C.A.
                </div>
                <div>
                  <span className="font-bold">RIF Comercializadora:</span> J-98765432-1
                </div>
                <div>
                  <span className="font-bold">Operadora:</span> Operadora Lotería Oficial C.A.
                </div>
                <div>
                  <span className="font-bold">IOBPAS:</span> Beneficencia Pública
                </div>
                <div className="flex justify-between pt-1">
                  <span>
                    <span className="font-bold">Factura N°:</span> {ticketNumber}
                  </span>
                  <span>
                    <span className="font-bold">Sorteo:</span> #{drawNumber}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Fecha/Hora:</span> {dateTimeStr}
                </div>
                <div>
                  <span className="font-bold">Juego:</span> {modality.name}
                </div>
                {fullTiraje && (
                  <div
                    className="mt-1 px-1.5 py-0.5 rounded font-bold text-[10px]"
                    style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                  >
                    MODO: TIRAJE COMPLETO ({modality.tirajeRangeLabel} ={" "}
                    {totalCombinations} opciones × Bs. {formatBs(unitBet, 2)})
                  </div>
                )}
              </div>

              {/* Encabezado Lista Simple */}
              <div className="flex justify-between font-bold text-[11px] border-b border-dashed !border-slate-400 pb-1 mb-1.5 !text-slate-950">
                <span>DESCRIPCIÓN / OPCIÓN APOSTADA</span>
                <span>MONTO FACIAL</span>
              </div>

              {/* Filas de jugadas (Solo Valor Facial) */}
              <div className="space-y-1 mb-2.5 min-h-[52px]">
                {visiblePlays.length === 0 ? (
                  <div className="py-3 text-center text-[10px] !text-slate-500 italic">
                    [ SIN JUGADAS CARGADAS EN TAQUILLA ]
                  </div>
                ) : (
                  visiblePlays.map((play) => (
                    <div
                      key={play.id}
                      className={`flex justify-between items-center text-[11px] !text-slate-950 ${
                        play.isFullTirajeSummary
                          ? "py-1 px-1.5 rounded font-bold border border-dashed"
                          : ""
                      }`}
                      style={
                        play.isFullTirajeSummary
                          ? { backgroundColor: "#f8fafc", borderColor: "#94a3b8" }
                          : undefined
                      }
                    >
                      <span className="font-semibold">{play.option}</span>
                      <span className="font-bold">Bs. {formatBs(play.amount, 2)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Cierre Total Factura y Serial Máquina Fiscal */}
              <div className="border-t-2 border-b-2 border-double !border-slate-900 py-1.5 my-2">
                <div className="flex justify-between items-center font-extrabold text-[13px] !text-slate-950">
                  <span>TOTAL FACTURA:</span>
                  <span>Bs. {formatBs(totalFacial, 2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] !text-slate-700 mt-0.5">
                  <span>BASE IMPONIBLE ACUMULADA (100%):</span>
                  <span>Bs. {formatBs(totalFacial, 2)}</span>
                </div>
              </div>

              <div className="text-center font-bold text-[11px] !text-slate-950 tracking-wide my-2">
                MÁQUINA FISCAL SERIAL: Z1A2345678
              </div>

              {/* Alerta inferior en rojo claro dentro del ticket */}
              <div
                className="mt-2 p-2.5 rounded border text-[10.5px] leading-snug"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#f87171",
                  color: "#7f1d1d",
                }}
              >
                <div className="flex items-start gap-1.5 font-bold">
                  <ShieldAlert
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "#dc2626" }}
                  />
                  <span>
                    PELIGRO FISCAL: El Reporte Z acumula el 100% del valor facial como ingreso propio gravable de la Taquilla y Comercializadora.
                  </span>
                </div>
              </div>
            </div>
            <div className="thermal-edge-bottom" />
          </div>
        </div>

        {/* ====================================================================
            DERECHA — MODELO 2: TICKET SIMPLIFICADO PROPUESTO (TABULAR + IGF 16%)
        ==================================================================== */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[450px] mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 tracking-wide uppercase">
                Modelo 2: Ticket Simplificado Propuesto
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300">
              Tabular 80mm + IGF 16%
            </span>
          </div>

          {/* Contenedor Papel Térmico 80mm (48 Columnas) */}
          <div className="w-full max-w-[450px] select-text">
            <div className="thermal-edge-top" />
            <div
              className="thermal-ticket !bg-white !text-slate-950 font-mono px-3.5 py-4 text-[11px] leading-[1.35] border-x border-slate-300"
              style={{ backgroundColor: "#ffffff", color: "#020617" }}
            >
              {/* Regla de medición 80mm / 48 col */}
              <div className="flex justify-between items-center text-[9px] !text-slate-500 border-b border-dashed !border-slate-300 pb-1 mb-2">
                <span>PAPEL TÉRMICO 80 MM (48 COL)</span>
                <span>HOMOLOGADO SCFD / RUNLOT • CDAPUESTAS</span>
              </div>

              {/* Encabezado Compacto con RUNLOT y Plataforma CDAPUESTAS */}
              <div className="text-center font-extrabold text-[11px] tracking-tight !text-slate-950 mb-0.5">
                CENTRO DE APUESTAS LA FAVORITA | RIF: J-12345678-9 | RUNLOT: RUN-0089
              </div>
              <div className="text-center font-bold text-[9.5px] !text-emerald-800 mb-1.5 font-mono">
                Sistema: CDAPUESTAS | RUNLOT: SYS-RUN-009 (POS & Kiosco Autoservicio "Anúnciate")
              </div>

              {/* Badge Verde Esmeralda Legible */}
              <div
                className="w-full py-1 px-2 mb-2 text-center font-extrabold text-[10.5px] tracking-wide uppercase rounded border-2"
                style={{
                  backgroundColor: "#ecfdf5",
                  borderColor: "#059669",
                  color: "#065f46",
                }}
              >
                Recaudación Cuenta Terceros (Arts. 32-33)
              </div>

              {/* Datos Compactos */}
              <div className="space-y-0.5 text-[10.5px] !text-slate-950 border-b border-dashed !border-slate-400 pb-2 mb-2">
                <div>
                  <span className="font-bold">Operadora:</span> Lotería Oficial C.A. (J-98765432-1)
                </div>
                <div className="flex justify-between">
                  <span>
                    <span className="font-bold">Ticket:</span> {ticketNumber}
                  </span>
                  <span>
                    <span className="font-bold">Sorteo:</span> {drawNumber}
                  </span>
                  <span>
                    <span className="font-bold">Hora:</span>{" "}
                    {dateTimeStr.split(" ")[1] || "14:30"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    <span className="font-bold">Modalidad:</span> {modality.shortName}
                  </span>
                  <span
                    className="font-extrabold px-1.5 py-0.2 rounded text-[10px]"
                    style={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}
                  >
                    Factor Premio: {modality.multiplier}x (Payout {modality.standardPayoutPct}%)
                  </span>
                </div>
              </div>

              {/* Tabla Ultra Compacta en 1 sola línea por jugada (5 Columnas con Separación Clara) */}
              <div className="mb-2">
                <div
                  className="grid items-center font-extrabold text-[9.5px] border-b-2 !border-slate-900 pb-1 mb-1 !text-slate-950 whitespace-nowrap"
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

                <div className="space-y-1 min-h-[52px]">
                  {visiblePlays.length === 0 ? (
                    <div className="py-3 text-center text-[10px] !text-slate-500 italic">
                      [ SIN JUGADAS CARGADAS EN TAQUILLA ]
                    </div>
                  ) : (
                    visiblePlays.map((play) => {
                      const isSummaryBlock = Boolean(play.isFullTirajeSummary);
                      const combCount = play.combinationsCount || 1;
                      const singleBet =
                        combCount > 0
                          ? (Number(play.amount) || 0) / combCount
                          : Number(play.amount) || 0;
                      const grossPrizePerWinner = singleBet * modality.multiplier;
                      const igf16PerWinner = grossPrizePerWinner * 0.16;
                      const netPrizePerWinner =
                        grossPrizePerWinner - igf16PerWinner;

                      return (
                        <div
                          key={play.id}
                          className="grid items-center text-[10px] border-b border-dotted !border-slate-300 py-0.5 whitespace-nowrap"
                          style={{
                            gridTemplateColumns: "25% 15% 21% 18% 21%",
                            backgroundColor: isSummaryBlock ? "#f8fafc" : "transparent",
                          }}
                        >
                          <div
                            className="font-bold !text-slate-950 truncate pr-1"
                            title={play.option}
                          >
                            {play.option}
                          </div>
                          <div className="text-right font-semibold !text-slate-900 px-1">
                            {isSummaryBlock
                              ? `${combCount}×${formatIntBs(singleBet)}`
                              : formatIntBs(play.amount)}
                          </div>
                          <div className="text-right font-bold !text-slate-950 px-1">
                            {formatIntBs(grossPrizePerWinner)}
                          </div>
                          <div
                            className="text-right font-bold px-1"
                            style={{ color: "#dc2626" }}
                          >
                            -{formatIntBs(igf16PerWinner)}
                          </div>
                          <div
                            className="text-right font-extrabold pl-1"
                            style={{ color: "#15803d" }}
                          >
                            {formatIntBs(netPrizePerWinner)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Resumen Especial de Tiraje Completo si está activo */}
              {fullTiraje && (
                <div
                  className="p-2 rounded border mb-2 text-[10px] leading-snug"
                  style={{
                    backgroundColor: "#ecfdf5",
                    borderColor: "#10b981",
                    color: "#064e3b",
                  }}
                >
                  <div className="font-extrabold">
                    RESUMEN TIRAJE COMPLETO ({totalCombinations} OPCIONES):
                  </div>
                  <div>
                    • 1 Ganador Garantizado ({modality.multiplier}x Bs.{" "}
                    {formatIntBs(unitBet)}):{" "}
                    <strong>Bs. {formatIntBs(unitBet * modality.multiplier)}</strong>
                  </div>
                  <div>
                    • Retención IGF 16% (Art. 18):{" "}
                    <strong style={{ color: "#dc2626" }}>
                      -Bs. {formatIntBs(unitBet * modality.multiplier * 0.16)}
                    </strong>{" "}
                    | Neto:{" "}
                    <strong>
                      Bs. {formatIntBs(unitBet * modality.multiplier * 0.84)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Pie de Ticket: Total Captado (Terceros) */}
              <div className="border-t-2 border-b-2 border-double !border-slate-900 py-1.5 my-2">
                <div className="flex justify-between items-center font-extrabold text-[12px] !text-slate-950">
                  <span>TOTAL CAPTADO (TERCEROS):</span>
                  <span>Bs. {formatBs(totalFacial, 2)}</span>
                </div>
              </div>

              {/* Nota Legal Expresa */}
              <div
                className="p-2 rounded border text-[10px] leading-snug mb-2 font-medium"
                style={{
                  backgroundColor: "#f8fafc",
                  borderColor: "#94a3b8",
                  color: "#0f172a",
                }}
              >
                &ldquo;Fondos en custodia (Arts. 32-33 Providencia). Base imponible propia s/comisión (Art. 29.1)&rdquo;
              </div>

              {/* Hash SHA-256 Dinámico */}
              <div className="text-[9.5px] !text-slate-700 break-all leading-tight mb-2">
                <span className="font-bold !text-slate-950">SHA-256 SCFD: </span>
                {sha256Hash.slice(0, 32)}...{sha256Hash.slice(-8)}
              </div>

              {/* Sello con Icono QR: VALIDADO SCFD • SENIAT / CONALOT */}
              <div
                className="flex items-center justify-between p-2 rounded border-2"
                style={{
                  backgroundColor: "#ecfdf5",
                  borderColor: "#10b981",
                  color: "#064e3b",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 rounded border"
                    style={{ backgroundColor: "#ffffff", borderColor: "#059669" }}
                  >
                    <QrCode className="w-7 h-7" style={{ color: "#020617" }} />
                  </div>
                  <div>
                    <div className="font-extrabold text-[10.5px] tracking-wide flex items-center gap-1">
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: "#059669" }}
                      />
                      VALIDADO SCFD • SENIAT / CONALOT
                    </div>
                    <div
                      className="text-[9px] font-semibold"
                      style={{ color: "#047857" }}
                    >
                      Sistema: CDAPUESTAS • RUNLOT: SYS-RUN-009 • Interconexión API SCFD
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="thermal-edge-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
};
