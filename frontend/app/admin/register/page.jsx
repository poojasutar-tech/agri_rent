"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  Loader2, 
  ShieldCheck,
  Phone,
  Eye,
  EyeOff
} from "lucide-react";
import api from "../../../src/api"; // Updated to match your working relative api path

export default function AdminRegister() {
  const router = useRouter();
  
  // Safe destructuring with fallback in case provider is missing
  const auth = useAuth() || {};
  const login = auth.login;

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile_no: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("admin-register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        mobile_no: form.mobile_no,
      });

      setSuccess("Success! Redirecting...");
      
      const { access, refresh, ...userData } = res.data;

      if (access && refresh) {
          if (login) {
              login(access, refresh, userData);
          } else {
              // Fallback if AuthProvider context isn't mounted yet
              localStorage.setItem("token", access);
              localStorage.setItem("refresh_token", refresh);
              localStorage.setItem("admin_token", access);
          }
          setTimeout(() => router.push("/layouts/dashboard"), 1200);
      } else {
          setTimeout(() => router.push("/admin/login"), 1500);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 font-sans transition-colors duration-300 relative bg-slate-50 dark:bg-slate-950">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
      
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg mb-4 transition-transform hover:-rotate-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Admin Registration</h2>
          <p className="text-sm font-medium mt-1 text-slate-500 dark:text-slate-400">Create your management account</p>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
           <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="block ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-70" />
                <input
                  name="username"
                  type="text"
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all outline-none focus:border-emerald-500"
                  placeholder="admin_user"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-70" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all outline-none focus:border-emerald-500"
                  placeholder="admin@mail.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile No (Optional)</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-70" />
                <input
                  name="mobile_no"
                  type="tel"
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all outline-none focus:border-emerald-500"
                  placeholder="+91 9876543210"
                  value={form.mobile_no}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-70" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="block ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-70" />
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-slate-700 dark:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 mt-4 text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Register Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link 
                href="/admin/login" 
                className="font-bold text-emerald-600 dark:text-emerald-400 transition-colors hover:underline underline-offset-4"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}