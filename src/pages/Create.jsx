import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import viralTemplates from '../data/viralTemplates.json';
import { generateHashtagsFromBehaviors, getBehaviorDisplay, getAvailableBehaviors } from '../utils/hashtagGenerator';
import {
  Image, Video, Camera, Sparkles, X, Plus, Hash,
  Type, Smile, Wand2, Loader2, Send, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, MoveUp, MoveDown,
  Zap, RefreshCw, Tag, PawPrint, Check, ChevronRight
} from 'lucide-react';

// Behavior options for tagging
const behaviorTags = [
  'zoomies', 'lazy', 'dramatic', 'foodie', 'destroyer', 'derpy',
  'vocal', 'cuddly', 'scared', 'jealous', 'clingy', 'genius'
];

// 🐕 Common pet breeds for selection
const dogBreeds = [
  'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Poodle',
  'Beagle', 'Rottweiler', 'Husky', 'Corgi', 'Dachshund', 'Pomeranian',
  'Chihuahua', 'Shiba Inu', 'Border Collie', 'Australian Shepherd',
  'French Bulldog', 'Pit Bull', 'Boxer', 'Great Dane', 'Doberman',
  'Maltese', 'Shih Tzu', 'Yorkshire Terrier', 'Cavalier King Charles',
  'Bernese Mountain Dog', 'Samoyed', 'Akita', 'Mixed Breed Dog'
];

const catBreeds = [
  'Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'British Shorthair',
  'Bengal', 'Abyssinian', 'Scottish Fold', 'Sphynx', 'Russian Blue',
  'Birman', 'American Shorthair', 'Oriental', 'Norwegian Forest Cat',
  'Devon Rex', 'Exotic Shorthair', 'Himalayan', 'Tonkinese', 'Burmese',
  'Munchkin', 'Tabby', 'Calico', 'Tuxedo Cat', 'Orange Tabby', 'Mixed Breed Cat'
];

const otherPets = [
  'Rabbit', 'Hamster', 'Guinea Pig', 'Parrot', 'Cockatiel', 'Turtle',
  'Hedgehog', 'Ferret', 'Chinchilla', 'Fish', 'Gecko', 'Iguana'
];

// Quick emoji overlays
const quickEmojis = ['😂', '🤣', '😹', '💀', '🔥', '💯', '😍', '🥺', '😤', '🤪'];

// Overlay position options
const overlayPositions = [
  { id: 'top', label: 'Top', icon: MoveUp },
  { id: 'center', label: 'Center', icon: AlignCenter },
  { id: 'bottom', label: 'Bottom', icon: MoveDown },
];

const overlayStyles = [
  { id: 'classic', label: 'Classic', style: 'text-white font-bold text-2xl drop-shadow-lg' },
  { id: 'impact', label: 'Impact', style: 'text-white font-black text-3xl uppercase tracking-wide', fontFamily: 'Impact, sans-serif' },
  { id: 'comic', label: 'Comic', style: 'text-black font-bold text-2xl bg-white/90 px-3 py-1 rounded-lg' },
  { id: 'neon', label: 'Neon', style: 'text-pink-400 font-bold text-2xl', textShadow: '0 0 10px #ff6b6b, 0 0 20px #ff6b6b' },
  { id: 'minimal', label: 'Minimal', style: 'text-white font-medium text-xl' },
];

