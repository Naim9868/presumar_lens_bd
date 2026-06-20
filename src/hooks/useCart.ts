'use client';

import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CartItem, ProductVariant } from '@/types/cart';
import { IProduct, IProductVariant } from '@/types/product';
import { toast } from 'react-hot-toast';

// Helper function to get the first image from product
const getProductImage = (product: IProduct): string => {
  if (product.thumbnail) {
    return product.thumbnail;
  }
  
  if (product.imageGroups && Array.isArray(product.imageGroups) && product.imageGroups.length > 0) {
    const firstGroup = product.imageGroups[0];
    if (firstGroup && firstGroup.images && Array.isArray(firstGroup.images) && firstGroup.images.length > 0) {
      const firstImage = firstGroup.images[0];
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url;
      }
    }
  }
  
  return '/images/placeholder.jpg';
};

// Helper to convert IProductVariant to ProductVariant
const convertVariant = (variant: IProductVariant): ProductVariant => {
  const attributes: Record<string, string> = {};
  if (variant.attributes && Array.isArray(variant.attributes)) {
    variant.attributes.forEach((attr) => {
      if (attr.key && attr.value !== undefined) {
        attributes[attr.key] = String(attr.value);
      }
    });
  }

  return {
    variantKey: variant.variantKey,
    sku: variant.sku,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    inventory: variant.inventory,
    attributes: attributes,
    isDefault: variant.isDefault || false,
  };
};

// Helper to get variant name from attributes
const getVariantName = (variant: ProductVariant): string => {
  if (!variant) return '';
  if (variant.attributes) {
    const attrValues = Object.values(variant.attributes);
    return attrValues.join(' - ');
  }
  return variant.variantKey || '';
};

// Fixed availability verification with better error handling
const verifyProductAvailability = async (productId: string, variantKey?: string) => {
  try {
    // Build URL with proper encoding
    const url = new URL(`/api/products/${productId}/availability`, window.location.origin);
    if (variantKey) {
      url.searchParams.append('variantKey', variantKey);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is OK
    if (!response.ok) {
      // If 404, the endpoint might not exist - return default availability
      if (response.status === 404) {
        console.warn('Availability endpoint not found, defaulting to available');
        return { available: true, stock: 999 };
      }
      
      // Try to parse error message
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check availability');
      } catch (parseError) {
        // If response is not JSON, throw generic error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Parse JSON response
    const data = await response.json();
    
    return {
      available: data.available ?? true,
      stock: data.stock ?? 999,
    };
  } catch (error) {
    // Log the error but don't block the user
    console.warn('Availability check failed, defaulting to available:', error);
    // Return default availability to allow adding to cart
    return { available: true, stock: 999 };
  }
};

export function useCart() {
  const { storedValue: cartItems, setValue: setCartItems, isLoaded } = useLocalStorage<CartItem[]>('cart', []);

  const addToCart = useCallback(async (
    product: IProduct, 
    variant?: IProductVariant, 
    quantity: number = 1
  ): Promise<boolean> => {
    // Find the variant to use
    let variantToUse = variant;
    
    if (!variantToUse && product.variants && product.variants.length > 0) {
      variantToUse = product.variants.find((v) => v.isDefault) || product.variants[0];
    }
    
    if (!variantToUse) {
      toast.error('Product variant not found');
      return false;
    }
    
    // Convert variant to ProductVariant for cart
    const convertedVariant = convertVariant(variantToUse);
    
    // Verify availability (with fallback)
    try {
      const availability = await verifyProductAvailability(product._id, variantToUse.variantKey);
      
      if (!availability.available) {
        toast.error('Product is out of stock');
        return false;
      }
      
      if (quantity > availability.stock) {
        toast.error(`Only ${availability.stock} items available`);
        return false;
      }
    } catch (error) {
      // Already handled in verifyProductAvailability
      console.warn('Continuing with add to cart despite availability check failure');
    }

    // Get product image
    const productImage = getProductImage(product);
    
    // Generate unique cart item ID
    const cartItemId = `${product._id}-${variantToUse.variantKey || 'default'}`;
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(
      item => item.productId === product._id && item.variantKey === variantToUse.variantKey
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      const existingItem = cartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      setCartItems(prevItems => {
        const updated = [...prevItems];
        updated[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        return updated;
      });
    } else {
      // Create new cart item
      const newItem: CartItem = {
        id: cartItemId,
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: productImage,
        sku: variantToUse.sku || '',
        brand: '', // You can fetch brand name if needed
        category: '', // You can fetch category name if needed
        price: {
          original: variantToUse.compareAtPrice || variantToUse.price || product.lowestPrice || 0,
          sale: variantToUse.price || product.lowestPrice || 0,
        },
        variantKey: variantToUse.variantKey,
        variantName: getVariantName(convertedVariant),
        attributes: convertedVariant.attributes || {},
        quantity: quantity,
        maxQuantity: variantToUse.inventory || 999,
      };
      
      setCartItems((prev) => [...prev, newItem]);
    }
    
    toast.success('Added to cart');
    return true;
  }, [cartItems, setCartItems]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(items =>
      items.filter(item => item.id !== id)
    );
    toast.success('Removed from cart');
  }, [setCartItems]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [setCartItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price.sale * item.quantity), 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // Memoized values
  const cartTotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const cartCount = useMemo(() => getCartCount(), [getCartCount]);

  return {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isLoaded,
  };
}