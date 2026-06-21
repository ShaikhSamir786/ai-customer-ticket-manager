import { create } from 'zustand';
import { setAccessToken } from '../../api/apollo-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    setAccessToken(token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    setAccessToken('');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
