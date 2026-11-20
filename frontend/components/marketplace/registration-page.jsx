"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { AuthShell, TextField } from "./shared";
import api from "../../app/utils/domain";

export default function Registration() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [countriesError, setCountriesError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get("api/countries/")
      .then(({ data }) => {
        if (!cancelled) {
          setCountries((Array.isArray(data) ? data : []).filter((country) => Number(country.status) === 1));
        }
      })
      .catch(() => {
        if (!cancelled) setCountriesError("Country options could not be loaded.");
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName");
    const farm = formData.get("farm");
    const selectedCountryCode = formData.get("country_code");
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
      await api.post("api/auth/register/", {
        full_name: fullName,
        farm_name: farm,
        country_code: selectedCountryCode,
        email,
        mobile,
        password,
      });

      setSubmitted(true);
    } catch (err) {
      const responseData = err?.response?.data;
      setError(
        responseData?.error ||
          (responseData && Object.values(responseData)[0]) ||
          "Unable to connect to the server. Please check your backend."
      );
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
          <label className="flow-field">
            <span>Country</span>
            <select
              name="country_code"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              required
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country.country_code} value={country.country_code}>
                  {country.country_name}
                </option>
              ))}
            </select>
            {countriesError && <small role="alert">{countriesError}</small>}
          </label>
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