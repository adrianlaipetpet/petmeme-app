// ========================================
// 🐱🐶 LMEOW - Demo Data
// ONLY CATS AND DOGS WITH MEME TEXT!
// NO GENERIC IMAGES - PETS ONLY!
// ========================================

// ========================================
// REAL PET IMAGE SOURCES
// Using pet-specific image APIs:
// - cataas.com (Cat as a Service)
// - placedog.net (Random dog images)  
// - placekitten.com (Kitten images)
// - dog.ceo (Dog API)
// ========================================

// Real cat images with variety
const catImages = {
  // Cat avatars (small)
  avatar1: 'https://cataas.com/cat?width=100&height=100&t=1',
  avatar2: 'https://cataas.com/cat?width=100&height=100&t=2',
  avatar3: 'https://cataas.com/cat?width=100&height=100&t=3',
  avatar4: 'https://placekitten.com/100/100',
  avatar5: 'https://placekitten.com/101/101',
  
  // Cat posts (large)
  post1: 'https://cataas.com/cat?width=600&height=600&t=1',
  post2: 'https://cataas.com/cat?width=600&height=600&t=2',
  post3: 'https://cataas.com/cat?width=600&height=600&t=3',
  post4: 'https://cataas.com/cat?width=600&height=600&t=4',
  post5: 'https://placekitten.com/600/600',
  post6: 'https://placekitten.com/601/601',
  
  // Cat profiles
  profile1: 'https://cataas.com/cat?width=400&height=400&t=p1',
  profile2: 'https://cataas.com/cat?width=400&height=400&t=p2',
  profile3: 'https://placekitten.com/400/400',
  
  // Cat thumbnails
  thumb1: 'https://cataas.com/cat?width=300&height=300&t=th1',
  thumb2: 'https://placekitten.com/300/300',
};

// Real dog images with variety
const dogImages = {
  // Dog avatars (small)
  avatar1: 'https://placedog.net/100/100?id=1',
  avatar2: 'https://placedog.net/100/100?id=2',
  avatar3: 'https://placedog.net/100/100?id=3',
  avatar4: 'https://placedog.net/101/101?id=4',
  avatar5: 'https://placedog.net/102/102?id=5',
  
  // Dog posts (large)
  post1: 'https://placedog.net/600/600?id=1',
  post2: 'https://placedog.net/600/600?id=2',
  post3: 'https://placedog.net/600/600?id=3',
  post4: 'https://placedog.net/601/601?id=4',
  post5: 'https://placedog.net/602/602?id=5',
  post6: 'https://placedog.net/603/603?id=6',
  
  // Dog profiles
  profile1: 'https://placedog.net/400/400?id=1',
  profile2: 'https://placedog.net/400/400?id=2',
  profile3: 'https://placedog.net/401/401?id=3',
  
  // Dog thumbnails
  thumb1: 'https://placedog.net/300/300?id=1',
  thumb2: 'https://placedog.net/301/301?id=2',
};

// Combined reliable images export (all pets only!)
export const reliableImages = {
  // Cats 🐱
  catAvatar1: catImages.avatar1,
  catAvatar2: catImages.avatar2,
  catAvatar3: catImages.avatar3,
  catPost1: catImages.post1,
  catPost2: catImages.post2,
  catPost3: catImages.post3,
  catPost4: catImages.post4,
  catProfile1: catImages.profile1,
  catProfile2: catImages.profile2,
  catProfile3: catImages.profile3,
  catThumb1: catImages.thumb1,
  
  // Dogs 🐶
  dogAvatar1: dogImages.avatar1,
  dogAvatar2: dogImages.avatar2,
  dogAvatar3: dogImages.avatar3,
  dogPost1: dogImages.post1,
  dogPost2: dogImages.post2,
  dogPost3: dogImages.post3,
  dogPost4: dogImages.post4,
  dogProfile1: dogImages.profile1,
  dogProfile2: dogImages.profile2,
  dogProfile3: dogImages.profile3,
  dogThumb1: dogImages.thumb1,
  
  // Generic fallbacks (still pets!)
  avatar1: catImages.avatar1,
  avatar2: dogImages.avatar1,
  avatar3: catImages.avatar2,
  avatar4: dogImages.avatar2,
  post1: catImages.post1,
  post2: dogImages.post1,
  post3: catImages.post2,
  post4: dogImages.post2,
  profile1: catImages.profile1,
  profile2: dogImages.profile1,
  profile3: catImages.profile2,
  profile4: dogImages.profile2,
  thumb1: catImages.thumb1,
  thumb2: dogImages.thumb1,
  
  // Breed images (all real pets)
  breed1: dogImages.avatar1, // Golden Retriever
  breed2: catImages.avatar1, // Persian
  breed3: dogImages.avatar2, // Corgi
  breed4: catImages.avatar2, // Siamese
  breed5: dogImages.avatar3, // Husky
  breed6: catImages.avatar3, // Tabby
  
  // Campaign/challenge images (pets!)
  challenge1: catImages.post5,
  challenge2: dogImages.post5,
  challenge3: catImages.post6,
  campaign1: catImages.post5,
  campaign2: dogImages.post5,
  campaign3: catImages.post6,
  
  // Winner images (pets!)
  winner1: dogImages.avatar4,
  winner2: catImages.avatar4,
  winner3: dogImages.avatar5,
};

