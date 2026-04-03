"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Send,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Calendar,
  Repeat,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  User,
  ListTodo,
  Settings2,
  Workflow,
  MessageSquare,
  History,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useBusinesses, useAgentTask, useServerHealth, useJobs } from "@/hooks";
import { WorkflowVisualization } from "@/components/workflow/WorkflowVisualization";
import { useAuth } from "@/contexts/AuthContext";
import { getBusinessTasks } from "@/lib/firebase/firestore";
import { useReferenceQueue } from "@/contexts/ReferenceQueueContext";
import { ReferenceTray } from "@/components/agent/ReferenceTray";
import { ReferencePickerDialog } from "@/components/agent/ReferencePickerDialog";
import { CapabilitiesPanel } from "@/components/agent/CapabilitiesPanel";
import type { ReferenceType } from "@/types/references";
import type { Task } from "@/types/tasks";
import type { JobType, IntervalType, Job, PlannedJob, RoutineJob } from "@/types/jobs";
import {
  JOB_TYPE_LABELS,
  INTERVAL_TYPE_LABELS,
  DAY_OF_WEEK_LABELS,
} from "@/types/jobs";

// Chat message types
type ChatMessage = {
  id: string;
  role: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  isProgress?: boolean;
  isError?: boolean;
  jobType?: JobType;
  jobSchedule?: string;
  attachedRefs?: Array<{ type: string; label: string | null }>;
};

type ViewMode = "chat-only" | "split" | "workflow-only";

interface AgentGorevProps {
  sidebarCollapsed?: boolean;
  onSidebarCollapse?: (collapsed: boolean) => void;
  initialBusinessId?: string;
  initialTask?: string;
}

