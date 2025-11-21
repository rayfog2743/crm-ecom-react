import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import AddVariationModal from "../components/AddVariationModal";

// ---------- STATIC DATA (kept for product info/demo) ----------
const STATIC_DATA = {
  product: {
    id: 1,
    name: "Classic T-Shirt",
    short_code: "TS",
    base_price: 499,
  },
};

export default function ShopSettings() {
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [variations, setVariations] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [editingVarId, setEditingVarId] = useState(null);
  const [editingVarName, setEditingVarName] = useState("");

  // search + pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(4); // items per page (global)

  // pageMap will be set after we fetch variations
  const [pageMap, setPageMap] = useState({});

  // editing state for attributes
  const [editingAttrId, setEditingAttrId] = useState(null);
  const [editingAttrValue, setEditingAttrValue] = useState("");

  // Normalize helper
  const normalize = (s = "") => String(s ?? "").trim().toLowerCase();

  // Fetch variations from API
  const fetchVariations = async () => {
    try {
      const res = await api.get("/admin/variation");
      // adjust if your API returns { data: [...] }
      console.log("variation",res);
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setVariations(list);

      // initialize pageMap for each variation if not set
      setPageMap((prev) => {
        const next = { ...prev };
        for (const v of list) {
          if (!next[v.id]) next[v.id] = 1;
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch variations", err);
      // fallback: keep existing variations (or show notification)
    }
  };

  // Fetch attributes from API
  const fetchAttributes = async () => {
    try {
      const res = await api.get("/admin/attributes"); // change endpoint if different
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAttributes(list);
    } catch (err) {
      console.error("Failed to fetch attributes", err);
    }
  };

  // initial load
  useEffect(() => {
    fetchVariations();
    fetchAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtered attributes memoized by searchTerm & attributes
  const filteredByVariation = useMemo(() => {
    const term = normalize(searchTerm);
    const map = {};
    for (const v of variations) {
      const list = attributes.filter((a) => a.variation_id === v.id);
      map[v.id] = term ? list.filter((a) => normalize(a.value).includes(term)) : list;
    }
    return map; // { variationId: [attrs...] }
  }, [attributes, variations, searchTerm]);

  // pagination helpers
  const getTotalPages = (variationId) => {
    const total = (filteredByVariation[variationId] || []).length;
    return Math.max(1, Math.ceil(total / pageSize));
  };

  const setPageFor = (variationId, page) => {
    const total = getTotalPages(variationId);
    const p = Math.max(1, Math.min(page, total));
    setPageMap((prev) => ({ ...prev, [variationId]: p }));
  };

  const getPageItems = (variationId) => {
    const list = filteredByVariation[variationId] || [];
    const page = pageMap[variationId] || 1;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };


const handleVariationSave = async (payload) => {
  console.log("Parent -> raw payload:", payload);

  const id = payload?.id ?? null;
  const name = String(payload?.name ?? "").trim();

  if (!name) {
    alert("Name is required");
    return;
  }

  try {
    if (id) {
      // Update
      await api.post(`/admin/variation/update/${id}`, { name });
    } else {
      // Add
      await api.post("/admin/variation/add", { name });
    }

    await fetchVariations();
    await fetchAttributes();

    setIsVarModalOpen(false);
    setEditingVarId(null);
    setEditingVarName("");
  } catch (err) {
    console.error("Save failed:", err?.response || err);
    alert("Save failed — check console/network.");
  }
};








  const addAttribute = async (variationId) => {
  // same prompt UI you used before
  const value = prompt("Enter attribute value:");
  if (!value) return;

  // build FormData expected by your backend:
  // variation_id, attribute_name (and optionally price/image if you add them later)
  const fd = new FormData();
  fd.append("variation_id", String(variationId));
  fd.append("attribute_name", String(value).trim());

  try {
    // POST to your Laravel endpoint
    const res = await api.post("/admin/attributes/add", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // normalize created item from possible response shapes
    // Laravel examples often return created item in res.data or res.data.data
    const created = res?.data?.data ?? res?.data ?? null;

    // build a fallback attribute object if server returned something unexpected
    const newAttr = {
      id: created?.id ?? Date.now(), // fallback id
      variation_id: created?.variation_id ?? variationId,
      value: created?.value ?? created?.attribute_name ?? value.trim(),
      price: created?.price ?? null,
      image_url: created?.image_url ?? created?.image ?? null,
    };

    // append to local attributes state so UI updates immediately
    setAttributes((prev) => [...prev, newAttr]);

    // compute where the new item will appear and move pagination to that last page
    // note: filteredByVariation is memoized from attributes state (old value),
    // so use the previous count + 1 (that's why we compute from filteredByVariation now).
    const prevList = filteredByVariation[variationId] || [];
    const totalAfter = prevList.length + 1;
    const lastPage = Math.max(1, Math.ceil(totalAfter / pageSize));
    setPageMap((pm) => ({ ...pm, [variationId]: lastPage }));

    // optional: notify user
    // alert("Attribute added");
  } catch (err) {
    console.error("addAttribute error:", err);
    // basic user feedback
    alert("Failed to add attribute. See console for details.");
  }
};


  // Inline edit attribute (local only)
  const startEditAttribute = (attr) => {
    setEditingAttrId(attr.id);
    setEditingAttrValue(attr.attribute_name);
  };

  const saveEditAttribute_old = (attrId) => {
    alert(attrId);
    const trimmed = String(editingAttrValue ?? "").trim();
    if (!trimmed) {
      alert("Attribute value cannot be empty.");
      return;
    }
    setAttributes((prev) => prev.map((a) => (a.id === attrId ? { ...a, value: trimmed } : a)));
    setEditingAttrId(null);
    setEditingAttrValue("");
  };

  const saveEditAttribute = async (attrId) => {
  // quick validation
  const trimmed = String(editingAttrValue ?? "").trim();
  if (!trimmed) {
    alert("Attribute value cannot be empty.");
    return;
  }

  // find current attribute (for rollback)
  const prevAttr = attributes.find((a) => a.id === attrId);
  const prevValue = prevAttr ? prevAttr.value : null;

  // optimistic update: update local state immediately
  setAttributes((prev) =>
    prev.map((a) => (a.id === attrId ? { ...a, attribute_name: trimmed } : a))
  );

  // clear UI edit state early for smooth UX
  setEditingAttrId(null);
  setEditingAttrValue("");

  try {
    // If your API accepts JSON:
    await api.post(`/admin/attributes/update/${attrId}`, { attribute_name: trimmed });


    console.log("Attribute updated on server:", attrId);
  } catch (err) {
    // rollback local state
    console.error("Failed to save attribute:", err?.response || err);
    alert("Failed to save attribute. Reverting change.");

    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId ? { ...a, value: prevValue ?? a.value } : a
      )
    );
  }
};


  const cancelEditAttribute = () => {
    setEditingAttrId(null);
    setEditingAttrValue("");
  };


const removeAttribute = async (id) => {
  // 1. ALWAYS convert id to number
  id = Number(id);

  if (!id) {
    alert("Invalid attribute ID");
    return;
  }

  if (!window.confirm("Remove attribute?")) return;

  // 2. Find the attribute locally (for rollback)
  const target = attributes.find((a) => Number(a.id) === id);
  if (!target) {
    alert("Attribute not found");
    return;
  }

  const variationId = Number(target.variation_id);

  // 3. Optimistic UI update
  const prevAttributes = [...attributes];
  setAttributes((prev) => prev.filter((a) => Number(a.id) !== id));

  try {
    // 4. API call – CHANGE URL to match your backend
    await api.delete(`/admin/attributes/delete/${id}`);

    console.log("Deleted attribute:", id);
  } catch (error) {
    console.error("Delete failed:", error?.response || error);

    // 5. Rollback on failure
    setAttributes(prevAttributes);

    alert("Failed to delete attribute – rolled back.");
  }
};





  return (
    <div className="p-6 space-y-6">
      {/* PAGE TITLE + SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-4">
        <h2 className="text-2xl font-semibold flex-1">
          Variant Manager – {STATIC_DATA.product.name}
        </h2>

        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <input
            type="search"
            placeholder="Search attributes (e.g. 'Red', 'M')"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // reset pages to 1 on search
              setPageMap((pm) =>
                Object.fromEntries(variations.map((v) => [v.id, 1]))
              );
            }}
            className="border rounded px-3 py-2 text-sm w-64"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10) || 4;
                setPageSize(newSize);
                // clamp current pages
                setPageMap((pm) => {
                  const next = { ...pm };
                  for (const v of variations) {
                    const total = Math.max(1, Math.ceil((filteredByVariation[v.id] || []).length / newSize));
                    next[v.id] = Math.min(Math.max(1, next[v.id] || 1), total);
                  }
                  return next;
                });
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: VARIATIONS */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Variations</h3>
            <button
              className="p-1 border rounded"
              onClick={() => {
                setEditingVarId(null);
                setEditingVarName("");
                setIsVarModalOpen(true);
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {variations.map((v) => {
            const totalPages = getTotalPages(v.id);
            const page = pageMap[v.id] || 1;
            const pageItems = getPageItems(v.id);

            return (
              <div key={v.id} className="mb-4 border p-3 bg-white rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{v.name}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingVarId(v.id);
                        setEditingVarName(v.name);
                        setIsVarModalOpen(true);
                      }}
                      className="text-xs px-2 py-1 border rounded"
                      title="Edit variation name"
                    >
                      Edit
                    </button>
                    <span className="text-xs text-slate-500">{(filteredByVariation[v.id] || []).length} items</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1 min-h-[48px]">
                  {pageItems.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No matching attributes.</div>
                  ) : (
                    pageItems.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm bg-gray-100 p-1 rounded">
                        <div className="flex items-center gap-2">
                          {editingAttrId === a.id ? (
                            <input
                              value={editingAttrValue}
                              onChange={(e) => setEditingAttrValue(e.target.value)}
                              className="border px-2 py-1 text-sm rounded"
                            />
                          ) : (
                            <span> {a.attribute_name}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {editingAttrId === a.id ? (
                            <>
                              <button
                                onClick={() => saveEditAttribute(a.id)}
                                className="text-xs px-2 py-1 bg-emerald-600 text-white rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditAttribute}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditAttribute(a)}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                Edit
                              </button>
                              <button onClick={() => removeAttribute(a.id)}>
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => setPageFor(v.id, page - 1)}
                      disabled={page <= 1}
                      className="px-2 py-1 mr-2 border rounded text-sm disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPageFor(v.id, page + 1)}
                      disabled={page >= totalPages}
                      className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>

                  <div className="text-xs text-slate-600">
                    Page {page} / {totalPages}
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    className="mt-2 text-xs px-2 py-1 border rounded"
                    onClick={() => addAttribute(v.id)}
                  >
                    Add {v.name} - {v.id}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: ATTRIBUTES OVERVIEW */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-lg mb-3">Attributes Overview</h3>

          {variations.map((v) => {
            const page = pageMap[v.id] || 1;
            const pageItems = getPageItems(v.id);
            const total = (filteredByVariation[v.id] || []).length;

            return (
              <div key={v.id} className="mb-4 bg-white border rounded p-3">
                <h4 className="font-semibold text-sm mb-2">• {v.name}</h4>

                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {pageItems.length === 0 ? (
                    <div className="text-sm text-gray-500">No matching attributes.</div>
                  ) : (
                    pageItems.map((a) => (
                      <span
                        key={a.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {a.attribute_name}
                      </span>
                    ))
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-600">{total} total</div>
                  <div className="text-xs text-slate-600">Page {page} / {getTotalPages(v.id)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddVariationModal
        open={isVarModalOpen}
        onClose={() => setIsVarModalOpen(false)}
        onSave={(name) => handleVariationSave({ id: editingVarId, name })}
        // if your modal needs defaultName:
        editingId={editingVarId}
        defaultName={editingVarName}
      />
    </div>
  );
}
