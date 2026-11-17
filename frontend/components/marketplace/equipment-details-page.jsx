"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Sprout, Star, Tractor, Minus, Plus, Truck, CheckCircle2 } from "lucide-react";
import { FlowFrame, currency } from "./shared";
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";

/* Fallback labels, used only for plain-string specs */
const SPEC_LABELS = ["Main feature", "What it can do", "Also included"];

const AVAILABILITY_LABEL = {
  AVAILABLE: "Available",
  RENTED: "Currently rented",
  MAINTENANCE: "In maintenance",
};

/* ================= API HELPERS ================= */

const toList = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.results || [];

const initialsOf = (name) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "AR";

const prettyCondition = (c) =>
  c ? `${c.charAt(0)}${c.slice(1).toLowerCase()}` : "";

/** Maps one backend Equipment record to the shape this page renders */
const toItem = (e, categoryNameByCode, farmerByCode) => {
  const farmer = farmerByCode[e.farmer_code] || {};
  const category = categoryNameByCode[e.category_code] || e.category_code || "";
  const brandModel = [e.brand, e.model].filter(Boolean).join(" ");

  const specs = [
    brandModel && { label: "Brand / Model", value: brandModel },
    e.manufacturing_year && { label: "Year", value: String(e.manufacturing_year) },
    e.condition_type && { label: "Condition", value: prettyCondition(e.condition_type) },
    Number(e.rental_price_per_hour) > 0 && {
      label: "Hourly rate",
      value: currency(e.rental_price_per_hour),
    },
    Number(e.security_deposit) > 0 && {
      label: "Security deposit",
      value: currency(e.security_deposit),
    },
  ].filter(Boolean);

  return {
    code: e.equipment_code,
    name: e.equipment_name || "Equipment",
    category,
    rate: Number(e.rental_price_per_day) || 0,
    image: e.display_equipment_image || "/field-tractor.png",
    place: e.location_address || farmer.farm_name || "Location not listed",
    rating: "New", // backend has no ratings yet
    description:
      e.description ||
      `${e.equipment_name || "This machine"}${category ? ` (${category})` : ""} is available to rent. Contact the owner after booking to arrange delivery or pickup.`,
    specs,
    ownerName: e.farmer_name || farmer.farmer_name || "Verified owner",
    availability: e.availability_status || "AVAILABLE",
  };
};

