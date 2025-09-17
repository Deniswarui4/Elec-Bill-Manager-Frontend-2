import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './ui/Button';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['ADMIN', 'TECHNICIAN', 'LANDLORD'] },
    { path: '/users', label: 'User Management', icon: '👥', roles: ['ADMIN'] },
    { path: '/meters', label: 'Meter Management', icon: '⚡', roles: ['ADMIN'] },
    { path: '/readings', label: 'Meter Readings', icon: '📊', roles: ['ADMIN', 'TECHNICIAN'] },
    { path: '/bills', label: 'Bills & Payments', icon: '💰', roles: ['ADMIN', 'LANDLORD'] },
  ];

  const visibleNavItems = useMemo(() => {
    if (!user?.role) {
      return [];
    }
    return navigationItems.filter(item => item.roles.includes(user.role));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'TECHNICIAN':
        return 'bg-blue-100 text-blue-800';
      case 'LANDLORD':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem?.label || 'Dashboard';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar - Visible on medium screens and up */}
      <div className="hidden md:block bg-white shadow-lg w-64 h-screen flex-shrink-0">
        {/* Desktop sidebar content */}
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">
            ⚡ EBS
          </h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {visibleNavItems.length > 0 ? (
              visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-gray-500 text-sm">
                {loading ? 'Loading navigation...' : (user ? 'No navigation items available' : 'Please log in')}
              </li>
            )}
          </ul>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || user?.phoneNumber?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.phoneNumber}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user?.role || '')}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              🚪
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar - Visible on small screens only */}
      <div className={`md:hidden bg-white shadow-lg w-64 h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">
            ⚡ EBS
          </h1>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {visibleNavItems.length > 0 ? (
              visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-gray-500 text-sm">
                {loading ? 'Loading navigation...' : (user ? 'No navigation items available' : 'Please log in')}
              </li>
            )}
          </ul>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || user?.phoneNumber?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.phoneNumber}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user?.role || '')}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              🚪
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              {/* Hamburger menu for mobile screens */}
              <button
                className="md:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {getCurrentPageTitle()}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;