import React, { useEffect, useState } from "react";

import api from "../api/axios";

/* -------------------------
   Small UI helpers
   ------------------------- */
function Badge({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-white/10">
      <span>{children}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      )}
    </span>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------
   Main Page Component
   ------------------------- */
export default function AttributesPage() {
  // initial attributes include optional `color` field
    const [colors, setColors] = useState([
      // { id: 1, name: "Sky Blue", hex: "#38bdf8" },
      // { id: 2, name: "Green Tea", hex: "#22c55e" },
      // { id: 3, name: "Fire Orange", hex: "#f97316" },
    ]);

    const [editingColorId, setEditingColorId] = useState(null);
    const [colorName, setColorName] = useState("");
    const [colorHex, setColorHex] = useState("#000000");

  const [attributes, setAttributes] = useState([
    // { id: 1, name: "Size", values: ["36", "38", "40"], color: "#2563eb" },
    // { id: 2, name: "Flavour", values: ["Sweet", "Spicy"], color: "#10b981" },
    // { id: 3, name: "Weight", values: ["100g", "200g"], color: "#f97316" },
    // { id: 4, name: "Kid Size", values: ["4", "6"], color: "#ef4444" },
    // { id: 5, name: "Fabric", values: [], color: "#6b7280" },
  ]);

  // form / edit
  const [formName, setFormName] = useState("");
  const [editingAttr, setEditingAttr] = useState(null);

  // search + pagination (for All Attributes)
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // values modal
  const [isValuesModalOpen, setValuesModalOpen] = useState(false);
  const [currentAttrId, setCurrentAttrId] = useState(null);
  const [currentAttrValues, setCurrentAttrValues] = useState([]);
  const [newValue, setNewValue] = useState("");

  // tabs: "all" or "color"
  const [activeTab, setActiveTab] = useState("all");

  // color modal (optional)
  const [colorEditAttr, setColorEditAttr] = useState(null);
  const [tempColor, setTempColor] = useState("#000000");

  /* ---------- derived data for All Attributes tab ---------- */
  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalItems = filteredAttributes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAttributes.slice(startIndex, startIndex + itemsPerPage);

  /* ---------- CRUD handlers ---------- */
  const handleSave = async(e) => {

    e.preventDefault();
    if (!formName.trim()) return alert("Please enter attribute name");

    try {

      if(editingAttr){
         
          const res=await api.post(`admin/variation/update/${editingAttr.id}`,{name: formName});
   
          if(res.data.status){
            alert(res.data.message);
            getAttributes()
          }else{
             alert(res.data.message);
          }

          // console.log("ree",res);

      }else{
        const res=await api.post("/admin/variation/add",{name:formName});
        if(res.data.status){
            alert(res.data.message);
            setFormName("");
          // fetchAttributes();
        }else{
             alert(res.data.message);
        }

      }

    } catch (error) {
      
    }
   
  };

  const getAttributes=async()=>{

    try {
      const attributes=await api.get("/admin/variation/");
      // setAttributes(attributes.data.data);
      console.log(attributes.data.variations);
      setAttributes(attributes.data.variations);

    } catch (error) {
        console.log(error);
    }

  }

  const getColors=async()=>{

    try {
      const colors=await api.get("/admin/colors/");
    
      console.log(colors.data.colors);
      setColors(colors.data.colors);

    } catch (error) {
        console.log(error);
    }

  }

  useEffect(()=>{
        getAttributes();
        getColors();
  },[])

  const handleEdit = (attr) => {
    setEditingAttr(attr);
    setFormName(attr.name);
    document.getElementById("attribute-form")?.scrollIntoView({ behavior: "smooth" });
    setActiveTab("all"); // show the table/form tab
  };

  const handleDelete = async(id) => {
  
    if (!confirm("Delete attribute?")) return;
    try {
        const res=await api.delete(`/admin/variation/delete/${id}`);
        console.log(res);
        if(res.data.status){
          alert(res.data.message);
           getAttributes()
        }else{
          alert(res.data.message);
          
        }
    } catch (error) {
        alert(error);
      
    }
    // setAttributes((prev) => prev.filter((a) => a.id !== id));
  };

  /* ---------- Values modal actions ---------- */
  const openValuesModal = (attr) => {
 
     const values = Array.isArray(attr.attributes)
    ? attr.attributes.map((item) => item.name ?? "")
    : [];

  setCurrentAttrValues(values);
  setCurrentAttrId(attr.id);
  setNewValue("");
  setValuesModalOpen(true);
  setActiveTab("all");
  };

  const addValueToModal = () => {
    const v = newValue.trim();
    if (!v) return;
    if (currentAttrValues.includes(v)) {
      alert("Value already exists");
      return;
    }
    setCurrentAttrValues((prev) => [...prev, v]);
    setNewValue("");
  };

const saveValuesToAttribute = async () => {
  if (!currentAttrId) {
    alert("Invalid attribute ID");
    return;
  }

  const cleanValues = currentAttrValues
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  // optimistic update
  const prevState = [...attributes];

  setAttributes((prev) =>
    prev.map((a) =>
      a.id === currentAttrId ? { ...a, values: cleanValues } : a
    )
  );

  try {
    const res = await api.post("/admin/attributes/add-attributes", {
      variation_id: currentAttrId,
      values: cleanValues, // ["250g","500g","750g","1000g"]
    });

    if (res.data.status) {
      // update UI with backend values if returned
      if (res.data.attributes) {
        setAttributes((prev) =>
          prev.map((a) =>
            a.id === currentAttrId
              ? { ...a, values: res.data.attributes.map((x) => x.name) }
              : a
          )
        );
      }
        getAttributes()
      setValuesModalOpen(false);
    } else {
      alert(res.data.message || "Failed to save values");
      setAttributes(prevState); // rollback UI
    }
  } catch (err) {
    console.error(err);
    alert("Server error while saving values");
    setAttributes(prevState); // rollback
  }
};

  /* ---------- Color editing ---------- */
  const openColorEditor = (attr) => {
    setColorEditAttr(attr);
    setTempColor(attr.color || "#000000");
    setActiveTab("color");
  };

  const saveColorForAttr = () => {
    if (!colorEditAttr) return;
    setAttributes((prev) =>
      prev.map((a) => (a.id === colorEditAttr.id ? { ...a, color: tempColor } : a))
    );
    setColorEditAttr(null);
  };

  const cancelColorEdit = () => {
    setColorEditAttr(null);
  };

  /* ---------- small helper ---------- */
  const getAttributeById = (id) => attributes.find((a) => a.id === id);

  // RESET form
const resetColorForm = () => {
  setEditingColorId(null);
  setColorName("");
  setColorHex("#000000");
};

// SAVE color (Add / Edit)
const handleSaveColor = async(e) => {
  e.preventDefault();

  if (!colorName.trim()) return alert("Enter color name!");
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(colorHex))
    return alert("Invalid hex code! Example: #ff6600");

  if (editingColorId) {
    // update
 
     try {
       const addColor=await api.post(`/admin/colors/update/${editingColorId}`,{
          colorname:colorName,
          hexcode:colorHex,
       }); 
       console.log("color adding status",addColor);
       if(addColor.data.status){
        alert(addColor.data.message)
          getColors();

       }else{
         alert(addColor.data.message)
           getColors();
       }

    } catch (error) {
        alert(error)
    }

  } else {
    // add new
    try {
       const addColor=await api.post("/admin/colors/add",{
          colorname:colorName,
          hexcode:colorHex,
       }); 
       console.log("color adding status",addColor);
       if(addColor.data.status){
        alert(addColor.data.message)
          getColors();

       }else{
         alert(addColor.data.message)
           getColors();
       }

    } catch (error) {
        alert(error)
    }

    setColors((prev) => [
      ...prev,
      { id: Date.now(), name: colorName, hex: colorHex },
    ]);
  }

  resetColorForm();
};

