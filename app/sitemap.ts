import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const updated = new Date("2026-10-08");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/portrait-clip`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/chat`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/alerts`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: new Date("2026-11-11"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
