import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GuinéeGo — Vos colis, notre priorité | Closing, Stockage & Livraison à Conakry",
  description:
    "GuinéeGo : Votre partenaire logistique de confiance en Guinée. Closing téléphonique sous 15 min, stockage offert à Conakry, et livraison express Cash On Delivery.",
  keywords:
    "GuinéeGo, Vos colis notre priorité, livraison Guinée, logistique e-commerce Conakry, closing Conakry, transport colis Conakry, Cash on delivery Guinée",
  icons: {
    icon: "/images/guineego_logo.jpeg",
    apple: "/images/guineego_logo.jpeg",
  },
};

import Providers from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased scroll-smooth`}>
      <head>
        <meta name="theme-color" content="#0d8f4f" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GuinéeGo" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-900 selection:bg-[#16a34a] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
