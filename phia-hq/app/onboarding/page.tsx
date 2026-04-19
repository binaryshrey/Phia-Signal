"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiUploadCloud2Line,
  RiImageAddLine,
  RiCloseLine,
  RiCheckLine,
  RiArrowRightLine,
  RiSparklingLine,
  RiBodyScanLine,
  RiTShirtLine,
  RiShuffleLine,
} from "@remixicon/react";
import { useProfileStore, type PhotoType } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const BUCKET = "phia";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadedFile = {
  uid: string; // unique id within a slot
  name: string;
  url: string; // blob URL for instant preview
  storagePath: string | null; // path in Supabase Storage (null while uploading)
  publicUrl: string | null; // public URL after upload
  uploading: boolean;
  error: string | null;
};

type PhotoSlot = {
  id: PhotoType;
  label: string;
  hint: string;
  icon: React.ReactNode;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SKIN_TONES = [
  { id: "fair", label: "Fair", color: "#F9E4C8" },
  { id: "light", label: "Light", color: "#F0C9A0" },
  { id: "medium", label: "Medium", color: "#D4956A" },
  { id: "tan", label: "Tan", color: "#C07E4F" },
  { id: "deep", label: "Deep", color: "#8B5A2B" },
  { id: "rich", label: "Rich", color: "#4A2512" },
];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const PANT_SIZES = ["26", "28", "30", "32", "34", "36", "38", "40"];

const SHOE_SIZES = [
  "6",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "12",
  "13",
];

const PALETTE_COLORS = [
  { id: "black", label: "Black", color: "#1A1A1A" },
  { id: "white", label: "White", color: "#F5F5F0" },
  { id: "cream", label: "Cream", color: "#F5F0E8" },
  { id: "beige", label: "Beige", color: "#D4C5A9" },
  { id: "brown", label: "Brown", color: "#8B6914" },
  { id: "navy", label: "Navy", color: "#1B2A4A" },
  { id: "camel", label: "Camel", color: "#C19A6B" },
  { id: "olive", label: "Olive", color: "#6B7A3D" },
  { id: "burgundy", label: "Burgundy", color: "#722F37" },
  { id: "blush", label: "Blush", color: "#E8B4B8" },
  { id: "slate", label: "Slate", color: "#7A8B9A" },
  { id: "sage", label: "Sage", color: "#9CAF88" },
  { id: "rust", label: "Rust", color: "#B5451B" },
  { id: "cobalt", label: "Cobalt", color: "#2C4BB4" },
  { id: "emerald", label: "Emerald", color: "#2D6A4F" },
  { id: "gold", label: "Gold", color: "#C9A84C" },
];

const PATTERNS_TO_AVOID = [
  { id: "floral", label: "Floral", image: "🌸" },
  { id: "stripes", label: "Stripes", image: "▬" },
  { id: "polka-dots", label: "Polka Dots", image: "⚬" },
  { id: "plaid", label: "Plaid", image: "🏁" },
  { id: "animal-print", label: "Animal Print", image: "🐆" },
  { id: "paisley", label: "Paisley", image: "🪬" },
  { id: "camo", label: "Camo", image: "🌿" },
  { id: "tie-dye", label: "Tie Dye", image: "🌀" },
  { id: "tropical", label: "Tropical", image: "🌴" },
  { id: "argyle", label: "Argyle", image: "◆" },
  { id: "abstract", label: "Abstract", image: "🎨" },
  { id: "neon", label: "Neon Colors", image: "💡" },
];

const CELEBRITIES = [
  {
    id: "jasmine-tookes",
    name: "Jasmine Tookes",
    image: "/celebrities/jasmine-tookes.jpg",
    tryon: "/celebrities/tryon/jasmine-tookes.png",
  },
  {
    id: "paris-hilton",
    name: "Paris Hilton",
    image: "/celebrities/paris-hilton.jpg",
    tryon: "/celebrities/tryon/paris-hilton.png",
  },
  {
    id: "toni-breidinger",
    name: "Toni Breidinger",
    image: "/celebrities/toni-breidinger.jpg",
    tryon: "/celebrities/tryon/toni-breidinger.png",
  },
  {
    id: "zara-larsson",
    name: "Zara Larsson",
    image: "/celebrities/zara-larsson.jpg",
    tryon: "/celebrities/tryon/zara-larsson.png",
  },
  {
    id: "mckenna-grace",
    name: "McKenna Grace",
    image: "/celebrities/mckenna-grace.jpg",
    tryon: "/celebrities/tryon/mckenna-grace.png",
  },
  {
    id: "hanna-goefft",
    name: "Hanna Goefft",
    image: "/celebrities/hanna-goefft.jpg",
    tryon: "/celebrities/tryon/hanna-goefft.png",
  },
  {
    id: "zendaya",
    name: "Zendaya",
    image: "/celebrities/zendaya.jpg",
    tryon: "/celebrities/tryon/zendaya.png",
  },
  {
    id: "chloe-shih",
    name: "Chloe Shih",
    image: "/celebrities/chloe-shih.jpg",
    tryon: "/celebrities/tryon/chloe-shih.png",
  },
];

const BRANDS = [
  "Zara",
  "H&M",
  "Uniqlo",
  "Mango",
  "COS",
  "& Other Stories",
  "Arket",
  "Massimo Dutti",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Levi's",
  "Acne Studios",
  "Toteme",
  "The Row",
  "Jacquemus",
  "Sandro",
  "A.P.C.",
  "Ami Paris",
  "Brunello Cucinelli",
  "Loro Piana",
  "Issey Miyake",
  "Bottega Veneta",
  "Prada",
  "Gucci",
];

const STYLE_VIBES = [
  { id: "minimal", label: "Minimal", emoji: "◻️" },
  { id: "classic", label: "Classic", emoji: "🎩" },
  { id: "casual", label: "Casual", emoji: "👕" },
  { id: "streetwear", label: "Streetwear", emoji: "🧢" },
  { id: "bohemian", label: "Bohemian", emoji: "🌸" },
  { id: "preppy", label: "Preppy", emoji: "⚓" },
  { id: "edgy", label: "Edgy", emoji: "🖤" },
  { id: "romantic", label: "Romantic", emoji: "🌹" },
  { id: "athleisure", label: "Athleisure", emoji: "🏃" },
  { id: "business", label: "Business", emoji: "💼" },
];

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: "selfie",
    label: "Face / Selfie",
    hint: "Clear front-facing photo",
    icon: <RiBodyScanLine className="size-5 text-[#9C8B7A]" />,
  },
  {
    id: "full-body",
    label: "Full Body",
    hint: "Head-to-toe standing photo",
    icon: <RiTShirtLine className="size-5 text-[#9C8B7A]" />,
  },
  {
    id: "outfit",
    label: "Outfit You Love",
    hint: "A look you already wear",
    icon: <RiShuffleLine className="size-5 text-[#9C8B7A]" />,
  },
  {
    id: "extra",
    label: "Extra Reference",
    hint: "Inspo, mood board, etc.",
    icon: <RiImageAddLine className="size-5 text-[#9C8B7A]" />,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

async function uploadToSupabase(
  file: File,
  slotId: PhotoType,
  uid: string,
): Promise<{ storagePath: string; publicUrl: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `onboarding/${slotId}/${uid}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { storagePath: path, publicUrl: data.publicUrl };
}

// ─── Primitive components ─────────────────────────────────────────────────────

function SizeChip({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150
        ${
          selected
            ? "bg-[#8B6914] border-[#8B6914] text-white shadow-sm"
            : "bg-white border-[#DDD0BE] text-[#5A4A3A] hover:border-[#C4A882] hover:bg-[#FAF7F2]"
        }`}
    >
      {value}
    </button>
  );
}

function ColorSwatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`relative size-8 rounded-full border-2 transition-all duration-150 hover:scale-110
        ${selected ? "border-[#8B6914] scale-110 shadow-md" : "border-transparent"}`}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <RiCheckLine
            className="size-3.5"
            style={{ color: isLight(color) ? "#5A4A3A" : "#FAF7F2" }}
          />
        </span>
      )}
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm border transition-all duration-150
        ${
          selected
            ? "bg-[#8B6914] border-[#8B6914] text-white"
            : "bg-white border-[#DDD0BE] text-[#5A4A3A] hover:border-[#C4A882] hover:bg-[#FAF7F2]"
        }`}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[#3A2D22]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#9C8B7A] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Photo upload slot ────────────────────────────────────────────────────────

function PhotoUploadSlot({
  slot,
  files,
  onAdd,
  onRemove,
}: {
  slot: PhotoSlot;
  files: UploadedFile[];
  onAdd: (slotId: PhotoType, picked: FileList) => void;
  onRemove: (slotId: PhotoType, uid: string) => void;
}) {
  const hasFiles = files.length > 0;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) onAdd(slot.id, e.dataTransfer.files);
    },
    [slot.id, onAdd],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone — always visible */}
      <label
        htmlFor={`upload-${slot.id}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`group flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 w-full
          ${hasFiles ? "h-24 border-[#C4A882] bg-[#F5EFE6]" : "h-44 border-[#DDD0BE] bg-[#FAF7F2] hover:border-[#C4A882] hover:bg-[#F5EFE6]"}`}
      >
        <div
          className={`flex items-center justify-center rounded-full bg-[#EDE4D8] group-hover:bg-[#E3D5C5] transition-colors ${hasFiles ? "size-8" : "size-10"}`}
        >
          {hasFiles ? (
            <RiImageAddLine className="size-4 text-[#9C8B7A]" />
          ) : (
            slot.icon
          )}
        </div>
        <div className="text-center px-4">
          {hasFiles ? (
            <p className="text-xs text-[#9C8B7A]">Add more photos</p>
          ) : (
            <>
              <p className="text-sm font-medium text-[#5A4A3A]">{slot.label}</p>
              <p className="text-xs text-[#9C8B7A] mt-0.5">{slot.hint}</p>
            </>
          )}
        </div>
        {!hasFiles && (
          <div className="flex items-center gap-1.5 text-xs text-[#C4A882]">
            <RiUploadCloud2Line className="size-3.5" />
            <span>Click or drag to upload</span>
          </div>
        )}
      </label>
      <input
        id={`upload-${slot.id}`}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(slot.id, e.target.files);
          // reset so same file can be re-added after removal
          e.target.value = "";
        }}
      />

      {/* Thumbnail strip */}
      {hasFiles && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {files.map((f) => (
            <div
              key={f.uid}
              className="relative shrink-0 size-16 rounded-xl overflow-hidden border border-[#E3D5C5]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.name}
                className={`h-full w-full object-cover transition-opacity ${f.uploading ? "opacity-40" : "opacity-100"}`}
              />

              {/* Uploading spinner */}
              {f.uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="size-5 animate-spin text-[#8B6914]"
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
                </div>
              )}

              {/* Error indicator */}
              {f.error && !f.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <span className="text-[9px] text-red-600 font-medium px-1 text-center leading-tight">
                    Failed
                  </span>
                </div>
              )}

              {/* Remove button — only show when not uploading */}
              {!f.uploading && (
                <button
                  type="button"
                  onClick={() => onRemove(slot.id, f.uid)}
                  className="absolute top-0.5 right-0.5 size-4 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                >
                  <RiCloseLine className="size-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 1: AI Upload ─────────────────────────────────────────────────────────

function AIUploadTab({
  files,
  onAdd,
  onRemove,
}: {
  files: Partial<Record<PhotoType, UploadedFile[]>>;
  onAdd: (slotId: PhotoType, picked: FileList) => void;
  onRemove: (slotId: PhotoType, uid: string) => void;
}) {
  const slotsWithFiles = PHOTO_SLOTS.filter(
    (s) => (files[s.id]?.length ?? 0) > 0,
  ).length;
  const totalImages = Object.values(files).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl bg-[#F5EFE6] border border-[#E3D5C5] px-4 py-3.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EDE4D8]">
          <RiSparklingLine className="size-4 text-[#8B6914]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#3A2D22]">
            Let Phia learn your look
          </p>
          <p className="text-xs text-[#7A6A5A] mt-0.5 leading-relaxed">
            Upload multiple photos per category — the more Phia sees, the better
            it understands your body shape, complexion, and personal style.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {PHOTO_SLOTS.map((slot) => (
          <PhotoUploadSlot
            key={slot.id}
            slot={slot}
            files={files[slot.id] ?? []}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>

      {totalImages > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9C8B7A]">
            <span>
              {totalImages} photo{totalImages !== 1 ? "s" : ""} across{" "}
              {slotsWithFiles} of 4 categories
            </span>
            <span>{Math.round((slotsWithFiles / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EDE4D8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8B6914] transition-all duration-500"
              style={{ width: `${(slotsWithFiles / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Instagram import */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E3D5C5]" />
          <span className="text-xs text-[#9C8B7A]">or add from Instagram</span>
          <div className="h-px flex-1 bg-[#E3D5C5]" />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[#DDD0BE] bg-white px-3 py-2.5">
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-[#9C8B7A]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle
              cx="17.5"
              cy="6.5"
              r="1.5"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          <span className="text-sm text-[#9C8B7A]">instagram.com/@</span>
          <input
            type="text"
            placeholder="username"
            className="flex-1 bg-transparent text-sm text-[#3A2D22] placeholder:text-[#C4A882] outline-none"
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[#DDD0BE] px-3.5 py-1.5 text-xs font-medium text-[#5A4A3A] hover:bg-[#F5EFE6] transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Manual Setup ──────────────────────────────────────────────────────

type CustomVibe = { id: string; label: string; emoji: string };

type ManualState = {
  skinTone: string;
  skinToneDetecting: boolean;
  clothingSize: string;
  clothingSizeDetecting: boolean;
  pantSize: string;
  pantSizeDetecting: boolean;
  shoeSize: string;
  selectedColors: Set<string>;
  selectedTextures: Set<string>;
  selectedBrands: Set<string>;
  selectedCelebs: Set<string>;
  selectedVibes: Set<string>;
  customVibes: CustomVibe[];
  outfitDetecting: boolean;
};

type ManualSetters = {
  setSkinTone: (v: string) => void;
  setClothingSize: (v: string) => void;
  setPantSize: (v: string) => void;
  setShoeSize: (v: string) => void;
  toggleColor: (v: string) => void;
  toggleTexture: (v: string) => void;
  toggleBrand: (v: string) => void;
  toggleVibe: (v: string) => void;
  toggleCeleb: (v: string) => void;
};

function ManualSetupTab({
  state,
  setters,
}: {
  state: ManualState;
  setters: ManualSetters;
}) {
  const {
    skinTone,
    skinToneDetecting,
    clothingSize,
    clothingSizeDetecting,
    pantSize,
    pantSizeDetecting,
    shoeSize,
    selectedColors,
    selectedTextures,
    selectedBrands,
    selectedVibes,
    selectedCelebs,
    customVibes,
    outfitDetecting,
  } = state;
  const {
    setSkinTone,
    setClothingSize,
    setPantSize,
    setShoeSize,
    toggleColor,
    toggleTexture,
    toggleBrand,
    toggleVibe,
    toggleCeleb,
  } = setters;

  return (
    <div className="space-y-8">
      <Section
        title="Skin Tone"
        subtitle={
          skinToneDetecting
            ? undefined
            : skinTone
              ? "Auto-detected from your selfie — tap to change"
              : "Helps Phia suggest flattering colors for you"
        }
      >
        {/* Detecting banner */}
        {skinToneDetecting && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EFE6] border border-[#E3D5C5] px-3.5 py-2.5 mb-1">
            <svg
              className="size-3.5 shrink-0 animate-spin text-[#8B6914]"
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
            <p className="text-xs text-[#7A6A5A]">
              Phia is analysing your selfie to detect your skin tone…
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          {SKIN_TONES.map((tone) => (
            <div key={tone.id} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSkinTone(skinTone === tone.id ? "" : tone.id)}
                title={tone.label}
                className={`size-10 rounded-full border-2 transition-all duration-200 hover:scale-110
                  ${
                    skinTone === tone.id
                      ? "border-[#8B6914] scale-110 shadow-md ring-2 ring-[#8B6914]/20"
                      : skinToneDetecting
                        ? "border-transparent opacity-40 cursor-wait"
                        : "border-transparent"
                  }`}
                style={{ backgroundColor: tone.color }}
                disabled={skinToneDetecting}
              >
                {skinTone === tone.id && (
                  <span className="flex items-center justify-center h-full">
                    <RiCheckLine className="size-4 text-[#5A4A3A]" />
                  </span>
                )}
              </button>
              <span
                className={`text-[10px] transition-colors ${skinTone === tone.id ? "text-[#8B6914] font-medium" : "text-[#9C8B7A]"}`}
              >
                {tone.label}
              </span>
            </div>
          ))}
        </div>

        {/* AI badge when auto-detected */}
        {skinTone && !skinToneDetecting && (
          <div className="flex items-center gap-1.5 mt-1">
            <RiSparklingLine className="size-3 text-[#8B6914]" />
            <span className="text-[10px] text-[#8B6914] font-medium">
              Detected by Phia AI
            </span>
          </div>
        )}
      </Section>

      <Section
        title="Clothing Size"
        subtitle={
          clothingSizeDetecting
            ? undefined
            : clothingSize
              ? "Auto-detected from your full body photo — tap to change"
              : "Your typical top/dress size"
        }
      >
        {clothingSizeDetecting && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EFE6] border border-[#E3D5C5] px-3.5 py-2.5 mb-1">
            <svg
              className="size-3.5 shrink-0 animate-spin text-[#8B6914]"
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
            <p className="text-xs text-[#7A6A5A]">
              Phia is analysing your photos to estimate your clothing size…
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {CLOTHING_SIZES.map((s) => (
            <SizeChip
              key={s}
              value={s}
              selected={clothingSize === s}
              onClick={() => setClothingSize(clothingSize === s ? "" : s)}
            />
          ))}
        </div>
        {clothingSize && !clothingSizeDetecting && (
          <div className="flex items-center gap-1.5 mt-1">
            <RiSparklingLine className="size-3 text-[#8B6914]" />
            <span className="text-[10px] text-[#8B6914] font-medium">
              Detected by Phia AI
            </span>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section
          title="Pant Size (waist)"
          subtitle={
            pantSizeDetecting
              ? undefined
              : pantSize
                ? "Auto-detected — tap to change"
                : "In inches"
          }
        >
          {pantSizeDetecting && (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EFE6] border border-[#E3D5C5] px-3.5 py-2.5 mb-1">
              <svg
                className="size-3.5 shrink-0 animate-spin text-[#8B6914]"
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
              <p className="text-xs text-[#7A6A5A]">
                Estimating your pant size…
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {PANT_SIZES.map((s) => (
              <SizeChip
                key={s}
                value={s}
                selected={pantSize === s}
                onClick={() => setPantSize(pantSize === s ? "" : s)}
              />
            ))}
          </div>
          {pantSize && !pantSizeDetecting && (
            <div className="flex items-center gap-1.5 mt-1">
              <RiSparklingLine className="size-3 text-[#8B6914]" />
              <span className="text-[10px] text-[#8B6914] font-medium">
                Detected by Phia AI
              </span>
            </div>
          )}
        </Section>
        <Section title="Shoe Size (US)" subtitle="Your standard size">
          <div className="flex flex-wrap gap-2">
            {SHOE_SIZES.map((s) => (
              <SizeChip
                key={s}
                value={s}
                selected={shoeSize === s}
                onClick={() => setShoeSize(shoeSize === s ? "" : s)}
              />
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Your Style Vibe"
        subtitle={
          outfitDetecting
            ? undefined
            : selectedVibes.size > 0
              ? "Auto-detected from your outfits — tap to adjust"
              : "Pick all that feel like you"
        }
      >
        {outfitDetecting && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EFE6] border border-[#E3D5C5] px-3.5 py-2.5 mb-1">
            <svg
              className="size-3.5 shrink-0 animate-spin text-[#8B6914]"
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
            <p className="text-xs text-[#7A6A5A]">
              Phia is analysing your outfit photos to detect your style…
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {STYLE_VIBES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => toggleVibe(v.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition-all duration-150
                ${
                  selectedVibes.has(v.id)
                    ? "bg-[#8B6914] border-[#8B6914] text-white"
                    : "bg-white border-[#DDD0BE] text-[#5A4A3A] hover:border-[#C4A882] hover:bg-[#FAF7F2]"
                }`}
            >
              <span className="text-base leading-none">{v.emoji}</span>
              {v.label}
            </button>
          ))}
          {/* Custom AI-detected vibes that aren't in the predefined list */}
          {customVibes.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => toggleVibe(v.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition-all duration-150
                ${
                  selectedVibes.has(v.id)
                    ? "bg-[#8B6914] border-[#8B6914] text-white"
                    : "bg-white border-[#DDD0BE] text-[#5A4A3A] hover:border-[#C4A882] hover:bg-[#FAF7F2]"
                }`}
            >
              <span className="text-base leading-none">{v.emoji}</span>
              {v.label}
            </button>
          ))}
        </div>
        {selectedVibes.size > 0 && !outfitDetecting && (
          <div className="flex items-center gap-1.5 mt-1">
            <RiSparklingLine className="size-3 text-[#8B6914]" />
            <span className="text-[10px] text-[#8B6914] font-medium">
              Detected by Phia AI
            </span>
          </div>
        )}
      </Section>

      <Section
        title="Favourite Colors"
        subtitle={
          outfitDetecting
            ? undefined
            : selectedColors.size > 0
              ? "Auto-detected from your outfits — tap to adjust"
              : "Shades you gravitate toward"
        }
      >
        {outfitDetecting && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EFE6] border border-[#E3D5C5] px-3.5 py-2.5 mb-1">
            <svg
              className="size-3.5 shrink-0 animate-spin text-[#8B6914]"
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
            <p className="text-xs text-[#7A6A5A]">
              Detecting your favourite colors…
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2.5">
          {PALETTE_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.color}
              label={c.label}
              selected={selectedColors.has(c.id)}
              onClick={() => toggleColor(c.id)}
            />
          ))}
        </div>
        {selectedColors.size > 0 && (
          <>
            <p className="text-xs text-[#9C8B7A] mt-1">
              {[...selectedColors]
                .map((id) => PALETTE_COLORS.find((c) => c.id === id)?.label)
                .filter(Boolean)
                .join(", ")}
            </p>
            {!outfitDetecting && (
              <div className="flex items-center gap-1.5 mt-1">
                <RiSparklingLine className="size-3 text-[#8B6914]" />
                <span className="text-[10px] text-[#8B6914] font-medium">
                  Detected by Phia AI
                </span>
              </div>
            )}
          </>
        )}
      </Section>

      <Section
        title="Patterns to Avoid"
        subtitle="Select patterns you don't want Phia to recommend"
      >
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS_TO_AVOID.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleTexture(p.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition-all duration-150
                ${
                  selectedTextures.has(p.id)
                    ? "border-red-400 bg-red-50 shadow-sm"
                    : "border-[#DDD0BE] bg-white hover:border-[#C4A882] hover:bg-[#FAF7F2]"
                }`}
            >
              <span className="text-2xl leading-none">{p.image}</span>
              <span
                className={`text-[11px] font-medium ${selectedTextures.has(p.id) ? "text-red-600" : "text-[#5A4A3A]"}`}
              >
                {p.label}
              </span>
              {selectedTextures.has(p.id) && (
                <span className="text-[9px] text-red-400 font-medium">
                  Avoiding
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Brands You Love" subtitle="Labels you already trust">
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <Chip
              key={b}
              label={b}
              selected={selectedBrands.has(b)}
              onClick={() => toggleBrand(b)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Celebrity Watchlist"
        subtitle="Whose style do you admire?"
      >
        <div className="grid grid-cols-4 gap-2">
          {CELEBRITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCeleb(c.id)}
              className="relative overflow-hidden rounded-xl aspect-[3/4] group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-x-0 bottom-0 p-1.5">
                <p className="text-[9px] font-semibold text-white text-center leading-tight drop-shadow-sm">
                  {c.name}
                </p>
              </div>
              {selectedCelebs.has(c.id) && (
                <div className="absolute inset-0 border-3 border-[#8B6914] rounded-xl">
                  <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-[#8B6914]">
                    <RiCheckLine className="size-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Save loader overlay ──────────────────────────────────────────────────────

const LOADER_STEPS = [
  "Uploading your photos…",
  "Teaching Phia your style…",
  "Building your profile…",
  "Almost ready…",
];

function SaveLoader({ uploadProgress }: { uploadProgress: number }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADER_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF7F2]">
      {/* Animated logo */}
      <div className="relative mb-10 flex items-center justify-center">
        {/* Outer ring */}
        <svg className="absolute size-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#EDE4D8"
            strokeWidth="4"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#8B6914"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - uploadProgress / 100)}`}
            className="transition-all duration-500"
          />
        </svg>
        {/* Pulsing logo */}
        <div className="animate-pulse">
          <Image src="/phia.svg" alt="Phia" width={36} height={36} />
        </div>
      </div>

      {/* Step text */}
      <p
        key={stepIndex}
        className="text-base font-medium text-[#3A2D22] animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {LOADER_STEPS[stepIndex]}
      </p>
      <p className="mt-1.5 text-sm text-[#9C8B7A]">{uploadProgress}%</p>

      {/* Dot trail */}
      <div className="mt-8 flex gap-2">
        {LOADER_STEPS.map((_, i) => (
          <span
            key={i}
            className={`size-1.5 rounded-full transition-all duration-300 ${
              i <= stepIndex ? "bg-[#8B6914]" : "bg-[#DDD0BE]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { savePreferences, markCompleted } = useProfileStore();
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingNext, setProcessingNext] = useState(false);

  // ── ElevenLabs Voice Agent (direct WebSocket, one-way) ───────────────────
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioChunksRef = useRef<string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const nextPlayTimeRef = useRef(0);
  const sampleRateRef = useRef(16000);

  const playBufferedChunks = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== "running") return;

    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];

    for (const base64Audio of chunks) {
      const raw = atob(base64Audio);
      const pcm16 = new Int16Array(raw.length / 2);
      for (let i = 0; i < pcm16.length; i++) {
        pcm16[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
      }
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }
      const buffer = ctx.createBuffer(1, float32.length, sampleRateRef.current);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
    }
  }, []);

  // Unlock audio on any user interaction
  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    audioCtxRef.current.resume().then(() => {
      nextPlayTimeRef.current = audioCtxRef.current!.currentTime;
      setAudioUnlocked(true);
      setAgentSpeaking(true);
      playBufferedChunks();
    });
  }, [audioUnlocked, playBufferedChunks]);

  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [unlockAudio]);

  useEffect(() => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) return;

    const connect = () => {
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[11Labs] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "conversation_initiation_metadata": {
              const format = String(
                msg.conversation_initiation_metadata_event
                  ?.agent_output_audio_format ?? "",
              );
              const match = format.match(/pcm_(\d+)/i);
              if (match?.[1]) sampleRateRef.current = Number(match[1]);

              // Trigger agent greeting
              ws.send(
                JSON.stringify({
                  type: "user_message",
                  text: "Welcome me to Phia onboarding. Briefly explain that I can upload photos and set my style preferences. Keep it warm, short, and friendly.",
                }),
              );
              break;
            }

            case "audio":
              if (msg.audio_event?.audio_base_64) {
                const ctx = audioCtxRef.current;
                if (ctx && ctx.state === "running") {
                  // Play immediately
                  audioChunksRef.current.push(msg.audio_event.audio_base_64);
                  playBufferedChunks();
                } else {
                  // Buffer for later
                  audioChunksRef.current.push(msg.audio_event.audio_base_64);
                }
              }
              break;

            case "ping":
              ws.send(
                JSON.stringify({
                  type: "pong",
                  event_id: msg.ping_event?.event_id,
                }),
              );
              break;

            default:
              break;
          }
        } catch {
          // skip
        }
      };

      ws.onclose = () => {
        console.log("[11Labs] WebSocket closed");
        setAgentSpeaking(false);
      };

      ws.onerror = (err) => {
        console.error("[11Labs] WebSocket error:", err);
        setAgentSpeaking(false);
      };
    };

    const timer = setTimeout(connect, 600);
    return () => {
      clearTimeout(timer);
      wsRef.current?.close();
      audioCtxRef.current?.close();
    };
  }, [playBufferedChunks]);

  // Track in-flight upload promises so handleSave can await them all
  const pendingUploads = useRef<Set<Promise<void>>>(new Set());

  // ── AI tab state ──────────────────────────────────────────────────────────
  const [files, setFiles] = useState<
    Partial<Record<PhotoType, UploadedFile[]>>
  >({});

  const addFilesToSlot = useCallback(
    async (targetSlot: PhotoType, imageFiles: File[]) => {
      const placeholders: UploadedFile[] = imageFiles.map((f) => ({
        uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        url: URL.createObjectURL(f),
        storagePath: null,
        publicUrl: null,
        uploading: true,
        error: null,
      }));

      setFiles((prev) => ({
        ...prev,
        [targetSlot]: [...(prev[targetSlot] ?? []), ...placeholders],
      }));

      const uploadAll = Promise.all(
        imageFiles.map(async (f, i) => {
          const uid = placeholders[i].uid;
          const result = await uploadToSupabase(f, targetSlot, uid);
          setFiles((prev) => {
            const current = prev[targetSlot] ?? [];
            return {
              ...prev,
              [targetSlot]: current.map((entry) =>
                entry.uid !== uid
                  ? entry
                  : "error" in result
                    ? { ...entry, uploading: false, error: result.error }
                    : {
                        ...entry,
                        uploading: false,
                        storagePath: result.storagePath,
                        publicUrl: result.publicUrl,
                      },
              ),
            };
          });
        }),
      ).then(() => {
        pendingUploads.current.delete(uploadAll as unknown as Promise<void>);
      });

      pendingUploads.current.add(uploadAll as unknown as Promise<void>);
      await uploadAll;
    },
    [],
  );

  const handleAdd = useCallback(
    async (slotId: PhotoType, picked: FileList) => {
      const imageFiles = Array.from(picked).filter((f) =>
        f.type.startsWith("image/"),
      );

      if (slotId === "selfie" && imageFiles.length > 3) {
        // Distribute: first 3 → selfie, next 3 → full-body, rest → outfit
        const selfieFiles = imageFiles.slice(0, 3);
        const fullBodyFiles = imageFiles.slice(3, 6);
        const outfitFiles = imageFiles.slice(6, 9);

        const uploads: Promise<void>[] = [];
        if (selfieFiles.length > 0)
          uploads.push(addFilesToSlot("selfie", selfieFiles));
        if (fullBodyFiles.length > 0)
          uploads.push(addFilesToSlot("full-body", fullBodyFiles));
        if (outfitFiles.length > 0)
          uploads.push(addFilesToSlot("outfit", outfitFiles));
        await Promise.all(uploads);
      } else {
        await addFilesToSlot(slotId, imageFiles);
      }
    },
    [addFilesToSlot],
  );

  const handleRemove = useCallback(async (slotId: PhotoType, uid: string) => {
    setFiles((prev) => {
      const current = prev[slotId] ?? [];
      const removed = current.find((f) => f.uid === uid);
      if (removed) URL.revokeObjectURL(removed.url);
      // Fire-and-forget delete from storage if it was uploaded
      if (removed?.storagePath) {
        supabase.storage.from(BUCKET).remove([removed.storagePath]);
      }
      const remaining = current.filter((f) => f.uid !== uid);
      const next = { ...prev };
      if (remaining.length === 0) delete next[slotId];
      else next[slotId] = remaining;
      return next;
    });
  }, []);

  // ── AI detection states ────────────────────────────────────────────────
  const [skinToneDetecting, setSkinToneDetecting] = useState(false);
  const [clothingSizeDetecting, setClothingSizeDetecting] = useState(false);
  const [pantSizeDetecting, setPantSizeDetecting] = useState(false);
  const [outfitDetecting, setOutfitDetecting] = useState(false);
  const [customVibes, setCustomVibes] = useState<CustomVibe[]>([]);

  // ── Manual tab state ──────────────────────────────────────────────────────
  const [skinTone, setSkinTone] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [pantSize, setPantSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedTextures, setSelectedTextures] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedCelebs, setSelectedCelebs] = useState<Set<string>>(new Set());
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set());

  function toggle(
    set: Set<string>,
    setFn: (s: Set<string>) => void,
    val: string,
  ) {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setFn(next);
  }

  // ── Save & continue ───────────────────────────────────────────────────────
  async function handleSave() {
    if (activeTab === "ai") {
      setProcessingNext(true);

      const toastId = toast.loading("Uploading photos…", {
        duration: Infinity,
      });

      // ── Step 1: wait for all in-flight uploads ────────────────────────────
      if (pendingUploads.current.size > 0) {
        await Promise.allSettled([...pendingUploads.current]);
      }

      // ── Step 2: analyze selfie (skin tone) & full body (sizes) in parallel
      const selfieUrls = (files["selfie"] ?? [])
        .filter((f) => f.publicUrl)
        .map((f) => f.publicUrl!);

      const fullBodyUrls = (files["full-body"] ?? [])
        .filter((f) => f.publicUrl)
        .map((f) => f.publicUrl!);

      const analyses: Promise<void>[] = [];

      if (selfieUrls.length > 0) {
        toast.loading("Analysing your photos…", { id: toastId });
        setSkinToneDetecting(true);

        analyses.push(
          fetch("/api/analyze-skin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrls: selfieUrls }),
          })
            .then((res) => res.json())
            .then(({ skinTone: detected }) => {
              if (detected) setSkinTone(detected);
            })
            .catch(() => {})
            .finally(() => setSkinToneDetecting(false)),
        );
      }

      if (fullBodyUrls.length > 0) {
        if (selfieUrls.length === 0) {
          toast.loading("Analysing your photos…", { id: toastId });
        }
        setClothingSizeDetecting(true);
        setPantSizeDetecting(true);

        analyses.push(
          fetch("/api/analyze-size", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrls: fullBodyUrls }),
          })
            .then((res) => res.json())
            .then(
              ({ clothingSize: detectedClothing, pantSize: detectedPant }) => {
                if (detectedClothing) setClothingSize(detectedClothing);
                if (detectedPant) setPantSize(detectedPant);
              },
            )
            .catch(() => {})
            .finally(() => {
              setClothingSizeDetecting(false);
              setPantSizeDetecting(false);
            }),
        );
      }

      // ── Step 3: analyze outfit photos for style, colors, textures ────────
      const outfitUrls = (files["outfit"] ?? [])
        .filter((f) => f.publicUrl)
        .map((f) => f.publicUrl!);

      if (outfitUrls.length > 0) {
        if (selfieUrls.length === 0 && fullBodyUrls.length === 0) {
          toast.loading("Analysing your photos…", { id: toastId });
        }
        setOutfitDetecting(true);

        analyses.push(
          fetch("/api/analyze-outfit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrls: outfitUrls }),
          })
            .then((res) => res.json())
            .then(
              ({
                vibes,
                customVibes: detectedCustomVibes,
                colors,
                textures,
              }) => {
                // Select detected known vibes
                if (vibes?.length) {
                  setSelectedVibes((prev) => {
                    const next = new Set(prev);
                    for (const v of vibes) next.add(v);
                    return next;
                  });
                }
                // Add custom vibes (not in predefined list) and select them
                if (detectedCustomVibes?.length) {
                  const newCustom: CustomVibe[] = detectedCustomVibes.map(
                    (v: string) => ({
                      id: v,
                      label: v
                        .split(" ")
                        .map(
                          (w: string) => w.charAt(0).toUpperCase() + w.slice(1),
                        )
                        .join(" "),
                      emoji: "✨",
                    }),
                  );
                  setCustomVibes((prev) => {
                    const existingIds = new Set(prev.map((c) => c.id));
                    return [
                      ...prev,
                      ...newCustom.filter(
                        (c: CustomVibe) => !existingIds.has(c.id),
                      ),
                    ];
                  });
                  setSelectedVibes((prev) => {
                    const next = new Set(prev);
                    for (const v of detectedCustomVibes) next.add(v);
                    return next;
                  });
                }
                // Select detected colors
                if (colors?.length) {
                  setSelectedColors((prev) => {
                    const next = new Set(prev);
                    for (const c of colors) next.add(c);
                    return next;
                  });
                }
                // Select detected textures
                if (textures?.length) {
                  setSelectedTextures((prev) => {
                    const next = new Set(prev);
                    for (const t of textures) next.add(t);
                    return next;
                  });
                }
              },
            )
            .catch(() => {})
            .finally(() => setOutfitDetecting(false)),
        );
      }

      await Promise.allSettled(analyses);

      toast.success("Photos ready", {
        id: toastId,
        description: "Now fill in your remaining preferences.",
        duration: 3000,
      });

      setProcessingNext(false);
      setActiveTab("manual");
      return;
    }

    // Tab 2 → wait for any pending uploads, save everything, navigate
    if (pendingUploads.current.size > 0) {
      await Promise.allSettled([...pendingUploads.current]);
    }

    // Collect successfully uploaded public URLs
    const photos: Partial<Record<PhotoType, string[]>> = {};
    for (const [k, arr] of Object.entries(files)) {
      const urls = arr.filter((f) => f.publicUrl).map((f) => f.publicUrl!);
      if (urls.length) photos[k as PhotoType] = urls;
    }

    savePreferences({
      photos,
      skinTone,
      clothingSize,
      pantSize,
      shoeSize,
      favoriteColors: [...selectedColors],
      textures: [...selectedTextures],
      brands: [...selectedBrands],
      styleVibes: [...selectedVibes],
      patternsToAvoid: [...selectedTextures],
      celebrities: [...selectedCelebs],
    });
    markCompleted(activeTab);

    router.push("/phia");
  }

  const manualState: ManualState = {
    skinTone,
    skinToneDetecting,
    clothingSize,
    clothingSizeDetecting,
    pantSize,
    pantSizeDetecting,
    shoeSize,
    selectedColors,
    selectedTextures,
    selectedBrands,
    selectedVibes,
    selectedCelebs,
    customVibes,
    outfitDetecting,
  };
  const manualSetters: ManualSetters = {
    setSkinTone,
    setClothingSize,
    setPantSize,
    setShoeSize,
    toggleColor: (v) => toggle(selectedColors, setSelectedColors, v),
    toggleTexture: (v) => toggle(selectedTextures, setSelectedTextures, v),
    toggleBrand: (v) => toggle(selectedBrands, setSelectedBrands, v),
    toggleVibe: (v) => toggle(selectedVibes, setSelectedVibes, v),
    toggleCeleb: (v) => toggle(selectedCelebs, setSelectedCelebs, v),
  };

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] overflow-hidden">
      <img
        src="/Rectangle1.svg"
        alt=""
        className="pointer-events-none fixed top-28 right-[22%] h-12 z-0"
      />
      <img
        src="/Rectangle.svg"
        alt=""
        className="pointer-events-none fixed bottom-30 left-[22%] h-12 z-0"
      />
      <img
        src="/yoga.svg"
        alt=""
        className="pointer-events-none fixed top-[40%] left-[15%] h-14 z-0"
      />
      <img
        src="/k_pop_guru.svg"
        alt=""
        className="pointer-events-none fixed bottom-[35%] right-[15%] h-14 z-0"
      />

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8DDD0] bg-[#FAF7F2]/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Image src="/phia.svg" alt="Phia" width={28} height={28} />
          <span className="text-base font-semibold text-[#3A2D22] tracking-tight">
            phia
          </span>
        </div>
        <Link
          href="/phia"
          className="text-xs text-[#9C8B7A] hover:text-[#5A4A3A] transition-colors"
        >
          Skip for now →
        </Link>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-10">
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold text-[#2A1F15] tracking-tight">
            Set up your style profile
          </h1>
          <p className="text-sm text-[#7A6A5A] leading-relaxed">
            Help Phia understand you — upload photos or fill in your preferences
            manually. You can always update this later.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-8 flex rounded-2xl border border-[#E3D5C5] bg-[#F0E8DA] p-1">
          {(["ai", "manual"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200
                ${activeTab === tab ? "bg-white text-[#3A2D22] shadow-sm" : "text-[#9C8B7A] hover:text-[#5A4A3A]"}`}
            >
              {tab === "ai" ? (
                <>
                  <RiSparklingLine className="size-4" /> Upload Photos
                </>
              ) : (
                <>
                  <RiBodyScanLine className="size-4" /> Preferences
                </>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-3xl border border-[#E8DDD0] bg-white p-6 shadow-sm mb-10">
          {activeTab === "ai" ? (
            <AIUploadTab
              files={files}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ) : (
            <ManualSetupTab state={manualState} setters={manualSetters} />
          )}
        </div>
      </div>

      {/* Voice agent — tap to unlock audio */}
      {!audioUnlocked && (
        <button
          type="button"
          onClick={unlockAudio}
          className="fixed bottom-24 right-6 z-20 flex items-center gap-2 rounded-full bg-[#3A2D22] px-4 py-2.5 shadow-lg animate-pulse cursor-pointer"
        >
          <span className="text-xs font-medium text-[#F5EFE6]">
            🔊 Tap to hear Phia
          </span>
        </button>
      )}
      {agentSpeaking && audioUnlocked && (
        <div className="fixed bottom-24 right-6 z-20">
          <div className="flex items-center gap-2 rounded-full bg-[#3A2D22] px-4 py-2 shadow-lg">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-[#F5EFE6]">
              Phia is speaking…
            </span>
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-10 border-t border-[#E8DDD0] bg-[#FAF7F2]/90 backdrop-blur-md px-6 py-3">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={processingNext}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3A2D22] px-6 py-3.5 text-[15px] font-semibold text-[#F5EFE6] hover:bg-[#2A1F15] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {processingNext ? (
              <>
                <svg
                  className="size-4 animate-spin"
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
                Processing…
              </>
            ) : activeTab === "ai" ? (
              <>
                Next <RiArrowRightLine className="size-4" />
              </>
            ) : (
              <>
                Save & Continue <RiArrowRightLine className="size-4" />
              </>
            )}
          </button>
          <p className="text-xs text-[#9C8B7A] text-center">
            Your data is private and only used to personalise your experience.
          </p>
        </div>
      </div>
    </div>
  );
}
