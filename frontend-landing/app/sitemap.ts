import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const home: MetadataRoute.Sitemap[number] = {
    url: `${base}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  };

  const product: MetadataRoute.Sitemap[number] = {
    url: `${base}/product`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  };

  const pricing: MetadataRoute.Sitemap[number] = {
    url: `${base}/pricing`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  };

  const solutions: MetadataRoute.Sitemap[number] = {
    url: `${base}/solutions`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  };

  const customers: MetadataRoute.Sitemap[number] = {
    url: `${base}/customers`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  };

  const blog: MetadataRoute.Sitemap[number] = {
    url: `${base}/blog`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  };

  const security: MetadataRoute.Sitemap[number] = {
    url: `${base}/security`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  };

  const contact: MetadataRoute.Sitemap[number] = {
    url: `${base}/contact`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.7,
  };

  const privacy: MetadataRoute.Sitemap[number] = {
    url: `${base}/legal/privacy`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  };

  const terms: MetadataRoute.Sitemap[number] = {
    url: `${base}/legal/terms`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  };

  return [
    home,
    product,
    pricing,
    solutions,
    customers,
    blog,
    security,
    contact,
    privacy,
    terms,
  ];
}
