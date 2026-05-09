// app/admin/categories/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FolderTree, 
  FileText, 
  CheckCircle, 
  XCircle,
  Calendar,
  Image as ImageIcon,
  Tag,
  ChevronRight,
  Package,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getProductsByCategory } from '@/app/actions/product.actions';
import { IProduct } from '@/types/product';

interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
  unit?: string;
  options?: string[];
  required: boolean;
  filterable: boolean;
  isVariantAttribute: boolean;
  defaultValue?: any;
}

interface CategoryGroup {
  groupName: string;
  fields: CategoryField[];
  displayOrder: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId: string | null;
  parent?: Category;
  status: 'active' | 'inactive';
  specificationTemplate: CategoryGroup[];
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      fetchProducts();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories/${categoryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }
      
      const data = await response.json();
      setCategory(data);
      
      // Fetch parent category if exists
      if (data.parentId) {
        const parentRes = await fetch(`/api/categories/${data.parentId}`);
        if (parentRes.ok) {
          const parentData = await parentRes.json();
          setParentCategory(parentData);
        }
      }
      
      // Set child categories
      if (data.children && data.children.length > 0) {
        setChildCategories(data.children);
      }
      
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast('Failed to load category details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const result = await getProductsByCategory(categoryId);
      
      if (result.success) {
        setProducts(result.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    
    if (childCategories.length > 0) {
      showToast(`Cannot delete "${category.name}" because it has ${childCategories.length} subcategory(s). Please delete or reassign subcategories first.`, 'error');
      return;
    }
    
    if (products.length > 0) {
      showToast(`Cannot delete "${category.name}" because it has ${products.length} product(s). Please delete or reassign products first.`, 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast('Category deleted successfully', 'success');
        router.push('/admin/categories');
        router.refresh();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewProducts = () => {
    router.push(`/admin/products?categoryId=${categoryId}`);
  };

  const handleAddSubcategory = () => {
    router.push(`/admin/categories/create?parentId=${categoryId}`);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="mr-1 h-3 w-3" />
          Inactive
        </span>
      );
    }
  };

  const getProductStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return '#️⃣';
      case 'select':
        return '📋';
      case 'multiselect':
        return '📚';
      case 'boolean':
        return '✓';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading category details...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Category not found</p>
          <Link href="/admin/categories" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/categories" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Categories
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                {getStatusBadge(category.status)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Slug: {category.slug}</p>
            </div>
            
            <div className="flex gap-2">
              <Link
                href={`/admin/categories/${categoryId}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting || childCategories.length > 0 || products.length > 0}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Image */}
            {category.image && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Category Image</h2>
                <div className="relative h-48 w-48 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {category.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{category.description}</p>
              </div>
            )}

            {/* Specification Template */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-medium text-gray-900">Specification Template</h2>
                <span className="text-sm text-gray-500">
                  ({category.specificationTemplate?.length || 0} group(s))
                </span>
              </div>
              
              {!category.specificationTemplate || category.specificationTemplate.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No specification template defined for this category.</p>
                  <Link
                    href={`/admin/categories/${categoryId}/edit`}
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                  >
                    Add specification template
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {category.specificationTemplate.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.fields.map((field, fieldIndex) => (
                              <tr key={fieldIndex}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500 font-mono">{field.key}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  <span className="inline-flex items-center gap-1">
                                    {getFieldTypeIcon(field.type)} {field.type}
                                    {field.unit && <span className="text-xs text-gray-400 ml-1">({field.unit})</span>}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {field.options && field.options.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {field.options.map((opt, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                          {opt}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <div className="flex gap-2">
                                    {field.filterable && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                                        Filterable
                                      </span>
                                    )}
                                    {field.isVariantAttribute && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-800">
                                        Variant
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Category Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-500" />
                Category Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Category ID</label>
                  <p className="text-sm text-gray-900 font-mono mt-1 break-all">{category._id}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Slug</label>
                  <p className="text-sm text-gray-900 mt-1">{category.slug}</p>
                </div>
                
                {parentCategory && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Parent Category</label>
                    <div className="mt-1">
                      <Link
                        href={`/admin/categories/${parentCategory._id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <FolderTree className="h-3 w-3" />
                        {parentCategory.name}
                      </Link>
                    </div>
                  </div>
                )}
                
                {childCategories.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Subcategories ({childCategories.length})
                    </label>
                    <div className="mt-2 space-y-1">
                      {childCategories.map(child => (
                        <Link
                          key={child._id}
                          href={`/admin/categories/${child._id}`}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 py-1"
                        >
                          <ChevronRight className="h-3 w-3" />
                          {child.name}
                          {child.status === 'inactive' && (
                            <span className="text-xs text-gray-400 ml-1">(Inactive)</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Specification Groups</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {category.specificationTemplate?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Fields</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {category.specificationTemplate?.reduce((total, group) => total + group.fields.length, 0) || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Variant Attributes</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {category.specificationTemplate?.reduce(
                      (total, group) => total + group.fields.filter(f => f.isVariantAttribute).length, 0
                    ) || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Filterable Fields</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {category.specificationTemplate?.reduce(
                      (total, group) => total + group.fields.filter(f => f.filterable).length, 0
                    ) || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Required Fields</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {category.specificationTemplate?.reduce(
                      (total, group) => total + group.fields.filter(f => f.required).length, 0
                    ) || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-gray-600">Total Products</span>
                  <span className="text-lg font-semibold text-blue-600">{products.length}</span>
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Metadata
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(category.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(category.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={handleViewProducts}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-4 w-4 mr-2" />
                  View All Products
                </button>
                
                <Link
                  href={`/admin/categories/${categoryId}/edit`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Category
                </Link>
                
                <button
                  onClick={handleAddSubcategory}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Products in this Category</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleViewProducts}
                className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
              >
                View All
                <ExternalLink className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            {productsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No products found in this category.</p>
                <button
                  onClick={() => router.push('/admin/products/create')}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.thumbnail ? (
                                <Image
                                  src={product.thumbnail}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Brand: {typeof product.brand === 'object' && product.brand?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-mono">{product.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${product.price?.toFixed(2) || '0.00'} - ${product.maxPrice?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {product.totalInventory || 0} units
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProductStatusBadge(product.status)}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}