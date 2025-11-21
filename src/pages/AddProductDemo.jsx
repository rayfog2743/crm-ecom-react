// AddProductDemo.jsx
import React, { useState, useEffect } from "react";

/**
 * Static demo data for variations and colors
 */
const SAMPLE_VARIATIONS = [
  { id: 1, name: "Weight", options: ["250g", "500g", "750g", "1000g"] },
  { id: 2, name: "Size", options: ["S", "M", "L", "XL"] },
  { id: 3, name: "Flavor", options: ["Sweet", "Spicy", "Tangy"] },
];

const SAMPLE_COLORS = [
  { id: 1, name: "Sky Blue", hex: "#38bdf8" },
  { id: 2, name: "Green Tea", hex: "#22c55e" },
  { id: 3, name: "Fire Orange", hex: "#f97316" },
  { id: 4, name: "Charcoal", hex: "#374151" },
];

/**
 * Small UI bits
 */
function Chip({ color, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-md border transition ${
        selected ? "ring-2 ring-offset-1 ring-blue-500" : "hover:bg-gray-50"
      }`}
    >
      <span className="w-4 h-4 rounded-sm border" style={{ backgroundColor: color }} />
      <span className="text-xs">{children}</span>
    </button>
  );
}

function Badge({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-gray-100">
      <span>{children}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-gray-700">
          ×
        </button>
      )}
    </span>
  );
}

/**
 * Component: AddProductDemo
 */
export default function AddProductDemo() {
  // product basic
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [category, setCategory] = useState("");
  const [grams, setGrams] = useState("");
  const [plainDesc, setPlainDesc] = useState("");
  const [richDesc, setRichDesc] = useState("");

  // variations: keep track which option selected per variation group.
  // structure: { variationId: 1, option: "500g", extraPrice: "0", sku: "", stock: "" }
  const [selectedVariations, setSelectedVariations] = useState([]);

  // colors: selected array of color ids
  const [selectedColorIds, setSelectedColorIds] = useState([]);

  // image previews
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  // output payload preview
  const [submittedPayload, setSubmittedPayload] = useState(null);

  // helpers
  useEffect(() => {
    // initialize sample selected variations (none by default)
    setSelectedVariations([]);
    setSelectedColorIds([]);
  }, []);

  const toggleVariationOption = (variationId, option) => {
    const key = `${variationId}::${option}`;
    // if exists remove it (unselect), else add with defaults
    setSelectedVariations((prev) => {
      const exists = prev.find((p) => p.key === key);
      if (exists) return prev.filter((p) => p.key !== key);
      return [...prev, { key, variationId, option, extraPrice: "", sku: "", stock: "" }];
    });
  };

  const updateVariationItem = (key, patch) => {
    setSelectedVariations((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const toggleColor = (colorId) => {
    setSelectedColorIds((prev) => (prev.includes(colorId) ? prev.filter((i) => i !== colorId) : [...prev, colorId]));
  };

  // image handling
  const handleMainImage = (ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMainImage({ file, url });
  };

  const handleAddImages = (ev) => {
    const files = Array.from(ev.target.files || []);
    const mapped = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setAdditionalImages((prev) => [...prev, ...mapped]);
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // submit — static demo: create payload and show preview
  const handleSubmit = (e) => {
    e.preventDefault();

    // build variations payload
    const variationsPayload = selectedVariations.map((v) => ({
      variationId: v.variationId,
      option: v.option,
      extraPrice: v.extraPrice || "0",
      sku: v.sku || "",
      stock: v.stock || "",
    }));

    const selectedColors = SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id));

    const payload = {
      name,
      price,
      discountPrice,
      category,
      grams,
      plainDesc,
      richDesc,
      variations: variationsPayload,
      colors: selectedColors,
      mainImage: mainImage ? mainImage.url : null,
      additionalImages: additionalImages.map((a) => a.url),
    };

    setSubmittedPayload(payload);
    console.log("PRODUCT PAYLOAD (demo):", payload);
    alert("Product payload logged to console and shown below (demo).");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Add Product — Variations & Colors (Demo)</h2>
          <p className="text-sm text-gray-500">Static data demo. Replace handlers with your API calls for real usage.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top row: name price category discount */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="e.g. Shimla Apple" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="1000.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border rounded p-2">
                <option value="">-- Select category --</option>
                <option value="fruits">Fruits</option>
                <option value="groceries">Groceries</option>
                <option value="snacks">Snacks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Price</label>
              <input value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="800.00" />
            </div>
          </div>

          {/* Grams + Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Grams</label>
              <input value={grams} onChange={(e) => setGrams(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="e.g. 500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description (plain)</label>
              <textarea value={plainDesc} onChange={(e) => setPlainDesc(e.target.value)} rows={3} className="mt-1 block w-full border rounded p-2" placeholder="Enter short/plain description" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content (rich HTML)</label>
            <textarea value={richDesc} onChange={(e) => setRichDesc(e.target.value)} rows={5} className="mt-1 block w-full border rounded p-2" placeholder="Click to edit description (rich text)" />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700">Video URL</label>
              <input className="mt-1 block w-full border rounded p-2" placeholder="https://www.youtube.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Main Image</label>
              <input type="file" accept="image/*" onChange={handleMainImage} className="mt-1" />
              <div className="mt-3">
                {mainImage ? (
                  <img src={mainImage.url} alt="main preview" className="w-40 h-28 object-cover rounded border" />
                ) : (
                  <img src="/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png" alt="placeholder" className="w-40 h-28 object-cover rounded border opacity-60" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Additional images</label>
              <input type="file" multiple accept="image/*" onChange={handleAddImages} className="mt-1" />
              <div className="mt-3 flex gap-2 flex-wrap">
                {additionalImages.length === 0 ? (
                  <div className="text-xs text-gray-400">No additional images</div>
                ) : (
                  additionalImages.map((a, i) => (
                    <div key={i} className="relative">
                      <img src={a.url} alt={`add-${i}`} className="w-28 h-20 object-cover rounded border" />
                      <button type="button" onClick={() => removeAdditionalImage(i)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-600 border">×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* VARIATIONS */}
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-3">Variations</h3>

            <div className="grid gap-4">
              {SAMPLE_VARIATIONS.map((v) => (
                <div key={v.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-sm text-gray-500">Select options to add</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.options.map((opt) => {
                      const key = `${v.id}::${opt}`;
                      const selected = selectedVariations.some((s) => s.key === key);
                      return (
                        <label key={opt} className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${selected ? "bg-blue-50" : "bg-white"}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleVariationOption(v.id, opt)}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* when selected show inputs per selected option */}
                  <div className="mt-3 space-y-2">
                    {selectedVariations
                      .filter((s) => s.variationId === v.id)
                      .map((s) => (
                        <div key={s.key} className="flex gap-2 items-center">
                          <div className="w-36 px-3 py-2 border rounded bg-gray-50 text-sm">{s.option}</div>
                          <input
                            placeholder="Extra price (optional)"
                            value={s.extraPrice}
                            onChange={(e) => updateVariationItem(s.key, { extraPrice: e.target.value })}
                            className="px-2 py-1 border rounded w-36"
                          />
                          <input
                            placeholder="SKU"
                            value={s.sku}
                            onChange={(e) => updateVariationItem(s.key, { sku: e.target.value })}
                            className="px-2 py-1 border rounded w-40"
                          />
                          <input
                            placeholder="Stock"
                            value={s.stock}
                            onChange={(e) => updateVariationItem(s.key, { stock: e.target.value })}
                            className="px-2 py-1 border rounded w-28"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLORS */}
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-3">Colors</h3>
            <p className="text-xs text-gray-500 mb-3">Choose one or more colors for this product</p>

            <div className="flex flex-wrap gap-3 mb-3">
              {SAMPLE_COLORS.map((c) => (
                <Chip key={c.id} color={c.hex} selected={selectedColorIds.includes(c.id)} onClick={() => toggleColor(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-sm text-gray-600">Selected:</div>
              <div className="flex gap-2">
                {selectedColorIds.length === 0 ? <div className="text-xs text-gray-400">No colors</div> : SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id)).map((c) => <Badge key={c.id}>{c.name} ({c.hex})</Badge>)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">Demo only — no backend calls</div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { /* reset form quickly */ setSubmittedPayload(null); }} className="px-4 py-2 bg-gray-200 rounded">Reset</button>
              <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded">Add Product</button>
            </div>
          </div>
        </form>

        {/* Payload preview */}
        <div className="p-6 border-t bg-gray-50">
          <h4 className="font-medium mb-2">Payload preview (demo)</h4>
          {submittedPayload ? (
            <pre className="text-xs p-3 rounded bg-white border overflow-auto">{JSON.stringify(submittedPayload, null, 2)}</pre>
          ) : (
            <div className="text-sm text-gray-400">Submit the form to see produced payload here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
