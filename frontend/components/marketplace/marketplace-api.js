// components/marketplace/marketplace-api.js
// Shared helpers for the booking → payment → review pages.
// ⚠️ Adjust this path to wherever your axios instance lives relative to THIS file
import api from "../../app/utils/domain";

export const MAX_RENTAL_DAYS = 30;
export const PLATFORM_FEE_PERCENT = 5; // keep in sync with PLATFORM_FEE_PERCENT in the backend

export const toList = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.results || [];

export const extractError = (err, fallback = "Something went wrong. Please try again.") => {
  const d = err?.response?.data;
  if (!d) return fallback;
  if (typeof d === "string") return d;
  if (d.error) return String(d.error);
  if (d.detail) return String(d.detail);
  if (typeof d === "object") {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" | ");
  }
  return fallback;
};

/** Logged-in user, as stored by your login flow (FlowHeader reads the same keys) */
export const getStoredUser = () => {
  if (typeof window === "undefined") return { userCode: "", fullName: "" };
  return {
    userCode: localStorage.getItem("user_code") || "",
    fullName: localStorage.getItem("full_name") || "",
  };
};

/* ---------- local-date helpers (strings like "2026-11-17") ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parts = (s) => s.split("-").map(Number);

export const localToday = () => toDateString(new Date());

export const addDays = (str, n) => {
  const [y, m, d] = parts(str);
  return toDateString(new Date(y, m - 1, d + n));
};

/** Inclusive day count: Oct 21 → Oct 23 = 3 days */
export const diffDaysInclusive = (a, b) => {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000) + 1;
};

export const formatDay = (iso) =>
  iso
    ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "";

/** Finds one active machine by code (preferred) or name, from the equipment list API */
export async function fetchMachine({ name, code }) {
  const res = await api.get("api/equipment/");
  const active = toList(res).filter((e) => Number(e.status) === 1);
  const wantedName = (name || "").trim().toLowerCase();
  const e =
    (code && active.find((x) => x.equipment_code === code)) ||
    (wantedName && active.find((x) => (x.equipment_name || "").trim().toLowerCase() === wantedName)) ||
    null;
  if (!e) return null;
  return {
    code: e.equipment_code,
    name: e.equipment_name || "Equipment",
    rate: Number(e.rental_price_per_day) || 0,
    deposit: Number(e.security_deposit) || 0,
    image: e.display_equipment_image || "/field-tractor.png",
    place: e.location_address || "Location not listed",
    availability: e.availability_status || "AVAILABLE",
  };
}