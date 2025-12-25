"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const { signInWithEmail, signInWithGoogle, isConfigured, user, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setHata("Firebase yapilandirilmamis. .env.local dosyasini olusturun.");
      return;
    }
    setIsLoading(true);
    setHata(null);

    try {
      await signInWithEmail(email, password);
      router.push("/");
    } catch {
      setHata("Giris basarisiz. Email veya sifre hatali.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      setHata("Firebase yapilandirilmamis. .env.local dosyasini olusturun.");
      return;
    }
    setIsLoading(true);
    setHata(null);

    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      setHata("Google ile giris basarisiz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MindID Admin</CardTitle>
          <CardDescription>Yonetim paneline giris yapin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && (
            <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-500 rounded-lg p-3 text-sm">
              Firebase yapilandirilmamis. Lutfen .env.local dosyasini olusturun.
            </div>
          )}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isConfigured}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Sifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isConfigured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isConfigured}>
              {isLoading ? "Giris yapiliyor..." : "Giris Yap"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading || !isConfigured}
          >
            Google ile Giris
          </Button>

          {hata && (
            <p className="text-sm text-destructive text-center">{hata}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
