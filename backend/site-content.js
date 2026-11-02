import { createPool } from "mysql2/promise";

const database = process.env.MARIADB_DATABASE || "digibail_vamcitydigibilepay";
const user = process.env.MARIADB_USER || "";
const password = process.env.MARIADB_PASSWORD || "";
if (!user || !password) throw new Error("MariaDB credentials are required for site content.");
const connection = process.env.MARIADB_HOST
  ? { host: process.env.MARIADB_HOST, port: Number(process.env.MARIADB_PORT || 3306) }
  : { socketPath: process.env.MARIADB_SOCKET || "/tmp/mysql.sock" };
const pool = createPool({ ...connection, user, password, database, waitForConnections:true, connectionLimit:3, queueLimit:20, charset:"utf8mb4", connectTimeout:8000, timezone:"Z" });

let schemaReady;
async function ensureSchema() {
  if (!schemaReady) schemaReady = (async () => {
    await pool.query("CREATE TABLE IF NOT EXISTS homepage_content (section_key VARCHAR(40) NOT NULL PRIMARY KEY,content JSON NOT NULL,updated_by BIGINT NULL,updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    await pool.query("CREATE TABLE IF NOT EXISTS newsletter_subscribers (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,email VARCHAR(190) NOT NULL UNIQUE,source VARCHAR(40) NOT NULL DEFAULT 'homepage',status VARCHAR(20) NOT NULL DEFAULT 'active',consent_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),KEY newsletter_active_created(status,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    await pool.query("CREATE TABLE IF NOT EXISTS blog_posts (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(180) NOT NULL UNIQUE,title VARCHAR(180) NOT NULL,excerpt VARCHAR(500) NOT NULL DEFAULT '',body LONGTEXT NOT NULL,cover_image TEXT NULL,status VARCHAR(20) NOT NULL DEFAULT 'draft',published_at DATETIME(6) NULL,created_by BIGINT NULL,updated_by BIGINT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),KEY blog_posts_public(status,published_at),KEY blog_posts_updated(updated_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  })().catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}
function send(res,status,value) { res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}); res.end(JSON.stringify(value)); }
async function readBody(req) {
  let raw="";
  for await (const chunk of req) { raw+=chunk; if(raw.length>300000) throw Object.assign(new Error("حجم درخواست بیش از حد مجاز است."),{status:413}); }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error("ساختار درخواست معتبر نیست."),{status:400}); }
}
function cleanText(value,max) { if(typeof value!=="string") return null; const v=value.replace(/\u0000/g,"").trim(); return v.length<=max?v:null; }
const sections=new Set(["hero","features","plans","partners","how","trust","faq","blog","newsletter","cta","footer"]);
const fields=new Set(["title","description","eyebrow","feature1Title","feature1Description","feature2Title","feature2Description","feature3Title","feature3Description","feature4Title","feature4Description","feature5Title","feature5Description"]);
async function audit(admin,action,details) {
  await pool.query("INSERT INTO audit_logs(user_id,event_type,details) VALUES(?,?,?)",[Number(admin.sub),action,JSON.stringify(details)]);
}
export async function handleSiteContent(req,res,url,admin) {
  const route=url.pathname;
  try { await ensureSchema(); } catch(e) { console.error("site_content_schema_error",e.code||e.message); return send(res,503,{message:"سرویس محتوای سایت موقتاً در دسترس نیست."}); }
  try {
    if(req.method==="GET"&&route==="/api/v1/site-content/homepage") {
      const [rows]=await pool.query("SELECT section_key,content FROM homepage_content ORDER BY section_key");
      return send(res,200,{data:Object.fromEntries(rows.map(r=>[r.section_key,typeof r.content==="string"?JSON.parse(r.content):r.content]))});
    }
    if(req.method==="POST"&&route==="/api/v1/newsletter/subscribe") {
      const b=await readBody(req),email=String(b.email||"").trim().toLowerCase();
      if(email.length>190||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res,400,{message:"نشانی ایمیل معتبر نیست."});
      const source=["homepage","blog","footer"].includes(String(b.source||""))?String(b.source):"homepage";
      await pool.query("INSERT INTO newsletter_subscribers(email,source,status,consent_at,updated_at) VALUES(?,?,'active',NOW(6),NOW(6)) ON DUPLICATE KEY UPDATE source=VALUES(source),status='active',consent_at=NOW(6),updated_at=NOW(6)",[email,source]);
      return send(res,200,{ok:true,message:"عضویت شما در خبرنامه ثبت شد."});
    }
    if(req.method==="GET"&&route==="/api/v1/blog/posts") {
      const limit=Math.min(12,Math.max(1,Number(url.searchParams.get("limit"))||3));
      const [rows]=await pool.query("SELECT id,slug,title,excerpt,cover_image AS coverImage,published_at AS publishedAt FROM blog_posts WHERE status='published' AND published_at<=NOW(6) ORDER BY published_at DESC,id DESC LIMIT ?",[limit]);
      return send(res,200,{data:rows});
    }
    if(req.method==="GET"&&route.startsWith("/api/v1/blog/posts/")) {
      const slug=decodeURIComponent(route.slice("/api/v1/blog/posts/".length));
      const [rows]=await pool.query("SELECT id,slug,title,excerpt,body,cover_image AS coverImage,published_at AS publishedAt FROM blog_posts WHERE slug=? AND status='published' AND published_at<=NOW(6) LIMIT 1",[slug]);
      return rows.length?send(res,200,{data:rows[0]}):send(res,404,{message:"مطلب پیدا نشد."});
    }
    if(route.startsWith("/api/v1/admin/site-content/")||route.startsWith("/api/v1/admin/blog/")) if(!admin) return send(res,403,{message:"دسترسی مدیر لازم است."});
    if(req.method==="PUT"&&route==="/api/v1/admin/site-content/homepage") {
      const b=await readBody(req),section=String(b.section||"");
      if(!sections.has(section)||!b.content||typeof b.content!=="object"||Array.isArray(b.content)) return send(res,400,{message:"بخش یا محتوای ارسالی معتبر نیست."});
      const clean={};
      for(const [k,v] of Object.entries(b.content)) { if(!fields.has(k)) return send(res,400,{message:"فیلد ارسالی مجاز نیست."}); const t=cleanText(v,1200); if(t===null) return send(res,400,{message:"متن باید حداکثر ۱۲۰۰ نویسه باشد."}); clean[k]=t; }
      if(!Object.keys(clean).length) return send(res,400,{message:"محتوایی برای ذخیره ارسال نشده است."});
      await pool.query("INSERT INTO homepage_content(section_key,content,updated_by,updated_at) VALUES(?,CAST(? AS JSON),?,NOW(6)) ON DUPLICATE KEY UPDATE content=JSON_MERGE_PATCH(homepage_content.content,VALUES(content)),updated_by=VALUES(updated_by),updated_at=NOW(6)",[section,JSON.stringify(clean),Number(admin.sub)]);
      const [rows]=await pool.query("SELECT section_key,content,updated_at FROM homepage_content WHERE section_key=? LIMIT 1",[section]);
      const saved=rows[0]; if(typeof saved.content==="string") saved.content=JSON.parse(saved.content);
      await audit(admin,"homepage.content.updated",{section,fields:Object.keys(clean)});
      return send(res,200,{ok:true,data:saved});
    }
    if(req.method==="GET"&&route==="/api/v1/admin/blog/posts") {
      const [rows]=await pool.query("SELECT id,slug,title,excerpt,status,published_at AS publishedAt,updated_at AS updatedAt FROM blog_posts ORDER BY updated_at DESC LIMIT 200");
      return send(res,200,{data:rows});
    }
    if(req.method==="POST"&&route==="/api/v1/admin/blog/posts") {
      const b=await readBody(req),title=cleanText(b.title,180),excerpt=cleanText(b.excerpt||"",500),body=cleanText(b.body||"",100000);
      const slug=String(b.slug||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,180),status=b.status==="published"?"published":"draft";
      if(!title||title.length<3||!excerpt||body===null||!slug) return send(res,400,{message:"عنوان، نشانی یا متن مطلب معتبر نیست."});
      const [result]=await pool.query("INSERT INTO blog_posts(slug,title,excerpt,body,status,published_at,created_by,updated_by) VALUES(?,?,?,?,?,IF(?='published',NOW(6),NULL),?,?)",[slug,title,excerpt,body,status,status,Number(admin.sub),Number(admin.sub)]);
      const [rows]=await pool.query("SELECT id,slug,title,excerpt,status,published_at AS publishedAt FROM blog_posts WHERE id=? LIMIT 1",[result.insertId]);
      await audit(admin,"blog.post.created",{postId:result.insertId,status}); return send(res,201,{data:rows[0]});
    }
    const idMatch=route.match(new RegExp("^/api/v1/admin/blog/posts/(\\\\d+)$"));
    if(idMatch&&req.method==="PUT") {
      const id=Number(idMatch[1]),b=await readBody(req),title=cleanText(b.title,180),excerpt=cleanText(b.excerpt||"",500),body=cleanText(b.body||"",100000),status=["draft","published","archived"].includes(b.status)?b.status:"draft";
      if(!title||title.length<3||!excerpt||body===null) return send(res,400,{message:"عنوان یا متن مطلب معتبر نیست."});
      const [result]=await pool.query("UPDATE blog_posts SET title=?,excerpt=?,body=?,status=?,published_at=IF(?='published',COALESCE(published_at,NOW(6)),NULL),updated_by=?,updated_at=NOW(6) WHERE id=?",[title,excerpt,body,status,status,Number(admin.sub),id]);
      if(!result.affectedRows) return send(res,404,{message:"مطلب پیدا نشد."});
      await audit(admin,"blog.post.updated",{postId:id,status}); const [rows]=await pool.query("SELECT id,slug,title,excerpt,status,published_at AS publishedAt FROM blog_posts WHERE id=? LIMIT 1",[id]);
      return send(res,200,{data:rows[0]});
    }
    if(idMatch&&req.method==="DELETE") {
      const id=Number(idMatch[1]),[result]=await pool.query("UPDATE blog_posts SET status='archived',updated_by=?,updated_at=NOW(6) WHERE id=?",[Number(admin.sub),id]);
      if(!result.affectedRows) return send(res,404,{message:"مطلب پیدا نشد."});
      await audit(admin,"blog.post.archived",{postId:id}); return send(res,200,{ok:true});
    }
    return false;
  } catch(e) {
    const status=Number(e.status)||500; if(status>=500) console.error("site_content_error",e.code||e.message);
    return send(res,status,{message:status===500?"خطای داخلی سرویس محتوا.":e.message});
  }
}
