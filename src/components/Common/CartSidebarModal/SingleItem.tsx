// components/Common/CartSidebarModal/SingleItem.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CartItem } from "@/types";
import { Trash2 } from "lucide-react";

interface SingleItemProps {
  item: CartItem;
  onRemove: () => void;
}

const SingleItem = ({ item, onRemove }: SingleItemProps) => {
  const productImage = item.image || "/images/placeholder.jpg";
  
  const variantInfo = item.attributes?.length 
    ? item.attributes.map(attr => `${attr.key}: ${attr.value}`).join(', ')
    : null;

  return (
    <div className="flex items-center justify-between gap-5">
      <div className="w-full flex items-center gap-6">
        {/* Product Image */}
        <Link
          href={`/product/${item.productId}`}
          className="flex items-center justify-center rounded-[10px] bg-gray-100 max-w-[90px] w-full h-22.5 overflow-hidden flex-shrink-0"
        >
          <Image 
            src={productImage} 
            alt={item.name} 
            width={100} 
            height={100}
            className="object-cover w-full h-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder.jpg";
            }}
          />
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${item.productId}`}
            className="font-medium text-dark mb-1 ease-out duration-200 hover:text-blue block line-clamp-2"
          >
            {item.name}
          </Link>
          
          {variantInfo && (
            <p className="text-xs text-gray-500 mt-0.5">{variantInfo}</p>
          )}
          
          <div className="flex items-center gap-3 mt-1">
            <p className="text-custom-sm font-medium text-dark">
              Price: ${Number(item.price || 0).toFixed(2)}
            </p>
            <p className="text-custom-sm text-gray-500">
              Qty: {item.quantity}
            </p>
          </div>
          
          {/* <p className="text-xs text-gray-500 mt-0.5">
            Subtotal: ${Number(item.price * item.quantity).toFixed(2)}
          </p> */}
        </div>
      </div>

      <button
        onClick={onRemove}
        aria-label="Remove product from cart"
        className="flex items-center justify-center rounded-lg w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SingleItem;