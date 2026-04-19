import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Vertex AI client for VTO (retail model requires Vertex AI backend)
const vertexClient = new GoogleGenAI({
  vertexai: true,
  project: "phia-virtual-tryon",
  location: "us-east4",
});

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const {
      productImageUrl,
      userImageUrls,
    }: { productImageUrl: string; userImageUrls: string[] } = await req.json();

    if (!productImageUrl) {
      return NextResponse.json(
        { error: "Missing product image" },
        { status: 400 },
      );
    }
    if (!userImageUrls?.length) {
      return NextResponse.json(
        { error: "Missing user images" },
        { status: 400 },
      );
    }

    const [garmentBase64, personBase64] = await Promise.all([
      fetchImageAsBase64(productImageUrl),
      fetchImageAsBase64(userImageUrls[0]),
    ]);

    // ── 1. Virtual Try-On via Vertex AI recontextImage ──
    const vtoResult = await vertexClient.models.recontextImage({
      model: "virtual-try-on-001",
      source: {
        personImage: { imageBytes: personBase64, mimeType: "image/png" },
        productImages: [
          {
            productImage: { imageBytes: garmentBase64, mimeType: "image/png" },
          },
        ],
      },
      config: {
        numberOfImages: 1,
      },
    });

    const tryOnBase64: string | null =
      (vtoResult as any)?.generatedImages?.[0]?.image?.imageBytes ?? null;

    return NextResponse.json({
      tryOn: tryOnBase64 ? `data:image/png;base64,${tryOnBase64}` : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Virtual try-on error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
