'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Next<span className="text-blue-600">Merce</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link 
              href="/shop" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Shop
            </Link>
            <Link 
              href="/products" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Products
            </Link>
            <Link 
              href="/pages" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Pages
            </Link>
            <Link 
              href="/blog" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Blog
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/shop" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/pages" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pages
              </Link>
              <Link 
                href="/blog" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex space-x-4 pt-2 border-t border-gray-100 mt-2">
                <button className="flex items-center space-x-2 px-2 py-1">
                  <Search className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Search</span>
                </button>
                <button className="flex items-center space-x-2 px-2 py-1">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Account</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;