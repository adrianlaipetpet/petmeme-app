import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Hash, X, Play } from 'lucide-react';
import { trendingTags, popularBreeds, demoPosts, reliableImages } from '../data/demoData';

// Featured memes (curated) - use demo posts
const featuredMemes = [
  { 
    id: demoPosts[0]?.id || '1', 
    image: demoPosts[0]?.mediaUrl || reliableImages.post1, 
    title: "Editor's Pick",
    type: demoPosts[0]?.type || 'image',
  },
  { 
    id: demoPosts[1]?.id || '2', 
    image: demoPosts[1]?.thumbnailUrl || demoPosts[1]?.mediaUrl || reliableImages.thumb1, 
    title: 'Most Viral',
    type: demoPosts[1]?.type || 'video',
    videoUrl: demoPosts[1]?.mediaUrl,
  },
  { 
    id: demoPosts[2]?.id || '3', 
    image: demoPosts[2]?.mediaUrl || reliableImages.post3, 
    title: 'Fan Favorite',
    type: demoPosts[2]?.type || 'image',
  },
];

// 🐱🐶 Coding-themed behavior filters (cats & dogs only!)
const behaviors = [
  { id: 'debugging', emoji: '🔍', label: 'Debugging' },
  { id: 'deploying', emoji: '🚀', label: 'Deploying' },
  { id: 'keyboard', emoji: '⌨️', label: 'On Keyboard' },
  { id: 'crashed', emoji: '💤', label: 'Crashed' },
  { id: 'fetch', emoji: '🦴', label: 'Fetching' },
  { id: 'judging', emoji: '👀', label: 'Code Review' },
  { id: 'genius', emoji: '🧠', label: '10x Dev' },
  { id: 'chaos', emoji: '💥', label: 'rm -rf' },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Check if it looks like a hashtag
      if (searchQuery.startsWith('#')) {
        navigate(`/browse/hashtag/${encodeURIComponent(searchQuery.slice(1))}`);
      } else {
        // Default to hashtag search
        navigate(`/browse/hashtag/${encodeURIComponent(searchQuery)}`);
      }
    }
  };
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header - Coding meme search 🐱🐶💻 */}
      <header className="sticky top-0 z-40 bg-lmeow-bg/80 dark:bg-lmeow-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lmeow-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="Search coding memes, cats, dogs... 🐱🐶💻"
            className="input-field pl-12 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lmeow-muted hover:text-primary-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>
      </header>
      
      <div className="p-4 space-y-8">
        {/* Featured coding memes 🐱🐶💻 */}
        <section>
          <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark mb-4 flex items-center gap-2">
            <span className="text-2xl">💻</span> Top Coding Memes 🐱🐶
          </h2>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
            {featuredMemes.map((meme, index) => (
              <motion.div
                key={meme.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/post/${meme.id}`}
                  className="relative block w-72 aspect-[4/5] rounded-3xl overflow-hidden flex-shrink-0"
                >
                  {meme.type === 'video' ? (
                    <video
                      src={meme.videoUrl}
                      poster={meme.image}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={meme.image}
                      alt={meme.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Pet-only fallback! 🐱🐶
                        e.target.src = Math.random() > 0.5 
                          ? 'https://cataas.com/cat?width=300&height=400&t=featured' 
                          : 'https://placedog.net/300/400?id=featured';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {meme.type === 'video' && (
                    <div className="absolute top-4 right-4">
                      <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 left-4">
                    <span className="badge bg-white/20 backdrop-blur-sm text-white border-0">
                      {meme.title}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Trending coding hashtags 🔥 */}
        <section>
          <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-coral animate-pulse" /> Trending Dev Tags 🔥
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {trendingTags.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Link
                  to={`/browse/hashtag/${encodeURIComponent(item.tag)}`}
                  className="card p-4 text-left hover:shadow-card-hover transition-shadow block bg-gradient-to-br from-white to-primary-50 dark:from-lmeow-card-dark dark:to-primary-900/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-lmeow-text dark:text-lmeow-text-dark">
                        #{item.tag}
                      </p>
                      <p className="text-sm text-lmeow-muted">
                        {formatCount(item.count)} memes
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Browse by breed - Cats & Dogs Only! 🐱🐶 */}
        <section>
          <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark mb-4 flex items-center gap-2">
            <span className="text-2xl">🐱🐶</span> Popular Breeds (Cats & Dogs!)
          </h2>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            {popularBreeds.map((item, index) => (
              <motion.div
                key={item.breed}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1 }}
              >
                <Link
                  to={`/browse/breed/${encodeURIComponent(item.breed)}`}
                  className="flex-shrink-0 text-center block"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-primary-300 dark:border-primary-600 mx-auto mb-2 shadow-lg">
                    <img
                      src={item.image}
                      alt={item.breed}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Pet breed fallback! 🐱🐶
                        e.target.src = item.type === 'dog' 
                          ? 'https://placedog.net/100/100?id=breed' 
                          : 'https://cataas.com/cat?width=100&height=100&t=breed';
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium text-lmeow-text dark:text-lmeow-text-dark max-w-[80px] truncate flex items-center justify-center gap-1">
                    {item.emoji || (item.type === 'dog' ? '🐶' : '🐱')} {item.breed}
                  </p>
                  <p className="text-xs text-lmeow-muted">
                    {formatCount(item.count)}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Quick coding behavior filters 💻 */}
        <section>
          <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary-500" /> Browse by Dev Mood 💻
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {behaviors.map((behavior) => (
              <motion.div key={behavior.id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={`/browse/behavior/${encodeURIComponent(behavior.id)}`}
                  className="badge-behavior hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors inline-flex"
                >
                  <span>{behavior.emoji}</span>
                  <span>{behavior.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* For You section - Personalized coding memes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark flex items-center gap-2">
              <span className="text-2xl">🎯</span> Pawsonalized For You
            </h2>
            <Link to="/" className="text-sm text-primary-500 font-medium hover:underline">
              See All →
            </Link>
          </div>
          
          <p className="text-lmeow-muted text-sm mb-4">
            Coding memes matched to your pet's dev personality 🐱🐶💻
          </p>
          
          {/* Masonry-style grid preview */}
          <div className="grid grid-cols-2 gap-3">
            {demoPosts.slice(0, 4).map((post, index) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className={`rounded-2xl overflow-hidden relative group ${
                  index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                }`}
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
                      <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Pet post fallback! 🐱🐶
                      e.target.src = post.pet?.petType === 'dog' 
                        ? 'https://placedog.net/300/300?id=post' 
                        : 'https://cataas.com/cat?width=300&height=300&t=post';
                    }}
                  />
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
