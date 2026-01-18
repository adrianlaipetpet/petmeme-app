import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import FeedCard from '../components/feed/FeedCard';
import FeedTabs from '../components/feed/FeedTabs';
import { Loader2, Sparkles, Cat, RefreshCw } from 'lucide-react';
import { demoPosts } from '../data/demoData';

// Fun loading messages
const loadingMessages = [
  "Whiskering up memes... 🐱",
  "Herding cats for content... 😹",
  "Chasing the red dot... 🔴",
  "Pawsing for cuteness... 🐾",
  "Loading the floof... ✨",
];

export default function Home() {
  const { 
    posts, 
    setPosts, 
    hasMore, 
    isLoading, 
    setLoading, 
    activeTab,
    loadPosts,
    subscribeToFeed
  } = useFeedStore();
  const { user, pet } = useAuthStore();
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load initial posts
  useEffect(() => {
    if (!initialLoaded) {
      loadInitialPosts();
      setInitialLoaded(true);
    }
    
    // Cleanup subscription on unmount
    return () => {
      const { unsubscribe } = useFeedStore.getState();
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  // Reset when tab changes
  useEffect(() => {
    if (initialLoaded) {
      loadInitialPosts();
    }
  }, [activeTab]);
  
  const loadInitialPosts = async () => {
    setLoading(true);
    setIsDemo(false);
    
    try {
      // Try to load from Firestore first
      const firestorePosts = await loadPosts(true, user?.uid);
      
      // If no posts in Firestore, show demo data
      if (!firestorePosts || firestorePosts.length === 0) {
        console.log('📦 No Firestore posts, using demo data');
        setIsDemo(true);
        // Add slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        setPosts(demoPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      // Fallback to demo data on error
      setIsDemo(true);
      setPosts(demoPosts);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    if (isDemo) {
      // For demo mode, simulate infinite scroll with random variations
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const morePosts = demoPosts.map(p => ({
        ...p,
        id: `${p.id}-${Date.now()}-${Math.random()}`,
        likeCount: Math.floor(Math.random() * 10000),
      }));
      
      setPosts([...posts, ...morePosts]);
      setLoading(false);
    } else {
      // Load more from Firestore
      await loadPosts(false, user?.uid);
    }
  }, [isLoading, hasMore, isDemo, posts, user?.uid]);
  
  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialPosts();
    setRefreshing(false);
  };
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-lmeow-card-dark/90 backdrop-blur-xl border-b-2 border-primary-100 dark:border-primary-900">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* 🎨 LOGO - Bigger for visibility! */}
          <motion.img 
            src="/lmeow-logo.png"
            alt="Lmeow"
            className="h-14 md:h-16 w-auto object-contain drop-shadow-lg"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          
          {/* Demo mode indicator + User greeting */}
          <div className="flex items-center gap-2">
            {isDemo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full"
              >
                Demo Mode 📦
              </motion.div>
            )}
            
            {pet && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full border-2 border-primary-200 dark:border-primary-800"
              >
                <span className="text-lg">🐾</span>
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  Hey, {pet.name}!
                </span>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Feed tabs */}
        <FeedTabs />
      </header>
      
      {/* Feed content */}
      <div className="pb-24">
        {/* Refresh button (visible on desktop) */}
        <div className="hidden md:flex justify-center pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </motion.button>
        </div>
        
        {posts.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-4"
            >
              🐱
            </motion.div>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-primary-500 font-medium"
            >
              {loadingMessages[Math.floor(Math.random() * loadingMessages.length)]}
            </motion.p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              😿
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              No memes yet!
            </h2>
            <p className="text-lmeow-muted mt-2">
              Be the first to unleash the chaos! 🌪️
            </p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={fetchMore}
            hasMore={hasMore}
            loader={
              <div className="flex flex-col items-center py-6">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-4xl"
                >
                  🐾
                </motion.span>
                <p className="text-sm text-primary-400 mt-2">Loading more chaos...</p>
              </div>
            }
            endMessage={
              <div className="text-center py-8">
                <img src="/lmeow-logo.png" alt="Lmeow" className="w-12 h-12 mx-auto mb-2 object-contain" />
                <p className="text-lmeow-muted font-medium">
                  You've seen all the memes! 
                </p>
                <p className="text-sm text-primary-400">Come back for more chaos later! 🐾</p>
              </div>
            }
            className="space-y-4 px-4 pt-4"
          >
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <FeedCard post={post} isDemo={isDemo} />
              </motion.div>
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
