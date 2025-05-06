// Add these types to the existing types.ts file
export interface TaxSettings {
  enabled: boolean;
  rate: number;
  label: string;
}

export interface InvoiceSettings {
  tax: TaxSettings;
  currency: string;
  terms: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  type: 'service' | 'product' | 'estimate';
  status: 'draft' | 'sent' | 'paid' | 'void' | 'estimate';
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  subtotal: number;
  total: number;
  due_date: Date;
  paid_date?: Date;
  created_at: Date;
  items: InvoiceItem[];
  notes?: string;
  customers?: Customer;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Customer {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  created_at: Date;
}

export interface BusinessProfile {
  name: string;
  address: string;
  email: string;
  businessType: 'products' | 'services' | 'both';
  website?: string;
  subscription?: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  business_name?: string;
  business_email?: string;
  business_type?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  quantity: number;
  unit_price: number;
  created_at: Date;
  updated_at: Date;
  sku: string;
  price: number;
  stock_quantity: number;
  reorder_point: number;
  batch_tracking?: boolean;
  expiration_date?: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  reminder_date?: Date;
  created_at: Date;
}

export interface GeneralSettings {
  id: string;
  business_id: string;
  theme: string;
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan: string;
  status: 'active' | 'inactive' | 'cancelled';
  start_date: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'viewer';

export interface ActivityLog {
  id: string;
  business_id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: Date;
}