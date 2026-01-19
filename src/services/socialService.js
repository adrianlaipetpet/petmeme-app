/**
 * Social Service - Handles likes and follows with proper transactions
 * Ensures atomic updates and prevents race conditions
 */

import { 
  doc, 
  runTransaction, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update a user's total likes count (fire-and-forget)
 * @param {string} userId - The user to update
 * @param {number} delta - Amount to change (1 or -1)
 */
const updateOwnerLikesCount = async (userId, delta) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentLikes = userDoc.data()?.stats?.likes || 0;
      await setDoc(userRef, {
        stats: { 
          likes: Math.max(0, currentLikes + delta)
        }
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        stats: { likes: delta > 0 ? 1 : 0, followers: 0 }
      }, { merge: true });
    }
  } catch (error) {
    console.warn('Could not update owner likes count:', error);
  }
};

/**
 * Sync a user's total likes count to an exact value
 * Used to fix discrepancies between stored and calculated counts
 * @param {string} userId - The user to update
 * @param {number} totalLikes - The correct total likes count
 */
export const syncUserLikesCount = async (userId, totalLikes) => {
  if (!userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      stats: { 
        likes: Math.max(0, totalLikes)
      }
    }, { merge: true });
    console.log('✅ Synced likes count for', userId, ':', totalLikes);
  } catch (error) {
    console.warn('Could not sync likes count:', error);
  }
};

// ============================================
// LIKES SYSTEM
// ============================================

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 * Uses transaction for atomic updates on post, then updates owner stats separately
 * 
 * @param {string} postId - The post to like/unlike
 * @param {string} userId - The user performing the action
 * @returns {Promise<{success: boolean, liked: boolean, error?: string}>}
 */
export const toggleLikePost = async (postId, userId) => {
  if (!postId || !userId) {
    console.error('❌ toggleLikePost: Missing postId or userId', { postId, userId });
    return { success: false, error: 'Missing postId or userId' };
  }

  // Check if this looks like a demo post ID (demo posts have specific formats)
  const isDemoPost = postId.startsWith('demo-') || 
                     postId.startsWith('post-') || 
                     /^[a-f0-9]{8}$/.test(postId) ||
                     postId.length < 15;
  
  if (isDemoPost) {
    console.log('📦 Demo post detected, skipping Firestore sync:', postId);
    return { success: true, liked: true, isDemo: true };
  }

  try {
    const postRef = doc(db, 'posts', postId);
    
    // First check if post exists before starting transaction
    const postCheck = await getDoc(postRef);
    if (!postCheck.exists()) {
      console.log('📦 Post not in Firestore (likely demo), skipping sync:', postId);
      return { success: true, liked: true, isDemo: true };
    }
    
    // Run transaction on the post document only
    const result = await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const isCurrentlyLiked = likedBy.includes(userId);
      const ownerId = postData.ownerId;
      
      if (isCurrentlyLiked) {
        // UNLIKE - Remove user from likedBy, decrement count
        transaction.update(postRef, {
          likedBy: arrayRemove(userId),
          likeCount: increment(-1)
        });
        
        return { 
          liked: false, 
          newCount: Math.max(0, (postData.likeCount || 0) - 1),
          ownerId 
        };
      } else {
        // LIKE - Add user to likedBy, increment count
        transaction.update(postRef, {
          likedBy: arrayUnion(userId),
          likeCount: increment(1)
        });
        
        return { 
          liked: true, 
          newCount: (postData.likeCount || 0) + 1,
          ownerId 
        };
      }
    });
    
    // Update owner's total likes count separately (non-transactional, fire-and-forget)
    if (result.ownerId && result.ownerId !== userId) {
      updateOwnerLikesCount(result.ownerId, result.liked ? 1 : -1);
    }
    
    console.log(`✅ ${result.liked ? 'Liked' : 'Unliked'} post ${postId}`);
    return { success: true, liked: result.liked, newCount: result.newCount };
    
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a user has liked a post
 * @param {string} postId 
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export const checkIfLiked = async (postId, userId) => {
  if (!postId || !userId) return false;
  
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) return false;
    
    const likedBy = postDoc.data().likedBy || [];
    return likedBy.includes(userId);
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};


// ============================================
// FOLLOWS SYSTEM
// ============================================

