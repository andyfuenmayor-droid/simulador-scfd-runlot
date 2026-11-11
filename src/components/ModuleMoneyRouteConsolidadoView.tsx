"use client";

import React, { useState } from "react";
import { RecordedPOSTicket } from "@/types/simulator";
import { formatBs, generateDeterministicSha256 } from "@/lib/cryptoUtils";
import {
  Award,
  Building2,
  Car,
  CheckCircle2,
  Coins,
  Download,
  FileCode2,
  FileText,
  Landmark,
  Layers,
  Scale,
  ShieldCheck,
  Store,
  Ticket,
} from "lucide-react";

interface ModuleMoneyRouteConsolidadoViewProps {
  lotteryTickets?: RecordedPOSTicket[];
}

export const ModuleMoneyRouteConsolidadoView: React.FC<
  ModuleMoneyRouteConsolidadoViewProps
> = ({ lotteryTickets = [] }) => {
  const bcvRate = 40;

  // Totales Lotería
  const lotTotalSales = lotteryTickets.reduce((a, b) => a + b.totalFacial, 0);
  const lotGrossPrize = lotteryTickets.reduce(
    (a, b) => a + b.guaranteedOrMaxGrossPrize,
    0
  );
  const lotIgf16 = lotteryTickets.reduce(
    (a, b) => a + b.guaranteedOrMaxIgf16,
    0
  );
  const lotNetPaid = lotteryTickets.reduce(
    (a, b) => a + b.guaranteedOrMaxNetPrize,
    0
  );

  // Rifas simuladas (Emisión estándar 1.000 boletos a $10 USD = $10.000 USD / Bs. 400.000)
  const rifaTotalSalesBs = 400000; // $10.000 USD
  const rifaCashPrizeBs = 40000; // $1.000 USD
  const rifaCashIgf16Bs = rifaCashPrizeBs * 0.16; // Bs. 6.400 ($160 USD)
  const rifaCashNetBs = rifaCashPrizeBs - rifaCashIgf16Bs; // Bs. 33.600 ($840 USD)

  const rifaVehiclePrizeBs = 280000; // $7.000 USD (70% emisión)
  const rifaVehicleIgf16Bs = rifaVehiclePrizeBs * 0.16; // Bs. 44.800 ($1.120 USD)

  // Gran Total Consolidado
  const grandTotalSalesBs = lotTotalSales + rifaTotalSalesBs;
  const grandTotalGrossPrizesBs =
    lotGrossPrize + rifaCashPrizeBs + rifaVehiclePrizeBs;
  const grandTotalIgf16Bs =
    lotIgf16 + rifaCashIgf16Bs + rifaVehicleIgf16Bs;
  const grandTotalNetPrizesBs =
    lotNetPaid + rifaCashNetBs + rifaVehiclePrizeBs; // Vehículo entregado completo

  return (
    <div className="space-y-6">
      {/* Banner Superior de Consolidación */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Consolidación Fiscal SENIAT: Lotería Tradicional + Rifas Oficiales</span>
          </div>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30 font-bold">
            Agente Único: Operadora Oficial C.A. (J-98765432-1)
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Demostración de la armonización tributaria integral: tanto las loterías tradicionales (Triples y Animalitos) como las rifas en metálico y especie convergen en una <strong>única declaración mensual XML ante el SENIAT (Planilla 99029 • Concepto 077)</strong>. Las Taquillas y Comercializadoras quedan exoneradas de retener y enterar, eliminando la duplicidad de reportes fiscales.
        </p>
      </div>

      {/* Grid de 4 Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400">Ventas Consolidadas Red:</span>
          <div className="text-lg font-black text-white">
            Bs. {formatBs(grandTotalSalesBs, 2)}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Lotería: Bs. {formatBs(lotTotalSales, 0)} | Rifas: Bs. {formatBs(rifaTotalSalesBs, 0)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400">Premios Brutos Liquidados:</span>
          <div className="text-lg font-black text-amber-300">
            Bs. {formatBs(grandTotalGrossPrizesBs, 2)}
          </div>
          <span className="text-[10px] text-amber-400/80 block">
            Efectivo + Metálico + Vehículo 0 Km
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
          <span className="text-amber-300 font-bold">Total Retención 16% IGF:</span>
          <div className="text-xl font-black text-amber-400">
            Bs. {formatBs(grandTotalIgf16Bs, 2)}
          </div>
          <span className="text-[10px] text-amber-300 block">
            Enterado al SENIAT (Planilla 99029)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
          <span className="text-emerald-300 font-bold">Premios Netos al Público:</span>
          <div className="text-lg font-black text-emerald-400">
            Bs. {formatBs(grandTotalNetPrizesBs, 2)}
          </div>
          <span className="text-[10px] text-emerald-300 block">
            84% Efectivo + Vehículo 100% íntegro
          </span>
        </div>
      </div>

      {/* Tabla Maestra Comparativa de Retenciones por Modalidad */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-xs text-left font-mono">
          <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800 uppercase">
            <tr>
              <th className="p-3">Modalidad / Juego</th>
              <th className="p-3">Sujeto / Ente</th>
              <th className="p-3 text-right">Venta Facial (Bs.)</th>
              <th className="p-3 text-right">Premio Bruto (Bs.)</th>
              <th className="p-3 text-right text-rose-400">16% IGF SENIAT (Bs.)</th>
              <th className="p-3 text-right text-emerald-400">Neto al Ganador (Bs.)</th>
              <th className="p-3 text-center">Mecánica Legal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {/* Fila 1: Triples */}
            <tr>
              <td className="p-3 font-bold text-white flex items-center gap-2">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                <span>Triples Tradicionales (600x)</span>
              </td>
              <td className="p-3 text-slate-400">Lotería del Zulia / Táchira</td>
              <td className="p-3 text-right font-bold text-white">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "triples")?.totalFacial || 1000000, 2)}
              </td>
              <td className="p-3 text-right text-slate-200">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "triples")?.guaranteedOrMaxGrossPrize || 600000, 2)}
              </td>
              <td className="p-3 text-right font-bold text-rose-400">
                -Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "triples")?.guaranteedOrMaxIgf16 || 96000, 2)}
              </td>
              <td className="p-3 text-right font-bold text-emerald-400">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "triples")?.guaranteedOrMaxNetPrize || 504000, 2)}
              </td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                  Retención en Caja (84%)
                </span>
              </td>
            </tr>

            {/* Fila 2: Animalitos */}
            <tr>
              <td className="p-3 font-bold text-white flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Animalitos Figuras (30x)</span>
              </td>
              <td className="p-3 text-slate-400">Lotería de Oriente / Zulia</td>
              <td className="p-3 text-right font-bold text-white">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "animalitos")?.totalFacial || 38000, 2)}
              </td>
              <td className="p-3 text-right text-slate-200">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "animalitos")?.guaranteedOrMaxGrossPrize || 30000, 2)}
              </td>
              <td className="p-3 text-right font-bold text-rose-400">
                -Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "animalitos")?.guaranteedOrMaxIgf16 || 4800, 2)}
              </td>
              <td className="p-3 text-right font-bold text-emerald-400">
                Bs. {formatBs(lotteryTickets.find((t) => t.modalityId === "animalitos")?.guaranteedOrMaxNetPrize || 25200, 2)}
              </td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                  Retención en Caja (84%)
                </span>
              </td>
            </tr>

            {/* Fila 3: Rifa Metálico */}
            <tr>
              <td className="p-3 font-bold text-white flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Rifa Premios Metálico ($1.000)</span>
              </td>
              <td className="p-3 text-slate-400">Aproximaciones / Terminales</td>
              <td className="p-3 text-right font-bold text-white">
                (Incluido en Rifa)
              </td>
              <td className="p-3 text-right text-slate-200">
                Bs. {formatBs(rifaCashPrizeBs, 2)}
              </td>
              <td className="p-3 text-right font-bold text-rose-400">
                -Bs. {formatBs(rifaCashIgf16Bs, 2)}
              </td>
              <td className="p-3 text-right font-bold text-emerald-400">
                Bs. {formatBs(rifaCashNetBs, 2)}
              </td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                  Retención en Caja (84%)
                </span>
              </td>
            </tr>

            {/* Fila 4: Rifa Vehículo en Especie */}
            <tr>
              <td className="p-3 font-bold text-white flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>Rifa Premio Vehículo 0 Km (70%)</span>
              </td>
              <td className="p-3 text-slate-400">Lotería del Táchira (Triple Táchira)</td>
              <td className="p-3 text-right font-bold text-white">
                Bs. {formatBs(rifaTotalSalesBs, 2)}
              </td>
              <td className="p-3 text-right text-amber-300 font-bold">
                Bs. {formatBs(rifaVehiclePrizeBs, 2)}
              </td>
              <td className="p-3 text-right font-bold text-rose-400">
                -Bs. {formatBs(rifaVehicleIgf16Bs, 2)}
              </td>
              <td className="p-3 text-right font-bold text-amber-300">
                Vehículo 0 Km Íntegro
              </td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  Comprobante Modelo 3
                </span>
              </td>
            </tr>

            {/* Fila Totalizadora */}
            <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-sm">
              <td className="p-3.5 text-white" colSpan={2}>
                TOTAL CONSOLIDADO SENIAT (PLANILLA 99029 • XML CONCEPTO 077)
              </td>
              <td className="p-3.5 text-right font-extrabold text-white">
                Bs. {formatBs(grandTotalSalesBs, 2)}
              </td>
              <td className="p-3.5 text-right font-extrabold text-amber-300">
                Bs. {formatBs(grandTotalGrossPrizesBs, 2)}
              </td>
              <td className="p-3.5 text-right font-black text-rose-400 text-base">
                -Bs. {formatBs(grandTotalIgf16Bs, 2)}
              </td>
              <td className="p-3.5 text-right font-black text-emerald-400">
                Bs. {formatBs(grandTotalNetPrizesBs, 2)}
              </td>
              <td className="p-3.5 text-center text-emerald-300">
                ✓ 100% ENTERADO
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
