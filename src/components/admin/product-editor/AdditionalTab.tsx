// src/components/admin/product-editor/AdditionalTab.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Star, TrendingUp, Clock, Tag, Award, Eye, Search, X,
  Rocket, Hash, Globe, Image as ImageIcon, Shield, Zap,
  Sparkles, CheckCircle, Info, AlertCircle, Plus, Edit2,
  Upload, Link
} from 'lucide-react';
import Image from 'next/image';
import ImageUpload from '@/components/admin/ImageUploader';




// Define the badge schema
const badgeSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  color: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['default', 'custom']).optional(),
});

// Define the custom badge schema
const customBadgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
  icon: z.string().optional(),
});

// Define the SEO schema
const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  ogImagePublicId: z.string().optional(),
  noIndex: z.boolean().default(false),
});

// Define the main schema
const additionalSchema = z.object({
  tags: z.array(z.string()).default([]),
  badges: z.array(badgeSchema).default([]),
  customBadges: z.array(customBadgeSchema).default([]),
  featured: z.boolean().default(false),
  searchBoost: z.number().min(1).max(10).default(1),
  status: z.enum(['draft', 'active', 'archived']),
  seo: seoSchema,
});




type AdditionalFormData = z.infer<typeof additionalSchema>;

interface AdditionalTabProps {
  initialData?: Partial<AdditionalFormData>;
  onDataChange?: (data: AdditionalFormData) => void;
}

interface ProductBadge {
  id: string;
  label: string;
  color: string;
  icon?: string;
  type?: 'default' | 'custom';
}

type CustomBadge = ProductBadge;

const defaultBadgeOptions = [
  { id: 'new', value: 'new', label: 'New Arrival', color: 'bg-green-100 text-green-800', icon: 'Sparkles' },
  { id: 'sale', value: 'sale', label: 'Sale', color: 'bg-red-100 text-red-800', icon: 'Tag' },
  { id: 'bestseller', value: 'bestseller', label: 'Bestseller', color: 'bg-amber-100 text-amber-800', icon: 'TrendingUp' },
  { id: 'limited', value: 'limited', label: 'Limited Edition', color: 'bg-purple-100 text-purple-800', icon: 'Zap' },
  { id: 'exclusive', value: 'exclusive', label: 'Exclusive', color: 'bg-indigo-100 text-indigo-800', icon: 'Shield' },
  { id: 'preorder', value: 'preorder', label: 'Pre-order', color: 'bg-blue-100 text-blue-800', icon: 'Rocket' },
];

