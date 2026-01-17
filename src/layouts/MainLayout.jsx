import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/navigation/BottomNav';

export default function MainLayout() {
  const location = useLocation();
  
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-petmeme-bg dark:bg-petmeme-bg-dark">
      {/* Main content area */}
      <motion.main 
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex-1 pb-20 overflow-y-auto no-scrollbar"
      >
        <Outlet />
      </motion.main>
      
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
