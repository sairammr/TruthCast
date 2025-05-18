"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";
import AnimatedLogo from "./animated-logo";
import { lensClient } from "@/lib/lens";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const resumed = await lensClient.resumeSession();
    if (resumed.isOk()) {
      const result = await resumed.value.logout();
      console.log(result);
      router.push("/");
    } else {
      console.log(resumed.error);
    }
  };

  const getTitle = () => {
    // Remove leading slash and split by remaining slashes
    const path = pathname.slice(1).split("/");
    
    // Handle root path
    if (pathname === "/") return "TruthCast";
    
    // Handle profile path with username
    if (path[0] === "profile" && path[1]) {
      return `@${path[1]}`;
    }
    
    // Handle post path with ID
    if (path[0] === "post" && path[1]) {
      return "Post";
    }

    // Handle other paths
    switch (path[0]) {
      case "feed":
        return "Feed";
      case "create":
        return "Create";
      case "decrypt":
        return "Decrypt";
      case "profile":
        return "Profile";
      case "settings":
        return "Settings";
      default:
        return "TruthCast";
    }
  };

  const showBackButton = () => {
    return pathname !== "/" && 
           pathname !== "/feed" && 
           pathname !== "/create" && 
           pathname !== "/decrypt" && 
           pathname !== "/profile" && 
           pathname !== "/settings";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center max-w-[420px] mx-auto p-4 bg-[#f5f5f5] dark:bg-black border-b border-black dark:border-white safe-top">
      <div className="w-full max-w-[420px] flex justify-center items-center relative">
        {showBackButton() ? (
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <AnimatedLogo compact={true} />
          </div>
        )}

        <h1 className="text-xl font-bold">
          {getTitle()}
        </h1>

        <div className="flex space-x-2 absolute right-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
            className="brutalist-box bg-white dark:bg-black hover:opacity-80 transition-opacity"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="brutalist-box bg-white dark:bg-black hover:opacity-80 transition-opacity"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
} 