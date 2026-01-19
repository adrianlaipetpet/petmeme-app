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
      ? 'https://www.rd.com/wp-content/uploads/2022/01/gettyimages-175274310-e1641875594224.jpg'
      : 'https://d3544la1u8djza.cloudfront.net/APHI/Blog/2021/09-24/American+Shorthair+kitten+ready+to+pounce-min.jpg';
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
