import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./study.css";
import "./sema-plan.css";
import "./library.css";
import "./uml.css";
import "./uml-cards.css";
import "./patterns.css";
import "./recursion.css";
import "./sorting.css";
import "./factorial.css";
import "./database.css";
import "./oop.css";
import "./tree.css";
import "./poly.css";
import "./graph.css";
import "./conditionals.css";
import "./operators.css";
import "./exam-notebooks.css";
import "./new-library-tones.css";
import "./library-workspace.css";
import "./learning-workspace.css";
import "./review.css";
import StudyShortcut from './components/StudyShortcut';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadernos de Estudo — Engenharia de Software e UML",
  description: "Questões comentadas e estudo guiado baseados em Pressman e Guedes.",
  openGraph: {
    title: "Cadernos de Estudo",
    description: "Do livro à questão. Do erro ao conceito.",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "Cadernos de Estudo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadernos de Estudo",
    description: "Do livro à questão. Do erro ao conceito.",
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
        <StudyShortcut/>
      </body>
    </html>
  );
}
