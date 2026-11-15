"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Star } from "lucide-react";
import { FlowFrame, currency, findMachineByName } from "./shared";

export default function RatingReview({ itemName, totalAmount }) {
  const item = findMachineByName(itemName);
  const total =
    Number(totalAmount) || item.rate * 3 + Math.round(item.rate * 3 * 0.05);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  return (
    <FlowFrame active="Rating & Review">
      <main className="flow-main flow-narrow">
        <Link
          className="flow-back"
          href={`/payment?item=${encodeURIComponent(item.name)}&total=${total}`}
        >
          <ArrowLeft size={14} /> Back to payment
        </Link>
        <div className="flow-page-intro compact-intro">
          <span className="flow-eyebrow">HELP FARMERS CHOOSE WELL</span>
          <h1>How was your rental?</h1>
          <p>Your review helps build a more connected farming community.</p>
        </div>
        <div className="review-card">
          <div className="review-machine">
            <img src={item.image} alt={item.name} />
            <span>
              <b>{item.name}</b>
              <small>Rented from Alex Morgan · Oct 21–23</small>
            </span>
            <span className="review-complete">
              <Check size={12} /> Complete
            </span>
          </div>
          {sent ? (
            <div className="flow-success">
              <span>
                <Check size={21} />
              </span>
              <h3>Thanks for sharing.</h3>
              <p>Your demo review has been recorded on this screen.</p>
              <Link className="flow-primary" href="/">
                Back to home <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <form
              className="review-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              <fieldset>
                <legend>Overall experience</legend>
                <div
                  className="star-selector"
                  aria-label={`Rating: ${rating} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                    >
                      <Star
                        size={28}
                        fill={value <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <small>
                  {rating === 5
                    ? "Excellent — exactly what farmers need."
                    : `${rating} out of 5 stars`}
                </small>
              </fieldset>
              <label className="flow-field">
                <span>Share more about your experience</span>
                <textarea
                  rows="4"
                  placeholder="Was the equipment ready on time? How was working with the owner?"
                  required
                />
              </label>
              <label className="flow-check">
                <input type="checkbox" defaultChecked />
                <span>Recommend this equipment to other farmers</span>
              </label>
              <button className="flow-primary" type="submit">
                Submit review <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </main>
    </FlowFrame>
  );
}
