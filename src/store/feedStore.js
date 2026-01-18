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
  // Filters out deleted posts, enriches reposts with original metrics
  subscribeToFeed: (userId = null) => {
    const { unsubscribe: existingUnsub } = get();
    if (existingUnsub) existingUnsub();
    
    console.log('🔴 Setting up real-time feed listener for user:', userId);
    
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, limit(50));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔴 Real-time update: got', snapshot.docs.length, 'posts');
      
      // First pass: map all posts
      let posts = snapshot.docs
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
      
      // Build a set of originalPostIds that this user has reposted
      // Look at ALL reposts (not just visible ones) owned by this user
      const userRepostOriginalIds = new Set();
      if (userId) {
        posts.forEach(post => {
          if (post.type === 'repost' && post.ownerId === userId && post.originalPostId) {
            userRepostOriginalIds.add(post.originalPostId);
          }
        });
      }
      console.log('🔴 User has reposted these originals:', [...userRepostOriginalIds]);
      
      // Collect original post IDs from reposts to fetch their metrics
      const originalPostIds = new Set();
      posts.forEach(post => {
        if (post.type === 'repost' && post.originalPostId) {
          originalPostIds.add(post.originalPostId);
        }
      });
      
      // Build a map of original posts for metrics
      const originalPostsMap = new Map();
      if (originalPostIds.size > 0) {
        // Check if originals are already in our posts array
        posts.forEach(post => {
          if (originalPostIds.has(post.id)) {
            originalPostsMap.set(post.id, {
              likeCount: post.likeCount || 0,
              commentCount: post.commentCount || 0,
              repostCount: post.repostCount || 0,
              isLiked: post.isLiked,
            });
          }
        });
        
        // For any missing originals, fetch from Firestore
        const missingIds = [...originalPostIds].filter(id => !originalPostsMap.has(id));
        for (const origId of missingIds) {
          try {
            const origDoc = await getDoc(doc(db, 'posts', origId));
            if (origDoc.exists()) {
              const origData = origDoc.data();
              originalPostsMap.set(origId, {
                likeCount: origData.likeCount || 0,
                commentCount: origData.commentCount || 0,
                repostCount: origData.repostCount || 0,
                isLiked: userId ? (origData.likedBy || []).includes(userId) : false,
              });
            }
          } catch (e) {
            console.log('Could not fetch original post:', origId);
          }
        }
      }
      
      // Enrich posts with isReposted flag and original metrics
      posts = posts.map(post => {
        const enriched = { ...post };
        
        // For ORIGINAL posts: check if current user has reposted it
        if (post.type !== 'repost') {
          enriched.isReposted = userRepostOriginalIds.has(post.id);
        } else {
          // For REPOST posts: check if user has reposted the original
          enriched.isReposted = userRepostOriginalIds.has(post.originalPostId);
        }
        
        // For reposts, add original metrics
        if (post.type === 'repost' && post.originalPostId) {
          enriched.originalMetrics = originalPostsMap.get(post.originalPostId) || {
            likeCount: 0,
            commentCount: 0,
            repostCount: 0,
            isLiked: false,
          };
          // Also set isLiked based on original
          enriched.isLiked = enriched.originalMetrics.isLiked;
        }
        
        return enriched;
      });
      
      // Sort by createdAt (newest first)
      posts.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('🔴 Showing', posts.length, 'enriched posts');
      set({ posts, isLoading: false, hasMore: posts.length >= 30 });
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
        
        // Prepare repost document
        const repostData = {
          type: 'repost',
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
          ownerId: reposter.id,
          reposter: {
            id: reposter.id,
            name: reposter.name,
            photoUrl: reposter.photoUrl,
          },
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
