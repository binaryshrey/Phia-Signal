import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_TONES = ["fair", "light", "medium", "tan", "deep", "rich"] as const;
type SkinTone = (typeof VALID_TONES)[number];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageUrls }: { imageUrls: string[] } = await req.json();

    if (!imageUrls?.length) {
      return NextResponse.json({ error: "No image URLs provided" }, { status: 400 });
    }

    // Build image content blocks — Claude accepts up to 5 images per request
    const imageBlocks: Anthropic.ImageBlockParam[] = imageUrls.slice(0, 5).map((url) => ({
      type: "image",
      source: { type: "url", url },
    }));

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Analyze the skin tone of the person in ${imageBlocks.length > 1 ? "these photos" : "this photo"}.

Choose exactly one of these six categories that best matches their natural skin tone:

- fair    → very light skin, pink/rosy undertones
- light   → light skin, neutral or slightly warm undertones
- medium  → medium skin, olive or warm undertones
- tan     → golden brown, tanned skin
- deep    → deep brown skin
- rich    → very deep, dark brown or ebony skin

Reply with ONLY the single lowercase word. Nothing else.`,
            },
          ],
        },
      ],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim().toLowerCase();
    const skinTone: SkinTone | undefined = VALID_TONES.find((t) => raw.includes(t));

    if (!skinTone) {
      return NextResponse.json({ error: "Could not determine skin tone" }, { status: 422 });
    }

    return NextResponse.json({ skinTone });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
