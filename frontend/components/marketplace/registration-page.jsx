"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AuthShell, TextField } from "./shared";

export default function Registration() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <AuthShell active="Registration" note="Your farm data stays yours.">
      <div className="auth-heading">
        <span className="flow-eyebrow">START YOUR NEXT SEASON</span>
        <h2>Create your account</h2>
        <p>Get access to dependable equipment and local support.</p>
      </div>
      {submitted ? (
        <div className="flow-success">
          <span>
            <Check size={21} />
          </span>
          <h3>You&apos;re on your way.</h3>
          <p>
            Your demo account request is ready. Connect an authentication
            provider to enable secure account creation.
          </p>
          <Link className="flow-primary" href="/equipment">
            Explore equipment <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <form
          className="flow-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <TextField
            name="fullName"
            label="Full name"
            placeholder="e.g. Alex Morgan"
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
          />
          <TextField
            name="password"
            label="Create password"
            type="password"
            placeholder="At least 8 characters"
          />
          {/* <label className="flow-check">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="#terms">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </span>
          </label> */}
          <button className="flow-primary" type="submit">
            Create account <ArrowRight size={15} />
          </button>
          <p className="auth-switch">
            Already part of agrirent? <Link href="/login">Sign in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
