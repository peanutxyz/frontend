// src/types.ts

export interface Supplier {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  address?: {
    street?: string;
    purok?: string;
    barangay?: string;
    municipal?: string;
  };
  current_balance: number;
  is_active: boolean;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'owner' | 'supplier';  // Match the auth.ts role types
  contact_number?: string;
  address?: string;
  avatar?: string;
  emailVerified?: boolean;
 
  // Fields used in frontend that map to database fields
  phone?: string;         // Maps to contact_number
  position?: string;      // Maps to role
 
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// Add this to extend the AuthState interface
export interface AuthState {
  token: string | null;
  user: User | null;
  tabId: string | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  forceNewLogin: () => void;
  updateUser?: (user: User) => void;  // Add the missing updateUser method
}