import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const VALID_PANT_SIZES = ["26", "28", "30", "32", "34", "36", "38", "40"] as const;

type ClothingSize = (typeof VALID_CLOTHING_SIZES)[number];
type PantSize = (typeof VALID_PANT_SIZES)[number];

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
      max_tokens: 32,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Analyze the body proportions of the person in ${imageBlocks.length > 1 ? "these full-body photos" : "this full-body photo"}.

Estimate their most likely clothing size (top/dress) and pant waist size.

Clothing size options: XS, S, M, L, XL, XXL, XXXL
Pant waist size options (inches): 26, 28, 30, 32, 34, 36, 38, 40

Reply with ONLY two values separated by a comma: clothing_size,pant_size
For example: M,32

Nothing else.`,
            },
          ],
        },
      ],
    });

    const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
    const parts = raw.split(",").map((s) => s.trim());

    const clothingSize: ClothingSize | undefined = VALID_CLOTHING_SIZES.find(
      (s) => parts[0]?.toUpperCase() === s
    );
    const pantSize: PantSize | undefined = VALID_PANT_SIZES.find(
      (s) => parts[1] === s
    );

    if (!clothingSize && !pantSize) {
      return NextResponse.json({ error: "Could not determine sizes" }, { status: 422 });
    }

    return NextResponse.json({
      clothingSize: clothingSize ?? null,
      pantSize: pantSize ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
