import { create } from 'zustand';
import { authService, userService } from '../services/api';

export const useAuthStore = create((set, get) => ({
    // Initialize user from localStorage
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

    // This handles the FormData (name + avatar file)
    updateUser: async (formData) => {
        try {
            // Use the userService we defined in api.js
            // This ensures the JWT interceptor is used automatically
            const updatedData = await userService.updateProfile(formData);

            // Get current user to keep the token in the object
            const currentUser = get().user;

            // Merge new data (name/avatar) with existing data (token)
            const newUserState = { ...currentUser, ...updatedData };

            set({ user: newUserState });
            localStorage.setItem('user', JSON.stringify(newUserState));
            
            return newUserState;
        } catch (error) {
            console.error("Store update error:", error);
            throw error;
        }
    },
}));