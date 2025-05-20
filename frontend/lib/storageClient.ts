import { StorageClient } from "@lens-chain/storage-client";

// Create a singleton instance
let storageClientInstance: StorageClient | null = null;

export const getStorageClient = () => {
  if (!storageClientInstance) {
    storageClientInstance = StorageClient.create();
  }
  return storageClientInstance;
};

export const storageClient = getStorageClient();
