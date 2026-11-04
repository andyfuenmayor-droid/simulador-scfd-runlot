"use client";

import React, { useState } from "react";
import { RecordedPOSTicket, GameModalityId } from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  generateSeniatWithholdingXML,
  generateDeterministicSha256,
} from "@/lib/cryptoUtils";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  HelpCircle,
  Landmark,
  Layers,
  Lock,
  Printer,
  QrCode,
  Receipt,
  Scale,
  Send,
  ShieldCheck,
  Store,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  AlertCircle,
} from "lucide-react";

interface ModuleMoneyRouteIGFProps {
  recordedTickets?: RecordedPOSTicket[];
  onGoToPOS?: () => void;
  onGoToModule2?: () => void;
}

export const ModuleMoneyRouteIGF: React.FC<ModuleMoneyRouteIGFProps> = ({
  recordedTickets = [],
  onGoToPOS,
  onGoToModule2,
}) => {
  const [activeStation, setActiveStation] = useState<number>(2); // Por defecto en estación 2 (Taquilla)
  const [selectedTicketFilter, setSelectedTicketFilter] =
    useState<string>("ALL");
  const [copiedXml, setCopiedXml] = useState<boolean>(false);
  const [showArcModal, setShowArcModal] = useState<boolean>(false);
  const [selectedModalityPreview, setSelectedModalityPreview] = useState<
    "triples" | "animalitos"
  >("triples");

  // Alimentación estricta y exclusiva desde los tickets/jugadas reales de la taquilla
  const sourceTickets = recordedTickets;
  const hasRealTickets = sourceTickets.length > 0;

  const activeTickets = sourceTickets.filter((t) => {
    if (selectedTicketFilter === "ALL") return true;
    if (selectedTicketFilter === "MOD_TRIPLES") return t.modalityId === "triples";
    if (selectedTicketFilter === "MOD_ANIMALITOS")
      return t.modalityId === "animalitos";
    return t.ticketNumber === selectedTicketFilter;
  });

  // ============================================================================
  // CÁLCULO DINÁMICO DE LOS 3 NIVELES POR CADA TICKET INTRODUCIDO
  // ============================================================================
  interface DynamicRouteItem {
    ticket: RecordedPOSTicket;
    sales: number;
    grossPrize: number;
    igf16: number;
    netPaidToWinner: number;
    // Nivel 1: Taquilla
    taquillaCommPct: number;
    taquillaCommAmount: number;
    taquillaIaeAmount: number;
    taquillaNetMargin: number;
    taquillaCashBalance: number;
    // Nivel 2: Comercializadora
    operTotalAssignedCommPct: number;
    operTotalAssignedCommAmount: number;
    spreadPct: number;
    spreadAmount: number;
    comerIaeAmount: number;
    comerFinalComm: number;
    totalCommChain: number;
    alcaldia25OnComms: number;
    netWinBase: number;
    netWin: number;
    comerNetWin50: number;
    comerTotalResult: number;
    // Nivel 3: Operadora
    operNetWin50: number;
    seniatRate: number;
    iobpasRate: number;
    seniatGGR: number;
    iobpasRoyalty: number;
    operSurplus: number;
  }

  const items: DynamicRouteItem[] = activeTickets.map((t) => {
    const isAnimalitos = t.modalityId === "animalitos";
    const sales = t.totalFacial;
    const grossPrize = t.isFullTiraje
      ? t.guaranteedOrMaxGrossPrize
      : isAnimalitos
      ? sales * (30 / 38)
      : sales * (600 / 1000);

    const igf16 = grossPrize * 0.16;
    const netPaidToWinner = grossPrize - igf16;

    // Nivel 1: Taquilla
    const taquillaCommPct = isAnimalitos ? 12 : 20;
    const taquillaCommAmount = sales * (taquillaCommPct / 100);
    const taquillaIaeAmount = taquillaCommAmount * 0.025;
    const taquillaNetMargin = taquillaCommAmount - taquillaIaeAmount;
    const taquillaCashBalance = sales - netPaidToWinner - taquillaCommAmount;

    // Nivel 2: Comercializadora
    // Comisión Total asignada por Operadora: 25% Triples / 18% Animalitos
    // (-) Comisión cedida a Taquilla: -20% Triples / -12% Animalitos
    // (=) DIFERENCIAL DE COMISIÓN (Spread Propio): 5% Triples / 6% Animalitos
    const operTotalAssignedCommPct = isAnimalitos ? 18 : 25;
    const operTotalAssignedCommAmount = sales * (operTotalAssignedCommPct / 100);
    const spreadPct = operTotalAssignedCommPct - taquillaCommPct;
    const spreadAmount = sales * (spreadPct / 100);
    const comerIaeAmount = spreadAmount * 0.025;
    const comerFinalComm = spreadAmount - comerIaeAmount;

    // GGR del Neto solicitado expresamente por el usuario: GGR = Venta - Premios
    const ggrNeto = Math.max(0, sales - grossPrize);

    // Nivel 3: Operadora
    // 1) SENIAT sobre GGR (Venta - Premios): 10% Armonizado para todos (Triples y Animalitos)
    const seniatRate = 0.10;
    const seniatGGR = ggrNeto * seniatRate;

    // 2) Royalty Lotería IOBPAS: 5% Triples / 1% Animalitos sobre GGR
    const iobpasRate = isAnimalitos ? 0.01 : 0.05;
    const iobpasRoyalty = ggrNeto * iobpasRate;
    const totalGameTaxes = seniatGGR + iobpasRoyalty;

    const totalCommChain = taquillaCommAmount + spreadAmount;
    const alcaldia25OnComms = totalCommChain * 0.025;

    // Net Win de Juego = GGR - Comisiones de Red
    const netWinBase = Math.max(0, ggrNeto - totalCommChain);
    // Net Win Distribuible tras tributos SENIAT e IOBPAS
    const distributableNetWin = Math.max(0, netWinBase - totalGameTaxes);
    const comerNetWin50 = distributableNetWin * 0.5;
    const comerTotalResult = comerFinalComm + comerNetWin50;

    const operNetWin50 = distributableNetWin * 0.5;
    // IAE Municipal en Operadora = Bs. 0,00 (Prohibición constitucional de doble tributación)
    const operIae = 0;
    const operSurplus = operNetWin50 - operIae;

    return {
      ticket: t,
      sales,
      grossPrize,
      igf16,
      netPaidToWinner,
      ggrNeto,
      taquillaCommPct,
      taquillaCommAmount,
      taquillaIaeAmount,
      taquillaNetMargin,
      taquillaCashBalance,
      operTotalAssignedCommPct,
      operTotalAssignedCommAmount,
      spreadPct,
      spreadAmount,
      comerIaeAmount,
      comerFinalComm,
      totalCommChain,
      alcaldia25OnComms,
      netWinBase,
      netWin: distributableNetWin,
      comerNetWin50,
      comerTotalResult,
      operNetWin50,
      seniatRate,
      iobpasRate,
      seniatGGR,
      iobpasRoyalty,
      operSurplus,
    };
  });

  // TOTALES CONSOLIDADOS DINÁMICOS
  const totalSales = items.reduce((a, b) => a + b.sales, 0);
  const totalGrossPrize = items.reduce((a, b) => a + b.grossPrize, 0);
  const totalIgf16 = items.reduce((a, b) => a + b.igf16, 0);
  const totalNetPaidToWinner = items.reduce(
    (a, b) => a + b.netPaidToWinner,
    0
  );

  // Totales Nivel 1
  const totalTaquillaComm = items.reduce((a, b) => a + b.taquillaCommAmount, 0);
  const totalTaquillaIae = items.reduce((a, b) => a + b.taquillaIaeAmount, 0);
  const totalTaquillaNetMargin = items.reduce(
    (a, b) => a + b.taquillaNetMargin,
    0
  );
  const totalTaquillaCashBalance = items.reduce(
    (a, b) => a + b.taquillaCashBalance,
    0
  );

  // Totales Nivel 2
  const totalOperTotalAssignedComm = items.reduce(
    (a, b) => a + b.operTotalAssignedCommAmount,
    0
  );
  const totalSpreadAmount = items.reduce((a, b) => a + b.spreadAmount, 0);
  const totalComerIae = items.reduce((a, b) => a + b.comerIaeAmount, 0);
  const totalComerFinalComm = items.reduce(
    (a, b) => a + b.comerFinalComm,
    0
  );
  const totalNetWinBase = items.reduce((a, b) => a + b.netWinBase, 0);
  const totalNetWin = items.reduce((a, b) => a + b.netWin, 0);
  const totalComerNetWin50 = items.reduce((a, b) => a + b.comerNetWin50, 0);
  const totalComerTotalResult = items.reduce(
    (a, b) => a + b.comerTotalResult,
    0
  );

  // Totales Nivel 3
  const totalOperNetWin50 = items.reduce((a, b) => a + b.operNetWin50, 0);
  const totalSeniatGGR = items.reduce((a, b) => a + b.seniatGGR, 0);
  const totalIobpasRoyalty = items.reduce((a, b) => a + b.iobpasRoyalty, 0);
  const totalOperSurplus = items.reduce((a, b) => a + b.operSurplus, 0);
  const totalGgrNeto = Math.max(0, totalSales - totalGrossPrize);
  const totalOperIae = 0; // IAE Operadora 0% por prohibición constitucional de doble tributación

  // Desglose por modalidad
  const triplesItems = items.filter((i) => i.ticket.modalityId === "triples");
  const animalitosItems = items.filter(
    (i) => i.ticket.modalityId === "animalitos"
  );

  const triplesGrossPrize = triplesItems.reduce((a, b) => a + b.grossPrize, 0);
  const triplesIgf16 = triplesItems.reduce((a, b) => a + b.igf16, 0);
  const triplesNetPaid = triplesItems.reduce(
    (a, b) => a + b.netPaidToWinner,
    0
  );

  const animalitosGrossPrize = animalitosItems.reduce(
    (a, b) => a + b.grossPrize,
    0
  );
  const animalitosIgf16 = animalitosItems.reduce((a, b) => a + b.igf16, 0);
  const animalitosNetPaid = animalitosItems.reduce(
    (a, b) => a + b.netPaidToWinner,
    0
  );

  // Generación de XML SENIAT oficial Planilla 99029 basado en los datos reales activos
  const xmlContent = generateSeniatWithholdingXML({
    rifAgente: "J-98765432-1",
    periodo: "202611",
    items: items.map((it, idx) => ({
      rifRetenido:
        it.ticket.modalityId === "triples" ? "V-18456789" : "V-24589123",
      numeroTicket: `TKT-${it.ticket.ticketNumber}`,
      numeroControl: `CTL-${it.ticket.drawNumber}-RUN009-${it.ticket.modalityId.toUpperCase()}`,
      fechaOperacion: it.ticket.timestamp.split(" ")[0] || "02/11/2026",
      montoOperacion: it.grossPrize,
      porcentajeRetencion: 16.0,
      montoRetenido: it.igf16,
    })),
  });

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SENIAT_RETENCION_16_IGF_PERIODO_202611_J987654321.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const certificateSha256 = generateDeterministicSha256(
    `ARC-16%::J-98765432-1::${totalGrossPrize}::${totalIgf16}::${totalNetPaidToWinner}::2026-11-02`
  );

  // Las 5 estaciones del recorrido del dinero
  const stations = [
    {
      step: 1,
      title: "1. Apostador Ganador",
      subtitle: "Acierto de Jugada",
      icon: Users,
      badge: "Premio Bruto Total",
      amount: `Bs. ${formatBs(totalGrossPrize, 2)}`,
      detail:
        "El apostador acierta la combinación ganadora en taquilla. Nace el hecho imponible establecido en el Art. 65 de la LISLR (Ganancias fortuitas en juegos de lotería).",
    },
    {
      step: 2,
      title: "2. Taquilla POS",
      subtitle: "Desembolso 84% Efectivo",
      icon: Store,
      badge: "Efectivo Sale de Caja",
      amount: `Bs. ${formatBs(totalNetPaidToWinner, 2)}`,
      detail: `La taquilla POS aplica de forma automática la retención del 16% (-Bs. ${formatBs(
        totalIgf16,
        2
      )}) y únicamente entrega en efectivo al ganador el 84% (Bs. ${formatBs(
        totalNetPaidToWinner,
        2
      )}). Este es el ÚNICO monto que reduce físicamente el saldo de caja del agenciero.`,
    },
    {
      step: 3,
      title: "3. Retención en Custodia",
      subtitle: "Pasivo Fiscal de Red",
      icon: Lock,
      badge: "16% Protegido en Balance",
      amount: `Bs. ${formatBs(totalIgf16, 2)}`,
      detail: `Los Bs. ${formatBs(
        totalIgf16,
        2
      )} retenidos NO constituyen ingreso propio ni para la taquilla ni para la comercializadora. El sistema CDAPUESTAS los mantiene como pasivo de recaudación en custodia telemática para la Operadora.`,
    },
    {
      step: 4,
      title: "4. Operadora de Juegos",
      subtitle: "Agente Único Responsable",
      icon: Landmark,
      badge: "Art. 9.2 Dcto. 1.808",
      amount: `Bs. ${formatBs(totalIgf16, 2)}`,
      detail: `La Operadora Lotería Oficial C.A. (RIF J-98765432-1 • Licencia IOBPAS LOT-OF-019) asume en exclusiva la titularidad como Agente de Retención, eximiendo a las taquillas y comercializadoras de declarar retenciones en el portal SENIAT.`,
    },
    {
      step: 5,
      title: "5. Portal SENIAT",
      subtitle: "Enteramiento Planilla 99029",
      icon: FileCode2,
      badge: "Concepto 077 Oficial",
      amount: `Bs. ${formatBs(totalIgf16, 2)}`,
      detail: `La Operadora transmite el archivo XML masivo (Concepto 077) y entera el 100% de los Bs. ${formatBs(
        totalIgf16,
        2
      )} en el Portal Fiscal mediante la Planilla Forma 99029, emitiendo el Comprobante Electrónico ARC para el ganador.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ====================================================================
          BARRA DE ENCABEZADO DEL MÓDULO CON METADATOS EN VIVO
      ==================================================================== */}
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Ruta del Dinero del 16% IGF (Art. 65 LISLR + Dcto. 1.808 - Concepto 077)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase">
                  Datos Sincronizados
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Flujo financiero integral calculado con los datos reales de la Taquilla, Comercializadora y Operadora
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArcModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all font-mono"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Comprobante ARC (80 mm)
            </button>
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all font-mono"
            >
              <Download className="w-4 h-4" />
              Descargar XML SENIAT
            </button>
          </div>
        </div>

        {/* SELECTOR DE TICKETS ACTIVOS / FILTROS DE TAQUILLA */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Store className="w-4 h-4 text-blue-400" />
            <span className="font-bold">Tickets en Taquilla ({sourceTickets.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedTicketFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                selectedTicketFilter === "ALL"
                  ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({sourceTickets.length})
            </button>
            {sourceTickets.some((t) => t.modalityId === "triples") && (
              <button
                type="button"
                onClick={() => setSelectedTicketFilter("MOD_TRIPLES")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedTicketFilter === "MOD_TRIPLES"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300"
                }`}
              >
                Solo Triples
              </button>
            )}
            {sourceTickets.some((t) => t.modalityId === "animalitos") && (
              <button
                type="button"
                onClick={() => setSelectedTicketFilter("MOD_ANIMALITOS")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedTicketFilter === "MOD_ANIMALITOS"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-300"
                }`}
              >
                Solo Animalitos
              </button>
            )}
            {onGoToPOS && (
              <button
                type="button"
                onClick={onGoToPOS}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 ml-1"
              >
                + Cargar en POS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          PANEL 1: MONITOR DE FLUJO Y CUADRATURA EN VIVO
      ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-sans text-slate-400">
              1. Premios Brutos (100%)
            </span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            Bs. {formatBs(totalGrossPrize, 2)}
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            Venta captada: Bs. {formatBs(totalSales, 2)}. Base imponible total generada.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-sans text-emerald-700 dark:text-emerald-300">
              2. Efectivo Pagado (84%)
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-2">
            Bs. {formatBs(totalNetPaidToWinner, 2)}
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 font-sans mt-1">
            Desembolsado en taquilla. <strong>Único monto</strong> que reduce la caja física.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/40 shadow-xl bg-red-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-sans text-rose-700 dark:text-red-300">
              3. Retenido 16% IGF
            </span>
            <Lock className="w-4 h-4 text-rose-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-red-400 font-mono mt-2">
            Bs. {formatBs(totalIgf16, 2)}
          </div>
          <p className="text-[11px] text-rose-800 dark:text-red-300/80 font-sans mt-1">
            Pasivo protegido en balance para enteramiento directo al SENIAT.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-sans text-amber-300">
              4. Lote Fiscal Planilla 99029
            </span>
            <FileCode2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-extrabold text-white font-mono mt-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            BATCH-2026-11-{items.length.toString().padStart(3, "0")}
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1.5">
            {items.length} {items.length === 1 ? "registro conciliado" : "registros conciliados"} listos para transmisión XML.
          </p>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          NUEVO PANEL: CONCILIACIÓN EN LOS 3 NIVELES DE LA CADENA
          (TAQUILLA • COMERCIALIZADORA • OPERADORA)
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Conciliación y Responsabilidad en los 3 Niveles de la Cadena
              </h3>
              <p className="text-[11px] text-slate-400">
                Flujo financiero exacto introducido por la Taquilla, Comercializadora y Operadora
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40">
            Venta Red: Bs. {formatBs(totalSales, 2)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NIVEL 1: TAQUILLA */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-500/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  Nivel 1: Taquilla
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold">
                  Punto de Venta
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Venta Captada:</span>
                  <span className="font-bold text-white">Bs. {formatBs(totalSales, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>(-) Efectivo Pagado (84%):</span>
                  <span>-Bs. {formatBs(totalNetPaidToWinner, 2)}</span>
                </div>
                <div className="flex justify-between text-blue-300">
                  <span>(+) Comisión Bruta:</span>
                  <span>+Bs. {formatBs(totalTaquillaComm, 2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>(-) IAE 2,5% s/ Comisión:</span>
                  <span>-Bs. {formatBs(totalTaquillaIae, 2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-extrabold text-blue-300">
                <span>(=) Margen Neto Libre:</span>
                <span className="text-sm">+Bs. {formatBs(totalTaquillaNetMargin, 2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                97,5% de su comisión retenido. La taquilla queda exonerada de enterar retenciones al SENIAT.
              </p>
              {/* LIQUIDACIÓN IGF EN CUSTODIA AL FINAL SIN SUMAR EN NADA */}
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] font-mono flex justify-between items-center text-slate-400">
                <span>Retención 16% IGF (Custodia):</span>
                <span className="font-bold text-red-400">Bs. {formatBs(totalIgf16, 2)}</span>
              </div>
            </div>
          </div>

          {/* NIVEL 2: COMERCIALIZADORA */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Nivel 2: Comercializadora
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                  Intermediaria
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                {/* VENTA Y PREMIOS EN LA ECUACIÓN */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Venta de Red:</span>
                  <span className="font-bold text-white">Bs. {formatBs(totalSales, 2)}</span>
                </div>
                <div className="flex justify-between text-red-400 font-semibold">
                  <span>(-) Premios Acertados:</span>
                  <span>-Bs. {formatBs(totalGrossPrize, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  <span>(=) GGR de Red (Venta - Premios):</span>
                  <span>Bs. {formatBs(totalGgrNeto, 2)}</span>
                </div>
                {/* RESTA DEL DIFERENCIAL DE COMISIONES */}
                <div className="flex justify-between text-slate-300 pt-0.5 text-[11px]">
                  <span>(+) Comisión Total Operadora (25%/18%):</span>
                  <span>+Bs. {formatBs(totalOperTotalAssignedComm, 2)}</span>
                </div>
                <div className="flex justify-between text-red-400 text-[11px]">
                  <span>(-) Comisión Cedida a Taquilla (20%/12%):</span>
                  <span>-Bs. {formatBs(totalTaquillaComm, 2)}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold border-b border-slate-800 pb-0.5">
                  <span>(=) Diferencial de Comisión (Spread 5%/6%):</span>
                  <span>+Bs. {formatBs(totalSpreadAmount, 2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>(-) IAE 2,5% s/ Diferencial:</span>
                  <span>-Bs. {formatBs(totalComerIae, 2)}</span>
                </div>
                <div className="flex justify-between text-amber-800 dark:text-amber-200 font-bold">
                  <span>Comisiones Finales (Neto):</span>
                  <span>Bs. {formatBs(totalComerFinalComm, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>(+) 50% Net Win:</span>
                  <span>+Bs. {formatBs(totalComerNetWin50, 2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-extrabold text-amber-300">
                <span>(=) Resultado Neto Propio:</span>
                <span className="text-sm">+Bs. {formatBs(totalComerTotalResult, 2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Comisión neta + 50% Net Win. Fondos de terceros en custodia telemática (Arts. 32-33).
              </p>
              {/* LIQUIDACIÓN IGF EN TRÁNSITO AL FINAL SIN SUMAR EN NADA */}
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] font-mono flex justify-between items-center text-slate-400">
                <span>Retención 16% IGF en Tránsito:</span>
                <span className="font-bold text-red-400">Bs. {formatBs(totalIgf16, 2)}</span>
              </div>
            </div>
          </div>

          {/* NIVEL 3: OPERADORA */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  Nivel 3: Operadora
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold">
                  Agente Único
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                {/* VENTA Y PREMIOS EN LA ECUACIÓN */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Venta de Red:</span>
                  <span className="font-bold text-white">Bs. {formatBs(totalSales, 2)}</span>
                </div>
                <div className="flex justify-between text-red-400 font-semibold">
                  <span>(-) Premios Acertados:</span>
                  <span>-Bs. {formatBs(totalGrossPrize, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  <span>(=) GGR del Neto (Venta - Premios):</span>
                  <span>Bs. {formatBs(totalGgrNeto, 2)}</span>
                </div>
                {/* RESTA DE COMISIONES DE LA RED */}
                <div className="flex justify-between text-red-400 text-[11px] pt-0.5">
                  <span>(-) Comisión Taquilla (20%/12%):</span>
                  <span>-Bs. {formatBs(totalTaquillaComm, 2)}</span>
                </div>
                <div className="flex justify-between text-red-400 text-[11px]">
                  <span>(-) Diferencial Comercializadora (5%/6%):</span>
                  <span>-Bs. {formatBs(totalSpreadAmount, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-300 font-bold border-b border-slate-800 pb-0.5">
                  <span>(=) Net Win de la Operación:</span>
                  <span>Bs. {formatBs(totalNetWinBase, 2)}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>(-) SENIAT GGR (10% Armonizado para todos):</span>
                  <span className="text-red-400">-Bs. {formatBs(totalSeniatGGR, 2)}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>(-) Royalty IOBPAS (5% Triples / 1% Animalitos s/ GGR):</span>
                  <span className="text-red-400">-Bs. {formatBs(totalIobpasRoyalty, 2)}</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>(+) 50% Net Win Operadora:</span>
                  <span>+Bs. {formatBs(totalOperNetWin50, 2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>(-) IAE Municipal Operadora:</span>
                  <span className="text-emerald-400 font-bold">Bs. 0,00 (No Aplica)</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-extrabold text-emerald-400">
                <span>(=) Superávit Operativo Neto:</span>
                <span className="text-sm">+Bs. {formatBs(totalOperSurplus, 2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Operación solvente y sostenible tras enterar tributos de juego y tasas municipales.
              </p>
              {/* LIQUIDACIÓN DEL IGF AL FINAL SIN SUMARLO EN NADA */}
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-red-950/30 border border-rose-200 dark:border-red-500/30 text-xs font-mono">
                <div className="flex justify-between items-center text-rose-800 dark:text-red-300 font-bold">
                  <span>Liquidación Retención 16% IGF:</span>
                  <span className="text-sm font-extrabold text-rose-700 dark:text-red-400">Bs. {formatBs(totalIgf16, 2)}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 flex justify-between">
                  <span>Planilla SENIAT Forma 99029 (XML)</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">(Fondos Terceros • No suma al resultado)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          PANEL 2: DIAGRAMA INTERACTIVO DE LAS 5 ESTACIONES DEL DINERO
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Pipeline Financiero: Recorrido del 16% IGF en 5 Estaciones
              </h3>
              <p className="text-[11px] text-slate-400">
                Haz clic en cualquier estación para auditar su asiento contable y sustento legal
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-700">
            Estación Activa: #{activeStation}
          </span>
        </div>

        {/* CADENA DE PASOS CON FLECHAS */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {stations.map((st) => {
            const Icon = st.icon;
            const isSelected = activeStation === st.step;
            return (
              <div
                key={st.step}
                onClick={() => setActiveStation(st.step)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-950 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/40"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Paso 0{st.step}
                    </span>
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-emerald-400" : "text-slate-500"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {st.title}
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-sans mt-0.5">
                    {st.subtitle}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-mono font-black text-emerald-400">
                    {st.amount}
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 mt-1 inline-block">
                    {st.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DETALLE EXPANDIDO DE LA ESTACIÓN SELECCIONADA */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold font-mono text-sm mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Detalle Técnico y Jurídico de la Estación #{activeStation}: {stations[activeStation - 1].title}</span>
          </div>
          <p className="text-slate-300 font-sans text-xs leading-relaxed">
            {stations[activeStation - 1].detail}
          </p>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          PANEL 3: CUADRO COMPARATIVO POR MODALIDAD
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Liquidación Discriminada del IGF por Modalidad de Juego
              </h3>
              <p className="text-[11px] text-slate-400">
                Premios brutos, retención 16% y desembolso efectivo con los datos reales en taquilla
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/40">
            Venta Activa: Bs. {formatBs(totalSales, 2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Concepto de Liquidación</th>
                <th className="py-3 px-4 font-bold">Triples Tradicionales</th>
                <th className="py-3 px-4 font-bold">Sorteos Animalitos</th>
                <th className="py-3 px-4 font-bold text-right">Consolidado Total Red</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              <tr>
                <td className="py-2.5 px-4 text-slate-200 font-sans font-semibold">
                  1. Venta Facial Captada (100%)
                </td>
                <td className="py-2.5 px-4 text-slate-300 font-bold">
                  Bs. {formatBs(triplesItems.reduce((a, b) => a + b.sales, 0), 2)}
                </td>
                <td className="py-2.5 px-4 text-slate-300 font-bold">
                  Bs. {formatBs(animalitosItems.reduce((a, b) => a + b.sales, 0), 2)}
                </td>
                <td className="py-2.5 px-4 text-right text-white font-extrabold">
                  Bs. {formatBs(totalSales, 2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-200 font-sans font-semibold">
                  2. Premio Bruto Teórico / Generado
                </td>
                <td className="py-2.5 px-4 text-blue-400 font-bold">
                  Bs. {formatBs(triplesGrossPrize, 2)}
                </td>
                <td className="py-2.5 px-4 text-blue-400 font-bold">
                  Bs. {formatBs(animalitosGrossPrize, 2)}
                </td>
                <td className="py-2.5 px-4 text-right text-blue-300 font-extrabold">
                  Bs. {formatBs(totalGrossPrize, 2)}
                </td>
              </tr>
              <tr className="bg-red-950/15">
                <td className="py-2.5 px-4 text-red-300 font-sans font-semibold">
                  3. (-) Retención 16% IGF (Art. 65 LISLR)
                </td>
                <td className="py-2.5 px-4 text-red-400 font-extrabold">
                  -Bs. {formatBs(triplesIgf16, 2)}
                </td>
                <td className="py-2.5 px-4 text-red-400 font-extrabold">
                  -Bs. {formatBs(animalitosIgf16, 2)}
                </td>
                <td className="py-2.5 px-4 text-right text-red-400 font-black">
                  -Bs. {formatBs(totalIgf16, 2)}
                </td>
              </tr>
              <tr className="bg-emerald-950/20">
                <td className="py-3 px-4 text-emerald-300 font-sans font-extrabold">
                  4. (=) Efectivo Entregado en Taquilla (84%)
                </td>
                <td className="py-3 px-4 text-emerald-400 font-extrabold">
                  Bs. {formatBs(triplesNetPaid, 2)}
                </td>
                <td className="py-3 px-4 text-emerald-400 font-extrabold">
                  Bs. {formatBs(animalitosNetPaid, 2)}
                </td>
                <td className="py-3 px-4 text-right text-emerald-300 font-black text-sm">
                  +Bs. {formatBs(totalNetPaidToWinner, 2)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-300 font-sans">
                  Sujeto Pasivo Retenido
                </td>
                <td className="py-2.5 px-4 text-slate-400 font-sans">Apostador Ganador</td>
                <td className="py-2.5 px-4 text-slate-400 font-sans">Apostador Ganador</td>
                <td className="py-2.5 px-4 text-right text-slate-300 font-sans">Beneficiarios del Premio</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-300 font-sans">
                  Agente de Retención Legal
                </td>
                <td className="py-2.5 px-4 text-amber-300 font-sans">Operadora (J-98765432-1)</td>
                <td className="py-2.5 px-4 text-amber-300 font-sans">Operadora (J-98765432-1)</td>
                <td className="py-2.5 px-4 text-right text-amber-300 font-sans">Lotería Oficial C.A.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-300 font-sans">
                  Estatus de Taquilla / Agenciero
                </td>
                <td className="py-2.5 px-4 text-emerald-400 font-bold font-sans">Exonerada de Retener</td>
                <td className="py-2.5 px-4 text-emerald-400 font-bold font-sans">Exonerada de Retener</td>
                <td className="py-2.5 px-4 text-right text-emerald-400 font-bold font-sans">Blindaje Fiscal 100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          PANEL 4: MATRIZ DE BLINDAJE JURÍDICO PARA LA CADENA DE VALOR
      ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BLINDAJE NIVEL 1: TAQUILLA */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Store className="w-4 h-4 text-blue-400" />
            Nivel 1: Taquilla / Agenciero
          </div>
          <div className="text-xs font-extrabold text-white">
            Exoneración Total de Agente de Retención
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Según el <strong>Art. 65 de la LISLR</strong> y el <strong>Art. 9.2 del Decreto 1.808</strong>, el agente de retención exclusivo es la persona jurídica pagadora/emisora de los juegos de lotería. La taquilla es un mero mandatario de pago. Al entregar el 84% en taquilla, queda blindada ante cualquier acusación de apropiación indebida (Art. 118 COT).
          </p>
        </div>

        {/* BLINDAJE NIVEL 2: COMERCIALIZADORA */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Layers className="w-4 h-4 text-amber-400" />
            Nivel 2: Comercializadora
          </div>
          <div className="text-xs font-extrabold text-white">
            Fondos por Cuenta de Terceros
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Bajo los <strong>Arts. 32 y 33 de la Providencia SNAT/2026/00093</strong>, el 16% retenido nunca ingresa a la cuenta de resultados de la Comercializadora como ingreso propio. Circula en custodia telemática cerrada y es conciliado diariamente en el cuadre telemático de CDAPUESTAS hacia la cuenta de la Operadora.
          </p>
        </div>

        {/* BLINDAJE NIVEL 3: OPERADORA */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Landmark className="w-4 h-4 text-emerald-400" />
            Nivel 3: Operadora de Lotería
          </div>
          <div className="text-xs font-extrabold text-white">
            Enteramiento Centralizado al SENIAT
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            La Operadora (con Licencia IOBPAS LOT-OF-019) genera el archivo XML masivo bajo el <strong>Concepto 077</strong>, lo carga en el Portal Fiscal del SENIAT dentro del plazo legal y liquida la <strong>Planilla 99029</strong>, emitiendo los certificados ARC para toda la red de terminales CDAPUESTAS.
          </p>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          PANEL 5: VISOR Y DESCARGA XML SENIAT PLANILLA 99029 EN CALIENTE
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Generador de Archivo XML Oficial SENIAT (Decreto 1.808 - Concepto 077)
              </h3>
              <p className="text-[11px] text-slate-400">
                Estructura canónica exigida para la declaración masiva de retenciones del 16% en la Planilla 99029
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyXml}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all font-mono border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              {copiedXml ? "¡Copiado al Portapapeles!" : "Copiar XML"}
            </button>
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all font-mono shadow-md shadow-emerald-950/50"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .XML ({items.length} regs)
            </button>
          </div>
        </div>

        {/* VISUALIZADOR DE CÓDIGO XML */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto max-h-[260px] overflow-y-auto">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre select-all">
            {xmlContent}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] font-mono text-slate-400">
          <span>
            Archivo validado: Formato UTF-8 • Nodo Raíz &lt;RelacionRetencionesISLR&gt; • {items.length} {items.length === 1 ? "Detalle" : "Detalles"}
          </span>
          <span className="text-emerald-400 font-bold">
            Total Retención a Declarar: Bs. {formatBs(totalIgf16, 2)}
          </span>
        </div>
      </div>



      {/* AVISO DE ESTADO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
      {!hasRealTickets && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>[ Taquilla en Blanco: Bs. 0,00 ]</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Sin Jugadas Cargadas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No hay jugadas cargadas en pantalla ni tickets emitidos en el Módulo 1. Todos los conceptos de la Ruta del Dinero se muestran en <strong>Bs. 0,00</strong>.
              </p>
            </div>
          </div>
          {onGoToPOS && (
            <button
              type="button"
              onClick={onGoToPOS}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Cargar Jugadas en POS</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL PREVIEW: COMPROBANTE FISCAL ARC (80 MM TÉRMICO)
      ==================================================================== */}
      {showArcModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Comprobante ARC • Ticket 80 mm
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArcModal(false)}
                className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-red-300 hover:text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                SALIR
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950/70">
              {/* SELECTOR DE MODALIDAD PARA EL TICKET */}
              <div className="flex items-center gap-2 mb-3 w-full max-w-[320px]">
                <button
                  type="button"
                  onClick={() => setSelectedModalityPreview("triples")}
                  className={`flex-1 py-1 text-xs font-mono rounded font-bold border ${
                    selectedModalityPreview === "triples"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  Triples (Bs. {formatBs(triplesIgf16, 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModalityPreview("animalitos")}
                  className={`flex-1 py-1 text-xs font-mono rounded font-bold border ${
                    selectedModalityPreview === "animalitos"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  Animalitos (Bs. {formatBs(animalitosIgf16, 0)})
                </button>
              </div>

              {/* TICKET TÉRMICO 80 MM (FONDO BLANCO PURO Y TEXTO NEGRO DE ALTO CONTRASTE) */}
              <div className="w-[320px] !bg-white !text-slate-950 p-4 rounded shadow-2xl font-mono text-[11px] leading-tight border border-slate-300">
                <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                  <div className="font-extrabold text-xs uppercase tracking-wider">
                    COMPROBANTE DE RETENCIÓN IGF 16%
                  </div>
                  <div className="text-[10px] text-slate-700">
                    Art. 65 LISLR • Dcto. 1.808 • Prov. SNAT/2026/00093
                  </div>
                  <div className="font-bold text-[10.5px] pt-1">
                    LOTERÍA OFICIAL C.A.
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    RIF: J-98765432-1 • Licencia IOBPAS: LOT-OF-019
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    Agente de Retención Homologado RUNLOT
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fecha / Hora:</span>
                    <span className="font-bold">02/11/2026 19:45:10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ticket Premiado:</span>
                    <span className="font-bold">
                      {selectedModalityPreview === "triples"
                        ? "TKT-TRIP-00012345"
                        : "TKT-ANIM-00009871"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Terminal POS:</span>
                    <span className="font-bold">TAQ-RUN-0412</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">C.I. / RIF Ganador:</span>
                    <span className="font-bold">
                      {selectedModalityPreview === "triples"
                        ? "V-18.456.789"
                        : "V-24.589.123"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Concepto SENIAT:</span>
                    <span className="font-bold">077 (Juegos de Lotería)</span>
                  </div>
                </div>

                <div className="py-2.5 border-b-2 border-slate-900 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Premio Bruto Ganado:</span>
                    <span className="font-extrabold">
                      Bs.{" "}
                      {formatBs(
                        selectedModalityPreview === "triples"
                          ? triplesGrossPrize
                          : animalitosGrossPrize,
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>(-) Retención 16% IGF:</span>
                    <span>
                      -Bs.{" "}
                      {formatBs(
                        selectedModalityPreview === "triples"
                          ? triplesIgf16
                          : animalitosIgf16,
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-950 font-black text-sm pt-1 border-t border-slate-300">
                    <span>EFECTIVO ENTREGADO:</span>
                    <span>
                      Bs.{" "}
                      {formatBs(
                        selectedModalityPreview === "triples"
                          ? triplesNetPaid
                          : animalitosNetPaid,
                        2
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-center pt-2.5 space-y-1">
                  <div className="text-[9px] text-slate-600">
                    Este comprobante acredita la retención del impuesto único y definitivo de acuerdo al Art. 65 de la Ley de ISLR.
                  </div>
                  <div className="font-mono text-[8px] text-slate-500 break-all pt-1">
                    SHA256: {certificateSha256.substring(0, 32)}...
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 pt-1">
                    SISTEMA CDAPUESTAS • PROTOCOLO SCFD/RUNLOT
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowArcModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 font-mono border border-slate-700"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
                CERRAR / SALIR
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 font-mono shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir ARC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
