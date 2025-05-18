"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Video,
  Check,
  X,
  RotateCw,
  ArrowLeft,
  Download,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Instagram,
  Loader,
} from "lucide-react";
import Navigation from "@/components/navigation";
import { LensPostVideo } from "@/components/lens-post-video";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useLensStore } from "@/lib/store/lens-store";

// Server URL for steganography API
// Fix: Use the correct API endpoint with path
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "";

// Hardcoded secret message
const HARDCODED_SECRET_MESSAGE = "abcdefghijklmnopqrstuvwxyz";

export default function CreatePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>("video/webm");
  const [uploadedVideoData, setUploadedVideoData] = useState<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  console.log(uploadedVideoData);
  // States for API integration and sharing
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [videoTitle, setVideoTitle] = useState("My Deep Truth");

  // Steganography specific states
  const [encryptedVideoData, setEncryptedVideoData] = useState<{
    mp4: string;
    mp4_filename: string;
  } | null>(null);
  const [activeFormat, setActiveFormat] = useState<"mp4" | "mov">("mp4");

  // Add Lens Protocol related state
  const { isConnected } = useAccount();
  const [showLensPostModal, setShowLensPostModal] = useState(false);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl]);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Simple check for mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // If mobile, default to environment camera (back camera) for better quality
      if (isMobile && !stream) {
        setIsFrontCamera(false);
      }
    };

    checkMobile();
  }, [stream]);

  // Simulated upload progress effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isUploading && uploadProgress < 95) {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 95); // Cap at 95% until actual completion
        });
      }, 500);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isUploading, uploadProgress]);

  // Create and set up the preview when recorded chunks change
  useEffect(() => {
    if (recordedChunks.length > 0 && showPreview) {
      // Use MP4 format if supported, fallback to webm
      const blob = new Blob(recordedChunks, { type: videoMimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      // Ensure the preview element gets the source
      if (previewRef.current) {
        previewRef.current.src = url;

        // Once metadata is loaded, play the video
        previewRef.current.onloadedmetadata = () => {
          if (previewRef.current) {
            previewRef.current.play().catch((err) => {
              console.error("Error playing preview:", err);
              toast.error(
                "Error playing video preview. Try a different browser."
              );
            });
          }
        };
      }
    }
  }, [recordedChunks, showPreview, videoMimeType]);

  // Convert base64 to blob for video handling
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type });
  };

  // Get current video URL based on active format
  const getCurrentVideoUrl = (): string | null => {
    if (!encryptedVideoData) return previewUrl;

    const base64Data = encryptedVideoData.mp4;
    const mimeType = activeFormat === "mov" ? "video/quicktime" : "video/mp4";
    const blob = base64ToBlob(base64Data, mimeType);
    return URL.createObjectURL(blob);
  };

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 }, // Reduced for better mobile performance
          height: { ideal: 720 }, // Reduced for better mobile performance
        },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.style.transform =
          facingMode === "user" ? "scaleX(-1)" : "none";
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    startCamera(isFrontCamera ? "environment" : "user");
  };

  const startRecording = () => {
    if (!stream) return;

    // Try to use MP4 if supported
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    console.log("Using MIME type:", mimeType);
    setVideoMimeType(mimeType || "video/webm");

    // Lower bitrate for mobile
    const bitrate = 1500000; // 1.5 Mbps should be good for mobile

    const options = mimeType
      ? { mimeType, videoBitsPerSecond: bitrate }
      : undefined;

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        setShowPreview(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      // Collect data frequently for smoother results
      mediaRecorder.start(100);
      setIsRecording(true);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
      toast.error("Failed to start recording. Try a different browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setShowPreview(false);
    setRecordedChunks([]);
    setUploadedVideoData(null);
    setShowShareOptions(false);
    setUploadProgress(0);
    setEncryptedVideoData(null);

    // Reattach stream to video element
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else {
      // Restart camera if stream is not available
      startCamera(isFrontCamera ? "user" : "environment");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (recordedChunks.length === 0) {
      toast.error("No video recorded");
      return;
    }

    // Using hardcoded secret message
    const messageToHide = HARDCODED_SECRET_MESSAGE;

    const blob = new Blob(recordedChunks, { type: videoMimeType });
    const formData = new FormData();
    formData.append("video", blob);
    formData.append("text", messageToHide);

    // Reset states for new upload
    setIsUploading(true);
    setUploadProgress(0);
    setEncryptedVideoData(null);

    // Show toast with custom ID so we can update it
    toast.loading("Processing your Deep Truth...", {
      id: "video-upload",
      duration: Infinity,
    });

    try {
      // Fixed API endpoint - explicitly include /encrypt path
      const response = await fetch(`${SERVER_URL}/encrypt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process video");
      }

      // Get response with video formats
      const result = await response.json();
      console.log("API response:", result);

      // Set upload to complete
      setUploadProgress(100);
      setIsUploading(false);

      // Store the encrypted video data
      setEncryptedVideoData({
      
        mp4: result.mp4,
    
        mp4_filename: result.mp4_filename || "deeptruth.mp4",
      });

      // Default to showing MP4 format
      setActiveFormat("mp4");

      // Show success message
      toast.success("Video processed successfully!", {
        id: "video-upload",
      });

      // Show share options
      setShowShareOptions(true);
    } catch (error) {
      console.error("Error uploading video:", error);
      setIsUploading(false);

      toast.error(
        `Processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          id: "video-upload",
        }
      );
    }
  };

  const downloadVideo = () => {
    if (!encryptedVideoData) return;

    const base64Data = encryptedVideoData.mp4;

    const mimeType = activeFormat === "mov" ? "video/quicktime" : "video/mp4";

    const filename =
      encryptedVideoData.mp4_filename ||
      `${videoTitle.replace(/\s+/g, "_")}.mp4`;

    const blob = base64ToBlob(base64Data, mimeType);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);

    // Show toast for mobile users
    toast.success(`Downloading ${activeFormat.toUpperCase()} video`, {
      duration: 2000,
    });
  };

  const shareToSocial = (platform: string) => {
    // In a real app, you would use the social media platform's sharing API
    // For this example, we'll just simulate the sharing

    const shareUrl = window.location.href;
    const shareTitle = videoTitle;
    let shareLink = "";

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareTitle
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
        return;
      default:
        toast.info(
          `Sharing to ${platform} would open the native app or sharing dialog`
        );
        return;
    }

    // Open share link in new window
    window.open(shareLink, "_blank", "noopener,noreferrer");
  };

  const goToFeed = () => {
    router.push("/feed");
  };

  // Add function to handle posting to Lens
  const handlePostToLens = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setShowLensPostModal(true);
  };

  // Determine what view to show
  const renderContent = () => {
    // Loading/processing view
    if (isUploading) {
      return (
        <div className="relative w-full h-[50vh] md:h-[60vh] max-w-[420px] mx-auto mb-4 bg-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <Loader size={48} className="text-[#10b981]" />
          </motion.div>

          {/* Progress bar */}
          <div className="w-3/4 h-2 bg-gray-700 rounded-full mb-4">
            <div
              className="h-full bg-[#10b981] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>

          <p className="text-white text-lg px-4 text-center">
            Processing your Deep Truth... {Math.round(uploadProgress)}%
          </p>
        </div>
      );
    }

    // Recording view (camera active, not recording or in preview)
    if (!showPreview) {
      return (
        <div className="relative w-full h-[50vh] md:h-[60vh] max-w-[420px] mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: isFrontCamera ? "scaleX(-1)" : "none" }}
          />

          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              {formatTime(recordingTime)}
            </div>
          )}

          {stream && (
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={switchCamera}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70"
              >
                <RotateCw className="w-6 h-6 text-white" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Preview/Share view (after recording/uploading)
    return (
      <>
        {!encryptedVideoData ? (
          // Regular preview before upload
          <div className="relative w-full h-[50vh] md:h-[60vh] max-w-[420px] mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={previewRef}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
              src={previewUrl || undefined}
            />
          </div>
        ) : (
          // Processed video view with format toggle
          <div className="w-full max-w-[420px] mx-auto mb-4">
            {/* Format toggle buttons */}
            <div className="flex mb-4">
              <button
                onClick={() => setActiveFormat("mp4")}
                className={`flex-1 py-2 text-sm md:text-base ${
                  activeFormat === "mp4"
                    ? "bg-[#10b981] text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                MP4 (Web-Friendly)
              </button>
              <button
                onClick={() => setActiveFormat("mov")}
                className={`flex-1 py-2 text-sm md:text-base ${
                  activeFormat === "mov"
                    ? "bg-[#10b981] text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                MOV (Deep Truth)
              </button>
            </div>

            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                src={getCurrentVideoUrl() || undefined}
              />
            </div>

            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Note:</strong> The MP4 format is compatible with most
                platforms but only preserves the border data. The MOV format
                preserves both the deep truth data and border data.
              </p>
            </div>
          </div>
        )}

        {/* Title input field (displayed when sharing) */}
        {showShareOptions && (
          <div className="w-full max-w-[420px] mx-auto mb-4">
            <div className="mb-2 text-sm md:text-md font-semibold text-gray-700 dark:text-gray-300">
              Video Title:
            </div>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Give your video a title"
              className="w-full p-2 md:p-3 rounded-md border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
            />
          </div>
        )}

        {/* Share and download options */}
        {showShareOptions && (
          <div className="w-full max-w-[420px] mx-auto mb-4 bg-white dark:bg-gray-900 p-3 md:p-4 rounded-lg shadow">
            <h3 className="font-bold text-base md:text-lg mb-3 text-black dark:text-white">
              Share your Deep Truth
            </h3>

            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4">
              <Button
                onClick={() => shareToSocial("twitter")}
                className="flex items-center gap-1 md:gap-2 bg-[#1DA1F2] hover:bg-[#1a94df] text-xs md:text-sm py-1 md:py-2"
              >
                <Twitter size={16} />
                <span className="hidden xs:inline">Twitter</span>
              </Button>

              <Button
                onClick={() => shareToSocial("facebook")}
                className="flex items-center gap-1 md:gap-2 bg-[#4267B2] hover:bg-[#375694] text-xs md:text-sm py-1 md:py-2"
              >
                <Facebook size={16} />
                <span className="hidden xs:inline">Facebook</span>
              </Button>

              <Button
                onClick={() => shareToSocial("linkedin")}
                className="flex items-center gap-1 md:gap-2 bg-[#0077B5] hover:bg-[#006396] text-xs md:text-sm py-1 md:py-2"
              >
                <Linkedin size={16} />
                <span className="hidden xs:inline">LinkedIn</span>
              </Button>

              <Button
                onClick={() => shareToSocial("instagram")}
                className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-xs md:text-sm py-1 md:py-2"
              >
                <Instagram size={16} />
                <span className="hidden xs:inline">Instagram</span>
              </Button>

              <Button
                onClick={() => shareToSocial("copy")}
                className="flex items-center gap-1 md:gap-2 bg-gray-600 hover:bg-gray-700 text-xs md:text-sm py-1 md:py-2"
              >
                <Copy size={16} />
                <span className="hidden xs:inline">Copy Link</span>
              </Button>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={downloadVideo}
                className="flex items-center gap-2 w-full bg-[#10b981] hover:bg-[#0d8c6a] text-sm md:text-base"
              >
                <Download size={18} />
                Download {activeFormat.toUpperCase()} Video
              </Button>

              {/* Add Lens Protocol Post Button */}
              <Button
                onClick={handlePostToLens}
                className="flex items-center gap-2 w-full bg-[#00501E] hover:bg-[#003A15] text-sm md:text-base"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0ZM11.741 21.333C10.7 21.333 9.778 20.954 9.081 20.256C8.383 19.559 8.004 18.637 8.004 17.596C8.004 16.556 8.383 15.634 9.081 14.936C9.778 14.239 10.7 13.86 11.741 13.86C12.781 13.86 13.703 14.239 14.401 14.936C15.098 15.634 15.477 16.556 15.477 17.596C15.477 18.637 15.098 19.559 14.401 20.256C13.703 20.954 12.781 21.333 11.741 21.333ZM20.259 21.333C19.219 21.333 18.297 20.954 17.599 20.256C16.902 19.559 16.523 18.637 16.523 17.596C16.523 16.556 16.902 15.634 17.599 14.936C18.297 14.239 19.219 13.86 20.259 13.86C21.3 13.86 22.222 14.239 22.919 14.936C23.617 15.634 23.996 16.556 23.996 17.596C23.996 18.637 23.617 19.559 22.919 20.256C22.222 20.954 21.3 21.333 20.259 21.333Z"
                    fill="currentColor"
                  />
                </svg>
                Post to Lens Protocol
              </Button>
            </div>
          </div>
        )}

        {/* Lens Protocol Post Modal */}
        {showLensPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              {isConnected ? (
                <LensPostVideo
                  videoData={encryptedVideoData}
                  videoTitle={videoTitle}
                  onClose={() => setShowLensPostModal(false)}
                />
              ) : (
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Connect your wallet to post to Lens Protocol
                  </p>
                  <div className="flex justify-center mb-4">
                    <ConnectKitButton />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowLensPostModal(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full fixed inset-0 bg-[#f5f5f5] dark:bg-black max-w-[420px] mx-auto">
      <Navigation />
      <div className="flex flex-col items-center justify-center min-h-screen p-2 md:p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-[420px] text-center space-y-4 md:space-y-8 z-1"
        >
          {/* Back button to /feed */}
          <div className="absolute top-2 md:top-4 left-2 md:left-4 z-20">
            <Button
              onClick={goToFeed}
              variant="ghost"
              size="sm"
              className="flex items-center text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 p-1 md:p-2"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Back</span>
            </Button>
          </div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="brutalist-box p-3 md:p-6 bg-white dark:bg-black rounded-lg mt-10 md:mt-0 max-w-[420px] mx-auto"
          >
            <motion.h1
              className="text-2xl md:text-4xl font-bold tracking-tight text-black dark:text-white mb-4 md:mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              CREATE YOUR <span className="text-[#004aad]">DEEP TRUTH</span> NOW
            </motion.h1>

            {/* Main content area - renders different views based on state */}
            {renderContent()}

            {/* Action buttons */}
            <div className="flex flex-col space-y-2 md:space-y-4">
              {!stream && !isUploading && !showShareOptions ? (
                <Button
                  onClick={() => startCamera()}
                  className="w-full py-3 md:py-6 text-base md:text-lg brutalist-button"
                >
                  START CAMERA
                </Button>
              ) : showPreview && !isUploading && !showShareOptions ? (
                <div className="flex space-x-2 md:space-x-4">
                  <Button
                    onClick={retakeVideo}
                    className="flex-1 py-3 md:py-6 text-base md:text-lg brutalist-button bg-red-500 hover:bg-red-600"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                    RETAKE
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 py-3 md:py-6 text-base md:text-lg brutalist-button"
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                    SUBMIT
                  </Button>
                </div>
              ) : stream && !showPreview && !isUploading ? (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full py-3 md:py-6 text-base md:text-lg brutalist-button ${
                    isRecording ? "bg-red-500 hover:bg-red-600" : ""
                  }`}
                >
                  <Video className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {isRecording ? "STOP RECORDING" : "START RECORDING"}
                </Button>
              ) : showShareOptions ? (
                <Button
                  onClick={() => router.push("/feed")}
                  className="w-full py-3 md:py-6 text-base md:text-lg brutalist-button"
                >
                  VIEW ON FEED
                </Button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
