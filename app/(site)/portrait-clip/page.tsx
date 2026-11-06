import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/Faq";
import { breadcrumb, faqPage, jsonLd, pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { portraitClip } from "@/lib/tools";

export const metadata: Metadata = pageMeta({
  title: portraitClip.seoTitle,
  description: portraitClip.description,
  path: "/portrait-clip",
  keywords: portraitClip.keywords,
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: portraitClip.name,
      description: portraitClip.description,
      applicationCategory: "MultimediaApplication",
      applicationSubCategory: "Video editing",
      operatingSystem: "Windows 10",
      softwareVersion: portraitClip.version,
      url: `${site.url}/portrait-clip`,
      image: `${site.url}/icons/portrait-clip.png`,
      downloadUrl: portraitClip.download,
      isAccessibleForFree: true,
      featureList: [
        "Imports MP4, MOV, MKV, WEBM, and AVI from OBS or Streamlabs",
        "Facecam on top of a vertical frame, gameplay underneath",
        "Zoom instead of stretch",
        "Local compile at 720p or 1080p, 30 or 60 fps",
        "No account and no watermark",
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
      { name: portraitClip.name, path: "/portrait-clip" },
    ]),
    faqPage(portraitClip.faqs),
  ],
};

export default function PortraitClipPage() {
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
            src={portraitClip.icon}
            alt=""
            width={64}
            height={64}
          />
          <div>
            <h1>{portraitClip.name}</h1>
            <p className="lede">{portraitClip.description}</p>
            <ul className="meta">
              <li>{portraitClip.platform}</li>
              <li>OBS · Streamlabs</li>
              <li>v{portraitClip.version}</li>
              <li>Local · no account · no watermark</li>
            </ul>
          </div>
        </div>

        <div className="actions">
          <a
            className="btn"
            href={portraitClip.download}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download {portraitClip.version}
          </a>
          <p className="hint">
            Windows may warn that the app is unsigned. Choose More info, then Run
            anyway. Running this setup replaces an older Portrait Clip. Your clips
            stay on this PC.
          </p>
        </div>
      </div>

      <section className="notes">
        <h2>What’s new in {portraitClip.version}</h2>
        <ul>
          {(portraitClip.notes ?? []).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <div className="steps">
        {(portraitClip.steps ?? []).map((step, i) => (
          <div key={step} className="step">
            <span className="step-n">0{i + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <Faq items={portraitClip.faqs} />
    </main>
  );
}
