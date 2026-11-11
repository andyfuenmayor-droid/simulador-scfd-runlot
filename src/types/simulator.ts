import { ANIMALITOS_38_FIGURES } from "@/lib/cryptoUtils";

export type GameModalityId = "animalitos" | "triples";

export type IaeImputationMode =
  | "cascada_cdapuestas"
  | "individual_sujeto"
  | "base_premios_sin_igf";
export type GamingTaxImputationMode = "operadora_absorbe" | "deducido_netwin";
export type TriplesCommissionRate = 34 | 30 | 26 | 25;
export type CommissionTierId =
  | "tramo1"
  | "tramo2"
  | "tramo3"
  | "tramo_master_34"
  | "tramo_comercializadora_25"
  | "custom";

export interface CommissionTierConfig {
  id: CommissionTierId;
  name: string;
  label: string;
  rangeLabel: string;
  minSales: number;
  maxSales: number | null;
  taquillaCommPct: number;
  spreadMasterPct: number;
  description: string;
}

export interface BetPlay {
  id: string;
  option: string;
  amount: number;
  /** Cuando representa un lote/serie (ej. Tiraje Completo de 1.000 triples o 38 animalitos) */
  combinationsCount?: number;
  isFullTirajeSummary?: boolean;
}

export interface GameModalityConfig {
  id: GameModalityId;
  name: string;
  shortName: string;
  multiplier: number;
  standardPayoutPct: number;
  tirajeTotalOptions: number;
  tirajeRangeLabel: string;
  defaultUnitBetTiraje: number;
  defaultPlays: BetPlay[];
  catalogOptions: string[];
}

export const GAME_MODALITIES: Record<GameModalityId, GameModalityConfig> = {
  animalitos: {
    id: "animalitos",
    name: 'Sorteos de Figuras "Animalitos"',
    shortName: "Animalitos",
    multiplier: 30,
    standardPayoutPct: 78.95,
    tirajeTotalOptions: 38,
    tirajeRangeLabel: "01 al 38 (38 figuras)",
    defaultUnitBetTiraje: 1000,
    defaultPlays: [
      { id: "def-ani-1", option: "04 Tigre", amount: 100, combinationsCount: 1 },
      { id: "def-ani-2", option: "12 Caballo", amount: 100, combinationsCount: 1 },
    ],
    catalogOptions: ANIMALITOS_38_FIGURES,
  },
  triples: {
    id: "triples",
    name: "Triples y Terminales Tradicionales",
    shortName: "Triples y Terminales",
    multiplier: 600,
    standardPayoutPct: 60,
    tirajeTotalOptions: 1000,
    tirajeRangeLabel: "000 al 999 (1.000 comb.)",
    defaultUnitBetTiraje: 1000,
    defaultPlays: [
      { id: "def-tri-1", option: "748 Zulia", amount: 50, combinationsCount: 1 },
      { id: "def-tri-2", option: "125 Táchira", amount: 50, combinationsCount: 1 },
    ],
    catalogOptions: [
      "748 Zulia",
      "125 Táchira",
      "000 Zulia",
      "903 Caracas",
      "412 Chance",
      "555 Zamorano",
      "819 Oriente",
      "999 Zulia",
    ],
  },
};

export interface RecordedPOSTicket {
  ticketNumber: string;
  drawNumber: string;
  timestamp: string;
  modalityId: GameModalityId;
  modalityName: string;
  multiplier: number;
  plays: BetPlay[];
  isFullTiraje: boolean;
  tirajeOptionCount: number;
  unitBetAmount: number;
  totalFacial: number;
  /** Si es Tiraje Completo, 1 sola combinación gana (1 * unitBet * multiplier) */
  guaranteedOrMaxGrossPrize: number;
  guaranteedOrMaxIgf16: number;
  guaranteedOrMaxNetPrize: number;
  sha256Hash: string;
  status: "EMITIDO_EN_CAJA" | "EN_PANTALLA_POS";
}

