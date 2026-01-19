import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Gift, Clock, Users, ChevronRight, 
  Sparkles, Star, DollarSign, Package
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { pastWinners, activeCampaigns } from '../data/demoData';

export default function Campaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const { showToast } = useUIStore();
  
  const handleJoin = (campaign) => {
    showToast(`Joined "${campaign.title}"! Create your entry now 🎉`, 'success');
    setSelectedCampaign(null);
  };
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header - Pet Challenges 🐱🐶💻 */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-coral text-white">
        <div className="px-4 py-5">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-accent-gold animate-bounce" />
            Pet Challenges
            <span className="text-xl">🐱🐶</span>
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Win prizes with your pet coding memes! 💻🏆
          </p>
        </div>
      </header>
      
      <div className="p-4 space-y-8">
        {/* Quick stats - Coding themed! 💻 */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="card p-4 text-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
          >
            <Gift className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              $5K+ 💰
            </p>
            <p className="text-xs text-lmeow-muted">Prizes (in treats!)</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="card p-4 text-center bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20"
          >
            <Users className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
            <p className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              42.0K 🐱🐶
            </p>
            <p className="text-xs text-lmeow-muted">Pet Coders</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="card p-4 text-center bg-gradient-to-br from-accent-gold/20 to-accent-peach/20"
          >
            <Star className="w-6 h-6 text-accent-gold mx-auto mb-2" />
            <p className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark">
              1337 🏆
            </p>
            <p className="text-xs text-lmeow-muted">Meme Legends</p>
          </motion.div>
        </div>
        
        {/* Active challenges - Coding themed! 🔥 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
              Hot Challenges 🔥
            </h2>
            <span className="badge bg-gradient-to-r from-primary-500 to-accent-coral text-white">{activeCampaigns.length} Live! 🐱🐶</span>
          </div>
          
          <div className="space-y-4">
            {activeCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                {/* Cover image */}
                <div className="relative h-40">
                  <img
                    src={campaign.coverImage}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Pet-only fallback! 🐱🐶
                      e.target.src = Math.random() > 0.5 
                        ? 'https://cataas.com/cat?width=600&height=400&t=campaign' 
                        : 'https://placedog.net/600/400?id=campaign';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Days left badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-lmeow-card-dark/90 backdrop-blur-sm rounded-full">
                    <Clock className="w-4 h-4 text-accent-coral" />
                    <span className="text-sm font-bold text-lmeow-text dark:text-lmeow-text-dark">
                      ⏰ {campaign.daysLeft} days!
                    </span>
                  </div>
                  
                  {/* Brand logo */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-lg">
                      {campaign.brandLogo}
                    </div>
                    <span className="text-white font-semibold drop-shadow-lg">
                      {campaign.brand}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-heading text-lg font-bold text-lmeow-text dark:text-lmeow-text-dark flex items-center gap-2">
                    {campaign.emoji || '🐾'} {campaign.title}
                    {campaign.hot && <span className="text-xs bg-accent-coral text-white px-2 py-0.5 rounded-full animate-pulse">HOT!</span>}
                  </h3>
                  
                  <p className="text-sm text-lmeow-muted mt-2">
                    {campaign.description}
                  </p>
                  
                  {/* Prize */}
                  <div className="flex items-start gap-2 mt-4 p-3 bg-accent-gold/10 rounded-xl">
                    <Gift className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {campaign.prize}
                    </p>
                  </div>
                  
                  {/* Stats & action */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-lmeow-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.entries.toLocaleString()} entries
                      </span>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCampaign(campaign)}
                      className="btn-primary flex items-center gap-2 text-sm py-2"
                    >
                      Join Now
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Past winners - Meme Legends Hall of Fame 🏆 */}
        <section>
          <h2 className="font-heading text-xl font-bold text-lmeow-text dark:text-lmeow-text-dark mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-gold" />
            Meme Legends 🏆🐱🐶
          </h2>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
            {pastWinners.map((winner) => (
              <Link
                key={winner.id}
                to={`/profile/${winner.id}`}
                className="flex-shrink-0 w-32 text-center group"
              >
                <div className="relative">
                  <img
                    src={winner.image}
                    alt={winner.petName}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-accent-gold/30 group-hover:border-accent-gold transition-colors"
                    onError={(e) => {
                      // Pet winner fallback! 🐱🐶
                      e.target.src = winner.petType === 'dog' 
                        ? 'https://placedog.net/100/100?id=winner' 
                        : 'https://cataas.com/cat?width=100&height=100&t=winner';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="font-semibold text-sm text-lmeow-text dark:text-lmeow-text-dark mt-3 truncate group-hover:text-primary-500 transition-colors">
                  {winner.petName} {winner.petType === 'dog' ? '🐶' : '🐱'}
                </p>
                <p className="text-xs text-lmeow-muted truncate">
                  {winner.prize}
                </p>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Brand partners - Coding companies welcome! 💼 */}
        <section className="card p-6 text-center bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900/20 dark:to-primary-900/20">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Package className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          </motion.div>
          <h3 className="font-heading text-lg font-bold text-lmeow-text dark:text-lmeow-text-dark">
            Are you a tech/pet brand? 💼🐾
          </h3>
          <p className="text-sm text-lmeow-muted mt-2 mb-4">
            Partner with us! Reach millions of pet-loving developers with coding meme campaigns! 😹🐶💻
          </p>
          <button className="btn-primary flex items-center gap-2 mx-auto">
            <span>🤝</span>
            Let's Collaborate!
          </button>
        </section>
      </div>
      
      {/* Campaign detail modal */}
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setSelectedCampaign(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-lmeow-card-dark rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            
            <h2 className="font-heading text-2xl font-bold text-lmeow-text dark:text-lmeow-text-dark flex items-center gap-2">
              {selectedCampaign.emoji || '🐾'} {selectedCampaign.title}
            </h2>
            
            <p className="text-lmeow-muted mt-2">
              {selectedCampaign.description}
            </p>
            
            {/* Prize */}
            <div className="flex items-start gap-3 mt-6 p-4 bg-accent-gold/10 rounded-2xl">
              <Gift className="w-6 h-6 text-accent-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">Prize</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{selectedCampaign.prize}</p>
              </div>
            </div>
            
            {/* Requirements */}
            <div className="mt-6">
              <h3 className="font-semibold text-lmeow-text dark:text-lmeow-text-dark mb-3 flex items-center gap-2">
                📋 Requirements (for cats & dogs only!)
              </h3>
              <ul className="space-y-2">
                {selectedCampaign.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-lmeow-muted">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            <Link
              to="/create"
              onClick={() => handleJoin(selectedCampaign)}
              className="btn-primary w-full mt-8 text-center block flex items-center justify-center gap-2"
            >
              <span>🚀</span> Join & Create Your Meme!
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
