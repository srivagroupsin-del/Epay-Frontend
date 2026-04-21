import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  RefreshCw
} from "lucide-react";
import "./navbar.css";
import { useRefresh } from "../refreshcontext/RefreshContext";

type NavbarProps = {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleRefresh = () => {
    triggerRefresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSearchOpen && !target.closest(".search-container")) {
        setIsSearchOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">

        {/* LEFT */}
        <div className="navbar-left">
          {!isSidebarOpen && (
            <button
              className="hamburger-btn"
              onClick={onToggleSidebar}
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="navbar-title">Dashboard</h1>
        </div>

        {/* CENTER */}
        <div className="navbar-center"></div>

        {/* RIGHT */}
        <div className="navbar-right">
          <div className={`search-container ${isSearchOpen ? "active" : ""}`}>
            <button
              className="icon-btn search-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search"
            >
              <Search size={18} />
            </button>
            <div className="search-box">
              <Search size={16} />
              <input placeholder="Search..." autoFocus={isSearchOpen} />
            </div>
          </div>

          <button className="icon-btn" onClick={handleRefresh} title="Refresh Page">
            <RefreshCw size={18} />
          </button>

          <div className="notification">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <span className="badge2">3</span>
          </div>

          <div className="profile" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="profile-initials">
                {user?.name
                  ? user.name.charAt(0)
                  : user?.email
                    ? user.email.charAt(0)
                    : "U"}
              </div>
              <ChevronDown size={16} />
            </button>

            {profileOpen && (
              <div className="dropdown">
                {user && (
                  <div className="dropdown-user">
                    <p className="user-name">{user.name}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                )}
                <button><User size={16} /> Profile</button>
                <button><Settings size={16} /> Settings</button>
                <button onClick={() => setDark(!dark)}>
                  {dark ? <Sun size={16} /> : <Moon size={16} />} Theme
                </button>
                <button className="logout" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </nav>
    </header>
  );
};

export default Navbar;
