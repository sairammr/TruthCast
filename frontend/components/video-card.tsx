"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface VideoCardProps {
  video: {
    id: number;
    username: string;
    videoUrl: string;
    caption: string;
    likes: number;
    comments: number;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
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
    </Card>
  );
}
