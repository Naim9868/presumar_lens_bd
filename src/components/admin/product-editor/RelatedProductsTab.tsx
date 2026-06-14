// src/components/admin/product-editor/RelatedProductsTab.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Search, X, GripVertical, Plus, TrendingUp, 
  Package, ExternalLink, Trash2, Loader2, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import { cn } from '@/lib/utils';

interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  lowestPrice: number;
  highestPrice?: number;
}

interface RelatedProductsFormData {
  relatedProducts: string[];
}

interface RelatedProductsTabProps {
  initialData?: { relatedProducts?: string[] };
  onDataChange?: (data: any) => void;
  currentProductId?: string;
}

export default function RelatedProductsTab({ 
  initialData, 
  onDataChange, 
  currentProductId 
}: RelatedProductsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { setValue, watch } = useForm<RelatedProductsFormData>({
    defaultValues: initialData || { relatedProducts: [] },
  });

  const relatedProducts = watch('relatedProducts');
  const [selectedProducts, setSelectedProducts] = useState<RelatedProduct[]>([]);

  // Load selected product details
  useEffect(() => {
    async function loadSelectedProducts() {
      if (relatedProducts && relatedProducts.length > 0) {
        try {
          const response = await fetch(`/api/products/batch?ids=${relatedProducts.join(',')}`);
          const data = await response.json();
          if (data.success) {
            setSelectedProducts(data.products);
          }
        } catch (error) {
          console.error('Error loading selected products:', error);
        }
      } else {
        setSelectedProducts([]);
      }
    }
    loadSelectedProducts();
  }, [relatedProducts]);

  // Notify parent of changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onDataChange?.({ relatedProducts });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [relatedProducts, onDataChange]);

  const searchProducts = useCallback(
    debounce(async (query: string, page: number = 1) => {
      if (!query.trim() || query.trim().length < 2) {
        setSearchResults([]);
        setTotalSearchResults(0);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=10${currentProductId ? `&exclude=${currentProductId}` : ''}`);
        const data = await response.json();
        
        if (data.success) {
          const filtered = data.products.filter(
            (p: RelatedProduct) => !relatedProducts?.includes(p._id)
          );
          setSearchResults(filtered);
          setTotalSearchResults(data.total || 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [relatedProducts, currentProductId]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchPage(1);
    searchProducts(value, 1);
  };

  const addRelatedProduct = async (product: RelatedProduct) => {
    if (isAdding) return;
    
    setIsAdding(product._id);
    const current = relatedProducts || [];
    
    if (!current.includes(product._id)) {
      setValue('relatedProducts', [...current, product._id]);
      // Remove from search results
      setSearchResults(prev => prev.filter(p => p._id !== product._id));
    }
    
    setTimeout(() => {
      setIsAdding(null);
    }, 300);
  };

  const removeRelatedProduct = (productId: string) => {
    const current = relatedProducts || [];
    setValue('relatedProducts', current.filter(id => id !== productId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newOrder = [...(relatedProducts || [])];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setValue('relatedProducts', newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getPriceDisplay = (product: RelatedProduct) => {
    if (product.highestPrice && product.highestPrice !== product.lowestPrice) {
      return `$${product.lowestPrice.toFixed(2)} - $${product.highestPrice.toFixed(2)}`;
    }
    return `$${product.lowestPrice.toFixed(2)}`;
  };

  const totalPages = Math.ceil(totalSearchResults / 10);

  return (
    <div className="space-y-6">
      {/* Related Products Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Related Products</h3>
              <p className="text-sm text-gray-500">Recommend complementary products</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Inline Search Section */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by name to add as related..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            
            {/* Search Results */}
            {searchTerm && searchTerm.length >= 2 && (
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    Search Results ({totalSearchResults} found)
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {searchTerm ? 'No products found' : 'Type to search for products'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => addRelatedProduct(product)}
                          disabled={isAdding === product._id}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-all flex items-center gap-3 border-b border-gray-100 last:border-b-0 group"
                        >
                          <div className="w-10 h-10 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.thumbnail ? (
                              <Image
                                src={product.thumbnail}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {product.name}
                            </div>
                            <div className="text-xs font-medium text-emerald-600">
                              {getPriceDisplay(product)}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isAdding === product._id ? (
                              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                            )}
                          </div>
                        </button>
                      ))}
                      
                      {/* Pagination for search results */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                          <button
                            onClick={() => {
                              const newPage = searchPage - 1;
                              setSearchPage(newPage);
                              searchProducts(searchTerm, newPage);
                            }}
                            disabled={searchPage === 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-500">
                            Page {searchPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => {
                              const newPage = searchPage + 1;
                              setSearchPage(newPage);
                              searchProducts(searchTerm, newPage);
                            }}
                            disabled={searchPage === totalPages}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Related Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Selected Related Products ({selectedProducts.length})
              </h4>
              {selectedProducts.length > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag to reorder
                </span>
              )}
            </div>
            
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No related products added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Search and add products above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((product, index) => (
                  <div
                    key={product._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 transition-all cursor-move",
                      draggedIndex === index && "opacity-50"
                    )}
                  >
                    <div className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                        {product.slug && (
                          <a
                            href={`/product/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                        {getPriceDisplay(product)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeRelatedProduct(product._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Related products appear on the product page to encourage cross-selling. Drag to reorder.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}