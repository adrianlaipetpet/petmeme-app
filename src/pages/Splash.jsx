import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero">
      {/* Animated paw icon */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="mb-6"
      >
        <div className="w-24 h-24 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#d946ef' }}/>
                <stop offset="50%" style={{ stopColor: '#ff6b6b' }}/>
                <stop offset="100%" style={{ stopColor: '#22c55e' }}/>
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="65" rx="25" ry="20" fill="url(#splashGradient)"/>
            <ellipse cx="30" cy="35" rx="10" ry="12" fill="url(#splashGradient)"/>
            <ellipse cx="50" cy="28" rx="10" ry="12" fill="url(#splashGradient)"/>
            <ellipse cx="70" cy="35" rx="10" ry="12" fill="url(#splashGradient)"/>
          </svg>
        </div>
      </motion.div>
      
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-heading text-4xl font-bold text-gradient mb-2"
      >
        PetMeme Hub
      </motion.h1>
      
      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-petmeme-muted dark:text-petmeme-muted-dark font-medium"
      >
        Where pet chaos goes viral 🐾
      </motion.p>
      
      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity,
              delay: i * 0.15 
            }}
            className="w-2 h-2 rounded-full bg-primary-400"
          />
        ))}
      </motion.div>
    </div>
  );
}
