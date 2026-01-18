import { create } from 'zustand';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc, 
  increment,
  onSnapshot,
  where,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const POSTS_PER_PAGE = 10;

export const useFeedStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  lastDoc: null,
  activeTab: 'foryou', // 'foryou' | 'following' | 'trending'
  unsubscribe: null, // For real-time listener cleanup
  
  // Set posts
  setPosts: (posts) => set({ posts }),
  
  // Add more posts (infinite scroll)
  addPosts: (newPosts, lastDoc) => set((state) => ({
    posts: [...state.posts, ...newPosts],
    lastDoc,
    hasMore: newPosts.length >= POSTS_PER_PAGE
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
  
  // Toggle like on a post (with optional Firestore sync)
  // If userId is null, it's demo mode - just update locally
  toggleLike: async (postId, userId = null) => {
    const state = get();
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = userId 
      ? (post.likedBy?.includes(userId) || post.isLiked)
      : post.isLiked;
    
    // Optimistic update for instant UI feedback
    set((state) => ({
      posts: state.posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !isLiked,
            likeCount: isLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
            likedBy: userId 
              ? (isLiked 
                  ? (p.likedBy || []).filter(id => id !== userId)
                  : [...(p.likedBy || []), userId])
              : p.likedBy
          };
        }
        return p;
      })
    }));
    
    // Skip Firestore sync in demo mode (no userId)
    if (!userId) return;
    
    // Sync with Firestore
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likeCount: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      set((state) => ({
        posts: state.posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: isLiked,
              likeCount: isLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
              likedBy: isLiked 
                ? [...(p.likedBy || []), userId]
                : (p.likedBy || []).filter(id => id !== userId)
            };
          }
          return p;
        })
      }));
    }
  },
  
  // Toggle bookmark (local only for now, can add Firestore later)
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
  resetFeed: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ 
      posts: [], 
      lastDoc: null, 
      hasMore: true,
      isLoading: false,
      unsubscribe: null
    });
  },
  
  // Set active tab
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    get().resetFeed();
  },
  
  // ========================================
  // REAL FIRESTORE QUERIES
  // ========================================
  
  // Load posts from Firestore (with pagination)
  loadPosts: async (isInitial = false, userId = null) => {
    const state = get();
    if (state.isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const postsRef = collection(db, 'posts');
      let q;
      
      // Build query based on active tab
      switch (state.activeTab) {
        case 'trending':
          // Trending: order by like count
          q = query(
            postsRef,
            orderBy('likeCount', 'desc'),
            limit(POSTS_PER_PAGE)
          );
          break;
        case 'following':
          // Following: would need a following list, for now just show recent
          // TODO: Add following functionality
          q = query(
            postsRef,
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
          break;
        default: // 'foryou'
          q = query(
            postsRef,
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
      }
      
      // Add pagination cursor
      if (!isInitial && state.lastDoc) {
        q = query(
          collection(db, 'posts'),
          orderBy(state.activeTab === 'trending' ? 'likeCount' : 'createdAt', 'desc'),
          startAfter(state.lastDoc),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      
      const newPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date
          createdAt: data.createdAt?.toDate() || new Date(),
          // Check if current user has liked
          isLiked: userId ? (data.likedBy || []).includes(userId) : false,
        };
      });
      
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      
      if (isInitial) {
        set({ 
          posts: newPosts, 
          lastDoc,
          hasMore: newPosts.length >= POSTS_PER_PAGE
        });
      } else {
        set((state) => ({
          posts: [...state.posts, ...newPosts],
          lastDoc,
          hasMore: newPosts.length >= POSTS_PER_PAGE
        }));
      }
      
      return newPosts;
    } catch (error) {
      console.error('Error loading posts from Firestore:', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Subscribe to real-time updates (optional - for live feed)
  subscribeToFeed: (userId = null) => {
    const { unsubscribe: existingUnsub } = get();
    if (existingUnsub) existingUnsub();
    
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          isLiked: userId ? (data.likedBy || []).includes(userId) : false,
        };
      });
      
      set({ posts, isLoading: false });
    }, (error) => {
      console.error('Real-time feed error:', error);
    });
    
    set({ unsubscribe });
    return unsubscribe;
  },
  
  // Load posts by user ID (for profile page)
  loadUserPosts: async (userId) => {
    set({ isLoading: true });
    
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      return posts;
    } catch (error) {
      console.error('Error loading user posts:', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Add a comment to a post
  addComment: async (postId, userId, petName, petPhotoUrl, text) => {
    try {
      // Add to comments subcollection
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, {
        userId,
        petName,
        petPhotoUrl,
        text,
        createdAt: serverTimestamp(),
        likeCount: 0
      });
      
      // Increment comment count on post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });
      
      // Update local state
      set((state) => ({
        posts: state.posts.map(p => 
          p.id === postId 
            ? { ...p, commentCount: (p.commentCount || 0) + 1 } 
            : p
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  },
  
  // Load comments for a post
  loadComments: async (postId) => {
    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  },
}));
