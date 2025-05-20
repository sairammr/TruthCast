import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pathname = usePathname();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount and navigation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      stopCamera();
    };

    // Listen for visibility changes and beforeunload
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Stop camera when pathname changes (navigation)
  useEffect(() => {
    if (!pathname.includes("/create") && !pathname.includes("/sandbox")) {
      stopCamera();
    }
  }, [pathname]);

  return {
    stream,
    videoRef,
    startCamera,
    stopCamera,
  };
};
