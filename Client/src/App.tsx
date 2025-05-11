import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Transactions from './pages/Transactions';
import Memberships from './pages/Memberships';
import Donations from './pages/Donations';
import Notice from './pages/Notice';
import Users from './pages/Users';
import LocationManagement from './pages/LocationManagement';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="memberships" element={<Memberships />} />
          <Route path="donations" element={<Donations />} />
          <Route path="notices" element={<Notice />} />
          <Route path="users" element={<Users />} />
          <Route path="locations" element={<LocationManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;