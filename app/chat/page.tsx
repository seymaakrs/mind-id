"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  SendHorizontal,
  Bot,
  User,
  Loader2,
  Paperclip,
  X,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Thermometer,
  FileText,
  Hash,
  Image as ImageIcon,
  Film,
  AlertCircle,
  Plus,
  MessageSquare,
  Trash2,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import MediaJobsModal from "@/components/chat/MediaJobsModal"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { useChatThread } from "@/hooks"
import { getThreads, deleteThread, type ChatThread, type ChatMessageData } from "@/lib/chat-api"

interface ChatAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

interface LLMConfig {
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  streamEnabled: boolean
}

const AI_SERVICES = [
  { value: "auto", label: "Otomatik", icon: Sparkles },
  { value: "kling", label: "Kling AI", icon: Film },
  { value: "runway", label: "Runway", icon: Film },
  { value: "veo3.1", label: "Veo 3.1", icon: Film },
]

const LLM_MODELS = [
  { value: "gemini/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-3.5-haiku", label: "Claude 3.5 Haiku" },
]

const DEFAULT_CONFIG: LLMConfig = {
  model: "gemini/gemini-2.5-flash",
  systemPrompt: "Sen yardımcı bir AI asistansın. Kullanıcının isteklerini anlayıp uygun AI servislerini kullanarak yanıt veriyorsun.",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  streamEnabled: true,
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    thread,
    messages,
    isSending,
    isLoading: isLoadingMessages,
    error,
    initThread,
    sendMessage: sendChatMessage,
    loadMessages,
    setThread,
    clearError,
  } = useChatThread()

  const [input, setInput] = useState("")
  const [selectedService, setSelectedService] = useState("auto")
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [configOpen, setConfigOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_CONFIG)
  const [isInitializing, setIsInitializing] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)
  const [mediaJobsOpen, setMediaJobsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Load threads when user is ready
  useEffect(() => {
    if (user) fetchThreads()
  }, [user])

  const fetchThreads = async () => {
    setIsLoadingThreads(true)
    try {
      const data = await getThreads()
      setThreads(data)
    } catch {
      // silently fail
    } finally {
      setIsLoadingThreads(false)
    }
  }

  const handleSelectThread = async (selectedThread: ChatThread) => {
    setThread(selectedThread)
    await loadMessages(selectedThread.id)
    setHistoryOpen(false)
  }

  const handleNewChat = () => {
    setThread(null)
    setHistoryOpen(false)
  }

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation()
    setDeletingThreadId(threadId)
    try {
      await deleteThread(threadId)
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      // If deleting the active thread, reset
      if (thread?.id === threadId) {
        setThread(null)
      }
    } catch {
      // silently fail
    } finally {
      setDeletingThreadId(null)
    }
  }

  const ensureThread = async (): Promise<string | null> => {
    if (thread) return thread.id

    setIsInitializing(true)
    try {
      const newThread = await initThread({
        title: "Yeni Sohbet",
      })
      if (newThread) {
        // Add to thread list
        setThreads((prev) => [newThread, ...prev])
      }
      return newThread?.id ?? null
    } finally {
      setIsInitializing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: ChatAttachment[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((a) => a.id !== id)
    })
  }

  const handleSendMessage = async () => {
    const trimmed = input.trim()
    if ((!trimmed && attachments.length === 0) || isSending || isInitializing) return

    const threadId = await ensureThread()
    if (!threadId) return

    setInput("")
    setAttachments([])

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await sendChatMessage(
      { message: trimmed, model: config.model, system_prompt: config.systemPrompt },
      threadId,
      config.streamEnabled
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Bugün"
    if (diffDays === 1) return "Dün"
    if (diffDays < 7) return `${diffDays} gün önce`
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type.startsWith("video/")) return Film
    return FileText
  }

  const isLoading = isSending || isInitializing

  const renderMessage = (message: ChatMessageData) => {
    const isUser = message.role === "user"

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-2 max-w-[85%] md:max-w-[70%]",
          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
        )}
      >
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1",
            isUser ? "bg-primary/10" : "bg-secondary"
          )}
        >
          {isUser ? (
            <User className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-secondary-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          {message.content && (
            <div
              className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              )}
            >
              {message.content}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-1.5 px-1",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {message.model && (
              <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
                {message.model.split("/").pop()}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 flex bg-background">
        {/* Thread History Sidebar - Left */}
        {historyOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setHistoryOpen(false)}
          />
        )}

        <aside
          className={cn(
            "h-full border-r border-border bg-background flex flex-col overflow-hidden transition-all duration-300",
            "hidden lg:flex lg:w-[260px]",
            historyOpen && "!flex fixed inset-y-0 left-0 w-72 z-40 lg:relative lg:w-[260px]"
          )}
        >
          {/* History Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Sohbetler</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-7 w-7"
                title="Yeni Sohbet"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryOpen(false)}
                className="lg:hidden h-7 w-7"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Henüz sohbet yok</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectThread(t)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSelectThread(t) }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors group cursor-pointer",
                      thread?.id === t.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(t.updated_at)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteThread(e, t.id)}
                      disabled={deletingThreadId === t.id}
                      className={cn(
                        "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-destructive/20 text-muted-foreground hover:text-destructive",
                        deletingThreadId === t.id && "opacity-100"
                      )}
                    >
                      {deletingThreadId === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* History toggle - mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryOpen(!historyOpen)}
                className={cn("lg:hidden shrink-0", historyOpen && "bg-accent")}
              >
                <History className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold">
                    {thread?.title ?? "MindID Chat"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {LLM_MODELS.find((m) => m.value === config.model)?.label ?? config.model}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Media Jobs button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMediaJobsOpen(true)}
                className={cn("shrink-0", !thread && "opacity-50")}
                disabled={!thread}
                title="Media Jobs"
              >
                <Film className="w-5 h-5" />
              </Button>

              {/* New chat button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="shrink-0"
                title="Yeni Sohbet"
              >
                <Plus className="w-5 h-5" />
              </Button>

              {/* Config toggle - mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(!configOpen)}
                className={cn("lg:hidden", configOpen && "bg-accent")}
              >
                <Settings2 className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{error}</span>
              <button onClick={clearError} className="shrink-0 p-1 hover:bg-destructive/20 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Merhaba!</p>
                <p className="text-sm mt-1">Size nasıl yardımcı olabilirim?</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}

            {/* Loading indicator */}
            {isSending && (
              <div className="flex gap-2 mr-auto max-w-[85%] md:max-w-[70%]">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-secondary-foreground" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="border-t border-border bg-background/50 px-4 py-2">
              <div className="flex gap-2 max-w-3xl mx-auto overflow-x-auto scrollbar-thin">
                {attachments.map((att) => {
                  const FileIcon = getFileIcon(att.type)
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs shrink-0 group"
                    >
                      <FileIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border bg-background px-4 py-3">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              {/* Service selector */}
              <div className="shrink-0 self-end pb-[3px]">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_SERVICES.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        <div className="flex items-center gap-2">
                          <service.icon className="w-3.5 h-3.5" />
                          <span>{service.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File attachment */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 self-end h-9 w-9 rounded-xl mb-[3px]"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Message input */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                className="min-h-9 max-h-[120px] resize-none rounded-xl text-sm py-2"
                rows={1}
                disabled={isLoading}
              />

              {/* Send button */}
              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                size="icon"
                className="shrink-0 self-end rounded-xl h-9 w-9 mb-[3px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Config Panel - Right Side */}
        {configOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setConfigOpen(false)}
          />
        )}

        <aside
          className={cn(
            "h-full border-l border-border bg-background flex flex-col overflow-hidden transition-all duration-300",
            "hidden lg:flex lg:w-[25%] lg:min-w-[300px]",
            configOpen && "!flex fixed inset-y-0 right-0 w-80 z-40 lg:relative lg:w-[25%]"
          )}
        >
          {/* Config Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Yapılandırma</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfigOpen(false)}
              className="lg:hidden h-7 w-7"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Config Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Model
              </Label>
              <Select
                value={config.model}
                onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {thread && (
                <p className="text-[10px] text-muted-foreground">
                  Her mesajda seçilen model kullanılır
                </p>
              )}
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                System Prompt
              </Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig((c) => ({ ...c, systemPrompt: e.target.value }))}
                placeholder="Sistem talimatlarını yazın..."
                className="min-h-[100px] text-xs resize-none"
                rows={4}
              />
            </div>

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5" />
                  Temperature
                </Label>
                <span className="text-xs font-mono text-foreground">{config.temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[config.temperature]}
                onValueChange={([v]) => setConfig((c) => ({ ...c, temperature: v }))}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Kesin</span>
                <span>Yaratıcı</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Max Tokens
              </Label>
              <Input
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig((c) => ({ ...c, maxTokens: parseInt(e.target.value) || 0 }))}
                min={1}
                max={32768}
                className="text-sm"
              />
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Top P
                </Label>
                <span className="text-xs font-mono text-foreground">{config.topP.toFixed(1)}</span>
              </div>
              <Slider
                value={[config.topP]}
                onValueChange={([v]) => setConfig((c) => ({ ...c, topP: v }))}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Streaming Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Streaming
              </Label>
              <Switch
                checked={config.streamEnabled}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, streamEnabled: v }))}
              />
            </div>
          </div>

          {/* Config Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setConfig(DEFAULT_CONFIG)}
            >
              Varsayılana Sıfırla
            </Button>
          </div>
        </aside>
      </div>

      {/* Media Jobs Modal */}
      {mediaJobsOpen && thread && (
        <MediaJobsModal
          threadId={thread.id}
          onClose={() => setMediaJobsOpen(false)}
        />
      )}
    </ProtectedRoute>
  )
}
