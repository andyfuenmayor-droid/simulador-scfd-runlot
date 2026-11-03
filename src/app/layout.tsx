import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador Ejecutivo SCFD / RUNLOT | Reforma Tributaria SENIAT - CONALOT",
  description:
    "Simulador Ejecutivo de Reforma Tributaria y Fiscalización Digital en Tiempo Real (SCFD / RUNLOT) — Transición Valor Facial Bruto vs. Modelo GGR (CIAT) y Operaciones por Cuenta de Terceros (Arts. 32 y 33 Providencia SNAT/2026/00093).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
