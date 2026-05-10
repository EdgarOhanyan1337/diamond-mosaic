import { useState, useRef, useEffect } from "react"
import { AppLayout } from "./components/layout/AppLayout"
import { cn } from "./utils/cn"
import { ImageUpload } from "./features/upload/ImageUpload"
import { Workspace } from "./features/workspace/Workspace"
import { Button } from "./components/ui/Button"
import { Slider } from "./components/ui/Slider"
import { Switch } from "./components/ui/Switch"
import { Card, CardContent } from "./components/ui/Card"
import { Download, Settings2, Palette, Grid3X3, Image as ImageIcon, FileArchive, FileDown, Loader2, Moon, Sun, Link as LinkIcon, Unlink } from "lucide-react"
import { processImage } from "./services/imageProcessing"
import type { ProcessResult } from "./workers/imageProcessor.worker"
import { renderMosaic } from "./services/canvasRenderer"
import { generateZIP, generatePDF } from "./services/exportGenerator"

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generator Settings
  const [gridWidth, setGridWidth] = useState(40)
  const [gridHeight, setGridHeight] = useState(40)
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [unit, setUnit] = useState<"cells" | "cm">("cells")
  const [drillSize, setDrillSize] = useState(2.5) // in mm
  const originalAspect = useRef<number | null>(null)
  
  const [colorCount, setColorCount] = useState(24)
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false)
  const [showSymbols, setShowSymbols] = useState(true)

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleProcess = async (file: File, w: number, h: number, colors: number, bw: boolean) => {
    setIsProcessing(true)
    try {
      const result = await processImage(file, w, h, {
        colorCount: colors,
        isBlackAndWhite: bw,
        dithering: false
      })
      setProcessResult(result)
    } catch (err) {
      console.error("Processing failed", err)
      // TODO: Add toast notification
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageSelected = (file: File) => {
    setImageFile(file)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const aspect = img.width / img.height
      originalAspect.current = aspect
      let newH = gridHeight
      if (maintainAspect) {
        newH = Math.max(10, Math.round(gridWidth / aspect))
        setGridHeight(newH)
      }
      handleProcess(file, gridWidth, newH, colorCount, isBlackAndWhite)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // Rerender canvas when settings or result changes
  useEffect(() => {
    if (processResult && canvasRef.current) {
      renderMosaic(canvasRef.current, processResult, showSymbols, 20)
    }
  }, [processResult, showSymbols])

  // Reprocess if heavy settings change
  useEffect(() => {
    if (imageFile) {
      const timeout = setTimeout(() => {
        handleProcess(imageFile, gridWidth, gridHeight, colorCount, isBlackAndWhite)
      }, 500) // debounce
      return () => clearTimeout(timeout)
    }
  }, [gridWidth, gridHeight, colorCount, isBlackAndWhite])

  const handleExport = async (type: "zip" | "pdf") => {
    if (!processResult) return
    setIsExporting(true)
    try {
      let blob: Blob
      let filename: string
      if (type === "zip") {
        blob = await generateZIP(processResult)
        filename = "diamond_mosaic.zip"
      } else {
        blob = await generatePDF(processResult)
        filename = "diamond_mosaic.pdf"
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed", err)
    } finally {
      setIsExporting(false)
    }
  }

  const sidebar = (
    <div className="flex flex-col h-full relative">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-primary" />
            Diamond Mosaic
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convert photos to printable patterns
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!imageFile && (
          <Card className="border-dashed bg-accent/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-32">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload an image to start</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <Settings2 className="w-4 h-4" /> Size & Grid
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dimensions</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md bg-accent/50 p-0.5">
                  <button 
                    className={cn("px-2 py-0.5 text-xs rounded-sm transition-colors", unit === "cells" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => setUnit("cells")}
                  >
                    Cells
                  </button>
                  <button 
                    className={cn("px-2 py-0.5 text-xs rounded-sm transition-colors", unit === "cm" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => setUnit("cm")}
                  >
                    CM
                  </button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 ml-1" 
                  onClick={() => setMaintainAspect(!maintainAspect)}
                  title={maintainAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {maintainAspect ? <LinkIcon className="w-3 h-3" /> : <Unlink className="w-3 h-3 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Width</label>
                <div className="relative">
                  <input
                    type="number"
                    min={unit === "cm" ? (10 * drillSize) / 10 : 10}
                    max={unit === "cm" ? (1000 * drillSize) / 10 : 1000}
                    step={unit === "cm" ? 0.5 : 1}
                    value={unit === "cm" ? Number((gridWidth / (10 / drillSize)).toFixed(2)) : gridWidth}
                    onChange={(e) => {
                      const displayVal = Number(e.target.value)
                      const val = unit === "cm" ? Math.round(displayVal * (10 / drillSize)) : displayVal
                      setGridWidth(val)
                      if (maintainAspect && originalAspect.current) {
                        setGridHeight(Math.max(10, Math.round(val / originalAspect.current)))
                      }
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground pointer-events-none">{unit === "cm" ? "cm" : "px"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Height</label>
                <div className="relative">
                  <input
                    type="number"
                    min={unit === "cm" ? (10 * drillSize) / 10 : 10}
                    max={unit === "cm" ? (1000 * drillSize) / 10 : 1000}
                    step={unit === "cm" ? 0.5 : 1}
                    value={unit === "cm" ? Number((gridHeight / (10 / drillSize)).toFixed(2)) : gridHeight}
                    onChange={(e) => {
                      const displayVal = Number(e.target.value)
                      const val = unit === "cm" ? Math.round(displayVal * (10 / drillSize)) : displayVal
                      setGridHeight(val)
                      if (maintainAspect && originalAspect.current) {
                        setGridWidth(Math.max(10, Math.round(val * originalAspect.current)))
                      }
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground pointer-events-none">{unit === "cm" ? "cm" : "px"}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Slider
                min={unit === "cm" ? (10 * drillSize) / 10 : 10}
                max={unit === "cm" ? (500 * drillSize) / 10 : 500}
                step={unit === "cm" ? 0.5 : 1}
                value={unit === "cm" ? Number((gridWidth / (10 / drillSize)).toFixed(2)) : gridWidth}
                onChange={(e) => {
                  const displayVal = Number(e.target.value)
                  const val = unit === "cm" ? Math.round(displayVal * (10 / drillSize)) : displayVal
                  setGridWidth(val)
                  if (maintainAspect && originalAspect.current) {
                    setGridHeight(Math.max(10, Math.round(val / originalAspect.current)))
                  }
                }}
              />
            </div>
            
            {unit === "cm" && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-accent/30 rounded-md border border-border">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Drill size:</span>
                <div className="relative w-20">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    value={drillSize}
                    onChange={(e) => {
                      const newDrillSize = Number(e.target.value)
                      if (newDrillSize > 0) {
                        const oldCellsPerCm = 10 / drillSize
                        const cmWidth = gridWidth / oldCellsPerCm
                        const cmHeight = gridHeight / oldCellsPerCm
                        
                        const newCellsPerCm = 10 / newDrillSize
                        setGridWidth(Math.max(10, Math.round(cmWidth * newCellsPerCm)))
                        setGridHeight(Math.max(10, Math.round(cmHeight * newCellsPerCm)))
                        setDrillSize(newDrillSize)
                      }
                    }}
                    className="w-full h-6 rounded-sm border border-input bg-background px-2 py-0 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground pointer-events-none">mm</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Symbols</label>
            <Switch checked={showSymbols} onChange={setShowSymbols} />
          </div>
        </div>

        <div className="w-full h-px bg-border" />

        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <Palette className="w-4 h-4" /> Colors
          </h2>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Black & White</label>
            <Switch checked={isBlackAndWhite} onChange={setIsBlackAndWhite} />
          </div>

          {!isBlackAndWhite && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Max Colors</label>
                <span className="text-sm text-muted-foreground">{colorCount}</span>
              </div>
              <Slider
                min={2}
                max={64}
                step={1}
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-border bg-card space-y-3">
        <Button 
          className="w-full gap-2" 
          size="lg" 
          disabled={!processResult || isExporting || isProcessing}
          onClick={() => handleExport("zip")}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
          Download ZIP
        </Button>
        <Button 
          className="w-full gap-2" 
          variant="secondary"
          disabled={!processResult || isExporting || isProcessing}
          onClick={() => handleExport("pdf")}
        >
          <FileDown className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
    </div>
  )

  return (
    <AppLayout sidebar={sidebar}>
      {!imageFile ? (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-xl w-full">
            <ImageUpload onImageSelected={handleImageSelected} />
          </div>
        </div>
      ) : (
        <Workspace canvasRef={canvasRef} isProcessing={isProcessing} />
      )}
    </AppLayout>
  )
}

export default App