const customColorOptions = [
  { name: 'Red', value: 'bg-red-100 text-red-800', gradient: 'from-red-50 to-red-100' },
  { name: 'Blue', value: 'bg-blue-100 text-blue-800', gradient: 'from-blue-50 to-blue-100' },
  { name: 'Green', value: 'bg-green-100 text-green-800', gradient: 'from-green-50 to-green-100' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-800', gradient: 'from-purple-50 to-purple-100' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-800', gradient: 'from-pink-50 to-pink-100' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800', gradient: 'from-yellow-50 to-yellow-100' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800', gradient: 'from-indigo-50 to-indigo-100' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-800', gradient: 'from-orange-50 to-orange-100' },
  { name: 'Teal', value: 'bg-teal-100 text-teal-800', gradient: 'from-teal-50 to-teal-100' },
  { name: 'Cyan', value: 'bg-cyan-100 text-cyan-800', gradient: 'from-cyan-50 to-cyan-100' },
];

const iconOptions = [
  { name: 'Sparkles', component: Sparkles },
  { name: 'Tag', component: Tag },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Zap', component: Zap },
  { name: 'Shield', component: Shield },
  { name: 'Rocket', component: Rocket },
  { name: 'Star', component: Star },
  { name: 'Award', component: Award },
  { name: 'Clock', component: Clock },
  { name: 'CheckCircle', component: CheckCircle },
];

export default function AdditionalTab({ initialData, onDataChange }: AdditionalTabProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showCustomBadgeModal, setShowCustomBadgeModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<CustomBadge | null>(null);
  const [useOgImageLink, setUseOgImageLink] = useState(false);
  const [ogImagePreview, setOgImagePreview] = useState(initialData?.seo?.ogImage || '');
  const [customBadgeForm, setCustomBadgeForm] = useState({
    label: '',
    color: 'bg-purple-100 text-purple-800',
    icon: 'Sparkles',
  });

  const { register, setValue, watch, getValues } = useForm<AdditionalFormData>({
  // Cast resolver to the expected Resolver type to avoid TS 'string[] | undefined' incompatibility
  resolver: zodResolver(additionalSchema) as unknown as Resolver<AdditionalFormData>,
  defaultValues: initialData || {
    tags: [],
    badges: [],
    customBadges: [],
    featured: false,
    searchBoost: 1,
    status: 'draft',
    seo: { 
      metaTitle: '', 
      metaDescription: '', 
      metaKeywords: [], 
      canonicalUrl: '', 
      ogImage: '', 
      ogImagePublicId: '', 
      noIndex: false 
    },
  },
});

  const tags = watch('tags');
  const badges = watch('badges');
  const customBadges = watch('customBadges');
  const featured = watch('featured');
  const searchBoost = watch('searchBoost');
  const status = watch('status');
  const seo = watch('seo');

  // Update preview when ogImage changes
  useEffect(() => {
    setOgImagePreview(seo?.ogImage || '');
  }, [seo?.ogImage]);

  const getMergedBadges = useCallback(() => {
    // Default badges (from badges array - these are objects with type 'default')
    const defaultBadges = (badges || [])
      .filter(b => b && typeof b === 'object' && b.type === 'default')
      .map((b) => ({
        id: b.id,
        label: b.label,
        color: b.color,
        icon: b.icon,
        type: 'default' as const,
      }));

    // Custom badges (from customBadges array)
    const customBadgeObjects = (customBadges || [])
      .filter(b => b && typeof b === 'object')
      .map((b: CustomBadge) => ({
        id: b.id,
        label: b.label,
        color: b.color,
        icon: b.icon,
        type: 'custom' as const,
      }));

    return [...defaultBadges, ...customBadgeObjects];
  }, [badges, customBadges]);

  // Send data to parent whenever form values change
  useEffect(() => {
    const subscription = watch((value) => {
      if (value) {
        // Get current badges and customBadges directly from form
        const currentBadges = value.badges || [];
        const currentCustomBadges = value.customBadges || [];

        // Default badges are already objects with type 'default'
        const defaultBadgeObjects = currentBadges.filter((b: any) => b && b.type === 'default');

        // Custom badges are objects
        const customBadgeObjects = currentCustomBadges.filter((b: any) => b && typeof b === 'object');

        const dataToSend = {
          ...value,
          badges: defaultBadgeObjects,
          customBadges: customBadgeObjects,
        };
        onDataChange?.(dataToSend as AdditionalFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags?.includes(tagInput.trim())) {
      setValue('tags', [...(tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', (tags || []).filter(t => t !== tag));
  };

  const handleAddBadge = (badgeValue: string) => {
    const badge = defaultBadgeOptions.find(
      b => b.value === badgeValue
    );

    if (!badge) return;

    const exists = (badges || []).some(
      b => b.id === badgeValue
    );

    if (!exists) {
      setValue('badges', [
        ...(badges || []),
        {
          id: badge.value,
          label: badge.label,
          color: badge.color,
          icon: badge.icon, // string now
          type: 'default',
        }
      ]);
    }
  };


  const handleAddCustomBadge = () => {
    if (!customBadgeForm.label.trim()) {
      alert('Please enter a badge label');
      return;
    }

    const newBadge: ProductBadge = {
      id:
        editingBadge?.id ||
        `custom-${Date.now()}`,

      label:
        customBadgeForm.label.trim(),

      color:
        customBadgeForm.color ||
        'bg-purple-100 text-purple-800',

      icon:
        customBadgeForm.icon,

      type: 'custom',
    };

    if (editingBadge) {
      const updatedBadges = (customBadges || []).map((badge: ProductBadge) =>
        badge.id === editingBadge.id ? newBadge : badge
      );
      setValue('customBadges', updatedBadges);
    } else {
      setValue('customBadges', [...(customBadges || []), newBadge]);
    }

    setCustomBadgeForm({ label: '', color: 'bg-purple-100 text-purple-800', icon: 'Sparkles' });
    setEditingBadge(null);
    setShowCustomBadgeModal(false);
  };

  const handleEditCustomBadge = (badge: CustomBadge) => {
    setEditingBadge(badge);
    setCustomBadgeForm({
      label: badge.label,
      color: badge.color,
      icon: badge.icon || 'Sparkles',
    });
    setShowCustomBadgeModal(true);
  };

  const handleRemoveBadge = (badgeId: string) => {
    const currentBadges = badges || [];
    const updatedBadges = currentBadges.filter((b: any) => {
      if (typeof b === 'object' && b !== null) return b.id !== badgeId;
      return b !== badgeId;
    });
    setValue('badges', updatedBadges);
  };

  const handleRemoveCustomBadge = (badgeId: string) => {
    if (confirm('Are you sure you want to remove this custom badge?')) {
      setValue('customBadges', (customBadges || []).filter((b: CustomBadge) => b.id !== badgeId));
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seo?.metaKeywords?.includes(keywordInput.trim().toLowerCase())) {
      setValue('seo.metaKeywords', [...(seo?.metaKeywords || []), keywordInput.trim().toLowerCase()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setValue('seo.metaKeywords', (seo?.metaKeywords || []).filter(k => k !== keyword));
  };

  const handleOgImageUpload = (url: string, publicId?: string) => {
    setValue('seo.ogImage', url);
    if (publicId) {
      setValue('seo.ogImagePublicId', publicId);
    }
    setOgImagePreview(url);
  };

  const handleOgImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setValue('seo.ogImage', url);
    setOgImagePreview(url);
  };

  const handleOgImageRemove = () => {
    setValue('seo.ogImage', '');
    setValue('seo.ogImagePublicId', '');
    setOgImagePreview('');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, text: 'Live on store', color: 'text-green-600', bg: 'bg-green-50' };
      case 'draft':
        return { icon: Clock, text: 'Not visible to customers', color: 'text-gray-600', bg: 'bg-gray-50' };
      case 'archived':
        return { icon: ArchiveIcon, text: 'Hidden from store', color: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: Eye, text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const getAllBadges = () => {
    // Get default badges (these are just IDs/strings)
    const defaultBadgeIds = badges || [];

    // Convert default badge IDs to full badge objects
    const defaultBadgeObjects = defaultBadgeIds
      .filter((id: any) => typeof id === 'string' || typeof id === 'object')
      .map((id: any) => {
        // If it's already an object, use it
        if (typeof id === 'object' && id.label) {
          return {
            ...id,
            type: 'default',
          };
        }
        // If it's a string ID, find the matching default badge
        const badgeId = typeof id === 'string' ? id : id.id;
        const defaultBadge = defaultBadgeOptions.find(b => b.value === badgeId);
        if (defaultBadge) {
          return {
            id: defaultBadge.value,
            label: defaultBadge.label,
            color: defaultBadge.color,
            icon: defaultBadge.icon,
            type: 'default',
          };
        }
        return null;
      })
      .filter(Boolean);

    // Get custom badges (these are already objects)
    const customBadgeObjects = (customBadges || [])
      .filter((badge: any) => badge && typeof badge === 'object')
      .map((badge: CustomBadge) => ({
        ...badge,
        type: 'custom',
      }));

    // Combine and remove duplicates
    const allBadges = [...defaultBadgeObjects, ...customBadgeObjects];
    const uniqueBadges = [];
    const seenIds = new Set();

    for (const badge of allBadges) {
      if (badge && badge.id && !seenIds.has(badge.id)) {
        seenIds.add(badge.id);
        uniqueBadges.push(badge);
      }
    }

    return uniqueBadges;
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Publishing Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Publishing</h3>
              <p className="text-sm text-gray-500">Control product visibility</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all"
              >
                <option value="draft">Draft - Not visible to customers</option>
                <option value="active">Active - Visible on store</option>
                <option value="archived">Archived - Hidden from store</option>
              </select>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${statusConfig.bg} rounded-lg`}>
                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.text}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-700">Featured Product</span>
              </label>
              {featured && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs text-amber-700 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    This product will appear in featured sections across your store
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Search Boost
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  {...register('searchBoost', { valueAsNumber: true })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="w-12 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-amber-700">{searchBoost}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                Higher boost = better search ranking (1 = lowest, 10 = highest)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-cyan-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-xl">
              <Tag className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
              <p className="text-sm text-gray-500">Help customers find your product</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 rounded-lg text-sm font-medium border border-cyan-200"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600 ml-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Tags help customers find products. Use descriptive terms like "waterproof", "wireless", "pro".
            </p>
          </div>
        </div>
      </div>

      {/* Badges Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-amber-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Badges</h3>
                <p className="text-sm text-gray-500">Highlight special attributes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBadge(null);
                setCustomBadgeForm({ label: '', color: 'bg-purple-100 text-purple-800', icon: 'Sparkles' });
                setShowCustomBadgeModal(true);
              }}
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Custom Badge
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Default Badges */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Default Badges
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {defaultBadgeOptions.map((badge) => {
                const BadgeIcon =
                  iconOptions.find(
                    i => i.name === badge.icon
                  )?.component || Award;
                const isSelected =
                  badges?.some(b => b.id === badge.value);
                return (
                  <button
                    key={badge.value}
                    type="button"
                    onClick={() => isSelected ? handleRemoveBadge(badge.value) : handleAddBadge(badge.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isSelected
                      ? `${badge.color} ring-2 ring-offset-2 ring-amber-500 shadow-md`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                  >
                    <BadgeIcon className="w-4 h-4" />
                    {badge.label}
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Badges Section */}
          {customBadges && customBadges.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Custom Badges
              </label>
              <div className="flex flex-wrap gap-3">
                {customBadges.map((badge: CustomBadge) => {
                  const IconComponent = iconOptions.find(i => i.name === badge.icon)?.component || Award;
                  return (
                    <div
                      key={badge.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${badge.color} group relative`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {badge.label}
                      <div className="flex gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleEditCustomBadge(badge)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomBadge(badge.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Selected Badges Display */}
          {getAllBadges().length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Selected Badges
              </label>
              <div className="flex flex-wrap gap-2">
                {getAllBadges().map((badge: any, idx: number) => {
                  // Get the actual icon component from the icon name string
                  const IconComponent = iconOptions.find(i => i.name === badge.icon)?.component || Award;

                  // Create a unique key to prevent duplicate key errors
                  const uniqueKey = `${badge.id || badge.label}-${idx}`;

                  return (
                    <span
                      key={uniqueKey}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {badge.label}
                      <button
                        type="button"
                        onClick={() => {
                          if (badge.type === 'default') {
                            handleRemoveBadge(badge.id);
                          } else {
                            handleRemoveCustomBadge(badge.id);
                          }
                        }}
                        className="hover:opacity-70 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Badges appear on product cards to highlight special attributes. Click on default badges to add/remove, or create your own custom badges.
            </p>
          </div>
        </div>
      </div>

      {/* SEO Card */}
      {/* SEO Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Search className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search Engine Optimization (SEO)</h3>
              <p className="text-sm text-gray-500">Improve your search engine ranking</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              {...register('seo.metaTitle')}
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
              placeholder="Leave empty to use product name"
            />
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              This appears as the clickable headline in search results. Recommended: 50-60 characters.
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              {...register('seo.metaDescription')}
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all resize-none"
              placeholder="Brief description for search engines"
            />
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              This appears below the title in search results. Recommended: 150-160 characters.
            </p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meta Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {seo?.metaKeywords?.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200"
                >
                  <Hash className="w-3 h-3" />
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="hover:text-red-600 ml-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Add keyword and press Enter"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium"
              >
                Add
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Keywords help search engines understand your product. Separate keywords with Enter key.
            </p>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Canonical URL
            </label>
            <input
              {...register('seo.canonicalUrl')}
              type="url"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
              placeholder="https://example.com/canonical-url"
            />
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Use this to specify the preferred URL when you have duplicate content. Helps prevent SEO issues.
            </p>
          </div>

          {/* Open Graph Image */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Open Graph Image
              </label>
              <button
                type="button"
                onClick={() => setUseOgImageLink(!useOgImageLink)}
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {useOgImageLink ? (
                  <>Use Upload <Upload className="w-3 h-3" /></>
                ) : (
                  <>Use Link <Link className="w-3 h-3" /></>
                )}
              </button>
            </div>

            {useOgImageLink ? (
              <div>
                <input
                  type="url"
                  placeholder="https://example.com/og-image.jpg"
                  onChange={handleOgImageLinkChange}
                  value={ogImagePreview}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Enter the full URL of your Open Graph image.
                </p>
              </div>
            ) : (
              <div>
                <ImageUpload
                  onUpload={handleOgImageUpload}
                  onRemove={handleOgImageRemove}
                  defaultValue={seo?.ogImage}
                  defaultPublicId={seo?.ogImagePublicId}
                  folder="products/og-images"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Upload an image for social media sharing. Recommended size: 1200x630px.
                </p>
              </div>
            )}

            {/* OG Image Preview */}
            {ogImagePreview && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Preview
                </label>
                <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <Image
                    src={ogImagePreview}
                    alt="OG Image Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  This image appears when sharing on Facebook, Twitter, LinkedIn, etc.
                </p>
              </div>
            )}
          </div>

          {/* No Index */}
          <div className="pt-3 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('seo.noIndex')}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700">
                No Index - Hide from search engines
              </span>
            </label>
            <p className="mt-1.5 ml-6 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Check this box to prevent search engines from indexing this product page. Use for duplicate content or private products.
            </p>
          </div>
        </div>
      </div>
      
      {/* Custom Badge Modal */}
      {showCustomBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBadge ? 'Edit Custom Badge' : 'Create Custom Badge'}
                  </h3>
                  <p className="text-sm text-gray-500">Design your own product badge</p>
                </div>
              </div>
              <button onClick={() => setShowCustomBadgeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Badge Label *
                </label>
                <input
                  type="text"
                  value={customBadgeForm.label}
                  onChange={(e) => setCustomBadgeForm({ ...customBadgeForm, label: e.target.value })}
                  placeholder="e.g., Limited Stock, Eco Friendly, Premium"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color Scheme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customColorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setCustomBadgeForm({ ...customBadgeForm, color: color.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${color.value} ${customBadgeForm.color === color.value ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                        }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setCustomBadgeForm({ ...customBadgeForm, icon: icon.name })}
                        className={`p-3 rounded-lg flex items-center justify-center transition-all ${customBadgeForm.icon === icon.name
                          ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Preview
                </label>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${customBadgeForm.color}`}>
                    {(() => {
                      const IconComponent = iconOptions.find(i => i.name === customBadgeForm.icon)?.component || Award;
                      return <IconComponent className="w-3.5 h-3.5" />;
                    })()}
                    {customBadgeForm.label || 'Badge Preview'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCustomBadgeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomBadge}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-medium"
                >
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ArchiveIcon component
const ArchiveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);