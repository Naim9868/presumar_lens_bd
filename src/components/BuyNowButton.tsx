'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/app/context/CartContext';
import OrderModal from '@/components/order/OrderModal';
import { IProduct, IProductVariant } from '@/types/product';

interface BuyNowButtonProps {
  product: IProduct;
  variant?: IProductVariant;
  quantity?: number;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showModal?: boolean;
  onSuccess?: () => void;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function BuyNowButton({
  product,
  variant,
  quantity = 1,
  buttonVariant = 'default',
  buttonSize = 'default',
  className = '',
  showModal = true,
  onSuccess,
  children,
  onClick,
  disabled = false,
}: BuyNowButtonProps) {
  const router = useRouter();
  const { addToCart, cartItems } = useCartContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Get variant styles based on buttonVariant prop
  const getVariantStyles = () => {
    switch (buttonVariant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'outline':
        return 'border-2 border-gray-300 hover:bg-gray-100 text-gray-700';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'ghost':
        return 'hover:bg-gray-100 text-gray-700';
      case 'link':
        return 'text-blue-600 hover:underline hover:bg-transparent';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  // Get size styles based on buttonSize prop
  const getSizeStyles = () => {
    switch (buttonSize) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'icon':
        return 'p-2 w-10 h-10';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const handleBuyNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // If external onClick is provided, call it first
    if (onClick) {
      onClick(e);
      return;
    }

    setIsAdding(true);
    
    try {
      const success = await addToCart(product, variant, quantity);
      
      if (success) {
        if (showModal) {
          setIsModalOpen(true);
          if (onSuccess) onSuccess();
        } else {
          router.push('/checkout');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Prepare modal items from cart
  const modalItems = cartItems.map(item => ({
    ...item,
    id: item.productId,
  }));

  const isDisabled = isAdding || disabled;

  return (
    <>
      <button
        type="button"
        className={`
          inline-flex items-center justify-center 
          font-medium rounded-md 
          transition-colors duration-200 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${getVariantStyles()}
          ${getSizeStyles()}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        onClick={handleBuyNow}
        disabled={isDisabled}
        aria-label={typeof children === 'string' ? children : 'Buy Now'}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-4 w-4 flex-shrink-0" />
            {children || 'Buy Now'}
          </>
        )}
      </button>

      {showModal && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          items={modalItems}
          userId={undefined}
        />
      )}
    </>
  );
}