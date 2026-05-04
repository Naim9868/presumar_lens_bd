// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token;
//     const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
//     // Redirect to login if not authenticated
//     if (isAdminRoute && !token) {
//       return NextResponse.redirect(new URL('/admin/login', req.url));
//     }
    
//     // Check admin role for admin routes (excluding login page)
//     if (isAdminRoute && token?.role !== 'admin' && req.nextUrl.pathname !== '/admin/login') {
//       return NextResponse.redirect(new URL('/admin/login', req.url));
//     }
    
//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => {
//         // Allow access to admin/login without token
//         return true;
//       },
//     },
//   }
// );

// export const config = {
//   matcher: ['/admin/:path*', '/api/admin/:path*']
// };