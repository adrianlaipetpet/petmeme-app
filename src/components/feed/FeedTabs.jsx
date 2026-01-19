import { motion } from 'framer-motion';
import { useFeedStore } from '../../store/feedStore';

const tabs = [
  { id: 'foryou', label: 'For You', emoji: '✨' },
  { id: 'following', label: 'Following', emoji: '👥' },
];

export default function FeedTabs() {
  const { activeTab, setActiveTab } = useFeedStore();
  
  return (
    <div className="flex justify-center gap-2 px-4 pb-3">
      {tabs.map(({ id, label, emoji }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`relative px-5 py-2 rounded-full font-medium text-sm transition-colors ${
            activeTab === id
              ? 'text-white'
              : 'text-petmeme-muted hover:text-petmeme-text dark:hover:text-petmeme-text-dark'
          }`}
        >
          {activeTab === id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-coral rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span>{emoji}</span>
            <span>{label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
