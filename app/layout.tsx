import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { jsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: "https://x.com/beaudenison" }],
  creator: site.author,
  publisher: site.name,
  keywords: [
    "streaming tools",
    "OBS",
    "Streamlabs",
    "Twitch",
    "Kick",
    "YouTube",
    "chat overlay",
    "vertical clips",
    "YouTube Shorts",
    "TikTok",
    "Reels",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitter,
    creator: site.twitter,
    title: site.title,
    description: site.description,
  },
  category: "technology",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: site.url,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#beau` },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#beau`,
      name: site.author,
      url: "https://x.com/beaudenison",
      sameAs: [
        "https://x.com/beaudenison",
        "https://t.me/beaudenison",
        "https://github.com/beaudenison",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
