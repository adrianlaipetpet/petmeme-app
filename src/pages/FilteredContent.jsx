import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Heart, Filter, Grid, List } from 'lucide-react';
import { demoPosts, trendingTags, popularBreeds } from '../data/demoData';

export default function FilteredContent() {
  const { type, value } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Decode the filter value
  const filterValue = decodeURIComponent(value || '');
  
  // Get display info based on filter type
  const getFilterInfo = () => {
    switch (type) {
      case 'hashtag': {
        const tag = trendingTags.find(t => t.tag === filterValue);
        return {
          title: `#${filterValue}`,
          emoji: tag?.emoji || '🏷️',
          subtitle: tag ? `${formatCount(tag.count)} posts` : 'Explore posts with this hashtag',
        };
      }
      case 'breed': {
        const breed = popularBreeds.find(b => b.breed === filterValue);
        return {
          title: filterValue,
          emoji: breed?.type === 'cat' ? '🐱' : '🐕',
          subtitle: breed ? `${formatCount(breed.count)} posts` : 'Explore this breed',
        };
      }
      case 'behavior': {
        const behaviorEmojis = {
          zoomies: '💨',
          lazy: '😴',
          dramatic: '🎭',
          foodie: '🍗',
          derpy: '🤪',
          cuddly: '🤗',
          genius: '🧠',
          clingy: '🥺',
          scared: '😱',
          destroyer: '💥',
          vocal: '🗣️',
          jealous: '😤',
        };
        return {
          title: filterValue.charAt(0).toUpperCase() + filterValue.slice(1),
          emoji: behaviorEmojis[filterValue] || '🐾',
          subtitle: 'Pets with this personality',
        };
      }
      default:
        return {
          title: 'Explore',
          emoji: '🔍',
          subtitle: 'Discover amazing pet content',
        };
    }
  };
  
  // Filter posts based on type and value
  const filteredPosts = useMemo(() => {
    let posts = [...demoPosts];
    
    switch (type) {
      case 'hashtag':
        posts = posts.filter(p => 
          p.hashtags?.some(h => h.toLowerCase() === filterValue.toLowerCase())
        );
        break;
      case 'breed':
        posts = posts.filter(p => 
          p.pet?.breed?.toLowerCase().includes(filterValue.toLowerCase())
        );
        break;
      case 'behavior':
        posts = posts.filter(p => 
          p.behaviors?.some(b => b.toLowerCase() === filterValue.toLowerCase())
        );
        break;
    }
    
    // If no matches, show all posts (demo mode)
    if (posts.length === 0) {
      posts = demoPosts;
    }
    
    return posts;
  }, [type, filterValue]);
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };
  
  const filterInfo = getFilterInfo();
  
  return (
    <div className="min-h-screen bg-petmeme-bg dark:bg-petmeme-bg-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/80 dark:bg-petmeme-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{filterInfo.emoji}</span>
              <h1 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                {filterInfo.title}
              </h1>
            </div>
            <p className="text-sm text-petmeme-muted">{filterInfo.subtitle}</p>
          </div>
          
          {/* View mode toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-petmeme-muted'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-petmeme-muted'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="p-4">
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-3 gap-1">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
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
                      alt={post.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Pet-only fallback! 🐱🐶
                        e.target.src = post.pet?.petType === 'dog' 
                          ? 'https://placedog.net/300/300?id=filtered' 
                          : 'https://cataas.com/cat?width=300&height=300&t=filtered';
                      }}
                    />
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Heart className="w-5 h-5" fill="white" />
                      {formatCount(post.likeCount)}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/post/${post.id}`}
                  className="card flex gap-4 p-3 hover:shadow-card-hover transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Pet-only fallback! 🐱🐶
                          e.target.src = Math.random() > 0.5 
                            ? 'https://placedog.net/100/100?id=thumb' 
                            : 'https://cataas.com/cat?width=100&height=100&t=thumb';
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={post.pet.photoUrl}
                        alt={post.pet.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          // Pet-only fallback! 🐱🐶
                          e.target.src = post.pet?.petType === 'dog' 
                            ? 'https://placedog.net/50/50?id=avatar' 
                            : 'https://cataas.com/cat?width=50&height=50&t=avatar';
                        }}
                      />
                      <span className="font-semibold text-sm text-petmeme-text dark:text-petmeme-text-dark">
                        {post.pet.name}
                      </span>
                    </div>
                    
                    <p className="text-sm text-petmeme-text dark:text-petmeme-text-dark line-clamp-2">
                      {post.caption}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-petmeme-muted">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatCount(post.likeCount)}
                      </span>
                      <span>{post.pet.breed}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{filterInfo.emoji}</div>
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
              No posts yet
            </h2>
            <p className="text-petmeme-muted mt-2 mb-6">
              Be the first to post with {filterInfo.title}!
            </p>
            <Link to="/create" className="btn-primary inline-block">
              Create Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
