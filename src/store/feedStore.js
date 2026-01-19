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
  // Filters out deleted posts, consolidates reposts by same original
  // Shows "Reposted by X, Y, and Z" when multiple users repost the same thing
  subscribeToFeed: (userId = null) => {
    const { unsubscribe: existingUnsub } = get();
    if (existingUnsub) existingUnsub();
    
    console.log('🔴 Setting up real-time feed listener for user:', userId);
    
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
      console.log('🏷️ Loading posts with hashtag:', hashtag);
      
      const postsRef = collection(db, 'posts');
      const allPosts = new Map(); // Use Map to dedupe by ID
      
      // Try multiple case variations
      const variations = [
        hashtag.toLowerCase(),
        hashtag,
        hashtag.charAt(0).toUpperCase() + hashtag.slice(1).toLowerCase(),
      ];
      
      for (const variant of variations) {
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
              if (!data.deleted) {
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
      
      console.log('🏷️ Found', posts.length, 'posts with hashtag:', hashtag);
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
    
    try {
      console.log('🐕 Loading posts with breed:', breed);
      
      const postsRef = collection(db, 'posts');
      
      // First try exact match
      let q = query(
        postsRef,
        where('detectedBreed', '==', breed),
        limit(50)
      );
      
      let snapshot = await getDocs(q);
      let posts = [];
      
      if (snapshot.empty) {
        // If no exact match, fetch all and filter client-side (case-insensitive)
        console.log('🐕 No exact match, trying case-insensitive search...');
        q = query(postsRef, limit(200));
        snapshot = await getDocs(q);
        
        const breedLower = breed.toLowerCase();
        posts = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            };
          })
          .filter(post => {
            if (post.deleted) return false;
            const postBreed = (post.detectedBreed || '').toLowerCase();
            return postBreed.includes(breedLower) || breedLower.includes(postBreed);
          });
      } else {
        posts = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            };
          })
          .filter(post => !post.deleted);
      }
      
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
    
    try {
      console.log('🎭 Loading posts with behavior:', behavior);
      
      const postsRef = collection(db, 'posts');
      const allPosts = new Map();
      
      // Try multiple case variations
      const variations = [
        behavior.toLowerCase(),
        behavior,
        behavior.charAt(0).toUpperCase() + behavior.slice(1).toLowerCase(),
      ];
      
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
              if (!data.deleted) {
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
      
      let posts = Array.from(allPosts.values());
      
      // Sort by trending score
      posts = get()._sortByTrending(posts);
      
      console.log('🎭 Found', posts.length, 'posts with behavior:', behavior);
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
   * Get trending hashtags from posts (aggregates hashtag counts)
   */
  getTrendingHashtags: async (limitCount = 10) => {
    try {
      console.log('📊 Calculating trending hashtags...');
      
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, limit(200)); // Sample recent posts
      
      const snapshot = await getDocs(q);
      
      // Count hashtag occurrences
      const hashtagCounts = new Map();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.deleted || data.type === 'repost') return;
        
        (data.hashtags || []).forEach(tag => {
          const tagLower = tag.toLowerCase();
          const current = hashtagCounts.get(tagLower) || { tag: tag, count: 0, engagement: 0 };
          current.count += 1;
          current.engagement += (data.likeCount || 0) + (data.repostCount || 0) * 2;
          hashtagCounts.set(tagLower, current);
        });
      });
      
      // Sort by count * engagement
      const sorted = Array.from(hashtagCounts.values())
        .map(h => ({ ...h, score: h.count * Math.sqrt(h.engagement + 1) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limitCount);
      
      console.log('📊 Top hashtags:', sorted.slice(0, 5).map(h => h.tag));
      
      return sorted;
    } catch (error) {
      console.error('❌ Error getting trending hashtags:', error);
      return [];
    }
  },
  
  /**
   * Get popular breeds from posts (aggregates breed counts)
   */
  getPopularBreeds: async (limitCount = 10) => {
    try {
      console.log('🐾 Calculating popular breeds...');
      
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, limit(200));
      
      const snapshot = await getDocs(q);
      
      const breedCounts = new Map();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.deleted || data.type === 'repost' || !data.detectedBreed) return;
        
        const breed = data.detectedBreed;
        const current = breedCounts.get(breed) || { breed, count: 0, petType: data.detectedPetType };
        current.count += 1;
        breedCounts.set(breed, current);
      });
      
      const sorted = Array.from(breedCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);
      
      console.log('🐾 Top breeds:', sorted.slice(0, 5).map(b => b.breed));
      
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
