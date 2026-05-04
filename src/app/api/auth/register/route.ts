// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/dbConnect';
// import { User } from '@/models/User';
// import bcrypt from 'bcryptjs';

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect();
//     const body = await request.json();
//     const { name, email, password, role = 'user' } = body;

//     // Validation
//     if (!name || !email || !password) {
//       return NextResponse.json({
//         success: false,
//         error: 'Name, email, and password are required'
//       }, { status: 400 });
//     }

//     // Check if user exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return NextResponse.json({
//         success: false,
//         error: 'User with this email already exists'
//       }, { status: 409 });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       isActive: true,
//     });

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     return NextResponse.json({
//       success: true,
//       data: userResponse,
//       message: 'User created successfully'
//     }, { status: 201 });
//   } catch (error: any) {
//     console.error('Registration error:', error);
//     return NextResponse.json({
//       success: false,
//       error: error.message || 'Failed to create user'
//     }, { status: 500 });
//   }
// }