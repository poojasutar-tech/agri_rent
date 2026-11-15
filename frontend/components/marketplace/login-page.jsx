"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AuthShell, TextField } from "./shared";

export default function Login() {
  const [submitted, setSubmitted] = useState(false);
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
      {submitted ? (
        <div className="flow-success">
          <span>
            <Check size={21} />
          </span>
          <h3>Sign-in form submitted</h3>
          <p>
            Demo only: connect an authentication provider to verify credentials
            and start a secure session.
          </p>
          <Link className="flow-primary" href="/">
            Return to home <ArrowRight size={15} />
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
            name="email"
            label="Email address"
            type="email"
            placeholder="you@yourfarm.com"
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
          />
          {/* <div className="auth-inline">
            <label className="flow-check">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#reset">Forgot password?</a>
          </div> */}
          <button className="flow-primary" type="submit">
            Sign in <ArrowRight size={15} />
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
      )}
    </AuthShell>
  );
}
