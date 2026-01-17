import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Camera, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

// Pet data options
const petTypes = ['🐕 Dog', '🐈 Cat', '🐰 Rabbit', '🐹 Hamster', '🦜 Bird', '🐠 Fish', '🐢 Turtle', '🦎 Reptile', '🐾 Other'];

const dogBreeds = ['Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle', 'Husky', 'Corgi', 'Shiba Inu', 'Chihuahua', 'Dachshund', 'Pomeranian', 'Mixed/Unknown'];
const catBreeds = ['Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Siamese', 'Bengal', 'Abyssinian', 'Scottish Fold', 'Sphynx', 'Munchkin', 'Tabby', 'Tuxedo', 'Orange Tabby', 'Mixed/Unknown'];

const behaviors = [
  { id: 'zoomies', emoji: '💨', label: 'Gets the Zoomies' },
  { id: 'lazy', emoji: '😴', label: 'Professional Napper' },
  { id: 'dramatic', emoji: '🎭', label: 'Drama Queen/King' },
  { id: 'foodie', emoji: '🍗', label: 'Food Obsessed' },
  { id: 'destroyer', emoji: '💥', label: 'Chaos Agent' },
  { id: 'derpy', emoji: '🤪', label: 'Derpy & Clumsy' },
  { id: 'vocal', emoji: '🗣️', label: 'Very Talkative' },
  { id: 'cuddly', emoji: '🤗', label: 'Cuddle Monster' },
  { id: 'scared', emoji: '😱', label: 'Scaredy Cat/Pup' },
  { id: 'jealous', emoji: '😤', label: 'Gets Jealous' },
  { id: 'clingy', emoji: '🥺', label: 'Velcro Pet' },
  { id: 'genius', emoji: '🧠', label: 'Too Smart' },
];

