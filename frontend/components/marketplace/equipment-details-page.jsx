"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Sprout, Star, Tractor, Minus, Plus, Truck, CheckCircle2 } from "lucide-react";
import { FlowFrame, currency, findMachineByName } from "./shared";

const SPEC_LABELS = ["Main feature", "What it can do", "Also included"];

export default function EquipmentDetails({ itemName }) {
  const item = findMachineByName(itemName);
  const [days, setDays] = useState(1);
  const [start, setStart] = useState("");
  const [view, setView] = useState(0);
  const rootRef = useRef(null);

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
  const today = new Date().toISOString().split("T")[0];
  const bookHref =
    `/service-booking?item=${encodeURIComponent(item.name)}&days=${days}` + (start ? `&start=${start}` : "");

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
                  <small>(28 reviews)</small>
                </p>
              </div>
              <span className="ent-available"><i /> Available</span>
            </div>

            <p className="ent-detail-desc hero-stagger-3">{item.description}</p>

            <div className="ent-spec-grid hero-stagger-3">
              {item.specs.map((spec, i) => (
                <div className="ent-spec" key={spec}>
                  <small>{SPEC_LABELS[i] ?? "Feature"}</small>
                  <b>{spec}</b>
                </div>
              ))}
            </div>

            <div className="ent-owner hero-stagger-4">
              <span className="ent-author-avatar">AM</span>
              <span>
                <b>Alex Morgan</b>
                <small>Verified owner. Replies within 1 hour.</small>
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
