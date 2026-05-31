import { create } from 'zustand';

interface SearchOverlayStore {
  resetNonce: number;
  requestReset: () => void;
}

/** Bumps resetNonce so SearchOverlay remounts with a blank form after snapshot dismiss. */
export const useSearchOverlayStore = create<SearchOverlayStore>((set) => ({
  resetNonce: 0,
  requestReset: () => set((s) => ({ resetNonce: s.resetNonce + 1 })),
}));
