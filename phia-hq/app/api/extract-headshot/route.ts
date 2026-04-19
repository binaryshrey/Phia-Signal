import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both single URL and array of URLs
    const imageUrl: string = body.imageUrl ?? body.imageUrls?.[0];

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Fetch the image and convert to base64
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

    // Use Gemini to detect face bounding box
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      `Detect the person's face in this image and return a bounding box for a headshot crop.

The crop should include:
- The full head from top of hair to just below the chin
- Some neck and upper shoulders for a natural headshot framing
- A bit of padding around the face for breathing room

Return ONLY a JSON object with these normalized coordinates (0 to 1 range relative to image dimensions):
{"x": <left>, "y": <top>, "width": <width>, "height": <height>}

Nothing else. Just the JSON.`,
    ]);

    const raw = response.response.text()?.trim() ?? "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse face bounds" }, { status: 422 });
    }

    const bounds = JSON.parse(jsonMatch[0]) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    // Validate bounds are in 0-1 range
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const crop = {
      x: clamp(bounds.x),
      y: clamp(bounds.y),
      width: clamp(bounds.width),
      height: clamp(bounds.height),
    };

    // Ensure crop doesn't exceed image bounds
    if (crop.x + crop.width > 1) crop.width = 1 - crop.x;
    if (crop.y + crop.height > 1) crop.height = 1 - crop.y;

    return NextResponse.json({
      crop,
      imageBase64: `data:${mimeType};base64,${base64Image}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
