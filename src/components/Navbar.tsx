// app/components/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  Menu, 
  X,
  User,
  Trash2,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react';

// Types for cart and favorite items
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isFavoriteDrawerOpen, setIsFavoriteDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const cartDrawerRef = useRef<HTMLDivElement>(null);
  const favoriteDrawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Sample cart data
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Premium Blue Light Blocking Glasses',
      price: 89.99,
      quantity: 1,
      image: '/api/placeholder/80/80'
    },
    {
      id: '2',
      name: 'Designer Sunglasses - Amber Edition',
      price: 149.99,
      quantity: 2,
      image: '/api/placeholder/80/80'
    }
  ]);

  // Sample favorites data
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([
    {
      id: '3',
      name: 'Polarized Sports Sunglasses',
      price: 129.99,
      image: '/api/placeholder/80/80'
    },
    {
      id: '4',
      name: 'Reading Glasses - Classic Gold',
      price: 59.99,
      image: '/api/placeholder/80/80'
    },
    {
      id: '5',
      name: 'Transition Lenses - Photochromic',
      price: 199.99,
      image: '/api/placeholder/80/80'
    }
  ]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const favoriteCount = favoriteItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchExpanded(false);
        setIsCartDrawerOpen(false);
        setIsFavoriteDrawerOpen(false);
        setIsMenuOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef) {
      searchInputRef.focus();
    }
  }, [isSearchExpanded, searchInputRef]);

  // Handle body scroll when any drawer is open
  useEffect(() => {
    if (isMenuOpen || isCartDrawerOpen || isFavoriteDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, isCartDrawerOpen, isFavoriteDrawerOpen]);

  // Close drawers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node) && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (cartDrawerRef.current && !cartDrawerRef.current.contains(e.target as Node) && isCartDrawerOpen) {
        setIsCartDrawerOpen(false);
      }
      if (favoriteDrawerRef.current && !favoriteDrawerRef.current.contains(e.target as Node) && isFavoriteDrawerOpen) {
        setIsFavoriteDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isCartDrawerOpen, isFavoriteDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  };

  // Cart handlers
  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Favorite handlers
  const removeFromFavorites = (id: string) => {
    setFavoriteItems(favoriteItems.filter(item => item.id !== id));
  };

  const moveToCart = (item: FavoriteItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      updateCartQuantity(item.id, existingItem.quantity + 1);
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
    removeFromFavorites(item.id);
    setIsFavoriteDrawerOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Collections', href: '/collections' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-amber-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Mobile Menu Button - Left Side */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 z-20 relative"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>

            {/* Logo / Shop Name */}
            <Link 
              href="/" 
              className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-0 lg:translate-x-0 font-bold text-xl md:text-2xl tracking-tight"
            >
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                Presumer
              </span>
              <span className="text-gray-800">Lens</span>
              <span className="text-amber-600">BD</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8 ml-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-amber-600 ${
                    pathname === link.href 
                      ? 'text-amber-600 border-b-2 border-amber-500 pb-1' 
                      : 'text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="relative p-2 rounded-full hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Search"
              >
                <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-gray-700" />
              </button>

              {/* Favorite Icon */}
              <button
                onClick={() => setIsFavoriteDrawerOpen(true)}
                className="relative p-2 rounded-full hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Favorites"
              >
                <Heart className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-gray-700" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shadow-sm">
                    {favoriteCount}
                  </span>
                )}
              </button>

              {/* Cart Icon */}
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 rounded-full hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              <button className="hidden sm:flex ml-1 p-2 rounded-full hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <User className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Below Navbar */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isSearchExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-amber-100/50 bg-white/98 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={(el) => setSearchInputRef(el)}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for premium lenses, frames, accessories..."
                  className="w-full px-5 py-3 pr-12 text-gray-800 bg-gradient-to-r from-amber-50/50 to-white border border-amber-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700 p-2 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          style={{ top: '64px' }}
          onClick={() => setIsMenuOpen(false)} 
        />
      )}
      
      {/* Mobile Menu Drawer */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed left-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: '64px' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200'
                      : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-base font-medium">My Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div
        ref={cartDrawerRef}
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              Your Cart ({cartCount})
            </h2>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gradient-to-r from-amber-50/30 to-white rounded-lg border border-amber-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-amber-600">Image</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-medium text-sm">{item.name}</h3>
                      <p className="text-amber-600 font-bold mt-1">${item.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-gray-700 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto p-1 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-100 p-4 space-y-3 bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex justify-between text-gray-800">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold text-amber-600 text-lg">${cartTotal.toFixed(2)}</span>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Favorite Drawer */}
      <div
        ref={favoriteDrawerRef}
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isFavoriteDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Favorites ({favoriteCount})
            </h2>
            <button
              onClick={() => setIsFavoriteDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Favorite Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {favoriteItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No favorites yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gradient-to-r from-rose-50/30 to-white rounded-lg border border-rose-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-rose-600">Image</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-medium text-sm">{item.name}</h3>
                      <p className="text-amber-600 font-bold mt-1">${item.price}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => moveToCart(item)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromFavorites(item.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop overlays for drawers */}
      {(isCartDrawerOpen || isFavoriteDrawerOpen) && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => {
            setIsCartDrawerOpen(false);
            setIsFavoriteDrawerOpen(false);
          }}
        />
      )}

      {/* Spacer */}
      <div className={`h-16 md:h-20 transition-all duration-300 ${isSearchExpanded ? 'mb-16 md:mb-20' : ''}`} />
    </>
  );
};

export default Navbar;