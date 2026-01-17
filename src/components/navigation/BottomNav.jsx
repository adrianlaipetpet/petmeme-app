import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/discover', icon: Search, label: 'Discover' },
  { path: '/create', icon: PlusCircle, label: 'Create', isMain: true },
  { path: '/campaigns', icon: Trophy, label: 'Campaigns' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around bg-white/90 dark:bg-petmeme-card-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 px-2 py-2">
          {navItems.map(({ path, icon: Icon, label, isMain }) => {
            const isActive = location.pathname === path;
            
            if (isMain) {
              return (
                <NavLink key={path} to={path} className="relative -mt-6">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-coral flex items-center justify-center shadow-lg shadow-primary-500/30"
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </motion.div>
                </NavLink>
              );
            }
            
            return (
              <NavLink key={path} to={path} className="relative flex flex-col items-center py-2 px-4">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center transition-colors duration-200 ${
                    isActive 
                      ? 'text-primary-500' 
                      : 'text-petmeme-muted dark:text-petmeme-muted-dark'
                  }`}
                >
                  <Icon 
                    className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`}
                  />
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary-500' : ''}`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary-500"
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
