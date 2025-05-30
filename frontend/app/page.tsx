"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";
import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { lensClient } from "@/lib/lens";
import { signMessageWith } from "@lens-protocol/client/viem";
import { toast } from "sonner";
import { evmAddress } from "@lens-protocol/client";
import { fetchAccount, fetchAccountsBulk } from "@lens-protocol/client/actions";
import Image from "next/image";

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const lensAccountAddress = localStorage.getItem("lensAccountAddress");
    if (lensAccountAddress) {
      // Fetch username
      const fetchUsername = async () => {
        try {
          const result = await fetchAccount(lensClient, {
            address: evmAddress(lensAccountAddress),
          });
          if (result.isOk()) {
            setUsername(result.value.username?.localName || null);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      };
      fetchUsername();
    }
  }, []);

  function getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return;
        seen.add(value);
      }
      return value;
    };
  }

  const authenticateWithLens = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!walletClient) {
      toast.error("Wallet client not available");
      return;
    }

    if (isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      try {
        const result = await fetchAccountsBulk(lensClient, {
          ownedBy: [evmAddress(address)],
        });

        console.log("result", result);
        if (result.isOk() && result.value.length === 0) {
          router.push("/register");
          return;
        }

        const authenticated = await lensClient.login({
          accountOwner: {
            app: process.env.NEXT_PUBLIC_LENS_APP_ID,
            owner: evmAddress(address),
            account: result.isOk()
              ? result.value[result.value.length - 1].address
              : "",
          },
          signMessage: signMessageWith(walletClient),
        });

        const sessionClient = authenticated.isOk() ? authenticated.value : null;
        console.log("Lens authentication successful", { sessionClient });
        localStorage.setItem(
          "lensAccountAddress",
          result.isOk() ? result.value[result.value.length - 1].address : ""
        );
        console.log("session client", sessionClient);
        console.log(
          "sessionClient keys:",
          sessionClient ? Object.keys(sessionClient) : "No session client"
        );

        try {
          localStorage.setItem(
            "sessionClient",
            JSON.stringify(sessionClient, getCircularReplacer())
          );
        } catch (e) {
          console.error("sessionClient not serializable", e);
          toast.error("Session could not be saved (not serializable)");
        }
        toast.success("Connected to Lens Protocol");

        router.push("/feed");
      } catch (error) {
        console.error("Error authenticating with Lens:", error);
        toast.error("Failed to connect to Lens Protocol");
        setIsAuthenticating(false);
        return;
      }
    } catch (error) {
      console.error("Error authenticating with Lens:", error);
      toast.error("Failed to connect to Lens Protocol");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-5 right-5">
        <ConnectKitButton theme="retro" />
      </div>
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 bg-[#004aad] rounded-full opacity-20"
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
        className="absolute bottom-20 right-10 w-32 h-32 bg-[#004aad] rounded-full opacity-20"
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
      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#004aad] opacity-20"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "linear",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md text-center space-y-8 z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="flex justify-center"
        >
          <AnimatedLogo />
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            For Real Humans. By Real Humans.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="space-y-4 pt-8"
        >
          <Button
            onClick={authenticateWithLens}
            className="w-[350px] py-6 text-lg brutalist-button hover:scale-105 transition-all duration-300"
            disabled={!isConnected}
          >
            {username ? `Continue as @${username}` : "Login with Lens"}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          <span className="text-sm text-gray-500">Powered by</span>
          <Image
            src="/lens.png"
            alt="Lens Protocol"
            width={24}
            height={24}
            className="opacity-80"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
