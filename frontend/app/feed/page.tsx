"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import VideoCard from "@/components/video-card";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";
import { Video } from "@/types/video";
import Navigation from "@/components/navigation";
import { fetchPosts } from "@lens-protocol/client/actions";
import { evmAddress, PageSize } from "@lens-protocol/client";
import { lensClient } from "@/lib/lens";
import { Post } from "@lens-protocol/client";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoMetadata {
  __typename: "VideoMetadata";
  video?: { item: string };
  content?: string;
  title?: string;
  tags?: string[];
}

const ACCENT = "#004aad"; // ← your new primary color

// Function to convert Lens URI to HTTP URL
const getLensUrl = (uri: string) => {
  if (!uri) return "";
  if (uri.startsWith("lens://")) {
    return `https://arweave.net/${uri.replace("lens://", "")}`;
  }
  return uri;
};

export default function FeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const initialFetchDone = useRef(false);

  // Fetch posts with pagination
  const fetchMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const result = await fetchPosts(lensClient, {
      filter: {
        apps: [evmAddress(process.env.NEXT_PUBLIC_LENS_APP_ID || "")],
      },
      cursor: cursor || undefined,
      pageSize: PageSize.Ten,
    });
    if (result.isOk()) {
      const { items, pageInfo } = result.value;
      const formatted = items
        .filter((post): post is Post => "metadata" in post && "stats" in post)
        .filter(
          (post): post is Post & { metadata: VideoMetadata } =>
            post.metadata.__typename === "VideoMetadata"
        )
        .map((post) => {
          const id = typeof post.id === "string" ? post.id : String(post.id);
          return {
            id,
            slug: post.slug,
            username: post.author.username?.localName || "anonymous",
            videoUrl: post.metadata.video?.item || "",
            caption: post.metadata.content || "",
            title: post.metadata.title || "",
            tags: post.metadata.tags || [],
            likes: post.stats.upvotes || 0,
            comments: post.stats.comments || 0,
            authorId: post.author.address,
            author: {
              name:
                post.author.metadata?.name ||
                post.author.username?.localName ||
                "anonymous",
              bio: post.author.metadata?.bio || "",
              picture: post.author.metadata?.picture || "",
            },
          };
        });
      setVideos((prev) => [...prev, ...formatted]);
      setCursor(pageInfo?.next || null);
      setHasMore(!!pageInfo?.next);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, cursor]);

  // Initial load
  useEffect(() => {
    const initialFetch = async () => {
      if (initialFetchDone.current) return;
      initialFetchDone.current = true;
      
      setVideos([]);
      setCursor(null);
      setHasMore(true);
      await fetchMorePosts();
    };
    initialFetch();
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading || !initialFetchDone.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [fetchMorePosts, hasMore, loading]);

  return (
    <div className="flex justify-center bg-[#f5f5f5] dark:bg-black fixed inset-0 mt-[60px]">
      <div className="w-full max-w-[420px] h-full flex flex-col bg-[#ffffff] dark:bg-black">
        <main className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y will-change-scroll">
          <motion.div
            className="w-full px-4 pb-20 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {videos.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="mb-0"
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
            <div ref={loaderRef} className="flex justify-center py-8">
              {loading && (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004aad]"></div>
              )}
              {!hasMore && !loading && videos.length > 0 && (
                <div className="text-gray-400 text-center text-xs">
                  No more posts
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
