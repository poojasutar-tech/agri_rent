"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays, MapPin, Search, ShieldCheck, Truck, Wrench, X, Tractor, Wheat,
  ChevronDown, ArrowRight, PhoneCall, CheckCircle2, FileCheck2, Fuel, LifeBuoy, Clock, Users,
} from "lucide-react";
import { FlowFrame, MachineCard, machines } from "./shared";

const CATEGORIES = ["All equipment", "Tractor", "Harvester"];

const SORTS = [
  { id: "best", label: "Best match" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "rating", label: "Best rated" },
];

const QUICK_SEARCHES = ["Tractor", "Harvester", "Plow", "Sprayer", "Seeder", "Trailer"];

const INCLUDED = [
  { icon: ShieldCheck, title: "Insurance", body: "Every rental is covered, so one bad day does not cost you your savings." },
  { icon: FileCheck2, title: "Checked before it leaves", body: "Oil, tires, brakes and lights are checked before each job." },
  { icon: Fuel, title: "Clear fuel rule", body: "Return it with the same fuel level, or the owner adds a fair fuel charge." },
  { icon: LifeBuoy, title: "Help if it breaks", body: "Call us any time. We fix the problem or send another machine." },
];

const RENT_STEPS = [
  { icon: Search, title: "Pick a machine", body: "Use the search or the buttons above. Check the photos and daily price." },
  { icon: CalendarDays, title: "Choose your days", body: "Pick the first day and how many days. You see the full price right away." },
  { icon: Truck, title: "Get it on your farm", body: "The owner confirms, and the machine is delivered or ready for pickup." },
];

const FAQS = [
  { q: "How far away can a machine be?", a: "We show machines within 50 miles of your farm. Closer machines cost less to deliver." },
  { q: "Do I need to pay before the owner says yes?", a: "No. You pay nothing until the owner confirms your booking." },
  { q: "Can I cancel my booking?", a: "Yes. If you cancel early, you get your money back. The booking page shows the exact rule for each machine." },
  { q: "I do not know which machine I need. What now?", a: "Call us on (800) 555-0124. Tell us your crop and land size, and we will suggest the right machine." },
];

const MARKET_STATS = [
  { icon: Tractor, value: "428", label: "Machines listed" },
  { icon: Users, value: "2,400+", label: "Farmers renting" },
  { icon: Clock, value: "10 min", label: "Average booking time" },
  { icon: ShieldCheck, value: "100%", label: "Owners verified" },
];

/** Soft cursor glow + small tilt on cards (mouse only) */
function useTilt() {
  const onMouseMove = useCallback((e) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / (r.height / 2)) * -2.5;
    const ry = ((x - r.width / 2) / (r.width / 2)) * 2.5;
    c.style.setProperty("--tilt", `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`);
  }, []);
  const onMouseLeave = useCallback((e) => {
    e.currentTarget.style.setProperty("--tilt", "perspective(1000px) rotateX(0) rotateY(0) translateY(0)");
  }, []);
  return { onMouseMove, onMouseLeave };
}

