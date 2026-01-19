import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, TrendingUp, Hash, X, PawPrint, Sparkles, 
  Heart, Filter, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import FeedCard from '../components/feed/FeedCard';
import { behaviorHashtags } from '../data/behaviorHashtags';

// 🏷️ Explore tabs
const EXPLORE_TABS = [
  { id: 'trending', label: '🔥 Trending', icon: TrendingUp },
  { id: 'hashtags', label: '#️⃣ Hashtags', icon: Hash },
  { id: 'breeds', label: '🐾 Breeds', icon: PawPrint },
  { id: 'behaviors', label: '🎭 Behaviors', icon: Sparkles },
  { id: 'foryou', label: '💝 For You', icon: Heart },
];

// 🐕 Popular breeds for quick selection
const POPULAR_BREEDS = {
  dogs: [
    'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Poodle',
    'Beagle', 'Husky', 'Corgi', 'Shiba Inu', 'Pomeranian', 'French Bulldog',
    'Dachshund', 'Border Collie', 'Chihuahua', 'Pit Bull'
  ],
  cats: [
    'Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'British Shorthair',
    'Bengal', 'Scottish Fold', 'Sphynx', 'Russian Blue', 'Abyssinian',
    'Orange Tabby', 'Tuxedo Cat', 'Calico', 'Tabby'
  ],
};

// 🎭 Behavior categories
const BEHAVIOR_CATEGORIES = [
  { id: 'zoomies', emoji: '🌀', label: 'Zoomies' },
  { id: 'sleeping', emoji: '💤', label: 'Sleeping' },
  { id: 'eating', emoji: '🍖', label: 'Eating' },
  { id: 'playing', emoji: '🎾', label: 'Playing' },
  { id: 'dramatic', emoji: '🎭', label: 'Dramatic' },
  { id: 'grumpy', emoji: '😾', label: 'Grumpy' },
  { id: 'cuddly', emoji: '🥰', label: 'Cuddly' },
  { id: 'scared', emoji: '😱', label: 'Scared' },
  { id: 'guilty', emoji: '😬', label: 'Guilty' },
  { id: 'derpy', emoji: '🤪', label: 'Derpy' },
  { id: 'lazy', emoji: '😴', label: 'Lazy' },
  { id: 'foodie', emoji: '😋', label: 'Foodie' },
];

// 🔥 Trending hashtags (will be dynamic later)
const TRENDING_HASHTAGS = [
  { tag: 'zoomies', emoji: '🌀', count: 12400 },
  { tag: 'sleepycat', emoji: '😴', count: 8900 },
  { tag: 'treattime', emoji: '🍖', count: 7500 },
  { tag: 'catlaptop', emoji: '💻', count: 6200 },
  { tag: 'dogoftheday', emoji: '🐕', count: 15000 },
  { tag: 'meowmonday', emoji: '🐱', count: 5400 },
  { tag: 'fluffybutt', emoji: '🍑', count: 4800 },
  { tag: 'borkvsbork', emoji: '🗣️', count: 3900 },
];

// Map pet personality to matching behaviors
const PERSONALITY_TO_BEHAVIORS = {
  playful: ['zoomies', 'playing', 'excited', 'jumping'],
  lazy: ['sleeping', 'lazy', 'cuddly', 'sitting'],
  dramatic: ['dramatic', 'grumpy', 'vocal', 'jealous'],
  cuddly: ['cuddly', 'sleeping', 'clingy'],
  foodie: ['eating', 'foodie', 'begging'],
  mischievous: ['sneaky', 'destroyer', 'guilty', 'chaos'],
  shy: ['scared', 'hiding', 'confused'],
  vocal: ['vocal', 'barking', 'meowing', 'demanding'],
};

