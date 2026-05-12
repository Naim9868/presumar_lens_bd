// lib/categorySpecSync.ts
import mongoose from 'mongoose';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

interface SpecFieldTemplate {
  key: string;
  label: string;
  type: string;
  unit?: string;
  filterable: boolean;
  defaultValue?: any;
  group: string;
}

// Helper function to normalize keys for comparison
function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get detailed changes between old and new templates
 */
export function getTemplateChanges(oldTemplate: any[], newTemplate: any[]) {
  const oldMap = new Map();
  const newMap = new Map();
  
  // Build old template map with normalized keys
  oldTemplate.forEach(group => {
    group.fields?.forEach((field: any) => {
      const normalizedKey = normalizeKey(field.key);
      oldMap.set(normalizedKey, {
        ...field,
        originalKey: field.key,
        group: group.groupName
      });
    });
  });
  
  // Build new template map with normalized keys
  newTemplate.forEach(group => {
    group.fields?.forEach((field: any) => {
      const normalizedKey = normalizeKey(field.key);
      newMap.set(normalizedKey, {
        ...field,
        originalKey: field.key,
        group: group.groupName
      });
    });
  });
  
  const added: any[] = [];
  const removed: string[] = [];
  const changed: { key: string; old: any; new: any }[] = [];
  const unchanged: string[] = [];
  
  // Find added and changed fields
  for (const [normKey, newField] of newMap) {
    if (!oldMap.has(normKey)) {
      added.push(newField);
    } else {
      const oldField = oldMap.get(normKey);
      
      // Check if metadata changed (excluding value)
      const metadataChanged = 
        oldField.label !== newField.label ||
        oldField.unit !== newField.unit ||
        oldField.type !== newField.type ||
        oldField.required !== newField.required ||
        oldField.filterable !== newField.filterable ||
        oldField.group !== newField.group;
      
      if (metadataChanged) {
        changed.push({ key: newField.originalKey, old: oldField, new: newField });
      } else {
        unchanged.push(newField.originalKey);
      }
    }
  }
  
  // Find removed fields
  for (const [normKey, oldField] of oldMap) {
    if (!newMap.has(normKey)) {
      removed.push(oldField.originalKey);
    }
  }
  
  return { added, removed, changed, unchanged };
}

/**
 * Smart sync: Preserves existing values while updating template structure
 */
export async function syncProductsWithCategoryTemplate(
  categoryId: string | mongoose.Types.ObjectId,
  newTemplate: any[]
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get all products in this category (not deleted)
    const products = await Product.find({ 
      categoryId,
      deletedAt: null 
    }).session(session);

    if (products.length === 0) {
      return { 
        updatedCount: 0, 
        errorCount: 0, 
        details: { added: [], removed: [], kept: [], updated: [] } 
      };
    }

    // Build template maps for efficient lookup (using normalized keys)
    const templateMap = new Map<string, SpecFieldTemplate>();
    
    for (const group of newTemplate) {
      for (const field of group.fields) {
        const normalizedKey = normalizeKey(field.key);
        templateMap.set(normalizedKey, {
          key: field.key, // Keep original key for storage
          label: field.label,
          type: field.type || 'text',
          unit: field.unit,
          filterable: field.filterable || false,
          defaultValue: field.defaultValue,
          group: group.groupName
        });
      }
    }

    let updatedCount = 0;
    let errorCount = 0;
    const details = {
      added: new Set<string>(),
      removed: new Set<string>(),
      kept: new Set<string>(),
      updated: new Set<string>()
    };

    for (const product of products) {
      try {
        // Create a map of existing specs for quick lookup (using normalized keys)
        const existingSpecsMap = new Map();
        if (product.specsFlat && product.specsFlat.length) {
          product.specsFlat.forEach((spec: any) => {
            const normalizedKey = normalizeKey(spec.key);
            existingSpecsMap.set(normalizedKey, spec);
          });
        }

        const newSpecs: any[] = [];
        
        // Process template fields in order
        for (const group of newTemplate) {
          for (const field of group.fields) {
            const normalizedKey = normalizeKey(field.key);
            const existingSpec = existingSpecsMap.get(normalizedKey);
            
            if (existingSpec) {
              // Field exists in both template and product
              // Check if metadata changed
              const metadataChanged = 
                existingSpec.label !== field.label ||
                existingSpec.unit !== field.unit ||
                existingSpec.filterable !== (field.filterable || false) ||
                existingSpec.group !== group.groupName;

              if (metadataChanged) {
                details.updated.add(field.key);
              } else {
                details.kept.add(field.key);
              }

              // PRESERVE existing value! This is the key fix
              newSpecs.push({
                key: field.key, // Use template's original key (with proper case)
                label: field.label,
                value: existingSpec.value, // Keep the original value
                group: group.groupName,
                unit: field.unit,
                filterable: field.filterable || false
              });
            } else {
              // New field - add with default value
              newSpecs.push({
                key: field.key,
                label: field.label,
                value: field.defaultValue !== undefined ? field.defaultValue : '',
                group: group.groupName,
                unit: field.unit,
                filterable: field.filterable || false
              });
              details.added.add(field.key);
            }
          }
        }

        // Find and track removed specs (in product but not in template)
        for (const [normKey, spec] of existingSpecsMap) {
          if (!templateMap.has(normKey)) {
            details.removed.add(spec.key);
          }
        }

        // Update the product with new specs (preserving values where possible)
        product.specsFlat = newSpecs;
        await product.save({ session });
        updatedCount++;

        console.log(`[Sync] Product ${product._id}: Added ${details.added.size}, Removed ${details.removed.size}, Kept ${details.kept.size}, Updated metadata ${details.updated.size}`);

      } catch (error: any) {
        console.error(`Failed to sync product ${product._id}:`, error);
        errorCount++;
      }
    }

    await session.commitTransaction();
    
    return { 
      updatedCount, 
      errorCount, 
      details: {
        added: Array.from(details.added),
        removed: Array.from(details.removed),
        kept: Array.from(details.kept),
        updated: Array.from(details.updated)
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Clean up orphaned specifications (specs that no longer exist in category template)
 */
export async function cleanupOrphanedSpecs(
  categoryId: string | mongoose.Types.ObjectId,
  validSpecKeys: Set<string>
) {
  const products = await Product.find({ 
    categoryId,
    deletedAt: null 
  });

  let cleanedCount = 0;

  for (const product of products) {
    const originalLength = product.specsFlat?.length || 0;
    
    // Filter out specs that are no longer in the template (case-insensitive)
    if (product.specsFlat && product.specsFlat.length) {
      product.specsFlat = product.specsFlat.filter((spec: any) => {
        const normalizedKey = normalizeKey(spec.key);
        return validSpecKeys.has(normalizedKey);
      });
      
      if (product.specsFlat.length !== originalLength) {
        await product.save();
        cleanedCount++;
        console.log(`Cleaned ${originalLength - product.specsFlat.length} orphaned specs from product ${product._id}`);
      }
    }
  }

  return cleanedCount;
}