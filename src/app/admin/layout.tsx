'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
// import { useSession} from 'next-auth/react';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  // const router = useRouter();
  // const { data: session, status } = useSession();
  // const [isAuthorized, setIsAuthorized] = useState(false);

  // // Check authentication (implement your auth logic)
  //    useEffect(() => {
  //   // Check authentication
  //   if (status === 'unauthenticated') {
  //     router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
  //     return;
  //   }

  //   // Check admin role
  //   if (status === 'authenticated') {
  //     if (session?.user?.role !== 'admin') {
  //       router.push('/admin/login?error=access_denied');
  //       return;
  //     }
  //     setIsAuthorized(true);
  //   }
  // }, [status, session, router, pathname]);

 
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setMobileSidebarOpen(false);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

   // Show loading spinner while checking auth
    // || !isAuthorized
  // if (status === 'loading') {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
  //       <LoadingSpinner size="lg" />
  //     </div>
  //   );
  // }

  // Don't render anything if not authorized
  // if (!isAuthorized) {
  //   return null;
  // }


  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return ( 

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={false}
        />

        {/* Mobile Sidebar */}
        <AdminSidebar 
          isOpen={mobileSidebarOpen} 
          onClose={() => setMobileSidebarOpen(false)}
          isMobile={true}
        />

        {/* Main Content */}
        <div className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}>
          <AdminHeader 
            onMenuClick={() => {
              if (window.innerWidth < 1024) {
                setMobileSidebarOpen(true);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            // user={session?.user}
          />
          
          <main className="p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    
  );
}