import { create } from "zustand";

type State = {
  count: number;
}
type Action = {
  increase: () => void;
  decrease: () => void;
}
export const useGlobalStore = create<State & Action>((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
  decrease: () => set((state) => ({ count: state.count - 1 })),
}));