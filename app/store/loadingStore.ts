import { create } from "zustand";

interface LoadingStore {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  setLoading: (value: boolean) => set({ isLoading: value }),
}));
