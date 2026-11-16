"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { AuthShell, TextField } from "./shared";

export default function Registration() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName");
    const farm = formData.get("farm");
    const email = formData.get("email");
    const mobile = formData.get("mobile");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Password Validation Rules
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (/\s/.test(password)) {
      setError("Password cannot contain spaces.");
      setLoading(false);
      return;
    }

    const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharacterPattern.test(password)) {
      setError("Password must contain at least one special character.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_code: "USER-" + Math.floor(1000 + Math.random() * 9000),
          full_name: fullName,
          farm_name: farm,
          email: email,
          mobile: mobile,
          password: password,
          role: "FARMER"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || Object.values(data)[0] || "Registration failed.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check your backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell active="Registration" note="Your farm data stays yours.">
      <div className="auth-heading">
        <span className="flow-eyebrow">START YOUR NEXT SEASON</span>
        <h2>Create your account</h2>
        <p>Get access to dependable equipment and local support.</p>
      </div>

      {error && <p style={{ color: "red", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

      {submitted ? (
        <div className="flow-success">
          <span>
            <Check size={21} />
          </span>
          <h3>You&apos;re on your way.</h3>
          <p>
            Your account has been successfully created in the database. You can now sign in.
          </p>
          <Link className="flow-primary" href="/login">
            Sign in <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <form className="flow-form" onSubmit={handleSubmit}>
          <TextField
            name="fullName"
            label="Full name"
            placeholder="e.g. Alex Morgan"
            required
          />
          <TextField
            name="farm"
            label="Farm or business name"
            placeholder="e.g. North Valley Farm"
          />
          <TextField
            name="email"
            label="Email address"
            type="email"
            placeholder="you@yourfarm.com"
            required
          />
          <TextField
            name="mobile"
            label="Phone number"
            type="tel"
            placeholder="e.g. 9876543210"
            required
          />
          <TextField
            name="password"
            label="Create password"
            type="password"
            placeholder="At least 8 chars, 1 special character"
            required
          />
          <TextField
            name="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            required
          />
          <button className="flow-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={15} /> : <>Create account <ArrowRight size={15} /></>}
          </button>
          <p className="auth-switch">
            Already part of agrirent? <Link href="/login">Sign in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}