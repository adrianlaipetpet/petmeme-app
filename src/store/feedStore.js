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
  getDoc,
  deleteDoc
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
  
  // Remove post from local state
  removePost: (postId) => set((state) => ({
    posts: state.posts.filter(post => post.id !== postId)
  })),
  
  // Soft delete post (moves to trash, can be restored)
  deletePost: async (postId) => {
    try {
      console.log('🗑️ Soft deleting post:', postId);
      
      // Soft delete - add deleted flag instead of removing
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      
      // Remove from local state (but still exists in Firestore)
      set((state) => ({
        posts: state.posts.filter(post => post.id !== postId)
      }));
      
      console.log('✅ Post moved to trash');
      return true;
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      return false;
    }
  },
  
  // Restore a deleted post
  restorePost: async (postId) => {
    try {
      console.log('♻️ Restoring post:', postId);
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        deleted: false,
        deletedAt: null,
      });
      
      console.log('✅ Post restored');
      return true;
    } catch (error) {
      console.error('❌ Error restoring post:', error);
      return false;
    }
  },
  
  // Permanently delete a post (cannot be undone!)
  permanentlyDeletePost: async (postId) => {
    try {
      console.log('🔥 Permanently deleting post:', postId);
      
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      console.log('✅ Post permanently deleted');
      return true;
    } catch (error) {
      console.error('❌ Error permanently deleting post:', error);
      return false;
    }
  },
  
  // Load deleted posts (trash) for a user
  loadDeletedPosts: async (userId) => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('ownerId', '==', userId),
        where('deleted', '==', true),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const deletedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        deletedAt: doc.data().deletedAt?.toDate() || new Date(),
      }));
      
      return deletedPosts;
    } catch (error) {
      console.error('Error loading deleted posts:', error);
      return [];
    }
  },
  
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
    console.log('🔥🔥🔥 loadPosts called! isInitial:', isInitial);
    
    // Don't skip if loading - let it run
    set({ isLoading: true });
    
    try {
      console.log('🔥 feedStore: Starting Firestore query...');
      
      const postsRef = collection(db, 'posts');
      
      // Super simple query - no filters, no orderBy
      const q = query(postsRef, limit(20));
      console.log('🔥 feedStore: Executing query...');
      
      const snapshot = await getDocs(q);
      console.log('🔥🔥🔥 feedStore: Got', snapshot.docs.length, 'documents from Firestore!');
      
      // Log each document ID
      snapshot.docs.forEach((doc, i) => {
        console.log(`📄 Doc ${i}:`, doc.id);
      });
      
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
      
      // Sort by createdAt in memory (newest first)
      newPosts.sort((a, b) => b.createdAt - a.createdAt);
      
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
      
      console.log('🔥🔥🔥 Returning', newPosts.length, 'posts to Home');
      return newPosts;
    } catch (error) {
      console.error('❌ feedStore: Error loading posts from Firestore:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Subscribe to real-time updates (live feed - updates automatically!)
  // Filters out deleted posts
  subscribeToFeed: (userId = null) => {
    const { unsubscribe: existingUnsub } = get();
    if (existingUnsub) existingUnsub();
    
    console.log('🔴 Setting up real-time feed listener...');
    
    const postsRef = collection(db, 'posts');
    // Simple query without orderBy to avoid index requirement
    const q = query(postsRef, limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔴 Real-time update: got', snapshot.docs.length, 'posts');
      
      const posts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            isLiked: userId ? (data.likedBy || []).includes(userId) : false,
          };
        })
        // Filter out deleted posts
        .filter(post => !post.deleted);
      
      // Sort by createdAt in memory (newest first)
      posts.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('🔴 Showing', posts.length, 'active posts (deleted filtered out)');
      set({ posts, isLoading: false, hasMore: posts.length >= 30 });
    }, (error) => {
      console.error('❌ Real-time feed error:', error);
    });
    
    set({ unsubscribe });
    return unsubscribe;
  },
  
  // Load posts by user ID (for profile page)
  // Note: Uses simple query to avoid index requirements
  // Filters out deleted posts
  loadUserPosts: async (userId) => {
    set({ isLoading: true });
    
    try {
      const postsRef = collection(db, 'posts');
      // Simple query without orderBy to avoid index requirement
      const q = query(
        postsRef,
        where('ownerId', '==', userId),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const posts = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        // Filter out deleted posts
        .filter(post => !post.deleted);
      
      // Sort in memory instead of in query (avoids index)
      posts.sort((a, b) => b.createdAt - a.createdAt);
      
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
