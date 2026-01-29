"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  X,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Calendar,
  Repeat,
  Trash2,
  Play,
  Pause,
} from "lucide-react";
import { useBusinesses, useAgentTask, useServerHealth, useJobs } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import type { JobType, IntervalType, Job, PlannedJob, RoutineJob } from "@/types/jobs";
import {
  JOB_TYPE_LABELS,
  INTERVAL_TYPE_LABELS,
  DAY_OF_WEEK_LABELS,
} from "@/types/jobs";

export default function AgentGorevComponent() {
  const [gorev, setGorev] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [jobType, setJobType] = useState<JobType>("immediate");

  // Planned job fields
  const [scheduledDate, setScheduledDate] = useState("");
  const [plannedHour, setPlannedHour] = useState(9);
  const [plannedMinute, setPlannedMinute] = useState(0);

  // Routine job fields
  const [intervalType, setIntervalType] = useState<IntervalType>("daily");
  const [intervalHours, setIntervalHours] = useState(1);
  const [dailyHour, setDailyHour] = useState(9);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [weeklyDay, setWeeklyDay] = useState(1); // Monday

  const { user } = useAuth();
  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const {
    response,
    loading: isSubmitting,
    error,
    progressMessages,
    sendTask,
    cancelTask,
    reset,
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

  // Fetch jobs when business changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchJobs(selectedBusinessId);
    }
  }, [selectedBusinessId, fetchJobs]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedGorev = gorev.trim();
    if (!trimmedGorev || !selectedBusinessId) return;

    if (jobType === "immediate") {
      // Send immediately and also save to jobs collection
      await sendTask({
        task: trimmedGorev,
        businessId: selectedBusinessId,
        createdBy: user?.displayName || user?.email || undefined,
      });

      // Save to jobs collection for logging
      await createJob(selectedBusinessId, {
        type: "immediate",
        task: trimmedGorev,
      });
    } else if (jobType === "planned") {
      if (!scheduledDate) {
        return;
      }

      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(plannedHour, plannedMinute, 0, 0);

      if (scheduledAt <= new Date()) {
        alert("Planlanan tarih/saat gecmis olamaz.");
        return;
      }

      const jobId = await createJob(selectedBusinessId, {
        type: "planned",
        task: trimmedGorev,
        scheduledAt,
      });

      if (jobId) {
        // Explicit refresh after successful creation
        await fetchJobs(selectedBusinessId);
        // Reset form
        setGorev("");
        setScheduledDate("");
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
        // Explicit refresh after successful creation
        await fetchJobs(selectedBusinessId);
        // Reset form
        setGorev("");
      }
    }
  };

  const handleCancel = () => {
    cancelTask();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bu gorevi silmek istediginize emin misiniz?")) return;
    await removeJob(selectedBusinessId, jobId);
  };

  const handleToggleRoutine = async (jobId: string, currentActive: boolean) => {
    await toggleRoutineJob(selectedBusinessId, jobId, !currentActive);
  };

  const getStatusConfig = () => {
    switch (serverStatus) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          label: "Bagli",
        };
      case "disconnected":
      case "error":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          label: "Baglanti yok",
        };
      case "checking":
      default:
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          label: "Kontrol ediliyor...",
        };
    }
  };

  // Helper to convert various date formats to Date object
  const toDateSafe = (value: unknown): Date | null => {
    if (!value) return null;
    // Firestore Timestamp object
    if (typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate();
    }
    // Plain object with seconds (Firestore REST format)
    if (typeof value === "object" && "seconds" in value) {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
    // ISO string or Date
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

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const isFormValid = () => {
    if (!gorev.trim() || !selectedBusinessId) return false;
    if (jobType === "planned" && !scheduledDate) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Agent</h2>
          <p className="text-muted-foreground mt-2">Agenta gondermek istediginiz gorevi yazin.</p>
        </div>

        {/* Server Baglanti Durumu */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 ${statusConfig.bgColor} ${statusConfig.borderColor}`}
        >
          <StatusIcon
            className={`w-4 h-4 ${statusConfig.color} ${serverStatus === "checking" ? "animate-spin" : ""}`}
          />
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            {serverUrl && serverStatus === "connected" && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{serverUrl}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={serverStatus === "checking"}
            className="ml-1 h-6 w-6 p-0"
            title="Yeniden kontrol et"
          >
            <RefreshCw className={`w-3 h-3 ${serverStatus === "checking" ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gorev</CardTitle>
          <CardDescription>Isletme secin ve agenta gondermek istediginiz gorevi girin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Isletme Secimi */}
            <div className="space-y-2">
              <Label>
                Isletme Secin <span className="text-destructive">*</span>
              </Label>
              <BusinessSelector
                businesses={businesses}
                loading={loadingBusinesses}
                selectedId={selectedBusinessId}
                onSelect={setSelectedBusinessId}
                disabled={isSubmitting}
                showPreview
                className="w-full"
              />
            </div>

            {/* Gorev Tipi Secimi */}
            <div className="space-y-2">
              <Label>Gorev Tipi</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant={jobType === "immediate" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setJobType("immediate")}
                  disabled={isSubmitting}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {JOB_TYPE_LABELS.immediate}
                </Button>
                <Button
                  type="button"
                  variant={jobType === "planned" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setJobType("planned")}
                  disabled={isSubmitting}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {JOB_TYPE_LABELS.planned}
                </Button>
                <Button
                  type="button"
                  variant={jobType === "routine" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setJobType("routine")}
                  disabled={isSubmitting}
                >
                  <Repeat className="w-4 h-4 mr-2" />
                  {JOB_TYPE_LABELS.routine}
                </Button>
              </div>
            </div>

            {/* Planned Job Options */}
            {jobType === "planned" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saat</Label>
                  <Select
                    value={String(plannedHour)}
                    onValueChange={(v) => setPlannedHour(Number(v))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dakika</Label>
                  <Select
                    value={String(plannedMinute)}
                    onValueChange={(v) => setPlannedMinute(Number(v))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          :{String(m).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Routine Job Options */}
            {jobType === "routine" && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label>Tekrar Sikligi</Label>
                  <Select
                    value={intervalType}
                    onValueChange={(v) => setIntervalType(v as IntervalType)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{INTERVAL_TYPE_LABELS.hourly}</SelectItem>
                      <SelectItem value="daily">{INTERVAL_TYPE_LABELS.daily}</SelectItem>
                      <SelectItem value="weekly">{INTERVAL_TYPE_LABELS.weekly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {intervalType === "hourly" && (
                  <div className="space-y-2">
                    <Label>Kac saatte bir?</Label>
                    <Select
                      value={String(intervalHours)}
                      onValueChange={(v) => setIntervalHours(Number(v))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            Her {h} saatte bir
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(intervalType === "daily" || intervalType === "weekly") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {intervalType === "weekly" && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Gun</Label>
                        <Select
                          value={String(weeklyDay)}
                          onValueChange={(v) => setWeeklyDay(Number(v))}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Saat</Label>
                      <Select
                        value={String(dailyHour)}
                        onValueChange={(v) => setDailyHour(Number(v))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {String(i).padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dakika</Label>
                      <Select
                        value={String(dailyMinute)}
                        onValueChange={(v) => setDailyMinute(Number(v))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              :{String(m).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gorev Girisi */}
            <div className="space-y-2">
              <Label htmlFor="agent-gorev">
                Agenta gondermek istediginiz gorev <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="agent-gorev"
                placeholder="Orn: Haftalik icerik plani olustur"
                value={gorev}
                onChange={(event) => {
                  setGorev(event.target.value);
                  if (response) reset();
                }}
                rows={5}
                disabled={isSubmitting}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calisiyor...
                  </>
                ) : jobType === "immediate" ? (
                  "Gorevi gonder"
                ) : (
                  "Gorevi kaydet"
                )}
              </Button>
              {isSubmitting && (
                <Button type="button" variant="destructive" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Iptal
                </Button>
              )}
            </div>
          </form>

          {/* Progress Gostergesi */}
          {isSubmitting && progressMessages.length > 0 && (
            <div className="p-3 rounded-md bg-muted font-mono text-xs max-h-[150px] overflow-y-auto space-y-1">
              {progressMessages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive whitespace-pre-wrap break-words" aria-live="polite">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Agent cevabi</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
              {response}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      {selectedBusinessId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Zamanlanmis Gorevler</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchJobs(selectedBusinessId)}
                disabled={loadingJobs}
              >
                <RefreshCw className={`w-4 h-4 ${loadingJobs ? "animate-spin" : ""}`} />
              </Button>
            </CardTitle>
            <CardDescription>Bu isletme icin planlanmis ve rutin gorevler</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsError && (
              <p className="text-sm text-destructive mb-4">{jobsError}</p>
            )}

            {loadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henuz zamanlanmis gorev bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {jobs
                  .filter((job) => job.type !== "immediate")
                  .map((job) => (
                    <div
                      key={job.id}
                      className={`p-4 rounded-lg border ${job.type === "routine" && !(job as RoutineJob).isActive
                          ? "opacity-50"
                          : ""
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={job.type === "planned" ? "default" : "secondary"}
                            >
                              {job.type === "planned" ? (
                                <Calendar className="w-3 h-3 mr-1" />
                              ) : (
                                <Repeat className="w-3 h-3 mr-1" />
                              )}
                              {JOB_TYPE_LABELS[job.type]}
                            </Badge>
                            {job.type === "planned" && (job as PlannedJob).isExecuted && (
                              <Badge variant="outline" className="text-green-500">
                                Tamamlandi
                              </Badge>
                            )}
                            {job.type === "routine" && !(job as RoutineJob).isActive && (
                              <Badge variant="outline">Pasif</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{job.task}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatJobSchedule(job)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {job.type === "routine" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleRoutine(job.id, (job as RoutineJob).isActive)
                              }
                              title={(job as RoutineJob).isActive ? "Duraklat" : "Baslat"}
                            >
                              {(job as RoutineJob).isActive ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
