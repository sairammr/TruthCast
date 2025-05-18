"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { uploadVideoToStorage } from "@/lib/supabase";
import { toast } from "sonner";
import { lensClient } from "@/lib/lens";
import { video, MediaVideoMimeType } from "@lens-protocol/metadata";
import { lensAccountOnly } from "@lens-chain/storage-client";
import { storageClient } from "@/lib/storageClient";
import { chains } from "@lens-chain/sdk/viem";
import { signMessageWith } from "@lens-protocol/client/viem";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { evmAddress, txHash, uri } from "@lens-protocol/client";
import { handleOperationWith } from "@lens-protocol/client/viem";

interface LensPostVideoProps {
  videoData: {
    mp4: string;
    mp4_filename: string;
  } | null;
  videoTitle: string;
  onClose?: () => void;
}

export function LensPostVideo({
  videoData,
  videoTitle,
  onClose,
}: LensPostVideoProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [title, setTitle] = useState(videoTitle || "My Deep Truth");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("truthcast,deeptruth");
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    console.log("handlePost");
    if (!videoData) {
      toast.error("No video data available");
      return;
    }

    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    

    if (!walletClient) {
      toast.error("Wallet client not available");
      return;
    }
    const authenticated = await lensClient.login({
        accountOwner: {
        app: process.env.NEXT_PUBLIC_LENS_APP_ID,
          owner: evmAddress(address),
          account: localStorage.getItem("lensAccountAddress"),//need to replace with the address of the account
          //account needs to be replaces with the address of the account 
          // (not user wallet address. A new address is created for a lens account)
        },
        signMessage: signMessageWith(walletClient),
      });
      
      if (authenticated.isErr()) {
        return console.error(authenticated.error);
      }
      
      // SessionClient: { ... }
      const sessionClient = authenticated.value;

    // const sessionClient = getSessionClient();
    if (!sessionClient) {
      toast.error("You need to authenticate with Lens first");
      return;
    }

    try {
      setIsPosting(true);
      toast.loading("Uploading video to storage...", { id: "upload" });

      // Convert base64 to blob
      const base64Data = videoData.mp4;
      const byteCharacters = atob(base64Data);
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
      
      const blob = new Blob(byteArrays, { type: "video/mp4" });
      const acl = lensAccountOnly(
        address, // Lens Account Address
        chains.testnet.id
      );
      // Upload to Supabase
      const response = await storageClient.uploadFile(new File([blob], videoData.mp4_filename || `${Date.now()}_video.mp4`), { acl });

      if (!response) {
        throw new Error("Failed to upload video to storage");
      }
      console.log("response", response);
      toast.success("Video uploaded successfully!", { id: "upload" });
      toast.loading("Creating Lens post metadata...", { id: "post" });

      // Create video metadata
      const metadata = video({
        content: description,
        title: title,
        video: {
          item: response.uri,
          type: MediaVideoMimeType.MP4,
          duration: blob.size,
          altTag: title,
        },
        tags: tags.split(",").map(tag => tag.trim()),
      });

      // Upload metadata to storage
      // For a real implementation, you'd use Grove or IPFS
      let metadataUri = "";
      
      try {
        // If storageClient is available (Grove integration)
        if (typeof storageClient?.uploadAsJson === 'function') {
          const { uri } = await storageClient.uploadAsJson(metadata);
          metadataUri = uri;
        } else {
          // Fallback to using the video URL as the content URI
          metadataUri = response.uri;
        }
      } catch (err) {
        console.error("Error uploading metadata:", err);
        // Fallback to using the video URL as the content URI
        metadataUri = response.uri;
      }
      console.log("metadataUri", metadataUri);
      toast.success("Metadata created!", { id: "post" });
      toast.loading("Creating Lens post...", { id: "post" });

      // Create post on Lens Protocol
      const result = await post(sessionClient, { contentUri: uri(metadataUri) }).andThen(handleOperationWith(walletClient));
      console.log("result", result);
     console.log("Post created successfully!", { id: "post" });
      

    


      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error posting video:", error);
      toast.error(
        `Failed to post video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "post" }
      );
    } finally {
      setIsPosting(false);
    }
  };

  

 
  return (
    <div className="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-xl font-bold">Share to Lens Protocol</h2>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your video a title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to your video"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="truthcast,deeptruth,video"
          />
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#10b981] flex items-center justify-center text-white">

          </div>
          <span className="ml-2">
           
          </span>
        </div>
        
        <div className="flex space-x-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isPosting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            className="flex-1 bg-[#10b981] hover:bg-[#0d8c6a]"
            disabled={isPosting}
          >
            {isPosting ? "Posting..." : "Post to Lens"}
          </Button>
        </div>
      </div>
    </div>
  );
} 