// Demo data with 100% reliable media URLs

// Sample short pet videos (using reliable CDN sources that work globally)
export const sampleVideos = {
  // These are sample video URLs that work - short clips
  dog1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  dog2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  cat1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
};

// Reliable placeholder images using picsum.photos (always works, random pet-like images)
export const reliableImages = {
  // Pet avatars (small)
  avatar1: 'https://picsum.photos/seed/pet1/100/100',
  avatar2: 'https://picsum.photos/seed/pet2/100/100',
  avatar3: 'https://picsum.photos/seed/pet3/100/100',
  avatar4: 'https://picsum.photos/seed/pet4/100/100',
  avatar5: 'https://picsum.photos/seed/pet5/100/100',
  avatar6: 'https://picsum.photos/seed/pet6/100/100',
  
  // Post images (medium)
  post1: 'https://picsum.photos/seed/cat1/600/600',
  post2: 'https://picsum.photos/seed/dog1/600/600',
  post3: 'https://picsum.photos/seed/cat2/600/600',
  post4: 'https://picsum.photos/seed/dog2/600/600',
  post5: 'https://picsum.photos/seed/cat3/600/600',
  post6: 'https://picsum.photos/seed/dog3/600/600',
  
  // Thumbnails for videos
  thumb1: 'https://picsum.photos/seed/vidthumb1/600/600',
  thumb2: 'https://picsum.photos/seed/vidthumb2/600/600',
  thumb3: 'https://picsum.photos/seed/vidthumb3/600/600',
  
  // Profile photos (large)
  profile1: 'https://picsum.photos/seed/profile1/400/400',
  profile2: 'https://picsum.photos/seed/profile2/400/400',
  profile3: 'https://picsum.photos/seed/profile3/400/400',
  profile4: 'https://picsum.photos/seed/profile4/400/400',
  profile5: 'https://picsum.photos/seed/profile5/400/400',
  profile6: 'https://picsum.photos/seed/profile6/400/400',
  
  // Breed images
  breed1: 'https://picsum.photos/seed/breed1/200/200',
  breed2: 'https://picsum.photos/seed/breed2/200/200',
  breed3: 'https://picsum.photos/seed/breed3/200/200',
  breed4: 'https://picsum.photos/seed/breed4/200/200',
  breed5: 'https://picsum.photos/seed/breed5/200/200',
  breed6: 'https://picsum.photos/seed/breed6/200/200',
  
  // Campaign images
  campaign1: 'https://picsum.photos/seed/campaign1/600/400',
  campaign2: 'https://picsum.photos/seed/campaign2/600/400',
  campaign3: 'https://picsum.photos/seed/campaign3/600/400',
  
  // Winner avatars
  winner1: 'https://picsum.photos/seed/winner1/200/200',
  winner2: 'https://picsum.photos/seed/winner2/200/200',
  winner3: 'https://picsum.photos/seed/winner3/200/200',
};

