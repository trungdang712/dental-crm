'use client'

import * as React from 'react'
import { Upload, X, FileImage, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FileUpload({
  value = [],
  onChange,
  accept = 'image/*',
  multiple = true,
  maxFiles = 5,
  maxSize = 5, // 5MB default
  label = 'Tải lên tệp',
  description = 'Kéo thả hoặc nhấn để chọn',
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const [previews, setPreviews] = React.useState<string[]>([])

  // Generate previews for image files
  React.useEffect(() => {
    const newPreviews: string[] = []
    value.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        newPreviews.push(url)
      } else {
        newPreviews.push('')
      }
    })
    setPreviews(newPreviews)

    // Cleanup URLs on unmount
    return () => {
      newPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [value])

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return

    const newFiles = Array.from(files).filter((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Tệp ${file.name} vượt quá ${maxSize}MB`)
        return false
      }
      return true
    })

    const totalFiles = value.length + newFiles.length
    if (totalFiles > maxFiles) {
      alert(`Chỉ được tải lên tối đa ${maxFiles} tệp`)
      return
    }

    onChange?.([...value, ...newFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange?.(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tối đa {maxFiles} tệp, mỗi tệp {maxSize}MB
        </p>
      </div>

      {/* File Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group border rounded-lg overflow-hidden bg-muted/30"
            >
              {previews[index] ? (
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center">
                  {file.type.includes('image') ? (
                    <FileImage className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <File className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
