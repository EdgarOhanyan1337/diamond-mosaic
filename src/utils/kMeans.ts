import type { RGB } from "./colors";
import { colorDistance } from "./colors";

export function kMeansQuantize(pixels: RGB[], k: number, maxIterations = 20): RGB[] {
  if (k <= 0) return [];
  if (pixels.length === 0) return [];

  // Initialize centroids using K-Means++ logic roughly
  const centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];
  for (let i = 1; i < k; i++) {
    // Find pixel farthest from existing centroids
    let maxDist = -1;
    let bestPixel = pixels[0];
    
    // Sample a subset for performance if pixels is huge
    const step = Math.max(1, Math.floor(pixels.length / 1000));
    for (let j = 0; j < pixels.length; j += step) {
      const p = pixels[j];
      let minDist = Infinity;
      for (const c of centroids) {
        const d = colorDistance(p, c);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        bestPixel = p;
      }
    }
    centroids.push(bestPixel);
  }

  // Iterate
  let assignments = new Int32Array(pixels.length);
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign pixels to nearest centroid
    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      let minDist = Infinity;
      let bestIdx = 0;
      for (let j = 0; j < k; j++) {
        const d = colorDistance(p, centroids[j]);
        if (d < minDist) {
          minDist = d;
          bestIdx = j;
        }
      }
      if (assignments[i] !== bestIdx) {
        assignments[i] = bestIdx;
        changed = true;
      }
    }

    if (!changed) break;

    // Recompute centroids
    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const cIdx = assignments[i];
      sums[cIdx].r += pixels[i].r;
      sums[cIdx].g += pixels[i].g;
      sums[cIdx].b += pixels[i].b;
      sums[cIdx].count++;
    }

    for (let j = 0; j < k; j++) {
      if (sums[j].count > 0) {
        centroids[j] = {
          r: Math.round(sums[j].r / sums[j].count),
          g: Math.round(sums[j].g / sums[j].count),
          b: Math.round(sums[j].b / sums[j].count),
        };
      }
    }
  }

  return centroids;
}

export function mapToPalette(pixels: RGB[], palette: RGB[]): number[] {
  return pixels.map(p => {
    let minDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < palette.length; i++) {
      const d = colorDistance(p, palette[i]);
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  });
}
