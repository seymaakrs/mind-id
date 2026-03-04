"use client"

import { useState, useRef } from "react"
import {
  X,
  Plus,
  Loader2,
  Film,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useMediaJobs } from "@/hooks"
import { uploadMediaJobFile } from "@/lib/firebase/storage"
import type {
  MediaJob,
  MediaJobCreate,
  MediaOperation,
  ModelTier,
} from "@/types/media-jobs"

interface MediaJobsModalProps {
  threadId: string
  onClose: () => void
}

const OPERATIONS: { value: MediaOperation; label: string }[] = [
  { value: "text_to_video", label: "Metinden Video" },
  { value: "image_to_video", label: "Görselden Video" },
  { value: "first_last_frame", label: "İlk/Son Kare" },
  { value: "reference_to_video", label: "Referans Video" },
  { value: "video_edit", label: "Video Düzenleme" },
  { value: "video_reference", label: "Video Referans" },
  { value: "lipsync_audio", label: "Dudak Senkron (Ses)" },
  { value: "lipsync_text", label: "Dudak Senkron (Metin)" },
]

const MODEL_TIERS: { value: ModelTier; label: string }[] = [
  { value: "v3_standard", label: "V3 Standard" },
  { value: "v3_pro", label: "V3 Pro" },
  { value: "o1", label: "O1" },
]

const DURATIONS = [
  { value: 5, label: "5 saniye" },
  { value: 10, label: "10 saniye" },
]

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Yatay)" },
  { value: "9:16", label: "9:16 (Dikey)" },
  { value: "1:1", label: "1:1 (Kare)" },
]

function StatusBadge({ status }: { status: MediaJob["status"] }) {
  const config = {
    pending: { icon: Clock, label: "Bekliyor", className: "text-yellow-500 bg-yellow-500/10" },
    processing: { icon: Loader2, label: "İşleniyor", className: "text-blue-500 bg-blue-500/10" },
    completed: { icon: CheckCircle2, label: "Tamamlandı", className: "text-green-500 bg-green-500/10" },
    failed: { icon: XCircle, label: "Başarısız", className: "text-red-500 bg-red-500/10" },
  }[status]

  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", config.className)}>
      <Icon className={cn("w-3 h-3", status === "processing" && "animate-spin")} />
      {config.label}
    </span>
  )
}

// Which fields are needed per operation
function getRequiredFields(op: MediaOperation) {
  const base = { prompt: true, duration: true, aspectRatio: true }
  switch (op) {
    case "text_to_video":
      return { ...base }
    case "image_to_video":
      return { ...base, imageUrl: true }
    case "first_last_frame":
      return { ...base, imageUrl: true, lastImageUrl: true }
    case "reference_to_video":
      return { ...base, referenceImages: true }
    case "video_edit":
      return { prompt: true, videoUrl: true }
    case "video_reference":
      return { ...base, videoUrl: true }
    case "lipsync_audio":
      return { videoUrl: true, audioUrl: true }
    case "lipsync_text":
      return { videoUrl: true, lipsyncText: true }
  }
}

