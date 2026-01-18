import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      // Theme (default to dark mode)
      isDarkMode: true,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        // Update HTML class for Tailwind dark mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', newMode);
          document.documentElement.classList.toggle('light', !newMode);
        }
        return { isDarkMode: newMode };
      }),
      
      // Modals & overlays
      activeModal: null, // 'create' | 'comments' | 'share' | 'settings' | null
      modalData: null,
      openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      
      // Bottom sheet
      bottomSheet: null,
      bottomSheetData: null,
      openBottomSheet: (name, data = null) => set({ bottomSheet: name, bottomSheetData: data }),
      closeBottomSheet: () => set({ bottomSheet: null, bottomSheetData: null }),
      
      // Toast notifications
      toasts: [],
      showToast: (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
          }));
        }, duration);
      },
      
      // Language
      language: 'en', // 'en' | 'zh'
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'petmeme-ui',
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        language: state.language 
      }),
    }
  )
);
