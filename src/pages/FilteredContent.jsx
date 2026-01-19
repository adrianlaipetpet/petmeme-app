import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Heart, Grid, List, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { demoPosts, trendingTags, popularBreeds } from '../data/demoData';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import FeedCard from '../components/feed/FeedCard';

export default function FilteredContent() {
  const { type, value } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    loadTrendingPosts, 
    loadPostsByHashtag, 
    loadPostsByBreed,
    loadPostsByBehavior,
    loadPersonalizedPosts,
  } = useFeedStore();
  const { user, pet } = useAuthStore();
  
  // Decode the filter value
  const filterValue = decodeURIComponent(value || '');
  
  // Calculate trending score for sorting
  const calculateTrendingScore = (post) => {
    const now = new Date();
    const postTime = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
    const hoursSincePost = Math.max(1, (now - postTime) / (1000 * 60 * 60));
    
    const engagement = (post.likeCount || 0) + 
                       (post.repostCount || 0) * 2 + 
                       (post.commentCount || 0) * 1.5;
    
    return engagement / Math.pow(hoursSincePost, 0.5);
  };
  
  // Load posts based on filter type
  useEffect(() => {
    const loadFilteredPosts = async () => {
      setIsLoading(true);
      let fetchedPosts = [];
      
      try {
        switch (type) {
          case 'hashtag':
            fetchedPosts = await loadPostsByHashtag(filterValue);
            break;
          case 'breed':
            fetchedPosts = await loadPostsByBreed(filterValue);
            break;
          case 'behavior':
            fetchedPosts = await loadPostsByBehavior(filterValue);
            break;
          case 'trending':
            fetchedPosts = await loadTrendingPosts(50);
            break;
          case 'foryou':
            if (pet?.behaviors?.length) {
              fetchedPosts = await loadPersonalizedPosts(pet.behaviors);
            } else {
              fetchedPosts = await loadTrendingPosts(30);
            }
            break;
          case 'breeds':
            // Show all breeds - just load trending for now
            fetchedPosts = await loadTrendingPosts(50);
            break;
          default:
            fetchedPosts = await loadTrendingPosts(30);
        }
        
        // Sort by trending score
        fetchedPosts.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error loading filtered posts:', error);
        // Fall back to demo posts if Firestore fails
        setPosts(demoPosts);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFilteredPosts();
  }, [type, filterValue, pet?.behaviors]);
  
  // Get display info based on filter type
  const getFilterInfo = () => {
    switch (type) {
      case 'hashtag': {
        const tag = trendingTags.find(t => t.tag === filterValue);
        return {
          title: `#${filterValue}`,
          emoji: tag?.emoji || '🏷️',
          subtitle: posts.length > 0 ? `${posts.length} posts` : 'Explore posts with this hashtag',
          gradient: 'from-primary-500 to-accent-lavender',
        };
      }
      case 'breed': {
        const breed = popularBreeds.find(b => b.breed === filterValue);
        const isDog = breed?.type === 'dog' || filterValue.toLowerCase().includes('retriever') || 
                     filterValue.toLowerCase().includes('husky') || filterValue.toLowerCase().includes('corgi');
        return {
          title: filterValue,
          emoji: isDog ? '🐕' : '🐱',
          subtitle: posts.length > 0 ? `${posts.length} memes` : 'Explore this breed',
          gradient: isDog ? 'from-orange-400 to-amber-500' : 'from-purple-400 to-pink-500',
        };
      }
      case 'behavior': {
        const behaviorEmojis = {
          zoomies: '🌀', sleeping: '💤', eating: '🍖', playing: '🎾',
          dramatic: '🎭', cuddly: '🥰', grumpy: '😾', derpy: '🤪',
          lazy: '😴', foodie: '😋', scared: '😱', guilty: '😬',
          genius: '🧠', clingy: '🥺', vocal: '🗣️', destroyer: '💥',
        };
        return {
          title: filterValue.charAt(0).toUpperCase() + filterValue.slice(1),
          emoji: behaviorEmojis[filterValue] || '🐾',
          subtitle: posts.length > 0 ? `${posts.length} ${filterValue} pets` : 'Pets with this mood',
          gradient: 'from-accent-coral to-pink-500',
        };
      }
      case 'trending':
        return {
          title: 'Trending',
          emoji: '🔥',
          subtitle: 'Hot memes right now',
          gradient: 'from-orange-500 to-red-500',
        };
      case 'foryou':
        return {
          title: `For ${pet?.name || 'You'}`,
          emoji: '💝',
          subtitle: 'Personalized picks based on your pet',
          gradient: 'from-pink-500 to-rose-500',
        };
      case 'breeds':
        return {
          title: 'All Breeds',
          emoji: '🐾',
          subtitle: 'Browse by pet breed',
          gradient: 'from-green-400 to-teal-500',
        };
      default:
        return {
          title: 'Explore',
          emoji: '🔍',
          subtitle: 'Discover amazing pet content',
          gradient: 'from-primary-500 to-secondary-500',
        };
    }
  };
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };
  
  const filterInfo = getFilterInfo();
  
  return (
    <div className="min-h-screen bg-petmeme-bg dark:bg-petmeme-bg-dark pb-24">
      {/* Header with gradient background */}
      <header className="sticky top-0 z-40">
        <div className={`bg-gradient-to-r ${filterInfo.gradient} px-4 py-4`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{filterInfo.emoji}</span>
                <h1 className="font-heading text-xl font-bold text-white">
                  {filterInfo.title}
                </h1>
              </div>
              <p className="text-sm text-white/80">{filterInfo.subtitle}</p>
            </div>
            
            {/* View mode toggle */}
            <div className="flex gap-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-800' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-800' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Trending indicator */}
        <div className="bg-petmeme-bg dark:bg-petmeme-bg-dark px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-accent-coral" />
          <span className="text-petmeme-muted">Sorted by trending</span>
        </div>
      </header>
      
      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-petmeme-muted">Finding the best memes...</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <span className="text-6xl block mb-4">{filterInfo.emoji}</span>
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
              No memes yet!
            </h2>
            <p className="text-petmeme-muted mt-2 mb-6">
              Be the first to post {type === 'hashtag' ? `with #${filterValue}` : 
                                   type === 'breed' ? `a ${filterValue}` : 
                                   type === 'behavior' ? `a ${filterValue} pet` : 'here'}!
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Create Meme
            </Link>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Link
                  to={`/post/${post.id}`}
                  className="relative aspect-square block bg-gray-100 dark:bg-gray-800 group overflow-hidden"
                >
                  {post.type === 'video' ? (
                    <>
                      <video
                        src={post.mediaUrl}
                        poster={post.thumbnailUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2">
                        <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://cataas.com/cat?width=300&height=300';
                      }}
                    />
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-white font-semibold text-sm">
                      <Heart className="w-4 h-4" fill="white" />
                      {formatCount(post.likeCount)}
                    </div>
                  </div>
                  
                  {/* Trending badge for top 3 */}
                  {index < 3 && (
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 bg-accent-coral text-white text-xs font-bold rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View - Uses FeedCard */
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <FeedCard post={post} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
