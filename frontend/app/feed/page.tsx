"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, PlusCircle, User } from "lucide-react";
import VideoCard from "@/components/video-card";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";

export default function FeedPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    // Mock video data
    const mockVideos = [
      {
        id: 1,
        username: "truthseeker",
        videoUrl: "/placeholder.svg?height=720&width=1280",
        caption: "The truth about our society that no one wants to talk about.",
        likes: 1243,
        comments: 89,
      },
      {
        id: 2,
        username: "deepdiver",
        videoUrl: "/placeholder.svg?height=720&width=1280",
        caption: "What I discovered after years of research.",
        likes: 892,
        comments: 56,
      },
      {
        id: 3,
        username: "awakened_mind",
        videoUrl: "/placeholder.svg?height=720&width=1280",
        caption: "This changed everything I believed in.",
        likes: 2103,
        comments: 145,
      },
    ];

    setVideos(mockVideos);
  }, []);

  return (
    <div className="flex flex-col h-full fixed inset-0 bg-[#f5f5f5] dark:bg-black">
      <header className="flex justify-center p-4 bg-[#f5f5f5] dark:bg-black border-b border-black/10 dark:border-white/10 safe-top backdrop-blur-lg bg-opacity-80">
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
          className="container max-w-3xl mx-auto px-4 pb-20 pt-2 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="mb-8"
            >
              <VideoCard video={video} />
            </motion.div>
          ))}
        </motion.div>
      </main>

      <nav className="bg-[#f5f5f5] dark:bg-black border-t border-black/10 dark:border-white/10 safe-bottom backdrop-blur-lg bg-opacity-80">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 flex items-center justify-center"
          >
            <Button
              variant="ghost"
              className="flex flex-col items-center touch-manipulation w-full h-full"
              onClick={() => router.push("/feed")}
            >
              <Home className="h-6 w-6 text-[#10b981]" />
              <span className="text-xs mt-1 font-bold">FEED</span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="-mt-6"
          >
            <Button
              className="flex flex-col items-center brutalist-button rounded-full w-14 h-14 p-0 touch-manipulation shadow-lg"
              onClick={() => router.push("/create")}
            >
              <PlusCircle className="h-6 w-6" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 flex items-center justify-center"
          >
            <Button
              variant="ghost"
              className="flex flex-col items-center touch-manipulation w-full h-full"
              onClick={() => router.push("/profile")}
            >
              <User className="h-6 w-6" />
              <span className="text-xs mt-1 font-bold">PROFILE</span>
            </Button>
          </motion.div>
        </div>
      </nav>
    </div>
  );
}
