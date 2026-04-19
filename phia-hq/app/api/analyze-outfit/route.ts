import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const KNOWN_VIBES = [
  "minimal", "classic", "casual", "streetwear", "bohemian",
  "preppy", "edgy", "romantic", "athleisure", "business",
];

const KNOWN_COLORS = [
  "black", "white", "cream", "beige", "brown", "navy", "camel",
  "olive", "burgundy", "blush", "slate", "sage", "rust", "cobalt",
  "emerald", "gold",
];

const KNOWN_TEXTURES = [
  "cotton", "linen", "silk", "satin", "denim", "leather", "suede",
  "velvet", "knit", "tweed", "chiffon", "jersey", "wool", "cashmere",
  "corduroy",
];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageUrls }: { imageUrls: string[] } = await req.json();

    if (!imageUrls?.length) {
      return NextResponse.json({ error: "No image URLs provided" }, { status: 400 });
    }

    const imageBlocks: Anthropic.ImageBlockParam[] = imageUrls.slice(0, 5).map((url) => ({
      type: "image",
      source: { type: "url", url },
    }));

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Analyze the outfit(s) in ${imageBlocks.length > 1 ? "these photos" : "this photo"} and determine the style, colors, and fabrics/textures.

1. STYLE VIBES — identify all style vibes that apply. Use these known labels when they match: ${KNOWN_VIBES.join(", ")}. If the outfit has a distinct style not covered by those (e.g. "business casual", "floral", "boho chic", "dark academia", "coastal", "cottagecore", "y2k", "grunge", "retro"), add it as a new custom label. Use lowercase. Return multiple if applicable.

2. COLORS — identify the dominant and accent colors in the outfit. Use these known labels when they match: ${KNOWN_COLORS.join(", ")}. Only return colors that are clearly visible.

3. TEXTURES/FABRICS — identify the visible fabrics and textures. Use these known labels when they match: ${KNOWN_TEXTURES.join(", ")}. Only return what you can reasonably identify.

Reply in EXACTLY this format (one section per line, comma-separated values):
VIBES: value1, value2
COLORS: value1, value2
TEXTURES: value1, value2

Nothing else.`,
            },
          ],
        },
      ],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

    const parse = (prefix: string): string[] => {
      const line = lines.find((l) => l.toUpperCase().startsWith(prefix.toUpperCase()));
      if (!line) return [];
      const after = line.slice(line.indexOf(":") + 1);
      return after
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    };

    const vibes = parse("VIBES");
    const colors = parse("COLORS");
    const textures = parse("TEXTURES");

    // Separate known vs custom vibes
    const knownVibes = vibes.filter((v) => KNOWN_VIBES.includes(v));
    const customVibes = vibes.filter((v) => !KNOWN_VIBES.includes(v));

    // Match colors to known palette IDs
    const matchedColors = colors.filter((c) => KNOWN_COLORS.includes(c));

    // Match textures — capitalize to match the UI constants
    const matchedTextures = textures
      .map((t) => KNOWN_TEXTURES.find((kt) => kt === t))
      .filter((t): t is string => !!t)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));

    return NextResponse.json({
      vibes: knownVibes,
      customVibes,
      colors: matchedColors,
      textures: matchedTextures,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
