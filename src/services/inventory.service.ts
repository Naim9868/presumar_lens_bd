// src/services/inventory.service.ts
import mongoose from 'mongoose';
import { Product } from '@/models/Product';

export interface InventoryReservationItem {
  productId: string;
  variantKey?: string;
  quantity: number;
}

export async function reserveInventory(items: InventoryReservationItem[]): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Find the specific variant or use the first variant
      let variantIndex = -1;
      
      if (item.variantKey) {
        variantIndex = product.variants.findIndex(
          (v: any) => v.variantKey === item.variantKey
        );
      } else {
        // If no variant specified, use the first available variant with inventory
        variantIndex = product.variants.findIndex(
          (v: any) => v.inventory > 0
        );
      }

      if (variantIndex === -1) {
        throw new Error(`No available variant found for product ${product.name}`);
      }

      const variant = product.variants[variantIndex];
      
      // Check if enough inventory is available
      const available = variant.inventory - variant.reserved;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${product.name}. Available: ${available}, Requested: ${item.quantity}`
        );
      }

      // Reserve the inventory
      variant.reserved = (variant.reserved || 0) + item.quantity;
      product.variants[variantIndex] = variant;
      
      await product.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function releaseInventory(items: InventoryReservationItem[]): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      let variantIndex = -1;
      
      if (item.variantKey) {
        variantIndex = product.variants.findIndex(
          (v: any) => v.variantKey === item.variantKey
        );
      } else {
        // Find first variant with reserved stock
        variantIndex = product.variants.findIndex(
          (v: any) => v.reserved > 0
        );
      }

      if (variantIndex === -1) {
        // No reserved stock to release
        continue;
      }

      const variant = product.variants[variantIndex];
      variant.reserved = Math.max(0, (variant.reserved || 0) - item.quantity);
      product.variants[variantIndex] = variant;
      
      await product.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function checkInventoryAvailability(
  items: InventoryReservationItem[]
): Promise<{ available: boolean; details: Record<string, number> }> {
  const details: Record<string, number> = {};
  let allAvailable = true;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      details[item.productId] = 0;
      allAvailable = false;
      continue;
    }

    let variant = product.variants.find(
      (v: any) => v.variantKey === item.variantKey
    );

    if (!variant && product.variants.length > 0) {
      // Use the first variant with available stock
      variant = product.variants.find(
        (v: any) => v.inventory - v.reserved >= item.quantity
      );
    }

    if (!variant) {
      details[item.productId] = 0;
      allAvailable = false;
      continue;
    }

    const available = variant.inventory - (variant.reserved || 0);
    details[item.productId] = available;

    if (available < item.quantity) {
      allAvailable = false;
    }
  }

  return { available: allAvailable, details };
}