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
  
  // Get breed image URL - using exact breed-specific stock photos
  const getBreedImage = (breed, petType) => {
    const breedImages = {
      // ===== DOG BREEDS =====
      'golden retriever': 'https://i.ytimg.com/vi/XR_pu8bD8wQ/maxresdefault.jpg',
      'labrador': 'https://www.breednbreeder.com/Images/Labrador_Retriever-Maharashtra-Mumbai-20250730_134535.png',
      'german shepherd': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/03-17/young+german+shepherd+puppy+lying+on+the+floor+with+ears+up-min.jpg',
      'shepherd': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/03-17/young+german+shepherd+puppy+lying+on+the+floor+with+ears+up-min.jpg',
      'bulldog': 'https://cdn.abcotvs.com/dip/images/432731_121114-BulldogPuppy.jpg',
      'english bulldog': 'https://cdn.abcotvs.com/dip/images/432731_121114-BulldogPuppy.jpg',
      'poodle': 'https://imageserver.petsbest.com/marketing/blog/toy-poodle.jpg',
      'beagle': 'https://i.ytimg.com/vi/bx7BjjqHf2U/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAdzZxUJspm8k-O4dPSAwYpCoXX2w',
      'rottweiler': 'https://i.ytimg.com/vi/7oLoDoYBFpk/maxresdefault.jpg',
      'husky': 'https://i.ytimg.com/vi/hvwaH3HH-AU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAVBpoh6TygMJa-SfMcV_cXqHXsEA',
      'siberian husky': 'https://i.ytimg.com/vi/hvwaH3HH-AU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAVBpoh6TygMJa-SfMcV_cXqHXsEA',
      'corgi': 'https://d128mjo55rz53e.cloudfront.net/media/images/blog-breed-corgi_1_1.max-500x500.format-jpeg.jpg',
      'welsh corgi': 'https://d128mjo55rz53e.cloudfront.net/media/images/blog-breed-corgi_1_1.max-500x500.format-jpeg.jpg',
      'pembroke': 'https://d128mjo55rz53e.cloudfront.net/media/images/blog-breed-corgi_1_1.max-500x500.format-jpeg.jpg',
      'dachshund': 'https://t4.ftcdn.net/jpg/03/31/43/27/360_F_331432762_wqIB4ngu7AloDCxDLaLkEeztYrIzmPcZ.jpg',
      'pomeranian': 'https://images.unsplash.com/photo-1582456891925-a53965520520?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'chihuahua': 'https://media.istockphoto.com/id/1313232209/photo/brown-chihuahua-sitting-on-floor-small-dog-in-asian-house-feeling-happy-and-relax-dog.jpg?s=612x612&w=0&k=20&c=lcSklrJbafwStJzKqU68imMG77hlEoCOkCCUeb_TEFk=',
      'shiba inu': 'https://www.carecredit.com/sites/cc/image/hero_shiba_inu.jpg',
      'shiba': 'https://www.carecredit.com/sites/cc/image/hero_shiba_inu.jpg',
      'border collie': 'https://media.istockphoto.com/id/485673645/photo/border-collie-puppy-with-paws-on-white-rustic-fence-iii.jpg?s=612x612&w=0&k=20&c=19JwsVjfVC2aEHXDcoFhxVmtTVsoZxjVjYQIH8-P85Y=',
      'collie': 'https://media.istockphoto.com/id/485673645/photo/border-collie-puppy-with-paws-on-white-rustic-fence-iii.jpg?s=612x612&w=0&k=20&c=19JwsVjfVC2aEHXDcoFhxVmtTVsoZxjVjYQIH8-P85Y=',
      'australian shepherd': 'https://www.dailypaws.com/thmb/rcHQ83jGUcvK-vdW-wq8UCUkHnI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/australian-shepherd-full-body-635701178-2000-9bd0c8b0c70a4f47be38bcf441278b05.jpg',
      'french bulldog': 'https://imageserver.petsbest.com/marketing/blog/french-bulldog.jpg',
      'pit bull': 'https://i.ytimg.com/vi/0-gOLD2omhU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB-gAHpIL8cIiDGXDNvossYaP7UqA',
      'pitbull': 'https://i.ytimg.com/vi/0-gOLD2omhU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB-gAHpIL8cIiDGXDNvossYaP7UqA',
      'boxer': 'https://t4.ftcdn.net/jpg/02/94/68/55/360_F_294685592_r50224hMlZqk6j6L140Fg1QHnZfHiEKQ.jpg',
      'great dane': 'https://www.greatpetcare.com/wp-content/uploads/2020/12/shutterstock_232598998-1.jpg',
      'doberman': 'https://t3.ftcdn.net/jpg/02/11/68/94/360_F_211689487_MXpT5avAp29r8gkEvzggE9gMmRRwrzT4.jpg',
      'maltese': 'https://t3.ftcdn.net/jpg/02/99/34/16/360_F_299341611_8mR9ZKnooOWMZdFtwYtIvE2mghfG0iUz.jpg',
      'shih tzu': 'https://blog.myollie.com/wp-content/uploads/2021/05/cute-Shih-Tzu-with-mud-on-his-fur-sticks-tongue-out-.jpg',
      'yorkshire terrier': 'https://consumer-cms.petfinder.com/sites/default/files/images/content/Yorkshire%20Terrier%204.jpg',
      'yorkshire': 'https://consumer-cms.petfinder.com/sites/default/files/images/content/Yorkshire%20Terrier%204.jpg',
      'yorkie': 'https://consumer-cms.petfinder.com/sites/default/files/images/content/Yorkshire%20Terrier%204.jpg',
      'cavalier king charles': 'https://pet-health-content-media.chewy.com/wp-content/uploads/2024/09/11180347/202105cavalier-king-charles-spaniel-flower-garden.jpg',
      'bernese mountain dog': 'https://t3.ftcdn.net/jpg/02/04/35/68/360_F_204356895_muhSOX9DL9ofmr4OY84g7X96BeyIgfyJ.jpg',
      'bernese': 'https://t3.ftcdn.net/jpg/02/04/35/68/360_F_204356895_muhSOX9DL9ofmr4OY84g7X96BeyIgfyJ.jpg',
      'samoyed': 'https://media.istockphoto.com/id/1003652324/photo/young-happy-smiling-white-samoyed-dog-or-bjelkier-smiley-sammy-outdoor-in-green-spring-meadow.jpg?s=612x612&w=0&k=20&c=CsfjkwnnPiyIGzFz0vu_S3Y0iHtwfOLS9WVvURrtwIM=',
      'akita': 'https://stayakita.com/assets/uploads/2020/02/akitastories_akitainu_lead.jpg',
      'mixed breed dog': 'https://www.rd.com/wp-content/uploads/2022/01/gettyimages-175274310-e1641875594224.jpg',
      
      // ===== CAT BREEDS =====
      'persian': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2016/10_October/persians/Persian+Cat+Facts+History+Personality+and+Care+_+ASPCA+Pet+Health+Insurance+_+white+Persian+cat+resting+on+a+brown+sofa-min.jpg',
      'maine coon': 'https://stewartpet.com/wp-content/uploads/cute-maine-coon-cat.jpg',
      'siamese': 'https://media.istockphoto.com/id/1076432222/photo/siamese-kitten.jpg?s=612x612&w=0&k=20&c=KjJzsMuiJYBzlxDpVeOBv9bYcjZQlnEd7W-dP7oEUh0=',
      'ragdoll': 'https://moderncat.com/wp-content/uploads/2013/09/Ragdoll-Header_bigstock-408978611_Rawlik.jpg',
      'british shorthair': 'https://cfa.org/wp-content/uploads/2024/04/2023-k07i-BabyrayBlueCheeses.webp',
      'bengal': 'https://www.trupanion.com/images/trupanionwebsitelibraries/bg/bengal-cat.jpg?sfvrsn=fc36dda4_5',
      'abyssinian': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2020/09-24/About+Abyssinians+Appearance+Personality+and+Health+_+ASPCA+Pet+Health+Insurance+_+Abyssinian+cat+resting+atop+a+cat+tree-min.jpg',
      'scottish fold': 'https://cdn.shopify.com/s/files/1/0765/3946/1913/files/Scottish_Fold_on_the_Table.jpg?v=1738746295',
      'sphynx': 'https://moderncat.com/wp-content/uploads/2014/09/bigstock-Cute-Sphynx-Cat-On-Sofa-At-Hom-467147599-1024x683.jpg',
      'russian blue': 'https://www.dailypaws.com/thmb/9YLApdymhj3xf0rTDVTA_iWOgOA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/russian-blue-cat-175701659-2000-44a0d33338f540a18d7b9c1573073141.jpg',
      'birman': 'https://www.thesprucepets.com/thmb/D5s03LINbIYpZuiG6uvBpKrAKXk=/3500x0/filters:no_upscale():strip_icc()/GettyImages-623368786-f66c97ad6d2d494287b448415f4340a8.jpg',
      'american shorthair': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/09-24/American+Shorthair+kitten+ready+to+pounce-min.jpg',
      'oriental': 'https://media.gettyimages.com/id/1474660153/photo/little-cute-kitten-of-oriental-cat-breed-of-white-and-brown-color-with-blue-eyes-and-big-ears.jpg?b=1&s=1024x1024&w=gi&k=20&c=_0-QVkpZiEaLOezqR3Aq7_sIcj61K0zzhxP1d6c3ZkU=',
      'norwegian forest cat': 'https://www.thesprucepets.com/thmb/c4xUQ9bmuswDR-umoAKTmwH_r-A=/1500x0/filters:no_upscale():strip_icc()/norwegian-forest-cat-4170085-fe84aa86023446c4b64236ddfbdefd2b.jpg',
      'norwegian forest': 'https://www.thesprucepets.com/thmb/c4xUQ9bmuswDR-umoAKTmwH_r-A=/1500x0/filters:no_upscale():strip_icc()/norwegian-forest-cat-4170085-fe84aa86023446c4b64236ddfbdefd2b.jpg',
      'devon rex': 'https://www.petassure.com/petassure/file-streams/page/uRLlDST5zY5GjbHr00N395unusual-cat-breeds-devon-rex.jpg.jpg',
      'exotic shorthair': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2020/11-12/attributes+of+an+exotic+shorthair+cat+_+orange+and+white+exotic+kitten+lying+on+a+tan+couch-min.jpg',
      'himalayan': 'https://www.aspcapetinsurance.com/media/2406/fun-facts-about-himalayan-cats.jpg',
      'tonkinese': 'https://images.ctfassets.net/440y9b545yd9/5WXgxWGLh0LDV93b7EPvJS/3244454a8b44c699bc8b3bdca35b1073/Tonkinese850.jpg',
      'burmese': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/07-08/brown+Burmese+kitten+lying+on+a+cream+couch-min.jpg',
      'munchkin': 'https://www.petrebels.com/en/wp-content/uploads/sites/3/2023/03/bobbi-wu-yJ1fX6PAXtU-unsplash-scaled.jpg',
      'tabby': 'https://wopet.com/uploads/admin/image/20250328/629d69b43bfecd308fd24e19d58a0436.png',
      'calico': 'https://www.thesprucepets.com/thmb/loFQWR7ifuP9PEsFEDdrxzvTmFs=/2939x0/filters:no_upscale():strip_icc()/calico-cats-photo-gallery-4031810-hero-7d2fe547778840e5a5ec9762d7f3d256.jpg',
      'tuxedo cat': 'https://www.thesprucepets.com/thmb/YNW9oqXaG2AKcQH7DMZzB1yYEis=/1500x0/filters:no_upscale():strip_icc()/about-tuxedo-cats-554695-hero-1dada8b97a9f4f229880ce3ad9047e99.jpg',
      'tuxedo': 'https://www.thesprucepets.com/thmb/YNW9oqXaG2AKcQH7DMZzB1yYEis=/1500x0/filters:no_upscale():strip_icc()/about-tuxedo-cats-554695-hero-1dada8b97a9f4f229880ce3ad9047e99.jpg',
      'orange tabby': 'https://media.istockphoto.com/id/590055188/photo/kitten-playing-with-toy-mouse.jpg?s=612x612&w=0&k=20&c=KQuhrNjfVNSLrwUsJ9b5Nwt7pyRNAFQjxq38fRHyKso=',
      'mixed breed cat': 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/09-24/American+Shorthair+kitten+ready+to+pounce-min.jpg',
      
      // ===== OTHER PETS =====
      'rabbit': 'https://www.rd.com/wp-content/uploads/2020/04/GettyImages-694542042-e1586274805503-scaled.jpg?fit=700%2C468',
      'hamster': 'https://i.ytimg.com/vi/lnvBWVztcl4/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDi9Fc2QdFrGrcjzPBtfOqawgny2g',
      'guinea pig': 'https://www.dupontvet.com/blog/wp-content/uploads/2020/11/Dupont_iStock-825722848.jpg',
      'parrot': 'https://s.yimg.com/ny/api/res/1.2/gSFK.cfO_0IJoulhWkPv4w--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD04Mjg7Y2Y9d2VicA--/https://media.zenfs.com/en/pethelpful_915/7c6aefe5c7587cfb9ea7b3f1f04b9abb',
      'cockatiel': 'https://www.shutterstock.com/image-photo/cute-cockatiel-tilting-head-curiosity-260nw-2642310853.jpg',
      'turtle': 'https://i.ytimg.com/vi/p4Jj9QZFJvw/mqdefault.jpg',
      'hedgehog': 'https://vetmed.illinois.edu/wp-content/uploads/2021/04/pc-keller-hedgehog.jpg',
      'ferret': 'https://thumbs.dreamstime.com/b/adorable-ferret-suit-business-photoshoot-cute-tiny-tie-poses-charming-photo-perfect-pet-apparel-websites-social-359170356.jpg',
      'chinchilla': 'https://i.ytimg.com/vi/7WU5vouP8PM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA6JjLjp6lBTBbRyWVdwZHmOyI00A',
      'fish': 'https://i.ytimg.com/vi/lUS1QySwwqc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB-gAHpIL8cIiDGXDNvossYaP7UqA',
      'gecko': 'https://www.vice.com/wp-content/uploads/sites/2/2019/12/1575658159035-GettyImages-957195932-leopard-gecko-holding-a-heart.jpeg?w=1024',
      'iguana': 'https://thumbs.dreamstime.com/b/cute-cartoon-style-iguana-exaggerated-features-including-large-eyes-vibrant-green-scales-sits-lush-jungle-setting-375675146.jpg',
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
    
    // Fallback based on pet type
    const isDog = (petType || '').toLowerCase().includes('dog');
    return isDog 
      ? 'https://www.rd.com/wp-content/uploads/2022/01/gettyimages-175274310-e1641875594224.jpg'
      : 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/09-24/American+Shorthair+kitten+ready+to+pounce-min.jpg';
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
                      <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark text-sm break-all">
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
