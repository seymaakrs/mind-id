"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Video, Image as ImageIcon } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, type: "image" | "video", description: string) => Promise<boolean>;
};

export function MediaUploadModal({ open, onClose, onUpload }: Props) {
  const [type, setType] = useState<"image" | "video">("image");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const expectedType = type === "image" ? "image/" : "video/";
    if (!selectedFile.type.startsWith(expectedType)) {
      setError(`Lütfen bir ${type === "image" ? "görsel" : "video"} dosyası seçin.`);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleTypeChange = (newType: "image" | "video") => {
    setType(newType);
    setFile(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const success = await onUpload(file, type, description);
    setLoading(false);

    if (success) {
      handleClose();
    } else {
      setError("İçerik yüklenirken bir hata oluştu.");
    }
  };

  const handleClose = () => {
    setType("image");
    setFile(null);
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            İçerik Ekle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>İçerik Türü</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "image" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("image")}
                disabled={loading}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Görsel
              </Button>
              <Button
                type="button"
                variant={type === "video" ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleTypeChange("video")}
                disabled={loading}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="media-file">
              {type === "image" ? "Görsel Seçin" : "Video Seçin"}
            </Label>
            <Input
              id="media-file"
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              disabled={loading}
              key={type}
            />
            {file && (
              <p className="text-sm text-muted-foreground">Seçilen: {file.name}</p>
            )}
          </div>
          {file && (
            <div className="w-full h-40 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {type === "image" ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Önizleme"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="max-w-full max-h-full"
                  controls
                />
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="media-description">Açıklama (Opsiyonel)</Label>
            <Textarea
              id="media-description"
              placeholder="Bu içerik hakkında kısa bir açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={!file || loading}>
              {loading ? (
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
  );
}
