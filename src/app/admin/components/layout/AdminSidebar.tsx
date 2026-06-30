'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  Ticket,
  Users,
  Settings,
  LogOut,
  Camera,
  TrendingUp,
  Tag,
  Truck,
  Bell,
  Shield,
  BarChart3,
  FileText,
  Gift,
  ChevronRight,
  ChevronDown,
  Star,
  Send,
  ScanSearch,
  Navigation,
  MapPin,
  Activity
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    submenu: [
      { name: 'All Products', href: '/admin/products', icon: Package },
      { name: 'Add New', href: '/admin/products/create', icon: Camera },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      { name: 'Brands', href: '/admin/brands', icon: Tag }
    ]
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    badge: 12
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users
  },
  {
    name: 'Reviews',
    href: '/admin/reviews',
    icon: Star
  },
  {
    name: 'Coupons',
    href: '/admin/coupons',
    icon: Ticket
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    submenu: [
      { name: 'Sales Report', href: '/admin/analytics/sales', icon: TrendingUp },
      { name: 'Inventory Report', href: '/admin/analytics/inventory', icon: Package },
      { name: 'Customer Report', href: '/admin/analytics/customers', icon: Users },
      { name: 'Product Performance', href: '/admin/analytics/product_performance', icon: Activity }
    ]
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: Gift,
    submenu: [
      { name: 'Campaigns', href: '/admin/marketing/campaigns', icon: Bell },
      { name: 'Newsletter', href: '/admin/marketing/newsletter', icon: FileText },
      { name: 'Marketing Attribution', href: '/admin/marketing/attribution', icon: BarChart3 }
    ]
  },
  {
    name: 'Accounting',
    href: '/admin/accounting',
    icon: FileText,
    submenu: [
      { name: 'Business Dashboard', href: '/admin/accounting/dashboard', icon: BarChart3 },
      { name: 'Invoices', href: '/admin/accounting/invoices', icon: FileText},
      { name: 'Suppliers', href: '/admin/accounting/suppliers', icon: Users },
      { name: 'Purcheses', href: '/admin/accounting/purcheses', icon: ShoppingCart },
      { name: 'Expenses', href: '/admin/accounting/expenses', icon: FileText }
    ]
  },
  {
    name: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
    submenu: [
      { name: 'Shipments', href: '/admin/shipping/shipments', icon: Truck },
      { name: 'Courier Bookings', href: '/admin/shipping/courier_booking', icon: ScanSearch },
      { name: 'Tracking', href: '/admin/shipping/tracking', icon: Navigation },
      { name: 'Delivery Zones', href: '/admin/shipping/delivery_zones', icon: MapPin }
    ]
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    submenu: [
      { name: 'General', href: '/admin/settings/general', icon: Settings },
      { name: 'Payment', href: '/admin/settings/payment', icon: Shield },
      { name: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
      { name: 'API Settings', href: '/admin/settings/api', icon: Settings, badge: 2},
      { name: 'Merketing Tools', href: '/admin/settings/marketing', icon: Gift },
      { name: 'SMS Setting', href: '/admin/settings/sms', icon: Send }
    ]
  }
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function AdminSidebar({ isOpen, onClose, isMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  
  // Initialize open submenus based on current path
  useEffect(() => {
    const newOpenSubmenus: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.submenu) {
        const isActive = item.submenu.some(subItem => pathname.startsWith(subItem.href));
        if (isActive) {
          newOpenSubmenus[item.href] = true;
        }
      }
    });
    setOpenSubmenus(prev => ({ ...prev, ...newOpenSubmenus }));
  }, [pathname]);
  
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const toggleSubmenu = (href: string) => {
    setOpenSubmenus(prev => ({ ...prev, [href]: !prev[href] }));
  };
  
  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const sidebarClasses = `
    fixed top-0 left-0 z-30 h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 
    transition-all duration-300 ease-in-out shadow-xl
    ${isMobile ? 'w-72' : 'w-64 lg:w-72'}
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <aside className={sidebarClasses}>
        {/* Logo Area */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-gray-700">
          <Link href="/admin" className="flex items-center gap-2" onClick={handleLinkClick}>
            <Camera className="h-7 w-7 text-amber-500" />
            <span className="text-xl font-bold text-white">Lens<span className="text-amber-500">Admin</span></span>
          </Link>
          {isMobile && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <div key={item.href}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.href)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                        transition-all duration-200 cursor-pointer
                        ${isActive(item.href) 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                        {openSubmenus[item.href] ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </div>
                    </button>
                    
                    {/* Submenu */}
                    <div
                      className={`
                        grid transition-all duration-300 ease-in-out
                        ${openSubmenus[item.href] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                      `}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={handleLinkClick}
                              className={`
                                flex items-center px-3 py-2 text-sm rounded-lg
                                transition-all duration-200 pl-11
                                ${pathname === subItem.href
                                  ? 'bg-gray-700 text-white'
                                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }
                              `}
                            >
                              <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-all duration-200
                      ${isActive(item.href) 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
        
        {/* Footer - Logout */}
        <div className="shrink-0 border-t border-gray-700 p-4">
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/admin/login';
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 
                     rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}