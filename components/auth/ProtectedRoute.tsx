"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, isConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isConfigured) {
      if (!user) {
        router.push("/giris");
      } else if (!isAdmin) {
        router.push("/yetkisiz");
      }
    }
  }, [user, isAdmin, loading, isConfigured, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Yukleniyor...</div>
      </div>
    );
  }

  // If Firebase is not configured, show warning but allow access
  if (!isConfigured) {
    return (
      <div className="relative">
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 text-sm z-50">
          Firebase yapilandirilmamis. .env.local dosyasini olusturun.
        </div>
        <div className="pt-10">
          {children}
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
