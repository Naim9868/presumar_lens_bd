'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Gift
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
      { name: 'Customer Report', href: '/admin/analytics/customers', icon: Users }
    ]
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: Gift,
    submenu: [
      { name: 'Campaigns', href: '/admin/marketing/campaigns', icon: Bell },
      { name: 'Newsletter', href: '/admin/marketing/newsletter', icon: FileText }
    ]
  },
  {
    name: 'Shipping',
    href: '/admin/shipping',
    icon: Truck
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    submenu: [
      { name: 'General', href: '/admin/settings/general', icon: Settings },
      { name: 'Payment', href: '/admin/settings/payment', icon: Shield },
      { name: 'Notifications', href: '/admin/settings/notifications', icon: Bell }
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
  
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarClasses = `
    fixed top-0 left-0 z-30 h-full bg-gradient-to-b from-gray-900 to-gray-800 
    transition-all duration-300 ease-in-out
    ${isMobile ? 'w-64 shadow-xl' : 'w-64 lg:w-64'}
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
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-amber-500" />
            <span className="text-xl font-bold text-white">Lens<span className="text-amber-500">Admin</span></span>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <div key={item.href}>
                {item.submenu ? (
                  <div className="group">
                    <div className={`
                      flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-colors duration-200 cursor-pointer
                      ${isActive(item.href) 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}>
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={isMobile ? onClose : undefined}
                          className={`
                            flex items-center px-3 py-2 text-sm rounded-lg
                            transition-colors duration-200
                            ${pathname === subItem.href
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }
                          `}
                        >
                          <subItem.icon className="mr-3 h-4 w-4" />
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={`
                      flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-colors duration-200
                      ${isActive(item.href) 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={() => {
              // Implement logout logic
              localStorage.removeItem('admin_token');
              window.location.href = '/admin/login';
            }}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 
                     rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}