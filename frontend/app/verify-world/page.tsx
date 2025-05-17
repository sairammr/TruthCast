"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/animated-logo";

export default function VerifyWorldPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] dark:bg-black relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute top-20 right-20 w-40 h-40 bg-[#10b981] opacity-10"
        animate={{ rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-40 left-10 w-20 h-20 bg-[#10b981] opacity-10"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 5,
          ease: "easeInOut",
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
          className="brutalist-box p-8 bg-white dark:bg-black"
        >
          <div className="flex justify-center mb-4">
            <AnimatedLogo compact={true} />
          </div>

          <motion.h1
            className="text-4xl font-bold tracking-tight text-black dark:text-white mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            VERIFY WITH <span className="text-[#10b981]">WORLD</span>
          </motion.h1>

          <div className="space-y-4">
            <motion.p
              className="text-gray-800 dark:text-gray-200 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Connect with the world to share your deep truths.
            </motion.p>
            <motion.p
              className="text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Your voice matters. Your truth matters.
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="space-y-4 pt-8"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => router.push("/verify-self")}
              className="w-full py-6 text-lg brutalist-button"
            >
              CONTINUE
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
