"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FlipHorizontal, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        audio: true,
        video: { facingMode },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const videoURL = URL.createObjectURL(blob);
      setRecordedVideo(videoURL);
      stopCamera();
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processVideo = async () => {
    setIsProcessing(true);

    // Mock API call to process video
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, you would upload the video to your API endpoint
    // and get back a processed video URL

    setIsProcessing(false);
    router.push("/feed");
  };

  const resetRecording = () => {
    setRecordedVideo(null);
    startCamera();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black">
      <motion.header
        className="sticky top-0 z-10 flex items-center p-4 bg-[#f5f5f5] dark:bg-black border-b-2 border-black dark:border-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/feed")}
            className="brutalist-box p-2 bg-white dark:bg-black"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </motion.div>
        <h1 className="flex-1 text-center text-2xl font-bold">
          CREATE <span className="text-[#10b981]">DEEP TRUTH</span>
        </h1>
        <div className="w-10"></div>
      </motion.header>

      <main className="flex-1 flex flex-col">
        <motion.div
          className="relative aspect-[9/16] w-full bg-black brutalist-box border-0 shadow-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {!recordedVideo ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-6">
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                    }}
                  >
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="rounded-none w-16 h-16 brutalist-button bg-red-500"
                    >
                      <div className="w-6 h-6 bg-white dark:bg-black"></div>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="rounded-full w-16 h-16 brutalist-button"
                    >
                      <div className="w-6 h-6 rounded-full border-4 border-white dark:border-black"></div>
                    </Button>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={toggleCamera}
                    variant="outline"
                    size="icon"
                    className="brutalist-box bg-white dark:bg-black"
                  >
                    <FlipHorizontal className="h-6 w-6" />
                  </Button>
                </motion.div>
              </div>
            </>
          ) : (
            <video
              src={recordedVideo}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </motion.div>

        {recordedVideo && (
          <motion.div
            className="p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Textarea
              placeholder="Share your deep truth..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="brutalist-input"
            />

            <div className="flex space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  className="flex-1 brutalist-box bg-white dark:bg-black"
                  onClick={resetRecording}
                >
                  RETAKE
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="flex-1 brutalist-button"
                  onClick={processVideo}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      SHARE
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
