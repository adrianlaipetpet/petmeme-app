import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Splash from './pages/Splash';
import Login from './pages/auth/Login';
import Onboarding from './pages/auth/Onboarding';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import PostDetail from './pages/PostDetail';
import FilteredContent from './pages/FilteredContent';

// Components
import ToastContainer from './components/ui/ToastContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { setUser, setLoading, isLoading, user, isOnboarded } = useAuthStore();
  
  // Force dark mode only - no light mode for investor demo
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);
  
  // Listen to Firebase auth state
  useEffect(() => {
    const { setPet } = useAuthStore.getState();
    
    // Timeout to prevent infinite loading if Firebase isn't configured
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeout);
        if (firebaseUser) {
          // Set the user first
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          
          // Check if this user has a pet in Firestore (not just localStorage)
          // This prevents demo data from carrying over to real accounts
          try {
            const petDoc = await getDoc(doc(db, 'pets', firebaseUser.uid));
            if (petDoc.exists()) {
              // Real user with real pet data - use Firestore data
              const petData = petDoc.data();
              setPet({ id: petDoc.id, ...petData });
            } else {
              // Real user but no pet in Firestore - clear any demo data
              // This forces them to go through onboarding
              const currentPet = useAuthStore.getState().pet;
              if (currentPet?.id !== firebaseUser.uid) {
                // The stored pet doesn't match this user - clear it
                setPet(null);
              }
            }
            
            // Load following list from Firestore
            const { loadFollowingFromFirestore } = useAuthStore.getState();
            loadFollowingFromFirestore();
          } catch (error) {
            console.log('Could not fetch pet from Firestore:', error.message);
            // Keep existing behavior if Firestore fails
          }
        } else {
          setUser(null);
        }
      });
      
      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('Firebase auth error:', error);
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [setUser, setLoading]);
  
  // Show splash screen while loading
  if (isLoading) {
    return <Splash />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-petmeme-bg dark:bg-petmeme-bg-dark">
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route 
              path="/login" 
              element={user ? <Navigate to={isOnboarded ? "/" : "/onboarding"} /> : <Login />} 
            />
            <Route 
              path="/onboarding" 
              element={
                user 
                  ? (isOnboarded ? <Navigate to="/" /> : <Onboarding />) 
                  : <Navigate to="/login" />
              } 
            />
          </Route>
          
          {/* Protected routes with main layout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Explore />} />
            <Route path="/create" element={<Create />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:petId" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/browse/:type/:value" element={<FilteredContent />} />
            <Route path="/browse/:type" element={<FilteredContent />} />
          </Route>
          
          {/* Post detail (full screen) - PUBLIC so shared links work! */}
          <Route 
            path="/post/:postId" 
            element={<PostDetail />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Global toast notifications */}
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
