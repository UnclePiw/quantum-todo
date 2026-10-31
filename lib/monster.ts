export type Stage = "fresh" | "warning" | "critical";
export const DAY = 86_400_000;
export const MUTATION_DAY = 3;
export const BOSS_DAY = 7;

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  dueAt?: number | null;
  done: boolean;
  completedAt?: number;
  monsterLevel?: Stage;
}

/** Tasks mutate on day 3 and become a boss on day 7. */
export function getStage(createdAt: number, now: number): Stage {
  const days = Math.max(0, Math.floor((now - createdAt) / DAY));
  return days >= BOSS_DAY ? "critical" : days >= MUTATION_DAY ? "warning" : "fresh";
}

export const STAGES: Record<Stage, { emoji: string; name: string; color: string; hint: string; age: string }> = {
  fresh: { emoji: "🥚", name: "ไข่ฟักใหม่", color: "#8FE2C0", hint: "ยังตัวเล็กอยู่ รีบจัดการก่อนมันจะเริ่มโต", age: "0–2 วัน" },
  warning: { emoji: "👾", name: "เริ่มกลายร่าง", color: "#F8BC72", hint: "เริ่มมีหนวดแล้วนะ อย่าปล่อยให้ถึงขั้นบอส", age: "3–6 วัน" },
  critical: { emoji: "🐲", name: "บอสตัวใหญ่", color: "#FF7E79", hint: "มันโตเต็มร่างแล้ว ได้เวลาปราบบอส!", age: "7 วันขึ้นไป" },
};

export function formatAge(createdAt: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} วัน ${hours} ชม.`;
  if (hours > 0) return `${hours} ชม. ${minutes % 60} นาที`;
  if (minutes < 1) return "เพิ่งเกิด";
  return `${minutes} นาที`;
}

export function getMutationProgress(createdAt: number, now: number): number {
  const stage = getStage(createdAt, now);
  const days = Math.max(0, (now - createdAt) / DAY);
  if (stage === "critical") return 100;
  if (stage === "warning") return Math.min(100, Math.round(((days - MUTATION_DAY) / (BOSS_DAY - MUTATION_DAY)) * 100));
  return Math.min(100, Math.round((days / MUTATION_DAY) * 100));
}

export const WIN_LINES = [
  "ปราบมอนสเตอร์สำเร็จ! งานนี้จบแล้ว",
  "ฟันฉับ! งานค้างหายไปอีกหนึ่งชิ้น",
  "บอสล้มแล้ว รับเวลาว่างเป็นรางวัล",
  "เคลียร์ได้สวยมาก รังโล่งขึ้นแล้ว",
  "เยี่ยมเลย คุณชนะการผัดวันประกันพรุ่ง",
];
