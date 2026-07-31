import { Types, Document } from 'mongoose';



export interface ProductCardData {
  id: number | string;
  name: string;
  slug: string;
  brand: string;
  imageUrl: string;
  originalPrice: number;
  discountPrice: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock?: number;
  isAvailable: boolean;
  badges: {
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isLimitedStock?: boolean;
    isPremium?: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}



//order type

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Pricing {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

export interface TimelineEvent {
  status: string;
  note?: string;
  createdAt: Date;
}

export interface Payment {
  method: 'COD' | 'ONLINE';
  status: 'PAID' | 'UNPAID' | 'FAILED';
  transactionId?: string;
}

export interface Shipping {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
}

export interface Delivery {
  type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  courier?: string;
  trackingId?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  userId?: string;
  items: OrderItem[];
  pricing: Pricing;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customStatus?: string;
  timeline: TimelineEvent[];
  payment: Payment;
  shipping: Shipping;
  delivery: Delivery;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
    averageOrderValue: number;
  };
  statusCounts: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// export interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }



export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  logoPublicId?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
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

export interface VariantAttribute {
  key: string;
  value: string;
}


export interface ProductVariant {
  sku: string;
  variantKey?: string;
  attributes: VariantAttribute[];
  price: number;
  compareAtPrice?: number;
  inventory: number;
  reserved?: number;
  // weight?: number;
  images?: string[];
  isDefault?: boolean;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

 

export interface CartItem {
  id: string; // Unique cart item ID (productId-variantKey)
  productId: string;
  name: string;
  slug: string;
  image?: string;
  sku?: string;
  brand?: string;
  category?: string;
  price: {
    original: number;
    sale: number;
  };
  variantKey?: string;
  variantName?: string;
  attributes?: Record<string, string>;
  quantity: number;
  maxQuantity?: number;
  // Optional: For backward compatibility
  variantId?: string;
  selectedVariant?: any;
}

export interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  sku?: string;
  variantKey?: string;
  attributes?: VariantAttribute[];
  selectedVariant?: ProductVariant;
}

export interface FilterOptions {
 minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  search?: string;
  inStock?: boolean;

  specs?: {
    key: string;
    values: string[];
  }[];

  sortBy?:
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'rating_desc';
}


export interface CheckoutItem {
  productId: string;     // match Order schema
  variantId?: string;    // SKU বা variantKey
  name: string;
  sku?: string;

  price: number;
  quantity: number;

  image?: string;

  // UI extras (optional)
  selectedAttributes?: Record<string, string>;
}






// home page data type

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  seo: SEO;
  blocks: Block[];
  version: number;
  versions: PageVersion[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface SEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robots: string;
  schemaJsonLd?: Record<string, any>;
}

export interface Block {
  id: string;
  type: BlockType;
  enabled: boolean;
  order: number;
  settings: BlockSettings;
  templateId?: string;
}

export type BlockType = 
  | 'hero'
  | 'image_slider'
  | 'categories'
  | 'featured_products'
  | 'latest_products'
  | 'best_sellers'
  | 'flash_sale'
  | 'collection_banner'
  | 'brand_slider'
  | 'gallery'
  | 'video'
  | 'before_after'
  | 'instagram_feed'
  | 'testimonials'
  | 'rich_text'
  | 'newsletter'
  | 'faq'
  | 'spacer'
  | 'divider'
  | 'custom_html'
  | 'custom_component';

export type BlockSettings = 
  | HeroSettings
  | ImageSliderSettings
  | CategoriesSettings
  | FeaturedProductsSettings
  | LatestProductsSettings
  | BestSellersSettings
  | FlashSaleSettings
  | CollectionBannerSettings
  | BrandSliderSettings
  | GallerySettings
  | VideoSettings
  | BeforeAfterSettings
  | InstagramFeedSettings
  | TestimonialsSettings
  | RichTextSettings
  | NewsletterSettings
  | FAQSettings
  | SpacerSettings
  | DividerSettings
  | CustomHTMLSettings
  | CustomComponentSettings;

export interface BaseBlockSettings {
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  backgroundColor?: string;
  textColor?: string;
  animation?: string;
  customClass?: string;
  customId?: string;
}

export interface HeroSettings extends BaseBlockSettings {
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonLink: string;
  overlay: number;
  alignment: 'left' | 'center' | 'right';
  height: 'small' | 'medium' | 'large' | 'full';
  backgroundPosition: string;
  backgroundSize: 'cover' | 'contain' | 'auto';
}

export interface ImageSliderSettings extends BaseBlockSettings {
  slides: {
    id: string;
    image: string;
    title?: string;
    subtitle?: string;
    link?: string;
  }[];
  autoplay: boolean;
  autoplaySpeed: number;
  showDots: boolean;
  showArrows: boolean;
  fade: boolean;
}

export interface CategoriesSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  categories: {
    id: string;
    name: string;
    image: string;
    link: string;
  }[];
  layout: 'grid' | 'carousel' | 'list';
  columns: number;
}

export interface FeaturedProductsSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  source: 'manual' | 'newest' | 'best_seller' | 'featured' | 'category' | 'brand' | 'flash_sale' | 'discount' | 'random';
  productIds?: string[];
  category?: string;
  brand?: string;
  limit: number;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
  showRating: boolean;
  showPrice: boolean;
  showQuickAdd: boolean;
  layout: 'grid' | 'list' | 'carousel';
  columns: number;
}

