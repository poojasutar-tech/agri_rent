"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  Users,
  Layers,
  Activity,
  ChevronRight,
  Menu,
  LogOut,
  Bell,
  Search,
  Tractor,
  Wrench,
  Package,
  Database,
  Cog,
} from "lucide-react";
import api from "../../src/api";

const iconMap = {
  LayoutDashboard,
  Settings,
  Users,
  Layers,
  Activity,
  Tractor,
  Wrench,
  Package,
  Database,
  Cog,
  Default: Layers,
};

const getIcon = (iconName) => iconMap[iconName] || iconMap.Default;

const dashboardMenuItem = {
  title: "Dashboard",
  icon: "LayoutDashboard",
  path: "/admin/dashboard",
};

const engineModulesMenuItem = {
  title: "Engine Modules",
  icon: "Cog",
  path: "/admin/engineModules",
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([dashboardMenuItem]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [adminUser, setAdminUser] = useState({ username: "Admin", role: "Administrator" });

  const pathname = usePathname();
  const router = useRouter();

  const isActive = useCallback((path) => pathname === path, [pathname]);

  // Load user info & fetch Engine Modules from GET /api/engine-module/
  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/register") return;

    const storedUser = localStorage.getItem("admin_user");
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch {}
    }

    const fetchSidebarModules = async () => {
      try {
        setLoadingMenu(true);
        const response = await api.get("engine-module/");
        const modulesList = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        const moduleMenuItems = modulesList
          .filter((module) => module?.url)
          .map((module) => ({
            id: module.module_code,
            title: module.module_name || module.module_code,
            path: module.url.startsWith("/") ? module.url : `/${module.url}`,
            icon: module.icon,
          }))
          .filter((module) => module.path !== engineModulesMenuItem.path);

        setMenuItems([dashboardMenuItem, engineModulesMenuItem, ...moduleMenuItems]);
      } catch (error) {
        console.error("Failed to fetch engine modules for sidebar:", error);
        setMenuItems([dashboardMenuItem, engineModulesMenuItem]);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchSidebarModules();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const SidebarContentComponent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Section */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Tractor className="w-5 h-5" />
          </div>
          {sidebarOpen && (
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Agri<span className="text-emerald-600">Rent</span>
            </span>
          )}
        </Link>
      </div>

      {/* Dynamic Nav Tree */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <Link
              key={item.id || item.title}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border-l-4 ${
                isActive(item.path)
                  ? "bg-emerald-50 text-emerald-900 border-emerald-600 shadow-sm"
                  : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.title}</span>}
            </Link>
          );
        })}
        {loadingMenu && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
            <span className="text-xs text-slate-500 font-medium">Loading Modules...</span>
          </div>
        )}
      </nav>

      {/* User & Sign Out Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {adminUser?.username?.charAt(0)?.toUpperCase() || "A"}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {adminUser?.username || "Admin"}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {adminUser?.role || "Administrator"}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 rounded-lg text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors font-semibold cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 hidden lg:block z-30 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <SidebarContentComponent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-14 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm z-40 cursor-pointer"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-72 bg-white z-50 lg:hidden shadow-2xl"
            >
              <SidebarContentComponent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Shell */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search equipment, farmers, modules..."
                  className="pl-10 pr-4 w-80 bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 h-9 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-slate-100 relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <span className="text-sm font-bold text-slate-800 hidden sm:block">
                {adminUser?.username || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}