export default function MediaJobsModal({ threadId, onClose }: MediaJobsModalProps) {
  const {
    jobs,
    isLoading,
    isCreating,
    error,
    clearError,
    createJob,
    removeJob,
    refreshJob,
  } = useMediaJobs(threadId)

  const [view, setView] = useState<"list" | "create" | "detail">("list")
  const [selectedJob, setSelectedJob] = useState<MediaJob | null>(null)

  // Form state
  const [operation, setOperation] = useState<MediaOperation>("text_to_video")
  const [modelTier, setModelTier] = useState<ModelTier>("v3_standard")
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [cfgScale, setCfgScale] = useState(0.5)
  const [imageUrl, setImageUrl] = useState("")
  const [lastImageUrl, setLastImageUrl] = useState("")
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [lipsyncText, setLipsyncText] = useState("")
  const [parentJobId, setParentJobId] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<"image" | "lastImage" | "reference" | "video" | "audio" | null>(null)

  const resetForm = () => {
    setOperation("text_to_video")
    setModelTier("v3_standard")
    setPrompt("")
    setNegativePrompt("")
    setDuration(5)
    setAspectRatio("16:9")
    setCfgScale(0.5)
    setImageUrl("")
    setLastImageUrl("")
    setReferenceImageUrls([])
    setVideoUrl("")
    setAudioUrl("")
    setLipsyncText("")
    setParentJobId("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return

    setIsUploading(true)
    try {
      const fileType = uploadTarget === "video" ? "video" : uploadTarget === "audio" ? "audio" : "image"
      const { url } = await uploadMediaJobFile(file, threadId, fileType)

      switch (uploadTarget) {
        case "image":
          setImageUrl(url)
          break
        case "lastImage":
          setLastImageUrl(url)
          break
        case "reference":
          if (referenceImageUrls.length < 4) {
            setReferenceImageUrls((prev) => [...prev, url])
          }
          break
        case "video":
          setVideoUrl(url)
          break
        case "audio":
          setAudioUrl(url)
          break
      }
    } catch {
      // upload error handled silently
    } finally {
      setIsUploading(false)
      setUploadTarget(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const triggerUpload = (target: typeof uploadTarget, accept: string) => {
    setUploadTarget(target)
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

  const handleSubmit = async () => {
    const data: MediaJobCreate = {
      operation,
      model_tier: modelTier,
    }

    const fields = getRequiredFields(operation)

    if (fields.prompt && prompt) data.prompt = prompt
    if (negativePrompt) data.negative_prompt = negativePrompt
    if (fields.duration) data.duration = duration
    if (fields.aspectRatio) data.aspect_ratio = aspectRatio
    if (cfgScale !== 0.5) data.cfg_scale = cfgScale
    if (fields.imageUrl && imageUrl) data.image_url = imageUrl
    if (fields.lastImageUrl && lastImageUrl) data.last_image_url = lastImageUrl
    if (fields.referenceImages && referenceImageUrls.length > 0) data.reference_image_urls = referenceImageUrls
    if (fields.videoUrl && videoUrl) data.video_url = videoUrl
    if (fields.audioUrl && audioUrl) data.audio_url = audioUrl
    if (fields.lipsyncText && lipsyncText) data.lipsync_text = lipsyncText
    if (parentJobId) data.parent_job_id = parentJobId

    const job = await createJob(data)
    if (job) {
      resetForm()
      setView("list")
    }
  }

  const handleViewDetail = (job: MediaJob) => {
    setSelectedJob(job)
    refreshJob(job.id)
    setView("detail")
  }

  const completedJobs = jobs.filter((j) => j.status === "completed")
  const fields = getRequiredFields(operation)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 bg-background border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setView("list")
                  setSelectedJob(null)
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <Film className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {view === "list" && "Media Jobs"}
              {view === "create" && "Yeni Job Oluştur"}
              {view === "detail" && "Job Detayı"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {view === "list" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  resetForm()
                  setView("create")
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="p-0.5 hover:bg-destructive/20 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* === LIST VIEW === */}
          {view === "list" && (
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Film className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Henüz media job yok</p>
                  <p className="text-xs mt-1">Yeni bir video oluşturmak için + butonuna tıklayın</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewDetail(job)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleViewDetail(job) }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      {/* Thumbnail / Icon */}
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {job.output_url && job.status === "completed" ? (
                          <video
                            src={job.output_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <Film className="w-6 h-6 text-muted-foreground/50" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium truncate">
                            {OPERATIONS.find((o) => o.value === job.operation)?.label ?? job.operation}
                          </span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {job.input?.prompt as string || job.fal_model_id}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(job.created_at)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeJob(job.id)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === CREATE VIEW === */}
          {view === "create" && (
            <div className="p-5 space-y-4">
              {/* Operation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">İşlem Tipi</Label>
                <Select value={operation} onValueChange={(v) => setOperation(v as MediaOperation)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATIONS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Tier */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                <Select value={modelTier} onValueChange={(v) => setModelTier(v as ModelTier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODEL_TIERS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt */}
              {fields.prompt && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Video için prompt yazın..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              )}

              {/* Negative Prompt */}
              {fields.prompt && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Negatif Prompt (Opsiyonel)</Label>
                  <Textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="İstemediğiniz öğeler..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              )}

              {/* Duration + Aspect Ratio row */}
              {(fields.duration || fields.aspectRatio) && (
                <div className="grid grid-cols-2 gap-3">
                  {fields.duration && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Süre</Label>
                      <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {fields.aspectRatio && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">En-Boy Oranı</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ar) => (
                            <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* CFG Scale */}
              {fields.prompt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">CFG Scale</Label>
                    <span className="text-xs font-mono text-foreground">{cfgScale.toFixed(1)}</span>
                  </div>
                  <Input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Image URL */}
              {fields.imageUrl && (
                <FileUploadField
                  label="Görsel"
                  value={imageUrl}
                  isUploading={isUploading && uploadTarget === "image"}
                  onUpload={() => triggerUpload("image", "image/*")}
                  onClear={() => setImageUrl("")}
                />
              )}

              {/* Last Image URL */}
              {fields.lastImageUrl && (
                <FileUploadField
                  label="Son Kare Görseli"
                  value={lastImageUrl}
                  isUploading={isUploading && uploadTarget === "lastImage"}
                  onUpload={() => triggerUpload("lastImage", "image/*")}
                  onClear={() => setLastImageUrl("")}
                />
              )}

              {/* Reference Images */}
              {fields.referenceImages && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Referans Görseller ({referenceImageUrls.length}/4)
                  </Label>
                  <div className="space-y-1">
                    {referenceImageUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1.5 rounded-lg">
                        <span className="flex-1 truncate">{url.split("/").pop()}</span>
                        <button
                          onClick={() => setReferenceImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {referenceImageUrls.length < 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={isUploading}
                      onClick={() => triggerUpload("reference", "image/*")}
                    >
                      {isUploading && uploadTarget === "reference" ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Görsel Ekle
                    </Button>
                  )}
                </div>
              )}

              {/* Video URL */}
              {fields.videoUrl && (
                <FileUploadField
                  label="Video"
                  value={videoUrl}
                  isUploading={isUploading && uploadTarget === "video"}
                  onUpload={() => triggerUpload("video", "video/*")}
                  onClear={() => setVideoUrl("")}
                />
              )}

              {/* Audio URL */}
              {fields.audioUrl && (
                <FileUploadField
                  label="Ses Dosyası"
                  value={audioUrl}
                  isUploading={isUploading && uploadTarget === "audio"}
                  onUpload={() => triggerUpload("audio", "audio/*")}
                  onClear={() => setAudioUrl("")}
                />
              )}

              {/* Lipsync Text */}
              {fields.lipsyncText && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Dudak Senkron Metni</Label>
                  <Textarea
                    value={lipsyncText}
                    onChange={(e) => setLipsyncText(e.target.value)}
                    placeholder="Senkronize edilecek metin..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              )}

              {/* Parent Job */}
              {completedJobs.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Kaynak Job (Opsiyonel)</Label>
                  <Select value={parentJobId} onValueChange={setParentJobId}>
                    <SelectTrigger><SelectValue placeholder="Seçin..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      {completedJobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {OPERATIONS.find((o) => o.value === j.operation)?.label} — {j.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* === DETAIL VIEW === */}
          {view === "detail" && selectedJob && (
            <div className="p-5 space-y-4">
              {/* Status + Meta */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedJob.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => refreshJob(selectedJob.id)}
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Yenile
                </Button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <InfoField label="İşlem" value={OPERATIONS.find((o) => o.value === selectedJob.operation)?.label ?? selectedJob.operation} />
                <InfoField label="Model" value={selectedJob.model_tier} />
                <InfoField label="Servis" value={selectedJob.service} />
                <InfoField label="Oluşturulma" value={formatDate(selectedJob.created_at)} />
                {selectedJob.output_duration && (
                  <InfoField label="Çıktı Süresi" value={`${selectedJob.output_duration}s`} />
                )}
                {selectedJob.fal_request_id && (
                  <InfoField label="Request ID" value={selectedJob.fal_request_id} />
                )}
              </div>

              {/* Output Video */}
              {selectedJob.output_url && selectedJob.status === "completed" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Çıktı</Label>
                  <div className="rounded-xl overflow-hidden bg-black">
                    <video
                      src={selectedJob.output_url}
                      controls
                      className="w-full max-h-[300px]"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedJob.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <p className="font-medium mb-1">Hata</p>
                  <p>{selectedJob.error}</p>
                </div>
              )}

              {/* Input params */}
              {selectedJob.input && Object.keys(selectedJob.input).length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Giriş Parametreleri</Label>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto scrollbar-thin">
                    {JSON.stringify(selectedJob.input, null, 2)}
                  </div>
                </div>
              )}

              {/* Delete */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    await removeJob(selectedJob.id)
                    setView("list")
                    setSelectedJob(null)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Job'u Sil
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Create button */}
        {view === "create" && (
          <div className="px-5 py-3.5 border-t border-border">
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUploading}
              className="w-full"
              size="sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Job Oluştur
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FileUploadField({
  label,
  value,
  isUploading,
  onUpload,
  onClear,
}: {
  label: string
  value: string
  isUploading: boolean
  onUpload: () => void
  onClear: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1.5 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="flex-1 truncate">{value.split("/").pop()}</span>
          <button onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-xs w-full"
          disabled={isUploading}
          onClick={onUpload}
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          {isUploading ? "Yükleniyor..." : `${label} Yükle`}
        </Button>
      )}
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
