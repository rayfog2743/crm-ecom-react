import React, { useEffect, useState } from "react";

/**
 * onSave(formData) => async function that posts to server (returns created/updated item)
 * initial: { id?, variation_id, value, price, image_url }
 */
export default function AddAttributeModal({ open, onClose, onSave, initial = {} , saving=false }) {
  const [value, setValue] = useState(initial.value ?? "");
  const [price, setPrice] = useState(initial.price ?? "");
  const [variationId, setVariationId] = useState(initial.variation_id ?? null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial.image_url ?? "");

  useEffect(() => {
    setValue(initial.value ?? "");
    setPrice(initial.price ?? "");
    setVariationId(initial.variation_id ?? null);
    setImageFile(null);
    setImagePreview(initial.image_url ?? "");
  }, [initial, open]);

  if (!open) return null;

  const onImageChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!f.type.startsWith("image/")) return alert("Please select an image file.");
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result ?? ""));
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!variationId) return alert("Select a variation.");
    if (!String(value || "").trim()) return alert("Value required.");

    const fd = new FormData();
    fd.append("variation_id", String(variationId));
    fd.append("attribute_name", String(value).trim());
    if (String(price || "").trim() !== "") fd.append("price", String(price));
    if (imageFile) fd.append("image", imageFile);

    try {
      await onSave(fd);
    } catch (err) {
      // onSave should throw if server error — bubble up
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow p-5 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{initial.id ? "Edit Attribute" : "Add Attribute"}</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-600">Variation (selected from panel)</label>
            <div className="mt-1">
              <input value={variationId ?? ""} readOnly className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
              <div className="text-xs text-slate-400 mt-1">Variation id: {variationId ?? "—"}</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600">Value (attribute_name)</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" placeholder="e.g. M, Red, Cotton" />
          </div>

          <div>
            <label className="text-xs text-slate-600">Price (optional)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" placeholder="e.g. 10.50" />
          </div>

          <div>
            <label className="text-xs text-slate-600">Image (optional)</label>
            <div className="flex items-center gap-3 mt-1">
              <input id="attr-image" type="file" accept="image/*" onChange={onImageChange} className="hidden" />
              <label htmlFor="attr-image" className="px-3 py-2 border rounded cursor-pointer text-sm">Choose</label>
              {imagePreview ? <img src={imagePreview} alt="preview" className="w-14 h-10 object-cover rounded border" /> : <div className="text-xs text-slate-400">No image</div>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{saving ? "Saving..." : (initial.id ? "Update" : "Add")}</button>
        </div>
      </div>
    </div>
  );
}
