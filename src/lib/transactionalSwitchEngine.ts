import { RecordedPOSTicket } from "@/types/simulator";
import {
  ConnectedSystemNode,
  ForensicTransactionRecord,
  StateVaultsSummary,
} from "@/types/transactionalHub";

/**
 * Nodos interconectados iniciales del ecosistema transaccional nacional
 */
export function getInitialConnectedNodes(): ConnectedSystemNode[] {
  const now = new Date().toLocaleTimeString("es-VE", { hour12: false });
  return [
    {
      id: "node-taquilla",
      name: "Taquilla POS #0412 (Punto de Venta)",
      shortLabel: "Taquilla POS",
      role: "taquilla",
      runlotCode: "RUN-AG-0412",
      status: "ONLINE",
      latencyMs: 18,
      protocol: "mTLS 1.3 / REST API",
      digitalCert: "CERT-POS-SUCURSAL-412 (Validez: 2027)",
      processedCount: 1420,
      lastHeartbeat: now,
      entityDescription: "Centro de Apuestas La Favorita C.A. • RIF J-12345678-9",
    },
    {
      id: "node-comercializadora",
      name: "Comercializadora Intermediaria Máster",
      shortLabel: "Comercializadora",
      role: "comercializadora",
      runlotCode: "RUN-COM-0089",
      status: "ONLINE",
      latencyMs: 24,
      protocol: "VPN IPsec AES-256",
      digitalCert: "CERT-COM-MASTER-089 (Fianza Bancaria Auditada)",
      processedCount: 18500,
      lastHeartbeat: now,
      entityDescription: "Distribuidora de Apuestas de Occidente C.A. • RIF J-98765432-1",
    },
    {
      id: "node-operadora",
      name: "Operadora Concesionaria de Juegos",
      shortLabel: "Operadora",
      role: "operadora",
      runlotCode: "RUN-OP-987654",
      status: "ONLINE",
      latencyMs: 31,
      protocol: "gRPC TLS / Direct Fiber",
      digitalCert: "CERT-OP-IOBPAS-987 (Póliza de Fiel Cumplimiento)",
      processedCount: 94200,
      lastHeartbeat: now,
      entityDescription: "Lotería Concesionaria Oficial C.A. • Agente de Retención Único",
    },
    {
      id: "node-sistema-it",
      name: "Plataforma Informática Proveedora",
      shortLabel: "Sistema IT",
      role: "sistema_it",
      runlotCode: "RUN-SYS-019",
      status: "ONLINE",
      latencyMs: 14,
      protocol: "REST API TLS 1.3 / JSON SCFD",
      binarySha256: "BFF803FCB670E689C81977D70A882FA9361CE4DE59C66B92ED70A0F5B46872D1",
      digitalCert: "CERT-SYS-CDAPUESTAS-V4 (SUSCERTE RSA-4096)",
      processedCount: 1250000,
      lastHeartbeat: now,
      entityDescription: "SYS-CDAPUESTAS v4.2 • Certificación ISO/IEC 27001",
    },
    {
      id: "node-switch-central",
      name: "Conmutador Central SCFD-RUNLOT",
      shortLabel: "Switch Central",
      role: "switch_central",
      runlotCode: "RUN-CORE-0001",
      status: "ONLINE",
      latencyMs: 6,
      protocol: "Zero-Trust Mesh / Cripto-Firmado",
      digitalCert: "CERT-MPPEF-CONALOT-ROOT-2026",
      processedCount: 8940000,
      lastHeartbeat: now,
      entityDescription: "Motor de Compensación y Liquidación Multilateral del Estado",
    },
    {
      id: "node-seniat",
      name: "SENIAT (Tesoro Nacional)",
      shortLabel: "SENIAT",
      role: "seniat",
      runlotCode: "ENTE-FISCAL-01",
      status: "ONLINE",
      latencyMs: 38,
      protocol: "API Tributaria Planilla 99029 (XML)",
      digitalCert: "CERT-SENIAT-FISCAL-PROV00093",
      processedCount: 421000,
      lastHeartbeat: now,
      entityDescription: "Receptor de 16% IGF (Premios) y 10% s/ GGR Actividades de Juegos",
    },
    {
      id: "node-conalot",
      name: "CONALOT (Ente Regulador)",
      shortLabel: "CONALOT",
      role: "conalot",
      runlotCode: "ENTE-REGULADOR-01",
      status: "ONLINE",
      latencyMs: 29,
      protocol: "SCFD WebSocket / Telemetría RNG",
      digitalCert: "CERT-CONALOT-SUPERVISION-002",
      processedCount: 654000,
      lastHeartbeat: now,
      entityDescription: "Supervisión Telemática, Auditoría de Código y Cierre Pre-Sorteo",
    },
    {
      id: "node-iobpas",
      name: "IOBPAS (Beneficencia Pública)",
      shortLabel: "IOBPAS",
      role: "iobpas",
      runlotCode: "ENTE-LOTERIA-01",
      status: "ONLINE",
      latencyMs: 42,
      protocol: "Clearing Canon Social REST",
      digitalCert: "CERT-IOBPAS-BENEFICENCIA-2026",
      processedCount: 312000,
      lastHeartbeat: now,
      entityDescription: "Loterías Oficiales • Fondos para Hospitales y Asistencia Social",
    },
    {
      id: "node-alcaldia",
      name: "Alcaldías Municipales (Haciendas Locales)",
      shortLabel: "Alcaldías",
      role: "alcaldia",
      runlotCode: "ENTES-MUNICIPALES-2,5%",
      status: "ONLINE",
      latencyMs: 45,
      protocol: "LOCAPTEM Art. 29 num 1 Harmonized API",
      digitalCert: "CERT-MUNICIPAL-IAE-2026",
      processedCount: 298000,
      lastHeartbeat: now,
      entityDescription: "Recaudación del 2,5% IAE sobre Comisiones Propias (Bancarizada)",
    },
  ];
}

