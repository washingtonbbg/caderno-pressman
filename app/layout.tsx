import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./study.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caderno Pressman — Engenharia de Software",
  description: "Questões comentadas, raio-X de alternativas e cards de memorização baseados em Pressman.",
  openGraph: {
    title: "Caderno Pressman",
    description: "Aprenda o conceito. Entenda a alternativa.",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "Caderno Pressman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caderno Pressman",
    description: "Aprenda o conceito. Entenda a alternativa.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
