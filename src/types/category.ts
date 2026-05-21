// types/category.ts
export interface CategoryField {
  key: string;
  label: string;
  type: string;
  unit?: string;
  options?: string[];
  required?: boolean;
  filterable?: boolean;
  isVariantAttribute?: boolean;
}

export interface CategorySpecGroup {
  groupName: string;
  fields: CategoryField[];
  displayOrder: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  parentId: string | null;
  status: string;
  specificationTemplate?: CategorySpecGroup[];
  children?: Category[];
  parent?: Category;
  productCount?: number;
  createdAt?: string;  // Changed from Date to string
  updatedAt?: string;  // Changed from Date to string
}