/**
 * Calcula las cajas acumuladas de los entes del Estado a partir de los tickets emitidos
 */
export function computeVaultsFromTickets(
  tickets: RecordedPOSTicket[]
): StateVaultsSummary {
  let seniatIgf16 = 0;
  let seniatJuegos10 = 0;
  let conalotSupervision = 0;
  let iobpasCanonGgr = 0;
  let alcaldiasIae = 0;

  for (const t of tickets) {
    const isTriples = t.modalityId === "triples";
    const grossPrize = t.guaranteedOrMaxGrossPrize;
    const igf16 = Number((grossPrize * 0.16).toFixed(2));
    const ggr = Math.max(0, t.totalFacial - grossPrize);

    // 1. SENIAT
    seniatIgf16 += igf16;
    seniatJuegos10 += ggr * 0.1;

    // 2. CONALOT (Supervisión telemática promedio 0.5% facial en tickets individuales o base RUNLOT)
    conalotSupervision += t.totalFacial * 0.005;

    // 3. IOBPAS (Propuesta: 5% Armonizado s/ GGR para todos)
    iobpasCanonGgr += ggr * 0.05;

    // 4. Alcaldías (2.5% sobre la comisión bruta de taquilla y el spread de comercializadora)
    const commTaquilla = isTriples ? t.totalFacial * 0.2 : t.totalFacial * 0.12;
    const spreadComercial = isTriples ? t.totalFacial * 0.05 : t.totalFacial * 0.06;
    alcaldiasIae += (commTaquilla + spreadComercial) * 0.025;
  }

  const totalStateSettled =
    seniatIgf16 +
    seniatJuegos10 +
    conalotSupervision +
    iobpasCanonGgr +
    alcaldiasIae;

  return {
    seniatIgf16,
    seniatJuegos10,
    conalotSupervision,
    iobpasCanonGgr,
    alcaldiasIae,
    totalStateSettled,
  };
}