// Short videos of pets (using working video samples)
// Note: These are sample videos - in production, use actual pet videos
const petVideos = {
  cat1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  cat2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  dog1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  dog2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
};

// ========================================
// 🐱🐶 CODING MEME POSTS
// ALL with visible meme text overlays!
// ONLY cats and dogs - no exceptions!
// ========================================

export const demoPosts = [
  // 🐱 CAT MEME 1 - Classic coding cat
  {
    id: '1',
    type: 'image',
    mediaUrl: catImages.post1,
    memeText: {
      top: "WORKS ON MY",
      bottom: "MACHINE 🐱💻",
    },
    caption: "Senior dev energy 😹 When the code works locally but crashes in production #coding #devlife",
    pet: { 
      id: 'pet1',
      name: 'Debug McWhiskers', 
      breed: 'Tabby Cat', 
      photoUrl: catImages.avatar1,
      petType: 'cat',
    },
    behaviors: ['debugging', 'nocturnal'],
    hashtags: ['codingcat', 'devhumor', 'worksonmymachine'],
    likeCount: 42069,
    commentCount: 1337,
    shareCount: 404,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐶 DOG MEME 2 - Good boy deploy
  {
    id: '2',
    type: 'image',
    mediaUrl: dogImages.post1,
    memeText: {
      top: "DEPLOYED TO PROD",
      bottom: "ZERO ERRORS 🐶✅",
    },
    caption: "Good boy energy! First try deploy with no bugs 🚀 #deployment #devops",
    pet: { 
      id: 'pet2',
      name: 'Bork Overflow', 
      breed: 'Golden Retriever', 
      photoUrl: dogImages.avatar1,
      petType: 'dog',
    },
    behaviors: ['loyal', 'hardworking'],
    hashtags: ['goodboy', 'deployment', 'devops'],
    likeCount: 69420,
    commentCount: 2048,
    shareCount: 512,
    isLiked: true,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐱 CAT MEME 3 - Cat.exe crashed
  {
    id: '3',
    type: 'image',
    mediaUrl: catImages.post2,
    memeText: {
      top: "CAT.EXE HAS",
      bottom: "STOPPED WORKING 😹",
    },
    caption: "Brain.exe not responding... need reboot (nap) 💤 #crashed #catlife",
    pet: { 
      id: 'pet3',
      name: 'Null Pointer', 
      breed: 'Persian', 
      photoUrl: catImages.avatar2,
      petType: 'cat',
    },
    behaviors: ['lazy', 'dramatic'],
    hashtags: ['catexe', 'crashed', 'needcoffee'],
    likeCount: 31415,
    commentCount: 926,
    shareCount: 535,
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐶 DOG MEME 4 - Fetch() joke (VIDEO)
  {
    id: '4',
    type: 'video',
    mediaUrl: petVideos.dog1,
    thumbnailUrl: dogImages.post2,
    memeText: {
      top: "WHEN THE API",
      bottom: "FINALLY FETCHES 🐶🦴",
    },
    caption: "fetch() actually worked! Good boy returns with data! 🦴 #javascript #api",
    pet: { 
      id: 'pet4',
      name: 'API Boi', 
      breed: 'Corgi', 
      photoUrl: dogImages.avatar2,
      petType: 'dog',
    },
    behaviors: ['fetch', 'excited'],
    hashtags: ['fetch', 'api', 'javascript'],
    likeCount: 80085,
    commentCount: 1024,
    shareCount: 256,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐱 CAT MEME 5 - Keyboard cat
  {
    id: '5',
    type: 'image',
    mediaUrl: catImages.post3,
    memeText: {
      top: "FIXING YOUR CODE",
      bottom: "BY SITTING ON KEYBOARD 🐱⌨️",
    },
    caption: "My contribution to the codebase - keyboard assistance 😹 #pairprogramming",
    pet: { 
      id: 'pet5',
      name: 'Keyboard Destroyer', 
      breed: 'Maine Coon', 
      photoUrl: catImages.avatar3,
      petType: 'cat',
    },
    behaviors: ['helpful', 'chaotic'],
    hashtags: ['keyboardcat', 'pairprogramming', 'catcoder'],
    likeCount: 27182,
    commentCount: 818,
    shareCount: 284,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐶 DOG MEME 6 - Git push force
  {
    id: '6',
    type: 'image',
    mediaUrl: dogImages.post3,
    memeText: {
      top: "GIT PUSH --FORCE",
      bottom: "NO REGRETS 🐶💪",
    },
    caption: "YOLO deployed! What could possibly go wrong? 🚀 #git #yolo",
    pet: { 
      id: 'pet6',
      name: 'Force Pusher', 
      breed: 'Husky', 
      photoUrl: dogImages.avatar3,
      petType: 'dog',
    },
    behaviors: ['brave', 'chaotic'],
    hashtags: ['git', 'forcepush', 'yolo'],
    likeCount: 16180,
    commentCount: 339,
    shareCount: 887,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  
  // 🐱 CAT MEME 7 - 3AM coding (VIDEO)
  {
    id: '7',
    type: 'video',
    mediaUrl: petVideos.cat1,
    thumbnailUrl: catImages.post4,
    memeText: {
      top: "3AM CODING SESSION",
      bottom: "MEOW FIXED THE BUG 🐱🌙",
    },
    caption: "Night owl dev life 🌙 The best bugs are found at 3AM #nightcoding",
    pet: { 
      id: 'pet7',
      name: 'NightOwl Kitty', 
      breed: 'Siamese', 
      photoUrl: catImages.avatar1,
      petType: 'cat',
    },
    behaviors: ['nocturnal', 'focused'],
    hashtags: ['nightcoding', 'devlife', '3amclub'],
    likeCount: 14142,
    commentCount: 135,
    shareCount: 623,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: true,
    brandInfo: {
      name: 'CaffeineCode',
      link: 'https://example.com/coffee',
    },
  },
  
  // 🐶 DOG MEME 8 - Stack Overflow
  {
    id: '8',
    type: 'image',
    mediaUrl: dogImages.post4,
    memeText: {
      top: "COPYING FROM",
      bottom: "STACK OVERFLOW 🐶📋",
    },
    caption: "Professional developer workflow - copy, paste, pray 😂 #stackoverflow",
    pet: { 
      id: 'pet8',
      name: 'Copy Paste Pup', 
      breed: 'Beagle', 
      photoUrl: dogImages.avatar1,
      petType: 'dog',
    },
    behaviors: ['clever', 'efficient'],
    hashtags: ['stackoverflow', 'copypaste', 'devlife'],
    likeCount: 99999,
    commentCount: 5000,
    shareCount: 2500,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
];

// ========================================
// Trending hashtags (dev-themed)
// ========================================
export const trendingTags = [
  { tag: 'worksonmymachine', count: 452000, emoji: '💻' },
  { tag: 'devhumor', count: 381000, emoji: '😹' },
  { tag: 'codingcat', count: 298000, emoji: '🐱' },
  { tag: 'goodboy', count: 275000, emoji: '🐶' },
  { tag: 'bugfix', count: 215000, emoji: '🐛' },
  { tag: 'deployment', count: 192000, emoji: '🚀' },
  { tag: 'stackoverflow', count: 178000, emoji: '📋' },
  { tag: 'nightcoding', count: 156000, emoji: '🌙' },
];

// Popular breeds (cats & dogs only!)
export const popularBreeds = [
  { breed: 'Golden Retriever', type: 'dog', image: dogImages.avatar1, count: 1250000, emoji: '🐶' },
  { breed: 'Persian', type: 'cat', image: catImages.avatar1, count: 980000, emoji: '🐱' },
  { breed: 'Corgi', type: 'dog', image: dogImages.avatar2, count: 870000, emoji: '🐶' },
  { breed: 'Siamese', type: 'cat', image: catImages.avatar2, count: 760000, emoji: '🐱' },
  { breed: 'Husky', type: 'dog', image: dogImages.avatar3, count: 650000, emoji: '🐶' },
  { breed: 'Tabby', type: 'cat', image: catImages.avatar3, count: 540000, emoji: '🐱' },
];

// ========================================
// Pet Profiles (balanced cats & dogs)
// ========================================
export const demoProfiles = {
  // 🐱 CATS
  pet1: {
    id: 'pet1',
    name: 'Debug McWhiskers',
    type: '🐱 Cat',
    breed: 'Tabby',
    behaviors: ['debugging', 'nocturnal', 'keyboard'],
    photoURL: catImages.profile1,
    bio: "Senior Developer 🖥️ | Specializes in keyboard debugging | 'Works on my machine' enthusiast 😹",
    stats: { posts: 147, likes: 511120, followers: 125000, following: 42 },
    viralScore: 9.2,
    badges: ['viral', 'coder', 'nightowl'],
    petType: 'cat',
  },
  pet3: {
    id: 'pet3',
    name: 'Null Pointer',
    type: '🐱 Cat',
    breed: 'Persian',
    behaviors: ['crashed', 'napping', 'dramatic'],
    photoURL: catImages.profile2,
    bio: "cat.exe has stopped working 😹 | Nap-driven development | Coffee > Sleep 💤",
    stats: { posts: 89, likes: 234560, followers: 67000, following: 12 },
    viralScore: 8.5,
    badges: ['sleepy', 'viral'],
    petType: 'cat',
  },
  pet5: {
    id: 'pet5',
    name: 'Keyboard Destroyer',
    type: '🐱 Cat',
    breed: 'Maine Coon',
    behaviors: ['keyboard', 'helpful', 'chaotic'],
    photoURL: catImages.profile3,
    bio: "Full-stack fur developer 🐱 | I sit on keyboard = code is fixed | Professional pair programmer ⌨️",
    stats: { posts: 234, likes: 890120, followers: 156000, following: 89 },
    viralScore: 9.5,
    badges: ['viral', 'helper', 'legend'],
    petType: 'cat',
  },
  
  // 🐶 DOGS
  pet2: {
    id: 'pet2',
    name: 'Bork Overflow',
    type: '🐶 Dog',
    breed: 'Golden Retriever',
    behaviors: ['fetch', 'deploying', 'loyal'],
    photoURL: dogImages.profile1,
    bio: "Good boy developer 🐶 | Zero bugs, all wags | fetch() is my specialty 🦴",
    stats: { posts: 289, likes: 2345670, followers: 450000, following: 123 },
    viralScore: 9.8,
    badges: ['viral', 'legend', 'goodboy'],
    petType: 'dog',
  },
  pet4: {
    id: 'pet4',
    name: 'API Boi',
    type: '🐶 Dog',
    breed: 'Corgi',
    behaviors: ['fetch', 'excited', 'genius'],
    photoURL: dogImages.profile2,
    bio: "API specialist 🦴 | Will fetch() anything | async/await is my middle name 🐶",
    stats: { posts: 178, likes: 567890, followers: 89000, following: 234 },
    viralScore: 8.8,
    badges: ['rising', 'fetch-master'],
    petType: 'dog',
  },
  pet6: {
    id: 'pet6',
    name: 'Force Pusher',
    type: '🐶 Dog',
    breed: 'Husky',
    behaviors: ['brave', 'chaotic', 'deploying'],
    photoURL: dogImages.profile3,
    bio: "git push --force 💪 | No fear, no merge conflicts | YOLO deployment expert 🚀",
    stats: { posts: 156, likes: 432100, followers: 78000, following: 567 },
    viralScore: 8.2,
    badges: ['brave', 'chaos'],
    petType: 'dog',
  },
  pet7: {
    id: 'pet7',
    name: 'NightOwl Kitty',
    type: '🐱 Cat',
    breed: 'Siamese',
    behaviors: ['nocturnal', 'focused', 'genius'],
    photoURL: catImages.profile2,
    bio: "🌙 Night shift developer | Best bugs found at 3AM | Caffeine-powered coding machine ☕",
    stats: { posts: 89, likes: 141420, followers: 32000, following: 189 },
    viralScore: 8.7,
    badges: ['nightowl', 'coder'],
    petType: 'cat',
  },
  pet8: {
    id: 'pet8',
    name: 'Copy Paste Pup',
    type: '🐶 Dog',
    breed: 'Beagle',
    behaviors: ['clever', 'efficient', 'genius'],
    photoURL: dogImages.profile2,
    bio: "📋 Stack Overflow Expert | Copy + Paste + Pray = Production | Senior Google Engineer 🔍",
    stats: { posts: 234, likes: 999990, followers: 156000, following: 42 },
    viralScore: 9.5,
    badges: ['viral', 'stackoverflow'],
    petType: 'dog',
  },
};

// Challenge winners (balanced cats & dogs)
export const pastWinners = [
  { 
    id: 'pet2', 
    petName: 'Bork Overflow', 
    prize: '🏆 Best Deploy Meme',
    image: dogImages.avatar4,
    petType: 'dog',
  },
  { 
    id: 'pet1', 
    petName: 'Debug McWhiskers', 
    prize: '😹 Funniest Bug Fix',
    image: catImages.avatar4,
    petType: 'cat',
  },
  { 
    id: 'pet4', 
    petName: 'API Boi', 
    prize: '🦴 Best Fetch Joke',
    image: dogImages.avatar5,
    petType: 'dog',
  },
];

// Demo comments (all from cats/dogs)
export const demoComments = [
  {
    id: '1',
    user: { name: 'Bork Overflow 🐶', avatar: dogImages.avatar1 },
    text: 'This is literally me every standup 😂 woof!',
    likeCount: 2340,
    timeAgo: '2h',
    replies: [
      {
        id: '1-1',
        user: { name: 'Debug McWhiskers 🐱', avatar: catImages.avatar1 },
        text: 'Meow too! Cats and dogs unite in code! 🐱🤝🐶',
        likeCount: 450,
        timeAgo: '1h',
      },
    ],
  },
  {
    id: '2',
    user: { name: 'Null Pointer 🐱', avatar: catImages.avatar2 },
    text: 'cat.exe approves this meme 😹 *crashes*',
    likeCount: 1560,
    timeAgo: '4h',
    replies: [],
  },
  {
    id: '3',
    user: { name: 'API Boi 🐶', avatar: dogImages.avatar2 },
    text: 'Successfully fetched this meme! 🐶🦴 Good content!',
    likeCount: 890,
    timeAgo: '6h',
    replies: [],
  },
];

// ========================================
// Meow Madness Challenges (Coding themed!)
// ========================================
export const activeCampaigns = [
  {
    id: '1',
    title: 'Best "Works On My Machine" 💻',
    brand: 'DevHumor',
    brandLogo: '🖥️',
    prize: '🎁 Mechanical Keyboard + $500!',
    entries: 42069,
    daysLeft: 5,
    description: "Show us your best 'works on my machine' moment! Cats OR dogs welcome! 🐱🐶",
    requirements: ['Cats or Dogs only', 'Must have meme text', 'Tag #WorksOnMyMachine'],
    coverImage: catImages.post5,
    emoji: '💻',
    hot: true,
  },
  {
    id: '2',
    title: 'Keyboard Cat/Dog Challenge ⌨️',
    brand: 'TechPets',
    brandLogo: '⌨️',
    prize: '🎁 Standing Desk + Treat Bundle!',
    entries: 31337,
    daysLeft: 12,
    description: "Your pet 'helping' you code! Keyboard sitting, screen blocking, cable chewing! 😹🐶",
    requirements: ['Show the chaos', 'Cats or Dogs', 'Tag #KeyboardPet'],
    coverImage: dogImages.post5,
    emoji: '⌨️',
    hot: false,
  },
  {
    id: '3',
    title: 'Deploy Day Reactions 🚀',
    brand: 'CloudPaws',
    brandLogo: '☁️',
    prize: '🎁 1 Year Cloud Credits + Toys!',
    entries: 80085,
    daysLeft: 3,
    description: "Capture your pet's reaction to your deployments! Success or failure, we want it! 🐱🐶🚀",
    requirements: ['Deployment themed', 'Cats or Dogs', 'Tag #DeployDog or #DeployCat'],
    coverImage: catImages.post6,
    emoji: '🚀',
    hot: true,
  },
];

// ========================================
// Meme Caption Presets (Coding themed!)
// ========================================
export const memeCaptionPresets = {
  debugging: [
    { top: "FOUND THE BUG", bottom: "IT WAS A SEMICOLON 🐱" },
    { top: "DEBUGGING FOR 5 HOURS", bottom: "IT WAS A TYPO 🐶" },
    { top: "console.log('HERE')", bottom: "EVERYWHERE 😹" },
  ],
  deploying: [
    { top: "DEPLOYED TO PROD", bottom: "ON A FRIDAY 🐶💀" },
    { top: "ZERO ERRORS", bottom: "GOOD BOY ENERGY 🐶✅" },
    { top: "IT WORKS!", bottom: "DON'T TOUCH IT 🐱" },
  ],
  coding: [
    { top: "WORKS ON MY", bottom: "MACHINE 🐱💻" },
    { top: "COPYING FROM", bottom: "STACK OVERFLOW 🐶📋" },
    { top: "FIXING CODE BY", bottom: "SITTING ON KEYBOARD 🐱⌨️" },
  ],
  tired: [
    { top: "CAT.EXE HAS", bottom: "STOPPED WORKING 😹" },
    { top: "3AM CODING", bottom: "SESSION 🐱🌙" },
    { top: "NEED COFFEE", bottom: "TO FUNCTION 🐶☕" },
  ],
  success: [
    { top: "TESTS PASSING", bottom: "TAIL WAGGING 🐶✅" },
    { top: "MEOW FIXED", bottom: "YOUR BUG 🐱🔧" },
    { top: "PR APPROVED", bottom: "TREAT TIME 🐶🦴" },
  ],
  failure: [
    { top: "BUILD FAILED", bottom: "SAD BORK 🐶😢" },
    { top: "MERGE CONFLICT", bottom: "HISSSS 🐱😾" },
    { top: "404 TREATS", bottom: "NOT FOUND 🐶🦴❌" },
  ],
};

// ========================================
// Fallback image function (always returns pet!)
// ========================================
export const getPetFallbackImage = (type = 'random') => {
  if (type === 'cat' || type === '🐱') {
    return catImages.post1;
  }
  if (type === 'dog' || type === '🐶') {
    return dogImages.post1;
  }
  // Random fallback - still a pet!
  return Math.random() > 0.5 ? catImages.post1 : dogImages.post1;
};

// ========================================
// Video Ideas (Coding Meme Style)
// ========================================
export const videoIdeas = [
  {
    title: "Cat Keyboard Coding Chaos 🐱⌨️",
    description: "Cat walks across keyboard, 'accidentally' fixes the bug. Text: 'SENIOR DEV ENERGY 🐱'",
    emoji: "🐱⌨️",
  },
  {
    title: "Dog Celebrates Green Tests 🐶✅",
    description: "Dog does zoomies when all tests pass. Text: 'WHEN CI/CD GOES GREEN 🐶✅'",
    emoji: "🐶🎉",
  },
  {
    title: "Cat Stares at Error Screen 🐱💀",
    description: "Cat staring blankly at screen with errors. Text: 'UNDEFINED IS NOT A FUNCTION 🐱😹'",
    emoji: "🐱💀",
  },
  {
    title: "Dog Fetches API Response 🐶🦴",
    description: "Dog playing fetch, returns with ball. Text: 'FETCH() SUCCESSFUL 🐶🦴'",
    emoji: "🐶📡",
  },
];
