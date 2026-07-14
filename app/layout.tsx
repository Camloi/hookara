import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Fredoka, Dongle, Teko, Schoolbell } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dongle = Dongle({
  variable: "--font-dongle",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: "400",
});

const schoolbell = Schoolbell({
  variable: "--font-schoolbell",
  subsets: ["latin"],
  weight: "400",
});

const siteUrl = "https://hookara.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hookara — YouTube Crochet Tutorial → Written Pattern",
    template: "%s | Hookara",
  },
  description:
    "Transform any YouTube crochet tutorial into a structured written pattern with AI. Paste a video link, get materials, abbreviations, and step-by-step instructions with timestamps.",
  keywords: [
    "crochet pattern generator",
    "YouTube crochet tutorial",
    "crochet written pattern",
    "AI crochet",
    "tutorial to pattern",
    "crochet pattern from video",
    "pattern crochet gratuit",
    "tuto crochet YouTube",
    "générer pattern crochet",
    "crochet AI tool",
    "yarn craft",
    "amigurumi pattern",
  ],
  authors: [{ name: "Kamtah", url: "https://x.com/kamtahh" }],
  creator: "Kamtah",
  publisher: "Hookara",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Hookara",
    title: "Hookara — YouTube Crochet Tutorial → Written Pattern",
    description:
      "Transform any YouTube crochet tutorial into a structured written pattern with AI. Paste a video link, get your pattern instantly.",
    images: [
      {
        url: "/ogen.png",
        width: 1200,
        height: 630,
        alt: "Hookara — AI-powered crochet pattern generator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hookara — YouTube Crochet Tutorial → Written Pattern",
    description:
      "Transform any YouTube crochet tutorial into a structured written pattern with AI.",
    images: ["/ogen.png"],
    creator: "@kamtahh",
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "fr": siteUrl,
      "en": siteUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Hookara",
  url: siteUrl,
  description:
    "Transform YouTube crochet tutorials into structured written patterns using AI.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Kamtah",
    url: "https://x.com/kamtahh",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Est-ce que toutes les vidéos fonctionnent ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seules les vidéos disposant de sous-titres peuvent fournir des instructions.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est la différence entre terminologie FR et US ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: 'Les points de crochet ne portent pas les mêmes noms selon les pays (par exemple, une "single crochet" en US correspond à une "maille serrée" en FR). Vous choisissez la terminologie qui vous convient, et le pattern s\'adapte automatiquement.',
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionnent les timestamps ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chaque étape du pattern est reliée au moment exact de la vidéo où elle est expliquée. Un clic vous amène directement au bon passage si vous avez besoin de revoir un geste.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps prend la génération d'un pattern ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Généralement moins d'une minute, selon la longueur de la vidéo.",
      },
    },
    {
      "@type": "Question",
      name: "Mes données sont-elles stockées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non, nous ne stockons aucune donnée.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${teko.variable} ${schoolbell.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_5g2lwnSbJrd4B1gI67PaG"
          data-domain="hookara.com"
          strategy="afterInteractive"
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
