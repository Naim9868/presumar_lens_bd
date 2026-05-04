const API_BASE = process.env.NEXT_PUBLIC_API_URL;

class API {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }
  
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
  
  put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new API();

// Product API
export const productAPI = {
  getAll: (params?: any) => api.get(`/admin/products?${new URLSearchParams(params)}`),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: any) => api.post('/admin/products', data),
  update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`)
};

// Order API
export const orderAPI = {
  getAll: (params?: any) => api.get(`/admin/orders?${new URLSearchParams(params)}`),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) => 
    api.patch(`/admin/orders/${id}/status`, { status })
};