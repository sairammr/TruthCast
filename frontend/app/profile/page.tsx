"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Grid, BookMarked, ArrowLeft, LogOut, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { evmAddress } from "@lens-protocol/client";
import {
  fetchAccount,
  fetchPosts,
  fetchFollowers,
  fetchFollowing,
} from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens";
import Header from "@/components/header";

export default function ProfilePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [ensName, setEnsName] = useState<string>("");
  const [lensProfile, setLensProfile] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

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

            // Fetch followers
            const followersResult = await fetchFollowers(lensClient, {
              account: evmAddress(address),
            });
            if (followersResult.isOk()) {
              setFollowers([...followersResult.value.items]);
            }

            // Fetch following
            const followingResult = await fetchFollowing(lensClient, {
              account: evmAddress(address),
            });
            if (followingResult.isOk()) {
              setFollowing([...followingResult.value.items]);
            }
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
        <div className="container max-w-3xl mx-auto px-0 pb-20">
          <motion.div
            className="py-6 flex flex-col items-center bg-white dark:bg-black border border-black dark:border-white rounded-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Avatar className="w-20 h-20 border border-black dark:border-white mb-3">
              <AvatarImage
                src={
                  lensProfile?.metadata?.picture ||
                  lensProfile?.metadata?.coverPicture ||
                  "/placeholder.svg?height=80&width=80"
                }
              />
              <AvatarFallback>
                {lensProfile?.metadata?.name?.charAt(0) ||
                  accountAddress.slice(0, 2).toUpperCase() ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-black dark:text-white px-2 mb-1">
              {lensProfile?.metadata?.name ||
                ensName ||
                `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-mono text-sm px-2 mb-1">
              @{lensProfile?.username?.localName || accountAddress.slice(0, 8)}
            </p>
            <p className="text-black dark:text-white text-center font-mono px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded max-w-xs text-sm mb-2">
              {lensProfile?.metadata?.bio || "No bio available."}
            </p>
            <div className="flex justify-center gap-6 mt-4 w-full">
              <div className="text-center px-2 py-1 border border-black dark:border-white bg-white dark:bg-black rounded">
                <div className="font-bold text-base text-black dark:text-white">
                  {videos.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Posts
                </div>
              </div>
              <div
                className="text-center px-2 py-1 border border-black dark:border-white bg-white dark:bg-black rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800"
                onClick={() => setShowFollowers(true)}
              >
                <div className="font-bold text-base text-black dark:text-white">
                  {followers.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Followers
                </div>
              </div>
              <div
                className="text-center px-2 py-1 border border-black dark:border-white bg-white dark:bg-black rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800"
                onClick={() => setShowFollowing(true)}
              >
                <div className="font-bold text-base text-black dark:text-white">
                  {following.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Following
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleLogout}
                className="border border-black dark:border-white bg-red-500 text-white font-bold px-4 py-1 rounded"
              >
                Logout
              </Button>
              <Button className="border border-black dark:border-white bg-gray-200 dark:bg-neutral-700 text-black dark:text-white font-bold px-4 py-1 rounded">
                Settings
              </Button>
            </div>
          </motion.div>

          {/* Followers Modal */}
          {showFollowers && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg p-4 w-full max-w-sm mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Followers</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFollowers(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {followers.map((follower) => (
                    <div
                      key={follower.follower.address}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={follower.follower.metadata?.picture}
                        />
                        <AvatarFallback>
                          {follower.follower.metadata?.name?.charAt(0) ||
                            follower.follower.address.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">
                          {follower.follower.metadata?.name ||
                            `${follower.follower.address.slice(
                              0,
                              6
                            )}...${follower.follower.address.slice(-4)}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{follower.follower.username?.localName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Following Modal */}
          {showFollowing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg p-4 w-full max-w-sm mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Following</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFollowing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {following.map((follow) => (
                    <div
                      key={follow.following.address}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={follow.following.metadata?.picture} />
                        <AvatarFallback>
                          {follow.following.metadata?.name?.charAt(0) ||
                            follow.following.address.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">
                          {follow.following.metadata?.name ||
                            `${follow.following.address.slice(
                              0,
                              6
                            )}...${follow.following.address.slice(-4)}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{follow.following.username?.localName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="videos" className="mt-0">
              <TabsList className="w-full border border-black dark:border-white rounded bg-white dark:bg-black">
                <TabsTrigger
                  value="videos"
                  className="flex-1 data-[state=active]:bg-[#004aad] data-[state=active]:text-white font-bold"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex-1 data-[state=active]:bg-[#004aad] data-[state=active]:text-white font-bold"
                >
                  <BookMarked className="h-4 w-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>
              <TabsContent value="videos" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {videos.length === 0 && (
                    <div className="col-span-full text-center text-gray-500">
                      No videos found.
                    </div>
                  )}
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="cursor-pointer border border-black dark:border-white bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors rounded"
                      onClick={() => router.push(`/post/${video.slug}`)}
                    >
                      <video
                        src={video.metadata?.video?.item}
                        className="w-full aspect-video rounded-t border-b border-black dark:border-white"
                        controls={false}
                        poster={video.metadata?.coverPicture || undefined}
                      />
                      <div className="mt-1 text-xs font-bold text-black dark:text-white px-2 py-1 truncate">
                        {video.metadata?.title || "Untitled Video"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="saved" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => {
                      
                    }}
                    className="border border-black dark:border-white bg-[#004aad] text-white font-bold px-3 py-1 rounded"
                  >
                    Upload
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
