import { readFileSync, writeFileSync } from "node:fs";

const sources = [
  { file: "database/mysql/schema-main.sql", prefix: "" },
  { file: "database/mysql/schema-bluvamdb.sql", prefix: "bluvamdb__" },
  { file: "database/mysql/schema-transfer.sql", prefix: "transferdb__" }
];

function transform(source, expectedCount) {
  let sql = readFileSync(source.file, "utf8");
  const tables = sql.split("\n")
    .filter(line => line.startsWith("CREATE TABLE \`"))
    .map(line => line.slice("CREATE TABLE \`".length, line.indexOf("\`", "CREATE TABLE \`".length)));
  if (tables.length !== expectedCount) {
    throw new Error(source.file + ": expected " + expectedCount + " tables, found " + tables.length);
  }
  for (const table of tables) {
    const target = source.prefix + table;
    const from = "\`" + table + "\`";
    const to = "\`" + target + "\`";
    for (const clause of ["CREATE TABLE ", "ALTER TABLE ", "REFERENCES "]) {
      sql = sql.split(clause + from).join(clause + to);
    }
  }
  sql = sql.replace(/(CONSTRAINT\s+\`)([^\`]+)(\`)/g,
    (_, before, name, after) => before + source.prefix + name + after);
  sql = sql.replace(/Target database: [^\r\n]+/g, "Target database: vamcitydigibilepay");
  return { sql, tables: tables.map(name => source.prefix + name) };
}

const parts = [
  transform(sources[0], 88),
  transform(sources[1], 56),
  transform(sources[2], 12)
];
const allTables = parts.flatMap(part => part.tables);
if (allTables.length !== 156 || new Set(allTables).size !== 156) {
  throw new Error("Expected 156 unique tables; found " + allTables.length);
}

const output = [
  "-- Unified VamCity DDL: three SQL Server sources in one MariaDB database.",
  "-- Generated from checked-in source schemas. DDL only; no source records included.",
  "CREATE DATABASE IF NOT EXISTS \`vamcitydigibilepay\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
  "USE \`vamcitydigibilepay\`;",
  "SET NAMES utf8mb4;",
  "SET FOREIGN_KEY_CHECKS=0;",
  ...parts.map(part => part.sql),
  "SET FOREIGN_KEY_CHECKS=1;"
].join("\n\n");

writeFileSync("database/mysql/vamcitydigibilepay.sql", output);
console.log(JSON.stringify({ database: "vamcitydigibilepay", tables: allTables.length, sources: [88, 56, 12] }));
