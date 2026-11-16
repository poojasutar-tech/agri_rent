"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useTable,
  Pagination,
  TableToolbar,
} from "../../../components/common/BaseCRUD";
import api from "../../utils/domain";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaChevronDown,
  FaTools,
  FaImage,
} from "react-icons/fa";

/* ================= HELPERS ================= */

const toList = (res) =>
  Array.isArray(res.data) ? res.data : res.data?.results || [];

const extractError = (err, fallback) => {
  const d = err.response?.data;
  if (!d) return fallback;
  if (typeof d === "object") {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" | ");
  }
  return String(d);
};

const EMPTY_FORM = {
  equipment_code: "",
  farmer_code: "",
  category_code: "",
  equipment_name: "",
  brand: "",
  model: "",
  manufacturing_year: "",
  description: "",
  condition_type: "GOOD",
  rental_price_per_hour: "",
  rental_price_per_day: "",
  security_deposit: "",
  availability_status: "AVAILABLE",
  location_address: "",
  latitude: "",
  longitude: "",
  status: 1,
};

// Only these fields are sent to the API (prevents sending image URLs,
// timestamps and other read-only fields that come back from the server).
const FORM_FIELDS = Object.keys(EMPTY_FORM);

const AVAILABILITY_BADGE = {
  AVAILABLE: "badge-success",
  RENTED: "badge-warning",
  MAINTENANCE: "badge-danger",
};

