"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const TOP_OVERLAY_SPACE = 0;
const IMG_PADDING_TOP = 60;
const IMG_PADDING_SIDE = 16;
const IMG_PADDING_BOTTOM = 10;
const MESH_NODE_INDICES = [
  10, 338, 297, 332, 284, 263, 362, 1, 33, 133, 55, 70, 67, 234, 454, 61, 291,
  152, 103, 17,
];

const MESH_EDGES = [
  [10, 338],
  [338, 297],
  [297, 332],
  [332, 284],
  [284, 263],
  [263, 362],
  [362, 1],
  [1, 133],
  [133, 33],
  [33, 55],
  [55, 70],
  [70, 67],
  [67, 10],
  [332, 133],
  [284, 1],
  [55, 133],
  [33, 1],
  [263, 1],
  [33, 61],
  [1, 61],
  [1, 291],
  [61, 152],
  [291, 152],
  [61, 17],
  [291, 17],
  [17, 152],
  [70, 103],
  [103, 67],
  [234, 61],
  [454, 291],
  [234, 33],
  [454, 263],
  [234, 152],
  [454, 152],
];

const CHEEK_NODE_INDICES = [
  93, 132, 58, 172, 136, 150, 323, 361, 288, 397, 365, 379,
];

const CHEEK_EDGES = [
  // Left cheek scaffold
  [33, 93],
  [93, 132],
  [132, 58],
  [58, 172],
  [172, 150],
  [150, 136],
  [136, 234],
  [234, 33],
  [93, 133],
  [132, 1],
  [58, 61],
  [172, 17],
  [150, 152],
  [136, 61],
  [234, 133],
  [132, 61],
  [58, 17],

  // Right cheek scaffold
  [263, 323],
  [323, 361],
  [361, 288],
  [288, 397],
  [397, 379],
  [379, 365],
  [365, 454],
  [454, 263],
  [323, 362],
  [361, 1],
  [288, 291],
  [397, 17],
  [379, 152],
  [365, 291],
  [454, 362],
  [361, 291],
  [288, 17],
];

const ALL_MESH_NODE_INDICES = [
  ...new Set([...MESH_NODE_INDICES, ...CHEEK_NODE_INDICES]),
];
const ALL_MESH_EDGES = [...MESH_EDGES, ...CHEEK_EDGES];

const HAIR_ROW_POINT_COUNT = 9;
const HAIR_MESH_ROWS = [
  { lift: 0.0, spread: 1.04, arch: 0.02, sideDrop: 0.2 },
  { lift: 0.09, spread: 1.1, arch: 0.05, sideDrop: 0.18 },
  { lift: 0.18, spread: 1.16, arch: 0.08, sideDrop: 0.14 },
  { lift: 0.28, spread: 1.22, arch: 0.11, sideDrop: 0.1 },
  { lift: 0.36, spread: 1.18, arch: 0.13, sideDrop: 0.08 },
];

