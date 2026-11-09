import type { Metadata } from "next";
import "./globals.css";
import SecurityGuard from "@/components/SecurityGuard";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('scfd_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white"
      >
        <SecurityGuard>{children}</SecurityGuard>
      </body>
    </html>
  );
}
