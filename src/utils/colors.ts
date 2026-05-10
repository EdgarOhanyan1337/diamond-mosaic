export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function rgbToHex(rgb: RGB): string {
  return "#" + [rgb.r, rgb.g, rgb.b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");
}

export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Simple Euclidean distance for colors. 
// A more accurate CIEDE2000 could be used, but this is faster for K-Means.
export function colorDistance(c1: RGB, c2: RGB): number {
  const rMean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt(
    (((512 + rMean) * r * r) >> 8) + 
    4 * g * g + 
    (((767 - rMean) * b * b) >> 8)
  );
}

export function grayscale(rgb: RGB): RGB {
  // Luminance formula
  const l = Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  return { r: l, g: l, b: l };
}
