// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Eye, RefreshCw, Search, FolderTree, FileText } from 'lucide-react';

interface CategoryField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  filterable: boolean;
  isVariantAttribute: boolean;
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
  parentId: string | null;
  status: string;
  specificationTemplate: CategoryGroup[];
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, withTemplate: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, statusFilter, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
      // Auto-expand first level
      setExpandedIds(new Set(data.map((c: Category) => c._id)));
      
      // Calculate stats
      const calculateStats = (items: Category[]): { total: number; active: number; inactive: number; withTemplate: number } => {
        let total = 0;
        let active = 0;
        let inactive = 0;
        let withTemplate = 0;
        
        const count = (cats: Category[]) => {
          cats.forEach(cat => {
            total++;
            if (cat.status === 'active') active++;
            else inactive++;
            if (cat.specificationTemplate?.length > 0) withTemplate++;
            if (cat.children) count(cat.children);
          });
        };
        
        count(items);
        return { total, active, inactive, withTemplate };
      };
      
      setStats(calculateStats(data));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    const filterTree = (items: Category[]): Category[] => {
      return items
        .map(item => {
          const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               item.slug.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
          
          const filteredChildren = item.children ? filterTree(item.children) : [];
          
          // Include if matches filters OR has matching children
          if (matchesSearch && matchesStatus) {
            return { ...item, children: filteredChildren };
          }
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean) as Category[];
    };
    
    setFilteredCategories(filterTree(categories));
  };

  const handleDelete = async (id: string, hasChildren: boolean, categoryName: string) => {
    if (hasChildren) {
      alert(`Cannot delete "${categoryName}" because it has subcategories. Please delete or reassign subcategories first.`);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCategories();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (items: Category[]) => {
      items.forEach(item => {
        allIds.add(item._id);
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(categories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const getCategoryPath = (category: Category, allCategories: Category[]): string => {
    const path: string[] = [category.name];
    let current = category;
    
    const findParent = (cat: Category, parents: Category[]): Category | null => {
      for (const parent of parents) {
        if (parent._id === cat.parentId) return parent;
        if (parent.children) {
          const found = findParent(cat, parent.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    while (current.parentId) {
      const parent = findParent(current, allCategories);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return path.join(' / ');
  };

  const renderCategoryTree = (items: Category[], level = 0) => {
    if (items.length === 0 && level === 0 && searchTerm) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories match your search.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Clear search
          </button>
        </div>
      );
    }
    
    return items.map(category => (
      <div key={category._id} className="group">
        <div 
          className={`flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-200 transition-colors ${
            category.status === 'inactive' ? 'bg-gray-50 opacity-75' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {category.children && category.children.length > 0 ? (
              <button
                onClick={() => toggleExpand(category._id)}
                className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
                aria-label={expandedIds.has(category._id) ? 'Collapse' : 'Expand'}
              >
                {expandedIds.has(category._id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-7" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {category.name}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  category.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {category.status}
                </span>
                {category.specificationTemplate?.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {category.specificationTemplate.length} group(s)
                  </span>
                )}
                {category.parentId && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                    <FolderTree className="h-3 w-3" />
                    Subcategory
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">Slug: {category.slug}</span>
                {category.createdAt && (
                  <span className="text-xs text-gray-400">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <Link
              href={`/admin/categories/${category._id}`}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Edit Category"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => router.push(`/admin/products?categoryId=${category._id}`)}
              className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              title="View Products in this Category"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category._id, !!(category.children && category.children.length > 0), category.name)}
              className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete Category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {expandedIds.has(category._id) && category.children && category.children.length > 0 && (
          <div className="ml-4 border-l-2 border-gray-100">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your product categories and their specification templates</p>
          </div>
          <Link
            href="/admin/categories/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FolderTree className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-lg">○</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">With Templates</p>
                <p className="text-2xl font-bold text-purple-600">{stats.withTemplate}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            About Categories
          </h3>
          <p className="text-sm text-blue-700">
            Categories help organize your products. Each category can have a specification template that defines 
            what product specifications are available. Categories can have subcategories for better organization.
            Specifications marked as "variant attributes" will be used to generate product variants.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Expand All"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Collapse All"
              >
                Collapse All
              </button>
              <button
                onClick={fetchCategories}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing filtered results
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No categories found</p>
              <Link href="/admin/categories/create" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                Create your first category
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {renderCategoryTree(filteredCategories)}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {!loading && categories.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredCategories.length} of {stats.total} categories
          </div>
        )}
      </div>
    </div>
  );
}