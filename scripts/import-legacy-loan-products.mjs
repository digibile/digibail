// IMPORT_LEGACY_LOAN_PRODUCTS_V3: direct, resumable, single-row database import.
// Digibail must not import loan definitions from the separate VamCity project.
import crypto from "node:crypto";
import pg from "pg";
console.log("LEGACY_LOAN_IMPORT_SKIPPED=separate_project_data_not_allowed_in_digibail");
process.exit(0);
