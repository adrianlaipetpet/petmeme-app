import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import FeedCard from '../components/feed/FeedCard';
import FeedTabs from '../components/feed/FeedTabs';
import { Loader2, Sparkles } from 'lucide-react';
import { demoPosts } from '../data/demoData';

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
      <header className="sticky top-0 z-40 bg-petmeme-bg/80 dark:bg-petmeme-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gradient">
            PetMeme Hub
          </h1>
          
          {pet && (
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Hi, {pet.name}!
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Feed tabs */}
        <FeedTabs />
      </header>
      
      {/* Feed content */}
      <div className="pb-4">
        {posts.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="mt-4 text-petmeme-muted">Loading pet memes...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="font-heading text-2xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
              No memes yet!
            </h2>
            <p className="text-petmeme-muted mt-2">
              Be the first to share some pet chaos
            </p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={fetchMore}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            }
            endMessage={
              <p className="text-center py-6 text-petmeme-muted">
                You've seen all the memes! 🎉
              </p>
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
