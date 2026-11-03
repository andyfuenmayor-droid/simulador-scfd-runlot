-- ============================================================================
-- SCHEMA SUPABASE POSTGRESQL: RUNLOT / SCFD / TRIBUTOS DE LOTERÍA VENEZUELA
-- Base Legal: Providencia SNAT/2026/00093, LOCAPTEM Art. 29, LISLR Art. 65
-- Compatible con Supabase Database SQL Editor (Ejecutar en 1 solo clic)
-- ============================================================================

-- Habilitar extensión UUID si no está activada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA: CENSO DE LOS 7 SUJETOS OBLIGADOS RUNLOT (CONALOT / SENIAT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS runlot_censo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'iobpas', 
        'centros_apuestas', 
        'comercializadoras', 
        'sistemas_informaticos', 
        'responsables_informaticos', 
        'operadoras', 
        'juegos'
    )),
    codigo_runlot VARCHAR(50) NOT NULL UNIQUE,
    rif VARCHAR(20) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    estado_licencia VARCHAR(30) DEFAULT 'HOMOLOGADO_ACTIVO',
    detalles JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA: TICKETS Y TIRAJE EN TAQUILLA / POS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets_taquilla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    draw_number VARCHAR(50) NOT NULL,
    modality_id VARCHAR(30) NOT NULL CHECK (modality_id IN ('triples', 'animalitos')),
    modality_name VARCHAR(100) NOT NULL,
    multiplier NUMERIC(10,2) NOT NULL,
    unit_bet_amount NUMERIC(18,2) DEFAULT 0,
    total_facial NUMERIC(18,2) NOT NULL,
    guaranteed_or_max_gross_prize NUMERIC(18,2) NOT NULL,
    guaranteed_or_max_igf16 NUMERIC(18,2) NOT NULL,
    guaranteed_or_max_net_prize NUMERIC(18,2) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) DEFAULT 'EMITIDO_EN_CAJA',
    is_full_tiraje BOOLEAN DEFAULT FALSE,
    tiraje_option_count INT DEFAULT 1,
    plays_payload JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA: LIQUIDACIONES FISCALES Y PARAFISCALES POR TICKET O LOTE
-- ============================================================================
CREATE TABLE IF NOT EXISTS liquidaciones_fiscales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) REFERENCES tickets_taquilla(ticket_number) ON DELETE CASCADE,
    total_facial NUMERIC(18,2) NOT NULL,
    premios_brutos NUMERIC(18,2) NOT NULL,
    premios_netos_efectivo NUMERIC(18,2) NOT NULL,
    ggr_neto NUMERIC(18,2) NOT NULL,
    -- Nivel 1: Taquilla
    taquilla_comision_bruta NUMERIC(18,2) NOT NULL,
    taquilla_iae_2_5 NUMERIC(18,2) NOT NULL,
    taquilla_margen_neto NUMERIC(18,2) NOT NULL,
    -- Nivel 2: Comercializadora
    comercializadora_spread_bruto NUMERIC(18,2) NOT NULL,
    comercializadora_iae_2_5 NUMERIC(18,2) NOT NULL,
    comercializadora_comision_final NUMERIC(18,2) NOT NULL,
    -- Tributos de Ente Público
    seniat_juegos_10_ggr NUMERIC(18,2) NOT NULL,
    seniat_igf_16_premios NUMERIC(18,2) NOT NULL,
    iobpas_canon_beneficencia NUMERIC(18,2) NOT NULL,
    alcaldias_iae_total NUMERIC(18,2) NOT NULL,
    -- Nivel 3: Operadora (0% IAE por Prohibición Constitucional)
    operadora_iae_municipal NUMERIC(18,2) DEFAULT 0.00,
    operadora_net_win_50 NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: HISTÓRICO DE PROYECCIONES MULTI-ACTOR Y ESCENARIOS ESCALABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS proyecciones_multi_actor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_escenario VARCHAR(150) NOT NULL,
    num_taquillas INT NOT NULL,
    num_comercializadoras INT NOT NULL,
    num_operadoras INT NOT NULL,
    num_sistemas_it INT NOT NULL,
    daily_sales_per_taquilla NUMERIC(18,2) NOT NULL,
    time_horizon_days INT NOT NULL,
    venta_total_proyectada NUMERIC(18,2) NOT NULL,
    ggr_total NUMERIC(18,2) NOT NULL,
    recaudacion_seniat_10_ggr NUMERIC(18,2) NOT NULL,
    retencion_seniat_16_igf NUMERIC(18,2) NOT NULL,
    recaudacion_iobpas_beneficencia NUMERIC(18,2) NOT NULL,
    recaudacion_alcaldias_iae NUMERIC(18,2) NOT NULL,
    tasas_conalot_total NUMERIC(18,2) NOT NULL,
    taquillas_ingreso_neto NUMERIC(18,2) NOT NULL,
    comercializadoras_ingreso_neto NUMERIC(18,2) NOT NULL,
    operadoras_ingreso_neto NUMERIC(18,2) NOT NULL,
    sistemas_it_ingreso_neto NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. SEMILLERO INICIAL (CENSO RUNLOT DE EJEMPLO)
