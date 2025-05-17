"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, Grid, BookMarked, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoThumbnail from "@/components/video-thumbnail";
import VideoCard from "@/components/video-card";
import { Video } from "@/types/video";

export default function ProfilePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);

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
        username: "truthseeker",
        videoUrl: "/placeholder.svg?height=720&width=1280",
        caption: "What I discovered after years of research.",
        likes: 892,
        comments: 56,
      },
      {
        id: 3,
        username: "truthseeker",
        videoUrl: "/placeholder.svg?height=720&width=1280",
        caption: "This changed everything I believed in.",
        likes: 2103,
        comments: 145,
      },
      // Add more mock videos as needed
    ];

    setVideos(mockVideos);
  }, []);

  return (
    <div className="flex flex-col h-full fixed inset-0 bg-[#f5f5f5] dark:bg-black">
      <header className="flex justify-center p-4 bg-[#f5f5f5] dark:bg-black border-b border-black dark:border-white safe-top">
        <div className="w-full max-w-3xl flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/feed")}
              className="brutalist-box bg-white dark:bg-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <h1 className="text-xl font-bold">
            PRO<span className="text-[#10b981]">FILE</span>
          </h1>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
              className="brutalist-box bg-white dark:bg-black"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="container max-w-3xl mx-auto px-4 pb-20">
          <motion.div
            className="py-6 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Avatar className="w-20 h-20 border-2 border-black dark:border-white mb-4">
              <AvatarImage src="/placeholder.svg?height=80&width=80" />
              <AvatarFallback>TS</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">@truthseeker</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              Seeking and sharing truth through deep research and analysis.
            </p>
            <div className="flex space-x-8 mt-4">
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="font-bold">23</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Videos
                </div>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="font-bold">1.2k</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Followers
                </div>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="font-bold">891</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Following
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="videos" className="mt-6">
              <TabsList className="w-full brutalist-box bg-white dark:bg-black">
                <TabsTrigger
                  value="videos"
                  className="flex-1 data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex-1 data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
                >
                  <BookMarked className="h-4 w-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>
              <TabsContent value="videos" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                    >
                      <VideoThumbnail
                        video={video}
                        onClick={() => setSelectedVideo(video.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="saved" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Saved videos will go here */}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoCard video={videos.find((v) => v.id === selectedVideo)!} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
