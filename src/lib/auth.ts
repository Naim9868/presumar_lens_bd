// lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbConnect as connectDB } from './dbConnect';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function authenticate(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}