# 📊 Análisis Integral en Números y Documentación Final — Simulador Ejecutivo SCFD / RUNLOT (CDAPUESTAS)

> [!IMPORTANT]
> **Propósito del Documento:** Este informe consolida la totalidad de las métricas cuantitativas, ecuaciones financieras, alícuotas tributarias, parámetros de simulación multi-actor, arquitectura técnica y hallazgos de auditoría del **Simulador Ejecutivo de Reforma Tributaria y Fiscalización Digital en Tiempo Real (SCFD / RUNLOT)**, diseñado para la **Mesa Técnica SENIAT / CONALOT** bajo la **Providencia Administrativa `SNAT/2026/00093`**.

---

## 1. Radiografía Técnica de la Aplicación en Números (Ingeniería de Software)

### 1.1. Inventario Completo del Código Fuente y Archivos

La aplicación está construida sobre **Next.js 15.5.28 (App Router)**, **React 19.1.0**, **TypeScript 5.7.2**, **Tailwind CSS 3.4.17**, **Lucide React 0.475.0** y **Supabase JS 2.118.0**.

| # | Archivo / Módulo | Líneas Totales | Líneas Efectivas (LOC) | Tamaño (Bytes) | Peso (%) s/ Código Propio | Rol Arquitectónico |
| :-: | :--- | --: | --: | --: | --: | :--- |
| 1 | `src/components/Module4TributosEntes.tsx` | 3.869 | 3.667 | 241.607 B | 41,24% | Módulo 4: 4 Subniveles Tributarios, Censo RUNLOT y Simulador Multi-Actor |
| 2 | `src/components/Module2FinancialCalculator.tsx` | 2.086 | 1.967 | 107.026 B | 18,27% | Módulo 2: Calculadora Financiera de 3 Niveles (Vigente vs. Reforma GGR) |
| 3 | `src/components/ModuleMoneyRouteIGF.tsx` | 1.476 | 1.390 | 70.664 B | 12,06% | Módulo 3 (Pestaña 3): Ruta del Dinero del 16% IGF en 5 Estaciones + XML |
| 4 | `src/app/page.tsx` | 791 | 733 | 29.984 B | 5,12% | Orquestador de Estado Global, Navegación de 6 Pestañas y Sincronización POS |
| 5 | `src/components/Module1POS.tsx` | 621 | 592 | 27.994 B | 4,78% | Módulo 1: Terminal POS 80 mm, Captura de Jugadas y Generador de Tiraje |
| 6 | `src/components/ModuleCommissionsTier.tsx` | 563 | 537 | 25.211 B | 4,30% | Configurador de 5 Escalas de Comisión (Tiers) y Slider de Reparto Net Win |
| 7 | `src/components/PrizeWithholdingModal.tsx` | 531 | 502 | 23.943 B | 4,09% | Modal Modelo 3: Liquidación de Premios y Retención 16% IGF (Art. 18) |
| 8 | `src/components/ThermalTickets.tsx` | 495 | 465 | 22.548 B | 3,85% | Renderizador Físico de Tickets Térmicos 80 mm (48 col): Modelo 1 vs. Modelo 2 |
| 9 | `src/app/globals.css` | 494 | 423 | 12.025 B | 2,05% | Sistema de Diseño Dual (Modo Oscuro/Claro) e Inmunidad del Papel Térmico |
| 10 | `src/components/Module3TelemetryConsole.tsx` | 411 | 388 | 18.531 B | 3,16% | Módulo 5 (Consola SCFD): Flujo de 3 Nodos, Payload JSON y Bloqueo HTTP 403 |
| 11 | `src/components/Module4Roadmap.tsx` | 355 | 340 | 17.852 B | 3,05% | Módulo 6: Hoja de Ruta 180 Días (4 Hitos) y 7 Puntos del Petitorio |
| 12 | `src/lib/cryptoUtils.ts` | 343 | 321 | 11.244 B | 1,92% | Motor Criptográfico SHA-256 Determinista, Constructor Payload SCFD y XML |
| 13 | `src/lib/supabaseClient.ts` | 188 | 171 | 6.032 B | 1,03% | Conector PostgreSQL/Supabase y Sincronización de Tickets y Proyecciones |
| 14 | `SUPABASE_SCHEMA_CDAPUESTAS_RUNLOT.sql` | 143 | 131 | 8.141 B | 1,39% | DDL PostgreSQL: 4 Tablas, 7 Registros Semilla RUNLOT y 8 Políticas RLS |
| 15 | `src/types/simulator.ts` | 79 | 73 | 2.044 B | 0,35% | Definiciones de Tipos e Interfaces TypeScript del Dominio Fiscal y POS |
| 16 | `src/app/layout.tsx` | 42 | 40 | 1.379 B | 0,24% | Layout Raíz e Hidratación de Tema Visual (`scfd_theme`) |
| 17 | Archivos de Configuración y Documentación (`README.md`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss`, `next.config`) | 140 | 130 | 5.456 B | 0,93% | Configuración de Compilador, Estilos y Dependencias |
| — | **TOTAL CÓDIGO PROPIO (Sin `package-lock.json`)** | **12.228** | **11.491** | **631.681 B** | **100,00%** | **23 Archivos de Código Fuente, SQL y Configuración** |
| — | **TOTAL REPOSITORIO (Con `package-lock.json`)** | **14.556** | **13.819** | **709.047 B** | — | **24 Archivos Totales** |

### 1.2. Indicadores Estructurales de Arquitectura
- **Módulos de Navegación Principal en UI:** **6 módulos** interactivos en barra superior (`SimulatorDashboardPage`), aunque el `README.md` original describe la arquitectura base de 4 módulos (posteriormente expandida a 6 con la adición de *Ruta del Dinero 16% IGF* y *Tributos en 4 Subniveles & Proyección Multi-Actor*).
- **Tablas de Base de Datos (Supabase PostgreSQL):** **4 tablas** (`runlot_censo`, `tickets_taquilla`, `liquidaciones_fiscales`, `proyecciones_multi_actor`) con **8 políticas RLS** (lectura e inserción pública) y **7 registros semilla** (1 por cada sujeto obligado RUNLOT).
- **Modelos de Impresión Térmica de 80 mm (48 columnas):** **3 modelos** (`Modelo 1: Factura Fiscal Rígida Art. 30.2`, `Modelo 2: Ticket Simplificado Cuenta de Terceros Arts. 32-33`, `Modelo 3: Comprobante de Retención 16% IGF Art. 18 en 15 líneas exactas` + `Comprobante ARC`).

---

## 2. Parámetros Matemáticos de las Modalidades de Juego

La aplicación modela **2 modalidades oficiales de lotería**, configuradas en `GAME_MODALITIES` (`src/app/page.tsx`) y `src/lib/cryptoUtils.ts`:

| Parámetro Matemático / Financiero | Modalidad A: Sorteos de Figuras "Animalitos" | Modalidad B: Triples y Terminales Tradicionales | Consolidado Ambos Tirajes Completos |
| :--- | :---: | :---: | :---: |
| **Universo / Combinaciones por Sorteo ($N$)** | **38 figuras** (`01 Carnero` a `38 Ballena`) | **1.000 combinaciones** (`000` a `999`) | **1.038 opciones** |
| **Probabilidad de Acierto Simple ($1/N$)** | $1 / 38 = \mathbf{2,6316\%}$ | $1 / 1.000 = \mathbf{0,1000\%}$ | — |
| **Multiplicador de Premio Bruto ($M$)** | **30x** la apuesta | **600x** la apuesta | — |
| **Payout Matemático Exacto en Tiraje ($M/N$)** | $30 / 38 = \mathbf{78,9474\%}$ | $600 / 1.000 = \mathbf{60,0000\%}$ | **60,6936%** |
| **Payout Estándar Nominal (Etiqueta / Proyecciones)** | **75,00%** | **60,00%** | **63,00%** (en mix 80/20) |
| **Margen GGR Matemático en Tiraje ($1 - M/N$)** | $8 / 38 = \mathbf{21,0526\%}$ | $400 / 1.000 = \mathbf{40,0000\%}$ | **39,3064%** |
| **Margen GGR Estándar en Proyecciones** | **25,00%** | **40,00%** | **37,00%** (en mix 80/20) |
| **Apuesta Unitaria por Defecto en Tiraje** | **Bs. 1.000,00** | **Bs. 1.000,00** | **Bs. 1.000,00** |
| **Venta Facial de 1 Tiraje Completo** | **Bs. 38.000,00** | **Bs. 1.000.000,00** | **Bs. 1.038.000,00** |
| **Premio Bruto Garantizado (1 Ganador)** | **Bs. 30.000,00** | **Bs. 600.000,00** | **Bs. 630.000,00** |
| **Retención 16% IGF (Art. 65 LISLR / Art. 18)** | **-Bs. 4.800,00** | **-Bs. 96.000,00** | **-Bs. 100.800,00** |
| **Premio Neto Entregado en Efectivo (84%)** | **Bs. 25.200,00** | **Bs. 504.000,00** | **Bs. 529.200,00** |
| **GGR del Neto en Tiraje (Venta − Premio Bruto)** | **Bs. 8.000,00** | **Bs. 400.000,00** | **Bs. 408.000,00** |

---

## 3. Estructura de Comisiones y Tributos por Nivel y Ente Público

### 3.1. Escalas de Comisión de Intermediación (Tiers)
Configuradas en `COMMISSION_TIERS` (`src/components/ModuleCommissionsTier.tsx`) y `computeTicketBreakdown` (`src/components/Module2FinancialCalculator.tsx`):

| Modalidad / Escala (Tier) | Rango de Ventas Faciales | Comisión Total Asignada por Operadora | Nivel 1: Comisión Taquilla POS | Nivel 2: Diferencial (Spread) Comercializadora |
| :--- | :--- | :---: | :---: | :---: |
| **Animalitos (Estándar Fijo)** | Cualquier volumen | **18,00%** | **12,00%** | **6,00%** |
| **Triples — Pacto Ejecutivo 25% (Por Defecto)** | Cualquier volumen (`tramo_comercializadora_25`) | **25,00%** | **20,00%** | **5,00%** |
| **Triples — Tramo 1 (Estándar)** | Hasta Bs. 500.000,00 (`tramo1`) | **26,00%** | **18,00%** | **8,00%** |
| **Triples — Tramo 2 (Alto Rendimiento)** | Bs. 500.001,00 a Bs. 2.000.000,00 (`tramo2`) | **30,00%** | **20,00%** | **10,00%** |
| **Triples — Tramo 3 (Macro-Agencias)** | Más de Bs. 2.000.000,00 (`tramo3`) | **34,00%** | **22,00%** | **12,00%** |
| **Triples — Pacto Máster Histórico** | Referencia original (`tramo_master_34`) | **34,00%** | **20,00%** | **14,00%** |

### 3.2. Matriz de Alícuotas Tributarias y Parafiscales: Esquema Vigente vs. Reforma Propuesta

| Tributo / Contribución | Ente Acreedor | Sujeto Pasivo | Esquema Vigente (Modelo 1 • s/ Valor Facial) | Reforma Propuesta (Modelo 2 • GGR + Arts. 32-33) | Base Legal en la Aplicación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IAE Municipal Nivel 1** | Alcaldías | Taquilla / Centro de Apuestas | **5,00%** sobre el **100% del Valor Facial** | **2,50%** exclusivamente sobre su **Comisión Bruta** | LOCAPTEM Art. 29 num. 1 + Arts. 32-33 Prov. 00093 |
| **IAE Municipal Nivel 2** | Alcaldías | Comercializadora Intermediaria | **5,00%** sobre el **100% del Valor Facial** | **2,50%** exclusivamente sobre su **Spread Propio** | LOCAPTEM Art. 29 num. 1 + Arts. 32-33 Prov. 00093 |
| **IAE Municipal Nivel 3** | Alcaldías | Operadora de Lotería | **5,00%** sobre el **100% del Valor Facial** | **0,00% (No Sujeto / Exento)** | Prohibición Doble Tributación (Arts. 180 y 183 CRBV) |
| **Impuesto sobre Juegos de Lotería** | SENIAT | Operadora de Lotería | **12,00%** (Triples) / **10,00%** (Animalitos) s/ **Valor Facial** | **10,00% Universal Armonizado** sobre el **GGR** ($\text{Venta} - \text{Premios}$) | Estándar Internacional CIAT / Reforma Ley de Loterías |
| **Canon / Royalty de Beneficencia** | IOBPAS | Operadora de Lotería | **5,00%** (Triples) / **1,00%** (Animalitos) s/ **Valor Facial** | **5,00%** (Triples) / **1,00%** (Animalitos) sobre el **GGR** | Ley Nacional de Lotería Art. 23 |
| **Impuesto a las Ganancias Fortuitas (IGF)** | SENIAT | Apostador Ganador (Retenido por Operadora) | **16,00%** sobre **Premios Brutos** (Fricción en taquilla) | **16,00%** sobre **Premios Brutos** (Retención automática en POS; Operadora Agente Único) | Art. 65 LISLR + Art. 9.2 Dcto. 1.808 (Concepto 077) + Planilla 99029 |
| **Impuesto al Valor Agregado (IVA)** | SENIAT | Venta de Lotería | **0,00% (Exento)** | **0,00% (Exento)** | Art. 16 num. 7 Ley de IVA |
| **Canon Tecnológico de Plataforma IT** | Empresas Sistemas IT | Operadora de Lotería | — | **1,00%** (editable) sobre la **Venta Bruta Facial** | Certificación ISO 27001 / Homologación RUNLOT |
| **Canon / Honorario Responsable IT** | Responsables Informáticos (Custodios IT) | Operadora de Lotería | — | **1,00%** (editable) sobre la **Venta Bruta Facial** | Custodia Criptográfica y Auditoría RUNLOT |

#### Distribución Auditada del Fondo Social IOBPAS (`src/components/Module4TributosEntes.tsx`)
Cada Bolívar recaudado por concepto de **Canon IOBPAS sobre GGR** se distribuye automáticamente en 4 partidas sociales:
- **40,00%** $\rightarrow$ Salud y Hospitales (Insumos quirúrgicos y oncología).
- **30,00%** $\rightarrow$ Deporte Comunitario (Canchas y escuelas infantiles).
- **20,00%** $\rightarrow$ Educación y Becas (Becas universitarias).
- **10,00%** $\rightarrow$ Adulto Mayor (Comedores y geriátricos).

---

## 4. Demostración Financiera en Números: Los 3 Niveles de la Cadena

A continuación se documentan los números exactos que calcula el simulador para un **Tiraje Completo de Triples (Bs. 1.000.000,00)**, un **Tiraje Completo de Animalitos (Bs. 38.000,00)** y el **Consolidado en Caja (Bs. 1.038.000,00)** bajo el pacto estándar (25% Triples / 18% Animalitos y reparto 50% / 50% del Net Win).

### 4.1. Caso A: Tiraje Completo de Triples (Venta Facial = Bs. 1.000.000,00)

| Renglón / Nivel de la Cadena | Esquema Vigente (s/ Valor Facial) | Reforma Propuesta Unificada (`Módulos 2, 3 y 4`: Tributos deducidos del Net Win) | Diferencia / Impacto Fiscal y Financiero |
| :--- | --: | --: | :--- |
| **1. Venta Facial Captada (1.000 comb. × Bs. 1.000)** | **Bs. 1.000.000,00** | **Bs. 1.000.000,00** | Custodia de terceros (Arts. 32 y 33 Prov. 00093) |
| **(−) Premio Bruto (1 ganador × 600x)** | -Bs. 600.000,00 | -Bs. 600.000,00 | 84% Efectivo (Bs. 504.000) + 16% IGF (Bs. 96.000) |
| **(=) GGR del Neto (Venta − Premios)** | **Bs. 400.000,00** | **Bs. 400.000,00** | **40,00%** de margen bruto real del juego |
| **NIVEL 1: TAQUILLA POS** | | | |
| • Comisión Bruta Taquilla (20% s/ Venta) | Bs. 200.000,00 | Bs. 200.000,00 | Única base imponible propia (Art. 29 num. 1) |
| • (−) IAE Municipal Alcaldía | **-Bs. 50.000,00** *(5% s/ Facial)* | **-Bs. 5.000,00** *(2,5% s/ Com.)* | Ahorro de **+Bs. 45.000,00** (elimina confiscación del 25%) |
| • **(=) Margen Neto Libre Taquilla** | **Bs. 150.000,00** *(75,0%)* | **+Bs. 195.000,00** *(97,5%)* | Taquilla retiene el **97,50%** de su comisión |
| **NIVEL 2: COMERCIALIZADORA** | | | |
| • Comisión Total Operadora (25%) − Taquilla (20%) | Bs. 50.000,00 | Bs. 50.000,00 | Diferencial (Spread Propio) del **5,00%** |
| • (−) IAE Municipal Alcaldía | **-Bs. 50.000,00** *(5% s/ Facial)* | **-Bs. 1.250,00** *(2,5% s/ Spread)* | En el esquema vigente se confisca el **100%** del spread |
| • (=) Comisión Final Neta Comercializadora | **Bs. 0,00** | **+Bs. 48.750,00** | **97,50%** del spread preservado |
| • (+) Participación 50% en Net Win Distribuible | Bs. 0,00 *(Impago)* | **+Bs. 45.000,00** *(50% de 90k)* | Reparto 50/50 tras deducir tributos de juego (SENIAT + IOBPAS) |
| • **(=) Resultado Neto Comercializadora** | **Bs. 0,00** *(Sin Net Win real)* | **+Bs. 93.750,00** | Rentabilidad formal garantizada en los Módulos 2, 3 y 4 |
| **NIVEL 3: OPERADORA DE LOTERÍA** | | | |
| • Net Win Base ($\text{GGR } 400\text{k} - \text{Comisiones } 250\text{k}$) | Bs. 150.000,00 | Bs. 150.000,00 | **15,00%** sobre la venta facial |
| • (−) Impuesto SENIAT sobre Juegos | **-Bs. 120.000,00** *(12% Facial)* | **-Bs. 40.000,00** *(10% s/ GGR)* | Reducción de Bs. 80.000 al gravar riqueza real (GGR) |
| • (−) Canon IOBPAS Beneficencia Pública | **-Bs. 50.000,00** *(5% Facial)* | **-Bs. 20.000,00** *(5% s/ GGR)* | Destinado 40% Salud, 30% Deporte, 20% Educ., 10% Adulto Mayor |
| • (=) Net Win Distribuible (Tras Tributos Juego) | Bs. 0,00 *(Déficit)* | **Bs. 90.000,00** | Utilidad líquida repartida 50% Comercializadora / 50% Operadora |
| • (−) IAE Municipal sobre Operadora | **-Bs. 50.000,00** *(5% Facial)* | **Bs. 0,00** *(0% No Sujeto)* | Elimina doble tributación inconstitucional |
| • **(=) Resultado Operativo Operadora (50% NW)** | **-Bs. 145.000,00 (QUIEBRA)** | **+Bs. 45.000,00 (SUPERÁVIT)** | Pasa de quiebra matemática a solvencia patrimonial |

---

### 4.2. Caso B: Tiraje Completo de Animalitos (Venta Facial = Bs. 38.000,00) y Escala Bs. 1.000.000,00

| Renglón / Nivel de la Cadena | Tiraje Completo (Bs. 38.000 • Payout Matemático $30/38 = 78,95\%$) | Escala Bs. 1.000.000 (Unificado • Payout Matemático $30/38 = 78,95\%$) |
| :--- | --: | --: |
| **1. Venta Facial Captada** | **Bs. 38.000,00** | **Bs. 1.000.000,00** |
| **(−) Premios Brutos Acertados ($30/38 = 78,947368\%$)** | -Bs. 30.000,00 | -Bs. 789.473,68 |
| • *Efectivo Pagado al Ganador (84%)* | *-Bs. 25.200,00* | *-Bs. 663.157,89* |
| • *Retención 16% IGF (SENIAT Planilla 99029)* | *-Bs. 4.800,00* | *-Bs. 126.315,79* |
| **(=) GGR del Neto (Venta − Premios = $8/38 = 21,052632\%$)** | **Bs. 8.000,00** *(21,05%)* | **Bs. 210.526,32** *(21,05%)* |
| **2. Nivel 1 — Taquilla (Comisión 12%)** | **Bs. 4.560,00** | **Bs. 120.000,00** |
| • *(−) IAE Vigente (5% s/ Facial)* | *-Bs. 1.900,00 (Confisca 41,67%)* | *-Bs. 50.000,00 (Confisca 41,67%)* |
| • (−) IAE Reforma (2,5% s/ Comisión 12%) | -Bs. 114,00 | -Bs. 3.000,00 |
| • **(=) Margen Neto Libre Taquilla (Reforma)** | **+Bs. 4.446,00** *(97,5%)* | **+Bs. 117.000,00** *(97,5%)* |
| **3. Nivel 2 — Comercializadora (Spread 6%)** | **Bs. 2.280,00** | **Bs. 60.000,00** |
| • *(−) IAE Vigente (5% s/ Facial)* | *-Bs. 1.900,00 (Confisca 83,33%)* | *-Bs. 50.000,00 (Confisca 83,33%)* |
| • (−) IAE Reforma (2,5% s/ Spread 6%) | -Bs. 57,00 | -Bs. 1.500,00 |
| • (=) Comisión Final Neta Comercializadora | **+Bs. 2.223,00** | **+Bs. 58.500,00** |
| **4. Net Win Base ($\text{GGR} - 18\% \text{ Comisiones}$)** | **Bs. 1.160,00** *(3,05%)* | **Bs. 30.526,32** *(3,05%)* |
| • (−) Impuesto SENIAT (10% s/ GGR) | -Bs. 800,00 | -Bs. 21.052,63 |
| • (−) Canon IOBPAS (1% s/ GGR) | -Bs. 80,00 | -Bs. 2.105,26 |
| **5. Net Win Distribuible (Tras Tributos Juego)** | **Bs. 280,00** *(0,74%)* | **Bs. 7.368,42** *(0,74%)* |
| • **50% Net Win Comercializadora (+ Spread Neto)** | **+Bs. 140,00** *(Total: +Bs. 2.363,00)* | **+Bs. 3.684,21** *(Total: +Bs. 62.184,21)* |
| • **50% Superávit Operadora (Antes de IT 1%)** | **+Bs. 140,00** | **+Bs. 3.684,21** |

---

## 5. Simulador de Proyecciones Multi-Actor (5 Sujetos Obligados y 4 Entes Públicos)

En el **Módulo 4 (Subcarpeta: Simulador Multi-Actor)** (`src/components/Module4TributosEntes.tsx`), la aplicación proyecta la operación nacional combinando un mix ponderado unificado de **80% Triples (Payout 60%) + 20% Animalitos (Payout Matemático $30/38 = 78,947368\%$)**.

### 5.1. Distribución Porcentual Exacta del 100,00% del Valor Facial en el Mix 80/20

$$\text{Venta Bruta Total } (100,00\%) = \text{Apostadores } (53,583\%) + \text{Estado } (16,059\%) + \text{Red Privada } (30,357\%)$$

| # | Participante / Concepto | Fórmula sobre Mix (80% Triples / 20% Animalitos $30/38$) | % Exacto s/ Venta Facial | Naturaleza del Flujo |
| :-: | :--- | :--- | --: | :--- |
| 1 | **Apostadores Ganadores (Efectivo 84%)** | $[(0,80 \times 60\%) + (0,20 \times \frac{30}{38})] \times 84\%$ | **53,583%** | Retorno en efectivo en taquilla |
| 2 | **SENIAT — Retención 16% IGF (Planilla 99029)** | $[(0,80 \times 60\%) + (0,20 \times \frac{30}{38})] \times 16\%$ | **10,206%** | Recaudación Fiscal Nacional |
| 3 | **SENIAT — Impuesto s/ Juegos (10% s/ GGR)** | $[(0,80 \times 40\%) + (0,20 \times \frac{8}{38})] \times 10\%$ | **3,621%** | Recaudación Fiscal Nacional |
| 4 | **IOBPAS — Canon Beneficencia (5% Trip / 1% Anim)** | $(32\% \times 5\%) + (4,2105\% \times 1\%)$ | **1,642%** | Parafiscal Beneficencia Pública |
| 5 | **Alcaldías — IAE Municipal (2,5% s/ Comisiones)** | $(18,40\% + 5,20\%) \times 2,5\%$ | **0,590%** | Recaudación Tributaria Municipal |
| 6 | **Taquillas POS — Comisión Neta (97,5%)** | $[(0,80 \times 20\%) + (0,20 \times 12\%)] \times 97,5\%$ | **17,940%** | Ingreso Privado Nivel 1 (Antes de Licencias) |
| 7 | **Comercializadoras — Spread Neto + 50% Net Win** | $(5,20\% \times 97,5\%) + (7,3474\% \times 50\%)$ | **8,744%** | Ingreso Privado Nivel 2 (Antes de Licencias) |
| 8 | **Empresas Sistemas IT — Canon Tecnológico (1%)** | $1,00\% \text{ sobre Venta Facial Bruta (pagado por Operadora)}$ | **1,000%** | Ingreso Privado Nivel 4 (Antes de Licencias) |
| 9 | **Responsables IT — Custodia y Auditoría (1%)** | $1,00\% \text{ sobre Venta Facial Bruta (pagado por Operadora)}$ | **1,000%** | Ingreso Privado Nivel 5 (Antes de Licencias) |
| 10 | **Operadoras — 50% Net Win menos Cánones IT (2%)** | $(7,3474\% \times 50\%) - 1,00\% - 1,00\%$ | **1,674%** | Ingreso Privado Nivel 3 (Antes de Licencias) |
| — | **SUMA TOTAL CUADRADA AL CÉNTIMO** | **Cuadre Matemático Integral** | **100,000%** | **Diferencial: Bs. 0,00** |

---

### 5.2. Estructura de Costos Fijos Anuales de Licenciamiento (RUNLOT + IOBPAS)

El simulador incorpora cánones anuales editables (pagaderos **1 vez al año** por unidad), con opción de imputación por **Devengo Mensual ($\div 12$)** o **Contado Anual ($100\%$)** (`src/components/Module4TributosEntes.tsx`):

| Actor / Sujeto Obligado (5 Niveles) | Tasa Anual RUNLOT / CONALOT (Bs./año) | Licencia Anual IOBPAS (Bs./año) | Costo Total Anual por Unidad (1 vez/año) | Alícuota Mensual Devengada ($\div 12$, 30 días) | Alícuota Diaria Devengada ($\div 365$, 1 día) |
| :--- | --: | --: | --: | --: | --: |
| **1. Taquilla / Centro de Apuestas POS** | Bs. 300.000,00 | Bs. 120.000,00 | **Bs. 420.000,00** | Bs. 35.000,00 | Bs. 1.150,68 |
| **2. Comercializadora Intermediaria** | Bs. 1.000.000,00 | Bs. 400.000,00 | **Bs. 1.400.000,00** | Bs. 116.666,67 | Bs. 3.835,62 |
| **3. Operadora de Lotería (Entidad + Juego)** | Bs. 1.500.000,00 *(1M + 500k)* | Bs. 400.000,00 | **Bs. 1.900.000,00** | Bs. 158.333,33 | Bs. 5.205,48 |
| **4. Empresa de Sistema Informático (IT)** | Bs. 1.200.000,00 | Bs. 0,00 | **Bs. 1.200.000,00** | Bs. 100.000,00 | Bs. 3.287,67 |
| **5. Responsable Informático (Custodio IT)** | Bs. 1.000.000,00 | Bs. 0,00 | **Bs. 1.000.000,00** | Bs. 83.333,33 | Bs. 2.739,73 |

---

### 5.3. Resultados Numéricos de los 4 Escenarios Presets (Modo Devengo)

A continuación se documentan los resultados exactos que arroja el motor para los **4 escenarios preconfigurados** en `src/components/Module4TributosEntes.tsx`:

| Indicador / Renglón Proyectado | Preset 1: Base Real Unitaria (1 Taq • 30d • Bs. 10k/día) | Preset 2: Piloto (25 Taq • 30d • Bs. 20k/día) | Preset 3: Regional (150 Taq • 30d • Bs. 40k/día) | Preset 4: Gran Escala Nacional (10.000 Taq • 365d • Bs. 50k/día) |
| :--- | --: | --: | --: | --: |
| **Configuración de Red (Taq / Com / Op / Sys / Resp)** | `1 / 1 / 1 / 1 / 1` | `25 / 1 / 1 / 1 / 1` | `150 / 3 / 2 / 2 / 2` | `10.000 / 50 / 10 / 10 / 10` |
| **Venta Bruta Total Proyectada (100%)** | **Bs. 300.000,00** | **Bs. 15.000.000,00** | **Bs. 180.000.000,00** | **Bs. 182.500.000.000,00** |
| **(−) Premios Brutos Totales (63,79%)** | Bs. 191.368,42 | Bs. 9.568.421,05 | Bs. 114.821.052,63 | Bs. 116.415.789.473,68 |
| • **Efectivo Pagado al Apostador (84% = 53,58%)** | **Bs. 160.749,47** | **Bs. 8.037.473,68** | **Bs. 96.449.684,21** | **Bs. 97.789.263.157,89** |
| • **Retención 16% IGF SENIAT (10,21%)** | **Bs. 30.618,95** | **Bs. 1.530.947,37** | **Bs. 18.371.368,42** | **Bs. 18.626.526.315,79** |
| **(=) GGR Consolidado de Red (36,21%)** | **Bs. 108.631,58** | **Bs. 5.431.578,95** | **Bs. 65.178.947,37** | **Bs. 66.084.210.526,32** |
| **RECAUDACIÓN PÚBLICA (4 ENTES DEL ESTADO)** | | | | |
| 1. **SENIAT — Impuesto s/ Juegos (10% GGR = 3,62%)** | Bs. 10.863,16 | Bs. 543.157,89 | Bs. 6.517.894,74 | Bs. 6.608.421.052,63 |
| 2. **SENIAT — Retención 16% IGF (10,21%)** | Bs. 30.618,95 | Bs. 1.530.947,37 | Bs. 18.371.368,42 | Bs. 18.626.526.315,79 |
| 3. **IOBPAS — Canon GGR (1,64%) + Licencias** | Bs. 81.592,98 | Bs. 572.982,46 | Bs. 4.622.456,14 | Bs. 4.220.842.105,26 |
| 4. **Alcaldías — IAE Municipal (2,5% Com. = 0,59%)** | Bs. 1.770,00 | Bs. 88.500,00 | Bs. 1.062.000,00 | Bs. 1.076.750.000,00 |
| 5. **CONALOT — Tasas RUNLOT (5 Actores)** | Bs. 416.666,67 | Bs. 1.016.666,67 | Bs. 4.583.333,33 | Bs. 3.087.000.000,00 |
| **(=) TOTAL APORTE AL ESTADO VENEZOLANO** | **Bs. 541.511,75** | **Bs. 3.752.254,39** | **Bs. 35.157.052,63** | **Bs. 33.619.539.473,68** |
| **RENDIMIENTO PRIVADO NETO (TRAS IAE Y LICENCIAS)** | | | | |
| • **Red de Taquillas POS (Total / Promedio Unit.)** | **+Bs. 18.820,00** *(Solvente)* | **Bs. 1.816.000,00** *(Bs. 72.640 c/u)* | **Bs. 27.042.000,00** *(Bs. 180.280 c/u)* | **Bs. 28.540.500.000,00** *(Bs. 2,85M c/u)* |
| • **Comercializadoras (Total / Promedio Unit.)** | Bs. 0,00 *(Red de 1 Taq.)* | **Bs. 1.194.885,96** *(Bs. 1,19M c/u)* | **Bs. 15.388.631,58** *(Bs. 5,13M c/u)* | **Bs. 15.887.223.684,21** *(Bs. 317,74M c/u)* |
| • **Operadoras (Total / Promedio Unit.)** | Bs. 0,00 *(Red de 1 Taq.)* | **Bs. 92.719,30** *(Bs. 92,7k c/u)* | **Bs. 2.695.964,91** *(Bs. 1,35M c/u)* | **Bs. 3.035.473.684,21** *(Bs. 303,55M c/u)* |
| • **Empresas Sistemas IT (1% Facial − Licencias)** | Bs. 0,00 *(Red de 1 Taq.)* | **Bs. 50.000,00** *(Bs. 50k c/u)* | **Bs. 1.600.000,00** *(Bs. 800k c/u)* | **Bs. 1.813.000.000,00** *(Bs. 181,3M c/u)* |
| • **Responsables IT (1% Facial − Licencias)** | Bs. 0,00 *(Red de 1 Taq.)* | **Bs. 66.666,67** *(Bs. 66,67k c/u)* | **Bs. 1.633.333,33** *(Bs. 816,67k c/u)* | **Bs. 1.815.000.000,00** *(Bs. 181,5M c/u)* |

---

## 6. Hoja de Ruta de 180 Días y los 7 Puntos del Petitorio (`Module4Roadmap.tsx`)

El **Módulo 6** (`src/components/Module4Roadmap.tsx`) estructura la **Vacatio Legis de 180 días** de la Providencia `SNAT/2026/00093` en **4 Hitos de 45 días cada uno**:

1. **Hito 1 (Días 1 – 45) — Fase I: Instalación de Mesa Técnica Conjunta SENIAT – CONALOT:**
   - Reconocimiento formal de los 3 niveles y calificación de recaudación en taquilla como Operaciones por Cuenta de Terceros (Arts. 32 y 33), evitando el colapso de **+45.000 taquillas** y el gasto de **\$1.500 USD por impresora fiscal rígida**.
2. **Hito 2 (Días 46 – 90) — Fase II: Especificación de Arquitectura API SCFD / RUNLOT:**
   - Estándar JSON con firma criptográfica `HMAC-SHA256`, latencia objetivo de **18 ms**, aprobación de formatos térmicos de **80 mm (48 columnas)** con ahorro de **65% de papel térmico** (Modelo 2 y Modelo 3 de **15 líneas exactas**).
3. **Hito 3 (Días 91 – 135) — Fase III: Certificación en Sandbox y Armonización LOCAPTEM:**
   - Promulgación en Gaceta Oficial del Instructivo Técnico Especial (Disposición Final Sexta) y armonización del IAE Municipal al **2,50%** sobre comisión/spread propio.
4. **Hito 4 (Días 136 – 180) — Fase IV: Despliegue Nacional y Entrada en Vigencia Plena:**
   - Sello QR `VALIDADO SCFD • SENIAT / CONALOT` en el 100% de la red, enteramiento XML Planilla 99029 en línea y transición normativa a base imponible **GGR / Net Win** con deducibilidad plena ISLR (Art. 27 num. 3).

---

## 7. Hallazgos Críticos de Auditoría Interna (100% Resueltos y Unificados)

Todos los 5 hallazgos detectados durante la auditoría interna fueron corregidos y unificados en el código fuente:

> [!IMPORTANT]
> **Hallazgo 1 (RESUELTO) — Unificación del Reparto del Net Win entre el Módulo 2 y los Módulos 3 y 4:**
> - En `src/components/Module2FinancialCalculator.tsx` (líneas 270–271), se actualizó `taxMode` a `"deducido_netwin"`, de modo que los tributos de juego (SENIAT 10% GGR + IOBPAS 5%/1% GGR) se deducen primero del **Net Win Base** antes del reparto societario **50% / 50%** sobre el **Net Win Distribuible**.
> - Con ello, los **Módulos 2, 3 y 4** arrojan exactamente los mismos resultados al céntimo: en Triples (Bs. 1.000.000), **+Bs. 93.750,00** para la Comercializadora y **+Bs. 45.000,00** para la Operadora; y en Animalitos (Tiraje Completo de Bs. 38.000), **+Bs. 2.363,00** para la Comercializadora y **+Bs. 140,00** para la Operadora (eliminando el déficit previo de `-Bs. 300,00`).

> [!IMPORTANT]
> **Hallazgo 2 (RESUELTO) — Unificación de la Tasa de Payout en Animalitos ($30/38 = 78,95\%$ Matemático):**
> - Se unificó la tasa de Payout de Animalitos en `src/app/page.tsx` (línea 44), `src/components/Module1POS.tsx` (línea 198) y el Simulador de Proyecciones Multi-Actor en `src/components/Module4TributosEntes.tsx` (línea 388) al factor matemático exacto de 38 figuras pagando 30x ($\frac{30}{38} = \mathbf{78,947368\%}$ de Payout y $\frac{8}{38} = \mathbf{21,052632\%}$ de GGR), garantizando total coherencia entre los cálculos por ticket y las proyecciones nacionales.

> [!IMPORTANT]
> **Hallazgo 3 (RESUELTO) — Punto de Equilibrio (*Break-Even*) en el Preset 1 ("Base Real Unitaria") y Cánones IT sobre % Facial Bruto:**
> - Se ajustó el parámetro de venta diaria del **Preset 1 ("Base Real Unitaria")** en `src/components/Module4TributosEntes.tsx` (línea 337) a **Bs. 10.000/día** (**Bs. 300.000/mes**), superando el *break-even* de **Bs. 6.503,16/día** (**Bs. 195.094,76/mes**) necesario para cubrir la alícuota mensual devengada de licencia de 1 Taquilla (**Bs. 35.000/mes**), logrando una utilidad neta de **+Bs. 18.820,00/mes** para la taquilla unitaria.
> - Asimismo, tanto **Empresas de Sistemas IT (Actor 4)** como **Responsables Informáticos (Actor 5)** operan sobre **% de Venta Bruta Facial** (`1,00%` por defecto, editable en vivo).

> [!TIP]
> **Hallazgo 4 (RESUELTO) — Jugadas Ejemplo en Pantalla POS (`defaultPlays`) y Actualización de `README.md`:**
> - Se configuraron las jugadas de ejemplo en `src/app/page.tsx` (líneas 48–64) (`04 Tigre` y `12 Caballo` en Animalitos; `748 Zulia` y `125 Táchira` en Triples), manteniendo el inicio limpio en **Bs. 0,00** ("Taquilla en Blanco") e incorporando el botón **Jugadas Ejemplo** en `src/components/Module1POS.tsx` (líneas 371–379) junto a **Tiraje Completo**, además de documentar los **6 módulos** en `README.md`.

> [!TIP]
> **Hallazgo 5 (RESUELTO) — Eliminación de Banners Duplicados de "Taquilla en Blanco" en `ModuleMoneyRouteIGF.tsx`:**
> - Se eliminaron las **6 repeticiones redundantes** del bloque `{!hasRealTickets && (...)}` entre los paneles de `src/components/ModuleMoneyRouteIGF.tsx` (líneas 474–503), conservando únicamente el aviso principal en la cabecera del Módulo 3.

