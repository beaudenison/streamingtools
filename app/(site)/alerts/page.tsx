import Link from "next/link";
import AlertsCustomizer from "@/components/alerts/AlertsCustomizer";
import Faq from "@/components/Faq";
import { breadcrumb, faqPage, jsonLd, pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { alerts } from "@/lib/tools";

export const metadata = pageMeta({
  title: alerts.seoTitle,
  description: alerts.description,
  path: "/alerts",
  keywords: alerts.keywords,
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: alerts.name,
      description: alerts.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires a browser. Used as an OBS or Streamlabs browser source.",
      url: `${site.url}/alerts`,
      isAccessibleForFree: true,
      featureList: [
        "Twitch follows, subs, raids, and cheers",
        "Kick follows, subs, gifts, and KICKs",
        "OBS and Streamlabs browser source",
        "Saved look",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${site.url}/#beau` },
    },
    breadcrumb([
      { name: "Streaming Tools", path: "/" },
      { name: alerts.name, path: "/alerts" },
    ]),
    faqPage(alerts.faqs),
  ],
};

export default function AlertsPage() {
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
          <img className="tool-icon" src={alerts.icon} alt="" width={64} height={64} />
          <div>
            <h1>{alerts.name}</h1>
            <p className="lede">{alerts.description}</p>
            <ul className="meta">
              <li>Twitch · Kick</li>
              <li>OBS · Streamlabs</li>
              <li>Sign in</li>
            </ul>
          </div>
        </div>
      </div>
      <AlertsCustomizer />
      <div className="steps">
        {(alerts.steps ?? []).map((step, i) => (
          <div key={step} className="step">
            <span className="step-n">0{i + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
      <Faq items={alerts.faqs} />
    </main>
  );
}
