import { NextRequest, NextResponse } from 'next/server';
import { redisClient, checkRedisHealth } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const isHealthy = await checkRedisHealth();
    
    // Get Redis metrics (if you have Upstash REST API key)
    const metrics = {
      health: isHealthy,
      timestamp: new Date().toISOString(),
      // Add more metrics as needed
    };
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}