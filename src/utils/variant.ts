// utils/variant.ts
export interface IVariantAttribute {
  key: string;
  value: string;
}

export function generateVariantKey(attributes: Array<{ key: string; value: string }>): string {
  // Handle empty or undefined attributes
  if (!attributes || attributes.length === 0) {
    return 'default';
  }
  
  // Filter out empty attributes
  const validAttributes = attributes.filter(attr => attr.key && attr.value);
  
  if (validAttributes.length === 0) {
    return 'default';
  }
  
  // Sort attributes by key to ensure consistent key generation
  const sorted = [...validAttributes].sort((a, b) => a.key.localeCompare(b.key));
  const keyString = sorted.map(attr => `${attr.key}:${attr.value}`).join('|');
  
  return keyString;
}

export function generateCombinations(attributes: Record<string, string[]>): Array<Record<string, string>> {
  const keys = Object.keys(attributes);
  if (keys.length === 0) return [];
  
  const combinations: Record<string, string>[] = [];
  
  function generate(index: number, current: Record<string, string>) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    
    const key = keys[index];
    for (const value of attributes[key]) {
      current[key] = value;
      generate(index + 1, current);
    }
  }
  
  generate(0, {});
  return combinations;
}

export function generateSKU(productName: string, attributes: Record<string, string>, index: number): string {
  const prefix = productName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  
  const attrHash = Object.values(attributes)
    .map(v => v.substring(0, 2).toUpperCase())
    .join('');
  
  const sku = `${prefix || 'PRD'}-${attrHash || 'VAR'}-${String(index + 1).padStart(3, '0')}`;
  
  return sku;
}