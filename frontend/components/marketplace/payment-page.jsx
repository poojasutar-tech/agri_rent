"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { FlowFrame, currency } from "./shared";
import api from "../../app/utils/domain";
import { extractError, formatDay, getStoredUser } from "./marketplace-api";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payment({ bookingCode }) {
  const [code, setCode] = useState(bookingCode || "");
  const [user, setUser] = useState({ userCode: "", fullName: "" });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [method, setMethod] = useState("online"); // "online" (Razorpay) | "cash"
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [done, setDone] = useState(null); // null | "online" | "cash_pending" | "cash_paid"

  /* ---------- booking code (prop first, then ?booking= in the URL) ---------- */
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
        if (
          data.payment_gateway === "CASH" &&
          data.payment_status === "PENDING"
        ) {
          setDone("cash_pending");
        } else if (
          data.payment_gateway === "CASH" &&
          data.payment_status === "SUCCESS"
        ) {
          setDone("cash_paid");
        } else if (data.payment_status === "SUCCESS") {
          setDone("online");
        }
      } catch (err) {
        if (!cancelled) setLoadError(extractError(err, "We could not load your booking."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, user.userCode]);

  /* ---------- pay ---------- */
  const handlePay = async () => {
    if (!booking) return;
    setPayError("");
    setProcessing(true);
    let waitingForRazorpay = false;

    try {
      if (method === "cash") {
        const { data: payment } = await api.post("api/payments/cash/", {
          booking_code: booking.booking_code,
          user_code: user.userCode,
        });
        if (payment.payment_status === "SUCCESS") {
          setDone("cash_paid");
          setBooking((current) => ({
            ...current,
            payment_gateway: "CASH",
            payment_status: "SUCCESS",
          }));
        } else {
          setDone("cash_pending");
        }
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load the payment window. Check your connection.");

      // The server creates the order from the stored booking total (never from the browser)
      const { data: order } = await api.post("api/payments/razorpay/create-order/", {
        booking_code: booking.booking_code,
        user_code: user.userCode,
      });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "agrirent",
        description: booking.equipment_name || "Equipment rental",
        prefill: { name: user.fullName || undefined },
        theme: { color: "#16a34a" },
        handler: async (response) => {
          try {
            await api.post("api/payments/razorpay/verify/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_code: user.userCode,
            });
            setDone("online");
          } catch (err) {
            setPayError(
              extractError(err, "We could not confirm your payment. If money was deducted, contact support with booking " + booking.booking_code + ".")
            );
          } finally {
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.on("payment.failed", (resp) => {
        setPayError(resp?.error?.description || "Payment failed. Please try again.");
        setProcessing(false);
      });
      waitingForRazorpay = true;
      rzp.open();
    } catch (err) {
      setPayError(extractError(err, err?.message || "Payment could not be started."));
    } finally {
      if (!waitingForRazorpay) setProcessing(false);
    }
  };

  const handleCashReceived = async () => {
    setPayError("");
    setProcessing(true);
    try {
      await api.post(
        `api/payments/cash/confirm/${encodeURIComponent(booking.booking_code)}/`
      );
      setDone("cash_paid");
      setBooking((current) => ({ ...current, payment_status: "SUCCESS" }));
    } catch (err) {
      setPayError(extractError(err, "Cash receipt could not be confirmed."));
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- loading / error ---------- */
  if (loading) {
    return (
      <FlowFrame active="Payment">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>Loading your booking…</h2>
            <p>Please wait a moment.</p>
          </section>
        </main>
      </FlowFrame>
    );
  }

  if (loadError || !booking) {
    if (!loadError && !user.userCode) {
      return (
        <FlowFrame active="Payment">
          <main className="flow-main flow-narrow">
            <section className="flow-form-card">
              <h2>Sign in to continue to payment</h2>
              <p>Sign in with the account used to create this booking.</p>
              <Link
                className="flow-primary"
                href={`/login?next=${encodeURIComponent(`/payment?booking=${code}`)}`}
              >
                Sign in <ArrowRight size={15} />
              </Link>
            </section>
          </main>
        </FlowFrame>
      );
    }
    return (
      <FlowFrame active="Payment">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>We could not open this booking</h2>
            <p>{loadError || "Booking not found."}</p>
            <Link className="flow-primary" href="/equipment">
              See all machines <ArrowRight size={15} />
            </Link>
          </section>
        </main>
      </FlowFrame>
    );
  }

  const days = Number(booking.rental_duration) || 1;
  const deposit = Number(booking.security_deposit) || 0;
  const delivery = Number(booking.delivery_charge) || 0;
  const paymentSuccessful =
    booking.payment_status === "SUCCESS" ||
    done === "online" ||
    done === "cash_paid";
  const isRenter = booking.renter_user_code === user.userCode;
  const canPay = booking.booking_status === "PENDING" && !done;
  const isEquipmentOwner = user.userCode === booking.owner_user_code;
  const canConfirmCash =
    isEquipmentOwner &&
    booking.payment_gateway === "CASH" &&
    booking.payment_status === "PENDING" &&
    !["CANCELLED", "REJECTED"].includes(booking.booking_status);
  const paymentMethodLocked =
    canPay &&
    booking.payment_status === "PENDING" &&
    Boolean(booking.payment_gateway);

  return (
    <FlowFrame active="Payment">
      <main className="flow-main flow-narrow">
        <Link className="flow-back" href={`/equipment-details?code=${encodeURIComponent(booking.equipment_code)}`}>
          <ArrowLeft size={14} /> Back to equipment
        </Link>
        <div className="flow-page-intro compact-intro">
          <span className="flow-eyebrow">SECURE CHECKOUT</span>
          <h1>Payment details</h1>
          <p>Booking {booking.booking_code}. Pay online with Razorpay or select cash to pay the owner at pickup or delivery.</p>
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
            <p>Online payments are processed securely by Razorpay.</p>
            <div className="payment-methods">
              <label className={`payment-option ${method === "online" ? "chosen" : ""}`}>
                <input
                  type="radio"
                  name="method"
                  checked={method === "online"}
                  disabled={!canPay || paymentMethodLocked}
                  onChange={() => setMethod("online")}
                />
                <span className="payment-symbol">
                  <CreditCard size={18} />
                </span>
                <span>
                  <b>Pay online</b>
                  <small>UPI, cards, net banking and wallets via Razorpay</small>
                </span>
              </label>
              <label className={`payment-option ${method === "cash" ? "chosen" : ""}`}>
                <input
                  type="radio"
                  name="method"
                  checked={method === "cash"}
                  disabled={!canPay || paymentMethodLocked}
                  onChange={() => setMethod("cash")}
                />
                <span className="payment-symbol">
                  <Banknote size={18} />
                </span>
                <span>
                  <b>Pay in cash</b>
                  <small>Pay the owner directly on delivery or pickup</small>
                </span>
              </label>
            </div>
            {paymentMethodLocked && (
              <p className="booking-fine" role="status">
                A payment method is already selected for this booking. Continue with that method.
              </p>
            )}
            <div className="payment-safety">
              <LockKeyhole size={15} />
              <span>Encrypted and secure checkout</span>
              <ShieldCheck size={15} />
            </div>
          </section>
          <aside className="flow-summary-card payment-summary">
            <span className="flow-eyebrow">ORDER SUMMARY</span>
            <h3>{booking.equipment_name}</h3>
            <p>
              <CalendarDays size={13} /> {formatDay(booking.start_date)} – {formatDay(booking.end_date)} · {days}{" "}
              {days === 1 ? "day" : "days"}
            </p>
            <div className="summary-line">
              <span>Equipment rental</span>
              <b>{currency(booking.rental_amount)}</b>
            </div>
            {deposit > 0 && (
              <div className="summary-line">
                <span>Security deposit</span>
                <b>{currency(deposit)}</b>
              </div>
            )}
            {delivery > 0 && (
              <div className="summary-line">
                <span>Delivery</span>
                <b>{currency(delivery)}</b>
              </div>
            )}
            <div className="summary-line">
              <span>Platform fee</span>
              <b>{currency(booking.platform_fee)}</b>
            </div>
            <div className="summary-total">
              <b>
                {done === "cash_pending"
                  ? "Total due at pickup"
                  : done
                  ? "Total"
                  : "Total due"}
              </b>
              <strong>{currency(booking.total_amount)}</strong>
            </div>

            {payError && (
              <p role="alert" style={{ color: "#dc2626", fontSize: "0.85rem", margin: "8px 0" }}>
                {payError}
              </p>
            )}

            {done ? (
              <div className="flow-success compact-success">
                {done !== "cash_pending" && (
                  <span>
                    <Check size={17} />
                  </span>
                )}
                <b>
                  {done === "online"
                    ? "Online payment received"
                    : done === "cash_paid"
                    ? "Cash payment successful"
                    : "Cash payment selected — not yet paid"}
                </b>
                <small>
                  {done === "online"
                    ? "Your payment was received. The owner will confirm your booking soon."
                    : done === "cash_paid"
                    ? "Your cash payment has been recorded as successful. The owner will confirm your booking soon."
                    : isEquipmentOwner
                    ? "Confirm receipt only after the renter has handed you the cash."
                    : "Payment status is pending. Pay the owner at pickup or delivery; the owner must confirm receipt."}
                </small>
                {canConfirmCash && (
                  <button
                    className="flow-primary"
                    type="button"
                    onClick={handleCashReceived}
                    disabled={processing}
                  >
                    {processing ? "Please wait…" : "Confirm cash received"}
                    <ArrowRight size={15} />
                  </button>
                )}
                {paymentSuccessful ? (
                  <>
                    <Link className="flow-primary" href="/equipment">
                      See all machines <ArrowRight size={15} />
                    </Link>
                    {isRenter && (
                      <Link href={`/rating-review?booking=${encodeURIComponent(booking.booking_code)}`}>
                        Write a review (optional) <ArrowRight size={13} />
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {isRenter && <small>After payment is confirmed, you may leave an optional review.</small>}
                    <Link href="/equipment">
                      See all machines <ArrowRight size={13} />
                    </Link>
                  </>
                )}
              </div>
            ) : canPay ? (
              <button className="flow-primary" onClick={handlePay} disabled={processing}>
                {processing
                  ? "Please wait…"
                  : method === "online"
                  ? `Pay ${currency(booking.total_amount)} online`
                  : "Confirm cash payment"}{" "}
                <ArrowRight size={15} />
              </button>
            ) : (
              <div className="flow-success compact-success">
                <b>Booking {String(booking.booking_status || "").toLowerCase()}</b>
                <small>This booking is no longer waiting for payment.</small>
              </div>
            )}
            <small className="booking-fine">
              <ShieldCheck size={12} /> Online payments are refunded if the owner declines.
            </small>
          </aside>
        </div>
      </main>
    </FlowFrame>
  );
}