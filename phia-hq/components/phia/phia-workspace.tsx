"use client";

import Image from "next/image";
import { Bodoni_Moda } from "next/font/google";
import { Toaster, toast } from "sonner";
import {
  EllipsisVertical,
  Layers3,
  Maximize,
  Minus,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  ZoomIn,
} from "lucide-react";
import {
  RiArrowRightSLine,
  RiBatteryFill,
  RiBodyScanLine,
  RiBookmarkLine,
  RiCake2Line,
  RiCloseCircleLine,
  RiCloseLine,
  RiDiamondLine,
  RiEyeOffLine,
  RiEyeLine,
  RiGift2Fill,
  RiHomeLine,
  RiImageLine,
  RiLink,
  RiMacFill,
  RiNotification2Fill,
  RiNotification2Line,
  RiPlayFill,
  RiPriceTag3Line,
  RiQuestionLine,
  RiSearch2Line,
  RiSearchLine,
  RiSettingsLine,
  RiShare2Line,
  RiShirtLine,
  RiShoppingBagLine,
  RiSparklingLine,
  RiSignalWifi3Fill,
  RiSmartphoneFill,
  RiUser4Line,
} from "@remixicon/react";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ReviewsFeed } from "@/components/phia/reviews-feed";
import { Button } from "@/components/ui/button";
import brandsData from "@/db/brands.json";
import curatedData from "@/db/curated.json";
import exploreFeedData from "@/db/explore_feed.json";
import recommendedData from "@/db/recommended.json";
import searchData from "@/db/search.json";
import trendingData from "@/db/trending.json";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useProfileStore, useTryOnCacheStore, type UserPreferences } from "@/lib/store";
import { useSharedCartStore } from "@/lib/shared-cart";

type ViewState = {
  x: number;
  y: number;
  scale: number;
};

type PreviewStage = "idle" | "splash" | "feed";
type PreviewTab = "Explore" | "For You" | "Trending";

type ExploreCard = {
  id: string;
  entityType: string;
  variant: string;
  name: string;
  primaryBrandName: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  detailRows: Array<{ label: string; value: string }>;
  linkUrl: string;
};

type FeedItem = {
  id?: string | null;
  variant?: string | null;
  entityType?: string | null;
  product?: {
    name?: string | null;
    description?: string | null;
    priceUsd?: string | number | null;
    productUrl?: string | null;
    imgUrl?: string | null;
    additionalImgUrls?: string[] | null;
    primaryBrandName?: string | null;
    sourceDisplayName?: string | null;
    domain?: string | null;
    colorString?: string | null;
    sizeDisplayName?: string | null;
    gender?: string | null;
  } | null;
  outfit?: {
    title?: string | null;
    description?: string | null;
    imgUrl?: string | null;
    imgUrls?: string[] | null;
    isFeatured?: boolean | null;
    isPublished?: boolean | null;
    order?: number | null;
    products?: Array<{
      itemName?: string | null;
      brand?: string | null;
      price?: string | number | null;
      linkToProduct?: string | null;
      imageLink?: string | null;
    }> | null;
  } | null;
  editorial?: {
    title?: string | null;
    headline?: string | null;
    description?: string | null;
    imgUrl?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  } | null;
};

type FeedImport = {
  data?: {
    exploreFeed?: {
      sections?: Array<{
        data?: {
          items?: FeedItem[];
        };
      }>;
    };
  };
};

type CuratedCard = {
  id: string;
  name: string;
  imageUrl: string;
};

type TrendCard = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  linkUrl: string;
};

type TrendingCollectionCard = {
  id: string;
  title: string;
  imageUrl: string;
  products: Array<{
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    linkUrl: string;
  }>;
};

type CuratedImport = {
  data?: {
    curatedTypes?: Array<{
      typeId?: string | null;
      name?: string | null;
      imgUrl?: string | null;
    }>;
  };
};

type RecommendedImport = {
  items?: Array<{
    id?: string | null;
    name?: string | null;
    brand?: string | null;
    image?: string | null;
    url?: string | null;
  }>;
};

type TrendingImport = {
  data?: {
    outfits?: Array<{
      outfitId?: string | null;
      title?: string | null;
      imgUrl?: string | null;
      products?: Array<{
        productId?: string | null;
        itemName?: string | null;
        brand?: string | null;
        imageLink?: string | null;
        linkToProduct?: string | null;
      }> | null;
    }>;
  };
};

type TrendingBrandListItem = {
  id: string;
  name: string;
  logoUrl: string;
  brandUrl: string;
  visitCount: number;
  trendingRank: number;
};

type SearchLookCard = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
};

type SearchBrandCard = {
  id: string;
  name: string;
  imageUrl: string;
  brandUrl: string;
};

type SearchImport = {
  data?: {
    popularSearches?: Array<{
      rank?: string | number | null;
      category?: string | null;
      imgUrl?: string | null;
      query?: string | null;
    }>;
  };
};

type BrandsImport = {
  data?: {
    trendingBrands?: Array<{
      id?: string | null;
      name?: string | null;
      imgUrl?: string | null;
      logoUrl?: string | null;
      brandUrl?: string | null;
      visitCount?: number | null;
      trendingRank?: number | null;
    }>;
  };
};

const DEFAULT_VIEW: ViewState = {
  x: 0,
  y: 0,
  scale: 1,
};

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.65;
const DOT_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Ccircle cx='11' cy='11' r='1' fill='%235F5C6C' /%3E%3C/svg%3E\")";
const PREVIEW_TABS: PreviewTab[] = ["Explore", "For You", "Trending"];
const TREND_SAMPLE_SIZE = 5;
const TRENDING_BRANDS_LIMIT = 27;
const SEARCH_LOOK_LIMIT = 8;
const SEARCH_BRAND_LIMIT = 8;
const TREND_ROTATION_SEED = Date.now();
const TRENDING_VIEWS_SEED = Date.now();
const TRENDING_BRANDS_RANK_SEED = Date.now();
const SEARCH_BRAND_SEED = Date.now();
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function seededNumberFromString(seed: string, min: number, max: number) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const span = max - min + 1;
  return min + (Math.abs(hash) % span);
}

function formatPrice(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return "";
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return `$${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  return String(value);
}

function formatVisitCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 visits";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K visits`;
  }

  return `${Math.round(value)} visits`;
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function formatStatusTime(date: Date) {
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function isSameView(a: ViewState, b: ViewState) {
  return a.x === b.x && a.y === b.y && a.scale === b.scale;
}

function WorkspaceControlButton({
  active = false,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  active?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn(
        "h-10 w-10 rounded-xl border-white/10 bg-white/5 text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur hover:bg-white/10 hover:text-white",
        active && "border-white/16 bg-black/40 text-white",
        className,
      )}
      {...props}
    />
  );
}

// ─── Draggable Agent Node ─────────────────────────────────────────────────────

function DraggableAgentCard({
  defaultX,
  defaultY,
  children,
}: {
  defaultX: number;
  defaultY: number;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    const dy = e.clientY - dragging.current.startY;
    setPos({ x: dragging.current.origX + dx, y: dragging.current.origY + dy });
  };

  const onPointerUp = () => {
    dragging.current = null;
  };

  return (
    <div
      className="absolute z-20 cursor-grab active:cursor-grabbing select-none"
      style={{ left: pos.x, top: pos.y }}
      data-drag-ignore="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}
    </div>
  );
}

// ─── Agent Nodes with animated connections ───────────────────────────────────

const AGENT_DEFS = [
  { id: "style", label: "Style Agent", status: "Analyzing preferences", color: "#C9A84C", bgColor: "#8B6914", x: -340, y: 20, targetY: 200 },
  { id: "discovery", label: "Discovery Agent", status: "Curating feed", color: "#818cf8", bgColor: "#6366f1", x: -360, y: 180, targetY: 300 },
  { id: "tryon", label: "Try-On Agent", status: "Virtual fitting ready", color: "#34d399", bgColor: "#10b981", x: -340, y: 340, targetY: 390 },
  { id: "sizing", label: "Sizing Agent", status: "Body analysis active", color: "#fbbf24", bgColor: "#f59e0b", x: -360, y: 500, targetY: 470 },
] as const;