export default function EquipmentDetails({ itemName, itemCode }) {
  const [days, setDays] = useState(1);
  const [start, setStart] = useState("");
  const [view, setView] = useState(0);
  const rootRef = useRef(null);

  /* ---------- which machine? (props first, then the URL) ---------- */
  const [query, setQuery] = useState({ name: itemName || "", code: itemCode || "" });
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery({
      name: itemName || p.get("item") || "",
      code: itemCode || p.get("code") || "",
    });
    setQueryReady(true);
  }, [itemName, itemCode]);

  /* ---------- backend data ---------- */
  const [raw, setRaw] = useState({ equipment: [], categories: [], farmers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!queryReady) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [equipRes, catRes, farmerRes] = await Promise.all([
          api.get("api/equipment/"),
          api.get("api/equipment_categories/").catch(() => ({ data: [] })),
          api.get("api/farmer_profiles/").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setRaw({
          equipment: toList(equipRes),
          categories: toList(catRes),
          farmers: toList(farmerRes),
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load machine:", err);
        setError("We could not load this machine right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [queryReady, reloadKey]);

  const item = useMemo(() => {
    const categoryNameByCode = {};
    raw.categories.forEach((c) => { categoryNameByCode[c.category_code] = c.category_name; });
    const farmerByCode = {};
    raw.farmers.forEach((f) => { farmerByCode[f.farmer_code] = f; });

    // Only active machines are public
    const active = raw.equipment.filter((e) => Number(e.status) === 1);

    const wantedCode = (query.code || "").trim();
    const wantedName = (query.name || "").trim().toLowerCase();

    const match =
      (wantedCode && active.find((e) => e.equipment_code === wantedCode)) ||
      (wantedName && active.find((e) => (e.equipment_name || "").trim().toLowerCase() === wantedName)) ||
      null;

    return match ? toItem(match, categoryNameByCode, farmerByCode) : null;
  }, [raw, query]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [item]);

  /* ---------- loading ---------- */
  if (loading || !queryReady) {
    return (
      <FlowFrame active="Equipment Details">
        <main className="ent-home">
          <section className="ent-section">
            <div className="ent-empty">
              <span className="ent-empty-icon"><Tractor size={26} /></span>
              <h3>Loading machine…</h3>
              <p>Please wait a moment.</p>
            </div>
          </section>
        </main>
      </FlowFrame>
    );
  }

  /* ---------- error ---------- */
  if (error) {
    return (
      <FlowFrame active="Equipment Details">
        <main className="ent-home">
          <section className="ent-section">
            <div className="ent-empty">
              <span className="ent-empty-icon"><Tractor size={26} /></span>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button type="button" className="ent-btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          </section>
        </main>
      </FlowFrame>
    );
  }

  /* ---------- not found ---------- */
  if (!item) {
    return (
      <FlowFrame active="Equipment Details">
        <main className="ent-home">
          <section className="ent-section">
            <div className="ent-empty">
              <span className="ent-empty-icon"><Tractor size={26} /></span>
              <h3>We could not find this machine</h3>
              <p>It may have been rented out or removed.</p>
              <Link className="ent-btn-primary" href="/equipment">See all machines</Link>
            </div>
          </section>
        </main>
      </FlowFrame>
    );
  }

  const total = item.rate * days;
  // Local date (toISOString would give the UTC date, which can be "yesterday" in India)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const bookHref =
    `/service-booking?item=${encodeURIComponent(item.name)}&code=${encodeURIComponent(item.code)}&days=${days}` +
    (start ? `&start=${start}` : "");

  const isAvailable = item.availability === "AVAILABLE";
  const reviewsText = item.rating === "New" ? "No reviews yet" : "Rated by renters";

  const views = [
    { label: "Photo", node: <img className="detail-main-image ent-zoom" src={item.image} alt={`${item.name} available for rent`} /> },
    { label: "Details", node: <div className="ent-gallery-tile"><Tractor size={54} /><span>Machine details</span></div> },
    { label: "Farm ready", node: <div className="ent-gallery-tile green"><Sprout size={54} /><span>Ready for your farm</span></div> },
  ];

  return (
    <FlowFrame active="Equipment Details">
      <main className="ent-home ent-detail-page" ref={rootRef}>
        <div className="ent-section ent-detail-top">
          <Link className="ent-back" href="/equipment">
            <ArrowLeft size={15} /> Back to all machines
          </Link>
        </div>

        <div className="ent-section ent-detail-layout">
          {/* Gallery */}
          <section className="ent-gallery hero-stagger-1">
            <div className="ent-gallery-main" key={view}>{views[view].node}</div>
            <div className="ent-gallery-thumbs">
              {views.map((v, i) => (
                <button
                  key={v.label}
                  type="button"
                  className={`ent-thumb ${i === view ? "active" : ""}`}
                  onClick={() => setView(i)}
                  aria-label={`Show ${v.label}`}
                  aria-pressed={i === view}
                >
                  {i === 0 ? <img src={item.image} alt="" /> : i === 1 ? <Tractor size={24} /> : <Sprout size={24} />}
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Info + booking */}
          <section className="ent-detail-copy">
            <span className="ent-kicker hero-stagger-1">Checked farm machine</span>
            <div className="ent-detail-title hero-stagger-2">
              <div>
                <h1>{item.name}</h1>
                <p className="ent-detail-meta">
                  <MapPin size={15} /> {item.place}
                  <i />
                  <span className="ent-stars"><Star size={14} fill="currentColor" /> {item.rating}</span>
                  <small>({reviewsText})</small>
                </p>
              </div>
              <span className="ent-available"><i /> {AVAILABILITY_LABEL[item.availability] || "Available"}</span>
            </div>

            <p className="ent-detail-desc hero-stagger-3">{item.description}</p>

            <div className="ent-spec-grid hero-stagger-3">
              {item.specs.map((spec, i) => {
                const isObj = typeof spec === "object" && spec !== null;
                const label = isObj ? spec.label : SPEC_LABELS[i] ?? "Feature";
                const value = isObj ? spec.value : spec;
                return (
                  <div className="ent-spec" key={`${label}-${i}`}>
                    <small>{label}</small>
                    <b>{value}</b>
                  </div>
                );
              })}
            </div>

            <div className="ent-owner hero-stagger-4">
              <span className="ent-author-avatar">{initialsOf(item.ownerName)}</span>
              <span>
                <b>{item.ownerName}</b>
                <small>Verified owner.</small>
              </span>
              <ShieldCheck size={20} />
            </div>

            <div className="ent-book-card hero-stagger-5">
              <div className="ent-book-price">
                <span><b>{currency(item.rate)}</b><small> per day</small></span>
                <span className="ent-stars"><Star size={14} fill="currentColor" /> {item.rating}</span>
              </div>

              <div className="ent-book-row">
                <label htmlFor="start-date">First day</label>
                <input id="start-date" type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} />
              </div>

              <div className="ent-book-row">
                <label>How many days?</label>
                <div className="ent-stepper">
                  <button type="button" aria-label="One day less" onClick={() => setDays(Math.max(1, days - 1))} disabled={days <= 1}><Minus size={16} /></button>
                  <output aria-live="polite">{days} {days === 1 ? "day" : "days"}</output>
                  <button type="button" aria-label="One day more" onClick={() => setDays(Math.min(30, days + 1))}><Plus size={16} /></button>
                </div>
              </div>

              <div className="ent-book-total">
                <span>{currency(item.rate)} × {days} {days === 1 ? "day" : "days"}</span>
                <strong key={total}>{currency(total)}</strong>
              </div>

              <Link className="ent-btn-primary ent-book-btn" href={bookHref}>
                <span>Check dates and book</span><ArrowRight size={16} className="ent-arrow" />
              </Link>
              <ul className="ent-book-notes">
                <li><CheckCircle2 size={14} /> You pay nothing until the owner confirms</li>
                <li><Truck size={14} /> Delivery and pickup can be arranged</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </FlowFrame>
  );
}