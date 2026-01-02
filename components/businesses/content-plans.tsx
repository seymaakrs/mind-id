"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Loader2,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useBusinesses, useContentPlans } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import type {
  ContentPlan,
  ContentPost,
  ContentType,
  PlanStatus,
  PostStatus,
} from "@/types/content-plan";
import {
  PLAN_STATUS_LABELS,
  PLAN_STATUS_COLORS,
  POST_STATUS_LABELS,
  POST_STATUS_COLORS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_COLORS,
} from "@/types/content-plan";

// Helper: Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Helper: Format date range
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startStr = startDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  const endStr = endDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startStr} - ${endStr}`;
}

// Post Card Component
function PostCard({
  post,
  onStatusChange,
  onEdit,
  disabled,
}: {
  post: ContentPost;
  onStatusChange: (status: PostStatus) => void;
  onEdit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLORS[post.content_type]}`}>
              {CONTENT_TYPE_LABELS[post.content_type]}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${POST_STATUS_COLORS[post.status]}`}>
              {POST_STATUS_LABELS[post.status]}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(post.scheduled_date)}
            </span>
          </div>
          <h4 className="font-medium mt-2 truncate">{post.topic}</h4>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} disabled={disabled}>
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {post.brief && (
        <p className="text-sm text-muted-foreground line-clamp-2">{post.brief}</p>
      )}

      {post.caption_draft && (
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground mb-1">Caption Taslağı:</p>
          <p className="text-sm line-clamp-2">{post.caption_draft}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Label className="text-xs">Durum:</Label>
        <Select
          value={post.status}
          onValueChange={(v) => onStatusChange(v as PostStatus)}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planlandı</SelectItem>
            <SelectItem value="created">Oluşturuldu</SelectItem>
            <SelectItem value="posted">Paylaşıldı</SelectItem>
            <SelectItem value="skipped">Atlandı</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Plan Card Component
function PlanCard({
  plan,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onPostStatusChange,
  onEditPost,
  onDelete,
  onEditNotes,
  disabled,
}: {
  plan: ContentPlan;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: PlanStatus) => void;
  onPostStatusChange: (postId: string, status: PostStatus) => void;
  onEditPost: (post: ContentPost) => void;
  onDelete: () => void;
  onEditNotes: () => void;
  disabled?: boolean;
}) {
  const postCounts = {
    total: plan.posts.length,
    planned: plan.posts.filter((p) => p.status === "planned").length,
    created: plan.posts.filter((p) => p.status === "created").length,
    posted: plan.posts.filter((p) => p.status === "posted").length,
    skipped: plan.posts.filter((p) => p.status === "skipped").length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${PLAN_STATUS_COLORS[plan.status]}`}>
                {PLAN_STATUS_LABELS[plan.status]}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDateRange(plan.start_date, plan.end_date)}
              </span>
            </div>
            <CardTitle className="text-lg">
              {plan.plan_id}
            </CardTitle>
            <CardDescription className="mt-1">
              {postCounts.total} post • {postCounts.posted} paylaşıldı • {postCounts.planned} bekliyor
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEditNotes} disabled={disabled}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} disabled={disabled}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Plan Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Plan Durumu:</Label>
              <Select
                value={plan.status}
                onValueChange={(v) => onStatusChange(v as PlanStatus)}
                disabled={disabled}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="paused">Duraklatıldı</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Oluşturan: {plan.created_by}
            </div>
          </div>

          {/* Notes */}
          {plan.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Notlar:</p>
              <p className="text-sm whitespace-pre-wrap">{plan.notes}</p>
            </div>
          )}

          {/* Posts */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Postlar ({plan.posts.length})</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.posts
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onStatusChange={(status) => onPostStatusChange(post.id, status)}
                    onEdit={() => onEditPost(post)}
                    disabled={disabled}
                  />
                ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground flex gap-4">
            <span>Oluşturulma: {formatDate(plan.created_at)}</span>
            <span>Güncelleme: {formatDate(plan.updated_at)}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Edit Post Modal
function EditPostModal({
  post,
  isOpen,
  onClose,
  onSave,
  saving,
}: {
  post: ContentPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ContentPost>) => void;
  saving: boolean;
}) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [contentType, setContentType] = useState<ContentType>("image");
  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState("");
  const [captionDraft, setCaptionDraft] = useState("");

  useEffect(() => {
    if (post) {
      setScheduledDate(post.scheduled_date);
      setContentType(post.content_type);
      setTopic(post.topic);
      setBrief(post.brief);
      setCaptionDraft(post.caption_draft || "");
    }
  }, [post]);

  const handleSave = () => {
    onSave({
      scheduled_date: scheduledDate,
      content_type: contentType,
      topic,
      brief,
      caption_draft: captionDraft || null,
    });
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post Düzenle</DialogTitle>
          <DialogDescription>
            Post detaylarını düzenleyin
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>İçerik Türü</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as ContentType)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="image">Görsel</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Konu</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Brief</Label>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Caption Taslağı</Label>
            <Textarea
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              rows={3}
              placeholder="Opsiyonel..."
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Notes Modal
function EditNotesModal({
  plan,
  isOpen,
  onClose,
  onSave,
  saving,
}: {
  plan: ContentPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (plan) {
      setNotes(plan.notes || "");
    }
  }, [plan]);

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan Notlarını Düzenle</DialogTitle>
          <DialogDescription>
            {plan.plan_id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Plan notlarını girin..."
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button onClick={() => onSave(notes)} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  plan,
  isOpen,
  onClose,
  onConfirm,
  deleting,
}: {
  plan: ContentPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Planı Sil
          </DialogTitle>
          <DialogDescription>
            <strong>{plan.plan_id}</strong> planını silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz ve tüm postlar da silinecektir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            İptal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function ContentPlansComponent() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<{ planId: string; post: ContentPost } | null>(null);
  const [editingNotesPlan, setEditingNotesPlan] = useState<ContentPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<ContentPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const {
    plans,
    loading: loadingPlans,
    error,
    fetchPlans,
    updatePlanStatus,
    updatePlanNotes,
    updatePostStatus,
    updatePost,
    deletePlan,
  } = useContentPlans();

  // Fetch plans when business changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchPlans(selectedBusinessId);
    }
  }, [selectedBusinessId, fetchPlans]);

  const toggleExpand = (planId: string) => {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  };

  const handlePlanStatusChange = async (planId: string, status: PlanStatus) => {
    setSaving(true);
    await updatePlanStatus(selectedBusinessId, planId, status);
    setSaving(false);
  };

  const handlePostStatusChange = async (planId: string, postId: string, status: PostStatus) => {
    setSaving(true);
    await updatePostStatus(selectedBusinessId, planId, postId, status);
    setSaving(false);
  };

  const handleEditPost = (planId: string, post: ContentPost) => {
    setEditingPost({ planId, post });
  };

  const handleSavePost = async (updates: Partial<ContentPost>) => {
    if (!editingPost) return;
    setSaving(true);
    const success = await updatePost(
      selectedBusinessId,
      editingPost.planId,
      editingPost.post.id,
      updates
    );
    setSaving(false);
    if (success) {
      setEditingPost(null);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!editingNotesPlan) return;
    setSaving(true);
    const success = await updatePlanNotes(selectedBusinessId, editingNotesPlan.plan_id, notes);
    setSaving(false);
    if (success) {
      setEditingNotesPlan(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setSaving(true);
    const success = await deletePlan(selectedBusinessId, deletingPlan.plan_id);
    setSaving(false);
    if (success) {
      setDeletingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          İçerik Planları
        </h2>
        <p className="text-muted-foreground mt-2">
          İşletmelerin haftalık içerik planlarını görüntüleyin ve yönetin.
        </p>
      </div>

      {/* Business Selector */}
      <Card>
        <CardHeader>
          <CardTitle>İşletme Seçin</CardTitle>
          <CardDescription>
            İçerik planlarını görüntülemek için bir işletme seçin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessSelector
            businesses={businesses}
            loading={loadingBusinesses}
            selectedId={selectedBusinessId}
            onSelect={setSelectedBusinessId}
            showPreview
            className="w-full max-w-md"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loadingPlans && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Plans List */}
      {selectedBusinessId && !loadingPlans && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Bu işletme için henüz içerik planı bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                isExpanded={expandedPlanIds.has(plan.plan_id)}
                onToggleExpand={() => toggleExpand(plan.plan_id)}
                onStatusChange={(status) => handlePlanStatusChange(plan.plan_id, status)}
                onPostStatusChange={(postId, status) =>
                  handlePostStatusChange(plan.plan_id, postId, status)
                }
                onEditPost={(post) => handleEditPost(plan.plan_id, post)}
                onDelete={() => setDeletingPlan(plan)}
                onEditNotes={() => setEditingNotesPlan(plan)}
                disabled={saving}
              />
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <EditPostModal
        post={editingPost?.post || null}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSavePost}
        saving={saving}
      />

      <EditNotesModal
        plan={editingNotesPlan}
        isOpen={!!editingNotesPlan}
        onClose={() => setEditingNotesPlan(null)}
        onSave={handleSaveNotes}
        saving={saving}
      />

      <DeleteConfirmModal
        plan={deletingPlan}
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDeletePlan}
        deleting={saving}
      />
    </div>
  );
}
