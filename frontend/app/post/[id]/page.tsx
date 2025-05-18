"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, ArrowLeftIcon, Play, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { lensClient } from "@/lib/lens";
import { fetchPost, addReaction, undoReaction, fetchPostReactions } from "@lens-protocol/client/actions";
import { postId, PostReactionType } from "@lens-protocol/client";
import AnimatedLogo from "@/components/animated-logo";
import { formatDistanceToNow } from "date-fns";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import CommentSection from "@/components/comment-section";

type PostData = {
  id: string;
  author: {
    address: string;
    username?: {
      localName: string;
    } | null;
    metadata?: {
      name?: string | null;
      picture?: string | null;
    };
  };
  metadata: {
    content: string;
    title?: string | null;
    video?: {
      item: string;
    };
    coverPicture?: string | null;
    createdAt?: string | null;
  };
  stats: {
    upvotes: number;
    comments: number;
  };
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const result = await fetchPost(lensClient, {
          post: postId(params.id as string),
        });

        if (result.isErr()) {
          setError(result.error.message);
          return;
        }

        const postData = result.value as PostData;
        console.log('postData', postData);
        
        if (!postData?.author?.address || !postData?.metadata?.video?.item) {
          setError("Invalid post data format");
          return;
        }

        setPost(postData);
        setLikeCount(postData.stats.upvotes);
      } catch (err) {
        setError("Failed to fetch post");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPostData();
    }
  }, [params.id]);

  // Fetch user's reaction status
  useEffect(() => {
    const fetchReaction = async () => {
      if (!address || !post) return;
      try {
        const lensAccountAddress = localStorage.getItem("lensAccountAddress");
        if (!lensAccountAddress) {
          setIsLiked(false);
          return;
        }
        const result = await fetchPostReactions(lensClient, {
          post: postId(post.id),
          filter: { anyOf: [PostReactionType.Upvote] },
        });
        if (result.isOk()) {
          const { items } = result.value;
          const userReaction = items.find(
            (item) =>
              item.account.address.toLowerCase() === lensAccountAddress.toLowerCase()
          );
          setIsLiked(!!userReaction);
        }
      } catch (err) {
        console.error('[Lens] Reaction fetch error', err);
      }
    };
    fetchReaction();
  }, [address, post]);

  const handleLike = async () => {
    if (!address || !isConnected || !post) {
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

    try {
      if (!isLiked) {
        const result = await addReaction(sessionClient, {
          post: postId(post.id),
          reaction: PostReactionType.Upvote,
        });
        if (result.isErr()) {
          toast.error("Failed to upvote");
          return;
        }
        setLikeCount(prev => prev + 1);
        toast.success("Upvoted!");
      } else {
        const result = await undoReaction(sessionClient, {
          post: postId(post.id),
          reaction: PostReactionType.Upvote,
        });
        if (result.isErr()) {
          toast.error("Failed to remove upvote");
          return;
        }
        setLikeCount(prev => prev - 1);
        toast.success("Upvote removed!");
      }
      setIsLiked(!isLiked);
    } catch (error) {
      toast.error("Error updating reaction");
      console.error(error);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

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
          className="flex justify-center p-4 border-b safe-top backdrop-blur-lg bg-opacity-80"
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
          {post && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              {/* Video Section */}
              <div className="relative aspect-video bg-black">
                <video
                  src={post.metadata.video?.item}
                  className="w-full h-full object-contain"
                  poster={post.metadata.coverPicture || undefined}
                  controls={false}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                />

              </div>

              {/* Content Section */}
              <div className="flex-1 p-4 space-y-6">
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12 border-2 border-black dark:border-white">
                      <AvatarImage src={post.author.metadata?.picture || undefined} />
                      <AvatarFallback>
                        {post.author.metadata?.name?.[0]?.toUpperCase() || 
                         post.author.username?.localName?.[0]?.toUpperCase() || 
                         post.author.address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {post.author.metadata?.name || 
                         post.author.username?.localName || 
                         `${post.author.address.slice(0, 6)}...${post.author.address.slice(-4)}`}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(post.metadata.createdAt)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Report</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  {post.metadata.title && (
                    <h1 className="text-2xl font-bold">{post.metadata.title}</h1>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {post.metadata.content}
                  </p>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-6">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center space-x-2 ${isLiked ? "text-red-500" : ""}`}
                        onClick={handleLike}
                      >
                        <motion.div
                          animate={isLiked ? { scale: [1, 1.5, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
                        </motion.div>
                        <span>{likeCount}</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span>{post.stats.comments}</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 brutalist-box bg-white dark:bg-black"
                      >
                        <Share2 className="w-6 h-6" />
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <CommentSection postid={post.id} />
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
