"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Gavel,
  Layers,
  Scale,
  ShieldCheck,
} from "lucide-react";

interface MilestoneItem {
  id: number;
  daysRange: string;
  phase: string;
  title: string;
  authority: string;
  legalBasis: string;
  deliverables: string[];
  technicalImpact: string;
}

interface PetitionPoint {
  num: number;
  title: string;
  legalRef: string;
  summary: string;
  technicalJustification: string;
}

const MILESTONES_180_DAYS: MilestoneItem[] = [
  {
    id: 1,
    daysRange: "Días 1 – 45",
    phase: "Fase I • Instalación de Mesa Técnica Conjunta",
    title: "Instalación de la Mesa Técnica SENIAT – CONALOT – Sector Loterías y Homologación de Criterios",
    authority: "SENIAT (Intendencia Nacional de Tributos Internos) + CONALOT",
    legalBasis: "Disposición Final Sexta Providencia SNAT/2026/00093",
    deliverables: [
      "Reconocimiento formal del flujo financiero en 3 niveles (Taquilla, Comercializadora y Operadora).",
      "Calificación expresa de la recaudación en taquilla como Operaciones por Cuenta de Terceros (Arts. 32 y 33).",
      "Suspensión preventiva de exigencia de máquinas fiscales rígidas en puntos de venta minoristas.",
    ],
    technicalImpact:
      "Evita el colapso inmediato de más de 45.000 puntos de venta (taquillas) y establece la arquitectura base del Instructivo Técnico Especial.",
  },
  {
    id: 2,
    daysRange: "Días 46 – 90",
    phase: "Fase II • Especificación de Arquitectura API SCFD / RUNLOT",
    title: "Publicación del Estándar Técnico de Interconexión API SCFD y Esquema JSON / SHA-256",
    authority: "Gerencia General de Tecnología SENIAT + Dirección de Tecnología CONALOT",
    legalBasis: "Disposición Final Sexta + Registro Único RUNLOT",
    deliverables: [
      "Definición del esquema JSON estándar con firma criptográfica HMAC-SHA256 e identificador RUNLOT.",
      "Aprobación de los formatos térmicos de 80 mm: Modelo 2 (Ticket Simplificado Tabular con IGF 16%) y Modelo 3 (Comprobante de Retención Art. 18).",
      "Apertura del Sandbox de Pruebas de Integración para los Sistemas Tecnológicos registrados en CONALOT.",
    ],
    technicalImpact:
      "Sustituye el reporte físico tardío por trazabilidad telemática en milisegundos, bloqueando con HTTP 403 toda jugada sin RUNLOT.",
  },
  {
    id: 3,
    daysRange: "Días 91 – 135",
    phase: "Fase III • Certificación en Sandbox y Armonización LOCAPTEM",
    title: "Pruebas de Estrés Telemático, Emisión del Instructivo Técnico Especial y Armonización Municipal",
    authority: "SENIAT / CONALOT / Consejo Superior de Armonización Tributaria (LOCAPTEM)",
    legalBasis: "Arts. 29.1, 32 y 33 Providencia + Clasificador Armonizado LOCAPTEM",
    deliverables: [
      "Promulgación en Gaceta Oficial del Instructivo Técnico Especial de Facturación Digital para Juegos de Lotería.",
      "Certificación de los sistemas comercializadores e integración automática del Reporte Z consolidado por mandato.",
      "Instructivo de armonización municipal (IAE del 2,5% exclusivamente sobre la comisión o margen propio de cada nivel).",
    ],
    technicalImpact:
      "Elimina la confiscación municipal del 41,67%–52,63% sobre taquillas y comercializadoras y blinda la contabilidad de fondos en custodia.",
  },
  {
    id: 4,
    daysRange: "Días 136 – 180",
    phase: "Fase IV • Despliegue Nacional y Entrada en Vigencia Plena",
    title: "Puesta en Producción del Ecosistema SCFD / RUNLOT y Reforma de Base Imponible GGR",
    authority: "SENIAT / CONALOT / IOBPAS / Operadoras Oficiales",
    legalBasis: "Culminación exitosa de la Vacatio Legis de 180 días",
    deliverables: [
      "Activación nacional del sello QR 'VALIDADO SCFD • SENIAT / CONALOT' en todos los tickets térmicos de 80 mm.",
      "Enteramiento automatizado en línea de las retenciones del 16% de Impuesto a las Ganancias Fortuitas (Art. 18).",
      "Transición normativa hacia la base imponible sobre GGR / Net Win con plena deducibilidad en ISLR (Art. 27 num. 3).",
    ],
    technicalImpact:
      "Formalización del 100% de la red legal, erradicación de bancas clandestinas y recaudación fiscal sostenible para la República y la Beneficencia Pública.",
  },
];

