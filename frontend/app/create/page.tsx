"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, X, RefreshCw, ArrowLeft } from "lucide-react";

export default function VideoRecorder() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup preview video when it becomes available
  useEffect(() => {
    if (showPreview && previewRef.current && videoUrl) {
      previewRef.current.src = videoUrl;
      previewRef.current.onloadedmetadata = () => {
        if (previewRef.current) {
          previewRef.current.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        }
      };
    }
  }, [showPreview, videoUrl]);

  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [stream, videoUrl]);

  // Start camera with specified settings
  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Request video stream in 16:9 format
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: 16 / 9,
        },
        audio: true,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Only mirror for front camera
        videoRef.current.style.transform =
          facingMode === "user" ? "scaleX(-1)" : "none";
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    const newFacingMode = isFrontCamera ? "environment" : "user";
    setIsFrontCamera(!isFrontCamera);
    startCamera(newFacingMode);
  };

  // Start recording video
  const startRecording = () => {
    if (!stream) return;

    const chunks: Blob[] = [];

    // Find the best supported MIME type for MP4
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    const options = mimeType
      ? { mimeType, videoBitsPerSecond: 2500000 }
      : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (chunks.length > 0) {
        // Create blob with MP4 mime type if possible
        const blob = new Blob(chunks, { type: mimeType || "video/webm" });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setShowPreview(true);
      } else {
        alert("Failed to record video. No data available.");
      }
    };

    // Request data every 100ms
    mediaRecorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);

    // Start a timer to update recording duration
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Stop recording video
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Retake video
  const retakeVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setShowPreview(false);

    // Restart camera if needed
    if (videoRef.current && !videoRef.current.srcObject) {
      startCamera(isFrontCamera ? "user" : "environment");
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle video submission
  const handleSubmit = async () => {
    if (!videoBlob) {
      alert("No video recorded");
      return;
    }

    try {
      // Example upload code - replace with your actual API endpoint
      const formData = new FormData();
      formData.append("video", videoBlob, "recorded-video.mp4");

      // Example submission - replace with your actual API endpoint
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // });

      alert("Video submitted successfully!");
      router.push("/verify-self/mint");
    } catch (error) {
      console.error("Error submitting video:", error);
      alert("Failed to submit video");
    }
  };

  // If showing camera/recording view
  if (!showPreview) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">RECORD VIDEO</h1>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>

        {/* Camera container with 16:9 aspect ratio */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="w-full max-w-3xl mx-auto relative"
            style={{ aspectRatio: "16/9" }}
          >
            {/* Camera placeholder when no stream */}
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                <Camera size={64} className="text-gray-400" />
              </div>
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-900 rounded-lg"
            />

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                <span className="font-bold text-sm">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}

            {/* Camera switch button */}
            {stream && (
              <div className="absolute top-4 left-4">
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <RefreshCw size={24} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 flex justify-center">
          {!stream ? (
            <button
              onClick={() => startCamera()}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white"
            >
              <Camera size={32} />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded-sm" />
              ) : (
                <div className="w-8 h-8 bg-red-500 rounded-full" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // If showing preview
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={retakeVideo}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">PREVIEW</h1>
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Video preview with 16:9 aspect ratio */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-3xl mx-auto"
          style={{ aspectRatio: "16/9" }}
        >
          {videoUrl && (
            <video
              ref={previewRef}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-gray-900 rounded-lg"
              // Don't apply any transform - show the video as recorded
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-8 flex justify-center space-x-4">
        <button
          onClick={retakeVideo}
          className="px-6 py-3 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center"
        >
          <X size={20} className="mr-2" />
          RETAKE
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center"
        >
          <Check size={20} className="mr-2" />
          SUBMIT
        </button>
      </div>
    </div>
  );
}
