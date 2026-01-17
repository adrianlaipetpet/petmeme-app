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
      showToast('Welcome to PetMeme Hub! 🐾', 'success');
    } catch (error) {
      console.error('Google login error:', error);
      showToast('Failed to sign in with Google', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created! Welcome! 🎉', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back! 🐾', 'success');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      const message = error.code === 'auth/user-not-found' 
        ? 'No account found with this email'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : error.code === 'auth/email-already-in-use'
        ? 'Email already registered'
        : 'Authentication failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-8"
    >
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block mb-4"
        >
          <div className="w-20 h-20 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#d946ef' }}/>
                  <stop offset="50%" style={{ stopColor: '#ff6b6b' }}/>
                  <stop offset="100%" style={{ stopColor: '#22c55e' }}/>
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="65" rx="25" ry="20" fill="url(#loginGradient)"/>
              <ellipse cx="30" cy="35" rx="10" ry="12" fill="url(#loginGradient)"/>
              <ellipse cx="50" cy="28" rx="10" ry="12" fill="url(#loginGradient)"/>
              <ellipse cx="70" cy="35" rx="10" ry="12" fill="url(#loginGradient)"/>
            </svg>
          </div>
        </motion.div>
        
        <h1 className="font-heading text-3xl font-bold text-gradient">
          PetMeme Hub
        </h1>
        <p className="text-petmeme-muted mt-2">
          {isSignUp ? 'Join the pet meme revolution!' : 'Welcome back, pet lover!'}
        </p>
      </div>
      
      {/* Google Sign In */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-petmeme-card-dark border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-semibold text-petmeme-text dark:text-petmeme-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
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
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-petmeme-muted text-sm">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>
      
      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-petmeme-muted" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="input-field pl-12"
            disabled={loading}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-petmeme-muted" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field pl-12 pr-12"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-petmeme-muted hover:text-primary-500"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      
      {/* Toggle Sign Up / Sign In */}
      <p className="text-center mt-6 text-petmeme-muted">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary-500 font-semibold hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
      
      {/* Demo Mode */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-petmeme-muted mb-3">
          Just want to explore? 👀
        </p>
        <button
          onClick={() => {
            // Set demo user directly in store
            const { setUser, setPet } = useAuthStore.getState();
            setUser({
              uid: 'demo-user-123',
              email: 'demo@petmemehub.com',
              displayName: 'Demo User',
              photoURL: null,
              isDemo: true,
            });
            setPet({
              id: 'demo-user-123',
              name: 'Sir Fluffington',
              type: '🐈 Cat',
              breed: 'Orange Tabby',
              behaviors: ['dramatic', 'foodie', 'lazy'],
              photoURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
              stats: {
                posts: 47,
                likes: 51112,
                followers: 12500,
                following: 342,
              },
            });
            showToast('Welcome to Demo Mode! 🐾', 'success');
          }}
          className="w-full py-4 bg-gradient-to-r from-accent-coral to-accent-sunset text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span className="text-xl">🐾</span>
          Try Demo Mode
        </button>
      </div>
    </motion.div>
  );
}
