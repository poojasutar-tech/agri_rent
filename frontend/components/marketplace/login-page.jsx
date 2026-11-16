"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell, TextField } from "./shared";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set cookies and localStorage so header can display user info & middleware permits access
        document.cookie = "is_logged_in=true; path=/; max-age=86400";
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("user_code", data.user_code);
        localStorage.setItem("user_role", data.role);

        if (data.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/equipment");
        }
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check your backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      active="Login"
      note="Protected with industry-standard security."
      visualTitle="Your farm, connected and ready to grow."
    >
      <div className="auth-heading">
        <span className="flow-eyebrow">WELCOME BACK</span>
        <h2>Sign in to agrirent</h2>
        <p>Pick up right where you left off.</p>
      </div>

      {error && <p style={{ color: "red", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

      <form className="flow-form" onSubmit={handleSubmit}>
        <TextField
          name="email"
          label="Email address or phone number"
          type="text"
          placeholder="you@yourfarm.com or 9876543210"
          required
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
        />
        <button className="flow-primary" type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={15} /> : <>Sign in <ArrowRight size={15} /></>}
        </button>
        <div className="auth-divider">
          <span />
          or
          <span />
        </div>
        <p className="auth-switch">
          New to agrirent?{" "}
          <Link href="/registration">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}