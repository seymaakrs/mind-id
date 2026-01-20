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
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useContentPlans } from "@/hooks";
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

interface ContentPlansTabProps {
  businessId: string;
}

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
          <p className="text-xs text-muted-foreground mb-1">Caption Taslagi:</p>
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
            <SelectItem value="planned">Planlandi</SelectItem>
            <SelectItem value="created">Olusturuldu</SelectItem>
            <SelectItem value="posted">Paylasildi</SelectItem>
            <SelectItem value="skipped">Atlandi</SelectItem>
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
              {postCounts.total} post • {postCounts.created + postCounts.posted} paylasildi • {postCounts.planned} bekliyor
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
                  <SelectItem value="paused">Duraklatildi</SelectItem>
                  <SelectItem value="completed">Tamamlandi</SelectItem>
                  <SelectItem value="cancelled">Iptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Olusturan: {plan.created_by}
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
            <span>Olusturulma: {formatDate(plan.created_at)}</span>
            <span>Guncelleme: {formatDate(plan.updated_at)}</span>
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
          <DialogTitle>Post Duzenle</DialogTitle>
          <DialogDescription>
            Post detaylarini duzenleyin
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
              <Label>Icerik Turu</Label>
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
                  <SelectItem value="image">Gorsel</SelectItem>
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
            <Label>Caption Taslagi</Label>
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
            Iptal
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
          <DialogTitle>Plan Notlarini Duzenle</DialogTitle>
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
              placeholder="Plan notlarini girin..."
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Iptal
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
            Plani Sil
          </DialogTitle>
          <DialogDescription>
            <strong>{plan.plan_id}</strong> planini silmek istediginizden emin misiniz?
            Bu islem geri alinamaz ve tum postlar da silinecektir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Iptal
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

// Main Tab Component
export function ContentPlansTab({ businessId }: ContentPlansTabProps) {
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<{ planId: string; post: ContentPost } | null>(null);
  const [editingNotesPlan, setEditingNotesPlan] = useState<ContentPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<ContentPlan | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Fetch plans when businessId changes
  useEffect(() => {
    if (businessId) {
      fetchPlans(businessId);
    }
  }, [businessId, fetchPlans]);

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
    await updatePlanStatus(businessId, planId, status);
    setSaving(false);
  };

  const handlePostStatusChange = async (planId: string, postId: string, status: PostStatus) => {
    setSaving(true);
    await updatePostStatus(businessId, planId, postId, status);
    setSaving(false);
  };

  const handleEditPost = (planId: string, post: ContentPost) => {
    setEditingPost({ planId, post });
  };

  const handleSavePost = async (updates: Partial<ContentPost>) => {
    if (!editingPost) return;
    setSaving(true);
    const success = await updatePost(
      businessId,
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
    const success = await updatePlanNotes(businessId, editingNotesPlan.plan_id, notes);
    setSaving(false);
    if (success) {
      setEditingNotesPlan(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setSaving(true);
    const success = await deletePlan(businessId, deletingPlan.plan_id);
    setSaving(false);
    if (success) {
      setDeletingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
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
      {!loadingPlans && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Bu isletme icin henuz icerik plani bulunmuyor.</p>
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