const ownerPrefs = [
  { id: 'cat_fails', emoji: '😹', label: 'Cat Fails' },
  { id: 'dog_derps', emoji: '🐕', label: 'Dog Derps' },
  { id: 'costumes', emoji: '👗', label: 'Pets in Costumes' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy Pets' },
  { id: 'puppies', emoji: '🐶', label: 'Puppies & Kittens' },
  { id: 'tricks', emoji: '🎪', label: 'Pet Tricks' },
  { id: 'guilty', emoji: '😬', label: 'Guilty Pets' },
  { id: 'unlikely', emoji: '🤝', label: 'Unlikely Friends' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [petPhoto, setPetPhoto] = useState(null);
  const [petPhotoFile, setPetPhotoFile] = useState(null);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { user, setPet } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  
  const totalSteps = 4;
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPetPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };
  
  const toggleBehavior = (id) => {
    setSelectedBehaviors(prev => 
      prev.includes(id) 
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };
  
  const togglePref = (id) => {
    setSelectedPrefs(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };
  
  const getBreeds = () => {
    if (petType.includes('Dog')) return dogBreeds;
    if (petType.includes('Cat')) return catBreeds;
    return [];
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return petPhoto && petName.trim();
      case 2: return petType;
      case 3: return true; // Behaviors optional
      case 4: return true; // Prefs optional
      default: return false;
    }
  };
  
  const handleComplete = async () => {
    setLoading(true);
    try {
      let photoURL = '';
      
      // Upload photo to Firebase Storage
      if (petPhotoFile) {
        const photoRef = ref(storage, `pets/${user.uid}/${Date.now()}_${petPhotoFile.name}`);
        await uploadBytes(photoRef, petPhotoFile);
        photoURL = await getDownloadURL(photoRef);
      }
      
      // Create pet profile in Firestore
      const petData = {
        ownerId: user.uid,
        name: petName.trim(),
        type: petType,
        breed: breed || null,
        behaviors: selectedBehaviors,
        photoURL,
        createdAt: serverTimestamp(),
        stats: {
          posts: 0,
          likes: 0,
          followers: 0,
          following: 0,
        },
      };
      
      // Save owner preferences
      const ownerData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        preferences: selectedPrefs,
        createdAt: serverTimestamp(),
      };
      
      const petRef = doc(db, 'pets', user.uid);
      const userRef = doc(db, 'users', user.uid);
      
      await Promise.all([
        setDoc(petRef, petData),
        setDoc(userRef, ownerData),
      ]);
      
      // Update local state
      setPet({ ...petData, id: user.uid });
      
      showToast(`Welcome, ${petName}! 🎉`, 'success');
      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Progress bar */}
      <div className="p-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-primary-500' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-petmeme-muted mt-2">
          Step {step} of {totalSteps}
        </p>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-3xl font-bold text-gradient">
                  Meet Your Pet! 🐾
                </h2>
                <p className="text-petmeme-muted mt-2">
                  Let's create a profile for your furry friend
                </p>
              </div>
              
              {/* Photo upload */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${
                    petPhoto ? 'border-primary-400' : 'border-dashed border-gray-300'
                  } bg-white dark:bg-petmeme-card-dark flex items-center justify-center transition-all hover:border-primary-400`}>
                    {petPhoto ? (
                      <img src={petPhoto} alt="Pet" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-petmeme-muted">
                        <Camera className="w-10 h-10 mx-auto mb-2" />
                        <span className="text-sm">Add Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {petPhoto && (
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </label>
              </div>
              
              {/* Pet name */}
              <div>
                <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                  What's your pet's name?
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="e.g., Sir Fluffington III"
                  className="input-field text-center text-lg"
                  maxLength={30}
                />
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-3xl font-bold text-gradient">
                  What kind of pet?
                </h2>
                <p className="text-petmeme-muted mt-2">
                  We'll personalize your meme experience
                </p>
              </div>
              
              {/* Pet type */}
              <div className="grid grid-cols-3 gap-3">
                {petTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setPetType(type); setBreed(''); }}
                    className={`p-4 rounded-2xl text-center transition-all ${
                      petType === type 
                        ? 'bg-primary-500 text-white shadow-lg scale-105' 
                        : 'bg-white dark:bg-petmeme-card-dark hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.split(' ')[0]}</span>
                    <span className="text-xs font-medium">{type.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
              
              {/* Breed (if dog or cat) */}
              {getBreeds().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                    Breed (optional)
                  </label>
                  <select
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select breed...</option>
                    {getBreeds().map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-3xl font-bold text-gradient">
                  Pet Personality 🎭
                </h2>
                <p className="text-petmeme-muted mt-2">
                  Pick behaviors that describe {petName || 'your pet'}
                  <br />
                  <span className="text-xs">(helps generate better memes!)</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {behaviors.map(({ id, emoji, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleBehavior(id)}
                    className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                      selectedBehaviors.includes(id)
                        ? 'bg-gradient-to-r from-primary-500 to-accent-coral text-white shadow-lg'
                        : 'bg-white dark:bg-petmeme-card-dark hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm font-medium leading-tight">{label}</span>
                    {selectedBehaviors.includes(id) && (
                      <Check className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-3xl font-bold text-gradient">
                  What makes you LOL? 😂
                </h2>
                <p className="text-petmeme-muted mt-2">
                  We'll show you more of what you love
                  <br />
                  <span className="text-xs">(optional but fun!)</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {ownerPrefs.map(({ id, emoji, label }) => (
                  <button
                    key={id}
                    onClick={() => togglePref(id)}
                    className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                      selectedPrefs.includes(id)
                        ? 'bg-gradient-to-r from-secondary-500 to-accent-mint text-white shadow-lg'
                        : 'bg-white dark:bg-petmeme-card-dark hover:bg-secondary-50 dark:hover:bg-secondary-900/20'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm font-medium">{label}</span>
                    {selectedPrefs.includes(id) && (
                      <Check className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation buttons */}
      <div className="p-6 flex gap-4">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        
        <button
          onClick={() => {
            if (step < totalSteps) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed() || loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            'Creating profile...'
          ) : step === totalSteps ? (
            <>
              <Sparkles className="w-5 h-5" />
              Let's Go!
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
