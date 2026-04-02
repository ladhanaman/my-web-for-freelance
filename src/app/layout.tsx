import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: [
    {
      path: "./fonts/geist-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const geistMono = localFont({
  src: [
    {
      path: "./fonts/geist-mono-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  adjustFontFallback: "Arial",
});

const fraunces = localFont({
  src: [
    {
      path: "./fonts/fraunces-latin.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const pressStart = localFont({
  src: [
    {
      path: "./fonts/press-start-2p-latin.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-press-start",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Let's Talk About Your Project",
  description: "Tell us what you're building and we'll show you how AI can accelerate it.",
};

const INITIAL_SCROLL_RESET_SCRIPT = `
  (() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      const isReload =
        performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';

      if (isReload) {
        // On reload: strip any hash and return to the top of the page
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        window.scrollTo(0, 0);
      } else if (!window.location.hash) {
        window.scrollTo(0, 0);
      }
    } catch {}
  })();
`;

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
      <head>
        <Script id="scroll-reset" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: INITIAL_SCROLL_RESET_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights sampleRate={0.5} />
      </body>
    </html>
  );
}
