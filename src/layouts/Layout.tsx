import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./layout.css";
import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";

const Layout = () => {
  const location = useLocation();

  // State to control sidebar visibility (persisted in localStorage)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) return saved === "true";
    return window.innerWidth >= 1024; // Default open on desktop, closed on mobile
  });

  // Sync state to localStorage for persistence across reloads
  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  // Auto-close sidebar on mobile after navigating to a new page
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="app-layout">
      {/* Top Navigation Bar with Toggle Button */}
      <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

      <div className="layout-body">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className={`sidebar-overlay ${window.innerWidth < 1024 ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

        {/* Dynamic Page Content Area */}
        <main
          className={`layout-content ${sidebarOpen ? "with-sidebar" : "full-width"
            }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
