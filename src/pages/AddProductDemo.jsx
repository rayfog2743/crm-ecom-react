import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * Product Add Demo (Wizard) — Fixed: Step components are top-level to avoid remounts
 */

/* ---------- sample data ---------- */
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

/* ---------- small UI pieces ---------- */
function StepBadge({ i, active, label }) {
  return (
    <div className={`flex items-center gap-3 ${active ? "text-indigo-600" : "text-gray-400"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${active ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"}`}>{i}</div>
      <div className="text-sm hidden md:block">{label}</div>
    </div>
  );
}

function Chip({ color, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-md border transition text-sm ${selected ? "ring-2 ring-offset-1 ring-indigo-400 bg-indigo-50" : "hover:bg-gray-50 bg-white"}`}
    >
      <span className="w-4 h-4 rounded-sm border" style={{ backgroundColor: color }} />
      <span className="truncate max-w-[8rem]">{children}</span>
    </button>
  );
}

function Badge({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-gray-100">
      <span>{children}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-gray-700">×</button>
      )}
    </span>
  );
}

/* ---------- STEP COMPONENTS (TOP-LEVEL) ---------- */

/* StepBasic: needs name, setName, category, setCategory, price, setPrice, discountPrice, setDiscountPrice, plainDesc, setPlainDesc, richDesc, setRichDesc */
function StepBasic(props) {
  const { name, setName, category, categorys,setCategory, price, setPrice, discountPrice, setDiscountPrice, plainDesc, setPlainDesc, richDesc, setRichDesc } = props;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="e.g. Shimla Apple" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm">
           
           {
            categorys.map((cat)=>(
                <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
           }
           
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹) *</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="1000.00" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Price</label>
          <input value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="800.00" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Short Description</label>
        <input value={plainDesc} onChange={(e) => setPlainDesc(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="Short/plain description" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Content (rich HTML)</label>
        <textarea value={richDesc} onChange={(e) => setRichDesc(e.target.value)} rows={5} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="Detailed description..." />
      </div>
    </div>
  );
}

/* StepMedia: needs mainImage, handleMainImage, additionalImages, handleAddImages, removeAdditionalImage */
function StepMedia(props) {
  const { mainImage, handleMainImage, additionalImages, handleAddImages, removeAdditionalImage } = props;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 items-start">
        <div className="bg-gradient-to-br from-white to-gray-50 border rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">Video URL</label>
          <input className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="https://www.youtube.com/watch?v=..." />
          <p className="text-xs text-gray-400 mt-2">Paste YouTube/Vimeo link to show product video.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 border rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">Upload Main Image</label>
        <div className="mt-2 flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleMainImage} />
          <div className="w-44 h-28 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
            {mainImage ? <img src={mainImage.url} alt="main preview" className="w-full h-full object-cover" /> : <div className="text-gray-300">No image</div>}
          </div>
          <div className="ml-3 text-sm text-gray-500">Recommended: 800x600px</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 border rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">Additional images / Gallery</label>
        <div className="mt-2">
          <input type="file" multiple accept="image/*" onChange={handleAddImages} />
          {/* Gallery (replace existing additionalImages rendering) */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {additionalImages.length === 0 ? (
              <div className="text-xs text-gray-400 col-span-3">No additional images</div>
            ) : (
              additionalImages.map((a, i) => (
                <div key={a.url + i} className="relative border rounded overflow-hidden group">
                  <img
                    src={a.url}
                    alt={`gallery-${i}`}
                    className="w-full h-28 object-cover"
                    draggable={false}
                  />
                  {/* Visible remove button on hover, always accessible for keyboard users */}
                  <button
                    type="button"
                    onClick={() => {
                      // optional: confirmation
                      if (!confirm("Remove this image?")) return;
                      removeAdditionalImage(i);
                    }}
                    aria-label={`Remove image ${i + 1}`}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-600 border shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">You can upload multiple images to create a product gallery.</p>
        </div>
      </div>
    </div>
  );
}

/* StepVariations: needs selectedVariations, toggleVariationOption, updateVariationItem, handleVariationImage, removeVariationImage */

function StepVariations(props) {
  const {
    variations = [],
    selectedVariations = [],
    toggleVariationOption = () => {},
    updateVariationItem = () => {},
    handleVariationImage = () => {},
    removeVariationImage = () => {},
    setSelectedVariations = () => {},
  } = props;

  const selVars = Array.isArray(selectedVariations) ? selectedVariations : [];
  console.log("selVars",variations)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold">Variations</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSelectedVariations([])} className="text-sm px-3 py-1 rounded bg-gray-100">Clear selections</button>
          <div className="text-xs text-gray-400">Select options to configure per-variation SKU, price, stock and image.</div>
        </div>
      </div>

      <div className="grid gap-4">
       
        {Array.isArray(variations) && variations.length > 0 ? (
          variations.map((v) => (
            <div key={v.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Choose one or more options for this variation.</div>
                </div>
                <div className="text-sm text-gray-500">{(v.attributes || []).length} options</div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {(v.attributes || []).length > 0 ? (
                  (v.attributes || []).map((opt) => {
                    const attrId = opt.id;
                    const optName = opt.name ?? String(opt);
                    const key = `${v.id}::${attrId}`;
                    const selected = selVars.some((s) => s.key === key);

                    return (
                      <button
                        key={attrId}
                        type="button"
                        onClick={() => toggleVariationOption(v.id, attrId, optName)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition text-sm w-full justify-center ${selected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <input type="checkbox" readOnly checked={selected} className="mr-1" />
                        <span className="truncate">{optName}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-400 col-span-4">No options</div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {selVars.filter((s) => s.variationId === v.id).map((s) => (
                  <div key={s.key} className="p-3 border rounded-lg bg-gray-50 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s.option}</div>
                        <div className="text-xs text-gray-500">Variation: {v.name}</div>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input placeholder="Extra price" value={s.extraPrice ?? ""} onChange={(e) => updateVariationItem(s.key, { extraPrice: e.target.value })} className="px-2 py-2 border rounded w-full" />
                        <input placeholder="SKU" value={s.sku ?? ""} onChange={(e) => updateVariationItem(s.key, { sku: e.target.value })} className="px-2 py-2 border rounded w-full" />
                        <input placeholder="Stock" value={s.stock ?? ""} onChange={(e) => updateVariationItem(s.key, { stock: e.target.value })} className="px-2 py-2 border rounded w-full" />
                        <div className="text-xs text-gray-400 flex items-center">Tip: leave price empty for same as base</div>
                      </div>
                    </div>

                    <div className="w-44 flex-shrink-0">
                      <div className="text-xs text-gray-500 mb-2">Option image</div>
                      <div className="border rounded p-2 bg-white">
                        <input id={`varimg-${s.key}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleVariationImage(s.key, e)} />
                        <label htmlFor={`varimg-${s.key}`} className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer border shadow-sm" title="Upload image">
                          {/* svg upload icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v-5a2 2 0 012-2h2l2-3h4l2 3h2a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v3m0 0v3m0-3h3m-3 0H9" />
                          </svg>
                        </label>

                        <div className="mt-2 w-full h-20 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                          {s.image ? (
                            <div className="relative">
                              <img src={s.image.url} alt="var" className="w-36 h-20 object-cover rounded" />
                              <button type="button" onClick={() => removeVariationImage(s.key)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-600 border">×</button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">No image</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No variations available</div>
        )}
      </div>
    </div>
  );
}

/* StepColors */
function StepColors(props) {
  const { selectedColorIds, toggleColor } = props;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-semibold">Colors</h3>
        <p className="text-xs text-gray-500 mt-1">Choose one or more colors for this product</p>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SAMPLE_COLORS.map((c) => {
            const selected = selectedColorIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleColor(c.id)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition shadow-sm cursor-pointer ${selected ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200" : "bg-white hover:bg-gray-50"}`}
              >
                <span className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: c.hex }} />
                <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">Selected:</span>
          {selectedColorIds.length === 0 && <span className="text-xs text-gray-400">No colors selected</span>}
        </div>

        {selectedColorIds.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id)).map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg shadow-sm text-sm">
                <span className="w-5 h-5 rounded-md border shadow-sm" style={{ backgroundColor: c.hex }} />
                <span className="text-gray-700">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* StepSEO */
/* ---------- TagInput (for SEO keywords) ---------- */
function TagInput({ tags = [], setTags, placeholder = "Type a keyword and press Enter" }) {
  const [text, setText] = React.useState("");

  const pushTag = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    const parts = v.split(",").map(p => p.trim()).filter(Boolean);
    setTags(prev => {
      const lower = new Set(prev.map(t => t.toLowerCase()));
      const added = parts.filter(p => !lower.has(p.toLowerCase()));
      return [...prev, ...added];
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pushTag(text);
      setText("");
    } else if (e.key === ",") {
      e.preventDefault();
      pushTag(text);
      setText("");
    } else if (e.key === "Backspace" && text === "") {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData).getData("text");
    pushTag(txt);
  };

  return (
    <div className="border rounded p-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm">
            <span>{t}</span>
            <button
              type="button"
              onClick={() => setTags(prev => prev.filter((_, idx) => idx !== i))}
              className="text-gray-500 hover:text-gray-800"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={placeholder}
          className="flex-1 min-w-[10rem] p-1 outline-none text-sm"
        />
      </div>
      <div className="text-xs text-gray-400 mt-2">Press Enter or comma to add. Backspace removes last tag when input empty.</div>
    </div>
  );
}

function StepSEO(props) {
  const { seoTitle, setSeoTitle, seoDescription, setSeoDescription, seoKeywords, setSeoKeywords } = props;
  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">SEO Tags</h3>
      <p className="text-xs text-gray-500 mb-3">Improve product visibility on search engines</p>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Meta Title</label>
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="Product SEO title" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Meta Description</label>
          <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="SEO description for search engines" />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
          
           <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" placeholder="keyword1, keyword2, keyword3" /> 
        </div> */}

        <div>
        <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
        <div className="mt-2">
          <TagInput tags={seoKeywords} setTags={setSeoKeywords} placeholder="e.g. apple, fresh, organic" />
        </div>
      </div>
      </div>
    </div>
  );
}

/* StepReview */
function StepReview(props) {
  const { name, price, discountPrice, category, plainDesc, mainImage, additionalImages, selectedVariations, selectedColorIds, handleSubmit } = props;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review & Submit</h3>
          <p className="text-sm text-gray-500 mt-1">Double-check product details below. Click <span className="font-medium">Submit product</span> when ready.</p>
        </div>
        <div className="text-sm text-gray-500">Preview only — no network calls</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs text-gray-500">Product</div>
          <div className="mt-2 font-medium text-lg">{name || "Untitled"}</div>
          <div className="text-sm text-gray-500">{category || "—"}</div>
          <div className="mt-3 text-xl font-bold">{price ? `₹${price}` : "—"} {discountPrice ? <span className="text-sm text-gray-500">(₹{discountPrice})</span> : null}</div>
          <div className="mt-2 text-sm text-gray-700">{plainDesc || "No short description"}</div>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs text-gray-500">Images</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-20 h-14 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
              {mainImage ? <img src={mainImage.url} alt="main" className="w-full h-full object-cover" /> : <div className="text-gray-300">No image</div>}
            </div>
            <div className="text-sm text-gray-600">Gallery: {additionalImages.length} images</div>
          </div>
          {additionalImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {additionalImages.slice(0, 4).map((a, i) => (
                <div key={i} className="w-full h-16 overflow-hidden rounded border">
                  <img src={a.url} alt={`g-${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs text-gray-500">Meta</div>
          <div className="mt-2 text-sm text-gray-700">Variations: <span className="font-medium">{selectedVariations.length}</span></div>
          <div className="mt-1 text-sm text-gray-700">Colors: <span className="font-medium">{selectedColorIds.length}</span></div>
          <div className="mt-3 text-xs text-gray-400">You can go back and edit any step before submitting.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-2">Variations detail</div>
          {selectedVariations.length === 0 ? (
            <div className="text-xs text-gray-400">No variations</div>
          ) : (
            selectedVariations.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <div className="w-28 text-sm">{s.option}</div>
                <div className="text-xs text-gray-500">SKU: {s.sku || "—"}</div>
                <div className="ml-auto text-xs text-gray-500">Stock: {s.stock || "—"}</div>
                {s.image ? <img src={s.image.url} alt="v" className="w-12 h-8 object-cover rounded border ml-3" /> : null}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-2">Colors selected</div>
          {selectedColorIds.length === 0 ? (
            <div className="text-xs text-gray-400">No colors</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id)).map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg text-sm">
                  <span className="w-5 h-5 rounded-md border" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500">When you submit, the demo will show a payload below (no network calls).</div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 bg-white border rounded-lg">Edit</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow">Submit product</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function AddProductDemo() {
  // Step index
  const [step, setStep] = useState(0);
    const navigate = useNavigate();
  // Basic fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categorys, setCategorys] = useState([]);
  const [plainDesc, setPlainDesc] = useState("");
  const [richDesc, setRichDesc] = useState("");

  const [variations, setVariations] = useState([]);

  // Media / gallery
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  // Variations / colors
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [selectedColorIds, setSelectedColorIds] = useState([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);

  // payload preview
  const [submittedPayload, setSubmittedPayload] = useState(null);

  const fetchallcategories=async()=>{
    const category=await api.get("/admin/categories/show");
    console.log("categories",category.data.data);
    setCategorys(category.data.data);
  }

 const fetchvariations = async () => {
  try {
    const res = await api.get("/admin/variation");
   
    const raw = res.data?.variations ?? [];
  
    const normalized = raw.map(v => ({
      ...v,
      attributes: Array.isArray(v.attributes) ? v.attributes : []
    }));
    console.log("variations", normalized);
    setVariations(normalized);
  } catch (err) {
    console.error("failed to fetch variations", err);
    setVariations([]);
  }
};
  useEffect(() => {
    setSelectedVariations([]);
    setSelectedColorIds([]);
    fetchallcategories()
    fetchvariations()
  }, []);

  // Variation helpers (stable references in this scope)
 // variationId: variation.id (number/string), attrId: attribute.id (number/string), optionName: attribute.name (string)
const toggleVariationOption = (variationId, attrId, optionName) => {
  const key = `${variationId}::${attrId}`; // unique per attribute
  setSelectedVariations((prev) => {
    const exists = prev.find((p) => p.key === key);
    if (exists) return prev.filter((p) => p.key !== key);
    return [...prev, {
      key,
      variationId,
      attributeId: attrId,
      option: optionName,
      extraPrice: "",
      sku: "",
      stock: "",
      image: null
    }];
  });
};

  const updateVariationItem = (key, patch) => {
    setSelectedVariations((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const handleVariationImage = (key, ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateVariationItem(key, { image: { file, url } });
  };

  const removeVariationImage = (key) => updateVariationItem(key, { image: null });

  // Colors
  const toggleColor = (colorId) => setSelectedColorIds((prev) => (prev.includes(colorId) ? prev.filter((i) => i !== colorId) : [...prev, colorId]));

  // Media handlers
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

  const removeAdditionalImage = (index) => setAdditionalImages((prev) => prev.filter((_, i) => i !== index));

  // Navigation
  const steps = [
    { id: 0, label: "1. Basic" },
    { id: 1, label: "2. Media" },
    { id: 2, label: "3. Variations" },
    { id: 3, label: "4. Colors" },
    { id: 4, label: "5. SEO" },
    { id: 5, label: "6. Review" },
  ];

  const canNext = () => {
    if (step === 0) return name.trim() !== "" && price.toString().trim() !== "";
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  // Submit

  const handleSubmit = async (e) => {
  e?.preventDefault?.();

  // prepare the variations payload (but we will upload files separately)
  const variationsPayload = selectedVariations.map((v) => ({
    variationId: v.variationId,
    attributeId: v.attributeId ?? v.attribute_id ?? null,
    option: v.option,
    extraPrice: v.extraPrice || "0",
    sku: v.sku || "",
    stock: v.stock || "",
    // DO NOT send blob preview URLs as image — server will receive files via variation_images[]
    image: null,
  }));

  const selectedColors = SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id));

  // Basic product data object (used for preview / JSON parts)
  const productData = {
    name,
    price,
    discountPrice,
    category,
    plainDesc,
    richDesc,
    variations: variationsPayload,
    colors: selectedColors,
    // mainImage/additionalImages will be uploaded as files, not as blob urls
    mainImage: null,
    additionalImages: [], // urls (if any) - left empty because uploading files
    seo: {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
    },
  };

  // Build FormData
  const form = new FormData();

  // Append simple fields
  form.append("name", productData.name ?? "");
  form.append("price", productData.price ?? "");
  form.append("discountPrice", productData.discountPrice ?? "");
  form.append("category", productData.category ?? "");
  form.append("plainDesc", productData.plainDesc ?? "");
  form.append("richDesc", productData.richDesc ?? "");

  // Append structured fields as JSON strings
  form.append("variations", JSON.stringify(productData.variations));
  form.append("colors", JSON.stringify(productData.colors));
  form.append("seo", JSON.stringify(productData.seo));

  // Append main image file (if present and a real File)
  if (mainImage && mainImage.file instanceof File) {
    form.append("mainImage", mainImage.file);
  }

  // Append additional images files (if any)
  if (Array.isArray(additionalImages) && additionalImages.length > 0) {
    additionalImages.forEach((a) => {
      if (a && a.file instanceof File) {
        form.append("additionalImages[]", a.file);
      }
    });
  }

  // Append variation image files in the same order as variations array.
  // server will receive request->file('variation_images') as an array
  // and we match by index in the controller.
  if (Array.isArray(selectedVariations) && selectedVariations.length > 0) {
    selectedVariations.forEach((v, idx) => {
      const f = v.image?.file;
      if (f instanceof File) {
        form.append("variation_images[]", f);
      } else {
        
      }
    });
  }

  // Optional: append any other meta fields if your API expects them
  // form.append("some_flag", "1");

  // Send request
  try {
    const res = await api.post("/admin/products/add", form, {
      headers: { "Content-Type": "multipart/form-data" },
      // You can add onUploadProgress here if you want a progress bar
      // onUploadProgress: (progressEvent) => { ... }
    });

    // successful response
    console.log("product saved", res.data);
    
    if (res.data?.status) {
      // show success alert (you can replace this with a nicer toast)
      window.alert(res.data.message ?? "Product saved successfully");
      navigate('/ProductList');
      // set preview to server response (contains saved image paths, ids, etc)
      setSubmittedPayload(res.data.data ?? productData);

      // optional: navigate to product list or reset form:
      // navigate('/admin/products');
      // or reset form state...
    } else {
      // API returned status:false
      const msg = res.data?.message ?? "Failed to save product";
      window.alert(msg);
      // optionally log errors if present
      console.warn("save returned false", res.data);
    }

  } catch (err) {
    // handle errors (validation: 422)
    console.error("save failed", err.response?.data ?? err);
    if (err.response?.status === 422) {
      //
      const errors = err.response.data?.errors || err.response.data;
    
      console.log("validation errors", errors);
    
    } else {
    
    }
  }
};

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepBasic
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            categorys={categorys}  
            price={price}
            setPrice={setPrice}
            discountPrice={discountPrice}
            setDiscountPrice={setDiscountPrice}
            plainDesc={plainDesc}
            setPlainDesc={setPlainDesc}
            richDesc={richDesc}
            setRichDesc={setRichDesc}
          />
        );
      case 1:
        return (
          <StepMedia
            mainImage={mainImage}
            handleMainImage={handleMainImage}
            additionalImages={additionalImages}
            handleAddImages={handleAddImages}
            removeAdditionalImage={removeAdditionalImage}
          />
        );
      case 2:
        return (
          <StepVariations
            selectedVariations={selectedVariations}
             variations={variations}  
            toggleVariationOption={toggleVariationOption}
            updateVariationItem={updateVariationItem}
            handleVariationImage={handleVariationImage}
            removeVariationImage={removeVariationImage}
            setSelectedVariations={setSelectedVariations}
          />
        );
      case 3:
        return <StepColors selectedColorIds={selectedColorIds} toggleColor={toggleColor} />;
      case 4:
        return <StepSEO seoTitle={seoTitle} setSeoTitle={setSeoTitle} seoDescription={seoDescription} setSeoDescription={setSeoDescription} seoKeywords={seoKeywords} setSeoKeywords={setSeoKeywords} />;
      case 5:
        return (
          <StepReview
            name={name}
            price={price}
            discountPrice={discountPrice}
            category={category}
            plainDesc={plainDesc}
            mainImage={mainImage}
            additionalImages={additionalImages}
            selectedVariations={selectedVariations}
            selectedColorIds={selectedColorIds}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {steps.map((s, idx) => (
              <StepBadge key={s.id} i={idx + 1} active={idx === step} label={s.label} />
            ))}
          </div>
          <div className="text-sm text-gray-500">Step {step + 1} of {steps.length}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* main form area */}
          <div className="lg:col-span-2 bg-white shadow-md rounded-2xl overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add Product — Wizard</h2>
              <div className="w-full h-px bg-gray-100 my-3" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-gray-500">Complete step-by-step to create a product.</p>
                <div className="text-sm text-gray-500">Required fields: <span className="font-medium text-gray-700">Name</span> &amp; <span className="font-medium text-gray-700">Price</span>.</div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => e.preventDefault()}>
                {renderStep()}

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    {step > 0 && <button type="button" onClick={back} className="px-4 py-2 bg-gray-200 rounded-lg mr-2">Back</button>}
                    {step < steps.length - 1 && <button type="button" onClick={next} disabled={!canNext()} className={`px-4 py-2 rounded-lg ${canNext() ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>Next</button>}
                  </div>

                  <div>
                    <button type="button" onClick={() => { /* reset all */ setSubmittedPayload(null); setName(""); setPrice(""); setDiscountPrice(""); setCategory(""); setPlainDesc(""); setRichDesc(""); setSelectedVariations([]); setSelectedColorIds([]); setMainImage(null); setAdditionalImages([]); setSeoTitle(""); setSeoDescription(""); setSeoKeywords(""); setStep(0); }} className="px-4 py-2 bg-gray-100 rounded-lg mr-2">Reset</button>
                    <button type="button" onClick={() => setStep(steps.length - 1)} className="px-4 py-2 bg-white border rounded-lg">Go to Review</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* right preview */}
          <aside className="bg-white shadow-md rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border flex items-center justify-center">
                {mainImage ? <img src={mainImage.url} alt="preview" className="w-full h-full object-cover" /> : <div className="text-gray-300">No image</div>}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-lg">{name || "Untitled product"}</div>
                <div className="text-sm text-gray-500">{category || "—"}</div>
                <div className="mt-2 text-xl font-bold">{price ? `₹${price}` : "—"}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">{plainDesc || "No short description"}</div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Selected variations</div>
              <div className="mt-2 text-sm text-gray-700">
                {selectedVariations.length === 0 ? <span className="text-gray-400 text-xs">No variations</span> : selectedVariations.map((s) => <div key={s.key} className="text-sm">{s.option} — <span className="text-xs text-gray-500">{s.extraPrice ? `+₹${s.extraPrice}` : "no extra"}</span></div>)}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Colors</div>
              <div className="mt-2 flex gap-2">
                {selectedColorIds.length === 0 ? <div className="text-xs text-gray-400">No colors selected</div> : SAMPLE_COLORS.filter((c) => selectedColorIds.includes(c.id)).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded-sm border" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-3">
              <div className="text-xs text-gray-500">Payload preview</div>
              {submittedPayload ? (
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">{JSON.stringify(submittedPayload, null, 2)}</pre>
              ) : (
                <div className="text-xs text-gray-400 mt-2">Submit the form to see produced payload here.</div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* tiny notification */}
      <div id="notif" className="fixed right-6 bottom-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity">Product prepared</div>
    </div>
  );
}
