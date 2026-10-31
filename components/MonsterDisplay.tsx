import { Stage, STAGES } from "@/lib/monster";

export default function MonsterDisplay({ stage, size = 58 }: { stage: Stage; size?: number }) {
  const palette = {
    fresh: { body: "#BFF5D9", light: "#E7FFE9", shade: "#65C29D", accent: "#63D9AB" },
    warning: { body: "#B28BEA", light: "#E1C7FF", shade: "#7051A6", accent: "#FFBE6D" },
    critical: { body: "#F18475", light: "#FFC5A2", shade: "#9D4553", accent: "#FFB45F" },
  }[stage];

  return (
    <div className={`monster-display monster-${stage}`} style={{ width: size, height: size }} role="img" aria-label={`${STAGES[stage].name} มอนสเตอร์`}>
      <span className="monster-aura" aria-hidden="true" />
      <svg className="monster-sprite" viewBox="0 0 64 64" aria-hidden="true" shapeRendering="crispEdges">
        {stage === "fresh" && (
          <>
            <rect x="28" y="6" width="7" height="4" fill={palette.accent} />
            <rect x="23" y="10" width="7" height="4" fill={palette.accent} />
            <rect x="35" y="10" width="7" height="4" fill={palette.accent} />
            <path d="M32 13h9v4h5v6h4v9h4v12h-5v5h-7v4H25v-4h-7v-6h-4V28h4v-7h5v-5h9z" fill={palette.shade} />
            <path d="M30 13h8v4h5v6h4v9h4v11h-5v5h-7v4H25v-4h-5v-7h-3V29h4v-7h5v-5h4z" fill={palette.body} />
            <rect x="25" y="24" width="5" height="7" fill="#28313D" /><rect x="37" y="24" width="5" height="7" fill="#28313D" />
            <rect x="26" y="25" width="2" height="2" fill="#fff" /><rect x="38" y="25" width="2" height="2" fill="#fff" />
            <rect x="31" y="35" width="3" height="3" fill={palette.shade} />
            <rect x="20" y="36" width="4" height="3" fill="#F3909B" opacity=".65" /><rect x="42" y="36" width="4" height="3" fill="#F3909B" opacity=".65" />
            <rect x="28" y="48" width="5" height="4" fill="#F9D073" /><rect x="35" y="48" width="5" height="4" fill="#F9D073" />
            <rect x="13" y="16" width="3" height="3" fill="#FFF2B4" /><rect x="49" y="13" width="3" height="3" fill="#FFF2B4" />
          </>
        )}
        {stage === "warning" && (
          <>
            <rect x="9" y="27" width="8" height="9" fill={palette.shade} /><rect x="5" y="36" width="8" height="7" fill={palette.body} /><rect x="11" y="43" width="7" height="5" fill={palette.shade} />
            <rect x="47" y="25" width="8" height="9" fill={palette.shade} /><rect x="51" y="34" width="8" height="8" fill={palette.body} /><rect x="46" y="42" width="7" height="6" fill={palette.shade} />
            <rect x="24" y="48" width="8" height="8" fill={palette.shade} /><rect x="20" y="53" width="8" height="5" fill={palette.body} /><rect x="36" y="49" width="8" height="8" fill={palette.shade} />
            <path d="M29 13h8v5h7v5h5v9h4v12h-6v6h-8v4H25v-5h-7v-7h-4V31h4v-7h6v-6h5z" fill={palette.shade} />
            <path d="M29 12h8v5h7v5h5v9h4v11h-6v6h-8v4H25v-5h-6v-7h-4V31h4v-7h6v-7h4z" fill={palette.body} />
            <rect x="23" y="24" width="9" height="10" fill="#FFF1D5" /><rect x="37" y="23" width="9" height="10" fill="#FFF1D5" />
            <rect x="27" y="27" width="4" height="5" fill="#34283D" /><rect x="38" y="26" width="4" height="5" fill="#34283D" />
            <rect x="31" y="38" width="3" height="5" fill="#54315B" /><rect x="35" y="38" width="3" height="5" fill="#54315B" />
            <rect x="35" y="39" width="2" height="3" fill="#FFF1D5" />
            <rect x="18" y="36" width="4" height="3" fill="#F28B9E" /><rect x="46" y="35" width="4" height="3" fill="#F28B9E" />
            <rect x="14" y="16" width="4" height="4" fill={palette.accent} /><rect x="49" y="13" width="4" height="4" fill="#7FE0CB" />
          </>
        )}
        {stage === "critical" && (
          <>
            <rect x="15" y="8" width="7" height="7" fill={palette.accent} /><rect x="12" y="4" width="6" height="8" fill="#FF7E79" />
            <rect x="42" y="7" width="7" height="7" fill={palette.accent} /><rect x="47" y="3" width="6" height="8" fill="#FF7E79" />
            <rect x="5" y="23" width="8" height="9" fill={palette.shade} /><rect x="2" y="31" width="8" height="8" fill={palette.body} /><rect x="8" y="39" width="8" height="7" fill={palette.shade} />
            <rect x="51" y="22" width="8" height="9" fill={palette.shade} /><rect x="55" y="30" width="8" height="9" fill={palette.body} /><rect x="48" y="39" width="8" height="7" fill={palette.shade} />
            <path d="M27 13h10v5h8v6h6v8h5v15h-7v6h-8v5H23v-5h-8v-7h-5V32h5v-8h6v-6h6z" fill={palette.shade} />
            <path d="M27 12h10v5h8v6h6v8h5v14h-7v6h-8v5H23v-5h-7v-7h-5V32h5v-8h6v-6h5z" fill={palette.body} />
            <rect x="21" y="25" width="11" height="10" fill="#FFE4BF" /><rect x="37" y="24" width="11" height="10" fill="#FFE4BF" />
            <rect x="23" y="26" width="6" height="6" fill="#362632" /><rect x="38" y="25" width="6" height="6" fill="#362632" />
            <rect x="28" y="28" width="2" height="2" fill="#FFF" /><rect x="40" y="27" width="2" height="2" fill="#FFF" />
            <rect x="29" y="38" width="4" height="5" fill="#6A3544" /><rect x="35" y="38" width="4" height="5" fill="#6A3544" /><rect x="32" y="39" width="4" height="6" fill="#FFF4D7" />
            <rect x="16" y="35" width="4" height="4" fill="#F3A0A0" /><rect x="48" y="34" width="4" height="4" fill="#F3A0A0" />
            <rect x="20" y="51" width="7" height="6" fill="#F8CB77" /><rect x="39" y="50" width="7" height="6" fill="#F8CB77" />
            <rect x="5" y="13" width="3" height="3" fill="#FFE28A" /><rect x="55" y="14" width="4" height="4" fill="#FFE28A" />
          </>
        )}
      </svg>
      {stage === "critical" && <span className="monster-flame" aria-hidden="true">✦</span>}
    </div>
  );
}
