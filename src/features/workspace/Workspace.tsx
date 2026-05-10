import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { Button } from "../../components/ui/Button"

export interface WorkspaceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isProcessing?: boolean
}

export function Workspace({ canvasRef, isProcessing = false }: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * 0.01), 10)
      setScale(newScale)
    }
  }

  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 10))
  const zoomOut = () => setScale((s) => Math.max(s / 1.2, 0.1))
  const resetZoom = () => setScale(1)

  return (
    <div 
      className="relative w-full h-full bg-accent/20 overflow-hidden"
      ref={containerRef}
      onWheel={handleWheel}
    >
      <div className="absolute bottom-6 right-6 flex gap-2 z-10 bg-card p-2 rounded-xl border shadow-lg">
        <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </Button>
        <div className="flex items-center justify-center w-12 text-xs font-medium">
          {Math.round(scale * 100)}%
        </div>
        <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 my-auto" />
        <Button variant="ghost" size="icon" onClick={resetZoom} title="Reset Zoom">
          <Maximize className="w-5 h-5" />
        </Button>
      </div>

      <motion.div
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
      >
        <motion.div
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative shadow-2xl ring-1 ring-border"
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <canvas
            ref={canvasRef}
            className="block max-w-none bg-white"
            style={{ imageRendering: "pixelated" }}
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="font-medium text-primary bg-background px-3 py-1 rounded-full shadow-sm">
                  Processing...
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