function createHairMeshPoints(
  minX,
  maxX,
  minY,
  faceWidth,
  faceHeight,
  imageTopY,
  imageBottomY,
) {
  const hairRows = HAIR_MESH_ROWS.map((row) => {
    const expandedHalfWidth = (faceWidth * row.spread) / 2;
    const centerX = (minX + maxX) / 2;
    const leftX = centerX - expandedHalfWidth;
    const rightX = centerX + expandedHalfWidth;
    const points = [];
    const baseY = minY - faceHeight * row.lift;

    for (let i = 0; i < HAIR_ROW_POINT_COUNT; i += 1) {
      const t = i / (HAIR_ROW_POINT_COUNT - 1);
      const edgeWeight = Math.abs(t - 0.5) / 0.5;
      const archLift = (1 - edgeWeight) * row.arch * faceHeight;
      const sideDrop = edgeWeight * row.sideDrop * faceHeight;
      points.push({
        x: leftX + (rightX - leftX) * t,
        y: clamp(baseY - archLift + sideDrop, imageTopY + 8, imageBottomY - 8),
      });
    }

    return points;
  });

  return hairRows;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toHexChannel(channel) {
  return clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(r, g, b) {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function sampleSkinHex(
  ctx,
  centerX,
  centerY,
  radius,
  canvasWidth,
  canvasHeight,
) {
  const r = Math.max(2, Math.round(radius));
  const left = clamp(Math.round(centerX - r), 0, canvasWidth - 1);
  const top = clamp(Math.round(centerY - r), 0, canvasHeight - 1);
  const right = clamp(Math.round(centerX + r), 0, canvasWidth - 1);
  const bottom = clamp(Math.round(centerY + r), 0, canvasHeight - 1);

  const width = Math.max(1, right - left + 1);
  const height = Math.max(1, bottom - top + 1);

  let data;
  try {
    data = ctx.getImageData(left, top, width, height).data;
  } catch {
    return null;
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 16) {
      continue;
    }
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return rgbToHex(totalR / count, totalG / count, totalB / count);
}

function sampleLandmarkClusterHex(
  ctx,
  landmarks,
  indices,
  radius,
  width,
  height,
  yOffset,
  xOffset = 0,
) {
  const samples = [];

  for (const index of indices) {
    const point = landmarks[index];
    if (!point) {
      continue;
    }

    const hex = sampleSkinHex(
      ctx,
      point.x * width + xOffset,
      point.y * height + yOffset,
      radius,
      width + xOffset * 2,
      height + yOffset,
    );
    if (!hex) {
      continue;
    }

    const rgb = hexToRgb(hex);
    if (rgb) {
      samples.push(rgb);
    }
  }

  if (samples.length === 0) {
    return null;
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  for (const sample of samples) {
    totalR += sample.r;
    totalG += sample.g;
    totalB += sample.b;
  }

  return rgbToHex(
    totalR / samples.length,
    totalG / samples.length,
    totalB / samples.length,
  );
}

function samplePointClusterHex(ctx, points, radius, canvasWidth, canvasHeight) {
  const samples = [];

  for (const point of points) {
    if (!point) {
      continue;
    }

    const hex = sampleSkinHex(
      ctx,
      point.x,
      point.y,
      radius,
      canvasWidth,
      canvasHeight,
    );
    if (!hex) {
      continue;
    }

    const rgb = hexToRgb(hex);
    if (rgb) {
      samples.push(rgb);
    }
  }

  if (samples.length === 0) {
    return null;
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  for (const sample of samples) {
    totalR += sample.r;
    totalG += sample.g;
    totalB += sample.b;
  }

  return rgbToHex(
    totalR / samples.length,
    totalG / samples.length,
    totalB / samples.length,
  );
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Hex → nearest color name ────────────────────────────────────────────────

const COLOR_NAMES = [
  { name: "Black",      r: 0,   g: 0,   b: 0   },
  { name: "White",      r: 255, g: 255, b: 255 },
  { name: "Ivory",      r: 255, g: 255, b: 240 },
  { name: "Beige",      r: 245, g: 222, b: 179 },
  { name: "Cream",      r: 255, g: 253, b: 208 },
  { name: "Peach",      r: 255, g: 218, b: 185 },
  { name: "Apricot",    r: 251, g: 206, b: 177 },
  { name: "Sand",       r: 194, g: 178, b: 128 },
  { name: "Tan",        r: 210, g: 180, b: 140 },
  { name: "Caramel",    r: 255, g: 213, b: 153 },
  { name: "Honey",      r: 235, g: 177, b: 89  },
  { name: "Bronze",     r: 205, g: 127, b: 50  },
  { name: "Copper",     r: 184, g: 115, b: 51  },
  { name: "Amber",      r: 255, g: 191, b: 0   },
  { name: "Chestnut",   r: 149, g: 69,  b: 53  },
  { name: "Chocolate",  r: 123, g: 63,  b: 0   },
  { name: "Espresso",   r: 78,  g: 42,  b: 20  },
  { name: "Mahogany",   r: 192, g: 64,  b: 0   },
  { name: "Auburn",     r: 165, g: 42,  b: 42  },
  { name: "Burgundy",   r: 128, g: 0,   b: 32  },
  { name: "Rose",       r: 255, g: 0,   b: 127 },
  { name: "Blush",      r: 222, g: 93,  b: 131 },
  { name: "Mauve",      r: 224, g: 176, b: 255 },
  { name: "Pink",       r: 255, g: 192, b: 203 },
  { name: "Coral",      r: 255, g: 127, b: 80  },
  { name: "Salmon",     r: 250, g: 128, b: 114 },
  { name: "Nude",       r: 235, g: 200, b: 178 },
  { name: "Toffee",     r: 175, g: 111, b: 63  },
  { name: "Walnut",     r: 120, g: 80,  b: 50  },
  { name: "Mocha",      r: 150, g: 100, b: 64  },
  { name: "Cocoa",      r: 112, g: 65,  b: 46  },
  { name: "Sienna",     r: 160, g: 82,  b: 45  },
  { name: "Umber",      r: 99,  g: 81,  b: 71  },
  { name: "Ash",        r: 178, g: 190, b: 181 },
  { name: "Slate",      r: 112, g: 128, b: 144 },
  { name: "Charcoal",   r: 54,  g: 69,  b: 79  },
  { name: "Jet Black",  r: 13,  g: 13,  b: 13  },
  { name: "Golden",     r: 255, g: 215, b: 0   },
  { name: "Strawberry", r: 195, g: 68,  b: 68  },
  { name: "Taupe",      r: 72,  g: 60,  b: 50  },
  { name: "Olive",      r: 128, g: 128, b: 0   },
];

function hexToColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  let closest = COLOR_NAMES[0];
  let minDist = Infinity;
  for (const c of COLOR_NAMES) {
    const d = (rgb.r - c.r) ** 2 + (rgb.g - c.g) ** 2 + (rgb.b - c.b) ** 2;
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest.name;
}

// ─── Label arrow drawing ─────────────────────────────────────────────────────

function drawForeheadHexArrow(
  ctx,
  anchorX,
  anchorY,
  faceWidth,
  faceHeight,
  imageTopY,
  canvasWidth,
  canvasHeight,
  hex,
  directionX = 1,
  verticalLift = 0.45,
  labelRow = -1,
  forceSide = "auto",
  tag = "",
) {
  const minMargin = 10;
  const tipX = clamp(
    anchorX + faceWidth * 0.34 * directionX,
    minMargin,
    canvasWidth - minMargin,
  );
  const tipY = clamp(
    anchorY - faceHeight * verticalLift,
    minMargin,
    canvasHeight - minMargin,
  );

  // ── Arrow line ──
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 2;

  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Anchor dot
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 2.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Label — single row: [swatch] TAG · Color Name ──
  const colorName = hexToColorName(hex);
  const fontSize = Math.max(13, Math.round(Math.min(faceWidth, faceHeight) * 0.07));

  // Measure combined text: "SKIN · Peach"
  const tagText = tag ? tag.toUpperCase() : "";
  const separator = tag ? " · " : "";
  const hexPart = ` (${hex.toUpperCase()})`;
  const fullText = tagText + separator + colorName + hexPart;

  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system`;
  const fullTextWidth = ctx.measureText(fullText).width;
  // We also need the tag portion width to draw it in a different color
  const tagPartWidth = tag ? ctx.measureText(tagText + separator).width : 0;

  const swatchSize = fontSize * 0.75;
  const padX = 10;
  const padY = 7;
  const gap = 6;

  const labelWidth = padX * 2 + swatchSize + gap + fullTextWidth;
  const labelHeight = padY * 2 + fontSize;

  const preferredSide =
    forceSide === "auto" ? (directionX >= 0 ? "right" : "left") : forceSide;
  const proposedLabelX =
    preferredSide === "left" ? tipX - labelWidth - 8 : tipX + 8;
  const labelX = clamp(
    proposedLabelX,
    minMargin,
    canvasWidth - labelWidth - minMargin,
  );
  const rowLabelY = minMargin + labelRow * (labelHeight + 5);
  const labelY = clamp(
    labelRow >= 0 ? rowLabelY : tipY - labelHeight / 2,
    minMargin,
    canvasHeight - labelHeight - minMargin,
  );

  // Background pill
  drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 6);
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Color swatch
  const swatchX = labelX + padX;
  const swatchY = labelY + (labelHeight - swatchSize) / 2;
  drawRoundedRect(ctx, swatchX, swatchY, swatchSize, swatchSize, 3);
  ctx.fillStyle = hex;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  const textX = swatchX + swatchSize + gap;
  const textY = labelY + labelHeight / 2;

  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system`;
  ctx.textBaseline = "middle";

  // Draw tag portion in muted white
  if (tag) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(tagText + separator, textX, textY);
  }

  // Draw color name in bright white
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(colorName, textX + tagPartWidth, textY);

  // Draw hex code in muted white
  const nameWidth = ctx.measureText(colorName).width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText(hexPart, textX + tagPartWidth + nameWidth, textY);
}

// Singleton: lazily create a FaceLandmarker and reuse across renders
let _landmarkerPromise = null;

function getFaceLandmarker() {
  if (!_landmarkerPromise) {
    _landmarkerPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    ).then((vision) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      }),
    ).catch((err) => {
      // If GPU delegate fails, retry with CPU
      console.warn("GPU delegate failed, falling back to CPU:", err);
      _landmarkerPromise = null;
      return FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      ).then((vision) =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        }),
      );
    });
  }
  return _landmarkerPromise;
}

