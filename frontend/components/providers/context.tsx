"use client";

import { create } from "zustand";

interface EnvironmentStore {
  worldAddress: string | null;
  setWorldAddress: (address: string | null) => void;
}

export const useEnvironmentStore = create<EnvironmentStore>((set) => ({
  worldAddress: null,
  setWorldAddress: (address) => set({ worldAddress: address }),
}));
