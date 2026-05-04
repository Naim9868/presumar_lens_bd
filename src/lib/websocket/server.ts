// lib/websocket/server.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketServer {
  private io: SocketServer;
  
  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_URL,
        credentials: true,
      },
    });
    
    this.initialize();
  }
  
  private initialize() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('subscribe-order', (orderId: string) => {
        socket.join(`order-${orderId}`);
        console.log(`Client ${socket.id} subscribed to order ${orderId}`);
      });
      
      socket.on('unsubscribe-order', (orderId: string) => {
        socket.leave(`order-${orderId}`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  emitOrderUpdate(orderId: string, update: any) {
    this.io.to(`order-${orderId}`).emit('order-update', update);
  }
  
  emitTrackingUpdate(orderId: string, trackingData: any) {
    this.io.to(`order-${orderId}`).emit('tracking-update', trackingData);
  }
}