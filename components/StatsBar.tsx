"use client";

export default function StatsBar({ total, pending, mutating, done }: { total: number; pending: number; mutating: number; done: number }) {
  const completedPercent = total ? Math.round((done / total) * 100) : 0;
  const items = [
    { label: "ยังต้องทำ", value: pending, tone: "mint" },
    { label: "เริ่มโตแล้ว", value: mutating, tone: mutating ? "amber" : "muted" },
    { label: "เสร็จแล้ว", value: done, tone: done ? "mint" : "muted" },
    { label: "ความคืบหน้า", value: `${completedPercent}%`, tone: "mint", progress: completedPercent },
  ];

  return (
    <div className="stats-grid grid grid-cols-2 sm:grid-cols-4" aria-label="สรุปรายการงาน">
      {items.map(({ label, value, tone, progress }) => (
        <article key={label} className={`stat-card stat-${tone}`}>
          <div className="stat-label"><span className="stat-marker" aria-hidden="true" />{label}</div>
          <div className="stat-value font-display tabular-nums">{value}</div>
          {progress !== undefined && <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>}
        </article>
      ))}
    </div>
  );
}
