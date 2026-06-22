import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      updateUser: (patch) =>
        set((state) => {
          if (!state.session) {
            return state;
          }

          return {
            session: {
              ...state.session,
              user: { ...state.session.user, ...patch },
            },
          };
        }),
      logout: () => set({ session: null }),
    }),
    {
      name: "void-troupe-auth",
    },
  ),
);