// EDIT color
const editColor = (c) => {
  console.log("color",c);
  setEditingColorId(c.id);
  setColorName(c.colorname);
  setColorHex(c.hexcode);
};

// DELETE color
const deleteColor = async(id) => {
  if (!confirm("Delete color?")) return;

  try {
      const color_delete=await api.delete(`/admin/colors/delete/${id}`);

      if(color_delete.data.status){
        alert(color_delete.data.message);
         getColors();
      }else{
          alert(color_delete.data.message);
           getColors();
      }

  } catch (error) {
      alert(error);
  }

  setColors((prev) => prev.filter((c) => c.id !== id));
};

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-screen-xl mx-auto">
        {/* header + tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Attributes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage attributes and colors</p>
          </div>

          <div className="flex items-center gap-3">
            <nav className="inline-flex bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 ${activeTab === "all" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              >
                All Attributes
              </button>
              <button
                onClick={() => setActiveTab("color")}
                className={`px-4 py-2 ${activeTab === "color" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              >
                Color
              </button>
            </nav>

            {/* small reference image preview */}
          
          </div>
        </div>

        {/* TAB PANELS */}
        <div>
          {activeTab === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LEFT: table + search (md:col-span-2) */}

               <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sticky top-6 h-fit" id="attribute-form">
                <h3 className="text-lg font-medium mb-3">{editingAttr ? "Edit Attribute" : "Add New Attribute"}</h3>

                <form onSubmit={handleSave} className="space-y-4">
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Attribute name"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
                  />

                  <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save
                  </button>

                  {editingAttr && (
                    <button type="button" onClick={() => { setEditingAttr(null); setFormName(""); }} className="w-full py-2 bg-gray-200 rounded-md">
                      Cancel
                    </button>
                  )}
                </form>

                {/* reference image (optional) */}
                
              </div>
                     {/* RIGHT: add/edit form */}
              <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                {/* SEARCH */}
                <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Search attributes..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border rounded-md w-full md:w-1/2 bg-white dark:bg-gray-900 dark:border-gray-700"
                  />

                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 text-left">#</th>
                        <th className="py-3 text-left">Name</th>
                        <th className="py-3 text-left">Values</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedData.map((attr, idx) => (
                        <tr key={attr.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">{startIndex + idx + 1}</td>

                          <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                            {attr.name}
                          </td>

                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              {attr.attributes.length === 0 ? (
                                <span className="text-xs text-gray-400">No values</span>
                              ) : (
                                attr.attributes.map((v) => <Badge key={v}>{v.name}</Badge>)
                              )}
                            </div>
                          </td>

                          <td className="py-3 text-right">
                            <div className="inline-flex gap-2">

                              {/* PRIMARY BUTTON: open values modal */}
                              <button
                                onClick={() => openValuesModal(attr)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                title="Add / Edit values"
                              >
                                {attr.name} Values
                              </button>

                              {/* Edit name */}
                              <button
                                onClick={() => handleEdit(attr)}
                                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                              >
                                ✎ Edit
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(attr.id)}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-500">
                            No attributes found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-600">
                    Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-md disabled:opacity-40"
                    >
                      Prev
                    </button>

                    {[...Array(totalPages).keys()].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num + 1)}
                        className={`px-3 py-1 border rounded-md ${currentPage === num + 1 ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-100"}`}
                      >
                        {num + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-md disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        {activeTab === "color" && (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
    <h3 className="text-lg font-medium mb-4">Color Management</h3>
    <p className="text-sm text-gray-500 mb-4">
      Add color name and hex code. No attribute linking.
    </p>

    {/* Add/Edit form */}
    <form onSubmit={handleSaveColor} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 items-end">
      <div className="md:col-span-1">
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">Color Name</label>
        <input
          type="text"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          placeholder="e.g. Sky Blue"
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">Hex Code</label>
        <input
          type="text"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          placeholder="#00aaff"
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">Pick Color</label>
        <input
          type="color"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          className="w-full h-10 border rounded-md"
        />
      </div>

      <div className="md:col-span-3 flex gap-2 mt-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          type="submit"
        >
          {editingColorId ? "Update" : "Add Color"}
        </button>

        {editingColorId && (
          <button
            type="button"
            onClick={resetColorForm}
            className="px-3 py-2 bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        )}
      </div>
    </form>

    {/* List of Colors */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {colors.map((c) => (
        <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md border"
              style={{ backgroundColor: c.hexcode }}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{c.colorname}</div>
              <div className="text-xs text-gray-500">{c.hexcode}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => editColor(c)}
              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
            >
              Edit
            </button>

            <button
              onClick={() => deleteColor(c.id)}
              className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Preview */}
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-2">Preview</h4>
      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 px-3 py-1 rounded-md"
            style={{ backgroundColor: c.hexcode }}
          >
            <span className="text-sm font-medium text-white">{c.colorname}</span>
          </div>
        ))}
      </div>
    </div>

    {/* reference image */}
   
  </div>
        )}

        </div>

        {/* Color editor inline modal (small) */}
        {colorEditAttr && (
          <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={cancelColorEdit} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full max-w-md">
              <h4 className="font-medium mb-2">Edit color for: {colorEditAttr.name}</h4>
              <div className="flex items-center gap-3">
                <input type="color" value={tempColor} onChange={(e) => setTempColor(e.target.value)} className="w-14 h-10 p-0 border rounded-md" />
                <input type="text" value={tempColor} onChange={(e) => setTempColor(e.target.value)} className="px-3 py-2 border rounded-md flex-1" />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={cancelColorEdit} className="px-3 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button onClick={() => { saveColorForAttr(); }} className="px-3 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* VALUES MODAL (shared) */}
        <Modal open={isValuesModalOpen} onClose={() => setValuesModalOpen(false)} title={`Values for "${getAttributeById(currentAttrId)?.name || ""}"`}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {currentAttrValues.length === 0 ? (
                <span className="text-sm text-gray-400">No values</span>
              ) : (
                currentAttrValues.map((v) => (
                  <Badge key={v} onRemove={() => setCurrentAttrValues(currentAttrValues.filter((x) => x !== v))}>
                    {v}
                  </Badge>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValueToModal(); }}} placeholder="Add value and press Add" className="flex-1 px-3 py-2 border rounded-md" />
              <button onClick={addValueToModal} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add</button>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setValuesModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
              <button onClick={saveValuesToAttribute} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Values</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

/* Helper used in Modal title: get attribute by id */
function getAttributeById(id) {
  // This function will be shadowed by the inner one in the component when used — kept here to satisfy linter references in some editors.
  return null;
}