export default function FaceGrid({ imageSrc }) {
  const canvasRef = useRef(null);
  const loadedImgRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const drawScene = (results) => {
      const canvas = canvasRef.current;
      const img = loadedImgRef.current;
      if (!canvas || !img) return;

      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;

      // Canvas = image + padding on all sides for labels
      const canvasW = imgW + IMG_PADDING_SIDE * 2;
      const canvasH = imgH + IMG_PADDING_TOP + IMG_PADDING_BOTTOM;

      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark background behind padding area
      ctx.fillStyle = "rgba(14, 13, 18, 1)";
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Draw image offset by padding
      ctx.drawImage(img, IMG_PADDING_SIDE, IMG_PADDING_TOP, imgW, imgH);

      if (results?.multiFaceLandmarks?.length) {
        const landmarks = results.multiFaceLandmarks[0];
        drawFaceGuides(ctx, landmarks, imgW, imgH, IMG_PADDING_TOP);
      }

      setLoading(false);
    };

    const drawFaceGuides = (ctx, landmarks, width, height, yOffset) => {
      const xOff = IMG_PADDING_SIDE;
      const xs = landmarks.map((p) => p.x * width + xOff);
      const ys = landmarks.map((p) => p.y * height + yOffset);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const faceWidth = maxX - minX;
      const faceHeight = maxY - minY;
      const hairRows = createHairMeshPoints(
        minX,
        maxX,
        minY,
        faceWidth,
        faceHeight,
        0,
        yOffset + height,
      );
      const leftTemple = landmarks[234];
      const rightTemple = landmarks[454];
      const foreheadCenter = landmarks[10] ?? landmarks[151] ?? landmarks[9];

      // ---- Sparse 20-node Connected Mesh ----
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [fromIndex, toIndex] of ALL_MESH_EDGES) {
        const from = landmarks[fromIndex];
        const to = landmarks[toIndex];

        if (!from || !to) {
          continue;
        }

        ctx.moveTo(from.x * width + xOff, from.y * height + yOffset);
        ctx.lineTo(to.x * width + xOff, to.y * height + yOffset);
      }

      for (const row of hairRows) {
        for (let i = 0; i < row.length - 1; i += 1) {
          ctx.moveTo(row[i].x, row[i].y);
          ctx.lineTo(row[i + 1].x, row[i + 1].y);
        }
      }

      for (let rowIndex = 0; rowIndex < hairRows.length - 1; rowIndex += 1) {
        const currentRow = hairRows[rowIndex];
        const nextRow = hairRows[rowIndex + 1];
        for (let i = 0; i < currentRow.length; i += 1) {
          ctx.moveTo(currentRow[i].x, currentRow[i].y);
          ctx.lineTo(nextRow[i].x, nextRow[i].y);

          if (i < currentRow.length - 1) {
            ctx.moveTo(currentRow[i].x, currentRow[i].y);
            ctx.lineTo(nextRow[i + 1].x, nextRow[i + 1].y);
          }

          if (i > 0) {
            ctx.moveTo(currentRow[i].x, currentRow[i].y);
            ctx.lineTo(nextRow[i - 1].x, nextRow[i - 1].y);
          }
        }
      }

      const bottomHairRow = hairRows[0];
      if (bottomHairRow && leftTemple && rightTemple) {
        const leftTempleX = leftTemple.x * width + xOff;
        const leftTempleY = leftTemple.y * height + yOffset;
        const rightTempleX = rightTemple.x * width + xOff;
        const rightTempleY = rightTemple.y * height + yOffset;

        ctx.moveTo(leftTempleX, leftTempleY);
        ctx.lineTo(bottomHairRow[0].x, bottomHairRow[0].y);
        ctx.moveTo(rightTempleX, rightTempleY);
        ctx.lineTo(
          bottomHairRow[bottomHairRow.length - 1].x,
          bottomHairRow[bottomHairRow.length - 1].y,
        );
      }

      if (bottomHairRow) {
        const bridgePairs = [
          [234, 0],
          [127, 1],
          [67, 2],
          [10, 4],
          [297, 6],
          [356, 7],
          [454, 8],
        ];

        for (const [landmarkIndex, column] of bridgePairs) {
          const bridgePoint = landmarks[landmarkIndex];
          const hairPoint = bottomHairRow[column];
          if (!bridgePoint || !hairPoint) {
            continue;
          }

          ctx.moveTo(bridgePoint.x * width + xOff, bridgePoint.y * height + yOffset);
          ctx.lineTo(hairPoint.x, hairPoint.y);
        }
      }

      if (bottomHairRow && foreheadCenter) {
        const foreheadX = foreheadCenter.x * width + xOff;
        const foreheadY = foreheadCenter.y * height + yOffset;
        const centerHair = bottomHairRow[Math.floor(bottomHairRow.length / 2)];
        ctx.moveTo(foreheadX, foreheadY);
        ctx.lineTo(centerHair.x, centerHair.y);
      }
      ctx.stroke();

      // ---- Landmark Dots ----
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      for (const pointIndex of ALL_MESH_NODE_INDICES) {
        const point = landmarks[pointIndex];
        if (!point) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(point.x * width + xOff, point.y * height + yOffset, 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      for (const row of hairRows) {
        for (const point of row) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // ---- Full canvas dimensions for labels/sampling ----
      const cW = width + IMG_PADDING_SIDE * 2;
      const cH = height + yOffset + IMG_PADDING_BOTTOM;

      // ---- Corner Brackets Around Face ----
      const bracketPaddingX = faceWidth * 0.26;
      const bracketPaddingY = faceHeight * 0.24;
      const boxX = minX - bracketPaddingX;
      const boxY = minY - bracketPaddingY;
      const boxW = faceWidth + bracketPaddingX * 2;
      const boxH = faceHeight + bracketPaddingY * 2;
      drawCornerBrackets(ctx, boxX, boxY, boxW, boxH);

      const foreheadAnchor = landmarks[10] ?? landmarks[151] ?? landmarks[9];
      const foreheadSample = landmarks[151] ?? landmarks[9] ?? landmarks[10];
      const fallbackAnchorX = minX + faceWidth * 0.5;
      const fallbackAnchorY = minY + faceHeight * 0.18;
      const anchorX = foreheadAnchor
        ? foreheadAnchor.x * width + xOff
        : fallbackAnchorX;
      const anchorY = foreheadAnchor
        ? foreheadAnchor.y * height + yOffset
        : fallbackAnchorY;

      const centerColumn = Math.floor(HAIR_ROW_POINT_COUNT / 2);
      const hairAnchorPoint =
        hairRows[1]?.[centerColumn] ?? hairRows[0]?.[centerColumn] ?? null;
      const hairAnchorX = hairAnchorPoint ? hairAnchorPoint.x : anchorX;
      const hairAnchorY = hairAnchorPoint
        ? hairAnchorPoint.y
        : anchorY - faceHeight * 0.2;
      const hairSamplePoints = [];
      const sampleRows = [1, 2, 3];
      const sampleOffsets = [-2, 0, 2];

      for (const rowIndex of sampleRows) {
        const row = hairRows[rowIndex];
        if (!row) {
          continue;
        }

        for (const offset of sampleOffsets) {
          const point = row[centerColumn + offset];
          if (point) {
            hairSamplePoints.push(point);
          }
        }
      }

      if (hairAnchorPoint) {
        hairSamplePoints.push(hairAnchorPoint);
      }

      const hairHex =
        samplePointClusterHex(
          ctx,
          hairSamplePoints,
          faceWidth * 0.022,
          cW,
          cH,
        ) ?? "#5F4A3F";

      const sampleX = foreheadSample ? foreheadSample.x * width + xOff : anchorX;
      const sampleY = foreheadSample
        ? foreheadSample.y * height + yOffset + faceHeight * 0.02
        : anchorY;
      const sampledHex = sampleSkinHex(
        ctx,
        sampleX,
        sampleY,
        faceWidth * 0.035,
        cW,
        cH,
      );
      const skinHex = sampledHex ?? "#C79A7B";

      const lipAnchor = landmarks[13] ?? landmarks[14] ?? landmarks[0];
      const lipAnchorX = lipAnchor ? lipAnchor.x * width + xOff : anchorX;
      const lipAnchorY = lipAnchor
        ? lipAnchor.y * height + yOffset
        : anchorY + faceHeight * 0.28;
      const lipHex =
        sampleLandmarkClusterHex(
          ctx,
          landmarks,
          [13, 14, 0, 17, 61, 291],
          faceWidth * 0.022,
          width,
          height,
          yOffset,
          xOff,
        ) ?? "#B76D74";

      drawForeheadHexArrow(
        ctx,
        anchorX,
        anchorY,
        faceWidth,
        faceHeight,
        0,
        cW,
        cH,
        skinHex,
        1,
        0.45,
        0,
        "right",
        "Skin",
      );

      drawForeheadHexArrow(
        ctx,
        lipAnchorX,
        lipAnchorY,
        faceWidth,
        faceHeight,
        0,
        cW,
        cH,
        lipHex,
        -1,
        0.72,
        1,
        "left",
        "Lips",
      );

      drawForeheadHexArrow(
        ctx,
        hairAnchorX,
        hairAnchorY,
        faceWidth,
        faceHeight,
        0,
        cW,
        cH,
        hairHex,
        1,
        0.34,
        2,
        "right",
        "Hair",
      );
    };

    const drawCornerBrackets = (ctx, x, y, width, height) => {
      const len = Math.max(18, Math.min(width, height) * 0.12);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();

      // top-left
      ctx.moveTo(x, y + len);
      ctx.lineTo(x, y);
      ctx.lineTo(x + len, y);

      // top-right
      ctx.moveTo(x + width - len, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + len);

      // bottom-left
      ctx.moveTo(x, y + height - len);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + len, y + height);

      // bottom-right
      ctx.moveTo(x + width - len, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - len);

      ctx.stroke();
    };

    const setupFaceMesh = async () => {
      // Load image entirely in JS
      const img = new window.Image();
      // Only set crossOrigin for http(s) URLs — blob/data URLs don't need it
      if (imageSrc?.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (isCancelled) return;
      loadedImgRef.current = img;

      const landmarker = await getFaceLandmarker();
      if (isCancelled) return;

      // FaceLandmarker.detect() accepts an HTMLImageElement directly
      const result = landmarker.detect(img);

      if (result?.faceLandmarks?.length) {
        // Convert FaceLandmarker landmarks to the format drawScene expects:
        // { multiFaceLandmarks: [ [ { x, y, z }, ... ] ] }
        const landmarks = result.faceLandmarks[0];
        drawScene({ multiFaceLandmarks: [landmarks] });
      } else {
        // No face found — just show the image
        drawScene({ multiFaceLandmarks: [] });
      }
    };

    setupFaceMesh().catch(() => setLoading(false));

    return () => {
      isCancelled = true;
    };
  }, [imageSrc]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
          Detecting face...
        </div>
      )}

      {/* Canvas displaying the result */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}
