import { create } from "zustand";
import { LensClient } from '@lens-protocol/client';

interface LensState {
  sessionClient: LensClient | null;
  setSessionClient: (client: LensClient) => void;
  followStatus: Record<string, boolean>;
  setFollowStatus: (accountId: string, isFollowing: boolean) => void;
}

export const useLensStore = create<LensState>((set) => ({
  sessionClient: null,
  setSessionClient: (client) => set({ sessionClient: client }),
  followStatus: {},
  setFollowStatus: (accountId, isFollowing) => 
    set((state) => ({
      followStatus: {
        ...state.followStatus,
        [accountId]: isFollowing,
      },
    })),
}));
