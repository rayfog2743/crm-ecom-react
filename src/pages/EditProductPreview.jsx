// EditProductPreview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

/*
  Optimized EditProductPreview:
  - parallel fetches (Promise.all)
  - AbortController for cancellation
  - revoke blob URLs when replaced/removed & on unmount
  - cap variant generation (MAX_VARIANTS) and show friendly warning
  - memoized VariantsTable component
*/

function cartesianProduct(arrays) {
  return arrays.reduce((acc, curr) => {
    const res = [];
    acc.forEach((a) => curr.forEach((c) => res.push([...a, c])));
    return res;
  }, [[]]);
}

/* Memoized variants table to avoid re-renders */
const VariantsTable = React.memo(function VariantsTable({ rows, color, onChangeRow, onUploadImageForRow, onRemoveVariantImage }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm" style={{ tableLayout: "auto" }}>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-xs text-gray-400">
                No combinations yet (select options)
              </td>
            </tr>
          )}

          {rows.map((r, idx) => (
            <tr key={r.key} className="hover:bg-gray-50">
              <td className="px-4 py-4 align-top">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded overflow-hidden border bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {r.image ? <img src={r.image.url} alt="v" className="w-full h-full object-cover" /> : <div className="text-xs text-gray-400">No photo</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {r.parts
                        .map((p) => (String(p.groupId).toLowerCase() === "color" ? (color.find(c => String(c.id) === String(p.value))?.name ?? p.value) : String(p.value)))
                        .join(" — ")}
                    </div>
                    <div className="text-xs text-gray-400">Combination</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-4 align-top w-36">
                <input type="number" value={r.priceExtra} onChange={(e) => onChangeRow(r.key, { priceExtra: e.target.value })} className="px-2 py-2 border rounded w-full" placeholder="Extra" />
              </td>

              <td className="px-4 py-4 align-top w-40">
                <input type="text" value={r.sku} onChange={(e) => onChangeRow(r.key, { sku: e.target.value })} className="px-2 py-2 border rounded w-full truncate" placeholder="SKU" />
              </td>

              <td className="px-4 py-4 align-top w-32">
                <input type="number" value={r.qty} onChange={(e) => onChangeRow(r.key, { qty: e.target.value })} className="px-2 py-2 border rounded w-full" placeholder="Qty" />
              </td>

              <td className="px-4 py-4 align-top w-36">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-2 py-1 bg-white border rounded text-xs">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImageForRow(r.key, e)} />
                    Upload
                  </label>
                  {r.image?.remotePath && <button className="text-xs text-red-600" onClick={() => onRemoveVariantImage(r.key)}>Remove old</button>}
                  {r.image?.url && !r.image?.file && <button className="text-xs text-gray-600" onClick={() => onRemoveVariantImage(r.key, true)}>Clear</button>}
                  <div className="text-xs text-gray-500 truncate">{r.image ? <span className="text-green-600">Uploaded</span> : <span className="text-gray-400">No file</span>}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

function MultiSelect({ label, options = [], selected = [], onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((s) => s !== value));
    else onChange([...selected, value]);
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 w-full text-left border rounded-lg p-3 bg-white flex items-center justify-between"
      >
        <div className="truncate text-sm">{selected.length === 0 ? placeholder : `${selected.length} selected`}</div>
        <div className="text-xs text-gray-400">▾</div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg max-h-56 overflow-auto">
          <div className="p-2 text-xs text-gray-500">Click to toggle</div>

          {options.map((opt, idx) => {
            const optValue = opt && typeof opt === "object" ? String(opt.value ?? opt.id ?? idx) : String(opt);
            const optLabel = opt && typeof opt === "object" ? (opt.label ?? opt.colorname ?? opt.name ?? optValue) : String(opt);
            const hex = opt && typeof opt === "object" ? (opt.hex ?? opt.hexcode ?? null) : null;

            return (
              <label key={`${optValue}-${idx}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={optValue}
                  checked={selected.includes(optValue)}
                  onChange={() => toggle(optValue)}
                />
                <div className="text-sm flex items-center gap-2">
                  {hex && <span style={{ width: 14, height: 14, background: hex, display: "inline-block", borderRadius: 4 }} />}
                  <span>{optLabel}</span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EditProductPreview({ productId }) {
  // resolve id from prop or route
  let params = {};
  try {
    params = useParams() || {};
  } catch (e) {
    params = {};
  }
  const pidRaw = productId ?? params.id ?? params.productId ?? null;
  const pid = pidRaw === null ? null : (Number(pidRaw) ? Number(pidRaw) : String(pidRaw));

  // Steps / basic fields
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [category, setCategory] = useState("");
  const [plainDesc, setPlainDesc] = useState("");
  const [bigDesc, setBigDesc] = useState("");
  const [categories, setCategories] = useState([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);

  // api lists
  const [apivariations, setApivariations] = useState([]);
  const [color, setColor] = useState([]);

  // selection / variants
  const [selectedPerGroup, setSelectedPerGroup] = useState({});
  const [variantRows, setVariantRows] = useState([]);
  const [tooManyVariants, setTooManyVariants] = useState(false);

  // media
  const [mainImage, setMainImage] = useState(null); // {file, url, remotePath?}
  const [additionalImages, setAdditionalImages] = useState([]); // {file,url,remotePath?}
  const [removedGallery, setRemovedGallery] = useState([]); // remote paths removed by user
  const [videoUrl, setVideoUrl] = useState("");

  // variant image removals (remote paths)
  const [removedVariantImages, setRemovedVariantImages] = useState([]);

  // ui
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  const MAX_VARIANTS = 200;

  const UPDATE_URL = (id) => `/admin/products/update/${id}`;
  const GET_URL = (id) => `/admin/products/product2/${id}`;

  // normalize variations groups
  const variations = useMemo(() => {
    const fromApi = (apivariations || []).map((v, idx) => {
      const rawOptions =
        Array.isArray(v.options) && v.options.length ? v.options :
        Array.isArray(v.attributes) && v.attributes.length ? v.attributes.map(a => a.value ?? a.name ?? String(a)) :
        [];

      const options = rawOptions.map((opt, oidx) => {
        if (opt && typeof opt === "object") {
          return {
            label: opt.label ?? opt.name ?? String(opt.value ?? opt.id ?? oidx),
            value: String(opt.value ?? opt.id ?? opt.name ?? oidx),
            hex: opt.hex ?? opt.hexcode ?? null,
          };
        }
        return { label: String(opt), value: String(opt), hex: null };
      });

      return {
        id: v.id ?? v.variation_id ?? String(v.name ?? idx),
        name: v.name ?? v.label ?? `Group ${v.id ?? idx}`,
        options,
      };
    });

    const colorGroup = {
      id: "color",
      name: "Color",
      options: (color || []).map((c) => ({ label: c.name ?? c.colorname ?? `Color ${c.id}`, value: String(c.id), hex: c.hex ?? null })),
    };

    const hasColor = fromApi.some(g => String(g.name).toLowerCase() === "color" || String(g.name).toLowerCase() === "colour");
    return hasColor ? fromApi : [...fromApi, colorGroup];
  }, [apivariations, color]);

  // ---------- fetch lists & product in parallel ----------
  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      try {
        // If pid present, we may fetch product in same round
        const calls = [
          api.get("/admin/categories/show", { signal: ac.signal }),
          api.get("/admin/variation", { signal: ac.signal }),
          api.get("/admin/colors", { signal: ac.signal })
        ];
        // do parallel
        const [catsRes, varsRes, colorsRes] = await Promise.all(calls);
        if (!mountedRef.current) return;

        setCategories(catsRes.data?.data ?? []);
        setApivariations(varsRes.data?.variations ?? []);

        // normalize colors
        const raw = colorsRes.data?.colors ?? [];
        const normalized = (raw || []).map((c) => {
          const id = String(c.id ?? c.color_id ?? c.value ?? c.label ?? "");
          const name = c.colorname ?? c.name ?? c.label ?? id;
          const hex = c.hex ?? c.hexcode ?? null;
          return { id, name, hex, __raw: c };
        });
        setColor(normalized);

        // fetch product after the lists (so we can map colors properly when populating)
        if (pid) {
          try {
            const pRes = await api.get(GET_URL(pid), { signal: ac.signal });
            if (!mountedRef.current) return;
            const p = pRes.data?.data ?? null;
            if (p) populateProduct(p);
          } catch (err) {
            if (err.name === "CanceledError" || err.name === "AbortError") return;
            console.error("fetch product failed", err);
          }
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        console.error("initial fetch failed", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  // populate product into local state (batched-ish)
  function populateProduct(p) {
    // populate many states
    setName(p.name ?? "");
    setPrice(p.price ?? "");
    setOfferPrice(p.discount_price ?? "");
    setCategory(p.category?.id ?? p.category ?? "");
    setPlainDesc(p.plain_desc ?? "");
    setBigDesc(p.rich_desc ?? "");
    setSeoTitle(p.seo_title ?? "");
    setSeoDescription(p.seo_description ?? "");
    try {
      const kw = (p.seo_keywords && typeof p.seo_keywords === "string") ? JSON.parse(p.seo_keywords) : p.seo_keywords;
      setSeoKeywords(Array.isArray(kw) ? kw : []);
    } catch {
      setSeoKeywords([]);
    }

    // main image
    if (p.main_image || p.image_url) {
      const remote = p.image_url ?? (p.main_image ? (p.main_image.startsWith("http") ? p.main_image : p.main_image) : null);
      if (remote) setMainImage({ file: null, url: remote, remotePath: p.main_image ?? null });
    } else {
      setMainImage(null);
    }

    // gallery
    if (Array.isArray(p.images)) {
      const mapped = p.images.map((im) => {
        const url = im.image_url ?? im.path ?? im.url ?? null;
        return url ? { file: null, url, remotePath: im.path ?? im.image ?? im.image_url ?? null } : null;
      }).filter(Boolean);
      setAdditionalImages(mapped);
    } else setAdditionalImages([]);

    // video url
    if (p.video_url || p.videoUrl) setVideoUrl(p.video_url ?? p.videoUrl ?? "");

    // colors
    if (Array.isArray(p.colors) && p.colors.length > 0) {
      const normalizedColors = p.colors.map(c => ({ id: String(c.color_id ?? c.id ?? c.color_id ?? ""), name: c.name ?? c.colorname ?? "", hex: c.hex ?? c.hexcode ?? null }));
      setColor(prev => {
        const map = new Map(prev.map(x => [String(x.id), x]));
        normalizedColors.forEach(nc => map.set(String(nc.id), nc));
        return Array.from(map.values());
      });
      setSelectedPerGroup(prev => ({ ...(prev || {}), color: normalizedColors.map(c => String(c.id)) }));
    }

    // variations -> selectedPerGroup + variantRows
    if (Array.isArray(p.variations)) {
      const sp = {};
      (p.variations || []).forEach((v) => {
        (v.parts || []).forEach((pt) => {
          const gid = String(pt.groupId);
          sp[gid] = sp[gid] || [];
          if (!sp[gid].includes(String(pt.value))) sp[gid].push(String(pt.value));
        });
      });
      setSelectedPerGroup(sp);

      const vrows = (p.variations || []).map((v) => {
        const parts = (v.parts || []).map(ppt => ({
          groupId: String(ppt.groupId ?? ppt.group_id ?? ppt.groupId),
          groupName: ppt.groupName ?? ppt.group_name ?? ppt.groupid_name ?? null,
          value: String(ppt.value ?? ""),
        }));
        return {
          key: v.key ?? parts.map(pp => `${String(pp.groupId)}:${pp.value}`).join("|"),
          parts,
          priceExtra: v.extra_price ?? v.extraPrice ?? "0",
          sku: v.sku ?? "",
          qty: v.qty ?? v.quantity ?? 0,
          image: v.image_url ? { file: null, url: v.image_url, remotePath: v.image } : (v.image ? { file: null, url: v.image, remotePath: v.image } : null),
          variationId: v.id ?? v.variationId ?? null,
          clientIndex: v.client_index ?? v.clientIndex ?? null,
        };
      });

      setVariantRows(vrows);
    }
  }

  // Build variantRows when selectedPerGroup changes (creates combinations) with cap
  useEffect(() => {
    const groups = Object.keys(selectedPerGroup).filter((k) => (selectedPerGroup[k] || []).length > 0);
    const groupNameMap = new Map();
    (variations || []).forEach((g) => groupNameMap.set(String(g.id), g.name));

    const arraysForProduct = groups.map((vid) => {
      const safeGroupId = String(vid);
      const groupName = groupNameMap.get(safeGroupId) ?? safeGroupId;
      return (selectedPerGroup[vid] || []).map((opt) => ({ groupId: safeGroupId, groupName, value: String(opt) }));
    });

    if (arraysForProduct.length === 0) {
      if (!variantRows.length) setVariantRows([]);
      setTooManyVariants(false);
      return;
    }

    // early check: compute count without building full product if possible
    const counts = arraysForProduct.map(a => a.length);
    const totalCombinations = counts.reduce((a, b) => a * b, 1);
    if (totalCombinations > MAX_VARIANTS) {
      setTooManyVariants(true);
      // Optionally clear or keep previous; we'll keep previous but won't generate new huge set
      return;
    } else {
      setTooManyVariants(false);
    }

    const raw = cartesianProduct(arraysForProduct);
    const newRows = raw.map((combo) => {
      const parts = combo.map((entry) => ({ groupId: String(entry.groupId), groupName: entry.groupName, value: String(entry.value) }));
      const key = parts.map((p) => `${String(p.groupId)}:${p.value}`).join("|");
      return { key, parts, priceExtra: "0", sku: "", qty: "", image: null, variationId: null, clientIndex: null };
    });

    // Preserve previous values by key
    setVariantRows((prev) => {
      const prevMap = new Map(prev.map(r => [r.key, r]));
      return newRows.map(r => prevMap.has(r.key) ? { ...r, ...prevMap.get(r.key) } : r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerGroup, variations]);

  const onChangeGroupSelected = (variationId, arr) => setSelectedPerGroup((prev) => ({ ...prev, [variationId]: arr }));
  const updateVariantRow = (key, patch) => setVariantRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleVariantImage = (key, ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    // revoke previous if any
    setVariantRows(prev => prev.map(r => {
      if (r.key !== key) return r;
      if (r.image?.url && typeof r.image.url === "string" && r.image.url.startsWith("blob:")) URL.revokeObjectURL(r.image.url);
      return { ...r, image: { file, url } };
    }));
  };

  // media image handlers with revoke
  const handleMainImage = (file) => {
    if (!file) return;
    // revoke old
    if (mainImage?.url && mainImage.url.startsWith("blob:")) URL.revokeObjectURL(mainImage.url);
    setMainImage({ file, url: URL.createObjectURL(file) });
  };
  const handleAddImages = (files) => {
    const mapped = Array.from(files).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setAdditionalImages((prev) => [...prev, ...mapped]);
  };
  const removeAdditionalImage = (idx) => {
    setAdditionalImages(prev => {
      const copy = [...prev];
      const img = copy[idx];
      if (img?.remotePath) {
        setRemovedGallery(r => Array.from(new Set([...r, img.remotePath])));
      }
      if (img?.url && img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      copy.splice(idx, 1);
      return copy;
    });
  };
  // const removeMainImage = () => {
  //   if (mainImage?.url && mainImage.url.startsWith("blob:")) URL.revokeObjectURL(mainImage.url);
  //   if (mainImage?.remotePath) {
  //     // backend will delete if you send removeMain flag
  //   }
  //   setMainImage(null);
  // };

  // example handler in your EditProductPreview.jsx
const removeMainImage = () => {
  if (!mainImage) return;

  // remember remotePath/url for comparison
  const removedPath = mainImage.remotePath ?? null;
  const removedUrl = mainImage.url ?? null;

  // clear main image
  setMainImage(null);

  // remove matching gallery entries (compare by remotePath first, then url)
  setAdditionalImages(prev =>
    prev.filter(img => {
      if (!img) return false;
      const rp = img.remotePath ?? null;
      const u  = img.url ?? null;
      if (removedPath && rp === removedPath) return false;
      if (removedUrl && u === removedUrl) return false;
      return true;
    })
  );

  // also mark to backend that main image was removed when you send form
  // (you already do: form.append("removeMain","1"))
};

  function StepNav({ step, setStep }) {
  return (
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={() => { setStep(s => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="px-4 py-2 bg-gray-200 rounded"
      >
        Back
      </button>

      <button
        type="button"
        onClick={() => { setStep(s => Math.min(4, s + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        Next
      </button>
    </div>
  );
}

  // ------------ MEDIA STEP SAVE ------------
// Helper: convert blob: or data: URL to File
async function urlToFile(url, filenameBase = 'file_' + Date.now()) {
  const res = await fetch(url);
  const blob = await res.blob();
  const mime = blob.type || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const filename = filenameBase.endsWith('.' + ext) ? filenameBase : `${filenameBase}.${ext}`;
  return new File([blob], filename, { type: mime });
}

// Step 1 - basic details

const saveBasicDetails = async () => {
  if (!pid) return alert("No product id.");

  try {
    const form = new FormData();
    form.append("step", "basic");
    form.append("name", name || "");
    form.append("price", price || "");
    form.append("discountPrice", offerPrice || "");
    form.append("category", category || "");
    form.append("plainDesc", plainDesc || "");
    form.append("richDesc", bigDesc || "");

    const res = await api.post(UPDATE_URL(pid), form, { headers: { Accept: "application/json" } });

    if (res?.data?.product) {
      const p = res.data.product;
      setName(p.name ?? name);
      setPrice(p.price ?? price);
      setOfferPrice(p.discount_price ?? offerPrice);
      setCategory(p.category?.id ?? p.category ?? category);
      setPlainDesc(p.plain_desc ?? plainDesc);
      setBigDesc(p.rich_desc ?? bigDesc);
    }

    alert("Basic details updated");
  } catch (err) {
    console.error(err);
    const msg = err?.response?.data?.message || err?.response?.data?.errors || err.message || "Update failed";
    alert(msg);
  }
};

// step 2 - media

async function urlToFile(url, filenameBase = 'file_' + Date.now()) {
  const res = await fetch(url);
  const blob = await res.blob();
  const mime = blob.type || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const filename = filenameBase.endsWith('.' + ext) ? filenameBase : `${filenameBase}.${ext}`;
  return new File([blob], filename, { type: mime });
}

// Clear copy-paste sendMediaStep
const sendMediaStep = async () => {
  if (!pid) { alert("No product id."); return; }

  try {
    setUploadProgress(0);
    const form = new FormData();

    // Tell backend this is MEDIA update
    form.append("step", "media");

    // Video URL
    form.append("videoUrl", videoUrl || "");

    // ---------- MAIN IMAGE ----------
    if (mainImage) {
      if (mainImage.file instanceof File) {
        // new uploaded file
        form.append("mainImage", mainImage.file, mainImage.file.name);
      } else if (typeof mainImage.remotePath === "string" && mainImage.remotePath.trim() !== "") {
        // existing stored pointer (path or URL)
        form.append("mainImage", mainImage.remotePath);
      } else if (typeof mainImage.url === "string" && (mainImage.url.startsWith("blob:") || mainImage.url.startsWith("data:"))) {
        // convert blob/data -> File
        const f = await urlToFile(mainImage.url, `main_${Date.now()}`);
        form.append("mainImage", f, f.name);
      }
    } else {
      // user removed main image
      form.append("removeMain", "1");
    }

    // ---------- GALLERY / ADDITIONAL IMAGES ----------
    const pointerPaths = [];
    const mainRp = mainImage?.remotePath ?? null; // exclude main pointer from gallery

    for (let i = 0; i < additionalImages.length; i++) {
      const a = additionalImages[i];
      if (!a) continue;

      // new file
      if (a.file instanceof File) {
        form.append("gallery[]", a.file, a.file.name);
        continue;
      }

      // stored pointer (path) — exclude if it's the main image pointer
      if (typeof a.remotePath === "string" && a.remotePath.trim() !== "" && a.remotePath !== mainRp) {
        pointerPaths.push(a.remotePath);
        continue;
      }

      // absolute external URL
      if (typeof a.url === "string" && (a.url.startsWith("http://") || a.url.startsWith("https://")) && a.url !== mainRp) {
        pointerPaths.push(a.url);
        continue;
      }

      // blob/data -> convert to File and append
      if (typeof a.url === "string" && (a.url.startsWith("blob:") || a.url.startsWith("data:"))) {
        const f = await urlToFile(a.url, `gallery_${i}_${Date.now()}`);
        form.append("gallery[]", f, f.name);
        continue;
      }

      // otherwise skip (no valid data)
    }

    // send pointer list as JSON string (backend decodes)
    form.append("additionalImages", JSON.stringify(pointerPaths));

    // append removed gallery pointers (if any)
    (removedGallery || []).forEach(p => {
      if (p != null) form.append("removedGallery[]", p);
    });

    // ---------- DEBUG (optional) ----------
    // for (const pair of form.entries()) console.log(pair[0], pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]);

    // ---------- SEND ----------
    const res = await api.post(UPDATE_URL(pid), form, {
      headers: { Accept: "application/json" },
      onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    });

    // ---------- SYNC RESPONSE INTO UI ----------
    if (res?.data?.product) {
      const updated = res.data.product;

      // main image
      if (updated.main_image || updated.image_url) {
        const remote = updated.image_url ?? updated.main_image;
        setMainImage({ file: null, url: remote, remotePath: updated.main_image ?? null });
      } else {
        setMainImage(null);
      }

      // gallery images
      if (Array.isArray(updated.images)) {
        const mapped = updated.images.map(img => {
          const url = img.image_url ?? img.path ?? img.url ?? null;
          return url ? { file: null, url, remotePath: img.path ?? img.image ?? img.image_url ?? null } : null;
        }).filter(Boolean);
        setAdditionalImages(mapped);
      }
    }

    setRemovedGallery([]);
    setUploadProgress(null);
    alert("Media updated successfully.");
  } catch (err) {
    console.error("sendMediaStep error:", err);
    const serverMsg = err?.response?.data?.message || err?.response?.data?.errors;
    alert(serverMsg || "Media update failed");
    setUploadProgress(null);
  }
};
// step 3 - variations
const sendVariationsStep = async () => {
  if (!pid) { alert("No product id."); return; }
  try {
    setUploadProgress(0);

    // build groupName map (optional, for groupName in parts)
    const groupNameMapForSubmit = new Map();
    (variations || []).forEach(g => groupNameMapForSubmit.set(String(g.id), g.name));

    // build payload (ensure parts is defined)
      const variationsPayload = variantRows.map((r, idx) => {
        const parts = (r.parts || []).map(p => ({ groupId: String(p.groupId), groupName: r.groupName ?? null, value: String(p.value ?? "") }));
        return {
          variationId: r.variationId ?? r.id ?? idx,
          key: r.key,
          parts,
          extraPrice: String(r.priceExtra ?? "0"),
          sku: String(r.sku ?? ""),
          qty: Number(r.qty ?? 0),
          clientIndex: r.clientIndex ?? idx,
          hasImage: !!r.image?.file || !!r.image?.url || !!r.image?.remotePath,
          // IMPORTANT: include existing pointer if there's no file upload
          image: r.image?.file ? undefined : (r.image?.remotePath ?? r.image?.url ?? null)
        };
      });

    const form = new FormData();

    // identify this request as variations-only
    form.append("step", "variations");
    form.append("variations", JSON.stringify(variationsPayload));

    // append variant image files / pointers
    for (let idx = 0; idx < variantRows.length; idx++) {
      const r = variantRows[idx];
      if (!r?.image) continue;

      const clientIndex = r.clientIndex ?? idx;
      const fieldName = `variant_image_${clientIndex}`;

      if (r.image.file instanceof File) {
        form.append(fieldName, r.image.file, r.image.file.name);
      } else if (typeof r.image.url === 'string' && r.image.url.startsWith('blob:')) {
        // convert blob -> File temporarily and append
        const f = await urlToFile(r.image.url, `variant_${clientIndex}_${Date.now()}.jpg`);
        form.append(fieldName, f, f.name);
      } else if (r.image.remotePath && typeof r.image.remotePath === 'string') {
        // send pointer string if your backend expects variant_image_<idx> to be a pointer
        form.append(fieldName, r.image.remotePath);
      }
    }

    // removed variant images (paths) array
    removedVariantImages.forEach(p => {
      if (p != null) form.append("removedVariantImages[]", p);
    });

    // DEBUG: inspect FormData (files show File object)
    // (Remove this block in production)
    console.log("=== variations FormData preview ===");
    for (const entry of form.entries()) {
      if (entry[1] instanceof File) console.log(entry[0], "=> File(", entry[1].name, ")");
      else console.log(entry[0], "=>", entry[1]);
    }
    console.log("=== end preview ===");

    // send
    const res = await api.post(UPDATE_URL(pid), form, {
      onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); }
    });

    // sync variations/variant images if response contains them
    if (res?.data?.product && Array.isArray(res.data.product.variations)) {
      const vrows = (res.data.product.variations || []).map((v) => {
        const parts = (v.parts || []).map(ppt => ({
          groupId: String(ppt.groupId ?? ppt.group_id ?? ppt.groupId),
          groupName: ppt.groupName ?? ppt.group_name ?? null,
          value: String(ppt.value ?? ""),
        }));
        return {
          key: v.key ?? parts.map(pp => `${String(pp.groupId)}:${pp.value}`).join("|"),
          parts,
          priceExtra: v.extra_price ?? v.extraPrice ?? "0",
          sku: v.sku ?? "",
          qty: v.qty ?? v.quantity ?? 0,
          image: v.image_url ? { file: null, url: v.image_url, remotePath: v.image } : (v.image ? { file: null, url: v.image, remotePath: v.image } : null),
          variationId: v.id ?? v.variationId ?? null,
          clientIndex: v.client_index ?? v.clientIndex ?? null,
        };
      });
      setVariantRows(vrows);
    }

    setRemovedVariantImages([]);
    setUploadProgress(null);
    alert("Variations saved.");
  } catch (err) {
    console.error("sendVariationsStep error:", err);
    const msg = err?.response?.data?.message || err.message || "Variations save failed";
    alert(msg);
    setUploadProgress(null);
  }
};

 // step 4 - SEO only
const saveSEO = async () => {
  if (!pid) return alert("No product id.");

  try {
    setUploadProgress(0);
    const form = new FormData();

    // tell backend this is the SEO-only step
    form.append("step", "seo");

    // send SEO as single JSON object
    form.append("seo", JSON.stringify({
      title: seoTitle || "",
      description: seoDescription || "",
      keywords: Array.isArray(seoKeywords) ? seoKeywords : []
    }));

    const res = await api.post(UPDATE_URL(pid), form, {
      headers: { Accept: "application/json" },
      onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    });

    if (res?.data?.product) {
      const updated = res.data.product;
      // update local state from server's response
      setSeoTitle(updated.seo_title ?? (updated.seo?.title ?? seoTitle ?? ""));
      setSeoDescription(updated.seo_description ?? (updated.seo?.description ?? seoDescription ?? ""));
      try {
        const kw = (updated.seo_keywords && typeof updated.seo_keywords === 'string') ? JSON.parse(updated.seo_keywords) : (updated.seo?.keywords ?? seoKeywords);
        setSeoKeywords(Array.isArray(kw) ? kw : []);
      } catch {
        setSeoKeywords(seoKeywords || []);
      }
    }

    setUploadProgress(null);
    alert("SEO updated successfully.");
  } catch (err) {
    console.error("saveSEO error:", err);
    const msg = err?.response?.data?.message || err?.response?.data?.errors || err.message || "SEO update failed";
    alert(msg);
    setUploadProgress(null);
  }
};

// Step 5 - All final update (media + variations + basic + seo + colors)

const handleSubmit = async () => {
  if (!pid) { alert("No product id available."); return; }
  try {
    setUploadProgress(0);

    // keep minimal fields so server-side validators don't fail
    const form = new FormData();
    form.append("step", "final"); // keep your backend's expected step if needed
    // minimal required fields (send current values so they remain unchanged)
    form.append("name", String(name ?? ""));
    form.append("price", String(price ?? 0));

    // The fields you actually want to update:
    form.append("plainDesc", String(plainDesc ?? ""));
    form.append("richDesc", String(bigDesc ?? ""));
    
    // DEBUG preview (optional)
    
    const res = await api.post(UPDATE_URL(pid), form, {
      onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); }
    });

    console.log("=== update response ===", res?.data);
    setSubmittedPayload(prev => ({ ...prev, uploadResponse: res.data }));
    setUploadProgress(null);
    alert("Product updated successfully.");

    // Update local UI with returned product fields (SEO + descriptions)
    if (res?.data?.product) {
      const updated = res.data.product;

      // update descriptions
      setPlainDesc(updated.plain_desc ?? updated.plainDesc ?? plainDesc ?? "");
      setBigDesc(updated.rich_desc ?? updated.richDesc ?? bigDesc ?? "");

      // update SEO fields
      setSeoTitle(updated.seo_title ?? (updated.seo?.title ?? seoTitle ?? ""));
      setSeoDescription(updated.seo_description ?? (updated.seo?.description ?? seoDescription ?? ""));

      try {
        const kw = (updated.seo_keywords && typeof updated.seo_keywords === "string") ? JSON.parse(updated.seo_keywords) : (updated.seo?.keywords ?? seoKeywords);
        setSeoKeywords(Array.isArray(kw) ? kw : (Array.isArray(seoKeywords) ? seoKeywords : []));
      } catch {
        setSeoKeywords(seoKeywords || []);
      }
    }

  } catch (err) {
    console.error("final update failed:", err);
    const msg = err?.response?.data?.message || err.message || "Update failed";
    setSubmittedPayload(prev => ({ ...prev, uploadError: msg }));
    setUploadProgress(null);
    alert("Update failed: " + msg);
  }
};

  const removeVariantImage = (variantKey, justClearLocal = false) => {
    setVariantRows(prev => prev.map(r => {
      if (r.key !== variantKey) return r;
      // if remotePath exists push into removedVariantImages
      if (r.image?.remotePath && !justClearLocal) setRemovedVariantImages(arr => Array.from(new Set([...arr, r.image.remotePath])));
      if (r.image?.url && r.image.url.startsWith("blob:")) URL.revokeObjectURL(r.image.url);
      return { ...r, image: null };
    }));
  };

  // final update: sends ALL fields (media + variations + basic + seo + colors)

  // wrapper used by review buttons
  const handleFinalUpdate = async () => {
    await handleSubmit();
  };

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (mainImage?.url?.startsWith?.("blob:")) URL.revokeObjectURL(mainImage.url);
      additionalImages.forEach(a => { if (a?.url?.startsWith?.("blob:")) URL.revokeObjectURL(a.url); });
      variantRows.forEach(v => { if (v?.image?.url?.startsWith?.("blob:")) URL.revokeObjectURL(v.image.url); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function colorLabelFor(value, colors = []) {
    if (value === null || value === undefined) return "";
    const v = String(value);
    const found = (colors || []).find(c => String(c.id) === v);
    return found ? (found.name ?? v) : String(value);
  }

  // handle variant image upload from VariantsTable
  const onUploadImageForRow = (key, ev) => handleVariantImage(key, ev);

  // ----- Renderers (Media, Variations, etc.) -----
  function renderMediaStep() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Main Image</div>
                <div className="text-xs text-gray-400">Recommended 800×600</div>
              </div>
              <div className="text-xs text-gray-500">PNG/JPEG</div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="w-full h-56 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
                {mainImage ? (
                  <img src={mainImage.url} alt="main" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="text-gray-300">No main image</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMainImage(e.target.files?.[0])} />
                  <span className="text-sm">Upload Main</span>
                </label>

                {mainImage && (
                  <button type="button" onClick={removeMainImage} className="px-3 py-2 bg-red-50 text-red-600 border rounded">Remove</button>
                )}

                <div className="text-xs text-gray-400">Or drag & drop (coming soon)</div>
              </div>

              <div className="w-full mt-2">
                <label className="block text-sm font-medium text-gray-700">Video URL (YouTube / Vimeo)</label>
                <div className="mt-2 flex gap-2">
                  <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 border rounded-lg p-3" />
                  <button type="button" onClick={() => setVideoUrl("")} className="px-3 py-2 bg-white border rounded">Clear</button>

                </div>
                {videoUrl ? (
                  <div className="mt-3 border rounded overflow-hidden">
                    {videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? (
                      <iframe title="video-preview" src={videoUrl.includes("embed") ? videoUrl : videoUrl.replace("watch?v=", "embed/")} className="w-full h-48" frameBorder="0" allowFullScreen />
                    ) : (
                      <a href={videoUrl} target="_blank" rel="noreferrer" className="block p-3 text-sm text-indigo-600">Open video</a>
                    )}
                  </div>
                ) : null}
              </div>
             
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Gallery</div>
                <div className="text-xs text-gray-400">Multiple images — first is shown as thumbnail</div>
              </div>
              <div className="text-xs text-gray-500">Drag to reorder</div>
            </div>

            <div className="mb-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddImages(e.target.files)} />
                <span className="text-sm">Add Images</span>
              </label>
            </div>

                <div className="grid grid-cols-3 gap-3">
                  {additionalImages.filter(img => img.remotePath !== mainImage?.remotePath).length === 0 ? (
                    <div className="col-span-3 text-xs text-gray-400">No gallery images</div>
                  ) : (
                    additionalImages
                      .filter(img => img.remotePath !== mainImage?.remotePath) // ⛔ remove main image
                      .map((a, i) => (
                        <div key={(a.remotePath ?? a.url) + "-" + i} className="relative border rounded overflow-hidden">
                          <img src={a.url} alt={`gallery-${i}`} className="w-full h-24 object-cover" draggable={false} loading="lazy" />

                          <button
                            onClick={() => removeAdditionalImage(i)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-600 border shadow-sm"
                          >
                            ×
                          </button>

                          <div className="absolute left-2 bottom-2 bg-black bg-opacity-30 text-white text-xs px-2 py-0.5 rounded">
                            #{i + 1}
                          </div>
                        </div>
                      ))
                  )}
                </div>

            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={sendMediaStep} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Media</button>
            
              <button type="button" onClick={() => setStep(s => Math.min(4, s - 1))} className="px-4 py-2 bg-white border rounded">Back</button>
                <button type="button" onClick={() => setStep(s => Math.min(4, s + 1))} className="px-4 py-2 bg-white border rounded">Next</button>
            </div>

            {uploadProgress !== null && (
              <div className="mt-3 text-sm">
                Upload progress: {uploadProgress}% <div className="w-full bg-gray-100 rounded h-2 mt-1"><div style={{ width: `${uploadProgress}%` }} className="h-2 rounded bg-indigo-500" /></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderVariationsStep() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">Variations (multi-select dropdowns)</h3>
          <div className="text-xs text-gray-400">Pick options in each group — combinations appear below.</div>
        </div>

        <div className="grid gap-4">
          {variations.map((v) => (
            <div key={v.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <MultiSelect
                label={v.name}
                options={
                  (String(v.id).toLowerCase() === "color")
                    ? (color || []).map((c) => ({ label: c.name ?? c.colorname ?? String(c.id), value: String(c.id), hex: c.hex ?? null }))
                    : (v.options || []).map((o) =>
                      (typeof o === "object")
                        ? { label: o.label ?? String(o.value), value: String(o.value ?? o.id ?? o), hex: o.hex ?? null }
                        : { label: String(o), value: String(o), hex: null }
                    )
                }
                selected={(selectedPerGroup[v.id] || []).map(String)}
                onChange={(arr) => onChangeGroupSelected(v.id, (arr || []).map(String))}
                placeholder={`Select ${v.name}`}
              />
            </div>
          ))}

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold mb-3">Generated Variants</h4>
            <div className="text-xs text-gray-500 mb-3">Configure per-variant price, SKU, stock and image.</div>

            {tooManyVariants && (
              <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-sm text-yellow-800">
                Too many combinations to generate locally. Please reduce selections (or update variants server-side).
              </div>
            )}

            <VariantsTable
              rows={variantRows}
              color={color}
              onChangeRow={updateVariantRow}
              onUploadImageForRow={onUploadImageForRow}
              onRemoveVariantImage={(key) => removeVariantImage(key)}
            />
              
            <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 bg-gray-200 rounded">Back</button>
              <button type="button" onClick={sendVariationsStep} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Variations</button>
              <button type="button" onClick={() => setStep(s => Math.min(4, s + 1))} className="px-4 py-2 bg-white border rounded">Next</button>
            </div>

            {uploadProgress !== null && (
              <div className="mt-3 text-sm">
                Upload progress: {uploadProgress}% <div className="w-full bg-gray-100 rounded h-2 mt-1"><div style={{ width: `${uploadProgress}%` }} className="h-2 rounded bg-indigo-500" /></div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 0:
      return (
  <div className="space-y-4">

    {/* Product Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Product Name *</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
      />
    </div>

    {/* Price + Offer Price */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Offer Price</label>
        <input
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
        />
      </div>
    </div>

    {/* Category */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
      >
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>

    {/* Short Description */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Short Description</label>
      <textarea
        rows={3}
        value={plainDesc}
        onChange={(e) => setPlainDesc(e.target.value)}
        className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
      />
    </div>

    {/* Long Description */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Long Description</label>
      <textarea
        rows={4}
        value={bigDesc}
        onChange={(e) => setBigDesc(e.target.value)}
        className="mt-1 w-full border rounded p-2"
      />
    </div>

    {/* BUTTONS */}
    <div className="flex gap-2">
      <button
        onClick={() => setStep(s => Math.max(0, s - 1))}
        className="px-4 py-2 bg-gray-200 rounded"
      >
        Back
      </button>

      <button
        onClick={saveBasicDetails}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Save Details
      </button>

      <button
        onClick={() => setStep(s => Math.min(4, s + 1))}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        Next
      </button>
    </div>
  </div>
);

      case 1: return renderMediaStep();
      case 2: return renderVariationsStep();
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-md font-semibold">SEO Tags</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta title</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="mt-2 block w-full border rounded-lg p-3"
                placeholder="Meta title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="mt-2 block w-full border rounded-lg p-3"
                placeholder="Meta description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
              <div className="mt-2 border rounded p-2 flex flex-wrap gap-2">
                {seoKeywords.map((tag, index) => (
                  <span key={index} className="flex items-center px-2 py-1 bg-gray-100 rounded text-sm gap-2">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setSeoKeywords(seoKeywords.filter((_, i) => i !== index))}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  className="flex-1 p-2 outline-none text-sm"
                  placeholder="Type keyword & press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) setSeoKeywords([...seoKeywords, val]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 bg-gray-200 rounded-lg mr-2">Back</button>
              </div>

              <div className="flex items-center gap-2">
                
                <button
                    type="button"
                    onClick={saveSEO}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Save SEO
                  </button>
                <button type="button" onClick={() => setStep(4)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Next</button>
              </div>
            </div>
          </div>
        );

      case 4:
       return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Review & Update</h3>
        <p className="text-sm text-gray-500 mt-1">
          Check everything below. Edit quick fields or expand steps to change media / variants.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md text-sm"
        >
          Edit Media
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md text-sm"
        >
          Edit Variations
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md text-sm"
        >
          Edit Basic
        </button>

         <button
          type="button"
          onClick={() => setStep(3)}
          className="px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md text-sm"
        >
          Edit Seo
        </button>

      </div>
    </div>

  {/* Review / Preview Card — copy-paste ready */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="md:col-span-3 bg-white border rounded-lg p-5 shadow-sm">

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* LEFT: MAIN IMAGE CARD */}
      <div className="col-span-1">
        <div className="w-full h-56 bg-gray-50 rounded overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm">
          {mainImage ? (
            <img
              src={mainImage.url}
              alt="main"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-300 flex flex-col items-center">
              <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 11l2 2 3-3 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-sm">No main image</div>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
          <div>Main image</div>
          {/* optional action slot */}
        </div>
      </div>

      {/* RIGHT: DETAILS CARD */}
      <div className="col-span-2 bg-white rounded-lg p-5 border border-gray-100 shadow-sm">

        {/* TOP ROW: name / category / price */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-300 border-b border-transparent pb-1"
              placeholder="Product name"
              aria-label="Product name"
            />

            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <div className="text-sm text-gray-500">
                Category:
                <span className="ml-1 text-gray-800 font-medium">
                  {categories.find((c) => String(c.id) === String(category))?.name ?? category ?? "—"}
                </span>
              </div>

              {/* Price badge */}
              <div className="ml-2 inline-flex items-center gap-2">
                <div className="px-3 py-1 text-lg font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                  {price ? `₹${price}` : "₹0"}
                </div>
                {offerPrice ? (
                  <div className="px-2 py-0.5 text-sm rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Offer ₹{offerPrice}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400">Last updated</div>
            <div className="text-sm text-gray-700">{/* show updated_at here if available */}</div>
          </div>
        </div>

        {/* HORIZONTAL DIVIDER */}
        <div className="my-4 border-t border-gray-100" />

        {/* DESCRIPTION AREA — side by side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Short Description */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 mb-1 block">Short description</label>
              <div className="text-xs text-gray-400">Preview</div>
            </div>

            <textarea
              rows={4}
              value={plainDesc}
              onChange={(e) => setPlainDesc(e.target.value)}
              className="resize-none w-full border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm border-gray-100"
              placeholder="Write a short summary..."
              aria-label="Short description"
            />

            {/* live preview (small) */}
            <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-50">
              <strong className="text-gray-800">Preview:</strong>
              <div className="mt-1 text-sm whitespace-pre-wrap">
                {plainDesc || <span className="text-gray-300">No short description</span>}
              </div>
            </div>
          </div>

          {/* Long Description */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 mb-1 block">Long description</label>
              <div className="text-xs text-gray-400">Detailed</div>
            </div>

            <textarea
              rows={6}
              value={bigDesc}
              onChange={(e) => setBigDesc(e.target.value)}
              className="resize-y w-full border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm border-gray-100"
              placeholder="Detailed product description..."
              aria-label="Long description"
            />

            {/* word/char count */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <div>{bigDesc ? `${bigDesc.length} characters` : "0 characters"}</div>
              <div>{/* optionally: reading time */}</div>
            </div>
          </div>

        </div>

        {/* FOOTER: actions */}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep?.(0)}
              className="px-3 py-2 bg-white border rounded-md text-sm text-gray-700 hover:shadow-sm transition"
            >
              Edit Basic
            </button>
            <button
              type="button"
              onClick={() => setStep?.(1)}
              className="px-3 py-2 bg-white border rounded-md text-sm text-gray-700 hover:shadow-sm transition"
            >
              Edit Media
            </button>
            <button
              type="button"
              onClick={() => setStep?.(2)}
              className="px-3 py-2 bg-white border rounded-md text-sm text-gray-700 hover:shadow-sm transition"
            >
              Edit Variants
            </button>
          </div>

          <div className="text-xs text-gray-500">Tip: use the edit buttons to jump to a step</div>
        </div>
      </div>
    </div>

    {/* GALLERY */}
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Gallery</div>
        <div className="text-xs text-gray-400">Manage images in Media step</div>
      </div>

      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {additionalImages.length === 0 ? (
          <div className="text-xs text-gray-400">No gallery images</div>
        ) : (
          additionalImages.map((a, i) => (
            <div
              key={(a.remotePath ?? a.url ?? "") + "-" + i}
              className="relative h-24 border rounded overflow-hidden"
            >
              <img
                src={a.url}
                alt={`g-${i}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={() => removeAdditionalImage(i)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 border shadow-sm"
                aria-label={`Remove gallery image ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>

    {/* VARIANTS */}
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Variants</div>
        <div className="text-xs text-gray-400">Edit in Variations step</div>
      </div>

      <div className="mt-2 space-y-2">
        {variantRows.length === 0 ? (
          <div className="text-xs text-gray-400">No variants</div>
        ) : (
          variantRows.map((r) => (
            <div key={r.key} className="p-2 border rounded flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.parts
                    .map((p) =>
                      String(p.groupId).toLowerCase() === "color"
                        ? colorLabelFor(p.value, color)
                        : String(p.value)
                    )
                    .join(" — ")}
                </div>
                <div className="text-xs text-gray-500">
                  Extra: ₹{r.priceExtra || 0} — SKU: {r.sku || "—"} — Qty: {r.qty || "—"}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                {r.image ? (
                  <img
                    src={r.image.url}
                    alt="v"
                    className="w-16 h-10 object-cover rounded border"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-xs text-gray-400">No photo</div>
                )}
                <button
                  onClick={() =>
                    updateVariantRow(r.key, { priceExtra: r.priceExtra, sku: r.sku, qty: r.qty })
                  }
                  className="px-3 py-1 bg-white border rounded text-xs"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* SEO */}
    <div className="mt-6">
      <div className="text-sm font-medium">SEO</div>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Meta Title (read-only) */}
        <input
          value={seoTitle}
          readOnly
          className="border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed w-full"
          placeholder="Meta title"
          aria-label="SEO title (read only)"
        />

        {/* Meta Description (read-only) */}
        <input
          value={seoDescription}
          readOnly
          className="border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed w-full"
          placeholder="Meta description"
          aria-label="SEO description (read only)"
        />

        {/* Keywords (read-only) */}
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Keywords</label>
          <div className="mt-1 flex flex-wrap gap-2 bg-gray-50 p-2 rounded border min-h-[42px]">
            {seoKeywords.length === 0 ? (
              <div className="text-xs text-gray-400">No keywords</div>
            ) : (
              seoKeywords.map((k, i) => (
                <span
                  key={i}
                  className="bg-gray-200 px-2 py-1 rounded text-sm text-gray-700"
                >
                  {k}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

  </div>
);

      default: return null;
    }
  }

  if (!pid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-4 mb-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Edit Product — Wizard</h2><div className="text-sm text-gray-500">Product ID: —</div></div></div>
          <div className="bg-white rounded p-6 shadow">No product id provided. Open via /product-edit/:id or pass productId prop.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center justify-between">
          {/* <div className="flex items-center gap-6">
            {[{ id: 0, label: '1. Basic' }, { id: 1, label: '2. Media' }, { id: 2, label: '3. Variations' }, { id: 3, label: '4. SEO' }, { id: 4, label: '5. Review' }].map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-3 ${idx === step ? "text-indigo-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${idx === step ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"}`}>{idx + 1}</div>
                <div className="text-sm hidden md:block">{s.label}</div>
              </div>
            ))}
          </div> */}
          <div className="flex items-center gap-4 md:gap-6 p-2 bg-white border rounded-lg shadow-sm">
  {[
    { id: 0, label: '1. Basic' },
    { id: 1, label: '2. Media' },
    { id: 2, label: '3. Variations' },
    { id: 3, label: '4. SEO' },
    { id: 4, label: '5. Review' },
  ].map((s, idx) => {
    const active = idx === step;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => setStep(idx)}
        className={`flex items-center gap-3 px-2 py-1 rounded-lg transition-all
          ${active ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}
        `}
      >
        {/* Number Circle */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-medium transition-all
            ${active 
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm" 
              : "border-gray-300 bg-white"
            }
          `}
        >
          {idx + 1}
        </div>

        {/* Text Label */}
        <span className="hidden md:block text-sm font-medium">
          {s.label}
        </span>
      </button>
    );
  })}
</div>

          <div className="text-sm text-gray-500">Step {step + 1} of 5</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-md rounded-2xl overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">Edit Product — Wizard</h2></div>
            <div className="p-6"><form onSubmit={(e) => e.preventDefault()}>{loading ? <div>Loading product...</div> : renderStep()}</form></div>
          </div>

          <aside className="bg-white shadow-md rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border flex items-center justify-center">
                {mainImage ? <img src={mainImage.url} alt="preview" className="w-full h-full object-cover" loading="lazy" /> : <div className="text-gray-300">No image</div>}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{name || "Untitled product"}</div>
                <div className="text-sm text-gray-500">{category || "—"}</div>
                <div className="mt-2 text-xl font-bold">{price ? `₹${price}` : "—"} {offerPrice ? <span className="text-sm text-gray-500">(Offer: ₹{offerPrice})</span> : null}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">{plainDesc || "No short description"}</div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Selected combinations</div>
              <div className="mt-2 text-sm text-gray-700">
                {variantRows.length === 0 ? <span className="text-gray-400 text-xs">No variants</span> : variantRows.map((r) => (
                  <div key={r.key} className="text-sm">
                    {r.parts.map((p) => String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value, color) : String(p.value)).join(" — ")} {" — "}
                    <span className="text-xs text-gray-500">{r.qty || "no qty"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-3">
              <div className="text-xs text-gray-500">Payload preview</div>
              {submittedPayload ? <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">{JSON.stringify(submittedPayload, null, 2)}</pre> : <div className="text-xs text-gray-400 mt-2">Use step save buttons to update parts (media/variations) or final Submit.</div>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
