import { useState, useEffect } from 'react';
import { useToast } from './useToast';

interface UseProductsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const { showToast } = useToast();
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      
      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [options.page, options.status]);
  
  return { products, loading, pagination, refetch: fetchProducts };
}