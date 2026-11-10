import type { Metadata } from "next";
import "./globals.css";
import SecurityGuard from "@/components/SecurityGuard";

export const metadata: Metadata = {
  title: "Simulador Ejecutivo de Flujo Operativo | Modelo Matemático GGR",
  description:
    "Plataforma interactiva de simulación matemática, proyección financiera y arquitectura de red en tiempo real.",
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
