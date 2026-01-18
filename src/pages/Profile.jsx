import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useFeedStore } from '../store/feedStore';
import { demoPosts, demoProfiles, reliableImages } from '../data/demoData';
import {
  Settings, Grid, Heart, Users, Play,
  Award, Share2, MoreHorizontal, Trash2, Repeat2
} from 'lucide-react';

// 🐱🐶 Coding-themed behavior emoji map (cats & dogs only!)
const behaviorEmojis = {
  debugging: '🔍',
  deploying: '🚀',
  keyboard: '⌨️',
  crashed: '💤',
  fetch: '🦴',
  judging: '👀',
  genius: '🧠',
  chaos: '💥',
  nocturnal: '🌙',
  loyal: '🐶',
  hardworking: '💪',
  helpful: '🤝',
  chaotic: '😈',
  napping: '😴',
  dramatic: '🎭',
  lazy: '😴',
  foodie: '🍗',
  destroyer: '💥',
  derpy: '🤪',
  vocal: '🗣️',
  cuddly: '🤗',
  scared: '😱',
  zoomies: '💨',
  clingy: '🥺',
};

export default function Profile() {
  const { petId } = useParams();
  const { user, pet: currentUserPet } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [activeTab, setActiveTab] = useState('memes');
  const [petData, setPetData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [reposts, setReposts] = useState([]);
  const [loadingReposts, setLoadingReposts] = useState(false);
  
  const { loadUserPosts, deletePost, loadUserReposts, deleteRepost } = useFeedStore();
  const isOwnProfile = !petId || petId === user?.uid;
  
  useEffect(() => {
    loadProfile();
  }, [petId, user]);
  
  const loadProfile = async () => {
    setIsLoading(true);
    setIsDemo(false);
    
    try {
      const targetUserId = isOwnProfile ? user?.uid : petId;
      
      // Try to load real pet data from Firestore
      let realPetData = null;
      let realPosts = [];
      
      if (targetUserId) {
        try {
          // Fetch pet data from Firestore
          const petDoc = await getDoc(doc(db, 'pets', targetUserId));
          if (petDoc.exists()) {
            realPetData = { id: petDoc.id, ...petDoc.data() };
          }
          
          // Fetch user's posts from Firestore
          realPosts = await loadUserPosts(targetUserId);
        } catch (e) {
          console.log('Firestore not configured, using demo data');
        }
      }
      
      if (realPetData) {
        // Use real Firestore data
        setPetData({
          ...realPetData,
          stats: realPetData.stats || {
            posts: realPosts.length,
            likes: 0,
            followers: 0,
            following: 0,
          },
        });
        setPosts(realPosts);
      } else if (isOwnProfile && currentUserPet) {
        // Use current user's local pet data (from onboarding)
        setIsDemo(true);
        setPetData({
          ...currentUserPet,
          stats: currentUserPet.stats || {
            posts: demoPosts.length,
            likes: 51112,
            followers: 12500,
            following: 342,
          },
        });
        // Show demo posts for own profile in demo mode
        setPosts(demoPosts);
      } else if (petId && demoProfiles[petId]) {
        // Use demo profile data
        setIsDemo(true);
        const profile = demoProfiles[petId];
        setPetData(profile);
        // Get posts that belong to this pet
        const petPosts = demoPosts.filter(p => p.pet.id === petId);
        setPosts(petPosts.length > 0 ? petPosts : demoPosts.slice(0, 3));
      } else if (petId) {
        // Pet ID exists but not in demoProfiles - try to find from demoPosts
        setIsDemo(true);
        const postWithPet = demoPosts.find(p => p.pet.id === petId);
        
        if (postWithPet) {
          // Create profile from post's pet data
          const petFromPost = postWithPet.pet;
          setPetData({
            id: petFromPost.id,
            name: petFromPost.name,
            type: petFromPost.petType === 'dog' ? '🐶 Dog' : '🐱 Cat',
            breed: petFromPost.breed,
            behaviors: postWithPet.behaviors || [],
            photoURL: petFromPost.photoUrl,
            petType: petFromPost.petType,
            stats: {
              posts: demoPosts.filter(p => p.pet.id === petId).length,
              likes: Math.floor(Math.random() * 50000) + 10000,
              followers: Math.floor(Math.random() * 10000) + 1000,
              following: Math.floor(Math.random() * 500) + 50,
            },
            bio: `${petFromPost.name} loves making memes! 😹`,
          });
          const petPosts = demoPosts.filter(p => p.pet.id === petId);
          setPosts(petPosts.length > 0 ? petPosts : demoPosts.slice(0, 3));
        } else {
          // Ultimate fallback - first demo profile
          const firstProfile = Object.values(demoProfiles)[0];
          setPetData(firstProfile);
          setPosts(demoPosts);
        }
      } else {
        // No petId - show first demo profile
        setIsDemo(true);
        const firstProfile = Object.values(demoProfiles)[0];
        setPetData(firstProfile || {
          name: 'Whiskers',
          type: '🐈 Cat',
          breed: 'Orange Tabby',
          behaviors: ['dramatic', 'foodie', 'lazy'],
          photoURL: reliableImages.profile1,
          stats: {
            posts: 47,
            likes: 51112,
            followers: 12500,
            following: 342,
          },
          bio: 'Professional napper & treat enthusiast 🍗 | Drama is my middle name 🎭',
        });
        setPosts(demoPosts);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to demo on error
      setIsDemo(true);
      setPetData({
        name: 'Whiskers',
        type: '🐈 Cat',
        breed: 'Orange Tabby',
        behaviors: ['dramatic', 'foodie', 'lazy'],
        photoURL: reliableImages.profile1,
        stats: {
          posts: 47,
          likes: 51112,
          followers: 12500,
          following: 342,
        },
        bio: 'Professional napper & treat enthusiast 🍗',
      });
      setPosts(demoPosts);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };
  
  const handleShare = async () => {
    const petType = petData?.petType === 'dog' ? '🐶' : '🐱';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petData?.name} ${petType} on Lmeow`,
          text: `Check out ${petData?.name}'s coding memes! 😹💻`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied! 🔗', 'success');
    }
  };
  
  const handleDeletePost = async (postId, e) => {
    e.preventDefault(); // Prevent navigation to post
    e.stopPropagation();
    
    if (showDeleteConfirm === postId) {
      // Second click - soft delete (keeps in Firebase for founder to view)
      setDeletingPostId(postId);
      const success = await deletePost(postId);
      
      if (success) {
        // Remove from local state
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast('Post deleted! 🗑️', 'success');
      } else {
        showToast('Failed to delete post', 'error');
      }
      
      setDeletingPostId(null);
      setShowDeleteConfirm(null);
    } else {
      // First click - show confirmation
      setShowDeleteConfirm(postId);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };
  
  // Load reposts when the Reposts tab is clicked
  const handleLoadReposts = async () => {
    const targetUserId = isOwnProfile ? user?.uid : petId;
    if (!targetUserId || loadingReposts) return;
    
    setLoadingReposts(true);
    const userReposts = await loadUserReposts(targetUserId);
    setReposts(userReposts);
    setLoadingReposts(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header with gradient background - Coding themed! 💻🐱🐶 */}
      <div className="relative h-48 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-coral">
        {/* Decorative coding patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-4 text-4xl">💻</div>
          <div className="absolute top-8 right-8 text-3xl">🐱</div>
          <div className="absolute bottom-12 left-1/4 text-2xl">⌨️</div>
          <div className="absolute top-12 right-1/3 text-2xl">🐶</div>
          <div className="absolute bottom-8 right-1/4 text-2xl">🚀</div>
        </div>
        
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwnProfile ? (
            <Link
              to="/settings"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30"
            >
              <Settings className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Profile content */}
      <div className="px-4 -mt-16 relative z-10">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={petData?.photoURL || reliableImages.profile1}
              alt={petData?.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-lmeow-bg-dark shadow-xl"
              onError={(e) => {
                // Pet-only fallback! 🐱🐶
                e.target.src = petData?.petType === 'dog' 
                  ? 'https://placedog.net/200/200?id=profile' 
                  : 'https://cataas.com/cat?width=200&height=200&t=profile';
              }}
            />
            
            {/* Pet type badge (cat or dog) 🐱🐶 */}
            <div className="absolute -top-1 -left-1 text-3xl">
              {petData?.petType === 'dog' ? '🐶' : '🐱'}
            </div>
            
            {/* Verified/Popular badge - 10x Developer! */}
            {petData?.stats?.followers > 10000 && (
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-accent-gold to-amber-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Award className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Pet name & breed - Coding style! 💻 */}
        <div className="text-center mt-4">
          <h1 className="font-heading text-3xl font-bold text-lmeow-text dark:text-lmeow-text-dark flex items-center justify-center gap-2">
            {petData?.name}
            {petData?.viralScore >= 9 && <span className="text-xl">🏆</span>}
          </h1>
          <p className="text-lmeow-muted mt-1 flex items-center justify-center gap-1">
            <span>{petData?.petType === 'dog' ? '🐶' : '🐱'}</span>
            {petData?.breed}
            <span className="mx-2">•</span>
            <span className="text-primary-500 font-medium">Dev Score: {petData?.viralScore || '8.5'}/10</span>
          </p>
        </div>
        
        {/* Behavior badges */}
        {petData?.behaviors && petData.behaviors.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {petData.behaviors.map((behavior) => (
              <Link
                key={behavior}
                to={`/browse/behavior/${encodeURIComponent(behavior)}`}
                className="badge-behavior flex items-center gap-1 hover:scale-105 transition-transform"
              >
                <span>{behaviorEmojis[behavior] || '🐾'}</span>
                <span className="capitalize">{behavior}</span>
              </Link>
            ))}
          </div>
        )}
        
        {/* Bio - Coding style */}
        {petData?.bio && (
          <p className="text-center text-lmeow-text dark:text-lmeow-text-dark mt-4 max-w-sm mx-auto bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl">
            💻 {petData.bio}
          </p>
        )}
        
        {/* Stats - Developer metrics 📊 */}
        <div className="flex justify-center gap-6 mt-6">
          <motion.div whileHover={{ scale: 1.1 }} className="text-center p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <p className="font-heading text-2xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              {formatCount(petData?.stats?.posts || posts.length)}
            </p>
            <p className="text-sm text-lmeow-muted">Memes 📸</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20">
            <p className="font-heading text-2xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              {formatCount(petData?.stats?.followers || 0)}
            </p>
            <p className="text-sm text-lmeow-muted">Fans 🐾</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center p-3 rounded-xl bg-accent-coral/10">
            <p className="font-heading text-2xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              {formatCount(petData?.stats?.likes || 0)}
            </p>
            <p className="text-sm text-lmeow-muted">Paws 🐾</p>
          </motion.div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 mt-6 max-w-xs mx-auto">
          {isOwnProfile ? (
            <>
              <Link to="/settings" className="btn-secondary flex-1 text-center">
                Edit Profile
              </Link>
              <button
                onClick={handleShare}
                className="btn-ghost px-4"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
              <button className="btn-ghost px-4">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-8">
          {[
            { id: 'memes', label: 'My Memes', icon: Grid },
            { id: 'reposts', label: 'Reposts', icon: Repeat2 },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'collabs', label: 'Collabs', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                // Load reposts when tab is clicked
                if (id === 'reposts') handleLoadReposts();
              }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-petmeme-muted hover:text-petmeme-text dark:hover:text-petmeme-text-dark'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        
        {/* Posts grid (Instagram-style) */}
        {activeTab === 'memes' && (
          <div className="grid grid-cols-3 gap-1 mt-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="relative aspect-square bg-gray-100 dark:bg-gray-800 group"
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
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = petData?.petType === 'dog' ? 'https://placedog.net/200/200?id=grid' : 'https://cataas.com/cat?width=200&height=200&t=grid';
                    }}
                  />
                )}
                
                {/* Meme text overlay on grid thumbnails */}
                {(post.memeText || post.textOverlay) && (
                  <div className={`absolute left-0 right-0 text-center px-1 pointer-events-none ${
                    post.memeText?.top ? 'top-1' :
                    post.memeText?.center ? 'top-1/2 -translate-y-1/2' :
                    'bottom-1'
                  }`}>
                    <p className="meme-text text-[10px] sm:text-xs font-black drop-shadow-lg line-clamp-2">
                      {post.memeText?.top || post.memeText?.center || post.memeText?.bottom || post.textOverlay}
                    </p>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Heart className="w-5 h-5" fill="white" />
                    {formatCount(post.likeCount)}
                  </div>
                  
                  {/* Delete button - only show on own profile */}
                  {isOwnProfile && !isDemo && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleDeletePost(post.id, e)}
                      disabled={deletingPostId === post.id}
                      className={`p-2 rounded-full transition-colors ${
                        showDeleteConfirm === post.id 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-red-500'
                      }`}
                      title={showDeleteConfirm === post.id ? 'Click again to confirm' : 'Delete post'}
                    >
                      {deletingPostId === post.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </motion.button>
                  )}
                </div>
                
                {/* Delete confirmation tooltip */}
                {showDeleteConfirm === post.id && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Tap again to delete
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
        
        {/* Reposts tab 🔄 */}
        {activeTab === 'reposts' && (
          <div className="mt-4">
            {loadingReposts ? (
              <div className="text-center py-12">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl inline-block"
                >
                  🔄
                </motion.div>
                <p className="text-petmeme-muted mt-2">Loading reposts...</p>
              </div>
            ) : reposts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {reposts.map((repost) => {
                  // Get the original post data for display
                  const displayData = repost.originalPost || repost;
                  
                  return (
                    <div
                      key={repost.id}
                      className="relative aspect-square bg-gray-100 dark:bg-gray-800 group"
                    >
                      <Link to={`/post/${repost.originalPostId || repost.id}`}>
                        <img
                          src={displayData.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = petData?.petType === 'dog' 
                              ? 'https://placedog.net/200/200?id=repost' 
                              : 'https://cataas.com/cat?width=200&height=200&t=repost';
                          }}
                        />
                      </Link>
                      
                      {/* Repost indicator badge */}
                      <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Repeat2 className="w-3 h-3" />
                      </div>
                      
                      {/* Unrepost button (only on own profile) */}
                      {isOwnProfile && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const result = await deleteRepost(repost.id, repost.originalPostId);
                            if (result.success) {
                              // Remove from local reposts state
                              setReposts(prev => prev.filter(r => r.id !== repost.id));
                              showToast('Unreposted! 🗑️', 'success');
                            } else {
                              showToast('Failed to unrepost', 'error');
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Unrepost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                      
                      {/* Meme text overlay preview */}
                      {(displayData.memeText || displayData.textOverlay) && (
                        <div className="absolute bottom-1 left-0 right-0 text-center px-1 pointer-events-none">
                          <p className="meme-text text-[10px] sm:text-xs font-black drop-shadow-lg line-clamp-2">
                            {displayData.memeText?.top || displayData.memeText?.center || displayData.memeText?.bottom || displayData.textOverlay}
                          </p>
                        </div>
                      )}
                      
                      {/* Hover overlay with original poster info */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2 pointer-events-none">
                        <span className="text-white text-xs font-medium">
                          Originally by
                        </span>
                        <span className="text-white text-sm font-bold">
                          {displayData.pet?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔄</div>
                <h3 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                  No reposts yet
                </h3>
                <p className="text-petmeme-muted mt-2">
                  Repost memes you love to share them with your followers!
                </p>
                <Link to="/" className="btn-primary inline-block mt-4">
                  Browse Feed
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div className="grid grid-cols-3 gap-1 mt-4">
            {demoPosts.filter(p => p.isBookmarked).length > 0 ? (
              demoPosts.filter(p => p.isBookmarked).map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="relative aspect-square bg-gray-100 dark:bg-gray-800 group"
                >
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = petData?.petType === 'dog' ? 'https://placedog.net/200/200?id=grid' : 'https://cataas.com/cat?width=200&height=200&t=grid';
                    }}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-5xl mb-4">❤️</div>
                <h3 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                  No favorites yet
                </h3>
                <p className="text-petmeme-muted mt-2">
                  Save your favorite memes to view them here!
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Empty state for collabs */}
        {activeTab === 'collabs' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
              No collaborations yet
            </h3>
            <p className="text-petmeme-muted mt-2">
              Join campaigns to collaborate with brands!
            </p>
            <Link to="/campaigns" className="btn-primary inline-block mt-4">
              Browse Campaigns
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