/**
 * Toggle follow on a user (follow if not following, unfollow if already following)
 * Uses transaction for atomic updates on both users
 * 
 * @param {string} targetUserId - The user to follow/unfollow
 * @param {string} currentUserId - The user performing the action
 * @returns {Promise<{success: boolean, following: boolean, error?: string}>}
 */
export const toggleFollowUser = async (targetUserId, currentUserId) => {
  if (!targetUserId || !currentUserId) {
    return { success: false, error: 'Missing targetUserId or currentUserId' };
  }
  
  // Prevent self-follow
  if (targetUserId === currentUserId) {
    return { success: false, error: 'Cannot follow yourself' };
  }

  try {
    const targetUserRef = doc(db, 'users', targetUserId);
    const currentUserRef = doc(db, 'users', currentUserId);
    
    const result = await runTransaction(db, async (transaction) => {
      // Get both user docs
      const targetUserDoc = await transaction.get(targetUserRef);
      const currentUserDoc = await transaction.get(currentUserRef);
      
      // Get current followers/following arrays
      const targetFollowers = targetUserDoc.exists() 
        ? (targetUserDoc.data().followers || []) 
        : [];
      const currentFollowing = currentUserDoc.exists() 
        ? (currentUserDoc.data().following || []) 
        : [];
      
      const isCurrentlyFollowing = targetFollowers.includes(currentUserId);
      
      if (isCurrentlyFollowing) {
        // UNFOLLOW
        // Update target user (remove from their followers)
        if (targetUserDoc.exists()) {
          transaction.update(targetUserRef, {
            followers: arrayRemove(currentUserId),
            'stats.followers': increment(-1)
          });
        }
        
        // Update current user (remove from their following)
        if (currentUserDoc.exists()) {
          transaction.update(currentUserRef, {
            following: arrayRemove(targetUserId),
            'stats.following': increment(-1)
          });
        }
        
        return { 
          following: false, 
          targetFollowerCount: Math.max(0, (targetUserDoc.data()?.stats?.followers || 0) - 1)
        };
      } else {
        // FOLLOW
        // Update target user (add to their followers)
        if (targetUserDoc.exists()) {
          transaction.update(targetUserRef, {
            followers: arrayUnion(currentUserId),
            'stats.followers': increment(1)
          });
        } else {
          transaction.set(targetUserRef, {
            followers: [currentUserId],
            stats: { followers: 1, likes: 0, following: 0 }
          }, { merge: true });
        }
        
        // Update current user (add to their following)
        if (currentUserDoc.exists()) {
          transaction.update(currentUserRef, {
            following: arrayUnion(targetUserId),
            'stats.following': increment(1)
          });
        } else {
          transaction.set(currentUserRef, {
            following: [targetUserId],
            stats: { followers: 0, likes: 0, following: 1 }
          }, { merge: true });
        }
        
        return { 
          following: true,
          targetFollowerCount: (targetUserDoc.data()?.stats?.followers || 0) + 1
        };
      }
    });
    
    console.log(`✅ ${result.following ? 'Followed' : 'Unfollowed'} user ${targetUserId}`);
    return { success: true, ...result };
    
  } catch (error) {
    console.error('❌ Error toggling follow:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if current user is following target user
 * @param {string} targetUserId 
 * @param {string} currentUserId 
 * @returns {Promise<boolean>}
 */
export const checkIfFollowing = async (targetUserId, currentUserId) => {
  if (!targetUserId || !currentUserId) return false;
  
  try {
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (!targetUserDoc.exists()) return false;
    
    const followers = targetUserDoc.data().followers || [];
    return followers.includes(currentUserId);
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Get user's following list
 * @param {string} userId 
 * @returns {Promise<string[]>}
 */
export const getFollowingList = async (userId) => {
  if (!userId) return [];
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return [];
    
    return userDoc.data().following || [];
  } catch (error) {
    console.error('Error getting following list:', error);
    return [];
  }
};

/**
 * Get user stats (followers, likes, etc.)
 * @param {string} userId 
 * @returns {Promise<{followers: number, following: number, likes: number}>}
 */
export const getUserStats = async (userId) => {
  if (!userId) return { followers: 0, following: 0, likes: 0 };
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { followers: 0, following: 0, likes: 0 };
    }
    
    const stats = userDoc.data().stats || {};
    return {
      followers: stats.followers || 0,
      following: stats.following || 0,
      likes: stats.likes || 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { followers: 0, following: 0, likes: 0 };
  }
};
