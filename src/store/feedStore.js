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
  setDoc,
  deleteDoc,
  runTransaction  // For atomic repost operations
} from 'firebase/firestore';
import { db } from '../config/firebase';

const POSTS_PER_PAGE = 10;

export const useFeedStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  lastDoc: null,
  activeTab: 'foryou', // 'foryou' | 'following'
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
  // Also CASCADE DELETES all reposts of this post!
  deletePost: async (postId) => {
    try {
      console.log('🗑️ Soft deleting post:', postId);
      
      // Soft delete - add deleted flag instead of removing
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      
      // CASCADE DELETE: Find and delete all reposts of this post
      console.log('🔗 Finding reposts to cascade delete...');
      const postsRef = collection(db, 'posts');
      const repostsQuery = query(
        postsRef,
        where('originalPostId', '==', postId),
        where('type', '==', 'repost')
      );
      
      const repostsSnapshot = await getDocs(repostsQuery);
      const repostIds = [];
      
      if (!repostsSnapshot.empty) {
        console.log(`🔗 Found ${repostsSnapshot.size} reposts to delete`);
        
        // Soft delete each repost
        const deletePromises = repostsSnapshot.docs.map(async (repostDoc) => {
          repostIds.push(repostDoc.id);
          return updateDoc(doc(db, 'posts', repostDoc.id), {
            deleted: true,
            deletedAt: serverTimestamp(),
            deletedReason: 'original_deleted', // Track why it was deleted
          });
        });
        
        await Promise.all(deletePromises);
        console.log('🔗 Cascade deleted', repostIds.length, 'reposts');
      }
      
      // Remove from local state (original + all reposts)
      set((state) => ({
        posts: state.posts.filter(post => 
          post.id !== postId && !repostIds.includes(post.id)
        )
      }));
      
      console.log('✅ Post and reposts moved to trash');
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
  // Also CASCADE DELETES all reposts of this post!
  permanentlyDeletePost: async (postId) => {
    try {
      console.log('🔥 Permanently deleting post:', postId);
      
      // CASCADE DELETE: Find and permanently delete all reposts first
      const postsRef = collection(db, 'posts');
      const repostsQuery = query(
        postsRef,
        where('originalPostId', '==', postId),
        where('type', '==', 'repost')
      );
      
      const repostsSnapshot = await getDocs(repostsQuery);
      
      if (!repostsSnapshot.empty) {
        console.log(`🔗 Permanently deleting ${repostsSnapshot.size} reposts`);
        const deletePromises = repostsSnapshot.docs.map(repostDoc => 
          deleteDoc(doc(db, 'posts', repostDoc.id))
        );
        await Promise.all(deletePromises);
      }
      
      // Now delete the original post
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      console.log('✅ Post and all reposts permanently deleted');
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
  
  // Toggle like on a post using transaction-based service
  // If userId is null, it's demo mode - just update locally
  toggleLike: async (postId, userId = null) => {
    const state = get();
    const post = state.posts.find(p => p.id === postId);
    if (!post) return { success: false };
    
    const isCurrentlyLiked = userId 
      ? (post.likedBy?.includes(userId) || post.isLiked)
      : post.isLiked;
    
    // Optimistic update for instant UI feedback
    set((state) => ({
      posts: state.posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !isCurrentlyLiked,
            likeCount: isCurrentlyLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
            likedBy: userId 
              ? (isCurrentlyLiked 
                  ? (p.likedBy || []).filter(id => id !== userId)
                  : [...(p.likedBy || []), userId])
              : p.likedBy
          };
        }
        return p;
      })
    }));
    
    // Skip Firestore sync in demo mode (no userId)
    if (!userId) return { success: true, liked: !isCurrentlyLiked };
    
    // Use transaction-based service for atomic updates
    try {
      // Dynamic import to avoid circular dependency
      const { toggleLikePost } = await import('../services/socialService');
      const result = await toggleLikePost(postId, userId);
      
      if (!result.success) {
        // Revert optimistic update on error
        set((state) => ({
          posts: state.posts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: isCurrentlyLiked,
                likeCount: isCurrentlyLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
                likedBy: isCurrentlyLiked 
                  ? [...(p.likedBy || []), userId]
                  : (p.likedBy || []).filter(id => id !== userId)
              };
            }
            return p;
          })
        }));
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      set((state) => ({
        posts: state.posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: isCurrentlyLiked,
              likeCount: isCurrentlyLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
              likedBy: isCurrentlyLiked 
                ? [...(p.likedBy || []), userId]
                : (p.likedBy || []).filter(id => id !== userId)
            };
          }
          return p;
        })
      }));
      return { success: false, error: error.message };
    }
  },
  
  // Toggle bookmark - saves to Firestore user document
  toggleBookmark: async (postId, userId) => {
    if (!postId) return { success: false };
    
    const state = get();
    const post = state.posts.find(p => p.id === postId);
    const isCurrentlyBookmarked = post?.isBookmarked || false;
    
    // Optimistic update
    set((state) => ({
      posts: state.posts.map(p => {
        if (p.id === postId) {
          return { ...p, isBookmarked: !isCurrentlyBookmarked };
        }
        return p;
      })
    }));
    
    // Skip Firestore sync if no userId
    if (!userId) return { success: true, bookmarked: !isCurrentlyBookmarked };
    
    try {
      const userRef = doc(db, 'users', userId);
      
      if (isCurrentlyBookmarked) {
        // Remove from bookmarks
        await updateDoc(userRef, {
          bookmarks: arrayRemove(postId)
        });
      } else {
        // Add to bookmarks
        await setDoc(userRef, {
          bookmarks: arrayUnion(postId)
        }, { merge: true });
      }
      
      console.log(`✅ ${isCurrentlyBookmarked ? 'Unbookmarked' : 'Bookmarked'} post ${postId}`);
      return { success: true, bookmarked: !isCurrentlyBookmarked };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      set((state) => ({
        posts: state.posts.map(p => {
          if (p.id === postId) {
            return { ...p, isBookmarked: isCurrentlyBookmarked };
          }
          return p;
        })
      }));
      return { success: false, error: error.message };
    }
  },
  
  // Load user's bookmarked posts
  loadBookmarkedPosts: async (userId) => {
    if (!userId) return [];
    
    try {
      // First get the user's bookmarks list
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return [];
      
      const bookmarkIds = userDoc.data()?.bookmarks || [];
      
      if (bookmarkIds.length === 0) return [];
      
      // Fetch all bookmarked posts (in batches if needed)
      const posts = [];
      
      // Firestore 'in' queries are limited to 10 items, so batch them
      const batchSize = 10;
      for (let i = 0; i < bookmarkIds.length; i += batchSize) {
        const batch = bookmarkIds.slice(i, i + batchSize);
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('__name__', 'in', batch));
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            isBookmarked: true,
          });
        });
      }
      
      // Sort by most recently bookmarked (reverse order of bookmarkIds)
      posts.sort((a, b) => bookmarkIds.indexOf(b.id) - bookmarkIds.indexOf(a.id));
      
      console.log('📚 Loaded', posts.length, 'bookmarked posts');
      return posts;
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  },
  
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
  // Filters out deleted posts, consolidates reposts by same original
  // Shows "Reposted by X, Y, and Z" when multiple users repost the same thing
  // When activeTab is 'following', only shows posts from followed users
  subscribeToFeed: (userId = null, followingList = []) => {
    const { unsubscribe: existingUnsub, activeTab } = get();
    if (existingUnsub) existingUnsub();
    
    // Set loading true at start to prevent demo mode fallback from triggering
    set({ isLoading: true });
    
    console.log('🔴 Setting up real-time feed listener for user:', userId, 'tab:', activeTab, 'following:', followingList?.length || 0);
    
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, limit(100)); // Fetch more to consolidate reposts
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔴 Real-time update: got', snapshot.docs.length, 'posts');
      
      // First pass: map all posts
      let allPosts = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            isLiked: userId ? (data.likedBy || []).includes(userId) : false,
          };
        })
        .filter(post => !post.deleted);
      
      // Filter by followed users if on "following" tab
      if (activeTab === 'following' && followingList && followingList.length > 0) {
        allPosts = allPosts.filter(post => followingList.includes(post.ownerId));
        console.log('🔴 Filtered to following only:', allPosts.length, 'posts from', followingList.length, 'followed users');
      } else if (activeTab === 'following') {
        // Following tab but no one followed yet - show empty
        console.log('🔴 Following tab but no followed users');
        allPosts = [];
      }
      
      // Separate originals and reposts
      const originalPosts = allPosts.filter(p => p.type !== 'repost');
      const reposts = allPosts.filter(p => p.type === 'repost');
      
      // Build a map of originalPostId -> array of reposters
      const repostsByOriginal = new Map();
      reposts.forEach(repost => {
        const origId = repost.originalPostId;
        if (!origId) return;
        
        if (!repostsByOriginal.has(origId)) {
          repostsByOriginal.set(origId, {
            reposters: [],
            latestRepostTime: repost.createdAt,
            repostIds: [],
          });
        }
        
        const entry = repostsByOriginal.get(origId);
        entry.reposters.push({
          id: repost.reposter?.id || repost.ownerId,
          name: repost.reposter?.name || 'Someone',
          photoUrl: repost.reposter?.photoUrl || null,
        });
        entry.repostIds.push(repost.id);
        
        // Track the latest repost time for sorting
        if (repost.createdAt > entry.latestRepostTime) {
          entry.latestRepostTime = repost.createdAt;
        }
      });
      
      console.log('🔴 Found reposts for', repostsByOriginal.size, 'unique originals');
      
      // Build a set of originalPostIds that this user has reposted
      const userRepostOriginalIds = new Set();
      if (userId) {
        reposts.forEach(repost => {
          if (repost.ownerId === userId && repost.originalPostId) {
            userRepostOriginalIds.add(repost.originalPostId);
          }
        });
      }
      
      // Build a map of original posts for metrics
      const originalPostsMap = new Map();
      originalPosts.forEach(post => {
        originalPostsMap.set(post.id, post);
      });
      
      // Fetch any missing originals (if repost exists but original isn't in feed)
      const missingOrigIds = [...repostsByOriginal.keys()].filter(id => !originalPostsMap.has(id));
      for (const origId of missingOrigIds) {
        try {
          const origDoc = await getDoc(doc(db, 'posts', origId));
          if (origDoc.exists()) {
            const origData = origDoc.data();
            originalPostsMap.set(origId, {
              id: origId,
              ...origData,
              createdAt: origData.createdAt?.toDate() || new Date(),
              isLiked: userId ? (origData.likedBy || []).includes(userId) : false,
            });
          }
        } catch (e) {
          console.log('Could not fetch original post:', origId);
        }
      }
      
      // Build the final feed: consolidate reposts into original posts
      let feedPosts = [];
      const addedOriginalIds = new Set();
      
      // First, add original posts with repost info attached
      originalPosts.forEach(post => {
        const enriched = { ...post };
        enriched.isReposted = userRepostOriginalIds.has(post.id);
        
        // Attach reposter info if this post has been reposted
        if (repostsByOriginal.has(post.id)) {
          const repostInfo = repostsByOriginal.get(post.id);
          enriched.repostedBy = repostInfo.reposters;
          enriched.repostIds = repostInfo.repostIds;
          enriched.wasReposted = true;
          // Boost visibility: use latest repost time for sorting if more recent
          enriched.boostTime = repostInfo.latestRepostTime;
        }
        
        feedPosts.push(enriched);
        addedOriginalIds.add(post.id);
      });
      
      // For reposts where original isn't already in feed, add the original
      repostsByOriginal.forEach((repostInfo, origId) => {
        if (!addedOriginalIds.has(origId) && originalPostsMap.has(origId)) {
          const originalPost = originalPostsMap.get(origId);
          const enriched = {
            ...originalPost,
            isReposted: userRepostOriginalIds.has(origId),
            repostedBy: repostInfo.reposters,
            repostIds: repostInfo.repostIds,
            wasReposted: true,
            boostTime: repostInfo.latestRepostTime,
          };
          feedPosts.push(enriched);
          addedOriginalIds.add(origId);
        }
      });
      
      // Sort: prioritize posts with recent reposts, then by createdAt
      feedPosts.sort((a, b) => {
        // Use boostTime (latest repost) if available, otherwise createdAt
        const aTime = a.boostTime || a.createdAt;
        const bTime = b.boostTime || b.createdAt;
        return bTime - aTime;
      });
      
      console.log('🔴 Showing', feedPosts.length, 'consolidated posts (reposts merged)');
      set({ posts: feedPosts, isLoading: false, hasMore: feedPosts.length >= 30 });
    }, (error) => {
      console.error('❌ Real-time feed error:', error);
    });
    
    set({ unsubscribe });
    return unsubscribe;
  },
  
  // Load ORIGINAL posts by user ID (for "My Memes" tab on profile)
  // Excludes reposts - those go in "Reposts" tab
  // Uses simple query + in-memory filter to avoid Firestore index requirements
  loadUserPosts: async (userId) => {
    set({ isLoading: true });
    
    try {
      console.log('📷 Loading original posts for user:', userId);
      
      const postsRef = collection(db, 'posts');
      // Simple query - filter by ownerId only
      const q = query(
        postsRef,
        where('ownerId', '==', userId),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      console.log('📷 Got', snapshot.docs.length, 'total docs for user');
      
      const posts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
        // IMPORTANT: Filter out reposts (type === 'repost') and deleted posts
        // "My Memes" should only show ORIGINAL posts created by this user
        .filter(post => post.type !== 'repost' && !post.deleted);
      
      // Sort in memory (newest first)
      posts.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('📷 Returning', posts.length, 'original posts (reposts filtered out)');
      return posts;
    } catch (error) {
      console.error('❌ Error loading user posts:', error);
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
  
  // Delete a comment from a post
  deleteComment: async (postId, commentId, userId) => {
    try {
      // Get the comment to verify ownership
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        console.error('Comment not found');
        return { success: false, error: 'Comment not found' };
      }
      
      // Verify the user owns this comment
      const commentData = commentDoc.data();
      if (commentData.userId !== userId) {
        console.error('User does not own this comment');
        return { success: false, error: 'Not authorized to delete this comment' };
      }
      
      // Delete the comment
      await deleteDoc(commentRef);
      
      // Decrement comment count on post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: increment(-1)
      });
      
      // Update local state
      set((state) => ({
        posts: state.posts.map(p => 
          p.id === postId 
            ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) } 
            : p
        )
      }));
      
      console.log('✅ Comment deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ========================================
  // REPOST FEATURE 🔄
  // Boosts virality by letting users share memes to their followers
  // ========================================
  
  /**
   * Repost a post to the current user's profile/feed
   * Uses Firestore TRANSACTION for atomic operations:
   * 1. Creates new repost doc
   * 2. Increments repostCount on original post
   * 
   * @param {string} originalPostId - ID of the post being reposted
   * @param {object} reposter - Current user's pet info { id, name, photoUrl }
   * @returns {object} { success: boolean, repostId?: string, error?: string }
   */
  repostPost: async (originalPostId, reposter) => {
    if (!reposter?.id) {
      console.error('❌ Repost failed: No reposter info');
      return { success: false, error: 'Login required' };
    }
    
    console.log('🔄 Starting repost for post:', originalPostId, 'by:', reposter.id);
    
    // OPTIMISTIC UPDATE: Immediately show +1 and green state
    const currentPosts = get().posts;
    const originalPost = currentPosts.find(p => p.id === originalPostId);
    const previousCount = originalPost?.repostCount || 0;
    
    set((state) => ({
      posts: state.posts.map(p => 
        p.id === originalPostId 
          ? { ...p, repostCount: previousCount + 1, isReposted: true }
          : p
      ),
    }));
    
    try {
      // Get the original post data first (outside transaction)
      const originalPostRef = doc(db, 'posts', originalPostId);
      const originalPostSnap = await getDoc(originalPostRef);
      
      if (!originalPostSnap.exists()) {
        // Rollback optimistic update
        set((state) => ({
          posts: state.posts.map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: previousCount, isReposted: false }
              : p
          ),
        }));
        return { success: false, error: 'Post not found' };
      }
      
      const originalPostData = originalPostSnap.data();
      
      // Don't allow reposting your own post
      if (originalPostData.ownerId === reposter.id) {
        // Rollback
        set((state) => ({
          posts: state.posts.map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: previousCount, isReposted: false }
              : p
          ),
        }));
        return { success: false, error: 'Cannot repost your own post' };
      }
      
      // Check if user already reposted this (simple query + filter)
      const userPostsQuery = query(
        collection(db, 'posts'),
        where('ownerId', '==', reposter.id),
        limit(100)
      );
      const userPosts = await getDocs(userPostsQuery);
      const alreadyReposted = userPosts.docs.some(doc => {
        const data = doc.data();
        return data.type === 'repost' && data.originalPostId === originalPostId;
      });
      
      if (alreadyReposted) {
        // Rollback
        set((state) => ({
          posts: state.posts.map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: previousCount, isReposted: true } // Keep green since already reposted
              : p
          ),
        }));
        return { success: false, error: 'Already reposted' };
      }
      
      // Use TRANSACTION for atomic create + increment
      let repostId = null;
      let newRepostCount = 0;
      
      await runTransaction(db, async (transaction) => {
        // Re-read original post inside transaction for consistency
        const freshOriginal = await transaction.get(originalPostRef);
        if (!freshOriginal.exists()) {
          throw new Error('Post not found');
        }
        
        const currentCount = freshOriginal.data().repostCount || 0;
        newRepostCount = currentCount + 1;
        
        // Prepare repost document with clear markers for Firestore visibility
        const repostData = {
          // ===== REPOST MARKERS (easy to spot in Firestore!) =====
          type: 'repost',
          _label: '🔄 REPOST',  // Human-readable label for Firestore console
          isRepost: true,       // Boolean for easy filtering
          
          // ===== ORIGINAL POST REFERENCE =====
          originalPostId: originalPostId,
          originalPost: {
            mediaUrl: originalPostData.mediaUrl,
            caption: originalPostData.caption,
            memeText: originalPostData.memeText || null,
            textOverlay: originalPostData.textOverlay || null,
            overlayPosition: originalPostData.overlayPosition || null,
            pet: originalPostData.pet,
            behaviors: originalPostData.behaviors || [],
            hashtags: originalPostData.hashtags || [],
          },
          
          // ===== REPOSTER INFO =====
          ownerId: reposter.id,
          reposter: {
            id: reposter.id,
            name: reposter.name,
            photoUrl: reposter.photoUrl,
          },
          
          // ===== METADATA =====
          createdAt: serverTimestamp(),
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          likedBy: [],
          deleted: false,
        };
        
        // Create new repost doc (get ref first)
        const newRepostRef = doc(collection(db, 'posts'));
        repostId = newRepostRef.id;
        
        // Within transaction: set repost and update original count
        transaction.set(newRepostRef, repostData);
        transaction.update(originalPostRef, { repostCount: newRepostCount });
      });
      
      console.log('✅ Repost transaction complete. ID:', repostId, 'New count:', newRepostCount);
      
      // Update local state with the ACTUAL count from transaction
      set((state) => ({
        posts: state.posts.map(p => 
          p.id === originalPostId 
            ? { ...p, repostCount: newRepostCount, isReposted: true }
            : p
        ),
      }));
      
      return { success: true, repostId };
    } catch (error) {
      console.error('❌ Repost transaction failed:', error);
      
      // Rollback optimistic update on error
      set((state) => ({
        posts: state.posts.map(p => 
          p.id === originalPostId 
            ? { ...p, repostCount: previousCount, isReposted: false }
            : p
        ),
      }));
      
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Undo a repost (delete the repost document)
   * Uses TRANSACTION for atomic delete + decrement
   */
  undoRepost: async (originalPostId, userId) => {
    console.log('🔄 Undoing repost for post:', originalPostId, 'user:', userId);
    
    // OPTIMISTIC UPDATE: Immediately show -1 and remove green state
    const currentPosts = get().posts;
    const originalPost = currentPosts.find(p => p.id === originalPostId);
    const previousCount = originalPost?.repostCount || 0;
    
    set((state) => ({
      posts: state.posts.map(p => 
        p.id === originalPostId 
          ? { ...p, repostCount: Math.max(0, previousCount - 1), isReposted: false }
          : p
      ),
    }));
    
    try {
      // Find the repost document
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('ownerId', '==', userId), limit(100));
      const snapshot = await getDocs(q);
      
      const repostDocSnap = snapshot.docs.find(d => {
        const data = d.data();
        return data.type === 'repost' && data.originalPostId === originalPostId;
      });
      
      if (!repostDocSnap) {
        console.log('❌ Repost not found');
        // Rollback
        set((state) => ({
          posts: state.posts.map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: previousCount, isReposted: true }
              : p
          ),
        }));
        return { success: false, error: 'Repost not found' };
      }
      
      const repostDocId = repostDocSnap.id;
      const repostDocRef = doc(db, 'posts', repostDocId);
      const originalPostRef = doc(db, 'posts', originalPostId);
      
      // Use TRANSACTION for atomic delete + decrement
      let newRepostCount = 0;
      
      await runTransaction(db, async (transaction) => {
        const freshOriginal = await transaction.get(originalPostRef);
        if (freshOriginal.exists()) {
          const currentCount = freshOriginal.data().repostCount || 0;
          newRepostCount = Math.max(0, currentCount - 1);
          transaction.update(originalPostRef, { repostCount: newRepostCount });
        }
        transaction.delete(repostDocRef);
      });
      
      console.log('✅ Unrepost transaction complete. New count:', newRepostCount);
      
      // Update with actual count and remove repost from feed
      set((state) => ({
        posts: state.posts
          .filter(p => p.id !== repostDocId)
          .map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: newRepostCount, isReposted: false }
              : p
          ),
      }));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Unrepost transaction failed:', error);
      
      // Rollback
      set((state) => ({
        posts: state.posts.map(p => 
          p.id === originalPostId 
            ? { ...p, repostCount: previousCount, isReposted: true }
            : p
        ),
      }));
      
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Check if user has reposted a specific post
   */
  checkIfReposted: async (originalPostId, userId) => {
    if (!userId) return false;
    
    try {
      const repostQuery = query(
        collection(db, 'posts'),
        where('type', '==', 'repost'),
        where('originalPostId', '==', originalPostId),
        where('ownerId', '==', userId),
        limit(1)
      );
      
      const repostSnap = await getDocs(repostQuery);
      return !repostSnap.empty;
    } catch (error) {
      console.error('Error checking repost status:', error);
      return false;
    }
  },
  
  /**
   * Load all reposts by a user (for Profile "Reposts" tab)
   * Uses simple query to avoid Firestore index requirements
   * Filters for type === 'repost' in memory
   */
  loadUserReposts: async (userId) => {
    if (!userId) return [];
    
    try {
      console.log('🔄 Loading reposts for user:', userId);
      
      const postsRef = collection(db, 'posts');
      // Simple query - filter by ownerId only, filter type in memory
      const q = query(
        postsRef,
        where('ownerId', '==', userId),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      console.log('🔄 Got', snapshot.docs.length, 'total posts for user');
      
      const reposts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('📄 Post:', doc.id, 'type:', data.type);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
        // Filter for reposts only (in memory to avoid index)
        .filter(post => post.type === 'repost' && !post.deleted);
      
      // Sort by createdAt (newest first)
      reposts.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('🔄 Found', reposts.length, 'reposts after filtering');
      return reposts;
    } catch (error) {
      console.error('❌ Error loading user reposts:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return [];
    }
  },
  
  // ========================================
  // EXPLORE TAB QUERIES 🔍
  // Trending, Hashtags, Breeds, Behaviors, Personalized
  // All queries use TRENDING SCORE sorting!
  // ========================================
  
  /**
   * Calculate trending score for a post
   * Higher score = more trending
   * Formula: (likes + reposts*2 + comments*1.5) / sqrt(hoursSincePost)
   */
  _calculateTrendingScore: (post) => {
    const now = new Date();
    const postTime = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt || now);
    const hoursSincePost = Math.max(0.5, (now - postTime) / (1000 * 60 * 60)); // Min 0.5 hours
    
    const engagement = (post.likeCount || 0) + 
                       (post.repostCount || 0) * 2 + 
                       (post.commentCount || 0) * 1.5;
    
    // Decay factor using square root - recent posts get boost
    const score = engagement / Math.pow(hoursSincePost, 0.5);
    
    return score;
  },
  
  /**
   * Sort posts by trending score (highest first)
   */
  _sortByTrending: (posts) => {
    const calcScore = get()._calculateTrendingScore;
    return [...posts].sort((a, b) => calcScore(b) - calcScore(a));
  },
  
  /**
   * Load trending posts (sorted by engagement velocity)
   * Fetches all non-deleted original posts, sorts by trending score
   */
  loadTrendingPosts: async (limitCount = 30) => {
    try {
      console.log('🔥 Loading trending posts with scoring...');
      
      const postsRef = collection(db, 'posts');
      // Fetch more to have a good pool for sorting
      const q = query(postsRef, limit(100));
      
      const snapshot = await getDocs(q);
      
      let posts = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
        .filter(post => !post.deleted && post.type !== 'repost');
      
      // Calculate trending score for each post
      const calcScore = get()._calculateTrendingScore;
      posts = posts.map(post => ({
        ...post,
        _trendingScore: calcScore(post),
      }));
      
      // Sort by trending score (highest first)
      posts.sort((a, b) => b._trendingScore - a._trendingScore);
      
      console.log('🔥 Trending posts sorted. Top scores:', 
        posts.slice(0, 3).map(p => ({ id: p.id, score: p._trendingScore?.toFixed(2), likes: p.likeCount }))
      );
      
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error loading trending posts:', error);
      return [];
    }
  },
  
  /**
   * Load posts by hashtag (arrayContains query)
   * Tries multiple case variations, sorts by trending
   */
  loadPostsByHashtag: async (hashtag, limitCount = 30) => {
    if (!hashtag) return [];
    
    try {
      // Clean the hashtag - remove # if present
      const cleanTag = hashtag.replace(/^#/, '').toLowerCase().trim();
      console.log('🏷️ Loading posts with hashtag:', cleanTag);
      
      const postsRef = collection(db, 'posts');
      const allPosts = new Map(); // Use Map to dedupe by ID
      
      // Try multiple variations (with/without #, different cases)
      const variations = [
        cleanTag,
        `#${cleanTag}`,
        cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1).toLowerCase(),
        `#${cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1).toLowerCase()}`,
        hashtag, // Original input
      ];
      
      // Remove duplicates
      const uniqueVariations = [...new Set(variations)];
      
      for (const variant of uniqueVariations) {
        try {
          const q = query(
            postsRef,
            where('hashtags', 'array-contains', variant),
            limit(50)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            if (!allPosts.has(doc.id)) {
              const data = doc.data();
              // Same validity check: not deleted, not repost, has media
              if (data.deleted !== true && data.type !== 'repost' && data.mediaUrl) {
                allPosts.set(doc.id, {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                });
              }
            }
          });
        } catch (e) {
          console.log('Hashtag variant query failed:', variant);
        }
      }
      
      let posts = Array.from(allPosts.values());
      
      // Sort by trending score
      posts = get()._sortByTrending(posts);
      
      console.log('🏷️ Found', posts.length, 'posts with hashtag:', cleanTag, '(tried variations:', uniqueVariations.join(', '), ')');
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error loading posts by hashtag:', error);
      return [];
    }
  },
  
  /**
   * Load posts by breed (detectedBreed field)
   * Uses case-insensitive matching, sorts by trending
   */
  loadPostsByBreed: async (breed, limitCount = 30) => {
    if (!breed) return [];
    
    // Helper to check if post is valid (same criteria as getPopularBreeds)
    const isValidPost = (data) => {
      if (data.deleted === true) return false;
      if (data.type === 'repost') return false;
      if (!data.mediaUrl) return false;
      return true;
    };
    
    try {
      console.log('🐕 Loading posts with breed:', breed);
      
      const postsRef = collection(db, 'posts');
      const breedLower = breed.toLowerCase().trim();
      let posts = [];
      
      // Try multiple query strategies
      const queryStrategies = [
        // 1. Exact match
        breed,
        // 2. Lowercase
        breedLower,
        // 3. Title case
        breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      ];
      
      const allPosts = new Map();
      
      for (const breedQuery of queryStrategies) {
        try {
          const q = query(
            postsRef,
            where('detectedBreed', '==', breedQuery),
            limit(50)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            if (!allPosts.has(doc.id)) {
              const data = doc.data();
              if (isValidPost(data)) {
                allPosts.set(doc.id, {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                });
              }
            }
          });
        } catch (e) {
          console.log('Breed query failed for:', breedQuery);
        }
      }
      
      // If no results, try client-side partial matching
      if (allPosts.size === 0) {
        console.log('🐕 No exact match, trying partial match...');
        const q = query(
          postsRef,
          limit(500)
        );
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!isValidPost(data)) return;
          
          const postBreed = (data.detectedBreed || '').toLowerCase().trim();
          
          // Partial match: "persian" matches "Persian Cat", "golden" matches "Golden Retriever"
          if (postBreed && (postBreed.includes(breedLower) || breedLower.includes(postBreed))) {
            allPosts.set(doc.id, {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          }
        });
      }
      
      posts = Array.from(allPosts.values());
      
      // Sort by trending score
      posts = get()._sortByTrending(posts);
      
      console.log('🐕 Found', posts.length, 'posts with breed:', breed);
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error loading posts by breed:', error);
      return [];
    }
  },
  
  /**
   * Load posts by behavior (behaviors array)
   * Tries multiple case variations, sorts by trending
   */
  loadPostsByBehavior: async (behavior, limitCount = 30) => {
    if (!behavior) return [];
    
    // Helper to check if post is valid
    const isValidPost = (data) => {
      if (data.deleted === true) return false;
      if (data.type === 'repost') return false;
      if (!data.mediaUrl) return false;
      return true;
    };
    
    try {
      console.log('🎭 Loading posts with behavior/mood:', behavior);
      
      const postsRef = collection(db, 'posts');
      const allPosts = new Map();
      const behaviorLower = behavior.toLowerCase();
      
      // Try multiple case variations for behaviors field
      const variations = [
        behaviorLower,
        behavior,
        behavior.charAt(0).toUpperCase() + behavior.slice(1).toLowerCase(),
      ];
      
      // 1. Search by behaviors field (user-selected tag behaviors)
      for (const variant of variations) {
        try {
          const q = query(
            postsRef,
            where('behaviors', 'array-contains', variant),
            limit(50)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            if (!allPosts.has(doc.id)) {
              const data = doc.data();
              if (isValidPost(data)) {
                allPosts.set(doc.id, {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                });
              }
            }
          });
        } catch (e) {
          console.log('Behavior variant query failed:', variant);
        }
      }
      
      // 2. Also search by hashtags (e.g., #foodie, #lazy, #zoomies)
      // This catches posts that have the hashtag but might not have behaviors field set
      try {
        const hashtagVariations = [
          behaviorLower,
          `#${behaviorLower}`,
        ];
        
        for (const tag of hashtagVariations) {
          const q = query(
            postsRef,
            where('hashtags', 'array-contains', tag),
            limit(50)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            if (!allPosts.has(doc.id)) {
              const data = doc.data();
              if (isValidPost(data)) {
                allPosts.set(doc.id, {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                });
              }
            }
          });
        }
      } catch (e) {
        console.log('Hashtag search failed for behavior:', behavior);
      }
      
      let posts = Array.from(allPosts.values());
      
      // Sort by trending score
      posts = get()._sortByTrending(posts);
      
      console.log('🎭 Found', posts.length, 'posts with behavior/hashtag:', behavior);
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error loading posts by behavior:', error);
      return [];
    }
  },
  
  /**
   * Load personalized posts based on pet personality/behaviors
   * Matches user's pet behaviors to post behaviors, sorts by relevance + trending
   */
  loadPersonalizedPosts: async (petBehaviors = [], limitCount = 30) => {
    if (!petBehaviors || petBehaviors.length === 0) {
      // Fall back to trending if no behaviors
      return get().loadTrendingPosts(limitCount);
    }
    
    try {
      console.log('💝 Loading personalized posts for behaviors:', petBehaviors);
      
      const postsRef = collection(db, 'posts');
      const allPosts = new Map();
      
      // Query for each behavior (Firestore doesn't support multiple array-contains)
      // Take first 5 behaviors for better coverage
      const behaviorsToQuery = petBehaviors.slice(0, 5);
      
      for (const behavior of behaviorsToQuery) {
        // Try lowercase version
        const behaviorLower = behavior.toLowerCase();
        
        try {
          const q = query(
            postsRef,
            where('behaviors', 'array-contains', behaviorLower),
            limit(20)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            if (!allPosts.has(doc.id)) {
              const data = doc.data();
              if (!data.deleted && data.type !== 'repost') {
                allPosts.set(doc.id, {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  matchedBehavior: behaviorLower,
                });
              }
            }
          });
        } catch (e) {
          console.log('Query for behavior failed:', behavior, e);
        }
      }
      
      let posts = Array.from(allPosts.values());
      
      console.log('💝 Found', posts.length, 'personalized posts');
      
      // Calculate match score + trending score for each post
      const calcTrending = get()._calculateTrendingScore;
      const behaviorsLower = petBehaviors.map(b => b.toLowerCase());
      
      posts = posts.map(post => {
        // Count how many of the user's behaviors match this post
        const matchCount = (post.behaviors || []).filter(b => 
          behaviorsLower.includes(b.toLowerCase())
        ).length;
        
        const trendingScore = calcTrending(post);
        
        // Combined score: match count * 10 + trending score
        const combinedScore = matchCount * 10 + trendingScore;
        
        return {
          ...post,
          _matchCount: matchCount,
          _trendingScore: trendingScore,
          _combinedScore: combinedScore,
        };
      });
      
      // Sort by combined score (relevance + trending)
      posts.sort((a, b) => b._combinedScore - a._combinedScore);
      
      console.log('💝 Top personalized:', 
        posts.slice(0, 3).map(p => ({ 
          id: p.id, 
          matches: p._matchCount, 
          trending: p._trendingScore?.toFixed(2) 
        }))
      );
      
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error loading personalized posts:', error);
      return [];
    }
  },
  
  /**
   * Get trending hashtags from posts (aggregates hashtag counts with recency weighting)
   * Uses simple query to avoid Firestore index requirements
   */
  getTrendingHashtags: async (limitCount = 10) => {
    try {
      console.log('📊 Calculating trending hashtags...');
      
      const postsRef = collection(db, 'posts');
      // Simple query without orderBy to avoid index requirement
      const q = query(postsRef, limit(500));
      
      const snapshot = await getDocs(q);
      console.log('📊 Fetched', snapshot.docs.length, 'posts to analyze hashtags');
      const now = Date.now();
      
      // Count hashtag occurrences with recency weighting
      const hashtagCounts = new Map();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Skip deleted, reposts, or posts without valid media
        if (data.deleted === true) return;
        if (data.type === 'repost') return;
        if (!data.mediaUrl) return;
        
        // Calculate recency weight (posts from last 24h get 3x weight, last week 2x)
        // Use createdAt or timestamp field
        const postTime = data.createdAt?.toMillis?.() || data.timestamp?.toMillis?.() || data.createdAt || data.timestamp || now;
        const ageHours = (now - postTime) / (1000 * 60 * 60);
        let recencyWeight = 1;
        if (ageHours < 24) recencyWeight = 3;
        else if (ageHours < 168) recencyWeight = 2; // 7 days
        
        (data.hashtags || []).forEach(tag => {
          const cleanTag = tag.replace(/^#/, '').toLowerCase().trim();
          if (!cleanTag || cleanTag.length < 2) return;
          
          const current = hashtagCounts.get(cleanTag) || { tag: cleanTag, count: 0, engagement: 0, recentCount: 0 };
          current.count += 1;
          current.recentCount += recencyWeight;
          current.engagement += ((data.likeCount || 0) + (data.repostCount || 0) * 2) * recencyWeight;
          hashtagCounts.set(cleanTag, current);
        });
      });
      
      // Sort by post count (most posts first), then by engagement as tiebreaker
      const sorted = Array.from(hashtagCounts.values())
        .filter(h => h.count >= 1) // At least 1 post with this tag
        .sort((a, b) => {
          // Primary sort: by post count (descending)
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          // Tiebreaker: by engagement
          return b.engagement - a.engagement;
        })
        .slice(0, limitCount);
      
      console.log('📊 Top trending hashtags:', sorted.slice(0, 5).map(h => `#${h.tag} (${h.count} posts)`));
      
      return sorted;
    } catch (error) {
      console.error('❌ Error getting trending hashtags:', error);
      return [];
    }
  },
  
  /**
   * Get popular breeds from posts (aggregates breed counts with stable image URLs)
   */
  getPopularBreeds: async (limitCount = 10) => {
    try {
      console.log('🐾 Calculating popular breeds...');
      
      const postsRef = collection(db, 'posts');
      // Simple query without orderBy to avoid index requirements
      const q = query(postsRef, limit(500));
      
      const snapshot = await getDocs(q);
      console.log('🐾 Fetched', snapshot.docs.length, 'posts to analyze breeds');
      
      const breedCounts = new Map();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Skip deleted, reposts, or posts without valid media
        if (data.deleted === true) return;
        if (data.type === 'repost') return;
        if (!data.mediaUrl) return; // Must have media
        
        // Check for detectedBreed field
        const breed = data.detectedBreed?.trim();
        if (!breed || breed.toLowerCase() === 'unknown' || breed.toLowerCase() === 'mixed breed') return;
        
        // Normalize breed name (capitalize first letter of each word)
        const normalizedBreed = breed.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        
        const current = breedCounts.get(normalizedBreed) || { 
          breed: normalizedBreed, 
          count: 0, 
          petType: data.detectedPetType || 'dog'
        };
        current.count += 1;
        breedCounts.set(normalizedBreed, current);
      });
      
      const sorted = Array.from(breedCounts.values())
        .filter(b => b.count >= 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);
      
      console.log('🐾 Top breeds found:', sorted.map(b => `${b.breed} (${b.count})`));
      
      return sorted;
    } catch (error) {
      console.error('❌ Error getting popular breeds:', error);
      return [];
    }
  },
  
  /**
   * Delete a repost by its document ID (used from Profile Reposts tab)
   * Uses TRANSACTION for atomic delete + decrement
   */
  deleteRepost: async (repostId, originalPostId) => {
    console.log('🗑️ Deleting repost:', repostId, 'original:', originalPostId);
    
    try {
      const repostDocRef = doc(db, 'posts', repostId);
      let newRepostCount = 0;
      
      if (originalPostId) {
        const originalPostRef = doc(db, 'posts', originalPostId);
        
        // Use TRANSACTION for atomic delete + decrement
        await runTransaction(db, async (transaction) => {
          const freshOriginal = await transaction.get(originalPostRef);
          if (freshOriginal.exists()) {
            const currentCount = freshOriginal.data().repostCount || 0;
            newRepostCount = Math.max(0, currentCount - 1);
            transaction.update(originalPostRef, { repostCount: newRepostCount });
          }
          transaction.delete(repostDocRef);
        });
      } else {
        // No original post ID, just delete the repost
        await deleteDoc(repostDocRef);
      }
      
      console.log('✅ Repost deleted, new count:', newRepostCount);
      
      // Update local state
      set((state) => ({
        posts: state.posts
          .filter(p => p.id !== repostId)
          .map(p => 
            p.id === originalPostId 
              ? { ...p, repostCount: newRepostCount, isReposted: false }
              : p
          ),
      }));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting repost:', error);
      return { success: false, error: error.message };
    }
  },
}));
