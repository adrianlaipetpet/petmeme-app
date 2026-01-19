import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Heart, Grid, List, Loader2, Sparkles, TrendingUp, PawPrint, ChevronRight } from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';
import FeedCard from '../components/feed/FeedCard';

export default function FilteredContent() {
  const { type, value } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [posts, setPosts] = useState([]);
  const [breeds, setBreeds] = useState([]); // For "All Breeds" view
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    loadTrendingPosts, 
    loadPostsByHashtag, 
    loadPostsByBreed,
    loadPostsByBehavior,
    loadPersonalizedPosts,
    getPopularBreeds,
  } = useFeedStore();
  const { pet } = useAuthStore();
  
  // Decode the filter value
  const filterValue = decodeURIComponent(value || '');
  
  // Load posts based on filter type
  // Note: feedStore queries already sort by trending score
  useEffect(() => {
    const loadFilteredPosts = async () => {
      setIsLoading(true);
      let fetchedPosts = [];
      
      try {
        switch (type) {
          case 'hashtag':
            console.log('🏷️ Loading hashtag:', filterValue);
            fetchedPosts = await loadPostsByHashtag(filterValue, 50);
            break;
          case 'breed':
            console.log('🐕 Loading breed:', filterValue);
            fetchedPosts = await loadPostsByBreed(filterValue, 50);
            break;
          case 'behavior':
            console.log('🎭 Loading behavior:', filterValue);
            fetchedPosts = await loadPostsByBehavior(filterValue, 50);
            break;
          case 'trending':
            console.log('🔥 Loading trending posts');
            fetchedPosts = await loadTrendingPosts(50);
            break;
          case 'foryou':
            console.log('💝 Loading personalized posts');
            if (pet?.behaviors?.length) {
              fetchedPosts = await loadPersonalizedPosts(pet.behaviors, 50);
            } else {
              fetchedPosts = await loadTrendingPosts(30);
            }
            break;
          case 'breeds':
            // Show all breeds as a browsable list (not posts)
            console.log('🐾 Loading all breeds list');
            const allBreeds = await getPopularBreeds(50); // Get more breeds
            setBreeds(allBreeds);
            // Don't load posts - we're showing a breeds list
            break;
          default:
            fetchedPosts = await loadTrendingPosts(30);
        }
        
        // Posts are already sorted by trending from feedStore
        if (type !== 'breeds') {
          console.log(`✅ Loaded ${fetchedPosts.length} posts for ${type}/${filterValue || 'all'}`);
          setPosts(fetchedPosts);
        }
      } catch (error) {
        console.error('Error loading filtered posts:', error);
        setPosts([]);
        setBreeds([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFilteredPosts();
  }, [type, filterValue, pet?.behaviors]);
  
  // Emoji mappings for hashtags and behaviors - with partial matching
  const getHashtagEmoji = (tag) => {
    const emojiMap = {
      // Behaviors & Moods
      zoomies: '🌀', sleeping: '💤', sleepy: '💤', eating: '🍖', playing: '🎾',
      dramatic: '🎭', cuddly: '🥰', grumpy: '😾', derpy: '🤪', lazy: '💤',
      foodie: '🍖', treats: '🍖', scared: '😱', guilty: '😬', genius: '🧠',
      vocal: '🗣️', clingy: '🥺', destroyer: '💥', sneaky: '🥷', excited: '🎉',
      puppyeyes: '🥺', chonky: '🐱', napping: '😴', hyper: '⚡', calm: '😌',
      crazy: '🤯', mischief: '😈', trouble: '😈', naughty: '😈', good: '😇',
      // Emotions
      cute: '🥰', funny: '😂', silly: '🤭', happy: '😊', sad: '😢',
      angry: '😠', confused: '😕', surprised: '😮', love: '❤️', adorable: '💕',
      precious: '💖', sweet: '🍬', fierce: '🔥', sassy: '💅', moody: '🌙',
      // Activities
      walk: '🚶', run: '🏃', fetch: '🎾', swim: '🏊', bath: '🛁',
      chase: '💨', hide: '🙈', seek: '👀', sniff: '👃', bark: '📢',
      meow: '🐱', purr: '😻', howl: '🌙', yawn: '🥱', stretch: '🧘',
      // Places
      dogpark: '🐕', catlife: '🐱', doglife: '🐕', pet: '🐾', home: '🏠',
      outdoors: '🌳', beach: '🏖️', snow: '❄️', park: '🌲',
      // Food
      hungry: '😋', snack: '🍪', dinner: '🍽️', bone: '🦴', fish: '🐟',
      // Appearance  
      fluffy: '☁️', fuzzy: '🧸', soft: '🪶', shiny: '✨', baby: '👶',
      puppy: '🐶', kitten: '🐱', tiny: '🤏', big: '🦣',
      // General
      viral: '📈', trending: '🔥', meme: '😹', lol: '🤣', aww: '🥺',
      mode: '🎮', life: '✨', time: '⏰', day: '📅', moment: '📸',
    };
    
    const tagLower = (tag || '').toLowerCase();
    
    // Check exact match first
    if (emojiMap[tagLower]) {
      return emojiMap[tagLower];
    }
    
    // Check if tag contains any keyword (for compound hashtags like "cuddlylife", "scaredmode")
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
      if (tagLower.includes(keyword)) {
        return emoji;
      }
    }
    
    return '✨';
  };
  
  // Map behavior IDs to display labels (must match BEHAVIOR_MOODS in Explore.jsx)
  const getBehaviorLabel = (behaviorId) => {
    const labelMap = {
      zoomies: 'Zoomies',
      lazy: 'Sleepy',
      foodie: 'Foodie', 
      destroyer: 'Destroyer',
      dramatic: 'Drama',
      cuddly: 'Cuddly',
      vocal: 'Vocal',
      derpy: 'Derpy',
    };
    return labelMap[behaviorId?.toLowerCase()] || behaviorId?.charAt(0).toUpperCase() + behaviorId?.slice(1);
  };
  
  // Check if a breed is a dog breed
  const isDogBreed = (breedName, petType) => {
    if (petType) {
      return petType.toLowerCase().includes('dog');
    }
    const dogBreeds = ['retriever', 'husky', 'corgi', 'pomeranian', 'shiba', 'beagle', 
      'bulldog', 'poodle', 'labrador', 'shepherd', 'dachshund', 'boxer', 'schnauzer'];
    const lower = (breedName || '').toLowerCase();
    return dogBreeds.some(db => lower.includes(db));
  };
  
  // Get breed image URL - accurate breed-specific images
  const getBreedImage = (breed, petType) => {
    const breedImages = {
      // Dogs - accurate breed photos
      'golden retriever': 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=200&h=200&fit=crop&crop=face',
      'labrador': 'https://images.unsplash.com/photo-1579213838058-5a5e0e5d5e5a?w=200&h=200&fit=crop&crop=face',
      'husky': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=200&h=200&fit=crop&crop=face',
      'siberian husky': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=200&h=200&fit=crop&crop=face',
      'corgi': 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=200&h=200&fit=crop&crop=face',
      'welsh corgi': 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=200&h=200&fit=crop&crop=face',
      'pembroke': 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=200&h=200&fit=crop&crop=face',
      'shiba': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop&crop=face',
      'shiba inu': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop&crop=face',
      'pomeranian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&crop=face',
      'bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop&crop=face',
      'french bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop&crop=face',
      'english bulldog': 'https://images.unsplash.com/photo-1585559700398-1385b3a8aeb6?w=200&h=200&fit=crop&crop=face',
      'beagle': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop&crop=face',
      'german shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&h=200&fit=crop&crop=face',
      'shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&h=200&fit=crop&crop=face',
      'poodle': 'https://images.unsplash.com/photo-1616149569609-3889a14a9c40?w=200&h=200&fit=crop&crop=face',
      'dachshund': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=200&h=200&fit=crop&crop=face',
      'boxer': 'https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=200&h=200&fit=crop&crop=face',
      'rottweiler': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=200&h=200&fit=crop&crop=face',
      'yorkshire': 'https://images.unsplash.com/photo-1626809766286-4ee5e7125a73?w=200&h=200&fit=crop&crop=face',
      'yorkie': 'https://images.unsplash.com/photo-1626809766286-4ee5e7125a73?w=200&h=200&fit=crop&crop=face',
      'chihuahua': 'https://images.unsplash.com/photo-1605639156388-3ce4145dd26d?w=200&h=200&fit=crop&crop=face',
      'maltese': 'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=200&h=200&fit=crop&crop=face',
      'border collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=200&h=200&fit=crop&crop=face',
      'collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=200&h=200&fit=crop&crop=face',
      'australian shepherd': 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=200&h=200&fit=crop&crop=face',
      'samoyed': 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=200&h=200&fit=crop&crop=face',
      'shih tzu': 'https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=200&h=200&fit=crop&crop=face',
      'pit bull': 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&h=200&fit=crop&crop=face',
      'pitbull': 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&h=200&fit=crop&crop=face',
      'great dane': 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=200&fit=crop&crop=face',
      'doberman': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=200&h=200&fit=crop&crop=face',
      'dalmatian': 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&h=200&fit=crop&crop=face',
      'akita': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop&crop=face',
      'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop&crop=face',
      
      // Cats - accurate breed photos
      'persian': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop&crop=face',
      'siamese': 'https://images.unsplash.com/photo-1555036015-5ff72f5f4c4d?w=200&h=200&fit=crop&crop=face',
      'maine coon': 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=200&h=200&fit=crop&crop=face',
      'british shorthair': 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=200&h=200&fit=crop&crop=face',
      'ragdoll': 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=200&h=200&fit=crop&crop=face',
      'bengal': 'https://images.unsplash.com/photo-1598463166228-c0f90d180918?w=200&h=200&fit=crop&crop=face',
      'scottish fold': 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=200&h=200&fit=crop&crop=face',
      'tabby': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=face',
      'orange tabby': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=face',
      'calico': 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200&h=200&fit=crop&crop=face',
      'sphynx': 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200&h=200&fit=crop&crop=face',
      'russian blue': 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=200&h=200&fit=crop&crop=face',
      'abyssinian': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=200&h=200&fit=crop&crop=face',
      'norwegian forest': 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=200&h=200&fit=crop&crop=face',
      'birman': 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=200&h=200&fit=crop&crop=face',
      'tonkinese': 'https://images.unsplash.com/photo-1555036015-5ff72f5f4c4d?w=200&h=200&fit=crop&crop=face',
      'burmese': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop&crop=face',
      'himalayan': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop&crop=face',
      'exotic shorthair': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop&crop=face',
      'munchkin': 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=200&h=200&fit=crop&crop=face',
      'tuxedo': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop&crop=face',
      'black cat': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop&crop=face',
      'ginger': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=face',
      'grey cat': 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=200&h=200&fit=crop&crop=face',
    };
    
    const breedLower = (breed || '').toLowerCase().trim();
    
    // Check for exact match first
    if (breedImages[breedLower]) {
      return breedImages[breedLower];
    }
    
    // Check for partial match
    for (const [key, url] of Object.entries(breedImages)) {
      if (breedLower.includes(key) || key.includes(breedLower)) {
        return url;
      }
    }
    
    // Fallback based on pet type
    const isDog = isDogBreed(breed, petType);
    return isDog 
      ? 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop'
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop';
  };
  
  // Get display info based on filter type
  const getFilterInfo = () => {
    switch (type) {
      case 'hashtag': {
        return {
          title: `#${filterValue}`,
          emoji: getHashtagEmoji(filterValue),
          subtitle: posts.length > 0 ? `${posts.length} posts` : 'Explore posts with this hashtag',
          gradient: 'from-primary-500 to-accent-lavender',
        };
      }
      case 'breed': {
        const isDog = isDogBreed(filterValue);
        return {
          title: filterValue,
          emoji: isDog ? '🐕' : '🐱',
          subtitle: posts.length > 0 ? `${posts.length} memes` : 'Explore this breed',
          gradient: isDog ? 'from-orange-400 to-amber-500' : 'from-purple-400 to-pink-500',
        };
      }
      case 'behavior': {
        const behaviorLabel = getBehaviorLabel(filterValue);
        return {
          title: behaviorLabel,
          emoji: getHashtagEmoji(filterValue),
          subtitle: posts.length > 0 ? `${posts.length} ${behaviorLabel.toLowerCase()} pets` : 'Pets with this mood',
          gradient: 'from-accent-coral to-pink-500',
        };
      }
      case 'trending':
        return {
          title: 'Trending',
          emoji: '🔥',
          subtitle: `${posts.length} hot memes right now`,
          gradient: 'from-orange-500 to-red-500',
        };
      case 'foryou':
        return {
          title: `For ${pet?.name || 'You'}`,
          emoji: '💝',
          subtitle: `${posts.length} personalized picks`,
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
            <p className="text-petmeme-muted">{type === 'breeds' ? 'Loading breeds...' : 'Finding the best memes...'}</p>
          </div>
        ) : type === 'breeds' ? (
          /* All Breeds List View */
          breeds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <span className="text-6xl block mb-4">🐾</span>
              <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                No breeds found yet!
              </h2>
              <p className="text-petmeme-muted mt-2 mb-6">
                Be the first to post a meme with breed detection!
              </p>
              <Link to="/create" className="btn-primary inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create Meme
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {breeds.map((breedItem, index) => {
                const isDog = isDogBreed(breedItem.breed, breedItem.petType);
                return (
                  <motion.div
                    key={breedItem.breed}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  >
                    <Link
                      to={`/browse/breed/${encodeURIComponent(breedItem.breed)}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-petmeme-card-dark rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                    >
                      <div className={`w-16 h-16 rounded-full overflow-hidden border-3 ${
                        isDog 
                          ? 'border-orange-300 dark:border-orange-600' 
                          : 'border-purple-300 dark:border-purple-600'
                      } flex-shrink-0`}>
                        <img
                          src={getBreedImage(breedItem.breed, breedItem.petType)}
                          alt={breedItem.breed}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = isDog 
                              ? 'https://placedog.net/100/100' 
                              : 'https://cataas.com/cat?width=100&height=100';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{isDog ? '🐕' : '🐱'}</span>
                          <h3 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark truncate">
                            {breedItem.breed}
                          </h3>
                        </div>
                        <p className="text-sm text-petmeme-muted">
                          {breedItem.count} {breedItem.count === 1 ? 'meme' : 'memes'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-petmeme-muted flex-shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
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
