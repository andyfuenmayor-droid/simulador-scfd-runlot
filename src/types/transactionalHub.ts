/**
 * Tipos de datos para el Módulo 5:
 * Sistema Transaccional Interconectado SCFD-RUNLOT & Entes del Estado
 */

export type SystemNodeRole =
  | "taquilla"
  | "comercializadora"
  | "operadora"
  | "sistema_it"
  | "switch_central"
  | "seniat"
  | "conalot"
  | "iobpas"
  | "alcaldia";

export interface ConnectedSystemNode {
  id: string;
  name: string;
  shortLabel: string;
  role: SystemNodeRole;
  runlotCode: string;
  status: "ONLINE" | "STANDBY" | "WARNING" | "BLOCKED";
  latencyMs: number;
  protocol: string;
  binarySha256?: string;
  digitalCert: string;
  processedCount: number;
  lastHeartbeat: string;
  entityDescription: string;
}

export interface StateVaultsSummary {
  /** Retención del 16% sobre Premios Brutos - Planilla SENIAT 99029 */
  seniatIgf16: number;
  /** Impuesto sobre Actividades de Juegos de Envite (10% s/ GGR) */
  seniatJuegos10: number;
  /** Tasa de Supervisión Telemática y Homologación CONALOT */
  conalotSupervision: number;
  /** Canon de Beneficencia Pública Lotería Oficial (5% Triples / 1% Animalitos s/ GGR) */
  iobpasCanonGgr: number;
  /** Impuesto sobre Actividades Económicas (IAE Municipal 2,5% s/ Comisiones) */
  alcaldiasIae: number;
  /** Total recaudado y liquidado a las arcas públicas del Estado */
  totalStateSettled: number;
}

export interface ForensicTransactionRecord {
  txId: string;
  ticketNumber: string;
  drawNumber: string;
  timestamp: string;
  timestampMs: number;
  type: "EMISION_JUGADA" | "PAGO_PREMIO_IGF" | "CIERRE_PRE_SORTEO" | "ALERTA_CLANDESTINA";
  status: "CERTIFICADA" | "RECHAZADA_CLANDESTINA" | "LIQUIDADA_CON_RETENCION" | "BLOQUEO_HORARIO";
  modalityName: string;
  totalFacial: number;
  premiosNetos84: number;
  retencionIgf16: number;
  ggr: number;
  taquillaComision: number;
  comercializadoraSpread: number;
  operadoraNetWin: number;
  sistemaItCanon1Pct: number;
  seniatShare: number;
  conalotShare: number;
  iobpasShare: number;
  alcaldiaShare: number;
  sha256Payload: string;
  signerName: string;
  runlotAgencia: string;
  runlotOperadora: string;
  runlotSoftware: string;
  httpStatusCode: number;
  rawPayload: Record<string, unknown>;
}

export interface SimulationEventResult {
  message: string;
  success: boolean;
  eventRecord: ForensicTransactionRecord;
}

