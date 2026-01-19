import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, X, PawPrint, Sparkles, 
  ChevronRight, Flame, Star, Zap
} from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import { useAuthStore } from '../store/authStore';

// 🔥 Default/fallback trending hashtags (used while loading)
const DEFAULT_HASHTAGS = [
  { tag: 'zoomies', emoji: '🌀', count: 0 },
  { tag: 'sleepy', emoji: '😴', count: 0 },
  { tag: 'treats', emoji: '🍖', count: 0 },
  { tag: 'playing', emoji: '🎾', count: 0 },
  { tag: 'cuddly', emoji: '🥰', count: 0 },
  { tag: 'derpy', emoji: '🤪', count: 0 },
];

// 🐾 Default/fallback popular breeds (used while loading)
const DEFAULT_BREEDS = [
  { breed: 'Golden Retriever', petType: 'dog' },
  { breed: 'Persian', petType: 'cat' },
  { breed: 'Husky', petType: 'dog' },
  { breed: 'Siamese', petType: 'cat' },
  { breed: 'Corgi', petType: 'dog' },
  { breed: 'Maine Coon', petType: 'cat' },
  { breed: 'Shiba Inu', petType: 'dog' },
  { breed: 'British Shorthair', petType: 'cat' },
];

// 🎭 Behavior moods - IDs must match what's stored in posts (user-selected behaviors)
const BEHAVIOR_MOODS = [
  { id: 'zoomies', emoji: '🌀', label: 'Zoomies', color: 'from-orange-400 to-red-500' },
  { id: 'lazy', emoji: '💤', label: 'Sleepy', color: 'from-indigo-400 to-purple-500' },
  { id: 'foodie', emoji: '🍖', label: 'Foodie', color: 'from-amber-400 to-orange-500' },
  { id: 'destroyer', emoji: '💥', label: 'Destroyer', color: 'from-red-500 to-orange-600' },
  { id: 'dramatic', emoji: '🎭', label: 'Drama', color: 'from-pink-400 to-rose-500' },
  { id: 'cuddly', emoji: '🥰', label: 'Cuddly', color: 'from-rose-400 to-pink-500' },
  { id: 'vocal', emoji: '🗣️', label: 'Vocal', color: 'from-blue-400 to-cyan-500' },
  { id: 'derpy', emoji: '🤪', label: 'Derpy', color: 'from-yellow-400 to-lime-500' },
];

