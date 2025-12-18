// src/store/authStore.js

import { create } from 'zustand';
import { authService } from '../services/api';

// Zustand Middleware to persist user state (basic storage)
const createAuthStore = (set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'), // Initial state from storage
  
  login: async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      set({ user: userData });
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    await authService.logout();
    set({ user: null });
    localStorage.removeItem('user');
  },
  
  updateUser: (updates) => {
    set((state) => {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
});

// Create the store using a function wrapper for persistence/hydration
export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    login: async (email, password) => {
        try {
            const userData = await authService.login(email, password);
            set({ user: userData });
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            throw error;
        }
    },
    logout: async () => {
        await authService.logout();
        set({ user: null });
        localStorage.removeItem('user');
    },
    updateUser: (updates) => {
      set((state) => {
        const updatedUser = { ...state.user, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },
}));