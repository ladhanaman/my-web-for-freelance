import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import ScrollReset from "@/components/ScrollReset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  weight: ["700"],
  style:  ["normal"],
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "Let's Talk About Your Project",
  description: "Tell us what you're building and we'll show you how AI can accelerate it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${fraunces.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollReset />
        {children}
      </body>
    </html>
  );
}
