"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, Check, X, Loader, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";

export default function SandboxPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [encryptedVideoUrl, setEncryptedVideoUrl] = useState<string | null>(null);
  const [secretMessage, setSecretMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Setup camera on mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (error) {
        toast.error("Camera access required for recording");
      }
    };

    startCamera();
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const handleEncrypt = async () => {
    if (!recordedChunks.length || !secretMessage) {
      toast.error("Please record a video and enter a secret message");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("video", new Blob(recordedChunks, { type: "video/mp4" }));
      formData.append("text", secretMessage);

      const encryptRes = await fetch(`${SERVER_URL}/encrypt`, {
        method: "POST",
        body: formData,
      });

      if (!encryptRes.ok) {
        throw new Error("Encryption failed");
      }

      const encryptedVideo = await encryptRes.json();
      const encryptedBlob = base64ToBlob(encryptedVideo.mp4, "video/mp4");
      const encryptedUrl = URL.createObjectURL(encryptedBlob);
      setEncryptedVideoUrl(encryptedUrl);
      toast.success("Video encrypted successfully!");
    } catch (error: any) {
      toast.error(`Encryption failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedVideoUrl) {
      toast.error("Please encrypt a video first");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(encryptedVideoUrl);
      const videoBlob = await response.blob();
      
      const formData = new FormData();
      formData.append("video", videoBlob);

      const decryptRes = await fetch(`${SERVER_URL}/decrypt`, {
        method: "POST",
        body: formData,
      });

      if (!decryptRes.ok) {
        throw new Error("Decryption failed");
      }

      const result = await decryptRes.json();
      setDecryptedMessage(result.border_data);
      toast.success("Message decrypted successfully!");
    } catch (error: any) {
      toast.error(`Decryption failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDemo = () => {
    setPreviewUrl(null);
    setEncryptedVideoUrl(null);
    setSecretMessage("");
    setDecryptedMessage("");
    setRecordedChunks([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black relative overflow-hidden mt-[-60px]">
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
            <h1 className="text-2xl font-bold mb-6">Steganography Sandbox</h1>

            {/* Video Preview Section */}
            <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
              {previewUrl ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Recording Controls */}
            {!previewUrl && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full py-6 text-lg mb-4"
                variant={isRecording ? "destructive" : "default"}
              >
                <Video className="mr-2" />
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            )}

            {/* Secret Message Input */}
            {previewUrl && !encryptedVideoUrl && (
              <div className="space-y-4">
                <textarea
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Enter your secret message"
                  className="w-full p-2 border rounded h-24"
                />
                <div className="flex gap-2">
                  <Button onClick={() => setPreviewUrl(null)} variant="outline" className="flex-1">
                    <X className="mr-2" /> Retake
                  </Button>
                  <Button onClick={handleEncrypt} disabled={isProcessing} className="flex-1">
                    {isProcessing ? (
                      <Loader className="animate-spin mr-2" />
                    ) : (
                      <Lock className="mr-2" />
                    )}
                    Encrypt
                  </Button>
                </div>
              </div>
            )}

            {/* Encrypted Video Preview */}
            {encryptedVideoUrl && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Encrypted Video</h2>
                <video
                  src={encryptedVideoUrl}
                  controls
                  className="w-full aspect-video rounded-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={resetDemo} variant="outline" className="flex-1">
                    <X className="mr-2" /> Reset Demo
                  </Button>
                  <Button onClick={handleDecrypt} disabled={isProcessing} className="flex-1">
                    {isProcessing ? (
                      <Loader className="animate-spin mr-2" />
                    ) : (
                      <Unlock className="mr-2" />
                    )}
                    Decrypt
                  </Button>
                </div>
              </div>
            )}

            {/* Decrypted Message */}
            {decryptedMessage && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-4">Decrypted Message</h2>
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
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

const base64ToBlob = (base64: string, type: string) => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type });
}; 