-- ============================================================================
INSERT INTO runlot_censo (categoria, codigo_runlot, rif, razon_social, estado_licencia, detalles)
VALUES 
    ('iobpas', 'RUN-IOBPAS-001', 'G-20000303-0', 'Instituto Oficial de Beneficencia Pública y Asistencia Social del Edo. Zulia', 'VIGENTE_CONALOT', '{"hospitales_beneficiados": 12, "decreto": "Gaceta Oficial Edo. Zulia 4501"}'::jsonb),
    ('centros_apuestas', 'RUN-AG-0412', 'J-12345678-9', 'Centro de Apuestas La Favorita C.A.', 'HOMOLOGADO_ACTIVO', '{"municipio": "Maracaibo", "alcaldia_cuenta": "0102-MUNICIPAL-29", "kioscos_activos": 4}'::jsonb),
    ('comercializadoras', 'RUN-COM-0021', 'J-98765432-1', 'Loterías del Sur Comercializadora C.A.', 'HOMOLOGADO_ACTIVO', '{"red_agencias": 120, "zona": "Occidente"}'::jsonb),
    ('sistemas_informaticos', 'RUN-SYS-009', 'J-40998877-2', 'CDAPUESTAS / RUNLOT Engine v4.2', 'CERTIFICADO_ISO27001', '{"hash_core": "SHA-256-HMAC", "servidor_scfd": "api.cdapuestas.gob.ve"}'::jsonb),
    ('responsables_informaticos', 'RUN-IT-0045', 'V-18765432', 'Ing. Auditor de Seguridad y Custodia Criptográfica', 'HABILITADO_SCFD', '{"firma_electronica": "Firma Certificada SUSCERTE N° 8812"}'::jsonb),
    ('operadoras', 'RUN-OP-0089', 'J-31415926-5', 'Lotería Oficial del Zulia Operadora C.A.', 'CONCESIÓN_OFICIAL', '{"fianza_bancaria": "Bs. 5.000.000,00", "plazo_anios": 5}'::jsonb),
    ('juegos', 'RUN-JG-001', 'G-20000303-0', 'Sorteos de Triples Tradicionales y Figuras Animalitos', 'AUTORIZADO', '{"modalidades": ["Triples 600x", "Animalitos 30x"]}'::jsonb)
ON CONFLICT (codigo_runlot) DO NOTHING;

-- Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE runlot_censo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_taquilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones_multi_actor ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura anónima para el simulador
CREATE POLICY "Permitir lectura publica runlot_censo" ON runlot_censo FOR SELECT USING (true);
CREATE POLICY "Permitir insercion runlot_censo" ON runlot_censo FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura publica tickets_taquilla" ON tickets_taquilla FOR SELECT USING (true);
CREATE POLICY "Permitir insercion tickets_taquilla" ON tickets_taquilla FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura publica liquidaciones_fiscales" ON liquidaciones_fiscales FOR SELECT USING (true);
CREATE POLICY "Permitir insercion liquidaciones_fiscales" ON liquidaciones_fiscales FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura publica proyecciones_multi_actor" ON proyecciones_multi_actor FOR SELECT USING (true);
CREATE POLICY "Permitir insercion proyecciones_multi_actor" ON proyecciones_multi_actor FOR INSERT WITH CHECK (true);

