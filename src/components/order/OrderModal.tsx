'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderForm from './OrderForm';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    id: string;
    name: string;
    slug: string;
    image?: string;
    sku?: string;
    brand?: string;
    category?: string;
    price: { original: number; sale: number };
    variantKey?: string;
    variantName?: string;
    attributes?: Record<string, string>;
    quantity: number;
    maxQuantity?: number;
  }>;
  userId?: string;
}

export default function OrderModal({ 
  isOpen, 
  onClose, 
  items, 
  userId 
}: OrderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Complete Your Order</DialogTitle>
              <DialogDescription>
                Review your items and provide delivery details
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[calc(95vh-80px)] p-4">
          <OrderForm 
            items={items}
            userId={userId}
            onSuccess={() => {
              // Handle success - maybe close modal after delay
              setTimeout(() => onClose(), 2000);
            }}
            onClose={onClose}
            isModal={true}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}