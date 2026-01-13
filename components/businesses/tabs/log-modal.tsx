"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileJson } from "lucide-react";

interface LogModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string | null;
    logs: Record<string, unknown>[];
    loading: boolean;
}

export function LogModal({ open, onOpenChange, taskId, logs, loading }: LogModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5" />
                        Görev Logları
                    </DialogTitle>
                    <DialogDescription>
                        Task ID: {taskId || "-"}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Bu görev için log bulunamadı.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[50vh]">
                        <div className="space-y-4">
                            {logs.map((log, index) => (
                                <div key={log.id as string || index} className="rounded-lg border bg-muted/50 p-4">
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono">
                                        {JSON.stringify(log, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
