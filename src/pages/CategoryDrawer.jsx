import React, { useEffect, useMemo, useState } from "react";
import { X, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { IMAGES } from "../assets/images";

/**
 * Props (same as before):
 * - isOpen, close,
 * - catForm, setCatForm,
 * - catFileRef, handleCatImageChange,
 * - submitCategory, catSubmitting,
 * - catEditingId, setCatEditingId,
 * - catFile, setCatFile,
 * - catLoading, categories,
 * - openCatEdit, fetchCategories
 */
export default function CategoryDrawer({
  isOpen,
  close,
  catForm,
  setCatForm,
  catFileRef,
  handleCatImageChange,
  submitCategory,
  catSubmitting,
  catEditingId,
  setCatEditingId,
  catFile,
  setCatFile,
  catLoading,
  categories = [],
  openCatEdit,
  fetchCategories,
}) {
  // local pagination + search state
  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(5);

  // derived filtered list and totals
  const filteredCategories = useMemo(() => {
    const q = String(catSearch || "").trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      return (
        String(c.name ?? "").toLowerCase().includes(q) ||
        String(c.id ?? "").toLowerCase().includes(q)
      );
    });
  }, [categories, catSearch]);

  const catTotalPages = Math.max(1, Math.ceil(filteredCategories.length / catPageSize));

  // keep page valid when filters change
  useEffect(() => {
    if (catPage > catTotalPages) setCatPage(catTotalPages);
  }, [catTotalPages, catPage]);

  // small helpers
  const onResetNew = () => {
    setCatEditingId(null);
    setCatForm({ name: "", imagePreview: "" });
    setCatFile(null);
    if (catFileRef?.current) {
      try { catFileRef.current.value = ""; } catch {}
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete category?")) return;
    try {
      await api.delete(`/admin/categories/delete/${id}`);
      toast.success("Category deleted");
      if (typeof fetchCategories === "function") await fetchCategories();
    } catch (err) {
      console.error("Delete category failed", err);
      toast.error("Delete failed");
    }
  };

  if (!isOpen) return null;

  // page slice for rendering
  const visibleCats = filteredCategories.slice((catPage - 1) * catPageSize, catPage * catPageSize);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Category management">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className="fixed top-0 right-0 h-screen bg-white shadow-2xl overflow-auto rounded-l-2xl transform transition-transform duration-300 ease-in-out md:w-96 w-full"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-start justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">Categories</h3>
          <button
            onClick={close}
            className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100"
            aria-label="Close categories"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={submitCategory} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={catForm.name}
                onChange={(e) => setCatForm((s) => ({ ...s, name: e.target.value }))}
                className="block w-full border rounded-md p-2"
                placeholder="e.g. Beverages"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Image {catEditingId ? "(optional to replace)" : "(required)"}
              </label>

              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-100 border flex items-center justify-center">
                  {catForm.imagePreview ? (
                    <img
                      src={catForm.imagePreview}
                      alt={catForm.name || "preview"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    ref={catFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCatImageChange}
                    className="block w-full text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-2">Max 2MB. Square images work best.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {catEditingId && (
                <button
                  type="button"
                  onClick={onResetNew}
                  className="px-3 py-2 rounded-md border"
                >
                  New
                </button>
              )}

              <button
                type="submit"
                disabled={catSubmitting}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {catSubmitting ? (catEditingId ? "Saving..." : "Creating...") : (catEditingId ? "Save" : "Create")}
              </button>
            </div>
          </form>

          {/* Search + page size */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Available categories</div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={catSearch}
                onChange={(e) => { setCatSearch(e.target.value); setCatPage(1); }}
                placeholder="Search categories..."
                className="px-2 py-1 border rounded-md text-sm w-44"
                aria-label="Search categories"
              />

              <select
                value={catPageSize}
                onChange={(e) => { setCatPageSize(Number(e.target.value)); setCatPage(1); }}
                className="px-2 py-1 border rounded-md text-sm"
                aria-label="Categories per page"
              >
                <option value={5}>5 </option>
                <option value={10}>10 </option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {catLoading ? (
              <div className="text-sm text-slate-500">Loading categories…</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-sm text-slate-500">No categories found.</div>
            ) : (
              visibleCats.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-2 rounded border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border flex-shrink-0">
                      <img
                        src={c.image_url ?? IMAGES.DummyImage}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGES.DummyImage; }}
                      />
                    </div>
                    <div className="text-sm text-slate-800 truncate">{c.name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCatEdit(c)}
                      className="px-2 py-1 rounded border hover:bg-slate-50"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="px-2 py-1 rounded border hover:bg-red-50"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {filteredCategories.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <strong>{filteredCategories.length === 0 ? 0 : (catPage - 1) * catPageSize + 1}</strong> -
                <strong> {Math.min(filteredCategories.length, catPage * catPageSize)}</strong> of <strong>{filteredCategories.length}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded-md"
                  disabled={catPage === 1}
                >
                  Prev
                </button>

                <div className="inline-flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const total = catTotalPages;
                    const maxButtons = 7;
                    let start = Math.max(1, catPage - Math.floor(maxButtons / 2));
                    let end = start + maxButtons - 1;
                    if (end > total) {
                      end = total;
                      start = Math.max(1, end - maxButtons + 1);
                    }
                    for (let p = start; p <= end; p++) {
                      pages.push(
                        <button
                          key={p}
                          onClick={() => setCatPage(p)}
                          className={`px-3 py-1 rounded-md border ${p === catPage ? "bg-indigo-600 text-white" : "bg-white"}`}
                        >
                          {p}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => setCatPage((p) => Math.min(catTotalPages, p + 1))}
                  className="px-3 py-1 border rounded-md"
                  disabled={catPage === catTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
