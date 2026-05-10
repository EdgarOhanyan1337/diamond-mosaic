import type { RGB } from "../utils/colors";
import { grayscale } from "../utils/colors";
import { kMeansQuantize, mapToPalette } from "../utils/kMeans";

export interface ProcessSettings {
  colorCount: number;
  isBlackAndWhite: boolean;
  dithering: boolean; // placeholder for future
}

export interface ProcessMessage {
  type: "PROCESS";
  imageData: Uint8ClampedArray;
  width: number;
  height: number;
  settings: ProcessSettings;
}

export interface ProcessResult {
  type: "DONE";
  palette: RGB[];
  colorIndices: number[]; // 1D array of indices mapping to palette
  width: number;
  height: number;
}

self.onmessage = (e: MessageEvent<ProcessMessage>) => {
  if (e.data.type === "PROCESS") {
    const { imageData, width, height, settings } = e.data;
    
    // Extract RGB from RGBA
    let pixels: RGB[] = [];
    for (let i = 0; i < imageData.length; i += 4) {
      let r = imageData[i];
      let g = imageData[i + 1];
      let b = imageData[i + 2];
      
      if (settings.isBlackAndWhite) {
        const gray = grayscale({ r, g, b });
        r = gray.r;
        g = gray.g;
        b = gray.b;
      }
      
      pixels.push({ r, g, b });
    }

    let palette: RGB[];
    if (settings.isBlackAndWhite) {
      // In B&W mode, standard 2 colors or customized grayscale steps
      palette = kMeansQuantize(pixels, Math.min(settings.colorCount, 16));
    } else {
      palette = kMeansQuantize(pixels, settings.colorCount);
    }

    const colorIndices = mapToPalette(pixels, palette);

    const result: ProcessResult = {
      type: "DONE",
      palette,
      colorIndices,
      width,
      height
    };

    self.postMessage(result);
  }
};
