"use client";

import { useProfileStore } from "@/lib/store";
import FaceGrid from "@/components/FaceGrid";

const FALLBACK_SELFIE =
  "https://enxbrupctxksokqfhbvp.supabase.co/storage/v1/object/public/phia/onboarding/selfie/1776541252613-vlblb7hf0fh.png";

export default function FaceMeshOverlay({ imageUrl = "/pic.jpg" }) {
  const preferences = useProfileStore((s) => s.preferences);

  // Use the first uploaded selfie, fall back to Supabase test image, then prop
  const src = preferences.photos?.selfie?.[0] ?? FALLBACK_SELFIE ?? imageUrl;

  return <FaceGrid imageSrc={src} />;
}
