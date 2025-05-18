import { create } from "zustand";

interface LensState {
  followStatus: Record<string, boolean>;
  setFollowStatus: (accountId: string, isFollowing: boolean) => void;
}

export const useLensStore = create<LensState>((set) => ({
  followStatus: {},
  setFollowStatus: (accountId, isFollowing) => 
    set((state) => ({
      followStatus: {
        ...state.followStatus,
        [accountId]: isFollowing,
      },
    })),
}));
