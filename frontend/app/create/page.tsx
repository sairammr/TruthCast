"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, Check, X, Loader } from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { lensClient } from "@/lib/lens";
import { video, MediaVideoMimeType } from "@lens-protocol/metadata";
import { storageClient } from "@/lib/storageClient";
import { post } from "@lens-protocol/client/actions";
import { uri } from "@lens-protocol/client";
import { handleOperationWith } from "@lens-protocol/client/viem";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
const SECRET_MESSAGE = "abcdefghijklmnopqrstuvwxyz";

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!address || !isConnected) {
      console.error("Please connect your wallet first");
      return;
    }
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (error) {
        toast.error("Camera access required for recording");
      }
    };

    startCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  const startRecording = () => {
    if (!stream) return;
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
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

  const handleSubmit = async () => {
    if (!title || !recordedChunks.length) {
      console.log("Please add a title and record a video");
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("video", new Blob(recordedChunks, { type: "video/mp4" }));
      formData.append("text", SECRET_MESSAGE);

      const encryptRes = await fetch(`${SERVER_URL}/encrypt`, {
        method: "POST",
        body: formData,
      });
      const encryptedVideo = await encryptRes.json();

      const file = new File([base64ToBlob(encryptedVideo.mp4, "video/mp4")],encryptedVideo.mp4_filename);

      const uploadRes = await storageClient.uploadFile(file);
      if (!uploadRes) throw new Error("Video upload failed");

      const metadata = video({
        content: description,
        title,
        video: {
          item: uploadRes.uri,
          type: MediaVideoMimeType.MP4,
          altTag: title,
        },
      });
      let metadataUri = "";
      try {
        if (typeof storageClient?.uploadAsJson === 'function') {
          const { uri } = await storageClient.uploadAsJson(metadata);
          metadataUri = uri;
        } else {
        }
      } catch (err) {
        console.error("Error uploading metadata:", err);
      }
      const resumed = await lensClient.resumeSession();
      if (resumed.isErr()) {
        return console.error(resumed.error);
      }
      const sessionClient = resumed.value;
      const result = await post(sessionClient, { contentUri: uri(metadataUri) }).andThen(handleOperationWith(walletClient));
      console.log("result", result);
    } catch (error) {
      console.error(`Post failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Post Your Truth</h1>
      {previewUrl ? (
        <div className="mb-4">
          <video src={previewUrl} controls className="w-full aspect-video rounded-lg" />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
        </div>
      )}
      {!previewUrl ? (
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className="w-full py-6 text-lg"
          variant={isRecording ? "destructive" : "default"}
        >
          <Video className="mr-2" />
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Truth title"
              className="w-full p-2 border rounded"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full p-2 border rounded h-24"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPreviewUrl(null)}
              variant="outline"
              className="flex-1"
            >
              <X className="mr-2" /> Retake
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader className="animate-spin mr-2" />
              ) : (
                <Check className="mr-2" />
              )}
              Post Truth
            </Button>
          </div>
        </div>
      )}
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