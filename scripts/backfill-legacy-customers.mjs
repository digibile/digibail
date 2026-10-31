// VamCity legacy backfill is intentionally disabled in the Digibail repository.
// The source database and its records belong to a separate project and must never
// be imported into Digibail. Keep this guard before any database connection.
console.log("VAMCITY_BACKFILL_BLOCKED=separate_project_data_not_allowed_in_digibail");
process.exit(78);
