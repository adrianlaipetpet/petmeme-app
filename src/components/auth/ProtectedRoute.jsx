import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const { user, isOnboarded, isLoading } = useAuthStore();
  const location = useLocation();
  
  // Still loading auth state
  if (isLoading) {
    return null;
  }
  
  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Logged in but needs onboarding
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}
