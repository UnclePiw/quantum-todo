"use client";

import { motion } from "framer-motion";
import { CalendarClock, Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import MonsterDisplay from "./MonsterDisplay";
import { DAY, STAGES, Task, formatAge, getMutationProgress, getStage } from "@/lib/monster";

interface Props { task: Task; now: number; onToggle: () => void; onEdit: () => void; onDelete: () => void }

export default function TaskCard({ task, now, onToggle, onEdit, onDelete }: Props) {
  const stage = getStage(task.createdAt, now);
  const details = STAGES[stage];
  const done = task.done;
  const ageInDays = Math.max(0, (now - task.createdAt) / DAY);
  const daysToNextStage = stage === "fresh" ? Math.ceil(3 - ageInDays) : stage === "warning" ? Math.ceil(7 - ageInDays) : 0;
  const progress = getMutationProgress(task.createdAt, now);
  const dueIn = task.dueAt == null ? null : task.dueAt - now;
  const dueTone = dueIn == null ? "" : !done && dueIn <= 0 ? "deadline-overdue" : !done && dueIn <= 24 * 60 * 60_000 ? "deadline-soon" : "deadline-normal";
  const dueLabel = task.dueAt == null ? "" : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(task.dueAt);
  const dueMessage = dueIn == null ? "" : done ? `กำหนดไว้ ${dueLabel}` : dueIn <= 0 ? `ถึงกำหนดแล้ว · ${dueLabel}` : dueIn <= 60 * 60_000 ? `ครบกำหนดใน ${Math.max(1, Math.ceil(dueIn / 60_000))} นาที · ${dueLabel}` : dueIn <= 24 * 60 * 60_000 ? `ครบกำหนดภายใน 24 ชม. · ${dueLabel}` : `กำหนดส่ง · ${dueLabel}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: done ? 0.72 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.84, x: 26, rotate: 1.5, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className={`task-card task-${stage} ${done ? "is-done" : ""}`}
    >
      <div className="task-creature-wrap">
        {done ? <div className="defeated-creature" aria-label="มอนสเตอร์ถูกกำจัดแล้ว" role="img"><Check size={25} strokeWidth={3} /></div> : <MonsterDisplay stage={stage} size={64} />}
      </div>

      <div className="task-content min-w-0 flex-1">
        <div className="task-heading-row flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className={`font-display task-title ${done ? "line-through decoration-white/35" : ""}`}>{task.title}</h3>
          {!done && <span className={`stage-badge stage-badge-${stage}`}><span />{details.name}</span>}
          {done && <span className="completed-badge"><Check size={11} strokeWidth={3} /> เสร็จแล้ว</span>}
        </div>
        {task.description && <p className="task-description mt-1 line-clamp-2">{task.description}</p>}
        {task.dueAt != null && <div className={`deadline-badge ${dueTone} mt-2`}><CalendarClock size={12} /><span>{dueMessage}</span></div>}
        <div className="task-meta mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{done ? "ทำเสร็จแล้ว" : `เพิ่มมาแล้ว ${formatAge(task.createdAt, now)}`}</span>
          {!done && <><span className="meta-bullet">·</span><span>{details.age}</span></>}
        </div>
        {!done && (
          <div className="task-evolution mt-3">
            <div className="flex items-center justify-between gap-3 text-[10px] sm:text-[11px]">
              <span>{stage === "critical" ? "พลังมอนสเตอร์เต็มแล้ว" : `อีก ${daysToNextStage} วัน${stage === "fresh" ? "เริ่มกลายร่าง" : "กลายเป็นบอส"}`}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="evolution-track mt-1.5"><span style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="task-actions flex shrink-0 items-center gap-1">
        {!done && <button className="icon-action" onClick={onEdit} aria-label={`แก้ไข ${task.title}`} title="แก้ไขภารกิจ"><Pencil size={16} /></button>}
        <button className="icon-action delete-action" onClick={onDelete} aria-label={`ลบ ${task.title}`} title="ลบภารกิจ"><Trash2 size={16} /></button>
        <motion.button
          whileTap={{ scale: 0.84, rotate: done ? -15 : 15 }}
          onClick={onToggle}
          aria-label={done ? `คืนชีพ ${task.title}` : `ทำ ${task.title} เสร็จแล้ว`}
          title={done ? "นำกลับมาทำอีกครั้ง" : "ทำเสร็จแล้ว"}
          className={`complete-button ml-1 ${done ? "undo-button" : ""}`}
        >
          {done ? <RotateCcw size={16} /> : <Check size={19} strokeWidth={2.8} />}
        </motion.button>
      </div>
    </motion.li>
  );
}
