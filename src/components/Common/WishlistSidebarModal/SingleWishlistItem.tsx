// components/Wishlist/SingleWishlistItem.tsx
"use client";
import React, { useState } from "react";
import { useCartContext } from "@/app/context/CartContext";
import { useWishlistContext } from "@/app/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { ShoppingBag, Trash2, Check } from "lucide-react";
import { WishlistItem } from "@/types";

interface SingleWishlistItemProps {
  item: WishlistItem;
}

const SingleWishlistItem = ({ item }: SingleWishlistItemProps) => {
  const { addToCart } = useCartContext();
  const { removeFromWishlist } = useWishlistContext();
  const { openCartModal } = useCartModalContext();
  const { closeWishlistModal } = useWishlistModalContext();
  const [isAdding, setIsAdding] = useState(false);


  const handleRemoveFromWishlist = () => {
    removeFromWishlist(item.id);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);

    // Create simple product object for cart
    const productForCart = {
      _id: item.productId,
      name: item.name,
      price: item.price,
      thumbnail: item.image,
      slug: item.slug || `product-${item.productId}`,
      isAvailable: true,
      totalInventory: item.selectedVariant?.inventory || 0,
    };

    await addToCart(
      productForCart as any,
      item.selectedVariant || undefined,
      item.quantity || 1
    );

    setTimeout(() => {
      setIsAdding(false);
      closeWishlistModal();
      openCartModal();
    }, 500);

  };

  const productImage = item.image || "/images/placeholder.jpg";

  return (
    <div className="flex items-center justify-between gap-5 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="w-full flex items-center gap-6">
        <Link
          href={`/product/${item.slug || item.productId}`}
          onClick={() => closeWishlistModal()}
          className="flex items-center justify-center rounded-[10px] bg-gray-100 max-w-[90px] w-full h-22.5 overflow-hidden flex-shrink-0"
        >
          <Image
            src={productImage}
            alt={item.name}
            width={100}
            height={100}
            className="object-cover w-full h-full"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${item.slug || item.productId}`}
            onClick={() => closeWishlistModal()}
            className="font-medium text-dark mb-1 hover:text-blue transition-colors duration-200 line-clamp-2 block"
          >
            {item.name}
          </Link>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-lg font-semibold text-blue-600">
              ${Number(item.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-200 ${isAdding
              ? "bg-green-500 text-white"
              : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
            }`}
        >
          {isAdding ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        </button>

        <button
          onClick={handleRemoveFromWishlist}
          aria-label="Remove from wishlist"
          className="flex items-center justify-center rounded-lg w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SingleWishlistItem;