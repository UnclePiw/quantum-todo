"use client";

import { useEffect, useState } from "react";

export default function ScreenRunner({ celebration = 0 }: { celebration?: number }) {
  const [cheering, setCheering] = useState(false);

  useEffect(() => {
    if (!celebration) return;
    setCheering(true);
    const timer = window.setTimeout(() => setCheering(false), 760);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  return (
    <div className="screen-runner" aria-hidden="true">
      <div className="runner-track" />
      <div className={`runner-sprite ${cheering ? "is-celebrating" : ""}`}>
        <span className="runner-shadow" />
        <span className="runner-cheer-text">เย้!</span>
        <svg className={`runner-art ${cheering ? "is-cheering" : ""}`} viewBox="0 0 48 48" shapeRendering="crispEdges">
          <g className="runner-pose runner-pose-a">
            <rect x="5" y="18" width="8" height="3" fill="#FFB56F" />
            <rect x="2" y="21" width="7" height="3" fill="#FF8F7C" />
            <rect x="13" y="23" width="8" height="5" fill="#D59B71" />
            <rect x="27" y="23" width="8" height="5" fill="#D59B71" />
            <rect x="16" y="28" width="6" height="8" fill="#395E54" />
            <rect x="27" y="28" width="6" height="7" fill="#395E54" />
            <rect x="17" y="35" width="7" height="4" fill="#263A35" />
            <rect x="28" y="34" width="6" height="4" fill="#263A35" />
            <rect x="21" y="37" width="10" height="4" fill="#8EE0B6" />
            <rect x="31" y="37" width="9" height="4" fill="#8EE0B6" />
            <rect x="14" y="10" width="22" height="13" fill="#704F8C" />
            <rect x="11" y="13" width="28" height="8" fill="#9D79BC" />
            <rect x="17" y="16" width="5" height="5" fill="#FFF0CF" />
            <rect x="29" y="16" width="5" height="5" fill="#FFF0CF" />
            <rect x="19" y="18" width="2" height="3" fill="#28313D" />
            <rect x="30" y="18" width="2" height="3" fill="#28313D" />
            <rect x="20" y="23" width="12" height="9" fill="#8FE2C0" />
            <rect x="17" y="27" width="18" height="7" fill="#6AC79E" />
            <rect x="18" y="6" width="7" height="5" fill="#5DBF93" />
            <rect x="29" y="6" width="7" height="5" fill="#5DBF93" />
          </g>
          <g className="runner-pose runner-pose-b">
            <rect x="5" y="21" width="8" height="3" fill="#FFB56F" />
            <rect x="2" y="24" width="7" height="3" fill="#FF8F7C" />
            <rect x="13" y="23" width="8" height="5" fill="#D59B71" />
            <rect x="27" y="23" width="8" height="5" fill="#D59B71" />
            <rect x="15" y="28" width="6" height="7" fill="#395E54" />
            <rect x="29" y="28" width="6" height="8" fill="#395E54" />
            <rect x="10" y="34" width="7" height="4" fill="#263A35" />
            <rect x="29" y="35" width="7" height="4" fill="#263A35" />
            <rect x="4" y="37" width="10" height="4" fill="#8EE0B6" />
            <rect x="27" y="37" width="10" height="4" fill="#8EE0B6" />
            <rect x="14" y="10" width="22" height="13" fill="#704F8C" />
            <rect x="11" y="13" width="28" height="8" fill="#9D79BC" />
            <rect x="17" y="16" width="5" height="5" fill="#FFF0CF" />
            <rect x="29" y="16" width="5" height="5" fill="#FFF0CF" />
            <rect x="19" y="18" width="2" height="3" fill="#28313D" />
            <rect x="30" y="18" width="2" height="3" fill="#28313D" />
            <rect x="20" y="23" width="12" height="9" fill="#8FE2C0" />
            <rect x="17" y="27" width="18" height="7" fill="#6AC79E" />
            <rect x="18" y="6" width="7" height="5" fill="#5DBF93" />
            <rect x="29" y="6" width="7" height="5" fill="#5DBF93" />
          </g>
          <rect x="39" y="11" width="3" height="3" fill="#F9D27E" className="runner-spark" />
        </svg>
      </div>
    </div>
  );
}
