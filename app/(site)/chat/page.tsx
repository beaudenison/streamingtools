import Link from "next/link";
import ChatCustomizer from "@/components/chat/ChatCustomizer";
import Faq from "@/components/Faq";
import { breadcrumb, faqPage, jsonLd, pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { chatOverlay } from "@/lib/tools";

export const metadata = pageMeta({
  title: chatOverlay.seoTitle,
  description: chatOverlay.description,
  path: "/chat",
  keywords: chatOverlay.keywords,
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: chatOverlay.name,
      description: chatOverlay.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires a browser. Used as an OBS or Streamlabs browser source.",
      url: `${site.url}/chat`,
      isAccessibleForFree: true,
      featureList: [
        "Twitch and Kick chat in one overlay",
        "OBS and Streamlabs browser source",
        "Type, badges, and filters",
        "No account",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: { "@id": `${site.url}/#beau` },
    },
    breadcrumb([
      { name: "Streaming Tools", path: "/" },
      { name: chatOverlay.name, path: "/chat" },
    ]),
    faqPage(chatOverlay.faqs),
  ],
};

export default function ChatPage() {
  return (
    <main className="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(appJsonLd) }}
      />
      <Link href="/" className="back">
        ← Tools
      </Link>

      <div className="tool-hero">
        <div className="tool-hero-top">
          <img
            className="tool-icon"
            src={chatOverlay.icon}
            alt=""
            width={64}
            height={64}
          />
          <div>
            <h1>{chatOverlay.name}</h1>
            <p className="lede">{chatOverlay.description}</p>
            <ul className="meta">
              <li>Twitch · Kick</li>
              <li>OBS · Streamlabs</li>
              <li>No account</li>
            </ul>
          </div>
        </div>
      </div>

      <ChatCustomizer />

      <div className="steps">
        {(chatOverlay.steps ?? []).map((step, i) => (
          <div key={step} className="step">
            <span className="step-n">0{i + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <Faq items={chatOverlay.faqs} />
    </main>
  );
}
