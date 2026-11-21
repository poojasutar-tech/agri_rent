"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Star } from "lucide-react";
import { FlowFrame } from "./shared";
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";
import { extractError, getStoredUser } from "./marketplace-api";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function RatingReview({ bookingCode }) {
  const [code, setCode] = useState(bookingCode || "");
  const [user, setUser] = useState({ userCode: "", fullName: "" });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCode(bookingCode || p.get("booking") || "");
    setUser(getStoredUser());
  }, [bookingCode]);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      setLoadError("No booking was selected.");
      return;
    }
    if (!user.userCode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const { data } = await api.get(`api/bookings/detail/${encodeURIComponent(code)}/`, {
          params: { user_code: user.userCode },
        });
        if (cancelled) return;
        setBooking(data);
        const { data: reviewData } = await api.get("api/reviews/", {
          params: { equipment_code: data.equipment_code },
        });
        const reviewList = Array.isArray(reviewData) ? reviewData : reviewData?.results || [];
        if (!cancelled) {
          setExistingReview(
            reviewList.find((review) => review.booking_code === data.booking_code) || null
          );
        }
      } catch (err) {
        if (!cancelled) setLoadError(extractError(err, "We could not load your booking."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, user.userCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("api/reviews/create/", {
        user_code: user.userCode,
        booking_code: booking.booking_code,
        rating,
        review_comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(extractError(err, "We could not save your review."));
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <FlowFrame active="Rating / Review">
      <main className="flow-main flow-narrow">{children}</main>
    </FlowFrame>
  );

  if (!user.userCode && !loading) {
    return shell(
      <section className="flow-form-card">
        <h2>Sign in to leave a review</h2>
        <p>Please sign in with the account you used to book.</p>
        <Link className="flow-primary" href="/login">
          Sign in <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  if (loading) {
    return shell(
      <section className="flow-form-card">
        <h2>Loading…</h2>
        <p>Please wait a moment.</p>
      </section>
    );
  }

  if (loadError || !booking) {
    return shell(
      <section className="flow-form-card">
        <h2>We could not open this booking</h2>
        <p>{loadError || "Booking not found."}</p>
        <Link className="flow-primary" href="/equipment">
          See all machines <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

if (submitted) {
  return shell(
    <div className="mx-auto my-8 flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check size={22} strokeWidth={2.5} />
      </span>

      <b className="text-lg font-semibold text-slate-900">
        Thank you for your review
      </b>

      <small className="mt-1.5 text-sm leading-relaxed text-slate-500">
        Your feedback helps other farmers choose the right machine.
      </small>

      <Link
        href="/equipment"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Back to all machines <ArrowRight size={15} />
      </Link>
    </div>
  );
}

  if (booking.renter_user_code !== user.userCode) {
    return shell(
      <section className="flow-form-card">
        <h2>This booking cannot be reviewed by this account</h2>
        <p>Only the renter who made the booking can submit its review.</p>
        <Link className="flow-primary" href="/equipment">
          View equipment <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  if (booking.payment_status !== "SUCCESS") {
    return shell(
      <section className="flow-form-card">
        <h2>Payment is required before reviewing</h2>
        <p>Complete payment for booking {booking.booking_code} before submitting a review.</p>
        <Link className="flow-primary" href="/equipment">
          View equipment <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  if (existingReview) {
    return shell(
      <section className="flow-form-card">
        <h2>You have already reviewed this rental</h2>
        <p>Your published review for booking {booking.booking_code} is shown on the equipment page.</p>
        <Link className="flow-primary" href={`/equipment-details?code=${encodeURIComponent(booking.equipment_code)}`}>
          View equipment <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  const shown = hover || rating;

  return shell(
    <>
      <Link className="flow-back" href="/equipment">
        <ArrowLeft size={14} /> Back to equipment
      </Link>
      <div className="flow-page-intro compact-intro">
        <span className="flow-eyebrow">RATE YOUR RENTAL</span>
        <h1>How was {booking.equipment_name}?</h1>
        <p>Booking {booking.booking_code}. Tell other farmers what you thought.</p>
      </div>
      <form className="flow-form-card" onSubmit={handleSubmit}>
        <h2>Your rating</h2>
        <div
          role="radiogroup"
          aria-label="Star rating"
          style={{ display: "flex", alignItems: "center", gap: "6px", margin: "8px 0 16px" }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#f59e0b" }}
            >
              <Star size={30} fill={n <= shown ? "currentColor" : "none"} />
            </button>
          ))}
          <span style={{ marginLeft: 8, fontSize: "0.9rem", opacity: 0.8 }}>{RATING_WORDS[shown]}</span>
        </div>

        <label className="flow-field">
          <span>
            Your review <small>Optional</small>
          </span>
          <textarea
            rows="4"
            placeholder="Was the machine in good condition? Was the owner helpful?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" style={{ color: "#dc2626", fontSize: "0.85rem", margin: "8px 0" }}>
            {error}
          </p>
        )}

        <button className="flow-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Submit review"} <ArrowRight size={15} />
        </button>
      </form>
    </>
  );
}