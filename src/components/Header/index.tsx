"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CustomSelect from "./CustomSelect";
import { menuData } from "./menuData";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { selectWishlistCount } from "@/redux/features/wishlist-slice"
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
  const wishlistCount = useAppSelector(selectWishlistCount);

  const product = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  const handleOpenCartModal = () => {
    openCartModal();
  };

  const handleOpenWishlistModal = () => {
    openWishlistModal();
  }

  // Handle sticky menu and auto-hide for navigation
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Sticky menu shadow
    if (currentScrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }

    // Auto-hide/show navigation section based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down & past 100px - hide navigation
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up - show navigation
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
    <header
      className={`fixed left-0 top-0 w-full z-[9999] transition-shadow duration-300`}
    >
      {/* Main Header Top - Always Visible */}
      <div className="w-full bg-[#191970]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
          <div
            className={`flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4 transition-all duration-200 ${stickyMenu ? "py-2 lg:py-3" : "py-3 lg:py-4"
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
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              {/* Mobile Icons Group */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={handleOpenWishlistModal}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="relative">

                    <Heart className="w-4 h-4 font-extrabold text-white hover:text-blue-400" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleOpenCartModal}
                  className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {product.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {product.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setNavigationOpen(!navigationOpen)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
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

            {/* Search Box - Constant Width for All Devices */}
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
                      className="w-full rounded-[20px] bg-gray-50 border-l-0 border border-gray-300 py-2 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors text-sm"
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
                <Phone className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="block text-[10px] text-white uppercase">24/7 SUPPORT</span>
                  <p className="font-medium text-xs text-white">+8801521529868</p>
                </div>
              </div>

              <div className="w-px h-6 bg-gray-300"></div>

              <button
                onClick={handleOpenWishlistModal}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="relative">

                  <Heart className="w-4 h-4 font-extrabold text-white hover:text-blue-400" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] text-white uppercase">Wishlist</span>
                  <p className="font-medium text-xs text-amber-100">
                    ${totalPrice?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </button>

              <button
                onClick={handleOpenCartModal}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  {product.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {product.length}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] text-white uppercase">cart</span>
                  <p className="font-medium text-xs text-amber-100">
                    ${totalPrice?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar - Without Category Dropdown */}
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

      {/* Navigation Section - Auto Hide/Show on Scroll */}
      <div
        className={`bg-amber-50 z-20 transition-all duration-300 ease-in-out ${isNavVisible
          ? "translate-y-0 opacity-100"
          : "-translate-x-full z-10 opacity-0 hidden lg:block"
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
          <div className="relative">
            {/* Mobile Navigation Menu */}
            <div
              className={`lg:hidden absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-50 ${navigationOpen
                ? "opacity-100 visible translate-y-0 max-h-[80vh] overflow-y-auto"
                : "opacity-0 invisible -translate-y-2 max-h-0"
                }`}
            >
              <div className="p-4 space-y-3">
                {/* <nav className="space-y-1">
                  {menuData.map((menuItem, i) => {
                    console.log(menuItem);
                    return (
                    <div key={i}>
                      {menuItem.submenu ? (
                        <Dropdown
                          menuItem={menuItem}
                          stickyMenu={stickyMenu}
                          isMobile={true}
                        />
                      ) : (
                        <Link
                          href={menuItem.path}
                          className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                          onClick={() => setNavigationOpen(false)}
                        >
                          {menuItem.title}
                        </Link>
                      )}
                    </div>
                  )
                })}
                
                </nav> */}

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                    onClick={() => setNavigationOpen(false)}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">Wishlist</span>
                  </Link>

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
                      <p className="font-medium text-xs">(+965) 7492-3477</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation - This is the portion that auto-hides */}
            <div className="hidden lg:flex items-center justify-between">
              {/* <nav>
                <ul className="flex items-center gap-6 xl:gap-8">
                  {menuData.map((menuItem, i) => (
                    <React.Fragment key={i}>
                      {menuItem.submenu && menuItem.submenu.length > 0 ? (
                        <Dropdown
                          menuItem={menuItem}
                          stickyMenu={stickyMenu}
                        />
                      ) : (
                        <li className="relative">
                          <Link
                            href={menuItem.path}
                            className={`inline-block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors ${stickyMenu ? "py-3" : "py-4"
                              }`}
                          >
                            {menuItem.title}
                          </Link>
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </nav> */}

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