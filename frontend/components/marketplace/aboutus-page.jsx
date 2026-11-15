"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, HeartHandshake, ShieldCheck, Wallet, Truck, Users,
  Tractor, MapPin, Sprout, PhoneCall,
} from "lucide-react";
import { FlowFrame } from "../shared"; // adjust path if your shared file is elsewhere

const stats = [
  { value: "2,400+", label: "Farmers using AgriRent" },
  { value: "428", label: "Machines ready to rent" },
  { value: "$48,500", label: "Average saved per farm each year" },
  { value: "4.8 / 5", label: "Average rating from farmers" },
];

const values = [
  { icon: Wallet, title: "Fair prices", body: "You see the full daily price before you book. No hidden charges." },
  { icon: ShieldCheck, title: "Safe and insured", body: "Every machine is checked and insured, so you can work without worry." },
  { icon: Truck, title: "Delivered to your farm", body: "We bring the machine to your land and pick it up when you finish." },
  { icon: HeartHandshake, title: "Neighbors helping neighbors", body: "Local owners earn extra money and local farmers get the tools they need." },
];

const steps = [
  { icon: Tractor, title: "Owners list their machines", body: "Farmers with idle tractors, plows and sprayers add them to AgriRent with photos and a daily price." },
  { icon: MapPin, title: "Farmers find what is near them", body: "Search by your area, your crop work and your dates. Nearby machines show first." },
  { icon: Sprout, title: "Work gets done on time", body: "The machine arrives, you finish your job, and the owner is paid safely through us." },
];

const team = [
  { name: "Daniel Ortega", role: "Founder, 3rd-generation farmer" },
  { name: "Priya Nair", role: "Head of Farmer Support" },
  { name: "Tom Becker", role: "Machine Safety Checks" },
  { name: "Aisha Khan", role: "Local Partnerships" },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
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
  return ref;
}

export default function AboutUs() {
  const ref = useReveal();

  return (
    <FlowFrame active="About Us">
      <main className="ent-home" ref={ref}>
        {/* HERO */}
        <section className="ent-page-hero">
          <div className="ent-page-hero-inner">
            <span className="ent-eyebrow-badge hero-stagger-1"><span className="ent-live-dot" /> About AgriRent</span>
            <h1 className="hero-stagger-2">Built by farmers, so every farmer can use the right machine.</h1>
            <p className="hero-stagger-3">
              A good tractor should not sit in a shed while your neighbor waits to borrow one.
              AgriRent connects farmers who own machines with farmers who need them.
            </p>
            <div className="ent-hero-actions hero-stagger-4">
              <Link className="ent-btn-primary" href="/equipment"><span>See available machines</span><ArrowRight size={16} className="ent-arrow" /></Link>
              <Link className="ent-btn-ghost" href="/contact">Talk to us</Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="ent-stats" data-reveal>
          {stats.map((s) => (
            <div className="ent-stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        {/* STORY */}
        <section className="ent-section" data-reveal>
          <div className="ent-story">
            <div>
              <span className="ent-kicker">Our story</span>
              <h2>It started in a barn near Davis</h2>
            </div>
            <div className="ent-story-text">
              <p>
                Our founder, Daniel, grew up on a family farm. Every season the same thing happened:
                one neighbor bought a costly harvester he used for ten days, while another neighbor
                paid too much and waited too long to get one.
              </p>
              <p>
                In 2021 he began lending machines to people nearby and keeping a simple notebook of dates.
                Word spread. Today AgriRent helps thousands of farmers share machines safely, with clear
                prices, insurance and delivery.
              </p>
              <p>Our goal is simple: help you finish your work on time and keep more money in your pocket.</p>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">What we promise</span>
              <h2>Four things you can count on</h2>
              <p>These are the rules we follow on every booking.</p>
            </div>
          </div>
          <div className="ent-cat-grid">
            {values.map(({ icon: Icon, title, body }) => (
              <article className="ent-cat-card ent-value-card" key={title}>
                <span className="ent-cat-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="ent-section ent-workflow-wrap" data-reveal>
          <div className="ent-workflow-grid">
            <div className="ent-workflow-intro">
              <span className="ent-kicker">How AgriRent works</span>
              <h2>Simple for owners, simple for renters</h2>
              <p>No hard paperwork and no long calls. Everything is clear before you book.</p>
              <Link className="ent-btn-primary" href="/equipment"><span>Start renting</span><ArrowRight size={15} className="ent-arrow" /></Link>
            </div>
            <ol className="ent-steps-stack">
              {steps.map(({ icon: Icon, title, body }) => (
                <li className="ent-step-card" key={title}>
                  <div className="ent-step-num"><Icon size={18} /></div>
                  <div className="ent-step-body"><h3>{title}</h3><p>{body}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TEAM */}
        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Our team</span>
              <h2>People who understand farm work</h2>
              <p>Many of us grew up on farms. When you call, someone who knows the work answers.</p>
            </div>
          </div>
          <div className="ent-team-grid">
            {team.map((p) => (
              <div className="ent-team-card" key={p.name}>
                <div className="ent-team-avatar">{p.name.split(" ").map((n) => n[0]).join("")}</div>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ent-section" data-reveal>
          <div className="ent-cta-banner">
            <div className="ent-cta-copy">
              <h2>Have a question? We are happy to help.</h2>
              <p>Call or message our team. We will help you pick the right machine or list your own.</p>
            </div>
            <div className="ent-cta-actions">
              <Link className="ent-btn-light" href="/contact"><span>Contact us</span><ArrowRight size={16} className="ent-arrow" /></Link>
              <a className="ent-btn-dark-outline" href="tel:+18005550124"><PhoneCall size={15} /><span>Call (800) 555-0124</span></a>
            </div>
          </div>
        </section>
      </main>
    </FlowFrame>
  );
}
