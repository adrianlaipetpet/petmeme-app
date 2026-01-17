import { create } from 'zustand';

export const useFeedStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  lastDoc: null,
  activeTab: 'foryou', // 'foryou' | 'following' | 'trending'
  
  // Set posts
  setPosts: (posts) => set({ posts }),
  
  // Add more posts (infinite scroll)
  addPosts: (newPosts, lastDoc) => set((state) => ({
    posts: [...state.posts, ...newPosts],
    lastDoc,
    hasMore: newPosts.length > 0
  })),
  
  // Update a single post (like, bookmark, etc.)
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    )
  })),
  
  // Remove post
  removePost: (postId) => set((state) => ({
    posts: state.posts.filter(post => post.id !== postId)
  })),
  
  // Toggle like on a post
  toggleLike: (postId) => set((state) => ({
    posts: state.posts.map(post => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1
        };
      }
      return post;
    })
  })),
  
  // Toggle bookmark
  toggleBookmark: (postId) => set((state) => ({
    posts: state.posts.map(post => {
      if (post.id === postId) {
        return { ...post, isBookmarked: !post.isBookmarked };
      }
      return post;
    })
  })),
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Reset feed
  resetFeed: () => set({ 
    posts: [], 
    lastDoc: null, 
    hasMore: true,
    isLoading: false 
  }),
  
  // Set active tab
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    get().resetFeed();
  },
}));
