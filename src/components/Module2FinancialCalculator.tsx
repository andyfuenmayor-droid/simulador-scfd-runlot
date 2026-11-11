"use client";

import React, { useState, useEffect } from "react";
import {
  GameModalityId,
  RecordedPOSTicket,
  IaeImputationMode,
  GamingTaxImputationMode,
  TriplesCommissionRate,
  CommissionTierId,
} from "@/types/simulator";
import {
  formatBs,
  formatIntBs,
  generateSeniatWithholdingXML,
} from "@/lib/cryptoUtils";
import { COMMISSION_TIERS } from "@/components/ModuleCommissionsTier";
import { Module2RifasCalculatorView } from "@/components/Module2RifasCalculatorView";
import {
  AlertOctagon,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileCode2,
  Folder,
  FolderOpen,
  Landmark,
  Layers,
  Printer,
  Receipt,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

type ActiveFolderLevel = "nivel1" | "nivel2" | "nivel3";

interface TicketFinancialBreakdown {
  ticket: RecordedPOSTicket;
  shortLabel: string;
  sales: number;
  grossPrize: number;
  igf16Amount: number;
  netPrizePaidAfter16: number; // Premios sin IGF (Premio Bruto - 16%)
  taquillaCommPct: number;
  taquillaCommAmount: number;
  operadoraTotalCommPct: number;
  operadoraTotalCommAmount: number;
  spreadPct: number;
  spreadAmount: number;
  totalCommPct: number;
  totalChainCommAmount: number;

  // Pago Alcaldía sobre Comisiones (2,5% LOCAPTEM Reforma) vs Pago Alcaldía s/ Venta (5% Vigente)
  alcaldiaOnCommissionsAmount: number;
  alcaldiaFacialVigenteAmount: number;

  // NET WIN SEGÚN SELECTOR INTERACTIVO
  ggrNeto: number; // GGR del Neto: Venta - Premios
  netWinReforma: number;
  distributableNetWinReforma: number;
  comercializadoraNetWin50Reforma: number;
  operadoraNetWin50Reforma: number;
  comercializadoraIaeReforma: number;
  comercializadoraFinalCommReforma: number;
  comercializadoraTotalOwnReforma: number;

  // Esquema Vigente
  netWinVigente: number;
  comercializadoraNetWin50Vigente: number;
  operadoraNetWin50Vigente: number;
  comercializadoraTotalOwnVigente: number;

  seniatFacialPct: number;
  iobpasFacialPct: number;
  seniatReformaRate: number;
  iobpasReformaRate: number;
  seniatReformaAmount: number;
  iobpasReformaAmount: number;
}

function computeTicketBreakdown(
  t: RecordedPOSTicket,
  triplesCommRate: TriplesCommissionRate = 30,
  iaeMode: IaeImputationMode = "cascada_cdapuestas",
  taxMode: GamingTaxImputationMode = "operadora_absorbe",
  tierRates?: { taquillaPct: number; spreadPct: number },
  comercializadoraSharePct: number = 50
): TicketFinancialBreakdown {
  const isAnimalitos = t.modalityId === "animalitos";
  const sales = t.totalFacial;

  // Premio Bruto del sorteo/ticket:
  // En Tiraje Completo: 1 ganador * apuesta unitaria * multiplicador (30x en Animalitos = 30.000; 600x en Triples = 600.000)
  const grossPrize = t.isFullTiraje
    ? t.guaranteedOrMaxGrossPrize
    : isAnimalitos
    ? sales * (30 / 38)
    : sales * (600 / 1000);

  // Premios sin IGF (Premio Bruto - 16% IGF Art. 18)
  const igf16Amount = grossPrize * 0.16;
  const netPrizePaidAfter16 = grossPrize - igf16Amount; // Bs. 504.000 en Triples / Bs. 25.200 en Animalitos

  // GGR del Neto solicitado expresamente: GGR = Venta - Premios
  const ggrNeto = Math.max(0, sales - grossPrize);

  // Comisiones por Modalidad y Tramos:
  // Nivel 2 Comercializadora recibe comisión de Operadora y cede la taquilla, quedando con el Diferencial (Spread)
  let taquillaCommPct = 20;
  let operadoraTotalCommPct = 25; // 25% para Triples
  let spreadPct = 5; // Diferencial de Comisiones (Spread Propio: 25% - 20% = 5%)

  if (isAnimalitos) {
    taquillaCommPct = 12;
    operadoraTotalCommPct = 18;
    spreadPct = 6;
  } else if (tierRates) {
    taquillaCommPct = tierRates.taquillaPct;
    spreadPct = tierRates.spreadPct;
    operadoraTotalCommPct = taquillaCommPct + spreadPct;
  } else if (triplesCommRate === 25) {
    taquillaCommPct = 20;
    operadoraTotalCommPct = 25;
    spreadPct = 5;
  } else if (triplesCommRate === 26) {
    taquillaCommPct = 18;
    operadoraTotalCommPct = 26;
    spreadPct = 8;
  } else if (triplesCommRate === 30) {
    taquillaCommPct = 20;
    operadoraTotalCommPct = 30;
    spreadPct = 10;
  } else {
    taquillaCommPct = 20;
    operadoraTotalCommPct = 34;
    spreadPct = 14;
  }

  const totalCommPct = operadoraTotalCommPct;

  const taquillaCommAmount = sales * (taquillaCommPct / 100);
  const operadoraTotalCommAmount = sales * (operadoraTotalCommPct / 100);
  const spreadAmount = sales * (spreadPct / 100); // Diferencial de Comisiones
  const totalChainCommAmount = taquillaCommAmount + spreadAmount;

  // Comisiones Finales de la Comercializadora (Diferencial neto de IAE 2,5%)
  const comercializadoraIaeReforma = spreadAmount * 0.025;
  const comercializadoraFinalCommReforma =
    spreadAmount - comercializadoraIaeReforma;

  // Pago Alcaldía:
  // 1) 2,5% LOCAPTEM Reforma sobre comisiones
  const alcaldiaOnCommissionsAmount = totalChainCommAmount * 0.025;
  // 2) 5% s/ Venta Facial (Esquema Vigente SNAT/2026/00093)
  const alcaldiaFacialVigenteAmount = sales * 0.05;

  // Alícuotas de Tributos de Juego solicitadas expresamente por el usuario:
  // 1) SENIAT sobre GGR (Venta - Premios, GGR del Neto): 10% Armonizado para todos (Triples y Animalitos)
  const seniatReformaRate = 0.10;
  const seniatReformaAmount = ggrNeto * seniatReformaRate;

  // 2) Royalty Lotería IOBPAS (Propuesta): 5% Armonizado sobre GGR para todos (Triples y Animalitos)
  const iobpasReformaRate = 0.05;
  const iobpasReformaAmount = ggrNeto * iobpasReformaRate;
  const totalGameTaxes = seniatReformaAmount + iobpasReformaAmount;

  // CÁLCULO DE NET WIN:
  // Net Win de Juego = GGR (Venta - Premios) - Comisión Taquilla - Diferencial Comercializadora
  const netWinReforma = Math.max(0, ggrNeto - totalChainCommAmount);

  // Reparto del Net Win con proporción societaria dinámica (editable de 30% a 70%):
  const distributableNetWinReforma =
    taxMode === "deducido_netwin"
      ? netWinReforma - totalGameTaxes
      : netWinReforma;

  const comerRatio = comercializadoraSharePct / 100;
  const operRatio = (100 - comercializadoraSharePct) / 100;

  const comercializadoraNetWin50Reforma =
    distributableNetWinReforma * comerRatio;
  const operadoraNetWin50Reforma = distributableNetWinReforma * operRatio;

  const comercializadoraTotalOwnReforma =
    comercializadoraFinalCommReforma + comercializadoraNetWin50Reforma;

  // Esquema Vigente:
  const netWinVigente = Math.max(
    0,
    sales - totalChainCommAmount - alcaldiaFacialVigenteAmount - grossPrize
  );
  const comercializadoraNetWin50Vigente = netWinVigente * comerRatio;
  const operadoraNetWin50Vigente = netWinVigente * operRatio;
  const comercializadoraTotalOwnVigente =
    spreadAmount - sales * 0.05 + comercializadoraNetWin50Vigente;

  return {
    ticket: t,
    shortLabel: isAnimalitos ? "Animalitos" : "Triples",
    sales,
    grossPrize,
    igf16Amount,
    netPrizePaidAfter16,
    ggrNeto,
    taquillaCommPct,
    taquillaCommAmount,
    operadoraTotalCommPct,
    operadoraTotalCommAmount,
    spreadPct,
    spreadAmount,
    totalCommPct,
    totalChainCommAmount,
    alcaldiaOnCommissionsAmount,
    alcaldiaFacialVigenteAmount,
    netWinReforma,
    distributableNetWinReforma,
    comercializadoraNetWin50Reforma,
    operadoraNetWin50Reforma,
    comercializadoraIaeReforma,
    comercializadoraFinalCommReforma,
    comercializadoraTotalOwnReforma,
    netWinVigente,
    comercializadoraNetWin50Vigente,
    operadoraNetWin50Vigente,
    comercializadoraTotalOwnVigente,
    seniatFacialPct: isAnimalitos ? 10 : 12,
    iobpasFacialPct: isAnimalitos ? 1 : 5,
    seniatReformaRate,
    iobpasReformaRate,
    seniatReformaAmount,
    iobpasReformaAmount,
  };
}

interface Module2FinancialCalculatorProps {
  activeModalityId: GameModalityId;
  recordedTickets: RecordedPOSTicket[];
  hasEmittedTickets: boolean;
  onRemoveTicket: (ticketNumber: string) => void;
  onClearEmittedTickets: () => void;
  onGoToPOS: () => void;
  ecosystemMode?: "loteria" | "rifas";
}

export const Module2FinancialCalculator: React.FC<
  Module2FinancialCalculatorProps
> = ({
  activeModalityId,
  recordedTickets,
  hasEmittedTickets,
  onRemoveTicket,
  onClearEmittedTickets,
  onGoToPOS,
  ecosystemMode = "loteria",
}) => {
  if (ecosystemMode === "rifas") {
    return <Module2RifasCalculatorView onGoToPOS={onGoToPOS} />;
  }
  const [activeFolder, setActiveFolder] =
    useState<ActiveFolderLevel>("nivel1");
  const [selectedTicketFilter, setSelectedTicketFilter] =
    useState<string>("ALL");

  // PARÁMETROS CONTABLES Y SOCIETARIOS CDAPUESTAS (HOMOLOGADO RUNLOT)
  const [iaeMode] =
    useState<IaeImputationMode>("base_premios_sin_igf");
  const [taxMode] =
    useState<GamingTaxImputationMode>("deducido_netwin");
  const [triplesCommRate] =
    useState<TriplesCommissionRate>(25);
  const [selectedTier] =
    useState<CommissionTierId>("tramo_comercializadora_25");
  const [comercializadoraSharePct] =
    useState<number>(50);
  const operadoraSharePct = 100 - comercializadoraSharePct;

  // MODAL XML SENIAT
  const [showXmlModal, setShowXmlModal] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  useEffect(() => {
    if (
      selectedTicketFilter !== "ALL" &&
      selectedTicketFilter !== "MOD_TRIPLES" &&
      selectedTicketFilter !== "MOD_ANIMALITOS" &&
      !recordedTickets.some((t) => t.ticketNumber === selectedTicketFilter)
    ) {
      setSelectedTicketFilter("ALL");
    }
  }, [recordedTickets, selectedTicketFilter]);

  const activeTicketsForCalc =
    selectedTicketFilter === "ALL"
      ? recordedTickets
      : selectedTicketFilter === "MOD_TRIPLES"
      ? recordedTickets.filter((t) => t.modalityId === "triples")
      : selectedTicketFilter === "MOD_ANIMALITOS"
      ? recordedTickets.filter((t) => t.modalityId === "animalitos")
      : recordedTickets.filter((t) => t.ticketNumber === selectedTicketFilter);

  const iaeFacialPct = 5;
  const iaeReformPct = 2.5;

  const currentTierConfig =
    selectedTier === "tramo1"
      ? COMMISSION_TIERS.tramo1
      : selectedTier === "tramo3"
      ? COMMISSION_TIERS.tramo3
      : selectedTier === "tramo_master_34"
      ? COMMISSION_TIERS.tramo_master_34
      : COMMISSION_TIERS.tramo_comercializadora_25;

  const activeTaquillaPct = currentTierConfig.taquillaCommPct;
  const activeSpreadPct = currentTierConfig.spreadMasterPct;

  // ============================================================================
  // CÁLCULOS DINÁMICOS BASADOS EN LOS SELECTORES Y ESCALAS INTERACTIVAS
  // ============================================================================
  const breakdowns = activeTicketsForCalc.map((t) =>
    computeTicketBreakdown(
      t,
      triplesCommRate,
      iaeMode,
      taxMode,
      { taquillaPct: activeTaquillaPct, spreadPct: activeSpreadPct },
      comercializadoraSharePct
    )
  );

  const triplesBreakdowns = breakdowns.filter(
    (b) => b.ticket.modalityId === "triples"
  );
  const animalitosBreakdowns = breakdowns.filter(
    (b) => b.ticket.modalityId === "animalitos"
  );

  const hasTriples = triplesBreakdowns.length > 0;
  const hasAnimalitos = animalitosBreakdowns.length > 0;
  const isMixedModalities = hasTriples && hasAnimalitos;

  const singleRefModality: GameModalityId =
    hasTriples && !hasAnimalitos
      ? "triples"
      : hasAnimalitos && !hasTriples
      ? "animalitos"
      : activeModalityId;

  const salesTriples = triplesBreakdowns.reduce((a, b) => a + b.sales, 0);
  const salesAnimalitos = animalitosBreakdowns.reduce((a, b) => a + b.sales, 0);
  const grossSales = salesTriples + salesAnimalitos;

  const totalPosOptionsCount = activeTicketsForCalc.reduce(
    (acc, t) => acc + t.tirajeOptionCount,
    0
  );

  // Premios Brutos, Retención 16% IGF y Premios sin IGF
  const grossPrizeTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.grossPrize,
    0
  );
  const grossPrizeAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.grossPrize,
    0
  );
  const totalPosGrossPrize = grossPrizeTriples + grossPrizeAnimalitos;

  const igf16Triples = triplesBreakdowns.reduce((a, b) => a + b.igf16Amount, 0);
  const igf16Animalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.igf16Amount,
    0
  );
  const totalPosIgf16 = igf16Triples + igf16Animalitos;

  const netPrizeTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.netPrizePaidAfter16,
    0
  );
  const netPrizeAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.netPrizePaidAfter16,
    0
  );
  const totalPosNetPrize = netPrizeTriples + netPrizeAnimalitos; // Bs. 529.200,00

  // GGR del Neto: Venta - Premios (solicitado expresamente por el usuario)
  const ggrNetoTriples = Math.max(0, salesTriples - grossPrizeTriples);
  const ggrNetoAnimalitos = Math.max(0, salesAnimalitos - grossPrizeAnimalitos);
  const totalGgrNeto = ggrNetoTriples + ggrNetoAnimalitos;

  // Comisiones Totales de Cadena
  const totalChainCommTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.totalChainCommAmount,
    0
  );
  const totalChainCommAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.totalChainCommAmount,
    0
  );
  const totalChainCommAmount =
    totalChainCommTriples + totalChainCommAnimalitos;

  // Pago Alcaldía 2,5% sobre comisiones
  const alcaldiaOnCommTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.alcaldiaOnCommissionsAmount,
    0
  );
  const alcaldiaOnCommAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.alcaldiaOnCommissionsAmount,
    0
  );
  const totalAlcaldiaOnComm = alcaldiaOnCommTriples + alcaldiaOnCommAnimalitos;

  // NIVEL 1: Comisión Taquilla
  const taquillaCommTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.taquillaCommAmount,
    0
  );
  const taquillaCommAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.taquillaCommAmount,
    0
  );
  const taquillaCommAmount = taquillaCommTriples + taquillaCommAnimalitos;

  // NIVEL 2: Comisión Total Operadora y Diferencial (Spread) Comercializadora
  const operadoraTotalCommTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.operadoraTotalCommAmount,
    0
  );
  const operadoraTotalCommAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.operadoraTotalCommAmount,
    0
  );
  const totalOperadoraTotalCommAmount =
    operadoraTotalCommTriples + operadoraTotalCommAnimalitos;

  const spreadTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.spreadAmount,
    0
  );
  const spreadAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.spreadAmount,
    0
  );
  const comercializadoraSpreadAmount = spreadTriples + spreadAnimalitos;

  // Comisiones Finales Comercializadora (Spread neto de IAE 2,5%)
  const comercializadoraFinalCommTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.comercializadoraFinalCommReforma,
    0
  );
  const comercializadoraFinalCommAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.comercializadoraFinalCommReforma,
    0
  );
  const comercializadoraFinalCommTotal =
    comercializadoraFinalCommTriples + comercializadoraFinalCommAnimalitos;

  // NET WIN TOTAL (BASE Y DISTRIBUIBLE TRAS TRIBUTOS DE JUEGO)
  const netWinTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.netWinReforma,
    0
  );
  const netWinAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.netWinReforma,
    0
  );
  const netWinAmount = netWinTriples + netWinAnimalitos;

  const distributableNetWinTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.distributableNetWinReforma,
    0
  );
  const distributableNetWinAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.distributableNetWinReforma,
    0
  );
  const distributableNetWinAmount =
    distributableNetWinTriples + distributableNetWinAnimalitos;
  const operadoraGrossShareAmount = netWinAmount * (operadoraSharePct / 100);

  // REPARTO NET WIN COMERCIALIZADORA (% Dinámico)
  const comercializadoraNetWinTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.comercializadoraNetWin50Reforma,
    0
  );
  const comercializadoraNetWinAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.comercializadoraNetWin50Reforma,
    0
  );
  const comercializadoraNetWinShareAmount =
    comercializadoraNetWinTriples + comercializadoraNetWinAnimalitos;

  // REPARTO NET WIN OPERADORA (% Dinámico)
  const operadoraRemanenteTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.operadoraNetWin50Reforma,
    0
  );
  const operadoraRemanenteAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.operadoraNetWin50Reforma,
    0
  );
  const operadoraRemanenteAmount =
    operadoraRemanenteTriples + operadoraRemanenteAnimalitos;

  // RESULTADO NETO TOTAL COMERCIALIZADORA (Comisiones Finales + Net Win)
  const lvl2NetReformaTriples =
    comercializadoraFinalCommTriples + comercializadoraNetWinTriples;
  const lvl2NetReformaAnimalitos =
    comercializadoraFinalCommAnimalitos + comercializadoraNetWinAnimalitos;
  const lvl2NetReforma =
    comercializadoraFinalCommTotal + comercializadoraNetWinShareAmount;

  // --- CÁLCULOS TRIBUTARIOS NIVEL 1: TAQUILLA ---
  const lvl1IaeVigenteTriples = salesTriples * (iaeFacialPct / 100);
  const lvl1IaeVigenteAnimalitos = salesAnimalitos * (iaeFacialPct / 100);
  const lvl1IaeVigente = lvl1IaeVigenteTriples + lvl1IaeVigenteAnimalitos;

  const lvl1NetVigenteTriples = taquillaCommTriples - lvl1IaeVigenteTriples;
  const lvl1NetVigenteAnimalitos =
    taquillaCommAnimalitos - lvl1IaeVigenteAnimalitos;
  const lvl1NetVigente = taquillaCommAmount - lvl1IaeVigente;
  const lvl1ConfiscatedPct =
    taquillaCommAmount > 0 ? (lvl1IaeVigente / taquillaCommAmount) * 100 : 0;

  const lvl1IaeReformaTriples = taquillaCommTriples * (iaeReformPct / 100);
  const lvl1IaeReformaAnimalitos =
    taquillaCommAnimalitos * (iaeReformPct / 100);
  const lvl1IaeReforma = lvl1IaeReformaTriples + lvl1IaeReformaAnimalitos;

  const lvl1NetReformaTriples = taquillaCommTriples - lvl1IaeReformaTriples;
  const lvl1NetReformaAnimalitos =
    taquillaCommAnimalitos - lvl1IaeReformaAnimalitos;
  const lvl1NetReforma = taquillaCommAmount - lvl1IaeReforma;
  const lvl1RetainedPct =
    taquillaCommAmount > 0 ? (lvl1NetReforma / taquillaCommAmount) * 100 : 0;

  // --- CÁLCULOS TRIBUTARIOS NIVEL 2: COMERCIALIZADORA ---
  const lvl2IaeVigenteTriples = salesTriples * (iaeFacialPct / 100);
  const lvl2IaeVigenteAnimalitos = salesAnimalitos * (iaeFacialPct / 100);
  const lvl2IaeVigente = lvl2IaeVigenteTriples + lvl2IaeVigenteAnimalitos;

  const lvl2IaeReformaTriples = spreadTriples * (iaeReformPct / 100);
  const lvl2IaeReformaAnimalitos = spreadAnimalitos * (iaeReformPct / 100);
  const lvl2IaeReforma = lvl2IaeReformaTriples + lvl2IaeReformaAnimalitos;

  const comercializadoraFinalCommVigenteTriples =
    spreadTriples - lvl2IaeVigenteTriples;
  const comercializadoraFinalCommVigenteAnimalitos =
    spreadAnimalitos - lvl2IaeVigenteAnimalitos;
  const comercializadoraFinalCommVigenteTotal =
    comercializadoraFinalCommVigenteTriples +
    comercializadoraFinalCommVigenteAnimalitos;

  // --- CÁLCULOS TRIBUTARIOS NIVEL 3: OPERADORA ---
  const lvl3SeniatVigenteTriples = salesTriples * 0.12;
  const lvl3SeniatVigenteAnimalitos = salesAnimalitos * 0.1;
  const lvl3SeniatVigente =
    lvl3SeniatVigenteTriples + lvl3SeniatVigenteAnimalitos;

  const lvl3IobpasVigenteTriples = salesTriples * 0.05;
  const lvl3IobpasVigenteAnimalitos = salesAnimalitos * 0.01;
  const lvl3IobpasVigente =
    lvl3IobpasVigenteTriples + lvl3IobpasVigenteAnimalitos;

  const lvl3IaeVigenteTriples = salesTriples * (iaeFacialPct / 100);
  const lvl3IaeVigenteAnimalitos = salesAnimalitos * (iaeFacialPct / 100);
  const lvl3IaeVigente = lvl3IaeVigenteTriples + lvl3IaeVigenteAnimalitos;

  const lvl3TotalTaxVigenteTriples =
    lvl3SeniatVigenteTriples + lvl3IobpasVigenteTriples + lvl3IaeVigenteTriples;
  const lvl3TotalTaxVigenteAnimalitos =
    lvl3SeniatVigenteAnimalitos +
    lvl3IobpasVigenteAnimalitos +
    lvl3IaeVigenteAnimalitos;
  const lvl3TotalTaxVigente =
    lvl3TotalTaxVigenteTriples + lvl3TotalTaxVigenteAnimalitos;

  const lvl3DeficitVigente = operadoraGrossShareAmount - lvl3TotalTaxVigente;

  // REFORMA OPERADORA (SENIAT + IOBPAS + IAE OPERADORA)
  const lvl3SeniatReformaTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.seniatReformaAmount,
    0
  );
  const lvl3SeniatReformaAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.seniatReformaAmount,
    0
  );
  const lvl3SeniatReforma =
    lvl3SeniatReformaTriples + lvl3SeniatReformaAnimalitos;

  const lvl3IobpasReformaTriples = triplesBreakdowns.reduce(
    (a, b) => a + b.iobpasReformaAmount,
    0
  );
  const lvl3IobpasReformaAnimalitos = animalitosBreakdowns.reduce(
    (a, b) => a + b.iobpasReformaAmount,
    0
  );
  const lvl3IobpasReforma =
    lvl3IobpasReformaTriples + lvl3IobpasReformaAnimalitos;

  // IAE Municipal en Operadora = Bs. 0,00 (No aplica por prohibición de doble tributación constitucional: no tiene comisión comercial y GGR es aleatorio)
  const lvl3IaeReformaTriples = 0;
  const lvl3IaeReformaAnimalitos = 0;
  const lvl3IaeReforma = 0;

  const lvl3TotalTaxReforma =
    taxMode === "operadora_absorbe"
      ? lvl3SeniatReforma + lvl3IobpasReforma + lvl3IaeReforma
      : lvl3IaeReforma;

  const lvl3SurplusReforma = operadoraRemanenteAmount - lvl3TotalTaxReforma;
  const lvl3SurplusReformaTriples =
    operadoraRemanenteTriples -
    (taxMode === "operadora_absorbe"
      ? lvl3SeniatReformaTriples +
        lvl3IobpasReformaTriples +
        lvl3IaeReformaTriples
      : lvl3IaeReformaTriples);
  const lvl3SurplusReformaAnimalitos =
    operadoraRemanenteAnimalitos -
    (taxMode === "operadora_absorbe"
      ? lvl3SeniatReformaAnimalitos +
        lvl3IobpasReformaAnimalitos +
        lvl3IaeReformaAnimalitos
      : lvl3IaeReformaAnimalitos);

  // RECAUDACIÓN TOTAL ESTATAL EN REFORMA:
  const totalAlcaldiasCadenaReforma =
    lvl1IaeReforma + lvl2IaeReforma + lvl3IaeReforma;
  const totalStateCollectionReforma =
    totalPosIgf16 +
    lvl3SeniatReforma +
    lvl3IobpasReforma +
    totalAlcaldiasCadenaReforma;

  // XML SENIAT BATCH GENERATOR
  const generatedBatchXml = generateSeniatWithholdingXML({
    rifAgente: "J-98765432-1",
    periodo: "202611",
    items: activeTicketsForCalc.map((t, idx) => ({
      rifRetenido: `V-18${String(456789 + idx).slice(-6)}`,
      numeroTicket: `TKT-${t.ticketNumber}`,
      numeroControl: `CTL-${t.drawNumber}-RUN009-${t.modalityId.toUpperCase()}`,
      fechaOperacion: t.timestamp.split(" ")[0] || "02/11/2026",
      montoOperacion: t.guaranteedOrMaxGrossPrize,
      porcentajeRetencion: 16.0,
      montoRetenido: t.guaranteedOrMaxIgf16,
    })),
  });

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedBatchXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  // Datos dinámicos para la tarjeta superior derecha "SUMA DE LAS COMISIONES"
  const activeCommissionSummary =
    activeFolder === "nivel1"
      ? {
          title: "SUMA DE LAS COMISIONES (NIVEL 1: TAQUILLA)",
          totalAmount: taquillaCommAmount,
          triplesLabel: `Comisión Triples (${activeTaquillaPct}%): Bs. ${formatBs(
            taquillaCommTriples,
            2
          )}`,
          animalitosLabel: `Comisión Animalitos (12%): Bs. ${formatBs(
            taquillaCommAnimalitos,
            2
          )}`,
          accentClass:
            "bg-blue-950/35 border-blue-500/50 text-blue-300 shadow-blue-950/30",
          badgeText: isMixedModalities
            ? `${activeTaquillaPct}% Triples + 12% Animalitos`
            : `${singleRefModality === "animalitos" ? 12 : activeTaquillaPct}% s/ Venta`,
        }
      : activeFolder === "nivel2"
      ? {
          title: `RESULTADO NETO COMERCIALIZADORA (COMISIONES FINALES + ${comercializadoraSharePct}% NET WIN)`,
          totalAmount: lvl2NetReforma,
          triplesLabel: `Triples: Comisión Final (Bs. ${formatBs(
            comercializadoraFinalCommTriples,
            2
          )}) + ${comercializadoraSharePct}% NetWin (Bs. ${formatBs(
            comercializadoraNetWinTriples,
            2
          )}) = Bs. ${formatBs(lvl2NetReformaTriples, 2)}`,
          animalitosLabel: `Animalitos: Comisión Final (Bs. ${formatBs(
            comercializadoraFinalCommAnimalitos,
            2
          )}) + ${comercializadoraSharePct}% NetWin (Bs. ${formatBs(
            comercializadoraNetWinAnimalitos,
            2
          )}) = Bs. ${formatBs(lvl2NetReformaAnimalitos, 2)}`,
          accentClass:
            "bg-amber-950/35 border-amber-500/50 text-amber-300 shadow-amber-950/30",
          badgeText: `Comisiones Finales + ${comercializadoraSharePct}% Net Win`,
        }
      : {
          title: `SUPERÁVIT OPERADORA (NIVEL 3: REMANENTE ${operadoraSharePct}% NET WIN DISTRIBUIBLE)`,
          totalAmount: lvl3SurplusReforma,
          triplesLabel: `Superávit Triples: Bs. ${formatBs(
            lvl3SurplusReformaTriples,
            2
          )} (${operadoraSharePct}% de Net Win Distribuible Bs. ${formatBs(
            distributableNetWinTriples,
            2
          )})`,
          animalitosLabel: `Superávit Animalitos: Bs. ${formatBs(
            lvl3SurplusReformaAnimalitos,
            2
          )} (${operadoraSharePct}% de Net Win Distribuible Bs. ${formatBs(
            distributableNetWinAnimalitos,
            2
          )})`,
          accentClass:
            "bg-emerald-950/35 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30",
          badgeText:
            taxMode === "operadora_absorbe"
              ? `Superávit tras SENIAT 10% e IOBPAS 5% s/ GGR (IAE Operadora 0%)`
              : `Remanente ${operadoraSharePct}% con Tributos GGR Deducidos (IAE Operadora 0%)`,
        };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          RESUMEN DE VENTAS GRABADAS DESDE LA TAQUILLA POS (DINÁMICO Y ARMONIZADO)
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  Ventas Grabadas en Taquilla POS ({activeTicketsForCalc.length}{" "}
                  {activeTicketsForCalc.length === 1 ? "Ticket" : "Tickets"} •{" "}
                  {totalPosOptionsCount} Opciones):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {recordedTickets.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketFilter("ALL")}
                      className={`text-[10.5px] font-mono px-2 py-0.5 rounded border ${
                        selectedTicketFilter === "ALL"
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Suma Todos ({recordedTickets.length})
                    </button>
                    {recordedTickets.some((t) => t.modalityId === "triples") && (
                      <button
                        type="button"
                        onClick={() => setSelectedTicketFilter("MOD_TRIPLES")}
                        className={`text-[10.5px] font-mono px-2 py-0.5 rounded border ${
                          selectedTicketFilter === "MOD_TRIPLES"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300"
                        }`}
                      >
                        Solo Triples
                      </button>
                    )}
                    {recordedTickets.some(
                      (t) => t.modalityId === "animalitos"
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTicketFilter("MOD_ANIMALITOS")
                        }
                        className={`text-[10.5px] font-mono px-2 py-0.5 rounded border ${
                          selectedTicketFilter === "MOD_ANIMALITOS"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-300"
                        }`}
                      >
                        Solo Animalitos
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={onGoToPOS}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  Ir a Taquilla POS
                </button>
                {hasEmittedTickets && (
                  <button
                    type="button"
                    onClick={onClearEmittedTickets}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reiniciar Caja
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowXmlModal(true)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 transition-colors"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  XML SENIAT Planilla 99029
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {recordedTickets.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  No hay ventas grabadas en la Taquilla POS (Bs. 0,00). Vaya al{" "}
                  <button
                    type="button"
                    onClick={onGoToPOS}
                    className="text-blue-400 font-bold underline"
                  >
                    Módulo 1 (Terminal POS)
                  </button>{" "}
                  para emitir tickets o tirajes.
                </div>
              ) : (
                recordedTickets.map((t, idx) => {
                  const isSelected =
                    selectedTicketFilter === "ALL" ||
                    selectedTicketFilter === t.ticketNumber ||
                    (selectedTicketFilter === "MOD_TRIPLES" &&
                      t.modalityId === "triples") ||
                    (selectedTicketFilter === "MOD_ANIMALITOS" &&
                      t.modalityId === "animalitos");
                  const b = computeTicketBreakdown(
                    t,
                    triplesCommRate,
                    iaeMode,
                    taxMode,
                    { taquillaPct: activeTaquillaPct, spreadPct: activeSpreadPct },
                    comercializadoraSharePct
                  );

                  return (
                    <div
                      key={`${t.ticketNumber}-${idx}`}
                      onClick={() =>
                        setSelectedTicketFilter(
                          selectedTicketFilter === t.ticketNumber
                            ? "ALL"
                            : t.ticketNumber
                        )
                      }
                      className={`p-3 rounded-xl border flex flex-col gap-2 text-xs font-mono cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-950 border-slate-700 shadow-md"
                          : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              t.isFullTiraje
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {t.isFullTiraje
                              ? `TIRAJE #${t.ticketNumber} (${t.tirajeOptionCount} OPC.)`
                              : `TICKET #${t.ticketNumber} (${t.tirajeOptionCount} JUG.)`}
                          </span>
                          <span className="text-slate-200 font-bold">
                            {t.modalityName} • Factor {t.multiplier}x
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {t.isFullTiraje ? (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                              {t.modalityId === "animalitos"
                                ? "38 Figuras (01 al 38)"
                                : "1.000 Combinaciones (000 al 999)"}{" "}
                              ×{" "}
                              <strong className="text-emerald-400">
                                Bs. {formatBs(t.unitBetAmount, 2)}
                              </strong>{" "}
                              c/u
                            </span>
                          ) : (
                            t.plays.slice(0, 3).map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
                              >
                                {p.option}:{" "}
                                <strong className="text-emerald-400">
                                  Bs. {formatBs(p.amount, 2)}
                                </strong>
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Fila inferior del ticket con Venta y desglose dinámico según Carpeta Activa */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-white">
                            Venta: Bs. {formatBs(t.totalFacial, 2)}
                          </span>
                          <span className="text-[10.5px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                            Premios sin IGF: Bs.{" "}
                            {formatBs(b.netPrizePaidAfter16, 2)}
                          </span>
                          {hasEmittedTickets && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTicket(t.ticketNumber);
                              }}
                              className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40"
                              title="Eliminar de la caja"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {activeFolder === "nivel1" && (
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                t.modalityId === "triples"
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                  : "bg-blue-500/15 border-blue-500/40 text-blue-300"
                              }`}
                            >
                              Comisión {b.shortLabel} ({b.taquillaCommPct}%):{" "}
                              <strong className="text-white">
                                Bs. {formatBs(b.taquillaCommAmount, 2)}
                              </strong>
                            </span>
                          )}
                          {activeFolder === "nivel2" && (
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border ${
                                t.modalityId === "triples"
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                  : "bg-blue-500/15 border-blue-500/40 text-blue-300"
                              }`}
                            >
                              Comisión Final (Bs.{" "}
                              {formatBs(b.comercializadoraFinalCommReforma, 2)})
                              + {comercializadoraSharePct}% NetWin (Bs.{" "}
                              {formatBs(b.comercializadoraNetWin50Reforma, 2)})
                              ={" "}
                              <strong className="text-white">
                                Bs.{" "}
                                {formatBs(b.comercializadoraTotalOwnReforma, 2)}
                              </strong>
                            </span>
                          )}
                          {activeFolder === "nivel3" && (
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                t.modalityId === "triples"
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                              }`}
                            >
                              Remanente {operadoraSharePct}% NetWin:{" "}
                              <strong className="text-white">
                                Bs. {formatBs(b.operadoraNetWin50Reforma, 2)}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Resumen de Liquidación + SUMA DE LAS COMISIONES DEL NIVEL ACTIVO */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-sans font-bold uppercase text-slate-400">
                Total Venta Captada
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                Bs. {formatBs(grossSales, 2)}
              </div>
              <div className="text-[10px] font-sans text-emerald-400 mt-0.5">
                Net Win Pot: Bs. {formatBs(netWinAmount, 2)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-sans font-bold uppercase text-blue-400">
                Premios sin IGF (Art. 18)
              </div>
              <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                Bs. {formatIntBs(totalPosNetPrize)}
              </div>
              <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                Bruto:{" "}
                <span className="text-blue-400 font-bold">
                  Bs. {formatIntBs(totalPosGrossPrize)}
                </span>{" "}
                • −16%:{" "}
                <span className="text-red-400 font-bold">
                  -Bs. {formatIntBs(totalPosIgf16)}
                </span>
              </div>
            </div>

            {/* RECUADRO DESTACADO: SUMA DE LAS COMISIONES DEL NIVEL ACTIVO */}
            <div
              className={`col-span-2 p-3 rounded-xl border shadow-lg ${activeCommissionSummary.accentClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-sans font-extrabold uppercase tracking-wider">
                  {activeCommissionSummary.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-slate-200 font-bold">
                  {activeCommissionSummary.badgeText}
                </span>
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                Bs. {formatBs(activeCommissionSummary.totalAmount, 2)}
              </div>
              <div className="flex flex-col gap-0.5 text-[10.5px] font-sans text-slate-200 mt-1 pt-1 border-t border-slate-800/80">
                {hasTriples && (
                  <div className="text-amber-300 font-semibold">
                    • {activeCommissionSummary.triplesLabel}
                  </div>
                )}
                {hasAnimalitos && (
                  <div className="text-blue-300 font-semibold">
                    • {activeCommissionSummary.animalitosLabel}
                  </div>
                )}
                {!hasTriples && !hasAnimalitos && (
                  <span className="text-slate-400">
                    Sin comisiones grabadas (Bs. 0,00)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SISTEMA DE CARPETAS (PESTAÑAS) PARA LOS 3 SUBNIVELES DE LA CADENA
      ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Pestañas de Carpetas Integradas (Header sin cortes ni fondos desalineados) */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80 p-1.5 gap-1.5">
          {/* CARPETA NIVEL 1 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel1")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
              activeFolder === "nivel1"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/40"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 transition-colors ${
                activeFolder === "nivel1"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40"
                  : "bg-slate-200/70 dark:bg-slate-900 text-slate-500 border border-slate-300/60 dark:border-slate-800"
              }`}
            >
              {activeFolder === "nivel1" ? (
                <FolderOpen className="w-5 h-5" />
              ) : (
                <Folder className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                Carpeta Subnivel 1
              </div>
              <div className="text-sm font-extrabold truncate">
                NIVEL 1: Taquilla / Centro de Apuestas
              </div>
            </div>
          </button>

          {/* CARPETA NIVEL 2 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel2")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
              activeFolder === "nivel2"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/40"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 transition-colors ${
                activeFolder === "nivel2"
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/40"
                  : "bg-slate-200/70 dark:bg-slate-900 text-slate-500 border border-slate-300/60 dark:border-slate-800"
              }`}
            >
              {activeFolder === "nivel2" ? (
                <FolderOpen className="w-5 h-5" />
              ) : (
                <Folder className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                Carpeta Subnivel 2
              </div>
              <div className="text-sm font-extrabold truncate">
                NIVEL 2: Comercializadora Intermediaria
              </div>
            </div>
          </button>

          {/* CARPETA NIVEL 3 */}
          <button
            type="button"
            onClick={() => setActiveFolder("nivel3")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
              activeFolder === "nivel3"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/40"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 transition-colors ${
                activeFolder === "nivel3"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40"
                  : "bg-slate-200/70 dark:bg-slate-900 text-slate-500 border border-slate-300/60 dark:border-slate-800"
              }`}
            >
              {activeFolder === "nivel3" ? (
                <FolderOpen className="w-5 h-5" />
              ) : (
                <Folder className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                Carpeta Subnivel 3
              </div>
              <div className="text-sm font-extrabold truncate">
                NIVEL 3: Operadora de Juegos de Lotería
              </div>
            </div>
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL DE LA CARPETA ACTIVA */}
        <div className="relative">
          {/* ==================================================================
              CARPETA NIVEL 1: TAQUILLA / CENTRO DE APUESTAS
          ================================================================== */}
          {activeFolder === "nivel1" && (
            <div>
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      NIVEL 1: Taquilla / Centro de Apuestas (Comisión Bruta = Bs.{" "}
                      {formatBs(taquillaCommAmount, 2)})
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Punto de Venta / Emisión Final al Apostador (Agencia
                      RUN-AG-0412 • Escala: {activeTaquillaPct}%)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-blue-300 font-bold">
                  Comisión Taquilla ({isMixedModalities ? `${activeTaquillaPct}% / 12%` : singleRefModality === "animalitos" ? "12%" : `${activeTaquillaPct}%`})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5 font-bold w-4/12">
                        Concepto Financiero / Tributario (Exclusivo Taquilla)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-rose-100 dark:bg-red-950/20 text-rose-800 dark:text-red-300 border-x border-slate-200 dark:border-slate-800">
                        Columna 1: Esquema Vigente (Modelo 1 • s/ Valor Facial)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                        Columna 2: Reforma Propuesta (Modelo 2 • GGR + Arts. 32-33)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Venta Facial Grabada en Taquilla</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples: Bs. ${formatBs(salesTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos: Bs. ${formatBs(salesAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-red-400 block font-sans">
                          Imputada erróneamente como ingreso propio de la taquilla en Reporte Z
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-sans">
                          Fondos de Terceros en Custodia (Blindaje Arts. 32 y 33 Providencia)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Comisión Bruta de la Taquilla (Escala {activeTaquillaPct}% Triples / 12% Animalitos)</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {isMixedModalities
                            ? `Triples: ${activeTaquillaPct}% (Bs. ` + formatBs(taquillaCommTriples, 2) + `) + Animalitos: 12% (Bs. ` + formatBs(taquillaCommAnimalitos, 2) + `)`
                            : `${singleRefModality === "animalitos" ? 12 : activeTaquillaPct}% sobre la venta captada`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Comisión contractual antes de tributos municipales
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          (Única Base Imponible Propia Art. 29 num. 1)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        Pago Alcaldía (IAE Municipal) sobre la Taquilla
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-bold text-red-400">
                        -Bs. {formatBs(lvl1IaeVigente, 2)}{" "}
                        <span className="text-[11px] text-red-300/90 block font-sans">
                          {isMixedModalities
                            ? `5% s/ Facial: -Bs. ${formatBs(lvl1IaeVigenteTriples, 2)} (Triples) + -Bs. ${formatBs(lvl1IaeVigenteAnimalitos, 2)} (Animalitos)`
                            : `(${iaeFacialPct}% erróneo sobre los Bs. ${formatBs(grossSales, 2)} grabados en taquilla)`}
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-bold text-emerald-400">
                        -Bs. {formatBs(lvl1IaeReforma, 2)}{" "}
                        <span className="text-[11px] text-emerald-300/90 block font-sans">
                          {isMixedModalities
                            ? `2,5% s/ sus Comisiones: -Bs. ${formatBs(lvl1IaeReformaTriples, 2)} (Triples) + -Bs. ${formatBs(lvl1IaeReformaAnimalitos, 2)} (Animalitos)`
                            : `(${iaeReformPct}% armonizado LOCAPTEM exclusivamente s/ su comisión de Bs. ${formatBs(taquillaCommAmount, 2)})`}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-slate-950/90">
                      <td className="py-4 px-5 font-sans font-extrabold text-white">
                        Margen Neto Retenido por la Taquilla (Antes de Gastos Operativos y Licencias)
                      </td>
                      <td className="py-4 px-5 bg-red-950/25 border-x border-slate-800">
                        <div className="text-sm font-extrabold text-red-400 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" />
                          Bs. {formatBs(lvl1NetVigente, 2)}
                        </div>
                        <div className="text-xs font-sans font-bold text-red-300 mt-1">
                          ¡{lvl1ConfiscatedPct.toFixed(2).replace(".", ",")}% de su comisión confiscada por IAE Municipal!
                        </div>
                      </td>
                      <td className="py-4 px-5 bg-emerald-950/25">
                        <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          +Bs. {formatBs(lvl1NetReforma, 2)}
                        </div>
                        <div className="text-xs font-sans font-bold text-emerald-300 mt-1">
                          Conserva el {lvl1RetainedPct.toFixed(1).replace(".", ",")}% de su comisión + Ahorra Impresora Fiscal rígida
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================================
              CARPETA NIVEL 2: COMERCIALIZADORA INTERMEDIARIA
              (FÓRMULA EXACTA: COMISIONES FINALES + NET WIN = RESULTADO NETO)
          ================================================================== */}
          {activeFolder === "nivel2" && (
            <div>
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      NIVEL 2: Comercializadora Intermediaria (Comisiones Finales Bs. {formatBs(comercializadoraFinalCommTotal, 2)} + {comercializadoraSharePct}% Net Win Bs. {formatBs(comercializadoraNetWinShareAmount, 2)} = Bs. {formatBs(lvl2NetReforma, 2)})
                    </h3>
                    <div className="text-xs text-slate-300 font-mono mt-1 space-y-0.5">
                      {hasTriples && (
                        <div>
                          • <strong className="text-amber-300">Triples (Venta Bs. {formatBs(salesTriples, 2)}):</strong> Comisión Final [Spread {activeSpreadPct}% Bs. {formatBs(spreadTriples, 2)} − IAE 2,5% Bs. {formatBs(lvl2IaeReformaTriples, 2)} = Bs. {formatBs(comercializadoraFinalCommTriples, 2)}] + {comercializadoraSharePct}% Net Win (Bs. {formatBs(comercializadoraNetWinTriples, 2)}) ={" "}
                          <strong className="text-white">+Bs. {formatBs(lvl2NetReformaTriples, 2)}</strong>
                        </div>
                      )}
                      {hasAnimalitos && (
                        <div>
                          • <strong className="text-blue-300">Animalitos (Venta Bs. {formatBs(salesAnimalitos, 2)}):</strong> Comisión Final [Spread 6% Bs. {formatBs(spreadAnimalitos, 2)} − IAE 2,5% Bs. {formatBs(lvl2IaeReformaAnimalitos, 2)} = Bs. {formatBs(comercializadoraFinalCommAnimalitos, 2)}] + {comercializadoraSharePct}% Net Win (Bs. {formatBs(comercializadoraNetWinAnimalitos, 2)}) ={" "}
                          <strong className="text-white">+Bs. {formatBs(lvl2NetReformaAnimalitos, 2)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-300 font-bold">
                  Comisiones Finales + {comercializadoraSharePct}% Net Win
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5 font-bold w-4/12">
                        Concepto Financiero / Tributario (Exclusivo Comercializadora)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-rose-100 dark:bg-red-950/20 text-rose-800 dark:text-red-300 border-x border-slate-200 dark:border-slate-800">
                        Columna 1: Esquema Vigente (Modelo 1 • s/ Valor Facial)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                        Columna 2: Reforma Propuesta (Modelo 2 • GGR + Arts. 32-33)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {/* FILA 1: FLUJO DE TERCEROS EN CUSTODIA */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Monto Recaudado en Apuestas por Cuenta de Terceros (Arts. 32 y 33)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples: Bs. ${formatBs(salesTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos: Bs. ${formatBs(salesAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-red-400 block font-sans">
                          Facturación Facial acumulada atribuida erróneamente como venta propia
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-sans">
                          Flujo de Terceros en Custodia (Blindaje Arts. 32 y 33 Providencia)
                        </span>
                      </td>
                    </tr>

                    {/* FILA 1.1: PREMIOS ACERTADOS DE LA RED EN LA ECUACIÓN */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Premios Totales Acertados de la Red</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (600x): -Bs. ${formatBs(grossPrizeTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (30x): -Bs. ${formatBs(grossPrizeAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(totalPosGrossPrize, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Costo del juego deducible en el balance
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(totalPosGrossPrize, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-sans">
                          Deducible íntegro en la determinación del GGR de Red
                        </span>
                      </td>
                    </tr>

                    {/* FILA 1.2: GGR DE RED */}
                    <tr className="bg-slate-900/60">
                      <td className="py-2.5 px-5 font-sans font-extrabold text-emerald-400">
                        <div>(=) GGR de Red (Venta - Premios)</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans">
                          Base imponible real del juego recomendada por el CIAT
                        </div>
                      </td>
                      <td className="py-2.5 px-5 bg-red-950/15 border-x border-slate-800 font-bold text-slate-300">
                        Bs. {formatBs(totalGgrNeto, 2)}
                      </td>
                      <td className="py-2.5 px-5 bg-emerald-950/15 font-extrabold text-emerald-300">
                        Bs. {formatBs(totalGgrNeto, 2)}
                      </td>
                    </tr>

                    {/* FILA 2.1: COMISIÓN TOTAL ASIGNADA POR LA OPERADORA */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(+) Comisión Total Asignada por la Operadora (25% Triples / 18% Animalitos)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (25%): Bs. ${formatBs(operadoraTotalCommTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (18%): Bs. ${formatBs(operadoraTotalCommAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(totalOperadoraTotalCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-300 block font-sans">
                          Comisión nominal asignada por contrato máster
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-white">
                          +Bs. {formatBs(totalOperadoraTotalCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          Fondo global de comisiones para la red de distribución
                        </span>
                      </td>
                    </tr>

                    {/* FILA 2.2: (-) COMISIÓN CEDIDA A LA TAQUILLA */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Comisión Cedida a la Taquilla (20% Triples / 12% Animalitos)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (20%): -Bs. ${formatBs(taquillaCommTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (12%): -Bs. ${formatBs(taquillaCommAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Desembolsada y retenida en el punto de venta
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          Retenida en origen por la Taquilla (Nivel 1)
                        </span>
                      </td>
                    </tr>

                    {/* FILA 2.3: (=) DIFERENCIAL DE COMISIÓN (SPREAD PROPIO) */}
                    <tr className="bg-amber-50 dark:bg-amber-950/20 border-y border-amber-300 dark:border-amber-500/30">
                      <td className="py-3 px-5 font-sans font-extrabold text-amber-800 dark:text-amber-300">
                        <div>(=) DIFERENCIAL DE COMISIÓN (Spread Propio: 5% Triples / 6% Animalitos)</div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-200/80 font-mono mt-0.5">
                          {hasTriples && `Diferencial Triples (5%): Bs. ${formatBs(spreadTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Diferencial Animalitos (6%): Bs. ${formatBs(spreadAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-rose-50/50 dark:bg-red-950/15 border-x border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          Bs. {formatBs(comercializadoraSpreadAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-300 block font-sans">
                          Margen bruto residual de comercialización
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-50/50 dark:bg-emerald-950/15 text-slate-800 dark:text-slate-200">
                        <span className="font-extrabold text-amber-800 dark:text-amber-300">
                          +Bs. {formatBs(comercializadoraSpreadAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-sans">
                          Única base imponible propia del intermediario (Art. 29 num. 1)
                        </span>
                      </td>
                    </tr>

                    {/* FILA 3: PAGO ALCALDÍA (IAE MUNICIPAL) */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Pago Alcaldía (IAE Municipal sobre la Comercializadora)</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Tributación municipal liquidada al nivel de comercialización
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-bold text-red-400">
                        -Bs. {formatBs(lvl2IaeVigente, 2)}
                        <span className="text-[11px] text-red-300/90 block font-sans">
                          5% s/ Facial: Confisca el {(comercializadoraSpreadAmount > 0 ? (lvl2IaeVigente / comercializadoraSpreadAmount) * 100 : 0).toFixed(2).replace(".", ",")}% de su spread
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-bold text-emerald-400">
                        -Bs. {formatBs(lvl2IaeReforma, 2)}
                        <span className="text-[11px] text-emerald-300/90 block font-sans">
                          2,5% armonizado LOCAPTEM s/ su comisión Spread de Bs. {formatBs(comercializadoraSpreadAmount, 2)}
                        </span>
                      </td>
                    </tr>

                    {/* FILA 4 (DESTACADA): COMISIONES FINALES DE LA COMERCIALIZADORA */}
                    <tr className="bg-amber-950/20 border-y-2 border-amber-500/40">
                      <td className="py-3.5 px-5 font-sans font-extrabold text-amber-300">
                        <div className="flex items-center gap-1.5">
                          <span>(=) COMISIONES FINALES DE LA COMERCIALIZADORA (Spread Neto de IAE)</span>
                        </div>
                        <div className="text-[11px] text-amber-200/80 font-normal font-sans mt-0.5">
                          Comisión de comercialización libre y retenida tras cumplir la obligación municipal
                        </div>
                      </td>
                      <td className="py-3.5 px-5 bg-red-950/20 border-x border-slate-800">
                        <div className="font-extrabold text-red-300 text-sm">
                          Bs. {formatBs(comercializadoraFinalCommVigenteTotal, 2)}
                        </div>
                        <div className="text-[11px] text-red-300/80 font-sans mt-0.5">
                          Mermado drásticamente por el gravamen confiscatorio sobre el 100% Facial
                        </div>
                      </td>
                      <td className="py-3.5 px-5 bg-emerald-950/20">
                        <div className="font-extrabold text-emerald-300 text-sm">
                          +Bs. {formatBs(comercializadoraFinalCommTotal, 2)}
                        </div>
                        <div className="text-[11px] text-emerald-300/90 font-mono mt-0.5 space-y-0.5">
                          {hasTriples && (
                            <div>
                              • Triples: Spread Bs. {formatBs(spreadTriples, 0)} − IAE 2,5% Bs. {formatBs(lvl2IaeReformaTriples, 0)} ={" "}
                              <strong className="text-white">Bs. {formatBs(comercializadoraFinalCommTriples, 2)}</strong> (97,5% retenido)
                            </div>
                          )}
                          {hasAnimalitos && (
                            <div>
                              • Animalitos: Spread Bs. {formatBs(spreadAnimalitos, 0)} − IAE 2,5% Bs. {formatBs(lvl2IaeReformaAnimalitos, 0)} ={" "}
                              <strong className="text-white">Bs. {formatBs(comercializadoraFinalCommAnimalitos, 2)}</strong> (97,5% retenido)
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* FILA 5: PARTICIPACIÓN SOCIETARIA EN EL NET WIN */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(+) Participación Societaria del {comercializadoraSharePct}% en el Net Win Distribuible</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                          <div className="text-slate-300 font-sans">
                            Modo actual: {iaeMode === "individual_sujeto" ? "Opción B (Individual por Sujeto)" : iaeMode === "base_premios_sin_igf" ? "Opción C (Premios s/ IGF)" : "Opción A (Cascada CDAPUESTAS)"} • Reparto {comercializadoraSharePct}% / {operadoraSharePct}% tras deducir tributos de juego (SENIAT 10% + IOBPAS 5% s/ GGR)
                          </div>
                          {hasTriples && (
                            <div>
                              • Triples: Net Win Distribuible <strong className="text-amber-300">Bs. {formatBs(distributableNetWinTriples, 2)}</strong> ({comercializadoraSharePct}% = <strong className="text-white">Bs. {formatBs(comercializadoraNetWinTriples, 2)}</strong>) [Base: Bs. {formatBs(netWinTriples, 2)}]
                            </div>
                          )}
                          {hasAnimalitos && (
                            <div>
                              • Animalitos: Net Win Distribuible <strong className="text-blue-300">Bs. {formatBs(distributableNetWinAnimalitos, 2)}</strong> ({comercializadoraSharePct}% = <strong className="text-white">Bs. {formatBs(comercializadoraNetWinAnimalitos, 2)}</strong>) [Base: Bs. {formatBs(netWinAnimalitos, 2)}]
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <div className="font-bold text-red-300">
                          Bs. 0,00 (Impago por Quiebra Operadora)
                        </div>
                        <span className="text-[11px] text-red-400 block font-sans mt-0.5">
                          La operadora no tiene liquidez tras tributar 12% SENIAT y 5% IOBPAS sobre el Facial
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <div className="font-extrabold text-emerald-300 text-sm">
                          +Bs. {formatBs(comercializadoraNetWinShareAmount, 2)}
                        </div>
                        <div className="text-[11px] text-emerald-300/90 font-mono mt-0.5 space-y-0.5">
                          {hasTriples && (
                            <div>
                              • Triples: <strong className="text-white">+Bs. {formatBs(comercializadoraNetWinTriples, 2)}</strong> ({comercializadoraSharePct}% de Bs. {formatBs(distributableNetWinTriples, 2)})
                            </div>
                          )}
                          {hasAnimalitos && (
                            <div>
                              • Animalitos: <strong className="text-white">+Bs. {formatBs(comercializadoraNetWinAnimalitos, 2)}</strong> ({comercializadoraSharePct}% de Bs. {formatBs(distributableNetWinAnimalitos, 2)})
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-400 block font-sans mt-0.5">
                          Cobro asegurado en tiempo real: la Operadora opera con superávit sostenible
                        </span>
                      </td>
                    </tr>

                    {/* FILA 6: CARGAS OPERATIVAS Y REGULATORIAS */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Cargas Regulatorias, Tecnológicas y Operativas</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Licencias IOBPAS, RUNLOT y soporte a red de taquillas
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-red-300 font-sans text-xs space-y-1">
                        <div>• <strong className="text-red-200">Efecto Reporte Z:</strong> Pulveriza su Net Win y la expone a reparos por el 100% del Valor Facial.</div>
                        <div>• <strong className="text-red-200">Riesgo Bancario:</strong> IGTF y bloqueo de cuentas por movimientos de fondos de terceros.</div>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-emerald-300 font-sans text-xs space-y-1">
                        <div>• <strong className="text-emerald-200">Blindaje en Reporte Z (Arts. 32-33):</strong> Fondos de apuestas circulan como recaudación por Cuenta de Terceros.</div>
                        <div>• <strong className="text-emerald-200">Cobertura Operativa:</strong> Al tributar el 2,5% sobre comisiones, financia licencias RUNLOT/IOBPAS y soporte a taquillas.</div>
                      </td>
                    </tr>

                    {/* FILA 7 (FILA DE CIERRE TOTALIZADORA): RESULTADO NETO = COMISIONES FINALES + NET WIN */}
                    <tr className="bg-slate-950/95 border-t-2 border-emerald-500/50">
                      <td className="py-4 px-5 font-sans font-extrabold text-white">
                        <div className="text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                          <span>(=) RESULTADO NETO COMERCIALIZADORA = COMISIONES FINALES + {comercializadoraSharePct}% NET WIN</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-normal font-sans mt-1">
                          Ingreso neto disponible de la Comercializadora antes de gastos operativos generales, licencias e ISLR
                        </div>
                      </td>
                      <td className="py-4 px-5 bg-red-950/25 border-x border-slate-800">
                        <div className="text-sm font-extrabold text-red-400 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" />
                          Bs. {formatBs(comercializadoraFinalCommVigenteTotal, 2)}
                        </div>
                        <div className="text-xs font-sans font-bold text-red-300 mt-1">
                          Pérdida del 100% del Net Win + Confiscación del spread
                        </div>
                      </td>
                      <td className="py-4 px-5 bg-emerald-950/25">
                        <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp className="w-5 h-5" />
                          +Bs. {formatBs(lvl2NetReforma, 2)}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-300 mt-1.5 space-y-1">
                          {hasTriples && (
                            <div className="bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded">
                              • <strong>Triples:</strong> Bs. {formatBs(comercializadoraFinalCommTriples, 2)} (Comisión Final) + Bs. {formatBs(comercializadoraNetWinTriples, 2)} ({comercializadoraSharePct}% Net Win) ={" "}
                              <strong className="text-white">+Bs. {formatBs(lvl2NetReformaTriples, 2)}</strong>
                            </div>
                          )}
                          {hasAnimalitos && (
                            <div className="bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded">
                              • <strong>Animalitos:</strong> Bs. {formatBs(comercializadoraFinalCommAnimalitos, 2)} (Comisión Final) + Bs. {formatBs(comercializadoraNetWinAnimalitos, 2)} ({comercializadoraSharePct}% Net Win) ={" "}
                              <strong className="text-white">+Bs. {formatBs(lvl2NetReformaAnimalitos, 2)}</strong>
                            </div>
                          )}
                          <div className="text-[11px] text-emerald-400 font-sans font-semibold pt-0.5">
                            Fórmula exacta: Bs. {formatBs(comercializadoraFinalCommTotal, 2)} (Comisiones Finales) + Bs. {formatBs(comercializadoraNetWinShareAmount, 2)} ({comercializadoraSharePct}% Net Win) = +Bs. {formatBs(lvl2NetReforma, 2)}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* LIQUIDACIÓN IGF EN TRÁNSITO AL FINAL SIN SUMAR EN NADA */}
                    <tr className="bg-slate-900/60 border-t border-slate-800">
                      <td className="py-3 px-5 font-sans text-xs text-slate-400">
                        <div className="font-bold text-slate-300">Liquidación Retención 16% IGF en Tránsito (Arts. 32 y 33)</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                          Fondos de terceros en tránsito telemático hacia la Operadora • Sin sumar ni restar en el resultado operativo
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-mono font-bold text-red-400">
                        Bs. {formatBs(totalPosIgf16, 2)}
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-mono font-bold text-red-400">
                        Bs. {formatBs(totalPosIgf16, 2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================================
              CARPETA NIVEL 3: OPERADORA DE JUEGOS DE LOTERÍA
          ================================================================== */}
          {activeFolder === "nivel3" && (
            <div>
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      NIVEL 3: Operadora de Juegos de Lotería (Remanente Net Win {operadoraSharePct}% = Bs. {formatBs(operadoraRemanenteAmount, 2)} • Superávit = +Bs. {formatBs(lvl3SurplusReforma, 2)})
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Lotería Oficial C.A. (RIF J-98765432-1 • Licencia IOBPAS LOT-OF-019 • Homologada RUNLOT)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-emerald-300 font-bold">
                  Superávit Sostenible
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5 font-bold w-4/12">
                        Concepto Financiero / Tributario (Exclusivo Operadora)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-rose-100 dark:bg-red-950/20 text-rose-800 dark:text-red-300 border-x border-slate-200 dark:border-slate-800">
                        Columna 1: Esquema Vigente (Modelo 1 • s/ Valor Facial)
                      </th>
                      <th className="py-3.5 px-5 font-bold w-4/12 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                        Columna 2: Reforma Propuesta (Modelo 2 • GGR + Arts. 32-33)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {/* FILA 0.1: MONTO RECAUDADO EN APUESTAS (VENTA TOTAL DE RED) */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>Monto Recaudado en Apuestas (Venta Total de Red)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples: Bs. ${formatBs(salesTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos: Bs. ${formatBs(salesAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-red-400 block font-sans">
                          Imputado erróneamente al 100% como ingreso gravable en el esquema vigente
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(grossSales, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-sans">
                          Recaudación de apuestas bajo régimen de custodia de terceros (Arts. 32-33)
                        </span>
                      </td>
                    </tr>

                    {/* FILA 0.2: (-) PREMIOS TOTALES ACERTADOS */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Premios Totales Acertados (Premios Brutos)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (600x): -Bs. ${formatBs(grossPrizeTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (30x): -Bs. ${formatBs(grossPrizeAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(totalPosGrossPrize, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          No admitido en base presuntiva del esquema vigente
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(totalPosGrossPrize, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-sans">
                          Deducible por ley internacional para obtener el GGR del Neto
                        </span>
                      </td>
                    </tr>

                    {/* FILA 0.3: (=) GGR DEL NETO */}
                    <tr className="bg-slate-900/60">
                      <td className="py-2.5 px-5 font-sans font-extrabold text-emerald-400">
                        <div>(=) GGR del Neto (Venta - Premios)</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans">
                          Base imponible real del juego recomendada por el CIAT
                        </div>
                      </td>
                      <td className="py-2.5 px-5 bg-red-950/15 border-x border-slate-800 font-bold text-slate-300">
                        Bs. {formatBs(totalGgrNeto, 2)}
                      </td>
                      <td className="py-2.5 px-5 bg-emerald-950/15 font-extrabold text-emerald-300">
                        Bs. {formatBs(totalGgrNeto, 2)}
                      </td>
                    </tr>

                    {/* FILA 0.4: (-) COMISIÓN TAQUILLA */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Comisión Taquilla / Puntos de Venta (20% Triples / 12% Animalitos)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (20%): -Bs. ${formatBs(taquillaCommTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (12%): -Bs. ${formatBs(taquillaCommAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Comisión retenida en taquillas
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(taquillaCommAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          Deducible en balance como costo de distribución
                        </span>
                      </td>
                    </tr>

                    {/* FILA 0.5: (-) DIFERENCIAL DE COMISIONES COMERCIALIZADORA */}
                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Diferencial de Comisiones Comercializadora (5% Triples / 6% Animalitos)</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {hasTriples && `Triples (5%): -Bs. ${formatBs(spreadTriples, 2)}`}
                          {hasTriples && hasAnimalitos && " + "}
                          {hasAnimalitos && `Animalitos (6%): -Bs. ${formatBs(spreadAnimalitos, 2)}`}
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(comercializadoraSpreadAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Diferencial propio del máster comercializador
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-bold text-red-400">
                          -Bs. {formatBs(comercializadoraSpreadAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          Deducible como comisión de intermediación de red
                        </span>
                      </td>
                    </tr>

                    {/* FILA 0.6: (=) NET WIN BASE DE LA OPERACIÓN */}
                    <tr className="bg-slate-900/80 border-y border-emerald-500/30">
                      <td className="py-2.5 px-5 font-sans font-extrabold text-emerald-400">
                        <div>(=) Net Win Base de la Operación (GGR - Comisiones de Red)</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans">
                          Utilidad bruta de juego antes de deducir tributos de lotería (SENIAT 10% + IOBPAS 5% s/ GGR)
                        </div>
                      </td>
                      <td className="py-2.5 px-5 bg-red-950/15 border-x border-slate-800 font-bold text-slate-300">
                        Bs. {formatBs(netWinAmount, 2)}
                      </td>
                      <td className="py-2.5 px-5 bg-emerald-950/15 font-extrabold text-emerald-300">
                        Bs. {formatBs(netWinAmount, 2)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Impuesto SENIAT sobre Juegos de Lotería (GGR Venta - Premios)</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Base imponible GGR del Neto recomendada por el CIAT (10% Armonizado para todos)
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-bold text-red-400">
                        -Bs. {formatBs(lvl3SeniatVigente, 2)}
                        <span className="text-[11px] text-red-300/90 block font-sans">
                          12% Triples (-Bs. {formatBs(lvl3SeniatVigenteTriples, 2)}) + 10% Animalitos (-Bs. {formatBs(lvl3SeniatVigenteAnimalitos, 2)}) sobre el Facial
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-bold text-emerald-400">
                        -Bs. {formatBs(lvl3SeniatReforma, 2)}
                        <span className="text-[11px] text-emerald-300/90 block font-sans">
                          10% Triples (-Bs. {formatBs(lvl3SeniatReformaTriples, 2)}) + 10% Animalitos (-Bs. {formatBs(lvl3SeniatReformaAnimalitos, 2)}) s/ GGR (Venta - Premios) • 10% Armonizado para todos
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>(-) Royalty / Canon IOBPAS Beneficencia Pública</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Hoy en día: 5% Triples / 1% Animalitos sobre Valor Facial • Propuesta: 5% sobre GGR para todos
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-bold text-red-400">
                        -Bs. {formatBs(lvl3IobpasVigente, 2)}
                        <span className="text-[11px] text-red-300/90 block font-sans">
                          Hoy: 5% Triples (-Bs. {formatBs(lvl3IobpasVigenteTriples, 2)}) + 1% Animalitos (-Bs. {formatBs(lvl3IobpasVigenteAnimalitos, 2)}) sobre el Facial
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-bold text-emerald-400">
                        -Bs. {formatBs(lvl3IobpasReforma, 2)}
                        <span className="text-[11px] text-emerald-300/90 block font-sans">
                          Propuesta: 5% Triples (-Bs. {formatBs(lvl3IobpasReformaTriples, 2)}) + 5% Animalitos (-Bs. {formatBs(lvl3IobpasReformaAnimalitos, 2)}) s/ GGR • 5% Todos
                        </span>
                      </td>
                    </tr>

                    <tr className="bg-slate-900/60">
                      <td className="py-2.5 px-5 font-sans font-extrabold text-emerald-300">
                        <div>(=) Net Win Distribuible (Net Win Base - Tributos de Juego)</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans">
                          Utilidad líquida sujeta a reparto societario {comercializadoraSharePct}% Comercializadora / {operadoraSharePct}% Operadora
                        </div>
                      </td>
                      <td className="py-2.5 px-5 bg-red-950/15 border-x border-slate-800 font-bold text-red-300">
                        Bs. {formatBs(operadoraGrossShareAmount, 2)}
                        <span className="text-[11px] text-slate-400 block font-sans font-normal">
                          Cuota bruta ({operadoraSharePct}% Net Win Base) antes de quiebra por tributos faciales
                        </span>
                      </td>
                      <td className="py-2.5 px-5 bg-emerald-950/15 font-extrabold text-emerald-300">
                        Bs. {formatBs(distributableNetWinAmount, 2)}
                        <span className="text-[11px] text-emerald-300/80 block font-sans font-normal">
                          50% Comercializadora (Bs. {formatBs(comercializadoraNetWinShareAmount, 2)}) + 50% Operadora (Bs. {formatBs(operadoraRemanenteAmount, 2)})
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        Remanente Propio de Operación ({operadoraSharePct}% Net Win Distribuible)
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 text-slate-200">
                        <span className="font-extrabold text-white">
                          Bs. {formatBs(operadoraGrossShareAmount, 2)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Remanente bruto societario de la Operadora antes de impuestos faciales
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 text-slate-200">
                        <span className="font-extrabold text-emerald-300">
                          +Bs. {formatBs(operadoraRemanenteAmount, 2)}
                        </span>
                        <span className="text-[11px] text-emerald-300 block font-sans">
                          {operadoraSharePct}% del Net Win Distribuible libre de tributos de juego
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-5 font-sans font-semibold text-slate-200">
                        <div>IAE Municipal sobre la Operadora</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Tributación municipal al sujeto emisor del juego
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-bold text-red-400">
                        -Bs. {formatBs(lvl3IaeVigente, 2)}
                        <span className="text-[11px] text-red-300/90 block font-sans">
                          5% confiscatorio s/ Valor Facial
                        </span>
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-bold text-emerald-400">
                        Bs. 0,00
                        <span className="text-[11px] text-emerald-300/90 block font-sans">
                          0,00% No Sujeto / No Aplica • Blindaje contra Doble Tributación (la Operadora no percibe comisión y el GGR es base aleatoria no gravable a nivel municipal)
                        </span>
                      </td>
                    </tr>

                    <tr className="bg-slate-950/90">
                      <td className="py-4 px-5 font-sans font-extrabold text-white">
                        Resultado Operativo de la Operadora (Superávit vs. Quiebra)
                      </td>
                      <td className="py-4 px-5 bg-red-950/30 border-x border-slate-800">
                        <div className="text-base font-extrabold text-red-400 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" />
                          -Bs. {formatBs(Math.abs(lvl3DeficitVigente), 2)}
                        </div>
                        <div className="text-xs font-sans font-bold text-red-300 mt-1">
                          DÉFICIT Y QUIEBRA MATEMÁTICA ANTES DE LICENCIAS Y COSTOS OPERATIVOS
                        </div>
                      </td>
                      <td className="py-4 px-5 bg-emerald-950/30">
                        <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp className="w-5 h-5" />
                          +Bs. {formatBs(lvl3SurplusReforma, 2)}
                        </div>
                        <div className="text-xs font-sans font-bold text-emerald-300 mt-1">
                          SUPERÁVIT OPERATIVO SOSTENIBLE (Plena Deducibilidad ISLR Art. 27.3)
                        </div>
                      </td>
                    </tr>

                    {/* LIQUIDACIÓN DEL IGF AL FINAL SIN SUMARLO EN NADA */}
                    <tr className="bg-slate-900/60 border-t border-slate-800">
                      <td className="py-3 px-5 font-sans text-xs text-slate-400">
                        <div className="font-bold text-red-300">
                          Liquidación Retención 16% IGF (Planilla SENIAT Forma 99029 XML)
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Fondos de Terceros en Tránsito hacia el Tesoro Nacional (Decreto 1.808 • Concepto 077) • Sin sumarlo al resultado operativo
                        </div>
                      </td>
                      <td className="py-3 px-5 bg-red-950/10 border-x border-slate-800 font-mono font-bold text-red-400">
                        Bs. {formatBs(totalPosIgf16, 2)}
                      </td>
                      <td className="py-3 px-5 bg-emerald-950/10 font-mono font-bold text-red-400">
                        Bs. {formatBs(totalPosIgf16, 2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL PREVIEW XML SENIAT (DECRETO 1.808 - CONCEPTO 077 - PLANILLA 99029)
      ==================================================================== */}
      {showXmlModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileCode2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Archivo XML Oficial SENIAT — Decreto 1.808 (Concepto 077)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Formato estándar para declaración masiva en Portal Fiscal SENIAT (Planilla 99029 • Retenciones 16% IGF)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowXmlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-emerald-300">
              <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
                {generatedBatchXml}
              </pre>
            </div>

            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Agente: J-98765432-1 (Lotería Oficial C.A.) • Retención: 16% Art. 18
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedXml ? "¡Copiado!" : "Copiar XML"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
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
