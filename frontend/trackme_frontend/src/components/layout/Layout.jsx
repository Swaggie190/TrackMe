import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: ClockIcon,
      current: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      name: 'Time Entries',
      href: '/time-entries',
      icon: DocumentTextIcon,
      current: location.pathname === '/time-entries',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      current: location.pathname === '/profile',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and desktop navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                  TrackMe
                </Link>
              </div>
              
              {/* Desktop navigation links */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      item.current
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User menu and mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="hidden lg:flex items-center text-sm text-gray-600">
                <span>Welcome, {user?.display_name || 'User'}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                Logout
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                  item.current
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
            
            {/* Mobile user info and logout */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-2 text-sm text-gray-600">
                Welcome, {user?.display_name || 'User'}
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;