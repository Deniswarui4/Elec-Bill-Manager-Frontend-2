import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'TECHNICIAN', 'LANDLORD'] },
    { path: '/users', label: 'Users', roles: ['ADMIN'] },
    { path: '/meters', label: 'Meters', roles: ['ADMIN'] },
    { path: '/readings', label: 'Readings', roles: ['ADMIN', 'TECHNICIAN'] },
    { path: '/bills', label: 'Bills', roles: ['ADMIN', 'LANDLORD'] },
  ];

  const visibleNavItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 
                className="text-xl font-semibold text-gray-900 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                Electricity Billing System
              </h1>
              
              <nav className="hidden md:flex space-x-4">
                {visibleNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                  {user?.role}
                </span>
                <span className="text-sm text-gray-700">
                  {user?.name || user?.phoneNumber}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden bg-gray-50 border-t">
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {visibleNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
