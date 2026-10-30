import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pg from "pg";
import { z } from "zod";

const { Pool } = pg;
const port = Number(process.env.PORT || 4000);
const production = process.env.NODE_ENV === "production";
const cookieName = "quantum_session";
const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;
const jwtSecret = process.env.JWT_SECRET;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!jwtSecret || (production && jwtSecret.length < 32)) throw new Error("Set JWT_SECRET to a random value of at least 32 characters");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.PGSSL === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
});

const origins = new Set((process.env.WEB_ORIGIN || "http://localhost:3000").split(",").map((origin) => origin.trim().replace(/\/$/, "")));
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || origins.has(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "ลองใหม่อีกครั้งในอีกสักครู่นะ" },
});

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
}).strict();
const taskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).default(""),
  dueAt: z.string().datetime({ offset: true }).nullable().default(null),
}).strict();
const taskPatchSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(240).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  done: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
const idSchema = z.string().uuid();

function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validationError(res) {
  return res.status(400).json({ error: "กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง" });
}

function writeSession(res, userId) {
  const token = jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "7d" });
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    maxAge: cookieMaxAge,
    path: "/",
  });
}

function requireUser(req, res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") throw new Error("Invalid session");
    req.userId = payload.sub;
    return next();
  } catch {
    res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: "lax", path: "/" });
    return res.status(401).json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" });
  }
}

const levelCase = "CASE WHEN created_at <= now() - interval '7 days' THEN 'critical' WHEN created_at <= now() - interval '3 days' THEN 'warning' ELSE 'fresh' END";

async function refreshMonsterLevels(userId) {
  await pool.query(`UPDATE tasks SET monster_level = ${levelCase} WHERE user_id = $1 AND status = 'pending' AND monster_level <> (${levelCase})`, [userId]);
}

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: new Date(row.created_at).getTime(),
    ...(row.due_at ? { dueAt: new Date(row.due_at).getTime() } : {}),
    done: row.status === "done",
    ...(row.completed_at ? { completedAt: new Date(row.completed_at).getTime() } : {}),
    monsterLevel: row.monster_level,
  };
}

app.get("/api/health", route(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}));

app.post("/api/auth/register", authLimiter, route(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success || Buffer.byteLength(parsed.data?.password ?? "", "utf8") > 72) return validationError(res);
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const result = await pool.query("INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email", [email, passwordHash]);
    const user = result.rows[0];
    writeSession(res, user.id);
    return res.status(201).json({ user });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ error: "อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบแทนนะ" });
    throw error;
  }
}));

app.post("/api/auth/login", authLimiter, route(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success || Buffer.byteLength(parsed.data?.password ?? "", "utf8") > 72) return validationError(res);
  const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [parsed.data.email.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  writeSession(res, user.id);
  return res.json({ user: { id: user.id, email: user.email } });
}));

app.get("/api/auth/me", requireUser, route(async (req, res) => {
  const result = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.userId]);
  if (!result.rowCount) return res.status(401).json({ error: "ไม่พบบัญชีนี้" });
  return res.json({ user: result.rows[0] });
}));

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: "lax", path: "/" });
  res.status(204).end();
});

app.get("/api/tasks", requireUser, route(async (req, res) => {
  await refreshMonsterLevels(req.userId);
  const result = await pool.query(
    "SELECT id, title, description, created_at, due_at, status, completed_at, monster_level FROM tasks WHERE user_id = $1 ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, CASE WHEN status = 'pending' THEN created_at END ASC, completed_at DESC",
    [req.userId],
  );
  return res.json({ tasks: result.rows.map(formatTask) });
}));

app.post("/api/tasks", requireUser, route(async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res);
  const { title, description, dueAt } = parsed.data;
  const result = await pool.query(
    "INSERT INTO tasks(user_id, title, description, due_at, monster_level) VALUES($1, $2, $3, $4, 'fresh') RETURNING id, title, description, created_at, due_at, status, completed_at, monster_level",
    [req.userId, title, description, dueAt],
  );
  return res.status(201).json({ task: formatTask(result.rows[0]) });
}));

app.patch("/api/tasks/:id", requireUser, route(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: "รหัสภารกิจไม่ถูกต้อง" });
  const parsed = taskPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res);
  const { title, description, dueAt, done } = parsed.data;
  const hasDueAt = Object.hasOwn(parsed.data, "dueAt");
  const result = await pool.query(
    `UPDATE tasks SET
      title = COALESCE($3, title),
      description = COALESCE($4, description),
      due_at = CASE WHEN $6::boolean THEN $5::timestamptz ELSE due_at END,
      status = CASE WHEN $7::boolean IS TRUE THEN 'done' WHEN $7::boolean IS FALSE THEN 'pending' ELSE status END,
      completed_at = CASE WHEN $7::boolean IS TRUE THEN COALESCE(completed_at, now()) WHEN $7::boolean IS FALSE THEN NULL ELSE completed_at END,
      monster_level = CASE WHEN $7::boolean IS FALSE THEN ${levelCase} ELSE monster_level END
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, description, created_at, due_at, status, completed_at, monster_level`,
    [req.params.id, req.userId, title ?? null, description ?? null, dueAt ?? null, hasDueAt, done ?? null],
  );
  if (!result.rowCount) return res.status(404).json({ error: "ไม่พบภารกิจนี้" });
  return res.json({ task: formatTask(result.rows[0]) });
}));

app.delete("/api/tasks/:id", requireUser, route(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: "รหัสภารกิจไม่ถูกต้อง" });
  const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: "ไม่พบภารกิจนี้" });
  return res.status(204).end();
}));

app.use((error, _req, res, _next) => {
  console.error("API request failed:", error?.message ?? "unknown error");
  if (res.headersSent) return;
  return res.status(500).json({ error: "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง" });
});

async function start() {
  const schema = await readFile(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await pool.query(schema);
  app.listen(port, "0.0.0.0", () => console.log(`Quantum Todo API listening on ${port}`));
}

start().catch((error) => {
  console.error("Could not start Quantum Todo API:", error?.message ?? error);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await pool.end();
    process.exit(0);
  });
}
