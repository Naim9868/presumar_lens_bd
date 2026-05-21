"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CustomSelect from "./CustomSelect";
import { menuData } from "./menuData";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
// import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { useCartContext } from "@/app/context/CartContext";
import { useWishlistContext } from "@/app/context/WishlistContext";
import Image from "next/image";
import { Menu, X, Search, User, ShoppingBag, Phone, Heart, Eye } from "lucide-react";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const { openCartModal } = useCartModalContext();
  const { openWishlistModal } = useWishlistModalContext();
 
  const { cartCount, cartTotal } = useCartContext();
  const { wishlistCount } = useWishlistContext();
  // const totalPrice = useSelector(selectTotalPrice);
  const totalPrice = cartTotal;

  const handleOpenCartModal = () => {
    openCartModal();
  };

  const handleOpenWishlistModal = () => {
    openWishlistModal();
  };

  // Handle sticky menu and auto-hide for navigation
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
    }

    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setNavigationOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const options = [
    { label: "All Categories", value: "0" },
    { label: "Desktop", value: "1" },
    { label: "Laptop", value: "2" },
    { label: "Monitor", value: "3" },
    { label: "Phone", value: "4" },
    { label: "Watch", value: "5" },
    { label: "Mouse", value: "6" },
    { label: "Tablet", value: "7" },
  ];

  return (
    <header className="fixed left-0 top-0 w-full z-[999] transition-shadow duration-300">
      {/* Main Header Top - Always Visible */}
      <div className="w-full bg-[#191970]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
          <div
            className={`flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4 transition-all duration-200 ${
              stickyMenu ? "py-2 lg:py-3" : "py-3 lg:py-4"
            }`}
          >
            {/* Logo - Left Side */}
            <div className="flex items-center justify-between w-full lg:w-auto">
              <Link className="flex-shrink-0" href="/">
                <div className="relative w-[130px] h-[50px] sm:w-[150px] sm:h-[55px] lg:w-[160px] lg:h-[60px]">
                  <Image
                    src="/images/logo/prosumer_logo (1).png"
                    alt="Logo"
                    fill
                    sizes="(max-width: 768px) 150px, 200px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              {/* Mobile Icons Group */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>

                {/* Mobile Wishlist Button */}
                <button
                  onClick={handleOpenWishlistModal}
                  className="relative p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5 text-white" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </button>

                {/* Mobile Cart Button */}
                <button
                  onClick={handleOpenCartModal}
                  className="relative p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setNavigationOpen(!navigationOpen)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Menu"
                >
                  {navigationOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Search Box - Desktop */}
            <div className="hidden lg:block w-[500px] xl:w-[600px]">
              <form>
                <div className="flex items-center gap-3">
                  <CustomSelect options={options} />
                  <div className="relative flex-1">
                    <input
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                      type="search"
                      name="search"
                      id="search"
                      placeholder="I am shopping for..."
                      autoComplete="off"
                      className="w-full rounded-[20px] bg-gray-50 border border-gray-300 py-2 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                    <button
                      type="submit"
                      aria-label="Search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Side Icons - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="block text-[10px] text-white uppercase">24/7 SUPPORT</span>
                  <p className="font-medium text-xs text-white">+8801521529868</p>
                </div>
              </div>

              <div className="w-px h-6 bg-white/20"></div>

              {/* Desktop Wishlist Button */}
              <button
                onClick={handleOpenWishlistModal}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              >
                <div className="relative">
                  <Heart className="w-5 h-5 text-white group-hover:text-red-400 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-white/70 uppercase">Wishlist</span>
                  <p className="font-medium text-xs text-amber-100">
                    {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </button>

              {/* Desktop Cart Button */}
              <button
                onClick={handleOpenCartModal}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-white group-hover:text-blue-400 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-white/70 uppercase">Cart</span>
                  <p className="font-medium text-xs text-amber-100">
                    ${totalPrice?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="lg:hidden pb-3 animate-fade-in">
              <form>
                <div className="relative w-full">
                  <input
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                    type="search"
                    placeholder="I am shopping for..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section Bottom */}
      <div
        className={`bg-amber-50 transition-all duration-300 ease-in-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
          <div className="relative">
            {/* Mobile Navigation Menu */}
            <div
              className={`lg:hidden absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-50 ${
                navigationOpen
                  ? "opacity-100 visible translate-y-0 max-h-[80vh] overflow-y-auto"
                  : "opacity-0 invisible -translate-y-2 max-h-0"
              }`}
            >
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  {/* Mobile Wishlist Item */}
                  <button
                    onClick={() => {
                      handleOpenWishlistModal();
                      setNavigationOpen(false);
                    }}
                    className="flex items-center gap-3 py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm w-full"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {wishlistCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Cart Item */}
                  <button
                    onClick={() => {
                      handleOpenCartModal();
                      setNavigationOpen(false);
                    }}
                    className="flex items-center gap-3 py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm w-full"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="font-medium">Cart</span>
                    {cartCount > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {cartCount}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/recently-viewed"
                    className="flex items-center gap-3 py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                    onClick={() => setNavigationOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">Recently Viewed</span>
                  </Link>

                  <Link
                    href="/account"
                    className="flex items-center gap-3 py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                    onClick={() => setNavigationOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Account</span>
                  </Link>

                  <div className="flex items-center gap-3 py-2 px-3">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="block text-[10px] text-gray-500">24/7 SUPPORT</span>
                      <p className="font-medium text-xs">+8801521529868</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <Link
                  href="/recently-viewed"
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Recently Viewed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;