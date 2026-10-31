function replaceFunctionCalls(sql, name, render) {
  const pattern = new RegExp("\\b" + name + "\\s*\\(", "ig");
  let out = "", cursor = 0, match;
  while ((match = pattern.exec(sql))) {
    const open = sql.indexOf("(", match.index);
    let depth = 1, quote = null, i = open + 1;
    for (; i < sql.length; i++) {
      const ch = sql[i];
      if (quote) {
        if (ch === quote && sql[i - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "\`") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")" && --depth === 0) break;
    }
    if (i >= sql.length) break;
    out += sql.slice(cursor, match.index);
    out += render(sql.slice(open + 1, i));
    cursor = i + 1;
    pattern.lastIndex = cursor;
  }
  return out + sql.slice(cursor);
}

function rewriteFilteredCounts(sql) {
  const re = /COUNT\(\s*\*\s*\)\s+FILTER\s*\(\s*WHERE\s+/ig;
  let out = "", cursor = 0, match;
  while ((match = re.exec(sql))) {
    const start = re.lastIndex;
    let depth = 1, quote = null, i = start;
    for (; i < sql.length; i++) {
      const ch = sql[i];
      if (quote) {
        if (ch === quote && sql[i - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "\`") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")" && --depth === 0) break;
    }
    if (i >= sql.length) break;
    out += sql.slice(cursor, match.index);
    out += "SUM(CASE WHEN " + sql.slice(start, i) + " THEN 1 ELSE 0 END)";
    cursor = i + 1;
    re.lastIndex = cursor;
  }
  return out + sql.slice(cursor);
}

export function translateMariaSql(source) {
  let sql = String(source || "").trim();
  sql = sql.replace(/\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)\s*->>\s*'([^']+)'/g,
    (_, col, key) => "JSON_UNQUOTE(JSON_EXTRACT(" + col + ", '$." + key + "'))");

  for (let pass = 0; pass < 4 && /\bjsonb_typeof\s*\(/i.test(sql); pass++) {
    sql = replaceFunctionCalls(sql, "jsonb_typeof", arg => "LOWER(JSON_TYPE(" + arg + "))");
  }
  for (let pass = 0; pass < 4 && /\bjsonb_array_length\s*\(/i.test(sql); pass++) {
    sql = replaceFunctionCalls(sql, "jsonb_array_length", arg => "JSON_LENGTH(" + arg + ")");
  }
  for (let pass = 0; pass < 4 && /\bjson_agg\s*\(/i.test(sql); pass++) {
    sql = replaceFunctionCalls(sql, "json_agg", arg => "JSON_ARRAYAGG(" + arg + ")");
  }
  for (let pass = 0; pass < 4 && /\bjson_build_array\s*\(/i.test(sql); pass++) {
    sql = replaceFunctionCalls(sql, "json_build_array", arg => "JSON_ARRAY(" + arg + ")");
  }

  sql = sql.replace(/\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)::date\b/gi, "DATE($1)");
  sql = sql.replace(/\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)::text\b/gi, "CAST($1 AS CHAR)");
  sql = sql.replace(/::\s*(?:jsonb|json|boolean|bool|int|integer|bigint|smallint|numeric|uuid|timestamptz|timestamp(?: with time zone)?|double precision)\b/gi, "");
  sql = sql.replace(/EXTRACT\s*\(\s*EPOCH\s+FROM\s*\(([^()]+)-NOW\(\)\)\s*\)::int/gi, "TIMESTAMPDIFF(SECOND,NOW(),$1)");
  sql = sql.replace(/to_char\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s+AT TIME ZONE 'Asia\/Tehran'\s*,\s*'YYYY-MM-DD HH24:MI:SS\.US'\s*\)/gi,
    "DATE_FORMAT(CONVERT_TZ($1,'+00:00','+03:30'),'%Y-%m-%d %H:%i:%s.%f')");
  sql = sql.replace(/INTERVAL\s+'(\d+)\s+(seconds?|minutes?|hours?|days?|months?|years?)'/gi, (_, n, unit) =>
    "INTERVAL " + n + " " + unit.toUpperCase().replace(/S$/, ""));
  sql = sql.replace(/\bILIKE\b/gi, "LIKE");
  sql = sql.replace(/~\*/g, "REGEXP");
  sql = sql.replace(/\s~\s/g, " REGEXP ");
  sql = sql.replace(/\s+NULLS\s+LAST/gi, "");
  sql = sql.replace(/ON\s+CONFLICT(?:\s*\([^)]*\))?\s+DO\s+NOTHING/gi, "ON DUPLICATE KEY UPDATE id=id");
  sql = sql.replace(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+UPDATE\s+SET/gi, "ON DUPLICATE KEY UPDATE");
  sql = sql.replace(/EXCLUDED\.([A-Za-z_][A-Za-z0-9_]*)/gi, "VALUES($1)");
  return rewriteFilteredCounts(sql);
}

