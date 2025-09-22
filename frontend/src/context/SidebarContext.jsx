// frontend/src/context/SidebarContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const location = useLocation();
  
  // Initialize from localStorage or default based on screen size
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to open on desktop, closed on mobile
    return window.innerWidth >= 1024;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle responsive behavior
  useEffect(() => {
    const checkWidth = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Only auto-close on mobile if user hasn't set a preference
      const saved = localStorage.getItem('sidebarOpen');
      if (saved === null && mobile !== isMobile) {
        setSidebarOpen(!mobile);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [isMobile]);

  // Auto-manage sidebar based on route
  useEffect(() => {
    const isOnSectionEditPage = location.pathname.includes('/sections/') && 
                                location.pathname.endsWith('/content');
    
    if (isOnSectionEditPage) {
      // Close sidebar on section edit page
      setSidebarOpen(false);
    } else if (!isMobile) {
      // Open sidebar on desktop for all other routes
      setSidebarOpen(true);
    }
  }, [location.pathname, isMobile]);

  // Don't persist to localStorage for automatic route-based changes
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };
  
  const openSidebar = () => {
    setSidebarOpen(true);
    localStorage.setItem('sidebarOpen', JSON.stringify(true));
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('sidebarOpen', JSON.stringify(false));
  };

  // Optional: Add keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const value = {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    isMobile,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// Custom hook for using the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}