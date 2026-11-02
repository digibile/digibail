import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ارتباط با دیجی‌بایل | راهنمای پیگیری",
  description: "راهنمای ورود امن و پیگیری درخواست‌های ثبت‌شده در حساب کاربری دیجی‌بایل.",
  alternates: { canonical: "https://digebail.ir/contact.html" },
  openGraph: { type: "website", locale: "fa_IR", url: "https://digebail.ir/contact.html", title: "ارتباط با دیجی‌بایل", description: "راهنمای پیگیری درخواست‌های ثبت‌شده در دیجی‌بایل." }
};

export default function ContactPage() {
  return <main className="contact-info" dir="rtl">
    <header><a className="brand" href="/">دیجی‌بایل<span>پی</span></a><nav><a href="/">صفحه اصلی</a><a href="/plans">طرح‌ها</a><a href="/faq.html">سؤالات متداول</a></nav></header>
    <section className="contact-hero"><span>مرکز راهنمایی کاربران</span><h1>ارتباط با دیجی‌بایل</h1><p>برای حفظ امنیت اطلاعات، پیگیری پرونده‌های شخصی فقط پس از ورود به حساب کاربری انجام می‌شود.</p></section>
    <section className="contact-card"><div><h2>پیگیری درخواست ثبت‌شده</h2><p>اگر قبلاً درخواستی ثبت کرده‌اید، وارد حساب خود شوید و وضعیت همان درخواست را بررسی کنید. اطلاعات پرونده و مدارک شما در صفحات عمومی نمایش داده نمی‌شوند.</p><a className="action" href="/login.html">ورود به حساب کاربری <b>←</b></a></div><div><h2>پیش از ثبت درخواست</h2><p>شرایط، مدارک و جزئیات هر طرح را در صفحه اختصاصی آن مطالعه کنید. برآورد محاسبه‌گر قطعی نیست و شرایط نهایی در فرایند رسمی طرح مشخص می‌شود.</p><a className="secondary" href="/plans">مشاهده طرح‌های منتشرشده</a></div></section>
    <p className="notice">در حال حاضر شماره تماس، نشانی دفتر یا نشانی ایمیل تأییدشده‌ای در اطلاعات عمومی قابل انتشار این وب‌سایت ثبت نشده است؛ برای جلوگیری از انتشار اطلاعات نادرست، اطلاعات تماس ساختگی درج نشده است.</p>
    <footer><a href="/">دیجی‌بایل</a><a href="/faq.html">سؤالات متداول</a><a href="/privacy.html">حریم خصوصی</a></footer>
    <style>{`
      .contact-info{min-height:100vh;background:#f5f8fa;color:#17394b;font-family:Vazirmatn,Tahoma,sans-serif}
      .contact-info header{height:76px;padding:0 clamp(18px,6vw,84px);display:flex;align-items:center;gap:36px;background:white;border-bottom:1px solid #e2eaee}
      .contact-info .brand{font-weight:950;font-size:1.35rem;color:#123d55}.contact-info .brand span{color:#0c8290}
      .contact-info nav{display:flex;gap:24px;flex-wrap:wrap;color:#536d7c;font-size:.9rem;font-weight:700}
      .contact-hero{padding:72px clamp(18px,10vw,150px);background:linear-gradient(120deg,#092f45,#10566a);color:white}
      .contact-hero span{color:#c9ef78;font-weight:800}.contact-hero h1{font-size:clamp(2rem,4vw,3.4rem);margin:12px 0}.contact-hero p{color:#d7e8ed;line-height:2;max-width:700px}
      .contact-card{max-width:1050px;margin:38px auto 20px;padding:0 18px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .contact-card>div{padding:28px;background:white;border:1px solid #e2eaee;border-radius:18px}.contact-card h2{margin:0 0 12px;font-size:1.2rem}
      .contact-card p{color:#526b79;line-height:2.1;min-height:105px}.contact-card a{display:inline-flex;margin-top:12px;padding:12px 17px;border-radius:11px;font-weight:800}
      .action{background:#0c586e;color:white}.secondary{border:1px solid #cddde3;color:#17485c}
      .notice{max-width:1014px;margin:18px auto 70px;padding:18px;background:#fff8e7;border:1px solid #f0dfb5;border-radius:14px;color:#715321;line-height:2}
      .contact-info footer{padding:25px clamp(18px,6vw,84px);display:flex;gap:24px;flex-wrap:wrap;background:#092f45;color:#d9e9ed}
      @media(max-width:650px){.contact-info header{height:auto;min-height:70px;flex-wrap:wrap;padding-block:12px;gap:10px}.contact-info nav{width:100%;gap:16px}.contact-hero{padding-top:48px}.contact-card{grid-template-columns:1fr}.contact-card p{min-height:0}.notice{margin-inline:18px}}
    `}</style>
  </main>;
}
