import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { RecordedPOSTicket } from "@/types/simulator";

let cachedClient: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";

export function getSupabaseConfig(): { url: string; key: string } {
  if (typeof window !== "undefined") {
    const localUrl = localStorage.getItem("CDAPUESTAS_SUPABASE_URL") || "";
    const localKey = localStorage.getItem("CDAPUESTAS_SUPABASE_KEY") || "";
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey };
    }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("CDAPUESTAS_SUPABASE_URL", url.trim());
    localStorage.setItem("CDAPUESTAS_SUPABASE_KEY", key.trim());
  }
  cachedClient = null;
  cachedUrl = "";
  cachedKey = "";
}

export function getSupabaseClient(urlParam?: string, keyParam?: string): SupabaseClient | null {
  const config = getSupabaseConfig();
  const url = urlParam || config.url;
  const key = keyParam || config.key;

  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error("Error inicializando cliente de Supabase:", err);
    return null;
  }
}

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; tableCount?: number }> {
  try {
    const client = createClient(url.trim(), key.trim());
    const { count, error } = await client
      .from("runlot_censo")
      .select("*", { count: "exact", head: true });

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return {
          success: true,
          message:
            "Conexión exitosa a Supabase, pero la tabla 'runlot_censo' aún no existe. Ejecuta el script SQL adjunto en el SQL Editor de Supabase.",
          tableCount: 0,
        };
      }
      return {
        success: false,
        message: `Error de autenticación o permisos en Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `¡Conexión verificada con éxito! Se encontraron ${count ?? 0} registros en la tabla 'runlot_censo'.`,
      tableCount: count || 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `No se pudo conectar a Supabase: ${msg}` };
  }
}

export async function syncPOSTicketsToSupabase(
  tickets: RecordedPOSTicket[],
  urlParam?: string,
  keyParam?: string
): Promise<{ success: boolean; inserted: number; message: string }> {
  const client = getSupabaseClient(urlParam, keyParam);
  if (!client) {
    return {
      success: false,
      inserted: 0,
      message: "No se han configurado las credenciales de Supabase (URL y Anon Key).",
    };
  }

  try {
    const records = tickets.map((t) => ({
      ticket_number: t.ticketNumber,
      draw_number: t.drawNumber,
      modality_id: t.modalityId,
      modality_name: t.modalityName,
      multiplier: t.multiplier,
      unit_bet_amount: t.unitBetAmount || 0,
      total_facial: t.totalFacial,
      guaranteed_or_max_gross_prize: t.guaranteedOrMaxGrossPrize,
      guaranteed_or_max_igf16: t.guaranteedOrMaxIgf16,
      guaranteed_or_max_net_prize: t.guaranteedOrMaxNetPrize,
      sha256_hash: t.sha256Hash,
      status: t.status,
      is_full_tiraje: t.isFullTiraje,
      tiraje_option_count: t.tirajeOptionCount,
      plays_payload: t.plays,
    }));

    const { error, count } = await client
      .from("tickets_taquilla")
      .upsert(records, { onConflict: "ticket_number", count: "exact" });

    if (error) {
      return {
        success: false,
        inserted: 0,
        message: `Error guardando tickets en Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      inserted: count || records.length,
      message: `Sincronizados ${records.length} tickets en la tabla 'tickets_taquilla' de Supabase.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, inserted: 0, message: `Fallo inesperado: ${msg}` };
  }
}

export async function saveProyeccionToSupabase(
  projectionData: {
    nombre_escenario: string;
    num_taquillas: number;
    num_comercializadoras: number;
    num_operadoras: number;
    num_sistemas_it: number;
    daily_sales_per_taquilla: number;
    time_horizon_days: number;
    venta_total_proyectada: number;
    ggr_total: number;
    recaudacion_seniat_10_ggr: number;
    retencion_seniat_16_igf: number;
    recaudacion_iobpas_beneficencia: number;
    recaudacion_alcaldias_iae: number;
    tasas_conalot_total: number;
    taquillas_ingreso_neto: number;
    comercializadoras_ingreso_neto: number;
    operadoras_ingreso_neto: number;
    sistemas_it_ingreso_neto: number;
  },
  urlParam?: string,
  keyParam?: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(urlParam, keyParam);
  if (!client) {
    return {
      success: false,
      message: "No se han configurado las credenciales de Supabase (URL y Anon Key).",
    };
  }

  try {
    const { error } = await client.from("proyecciones_multi_actor").insert([projectionData]);
    if (error) {
      return { success: false, message: `Error guardando proyección: ${error.message}` };
    }
    return { success: true, message: "Proyección guardada con éxito en la tabla 'proyecciones_multi_actor' de Supabase." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Fallo inesperado: ${msg}` };
  }
}