function AgentNodes({ showFeedbackAgent = false }: { showFeedbackAgent?: boolean }) {
  const prefs = useProfileStore((s) => s.preferences);
  const savePreferences = useProfileStore((s) => s.savePreferences);
  const sizingLabels: string[] = [];
  if (prefs.clothingSize) sizingLabels.push(prefs.clothingSize);
  if (prefs.pantSize) sizingLabels.push(`${prefs.pantSize}"`);
  if (prefs.shoeSize) sizingLabels.push(`US ${prefs.shoeSize}`);

  // Sizing Agent voice
  const [sizingActive, setSizingActive] = useState(false);
  const [sizingStatus, setSizingStatus] = useState("");
  const sizingWsRef = useRef<WebSocket | null>(null);
  const sizingAudioCtxRef = useRef<AudioContext | null>(null);
  const sizingNextPlayRef = useRef(0);
  const sizingSampleRateRef = useRef(16000);
  const sizingTranscriptRef = useRef<string[]>([]);
  const sizingMicStreamRef = useRef<MediaStream | null>(null);
  const sizingProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const playSizingChunk = useCallback((base64: string) => {
    const ctx = sizingAudioCtxRef.current;
    if (!ctx || ctx.state !== "running") return;
    const raw = atob(base64);
    const pcm16 = new Int16Array(raw.length / 2);
    for (let i = 0; i < pcm16.length; i++) {
      pcm16[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
    }
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }
    const buffer = ctx.createBuffer(1, float32.length, sizingSampleRateRef.current);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const t = Math.max(ctx.currentTime, sizingNextPlayRef.current);
    source.start(t);
    sizingNextPlayRef.current = t + buffer.duration;
  }, []);

  const analyzeSizingTranscript = useCallback(() => {
    const transcript = sizingTranscriptRef.current.join(" ").toLowerCase();
    console.log("[Sizing] Analyzing transcript:", transcript);

    const updates: Partial<typeof prefs> = {};

    // Clothing sizes — search the LAST mentioned size (most recent intent wins)
    const clothingMap: [RegExp, string][] = [
      [/\bextra\s*extra\s*extra\s*large\b|triple\s*x\s*l\b|\bxxxl\b/, "XXXL"],
      [/\bextra\s*extra\s*large\b|double\s*x\s*l\b|\bxxl\b|\b2xl\b/, "XXL"],
      [/\bextra\s*large\b|\bx\s*l\b|\bxl\b/, "XL"],
      [/\blarge\b|\bsize\s+l\b|\bto\s+l\b|\bit\s+l\b/, "L"],
      [/\bmedium\b|\bsize\s+m\b|\bto\s+m\b|\bit\s+m\b/, "M"],
      [/\bextra\s*small\b|\bx\s*s\b|\bxs\b/, "XS"],
      [/(?<!\w)small\b|\bsize\s+s\b|\bto\s+s\b|\bit\s+s\b/, "S"],
    ];

    // Find all matches with their position, pick the last one
    let lastClothingMatch: { pos: number; size: string } | null = null;
    for (const [pattern, size] of clothingMap) {
      const matches = [...transcript.matchAll(new RegExp(pattern.source, "gi"))];
      for (const m of matches) {
        const pos = m.index ?? 0;
        if (!lastClothingMatch || pos > lastClothingMatch.pos) {
          lastClothingMatch = { pos, size };
        }
      }
    }
    if (lastClothingMatch) {
      updates.clothingSize = lastClothingMatch.size;
    }

    // Pant/waist sizes — match "32", "size 32", "waist 32", "pant size 32", "change to 30", "thirty two"
    const numberWords: Record<string, string> = {
      "twenty six": "26", "twenty eight": "28", "thirty": "30", "thirty two": "32",
      "thirty four": "34", "thirty six": "36", "thirty eight": "38", "forty": "40",
    };
    // Replace number words
    let transcriptNorm = transcript;
    for (const [word, num] of Object.entries(numberWords)) {
      transcriptNorm = transcriptNorm.replace(new RegExp(word, "g"), num);
    }

    const pantSizes = ["40", "38", "36", "34", "32", "30", "28", "26"];
    for (const s of pantSizes) {
      // Match: "32", "size 32", "waist 32", "pant 32", "change to 32", "update to 32", "make it 32"
      if (new RegExp(`(?:size|waist|pant|change\\s+(?:it\\s+)?to|update\\s+(?:it\\s+)?to|make\\s+it)\\s+${s}\\b`).test(transcriptNorm) ||
          new RegExp(`\\b${s}\\s*(?:inch|waist|pant)`, "i").test(transcriptNorm) ||
          // Simple mention of the number in sizing context
          new RegExp(`\\b${s}\\b`).test(transcriptNorm)) {
        updates.pantSize = s;
        break;
      }
    }

    // Shoe sizes
    const shoeSizes = ["13", "12", "11", "10.5", "10", "9.5", "9", "8.5", "8", "7.5", "7", "6"];
    for (const s of shoeSizes) {
      if (new RegExp(`shoe\\s*(?:size)?\\s*${s.replace(".", "\\.")}\\b`).test(transcriptNorm) ||
          new RegExp(`\\bus\\s*${s.replace(".", "\\.")}\\b`).test(transcriptNorm) ||
          new RegExp(`(?:size|change\\s+(?:it\\s+)?to|update\\s+(?:it\\s+)?to)\\s*${s.replace(".", "\\.")}\\b`).test(transcriptNorm)) {
        updates.shoeSize = s;
        break;
      }
    }

    console.log("[Sizing] Detected updates:", updates);
    if (Object.keys(updates).length > 0) {
      savePreferences(updates);
      console.log("[Sizing] Preferences updated:", updates);
    }
  }, [prefs, savePreferences]);

  const stopSizingAgent = useCallback(() => {
    analyzeSizingTranscript();
    sizingWsRef.current?.close();
    sizingWsRef.current = null;
    sizingMicStreamRef.current?.getTracks().forEach((t) => t.stop());
    sizingMicStreamRef.current = null;
    sizingProcessorRef.current?.disconnect();
    sizingProcessorRef.current = null;
    sizingAudioCtxRef.current?.close();
    sizingAudioCtxRef.current = null;
    setSizingActive(false);
    setSizingStatus("");
  }, [analyzeSizingTranscript]);

  const startSizingAgent = useCallback(async () => {
    const agentId = "agent_8001kpjzvmdjega936zzghqhc9qe";
    setSizingActive(true);
    setSizingStatus("Connecting...");
    sizingTranscriptRef.current = [];

    try {
      // Get mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sizingMicStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      await audioCtx.resume();
      sizingAudioCtxRef.current = audioCtx;
      sizingNextPlayRef.current = audioCtx.currentTime;

      // Mic capture → PCM base64
      const micSource = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      sizingProcessorRef.current = processor;

      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`);
      sizingWsRef.current = ws;

      let initialized = false;

      processor.onaudioprocess = (e) => {
        if (!initialized || ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32768)));
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        ws.send(JSON.stringify({ user_audio_chunk: btoa(binary) }));
      };

      micSource.connect(processor);
      processor.connect(audioCtx.destination);

      ws.onopen = () => setSizingStatus("Listening...");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case "conversation_initiation_metadata": {
              initialized = true;
              const fmt = String(msg.conversation_initiation_metadata_event?.agent_output_audio_format ?? "");
              const m = fmt.match(/pcm_(\d+)/i);
              if (m?.[1]) sizingSampleRateRef.current = Number(m[1]);
              setSizingStatus("Speak your sizing...");
              break;
            }
            case "audio":
              if (msg.audio_event?.audio_base_64) {
                setSizingStatus("Agent speaking...");
                playSizingChunk(msg.audio_event.audio_base_64);
              }
              break;
            case "user_transcript":
              if (msg.user_transcription_event?.user_transcript) {
                sizingTranscriptRef.current.push(msg.user_transcription_event.user_transcript);
                setSizingStatus(`You: "${msg.user_transcription_event.user_transcript}"`);
              }
              break;
            case "agent_response":
              if (msg.agent_response_event?.agent_response) {
                sizingTranscriptRef.current.push(msg.agent_response_event.agent_response);
                setSizingStatus("Agent speaking...");
              }
              break;
            case "ping":
              ws.send(JSON.stringify({ type: "pong", event_id: msg.ping_event?.event_id }));
              break;
          }
        } catch { /* skip */ }
      };

      ws.onclose = () => {
        if (sizingActive) stopSizingAgent();
      };
      ws.onerror = () => stopSizingAgent();
    } catch (err) {
      console.error("Sizing agent error:", err);
      setSizingActive(false);
      setSizingStatus("");
    }
  }, [playSizingChunk, sizingActive, stopSizingAgent]);

  const toggleSizingAgent = useCallback(() => {
    if (sizingActive) {
      stopSizingAgent();
    } else {
      startSizingAgent();
    }
  }, [sizingActive, stopSizingAgent, startSizingAgent]);

  const svgW = 900;
  const svgH = 700;
  const svgLeft = -300;
  const svgTop = -40;
  // Phone center-left edge is ~152px from origin (phone is 305px wide centered at 0)
  const phoneEdgeX = -10;

  return (
    <>
      {/* SVG connections with flowing particle animation */}
      <svg
        className="absolute z-10 pointer-events-none"
        style={{ width: svgW, height: svgH, left: svgLeft, top: svgTop }}
      >
        <defs>
          {AGENT_DEFS.map((a) => (
            <linearGradient key={`grad-${a.id}`} id={`grad-${a.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={a.bgColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={a.bgColor} stopOpacity="0.08" />
            </linearGradient>
          ))}
        </defs>

        {AGENT_DEFS.map((a) => {
          const startX = -svgLeft + a.x + 200;
          const startY = -svgTop + a.y + 40;
          const endX = -svgLeft + phoneEdgeX;
          const endY = -svgTop + a.targetY;
          const cp1x = startX + (endX - startX) * 0.4;
          const cp2x = startX + (endX - startX) * 0.7;
          const pathD = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;

          return (
            <g key={a.id}>
              {/* Dashed connection line */}
              <path d={pathD} stroke={`url(#grad-${a.id})`} strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
              {/* Start dot */}
              <circle cx={startX} cy={startY} r="3" fill={a.bgColor} opacity="0.6" />
              {/* End dot */}
              <circle cx={endX} cy={endY} r="3" fill={a.bgColor} opacity="0.3" />
              {/* Animated flowing particle */}
              <circle r="3" fill={a.color} opacity="0.9">
                <animateMotion dur={`${2 + Math.random()}s`} repeatCount="indefinite" path={pathD} />
              </circle>
              <circle r="6" fill={a.color} opacity="0.2">
                <animateMotion dur={`${2 + Math.random()}s`} repeatCount="indefinite" path={pathD} />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Draggable agent cards inside Phia Signal border */}
      <div
        className="absolute z-10 pointer-events-none rounded-3xl border border-dashed border-white/10 bg-white/[0.03]"
        style={{ left: -390, top: -10, width: 270, height: 640 }}
      >
        {/* Title */}
        <div className="absolute -top-3 left-4 px-2 bg-[#0E0D12]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Phia Signal</span>
        </div>
      </div>

      <DraggableAgentCard defaultX={AGENT_DEFS[0].x} defaultY={AGENT_DEFS[0].y}>
        <div className="relative w-[200px] rounded-2xl border border-white/10 bg-[#1a1a22]/80 backdrop-blur-md p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <img src="/Rectangle.svg" alt="" className="absolute top-2 right-2 h-[2.2em] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-[#8B6914]/20">
              <RiSparklingLine className="size-3.5 text-[#C9A84C]" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Style Agent</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/40">Analyzing preferences</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-[#8B6914]/15 px-2 py-0.5 text-[8px] font-medium text-[#C9A84C]">Minimal</span>
              <span className="rounded-full bg-[#8B6914]/15 px-2 py-0.5 text-[8px] font-medium text-[#C9A84C]">Classic</span>
            </div>
          </div>
        </div>
      </DraggableAgentCard>

      <DraggableAgentCard defaultX={AGENT_DEFS[1].x} defaultY={AGENT_DEFS[1].y}>
        <div className="relative w-[200px] rounded-2xl border border-white/10 bg-[#1a1a22]/80 backdrop-blur-md p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <img src="/Rectangle1.svg" alt="" className="absolute top-2 right-2 h-[2.2em] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/20">
              <RiSearchLine className="size-3.5 text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Discovery Agent</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/40">Feed Curated</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-full rounded-full bg-indigo-500/40" />
            </div>
          </div>
        </div>
      </DraggableAgentCard>

      <DraggableAgentCard defaultX={AGENT_DEFS[2].x} defaultY={AGENT_DEFS[2].y}>
        <div className="relative w-[200px] rounded-2xl border border-white/10 bg-[#1a1a22]/80 backdrop-blur-md p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <img src="/k_pop_guru.svg" alt="" className="absolute top-2 right-2 h-[2.2em] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20">
              <RiShirtLine className="size-3.5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Try-On Agent</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/40">Virtual fitting ready</span>
            </div>
            <div className="flex gap-1">
              <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20" />
              <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20" />
              <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20" />
            </div>
          </div>
        </div>
      </DraggableAgentCard>

      <DraggableAgentCard defaultX={AGENT_DEFS[3].x} defaultY={AGENT_DEFS[3].y}>
        <div className={cn(
          "relative w-[200px] rounded-2xl border bg-[#1a1a22]/80 backdrop-blur-md p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          sizingActive ? "border-amber-500/40" : "border-white/10",
        )}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSizingAgent(); }}
            className="absolute top-2 right-2 z-10 cursor-pointer"
          >
            {sizingActive ? (
              <div className="flex size-[2.2em] items-center justify-center rounded-lg bg-amber-500/30">
                <svg viewBox="0 0 24 24" className="size-4 text-amber-400" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </div>
            ) : (
              <img src="/yoga.svg" alt="Start sizing agent" className="h-[2.2em]" />
            )}
          </button>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20">
              <RiBodyScanLine className="size-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Sizing Agent</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className={cn("size-1.5 rounded-full", sizingActive ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse")} />
              <span className="text-white/40 truncate max-w-[150px]">
                {sizingActive ? sizingStatus || "Connecting..." : "Body analysis active"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {sizingLabels.length > 0 ? sizingLabels.map((label) => (
                <span key={label} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-medium text-amber-400">{label}</span>
              )) : (
                <span className="text-[8px] text-white/25">No data yet</span>
              )}
            </div>
          </div>
        </div>
      </DraggableAgentCard>

      {/* Feedback Agent — right side, appears on share */}
      {showFeedbackAgent && (
        <>
          {/* Connection line from phone to feedback agent */}
          <svg
            className="absolute z-10 pointer-events-none"
            style={{ width: 500, height: 300, left: 305, top: 150 }}
          >
            <defs>
              <linearGradient id="grad-feedback" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M 0 130 C 100 130, 200 80, 310 80" stroke="url(#grad-feedback)" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
            <circle cx="0" cy="130" r="3" fill="#eab308" opacity="0.3" />
            <circle cx="310" cy="80" r="3" fill="#eab308" opacity="0.6" />
            {/* Particles flow from agent → phone (reverse direction) */}
            <circle r="3" fill="#facc15" opacity="0.9">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 310 80 C 200 80, 100 130, 0 130" />
            </circle>
            <circle r="6" fill="#facc15" opacity="0.2">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 310 80 C 200 80, 100 130, 0 130" />
            </circle>
          </svg>

          <DraggableAgentCard defaultX={460} defaultY={200}>
            <div className="relative w-[200px] rounded-2xl border border-white/10 bg-[#1a1a22]/80 backdrop-blur-md p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-left-4 duration-500">
              <img src="/social.svg" alt="" className="absolute top-2 right-2 h-[2.2em] pointer-events-none" />
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-yellow-500/20">
                  <RiNotification2Fill className="size-3.5 text-yellow-400" />
                </div>
                <span className="text-[11px] font-semibold text-white/80">Feedback Agent</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px]">
                  <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-white/40">Collecting feedback from friends!</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-yellow-500/40 animate-pulse" />
                </div>
              </div>
            </div>
          </DraggableAgentCard>
        </>
      )}
    </>
  );
}

// ─── Product Detail Overlay with Try-On ──────────────────────────────────────

function ProductDetailOverlay({
  product,
  scrollTop,
  containerHeight,
  onClose,
  userPhotos,
  onAddToCart,
  isInCart,
  onShare,
}: {
  product: {
    id: string;
    imageUrl: string;
    name: string;
    brand: string;
    description: string;
    linkUrl: string;
    details: Array<{ label: string; value: string }>;
  };
  scrollTop: number;
  containerHeight: number | string;
  onClose: () => void;
  userPhotos: UserPreferences;
  onAddToCart: (item: TrendCard) => void;
  isInCart: boolean;
  onShare?: () => void;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const price = product.details.find((r) => r.label === "Price")?.value ?? null;

  // Celebrity try-on with persistence
  const selectedCelebs = userPhotos.celebrities ?? [];
  const celebList = selectedCelebs.length > 0 ? selectedCelebs : Object.keys(CELEB_DATA);
  const productKey = product.imageUrl;
  const { saveTryOn, getTryOn } = useTryOnCacheStore();
  const cachedResults = getTryOn(productKey);
  const [tryOnResults, setTryOnResults] = useState<{ label: string; src: string }[]>(cachedResults);
  const hasTryOnImage = tryOnResults.length > 0;

  // If cached results exist, mark as loaded
  useEffect(() => {
    if (cachedResults.length > 0 && !tryOnImage) {
      setTryOnImage("loaded");
      setTryOnResults(cachedResults);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build carousel images array
  const images: { src: string; label: string }[] = [
    { src: product.imageUrl, label: "Product" },
    ...tryOnResults,
  ];

  const handleTryOn = async () => {
    setTryOnLoading(true);
    setTryOnError(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // Build person image URLs: user's photo (4.png) + selected celebrities
    const personEntries: { label: string; personUrl: string }[] = [
      { label: "Your Try On", personUrl: `${origin}/celebrities/tryon/4.png` },
      ...celebList.map((id) => ({
        label: CELEB_DATA[id]?.name ?? id,
        personUrl: `${origin}/celebrities/tryon/${id}.png`,
      })),
    ];

    const results: { label: string; src: string }[] = [];

    // Call VTO API for each person in parallel
    const promises = personEntries.map(async (entry) => {
      try {
        const res = await fetch("/api/virtual-tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productImageUrl: product.imageUrl,
            userImageUrls: [entry.personUrl],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.tryOn) {
            results.push({ label: entry.label, src: data.tryOn });
          }
        }
      } catch {
        // Skip failed try-ons
      }
    });

    await Promise.allSettled(promises);

    if (results.length > 0) {
      setTryOnResults(results);
      saveTryOn(productKey, results);
      setTryOnImage("loaded");
      setTimeout(() => scrollToSlide(1), 100);
    } else {
      setTryOnError("Try-on generation failed");
    }

    setTryOnLoading(false);
  };

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const slideWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: index * slideWidth,
      behavior: "smooth",
    });
    setActiveSlide(index);
  };

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const slideWidth = el.clientWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveSlide(Math.max(0, Math.min(index, images.length - 1)));
  };

  return (
    <div
      className="absolute left-0 right-0 z-50 flex flex-col bg-[#F5F5F5] rounded-t-[48px]"
      style={{ top: scrollTop, height: containerHeight }}
    >
      {/* Image carousel */}
      <div className="relative p-3 pt-4 shrink-0">
        <div className="relative overflow-hidden rounded-3xl bg-white">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <div
                key={i}
                className="w-full shrink-0 snap-center cursor-zoom-in"
                onClick={() => setEnlargedImage(img.src)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`${product.name} - ${img.label}`}
                  className="w-full aspect-[1/1] object-cover"
                />
              </div>
            ))}
          </div>

          {/* Slide indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === activeSlide ? "w-4 bg-black/70" : "w-1.5 bg-black/20",
                  )}
                />
              ))}
            </div>
          )}

          {/* Price badge */}
          {price && activeSlide === 0 && (
            <div className="absolute left-3 bottom-8 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1">
              <span className="text-[12px] font-semibold text-white">
                {price}
              </span>
            </div>
          )}

          {/* Slide label */}
          {activeSlide > 0 && (
            <div className="absolute left-3 bottom-8 rounded-full bg-white/85 backdrop-blur-sm px-2.5 py-1">
              <span className="text-[10px] font-semibold text-black/60">
                {images[activeSlide]?.label}
              </span>
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-6 top-7 flex size-8 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm shadow-sm"
        >
          <RiArrowRightSLine className="size-4 rotate-180 text-black/70" />
        </button>

        {/* Bookmark */}
        <button
          type="button"
          className="absolute right-6 top-7 flex size-8 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm shadow-sm"
        >
          <RiBookmarkLine className="size-3.5 text-black/70" />
        </button>
      </div>

      {/* Product info */}
      <div className="px-4 pt-2 pb-6 space-y-3 overflow-y-auto flex-1 min-h-0">
        {/* Brand & name */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
            {product.brand}
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold leading-snug text-black/90">
            {product.name}
          </h2>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-[12px] leading-relaxed text-black/50">
            {product.description}
          </p>
        )}

        {/* Detail pills */}
        {product.details.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.details.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px]"
              >
                <span className="font-medium text-black/35">{row.label}</span>
                <span className="font-semibold text-black/70">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sizing — show shoe size for footwear, dress size for clothing */}
        {(() => {
          const n = product.name.toLowerCase();
          const isShoe = /shoe|sneaker|boot|sandal|loafer|mule|heel|pump|slipper|clog|flat|oxford|espadrille|slide/i.test(n);
          const isDress = !isShoe;

          if (isShoe) return (
            <div>
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1.5">Shoe Size (US)</p>
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5">
                {["6", "7", "8", "9", "10", "11", "12", "13"].map((s) => {
                  const isRecommended = userPhotos.shoeSize === s;
                  return (
                    <div key={s} className="relative shrink-0">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-[11px] font-semibold border transition-all",
                        isRecommended ? "bg-[#8B6914] border-[#8B6914] text-white shadow-sm" : "bg-white border-black/8 text-black/60",
                      )}>{s}</div>
                      {isRecommended && <span className="absolute -top-1.5 -right-1 text-[7px] font-bold text-[#8B6914] bg-[#F5EFE6] rounded px-0.5">REC</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );

          if (isDress) return (
            <div>
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1.5">Size</p>
              <div className="flex gap-1.5">
                {["XS", "S", "M", "L", "XL", "XXL"].map((s) => {
                  const isRecommended = userPhotos.clothingSize === s;
                  return (
                    <div key={s} className="relative">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-[11px] font-semibold border transition-all",
                        isRecommended ? "bg-[#8B6914] border-[#8B6914] text-white shadow-sm" : "bg-white border-black/8 text-black/60",
                      )}>{s}</div>
                      {isRecommended && <span className="absolute -top-1.5 -right-1 text-[7px] font-bold text-[#8B6914] bg-[#F5EFE6] rounded px-0.5">REC</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );

          return null;
        })()}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              onAddToCart({
                id: product.id,
                name: product.name,
                brand: product.brand,
                imageUrl: product.imageUrl,
                linkUrl: product.linkUrl,
              })
            }
            disabled={isInCart}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold",
              isInCart
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-black text-white",
            )}
          >
            <RiShoppingBagLine className="size-3.5" />
            {isInCart ? "Added" : "Add to Bag"}
          </button>

          {/* Try On button */}
          <button
            type="button"
            onClick={handleTryOn}
            disabled={tryOnLoading || hasTryOnImage}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all",
              hasTryOnImage
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : tryOnLoading
                  ? "bg-violet-50 text-violet-400"
                  : "bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100",
            )}
          >
            {tryOnLoading ? (
              <>
                <svg
                  className="size-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Trying…
              </>
            ) : hasTryOnImage ? (
              <>
                <RiImageLine className="size-3.5" />
                Done
              </>
            ) : (
              <>
                <RiShirtLine className="size-3.5" />
                Try On
              </>
            )}
          </button>

          <button
            type="button"
            className="flex items-center justify-center rounded-xl bg-white px-3 py-2.5"
            onClick={() => onShare?.()}
          >
            <RiShare2Line className="size-4 text-black/50" />
          </button>
        </div>

        {/* Try-on error */}
        {tryOnError && (
          <p className="text-[11px] text-red-500/70 text-center">
            {tryOnError}
          </p>
        )}

        {/* Visit store link */}
        {product.linkUrl && (
          <a
            href={product.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-black/8 py-2 text-[11px] font-medium text-black/50"
          >
            <RiLink className="size-3" />
            Visit Store
          </a>
        )}
      </div>

      {/* Enlarged image viewer */}
      {enlargedImage && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            type="button"
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-white/25"
          >
            <RiCloseLine className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enlargedImage}
            alt={product.name}
            className="max-w-[95%] max-h-[90%] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Celebrity Watchlist Slider ───────────────────────────────────────────────

const CELEB_DATA: Record<string, { name: string; image: string }> = {
  "jasmine-tookes": { name: "Jasmine Tookes", image: "/celebrities/jasmine-tookes.jpg" },
  "paris-hilton": { name: "Paris Hilton", image: "/celebrities/paris-hilton.jpg" },
  "toni-breidinger": { name: "Toni Breidinger", image: "/celebrities/toni-breidinger.jpg" },
  "zara-larsson": { name: "Zara Larsson", image: "/celebrities/zara-larsson.jpg" },
  "mckenna-grace": { name: "McKenna Grace", image: "/celebrities/mckenna-grace.jpg" },
  "hanna-goefft": { name: "Hanna Goefft", image: "/celebrities/hanna-goefft.jpg" },
  "zendaya": { name: "Zendaya", image: "/celebrities/zendaya.jpg" },
  "chloe-shih": { name: "Chloe Shih", image: "/celebrities/chloe-shih.jpg" },
};

function CelebrityWatchlist({ celebrities }: { celebrities: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const celebs = celebrities
    .map((id) => CELEB_DATA[id] ? { id, ...CELEB_DATA[id] } : null)
    .filter((c): c is { id: string; name: string; image: string } => c !== null);

  if (celebs.length === 0) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const slideWidth = el.clientWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveIndex(Math.max(0, Math.min(index, celebs.length - 1)));
  };

  return (
    <div className="mb-5 mt-4">
      <h2
        className={cn(
          bodoniModa.className,
          "text-[16px] leading-[1.05] tracking-[-0.02em] text-black mb-3",
        )}
      >
        Celebrity Watchlist
      </h2>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto snap-x snap-mandatory rounded-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max">
          {celebs.map((c) => (
            <div
              key={c.id}
              className="relative w-[calc(100vw-100px)] max-w-[280px] shrink-0 snap-center aspect-[4/5] overflow-hidden rounded-2xl"
              style={{ marginRight: celebs.length > 1 ? "8px" : 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[14px] font-semibold text-white drop-shadow-sm">
                  {c.name}
                </p>
                <p className="text-[10px] text-white/70 italic">Closet Finds</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {celebs.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {celebs.map((c, i) => (
            <span
              key={c.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === activeIndex ? "w-4 bg-black/60" : "w-1.5 bg-black/15",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Explore Preview Screen ──────────────────────────────────────────────────

function ExplorePreviewScreen({
  items,
  curatedTypes,
  trendItems,
  trendingBrands,
  searchLookCards,
  searchBrandCards,
  trendingCollections,
  activeTab,
  onTabChange,
  topRoundedClassName,
  showStatusBar = false,
  onShareTriggered,
}: {
  items: ExploreCard[];
  curatedTypes: CuratedCard[];
  trendItems: TrendCard[];
  trendingBrands: TrendingBrandListItem[];
  searchLookCards: SearchLookCard[];
  searchBrandCards: SearchBrandCard[];
  trendingCollections: TrendingCollectionCard[];
  activeTab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  topRoundedClassName?: string;
  showStatusBar?: boolean;
  onShareTriggered?: () => void;
}) {
  type PreviewBottomNav = "home" | "search" | "cart" | "saved" | "profile";
  type SavedMode = "Wishlists" | "Items" | "Brands";
  type CartMode = "Bag" | "Socials";
  const tabItems = activeTab === "Explore" ? items : [];
  const trendCarouselRef = useRef<HTMLDivElement | null>(null);
  const [activeTrendSlide, setActiveTrendSlide] = useState(0);
  const [activeBottomNav, setActiveBottomNav] =
    useState<PreviewBottomNav>("home");
  const [activeSavedMode, setActiveSavedMode] =
    useState<SavedMode>("Wishlists");
  const [activeCartMode, setActiveCartMode] = useState<CartMode>("Bag");
  const [selectedSignalItem, setSelectedSignalItem] =
    useState<TrendCard | null>(null);
  type ProductDetail = {
    id: string;
    imageUrl: string;
    name: string;
    brand: string;
    description: string;
    linkUrl: string;
    details: Array<{ label: string; value: string }>;
  };
  const [cartItems, setCartItems] = useState<TrendCard[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null,
  );

  const openProduct = (p: {
    id?: string;
    imageUrl: string;
    name?: string;
    title?: string;
    brand?: string;
    primaryBrandName?: string;
    description?: string;
    linkUrl?: string;
    detailRows?: Array<{ label: string; value: string }>;
  }) => {
    const fallbackId =
      p.linkUrl || p.imageUrl || p.name || p.title || `product-${Date.now()}`;

    setSelectedProduct({
      id: p.id ?? fallbackId,
      imageUrl: p.imageUrl,
      name: p.name || p.title || "Untitled",
      brand: p.brand || p.primaryBrandName || "",
      description: p.description || "",
      linkUrl: p.linkUrl || "",
      details: (p.detailRows || []).filter(
        (r) => r.label !== "ID" && r.label !== "Type" && r.label !== "Variant",
      ),
    });
  };

  const addToCart = (item: TrendCard) => {
    setCartItems((previous) => {
      if (previous.some((cartItem) => cartItem.id === item.id)) {
        return previous;
      }

      return [item, ...previous];
    });
  };

  const cartItemCount = cartItems.length;
  const cartBadgeLabel = cartItemCount > 99 ? "99+" : String(cartItemCount);

  const preferences = useProfileStore((s) => s.preferences);

  const [statusTime, setStatusTime] = useState(() =>
    formatStatusTime(new Date()),
  );

  useEffect(() => {
    if (!showStatusBar) {
      return;
    }

    const updateTime = () => {
      setStatusTime(formatStatusTime(new Date()));
    };

    updateTime();
    const timer = window.setInterval(updateTime, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [showStatusBar]);

  const handleTabSelection = (tab: PreviewTab) => {
    onTabChange(tab);

    if (tab === "Trending") {
      setActiveTrendSlide(0);
      trendCarouselRef.current?.scrollTo({ left: 0, behavior: "auto" });
    }
  };

  const handleTrendCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const slideWidth = 260 + 12;
    const nextIndex = Math.round(event.currentTarget.scrollLeft / slideWidth);
    const clampedIndex = Math.max(
      0,
      Math.min(nextIndex, Math.max(0, trendingCollections.length - 1)),
    );
    setActiveTrendSlide(clampedIndex);
  };

  const goToTrendSlide = (index: number) => {
    const slideWidth = 260 + 12;
    trendCarouselRef.current?.scrollTo({
      left: index * slideWidth,
      behavior: "smooth",
    });
    setActiveTrendSlide(index);
  };

  const handleBottomNavSelection = (target: PreviewBottomNav) => {
    setActiveBottomNav(target);

    if (target !== "home") {
      setSelectedSignalItem(null);
    }
  };

  const phoneScrollRef = useRef<HTMLDivElement>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const [showSharePanel, setShowSharePanel] = useState(false);

  const handleShare = () => {
    setShowSharePanel((v) => !v);
    onShareTriggered?.();
  };

  const handleCopyLink = () => {
    const uid = Math.random().toString(36).slice(2, 10);
    const shareUrl = `${window.location.origin}/cart/${uid}`;
    // Publish cart to shared store
    useSharedCartStore.getState().publishCart(uid, cartItems);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setShareToast(shareUrl);
    setTimeout(() => setShareToast(null), 4000);
    setShowSharePanel(false);
  };

  return (
    <div
      ref={phoneScrollRef}
      className={cn(
        "relative h-full overflow-y-auto bg-[#ECECEC] text-[#101010]",
        topRoundedClassName,
        selectedProduct && "!overflow-hidden",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-20 bg-[#ECECEC]/96 px-4 pt-3 pb-1 backdrop-blur",
          topRoundedClassName,
        )}
      >
        {showStatusBar ? (
          <div className="flex items-center justify-between px-1.5 text-[11px] font-semibold text-black/85">
            <span>{statusTime}</span>

            <div className="mr-0.5 flex items-center gap-1.5">
              <RiBatteryFill className="size-3.5" />
              <RiSignalWifi3Fill className="size-3.5" />
            </div>
          </div>
        ) : null}

        {activeBottomNav === "search" ? (
          <>
            <div
              className={cn("flex items-center gap-3", showStatusBar && "mt-5")}
            >
              <button
                type="button"
                className="flex h-10 flex-1 items-center rounded-full bg-[#E7E7E7] px-3 text-left"
                aria-label="Search"
              >
                <RiSearchLine className="size-4 text-black/55" />
                <span className="ml-2 text-[13px] font-medium tracking-[-0.01em] text-black/60">
                  Paste URL or search
                </span>
              </button>

              <button
                type="button"
                aria-label="Upload image"
                className="flex size-10 items-center justify-center rounded-full bg-[#E7E7E7] text-black/65"
              >
                <RiImageLine className="size-4" />
              </button>
            </div>

            <div className="mt-5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2.5 pr-2">
                <button
                  type="button"
                  className="flex min-w-[52px] flex-col items-center text-black/65"
                >
                  <RiShirtLine className="size-4" />
                  <span className="mt-0.5 text-[10px]">Outfits</span>
                </button>

                <button
                  type="button"
                  className="flex min-w-[58px] flex-col items-center text-black/65"
                >
                  <RiImageLine className="size-4" />
                  <span className="mt-0.5 text-[10px]">Upload pic</span>
                </button>

                <button
                  type="button"
                  className="flex min-w-[68px] flex-col items-center text-black/65"
                >
                  <RiCake2Line className="size-4" />
                  <span className="mt-0.5 text-[10px]">Celebrations</span>
                </button>

                <button
                  type="button"
                  className="flex min-w-[48px] flex-col items-center text-black/65"
                >
                  <RiPriceTag3Line className="size-4" />
                  <span className="mt-0.5 text-[10px]">Sales</span>
                </button>

                <button
                  type="button"
                  className="flex min-w-[58px] flex-col items-center text-black/65"
                >
                  <RiBookmarkLine className="size-4" />
                  <span className="mt-0.5 text-[10px]">Favorites</span>
                </button>

                <button
                  type="button"
                  className="flex min-w-[50px] flex-col items-center text-black/65"
                >
                  <RiDiamondLine className="size-4" />
                  <span className="mt-0.5 text-[10px]">Luxury</span>
                </button>
              </div>
            </div>
          </>
        ) : activeBottomNav === "cart" ? (
          <div className={cn("pt-1", showStatusBar && "pt-6")}>
            <div className="flex items-center justify-between">
              <h2
                className={cn(
                  bodoniModa.className,
                  "text-[20px] leading-[0.95] tracking-[-0.02em] text-black",
                )}
              >
                Shopping Cart
              </h2>

              <button
                type="button"
                aria-label="Share cart"
                className="flex size-9 items-center justify-center rounded-full bg-[#E7E7E7] text-black/55"
                onClick={handleShare}
              >
                <RiShare2Line className="size-4" />
              </button>
            </div>

            {/* Share panel */}
            {showSharePanel && (
              <div className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-black/5">
                    <RiLink className="size-4 text-black/60" />
                  </div>
                  <span className="text-[8px] font-medium text-black/50">Copy Link</span>
                </button>
                <a
                  href="https://apps.apple.com/app/messages/id1146560473"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                    <svg viewBox="0 0 24 24" className="size-4 text-green-600" fill="currentColor"><path d="M12 2C6.477 2 2 5.935 2 10.715c0 2.87 1.505 5.43 3.867 7.09-.1.88-.58 3.28-.665 3.744 0 0-.014.112.058.155.072.044.157.02.157.02.22-.03 2.555-1.662 3.613-2.427.95.267 1.96.418 3.01.418 5.522 0 9.96-3.935 9.96-8.715C22 5.935 17.523 2 12 2z"/></svg>
                  </div>
                  <span className="text-[8px] font-medium text-black/50">iMessage</span>
                </a>
                <a
                  href="https://apps.apple.com/app/telegram-messenger/id686449807"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                    <svg viewBox="0 0 24 24" className="size-4 text-blue-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.63 3.72-.53.37-1.01.55-1.44.54-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.65-2.89 7.99-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.53.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/></svg>
                  </div>
                  <span className="text-[8px] font-medium text-black/50">Telegram</span>
                </a>
                <a
                  href="https://apps.apple.com/app/gmail-email-by-google/id422689480"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
                    <svg viewBox="0 0 24 24" className="size-4 text-red-500" fill="currentColor"><path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                  </div>
                  <span className="text-[8px] font-medium text-black/50">Gmail</span>
                </a>
              </div>
            )}

            <div className="mt-2.5 rounded-full bg-[#E7E7E7] p-0.5">
              {(["Bag", "Socials"] as CartMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveCartMode(mode)}
                  className={cn(
                    "h-8 w-1/2 rounded-full text-[12px] font-medium tracking-[-0.01em]",
                    activeCartMode === mode
                      ? "bg-[#DDDDDD] text-black shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                      : "text-black/62",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        ) : activeBottomNav === "saved" ? (
          <div className={cn("pt-1", showStatusBar && "pt-6")}>
            <div className="flex items-center justify-between">
              <h2
                className={cn(
                  bodoniModa.className,
                  "text-[20px] leading-[0.95] tracking-[-0.02em] text-black",
                )}
              >
                Your saved
              </h2>

              <button
                type="button"
                aria-label="Create"
                className="flex size-9 items-center justify-center rounded-full bg-[#E7E7E7] text-black/50"
              >
                <span aria-hidden="true" className="text-[20px] leading-none">
                  +
                </span>
              </button>
            </div>

            <div className="mt-2.5 rounded-full bg-[#E7E7E7] p-0.5">
              {(["Wishlists", "Items", "Brands"] as SavedMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSavedMode(mode)}
                  className={cn(
                    "h-8 w-1/3 rounded-full text-[12px] font-medium tracking-[-0.01em]",
                    activeSavedMode === mode
                      ? "bg-[#DDDDDD] text-black shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                      : "text-black/62",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        ) : activeBottomNav === "profile" ? (
          <div className={cn(showStatusBar ? "mt-2 h-2" : "h-2")} />
        ) : (
          <>
            <div
              className={cn(
                "flex items-center",
                showStatusBar ? "mt-8 gap-1.5" : "gap-1.5",
              )}
            >
              <Image
                src="/phia-light.svg"
                alt="Phia"
                width={96}
                height={34}
                className="h-auto w-12"
              />

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex h-7 items-center gap-1 rounded-full bg-black px-2.5 text-white shadow-[0_6px_18px_rgba(0,0,0,0.2)]"
                >
                  <RiGift2Fill className="size-3" color="rgba(255,255,255,1)" />
                  <span className="text-[9px] font-semibold tracking-tight">
                    Win a Birkin
                  </span>
                </button>

                <div className="flex items-center rounded-full bg-white px-0.75 py-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-full text-black/90"
                    aria-label="Notifications"
                  >
                    <RiNotification2Line className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-full text-black/90"
                    aria-label="Search"
                  >
                    <RiSearch2Line className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              {PREVIEW_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabSelection(tab)}
                  className={cn(
                    "border-b-2 text-sm font-medium",
                    activeTab === tab
                      ? "border-black text-black"
                      : "border-transparent text-black/45",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-2.5 pb-20">
        {activeBottomNav === "cart" ? (
          <div className="space-y-3 pt-2">
            {activeCartMode === "Bag" ? (
              cartItems.length > 0 ? (
                <div className="mt-3 columns-2 gap-2 [column-fill:_balance]">
                  {cartItems.map((item) => {
                    const cachedTryOn = useTryOnCacheStore.getState().cache[item.imageUrl];
                    const tryOnThumb = cachedTryOn?.[0]?.src;
                    return (
                      <article
                        key={`${item.id}-cart-item`}
                        className="mb-2 break-inside-avoid rounded-xl bg-white p-0.75 cursor-pointer"
                        onClick={() => openProduct(item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="h-auto w-full rounded-[12px]"
                        />
                        {tryOnThumb && (
                          <div className="flex gap-1 px-1 pt-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={tryOnThumb} alt="Try on" className="size-8 rounded-md object-cover border border-black/5" />
                            <span className="text-[8px] text-black/30 self-center">Try-on</span>
                          </div>
                        )}
                        <div className="px-1.5 pb-1.5 pt-1">
                          <p className="text-[9px] font-semibold leading-tight text-black">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[9px] text-black/65">
                            {item.brand || "Phia"}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                  Your bag is empty.
                </div>
              )
            ) : (
              <ReviewsFeed
                items={cartItems}
                onRemove={(id) => setCartItems((prev) => prev.filter((i) => i.id !== id))}
                tryOnCache={useTryOnCacheStore.getState().cache}
              />
            )}
          </div>
        ) : activeBottomNav === "saved" ? (
          <div className="space-y-3 pt-2">
            {activeSavedMode === "Wishlists" ? (
              <>
                <article className="relative overflow-hidden rounded-[20px] bg-[#EFEFEF] px-3 py-4">
                  {searchBrandCards[0]?.imageUrl ? (
                    <div className="pointer-events-none absolute -left-4 top-7 size-14 overflow-hidden rounded-[16px] opacity-30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={searchBrandCards[0].imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {searchBrandCards[1]?.imageUrl ? (
                    <div className="pointer-events-none absolute -right-3 top-7 size-14 overflow-hidden rounded-[16px] opacity-30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={searchBrandCards[1].imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {searchBrandCards[2]?.imageUrl ? (
                    <div className="pointer-events-none absolute left-8 -bottom-4 size-14 overflow-hidden rounded-[16px] opacity-25">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={searchBrandCards[2].imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <h3
                    className={cn(
                      bodoniModa.className,
                      "relative z-10 mx-auto max-w-[220px] text-center text-[14px] leading-[1.05] tracking-[-0.02em] text-black/76",
                    )}
                  >
                    Create &amp; share wishlists for your best finds
                  </h3>

                  <div className="relative z-10 mt-3 flex justify-center">
                    <button
                      type="button"
                      className="rounded-[14px] bg-black px-5 py-1.5 text-[11px] font-medium text-white"
                    >
                      + Create wishlist
                    </button>
                  </div>
                </article>

                <section>
                  <h3
                    className={cn(
                      bodoniModa.className,
                      "text-[14px] leading-none tracking-[-0.02em] text-black",
                    )}
                  >
                    Editor&apos;s picks
                  </h3>

                  {trendItems[0] ? (
                    <article className="relative mt-2.5 overflow-hidden rounded-[18px] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={trendItems[0].imageUrl}
                        alt={trendItems[0].name}
                        loading="lazy"
                        className="h-[200px] w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.64),rgba(0,0,0,0.18),transparent)]" />
                      <div className="absolute inset-x-4 bottom-4">
                        <p
                          className={cn(
                            bodoniModa.className,
                            "text-[12px] leading-[1.02] text-white",
                          )}
                        >
                          {trendItems[0].name}
                        </p>
                        <button
                          type="button"
                          className="mt-1 rounded-[12px] border border-white/90 px-3 py-0.5 text-[9px] font-medium text-white"
                        >
                          Shop this list
                        </button>
                      </div>
                    </article>
                  ) : (
                    <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                      No editor picks available.
                    </div>
                  )}
                </section>
              </>
            ) : activeSavedMode === "Items" ? (
              <section>
                <h3
                  className={cn(
                    bodoniModa.className,
                    "text-[14px] leading-none tracking-[-0.02em] text-black",
                  )}
                >
                  Saved items
                </h3>

                {trendItems.length > 0 ? (
                  <div className="mt-3 columns-2 gap-2 [column-fill:_balance]">
                    {trendItems.slice(0, 8).map((item) => (
                      <article
                        key={`${item.id}-saved-item`}
                        className="mb-2 break-inside-avoid rounded-xl bg-white p-0.75 cursor-pointer"
                        onClick={() => openProduct(item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="h-auto w-full rounded-[12px]"
                        />
                        <div className="px-1.5 pb-1.5 pt-1">
                          <p className="text-[9px] font-semibold leading-tight text-black">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[9px] text-black/65">
                            {item.brand || "Phia"}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                    No saved items yet.
                  </div>
                )}
              </section>
            ) : (
              <section>
                <h3
                  className={cn(
                    bodoniModa.className,
                    "text-[14px] leading-none tracking-[-0.02em] text-black",
                  )}
                >
                  Saved brands
                </h3>

                {searchBrandCards.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {searchBrandCards.slice(0, 8).map((brand) => (
                      <article
                        key={`${brand.id}-saved-brand`}
                        className="relative h-[78px] overflow-hidden rounded-[14px] bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brand.imageUrl}
                          alt={brand.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/28" />
                        <p className="absolute inset-0 flex items-center justify-center px-2 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                          {brand.name}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                    No saved brands yet.
                  </div>
                )}
              </section>
            )}
          </div>
        ) : activeBottomNav === "profile" ? (
          <div className="space-y-4 pt-3">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                aria-label="Help"
                className="flex size-10 items-center justify-center rounded-full bg-[#E7E7E7] text-black/85"
              >
                <RiQuestionLine className="size-5" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                className="flex size-10 items-center justify-center rounded-full bg-[#E7E7E7] text-black/85"
              >
                <RiSettingsLine className="size-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative size-26 overflow-hidden rounded-[22px] bg-[#6EA43D]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile.jpeg"
                  alt="Shreyansh Saurabh"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <h2
                className={cn(
                  bodoniModa.className,
                  "mt-3 text-[22px] leading-none tracking-[-0.02em] text-black",
                )}
              >
                Shreyansh Saurabh
              </h2>

              <button
                type="button"
                className="mt-3 rounded-2xl bg-[#E1E1E1] px-6 py-2 text-[10px] font-medium text-black/55"
              >
                Edit profile
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-[16px] bg-[#EFEFEF] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
                <p className="text-[9px] font-medium leading-[1.15] text-black/68">
                  Price drop
                  <br />
                  alerts
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <span className="rounded-xl bg-[#E4E4E4] px-2 py-1 text-[8px] text-black/35">
                    No updates
                  </span>
                  <RiNotification2Line className="size-8 text-black/22" />
                </div>
              </article>

              <article className="rounded-[16px] bg-[#EFEFEF] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
                <p className="text-[9px] font-medium leading-[1.15] text-black/68">
                  Your link
                  <br />
                  history
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-[#E4E4E4] px-2 py-1 text-[8px] text-black/35">
                    <span className="size-1.5 rounded-full bg-[#F95E60]" />3 new
                  </span>
                  <RiLink className="size-8 text-black/22" />
                </div>
              </article>

              <article className="rounded-[16px] bg-[#EFEFEF] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-1.5">
                  {searchBrandCards.slice(0, 4).map((brand) => (
                    <div
                      key={`${brand.id}-profile`}
                      className="size-7 overflow-hidden rounded-[9px] border border-white/70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brand.imageUrl}
                        alt={brand.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[9px] font-medium text-black/68">
                  Edit your brands
                </p>
              </article>

              <article className="rounded-[16px] bg-[#EFEFEF] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
                <div className="inline-flex items-center overflow-hidden rounded-[10px] border border-black/10 bg-[#E3E3E3]">
                  <span className="px-2 py-1 text-[9px] font-medium text-black/70">
                    M
                  </span>
                  <span className="border-l border-black/12 px-2 py-1 text-[9px] font-medium text-black/70">
                    W
                  </span>
                </div>

                <p className="mt-3 text-[9px] font-medium text-black/68">
                  Gender preferences
                </p>
              </article>
            </div>

            <article className="rounded-[22px] bg-[linear-gradient(170deg,#1A357E_0%,#7C8491_100%)] p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] leading-none">0</span>
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/30 text-[14px] font-medium">
                      p
                    </span>
                  </div>
                  <p className="mt-2 text-[8px] text-white/92">
                    Phia points available
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-full border border-white/45 bg-white/35 px-4 py-2 text-[8px] font-medium text-white"
                >
                  Track my points
                </button>
              </div>
            </article>

            <article className="rounded-[20px] bg-[linear-gradient(120deg,#3C5DAA_0%,#182C5E_70%,#10224D_100%)] p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium">Give feedback</p>
                <button
                  type="button"
                  className="rounded-[16px] border border-white/55 bg-white/20 px-3 py-1.5 text-[8px] font-medium text-white"
                >
                  Text us
                </button>
              </div>
            </article>
          </div>
        ) : activeBottomNav === "search" ? (
          <div className="space-y-5 pt-2">
            <section className="rounded-[20px] bg-[#F2F2F2] p-3">
              <h2
                className={cn(
                  bodoniModa.className,
                  "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
                )}
              >
                Search by look
              </h2>

              {searchLookCards.length > 0 ? (
                <div className="mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max gap-3 pr-2">
                    {searchLookCards.map((item) => (
                      <article
                        key={item.id}
                        className="relative h-[150px] w-[214px] shrink-0 overflow-hidden rounded-[14px] bg-white cursor-pointer"
                        onClick={() => openProduct(item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.56),rgba(0,0,0,0.1),transparent)]" />

                        <div className="absolute inset-x-4 bottom-4">
                          <p
                            className={cn(
                              bodoniModa.className,
                              "overflow-hidden text-[12px] leading-[1.05] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
                            )}
                          >
                            {item.title}
                          </p>
                          <button
                            type="button"
                            className="mt-1.5 rounded-[12px] border border-white/90 px-2.5 py-0.5 text-[10px] font-medium text-white"
                          >
                            See the list
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                  No search looks available.
                </div>
              )}
            </section>

            <section className="rounded-[20px] bg-[#F2F2F2] p-3">
              <div className="flex items-center justify-between gap-3">
                <h2
                  className={cn(
                    bodoniModa.className,
                    "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
                  )}
                >
                  Search by brand
                </h2>

                <button
                  type="button"
                  aria-label="Open brand search"
                  className="flex size-6 items-center justify-center rounded-full bg-[#E5E5E5] text-black/70"
                >
                  <RiArrowRightSLine className="size-3.5" />
                </button>
              </div>

              {searchBrandCards.length > 0 ? (
                <div className="mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="grid w-max auto-cols-[145px] grid-flow-col grid-rows-2 gap-3 pr-2">
                    {searchBrandCards.map((brand) => (
                      <article
                        key={brand.id}
                        className="relative h-[86px] overflow-hidden rounded-[16px] bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brand.imageUrl}
                          alt={brand.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/28" />
                        <p className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                          {brand.name}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex h-24 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                  No brands available.
                </div>
              )}
            </section>
          </div>
        ) : activeTab === "For You" ? (
          <div className="pt-4">
            <h2
              className={cn(
                bodoniModa.className,
                "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
              )}
            >
              Browse styles
            </h2>

            {curatedTypes.length > 0 ? (
              <div className="mt-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-3 pr-2">
                  {curatedTypes.map((item) => (
                    <article
                      key={item.id}
                      className="relative h-[230px] w-[165px] shrink-0 overflow-hidden rounded-t-[90px] rounded-b-[16px] bg-white cursor-pointer"
                      onClick={() => openProduct(item)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/18" />

                      <div className="absolute inset-0 flex items-center justify-center px-4">
                        <p className="text-center font-serif text-[20px] leading-[1.08] tracking-[-0.01em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
                          {item.name}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex h-32 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                No curated styles available.
              </div>
            )}

            <div className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <h3
                  className={cn(
                    bodoniModa.className,
                    "text-[16px] leading-[1.1] tracking-[-0.02em] text-black",
                  )}
                >
                  Suggested{" "}
                  <span className="text-[#1F9D55]">&quot;Signals&quot;</span>{" "}
                  for you
                </h3>

                <span className="rounded-full bg-[#1F9D55] px-2 py-1 text-[8px] font-semibold tracking-[0.08em] text-white">
                  NEW
                </span>
              </div>

              <p className="text-[11px] text-black/58">
                Based on your recent activity
              </p>

              {trendItems.length > 0 ? (
                <div className="mt-3 columns-2 gap-2 [column-fill:_balance]">
                  {trendItems.map((item) => (
                    <article key={item.id} className="mb-2 break-inside-avoid">
                      <button
                        type="button"
                        onClick={() => openProduct(item)}
                        className="block w-full text-left"
                      >
                        <div className="relative rounded-2xl bg-white p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            className="h-auto w-full rounded-[14px] bg-[#EFEFEF]"
                          />

                          <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-[#E8E8E8] text-black/55">
                            <RiBookmarkLine className="size-4" />
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 px-1.5 py-1.5 text-black/58">
                        <button type="button" aria-label="Like">
                          <ThumbsUp className="size-3.5" />
                        </button>
                        <button type="button" aria-label="Dislike">
                          <ThumbsDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="More"
                          className="ml-auto -m-2 inline-flex size-8 items-center justify-center rounded-full text-black/58 hover:bg-black/5"
                          onClick={() => setSelectedSignalItem(item)}
                        >
                          <EllipsisVertical className="size-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                  No suggested signals available.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "Trending" ? (
          <div className="pt-4">
            <h2
              className={cn(
                bodoniModa.className,
                "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
              )}
            >
              Top trends
            </h2>

            {trendingCollections.length > 0 ? (
              <>
                <div
                  ref={trendCarouselRef}
                  onScroll={handleTrendCarouselScroll}
                  className="mt-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex w-max gap-3 pr-2">
                    {trendingCollections.map((item) => (
                      <article
                        key={item.id}
                        className="relative h-[190px] w-[260px] shrink-0 overflow-hidden rounded-xl bg-white cursor-pointer"
                        onClick={() =>
                          openProduct({
                            imageUrl: item.imageUrl,
                            title: item.title,
                            linkUrl: item.products[0]?.linkUrl || "",
                          })
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.58),rgba(0,0,0,0.18),transparent)]" />

                        <div className="absolute inset-x-4 bottom-4">
                          <p
                            className={cn(
                              bodoniModa.className,
                              "text-[14px] leading-[1.02] tracking-[-0.01em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]",
                            )}
                          >
                            {item.title}
                          </p>

                          {item.products[0]?.linkUrl ? (
                            <a
                              href={item.products[0].linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center rounded-md border border-white/90 px-3 py-1.5 text-[11px] font-medium text-white"
                            >
                              See the list
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center rounded-md border border-white/90 px-3 py-1.5 text-[11px] font-medium text-white"
                            >
                              See the list
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-center gap-2">
                  {trendingCollections.map((item, index) => (
                    <button
                      key={`${item.id}-dot`}
                      type="button"
                      aria-label={`Go to trend ${index + 1}`}
                      onClick={() => goToTrendSlide(index)}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors",
                        activeTrendSlide === index ? "bg-black" : "bg-black/25",
                      )}
                    />
                  ))}
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className={cn(
                        bodoniModa.className,
                        "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
                      )}
                    >
                      Trending with phia
                    </h3>

                    <button
                      type="button"
                      aria-label="Open trending with phia"
                      className="flex size-7 items-center justify-center rounded-full bg-[#E5E5E5] text-black/70"
                    >
                      <RiArrowRightSLine className="size-4" />
                    </button>
                  </div>

                  {trendItems.length > 0 ? (
                    <div className="mt-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex w-max gap-3 pr-2">
                        {trendItems.slice(0, 10).map((item, index) => {
                          const viewCount = seededNumberFromString(
                            `${TRENDING_VIEWS_SEED}-${item.id}-${index}`,
                            200,
                            500,
                          );

                          return (
                            <article
                              key={`${item.id}-trending-with-phia`}
                              className="w-[168px] shrink-0"
                            >
                              <button
                                type="button"
                                onClick={() => openProduct(item)}
                                className="block w-full text-left"
                              >
                                <div className="relative rounded-[18px] bg-white p-1">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    loading="lazy"
                                    className="h-[216px] w-full rounded-[14px] bg-[#EFEFEF] object-cover"
                                  />

                                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#ECECEC]/95 px-2 py-1 text-[11px] font-medium text-black/70 shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
                                    <RiEyeLine className="size-3.5" />
                                    {viewCount}
                                  </span>
                                </div>
                              </button>

                              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-black/45">
                                {item.brand || "Phia"}
                              </p>
                              <p className="mt-0.5 overflow-hidden text-[16px] font-medium leading-[1.15] text-black [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                                {item.name}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                      No trending products available.
                    </div>
                  )}
                </div>

                <div className="mt-7">
                  <h3
                    className={cn(
                      bodoniModa.className,
                      "text-[16px] leading-[1.05] tracking-[-0.02em] text-black",
                    )}
                  >
                    Trending brands
                  </h3>

                  {trendingBrands.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-[18px] border border-black/10 bg-[#ECECEC]">
                      {trendingBrands.map((brand) => (
                        <article
                          key={brand.id}
                          className="flex items-center gap-3 border-t border-black/10 px-3 py-3 first:border-t-0"
                        >
                          <p className="w-9 shrink-0 text-[18px] font-medium leading-none text-black/65">
                            #{brand.trendingRank}
                          </p>

                          <div className="min-w-0 flex-1">
                            {brand.logoUrl ? (
                              <a
                                href={brand.brandUrl || undefined}
                                target={brand.brandUrl ? "_blank" : undefined}
                                rel={brand.brandUrl ? "noreferrer" : undefined}
                                className="inline-block"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={brand.logoUrl}
                                  alt={brand.name}
                                  loading="lazy"
                                  className="h-5 w-auto max-w-[130px] object-contain grayscale brightness-0"
                                />
                              </a>
                            ) : (
                              <p className="text-[14px] font-semibold uppercase tracking-[0.03em] text-black">
                                {brand.name}
                              </p>
                            )}

                            <p className="mt-1 text-[11px] text-black/55">
                              {formatVisitCount(brand.visitCount)}
                            </p>
                          </div>

                          <button
                            type="button"
                            aria-label={`Save ${brand.name}`}
                            className="flex size-10 items-center justify-center rounded-full bg-[#E8E8E8] text-black/45"
                          >
                            <RiBookmarkLine className="size-4" />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                      No trending brands available.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-4 flex h-28 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                No top trends available.
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Celebrity Watchlist */}
            <div className="mb-4">
              <CelebrityWatchlist celebrities={
                preferences.celebrities?.length > 0
                  ? preferences.celebrities
                  : Object.keys(CELEB_DATA)
              } />
            </div>

            {tabItems.length > 0 ? (
          <div className="columns-2 gap-2 [column-fill:_balance]">
            {tabItems.map((item) => (
              <article
                key={item.id}
                className="mb-2 break-inside-avoid rounded-2xl bg-white p-1 cursor-pointer"
                onClick={() => openProduct(item)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-auto w-full rounded-[14px]"
                />
                <div className="px-2 pb-2 pt-1.5">
                  <p className="text-[11px] font-semibold leading-tight text-black">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-black/65">
                    {item.primaryBrandName}
                  </p>
                </div>
              </article>
            ))}
          </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
                No content in this tab yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Product Detail View ── */}
      {selectedProduct ? (
        <ProductDetailOverlay
          product={selectedProduct}
          scrollTop={phoneScrollRef.current?.scrollTop ?? 0}
          containerHeight={phoneScrollRef.current?.clientHeight ?? 0}
          onClose={() => setSelectedProduct(null)}
          userPhotos={preferences}
          onAddToCart={addToCart}
          isInCart={cartItems.some((item) => item.id === selectedProduct.id)}
          onShare={handleShare}
        />
      ) : null}

      {selectedSignalItem && activeBottomNav === "home" ? (
        <div className="absolute inset-0 z-40">
          <button
            type="button"
            aria-label="Dismiss signal actions"
            className="absolute inset-0 bg-black/25"
            onClick={() => setSelectedSignalItem(null)}
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-[34px] bg-[#F2F2F2] pb-8 pt-2 shadow-[0_-16px_36px_rgba(0,0,0,0.2)]">
            <div className="mx-auto h-1 w-14 rounded-full bg-black/12" />

            <div className="mt-3 px-3">
              <div className="relative overflow-hidden rounded-[30px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedSignalItem.imageUrl}
                  alt={selectedSignalItem.name}
                  loading="lazy"
                  className="h-[340px] w-full object-cover opacity-35"
                />

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSelectedSignalItem(null)}
                  className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-[30px] leading-none text-black/80"
                >
                  <span aria-hidden="true">x</span>
                </button>

                <div className="absolute inset-x-0 bottom-8 px-4 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                    {selectedSignalItem.brand || "Phia"}
                  </p>
                  <p className="mt-4 text-[16px] font-medium leading-tight text-black">
                    Inspired by your recent activity
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 px-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 py-3 text-[16px] font-medium text-black/70"
              >
                <RiBookmarkLine className="size-4" />
                Save
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 py-3 text-[16px] font-medium text-black/70"
              >
                <RiShare2Line className="size-4" />
                Share
              </button>
            </div>

            <div className="mt-4 space-y-3 px-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-3xl bg-[#EAEAEA] px-4 py-4 text-left text-[14px] font-medium text-black/70"
              >
                <ThumbsDown className="size-5" />
                Show less like this
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-3xl bg-[#EAEAEA] px-4 py-4 text-left text-[14px] font-medium text-black/70"
              >
                <ThumbsUp className="size-5" />
                Show more like this
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-3xl bg-[#EAEAEA] px-4 py-4 text-left text-[14px] font-medium text-black/70"
              >
                <RiEyeLine className="size-5" />
                Show more from this store
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-3xl bg-[#EAEAEA] px-4 py-4 text-left text-[14px] font-medium text-black/70"
              >
                <RiEyeOffLine className="size-5" />
                Show less from this store
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-3xl bg-[#EAEAEA] px-4 py-4 text-left text-[14px] font-medium text-black/70"
              >
                <RiCloseCircleLine className="size-5" />
                Report
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-3 z-30 px-3 pb-2">
        <nav className="mx-auto flex h-12 max-w-[340px] items-center rounded-full bg-[#F1F1F1]/95 px-2 shadow-[0_12px_28px_rgba(0,0,0,0.15)] backdrop-blur">
          <button
            type="button"
            onClick={() => handleBottomNavSelection("home")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-full",
              activeBottomNav === "home"
                ? "bg-white text-[#2563eb] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                : "text-black/35",
            )}
            aria-label="Home"
          >
            <RiHomeLine className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleBottomNavSelection("search")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-full",
              activeBottomNav === "search"
                ? "bg-white text-[#2563eb] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                : "text-black/35",
            )}
            aria-label="Discover"
          >
            <RiSearchLine className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleBottomNavSelection("cart")}
            className={cn(
              "relative flex h-9 flex-1 items-center justify-center rounded-full",
              activeBottomNav === "cart"
                ? "bg-white text-[#2563eb] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                : "text-black/35",
            )}
            aria-label="Cart"
          >
            <span className="relative inline-flex">
              <RiShoppingBagLine className="size-5" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold leading-4 text-white">
                  {cartBadgeLabel}
                </span>
              ) : null}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleBottomNavSelection("saved")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-full",
              activeBottomNav === "saved"
                ? "bg-white text-[#2563eb] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                : "text-black/35",
            )}
            aria-label="Saved"
          >
            <RiBookmarkLine className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleBottomNavSelection("profile")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-full",
              activeBottomNav === "profile"
                ? "bg-white text-[#2563eb] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                : "text-black/35",
            )}
            aria-label="Profile"
          >
            <RiUser4Line className="size-5" />
          </button>
        </nav>
      </div>

      {/* Share toast — rendered at the root level of the phone, above everything */}
      {shareToast && (
        <div className="fixed bottom-14 right-3 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 rounded-lg bg-white border border-black/8 px-2.5 py-1.5 shadow-sm">
            <RiLink className="size-3 text-black/35 shrink-0" />
            <p className="text-[10px] text-black/50 max-w-[150px] truncate">{shareToast}</p>
            <button
              type="button"
              onClick={() => setShareToast(null)}
              className="text-black/25 hover:text-black/50"
            >
              <RiCloseCircleLine className="size-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PhiaWorkspace() {
  const [deviceView, setDeviceView] = useState<"phone" | "desktop">("phone");
  const [previewStage, setPreviewStage] = useState<PreviewStage>("splash");
  const [activeTab, setActiveTab] = useState<PreviewTab>("Explore");
  const [view, setView] = useState(DEFAULT_VIEW);
  const [history, setHistory] = useState<ViewState[]>([DEFAULT_VIEW]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showFeedbackAgent, setShowFeedbackAgent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    startView: ViewState;
  } | null>(null);
  const isPlaying = previewStage !== "idle";

  const exploreCards = useMemo<ExploreCard[]>(() => {
    const sections =
      (exploreFeedData as FeedImport).data?.exploreFeed?.sections ?? [];
    const cards: ExploreCard[] = [];

    for (const section of sections) {
      const items = section.data?.items ?? [];

      for (const item of items) {
        const entityType = item.entityType ?? "UNKNOWN";
        const variant = item.variant ?? "PRIMARY";

        let title = "Untitled";
        let subtitle = "Phia";
        let name = "Untitled";
        let primaryBrandName = "Phia";
        let description = "";
        let imageUrl = "";
        let linkUrl = "";

        const detailRows: Array<{ label: string; value: string }> = [
          { label: "ID", value: item.id ?? "N/A" },
          { label: "Type", value: entityType },
          { label: "Variant", value: variant },
        ];

        if (item.product) {
          name = item.product.name ?? name;
          primaryBrandName = item.product.primaryBrandName ?? primaryBrandName;
          title = item.product.name ?? title;
          subtitle = item.product.primaryBrandName ?? subtitle;
          description = item.product.description ?? "";
          imageUrl =
            item.product.imgUrl ?? item.product.additionalImgUrls?.[0] ?? "";
          linkUrl = item.product.productUrl ?? "";

          const price = formatPrice(item.product.priceUsd);
          if (price) {
            detailRows.push({ label: "Price", value: price });
          }
          if (item.product.primaryBrandName) {
            detailRows.push({
              label: "Brand",
              value: item.product.primaryBrandName,
            });
          }
          if (item.product.sourceDisplayName) {
            detailRows.push({
              label: "Source",
              value: item.product.sourceDisplayName,
            });
          }
          if (item.product.domain) {
            detailRows.push({ label: "Domain", value: item.product.domain });
          }
          if (item.product.colorString) {
            detailRows.push({
              label: "Color",
              value: item.product.colorString,
            });
          }
          if (item.product.sizeDisplayName) {
            detailRows.push({
              label: "Size",
              value: item.product.sizeDisplayName,
            });
          }
          if (item.product.gender) {
            detailRows.push({ label: "Gender", value: item.product.gender });
          }
        } else if (item.outfit) {
          name = item.outfit.title ?? name;
          primaryBrandName = "Outfit";
          title = item.outfit.title ?? "Untitled outfit";
          subtitle = "Outfit";
          description = item.outfit.description ?? "";
          imageUrl =
            item.outfit.imgUrl ??
            item.outfit.imgUrls?.[0] ??
            item.outfit.products?.[0]?.imageLink ??
            "";
          linkUrl = item.outfit.products?.[0]?.linkToProduct ?? "";

          detailRows.push({
            label: "Products",
            value: String(item.outfit.products?.length ?? 0),
          });
          if (item.outfit.order != null) {
            detailRows.push({
              label: "Order",
              value: String(item.outfit.order),
            });
          }
          if (item.outfit.isFeatured != null) {
            detailRows.push({
              label: "Featured",
              value: item.outfit.isFeatured ? "Yes" : "No",
            });
          }
          if (item.outfit.isPublished != null) {
            detailRows.push({
              label: "Published",
              value: item.outfit.isPublished ? "Yes" : "No",
            });
          }

          const outfitBrands = (item.outfit.products ?? [])
            .map((product) => product.brand)
            .filter((brand): brand is string => Boolean(brand));
          if (outfitBrands.length > 0) {
            primaryBrandName = Array.from(new Set(outfitBrands))
              .slice(0, 2)
              .join(" / ");
            subtitle = primaryBrandName;
          }
        } else if (item.editorial) {
          name = item.editorial.title ?? item.editorial.headline ?? name;
          primaryBrandName = "Editorial";
          title =
            item.editorial.title ??
            item.editorial.headline ??
            "Untitled editorial";
          subtitle = "Editorial";
          description = item.editorial.description ?? "";
          imageUrl = item.editorial.imgUrl ?? item.editorial.imageUrl ?? "";
          linkUrl = item.editorial.url ?? "";
        }

        if (!imageUrl) {
          continue;
        }

        if (!linkUrl && item.product?.productUrl) {
          linkUrl = item.product.productUrl;
        }

        if (linkUrl) {
          const hostname = safeDomain(linkUrl);
          if (hostname) {
            detailRows.push({ label: "URL", value: hostname });
          }
        }

        cards.push({
          id: item.id ?? `explore-item-${cards.length}`,
          entityType,
          variant,
          name,
          primaryBrandName,
          title,
          subtitle,
          description,
          imageUrl,
          detailRows,
          linkUrl,
        });
      }
    }

    return cards;
  }, []);

  const curatedCards = useMemo<CuratedCard[]>(() => {
    const curatedTypes =
      (curatedData as CuratedImport).data?.curatedTypes ?? [];
    const cards: CuratedCard[] = [];

    for (const item of curatedTypes) {
      const imageUrl = item.imgUrl ?? "";
      const name = item.name?.trim() ?? "";

      if (!imageUrl || !name) {
        continue;
      }

      cards.push({
        id: item.typeId ?? `curated-${cards.length}`,
        name,
        imageUrl,
      });
    }

    return cards;
  }, []);

  const trendCards = useMemo<TrendCard[]>(() => {
    const products = (recommendedData as RecommendedImport).items ?? [];
    const cards: TrendCard[] = [];

    for (const item of products) {
      const imageUrl = item.image ?? "";
      const name = item.name?.trim() ?? "";

      if (!imageUrl || !name) {
        continue;
      }

      cards.push({
        id: item.id ?? `trend-${cards.length}`,
        name,
        brand: item.brand?.trim() ?? "",
        imageUrl,
        linkUrl: item.url ?? "",
      });
    }

    return cards;
  }, []);

  const searchLookCards = useMemo<SearchLookCard[]>(() => {
    const popularSearches =
      (searchData as SearchImport).data?.popularSearches ?? [];

    const cards = popularSearches
      .map((item, index) => {
        const imageUrl = item.imgUrl?.trim() ?? "";
        const title = item.query?.trim() ?? "";
        const category = item.category?.trim() ?? "";
        const numericRank = Number(item.rank);

        return {
          id: `search-look-${index}`,
          imageUrl,
          title,
          category,
          rank: Number.isFinite(numericRank)
            ? numericRank
            : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((item) => item.imageUrl && item.title)
      .sort((left, right) => left.rank - right.rank)
      .slice(0, SEARCH_LOOK_LIMIT);

    return cards.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
      category: item.category,
    }));
  }, []);

  const [searchBrandCards] = useState<SearchBrandCard[]>(() => {
    const brands = (brandsData as BrandsImport).data?.trendingBrands ?? [];
    const cards = brands
      .map((brand, index) => ({
        id: brand.id ?? `search-brand-${index}`,
        name: brand.name?.trim() ?? "",
        imageUrl: brand.imgUrl?.trim() ?? "",
        brandUrl: brand.brandUrl ?? "",
      }))
      .filter((brand) => brand.name && brand.imageUrl);

    if (cards.length <= SEARCH_BRAND_LIMIT) {
      return cards;
    }

    const offset = SEARCH_BRAND_SEED % cards.length;
    const rotated = [...cards.slice(offset), ...cards.slice(0, offset)];
    return rotated.slice(0, SEARCH_BRAND_LIMIT);
  });

  const trendingBrandRows = useMemo<TrendingBrandListItem[]>(() => {
    const brands = (brandsData as BrandsImport).data?.trendingBrands ?? [];
    const usedRanks = new Set<number>();
    const rows: TrendingBrandListItem[] = [];

    for (const brand of brands) {
      const rank = Number(brand.trendingRank);
      if (Number.isFinite(rank) && rank > 0) {
        usedRanks.add(Math.floor(rank));
      }
    }

    for (let index = 0; index < brands.length; index += 1) {
      const brand = brands[index];
      const name = brand.name?.trim() ?? "";

      if (!name) {
        continue;
      }

      const parsedRank = Number(brand.trendingRank);
      let nextRank =
        Number.isFinite(parsedRank) && parsedRank > 0
          ? Math.floor(parsedRank)
          : 0;

      if (!nextRank) {
        let candidate = seededNumberFromString(
          `${TRENDING_BRANDS_RANK_SEED}-${brand.id ?? name}-${index}`,
          1,
          Math.max(brands.length * 20, 500),
        );

        while (usedRanks.has(candidate)) {
          candidate += 1;
        }

        nextRank = candidate;
        usedRanks.add(nextRank);
      }

      const parsedVisitCount = Number(brand.visitCount);

      rows.push({
        id: brand.id ?? `brand-${index}`,
        name,
        logoUrl: brand.logoUrl ?? "",
        brandUrl: brand.brandUrl ?? "",
        visitCount:
          Number.isFinite(parsedVisitCount) && parsedVisitCount > 0
            ? parsedVisitCount
            : 0,
        trendingRank: nextRank,
      });
    }

    rows.sort(
      (left, right) =>
        left.trendingRank - right.trendingRank ||
        left.name.localeCompare(right.name),
    );

    return rows.slice(0, TRENDING_BRANDS_LIMIT);
  }, []);

  const trendingCollections = useMemo<TrendingCollectionCard[]>(() => {
    const outfits = (trendingData as TrendingImport).data?.outfits ?? [];
    const cards: TrendingCollectionCard[] = [];

    for (const item of outfits) {
      const title = item.title?.trim() ?? "";
      const imageUrl = item.imgUrl ?? "";

      if (!title || !imageUrl) {
        continue;
      }

      const products = (item.products ?? [])
        .map((product, index) => ({
          id: product.productId ?? `${item.outfitId ?? "trend"}-${index}`,
          name: product.itemName?.trim() ?? "",
          brand: product.brand?.trim() ?? "",
          imageUrl: product.imageLink ?? "",
          linkUrl: product.linkToProduct ?? "",
        }))
        .filter((product) => product.name || product.linkUrl);

      cards.push({
        id: item.outfitId ?? `trending-${cards.length}`,
        title,
        imageUrl,
        products,
      });
    }

    if (cards.length <= TREND_SAMPLE_SIZE) {
      return cards;
    }

    const offset = TREND_ROTATION_SEED % cards.length;
    const rotatedCards = [...cards.slice(offset), ...cards.slice(0, offset)];
    return rotatedCards.slice(0, TREND_SAMPLE_SIZE);
  }, []);

  const commitView = (nextView: ViewState) => {
    setView(nextView);
    setHistory((previousHistory) => {
      const truncatedHistory = previousHistory.slice(0, historyIndex + 1);
      const lastView = truncatedHistory.at(-1);

      if (lastView && isSameView(lastView, nextView)) {
        return previousHistory;
      }

      const updatedHistory = [...truncatedHistory, nextView];
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  };

  const adjustScale = (delta: number) => {
    const nextView = {
      ...view,
      scale: clampScale(Number((view.scale + delta).toFixed(2))),
    };

    commitView(nextView);
  };

  const restoreHistory = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= history.length) {
      return;
    }

    setHistoryIndex(nextIndex);
    setView(history[nextIndex]);
  };

  const handlePointerMove = useEffectEvent((event: PointerEvent) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const { pointerX, pointerY, startView } = dragRef.current;
    setView({
      ...startView,
      x: startView.x + event.clientX - pointerX,
      y: startView.y + event.clientY - pointerY,
    });
  });

  const handlePointerUp = useEffectEvent((event: PointerEvent) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const { pointerX, pointerY, startView } = dragRef.current;
    const nextView = {
      ...startView,
      x: startView.x + event.clientX - pointerX,
      y: startView.y + event.clientY - pointerY,
    };

    dragRef.current = null;
    setIsDragging(false);
    commitView(nextView);
  });

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    if (previewStage !== "splash") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewStage("feed");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [previewStage]);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('[data-drag-ignore="true"]')
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startView: view,
    };
    setIsDragging(true);
  };

  return (
    <div className="dark min-h-screen bg-[#0E0D12] text-white">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="min-h-screen bg-[#0E0D12] text-white md:m-0 md:rounded-none md:shadow-none">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Phia</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Signal</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-1 py-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "h-7 min-w-9 px-2.5 rounded-full text-zinc-400 hover:bg-white/8 hover:text-white",
                      deviceView === "phone" && "bg-white/10 text-white",
                    )}
                    onClick={() => setDeviceView("phone")}
                    aria-pressed={deviceView === "phone"}
                  >
                    <RiSmartphoneFill className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "h-7 min-w-9 px-2.5 rounded-full text-zinc-400 hover:bg-white/8 hover:text-white",
                      deviceView === "desktop" && "bg-white/10 text-white",
                    )}
                    onClick={() => setDeviceView("desktop")}
                    aria-pressed={deviceView === "desktop"}
                  >
                    <RiMacFill className="size-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "h-8 w-8 rounded-full border border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10 hover:text-white",
                    isPlaying && "border-white/30 bg-white/14 text-white",
                  )}
                  onClick={() =>
                    setPreviewStage((currentValue) =>
                      currentValue === "idle" ? "splash" : "idle",
                    )
                  }
                  aria-label="Play"
                  aria-pressed={isPlaying}
                >
                  <RiPlayFill className="size-4" />
                </Button>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-10 rounded-full border-0 bg-transparent px-2 text-zinc-300 hover:bg-transparent hover:text-white"
                  aria-label="Notifications"
                >
                  <RiNotification2Fill className="size-5" />
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-2 block size-2 rounded-full bg-red-500 ring-2 ring-[#0E0D12]"
                  />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-3">
            {deviceView === "phone" ? (
              <section
                className={cn(
                  "relative flex h-[calc(100vh-72px)] min-h-[680px] overflow-hidden rounded-[28px] border border-white/8 bg-[#171717] shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                onPointerDown={handleCanvasPointerDown}
              >
                <div
                  className="absolute -inset-24 transition-transform"
                  style={{
                    transform: `translate(${view.x}px, ${view.y}px)`,
                    transition: isDragging
                      ? "none"
                      : "transform 180ms ease-out",
                  }}
                />
                <div
                  className="absolute -inset-24 transition-opacity"
                  style={
                    showGrid
                      ? {
                          backgroundImage: DOT_PATTERN,
                          backgroundRepeat: "repeat",
                          transform: `translate(${view.x}px, ${view.y}px)`,
                        }
                      : {
                          transform: `translate(${view.x}px, ${view.y}px)`,
                        }
                  }
                />

                <div
                  className="absolute top-1/2 left-5 z-20 flex -translate-y-1/2 cursor-default flex-col items-center gap-3"
                  data-drag-ignore="true"
                >
                  <div className="flex flex-col gap-2 rounded-[18px] border border-white/10 bg-[#16141B]/85 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur">
                    <WorkspaceControlButton
                      aria-label="Zoom in"
                      onClick={() => adjustScale(0.1)}
                    >
                      <ZoomIn className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Zoom out"
                      onClick={() => adjustScale(-0.1)}
                    >
                      <Minus className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Center canvas"
                      onClick={() => commitView(DEFAULT_VIEW)}
                    >
                      <Maximize className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Undo last view change"
                      disabled={historyIndex === 0}
                      onClick={() => restoreHistory(historyIndex - 1)}
                    >
                      <Undo2 className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Redo last view change"
                      disabled={historyIndex === history.length - 1}
                      onClick={() => restoreHistory(historyIndex + 1)}
                    >
                      <RotateCcw className="size-4 scale-x-[-1]" />
                    </WorkspaceControlButton>
                  </div>

                  <WorkspaceControlButton
                    active={showGuides}
                    aria-label={showGuides ? "Hide guides" : "Show guides"}
                    onClick={() =>
                      setShowGuides((currentValue) => !currentValue)
                    }
                  >
                    <Layers3 className="size-4" />
                  </WorkspaceControlButton>
                </div>

                <div
                  className="relative flex h-full w-full items-center justify-center overflow-hidden px-20 py-8"
                  style={{
                    transform: `translate(${view.x}px, ${view.y}px)`,
                    transition: isDragging
                      ? "none"
                      : "transform 180ms ease-out",
                  }}
                >
                  <div
                    className="relative cursor-default touch-none select-none"
                    data-drag-ignore="true"
                    style={{
                      transform: `scale(${view.scale})`,
                      transition: isDragging
                        ? "none"
                        : "transform 180ms ease-out",
                    }}
                  >
                    {/* ── Agent Nodes (visible when app is powered on) ── */}
                    {isPlaying && showGuides && <AgentNodes showFeedbackAgent={showFeedbackAgent} />}

                    <div className="absolute top-1/2 left-1/2 h-[560px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-[64px] bg-black/25 blur-3xl" />

                    <div className="relative h-[620px] w-[305px] rounded-[54px] border border-[#a5917a] bg-[linear-gradient(145deg,#d6c5a8,#5b4d42_34%,#0f0f10_68%,#cfc0a1)] p-[6px] shadow-[0_22px_70px_rgba(0,0,0,0.5)]">
                      <div className="relative h-full w-full overflow-hidden rounded-[48px] border border-black/55 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(155deg,#8c7c68_0%,#0f0f11_35%,#2b271f_58%,#ece0cf_100%)]">
                        <div className="absolute top-2 left-[-3px] h-18 w-[3px] rounded-full bg-[#c6b69d]" />
                        <div className="absolute top-28 left-[-3px] h-12 w-[3px] rounded-full bg-[#c6b69d]" />
                        <div className="absolute top-44 left-[-3px] h-16 w-[3px] rounded-full bg-[#c6b69d]" />
                        <div className="absolute top-32 right-[-3px] h-20 w-[3px] rounded-full bg-[#c6b69d]" />
                        <div className="absolute top-3 left-1/2 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black/90 shadow-[inset_0_-2px_5px_rgba(255,255,255,0.08)]" />

                        {previewStage === "splash" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Image
                              src="/phia-light.svg"
                              alt="Phia"
                              width={132}
                              height={132}
                              className="h-auto w-28"
                            />
                          </div>
                        ) : previewStage === "feed" ? (
                          <ExplorePreviewScreen
                            items={exploreCards}
                            curatedTypes={curatedCards}
                            trendItems={trendCards}
                            trendingBrands={trendingBrandRows}
                            searchLookCards={searchLookCards}
                            searchBrandCards={searchBrandCards}
                            trendingCollections={trendingCollections}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            topRoundedClassName="rounded-t-[48px]"
                            showStatusBar
                            onShareTriggered={() => setShowFeedbackAgent(true)}
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_15%,rgba(255,245,220,0.35),transparent_18%),radial-gradient(circle_at_55%_54%,rgba(18,18,18,0.82),transparent_34%),linear-gradient(165deg,#8f806f_0%,#111_33%,#2f2a24_54%,#f2e8d8_100%)] opacity-95" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_15%,rgba(255,255,255,0.05)_38%,transparent_52%)]" />

                            {showGuides ? (
                              <>
                                <div className="absolute inset-x-6 top-48 bottom-12 rounded-[30px] border border-dashed border-white/18 bg-black/12" />
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section
                className={cn(
                  "relative flex h-[calc(100vh-72px)] min-h-[680px] overflow-hidden rounded-[28px] border border-white/8 bg-[#171717] shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                onPointerDown={handleCanvasPointerDown}
              >
                {/* Dot grid */}
                <div
                  className="absolute -inset-24 transition-transform"
                  style={
                    showGrid
                      ? {
                          backgroundImage: DOT_PATTERN,
                          backgroundRepeat: "repeat",
                          transform: `translate(${view.x}px, ${view.y}px)`,
                        }
                      : {
                          transform: `translate(${view.x}px, ${view.y}px)`,
                        }
                  }
                />

                {/* Controls */}
                <div
                  className="absolute top-1/2 left-5 z-20 flex -translate-y-1/2 cursor-default flex-col items-center gap-3"
                  data-drag-ignore="true"
                >
                  <div className="flex flex-col gap-2 rounded-[18px] border border-white/10 bg-[#16141B]/85 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur">
                    <WorkspaceControlButton
                      aria-label="Zoom in"
                      onClick={() => adjustScale(0.1)}
                    >
                      <ZoomIn className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Zoom out"
                      onClick={() => adjustScale(-0.1)}
                    >
                      <Minus className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Center canvas"
                      onClick={() => commitView(DEFAULT_VIEW)}
                    >
                      <Maximize className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Undo last view change"
                      disabled={historyIndex === 0}
                      onClick={() => restoreHistory(historyIndex - 1)}
                    >
                      <Undo2 className="size-4" />
                    </WorkspaceControlButton>
                    <WorkspaceControlButton
                      aria-label="Redo last view change"
                      disabled={historyIndex === history.length - 1}
                      onClick={() => restoreHistory(historyIndex + 1)}
                    >
                      <RotateCcw className="size-4 scale-x-[-1]" />
                    </WorkspaceControlButton>
                  </div>

                  <WorkspaceControlButton
                    active={showGuides}
                    aria-label={showGuides ? "Hide guides" : "Show guides"}
                    onClick={() =>
                      setShowGuides((currentValue) => !currentValue)
                    }
                  >
                    <Layers3 className="size-4" />
                  </WorkspaceControlButton>
                </div>

                {/* Canvas content */}
                <div
                  className="relative flex h-full w-full items-center justify-center overflow-hidden px-20 py-8"
                  style={{
                    transform: `translate(${view.x}px, ${view.y}px)`,
                    transition: isDragging
                      ? "none"
                      : "transform 180ms ease-out",
                  }}
                >
                  <div
                    className="relative cursor-default touch-none select-none"
                    data-drag-ignore="true"
                    style={{
                      transform: `scale(${view.scale})`,
                      transition: isDragging
                        ? "none"
                        : "transform 180ms ease-out",
                    }}
                  >
                    {/* Agent Nodes */}
                    {isPlaying && showGuides && <AgentNodes showFeedbackAgent={showFeedbackAgent} />}

                    <div className="relative w-full max-w-[1024px] rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,#1b1b21_0%,#0f1014_100%)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
                      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/8 bg-black/25 px-4 py-2">
                        <span className="size-2 rounded-full bg-[#ff5f57]" />
                        <span className="size-2 rounded-full bg-[#ffbd2e]" />
                        <span className="size-2 rounded-full bg-[#28ca42]" />
                      </div>

                      <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-white/10 bg-[#14151a]">
                        {previewStage === "splash" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Image
                              src="/phia-light.svg"
                              alt="Phia"
                              width={160}
                              height={160}
                              className="h-auto w-32"
                            />
                          </div>
                        ) : previewStage === "feed" ? (
                          <ExplorePreviewScreen
                            items={exploreCards}
                            curatedTypes={curatedCards}
                            trendItems={trendCards}
                            trendingBrands={trendingBrandRows}
                            searchLookCards={searchLookCards}
                            searchBrandCards={searchBrandCards}
                            trendingCollections={trendingCollections}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            topRoundedClassName="rounded-t-[20px]"
                            onShareTriggered={() => setShowFeedbackAgent(true)}
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(165deg,#191b23_0%,#12131a_45%,#20222e_100%)]" />
                            {showGuides ? (
                              <div className="absolute inset-8 rounded-2xl border border-dashed border-white/20 bg-black/10" />
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
