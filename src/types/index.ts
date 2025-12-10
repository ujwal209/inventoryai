export type UserRole = 'vendor' | 'dealer' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  business_details?: {
    name: string;
    address: string;
    phone: string;
  };
  dealer_id?: string; // For vendors linked to a dealer
  created_at: number; // Timestamp
}

export interface MasterProduct {
  sku: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  image_url?: string;
}

export interface InventoryItem {
  id: string;
  vendor_id: string;
  master_product_id: string;
  local_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  expiry_date?: number;
}

export interface Invoice {
  id: string;
  vendor_id: string;
  image_url: string;
  status: 'processing' | 'needs_review' | 'completed';
  raw_data?: any; // Result from Agent 1
  created_at: number;
}