const SEVEN_PETITION_POINTS: PetitionPoint[] = [
  {
    num: 1,
    title: "Reconocimiento Expreso de las Operaciones por Cuenta de Terceros (Arts. 32 y 33)",
    legalRef: "Arts. 29 num. 1, 32 y 33 Providencia SNAT/2026/00093",
    summary:
      "Calificar jurídicamente los montos captados del público apostador en Taquillas y Comercializadoras como fondos en custodia por mandato de la Operadora Oficial.",
    technicalJustification:
      "Impide que el Reporte Z compute el 100% del Valor Facial como ingreso bruto propio de la agencia o comercializadora, gravando únicamente su comisión o spread real.",
  },
  {
    num: 2,
    title: "Adopción del Modelo Internacional GGR (Gross Gaming Revenue) Recomendado por el CIAT",
    legalRef: "Reforma Ley Nacional de Loterías / Criterio Técnico CIAT",
    summary:
      "Sustituir la base imponible sobre el Valor Facial Bruto por el GGR / Net Win (Venta Bruta menos Premios Pagados al Público).",
    technicalJustification:
      "Resuelve la quiebra matemática actual (carga del 107% al 115% sobre ingresos) y transforma un déficit operativo de -12,50% / -19,00% en un superávit formal sostenible.",
  },
  {
    num: 3,
    title: "Aprobación del Ticket Térmico Simplificado de 80 mm con Desglose Tabular de IGF (Modelo 2)",
    legalRef: "Instructivo Técnico Especial — Disposición Final Sexta",
    summary:
      "Autorizar el formato tabular compacto de 80 mm (48 columnas) con 5 columnas por jugada: OPCIÓN | APUEST | PREMIO BRUTO | IGF 16% | NETO A COBRAR.",
    technicalJustification:
      "Brinda transparencia inmediata al ciudadano apostador sobre la retención del 16% de ley y ahorra hasta un 65% de papel térmico frente al formato rígido del Art. 30 num. 2.",
  },
  {
    num: 4,
    title: "Implementación del Comprobante Simplificado de Retención de Premios en 15 Líneas (Modelo 3)",
    legalRef: "Art. 18 LISLR / Decreto de Retenciones / Providencia SNAT/2026/00093",
    summary:
      "Permitir la emisión instantánea del comprobante de retención del 16% de IGF en la taquilla pagadora exigiendo únicamente la Cédula/RIF del ganador.",
    technicalJustification:
      "Automatiza el enteramiento en línea a nombre del Agente de Retención (Operadora Oficial con RUNLOT) y elimina trabas burocráticas que empujan al jugador hacia bancas ilegales.",
  },
  {
    num: 5,
    title: "Interconexión Telemática API SCFD Vinculada al Registro Único RUNLOT (CONALOT)",
    legalRef: "Homologación Conjunta SENIAT – CONALOT",
    summary:
      "Habilitar la transmisión en tiempo real vía API Gateway SCFD con firma HMAC-SHA256 exclusivamente para sistemas y agencias con credencial RUNLOT vigente.",
    technicalJustification:
      "Sustituye el hardware fiscal rígido e inaccesible ($1.500 USD por taquilla) por fiscalización digital en tiempo real y bloquea operaciones clandestinas con HTTP 403.",
  },
  {
    num: 6,
    title: "Armonización Tributaria Municipal bajo la LOCAPTEM (Alícuota sobre Comisión Propia)",
    legalRef: "Ley Orgánica de Coordinación y Armonización de las Potestades Tributarias (LOCAPTEM)",
    summary:
      "Establecer que el Impuesto a las Actividades Económicas (IAE Municipal, máx. 2,5%) recaiga exclusivamente sobre la comisión de la Taquilla y el margen propio de la Comercializadora.",
    technicalJustification:
      "Detiene la confiscación municipal del 41,67% de la comisión de la taquilla y del 52,63% del ingreso propio de la comercializadora causada por aplicar el 5% sobre el valor facial.",
  },
  {
    num: 7,
    title: "Plena Deducibilidad en el ISLR de Premios, Comisiones y Tributos Específicos de Lotería",
    legalRef: "Art. 27 num. 3 de la Ley de Impuesto Sobre la Renta (LISLR)",
    summary:
      "Garantizar la deducibilidad normal y necesaria de los premios pagados, comisiones de red, impuesto nacional de loterías y canon IOBPAS para la determinación de la renta neta.",
    technicalJustification:
      "Restaura el principio constitucional de capacidad contributiva y no confiscatoriedad (Art. 316 y 317 CRBV) en toda la cadena de valor del sector loterías.",
  },
];

