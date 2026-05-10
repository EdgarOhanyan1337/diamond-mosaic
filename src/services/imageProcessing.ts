import type { ProcessMessage, ProcessResult, ProcessSettings } from "../workers/imageProcessor.worker";

export async function processImage(
  imageFile: File,
  gridSize: number,
  settings: ProcessSettings
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate dimensions while maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let targetWidth = gridSize;
      let targetHeight = gridSize;
      
      if (aspectRatio > 1) {
        targetHeight = Math.round(gridSize / aspectRatio);
      } else {
        targetWidth = Math.round(gridSize * aspectRatio);
      }

      // Resize using canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        return reject(new Error("Could not get 2D context"));
      }

      // Draw image pixelated (resampling)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      
      // Initialize web worker
      const worker = new Worker(new URL("../workers/imageProcessor.worker.ts", import.meta.url), { type: "module" });
      
      worker.onmessage = (e: MessageEvent<ProcessResult>) => {
        if (e.data.type === "DONE") {
          resolve(e.data);
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };

      const message: ProcessMessage = {
        type: "PROCESS",
        imageData: imageData.data,
        width: targetWidth,
        height: targetHeight,
        settings
      };

      worker.postMessage(message);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
}