/* ================= CUSTOM SEARCHABLE SELECT WITH ADD NEW ================= */

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  labelField,
  valueField,
  disabled = false,
  onAddNew = null,
  addNewLabel = "Add New",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter((option) =>
    String(option[labelField] ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedOption = (options || []).find(
    (opt) => String(opt[valueField]) === String(value)
  );

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
  };



  return (
    <div
      className={`relative w-full ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      ref={dropdownRef}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input w-full flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? "ring-2 ring-emerald-500 border-emerald-500" : ""
        }`}
      >
        <span
          className={
            !selectedOption ? "text-slate-400" : "text-slate-900 dark:text-white"
          }
        >
          {selectedOption ? selectedOption[labelField] : placeholder}
        </span>
        <FaChevronDown
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          size={12}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ring-emerald-500/20"
                  placeholder="Type to filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {onAddNew && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDropdown();
                    onAddNew();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <FaPlus size={10} /> {addNewLabel}
                </button>
              )}
            </div>

            <div className="max-h-[250px] overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option[valueField]}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      String(value) === String(option[valueField])
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                    }`}
                    onClick={() => {
                      onChange(option[valueField]);
                      closeDropdown();
                    }}
                  >
                    {option[labelField]}
                    {String(value) === String(option[valueField]) && (
                      <FaCheckCircle size={14} />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <span>No options found.</span>
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdown();
                        onAddNew();
                      }}
                      className="text-xs text-emerald-500 font-bold hover:underline"
                    >
                      + Add "{searchTerm || "New Record"}" to Database
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const EquipmentPage = () => {
  const PATH = "api/equipment";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [quickAddModal, setQuickAddModal] = useState({
    type: null,
    isOpen: false,
    name: "",
    code: "",
  });

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [modal, setModal] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedData,
    effectiveItemsPerPage,
    filteredData,
    totalPages,
  } = useTable(data || []);

  /* ---------- data fetching ---------- */

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${PATH}/`);
      setData(toList(res));
    } catch (err) {
      console.error("Failed to fetch equipment records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [farmerRes, categoryRes] = await Promise.all([
        api.get("api/farmer_profiles/").catch(() => ({ data: [] })),
        api.get("api/equipment_categories/").catch(() => ({ data: [] })),
      ]);
      setFarmers(toList(farmerRes));
      setCategories(toList(categoryRes));
    } catch (err) {
      console.error("Dependency Fetch Failed:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchDependencies();
  }, []);

  // Free the blob URL created for the image preview
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  /* ---------- helpers ---------- */

  const showModal = (message, type = "success") =>
    setModal({ visible: true, message, type });

  const resetForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setSelectedRow(null);
    setPreviewImage(null);
    setSelectedFile(null);
    setFormData(EMPTY_FORM);
  };

  const handleEditInitiation = (item) => {
    // Merge into defaults and turn null values into "" so inputs stay controlled
    const merged = { ...EMPTY_FORM };
    FORM_FIELDS.forEach((key) => {
      if (item[key] !== null && item[key] !== undefined) merged[key] = item[key];
    });
    setFormData(merged);
    setSelectedFile(null);
    setPreviewImage(item.display_equipment_image || null);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const setField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  /* ---------- quick add category ---------- */

  const closeQuickAdd = () =>
    setQuickAddModal({ type: null, isOpen: false, name: "", code: "" });

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickAddModal.code.trim()) {
      showModal("Please enter a unique category code (e.g. TRACTOR).", "error");
      return;
    }
    if (!quickAddModal.name.trim()) {
      showModal("Please enter a category name.", "error");
      return;
    }

    try {
      if (quickAddModal.type === "category") {
        const res = await api.post("api/equipment_categories/create/", {
          category_code: quickAddModal.code.toUpperCase().trim(),
          category_name: quickAddModal.name.trim(),
          status: 1,
        });
        const newCategory = res.data;
        setCategories((prev) => [...prev, newCategory]);
        setField("category_code", newCategory.category_code);
        showModal("Equipment Category added successfully!");
      }
      closeQuickAdd();
    } catch (err) {
      showModal(extractError(err, "Failed to add record."), "error");
    }
  };

  /* ---------- save / delete ---------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.farmer_code) return showModal("Farmer Profile is required.", "error");
    if (!formData.category_code) return showModal("Equipment Category is required.", "error");
    if (!String(formData.equipment_name).trim())
      return showModal("Equipment Name is required.", "error");
    if (
      formData.rental_price_per_day === "" ||
      Number(formData.rental_price_per_day) <= 0
    )
      return showModal("Rental Price Per Day must be greater than 0.", "error");

    const lat = formData.latitude === "" ? null : Number(formData.latitude);
    const lng = formData.longitude === "" ? null : Number(formData.longitude);
    if (lat !== null && (lat < -90 || lat > 90))
      return showModal("Latitude must be between -90 and 90.", "error");
    if (lng !== null && (lng < -180 || lng > 180))
      return showModal("Longitude must be between -180 and 180.", "error");

    const submissionData = new FormData();
    FORM_FIELDS.forEach((key) => {
      const val = formData[key];
      if (val !== null && val !== undefined && val !== "") {
        submissionData.append(key, val);
      }
    });

    // Only send the image when a NEW file was chosen
    if (selectedFile) {
      submissionData.append("equipment_image", selectedFile);
    }

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`${PATH}/update/${formData.equipment_code}/`, submissionData);
        showModal("Equipment updated successfully!");
      } else {
        await api.post(`${PATH}/create/`, submissionData);
        showModal("Equipment created successfully!");
      }
      resetForm();
      fetchEquipment();
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      showModal(extractError(err, "Operation failed!"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    if (!window.confirm(`Delete equipment ${selectedRow.equipment_code}?`)) return;
    try {
      await api.delete(`${PATH}/delete/${selectedRow.equipment_code}/`);
      showModal("Equipment deleted successfully!");
      setSelectedRow(null);
      fetchEquipment();
    } catch (err) {
      showModal(err.response?.data?.error || "Delete failed!", "error");
    }
  };

  /* ---------- render ---------- */

  if (loading || initialLoading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

    const farmerOptions = farmers.map((f) => ({
    ...f,
    farmer_label: f.farmer_name
        ? `${f.farmer_name} (${f.farmer_code})`
        : f.farmer_code,
    }));

  return (
    <div className="space-y-6">
      {/* GLOBAL NOTIFICATION MODAL */}
      {modal.visible && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="form-container max-w-sm w-full p-8 text-center shadow-2xl">
            <div className="flex justify-center mb-4">
              {modal.type === "success" ? (
                <FaCheckCircle size={48} className="text-emerald-500" />
              ) : (
                <FaTimesCircle size={48} className="text-rose-500" />
              )}
            </div>
            <h3
              className={`text-xl font-black mb-2 uppercase tracking-tight ${
                modal.type === "success" ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {modal.type === "success" ? "Success" : "Error"}
            </h3>
            <p className="mb-6 text-sm opacity-80 break-words">{modal.message}</p>
            <button
              className="btn-primary w-full justify-center py-3"
              onClick={() => setModal({ ...modal, visible: false })}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {quickAddModal.isOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="form-container max-w-md w-full p-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">
              Add New Equipment Category
            </h3>
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="form-label">Category Code (e.g. TRACTOR)</label>
                <input
                  autoFocus
                  type="text"
                  maxLength={45}
                  className="form-input w-full uppercase"
                  placeholder="Enter unique code"
                  value={quickAddModal.code}
                  onChange={(e) =>
                    setQuickAddModal({ ...quickAddModal, code: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  maxLength={150}
                  className="form-input w-full"
                  placeholder="Enter category name"
                  value={quickAddModal.name}
                  onChange={(e) =>
                    setQuickAddModal({ ...quickAddModal, name: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-ghost" onClick={closeQuickAdd}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="section-header">
        <h4 className="page-title">Equipment Management</h4>
        {!showForm && (
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus size={14} /> Add New
            </button>
            {selectedRow && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-5">
                <button
                  className="btn-warning"
                  onClick={() => handleEditInitiation(selectedRow)}
                >
                  <FaEdit size={14} /> Edit
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  <FaTrash size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FORM SECTION */}
      {showForm && (
        <div className="form-container animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            >
              <FaChevronLeft size={14} />
            </button>
            <h6 className="form-section-title uppercase tracking-tighter m-0">
              {isEdit
                ? `Update Equipment: ${formData.equipment_code}`
                : "Create New Equipment"}
            </h6>
          </div>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1.5">
              <label className="form-label">
                Farmer Profile <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
            options={farmerOptions}
            value={formData.farmer_code}
            onChange={(val) => setField("farmer_code", val)}
            placeholder="Select Farmer..."
            labelField="farmer_label"
            valueField="farmer_code"
            />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">
                Category <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={categories}
                value={formData.category_code}
                onChange={(val) => setField("category_code", val)}
                placeholder="Select Category..."
                labelField="category_name"
                valueField="category_code"
                onAddNew={() =>
                  setQuickAddModal({ type: "category", isOpen: true, name: "", code: "" })
                }
                addNewLabel="Add Category"
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">
                Equipment Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="form-input w-full"
                value={formData.equipment_name ?? ""}
                placeholder="e.g. Mahindra 575 DI"
                onChange={(e) => setField("equipment_name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Brand</label>
              <input
                className="form-input w-full"
                value={formData.brand ?? ""}
                placeholder="e.g. Mahindra"
                onChange={(e) => setField("brand", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Model</label>
              <input
                className="form-input w-full"
                value={formData.model ?? ""}
                placeholder="e.g. 575 DI XP Plus"
                onChange={(e) => setField("model", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Manufacturing Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="form-input w-full"
                value={formData.manufacturing_year ?? ""}
                placeholder="e.g. 2022"
                onChange={(e) => setField("manufacturing_year", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Condition Type</label>
              <select
                className="form-input w-full cursor-pointer"
                style={{ colorScheme: "dark" }}
                value={formData.condition_type || "GOOD"}
                onChange={(e) => setField("condition_type", e.target.value)}
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Availability Status</label>
              <select
                className="form-input w-full cursor-pointer"
                style={{ colorScheme: "dark" }}
                value={formData.availability_status || "AVAILABLE"}
                onChange={(e) => setField("availability_status", e.target.value)}
              >
                <option value="AVAILABLE">Available</option>
                <option value="RENTED">Rented</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Rental Price Per Hour</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full"
                value={formData.rental_price_per_hour ?? ""}
                placeholder="e.g. 500.00"
                onChange={(e) => setField("rental_price_per_hour", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">
                Rental Price Per Day <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full"
                value={formData.rental_price_per_day ?? ""}
                placeholder="e.g. 3500.00"
                onChange={(e) => setField("rental_price_per_day", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Security Deposit</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full"
                value={formData.security_deposit ?? ""}
                placeholder="e.g. 5000.00"
                onChange={(e) => setField("security_deposit", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Location Address</label>
              <input
                className="form-input w-full"
                value={formData.location_address ?? ""}
                placeholder="Enter location address"
                onChange={(e) => setField("location_address", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                className="form-input w-full"
                value={formData.latitude ?? ""}
                placeholder="e.g. 16.7050"
                onChange={(e) => setField("latitude", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                className="form-input w-full"
                value={formData.longitude ?? ""}
                placeholder="e.g. 74.2433"
                onChange={(e) => setField("longitude", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                className="form-input w-full"
                value={formData.description ?? ""}
                placeholder="Enter detailed equipment description..."
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Status</label>
              <select
                className="form-input w-full cursor-pointer appearance-none"
                style={{ colorScheme: "dark" }}
                value={formData.status}
                onChange={(e) => setField("status", parseInt(e.target.value, 10))}
              >
                <option value={1}>Active</option>
                <option value={2}>Inactive</option>
                <option value={3}>Rejected</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="form-label">Equipment Image</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden group min-h-[120px] flex flex-col items-center justify-center">
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      className="absolute inset-0 w-full h-full object-cover opacity-25"
                      alt="preview"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setSelectedFile(null);
                      }}
                      className="btn-ghost text-xs relative z-10 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-md shadow"
                    >
                      Change Image
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FaImage className="text-slate-300" size={24} />
                    <label className="cursor-pointer">
                      <span className="text-xs text-emerald-500 font-medium hover:underline">
                        Click to upload equipment image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div
              className="md:col-span-2 flex justify-end gap-3 border-t pt-8 mt-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <button type="submit" disabled={saving} className="btn-primary px-12 py-3">
                {saving ? "Saving..." : isEdit ? "Update" : "Save"}
              </button>
              <button type="button" className="btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE SECTION */}
      {!showForm && (
        <div className="data-table-container animate-in fade-in duration-500">
          <TableToolbar
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            search={search}
            setSearch={setSearch}
            setCurrentPage={setCurrentPage}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="text-admin-th w-16"></th>
                  <th className="text-admin-th w-20">Image</th>
                  <th className="text-admin-th">Equipment Code</th>
                  <th className="text-admin-th">Equipment Name</th>
                  <th className="text-admin-th">Farmer Name</th>
                  <th className="text-admin-th">Brand/Model</th>
                  <th className="text-admin-th">Price/Day</th>
                  <th className="text-admin-th">Availability</th>
                  <th className="text-admin-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {paginatedData && paginatedData.length > 0 ? (
                  paginatedData.map((row) => {
                    const isSelected = selectedRow?.equipment_code === row.equipment_code;
                    const availability = row.availability_status || "AVAILABLE";
                    return (
                      <tr
                        key={row.equipment_code}
                        onClick={() => setSelectedRow(isSelected ? null : row)}
                        onDoubleClick={() => handleEditInitiation(row)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected ? "bg-emerald-500/10" : "hover:bg-emerald-500/5"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`selection-indicator ${
                              isSelected
                                ? "selection-indicator-active"
                                : "group-hover:border-emerald-500/50"
                            }`}
                          >
                            {isSelected && <div className="selection-dot" />}
                          </div>
                        </td>
                        <td className="text-admin-td">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600">
                            {row.display_equipment_image ? (
                              <img
                                src={row.display_equipment_image}
                                className="w-full h-full object-cover"
                                alt="equipment"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <FaTools size={14} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-admin-td font-semibold">{row.equipment_code}</td>
                        <td className="text-admin-td">{row.equipment_name || "-"}</td>
                        <td className="text-admin-td">{row.farmer_name || row.farmer_code}</td>
                        <td className="text-admin-td">
                          {row.brand || row.model
                            ? `${row.brand || ""} ${row.model || ""}`.trim()
                            : "-"}
                        </td>
                        <td className="text-admin-td">
                          {row.rental_price_per_day ? `₹${row.rental_price_per_day}` : "-"}
                        </td>
                        <td className="text-admin-td">
                          <span
                            className={`badge ${AVAILABILITY_BADGE[availability] || "badge-success"}`}
                          >
                            {availability}
                          </span>
                        </td>
                        <td className="text-admin-td">
                          <span
                            className={`badge ${
                              row.status === 1
                                ? "badge-success"
                                : row.status === 2
                                ? "badge-warning"
                                : "badge-danger"
                            }`}
                          >
                            {row.status === 1
                              ? "Active"
                              : row.status === 2
                              ? "Inactive"
                              : "Rejected"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-24 text-center">
                      <FaTools
                        size={64}
                        className="mb-6 mx-auto opacity-10 text-emerald-500 animate-pulse"
                      />
                      <p className="text-xl font-black opacity-30 uppercase tracking-widest">
                        No Records Found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <Pagination
              totalEntries={filteredData.length}
              itemsPerPage={effectiveItemsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;