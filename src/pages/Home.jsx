import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import FeedCard from '../components/feed/FeedCard';
import FeedTabs from '../components/feed/FeedTabs';
import { Loader2, Sparkles, Cat } from 'lucide-react';
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
  const { posts, setPosts, addPosts, hasMore, isLoading, setLoading, activeTab, lastDoc } = useFeedStore();
  const { pet } = useAuthStore();
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // Load initial posts
  useEffect(() => {
    if (!initialLoaded) {
      loadPosts(true);
      setInitialLoaded(true);
    }
  }, [initialLoaded]);
  
  // Reset when tab changes
  useEffect(() => {
    if (initialLoaded) {
      loadPosts(true);
    }
  }, [activeTab]);
  
  const loadPosts = async (isInitial = false) => {
    setLoading(true);
    
    try {
      // For demo: use demo posts from shared data
      if (isInitial) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setPosts(demoPosts);
      } else {
        // Load more posts (simulate)
        await new Promise(resolve => setTimeout(resolve, 500));
        const morePosts = demoPosts.map(p => ({
          ...p,
          id: `${p.id}-${Date.now()}-${Math.random()}`,
          likeCount: Math.floor(Math.random() * 10000),
        }));
        addPosts(morePosts, null);
      }
      
      /* Firebase implementation (uncomment when ready):
      const postsRef = collection(db, 'posts');
      let q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      if (isInitial) {
        setPosts(newPosts);
      } else {
        addPosts(newPosts, snapshot.docs[snapshot.docs.length - 1]);
      }
      */
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadPosts(false);
    }
  }, [isLoading, hasMore]);
  
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
          
          {/* User greeting */}
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
        
        {/* Feed tabs */}
        <FeedTabs />
      </header>
      
      {/* Feed content */}
      <div className="pb-24">
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
                transition={{ delay: index * 0.05 }}
              >
                <FeedCard post={post} />
              </motion.div>
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