export default function Create() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [caption, setCaption] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [overlayPosition, setOverlayPosition] = useState('bottom');
  const [overlayStyleId, setOverlayStyleId] = useState('classic');
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showBehaviors, setShowBehaviors] = useState(true); // Default OPEN!
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  
  // 🏷️ Hashtag state
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [manualHashtag, setManualHashtag] = useState('');
  const [detectedBehavior, setDetectedBehavior] = useState(null);
  
  // 🐕 Breed detection state
  const [detectedBreed, setDetectedBreed] = useState(null);
  const [detectedPetType, setDetectedPetType] = useState(null);
  const [showBreedSelector, setShowBreedSelector] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // 🐱🐶 Coding-themed scenario options for manual selection!
  const scenarioOptions = [
    { id: 'sleeping', emoji: '💤', label: '3AM Crashed 💻😴', scene: 'sleeping', mood: 'peaceful', action: 'crashed after coding' },
    { id: 'staring', emoji: '👀', label: 'Code Review 🔍', scene: 'staring', mood: 'judgmental', action: 'reviewing code' },
    { id: 'playing', emoji: '🦴', label: 'Fetch() Success 🐶', scene: 'playing', mood: 'excited', action: 'fetching data' },
    { id: 'eating', emoji: '☕', label: 'Coffee Break ☕', scene: 'eating', mood: 'hungry', action: 'refueling' },
    { id: 'derpy', emoji: '🤪', label: 'Brain.exe Crashed 💀', scene: 'derpy', mood: 'confused', action: 'undefined' },
    { id: 'dramatic', emoji: '🔥', label: 'Merge Conflict 😱', scene: 'being_dramatic', mood: 'dramatic', action: 'merge conflict' },
    { id: 'guilty', emoji: '😬', label: 'Pushed to Prod 💀', scene: 'guilty', mood: 'guilty', action: 'force pushed' },
    { id: 'excited', emoji: '🎉', label: 'Tests Passing ✅', scene: 'excited', mood: 'excited', action: 'all tests green' },
    { id: 'scared', emoji: '😰', label: 'Friday Deploy 😱', scene: 'scared', mood: 'scared', action: 'deploying friday' },
    { id: 'relaxed', emoji: '😎', label: 'Zero Bugs 🏆', scene: 'relaxed', mood: 'relaxed', action: 'bug free vibes' },
    { id: 'judging', emoji: '🧐', label: 'PR Review Mode 👀', scene: 'judging', mood: 'skeptical', action: 'judging PRs' },
    { id: 'sitting', emoji: '⌨️', label: 'Keyboard Cat 🐱', scene: 'sitting', mood: 'focused', action: 'on keyboard' },
  ];
  const { user, pet } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  
  // Auto-generate AI captions when media is uploaded
  useEffect(() => {
    if (mediaPreviews.length > 0 && aiSuggestions.length === 0 && !isGeneratingAI) {
      // Reset previous selections
      setSelectedScenario(null);
      setAiSuggestions([]);
      setTextOverlay('');
      setCaption('');
      setDetectedBreed(null);
      setDetectedPetType(null);
      setDetectedBehavior(null);
      setSuggestedHashtags([]);
      // Start AI generation (which now includes breed detection!)
      generateAICaptions();
    }
  }, [mediaPreviews.length]);
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limit to 4 files
    const newFiles = files.slice(0, 4 - mediaFiles.length);
    
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, {
          url: reader.result,
          type: file.type.startsWith('video') ? 'video' : 'image'
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    setMediaFiles(prev => [...prev, ...newFiles]);
  };
  
  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    // Reset breed detection when primary media is removed
    if (index === 0) {
      setDetectedBreed(null);
      setDetectedPetType(null);
      setDetectedBehavior(null);
      setAiSuggestions([]);
      setSuggestedHashtags([]);
    }
  };
  
  const toggleBehavior = (behavior) => {
    setSelectedBehaviors(prev =>
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  };
  
  // Analyze uploaded image using AI Vision - now detects BREED + BEHAVIOR!
  const analyzeImage = async () => {
    if (mediaPreviews.length === 0) return null;
    
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    // If API key exists, use real AI vision
    if (apiKey && apiKey.startsWith('sk-or-')) {
      try {
        const imageData = mediaPreviews[0].url;
        
        // Ensure image is in correct format
        if (!imageData.startsWith('data:image')) {
          console.error('Invalid image format');
          return null;
        }
        
        console.log('🤖 Calling Gemini Vision API for behavior + breed detection...');
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lmeow.app',
            'X-Title': 'Lmeow Meme Generator',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageData }
                },
                {
                  type: 'text', 
                  text: `Analyze this pet photo. Reply in EXACTLY this format (3 lines, nothing else):
BEHAVIOR: [one word from: sleeping, staring, playing, eating, sitting, derpy, guilty, excited, scared, judging, dramatic, relaxed]
PET_TYPE: [one word: dog, cat, rabbit, bird, other]
BREED: [specific breed name like "Golden Retriever", "Persian Cat", "Shiba Inu", "Mixed Breed", etc.]

Be specific about the breed. If you're not sure, make your best guess based on appearance.`
                }
              ]
            }],
            max_tokens: 100,
          }),
        });
        
        if (!response.ok) {
          const err = await response.text();
          console.error('API Error:', response.status, err);
          return null;
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        
        if (content) {
          console.log('✅ AI response:', content);
          
          // Parse the structured response
          const lines = content.split('\n');
          let behavior = 'sitting';
          let petType = 'dog';
          let breed = null;
          
          lines.forEach(line => {
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith('BEHAVIOR:')) {
              const val = line.split(':')[1]?.trim().toLowerCase();
              const validScenes = ['sleeping', 'staring', 'playing', 'eating', 'sitting', 'derpy', 'guilty', 'excited', 'scared', 'judging', 'dramatic', 'relaxed'];
              behavior = validScenes.find(s => val?.includes(s)) || 'sitting';
            } else if (upperLine.startsWith('PET_TYPE:')) {
              petType = line.split(':')[1]?.trim().toLowerCase() || 'dog';
            } else if (upperLine.startsWith('BREED:')) {
              breed = line.split(':')[1]?.trim() || null;
              // Clean up breed name
              if (breed) {
                breed = breed.replace(/^["']|["']$/g, '').trim();
              }
            }
          });
          
          // Update breed state
          if (breed) {
            setDetectedBreed(breed);
            setDetectedPetType(petType);
            console.log('🐕 Detected breed:', breed, 'Type:', petType);
          }
          
          showToast(`AI detected: ${breed || 'pet'} ${behavior === 'sleeping' ? '💤' : '🐾'}`, 'success');
          
          return {
            scene: behavior,
            mood: behavior === 'sleeping' ? 'peaceful' : behavior === 'excited' ? 'happy' : 'neutral',
            action: behavior,
            breed: breed,
            petType: petType,
          };
        }
      } catch (error) {
        console.error('Vision API error:', error.message);
      }
    }
    
    // Fallback: Use the user-selected scenario if available
    if (selectedScenario) {
      return selectedScenario;
    }
    
    // No API key or error - prompt user to select manually
    return null;
  };
  
  // 🔥 VIRAL MEME GENERATOR ALGORITHM v2.0 🔥
  // Uses 300 real viral pet meme templates from 2025-2026!
  
  // Get matching viral templates for the detected scene + pet type
  const getMatchingTemplates = (scene, petType) => {
    const templates = viralTemplates.templates || [];
    const isCat = petType?.toLowerCase().includes('cat');
    const isDog = petType?.toLowerCase().includes('dog');
    
    // Filter templates that match the scene AND pet type
    let matchingTemplates = templates.filter(t => {
      const sceneMatch = t.scene === scene || !t.scene;
      const typeMatch = t.breedType === 'any' || 
        (isCat && t.breedType === 'cat') || 
        (isDog && t.breedType === 'dog') ||
        (!isCat && !isDog); // If unknown, show all
      return sceneMatch && typeMatch;
    });
    
    // If not enough matches, also include templates for "any" pet type
    if (matchingTemplates.length < 5) {
      const anyTypeTemplates = templates.filter(t => 
        t.scene === scene && t.breedType === 'any'
      );
      matchingTemplates = [...matchingTemplates, ...anyTypeTemplates];
    }
    
    // If still not enough, get by scene only
    if (matchingTemplates.length < 5) {
      const sceneOnlyTemplates = templates.filter(t => t.scene === scene);
      matchingTemplates = [...matchingTemplates, ...sceneOnlyTemplates];
    }
    
    // Sort by viral score (higher = more viral)
    matchingTemplates.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
    
    // Shuffle top results for variety, then take 8
    const top = matchingTemplates.slice(0, 15);
    const shuffled = top.sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, 8);
  };
  
  // Get the caption from template (using 'example' field from new format)
  const getTemplateCaption = (template, petContext) => {
    let caption = template.example || template.template;
    
    // Replace any remaining placeholders with pet name
    const petName = petContext.petName || (template.breedType === 'cat' ? 'Kitty' : 'Doggo');
    caption = caption.replace(/\[name\]/gi, petName);
    caption = caption.replace(/\[pet\]/gi, petName);
    
    return caption;
  };
  
  // Get random templates for variety
  const getRandomTemplates = (petType, count = 3) => {
    const templates = viralTemplates.templates || [];
    const isCat = petType?.toLowerCase().includes('cat');
    const isDog = petType?.toLowerCase().includes('dog');
    
    // Filter by pet type
    const filtered = templates.filter(t => 
      t.breedType === 'any' || 
      (isCat && t.breedType === 'cat') || 
      (isDog && t.breedType === 'dog')
    );
    
    // Shuffle and pick random ones
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };
  
  // 🧠 MAIN VIRAL CAPTION GENERATOR v2.0 - 300 Real Viral Templates!
  const generateViralCaptions = async (petContext, imageContext) => {
    const scene = imageContext?.scene || 'relaxed';
    const captions = [];
    
    // 1️⃣ Get matching viral templates by scene + pet type
    const matchingTemplates = getMatchingTemplates(scene, petContext.petType || petContext.breed);
    
    // 2️⃣ Extract captions from templates
    matchingTemplates.forEach(template => {
      const caption = getTemplateCaption(template, petContext);
      if (caption && !captions.includes(caption)) {
        captions.push(caption);
      }
    });
    
    // 3️⃣ Add some random high-viral templates for variety
    const randomTemplates = getRandomTemplates(petContext.petType || petContext.breed, 3);
    randomTemplates.forEach(template => {
      const caption = getTemplateCaption(template, petContext);
      if (caption && !captions.includes(caption)) {
        captions.push(caption);
      }
    });
    
    // 4️⃣ Try AI enhancement if API key is available
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (apiKey && apiKey.startsWith('sk-or-') && mediaPreviews.length > 0) {
      try {
        console.log('🤖 Enhancing with AI Vision...');
        const imageData = mediaPreviews[0].url;
        const isCat = petContext.petType?.toLowerCase().includes('cat') || petContext.breed?.toLowerCase().includes('cat');
        const petTypeStr = isCat ? 'cat' : 'dog';
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lmeow.app',
            'X-Title': 'Lmeow Meme Generator',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageData }
                },
                {
                  type: 'text',
                  text: `You are a viral pet meme caption generator. Look at this ${petTypeStr} photo.

Pet name: ${petContext.petName || petTypeStr}
Detected mood/scene: ${scene}

Generate 2 VIRAL, FUNNY meme captions based on what you see in the image. Make them:
- SHORT (under 60 characters ideal)
- HILARIOUS and relatable to pet owners
- Use emojis sparingly but effectively (1-3 max)
- Reference common pet behaviors: treats, zoomies, naps, begging, being dramatic, guilty face, etc.
- Similar style to viral memes like "When you hear the treat bag 👀" or "I didn't do it 😇"

Output ONLY the 2 captions, one per line. No numbering, no explanations, no quotes.`
                }
              ]
            }],
            max_tokens: 120,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            const aiCaptions = content.split('\n')
              .map(c => c.trim())
              .filter(c => c.length > 0 && c.length < 100)
              .slice(0, 2);
            // Add AI captions at the TOP (they're context-aware!)
            captions.unshift(...aiCaptions);
            console.log('✅ AI generated:', aiCaptions);
          }
        }
      } catch (error) {
        console.log('AI enhancement skipped:', error.message);
      }
    }
    
    // 5️⃣ Dedupe and return top 5 viral captions
    const unique = [...new Set(captions)];
    return unique.slice(0, 5);
  };
  
  // Legacy function for backwards compatibility
  const generateContextualCaptions = (petContext, imageContext) => {
    const scene = imageContext?.scene || 'relaxed';
    const matchingTemplates = getMatchingTemplates(scene, petContext.petType);
    const captions = matchingTemplates.map(t => getTemplateCaption(t, petContext));
    return [...new Set(captions)].slice(0, 5);
  };
  
  const generateAICaptions = async (manualScenario = null) => {
    if (!pet) {
      showToast('Set up your pet profile first!', 'error');
      return;
    }
    
    setIsGeneratingAI(true);
    setShowScenarioSelector(false);
    
    try {
      // Build context from pet profile + user behaviors
      const petContext = {
        petName: pet.name,
        petType: pet.type,
        breed: pet.breed,
        behaviors: [...(pet.behaviors || []), ...selectedBehaviors],
      };
      
      let imageContext;
      
      if (manualScenario) {
        // User manually selected a scenario
        imageContext = manualScenario;
        setSelectedScenario(manualScenario);
      } else {
        // Try AI analysis
        imageContext = await analyzeImage();
        
        // If no AI result and no manual selection, show selector
        if (!imageContext && !selectedScenario) {
          setIsGeneratingAI(false);
          setShowScenarioSelector(true);
          showToast('Pick what\'s happening in the photo! 👇', 'info');
          return;
        }
        
        imageContext = imageContext || selectedScenario;
      }
      
      // Log what AI detected (for debugging)
      if (imageContext?.scene) {
        console.log('🧠 AI detected scene:', imageContext.scene);
        console.log('📊 Using viral template matching...');
        
        // 🎯 AUTO-SELECT the detected behavior in behavior tags!
        const detectedScene = imageContext.scene.toLowerCase();
        setDetectedBehavior(detectedScene);
        
        // Map scene to behavior tag (some scenes map to different tag names)
        const sceneToBehavior = {
          'sleeping': 'lazy',
          'staring': 'dramatic',
          'playing': 'zoomies',
          'eating': 'foodie',
          'sitting': 'lazy',
          'derpy': 'derpy',
          'guilty': 'destroyer',
          'excited': 'zoomies',
          'scared': 'scared',
          'judging': 'dramatic',
          'dramatic': 'dramatic',
          'relaxed': 'cuddly',
        };
        
        const mappedBehavior = sceneToBehavior[detectedScene] || detectedScene;
        
        // Auto-add detected behavior to selected behaviors (if not already there)
        if (behaviorTags.includes(mappedBehavior) && !selectedBehaviors.includes(mappedBehavior)) {
          setSelectedBehaviors(prev => [mappedBehavior, ...prev]);
          showToast(`Auto-tagged: #${mappedBehavior} 🎯`, 'info');
        }
        
        // 🏷️ Generate BEHAVIOR-FOCUSED hashtags!
        const behaviors = [mappedBehavior, detectedScene, ...selectedBehaviors];
        const petType = petContext.petType?.toLowerCase().includes('dog') ? 'dog' : 'cat';
        const hashtags = generateHashtagsFromBehaviors([...new Set(behaviors)], petType);
        setSuggestedHashtags(hashtags);
        console.log('🏷️ Generated behavior-focused hashtags:', hashtags);
      }
      
      // 🔥 Use the NEW VIRAL GENERATOR! 🔥
      const suggestions = await generateViralCaptions(petContext, imageContext);
      
      setAiSuggestions(suggestions);
      
      // Auto-apply the BEST (first) suggestion as overlay
      if (suggestions.length > 0) {
        setTextOverlay(suggestions[0]);
        setCaption(suggestions[0]);
        showToast(`🔥 ${suggestions.length} viral captions + hashtags ready!`, 'success');
      }
      
    } catch (error) {
      console.error('AI generation error:', error);
      showToast('Could not generate suggestions', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  // Regenerate captions with fresh templates
  const regenerateCaptions = async () => {
    if (selectedScenario || mediaPreviews.length > 0) {
      await generateAICaptions(selectedScenario);
    }
  };
  
  // 🏷️ Hashtag management functions
  const addHashtag = (tag) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    if (cleanTag && !selectedHashtags.includes(cleanTag) && selectedHashtags.length < 10) {
      setSelectedHashtags(prev => [...prev, cleanTag]);
      // Remove from suggestions
      setSuggestedHashtags(prev => prev.filter(t => t !== cleanTag));
    }
  };
  
  const removeHashtag = (tag) => {
    setSelectedHashtags(prev => prev.filter(t => t !== tag));
  };
  
  const handleManualHashtagAdd = () => {
    if (manualHashtag.trim()) {
      addHashtag(manualHashtag);
      setManualHashtag('');
    }
  };
  
  const regenerateHashtags = () => {
    const behaviors = detectedBehavior 
      ? [detectedBehavior, ...selectedBehaviors] 
      : selectedBehaviors;
    const petType = pet?.type?.toLowerCase().includes('dog') ? 'dog' : 'cat';
    const hashtags = generateHashtagsFromBehaviors(behaviors.length > 0 ? behaviors : ['playing'], petType);
    setSuggestedHashtags(hashtags);
    showToast('Fresh hashtags generated! 🏷️', 'success');
  };
  
  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      showToast('Add at least one photo or video', 'error');
      return;
    }
    
    if (!caption.trim()) {
      showToast('Add a caption for your meme', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload media files
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (file, index) => {
          const mediaRef = ref(storage, `posts/${user.uid}/${Date.now()}_${index}_${file.name}`);
          await uploadBytes(mediaRef, file);
          return {
            url: await getDownloadURL(mediaRef),
            type: file.type.startsWith('video') ? 'video' : 'image',
          };
        })
      );
      
      // Build memeText object based on overlay position
      const memeText = textOverlay.trim() ? {
        top: overlayPosition === 'top' ? textOverlay.trim() : null,
        bottom: overlayPosition === 'bottom' ? textOverlay.trim() : null,
        center: overlayPosition === 'center' ? textOverlay.trim() : null,
      } : null;
      
      // Create post document
      const postData = {
        // ===== ORIGINAL POST MARKERS (easy to spot in Firestore!) =====
        _label: '📸 ORIGINAL',  // Human-readable label for Firestore console
        isRepost: false,        // Boolean for easy filtering
        
        // ===== OWNER INFO =====
        ownerId: user.uid,
        pet: {
          id: user.uid,
          name: pet?.name || 'Anonymous Pet',
          breed: pet?.breed || null,
          photoUrl: pet?.photoURL || null,
          petType: pet?.type || null,
        },
        
        // ===== CONTENT =====
        type: mediaUrls[0].type,
        mediaUrl: mediaUrls[0].url,
        mediaItems: mediaUrls,
        caption: caption.trim(),
        memeText: memeText, // Structured for FeedCard rendering
        textOverlay: textOverlay.trim() || null, // Keep for backwards compat
        overlayPosition: overlayPosition,
        behaviors: selectedBehaviors,
        hashtags: selectedHashtags, // Fun viral hashtags!
        
        // ===== 🐕 AI-DETECTED BREED (for categorization!) =====
        detectedBreed: detectedBreed || null,  // e.g. "Golden Retriever", "Persian Cat"
        detectedPetType: detectedPetType || null, // "dog", "cat", "rabbit", etc.
        
        // ===== ENGAGEMENT METRICS =====
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        repostCount: 0,
        likedBy: [],
        
        // ===== METADATA =====
        createdAt: serverTimestamp(),
        isBrandPost: false,
        deleted: false,
      };
      
      await addDoc(collection(db, 'posts'), postData);
      
      showToast('Meme posted! 🎉', 'success');
      navigate('/');
    } catch (error) {
      console.error('Post creation error:', error);
      showToast('Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-petmeme-bg/80 dark:bg-petmeme-bg-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Create Meme</h1>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isSubmitting || mediaFiles.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Post
          </motion.button>
        </div>
      </header>
      
      <div className="p-4 space-y-6">
        {/* Media upload area */}
        <div className="space-y-4">
          {mediaPreviews.length === 0 ? (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl p-8 cursor-pointer hover:border-primary-400 transition-colors"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-accent-lavender dark:from-primary-900/30 dark:to-accent-lavender/20 flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-primary-500" />
                </div>
                <p className="font-semibold text-petmeme-text dark:text-petmeme-text-dark mb-1">
                  Add photos or videos
                </p>
                <p className="text-sm text-petmeme-muted">
                  Tap to upload (max 4)
                </p>
              </div>
            </motion.div>
          ) : (
            <div 
              className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
              onClick={() => setShowOverlayEditor(true)}
            >
              {mediaPreviews[0].type === 'video' ? (
                <video
                  src={mediaPreviews[0].url}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={mediaPreviews[0].url}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Text overlay preview */}
              {textOverlay && (
                <div className={`absolute inset-x-0 p-4 flex items-center justify-center ${
                  overlayPosition === 'top' ? 'top-0 bg-gradient-to-b from-black/70 to-transparent pt-6' :
                  overlayPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                  'bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-6'
                }`}>
                  <p 
                    className={`text-center max-w-[90%] ${overlayStyles.find(s => s.id === overlayStyleId)?.style || ''}`}
                    style={{ 
                      fontFamily: overlayStyles.find(s => s.id === overlayStyleId)?.fontFamily,
                      textShadow: overlayStyles.find(s => s.id === overlayStyleId)?.textShadow 
                    }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}
              
              {/* AI generating indicator */}
              {isGeneratingAI && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white dark:bg-petmeme-card-dark rounded-2xl p-4 flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    <span className="font-medium text-petmeme-text dark:text-petmeme-text-dark">
                      Generating meme ideas...
                    </span>
                  </div>
                </div>
              )}
              
              {/* Tap to edit overlay hint */}
              {!textOverlay && !isGeneratingAI && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-white/90 dark:bg-petmeme-card-dark/90 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-petmeme-text dark:text-petmeme-text-dark">
                      Tap to add meme text
                    </span>
                  </div>
                </div>
              )}
              
              <button
                onClick={(e) => { e.stopPropagation(); removeMedia(0); }}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
              
              {mediaPreviews[0].type === 'video' && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 rounded-full flex items-center gap-1.5 text-white text-sm">
                  <Video className="w-4 h-4" />
                  Video
                </div>
              )}
            </div>
          )}
          
          {/* Thumbnail strip for multiple uploads */}
          {mediaPreviews.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {mediaPreviews.map((media, index) => (
                <div 
                  key={index} 
                  className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 ${
                    index === 0 ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  {media.type === 'video' ? (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              
              {mediaPreviews.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-petmeme-muted hover:border-primary-400 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {/* 🐕 Detected Breed Chip */}
        <AnimatePresence>
          {detectedBreed && mediaPreviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card p-4 border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-petmeme-muted flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Detected Breed
                    </p>
                    <p className="font-bold text-petmeme-text dark:text-petmeme-text-dark">
                      {detectedBreed}
                    </p>
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBreedSelector(true)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark border border-gray-200 dark:border-gray-700 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Change
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 🐕 Breed Selector Modal */}
        <AnimatePresence>
          {showBreedSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
              onClick={() => setShowBreedSelector(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-petmeme-card dark:bg-petmeme-card-dark rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xl font-bold text-petmeme-text dark:text-petmeme-text-dark">
                    Select Breed
                  </h3>
                  <button
                    onClick={() => setShowBreedSelector(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="overflow-y-auto flex-1 space-y-4">
                  {/* Dogs */}
                  <div>
                    <p className="text-sm font-semibold text-petmeme-muted mb-2 flex items-center gap-2">
                      🐕 Dogs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dogBreeds.map((breed) => (
                        <button
                          key={breed}
                          onClick={() => {
                            setDetectedBreed(breed);
                            setDetectedPetType('dog');
                            setShowBreedSelector(false);
                            showToast(`Breed set to ${breed} 🐕`, 'success');
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            detectedBreed === breed
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark hover:bg-primary-100 dark:hover:bg-primary-900/30'
                          }`}
                        >
                          {breed}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cats */}
                  <div>
                    <p className="text-sm font-semibold text-petmeme-muted mb-2 flex items-center gap-2">
                      🐱 Cats
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {catBreeds.map((breed) => (
                        <button
                          key={breed}
                          onClick={() => {
                            setDetectedBreed(breed);
                            setDetectedPetType('cat');
                            setShowBreedSelector(false);
                            showToast(`Breed set to ${breed} 🐱`, 'success');
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            detectedBreed === breed
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark hover:bg-primary-100 dark:hover:bg-primary-900/30'
                          }`}
                        >
                          {breed}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Other Pets */}
                  <div>
                    <p className="text-sm font-semibold text-petmeme-muted mb-2 flex items-center gap-2">
                      🐰 Other Pets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {otherPets.map((pet) => (
                        <button
                          key={pet}
                          onClick={() => {
                            setDetectedBreed(pet);
                            setDetectedPetType('other');
                            setShowBreedSelector(false);
                            showToast(`Pet type set to ${pet} 🐾`, 'success');
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            detectedBreed === pet
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark hover:bg-primary-100 dark:hover:bg-primary-900/30'
                          }`}
                        >
                          {pet}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Clear option */}
                <button
                  onClick={() => {
                    setDetectedBreed(null);
                    setDetectedPetType(null);
                    setShowBreedSelector(false);
                  }}
                  className="mt-4 w-full py-3 text-red-500 font-medium text-center"
                >
                  Clear Breed Detection
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Scenario Selector (shown when no API key) */}
        <AnimatePresence>
          {showScenarioSelector && mediaPreviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
                  What's happening in this photo?
                </h3>
              </div>
              <p className="text-sm text-petmeme-muted mb-4">
                Pick the closest match to generate perfect meme captions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {scenarioOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => generateAICaptions(option)}
                    className={`p-3 rounded-xl text-left flex items-center gap-2 transition-colors ${
                      selectedScenario?.id === option.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Text overlay */}
        <div className="card p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-3">
            <Type className="w-4 h-4" />
            Text Overlay <span className="text-petmeme-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            placeholder="Add meme text..."
            className="input-field"
            maxLength={100}
          />
          
          {/* Quick emojis */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setTextOverlay(prev => prev + emoji)}
                className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* Caption */}
        <div className="card p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-3">
            <Smile className="w-4 h-4" />
            Caption <span className="text-petmeme-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write something funny..."
            rows={3}
            className="input-field resize-none"
            maxLength={500}
          />
          <p className="text-xs text-petmeme-muted mt-2 text-right">
            {caption.length}/500
          </p>
        </div>
        
        {/* 🔥 VIRAL AI Meme Generator 🔥 */}
        <div className="card p-4 border-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 via-accent-coral to-yellow-400 flex items-center justify-center animate-pulse">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
                  🔥 Viral Meme Generator
                  <span className="text-xs bg-gradient-to-r from-primary-500 to-accent-coral text-white px-2 py-0.5 rounded-full">
                    AI + 50 Templates
                  </span>
                </p>
                <p className="text-xs text-petmeme-muted">
                  Powered by viral meme patterns that get shares!
                </p>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => generateAICaptions()}
              disabled={isGeneratingAI}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {aiSuggestions.length > 0 ? 'Generate More' : 'Generate Viral Captions'}
            </motion.button>
            
            {aiSuggestions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={regenerateCaptions}
                disabled={isGeneratingAI}
                className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 px-4"
                title="Get fresh variations"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              </motion.button>
            )}
          </div>
          
          {/* Viral Caption Variations */}
          <AnimatePresence>
            {aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-petmeme-muted flex items-center gap-1">
                    <span>🎯</span> Pick your favorite variation:
                  </p>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {aiSuggestions.length} options
                  </span>
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={`${suggestion}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={() => {
                        setTextOverlay(suggestion);
                        setCaption(suggestion);
                        setShowOverlayEditor(true);
                        showToast(`Applied variation ${index + 1}! 🔥`, 'success');
                      }}
                      className={`flex-1 text-left p-3 rounded-xl text-sm transition-all border-2 ${
                        textOverlay === suggestion 
                          ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 text-petmeme-text dark:text-petmeme-text-dark' 
                          : 'bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 border-transparent hover:border-primary-300 dark:hover:border-primary-700 text-petmeme-text dark:text-petmeme-text-dark'
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          textOverlay === suggestion 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-primary-200 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="leading-snug">{suggestion}</span>
                      </span>
                    </button>
                  </motion.div>
                ))}
                
                {/* Quick action hint */}
                <p className="text-xs text-center text-petmeme-muted mt-3 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Tap refresh above for more viral options!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* 🏷️ FUN VIRAL HASHTAGS! */}
        <div className="card p-4 border-2 border-accent-lavender dark:border-accent-lavender/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-lavender via-primary-400 to-accent-coral flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-petmeme-text dark:text-petmeme-text-dark flex items-center gap-2">
                  🏷️ Viral Hashtags
                  <span className="text-xs bg-gradient-to-r from-accent-lavender to-primary-500 text-white px-2 py-0.5 rounded-full">
                    Fun & Punny!
                  </span>
                </p>
                <p className="text-xs text-petmeme-muted">
                  Tap to add • Based on detected behavior
                </p>
              </div>
            </div>
            
            {/* Regenerate button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={regenerateHashtags}
              className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-full transition-colors"
              title="Get fresh hashtags"
            >
              <RefreshCw className="w-5 h-5 text-primary-500" />
            </motion.button>
          </div>
          
          {/* Detected behavior indicator */}
          {detectedBehavior && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="text-xs text-petmeme-muted">AI detected:</span>
              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                {getBehaviorDisplay(detectedBehavior)}
              </span>
            </motion.div>
          )}
          
          {/* Suggested hashtags (tappable chips) */}
          {suggestedHashtags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-petmeme-muted mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Tap to add:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map((tag, index) => (
                  <motion.button
                    key={`${tag}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addHashtag(tag)}
                    className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-accent-lavender/50 dark:from-primary-900/40 dark:to-accent-lavender/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium hover:from-primary-200 hover:to-accent-lavender/70 transition-all flex items-center gap-1 border border-primary-200 dark:border-primary-700"
                  >
                    <Plus className="w-3 h-3" />
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {/* Selected hashtags */}
          {selectedHashtags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-petmeme-muted mb-2">
                Your hashtags ({selectedHashtags.length}/10):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedHashtags.map((tag, index) => (
                  <motion.div
                    key={`selected-${tag}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-1.5 bg-primary-500 text-white rounded-full text-sm font-medium flex items-center gap-1 shadow-md"
                  >
                    #{tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Manual hashtag input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-petmeme-muted">#</span>
              <input
                type="text"
                value={manualHashtag}
                onChange={(e) => setManualHashtag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleManualHashtagAdd()}
                placeholder="Add custom hashtag..."
                className="input-field pl-7"
                maxLength={20}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleManualHashtagAdd}
              disabled={!manualHashtag.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </motion.button>
          </div>
          
          {/* Hashtag preview */}
          {selectedHashtags.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-xs text-petmeme-muted mb-1">Preview:</p>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium break-words">
                {selectedHashtags.map(t => `#${t}`).join(' ')}
              </p>
            </div>
          )}
        </div>
        
        {/* Behavior tags */}
        <div className="card p-4">
          <button
            onClick={() => setShowBehaviors(!showBehaviors)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary-500" />
              <span className="font-semibold text-petmeme-text dark:text-petmeme-text-dark">
                Tag Behaviors
              </span>
              {selectedBehaviors.length > 0 && (
                <span className="badge text-xs">{selectedBehaviors.length}</span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-petmeme-muted transition-transform ${showBehaviors ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showBehaviors && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex flex-wrap gap-2">
                  {behaviorTags.map((behavior) => (
                    <button
                      key={behavior}
                      onClick={() => toggleBehavior(behavior)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedBehaviors.includes(behavior)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark hover:bg-primary-100 dark:hover:bg-primary-900/30'
                      }`}
                    >
                      #{behavior}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Overlay Editor Modal */}
      <AnimatePresence>
        {showOverlayEditor && mediaPreviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <button
                onClick={() => setShowOverlayEditor(false)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="font-heading text-lg font-bold">Edit Meme Text</h2>
              <button
                onClick={() => {
                  setShowOverlayEditor(false);
                  showToast('Overlay saved!', 'success');
                }}
                className="px-4 py-2 bg-primary-500 rounded-full font-semibold text-sm"
              >
                Done
              </button>
            </div>
            
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden">
                {mediaPreviews[0].type === 'video' ? (
                  <video
                    src={mediaPreviews[0].url}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaPreviews[0].url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Live overlay preview */}
                {textOverlay && (
                  <div className={`absolute inset-x-0 p-4 flex items-center justify-center ${
                    overlayPosition === 'top' ? 'top-0 bg-gradient-to-b from-black/70 to-transparent pt-6' :
                    overlayPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                    'bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-6'
                  }`}>
                    <p 
                      className={`text-center max-w-[90%] ${overlayStyles.find(s => s.id === overlayStyleId)?.style || ''}`}
                      style={{ 
                        fontFamily: overlayStyles.find(s => s.id === overlayStyleId)?.fontFamily,
                        textShadow: overlayStyles.find(s => s.id === overlayStyleId)?.textShadow 
                      }}
                    >
                      {textOverlay}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Editor controls */}
            <div className="bg-petmeme-card dark:bg-petmeme-card-dark rounded-t-3xl p-6 space-y-5 max-h-[50vh] overflow-y-auto">
              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                  Meme Text
                </label>
                <textarea
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Enter your meme text..."
                  rows={2}
                  className="input-field resize-none"
                  maxLength={100}
                  autoFocus
                />
              </div>
              
              {/* Quick emojis */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setTextOverlay(prev => prev + emoji)}
                    className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              {/* Position selector */}
              <div>
                <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                  Position
                </label>
                <div className="flex gap-2">
                  {overlayPositions.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setOverlayPosition(id)}
                      className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                        overlayPosition === id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Style selector */}
              <div>
                <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2">
                  Style
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {overlayStyles.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setOverlayStyleId(id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                        overlayStyleId === id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-petmeme-text dark:text-petmeme-text-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* AI suggestions in modal */}
              {aiSuggestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-petmeme-text dark:text-petmeme-text-dark mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    AI Suggestions
                  </label>
                  <div className="space-y-2">
                    {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setTextOverlay(suggestion)}
                        className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Clear button */}
              {textOverlay && (
                <button
                  onClick={() => setTextOverlay('')}
                  className="w-full py-3 text-red-500 font-medium"
                >
                  Remove Text Overlay
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
