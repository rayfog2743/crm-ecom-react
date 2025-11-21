import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react"; // or your icon import
import Button from "@/components/ui/Button"; // adjust if needed
import IMAGES from "@/constants/images"; // dummy image path constant if you have

/**
 * ProductDrawer
 *
 * Props:
 *  - isOpen (bool)
 *  - onClose () => void
 *  - onSubmit (formData) => Promise or void
 *  - initialData (object) optional for edit mode
 *  - categories (array)
 *  - shopAttributes (array) { id, name, active }
 *  - toggleShopAttr (fn) => toggles attribute active state in parent (or can be internal)
 *  - formVariants (array)
 *  - existingExtraImages (array) - objects { id, url }
 *  - isSubmitting (bool)
 */
export default function ProductDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  categories = [],
  shopAttributes = [],
  toggleShopAttr = () => {},
  formVariants = [],
  existingExtraImages = [],
  isSubmitting = false,
}) {
  // refs
  const firstInputRef = useRef(null);
  const descInputRef = useRef(null);
  const drawerRef = useRef(null);

  // form state
  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    category: "",
    discount_price: "",
    sku: "",
    description: "",
    video_url: "",
    image: "", // url or local preview
    imageFile: null, // file object
    additionalFiles: [], // File[]
    ...initialData,
  });

  // previews for additional images (local)
  const [newExtraPreviews, setNewExtraPreviews] = useState([]);
  const [existingExtra, setExistingExtra] = useState(existingExtraImages || []);
  const [errors, setErrors] = useState({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // sync initialData when changed from parent
  useEffect(() => {
    setForm((f) => ({ ...f, ...initialData }));
    setExistingExtra(existingExtraImages || []);
  }, [initialData, existingExtraImages]);

  // focus first input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 120);
    } else {
      // reset some internal UI when closing
      setIsEditorOpen(false);
    }
  }, [isOpen]);

  // reset form helper
  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      price: "",
      category: "",
      discount_price: "",
      sku: "",
      description: "",
      video_url: "",
      image: "",
      imageFile: null,
      additionalFiles: [],
    });
    setNewExtraPreviews([]);
    setExistingExtra(existingExtraImages || []);
    setErrors({});
  };

  // handlers
  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((s) => ({ ...s, imageFile: f, image: URL.createObjectURL(f) }));
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((f) => URL.createObjectURL(f));
    setForm((s) => ({ ...s, additionalFiles: [...s.additionalFiles, ...files] }));
    setNewExtraPreviews((p) => [...p, ...previews]);
  };

  const removeExistingExtraByIndex = (idx) => {
    const copy = [...existingExtra];
    copy.splice(idx, 1);
    setExistingExtra(copy);
    // caller should sync with parent on submit to delete these images
  };

  const removeNewExtraAt = (idx) => {
    const copyFiles = [...form.additionalFiles];
    copyFiles.splice(idx, 1);
    setForm((s) => ({ ...s, additionalFiles: copyFiles }));

    const copyPreviews = [...newExtraPreviews];
    // revoke object URL for cleanup
    URL.revokeObjectURL(copyPreviews[idx]);
    copyPreviews.splice(idx, 1);
    setNewExtraPreviews(copyPreviews);
  };

  const handleToggleAttr = (id) => {
    toggleShopAttr(id);
  };

  const validate = () => {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = "Product name is required";
    if (!form.price || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Valid price is required";
    if (!form.category) e.category = "Category is required";
    if (!form.description || !form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    if (!validate()) return;

    // formData: file uploads + json fields
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("price", form.price);
    payload.append("category", form.category);
    payload.append("discount_price", form.discount_price || "");
    payload.append("sku", form.sku || "");
    payload.append("description", form.description || "");
    payload.append("video_url", form.video_url || "");
    // main image file if exists
    if (form.imageFile) payload.append("image", form.imageFile);

    // additional new images
    (form.additionalFiles || []).forEach((f, i) => payload.append(`additional_images[]`, f));

    // send list of existing extra images to keep (IDs or urls depending on your backend)
    payload.append("existing_extra_images", JSON.stringify(existingExtra));

    // call parent onSubmit which may return a promise
    try {
      await onSubmit(payload);
      // after successful submit close drawer & reset
      resetForm();
      onClose?.();
    } catch (err) {
      // If backend returns validation errors, parent should pass them back via props or throw
      // Here, try to parse error shape (optional)
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        // small fallback
        console.error(err);
      }
    }
  };

  // keyboard: close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        resetForm();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          resetForm();
          onClose();
        }}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        className="fixed top-0 right-0 h-screen bg-white shadow-2xl overflow-auto rounded-l-2xl transform transition-transform duration-300 ease-in-out w-full lg:w-[50%]"
      >
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">{initialData?.id ? "Edit Product" : "Add Product"}</h3>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            aria-label="Close drawer"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={submit} className="space-y-4 w-full">
            <div className="flex flex-wrap gap-4">
              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`block w-full border rounded-md p-2 focus:outline-none ${errors.name ? "border-red-400" : "border-slate-200"}`}
                  placeholder="e.g. Shimla Apple"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className={`block w-full border rounded-md p-2 ${errors.price ? "border-red-400" : "border-slate-200"}`}
                  placeholder="1000.00"
                />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={`block w-full border rounded-md p-2 ${errors.category ? "border-red-400" : "border-slate-200"}`}
                >
                  <option value="">-- Select category (id) --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">Discount Price</label>
                <input
                  value={form.discount_price}
                  onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))}
                  className="block w-full border rounded-md p-2"
                  placeholder="800.00"
                />
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">SKU Code</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="block w-full border rounded-md p-2"
                  placeholder="e.g. SKU-12345"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={descInputRef}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  onFocus={() => setIsEditorOpen(true)}
                  placeholder="Click to edit description (rich text)"
                  rows={4}
                  className={`block w-full border rounded-md p-2 focus:outline-none resize-none ${errors.description ? "border-red-400" : "border-slate-200"}`}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <input
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  className="block w-full border rounded-md p-2"
                  placeholder="https://www.youtube.com/watch?v="
                />
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">Upload Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm" />
                {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
              </div>

              <div className="w-[30%] min-w-[220px]">
                <label className="block text-sm font-medium mb-1">Additional images</label>
                <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} className="block w-full text-sm" />
              </div>

              {/* main image preview + variants (readonly) */}
              <div className="w-full mt-2">
                {(form.image || form.imageFile) && (
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px" }}>
                    <div className="w-full lg:w-1/2 flex flex-col">
                      <div className="mt-1 flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold">Variants (readonly)</h4>
                          <div className="flex items-center gap-2" />
                        </div>

                        <div className="space-y-2">
                          {formVariants.length === 0 ? (
                            <div className="text-sm text-slate-500">No variants for this product.</div>
                          ) : (
                            formVariants.map((v, idx) => (
                              <div key={v.id ?? idx} className="p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                                <div className="flex flex-col">
                                  <div className="text-sm">
                                    {v.label ? `${v.label} — ₹ ${v.price ?? "-"}` : null}
                                    {v.color ? `${v.color} ${v.size ? `(${v.size})` : ""} — ₹ ${v.price ?? "-"}` : null}
                                    {v.grams ? `${v.grams} — ₹ ${v.price ?? "-"}` : null}
                                    {!v.label && !v.color && !v.grams && <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(v)}</pre>}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-24 h-24 rounded-md overflow-hidden border">
                      <img
                        src={String(form.image) || IMAGES.DummyImage}
                        alt="main-preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = IMAGES.DummyImage;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shop Attributes UI */}
              <div className="w-full">
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium"> Variants</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {shopAttributes.length === 0 ? (
                      <div className="text-sm text-slate-500 col-span-3">No shop attributes available in VariantContext.</div>
                    ) : (
                      shopAttributes.map((a) => (
                        <label key={String(a.id)} className="flex items-center gap-2 p-2 rounded border bg-white">
                          <input type="checkbox" checked={!!a.active} onChange={() => handleToggleAttr(a.id)} className="h-4 w-4" />
                          <div className="flex-1 text-sm">{a.name}</div>
                          <div
                            className={`text-xs px-2 py-1 rounded ${a.active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-500 border border-slate-100"}`}
                          >
                            {a.active ? "Active" : "Inactive"}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Additional images preview */}
              <div className="w-full flex flex-col lg:flex-row items-stretch gap-6 mt-4">
                <div className="w-full lg:w-1/2 flex flex-col">
                  <div className="border rounded-md p-3 bg-gray-50 flex-1">
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Additional images Preview</div>
                      <div className="grid grid-cols-3 gap-2">
                        {existingExtra.map((img, idx) => (
                          <div key={String(img.id ?? img.url)} className="relative w-full h-20 rounded-md overflow-hidden border">
                            <img
                              src={/^https?:\/\//.test(img.url) ? img.url : img.url}
                              alt={`extra-${idx}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = IMAGES.DummyImage;
                              }}
                            />
                            <button type="button" onClick={() => removeExistingExtraByIndex(idx)} className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-white" title="Remove">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {newExtraPreviews.map((p, idx) => (
                          <div key={idx} className="relative w-full h-20 rounded-md overflow-hidden border">
                            <img src={p} alt={`new-extra-${idx}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeNewExtraAt(idx)} className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-white" title="Remove">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {existingExtra.length === 0 && newExtraPreviews.length === 0 && <div className="col-span-3 text-xs text-slate-400">No additional images</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { resetForm(); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (initialData?.id ? "Saving..." : "Adding...") : initialData?.id ? "Save" : "Add Product"}
              </Button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}

ProductDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  categories: PropTypes.array,
  shopAttributes: PropTypes.array,
  toggleShopAttr: PropTypes.func,
  formVariants: PropTypes.array,
  existingExtraImages: PropTypes.array,
  isSubmitting: PropTypes.bool,
};
