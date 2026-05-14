import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SetupRestaurantPage from '@/pages/SetupRestaurantPage';
import { Home } from '@/pages/Home';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireRestaurant } from '@/components/RequireRestaurant';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <SetupRestaurantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RequireRestaurant>
              <Home />
            </RequireRestaurant>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
