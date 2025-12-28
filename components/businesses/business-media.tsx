"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderOpen,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Plus,
} from "lucide-react";
import { useBusinesses, useBusinessMedia, useAgentTask } from "@/hooks";
import {
  MediaCard,
  MediaDetailModal,
  MediaUploadModal,
  AgentModal,
} from "@/components/business/media";
import type { BusinessMedia } from "@/types/firebase";

export default function BusinessMediaComponent() {
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<BusinessMedia | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentMedia, setAgentMedia] = useState<BusinessMedia | null>(null);
  const [agentTaskInput, setAgentTaskInput] = useState("");

  // Hooks
  const { businesses, loading: loadingBusinesses } = useBusinesses();
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
    sendTask,
    reset: resetAgent,
  } = useAgentTask();

  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    loadMedia(businessId);
  };

  const handleUpload = async (file: File, type: "image" | "video", description: string) => {
    return uploadMedia(file, selectedBusinessId, type, description);
  };

  const openAgentModal = (media: BusinessMedia, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentMedia(media);
    setAgentTaskInput("");
    resetAgent();
    setAgentModalOpen(true);
  };

  const handleSendToAgent = async () => {
    if (!agentMedia || !agentTaskInput.trim() || !selectedBusinessId) return;

    await sendTask({
      task: agentTaskInput.trim(),
      businessId: selectedBusinessId,
      extras: {
        source_media: {
          id: agentMedia.id,
          type: agentMedia.type,
          public_url: agentMedia.public_url,
          storage_path: agentMedia.storage_path,
          file_name: agentMedia.file_name,
          prompt_summary: agentMedia.prompt_summary,
        },
      },
    });
  };

  const totalMediaCount = imageCount + videoCount;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">İşletme İçerikleri</h2>
            <p className="text-muted-foreground">
              İşletmelere ait üretilen görseller ve videolar
            </p>
          </div>
        </div>
        {selectedBusinessId && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İçerik Ekle
            </Button>
            <Button
              variant="outline"
              onClick={() => loadMedia(selectedBusinessId)}
              disabled={loadingMedia}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingMedia ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
        )}
      </div>

      {/* Business Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">İşletme Seçin:</label>
            {loadingBusinesses ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Yükleniyor...</span>
              </div>
            ) : (
              <Select value={selectedBusinessId} onValueChange={handleBusinessChange}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Bir işletme seçin" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex items-center gap-2">
                        {b.logo && (
                          <img src={b.logo} alt="" className="w-5 h-5 rounded object-contain" />
                        )}
                        {b.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

      {/* Content Area */}
      {selectedBusinessId && (
        <>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-hidden">
                  {filteredMedia.map((media) => (
                    <MediaCard
                      key={media.id}
                      media={media}
                      onClick={() => setSelectedMedia(media)}
                      onSendToAgent={(e) => openAgentModal(media, e)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </>
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
        taskInput={agentTaskInput}
        response={agentResponse}
        loading={agentLoading}
        error={agentError}
        onClose={() => setAgentModalOpen(false)}
        onTaskInputChange={setAgentTaskInput}
        onSend={handleSendToAgent}
      />
    </div>
  );
}
