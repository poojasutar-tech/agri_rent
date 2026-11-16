"use client";

import React, { useState, useEffect } from "react";
import {
  useCrud,
  useTable,
  Pagination,
  TableToolbar,
} from "../../../components/common/BaseCRUD";
import api from "../../utils/domain";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaTruckLoading,
  FaImage,
} from "react-icons/fa";

const EMPTY_FORM = {
  category_code: "",
  category_name: "",
  description: "",
  sort_order: "",
  status: 1,
};

// Only these fields are sent to the API (category_code goes in the URL)
const SUBMIT_FIELDS = ["category_name", "description", "sort_order", "status"];

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

const EquipmentCategories = () => {
  /* ================= API ================= */
  const PATH = "api/equipment_categories";
  // useCrud is kept for listing + refresh; saving uses `api` directly
  // so that a multipart FormData (with the image file) can be sent.
  const { data, loading, refresh } = useCrud(`${PATH}/`);

  /* ================= UI STATE ================= */
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [modal, setModal] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  /* ================= TABLE ================= */
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

  // Free blob URL created for the preview
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setSelectedRow(null);
    setPreviewImage(null);
    setSelectedFile(null);
    setFormData(EMPTY_FORM);
  };

  const showModal = (message, type = "success") =>
    setModal({ visible: true, message, type });

  const handleEditInitiation = (item) => {
    setFormData({
      ...EMPTY_FORM,
      category_code: item.category_code ?? "",
      category_name: item.category_name ?? "",
      description: item.description ?? "",
      sort_order: item.sort_order ?? "",
      status: item.status ?? 1,
    });
    setSelectedFile(null);
    setPreviewImage(item.display_category_image || null);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showModal("Please select a valid image file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showModal("Image must be smaller than 2 MB.", "error");
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_name.trim()) {
      showModal("Category Name is required.", "error");
      return;
    }

    const submissionData = new FormData();
    SUBMIT_FIELDS.forEach((key) => {
      const val = formData[key];
      if (val !== null && val !== undefined && val !== "") {
        submissionData.append(key, val);
      }
    });

    // Only send the image when a NEW file was chosen
    if (selectedFile) {
      submissionData.append("category_image", selectedFile);
    }

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`${PATH}/update/${formData.category_code}/`, submissionData);
      } else {
        await api.post(`${PATH}/create/`, submissionData);
      }
      showModal(`Equipment Category ${isEdit ? "updated" : "created"} successfully!`);
      resetForm();
      refresh();
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      showModal(extractError(err, "Operation failed!"), "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!selectedRow) return;
    if (!window.confirm(`Delete category ${selectedRow.category_code}?`)) return;

    try {
      await api.delete(`${PATH}/delete/${selectedRow.category_code}/`);
      showModal("Record deleted successfully!");
      setSelectedRow(null);
      refresh();
    } catch (err) {
      showModal(err.response?.data?.error || "Delete failed!", "error");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );

  return (
    <div className="app-container">
      {/* GLOBAL MODAL */}
      {modal.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="form-container max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="mb-4 flex justify-center">
              {modal.type === "success" ? (
                <FaCheckCircle className="text-6xl text-emerald-500" />
              ) : (
                <FaTimesCircle className="text-6xl text-rose-500" />
              )}
            </div>
            <h3
              className={`text-xl font-black mb-2 uppercase tracking-tight ${
                modal.type === "success" ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {modal.type === "success" ? "Success" : "Error"}
            </h3>
            <p className="mb-6 font-medium opacity-80 break-words">{modal.message}</p>
            <button
              className="btn-primary w-full justify-center py-3"
              onClick={() => setModal({ ...modal, visible: false })}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="section-header">
        <h4 className="page-title">Equipment Categories</h4>
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
          <h6 className="form-section-title uppercase tracking-tighter">
            {isEdit ? "Update Equipment Category" : "Create New Equipment Category"}
          </h6>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1.5">
              <label className="form-label">Category Code</label>
              <input
                className="form-input w-full"
                value={formData.category_code}
                disabled
                placeholder="Auto-generated (e.g. EQPTCAT001)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="form-input w-full"
                value={formData.category_name}
                required
                maxLength={150}
                placeholder="Enter Category Name"
                onChange={(e) =>
                  setFormData({ ...formData, category_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Sort Order</label>
              <input
                type="number"
                min="0"
                className="form-input w-full"
                value={formData.sort_order ?? ""}
                placeholder="E.G. 1"
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Status</label>
              <select
                className="form-input w-full cursor-pointer appearance-none"
                style={{ colorScheme: "dark" }}
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: parseInt(e.target.value, 10) })
                }
              >
                <option value={1}>Active</option>
                <option value={2}>Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-input w-full"
                rows="3"
                value={formData.description ?? ""}
                placeholder="Enter category description..."
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="form-label">Category Image</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden min-h-[120px] flex flex-col items-center justify-center">
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
                        Click to upload category image
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
                  <th className="text-admin-th">Code</th>
                  <th className="text-admin-th">Category Name</th>
                  <th className="text-admin-th">Description</th>
                  <th className="text-admin-th">Sort</th>
                  <th className="text-admin-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {paginatedData.length > 0 ? (
                  [...paginatedData]
                    .sort((a, b) => {
                      const sa =
                        a.sort_order === null || a.sort_order === "" || a.sort_order === undefined
                          ? 999
                          : Number(a.sort_order);
                      const sb =
                        b.sort_order === null || b.sort_order === "" || b.sort_order === undefined
                          ? 999
                          : Number(b.sort_order);
                      return sa - sb;
                    })
                    .map((row) => {
                      const isSelected = selectedRow?.category_code === row.category_code;
                      return (
                        <tr
                          key={row.category_code}
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
                              {row.display_category_image ? (
                                <img
                                  src={row.display_category_image}
                                  className="w-full h-full object-cover"
                                  alt="category"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <FaImage size={14} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-admin-td">{row.category_code}</td>
                          <td className="text-admin-td">{row.category_name}</td>
                          <td className="text-admin-td truncate max-w-xs">
                            {row.description || "-"}
                          </td>
                          <td className="text-admin-td">{row.sort_order ?? "-"}</td>
                          <td className="text-admin-td">
                            <span
                              className={`badge ${
                                row.status === 1 ? "badge-success" : "badge-danger"
                              }`}
                            >
                              {row.status === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <FaTruckLoading
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

export default EquipmentCategories;