'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  items: Array<{
    id: string;
    name: string;
    image?: string;
    price: { original: number; sale: number };
    quantity: number;
    variantKey?: string;
    variantName?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  className?: string;
}

export default function OrderSummary({ 
  items, 
  subtotal, 
  deliveryCharge, 
  total,
  className 
}: OrderSummaryProps) {
  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Order Summary
          <Badge variant="secondary" className="ml-auto">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px] p-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {formatCurrency(item.price.sale * item.quantity)}
                    </span>
                    <span className="text-muted-foreground">× {item.quantity}</span>
                    {item.price.original > item.price.sale && (
                      <Badge variant="secondary" className="text-xs line-through">
                        {formatCurrency(item.price.original * item.quantity)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Delivery Charge
            </span>
            <span>{formatCurrency(deliveryCharge)}</span>
          </div>
          {deliveryCharge > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Inside Dhaka: ৳60</span>
              <span>Outside Dhaka: ৳120</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}