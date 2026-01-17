import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { reliableImages } from '../../data/demoData';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Welcome to Lmeow! 😸', 'success');
    } catch (error) {
      console.error('Google login error:', error);
      showToast('Oops! The cat knocked over the sign-in 🙀', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Fill in all the boxes, hooman! 🐱', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Welcome to the fur family! 🎉', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back, pet lover! 😸', 'success');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      const message = error.code === 'auth/user-not-found' 
        ? 'No pet parent found with this email 🔍'
        : error.code === 'auth/wrong-password'
        ? 'Wrong password! Did the cat change it? 🙀'
        : error.code === 'auth/email-already-in-use'
        ? 'This email already has a fur-ever home!'
        : 'Something went wrong... blame the cat! 😹';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-8 max-w-md mx-auto"
    >
      {/* Floating emojis background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.span 
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 left-4 text-3xl"
        >
          😹
        </motion.span>
        <motion.span 
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-8 right-8 text-2xl"
        >
          🐾
        </motion.span>
        <motion.span 
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          className="absolute bottom-12 left-8 text-3xl"
        >
          🐱
        </motion.span>
      </div>
      
      {/* 🎨 LOGO ONLY - No text beside it! */}
      <div className="text-center mb-8 relative">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 3, -3, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          className="inline-block mb-6"
        >
          {/* Logo Image - Medium size for login */}
          <img
            src="/lmeow-logo.png"
            alt="Lmeow"
            className="w-32 h-32 md:w-40 md:h-40 object-contain mx-auto drop-shadow-xl"
          />
        </motion.div>
        
        <p className="text-primary-500 font-semibold text-lg">
          Pet Coding Memes 🐱🐶💻
        </p>
        <p className="text-lmeow-muted mt-2">
          {isSignUp ? 'Join the purr-fect meme revolution! 🎉' : 'Welcome back, fur-iend! 🐾'}
        </p>
      </div>
      
      {/* Google Sign In */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-lmeow-card-dark border-2 border-primary-200 dark:border-primary-800 rounded-2xl font-semibold text-lmeow-text dark:text-lmeow-text-dark hover:border-primary-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
      
      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-primary-200 dark:bg-primary-800" />
        <span className="text-lmeow-muted text-sm">or use email</span>
        <div className="flex-1 h-px bg-primary-200 dark:bg-primary-800" />
      </div>
      
      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input-field pl-12"
            disabled={loading}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Super secret password"
            className="input-field pl-12 pr-12"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lmeow-muted hover:text-primary-500"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🐾
              </motion.span>
              Loading...
            </span>
          ) : isSignUp ? "Let's Go! 🚀" : "Sign Me In! 😸"}
        </button>
      </form>
      
      {/* Toggle Sign Up / Sign In */}
      <p className="text-center mt-6 text-lmeow-muted">
        {isSignUp ? 'Already part of the pack?' : "New to the litter?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary-500 font-semibold hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Join Now!'}
        </button>
      </p>
      
      {/* Demo Mode - Big & Fun */}
      <div className="mt-8 pt-6 border-t-2 border-dashed border-primary-200 dark:border-primary-800">
        <p className="text-center text-sm text-lmeow-muted mb-3">
          Just want to explore the chaos? 👀
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const { setUser, setPet } = useAuthStore.getState();
            setUser({
              uid: 'demo-user-123',
              email: 'demo@lmeow.app',
              displayName: 'Demo User',
              photoURL: null,
              isDemo: true,
            });
            setPet({
              id: 'demo-user-123',
              name: 'Sir Meowsalot',
              type: '🐈 Cat',
              breed: 'Orange Tabby',
              behaviors: ['dramatic', 'foodie', 'lazy'],
              photoURL: reliableImages.profile1,
              bio: 'Professional napper & treat enthusiast 🍗',
              stats: {
                posts: 47,
                likes: 51112,
                followers: 12500,
                following: 342,
              },
            });
            showToast('Welcome to the meme party! 🎉😸', 'success');
          }}
          className="w-full py-4 bg-gradient-to-r from-primary-500 via-accent-coral to-secondary-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
        >
          <img src="/lmeow-logo.png" alt="Lmeow" className="w-8 h-8 object-contain" />
          Try Demo Mode
          <span className="text-2xl">🐾</span>
        </motion.button>
        <p className="text-center text-xs text-lmeow-muted mt-2">
          No signup needed — dive right in!
        </p>
      </div>
    </motion.div>
  );
}
