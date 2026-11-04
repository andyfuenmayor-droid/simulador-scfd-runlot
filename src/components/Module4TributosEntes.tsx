"use client";

import React, { useState, useMemo, useEffect } from "react";
import { formatBs } from "@/lib/cryptoUtils";
import {
  Building2,
  Landmark,
  ShieldCheck,
  Cpu,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Store,
  Server,
  UserCheck,
  Dices,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Info,
  Coins,
  FileSpreadsheet,
  ExternalLink,
  Table,
  AlertCircle,
  FileText,
} from "lucide-react";
import { RecordedPOSTicket } from "@/types/simulator";

interface Module4TributosEntesProps {
  recordedTickets?: RecordedPOSTicket[];
  onGoToPOS?: () => void;
  onGoToModule2?: () => void;
}

type SubTabId =
  | "tablas_hub"
  | "alcaldias"
  | "iobpas"
  | "seniat"
  | "conalot"
  | "proyecciones";

type RunlotCategory =
  | "iobpas"
  | "centros_apuestas"
  | "comercializadoras"
  | "sistemas_informaticos"
  | "responsables_informaticos"
  | "operadoras"
  | "juegos";

export function Module4TributosEntes({
  recordedTickets = [],
  onGoToPOS,
}: Module4TributosEntesProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("tablas_hub");
  const [activeRunlotCategory, setActiveRunlotCategory] =
    useState<RunlotCategory>("sistemas_informaticos");
  const [selectedTicketFilter, setSelectedTicketFilter] =
    useState<string>("ALL");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedSheets, setCopiedSheets] = useState(false);
  const [selectedLoteria, setSelectedLoteria] = useState<string>("zulia");

  // =========================================================================
  // ALIMENTACIÓN ESTRICTA Y EXCLUSIVA DESDE LOS TICKETS DE LA TAQUILLA
  // =========================================================================
  const sourceTickets = recordedTickets;
  const hasRealTickets = sourceTickets.length > 0;

  // Filtrado de tickets
  const activeTickets = useMemo(() => {
    return sourceTickets.filter((t) => {
      if (selectedTicketFilter === "ALL") return true;
      if (selectedTicketFilter === "MOD_TRIPLES")
        return t.modalityId === "triples";
      if (selectedTicketFilter === "MOD_ANIMALITOS")
        return t.modalityId === "animalitos";
      return t.ticketNumber === selectedTicketFilter;
    });
  }, [sourceTickets, selectedTicketFilter]);

  // =========================================================================
  // CÁLCULO DINÁMICO TRIBUTARIO Y FINANCIERO ALIMENTADO POR LA TAQUILLA
  // =========================================================================
  interface CalculatedTicketTributes {
    ticket: RecordedPOSTicket;
    sales: number;
    grossPrize: number;
    igf16: number;
    netPaidToWinner: number;
    ggrNeto: number;
    // Nivel 1: Taquilla
    taquillaCommPct: number;
    taquillaCommAmount: number;
    taquillaIaeAmount: number;
    taquillaNetMargin: number;
    // Nivel 2: Comercializadora
    operAssignedCommPct: number;
    operAssignedCommAmount: number;
    spreadPct: number;
    spreadAmount: number;
    comerIaeAmount: number;
    comerFinalComm: number;
    // Tributos sobre GGR
    seniatGGR: number;
    iobpasRoyalty: number;
    // Nivel 3: Operadora
    operNetWin50: number;
    operIaeAmount: number;
    operSurplus: number;
    // Esquema Vigente (Confiscatorio s/ Facial para tabla comparativa)
    vigenteTaquillaIae: number;
    vigenteComerIae: number;
    vigenteOperIae: number;
    vigenteTotalIae: number;
  }

  const calculatedItems: CalculatedTicketTributes[] = useMemo(() => {
    return activeTickets.map((t) => {
      const isAnimalitos = t.modalityId === "animalitos";
      const sales = t.totalFacial;

      // Premios brutos calculados según jugada / tiraje
      const grossPrize = t.isFullTiraje
        ? t.guaranteedOrMaxGrossPrize
        : isAnimalitos
        ? sales * (30 / 38)
        : sales * (600 / 1000);

      // Retención 16% IGF (Art. 18 Providencia / Dcto. 1.808)
      const igf16 = grossPrize * 0.16;
      const netPaidToWinner = grossPrize - igf16;

      // GGR del Neto = Venta - Premios (Base recomendada CIAT)
      const ggrNeto = Math.max(0, sales - grossPrize);

      // 1. Taquilla (Nivel 1): 20% Triples / 12% Animalitos
      const taquillaCommPct = isAnimalitos ? 12 : 20;
      const taquillaCommAmount = sales * (taquillaCommPct / 100);
      const taquillaIaeAmount = taquillaCommAmount * 0.025; // 2,5% s/ comisiones (LOCAPTEM Art. 29 num. 1)
      const taquillaNetMargin = taquillaCommAmount - taquillaIaeAmount;

      // 2. Comercializadora (Nivel 2): Comisión asignada 25% Triples / 18% Animalitos
      const operAssignedCommPct = isAnimalitos ? 18 : 25;
      const operAssignedCommAmount = sales * (operAssignedCommPct / 100);
      const spreadPct = operAssignedCommPct - taquillaCommPct; // 5% Triples / 6% Animalitos
      const spreadAmount = sales * (spreadPct / 100);
      const comerIaeAmount = spreadAmount * 0.025; // 2,5% s/ spread propio
      const comerFinalComm = spreadAmount - comerIaeAmount;

      // Comisiones totales de intermediación
      const totalCommChain = taquillaCommAmount + spreadAmount;

      // Net Win de Juego antes de tributos de juego
      const netWinBase = Math.max(0, ggrNeto - totalCommChain);

      // Tributos del Juego sobre GGR:
      // SENIAT 10% Armonizado universal sobre GGR para todas las modalidades
      const seniatGGR = ggrNeto * 0.1;
      // Royalty IOBPAS Beneficencia: 5% Triples / 1% Animalitos sobre GGR
      const iobpasRate = isAnimalitos ? 0.01 : 0.05;
      const iobpasRoyalty = ggrNeto * iobpasRate;
      const totalTributosJuego = seniatGGR + iobpasRoyalty;

      // Net Win Distribuible tras tributos
      const netWinDistribuible = Math.max(0, netWinBase - totalTributosJuego);
      const operNetWin50 = netWinDistribuible * 0.5;

      // 3. Operadora (Nivel 3): 0,00% No Sujeto (Prohibición Constitucional de Doble Tributación)
      const operIaeAmount = 0;
      const operSurplus = operNetWin50 - operIaeAmount;

      // Esquema Vigente (5% sobre el 100% Facial en cascada)
      const vigenteTaquillaIae = sales * 0.05;
      const vigenteComerIae = sales * 0.05;
      const vigenteOperIae = sales * 0.05;
      const vigenteTotalIae = sales * 0.15;

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
        operAssignedCommPct,
        operAssignedCommAmount,
        spreadPct,
        spreadAmount,
        comerIaeAmount,
        comerFinalComm,
        seniatGGR,
        iobpasRoyalty,
        operNetWin50,
        operIaeAmount,
        operSurplus,
        vigenteTaquillaIae,
        vigenteComerIae,
        vigenteOperIae,
        vigenteTotalIae,
      };
    });
  }, [activeTickets]);

  // =========================================================================
  // TOTALES DINÁMICOS CONSOLIDADOS
  // =========================================================================
  const totalSales = calculatedItems.reduce((acc, i) => acc + i.sales, 0);
  const totalGrossPrize = calculatedItems.reduce(
    (acc, i) => acc + i.grossPrize,
    0
  );
  const totalIgf16 = calculatedItems.reduce((acc, i) => acc + i.igf16, 0);
  const totalNetPaidToWinner = calculatedItems.reduce(
    (acc, i) => acc + i.netPaidToWinner,
    0
  );
  const totalGgrNeto = Math.max(0, totalSales - totalGrossPrize);

  // Taquilla
  const totalTaquillaComm = calculatedItems.reduce(
    (acc, i) => acc + i.taquillaCommAmount,
    0
  );
  const totalTaquillaIae = calculatedItems.reduce(
    (acc, i) => acc + i.taquillaIaeAmount,
    0
  );
  const totalTaquillaNetMargin = calculatedItems.reduce(
    (acc, i) => acc + i.taquillaNetMargin,
    0
  );

  // Comercializadora
  const totalOperAssignedComm = calculatedItems.reduce(
    (acc, i) => acc + i.operAssignedCommAmount,
    0
  );
  const totalSpreadAmount = calculatedItems.reduce(
    (acc, i) => acc + i.spreadAmount,
    0
  );
  const totalComerIae = calculatedItems.reduce(
    (acc, i) => acc + i.comerIaeAmount,
    0
  );
  const totalComerFinalComm = calculatedItems.reduce(
    (acc, i) => acc + i.comerFinalComm,
    0
  );

  // Operadora
  const totalOperSurplus = calculatedItems.reduce(
    (acc, i) => acc + i.operSurplus,
    0
  );

  // Tributos Estatales
  const totalAlcaldia = totalTaquillaIae + totalComerIae;
  const totalIobpasRoyalty = calculatedItems.reduce(
    (acc, i) => acc + i.iobpasRoyalty,
    0
  );
  const totalSeniatGGR = calculatedItems.reduce(
    (acc, i) => acc + i.seniatGGR,
    0
  );
  const totalSeniatFiscal = totalSeniatGGR + totalIgf16;

  // Desglose por Modalidad
  const triplesItems = calculatedItems.filter(
    (i) => i.ticket.modalityId === "triples"
  );
  const animalitosItems = calculatedItems.filter(
    (i) => i.ticket.modalityId === "animalitos"
  );

  const triplesSales = triplesItems.reduce((acc, i) => acc + i.sales, 0);
  const triplesGrossPrize = triplesItems.reduce(
    (acc, i) => acc + i.grossPrize,
    0
  );
  const triplesGGR = Math.max(0, triplesSales - triplesGrossPrize);
  const triplesIobpas = triplesItems.reduce(
    (acc, i) => acc + i.iobpasRoyalty,
    0
  );

  const animalitosSales = animalitosItems.reduce((acc, i) => acc + i.sales, 0);
  const animalitosGrossPrize = animalitosItems.reduce(
    (acc, i) => acc + i.grossPrize,
    0
  );
  const animalitosGGR = Math.max(0, animalitosSales - animalitosGrossPrize);
  const animalitosIobpas = animalitosItems.reduce(
    (acc, i) => acc + i.iobpasRoyalty,
    0
  );

  // Totales Vigentes para Comparativa
  const totalVigenteTaquillaIae = calculatedItems.reduce(
    (acc, i) => acc + i.vigenteTaquillaIae,
    0
  );
  const totalVigenteComerIae = calculatedItems.reduce(
    (acc, i) => acc + i.vigenteComerIae,
    0
  );
  const totalVigenteOperIae = calculatedItems.reduce(
    (acc, i) => acc + i.vigenteOperIae,
    0
  );
  const totalVigenteAlcaldia = calculatedItems.reduce(
    (acc, i) => acc + i.vigenteTotalIae,
    0
  );

  // =========================================================================
  // PARÁMETROS DEL SIMULADOR DE PROYECCIONES MULTI-ACTOR (5 ACTORES DE RED)
  // =========================================================================
  // Inicializado con el Caso Real Base Unitario: 1 Taquilla • 30 Días • Bs. 150.000
  const [numTaquillas, setNumTaquillas] = useState<number>(1);
  const [numComercializadoras, setNumComercializadoras] = useState<number>(1);
  const [numOperadoras, setNumOperadoras] = useState<number>(1);
  const [numSistemasIT, setNumSistemasIT] = useState<number>(1);
  const [numResponsablesIT, setNumResponsablesIT] = useState<number>(1);
  const [dailySalesPerTaquilla, setDailySalesPerTaquilla] = useState<number>(
    totalSales > 0 ? Math.round(totalSales) : 5000
  );

  useEffect(() => {
    if (totalSales > 0) {
      setDailySalesPerTaquilla(Math.round(totalSales));
    }
  }, [totalSales]);
  const [timeHorizonDays, setTimeHorizonDays] = useState<number>(30); // 1, 30, 365
  const [mixTriplesPct] = useState<number>(80);

  // COSTOS MENSUALES EDITABLES DE LICENCIAMIENTO IOBPAS Y RUNLOT/CONALOT (Bs./mes)
  const [costoRunlotTaquilla, setCostoRunlotTaquilla] = useState<number>(150);
  const [costoIobpasTaquilla, setCostoIobpasTaquilla] = useState<number>(200);

  const [costoRunlotComercializadora, setCostoRunlotComercializadora] = useState<number>(1000);
  const [costoIobpasComercializadora, setCostoIobpasComercializadora] = useState<number>(1500);

  const [costoRunlotOperadora, setCostoRunlotOperadora] = useState<number>(3000);
  const [costoIobpasOperadora, setCostoIobpasOperadora] = useState<number>(5000);

  const [costoRunlotSistemaIT, setCostoRunlotSistemaIT] = useState<number>(1200);
  const [costoIobpasSistemaIT, setCostoIobpasSistemaIT] = useState<number>(800);

  const [costoRunlotResponsableIT, setCostoRunlotResponsableIT] = useState<number>(300);
  const [costoIobpasResponsableIT, setCostoIobpasResponsableIT] = useState<number>(200);
  const [honorarioRespITPorMes, setHonorarioRespITPorMes] = useState<number>(1500);

  const mesesEquivalentes = Math.max(1, timeHorizonDays / 30);

  // Cálculos de Proyección Multi-Actor
  const projVentaTotal = numTaquillas * dailySalesPerTaquilla * timeHorizonDays;
  const projTriplesSales = projVentaTotal * (mixTriplesPct / 100);
  const projAnimalitosSales = projVentaTotal * ((100 - mixTriplesPct) / 100);

  const projTriplesGrossPrizes = projTriplesSales * 0.6;
  const projAnimalitosGrossPrizes = projAnimalitosSales * 0.75;
  const projTotalGrossPrizes =
    projTriplesGrossPrizes + projAnimalitosGrossPrizes;

  const projPremiosEfectivo84 = projTotalGrossPrizes * 0.84;
  const projRetencionIGF16 = projTotalGrossPrizes * 0.16;

  const projTriplesGGR = projTriplesSales - projTriplesGrossPrizes;
  const projAnimalitosGGR = projAnimalitosSales - projAnimalitosGrossPrizes;
  const projTotalGGR = projTriplesGGR + projAnimalitosGGR;

  // SENIAT
  const projSeniatJuegos10 = projTotalGGR * 0.1;

  // IOBPAS Canon Beneficencia s/ GGR
  const projIobpasCanonGGR =
    projTriplesGGR * 0.05 + projAnimalitosGGR * 0.01;

  // Comisiones Taquilla
  const projTaquillaCommBruta =
    projTriplesSales * 0.2 + projAnimalitosSales * 0.12;
  const projAlcaldiaTaquillas = projTaquillaCommBruta * 0.025;
  const projTaquillaCommNeta = projTaquillaCommBruta - projAlcaldiaTaquillas;

  // Spread Comercializadora
  const projComercialSpreadBruto =
    projTriplesSales * 0.05 + projAnimalitosSales * 0.06;
  const projAlcaldiaComercial = projComercialSpreadBruto * 0.025;
  const projComercialSpreadNeto =
    projComercialSpreadBruto - projAlcaldiaComercial;

  const projAlcaldiaTotal = projAlcaldiaTaquillas + projAlcaldiaComercial;

  // Costos de Licencias RUNLOT - CONALOT por cada actor de la cadena
  const totalRunlotTaquillas = numTaquillas * costoRunlotTaquilla * mesesEquivalentes;
  const totalRunlotComercializadoras = numComercializadoras * costoRunlotComercializadora * mesesEquivalentes;
  const totalRunlotOperadoras = numOperadoras * costoRunlotOperadora * mesesEquivalentes;
  const totalRunlotSistemasIT = numSistemasIT * costoRunlotSistemaIT * mesesEquivalentes;
  const totalRunlotResponsablesIT = numResponsablesIT * costoRunlotResponsableIT * mesesEquivalentes;

  const projConalotTotal =
    totalRunlotTaquillas +
    totalRunlotComercializadoras +
    totalRunlotOperadoras +
    totalRunlotSistemasIT +
    totalRunlotResponsablesIT;

  // Costos de Licencias IOBPAS por cada actor de la cadena
  const totalIobpasTaquillas = numTaquillas * costoIobpasTaquilla * mesesEquivalentes;
  const totalIobpasComercializadoras = numComercializadoras * costoIobpasComercializadora * mesesEquivalentes;
  const totalIobpasOperadoras = numOperadoras * costoIobpasOperadora * mesesEquivalentes;
  const totalIobpasSistemasIT = numSistemasIT * costoIobpasSistemaIT * mesesEquivalentes;
  const totalIobpasResponsablesIT = numResponsablesIT * costoIobpasResponsableIT * mesesEquivalentes;

  const projIobpasLicenciasTotal =
    totalIobpasTaquillas +
    totalIobpasComercializadoras +
    totalIobpasOperadoras +
    totalIobpasSistemasIT +
    totalIobpasResponsablesIT;

  const projIobpasTotal = projIobpasCanonGGR + projIobpasLicenciasTotal;

  // Software IT (1,5% SaaS) y Responsables Informáticos (Honorarios profesionales)
  const projSistemasITFee = projVentaTotal * 0.015;
  const projTotalHonorariosRespIT = numResponsablesIT * honorarioRespITPorMes * mesesEquivalentes;

  // Net Win del Juego y Reparto 50% / 50%
  const projNetWinJuego =
    projTotalGGR - projTaquillaCommBruta - projComercialSpreadBruto;
  const projCargasJuego =
    projSeniatJuegos10 + projIobpasCanonGGR + projSistemasITFee;
  const projNetWinDistribuible = Math.max(0, projNetWinJuego - projCargasJuego);

  const projShareComercializadoras = projNetWinDistribuible * 0.5;
  const projShareOperadoras = projNetWinDistribuible * 0.5;

  // Rendimientos Netos Reales por Actor deduciendo IAE y costos de licencias IOBPAS + RUNLOT
  const projTaquillaUtilidadNeta = Math.max(
    0,
    projTaquillaCommNeta - (totalRunlotTaquillas + totalIobpasTaquillas)
  );
  const projComercialUtilidadNeta = Math.max(
    0,
    projComercialSpreadNeto +
      projShareComercializadoras -
      (totalRunlotComercializadoras + totalIobpasComercializadoras)
  );
  const projOperadoraUtilidadNeta = Math.max(
    0,
    projShareOperadoras -
      (totalRunlotOperadoras + totalIobpasOperadoras)
  );
  const projSistemasITNeto = Math.max(
    0,
    projSistemasITFee - (totalRunlotSistemasIT + totalIobpasSistemasIT)
  );
  const projResponsablesITNeto = Math.max(
    0,
    projTotalHonorariosRespIT - (totalRunlotResponsablesIT + totalIobpasResponsablesIT)
  );

  // Promedios Unitarios
  const avgPerTaquilla = projTaquillaUtilidadNeta / Math.max(1, numTaquillas);
  const avgPerComercializadora = projComercialUtilidadNeta / Math.max(1, numComercializadoras);
  const avgPerOperadora = projOperadoraUtilidadNeta / Math.max(1, numOperadoras);
  const avgPerSistemaIT = projSistemasITNeto / Math.max(1, numSistemasIT);
  const avgPerResponsableIT = projResponsablesITNeto / Math.max(1, numResponsablesIT);

  // Total Recaudación Pública Consolidada
  const projTotalRecaudacionPublica =
    projSeniatJuegos10 +
    projRetencionIGF16 +
    projIobpasTotal +
    projAlcaldiaTotal +
    projConalotTotal;

  // Copiar resumen ejecutivo en texto plano
  const handleCopySummary = () => {
    const text = `=== PROYECCIÓN MULTI-ACTOR CDAPUESTAS / RUNLOT ===
(Alimentado con base de venta taquilla actual: Bs. ${formatBs(totalSales, 2)})
Horizonte: ${timeHorizonDays} días | Red: ${numTaquillas} Taquillas, ${numComercializadoras} Comercializadoras, ${numOperadoras} Operadoras, ${numSistemasIT} Sistemas IT, ${numResponsablesIT} Responsables IT.
Venta Bruta Total: Bs. ${formatBs(projVentaTotal, 2)}
Premios Pagados (84% Efectivo): Bs. ${formatBs(projPremiosEfectivo84, 2)}
16% IGF Retenido SENIAT (Planilla 99029): Bs. ${formatBs(projRetencionIGF16, 2)}
GGR Consolidado de Red: Bs. ${formatBs(projTotalGGR, 2)}

--- CAJA FISCAL Y PARAFISCAL (ESTADO VENEZOLANO) ---
• SENIAT Impuesto s/ Juegos (10% GGR): Bs. ${formatBs(projSeniatJuegos10, 2)}
• SENIAT IGF Retención (16% Premios): Bs. ${formatBs(projRetencionIGF16, 2)}
• IOBPAS Beneficencia & Licencias: Bs. ${formatBs(projIobpasTotal, 2)} (Canon GGR: Bs. ${formatBs(projIobpasCanonGGR, 2)} + Licencias: Bs. ${formatBs(projIobpasLicenciasTotal, 2)})
• Alcaldías Municipales (2,5% s/ Comisiones): Bs. ${formatBs(projAlcaldiaTotal, 2)}
• CONALOT (Tasas Telemáticas RUNLOT 5 Actores): Bs. ${formatBs(projConalotTotal, 2)}
TOTAL RECAUDACIÓN ESTATAL: Bs. ${formatBs(projTotalRecaudacionPublica, 2)}

--- RENDIMIENTO PRIVADO NETO (DEDUCIDAS LICENCIAS IOBPAS Y RUNLOT) ---
• Taquillas / Agencias (${numTaquillas}): Bs. ${formatBs(projTaquillaUtilidadNeta, 2)} (Promedio: Bs. ${formatBs(avgPerTaquilla, 2)})
• Comercializadoras (${numComercializadoras}): Bs. ${formatBs(projComercialUtilidadNeta, 2)} (Promedio: Bs. ${formatBs(avgPerComercializadora, 2)})
• Operadoras Concesionarias (${numOperadoras}): Bs. ${formatBs(projOperadoraUtilidadNeta, 2)} (Promedio: Bs. ${formatBs(avgPerOperadora, 2)})
• Empresas Sistemas IT (${numSistemasIT}): Bs. ${formatBs(projSistemasITNeto, 2)} (Promedio: Bs. ${formatBs(avgPerSistemaIT, 2)})
• Responsables Informáticos (${numResponsablesIT}): Bs. ${formatBs(projResponsablesITNeto, 2)} (Promedio: Bs. ${formatBs(avgPerResponsableIT, 2)})
`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Exportar matriz a formato compatible con Google Sheets (TSV tab-separated para Ctrl+V)
  const handleCopyForGoogleSheets = () => {
    const rows = [
      ["CONCEPTO FINANCIERO / TRIBUTARIO", "MONTO PROYECTADO (Bs.)", "% S/ FACIAL", "BASE DE CÁLCULO", "BENEFICIARIO / RESPONSABLE", "BASE LEGAL"],
      ["Venta Bruta Total Proyectada", projVentaTotal.toFixed(2), "100.00%", "Venta Taquilla * Días", "Red Comercial", "Contrato Concesión"],
      ["(-) Premios Efectivo Pagados al Apostador (84%)", (-projPremiosEfectivo84).toFixed(2), `${((projPremiosEfectivo84 / projVentaTotal) * 100).toFixed(2)}%`, "Premios Brutos - 16% IGF", "Apostadores Ganadores", "Art. 18 Prov. 00093"],
      ["(-) Retención 16% Ganancias Fortuitas (IGF)", (-projRetencionIGF16).toFixed(2), `${((projRetencionIGF16 / projVentaTotal) * 100).toFixed(2)}%`, "16% sobre Premios Brutos", "SENIAT (Tesoro Nacional)", "LISLR Art. 65 / Dcto 1808"],
      ["(=) GGR Consolidado de Red", projTotalGGR.toFixed(2), `${((projTotalGGR / projVentaTotal) * 100).toFixed(2)}%`, "Venta - Premios Brutos", "Margen Bruto Industria", "Estándar CIAT"],
      ["(-) Comisiones Netas Taquillas (Agencias)", (-projTaquillaCommNeta).toFixed(2), `${((projTaquillaCommNeta / projVentaTotal) * 100).toFixed(2)}%`, "Comisión Bruta - 2.5% IAE", "Puntos de Venta (Taquillas)", "LOCAPTEM Art. 29 num 1"],
      ["(-) Spread Neto Comercializadoras", (-projComercialSpreadNeto).toFixed(2), `${((projComercialSpreadNeto / projVentaTotal) * 100).toFixed(2)}%`, "Spread Bruto - 2.5% IAE", "Agentes Máster / Distribuidores", "Arts. 32 y 33 Prov. 00093"],
      ["(-) IAE Municipal Alcaldías (2.5% Comisiones)", (-projAlcaldiaTotal).toFixed(2), `${((projAlcaldiaTotal / projVentaTotal) * 100).toFixed(2)}%`, "2.5% s/ Comisiones de Red", "Haciendas Municipales", "LOCAPTEM Art. 29 num 1"],
      ["(-) Impuesto s/ Juegos SENIAT (10% GGR)", (-projSeniatJuegos10).toFixed(2), `${((projSeniatJuegos10 / projVentaTotal) * 100).toFixed(2)}%`, "10% s/ GGR del Neto", "SENIAT (Tesoro Nacional)", "Ley de Juegos de Envite"],
      ["(-) Canon IOBPAS Beneficencia Pública", (-projIobpasCanonGGR).toFixed(2), `${((projIobpasCanonGGR / projVentaTotal) * 100).toFixed(2)}%`, "5% Triples / 1% Anim s/ GGR", "Lotería Oficial (Hospitales)", "Ley Nacional Lotería Art 23"],
      ["(-) Licencias y Avales IOBPAS (5 Actores)", (-projIobpasLicenciasTotal).toFixed(2), `${((projIobpasLicenciasTotal / projVentaTotal) * 100).toFixed(2)}%`, "Cánones Fijos de Licencia", "IOBPAS (Lotería Oficial)", "Reglamento IOBPAS"],
      ["(-) Tasas y Homologación RUNLOT / CONALOT", (-projConalotTotal).toFixed(2), `${((projConalotTotal / projVentaTotal) * 100).toFixed(2)}%`, "Cánones SCFD por Actor", "CONALOT (Ente Regulador)", "Resolución 002-2026"],
      ["(-) Licenciamiento Sistemas Informáticos (SaaS)", (-projSistemasITFee).toFixed(2), `${((projSistemasITFee / projVentaTotal) * 100).toFixed(2)}%`, "1.5% s/ Venta Bruta", "Empresas Software IT", "Certificación ISO 27001"],
      ["(-) Honorarios Responsables Informáticos", (-projTotalHonorariosRespIT).toFixed(2), `${((projTotalHonorariosRespIT / projVentaTotal) * 100).toFixed(2)}%`, "Auditoría y Custodia IT", "Profesionales Colegiados", "Ley de Ejercicio Profesional"],
      ["(=) Superávit Operativo Neto Operadoras", projOperadoraUtilidadNeta.toFixed(2), `${((projOperadoraUtilidadNeta / projVentaTotal) * 100).toFixed(2)}%`, "Net Win tras Licencias", "Operadoras Concesionarias", "Solvencia Patrimonial"],
      ["", "", "", "", "", ""],
      ["DISTRIBUCIÓN POR ACTOR DE LA RED", "CANTIDAD", "VENTA GESTIONADA", "INGRESO BRUTO", "CARGA FISCAL", "COSTOS RUNLOT + IOBPAS", "PROMEDIO UNITARIO NETO", "TOTAL RED NETO"],
      ["Taquillas / Centros de Apuestas", numTaquillas.toString(), projVentaTotal.toFixed(2), projTaquillaCommBruta.toFixed(2), (-projAlcaldiaTaquillas).toFixed(2), (-(totalRunlotTaquillas + totalIobpasTaquillas)).toFixed(2), avgPerTaquilla.toFixed(2), projTaquillaUtilidadNeta.toFixed(2)],
      ["Comercializadoras Intermediarias", numComercializadoras.toString(), projVentaTotal.toFixed(2), (projComercialSpreadBruto + projShareComercializadoras).toFixed(2), (-projAlcaldiaComercial).toFixed(2), (-(totalRunlotComercializadoras + totalIobpasComercializadoras)).toFixed(2), avgPerComercializadora.toFixed(2), projComercialUtilidadNeta.toFixed(2)],
      ["Operadoras de Juegos de Lotería", numOperadoras.toString(), projVentaTotal.toFixed(2), projShareOperadoras.toFixed(2), "0.00 (No Sujeto)", (-(totalRunlotOperadoras + totalIobpasOperadoras)).toFixed(2), avgPerOperadora.toFixed(2), projOperadoraUtilidadNeta.toFixed(2)],
      ["Empresas de Sistemas Informáticos", numSistemasIT.toString(), projVentaTotal.toFixed(2), projSistemasITFee.toFixed(2), "0.00", (-(totalRunlotSistemasIT + totalIobpasSistemasIT)).toFixed(2), avgPerSistemaIT.toFixed(2), projSistemasITNeto.toFixed(2)],
      ["Responsables Informáticos Registrados", numResponsablesIT.toString(), projVentaTotal.toFixed(2), projTotalHonorariosRespIT.toFixed(2), "0.00", (-(totalRunlotResponsablesIT + totalIobpasResponsablesIT)).toFixed(2), avgPerResponsableIT.toFixed(2), projResponsablesITNeto.toFixed(2)]
    ];

    const tsv = rows.map((r) => r.join("\t")).join("\n");
    navigator.clipboard.writeText(tsv);
    setCopiedSheets(true);
    setTimeout(() => setCopiedSheets(false), 3000);
  };

  // Descargar archivo CSV con UTF-8 BOM para Google Sheets y Microsoft Excel
  const handleDownloadCSV = () => {
    const rows = [
      ["CONCEPTO FINANCIERO / TRIBUTARIO", "MONTO PROYECTADO (Bs.)", "% S/ FACIAL", "BASE DE CALCULO", "BENEFICIARIO / RESPONSABLE", "BASE LEGAL"],
      ["Venta Bruta Total Proyectada", projVentaTotal.toFixed(2), "100.00%", "Venta Taquilla * Dias", "Red Comercial", "Contrato Concesion"],
      ["(-) Premios Efectivo Pagados al Apostador (84%)", (-projPremiosEfectivo84).toFixed(2), `${((projPremiosEfectivo84 / projVentaTotal) * 100).toFixed(2)}%`, "Premios Brutos - 16% IGF", "Apostadores Ganadores", "Art. 18 Prov. 00093"],
      ["(-) Retencion 16% Ganancias Fortuitas (IGF)", (-projRetencionIGF16).toFixed(2), `${((projRetencionIGF16 / projVentaTotal) * 100).toFixed(2)}%`, "16% sobre Premios Brutos", "SENIAT (Tesoro Nacional)", "LISLR Art. 65 / Dcto 1808"],
      ["(=) GGR Consolidado de Red", projTotalGGR.toFixed(2), `${((projTotalGGR / projVentaTotal) * 100).toFixed(2)}%`, "Venta - Premios Brutos", "Margen Bruto Industria", "Estandar CIAT"],
      ["(-) Comisiones Netas Taquillas (Agencias)", (-projTaquillaCommNeta).toFixed(2), `${((projTaquillaCommNeta / projVentaTotal) * 100).toFixed(2)}%`, "Comision Bruta - 2.5% IAE", "Puntos de Venta (Taquillas)", "LOCAPTEM Art. 29 num 1"],
      ["(-) Spread Neto Comercializadoras", (-projComercialSpreadNeto).toFixed(2), `${((projComercialSpreadNeto / projVentaTotal) * 100).toFixed(2)}%`, "Spread Bruto - 2.5% IAE", "Agentes Master / Distribuidores", "Arts. 32 y 33 Prov. 00093"],
      ["(-) IAE Municipal Alcaldias (2.5% Comisiones)", (-projAlcaldiaTotal).toFixed(2), `${((projAlcaldiaTotal / projVentaTotal) * 100).toFixed(2)}%`, "2.5% s/ Comisiones de Red", "Haciendas Municipales", "LOCAPTEM Art. 29 num 1"],
      ["(-) Impuesto s/ Juegos SENIAT (10% GGR)", (-projSeniatJuegos10).toFixed(2), `${((projSeniatJuegos10 / projVentaTotal) * 100).toFixed(2)}%`, "10% s/ GGR del Neto", "SENIAT (Tesoro Nacional)", "Ley de Juegos de Envite"],
      ["(-) Canon IOBPAS Beneficencia Publica", (-projIobpasCanonGGR).toFixed(2), `${((projIobpasCanonGGR / projVentaTotal) * 100).toFixed(2)}%`, "5% Triples / 1% Anim s/ GGR", "Loteria Oficial (Hospitales)", "Ley Nacional Loteria Art 23"],
      ["(-) Licencias y Avales IOBPAS (5 Actores)", (-projIobpasLicenciasTotal).toFixed(2), `${((projIobpasLicenciasTotal / projVentaTotal) * 100).toFixed(2)}%`, "Canones Fijos de Licencia", "IOBPAS (Loteria Oficial)", "Reglamento IOBPAS"],
      ["(-) Tasas y Homologacion RUNLOT / CONALOT", (-projConalotTotal).toFixed(2), `${((projConalotTotal / projVentaTotal) * 100).toFixed(2)}%`, "Canones SCFD por Actor", "CONALOT (Ente Regulador)", "Resolucion 002-2026"],
      ["(-) Licenciamiento Sistemas Informaticos (SaaS)", (-projSistemasITFee).toFixed(2), `${((projSistemasITFee / projVentaTotal) * 100).toFixed(2)}%`, "1.5% s/ Venta Bruta", "Empresas Software IT", "Certificacion ISO 27001"],
      ["(-) Honorarios Responsables Informaticos", (-projTotalHonorariosRespIT).toFixed(2), `${((projTotalHonorariosRespIT / projVentaTotal) * 100).toFixed(2)}%`, "Auditoria y Custodia IT", "Profesionales Colegiados", "Ley de Ejercicio Profesional"],
      ["(=) Superavit Operativo Neto Operadoras", projOperadoraUtilidadNeta.toFixed(2), `${((projOperadoraUtilidadNeta / projVentaTotal) * 100).toFixed(2)}%`, "Net Win tras Licencias", "Operadoras Concesionarias", "Solvencia Patrimonial"],
      ["", "", "", "", "", ""],
      ["DISTRIBUCION POR ACTOR DE LA RED", "CANTIDAD", "VENTA GESTIONADA", "INGRESO BRUTO", "CARGA FISCAL", "COSTOS RUNLOT + IOBPAS", "PROMEDIO UNITARIO NETO", "TOTAL RED NETO"],
      ["Taquillas / Centros de Apuestas", numTaquillas.toString(), projVentaTotal.toFixed(2), projTaquillaCommBruta.toFixed(2), (-projAlcaldiaTaquillas).toFixed(2), (-(totalRunlotTaquillas + totalIobpasTaquillas)).toFixed(2), avgPerTaquilla.toFixed(2), projTaquillaUtilidadNeta.toFixed(2)],
      ["Comercializadoras Intermediarias", numComercializadoras.toString(), projVentaTotal.toFixed(2), (projComercialSpreadBruto + projShareComercializadoras).toFixed(2), (-projAlcaldiaComercial).toFixed(2), (-(totalRunlotComercializadoras + totalIobpasComercializadoras)).toFixed(2), avgPerComercializadora.toFixed(2), projComercialUtilidadNeta.toFixed(2)],
      ["Operadoras de Juegos de Loteria", numOperadoras.toString(), projVentaTotal.toFixed(2), projShareOperadoras.toFixed(2), "0.00 (No Sujeto)", (-(totalRunlotOperadoras + totalIobpasOperadoras)).toFixed(2), avgPerOperadora.toFixed(2), projOperadoraUtilidadNeta.toFixed(2)],
      ["Empresas de Sistemas Informaticos", numSistemasIT.toString(), projVentaTotal.toFixed(2), projSistemasITFee.toFixed(2), "0.00", (-(totalRunlotSistemasIT + totalIobpasSistemasIT)).toFixed(2), avgPerSistemaIT.toFixed(2), projSistemasITNeto.toFixed(2)],
      ["Responsables Informaticos Registrados", numResponsablesIT.toString(), projVentaTotal.toFixed(2), projTotalHonorariosRespIT.toFixed(2), "0.00", (-(totalRunlotResponsablesIT + totalIobpasResponsablesIT)).toFixed(2), avgPerResponsableIT.toFixed(2), projResponsablesITNeto.toFixed(2)]
    ];

    const csvContent = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PROYECCION_RED_CDAPUESTAS_${numTaquillas}_TAQUILLAS_${timeHorizonDays}_DIAS.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          CABECERA EJECUTIVA DEL MÓDULO 4
      ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MÓDULO 4
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Alimentado con Datos de la Taquilla POS
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-400" />
              Tributos en 4 Subniveles & Simulador Multi-Actor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Auditoría fiscal en tiempo real calculada con los tickets de la
              taquilla (Alcaldías, IOBPAS, SENIAT, CONALOT) y proyecciones
              escalables multi-red con exportación directa a Google Sheets.
            </p>
          </div>
        </div>

        {/* ====================================================================
            BARRA DE FILTRO Y SINCRONIZACIÓN DE TICKETS DE TAQUILLA
        ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 mt-5">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white">
              Venta en Taquilla:
            </span>
            <span className="text-sm font-extrabold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Bs. {formatBs(totalSales, 2)}
            </span>
            {hasRealTickets ? (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-600/30">
                {sourceTickets.length} ticket(s) en memoria de taquilla
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Taquilla en Blanco: Sin jugadas cargadas en POS (Bs. 0,00)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedTicketFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedTicketFilter === "ALL"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Todos ({sourceTickets.length})
            </button>
            <button
              onClick={() => setSelectedTicketFilter("MOD_TRIPLES")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedTicketFilter === "MOD_TRIPLES"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Solo Triples
            </button>
            <button
              onClick={() => setSelectedTicketFilter("MOD_ANIMALITOS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedTicketFilter === "MOD_ANIMALITOS"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Solo Animalitos
            </button>
            {onGoToPOS && (
              <button
                onClick={onGoToPOS}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Store className="w-3 h-3" />
                + Cargar en Taquilla
              </button>
            )}
          </div>
        </div>

        {/* NAVEGACIÓN POR CARPETAS / SUBNIVELES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab("tablas_hub")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer col-span-2 sm:col-span-1 ${
              activeSubTab === "tablas_hub"
                ? "bg-gradient-to-r from-blue-600/30 via-emerald-600/30 to-indigo-600/30 border-emerald-400 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Table
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "tablas_hub"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                <span>Tablas</span>
              </div>
              <div className="text-xs font-bold truncate">Tablas Maestras</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("alcaldias")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === "alcaldias"
                ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/50"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Landmark
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "alcaldias" ? "text-blue-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                Subnivel 1
              </div>
              <div className="text-xs font-bold truncate">1. Alcaldías (IAE)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("iobpas")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === "iobpas"
                ? "bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-950/50"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "iobpas"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                Subnivel 2
              </div>
              <div className="text-xs font-bold truncate">2. IOBPAS (Canon)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("seniat")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === "seniat"
                ? "bg-amber-600/20 border-amber-500 text-white shadow-md shadow-amber-950/50"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Coins
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "seniat" ? "text-amber-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Subnivel 3
              </div>
              <div className="text-xs font-bold truncate">3. SENIAT (GGR+IGF)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("conalot")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === "conalot"
                ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/50"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Layers
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "conalot" ? "text-purple-400" : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                Subnivel 4
              </div>
              <div className="text-xs font-bold truncate">4. CONALOT & RUNLOT</div>
            </div>
          </button>

          <button
            id="tour-sim-tab"
            type="button"
            onClick={() => setActiveSubTab("proyecciones")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === "proyecciones"
                ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-400 text-white shadow-md shadow-blue-950/50"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === "proyecciones"
                  ? "text-cyan-400 animate-pulse"
                  : "text-slate-500"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                Subcarpeta
              </div>
              <div className="text-xs font-bold truncate">Simulador Multi-Actor</div>
            </div>
          </button>
        </div>
      </div>

      {/* ====================================================================
          TABLAS MAESTRAS CONSOLIDADAS (ALIMENTADAS POR TAQUILLA)
      ==================================================================== */}
      {activeSubTab === "tablas_hub" && (
        <div className="space-y-6">

          {/* ====================================================================
              TABLA MAESTRA 1: LIQUIDACIÓN FISCAL Y FLUJO EN VIVO DE LA TAQUILLA
          ==================================================================== */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-400" />
                  <span>Tabla Maestra 1: Matriz de Liquidación Fiscal y Flujo de Fondos (Alimentada por Taquilla)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose exacto de los {sourceTickets.length} ticket(s) cargados en taquilla (Venta Total: Bs. {formatBs(totalSales, 2)})
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                Modelo GGR (CIAT) + Arts. 32-33
              </span>
            </div>

            {/* AVISO CUANDO LA TAQUILLA ESTÁ EN BLANCO */}
            {!hasRealTickets && (
              <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Taquilla en Blanco (Bs. 0,00):</span>
                    <span className="text-slate-300 ml-1.5">
                      No has cargado jugadas ni emitido tickets en la Taquilla (Módulo 1). Todas las bases imponibles y liquidaciones tributarias están estrictamente en <strong>Bs. 0,00</strong>.
                    </span>
                  </div>
                </div>
                {onGoToPOS && (
                  <button
                    type="button"
                    onClick={onGoToPOS}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>+ Cargar Jugadas en Taquilla POS</span>
                  </button>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Concepto Financiero / Tributario</th>
                    <th className="p-3 text-right">Base Imponible (Bs.)</th>
                    <th className="p-3 text-right">Tasa / Alícuota</th>
                    <th className="p-3 text-right text-emerald-400">Monto Liquidado (Bs.)</th>
                    <th className="p-3">Destino / Beneficiario</th>
                    <th className="p-3">Blindaje Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  {/* Venta Bruta Facial */}
                  <tr className="bg-blue-950/20 font-bold">
                    <td className="p-3 text-white flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-400" /> Venta Captada en Taquilla (Valor Facial)
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(totalSales, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">100,00%</td>
                    <td className="p-3 text-right font-mono text-cyan-300 font-extrabold text-sm">
                      Bs. {formatBs(totalSales, 2)}
                    </td>
                    <td className="p-3 text-slate-300">Custodia en Caja Taquilla</td>
                    <td className="p-3 text-slate-400">Arts. 32 y 33 Prov. 00093</td>
                  </tr>

                  {/* Premios Acertados */}
                  <tr>
                    <td className="p-3 text-slate-300 pl-6">(−) Premios Brutos Acertados</td>
                    <td className="p-3 text-right font-mono text-slate-400">Bs. {formatBs(totalSales, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {totalSales > 0 ? ((totalGrossPrize / totalSales) * 100).toFixed(1) : "0"}%
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 font-semibold">
                      -Bs. {formatBs(totalGrossPrize, 2)}
                    </td>
                    <td className="p-3 text-slate-400">Apostadores Acertados</td>
                    <td className="p-3 text-slate-400">Tabla de Pagos Homologada</td>
                  </tr>

                  {/* Premios Efectivo 84% */}
                  <tr>
                    <td className="p-3 text-slate-400 pl-10">↳ Efectivo Pagado al Apostador (84%)</td>
                    <td className="p-3 text-right font-mono text-slate-400">Bs. {formatBs(totalGrossPrize, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">84,00%</td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      -Bs. {formatBs(totalNetPaidToWinner, 2)}
                    </td>
                    <td className="p-3 text-emerald-400">Ganadores en Efectivo</td>
                    <td className="p-3 text-slate-400">Art. 18 Prov. SNAT/2026/00093</td>
                  </tr>

                  {/* Retención 16% IGF */}
                  <tr className="bg-amber-950/10">
                    <td className="p-3 text-amber-300 font-semibold pl-10">
                      ↳ Retención 16% IGF al Apostador (Planilla 99029)
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400">Bs. {formatBs(totalGrossPrize, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">16,00%</td>
                    <td className="p-3 text-right font-mono text-amber-400 font-bold">
                      -Bs. {formatBs(totalIgf16, 2)}
                    </td>
                    <td className="p-3 text-amber-300 font-bold">SENIAT (Tesoro Nacional)</td>
                    <td className="p-3 text-slate-400">Art. 65 LISLR / Dcto. 1.808</td>
                  </tr>

                  {/* GGR Neto del Juego */}
                  <tr className="bg-slate-950/80 font-bold border-t border-slate-700">
                    <td className="p-3 text-emerald-300">(=) GGR del Neto de la Red (Venta − Premios)</td>
                    <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(totalSales, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {totalSales > 0 ? ((totalGgrNeto / totalSales) * 100).toFixed(1) : "0"}%
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                      Bs. {formatBs(totalGgrNeto, 2)}
                    </td>
                    <td className="p-3 text-slate-300">Base Imponible Industria</td>
                    <td className="p-3 text-slate-400">Estándar Técnico CIAT</td>
                  </tr>

                  {/* Taquilla Comisión Bruta */}
                  <tr>
                    <td className="p-3 text-slate-300 pl-6">(−) Comisión Bruta Taquilla (Punto de Venta)</td>
                    <td className="p-3 text-right font-mono text-slate-400">Bs. {formatBs(totalSales, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">20% Trip / 12% Anim</td>
                    <td className="p-3 text-right font-mono text-blue-300">
                      -Bs. {formatBs(totalTaquillaComm, 2)}
                    </td>
                    <td className="p-3 text-blue-300">Centro de Apuestas / Taquilla</td>
                    <td className="p-3 text-slate-400">Contrato de Intermediación</td>
                  </tr>

                  {/* Taquilla IAE */}
                  <tr className="bg-blue-950/10">
                    <td className="p-3 text-blue-300 font-semibold pl-10">
                      ↳ IAE Alcaldía sobre Taquilla (2,5% s/ Comisión)
                    </td>
                    <td className="p-3 text-right font-mono text-blue-400">Bs. {formatBs(totalTaquillaComm, 2)}</td>
                    <td className="p-3 text-right font-mono text-blue-400">2,50%</td>
                    <td className="p-3 text-right font-mono text-blue-400 font-bold">
                      -Bs. {formatBs(totalTaquillaIae, 2)}
                    </td>
                    <td className="p-3 text-blue-300 font-bold">Alcaldía Municipal</td>
                    <td className="p-3 text-slate-400">LOCAPTEM Art. 29 num. 1</td>
                  </tr>

                  {/* Taquilla Margen Libre */}
                  <tr className="bg-emerald-950/10 font-bold">
                    <td className="p-3 text-emerald-300 pl-10">(=) Margen Libre Neto de la Taquilla</td>
                    <td className="p-3 text-right font-mono text-emerald-400">Bs. {formatBs(totalTaquillaComm, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">97,50%</td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      +Bs. {formatBs(totalTaquillaNetMargin, 2)}
                    </td>
                    <td className="p-3 text-emerald-300">Punto de Venta Bancarizado</td>
                    <td className="p-3 text-slate-400">Protección Art. 29.1</td>
                  </tr>

                  {/* Comercializadora Spread */}
                  <tr>
                    <td className="p-3 text-slate-300 pl-6">(−) Spread Bruto Comercializadora Intermediaria</td>
                    <td className="p-3 text-right font-mono text-slate-400">Bs. {formatBs(totalSales, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">5% Trip / 6% Anim</td>
                    <td className="p-3 text-right font-mono text-amber-300">
                      -Bs. {formatBs(totalSpreadAmount, 2)}
                    </td>
                    <td className="p-3 text-amber-300">Comercializadora Máster</td>
                    <td className="p-3 text-slate-400">Arts. 32 y 33 Prov. 00093</td>
                  </tr>

                  {/* Comercializadora IAE */}
                  <tr className="bg-blue-950/10">
                    <td className="p-3 text-blue-300 font-semibold pl-10">
                      ↳ IAE Alcaldía sobre Comercializadora (2,5% s/ Spread)
                    </td>
                    <td className="p-3 text-right font-mono text-blue-400">Bs. {formatBs(totalSpreadAmount, 2)}</td>
                    <td className="p-3 text-right font-mono text-blue-400">2,50%</td>
                    <td className="p-3 text-right font-mono text-blue-400 font-bold">
                      -Bs. {formatBs(totalComerIae, 2)}
                    </td>
                    <td className="p-3 text-blue-300 font-bold">Alcaldía Municipal</td>
                    <td className="p-3 text-slate-400">LOCAPTEM Art. 29 num. 1</td>
                  </tr>

                  {/* Comercializadora Comisión Final */}
                  <tr className="bg-amber-950/10 font-bold">
                    <td className="p-3 text-amber-300 pl-10">(=) Comisión Final Neta Comercializadora</td>
                    <td className="p-3 text-right font-mono text-amber-400">Bs. {formatBs(totalSpreadAmount, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">97,50%</td>
                    <td className="p-3 text-right font-mono text-amber-400">
                      +Bs. {formatBs(totalComerFinalComm, 2)}
                    </td>
                    <td className="p-3 text-amber-300">Comercializadora Máster</td>
                    <td className="p-3 text-slate-400">Ingreso Propio Declarable</td>
                  </tr>

                  {/* SENIAT Impuesto s/ Juegos (10% GGR) */}
                  <tr className="bg-amber-950/20 font-bold">
                    <td className="p-3 text-amber-300 pl-6">
                      (−) Impuesto SENIAT sobre Juegos de Envite (10% Universal s/ GGR)
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400">Bs. {formatBs(totalGgrNeto, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">10,00%</td>
                    <td className="p-3 text-right font-mono text-amber-400 text-sm">
                      -Bs. {formatBs(totalSeniatGGR, 2)}
                    </td>
                    <td className="p-3 text-amber-300 font-extrabold">SENIAT (Tesoro Nacional)</td>
                    <td className="p-3 text-slate-400">Ley de Juegos de Envite / CIAT</td>
                  </tr>

                  {/* IOBPAS Beneficencia */}
                  <tr className="bg-emerald-950/20 font-bold">
                    <td className="p-3 text-emerald-300 pl-6">
                      (−) Canon IOBPAS Beneficencia Pública (5% Triples / 1% Anim s/ GGR)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">Bs. {formatBs(totalGgrNeto, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">5% Trip / 1% Anim</td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                      -Bs. {formatBs(totalIobpasRoyalty, 2)}
                    </td>
                    <td className="p-3 text-emerald-300 font-extrabold">IOBPAS (Hospitales & Salud)</td>
                    <td className="p-3 text-slate-400">Ley Nacional Lotería Art. 23</td>
                  </tr>

                  {/* Operadora Net Win */}
                  <tr className="bg-slate-950/80 font-bold">
                    <td className="p-3 text-white pl-6">(=) Superávit Operativo Operadora (50% Net Win Distribuible)</td>
                    <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(totalGgrNeto, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">50,00%</td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-sm font-black">
                      +Bs. {formatBs(totalOperSurplus, 2)}
                    </td>
                    <td className="p-3 text-emerald-300">Operadora Concesionaria</td>
                    <td className="p-3 text-slate-400">Solvencia de Fianza</td>
                  </tr>

                  {/* Operadora IAE: 0% */}
                  <tr className="bg-emerald-950/30 font-bold">
                    <td className="p-3 text-emerald-400 pl-10">
                      ↳ IAE Municipal sobre Operadora: Bs. 0,00 (0,00% No Sujeto)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">Bs. 0,00</td>
                    <td className="p-3 text-right font-mono text-emerald-400">0,00%</td>
                    <td className="p-3 text-right font-mono text-emerald-300 font-black">
                      Bs. 0,00 (Exento)
                    </td>
                    <td className="p-3 text-emerald-300 font-bold">Sin Doble Tributación</td>
                    <td className="p-3 text-slate-400">CRBV Arts. 180 y 183</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ====================================================================
              TABLA MAESTRA 2: MATRIZ COMPARATIVA ESQUEMA VIGENTE VS REFORMA
          ==================================================================== */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-amber-400" />
                  <span>Tabla Maestra 2: Comparativa Financiera y Tributaria (Vigente vs. Reforma Propuesta)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Demostración de inviabilidad técnica del esquema actual vs. solvencia con GGR y comisiones reales
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Sujeto Gravado / Actor</th>
                    <th className="p-3 text-right text-rose-400">Esquema Vigente (5% Facial Confiscatorio)</th>
                    <th className="p-3 text-right text-emerald-400">Reforma Propuesta (2,5% LOCAPTEM / GGR)</th>
                    <th className="p-3 text-center">Diferencia / Ahorro</th>
                    <th className="p-3">Efecto Técnico y Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  <tr>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-blue-400" /> Taquilla / Centro de Apuestas
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 font-bold">
                      -Bs. {formatBs(totalVigenteTaquillaIae, 2)} (25% de su comisión)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      -Bs. {formatBs(totalTaquillaIae, 2)} (Retiene el 97,5% neto)
                    </td>
                    <td className="p-3 text-center font-mono text-cyan-300 font-bold">
                      +Bs. {formatBs(totalVigenteTaquillaIae - totalTaquillaIae, 2)}
                    </td>
                    <td className="p-3 text-emerald-300">Bancarización total; elimina incentivo a la informalidad</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> Comercializadora Intermediaria
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 font-bold">
                      -Bs. {formatBs(totalVigenteComerIae, 2)} (Confisca el 100% del spread)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      -Bs. {formatBs(totalComerIae, 2)} (2,5% s/ spread propio)
                    </td>
                    <td className="p-3 text-center font-mono text-cyan-300 font-bold">
                      +Bs. {formatBs(totalVigenteComerIae - totalComerIae, 2)}
                    </td>
                    <td className="p-3 text-emerald-300">Custodia blindada por Arts. 32 y 33 Providencia 00093</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Operadora de Juegos de Lotería
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 font-bold">
                      -Bs. {formatBs(totalVigenteOperIae, 2)} (Ilegal / Doble Tributación)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      Bs. 0,00 (0,00% No Sujeto)
                    </td>
                    <td className="p-3 text-center font-mono text-cyan-300 font-bold">
                      +Bs. {formatBs(totalVigenteOperIae, 2)}
                    </td>
                    <td className="p-3 text-emerald-300">Protege solvencia de fianza y fondo de contingencia</td>
                  </tr>

                  <tr className="bg-slate-950/70 font-bold border-t-2 border-slate-700">
                    <td className="p-3 text-cyan-300 font-extrabold flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-cyan-400" /> TOTAL RECAUDADO POR ALCALDÍAS
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 text-sm">
                      -Bs. {formatBs(totalVigenteAlcaldia, 2)} (Ficción incobrable / Quiebra)
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                      +Bs. {formatBs(totalAlcaldia, 2)} (100% Cobrable en tiempo real)
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-black">
                      Recaudación Efectiva
                    </td>
                    <td className="p-3 text-slate-300">Flujo financiero legal continuo y verificable por SCFD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ====================================================================
              TABLA MAESTRA 3: CENSO RUNLOT DE LAS 7 CATEGORÍAS OBLIGADAS
          ==================================================================== */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>Tabla Maestra 3: Censo de las 7 Categorías de Sujetos Obligados RUNLOT (CONALOT / SENIAT)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Estructura canónica de sujetos homologados bajo la Providencia SNAT/2026/00093 y normativa CONALOT
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Categoría RUNLOT</th>
                    <th className="p-3">Código RUNLOT</th>
                    <th className="p-3">RIF</th>
                    <th className="p-3">Razón Social</th>
                    <th className="p-3 text-center">Estado Homologación</th>
                    <th className="p-3">Rol Técnico en el Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 1. IOBPAS (Beneficencia)
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-IOBPAS-001</td>
                    <td className="p-3 font-mono text-slate-300">G-20000303-0</td>
                    <td className="p-3 text-slate-200">Lotería Oficial del Estado Zulia</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">VIGENTE</td>
                    <td className="p-3 text-slate-400">Ente emisor oficial del juego de beneficencia pública</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-blue-400" /> 2. Centro de Apuestas
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-AG-0412</td>
                    <td className="p-3 font-mono text-slate-300">J-12345678-9</td>
                    <td className="p-3 text-slate-200">Centro de Apuestas La Favorita C.A.</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">HOMOLOGADO</td>
                    <td className="p-3 text-slate-400">Punto de venta y terminal POS que capta y paga apuestas</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> 3. Comercializadora Intermediaria
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-COM-0021</td>
                    <td className="p-3 font-mono text-slate-300">J-98765432-1</td>
                    <td className="p-3 text-slate-200">Loterías del Sur Comercializadora C.A.</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">HOMOLOGADO</td>
                    <td className="p-3 text-slate-400">Custodia fondos de terceros (Arts. 32 y 33) y gestiona red</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" /> 4. Sistemas Informáticos
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-SYS-009</td>
                    <td className="p-3 font-mono text-slate-300">J-40998877-2</td>
                    <td className="p-3 text-slate-200">CDAPUESTAS / RUNLOT Core Engine v4.2</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">CERTIFICADO ISO</td>
                    <td className="p-3 text-slate-400">Plataforma telemática que firma tickets con HMAC-SHA256</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> 5. Responsables Informáticos
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-IT-0045</td>
                    <td className="p-3 font-mono text-slate-300">V-18765432</td>
                    <td className="p-3 text-slate-200">Ing. Auditor Técnico y Custodio Criptográfico</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">HABILITADO</td>
                    <td className="p-3 text-slate-400">Responsable de las claves privadas y custodia de logs SCFD</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-emerald-400" /> 6. Operadoras de Juegos
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-OP-0089</td>
                    <td className="p-3 font-mono text-slate-300">J-31415926-5</td>
                    <td className="p-3 text-slate-200">Operadora Oficial de Loterías C.A.</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">CONCESIONARIO</td>
                    <td className="p-3 text-slate-400">Garante del Net Win y solvencia de la fianza bancaria</td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <Dices className="w-3.5 h-3.5 text-amber-400" /> 7. Juegos Homologados
                    </td>
                    <td className="p-3 font-mono text-cyan-300 font-bold">RUN-JG-001</td>
                    <td className="p-3 font-mono text-slate-300">G-20000303-0</td>
                    <td className="p-3 text-slate-200">Sorteos de Triples (600x) y Animalitos (30x)</td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10">AUTORIZADO</td>
                    <td className="p-3 text-slate-400">Reglas matemáticas y factores de premio certificados</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBNIVEL 1: ALCALDÍAS MUNICIPALES (LOCAPTEM ART. 29 NUM. 1)
      ==================================================================== */}
      {activeSubTab === "alcaldias" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Subnivel 1: Alcaldías Municipales (Impuesto sobre Actividades Económicas)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Alimentado con la venta actual de taquilla:{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      Bs. {formatBs(totalSales, 2)}
                    </span>{" "}
                    • LOCAPTEM Art. 29 num. 1
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Alícuota Armonizada: 2,50%
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Operadora: 0,00% No Sujeto
                </span>
              </div>
            </div>

            {/* 3 Tarjetas de los 3 Niveles frente al Municipio con datos reales de taquilla */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 items-stretch">
              {/* Nivel 1: Taquilla */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-400" /> Nivel 1: Taquilla / Centro Apuestas
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      2,5% s/ Comisión Bruta
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5 mt-3">
                    <div className="flex justify-between">
                      <span>Base Gravable (Comisión Ganada):</span>
                      <span className="font-mono text-white font-bold">
                        Bs. {formatBs(totalTaquillaComm, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>(−) IAE Municipal (2,50%):</span>
                      <span className="font-mono font-bold">
                        -Bs. {formatBs(totalTaquillaIae, 2)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                      <span>(=) Margen Neto Libre:</span>
                      <span className="font-mono">
                        +Bs. {formatBs(totalTaquillaNetMargin, 2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 bg-blue-50/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-blue-200/80 dark:border-slate-800 leading-relaxed">
                  💡 <strong>Blindaje Art. 29 num. 1:</strong> La taquilla no tributa sobre los Bs. {formatBs(totalSales, 2)} del ticket facial, sino únicamente sobre los Bs. {formatBs(totalTaquillaComm, 2)} de su comisión mercantil ganada.
                </div>
              </div>

              {/* Nivel 2: Comercializadora */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> Nivel 2: Comercializadora
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      2,5% s/ Spread Propio
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5 mt-3">
                    <div className="flex justify-between">
                      <span>Comisión Asignada por Operadora:</span>
                      <span className="font-mono text-white">
                        Bs. {formatBs(totalOperAssignedComm, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>(−) Cedida a Taquilla:</span>
                      <span className="font-mono text-slate-300">
                        -Bs. {formatBs(totalTaquillaComm, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>(=) Spread Propio Gravable:</span>
                      <span className="font-mono">
                        Bs. {formatBs(totalSpreadAmount, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>(−) IAE Municipal (2,50%):</span>
                      <span className="font-mono font-bold">
                        -Bs. {formatBs(totalComerIae, 2)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                      <span>(=) Spread Neto Libre:</span>
                      <span className="font-mono">
                        +Bs. {formatBs(totalComerFinalComm, 2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-amber-200/80 dark:border-slate-800 leading-relaxed">
                  💡 <strong>Blindaje Art. 29 num. 1:</strong> La comercializadora tributa el 2,5% exclusivamente sobre su margen diferencial (spread propio), garantizando que no se compute el valor facial de la red.
                </div>
              </div>

              {/* Nivel 3: Operadora */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between h-full relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Nivel 3: Operadora
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      0,00% No Sujeto
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-2 mt-3">
                    <div className="flex justify-between">
                      <span>Naturaleza de la Operadora:</span>
                      <span className="font-semibold text-slate-200">Ente Concesionario</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comisión Mercantil Percibida:</span>
                      <span className="font-mono text-slate-200">Bs. 0,00 (Ninguna)</span>
                    </div>
                    <div className="flex justify-between text-emerald-300 font-bold pt-1">
                      <span>Pago IAE Municipal:</span>
                      <span className="font-mono text-emerald-400 font-black">Bs. 0,00</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-300 dark:border-amber-500/30 leading-relaxed font-medium">
                  ⚠️ <strong>Prohibición Constitucional:</strong> Gravar el remanente de la Operadora violaría los Arts. 180 y 183 de la CRBV, ya que el GGR puede ser negativo por siniestralidad.
                </div>
              </div>
            </div>

            {/* TABLA COMPARATIVA CON LOS DATOS REALES DE LA TAQUILLA */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Matriz Comparativa de Recaudación Municipal (Base Venta Taquilla: Bs. {formatBs(totalSales, 2)})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Sujeto Gravado</th>
                      <th className="p-3">Esquema Vigente (5% s/ Facial Confiscatorio)</th>
                      <th className="p-3 text-emerald-400">Reforma Propuesta (2,5% LOCAPTEM s/ Comisiones)</th>
                      <th className="p-3">Impacto en la Cobrabilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white">Taquilla / Centro de Apuestas</td>
                      <td className="p-3 text-rose-400 font-mono">
                        -Bs. {formatBs(totalVigenteTaquillaIae, 2)} (5% s/ Facial)
                      </td>
                      <td className="p-3 text-emerald-400 font-mono font-bold">
                        -Bs. {formatBs(totalTaquillaIae, 2)} (Retiene el 97,5% neto)
                      </td>
                      <td className="p-3 text-emerald-300">100% cobrable y bancarizado</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Comercializadora Intermediaria</td>
                      <td className="p-3 text-rose-400 font-mono">
                        -Bs. {formatBs(totalVigenteComerIae, 2)} (5% s/ Facial)
                      </td>
                      <td className="p-3 text-emerald-400 font-mono font-bold">
                        -Bs. {formatBs(totalComerIae, 2)} (2,5% s/ Spread propio)
                      </td>
                      <td className="p-3 text-emerald-300">Formalidad sostenible</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Operadora de Juegos de Lotería</td>
                      <td className="p-3 text-rose-400 font-mono">
                        -Bs. {formatBs(totalVigenteOperIae, 2)} (Triple gravamen s/ Facial)
                      </td>
                      <td className="p-3 text-emerald-400 font-mono font-bold">
                        Bs. 0,00 (No Sujeto - Prohibición CRBV)
                      </td>
                      <td className="p-3 text-blue-300">Garantía de solvencia de fianza</td>
                    </tr>
                    <tr className="bg-slate-950/80 font-bold border-t-2 border-slate-700">
                      <td className="p-3 text-white">TOTAL RECAUDADO POR ALCALDÍAS</td>
                      <td className="p-3 text-rose-400 font-mono">
                        -Bs. {formatBs(totalVigenteAlcaldia, 2)} (Ficción incobrable)
                      </td>
                      <td className="p-3 text-emerald-400 font-mono text-sm font-black">
                        +Bs. {formatBs(totalAlcaldia, 2)} (Recaudación Real en Tiempo Real)
                      </td>
                      <td className="p-3 text-emerald-400">Flujo continuo para el Municipio</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBNIVEL 2: IOBPAS (BENEFICENCIA PÚBLICA)
      ==================================================================== */}
      {activeSubTab === "iobpas" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Subnivel 2: IOBPAS (Institutos Oficiales de Beneficencia Pública)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Art. 23 Ley Nacional de Lotería • Canon Social calculado con la venta real de taquilla:{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      Bs. {formatBs(totalSales, 2)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLoteria}
                  onChange={(e) => setSelectedLoteria(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="zulia">Lotería del Zulia (IOBPAS)</option>
                  <option value="tachira">Lotería del Táchira (IOBPAS)</option>
                  <option value="caracas">Lotería de Caracas (IOBPAS)</option>
                  <option value="aragua">Lotería de Aragua (IOBPAS)</option>
                  <option value="oriente">Lotería de Oriente (IOBPAS)</option>
                </select>
              </div>
            </div>

            {/* Tarjetas de Canon por Modalidad con datos reales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Dices className="w-4 h-4 text-emerald-400" /> Triples y Terminales Tradicionales
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    5,00% sobre GGR
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Venta Facial Triples en Taquilla:</span>
                    <span className="font-mono text-white font-bold">
                      Bs. {formatBs(triplesSales, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>(−) Premios Brutos Estimados:</span>
                    <span className="font-mono text-slate-300">
                      -Bs. {formatBs(triplesGrossPrize, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-300 pt-1 border-t border-slate-800">
                    <span>(=) GGR Triples (Venta − Premios):</span>
                    <span className="font-mono">
                      Bs. {formatBs(triplesGGR, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-slate-700">
                    <span>Canon Beneficencia IOBPAS (5%):</span>
                    <span className="font-mono">
                      Bs. {formatBs(triplesIobpas, 2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Sorteos de Animalitos (Figuras)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    1,00% sobre GGR
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Venta Facial Animalitos en Taquilla:</span>
                    <span className="font-mono text-white font-bold">
                      Bs. {formatBs(animalitosSales, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>(−) Premios Brutos Estimados:</span>
                    <span className="font-mono text-slate-300">
                      -Bs. {formatBs(animalitosGrossPrize, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-300 pt-1 border-t border-slate-800">
                    <span>(=) GGR Animalitos (Venta − Premios):</span>
                    <span className="font-mono">
                      Bs. {formatBs(animalitosGGR, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-400 pt-2 border-t border-slate-700">
                    <span>Canon Beneficencia IOBPAS (1%):</span>
                    <span className="font-mono">
                      Bs. {formatBs(animalitosIobpas, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Destino Social del Fondo de Beneficencia */}
            <div className="mt-8 bg-slate-950/90 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    Distribución Auditada del Fondo Social Recaudado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fondo generado por los tickets actuales:{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      Bs. {formatBs(totalIobpasRoyalty, 2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-base font-black text-emerald-400 font-mono">
                    Bs. {formatBs(totalIobpasRoyalty * 0.4, 2)}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">40% Salud y Hospitales</div>
                  <div className="text-[10px] text-slate-400 mt-1">Insumos quirúrgicos y oncología</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-base font-black text-blue-400 font-mono">
                    Bs. {formatBs(totalIobpasRoyalty * 0.3, 2)}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">30% Deporte Comunitario</div>
                  <div className="text-[10px] text-slate-400 mt-1">Canchas y escuelas infantiles</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-base font-black text-amber-400 font-mono">
                    Bs. {formatBs(totalIobpasRoyalty * 0.2, 2)}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">20% Educación y Becas</div>
                  <div className="text-[10px] text-slate-400 mt-1">Becas universitarias</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-base font-black text-purple-400 font-mono">
                    Bs. {formatBs(totalIobpasRoyalty * 0.1, 2)}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">10% Adulto Mayor</div>
                  <div className="text-[10px] text-slate-400 mt-1">Comedores y geriátricos</div>
                </div>
              </div>
            </div>

            {/* TABLA DE LIQUIDACIÓN POR MODALIDAD Y DESTINO SOCIAL */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                Matriz de Liquidación IOBPAS y Destino Social por Modalidad
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Modalidad Oficial</th>
                      <th className="p-3 text-right">Venta Facial</th>
                      <th className="p-3 text-right">Premios Brutos</th>
                      <th className="p-3 text-right">GGR (Base Imponible)</th>
                      <th className="p-3 text-center">Alícuota Canon</th>
                      <th className="p-3 text-right text-emerald-400">Canon IOBPAS (Bs.)</th>
                      <th className="p-3 text-right">Salud (40%)</th>
                      <th className="p-3 text-right">Deporte (30%)</th>
                      <th className="p-3 text-right">Educación (20%)</th>
                      <th className="p-3 text-right">Geriátricos (10%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Dices className="w-3.5 h-3.5 text-emerald-400" /> Triples y Terminales
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(triplesSales, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-400">-Bs. {formatBs(triplesGrossPrize, 2)}</td>
                      <td className="p-3 text-right font-mono text-emerald-300 font-bold">Bs. {formatBs(triplesGGR, 2)}</td>
                      <td className="p-3 text-center font-mono text-emerald-400">5,00%</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold text-sm">
                        Bs. {formatBs(triplesIobpas, 2)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(triplesIobpas * 0.4, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(triplesIobpas * 0.3, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(triplesIobpas * 0.2, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(triplesIobpas * 0.1, 2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sorteos de Animalitos
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(animalitosSales, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-400">-Bs. {formatBs(animalitosGrossPrize, 2)}</td>
                      <td className="p-3 text-right font-mono text-amber-300 font-bold">Bs. {formatBs(animalitosGGR, 2)}</td>
                      <td className="p-3 text-center font-mono text-amber-400">1,00%</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold text-sm">
                        Bs. {formatBs(animalitosIobpas, 2)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(animalitosIobpas * 0.4, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(animalitosIobpas * 0.3, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(animalitosIobpas * 0.2, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">Bs. {formatBs(animalitosIobpas * 0.1, 2)}</td>
                    </tr>
                    <tr className="bg-slate-950/80 font-bold border-t-2 border-slate-700">
                      <td className="p-3 text-white">TOTAL CONSOLIDADO IOBPAS</td>
                      <td className="p-3 text-right font-mono text-white">Bs. {formatBs(totalSales, 2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-Bs. {formatBs(totalGrossPrize, 2)}</td>
                      <td className="p-3 text-right font-mono text-emerald-300 font-extrabold">Bs. {formatBs(totalGgrNeto, 2)}</td>
                      <td className="p-3 text-center font-mono text-slate-400">-</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-black text-sm">
                        Bs. {formatBs(totalIobpasRoyalty, 2)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">Bs. {formatBs(totalIobpasRoyalty * 0.4, 2)}</td>
                      <td className="p-3 text-right font-mono text-blue-400 font-bold">Bs. {formatBs(totalIobpasRoyalty * 0.3, 2)}</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold">Bs. {formatBs(totalIobpasRoyalty * 0.2, 2)}</td>
                      <td className="p-3 text-right font-mono text-purple-400 font-bold">Bs. {formatBs(totalIobpasRoyalty * 0.1, 2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBNIVEL 3: SENIAT (JUEGOS + RETENCIÓN 16% IGF)
      ==================================================================== */}
      {activeSubTab === "seniat" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Subnivel 3: SENIAT (Impuesto s/ Juegos + Retención 16% IGF)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Alimentado con la venta actual de taquilla:{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      Bs. {formatBs(totalSales, 2)}
                    </span>{" "}
                    • Planilla 99029 (XML)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Juegos: 10% s/ GGR Universal
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  IGF: 16% Pago Único
                </span>
              </div>
            </div>

            {/* Dos pilares de recaudación SENIAT alimentados con taquilla */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Pilar 1: Impuesto sobre Juegos 10% GGR */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" /> 1. Impuesto a Juegos de Envite o Azar
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    10% s/ GGR del Neto
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Base Imponible CIAT (GGR Venta − Premios):</span>
                    <span className="font-mono text-white font-bold">
                      Bs. {formatBs(totalGgrNeto, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alícuota Armonizada (Para Todos los Juegos):</span>
                    <span className="font-mono text-amber-300">10,00%</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-amber-400 text-sm">
                    <span>Recaudación Directa SENIAT:</span>
                    <span className="font-mono">
                      Bs. {formatBs(totalSeniatGGR, 2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Base CIAT que grava la ganancia real de la industria sin destruir el capital de trabajo de los puntos de venta.
                  </p>
                </div>
              </div>

              {/* Pilar 2: Retención 16% IGF */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> 2. Ganancias Fortuitas (16% IGF)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Concepto 077
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Premios Brutos Acertados (100%):</span>
                    <span className="font-mono text-white font-bold">
                      Bs. {formatBs(totalGrossPrize, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Efectivo Pagado al Apostador (84%):</span>
                    <span className="font-mono text-emerald-400">
                      Bs. {formatBs(totalNetPaidToWinner, 2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400 text-sm">
                    <span>Retención 16% Enterada por Operadora:</span>
                    <span className="font-mono">
                      Bs. {formatBs(totalIgf16, 2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Enteramiento electrónico consolidado con la Planilla SENIAT 99029 (XML). La Taquilla queda exonerada de retención directa.
                  </p>
                </div>
              </div>
            </div>

            {/* Recaudación Total Tesoro Nacional */}
            <div className="mt-6 bg-gradient-to-r from-amber-50 via-slate-50 to-emerald-50 dark:bg-gradient-to-r dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="text-xs font-mono uppercase text-amber-800 dark:text-amber-400 font-bold">
                  Total Caja Fiscal Tesoro Nacional (SENIAT)
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  Bs. {formatBs(totalSeniatFiscal, 2)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Representa el {totalSales > 0 ? ((totalSeniatFiscal / totalSales) * 100).toFixed(2) : "0,00"}% de la venta bruta captada en la taquilla.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<RelacionRetencionesISLR RifAgente="J987654321" Periodo="202611">
  <DetalleRetencion>
    <RifRetenido>V18456789</RifRetenido>
    <NumeroFactura>${activeTickets[0]?.ticketNumber || "00012345"}</NumeroFactura>
    <NumeroControl>00-009823</NumeroControl>
    <FechaOperacion>03/11/2026</FechaOperacion>
    <CodigoConcepto>077</CodigoConcepto>
    <MontoOperacion>${totalGrossPrize.toFixed(2)}</MontoOperacion>
    <PorcentajeRetencion>16.00</PorcentajeRetencion>
    <MontoRetenido>${totalIgf16.toFixed(2)}</MontoRetenido>
  </DetalleRetencion>
</RelacionRetencionesISLR>`;
                    const blob = new Blob([xml], { type: "text/xml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `SENIAT_Planilla_99029_Taquilla_${activeTickets[0]?.ticketNumber || "00012345"}.xml`;
                    a.click();
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 shadow-sm dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Descargar XML Planilla 99029
                </button>
              </div>
            </div>

            {/* TABLA RESUMEN DE OBLIGACIONES FISCALES SENIAT */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-400" />
                Matriz de Obligaciones Tributarias Nacionales SENIAT
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Concepto Tributario</th>
                      <th className="p-3">Hecho Imponible</th>
                      <th className="p-3 text-right">Base Imponible (Bs.)</th>
                      <th className="p-3 text-center">Alícuota</th>
                      <th className="p-3">Agente de Retención / Enteramiento</th>
                      <th className="p-3">Formulario / Canal</th>
                      <th className="p-3 text-right text-amber-400">Monto Liquidado (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-400" /> Impuesto s/ Actividades de Juegos
                      </td>
                      <td className="p-3 text-slate-400">Explotación de juegos de envite y azar</td>
                      <td className="p-3 text-right font-mono text-emerald-300 font-bold">Bs. {formatBs(totalGgrNeto, 2)}</td>
                      <td className="p-3 text-center font-mono text-amber-400 font-bold">10,00%</td>
                      <td className="p-3 text-slate-300">Operadora de Juegos de Lotería</td>
                      <td className="p-3 text-slate-400">Declaración Mensual Juegos</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold text-sm">
                        Bs. {formatBs(totalSeniatGGR, 2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Retención 16% IGF (Concepto 077)
                      </td>
                      <td className="p-3 text-slate-400">Ganancias fortuitas en pago de premios</td>
                      <td className="p-3 text-right font-mono text-slate-300 font-bold">Bs. {formatBs(totalGrossPrize, 2)}</td>
                      <td className="p-3 text-center font-mono text-emerald-400 font-bold">16,00%</td>
                      <td className="p-3 text-emerald-300">Operadora (Agente Único de Red)</td>
                      <td className="p-3 text-slate-400">Planilla SENIAT 99029 (XML)</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold text-sm">
                        Bs. {formatBs(totalIgf16, 2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Impuesto al Valor Agregado (IVA)
                      </td>
                      <td className="p-3 text-slate-400">Venta de boletos y billetes de lotería</td>
                      <td className="p-3 text-right font-mono text-slate-400">Bs. {formatBs(totalSales, 2)}</td>
                      <td className="p-3 text-center font-mono text-blue-400">0,00% (Exento)</td>
                      <td className="p-3 text-slate-400">No Sujeto / Exento de IVA</td>
                      <td className="p-3 text-slate-400">Art. 16 num. 7 Ley de IVA</td>
                      <td className="p-3 text-right font-mono text-slate-400">Bs. 0,00</td>
                    </tr>
                    <tr className="bg-slate-950/80 font-bold border-t-2 border-slate-700">
                      <td className="p-3 text-white" colSpan={2}>TOTAL RECAUDACIÓN FISCAL TESORO NACIONAL</td>
                      <td className="p-3 text-right font-mono text-emerald-300" colSpan={4}>Efectividad de Cobro: 100% Criptográfica</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-black text-base">
                        Bs. {formatBs(totalSeniatFiscal, 2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBNIVEL 4: CONALOT & REGISTRO INTEGRAL RUNLOT (7 CATEGORÍAS)
      ==================================================================== */}
      {activeSubTab === "conalot" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Subnivel 4: CONALOT (Comisión Nacional de Lotería)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ente Regulador MPPEF • Supervisión Telemática • Homologación en el RUNLOT • Control Antifraude
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Punto Taquilla: RUN-AG-0412
                </span>
              </div>
            </div>

            {/* 3 Pilares Regulatorios de la CONALOT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <Cpu className="w-4 h-4 text-purple-400" /> Tasas de Supervisión Telemática
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cánones reglamentarios mensuales por punto de venta activo conectado a la nube del SCFD para costear la infraestructura de auditoría y monitoreo continuo del Estado.
                </p>
                <div className="mt-3 text-[11px] font-mono text-purple-300 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                  Punto de Venta Homologado: RUN-AG-0412
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <Server className="w-4 h-4 text-blue-400" /> Homologación RUNLOT de Quioscos
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Certificación técnica de hardware y software: soporte estricto de papel térmico de 80 mm (48 columnas), formato de 15 líneas y sello criptográfico SHA-256 en cada ticket.
                </p>
                <div className="mt-3 text-[11px] font-mono text-blue-300 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                  Hash Sorteo: {activeTickets[0]?.sha256Hash?.slice(0, 16) || "BFF803FCB670E689"}...
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Control Antifraude y Auditoría RNG
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cierre de apuestas telemático previo al sorteo, trazabilidad de timestamp e inviolabilidad criptográfica de jugadas para erradicar el juego clandestino y post-sellado.
                </p>
                <div className="mt-3 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  Estado SCFD: [HTTP 201] Certificado Válido
                </div>
              </div>
            </div>

            {/* SECCIÓN DEL REGISTRO OBLIGATORIO DE LOS 7 SUJETOS / ELEMENTOS RUNLOT */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Registro Obligatorio de Sujetos y Elementos en el RUNLOT (7 Categorías)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Censo y certificación técnica ante la Comisión Nacional de Lotería
                  </p>
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  Resolución CONALOT 002-2026
                </span>
              </div>

              {/* Pestañas de las 7 Categorías RUNLOT */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: "iobpas", label: "1. IOBPAS", icon: Landmark },
                  { id: "centros_apuestas", label: "2. Centros de Apuestas", icon: Store },
                  { id: "comercializadoras", label: "3. Comercializadoras", icon: Building2 },
                  { id: "sistemas_informaticos", label: "4. Sistemas Informáticos", icon: Cpu },
                  { id: "responsables_informaticos", label: "5. Resp. Informáticos", icon: UserCheck },
                  { id: "operadoras", label: "6. Operadoras", icon: ShieldCheck },
                  { id: "juegos", label: "7. Juegos y Modalidades", icon: Dices },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeRunlotCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveRunlotCategory(item.id as RunlotCategory)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Ficha Detallada de la Categoría RUNLOT Seleccionada */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5">
                {activeRunlotCategory === "iobpas" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                        Categoría 1: Institutos Oficiales de Beneficencia Pública y Asistencia Social (IOBPAS)
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                        Entes Concedentes
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Loterías oficiales creadas mediante Leyes y Decretos Estadales, titulares exclusivos del monopolio de explotación de juegos de envite y azar en sus respectivas jurisdicciones.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Requisito RUNLOT:</div>
                        <div className="text-xs font-bold text-white mt-1">Gaceta Oficial de Creación</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Vigente y Convalidada</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Supervisión CONALOT:</div>
                        <div className="text-xs font-bold text-white mt-1">Reglamentos de Sorteos</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">Homologación Previa</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Destino de Fondos:</div>
                        <div className="text-xs font-bold text-white mt-1">Cuentas Sociales Hospitalarias</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">Auditoría Trimestral</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "centros_apuestas" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-400" />
                        Categoría 2: Centros de Apuestas (Taquillas y Agencias Emisoras)
                      </h4>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                        Punto de Venta POS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Locales comerciales abiertos al público donde operan los terminales de venta físicos. Cada taquilla cuenta con un código único de registro (ej. <code>RUN-AG-0412</code>), geolocalización catastral y certificación técnica de la impresora térmica homologada de 80 mm.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Código RUNLOT:</div>
                        <div className="text-xs font-bold text-white mt-1">RUN-AG-0412</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">Centro Apuestas La Favorita</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Hardware Homologado:</div>
                        <div className="text-xs font-bold text-white mt-1">POS Térmico 80 mm (48 col)</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">15 Líneas Exactas</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Estatus Fiscal:</div>
                        <div className="text-xs font-bold text-white mt-1">Intermediario de Cobro</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Exonerado Retención SENIAT</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "comercializadoras" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        Categoría 3: Comercializadoras Intermediarias (Agentes Máster y Redes)
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                        Distribuidores Máster
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Empresas mercantiles encargadas de la distribución, soporte logístico, suministro de consumibles y liquidación de saldos de las taquillas y agencias. Actúan bajo contrato de intermediación por cuenta de terceros (Arts. 32 y 33 de la Providencia SNAT/2026/00093).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Código RUNLOT:</div>
                        <div className="text-xs font-bold text-white mt-1">RUN-COM-0089</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">Corporación Máster Central C.A.</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Régimen Municipal:</div>
                        <div className="text-xs font-bold text-white mt-1">2,5% s/ Spread Propio</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">LOCAPTEM Art. 29 num. 1</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Fianza y Garantía:</div>
                        <div className="text-xs font-bold text-white mt-1">Garantía Bancaria de Red</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">Auditada por CONALOT</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "sistemas_informaticos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        Categoría 4: Sistemas Informáticos (Software de Lotería y Plataformas de Apuestas)
                      </h4>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                        Software & Telemetría
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Plataformas informáticas y servidores centrales transaccionales donde se capturan, procesan y almacenan las jugadas. Requieren certificación de inalterabilidad, timestampping criptográfico, auditoría de hash SHA-256 de compilación y conexión nativa al API SCFD del Estado.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Identificador RUNLOT:</div>
                        <div className="text-xs font-bold text-white mt-1">SYS-CDAPUESTAS-v4.2</div>
                        <div className="text-[10px] text-purple-400 font-mono mt-0.5">Certificado RUN-SYS-019</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Hash de Compilación (SHA-256):</div>
                        <div className="text-xs font-mono font-bold text-slate-300 truncate mt-1">
                          BFF803FCB670E689...
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Binario Homologado</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Estándar de Seguridad:</div>
                        <div className="text-xs font-bold text-white mt-1">ISO/IEC 27001 + SCFD REST</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">TLS 1.3 / Latencia &lt; 250ms</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "responsables_informaticos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        Categoría 5: Responsables Informáticos (Ingenieros y Peritos de Sistemas)
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                        Firmantes Técnicos
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Profesionales colegiados (CIV) legalmente juramentados ante la CONALOT como custodios y garantes de la inalterabilidad de la base de datos, del código fuente del software y de la veracidad de los logs telemáticos enviados al Estado.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Registro Profesional:</div>
                        <div className="text-xs font-bold text-white mt-1">Ing. Sistemas CIV #241.890</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Perito Informático Juramentado</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Firma Criptográfica:</div>
                        <div className="text-xs font-bold text-white mt-1">Clave Pública RSA 4096</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Certificado Digital SUSCERTE</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Responsabilidad Legal:</div>
                        <div className="text-xs font-bold text-white mt-1">Solidaria / Penal por Alteración</div>
                        <div className="text-[10px] text-rose-400 font-mono mt-0.5">Ley de Delitos Informáticos</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "operadoras" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Categoría 6: Operadoras de Juegos de Lotería (Concesionarias Oficiales)
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                        Agente de Retención Único
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Entidades jurídicas autorizadas que firman los convenios de explotación con las IOBPAS. Asumen el riesgo financiero de la premiación, garantizan el pago de boletos ganadores y actúan como Agente Único de Retención del 16% IGF ante el SENIAT.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Código RUNLOT:</div>
                        <div className="text-xs font-bold text-white mt-1">RUN-OP-987654</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Operadora Oficial Lotería C.A.</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">RIF Jurídico:</div>
                        <div className="text-xs font-bold text-white mt-1">J-98765432-1</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">Agente de Retención SENIAT</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Fianza de Cumplimiento:</div>
                        <div className="text-xs font-bold text-white mt-1">Póliza de Fiel Cumplimiento</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">Depositada en IOBPAS</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRunlotCategory === "juegos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Dices className="w-4 h-4 text-rose-400" />
                        Categoría 7: Juegos y Modalidades Homologadas
                      </h4>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                        Modalidades Oficiales
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Catálogo oficial de modalidades reglamentadas y publicadas en Gaceta Oficial. Cada juego posee sus tablas oficiales de premiación, horarios de sorteos y límites de comercialización por jugada autorizada.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Modalidad Tradicional:</div>
                        <div className="text-xs font-bold text-white mt-1">Triples y Terminales</div>
                        <div className="text-[10px] text-rose-400 font-mono mt-0.5">Factor 600x | Payout 60%</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Modalidad Figuras:</div>
                        <div className="text-xs font-bold text-white mt-1">Lotería de Animalitos</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">Factor 30x (38 fig) | Payout 75%</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Homologación Sorteo:</div>
                        <div className="text-xs font-bold text-white mt-1">Presencia de Notario Público</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Transmisión en Vivo</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TABLA CENSO MAESTRO RUNLOT DE LOS 7 SUJETOS */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-purple-400" />
                Censo Maestro de Sujetos y Elementos Registrados en el RUNLOT
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Categoría RUNLOT</th>
                      <th className="p-3">Código Identificador</th>
                      <th className="p-3">Denominación / Sujeto</th>
                      <th className="p-3">Parámetro Técnico Homologado</th>
                      <th className="p-3 text-center">Estatus</th>
                      <th className="p-3 text-right">Tasa Supervisión SCFD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-emerald-400" /> 1. IOBPAS
                      </td>
                      <td className="p-3 font-mono text-emerald-300">RUN-IOB-001</td>
                      <td className="p-3">Lotería del Zulia (Beneficencia Pública)</td>
                      <td className="p-3 text-slate-400">Gaceta Oficial Estadal #142</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">VIGENTE</span></td>
                      <td className="p-3 text-right font-mono text-slate-400">Exento de Tasa</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-blue-400" /> 2. Centros de Apuestas
                      </td>
                      <td className="p-3 font-mono text-blue-300">RUN-AG-0412</td>
                      <td className="p-3">Centro de Apuestas La Favorita (POS)</td>
                      <td className="p-3 text-slate-400">Impresora Térmica 80mm (15 líneas)</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold">HOMOLOGADO</span></td>
                      <td className="p-3 text-right font-mono text-purple-300 font-bold">Bs. 150,00 / mes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" /> 3. Comercializadoras
                      </td>
                      <td className="p-3 font-mono text-amber-300">RUN-COM-0089</td>
                      <td className="p-3">Corporación Máster Central C.A.</td>
                      <td className="p-3 text-slate-400">Intermediación Arts. 32-33 / Fianza</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">CERTIFICADO</span></td>
                      <td className="p-3 text-right font-mono text-slate-400">Garantía Bancaria</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-purple-400" /> 4. Sistemas Informáticos
                      </td>
                      <td className="p-3 font-mono text-purple-300">RUN-SYS-019</td>
                      <td className="p-3">SYS-CDAPUESTAS-v4.2 (Motor Lotería)</td>
                      <td className="p-3 text-slate-400">SHA-256: BFF803FCB670E689...</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">AUDITADO</span></td>
                      <td className="p-3 text-right font-mono text-purple-300 font-bold">Bs. 1.200,00 / mes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> 5. Resp. Informáticos
                      </td>
                      <td className="p-3 font-mono text-cyan-300">RUN-PER-890</td>
                      <td className="p-3">Ing. de Sistemas Colegiado (CIV #241.890)</td>
                      <td className="p-3 text-slate-400">Firma Digital SUSCERTE RSA-4096</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">JURAMENTADO</span></td>
                      <td className="p-3 text-right font-mono text-slate-400">Fiel Custodio</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 6. Operadoras
                      </td>
                      <td className="p-3 font-mono text-emerald-300">RUN-OP-987654</td>
                      <td className="p-3">Operadora Oficial de Lotería C.A.</td>
                      <td className="p-3 text-slate-400">Agente Único SENIAT / Convenio IOBPAS</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">AUTORIZADO</span></td>
                      <td className="p-3 text-right font-mono text-slate-400">Fianza Concesión</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <Dices className="w-3.5 h-3.5 text-rose-400" /> 7. Juegos y Sorteos
                      </td>
                      <td className="p-3 font-mono text-rose-300">RUN-MOD-TRIPLES</td>
                      <td className="p-3">Triples Tradicionales (600x) & Animalitos (30x)</td>
                      <td className="p-3 text-slate-400">Tablas de Premios en Gaceta Oficial</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">HOMOLOGADO</span></td>
                      <td className="p-3 text-right font-mono text-slate-400">Canon s/ GGR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBCARPETA: SIMULADOR DE PROYECCIONES MULTI-ACTOR (A GRAN ESCALA)
      ==================================================================== */}
      {activeSubTab === "proyecciones" && (
        <div className="space-y-6">
          {/* PANEL DE CONTROLES DESLIZANTES DINÁMICOS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Simulador de Proyecciones Multi-Actor a Gran Escala
                  </h2>
                  <p className="text-xs text-slate-400">
                    Modela la red nacional proyectada en base al comportamiento observado en la taquilla
                  </p>
                </div>
              </div>

              {/* Botones de Acción: Copiar Resumen */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-400" />
                      <span>Copiar Resumen Ejecutivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PRESETS DE ESCENARIOS RÁPIDOS + BOTÓN DE SINCRONIZACIÓN CON TAQUILLA */}
            <div id="tour-sim-presets" className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNumTaquillas(1);
                    setNumComercializadoras(1);
                    setNumOperadoras(1);
                    setNumSistemasIT(1);
                    setNumResponsablesIT(1);
                    setDailySalesPerTaquilla(5000);
                    setTimeHorizonDays(30);
                  }}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:border-emerald-600/50 text-[11px] font-bold dark:text-emerald-300 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  🎯 Base Real Unitaria (1 Taquilla • 30d • Bs. 150.000)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNumTaquillas(25);
                    setNumComercializadoras(1);
                    setNumOperadoras(1);
                    setNumSistemasIT(1);
                    setNumResponsablesIT(1);
                    setDailySalesPerTaquilla(20000);
                    setTimeHorizonDays(30);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 text-[11px] font-bold dark:text-slate-300 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  🟢 Piloto (25 Taquillas)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNumTaquillas(150);
                    setNumComercializadoras(3);
                    setNumOperadoras(2);
                    setNumSistemasIT(2);
                    setNumResponsablesIT(2);
                    setDailySalesPerTaquilla(40000);
                    setTimeHorizonDays(30);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 text-[11px] font-bold dark:text-slate-300 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  🔵 Regional (150 Taquillas)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNumTaquillas(10000);
                    setNumComercializadoras(50);
                    setNumOperadoras(10);
                    setNumSistemasIT(10);
                    setNumResponsablesIT(10);
                    setDailySalesPerTaquilla(50000);
                    setTimeHorizonDays(365);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-cyan-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 text-[11px] font-bold dark:text-cyan-300 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  🟣 Gran Escala Nacional (10.000 Taquillas - 1 Año)
                </button>
              </div>

              {/* Botón sincronizar con la venta real de taquilla */}
              <button
                type="button"
                onClick={() => setDailySalesPerTaquilla(totalSales > 0 ? Math.round(totalSales) : 5000)}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:border-emerald-500/40 text-[11px] font-bold dark:text-emerald-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Store className="w-3.5 h-3.5" />
                Sincronizar con Taquilla: Bs. {formatBs(totalSales > 0 ? totalSales : 5000, 0)}
              </button>
            </div>

            {/* PARRILLA DE SLIDERS DE CONFIGURACIÓN (5 ACTORES + VARIABLES ECONÓMICAS) */}
            <div id="tour-sim-sliders" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 bg-slate-50 dark:bg-slate-950/70 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Slider 1: Taquillas */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-500" /> 1. Taquillas / Agencias POS
                  </span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-extrabold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-transparent">
                    {numTaquillas.toLocaleString("es-VE")} taquillas
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10000}
                  step={numTaquillas <= 10 ? 1 : 25}
                  value={numTaquillas}
                  onChange={(e) => setNumTaquillas(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1</span>
                  <span>5.000</span>
                  <span>10.000</span>
                </div>
              </div>

              {/* Slider 2: Comercializadoras */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" /> 2. Comercializadoras Intermediarias
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-transparent">
                    {numComercializadoras} comercializadoras
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={numComercializadoras}
                  onChange={(e) => setNumComercializadoras(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Slider 3: Operadoras */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 3. Operadoras de Lotería
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-transparent">
                    {numOperadoras} operadoras
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={numOperadoras}
                  onChange={(e) => setNumOperadoras(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Slider 4: Sistemas Informáticos */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" /> 4. Sistemas Informáticos (Plataformas)
                  </span>
                  <span className="font-mono text-purple-700 dark:text-purple-400 font-extrabold bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-transparent">
                    {numSistemasIT} plataformas IT
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={numSistemasIT}
                  onChange={(e) => setNumSistemasIT(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Slider 5: Responsables Informáticos */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> 5. Responsables Informáticos (Custodios)
                  </span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-transparent">
                    {numResponsablesIT} responsables IT
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={numResponsablesIT}
                  onChange={(e) => setNumResponsablesIT(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              {/* Slider 6: Venta Promedio Diaria */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-500" /> Venta Diaria por Taquilla
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-transparent">
                    Bs. {formatBs(dailySalesPerTaquilla, 0)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={2000000}
                  step={dailySalesPerTaquilla <= 10000 ? 500 : 5000}
                  value={dailySalesPerTaquilla}
                  onChange={(e) => setDailySalesPerTaquilla(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Bs. 1.000</span>
                  <span>Bs. 1.000.000</span>
                  <span>Bs. 2.000.000</span>
                </div>
              </div>

              {/* Selector 7: Horizonte Temporal */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Horizonte Temporal de la Simulación
                  </span>
                  <span className="font-mono text-blue-700 dark:text-blue-400 font-extrabold">
                    {timeHorizonDays === 1
                      ? "1 Día"
                      : timeHorizonDays === 30
                      ? "1 Mes (30 días)"
                      : "1 Año (365 días)"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "1 Día", days: 1 },
                    { label: "1 Mes (30d)", days: 30 },
                    { label: "1 Año (365d)", days: 365 },
                  ].map((h) => (
                    <button
                      key={h.days}
                      type="button"
                      onClick={() => setTimeHorizonDays(h.days)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        timeHorizonDays === h.days
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 shadow-sm"
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL DE INSERCIÓN DE COSTOS DE LICENCIAS IOBPAS Y REGISTRO RUNLOT / CONALOT POR ACTOR */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Panel de Inserción de Costos: Licencias IOBPAS y Registro RUNLOT / CONALOT por Actor de la Cadena
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Modifica los costos fijos mensuales por unidad para los 5 sujetos obligados de la red ({mesesEquivalentes > 1 ? `${mesesEquivalentes} meses proyectados` : "base 30 días"})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    5 Sujetos Obligados de Red
                  </span>
                </div>
              </div>

              {/* Grid de los 5 Actores con sus inputs editables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Actor 1: Taquilla / Agencia POS */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-blue-200 dark:border-blue-900/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" /> 1. Taquillas POS
                    </span>
                    <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                      {numTaquillas} unid.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">RUNLOT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={costoRunlotTaquilla}
                        onChange={(e) => setCostoRunlotTaquilla(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-cyan-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Licencia IOBPAS (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={costoIobpasTaquilla}
                        onChange={(e) => setCostoIobpasTaquilla(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-cyan-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Total Actor:</span>
                    <span className="text-blue-700 dark:text-blue-300 font-bold">Bs. {formatBs(totalRunlotTaquillas + totalIobpasTaquillas, 0)}</span>
                  </div>
                </div>

                {/* Actor 2: Comercializadoras */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-amber-200 dark:border-amber-900/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> 2. Comercializadora
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      {numComercializadoras} unid.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">RUNLOT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={costoRunlotComercializadora}
                        onChange={(e) => setCostoRunlotComercializadora(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Licencia IOBPAS (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={costoIobpasComercializadora}
                        onChange={(e) => setCostoIobpasComercializadora(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Total Actor:</span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold">Bs. {formatBs(totalRunlotComercializadoras + totalIobpasComercializadoras, 0)}</span>
                  </div>
                </div>

                {/* Actor 3: Operadoras de Lotería */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-emerald-200 dark:border-emerald-900/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 3. Operadoras
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      {numOperadoras} unid.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">RUNLOT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={costoRunlotOperadora}
                        onChange={(e) => setCostoRunlotOperadora(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Licencia IOBPAS (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={costoIobpasOperadora}
                        onChange={(e) => setCostoIobpasOperadora(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Total Actor:</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">Bs. {formatBs(totalRunlotOperadoras + totalIobpasOperadoras, 0)}</span>
                  </div>
                </div>

                {/* Actor 4: Empresas de Sistemas IT */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-purple-200 dark:border-purple-900/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> 4. Sistemas IT
                    </span>
                    <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                      {numSistemasIT} unid.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Homol. RUNLOT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={costoRunlotSistemaIT}
                        onChange={(e) => setCostoRunlotSistemaIT(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-purple-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Aval IOBPAS (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={costoIobpasSistemaIT}
                        onChange={(e) => setCostoIobpasSistemaIT(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-purple-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Total Actor:</span>
                    <span className="text-purple-700 dark:text-purple-300 font-bold">Bs. {formatBs(totalRunlotSistemasIT + totalIobpasSistemasIT, 0)}</span>
                  </div>
                </div>

                {/* Actor 5: Responsables Informáticos */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-indigo-200 dark:border-indigo-900/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> 5. Responsables IT
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                      {numResponsablesIT} unid.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Registro RUNLOT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={25}
                        value={costoRunlotResponsableIT}
                        onChange={(e) => setCostoRunlotResponsableIT(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Aval IOBPAS (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={25}
                        value={costoIobpasResponsableIT}
                        onChange={(e) => setCostoIobpasResponsableIT(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Honorarios IT (Bs./mes):</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={honorarioRespITPorMes}
                        onChange={(e) => setHonorarioRespITPorMes(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Total Actor:</span>
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold">Bs. {formatBs(totalRunlotResponsablesIT + totalIobpasResponsablesIT, 0)}</span>
                  </div>
                </div>
              </div>

              {/* Barra inferior resumen de recaudación por licencias */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Tasas RUNLOT (CONALOT):</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">Bs. {formatBs(projConalotTotal, 2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Licencias Fijas IOBPAS:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Bs. {formatBs(projIobpasLicenciasTotal, 2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Recaudación de Cánones Fijos:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Bs. {formatBs(projConalotTotal + projIobpasLicenciasTotal, 2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* MATRIZ DE RESULTADOS PROYECTADOS EN TIEMPO REAL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMNA 1: RECAUDACIÓN FISCAL Y SOCIAL DEL ESTADO */}
            <div id="tour-sim-public-revenue" className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recaudación Pública Proyectada (Tesoro, Municipios & Beneficencia)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                  Total Estado
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Venta Total Proyectada */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Venta Bruta Total Proyectada:</span>
                  <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    Bs. {formatBs(projVentaTotal, 2)}
                  </span>
                </div>

                {/* Retención 16% IGF SENIAT */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" /> SENIAT: 16% Retención IGF (Premios)
                    </div>
                    <div className="text-[10px] text-slate-500">Planilla 99029 XML • Enterado por Operadoras</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                    Bs. {formatBs(projRetencionIGF16, 2)}
                  </span>
                </div>

                {/* Impuesto SENIAT Juegos 10% GGR */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" /> SENIAT: Impuesto s/ Juegos (10% s/ GGR)
                    </div>
                    <div className="text-[10px] text-slate-500">Base Imponible CIAT (Venta − Premios)</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                    Bs. {formatBs(projSeniatJuegos10, 2)}
                  </span>
                </div>

                {/* Canon IOBPAS Beneficencia */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> IOBPAS: Beneficencia Pública (5% / 1% GGR)
                    </div>
                    <div className="text-[10px] text-slate-500">Destino Hospitales y Asistencia Social</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Bs. {formatBs(projIobpasCanonGGR, 2)}
                  </span>
                </div>

                {/* Licencias Fijas IOBPAS (5 Actores) */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> IOBPAS: Cánones y Licencias (5 Actores)
                    </div>
                    <div className="text-[10px] text-slate-500">Taquillas, Comercializadoras, Operadoras, Software y Custodios IT</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Bs. {formatBs(projIobpasLicenciasTotal, 2)}
                  </span>
                </div>

                {/* Alcaldías Municipales */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-500" /> Alcaldías: IAE Municipal (2,5% Comisiones)
                    </div>
                    <div className="text-[10px] text-slate-500">LOCAPTEM Art. 29 num. 1 (Taquilla + Comercializadora)</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                    Bs. {formatBs(projAlcaldiaTotal, 2)}
                  </span>
                </div>

                {/* CONALOT Tasas */}
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" /> CONALOT: Supervisión & Homologación RUNLOT
                    </div>
                    <div className="text-[10px] text-slate-500">Cánones telemáticos SCFD en los 5 actores de la red</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-400">
                    Bs. {formatBs(projConalotTotal, 2)}
                  </span>
                </div>

                {/* TOTAL ESTADO */}
                <div className="pt-2 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between items-center text-sm font-black">
                  <span className="text-slate-900 dark:text-white">TOTAL APORTE AL ESTADO VENEZOLANO:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 text-base font-extrabold">
                    Bs. {formatBs(projTotalRecaudacionPublica, 2)}
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: RENDIMIENTOS Y SOSTENIBILIDAD PRIVADA DE LA RED */}
            <div id="tour-sim-private-yields" className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rendimientos Privados de la Red y Actores Comerciales
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                  Sostenibilidad
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Taquillas Consolidadas */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-500" /> Red de Taquillas ({numTaquillas} Agencias):
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Bs. {formatBs(projTaquillaUtilidadNeta, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Promedio Neto tras IAE y Licencias:</span>
                    <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                      Bs. {formatBs(avgPerTaquilla, 2)}
                    </span>
                  </div>
                </div>

                {/* Comercializadoras Consolidadas */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-500" /> Comercializadoras ({numComercializadoras} Entidades):
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Bs. {formatBs(projComercialUtilidadNeta, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Promedio por Comercializadora (Spread + 50% Win):</span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                      Bs. {formatBs(avgPerComercializadora, 2)}
                    </span>
                  </div>
                </div>

                {/* Operadoras Consolidadas */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Operadoras ({numOperadoras} Concesionarias):
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Bs. {formatBs(projOperadoraUtilidadNeta, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Superávit Operativo Neto por Operadora:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      Bs. {formatBs(avgPerOperadora, 2)}
                    </span>
                  </div>
                </div>

                {/* Sistemas Informáticos */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-500" /> Sistemas Informáticos ({numSistemasIT} Plataformas):
                    </span>
                    <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-400">
                      Bs. {formatBs(projSistemasITNeto, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Promedio por Empresa de Software IT:</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                      Bs. {formatBs(avgPerSistemaIT, 2)}
                    </span>
                  </div>
                </div>

                {/* Responsables Informáticos */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Responsables Informáticos ({numResponsablesIT} Custodios IT):
                    </span>
                    <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400">
                      Bs. {formatBs(projResponsablesITNeto, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Honorario Neto Promedio por Custodio IT:</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                      Bs. {formatBs(avgPerResponsableIT, 2)}
                    </span>
                  </div>
                </div>

                {/* Premios Pagados Efectivo 84% */}
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-500" /> Premios Netos Pagados al Apostador (84%):
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      Bs. {formatBs(projPremiosEfectivo84, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1">
                    Pagados en taquilla en efectivo tras retención automática y blindada del 16% IGF.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
              BARRA DE INTEGRACIÓN CON GOOGLE SHEETS & EXCEL
          ==================================================================== */}
          <div id="tour-sim-tables" className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-sm dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 dark:border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Exportación Directa a Google Sheets & Microsoft Excel</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded">
                    Formato Tabular TSV / CSV
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Copia los datos estructurados con un clic para pegarlos directamente con <code className="bg-white/90 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-700 dark:text-cyan-300 font-bold border border-slate-200 dark:border-slate-700">Ctrl + V</code> en una hoja de Google Sheets, o descarga el archivo CSV compatible.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
              <button
                type="button"
                onClick={handleCopyForGoogleSheets}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  copiedSheets
                    ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/30"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                }`}
              >
                {copiedSheets ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado para Google Sheets!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Tabla para Google Sheets</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-sm dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Descargar CSV</span>
              </button>

              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-emerald-300 text-emerald-700 shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-emerald-500/40 dark:text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Google Sheets</span>
              </a>
            </div>
          </div>

          {/* ====================================================================
              TABLA 1: ESTADO DE RESULTADOS CONSOLIDADO DE LA RED
          ==================================================================== */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-500" />
                  Tabla 1: Estado de Resultados Consolidado de la Red ({timeHorizonDays === 1 ? "1 Día" : timeHorizonDays === 30 ? "30 Días" : "1 Año"} • {numTaquillas} Taquilla{numTaquillas > 1 ? "s" : ""})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cuadre matemático integral del 100% del valor facial distribuido entre el Estado, los apostadores y los actores privados
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/20 self-start sm:self-auto shadow-sm">
                Base Venta: Bs. {formatBs(projVentaTotal, 2)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Renglón Financiero / Tributario</th>
                    <th className="p-3 text-right">Monto Proyectado (Bs.)</th>
                    <th className="p-3 text-right">% s/ Facial</th>
                    <th className="p-3">Base de Cálculo</th>
                    <th className="p-3">Beneficiario / Responsable</th>
                    <th className="p-3">Fundamento Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                  <tr className="bg-blue-50/60 dark:bg-blue-950/20 font-bold">
                    <td className="p-3 text-slate-900 dark:text-white flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-blue-500" /> Venta Bruta Total Proyectada
                    </td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-cyan-300 font-extrabold text-sm">
                      Bs. {formatBs(projVentaTotal, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-cyan-300">100,00%</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{numTaquillas} Taquillas × Bs. {formatBs(dailySalesPerTaquilla, 0)}/día × {timeHorizonDays}d</td>
                    <td className="p-3 text-slate-800 dark:text-slate-300">Red Comercial Nacional</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Contrato Concesión</td>
                  </tr>

                  <tr>
                    <td className="p-3 text-slate-700 dark:text-slate-300 pl-6">(−) Premios Efectivo al Apostador (84%)</td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      -Bs. {formatBs(projPremiosEfectivo84, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {((projPremiosEfectivo84 / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Premios Brutos menos 16% IGF</td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400 font-semibold">Apostadores Ganadores</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Art. 18 Prov. SNAT/2026/00093</td>
                  </tr>

                  <tr className="bg-amber-50/40 dark:bg-amber-950/10">
                    <td className="p-3 text-amber-800 dark:text-amber-300 font-semibold pl-6">(−) Retención 16% IGF (Planilla 99029)</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                      -Bs. {formatBs(projRetencionIGF16, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      {((projRetencionIGF16 / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">16% Pago Único s/ Premios Brutos</td>
                    <td className="p-3 text-amber-800 dark:text-amber-300 font-semibold">SENIAT (Tesoro Nacional)</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Art. 65 LISLR / Dcto. 1.808</td>
                  </tr>

                  <tr className="bg-slate-100/70 dark:bg-slate-950/60 font-bold border-t border-slate-300 dark:border-slate-700">
                    <td className="p-3 text-emerald-800 dark:text-emerald-300">(=) GGR Consolidado de Red (Venta − Premios)</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                      Bs. {formatBs(projTotalGGR, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {((projTotalGGR / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Base Imponible Real del Juego</td>
                    <td className="p-3 text-slate-800 dark:text-slate-300">Margen Bruto Industria</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Recomendación CIAT</td>
                  </tr>

                  <tr>
                    <td className="p-3 text-slate-700 dark:text-slate-300 pl-6">(−) Comisiones Netas Taquillas</td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400">
                      -Bs. {formatBs(projTaquillaCommNeta, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {((projTaquillaCommNeta / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Comisión Bruta (20%/12%) menos 2,5% IAE</td>
                    <td className="p-3 text-blue-700 dark:text-blue-300 font-semibold">Red de {numTaquillas} Agencias POS</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">LOCAPTEM Art. 29 num. 1</td>
                  </tr>

                  <tr>
                    <td className="p-3 text-slate-700 dark:text-slate-300 pl-6">(−) Spread Neto Comercializadoras</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-300">
                      -Bs. {formatBs(projComercialSpreadNeto, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {((projComercialSpreadNeto / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Spread Diferencial (5%/6%) menos 2,5% IAE</td>
                    <td className="p-3 text-amber-700 dark:text-amber-300 font-semibold">{numComercializadoras} Comercializadoras Máster</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Arts. 32 y 33 Prov. 00093</td>
                  </tr>

                  <tr className="bg-blue-50/40 dark:bg-blue-950/10">
                    <td className="p-3 text-blue-800 dark:text-blue-300 font-semibold pl-6">(−) IAE Municipal Alcaldías (2,5%)</td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400 font-bold">
                      -Bs. {formatBs(projAlcaldiaTotal, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400">
                      {((projAlcaldiaTotal / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">2,50% armonizado s/ Comisiones</td>
                    <td className="p-3 text-blue-800 dark:text-blue-300 font-semibold">Haciendas Municipales (Alcaldías)</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">LOCAPTEM Art. 29 num. 1</td>
                  </tr>

                  <tr className="bg-amber-50/40 dark:bg-amber-950/10">
                    <td className="p-3 text-amber-800 dark:text-amber-300 font-semibold pl-6">(−) Impuesto s/ Juegos SENIAT (10%)</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                      -Bs. {formatBs(projSeniatJuegos10, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      {((projSeniatJuegos10 / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">10,00% universal s/ GGR del Neto</td>
                    <td className="p-3 text-amber-800 dark:text-amber-300 font-semibold">SENIAT (Tesoro Nacional)</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Ley de Juegos de Envite</td>
                  </tr>

                  <tr className="bg-emerald-50/40 dark:bg-emerald-950/10">
                    <td className="p-3 text-emerald-800 dark:text-emerald-300 font-semibold pl-6">(−) Canon IOBPAS Beneficencia Pública</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      -Bs. {formatBs(projIobpasCanonGGR, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {((projIobpasCanonGGR / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">5% Triples / 1% Animalitos s/ GGR</td>
                    <td className="p-3 text-emerald-800 dark:text-emerald-300 font-semibold">Loterías Oficiales (Hospitales)</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Ley de Lotería Art. 23</td>
                  </tr>

                  <tr className="bg-purple-50/40 dark:bg-purple-950/10">
                    <td className="p-3 text-purple-800 dark:text-purple-300 font-semibold pl-6">(−) Software y Soporte Sistemas IT</td>
                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-400 font-bold">
                      -Bs. {formatBs(projSistemasITFee, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-400">
                      {((projSistemasITFee / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">1,50% s/ Venta Bruta (Licencia SaaS)</td>
                    <td className="p-3 text-purple-800 dark:text-purple-300 font-semibold">{numSistemasIT} Plataformas Homologadas</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Certificación ISO 27001</td>
                  </tr>

                  <tr>
                    <td className="p-3 text-amber-800 dark:text-amber-300 pl-6">(−) Participación Comercializadora (50% Net Win)</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-300 font-bold">
                      -Bs. {formatBs(projShareComercializadoras, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {((projShareComercializadoras / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">50% Net Win Distribuible</td>
                    <td className="p-3 text-amber-700 dark:text-amber-300 font-semibold">{numComercializadoras} Comercializadoras Máster</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Contrato de Comercialización</td>
                  </tr>

                  <tr className="bg-emerald-50 dark:bg-emerald-950/30 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="p-3 text-emerald-800 dark:text-emerald-400">(=) Superávit Operativo Neto Operadoras (50% Net Win)</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black">
                      +Bs. {formatBs(projShareOperadoras, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {((projShareOperadoras / projVentaTotal) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">50% Net Win Distribuible</td>
                    <td className="p-3 text-emerald-800 dark:text-emerald-300 font-semibold">{numOperadoras} Operadoras Oficiales</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">Solvencia de Fianza</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cuadro de Verificación de Cuadre 100% */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Cuadre Matemático Consolidado: 100,00% del Valor Facial (Bs. {formatBs(projVentaTotal, 2)})
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-600/40">
                  Exacto al Céntimo (Diferencial: Bs. 0,00)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Apostadores</div>
                  <div className="font-bold text-slate-900 dark:text-white">{((projPremiosEfectivo84 / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projPremiosEfectivo84, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">SENIAT IGF 16%</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">{((projRetencionIGF16 / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projRetencionIGF16, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">SENIAT Juegos 10%</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">{((projSeniatJuegos10 / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projSeniatJuegos10, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">IOBPAS GGR</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">{((projIobpasCanonGGR / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projIobpasCanonGGR, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400">Alcaldías IAE</div>
                  <div className="font-bold text-blue-700 dark:text-blue-400">{((projAlcaldiaTotal / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projAlcaldiaTotal, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400">Taquillas POS</div>
                  <div className="font-bold text-blue-700 dark:text-blue-400">{((projTaquillaCommNeta / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projTaquillaCommNeta, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">Comercializ.</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">{(((projComercialSpreadNeto + projShareComercializadoras) / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projComercialSpreadNeto + projShareComercializadoras, 0)}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Operadoras</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">{((projShareOperadoras / projVentaTotal) * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500">Bs. {formatBs(projShareOperadoras, 0)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
              TABLA 2: MATRIZ DE RENDIMIENTOS UNITARIOS Y TOTALES POR ACTOR (5 ACTORES)
          ==================================================================== */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  Tabla 2: Matriz de Rendimientos y Costos por Sujeto Obligado y Actor de la Red (5 Niveles)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desglose de ingresos brutos, cargas tributarias, costos de licencias RUNLOT e IOBPAS, y rendimientos netos finales
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Sujeto Obligado / Actor de Red</th>
                    <th className="p-3 text-center">Unid.</th>
                    <th className="p-3 text-right">Venta Gestionada</th>
                    <th className="p-3 text-right">Ingreso Bruto</th>
                    <th className="p-3 text-right">Carga Fiscal / IAE</th>
                    <th className="p-3 text-right">Licencias RUNLOT + IOBPAS</th>
                    <th className="p-3 text-right text-blue-700 dark:text-cyan-400">Promedio Unitario Neto</th>
                    <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">Rendimiento Total Red</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                  {/* Nivel 1: Taquillas */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-blue-500" /> Taquillas / Agencias POS
                    </td>
                    <td className="p-3 text-center font-mono text-cyan-700 dark:text-cyan-300 font-bold">{numTaquillas}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projVentaTotal, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projTaquillaCommBruta, 2)}</td>
                    <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">-Bs. {formatBs(projAlcaldiaTaquillas, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">-Bs. {formatBs(totalRunlotTaquillas + totalIobpasTaquillas, 2)}</td>
                    <td className="p-3 text-right font-mono text-blue-700 dark:text-cyan-300 font-extrabold text-sm">
                      Bs. {formatBs(avgPerTaquilla, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      Bs. {formatBs(projTaquillaUtilidadNeta, 2)}
                    </td>
                  </tr>

                  {/* Nivel 2: Comercializadoras */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-500" /> Comercializadoras Intermediarias
                    </td>
                    <td className="p-3 text-center font-mono text-amber-700 dark:text-amber-300 font-bold">{numComercializadoras}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projVentaTotal, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projComercialSpreadBruto + projShareComercializadoras, 2)}</td>
                    <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">-Bs. {formatBs(projAlcaldiaComercial, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">-Bs. {formatBs(totalRunlotComercializadoras + totalIobpasComercializadoras, 2)}</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                      Bs. {formatBs(avgPerComercializadora, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      Bs. {formatBs(projComercialUtilidadNeta, 2)}
                    </td>
                  </tr>

                  {/* Nivel 3: Operadoras */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Operadoras de Juegos de Lotería
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-300 font-bold">{numOperadoras}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projVentaTotal, 2)}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projShareOperadoras, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">Bs. 0,00 (No Sujeto)</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">-Bs. {formatBs(totalRunlotOperadoras + totalIobpasOperadoras, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                      Bs. {formatBs(avgPerOperadora, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      Bs. {formatBs(projOperadoraUtilidadNeta, 2)}
                    </td>
                  </tr>

                  {/* Nivel 4: Sistemas Informáticos */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-purple-500" /> Empresas de Sistemas Informáticos
                    </td>
                    <td className="p-3 text-center font-mono text-purple-700 dark:text-purple-300 font-bold">{numSistemasIT}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projVentaTotal, 2)}</td>
                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-300">Bs. {formatBs(projSistemasITFee, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">Bs. 0,00</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">-Bs. {formatBs(totalRunlotSistemasIT + totalIobpasSistemasIT, 2)}</td>
                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-300 font-extrabold text-sm">
                      Bs. {formatBs(avgPerSistemaIT, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-400 font-bold">
                      Bs. {formatBs(projSistemasITNeto, 2)}
                    </td>
                  </tr>

                  {/* Nivel 5: Responsables Informáticos */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Responsables Informáticos (Custodios IT)
                    </td>
                    <td className="p-3 text-center font-mono text-indigo-700 dark:text-indigo-300 font-bold">{numResponsablesIT}</td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">Bs. {formatBs(projVentaTotal, 2)}</td>
                    <td className="p-3 text-right font-mono text-indigo-700 dark:text-indigo-300">Bs. {formatBs(projTotalHonorariosRespIT, 2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">Bs. 0,00</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">-Bs. {formatBs(totalRunlotResponsablesIT + totalIobpasResponsablesIT, 2)}</td>
                    <td className="p-3 text-right font-mono text-indigo-700 dark:text-indigo-300 font-extrabold text-sm">
                      Bs. {formatBs(avgPerResponsableIT, 2)}
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-700 dark:text-indigo-400 font-bold">
                      Bs. {formatBs(projResponsablesITNeto, 2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