export default function Explore() {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [explorePosts, setExplorePosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const { 
    loadTrendingPosts, 
    loadPostsByHashtag, 
    loadPostsByBreed,
    loadPostsByBehavior,
    loadPersonalizedPosts,
  } = useFeedStore();
  const { user, pet } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  // Calculate trending score for a post
  const calculateTrendingScore = useCallback((post) => {
    const now = new Date();
    const postTime = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
    const hoursSincePost = Math.max(1, (now - postTime) / (1000 * 60 * 60));
    
    const engagement = (post.likeCount || 0) + 
                       (post.repostCount || 0) * 2 + 
                       (post.commentCount || 0) * 1.5;
    
    return engagement / Math.pow(hoursSincePost, 0.5); // Decay factor
  }, []);

  // Sort posts by trending score
  const sortByTrending = useCallback((posts) => {
    return [...posts].sort((a, b) => 
      calculateTrendingScore(b) - calculateTrendingScore(a)
    );
  }, [calculateTrendingScore]);

  // Load posts based on active tab
  const loadPosts = useCallback(async (refresh = false) => {
    if (isLoading && !refresh) return;
    
    setIsLoading(true);
    let posts = [];
    
    try {
      switch (activeTab) {
        case 'trending':
          posts = await loadTrendingPosts();
          break;
        case 'hashtags':
          if (selectedHashtag) {
            posts = await loadPostsByHashtag(selectedHashtag);
          }
          break;
        case 'breeds':
          if (selectedBreed) {
            posts = await loadPostsByBreed(selectedBreed);
          }
          break;
        case 'behaviors':
          if (selectedBehavior) {
            posts = await loadPostsByBehavior(selectedBehavior);
          }
          break;
        case 'foryou':
          if (pet?.behaviors?.length > 0) {
            posts = await loadPersonalizedPosts(pet.behaviors);
          } else {
            // Fallback to trending if no pet profile
            posts = await loadTrendingPosts();
          }
          break;
      }
      
      // Sort by trending score
      const sortedPosts = sortByTrending(posts);
      setExplorePosts(sortedPosts);
      setHasMore(posts.length >= 20);
    } catch (error) {
      console.error('Error loading explore posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedHashtag, selectedBreed, selectedBehavior, pet, isLoading]);

  // Load posts when tab or selection changes
  useEffect(() => {
    if (activeTab === 'trending' || activeTab === 'foryou') {
      loadPosts(true);
    } else if (activeTab === 'hashtags' && selectedHashtag) {
      loadPosts(true);
    } else if (activeTab === 'breeds' && selectedBreed) {
      loadPosts(true);
    } else if (activeTab === 'behaviors' && selectedBehavior) {
      loadPosts(true);
    } else {
      setExplorePosts([]);
    }
  }, [activeTab, selectedHashtag, selectedBreed, selectedBehavior]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.trim().toLowerCase();
    
    // Check if it's a hashtag
    if (query.startsWith('#')) {
      setActiveTab('hashtags');
      setSelectedHashtag(query.slice(1));
    } else {
      // Try to match breed or behavior
      const matchedBreed = [...POPULAR_BREEDS.dogs, ...POPULAR_BREEDS.cats]
        .find(b => b.toLowerCase().includes(query));
      
      if (matchedBreed) {
        setActiveTab('breeds');
        setSelectedBreed(matchedBreed);
      } else {
        // Default to hashtag search
        setActiveTab('hashtags');
        setSelectedHashtag(query);
      }
    }
  };

  // Format count for display
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'trending':
        return renderTrendingTab();
      case 'hashtags':
        return renderHashtagsTab();
      case 'breeds':
        return renderBreedsTab();
      case 'behaviors':
        return renderBehaviorsTab();
      case 'foryou':
        return renderForYouTab();
      default:
        return null;
    }
  };

  // 🔥 Trending Tab
  const renderTrendingTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-coral" />
          Hot Right Now
        </h3>
        <button 
          onClick={() => loadPosts(true)}
          className="text-sm text-primary-500 flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {renderPostsFeed()}
    </div>
  );

  // #️⃣ Hashtags Tab
  const renderHashtagsTab = () => (
    <div className="space-y-4">
      {/* Trending hashtags grid */}
      {!selectedHashtag && (
        <div className="grid grid-cols-2 gap-3">
          {TRENDING_HASHTAGS.map((item, index) => (
            <motion.button
              key={item.tag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedHashtag(item.tag)}
              className="card p-4 text-left hover:shadow-card-hover transition-all bg-gradient-to-br from-white to-primary-50 dark:from-petmeme-card-dark dark:to-primary-900/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
                    #{item.tag}
                  </p>
                  <p className="text-sm text-petmeme-muted">
                    {formatCount(item.count)} posts
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
      
      {/* Selected hashtag header */}
      {selectedHashtag && (
        <div className="flex items-center justify-between bg-primary-100 dark:bg-primary-900/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-petmeme-text dark:text-petmeme-text-dark">
              #{selectedHashtag}
            </span>
          </div>
          <button 
            onClick={() => setSelectedHashtag(null)}
            className="p-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {selectedHashtag && renderPostsFeed()}
    </div>
  );

  // 🐾 Breeds Tab
  const renderBreedsTab = () => (
    <div className="space-y-4">
      {/* Breed selection */}
      {!selectedBreed && (
        <>
          {/* Dogs */}
          <div>
            <h4 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark mb-3 flex items-center gap-2">
              🐕 Dogs
            </h4>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BREEDS.dogs.map((breed) => (
                <motion.button
                  key={breed}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBreed(breed)}
                  className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
                >
                  {breed}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Cats */}
          <div>
            <h4 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark mb-3 flex items-center gap-2">
              🐱 Cats
            </h4>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BREEDS.cats.map((breed) => (
                <motion.button
                  key={breed}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBreed(breed)}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
                >
                  {breed}
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Selected breed header */}
      {selectedBreed && (
        <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-green-600" />
            <span className="font-bold text-petmeme-text dark:text-petmeme-text-dark">
              {selectedBreed}
            </span>
          </div>
          <button 
            onClick={() => setSelectedBreed(null)}
            className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {selectedBreed && renderPostsFeed()}
    </div>
  );

  // 🎭 Behaviors Tab
  const renderBehaviorsTab = () => (
    <div className="space-y-4">
      {/* Behavior selection grid */}
      {!selectedBehavior && (
        <div className="grid grid-cols-3 gap-3">
          {BEHAVIOR_CATEGORIES.map((behavior, index) => (
            <motion.button
              key={behavior.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedBehavior(behavior.id)}
              className="card p-4 text-center hover:shadow-card-hover transition-all"
            >
              <span className="text-3xl block mb-1">{behavior.emoji}</span>
              <span className="text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark">
                {behavior.label}
              </span>
            </motion.button>
          ))}
        </div>
      )}
      
      {/* Selected behavior header */}
      {selectedBehavior && (
        <div className="flex items-center justify-between bg-accent-lavender/30 dark:bg-accent-lavender/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {BEHAVIOR_CATEGORIES.find(b => b.id === selectedBehavior)?.emoji}
            </span>
            <span className="font-bold text-petmeme-text dark:text-petmeme-text-dark capitalize">
              {selectedBehavior} Pets
            </span>
          </div>
          <button 
            onClick={() => setSelectedBehavior(null)}
            className="p-1 hover:bg-accent-lavender/50 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {selectedBehavior && renderPostsFeed()}
    </div>
  );

  // 💝 For You Tab (Personalized)
  const renderForYouTab = () => (
    <div className="space-y-4">
      {/* Personalization header */}
      <div className="card p-4 bg-gradient-to-r from-primary-100 via-accent-lavender/50 to-accent-coral/30 dark:from-primary-900/40 dark:via-accent-lavender/20 dark:to-accent-coral/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-coral flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-petmeme-text dark:text-petmeme-text-dark">
              Pawsonalized For {pet?.name || 'Your Pet'} 💕
            </h3>
            <p className="text-sm text-petmeme-muted">
              {pet?.behaviors?.length > 0 
                ? `Matching: ${pet.behaviors.slice(0, 3).join(', ')}`
                : 'Complete your pet profile for personalized picks!'}
            </p>
          </div>
        </div>
      </div>
      
      {!pet?.behaviors?.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <p className="text-petmeme-muted mb-4">
            Tell us about your pet's personality to get personalized memes!
          </p>
          <Link 
            to="/settings"
            className="btn-primary inline-flex items-center gap-2"
          >
            <PawPrint className="w-4 h-4" />
            Set Up Pet Profile
          </Link>
        </motion.div>
      )}
      
      {pet?.behaviors?.length > 0 && renderPostsFeed()}
    </div>
  );

  // Render posts feed (used by all tabs)
  const renderPostsFeed = () => (
    <div className="space-y-4">
      {isLoading && explorePosts.length === 0 ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          ))}
        </div>
      ) : explorePosts.length === 0 ? (
        // Empty state
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <span className="text-6xl block mb-4">🐾</span>
          <h3 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark mb-2">
            No memes yet!
          </h3>
          <p className="text-petmeme-muted">
            {activeTab === 'hashtags' && selectedHashtag 
              ? `No posts with #${selectedHashtag} yet. Be the first!`
              : activeTab === 'breeds' && selectedBreed
              ? `No ${selectedBreed} memes yet. Share yours!`
              : activeTab === 'behaviors' && selectedBehavior
              ? `No ${selectedBehavior} memes yet. Upload one!`
              : 'Check back later for trending content!'}
          </p>
          <Link to="/create" className="btn-primary mt-4 inline-flex items-center gap-2">
            Create Meme
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        // Posts grid
        <>
          {explorePosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FeedCard post={post} />
            </motion.div>
          ))}
          
          {isLoading && explorePosts.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          )}
          
          {!hasMore && explorePosts.length > 0 && (
            <p className="text-center text-petmeme-muted py-4">
              You've seen all the memes! 🐾
            </p>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Header with search */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/80 dark:bg-petmeme-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-petmeme-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hashtags, breeds, behaviors..."
              className="input-field pl-12 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-petmeme-muted hover:text-primary-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
        
        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-2 pb-2 gap-1">
          {EXPLORE_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedHashtag(null);
                setSelectedBreed(null);
                setSelectedBehavior(null);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark hover:bg-primary-100 dark:hover:bg-primary-900/30'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </header>
      
      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
