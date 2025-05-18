"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, follow, unfollow } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { useLensStore } from "@/lib/useLensStore";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { lensClient } from "@/lib/lens";

interface FollowButtonProps {
  profileId: string;
  initialIsFollowing?: boolean;
  size?: "default" | "sm" | "lg";
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  profileId, 
  initialIsFollowing = false, 
  size = "default",
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const sessionClient = useLensStore((state) => state.sessionClient);
  const setSessionClient = useLensStore((state) => state.setSessionClient);

  useEffect(() => {
    const checkFollowStatus = async () => {
    const result = await fetchFollowStatus(lensClient, {
        pairs: [
          {
            account: evmAddress(profileId),
            follower: evmAddress(localStorage.getItem('lensAccountAddress') || ""),
          },    
        ],
      });
    console.log('result', result);
    if (result.isOk()) {
      setIsFollowing(result.value[0].isFollowing.onChain);
    }
    };
    checkFollowStatus();
  }, [initialIsFollowing, address, profileId, sessionClient]);

  const handleFollow = async () => {
    if (!address || !isConnected || !walletClient || !sessionClient) {
      toast.error("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const result = await follow(sessionClient, {
        account: evmAddress(profileId),
      }).andThen(handleOperationWith(walletClient));
      console.log('result', result);

      if (result.isErr()) {
        toast.error("Failed to follow profile");
        return;
      }

      toast.success("Successfully followed profile");
      setIsFollowing(true);
      onFollowChange?.(true);
    } catch (error) {
      console.error("Error following profile:", error);
      toast.error("Error following profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!address || !isConnected || !walletClient || !sessionClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const result = await unfollow(sessionClient, {
        account: evmAddress(profileId),
      }).andThen(handleOperationWith(walletClient));

      if (result.isErr()) {
        toast.error("Failed to unfollow profile");
        return;
      }

      toast.success("Successfully unfollowed profile");
      setIsFollowing(false);
      onFollowChange?.(false);
    } catch (error) {
      console.error("Error unfollowing profile:", error);
      toast.error("Error unfollowing profile");
    } finally {
      setLoading(false);
    }
  };

  if (address === profileId) {
    return null;
  }

  return (
    <Button
      size={size}
      onClick={isFollowing ? handleUnfollow : handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
} 