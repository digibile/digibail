import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://digebail.ir"), title: { default: "دیجی‌بایل | خرید اقساطی", template: "%s" }, description: "مشاهده طرح‌های منتشرشده خرید اقساطی، بررسی شرایط و محاسبه برآوردی اقساط در دیجی‌بایل.", alternates: { canonical: "/" }, openGraph: { type: "website", locale: "fa_IR", siteName: "دیجی‌بایل", title: "دیجی‌بایل | خرید اقساطی", description: "مشاهده طرح‌های منتشرشده خرید اقساطی و بررسی شرایط در دیجی‌بایل." }, viewport: "width=device-width, initial-scale=1, viewport-fit=cover", other: { "digibail-deploy-version": "digibail-premium-reference-20261029" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}