import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://digebail.ir").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/plans", "/plans/"],
        disallow: ["/api/", "/admin", "/admin/", "/management-panel.html", "/profile.html", "/panel.html", "/login.html", "/register.html", "/my/", "/customers.html", "/agents.html", "/loan-requests.html", "/documents.html", "/contracts.html"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
