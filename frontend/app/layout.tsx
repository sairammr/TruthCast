import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/providers/MinikitProvider";
import { ThemeProvider } from "@/components/theme-provider";
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DeepTruth",
  description: "Share your deep truths with the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <MiniKitProvider>
        <body className={spaceGrotesk.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </MiniKitProvider>
    </html>
  );
}
