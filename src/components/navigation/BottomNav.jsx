import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Trophy, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Feed', emoji: '🏠' },
  { path: '/discover', icon: Search, label: 'Explore', emoji: '🔍' },
  { path: '/create', icon: PlusCircle, label: 'Create', isMain: true, emoji: '➕' },
  { path: '/campaigns', icon: Trophy, label: 'Challenges', emoji: '🏆' },
  { path: '/profile', icon: User, label: 'Me', emoji: '😸' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-evenly w-full bg-lmeow-card-dark/95 backdrop-blur-xl border-t border-primary-900/50 px-2 py-2 shadow-2xl rounded-t-2xl">
          {navItems.map(({ path, icon: Icon, label, isMain, emoji }) => {
            const isActive = location.pathname === path;
            
            if (isMain) {
              return (
                <NavLink key={path} to={path} className="relative -mt-6">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 via-accent-coral to-secondary-500 flex items-center justify-center shadow-xl shadow-primary-500/40 border-3 border-lmeow-card-dark"
                  >
                    <PlusCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </motion.div>
                  {/* Sparkle effect */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-accent-gold" />
                  </motion.div>
                </NavLink>
              );
            }
            
            return (
              <NavLink key={path} to={path} className="relative flex flex-col items-center py-2 px-4">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.15 }}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    isActive 
                      ? 'text-primary-400' 
                      : 'text-lmeow-muted-dark'
                  }`}
                >
                  {/* Show emoji when active, icon when not */}
                  {isActive ? (
                    <motion.span 
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-xl"
                    >
                      {emoji}
                    </motion.span>
                  ) : (
                    <Icon className="w-5 h-5 stroke-[2]" />
                  )}
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-primary-400' : ''
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute -bottom-0.5 w-5 h-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-coral"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
