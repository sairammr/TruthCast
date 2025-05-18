"use client";

import { useState, useEffect } from "react";
import VideoCard from "@/components/video-card";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";
import { Video } from "@/types/video";
import Navigation from "@/components/navigation";
import { fetchPosts } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import { lensClient } from "@/lib/lens";
import { Post } from "@lens-protocol/client";

interface VideoMetadata {
  __typename: "VideoMetadata";
  video?: { item: string };
  content?: string;
  title?: string;
  tags?: string[];
}

const ACCENT = "#004aad";  // ← your new primary color

export default function FeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const result = await fetchPosts(lensClient, {
        filter: {
          apps: [evmAddress(process.env.NEXT_PUBLIC_LENS_APP_ID || "")],
        },
      });

      if (result.isOk()) {
        const { items } = result.value;
        const formatted = items
          .filter((post): post is Post => "metadata" in post && "stats" in post)
          .filter(
            (post): post is Post & { metadata: VideoMetadata } =>
              post.metadata.__typename === "VideoMetadata"
          )
          .map((post) => ({
            id: Number(post.id),
            username: post.author.username?.localName || "anonymous",
            videoUrl: post.metadata.video?.item || "",
            caption: post.metadata.content || "",
            title: post.metadata.title || "",
            tags: post.metadata.tags || [],
            likes: post.stats.upvotes || 0,
            comments: post.stats.comments || 0,
            author: {
              name:
                post.author.metadata?.name ||
                post.author.username?.localName ||
                "anonymous",
              bio: post.author.metadata?.bio || "",
              picture: post.author.metadata?.picture || "",
            },
          }));
        setVideos(formatted);
      }
    };
    fetch();
  }, []);

  return (
    <div className="flex justify-center bg-[#f5f5f5] dark:bg-black fixed inset-0">
      {/* phone‐sized “screen” */}
      <div className="w-full max-w-[420px] h-full flex flex-col bg-[#ffffff] dark:bg-black">
        <header
          className="flex justify-center p-4 border-b safe-top backdrop-blur-lg bg-opacity-80"
          style={{ borderColor: `${ACCENT}33` /* light 20% alpha */ }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedLogo compact={true} />
          </motion.div>
        </header>

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
                className="mb-8"
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>
        </main>

        <Navigation />
      </div>
    </div>
  );
}
