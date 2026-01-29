"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import type { InstagramPost } from "@/types/firebase";

interface InstagramPostsTabProps {
  businessId: string;
}

export function InstagramPostsTab({ businessId }: InstagramPostsTabProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts from Firestore
  const fetchPosts = useCallback(async () => {
    if (!db) {
      setError("Firebase baglantisi yok");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch posts
      const postsRef = collection(db, "businesses", businessId, "instagram_posts");
      const snapshot = await getDocs(postsRef);

      const postsData: InstagramPost[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InstagramPost[];

      setPosts(postsData);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Gonderiler yuklenirken bir hata olustu");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Get Instagram embed URL
  const getEmbedUrl = (permalink: string) => {
    // Instagram embed format: add /embed/ to the post URL
    return `${permalink}embed/`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Gonderiler yukleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={fetchPosts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Instagram className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Henuz Instagram gonderisi bulunmuyor.</p>
        </CardContent>
      </Card>
    );
  }

  const postsWithPermalink = posts.filter((p) => p.permalink);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Instagram className="w-6 h-6 text-pink-500" />
              <div>
                <h3 className="font-semibold">Instagram Gonderileri</h3>
                <p className="text-sm text-muted-foreground">
                  {posts.length} gonderi • {postsWithPermalink.length} goruntulenebilir
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPosts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="truncate">
                  {post.owner_username ? `@${post.owner_username}` : `Post ${post.id.slice(-8)}`}
                </span>
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {post.permalink ? (
                <iframe
                  src={getEmbedUrl(post.permalink)}
                  className="w-full h-[500px] border-0"
                  title={`Instagram post ${post.id}`}
                  loading="lazy"
                  allowFullScreen
                />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center bg-muted p-4">
                  <Instagram className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Gonderi linki henuz yuklenmedi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
