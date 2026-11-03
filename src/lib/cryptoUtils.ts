import { BetPlay, GameModalityId } from "@/types/simulator";

export const ANIMALITOS_38_FIGURES: string[] = [
  "01 Carnero",
  "02 Toro",
  "03 Ciempiés",
  "04 Alacrán",
  "05 León",
  "06 Rana",
  "07 Perico",
  "08 Ratón",
  "09 Águila",
  "10 Tigre",
  "11 Gato",
  "12 Caballo",
  "13 Mono",
  "14 Paloma",
  "15 Zorro",
  "16 Oso",
  "17 Pavón",
  "18 Burro",
  "19 Chivo",
  "20 Cochino",
  "21 Gallo",
  "22 Camello",
  "23 Cebra",
  "24 Iguana",
  "25 Gallina",
  "26 Vaca",
  "27 Perro",
  "28 Zamuro",
  "29 Elefante",
  "30 Caimán",
  "31 Lapa",
  "32 Ardilla",
  "33 Pescado",
  "34 Venado",
  "35 Jirafa",
  "36 Culebra",
  "37 Delfín",
  "38 Ballena",
];

/**
 * Genera las jugadas para simular el TIRAJE COMPLETO de un sorteo:
 * - Animalitos: Las 38 figuras del 01 al 38 (38 opciones).
 * - Triples: Las 1.000 combinaciones del 000 al 999 (representadas mediante las primeras,
 *   el bloque intermedio consolidado y las últimas para máximo rendimiento visual).
 */
export function buildFullTirajePlays(
  modality: GameModalityId,
  unitBetAmount: number
): BetPlay[] {
  const safeBet = Math.max(1, Number(unitBetAmount) || 100);
  if (modality === "animalitos") {
    return ANIMALITOS_38_FIGURES.map((fig, idx) => ({
      id: `tiraje-anim-${idx + 1}`,
      option: fig,
      amount: safeBet,
      combinationsCount: 1,
    }));
  } else {
    // Para Triples (1.000 combinaciones del 000 al 999):
    // Mostramos 000, 001, 002, el bloque serie 003-997 (995 comb.) y 998, 999
    // para que la suma matemática sea exactamente 1.000 combinaciones * safeBet
    return [
      {
        id: "tiraje-trip-000",
        option: "000 Zulia",
        amount: safeBet,
        combinationsCount: 1,
      },
      {
        id: "tiraje-trip-001",
        option: "001 Zulia",
        amount: safeBet,
        combinationsCount: 1,
      },
      {
        id: "tiraje-trip-002",
        option: "002 Zulia",
        amount: safeBet,
        combinationsCount: 1,
      },
      {
        id: "tiraje-trip-serie",
        option: "SERIE 003 AL 997 (995 COMB.)",
        amount: safeBet * 995,
        combinationsCount: 995,
        isFullTirajeSummary: true,
      },
      {
        id: "tiraje-trip-998",
        option: "998 Zulia",
        amount: safeBet,
        combinationsCount: 1,
      },
      {
        id: "tiraje-trip-999",
        option: "999 Zulia",
        amount: safeBet,
        combinationsCount: 1,
      },
    ];
  }
}

export function isPlaysFullTiraje(
  modality: GameModalityId,
  plays: BetPlay[]
): boolean {
  const totalComb = plays.reduce(
    (acc, p) => acc + (p.combinationsCount || 1),
    0
  );
  if (modality === "animalitos") {
    return totalComb === 38 && plays.length === 38;
  }
  return totalComb === 1000;
}

export function getTotalCombinationsCount(plays: BetPlay[]): number {
  return plays.reduce((acc, p) => acc + (p.combinationsCount || 1), 0);
}

/**
 * Generates a deterministic 64-character hex SHA-256-like hash string
 */
export function generateDeterministicSha256(input: string): string {
  const seeds = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    const idx = i % 8;
    seeds[idx] = Math.imul(seeds[idx] ^ ch, 0x01000193) >>> 0;
    seeds[(idx + 3) % 8] =
      (seeds[(idx + 3) % 8] + ((seeds[idx] << 5) | (seeds[idx] >>> 27))) >>> 0;
  }

  for (let r = 0; r < 16; r++) {
    const idx = r % 8;
    seeds[idx] =
      Math.imul(seeds[idx] ^ seeds[(idx + 1) % 8], 0x85ebca6b) >>> 0;
  }

  return seeds.map((s) => s.toString(16).padStart(8, "0")).join("");
}

