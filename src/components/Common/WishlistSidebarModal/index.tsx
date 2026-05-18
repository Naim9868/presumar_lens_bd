// components/Wishlist/WishlistSidebarModal.tsx
"use client";
import React, { useEffect } from "react";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectWishlistItems } from "@/redux/features/wishlist-slice";
import SingleWishlistItem from "./SingleWishlistItem";
import EmptyWishlist from "./EmptyWishlist";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { WishlistItem } from "@/types/product";

const WishlistSidebarModal = () => {
  const { isWishlistModalOpen, closeWishlistModal } = useWishlistModalContext();
  const wishlistItems = useAppSelector(selectWishlistItems);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest(".wishlist-modal-content")) {
        closeWishlistModal();
      }
    }

    if (isWishlistModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isWishlistModalOpen, closeWishlistModal]);

  return (
    <div
      className={`fixed top-0 right-0 z-[99999] w-full h-screen bg-black/70 transition-transform duration-300 ease-in-out ${
        isWishlistModalOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-end min-h-screen">
        <div className="w-full max-w-[600px] shadow-2xl bg-white relative wishlist-modal-content h-screen flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between pb-6 pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              <h2 className="font-semibold text-dark text-xl sm:text-2xl">
                Wishlist ({wishlistItems.length})
              </h2>
            </div>
            <button
              onClick={() => closeWishlistModal()}
              aria-label="Close wishlist"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wishlist Items */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            {wishlistItems.length > 0 ? (
              <div className="flex flex-col gap-4">
                {wishlistItems.map((item: WishlistItem) => (
                  <SingleWishlistItem key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyWishlist />
            )}
          </div>

          {/* Footer */}
          {wishlistItems.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-5 pb-6 px-6 sm:px-8">
              <div className="flex flex-col gap-3">
                <Link
                  onClick={() => closeWishlistModal()}
                  href="/wishlist"
                  className="w-full flex justify-center items-center gap-2 font-medium text-white bg-blue-600 py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  <Heart className="w-4 h-4" />
                  View Full Wishlist
                </Link>
                
                <button
                  onClick={() => closeWishlistModal()}
                  className="w-full flex justify-center font-medium text-gray-600 bg-gray-100 py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistSidebarModal;