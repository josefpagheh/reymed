import { create } from 'zustand'

type Role = 'doctor' | 'clerk' | null

interface AuthState {
  role: Role
  setRole: (role: Role) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}))
