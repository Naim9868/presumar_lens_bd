'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2,
  GripVertical,
  FolderPlus,
  Eye,
  EyeOff,
  MoreVertical,
  Copy,
  RefreshCw
} from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '@/hooks/useToast';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string[];
  isActive: boolean;
  productCount?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  onReorder?: (categories: Category[]) => void;
  loading?: boolean;
  searchTerm?: string;
}

export default function CategoryTree({ 
  categories, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  onReorder,
  loading = false,
  searchTerm = ''
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<Category | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { showToast } = useToast();

  // Auto-expand parent nodes when searching
  useEffect(() => {
    if (searchTerm) {
      const expanded = new Set<string>();
      categories.forEach(category => {
        if (category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          // Expand all parents of matching categories
          let current = category;
          while (current.parentId) {
            expanded.add(current.parentId);
            const parent = findCategoryById(categories, current.parentId);
            if (parent) current = parent;
            else break;
          }
        }
      });
      setExpandedNodes(expanded);
    }
  }, [searchTerm, categories]);

  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat._id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllCategoryIds = (cats: Category[]): string[] => {
    let ids: string[] = [];
    cats.forEach(cat => {
      ids.push(cat._id);
      if (cat.children) {
        ids = [...ids, ...getAllCategoryIds(cat.children)];
      }
    });
    return ids;
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = getAllCategoryIds(categories);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const expandToLevel = (level: number) => {
    const expanded = new Set<string>();
    const collectCategories = (cats: Category[], currentLevel: number = 0) => {
      if (currentLevel >= level) return;
      cats.forEach(cat => {
        expanded.add(cat._id);
        if (cat.children) {
          collectCategories(cat.children, currentLevel + 1);
        }
      });
    };
    collectCategories(categories);
    setExpandedNodes(expanded);
  };

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category._id);
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItemId(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    setDragOverItemId(null);
    
    if (!draggedItem || draggedItem._id === targetCategory._id) return;
    
    // Prevent moving a category into its own child
    const isChild = (parent: Category, childId: string): boolean => {
      if (parent._id === childId) return true;
      if (parent.children) {
        return parent.children.some(child => isChild(child, childId));
      }
      return false;
    };
    
    if (isChild(targetCategory, draggedItem._id)) {
      showToast('Cannot move a category into its own subcategory', 'error');
      return;
    }
    
    // Check if trying to move to a different level (optional - implement based on your business logic)
    if (targetCategory.level > draggedItem.level + 1) {
      showToast('Cannot move category more than one level deeper', 'warning');
      return;
    }
    
    // Handle the reorder (implement your API call here)
    if (onReorder) {
      // Create new tree structure
      const newCategories = [...categories];
      // Remove dragged item
      const removeFromTree = (cats: Category[], id: string): Category[] => {
        return cats.filter(cat => {
          if (cat._id === id) return false;
          if (cat.children) {
            cat.children = removeFromTree(cat.children, id);
          }
          return true;
        });
      };
      
      // Add dragged item as child of target
      const addToTree = (cats: Category[], parentId: string, item: Category): Category[] => {
        return cats.map(cat => {
          if (cat._id === parentId) {
            if (!cat.children) cat.children = [];
            cat.children.push({ ...item, parentId, level: cat.level + 1 });
          } else if (cat.children) {
            cat.children = addToTree(cat.children, parentId, item);
          }
          return cat;
        });
      };
      
      let updatedTree = removeFromTree(newCategories, draggedItem._id);
      updatedTree = addToTree(updatedTree, targetCategory._id, draggedItem);
      
      onReorder(updatedTree);
      showToast('Category moved successfully', 'success');
    }
    
    setDraggedItem(null);
  };

  const getCategoryBadge = (category: Category) => {
    if (!category.isActive) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          <EyeOff className="h-3 w-3 mr-1" />
          Inactive
        </span>
      );
    }
    if (category.productCount && category.productCount > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          {category.productCount} products
        </span>
      );
    }
    return null;
  };

  const filterCategories = (cats: Category[]): Category[] => {
    if (!searchTerm) return cats;
    
    return cats.filter(cat => {
      const matches = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matches) return true;
      
      if (cat.children) {
        const matchingChildren = filterCategories(cat.children);
        if (matchingChildren.length > 0) {
          cat.children = matchingChildren;
          return true;
        }
      }
      
      return false;
    }).map(cat => ({
      ...cat,
      children: cat.children ? filterCategories(cat.children) : []
    }));
  };

  const renderCategoryItem = (category: Category, level: number = 0) => {
    const isExpanded = expandedNodes.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    const isDragOver = dragOverItemId === category._id;
    const isHovered = hoveredItem === category._id;
    
    return (
      <div key={category._id}>
        <div
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, category)}
          onDragOver={(e) => handleDragOver(e, category._id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category)}
          className={`
            group relative transition-all duration-200
            ${isDragOver ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 border-dashed' : ''}
            ${!category.isActive ? 'opacity-60' : ''}
          `}
          style={{ paddingLeft: `${level * 24}px` }}
        >
          <div className={`
            flex items-center justify-between px-4 py-3 
            hover:bg-gray-50 dark:hover:bg-gray-800 
            transition-colors border-b border-gray-100 dark:border-gray-800
            ${isHovered ? 'bg-gray-50 dark:bg-gray-800' : ''}
          `}>
            <div className="flex items-center flex-1 min-w-0">
              {/* Drag Handle */}
              {onReorder && (
                <div 
                  className="cursor-grab active:cursor-grabbing mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={() => setHoveredItem(category._id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              )}
              
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category._id)}
                  className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              
              {/* Icon */}
              <FolderTree className={`
                h-5 w-5 mr-3 flex-shrink-0
                ${category.isActive ? 'text-amber-500' : 'text-gray-400'}
              `} />
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`
                    font-medium truncate
                    ${category.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                  `}>
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {category.slug}
                  </span>
                  {getCategoryBadge(category)}
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className={`
              flex items-center space-x-1 
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}>
              <button
                onClick={() => onAddSubcategory(category._id)}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                title="Add subcategory"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(category)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit category"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(category)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = filterCategories(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No categories found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first category'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Categories: {getAllCategoryIds(categories).length}
          </span>
          {onReorder && (
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
              Drag and drop to reorder
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={expandAll} variant="secondary" size="sm">
            Expand All
          </Button>
          <Button onClick={collapseAll} variant="secondary" size="sm">
            Collapse All
          </Button>
          <select
            onChange={(e) => expandToLevel(parseInt(e.target.value))}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1"
            defaultValue=""
          >
            <option value="" disabled>Expand to level</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        </div>
      </div>
      
      {/* Category Tree */}
      <div className="rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredCategories.map(category => renderCategoryItem(category))}
      </div>
    </div>
  );
}