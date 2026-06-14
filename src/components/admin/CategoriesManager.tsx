// src/components/admin/CategoriesManager.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  X,
  MoveRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  imagePublicId?: string;
  description?: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface FormData {
  name: string;
  image: string;
  imagePublicId: string;
  description: string;
  parentId: string;
  status: 'active' | 'inactive';  // Updated to include both statuses
}

interface CategoriesManagerProps {
  initialCategories: Category[];
}

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(() =>
    initialCategories.map(cat => ({
      ...cat,
      createdAt: typeof cat.createdAt === 'string' ? cat.createdAt : cat.createdAt.toISOString(),
      updatedAt: typeof cat.updatedAt === 'string' ? cat.updatedAt : cat.updatedAt.toISOString(),
    }))
  );
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [useImageLink, setUseImageLink] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentPublicId, setCurrentPublicId] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    image: '',
    imagePublicId: '',
    description: '',
    parentId: '',
    status: 'active' as const,
  });

  // Build category tree
  const buildCategoryTree = (categoriesList: Category[], parentId: string | null = null): any[] => {
    return categoriesList
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categoriesList, cat._id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter categories based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower)
      );
      
      // Also include parents of matched categories for context
      const parentIds = new Set<string>();
      filtered.forEach(cat => {
        let current = cat;
        while (current.parentId) {
          const parent = categories.find(c => c._id === current.parentId);
          if (parent) {
            parentIds.add(parent._id);
            current = parent;
          } else {
            break;
          }
        }
      });
      
      const allFiltered = [...filtered, ...categories.filter(cat => parentIds.has(cat._id))];
      setFilteredCategories([...new Map(allFiltered.map(cat => [cat._id, cat])).values()]);
    }
  }, [searchTerm, categories]);

  const categoryTree = buildCategoryTree(filteredCategories);

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image || '',
        imagePublicId: category.imagePublicId || '',
        description: category.description || '',
        parentId: category.parentId || '',
        status: category.status,
      });
      setCurrentImageUrl(category.image || '');
      setCurrentPublicId(category.imagePublicId || '');
      setUseImageLink(!!category.image && category.image.startsWith('http') && !category.imagePublicId);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        image: '',
        imagePublicId: '',
        description: '',
        parentId: '',
        status: 'active',
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
      image: url,
      imagePublicId: publicId || ''
    }));
    setCurrentImageUrl(url);
    setCurrentPublicId(publicId || '');
  };

  const handleImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCurrentImageUrl(url);
    setFormData(prev => ({ 
      ...prev, 
      image: url,
      imagePublicId: '' // Clear publicId when using external link
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory._id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newCategory = {
          ...data.category,
          createdAt: data.category.createdAt || new Date().toISOString(),
          updatedAt: data.category.updatedAt || new Date().toISOString(),
        };
        
        if (editingCategory) {
          setCategories(categories.map(c => c._id === editingCategory._id ? newCategory : c));
          toast.success('Category updated successfully');
        } else {
          setCategories([newCategory, ...categories]);
          toast.success('Category created successfully');
        }
        setShowModal(false);
      } else {
        toast.error(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(categories.map(c => 
          c._id === category._id ? { ...c, status: newStatus } : c
        ));
        toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(data.error || 'Failed to update category status');
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleDelete = async (category: Category) => {
    const hasChildren = categories.some(c => c.parentId === category._id);
    const warning = hasChildren
      ? `Category "${category.name}" has subcategories. Deleting it will also delete all subcategories. Continue?`
      : `Delete category "${category.name}"?`;
    
    if (!confirm(warning)) {
      return;
    }
    
    try {
       if (category?.imagePublicId) {
            const imageRes = await fetch(
              `/api/upload?publicId=${category.imagePublicId}`,
              {
                method: "DELETE",
              }
            );
      
            if (!imageRes.ok) {
              toast.error("Failed to remove brand image");
              return;
            }
          }

      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove deleted category and its children
        const categoriesToRemove = new Set<string>([category._id, ...(data.deletedChildrenIds || [])]);
        setCategories(categories.filter(c => !categoriesToRemove.has(c._id)));
        toast.success('Category deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const renderCategoryTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => (
      <div key={node._id}>
        <div
          className={cn(
            "flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors",
            level > 0 && "ml-8"
          )}
          style={{ marginLeft: level * 24 }}
        >
          <button
            onClick={() => toggleExpand(node._id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {node.children.length > 0 ? (
              expandedNodes.has(node._id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>
          
          <div className="w-10 h-10 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {node.image ? (
              <Image
                src={node.image}
                alt={node.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {expandedNodes.has(node._id) ? (
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                ) : (
                  <Folder className="w-5 h-5 text-amber-500" />
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              <span className="text-xs text-gray-400">({node.slug})</span>
              {node.status === 'inactive' && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Inactive</span>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-gray-500 truncate">{node.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleStatus(node)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title={node.status === 'active' ? 'Deactivate' : 'Activate'}
            >
              {node.status === 'active' ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => handleOpenModal(node)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
        
        {expandedNodes.has(node._id) && node.children.length > 0 && (
          <div className="ml-4">
            {renderCategoryTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Get available parent categories (excluding current and its descendants when editing)
  const getAvailableParents = () => {
    if (!editingCategory) {
      return categories.filter(c => c.status === 'active');
    }
    
    // Get all descendants of current category
    const getDescendants = (catId: string): string[] => {
      const children = categories.filter(c => c.parentId === catId);
      return [catId, ...children.flatMap(c => getDescendants(c._id))];
    };
    
    const excludedIds = getDescendants(editingCategory._id);
    return categories.filter(c => 
      c.status === 'active' && 
      !excludedIds.includes(c._id) && 
      c._id !== editingCategory._id
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
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
          Add Category
        </button>
      </div>

      {/* Categories Tree */}
      {categoryTree.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <Folder className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Click "Add Category" to create your first category'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MoveRight className="w-4 h-4" />
              <span>Category Structure</span>
            </div>
          </div>
          <div className="p-4">
            {renderCategoryTree(categoryTree)}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Clothing, Books"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {getAvailableParents().map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {'—'.repeat(cat.parentId ? 2 : 1)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Image Upload with Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Category Image
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
                      placeholder="https://example.com/category-image.jpg"
                      onChange={handleImageLinkChange}
                      value={currentImageUrl}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL for the category image
                    </p>
                  </div>
                ) : (
                  <div>
                    <ImageUpload
                      onUpload={handleImageUpload}
                      defaultValue={currentImageUrl}
                      defaultPublicId={currentPublicId}
                      folder="categories"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Upload an image or toggle to use an external link
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
                  placeholder="Category description for SEO and customers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}