/**
 * 🏷️ Hashtag Generator
 * Generates fun, punny, viral hashtags based on detected pet behavior
 * Uses local static data for instant generation (no API calls)
 */

import { behaviorHashtags } from '../data/behaviorHashtags';

/**
 * Pick a random item from an array
 */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Pick multiple random unique items from an array
 */
const pickMultipleRandom = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

/**
 * Capitalize first letter of each word
 */
const capitalize = (str) => {
  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

/**
 * Remove special characters and spaces from hashtag
 */
const cleanHashtag = (tag) => {
  // Keep emojis and alphanumeric, remove everything else
  return tag.replace(/[^\w\u{1F300}-\u{1F9FF}]/gu, '');
};

/**
 * Check if hashtag is valid (not too long, not empty)
 */
const isValidHashtag = (tag) => {
  const cleaned = tag.replace(/[^\w]/g, ''); // Remove non-word chars for length check
  return cleaned.length >= 3 && cleaned.length <= 25;
};

/**
 * Maybe add emoji (20-30% chance)
 */
const maybeAddEmoji = (tag, behavior) => {
  if (Math.random() > 0.25) return tag; // 75% chance to skip
  
  const emojis = behaviorHashtags.emojis[behavior] || ['🐾', '😹', '🐕', '😺'];
  return tag + pickRandom(emojis);
};

/**
 * Generate hashtag templates based on behavior
 * PRIORITIZES direct behavior-related viral hashtags!
 */
const generateHashtagTemplates = (behavior, petType = 'pet') => {
  const {
    synonyms,
    adjectives,
    petTypes,
    emojis,
    memePhrases,
    genericTags,
    dogTags,
    catTags,
  } = behaviorHashtags;

  const normalizedBehavior = behavior.toLowerCase().trim();
  const capitalizedBehavior = capitalize(behavior);
  
  // Get behavior-specific data or use defaults
  const behaviorSynonyms = synonyms[normalizedBehavior] || [normalizedBehavior];
  const behaviorEmojis = emojis[normalizedBehavior] || ['🐾', '😹'];
  const behaviorPhrases = memePhrases[normalizedBehavior] || [];
  
  const templates = [];
  
  // 🔥 PRIORITY 1: VIRAL MEME PHRASES (most relatable!)
  // These come first because they're proven viral patterns
  if (behaviorPhrases.length > 0) {
    behaviorPhrases.forEach(phrase => {
      templates.push(() => phrase);
    });
  }
  
  // 🔥 PRIORITY 2: Direct behavior hashtags with emoji
  templates.push(() => {
    const emoji = pickRandom(behaviorEmojis);
    return `${capitalizedBehavior}${emoji}`;
  });
  
  // 🔥 PRIORITY 3: Synonym variations (relatable slang)
  behaviorSynonyms.slice(0, 3).forEach(syn => {
    templates.push(() => capitalize(syn));
  });
  
  // Template: #PetTypeBehavior (e.g., #DogZoomies, #CatNap)
  templates.push(() => {
    const pet = petType === 'dog' ? 'Dog' : petType === 'cat' ? 'Cat' : pickRandom(['Dog', 'Cat', 'Pet']);
    return `${pet}${capitalizedBehavior}`;
  });
  
  // Template: #BehaviorMode (e.g., #ZoomiesMode, #SleepMode)
  templates.push(() => `${capitalizedBehavior}Mode`);
  
  // Template: #BehaviorVibes (relatable!)
  templates.push(() => `${capitalizedBehavior}Vibes`);
  
  // Template: #BehaviorLife 
  templates.push(() => `${capitalizedBehavior}Life`);
  
  // Template: #AdjectiveBehavior (e.g., #CrazyZoomies)
  templates.push(() => {
    const adj = pickRandom(['Epic', 'Crazy', 'Pure', 'Maximum', 'Total', 'Certified']);
    return `${adj}${capitalizedBehavior}`;
  });
  
  // Add pet-type specific tags (lower priority)
  const petSpecificTags = petType === 'dog' ? dogTags : petType === 'cat' ? catTags : genericTags;
  templates.push(() => pickRandom(petSpecificTags));
  
  return templates;
};

/**
 * Main function: Generate 3-5 fun hashtags for a behavior
 * @param {string} behavior - The detected behavior (e.g., "zoomies", "sleeping")
 * @param {string} petType - The pet type ("dog", "cat", or "pet")
 * @param {number} count - Number of hashtags to generate (default 5)
 * @returns {string[]} Array of hashtags (without # prefix)
 */
export const generateHashtags = (behavior, petType = 'pet', count = 5) => {
  if (!behavior || typeof behavior !== 'string') {
    // Fallback to generic tags
    return pickMultipleRandom(behaviorHashtags.genericTags, count);
  }
  
  const templates = generateHashtagTemplates(behavior, petType);
  const hashtags = new Set(); // Use Set for deduplication
  
  // Generate hashtags using random templates
  let attempts = 0;
  const maxAttempts = count * 3; // Prevent infinite loops
  
  while (hashtags.size < count && attempts < maxAttempts) {
    const template = pickRandom(templates);
    let tag = template();
    
    // Clean and validate
    tag = cleanHashtag(tag);
    
    // Maybe add emoji
    tag = maybeAddEmoji(tag, behavior.toLowerCase());
    
    if (isValidHashtag(tag) && !hashtags.has(tag)) {
      hashtags.add(tag);
    }
    
    attempts++;
  }
  
  // If we couldn't generate enough, add generic tags
  if (hashtags.size < count) {
    const generics = pickMultipleRandom(behaviorHashtags.genericTags, count - hashtags.size);
    generics.forEach(tag => hashtags.add(tag));
  }
  
  return Array.from(hashtags).slice(0, count);
};

/**
 * Generate hashtags from multiple behaviors
 * @param {string[]} behaviors - Array of detected behaviors
 * @param {string} petType - The pet type
 * @returns {string[]} Array of 5 unique hashtags
 */
export const generateHashtagsFromBehaviors = (behaviors, petType = 'pet') => {
  if (!behaviors || behaviors.length === 0) {
    return pickMultipleRandom(behaviorHashtags.genericTags, 5);
  }
  
  const allHashtags = new Set();
  
  // Generate 2-3 hashtags per behavior
  const tagsPerBehavior = Math.ceil(5 / behaviors.length);
  
  behaviors.forEach(behavior => {
    const tags = generateHashtags(behavior, petType, tagsPerBehavior);
    tags.forEach(tag => allHashtags.add(tag));
  });
  
  // Add a pet-type specific tag
  const petTags = petType === 'dog' 
    ? behaviorHashtags.dogTags 
    : petType === 'cat' 
      ? behaviorHashtags.catTags 
      : behaviorHashtags.genericTags;
  
  allHashtags.add(pickRandom(petTags));
  
  // Always include the app tag
  allHashtags.add('PetsOfLmeow');
  
  return Array.from(allHashtags).slice(0, 5);
};

/**
 * Get behavior display name with emoji
 */
export const getBehaviorDisplay = (behavior) => {
  const emojis = behaviorHashtags.emojis[behavior.toLowerCase()];
  const emoji = emojis ? emojis[0] : '🐾';
  return `${emoji} ${capitalize(behavior)}`;
};

/**
 * Get all available behaviors for dropdown
 */
export const getAvailableBehaviors = () => {
  return Object.keys(behaviorHashtags.synonyms).map(behavior => ({
    value: behavior,
    label: getBehaviorDisplay(behavior),
  }));
};

export default {
  generateHashtags,
  generateHashtagsFromBehaviors,
  getBehaviorDisplay,
  getAvailableBehaviors,
};
