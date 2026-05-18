// components/Wishlist/SingleWishlistItem.tsx
"use client";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { removeFromWishlist } from "@/redux/features/wishlist-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import Image from "next/image";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { ShoppingBag, Trash2, Check, Heart } from "lucide-react";
import { WishlistItem, ProductVariant } from "@/types/product";

interface SingleWishlistItemProps {
  item: WishlistItem;
}

const SingleWishlistItem = ({ item }: SingleWishlistItemProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openCartModal } = useCartModalContext();
  const { closeWishlistModal } = useWishlistModalContext();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Get default variant or first available
  const defaultVariant = item.variants.find(v => v.isDefault) || item.variants[0];
  const currentVariant = selectedVariant || defaultVariant;

  const handleRemoveFromWishlist = () => {
    dispatch(removeFromWishlist(item._id));
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    dispatch(addItemToCart({
      product: item,
      variant: currentVariant,
      quantity: 1,
    }));
    
    setTimeout(() => {
      setIsAdding(false);
      closeWishlistModal();
      openCartModal();
    }, 500);
  };

  // Get primary image
  const productImage = currentVariant?.images?.[0] || item.thumbnail || item.images?.[0] || "/images/placeholder.jpg";
  
  // Get display price
  const displayPrice = currentVariant?.price || item.price;
  const compareAtPrice = currentVariant?.compareAtPrice;
  
  // Check if product is in stock
  const isInStock = currentVariant?.inventory 
    ? currentVariant.inventory > 0 && currentVariant.status === 'in_stock'
    : item.totalInventory > 0 && item.isAvailable;

  // Get variant options for selection (if multiple variants)
  const hasVariants = item.variants.length > 1;
  const variantAttributes = hasVariants ? item.variants[0]?.attributes || [] : [];

  return (
    <div className="flex items-start justify-between gap-5 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="w-full flex gap-6">
        {/* Product Image */}
        <Link
          href={`/product/${item.slug}`}
          onClick={() => closeWishlistModal()}
          className="flex-shrink-0 flex items-center justify-center rounded-[10px] bg-gray-100 w-[90px] h-[90px] overflow-hidden"
        >
          <Image
            src={productImage}
            alt={item.name}
            width={90}
            height={90}
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
            href={`/product/${item.slug}`}
            onClick={() => closeWishlistModal()}
            className="font-medium text-dark mb-1 hover:text-blue transition-colors duration-200 line-clamp-2 block"
          >
            {item.name}
          </Link>
          
          {/* Brand and Category */}
          <div className="text-xs text-gray-500 mb-1">
            {item.brand?.name && <span>{item.brand.name}</span>}
            {item.category?.name && (
              <span className="ml-2">{item.category.name}</span>
            )}
          </div>
          
          {/* Variant Selector (if multiple variants) */}
          {hasVariants && variantAttributes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {variantAttributes.map((attr, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-gray-500">{attr.key}:</span>
                  <span className="ml-1 font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-lg font-semibold text-blue-600">
              ${displayPrice.toFixed(2)}
            </p>
            {compareAtPrice && compareAtPrice > displayPrice && (
              <p className="text-sm text-gray-400 line-through">
                ${compareAtPrice.toFixed(2)}
              </p>
            )}
          </div>
          
          {/* Stock Status */}
          {isInStock ? (
            <p className="text-xs text-green-600 mt-1">In Stock</p>
          ) : (
            <p className="text-xs text-red-500 mt-1">Out of Stock</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !isInStock}
          aria-label="Add to cart"
          className={`flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-200 ${
            isAdding
              ? "bg-green-500 text-white"
              : !isInStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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