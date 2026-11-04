# Simulador Ejecutivo de Reforma Tributaria y Fiscalización Digital en Tiempo Real (SCFD / RUNLOT)

Aplicación web interactiva desarrollada con **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS** y **Lucide Icons**, diseñada para demostrar en vivo ante la **Mesa Técnica del SENIAT y la CONALOT** la transición desde el modelo fiscal actual sobre el **Valor Facial Bruto** (bajo la Providencia `SNAT/2026/00093`) hacia el modelo internacional recomendado por el **CIAT** basado en:

1. **Gross Gaming Revenue (GGR) / Net Win** como base imponible real.
2. **Operaciones por Cuenta de Terceros (Arts. 32 y 33 Providencia SNAT/2026/00093)** para proteger el Reporte Z de Taquillas y Comercializadoras.
3. **Interconexión Telemática vía API Gateway SCFD** vinculada al registro único **RUNLOT (CONALOT)**.

---

## Arquitectura en 6 Módulos Interactivos

### Módulo 1: Terminal POS & Emisión Simultánea de Tickets Térmicos de 80 mm (48 Columnas)
- **Inicio Limpio en Vivo ("Taquilla en Blanco: Bs. 0,00"):** El simulador inicia sin jugadas pre-cargadas para demostraciones en vivo, con botones rápidos para cargar **Jugadas Ejemplo** o **Tiraje Completo**:
  - **Opción A — Sorteos de Figuras "Animalitos":** Multiplicador `30x` sobre `38 figuras` (`01 al 38`), Payout matemático exacto `78,95%` (`30/38`), jugadas ejemplo `04 Tigre` (100 Bs.) y `12 Caballo` (100 Bs.), o Tiraje Completo de 38 figuras (`Bs. 38.000`).
  - **Opción B — Triples y Terminales Tradicionales:** Multiplicador `600x` sobre `1.000 combinaciones` (`000 al 999`), Payout matemático `60,00%` (`600/1.000`), jugadas ejemplo `748 Zulia` (50 Bs.) y `125 Táchira` (50 Bs.), o Tiraje Completo de 1.000 combinaciones (`Bs. 1.000.000`).
- **Vista Comparativa Lado a Lado en Papel Térmico Físico de 80 mm (`#ffffff` puro + texto `#020617` de alto contraste):**
  - **Modelo 1:** Ticket Actual Rígido (`Providencia SNAT/2026/00093 Art. 30 num. 2`).
  - **Modelo 2:** Ticket Simplificado Propuesto con tabla de 5 columnas en 1 línea por jugada (`OPCIÓN | APUEST | PREMIO BRUTO | IGF 16% | NETO A COBRAR`), Hash SHA-256 dinámico y sello QR `VALIDADO SCFD • SENIAT / CONALOT`.
- **Motor de Liquidación y Retención de Premios (Art. 18 — Modelo 3):**
  - Modal interactivo con el **Comprobante Simplificado de Retención de Premio (80 mm, 15 líneas)** exigiendo únicamente la Cédula/RIF del ganador (`V-18.456.789`).

### Módulo 2: Calculadora Financiera de los 3 Niveles (Esquema Vigente vs. Reforma GGR)
- Contraste lado a lado para **Nivel 1 (Taquilla)**, **Nivel 2 (Comercializadora Intermediaria)** y **Nivel 3 (Operadora de Juegos)** alimentado en tiempo real por los tickets o tirajes del POS.
- Reparto societario unificado `50% / 50%` sobre el **Net Win Distribuible** (una vez deducidos SENIAT 10% GGR e IOBPAS 5%/1% GGR).

### Módulo 3: Ruta del Dinero 16% IGF (Custodia, Conciliación y Planilla 99029 XML)
- Pipeline financiero interactivo de las **5 Estaciones del 16% IGF** (`84%` pagado en efectivo en taquilla + `16%` retenido en custodia telemática hasta el enteramiento centralizado en el SENIAT).
- Generador en vivo del archivo oficial **XML SENIAT (Decreto 1.808 • Concepto 077 • Planilla 99029)** y visor del comprobante **ARC Térmico de 80 mm**.

### Módulo 4: Tributos, Licencias y Simulador de Proyecciones Multi-Actor
- **Tabla 1 y Cuadre del 100% del Bolsillo del Apostador:** Desglose matemático exacto entre Apostadores, Estado (SENIAT, IOBPAS, Alcaldías) y los **5 Sujetos Privados** (Taquilla, Comercializadora, Operadora, Sistema IT y Responsable Informático).
- **Tabla 2 (4 Entes Públicos) y Simulador de Proyecciones Multi-Actor:** Escenarios en vivo (1 Día, 30 Días, 365 Días) con tasas anuales editables de licenciamiento **RUNLOT (CONALOT)** e **IOBPAS** y cánones tecnológicos sobre `% de Venta Facial Bruta` (`1%` por defecto para Sistemas IT y `1%` para Responsables Informáticos).

### Módulo 5: Consola Telemática en Vivo SCFD (API Gateway SENIAT / CONALOT)
- Flujo en tiempo real `[POS Taquilla] -> [Sistema Homologado RUNLOT] -> [API Gateway SCFD SENIAT/CONALOT]`.
- Visor de Payload JSON en vivo y simulador de bloqueo `HTTP 403 FORBIDDEN - CLANDESTINE_OPERATION_DETECTED` para jugadas sin credencial RUNLOT.

### Módulo 6: Hoja de Ruta de 180 Días (Vacatio Legis Providencia SNAT/2026/00093)
- Línea de tiempo interactiva con los 4 hitos para emitir el **Instructivo Técnico Especial (Disposición Final Sexta)** y los **7 Puntos del Petitorio Institucional**.

---

## Ejecución Local

```bash
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:3000`