/**
 * Convierte un ticket emitido en una transacción forense certificada
 */
export function createForensicRecordFromTicket(
  ticket: RecordedPOSTicket,
  customTxId?: string
): ForensicTransactionRecord {
  const isTriples = ticket.modalityId === "triples";
  const grossPrize = ticket.guaranteedOrMaxGrossPrize;
  const retencionIgf16 = Number((grossPrize * 0.16).toFixed(2));
  const premiosNetos84 = Number((grossPrize * 0.84).toFixed(2));
  const ggr = Math.max(0, ticket.totalFacial - grossPrize);

  const taquillaCommBruta = isTriples
    ? ticket.totalFacial * 0.2
    : ticket.totalFacial * 0.12;
  const comercialSpreadBruto = isTriples
    ? ticket.totalFacial * 0.05
    : ticket.totalFacial * 0.06;

  const iaeTaquilla = taquillaCommBruta * 0.025;
  const iaeComercial = comercialSpreadBruto * 0.025;
  const alcaldiaShare = iaeTaquilla + iaeComercial;

  const taquillaComision = taquillaCommBruta - iaeTaquilla;
  const comercializadoraSpread = comercialSpreadBruto - iaeComercial;

  const seniatJuegos10 = ggr * 0.1;
  const iobpasCanonGgr = ggr * 0.05;
  const conalotSupervision = ticket.totalFacial * 0.005;

  const seniatShare = retencionIgf16 + seniatJuegos10;
  const conalotShare = conalotSupervision;
  const iobpasShare = iobpasCanonGgr;

  // Canon IT 1% s/ Facial cobrado a la Operadora
  const sistemaItCanon1Pct = ticket.totalFacial * 0.01;

  // Net win remanente
  const netWinDistribuible = Math.max(
    0,
    ggr - taquillaCommBruta - comercialSpreadBruto - seniatJuegos10 - iobpasCanonGgr
  );
  const operadoraShareBruto = netWinDistribuible * 0.5;
  const operadoraNetWin = Math.max(0, operadoraShareBruto - sistemaItCanon1Pct);

  const txId =
    customTxId ||
    `TX-${ticket.drawNumber}-${ticket.ticketNumber}-${Date.now().toString(36).toUpperCase()}`;

  return {
    txId,
    ticketNumber: ticket.ticketNumber,
    drawNumber: ticket.drawNumber,
    timestamp: ticket.timestamp,
    timestampMs: Date.now(),
    type: "EMISION_JUGADA",
    status: "CERTIFICADA",
    modalityName: ticket.modalityName,
    totalFacial: ticket.totalFacial,
    premiosNetos84,
    retencionIgf16,
    ggr,
    taquillaComision,
    comercializadoraSpread,
    operadoraNetWin,
    sistemaItCanon1Pct,
    seniatShare,
    conalotShare,
    iobpasShare,
    alcaldiaShare,
    sha256Payload: ticket.sha256Hash || "SHA256-HOMOLOGADO-CONALOT-BFF803FC",
    signerName: "Ing. Sistemas CIV #241.890 (SUSCERTE RSA-4096)",
    runlotAgencia: "RUN-AG-0412",
    runlotOperadora: "RUN-OP-987654",
    runlotSoftware: "RUN-SYS-019 (CDAPUESTAS v4.2)",
    httpStatusCode: 201,
    rawPayload: {
      transaction_id: txId,
      ticket_sequence: ticket.ticketNumber,
      sorteo: ticket.drawNumber,
      modalidad: ticket.modalityName,
      total_facial: ticket.totalFacial,
      premios_estimados: grossPrize,
      retencion_seniat_16_pct: retencionIgf16,
      ggr_base_ciat: ggr,
      scfd_protocol: "REST_TLS_1.3",
      runlot_compliance: {
        agencia_status: "CERTIFICADA",
        operadora_status: "CONCESION_VIGENTE",
        software_status: "BINARIO_HOMOLOGADO",
        juego_status: "MODALIDAD_EN_GACETA",
      },
    },
  };
}

