import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Trophy, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Feed', emoji: '🏠' },
  { path: '/discover', icon: Search, label: 'Explore', emoji: '🔍' },
  { path: '/create', icon: PlusCircle, label: 'Create', isMain: true, emoji: '➕' },
  { path: '/campaigns', icon: Trophy, label: 'Meow Madness', emoji: '🏆' },
  { path: '/profile', icon: User, label: 'Me', emoji: '😸' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around bg-white/95 dark:bg-lmeow-card-dark/95 backdrop-blur-xl border-t-2 border-primary-100 dark:border-primary-900 px-2 py-2 shadow-lg">
          {navItems.map(({ path, icon: Icon, label, isMain, emoji }) => {
            const isActive = location.pathname === path;
            
            if (isMain) {
              return (
                <NavLink key={path} to={path} className="relative -mt-7">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 via-accent-coral to-secondary-500 flex items-center justify-center shadow-xl shadow-primary-500/40 border-4 border-white dark:border-lmeow-card-dark"
                  >
                    <PlusCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </motion.div>
                  {/* Sparkle effect */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                  </motion.div>
                </NavLink>
              );
            }
            
            return (
              <NavLink key={path} to={path} className="relative flex flex-col items-center py-2 px-3">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center transition-all duration-200 ${
                    isActive 
                      ? 'text-primary-500' 
                      : 'text-lmeow-muted dark:text-lmeow-muted-dark'
                  }`}
                >
                  {/* Show emoji when active, icon when not */}
                  {isActive ? (
                    <motion.span 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-2xl"
                    >
                      {emoji}
                    </motion.span>
                  ) : (
                    <Icon className="w-6 h-6 stroke-[2]" />
                  )}
                  <span className={`text-xs mt-0.5 font-semibold ${
                    isActive ? 'text-primary-500' : ''
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 w-6 h-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-coral"
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