export interface GallerySettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  images: {
    id: string;
    url: string;
    alt: string;
    title?: string;
    link?: string;
  }[];
  layout: 'grid' | 'masonry' | 'carousel';
  columns: number;
  showLightbox: boolean;
}

export interface FAQSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  faqs: {
    id: string;
    question: string;
    answer: string;
  }[];
  layout: 'accordion' | 'list';
  expandAll: boolean;
}

export interface NewsletterSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  inputPlaceholder: string;
  buttonText: string;
  successMessage: string;
  errorMessage: string;
  provider: 'mailchimp' | 'sendgrid' | 'custom';
  providerSettings?: Record<string, any>;
}

export interface TestimonialsSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  testimonials: {
    id: string;
    name: string;
    role?: string;
    company?: string;
    avatar?: string;
    content: string;
    rating: number;
  }[];
  layout: 'grid' | 'carousel' | 'masonry';
  columns: number;
  showAvatars: boolean;
  showRatings: boolean;
}

export interface PageVersion {
  id: string;
  version: number;
  data: Page;
  createdAt: Date;
  createdBy: string;
  message?: string;
}

// Additional settings interfaces for other block types
export interface RichTextSettings extends BaseBlockSettings {
  content: string;
}

export interface SpacerSettings extends BaseBlockSettings {
  height: number;
}

export interface DividerSettings extends BaseBlockSettings {
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
  color: string;
}

export interface CustomHTMLSettings extends BaseBlockSettings {
  html: string;
}

export interface CustomComponentSettings extends BaseBlockSettings {
  component: string;
  props: Record<string, any>;
}

// Additional interfaces for remaining block types
export interface LatestProductsSettings extends Omit<FeaturedProductsSettings, 'source'> {
  source: 'latest';
}

export interface BestSellersSettings extends Omit<FeaturedProductsSettings, 'source'> {
  source: 'best_seller';
}

export interface FlashSaleSettings extends FeaturedProductsSettings {
  countdown: {
    endDate: Date;
    timerStyle: 'digital' | 'circle' | 'bar';
  };
}

export interface CollectionBannerSettings extends BaseBlockSettings {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
  layout: 'left' | 'right' | 'center' | 'overlay';
}

export interface BrandSliderSettings extends BaseBlockSettings {
  title: string;
  brands: {
    id: string;
    name: string;
    logo: string;
    link: string;
  }[];
  autoplay: boolean;
}

export interface VideoSettings extends BaseBlockSettings {
  title: string;
  subtitle?: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'local';
  autoplay: boolean;
  controls: boolean;
  loop: boolean;
  muted: boolean;
  thumbnail: string;
}

export interface BeforeAfterSettings extends BaseBlockSettings {
  title: string;
  beforeImage: string;
  afterImage: string;
  labelBefore: string;
  labelAfter: string;
  orientation: 'horizontal' | 'vertical';
}

export interface InstagramFeedSettings extends BaseBlockSettings {
  title: string;
  username?: string;
  posts: {
    id: string;
    image: string;
    caption?: string;
    link: string;
  }[];
  limit: number;
  layout: 'grid' | 'carousel';
  columns: number;
}

export interface ImageSliderSettings extends BaseBlockSettings {
  // Already defined above
}