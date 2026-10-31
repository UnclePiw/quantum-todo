"use client";

import { useCallback, useEffect, useState } from "react";
import { API_ENABLED, apiRequest } from "@/lib/api";

export interface User { id: string; email: string }
type AuthAction = "login" | "register";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!API_ENABLED);

  useEffect(() => {
    if (!API_ENABLED) return;
    let active = true;
    apiRequest<{ user: User }>("/auth/me")
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const authenticate = useCallback(async (action: AuthAction, email: string, password: string) => {
    const result = await apiRequest<{ user: User }>(`/auth/${action}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    try { await apiRequest("/auth/logout", { method: "POST" }); } catch { /* clear local view even if offline */ }
    setUser(null);
  }, []);

  return { ready, user, usesRemote: API_ENABLED, authenticated: !API_ENABLED || Boolean(user), authenticate, signOut };
}
