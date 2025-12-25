"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function YetkisizPage() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogoutAndLogin = async () => {
    await logout();
    router.push("/giris");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldX className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Yetkisiz Erisim</CardTitle>
          <CardDescription>
            Bu sayfaya erisim yetkiniz bulunmamaktadir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <p className="text-sm text-muted-foreground">
              Giris yapilan hesap: <strong>{user.email}</strong>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Admin yetkisi almak icin sistem yoneticisi ile iletisime gecin.
          </p>
          <Button variant="outline" onClick={handleLogoutAndLogin} className="w-full">
            Farkli Hesapla Giris Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
