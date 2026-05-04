'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  RefreshCw,
  Image as ImageIcon,
  Globe,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';
import Button from '@/components/admin/ui/Button';
import Input from '@/components/admin/ui/Input';
import Modal from '@/components/admin/ui/Modal';
import { useToast } from '@/hooks/useToast';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    website: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/brands');
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.data);
      } else {
        showToast('Failed to fetch brands', 'error');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      showToast('Failed to fetch brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingBrand 
        ? `/api/admin/brands/${editingBrand._id}`
        : '/api/admin/brands';
      
      const method = editingBrand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(
          `Brand ${editingBrand ? 'updated' : 'created'} successfully`,
          'success'
        );
        setIsModalOpen(false);
        resetForm();
        fetchBrands();
      } else {
        showToast(data.error || 'Failed to save brand', 'error');
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      showToast('Failed to save brand', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/brands/${deletingBrand._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Brand deleted successfully', 'success');
        setDeletingBrand(null);
        fetchBrands();
      } else {
        showToast(data.error || 'Failed to delete brand', 'error');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      showToast('Failed to delete brand', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    setUploadingLogo(true);
    
    // Simulate upload - replace with actual upload to your server/CDN
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || '',
      description: brand.description || '',
      website: brand.website || '',
      isActive: brand.isActive
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      logo: '',
      description: '',
      website: '',
      isActive: true
    });
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Brands
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your camera lens brands and manufacturers
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchBrands} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No brands found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first brand'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Brand
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand._id}
                className={`group relative rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 ${
                  brand.isActive 
                    ? 'border-gray-200 dark:border-gray-700' 
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                {/* Brand Logo */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {brand.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {brand.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="ml-2">
                      {brand.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {brand.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  
                  {/* Website */}
                  {brand.website && (
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="mr-1 h-3 w-3" />
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber-600 dark:hover:text-amber-400 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {brand.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  
                  {/* Product Count */}
                  {brand.productCount !== undefined && brand.productCount > 0 && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(brand)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit brand"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBrand(brand)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete brand"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && brands.length > 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredBrands.length} of {brands.length} brands
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'Create New Brand'}
        size="lg"
        showConfirm
        confirmText={editingBrand ? 'Update' : 'Create'}
        onConfirm={handleSubmit}
        loading={submitting}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand Logo
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Brand logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    {uploadingLogo ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </div>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: Square image, max 2MB
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Brand Name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              setFormData({ ...formData, name, slug });
            }}
            required
            placeholder="e.g., Canon"
            autoFocus
          />
          
          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            placeholder="auto-generated-from-name"
            helpText="URL-friendly version of the brand name"
          />
          
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.canon.com"
            helpText="Official brand website"
          />
          
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            textarea
            rows={3}
            placeholder="Brief description of the brand"
          />
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Active (visible to customers)
            </span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBrand}
        onClose={() => setDeletingBrand(null)}
        title="Delete Brand"
        size="sm"
        showConfirm
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        loading={submitting}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Delete Brand
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete "{deletingBrand?.name}"?
          </p>
          {deletingBrand?.productCount && deletingBrand.productCount > 0 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Warning: This brand has {deletingBrand.productCount} product(s). 
              They will need to be reassigned.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This action cannot be undone.
          </p>
        </div>
      </Modal>
  </div>
  );
}