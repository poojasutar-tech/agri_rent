"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Wheat, CheckCircle2, MapPin, Search, ShieldCheck,
  Sprout, Tractor, Compass, Clock, Award, PhoneCall, Truck, Wrench,
  Wallet, Users, Star, Loader2
} from "lucide-react";
import { FlowFrame } from "./shared";
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";

const REVIEW_MS = 5000;

const steps = [
  { title: "Find a machine near you", body: "Choose your area and see tractors, plows and harvesters nearby." },
  { title: "Check the price and photos", body: "See the daily price, real photos and reviews from other farmers." },
  { title: "Pick your dates", body: "Book the days you need. We bring the machine to your farm." },
];

const partners = [
  { name: "North Valley Farms", region: "Yolo and Colusa", acres: "42,000+ acres" },
  { name: "Miller Family Growers", region: "Napa and Sonoma", acres: "8,500+ acres" },
  { name: "Riverbend Grain Co-op", region: "Sacramento Delta", acres: "65,000+ acres" },
  { name: "Green Acres Collective", region: "San Joaquin", acres: "31,000+ acres" },
  { name: "Sierra Foothill Farms", region: "Placer and Sutter", acres: "19,000+ acres" },
];

function resolveCategoryIcon(title = "") {
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

function detectImageMimeFromBase64(b64 = "") {
  const clean = b64.trim();
  if (clean.startsWith("/9j/")) return "image/jpeg";
  if (clean.startsWith("iVBORw0KGgo")) return "image/png";
  if (clean.startsWith("R0lGODlh") || clean.startsWith("R0lGODdh")) return "image/gif";
  if (clean.startsWith("UklGR")) return "image/webp";
  if (clean.startsWith("PHN2Zy") || clean.startsWith("PD94bWw")) return "image/svg+xml";
  return "image/jpeg";
}

function bytesToBase64(bytes) {
  if (!Array.isArray(bytes) || bytes.length === 0 || typeof window === "undefined") {
    return "";
  }
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.slice(i, i + chunkSize);
    for (let j = 0; j < slice.length; j += 1) {
      binary += String.fromCharCode(Number(slice[j]) & 0xff);
    }
  }
  return window.btoa(binary);
}

function resolveCategoryImage(cat = {}) {
  const raw =
    cat.category_image ??
    cat.category_image_base64 ??
    cat.display_category_image ??
    cat.image ??
    "";
  if (!raw) return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "null" || trimmed === "None") return "";
    if (
      trimmed.startsWith("data:image/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("blob:")
    ) {
      return trimmed;
    }
    if (trimmed.startsWith("/")) {
      const base =
        (api?.defaults?.baseURL || "").replace(/\/+$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "");
      return base ? `${base}${trimmed}` : trimmed;
    }

    // Handle Python byte-string representation like b'\x89PNG...'
    if (
      (trimmed.startsWith("b'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('b"') && trimmed.endsWith('"'))
    ) {
      const inner = trimmed.slice(2, -1);
      if (typeof window !== "undefined") {
        try {
          const decoded = inner.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          );
          const b64 = window.btoa(decoded);
          const mime = detectImageMimeFromBase64(b64);
          return `data:${mime};base64,${b64}`;
        } catch {
          // Fall through to standard base64 handling
        }
      }
    }

    const cleanBase64 = trimmed.replace(/\s+/g, "");
    const mime = detectImageMimeFromBase64(cleanBase64);
    return `data:${mime};base64,${cleanBase64}`;
  }

  if (typeof raw === "object") {
    const bytes = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.data)
      ? raw.data
      : null;
    if (bytes && bytes.length > 0) {
      const b64 = bytesToBase64(bytes);
      if (b64) {
        const mime = detectImageMimeFromBase64(b64);
        return `data:${mime};base64,${b64}`;
      }
    }
  }

  return "";
}

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function isUserSignedIn() {
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

function useHomeMotion() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        root.style.setProperty("--scroll-y", `${Math.min(window.scrollY, 700)}px`);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return rootRef;
}

