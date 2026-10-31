"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, CircleHelp, LogOut, Plus, Search, Volume2, VolumeX } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { STAGES, Task, WIN_LINES, getStage } from "@/lib/monster";
import MonsterDisplay from "@/components/MonsterDisplay";
import StatsBar from "@/components/StatsBar";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import VictoryToast from "@/components/VictoryToast";
import AuthPanel from "@/components/AuthPanel";
import ScreenRunner from "@/components/ScreenRunner";
import { playSlashSound } from "@/lib/sfx";

type Filter = "all" | "evolving" | "done";

export default function Home() {
  const auth = useAuth();
  const { ready, now, pending, done, stats, add, update, remove, toggle, seedDemo, remoteError } = useTasks(auth.usesRemote, auth.authenticated);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [runnerCelebration, setRunnerCelebration] = useState(0);

  useEffect(() => {
    if (!ready || (auth.usesRemote && !auth.ready)) return;
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;

    const tasks = pending.map(({ id, createdAt }) => ({ id, createdAt }));
    void fetch("/desktop-bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
      keepalive: true,
    }).catch(() => { /* The web app remains usable if the desktop companion is closed. */ });
  }, [auth.ready, auth.usesRemote, pending, ready]);

  const closeModal = useCallback(() => setModalOpen(false), []);
  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditing(task); setModalOpen(true); };

  const handleToggle = async (task: Task) => {
    const saved = await toggle(task.id);
    if (saved && !task.done) {
      setRunnerCelebration((count) => count + 1);
      if (soundOn) playSlashSound();
      const id = Date.now();
      setToast({ msg: WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)], id });
      window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 2400);
    }
  };

  const threat = pending[0];
  const threatStage = threat ? getStage(threat.createdAt, now) : "fresh";
  const visibleTasks = useMemo(() => {
    const selected = filter === "done" ? done : filter === "evolving" ? pending.filter((task) => getStage(task.createdAt, now) !== "fresh") : pending;
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return selected;
    return selected.filter((task) => `${task.title} ${task.description}`.toLocaleLowerCase().includes(normalizedQuery));
  }, [done, filter, now, pending, query]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: pending.length },
    { key: "evolving", label: "เริ่มกลายร่าง", count: stats.mutating },
    { key: "done", label: "เสร็จแล้ว", count: done.length },
  ];

  if (auth.usesRemote && !auth.ready) {
    return <main className="auth-screen grid min-h-screen place-items-center px-4"><div className="loading-panel rounded-2xl px-8 py-6" role="status">กำลังเชื่อมต่อบัญชีของคุณ…</div></main>;
  }
  if (auth.usesRemote && !auth.user) return <AuthPanel onSubmit={auth.authenticate} />;

  return (
    <main className="page-shell mx-auto max-w-6xl px-4 pb-20 pt-5 sm:px-7 sm:pt-8">
      <header className="topbar mb-6 flex items-center justify-between sm:mb-8">
        <a className="brand-lockup" href="#top" aria-label="Quantum Todo หน้าหลัก">
          <span className="brand-mark" aria-hidden="true"><span>Q</span></span>
          <span className="brand-name">QUANTUM<span>TODO</span></span>
        </a>
        <div className="topbar-actions flex items-center gap-2">
          <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "ปิดเสียงเอฟเฟกต์" : "เปิดเสียงเอฟเฟกต์"} aria-pressed={soundOn} title={soundOn ? "ปิดเสียงเอฟเฟกต์" : "เปิดเสียงเอฟเฟกต์"}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
          <div className="local-badge"><span className="status-dot" /> <span>{auth.usesRemote ? auth.user?.email : "บันทึกในเครื่องนี้"}</span>{auth.usesRemote && <button className="signout-button" onClick={() => { void auth.signOut(); }} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={14} /></button>}</div>
        </div>
      </header>

      <section id="top" className="hero-panel relative mb-5 overflow-hidden rounded-[28px] p-6 sm:mb-6 sm:p-9 lg:p-11">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-copy relative z-10">
          <div className="eyebrow"><span className="status-dot" /> สมุดภารกิจ</div>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            วันนี้มีอะไร<br /><span className="hero-highlight">ต้องจัดการบ้าง</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">
            งานที่ทิ้งไว้นานจะค่อยๆ โตเป็นมอนสเตอร์ เคลียร์ทีละชิ้นก็พอ
          </p>
          <div className="hero-meta mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="hero-live">{ready ? "รายการล่าสุด" : "กำลังโหลดรายการ"}</span>
            <span className="hero-divider" />
            <span>ค้าง 3 วันเริ่มโต <span className="meta-arrow">·</span> 7 วันเป็นบอส</span>
          </div>
        </div>

        <div className="hero-monster relative z-10" aria-label="มอนสเตอร์ที่น่ากังวลที่สุด">
          <div className="monster-halo" />
          {threat ? <MonsterDisplay stage={threatStage} size={150} /> : <MonsterDisplay stage="fresh" size={150} />}
          <div className="monster-level"><span className="level-dot" style={{ background: STAGES[threatStage].color }} />{threat ? STAGES[threatStage].name : "พร้อมฟักตัว"}</div>
          <div className="monster-caption">{threat ? threat.title : "เพิ่มงานแรกของคุณ"}</div>
        </div>

        <div className="hero-footnote relative z-10 mt-8 flex items-center gap-2 sm:mt-9">
          <CircleHelp size={15} /> <span>นับอายุงานจากวันที่เพิ่ม</span>
        </div>
      </section>

      <StatsBar total={stats.total} pending={stats.pending} mutating={stats.mutating} done={stats.done} />

      <section className="task-section mt-8 sm:mt-10" aria-labelledby="tasks-heading">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:mb-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">รายการของคุณ</p>
            <h2 id="tasks-heading" className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">งานที่ต้องทำ</h2>
          </div>
          <button onClick={openNew} className="primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
            <Plus size={17} strokeWidth={2.5} /> เพิ่มงาน
          </button>
        </div>

        <div className="toolbar mb-4 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
          <div className="filter-list flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="กรองรายการภารกิจ">
            {filters.map((item) => (
              <button key={item.key} type="button" role="tab" aria-selected={filter === item.key} onClick={() => setFilter(item.key)} className={`filter-pill ${filter === item.key ? "is-active" : ""}`}>
                {item.label}<span className="filter-count">{item.count}</span>
              </button>
            ))}
          </div>
          <label className="search-box flex min-w-0 items-center gap-2 rounded-xl px-3">
            <Search size={16} className="shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหางาน..." aria-label="ค้นหางาน" />
            {query && <button type="button" onClick={() => setQuery("")} className="search-clear" aria-label="ล้างคำค้น">×</button>}
          </label>
        </div>

        {remoteError && <div className="sync-error mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs" role="alert"><span>{remoteError}</span><button onClick={() => window.location.reload()}>ลองโหลดใหม่</button></div>}

        {!ready ? (
          <div className="loading-panel rounded-2xl p-8 text-center" role="status">กำลังเรียกคืนรายการภารกิจ…</div>
        ) : stats.total === 0 ? (
          <div className="empty-panel rounded-3xl p-8 text-center sm:p-12">
            <div className="empty-monster mx-auto mb-4"><MonsterDisplay stage="fresh" size={76} /></div>
            <p className="section-kicker">เริ่มได้เลย</p>
            <h3 className="font-display mt-2 text-2xl font-semibold">วันนี้ยังไม่มีงานค้าง</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6">{auth.usesRemote ? "เพิ่มงานที่อยากจำไว้ แล้วค่อยๆ ทำให้เสร็จทีละชิ้น" : "เพิ่มงานแรกของวันนี้ หรือจะลองดูตัวอย่างก่อนก็ได้"}</p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <button onClick={openNew} className="primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"><Plus size={17} /> เพิ่มงานแรก</button>
              {!auth.usesRemote && <button onClick={seedDemo} className="secondary-button rounded-xl px-4 py-3 text-sm font-medium">ลองดูตัวอย่าง</button>}
            </div>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="empty-panel rounded-3xl px-6 py-12 text-center">
            <div className="empty-symbol mx-auto mb-4"><Search size={22} /></div>
            <h3 className="font-display text-xl font-semibold">ยังไม่มีงานตรงนี้</h3>
            <p className="mt-1 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นดูนะ</p>
            <button onClick={() => { setQuery(""); setFilter("all"); }} className="secondary-button mt-5 rounded-xl px-4 py-2.5 text-sm">ดูงานทั้งหมด</button>
          </div>
        ) : (
          <ul className="task-list space-y-3" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {visibleTasks.map((task) => (
                <TaskCard key={task.id} task={task} now={now} onToggle={() => handleToggle(task)} onEdit={() => openEdit(task)} onDelete={() => remove(task.id)} />
              ))}
            </AnimatePresence>
          </ul>
        )}

        {stats.total > 0 && (
          <div className="tipline mt-5 flex items-center gap-2 px-1 text-xs leading-5">
          <Check size={14} className="shrink-0" /> <span>เริ่มจากงานที่โตที่สุดก่อนก็ได้ ทำเสร็จแล้วกดเครื่องหมายถูก</span>
          </div>
        )}
      </section>

      <footer className="page-footer mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/[0.08] pt-5 text-xs text-white/35 sm:flex-row">
        <span>Quantum Todo <span className="footer-separator">·</span> ทำทีละงานก็พอ</span>
        <span>{auth.usesRemote ? "งานของคุณซิงค์อยู่ในบัญชีนี้" : "งานถูกบันทึกไว้ในเบราว์เซอร์นี้"}</span>
      </footer>

      <AddTaskModal open={modalOpen} initial={editing} onClose={closeModal} onSave={(draft) => editing ? update(editing.id, draft) : add(draft)} />
      <VictoryToast message={toast?.msg ?? null} id={toast?.id ?? 0} />
      <ScreenRunner celebration={runnerCelebration} />
    </main>
  );
}
