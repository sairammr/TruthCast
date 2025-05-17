"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";

interface VideoThumbnailProps {
  video: {
    id: number;
    videoUrl: string;
    caption: string;
    likes: number;
    comments: number;
  };
  onClick: () => void;
}

export default function VideoThumbnail({
  video,
  onClick,
}: VideoThumbnailProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative aspect-video bg-black/5 rounded-lg overflow-hidden cursor-pointer"
    >
      <img
        src={video.videoUrl}
        alt={video.caption}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-white text-sm">
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4" />
          <span>{video.likes}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>{video.comments}</span>
        </div>
      </div>
    </motion.div>
  );
}