function useSpotlightTilt() {
  const onMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / (r.height / 2)) * -2.5;
    const ry = ((x - r.width / 2) / (r.width / 2)) * 2.5;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
    card.style.setProperty("--tilt", `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`);
  }, []);
  const onMouseLeave = useCallback((e) => {
    e.currentTarget.style.setProperty("--tilt", "perspective(1000px) rotateX(0) rotateY(0) translateY(0)");
  }, []);
  return { onMouseMove, onMouseLeave };
}

export default function MarketplaceHome() {
  const router = useRouter();
  const mainRef = useHomeMotion();
  const tilt = useSpotlightTilt();

  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [brokenImages, setBrokenImages] = useState({});

  // Geolocation state for customer's current location
  const [userLocation, setUserLocation] = useState(null); // { latitude, longitude, accuracy, label }
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | locating | granted | denied | error | unsupported
  const [geoError, setGeoError] = useState("");

  // Dynamic Categories state from Backend (strictly 3 on Home)
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Dynamic Reviews state from Backend
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const updateGridCols = () => {
      setIsMobileGrid(window.innerWidth < 768);
    };
    updateGridCols();
    window.addEventListener("resize", updateGridCols);
    return () => window.removeEventListener("resize", updateGridCols);
  }, []);

  const handleRequestLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }

    setGeoStatus("locating");
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let resolvedLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          const geoRes = await api.get("api/reverse-geocode/", {
            params: { lat: latitude, lng: longitude },
          });
          const dynamicName =
            geoRes?.data?.place ||
            geoRes?.data?.city ||
            geoRes?.data?.address ||
            geoRes?.data?.label;
          if (dynamicName) {
            resolvedLabel = String(dynamicName);
          }
        } catch {
          // Keep coordinate label if reverse geocode endpoint is not configured
        }

        setUserLocation({
          latitude,
          longitude,
          accuracy,
          label: resolvedLabel,
        });
        setGeoStatus("granted");
        setGeoError("");
      },
      (err) => {
        setGeoError("");
        switch (err?.code) {
          case err?.PERMISSION_DENIED:
            setGeoStatus("denied");
            setGeoError("Location permission was denied.");
            break;
          case err?.POSITION_UNAVAILABLE:
            setGeoStatus("error");
            setGeoError("Current location is unavailable.");
            break;
          case err?.TIMEOUT:
            setGeoStatus("error");
            setGeoError("Location request timed out.");
            break;
          default:
            setGeoStatus("error");
            setGeoError("Could not obtain your current location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const buildLocationTargetPath = useCallback(
    (basePath = "/equipment") => {
      if (!userLocation) return basePath;
      const sep = basePath.includes("?") ? "&" : "?";
      return `${basePath}${sep}lat=${encodeURIComponent(userLocation.latitude)}&lng=${encodeURIComponent(userLocation.longitude)}`;
    },
    [userLocation]
  );

  const handleSeeMoreNavigation = useCallback(
    (e, targetPath = "/equipment") => {
      e.preventDefault();
      const resolvedPath = buildLocationTargetPath(targetPath);
      if (isUserSignedIn()) {
        router.push(resolvedPath);
      } else {
        router.push(`/login?next=${encodeURIComponent(resolvedPath)}`);
      }
    },
    [router, buildLocationTargetPath]
  );

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("api/equipment_categories/");
        const rawData = res?.data;
        const list = normalizeListResponse(rawData);

        const filtered = list.filter((cat) =>
          cat.status === undefined || cat.status === null ? true : Number(cat.status) === 1
        );

        const sorted = [...filtered].sort((a, b) => {
          const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

        const mappedCategories = sorted.slice(0, 3).map((cat, idx) => {
          const title =
            cat.category_name || cat.title || cat.name || `Category ${idx + 1}`;
          const rawCount =
            cat.count ??
            cat.available_count ??
            cat.equipment_count ??
            cat.total_machines;
          const countText =
            typeof rawCount === "number"
              ? `${rawCount} available`
              : rawCount || "";

          return {
            ...cat,
            id: cat.category_code || cat.id || cat.code || idx,
            category_code: cat.category_code || cat.code || "",
            category_name: title,
            title,
            detail:
              cat.description ||
              cat.detail ||
              "Reliable farm equipment ready for field work",
            imageSrc: resolveCategoryImage(cat),
            icon: resolveCategoryIcon(title),
            count: countText,
          };
        });

        setBrokenImages({});
        setCategoriesList(mappedCategories);
      } catch (err) {
        console.error("Failed to fetch equipment categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }

    async function fetchReviews() {
      try {
        const res = await api.get("api/reviews/");
        const rawData = res?.data;
        const list = normalizeListResponse(rawData);
        const mappedReviews = list
          .filter((rev) => typeof rev.review_comment === "string" && rev.review_comment.trim())
          .map((rev, idx) => {
            const authorName = rev.farmer_name || `Farmer ${idx + 1}`;
            return {
              ...rev,
              id: rev.review_code || idx,
              quote: rev.review_comment.trim(),
              name: authorName,
              role: "Farmer",
              farm: rev.farm_name || "Local Farm",
              metric: rev.rating ? `${rev.rating}★ rating` : "Verified rental",
            };
          });
        setReviewsList(mappedReviews);
        setActive(0);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    fetchCategories();
    fetchReviews();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const card = track?.querySelectorAll(".ent-review-card")[active];
    if (card && track) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  }, [active, reviewsList.length]);

  useEffect(() => {
    if (paused || reviewsList.length <= 1) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % reviewsList.length), REVIEW_MS);
    return () => clearTimeout(t);
  }, [active, paused, reviewsList.length]);

  const step = (dir) => {
    if (reviewsList.length === 0) return;
    setActive((i) =>
      dir === "next" ? (i + 1) % reviewsList.length : (i - 1 + reviewsList.length) % reviewsList.length
    );
  };

  const farmAreaText = userLocation?.label || "Tap to use your current location";

  return (
    <FlowFrame active="Home">
      <main className="ent-home" ref={mainRef}>
        {/* 1. HERO */}
        <section className="ent-hero">
          <div className="ent-hero-media">
            <img src="/field-tractor.png" alt="Tractor working in a green field" className="ent-hero-img" />
            <div className="ent-hero-scrim" />
          </div>

          <div className="ent-hero-container">
            <div className="ent-hero-copy">
              <span className="ent-eyebrow-badge hero-stagger-1">
                <span className="ent-live-dot" /> Made for farmers
              </span>
              <h1 className="ent-hero-title hero-stagger-2">
                Rent the farm machine you need. <span>Pay only for the days you use it.</span>
              </h1>
              <p className="ent-hero-lead hero-stagger-3">
                Tractors, harvesters, plows and sprayers from trusted farmers near you.
                Clear daily prices, full insurance, and delivery to your farm.
              </p>
              <div className="ent-hero-actions hero-stagger-4">
                <Link className="ent-btn-primary" href="/equipment" onClick={(e) => handleSeeMoreNavigation(e, "/equipment")}>
                  <span>See available machines</span>
                  <ArrowRight size={16} className="ent-arrow" />
                </Link>
                <Link className="ent-btn-ghost" href="#why-rent">Why rent with us</Link>
              </div>
              <div className="ent-hero-trust hero-stagger-5">
                <div><ShieldCheck size={16} /> Insured and safe</div>
                <div><Truck size={16} /> Delivered to your farm</div>
                <div><Award size={16} /> Checked before every job</div>
              </div>
            </div>

            <aside className="ent-hero-card hero-stagger-5" aria-label="Today near you">
              <div className="ent-hero-card-top">
                <span className="ent-live-dot" /> Available today {userLocation?.label ? `near ${userLocation.label}` : "near you"}
              </div>
              <strong>38 machines</strong>
              <p>ready to book this week</p>
              <div className="ent-hero-card-row"><Tractor size={15} /> Tractors from $95 a day</div>
              <div className="ent-hero-card-row"><Wheat size={15} /> Harvesters from $210 a day</div>
            </aside>
          </div>
        </section>

        {/* 2. SEARCH BAR */}
        <section className="ent-command-bar" data-reveal>
          <div className="ent-command-field">
            <span className="ent-command-icon"><MapPin size={18} /></span>
            <div>
              <label>Where is your farm?</label>
              <strong>{farmAreaText}</strong>
              {geoStatus === "locating" && <small className="ent-mini-label">Detecting location…</small>}
              {geoError && <small className="ent-mini-label">{geoError}</small>}
            </div>
            <button
              type="button"
              className="ent-quick-tag"
              onClick={handleRequestLocation}
              disabled={geoStatus === "locating"}
            >
              {geoStatus === "locating"
                ? "Locating…"
                : userLocation
                  ? "Update location"
                  : "Use my location"}
            </button>
          </div>
          <div className="ent-command-sep" />
          <div className="ent-command-field">
            <span className="ent-command-icon"><Wrench size={18} /></span>
            <div><label>What do you need?</label><strong>Tractor, plow, harvester…</strong></div>
          </div>
          <div className="ent-command-sep" />
          <div className="ent-command-field">
            <span className="ent-command-icon"><Clock size={18} /></span>
            <div><label>When do you need it?</label><strong>Today or this week</strong></div>
          </div>
          <Link className="ent-btn-primary ent-command-submit" href="/equipment" onClick={(e) => handleSeeMoreNavigation(e, "/equipment")}>
            <Search size={16} /><span>Find machines</span>
          </Link>
        </section>

        {/* 3. EQUIPMENT CATEGORIES (DYNAMIC API FETCH - FULL WIDTH DB IMAGE, NO AVAILABLE BADGE) */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Choose by work</span>
              <h2>What work do you need to do?</h2>
              <p>From preparing the soil to cutting the crop, find every tool in one place.</p>
            </div>
            <Link
              href="/equipment"
              onClick={(e) => handleSeeMoreNavigation(e, "/equipment")}
              className="ent-link-action"
            >
              <span>See more</span><ArrowRight size={15} className="ent-arrow" />
            </Link>
          </div>

          {loadingCategories ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0", color: "#16a34a" }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : categoriesList.length === 0 ? (
            <p style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
              No equipment categories available at the moment.
            </p>
          ) : (
            <div
              className="ent-cat-grid"
              style={{
                display: "grid",
                gridTemplateColumns: isMobileGrid
                  ? "repeat(1, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              {categoriesList.map((cat) => {
                const cardKey = cat.id || cat.title;
                const showDbImage = Boolean(cat.imageSrc) && !brokenImages[cardKey];
                const targetUrl = cat.category_code
                  ? `/equipment?category=${encodeURIComponent(cat.category_code)}`
                  : "/equipment";
                return (
                  <Link
                    href={targetUrl}
                    onClick={(e) => handleSeeMoreNavigation(e, targetUrl)}
                    key={cardKey}
                    className="ent-cat-card"
                    style={{
                      width: "100%",
                      maxWidth: "none",
                      overflow: "hidden",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                    {...tilt}
                  >
                    {showDbImage ? (
                      <div
                        className="ent-cat-media"
                        style={{
                          width: "100%",
                          height: "200px",
                          overflow: "hidden",
                          backgroundColor: "#f1f5f9",
                        }}
                      >
                        <img
                          src={cat.imageSrc}
                          alt={cat.title}
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [cardKey]: true }))
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    ) : null}

                    <div
                      style={{
                        padding: "20px 22px 22px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <h3>{cat.title}</h3>
                      <p style={{ flex: 1 }}>{cat.detail}</p>
                      <div className="ent-cat-foot">
                        <span>Browse</span>
                        <ArrowRight size={15} className="ent-arrow" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. WHY RENT */}
        <section className="ent-section" id="why-rent" data-reveal aria-labelledby="why-heading">
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Save money</span>
              <h2 id="why-heading">Get the work done without buying a costly machine</h2>
              <p>No bank loan, no repair bills, no shed space. Pay only for the days you work.</p>
            </div>
          </div>

          <div className="ent-bento-grid">
            <article className="ent-bento-card ent-bento-lead" {...tilt}>
              <div>
                <div className="ent-bento-tag"><Wallet size={15} /> Renting costs less</div>
                <h3>Why pay for a machine you use only 2 weeks a year?</h3>
                <p>
                  Buying locks up your savings and adds loans and repairs. On AgriRent you
                  borrow the exact machine from a neighbor and pay only for your working days.
                </p>
              </div>
              <div className="ent-econ-bars">
                <div className="econ-row">
                  <div className="econ-label"><span>Buying and repairing yourself</span><b>$168 per hour</b></div>
                  <div className="econ-track"><div className="econ-fill muted" style={{ width: "100%" }} /></div>
                </div>
                <div className="econ-row">
                  <div className="econ-label"><span>Renting on AgriRent</span><b className="text-emerald">$104 per hour · save 38%</b></div>
                  <div className="econ-track"><div className="econ-fill emerald" style={{ width: "62%" }} /></div>
                </div>
              </div>
            </article>

            <article className="ent-bento-card ent-bento-kpi" {...tilt}>
              <span className="ent-kpi-label">Money saved a year</span>
              <div className="ent-kpi-value">$48,500+</div>
              <p>Average saving for farmers who rent instead of buying extra tools.</p>
              <div className="ent-kpi-foot"><CheckCircle2 size={14} /> No loans, no storage</div>
            </article>

            <article className="ent-bento-card ent-bento-kpi" {...tilt}>
              <span className="ent-kpi-label">Machines in good condition</span>
              <div className="ent-kpi-value">99.4%</div>
              <p>Oil, tires and brakes are checked before a machine comes to your farm.</p>
              <div className="ent-kpi-foot"><ShieldCheck size={14} /> Insurance included</div>
            </article>

            <article className="ent-bento-card ent-bento-wide" {...tilt}>
              <div className="ent-wide-split">
                <div>
                  <span className="ent-kpi-label">Own a machine?</span>
                  <h4>Earn money when your machine is not in use</h4>
                  <p>Rent your tractor, plow or sprayer to nearby farmers and earn extra income every season.</p>
                </div>
                <Link href="/equipment" onClick={(e) => handleSeeMoreNavigation(e, "/equipment")} className="ent-btn-secondary">
                  <span>List your machine</span><ArrowRight size={15} className="ent-arrow" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* 5. HOW IT WORKS */}
        <section className="ent-section ent-workflow-wrap" id="booking" data-reveal>
          <div className="ent-workflow-grid">
            <div className="ent-workflow-intro">
              <span className="ent-kicker">Simple and quick</span>
              <h2>Rent a machine in 3 steps</h2>
              <p>No difficult paperwork. Pick a machine, choose your dates, and start working.</p>
              <Link className="ent-btn-primary" href="/equipment" onClick={(e) => handleSeeMoreNavigation(e, "/equipment")}>
                <span>Start now</span><ArrowRight size={15} className="ent-arrow" />
              </Link>
            </div>
            <ol className="ent-steps-stack">
              {steps.map((s, i) => (
                <li key={s.title} className="ent-step-card" {...tilt}>
                  <div className="ent-step-num">{i + 1}</div>
                  <div className="ent-step-body"><h3>{s.title}</h3><p>{s.body}</p></div>
                  <ArrowRight size={16} className="ent-step-arrow" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. REVIEWS (DYNAMIC API FETCH) */}
        <section
          className="ent-section"
          id="reviews"
          data-reveal
          aria-labelledby="reviews-heading"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Farmer stories</span>
              <h2 id="reviews-heading">What other farmers say</h2>
              <p>Real words from farmers who rent and share machines.</p>
            </div>
            <div className="ent-rail-controls">
              <div className="ent-circular-timer" aria-hidden="true">
                <svg viewBox="0 0 36 36" className="ent-timer-svg">
                  <circle className="ent-timer-bg" cx="18" cy="18" r="15" />
                  <circle
                    key={`${active}-${paused}`}
                    className={`ent-timer-ring ${paused ? "paused" : "running"}`}
                    style={{ "--timer": `${REVIEW_MS}ms` }}
                    cx="18" cy="18" r="15"
                  />
                </svg>
                <span className="ent-timer-count">
                  {reviewsList.length > 0 ? `${active + 1}/${reviewsList.length}` : "0/0"}
                </span>
              </div>
              <button type="button" className="ent-rail-btn" onClick={() => step("prev")} aria-label="Previous review" disabled={reviewsList.length === 0}>
                <ArrowLeft size={16} />
              </button>
              <button type="button" className="ent-rail-btn" onClick={() => step("next")} aria-label="Next review" disabled={reviewsList.length === 0}>
                <ArrowRight size={16} />
              </button>
              <Link href="/rating-review" className="ent-link-action">
                <span>See more</span><ArrowRight size={14} className="ent-arrow" />
              </Link>
            </div>
          </div>

          {loadingReviews ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0", color: "#16a34a" }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : reviewsList.length === 0 ? (
            <p style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>No reviews available yet.</p>
          ) : (
            <>
              <div className="ent-review-track" ref={trackRef}>
                {reviewsList.map((r, i) => (
                  <article
                    key={r.id ?? `${r.name}-${i}`}
                    className={`ent-review-card ${i === active ? "is-active-review" : ""}`}
                    onClick={() => setActive(i)}
                  >
                    <div className="ent-review-top">
                      <span className="ent-review-badge"><CheckCircle2 size={13} /> Verified farmer</span>
                      <span className="ent-review-stars" aria-label="5 out of 5 stars">
                        {[0, 1, 2, 3, 4].map((n) => <Star key={n} size={13} fill="currentColor" />)}
                      </span>
                    </div>
                    <blockquote>“{r.quote}”</blockquote>
                    <div className="ent-review-author">
                      <div className="ent-author-avatar">
                        {String(r.name)
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <strong>{r.name}</strong>
                        <span>{r.role}, {r.farm}</span>
                      </div>
                      <em className="ent-review-metric">{r.metric}</em>
                    </div>
                  </article>
                ))}
              </div>

              <div className="ent-rail-progress-wrap">
                <div className="ent-circular-dots" role="tablist" aria-label="Choose a review">
                  {reviewsList.map((r, i) => (
                    <button
                      key={r.id ?? `${r.name}-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-label={`Show review from ${r.name}`}
                      className={`ent-dot-btn ${i === active ? "active" : ""}`}
                      onClick={() => setActive(i)}
                    />
                  ))}
                </div>
                <span className="ent-rail-hint">{paused ? "Paused while you read" : "Changes every 5 seconds"}</span>
              </div>
            </>
          )}
        </section>

        {/* 7. NETWORK */}
        <section className="ent-section" data-reveal aria-labelledby="network-heading">
          <div className="ent-network-panel">
            <div className="ent-network-head">
              <div>
                <span className="ent-kicker">Growing together</span>
                <h2 id="network-heading">Trusted by family farms and farm groups</h2>
              </div>
              <p>Small plot or big farm, sharing tools with neighbors helps everyone finish on time.</p>
            </div>
            <div className="ent-partner-grid">
              {partners.map((p) => (
                <div className="ent-partner-tile" key={p.name}>
                  <div className="ent-partner-mark"><Users size={16} /></div>
                  <div><strong>{p.name}</strong><span>{p.region}, {p.acres}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CONTACT */}
        <section className="ent-section" id="contact" data-reveal>
          <div className="ent-cta-banner">
            <div className="ent-cta-copy">
              <h2>Not sure which machine you need? Call us.</h2>
              <p>Our team will help you choose the right machine for your crop and send it to your farm.</p>
            </div>
            <div className="ent-cta-actions">
              <a className="ent-btn-light" href="mailto:hello@agrirent.farm">
                <span>Send us a message</span><ArrowRight size={16} className="ent-arrow" />
              </a>
              <a className="ent-btn-dark-outline" href="tel:+18005550124">
                <PhoneCall size={15} /><span>Call (800) 555-0124</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </FlowFrame>
  );
}