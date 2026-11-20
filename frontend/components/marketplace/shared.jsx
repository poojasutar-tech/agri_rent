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
  Tractor,
  Wheat,
  Compass,
} from "lucide-react";
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";

// Populated dynamically from /api/equipment/ (zero static machine data)
export let machines = [];

export const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const pageLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Equipments", href: "/equipment", requiresAuth: true },
  { label: "Contact Us", href: "/contact" },
  // { label: "Farm dashboard", href: "/dashboard" },
];

export function isUserSignedIn() {
  if (typeof window === "undefined") return false;
  const authKeys = [
    "access_token",
    "access",
    "token",
    "authToken",
    "refresh_token",
    "agrirent_token",
    "full_name",
    "user_code",
    "user",
    "currentUser",
    "agrirent_user",
  ];
  const hasStorageAuth = authKeys.some((key) => {
    const localVal = window.localStorage.getItem(key);
    const sessionVal = window.sessionStorage.getItem(key);
    const raw = localVal || sessionVal;
    return Boolean(raw && raw !== "null" && raw !== "undefined");
  });
  const hasCookieAuth =
    typeof document !== "undefined" && document.cookie.includes("is_logged_in=1");
  return hasStorageAuth || hasCookieAuth;
}

export function resolveMediaUrl(rawUrl, fallback = "/field-tractor.png") {
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const baseUrl =
    (api?.defaults?.baseURL || "").replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export function resolveCategoryIcon(title = "") {
  const normalized = String(title).toLowerCase();
  if (normalized.includes("harvest")) return Wheat;
  if (
    normalized.includes("plow") ||
    normalized.includes("seed") ||
    normalized.includes("till") ||
    normalized.includes("rotavator")
  ) {
    return Sprout;
  }
  if (
    normalized.includes("spray") ||
    normalized.includes("tool") ||
    normalized.includes("trailer") ||
    normalized.includes("pump")
  ) {
    return Compass;
  }
  return Tractor;
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function mapEquipmentItem(item, idx = 0) {
  const rawImage =
    item.image_url ||
    item.image ||
    item.photo ||
    item.photo_url ||
    item.thumbnail ||
    item.equipment_image ||
    "";

  const specsArray =
    Array.isArray(item.specs) && item.specs.length > 0
      ? item.specs
      : typeof item.specs === "string" && item.specs.trim()
      ? item.specs.split(",").map((s) => s.trim()).filter(Boolean)
      : ["4WD", "Cabin", "GPS ready"];

  return {
    ...item,
    id: item.id ?? item.equipment_code ?? item.code ?? idx,
    code: item.equipment_code ?? item.code ?? item.id ?? "",
    name: item.name || item.equipment_name || "Farm Machine",
    category: item.category_name || item.category || "Farm Equipment",
    place: item.location || item.place || item.city || "",
    rate: item.daily_rate ?? item.rate ?? 0,
    image: rawImage ? resolveMediaUrl(rawImage, "/field-tractor.png") : "/field-tractor.png",
    rating: item.rating || "4.9",
    description: item.description || "",
    specs: specsArray,
    availability: item.availability || item.status || "AVAILABLE",
  };
}

export async function fetchEquipmentList(limit = null) {
  const res = await api.get("api/equipment/");
  const list = normalizeCollection(res?.data).map((item, idx) =>
    mapEquipmentItem(item, idx)
  );

  // Sync dynamic list to exported reference
  machines = list;

  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export async function fetchEquipmentCategories(limit = null) {
  const res = await api.get("api/equipment_categories/");
  const list = normalizeCollection(res?.data);
  const sliced = typeof limit === "number" ? list.slice(0, limit) : list;

  return sliced.map((cat, idx) => {
    const title =
      cat.title || cat.name || cat.category_name || `Category ${idx + 1}`;
    const rawCount =
      cat.count ??
      cat.available_count ??
      cat.equipment_count ??
      cat.total_machines;

    const countText =
      typeof rawCount === "number"
        ? `${rawCount} available`
        : rawCount || "Available now";

    const rawCatImage = cat.image_url || cat.image || cat.icon_url || "";

    return {
      ...cat,
      id: cat.id ?? cat.category_code ?? cat.code ?? idx,
      category_code: cat.category_code ?? cat.code ?? "",
      title,
      detail:
        cat.detail ||
        cat.description ||
        "Reliable farm equipment ready for field work",
      icon: resolveCategoryIcon(title),
      count: countText,
      image: rawCatImage ? resolveMediaUrl(rawCatImage, "/field-tractor.png") : "/field-tractor.png",
    };
  });
}

export async function fetchMachineByCodeOrName(identifier) {
  const list = machines.length > 0 ? machines : await fetchEquipmentList();
  if (!identifier) return list[0] || null;
  return (
    list.find(
      (machine) =>
        String(machine.code) === String(identifier) ||
        String(machine.id) === String(identifier) ||
        machine.name === identifier
    ) ||
    list[0] ||
    null
  );
}

export function findMachineByName(name) {
  return machines.find((machine) => machine.name === name) || machines[0] || null;
}

export function FlowHeader({ active }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userCode, setUserCode] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setUserName("");
    setUserCode("");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    try {
      await api.delete(`api/auth/delete/${userCode}/`);
      alert("Account deleted successfully.");
      handleLogout();
    } catch (err) {
      alert("Failed to delete account.");
    }
  };

  const handleNavClick = (e, link) => {
    setMenuOpen(false);
    if (link.requiresAuth && !isUserSignedIn()) {
      e.preventDefault();
      router.push(`/login?next=${encodeURIComponent(link.href)}`);
    }
  };

  return (
    <header className="flow-header">
      <Link href="/" className="flow-brand">
        <span>
          <Sprout size={20} strokeWidth={2.0} />
        </span>
        <span className="flow-brand-text">
          agri<span>rent</span>
        </span>
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
            onClick={(e) => handleNavClick(e, link)}
          >
            {link.label}
          </Link>
        ))}

        {/* User Account / Profile Dropdown */}
        {mounted && userName ? (
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
                fontWeight: "500",
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
                  border: "1px solid #e5e7eb",
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
                    borderTop: "1px solid #f3f4f6",
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
                    borderTop: "1px solid #f3f4f6",
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
  const router = useRouter();
  const detailsHref = `/equipment-details?code=${encodeURIComponent(item.code || item.id || item.name)}`;
  const available = item.availability === "AVAILABLE";
  const availabilityLabel =
    item.availability === "MAINTENANCE"
      ? "In maintenance"
      : available
      ? "Available"
      : "Occupied";

  const handleProtectedCardClick = (e) => {
    if (!isUserSignedIn()) {
      e.preventDefault();
      router.push(`/login?next=${encodeURIComponent(rawDetailsHrefOr(detailsHref))}`);
    }
  };

  const rawDetailsHrefOr = (href) => href;

  return (
    <article className="flow-machine-card">
      <Link href={detailsHref} onClick={handleProtectedCardClick} className="flow-machine-photo">
        <img
          src={resolveMediaUrl(item.image, "/field-tractor.png")}
          alt={`${item.name} in the field`}
        />
        <span className={`flow-available ${available ? "" : "occupied"}`}>
          <i /> {availabilityLabel}
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
          {(item.specs || []).map((spec, index) => (
            <span key={`${item.name}-${spec}-${index}`}>{spec}</span>
          ))}
        </div>
        <div className="flow-machine-foot">
          <span>
            <b>{currency(item.rate)}</b>
            <small> / day</small>
          </span>
          <Link href={detailsHref} onClick={handleProtectedCardClick}>
            View details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}