export function bindMariaParams(sql, values = []) {
  const ordered = [];
  const boundSql = String(sql).replace(/\$(\d+)/g, (_, n) => {
    const i = Number(n) - 1;
    if (!Number.isInteger(i) || i < 0 || i >= values.length) throw new Error("Invalid SQL parameter $" + n);
    ordered.push(values[i]);
    return "?";
  });
  return { sql: boundSql, values: ordered };
}

function splitReturning(sql) {
  const m = /\s+RETURNING\s+([\s\S]+)$/i.exec(sql);
  return m ? { sql: sql.slice(0, m.index).trim(), columns: m[1].trim() } : { sql, columns: null };
}

function lookupAfterWrite(table, originalSql, values, result) {
  const op = originalSql.trim().split(/\s+/, 1)[0].toUpperCase();
  if (op === "DELETE") {
    const m = /WHERE\s+(?:[A-Za-z_][\w]*\.)?id\s*=\s*\$(\d+)/i.exec(originalSql);
    const id = m ? values[Number(m[1]) - 1] : null;
    return id == null ? [] : [{ id }];
  }
  if (op === "UPDATE") {
    const m = /WHERE\s+(?:[A-Za-z_][\w]*\.)?id\s*=\s*\$(\d+)/i.exec(originalSql);
    const id = m ? values[Number(m[1]) - 1] : null;
    return id == null ? null : { key: "id", value: id };
  }
  if (op === "INSERT") {
    if (Number(result.insertId) > 0) return { key: "id", value: result.insertId };
    if (table === "beta_inquiries" || table === "loan_products" || table === "customer_documents" || table === "customer_contracts") {
      return { key: "id", value: values[0] };
    }
  }
  return null;
}

async function run(connection, sql, values = []) {
  const original = String(sql || "");
  const ret = splitReturning(original);
  const tableMatch = /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(ret.sql);
  const table = tableMatch ? tableMatch[1] : "";
  const bound = bindMariaParams(translateMariaSql(ret.sql), Array.isArray(values) ? values : []);
  const [result] = await connection.query(bound.sql, bound.values);
  if (Array.isArray(result)) return { rows: result, rowCount: result.length, command: "SELECT" };
  const rowCount = Number(result.affectedRows || 0);
  if (!ret.columns) return { rows: [], rowCount, insertId: result.insertId || 0 };
  const lookup = lookupAfterWrite(table, original, Array.isArray(values) ? values : [], result);
  if (Array.isArray(lookup)) return { rows: lookup, rowCount, insertId: result.insertId || 0 };
  if (lookup && rowCount > 0) {
    const tick = String.fromCharCode(96);
    const safeTable = table.split(tick).join(tick + tick);
    const safeKey = lookup.key.split(tick).join(tick + tick);
    const [rows] = await connection.query("SELECT " + ret.columns + " FROM " + tick + safeTable + tick + " WHERE " + tick + safeKey + tick + "=? LIMIT 1", [lookup.value]);
    return { rows, rowCount, insertId: result.insertId || 0 };
  }
  return { rows: [], rowCount, insertId: result.insertId || 0 };
}

export function createMariaCompatPool(rawPool) {
  return {
    query(sql, values = []) { return run(rawPool, sql, values); },
    async connect() {
      const conn = await rawPool.getConnection();
      return {
        query(sql, values = []) { return run(conn, sql, values); },
        release() { conn.release(); }
      };
    },
    end() { return rawPool.end(); }
  };
}
