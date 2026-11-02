import type { Metadata } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://digebail.ir").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "طرح‌های خرید اقساطی و تسهیلات | دیجی‌بایل",
  description: "مشاهده طرح‌های فعال خرید اقساطی، بررسی شرایط و مدارک و محاسبه شفاف مبلغ پیش‌پرداخت و اقساط در دیجی‌بایل.",
  alternates: { canonical: `${siteUrl}/plans` },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${siteUrl}/plans`,
    title: "طرح‌های خرید اقساطی و تسهیلات | دیجی‌بایل",
    description: "طرح‌های منتشرشده را مقایسه کنید و جزئیات هر طرح را ببینید."
  }
};

export default function PlansLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
