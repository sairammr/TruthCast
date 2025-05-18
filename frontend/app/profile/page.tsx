"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Grid, BookMarked, ArrowLeft, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { evmAddress } from "@lens-protocol/client";
import { fetchAccount, fetchPosts } from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens";
import Header from "@/components/header";

export default function ProfilePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [ensName, setEnsName] = useState<string>("");
  const [lensProfile, setLensProfile] = useState<any>(null);

  useEffect(() => {
    // Get account address from localStorage
    const address = localStorage.getItem("lensAccountAddress");
    if (address) {
      console.log(address);
      setAccountAddress(address);
      
      // Fetch Lens profile details
      (async () => {
        try {
          const result = await fetchAccount(lensClient, {
            address: evmAddress(address),
          });
          if (result.isErr()) {
            console.error("Lens fetchAccount error:", result.error);
          } else {
            console.log("Lens profile/account:", result.value);
            setLensProfile(result.value);
          }
        } catch (err) {
          console.error("Error fetching Lens profile/account:", err);
        }
      })();

      // Fetch user's videos/posts
      (async () => {
        try {
          const result = await fetchPosts(lensClient, {
            filter: {
              authors: [evmAddress(address)],
            },
          });
          if (result.isErr()) {
            console.error("Lens fetchPosts error:", result.error);
          } else {
            // Only keep posts with VideoMetadata
            const items = result.value.items.filter(
              (post: any) => post.metadata?.__typename === "VideoMetadata"
            );
            setVideos(items);
          }
        } catch (err) {
          console.error("Error fetching Lens posts:", err);
        }
      })();
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("accountAddress");
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full fixed inset-0 bg-[#f5f5f5] dark:bg-black max-w-[420px] mx-auto mt-[60px]">


      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="container max-w-3xl mx-auto px-4 pb-20">
          <motion.div
            className="py-6 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Avatar className="w-20 h-20 border-2 border-black dark:border-white mb-4">
              <AvatarImage src={lensProfile?.metadata?.picture || lensProfile?.metadata?.coverPicture || "/placeholder.svg?height=80&width=80"} />
              <AvatarFallback>
                {(lensProfile?.metadata?.name?.charAt(0) || accountAddress.slice(0, 2).toUpperCase() || "?")}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">
              {lensProfile?.metadata?.name || ensName || `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center font-mono">
              {lensProfile?.metadata?.bio || "No bio available."}
            </p>
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
                  className="flex-1 data-[state=active]:bg-[#004aad] data-[state=active]:text-white"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex-1 data-[state=active]:bg-[#004aad] data-[state=active]:text-white"
                >
                  <BookMarked className="h-4 w-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>
              <TabsContent value="videos" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {videos.length === 0 && (
                    <div className="col-span-full text-center text-gray-500">No videos found.</div>
                  )}
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="cursor-pointer"
                      onClick={() => router.push(`/post/${video.slug}`)}
                    >
                      <video
                        src={video.metadata?.video?.item}
                        className="w-full aspect-video rounded brutalist-box"
                        controls={false}
                        poster={video.metadata?.coverPicture || undefined}
                      />
                      <div className="mt-2 text-sm font-semibold">{video.metadata?.title || "Untitled Video"}</div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="saved" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      router.push("/upload");
                    }}
                  >
                    trasnaction
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

    </div>
  );
}
