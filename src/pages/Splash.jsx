import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 text-5xl opacity-30"
        >
          🐱
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-32 right-16 text-4xl opacity-30"
        >
          💻
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-20 text-4xl opacity-30"
        >
          🐾
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute bottom-32 right-10 text-5xl opacity-30"
        >
          🐶
        </motion.div>
      </div>
      
      {/* 🎨 NEW LMEOW LOGO - Large and animated! */}
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="mb-6 relative"
      >
        {/* Main Logo Image - LARGE for splash! */}
        <motion.img
          src="/lmeow-logo.png"
          alt="Lmeow"
          className="w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
        />
        
        {/* Sparkles around logo */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute -top-2 -right-2 text-2xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          className="absolute -bottom-1 -left-2 text-xl"
        >
          💖
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
          className="absolute top-1/2 -right-4 text-lg"
        >
          ⭐
        </motion.div>
      </motion.div>
      
      {/* Tagline - No text logo, just the image above! */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lmeow-muted dark:text-lmeow-muted-dark font-medium mt-6 text-center px-6 text-lg"
      >
        Pet coding memes for cats & dogs! 🐱🐶💻
      </motion.p>
      
      {/* Fun loading text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-primary-400 font-medium mb-3">
          Compiling the memes...
        </p>
        
        {/* Bouncy paw prints */}
        <div className="flex gap-3 justify-center">
          {['🐾', '🐾', '🐾'].map((paw, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                delay: i * 0.15 
              }}
              className="text-2xl"
            >
              {paw}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
