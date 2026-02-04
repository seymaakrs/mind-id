"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderOpen,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Plus,
  CheckSquare,
  X,
  Bot,
} from "lucide-react";
import { useBusinessMedia, useAgentTask, useJobs } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import {
  MediaCard,
  MediaDetailModal,
  MediaUploadModal,
  AgentModal,
} from "@/components/business/media";
import type { BusinessMedia } from "@/types/firebase";
import type { JobType } from "@/types/jobs";

interface BusinessMediaTabProps {
  businessId: string;
}

export function BusinessMediaTab({ businessId }: BusinessMediaTabProps) {
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<BusinessMedia | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentMedia, setAgentMedia] = useState<BusinessMedia | null>(null);
  const [agentTaskInput, setAgentTaskInput] = useState("");

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BusinessMedia[]>([]);

  const {
    filteredMedia,
    loading: loadingMedia,
    error: mediaError,
    filter,
    imageCount,
    videoCount,
    setFilter,
    loadMedia,
    uploadMedia,
  } = useBusinessMedia();

  const {
    response: agentResponse,
    loading: agentLoading,
    error: agentError,
    progressMessages,
    sendTask,
    reset: resetAgent,
  } = useAgentTask();

  const {
    createJob,
    fetchJobs,
  } = useJobs();

  useEffect(() => {
    if (businessId) {
      loadMedia(businessId);
      // Reset selection when business changes
      setSelectionMode(false);
      setSelectedItems([]);
    }
  }, [businessId, loadMedia]);

  const handleUpload = async (file: File, type: "image" | "video", description: string) => {
    return uploadMedia(file, businessId, type, description);
  };

  const openAgentModal = (media: BusinessMedia, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentMedia(media);
    setAgentTaskInput("");
    resetAgent();
    setAgentModalOpen(true);
  };

  const handleSendToAgent = async (jobType: JobType, scheduledAt?: Date) => {
    if (!businessId) return;

    // Check if bulk or single
    const mediaItems = selectedItems.length > 0 ? selectedItems : agentMedia ? [agentMedia] : [];
    if (mediaItems.length === 0 || !agentTaskInput.trim()) return;

    const taskData = {
      task: agentTaskInput.trim(),
      businessId: businessId,
      createdBy: user?.displayName || user?.email || undefined,
      extras: {
        source_media: mediaItems.map((m) => ({
          id: m.id,
          type: m.type,
          public_url: m.public_url,
          storage_path: m.storage_path,
          file_name: m.file_name,
          prompt_summary: m.prompt_summary,
        })),
      },
    };

    if (jobType === "immediate") {
      // Send immediately
      await sendTask(taskData);

      // Also save to jobs collection for logging
      await createJob(businessId, {
        type: "immediate",
        task: agentTaskInput.trim(),
      });
    } else if (jobType === "planned" && scheduledAt) {
      // Save to jobs collection for scheduled execution
      const jobId = await createJob(businessId, {
        type: "planned",
        task: agentTaskInput.trim(),
        scheduledAt,
      });

      if (jobId) {
        await fetchJobs(businessId);
        // Close modal and clear selection
        setAgentModalOpen(false);
        if (selectedItems.length > 0) {
          setSelectionMode(false);
          setSelectedItems([]);
        }
        alert("Görev başarıyla planlandı.");
      }
    }
  };

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedItems([]);
    } else {
      setSelectionMode(true);
    }
  };

  const handleSelectMedia = (media: BusinessMedia) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== media.id);
      } else {
        return [...prev, media];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredMedia.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredMedia]);
    }
  };

  const openBulkAgentModal = () => {
    if (selectedItems.length === 0) return;
    setAgentMedia(null);
    setAgentTaskInput("");
    resetAgent();
    setAgentModalOpen(true);
  };

  const handleCloseAgentModal = () => {
    setAgentModalOpen(false);
    if (agentResponse && selectedItems.length > 0) {
      setSelectionMode(false);
      setSelectedItems([]);
    }
  };

  const totalMediaCount = imageCount + videoCount;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant={selectionMode ? "default" : "outline"}
          onClick={toggleSelectionMode}
        >
          {selectionMode ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Seçimi İptal
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4 mr-2" />
              Toplu Seç
            </>
          )}
        </Button>
        {!selectionMode && (
          <>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İçerik Ekle
            </Button>
            <Button
              variant="outline"
              onClick={() => loadMedia(businessId)}
              disabled={loadingMedia}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingMedia ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </>
        )}
      </div>

      {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

      {/* Selection Action Bar */}
      {selectionMode && selectedItems.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <span className="font-medium">{selectedItems.length} içerik seçildi</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedItems.length === filteredMedia.length ? "Seçimi Kaldır" : "Tümünü Seç"}
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={openBulkAgentModal}
          >
            <Bot className="w-4 h-4 mr-2" />
            Ajana Gönder ({selectedItems.length})
          </Button>
        </div>
      )}

      {/* Content Area */}
      {loadingMedia ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : totalMediaCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Bu işletme için henüz içerik bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "image" | "video")}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Tümü ({totalMediaCount})
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Görseller ({imageCount})
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="w-4 h-4" />
              Videolar ({videoCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
              {filteredMedia.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onClick={() => setSelectedMedia(media)}
                  onSendToAgent={(e) => openAgentModal(media, e)}
                  selectionMode={selectionMode}
                  isSelected={selectedItems.some((m) => m.id === media.id)}
                  onSelect={handleSelectMedia}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      <MediaDetailModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />

      <MediaUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <AgentModal
        open={agentModalOpen}
        media={agentMedia}
        mediaList={selectedItems.length > 0 ? selectedItems : undefined}
        taskInput={agentTaskInput}
        response={agentResponse}
        loading={agentLoading}
        error={agentError}
        progressMessages={progressMessages}
        onClose={handleCloseAgentModal}
        onTaskInputChange={setAgentTaskInput}
        onSend={handleSendToAgent}
      />
    </div>
  );
}
