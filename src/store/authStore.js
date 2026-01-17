import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      pet: null,
      isLoading: true,
      isOnboarded: false,
      
      // Set user after login
      setUser: (user) => set({ user, isLoading: false }),
      
      // Set pet profile
      setPet: (pet) => set({ pet, isOnboarded: !!pet }),
      
      // Update pet details
      updatePet: (updates) => set((state) => ({
        pet: state.pet ? { ...state.pet, ...updates } : updates
      })),
      
      // Clear all auth state (logout)
      logout: () => set({ 
        user: null, 
        pet: null, 
        isOnboarded: false,
        isLoading: false 
      }),
      
      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'petmeme-auth',
      partialize: (state) => ({ 
        pet: state.pet,
        isOnboarded: state.isOnboarded 
      }),
    }
  )
);
