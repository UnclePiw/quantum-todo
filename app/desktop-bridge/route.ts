import { randomUUID } from "node:crypto";
import { rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PendingTask = { id: string; createdAt: number };

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.hostname !== "localhost" && requestUrl.hostname !== "127.0.0.1") {
    return NextResponse.json({ error: "Desktop sync is available on this computer only." }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.origin !== requestUrl.origin) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !Array.isArray((body as { tasks?: unknown }).tasks)) {
    return NextResponse.json({ error: "Tasks must be an array." }, { status: 400 });
  }

  const input = (body as { tasks: unknown[] }).tasks;
  if (input.length > 250) return NextResponse.json({ error: "Too many tasks." }, { status: 400 });

  const tasks: PendingTask[] = input.flatMap((item): PendingTask[] => {
    if (!item || typeof item !== "object") return [];
    const task = item as Partial<PendingTask>;
    if (typeof task.id !== "string" || task.id.length > 100 || !Number.isFinite(task.createdAt)) return [];
    return [{ id: task.id, createdAt: Number(task.createdAt) }];
  });

  const snapshotPath = join(tmpdir(), "quantum-todo-desktop-tasks.json");
  const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;
  const snapshot = JSON.stringify({ updatedAt: Date.now(), tasks });
  await writeFile(temporaryPath, snapshot, "utf8");
  await rename(temporaryPath, snapshotPath);

  return NextResponse.json({ ok: true, count: tasks.length });
}
