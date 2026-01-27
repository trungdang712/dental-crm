'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Eye, Camera, ScanLine, Loader2, Check } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { PatientPhoto, XrayPhoto, PatientPhotoType, XrayType } from '@/lib/types'

const PATIENT_PHOTO_LABELS: Record<PatientPhotoType, string> = {
  front_smile: 'Nụ cười chính diện',
  right_bite: 'Cắn bên phải',
  left_bite: 'Cắn bên trái',
  upper_occlusal: 'Mặt nhai hàm trên',
  lower_occlusal: 'Mặt nhai hàm dưới',
}

const XRAY_LABELS: Record<XrayType, string> = {
  opg: 'Phim toàn cảnh (OPG)',
  cephalometric: 'Phim sọ nghiêng',
  periapical: 'Phim cận chóp',
  cbct: 'CT Cone Beam',
  bitewing: 'Phim cánh cắn',
}

interface LeadImageUploadProps {
  patientPhotos: PatientPhoto[]
  xrayPhotos: XrayPhoto[]
  onPatientPhotosChange: (photos: PatientPhoto[]) => void
  onXrayPhotosChange: (xrays: XrayPhoto[]) => void
}

export function LeadImageUpload({
  patientPhotos,
  xrayPhotos,
  onPatientPhotosChange,
  onXrayPhotosChange,
}: LeadImageUploadProps) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxTitle, setLightboxTitle] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUploadType = useRef<{ category: 'photo' | 'xray'; type: string } | null>(null)
  const supabase = createClient()

  // Get photo by type
  const getPhoto = (type: PatientPhotoType): PatientPhoto | undefined => {
    return patientPhotos.find(p => p.type === type)
  }

  // Get xray by type
  const getXray = (type: XrayType): XrayPhoto | undefined => {
    return xrayPhotos.find(x => x.type === type)
  }

  // Handle file upload
  const handleUpload = async (file: File, category: 'photo' | 'xray', type: string) => {
    const slotKey = `${category}-${type}`
    setUploadingSlot(slotKey)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `lead-images/${category}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('crm-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('crm-files')
        .getPublicUrl(filePath)

      if (category === 'photo') {
        const newPhoto: PatientPhoto = {
          type: type as PatientPhotoType,
          url: publicUrl,
          uploadedAt: new Date().toISOString(),
        }
        const existing = patientPhotos.findIndex(p => p.type === type)
        if (existing >= 0) {
          const updated = [...patientPhotos]
          updated[existing] = newPhoto
          onPatientPhotosChange(updated)
        } else {
          onPatientPhotosChange([...patientPhotos, newPhoto])
        }
      } else {
        const newXray: XrayPhoto = {
          type: type as XrayType,
          url: publicUrl,
          uploadedAt: new Date().toISOString(),
        }
        const existing = xrayPhotos.findIndex(x => x.type === type)
        if (existing >= 0) {
          const updated = [...xrayPhotos]
          updated[existing] = newXray
          onXrayPhotosChange(updated)
        } else {
          onXrayPhotosChange([...xrayPhotos, newXray])
        }
      }

      toast.success('Đã tải ảnh lên')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Không thể tải ảnh lên')
    } finally {
      setUploadingSlot(null)
    }
  }

  // Trigger file input
  const triggerUpload = (category: 'photo' | 'xray', type: string) => {
    currentUploadType.current = { category, type }
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && currentUploadType.current) {
      handleUpload(file, currentUploadType.current.category, currentUploadType.current.type)
    }
    e.target.value = ''
  }

  // Remove photo
  const removePhoto = (type: PatientPhotoType) => {
    onPatientPhotosChange(patientPhotos.filter(p => p.type !== type))
  }

  // Remove xray
  const removeXray = (type: XrayType) => {
    onXrayPhotosChange(xrayPhotos.filter(x => x.type !== type))
  }

  // Render photo slot
  const renderPhotoSlot = (type: PatientPhotoType) => {
    const photo = getPhoto(type)
    const slotKey = `photo-${type}`
    const isUploading = uploadingSlot === slotKey
    const label = PATIENT_PHOTO_LABELS[type]

    return (
      <div key={type} className="relative group">
        <div
          className={`
            relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer aspect-square
            ${photo
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-dashed border-gray-300 bg-gray-50 hover:border-gray-400'
            }
            ${isUploading ? 'border-blue-400 bg-blue-50' : ''}
          `}
          onClick={() => !photo && !isUploading && triggerUpload('photo', type)}
        >
          {isUploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : photo ? (
            <>
              <img src={photo.url} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(photo.url); setLightboxTitle(label); }}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(type); }}
                  className="p-1.5 bg-white rounded-full hover:bg-red-100"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="absolute top-1 right-1">
                <Check className="w-4 h-4 text-emerald-500 bg-white rounded-full p-0.5" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
        <p className="mt-1 text-[10px] text-center text-muted-foreground truncate">{label}</p>
      </div>
    )
  }

  // Render xray slot
  const renderXraySlot = (type: XrayType) => {
    const xray = getXray(type)
    const slotKey = `xray-${type}`
    const isUploading = uploadingSlot === slotKey
    const label = XRAY_LABELS[type]

    return (
      <div key={type} className="relative group">
        <div
          className={`
            relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer aspect-square
            ${xray
              ? 'border-emerald-400 bg-slate-900'
              : 'border-dashed border-slate-600 bg-slate-800 hover:border-slate-500'
            }
            ${isUploading ? 'border-blue-400' : ''}
          `}
          onClick={() => !xray && !isUploading && triggerUpload('xray', type)}
        >
          {isUploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : xray ? (
            <>
              <img src={xray.url} alt={label} className="w-full h-full object-contain bg-black" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(xray.url); setLightboxTitle(label); }}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeXray(type); }}
                  className="p-1.5 bg-white rounded-full hover:bg-red-100"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="absolute top-1 right-1">
                <Check className="w-4 h-4 text-emerald-400 bg-slate-900 rounded-full p-0.5" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ScanLine className="w-5 h-5 text-slate-500" />
            </div>
          )}
        </div>
        <p className="mt-1 text-[10px] text-center text-slate-400 truncate">{label}</p>
      </div>
    )
  }

  const patientPhotoTypes: PatientPhotoType[] = ['front_smile', 'right_bite', 'left_bite', 'upper_occlusal', 'lower_occlusal']
  const xrayTypes: XrayType[] = ['opg', 'cephalometric', 'periapical', 'cbct', 'bitewing']

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Patient Photos */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium">Ảnh bệnh nhân ({patientPhotos.length}/5)</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {patientPhotoTypes.map(renderPhotoSlot)}
        </div>
      </div>

      {/* X-ray Photos */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium">Ảnh X-Ray ({xrayPhotos.length}/5)</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {xrayTypes.map(renderXraySlot)}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>
            {lightboxImage && (
              <img src={lightboxImage} alt={lightboxTitle} className="w-full h-auto max-h-[80vh] object-contain" />
            )}
            {lightboxTitle && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-center font-medium">{lightboxTitle}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
