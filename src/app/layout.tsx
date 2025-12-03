import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import SWRegistration from "@/components/sw-registration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "El Puerto de Carola CRM",
  description: "Sistema de gestión de pedidos y reportes para El Puerto de Carola",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Nuevos enlaces y meta etiquetas del generador de favicons */}
        <link rel="icon" type="image/png" href="/icons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="El Puerto CRM" />
        <link rel="manifest" href="/icons/site.webmanifest" /> {/* Referencia al nuevo manifiesto */}
        {/* Fin de los nuevos enlaces y meta etiquetas */}
        {/* Tus enlaces de fuentes existentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SWRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
