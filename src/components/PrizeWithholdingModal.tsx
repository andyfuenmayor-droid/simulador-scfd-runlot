"use client";

import React, { useState, useEffect } from "react";
import { BetPlay, GameModalityConfig } from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  generateDeterministicSha256,
  generateSeniatWithholdingXML,
} from "@/lib/cryptoUtils";
import {
  Award,
  CheckCircle2,
  Copy,
  FileCode2,
  LogOut,
  Printer,
  QrCode,
  Send,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

interface PrizeWithholdingModalProps {
  isOpen: boolean;
  onClose: () => void;
  modality: GameModalityConfig;
  plays: BetPlay[];
  ticketNumber: string;
  drawNumber: string;
  dateTimeStr: string;
  onEmitWithholdingToSCFD: (data: {
    winnerId: string;
    winningPlay: BetPlay;
    grossPrize: number;
    igfWithheld: number;
    netPaid: number;
    certificateHash: string;
  }) => void;
}

export const PrizeWithholdingModal: React.FC<PrizeWithholdingModalProps> = ({
  isOpen,
  onClose,
  modality,
  plays,
  ticketNumber,
  drawNumber,
  dateTimeStr,
  onEmitWithholdingToSCFD,
}) => {
  // Filtramos las jugadas individuales para elegir la opción ganadora
  const selectablePlays = plays.filter((p) => !p.isFullTirajeSummary);
  const [selectedPlayId, setSelectedPlayId] = useState<string>(
    selectablePlays[0]?.id || ""
  );
  const [winnerDocId, setWinnerDocId] = useState<string>("V-18.456.789");
  const [transmitted, setTransmitted] = useState<boolean>(false);
  const [showXmlModal, setShowXmlModal] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  useEffect(() => {
    if (
      selectablePlays.length > 0 &&
      !selectablePlays.some((p) => p.id === selectedPlayId)
    ) {
      setSelectedPlayId(selectablePlays[0].id);
    }
  }, [selectablePlays, selectedPlayId]);

  useEffect(() => {
    setTransmitted(false);
  }, [selectedPlayId, winnerDocId, modality.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const winningPlay =
    selectablePlays.find((p) => p.id === selectedPlayId) ||
    selectablePlays[0] || { id: "default", option: "01 Carnero", amount: 100 };

  const betAmount = Number(winningPlay.amount) || 0;
  const grossPrize = betAmount * modality.multiplier;
  const igfWithheld = grossPrize * 0.16;
  const netPaid = grossPrize - igfWithheld;

  const certificateHash = generateDeterministicSha256(
    `ART18::${ticketNumber}::${drawNumber}::${modality.id}::${winningPlay.option}::${betAmount}::${winnerDocId}`
  );

  const generatedXml = generateSeniatWithholdingXML({
    rifAgente: "J-98765432-1",
    periodo: "202611",
    items: [
      {
        rifRetenido: winnerDocId.trim() || "V-18456789",
        numeroTicket: `TKT-${ticketNumber}`,
        numeroControl: `CTL-${drawNumber}-RUN009-${modality.id.toUpperCase()}`,
        fechaOperacion: dateTimeStr.split(" ")[0] || "02/11/2026",
        montoOperacion: grossPrize,
        porcentajeRetencion: 16.0,
        montoRetenido: igfWithheld,
      },
    ],
  });

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  const handleTransmit = () => {
    onEmitWithholdingToSCFD({
      winnerId: winnerDocId.trim() || "V-18.456.789",
      winningPlay,
      grossPrize,
      igfWithheld,
      netPaid,
      certificateHash,
    });
    setTransmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header del Modal (Sticky Top) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                Motor de Liquidación y Retención de Premios (Art. 18 — Modelo 3)
              </h2>
              <p className="text-[11px] text-slate-400">
                Comprobante Simplificado de Retención de Premio (80 mm, 15 líneas) • Enteramiento Instantáneo SCFD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono"
              title="Salir / Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
              <span>SALIR</span>
            </button>
          </div>
        </div>

        {/* Contenido en 2 columnas con scroll interno */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Parámetros de Liquidación */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                  Modalidad Sincronizada
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {modality.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Multiplicador Oficial:{" "}
                  <span className="font-bold text-emerald-400">
                    {modality.multiplier}x
                  </span>{" "}
                  la apuesta • Alícuota IGF:{" "}
                  <span className="font-bold text-amber-400">16%</span>
                </div>
              </div>

              {/* Selección de Jugada Ganadora */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Seleccione la Opción Ganadora del Sorteo #{drawNumber}
                </label>
                <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                  {selectablePlays.map((play) => {
                    const isSelected = play.id === winningPlay.id;
                    const playGross =
                      (Number(play.amount) || 0) * modality.multiplier;
                    const playNet = playGross * 0.84;
                    return (
                      <button
                        key={play.id}
                        type="button"
                        onClick={() => setSelectedPlayId(play.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs font-mono">
                            {play.option}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Apuesta: Bs. {formatBs(play.amount, 2)} ({modality.multiplier}x)
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-[11px] text-slate-400">
                            Bruto: Bs. {formatIntBs(playGross)}
                          </div>
                          <div className="text-xs font-bold text-emerald-400">
                            Neto: Bs. {formatIntBs(playNet)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Cédula / RIF del Ganador */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Cédula / RIF del Ganador (Único Dato Requerido)
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={winnerDocId}
                    onChange={(e) => setWinnerDocId(e.target.value)}
                    placeholder="Ej. V-18.456.789"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Simplificación administrativa: No se exige dirección fiscal, teléfono ni correo al apostador en taquilla.
                </p>
              </div>
            </div>

            {/* Botón Transmitir a API SCFD y Generación XML */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleTransmit}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
              >
                <Send className="w-4 h-4" />
                {transmitted
                  ? "Comprobante Transmitido a SCFD (Re-enviar)"
                  : "Liquidar Premio y Transmitir Retención a API SCFD"}
              </button>

              <button
                type="button"
                onClick={() => setShowXmlModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileCode2 className="w-4 h-4 text-blue-400" />
                Generar XML SENIAT (Decreto 1.808 - Concepto 077)
              </button>

              {transmitted && (
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Retención de <strong>Bs. {formatIntBs(igfWithheld)}</strong> registrada en la Consola Telemática SCFD (Módulo 3).
                  </span>
                </div>
              )}

              {/* Panel Ruta del Dinero y Declaración Telemática */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-sans">
                <div className="font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5 text-xs text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Ruta del Dinero y Declaración Telemática CDAPUESTAS
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    • <strong>Efectivo en Taquilla (84%):</strong> Bs. {formatBs(netPaid, 2)} entregados al apostador.
                  </div>
                  <div>
                    • <strong>Retención 16% IGF (Art. 18):</strong> Bs. {formatBs(igfWithheld, 2)} retenidos fiscalmente.
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1 mt-1">
                    <strong>Conciliación Automática CDAPUESTAS:</strong> En el cuadre de la taquilla solo se descuenta el premio neto pagado (Bs. {formatBs(netPaid, 2)}). Los Bs. {formatBs(igfWithheld, 2)} del 16% suben a la Operadora (único Agente de Retención según Art. 65 LISLR y Art. 9.2 Dcto. 1.808), eximiendo a la taquilla de declarar en el Portal Fiscal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Modelo 3 (Comprobante Térmico 80mm, 15 Líneas, Blanco Puro) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
            <div className="w-full max-w-[440px] mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Modelo 3: Comprobante Retención (Art. 18)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                80 MM • 15 LÍNEAS EXACTAS
              </span>
            </div>

            {/* Papel Térmico Físico de 80mm - Fondo Blanco Puro Obligatorio */}
            <div className="w-full max-w-[440px] select-text">
              <div className="thermal-edge-top" />
              <div
                className="thermal-ticket !bg-white !text-slate-950 font-mono px-4 py-4 text-[11px] leading-[1.42] border-x border-slate-300"
                style={{ backgroundColor: "#ffffff", color: "#020617" }}
              >
                {/* LÍNEA 1 */}
                <div className="text-center font-extrabold text-[11.5px] !text-slate-950">
                  01| SENIAT / CONALOT - RETENCIÓN PREMIO (ART. 18)
                </div>
                {/* LÍNEA 2 */}
                <div className="text-center font-bold text-[10.5px] !text-slate-900">
                  02| AGENTE RETENCIÓN: Lotería Oficial C.A. J-98765432-1
                </div>
                {/* LÍNEA 3 */}
                <div
                  className="text-center font-extrabold text-[10.5px] my-0.5 py-0.5 rounded"
                  style={{ backgroundColor: "#ecfdf5", color: "#065f46" }}
                >
                  03| CDAPUESTAS SYS-RUN-009 | RUNLOT: RUN-0089 | COMP: #R-{ticketNumber.slice(-4)}
                </div>
                {/* LÍNEA 4 */}
                <div className="text-[10.5px] !text-slate-950">
                  04| <span className="font-bold">TAQUILLA PAGADORA:</span> Centro de Apuestas La Favorita
                </div>
                {/* LÍNEA 5 */}
                <div className="text-[10.5px] !text-slate-950">
                  05| <span className="font-bold">RIF TAQUILLA:</span> J-12345678-9 | <span className="font-bold">FECHA:</span> {dateTimeStr}
                </div>
                {/* LÍNEA 6 */}
                <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
                  06| ----------------------------------------------
                </div>
                {/* LÍNEA 7 */}
                <div className="text-[11px] !text-slate-950 font-bold">
                  07| CÉDULA / RIF GANADOR: {winnerDocId || "V-18.456.789"}
                </div>
                {/* LÍNEA 8 */}
                <div className="text-[10.5px] !text-slate-950">
                  08| <span className="font-bold">TICKET ORIGEN:</span> #{ticketNumber} | <span className="font-bold">SORTEO:</span> #{drawNumber}
                </div>
                {/* LÍNEA 9 */}
                <div className="text-[10.5px] !text-slate-950">
                  09| <span className="font-bold">MODALIDAD:</span> {modality.shortName} (Factor {modality.multiplier}x)
                </div>
                {/* LÍNEA 10 */}
                <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
                  10| ----------------------------------------------
                </div>
                {/* LÍNEA 11: Encabezado Tabla 1 Línea */}
                <div
                  className="grid items-center font-extrabold text-[9.5px] !text-slate-950 whitespace-nowrap"
                  style={{ gridTemplateColumns: "25% 15% 21% 18% 21%" }}
                >
                  <div className="pr-1">11| OPCIÓN</div>
                  <div className="text-right px-1">APUEST</div>
                  <div className="text-right px-1">PREMIO BRUTO</div>
                  <div className="text-right px-1">IGF 16%</div>
                  <div className="text-right pl-1">NETO PAGO</div>
                </div>
                {/* LÍNEA 12: Cálculo Exacto 1 Línea */}
                <div
                  className="grid items-center font-bold text-[10px] py-1 my-0.5 rounded px-1 whitespace-nowrap"
                  style={{
                    gridTemplateColumns: "25% 15% 21% 18% 21%",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div className="truncate !text-slate-950 pr-1">
                    12| {winningPlay.option}
                  </div>
                  <div className="text-right !text-slate-900 px-1">
                    {formatIntBs(betAmount)}
                  </div>
                  <div className="text-right !text-slate-950 font-extrabold px-1">
                    {formatIntBs(grossPrize)}
                  </div>
                  <div
                    className="text-right font-extrabold px-1"
                    style={{ color: "#dc2626" }}
                  >
                    -{formatIntBs(igfWithheld)}
                  </div>
                  <div
                    className="text-right font-extrabold pl-1"
                    style={{ color: "#15803d" }}
                  >
                    {formatIntBs(netPaid)}
                  </div>
                </div>
                {/* LÍNEA 13 */}
                <div className="text-[10px] !text-slate-400 overflow-hidden whitespace-nowrap">
                  13| ----------------------------------------------
                </div>
                {/* LÍNEA 14 */}
                <div className="text-[10px] font-bold !text-slate-900">
                  14| BASE LEGAL: Art. 18 Prov. SNAT/2026/00093 (16% IGF)
                </div>
                {/* LÍNEA 15 */}
                <div className="flex items-center justify-between pt-1 mt-0.5 border-t !border-slate-300 text-[10px] font-extrabold !text-slate-950">
                  <span className="flex items-center gap-1">
                    <QrCode
                      className="w-3.5 h-3.5 inline"
                      style={{ color: "#059669" }}
                    />
                    15| CERT. API SCFD • HASH:{" "}
                    {certificateHash.slice(0, 14).toUpperCase()}
                  </span>
                  <span style={{ color: "#059669" }}>[OK-200]</span>
                </div>
              </div>
              <div className="thermal-edge-bottom" />
            </div>
          </div>
        </div>
        </div>

        {/* Footer del Modal (Sticky Bottom) con Botón Salir Principal */}
        <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Retención del 16% centralizada en la Operadora (Art. 65 LISLR)</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all font-mono border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              Imprimir Ticket
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-red-950/60 font-mono tracking-wide"
            >
              <LogOut className="w-4 h-4" />
              SALIR / CERRAR
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW XML SENIAT (DECRETO 1.808 - CONCEPTO 077) */}
      {showXmlModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Archivo XML Oficial SENIAT — Decreto 1.808 (Concepto 077)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estructura homologada para carga masiva en Portal Fiscal SENIAT (Planilla 99029)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowXmlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950/90 text-emerald-300">
              <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
                {generatedXml}
              </pre>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Formato UTF-8 • Agente: J-98765432-1 • Alícuota: 16%
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedXml ? "¡Copiado al Portapapeles!" : "Copiar XML"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
