import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export interface GeneralState {
  isLoginOpen: boolean;
  isEditProfileOpen: boolean;
  selectedPosts: null;
  ids: null;
  posts: null;
}

export interface GeneralActions {
  setLoginIsOpen: (isLoginOpen: boolean) => void;
  setIsEditProfileOpen: () => void;
}

export const useGeneralStore = create<GeneralState & GeneralActions>()(
    devtools(
        persist((set) => ({
                    isLoginOpen: false,
                    isEditProfileOpen: false,
                    selectedPosts: null,
                    ids: null,
                    posts: null,
                    setLoginIsOpen: (isLoginOpen: boolean) => set({isLoginOpen}),
                    setIsEditProfileOpen: () => 
                        set((state) => ({isEditProfileOpen: !state.isEditProfileOpen})),
                }),
            {
                name: 'general-storage',
            }
        )
    )
)