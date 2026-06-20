import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitProfile from './pages/SubmitProfile';
import ProfileDetail from './pages/ProfileDetail';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!['admin', 'investigator', 'organization'].includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="submit" element={<SubmitProfile />} />
            <Route path="profile/:id" element={<ProfileDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
