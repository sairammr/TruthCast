import { Home, Plus, User, Unlock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-black dark:border-white safe-bottom max-w-[420px] mx-auto" >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/feed"
            className={`flex flex-col items-center justify-center ${
              pathname === "/feed" ? "text-[#004aad]" : "text-gray-500"
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Feed</span>
          </Link>
          <Link
            href="/create"
            className={`flex flex-col items-center justify-center ${
              pathname === "/create" ? "text-[#004aad]" : "text-gray-500"
            }`}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1">Create</span>
          </Link>
          <Link
            href="/decrypt"
            className={`flex flex-col items-center justify-center ${
              pathname === "/decrypt" ? "text-[#004aad]" : "text-gray-500"
            }`}
          >
            <Unlock className="h-6 w-6" />
            <span className="text-xs mt-1">Decrypt</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center ${
              pathname === "/profile" ? "text-[#004aad]" : "text-gray-500"
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
