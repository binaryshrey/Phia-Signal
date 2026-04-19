"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  RiThumbUpLine,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbDownFill,
  RiFireLine,
  RiChat3Line,
  RiSparklingLine,
  RiSendPlane2Line,
  RiDeleteBinLine,
  RiCloseLine,
} from "@remixicon/react";

type CartItem = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  linkUrl: string;
};

type TryOnResult = { label: string; src: string };

type Comment = {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
};

type PostState = {
  cop: number;
  drop: number;
  userVote: "cop" | "drop" | null;
  comments: Comment[];
  aiSummary: string | null;
  aiLoading: boolean;
  activeImageIndex: number;
};

const MOCK_COMMENTS: Comment[] = [
  { id: "c1", user: "Ava M.", text: "obsessed, this is giving main character energy", time: "2m", likes: 12 },
  { id: "c2", user: "Jordan K.", text: "idk the fit looks kinda off to me ngl", time: "5m", likes: 4 },
];

export function ReviewsFeed({
  items,
  onRemove,
  tryOnCache,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  tryOnCache: Record<string, TryOnResult[]>;
}) {
  const [postStates, setPostStates] = useState<Record<string, PostState>>(() => {
    const init: Record<string, PostState> = {};
    for (const item of items) {
      init[item.id] = {
        cop: Math.floor(Math.random() * 30) + 5,
        drop: Math.floor(Math.random() * 10) + 1,
        userVote: null,
        comments: [...MOCK_COMMENTS],
        aiSummary: null,
        aiLoading: false,
        activeImageIndex: 0,
      };
    }
    return init;
  });

  const handleVote = (id: string, vote: "cop" | "drop") => {
    setPostStates((prev) => {
      const s = prev[id];
      if (!s) return prev;
      const current = s.userVote;
      let { cop, drop } = s;
      if (current === "cop") cop--;
      if (current === "drop") drop--;
      const newVote = current === vote ? null : vote;
      if (newVote === "cop") cop++;
      if (newVote === "drop") drop++;
      return { ...prev, [id]: { ...s, cop, drop, userVote: newVote } };
    });
  };

  const setActiveImage = (id: string, index: number) => {
    setPostStates((prev) => {
      const s = prev[id];
      if (!s) return prev;
      return { ...prev, [id]: { ...s, activeImageIndex: index } };
    });
  };

  const addComment = (id: string, text: string) => {
    if (!text.trim()) return;
    setPostStates((prev) => {
      const s = prev[id];
      if (!s) return prev;
      const comment: Comment = {
        id: `c-${Date.now()}`,
        user: "You",
        text: text.trim(),
        time: "now",
        likes: 0,
      };
      return { ...prev, [id]: { ...s, comments: [...s.comments, comment] } };
    });
  };

  const generateSummary = async (id: string) => {
    setPostStates((prev) => {
      const s = prev[id];
      if (!s) return prev;
      if (s.aiSummary) return { ...prev, [id]: { ...s, aiSummary: null } };
      return { ...prev, [id]: { ...s, aiLoading: true } };
    });

    const s = postStates[id];
    if (s?.aiSummary) return;

    const item = items.find((i) => i.id === id);
    const summaries = [
      `bestie the squad is split on this ${item?.name ?? "fit"} fr fr. some say it's giving slay but others think it's giving npc energy. overall vibes: mid to fire depending on ur aura`,
      `ok so the ${item?.name ?? "piece"} is lowkey a serve according to the squad. the haters are just not seeing the vision tbh. cop verdict: it's a yes from us no cap`,
      `the girlies are DIVIDED on this one. half the squad said it's an instant cop and the other half is giving it the ick. conclusion: wear it with confidence and it'll eat`,
    ];

    await new Promise((r) => setTimeout(r, 1200));

    setPostStates((prev) => {
      const state = prev[id];
      if (!state) return prev;
      return {
        ...prev,
        [id]: {
          ...state,
          aiLoading: false,
          aiSummary: summaries[Math.floor(Math.random() * summaries.length)],
        },
      };
    });
  };

  if (items.length === 0) {
    return (
      <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-black/50">
        Add items to your bag to get squad feedback.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <AnimatePresence>
        {items.map((item) => {
          const s = postStates[item.id] ?? {
            cop: 0, drop: 0, userVote: null, comments: [], aiSummary: null, aiLoading: false, activeImageIndex: 0,
          };
          const total = s.cop + s.drop || 1;
          const heatPct = Math.round((s.cop / total) * 100);
          const tryOnImages = tryOnCache[item.imageUrl] ?? [];

          return (
            <ReviewCard
              key={item.id}
              item={item}
              state={s}
              heatPct={heatPct}
              tryOnImages={tryOnImages}
              onVote={(vote) => handleVote(item.id, vote)}
              onSetActiveImage={(idx) => setActiveImage(item.id, idx)}
              onAddComment={(text) => addComment(item.id, text)}
              onGenerateSummary={() => generateSummary(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ReviewCard({
  item,
  state,
  heatPct,
  tryOnImages,
  onVote,
  onSetActiveImage,
  onAddComment,
  onGenerateSummary,
  onRemove,
}: {
  item: CartItem;
  state: PostState;
  heatPct: number;
  tryOnImages: TryOnResult[];
  onVote: (vote: "cop" | "drop") => void;
  onSetActiveImage: (idx: number) => void;
  onAddComment: (text: string) => void;
  onGenerateSummary: () => void;
  onRemove: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const allImages = [
    { src: item.imageUrl, label: "Product" },
    ...tryOnImages,
  ];

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) {
      onRemove();
    }
  };

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const slideWidth = el.clientWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    onSetActiveImage(Math.max(0, Math.min(index, allImages.length - 1)));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Swipe background */}
      <div className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl bg-red-50">
        <div className="flex items-center gap-2 text-red-400">
          <RiDeleteBinLine className="size-5" />
          <span className="text-xs font-semibold">Remove</span>
        </div>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98 }}
        className="relative rounded-2xl bg-white overflow-hidden shadow-sm"
      >
        {/* Image carousel */}
        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {allImages.map((img, i) => (
              <div key={i} className="w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`${item.name} - ${img.label}`}
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>
            ))}
          </div>

          {/* Image dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === state.activeImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Slide label */}
          {state.activeImageIndex > 0 && (
            <div className="absolute bottom-14 left-3 rounded-full bg-white/80 backdrop-blur-sm px-2 py-0.5">
              <span className="text-[9px] font-semibold text-black/60">{allImages[state.activeImageIndex]?.label}</span>
            </div>
          )}

          {/* Heat level badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-2.5 py-1">
            <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-rose-500">
              <RiFireLine className="size-3 text-white" />
            </div>
            <div>
              <span className="text-[12px] font-bold text-black">{heatPct}%</span>
              <span className="text-[8px] font-semibold text-black/40 uppercase tracking-wider ml-1">Heat</span>
            </div>
          </div>

          {/* Product info badge */}
          <div className="absolute top-3 right-3 rounded-xl bg-white/85 backdrop-blur-sm px-2.5 py-1.5 max-w-[55%]">
            <p className="text-[8px] font-semibold text-black/40 uppercase tracking-wider">{item.brand}</p>
            <p className="text-[11px] font-bold text-black truncate">{item.name}</p>
          </div>

          {/* Delete button */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-12 right-3 flex size-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <RiCloseLine className="size-4 text-black/50" />
          </button>

          {/* Vote buttons */}
          <div className="absolute bottom-4 left-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onVote("drop")}
              className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-all ${
                state.userVote === "drop"
                  ? "bg-rose-500 text-white scale-110"
                  : "bg-white/85 text-rose-500"
              }`}
            >
              {state.userVote === "drop" ? (
                <RiThumbDownFill className="size-5" />
              ) : (
                <RiThumbDownLine className="size-5" />
              )}
            </button>
            <span className="mt-1 text-[11px] font-bold text-black">{state.drop}</span>
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onVote("cop")}
              className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-all ${
                state.userVote === "cop"
                  ? "bg-emerald-500 text-white scale-110"
                  : "bg-white/85 text-emerald-500"
              }`}
            >
              {state.userVote === "cop" ? (
                <RiThumbUpFill className="size-5" />
              ) : (
                <RiThumbUpLine className="size-5" />
              )}
            </button>
            <span className="mt-1 text-[11px] font-bold text-black">{state.cop}</span>
          </div>
        </div>

        {/* Squad Chat */}
        <div className="border-t border-black/5">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1.5">
              <RiChat3Line className="size-4 text-black/40" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Squad Chat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onGenerateSummary}
                disabled={state.aiLoading}
                className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold text-black/50 hover:bg-black/5"
              >
                <RiSparklingLine className="size-3" />
                AI
              </button>
              <span className="text-[10px] font-bold text-black/30">{state.comments.length}</span>
            </div>
          </div>

          {/* AI Summary */}
          <AnimatePresence>
            {state.aiLoading && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 pb-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2">
                  <svg className="size-3.5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-[10px] text-indigo-500 font-medium">Analyzing squad vibe...</span>
                </div>
              </motion.div>
            )}
            {state.aiSummary && !state.aiLoading && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 pb-2 overflow-hidden"
              >
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <RiSparklingLine className="size-3 text-indigo-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">AI Summary</span>
                  </div>
                  <p className="text-[11px] italic leading-relaxed text-black/60">{state.aiSummary}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comments */}
          <div className="max-h-[120px] overflow-y-auto px-3 space-y-2">
            {state.comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-[9px] font-bold text-black/40">
                  {c.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-black/70">{c.user}</span>
                    <span className="text-[9px] text-black/30">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-black/55 leading-snug">{c.text}</p>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[9px] text-black/25">&hearts;</span>
                  <span className="text-[8px] text-black/25">{c.likes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-black/5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) {
                  onAddComment(commentText);
                  setCommentText("");
                }
              }}
              placeholder="Add to the discussion..."
              className="flex-1 bg-black/3 rounded-full px-3 py-1.5 text-[11px] text-black/70 placeholder:text-black/25 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (commentText.trim()) {
                  onAddComment(commentText);
                  setCommentText("");
                }
              }}
              disabled={!commentText.trim()}
              className="flex size-7 items-center justify-center rounded-full bg-black/5 text-black/30 disabled:opacity-30"
            >
              <RiSendPlane2Line className="size-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
