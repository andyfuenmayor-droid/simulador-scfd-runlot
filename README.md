# Simulador Ejecutivo de Reforma Tributaria y Fiscalización Digital en Tiempo Real (SCFD / RUNLOT)

Aplicación web interactiva desarrollada con **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS** y **Lucide Icons**, diseñada para demostrar en vivo ante la **Mesa Técnica del SENIAT y la CONALOT** la transición desde el modelo fiscal actual sobre el **Valor Facial Bruto** (bajo la Providencia `SNAT/2026/00093`) hacia el modelo internacional recomendado por el **CIAT** basado en:

1. **Gross Gaming Revenue (GGR) / Net Win** como base imponible real.
2. **Operaciones por Cuenta de Terceros (Arts. 32 y 33 Providencia SNAT/2026/00093)** para proteger el Reporte Z de Taquillas y Comercializadoras.
3. **Interconexión Telemática vía API Gateway SCFD** vinculada al registro único **RUNLOT (CONALOT)**.

---

## Arquitectura en 4 Módulos Interactivos

### Módulo 1: Terminal POS & Emisión Simultánea de Tickets Térmicos de 80 mm (48 Columnas)
- **Selector de Modalidad de Juego con Sincronización Total:**
  - **Opción A — Sorteos de Figuras "Animalitos":** Multiplicador `30x`, Payout estándar `75%`, jugadas por defecto `04 Tigre` (100 Bs.) y `12 Caballo` (100 Bs.).
  - **Opción B — Triples y Terminales Tradicionales:** Multiplicador `600x`, Payout estándar `60%`, jugadas por defecto `748 Zulia` (50 Bs.) y `125 Táchira` (50 Bs.).
- **Vista Comparativa Lado a Lado en Papel Térmico Físico de 80 mm (`#ffffff` puro + texto `#020617` de alto contraste):**
  - **Modelo 1:** Ticket Actual Rígido (`Providencia SNAT/2026/00093 Art. 30 num. 2`).
  - **Modelo 2:** Ticket Simplificado Propuesto con tabla de 5 columnas en 1 línea por jugada (`OPCIÓN | APUEST | PREMIO BRUTO | IGF 16% | NETO A COBRAR`), Hash SHA-256 dinámico y sello QR `VALIDADO SCFD • SENIAT / CONALOT`.
- **Motor de Liquidación y Retención de Premios (Art. 18 — Modelo 3):**
  - Modal interactivo con el **Comprobante Simplificado de Retención de Premio (80 mm, 15 líneas)** exigiendo únicamente la Cédula/RIF del ganador (`V-18.456.789`).

### Módulo 2: Calculadora Financiera de los 3 Niveles (Esquema Vigente vs. Reforma GGR)
- Controles interactivos y presets rápidos para **Animalitos** y **Triples** sobre una base editable (por defecto `1.000.000,00 Bs.`).
- Contraste lado a lado para **Nivel 1 (Taquilla)**, **Nivel 2 (Comercializadora Intermediaria)** y **Nivel 3 (Operadora de Juegos)**.

### Módulo 3: Consola Telemática en Vivo SCFD (API Gateway SENIAT / CONALOT)
- Flujo en tiempo real `[POS Taquilla] -> [Sistema Homologado RUNLOT] -> [API Gateway SCFD SENIAT/CONALOT]`.
- Visor de Payload JSON en vivo y simulador de bloqueo `HTTP 403 FORBIDDEN - CLANDESTINE_OPERATION_DETECTED` para jugadas sin credencial RUNLOT.

### Módulo 4: Hoja de Ruta de 180 Días (Vacatio Legis Providencia SNAT/2026/00093)
- Línea de tiempo interactiva con los 4 hitos para emitir el **Instructivo Técnico Especial (Disposición Final Sexta)** y los **7 Puntos del Petitorio Institucional**.

---

## Ejecución Local

```bash
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:3000`

