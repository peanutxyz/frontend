// src/lib/api.ts

"use client"

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor with more concise debug logs
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // More concise logging
    console.log(`${config.method?.toUpperCase()} ${config.url} | Token: ${!!token}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with more concise debug logs
api.interceptors.response.use(
  (response) => {
    console.log(`${response.config.method?.toUpperCase()} ${response.config.url} | Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} | ${error.response?.status} | ${error.response?.data?.message || error.message}`);
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token and user data upon successful login
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },
 
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  }
};

export const dashboardApi = {
  getAdminStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Admin Stats Error:', error);
      throw error;
    }
  },

  // Profile management
updateProfile: async (data: any) => {
  try {
    const response = await api.patch('/users/profile', data);
    return response.data;
  } catch (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
},

uploadAvatar: async (formData: FormData) => {
  try {
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    throw error;
  }
},

// Security
changePassword: async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  try {
    const response = await api.post('/users/change-password', data);
    return response.data;
  } catch (error) {
    console.error('Change Password Error:', error);
    throw error;
  }
},

sendVerificationEmail: async () => {
  try {
    const response = await api.post('/users/verify-email');
    return response.data;
  } catch (error) {
    console.error('Send Verification Email Error:', error);
    throw error;
  }
},

// Notification settings
updateNotificationSettings: async (settings: any) => {
  try {
    const response = await api.patch('/users/notifications/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Update Notification Settings Error:', error);
    throw error;
  }
},

// Appearance settings
updateAppearanceSettings: async (settings: any) => {
  try {
    const response = await api.patch('/users/appearance', settings);
    return response.data;
  } catch (error) {
    console.error('Update Appearance Settings Error:', error);
    throw error;
  }
},

// Session management
getLoginActivity: async () => {
  try {
    const response = await api.get('/users/sessions');
    return response.data;
  } catch (error) {
    console.error('Get Login Activity Error:', error);
    return [];
  }
},

logoutAllDevices: async () => {
  try {
    const response = await api.post('/users/logout-all');
    return response.data;
  } catch (error) {
    console.error('Logout All Devices Error:', error);
    throw error;
  }
},

// Get user profile
getUserProfile: async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Get User Profile Error:', error);
    throw error;
  }
},

  syncSupplierBalance: async (id: string) => {
    try {
      const response = await api.post(`/suppliers/${id}/sync-balance`);
      return response.data;
    } catch (error) {
      console.error('Sync Supplier Balance Error:', error);
      throw error;
    }
  },

  updateLoanLimit: async (amount: number) => {
    try {
      // Use the correct endpoint path
      const response = await api.post('/dashboard/settings/loan-limit', { amount });
      return response.data;
    } catch (error) {
      console.error('Update Loan Limit Error:', error);
      throw error;
    }
  },

  getOwnerStats: async () => {
    try {
      const response = await api.get('/dashboard/owner');
      return response.data;
    } catch (error) {
      console.error('Owner Stats Error:', error);
      throw error;
    }
  },

  getSupplierStats: async () => {
    try {
      // No need to manually set token here - the interceptor handles this
      const response = await api.get('/dashboard/supplier');
      return response.data;
    } catch (error) {
      console.error('Supplier Stats Error:', error);
      throw error;
    }
  },

  // Supplier methods
  getSuppliers: async () => {
    try {
      const response = await api.get('/suppliers');
      return response.data;
    } catch (error) {
      console.error('Get Suppliers Error:', error);
      throw error;
    }
  },

  getSupplierById: async (id: string) => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Supplier By ID Error:', error);
      throw error;
    }
  },

  getSupplierByUser: async (userId: string) => {
    try {
      const response = await api.get(`/suppliers/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get Supplier By User Error:', error);
      return null; // Return null instead of throwing
    }
  },

  // Credit score - Updated to handle new fields
  getCreditScore: async (supplierId: string) => {
    try {
      const response = await api.get(`/creditScore/${supplierId}`);
      return response.data;
    } catch (error) {
      console.error('Get Credit Score Error:', error);
      // Return a default object on error with all required fields
      return {
        score: 0,
        transaction_consistency: 0,
        total_supply_score: 0,
        transaction_count_score: 0,
        eligible_amount: 0,
        transaction_count: 0,
        is_eligible: false,
        assessment_date: new Date(),
        remarks: "Error retrieving score"
      };
    }
  },
 
  // Get credit score with detailed components
  getDetailedCreditScore: async (supplierId: string) => {
    try {
      console.log("Fetching detailed credit score for supplier:", supplierId);
      const response = await api.get(`/creditScore/supplier/${supplierId}`);
      console.log("Detailed credit score response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Get Detailed Credit Score Error:', error);
      return null;
    }
  },

  // New method for manual recalculation
  recalculateCreditScore: async (supplierId: string) => {
    try {
      console.log("Recalculating credit score for supplier:", supplierId);
      const response = await api.get(`/creditScore/recalculate/${supplierId}`);
      console.log("Recalculation response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Recalculate Credit Score Error:', error);
      throw error;
    }
  },

  createSupplier: async (data: any) => {
    try {
      const response = await api.post('/suppliers', data);
      return response.data;
    } catch (error) {
      console.error('Create Supplier Error:', error);
      throw error;
    }
  },

  updateSupplier: async (id: string, data: any) => {
    try {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Supplier Error:', error);
      throw error;
    }
  },

  deleteSupplier: async (id: string) => {
    try {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Supplier Error:', error);
      throw error;
    }
  },

  getTransactions: async (params?: any) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Get Transactions Error:', error);
      throw error;
    }
  },

  getSupplierTransactions: async () => {
    try {
      const response = await api.get('/transactions/supplier');
      return response.data;
    } catch (error) {
      console.error('Get Supplier Transactions Error:', error);
      return [];
    }
  },

  getTransactionById: async (id: string) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Transaction By ID Error:', error);
      throw error;
    }
  },

  createTransaction: async (data: any) => {
    try {
      // Set status to completed by default if not specified
      const submitData = {
        ...data,
        status: data.status || 'completed'
      };
      
      console.log("Creating transaction:", submitData);
      const response = await api.post('/transactions', submitData);
      console.log("Transaction created:", response.data);
      return response.data;
    } catch (error) {
      console.error('Create Transaction Error:', error);
      throw error;
    }
  },
 
  updateTransaction: async (id: string, data: any) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Transaction Error:', error);
      throw error;
    }
  },
 
  cancelTransaction: async (id: string) => {
    try {
      const response = await api.patch(`/transactions/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel Transaction Error:', error);
      throw error;
    }
  },
 
  voidTransaction: async (id: string) => {
    try {
      const response = await api.patch(`/transactions/${id}/void`);
      return response.data;
    } catch (error) {
      console.error('Void Transaction Error:', error);
      throw error;
    }
  },

  cancelLoan: async (id: string) => {
    try {
      const response = await api.patch(`/loans/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel Loan Error:', error);
      throw error;
    }
  },
  
  voidLoan: async (id: string, reason?: string) => {
    try {
      const response = await api.patch(`/loans/${id}/void`, { reason });
      return response.data;
    } catch (error) {
      console.error('Void Loan Error:', error);
      throw error;
    }
  },

  // Manual transaction recalculation
  recalculateTransactionScore: async (transactionId: string) => {
    try {
      const response = await api.post(`/transactions/${transactionId}/recalculate`);
      return response.data;
    } catch (error) {
      console.error('Recalculate Transaction Score Error:', error);
      throw error;
    }
  },

  // Loan related methods
  getLoans: async (params?: any) => {
    try {
      const response = await api.get('/loans', { params });
      return response.data;
    } catch (error) {
      console.error('Get Loans Error:', error);
      throw error;
    }
  },
 
  getSupplierLoans: async () => {
    try {
      console.log('Fetching supplier loans...');
      const response = await api.get('/loans/supplier');
      console.log('Supplier loans response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get Supplier Loans Error:', error);
      throw error;
    }
  },

  getLoanById: async (id: string) => {
    try {
      const response = await api.get(`/loans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Loan By ID Error:', error);
      throw error;
    }
  },

  createLoan: async (data: any) => {
    try {
      // Force token retrieval right before the request
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Make the request with explicit headers
      const response = await api.post('/loans', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Create Loan Error:', error);
      throw error;
    }
  },

  approveLoan: async (id: string) => {
    try {
      const response = await api.patch(`/loans/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Approve Loan Error:', error);
      throw error;
    }
  },

  rejectLoan: async (id: string) => {
    try {
      const response = await api.patch(`/loans/${id}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject Loan Error:', error);
      throw error;
    }
  },

  // Payment methods
  getAllPayments: async () => {
    try {
      const response = await api.get('/loanPayments');
      return response.data;
    } catch (error) {
      console.error('Get All Payments Error:', error);
      return [];
    }
  },
 
  getLoanPayments: async (loanId: string) => {
    try {
      const response = await api.get(`/loans/${loanId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Get Loan Payments Error:', error);
      return { payments: [] };
    }
  },
 
  recordLoanPayment: async (loanId: string, paymentData: {
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) => {
    try {
      const response = await api.post(`/loans/${loanId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Record Loan Payment Error:', error);
      throw error;
    }
  }
};

export const analyticsApi = {
  getAdminAnalytics: async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching admin analytics with token:', !!token);
      
      const response = await api.get('/analytics/admin/overview');
      console.log('Analytics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Admin Analytics Error:', error);
      throw error;
    }
  },

  getOwnerAnalytics: async () => {
    try {
      const response = await api.get('/analytics/owner/overview');
      return response.data;
    } catch (error) {
      console.error('Owner Analytics Error:', error);
      throw error;
    }
  },

  getSupplierAnalytics: async () => {
    try {
      console.log('Fetching supplier analytics data...');
      const response = await api.get('/analytics/supplier/overview');
      console.log('Supplier analytics data received:', 
                  response.data?.transactions?.history?.length || 0, 'history items');
      return response.data;
    } catch (error) {
      console.error('Supplier Analytics Error:', error);
      throw error;
    }
  },

  getMarketTrends: async () => {
    try {
      const response = await api.get('/analytics/market-trends');
      return response.data;
    } catch (error) {
      console.error('Market Trends Error:', error);
      throw error;
    }
  },
};

export { api };