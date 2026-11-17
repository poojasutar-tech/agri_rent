"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  MapPin,
  Menu,
  ShieldCheck,
  Sprout,
  Star,
  User,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

export const machines = [
  {
    name: "John Deere 6M 130",
    category: "Tractor · 130 HP",
    place: "Davis, CA",
    rate: 640,
    image: "/field-tractor.png",
    rating: "4.9",
    description:
      "A dependable 130 HP tractor with a comfortable cab and GPS-ready setup, ready for field work and hauling.",
    specs: ["4WD", "Cabin", "GPS ready"],
  },
  {
    name: "Kubota M7-172",
    category: "Tractor · 172 HP",
    place: "Woodland, CA",
    rate: 720,
    image:
      "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=900&q=85",
    rating: "4.8",
    description:
      "A powerful 172 HP tractor with four-wheel drive and GPS-ready capability for demanding farm work.",
    specs: ["4WD", "172 HP", "GPS ready"],
  },
  {
    name: "Claas Lexion 760",
    category: "Harvester · 460 HP",
    place: "Sacramento, CA",
    rate: 1250,
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=85",
    rating: "5.0",
    description:
      "A high-capacity 460 HP combine harvester with grain header and GPS guidance, built for a productive harvest.",
    specs: ["460 HP", "Grain header", "GPS"],
  },
];
export const currency = (value) => `$${Number(value).toLocaleString()}`;

const pageLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Equipments", href: "/equipment" },
  { label: "Contact Us", href: "/contact" },
  { label: "Farm dashboard", href: "/dashboard" },
];

export function findMachineByName(name) {
  return machines.find((machine) => machine.name === name) || machines[0];
}

export function FlowHeader({ active }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userCode, setUserCode] = useState("");

  useEffect(() => {
    // Read logged-in user info from cookies/localStorage on client load
    const name = localStorage.getItem("full_name");
    const code = localStorage.getItem("user_code");
    if (name) setUserName(name);
    if (code) setUserCode(code);
  }, []);

  const handleLogout = () => {
    // Clear auth state and cookies
    document.cookie = "is_logged_in=; path=/; max-age=0";
    localStorage.removeItem("full_name");
    localStorage.removeItem("user_code");
    localStorage.removeItem("user_role");
    setUserName("");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/auth/delete/${userCode}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        alert("Account deleted successfully.");
        handleLogout();
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  return (
    <header className="flow-header">
      <Link href="/" className="flow-brand">
        <span>
          <Sprout size={19} />
        </span>
        agrirent
      </Link>
      <button
        className="flow-menu-toggle"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
      <nav
        className={`marketplace-nav ${menuOpen ? "nav-open" : ""}`}
        aria-label="Marketplace navigation"
      >
        {pageLinks.map((link) => (
          <Link
            key={link.href}
            aria-current={active === link.label ? "page" : undefined}
            className={`${active === link.label ? "selected" : ""} ${link.className || ""}`}
            href={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {/* User Account / Profile Dropdown */}
        {userName ? (
          <div className="user-dropdown-container" style={{ position: "relative", display: "inline-block" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                padding: "6px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              <User size={16} />
              <span>{userName}</span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "40px",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  width: "180px",
                  zIndex: 100,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb"
                }}
              >
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem", color: "#6b7280" }}>
                  Signed in as <br /><b>{userName}</b>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  style={{ display: "block", padding: "10px 14px", color: "#374151", textDecoration: "none", fontSize: "0.9rem" }}
                >
                  My Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    color: "#374151",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    borderTop: "1px solid #f3f4f6"
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    borderTop: "1px solid #f3f4f6"
                  }}
                >
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="nav-signin" style={{ fontWeight: "600", color: "#16a34a" }}>
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

export function FlowFrame({ active = "", children }) {
  return (
    <div className="flow-app">
      <FlowHeader active={active} />
      {children}
      <footer className="flow-footer">
        <span>© 2024 agrirent · Built for the people who grow.</span>
        <span>
          <ShieldCheck size={13} /> Secure, farmer-first rentals
        </span>
      </footer>
    </div>
  );
}

export function AuthShell({
  children,
  note,
  visualTitle = "Good things grow when we grow together.",
  active,
}) {
  return (
    <FlowFrame active={active}>
      <main className="auth-layout">
        <section className="auth-art">
          <div className="auth-art-image" />
          <div className="auth-art-shade" />
          <Link href="/" className="auth-art-brand">
            <Sprout size={20} /> agrirent
          </Link>
          <div className="auth-art-copy">
            <span className="flow-eyebrow">GROW WITH agrirent</span>
            <h1>{visualTitle}</h1>
            <p>More access. Less downtime. Better seasons ahead.</p>
            <div className="auth-art-proof">
              <span className="proof-avatars">
                <i>AM</i>
                <i>CM</i>
                <i>RJ</i>
              </span>
              <span>
                Join <b>1,200+</b> farmers already growing with us
              </span>
            </div>
          </div>
          <span className="auth-art-note">
            LOCAL EQUIPMENT. SHARED PROGRESS.
          </span>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-wrap">
            {children}
            <p className="auth-note">
              <LockKeyhole size={13} />
              {note}
            </p>
          </div>
        </section>
      </main>
    </FlowFrame>
  );
}

export function TextField({
  label,
  type = "text",
  placeholder,
  name,
  required = true,
}) {
  return (
    <label className="flow-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

export function MachineCard({ item }) {
  const detailsHref = `/equipment-details?item=${encodeURIComponent(item.name)}`;
  return (
    <article className="flow-machine-card">
      <Link href={detailsHref} className="flow-machine-photo">
        <img src={item.image} alt={`${item.name} in the field`} />
        <span className="flow-available">
          <i /> Available
        </span>
      </Link>
      <div className="flow-machine-info">
        <div className="flow-machine-title">
          <span>
            <b>{item.name}</b>
            <small>{item.category}</small>
          </span>
          <span className="flow-rating">
            <Star size={13} fill="currentColor" /> {item.rating}
          </span>
        </div>
        <p>
          <MapPin size={13} />
          {item.place} <span>·</span> Owner verified
        </p>
        <div className="flow-spec-list">
          {item.specs.map((spec, index) => (
            <span key={`${item.name}-${spec}-${index}`}>{spec}</span>
          ))}
        </div>
        <div className="flow-machine-foot">
          <span>
            <b>{currency(item.rate)}</b>
            <small> / day</small>
          </span>
          <Link href={detailsHref}>
            View details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}