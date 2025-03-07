// src/components/shared/DashboardShell.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import Image from "next/image"
import {
  LayoutDashboard,
  CircleDollarSign,
  ClipboardList,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  CreditCard
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  role: 'admin' | 'owner' | 'supplier'
}

function DashboardContent({ children, role }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const clearAuth = useAuth((state) => state.clearAuth)
  const user = useAuth((state) => state.user)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle scrolling in sidebar
  const handleScroll = () => {
    setIsScrolling(true)
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Set a new timeout to hide scrollbar after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1000) // 1 second delay before hiding scrollbar
  }

  // Handle window resize for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    // Initial check
    checkMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      // Clean up scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Add custom scrollbar styles
  useEffect(() => {
    // Add custom scrollbar CSS to head
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-container::-webkit-scrollbar {
        width: 5px;
        background-color: transparent;
        transition: opacity 0.3s ease;
      }
      
      .sidebar-container::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0);
        border-radius: 10px;
        transition: background-color 0.3s ease;
      }
      
      .sidebar-container.scrolling::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      /* Firefox scrollbar */
      .sidebar-container {
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
      }
      
      .sidebar-container.scrolling {
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }
      
      /* Animation for menu items */
      nav a {
        animation: slideInRight 0.5s ease forwards;
        opacity: 0;
        animation-delay: calc(var(--item-index, 0) * var(--delay-factor));
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Button glow effect */
      .glow-on-hover {
        position: relative;
        overflow: hidden;
      }
      
      .glow-on-hover:after {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        transition: all 0.6s ease;
      }
      
      .glow-on-hover:hover:after {
        left: 100%;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleLogout = () => {
    clearAuth()
    toast.success("Logged out successfully")
    router.push('/auth/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const navigationLinks = {
    admin: [
      { 
        href: '/dashboard/admin', 
        label: 'Overview', 
        icon: (collapsed: boolean) => <LayoutDashboard className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/admin/suppliers', 
        label: 'Suppliers', 
        icon: (collapsed: boolean) => <Users className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/admin/loans', 
        label: 'Loans', 
        icon: (collapsed: boolean) => <CircleDollarSign className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/admin/transactions', 
        label: 'Transactions', 
        icon: (collapsed: boolean) => <ClipboardList className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/admin/analytics', 
        label: 'Analytics', 
        icon: (collapsed: boolean) => <BarChart2 className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/admin/settings', 
        label: 'Settings', 
        icon: (collapsed: boolean) => <Settings className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
    ],
    owner: [
      { 
        href: '/dashboard/owner', 
        label: 'Overview', 
        icon: (collapsed: boolean) => <LayoutDashboard className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/owner/suppliers', 
        label: 'Suppliers', 
        icon: (collapsed: boolean) => <Users className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/owner/loans', 
        label: 'Loans', 
        icon: (collapsed: boolean) => <CircleDollarSign className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/owner/transactions', 
        label: 'Transactions', 
        icon: (collapsed: boolean) => <ClipboardList className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/owner/analytics', 
        label: 'Analytics', 
        icon: (collapsed: boolean) => <BarChart2 className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/owner/settings', 
        label: 'Settings', 
        icon: (collapsed: boolean) => <Settings className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
    ],
    supplier: [
      { 
        href: '/dashboard/supplier', 
        label: 'Overview', 
        icon: (collapsed: boolean) => <LayoutDashboard className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/supplier/loans', 
        label: 'Loans', 
        icon: (collapsed: boolean) => <CircleDollarSign className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/supplier/transactions', 
        label: 'Transactions', 
        icon: (collapsed: boolean) => <ClipboardList className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/supplier/analytics', 
        label: 'Analytics', 
        icon: (collapsed: boolean) => <BarChart2 className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
      { 
        href: '/dashboard/supplier/settings', 
        label: 'Settings', 
        icon: (collapsed: boolean) => <Settings className={`${collapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
      },
    ]
  }

  // Sidebar width based on state
  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';
  const contentMargin = sidebarOpen ? 'md:ml-64' : 'md:ml-20';

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile Menu Toggle Button - Fixed position */}
      <button
        onClick={toggleSidebar}
        className="fixed z-50 bottom-6 right-6 md:hidden bg-amber-800 text-white p-3 rounded-full shadow-lg hover:bg-amber-900 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
        aria-label="Toggle Menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar Overlay - Only on mobile when sidebar is open */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Animated Sidebar */}
      <aside
        className={`sidebar-container fixed top-0 left-0 h-full z-40 bg-[#0e1629] text-white transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'} ${
          isScrolling ? 'scrolling' : ''
        }`}
        style={{
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onScroll={handleScroll}
      >
        <div className={`sticky top-0 p-4 ${sidebarOpen ? 'px-6' : 'px-3'}`}>
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen ? (
              <div className="flex flex-col items-start animate-fadeIn">
                <div className="flex items-center mb-1">
                  <div className="h-10 w-10 relative mr-3 animate-pulse overflow-hidden rounded-full bg-white p-1">
                    <Image
                      src="/bangbangan-logo.png"
                      alt="Bangbangan Logo"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Bangbangan</h2>
                    <p className="text-sm text-[#8ba5c9]">Copra Trading</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 relative mx-auto animate-pulse overflow-hidden rounded-full bg-white p-1">
                <Image
                  src="/bangbangan-logo.png"
                  alt="Bangbangan Logo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
          
          <nav className="space-y-2" style={{ '--delay-factor': '0.1s' } as React.CSSProperties}>
            {navigationLinks[role].map((link, index) => {
              // For overview link (dashboard root), only match exact path
              const isOverview = link.href === `/dashboard/${role}`;
              
              // Determine active state based on link type
              let isActive;
              if (isOverview) {
                // For overview - only exact match or dashboard root
                isActive = pathname === link.href;
              } else {
                // For other links - match exact or child routes
                isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              }
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                    isActive
                      ? "bg-amber-800 text-white shadow-md"
                      : "text-gray-300 hover:bg-[#1c2b45] hover:text-white"
                  } ${!sidebarOpen ? 'justify-center' : ''} transform hover:translate-x-1 glow-on-hover`}
                  title={!sidebarOpen ? link.label : ''}
                  style={{ '--item-index': index } as React.CSSProperties}
                >
                  {link.icon(!sidebarOpen)}
                  {sidebarOpen && (
                    <span className="text-base font-medium">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Logout button in sidebar */}
          <div className="mt-8 pt-6 border-t border-[#2a3a56]">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-gray-300 hover:bg-red-700 hover:text-white transition-all duration-300 ${
                !sidebarOpen ? 'justify-center' : ''
              } transform hover:translate-x-1 glow-on-hover`}
              title={!sidebarOpen ? 'Logout' : ''}
            >
              <LogOut className={`${!sidebarOpen ? "w-6 h-6" : "w-5 h-5"}`} />
              {sidebarOpen && (
                <span className="text-base font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - with dynamic margin to account for sidebar width */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out overflow-auto ${contentMargin} bg-white pb-10`}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

// Wrapper component to handle hydration
export function DashboardShell(props: DashboardShellProps) {
  const [isMounted, setIsMounted] = useState(false)
  const user = useAuth((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    
    // Check authentication
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // Check role authorization
    if (user.role !== props.role) {
      toast.error("Unauthorized access")
      router.push(`/dashboard/${user.role}`)
    }
  }, [user, router, props.role])

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 border-4 border-amber-800 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return <DashboardContent {...props} />
}