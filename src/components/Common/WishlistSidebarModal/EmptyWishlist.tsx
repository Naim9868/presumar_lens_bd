// components/Wishlist/EmptyWishlist.tsx
"use client";
import React from "react";
import Link from "next/link";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { Heart } from "lucide-react";

const EmptyWishlist = () => {
  const { closeWishlistModal } = useWishlistModalContext();

  return (
    <div className="text-center py-12">
      <div className="mx-auto pb-7.5">
        <Heart className="w-20 h-20 text-gray-300 mx-auto" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-dark mb-2">Your wishlist is empty!</h3>
      <p className="text-gray-500 mb-6">Save your favorite items here</p>

      <Link
        onClick={() => closeWishlistModal()}
        href="/shop"
        className="inline-flex justify-center items-center gap-2 font-medium text-white bg-dark py-3 px-6 rounded-md hover:bg-opacity-95 transition-all"
      >
        <Heart className="w-4 h-4" />
        Start Shopping
      </Link>
    </div>
  );
};

export default EmptyWishlist;