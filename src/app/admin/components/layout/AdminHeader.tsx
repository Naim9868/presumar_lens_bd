'use client';

import { useState, useEffect } from 'react';
import { Menu, Search, Bell, User, ChevronDown, Sun, Moon, Settings, HelpCircle, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order received', message: 'Order #12345 has been placed', time: '5 min ago', read: false, type: 'order' },
    { id: 2, title: 'Low stock alert', message: 'Canon 50mm lens is running low', time: '1 hour ago', read: false, type: 'inventory' },
    { id: 3, title: 'Payment successful', message: 'Payment of $1,299 received', time: '2 hours ago', read: true, type: 'payment' },
  ]);

  useEffect(() => {
    // Check system preference for dark mode
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('darkMode'));
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search logic
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Logo - visible on mobile when sidebar is hidden */}
          <Link href="/admin" className="flex items-center gap-2 lg:hidden">
            <div className="relative w-8 h-8">
              <Image
                src="/images/logo/prosumer_logo (1).png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-white">Admin</span>
          </Link>
          
          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 lg:w-96 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </form>
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Button - Mobile */}
          <button 
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
            onClick={() => {
              // Handle mobile search
              const searchInput = document.getElementById('mobile-search-input');
              if (searchInput) searchInput.focus();
            }}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          {/* Help - Desktop */}
          <button className="hidden lg:block rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 animate-slide-down">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-amber-50 dark:bg-gray-700/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href="/admin/notifications"
                      className="block text-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 lg:block">
                Admin User
              </span>
              <ChevronDown className="hidden h-4 w-4 text-gray-500 dark:text-gray-400 lg:block" />
            </button>
            
            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 animate-slide-down">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Admin User
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        admin@lensstore.com
                      </p>
                    </div>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Your Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        localStorage.removeItem('admin_token');
                        window.location.href = '/admin/login';
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar - Hidden by default, can be toggled */}
      <div className="md:hidden px-4 pb-3 hidden">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="mobile-search-input"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </form>
      </div>
    </header>
  );
}