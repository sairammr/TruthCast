"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, Check, X, Loader, Camera } from "lucide-react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { lensClient } from "@/lib/lens";
import { video, MediaVideoMimeType } from "@lens-protocol/metadata";
import { storageClient } from "@/lib/storageClient";
import { uri } from "@lens-protocol/client";
import { post } from "@lens-protocol/client/actions";
import { useRouter } from "next/navigation";

import SecretManagerABI from "../abi/TruthCastContractAbi.json";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
const CONTRACT_ADDRESS = "0x640C78b3eB3e3E2eDDB7298ab3F09ca5561Af14E";

export default function CreatePage() {
  const router = useRouter();
  const user =
    typeof window !== "undefined"
      ? (localStorage.getItem("lensAccountAddress") as `0x${string}`)
      : null;
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startCamera = async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    try {
      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      console.log("Camera access granted:", mediaStream);
      setStream(mediaStream);
      setIsCameraOn(true);
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Camera access required for recording");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
      setIsCameraOn(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle video stream when stream or videoRef changes
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Setting up video stream...");
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        videoRef.current?.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      };
    }
  }, [stream, videoRef.current]);

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
    stopCamera();

    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    setPreviewUrl(URL.createObjectURL(blob));
  };

  // Wait for SecretCreated event using Promise
  const waitForSecretCreatedEvent = (timeoutMs = 30000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for SecretCreated event"));
      }, timeoutMs);
      if (!publicClient) {
        console.error("publicClient first");
        return;
      }
      const unwatch = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: SecretManagerABI.output.abi,
        eventName: "SecretCreated",
        onLogs: (logs) => {
          if (logs[0]?.args?.secretHash) {
            const hash = logs[0].args.secretHash as string;
            console.log("SecretCreated event detected:", hash);
            clearTimeout(timeout);
            unwatch(); // Stop watching for events
            resolve(hash);
          } else {
            console.error(
              "SecretCreated event received but no secretHash found"
            );
            clearTimeout(timeout);
            reject(new Error("No secretHash in event"));
          }
        },
        onError: (error) => {
          console.error("Error listening for SecretCreated event:", error);
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  };

  // New submission flow using secretHash from event
  const handleSubmit = async () => {
    if (!title || !recordedChunks.length || !walletClient || !address) {
      toast.error("Missing required information");
      return;
    }
    if (!publicClient) {
      toast.error("Public client not available");
      return;
    }
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Start listening for the event BEFORE making the contract call
      const secretHashPromise = waitForSecretCreatedEvent();

      // Step 2: Call createPreSecret on contract
      console.log("Calling createPreSecret...");
      await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SecretManagerABI.output.abi,
        functionName: "createPreSecret",
        args: [user],
        account: address,
      });

      // Step 3: Wait for the SecretCreated event to be received
      console.log("Waiting for SecretCreated event...");
      const secretHash = await secretHashPromise;
      console.log("Received secretHash:", secretHash);

      // Step 4: Encrypt video using secretHash
      const formData = new FormData();
      formData.append("video", new Blob(recordedChunks, { type: "video/mp4" }));
      formData.append("text", secretHash as string);

      console.log("Encrypting video...");
      const encryptRes = await fetch(`${SERVER_URL}/encrypt`, {
        method: "POST",
        body: formData,
      });
      const encryptedVideo = await encryptRes.json();

      const file = new File(
        [base64ToBlob(encryptedVideo.mp4, "video/mp4")],
        encryptedVideo.mp4_filename
      );

      // Step 5: Upload encrypted video
      console.log("Uploading encrypted video...");
      const uploadRes = await storageClient.uploadFile(file);
      if (!uploadRes) throw new Error("Video upload failed");

      // Step 6: Create Lens metadata and post
      console.log("Creating Lens metadata...");
      const metadata = video({
        content: description,
        title,
        video: {
          item: uploadRes.uri,
          type: MediaVideoMimeType.MP4,
          altTag: title,
        },
      });

      const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);

      console.log("Resuming Lens session...");
      const resumed = await lensClient.resumeSession();
      if (resumed.isErr()) throw new Error(resumed.error.message);

      const sessionClient = resumed.value;
      console.log("Creating Lens post...");
      const result = await post(sessionClient, {
        contentUri: uri(metadataUri),
      });

      if (result.isErr()) throw new Error(result.error.message);

      // Get the post ID from the result
      const postId = result.value.hash;
      if (!postId) {
        throw new Error("Failed to get post ID from response");
      }
      console.log("Post created with ID:", postId);

      // Step 7: Associate post details onchain
      console.log("Associating post details onchain...");
      await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SecretManagerABI.output.abi,
        functionName: "associatePostDetails",
        args: [secretHash as string, postId],
        account: address,
      });

      toast.success("Post published successfully!");
      // Clear preview and inputs
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
      setRecordedChunks([]);

      // Redirect to the feed page
      router.push("/feed");
    } catch (error: any) {
      console.error("Submission failed:", error.message || error);
      toast.error(`Submission failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Post Your Truth</h1>
      {previewUrl ? (
        <div className="mb-4">
          <video
            src={previewUrl}
            controls
            className="w-full aspect-video rounded-lg"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror the video
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Camera is off
            </div>
          )}
        </div>
      )}
      {!previewUrl ? (
        <div className="space-y-4">
          {!isCameraOn ? (
            <Button
              onClick={startCamera}
              className="w-full py-6 text-lg"
              variant="default"
            >
              <Camera className="mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className="w-full py-6 text-lg"
              variant={isRecording ? "destructive" : "default"}
            >
              <Video className="mr-2" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          )}
        </div>
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
