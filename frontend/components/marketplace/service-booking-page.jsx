"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { FlowFrame, TextField, currency, findMachineByName } from "./shared";

export default function ServiceBooking({ itemName }) {
  const item = findMachineByName(itemName);
  const [days, setDays] = useState(3);
  const [service, setService] = useState("Equipment rental");
  const total = item.rate * days;
  const itemParam = encodeURIComponent(item.name);
  return (
    <FlowFrame active="Service / Booking">
      <main className="flow-main flow-narrow">
        <Link
          className="flow-back"
          href={`/equipment-details?item=${itemParam}`}
        >
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
            <label className="flow-field">
              <span>What do you need?</span>
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
              >
                <option>Equipment rental</option>
                <option>Rental + delivery</option>
                <option>Rental + operator support</option>
              </select>
            </label>
            <div className="booking-date-row">
              <TextField name="start" label="Start date" type="date" />
              <TextField name="end" label="Return date" type="date" />
            </div>
            <label className="flow-field">
              <span>Delivery address</span>
              <input placeholder="Farm address or nearest crossroads" />
            </label>
            <label className="flow-field">
              <span>
                Notes for the owner <small>Optional</small>
              </span>
              <textarea
                placeholder="Tell us about the work or any delivery instructions."
                rows="3"
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
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </label>
            <div className="summary-line">
              <span>
                {currency(item.rate)} × {days} days
              </span>
              <b>{currency(total)}</b>
            </div>
            {service !== "Equipment rental" && (
              <div className="summary-line">
                <span>{service}</span>
                <b>Included</b>
              </div>
            )}
            <div className="summary-line">
              <span>Platform fee</span>
              <b>{currency(Math.round(total * 0.05))}</b>
            </div>
            <div className="summary-total">
              <b>Estimated total</b>
              <strong>{currency(total + Math.round(total * 0.05))}</strong>
            </div>
            <Link
              className="flow-primary"
              href={`/payment?item=${itemParam}&total=${total + Math.round(total * 0.05)}`}
            >
              Continue to payment <ArrowRight size={15} />
            </Link>
            <small className="booking-fine">
              <ShieldCheck size={12} /> Payment is only collected after owner
              approval.
            </small>
          </aside>
        </div>
      </main>
    </FlowFrame>
  );
}
