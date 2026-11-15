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
  FaUser,
  FaImage,
} from "react-icons/fa";

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
  addNewLabel = "Add New"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(option =>
    String(option[labelField])?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = (options || []).find(opt => String(opt[valueField]) === String(value));

  return (
    <div className={`relative w-full ${disabled ? "opacity-60 pointer-events-none" : ""}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input w-full flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? "ring-2 ring-emerald-500 border-emerald-500" : ""
        }`}
      >
        <span className={!selectedOption ? "text-slate-400" : "text-slate-900 dark:text-white"}>
          {selectedOption ? selectedOption[labelField] : placeholder}
        </span>
        <FaChevronDown className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} size={12} />
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
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
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
                    setIsOpen(false);
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
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {option[labelField]}
                    {String(value) === String(option[valueField]) && <FaCheckCircle size={14} />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <span>No options found.</span>
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onAddNew();
                      }}
                      className="text-xs text-emerald-500 font-bold hover:underline"
                    >
                      + Add "{searchTerm || 'New Record'}" to Database
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

const FarmerProfiles = () => {
  const PATH = "api/farmer_profiles";
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmerProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${PATH}/`);
      setData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch farmer profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerProfiles();
  }, []);

  const [users, setUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [quickAddModal, setQuickAddModal] = useState({ 
    type: null, 
    isOpen: false, 
    name: "", 
    code: "", 
    location_type: "VILLAGE" 
  });

  const [formData, setFormData] = useState({
    farmer_code: "",
    user_code: "",
    farm_name: "",
    address1: "",
    address2: "",
    landmark: "",
    country_code: "",
    state_code: "",
    district_code: "",
    location_code: "",
    pincode: "",
    latitude: "",
    longitude: "",
    farm_size: "",
    farm_size_unit: "",
    status: 1,
  });

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

  const fetchDependencies = async () => {
    try {
      const [userRes, countryRes, stateRes, districtRes, locRes] = await Promise.all([
        api.get("api/users/").catch(() => ({ data: [] })),
        api.get("api/countries/").catch(() => ({ data: [] })),
        api.get("api/states/").catch(() => ({ data: [] })),
        api.get("api/districts/").catch(() => ({ data: [] })),
        api.get("api/locations/").catch(() => ({ data: [] })),
      ]);

      setUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data.results || []);
      setCountries(Array.isArray(countryRes.data) ? countryRes.data : countryRes.data.results || []);
      setStates(Array.isArray(stateRes.data) ? stateRes.data : stateRes.data.results || []);
      setDistricts(Array.isArray(districtRes.data) ? districtRes.data : districtRes.data.results || []);
      setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data.results || []);
    } catch (err) {
      console.error("Dependency Fetch Failed:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (formData.country_code) {
      const filtered = states.filter(s => String(s.country_code) === String(formData.country_code));
      setFilteredStates(filtered);
      if (!isEdit && !filtered.find(s => String(s.state_code) === String(formData.state_code))) {
        setFormData(prev => ({ ...prev, state_code: "", district_code: "", location_code: "" }));
      }
    } else {
      setFilteredStates([]);
    }
  }, [formData.country_code, states, isEdit]);

  useEffect(() => {
    if (formData.state_code) {
      const filtered = districts.filter(d => String(d.state_code) === String(formData.state_code));
      setFilteredDistricts(filtered);
      if (!isEdit && !filtered.find(d => String(d.district_code) === String(formData.district_code))) {
        setFormData(prev => ({ ...prev, district_code: "", location_code: "" }));
      }
    } else {
      setFilteredDistricts([]);
    }
  }, [formData.state_code, districts, isEdit]);

  useEffect(() => {
    if (formData.district_code) {
      const filtered = locations.filter(l => String(l.district_code) === String(formData.district_code));
      setFilteredLocations(filtered);
      if (!isEdit && !filtered.find(l => String(l.location_code) === String(formData.location_code))) {
        setFormData(prev => ({ ...prev, location_code: "" }));
      }
    } else {
      setFilteredLocations(locations);
    }
  }, [formData.district_code, locations, isEdit]);

  const resetForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setSelectedRow(null);
    setPreviewImage(null);
    setSelectedFile(null);
    setFormData({
      farmer_code: "",
      user_code: "",
      farm_name: "",
      address1: "",
      address2: "",
      landmark: "",
      country_code: "",
      state_code: "",
      district_code: "",
      location_code: "",
      pincode: "",
      latitude: "",
      longitude: "",
      farm_size: "",
      farm_size_unit: "",
      status: 1,
    });
  };

  const handleEditInitiation = (item) => {
    setFormData(item);
    if (item.display_profile_photo) {
      setPreviewImage(item.display_profile_photo);
    }
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

  const showModal = (message, type = "success") =>
    setModal({ visible: true, message, type });

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickAddModal.name.trim()) return;
    if (!quickAddModal.code.trim()) {
      showModal("Please enter a unique code (e.g. CHI).", "error");
      return;
    }

    try {
      if (quickAddModal.type === 'district') {
        if (!formData.state_code) {
          showModal("Please select a State first before adding a District.", "error");
          return;
        }
        const res = await api.post("api/districts/create/", {
          district_code: quickAddModal.code.toUpperCase().trim(),
          district_name: quickAddModal.name.trim(),
          state_code: formData.state_code
        });
        const newDistrict = res.data;
        setDistricts(prev => [...prev, newDistrict]);
        setFormData(prev => ({ ...prev, district_code: newDistrict.district_code }));
        showModal("District added successfully!");
      } else if (quickAddModal.type === 'location') {
        if (!formData.district_code) {
          showModal("Please select a District first before adding a Location.", "error");
          return;
        }
        const res = await api.post("api/locations/create/", {
          location_code: quickAddModal.code.toUpperCase().trim(),
          location_name: quickAddModal.name.trim(),
          district_code: formData.district_code,
          location_type: quickAddModal.location_type || "VILLAGE",
          status: 1
        });
        const newLocation = res.data;
        setLocations(prev => [...prev, newLocation]);
        setFormData(prev => ({ ...prev, location_code: newLocation.location_code }));
        showModal("Location added successfully!");
      }
      setQuickAddModal({ type: null, isOpen: false, name: "", code: "", location_type: "VILLAGE" });
      fetchDependencies();
    } catch (err) {
      let errText = "Failed to add record.";
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errText = Object.entries(err.response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        } else {
          errText = String(err.response.data);
        }
      }
      showModal(errText, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation for mandatory database columns
    if (!formData.user_code) {
      showModal("User is required.", "error");
      return;
    }
    if (!formData.country_code) {
      showModal("Country is required.", "error");
      return;
    }

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      const val = formData[key];
      if (val !== null && val !== undefined && val !== "") {
        submissionData.append(key, val);
      }
    });
    
    if (selectedFile) {
      submissionData.append("profile_photo", selectedFile);
    }

    try {
      if (isEdit) {
        await api.put(`${PATH}/update/${formData.farmer_code}/`, submissionData);
        showModal("Farmer Profile updated successfully!");
      } else {
        await api.post(`${PATH}/create/`, submissionData);
        showModal("Farmer Profile created successfully!");
      }
      resetForm();
      fetchFarmerProfiles();
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      let errText = "Operation failed!";
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errText = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        } else {
          errText = String(err.response.data);
        }
      }
      showModal(errText, "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await api.delete(`${PATH}/delete/${selectedRow.farmer_code}/`);
      showModal("Farmer profile deleted successfully!");
      setSelectedRow(null);
      fetchFarmerProfiles();
    } catch (err) {
      showModal(err.response?.data?.error || "Delete failed!", "error");
    }
  };

  if (loading || initialLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="app-container">
      {/* GLOBAL NOTIFICATION MODAL */}
      {modal.visible && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="form-container max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="mb-4 flex justify-center">
              {modal.type === "success" ? (
                <FaCheckCircle className="text-6xl text-emerald-500" />
              ) : (
                <FaTimesCircle className="text-6xl text-rose-500" />
              )}
            </div>
            <h3 className={`text-xl font-black mb-2 uppercase tracking-tight ${modal.type === "success" ? "text-emerald-500" : "text-rose-500"}`}>
              {modal.type === "success" ? "Success" : "Error"}
            </h3>
            <p className="mb-6 font-medium opacity-80 break-words text-sm">{modal.message}</p>
            <button className="btn-primary w-full justify-center py-3" onClick={() => setModal({ ...modal, visible: false })}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* QUICK ADD DISTRICT / LOCATION MODAL */}
      {quickAddModal.isOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="form-container max-w-md w-full p-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">
              Add New {quickAddModal.type === 'district' ? 'District' : 'Location'}
            </h3>
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="form-label">
                  {quickAddModal.type === 'district' ? 'District Code (e.g. KOL)' : 'Location Code (e.g. CHI)'}
                </label>
                <input
                  autoFocus
                  type="text"
                  maxLength={45}
                  className="form-input w-full uppercase"
                  placeholder="Enter unique code"
                  value={quickAddModal.code}
                  onChange={(e) => setQuickAddModal({ ...quickAddModal, code: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">
                  {quickAddModal.type === 'district' ? 'District Name' : 'Location Name'}
                </label>
                <input
                  type="text"
                  maxLength={150}
                  className="form-input w-full"
                  placeholder={`Enter ${quickAddModal.type} name`}
                  value={quickAddModal.name}
                  onChange={(e) => setQuickAddModal({ ...quickAddModal, name: e.target.value })}
                />
              </div>

              {quickAddModal.type === 'location' && (
                <div>
                  <label className="form-label">Location Type</label>
                  <select
                    className="form-input w-full cursor-pointer"
                    style={{ colorScheme: "dark" }}
                    value={quickAddModal.location_type}
                    onChange={(e) => setQuickAddModal({ ...quickAddModal, location_type: e.target.value })}
                  >
                    <option value="VILLAGE">Village</option>
                    <option value="TOWN">Town</option>
                    <option value="CITY">City</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setQuickAddModal({ type: null, isOpen: false, name: "", code: "", location_type: "VILLAGE" })}
                >
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
        <h4 className="page-title">Farmer Profiles</h4>
        {!showForm && (
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus size={14} /> Add New
            </button>
            {selectedRow && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-5">
                <button className="btn-warning" onClick={() => handleEditInitiation(selectedRow)}>
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
            <button type="button" onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
              <FaChevronLeft size={14} />
            </button>
            <h6 className="form-section-title uppercase tracking-tighter m-0">
              {isEdit ? `Update Farmer Profile: ${formData.farmer_code}` : "Create New Farmer Profile"}
            </h6>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
                <label className="form-label">User <span className="text-rose-500">*</span></label>
                <SearchableSelect 
                    options={users}
                    value={formData.user_code}
                    onChange={(val) => setFormData({...formData, user_code: val})}
                    placeholder="Select User..."
                    labelField="full_name"
                    valueField="user_code"
                />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Farm Name</label>
              <input
                className="form-input w-full"
                value={formData.farm_name || ""} 
                placeholder="Enter Farm Name"
                onChange={e => setFormData({ ...formData, farm_name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Address Line 1</label>
              <input
                className="form-input w-full"
                value={formData.address1 || ""} 
                placeholder="House No, Street Name"
                onChange={e => setFormData({ ...formData, address1: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Address Line 2</label>
              <input
                className="form-input w-full"
                value={formData.address2 || ""} 
                placeholder="Locality / Area"
                onChange={e => setFormData({ ...formData, address2: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Landmark</label>
              <input
                className="form-input w-full"
                value={formData.landmark || ""} 
                placeholder="e.g. Near Old Temple"
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Country <span className="text-rose-500">*</span></label>
              <SearchableSelect 
                options={countries}
                value={formData.country_code}
                onChange={(val) => setFormData({...formData, country_code: val})}
                placeholder="Select Country..."
                labelField="country_name"
                valueField="country_code"
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">State</label>
              <SearchableSelect 
                options={filteredStates}
                value={formData.state_code}
                onChange={(val) => setFormData({...formData, state_code: val})}
                placeholder={formData.country_code ? "Select State..." : "Select Country First"}
                labelField="state_name"
                valueField="state_code"
                disabled={!formData.country_code}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">District</label>
              <SearchableSelect 
                options={filteredDistricts}
                value={formData.district_code}
                onChange={(val) => setFormData({...formData, district_code: val})}
                placeholder={formData.state_code ? "Select District..." : "Select State First"}
                labelField="district_name"
                valueField="district_code"
                disabled={!formData.state_code}
                onAddNew={() => setQuickAddModal({ type: 'district', isOpen: true, name: "", code: "" })}
                addNewLabel="Add District"
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Location</label>
              <SearchableSelect 
                options={filteredLocations}
                value={formData.location_code}
                onChange={(val) => setFormData({...formData, location_code: val})}
                placeholder={formData.district_code ? "Select Location..." : "Select District First"}
                labelField="location_name"
                valueField="location_code"
                disabled={!formData.district_code}
                onAddNew={() => setQuickAddModal({ type: 'location', isOpen: true, name: "", code: "", location_type: "VILLAGE" })}
                addNewLabel="Add Location"
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Pincode</label>
              <input
                className="form-input w-full"
                value={formData.pincode || ""} 
                placeholder="e.g. 416001"
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                className="form-input w-full"
                value={formData.latitude || ""} 
                placeholder="e.g. 16.7050"
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                className="form-input w-full"
                value={formData.longitude || ""} 
                placeholder="e.g. 74.2433"
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Farm Size</label>
              <input
                type="number"
                step="0.01"
                className="form-input w-full"
                value={formData.farm_size || ""} 
                placeholder="e.g. 5.50"
                onChange={e => setFormData({ ...formData, farm_size: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Farm Size Unit</label>
              <input
                className="form-input w-full"
                value={formData.farm_size_unit || ""} 
                placeholder="e.g. Acres / Hectares"
                onChange={e => setFormData({ ...formData, farm_size_unit: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Status</label>
              <select 
                className="form-input w-full cursor-pointer appearance-none" 
                style={{ colorScheme: "dark" }}
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: parseInt(e.target.value) })}
              >
                <option value={1}>Active</option>
                <option value={2}>Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="form-label">Profile Photo</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden group min-h-[120px] flex flex-col items-center justify-center">
                {previewImage ? (
                  <>
                    <img src={previewImage} className="absolute inset-0 w-full h-full object-cover opacity-25" alt="preview"/>
                    <button type="button" onClick={() => { setPreviewImage(null); setSelectedFile(null); }} className="btn-ghost text-xs relative z-10 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-md shadow">Change Photo</button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FaImage className="text-slate-300" size={24}/>
                    <label className="cursor-pointer">
                      <span className="text-xs text-emerald-500 font-medium hover:underline">Click to upload profile photo</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 border-t pt-8 mt-4" style={{ borderColor: "var(--border-color)" }}>
              <button type="submit" className="btn-primary px-12 py-3">
                {isEdit ? "Update" : "Save"}
              </button>
              <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
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
                  <th className="text-admin-th w-20">Photo</th>
                  <th className="text-admin-th">Farmer Code</th>
                  <th className="text-admin-th">Farm Name</th>
                  <th className="text-admin-th">Pincode</th>
                  <th className="text-admin-th">Farm Size</th>
                  <th className="text-admin-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {paginatedData && paginatedData.length > 0 ? (
                  paginatedData.map((row) => {
                    const isSelected = selectedRow?.farmer_code === row.farmer_code;
                    return (
                      <tr 
                        key={row.farmer_code} 
                        onClick={() => setSelectedRow(isSelected ? null : row)}
                        onDoubleClick={() => handleEditInitiation(row)}
                        className={`group cursor-pointer transition-colors ${isSelected ? "bg-emerald-500/10" : "hover:bg-emerald-500/5"}`}
                      >
                        <td className="px-6 py-4">
                          <div className={`selection-indicator ${isSelected ? "selection-indicator-active" : "group-hover:border-emerald-500/50"}`}>
                            {isSelected && <div className="selection-dot" />}
                          </div>
                        </td>
                        <td className="text-admin-td">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600">
                                {row.display_profile_photo ? (
                                <img src={row.display_profile_photo} className="w-full h-full object-cover" alt="farmer"/>
                                ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><FaUser size={14}/></div>
                                )}
                            </div>
                        </td>
                        <td className="text-admin-td font-semibold">{row.farmer_code}</td>
                        <td className="text-admin-td">{row.farm_name || "-"}</td>
                        <td className="text-admin-td">{row.pincode || ""}</td>
                        <td className="text-admin-td">{row.farm_size ? `${row.farm_size} ${row.farm_size_unit || ''}` : "-"}</td>
                        <td className="text-admin-td">
                          <span className={`badge ${row.status === 1 ? "badge-success" : "badge-danger"}`}>
                            {row.status === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <FaUser size={64} className="mb-6 mx-auto opacity-10 text-emerald-500 animate-pulse" />
                      <p className="text-xl font-black opacity-30 uppercase tracking-widest">No Records Found</p>
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

export default FarmerProfiles;