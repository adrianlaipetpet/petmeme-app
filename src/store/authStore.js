import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      pet: null,
      isLoading: true,
      isOnboarded: false,
      following: [], // List of user IDs that the current user follows
      
      // Set user after login
      setUser: (user) => set({ user, isLoading: false }),
      
      // Set pet profile
      setPet: (pet) => set({ pet, isOnboarded: !!pet }),
      
      // Update pet details
      updatePet: (updates) => set((state) => ({
        pet: state.pet ? { ...state.pet, ...updates } : updates
      })),
      
      // Follow a user - uses transaction-based service
      followUser: async (targetUserId) => {
        const state = get();
        const currentUserId = state.user?.uid;
        
        if (!currentUserId || !targetUserId) return { success: false };
        if (state.following.includes(targetUserId)) return { success: true, following: true };
        if (targetUserId === currentUserId) return { success: false, error: 'Cannot follow yourself' };
        
        // Optimistic update
        set({ following: [...state.following, targetUserId] });
        
        try {
          // Dynamic import to avoid circular dependency
          const { toggleFollowUser } = await import('../services/socialService');
          const result = await toggleFollowUser(targetUserId, currentUserId);
          
          if (!result.success) {
            // Revert on error
            set({ following: state.following });
            return result;
          }
          
          console.log('✅ Followed user:', targetUserId);
          return result;
        } catch (error) {
          console.error('Error following user:', error);
          // Revert on error
          set({ following: state.following });
          return { success: false, error: error.message };
        }
      },
      
      // Unfollow a user - uses transaction-based service
      unfollowUser: async (targetUserId) => {
        const state = get();
        const currentUserId = state.user?.uid;
        
        if (!currentUserId || !targetUserId) return { success: false };
        if (!state.following.includes(targetUserId)) return { success: true, following: false };
        
        // Optimistic update
        set({ following: state.following.filter(id => id !== targetUserId) });
        
        try {
          // Dynamic import to avoid circular dependency
          const { toggleFollowUser } = await import('../services/socialService');
          const result = await toggleFollowUser(targetUserId, currentUserId);
          
          if (!result.success) {
            // Revert on error
            set({ following: [...state.following, targetUserId] });
            return result;
          }
          
          console.log('✅ Unfollowed user:', targetUserId);
          return result;
        } catch (error) {
          console.error('Error unfollowing user:', error);
          // Revert on error
          set({ following: [...state.following, targetUserId] });
          return { success: false, error: error.message };
        }
      },
      
      // Check if following a user
      isFollowingUser: (userId) => {
        return get().following.includes(userId);
      },
      
      // Set following list (for loading from Firestore)
      setFollowing: (followingList) => set({ following: followingList || [] }),
      
      // Load following list from Firestore
      loadFollowingFromFirestore: async () => {
        const state = get();
        const userId = state.user?.uid;
        if (!userId) return;
        
        try {
          const { getFollowingList } = await import('../services/socialService');
          const followingList = await getFollowingList(userId);
          set({ following: followingList });
          console.log('✅ Loaded following list:', followingList.length, 'users');
        } catch (error) {
          console.error('Error loading following list:', error);
        }
      },
      
      // Clear all auth state (logout)
      logout: () => set({ 
        user: null, 
        pet: null, 
        isOnboarded: false,
        isLoading: false,
        following: []
      }),
      
      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'petmeme-auth',
      partialize: (state) => ({ 
        pet: state.pet,
        isOnboarded: state.isOnboarded,
        following: state.following
      }),
    }
  )
);
