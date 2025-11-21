import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button"; // keep if you have this; otherwise swap with native button

export default function VariantModal({ isOpen, open, onClose, initial = {} }) {
  // accept either `isOpen` or `open` prop so it's resilient to caller naming
  const visible = isOpen ?? open;
  const [tab, setTab] = useState("size");
  const [variantSizes, setVariantSizes] = useState((initial.size ?? []).map((v) => normalizeEntry(v)));
  const [variantColors, setVariantColors] = useState((initial.color ?? []).map((v) => normalizeEntry(v)));
  const [variantWeights, setVariantWeights] = useState((initial.weight ?? []).map((v) => normalizeEntry(v)));

  useEffect(() => {
    // initialize whenever modal opens or initial data changes
    if (visible) {
      setVariantSizes((initial.size ?? []).map((v) => normalizeEntry(v)));
      setVariantColors((initial.color ?? []).map((v) => normalizeEntry(v)));
      setVariantWeights((initial.weight ?? []).map((v) => normalizeEntry(v)));
      setTab("size");
    }
  }, [visible, initial]);

  function normalizeEntry(raw) {
    if (!raw) return { id: undefined, value: "", price: "", imageFile: null, imagePreview: "" };
    return {
      id: raw.id ?? raw._id ?? undefined,
      value: String(raw.value ?? raw.attribute_name ?? raw.size ?? ""),
      price: String(raw.price ?? raw.amount ?? ""),
      imageFile: null,
      imagePreview: raw.image_url ?? raw.image ?? raw.imagePreview ?? "",
    };
  }

  const addVariantEntry = (type) => {
    const empty = { id: undefined, value: "", price: "", imageFile: null, imagePreview: "" };
    if (type === "size") setVariantSizes((p) => [...p, { ...empty }]);
    if (type === "color") setVariantColors((p) => [...p, { ...empty }]);
    if (type === "weight") setVariantWeights((p) => [...p, { ...empty }]);
  };

  const removeVariantEntry = (type, index) => {
    if (type === "size") setVariantSizes((p) => p.filter((_, i) => i !== index));
    if (type === "color") setVariantColors((p) => p.filter((_, i) => i !== index));
    if (type === "weight") setVariantWeights((p) => p.filter((_, i) => i !== index));
  };

  const handleVariantChange = (type, index, key, val) => {
    const updater = (arr) => arr.map((it, i) => (i === index ? { ...it, [key]: val } : it));
    if (type === "size") setVariantSizes((p) => updater(p));
    if (type === "color") setVariantColors((p) => updater(p));
    if (type === "weight") setVariantWeights((p) => updater(p));
  };

  const handleVariantImageChange = (type, index, ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) {
      // clear
      handleVariantChange(type, index, "imageFile", null);
      handleVariantChange(type, index, "imagePreview", "");
      try {
        ev.currentTarget.value = "";
      } catch {}
      return;
    }
    if (!file.type?.startsWith?.("image/")) {
      toast.error("Please select an image file.");
      try {
        ev.currentTarget.value = "";
      } catch {}
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2MB).");
      try {
        ev.currentTarget.value = "";
      } catch {}
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result ?? "");
      handleVariantChange(type, index, "imageFile", file);
      handleVariantChange(type, index, "imagePreview", preview);
    };
    reader.readAsDataURL(file);
    try {
      ev.currentTarget.value = "";
    } catch {}
  };

  const saveVariants = () => {
    // filter empty values and keep only meaningful entries
    setVariantSizes((prev) => prev.filter((v) => String(v.value ?? "").trim() !== ""));
    setVariantWeights((prev) => prev.filter((v) => String(v.value ?? "").trim() !== ""));
    setVariantColors((prev) => prev.filter((v) => String(v.value ?? "").trim() !== ""));
    toast.success("Variants saved");
    onClose?.();
  };

  if (!visible) return null;

  const modal = (
     <div className="fixed inset-0 z-60 flex items-center justify-center px-4" style={{width:"50%"}}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold">Manage product variants</h3>
            <div className="text-sm text-slate-500">
              Add sizes (size, price & image), colors (value, price & image) and weights (weight & price)
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100" aria-label="Close variant modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("size")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "size" ? "bg-slate-900 text-white" : "bg-slate-50"}`}
          >
            Sizes
          </button>
          <button
            onClick={() => setTab("color")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "color" ? "bg-slate-900 text-white" : "bg-slate-50"}`}
          >
            Colors
          </button>
          <button
            onClick={() => setTab("weight")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "weight" ? "bg-slate-900 text-white" : "bg-slate-50"}`}
          >
            Weights
          </button>
          <div className="flex-1" />
          {/* Add entry button applies to active tab */}
          <button
            onClick={() => addVariantEntry(tab)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border hover:bg-slate-50 text-sm"
            aria-label={`Add ${tab}`}
          >
            <Plus className="w-3 h-3" /> Add {tab === "weight" ? "weight" : tab.slice(0, 1).toUpperCase() + tab.slice(1)}
          </button>
        </div>

        <div className="space-y-6">
          {/* SIZE tab content */}
          {tab === "size" && (
            <div>
              {variantSizes.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">No sizes yet. Add sizes to create size-based variants.</div>
              ) : (
                <div className="grid gap-3">
                  {variantSizes.map((s, idx) => (
                    <div key={`size-${idx}`} className="border rounded p-3 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <label className="text-xs text-slate-600">Size</label>
                        <input
                          value={s.value}
                          onChange={(e) => handleVariantChange("size", idx, "value", e.target.value)}
                          placeholder="e.g. S, M, L or 250ml"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="text-xs text-slate-600">Price</label>
                        <input
                          value={s.price}
                          onChange={(e) => handleVariantChange("size", idx, "price", e.target.value)}
                          placeholder="₹ 0.00"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-600">Image</label>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded overflow-hidden border bg-slate-100 flex items-center justify-center">
                            {s.imagePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.imagePreview} alt={`size-${idx}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xs text-slate-400">No</div>
                            )}
                          </div>
                          <input type="file" accept="image/*" onChange={(ev) => handleVariantImageChange("size", idx, ev)} className="text-xs" />
                        </div>
                      </div>

                      <div className="col-span-1 text-right">
                        <button onClick={() => removeVariantEntry("size", idx)} className="inline-flex items-center justify-center p-1 rounded border hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COLOR tab content */}
          {tab === "color" && (
            <div>
              {variantColors.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">No colors yet. Add colors with optional images and prices.</div>
              ) : (
                <div className="grid gap-3">
                  {variantColors.map((c, idx) => (
                    <div key={`color-${idx}`} className="border rounded p-3 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <label className="text-xs text-slate-600">Color / Value</label>
                        <input
                          value={c.value}
                          onChange={(e) => handleVariantChange("color", idx, "value", e.target.value)}
                          placeholder="e.g. Red, Blue, #FF0000"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="text-xs text-slate-600">Price</label>
                        <input
                          value={c.price}
                          onChange={(e) => handleVariantChange("color", idx, "price", e.target.value)}
                          placeholder="₹ 0.00"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-600">Image</label>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded overflow-hidden border bg-slate-100 flex items-center justify-center">
                            {c.imagePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.imagePreview} alt={`color-${idx}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xs text-slate-400">No</div>
                            )}
                          </div>
                          <input type="file" accept="image/*" onChange={(ev) => handleVariantImageChange("color", idx, ev)} className="text-xs" />
                        </div>
                      </div>

                      <div className="col-span-1 text-right">
                        <button onClick={() => removeVariantEntry("color", idx)} className="inline-flex items-center justify-center p-1 rounded border hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* WEIGHT tab content */}
          {tab === "weight" && (
            <div>
              {variantWeights.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">No weight variants yet. Add weight-based variants here.</div>
              ) : (
                <div className="grid gap-3">
                  {variantWeights.map((w, idx) => (
                    <div key={`weight-${idx}`} className="border rounded p-3 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6">
                        <label className="text-xs text-slate-600">Weight</label>
                        <input
                          value={w.value}
                          onChange={(e) => handleVariantChange("weight", idx, "value", e.target.value)}
                          placeholder="e.g. 250g, 1kg"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-5">
                        <label className="text-xs text-slate-600">Price</label>
                        <input
                          value={w.price}
                          onChange={(e) => handleVariantChange("weight", idx, "price", e.target.value)}
                          placeholder="₹ 0.00"
                          className="block w-full border rounded p-2 text-sm"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button onClick={() => removeVariantEntry("weight", idx)} className="inline-flex items-center justify-center p-1 rounded border hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveVariants}>Save Variants</Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
