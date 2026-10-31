"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DAY, Stage, Task, getStage } from "@/lib/monster";
import { apiRequest } from "@/lib/api";

const KEY = "quantum-todo:v1";
type Draft = { title: string; description: string; dueAt?: number | null };
type ServerTask = Omit<Task, "createdAt" | "completedAt" | "dueAt"> & { createdAt: number | string; completedAt?: number | string | null; dueAt?: number | string | null };

function toServerDraft(draft: Draft) {
  return {
    title: draft.title,
    description: draft.description,
    ...(draft.dueAt !== undefined ? { dueAt: draft.dueAt === null ? null : new Date(draft.dueAt).toISOString() } : {}),
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseServerTask(task: ServerTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    createdAt: typeof task.createdAt === "number" ? task.createdAt : new Date(task.createdAt).getTime(),
    ...(task.dueAt != null ? { dueAt: typeof task.dueAt === "number" ? task.dueAt : new Date(task.dueAt).getTime() } : {}),
    done: Boolean(task.done),
    ...(task.completedAt ? { completedAt: typeof task.completedAt === "number" ? task.completedAt : new Date(task.completedAt).getTime() } : {}),
    ...(task.monsterLevel ? { monsterLevel: task.monsterLevel as Stage } : {}),
  };
}

function readTasks(raw: string | null): Task[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item): Task[] => {
    if (!item || typeof item !== "object") return [];
    const task = item as Partial<Task>;
    if (typeof task.id !== "string" || typeof task.title !== "string" || !task.title.trim() || !Number.isFinite(task.createdAt)) return [];
    return [{
      id: task.id,
      title: task.title,
      description: typeof task.description === "string" ? task.description : "",
      createdAt: Number(task.createdAt),
      ...(Number.isFinite(task.dueAt) ? { dueAt: Number(task.dueAt) } : {}),
      done: Boolean(task.done),
      ...(Number.isFinite(task.completedAt) ? { completedAt: Number(task.completedAt) } : {}),
    }];
  });
}

export function useTasks(remoteMode = false, authenticated = true) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [remoteError, setRemoteError] = useState("");

  useEffect(() => {
    if (remoteMode) {
      if (!authenticated) {
        setTasks([]);
        setReady(true);
        setRemoteError("");
        return;
      }
      let active = true;
      setReady(false);
      setNow(Date.now());
      apiRequest<{ tasks: ServerTask[] }>("/tasks")
        .then((result) => { if (active) { setTasks(result.tasks.map(parseServerTask)); setRemoteError(""); } })
        .catch((error: unknown) => { if (active) setRemoteError(error instanceof Error ? error.message : "โหลดภารกิจไม่สำเร็จ"); })
        .finally(() => { if (active) setReady(true); });
      return () => { active = false; };
    }
    try { setTasks(readTasks(localStorage.getItem(KEY))); } catch { setTasks([]); }
    setNow(Date.now());
    setReady(true);
  }, [remoteMode, authenticated]);

  useEffect(() => {
    if (!ready || remoteMode) return;
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { /* storage may be disabled */ }
  }, [tasks, ready, remoteMode]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    const refreshOnFocus = () => setNow(Date.now());
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  useEffect(() => {
    if (remoteMode) return;
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== KEY) return;
      try { setTasks(readTasks(event.newValue)); } catch { setTasks([]); }
    };
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, [remoteMode]);

  const add = useCallback((draft: Draft, createdAt = Date.now()) => {
    if (remoteMode) {
      void apiRequest<{ task: ServerTask }>("/tasks", { method: "POST", body: JSON.stringify(toServerDraft(draft)) })
        .then(({ task }) => { setTasks((current) => [parseServerTask(task), ...current]); setRemoteError(""); })
        .catch((error: unknown) => setRemoteError(error instanceof Error ? error.message : "เพิ่มภารกิจไม่สำเร็จ"));
      return;
    }
    const task: Task = { id: makeId(), ...draft, createdAt, done: false };
    setTasks((current) => [task, ...current]);
  }, [remoteMode]);

  const update = useCallback((id: string, draft: Draft) => {
    if (remoteMode) {
      void apiRequest<{ task: ServerTask }>(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(toServerDraft(draft)) })
        .then(({ task }) => { setTasks((current) => current.map((item) => item.id === id ? parseServerTask(task) : item)); setRemoteError(""); })
        .catch((error: unknown) => setRemoteError(error instanceof Error ? error.message : "แก้ไขภารกิจไม่สำเร็จ"));
      return;
    }
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...draft } : task));
  }, [remoteMode]);

  const remove = useCallback((id: string) => {
    if (remoteMode) {
      void apiRequest(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" })
        .then(() => { setTasks((current) => current.filter((task) => task.id !== id)); setRemoteError(""); })
        .catch((error: unknown) => setRemoteError(error instanceof Error ? error.message : "ลบภารกิจไม่สำเร็จ"));
      return;
    }
    setTasks((current) => current.filter((task) => task.id !== id));
  }, [remoteMode]);

  const toggle = useCallback(async (id: string) => {
    if (remoteMode) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return false;
      try {
        const { task: updated } = await apiRequest<{ task: ServerTask }>(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ done: !task.done }) });
        setTasks((current) => current.map((item) => item.id === id ? parseServerTask(updated) : item));
        setRemoteError("");
        return true;
      } catch (error) {
        setRemoteError(error instanceof Error ? error.message : "อัปเดตสถานะไม่สำเร็จ");
        return false;
      }
    }
    const completedAt = Date.now();
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, done: !task.done, completedAt: task.done ? undefined : completedAt }
      : task));
    return true;
  }, [remoteMode, tasks]);

  const seedDemo = useCallback(() => {
    if (remoteMode) return;
    const timestamp = Date.now();
    setTasks([
      { id: makeId(), title: "ตอบอีเมลที่ค้างไว้", description: "แค่ตอบสองบรรทัดเองนะ", createdAt: timestamp - 2 * 60 * 60_000, done: false },
      { id: makeId(), title: "นัดตรวจฟัน", description: "โทรจองคิวก่อนห้าโมง", createdAt: timestamp - 4 * DAY, done: false },
      { id: makeId(), title: "ส่งใบเบิกค่าใช้จ่าย", description: "ใบเสร็จอยู่ในกระเป๋าแล้ว", createdAt: timestamp - 8 * DAY, done: false },
    ]);
  }, [remoteMode]);

  const pending = useMemo(() => tasks.filter((task) => !task.done).sort((a, b) => a.createdAt - b.createdAt), [tasks]);
  const done = useMemo(() => tasks.filter((task) => task.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)), [tasks]);
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: pending.length,
    mutating: pending.filter((task) => getStage(task.createdAt, now) !== "fresh").length,
    done: done.length,
  }), [tasks, pending, done, now]);

  return { ready, now, pending, done, stats, add, update, remove, toggle, seedDemo, remoteError };
}
