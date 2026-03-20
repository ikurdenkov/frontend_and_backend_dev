import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import UsersPage from './pages/UsersPage/UsersPage';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={
        <PrivateRoute>
          <ProductsPage />
        </PrivateRoute>
      } />
      <Route path="/users" element={
        <RoleBasedRoute allowedRoles={['admin']}>
          <UsersPage />
        </RoleBasedRoute>
      } />
      <Route path="/" element={<Navigate to="/products" />} />
      <Route path="*" element={<Navigate to="/products" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;