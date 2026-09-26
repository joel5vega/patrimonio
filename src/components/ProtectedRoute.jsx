import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2b7fff] border-t-transparent rounded animate-spin" />
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
