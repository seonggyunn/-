import "./env";
import { DatabaseSync } from "node:sqlite";
import { Pool, PoolClient } from "pg";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export type Row = Record<string, any>;
export interface SQL {
  all(sql: string, params?: any[]): Promise<Row[]>;
  run(sql: string, params?: any[]): Promise<Row[]>;
}
const schema = `
CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','operator','customer')),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS businesses(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),name TEXT NOT NULL,industry TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),business_id TEXT NOT NULL REFERENCES businesses(id),contact TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',naver_url TEXT NOT NULL DEFAULT '',google_url TEXT NOT NULL DEFAULT '',website TEXT NOT NULL DEFAULT '',services TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',internal_notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'NEW',assigned_to TEXT REFERENCES users(id),due_at TEXT,submission_hash TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(org_id,submission_hash));
CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id),business_id TEXT NOT NULL REFERENCES businesses(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS service_packages(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),name TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>=0),billing TEXT NOT NULL CHECK(billing IN ('monthly','once')),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),client_id TEXT NOT NULL REFERENCES clients(id),package_id TEXT NOT NULL REFERENCES service_packages(id),amount INTEGER NOT NULL CHECK(amount>=0),status TEXT NOT NULL CHECK(status IN ('PROPOSED','ACTIVE','CANCELLED')),payment_status TEXT NOT NULL DEFAULT 'UNCONFIRMED' CHECK(payment_status IN ('UNCONFIRMED','CONFIRMED')),billing TEXT NOT NULL CHECK(billing IN ('monthly','once')),start_at TEXT NOT NULL,next_due TEXT NOT NULL,contract_reference TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT REFERENCES leads(id),title TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'NEW',assigned_to TEXT REFERENCES users(id),due_at TEXT,kind TEXT NOT NULL DEFAULT 'AUDIT',dedupe_key TEXT UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS business_profiles(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),business_id TEXT NOT NULL REFERENCES businesses(id),platform TEXT NOT NULL,url TEXT NOT NULL DEFAULT '',verification TEXT NOT NULL DEFAULT 'UNAVAILABLE',last_verified_at TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audits(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL REFERENCES leads(id),operator_id TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_items(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),audit_id TEXT NOT NULL REFERENCES audits(id),field TEXT NOT NULL,value TEXT NOT NULL DEFAULT '',status TEXT NOT NULL CHECK(status IN ('VERIFIED','POSSIBLE_ISSUE','MISSING','CUSTOMER_CONFIRMATION_REQUIRED','UNAVAILABLE')),source_url TEXT NOT NULL DEFAULT '',evidence TEXT NOT NULL DEFAULT '',verified_at TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS proposed_changes(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL REFERENCES leads(id),platform TEXT NOT NULL CHECK(platform IN ('naver','google')),field TEXT NOT NULL,old_value TEXT NOT NULL,proposed_value TEXT NOT NULL,reason TEXT NOT NULL,evidence TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'AWAITING_APPROVAL',execution_status TEXT NOT NULL DEFAULT 'NOT_EXECUTED',execution_evidence TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),change_id TEXT NOT NULL REFERENCES proposed_changes(id),authorized_person TEXT NOT NULL,authority_evidence TEXT NOT NULL,consent_version TEXT NOT NULL,actor_id TEXT NOT NULL REFERENCES users(id),approved_at TEXT NOT NULL,revoked_at TEXT);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL REFERENCES leads(id),version INTEGER NOT NULL,content TEXT NOT NULL,created_by TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL,UNIQUE(lead_id,version));
CREATE TABLE IF NOT EXISTS report_files(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),report_id TEXT NOT NULL REFERENCES reports(id),filename TEXT NOT NULL,sha256 TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT REFERENCES leads(id),kind TEXT NOT NULL,recipient TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('PREVIEW','PENDING','SENDING','ACCEPTED','FAILED','UNKNOWN')),dedupe_key TEXT NOT NULL UNIQUE,provider_id TEXT,attempts INTEGER NOT NULL DEFAULT 0,error TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activity_logs(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),entity_id TEXT NOT NULL,actor_id TEXT NOT NULL,action TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS consent_records(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL REFERENCES leads(id),purpose TEXT NOT NULL,granted INTEGER NOT NULL CHECK(granted IN (0,1)),version TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS private_files(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),lead_id TEXT NOT NULL REFERENCES leads(id),filename TEXT NOT NULL,content_type TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),kind TEXT NOT NULL,entity_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING',attempts INTEGER NOT NULL DEFAULT 0,error TEXT NOT NULL DEFAULT '',dedupe_key TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS one_pdf_per_report ON report_files(report_id);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,window_start BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS leads_org_status ON leads(org_id,status);
CREATE INDEX IF NOT EXISTS tasks_org_due ON tasks(org_id,due_at);
CREATE INDEX IF NOT EXISTS logs_org_entity ON activity_logs(org_id,entity_id,created_at);
CREATE INDEX IF NOT EXISTS notices_state ON notifications(org_id,state);
`;
export const securitySql =
  schema
    .match(/CREATE TABLE IF NOT EXISTS (\w+)/g)!
    .map((t) => {
      const name = t.split(" ").at(-1);
      return `ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY; DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.${name} FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.${name} FROM authenticated; END IF; END $$;`;
    })
    .join("\n") +
  `\nCREATE OR REPLACE FUNCTION public.prevent_activity_log_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'activity history is immutable'; END; $$; DROP TRIGGER IF EXISTS activity_log_immutable ON public.activity_logs; CREATE TRIGGER activity_log_immutable BEFORE UPDATE OR DELETE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_activity_log_mutation();`;
