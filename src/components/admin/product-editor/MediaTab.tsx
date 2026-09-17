// src/components/admin/product-editor/MediaTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { 
  Plus, Trash2, X, Video, Image as ImageIcon, 
  Upload, Link, FolderOpen, Settings as SettingsIcon, Play, Info,
  Layout, Grid, Eye, Star, Layers, GripVertical,
  ExternalLink, CheckCircle, AlertCircle, RefreshCw,
  Ruler, Maximize2, Sparkles, BarChart3, Wrench, BookOpen, Images, Copy,
  Package, Box, Users, Settings, GitCompare,
} from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6";
import { ImageGroupType, VideoPlatform } from '@/types/product';
import Image from 'next/image';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

interface MediaFormData {
  thumbnail: string;
  thumbnailPublicId?: string;
  imageGroups: Array<{
    type: ImageGroupType;
    title: string;
    description?: string;
    images: Array<{
      url: string;
      publicId?: string;
      alt?: string;
      sortOrder?: number;
    }>;
  }>;
  videos: Array<{
    url: string;
    title?: string;
    thumbnail?: string;
    platform?: VideoPlatform;
  }>;
}

interface MediaTabProps {
  initialData?: Partial<MediaFormData>;
  onDataChange?: (data: any) => void;
}

const imageGroupTypes: { value: ImageGroupType; label: string; icon: any; color: string; bg: string }[] = [
  { value: 'primary', label: 'Primary', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'product', label: 'Product Images', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'detail', label: 'Detail Shots', icon: Eye, color: 'text-teal-600', bg: 'bg-teal-50' },
  { value: 'diagram', label: 'Diagrams', icon: Grid, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { value: 'package', label: 'Package Contents', icon: Box, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'contents', label: 'What\'s Included', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'lifestyle', label: 'Lifestyle', icon: Users, color: 'text-pink-600', bg: 'bg-pink-50' },
  { value: 'usage', label: 'Usage', icon: Settings, color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'scale', label: 'Scale Reference', icon: Ruler, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'dimensions', label: 'Dimensions', icon: Maximize2, color: 'text-violet-600', bg: 'bg-violet-50' },
  { value: 'features', label: 'Features', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'infographic', label: 'Infographic', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'comparison', label: 'Comparison', icon: GitCompare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: 'result', label: 'Results', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'installation', label: 'Installation', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'instruction', label: 'Instructions', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'cover', label: 'Cover Image', icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'gallery', label: 'Gallery', icon: Images, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: 'variant', label: 'Variant Images', icon: Copy, color: 'text-gray-600', bg: 'bg-gray-50' },
  { value: 'custom', label: 'Custom', icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-50' },
  { value: 'other', label: 'Other', icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-50' },
];

const videoPlatforms: { value: VideoPlatform; label: string; icon: any; color: string }[] = [
  { value: 'youtube', label: 'YouTube', icon: Play, color: 'text-red-600' },
  { value: 'facebook', label: 'Facebook', icon: FaFacebookF, color: 'text-blue-600' },
  { value: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'text-pink-600' },
  { value: 'tiktok', label: 'TikTok', icon: Video, color: 'text-gray-900' },
  { value: 'twitter', label: 'X (Twitter)', icon: FaXTwitter, color: 'text-sky-500' },
  { value: 'vimeo', label: 'Vimeo', icon: Video, color: 'text-blue-500' },
  { value: 'dailymotion', label: 'Dailymotion', icon: Video, color: 'text-blue-400' },
  { value: 'wistia', label: 'Wistia', icon: Video, color: 'text-amber-600' },
  { value: 'loom', label: 'Loom', icon: Video, color: 'text-purple-600' },
  { value: 'other', label: 'Other', icon: Video, color: 'text-gray-600' },
];

export default function MediaTab({ initialData, onDataChange }: MediaTabProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [thumbnailUseLink, setThumbnailUseLink] = useState(false);
  const [groupImageUseLink, setGroupImageUseLink] = useState<Record<string, boolean>>({});
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail || '');
  const [groupImagePreviews, setGroupImagePreviews] = useState<Record<string, string>>({});
  const [draggedImage, setDraggedImage] = useState<{ groupIndex: number; imageIndex: number } | null>(null);

  const { register, control, setValue, watch, getValues } = useForm<MediaFormData>({
    defaultValues: initialData || {
      thumbnail: '',
      thumbnailPublicId: '',
      imageGroups: [],
      videos: [],
    },
  });

  const { fields: imageGroupFields, append: appendImageGroup, remove: removeImageGroup } = 
    useFieldArray({ control, name: 'imageGroups' });
  
  const { fields: videoFields, append: appendVideo, remove: removeVideo } = 
    useFieldArray({ control, name: 'videos' });

  const thumbnail = watch('thumbnail');
  const thumbnailPublicId = watch('thumbnailPublicId');
  const imageGroups = watch('imageGroups');
  const videos = watch('videos');

  // Update thumbnail preview when thumbnail changes
  useEffect(() => {
    setThumbnailPreview(thumbnail);
  }, [thumbnail]);

  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange?.(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  const handleAddImageGroup = () => {
    appendImageGroup({
      type: 'product',
      title: 'New Image Group',
      description: '',
      images: [],
    });
    setExpandedGroups(new Set([imageGroupFields.length]));
  };

  const toggleGroupExpand = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const handleThumbnailUpload = (url: string, publicId?: string) => {
    setValue('thumbnail', url);
    setThumbnailPreview(url);
    if (publicId) {
      setValue('thumbnailPublicId', publicId);
    }
  };

  const handleThumbnailLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setValue('thumbnail', url);
    setThumbnailPreview(url);
  };

  const handleThumbnailRemove = () => {
    setValue('thumbnail', '');
    setValue('thumbnailPublicId', '');
    setThumbnailPreview('');
  };

  const handleGroupImageUpload = (groupIndex: number, imageIndex: number, url: string, publicId?: string) => {
    const currentImages = getValues(`imageGroups.${groupIndex}.images`) || [];
    const updatedImages = [...currentImages];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      url,
      publicId: publicId || '',
      sortOrder: imageIndex,
    };
    setValue(`imageGroups.${groupIndex}.images`, updatedImages);
    
    // Update preview
    const previewKey = `${groupIndex}-${imageIndex}`;
    setGroupImagePreviews(prev => ({ ...prev, [previewKey]: url }));
  };

  const handleGroupImageLinkChange = (groupIndex: number, imageIndex: number, url: string) => {
    const currentImages = getValues(`imageGroups.${groupIndex}.images`) || [];
    const updatedImages = [...currentImages];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      url,
    };
    setValue(`imageGroups.${groupIndex}.images`, updatedImages);
    
    // Update preview
    const previewKey = `${groupIndex}-${imageIndex}`;
    setGroupImagePreviews(prev => ({ ...prev, [previewKey]: url }));
  };

  const handleGroupImageRemove = async (groupIndex: number, imageIndex: number, publicId?: string) => {
    // If there's a publicId, delete from Cloudinary
    if (publicId) {
      try {
        await fetch(`/api/upload?publicId=${publicId}`, { method: 'DELETE' });
        toast.success('Image deleted from Cloudinary');
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    
    const currentImages = getValues(`imageGroups.${groupIndex}.images`);
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    // Update sortOrder after removal
    const reorderedImages = newImages.map((img, idx) => ({ ...img, sortOrder: idx }));
    setValue(`imageGroups.${groupIndex}.images`, reorderedImages);
    
    // Remove preview
    const previewKey = `${groupIndex}-${imageIndex}`;
    setGroupImagePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[previewKey];
      return newPreviews;
    });
  };

  const handleAddImageToGroup = (groupIndex: number) => {
    const currentImages = getValues(`imageGroups.${groupIndex}.images`) || [];
    const newSortOrder = currentImages.length;
    setValue(`imageGroups.${groupIndex}.images`, [
      ...currentImages,
      { url: '', publicId: '', alt: '', sortOrder: newSortOrder },
    ]);
  };

  const handleRemoveImageFromGroup = (groupIndex: number, imageIndex: number) => {
    const image = getValues(`imageGroups.${groupIndex}.images.${imageIndex}`);
    handleGroupImageRemove(groupIndex, imageIndex, image?.publicId);
  };

  // Drag and drop handlers
  const handleDragStart = (groupIndex: number, imageIndex: number) => {
    setDraggedImage({ groupIndex, imageIndex });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (groupIndex: number, targetIndex: number) => {
    if (!draggedImage || draggedImage.groupIndex !== groupIndex) return;
    
    const sourceIndex = draggedImage.imageIndex;
    if (sourceIndex === targetIndex) return;
    
    const currentImages = getValues(`imageGroups.${groupIndex}.images`);
    const reorderedImages = [...currentImages];
    const [removed] = reorderedImages.splice(sourceIndex, 1);
    reorderedImages.splice(targetIndex, 0, removed);
    
    // Update sortOrder
    const updatedImages = reorderedImages.map((img, idx) => ({ ...img, sortOrder: idx }));
    setValue(`imageGroups.${groupIndex}.images`, updatedImages);
    
    // Update preview keys
    const newPreviews: Record<string, string> = {};
    updatedImages.forEach((img, idx) => {
      const key = `${groupIndex}-${idx}`;
      if (img.url) {
        newPreviews[key] = img.url;
      }
    });
    setGroupImagePreviews(prev => ({ ...prev, ...newPreviews }));
    
    setDraggedImage(null);
    toast.success('Image reordered successfully');
  };

  const handleAddVideo = (videoData: { url: string; title: string; platform: VideoPlatform }) => {
    const thumbnail = extractVideoThumbnail(videoData.url, videoData.platform);
    appendVideo({
      ...videoData,
      thumbnail,
    });
    setShowVideoModal(false);
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const extractFacebookId = (url: string): string | null => {
    const patterns = [
      /facebook\.com\/.*\/videos\/(\d+)/,
      /facebook\.com\/reel\/(\d+)/,
      /facebook\.com\/watch\/?\?v=(\d+)/,
      /fb\.watch\/(\w+)/,
      /facebook\.com\/share\/v\/(\d+)/,
    ];
    for (const pat of patterns) {
      const m = url.match(pat);
      if (m) return m[1];
    }
    return null;
  };

  const extractVideoThumbnail = (url: string, platform: VideoPlatform): string => {
    if (!url) return '';

    switch (platform) {
      case 'youtube': {
        const id = extractYouTubeId(url);
        return id ? `https://img.youtube.com/vi/${id}/0.jpg` : '';
      }
      case 'vimeo': {
        const match = url.match(/vimeo\.com\/(\d+)/);
        if (match) {
          return `https://vumbnail.com/${match[1]}.jpg`;
        }
        return '';
      }
      case 'facebook': {
        const id = extractFacebookId(url);
        if (id) {
          return `https://graph.facebook.com/${id}/picture?type=large`;
        }
        return '';
      }
      case 'instagram': {
        const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (match) {
          return `https://www.instagram.com/p/${match[1]}/media/?size=l`;
        }
        return '';
      }
      case 'tiktok': {
        return '';
      }
      case 'twitter': {
        return '';
      }
      default:
        return '';
    }
  };

  const getEmbedUrl = (url: string, platform: VideoPlatform): string | null => {
    if (!url) return null;

    switch (platform) {
      case 'youtube': {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
      }
      case 'vimeo': {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? `https://player.vimeo.com/video/${match[1]}` : null;
      }
      case 'facebook': {
        const id = extractFacebookId(url);
        if (id) return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/video/${id}&show_text=false`;
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
      }
      case 'instagram': {
        const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return match ? `https://www.instagram.com/p/${match[1]}/embed/` : null;
      }
      case 'tiktok': {
        const match = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
        return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : null;
      }
      case 'twitter': {
        const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
        return match ? `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}` : null;
      }
      case 'dailymotion': {
        const match = url.match(/dailymotion\.com\/video\/(\w+)/);
        return match ? `https://www.dailymotion.com/embed/video/${match[1]}` : null;
      }
      case 'wistia': {
        const match = url.match(/wistia\.com\/medias\/(\w+)/);
        return match ? `https://fast.wistia.net/embed/iframe/${match[1]}` : null;
      }
      case 'loom': {
        const match = url.match(/loom\.com\/(?:share|watch)\/(\w+)/);
        return match ? `https://www.loom.com/embed/${match[1]}` : null;
      }
      default:
        return url;
    }
  };

  const getPlatformName = (platform: VideoPlatform): string => {
    const names: Record<VideoPlatform, string> = {
      youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram',
      tiktok: 'TikTok', twitter: 'X (Twitter)', vimeo: 'Vimeo',
      dailymotion: 'Dailymotion', wistia: 'Wistia', loom: 'Loom', other: 'Link',
    };
    return names[platform] || 'Link';
  };

  const getPlatformIcon = (platform: VideoPlatform) => {
    const config = videoPlatforms.find(p => p.value === platform);
    const Icon = config?.icon || Video;
    const color = config?.color || 'text-gray-600';
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  const toggleGroupImageUseLink = (groupIndex: number, imageIndex: number) => {
    const key = `${groupIndex}-${imageIndex}`;
    setGroupImageUseLink(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isGroupImageUsingLink = (groupIndex: number, imageIndex: number) => {
    const key = `${groupIndex}-${imageIndex}`;
    return groupImageUseLink[key] || false;
  };

  const getGroupImagePreview = (groupIndex: number, imageIndex: number, url: string) => {
    const key = `${groupIndex}-${imageIndex}`;
    return groupImagePreviews[key] || url;
  };

  return (
    <div className="space-y-6">
      {/* Thumbnail Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-rose-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Star className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thumbnail</h3>
                <p className="text-sm text-gray-500">Main product image</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setThumbnailUseLink(!thumbnailUseLink)}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              {thumbnailUseLink ? (
                <>Use Upload <Upload className="w-3 h-3" /></>
              ) : (
                <>Use Link <Link className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail Preview */}
            <div className="w-40 h-40 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 group">
              {thumbnailPreview && thumbnailPreview !== '' ? (
                <>
                  <Image src={thumbnailPreview} alt="Thumbnail" fill className="object-cover" sizes="160px" unoptimized />
                  <button
                    onClick={handleThumbnailRemove}
                    className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Remove</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              {thumbnailUseLink ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={thumbnail}
                    onChange={handleThumbnailLinkChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                  {thumbnail && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{thumbnail}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Thumbnail
                  </label>
                  <ImageUpload
                    onUpload={handleThumbnailUpload}
                    onRemove={handleThumbnailRemove}
                    defaultValue={thumbnail}
                    defaultPublicId={thumbnailPublicId}
                    folder="products/thumbnails"
                  />
                </div>
              )}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Recommended size: 800x800px. This image will appear in product listings and cards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Groups Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Layout className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Image Groups</h3>
                <p className="text-sm text-gray-500">Organize product images by category</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddImageGroup}
              className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Group
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {imageGroupFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No image groups yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Group" to organize your product images.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {imageGroupFields.map((group, groupIndex) => {
                const groupType = imageGroups?.[groupIndex]?.type;
                const typeConfig = imageGroupTypes.find(t => t.value === groupType) || imageGroupTypes[0];
                const TypeIcon = typeConfig.icon;
                const isExpanded = expandedGroups.has(groupIndex);
                
                return (
                  <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(groupIndex)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 ${typeConfig.bg} rounded-lg`}>
                              <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                            </div>
                            <input
                              {...register(`imageGroups.${groupIndex}.title`)}
                              type="text"
                              placeholder="Group Title"
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
                            />
                          </div>
                          <select
                            {...register(`imageGroups.${groupIndex}.type`)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            {imageGroupTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImageGroup(groupIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                          </label>
                          <textarea
                            {...register(`imageGroups.${groupIndex}.description`)}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all resize-none"
                            placeholder="Describe this image group"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">
                              Images ({imageGroups?.[groupIndex]?.images?.length || 0})
                            </span>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <GripVertical className="w-3 h-3" />
                              Drag and drop to reorder
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddImageToGroup(groupIndex)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Image
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {imageGroups?.[groupIndex]?.images?.map((image, imageIndex) => {
                            const isUsingLink = isGroupImageUsingLink(groupIndex, imageIndex);
                            const previewUrl = getGroupImagePreview(groupIndex, imageIndex, image.url);
                            
                            return (
                              <div
                                key={imageIndex}
                                draggable
                                onDragStart={() => handleDragStart(groupIndex, imageIndex)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(groupIndex, imageIndex)}
                                className="relative group cursor-move"
                              >
                                {/* Drag Handle - Top Left */}
                                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="p-1.5 bg-gray-700 text-white rounded-lg cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-3 h-3" />
                                  </div>
                                </div>
                                
                                {/* Order Number Badge - Top Right */}
                                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                                  #{imageIndex + 1}
                                </div>
                                
                                {/* Image Preview */}
                                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 transition-all group-hover:border-indigo-400">
                                  {previewUrl ? (
                                    <Image
                                      src={previewUrl}
                                      alt={image.alt || `Image ${imageIndex + 1}`}
                                      width={150}
                                      height={150}
                                      className="w-full h-full object-cover pointer-events-none"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}

                                  
                                </div>
                                
                                {/* Action Buttons - Middle Bottom */}
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                  <button
                                    onClick={() => toggleGroupImageUseLink(groupIndex, imageIndex)}
                                    className="p-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                                    title={isUsingLink ? "Switch to Upload" : "Switch to Link"}
                                  >
                                    {isUsingLink ? <Upload className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveImageFromGroup(groupIndex, imageIndex)}
                                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                                    title="Remove Image"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                {/* Input Section */}
                                <div className="mt-2">
                                  {isUsingLink ? (
                                    <input
                                      type="text"
                                      placeholder="Image URL"
                                      value={image.url || ''}
                                      onChange={(e) => handleGroupImageLinkChange(groupIndex, imageIndex, e.target.value)}
                                      className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                  ) : (
                                    <ImageUpload
                                      onUpload={(url, publicId) => handleGroupImageUpload(groupIndex, imageIndex, url, publicId)}
                                      defaultValue={image.url}
                                      defaultPublicId={image.publicId}
                                      folder="products/gallery"
                                    />
                                  )}
                                </div>
                                
                                {/* Alt Text */}
                                <input
                                  {...register(`imageGroups.${groupIndex}.images.${imageIndex}.alt`)}
                                  type="text"
                                  placeholder="Alt text"
                                  className="mt-2 w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Drag and Drop Instructions */}
                        {imageGroups?.[groupIndex]?.images?.length > 1 && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                            <p className="text-xs text-indigo-700 flex items-center justify-center gap-2">
                              <GripVertical className="w-3 h-3" />
                              Drag and drop images to change their order
                              <GripVertical className="w-3 h-3" />
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Videos Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <Video className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Videos</h3>
                <p className="text-sm text-gray-500">Product demonstrations and reviews</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Video
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {videos?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No videos added yet.</p>
              <p className="text-sm text-gray-400 mt-1">Add product videos from YouTube, Vimeo, Facebook, Instagram, TikTok, and more.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos?.map((video, index) => (
                <VideoPreviewCard
                  key={index}
                  video={video}
                  index={index}
                  register={register}
                  removeVideo={removeVideo}
                  getPlatformIcon={getPlatformIcon}
                  getEmbedUrl={getEmbedUrl}
                  getPlatformName={getPlatformName}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Video Modal */}
      {showVideoModal && (
        <AddVideoModal onClose={() => setShowVideoModal(false)} onAdd={handleAddVideo} />
      )}
    </div>
  );
}

// Video Preview Card — handles embed fallback gracefully
function VideoPreviewCard({
  video,
  index,
  register,
  removeVideo,
  getPlatformIcon,
  getEmbedUrl,
  getPlatformName,
}: {
  video: { url: string; title?: string; thumbnail?: string; platform?: VideoPlatform };
  index: number;
  register: any;
  removeVideo: (i: number) => void;
  getPlatformIcon: (p: VideoPlatform) => React.ReactNode;
  getEmbedUrl: (url: string, p: VideoPlatform) => string | null;
  getPlatformName: (p: VideoPlatform) => string;
}) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const platform = video.platform || 'youtube';
  const embedUrl = getEmbedUrl(video.url, platform);
  const isDirectVideo = video.url?.endsWith('.mp4') || video.url?.endsWith('.webm') || video.url?.endsWith('.ogg');
  const showIframe = !embedFailed && !isDirectVideo && embedUrl;
  const hasThumbnail = video.thumbnail && video.thumbnail !== '';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative group overflow-hidden">
        {isDirectVideo ? (
          <video
            src={video.url}
            controls
            poster={video.thumbnail}
            className="w-full h-full object-cover"
          />
        ) : showIframe ? (
          <>
            <iframe
              src={embedUrl!}
              title={video.title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
              onError={() => setEmbedFailed(true)}
              onLoad={(e) => {
                // Detect if iframe was blocked (blank body)
                try {
                  const doc = (e.target as HTMLIFrameElement).contentDocument;
                  if (doc && doc.body && doc.body.innerHTML === '') {
                    setEmbedFailed(true);
                  }
                } catch {
                  // Cross-origin — can't check, assume it's fine
                }
              }}
            />
          </>
        ) : (
          /* Fallback: clickable preview card with thumbnail + platform branding */
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full flex flex-col items-center justify-center gap-3 group/link"
          >
            {hasThumbnail ? (
              <div className="w-full h-full relative">
                <Image
                  src={video.thumbnail!}
                  alt={video.title || 'Video thumbnail'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/link:opacity-100 transition-opacity">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                  <span className="text-white text-xs font-medium bg-black/60 px-3 py-1 rounded-full">
                    Watch on {getPlatformName(platform)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  {getPlatformIcon(platform)}
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">
                    {video.title || getPlatformName(platform)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Click to open on {getPlatformName(platform)}
                  </p>
                </div>
              </div>
            )}
          </a>
        )}

        {/* Hover overlay — only for iframe/direct video */}
        {(showIframe || isDirectVideo) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-gray-800" />
            </div>
          </div>
        )}

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-4 space-y-2">
        <input
          {...register(`videos.${index}.title`)}
          type="text"
          placeholder="Video title"
          className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          {getPlatformIcon(platform)}
          <input
            {...register(`videos.${index}.url`)}
            type="text"
            placeholder="Video URL"
            className="flex-1 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => removeVideo(index)}
          className="w-full mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Remove Video
        </button>
      </div>
    </div>
  );
}

// Add Video Modal Component
function AddVideoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<VideoPlatform>('youtube');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && title) {
      onAdd({ url, title, platform });
      setUrl('');
      setTitle('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Video className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Add Video</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as VideoPlatform)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            >
              {videoPlatforms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product demonstration"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
            >
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}