import type { MetadataRoute } from "next";

type PublicPlan = { id?: string };
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://digebail.ir").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/plans`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/faq.html`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact.html`, lastModified: now, changeFrequency: "monthly", priority: 0.4 }
  ];

  try {
    const response = await fetch(`${siteUrl}/api/v1/loan-products`, { next: { revalidate: 300 } });
    if (response.ok) {
      const payload = await response.json();
      const plans: PublicPlan[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      for (const plan of plans) {
        if (typeof plan.id === "string" && plan.id.trim()) {
          entries.push({
            url: `${siteUrl}/plans/${encodeURIComponent(plan.id)}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.8
          });
        }
      }
    }
  } catch {
    // Keep the stable public URLs available if the data service is temporarily offline.
  }

  return entries;
}
