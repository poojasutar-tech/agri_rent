"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { FlowFrame, currency } from "./shared";
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";
import {
  MAX_RENTAL_DAYS,
  PLATFORM_FEE_PERCENT,
  addDays,
  diffDaysInclusive,
  extractError,
  fetchMachine,
  getStoredUser,
  localToday,
} from "./marketplace-api";

const BASE_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];

export default function ServiceBooking({ itemName, itemCode }) {
  const router = useRouter();

  /* ---------- which machine + defaults (props first, then the URL) ---------- */
  const [query, setQuery] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState({ userCode: "", fullName: "" });

  const [days, setDays] = useState(3);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [service, setService] = useState("Equipment rental");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const d = Math.min(MAX_RENTAL_DAYS, Math.max(1, Number(p.get("days")) || 3));
    const s = p.get("start") || "";
    setDays(d);
    if (s) {
      setStart(s);
      setEnd(addDays(s, d - 1));
    }
    setUser(getStoredUser());
    setQuery({
      name: itemName || p.get("item") || "",
      code: itemCode || p.get("code") || "",
    });
  }, [itemName, itemCode]);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const machine = await fetchMachine(query);
        if (!cancelled) setItem(machine);
      } catch (err) {
        if (!cancelled) setLoadError(extractError(err, "We could not load this machine."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  /* ---------- date <-> days stay in sync ---------- */
  const onStartChange = (value) => {
    setStart(value);
    if (value) setEnd(addDays(value, days - 1));
  };
  const onEndChange = (value) => {
    setEnd(value);
    if (start && value) {
      const d = diffDaysInclusive(start, value);
      if (d >= 1 && d <= MAX_RENTAL_DAYS) setDays(d);
    }
  };
  const onDaysChange = (n) => {
    setDays(n);
    if (start) setEnd(addDays(start, n - 1));
  };

  const dayOptions = useMemo(
    () => (BASE_DAY_OPTIONS.includes(days) ? BASE_DAY_OPTIONS : [...BASE_DAY_OPTIONS, days].sort((a, b) => a - b)),
    [days]
  );

  /* ---------- price preview (the server recalculates the real total) ---------- */
  const rental = item ? item.rate * days : 0;
  const deposit = item ? item.deposit : 0;
  const feePercent = item?.platformFeePercent ?? PLATFORM_FEE_PERCENT;
  const fee = Math.round((rental * feePercent) / 100 * 100) / 100;
  const total = rental + deposit + fee;

  const itemParam = item ? encodeURIComponent(item.name) : "";
  const backHref = item
    ? `/equipment-details?item=${itemParam}&code=${encodeURIComponent(item.code)}`
    : "/equipment";

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    setError("");
    if (!user.userCode) {
      setError("Please sign in to book this machine.");
      return;
    }
    if (!start || !end) {
      setError("Please choose your start and return dates.");
      return;
    }
    if (start < localToday()) {
      setError("Start date cannot be in the past.");
      return;
    }
    if (end < start) {
      setError("Return date cannot be before the start date.");
      return;
    }
    if (service.toLowerCase().includes("delivery") && !address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("api/bookings/create/", {
        user_code: user.userCode,
        equipment_code: item.code,
        start_date: start,
        end_date: end,
        service_type: service,
        delivery_address: address.trim(),
        remarks: notes.trim(),
      });
      router.push(`/payment?booking=${encodeURIComponent(data.booking_code)}`);
    } catch (err) {
      setError(extractError(err, "We could not create your booking."));
      setSubmitting(false);
    }
  };

  /* ---------- loading / error / not found ---------- */
  if (loading || !query) {
    return (
      <FlowFrame active="Service / Booking">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>Loading your booking…</h2>
            <p>Please wait a moment.</p>
          </section>
        </main>
      </FlowFrame>
    );
  }

  if (loadError || !item) {
    return (
      <FlowFrame active="Service / Booking">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>{loadError ? "Something went wrong" : "We could not find this machine"}</h2>
            <p>{loadError || "It may have been rented out or removed."}</p>
            <Link className="flow-primary" href="/equipment">
              See all machines <ArrowRight size={15} />
            </Link>
          </section>
        </main>
      </FlowFrame>
    );
  }

  return (
    <FlowFrame active="Service / Booking">
      <main className="flow-main flow-narrow">
        <Link className="flow-back" href={backHref}>
          <ArrowLeft size={14} /> Back to equipment
        </Link>
        <div className="flow-page-intro compact-intro">
          <span className="flow-eyebrow">BOOK YOUR EQUIPMENT</span>
          <h1>Plan your rental</h1>
          <p>Choose your dates and let us know what your farm needs.</p>
        </div>
        <div className="checkout-steps">
          <span className="step-active">
            <i>1</i> Booking
          </span>
          <span>
            <i>2</i> Payment
          </span>
          <span>
            <i>3</i> Review
          </span>
        </div>
        <div className="booking-columns">
          <section className="flow-form-card">
            <h2>Rental details</h2>
            <p>
              {item.name} · {item.place}
            </p>

            {!user.userCode && (
              <div className="booking-notice">
                <Clock3 size={16} />
                <span>
                  <b>Sign in to book</b>
                  <small>
                    <Link href="/login">Sign in</Link> with your farmer account to continue.
                  </small>
                </span>
              </div>
            )}

            <label className="flow-field">
              <span>What do you need?</span>
              <select value={service} onChange={(event) => setService(event.target.value)}>
                <option>Equipment rental</option>
                <option>Rental + delivery</option>
                <option>Rental + operator support</option>
              </select>
            </label>
            <div className="booking-date-row">
              <label className="flow-field">
                <span>Start date</span>
                <input
                  name="start"
                  type="date"
                  min={localToday()}
                  value={start}
                  onChange={(e) => onStartChange(e.target.value)}
                  required
                />
              </label>
              <label className="flow-field">
                <span>Return date</span>
                <input
                  name="end"
                  type="date"
                  min={start || localToday()}
                  value={end}
                  onChange={(e) => onEndChange(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="flow-field">
              <span>
                Delivery address
                {service.toLowerCase().includes("delivery") ? "" : <small> Optional</small>}
              </span>
              <input
                placeholder="Farm address or nearest crossroads"
                value={address}
                maxLength={255}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <label className="flow-field">
              <span>
                Notes for the owner <small>Optional</small>
              </span>
              <textarea
                placeholder="Tell us about the work or any delivery instructions."
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="booking-notice">
              <Clock3 size={16} />
              <span>
                <b>Owner confirmation required</b>
                <small>
                  Your dates are confirmed once the equipment owner approves.
                </small>
              </span>
            </div>
          </section>
          <aside className="flow-summary-card">
            <span className="summary-photo">
              <img src={item.image} alt={item.name} />
            </span>
            <h3>{item.name}</h3>
            <p>
              <MapPin size={13} /> {item.place}
            </p>
            <label className="flow-field">
              <span>Rental length</span>
              <select value={days} onChange={(event) => onDaysChange(Number(event.target.value))}>
                {dayOptions.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "day" : "days"}
                  </option>
                ))}
              </select>
            </label>
            <div className="summary-line">
              <span>
                {currency(item.rate)} × {days} {days === 1 ? "day" : "days"}
              </span>
              <b>{currency(rental)}</b>
            </div>
            {service !== "Equipment rental" && (
              <div className="summary-line">
                <span>{service}</span>
                <b>Included</b>
              </div>
            )}
            {deposit > 0 && (
              <div className="summary-line">
                <span>Security deposit</span>
                <b>{currency(deposit)}</b>
              </div>
            )}
            <div className="summary-line">
              <span>Platform fee</span>
              <b>{currency(fee)}</b>
            </div>
            <div className="summary-total">
              <b>Estimated total</b>
              <strong>{currency(total)}</strong>
            </div>

            {error && (
              <p role="alert" style={{ color: "#dc2626", fontSize: "0.85rem", margin: "8px 0" }}>
                {error}
              </p>
            )}

            <button className="flow-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating booking…" : "Continue to payment"} <ArrowRight size={15} />
            </button>
            <small className="booking-fine">
              <ShieldCheck size={12} /> Pay online or in cash on the next step. The owner still has
              to approve your booking.
            </small>
          </aside>
        </div>
      </main>
    </FlowFrame>
  );
}