export function formatBs(value: number, decimals = 2): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  const fixed = Math.abs(safeVal).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = safeVal < 0 ? "-" : "";
  return decimals > 0 ? `${sign}${withThousands},${decPart}` : `${sign}${withThousands}`;
}

export function formatIntBs(value: number): string {
  const safeVal = Number.isFinite(value) ? Math.round(value) : 0;
  const intPart = Math.abs(safeVal).toString();
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = safeVal < 0 ? "-" : "";
  return `${sign}${withThousands}`;
}

export function buildSCFDPayload(params: {
  ticketNumber: string;
  drawNumber: string;
  modality: GameModalityId;
  modalityName: string;
  multiplier: number;
  plays: BetPlay[];
  timestampMs: number;
}) {
  const facialAmount = params.plays.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const fullTiraje = isPlaysFullTiraje(params.modality, params.plays);
  const totalComb = getTotalCombinationsCount(params.plays);
  const unitBet =
    totalComb > 0 ? facialAmount / totalComb : Number(params.plays[0]?.amount) || 0;

  // En Tiraje Completo (universo cerrado del sorteo), exactamente 1 opción gana (unitBet * multiplier).
  // En jugadas individuales aisladas, el premio potencial es la suma de las opciones jugadas.
  const potentialPrizeTotal = fullTiraje
    ? unitBet * params.multiplier
    : params.plays.reduce(
        (acc, p) => acc + (Number(p.amount) || 0) * params.multiplier,
        0
      );

  const igfWithholdingTotal = Number((potentialPrizeTotal * 0.16).toFixed(2));
  const netPotentialPrizeTotal = Number(
    (potentialPrizeTotal - igfWithholdingTotal).toFixed(2)
  );

  const canonicalString = JSON.stringify({
    t: params.ticketNumber,
    d: params.drawNumber,
    m: params.modality,
    c: totalComb,
    f: facialAmount,
  });

  const hmacSignature = generateDeterministicSha256(
    `SCFD-SECRET-KEY-2026::${canonicalString}`
  );

  const uuidSuffix = hmacSignature.slice(0, 12);
  const transactionUuid = `scfd-${params.ticketNumber}-${params.modality.slice(0, 4)}-${uuidSuffix}`;

  return {
    transaction_uuid: transactionUuid,
    timestamp_ms: params.timestampMs,
    platform_name:
      "Plataforma CDAPUESTAS (Ecosistema POS & Kioscos Autoservicio Homologado RUNLOT)",
    platform_id: "CDAPUESTAS_ECOSYSTEM",
    runlot_system_id: "SYS-RUN-009",
    terminal_infrastructure:
      "Terminal Taquilla POS Tradicional & Kioscos Autoservicio (Módulo 'Anúnciate')",
    runlot_operator_id: "RUN-OP-0089 (Lotería Oficial C.A. J-98765432-1)",
    runlot_agency_id: "RUN-AG-0412 (Centro de Apuestas La Favorita J-12345678-9)",
    runlot_code: "RUN-0089",
    tax_regime: "THIRD_PARTY_CUSTODY_ART_32_33",
    simulation_scope: fullTiraje
      ? params.modality === "animalitos"
        ? "FULL_TIRAJE_38_FIGURES_01_TO_38"
        : "FULL_TIRAJE_1000_COMBINATIONS_000_TO_999"
      : "INDIVIDUAL_POS_TICKET",
    total_combinations_played: totalComb,
    legal_basis: {
      custody_articles: "Arts. 32 y 33 Providencia SNAT/2026/00093",
      own_tax_base: "Art. 29 num. 1 (Exclusivamente sobre Comisión de Agencia)",
      prize_withholding: "Art. 18 LISLR / Decreto Retenciones (16% IGF)",
    },
    ticket_metadata: {
      ticket_number: params.ticketNumber,
      draw_number: `#${params.drawNumber}`,
      game_modality: params.modalityName,
      prize_multiplier: `${params.multiplier}x`,
    },
    facial_amount: Number(facialAmount.toFixed(2)),
    potential_prize: Number(potentialPrizeTotal.toFixed(2)),
    igf_withholding_16: igfWithholdingTotal,
    net_prize_payable: netPotentialPrizeTotal,
    plays_summary: fullTiraje
      ? {
          mode: "TIRAJE_COMPLETO_SORTEO",
          range: params.modality === "animalitos" ? "01 al 38 (38 figuras)" : "000 al 999 (1.000 combinaciones)",
          unit_bet_bs: unitBet,
          guaranteed_winners_per_draw: 1,
          winning_gross_prize_bs: potentialPrizeTotal,
          igf_16_withholding_bs: -igfWithholdingTotal,
          net_prize_payable_bs: netPotentialPrizeTotal,
        }
      : params.plays.map((p) => {
          const amt = Number(p.amount) || 0;
          const gross = amt * params.multiplier;
          const igf = Number((gross * 0.16).toFixed(2));
          return {
            option: p.option,
            bet_amount_bs: amt,
            gross_prize_bs: gross,
            igf_16_withholding_bs: -igf,
            net_prize_payable_bs: Number((gross - igf).toFixed(2)),
          };
        }),
    hmac_sha256_signature: hmacSignature,
  };
}

