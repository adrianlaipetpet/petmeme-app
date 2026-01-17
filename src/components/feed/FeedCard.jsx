import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Bookmark, Play, Pause,
  ShoppingBag, MoreHorizontal, Flag, Volume2, VolumeX
} from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { useUIStore } from '../../store/uiStore';

// Paw icon component for likes
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

export default function FeedCard({ post }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [showPawAnimation, setShowPawAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef(null);
  
  const { toggleLike, toggleBookmark } = useFeedStore();
  const { showToast } = useUIStore();
  
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
    toggleLike(post.id);
    if (!post.isLiked) {
      setShowPawAnimation(true);
      setTimeout(() => setShowPawAnimation(false), 600);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.pet.name}'s meme on PetMeme Hub`,
          text: post.caption,
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Link copied to clipboard!', 'success');
        }
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      showToast('Link copied to clipboard!', 'success');
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
  
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = 'https://picsum.photos/seed/fallback/600/600';
    }
  };
  
  return (
    <article className="feed-card relative">
      {/* Brand badge */}
      {post.isBrandPost && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-accent-gold/90 backdrop-blur-sm rounded-full">
          <ShoppingBag className="w-4 h-4 text-amber-800" />
          <span className="text-xs font-semibold text-amber-800">Sponsored</span>
        </div>
      )}
      
      {/* Pet info header */}
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.pet.id || post.id}`}>
          <img
            src={post.pet.photoUrl}
            alt={post.pet.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-primary-200"
            onError={(e) => {
              e.target.src = 'https://picsum.photos/seed/fallback/50/50';
            }}
          />
        </Link>
        <div className="flex-1">
          <Link 
            to={`/profile/${post.pet.id || post.id}`}
            className="font-semibold text-petmeme-text dark:text-petmeme-text-dark hover:text-primary-500"
          >
            {post.pet.name}
          </Link>
          {post.pet.breed && (
            <p className="text-xs text-petmeme-muted">{post.pet.breed}</p>
          )}
        </div>
        <button 
          onClick={() => setShowMore(!showMore)}
          className="p-2 text-petmeme-muted hover:text-petmeme-text dark:hover:text-petmeme-text-dark"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      {/* Media content */}
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
        onDoubleClick={handleLike}
      >
        {post.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              poster={post.thumbnailUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onClick={handleVideoPlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause overlay */}
            <button
              onClick={handleVideoPlay}
              className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-petmeme-text" />
                ) : (
                  <Play className="w-8 h-8 text-petmeme-text ml-1" />
                )}
              </div>
            </button>
            
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
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        
        {/* Double-tap like animation */}
        <AnimatePresence>
          {showPawAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-24 h-24">
                <PawIcon filled={true} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Engagement bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleLike}
              className="engage-btn"
            >
              <PawIcon filled={post.isLiked} />
              <span className={`text-sm font-medium ${post.isLiked ? 'text-accent-coral' : ''}`}>
                {formatCount(post.likeCount)}
              </span>
            </motion.button>
            
            {/* Comment */}
            <Link to={`/post/${post.id}`} className="engage-btn">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{formatCount(post.commentCount)}</span>
            </Link>
            
            {/* Share */}
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleShare}
              className="engage-btn"
            >
              <Share2 className="w-6 h-6" />
              <span className="text-sm font-medium">{formatCount(post.shareCount)}</span>
            </motion.button>
          </div>
          
          {/* Bookmark */}
          <motion.button
            whileTap={{ scale: 1.2 }}
            onClick={() => toggleBookmark(post.id)}
            className="engage-btn"
          >
            <Bookmark 
              className={`w-6 h-6 ${post.isBookmarked ? 'fill-primary-500 text-primary-500' : ''}`}
            />
          </motion.button>
        </div>
        
        {/* Caption */}
        <div className="space-y-2">
          <p className="text-petmeme-text dark:text-petmeme-text-dark">
            <span className="font-semibold">{post.pet.name}</span>{' '}
            {post.caption}
          </p>
          
          {/* Behavior tags */}
          {post.behaviors && post.behaviors.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
          
          {/* Brand link */}
          {post.isBrandPost && post.brandInfo && (
            <a
              href={post.brandInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold/20 hover:bg-accent-gold/30 rounded-xl text-amber-800 font-medium text-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop at {post.brandInfo.name}
            </a>
          )}
        </div>
        
        {/* View comments link */}
        {post.commentCount > 0 && (
          <Link
            to={`/post/${post.id}`}
            className="block mt-3 text-sm text-petmeme-muted hover:text-primary-500"
          >
            View all {formatCount(post.commentCount)} comments
          </Link>
        )}
      </div>
      
      {/* More options dropdown */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-4 z-20 bg-white dark:bg-petmeme-card-dark rounded-2xl shadow-xl py-2 min-w-[160px]"
          >
            <button
              onClick={() => {
                showToast('Post reported', 'info');
                setShowMore(false);
              }}
              className="w-full px-4 py-3 text-left text-petmeme-text dark:text-petmeme-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
            >
              <Flag className="w-5 h-5 text-red-500" />
              Report Post
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
