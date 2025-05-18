"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, Grid, BookMarked, X } from "lucide-react";
import { lensClient } from "@/lib/lens";
import { fetchAccount, fetchPosts, fetchFollowers, fetchFollowing } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import FollowButton from "@/components/follow-button";
import AnimatedLogo from "@/components/animated-logo";

type AccountData = {
  address: string;
  username?: {
    localName: string;
  } | null;
  metadata?: {
    name?: string | null;
    bio?: string | null;
    picture?: string | null;
    coverPicture?: string | null;
  };
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
};

type VideoPost = {
  id: string;
  slug: string;
  metadata?: {
    title?: string | null;
    video?: {
      item: string;
    } | null;
    coverPicture?: string | null;
  };
};

type Follower = {
  follower: {
    address: string;
    username?: {
      localName: string;
    } | null;
    metadata?: {
      name?: string | null;
      picture?: string | null;
    };
  };
  followedOn: string;
};

type Following = {
  following: {
    address: string;
    username?: {
      localName: string;
    } | null;
    metadata?: {
      name?: string | null;
      picture?: string | null;
    };
  };
  followedOn: string;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Following[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const result = await fetchAccount(lensClient, {
          username: {
            localName: params.username as string,
          },
        });

        if (result.isErr()) {
          setError(result.error.message);
          return;
        }

        const accountData = result.value;
        if (!accountData) {
          setError("Account not found");
          return;
        }
        
        // Transform the account data to our simplified type
        const transformedData: AccountData = {
          address: accountData.address,
          username: accountData.username ? {
            localName: accountData.username.localName,
          } : null,
          metadata: accountData.metadata ? {
            name: accountData.metadata.name,
            bio: accountData.metadata.bio,
            picture: accountData.metadata.picture,
            coverPicture: accountData.metadata.coverPicture,
          } : undefined,
          stats: {
            followers: 0,
            following: 0,
            posts: 0,
          },
        };

        setAccount(transformedData);

        // Fetch followers
        const followersResult = await fetchFollowers(lensClient, {
          account: evmAddress(accountData.address),
        });

        if (followersResult.isOk()) {
          const followersList = followersResult.value.items.map(item => ({
            follower: {
              address: item.follower.address,
              username: item.follower.username ? {
                localName: item.follower.username.localName,
              } : null,
              metadata: item.follower.metadata ? {
                name: item.follower.metadata.name,
                picture: item.follower.metadata.picture,
              } : undefined,
            },
            followedOn: item.followedOn,
          }));
          setFollowers(followersList);
          if (transformedData.stats) {
            transformedData.stats.followers = followersList.length;
          }
        }

        // Fetch following
        const followingResult = await fetchFollowing(lensClient, {
          account: evmAddress(accountData.address),
        });

        if (followingResult.isOk()) {
          const followingList = followingResult.value.items.map(item => ({
            following: {
              address: item.following.address,
              username: item.following.username ? {
                localName: item.following.username.localName,
              } : null,
              metadata: item.following.metadata ? {
                name: item.following.metadata.name,
                picture: item.following.metadata.picture,
              } : undefined,
            },
            followedOn: item.followedOn,
          }));
          setFollowing(followingList);
          if (transformedData.stats) {
            transformedData.stats.following = followingList.length;
          }
        }

        setAccount(transformedData);

        // Fetch user's videos/posts
        const postsResult = await fetchPosts(lensClient, {
          filter: {
            authors: [accountData.address],
          },
        });

        if (postsResult.isErr()) {
          console.error("Error fetching posts:", postsResult.error);
          return;
        }

        // Filter for video posts and transform to our VideoPost type
        const videoPosts: VideoPost[] = postsResult.value.items
          .filter((post: any) => post.metadata?.__typename === "VideoMetadata")
          .map((post: any) => ({
            id: post.id,
            slug: post.slug,
            metadata: {
              title: post.metadata?.title || null,
              video: post.metadata?.video ? {
                item: post.metadata.video.item,
              } : null,
              coverPicture: post.metadata?.coverPicture || null,
            },
          }));
        setVideos(videoPosts);
      } catch (err) {
        setError("Failed to fetch account");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.username) {
      fetchAccountData();
    }
  }, [params.username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f5f5f5] dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004aad]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f5f5f5] dark:bg-black">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-[#f5f5f5] dark:bg-black fixed inset-0">
      <div className="w-full max-w-[420px] h-full flex flex-col bg-[#ffffff] dark:bg-black">
        <header
          className="flex justify-center p-4 border-b safe-top backdrop-blur-lg bg-opacity-80 relative"
          style={{ borderColor: `${"#004aad"}33` }}
        >
          <button onClick={() => router.back()} className="absolute left-4 top-1/2 -translate-y-1/2">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          
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
            className="w-full px-4 pb-20 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {account && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-20 h-20 border-2 border-black dark:border-white">
                    <AvatarImage 
                      src={account.metadata?.picture || account.metadata?.coverPicture || "/placeholder.svg"} 
                    />
                    <AvatarFallback>
                      {account.metadata?.name?.[0]?.toUpperCase() || account.username?.localName?.[0]?.toUpperCase() || account.address.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h1 className="text-xl font-bold">
                      {account.metadata?.name || account.username?.localName || account.address.slice(0, 6) + "..." + account.address.slice(-4)}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {account.metadata?.bio || "No bio available"}
                    </p>
                  </div>
                  <FollowButton profileId={account.address} />
                </div>

                {/* Stats */}
                <div className="flex justify-around border-y py-4">
                  <div className="text-center">
                    <div className="font-bold">{videos.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:opacity-80"
                    onClick={() => setShowFollowers(true)}
                  >
                    <div className="font-bold">{account.stats?.followers || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:opacity-80"
                    onClick={() => setShowFollowing(true)}
                  >
                    <div className="font-bold">{account.stats?.following || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="videos" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="videos" className="flex items-center justify-center">
                      <Grid className="h-4 w-4 mr-2" />
                      Videos    
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
                         
                        >
                          <video
                            onClick={() => router.push(`/post/${video.slug}`)}
                            src={video.metadata?.video?.item}
                            className="w-full aspect-video rounded brutalist-box"
                            controls={false}
                            poster={video.metadata?.coverPicture || undefined}
                          />
                          <div className="mt-2 text-sm font-semibold">
                            {video.metadata?.title || "Untitled Video"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                 
                </Tabs>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Video Modal */}
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
            className="w-full max-w-3xl bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const video = videos.find((v) => v.id === selectedVideo);
              if (!video) return null;
              return (
                <video
                  src={video.metadata?.video?.item}
                  className="w-full aspect-video"
                  controls
                  autoPlay
                />
              );
            })()}
          </motion.div>
        </motion.div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFollowers(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-md bg-white dark:bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Followers</h2>
              <button onClick={() => setShowFollowers(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {followers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No followers yet</div>
              ) : (
                followers.map((follower) => (
                  <div
                    key={follower.follower.address}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={follower.follower.metadata?.picture || undefined} />
                      <AvatarFallback>
                        {follower.follower.metadata?.name?.[0]?.toUpperCase() || 
                         follower.follower.username?.localName?.[0]?.toUpperCase() || 
                         follower.follower.address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {follower.follower.metadata?.name || 
                         follower.follower.username?.localName || 
                         `${follower.follower.address.slice(0, 6)}...${follower.follower.address.slice(-4)}`}
                      </div>
                    </div>
                    <FollowButton profileId={follower.follower.address} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFollowing(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-md bg-white dark:bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Following</h2>
              <button onClick={() => setShowFollowing(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {following.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Not following anyone</div>
              ) : (
                following.map((follow) => (
                  <div
                    key={follow.following.address}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={follow.following.metadata?.picture || undefined} />
                      <AvatarFallback>
                        {follow.following.metadata?.name?.[0]?.toUpperCase() || 
                         follow.following.username?.localName?.[0]?.toUpperCase() || 
                         follow.following.address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {follow.following.metadata?.name || 
                         follow.following.username?.localName || 
                         `${follow.following.address.slice(0, 6)}...${follow.following.address.slice(-4)}`}
                      </div>
                    </div>
                    <FollowButton profileId={follow.following.address} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
