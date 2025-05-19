"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AnimatedLogo({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showTruth, setShowTruth] = useState(false);

  useEffect(() => {
    // Start the sequence after a short delay
    const timer1 = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500);

    const timer2 = setTimeout(() => {
      setShowTruth(true);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const textSize = compact
    ? "text-lg sm:text-xl leading-tight"
    : "text-4xl sm:text-5xl";
  const fontWeight = "font-bold";
  const containerClass = compact ? "py-0 my-0" : "";

  return (
    <div
      className={`relative ${containerClass} ${className}`}
      style={compact ? { minWidth: 100 } : {}}
    >
      <h1
        className={`${textSize} ${fontWeight} tracking-tight text-black dark:text-white`}
        style={compact ? { lineHeight: 1.1, letterSpacing: 0 } : {}}
      >
        <span className="relative">
          <motion.span
            className="relative inline-block text-red-500"
            initial={{ opacity: 1 }}
            animate={{ opacity: showTruth ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            Fake
            {animationComplete && (
              <motion.div
                className="absolute left-0 top-1/2 w-0 h-[2px] bg-[#10b981]"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            )}
          </motion.span>
          <motion.span
            className="absolute left-0 text-[#10b981]"
            initial={{ opacity: 0 }}
            animate={{ opacity: showTruth ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            Truth
          </motion.span>
        </span>
        {compact ? <span className="ml-1">Cast</span> : " Cast"}
      </h1>
    </div>
  );
}