export const Module4Roadmap: React.FC = () => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number>(1);
  const activeMilestone =
    MILESTONES_180_DAYS.find((m) => m.id === selectedMilestoneId) ||
    MILESTONES_180_DAYS[0];

  return (
    <div className="space-y-8">
      {/* ====================================================================
          SECCIÓN 1: LÍNEA DE TIEMPO INTERACTIVA DE 180 DÍAS (VACATIO LEGIS)
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              <CalendarClock className="w-4 h-4" />
              Módulo 4 • Cronograma Oficial de Ejecución (Vacatio Legis 180 Días)
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Hoja de Ruta de 180 Días: Instructivo Técnico Especial (Disposición Final Sexta Providencia SNAT/2026/00093)
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs self-start lg:self-auto">
            Meta: Cero Quiebras Operativas • 100% Trazabilidad SCFD
          </span>
        </div>

        {/* Selector de los 4 Hitos en Línea de Tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {MILESTONES_180_DAYS.map((milestone) => {
            const isSelected = milestone.id === selectedMilestoneId;
            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => setSelectedMilestoneId(milestone.id)}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-950/60"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-slate-900 text-slate-400 border border-slate-700"
                    }`}
                  >
                    Hito {milestone.id} • {milestone.daysRange}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      isSelected ? "text-blue-400" : "text-slate-600"
                    }`}
                  />
                </div>
                <div className="text-xs font-bold text-emerald-400 mb-1">
                  {milestone.phase.split("•")[1]?.trim()}
                </div>
                <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                  {milestone.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detalle Expandido del Hito Seleccionado */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
              <span>{activeMilestone.daysRange}</span>
              <span>•</span>
              <span>{activeMilestone.phase}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white leading-snug">
              {activeMilestone.title}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-0.5">
                  Órganos Competentes:
                </span>
                <span className="text-slate-100 font-bold">
                  {activeMilestone.authority}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-0.5">
                  Sustento Normativo:
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {activeMilestone.legalBasis}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Entregables Técnicos y Jurídicos del Hito {activeMilestone.id}
              </h4>
              <div className="space-y-2">
                {activeMilestone.deliverables.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/70">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                Impacto Directo en el Ecosistema Fiscal y de Loterías
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {activeMilestone.technicalImpact}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECCIÓN 2: LOS 7 PUNTOS DEL PETITORIO INSTITUCIONAL (SENIAT / CONALOT)
      ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Scale className="w-4 h-4" />
              Pliego Ejecutivo ante la Mesa Técnica Nacional
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Los 7 Puntos del Petitorio Institucional (Reforma GGR + Instructivo Disposición Final Sexta)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            <Gavel className="w-4 h-4 text-blue-400" />
            Arts. 316 y 317 CRBV • No Confiscatoriedad
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SEVEN_PETITION_POINTS.map((point) => (
            <div
              key={point.num}
              className={`p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between ${
                point.num === 7 ? "md:col-span-2" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono font-extrabold text-xs">
                    PUNTO #{point.num}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded">
                    {point.legalRef}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2 leading-snug">
                  {point.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {point.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/90 flex items-start gap-2 text-[11.5px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Justificación Técnica: </strong>
                  {point.technicalJustification}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

