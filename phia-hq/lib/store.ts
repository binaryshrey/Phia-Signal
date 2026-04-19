import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoType = "selfie" | "full-body" | "outfit" | "extra";

export type UserPreferences = {
  // AI photos (stored as data URL arrays for persistence)
  photos: Partial<Record<PhotoType, string[]>>;

  // Manual setup
  skinTone: string;
  clothingSize: string;
  pantSize: string;
  shoeSize: string;
  favoriteColors: string[];
  textures: string[];
  brands: string[];
  styleVibes: string[];

  // Meta
  completedAt: string | null;
  setupMode: "ai" | "manual" | null;
};

type ProfileStore = {
  preferences: UserPreferences;
  savePreferences: (prefs: Partial<UserPreferences>) => void;
  markCompleted: (mode: "ai" | "manual") => void;
  reset: () => void;
};

// ─── Default state ─────────────────────────────────────────────────────────────

const defaultPreferences: UserPreferences = {
  photos: {},
  skinTone: "",
  clothingSize: "",
  pantSize: "",
  shoeSize: "",
  favoriteColors: [],
  textures: [],
  brands: [],
  styleVibes: [],
  completedAt: null,
  setupMode: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,

      savePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      markCompleted: (mode) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            completedAt: new Date().toISOString(),
            setupMode: mode,
          },
        })),

      reset: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: "phia-profile",
    }
  )
);

// ─── Derived: learnings for analytics ────────────────────────────────────────
//
// Each "learning" maps to a brain node category. As the user adds more data
// (through usage, not just onboarding) this list will grow.

export type Learning = {
  category: string;
  label: string;
  value: string;
  confidence: number; // 0–1, used to tint the node
};

export function derivelearnings(prefs: UserPreferences): Learning[] {
  const learnings: Learning[] = [];

  if (prefs.skinTone) {
    learnings.push({
      category: "complexion",
      label: "Skin Tone",
      value: capitalize(prefs.skinTone),
      confidence: 1,
    });
  }

  if (prefs.clothingSize) {
    learnings.push({
      category: "sizing",
      label: "Clothing Size",
      value: prefs.clothingSize,
      confidence: 1,
    });
  }

  if (prefs.pantSize) {
    learnings.push({
      category: "sizing",
      label: "Pant Size",
      value: `${prefs.pantSize}" waist`,
      confidence: 1,
    });
  }

  if (prefs.shoeSize) {
    learnings.push({
      category: "sizing",
      label: "Shoe Size",
      value: `US ${prefs.shoeSize}`,
      confidence: 1,
    });
  }

  for (const vibe of prefs.styleVibes) {
    learnings.push({
      category: "style",
      label: "Style Vibe",
      value: capitalize(vibe),
      confidence: 1,
    });
  }

  for (const color of prefs.favoriteColors) {
    learnings.push({
      category: "color",
      label: "Favourite Color",
      value: capitalize(color),
      confidence: 1,
    });
  }

  for (const texture of prefs.textures) {
    learnings.push({
      category: "fabric",
      label: "Fabric",
      value: texture,
      confidence: 1,
    });
  }

  for (const brand of prefs.brands) {
    learnings.push({
      category: "brand",
      label: "Brand",
      value: brand,
      confidence: 1,
    });
  }

  // Photos contribute inferred learnings
  const photoCount = Object.values(prefs.photos).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
  const slotCount  = Object.keys(prefs.photos).length;
  if (photoCount > 0) {
    learnings.push({
      category: "visual",
      label: "Photos Analysed",
      value: `${photoCount} photo${photoCount > 1 ? "s" : ""} across ${slotCount} categor${slotCount > 1 ? "ies" : "y"}`,
      confidence: slotCount / 4,
    });
  }

  return learnings;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  complexion: "#E8A87C",
  sizing:     "#82B0D2",
  style:      "#C49BD3",
  color:      "#F5C842",
  fabric:     "#7DC88A",
  brand:      "#E87C7C",
  visual:     "#7CB8E8",
};

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#AAAAAA";
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
