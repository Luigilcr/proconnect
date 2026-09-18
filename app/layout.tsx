/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://proconnect.app'),
  title: 'ProConnect — Tarjetas Digitales NFC & QR | Digital Corporate Cards',
  description:
    'Plataforma SaaS multi-tenant para crear, personalizar y gestionar tarjetas de presentación digitales inteligentes NFC con WhatsApp, vCard y catálogos multimedia.',
  icons: {
    icon: [
      { url: '/brand/logo.png', type: 'image/png' },
    ],
    apple: '/brand/logo.png',
  },
  openGraph: {
    title: 'ProConnect — Digital Corporate Cards',
    description: 'Tarjetas de presentación digitales NFC & QR para empresas B2B.',
    images: ['/brand/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
