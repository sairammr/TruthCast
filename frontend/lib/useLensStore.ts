import { create } from "zustand";
import { SessionClient } from '@lens-protocol/client';

interface LensState {
  sessionClient: SessionClient | null;
  setSessionClient: (client: SessionClient) => void;
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
