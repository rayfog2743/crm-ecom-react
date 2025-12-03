

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Tag,
  Users,
  DollarSign,
  FileText,
  ShoppingCart,
  ClipboardList,
  Building2,
  Image,
  Settings,
  ChevronDown,
  Receipt,
  ReceiptIndianRupee 
   
} from "lucide-react";
import { useSelector } from "react-redux";
import Logo from "@/assets/RayFog.jpeg"

const SIDEBAR_WIDTH_PX = 96;

const navigationItems = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home },
  // { id: "products", label: "Products", path: "/products", icon: Package },
  { id: "products", label: "Products", path: "/ProductList", icon: Package },
  { id: "products", label: "Products", path: "/products", icon: Package },
  { id: "category", label: "Category", path: "/category", icon: Tag },
  { id: "brand", label: "Brand", path: "/brand", icon: Tag },
  { id: "point-of-sale", label: "Point of Sale", path: "/point-of-sale", icon: ReceiptIndianRupee },
  { id: "expenses-summary", label: "Expenses Summary", path: "/expensesummary", icon: DollarSign },
  { id: "purchase-details", label: "Purchase Details", path: "/purchase-details", icon: FileText },
  { id: "orders", label: "Orders", path: "/orders", icon: ShoppingCart },
  { id: "inventory-management", label: "Inventory Management", path: "/sku/Inventory-Management", icon: ClipboardList },
  { id: "vendor-management", label: "Vendor Management", path: "/sku/vendor-Management", icon: Building2 },
  { id: "reports-overview", label: "Reports", path: "/Reports", icon: Image },
  { id: "customer-list", label: "Customer List", path: "/CustomerList", icon: Image },
  { id: "discounts", label: "Discount", path: "/Discount", icon: DollarSign },
  { id: "staff-management", label: "Staff Management", path: "/Staff-Management", icon: Users },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: Settings,
  //   children: [
  //     { id: "site-settings", label: "Site Settings", path: "/Site-Settings" }
  //   ]
  // }
  {
  id: "settings",
  label: "Settings",
  icon: Settings,
  path: "/site-settings"
}

];

export const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  // read site settings from redux (same as before)
  const settings = useSelector((state: any) => state.sitesettings || {});
  const fullNameFromApi = settings?.site_name;
  const displayTitle = fullNameFromApi?.toString().trim() ? fullNameFromApi.toString().trim() : "";

  const computeActive = (item: { path?: string; children?: any[] }) => {
    if (item.path) {
      const p = item.path.toLowerCase();
      const pathMatches =
        pathname === p || (p !== "/" && (pathname.startsWith(p + "/") || pathname.startsWith(p)));
      return !!pathMatches;
    } else if (item.children && Array.isArray(item.children)) {
      return item.children.some((c) => {
        const p = c.path.toLowerCase();
        return pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p);
      });
    }
    return false;
  };

  // Collapse/expand state for settings (could be reused for any menu with children)
  const [collapsedMenus, setCollapsedMenus] = useState<{ [key: string]: boolean }>({});

  const toggleCollapse = (id: string) => {
    setCollapsedMenus((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <aside
      aria-label="Main sidebar"
      className="flex flex-col bg-green-50 text-amber-900 border-r border-green-200"
      style={{ width: SIDEBAR_WIDTH_PX, minWidth: SIDEBAR_WIDTH_PX, maxWidth: SIDEBAR_WIDTH_PX, height: "100vh" }}
    >
      {/* Top: optional small logo area */}
      <div className="h-16 flex items-center justify-center px-2 border-b border-green-100 flex-shrink-0">
        {settings?.logo_url ? (
          <img
            src={Logo}
            alt={displayTitle}
            className="w-20 h-auto object-contain"
            style={{ maxWidth: SIDEBAR_WIDTH_PX - 16 }}
          />
        ) : (
          <div className="text-sm font-semibold text-amber-800"> {displayTitle} </div>
        )}
      </div>

      {/* Scrollable navigation */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3">
        <nav className="flex flex-col items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon as any;
            const active = computeActive(item);

            if (item.children && Array.isArray(item.children)) {
              // Render parent as clickable/collapsible (shown like others)
              const isCollapsed = collapsedMenus[item.id] !== undefined ? collapsedMenus[item.id] : !active;

              return (
                <div key={item.id} className="w-full">
                  <button
                    type="button"
                    title={item.label}
                    className={cn(
                      "w-full flex flex-col items-center gap-1 px-1 py-2 transition-colors group select-none",
                      active ? "bg-amber-200 border-l-4 border-amber-600" : "hover:bg-amber-100"
                    )}
                    style={{ textDecoration: "none" }}
                    onClick={() => toggleCollapse(item.id)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center justify-center rounded-md",
                        "w-8 h-8",
                        active ? "bg-amber-50 text-amber-700" : "text-amber-900"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <ChevronDown
                        className={cn(
                          "ml-0.5 w-3 h-3 transition-transform",
                          isCollapsed ? "-rotate-90 opacity-50" : "rotate-0 opacity-80"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] text-center leading-[11px] px-0 py-[2px] w-full truncate",
                        active ? "text-amber-700 font-medium" : "text-amber-900"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                  <div className={cn(
                    "pl-2 w-full flex flex-col items-center gap-1",
                    isCollapsed ? "hidden" : "block"
                  )}>
                    {item.children.map((child) => {
                      const childActive =
                        pathname === child.path.toLowerCase() ||
                        pathname.startsWith(child.path.toLowerCase() + "/") ||
                        pathname.startsWith(child.path.toLowerCase());
                      return (
                        <Link
                          key={child.id}
                          to={child.path}
                          className={cn(
                            "w-full px-1 py-1 rounded-md text-[10px] text-center transition-colors",
                            childActive ? "bg-amber-100 text-amber-800" : "hover:bg-amber-50 text-amber-900"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Regular navigation item (no children)
            return (
              <Link
                key={item.id}
                to={item.path}
                title={item.label}
                className={cn(
                  "w-full flex flex-col items-center gap-1 px-1 py-2 transition-colors",
                  active ? "bg-amber-200 border-l-4 border-amber-600" : "hover:bg-amber-100"
                )}
                style={{ textDecoration: "none" }}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center rounded-md",
                    "w-8 h-8",
                    active ? "bg-amber-50 text-amber-700" : "text-amber-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-[10px] text-center leading-[11px] px-0 py-[2px] w-full truncate",
                    active ? "text-amber-700 font-medium" : "text-amber-900"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer small area (optional) */}
      <div className="p-2 border-t border-green-100 text-center text-[11px] text-slate-600">
      </div>

      {/* scrollbar styling */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 10px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background-color: rgba(20,60,20,0.06); border-radius: 6px; }
        .sidebar-scroll:hover::-webkit-scrollbar-thumb { background-color: rgba(20,60,20,0.12); }
      `}</style>
    </aside>
  );
};

export default DashboardSidebar;
