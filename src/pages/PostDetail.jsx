import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark,
  Send, MoreHorizontal, Flag, Play, Pause, ChevronDown, ChevronUp,
  Volume2, VolumeX
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
  
  const { posts, toggleLike, toggleBookmark } = useFeedStore();
  const { pet } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState(demoComments);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  
  useEffect(() => {
    // Find post from store first
    let foundPost = posts.find(p => p.id === postId);
    
    // If not in store, find in demo posts
    if (!foundPost) {
      foundPost = demoPosts.find(p => p.id === postId);
    }
    
    // Fallback to first demo post
    if (!foundPost && demoPosts.length > 0) {
      foundPost = { ...demoPosts[0], id: postId };
    }
    
    if (foundPost) {
      setPost(foundPost);
    } else {
      // Ultimate fallback
      setPost({
        id: postId,
        type: 'image',
        mediaUrl: reliableImages.post1,
        caption: "When mom says 'treat' but she's just testing you 😤",
        pet: { 
          id: 'pet1',
          name: 'Whiskers', 
          breed: 'Orange Tabby', 
          photoUrl: reliableImages.avatar1,
        },
        behaviors: ['dramatic', 'foodie'],
        hashtags: ['catfails', 'dramaticpets'],
        likeCount: 2847,
        commentCount: 156,
        shareCount: 89,
        isLiked: false,
        isBookmarked: false,
      });
    }
  }, [postId, posts]);
  
  const handleLike = () => {
    if (post) {
      toggleLike(post.id);
      setPost(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
    }
  };
  
  const handleBookmark = () => {
    if (post) {
      toggleBookmark(post.id);
      setPost(prev => ({ ...prev, isBookmarked: !prev.isBookmarked }));
      showToast(post.isBookmarked ? 'Removed from saved' : 'Saved to collection', 'success');
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
  
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      user: { 
        name: pet?.name || 'You', 
        avatar: pet?.photoURL || reliableImages.avatar1
      },
      text: newComment.trim(),
      likeCount: 0,
      timeAgo: 'now',
      replies: [],
    };
    
    if (replyingTo) {
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo) {
          return { ...c, replies: [...c.replies, { ...comment, id: `${c.id}-${comment.id}` }] };
        }
        return c;
      }));
      setReplyingTo(null);
    } else {
      setComments(prev => [comment, ...prev]);
    }
    
    setNewComment('');
    showToast('Comment posted!', 'success');
  };
  
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
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
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-petmeme-text dark:text-petmeme-text-dark hover:text-primary-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <Link to={`/profile/${post.pet.id || post.id}`} className="flex items-center gap-3 flex-1">
            <img
              src={post.pet.photoUrl}
              alt={post.pet.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/seed/fallback/50/50';
              }}
            />
            <div>
              <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
                {post.pet.name}
              </p>
              <p className="text-xs text-petmeme-muted">{post.pet.breed}</p>
            </div>
          </Link>
          
          <button className="p-2 text-petmeme-muted hover:text-petmeme-text">
            <MoreHorizontal className="w-6 h-6" />
          </button>
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
                e.target.src = 'https://picsum.photos/seed/fallback/600/600';
              }}
            />
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
            <span className="font-semibold">{post.pet.name}</span>{' '}
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
                <img
                  src={comment.user.avatar}
                  alt={comment.user.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/seed/fallback/50/50';
                  }}
                />
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                    <p className="font-semibold text-sm text-petmeme-text dark:text-petmeme-text-dark">
                      {comment.user.name}
                    </p>
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
                                    e.target.src = 'https://picsum.photos/seed/fallback/50/50';
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
              e.target.src = 'https://picsum.photos/seed/fallback/50/50';
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
