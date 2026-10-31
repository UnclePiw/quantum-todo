"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

type Props = { onSubmit: (action: "login" | "register", email: string, password: string) => Promise<void> };

export default function AuthPanel({ onSubmit }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(mode, email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen grid min-h-screen place-items-center px-4 py-10">
      <section className="auth-card w-full max-w-md rounded-[28px] p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="brand-mark"><span>Q</span></span>
          <span className="brand-name">QUANTUM<span>TODO</span></span>
        </div>
        <div className="auth-mascot mb-5"><span>ซิงค์งานข้ามอุปกรณ์</span></div>
        <h1 className="font-display text-3xl font-semibold">{mode === "login" ? "กลับมาจัดการงาน" : "สร้างบัญชีใหม่"}</h1>
        <p className="mt-2 text-sm leading-6">{mode === "login" ? "เข้าสู่ระบบเพื่อดูรายการงานของคุณ" : "สมัครสมาชิกเพื่อเก็บงานไว้ใช้ได้ทุกอุปกรณ์"}</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="auth-field-wrap">
            <span className="field-label">อีเมล</span>
            <span className="auth-input"><Mail size={16} /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span>
          </label>
          <label className="auth-field-wrap">
            <span className="field-label">รหัสผ่าน</span>
            <span className="auth-input"><LockKeyhole size={16} /><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "register" ? "อย่างน้อย 8 ตัวอักษร" : "รหัสผ่านของคุณ"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 8 : 1} required /></span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold" disabled={busy}>
            {busy ? "กำลังเชื่อมต่อ…" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}<ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-center text-xs">
          {mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีแล้ว?"}{" "}
          <button type="button" className="auth-mode-toggle" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </p>
      </section>
      <p className="auth-footnote">งานของคุณจะตามไปด้วยเมื่อเปลี่ยนอุปกรณ์</p>
    </main>
  );
}
