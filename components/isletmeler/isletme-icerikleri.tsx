"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FolderOpen,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Calendar,
  FileText,
  Download,
  Plus,
  Upload,
  Bot,
  Send,
} from "lucide-react";
import { getBusinesses, getBusinessMedia, addBusinessMedia } from "@/lib/firebase/firestore";
import { uploadBusinessMedia } from "@/lib/firebase/storage";
import type { Business, BusinessMedia } from "@/types/firebase";

export default function IsletmeIcerikleriComponent() {
  const [isletmeler, setIsletmeler] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [medyalar, setMedyalar] = useState<BusinessMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video">("all");
  const [selectedMedia, setSelectedMedia] = useState<BusinessMedia | null>(null);

  // İçerik ekleme state'leri
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<"image" | "video">("image");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addDescription, setAddDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Agent'a gönder state'leri
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentMedia, setAgentMedia] = useState<BusinessMedia | null>(null);
  const [agentTask, setAgentTask] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);

  // İşletmeleri yükle
  const loadIsletmeler = async () => {
    setLoading(true);
    setHata(null);
    try {
      const data = await getBusinesses();
      setIsletmeler(data);
    } catch (error) {
      console.error("İşletmeler yüklenirken hata:", error);
      setHata("İşletmeler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Seçilen işletmenin medyalarını yükle
  const loadMedia = async (businessId: string) => {
    if (!businessId) {
      setMedyalar([]);
      return;
    }

    setLoadingMedia(true);
    setHata(null);
    try {
      const data = await getBusinessMedia(businessId);
      // Tarihe göre sırala (en yeni önce)
      const sorted = data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMedyalar(sorted);
    } catch (error) {
      console.error("Medyalar yüklenirken hata:", error);
      setHata("İçerikler yüklenirken bir hata oluştu.");
    } finally {
      setLoadingMedia(false);
    }
  };

  // İşletme seçildiğinde
  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    loadMedia(businessId);
  };

  // Filtrelenmiş medyalar
  const filteredMedia = medyalar.filter((m) => {
    if (activeTab === "all") return true;
    return m.type === activeTab;
  });

  // İstatistikler
  const imageCount = medyalar.filter((m) => m.type === "image").length;
  const videoCount = medyalar.filter((m) => m.type === "video").length;

  useEffect(() => {
    loadIsletmeler();
  }, []);

  // Modal açıldığında state'leri sıfırla
  const openAddModal = () => {
    setAddType("image");
    setAddFile(null);
    setAddDescription("");
    setAddError(null);
    setAddModalOpen(true);
  };

  // Dosya seçimi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya türü kontrolü
    if (addType === "image") {
      if (!file.type.startsWith("image/")) {
        setAddError("Lütfen bir görsel dosyası seçin.");
        return;
      }
    } else {
      if (!file.type.startsWith("video/")) {
        setAddError("Lütfen bir video dosyası seçin.");
        return;
      }
    }

    setAddFile(file);
    setAddError(null);
  };

  // İçerik yükleme
  const handleAddContent = async () => {
    if (!addFile || !selectedBusinessId) return;

    setAddLoading(true);
    setAddError(null);

    try {
      // Storage'a yükle
      const { url, storagePath, fileName } = await uploadBusinessMedia(
        addFile,
        selectedBusinessId,
        addType
      );

      // Firestore'a kaydet
      const mediaData: Omit<BusinessMedia, "id"> = {
        type: addType,
        storage_path: storagePath,
        public_url: url,
        file_name: fileName,
        created_at: new Date().toISOString(),
        prompt_summary: addDescription.trim(),
      };

      await addBusinessMedia(selectedBusinessId, mediaData);

      // Modal'ı kapat ve listeyi yenile
      setAddModalOpen(false);
      loadMedia(selectedBusinessId);
    } catch (error) {
      console.error("İçerik yüklenirken hata:", error);
      setAddError("İçerik yüklenirken bir hata oluştu.");
    } finally {
      setAddLoading(false);
    }
  };

  // Agent modalını aç
  const openAgentModal = (media: BusinessMedia, e: React.MouseEvent) => {
    e.stopPropagation(); // Kart tıklamasını engelle
    setAgentMedia(media);
    setAgentTask("");
    setAgentError(null);
    setAgentResponse(null);
    setAgentModalOpen(true);
  };

  // Agent'a gönder
  const handleSendToAgent = async () => {
    if (!agentMedia || !agentTask.trim() || !selectedBusinessId) return;

    setAgentLoading(true);
    setAgentError(null);
    setAgentResponse(null);

    try {
      const response = await fetch("/api/agent-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: agentTask.trim(),
          business_id: selectedBusinessId,
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
        }),
      });

      const responseText = await response.text();
      let parsedResponse: { output?: string; error?: string; details?: string } | null = null;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // JSON parse edilemedi
      }

      if (!response.ok) {
        const errorMsg = parsedResponse?.error || parsedResponse?.details || responseText || "İstek başarısız oldu.";
        setAgentError(errorMsg);
        return;
      }

      if (parsedResponse?.output) {
        setAgentResponse(parsedResponse.output);
      } else {
        setAgentError("Beklenmeyen yanıt formatı.");
      }
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setAgentLoading(false);
    }
  };

  // Tarih formatlama
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Başlık */}
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
            <Button onClick={openAddModal}>
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

      {/* İşletme Seçimi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">
              İşletme Seçin:
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Yükleniyor...</span>
              </div>
            ) : (
              <Select
                value={selectedBusinessId}
                onValueChange={handleBusinessChange}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Bir işletme seçin" />
                </SelectTrigger>
                <SelectContent>
                  {isletmeler.map((isletme) => (
                    <SelectItem key={isletme.id} value={isletme.id}>
                      <div className="flex items-center gap-2">
                        {isletme.logo && (
                          <img
                            src={isletme.logo}
                            alt=""
                            className="w-5 h-5 rounded object-contain"
                          />
                        )}
                        {isletme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {hata && <p className="text-sm text-destructive">{hata}</p>}

      {/* İçerik Alanı */}
      {selectedBusinessId && (
        <>
          {loadingMedia ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : medyalar.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Bu işletme için henüz içerik bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "image" | "video")}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Tümü ({medyalar.length})
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

                <TabsContent value={activeTab} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-hidden">
                    {filteredMedia.map((media) => (
                      <Card
                        key={media.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                        onClick={() => setSelectedMedia(media)}
                      >
                        <CardContent className="p-0">
                          {/* Önizleme */}
                          <div className="w-full h-40 bg-muted flex items-center justify-center overflow-hidden relative">
                            {media.type === "image" ? (
                              <img
                                src={media.public_url}
                                alt={media.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="relative w-full h-full">
                                <video
                                  src={media.public_url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Video className="w-12 h-12 text-white" />
                                </div>
                              </div>
                            )}
                            {/* Tip Badge */}
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                              media.type === "image"
                                ? "bg-blue-500/80 text-white"
                                : "bg-purple-500/80 text-white"
                            }`}>
                              {media.type === "image" ? "Görsel" : "Video"}
                            </span>
                          </div>

                          {/* Bilgiler */}
                          <div className="p-3 space-y-2 min-w-0">
                            <p className="text-sm font-medium truncate" title={media.file_name}>
                              {media.file_name}
                            </p>
                            {media.prompt_summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2" title={media.prompt_summary}>
                                {media.prompt_summary}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(media.created_at)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={(e) => openAgentModal(media, e)}
                            >
                              <Bot className="w-4 h-4 mr-2" />
                              Ajana Gönder
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}

      {/* Detay Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMedia?.type === "image" ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
              {selectedMedia?.file_name}
            </DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              {/* Medya Önizleme */}
              <div className="w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {selectedMedia.type === "image" ? (
                  <img
                    src={selectedMedia.public_url}
                    alt={selectedMedia.file_name}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.public_url}
                    controls
                    className="max-w-full max-h-[500px]"
                  />
                )}
              </div>

              {/* Detay Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Dosya Adı:</span>
                    <span className="text-muted-foreground">{selectedMedia.file_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Oluşturulma:</span>
                    <span className="text-muted-foreground">{formatDate(selectedMedia.created_at)}</span>
                  </div>
                </div>

                {selectedMedia.prompt_summary && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Açıklama:</p>
                    <p className="text-sm text-muted-foreground">{selectedMedia.prompt_summary}</p>
                  </div>
                )}
              </div>

              {/* Aksiyonlar */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedMedia.public_url, "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  İndir / Aç
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* İçerik Ekleme Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              İçerik Ekle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tür Seçimi */}
            <div className="space-y-2">
              <Label>İçerik Türü</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={addType === "image" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setAddType("image");
                    setAddFile(null);
                  }}
                  disabled={addLoading}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Görsel
                </Button>
                <Button
                  type="button"
                  variant={addType === "video" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setAddType("video");
                    setAddFile(null);
                  }}
                  disabled={addLoading}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
              </div>
            </div>

            {/* Dosya Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="media-file">
                {addType === "image" ? "Görsel Seçin" : "Video Seçin"}
              </Label>
              <Input
                id="media-file"
                type="file"
                accept={addType === "image" ? "image/*" : "video/*"}
                onChange={handleFileChange}
                disabled={addLoading}
                key={addType} // Tür değiştiğinde input'u sıfırla
              />
              {addFile && (
                <p className="text-sm text-muted-foreground">
                  Seçilen: {addFile.name}
                </p>
              )}
            </div>

            {/* Önizleme */}
            {addFile && (
              <div className="w-full h-40 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {addType === "image" ? (
                  <img
                    src={URL.createObjectURL(addFile)}
                    alt="Önizleme"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(addFile)}
                    className="max-w-full max-h-full"
                    controls
                  />
                )}
              </div>
            )}

            {/* Açıklama */}
            <div className="space-y-2">
              <Label htmlFor="media-description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="media-description"
                placeholder="Bu içerik hakkında kısa bir açıklama..."
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                rows={3}
                disabled={addLoading}
              />
            </div>

            {/* Hata Mesajı */}
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}

            {/* Butonlar */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={addLoading}
              >
                İptal
              </Button>
              <Button
                onClick={handleAddContent}
                disabled={!addFile || addLoading}
              >
                {addLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Yükle
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent'a Gönder Modal */}
      <Dialog open={agentModalOpen} onOpenChange={(open) => {
        if (!agentLoading) setAgentModalOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agent&apos;a Gönder
            </DialogTitle>
          </DialogHeader>

          {agentMedia && (
            <div className="space-y-4">
              {/* Seçilen Medya Önizleme */}
              <div className="flex gap-4 p-3 bg-muted rounded-lg">
                <div className="w-24 h-24 bg-background rounded overflow-hidden flex-shrink-0">
                  {agentMedia.type === "image" ? (
                    <img
                      src={agentMedia.public_url}
                      alt={agentMedia.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agentMedia.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {agentMedia.type === "image" ? "Görsel" : "Video"}
                  </p>
                  {agentMedia.prompt_summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {agentMedia.prompt_summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Görev Girişi */}
              <div className="space-y-2">
                <Label htmlFor="agent-task">
                  Bu içerikle ne yapmak istiyorsunuz?
                </Label>
                <Textarea
                  id="agent-task"
                  placeholder="Örn: Bu görseli kullanarak Instagram postu oluştur..."
                  value={agentTask}
                  onChange={(e) => setAgentTask(e.target.value)}
                  rows={4}
                  disabled={agentLoading}
                />
              </div>

              {/* Hata Mesajı */}
              {agentError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{agentError}</p>
                </div>
              )}

              {/* Agent Yanıtı */}
              {agentResponse && (
                <div className="space-y-2">
                  <Label>Agent Yanıtı</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap break-words text-sm">
                      {agentResponse}
                    </pre>
                  </div>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAgentModalOpen(false)}
                  disabled={agentLoading}
                >
                  {agentResponse ? "Kapat" : "İptal"}
                </Button>
                {!agentResponse && (
                  <Button
                    onClick={handleSendToAgent}
                    disabled={!agentTask.trim() || agentLoading}
                  >
                    {agentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Gönder
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