// Note: Personalized section now uses user's ACTUAL behaviors directly

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState(DEFAULT_HASHTAGS);
  const [popularBreeds, setPopularBreeds] = useState(DEFAULT_BREEDS);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(true);
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(true);
  
  const { loadTrendingPosts, getTrendingHashtags, getPopularBreeds } = useFeedStore();
  const { pet } = useAuthStore();
  const navigate = useNavigate();

  // Load all explore data on mount
  useEffect(() => {
    const loadExploreData = async () => {
      // Load featured posts
      setIsLoadingFeatured(true);
      try {
        const posts = await loadTrendingPosts(6);
        setFeaturedPosts(posts.slice(0, 3));
        console.log('✅ Loaded', posts.length, 'featured posts');
      } catch (e) {
        console.error('Failed to load featured:', e);
      } finally {
        setIsLoadingFeatured(false);
      }
      
      // Load trending hashtags
      setIsLoadingHashtags(true);
      try {
        const hashtags = await getTrendingHashtags(8);
        if (hashtags.length > 0) {
          setTrendingHashtags(hashtags);
          console.log('✅ Loaded', hashtags.length, 'trending hashtags');
        }
      } catch (e) {
        console.error('Failed to load hashtags:', e);
      } finally {
        setIsLoadingHashtags(false);
      }
      
      // Load popular breeds - only show breeds that have actual posts
      setIsLoadingBreeds(true);
      try {
        const breeds = await getPopularBreeds(10);
        console.log('📊 Raw breeds from getPopularBreeds:', breeds);
        
        if (breeds && breeds.length > 0) {
          setPopularBreeds(breeds);
          console.log('✅ Loaded', breeds.length, 'popular breeds');
        } else {
          console.log('⚠️ No breeds found, keeping defaults');
          // Keep default breeds as placeholder
        }
      } catch (e) {
        console.error('Failed to load breeds:', e);
        // Keep default breeds on error
      } finally {
        setIsLoadingBreeds(false);
      }
    };
    
    loadExploreData();
  }, []);

  // Format large numbers
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };

  // Known moods/behaviors for search detection
  const KNOWN_MOODS = [
    'zoomies', 'lazy', 'sleepy', 'foodie', 'destroyer', 'dramatic', 'drama',
    'cuddly', 'vocal', 'derpy', 'scared', 'guilty', 'genius', 'clingy',
    'playful', 'grumpy', 'hyper', 'calm', 'crazy', 'naughty', 'sneaky',
    'sleeping', 'eating', 'playing', 'napping', 'excited'
  ];
  
  // Known breeds for search detection
  const KNOWN_BREEDS = [
    'golden retriever', 'labrador', 'husky', 'corgi', 'pomeranian', 'shiba', 'shiba inu',
    'bulldog', 'french bulldog', 'beagle', 'german shepherd', 'poodle', 'dachshund',
    'boxer', 'rottweiler', 'yorkshire', 'yorkie', 'chihuahua', 'maltese', 'border collie',
    'australian shepherd', 'samoyed', 'shih tzu', 'pit bull', 'pitbull', 'pug',
    'persian', 'siamese', 'maine coon', 'british shorthair', 'ragdoll', 'bengal',
    'scottish fold', 'tabby', 'calico', 'sphynx', 'russian blue', 'abyssinian'
  ];

  // Handle search submission - supports hashtags, moods, and breeds
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.trim().toLowerCase();
    const originalQuery = searchQuery.trim();
    
    // Check if it's a hashtag search
    if (originalQuery.startsWith('#')) {
      navigate(`/browse/hashtag/${encodeURIComponent(originalQuery.slice(1))}`);
      return;
    }
    
    // Check if it matches a known mood/behavior
    const matchedMood = KNOWN_MOODS.find(mood => 
      query === mood || query.includes(mood) || mood.includes(query)
    );
    if (matchedMood) {
      navigate(`/browse/behavior/${encodeURIComponent(matchedMood)}`);
      return;
    }
    
    // Check if it matches a known breed
    const matchedBreed = KNOWN_BREEDS.find(breed => 
      query === breed || breed.includes(query) || query.includes(breed)
    );
    if (matchedBreed) {
      navigate(`/browse/breed/${encodeURIComponent(matchedBreed)}`);
      return;
    }
    
    // Default to hashtag search for anything else
    navigate(`/browse/hashtag/${encodeURIComponent(query)}`);
  };

  // Get personalized recommendations based on pet's ACTUAL behaviors
  // ONLY shows content matching what the user selected - no extra suggestions
  const getPersonalizedSection = () => {
    if (!pet?.behaviors?.length) return null;
    
    // Use the user's EXACT behaviors only - no mapping, no extra suggestions
    const userBehaviors = pet.behaviors.map(b => b.toLowerCase().trim());
    
    console.log('👤 User behaviors for personalization:', userBehaviors);
    
    // Get emoji for first behavior
    const primaryBehavior = userBehaviors[0];
    const behaviorEmojis = {
      zoomies: '🌀', lazy: '😴', dramatic: '🎭', foodie: '🍖', 
      destroyer: '💥', derpy: '🤪', vocal: '🗣️', cuddly: '🥰',
      scared: '😱', jealous: '😤', clingy: '🥺', genius: '🧠',
      playful: '🎾', sleeping: '💤', eating: '🍖', grumpy: '😾',
    };
    
    return {
      title: `Perfect for ${pet.name || 'Your Pet'}`,
      emoji: behaviorEmojis[primaryBehavior] || '💝',
      // Use ONLY the user's actual, exact behaviors - nothing else
      behaviors: userBehaviors,
    };
  };

  const personalizedSection = getPersonalizedSection();
  
  // Get emoji for a hashtag - comprehensive mapping with partial matching
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
      groom: '✂️', train: '🎓', trick: '🎪', jump: '🦘', dig: '🕳️',
      chase: '💨', hide: '🙈', seek: '👀', sniff: '👃', bark: '📢',
      meow: '🐱', purr: '😻', howl: '🌙', yawn: '🥱', stretch: '🧘',
      
      // Places & Things
      dogpark: '🐕', catlife: '🐱', doglife: '🐕', pet: '🐾', home: '🏠',
      outdoors: '🌳', beach: '🏖️', snow: '❄️', rain: '🌧️', sun: '☀️',
      couch: '🛋️', bed: '🛏️', car: '🚗', vet: '🏥', park: '🌲',
      
      // Food related
      hungry: '😋', snack: '🍪', dinner: '🍽️', breakfast: '🥣', water: '💧',
      bone: '🦴', fish: '🐟', chicken: '🍗', beef: '🥩', kibble: '🥣',
      
      // Appearance
      fluffy: '☁️', fuzzy: '🧸', soft: '🪶', shiny: '✨', spotted: '🔵',
      striped: '🦓', curly: '🌀', long: '💇', short: '✂️', tiny: '🤏',
      big: '🦣', small: '🐁', baby: '👶', puppy: '🐶', kitten: '🐱',
      
      // Accessories
      collar: '📿', leash: '🪢', toy: '🧸', ball: '⚽', squeaky: '🔊',
      costume: '👗', hat: '🎩', bow: '🎀', bandana: '🧣', sweater: '🧥',
      
      // Holidays & Events
      christmas: '🎄', halloween: '🎃', birthday: '🎂', party: '🥳', newyear: '🎆',
      valentine: '💝', easter: '🐰', thanksgiving: '🦃', summer: '☀️', winter: '❄️',
      
      // General
      viral: '📈', trending: '🔥', famous: '⭐', best: '🏆', new: '🆕',
      first: '1️⃣', morning: '🌅', night: '🌙', weekend: '📅', daily: '📆',
      meme: '😹', lol: '🤣', omg: '😱', wtf: '🤯', aww: '🥺',
      mode: '🎮', life: '✨', time: '⏰', day: '📅', moment: '📸',
    };
    
    const tagLower = tag.toLowerCase();
    
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
  
  // Get breed image URL - using accurate breed-specific images
  const getBreedImage = (breed, petType) => {
    // Accurate breed-specific image URLs
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
      'poodle': 'https://images.unsplash.com/photo-1616149569609-3889a14a9c40?w=200&h=200&fit=crop&crop=face',
      'dachshund': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=200&h=200&fit=crop&crop=face',
      'boxer': 'https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=200&h=200&fit=crop&crop=face',
      'rottweiler': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=200&h=200&fit=crop&crop=face',
      'yorkshire': 'https://images.unsplash.com/photo-1626809766286-4ee5e7125a73?w=200&h=200&fit=crop&crop=face',
      'yorkie': 'https://images.unsplash.com/photo-1626809766286-4ee5e7125a73?w=200&h=200&fit=crop&crop=face',
      'chihuahua': 'https://images.unsplash.com/photo-1605639156388-3ce4145dd26d?w=200&h=200&fit=crop&crop=face',
      'maltese': 'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=200&h=200&fit=crop&crop=face',
      'border collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=200&h=200&fit=crop&crop=face',
      'australian shepherd': 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=200&h=200&fit=crop&crop=face',
      'samoyed': 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=200&h=200&fit=crop&crop=face',
      'shih tzu': 'https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=200&h=200&fit=crop&crop=face',
      'pit bull': 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&h=200&fit=crop&crop=face',
      'pitbull': 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&h=200&fit=crop&crop=face',
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
      'munchkin': 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=200&h=200&fit=crop&crop=face',
      'birman': 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=200&h=200&fit=crop&crop=face',
    };
    
    const breedLower = breed.toLowerCase().trim();
    
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
    
    // Deterministic fallback based on breed name (so same breed always gets same image)
    const isDog = (petType || '').toLowerCase().includes('dog');
    
    // Create a simple hash from the breed name for consistent fallback selection
    const hashCode = breedLower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Fallback dog/cat images (will be consistent per breed name)
    const dogFallbacks = [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&h=100&fit=crop',
    ];
    const catFallbacks = [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=100&h=100&fit=crop',
    ];
    
    const fallbacks = isDog ? dogFallbacks : catFallbacks;
    return fallbacks[hashCode % fallbacks.length];
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-petmeme-bg to-primary-50/30 dark:from-petmeme-bg-dark dark:to-primary-950/20">
      {/* Header with Search */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/90 dark:bg-petmeme-bg-dark/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-petmeme-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memes, breeds, moods... 🔍"
              className="w-full pl-12 pr-10 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-primary-400 focus:bg-white dark:focus:bg-gray-900 transition-all text-petmeme-text dark:text-petmeme-text-dark placeholder:text-petmeme-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-petmeme-muted hover:text-primary-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8">
        
        {/* 🔥 Featured / Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-coral animate-pulse" />
              Hot Right Now
            </h2>
            <Link 
              to="/browse/trending"
              className="text-sm text-primary-500 font-medium flex items-center gap-1 hover:underline"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 touch-pan-x">
            {isLoadingFeatured ? (
              // Skeleton loaders
              [1, 2, 3].map((i) => (
                <div key={i} className="w-44 aspect-[3/4] rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
              ))
            ) : featuredPosts.length > 0 ? (
              featuredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <Link
                    to={`/post/${post.id}`}
                    className="relative block w-44 aspect-[3/4] rounded-3xl overflow-hidden shadow-lg group"
                  >
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://cataas.com/cat?width=200&height=300';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Trending badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-accent-coral/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        #{index + 1}
                      </span>
                    </div>
                    
                    {/* Engagement stats */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-xs font-medium truncate mb-1">
                        {post.caption?.slice(0, 30) || '🐾'}
                      </p>
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <span>❤️ {formatCount(post.likeCount || 0)}</span>
                        <span>💬 {formatCount(post.commentCount || 0)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              // Empty state - show placeholder cards
              [1, 2, 3].map((i) => (
                <Link
                  key={i}
                  to="/create"
                  className="flex-shrink-0 w-44 aspect-[3/4] rounded-3xl bg-gradient-to-br from-primary-100 to-accent-lavender/50 dark:from-primary-900/40 dark:to-accent-lavender/20 flex flex-col items-center justify-center text-center p-4"
                >
                  <span className="text-4xl mb-2">🐾</span>
                  <p className="text-sm text-petmeme-muted">
                    Be the first to go viral!
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* 🏷️ Trending Hashtags */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-coral" />
              Trending Tags
            </h2>
          </div>
          
          {isLoadingHashtags ? (
            /* Loading skeleton */
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingHashtags.length > 0 && trendingHashtags[0].count > 0 ? (
            /* Real trending hashtags with posts */
            <div className="grid grid-cols-2 gap-3">
              {trendingHashtags.slice(0, 6).map((item, index) => (
                <motion.div
                  key={item.tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={`/browse/hashtag/${encodeURIComponent(item.tag)}`}
                    className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all bg-gradient-to-br from-white to-gray-50 dark:from-petmeme-card-dark dark:to-gray-800/50 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-coral/20 to-orange-100 dark:from-accent-coral/30 dark:to-orange-900/20 flex items-center justify-center">
                      <span className="text-lg">{getHashtagEmoji(item.tag)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark truncate">
                        #{item.tag}
                      </p>
                      <p className="text-xs text-petmeme-muted">
                        {formatCount(item.count)} {item.count === 1 ? 'post' : 'posts'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-petmeme-muted flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            /* No real hashtags - show placeholder message */
            <div className="card p-6 text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-petmeme-card-dark">
              <span className="text-4xl block mb-3">🏷️</span>
              <p className="text-sm text-petmeme-muted mb-3">
                No trending tags yet! Be the first to start a trend.
              </p>
              <Link to="/create" className="text-primary-500 text-sm font-medium hover:underline">
                Create a meme with hashtags →
              </Link>
            </div>
          )}
        </section>

        {/* 🐾 Browse by Breed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-green-500" />
              Popular Breeds
            </h2>
            <Link 
              to="/browse/breeds"
              className="text-sm text-primary-500 font-medium flex items-center gap-1 hover:underline"
            >
              All Breeds <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 touch-pan-x">
            {isLoadingBreeds ? (
              // Skeleton loaders while loading
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto mb-2" />
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mx-auto" />
                </div>
              ))
            ) : (
              // Show breeds (real data or defaults)
              (popularBreeds.length > 0 ? popularBreeds : DEFAULT_BREEDS).map((item, index) => {
                const petType = item.petType || 'dog';
                const isDog = petType === 'dog' || petType?.includes('dog');
                return (
                  <motion.div
                    key={item.breed}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0"
                  >
                    <Link
                      to={`/browse/breed/${encodeURIComponent(item.breed)}`}
                      className="block text-center"
                    >
                      <div className={`w-20 h-20 rounded-full overflow-hidden border-3 ${
                        isDog 
                          ? 'border-orange-300 dark:border-orange-600' 
                          : 'border-purple-300 dark:border-purple-600'
                      } mx-auto mb-2 shadow-lg bg-gray-100 dark:bg-gray-800`}>
                        <img
                          src={getBreedImage(item.breed, petType)}
                          alt={item.breed}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = isDog 
                              ? 'https://placedog.net/100/100' 
                              : 'https://cataas.com/cat?width=100&height=100';
                          }}
                        />
                      </div>
                      <p className="text-xs font-medium text-petmeme-text dark:text-petmeme-text-dark max-w-[80px] truncate mx-auto">
                        {isDog ? '🐕' : '🐱'} {item.breed}
                      </p>
                      {item.count > 0 && (
                        <p className="text-xs text-petmeme-muted">
                          {item.count} {item.count === 1 ? 'post' : 'posts'}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* 🎭 Browse by Mood */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-lavender" />
              Pet Moods
            </h2>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {BEHAVIOR_MOODS.map((mood, index) => (
              <motion.div
                key={mood.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={`/browse/behavior/${encodeURIComponent(mood.id)}`}
                  className={`block p-3 rounded-2xl bg-gradient-to-br ${mood.color} text-white text-center shadow-lg`}
                >
                  <span className="text-2xl block mb-1">{mood.emoji}</span>
                  <span className="text-xs font-semibold">{mood.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 💝 Personalized For You */}
        {personalizedSection && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-gold" />
                {personalizedSection.title} {personalizedSection.emoji}
              </h2>
            </div>
            
            <div className="card p-4 bg-gradient-to-r from-primary-100 via-accent-lavender/30 to-accent-coral/20 dark:from-primary-900/40 dark:via-accent-lavender/20 dark:to-accent-coral/10">
              <p className="text-sm text-petmeme-muted mb-3">
                Based on {pet?.name}'s personality, you might love:
              </p>
              <div className="flex flex-wrap gap-2">
                {personalizedSection.behaviors.map((behavior) => {
                  const mood = BEHAVIOR_MOODS.find(m => m.id === behavior);
                  return (
                    <Link
                      key={behavior}
                      to={`/browse/behavior/${encodeURIComponent(behavior)}`}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
                    >
                      <span>{mood?.emoji || '🐾'}</span>
                      <span className="capitalize">{behavior}</span>
                    </Link>
                  );
                })}
              </div>
              
              <Link 
                to="/browse/foryou"
                className="mt-4 btn-primary w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                See All Personalized Picks
              </Link>
            </div>
          </section>
        )}

        {/* No pet profile - prompt to set up */}
        {!pet?.behaviors?.length && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 text-center bg-gradient-to-br from-primary-50 to-accent-lavender/20 dark:from-primary-900/30 dark:to-accent-lavender/10"
            >
              <span className="text-5xl block mb-3">🐾</span>
              <h3 className="font-heading text-lg font-bold text-petmeme-text dark:text-petmeme-text-dark mb-2">
                Get Personalized Picks!
              </h3>
              <p className="text-sm text-petmeme-muted mb-4">
                Tell us about your pet's personality to see memes they'll love
              </p>
              <Link 
                to="/settings"
                className="btn-primary inline-flex items-center gap-2"
              >
                <PawPrint className="w-4 h-4" />
                Set Up Pet Profile
              </Link>
            </motion.div>
          </section>
        )}

      </div>
    </div>
  );
}
