"use client";

import { ConnectKitButton } from "connectkit";

export default function ConnectButton() {
  return (
    <div className="absolute top-4 right-4 z-50">
      <ConnectKitButton theme="retro" />
    </div>
  );
} 