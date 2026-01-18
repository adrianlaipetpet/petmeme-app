import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Share2, Bookmark, Play, Pause,
  ShoppingBag, MoreHorizontal, Flag, Volume2, VolumeX, Repeat2, Check
} from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

// Animated Paw icon for likes 🐾
const PawIcon = ({ filled, animate }) => (
  <motion.svg 
    viewBox="0 0 24 24" 
    className={`w-7 h-7 transition-colors ${filled ? 'fill-primary-500 stroke-primary-500' : 'fill-none stroke-current'}`}
    strokeWidth={2}
    animate={animate ? { scale: [1, 1.3, 1] } : {}}
    transition={{ duration: 0.3 }}
  >
    <ellipse cx="12" cy="16" rx="5" ry="4" />
    <ellipse cx="7" cy="9" rx="2" ry="2.5" />
    <ellipse cx="12" cy="7" rx="2" ry="2.5" />
    <ellipse cx="17" cy="9" rx="2" ry="2.5" />
  </motion.svg>
);

export default function FeedCard({ post, isDemo = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [showPawAnimation, setShowPawAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showRepostSuccess, setShowRepostSuccess] = useState(false);
  const videoRef = useRef(null);
  
  const { toggleLike, toggleBookmark, repostPost, undoRepost } = useFeedStore();
  const { user, pet } = useAuthStore();
  const { showToast } = useUIStore();
  
  // Check if this is a repost
  const isRepost = post.type === 'repost';
  // Get the display data (from original if repost, or directly if original)
  const displayData = isRepost ? post.originalPost : post;
  // Check if current user has reposted this post
  const hasReposted = post.isReposted || false;
  
  // For reposts: Get the ORIGINAL post's metrics to display
  // This makes reposts work like X retweets - engagement goes to original
  // If we have originalMetrics (fetched from Firestore), use those; otherwise fall back to post's own metrics
  const metrics = {
    likeCount: isRepost ? (post.originalMetrics?.likeCount ?? post.likeCount ?? 0) : (post.likeCount || 0),
    commentCount: isRepost ? (post.originalMetrics?.commentCount ?? post.commentCount ?? 0) : (post.commentCount || 0),
    repostCount: isRepost ? (post.originalMetrics?.repostCount ?? post.repostCount ?? 0) : (post.repostCount || 0),
    isLiked: post.isLiked || false,
  };
  
  // Auto-play videos when they come into view
  useEffect(() => {
    if (post.type !== 'video' || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    
    return () => observer.disconnect();
  }, [post.type]);
  
  const handleLike = () => {
    // For reposts: Route like to the ORIGINAL post (like X retweets)
    // This amplifies the original creator's content
    const targetPostId = isRepost ? post.originalPostId : post.id;
    
    // In demo mode, just toggle locally without Firestore sync
    // In real mode, pass userId for Firestore sync
    toggleLike(targetPostId, isDemo ? null : user?.uid);
    
    // Show animation if not already liked
    if (!metrics.isLiked) {
      setShowPawAnimation(true);
      setIsLikeAnimating(true);
      setTimeout(() => {
        setShowPawAnimation(false);
        setIsLikeAnimating(false);
      }, 600);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayData.pet.name}'s meme on Lmeow 😹`,
          text: displayData.caption,
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Link copied! Share the chaos! 🔗', 'success');
        }
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      showToast('Link copied! Share the chaos! 🔗', 'success');
    }
  };
  
  // Handle repost with optimistic UI and animation
  const handleRepost = async () => {
    if (isDemo) {
      showToast('Login to repost! 🔐', 'info');
      return;
    }
    
    if (!user?.uid || !pet) {
      showToast('Login to repost! 🔐', 'info');
      return;
    }
    
    // Get the original post ID (if this is already a repost, get its originalPostId)
    const originalId = isRepost ? post.originalPostId : post.id;
    
    // If already reposted, undo it
    if (hasReposted) {
      setIsReposting(true);
      const result = await undoRepost(originalId, user.uid);
      setIsReposting(false);
      
      if (result.success) {
        showToast('Repost removed 🗑️', 'info');
      } else {
        showToast(result.error || 'Failed to remove repost', 'error');
      }
      return;
    }
    
    // Don't repost your own post
    const originalOwnerId = isRepost ? post.originalPost?.pet?.id : post.pet?.id;
    if (originalOwnerId === user.uid) {
      showToast("Can't repost your own meme! 😹", 'info');
      return;
    }
    
    setIsReposting(true);
    
    const result = await repostPost(originalId, {
      id: user.uid,
      name: pet.name || 'Anonymous',
      photoUrl: pet.photoURL || null,
    });
    
    setIsReposting(false);
    
    if (result.success) {
      // Show success animation
      setShowRepostSuccess(true);
      setTimeout(() => setShowRepostSuccess(false), 1500);
      showToast('Reposted! 🚀 Your followers will see this!', 'success');
    } else {
      showToast(result.error || 'Repost failed', 'error');
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
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };
  
  // Always fallback to a REAL pet image! 🐱🐶
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      // Fallback to real pet images only!
      const petType = post.pet?.petType;
      if (petType === 'dog') {
        e.target.src = 'https://placedog.net/600/600?id=fallback';
      } else {
        e.target.src = 'https://cataas.com/cat?width=600&height=600&t=fallback';
      }
    }
  };
  
  return (
    <article className="feed-card relative overflow-hidden">
      {/* Repost attribution banner 🔄 */}
      {isRepost && post.reposter && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-b border-green-100 dark:border-green-800"
        >
          <Repeat2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <Link 
            to={`/profile/${post.reposter.id}`}
            className="text-sm text-green-700 dark:text-green-300 hover:underline font-medium"
          >
            Reposted by {post.reposter.name}
          </Link>
          <span className="text-green-500">🔄</span>
        </motion.div>
      )}
      
      {/* Brand badge */}
      {post.isBrandPost && (
        <motion.div 
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-gold to-accent-peach backdrop-blur-sm rounded-full shadow-lg"
        >
          <ShoppingBag className="w-4 h-4 text-amber-800" />
          <span className="text-xs font-bold text-amber-800">Sponsored 🐾</span>
        </motion.div>
      )}
      
      {/* Pet info header - show original poster for reposts */}
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${displayData.pet?.id || post.id}`}>
          <motion.img
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            src={displayData.pet?.photoUrl}
            alt={displayData.pet?.name}
            className="w-12 h-12 rounded-full object-cover border-3 border-primary-300 shadow-md"
            onError={(e) => {
              // Pet-only avatar fallback! 🐱🐶
              e.target.src = displayData.pet?.petType === 'dog' 
                ? 'https://placedog.net/50/50?id=avatar' 
                : 'https://cataas.com/cat?width=50&height=50&t=avatar';
            }}
          />
        </Link>
        <div className="flex-1">
          <Link 
            to={`/profile/${displayData.pet?.id || post.id}`}
            className="font-bold text-lmeow-text dark:text-lmeow-text-dark hover:text-primary-500 flex items-center gap-1"
          >
            {displayData.pet?.name || 'Unknown Pet'}
            <span className="text-sm">{displayData.pet?.petType === 'dog' ? '🐶' : '🐱'}</span>
          </Link>
          {displayData.pet?.breed && (
            <p className="text-xs text-lmeow-muted">{displayData.pet.breed}</p>
          )}
        </div>
        <button 
          onClick={() => setShowMore(!showMore)}
          className="p-2 text-lmeow-muted hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      {/* Media content with MEME TEXT OVERLAY! */}
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
        onDoubleClick={handleLike}
      >
        {(displayData.type || post.type) === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={displayData.mediaUrl}
              poster={displayData.thumbnailUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onClick={handleVideoPlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause overlay */}
            <motion.button
              onClick={handleVideoPlay}
              className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-primary-500" />
                ) : (
                  <Play className="w-8 h-8 text-primary-500 ml-1" />
                )}
              </div>
            </motion.button>
            
            {/* Mute button */}
            <button
              onClick={handleToggleMute}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </>
        ) : (
          <img
            src={displayData.mediaUrl}
            alt={displayData.caption}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        
        {/* MEME TEXT OVERLAY 😹 */}
        {(displayData.memeText || displayData.textOverlay) && (
          <>
            {/* Top text */}
            {displayData.memeText?.top && (
              <div className="absolute top-4 left-0 right-0 text-center px-4">
                <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                  {displayData.memeText.top}
                </p>
              </div>
            )}
            {/* Center text */}
            {displayData.memeText?.center && (
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center px-4">
                <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                  {displayData.memeText.center}
                </p>
              </div>
            )}
            {/* Bottom text */}
            {displayData.memeText?.bottom && (
              <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                  {displayData.memeText.bottom}
                </p>
              </div>
            )}
            {/* Fallback: textOverlay without memeText (legacy posts) */}
            {!displayData.memeText && displayData.textOverlay && (
              <div className={`absolute left-0 right-0 text-center px-4 ${
                displayData.overlayPosition === 'top' ? 'top-4' :
                displayData.overlayPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                'bottom-4'
              }`}>
                <p className="meme-text text-2xl md:text-3xl font-black drop-shadow-lg">
                  {displayData.textOverlay}
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Repost success animation 🚀 */}
        <AnimatePresence>
          {showRepostSuccess && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20"
            >
              <motion.div 
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Double-tap like animation 🐾 */}
        <AnimatePresence>
          {showPawAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-8xl">🐾</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Engagement bar - TikTok style */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                metrics.isLiked 
                  ? 'bg-primary-100 dark:bg-primary-900/30' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <PawIcon filled={metrics.isLiked} animate={isLikeAnimating} />
              <span className={`text-sm font-bold ${metrics.isLiked ? 'text-primary-500' : ''}`}>
                {formatCount(metrics.likeCount)}
              </span>
            </motion.button>
            
            {/* Comment */}
            <Link 
              to={`/post/${post.id}`} 
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-bold">{formatCount(metrics.commentCount)}</span>
            </Link>
            
            {/* Share */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </motion.button>
            
            {/* Repost 🔄 - Boost virality! */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleRepost}
              disabled={isReposting}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                hasReposted 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${isReposting ? 'opacity-50' : ''}`}
            >
              <motion.div
                animate={isReposting ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5, repeat: isReposting ? Infinity : 0 }}
              >
                <Repeat2 className={`w-6 h-6 ${hasReposted ? 'text-green-600 dark:text-green-400' : ''}`} />
              </motion.div>
              {metrics.repostCount > 0 && (
                <span className={`text-sm font-bold ${hasReposted ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {formatCount(metrics.repostCount)}
                </span>
              )}
            </motion.button>
          </div>
          
          {/* Bookmark */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              toggleBookmark(post.id);
              showToast(post.isBookmarked ? 'Removed from saved' : 'Saved! 📌', 'success');
            }}
            className={`p-2 rounded-full transition-colors ${
              post.isBookmarked 
                ? 'bg-primary-100 dark:bg-primary-900/30' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Bookmark 
              className={`w-6 h-6 ${post.isBookmarked ? 'fill-primary-500 text-primary-500' : ''}`}
            />
          </motion.button>
        </div>
        
        {/* Caption */}
        <div className="space-y-2">
          <p className="text-lmeow-text dark:text-lmeow-text-dark">
            <Link 
              to={`/profile/${displayData.pet?.id || post.id}`}
              className="font-bold hover:text-primary-500"
            >
              {displayData.pet?.name || 'Unknown'}
            </Link>{' '}
            {displayData.caption}
          </p>
          
          {/* Hashtags */}
          {displayData.hashtags && displayData.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayData.hashtags.map((tag) => (
                <Link 
                  key={tag} 
                  to={`/browse/hashtag/${encodeURIComponent(tag)}`}
                  className="text-sm text-primary-500 hover:text-primary-600 font-semibold hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Behavior tags */}
          {displayData.behaviors && displayData.behaviors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayData.behaviors.map((behavior) => (
                <Link 
                  key={behavior} 
                  to={`/browse/behavior/${encodeURIComponent(behavior)}`}
                  className="badge-behavior text-xs"
                >
                  #{behavior}
                </Link>
              ))}
            </div>
          )}
          
          {/* Brand link */}
          {post.isBrandPost && post.brandInfo && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={post.brandInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-gold/20 to-accent-peach/20 hover:from-accent-gold/30 hover:to-accent-peach/30 rounded-xl text-amber-800 font-bold text-sm transition-colors border-2 border-accent-gold/30"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop at {post.brandInfo.name} 🛒
            </motion.a>
          )}
        </div>
        
        {/* View comments link - route to original post for reposts */}
        {metrics.commentCount > 0 && (
          <Link
            to={`/post/${isRepost ? post.originalPostId : post.id}`}
            className="block mt-3 text-sm text-lmeow-muted hover:text-primary-500 font-medium"
          >
            View all {formatCount(metrics.commentCount)} comments 💬
          </Link>
        )}
      </div>
      
      {/* More options dropdown */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-16 right-4 z-20 bg-white dark:bg-lmeow-card-dark rounded-2xl shadow-xl py-2 min-w-[180px] border-2 border-primary-100 dark:border-primary-900"
          >
            <button
              onClick={() => {
                showToast('Post reported! Thanks for keeping Lmeow safe 🐾', 'info');
                setShowMore(false);
              }}
              className="w-full px-4 py-3 text-left text-lmeow-text dark:text-lmeow-text-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-3 transition-colors"
            >
              <Flag className="w-5 h-5 text-red-500" />
              Report Post 🚩
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
