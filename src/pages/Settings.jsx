import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { reliableImages } from '../data/demoData';
import {
  User, Moon, Sun, Globe, Bell, Shield, HelpCircle,
  LogOut, ChevronRight, Camera, Languages, X, Check,
  Edit3, Trash2, Loader2
} from 'lucide-react';

// Behavior options
const behaviorOptions = [
  { id: 'zoomies', emoji: '💨', label: 'Zoomies' },
  { id: 'lazy', emoji: '😴', label: 'Lazy' },
  { id: 'dramatic', emoji: '🎭', label: 'Dramatic' },
  { id: 'foodie', emoji: '🍗', label: 'Foodie' },
  { id: 'derpy', emoji: '🤪', label: 'Derpy' },
  { id: 'cuddly', emoji: '🤗', label: 'Cuddly' },
  { id: 'genius', emoji: '🧠', label: 'Too Smart' },
  { id: 'clingy', emoji: '🥺', label: 'Velcro Pet' },
  { id: 'destroyer', emoji: '💥', label: 'Destroyer' },
  { id: 'vocal', emoji: '🗣️', label: 'Vocal' },
  { id: 'scared', emoji: '😱', label: 'Easily Scared' },
  { id: 'jealous', emoji: '😤', label: 'Jealous' },
];