export default function EquipmentSearch() {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("All equipment");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("best");
  const [openFaq, setOpenFaq] = useState(0);
  const tilt = useTilt();
  const rootRef = useRef(null);

  const filtered = useMemo(() => {
    const list = machines.filter(
      (m) =>
        `${m.name} ${m.category}`.toLowerCase().includes(term.trim().toLowerCase()) &&
        (category === "All equipment" || m.category.toLowerCase().includes(category.toLowerCase()))
    );
    if (sort === "low") return [...list].sort((a, b) => a.rate - b.rate);
    if (sort === "high") return [...list].sort((a, b) => b.rate - a.rate);
    if (sort === "rating") return [...list].sort((a, b) => Number(b.rating) - Number(a.rating));
    return list;
  }, [term, category, sort]);

  const countFor = (c) =>
    c === "All equipment" ? machines.length : machines.filter((m) => m.category.toLowerCase().includes(c.toLowerCase())).length;

  // Scroll reveal for the static sections
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const reset = () => { setTerm(""); setCategory("All equipment"); };

  return (
    <FlowFrame active="Equipment Search">
      <main className="ent-home" ref={rootRef}>
        <section className="ent-page-hero ent-page-hero-short">
          <div className="ent-page-hero-inner">
            <span className="ent-eyebrow-badge hero-stagger-1"><span className="ent-live-dot" /> AgriRent marketplace</span>
            <h1 className="hero-stagger-2">Find the right machine for your work.</h1>
            <p className="hero-stagger-3">Clean, checked machines from local farmers, ready for your next season.</p>
          </div>
        </section>

        {/* Search bar */}
        <section className="ent-command-bar" data-reveal>
          <div className="ent-command-field">
            <span className="ent-command-icon"><MapPin size={18} /></span>
            <div><label>Your farm area</label><strong>Davis, California</strong></div>
          </div>
          <div className="ent-command-sep" />
          <label className="ent-command-field" htmlFor="rent-date">
            <span className="ent-command-icon"><CalendarDays size={18} /></span>
            <div>
              <span className="ent-mini-label">When do you need it?</span>
              <input id="rent-date" type="date" className="ent-bare-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </label>
          <div className="ent-command-sep" />
          <label className="ent-command-field ent-search-field" htmlFor="equip-search">
            <span className="ent-command-icon"><Search size={18} /></span>
            <div>
              <span className="ent-mini-label">What do you need?</span>
              <input
                id="equip-search"
                className="ent-bare-input"
                placeholder="Try “tractor” or “harvester”"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            {term && (
              <button type="button" className="ent-clear-btn" aria-label="Clear search" onClick={(e) => { e.preventDefault(); setTerm(""); }}>
                <X size={15} />
              </button>
            )}
          </label>
        </section>

        {/* Popular searches */}
        <section className="ent-section ent-quick" data-reveal>
          <span>Popular searches:</span>
          {QUICK_SEARCHES.map((q) => (
            <button key={q} type="button" className="ent-quick-tag" onClick={() => { setTerm(q); setCategory("All equipment"); }}>
              {q}
            </button>
          ))}
        </section>

        {/* Marketplace numbers */}
        <section className="ent-section ent-market-stats" data-reveal>
          {MARKET_STATS.map(({ icon: Icon, value, label }) => (
            <div className="ent-market-stat" key={label}>
              <span className="ent-cat-icon"><Icon size={20} /></span>
              <div><strong>{value}</strong><span>{label}</span></div>
            </div>
          ))}
        </section>

        {/* Results heading + category chips */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Within 50 miles</span>
              <h2>Available near Davis</h2>
              <p aria-live="polite">{filtered.length} {filtered.length === 1 ? "machine" : "machines"} found</p>
            </div>
            <label className="ent-sort" htmlFor="sort-by">
              <span>Sort by</span>
              <span className="ent-sort-wrap">
                <select id="sort-by" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={16} />
              </span>
            </label>
          </div>
          <div className="ent-chips-row">
            <div className="ent-chips" role="tablist" aria-label="Choose machine type">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={category === c}
                  className={`ent-chip ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c === "Tractor" && <Tractor size={15} />}
                  {c === "Harvester" && <Wheat size={15} />}
                  {c} <b>{countFor(c)}</b>
                </button>
              ))}
            </div>
          </div>

          {/* key on the grid replays the entrance animation when filters change */}
          <div className="flow-machine-grid ent-machine-wrapper" key={`${category}-${term}`}>
            {filtered.map((m, i) => (
              <div key={m.name} className="ent-card-slot ent-card-enter" style={{ "--stagger": `${i * 70}ms` }} {...tilt}>
                <MachineCard item={m} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="ent-empty">
              <span className="ent-empty-icon"><Search size={26} /></span>
              <h3>We could not find that machine</h3>
              <p>Check the spelling, or look at all machines near you.</p>
              <button type="button" className="ent-btn-secondary" onClick={reset}>Show all machines</button>
            </div>
          )}
        </section>

        {/* What is included */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Included in every rental</span>
              <h2>Rent with peace of mind</h2>
              <p>Here is what you get with every machine, at no extra cost.</p>
            </div>
          </div>
          <div className="ent-cat-grid">
            {INCLUDED.map(({ icon: Icon, title, body }) => (
              <article className="ent-cat-card ent-value-card" key={title} {...tilt}>
                <span className="ent-cat-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How to rent */}
        <section className="ent-section ent-workflow-wrap" data-reveal>
          <div className="ent-workflow-grid">
            <div className="ent-workflow-intro">
              <span className="ent-kicker">Simple and quick</span>
              <h2>Rent a machine in 3 steps</h2>
              <p>No difficult paperwork. Most farmers finish booking in about 10 minutes.</p>
              <a className="ent-btn-primary" href="#top-results" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span>Start searching</span><ArrowRight size={15} className="ent-arrow" />
              </a>
            </div>
            <ol className="ent-steps-stack">
              {RENT_STEPS.map(({ icon: Icon, title, body }) => (
                <li className="ent-step-card" key={title} {...tilt}>
                  <div className="ent-step-num"><Icon size={18} /></div>
                  <div className="ent-step-body"><h3>{title}</h3><p>{body}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Owner invite */}
        <section className="ent-section" data-reveal>
          <div className="ent-owner-invite">
            <div>
              <span className="ent-kicker">Own a machine?</span>
              <h2>Earn money when your machine is not in use</h2>
              <ul>
                <li><CheckCircle2 size={16} /> Set your own daily price</li>
                <li><CheckCircle2 size={16} /> You choose who rents it</li>
                <li><CheckCircle2 size={16} /> Safe payment and insurance</li>
              </ul>
            </div>
            <Link className="ent-btn-primary" href="/contact">
              <span>List your machine</span><ArrowRight size={16} className="ent-arrow" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Common questions</span>
              <h2>Before you book</h2>
              <p>Quick answers to what farmers ask us most.</p>
            </div>
          </div>
          <div className="ent-faq">
            {FAQS.map((f, i) => (
              <div className={`ent-faq-item ${openFaq === i ? "open" : ""}`} key={f.q}>
                <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{f.q}</span><ChevronDown size={18} />
                </button>
                <div className="ent-faq-body"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* Help banner */}
        <section className="ent-section" data-reveal>
          <div className="ent-cta-banner">
            <div className="ent-cta-copy">
              <h2>Cannot find the machine you need?</h2>
              <p>Tell us what work you have to do. We will search nearby owners and call you back.</p>
            </div>
            <div className="ent-cta-actions">
              <Link className="ent-btn-light" href="/contact"><span>Send us a message</span><ArrowRight size={16} className="ent-arrow" /></Link>
              <a className="ent-btn-dark-outline" href="tel:+18005550124"><PhoneCall size={15} /><span>Call (800) 555-0124</span></a>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="ent-section" data-reveal>
          <div className="ent-trust-strip">
            <span><ShieldCheck size={18} /> Owners are verified</span>
            <span><Truck size={18} /> We help with delivery</span>
            <span><Wrench size={18} /> Machines are checked and ready</span>
          </div>
        </section>
      </main>
    </FlowFrame>
  );
}
