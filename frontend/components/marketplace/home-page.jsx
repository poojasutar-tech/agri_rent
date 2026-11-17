"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Wheat, CheckCircle2, MapPin, Search, ShieldCheck,
  Sprout, Tractor, Compass, Clock, Award, PhoneCall, Truck, Wrench,
  Wallet, Users, Star, Loader2
} from "lucide-react";
import { FlowFrame, MachineCard } from "./shared";

const REVIEW_MS = 5000;

const reviews = [
  { quote: "We needed a plow and a planter for one week. Both came on time, worked well, and saved us a lot of money.", name: "Morgan Reynolds", role: "Crop farmer", farm: "Yolo County", metric: "No delays" },
  { quote: "Every machine arrived clean, oiled and ready for the field. Harvest days are much easier for our family now.", name: "Jamie Lindqvist", role: "Family farmer", farm: "Woodland", metric: "Saved $52,000" },
  { quote: "Renting out our harvester in quiet weeks paid for our winter repair bill. Payments are safe and the neighbors are good.", name: "Casey Thornton", role: "Grain farmer", farm: "Davis", metric: "Trusted owner" },
  { quote: "Fair daily prices, clear photos, and helpful people on the phone when we need them. Very easy to use.", name: "Elena Vance-Kerr", role: "Farm owner", farm: "Sierra Valley", metric: "14 rentals done" },
  { quote: "Why leave costly tools in the shed all year? We rent what we need from farmers down the road.", name: "Marcus Holloway", role: "Orchard farmer", farm: "Riverbend Farms", metric: "Booked in 10 min" },
];

const categories = [
  { title: "Tractors", detail: "Small and big tractors for pulling and heavy work", icon: Tractor, count: "184 available" },
  { title: "Harvesters", detail: "Cut and collect your crop quickly", icon: Wheat, count: "62 available" },
  { title: "Plows and seeders", detail: "Plows, tillers and seed planters for sowing on time", icon: Sprout, count: "96 available" },
  { title: "Sprayers and tools", detail: "Sprayers, water tanks, trailers and grass cutters", icon: Compass, count: "86 available" },
];

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
  const mainRef = useHomeMotion();
  const tilt = useSpotlightTilt();

  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Dynamic Equipment state from Django Backend
  const [machinesList, setMachinesList] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/equipment/");
        if (res.ok) {
          const data = await res.json();
          // Map backend fields securely to your card component requirements
          const mappedData = data.map((item) => ({
            name: item.name || item.equipment_name || "Farm Machine",
            category: item.category_name || item.category || "Tractor · 130 HP",
            place: item.location || item.place || "Davis, CA",
            rate: item.daily_rate || item.rate || 500,
            image: item.image_url || item.image || "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=900&q=85",
            rating: item.rating || "4.9",
            description: item.description || "",
            specs: item.specs || ["4WD", "Cabin", "GPS ready"]
          }));
          setMachinesList(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch equipment list:", err);
      } finally {
        setLoadingMachines(false);
      }
    }
    fetchEquipment();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const card = track?.querySelectorAll(".ent-review-card")[active];
    if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % reviews.length), REVIEW_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  const step = (dir) =>
    setActive((i) => (dir === "next" ? (i + 1) % reviews.length : (i - 1 + reviews.length) % reviews.length));

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
                <Link className="ent-btn-primary" href="/equipment">
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
                <span className="ent-live-dot" /> Available today near Davis
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
            <div><label>Where is your farm?</label><strong>Davis and nearby villages</strong></div>
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
          <Link className="ent-btn-primary ent-command-submit" href="/equipment">
            <Search size={16} /><span>Find machines</span>
          </Link>
        </section>

        {/* 3. POPULAR MACHINES (DYNAMIC API FETCH) */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Ready to work</span>
              <h2>Popular machines near your farm</h2>
              <p>Clean, strong machines from local owners you can trust.</p>
            </div>
            <Link href="/equipment" className="ent-link-action">
              <span>See all machines</span><ArrowRight size={15} className="ent-arrow" />
            </Link>
          </div>

          {loadingMachines ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "#16a34a" }}>
              <Loader2 className="animate-spin" size={36} />
            </div>
          ) : machinesList.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>No equipment available at the moment.</p>
          ) : (
            <div className="flow-machine-grid ent-machine-wrapper">
              {machinesList.map((m, i) => (
                <div key={m.name || i} className="ent-card-slot" style={{ "--stagger": `${i * 75}ms` }} {...tilt}>
                  <MachineCard item={m} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. CATEGORIES */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Choose by work</span>
              <h2>What work do you need to do?</h2>
              <p>From preparing the soil to cutting the crop, find every tool in one place.</p>
            </div>
          </div>
          <div className="ent-cat-grid">
            {categories.map(({ title, detail, icon: Icon, count }) => (
              <Link href="/equipment" key={title} className="ent-cat-card" {...tilt}>
                <div className="ent-cat-top">
                  <span className="ent-cat-icon"><Icon size={22} /></span>
                  <span className="ent-cat-count">{count}</span>
                </div>
                <h3>{title}</h3>
                <p>{detail}</p>
                <div className="ent-cat-foot"><span>Browse</span><ArrowRight size={15} className="ent-arrow" /></div>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. WHY RENT */}
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
                <Link href="/equipment" className="ent-btn-secondary">
                  <span>List your machine</span><ArrowRight size={15} className="ent-arrow" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* 6. HOW IT WORKS */}
        <section className="ent-section ent-workflow-wrap" id="booking" data-reveal>
          <div className="ent-workflow-grid">
            <div className="ent-workflow-intro">
              <span className="ent-kicker">Simple and quick</span>
              <h2>Rent a machine in 3 steps</h2>
              <p>No difficult paperwork. Pick a machine, choose your dates, and start working.</p>
              <Link className="ent-btn-primary" href="/equipment">
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

        {/* 7. REVIEWS */}
        <section
          className="ent-section"
          id="reviews"
          data-reveal
          aria-labelledby="reviews-heading"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
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
                <span className="ent-timer-count">{active + 1}/{reviews.length}</span>
              </div>
              <button type="button" className="ent-rail-btn" onClick={() => step("prev")} aria-label="Previous review"><ArrowLeft size={16} /></button>
              <button type="button" className="ent-rail-btn" onClick={() => step("next")} aria-label="Next review"><ArrowRight size={16} /></button>
              <Link href="/rating-review" className="ent-link-action">
                <span>All reviews</span><ArrowRight size={14} className="ent-arrow" />
              </Link>
            </div>
          </div>

          <div className="ent-review-track" ref={trackRef}>
            {reviews.map((r, i) => (
              <article
                key={r.name}
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
                  <div className="ent-author-avatar">{r.name.split(" ").map((n) => n[0]).join("")}</div>
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
              {reviews.map((r, i) => (
                <button
                  key={r.name}
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
        </section>

        {/* 8. NETWORK */}
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

        {/* 9. CONTACT */}
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