// Pet type options (matches Onboarding format)
const petTypes = [
  { id: 'dog', emoji: '🐕', label: 'Dog', legacyFormat: '🐕 Dog' },
  { id: 'cat', emoji: '🐱', label: 'Cat', legacyFormat: '🐈 Cat' },
  { id: 'bird', emoji: '🐦', label: 'Bird', legacyFormat: '🦜 Bird' },
  { id: 'hamster', emoji: '🐹', label: 'Hamster', legacyFormat: '🐹 Hamster' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit', legacyFormat: '🐰 Rabbit' },
  { id: 'fish', emoji: '🐠', label: 'Fish', legacyFormat: '🐠 Fish' },
  { id: 'turtle', emoji: '🐢', label: 'Turtle', legacyFormat: '🐢 Turtle' },
  { id: 'reptile', emoji: '🦎', label: 'Reptile', legacyFormat: '🦎 Reptile' },
  { id: 'other', emoji: '🐾', label: 'Other', legacyFormat: '🐾 Other' },
];

// Helper to normalize pet type from various formats
const normalizePetType = (type) => {
  if (!type) return 'dog';
  // If it's already a simple id
  const foundById = petTypes.find(pt => pt.id === type);
  if (foundById) return foundById.id;
  // If it's legacy format like "🐕 Dog"
  const foundByLegacy = petTypes.find(pt => pt.legacyFormat === type);
  if (foundByLegacy) return foundByLegacy.id;
  // If it contains the label (case insensitive)
  const foundByLabel = petTypes.find(pt => 
    type.toLowerCase().includes(pt.label.toLowerCase())
  );
  if (foundByLabel) return foundByLabel.id;
  return 'other';
};

export default function Settings() {
  const { user, pet, setPet, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode, language, setLanguage, showToast } = useUIStore();
  const navigate = useNavigate();
  
  const [showLanguages, setShowLanguages] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit profile state - properly normalize pet type from Firestore data
  const [editData, setEditData] = useState({
    name: pet?.name || 'Your Pet',
    type: normalizePetType(pet?.type || pet?.petType),
    breed: pet?.breed || '',
    bio: pet?.bio || '',
    behaviors: Array.isArray(pet?.behaviors) ? pet.behaviors : [],
  });
  
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/login');
      showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails (not configured), clear local state
      logout();
      navigate('/login');
      showToast('Logged out successfully', 'info');
    }
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file); // Store file for upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewPhoto(e.target.result);
        setShowPhotoOptions(false);
        showToast('Photo updated! Changes will be saved when you save profile.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = () => {
    setPreviewPhoto(null);
    setPet({ ...pet, photoURL: null });
    setShowPhotoOptions(false);
    showToast('Photo removed', 'info');
  };
  
  const handleSaveProfile = async () => {
    if (!user?.uid) {
      showToast('Please log in to save changes', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      let photoURL = pet?.photoURL;
      
      // Upload new photo if changed
      if (photoFile) {
        const photoRef = ref(storage, `pets/${user.uid}/${Date.now()}_${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }
      
      // Get the full pet type format for storage
      const selectedPetType = petTypes.find(pt => pt.id === editData.type);
      const petTypeForStorage = selectedPetType?.legacyFormat || editData.type;
      
      // Build update data
      const updateData = {
        name: editData.name.trim(),
        type: petTypeForStorage,
        breed: editData.breed.trim() || null,
        bio: editData.bio.trim() || null,
        behaviors: editData.behaviors,
        photoURL: photoURL,
      };
      
      // Update Firestore
      const petRef = doc(db, 'pets', user.uid);
      await updateDoc(petRef, updateData);
      
      // Update local state
      setPet({
        ...pet,
        ...updateData,
      });
      
      setPhotoFile(null);
      setShowEditProfile(false);
      showToast('Profile updated successfully! 🎉', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleBehavior = (behaviorId) => {
    setEditData(prev => {
      const currentBehaviors = Array.isArray(prev.behaviors) ? prev.behaviors : [];
      const isSelected = currentBehaviors.includes(behaviorId);
      
      return {
        ...prev,
        behaviors: isSelected
          ? currentBehaviors.filter(b => b !== behaviorId)
          : [...currentBehaviors, behaviorId],
      };
    });
  };
  
  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];
  
  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          description: 'Update your pet\'s info',
          action: () => {
            setEditData({
              name: pet?.name || 'Your Pet',
              type: normalizePetType(pet?.type || pet?.petType),
              breed: pet?.breed || '',
              bio: pet?.bio || '',
              behaviors: Array.isArray(pet?.behaviors) ? pet.behaviors : [],
            });
            setPreviewPhoto(null);
            setPhotoFile(null);
            setShowEditProfile(true);
          },
        },
        {
          icon: Camera,
          label: 'Change Pet Photo',
          description: 'Update profile picture',
          action: () => setShowPhotoOptions(true),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDarkMode ? Moon : Sun,
          label: 'Dark Mode',
          description: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
          action: toggleDarkMode,
          isToggle: true,
          toggleValue: isDarkMode,
        },
        {
          icon: Globe,
          label: 'Language',
          description: languages.find(l => l.code === language)?.label || 'English',
          action: () => setShowLanguages(true),
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage push notifications',
          action: () => showToast('Notifications settings coming soon!', 'info'),
        },
      ],
    },
    {
      title: 'Privacy & Safety',
      items: [
        {
          icon: Shield,
          label: 'Privacy Settings',
          description: 'Control your data',
          action: () => showToast('Privacy settings coming soon!', 'info'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          description: 'FAQs and support',
          action: () => showToast('Help center coming soon!', 'info'),
        },
      ],
    },
  ];
  
  const currentPhoto = previewPhoto || pet?.photoURL || reliableImages.profile1;
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/80 dark:bg-petmeme-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <h1 className="font-heading text-2xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
          Settings
        </h1>
      </header>
      
      {/* User info card */}
      <div className="p-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="relative">
            <img
              src={currentPhoto}
              alt={pet?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
              onError={(e) => {
                // Pet-only fallback! 🐱🐶
                e.target.src = pet?.type?.includes('Dog') 
                  ? 'https://placedog.net/100/100?id=settings' 
                  : 'https://cataas.com/cat?width=100&height=100&t=settings';
              }}
            />
            <button
              onClick={() => setShowPhotoOptions(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
              {pet?.name || 'Your Pet'}
            </h2>
            <p className="text-sm text-petmeme-muted">
              {user?.email || 'Demo Mode'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditData({
                name: pet?.name || 'Your Pet',
                type: normalizePetType(pet?.type || pet?.petType),
                breed: pet?.breed || '',
                bio: pet?.bio || '',
                behaviors: Array.isArray(pet?.behaviors) ? pet.behaviors : [],
              });
              setPreviewPhoto(null);
              setPhotoFile(null);
              setShowEditProfile(true);
            }}
            className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Settings sections */}
      <div className="px-4 space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-petmeme-muted uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h3>
            <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-petmeme-text dark:text-petmeme-text-dark">
                      {item.label}
                    </p>
                    <p className="text-sm text-petmeme-muted">
                      {item.description}
                    </p>
                  </div>
                  {item.isToggle ? (
                    <div className={`w-12 h-7 rounded-full transition-colors ${
                      item.toggleValue ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <motion.div
                        animate={{ x: item.toggleValue ? 20 : 2 }}
                        className="w-6 h-6 rounded-full bg-white shadow mt-0.5"
                      />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-petmeme-muted" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full card flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>
        
        {/* App version */}
        <p className="text-center text-sm text-petmeme-muted py-4">
          PetMeme Hub v1.0.0
        </p>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />
      
      {/* Photo options modal */}
      <AnimatePresence>
        {showPhotoOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowPhotoOptions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-petmeme-card-dark rounded-t-3xl p-6"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              
              <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Change Pet Photo
              </h2>
              
              {/* Current photo preview */}
              <div className="flex justify-center mb-6">
                <img
                  src={currentPhoto}
                  alt="Current photo"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                  onError={(e) => {
                    // Pet-only fallback! 🐱🐶
                    e.target.src = editData.type === 'dog' 
                      ? 'https://placedog.net/200/200?id=edit' 
                      : 'https://cataas.com/cat?width=200&height=200&t=edit';
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <Camera className="w-6 h-6 text-primary-500" />
                  <span className="font-medium text-petmeme-text dark:text-petmeme-text-dark">
                    Upload New Photo
                  </span>
                </button>
                
                {(previewPhoto || pet?.photoURL) && (
                  <button
                    onClick={handleRemovePhoto}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-6 h-6 text-red-500" />
                    <span className="font-medium text-red-500">
                      Remove Photo
                    </span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowPhotoOptions(false)}
                  className="w-full p-4 text-petmeme-muted hover:text-petmeme-text dark:hover:text-petmeme-text-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Profile modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-petmeme-card-dark rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-petmeme-card-dark border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                  Edit Profile
                </h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Photo */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowEditProfile(false);
                      setShowPhotoOptions(true);
                    }}
                    className="relative group"
                  >
                    <img
                      src={currentPhoto}
                      alt="Pet photo"
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 group-hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        // Pet-only fallback! 🐱🐶
                        e.target.src = editData.type === 'dog' 
                          ? 'https://placedog.net/200/200?id=photo' 
                          : 'https://cataas.com/cat?width=200&height=200&t=photo';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </button>
                </div>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Pet Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="input-field"
                    placeholder="What's your pet's name?"
                  />
                </div>
                
                {/* Pet Type */}
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Pet Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {petTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setEditData({ ...editData, type: type.id })}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          editData.type === type.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                      >
                        <span className="mr-2">{type.emoji}</span>
                        <span className="text-petmeme-text dark:text-petmeme-text-dark">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Breed */}
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={editData.breed}
                    onChange={(e) => setEditData({ ...editData, breed: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Golden Retriever, Persian Cat..."
                  />
                </div>
                
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Tell us about your pet's personality..."
                    maxLength={150}
                  />
                  <p className="text-xs text-petmeme-muted mt-1 text-right">
                    {editData.bio.length}/150
                  </p>
                </div>
                
                {/* Behaviors */}
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Personality Traits
                  </label>
                  <p className="text-xs text-petmeme-muted mb-3">
                    Select up to 5 that best describe your pet
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {behaviorOptions.map((behavior) => {
                      const behaviors = Array.isArray(editData.behaviors) ? editData.behaviors : [];
                      const isSelected = behaviors.includes(behavior.id);
                      const isMaxed = behaviors.length >= 5;
                      
                      return (
                        <button
                          key={behavior.id}
                          type="button"
                          onClick={() => toggleBehavior(behavior.id)}
                          disabled={!isSelected && isMaxed}
                          className={`badge-behavior transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-2 ring-primary-500/30'
                              : isMaxed
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:border-primary-400'
                          }`}
                        >
                          <span>{behavior.emoji}</span>
                          <span>{behavior.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-petmeme-card-dark border-t border-gray-100 dark:border-gray-800 p-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Language selector modal */}
      <AnimatePresence>
        {showLanguages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowLanguages(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-petmeme-card-dark rounded-t-3xl p-6"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              
              <h2 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Select Language
              </h2>
              
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguages(false);
                      showToast(`Language changed to ${lang.label}`, 'success');
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                      language === lang.code
                        ? 'bg-primary-100 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-petmeme-text dark:text-petmeme-text-dark">
                      {lang.label}
                    </span>
                    {language === lang.code && (
                      <span className="ml-auto text-primary-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
