// 'use client';

// import { useSession, signIn, signOut } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { useUIStore } from '@/stores/uiStore';

// export function useAuth() {
//   const { data: session, status, update } = useSession();
//   const router = useRouter();
//   const { addToast } = useUIStore();

//   const login = async (email: string, password: string) => {
//     try {
//       const result = await signIn('credentials', {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         addToast(result.error, 'error');
//         return false;
//       }

//       addToast('Login successful!', 'success');
//       router.push('/admin');
//       router.refresh();
//       return true;
//     } catch (error) {
//       addToast('Login failed', 'error');
//       return false;
//     }
//   };

//   const logout = async () => {
//     await signOut({ redirect: false });
//     addToast('Logged out successfully', 'success');
//     router.push('/admin/login');
//     router.refresh();
//   };

//   const updateSession = async (data: any) => {
//     await update(data);
//   };

//   return {
//     user: session?.user,
//     isAuthenticated: status === 'authenticated',
//     isLoading: status === 'loading',
//     isAdmin: session?.user?.role === 'admin',
//     login,
//     logout,
//     updateSession,
//   };
// }