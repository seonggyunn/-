import { writeFileSync } from "node:fs";
import { schema, securitySql } from "../src/server/db";
writeFileSync("supabase/migrations/202610290001_operations.sql", schema);
writeFileSync(
  "supabase/migrations/202610290002_private_access.sql",
  securitySql,
);
console.log("SQL migrations exported");
