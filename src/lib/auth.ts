// src/lib/auth.ts

"use client"

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'supplier';
}

interface AuthState {
  token: string | null;
  user: User | null;
  tabId: string | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  forceNewLogin: () => void;
}

// Generate a unique ID for this tab session
const generateTabId = () => {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tabId: null,
      setAuth: (token, user) => {
        console.log('Setting auth state:', { token: !!token, user });
        
        // Ensure we have a tab ID
        const tabId = get().tabId || generateTabId();
        
        if (typeof window !== 'undefined') {
          // Store the tab ID in sessionStorage (which is tab-specific)
          sessionStorage.setItem('currentTabId', tabId);
          
          // Set cookies for middleware
          document.cookie = `token=${token}; path=/; max-age=2592000`; // 30 days
          document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=2592000`;
        }
        
        set({ token, user, tabId });
      },
      clearAuth: () => {
        console.log('Clearing auth state');
        
        if (typeof window !== 'undefined') {
          // Clear the cookies
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // We don't clear the tabId from state, as we want to keep the same tab identity
        }
        
        set({ token: null, user: null });
      },
      forceNewLogin: () => {
        // This function creates a new tab identity and clears auth
        const newTabId = generateTabId();
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentTabId', newTabId);
          
          // Clear cookies
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        set({ token: null, user: null, tabId: newTabId });
      },
      isAuthenticated: () => {
        const state = get();
        
        // Check if this is the active tab for this auth session
        const currentTabId = typeof window !== 'undefined' ? 
          sessionStorage.getItem('currentTabId') : null;
        
        // If tab IDs don't match, this tab shouldn't use the stored auth
        if (state.tabId && currentTabId && state.tabId !== currentTabId) {
          return false;
        }
        
        const hasToken = !!state.token;
        const hasUser = !!state.user;
        console.log('Auth check:', { hasToken, hasUser, tabMatches: state.tabId === currentTabId });
        
        return hasToken && hasUser;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tabId: state.tabId
      })
    }
  )
);

export function useHydratedAuth() {
  const auth = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // This ensures we only run on the client
    if (typeof window !== 'undefined') {
      // Get current tab ID from sessionStorage or generate a new one
      let currentTabId = sessionStorage.getItem('currentTabId');
      
      if (!currentTabId) {
        // If this is a new tab, generate a new ID
        currentTabId = generateTabId();
        sessionStorage.setItem('currentTabId', currentTabId);
      }
      
      // Check if we need to initialize this tab with a new auth session
      if (!auth.tabId) {
        // No tab ID in state yet, so set it
        auth.setAuth(auth.token || '', auth.user || { id: '', name: '', email: '', role: 'admin' });
      } else if (auth.tabId !== currentTabId) {
        // This tab has a different ID than the stored auth
        // Clear the auth state from this tab's perspective
        auth.clearAuth();
      }
      
      setIsHydrated(true);
    }
  }, []);
  
  return { auth, isHydrated };
}

export function useProtectedRoute(allowedRoles: ('admin' | 'owner' | 'supplier')[]) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    if (user && !allowedRoles.includes(user.role)) {
      console.log('Unauthorized role, redirecting to appropriate dashboard');
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, isAuthenticated, router, allowedRoles]);
  
  return { user, isAuthenticated };
}