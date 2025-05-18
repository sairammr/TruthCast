"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoCard from "@/components/video-card";
import { lensClient } from "@/lib/lens";
import { fetchPost } from "@lens-protocol/client/actions";
import { postId } from "@lens-protocol/client";
import { Video } from "@/types/video";
import Navigation from "@/components/navigation";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";
import { ArrowLeftIcon } from "lucide-react";

type PostData = {
  id: string;
  author: {
    address: string;
    username?: {
      localName: string;
    } | null;
  };
  metadata: {
    content: string;
    video?: {
      item: string;
    };
  };
  stats: {
    upvotes: number;
    comments: number;
  };
};

export default function PostPage() {
  const params = useParams();
  const [post, setPost] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
        
        // Check if postData has the required properties
        if (!postData?.author?.address || !postData?.metadata?.video?.item) {
          setError("Invalid post data format");
          return;
        }
        
        // Transform Lens post data to Video type
        const video: Video = {
          id: postData.id,
          username: postData.author.username?.localName || postData.author.address.slice(0, 6) + "..." + postData.author.address.slice(-4),
          videoUrl: postData.metadata.video.item,
          caption: postData.metadata.content || "",
          likes: postData.stats.upvotes,
          comments: postData.stats.comments,
          authorId: postData.author.address,
        };

        setPost(video);
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
          <motion.div
            className="w-full px-4 pb-20 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {post && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <VideoCard video={post} />
              </motion.div>
            )}
          </motion.div>
        </main>

       
      </div>
    </div>
  );
}
