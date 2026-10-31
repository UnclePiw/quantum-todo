"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Check, Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  initial?: { title: string; description: string; dueAt?: number | null } | null;
  onClose: () => void;
  onSave: (draft: { title: string; description: string; dueAt: number | null }) => void;
}

function toDateTimeInput(timestamp?: number | null) {
  if (timestamp == null || !Number.isFinite(timestamp)) return "";
  const localDate = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function AddTaskModal({ open, initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setDueAt(toDateTimeInput(initial?.dueAt));
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKeyDown); };
  }, [open, initial, onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), dueAt: dueAt ? new Date(dueAt).getTime() : null });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-scrim fixed inset-0 z-40 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            onSubmit={submit}
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 33 }}
            className="task-modal w-full max-w-lg rounded-3xl p-5 sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">{initial ? "แก้ไขงาน" : "งานใหม่"}</p>
                <h2 id="task-modal-title" className="font-display mt-1 text-2xl font-semibold">{initial ? "แก้ไขรายละเอียด" : "เพิ่มงานใหม่"}</h2>
                <p className="mt-1 text-sm">จดไว้ก่อน แล้วค่อยเลือกเวลาที่สะดวกลงมือทำ</p>
              </div>
              <button type="button" onClick={onClose} aria-label="ปิด" className="modal-close"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="task-title" className="field-label">ชื่องาน <span>*</span></label>
                  <span className="field-count">{title.length}/80</span>
                </div>
                <input ref={inputRef} id="task-title" className="form-field" placeholder="เช่น ส่งรายงานวันศุกร์" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="task-description" className="field-label">รายละเอียด <span className="optional-label">ไม่บังคับ</span></label>
                  <span className="field-count">{description.length}/240</span>
                </div>
                <textarea id="task-description" className="form-field min-h-28 resize-y" placeholder="รายละเอียดหรือสิ่งที่ต้องเตรียม" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="task-due-at" className="field-label inline-flex items-center gap-1.5"><CalendarClock size={14} /> กำหนดวันและเวลา <span className="optional-label">ไม่บังคับ</span></label>
                  {dueAt && <button type="button" onClick={() => setDueAt("")} className="deadline-clear">ล้างกำหนดเวลา</button>}
                </div>
                <input id="task-due-at" type="datetime-local" className="form-field deadline-input" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
                <p className="mt-1.5 text-[10px] leading-4">จะแสดงเตือนเมื่อใกล้ถึงเวลาหรือเลยกำหนดแล้ว</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="secondary-button rounded-xl px-5 py-3 text-sm font-medium">ยกเลิก</button>
              <button disabled={!title.trim()} className="primary-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">
                {initial ? <Check size={16} /> : <Plus size={17} />} {initial ? "บันทึกการแก้ไข" : "เพิ่มงาน"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
