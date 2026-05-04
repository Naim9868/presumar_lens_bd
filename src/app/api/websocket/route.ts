// app/api/websocket/route.ts
import { WebSocketServer } from '@/lib/websocket/server';
import { Server as HTTPServer } from 'http';

let wsServer: WebSocketServer | null = null;

export async function GET(req: Request) {
  // This is a placeholder for WebSocket upgrade
  // Actual WebSocket server should be initialized in server.js or custom server
  return new Response('WebSocket endpoint', { status: 200 });
}

export function initializeWebSocket(server: HTTPServer) {
  if (!wsServer) {
    wsServer = new WebSocketServer(server);
  }
  return wsServer;
}