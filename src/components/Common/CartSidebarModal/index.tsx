// components/Common/CartSidebarModal/CartSidebarModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useCartContext } from "@/app/context/CartContext";
import SingleItem from "./SingleItem";
import Link from "next/link";
import EmptyCart from "./EmptyCart";
import { X, ShoppingBag } from "lucide-react";

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const { cartItems, removeFromCart, cartTotal, isLoaded } = useCartContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest(".modal-content")) {
        closeCartModal();
      }
    }

    if (isCartModalOpen) {
      console.log(cartItems);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isCartModalOpen, closeCartModal]);

  if (!mounted || !isLoaded) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 right-0 z-[99999] w-full h-screen bg-black/70 transition-transform duration-300 ease-in-out ${
        isCartModalOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-end min-h-screen">
        <div className="w-full max-w-[500px] shadow-2xl bg-white relative modal-content h-screen flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between pb-6 pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
              <h2 className="font-semibold text-dark text-xl sm:text-2xl">
                Cart ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={() => closeCartModal()}
              aria-label="Close cart"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-6">
                {cartItems.map((item) => (
                  <SingleItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyCart />
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-5 pb-6 px-6 sm:px-8">
              <div className="flex items-center justify-between gap-5 mb-6">
                <p className="font-medium text-xl text-dark">Subtotal:</p>
                <p className="font-medium text-xl text-blue-600">
                  ${Number(cartTotal).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  onClick={() => closeCartModal()}
                  href="/cart"
                  className="w-full flex justify-center items-center gap-2 font-medium text-white bg-blue-600 py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  View Cart
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => closeCartModal()}
                  className="w-full flex justify-center font-medium text-white bg-dark py-3 px-6 rounded-lg hover:bg-opacity-95 transition-all duration-200"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebarModal;