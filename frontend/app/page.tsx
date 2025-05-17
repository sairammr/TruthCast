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
import { fetchAccount } from "@lens-protocol/client/actions";

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Automatically authenticate with Lens when wallet is connected
  useEffect(() => {
    const authenticateWithLens = async () => {
      if (isConnected && address && walletClient && !isAuthenticating) {
        try {
          setIsAuthenticating(true);
          //check for owner of this wallet address
          try{
            const result = await fetchAccount(lensClient, {
              
                
                username: {
                  localName: "sairammr",
                },
              
            });
            console.log("result", result);
            
          const authenticated = await lensClient.login({
            accountOwner: {
              app: "0x6d975C4aD2434F2c5C9213d4dE38AfD63498f37E", // App ID
              owner: evmAddress(address),
              account: evmAddress(address),
            },
            signMessage: signMessageWith(walletClient),
          })
          const sessionClient = authenticated.value;
          console.log("Lens authentication successful", { sessionClient });
          toast.success("Connected to Lens Protocol");
          localStorage.setItem("sessionClient", sessionClient);
          ;}
          catch(error){
            console.error("Error authenticating with Lens:", error);
            toast.error("Failed to connect to Lens Protocol");
           // router.push("/register");
            setIsAuthenticating(false);
            return;
          }
          

        

          // Authentication successful
         
          
          // Optionally redirect to Lens page
          // router.push("/lens");
        } catch (error) {
          console.error("Error authenticating with Lens:", error);
          toast.error("Failed to connect to Lens Protocol");
        } finally {
          setIsAuthenticating(false);
        }
      }
    };
    authenticateWithLens();
  }, [isConnected, address, walletClient]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
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
      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#10b981] opacity-10"
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
            Raw. Unfiltered. Real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="space-y-4 pt-8"
        >
          <Button
            onClick={() => router.push("/feed")}
            className="w-full py-6 text-lg brutalist-button hover:scale-105 transition-all duration-300"
          >
            Launch Dapp
          </Button>
          <ConnectKitButton />
          {isConnected && (
            <Button
              onClick={() => router.push("/lens")}
              className="w-full bg-[#10b981] hover:bg-[#0d8c6a] text-white"
            >
              Lens Profile
            </Button>
          )}
        </motion.div>
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="brutalist-box bg-white dark:bg-black text-xs"
            onClick={() => {
              localStorage.setItem("offchainMode", "true");
              router.push("/profile");
            }}
          >
            Offchain Mode
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
