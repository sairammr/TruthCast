"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import CommentSection from "@/components/comment-section";
import { motion } from "framer-motion";
import { PostReactionType, postId } from "@lens-protocol/client";
import {
  addReaction,
  undoReaction,
  fetchPostReactions,
} from "@lens-protocol/client/actions";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { useLensStore } from "@/lib/useLensStore";
import { lensClient } from "@/lib/lens";
import { signMessageWith } from "@lens-protocol/client/viem";
import FollowButton from "./follow-button";
import { useRouter } from "next/navigation";

interface VideoCardProps {
  video: {
    id: string;
    username: string;
    slug: string;
    videoUrl: string;
    caption: string;
    title: string;
    tags: string[];
    likes: number;
    comments: number;
    authorId: string;
    author: {
      name: string;
      bio: string;
      picture: string;
    };
  };
}

// Function to convert Lens URI to HTTP URL
const getLensUrl = (uri: string) => {
  if (!uri) return "";
  if (uri.startsWith("lens://")) {
    return `https://arweave.net/${uri.replace("lens://", "")}`;
  }
  return uri;
};

export default function VideoCard({ video }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showComments, setShowComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  // Fetch user's reaction status on mount or when address/video.id changes
  useEffect(() => {
    const fetchReaction = async () => {
      if (!address) {
        setLiked(false);
        return;
      }
      try {
        const lensAccountAddress = localStorage.getItem("lensAccountAddress");
        if (!lensAccountAddress) {
          setLiked(false);
          return;
        }
        const result = await fetchPostReactions(lensClient, {
          post: postId(video.id),
          filter: { anyOf: [PostReactionType.Upvote] },
        });
        if (result.isOk()) {
          const { items } = result.value;
          const userReaction = items.find(
            (item) =>
              item.account.address.toLowerCase() ===
              lensAccountAddress.toLowerCase()
          );
          setLiked(!!userReaction);
          console.log("[Lens] Reaction fetch", {
            lensAccountAddress,
            videoId: video.id,
            liked: !!userReaction,
            items,
          });
        } else {
          setLiked(false);
        }
      } catch (err) {
        setLiked(false);
        console.error("[Lens] Reaction fetch error", err);
      }
    };
    fetchReaction();
  }, [address, video.id]);

  const handleLike = async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!walletClient) {
      toast.error("Wallet client not available");
      return;
    }

    const resumed = await lensClient.resumeSession();
    if (resumed.isErr()) {
      return console.error(resumed.error);
    }
    const sessionClient = resumed.value;
    //  if (!sessionClient) {
    //   const loginResult = await lensClient.login({
    //     accountOwner: {
    //       app: process.env.NEXT_PUBLIC_LENS_APP_ID,
    //       owner: address,
    //       account: localStorage.getItem("lensAccountAddress"),
    //     },
    //     signMessage: signMessageWith(walletClient),
    //   });
    //   if (loginResult.isErr()) {
    //     toast.error("Lens authentication failed");
    //     return;
    //   }
    //   sessionClient = loginResult.value;
    //   return;
    // }
    try {
      if (!liked) {
        // Add upvote
        console.log("Reacting to video:", video);
        console.log("video.id:", video.id, typeof video.id);
        const pid = postId(video.id);
        console.log("postId(video.id):", pid, typeof pid);
        const result = await addReaction(sessionClient, {
          post: pid,
          reaction: PostReactionType.Upvote,
        });
        if (result.isErr()) {
          toast.error("Failed to upvote");
          return;
        }
        setLikeCount(likeCount + 1);
        // Re-fetch reaction to ensure backend state is reflected
        setTimeout(() => {
          const lensAccountAddress = localStorage.getItem("lensAccountAddress");
          if (!lensAccountAddress) {
            setLiked(false);
            return;
          }
          fetchPostReactions(lensClient, {
            post: postId(video.slug),
            filter: { anyOf: [PostReactionType.Upvote] },
          }).then((result) => {
            if (result.isOk()) {
              const { items } = result.value;
              const userReaction = items.find(
                (item) =>
                  item.account.address.toLowerCase() ===
                  lensAccountAddress.toLowerCase()
              );
              setLiked(!!userReaction);
              console.log("[Lens] Reaction re-fetch after upvote", {
                lensAccountAddress,
                videoId: video.id,
                liked: !!userReaction,
                items,
              });
            }
          });
        }, 800);
        toast.success("Upvoted!");
      } else {
        // Undo upvote
        console.log("Undo reaction for video:", video);
        console.log("video.id:", video.id, typeof video.id);
        const pid = postId(video.id);
        console.log("postId(video.id):", pid, typeof pid);
        const result = await undoReaction(sessionClient, {
          post: pid,
          reaction: PostReactionType.Upvote,
        });
        if (result.isErr()) {
          toast.error("Failed to remove upvote");
          return;
        }
        setLikeCount(likeCount - 1);
        // Re-fetch reaction to ensure backend state is reflected
        setTimeout(() => {
          const lensAccountAddress = localStorage.getItem("lensAccountAddress");
          if (!lensAccountAddress) {
            setLiked(false);
            return;
          }
          fetchPostReactions(lensClient, {
            post: postId(video.id),
            filter: { anyOf: [PostReactionType.Upvote] },
          }).then((result) => {
            if (result.isOk()) {
              const { items } = result.value;
              const userReaction = items.find(
                (item) =>
                  item.account.address.toLowerCase() ===
                  lensAccountAddress.toLowerCase()
              );
              setLiked(!!userReaction);
              console.log("[Lens] Reaction re-fetch after unlike", {
                lensAccountAddress,
                videoId: video.id,
                liked: !!userReaction,
                items,
              });
            }
          });
        }, 800);
        toast.success("Upvote removed!");
      }
    } catch (error) {
      toast.error("Error updating reaction");
      console.error(error);
    }
  };

  return (
    <Card className="brutalist-card bg-white dark:bg-black rounded-none border-0 border-b-4 border-black dark:border-white mb-0 p-0">
      <CardHeader className="p-5 pb-2 border-0 bg-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/profile/${video.username}`)}
              className="cursor-pointer"
            >
              <Avatar className="w-12 h-12 border-2 border-black dark:border-white brutalist-box">
                <AvatarImage
                  src={
                    getLensUrl(video.author.picture) ||
                    "/placeholder.svg?height=48&width=48"
                  }
                />
                <AvatarFallback>
                  {video.author.name?.charAt(0).toUpperCase() ||
                    video.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="min-w-0">
              <p className="font-bold text-lg truncate text-black dark:text-white">
                {video.author.name || `@${video.username}`}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                @{video.username}
              </p>
            </div>
          </div>
          <FollowButton profileId={video.authorId} />
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-black">
        <div className="relative w-full aspect-video bg-black overflow-hidden brutalist-box">
          <video
            src={video.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>


      </CardContent>
      {video.caption && (
        <div className="mt-3 px-5">
          <p className="text-black dark:text-white text-base text-sm font-bold leading-snug break-words  rounded-md">
            {showFullCaption || video.caption.length <= 120
              ? video.caption
              : video.caption.slice(0, 120) + "..."}
          </p>
          {video.caption.length > 120 && (
            <button
              className=" text-blue-700 dark:text-blue-400 font-bold underline text-sm py-1 rounded"
              onClick={() => setShowFullCaption((prev) => !prev)}
              type="button"
            >
              {showFullCaption ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}
      <CardFooter className="p-5 flex justify-between items-center border-0 bg-transparent">
        <div className="flex space-x-6">
          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded brutalist-box p-2 border-2 border-black dark:border-white ${
                liked
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-white dark:bg-black"
              }`}
              onClick={handleLike}
              aria-label="Like"
            >
              <Heart
                className={`h-6 w-6 transition-colors ${
                  liked
                    ? "fill-[#10b981] text-[#10b981]"
                    : "text-black dark:text-white"
                }`}
              />
            </Button>
            <span className="ml-2 text-black dark:text-white font-bold align-middle">
              {likeCount}
            </span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded brutalist-box p-2 border-2 border-black dark:border-white bg-white dark:bg-black"
              onClick={() => setShowComments((prev) => !prev)}
              aria-label="Show comments"
            >
              <MessageCircle className="h-6 w-6 text-black dark:text-white" />
            </Button>
            <span className="ml-2 text-black dark:text-white font-bold align-middle">
              {video.comments}
            </span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded brutalist-box p-2 border-2 border-black dark:border-white bg-white dark:bg-black"
              asChild
              aria-label="Download"
            >
              <a
                href={`/api/download-video?url=${encodeURIComponent(video.videoUrl)}`}
                className="rounded brutalist-box p-2 border-2 border-black dark:border-white bg-white dark:bg-black inline-flex items-center justify-center"
                aria-label="Download"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
              </a>

            </Button>
          </motion.div>
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded brutalist-box p-2 border-2 border-black dark:border-white bg-white dark:bg-black"
            aria-label="Share"
          >
            <Share2 className="h-6 w-6 text-black dark:text-white" />
          </Button>
        </motion.div>
      </CardFooter>
      {!showComments && (
        <div className="px-5 pb-5">
          <CommentSection postid={video.id} initialComments={[]} />
        </div>
      )}
    </Card>
  );
}
