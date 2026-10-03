export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
}