export interface SCFDTransactionLog {
  id: string;
  type: "TICKET_EMISSION" | "PRIZE_WITHHOLDING" | "CLANDESTINE_REJECTED";
  httpStatus: 201 | 200 | 403;
  statusText: string;
  timestamp: string;
  timestampMs: number;
  payload: Record<string, unknown>;
}

// ============================================================================
// VERTICAL DE RIFAS OCASIONALES Y PERMANENTES (PROVIDENCIA CONALOT/P/2025-001)
// ============================================================================

export type EcosystemMode = "loteria" | "rifas";

export type RaffleModalityId = "rifa_triples_1000" | "rifa_supergana_10000";

export interface RaffleConfig {
  id: RaffleModalityId;
  name: string;
  shortName: string;
  totalNumbers: number;
  numberRangeLabel: string;
  lotteryDrawReference: string;
  legalArticle: string;
  defaultTicketPriceUsd: number;
  defaultBcvRate: number;
  vehiclePrizePercentage: number; // 70% del valor total de emisión
  vehicleName: string;
  defaultCashPrizeUsd: number; // $1.000 USD
  conalotAdvanceAportePct: number; // 7% Art. 28
  softwareCanonPct: number; // 1.5%
  minSalesQuorumPct: number; // 70% Art. 20
}

export const RAFFLE_MODALITIES: Record<RaffleModalityId, RaffleConfig> = {
  rifa_triples_1000: {
    id: "rifa_triples_1000",
    name: "Rifa de Triples (1.000 Números • 000 al 999)",
    shortName: "Rifa Triples (1.000 Números)",
    totalNumbers: 1000,
    numberRangeLabel: "000 al 999 (1.000 Boletos)",
    lotteryDrawReference: "Sorteo Triple Táchira (16:30 hrs - IOBPAS Táchira)",
    legalArticle: "Art. 7 num. 6 Providencia CONALOT/P/2025-001",
    defaultTicketPriceUsd: 10,
    defaultBcvRate: 40,
    vehiclePrizePercentage: 70,
    vehicleName: "Vehículo 0 Km (Toyota Yaris Sedan 2026)",
    defaultCashPrizeUsd: 1000,
    conalotAdvanceAportePct: 7,
    softwareCanonPct: 1.5,
    minSalesQuorumPct: 70,
  },
  rifa_supergana_10000: {
    id: "rifa_supergana_10000",
    name: "Rifa Menor 4 Cifras (10.000 Números • 0000 al 9999)",
    shortName: "Rifa Menor (10.000 Números)",
    totalNumbers: 10000,
    numberRangeLabel: "0000 al 9999 (10.000 Boletos)",
    lotteryDrawReference: "Sorteo Súper Gana de la Lotería del Táchira",
    legalArticle: "Art. 7 num. 7 Providencia CONALOT/P/2025-001",
    defaultTicketPriceUsd: 2,
    defaultBcvRate: 40,
    vehiclePrizePercentage: 70,
    vehicleName: "Vehículo 0 Km (Camioneta Pickup 4x4 2026)",
    defaultCashPrizeUsd: 1000,
    conalotAdvanceAportePct: 7,
    softwareCanonPct: 1.5,
    minSalesQuorumPct: 70,
  },
};

export interface RecordedRaffleTicket {
  ticketNumber: string;
  series: string;
  selectedNumber: string;
  isFullTiraje?: boolean;
  totalTirajeTickets?: number;
  totalTirajeUsd?: number;
  totalTirajeBs?: number;
  drawReference: string;
  drawDate: string;
  modalityId: RaffleModalityId;
  modalityName: string;
  ticketPriceUsd: number;
  ticketPriceBs: number;
  bcvRate: number;
  vehiclePrizeUsd: number;
  vehiclePrizeBs: number;
  cashPrizeUsd: number;
  cashPrizeBs: number;
  cashIgf16Usd: number;
  cashIgf16Bs: number;
  vehicleIgf16Usd: number;
  vehicleIgf16Bs: number;
  sha256Hash: string;
  runlotCode: string;
  solvencyCode: string;
  timestamp: string;
  status: "EMITIDO_EN_CAJA" | "EN_PANTALLA_POS";
}

