// app/admin/components/CategoryForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Loader2, X, Image as ImageIcon, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import Input from '@/components/admin/ui/Input';
import { useToast } from '@/hooks/useToast';

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

interface CategoryFormProps {
  categoryId?: string;
  isEditing?: boolean;
  onSuccess?: () => void;
}

interface CategoryData {
  name: string;
  slug: string;
  image: string;
  description: string;
  parentId: string;
  status: 'active' | 'inactive';
  specificationTemplate: CategoryGroup[];
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

// Options Input Component
const OptionsInput = ({ 
  field, 
  groupIndex, 
  fieldIndex, 
  optionsTempValues, 
  setOptionsTempValues, 
  updateSpecField 
}: any) => {
  const tempKey = `${groupIndex}-${fieldIndex}`;
  const tempValue = optionsTempValues[tempKey];
  const displayValue = tempValue !== undefined ? tempValue : (field.options?.join(', ') || '');
  
  return (
    <input
      type="text"
      placeholder="Options (comma separated)"
      value={displayValue}
      onChange={(e) => {
        const newValue = e.target.value;
        setOptionsTempValues((prev: any) => ({
          ...prev,
          [tempKey]: newValue
        }));
      }}
      onBlur={(e) => {
        const value = e.target.value;
        if (value.trim()) {
          const options = value.split(',').map((o: string) => o.trim()).filter((o: string) => o);
          updateSpecField(groupIndex, fieldIndex, { options });
        } else {
          updateSpecField(groupIndex, fieldIndex, { options: [] });
        }
        setOptionsTempValues((prev: any) => {
          const newState = { ...prev };
          delete newState[tempKey];
          return newState;
        });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className="col-span-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
    />
  );
};

export default function CategoryForm({ categoryId, isEditing = false, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [optionsTempValues, setOptionsTempValues] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    slug: '',
    image: '',
    description: '',
    parentId: '',
    status: 'active',
    specificationTemplate: []
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing && categoryId) {
      fetchCategory();
    }
  }, [categoryId, isEditing]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`);
      const data = await response.json();
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          image: data.image || '',
          description: data.description || '',
          parentId: data.parentId || '',
          status: data.status || 'active',
          specificationTemplate: data.specificationTemplate || []
        });
        setExpandedGroups(new Set((data.specificationTemplate || []).map((_: any, index: number) => index)));
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast('Failed to fetch category', 'error');
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    if (file.size < 500 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '.jpg'),
                  { type: 'image/jpeg' }
                );
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'categories');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress({
            fileName: file.name,
            progress: percent,
            status: 'uploading'
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

      xhr.open('POST', '/api/upload');
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(null);

    try {
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        fileToUpload = await compressImage(file);
      }

      const imageUrl = await uploadToCloudinary(fileToUpload);

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'success'
      });

      setFormData({ ...formData, image: imageUrl });
      showToast('Image uploaded successfully', 'success');

      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload image. Please try again.', 'error');
      setUploadProgress(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image) return;

    const publicId = extractPublicIdFromUrl(formData.image);

    if (publicId) {
      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete from Cloudinary');
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete image', 'error');
      }
    }

    setFormData({ ...formData, image: '' });
    showToast('Image removed', 'success');
  };

  const generateSlug = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const addSpecGroup = () => {
    const newGroup: CategoryGroup = {
      groupName: `New Group ${formData.specificationTemplate.length + 1}`,
      fields: [],
      displayOrder: formData.specificationTemplate.length
    };
    setFormData({
      ...formData,
      specificationTemplate: [...formData.specificationTemplate, newGroup]
    });
    setExpandedGroups(prev => new Set(prev).add(formData.specificationTemplate.length));
  };

  const removeSpecGroup = (index: number) => {
    if (confirm('Remove this specification group? All fields in this group will be deleted.')) {
      const newTemplate = formData.specificationTemplate.filter((_, i) => i !== index);
      setFormData({ ...formData, specificationTemplate: newTemplate });
      setExpandedGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const updateSpecGroup = (index: number, updates: Partial<CategoryGroup>) => {
    const newTemplate = [...formData.specificationTemplate];
    newTemplate[index] = { ...newTemplate[index], ...updates };
    setFormData({ ...formData, specificationTemplate: newTemplate });
  };

  const addSpecField = (groupIndex: number) => {
    const newField: CategoryField = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      filterable: false,
      isVariantAttribute: false
    };
    const newTemplate = [...formData.specificationTemplate];
    newTemplate[groupIndex].fields.push(newField);
    setFormData({ ...formData, specificationTemplate: newTemplate });
  };

  const removeSpecField = (groupIndex: number, fieldIndex: number) => {
    const newTemplate = [...formData.specificationTemplate];
    newTemplate[groupIndex].fields.splice(fieldIndex, 1);
    setFormData({ ...formData, specificationTemplate: newTemplate });
  };

  const updateSpecField = (groupIndex: number, fieldIndex: number, updates: Partial<CategoryField>) => {
    const newTemplate = [...formData.specificationTemplate];
    newTemplate[groupIndex].fields[fieldIndex] = { ...newTemplate[groupIndex].fields[fieldIndex], ...updates };
    setFormData({ ...formData, specificationTemplate: newTemplate });
  };

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setLoading(true);

    try {
      const url = isEditing && categoryId
        ? `/api/admin/categories/${categoryId}`
        : '/api/admin/categories';
      const method = isEditing ? 'PUT' : 'POST';

      const slug = formData.slug || generateSlug(formData.name);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          `Category ${isEditing ? 'updated' : 'created'} successfully`,
          'success'
        );
        onSuccess?.();
        router.push('/admin/categories');
        router.refresh();
      } else {
        showToast(data.error || `Failed to ${isEditing ? 'update' : 'create'} category`, 'error');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Category Image</h2>

        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
              {formData.image ? (
                <>
                  <Image
                    src={formData.image}
                    alt="Category preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </div>
              </label>

              {formData.image && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            {uploadProgress && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 truncate flex-1">
                    {uploadProgress.fileName}
                  </span>
                  <span className="text-blue-600 ml-2">
                    {uploadProgress.status === 'uploading'
                      ? `${Math.round(uploadProgress.progress)}%`
                      : uploadProgress.status === 'success'
                        ? '✓ Complete'
                        : '✗ Failed'}
                  </span>
                </div>
                {uploadProgress.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Recommended: Square image, 800x800px, max 2MB. Supports JPG, PNG, WebP, GIF
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: !formData.slug || (!isEditing && !formData.slug)
                  ? generateSlug(name)
                  : formData.slug
              });
            }}
            required
            placeholder="e.g., Camera Lenses"
            autoFocus
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
            placeholder="auto-generated-from-name"
            helpText="URL-friendly version of the category name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">None (Top Level Category)</option>
              {categories
                .filter(cat => cat._id !== categoryId)
                .map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Brief description of the category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Specification Template Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Specification Template</h2>
            <p className="text-sm text-gray-500 mt-1">
              Define what specifications products in this category can have.
              Specifications marked as "variant attributes" will be used to generate product variants.
            </p>
          </div>
          <button
            type="button"
            onClick={addSpecGroup}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </button>
        </div>

        {formData.specificationTemplate.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">No specification groups defined yet.</p>
            <button
              type="button"
              onClick={addSpecGroup}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Add your first group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.specificationTemplate.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(groupIndex);

              return (
                <div key={groupIndex} className="border rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupIndex)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        placeholder="Group Name (e.g., Technical Specs)"
                        value={group.groupName}
                        onChange={(e) => updateSpecGroup(groupIndex, { groupName: e.target.value })}
                        className="text-md font-medium rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-64"
                      />
                      <span className="text-xs text-gray-500">
                        ({group.fields.length} field{group.fields.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpecGroup(groupIndex)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {group.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <input
                              type="text"
                              placeholder="Key (e.g., processor)"
                              value={field.key}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { key: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Label (e.g., Processor)"
                              value={field.label}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { label: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <select
                              value={field.type}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { type: e.target.value as any })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="select">Select</option>
                              <option value="multiselect">Multi-Select</option>
                              <option value="boolean">Boolean</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                            <input
                              type="text"
                              placeholder="Unit (e.g., GHz, mm)"
                              value={field.unit || ''}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { unit: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />

                            {(field.type === 'select' || field.type === 'multiselect') && (
                              <OptionsInput
                                field={field}
                                groupIndex={groupIndex}
                                fieldIndex={fieldIndex}
                                optionsTempValues={optionsTempValues}
                                setOptionsTempValues={setOptionsTempValues}
                                updateSpecField={updateSpecField}
                              />
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.filterable}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { filterable: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Filterable
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.isVariantAttribute}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { isVariantAttribute: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Variant
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSpecField(groupIndex, fieldIndex)}
                            className="text-xs text-red-600 hover:text-red-800 mt-1 inline-flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Remove field
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addSpecField(groupIndex)}
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/categories')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            <>{isEditing ? 'Update Category' : 'Create Category'}</>
          )}
        </button>
      </div>
    </form>
  );
}