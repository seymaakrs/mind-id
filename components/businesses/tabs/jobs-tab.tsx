"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  Calendar,
  Repeat,
  Trash2,
  Play,
  Pause,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useJobs } from "@/hooks";
import type { Job, PlannedJob, RoutineJob } from "@/types/jobs";
import { JOB_TYPE_LABELS, DAY_OF_WEEK_LABELS } from "@/types/jobs";

interface JobsTabProps {
  businessId: string;
}

export function JobsTab({ businessId }: JobsTabProps) {
  const {
    jobs,
    loading,
    error,
    fetchJobs,
    toggleRoutineJob,
    removeJob,
  } = useJobs();

  useEffect(() => {
    if (businessId) {
      fetchJobs(businessId);
    }
  }, [businessId, fetchJobs]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bu gorevi silmek istediginize emin misiniz?")) return;
    await removeJob(businessId, jobId);
  };

  const handleToggleRoutine = async (jobId: string, currentActive: boolean) => {
    await toggleRoutineJob(businessId, jobId, !currentActive);
  };

  const formatJobSchedule = (job: Job) => {
    if (job.type === "planned") {
      const pJob = job as PlannedJob;
      const date = pJob.scheduledAt?.toDate();
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

  const formatLastExecuted = (job: Job) => {
    if (job.type === "routine") {
      const rJob = job as RoutineJob;
      if (rJob.lastExecutedAt) {
        return rJob.lastExecutedAt.toDate().toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "Henuz calistirilmadi";
    } else if (job.type === "planned") {
      const pJob = job as PlannedJob;
      if (pJob.executedAt) {
        return pJob.executedAt.toDate().toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return null;
  };

  // Separate jobs by type
  const plannedJobs = jobs.filter((job) => job.type === "planned") as PlannedJob[];
  const routineJobs = jobs.filter((job) => job.type === "routine") as RoutineJob[];
  const immediateJobs = jobs.filter((job) => job.type === "immediate");

  const pendingPlannedJobs = plannedJobs.filter((job) => !job.isExecuted);
  const completedPlannedJobs = plannedJobs.filter((job) => job.isExecuted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Zamanlanmis Gorevler</h3>
          <p className="text-sm text-muted-foreground">
            Bu isletme icin tanimli gorevler
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchJobs(businessId)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Bu isletme icin henuz gorev tanimlanmamis.</p>
            <p className="text-sm mt-2">Agent sayfasindan gorev ekleyebilirsiniz.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Routine Jobs */}
          {routineJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Rutin Gorevler
                </CardTitle>
                <CardDescription>
                  Duzenli olarak tekrarlanan gorevler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {routineJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-4 rounded-lg border ${!job.isActive ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            <Repeat className="w-3 h-3 mr-1" />
                            {JOB_TYPE_LABELS.routine}
                          </Badge>
                          {!job.isActive && (
                            <Badge variant="outline">Pasif</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{job.task}</p>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                          <span>Zamanlama: {formatJobSchedule(job)}</span>
                          <span>Son calisma: {formatLastExecuted(job)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRoutine(job.id, job.isActive)}
                          title={job.isActive ? "Duraklat" : "Baslat"}
                        >
                          {job.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
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
              </CardContent>
            </Card>
          )}

          {/* Pending Planned Jobs */}
          {pendingPlannedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Bekleyen Planlanmis Gorevler
                </CardTitle>
                <CardDescription>
                  Henuz calistirilmamis planlanmis gorevler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingPlannedJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>
                            <Calendar className="w-3 h-3 mr-1" />
                            {JOB_TYPE_LABELS.planned}
                          </Badge>
                          <Badge variant="outline" className="text-yellow-500">
                            Bekliyor
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{job.task}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Zamanlama: {formatJobSchedule(job)}
                        </p>
                      </div>
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
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Planned Jobs */}
          {completedPlannedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Tamamlanan Planlanmis Gorevler
                </CardTitle>
                <CardDescription>
                  Basariyla calistirilmis gorevler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedPlannedJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {JOB_TYPE_LABELS.planned}
                          </Badge>
                          <Badge variant="outline" className="text-green-500">
                            Tamamlandi
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{job.task}</p>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                          <span>Planlanan: {formatJobSchedule(job)}</span>
                          <span>Calistirildi: {formatLastExecuted(job)}</span>
                        </div>
                      </div>
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
                ))}
              </CardContent>
            </Card>
          )}

          {/* Immediate Jobs (History) */}
          {immediateJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Anlik Gorev Gecmisi
                </CardTitle>
                <CardDescription>
                  Hemen calistirilan gorevlerin kayitlari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {immediateJobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {JOB_TYPE_LABELS.immediate}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{job.task}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {job.createdAt?.toDate().toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
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
                ))}
                {immediateJobs.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ve {immediateJobs.length - 10} gorev daha...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
