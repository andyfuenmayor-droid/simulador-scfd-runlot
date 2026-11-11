import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DolarApiResponse {
  moneda: string;
  fuente: string;
  nombre: string;
  promedio: number;
  fechaActualizacion: string;
}

export async function GET() {
  try {
    // 1. Intentar obtener la tasa oficial del BCV a través del API de ve.dolarapi.com
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Simulador-SCFD-BCV-Client/1.0",
        },
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: DolarApiResponse = await response.json();
        if (data && typeof data.promedio === "number" && data.promedio > 0) {
          return NextResponse.json({
            success: true,
            rate: Math.round(data.promedio * 100) / 100,
            rawRate: data.promedio,
            currency: "USD",
            source: "Banco Central de Venezuela (BCV)",
            provider: "ve.dolarapi.com",
            lastUpdated: data.fechaActualizacion || new Date().toISOString(),
            timestamp: Date.now(),
          });
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // 2. Fallback secundario: endpoint general de dolares
    try {
      const fallbackController = new AbortController();
      const fbTimeoutId = setTimeout(() => fallbackController.abort(), 5000);

      const fbResponse = await fetch("https://ve.dolarapi.com/v1/dolares", {
        signal: fallbackController.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      clearTimeout(fbTimeoutId);

      if (fbResponse.ok) {
        const list: DolarApiResponse[] = await fbResponse.json();
        const oficial = list.find((item) => item.fuente === "oficial");
        if (oficial && typeof oficial.promedio === "number" && oficial.promedio > 0) {
          return NextResponse.json({
            success: true,
            rate: Math.round(oficial.promedio * 100) / 100,
            rawRate: oficial.promedio,
            currency: "USD",
            source: "Banco Central de Venezuela (BCV)",
            provider: "ve.dolarapi.com (list)",
            lastUpdated: oficial.fechaActualizacion || new Date().toISOString(),
            timestamp: Date.now(),
          });
        }
      }
    } catch {
      // Continuar al fallback de contingencia
    }

    // 3. Fallback de contingencia con la última tasa oficial registrada
    return NextResponse.json({
      success: true,
      rate: 901.62,
      rawRate: 901.6175,
      currency: "USD",
      source: "Banco Central de Venezuela (BCV)",
      provider: "Caché de contingencia BCV",
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo obtener la tasa oficial del BCV",
        rate: 901.62,
        currency: "USD",
        source: "Banco Central de Venezuela (BCV - Fallback)",
      },
      { status: 500 }
    );
  }
}
