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
