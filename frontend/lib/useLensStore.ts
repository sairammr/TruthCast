import { create } from "zustand";

interface LensStore {
  sessionClient: any; // Replace `any` with a more specific type if available
  setSessionClient: (client: any) => void;
}

export const useLensStore = create<LensStore>((set) => ({
  sessionClient: null,
  setSessionClient: (client) => set({ sessionClient: client }),
}));
