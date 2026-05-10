import React, { useState, useRef } from "react"
import { UploadCloud, Image as ImageIcon } from "lucide-react"
import { cn } from "../../utils/cn"

export interface ImageUploadProps {
  onImageSelected: (file: File) => void
}

export function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onImageSelected(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0])
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 md:h-96 rounded-2xl border-2 border-dashed transition-all duration-300 bg-card",
        isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 pointer-events-none">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
          {isDragging ? <UploadCloud className="w-10 h-10 animate-bounce" /> : <ImageIcon className="w-10 h-10" />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">
            {isDragging ? "Drop image to start" : "Click or drag image to upload"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports PNG, JPG, or WebP. High resolution recommended.
          </p>
        </div>
      </div>
    </div>
  )
}
