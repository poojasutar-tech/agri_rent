"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider } from "@/components/auth/AuthContext";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Tractor, LayoutDashboard, Cpu, Wrench, Users, LogOut } from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Allow login and register pages to render without token checks
    if (pathname === "/admin/login" || pathname === "/admin/register") {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) {
      router.replace("/admin/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin_user");
    router.replace("/admin/login");
  };

  // If on login/register pages, render them plainly without the admin sidebar wrapper
  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
        Verifying admin session...
      </div>
    );
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-slate-950">
          {/* SIDEBAR NAVIGATION */}
          <Sidebar>
            <SidebarHeader className="border-b border-blue-800 pb-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Tractor className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">AgriRent Admin</h2>
                  <p className="text-[10px] text-blue-300">Management Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/dashboard" || pathname === "/layouts/dashboard"}>
                    <Link href="/admin/dashboard">
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/engineModules"}>
                    <Link href="/admin/engineModules">
                      <Cpu className="w-5 h-5" />
                      <span>Engine Modules</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/equipment"}>
                    <Link href="/admin/equipment">
                      <Wrench className="w-5 h-5" />
                      <span>Equipment Catalog</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/users"}>
                    <Link href="/admin/users">
                      <Users className="w-5 h-5" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>

            {/* Footer Logout Button */}
            <div className="p-4 border-t border-blue-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </Sidebar>

          {/* MAIN CONTENT AREA */}
          <SidebarInset>
            <header className="flex h-16 items-center justify-between border-b border-blue-800 px-6 bg-blue-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <span className="font-semibold text-white text-sm tracking-tight">Admin Control Center</span>
              </div>
            </header>
            <main className="flex-1 p-6 bg-slate-950 text-white">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}