/**
 * Genera un evento simulado de interceptación clandestina (Alerta Roja Fiscal)
 */
export function simulateClandestineForensicRecord(): ForensicTransactionRecord {
  const now = new Date();
  const txId = `ALERT-CLANDESTINE-${now.getTime()}`;
  return {
    txId,
    ticketNumber: "TKT-CLAND-9999",
    drawNumber: "4501",
    timestamp: now.toLocaleString("es-VE"),
    timestampMs: now.getTime(),
    type: "ALERTA_CLANDESTINA",
    status: "RECHAZADA_CLANDESTINA",
    modalityName: "Triples Tradicionales (Sin Certificación)",
    totalFacial: 5000,
    premiosNetos84: 0,
    retencionIgf16: 0,
    ggr: 0,
    taquillaComision: 0,
    comercializadoraSpread: 0,
    operadoraNetWin: 0,
    sistemaItCanon1Pct: 0,
    seniatShare: 0,
    conalotShare: 0,
    iobpasShare: 0,
    alcaldiaShare: 0,
    sha256Payload: "REJECTED_INVALID_HASH_TAMPERED",
    signerName: "DESCONOCIDO - AUSENCIA DE CERTIFICADO DIGITAL CIV",
    runlotAgencia: "SIN_REGISTRO_RUNLOT (PUNTO CLANDESTINO)",
    runlotOperadora: "OPERADORA_NO_AUTORIZADA",
    runlotSoftware: "SOFTWARE_PIRATA_NO_HOMOLOGADO",
    httpStatusCode: 403,
    rawPayload: {
      error: "403 FORBIDDEN - CLANDESTINE_OPERATION_INTERCEPTED",
      violation: "Violación Arts. 30, 32 y 33 Providencia SNAT/2026/00093 y Ley de Juegos",
      action_taken: "Bloqueo de IP de origen y alerta telemática enviada a CONALOT / SENIAT",
      timestamp_ms: now.getTime(),
      incident_level: "CRITICAL_RED_FLAG",
    },
  };
}

/**
 * Genera un evento simulado de cierre pre-sorteo de CONALOT
 */
export function simulatePreDrawCloseRecord(): ForensicTransactionRecord {
  const now = new Date();
  const txId = `LOCK-PREDRAW-CONALOT-${now.getTime()}`;
  return {
    txId,
    ticketNumber: "SISTEMA-CIERRE",
    drawNumber: "4501",
    timestamp: now.toLocaleString("es-VE"),
    timestampMs: now.getTime(),
    type: "CIERRE_PRE_SORTEO",
    status: "BLOQUEO_HORARIO",
    modalityName: "Todas las modalidades (Triples & Animalitos)",
    totalFacial: 0,
    premiosNetos84: 0,
    retencionIgf16: 0,
    ggr: 0,
    taquillaComision: 0,
    comercializadoraSpread: 0,
    operadoraNetWin: 0,
    sistemaItCanon1Pct: 0,
    seniatShare: 0,
    conalotShare: 0,
    iobpasShare: 0,
    alcaldiaShare: 0,
    sha256Payload: "CONALOT_PRE_DRAW_LOCK_SHA256_TIMESTAMP_VALIDATED",
    signerName: "CONALOT - Dirección de Inspección Telemática",
    runlotAgencia: "RED_NACIONAL",
    runlotOperadora: "TODAS_LAS_OPERADORAS",
    runlotSoftware: "CONALOT_VAULT_GATEWAY",
    httpStatusCode: 200,
    rawPayload: {
      action: "PRE_DRAW_CUTOFF_APPLIED",
      draw: "4501",
      rules: "Prohibición estricta de post-sellado (Resolución CONALOT 002-2026)",
      lock_status: "LOCKED_PRE_DRAW",
      timestamp_epoch: now.getTime(),
    },
  };
}

