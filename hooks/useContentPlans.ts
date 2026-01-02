import { useState, useCallback, useEffect } from "react";
import {
  getContentPlans,
  updateContentPlan,
  deleteContentPlan,
} from "@/lib/firebase/firestore";
import type { ContentPlan, ContentPost, PlanStatus, PostStatus } from "@/types/content-plan";

type UseContentPlansReturn = {
  plans: ContentPlan[];
  loading: boolean;
  error: string | null;
  selectedPlan: ContentPlan | null;
  fetchPlans: (businessId: string) => Promise<void>;
  selectPlan: (plan: ContentPlan | null) => void;
  updatePlanStatus: (businessId: string, planId: string, status: PlanStatus) => Promise<boolean>;
  updatePlanNotes: (businessId: string, planId: string, notes: string) => Promise<boolean>;
  updatePostStatus: (
    businessId: string,
    planId: string,
    postId: string,
    status: PostStatus
  ) => Promise<boolean>;
  updatePost: (
    businessId: string,
    planId: string,
    postId: string,
    updates: Partial<ContentPost>
  ) => Promise<boolean>;
  deletePlan: (businessId: string, planId: string) => Promise<boolean>;
  reset: () => void;
};

export function useContentPlans(): UseContentPlansReturn {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);

  const fetchPlans = useCallback(async (businessId: string) => {
    if (!businessId) {
      setPlans([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedPlans = await getContentPlans(businessId);
      // Sort by start_date descending (newest first)
      const sortedPlans = fetchedPlans.sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setPlans(sortedPlans);
    } catch (err) {
      console.error("Error fetching content plans:", err);
      setError("İçerik planları yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPlan = useCallback((plan: ContentPlan | null) => {
    setSelectedPlan(plan);
  }, []);

  const updatePlanStatus = useCallback(
    async (businessId: string, planId: string, status: PlanStatus): Promise<boolean> => {
      try {
        await updateContentPlan(businessId, planId, { status });
        setPlans((prev) =>
          prev.map((p) =>
            p.plan_id === planId ? { ...p, status, updated_at: new Date().toISOString() } : p
          )
        );
        if (selectedPlan?.plan_id === planId) {
          setSelectedPlan((prev) =>
            prev ? { ...prev, status, updated_at: new Date().toISOString() } : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error updating plan status:", err);
        setError("Plan durumu güncellenirken hata oluştu.");
        return false;
      }
    },
    [selectedPlan]
  );

  const updatePlanNotes = useCallback(
    async (businessId: string, planId: string, notes: string): Promise<boolean> => {
      try {
        await updateContentPlan(businessId, planId, { notes });
        setPlans((prev) =>
          prev.map((p) =>
            p.plan_id === planId ? { ...p, notes, updated_at: new Date().toISOString() } : p
          )
        );
        if (selectedPlan?.plan_id === planId) {
          setSelectedPlan((prev) =>
            prev ? { ...prev, notes, updated_at: new Date().toISOString() } : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error updating plan notes:", err);
        setError("Plan notları güncellenirken hata oluştu.");
        return false;
      }
    },
    [selectedPlan]
  );

  const updatePostStatus = useCallback(
    async (
      businessId: string,
      planId: string,
      postId: string,
      status: PostStatus
    ): Promise<boolean> => {
      const plan = plans.find((p) => p.plan_id === planId);
      if (!plan) return false;

      const updatedPosts = plan.posts.map((post) =>
        post.id === postId ? { ...post, status } : post
      );

      try {
        await updateContentPlan(businessId, planId, { posts: updatedPosts });
        setPlans((prev) =>
          prev.map((p) =>
            p.plan_id === planId
              ? { ...p, posts: updatedPosts, updated_at: new Date().toISOString() }
              : p
          )
        );
        if (selectedPlan?.plan_id === planId) {
          setSelectedPlan((prev) =>
            prev ? { ...prev, posts: updatedPosts, updated_at: new Date().toISOString() } : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error updating post status:", err);
        setError("Post durumu güncellenirken hata oluştu.");
        return false;
      }
    },
    [plans, selectedPlan]
  );

  const updatePost = useCallback(
    async (
      businessId: string,
      planId: string,
      postId: string,
      updates: Partial<ContentPost>
    ): Promise<boolean> => {
      const plan = plans.find((p) => p.plan_id === planId);
      if (!plan) return false;

      const updatedPosts = plan.posts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post
      );

      try {
        await updateContentPlan(businessId, planId, { posts: updatedPosts });
        setPlans((prev) =>
          prev.map((p) =>
            p.plan_id === planId
              ? { ...p, posts: updatedPosts, updated_at: new Date().toISOString() }
              : p
          )
        );
        if (selectedPlan?.plan_id === planId) {
          setSelectedPlan((prev) =>
            prev ? { ...prev, posts: updatedPosts, updated_at: new Date().toISOString() } : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error updating post:", err);
        setError("Post güncellenirken hata oluştu.");
        return false;
      }
    },
    [plans, selectedPlan]
  );

  const deletePlan = useCallback(
    async (businessId: string, planId: string): Promise<boolean> => {
      try {
        await deleteContentPlan(businessId, planId);
        setPlans((prev) => prev.filter((p) => p.plan_id !== planId));
        if (selectedPlan?.plan_id === planId) {
          setSelectedPlan(null);
        }
        return true;
      } catch (err) {
        console.error("Error deleting plan:", err);
        setError("Plan silinirken hata oluştu.");
        return false;
      }
    },
    [selectedPlan]
  );

  const reset = useCallback(() => {
    setPlans([]);
    setSelectedPlan(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    plans,
    loading,
    error,
    selectedPlan,
    fetchPlans,
    selectPlan,
    updatePlanStatus,
    updatePlanNotes,
    updatePostStatus,
    updatePost,
    deletePlan,
    reset,
  };
}
