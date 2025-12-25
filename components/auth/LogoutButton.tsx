"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/giris");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-sidebar-foreground/80 truncate max-w-[150px]">
        {user?.email}
      </span>
      <Button variant="ghost" size="sm" onClick={handleLogout} title="Cikis Yap">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
