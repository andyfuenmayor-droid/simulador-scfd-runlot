"use client";

import React, { useState, useEffect } from "react";
import { formatBs, generateDeterministicSha256 } from "@/lib/cryptoUtils";
import {
  Award,
  Car,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  Download,
  FileCode2,
  FileText,
  Landmark,
  Layers,
  Lock,
  Printer,
  QrCode,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Store,
  Ticket,
  Users,
} from "lucide-react";

interface ModuleMoneyRouteRifasViewProps {
  onGoToPOS?: () => void;
}

export const ModuleMoneyRouteRifasView: React.FC<
  ModuleMoneyRouteRifasViewProps
> = ({ onGoToPOS }) => {
  const [bcvRate, setBcvRate] = useState<number>(901.62);
  const [isFetchingBcv, setIsFetchingBcv] = useState<boolean>(false);
  const [vehicleValueUsd, setVehicleValueUsd] = useState<number>(7000);
  const [cashPrizeUsd, setCashPrizeUsd] = useState<number>(1000);
  const [activeTabSubway, setActiveTabSubway] = useState<"metalico" | "especie">(
    "especie"
  );
  const [showModelo3Modal, setShowModelo3Modal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

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
      console.warn("Error consultando API BCV:", err);
    } finally {
      setIsFetchingBcv(false);
    }
  };

  useEffect(() => {
    fetchBcvRate();
  }, []);

  // Cálculos en Bolívares
  const vehicleValueBs = vehicleValueUsd * bcvRate;
  const cashPrizeBs = cashPrizeUsd * bcvRate;

  // Retención 16% Metálico
  const cashIgf16Usd = cashPrizeUsd * 0.16;
  const cashIgf16Bs = cashPrizeBs * 0.16;
  const cashNetUsd = cashPrizeUsd - cashIgf16Usd;
  const cashNetBs = cashPrizeBs - cashIgf16Bs;

  // Retención 16% Especie (Vehículo)
  const vehicleIgf16Usd = vehicleValueUsd * 0.16;
  const vehicleIgf16Bs = vehicleValueBs * 0.16;

  const modelo3Hash = generateDeterministicSha256(
    `MODELO3-SENIAT-RIFAS-VEHICULO-${vehicleValueBs}-${vehicleIgf16Bs}-202611`
  );

  return (
    <div className="space-y-6">
      {/* Banner Explicativo de la Doble Vía Legal */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Scale className="w-5 h-5 text-purple-400" />
            <span>Liquidación Dual del 16% IGF en Rifas (Art. 65 LISLR + Art. 18 SENIAT)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">BCV Oficial:</span>{" "}
              <strong className="text-emerald-400">Bs. {formatBs(bcvRate, 2)}</strong>
              <button
                type="button"
                onClick={fetchBcvRate}
                disabled={isFetchingBcv}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer"
                title="Sincronizar tasa oficial del BCV en tiempo real"
              >
                <RotateCcw className={`w-3 h-3 ${isFetchingBcv ? "animate-spin text-amber-400" : ""}`} />
              </button>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/30 font-bold">
              Concepto 077 SENIAT
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          El régimen de retención del Impuesto a las Ganancias Fortuitas (16% IGF) opera bajo dos mecánicas tributarias totalmente distintas según la naturaleza del premio: retención directa sobre premios en metálico (caja) y entero previo sobre bienes muebles en especie (vehículos 0 Km) para emisión del <strong>Comprobante Modelo 3</strong> y posterior <strong>Acta de Entrega de Premios (Art. 25 Providencia CONALOT)</strong>.
        </p>

        {/* Sub-selector entre Vía Metálico y Vía Especie */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTabSubway("especie")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSubway === "especie"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vía B: Premio Principal en Especie (Vehículo 70%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSubway("metalico")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSubway === "metalico"
                ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Vía A: Premios Secundarios en Metálico ($1.000)</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          VÍA B: PREMIO PRINCIPAL EN ESPECIE (VEHÍCULO 0 KM)
      ==================================================================== */}
      {activeTabSubway === "especie" && (
        <div className="space-y-6">
          {/* Tarjeta de Cálculo del Vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
              <span className="text-slate-400">Valor Comercial Factura Vehículo:</span>
              <div className="text-xl font-extrabold text-white">
                ${vehicleValueUsd.toLocaleString()} USD
              </div>
              <div className="text-emerald-400 font-bold">
                Bs. {formatBs(vehicleValueBs, 2)}
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                Toyota Yaris Sedan 0 Km (Factura Concesionario)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono space-y-1">
              <span className="text-amber-300 font-bold">
                16% IGF a Enterar al SENIAT:
              </span>
              <div className="text-xl font-black text-amber-400">
                ${vehicleIgf16Usd.toLocaleString()} USD
              </div>
              <div className="text-amber-200 font-extrabold">
                Bs. {formatBs(vehicleIgf16Bs, 2)}
              </div>
              <span className="text-[10px] text-amber-400/80 block pt-1">
                Depositado previamente por el ganador
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono flex flex-col justify-between">
              <div>
                <span className="text-slate-400">Documento Fiscal Requerido:</span>
                <div className="text-sm font-bold text-white mt-1">
                  Comprobante Modelo 3 (SENIAT)
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Art. 18 Prov. SNAT/2026/00093
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowModelo3Modal(true)}
                className="mt-2 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Comprobante Modelo 3</span>
              </button>
            </div>
          </div>

          {/* PIPELINE DE 5 ESTACIONES PARA PREMIO EN ESPECIE */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" />
              <span>Pipeline Legal: 5 Estaciones para Entrega de Premio en Especie</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
              {/* Estación 1 */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="font-bold text-white text-[11.5px]">
                  Boleto Ganador
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  Acierta el número de la Rifa en el Sorteo Triple Táchira. Nace el hecho imponible (Art. 65 LISLR).
                </p>
                <div className="text-[10px] text-blue-400 font-bold">
                  Vehículo: ${vehicleValueUsd.toLocaleString()}
                </div>
              </div>

              {/* Estación 2 */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div className="font-bold text-white text-[11.5px]">
                  Imposibilidad Física
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  El vehículo NO se puede cortar o mutilar físicamente al 84%. Debe entregarse íntegro 0 Km.
                </p>
                <div className="text-[10px] text-purple-400 font-bold">
                  Art. 21 Reglamento Rifa
                </div>
              </div>

              {/* Estación 3 */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div className="font-bold text-amber-300 text-[11.5px]">
                  Depósito Previo 16%
                </div>
                <p className="text-[10.5px] text-slate-300 font-sans leading-tight">
                  El ganador deposita el 16% a la cuenta de custodia de la Operadora (único Agente de Retención SENIAT).
                </p>
                <div className="text-[10.5px] text-amber-300 font-bold">
                  Entero: ${vehicleIgf16Usd.toLocaleString()} USD
                </div>
              </div>

              {/* Estación 4 */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div className="font-bold text-white text-[11.5px]">
                  Comprobante Modelo 3
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  La Operadora emite el Comprobante Oficial Modelo 3 con firma digital y hash SHA-256 (Art. 18).
                </p>
                <div className="text-[10px] text-emerald-400 font-bold">
                  XML Planilla 99029
                </div>
              </div>

              {/* Estación 5 */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <div className="font-bold text-emerald-300 text-[11.5px]">
                  Acta de Entrega (Art. 25)
                </div>
                <p className="text-[10.5px] text-slate-300 font-sans leading-tight">
                  Con el Modelo 3 pagado, se suscribe el Acta de Entrega de Premios (Art. 25 CONALOT) y se traspasa el auto.
                </p>
                <div className="text-[10px] text-emerald-400 font-bold">
                  Vehículo Entregado 0 Km
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VÍA A: PREMIOS SECUNDARIOS EN METÁLICO ($1.000 USD)
      ==================================================================== */}
      {activeTabSubway === "metalico" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
              <span className="text-slate-400">Premio Metálico Bruto Acertado:</span>
              <div className="text-xl font-extrabold text-white">
                ${cashPrizeUsd.toLocaleString()} USD
              </div>
              <div className="text-emerald-400 font-bold">
                Bs. {formatBs(cashPrizeBs, 2)}
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                Aproximaciones / Terminales
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono space-y-1">
              <span className="text-rose-300 font-bold">
                Retención Directa en Caja (16%):
              </span>
              <div className="text-xl font-black text-rose-400">
                -${cashIgf16Usd.toLocaleString()} USD
              </div>
              <div className="text-rose-300 font-extrabold">
                -Bs. {formatBs(cashIgf16Bs, 2)}
              </div>
              <span className="text-[10px] text-rose-400/80 block pt-1">
                Custodia telemática para la Operadora
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono space-y-1">
              <span className="text-emerald-300 font-bold">
                Efectivo Neto Entregado al Ganador (84%):
              </span>
              <div className="text-xl font-black text-emerald-400">
                ${cashNetUsd.toLocaleString()} USD
              </div>
              <div className="text-emerald-300 font-extrabold">
                Bs. {formatBs(cashNetBs, 2)}
              </div>
              <span className="text-[10px] text-emerald-400/80 block pt-1">
                Único monto que sale físicamente de caja
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Procedimiento de Enteramiento Planilla 99029 SENIAT:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              La Taquilla y la Comercializadora NO declaran este monto en el portal SENIAT. El sistema CDAPUESTAS centraliza la retención de los <strong>${cashIgf16Usd} USD (Bs. {formatBs(cashIgf16Bs, 2)})</strong> y la Operadora Oficial entera el 100% al Tesoro Nacional bajo el Concepto 077 con su RIF institucional <code>J-98765432-1</code>.
            </p>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: COMPROBANTE MODELO 3 SENIAT (PREMIOS EN ESPECIE)
      ==================================================================== */}
      {showModelo3Modal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Comprobante de Retención Modelo 3 (SENIAT)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModelo3Modal(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
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
                  MODELO 3 • ART. 18 PROVIDENCIA SNAT/2026/00093
                </div>
              </div>

              <div className="space-y-1 text-[10px]">
                <div>
                  <strong>Agente de Retención:</strong> Operadora de Rifas y Loterías C.A.
                </div>
                <div>
                  <strong>RIF Agente:</strong> J-98765432-1 | <strong>RUNLOT:</strong> RUN-OP-987654
                </div>
                <div>
                  <strong>Beneficiario (Ganador):</strong> CI V-18.456.789 • Juan Pérez
                </div>
                <div>
                  <strong>Boleto Ganador:</strong> RIF-000748 (Serie A) • Sorteo Triple Táchira
                </div>
                <div>
                  <strong>Concepto:</strong> 077 - Ganancias Fortuitas en Especie
                </div>
                <div>
                  <strong>Bien Adjudicado:</strong> Toyota Yaris 0 Km (Serial NIV: 8AJ765432109)
                </div>
                <div>
                  <strong>Base Imponible (Factura):</strong> Bs. {formatBs(vehicleValueBs, 2)} (${vehicleValueUsd.toLocaleString()} USD)
                </div>
                <div>
                  <strong>Alícuota Aplicada:</strong> 16,00% (Art. 65 LISLR)
                </div>
                <div className="font-extrabold text-purple-950 border-t border-slate-300 pt-1">
                  <strong>Impuesto Retenido / Enterado:</strong> Bs. {formatBs(vehicleIgf16Bs, 2)} (${vehicleIgf16Usd.toLocaleString()} USD)
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-400 flex items-center justify-between text-[9px] text-slate-600">
                <QrCode className="w-10 h-10 text-slate-950" />
                <div className="text-right">
                  <div>Firma Digital SUSCERTE: CIV #241.890</div>
                  <div className="font-bold text-slate-800">
                    Hash: {modelo3Hash.slice(0, 20)}...
                  </div>
                  <div>Habilitado para Acta de Entrega Art. 25</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModelo3Modal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