let sqlite: DatabaseSync | undefined;
let pool: Pool | undefined;
let ready: Promise<void> | undefined;
let gate = Promise.resolve();
function sqliteDb() {
  if (!sqlite) {
    const p = process.env.LOCAL_DB_PATH || ".data/operations.sqlite";
    mkdirSync(dirname(p), { recursive: true, mode: 0o700 });
    sqlite = new DatabaseSync(p);
    sqlite.exec(
      "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
    );
  }
  return sqlite;
}
const pgSql = (s: string) => {
  let n = 0;
  return s.replace(/\?/g, () => "$" + ++n);
};
function scoped(client?: PoolClient): SQL {
  return {
    all: async (s, p = []) => {
      if (process.env.DATABASE_URL) {
        pool ||= new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 5,
        });
        return (await (client || pool).query(pgSql(s), p)).rows;
      }
      return sqliteDb()
        .prepare(s)
        .all(...p) as Row[];
    },
    run: async (s, p = []) => {
      if (process.env.DATABASE_URL) {
        pool ||= new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 5,
        });
        return (await (client || pool).query(pgSql(s), p)).rows;
      }
      if (/\bRETURNING\b/i.test(s))
        return sqliteDb()
          .prepare(s)
          .all(...p) as Row[];
      sqliteDb()
        .prepare(s)
        .run(...p);
      return [];
    },
  };
}
export const db = scoped();
export async function migrate() {
  ready ||= (async () => {
    if (process.env.DATABASE_URL) {
      pool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
      await pool.query(schema);
      await pool.query("ALTER TABLE rate_limits ALTER COLUMN window_start TYPE BIGINT");
      await pool.query(securitySql);
    } else {
      sqliteDb().exec(schema);
      sqliteDb().exec(
        "CREATE TRIGGER IF NOT EXISTS immutable_history_update BEFORE UPDATE ON activity_logs BEGIN SELECT RAISE(ABORT,'immutable history'); END; CREATE TRIGGER IF NOT EXISTS immutable_history_delete BEFORE DELETE ON activity_logs BEGIN SELECT RAISE(ABORT,'immutable history'); END;",
      );
    }
    await db.run(
      "INSERT INTO organizations(id,name,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING",
      ["agency", "한칸 운영실", new Date().toISOString()],
    );
  })();
  await ready;
}
export async function transaction<T>(fn: (q: SQL) => Promise<T>): Promise<T> {
  await migrate();
  if (process.env.DATABASE_URL) {
    pool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const result = await fn(scoped(c));
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  let unlock!: () => void;
  const previous = gate;
  gate = new Promise<void>((r) => (unlock = r));
  await previous;
  sqliteDb().exec("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    sqliteDb().exec("COMMIT");
    return result;
  } catch (e) {
    sqliteDb().exec("ROLLBACK");
    throw e;
  } finally {
    unlock();
  }
}
export { schema };
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
  if (sqlite) {
    sqlite.close();
    sqlite = undefined;
  }
}
