"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Star } from "lucide-react";
import { FlowFrame, currency } from "./shared";
import api from "../../app/utils/domain";
import { extractError, formatDay, getStoredUser } from "./marketplace-api";

const RENTAL_STATUSES = [
  "ALL",
  "ACTIVE",
  "RETURN_REQUESTED",
  "RETURNED",
  "OVERDUE",
  "CANCELLED",
];

export default function RentalMonitoring({ bookingCode }) {
  const [code, setCode] = useState(bookingCode || "");
  const [user, setUser] = useState({ userCode: "", fullName: "" });
  const [rentals, setRentals] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Rental create/update fields matching Rentals model & RentalsSerializer
  const [nextStatus, setNextStatus] = useState("ACTIVE");
  const [conditionBefore, setConditionBefore] = useState("");
  const [conditionAfter, setConditionAfter] = useState("");
  const [handoverRemarks, setHandoverRemarks] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [equipmentCodeInput, setEquipmentCodeInput] = useState("");
  const [farmerCodeInput, setFarmerCodeInput] = useState("");

  // Penalty fields matching Penalties model & PenaltiesSerializer
  const [penaltyType, setPenaltyType] = useState("LATE_RETURN");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyDescription, setPenaltyDescription] = useState("");
  const [penaltyRemarks, setPenaltyRemarks] = useState("");

  // Maintenance fields matching MaintenanceRecords model & MaintenanceRecordsSerializer
  const [maintenanceType, setMaintenanceType] = useState("REPAIR");
  const [problemDescription, setProblemDescription] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [maintenanceRemarks, setMaintenanceRemarks] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCode(bookingCode || p.get("booking") || "");
    const stored = getStoredUser() || {};
    setUser({
      ...stored,
      userCode: stored.userCode || stored.user_code || "",
      fullName: stored.fullName || stored.full_name || "",
    });
  }, [bookingCode]);

  const syncFormFromRental = (item) => {
    if (!item) return;
    setSelectedRental(item);
    setNextStatus(item.rental_status || "ACTIVE");
    setConditionBefore(item.equipment_condition_before || "");
    setConditionAfter(item.equipment_condition_after || "");
    setHandoverRemarks(item.handover_remarks || "");
    setReturnRemarks(item.return_remarks || "");
    setExpectedReturnDate(
      item.expected_return_date ? String(item.expected_return_date).slice(0, 16) : ""
    );
    setEquipmentCodeInput(item.equipment_code || "");
    setFarmerCodeInput(item.farmer_code || "");
  };

  useEffect(() => {
    if (!user.userCode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [rentalRes, penaltyRes, maintRes] = await Promise.all([
          api.get("api/rentals/"),
          api.get("api/penalties/").catch(() => ({ data: [] })),
          api.get("api/maintenance-records/").catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        const allRentals = Array.isArray(rentalRes?.data)
          ? rentalRes.data
          : rentalRes?.data?.results || [];
        const rList = code
          ? allRentals.filter((r) => r.booking_code === code)
          : allRentals;
        const pList = Array.isArray(penaltyRes?.data)
          ? penaltyRes.data
          : penaltyRes?.data?.results || [];
        const mList = Array.isArray(maintRes?.data)
          ? maintRes.data
          : maintRes?.data?.results || [];

        setRentals(rList.length > 0 || !code ? rList : allRentals);
        setPenalties(pList);
        setMaintenanceList(mList);

        const initial =
          (code ? allRentals.find((r) => r.booking_code === code) : null) ||
          rList[0] ||
          null;
        if (initial) {
          syncFormFromRental(initial);
        } else if (code) {
          try {
            const { data: bookingDetail } = await api.get(
              `api/bookings/detail/${encodeURIComponent(code)}/`,
              { params: { user_code: user.userCode } }
            );
            if (!cancelled && bookingDetail) {
              setEquipmentCodeInput(bookingDetail.equipment_code || "");
              setFarmerCodeInput(
                bookingDetail.farmer_code || bookingDetail.renter_user_code || ""
              );
              setExpectedReturnDate(
                bookingDetail.end_date
                  ? `${String(bookingDetail.end_date).slice(0, 10)}T18:00`
                  : ""
              );
            }
          } catch {
            // Optional fallback when booking detail is not needed
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(extractError(err, "We could not load rental records."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, user.userCode]);

  const handleSaveRental = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    try {
      setSaving(true);
      const nowIso = new Date().toISOString();
      const userId = user.id || user.userId || null;

      if (selectedRental?.rental_code) {
        const payload = {
          rental_status: nextStatus,
          equipment_condition_before: conditionBefore,
          equipment_condition_after: conditionAfter,
          handover_remarks: handoverRemarks,
          return_remarks: returnRemarks,
          expected_return_date:
            expectedReturnDate || selectedRental.expected_return_date,
          actual_start_date:
            selectedRental.actual_start_date ||
            (nextStatus === "ACTIVE" ? nowIso : undefined),
          actual_return_date:
            nextStatus === "RETURNED"
              ? selectedRental.actual_return_date || nowIso
              : selectedRental.actual_return_date,
          updatedby: userId,
        };
        const { data: updated } = await api.put(
          `api/rentals/update/${encodeURIComponent(selectedRental.rental_code)}/`,
          payload
        );
        const merged = { ...selectedRental, ...payload, ...(updated || {}) };
        setRentals((prev) =>
          prev.map((r) =>
            r.rental_code === selectedRental.rental_code ? merged : r
          )
        );
        syncFormFromRental(merged);
        setActionSuccess(`Rental ${merged.rental_code} updated.`);
      } else {
        if (!code || !equipmentCodeInput || !farmerCodeInput || !expectedReturnDate) {
          setActionError(
            "Booking code, equipment code, farmer code, and expected return date are required."
          );
          return;
        }
        const payload = {
          booking_code: code,
          equipment_code: equipmentCodeInput.trim(),
          farmer_code: farmerCodeInput.trim(),
          expected_return_date: expectedReturnDate,
          actual_start_date: nextStatus === "ACTIVE" ? nowIso : null,
          rental_status: nextStatus,
          equipment_condition_before: conditionBefore,
          equipment_condition_after: conditionAfter,
          handover_remarks: handoverRemarks,
          return_remarks: returnRemarks,
          createdby: userId,
        };
        const { data: created } = await api.post("api/rentals/create/", payload);
        const createdItem = created?.rental_code
          ? created
          : { ...payload, ...(created || {}) };
        setRentals((prev) => [createdItem, ...prev]);
        syncFormFromRental(createdItem);
        setActionSuccess("Rental record created.");
      }
    } catch (err) {
      setActionError(extractError(err, "Could not save rental monitoring details."));
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePenalty = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    if (!selectedRental?.rental_code) {
      setActionError("Select or save a rental record first before logging a penalty.");
      return;
    }
    if (!penaltyAmount || Number(penaltyAmount) <= 0) {
      setActionError("Enter a valid penalty amount.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        rental_code: selectedRental.rental_code,
        farmer_code: selectedRental.farmer_code || farmerCodeInput,
        penalty_type: penaltyType,
        penalty_description: penaltyDescription.trim(),
        penalty_amount: Number(penaltyAmount),
        payment_status: "PENDING",
        paid_amount: 0,
        remarks: penaltyRemarks.trim(),
        createdby: user.id || user.userId || null,
      };
      const { data: created } = await api.post("api/penalties/create/", payload);
      setPenalties((prev) => [
        created?.id || created?.penalty_code ? created : payload,
        ...prev,
      ]);
      setPenaltyAmount("");
      setPenaltyDescription("");
      setPenaltyRemarks("");
      setActionSuccess("Penalty recorded.");
    } catch (err) {
      setActionError(extractError(err, "Could not record penalty."));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    const eqCode = selectedRental?.equipment_code || equipmentCodeInput;
    if (!eqCode) {
      setActionError("Equipment code is required to log maintenance.");
      return;
    }
    if (!problemDescription.trim()) {
      setActionError("Please enter a problem description.");
      return;
    }
    try {
      setSaving(true);
      const todayStr = new Date().toISOString().slice(0, 10);
      const payload = {
        equipment_code: eqCode,
        reported_by: user.userCode,
        maintenance_type: maintenanceType,
        problem_description: problemDescription.trim(),
        maintenance_date: todayStr,
        maintenance_cost: maintenanceCost ? Number(maintenanceCost) : 0,
        maintenance_status: "OPEN",
        remarks: maintenanceRemarks.trim(),
        createdby: user.id || user.userId || null,
      };
      const { data: created } = await api.post(
        "api/maintenance-records/create/",
        payload
      );
      setMaintenanceList((prev) => [
        created?.id || created?.maintenance_code ? created : payload,
        ...prev,
      ]);
      setProblemDescription("");
      setMaintenanceCost("");
      setMaintenanceRemarks("");
      setActionSuccess("Maintenance record logged.");
    } catch (err) {
      setActionError(extractError(err, "Could not log maintenance record."));
    } finally {
      setSaving(false);
    }
  };

  const filteredRentals =
    statusFilter === "ALL"
      ? rentals
      : rentals.filter((r) => r.rental_status === statusFilter);

  const rentalPenalties = selectedRental
    ? penalties.filter((p) => p.rental_code === selectedRental.rental_code)
    : [];

  const rentalMaintenance = selectedRental
    ? maintenanceList.filter(
        (m) => m.equipment_code === selectedRental.equipment_code
      )
    : [];

  if (!user.userCode && !loading) {
    return (
      <FlowFrame active="Rental Monitoring">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>Sign in to view rental monitoring</h2>
            <p>Please sign in to monitor active rentals, handovers, and returns.</p>
            <Link
              className="flow-primary"
              href={`/login?next=${encodeURIComponent(
                code ? `/rental-monitoring?booking=${code}` : "/rental-monitoring"
              )}`}
            >
              Sign in <ArrowRight size={15} />
            </Link>
          </section>
        </main>
      </FlowFrame>
    );
  }

  if (loading) {
    return (
      <FlowFrame active="Rental Monitoring">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>Loading rental monitoring…</h2>
            <p>Please wait a moment.</p>
          </section>
        </main>
      </FlowFrame>
    );
  }

  if (loadError) {
    return (
      <FlowFrame active="Rental Monitoring">
        <main className="flow-main flow-narrow">
          <section className="flow-form-card">
            <h2>We could not load rental monitoring</h2>
            <p>{loadError}</p>
            <Link className="flow-primary" href="/equipment">
              See all machines <ArrowRight size={15} />
            </Link>
          </section>
        </main>
      </FlowFrame>
    );
  }

  const activeBookingRef = selectedRental?.booking_code || code;

  return (
    <FlowFrame active="Rental Monitoring">
      <main className="flow-main flow-narrow">
        <Link
          className="flow-back"
          href={
            code
              ? `/payment?booking=${encodeURIComponent(code)}`
              : "/equipment"
          }
        >
          <ArrowLeft size={14} /> {code ? "Back to payment" : "Back to equipment"}
        </Link>

        <div className="flow-page-intro compact-intro">
          <span className="flow-eyebrow">RENTAL LIFECYCLE</span>
          <h1>Rental Monitoring</h1>
          <p>
            {activeBookingRef
              ? `Tracking rental operations for booking ${activeBookingRef}.`
              : "Monitor active rentals, handover condition, returns, penalties, and maintenance."}
          </p>
        </div>

        <section className="flow-form-card">
          <h2>Filter & select rental</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            {RENTAL_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? "flow-primary" : "flow-back"}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredRentals.length > 0 ? (
            <div style={{ display: "grid", gap: "8px" }}>
              {filteredRentals.map((item) => (
                <button
                  key={item.rental_code || item.id}
                  type="button"
                  onClick={() => syncFormFromRental(item)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid currentColor",
                    opacity:
                      selectedRental?.rental_code === item.rental_code ? 1 : 0.75,
                    cursor: "pointer",
                  }}
                >
                  <b>{item.rental_code}</b> · Booking {item.booking_code} · Equipment{" "}
                  {item.equipment_code} · <span>{item.rental_status || "ACTIVE"}</span>
                  <div>
                    <small>
                      Expected return: {formatDay(item.expected_return_date)}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p>No rental records found for this filter.</p>
          )}
        </section>

        <form className="flow-form-card" onSubmit={handleSaveRental}>
          <h2>
            {selectedRental
              ? `Rental ${selectedRental.rental_code} status & inspection`
              : "Start / update rental record"}
          </h2>

          {!selectedRental && (
            <>
              <label className="flow-field">
                <span>Equipment code</span>
                <input
                  type="text"
                  value={equipmentCodeInput}
                  onChange={(e) => setEquipmentCodeInput(e.target.value)}
                  placeholder="EQ000001"
                />
              </label>
              <label className="flow-field">
                <span>Farmer code</span>
                <input
                  type="text"
                  value={farmerCodeInput}
                  onChange={(e) => setFarmerCodeInput(e.target.value)}
                  placeholder="FR000001"
                />
              </label>
            </>
          )}

          <label className="flow-field">
            <span>Rental status</span>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>

          <label className="flow-field">
            <span>Expected return date</span>
            <input
              type="datetime-local"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
          </label>

          <label className="flow-field">
            <span>Equipment condition before handover</span>
            <textarea
              rows="2"
              value={conditionBefore}
              onChange={(e) => setConditionBefore(e.target.value)}
              placeholder="Engine, tires, attachments, fuel level..."
            />
          </label>

          <label className="flow-field">
            <span>Handover remarks</span>
            <textarea
              rows="2"
              value={handoverRemarks}
              onChange={(e) => setHandoverRemarks(e.target.value)}
            />
          </label>

          <label className="flow-field">
            <span>Equipment condition after return</span>
            <textarea
              rows="2"
              value={conditionAfter}
              onChange={(e) => setConditionAfter(e.target.value)}
              placeholder="Inspection notes upon return..."
            />
          </label>

          <label className="flow-field">
            <span>Return remarks</span>
            <textarea
              rows="2"
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
            />
          </label>

          <button className="flow-primary" type="submit" disabled={saving}>
            {saving
              ? "Saving…"
              : selectedRental
              ? "Update rental"
              : "Create rental"}{" "}
            <ArrowRight size={15} />
          </button>
        </form>

        <form className="flow-form-card" onSubmit={handleCreatePenalty}>
          <h2>Penalties (late return / damage)</h2>
          <label className="flow-field">
            <span>Penalty type</span>
            <select
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value)}
            >
              <option value="LATE_RETURN">LATE_RETURN</option>
              <option value="DAMAGE">DAMAGE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label className="flow-field">
            <span>Penalty amount</span>
            <input
              type="number"
              step="0.01"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="flow-field">
            <span>Description</span>
            <textarea
              rows="2"
              value={penaltyDescription}
              onChange={(e) => setPenaltyDescription(e.target.value)}
            />
          </label>
          <label className="flow-field">
            <span>Remarks</span>
            <input
              type="text"
              value={penaltyRemarks}
              onChange={(e) => setPenaltyRemarks(e.target.value)}
            />
          </label>
          <button className="flow-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add penalty"} <ArrowRight size={15} />
          </button>
          {rentalPenalties.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {rentalPenalties.map((p, idx) => (
                <p key={p.penalty_code || idx}>
                  <b>{p.penalty_type}</b> — {currency(p.penalty_amount)} (
                  {p.payment_status || "PENDING"})
                </p>
              ))}
            </div>
          )}
        </form>

        <form className="flow-form-card" onSubmit={handleCreateMaintenance}>
          <h2>Maintenance records</h2>
          <label className="flow-field">
            <span>Maintenance type</span>
            <select
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="REPAIR">REPAIR</option>
              <option value="INSPECTION">INSPECTION</option>
            </select>
          </label>
          <label className="flow-field">
            <span>Problem description</span>
            <textarea
              rows="2"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
            />
          </label>
          <label className="flow-field">
            <span>Maintenance cost</span>
            <input
              type="number"
              step="0.01"
              value={maintenanceCost}
              onChange={(e) => setMaintenanceCost(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="flow-field">
            <span>Remarks</span>
            <input
              type="text"
              value={maintenanceRemarks}
              onChange={(e) => setMaintenanceRemarks(e.target.value)}
            />
          </label>
          <button className="flow-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Log maintenance"} <ArrowRight size={15} />
          </button>
          {rentalMaintenance.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {rentalMaintenance.map((m, idx) => (
                <p key={m.maintenance_code || idx}>
                  <b>{m.maintenance_type || "MAINTENANCE"}</b> — {m.problem_description} (
                  {currency(m.maintenance_cost || 0)})
                </p>
              ))}
            </div>
          )}
        </form>

        {actionError && (
          <p role="alert" style={{ color: "#dc2626", fontSize: "0.85rem", margin: "8px 0" }}>
            {actionError}
          </p>
        )}
        {actionSuccess && (
          <div className="flow-success">
            <span>
              <Check size={17} />
            </span>
            <b>{actionSuccess}</b>
            {activeBookingRef && (
              <Link
                href={`/rating-review?booking=${encodeURIComponent(activeBookingRef)}`}
              >
                <Star size={13} /> Proceed to Rating & Review <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}
      </main>
    </FlowFrame>
  );
}