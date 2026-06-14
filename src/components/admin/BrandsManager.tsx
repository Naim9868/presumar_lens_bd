// src/components/admin/BrandsManager.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  logoPublicId?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface BrandsManagerProps {
  initialBrands: Brand[];
}

export default function BrandsManager({ initialBrands }: BrandsManagerProps) {
  const [brands, setBrands] = useState<Brand[]>(() => 
    initialBrands.map(brand => ({
      ...brand,
      createdAt: typeof brand.createdAt === 'string' ? brand.createdAt : brand.createdAt.toISOString(),
      updatedAt: typeof brand.updatedAt === 'string' ? brand.updatedAt : brand.updatedAt.toISOString(),
    }))
  );
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>(brands);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [useImageLink, setUseImageLink] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentPublicId, setCurrentPublicId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    logoPublicId: '',
    description: '',
    website: '',
  });

  // Filter brands based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [searchTerm, brands]);

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        logo: brand.logo || '',
        logoPublicId: brand.logoPublicId || '',
        description: brand.description || '',
        website: brand.website || '',
      });
      setCurrentImageUrl(brand.logo || '');
      setCurrentPublicId(brand.logoPublicId || '');
      setUseImageLink(!!brand.logo && brand.logo.startsWith('http') && !brand.logoPublicId);
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        logo: '',
        logoPublicId: '',
        description: '',
        website: '',
      });
      setCurrentImageUrl('');
      setCurrentPublicId('');
      setUseImageLink(false);
    }
    setShowModal(true);
  };

  const handleImageUpload = (url: string, publicId?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      logo: url,
      logoPublicId: publicId || ''
    }));
    setCurrentImageUrl(url);
    setCurrentPublicId(publicId || '');
  };

  const handleImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCurrentImageUrl(url);
    setFormData(prev => ({ 
      ...prev, 
      logo: url,
      logoPublicId: '' // Clear publicId when using external link
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBrand 
        ? `/api/brands/${editingBrand._id}`
        : '/api/brands';
      
      const method = editingBrand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newBrand = {
          ...data.brand,
          createdAt: data.brand.createdAt || new Date().toISOString(),
          updatedAt: data.brand.updatedAt || new Date().toISOString(),
        };
        
        if (editingBrand) {
          setBrands(brands.map(b => b._id === editingBrand._id ? newBrand : b));
          toast.success('Brand updated successfully');
        } else {
          setBrands([newBrand, ...brands]);
          toast.success('Brand created successfully');
        }
        setShowModal(false);
      } else {
        toast.error(data.error || 'Failed to save brand');
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/brands/${brand._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBrands(brands.map(b => 
          b._id === brand._id ? { ...b, isActive: !brand.isActive } : b
        ));
        toast.success(`Brand ${!brand.isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(data.error || 'Failed to update brand status');
      }
    } catch (error) {
      console.error('Error updating brand status:', error);
      toast.error('Failed to update brand status');
    }
  };

  const handleDelete = async (brand: Brand) => {
  if (
    !confirm(
      `Delete brand "${brand.name}"? This will affect all products using this brand.`
    )
  ) {
    return;
  }

  try {
    // Delete brand image if it exists
    if (brand?.logo && brand?.logoPublicId) {
      const imageRes = await fetch(
        `/api/upload?publicId=${brand.logoPublicId}`,
        {
          method: "DELETE",
        }
      );

      if (!imageRes.ok) {
        toast.error("Failed to remove brand image");
        return;
      }
    }

    // Delete brand from database
    const response = await fetch(`/api/brands/${brand._id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      setBrands((prev) => prev.filter((b) => b._id !== brand._id));
      toast.success("Brand deleted successfully");
    } else {
      toast.error(data.error || "Failed to delete brand");
    }
  } catch (error) {
    console.error("Error deleting brand:", error);
    toast.error("Failed to delete brand");
  }
};

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No brands found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Click "Add Brand" to create your first brand'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand._id}
              className={cn(
                "bg-white rounded-lg border transition-all hover:shadow-md",
                brand.isActive ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-75"
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-semibold text-gray-400">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {brand.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        slug: {brand.slug}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(brand)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={brand.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {brand.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(brand)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                
                {brand.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {brand.description}
                  </p>
                )}
                
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Website
                  </a>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    Updated {new Date(brand.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Brand Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Nike, Apple, Samsung"
                />
              </div>
              
              {/* Image Upload with Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Brand Logo
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseImageLink(!useImageLink)}
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    {useImageLink ? 'Use Upload' : 'Use Image Link'}
                  </button>
                </div>

                {useImageLink ? (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/brand-logo.png"
                      onChange={handleImageLinkChange}
                      value={currentImageUrl}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL for the brand logo
                    </p>
                  </div>
                ) : (
                  <div>
                    <ImageUpload
                      onUpload={handleImageUpload}
                      defaultValue={currentImageUrl}
                      defaultPublicId={currentPublicId}
                      folder="brands"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a logo or toggle to use an external link
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Brand description for customers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://www.example.com"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingBrand ? 'Update Brand' : 'Create Brand')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}