"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Tractor,
} from "lucide-react";
import { FlowFrame, TextField, currency, findMachineByName } from "./shared";

export default function Payment({ itemName, totalAmount }) {
  const item = findMachineByName(itemName);
  const total =
    Number(totalAmount) || item.rate * 3 + Math.round(item.rate * 3 * 0.05);
  const [method, setMethod] = useState("card");
  const [paid, setPaid] = useState(false);
  return (
    <FlowFrame active="Payment">
      <main className="flow-main flow-narrow">
        <Link
          className="flow-back"
          href={`/service-booking?item=${encodeURIComponent(item.name)}`}
        >
          <ArrowLeft size={14} /> Back to booking
        </Link>
        <div className="flow-page-intro compact-intro">
          <span className="flow-eyebrow">SECURE CHECKOUT</span>
          <h1>Payment details</h1>
          <p>
            Your payment method will only be charged after booking approval.
          </p>
        </div>
        <div className="checkout-steps">
          <span className="step-done">
            <i>
              <Check size={12} />
            </i>{" "}
            Booking
          </span>
          <span className="step-active">
            <i>2</i> Payment
          </span>
          <span>
            <i>3</i> Review
          </span>
        </div>
        <div className="payment-layout">
          <section className="flow-form-card">
            <h2>Choose a payment method</h2>
            <p>Demo checkout — no real payment will be processed.</p>
            <div className="payment-methods">
              <label
                className={`payment-option ${method === "card" ? "chosen" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === "card"}
                  onChange={() => setMethod("card")}
                />
                <span className="payment-symbol">
                  <CreditCard size={18} />
                </span>
                <span>
                  <b>Credit or debit card</b>
                  <small>Visa, Mastercard, American Express</small>
                </span>
              </label>
              <label
                className={`payment-option ${method === "bank" ? "chosen" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === "bank"}
                  onChange={() => setMethod("bank")}
                />
                <span className="payment-symbol">
                  <Tractor size={18} />
                </span>
                <span>
                  <b>Farm account</b>
                  <small>Bill to your farm&apos;s monthly statement</small>
                </span>
              </label>
            </div>
            {method === "card" && (
              <div className="card-fields">
                <TextField
                  name="cardName"
                  label="Name on card"
                  placeholder="Alex Morgan"
                />
                <TextField
                  name="cardNumber"
                  label="Card number"
                  placeholder="4242 4242 4242 4242"
                />
                <div className="booking-date-row">
                  <TextField
                    name="expiry"
                    label="Expiry date"
                    placeholder="MM / YY"
                  />
                  <TextField
                    name="cvc"
                    label="Security code"
                    placeholder="CVC"
                  />
                </div>
              </div>
            )}
            <div className="payment-safety">
              <LockKeyhole size={15} />
              <span>Encrypted and secure checkout</span>
              <ShieldCheck size={15} />
            </div>
          </section>
          <aside className="flow-summary-card payment-summary">
            <span className="flow-eyebrow">ORDER SUMMARY</span>
            <h3>{item.name}</h3>
            <p>
              <CalendarDays size={13} /> Oct 21 – Oct 23 · 3 days
            </p>
            <div className="summary-line">
              <span>Equipment rental</span>
              <b>{currency(total - Math.round(total / 21))}</b>
            </div>
            <div className="summary-line">
              <span>Platform fee</span>
              <b>{currency(Math.round(total / 21))}</b>
            </div>
            <div className="summary-total">
              <b>Total due after approval</b>
              <strong>{currency(total)}</strong>
            </div>
            {paid ? (
              <div className="flow-success compact-success">
                <span>
                  <Check size={17} />
                </span>
                <b>Demo payment complete</b>
                <small>No real payment was taken.</small>
                <Link
                  href={`/rating-review?item=${encodeURIComponent(item.name)}`}
                >
                  Continue to review <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <button className="flow-primary" onClick={() => setPaid(true)}>
                Confirm demo payment <ArrowRight size={15} />
              </button>
            )}
            <small className="booking-fine">
              <ShieldCheck size={12} /> You won&apos;t be charged until
              approved.
            </small>
          </aside>
        </div>
      </main>
    </FlowFrame>
  );
}
