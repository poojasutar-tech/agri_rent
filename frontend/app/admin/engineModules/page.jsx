"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/domain"; 
import { useCrud, useTable, Pagination, TableToolbar } from "../../../components/common/BaseCRUD";
import { useAuth } from "../../../components/auth/AuthContext";
import { 
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, 
  FaChevronDown, FaChevronUp, FaSearch, FaLayerGroup 
} from 'react-icons/fa';

export default function EngineModulesPage() {
  /* ================= PERMISSIONS & AUTH ================= */
  const auth = useAuth() || {};
  const hasPermission = auth.hasPermission || (() => true);
  const MODULE = "MODULE";

  /* ================= DATA FETCHING ================= */
  const MODULE_PATH = "api/engine-module";
  const { data, loading, refresh, createItem, updateItem, deleteItem } = useCrud(`${MODULE_PATH}/`);
  
  const ROLES = ["ADMIN", "FARMER"];
  
  const [permissionsData, setPermissionsData] = useState({
    ADMIN: { read: false, write: false, update: false, delete: false },
    FARMER: { read: false, write: false, update: false, delete: false }
  });
  const [urlOptions, setUrlOptions] = useState([]); 

  /* ================= UI STATES ================= */
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showUrlDropdown, setShowUrlDropdown] = useState(false);
  const [urlSearchTerm, setUrlSearchTerm] = useState(""); 

  const [formData, setFormData] = useState({ 
    module_code: "", 
    module_name: "", 
    url: "", 
    icon: "", 
    sequence: "",
    status: 1 
  });
  const [modal, setModal] = useState({ message: "", visible: false, type: "success" });

  /* ================= SORTING & TABLE LOGIC ================= */
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const seqA = parseInt(a.sequence) || 999;
      const seqB = parseInt(b.sequence) || 999;
      return seqA - seqB;
    });
  }, [data]);

  const { 
    search, setSearch, 
    currentPage, setCurrentPage, 
    itemsPerPage, setItemsPerPage, 
    paginatedData, 
    effectiveItemsPerPage, 
    filteredData,
    totalPages 
  } = useTable(sortedData);

  /* ================= FETCH ROUTES ================= */
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await api.get("api/routes/");
        const routesData = res.data.routes || res.data;
        
        if (Array.isArray(routesData)) {
          const formattedRoutes = routesData
            .filter(route => route && route.path && route.label)
            .map(route => ({
              label: route.label,
              value: route.path
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          setUrlOptions(formattedRoutes);
        }
      } catch (err) {
        console.warn("Could not fetch routes from backend.", err);
        setUrlOptions([]);
      }
    };

    fetchRoutes();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setIsViewOnly(false);
    setSelectedModule(null);
    setUrlSearchTerm("");
    setShowUrlDropdown(false);
    setPermissionsData({
      ADMIN: { read: false, write: false, update: false, delete: false },
      FARMER: { read: false, write: false, update: false, delete: false }
    });
    setFormData({ module_code: "", module_name: "", url: "", icon: "", sequence: "", status: 1 });
  };

  const showModal = (message, type = "success") => setModal({ message, visible: true, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    const finalPayload = { 
      ...formData, 
      sequence: formData.sequence ? parseInt(formData.sequence) : null,
      permissions: permissionsData 
    };

    const actionPath = isEdit 
      ? `${MODULE_PATH}/update/${formData.module_code}/` 
      : `${MODULE_PATH}/create/`;

    const result = isEdit 
      ? await updateItem(actionPath, finalPayload)
      : await createItem(actionPath, finalPayload);

    if (result.success) {
      showModal(`Module ${isEdit ? "updated" : "created"} successfully!`);
      resetForm();
      refresh();
    } else {
      showModal(result.error || "Operation failed!", "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedModule) return;
    const result = await deleteItem(`${MODULE_PATH}/delete/${selectedModule.module_code}/`);
    if (result.success) {
      showModal("Module deleted successfully!");
      setSelectedModule(null);
      refresh();
    } else {
      showModal(result.error || "Delete failed!", "error");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* SUCCESS/ERROR MODAL */}
      {modal.visible && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
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
            
            <p className="mb-6 font-medium text-slate-600">{modal.message}</p>
            
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
              onClick={() => setModal({ ...modal, visible: false })}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Module Master</h1>
          
        </div>
        {!showForm && (
          <div className="flex items-center gap-3">
            {hasPermission(MODULE, 'e_write') && (
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition cursor-pointer" onClick={() => setShowForm(true)}>
                <FaPlus size={14} /> Add New Module
              </button>
            )}
            {selectedModule && (
              <div className="flex items-center gap-2">
                {hasPermission(MODULE, 'e_update') && (
                  <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer" onClick={() => { 
                    setFormData({...selectedModule}); 
                    if (selectedModule.permissions) setPermissionsData(selectedModule.permissions);
                    setIsEdit(true); 
                    setIsViewOnly(false); 
                    setShowForm(true); 
                  }}>
                    <FaEdit size={14} /> Edit
                  </button>
                )}
                {hasPermission(MODULE, 'e_update') && hasPermission(MODULE, 'e_write') && (
                  <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer" onClick={handleDelete}>
                    <FaTrash size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">
            {isViewOnly ? "View Module Profile" : (isEdit ? "Update Module Profile" : "Add New Module")}
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Module Code *</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" 
                value={formData.module_code} 
                disabled={isEdit || isViewOnly} 
                required={!isViewOnly}
                onChange={e => setFormData({ ...formData, module_code: e.target.value.toUpperCase().replace(/\s/g, '_') })} 
                placeholder="E.G. MOD_EQUIPMENT"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Module Name *</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" 
                value={formData.module_name} 
                disabled={isViewOnly}
                required={!isViewOnly}
                onChange={e => setFormData({ ...formData, module_name: e.target.value })} 
                placeholder="E.G. Equipment Rentals" 
              />
            </div>

            {/* URL SELECTOR */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">URL Path (Optional)</label>
              <div 
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 flex justify-between items-center ${isViewOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isViewOnly && setShowUrlDropdown(!showUrlDropdown)}
              >
                <span className={formData.url ? "text-slate-900 font-medium" : "text-slate-400"}>{formData.url || "Select Navigation Path"}</span>
                <div className="flex items-center gap-2">
                   {formData.url && !isViewOnly && <FaTimesCircle className="text-rose-400 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); setFormData({...formData, url: ""}); }} />}
                   {!isViewOnly && (showUrlDropdown ? <FaChevronUp size={12} className="text-emerald-500" /> : <FaChevronDown size={12} />)}
                </div>
              </div>

              {showUrlDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                        <FaSearch className="text-emerald-500" size={14} />
                        <input 
                          type="text" 
                          autoFocus 
                          className="w-full bg-transparent border-none text-sm outline-none text-slate-900 placeholder:text-slate-400" 
                          placeholder="Search routes..." 
                          value={urlSearchTerm} 
                          onChange={(e) => setUrlSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {urlOptions.filter(u => u.label.toLowerCase().includes(urlSearchTerm.toLowerCase())).length > 0 ? (
                          urlOptions.filter(u => u.label.toLowerCase().includes(urlSearchTerm.toLowerCase())).map(u => (
                            <div 
                              key={u.value} 
                              className="px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                              onClick={() => { setFormData({...formData, url: u.value}); setShowUrlDropdown(false); }}
                            >
                                <div className="text-sm font-bold text-slate-800">{u.label}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{u.value}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs italic">No matching routes</div>
                        )}
                    </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Icon Name / Class</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" 
                value={formData.icon} 
                disabled={isViewOnly}
                placeholder="Tractor or Wrench" 
                onChange={e => setFormData({ ...formData, icon: e.target.value })} 
              />
            </div>
            {/* <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Sequence (Optional)
            </label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              type="number"
              value={formData.sequence ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sequence: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
            />
          </div> */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Status</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer" 
                value={formData.status} 
                disabled={isViewOnly}
                onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            {/* PERMISSIONS SECTION */}
            <div className="md:col-span-2 mt-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-3">Module Permissions (By Role)</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">User Role</th>
                      <th className="px-4 py-3.5 text-center">Full Access</th>
                      <th className="px-4 py-3.5 text-center">Read</th>
                      <th className="px-4 py-3.5 text-center">Write</th>
                      <th className="px-4 py-3.5 text-center">Update</th>
                      <th className="px-4 py-3.5 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ROLES.map((role) => {
                      const rolePerms = permissionsData[role] || { read: false, write: false, update: false, delete: false };
                      const isAllChecked = rolePerms.read && rolePerms.write && rolePerms.update && rolePerms.delete;

                      return (
                        <tr key={role} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-3.5 font-bold text-slate-800">{role}</td>
                          <td className="px-4 py-3.5 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded accent-emerald-600 cursor-pointer" 
                              checked={isAllChecked}
                              disabled={isViewOnly}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setPermissionsData(prev => ({
                                  ...prev,
                                  [role]: { read: val, write: val, update: val, delete: val }
                                }));
                              }} 
                            />
                          </td>
                          {['read', 'write', 'update', 'delete'].map(permKey => (
                            <td key={permKey} className="px-4 py-3.5 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer" 
                                checked={!!rolePerms[permKey]}
                                disabled={isViewOnly}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setPermissionsData(prev => ({
                                    ...prev,
                                    [role]: { ...prev[role], [permKey]: val }
                                  }));
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
              {!isViewOnly && <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-2.5 rounded-xl text-sm transition cursor-pointer">{isEdit ? "Update Module" : "Save Module"}</button>}
              <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-sm transition cursor-pointer" onClick={resetForm}>{isViewOnly ? "Close" : "Cancel"}</button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE SECTION */}
      {!showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <TableToolbar itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} search={search} setSearch={setSearch} setCurrentPage={setCurrentPage} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-16"></th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Module Name</th>
                  <th className="px-6 py-4">Endpoint</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {paginatedData.length > 0 ? (
                  paginatedData.map((m) => (
                  <tr 
                    key={m.module_code} 
                    onDoubleClick={() => {
                      if (hasPermission(MODULE, 'e_update')) {
                        setFormData({...m});
                        if (m.permissions) setPermissionsData(m.permissions);
                        setIsEdit(true);
                        setIsViewOnly(false);
                        setShowForm(true);
                      } else if (hasPermission(MODULE, 'e_read')) {
                        setFormData({...m});
                        if (m.permissions) setPermissionsData(m.permissions);
                        setIsViewOnly(true);
                        setShowForm(true);
                      }
                    }}
                    onClick={() => setSelectedModule(selectedModule?.module_code === m.module_code ? null : m)} 
                    className={`cursor-pointer transition-colors ${selectedModule?.module_code === m.module_code ? "bg-emerald-50/60" : "hover:bg-slate-50/80"}`}
                  >
                    <td className="px-6 py-4">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModule?.module_code === m.module_code ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                            {selectedModule?.module_code === m.module_code && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{m.module_code}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{m.module_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{m.url || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {m.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                      <FaLayerGroup size={48} className="mx-auto mb-3 opacity-20 text-emerald-600" />
                      <p className="text-base font-bold uppercase tracking-wider">No modules found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200">
            <Pagination totalEntries={filteredData.length} itemsPerPage={effectiveItemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
          </div>
        </div>
      )}
    </div>
  );
}