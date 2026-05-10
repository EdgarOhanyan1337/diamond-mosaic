import type { ProcessResult } from "../workers/imageProcessor.worker";
import { rgbToHex } from "../utils/colors";

const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+={}[];:<>?/";

export function renderMosaic(
  canvas: HTMLCanvasElement,
  result: ProcessResult,
  showSymbols: boolean,
  cellSize = 20
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height, palette, colorIndices } = result;

  // Set canvas physical size
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background colors
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = colorIndices[y * width + x];
      const color = palette[idx];
      
      ctx.fillStyle = rgbToHex(color);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Draw Grid Lines
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x++) {
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, height * cellSize);
  }
  for (let y = 0; y <= height; y++) {
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(width * cellSize, y * cellSize);
  }
  ctx.stroke();

  // Draw Symbols
  if (showSymbols) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.max(10, cellSize * 0.5)}px Inter, sans-serif`;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = colorIndices[y * width + x];
        const color = palette[idx];
        
        // Calculate perceived lightness to determine text color
        const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
        ctx.fillStyle = luminance > 0.5 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
        
        const symbol = SYMBOLS[idx % SYMBOLS.length];
        
        ctx.fillText(
          symbol,
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2
        );
      }
    }
  }
}

export function generateLegendData(result: ProcessResult) {
  const { palette, colorIndices } = result;
  
  const counts = new Array(palette.length).fill(0);
  for (let i = 0; i < colorIndices.length; i++) {
    counts[colorIndices[i]]++;
  }

  return palette.map((color, index) => ({
    index,
    color,
    hex: rgbToHex(color),
    symbol: SYMBOLS[index % SYMBOLS.length],
    count: counts[index]
  })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
}
