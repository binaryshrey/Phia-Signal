"use client";

import { useState, use } from "react";
import Image from "next/image";
import {
  RiThumbUpLine,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbDownFill,
  RiFireLine,
  RiChat3Line,
  RiSendPlane2Line,
  RiSignalWifi3Fill,
  RiBatteryFill,
} from "@remixicon/react";
import { useSharedCartStore, type SharedCartItem, type SharedComment } from "@/lib/shared-cart";

export default function SharedCartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: cartId } = use(params);
  const cart = useSharedCartStore((s) => s.getCart(cartId));
  const addVote = useSharedCartStore((s) => s.addVote);
  const addComment = useSharedCartStore((s) => s.addComment);

  const [userVotes, setUserVotes] = useState<Record<string, "cop" | "drop" | null>>({});
  const [friendName] = useState(() => {
    const names = ["Alex", "Sam", "Jordan", "Riley", "Casey", "Morgan"];
    return names[Math.floor(Math.random() * names.length)];
  });

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141210] text-white">
        <div className="text-center space-y-3">
          <Image src="/phia.svg" alt="Phia" width={40} height={40} className="mx-auto" />
          <p className="text-white/40 text-sm">This cart doesn&apos;t exist or has no items.</p>
        </div>
      </div>
    );
  }

  const handleVote = (itemId: string, type: "cop" | "drop") => {
    const current = userVotes[itemId];
    if (current === type) return; // Already voted this way
    setUserVotes((prev) => ({ ...prev, [itemId]: type }));
    addVote(cartId, itemId, type);
  };

  const handleComment = (itemId: string, text: string) => {
    if (!text.trim()) return;
    const comment: SharedComment = {
      id: `fc-${Date.now()}`,
      user: friendName,
      text: text.trim(),
      time: "now",
      likes: 0,
      source: "friend",
    };
    addComment(cartId, itemId, comment);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141210] p-4">
      {/* Phone frame */}
      <div className="relative w-full max-w-[375px]">
        <div className="rounded-[48px] border border-[#a5917a] bg-[linear-gradient(145deg,#d6c5a8,#5b4d42_34%,#0f0f10_68%,#cfc0a1)] p-[6px] shadow-[0_22px_70px_rgba(0,0,0,0.5)]">
          <div className="relative overflow-hidden rounded-[42px] bg-[#ECECEC]">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black/90" />

            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-black/80">
              <span>{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              <div className="flex items-center gap-1">
                <RiBatteryFill className="size-3.5" />
                <RiSignalWifi3Fill className="size-3.5" />
              </div>
            </div>

            {/* Header */}
            <div className="px-4 pt-2 pb-3">
              <div className="flex items-center gap-2">
                <Image src="/phia.svg" alt="Phia" width={20} height={20} />
                <span className="text-[13px] font-semibold text-black/80">Phia Signal</span>
                <span className="ml-auto text-[10px] text-black/30">Shared cart</span>
              </div>
              <p className="mt-1 text-[11px] text-black/40">
                Vote and comment on {friendName === "Alex" ? "your friend" : "this"}&apos;s picks
              </p>
            </div>

            {/* Items feed */}
            <div className="max-h-[70vh] overflow-y-auto px-3 pb-6 space-y-4">
              {cart.items.map((item) => (
                <SharedCartCard
                  key={item.id}
                  item={item}
                  votes={cart.votes[item.id] ?? { cop: 0, drop: 0 }}
                  comments={cart.comments[item.id] ?? []}
                  userVote={userVotes[item.id] ?? null}
                  friendName={friendName}
                  onVote={(type) => handleVote(item.id, type)}
                  onComment={(text) => handleComment(item.id, text)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SharedCartCard({
  item,
  votes,
  comments,
  userVote,
  friendName,
  onVote,
  onComment,
}: {
  item: SharedCartItem;
  votes: { cop: number; drop: number };
  comments: SharedComment[];
  userVote: "cop" | "drop" | null;
  friendName: string;
  onVote: (type: "cop" | "drop") => void;
  onComment: (text: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const total = votes.cop + votes.drop || 1;
  const heatPct = Math.round((votes.cop / total) * 100);

  return (
    <div className="rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full aspect-[4/5] object-cover"
        />

        {/* Heat badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-2.5 py-1">
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-rose-500">
            <RiFireLine className="size-3 text-white" />
          </div>
          <span className="text-[12px] font-bold text-black">{heatPct}%</span>
          <span className="text-[8px] font-semibold text-black/40 uppercase">Heat</span>
        </div>

        {/* Product info */}
        <div className="absolute top-3 right-3 rounded-xl bg-white/85 backdrop-blur-sm px-2.5 py-1.5 max-w-[55%]">
          <p className="text-[8px] font-semibold text-black/40 uppercase tracking-wider">{item.brand}</p>
          <p className="text-[11px] font-bold text-black truncate">{item.name}</p>
        </div>

        {/* Vote buttons */}
        <div className="absolute bottom-4 left-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onVote("drop")}
            className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-all ${
              userVote === "drop" ? "bg-rose-500 text-white scale-110" : "bg-white/85 text-rose-500"
            }`}
          >
            {userVote === "drop" ? <RiThumbDownFill className="size-5" /> : <RiThumbDownLine className="size-5" />}
          </button>
          <span className="mt-1 text-[11px] font-bold text-black">{votes.drop}</span>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onVote("cop")}
            className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-all ${
              userVote === "cop" ? "bg-emerald-500 text-white scale-110" : "bg-white/85 text-emerald-500"
            }`}
          >
            {userVote === "cop" ? <RiThumbUpFill className="size-5" /> : <RiThumbUpLine className="size-5" />}
          </button>
          <span className="mt-1 text-[11px] font-bold text-black">{votes.cop}</span>
        </div>
      </div>

      {/* Chat */}
      <div className="border-t border-black/5">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <RiChat3Line className="size-4 text-black/40" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Squad Chat</span>
          <span className="ml-auto text-[10px] font-bold text-black/30">{comments.length}</span>
        </div>

        {comments.length > 0 && (
          <div className="max-h-[100px] overflow-y-auto px-3 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  c.source === "friend" ? "bg-indigo-100 text-indigo-500" : "bg-black/5 text-black/40"
                }`}>
                  {c.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-black/70">{c.user}</span>
                    <span className="text-[9px] text-black/30">{c.time}</span>
                    {c.source === "friend" && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0 text-[7px] font-bold text-indigo-500">FRIEND</span>
                    )}
                  </div>
                  <p className="text-[11px] text-black/55 leading-snug">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 border-t border-black/5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && commentText.trim()) {
                onComment(commentText);
                setCommentText("");
              }
            }}
            placeholder={`Comment as ${friendName}...`}
            className="flex-1 bg-black/3 rounded-full px-3 py-1.5 text-[11px] text-black/70 placeholder:text-black/25 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (commentText.trim()) {
                onComment(commentText);
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
    </div>
  );
}
