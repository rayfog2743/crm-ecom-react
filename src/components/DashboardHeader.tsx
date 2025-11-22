
import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  Plus,
  Bell,
  LogOut,
  Home,
  Package,
  Building2,
  BarChart3,
  Users,
  Map,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { IMAGES } from "@/assets/Images";
import { useAuth } from "@/components/contexts/AuthContext";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import api from "@/api/axios";
import MainLogo from "@/assets/RayFog.jpeg";
interface HeaderProps {
  onMenuToggle?: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

type TabItem = {
  key: string;
  label: string;
  path: string;
  Icon?: React.ComponentType<any>;
};

const API_BASE = api.defaults.baseURL || "";

// console.log("setting",API_BASE);

const DashboardHeader: React.FC<HeaderProps> = ({ onMenuToggle, searchValue, onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // If you have RootState typed in your project, the line below is ideal.
  // If not, change to `useSelector((s: any) => s.sitesettings || {})`.
  const settings = useSelector((state: RootState | any) => (state as any).sitesettings || {});
  //  console.log("Site Settings in Header:", settings);
  // Helpful debug: shows raw slice content in console so you can inspect when it's empty.
  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) {
      // console.info("[DashboardHeader] sitesettings appears empty — ensure your store mounts the reducer under the key `sitesettings` and the settings thunk has run.");
    }
  }, [settings]);
  const logoRaw = (settings && (settings.logo_url ?? settings.logo ?? "")) || "";
  // Build absolute URL only if needed. We DON'T fetch here.
  const buildLogoUrl = (logo: string) => {
    if (!logo) return "";
    const trimmed = logo.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // If server returns relative path like "/uploads/logo.png" or "uploads/logo.png"
    if (trimmed.startsWith("/")) return `${API_BASE.replace(/\/+$/, "")}${trimmed}`;
    return `${API_BASE.replace(/\/+$/, "")}/${trimmed}`;
  };

  const logoSrc = buildLogoUrl(logoRaw) || IMAGES.Nutz;
  const siteName = settings?.site_name || "9nutz";
  const ProfileName = settings?.name || "Admin";

  const { logout, user } = useAuth();

  const [plusOpen, setPlusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const plusBtnRef = useRef<HTMLButtonElement | null>(null);
  const plusPanelRef = useRef<HTMLDivElement | null>(null);

  const userBtnRef = useRef<HTMLDivElement | null>(null);
  const userPanelRef = useRef<HTMLDivElement | null>(null);

  const notifBtnRef = useRef<HTMLButtonElement | null>(null);
  const notifPanelRef = useRef<HTMLDivElement | null>(null);

  const tabs: TabItem[] = [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", Icon: Home },
    { key: "products", label: "Products", path: "/products", Icon: Package },
    { key: "customerSaleHistory", label: "Category", path: "/categorywisesale", Icon: BarChart3 },
    { key: "franchise", label: "Franchise", path: "/franchise", Icon: Building2 },
    { key: "customer", label: "Point of Sale", path: "/Customer", Icon: Users },
    { key: "routemap", label: "Pos Details", path: "/routemap", Icon: Map },
  ];

  // ---------- NEW: derive friendly route label ----------
  const getRouteLabel = (pathname: string) => {
    if (!pathname) return "Dashboard";
    // first try to find a matching tab (exact or prefix)
    const found = tabs.find((t) => {
      if (t.path === "/") return pathname === "/";
      // exact match
      if (pathname === t.path) return true;
      // prefix match (subroute), e.g. /products/123
      if (pathname.startsWith(t.path + "/")) return true;
      // also allow case-insensitive startsWith for paths like /Customer
      if (pathname.toLowerCase().startsWith(t.path.toLowerCase() + "/")) return true;
      return false;
    });
    if (found) return found.label;

    // fallback: use last non-empty segment
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    const last = segments[segments.length - 1];

    // If the last segment is numeric (id), prefer the previous segment
    if (/^\d+$/.test(last) && segments.length >= 2) {
      const prev = segments[segments.length - 2];
      return prettifySegment(prev);
    }
    return prettifySegment(last);
  };

  const prettifySegment = (seg: string) => {
    if (!seg) return "";
    const s = seg.replace(/[-_]/g, " ");
    return s
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };
  // ---------- END new logic ----------

  useEffect(() => {
    function handleDocClick(e: MouseEvent | TouchEvent | KeyboardEvent) {
      const target = (e as MouseEvent).target as Node | null;

      // ESC handling
      if ((e as KeyboardEvent).key === "Escape") {
        setPlusOpen(false);
        setUserOpen(false);
        setNotifOpen(false);
        return;
      }

      if (!target) return;

      if (plusOpen && plusPanelRef.current && plusBtnRef.current) {
        if (!plusPanelRef.current.contains(target) && !plusBtnRef.current.contains(target)) {
          setPlusOpen(false);
        }
      }

      if (userOpen && userPanelRef.current && userBtnRef.current) {
        if (!userPanelRef.current.contains(target) && !userBtnRef.current.contains(target)) {
          setUserOpen(false);
        }
      }

      if (notifOpen && notifPanelRef.current && notifBtnRef.current) {
        if (!notifPanelRef.current.contains(target) && !notifBtnRef.current.contains(target)) {
          setNotifOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("touchstart", handleDocClick);
    document.addEventListener("keydown", handleDocClick);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("touchstart", handleDocClick);
      document.removeEventListener("keydown", handleDocClick);
    };
  }, [plusOpen, userOpen, notifOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUserOpen(false);
      navigate("/login", { replace: true });
    }
  };
  const onPlusNavigate = (path: string) => {
    setPlusOpen(false);
    navigate(path);
  };
  const avatarInitial = (user?.name ?? user?.username ?? "A").toString().charAt(0).toUpperCase();
  const routeLabel = getRouteLabel(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl" >
        <div className="w-full h-12 flex items-center gap-3 overflow-hidden px-3">
  {/* Logo */}
  <img
    src={logoSrc}
    alt={siteName}
    className="h-10 w-auto object-contain"
    onError={(e) => {
      const el = e.currentTarget as HTMLImageElement;
      if (el.src !== IMAGES.Nutz) el.src = IMAGES.Nutz;
    }}
  />
  {/* Text section */}
  <div className="flex items-baseline gap-3 truncate">
    {/* Highlighted site name */}
    <h1 className="text-xl font-extrabold text-emerald-500 truncate">
      {settings.site_name}
    </h1>

    {/* Route label (subtext) */}
    <h3 className="text-base font-medium text-slate-600 truncate">
      {routeLabel}
    </h3>
  </div>
</div>

      </div>
      <div className="flex items-center gap-4">
        {/* Plus / quick tabs */}
        <div className="relative">
          <button
            ref={plusBtnRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={plusOpen}
            onClick={() => {
              setPlusOpen((s) => !s);
              setUserOpen(false);
              setNotifOpen(false);
            }}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            title="Quick create / go to"
          >
            <Plus className="h-5 w-5 text-gray-700" />
          </button>

          {plusOpen && (
            <div
              ref={plusPanelRef}
              role="menu"
              aria-label="Quick tabs"
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-50"
            >
              <div className="p-2">
                {tabs.map((t) => {
                  const Icon = t.Icon;
                  const isActive = location.pathname === t.path;
                  return (
                    <button
                      key={t.key}
                      onClick={() => onPlusNavigate(t.path)}
                      className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm ${isActive ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                      role="menuitem"
                      title={t.label}
                    >
                      <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center">
                        {Icon ? <Icon className="w-4 h-4 text-indigo-600" /> : null}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{t.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notifBtnRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            onClick={() => {
              setNotifOpen((s) => !s);
              setPlusOpen(false);
              setUserOpen(false);
            }}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>
          {notifOpen && (
            <div ref={notifPanelRef} className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-50">
              <div className="p-3">
                <div className="text-sm font-semibold mb-2">Notifications</div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="p-2 rounded-md hover:bg-gray-50">New order received</li>
                  <li className="p-2 rounded-md hover:bg-gray-50">Stock update</li>
                  <li className="p-2 rounded-md hover:bg-gray-50">Employee request pending</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <div
            ref={userBtnRef}
            tabIndex={0}
            role="button"
            aria-haspopup="menu"
            aria-expanded={userOpen}
            onClick={() => {
              setUserOpen((s) => !s);
              setPlusOpen(false);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 ml-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">{avatarInitial}</span>
            </div>
            <span className="text-sm font-medium text-gray-800 hidden sm:inline">
              {user?.name ?? user?.username ?? "Admin"}
            </span>
          </div>
          {userOpen && (
            <div ref={userPanelRef} role="menu" aria-label="User menu" className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-50">
              <div className="p-3">
                <div className="flex items-center gap-3 px-1 py-2">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{avatarInitial}</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium" onClick={() => navigate("/Site-Settings")}>
                      {user?.name ?? user?.username ?? "Admin"}
                    </div>
                    <div className="text-xs text-gray-500">{user?.username ?? ""}</div>
                  </div>
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-50" role="menuitem">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
