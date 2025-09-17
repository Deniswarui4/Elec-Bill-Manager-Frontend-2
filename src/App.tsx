import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Meters from './pages/Meters';
import Readings from './pages/Readings';
import Bills from './pages/Bills';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meters" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Meters />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/readings" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
                  <Readings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bills" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LANDLORD']}>
                  <Bills />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
