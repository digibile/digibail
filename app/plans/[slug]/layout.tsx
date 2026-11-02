import type { Metadata } from "next";

type Plan = { id?: string; name?: string; title?: string; description?: string; minAmount?: number; maxAmount?: number };
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://digebail.ir").replace(/\/$/, "");
const apiBase = (process.env.LEGACY_API_BASE_URL || `http://127.0.0.1:${process.env.LEGACY_PORT || "1632"}`).replace(/\/$/, "");

async function getPlan(slug: string): Promise<Plan | null> {
  try {
    const response = await fetch(`${apiBase}/api/v1/loan-products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const plan = payload?.data || payload;
    return plan && typeof plan === "object" && plan.id ? plan as Plan : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getPlan(slug);
  if (!plan) {
    return {
      title: "طرح پیدا نشد | دیجی‌بایل",
      robots: { index: false, follow: false },
      alternates: { canonical: `${siteUrl}/plans/${encodeURIComponent(slug)}` }
    };
  }
  const title = `${plan.title || plan.name || "طرح خرید اقساطی"} | دیجی‌بایل`;
  const description = (plan.description || `جزئیات شرایط، مبلغ و اقساط ${plan.title || plan.name || "این طرح"} را در دیجی‌بایل بررسی کنید.`).slice(0, 300);
  const url = `${siteUrl}/plans/${encodeURIComponent(slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "fa_IR", url, title, description }
  };
}

export default function PlanDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
