"use client";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/providers/WalletProvider";
import Navigation from "@/components/navigation";
import Header from "@/components/header";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lensClient } from "@/lib/lens";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check authentication on mount and pathname change
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to resume the session
        const resumed = await lensClient.resumeSession();

        // If we're on a protected page and there's no valid session, show the modal
        if (
          (pathname.includes("/create") || pathname.includes("/sandbox")) &&
          resumed.isErr()
        ) {
          setShowAuthModal(true);
        } else {
          setShowAuthModal(false);
        }
      } catch (error) {
        // If we get an UnauthenticatedError or any other error, show the modal
        if (pathname.includes("/create") || pathname.includes("/sandbox")) {
          setShowAuthModal(true);
        }
      }
    };

    checkAuth();
  }, [pathname]);

  const handleReturnHome = () => {
    router.push("/");
    setShowAuthModal(false);
  };

  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <Web3Provider>
        <body
          className={`${spaceGrotesk.className} h-full bg-[#f2f2f2] flex justify-center`}
        >
          <div className="w-full max-w-[420px] h-full bg-white shadow-xl overflow-hidden relative">
            {pathname !== "/" && <Header />}
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <main className="h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </main>
            </ThemeProvider>
          </div>
          {pathname !== "/" && <Navigation />}
          <Toaster position="top-center" />

          {/* Authentication Modal */}
          <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Authentication Required</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-500">
                  You need to be authenticated to access this page. Please
                  return to the home page and connect your wallet.
                </p>
                <Button onClick={handleReturnHome} className="w-full">
                  Return to Home
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </body>
      </Web3Provider>
    </html>
  );
}
