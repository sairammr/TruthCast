"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, follow, unfollow } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import { handleOperationWith, signMessageWith } from "@lens-protocol/client/viem";
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
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const sessionClient = useLensStore((state) => state.sessionClient);
  const setSessionClient = useLensStore((state) => state.setSessionClient);
  const followStatus = useLensStore((state) => state.followStatus);
  const setFollowStatus = useLensStore((state) => state.setFollowStatus);

  const isFollowing = followStatus[profileId] ?? initialIsFollowing;

  useEffect(() => {
    const checkFollowStatus = async () => {
      const observerAddress = localStorage.getItem('lensAccountAddress');
      if (!observerAddress) return;

      // Hide button if observer and account are the same
      if (observerAddress.toLowerCase() === profileId.toLowerCase()) {
        setIsVisible(false);
        return;
      }

      const result = await fetchFollowStatus(lensClient, {
        pairs: [
          {
            account: evmAddress(profileId),
            follower: evmAddress(observerAddress),
          },    
        ],
      });
      console.log('result', result);
      if (result.isOk()) {
        const isFollowing = result.value[0].isFollowing.onChain;
        setFollowStatus(profileId, isFollowing);
        onFollowChange?.(isFollowing);
      }
    };
    checkFollowStatus();
  }, [initialIsFollowing, address, profileId, sessionClient, setFollowStatus, onFollowChange]);

  const handleFollow = async () => {
    if (!address || !isConnected || !walletClient ) {
      toast.error("Please connect your wallet first");
      return;
    }
    if(!sessionClient) {
        const loginResult = await lensClient.login({
            accountOwner: {
              app: process.env.NEXT_PUBLIC_LENS_APP_ID,
              owner: address,
              account: localStorage.getItem("lensAccountAddress"),
            },
            signMessage: signMessageWith(walletClient),
          });
          if (loginResult.isErr()) {
            toast.error("Lens authentication failed");
            return;
          }
          setSessionClient(loginResult.value);
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
      setFollowStatus(profileId, true);
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
      setFollowStatus(profileId, false);
      onFollowChange?.(false);
    } catch (error) {
      console.error("Error unfollowing profile:", error);
      toast.error("Error unfollowing profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
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