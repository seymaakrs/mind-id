"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    ListChecks,
    FileText,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    PlayCircle,
    User,
} from "lucide-react";
import { getBusinessTasks, getTaskLogs } from "@/lib/firebase/firestore";
import type { Task, TaskStatus } from "@/types/tasks";
import { TASK_STATUS_LABELS } from "@/types/tasks";
import { LogModal } from "./log-modal";

interface TasksTabProps {
    businessId: string;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    completed: "bg-green-500/20 text-green-400 border-green-500/50",
    failed: "bg-red-500/20 text-red-400 border-red-500/50",
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    running: <PlayCircle className="w-3 h-3" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
};

export function TasksTab({ businessId }: TasksTabProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await getBusinessTasks(businessId);
            // Sort by createdAt descending (newest first)
            const sorted = data.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            setTasks(sorted);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [businessId]);

    const handleViewLogs = async (taskId: string) => {
        setSelectedTaskId(taskId);
        setLogsLoading(true);
        setShowLogModal(true);
        try {
            const logData = await getTaskLogs(businessId, taskId);
            setLogs(logData);
        } catch (error) {
            console.error("Error loading logs:", error);
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const formatDate = (timestamp: { toDate?: () => Date }) => {
        if (!timestamp?.toDate) return "-";
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getTaskTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            immediate: "Hemen",
            planned: "Planlanmış",
            routine: "Rutin",
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ListChecks className="w-5 h-5" />
                            <div>
                                <CardTitle>Görev Geçmişi</CardTitle>
                                <CardDescription>
                                    Çalıştırılan görevlerin listesi ve durumları
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadTasks}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Yenile
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Henüz görev çalıştırılmamış.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge
                                                variant="outline"
                                                className={STATUS_COLORS[task.status]}
                                            >
                                                {STATUS_ICONS[task.status]}
                                                <span className="ml-1">{TASK_STATUS_LABELS[task.status]}</span>
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {getTaskTypeLabel(task.type)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate max-w-md">
                                            {task.task}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                            {task.createdBy && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {task.createdBy}
                                                </span>
                                            )}
                                            <span>Oluşturuldu: {formatDate(task.createdAt)}</span>
                                            {task.completedAt && (
                                                <span>Tamamlandı: {formatDate(task.completedAt)}</span>
                                            )}
                                        </div>
                                        {task.error && (
                                            <p className="text-xs text-red-400 mt-1 truncate max-w-md">
                                                Hata: {task.error}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewLogs(task.id)}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Logu Gör
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <LogModal
                open={showLogModal}
                onOpenChange={setShowLogModal}
                taskId={selectedTaskId}
                logs={logs}
                loading={logsLoading}
            />
        </>
    );
}
