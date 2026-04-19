"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useProfileStore, derivelearnings, categoryColor, type Learning } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrainNode = {
  id: number;
  x: number;
  y: number;
  r: number;
};

type BrainEdge = {
  a: number;
  b: number;
};

// ─── Brain geometry ───────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let value = Math.imul(t ^ (t >>> 15), t | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function insideBrainShape(x: number, y: number) {
  const mainLobe  = (x - 48) ** 2 / 34 ** 2 + (y - 45) ** 2 / 25 ** 2 <= 1;
  const leftLobe  = (x - 30) ** 2 / 18 ** 2 + (y - 53) ** 2 / 19 ** 2 <= 1;
  const rightLobe = (x - 66) ** 2 / 18 ** 2 + (y - 52) ** 2 / 19 ** 2 <= 1;
  const lowerLobe = (x - 50) ** 2 / 30 ** 2 + (y - 62) ** 2 / 18 ** 2 <= 1;
  const stem      = (x - 68) ** 2 /  8 ** 2 + (y - 84) ** 2 / 13 ** 2 <= 1;
  const stemTip   = (x - 70) ** 2 /  5 ** 2 + (y - 95) ** 2 /  6 ** 2 <= 1;
  return mainLobe || leftLobe || rightLobe || lowerLobe || stem || stemTip;
}

function generateGraph() {
  const random = mulberry32(90210);
  const nodes: BrainNode[] = [];
  let attempts = 0;
  while (nodes.length < 115 && attempts < 14000) {
    attempts++;
    const x = 12 + random() * 76;
    const y = 15 + random() * 84;
    if (!insideBrainShape(x, y)) continue;
    const minDistance = y > 80 ? 2.8 : 3.8;
    const tooClose = nodes.some((n) => Math.hypot(n.x - x, n.y - y) < minDistance);
    if (tooClose) continue;
    nodes.push({ id: nodes.length, x, y, r: 0.75 + random() * 1.1 });
  }

  const edgeMap = new Map<string, BrainEdge>();
  for (const node of nodes) {
    const neighbors = nodes
      .filter((c) => c.id !== node.id)
      .map((c) => ({ id: c.id, distance: Math.hypot(node.x - c.x, node.y - c.y) }))
      .filter((c) => c.distance < 14.5)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    for (const nb of neighbors) {
      const a = Math.min(node.id, nb.id);
      const b = Math.max(node.id, nb.id);
      edgeMap.set(`${a}-${b}`, { a, b });
    }
  }

  return { nodes, edges: Array.from(edgeMap.values()) };
}

// ─── Map learnings → nodes ────────────────────────────────────────────────────
//
// We deterministically assign each learning to a node index so the mapping
// is stable across renders. Nodes that have no learning get a "latent" state.

function assignLearningsToNodes(nodes: BrainNode[], learnings: Learning[]): Map<number, Learning> {
  const map = new Map<number, Learning>();
  if (learnings.length === 0) return map;

  // Spread learning nodes evenly across the brain using step intervals
  const step = Math.max(1, Math.floor(nodes.length / learnings.length));
  learnings.forEach((learning, i) => {
    const nodeIndex = (i * step) % nodes.length;
    map.set(nodeIndex, learning);
  });
  return map;
}

// ─── Tooltip component ────────────────────────────────────────────────────────

