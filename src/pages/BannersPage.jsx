

// components/BannersPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusCircle,
  Trash2,
  Edit3 as EditIcon,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// const API_BASE = "https://9nutsapi.nearbydoctors.in/public/api";
const API_BASE = "https://api-rayfog.nearbydoctors.in/public/api";
const TOKEN_KEY = localStorage.getItem("token"); // change if your app uses a different storage key

function getToken() {
  return localStorage.getItem("token") || "";
}

function safeJson(res) {
  return res.json().catch(() => null);
}

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // general action busy
  const [editing, setEditing] = useState(null); // banner being edited (object) or null
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", discount: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // Load banners
  useEffect(() => {
    void fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not logged in — token missing.");
      return;
    }

    setLoading(true);
    const id = toast.loading("Loading banners...");
    try {
      const res = await fetch(`${API_BASE}/admin/banners`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Failed to load banners (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.banners)) list = data.banners;
      else if (Array.isArray(data?.profile)) list = data.profile;
      else {
        // Try to find first array in response
        const found = Object.values(data || {}).find((v) => Array.isArray(v));
        if (Array.isArray(found)) list = found;
      }

      // Map to consistent shape --- IMPORTANT: include redirect_url and derive a single imageUrl field
      const normalized = (list || []).map((b) => {
        // possible fields coming from various APIs
        const redirect = b.redirect_url || b.redirectUrl || b.redirect || b.redirectUrlString || null;
        const image_url = b.image_url || b.imageUrl || b.image || null;
        // Prefer redirect (fully-qualified URL) if present, otherwise fall back to image_url
        const imageUrl = redirect || image_url || "";

        return {
          id: b.id ?? b.banner_id ?? b._id,
          title: b.title ?? "",
          subtitle: b.subtitle ?? "",
          discount: b.discount ?? b.offer ?? "",
          // keep both for safety: imageUrl is the normalized field your UI should use
          imageUrl,
          // preserve raw redirect_url too (so any other code expecting it still works)
          redirect_url: redirect,
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

  // Open modal for add (null) or edit (banner)
  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", discount: "" });
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };
  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      discount: banner.discount || "",
    });
    setImageFile(null);
    // Use normalized imageUrl for preview
    setImagePreview(banner.imageUrl || "");
    setShowModal(true);
  };

  // Handle file selection & preview
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

  // form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // validation
  const validate = () => {
    if (!form.title || form.title.trim().length === 0) return "Title is required.";
    // discount optional (but if present must be numeric)
    if (form.discount && isNaN(Number(form.discount))) return "Discount must be a number.";
    return "";
  };

  // Create or Update
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Session expired — please login again.");
      return;
    }

    setBusy(true);
    const actionToastId = toast.loading(editing ? "Updating banner..." : "Creating banner...");

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", String(form.subtitle ?? "").trim());
      fd.append("discount", String(form.discount ?? "").trim());

      // append image only if selected
      if (imageFile) fd.append("image", imageFile);

      let res;
      if (editing) {
        // update route: POST /admin/banners/update/:id  (per your curl)
        res = await fetch(`${API_BASE}/admin/banners/update/${editing.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type for FormData
          },
          body: fd,
        });
      } else {
        // add route
        res = await fetch(`${API_BASE}/admin/banners/add`, {
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

      toast.dismiss(actionToastId);
      toast.success(editing ? "Banner updated" : "Banner created");
      setShowModal(false);
      // refresh list
      await fetchBanners();
    } catch (err) {
      console.error("saveBanner error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to save banner");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (banner) => {
    if (!banner || !banner.id) {
      toast.error("Invalid banner");
      return;
    }
    if (!confirm("Delete this banner? This action cannot be undone.")) return;

    const token = getToken();
    if (!token) {
      toast.error("Session expired — please login again.");
      return;
    }

    setBusy(true);
    const idToast = toast.loading("Deleting banner...");
    try {
      const res = await fetch(`${API_BASE}/admin/banners/delete/${banner.id}`, {
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
      // optionally refetch
      await fetchBanners();
    } catch (err) {
      console.error("deleteBanner error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to delete banner");
    } finally {
      setBusy(false);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(editing?.imageUrl ?? "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const refresh = async () => {
    await fetchBanners();
  };

  const memoRows = useMemo(() => banners, [banners]);

  return (
    <div className="p-4">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Banners</h1>
        <div className="flex items-center gap-2">
          {/* <button
            onClick={refresh}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"
            title="Refresh"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button> */}

          <button
            onClick={openAdd}
            disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Banner
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Subtitle</th>
              <th className="px-4 py-3">Discount</th>
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
                    {/* Use normalized imageUrl field (this fixes missing images when API returned redirect_url)
                        If still empty show placeholder. */}
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
                  <td className="px-4 py-3">{b.discount || "—"}</td>

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
      </div>

      {/* Modal */}
      {showModal && (
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
                  <div className="text-sm text-gray-600">Discount</div>
                  <input name="discount" value={form.discount} onChange={handleChange} className="w-full p-2 border rounded" placeholder="numeric or percent value" />
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
