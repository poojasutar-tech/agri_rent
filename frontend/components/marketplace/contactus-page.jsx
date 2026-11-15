"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneCall, Mail, MapPin, Clock, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { FlowFrame } from "../shared"; // adjust path if your shared file is elsewhere

const cards = [
  { icon: PhoneCall, title: "Call us", line: "(800) 555-0124", note: "Fastest way to get help", href: "tel:+18005550124" },
  { icon: Mail, title: "Email us", line: "hello@agrirent.farm", note: "We reply within 1 working day", href: "mailto:hello@agrirent.farm" },
  { icon: MapPin, title: "Visit us", line: "120 Farm Road, Davis, CA", note: "Please call before you come" },
  { icon: Clock, title: "Opening hours", line: "Mon to Sat, 6 am to 8 pm", note: "Longer hours in harvest season" },
];

const topics = ["I want to rent a machine", "I want to list my machine", "I have a problem with a booking", "Something else"];

const faqs = [
  { q: "How much does it cost to rent a machine?", a: "Each machine shows its daily price. You see the full price, including insurance, before you book." },
  { q: "Will the machine be delivered to my farm?", a: "Yes. We deliver to your land and collect it when you finish. Delivery cost is shown before you pay." },
  { q: "What if the machine breaks while I use it?", a: "Call us right away. We will fix it or send another machine. Normal breakdowns are covered by insurance." },
  { q: "How do I earn money from my own machine?", a: "Choose “List your machine”, add photos and a daily price. We check it, and you are paid safely after each rental." },
];

export default function ContactUs() {
  const ref = useRef(null);
  const [form, setForm] = useState({ name: "", phone: "", topic: topics[0], message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(0);

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

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Please write your name.";
    if (form.phone.replace(/\D/g, "").length < 8) next.phone = "Please write a phone number we can call.";
    if (!form.message.trim()) next.message = "Please tell us how we can help.";
    setErrors(next);
    if (Object.keys(next).length) return;
    // TODO: send `form` to your API route, e.g. fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })
    setSent(true);
  };

  return (
    <FlowFrame active="Contact Us">
      <main className="ent-home" ref={ref}>
        <section className="ent-page-hero ent-page-hero-short">
          <div className="ent-page-hero-inner">
            <span className="ent-eyebrow-badge hero-stagger-1"><span className="ent-live-dot" /> We are here to help</span>
            <h1 className="hero-stagger-2">Talk to us. We answer in plain words.</h1>
            <p className="hero-stagger-3">Not sure which machine to rent, or need help with a booking? Call, write, or send us a message.</p>
          </div>
        </section>

        <section className="ent-contact-cards" data-reveal>
          {cards.map(({ icon: Icon, title, line, note, href }) => {
            const Tag = href ? "a" : "div";
            return (
              <Tag className="ent-contact-card" href={href} key={title}>
                <span className="ent-cat-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <strong>{line}</strong>
                <span>{note}</span>
              </Tag>
            );
          })}
        </section>

        <section className="ent-section" data-reveal>
          <div className="ent-contact-grid">
            <div className="ent-contact-intro">
              <span className="ent-kicker">Send a message</span>
              <h2>Tell us what you need</h2>
              <p>Fill in the form and our team will call you back, usually within a few hours.</p>
              <ul className="ent-contact-points">
                <li><CheckCircle2 size={16} /> No cost to ask</li>
                <li><CheckCircle2 size={16} /> A real person calls you back</li>
                <li><CheckCircle2 size={16} /> Help in simple words</li>
              </ul>
            </div>

            <div className="ent-form-card">
              {sent ? (
                <div className="ent-form-success" role="status">
                  <span className="ent-success-icon"><CheckCircle2 size={34} /></span>
                  <h3>Thank you, {form.name.split(" ")[0]}!</h3>
                  <p>We got your message. Our team will call you on {form.phone} soon.</p>
                  <button type="button" className="ent-btn-secondary" onClick={() => { setSent(false); setForm({ name: "", phone: "", topic: topics[0], message: "" }); }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="ent-field-row">
                    <div className="ent-field">
                      <label htmlFor="name">Your name</label>
                      <input id="name" name="name" value={form.name} onChange={change} placeholder="For example, John Miller" aria-invalid={!!errors.name} />
                      {errors.name && <em>{errors.name}</em>}
                    </div>
                    <div className="ent-field">
                      <label htmlFor="phone">Phone number</label>
                      <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} placeholder="(555) 123-4567" aria-invalid={!!errors.phone} />
                      {errors.phone && <em>{errors.phone}</em>}
                    </div>
                  </div>
                  <div className="ent-field">
                    <label htmlFor="topic">What do you need help with?</label>
                    <select id="topic" name="topic" value={form.topic} onChange={change}>
                      {topics.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="ent-field">
                    <label htmlFor="message">Your message</label>
                    <textarea id="message" name="message" rows={5} value={form.message} onChange={change} placeholder="Tell us the machine, dates and your farm area" aria-invalid={!!errors.message} />
                    {errors.message && <em>{errors.message}</em>}
                  </div>
                  <button type="submit" className="ent-btn-primary ent-form-submit"><Send size={16} /><span>Send message</span></button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="ent-section" data-reveal>
          <div className="ent-section-head">
            <div>
              <span className="ent-kicker">Common questions</span>
              <h2>Quick answers</h2>
              <p>Maybe your question is already answered here.</p>
            </div>
          </div>
          <div className="ent-faq">
            {faqs.map((f, i) => (
              <div className={`ent-faq-item ${open === i ? "open" : ""}`} key={f.q}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{f.q}</span><ChevronDown size={18} />
                </button>
                <div className="ent-faq-body"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </FlowFrame>
  );
}
