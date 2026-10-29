import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 5000 });
try {
  const result = await pool.query(`
    WITH src AS (
      SELECT source_table,legacy_id,payload,COALESCE(NULLIF(payload->>'Id',''),legacy_id) AS raw_id,
        COALESCE(NULLIF(payload->>'FullName',''),NULLIF(payload->>'DisplayName',''),NULLIF(payload->>'Name',''),NULLIF(trim(concat_ws(' ',NULLIF(payload->>'FirstName',''),NULLIF(payload->>'LastName',''))),''),NULLIF(payload->>'UserName',''),NULLIF(payload->>'Username',''),NULLIF(payload->>'Email','')) AS display_name,
        COALESCE(NULLIF(payload->>'PhoneNumber',''),NULLIF(payload->>'Mobile',''),NULLIF(payload->>'Phone',''),NULLIF(payload->>'CellPhone','')) AS phone,
        COALESCE(NULLIF(payload->>'Email',''),NULLIF(payload->>'EmailAddress','')) AS email_address,
        COALESCE(NULLIF(payload->>'UserName',''),NULLIF(payload->>'Username','')) AS username,
        COALESCE(NULLIF(payload->>'Roles',''),NULLIF(payload->>'Role',''),NULLIF(payload->>'UserType','')) AS role_text,
        COALESCE(payload->>'CreatedAt',payload->>'CreatedOn',payload->>'CreationDate',payload->>'RegisterDate',payload->>'RegistrationDate',payload->>'DateCreated',payload->>'CreateDate') AS raw_date
      FROM legacy_source_data WHERE lower(source_table) LIKE '%.dbo.aspnetusers'
    ), ranked AS (
      SELECT src.*,
        ROW_NUMBER() OVER (
          PARTITION BY CASE
            WHEN length(raw_id)=36 AND substring(raw_id from 9 for 1)='-' AND substring(raw_id from 14 for 1)='-' AND substring(raw_id from 19 for 1)='-' AND substring(raw_id from 24 for 1)='-' AND translate(replace(raw_id,'-',''),'0123456789abcdefABCDEF','')='' THEN lower(raw_id)
            ELSE source_table||':'||raw_id
          END
          ORDER BY CASE WHEN lower(source_table) LIKE '%vamcity_import%' THEN 0 ELSE 1 END,source_table,legacy_id
        ) AS source_rank
      FROM src WHERE raw_id IS NOT NULL AND raw_id<>''
    )
    INSERT INTO legacy_customers(legacy_id,name,mobile,email,registered_at,legacy_username,account_type,legacy_source_table)
    SELECT CASE WHEN length(raw_id)=36 AND substring(raw_id from 9 for 1)='-' AND substring(raw_id from 14 for 1)='-' AND substring(raw_id from 19 for 1)='-' AND substring(raw_id from 24 for 1)='-' AND translate(replace(raw_id,'-',''),'0123456789abcdefABCDEF','')='' THEN raw_id::uuid ELSE (substr(md5(source_table||':'||raw_id),1,8)||'-'||substr(md5(source_table||':'||raw_id),9,4)||'-'||substr(md5(source_table||':'||raw_id),13,4)||'-'||substr(md5(source_table||':'||raw_id),17,4)||'-'||substr(md5(source_table||':'||raw_id),21,12))::uuid END,
      COALESCE(display_name,''),COALESCE(phone,''),COALESCE(email_address,''),
      CASE WHEN left(raw_date,6)='/Date(' AND right(raw_date,2)=')/' THEN to_timestamp(regexp_replace(raw_date,'[^0-9-]','','g')::numeric/1000) WHEN raw_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN raw_date::timestamptz WHEN length(raw_date) IN (10,13) AND raw_date ~ '^[0-9]+' THEN to_timestamp(raw_date::numeric/CASE WHEN length(raw_date)=13 THEN 1000 ELSE 1 END) ELSE NULL END,
      COALESCE(username,''),CASE WHEN lower(COALESCE(role_text,'')) LIKE '%admin%' OR lower(COALESCE(role_text,'')) LIKE '%مدیر%' THEN 'کاربر مدیریتی منتقل‌شده' ELSE 'مشتری / کاربر منتقل‌شده' END,source_table
    FROM ranked WHERE source_rank=1
    ON CONFLICT(legacy_id) DO UPDATE SET name=COALESCE(NULLIF(EXCLUDED.name,''),legacy_customers.name),mobile=COALESCE(NULLIF(EXCLUDED.mobile,''),legacy_customers.mobile),email=COALESCE(NULLIF(EXCLUDED.email,''),legacy_customers.email),registered_at=COALESCE(EXCLUDED.registered_at,legacy_customers.registered_at),legacy_username=COALESCE(NULLIF(EXCLUDED.legacy_username,''),legacy_customers.legacy_username),account_type=COALESCE(NULLIF(EXCLUDED.account_type,''),legacy_customers.account_type),legacy_source_table=COALESCE(EXCLUDED.legacy_source_table,legacy_customers.legacy_source_table)`);
  await pool.query("ANALYZE legacy_customers");
  const count = await pool.query("SELECT COUNT(*)::int AS total FROM legacy_customers");
  console.log("LEGACY_CUSTOMER_BACKFILL_COMPLETE=1");
  console.log("LEGACY_CUSTOMERS_TOTAL=" + Number(count.rows[0]?.total || 0));
  console.log("LEGACY_CUSTOMER_UPSERT_ROWS=" + Number(result.rowCount || 0));
} catch (error) {
  console.error("LEGACY_CUSTOMER_BACKFILL_FAILED=" + String(error.code || error.name || "unknown"));
  process.exitCode = 1;
} finally {
  await pool.end();
}
