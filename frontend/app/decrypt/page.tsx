"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface VideoMetadata {
  borderData?: string;
  contentHash?: string;
  videoId?: string;
}

export default function VideoDecryption() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Handle file selection
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);

      // Create a preview URL for the uploaded video
      const previewUrl = URL.createObjectURL(file);
      setVideoUrl(previewUrl);
      setShowVideoPreview(true);
    }
  };

  // Handle decrypt submit
  const handleDecrypt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!videoFile) {
      setError("Please select a video file to decrypt");
      return;
    }

    setIsLoading(true);
    setError("");
    setDecryptedMessage("");
    setMetadata(null);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      console.log("Attempting regular decryption...");
      const response = await fetch(`${SERVER_URL}/decrypt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decrypt message");
      }

      const result = await response.json();
      console.log("Decryption response:", result);

      if (result.border_data) {
        setDecryptedMessage(result.border_data);
        setError("");
        toast.success("Message decrypted successfully!");
      } else {
        throw new Error("No decrypted text found in response");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Decryption error:", errorMessage);
      setError(`Decryption failed: ${errorMessage}`);
      toast.error("Failed to decrypt message");
    } finally {
      setIsLoading(false);
    }
  };

  // URL for the server
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 bg-[#10b981] rounded-full opacity-20"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-32 h-32 bg-[#10b981] rounded-full opacity-20"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />

      {/* Header */}
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
            DECRYPT <span className="text-[#10b981]">VIDEO</span>
          </h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="brutalist-box p-8 bg-white dark:bg-black"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            {/* File upload section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-[#10b981] transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full text-gray-700"
                />
                {videoFile && (
                  <div className="mt-2 text-sm text-gray-700">
                    Selected:{" "}
                    <span className="font-medium">{videoFile.name}</span> (
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            {/* Decrypt button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <form onSubmit={handleDecrypt}>
                <Button
                  type="submit"
                  disabled={isLoading || !videoFile}
                  className="w-full brutalist-button"
                >
                  {isLoading ? "Decrypting..." : "Decrypt Message"}
                </Button>
              </form>
            </motion.div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
                {error}
              </div>
            )}

            {/* Video preview section */}
            {showVideoPreview && videoUrl && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Video Preview</h2>
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Decrypted message */}
            {decryptedMessage && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-4">
                  Decrypted Message
                </h2>
                <motion.div
                  className="p-6 bg-[#10b981]/10 rounded-lg border-2 border-[#10b981] text-gray-800 dark:text-gray-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="font-mono text-lg break-words whitespace-pre-wrap">
                    {decryptedMessage}
                  </div>
                  <motion.div
                    className="mt-4 flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedMessage);
                        toast.success("Message copied to clipboard!");
                      }}
                      className="brutalist-button"
                    >
                      Copy Message
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Metadata section */}
            {metadata && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-4">Video Metadata</h2>
                <motion.div
                  className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="space-y-2">
                    {metadata.videoId && (
                      <div>
                        <span className="font-semibold">Video ID:</span>
                        <p className="font-mono text-sm break-all mt-1">
                          {metadata.videoId}
                        </p>
                      </div>
                    )}
                    {metadata.contentHash && (
                      <div>
                        <span className="font-semibold">Content Hash:</span>
                        <p className="font-mono text-sm break-all mt-1">
                          {metadata.contentHash}
                        </p>
                      </div>
                    )}
                    {metadata.borderData && (
                      <div>
                        <span className="font-semibold">Raw Border Data:</span>
                        <p className="font-mono text-sm break-all mt-1">
                          {metadata.borderData}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
