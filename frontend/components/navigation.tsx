"use client";
import { Home, Plus, User, Unlock, TestTube } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path, { scroll: false });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-black dark:border-white safe-bottom max-w-[420px] mx-auto shadow-[0_-2px_12px_0_rgba(0,0,0,0.04)] z-50">
      <div className="max-w-3xl mx-auto px-2">
        <div className="flex justify-around items-center h-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation("/feed")}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all font-bold text-xs
              ${
                pathname === "/feed"
                  ? "bg-[#e6f0ff] dark:bg-[#0a1a2f] border-2 border-[#004aad] text-[#004aad] shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900"
              }
            `}
          >
            <Home
              className={`h-7 w-7 mb-1 ${
                pathname === "/feed" ? "text-[#004aad]" : ""
              }`}
            />
            <span>Feed</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation("/sandbox")}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all font-bold text-xs
              ${
                pathname === "/sandbox"
                  ? "bg-[#e6f0ff] dark:bg-[#0a1a2f] border-2 border-[#004aad] text-[#004aad] shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900"
              }
            `}
          >
            <TestTube
              className={`h-7 w-7 mb-1 ${
                pathname === "/sandbox" ? "text-[#004aad]" : ""
              }`}
            />
            <span>Sandbox</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation("/create")}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all font-bold text-xs
              ${
                pathname === "/create"
                  ? "bg-[#e6f0ff] dark:bg-[#0a1a2f] border-2 border-[#004aad] text-[#004aad] shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900"
              }
            `}
          >
            <Plus
              className={`h-7 w-7 mb-1 ${
                pathname === "/create" ? "text-[#004aad]" : ""
              }`}
            />
            <span>Create</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation("/decrypt")}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all font-bold text-xs
              ${
                pathname === "/decrypt"
                  ? "bg-[#e6f0ff] dark:bg-[#0a1a2f] border-2 border-[#004aad] text-[#004aad] shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900"
              }
            `}
          >
            <Unlock
              className={`h-7 w-7 mb-1 ${
                pathname === "/decrypt" ? "text-[#004aad]" : ""
              }`}
            />
            <span>Decrypt</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation("/profile")}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all font-bold text-xs
              ${
                pathname === "/profile"
                  ? "bg-[#e6f0ff] dark:bg-[#0a1a2f] border-2 border-[#004aad] text-[#004aad] shadow-md"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900"
              }
            `}
          >
            <User
              className={`h-7 w-7 mb-1 ${
                pathname === "/profile" ? "text-[#004aad]" : ""
              }`}
            />
            <span>Profile</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
