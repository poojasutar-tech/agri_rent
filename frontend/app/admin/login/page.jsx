"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sprout, Lock, User, AlertCircle, ArrowRight, UserPlus } from "lucide-react";
import api from "../../../src/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Updated to call your custom AdminLoginView endpoint
      const response = await api.post("admin-login/", { username, password });

      const token = response.data.access || response.data.token;
      if (!token) {
        throw new Error("Token missing in server response");
      }

      localStorage.setItem("admin_token", token);
      localStorage.setItem("token", token);
      if (response.data.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh);
      }
      localStorage.setItem(
        "admin_user",
        JSON.stringify({
          username: response.data.full_name || username,
          email: response.data.email,
          user_code: response.data.user_code,
          role: response.data.role || "Super Admin",
        })
      );

      // Redirect to Admin Dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Invalid admin credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
            <Sprout size={20} strokeWidth={2.0} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            AgriRent Admin Portal
          </h1>
          {/* <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to manage fleet, engine modules, and rentals
          </p> */}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-sm shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950/50 transition cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register Account Option Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Need an administrator account?{" "}
            <Link 
              href="/admin/register" 
              className="font-bold text-emerald-600 dark:text-emerald-400 transition-colors hover:underline underline-offset-4 inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}