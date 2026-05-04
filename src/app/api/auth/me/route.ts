// import { NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
// import { dbConnect } from '@/lib/dbConnect';
// import { User } from '@/models/User';

// export async function GET() {
//   try {
//     const session = await auth();
    
//     if (!session?.user?.email) {
//       return NextResponse.json({
//         success: false,
//         error: 'Unauthorized'
//       }, { status: 401 });
//     }

//     await dbConnect();
    
//     const user = await User.findOne({ email: session.user.email })
//       .select('-password')
//       .lean();
    
//     if (!user) {
//       return NextResponse.json({
//         success: false,
//         error: 'User not found'
//       }, { status: 404 });
//     }
    
//     return NextResponse.json({
//       success: true,
//       data: user
//     });
//   } catch (error: any) {
//     console.error('Error fetching user:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Failed to fetch user'
//     }, { status: 500 });
//   }
// }