export default function AgentGorevComponent({
  sidebarCollapsed,
  onSidebarCollapse,
  initialBusinessId,
  initialTask,
}: AgentGorevProps) {
  const [gorev, setGorev] = useState(initialTask ?? "");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(initialBusinessId ?? "");
  const [jobType, setJobType] = useState<JobType>("immediate");
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [showJobsList, setShowJobsList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("chat-only");
  const [mobileTab, setMobileTab] = useState<"chat" | "workflow">("chat");
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(null);

  // Planned job fields
  const [scheduledDate, setScheduledDate] = useState("");
  const [plannedHour, setPlannedHour] = useState(9);
  const [plannedMinute, setPlannedMinute] = useState(0);

  // Routine job fields
  const [intervalType, setIntervalType] = useState<IntervalType>("daily");
  const [intervalHours, setIntervalHours] = useState(1);
  const [dailyHour, setDailyHour] = useState(9);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [weeklyDay, setWeeklyDay] = useState(1);

  const { user } = useAuth();
  const { removeReference, clearBusinessReferences, getBusinessReferences } = useReferenceQueue();
  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const {
    response,
    loading: isSubmitting,
    error,
    progressMessages,
    sendTask,
    cancelTask,
    reset,
    currentTaskId,
    threadId,
  } = useAgentTask();
  const { status: serverStatus, serverUrl, checkHealth } = useServerHealth();
  const {
    jobs,
    loading: loadingJobs,
    error: jobsError,
    fetchJobs,
    createJob,
    toggleRoutineJob,
    removeJob,
  } = useJobs();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevProgressCountRef = useRef(0);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch jobs when business changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchJobs(selectedBusinessId);
      // Reset conversation thread when switching businesses
      setConversationThreadId(null);
    }
  }, [selectedBusinessId, fetchJobs]);

  // Fetch history when panel opens or business changes
  useEffect(() => {
    if (showHistory && selectedBusinessId) {
      fetchHistory(selectedBusinessId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, selectedBusinessId]);

  // Auto-switch to split view when task starts streaming (desktop only)
  useEffect(() => {
    if (isSubmitting && progressMessages.length > 0 && viewMode === "chat-only") {
      // Only auto-switch on desktop
      if (window.innerWidth >= 768) {
        setViewMode("split");
        onSidebarCollapse?.(true);
      } else {
        setMobileTab("workflow");
      }
    }
  }, [isSubmitting, progressMessages.length, viewMode, onSidebarCollapse]);

  // Track progress count for auto-switch (no longer adding to chat)
  useEffect(() => {
    prevProgressCountRef.current = progressMessages.length;
  }, [progressMessages]);

  // Add response to chat
  useEffect(() => {
    if (response) {
      setMessages((prev) => [
        ...prev,
        {
          id: `response-${Date.now()}`,
          role: "bot",
          content: response,
          timestamp: new Date(),
        },
      ]);
    }
  }, [response]);

  // Update conversation thread ID when task completes
  useEffect(() => {
    if (threadId) {
      setConversationThreadId(threadId);
    }
  }, [threadId]);

  // Add error to chat
  useEffect(() => {
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "bot",
          content: error,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    }
  }, [error]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const trimmedGorev = gorev.trim();
    if (!trimmedGorev || !selectedBusinessId) return;

    // Add user message to chat
    const currentRefs = getBusinessReferences(selectedBusinessId);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedGorev,
      timestamp: new Date(),
      jobType,
      attachedRefs: currentRefs.length > 0
        ? currentRefs.map((r) => ({ type: r.type, label: r.label ?? null }))
        : undefined,
    };

    if (jobType === "planned") {
      userMsg.jobSchedule = `${scheduledDate} ${String(plannedHour).padStart(2, "0")}:${String(plannedMinute).padStart(2, "0")}`;
    } else if (jobType === "routine") {
      userMsg.jobSchedule = formatIntervalLabel();
    }

    setMessages((prev) => [...prev, userMsg]);
    setGorev("");
    prevProgressCountRef.current = 0;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (jobType === "immediate") {
      reset();
      const currentRefs = getBusinessReferences(selectedBusinessId);
      await sendTask({
        task: trimmedGorev,
        businessId: selectedBusinessId,
        createdBy: user?.displayName || user?.email || undefined,
        threadId: conversationThreadId || undefined,
        references: currentRefs.length > 0
          ? currentRefs.map((r) => ({ type: r.type, id: r.id, url: r.url, label: r.label }))
          : undefined,
      });
      if (currentRefs.length > 0) {
        clearBusinessReferences(selectedBusinessId);
      }

      await createJob(selectedBusinessId, {
        type: "immediate",
        task: trimmedGorev,
      });
    } else if (jobType === "planned") {
      if (!scheduledDate) return;

      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(plannedHour, plannedMinute, 0, 0);

      if (scheduledAt <= new Date()) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "bot",
            content: "Planlanan tarih/saat gecmis olamaz.",
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      const jobId = await createJob(selectedBusinessId, {
        type: "planned",
        task: trimmedGorev,
        scheduledAt,
      });

      if (jobId) {
        await fetchJobs(selectedBusinessId);
        setScheduledDate("");
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            role: "bot",
            content: `Gorev basariyla planlandi: ${scheduledAt.toLocaleString("tr-TR")}`,
            timestamp: new Date(),
          },
        ]);
      }
    } else if (jobType === "routine") {
      const intervalConfig: RoutineJob["intervalConfig"] = {};

      if (intervalType === "hourly") {
        intervalConfig.hours = intervalHours;
      } else if (intervalType === "daily") {
        intervalConfig.hour = dailyHour;
        intervalConfig.minute = dailyMinute;
      } else if (intervalType === "weekly") {
        intervalConfig.hour = dailyHour;
        intervalConfig.minute = dailyMinute;
        intervalConfig.dayOfWeek = weeklyDay;
      }

      const jobId = await createJob(selectedBusinessId, {
        type: "routine",
        task: trimmedGorev,
        intervalType,
        intervalConfig,
      });

      if (jobId) {
        await fetchJobs(selectedBusinessId);
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            role: "bot",
            content: `Rutin gorev olusturuldu: ${formatIntervalLabel()}`,
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    cancelTask();
    setMessages((prev) => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: "system",
        content: "Gorev iptal edildi.",
        timestamp: new Date(),
      },
    ]);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bu gorevi silmek istediginize emin misiniz?")) return;
    await removeJob(selectedBusinessId, jobId);
  };

  const handleToggleRoutine = async (jobId: string, currentActive: boolean) => {
    await toggleRoutineJob(selectedBusinessId, jobId, !currentActive);
  };

  const fetchHistory = async (businessId: string) => {
    if (!businessId) return;
    setLoadingHistory(true);
    try {
      const tasks = await getBusinessTasks(businessId);
      const sorted = tasks
        .filter((t) => t.status === "completed" || t.status === "failed")
        .sort((a, b) => {
          const aTime = toDateSafe(a.createdAt)?.getTime() ?? 0;
          const bTime = toDateSafe(b.createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        });
      setHistoryTasks(sorted);
    } catch {
      setHistoryTasks([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadHistoryItem = (task: Task) => {
    const userMsg: ChatMessage = {
      id: `hist-user-${task.id}`,
      role: "user",
      content: task.task,
      timestamp: toDateSafe(task.createdAt) ?? new Date(),
      jobType: task.type,
    };
    const botMsg: ChatMessage = {
      id: `hist-bot-${task.id}`,
      role: "bot",
      content: task.result || task.error || "Sonuc bulunamadi.",
      timestamp: toDateSafe(task.completedAt ?? task.createdAt) ?? new Date(),
      isError: task.status === "failed",
    };
    setMessages([userMsg, botMsg]);
    setShowHistory(false);
  };

  const formatIntervalLabel = () => {
    if (intervalType === "hourly") return `Her ${intervalHours} saatte bir`;
    if (intervalType === "daily")
      return `Her gun saat ${String(dailyHour).padStart(2, "0")}:${String(dailyMinute).padStart(2, "0")}`;
    if (intervalType === "weekly")
      return `Her ${DAY_OF_WEEK_LABELS[weeklyDay]} saat ${String(dailyHour).padStart(2, "0")}:${String(dailyMinute).padStart(2, "0")}`;
    return "";
  };

  // Helper to convert various date formats to Date object
  const toDateSafe = (value: unknown): Date | null => {
    if (!value) return null;
    if (
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === "object" && "seconds" in value) {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
    if (typeof value === "string" || value instanceof Date) {
      return new Date(value as string | Date);
    }
    return null;
  };

  const formatJobSchedule = (job: Job) => {
    if (job.type === "planned") {
      const pJob = job as PlannedJob;
      const date = toDateSafe(pJob.scheduledAt);
      if (date) {
        return date.toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } else if (job.type === "routine") {
      const rJob = job as RoutineJob;
      if (rJob.intervalType === "hourly") {
        return `Her ${rJob.intervalConfig.hours} saatte bir`;
      } else if (rJob.intervalType === "daily") {
        return `Her gun saat ${String(rJob.intervalConfig.hour).padStart(2, "0")}:${String(rJob.intervalConfig.minute).padStart(2, "0")}`;
      } else if (rJob.intervalType === "weekly") {
        return `Her ${DAY_OF_WEEK_LABELS[rJob.intervalConfig.dayOfWeek || 0]} saat ${String(rJob.intervalConfig.hour).padStart(2, "0")}:${String(rJob.intervalConfig.minute).padStart(2, "0")}`;
      }
    }
    return "-";
  };

  const getStatusConfig = () => {
    switch (serverStatus) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          label: "Bagli",
        };
      case "disconnected":
      case "error":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          label: "Baglanti yok",
        };
      case "checking":
      default:
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          label: "Kontrol ediliyor...",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const isFormValid = () => {
    if (!gorev.trim() || !selectedBusinessId) return false;
    if (jobType === "planned" && !scheduledDate) return false;
    return true;
  };

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
  const scheduledJobs = jobs.filter((job) => job.type !== "immediate");

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGorev(e.target.value);
    if (response) reset();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  // Chat area JSX (as variable, not component, to avoid remount on re-render)
  const chatArea = (
      <>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-24 h-24 mb-4 flex items-center justify-center overflow-hidden">
                  <Image src="/mindbot.png" alt="MindBot" width={96} height={96} className="object-contain" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Merhaba! Ben MindBot</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  {selectedBusinessId
                    ? `${selectedBusiness?.name || "Secili isletme"} icin bir gorev yazin. Hemen calistirmak, planlamak veya rutin olarak ayarlamak sizin elinizde.`
                    : "Baslamak icin yukari sagdan bir isletme secin, sonra gorev yazin."}
                </p>
                {selectedBusinessId && (
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    <button
                      onClick={() => {
                        setGorev("Haftalik icerik plani olustur");
                        textareaRef.current?.focus();
                      }}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      Haftalik icerik plani olustur
                    </button>
                    <button
                      onClick={() => {
                        setGorev("Rakip analizi yap");
                        textareaRef.current?.focus();
                      }}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      Rakip analizi yap
                    </button>
                    <button
                      onClick={() => {
                        setGorev("SEO raporu hazirla");
                        textareaRef.current?.focus();
                      }}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      SEO raporu hazirla
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 px-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {msg.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                      <Image src="/mindbot.png" alt="MindBot" width={40} height={40} className="object-contain" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : msg.isError
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                        : msg.isProgress
                          ? "bg-muted/50 text-muted-foreground rounded-tl-sm text-sm"
                          : msg.role === "system"
                            ? "bg-muted/50 text-muted-foreground rounded-tl-sm italic text-sm"
                            : "bg-muted rounded-tl-sm"
                  }`}
                >
                  {/* Job type badge for user messages */}
                  {msg.role === "user" && msg.jobType && msg.jobType !== "immediate" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge variant="secondary" className="text-[10px] h-5 bg-primary-foreground/20 text-primary-foreground">
                        {msg.jobType === "planned" && <Calendar className="w-3 h-3 mr-1" />}
                        {msg.jobType === "routine" && <Repeat className="w-3 h-3 mr-1" />}
                        {JOB_TYPE_LABELS[msg.jobType]}
                      </Badge>
                      {msg.jobSchedule && (
                        <span className="text-[10px] opacity-80">{msg.jobSchedule}</span>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                  {/* Attached references */}
                  {msg.role === "user" && msg.attachedRefs && msg.attachedRefs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.attachedRefs.map((ref, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px]"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          {ref.label ?? ref.type}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator - shown while task is running */}
            {isSubmitting && (
              <div className="flex gap-3 px-2">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                  <Image src="/mindbot.png" alt="MindBot" width={40} height={40} className="object-contain" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    {progressMessages.length > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-1">Calisiyor...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border pt-3 pb-1 shrink-0">
            {/* Job Type & Schedule Options */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => { setJobType("immediate"); setShowScheduleOptions(false); }}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${jobType === "immediate" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  disabled={isSubmitting}
                >
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">{JOB_TYPE_LABELS.immediate}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setJobType("planned"); setShowScheduleOptions(true); }}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors border-x border-border ${jobType === "planned" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  disabled={isSubmitting}
                >
                  <Calendar className="w-3 h-3" />
                  <span className="hidden sm:inline">{JOB_TYPE_LABELS.planned}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setJobType("routine"); setShowScheduleOptions(true); }}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${jobType === "routine" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  disabled={isSubmitting}
                >
                  <Repeat className="w-3 h-3" />
                  <span className="hidden sm:inline">{JOB_TYPE_LABELS.routine}</span>
                </button>
              </div>

              {(jobType === "planned" || jobType === "routine") && (
                <button
                  type="button"
                  onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Zamanlama</span>
                  {showScheduleOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Schedule Options (collapsible) */}
            {showScheduleOptions && jobType === "planned" && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border mx-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tarih</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      disabled={isSubmitting}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Saat</Label>
                    <Select value={String(plannedHour)} onValueChange={(v) => setPlannedHour(Number(v))} disabled={isSubmitting}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dakika</Label>
                    <Select value={String(plannedMinute)} onValueChange={(v) => setPlannedMinute(Number(v))} disabled={isSubmitting}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((m) => (
                          <SelectItem key={m} value={String(m)}>:{String(m).padStart(2, "0")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {showScheduleOptions && jobType === "routine" && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border mx-1 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tekrar Sikligi</Label>
                  <Select value={intervalType} onValueChange={(v) => setIntervalType(v as IntervalType)} disabled={isSubmitting}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{INTERVAL_TYPE_LABELS.hourly}</SelectItem>
                      <SelectItem value="daily">{INTERVAL_TYPE_LABELS.daily}</SelectItem>
                      <SelectItem value="weekly">{INTERVAL_TYPE_LABELS.weekly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {intervalType === "hourly" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Kac saatte bir?</Label>
                    <Select value={String(intervalHours)} onValueChange={(v) => setIntervalHours(Number(v))} disabled={isSubmitting}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                          <SelectItem key={h} value={String(h)}>Her {h} saatte bir</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(intervalType === "daily" || intervalType === "weekly") && (
                  <div className="grid grid-cols-2 gap-3">
                    {intervalType === "weekly" && (
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Gun</Label>
                        <Select value={String(weeklyDay)} onValueChange={(v) => setWeeklyDay(Number(v))} disabled={isSubmitting}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Saat</Label>
                      <Select value={String(dailyHour)} onValueChange={(v) => setDailyHour(Number(v))} disabled={isSubmitting}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dakika</Label>
                      <Select value={String(dailyMinute)} onValueChange={(v) => setDailyMinute(Number(v))} disabled={isSubmitting}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map((m) => (
                            <SelectItem key={m} value={String(m)}>:{String(m).padStart(2, "0")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reference Tray */}
            {selectedBusinessId && (getBusinessReferences(selectedBusinessId).length > 0 || !isSubmitting) && (
              <ReferenceTray
                references={getBusinessReferences(selectedBusinessId)}
                onRemove={(type: ReferenceType, id: string) => removeReference(type, id)}
                onAddClick={() => setPickerOpen(true)}
                disabled={isSubmitting}
              />
            )}

            {/* Text Input + Send */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-end gap-2 px-1">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder={
                    !selectedBusinessId
                      ? "Once bir isletme secin..."
                      : jobType === "immediate"
                        ? "MindBot'a bir gorev yazin..."
                        : jobType === "planned"
                          ? "Planlanacak gorevi yazin..."
                          : "Rutin gorev tanimlayin..."
                  }
                  value={gorev}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isSubmitting || !selectedBusinessId}
                  className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ maxHeight: "150px" }}
                />
              </div>

              {isSubmitting ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                  onClick={handleCancel}
                  title="Iptal"
                >
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                  disabled={!isFormValid()}
                  title={jobType === "immediate" ? "Gorevi gonder" : "Gorevi kaydet"}
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </form>

            <p className="text-[10px] text-muted-foreground text-center mt-1.5 px-1">
              Enter ile gonder, Shift+Enter ile yeni satir
            </p>
          </div>
        </div>

        {/* History Side Panel */}
        {showHistory && selectedBusinessId && (
          <div className="w-80 border-l border-border ml-0 pl-4 overflow-y-auto shrink-0 hidden md:block">
            <div className="flex items-center justify-between py-2 mb-3">
              <h3 className="text-sm font-semibold">Gecmis Sohbetler</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchHistory(selectedBusinessId)}
                  disabled={loadingHistory}
                  className="h-7 w-7 p-0"
                  title="Yenile"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : historyTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Henuz tamamlanmis gorev yok.
              </p>
            ) : (
              <div className="space-y-2">
                {historyTasks.map((task) => {
                  const createdDate = toDateSafe(task.createdAt);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge
                          variant={task.status === "completed" ? "outline" : "destructive"}
                          className={`text-[10px] h-5 ${task.status === "completed" ? "text-green-500 border-green-500/30" : ""}`}
                        >
                          {task.status === "completed" ? "Tamamlandi" : "Basarisiz"}
                        </Badge>
                        {createdDate && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {createdDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 mb-1">{task.task}</p>
                      {task.result && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{task.result}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 w-full justify-start gap-1"
                        onClick={() => loadHistoryItem(task)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Sohbete yukle
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scheduled Jobs Side Panel */}
        {showJobsList && selectedBusinessId && (
          <div className="w-72 border-l border-border ml-0 pl-4 overflow-y-auto shrink-0 hidden md:block">
            <div className="flex items-center justify-between py-2 mb-3">
              <h3 className="text-sm font-semibold">Zamanlanmis Gorevler</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchJobs(selectedBusinessId)}
                  disabled={loadingJobs}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingJobs ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJobsList(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {jobsError && (
              <p className="text-xs text-destructive mb-3">{jobsError}</p>
            )}

            {loadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : scheduledJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Henuz zamanlanmis gorev yok.
              </p>
            ) : (
              <div className="space-y-2">
                {scheduledJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-3 rounded-lg border border-border text-sm ${
                      job.type === "routine" && !(job as RoutineJob).isActive ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge
                        variant={job.type === "planned" ? "default" : "secondary"}
                        className="text-[10px] h-5"
                      >
                        {job.type === "planned" ? (
                          <Calendar className="w-3 h-3 mr-1" />
                        ) : (
                          <Repeat className="w-3 h-3 mr-1" />
                        )}
                        {JOB_TYPE_LABELS[job.type]}
                      </Badge>
                      {job.type === "planned" && (job as PlannedJob).isExecuted && (
                        <Badge variant="outline" className="text-[10px] h-5 text-green-500">
                          Tamamlandi
                        </Badge>
                      )}
                      {job.type === "routine" && !(job as RoutineJob).isActive && (
                        <Badge variant="outline" className="text-[10px] h-5">Pasif</Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate mb-1">{job.task}</p>
                    <p className="text-[10px] text-muted-foreground">{formatJobSchedule(job)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {job.type === "routine" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleToggleRoutine(job.id, (job as RoutineJob).isActive)}
                          title={(job as RoutineJob).isActive ? "Duraklat" : "Baslat"}
                        >
                          {(job as RoutineJob).isActive ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full px-4 md:px-6 py-3">
      {/* Chat Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border shrink-0 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
            <Image src="/mindbot.png" alt="MindBot" width={40} height={40} className="object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">MindBot</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${serverStatus === "connected" ? "bg-green-500" : serverStatus === "checking" ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs text-muted-foreground">{statusConfig.label}</span>
              {serverStatus !== "checking" && (
                <button onClick={checkHealth} className="text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <CapabilitiesPanel
            onExampleClick={(example) => {
              setGorev(example);
              textareaRef.current?.focus();
            }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Business Selector - Compact */}
          {loadingBusinesses ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : businesses.length > 0 ? (
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId} disabled={isSubmitting}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Isletme sec" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    <div className="flex items-center gap-2">
                      {business.logo && (
                        <img src={business.logo} alt="" className="w-4 h-4 rounded object-contain" />
                      )}
                      <span className="truncate">{business.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">Isletme yok</span>
          )}

          {/* Workflow Toggle */}
          <Button
            variant={viewMode !== "chat-only" ? "secondary" : "ghost"}
            size="sm"
            className="h-9"
            onClick={() => {
              if (viewMode === "chat-only") {
                setViewMode("split");
                onSidebarCollapse?.(true);
              } else if (viewMode === "split") {
                setViewMode("workflow-only");
              } else {
                setViewMode("chat-only");
                onSidebarCollapse?.(false);
              }
            }}
            title="Is Akisi"
          >
            <Workflow className="w-4 h-4" />
            <span className="hidden sm:inline ml-1 text-xs">
              {viewMode === "chat-only" ? "Is Akisi" : viewMode === "split" ? "Tam Ekran" : "Sohbet"}
            </span>
          </Button>

          {/* Scheduled Jobs Toggle */}
          {selectedBusinessId && (
            <Button
              variant={showJobsList ? "secondary" : "ghost"}
              size="sm"
              className="h-9 relative"
              onClick={() => { setShowJobsList(!showJobsList); setShowHistory(false); }}
              title="Zamanlanmis gorevler"
            >
              <ListTodo className="w-4 h-4" />
              {scheduledJobs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {scheduledJobs.length}
                </span>
              )}
            </Button>
          )}

          {/* History Toggle */}
          {selectedBusinessId && (
            <Button
              variant={showHistory ? "secondary" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => { setShowHistory(!showHistory); setShowJobsList(false); }}
              title="Gecmis sohbetler"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline ml-1 text-xs">Gecmis</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Tab Toggle */}
      {viewMode !== "chat-only" && (
        <div className="flex md:hidden border-b border-border shrink-0">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === "chat" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Sohbet
          </button>
          <button
            onClick={() => setMobileTab("workflow")}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === "workflow" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Is Akisi
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Workflow-only mode */}
        {viewMode === "workflow-only" && (
          <div className="flex-1 min-h-0 hidden md:block">
            <WorkflowVisualization taskId={currentTaskId} />
          </div>
        )}

        {/* Split mode - desktop */}
        {viewMode === "split" && (
          <PanelGroup direction="horizontal" className="hidden md:flex min-h-0">
            <Panel defaultSize={40} minSize={25}>
              <div className="flex flex-col h-full min-h-0 overflow-hidden">
                {chatArea}
              </div>
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors" />
            <Panel defaultSize={60} minSize={30}>
              <WorkflowVisualization taskId={currentTaskId} />
            </Panel>
          </PanelGroup>
        )}

        {/* Mobile workflow tab */}
        {viewMode !== "chat-only" && mobileTab === "workflow" && (
          <div className="flex md:hidden flex-1 min-h-0">
            <WorkflowVisualization taskId={currentTaskId} />
          </div>
        )}

        {/* Chat area: shown in chat-only mode, or mobile chat tab when in split/workflow-only */}
        {(viewMode === "chat-only" || mobileTab === "chat") && (
          <div className={`flex-1 flex overflow-hidden min-h-0 ${viewMode !== "chat-only" ? "md:hidden" : ""}`}>
            {chatArea}
          </div>
        )}
      </div>

      {/* Mobile Jobs Panel (shown as bottom sheet on mobile) */}
      {showJobsList && selectedBusinessId && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-2xl max-h-[60vh] overflow-y-auto p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Zamanlanmis Gorevler</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchJobs(selectedBusinessId)}
                disabled={loadingJobs}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={`w-3 h-3 ${loadingJobs ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJobsList(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {loadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : scheduledJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Henuz zamanlanmis gorev yok.
            </p>
          ) : (
            <div className="space-y-2">
              {scheduledJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-3 rounded-lg border border-border text-sm ${
                    job.type === "routine" && !(job as RoutineJob).isActive ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={job.type === "planned" ? "default" : "secondary"}
                          className="text-[10px] h-5"
                        >
                          {job.type === "planned" ? <Calendar className="w-3 h-3 mr-1" /> : <Repeat className="w-3 h-3 mr-1" />}
                          {JOB_TYPE_LABELS[job.type]}
                        </Badge>
                        {job.type === "planned" && (job as PlannedJob).isExecuted && (
                          <Badge variant="outline" className="text-[10px] h-5 text-green-500">Tamamlandi</Badge>
                        )}
                        {job.type === "routine" && !(job as RoutineJob).isActive && (
                          <Badge variant="outline" className="text-[10px] h-5">Pasif</Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{job.task}</p>
                      <p className="text-[10px] text-muted-foreground">{formatJobSchedule(job)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {job.type === "routine" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleToggleRoutine(job.id, (job as RoutineJob).isActive)}
                        >
                          {(job as RoutineJob).isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile History Panel (bottom sheet) */}
      {showHistory && selectedBusinessId && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Gecmis Sohbetler</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistory(selectedBusinessId)}
                disabled={loadingHistory}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : historyTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Henuz tamamlanmis gorev yok.
            </p>
          ) : (
            <div className="space-y-2">
              {historyTasks.map((task) => {
                const createdDate = toDateSafe(task.createdAt);
                return (
                  <div key={task.id} className="p-3 rounded-lg border border-border text-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge
                        variant={task.status === "completed" ? "outline" : "destructive"}
                        className={`text-[10px] h-5 ${task.status === "completed" ? "text-green-500 border-green-500/30" : ""}`}
                      >
                        {task.status === "completed" ? "Tamamlandi" : "Basarisiz"}
                      </Badge>
                      {createdDate && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {createdDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2 mb-1">{task.task}</p>
                    {task.result && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{task.result}</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 w-full justify-start gap-1"
                      onClick={() => loadHistoryItem(task)}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Sohbete yukle
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reference Picker Dialog */}
      {selectedBusinessId && (
        <ReferencePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          businessId={selectedBusinessId}
        />
      )}
    </div>
  );
}
