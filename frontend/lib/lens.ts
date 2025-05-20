import { PublicClient, testnet } from "@lens-protocol/client";

// Create a singleton instance
let lensClientInstance: PublicClient | null = null;

export const getLensClient = () => {
  if (!lensClientInstance) {
    lensClientInstance = PublicClient.create({
      environment: testnet,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    });
  }
  return lensClientInstance;
};

export const lensClient = getLensClient();
