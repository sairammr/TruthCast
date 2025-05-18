'use client'
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/providers/WalletProvider";
import Navigation from "@/components/navigation";
import Header from "@/components/header";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";

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
        <body className={`${spaceGrotesk.className} h-full bg-[#f2f2f2] flex justify-center`}>
          <div className="w-full max-w-[420px] h-full bg-white shadow-xl overflow-hidden relative">
          {pathname !== "/" && <Header />}      
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <main className=" h-full">
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
        </body>
      </Web3Provider>
    </html>
  );
}
