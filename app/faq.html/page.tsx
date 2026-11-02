import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سؤالات متداول | دیجی‌بایل",
  description: "پاسخ پرسش‌های متداول درباره طرح‌های منتشرشده، محاسبه اقساط و پیگیری درخواست در دیجی‌بایل.",
  alternates: { canonical: "https://digebail.ir/faq.html" },
  openGraph: { type: "website", locale: "fa_IR", url: "https://digebail.ir/faq.html", title: "سؤالات متداول | دیجی‌بایل", description: "راهنمای مشاهده طرح‌ها و پیگیری درخواست در دیجی‌بایل." }
};

const questions = [
  ["چطور طرح‌های قابل استفاده را ببینم؟", "در صفحه طرح‌ها فقط طرح‌هایی نمایش داده می‌شوند که در سامانه فعال شده‌اند و اجازه نمایش عمومی دارند. برای هر طرح می‌توانید صفحه جزئیات آن را باز کنید."],
  ["آیا همه طرح‌های ثبت‌شده در سامانه عمومی هستند؟", "خیر. فقط طرح‌های فعال و منتشرشده در فهرست عمومی نمایش داده می‌شوند. اطلاعات داخلی یا طرح‌های غیرفعال در این فهرست قرار نمی‌گیرند."],
  ["مبلغ نمایش‌داده‌شده در محاسبه‌گر قطعی است؟", "خیر. محاسبه‌گر برای برآورد اولیه است. مبلغ قطعی، کارمزدها، شرایط و برنامه بازپرداخت باید بر اساس شرایط نهایی همان طرح و قرارداد مربوط تأیید شود."],
  ["برای ثبت یا پیگیری درخواست چه کار کنم؟", "برای استفاده از بخش‌های مربوط به درخواست، وارد حساب کاربری خود شوید. اطلاعات و وضعیت پرونده فقط در فضای حساب و پس از احراز هویت قابل مشاهده است."],
  ["چرا طرحی در فهرست نمی‌بینم؟", "ممکن است در حال حاضر طرحی با وضعیت فعال و مجوز انتشار عمومی وجود نداشته باشد. در این حالت، سامانه به‌جای نمایش اطلاعات آزمایشی یا ساختگی، فهرست خالی نشان می‌دهد."],
  ["آیا مشاهده طرح به معنی تأیید تسهیلات است؟", "خیر. مشاهده یا ثبت درخواست به‌تنهایی به معنی تأیید اعتبار یا تعهد به پرداخت نیست. تصمیم نهایی مطابق ضوابط و تأیید طرف‌های مسئول انجام می‌شود."]
];

export default function FAQPage() {
  return <main className="public-info" dir="rtl">
    <header><a className="brand" href="/">دیجی‌بایل<span>پی</span></a><nav><a href="/">صفحه اصلی</a><a href="/plans">طرح‌ها</a><a href="/login.html">ورود به حساب</a></nav></header>
    <section className="intro"><span>راهنمای استفاده</span><h1>سؤالات متداول</h1><p>پاسخ پرسش‌های رایج درباره مشاهده طرح‌ها، محاسبه اقساط و پیگیری درخواست‌ها.</p></section>
    <section className="questions">{questions.map(([q,a])=><article key={q}><h2>{q}</h2><p>{a}</p></article>)}</section>
    <footer><a href="/">دیجی‌بایل</a><span>اطلاعات هر طرح را پیش از ثبت درخواست بررسی کنید.</span><a href="/plans">مشاهده طرح‌ها ←</a></footer>
    <style>{`
      .public-info{min-height:100vh;background:#f7f8fb;color:#183449;font-family:Vazirmatn,Tahoma,sans-serif}
      .public-info header{height:76px;padding:0 clamp(18px,6vw,84px);display:flex;align-items:center;gap:36px;background:white;border-bottom:1px solid #e4ebef}
      .public-info .brand{font-weight:950;font-size:1.35rem;color:#123d55}.public-info .brand span{color:#0c8290}
      .public-info nav{display:flex;gap:24px;flex-wrap:wrap;color:#536d7c;font-size:.9rem;font-weight:700}
      .public-info .intro{padding:72px clamp(18px,10vw,150px) 38px;background:linear-gradient(120deg,#092f45,#10566a);color:white}
      .public-info .intro>span{color:#c9ef78;font-weight:800}.public-info h1{font-size:clamp(2rem,4vw,3.4rem);margin:12px 0}
      .public-info .intro p{color:#d7e8ed;line-height:2}
      .public-info .questions{max-width:1050px;margin:36px auto 70px;padding:0 18px;display:grid;gap:14px}
      .public-info article{padding:23px 26px;background:white;border:1px solid #e2eaee;border-radius:16px}
      .public-info article h2{font-size:1.05rem;margin:0 0 10px;color:#123d55}.public-info article p{margin:0;color:#526b79;line-height:2.1}
      .public-info footer{padding:25px clamp(18px,6vw,84px);display:flex;gap:20px;justify-content:space-between;flex-wrap:wrap;background:#092f45;color:#d9e9ed}
      @media(max-width:600px){.public-info header{height:auto;min-height:70px;flex-wrap:wrap;padding-block:12px;gap:10px}.public-info nav{width:100%;gap:16px}.public-info .intro{padding-top:48px}.public-info article{padding:18px}}
    `}</style>
  </main>;
}
