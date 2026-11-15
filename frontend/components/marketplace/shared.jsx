"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  MapPin,
  Menu,
  ShieldCheck,
  Sprout,
  Star,
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
  { label: "Sign in", href: "/login" },
  // { label: "Sign up", href: "/registration", className: "nav-register" },
  // { label: "Get started", href: "/equipment", className: "nav-get-started" },
  { label: "Farm dashboard", href: "/dashboard" },
];

export function findMachineByName(name) {
  return machines.find((machine) => machine.name === name) || machines[0];
}

export function FlowHeader({ active }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
          {item.specs.map((spec) => (
            <span key={spec}>{spec}</span>
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
