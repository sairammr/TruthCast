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
import { addReaction, undoReaction, fetchPostReactions } from "@lens-protocol/client/actions";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { useLensStore } from "@/lib/useLensStore";
import { lensClient } from "@/lib/lens";
import { signMessageWith } from "@lens-protocol/client/viem";
import FollowButton from "./follow-button";

interface VideoCardProps {
  video: {
    id: string;
    username: string;
    videoUrl: string;
    caption: string;
    likes: number;
    comments: number;
    authorId: string;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showComments, setShowComments] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();



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
              item.account.address.toLowerCase() === lensAccountAddress.toLowerCase()
          );
          setLiked(!!userReaction);
          console.log('[Lens] Reaction fetch', {
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
        console.error('[Lens] Reaction fetch error', err);
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
        console.log('Reacting to video:', video);
        console.log('video.id:', video.id, typeof video.id);
        const pid = postId(video.id);
        console.log('postId(video.id):', pid, typeof pid);
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
          fetchPostReactions(lensClient, { post: postId(video.id), filter: { anyOf: [PostReactionType.Upvote] } }).then((result) => {
            if (result.isOk()) {
              const { items } = result.value;
              const userReaction = items.find(
                (item) =>
                  item.account.address.toLowerCase() === lensAccountAddress.toLowerCase()
              );
              setLiked(!!userReaction);
              console.log('[Lens] Reaction re-fetch after upvote', {
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
        console.log('Undo reaction for video:', video);
        console.log('video.id:', video.id, typeof video.id);
        const pid = postId(video.id);
        console.log('postId(video.id):', pid, typeof pid);
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
          fetchPostReactions(lensClient, { post: postId(video.id), filter: { anyOf: [PostReactionType.Upvote] } }).then((result) => {
            if (result.isOk()) {
              const { items } = result.value;
              const userReaction = items.find(
                (item) =>
                  item.account.address.toLowerCase() === lensAccountAddress.toLowerCase()
              );
              setLiked(!!userReaction);
              console.log('[Lens] Reaction re-fetch after unlike', {
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
    <Card className="mb-6 brutalist-card overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center space-x-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Avatar className="w-10 h-10 border-2 border-black dark:border-white">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>{video.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </motion.div>
          <div>
            <p className="font-bold">@{video.username}</p>
          </div>
          <FollowButton profileId={video.authorId} />
        </div>
        <p className="mt-2 text-gray-800 dark:text-gray-200">{video.caption}</p>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <div className="relative w-full aspect-video bg-black">
          <video
            src={video.videoUrl}
            poster="/placeholder.svg?height=720&width=1280"
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between">
        <div className="flex space-x-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 px-2 font-bold"
              onClick={handleLike}
            >
              <motion.div
                animate={liked ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`h-5 w-5 ${
                    liked ? "fill-[#10b981] text-[#10b981]" : ""
                  }`}
                />
              </motion.div>
              <span>{likeCount}</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 px-2 font-bold"
              onClick={() => setShowComments((prev) => !prev)}
              aria-label="Show comments"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{video.comments}</span>
            </Button>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="px-2 brutalist-box bg-white dark:bg-black"
          >
            <Share2 className="h-5 w-6" />
          </Button>
        </motion.div>
      </CardFooter>
      {showComments && (
        <div className="px-4 pb-4">
          <CommentSection postid={video.id} initialComments={[]} />
        </div>
      )}
    </Card>
  );
}
