import Link from "next/link";
import Glass from "@/components/Glass";
import { jsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { tools } from "@/lib/tools";

export const metadata = {
  alternates: { canonical: "/" },
};

const listJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Streaming tools",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.name,
    url: `${site.url}/${tool.slug}`,
    description: tool.description,
  })),
};

export default function HomePage() {
  return (
    <main className="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(listJsonLd) }}
      />
      <div className="home-intro">
        <h1>{site.name}</h1>
        <p className="lede">{site.tagline}</p>
      </div>
      <div className="tool-list">
        {tools.map((tool) => (
          <Glass className="tool-card" key={tool.slug}>
            <Link href={`/${tool.slug}`} className="tool-main">
              <img
                className="tool-icon"
                src={tool.icon}
                alt=""
                width={64}
                height={64}
              />
              <div className="tool-copy">
                <h2>{tool.name}</h2>
                <p>{tool.blurb}</p>
              </div>
            </Link>
            <a
              className="btn"
              href={tool.href}
              {...(tool.kind === "download"
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {tool.cta}
            </a>
          </Glass>
        ))}
      </div>
    </main>
  );
}
