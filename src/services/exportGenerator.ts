import { jsPDF } from "jspdf";
import JSZip from "jszip";
import type { ProcessResult } from "../workers/imageProcessor.worker";
import { renderMosaic, generateLegendData } from "./canvasRenderer";

export async function generatePatternImage(result: ProcessResult, showSymbols: boolean): Promise<Blob> {
  const canvas = document.createElement("canvas");
  // High res for export
  renderMosaic(canvas, result, showSymbols, 40);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

export async function generatePDF(result: ProcessResult): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Diamond Mosaic Pattern", margin, 20);

  // Add Pattern Image (Scale to fit)
  const patternCanvas = document.createElement("canvas");
  renderMosaic(patternCanvas, result, true, 20); // Medium res for PDF
  const patternDataUrl = patternCanvas.toDataURL("image/png");

  const imgRatio = patternCanvas.height / patternCanvas.width;
  const maxImgWidth = pageWidth - margin * 2;
  const maxImgHeight = pageHeight - 60;
  
  let imgWidth = maxImgWidth;
  let imgHeight = maxImgWidth * imgRatio;

  if (imgHeight > maxImgHeight) {
    imgHeight = maxImgHeight;
    imgWidth = maxImgHeight / imgRatio;
  }

  doc.addImage(patternDataUrl, "PNG", margin, 30, imgWidth, imgHeight);

  // Add Legend on a new page
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Color Legend", margin, 20);

  const legend = generateLegendData(result);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let yPos = 30;
  
  legend.forEach((item) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    // Color box
    doc.setFillColor(item.color.r, item.color.g, item.color.b);
    doc.rect(margin, yPos, 10, 10, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, 10, 10, "S");
    
    // Text
    doc.text(`Symbol: ${item.symbol}`, margin + 15, yPos + 6);
    doc.text(`HEX: ${item.hex}`, margin + 45, yPos + 6);
    doc.text(`Count: ${item.count} pixels`, margin + 85, yPos + 6);
    
    yPos += 15;
  });

  return new Blob([doc.output("blob")], { type: "application/pdf" });
}

export async function generateZIP(result: ProcessResult): Promise<Blob> {
  const zip = new JSZip();

  // Pattern with symbols
  const patternWithSymbols = await generatePatternImage(result, true);
  zip.file("pattern_symbols.png", patternWithSymbols);

  // Pattern without symbols
  const patternPlain = await generatePatternImage(result, false);
  zip.file("pattern_plain.png", patternPlain);

  // PDF
  const pdfBlob = await generatePDF(result);
  zip.file("pattern_and_legend.pdf", pdfBlob);

  return zip.generateAsync({ type: "blob" });
}
