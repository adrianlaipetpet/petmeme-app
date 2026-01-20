import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark,
  Send, MoreHorizontal, Flag, Play, Pause, ChevronDown, ChevronUp,
  Volume2, VolumeX, Trash2, Repeat2
} from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { demoPosts, demoProfiles, demoComments, reliableImages } from '../data/demoData';

// Paw icon for likes
const PawIcon = ({ filled }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={`w-7 h-7 ${filled ? 'fill-accent-coral stroke-accent-coral' : 'fill-none stroke-current'}`}
    strokeWidth={2}
  >
    <ellipse cx="12" cy="16" rx="5" ry="4" />
    <ellipse cx="7" cy="9" rx="2" ry="2.5" />
    <ellipse cx="12" cy="7" rx="2" ry="2.5" />
    <ellipse cx="17" cy="9" rx="2" ry="2.5" />
  </svg>
);

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const { posts, toggleLike, toggleBookmark, loadComments, addComment, deleteComment, repostPost, undoRepost } = useFeedStore();
  const { user, pet } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isReposting, setIsReposting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    const loadPost = async () => {
      console.log('📄 PostDetail: Loading post', postId);
      
      // 1. Try to find in feedStore first (already loaded)
      let foundPost = posts.find(p => p.id === postId);
      
      if (foundPost) {
        console.log('✅ Found post in feedStore');
        setPost(foundPost);
        return;
      }
      
      // 2. Try to fetch from Firestore directly
      try {
        console.log('🔥 Fetching post from Firestore...');
        const postDoc = await getDoc(doc(db, 'posts', postId));
        
        if (postDoc.exists()) {
          const data = postDoc.data();
          
          // Ensure pet object exists with required fields
          const pet = data.pet || {
            id: data.ownerId || postId,
            name: data.petName || 'Pet',
            photoUrl: data.petPhotoUrl || null,
            breed: data.breed || '',
          };
          
          // Check if current user has liked this post
          const currentUserId = useAuthStore.getState().user?.uid;
          const isLiked = currentUserId && data.likedBy?.includes(currentUserId);
          const isBookmarked = currentUserId && data.bookmarkedBy?.includes(currentUserId);
          
          foundPost = {
            id: postDoc.id,
            ...data,
            pet,
            isLiked,
            isBookmarked,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
          console.log('✅ Found post in Firestore:', foundPost);
          setPost(foundPost);
          return;
        }
      } catch (error) {
        console.error('Error fetching post from Firestore:', error);
      }
      
      // 3. Try demo posts as fallback
      foundPost = demoPosts.find(p => p.id === postId);
      if (foundPost) {
        console.log('📦 Found post in demo data');
        setPost(foundPost);
        return;
      }
      
      // 4. Ultimate fallback - first demo post
      console.log('⚠️ Post not found, using fallback');
      if (demoPosts.length > 0) {
        setPost({ ...demoPosts[0], id: postId });
      }
    };
    
    loadPost();
  }, [postId, posts]);
  
  // Load comments from Firestore
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      
      setLoadingComments(true);
      try {
        const firestoreComments = await loadComments(postId);
        if (firestoreComments && firestoreComments.length > 0) {
          // Transform Firestore comments to match our format
          const formattedComments = firestoreComments.map(c => ({
            id: c.id,
            userId: c.userId, // Preserve userId for delete authorization
            user: {
              name: c.petName || 'Anonymous',
              avatar: c.petPhotoUrl || reliableImages.avatar1,
            },
            text: c.text,
            likeCount: c.likeCount || 0,
            timeAgo: getTimeAgo(c.createdAt),
            replies: [],
          }));
          setComments(formattedComments);
        } else {
          // Fall back to demo comments if no real comments
          setComments(demoComments);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments(demoComments);
      } finally {
        setLoadingComments(false);
      }
    };
    
    fetchComments();
  }, [postId, loadComments]);
  
  // Helper to format time ago
  const getTimeAgo = (date) => {
    if (!date) return 'just now';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };
  
  const handleLike = async () => {
    if (!post) return;
    
    const { user } = useAuthStore.getState();
    const userId = user?.uid;
    
    // Prompt login if not authenticated
    if (!userId) {
      showToast('Login to like this post! 🐾', 'info');
      return;
    }
    
    const wasLiked = post.isLiked || (userId && post.likedBy?.includes(userId));
    
    console.log('🐾 PostDetail Like:', { postId: post.id, userId, wasLiked });
    
    // Optimistic update
    setPost(prev => ({
      ...prev,
      isLiked: !wasLiked,
      likeCount: wasLiked ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1,
      likedBy: userId 
        ? (wasLiked 
            ? (prev.likedBy || []).filter(id => id !== userId)
            : [...(prev.likedBy || []), userId])
        : prev.likedBy
    }));
    
    const result = await toggleLike(post.id, userId);
    
    if (!result?.success) {
      // Revert on error
      setPost(prev => ({
        ...prev,
        isLiked: wasLiked,
        likeCount: wasLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
        likedBy: userId 
          ? (wasLiked 
              ? [...(prev.likedBy || []), userId]
              : (prev.likedBy || []).filter(id => id !== userId))
          : prev.likedBy
      }));
      showToast(`Could not ${wasLiked ? 'unlike' : 'like'} post`, 'error');
    }
  };
  
  const handleBookmark = async () => {
    if (!post) return;
    
    // Prompt login if not authenticated
    if (!user?.uid) {
      showToast('Login to save favorites! ❤️', 'info');
      return;
    }
    
    const wasBookmarked = post.isBookmarked;
    setPost(prev => ({ ...prev, isBookmarked: !prev.isBookmarked }));
    const result = await toggleBookmark(post.id, user?.uid);
    if (result?.success) {
      showToast(wasBookmarked ? 'Removed from favorites' : 'Added to favorites! ❤️', 'success');
    }
  };
  
  const handleRepost = async () => {
    if (!post) return;
    
    if (!user?.uid || !pet) {
      showToast('Login to repost! 🔐', 'info');
      return;
    }
    
    // Check if this is a repost and get original ID
    const isRepost = post.type === 'repost';
    const originalId = isRepost ? post.originalPostId : post.id;
    
    // Don't repost your own post
    const originalOwnerId = isRepost ? (post.originalPost?.pet?.id || post.originalPost?.ownerId) : (post.pet?.id || post.ownerId);
    if (originalOwnerId === user.uid) {
      showToast("Can't repost your own meme! 😹", 'info');
      return;
    }
    
    const hasReposted = post.isReposted || false;
    setIsReposting(true);
    
    if (hasReposted) {
      // Undo repost
      const result = await undoRepost(originalId, user.uid);
      setIsReposting(false);
      
      if (result.success) {
        setPost(prev => ({ 
          ...prev, 
          isReposted: false,
          repostCount: Math.max(0, (prev.repostCount || 0) - 1)
        }));
        showToast('Repost removed 🗑️', 'info');
      } else {
        showToast(result.error || 'Failed to remove repost', 'error');
      }
    } else {
      // Create repost
      const result = await repostPost(originalId, {
        id: user.uid,
        name: pet.name || 'Anonymous',
        photoUrl: pet.photoURL || null,
      });
      
      setIsReposting(false);
      
      if (result.success) {
        setPost(prev => ({ 
          ...prev, 
          isReposted: true,
          repostCount: (prev.repostCount || 0) + 1
        }));
        showToast('Reposted! 🚀 Your followers will see this!', 'success');
      } else if (result.error === 'Already reposted') {
        setPost(prev => ({ ...prev, isReposted: true }));
        showToast('You already reposted this! 🔄', 'info');
      } else {
        showToast(result.error || 'Repost failed', 'error');
      }
    }
  };
  
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.pet?.name}'s meme on PetMeme Hub`,
          text: post?.caption,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          showToast('Link copied!', 'success');
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied!', 'success');
    }
  };
  
  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleToggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;
    
    // Prompt login if not authenticated
    if (!user?.uid) {
      showToast('Login to comment! 💬', 'info');
      return;
    }
    
    const commentText = newComment.trim();
    setNewComment(''); // Clear input immediately for better UX
    
    // Create optimistic comment for instant UI update
    const optimisticComment = {
      id: Date.now().toString(),
      user: { 
        name: pet?.name || 'You', 
        avatar: pet?.photoURL || reliableImages.avatar1
      },
      text: commentText,
      likeCount: 0,
      timeAgo: 'just now',
      replies: [],
    };
    
    if (replyingTo) {
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo) {
          return { ...c, replies: [...c.replies, { ...optimisticComment, id: `${c.id}-${optimisticComment.id}` }] };
        }
        return c;
      }));
      setReplyingTo(null);
    } else {
      setComments(prev => [optimisticComment, ...prev]);
    }
    
    // Save to Firestore
    try {
      const { user } = useAuthStore.getState();
      await addComment(
        post.id,
        user?.uid,
        pet?.name || 'Anonymous',
        pet?.photoURL || null,
        commentText
      );
      showToast('Comment posted! 💬', 'success');
    } catch (error) {
      console.error('Error posting comment:', error);
      showToast('Failed to post comment', 'error');
    }
  };
  
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };
  
  const handleDeleteComment = async (commentId) => {
    if (!post || !user?.uid) return;
    
    setDeletingCommentId(commentId);
    
    // Optimistic update - remove from UI immediately
    const originalComments = [...comments];
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    // Update post comment count locally
    setPost(prev => ({
      ...prev,
      commentCount: Math.max(0, (prev?.commentCount || 0) - 1)
    }));
    
    try {
      const result = await deleteComment(post.id, commentId, user.uid);
      
      if (result.success) {
        showToast('Comment deleted', 'success');
      } else {
        // Revert on error
        setComments(originalComments);
        setPost(prev => ({
          ...prev,
          commentCount: (prev?.commentCount || 0) + 1
        }));
        showToast(result.error || 'Failed to delete comment', 'error');
      }
    } catch (error) {
      // Revert on error
      setComments(originalComments);
      setPost(prev => ({
        ...prev,
        commentCount: (prev?.commentCount || 0) + 1
      }));
      showToast('Failed to delete comment', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };
  
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-petmeme-bg dark:bg-petmeme-bg-dark flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/90 dark:bg-petmeme-bg-dark/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              // If there's browser history, go back; otherwise go to home
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="p-2 -ml-2 text-petmeme-text dark:text-petmeme-text-dark hover:text-primary-500 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <Link to={`/profile/${post.pet?.id || post.ownerId || post.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
            <img
              src={post.pet?.photoUrl || post.petPhotoUrl}
              alt={post.pet?.name || 'Pet'}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
              onError={(e) => {
                // Pet-only fallback! 🐱🐶
                e.target.src = post?.pet?.petType === 'dog' 
                  ? 'https://placedog.net/50/50?id=post' 
                  : 'https://cataas.com/cat?width=50&height=50&t=post';
              }}
            />
            <div>
              <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
                {post.pet?.name || post.petName || 'Pet'}
              </p>
              <p className="text-xs text-petmeme-muted">{post.pet?.breed || post.breed || ''}</p>
            </div>
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-petmeme-muted hover:text-petmeme-text cursor-pointer"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-petmeme-card-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      handleShare();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-petmeme-text dark:text-petmeme-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                  >
                    <Share2 className="w-4 h-4" />
                    Share post
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Link copied!', 'success');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-petmeme-text dark:text-petmeme-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Copy link
                  </button>
                  <button
                    onClick={() => {
                      showToast('Post reported. Thanks for keeping Lmeow safe! 🛡️', 'success');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                  >
                    <Flag className="w-4 h-4" />
                    Report post
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Media */}
        <div className="relative bg-black">
          {post.type === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={post.mediaUrl}
                poster={post.thumbnailUrl}
                className="w-full max-h-[60vh] object-contain"
                loop
                muted={isMuted}
                playsInline
                onClick={handleVideoPlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Play button overlay */}
              <button
                onClick={handleVideoPlay}
                className={`absolute inset-0 flex items-center justify-center ${
                  isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                } transition-opacity`}
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </div>
              </button>
              
              {/* Mute button */}
              <button
                onClick={handleToggleMute}
                className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              className="w-full max-h-[60vh] object-contain"
              onError={(e) => {
                // Pet-only fallback! 🐱🐶
                e.target.src = post?.pet?.petType === 'dog' 
                  ? 'https://placedog.net/600/600?id=media' 
                  : 'https://cataas.com/cat?width=600&height=600&t=media';
              }}
            />
          )}
          
          {/* MEME TEXT OVERLAY 😹 */}
          {(post.memeText || post.textOverlay) && (
            <>
              {/* Top text */}
              {post.memeText?.top && (
                <div className="absolute top-4 left-0 right-0 text-center px-4">
                  <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                    {post.memeText.top}
                  </p>
                </div>
              )}
              {/* Center text */}
              {post.memeText?.center && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center px-4">
                  <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                    {post.memeText.center}
                  </p>
                </div>
              )}
              {/* Bottom text */}
              {post.memeText?.bottom && (
                <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                  <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                    {post.memeText.bottom}
                  </p>
                </div>
              )}
              {/* Fallback: textOverlay without memeText (legacy) */}
              {!post.memeText && post.textOverlay && (
                <div className={`absolute left-0 right-0 text-center px-4 ${
                  post.overlayPosition === 'top' ? 'top-4' :
                  post.overlayPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                  'bottom-4'
                }`}>
                  <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                    {post.textOverlay}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Engagement */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-5">
              <motion.button
                whileTap={{ scale: 1.2 }}
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <PawIcon filled={post.isLiked} />
                <span className={`font-medium ${post.isLiked ? 'text-accent-coral' : 'text-petmeme-text dark:text-petmeme-text-dark'}`}>
                  {formatCount(post.likeCount)}
                </span>
              </motion.button>
              
              <button className="flex items-center gap-2 text-petmeme-text dark:text-petmeme-text-dark">
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{formatCount(post.commentCount)}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-petmeme-text dark:text-petmeme-text-dark"
              >
                <Share2 className="w-6 h-6" />
              </button>
              
              {/* Repost */}
              <motion.button
                whileTap={{ scale: 1.2 }}
                onClick={handleRepost}
                disabled={isReposting}
                className={`flex items-center gap-2 ${
                  post.isReposted 
                    ? 'text-green-500' 
                    : 'text-petmeme-text dark:text-petmeme-text-dark'
                } ${isReposting ? 'opacity-50' : ''}`}
              >
                <motion.div
                  animate={isReposting ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.5, repeat: isReposting ? Infinity : 0 }}
                >
                  <Repeat2 className="w-6 h-6" />
                </motion.div>
                {(post.repostCount || 0) > 0 && (
                  <span className="font-medium">{formatCount(post.repostCount || 0)}</span>
                )}
              </motion.button>
            </div>
            
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleBookmark}
            >
              <Bookmark 
                className={`w-6 h-6 ${post.isBookmarked ? 'fill-primary-500 text-primary-500' : 'text-petmeme-text dark:text-petmeme-text-dark'}`}
              />
            </motion.button>
          </div>
          
          {/* Caption */}
          <p className="text-petmeme-text dark:text-petmeme-text-dark">
            <span className="font-semibold">{post.pet?.name || post.petName || 'Pet'}</span>{' '}
            {post.caption}
          </p>
          
          {/* Behavior tags */}
          {post.behaviors && post.behaviors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.behaviors.map((behavior) => (
                <Link 
                  key={behavior} 
                  to={`/browse/behavior/${encodeURIComponent(behavior)}`}
                  className="badge-behavior text-xs hover:scale-105 transition-transform"
                >
                  #{behavior}
                </Link>
              ))}
            </div>
          )}
          
          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.hashtags.map((tag) => (
                <Link 
                  key={tag} 
                  to={`/browse/hashtag/${encodeURIComponent(tag)}`}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Comments */}
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
            Comments ({comments.length})
          </h3>
          
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Main comment */}
              <div className="flex gap-3">
                <Link 
                  to={comment.userId ? `/profile/${comment.userId}` : '#'}
                  className="flex-shrink-0"
                  onClick={(e) => !comment.userId && e.preventDefault()}
                >
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      e.target.src = Math.random() > 0.5 ? 'https://placedog.net/50/50?id=comment' : 'https://cataas.com/cat?width=50&height=50&t=comment';
                    }}
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                    <Link 
                      to={comment.userId ? `/profile/${comment.userId}` : '#'}
                      onClick={(e) => !comment.userId && e.preventDefault()}
                      className="font-semibold text-sm text-petmeme-text dark:text-petmeme-text-dark hover:text-primary-500 cursor-pointer"
                    >
                      {comment.user.name}
                    </Link>
                    <p className="text-sm text-petmeme-text dark:text-petmeme-text-dark mt-1">
                      {comment.text}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 px-2">
                    <span className="text-xs text-petmeme-muted">{comment.timeAgo}</span>
                    <button className="text-xs text-petmeme-muted hover:text-primary-500 font-medium">
                      {formatCount(comment.likeCount)} likes
                    </button>
                    <button 
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-xs text-petmeme-muted hover:text-primary-500 font-medium"
                    >
                      Reply
                    </button>
                    {/* Delete button - only show for comment owner */}
                    {user?.uid && comment.userId === user.uid && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="text-xs text-petmeme-muted hover:text-red-500 font-medium flex items-center gap-1"
                      >
                        {deletingCommentId === comment.id ? (
                          <span className="animate-pulse">Deleting...</span>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1 text-xs text-primary-500 font-medium"
                      >
                        {expandedReplies[comment.id] ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide replies
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                          </>
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedReplies[comment.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-4 space-y-3"
                          >
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <img
                                  src={reply.user.avatar}
                                  alt={reply.user.name}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src = Math.random() > 0.5 ? 'https://placedog.net/50/50?id=comment' : 'https://cataas.com/cat?width=50&height=50&t=comment';
                                  }}
                                />
                                <div>
                                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                                    <p className="font-semibold text-xs text-petmeme-text dark:text-petmeme-text-dark">
                                      {reply.user.name}
                                    </p>
                                    <p className="text-xs text-petmeme-text dark:text-petmeme-text-dark mt-0.5">
                                      {reply.text}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 px-2">
                                    <span className="text-xs text-petmeme-muted">{reply.timeAgo}</span>
                                    <button className="text-xs text-petmeme-muted hover:text-primary-500">
                                      {formatCount(reply.likeCount)} likes
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Comment input */}
      <div className="sticky bottom-0 bg-white dark:bg-petmeme-card-dark border-t border-gray-100 dark:border-gray-800 p-4 safe-area-bottom">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-petmeme-muted">
              Replying to {comments.find(c => c.id === replyingTo)?.user.name}
            </span>
            <button 
              onClick={() => setReplyingTo(null)}
              className="text-primary-500 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <img
            src={pet?.photoURL || reliableImages.avatar1}
            alt="You"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.target.src = Math.random() > 0.5 ? 'https://placedog.net/50/50?id=comment' : 'https://cataas.com/cat?width=50&height=50&t=comment';
            }}
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              className="input-field pr-12"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 disabled:text-gray-300 dark:disabled:text-gray-600"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
