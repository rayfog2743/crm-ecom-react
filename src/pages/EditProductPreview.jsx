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
  const GET_URL = (id) => `/admin/products/product/${id}`;

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
  const removeMainImage = () => {
    if (mainImage?.url && mainImage.url.startsWith("blob:")) URL.revokeObjectURL(mainImage.url);
    if (mainImage?.remotePath) {
      // backend will delete if you send removeMain flag
    }
    setMainImage(null);
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

const sendMediaStep = async () => {
  if (!pid) { alert("No product id."); return; }
  try {
    setUploadProgress(0);
    const form = new FormData();

    // identify step
    form.append("step", "media");
    form.append("videoUrl", videoUrl || "");

    // required fields to avoid validation fail
    form.append("name", name || "");
    form.append("price", price || "");
    form.append("discountPrice", offerPrice || "");
    form.append("category", category || "");
    form.append("seo", JSON.stringify({
      title: seoTitle || "",
      description: seoDescription || "",
      keywords: seoKeywords || []
    }));

    // ----------------------------
    // MAIN IMAGE: strictly append either a File or a string pointer (not an object/array)
    // Expect mainImage to be either:
    //   null/undefined  -> means removed
    //   { file: File, url?, remotePath? }
    //   { remotePath: "products/..jpg", url? }
    // ----------------------------
    if (mainImage) {
      // If mainImage.file is a real File, append that
      if (mainImage.file instanceof File) {
        form.append("mainImage", mainImage.file, mainImage.file.name);
      } else if (typeof mainImage.remotePath === "string" && mainImage.remotePath.trim() !== "") {
        // append the pointer string (storage path or remote URL)
        form.append("mainImage", mainImage.remotePath);
      } else if (typeof mainImage.url === "string" && mainImage.url.startsWith("blob:")) {
        // convert blob: URL to File and append
        const f = await urlToFile(mainImage.url, `main_${Date.now()}`);
        form.append("mainImage", f, f.name);
      } else if (typeof mainImage.url === "string" && mainImage.url.startsWith("data:")) {
        const f = await urlToFile(mainImage.url, `main_${Date.now()}`);
        form.append("mainImage", f, f.name);
      } else {
        // fallback: if you accidentally stored the pointer in some other field, check it and append
        if (mainImage.remotePath) {
          form.append("mainImage", String(mainImage.remotePath));
        } else {
          // nothing valid to append for mainImage -> send nothing (backend will keep existing unless you send removeMain)
          console.warn("sendMediaStep: mainImage present but contains no file or remotePath/url; nothing appended for mainImage");
        }
      }
    } else {
      // user intentionally removed the main image -> tell backend to remove
      form.append("removeMain", "1");
    }

    // ----------------------------
    // GALLERY / additional images
    // - uploaded files -> gallery[]
    // - remote pointers -> additionalImages[]
    // ----------------------------
    for (let i = 0; i < additionalImages.length; i++) {
      const a = additionalImages[i];
      if (!a) continue;
      if (a.file instanceof File) {
        form.append("gallery[]", a.file, a.file.name);
      } else if (typeof a.remotePath === "string" && a.remotePath.trim() !== "") {
        form.append("additionalImages[]", a.remotePath);
      } else if (typeof a.url === "string" && a.url.startsWith("blob:")) {
        const f = await urlToFile(a.url, `gallery_${i}_${Date.now()}`);
        form.append("gallery[]", f, f.name);
      } else if (typeof a.url === "string" && a.url.startsWith("data:")) {
        const f = await urlToFile(a.url, `gallery_${i}_${Date.now()}`);
        form.append("gallery[]", f, f.name);
      } else {
        console.warn(`sendMediaStep: gallery item ${i} has no file/remotePath/url; skipping`);
      }
    }

    // removed gallery items (paths) that frontend marked for deletion
    removedGallery.forEach(p => {
      if (p != null) form.append("removedGallery[]", p);
    });

    // ----------------------------
    // DEBUG: log exactly what will be sent (files show filename + size)
    // ----------------------------
    console.log("========== MEDIA STEP FORM DATA PREVIEW ==========");
    for (const pair of form.entries()) {
      const key = pair[0];
      const val = pair[1];
      if (val instanceof File) {
        console.log(" ", key, "=> File(", val.name, ",", val.size, "bytes )");
      } else {
        console.log(" ", key, "=>", val);
      }
    }
    console.log("=================================================");

    // ----------------------------
    // SEND
    // ----------------------------
    const res = await api.post(UPDATE_URL(pid), form, {
      onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    });

    // sync updated result into UI (same as you had)
    if (res?.data?.product) {
      const updated = res.data.product;

      if (updated.main_image || updated.image_url) {
        const remote = updated.image_url ?? updated.main_image;
        setMainImage({ file: null, url: remote, remotePath: updated.main_image ?? null });
      } else {
        setMainImage(null);
      }

      if (Array.isArray(updated.images)) {
        const mapped = updated.images.map(im => {
          const url = im.image_url ?? im.path ?? im.url ?? null;
          return url ? { file: null, url, remotePath: im.path ?? im.image ?? im.image_url ?? null } : null;
        }).filter(Boolean);
        setAdditionalImages(mapped);
      }
    }

    setRemovedGallery([]);
    setUploadProgress(null);
    alert("Media saved.");
  } catch (err) {
    console.error("sendMediaStep error:", err);
    const resp = err?.response?.data;
    if (resp) {
      console.error("Server response:", resp);
      if (typeof resp.errors === "string") alert(resp.errors);
      else if (typeof resp.errors === "object") {
        const msgs = [];
        Object.keys(resp.errors).forEach(k => {
          const val = resp.errors[k];
          if (Array.isArray(val)) msgs.push(...val);
          else msgs.push(String(val));
        });
        alert("Validation error:\n" + msgs.join("\n"));
      } else {
        alert(resp.message || "Media save failed");
      }
    } else {
      alert(err?.message || "Media save failed");
    }
    setUploadProgress(null);
  }
};

  // ------------ VARIATIONS STEP SAVE ------------
  const sendVariationsStep = async () => {
    if (!pid) { alert("No product id."); return; }
    try {
      setUploadProgress(0);

      // normalize groupName map
      const groupNameMapForSubmit = new Map();
      (variations || []).forEach(g => groupNameMapForSubmit.set(String(g.id), g.name));

      const variationsPayload = variantRows.map((r, idx) => {
        const parts = (r.parts || []).map(p => ({
          groupId: String(p.groupId),
          groupName: p.groupName ?? groupNameMapForSubmit.get(String(p.groupId)) ?? null,
          value: String(p.value ?? ""),
        }));

        return {
          variationId: r.variationId ?? r.id ?? idx,
          key: r.key,
          parts,
          extraPrice: r.priceExtra || "0",
          sku: r.sku || "",
          qty: r.qty || 0,
          clientIndex: r.clientIndex ?? idx,
          hasImage: !!r.image?.file || !!r.image?.url,
        };
      });

      const form = new FormData();
      form.append("step", "variations");
      form.append("variations", JSON.stringify(variationsPayload));

      // append variant images; use clientIndex if present else idx
      for (let idx = 0; idx < variantRows.length; idx++) {
        const r = variantRows[idx];
        if (!r?.image) continue;

        const fieldName = `variant_image_${r.clientIndex ?? idx}`;
        if (r.image.file instanceof File) form.append(fieldName, r.image.file, r.image.file.name);
        else if (typeof r.image.url === 'string' && r.image.url.startsWith('blob:')) {
          const f = await urlToFile(r.image.url, `variant_${idx}_${Date.now()}.jpg`);
          form.append(fieldName, f, f.name);
        } else if (r.image.remotePath && typeof r.image.remotePath === 'string') {
          // include remote path so backend keeps it
          form.append(fieldName, r.image.remotePath);
        }
      }

      // removed variant images
      removedVariantImages.forEach(p => form.append("removedVariantImages[]", p));

      const res = await api.post(UPDATE_URL(pid), form, {
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); }
      });

      // sync variations/variant images if response contains them
      if (res?.data?.product) {
        const updated = res.data.product;
        if (Array.isArray(updated.variations)) {
          const vrows = (updated.variations || []).map((v) => {
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
const handleSubmit = async () => {
  if (!pid) { alert("No product id available."); return; }
  try {
    setUploadProgress(0);

    // prepare variationsPayload (same as you had)
    const groupNameMapForSubmit = new Map();
    (variations || []).forEach(g => groupNameMapForSubmit.set(String(g.id), g.name));
    const variationsPayload = variantRows.map((r, idx) => {
      const parts = (r.parts || []).map(p => ({
        groupId: String(p.groupId),
        groupName: r.groupName ?? groupNameMapForSubmit.get(String(p.groupId)) ?? null,
        value: String(p.value ?? ""),
      }));
      return {
        variationId: r.variationId ?? r.id ?? idx,
        key: r.key,
        parts,
        extraPrice: r.priceExtra || "0",
        sku: r.sku || "",
        qty: r.qty || 0,
        clientIndex: r.clientIndex ?? idx,
        hasImage: !!r.image?.file || !!r.image?.url,
      };
    });

    const form = new FormData();
    form.append("name", name || "");
    form.append("price", price || "");
    form.append("discountPrice", offerPrice || "");
    form.append("category", category || "");
    form.append("plainDesc", plainDesc || "");
    form.append("richDesc", bigDesc || "");
    form.append("videoUrl", videoUrl || "");
    form.append("seo", JSON.stringify({ title: seoTitle, description: seoDescription, keywords: seoKeywords || [] }));
    form.append("variations", JSON.stringify(variationsPayload));
    form.append("colors", JSON.stringify((selectedPerGroup?.["color"] || []).map(cid => {
      const found = (color || []).find(c => String(c.id) === String(cid));
      return { id: found?.id ?? cid, name: found?.name ?? String(cid), hex: found?.hex ?? null };
    })));

    // main image
    if (mainImage) {
      if (mainImage.file instanceof File) form.append("mainImage", mainImage.file, mainImage.file.name);
      else if (mainImage.remotePath && typeof mainImage.remotePath === "string") form.append("mainImage", mainImage.remotePath);
      else if (typeof mainImage.url === "string" && mainImage.url.startsWith("blob:")) {
        const f = await urlToFile(mainImage.url, `main_${Date.now()}.jpg`);
        form.append("mainImage", f, f.name);
      }
    } else {
      form.append("removeMain", "1");
    }

    // gallery: NEW files as gallery[] AND keep existing remotePaths as additionalImages[] (or change to backend expected name)
    for (let i = 0; i < additionalImages.length; i++) {
      const a = additionalImages[i];
      if (a?.file instanceof File) {
        form.append("gallery[]", a.file, a.file.name); // new file
      } else if (a?.remotePath && typeof a.remotePath === "string") {
        // keep existing image by remote path — ensure your backend expects "additionalImages[]" (or change to existingImages[] if required)
        form.append("additionalImages[]", a.remotePath);
      } else if (a?.url && typeof a.url === "string" && a.url.startsWith("blob:")) {
        const f = await urlToFile(a.url, `gallery_${i}_${Date.now()}.jpg`);
        form.append("gallery[]", f, f.name);
      }
    }

    // removed gallery
    removedGallery.forEach(p => form.append("removedGallery[]", p));

    // variant images (as you had)
    for (let idx = 0; idx < variantRows.length; idx++) {
      const r = variantRows[idx];
      if (!r?.image) continue;
      const fieldName = `variant_image_${r.clientIndex ?? idx}`;
      if (r.image.file instanceof File) form.append(fieldName, r.image.file, r.image.file.name);
      else if (typeof r.image.url === 'string' && r.image.url.startsWith('blob:')) {
        const f = await urlToFile(r.image.url, `variant_${idx}_${Date.now()}.jpg`);
        form.append(fieldName, f, f.name);
      } else if (r.image.remotePath && typeof r.image.remotePath === 'string') {
        form.append(fieldName, r.image.remotePath);
      }
    }
    removedVariantImages.forEach(p => form.append("removedVariantImages[]", p));

    // === DEBUG: list FormData being sent ===
    console.log("=== handleSubmit form data preview ===");
    for (const entry of form.entries()) {
      // For files, entry[1] is File object; show name
      if (entry[1] instanceof File) console.log(entry[0], "=> File(", entry[1].name, ")");
      else console.log(entry[0], "=>", entry[1]);
    }
    console.log("=== end preview ===");

    // send
    const res = await api.post(UPDATE_URL(pid), form, {
      onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); }
    });

    // debug server response
    console.log("=== update response ===", res?.data);

    setSubmittedPayload(prev => ({ ...prev, uploadResponse: res.data }));
    setUploadProgress(null);
    alert("Product updated successfully.");

    // --- Update local state images robustly ---
    if (res?.data?.product) {
      const updated = res.data.product;

      // MAIN IMAGE
      if (updated.image_url || updated.main_image) {
        const remote = updated.image_url ?? updated.main_image;
        // add cache-bust if same url to force reload
        const url = remote && typeof remote === "string" ? (remote + `?t=${Date.now()}`) : remote;
        setMainImage({ file: null, url, remotePath: updated.main_image ?? null });
      } else {
        setMainImage(null);
      }

      // GALLERY
      if (Array.isArray(updated.images) && updated.images.length > 0) {
        const mapped = updated.images.map(im => {
          const url = im.image_url ?? im.path ?? im.url ?? null;
          const urlWithTs = url ? (String(url) + `?t=${Date.now()}`) : null;
          return url ? { file: null, url: urlWithTs, remotePath: im.path ?? im.image ?? im.image_url ?? null } : null;
        }).filter(Boolean);
        setAdditionalImages(mapped);
      } else {
        // fallback: if server didn't return images, re-fetch product to be safe
        console.warn("Server response did not include updated images — fetching product to sync state.");
        await fetchProduct(pid);
      }

      // VARIATIONS (if returned)
      if (Array.isArray(updated.variations)) {
        const vrows = (updated.variations || []).map(v => {
          const parts = (v.parts || []).map(ppt => ({ groupId: String(ppt.groupId ?? ppt.group_id ?? ppt.groupId), groupName: ppt.groupName ?? ppt.group_name ?? ppt.groupid_name ?? null, value: String(ppt.value ?? "") }));
          return {
            key: v.key ?? parts.map(pp => `${String(pp.groupId)}:${pp.value}`).join("|"),
            parts,
            priceExtra: v.extra_price ?? v.extraPrice ?? "0",
            sku: v.sku ?? "",
            qty: v.qty ?? v.quantity ?? 0,
            image: v.image_url ? { file: null, url: (v.image_url + `?t=${Date.now()}`), remotePath: v.image } : (v.image ? { file: null, url: (v.image + `?t=${Date.now()}`), remotePath: v.image } : null),
            variationId: v.id ?? v.variationId ?? null,
            clientIndex: v.client_index ?? v.clientIndex ?? null,
          };
        });
        setVariantRows(vrows);
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
              {additionalImages.length === 0 ? (
                <div className="col-span-3 text-xs text-gray-400">No gallery images</div>
              ) : (
                additionalImages.map((a, i) => (
                  <div key={(a.remotePath ?? a.url) + "-" + i} className="relative border rounded overflow-hidden">
                    <img src={a.url} alt={`gallery-${i}`} className="w-full h-24 object-cover" draggable={false} loading="lazy" />
                    <button onClick={() => removeAdditionalImage(i)} className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-600 border shadow-sm">×</button>
                    <div className="absolute left-2 bottom-2 bg-black bg-opacity-30 text-white text-xs px-2 py-0.5 rounded">{i === 0 ? 'Primary' : `#${i + 1}`}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={sendMediaStep} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Media</button>
              <button type="button" onClick={() => setStep(s => Math.min(4, s + 1))} className="px-4 py-2 bg-white border rounded">Next</button>
              <button type="button" onClick={() => setStep(s => Math.min(4, s - 1))} className="px-4 py-2 bg-white border rounded">Back</button>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Offer Price</label>
                <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Plain Description</label>
              <textarea rows={3} value={plainDesc} onChange={(e) => setPlainDesc(e.target.value)} className="mt-2 block w-full border rounded-lg p-3 shadow-sm" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 bg-gray-200 rounded">Back</button>
              <button onClick={() => setStep(s => Math.min(4, s + 1))} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>
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
                <button type="button" onClick={() => { setStep(4); }} className="px-4 py-2 bg-white border rounded-lg">Save</button>
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
                <p className="text-sm text-gray-500 mt-1">Check everything below. Edit quick fields or expand steps to change media/variants.</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="px-3 py-2 bg-white border rounded">Edit Media</button>
                <button type="button" onClick={() => setStep(2)} className="px-3 py-2 bg-white border rounded">Edit Variations</button>
                <button type="button" onClick={() => setStep(0)} className="px-3 py-2 bg-white border rounded">Edit Basic</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white border rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <div className="w-full h-48 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                      {mainImage ? <img src={mainImage.url} alt="main" className="w-full h-full object-cover" loading="lazy" /> : <div className="text-gray-300">No main image</div>}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Main image</div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-semibold w-full" />
                        <div className="text-sm text-gray-500 mt-1">Category: {categories.find(c => String(c.id) === String(category))?.name ?? category ?? "—"}</div>
                        <div className="mt-2 text-xl font-bold">{price ? `₹${price}` : "—"} {offerPrice ? <span className="text-sm text-gray-500">(Offer: ₹{offerPrice})</span> : null}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">Last updated</div>
                        <div className="text-sm text-gray-700">{/* optionally show updated_at if you store it */}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs text-gray-500">Short description</label>
                      <textarea rows={2} value={plainDesc} onChange={(e) => setPlainDesc(e.target.value)} className="mt-1 w-full border rounded p-2" />
                    </div>

                    <div className="mt-3">
                      <label className="text-xs text-gray-500">Long description</label>
                      <textarea rows={4} value={bigDesc} onChange={(e) => setBigDesc(e.target.value)} className="mt-1 w-full border rounded p-2" />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium">Gallery</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {additionalImages.length === 0 ? <div className="text-xs text-gray-400">No gallery images</div> : additionalImages.map((a, i) => (
                      <div key={(a.remotePath ?? a.url) + "-" + i} className="relative h-24 border rounded overflow-hidden">
                        <img src={a.url} alt={`g-${i}`} className="w-full h-full object-cover" loading="lazy" />
                        <button onClick={() => removeAdditionalImage(i)} className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 border shadow-sm">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium">Variants</div>
                  <div className="mt-2 space-y-2">
                    {variantRows.length === 0 ? <div className="text-xs text-gray-400">No variants</div> :
                      variantRows.map(r => (
                        <div key={r.key} className="p-2 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-medium">{r.parts.map(p => (String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value, color) : String(p.value))).join(" — ")}</div>
                            <div className="text-xs text-gray-500">Extra: ₹{r.priceExtra || 0} — SKU: {r.sku || '—'} — Qty: {r.qty || '—'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            {r.image ? <img src={r.image.url} alt="v" className="w-16 h-10 object-cover rounded border" loading="lazy" /> : <div className="text-xs text-gray-400">No photo</div>}
                            <button onClick={() => updateVariantRow(r.key, { priceExtra: r.priceExtra, sku: r.sku, qty: r.qty })} className="px-3 py-1 bg-white border rounded text-xs">Edit</button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium">SEO</div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Meta title" className="border rounded p-2" />
                    <input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Meta description" className="border rounded p-2" />
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500">Keywords</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {seoKeywords.map((k, i) => (<span key={i} className="bg-gray-100 px-2 py-1 rounded text-sm">{k} <button onClick={() => setSeoKeywords(ks => ks.filter((_, j) => j !== i))} className="ml-1 text-red-500">×</button></span>))}
                        <input onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) setSeoKeywords(s => [...s, v]); e.target.value = ''; } }} placeholder="Add keyword and press Enter" className="border rounded p-2 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Summary</div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500">Price / Offer</div>
                  <div className="text-lg font-semibold">₹{price || 0} {offerPrice ? <span className="text-sm text-gray-500"> (Offer ₹{offerPrice})</span> : null}</div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500">Selected Colors</div>
                  <div className="mt-2 space-y-1">
                    {(selectedPerGroup?.color || []).length === 0 ? <div className="text-xs text-gray-400">No colors</div> : (selectedPerGroup.color || []).map(cid => <div key={cid} className="text-sm">{colorLabelFor(cid, color)}</div>)}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button onClick={handleFinalUpdate} className="px-4 py-2 bg-indigo-600 text-white rounded">Update product</button>
                  <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 bg-white border rounded">Edit media</button>
                  <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 bg-white border rounded">Edit variants</button>
                </div>

                {uploadProgress !== null && (
                  <div className="mt-3 text-sm">
                    Upload progress: {uploadProgress}%
                    <div className="w-full bg-gray-100 rounded h-2 mt-1">
                      <div style={{ width: `${uploadProgress}%` }} className="h-2 rounded bg-indigo-500" />
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">Server response / payload</div>
                {submittedPayload ? (
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">{JSON.stringify(submittedPayload, null, 2)}</pre>
                ) : (
                  <div className="text-xs text-gray-400 mt-2">No response yet.</div>
                )}
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
          <div className="flex items-center gap-6">
            {[{ id: 0, label: '1. Basic' }, { id: 1, label: '2. Media' }, { id: 2, label: '3. Variations' }, { id: 3, label: '4. SEO' }, { id: 4, label: '5. Review' }].map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-3 ${idx === step ? "text-indigo-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${idx === step ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"}`}>{idx + 1}</div>
                <div className="text-sm hidden md:block">{s.label}</div>
              </div>
            ))}
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
