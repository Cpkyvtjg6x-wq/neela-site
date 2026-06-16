import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { projects } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/realisations", "/contact"].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
  }));

  const projectPages = projects.map((p) => ({
    url: `${SITE.url}/realisations/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...pages, ...projectPages];
}