function NodeTooltip({
  learning,
  x,
  y,
  svgRect,
}: {
  learning: Learning;
  x: number;       // SVG viewBox coords (0–100)
  y: number;
  svgRect: DOMRect | null;
}) {
  if (!svgRect) return null;

  // Convert SVG viewBox coords to screen px
  const scaleX = svgRect.width / 100;
  const scaleY = svgRect.height / 100;
  const screenX = svgRect.left + x * scaleX;
  const screenY = svgRect.top  + y * scaleY;

  const color = categoryColor(learning.category);

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[160px]"
      style={{
        left: screenX,
        top: screenY,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <div
        className="rounded-xl px-3 py-2 shadow-lg text-[11px] leading-snug"
        style={{
          background: "rgba(14,13,18,0.92)",
          border: `1px solid ${color}55`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="font-semibold mb-0.5"
          style={{ color }}
        >
          {learning.label}
        </div>
        <div className="text-white/80">{learning.value}</div>
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid rgba(14,13,18,0.92)`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  complexion: "Complexion",
  sizing:     "Sizing",
  style:      "Style",
  color:      "Color",
  fabric:     "Fabric",
  brand:      "Brand",
  visual:     "Visual",
};

function Legend({ learnings }: { learnings: Learning[] }) {
  const categories = [...new Set(learnings.map((l) => l.category))];
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pt-2">
      {categories.map((cat) => (
        <div key={cat} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full inline-block shrink-0"
            style={{ backgroundColor: categoryColor(cat) }}
          />
          <span className="text-[10px] text-white/50">{CATEGORY_LABELS[cat] ?? cat}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state overlay ──────────────────────────────────────────────────────

function EmptyOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
      <p className="text-[11px] text-white/30 text-center px-6 leading-relaxed">
        Complete your style profile<br />to light up Phia's brain
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BrainNodesGraph() {
  const { nodes, edges } = useMemo(() => generateGraph(), []);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgRect, setSvgRect] = useState<DOMRect | null>(null);

  const preferences = useProfileStore((s) => s.preferences);
  const learnings = useMemo(() => derivelearnings(preferences), [preferences]);
  const nodeToLearning = useMemo(() => assignLearningsToNodes(nodes, learnings), [nodes, learnings]);

  // Keep svgRect in sync for tooltip positioning
  useEffect(() => {
    function update() {
      if (svgRef.current) setSvgRect(svgRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  const hoveredLearning = hoveredNodeId !== null ? nodeToLearning.get(hoveredNodeId) : undefined;
  const hoveredNode = hoveredNodeId !== null ? nodes[hoveredNodeId] : undefined;

  const hasLearnings = learnings.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Phia's Mind Map</p>
          {hasLearnings && (
            <p className="text-[10px] text-white/30 mt-0.5">
              {learnings.length} preference{learnings.length !== 1 ? "s" : ""} learned · hover nodes to explore
            </p>
          )}
        </div>
        {hasLearnings && (
          <span className="flex items-center gap-1 text-[10px] text-white/30">
            <span className="size-1.5 rounded-full bg-white/30 inline-block" />
            latent
            <span className="size-1.5 rounded-full inline-block ml-2" style={{ backgroundColor: "#E8A87C" }} />
            learned
          </span>
        )}
      </div>

      {/* SVG */}
      <div className="relative flex-1 min-h-0">
        {!hasLearnings && <EmptyOverlay />}
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="block h-full w-full"
          role="img"
          aria-label="Interactive brain node mesh"
          onMouseLeave={() => setHoveredNodeId(null)}
        >
          {/* Edges */}
          <g>
            {edges.map((edge) => {
              const from = nodes[edge.a];
              const to   = nodes[edge.b];
              const fromLit = nodeToLearning.has(edge.a);
              const toLit   = nodeToLearning.has(edge.b);
              const lit = fromLit || toLit;
              return (
                <line
                  key={`${edge.a}-${edge.b}`}
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                  stroke={lit ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}
                  strokeWidth="0.22"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const learning = nodeToLearning.get(node.id);
              const isHovered = hoveredNodeId === node.id;
              const color = learning ? categoryColor(learning.category) : "rgba(255,255,255,0.97)";
              const opacity = hasLearnings ? (learning ? 1 : 0.2) : 0.97;

              return (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.r * 2 : node.r}
                  fill={color}
                  opacity={opacity}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => {
                    setHoveredNodeId(node.id);
                    if (svgRef.current) setSvgRect(svgRef.current.getBoundingClientRect());
                  }}
                  onMouseLeave={() => setHoveredNodeId(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Tooltip rendered outside SVG via portal-like fixed positioning */}
        {hoveredLearning && hoveredNode && (
          <NodeTooltip
            learning={hoveredLearning}
            x={hoveredNode.x}
            y={hoveredNode.y}
            svgRect={svgRect}
          />
        )}
      </div>

      {/* Legend */}
      {hasLearnings && <Legend learnings={learnings} />}
    </div>
  );
}
