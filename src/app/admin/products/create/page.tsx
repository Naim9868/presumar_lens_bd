// src/app/admin/products/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  GitBranch,
  Image,
  Link2,
  Settings,
  Save,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  CheckCircle
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

export default function CreateProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [hasVariants, setHasVariants] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabData, setTabData] = useState<Record<string, any>>({
    general: {
      name: '',
      description: '',
      shortDescription: '',
      brandId: '',
      categoryId: '',
      subcategoryId: '',
      status: 'draft',
      hasVariants: false,
      price: 0,
      compareAtPrice: 0,
      inventory: 0,
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        canonicalUrl: '',
        ogImage: '',
        noIndex: false,
      },
    },
    variants: {
      variants: [
        // {
        //   sku: '',
        //   attributes: [],
        //   price: 0,
        //   compareAtPrice: 0,
        //   inventory: 0,
        //   reserved: 0,
        //   images: [],
        //   isDefault: true,
        //   status: 'in_stock',
        // },
      ],
    },
    media: {
      thumbnail: '',
      imageGroups: [],
      videos: [],
    },
    related: {
      relatedProducts: [],
    },
    additional: {
      tags: [],
      badges: [],
      featured: false,
      searchBoost: 1,
      status: 'draft',
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        canonicalUrl: '',
        ogImage: '',
        noIndex: false,
      },
    },
  });

  const handleTabDataChange = (tabId: TabId, data: any) => {
    setTabData(prev => ({ ...prev, [tabId]: data }));
  };


  const handleSave = async () => {
    setSaving(true);

    // Merge all tab data
    const mergedData = {
      ...tabData.general,
      ...tabData.variants,
      ...tabData.media,
      ...tabData.related,
      ...tabData.additional,
    };

    // Clean up empty strings
    if (mergedData.subcategoryId === '' || mergedData.subcategoryId === null) {
      delete mergedData.subcategoryId;
    }

    // Clean up specification groups - remove empty groups and empty specifications
    if (mergedData.specificationGroups) {
      mergedData.specificationGroups = mergedData.specificationGroups
        .filter((group: any) => group.groupName && group.groupName.trim() !== '')
        .map((group: any) => ({
          groupName: group.groupName.trim(),
          displayOrder: group.displayOrder || 0,
          specifications: (group.specifications || [])
            .filter((spec: any) => spec.label && spec.label.trim() !== '')
            .map((spec: any) => ({
              label: spec.label.trim(),
              value: spec.value || '',
              unit: spec.unit || '',
              type: spec.type || 'text',
              filterable: spec.filterable || false,
            }))
        }));
    } else {
      mergedData.specificationGroups = [];
    }

    // If product has variants, remove simple pricing fields
    if (hasVariants) {
      delete mergedData.price;
      delete mergedData.compareAtPrice;
      delete mergedData.inventory;
    }

    // Ensure arrays exist
    mergedData.imageGroups = mergedData.imageGroups || [];
    mergedData.videos = mergedData.videos || [];
    mergedData.tags = mergedData.tags || [];
    mergedData.relatedProducts = mergedData.relatedProducts || [];

    // Handle badges - combine default and custom badges without duplicates
    const defaultBadges = (mergedData.badges || []).filter((b: any) => b?.type === 'default');
    const customBadges = (mergedData.customBadges || []);

    // Combine default badges and custom badges as objects
    const allBadges = [...defaultBadges, ...customBadges];

    // Remove duplicates by id
    const uniqueBadges = [];
    const seenIds = new Set();

    for (const badge of allBadges) {
      if (badge && typeof badge === 'object' && badge.id && !seenIds.has(badge.id)) {
        seenIds.add(badge.id);
        uniqueBadges.push(badge);
      }
    }

    mergedData.badges = uniqueBadges;

    // Remove customBadges (not needed in DB)
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

    // Add hasVariants flag
    mergedData.hasVariants = hasVariants;

    // Log cleaned data for debugging
    console.log('Cleaned product data to be sent to API:', mergedData);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedData),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        toast.success('Product created successfully');
        router.push('/admin/products');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to create product');
        console.error('Server error:', data.error);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const currentTab = tabs.find(t => t.id === activeTab);
  const Icon = currentTab?.icon;

  // Determine if variant tab should be visible
  const showVariantTab = hasVariants;

  return (
    <div className="h-[calc(100vh-4rem-3rem)] flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl overflow-hidden">
      {/* Premium Header - Fixed */}
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
                      Create Product
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Add a new product to your catalog
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-600">Auto-save enabled</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex row with fixed sidebar and scrollable content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Premium Sidebar Navigation - Fixed */}
        <div className="w-[26%] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-1  mb-6">
              <h3 className="text-xs font-semibold text-center text-gray-800 uppercase tracking-wider">
                Product Setup
              </h3>
              {/* <p className="text-sm text-gray-500">
                Complete all sections to create your product
              </p> */}
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
                  <h4 className="text-sm font-semibold text-blue-900">Pro Tip</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Complete all sections for better product visibility and SEO ranking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Tab Content - Only this scrolls */}
        <div className="h-full w-full p-6 space-y-6 overflow-auto">
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
                  onHasVariantsChange={setHasVariants}
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
                  currentProductId={undefined}
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
                    You haven&apos;t enabled variants for this product. Go to the General tab and check "This product has variants" to enable variant management.
                  </p>
                  <button
                    onClick={() => setActiveTab('general')}
                    className="mt-4 px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Enable Variants
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
          {saving ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}