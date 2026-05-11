// app/admin/categories/[id]/edit/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { useToast } from '@/hooks/useToast';

/* =========================================================
   TYPES
========================================================= */

interface CategoryField {
  key: string;
  label: string;
  type:
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'multiselect';
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
  status: 'active' | 'inactive';
  specificationTemplate: CategoryGroup[];
  children?: Category[];
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface FormDataState {
  name: string;
  slug: string;
  image: string;
  description: string;
  parentId: string;
  status: 'active' | 'inactive';
}

/* =========================================================
   OPTIONS INPUT
========================================================= */

function OptionsInput({
  field,
  groupIndex,
  fieldIndex,
  optionsTempValues,
  setOptionsTempValues,
  updateSpecField,
}: any) {
  const tempKey = `${groupIndex}-${fieldIndex}`;

  const tempValue =
    optionsTempValues[tempKey] ??
    field.options?.join(', ') ??
    '';

  return (
    <input
      type="text"
      placeholder="Options (comma separated)"
      value={tempValue}
      onChange={(e) => {
        setOptionsTempValues((prev: any) => ({
          ...prev,
          [tempKey]: e.target.value,
        }));
      }}
      onBlur={(e) => {
        const value = e.target.value.trim();

        const options = value
          ? value
            .split(',')
            .map((item: string) => item.trim())
            .filter(Boolean)
          : [];

        updateSpecField(groupIndex, fieldIndex, {
          options,
        });

        setOptionsTempValues((prev: any) => {
          const cloned = { ...prev };
          delete cloned[tempKey];
          return cloned;
        });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className="col-span-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900"
    />
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();

  const categoryId = params.id as string;

  const { showToast } = useToast();

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState<UploadProgress | null>(null);

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [specGroups, setSpecGroups] = useState<
    CategoryGroup[]
  >([]);

  const [expandedGroups, setExpandedGroups] =
    useState<Set<number>>(new Set());

  const [optionsTempValues, setOptionsTempValues] =
    useState<Record<string, string>>({});

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] =
    useState<FormDataState>({
      name: '',
      slug: '',
      image: '',
      description: '',
      parentId: '',
      status: 'active',
    });

  /* =========================================================
     HELPERS
  ========================================================= */

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const flattenCategories = (
    nested: Category[]
  ): Category[] => {
    const flat: Category[] = [];

    const walk = (items: Category[]) => {
      items.forEach((item) => {
        flat.push(item);

        if (item.children?.length) {
          walk(item.children);
        }
      });
    };

    walk(nested);

    return flat;
  };

  const isDescendant = (
    potentialChildId: string,
    potentialParentId: string,
    categoriesList: Category[]
  ): boolean => {
    let currentId: string | null = potentialChildId;

    while (currentId) {
      const category = categoriesList.find(
        (c) => c._id === currentId
      );

      if (!category || !category.parentId) {
        break;
      }

      if (category.parentId === potentialParentId) {
        return true;
      }

      currentId = category.parentId;
    }

    return false;
  };

  /* =========================================================
     FETCH DATA
  ========================================================= */

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [categoryRes, categoriesRes] =
        await Promise.all([
          fetch(`/api/categories/${categoryId}`, {
            cache: 'no-store',
          }),
          fetch('/api/categories', {
            cache: 'no-store',
          }),
        ]);

      if (!categoryRes.ok) {
        throw new Error('Failed to fetch category');
      }

      if (!categoriesRes.ok) {
        throw new Error(
          'Failed to fetch categories'
        );
      }

      const category: Category =
        await categoryRes.json();

      const allCategories =
        await categoriesRes.json();

      const flatCategories =
        flattenCategories(allCategories);

      const filteredCategories =
        flatCategories.filter((cat) => {
          if (cat._id === categoryId) {
            return false;
          }

          if (
            isDescendant(
              cat._id,
              categoryId,
              flatCategories
            )
          ) {
            return false;
          }

          return true;
        });

      setCategories(filteredCategories);

      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        image: category.image || '',
        description: category.description || '',
        parentId: category.parentId || '',
        status: category.status || 'active',
      });

      setSpecGroups(
        category.specificationTemplate || []
      );

      setExpandedGroups(
        new Set(
          (category.specificationTemplate || []).map(
            (_, index) => index
          )
        )
      );
    } catch (error) {
      console.error(error);

      showToast(
        'Failed to load category data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     IMAGE
  ========================================================= */

  const compressImage = async (
    file: File
  ): Promise<File> => {
    if (file.size <= 500 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new window.Image();

        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas =
            document.createElement('canvas');

          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(
                (height * MAX_WIDTH) / width
              );

              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(
                (width * MAX_HEIGHT) / height
              );

              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error('Compression failed')
                );
                return;
              }

              resolve(
                new File(
                  [blob],
                  file.name.replace(
                    /\.[^/.]+$/,
                    '.jpg'
                  ),
                  {
                    type: 'image/jpeg',
                  }
                )
              );
            },
            'image/jpeg',
            0.82
          );
        };

        img.onerror = () =>
          reject(new Error('Image load failed'));
      };

      reader.onerror = () =>
        reject(new Error('File read failed'));
    });
  };

  const uploadToCloudinary = async (
    file: File
  ): Promise<string> => {
    const data = new FormData();

    data.append('file', file);
    data.append('folder', 'categories');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener(
        'progress',
        (event) => {
          if (event.lengthComputable) {
            const percent =
              (event.loaded / event.total) * 100;

            setUploadProgress({
              fileName: file.name,
              progress: percent,
              status: 'uploading',
            });
          }
        }
      );

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(
            xhr.responseText
          );

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response.url);
          } else {
            reject(
              new Error(
                response.error || 'Upload failed'
              )
            );
          }
        } catch {
          reject(
            new Error('Invalid upload response')
          );
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.timeout = 60000;

      xhr.ontimeout = () => {
        reject(new Error('Upload timeout'));
      };

      xhr.open('POST', '/api/upload');

      xhr.send(data);
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(
        'Please upload a valid image',
        'error'
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast(
        'Image size should be less than 2MB',
        'error'
      );
      return;
    }

    try {
      setUploadingImage(true);

      let fileToUpload = file;

      if (file.size > 500 * 1024) {
        fileToUpload = await compressImage(file);
      }

      const imageUrl =
        await uploadToCloudinary(fileToUpload);

      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'success',
      });

      showToast(
        'Image uploaded successfully',
        'success'
      );

      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    } catch (error) {
      console.error(error);

      showToast(
        'Failed to upload image',
        'error'
      );

      setUploadProgress(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to remove image'
        );
      }

      setFormData((prev) => ({
        ...prev,
        image: '',
      }));

      showToast(
        'Image removed successfully',
        'success'
      );
    } catch (error: any) {
      console.error(error);

      showToast(
        error.message || 'Failed to remove image',
        'error'
      );
    } finally {
      setSaving(false);
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


  const handleCancel = async () => {
    if (formData.image) {
      const publicId = extractPublicIdFromUrl(formData.image);

      if (publicId) {
        await fetch('/api/upload', {
          method: 'DELETE',
          body: JSON.stringify({ publicId }),
        });
      }
    }

    router.push('/admin/categories');
  };

  /* =========================================================
     SPEC GROUPS
  ========================================================= */

  const addSpecGroup = () => {
    const newGroup: CategoryGroup = {
      groupName: `New Group ${specGroups.length + 1
        }`,
      fields: [],
      displayOrder: specGroups.length,
    };

    setSpecGroups((prev) => [...prev, newGroup]);

    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.add(specGroups.length);
      return next;
    });
  };

  const removeSpecGroup = (index: number) => {
    const confirmed = window.confirm(
      'Remove this specification group?'
    );

    if (!confirmed) return;

    setSpecGroups((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateSpecGroup = (
    index: number,
    updates: Partial<CategoryGroup>
  ) => {
    setSpecGroups((prev) =>
      prev.map((group, i) =>
        i === index
          ? {
            ...group,
            ...updates,
          }
          : group
      )
    );
  };

  const addSpecField = (groupIndex: number) => {
    const newField: CategoryField = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      filterable: false,
      isVariantAttribute: false,
    };

    setSpecGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            fields: [
              ...group.fields,
              newField,
            ],
          }
          : group
      )
    );
  };

  const removeSpecField = (
    groupIndex: number,
    fieldIndex: number
  ) => {
    setSpecGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            fields: group.fields.filter(
              (_, idx) => idx !== fieldIndex
            ),
          }
          : group
      )
    );
  };

  const updateSpecField = (
    groupIndex: number,
    fieldIndex: number,
    updates: Partial<CategoryField>
  ) => {
    setSpecGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;

        return {
          ...group,
          fields: group.fields.map((field, idx) =>
            idx === fieldIndex
              ? {
                ...field,
                ...updates,
              }
              : field
          ),
        };
      })
    );
  };

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const validationErrors: Record<
      string,
      string
    > = {};

    if (!formData.name.trim()) {
      validationErrors.name =
        'Category name is required';
    }

    if (
      formData.parentId &&
      formData.parentId === categoryId
    ) {
      validationErrors.parentId =
        'Category cannot be its own parent';
    }

    specGroups.forEach((group, groupIndex) => {
      if (!group.groupName.trim()) {
        validationErrors[
          `group-${groupIndex}`
        ] = 'Group name is required';
      }

      group.fields.forEach((field, fieldIndex) => {
        if (!field.key.trim()) {
          validationErrors[
            `field-key-${groupIndex}-${fieldIndex}`
          ] = 'Field key is required';
        }

        if (!field.label.trim()) {
          validationErrors[
            `field-label-${groupIndex}-${fieldIndex}`
          ] = 'Field label is required';
        }
      });
    });

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const cleanedSpecGroups = useMemo(() => {
    return specGroups.map((group, index) => ({
      ...group,
      displayOrder: index,
      fields: group.fields.map((field) => ({
        ...field,
        key: field.key.trim(),
        label: field.label.trim(),
        unit: field.unit?.trim() || '',
        options:
          field.options?.filter(Boolean) || [],
      })),
    }));
  }, [specGroups]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(
        'Please fix validation errors',
        'error'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        slug:
          formData.slug.trim() ||
          generateSlug(formData.name),
        image: formData.image,
        description:
          formData.description.trim(),
        status: formData.status,
        specificationTemplate:
          cleanedSpecGroups,
        parentId:
          formData.parentId || '',
      };

      const response = await fetch(
        `/api/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Update failed'
        );
      }

      showToast(
        'Category updated successfully',
        'success'
      );

      router.push('/admin/categories');

      router.refresh();
    } catch (error: any) {
      console.error(error);

      setErrors({
        submit:
          error.message ||
          'Failed to update category',
      });

      showToast(
        error.message ||
        'Failed to update category',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">
            Loading category...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/admin/categories"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Categories
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Edit Category
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Update category information and
            specification template
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* IMAGE */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Category Image
            </h2>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                  {formData.image ? (
                    <>
                      <Image
                        src={formData.image}
                        alt="Category"
                        fill
                        unoptimized
                        sizes="128px"
                        className="object-cover"
                      />

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                    />

                    <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>

                {uploadProgress && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="truncate text-blue-700">
                        {uploadProgress.fileName}
                      </span>

                      <span className="text-blue-700">
                        {uploadProgress.status ===
                          'uploading'
                          ? `${Math.round(
                            uploadProgress.progress
                          )}%`
                          : '✓ Complete'}
                      </span>
                    </div>

                    {uploadProgress.status ===
                      'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadProgress.progress}%`,
                            }}
                          />
                        </div>
                      )}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Recommended: 800x800px,
                  max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setFormData((prev) => ({
                      ...prev,
                      name: value,
                      slug:
                        prev.slug ||
                        generateSlug(value),
                    }));
                  }}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.name
                      ? 'border-red-500'
                      : ''
                    }`}
                />

                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>

                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: generateSlug(
                        e.target.value
                      ),
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>

                <select
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">
                    None (Top Level)
                  </option>

                  {categories.map((cat) => (
                    <option
                      key={cat._id}
                      value={cat._id}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>

                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status:
                        e.target
                          .value as any,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* SPEC TEMPLATE */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Specification Template
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Define specifications for
                  products in this category.
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

            {specGroups.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">
                  No specification groups yet.
                </p>

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
                {specGroups.map(
                  (group, groupIndex) => {
                    const isExpanded =
                      expandedGroups.has(
                        groupIndex
                      );

                    return (
                      <div
                        key={groupIndex}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="flex justify-between items-center p-4 bg-gray-50">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                toggleGroup(
                                  groupIndex
                                )
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <input
                              type="text"
                              value={
                                group.groupName
                              }
                              onChange={(e) =>
                                updateSpecGroup(
                                  groupIndex,
                                  {
                                    groupName:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="text-md font-medium rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-64 text-gray-900"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeSpecGroup(
                                groupIndex
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {group.fields.map(
                              (
                                field,
                                fieldIndex
                              ) => (
                                <div
                                  key={
                                    fieldIndex
                                  }
                                  className="border-l-2 border-gray-200 pl-4 py-2"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                                    <input
                                      type="text"
                                      placeholder="Key"
                                      value={
                                        field.key
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateSpecField(
                                          groupIndex,
                                          fieldIndex,
                                          {
                                            key: e
                                              .target
                                              .value,
                                          }
                                        )
                                      }
                                      className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900"
                                    />

                                    <input
                                      type="text"
                                      placeholder="Label"
                                      value={
                                        field.label
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateSpecField(
                                          groupIndex,
                                          fieldIndex,
                                          {
                                            label:
                                              e
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900"
                                    />

                                    <select
                                      value={
                                        field.type
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateSpecField(
                                          groupIndex,
                                          fieldIndex,
                                          {
                                            type: e
                                              .target
                                              .value as any,
                                          }
                                        )
                                      }
                                      className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900"
                                    >
                                      <option value="text">
                                        Text
                                      </option>

                                      <option value="textarea">
                                        Textarea
                                      </option>

                                      <option value="number">
                                        Number
                                      </option>

                                      <option value="select">
                                        Select
                                      </option>

                                      <option value="multiselect">
                                        Multi Select
                                      </option>

                                      <option value="boolean">
                                        Boolean
                                      </option>
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                                    <input
                                      type="text"
                                      placeholder="Unit"
                                      value={
                                        field.unit ||
                                        ''
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateSpecField(
                                          groupIndex,
                                          fieldIndex,
                                          {
                                            unit: e
                                              .target
                                              .value,
                                          }
                                        )
                                      }
                                      className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900"
                                    />

                                    {(field.type ===
                                      'select' ||
                                      field.type ===
                                      'multiselect') && (
                                        <OptionsInput
                                          field={
                                            field
                                          }
                                          groupIndex={
                                            groupIndex
                                          }
                                          fieldIndex={
                                            fieldIndex
                                          }
                                          optionsTempValues={
                                            optionsTempValues
                                          }
                                          setOptionsTempValues={
                                            setOptionsTempValues
                                          }
                                          updateSpecField={
                                            updateSpecField
                                          }
                                        />
                                      )}

                                    <div className="flex items-center gap-3 flex-wrap">
                                      <label className="flex items-center gap-1 text-sm text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={
                                            field.required
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            updateSpecField(
                                              groupIndex,
                                              fieldIndex,
                                              {
                                                required:
                                                  e
                                                    .target
                                                    .checked,
                                              }
                                            )
                                          }
                                        />
                                        Required
                                      </label>

                                      <label className="flex items-center gap-1 text-sm text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={
                                            field.filterable
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            updateSpecField(
                                              groupIndex,
                                              fieldIndex,
                                              {
                                                filterable:
                                                  e
                                                    .target
                                                    .checked,
                                              }
                                            )
                                          }
                                        />
                                        Filterable
                                      </label>

                                      <label className="flex items-center gap-1 text-sm text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={
                                            field.isVariantAttribute
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            updateSpecField(
                                              groupIndex,
                                              fieldIndex,
                                              {
                                                isVariantAttribute:
                                                  e
                                                    .target
                                                    .checked,
                                              }
                                            )
                                          }
                                        />
                                        Variant
                                      </label>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeSpecField(
                                        groupIndex,
                                        fieldIndex
                                      )
                                    }
                                    className="text-xs text-red-600 hover:text-red-800 mt-1 inline-flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Remove field
                                  </button>
                                </div>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                addSpecField(
                                  groupIndex
                                )
                              }
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Field
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* ERRORS */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following errors:
              </h3>

              <ul className="list-disc list-inside text-sm text-red-700">
                {Object.entries(errors).map(
                  ([key, error]) => (
                    <li key={key}>{error}</li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/categories"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving || uploadingImage
              }
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />

              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}