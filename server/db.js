import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import initSqlJs from "sql.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "app.sqlite");
const SEED_FILE = path.join(__dirname, "data.json");

let dbInstance = null;
let SQL = null;

function toCandidate(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    position: row.position,
    aiScore: row.ai_score,
    matchPercentage: row.match_percentage,
    status: row.status,
    appliedDate: row.applied_date,
    resumeUrl: row.resume_url ?? undefined,
    resumeFileName: row.resume_original_name ?? undefined,
    skills: JSON.parse(row.skills_json || "[]"),
    experience: row.experience,
    education: row.education,
    location: row.location,
    strengths: JSON.parse(row.strengths_json || "[]"),
    weaknesses: JSON.parse(row.weaknesses_json || "[]"),
    aiInsights: row.ai_insights,
    notes: safeJsonArray(row.notes_json),
  };
}

function safeJsonArray(raw) {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toPosition(row) {
  return {
    id: String(row.id),
    title: row.title,
    department: row.department,
    openings: row.openings,
    candidatesApplied: row.candidates_applied,
    status: row.status,
    priority: row.priority,
    createdDate: row.created_date,
  };
}

async function persistDb() {
  const data = dbInstance.export();
  await fs.writeFile(DB_FILE, Buffer.from(data));
}

function run(sql, params = []) {
  dbInstance.run(sql, params);
}

function get(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const hasRow = stmt.step();
  const row = hasRow ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function getDb() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();
  try {
    const file = await fs.readFile(DB_FILE);
    dbInstance = new SQL.Database(file);
  } catch {
    dbInstance = new SQL.Database();
  }

  run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      position TEXT NOT NULL DEFAULT '',
      ai_score INTEGER NOT NULL DEFAULT 0,
      match_percentage INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      applied_date TEXT NOT NULL,
      resume_url TEXT,
      skills_json TEXT NOT NULL DEFAULT '[]',
      experience INTEGER NOT NULL DEFAULT 0,
      education TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      strengths_json TEXT NOT NULL DEFAULT '[]',
      weaknesses_json TEXT NOT NULL DEFAULT '[]',
      ai_insights TEXT NOT NULL DEFAULT ''
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      openings INTEGER NOT NULL DEFAULT 1,
      candidates_applied INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      priority TEXT NOT NULL DEFAULT 'medium',
      created_date TEXT NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS screenings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_description TEXT NOT NULL DEFAULT '',
      processed INTEGER NOT NULL DEFAULT 0,
      qualified INTEGER NOT NULL DEFAULT 0,
      avg_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  migrateCandidatesTable();

  const existingCandidates = get("SELECT COUNT(*) as count FROM candidates");
  if (!existingCandidates || !existingCandidates.count) {
    await seedFromJson();
    await persistDb();
  }

  return dbInstance;
}

function columnExists(table, column) {
  const rows = all(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

function migrateCandidatesTable() {
  if (!columnExists("candidates", "notes_json")) {
    run("ALTER TABLE candidates ADD COLUMN notes_json TEXT NOT NULL DEFAULT '[]'");
  }
  if (!columnExists("candidates", "resume_original_name")) {
    run("ALTER TABLE candidates ADD COLUMN resume_original_name TEXT");
  }
}

async function seedFromJson() {
  try {
    const raw = await fs.readFile(SEED_FILE, "utf8");
    const seed = JSON.parse(raw);
    const candidates = seed.candidates ?? [];
    const positions = seed.positions ?? [];

    for (const c of candidates) {
      run(
        `INSERT INTO candidates
        (name, email, phone, position, ai_score, match_percentage, status, applied_date, resume_url, resume_original_name, skills_json, experience, education, location, strengths_json, weaknesses_json, ai_insights, notes_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.name ?? "Candidate",
          c.email ?? "",
          c.phone ?? "",
          c.position ?? "",
          c.aiScore ?? 0,
          c.matchPercentage ?? 0,
          c.status ?? "pending",
          c.appliedDate ?? new Date().toISOString().slice(0, 10),
          c.resumeUrl ?? null,
          c.resumeFileName ?? null,
          JSON.stringify(c.skills ?? []),
          c.experience ?? 0,
          c.education ?? "",
          c.location ?? "",
          JSON.stringify(c.strengths ?? []),
          JSON.stringify(c.weaknesses ?? []),
          c.aiInsights ?? "",
          JSON.stringify(Array.isArray(c.notes) ? c.notes : []),
        ],
      );
    }

    for (const p of positions) {
      run(
        `INSERT INTO positions
        (title, department, openings, candidates_applied, status, priority, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          p.title ?? "Position",
          p.department ?? "",
          p.openings ?? 1,
          p.candidatesApplied ?? 0,
          p.status ?? "active",
          p.priority ?? "medium",
          p.createdDate ?? new Date().toISOString().slice(0, 10),
        ],
      );
    }
  } catch {
    // If seeding file is unavailable, start with empty tables.
  }
}

export async function listCandidates() {
  await getDb();
  const rows = all("SELECT * FROM candidates ORDER BY id DESC");
  return rows.map(toCandidate);
}

export async function getCandidateById(id) {
  await getDb();
  const row = get("SELECT * FROM candidates WHERE id = ?", [id]);
  return row ? toCandidate(row) : null;
}

export async function createCandidate(candidate) {
  await getDb();
  run(
    `INSERT INTO candidates
    (name, email, phone, position, ai_score, match_percentage, status, applied_date, resume_url, resume_original_name, skills_json, experience, education, location, strengths_json, weaknesses_json, ai_insights, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      candidate.name ?? "New Candidate",
      candidate.email ?? "",
      candidate.phone ?? "",
      candidate.position ?? "",
      candidate.aiScore ?? 0,
      candidate.matchPercentage ?? 0,
      candidate.status ?? "pending",
      candidate.appliedDate ?? new Date().toISOString().slice(0, 10),
      candidate.resumeUrl ?? null,
      candidate.resumeFileName ?? null,
      JSON.stringify(candidate.skills ?? []),
      candidate.experience ?? 0,
      candidate.education ?? "",
      candidate.location ?? "",
      JSON.stringify(candidate.strengths ?? []),
      JSON.stringify(candidate.weaknesses ?? []),
      candidate.aiInsights ?? "",
      JSON.stringify(candidate.notes ?? []),
    ],
  );
  const inserted = get("SELECT * FROM candidates ORDER BY id DESC LIMIT 1");
  await persistDb();
  return inserted ? toCandidate(inserted) : null;
}

export async function updateCandidate(id, patch) {
  const existing = await getCandidateById(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  await getDb();
  run(
    `UPDATE candidates SET
      name = ?, email = ?, phone = ?, position = ?, ai_score = ?, match_percentage = ?,
      status = ?, applied_date = ?, resume_url = ?, resume_original_name = ?, skills_json = ?, experience = ?,
      education = ?, location = ?, strengths_json = ?, weaknesses_json = ?, ai_insights = ?, notes_json = ?
    WHERE id = ?`,
    [
      merged.name,
      merged.email,
      merged.phone,
      merged.position,
      merged.aiScore,
      merged.matchPercentage,
      merged.status,
      merged.appliedDate,
      merged.resumeUrl ?? null,
      merged.resumeFileName ?? null,
      JSON.stringify(merged.skills ?? []),
      merged.experience,
      merged.education,
      merged.location,
      JSON.stringify(merged.strengths ?? []),
      JSON.stringify(merged.weaknesses ?? []),
      merged.aiInsights,
      JSON.stringify(merged.notes ?? []),
      id,
    ],
  );
  await persistDb();
  return getCandidateById(id);
}

export async function listPositions() {
  await getDb();
  const rows = all("SELECT * FROM positions ORDER BY id DESC");
  return rows.map(toPosition);
}

export async function createPosition(position) {
  await getDb();
  run(
    `INSERT INTO positions
    (title, department, openings, candidates_applied, status, priority, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      position.title ?? "New Position",
      position.department ?? "",
      position.openings ?? 1,
      position.candidatesApplied ?? 0,
      position.status ?? "active",
      position.priority ?? "medium",
      position.createdDate ?? new Date().toISOString().slice(0, 10),
    ],
  );
  const row = get("SELECT * FROM positions ORDER BY id DESC LIMIT 1");
  await persistDb();
  return row ? toPosition(row) : null;
}

export async function updatePosition(id, patch) {
  await getDb();
  const row = get("SELECT * FROM positions WHERE id = ?", [id]);
  if (!row) return null;
  const existing = toPosition(row);
  const merged = { ...existing, ...patch };
  run(
    `UPDATE positions SET
      title = ?, department = ?, openings = ?, candidates_applied = ?,
      status = ?, priority = ?, created_date = ?
    WHERE id = ?`,
    [
      merged.title,
      merged.department,
      merged.openings,
      merged.candidatesApplied,
      merged.status,
      merged.priority,
      merged.createdDate,
      id,
    ],
  );
  await persistDb();
  const updated = get("SELECT * FROM positions WHERE id = ?", [id]);
  return updated ? toPosition(updated) : null;
}

export async function saveScreening(summary) {
  await getDb();
  run(
    `INSERT INTO screenings (job_description, processed, qualified, avg_score, created_at)
    VALUES (?, ?, ?, ?, ?)`,
    [
      summary.jobDescription ?? "",
      summary.processed ?? 0,
      summary.qualified ?? 0,
      summary.avgScore ?? 0,
      new Date().toISOString(),
    ],
  );
  await persistDb();
}

export async function listRecentScreenings(limit = 8) {
  await getDb();
  const safe = Math.max(1, Math.min(50, Number(limit) || 8));
  const rows = all(`SELECT * FROM screenings ORDER BY id DESC LIMIT ${safe}`);
  return rows.map((row) => ({
    id: String(row.id),
    jobDescription: row.job_description,
    processed: row.processed,
    qualified: row.qualified,
    avgScore: row.avg_score,
    createdAt: row.created_at,
  }));
}

export async function incrementPositionApplicationsSmart(jobDescription, inferredRoleTitle) {
  await getDb();
  const rows = all("SELECT * FROM positions WHERE status = 'active'");
  const jd = (jobDescription || "").toLowerCase();
  const role = (inferredRoleTitle || "").toLowerCase();

  const bump = async (row) => {
    const next = Number(row.candidates_applied || 0) + 1;
    run("UPDATE positions SET candidates_applied = ? WHERE id = ?", [next, row.id]);
    await persistDb();
  };

  for (const row of rows) {
    const title = String(row.title).toLowerCase();
    if (title && jd.includes(title)) {
      await bump(row);
      return;
    }
  }

  const roleWords = role.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  for (const row of rows) {
    const title = String(row.title).toLowerCase();
    if (roleWords.some((w) => title.includes(w))) {
      await bump(row);
      return;
    }
  }

  const t = String(inferredRoleTitle || "").toLowerCase().trim();
  for (const row of rows) {
    const pt = String(row.title).toLowerCase();
    if (pt === t || t.includes(pt) || pt.includes(t)) {
      await bump(row);
      return;
    }
  }
}

