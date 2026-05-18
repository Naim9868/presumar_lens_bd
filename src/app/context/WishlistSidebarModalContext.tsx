// app/context/WishlistSidebarModalContext.tsx
"use client";
import React, { createContext, useContext, useState } from "react";

interface WishlistModalContextType {
  isWishlistModalOpen: boolean;
  openWishlistModal: () => void;
  closeWishlistModal: () => void;
}

const WishlistModalContext = createContext<WishlistModalContextType | undefined>(
  undefined
);

export const useWishlistModalContext = () => {
  const context = useContext(WishlistModalContext);
  if (!context) {
    throw new Error("useWishlistModalContext must be used within a WishlistModalProvider");
  }
  return context;
};

export const WishlistModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  const openWishlistModal = () => {
    setIsWishlistModalOpen(true);
  };

  const closeWishlistModal = () => {
    setIsWishlistModalOpen(false);
  };

  return (
    <WishlistModalContext.Provider
      value={{ isWishlistModalOpen, openWishlistModal, closeWishlistModal }}
    >
      {children}
    </WishlistModalContext.Provider>
  );
};