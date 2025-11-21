

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusCircle,
  Trash2,
  Edit3 as EditIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios"

const API_BASE = api.defaults.baseURL

function getToken() {
  // adjust if you use a different storage key
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
import BannersPage from "./BannersPage";

export default function SalesBanner() {
  // view mode: "sale" (default) shows the Sales Banners UI
  // "page" shows the Bannerpage (BannersPage component)
  const [viewMode, setViewMode] = useState("sale"); // "sale" | "page"

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // general action busy
  const [editing, setEditing] = useState(null); // normalized banner object or null
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", link: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // load on mount AND when switching to sale view
  useEffect(() => {
    if (viewMode === "sale") {
      void fetchBanners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ---- Fetch list ----
  const fetchBanners = async () => {
    const token = getToken();
    setLoading(true);
    const id = toast.loading("Loading banners...");
    try {
      const res = await fetch(`${API_BASE}/show-all-sales-banner`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await safeJson(res);
      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Failed to load banners (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      // response shapes vary; find array
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data?.data?.data)) list = data.data.data;
      else {
        const found = Object.values(data || {}).find((v) => Array.isArray(v));
        if (Array.isArray(found)) list = found;
      }

      // normalize
      const normalized = (list || []).map((b) => {
        const image_url = b.url || b.image_url || b.imageUrl || b.image || null;
        return {
          id: b.id ?? b.banner_id ?? b._id ?? null,
          title: b.title ?? "",
          subtitle: b.subtitle ?? "",
          link: b.link ?? b.redirect_url ?? b.redirectUrl ?? "",
          // discount/offer optional fields
          discount: b.discount ?? b.offer ?? "",
          imageUrl: image_url || "",
          raw: b,
        };
      });

      setBanners(normalized);
      toast.dismiss(id);
      toast.success("Banners loaded");
    } catch (err) {
      console.error("fetchBanners error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  // ---- Open Add / Edit ----
  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", link: "" });
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl || "");
    setShowModal(true);
  };

  // ---- File selector & preview ----
  const handleFile = (e) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview(editing?.imageUrl ?? "");
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(editing?.imageUrl ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Form handling ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.title || form.title.trim().length === 0) return "Title is required.";
    // optional: validate link if present
    return "";
  };

  // ---- Create / Update ----
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Not authenticated — token missing.");
      return;
    }

    setBusy(true);
    const actionId = toast.loading(editing ? "Updating banner..." : "Creating banner...");

    try {
      const fd = new FormData();
      fd.append("title", String(form.title ?? "").trim());
      fd.append("subtitle", String(form.subtitle ?? "").trim());
      fd.append("link", String(form.link ?? "").trim());

      if (imageFile) {
        fd.append("image", imageFile);
        fd.append("image_url", imageFile);
      }

      let res;
      if (editing && editing.id) {
        res = await fetch(`${API_BASE}/update-sales-banner/${editing.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });
      } else {
        // add endpoint per your curl
        res = await fetch(`${API_BASE}/add-sales-banner`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });
      }
      const data = await safeJson(res);
      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }

      if (data && data.status === false) {
        const msg = data.message || "Operation failed";
        toast.error(msg);
        throw new Error(msg);
      }

      toast.dismiss(actionId);
      toast.success(editing ? "Banner updated" : "Banner created");
      setShowModal(false);
      // refresh banners list
      await fetchBanners();
    } catch (err) {
      console.error("save banner error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to save banner");
    } finally {
      setBusy(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async (banner) => {
    if (!banner || !banner.id) {
      toast.error("Invalid banner selected");
      return;
    }
    if (!confirm("Delete this banner? This action cannot be undone.")) return;

    const token = getToken();
    if (!token) {
      toast.error("Not authenticated — token missing.");
      return;
    }

    setBusy(true);
    const idToast = toast.loading("Deleting banner...");
    try {
      const res = await fetch(`${API_BASE}/delete-sales-banner/${banner.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Delete failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }

      toast.dismiss(idToast);
      toast.success("Banner deleted");
      setBanners((prev) => prev.filter((b) => String(b.id) !== String(banner.id)));
      // refetch to ensure consistency
      await fetchBanners();
    } catch (err) {
      console.error("deleteBanner error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to delete banner");
    } finally {
      setBusy(false);
    }
  };

  const memoRows = useMemo(() => banners, [banners]);

  return (
    <div className="p-4">
      <Toaster position="top-right" />

      {/* Header with toggle */}
      <div className="flex items-center  mb-4">
        <div className="flex items-center gap-3">
          {/* Toggle buttons */}
          <div className="inline-flex rounded-md shadow-sm" role="tablist" aria-label="Banner view toggle">
            <button
              type="button"
              onClick={() => setViewMode("sale")}
              aria-pressed={viewMode === "sale"}
              className={
                "px-3 py-2 text-sm font-medium rounded-l-md border " +
                (viewMode === "sale" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200")
              }
            >
              Sales Banner
            </button>
            <button
              type="button"
              onClick={() => setViewMode("page")}
              aria-pressed={viewMode === "page"}
              className={
                "px-3 py-2 text-sm font-medium rounded-r-md border " +
                (viewMode === "page" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200")
              }
            >
           Header-Banner
            </button>
          </div>

          {/* Add Banner only when in sale view */}
          {viewMode === "sale" && (
            <button
              onClick={openAdd}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
            >
              <PlusCircle className="w-4 h-4" />
              Add Banner
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white border rounded-lg overflow-auto">
        {viewMode === "sale" ? (
          /* Sales banner table (unchanged functionality) */
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subtitle</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {memoRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500">
                    {loading ? "Loading..." : "No banners found"}
                  </td>
                </tr>
              ) : (
                memoRows.map((b) => (
                  <tr key={b.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-4 py-3">
                      {b.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.imageUrl} alt={b.title} className="h-12 w-28 object-cover rounded" />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ImageIcon className="w-5 h-5" /> No image
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium">{b.title || "—"}</td>
                    <td className="px-4 py-3">{b.subtitle || "—"}</td>
                    <td className="px-4 py-3">
                      {b.link ? (
                        <a href={b.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          {b.link}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          disabled={busy}
                          title="Edit"
                          className="p-2 rounded hover:bg-gray-100"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={busy}
                          title="Delete"
                          className="p-2 rounded hover:bg-gray-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* Bannerpage view: render the imported BannersPage component */
          <div className="p-4">
            <BannersPage />
          </div>
        )}
      </div>

      {/* Modal (unchanged) */}
      {showModal && viewMode === "sale" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Banner" : "Add Banner"}</h3>
              <div className="flex items-center gap-2">
                {busy && <div className="text-sm text-gray-500">Processing…</div>}
                <button onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-100">
                  Close
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Title *</div>
                  <input name="title" value={form.title} onChange={handleChange} className="w-full p-2 border rounded" required />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Link (optional)</div>
                  <input name="link" value={form.link} onChange={handleChange} className="w-full p-2 border rounded" placeholder="https://..." />
                </label>

                <label className="md:col-span-2 space-y-1">
                  <div className="text-sm text-gray-600">Subtitle</div>
                  <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full p-2 border rounded" />
                </label>

                <label className="md:col-span-2 space-y-1">
                  <div className="text-sm text-gray-600">Image {editing ? "(optional to replace)" : "(optional)"}</div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="w-full p-2 border rounded" />
                  {imagePreview ? (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="preview" className="h-20 w-40 object-cover rounded border" />
                      <button type="button" onClick={clearImageSelection} className="text-sm text-red-600 underline">
                        Clear selection
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">No image chosen</div>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2 p-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded border">
                  Cancel
                </button>
                <button disabled={busy} type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">
                  {busy ? "Saving…" : editing ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
