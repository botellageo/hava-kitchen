import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import PairPage from '@/pages/PairPage';
import SetupRestaurantPage from '@/pages/SetupRestaurantPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import CuisiniersPage from '@/pages/admin/CuisiniersPage';
import TemplatesPage from '@/pages/admin/TemplatesPage';
import ParametresPage from '@/pages/admin/ParametresPage';
import CuisinierSelectPage from '@/pages/cuisine/CuisinierSelectPage';
import CuisineHomePage from '@/pages/cuisine/CuisineHomePage';
import ReceptionPage from '@/pages/cuisine/ReceptionPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireRestaurant } from '@/components/RequireRestaurant';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pair" element={<PairPage />} />
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <SetupRestaurantPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <RequireRestaurant>
              <AdminLayout />
            </RequireRestaurant>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/cuisiniers" element={<CuisiniersPage />} />
        <Route path="/admin/templates" element={<TemplatesPage />} />
        <Route path="/admin/parametres" element={<ParametresPage />} />
      </Route>
      <Route
        path="/cuisine"
        element={
          <ProtectedRoute>
            <RequireRestaurant>
              <CuisinierSelectPage />
            </RequireRestaurant>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cuisine/home"
        element={
          <ProtectedRoute>
            <RequireRestaurant>
              <CuisineHomePage />
            </RequireRestaurant>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cuisine/reception"
        element={
          <ProtectedRoute>
            <RequireRestaurant>
              <ReceptionPage />
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
