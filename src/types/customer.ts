import mongoose, {
  Schema,
  Document,
  Types,
} from 'mongoose';

export interface ICustomer extends Document {
  userId?: Types.ObjectId;
  phone: string;
  email?: string;
  name: string;
  addresses: {
    label: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    area: string;
    city: string;
    postcode?: string;
    division?: string;
    landmark?: string;
    isDefault: boolean;
  }[];
  stats: {
    ordersCount: number;
    totalSpent: number;
    firstOrderAt?: Date;
    lastOrderAt?: Date;
  };
  account: {
    hasLogin: boolean;
    convertedAt?: Date;
  };
  notifications: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  notes: {
    text: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
  }[];
  smsHistory: {
    message: string;
    sentAt: Date;
    type: 'bulk' | 'single';
    status: 'sent' | 'failed' | 'pending';
  }[];
  status: 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}


export interface CustomerAddress {
  address: any[];
  city: string;
  area?: string;
}

export interface CustomerStats {
  ordersCount: number;
  totalSpent: number;
  firstOrderAt?: Date | string;
  lastOrderAt?: Date | string;
}

export interface CustomerNote {
  text: string;
  createdBy?: string;
  createdAt: Date;
}

export interface CustomerSMS {
  message: string;
  sentAt: Date | string;
  type: 'bulk' | 'single';
  status: 'sent' | 'failed' | 'pending';
}

export interface CustomerNotifications {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface Customer {
  _id: string;

  name: string;
  phone: string;
  email?: string;

  addresses: any[];

  stats: CustomerStats;

  account: {
    hasLogin: boolean;
    convertedAt?: Date | string;
  };

  notes: CustomerNote[];

  smsHistory: CustomerSMS[];

  notifications: CustomerNotifications;

  status: 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';

  createdAt: Date | string;
  updatedAt: Date | string;
}