// Demo posts with working media
export const demoPosts = [
  {
    id: '1',
    type: 'image',
    mediaUrl: reliableImages.post1,
    caption: "When mom says 'treat' but she's just testing you 😤",
    pet: { 
      id: 'pet1',
      name: 'Whiskers', 
      breed: 'Orange Tabby', 
      photoUrl: reliableImages.avatar1,
    },
    behaviors: ['dramatic', 'foodie'],
    hashtags: ['catfails', 'dramaticpets'],
    likeCount: 2847,
    commentCount: 156,
    shareCount: 89,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  {
    id: '2',
    type: 'video',
    mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: reliableImages.thumb1,
    caption: "The zoomies hit different at 3am 💨",
    pet: { 
      id: 'pet2',
      name: 'Max', 
      breed: 'Golden Retriever', 
      photoUrl: reliableImages.avatar2,
    },
    behaviors: ['zoomies', 'derpy'],
    hashtags: ['zoomies', 'dogoftheday'],
    likeCount: 15420,
    commentCount: 892,
    shareCount: 2341,
    isLiked: true,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  {
    id: '3',
    type: 'image',
    mediaUrl: reliableImages.post2,
    caption: "Professional napper reporting for duty 😴💤",
    pet: { 
      id: 'pet3',
      name: 'Bella', 
      breed: 'Beagle', 
      photoUrl: reliableImages.avatar3,
    },
    behaviors: ['lazy', 'cuddly'],
    hashtags: ['sleepypets', 'dogoftheday'],
    likeCount: 4521,
    commentCount: 234,
    shareCount: 156,
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date(),
    isBrandPost: false,
  },
  {
    id: '4',
    type: 'image',
    mediaUrl: reliableImages.post3,
    caption: "Rate my Halloween costume 🎃👻",
    pet: { 
      id: 'pet4',
      name: 'Luna', 
      breed: 'Persian', 
      photoUrl: reliableImages.avatar4,
    },
    behaviors: ['dramatic', 'clingy'],
    hashtags: ['petcostumes', 'catfails'],
    likeCount: 8934,
    commentCount: 445,
    shareCount: 678,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: true,
    brandInfo: {
      name: 'PetCo',
      link: 'https://petco.com/costumes',
    },
  },
  {
    id: '5',
    type: 'video',
    mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: reliableImages.thumb2,
    caption: "When you realize it's Monday tomorrow 😱",
    pet: { 
      id: 'pet5',
      name: 'Mochi', 
      breed: 'Shiba Inu', 
      photoUrl: reliableImages.avatar5,
    },
    behaviors: ['dramatic', 'scared'],
    hashtags: ['dramaticpets', 'dogoftheday'],
    likeCount: 12567,
    commentCount: 678,
    shareCount: 1234,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
  {
    id: '6',
    type: 'image',
    mediaUrl: reliableImages.post4,
    caption: "Just vibing ✨ #sleepypets",
    pet: { 
      id: 'pet6',
      name: 'Shadow', 
      breed: 'Maine Coon', 
      photoUrl: reliableImages.avatar6,
    },
    behaviors: ['lazy', 'cuddly'],
    hashtags: ['sleepypets', 'catfails'],
    likeCount: 5678,
    commentCount: 321,
    shareCount: 234,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(),
    isBrandPost: false,
  },
];

// Trending hashtags
export const trendingTags = [
  { tag: 'zoomies', count: 45200, emoji: '💨' },
  { tag: 'catfails', count: 38100, emoji: '😹' },
  { tag: 'dogoftheday', count: 29800, emoji: '🐕' },
  { tag: 'petcostumes', count: 21500, emoji: '👗' },
  { tag: 'sleepypets', count: 19200, emoji: '😴' },
  { tag: 'treattime', count: 17800, emoji: '🍗' },
  { tag: 'dramaticpets', count: 15600, emoji: '🎭' },
  { tag: 'petfriends', count: 12400, emoji: '🤝' },
];

// Popular breeds
export const popularBreeds = [
  { breed: 'Golden Retriever', type: 'dog', image: reliableImages.breed1, count: 125000 },
  { breed: 'Persian', type: 'cat', image: reliableImages.breed2, count: 98000 },
  { breed: 'Corgi', type: 'dog', image: reliableImages.breed3, count: 87000 },
  { breed: 'Shiba Inu', type: 'dog', image: reliableImages.breed4, count: 76000 },
  { breed: 'Maine Coon', type: 'cat', image: reliableImages.breed5, count: 65000 },
  { breed: 'Beagle', type: 'dog', image: reliableImages.breed6, count: 54000 },
];

// Demo pet profiles
export const demoProfiles = {
  pet1: {
    id: 'pet1',
    name: 'Whiskers',
    type: '🐈 Cat',
    breed: 'Orange Tabby',
    behaviors: ['dramatic', 'foodie', 'lazy'],
    photoURL: reliableImages.profile1,
    bio: 'Professional napper & treat enthusiast 🍗 | Drama is my middle name 🎭',
    stats: { posts: 47, likes: 51112, followers: 12500, following: 342 },
  },
  pet2: {
    id: 'pet2',
    name: 'Max',
    type: '🐕 Dog',
    breed: 'Golden Retriever',
    behaviors: ['zoomies', 'derpy', 'cuddly'],
    photoURL: reliableImages.profile2,
    bio: 'Good boy extraordinaire 🏆 | Ball is life ⚾',
    stats: { posts: 89, likes: 234567, followers: 45000, following: 123 },
  },
  pet3: {
    id: 'pet3',
    name: 'Bella',
    type: '🐕 Dog',
    breed: 'Beagle',
    behaviors: ['lazy', 'cuddly', 'foodie'],
    photoURL: reliableImages.profile3,
    bio: 'Sniffing everything since 2020 👃 | Nap champion 🏆',
    stats: { posts: 34, likes: 12345, followers: 5600, following: 890 },
  },
  pet4: {
    id: 'pet4',
    name: 'Luna',
    type: '🐈 Cat',
    breed: 'Persian',
    behaviors: ['dramatic', 'clingy', 'lazy'],
    photoURL: reliableImages.profile4,
    bio: 'Fluffiest in the land ☁️ | Your personal judge 👀',
    stats: { posts: 156, likes: 89012, followers: 23400, following: 45 },
  },
  pet5: {
    id: 'pet5',
    name: 'Mochi',
    type: '🐕 Dog',
    breed: 'Shiba Inu',
    behaviors: ['dramatic', 'scared', 'derpy'],
    photoURL: reliableImages.profile5,
    bio: 'Much wow, very floof 🐕 | Professional side-eye giver',
    stats: { posts: 78, likes: 156789, followers: 34500, following: 234 },
  },
  pet6: {
    id: 'pet6',
    name: 'Shadow',
    type: '🐈 Cat',
    breed: 'Maine Coon',
    behaviors: ['lazy', 'cuddly', 'genius'],
    photoURL: reliableImages.profile6,
    bio: 'Giant fluffball 🦁 | Plotting world domination 🌍',
    stats: { posts: 23, likes: 45678, followers: 8900, following: 567 },
  },
};

// Campaign winners with profile links
export const pastWinners = [
  { 
    id: 'pet2', 
    petName: 'Max', 
    prize: 'Chewy Gift Card Winner',
    image: reliableImages.winner1,
  },
  { 
    id: 'pet4', 
    petName: 'Luna', 
    prize: 'PetSmart Shopping Spree',
    image: reliableImages.winner2,
  },
  { 
    id: 'pet5', 
    petName: 'Mochi', 
    prize: 'BarkBox 1-Year',
    image: reliableImages.winner3,
  },
];

// Demo comments with reliable avatars
export const demoComments = [
  {
    id: '1',
    user: { name: 'Max', avatar: reliableImages.avatar2 },
    text: 'This is literally me every morning 😂',
    likeCount: 234,
    timeAgo: '2h',
    replies: [
      {
        id: '1-1',
        user: { name: 'Whiskers', avatar: reliableImages.avatar1 },
        text: 'Same energy! 🙀',
        likeCount: 45,
        timeAgo: '1h',
      },
    ],
  },
  {
    id: '2',
    user: { name: 'Luna', avatar: reliableImages.avatar4 },
    text: 'The drama is REAL 🎭👑',
    likeCount: 156,
    timeAgo: '4h',
    replies: [],
  },
  {
    id: '3',
    user: { name: 'Mochi', avatar: reliableImages.avatar5 },
    text: 'Petition for more content like this! 🐾',
    likeCount: 89,
    timeAgo: '6h',
    replies: [],
  },
];

// Campaign data with reliable images
export const activeCampaigns = [
  {
    id: '1',
    title: 'Funniest Dog Fail 🐕💥',
    brand: 'Chewy',
    brandLogo: '🐾',
    prize: 'Win $500 Chewy Gift Card + Free Treats Bundle',
    entries: 2847,
    daysLeft: 5,
    description: 'Show us your dog\'s most hilarious fail moment! Bonus points for dramatic flops.',
    requirements: ['Must feature a dog', 'Original content only', 'Tag #ChewyChaos'],
    coverImage: reliableImages.campaign1,
  },
  {
    id: '2',
    title: 'Cat Costume Contest 🎃',
    brand: 'PetSmart',
    brandLogo: '🏪',
    prize: 'Win Premium Cat Tree + $200 Shopping Spree',
    entries: 1523,
    daysLeft: 12,
    description: 'Dress up your cat in the most creative costume! Halloween or any theme welcome.',
    requirements: ['Cat must be wearing costume', 'Safe costumes only', 'Tag #PetSmartCostume'],
    coverImage: reliableImages.campaign2,
  },
  {
    id: '3',
    title: 'Ultimate Zoomies Challenge 💨',
    brand: 'BarkBox',
    brandLogo: '📦',
    prize: '6-Month BarkBox Subscription + Feature on our Instagram',
    entries: 4521,
    daysLeft: 3,
    description: 'Capture those crazy zoomies! Most chaotic energy wins.',
    requirements: ['Video preferred', 'Any pet welcome', 'Tag #BarkBoxZoomies'],
    coverImage: reliableImages.campaign3,
  },
];
