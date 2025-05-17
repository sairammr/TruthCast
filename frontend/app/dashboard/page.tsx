"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Shield, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/verify-world");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-[#10b981] border-opacity-50 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated, show dashboard
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] dark:bg-black">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="container flex items-center justify-between mx-auto">
          <h1 className="text-2xl font-bold">DeepTruth Dashboard</h1>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto p-6">
        {/* Verification status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 mb-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verification Successful</h2>
              <p className="text-gray-600 dark:text-gray-400">
                You've been verified with World ID
              </p>
            </div>
          </div>
        </motion.div>

        {/* Verification details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Account Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User ID
                </p>
                <p className="font-mono text-sm break-all">
                  {session?.user?.id || session?.user?.name || "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Verification Level
                </p>
                <div className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {session?.user?.verificationLevel === "orb"
                      ? "Orb Verified"
                      : session?.user?.verificationLevel === "device"
                      ? "Device Verified"
                      : "Verified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">What's Next?</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">
                  1
                </div>
                <span>Explore verified content from other users</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">
                  2
                </div>
                <span>Share your own deep truths with the community</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">
                  3
                </div>
                <span>Connect with like-minded individuals</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Button
            className="h-14 text-lg"
            onClick={() => router.push("/explore")}
          >
            Explore Content
          </Button>
          <Button
            className="h-14 text-lg"
            variant="outline"
            onClick={() => router.push("/create")}
          >
            Create New Post
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
