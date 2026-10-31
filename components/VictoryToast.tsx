"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const PARTICLES = Array.from({ length: 22 }, (_, index) => {
  const angle = (index / 22) * Math.PI * 2;
  const radius = 54 + (index % 4) * 19;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, color: ["#8FE2C0", "#F8BC72", "#FF7E79", "#C3A7FF"][index % 4] };
});

export default function VictoryToast({ message, id }: { message: string | null; id: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-50 grid place-items-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div key={id} initial={{ opacity: 0, y: 18, scale: 0.82 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.94 }} transition={{ type: "spring", stiffness: 380, damping: 24 }} className="victory-toast relative rounded-2xl px-5 py-3.5" role="status">
            {PARTICLES.map((particle, index) => (
              <motion.span key={index} className="victory-particle absolute left-1/2 top-1/2" style={{ backgroundColor: particle.color }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0.15 }} transition={{ duration: 0.95, delay: index % 5 * 0.02, ease: "easeOut" }} />
            ))}
            <motion.span className="victory-slash absolute left-1/2 top-1/2" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, .9, 0], scaleX: [0, 1.35, 1.7], rotate: [-13, -13, -13] }} transition={{ duration: .38, ease: "easeOut" }} />
            <span className="relative z-10 flex items-center gap-2 text-sm font-semibold sm:text-base"><Sparkles size={18} className="shrink-0 text-[#F8BC72]" />{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
