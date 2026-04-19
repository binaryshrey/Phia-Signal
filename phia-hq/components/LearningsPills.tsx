"use client";

import { useMemo } from "react";
import { useProfileStore, derivelearnings, categoryColor, type Learning } from "@/lib/store";

// ─── Category metadata ──────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  complexion: { label: "Complexion",       icon: "🎨" },
  sizing:     { label: "Sizing",           icon: "📏" },
  style:      { label: "Style",            icon: "✨" },
  color:      { label: "Colors",           icon: "🌈" },
  fabric:     { label: "Fabrics & Textures", icon: "🧵" },
  brand:      { label: "Brands",           icon: "🏷️" },
  visual:     { label: "Visual Analysis",  icon: "📸" },
};

// ─── Pill ────────────────────────────────────────────────────────────────────

function Pill({ learning }: { learning: Learning }) {
  const color = categoryColor(learning.category);

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition-all duration-200 hover:scale-[1.03]"
      style={{
        backgroundColor: `${color}12`,
        borderColor: `${color}30`,
        color: "rgba(255,255,255,0.88)",
      }}
    >
      <span
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-white/50 mr-0.5">{learning.label}</span>
      <span>{learning.value}</span>
    </div>
  );
}

// ─── Category group ──────────────────────────────────────────────────────────

function CategoryGroup({ category, learnings }: { category: string; learnings: Learning[] }) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: "📌" };
  const color = categoryColor(category);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm">{meta.icon}</span>
        <h4
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: `${color}CC` }}
        >
          {meta.label}
        </h4>
        <div className="flex-1 h-px" style={{ backgroundColor: `${color}20` }} />
        <span className="text-[10px] text-white/25">{learnings.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {learnings.map((l, i) => (
          <Pill key={`${l.category}-${l.label}-${i}`} learning={l} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LearningsPills() {
  const preferences = useProfileStore((s) => s.preferences);
  const learnings = useMemo(() => derivelearnings(preferences), [preferences]);

  // Group learnings by category, preserving a consistent order
  const categoryOrder = ["complexion", "sizing", "style", "color", "fabric", "brand", "visual"];
  const grouped = useMemo(() => {
    const map = new Map<string, Learning[]>();
    for (const l of learnings) {
      if (!map.has(l.category)) map.set(l.category, []);
      map.get(l.category)!.push(l);
    }
    // Sort by predefined order, then any unknown categories at end
    const sorted: [string, Learning[]][] = [];
    for (const cat of categoryOrder) {
      const items = map.get(cat);
      if (items) sorted.push([cat, items]);
    }
    for (const [cat, items] of map) {
      if (!categoryOrder.includes(cat)) sorted.push([cat, items]);
    }
    return sorted;
  }, [learnings]);

  if (learnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <p className="text-sm text-white/20 text-center leading-relaxed">
          Complete your style profile to see<br />what Phia has learned about you
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h3 className="text-[13px] font-semibold text-white/80 tracking-tight">
            What Phia learned about you
          </h3>
          <p className="text-[10px] text-white/30 mt-0.5">
            {learnings.length} insight{learnings.length !== 1 ? "s" : ""} from your photos and preferences
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/40">Synced</span>
        </div>
      </div>

      {/* Category groups */}
      <div className="flex-1 space-y-5 overflow-y-auto scrollbar-none pb-2">
        {grouped.map(([cat, items]) => (
          <CategoryGroup key={cat} category={cat} learnings={items} />
        ))}
      </div>
    </div>
  );
}
