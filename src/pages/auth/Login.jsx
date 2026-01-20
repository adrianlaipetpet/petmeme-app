import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useUIStore } from '../../store/uiStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();
  
  // Handle redirect result when returning from Google sign-in
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for Google redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Google sign-in successful:', result.user.email);
          showToast('Welcome to Lmeow! 😸', 'success');
        }
      } catch (error) {
        console.error('❌ Google redirect error:', error.code, error.message);
        let message = 'Sign-in failed. Please try again 🙀';
        
        switch (error.code) {
          case 'auth/popup-blocked':
          case 'auth/popup-closed-by-user':
            // These shouldn't happen with redirect, but handle just in case
            message = 'Sign-in was interrupted. Please try again!';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Check your connection 📶';
            break;
          case 'auth/user-cancelled':
            message = 'Sign-in cancelled. Try again when ready! 😸';
            break;
          case 'auth/unauthorized-domain':
            message = 'Domain not authorized. Contact support 🔧';
            console.error('⚠️ Add this domain to Firebase Console → Authentication → Settings → Authorized domains');
            break;
          case 'auth/operation-not-allowed':
            message = 'Google sign-in not enabled. Contact support 🔧';
            break;
          case 'auth/invalid-credential':
            message = 'Invalid credentials. Please try again 🔄';
            break;
          default:
            message = `Sign-in error: ${error.code || 'unknown'}. Please try again 🙀`;
        }
        
        showToast(message, 'error');
      }
    };
    
    handleRedirectResult();
  }, []);
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('🔐 Starting Google sign-in...');
    
    try {
      // Use redirect - works on all browsers without popup blocking
      console.log('➡️ Redirecting to Google...');
      await signInWithRedirect(auth, googleProvider);
      // Page will redirect to Google, so we won't reach here
    } catch (error) {
      console.error('❌ Google login error:', error.code, error.message);
      let message = 'Oops! Something went wrong 🙀';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          message = 'Browser blocked the sign-in. Please try again!';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Check your connection 📶';
          break;
        case 'auth/unauthorized-domain':
          message = 'This domain is not authorized for sign-in 🔧';
          console.error('⚠️ Add domain to Firebase: Console → Authentication → Settings → Authorized domains');
          break;
        case 'auth/operation-not-allowed':
          message = 'Google sign-in is not enabled 🔧';
          break;
        default:
          message = `Error: ${error.code || error.message}. Please try again!`;
      }
      
      showToast(message, 'error');
      setLoading(false);
    }
  };
  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) {
      showToast('Fill in all the boxes, hooman! 🐱', 'error');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('That email looks sus... check it again! 🧐', 'error');
      return;
    }
    
    // Password length check (Firebase requires 6+ chars)
    if (password.length < 6) {
      showToast('Password needs at least 6 characters 💪', 'error');
      return;
    }
    
    setLoading(true);
    console.log(`🔐 Attempting ${isSignUp ? 'signup' : 'login'} with email:`, email);
    
    try {
      if (isSignUp) {
        console.log('📝 Creating new account...');
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Account created successfully!');
        showToast('Welcome to the fur family! 🎉', 'success');
      } else {
        console.log('🔑 Signing in...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Signed in successfully!');
        showToast('Welcome back, pet lover! 😸', 'success');
      }
    } catch (error) {
      console.error('❌ Email auth error:', error.code, error.message);
      let message = 'Something went wrong... blame the cat! 😹';
      
      switch (error.code) {
        // Sign-in errors
        case 'auth/user-not-found':
          message = 'No pet parent found with this email 🔍';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = isSignUp 
            ? 'This email may already be in use. Try signing in!'
            : 'Wrong email or password! Did the cat change it? 🙀';
          break;
        
        // Sign-up errors  
        case 'auth/email-already-in-use':
          message = 'This email already has a fur-ever home! Try signing in instead.';
          break;
        case 'auth/invalid-email':
          message = 'That email looks sus... check the format! 🧐';
          break;
        case 'auth/weak-password':
          message = 'Password too weak! Make it at least 6 characters 💪';
          break;
        
        // Configuration errors
        case 'auth/operation-not-allowed':
          message = 'Email signup is temporarily disabled. Try Google sign-in! 🔧';
          console.error('⚠️ Email/Password auth not enabled in Firebase Console!');
          break;
        case 'auth/configuration-not-found':
          message = 'App configuration error. Please try again later 🔧';
          break;
        
        // Rate limiting & network
        case 'auth/network-request-failed':
          message = 'Network error. Check your connection 📶';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts! Take a catnap and try later 😴';
          break;
        case 'auth/internal-error':
          message = 'Server error. Please try again in a moment 🔄';
          break;
          
        default:
          // Show the actual error code for debugging
          message = `Oops! Error: ${error.code || 'unknown'}. Please try again 🙀`;
          console.error('Unhandled auth error:', error);
      }
      
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
      
      {/* Logo + Tagline */}
      <div className="text-center mb-6 relative">
        <motion.img
          src="/lmeow-logo.png"
          alt="Lmeow"
          className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(236, 72, 153, 0.3))' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-3 text-base md:text-lg font-medium text-lmeow-text-dark"
        >
          {isSignUp ? (
            <>Paw-sitively Viral – Sign Up! <span className="text-primary-400">🐾</span></>
          ) : (
            <>Log in or your pet will judge you <span className="inline-block">😾</span></>
          )}
        </motion.p>
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
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 z-10 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input-field"
            style={{ paddingLeft: '3.5rem' }}
            disabled={loading}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 z-10 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input-field"
            style={{ paddingLeft: '3.5rem', paddingRight: '3.5rem' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lmeow-muted hover:text-primary-500 z-10"
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
    </motion.div>
  );
}