/**
 * Genera el archivo XML oficial para declaración telemática de retenciones del 16% IGF
 * según el Decreto 1.808 (Concepto 077 - Ganancias en Juegos de Loterías / Hipódromos)
 * y Planilla SENIAT Forma 99029, consolidado por la Operadora de Lotería Oficial C.A.
 */
export function generateSeniatWithholdingXML(params: {
  rifAgente?: string;
  periodo?: string; // Formato AAAAMM, ej. 202611
  items?: Array<{
    rifRetenido: string;
    numeroTicket: string;
    numeroControl: string;
    fechaOperacion: string;
    montoOperacion: number;
    porcentajeRetencion: number;
    montoRetenido: number;
  }>;
}): string {
  const rifAgente = params.rifAgente || "J-98765432-1";
  const periodo = params.periodo || "202611";
  const items = params.items || [
    {
      rifRetenido: "V-18456789",
      numeroTicket: "TKT-00012346",
      numeroControl: "CTL-4501-RUN009-TRIP",
      fechaOperacion: "02/11/2026",
      montoOperacion: 600000.0,
      porcentajeRetencion: 16.0,
      montoRetenido: 96000.0,
    },
    {
      rifRetenido: "V-20123456",
      numeroTicket: "TKT-00012345",
      numeroControl: "CTL-4501-RUN009-ANIM",
      fechaOperacion: "02/11/2026",
      montoOperacion: 30000.0,
      porcentajeRetencion: 16.0,
      montoRetenido: 4800.0,
    },
  ];

  const totalOperaciones = items.reduce((a, b) => a + b.montoOperacion, 0);
  const totalRetenido = items.reduce((a, b) => a + b.montoRetenido, 0);

  const lines: string[] = [
    `<?xml version="1.0" encoding="ISO-8859-1"?>`,
    `<!-- GENERADO AUTOMÁTICAMENTE POR PLATAFORMA CDAPUESTAS (SYS-RUN-009) -->`,
    `<!-- CONCILIACIÓN OFICIAL ART. 65 LISLR + ART. 9.2 DECRETO 1.808 + ART. 18 PROVIDENCIA SNAT/2026/00093 -->`,
    `<RelacionRetencionesISLR RifAgente="${rifAgente}" Periodo="${periodo}">`,
    `  <!-- TOTAL PREMIOS BRUTOS: Bs. ${totalOperaciones.toFixed(2)} | TOTAL RETENCIÓN 16%: Bs. ${totalRetenido.toFixed(2)} -->`,
  ];

  items.forEach((it) => {
    lines.push(`  <DetalleRetencion>`);
    lines.push(`    <RifRetenido>${it.rifRetenido.replace(/[^A-Za-z0-9]/g, "")}</RifRetenido>`);
    lines.push(`    <NumeroFactura>${it.numeroTicket}</NumeroFactura>`);
    lines.push(`    <NumeroControl>${it.numeroControl}</NumeroControl>`);
    lines.push(`    <FechaOperacion>${it.fechaOperacion}</FechaOperacion>`);
    lines.push(`    <CodigoConcepto>077</CodigoConcepto>`);
    lines.push(`    <MontoOperacion>${it.montoOperacion.toFixed(2)}</MontoOperacion>`);
    lines.push(`    <PorcentajeRetencion>${it.porcentajeRetencion.toFixed(2)}</PorcentajeRetencion>`);
    lines.push(`    <MontoRetenido>${it.montoRetenido.toFixed(2)}</MontoRetenido>`);
    lines.push(`  </DetalleRetencion>`);
  });

  lines.push(`</RelacionRetencionesISLR>`);
  return lines.join("\n");
}
