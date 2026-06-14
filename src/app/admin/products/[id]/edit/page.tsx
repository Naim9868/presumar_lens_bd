// src/app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  GitBranch,
  Image,
  Link2,
  Settings,
  Save,
  Eye,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Loader2
} from 'lucide-react';
import GeneralTab from '@/components/admin/product-editor/GeneralTab';
import VariantsTab from '@/components/admin/product-editor/VariantsTab';
import MediaTab from '@/components/admin/product-editor/MediaTab';
import RelatedProductsTab from '@/components/admin/product-editor/RelatedProductsTab';
import AdditionalTab from '@/components/admin/product-editor/AdditionalTab';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabId = 'general' | 'variants' | 'media' | 'related' | 'additional';

interface Tab {
  id: TabId;
  name: string;
  icon: any;
  description: string;
  color: string;
  bgColor: string;
  iconColor: string;
}

const tabs: Tab[] = [
  {
    id: 'general',
    name: 'General',
    icon: FileText,
    description: 'Basic information & organization',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'variants',
    name: 'Variants',
    icon: GitBranch,
    description: 'SKU, pricing & inventory',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    id: 'media',
    name: 'Media',
    icon: Image,
    description: 'Images, videos & galleries',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    id: 'related',
    name: 'Related Products',
    icon: Link2,
    description: 'Cross-sell & up-sell',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    id: 'additional',
    name: 'Additional',
    icon: Settings,
    description: 'Tags, badges & SEO',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
];

// Default badge options for identification

const defaultBadgeValues = ['new', 'sale', 'bestseller', 'limited', 'exclusive', 'preorder'];
// Add this near the other constants (around line 70)
const defaultBadgeOptions = [
  { id: 'new', value: 'new', label: 'New Arrival', color: 'bg-green-100 text-green-800', icon: 'Sparkles' },
  { id: 'sale', value: 'sale', label: 'Sale', color: 'bg-red-100 text-red-800', icon: 'Tag' },
  { id: 'bestseller', value: 'bestseller', label: 'Bestseller', color: 'bg-amber-100 text-amber-800', icon: 'TrendingUp' },
  { id: 'limited', value: 'limited', label: 'Limited Edition', color: 'bg-purple-100 text-purple-800', icon: 'Zap' },
  { id: 'exclusive', value: 'exclusive', label: 'Exclusive', color: 'bg-indigo-100 text-indigo-800', icon: 'Shield' },
  { id: 'preorder', value: 'preorder', label: 'Pre-order', color: 'bg-blue-100 text-blue-800', icon: 'Rocket' },
];



const convertToCustomBadges = (badges: Array<string | any>) => {
  const defaultBadges: any[] = [];
  const customBadges: any[] = [];

  for (const badge of badges || []) {
    // If it's already a custom badge object (has id not in default list)
    if (typeof badge === 'object' && badge !== null && badge.id && !defaultBadgeValues.includes(badge.id)) {
      customBadges.push(badge);
      continue;
    }

    // If it's a default badge object
    if (typeof badge === 'object' && badge !== null && badge.id && defaultBadgeValues.includes(badge.id)) {
      defaultBadges.push(badge.id); // Store just the ID as string
      continue;
    }

    // If it's a string
    if (typeof badge === 'string') {
      const badgeId = badge;
      // Check if it's a default badge
      if (defaultBadgeValues.includes(badgeId)) {
        defaultBadges.push(badgeId);
      } else {
        // Convert custom badge string to object
        customBadges.push({
          id: `custom-${Date.now()}-${Math.random()}`,
          label: badge.charAt(0).toUpperCase() + badge.slice(1),
          color: 'bg-purple-100 text-purple-800',
          icon: 'Sparkles',
        });
      }
    }
  }

  return {
    defaultBadges,
    customBadges,
  };
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [tabData, setTabData] = useState<Record<string, any>>({});

  // Load product data
  useEffect(() => {
    if (productId && productId !== 'create') {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Product not found');
          router.push('/admin/products');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.product) {
        const product = data.product;
        setProductData(product);

        // Check if product has variants (more than one variant)
        const hasVariantsFlag = product.variants && product.variants.length > 1;
        setHasVariants(hasVariantsFlag);

        // Get the default variant for pricing (if exists)
        const defaultVariant = product.variants?.find((v: any) => v.isDefault) || product.variants?.[0];

        // Convert badges to default and custom format
        const { defaultBadges, customBadges } = convertToCustomBadges(product.badges || []);

        // Initialize tab data with proper values
        setTabData({
          general: {
            name: product.name || '',
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            brandId: typeof product.brandId === 'object' ? product.brandId?._id : product.brandId || '',
            categoryId: typeof product.categoryId === 'object' ? product.categoryId?._id : product.categoryId || '',
            subcategoryId: typeof product.subcategoryId === 'object' ? product.subcategoryId?._id : product.subcategoryId || '',
            status: product.status || 'draft',
            hasVariants: hasVariantsFlag,
            // For non-variant products, use the default variant's pricing
            price: !hasVariantsFlag ? (defaultVariant?.price || product.lowestPrice || 0) : 0,
            compareAtPrice: !hasVariantsFlag ? (defaultVariant?.compareAtPrice || 0) : 0,
            inventory: !hasVariantsFlag ? (defaultVariant?.inventory || product.totalInventory || 0) : 0,
            specificationGroups: product.specificationGroups || [],
            seo: product.seo || {},
          },
          variants: {
            variants: product.variants || []
          },
          media: {
            thumbnail: product.thumbnail || '',
            thumbnailPublicId: product.thumbnailPublicId || '',
            imageGroups: product.imageGroups || [],
            videos: product.videos || [],
          },
          related: { relatedProducts: product.relatedProducts || [] },
          additional: {
            tags: product.tags || [],
            badges: defaultBadges, // Only default badges go here
            customBadges: customBadges, // Converted custom badges
            featured: product.featured || false,
            searchBoost: product.searchBoost || 1,
            status: product.status || 'draft',
            seo: product.seo || {},
          },
        });
      } else {
        toast.error(data.error || 'Failed to load product');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleTabDataChange = (tabId: TabId, data: any) => {
    setTabData(prev => ({ ...prev, [tabId]: data }));
  };

  const handleHasVariantsChange = useCallback((value: boolean) => {
    setHasVariants(value);
  }, []);

  const generateDefaultSKU = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  };

  const handleSave = async () => {
    setSaving(true);

    // Merge all tab data
    let mergedData: any = {
      ...tabData.general,
      ...tabData.media,
      ...tabData.related,
      ...tabData.additional,
    };

    // Clean up empty strings for subcategoryId
    if (mergedData.subcategoryId === '' || mergedData.subcategoryId === null) {
      delete mergedData.subcategoryId;
    }

    // Ensure specificationGroups is properly structured
    if (!mergedData.specificationGroups) {
      mergedData.specificationGroups = [];
    } else {
      // Clean up specifications - remove any localId or temp fields
      mergedData.specificationGroups = mergedData.specificationGroups.map((group: any) => ({
        groupName: group.groupName,
        displayOrder: group.displayOrder || 0,
        specifications: (group.specifications || []).map((spec: any) => {
          const { localId, ...cleanSpec } = spec;
          // Generate key from label if not present
          if (!cleanSpec.key && cleanSpec.label) {
            cleanSpec.key = cleanSpec.label
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, '');
          }
          return cleanSpec;
        })
      }));
    }

    // Handle variants based on hasVariants flag
    if (hasVariants) {
      // Use the variants from the variants tab
      mergedData.variants = tabData.variants?.variants || [];
      // Remove simple pricing fields
      delete mergedData.price;
      delete mergedData.compareAtPrice;
      delete mergedData.inventory;
    } else {
      // For non-variant products, update the existing variant or create one
      const existingVariants = tabData.variants?.variants || [];
      let updatedVariants = [...existingVariants];

      if (updatedVariants.length > 0) {
        // Update the first/default variant with pricing data
        updatedVariants[0] = {
          ...updatedVariants[0],
          price: mergedData.price || 0,
          compareAtPrice: mergedData.compareAtPrice || 0,
          inventory: mergedData.inventory || 0,
        };
      } else {
        // Create a default variant if none exists
        updatedVariants = [{
          sku: generateDefaultSKU(),
          variantKey: 'default',
          attributes: [],
          price: mergedData.price || 0,
          compareAtPrice: mergedData.compareAtPrice || 0,
          inventory: mergedData.inventory || 0,
          reserved: 0,
          images: [],
          isDefault: true,
          status: 'in_stock' as const,
        }];
      }
      mergedData.variants = updatedVariants;
    }

    // Ensure arrays exist
    mergedData.imageGroups = mergedData.imageGroups || [];
    mergedData.videos = mergedData.videos || [];
    mergedData.tags = mergedData.tags || [];
    mergedData.relatedProducts = mergedData.relatedProducts || [];

    // Handle badges - separate default and custom badges
    const allCurrentBadges = (mergedData.badges || []);

    // Separate default badges (objects with type 'default' or id in defaultBadgeValues)
    const defaultBadges = allCurrentBadges
      .filter((b: any) => {
        if (typeof b === 'object' && b !== null) {
          return b.type === 'default' || defaultBadgeValues.includes(b.id);
        }
        if (typeof b === 'string') {
          return defaultBadgeValues.includes(b);
        }
        return false;
      })
      .map((b: any) => {
        // Convert to object if it's a string
        if (typeof b === 'string') {
          const defaultBadge = defaultBadgeOptions.find(opt => opt.value === b);
          return {
            id: b,
            label: defaultBadge?.label || b,
            color: defaultBadge?.color || 'bg-gray-100 text-gray-800',
            icon: defaultBadge?.icon || 'Tag',
            type: 'default'
          };
        }
        return { ...b, type: 'default' };
      });

    // Separate custom badges (objects with type 'custom' or id not in defaultBadgeValues)
    const customBadges = allCurrentBadges
      .filter((b: any) => {
        if (typeof b === 'object' && b !== null) {
          return b.type === 'custom' || (!defaultBadgeValues.includes(b.id) && b.id?.startsWith('custom-'));
        }
        return false;
      })
      .map((b: any) => ({ ...b, type: 'custom' }));

    // Also include customBadges from mergedData.customBadges (if any)
    const additionalCustomBadges = (mergedData.customBadges || []).map((b: any) => ({
      ...b,
      type: 'custom'
    }));

    // Combine all badges
    const allBadges = [...defaultBadges, ...customBadges, ...additionalCustomBadges];

    // Remove duplicates by id
    const uniqueBadges = [];
    const seenIds = new Set();

    for (const badge of allBadges) {
      if (badge && badge.id && !seenIds.has(badge.id.toLowerCase())) {
        seenIds.add(badge.id.toLowerCase());
        uniqueBadges.push(badge);
      }
    }

    mergedData.badges = uniqueBadges;
    delete mergedData.customBadges;

    // Ensure thumbnail exists
    if (!mergedData.thumbnail) {
      mergedData.thumbnail = '';
    }

    // Ensure SEO object exists
    if (!mergedData.seo) {
      mergedData.seo = {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        canonicalUrl: '',
        ogImage: '',
        noIndex: false,
      };
    }

    // Add hasVariants flag to the data
    mergedData.hasVariants = hasVariants;

    console.log('Merged data to save:', mergedData);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product updated successfully');
        // Refresh the product data
        await fetchProduct();
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update product');
        console.error('Update error:', data.error);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (productData?.slug) {
      window.open(`/product/${productData.slug}`, '_blank');
    }
  };

  const currentTab = tabs.find(t => t.id === activeTab);
  const Icon = currentTab?.icon;
  const showVariantTab = hasVariants;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem-3rem)] flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl overflow-hidden">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="group p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Edit Product
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Editing {productData?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex row with fixed sidebar and scrollable content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Premium Sidebar Navigation */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-1 mb-6">
              <h3 className="text-xs font-semibold text-center text-gray-800 uppercase tracking-wider">
                Product Setup
              </h3>
            </div>

            <div className="space-y-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDisabled = tab.id === 'variants' && !showVariantTab;

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full group relative p-4 rounded-xl transition-all duration-200 text-left",
                      isActive
                        ? "bg-gradient-to-r from-amber-300 to-transparent border-l-4 border-amber-500 shadow-sm"
                        : "hover:bg-gray-50",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        isActive ? tab.bgColor : "bg-gray-100 group-hover:bg-gray-200",
                        isDisabled && "bg-gray-100"
                      )}>
                        <TabIcon className={cn(
                          "w-5 h-5",
                          isActive ? tab.iconColor : "text-gray-500",
                          isDisabled && "text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "font-medium",
                            isActive ? tab.color : "text-gray-700",
                            isDisabled && "text-gray-400"
                          )}>
                            {tab.name}
                          </span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mt-1",
                          isActive ? "text-gray-600" : "text-gray-400",
                          isDisabled && "text-gray-400"
                        )}>
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress indicator for completed tabs */}
                    {tab.id !== activeTab && !isDisabled && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Premium Tips Card */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Optimization Tip</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Complete product information improves search ranking by up to 40%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-8">
            {/* Tab Header Indicator */}
            <div className="mb-6 flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", currentTab?.bgColor)}>
                {Icon && <Icon className={cn("w-6 h-6", currentTab?.iconColor)} />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentTab?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentTab?.description}
                </p>
              </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {activeTab === 'general' && (
                <GeneralTab
                  onHasVariantsChange={handleHasVariantsChange}
                  initialData={tabData.general}
                  onDataChange={(data) => handleTabDataChange('general', data)}
                />
              )}

              {activeTab === 'variants' && showVariantTab && (
                <VariantsTab
                  initialData={tabData.variants}
                  onDataChange={(data) => handleTabDataChange('variants', data)}
                />
              )}

              {activeTab === 'media' && (
                <MediaTab
                  initialData={tabData.media}
                  onDataChange={(data) => handleTabDataChange('media', data)}
                />
              )}

              {activeTab === 'related' && (
                <RelatedProductsTab
                  initialData={tabData.related}
                  onDataChange={(data) => handleTabDataChange('related', data)}
                  currentProductId={productId}
                />
              )}

              {activeTab === 'additional' && (
                <AdditionalTab
                  initialData={tabData.additional}
                  onDataChange={(data) => handleTabDataChange('additional', data)}
                />
              )}

              {/* Empty state for variants when not enabled */}
              {activeTab === 'variants' && !showVariantTab && (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center">
                    <GitBranch className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Variants Not Enabled
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    This product doesn't have variants enabled. Go to the General tab and check "This product has variants" to enable variant management.
                  </p>
                  <button
                    onClick={() => setActiveTab('general')}
                    className="mt-4 px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Go to General Tab
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Save Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 z-40 shadow-lg">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}