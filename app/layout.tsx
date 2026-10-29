import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "دیجی‌بایل | خرید اقساطی", description: "مقایسه طرح‌های خرید اقساطی و محاسبه شفاف مبلغ پرداختی", viewport: "width=device-width, initial-scale=1, viewport-fit=cover", other: { "digibail-deploy-version": "c92a8d54f06b1e73d9a4c2018b65f7a2d3e901bc" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}