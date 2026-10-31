export const API_ENABLED = process.env.NEXT_PUBLIC_API_ENABLED === "true";
export const API_BASE = "/api";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, { ...init, credentials: "include", headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ลองใหม่อีกครั้งนะ");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
