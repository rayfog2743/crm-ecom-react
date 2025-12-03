// EditProductPreview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

/* ----- helpers ----- */
function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => {
      const res = [];
      acc.forEach((a) => curr.forEach((c) => res.push([...a, c])));
      return res;
    },
    [[]]
  );
}

// Converts a blob: or data: URL into a File
async function urlToFile(url, filenameBase = "file_" + Date.now()) {
  const res = await fetch(url);
  const blob = await res.blob();
  const mime = blob.type || "image/jpeg";
  const ext = mime.split("/")[1] || "jpg";
  const filename = filenameBase.endsWith("." + ext)
    ? filenameBase
    : `${filenameBase}.${ext}`;
  return new File([blob], filename, { type: mime });
}

/* ====== NEW: normalize variant image from server (accepts many shapes) ====== */
function resolveVariantImage(v) {
  // v might be a string (url) or an object with image_url, image, path, remotePath, etc.
  if (!v) return null;

  // If v is a string, treat it as URL/path
  if (typeof v === "string") {
    return { file: null, url: String(v), remotePath: String(v) };
  }

  const url = v.image_url ?? v.imageUrl ?? v.image ?? v.url ?? v.path ?? null;
  const remotePath = v.image_path ?? v.remotePath ?? v.path ?? v.image ?? null;

  if (!url && !remotePath) return null;

  return {
    file: null,
    url: String(url || remotePath),
    remotePath: String(remotePath || url),
  };
}

/* ----- VariantsTable (memoized) ----- */
/* Debug / temporary VariantsTable (drop-in replacement) */
// ---- Temporary debug VariantsTable (drop this in place of the current VariantsTable) ----
function VariantsTable({
  rows = [],
  color = [],
  onChangeRow,
  onUploadImageForRow,
  onRemoveVariantImage,
}) {
  console.log("[VariantsTable DEBUG] rows prop:", rows);

  // Helper to show parts as label
  const partsLabel = (r) =>
    (r.parts || [])
      .map((p) =>
        String(p.groupId).toLowerCase() === "color"
          ? color.find((c) => String(c.id) === String(p.value))?.name ?? p.value
          : String(p.value)
      )
      .join(" — ");

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        padding: 8,
      }}
    >
      {/* Always-visible header with explicit styles to avoid Tailwind collisions */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "2px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
              }}
            >
              Variant
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "2px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                width: 120,
              }}
            >
              Extra Price
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "2px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                width: 140,
              }}
            >
              SKU
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "2px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                width: 100,
              }}
            >
              Quantity
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "2px solid #e5e7eb",
                background: "#f8fafc",
                color: "#111827",
                width: 160,
              }}
            >
              Photo
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 12, color: "#6b7280" }}>
                No combinations yet (select options)
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr
                key={r.key ?? `r-${idx}`}
                style={{ borderBottom: "1px solid #f3f4f6" }}
              >
                <td style={{ padding: 8 }}>
                  <div
                    style={{ display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: "#f9fafb",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {r.image?.url ? (
                        <img
                          src={r.image.url}
                          alt="v"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          No photo
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {partsLabel(r)}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Combination
                      </div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: 8 }}>
                  <input
                    value={r.priceExtra ?? ""}
                    onChange={(e) =>
                      onChangeRow?.(r.key, { priceExtra: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </td>

                <td style={{ padding: 8 }}>
                  <input
                    value={r.sku ?? ""}
                    onChange={(e) =>
                      onChangeRow?.(r.key, { sku: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </td>

                <td style={{ padding: 8 }}>
                  <input
                    value={r.qty ?? ""}
                    onChange={(e) =>
                      onChangeRow?.(r.key, { qty: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </td>

                <td style={{ padding: 8 }}>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <label
                      style={{
                        cursor: "pointer",
                        padding: "6px 8px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        background: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          if (f) onUploadImageForRow?.(r.key, f);
                        }}
                      />
                      Upload
                    </label>

                    {r.image?.remotePath && (
                      <button
                        onClick={() => onRemoveVariantImage?.(r.key)}
                        style={{
                          fontSize: 12,
                          color: "#dc2626",
                          background: "transparent",
                          border: 0,
                        }}
                      >
                        Remove old
                      </button>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.image?.file
                        ? r.image.file.name || "Uploaded file"
                        : r.image?.remotePath
                        ? r.image.remotePath
                        : r.image?.url
                        ? "Uploaded"
                        : "No file"}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* debug output to help you see runtime value */}
    </div>
  );
}

/* ----- MultiSelect (unchanged) ----- */
function MultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = "Select...",
}) {
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
        <div className="truncate text-sm">
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </div>
        <div className="text-xs text-gray-400">▾</div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg max-h-56 overflow-auto">
          <div className="p-2 text-xs text-gray-500">Click to toggle</div>
          {options.map((opt, idx) => {
            const optValue =
              opt && typeof opt === "object"
                ? String(opt.value ?? opt.id ?? idx)
                : String(opt);
            const optLabel =
              opt && typeof opt === "object"
                ? opt.label ?? opt.colorname ?? opt.name ?? optValue
                : String(opt);
            const hex =
              opt && typeof opt === "object"
                ? opt.hex ?? opt.hexcode ?? null
                : null;
            return (
              <label
                key={`${optValue}-${idx}`}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={optValue}
                  checked={selected.includes(optValue)}
                  onChange={() => toggle(optValue)}
                />
                <div className="text-sm flex items-center gap-2">
                  {hex && (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        background: hex,
                        display: "inline-block",
                        borderRadius: 4,
                      }}
                    />
                  )}
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

/* ----- main component ----- */
export default function EditProductPreview({ productId }) {
  // route param fallback
  let params = {};
  try {
    params = useParams() || {};
  } catch (e) {
    params = {};
  }
  const pidRaw = productId ?? params.id ?? params.productId ?? null;
  const pid =
    pidRaw === null ? null : Number(pidRaw) ? Number(pidRaw) : String(pidRaw);

  // States
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [category, setCategory] = useState("");
  const [plainDesc, setPlainDesc] = useState("");
  const [bigDesc, setBigDesc] = useState("");
  const [categories, setCategories] = useState([]);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);

  const [apivariations, setApivariations] = useState([]);
  const [color, setColor] = useState([]);

  const [selectedPerGroup, setSelectedPerGroup] = useState({});
  const [variantRows, setVariantRows] = useState([]);
  const [tooManyVariants, setTooManyVariants] = useState(false);

  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [removedGallery, setRemovedGallery] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");

  const [removedVariantImages, setRemovedVariantImages] = useState([]);
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  // const mountedRef = useRef(true);
  // const MAX_VARIANTS = 200;
  const mountedRef = useRef(true);
  const initializingVariantsRef = useRef(false); // NEW - prevents auto-generation from stomping server rows
  const MAX_VARIANTS = 200;

  const UPDATE_URL = (id) => `/admin/products/update/${id}`;
  const GET_URL = (id) => `/admin/products/product2/${id}`;

  /* ---------- normalize variations list for the UI ---------- */
  const variations = useMemo(() => {
    const fromApi = (apivariations || []).map((v, idx) => {
      const rawOptions =
        Array.isArray(v.options) && v.options.length
          ? v.options
          : Array.isArray(v.attributes) && v.attributes.length
          ? v.attributes.map((a) => a.value ?? a.name ?? String(a))
          : [];

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
        id: String(v.id ?? v.variation_id ?? v.name ?? idx),
        name: v.name ?? v.label ?? `Group ${v.id ?? idx}`,
        options,
      };
    });

    // add color group (if not present)
    const colorGroup = {
      id: "color",
      name: "Color",
      options: (color || []).map((c) => ({
        label: c.name ?? c.colorname ?? `Color ${c.id}`,
        value: String(c.id),
        hex: c.hex ?? null,
      })),
    };

    const hasColor = fromApi.some(
      (g) =>
        String(g.name).toLowerCase() === "color" ||
        String(g.name).toLowerCase() === "colour"
    );
    return hasColor ? fromApi : [...fromApi, colorGroup];
  }, [apivariations, color]);

  /* ---------- initial fetch (categories, variations, colors) and product ---------- */
  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const calls = [
          api.get("/admin/categories/show", { signal: ac.signal }),
          api.get("/admin/variation", { signal: ac.signal }),
          api.get("/admin/colors", { signal: ac.signal }),
        ];
        const [catsRes, varsRes, colorsRes] = await Promise.all(calls);
        if (!mountedRef.current) return;

        setCategories(catsRes.data?.data ?? []);
        setApivariations(varsRes.data?.variations ?? []);

        const raw = colorsRes.data?.colors ?? [];
        const normalized = (raw || []).map((c) => {
          const id = String(c.id ?? c.color_id ?? c.value ?? c.label ?? "");
          const name = c.colorname ?? c.name ?? c.label ?? id;
          const hex = c.hex ?? c.hexcode ?? null;
          return { id, name, hex, __raw: c };
        });
        setColor(normalized);

        if (pid) {
          try {
            const pRes = await api.get(GET_URL(pid), { signal: ac.signal });
            if (!mountedRef.current) return;
            const p = pRes.data?.data ?? null;
            if (p) populateProduct(p);
          } catch (err) {
            if (err.name === "CanceledError" || err.name === "AbortError")
              return;
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

  /* ---------- populate product into local state ---------- */
  function populateProduct(p) {
    console.log("Populating product:", p);
    setName(p.name ?? "");
    setPrice(p.price ?? "");
    setOfferPrice(p.discount_price ?? "");
    setCategory(p.category?.id ?? p.category ?? "");
    setPlainDesc(p.plain_desc ?? "");
    setBigDesc(p.rich_desc ?? "");
    setSeoTitle(p.seo_title ?? "");
    setSeoDescription(p.seo_description ?? "");
    try {
      const kw =
        p.seo_keywords && typeof p.seo_keywords === "string"
          ? JSON.parse(p.seo_keywords)
          : p.seo_keywords;
      setSeoKeywords(Array.isArray(kw) ? kw : []);
    } catch {
      setSeoKeywords([]);
    }

    // main image
    if (p.main_image || p.image_url) {
      const remote =
        p.image_url ??
        (p.main_image
          ? typeof p.main_image === "string"
            ? p.main_image
            : ""
          : null);
      if (remote)
        setMainImage({
          file: null,
          url: remote,
          remotePath: p.main_image ?? null,
        });
    } else {
      setMainImage(null);
    }

    // gallery
    if (Array.isArray(p.images)) {
      const mapped = p.images
        .map((im) => {
          const url = im.image_url ?? im.path ?? im.url ?? null;
          return url
            ? {
                file: null,
                url,
                remotePath: im.path ?? im.image ?? im.image_url ?? null,
              }
            : null;
        })
        .filter(Boolean);
      setAdditionalImages(mapped);
    } else setAdditionalImages([]);

    // video url
    if (p.video_url || p.videoUrl) setVideoUrl(p.video_url ?? p.videoUrl ?? "");

    // colors from product: merge with existing color list
    if (Array.isArray(p.colors) && p.colors.length > 0) {
      const normalizedColors = p.colors.map((c) => ({
        id: String(c.color_id ?? c.id ?? ""),
        name: c.name ?? c.colorname ?? "",
        hex: c.hex ?? c.hexcode ?? null,
      }));
      setColor((prev) => {
        const map = new Map(prev.map((x) => [String(x.id), x]));
        normalizedColors.forEach((nc) => map.set(String(nc.id), nc));
        return Array.from(map.values());
      });
      setSelectedPerGroup((prev) => ({
        ...(prev || {}),
        color: normalizedColors.map((c) => String(c.id)),
      }));
    }

    // Populate variations -> selectedPerGroup + variantRows (normalize keys to strings)
    if (Array.isArray(p.variations)) {
      initializingVariantsRef.current = true; // prevent auto-generation from running

      const sp = {};
      (p.variations || []).forEach((v) => {
        (v.parts || []).forEach((pt) => {
          const gid = String(pt.groupId);
          sp[gid] = sp[gid] || [];
          if (!sp[gid].includes(String(pt.value)))
            sp[gid].push(String(pt.value));
        });
      });

      // inside populateProduct, replace the vrows mapping with:
      const vrows = (p.variations || []).map((v, vi) => {
        const parts = (v.parts || []).map((ppt) => ({
          groupId: String(ppt.groupId ?? ppt.group_id ?? ppt.group ?? ""),
          groupName: ppt.groupName ?? ppt.group_name ?? null,
          value: String(ppt.value ?? ""),
          valueLabel: ppt.valueLabel ?? String(ppt.value ?? ""),
        }));

        const priceExtra =
          (v.extra_price ?? v.extraPrice ?? v.extra ?? "") + "";
        const sku = v.sku ?? "";
        const qty = (v.qty ?? v.quantity ?? "") + "";

        return {
          key:
            v.key ??
            parts.map((pp) => `${String(pp.groupId)}:${pp.value}`).join("|"),
          parts,
          priceExtra,
          extra_price: priceExtra,
          sku,
          qty,
          quantity: qty,
          image: resolveVariantImage(v),
          variationId: v.id ?? v.variationId ?? null,
          id: v.id ?? v.variationId ?? null,
          clientIndex: v.client_index ?? v.clientIndex ?? vi,
        };
      });

      setSelectedPerGroup(sp);
      setVariantRows(vrows);

      // set both selectedPerGroup and variantRows; keep the initializing flag set briefly

      // clear flag on next microtask so effect won't run in the middle of React's scheduling
      Promise.resolve().then(() => {
        initializingVariantsRef.current = false;
      });
    }
  }

  // useEffect(() => {
  //   if (initializingVariantsRef.current) return;

  //   const groups = Object.keys(selectedPerGroup).filter((k) => (selectedPerGroup[k] || []).length > 0);
  //   const groupNameMap = new Map();
  //   (variations || []).forEach((g) => groupNameMap.set(String(g.id), g.name));

  //   const arraysForProduct = groups.map((vid) => {
  //     const safeGroupId = String(vid);
  //     const groupName = groupNameMap.get(safeGroupId) ?? safeGroupId;
  //     return (selectedPerGroup[vid] || []).map((opt) => ({ groupId: safeGroupId, groupName, value: String(opt) }));
  //   });

  //   const counts = arraysForProduct.map(a => a.length);
  //   const totalCombinations = counts.reduce((a, b) => a * b, 1);
  //   if (totalCombinations > MAX_VARIANTS) {
  //     setTooManyVariants(true);
  //     return;
  //   } else {
  //     setTooManyVariants(false);
  //   }

  //   const raw = cartesianProduct(arraysForProduct);

  //   const newRows = raw.map((combo, idx) => {
  //     const parts = combo.map((entry) => ({ groupId: String(entry.groupId), groupName: entry.groupName, value: String(entry.value) }));
  //     const key = parts.map((p) => `${String(p.groupId)}:${p.value}`).join("|");

  //     // explicit defaults so UI & payload always have consistent fields
  //     return {
  //       key,
  //       parts,
  //       priceExtra: "0",
  //       extra_price: "0",
  //       sku: "",
  //       qty: "",
  //       quantity: "",
  //       image: null,
  //       variationId: null,
  //       id: null,
  //       clientIndex: idx,
  //     };
  //   });

  //   setVariantRows((prev) => {
  //     const prevMap = new Map(prev.map(r => [r.key, r]));
  //     console.log("Prev map:", prevMap);
  //     console.log("New rows:", newRows);

  //     return newRows.map(r => {
  //       // if (!prevMap.has(r.key)) return r;
  //       const prevRow = prevMap.get(r.key) || {};
  //       return { ...r, ...prevRow };
  //     });
  //   });
  // }, [selectedPerGroup, variations]);

  // useEffect(() => {
  //   if (initializingVariantsRef.current) return;

  //   const groups = Object.keys(selectedPerGroup).filter(
  //     (k) => (selectedPerGroup[k] || []).length > 0
  //   );
  //   const groupNameMap = new Map();
  //   (variations || []).forEach((g) => groupNameMap.set(String(g.id), g.name));

  //   const arraysForProduct = groups.map((vid) => {
  //     const safeGroupId = String(vid);
  //     const groupName = groupNameMap.get(safeGroupId) ?? safeGroupId;
  //     console.log(
  //       "Building array for group:",
  //       safeGroupId,
  //       selectedPerGroup[vid]
  //     );
  //     return (selectedPerGroup[vid] || []).map((opt) => ({
  //       groupId: safeGroupId,
  //       groupName,
  //       value: String(opt),
  //     }));
  //   });

  //   const counts = arraysForProduct.map((a) => a.length);
  //   const totalCombinations = counts.reduce((a, b) => a * b, 1);

  //   if (totalCombinations > MAX_VARIANTS) {
  //     setTooManyVariants(true);
  //     return;
  //   } else {
  //     setTooManyVariants(false);
  //   }

  //   const raw = cartesianProduct(arraysForProduct);

  //   const newRows = raw.map((combo, idx) => {
  //     const parts = combo.map((entry) => ({
  //       groupId: String(entry.groupId),
  //       groupName: entry.groupName,
  //       value: String(entry.value),
  //     }));

  //     const key = parts.map((p) => `${String(p.groupId)}:${p.value}`).join("|");

  //     return {
  //       key,
  //       parts,
  //       priceExtra: "0",
  //       extra_price: "0",
  //       sku: "",
  //       qty: "",
  //       quantity: "",
  //       image: null,
  //       variationId: null,
  //       id: null,
  //       clientIndex: idx,
  //     };
  //   });

  //   // 🔥🔥 FIXED MERGE LOGIC BELOW 🔥🔥
  //   function canonicalizeParts(parts) {
  //     const normalized = (parts || []).map((p) => ({
  //       groupId: String(p.groupId ?? ""),
  //       groupName: p.groupName ?? null,
  //       value: String(p.value ?? ""),
  //     }));

  //     normalized.sort((a, b) => {
  //       if (a.groupId < b.groupId) return -1;
  //       if (a.groupId > b.groupId) return 1;
  //       if (a.value < b.value) return -1;
  //       if (a.value > b.value) return 1;
  //       return 0;
  //     });

  //     const key = normalized.map((p) => `${p.groupId}:${p.value}`).join("|");
  //     return { parts: normalized, key };
  //   }

  //   setVariantRows((prev) => {
  //     const prevMap = new Map();
  //     let maxClientIndex = -1;

  //     // Canonicalize PREVIOUS rows
  //     prev.forEach((r) => {
  //       const canon = canonicalizeParts(r.parts);
  //       prevMap.set(canon.key, { ...r, parts: canon.parts, key: canon.key });
  //       if (typeof r.clientIndex === "number" && r.clientIndex > maxClientIndex)
  //         maxClientIndex = r.clientIndex;
  //     });

  //     // Canonicalize NEW rows & MERGE
  //     const merged = newRows.map((r, idx) => {
  //       const { parts: cParts, key: cKey } = canonicalizeParts(r.parts);
  //       const prevRow = prevMap.get(cKey);

  //       if (prevRow) {
  //         return {
  //           ...r,
  //           sku: prevRow.sku,
  //           qty: prevRow.qty,
  //           quantity: prevRow.quantity,
  //           priceExtra: prevRow.priceExtra,
  //           extra_price: prevRow.extra_price,
  //           image: prevRow.image,
  //           variationId: prevRow.variationId,
  //           id: prevRow.id,
  //           clientIndex: prevRow.clientIndex,
  //           parts: cParts,
  //           key: cKey,
  //         };
  //       }

  //       // new one
  //       return {
  //         ...r,
  //         parts: cParts,
  //         key: cKey,
  //         clientIndex: r.clientIndex ?? maxClientIndex + idx + 1,
  //       };
  //     });

  //     return merged;
  //   });
  // }, [selectedPerGroup, variations]);

  useEffect(() => {
    if (initializingVariantsRef.current) return;

    const groups = Object.keys(selectedPerGroup).filter(
      (k) => (selectedPerGroup[k] || []).length > 0
    );

    // map groupId -> groupName
    const groupNameMap = new Map();
    (variations || []).forEach((g) => groupNameMap.set(String(g.id), g.name));

    // Build option label lookup: groupId -> Map(value -> valueLabel)
    const optionLabelMap = new Map();
    (variations || []).forEach((g) => {
      const gid = String(g.id);
      const optMap = new Map();
      // try common option shapes: g.options || g.items || g.values
      const opts = g.options ?? g.items ?? g.values ?? [];
      (opts || []).forEach((opt) => {
        // try several key names for option id and label
        const optVal = String(
          opt.id ?? opt.value ?? opt.key ?? opt.code ?? opt.val ?? ""
        );
        const optLabel =
          opt.label ??
          opt.name ??
          opt.valueLabel ??
          opt.valueLabel ??
          opt.title ??
          optVal;
        if (optVal !== "") optMap.set(optVal, String(optLabel));
      });
      // also allow mapping if options are provided as plain strings (rare)
      if (opts && !Array.isArray(opts) && typeof opts === "object") {
        // no-op (already handled) — defensive
      }
      optionLabelMap.set(gid, optMap);
    });

    const arraysForProduct = groups.map((vid) => {
      const safeGroupId = String(vid);
      const groupName = groupNameMap.get(safeGroupId) ?? safeGroupId;
      console.log(
        "Building array for group:",
        safeGroupId,
        selectedPerGroup[vid]
      );
      return (selectedPerGroup[vid] || []).map((opt) => {
        const optStr = String(opt);
        const label =
          optionLabelMap.get(safeGroupId)?.get(optStr) ??
          // fallback: maybe selectedPerGroup stores objects {value, label}
          (typeof opt === "object" && (opt.label ?? opt.valueLabel)
            ? String(opt.label ?? opt.valueLabel)
            : null) ??
          optStr;
        return {
          groupId: safeGroupId,
          groupName,
          value: optStr,
          valueLabel: label,
        };
      });
    });

    const counts = arraysForProduct.map((a) => a.length);
    const totalCombinations = counts.reduce((a, b) => a * b, 1);

    if (totalCombinations > MAX_VARIANTS) {
      setTooManyVariants(true);
      return;
    } else {
      setTooManyVariants(false);
    }

    const raw = cartesianProduct(arraysForProduct);

    const newRows = raw.map((combo, idx) => {
      const parts = combo.map((entry) => ({
        groupId: String(entry.groupId),
        groupName: entry.groupName,
        value: String(entry.value),
        valueLabel: entry.valueLabel ?? String(entry.value),
      }));

      const key = parts.map((p) => `${String(p.groupId)}:${p.value}`).join("|");

      return {
        key,
        parts,
        priceExtra: "0",
        extra_price: "0",
        sku: "",
        qty: "",
        quantity: "",
        image: null,
        variationId: null,
        id: null,
        clientIndex: idx,
      };
    });

    // canonicalize but preserve valueLabel
    function canonicalizeParts(parts) {
      const normalized = (parts || []).map((p) => ({
        groupId: String(p.groupId ?? ""),
        groupName: p.groupName ?? null,
        value: String(p.value ?? ""),
        valueLabel: p.valueLabel ?? String(p.value ?? ""),
      }));

      normalized.sort((a, b) => {
        if (a.groupId < b.groupId) return -1;
        if (a.groupId > b.groupId) return 1;
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        return 0;
      });

      const key = normalized.map((p) => `${p.groupId}:${p.value}`).join("|");
      return { parts: normalized, key };
    }

    setVariantRows((prev) => {
      const prevMap = new Map();
      let maxClientIndex = -1;

      // Canonicalize PREVIOUS rows
      prev.forEach((r) => {
        const canon = canonicalizeParts(r.parts);
        prevMap.set(canon.key, { ...r, parts: canon.parts, key: canon.key });
        if (typeof r.clientIndex === "number" && r.clientIndex > maxClientIndex)
          maxClientIndex = r.clientIndex;
      });

      // Canonicalize NEW rows & MERGE
      const merged = newRows.map((r, idx) => {
        const { parts: cParts, key: cKey } = canonicalizeParts(r.parts);
        const prevRow = prevMap.get(cKey);

        if (prevRow) {
          return {
            ...r,
            sku: prevRow.sku,
            qty: prevRow.qty,
            quantity: prevRow.quantity,
            priceExtra: prevRow.priceExtra,
            extra_price: prevRow.extra_price,
            image: prevRow.image,
            variationId: prevRow.variationId,
            id: prevRow.id,
            clientIndex: prevRow.clientIndex,
            parts: cParts,
            key: cKey,
          };
        }

        // new one
        return {
          ...r,
          parts: cParts,
          key: cKey,
          clientIndex: r.clientIndex ?? maxClientIndex + idx + 1,
        };
      });

      return merged;
    });
  }, [selectedPerGroup, variations]);
  /* ---------- variant row helpers ---------- */
  const onChangeGroupSelected = (variationId, arr) =>
    setSelectedPerGroup((prev) => ({
      ...prev,
      [String(variationId)]: (arr || []).map(String),
    }));

  const updateVariantRow = (key, patch) => {
    setVariantRows((prev) =>
      prev.map((r, idx) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };

        if (next.clientIndex == null) next.clientIndex = r.clientIndex ?? idx;

        if ("qty" in patch) {
          const raw = patch.qty;
          next.qty = raw === "" || raw === null ? "" : String(raw);
        }

        if ("priceExtra" in patch)
          next.priceExtra =
            patch.priceExtra == null ? "" : String(patch.priceExtra);
        if ("sku" in patch)
          next.sku = patch.sku == null ? "" : String(patch.sku);

        if ("image" in patch && patch.image === null) {
          if (
            r.image?.url &&
            typeof r.image.url === "string" &&
            r.image.url.startsWith("blob:")
          ) {
            try {
              URL.revokeObjectURL(r.image.url);
            } catch (e) {}
          }
          next.image = null;
        }

        return next;
      })
    );
  };

  const handleVariantImage = (key, fileOrEvent) => {
    const file =
      fileOrEvent instanceof File
        ? fileOrEvent
        : fileOrEvent?.target?.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);

    setVariantRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (
          r.image?.url &&
          typeof r.image.url === "string" &&
          r.image.url.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(r.image.url);
          } catch (e) {}
        }
        return { ...r, image: { file, url, remotePath: null } };
      })
    );
  };

  const onUploadImageForRow = (key, file) => handleVariantImage(key, file);

  const removeVariantImage = (variantKey, justClearLocal = false) => {
    setVariantRows((prev) =>
      prev.map((r) => {
        if (r.key !== variantKey) return r;
        if (r.image?.remotePath && !justClearLocal)
          setRemovedVariantImages((arr) =>
            Array.from(new Set([...arr, r.image.remotePath]))
          );
        if (r.image?.url && r.image.url.startsWith("blob:"))
          URL.revokeObjectURL(r.image.url);
        return { ...r, image: null };
      })
    );
  };

  /* ---------- media handlers ---------- */
  const handleMainImage = (file) => {
    if (!file) return;
    if (mainImage?.url && mainImage.url.startsWith("blob:"))
      URL.revokeObjectURL(mainImage.url);
    setMainImage({ file, url: URL.createObjectURL(file) });
  };

  const handleAddImages = (files) => {
    const mapped = Array.from(files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setAdditionalImages((prev) => [...prev, ...mapped]);
  };

  const removeAdditionalImage = (idx) => {
    setAdditionalImages((prev) => {
      const copy = [...prev];
      const img = copy[idx];
      if (img?.remotePath)
        setRemovedGallery((r) => Array.from(new Set([...r, img.remotePath])));
      if (img?.url && img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const removeMainImage = () => {
    if (!mainImage) return;
    const removedPath = mainImage.remotePath ?? null;
    const removedUrl = mainImage.url ?? null;
    setMainImage(null);
    setAdditionalImages((prev) =>
      prev.filter((img) => {
        if (!img) return false;
        const rp = img.remotePath ?? null;
        const u = img.url ?? null;
        if (removedPath && rp === removedPath) return false;
        if (removedUrl && u === removedUrl) return false;
        return true;
      })
    );
  };

  /* ---------- step save functions (unchanged behavior, cleaned) ---------- */
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

      const res = await api.post(UPDATE_URL(pid), form, {
        headers: { Accept: "application/json" },
      });
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
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err.message ||
        "Update failed";
      alert(msg);
    }
  };

  const sendMediaStep = async () => {
    if (!pid) {
      alert("No product id.");
      return;
    }
    try {
      setUploadProgress(0);
      const form = new FormData();
      form.append("step", "media");
      form.append("videoUrl", videoUrl || "");

      if (mainImage) {
        if (mainImage.file instanceof File)
          form.append("mainImage", mainImage.file, mainImage.file.name);
        else if (
          typeof mainImage.remotePath === "string" &&
          mainImage.remotePath.trim() !== ""
        )
          form.append("mainImage", mainImage.remotePath);
        else if (
          typeof mainImage.url === "string" &&
          (mainImage.url.startsWith("blob:") ||
            mainImage.url.startsWith("data:"))
        ) {
          const f = await urlToFile(mainImage.url, `main_${Date.now()}`);
          form.append("mainImage", f, f.name);
        }
      } else {
        form.append("removeMain", "1");
      }

      const pointerPaths = [];
      const mainRp = mainImage?.remotePath ?? null;
      for (let i = 0; i < additionalImages.length; i++) {
        const a = additionalImages[i];
        if (!a) continue;
        if (a.file instanceof File) {
          form.append("gallery[]", a.file, a.file.name);
          continue;
        }
        if (
          typeof a.remotePath === "string" &&
          a.remotePath.trim() !== "" &&
          a.remotePath !== mainRp
        ) {
          pointerPaths.push(a.remotePath);
          continue;
        }
        if (
          typeof a.url === "string" &&
          (a.url.startsWith("http://") || a.url.startsWith("https://")) &&
          a.url !== mainRp
        ) {
          pointerPaths.push(a.url);
          continue;
        }
        if (
          typeof a.url === "string" &&
          (a.url.startsWith("blob:") || a.url.startsWith("data:"))
        ) {
          const f = await urlToFile(a.url, `gallery_${i}_${Date.now()}`);
          form.append("gallery[]", f, f.name);
          continue;
        }
      }

      form.append("additionalImages", JSON.stringify(pointerPaths));
      (removedGallery || []).forEach((p) => {
        if (p != null) form.append("removedGallery[]", p);
      });

      const res = await api.post(UPDATE_URL(pid), form, {
        headers: { Accept: "application/json" },
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (res?.data?.product) {
        const updated = res.data.product;
        if (updated.main_image || updated.image_url) {
          const remote = updated.image_url ?? updated.main_image;
          setMainImage({
            file: null,
            url: remote,
            remotePath: updated.main_image ?? null,
          });
        } else setMainImage(null);

        if (Array.isArray(updated.images)) {
          const mapped = updated.images
            .map((img) => {
              const url = img.image_url ?? img.path ?? img.url ?? null;
              return url
                ? {
                    file: null,
                    url,
                    remotePath: img.path ?? img.image ?? img.image_url ?? null,
                  }
                : null;
            })
            .filter(Boolean);
          setAdditionalImages(mapped);
        }
      }

      setRemovedGallery([]);
      setUploadProgress(null);
      alert("Media updated successfully.");
    } catch (err) {
      console.error("sendMediaStep error:", err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.errors;
      alert(serverMsg || "Media update failed");
      setUploadProgress(null);
    }
  };

  const sendVariationsStep = async () => {
    if (!pid) {
      alert("No product id.");
      return;
    }
    try {
      setUploadProgress(0);
      const groupNameMapForSubmit = new Map();
      (variations || []).forEach((g) =>
        groupNameMapForSubmit.set(String(g.id), g.name)
      );

      console.log(
        "DEBUG before sending - variantRows:",
        JSON.stringify(variantRows, null, 2)
      );

      const variationsPayload = variantRows.map((r, idx) => {
        const parts = (r.parts || []).map((p) => {
          const gid = String(p.groupId ?? p.group_id ?? "");
          const gname =
            (p.groupName && String(p.groupName).trim()) ||
            (r.groupName && String(r.groupName).trim()) ||
            groupNameMapForSubmit.get(gid) ||
            null;
          return {
            groupId: gid,
            groupName: gname,
            value: String(p.value ?? ""),
            valueLabel: p.valueLabel ?? String(p.value ?? ""),
          };
        });

        const variantObj = {
          variationId: r.variationId ?? r.id ?? idx,
          key: r.key,
          parts,
          clientIndex: r.clientIndex ?? idx,
          hasImage: !!r.image?.file || !!r.image?.url || !!r.image?.remotePath,
          image: r.image?.file
            ? undefined
            : r.image?.remotePath ?? r.image?.url ?? null,
        };

        if (r.priceExtra !== "" && r.priceExtra != null)
          variantObj.extraPrice = String(r.priceExtra);
        if (r.sku != null && String(r.sku).trim() !== "")
          variantObj.sku = String(r.sku);
        if (r.qty !== "" && r.qty != null) {
          const n = Number(r.qty);
          variantObj.qty = Number.isFinite(n) ? n : 0;
        }

        return variantObj;
      });

      console.log(
        "DEBUG variationsPayload to send:",
        JSON.stringify(variationsPayload, null, 2)
      );

      const form = new FormData();
      form.append("step", "variations");
      form.append("variations", JSON.stringify(variationsPayload));
      const groupNamesObj = Object.fromEntries(groupNameMapForSubmit);
      form.append("groupNames", JSON.stringify(groupNamesObj));

      for (let idx = 0; idx < variantRows.length; idx++) {
        const r = variantRows[idx];
        if (!r?.image) continue;
        const clientIndex = r.clientIndex ?? idx;
        const fieldName = `variant_image_${clientIndex}`;

        if (r.image.file instanceof File)
          form.append(fieldName, r.image.file, r.image.file.name);
        else if (
          typeof r.image.url === "string" &&
          r.image.url.startsWith("blob:")
        ) {
          const f = await urlToFile(
            r.image.url,
            `variant_${clientIndex}_${Date.now()}.jpg`
          );
          form.append(fieldName, f, f.name);
        } else if (
          r.image.remotePath &&
          typeof r.image.remotePath === "string"
        ) {
          form.append(fieldName, r.image.remotePath);
        } else if (
          typeof r.image.url === "string" &&
          !r.image.url.startsWith("blob:")
        ) {
          form.append(fieldName, r.image.url);
        }
      }

      removedVariantImages.forEach((p) => {
        if (p != null) form.append("removedVariantImages[]", p);
      });

      console.log("=== variations FormData preview ===");
      for (const entry of form.entries()) {
        if (entry[1] instanceof File)
          console.log(entry[0], "=> File(", entry[1].name, ")");
        else console.log(entry[0], "=>", entry[1]);
      }
      console.log("=== end preview ===");

      const res = await api.post(UPDATE_URL(pid), form, {
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      //    if (res?.data?.product && Array.isArray(res.data.product.variations)) {
      //   const vrows = (res.data.product.variations || []).map((v, vi) => {
      //     const parts = (v.parts || []).map(ppt => ({
      //       groupId: String(ppt.groupId ?? ppt.group_id ?? ppt.group ?? ""),
      //       groupName: ppt.groupName ?? ppt.group_name ?? null,
      //       value: String(ppt.value ?? ""),
      //       valueLabel: ppt.valueLabel ?? String(ppt.value ?? "")
      //     }));

      //     const priceExtra = (v.extra_price ?? v.extraPrice ?? v.extra ?? "") + "";
      //     const sku = v.sku ?? "";
      //     const qty = (v.qty ?? v.quantity ?? "") + "";

      //     return {
      //       key: v.key ?? parts.map(pp => `${String(pp.groupId)}:${pp.value}`).join("|"),
      //       parts,
      //       priceExtra,
      //       extra_price: priceExtra,
      //       sku,
      //       qty,
      //       quantity: qty,
      //       image: resolveVariantImage(v),
      //       variationId: v.id ?? v.variationId ?? null,
      //       id: v.id ?? v.variationId ?? null,
      //       clientIndex: v.client_index ?? v.clientIndex ?? vi,
      //     };
      //   });
      //   setVariantRows(vrows);
      // }

      // --- after receiving `res` from server ---
      if (res?.data?.product && Array.isArray(res.data.product.variations)) {
        // Build a quick lookup from your local `variations` metadata (groups + options)
        // Expected shape of `variations` (client-side): [{ id, name, options: [{ id/value, label }] }, ...]
        // This code is defensive and tries multiple field names.
        const groupOptionsMap = new Map(); // groupId -> { name, optionsMap(value->label) }

        (variations || []).forEach((g) => {
          const gid = String(g.id ?? g.groupId ?? g.key ?? "");
          const gname = g.name ?? g.groupName ?? g.label ?? null;

          const optionsMap = new Map();
          // common shapes: g.options = [{ id, value, label, name }], or g.values, g.items, g.parts etc.
          const opts =
            g.options ?? g.values ?? g.items ?? g.choices ?? g.parts ?? [];
          (opts || []).forEach((opt) => {
            // try many possible keys
            const optVal = String(
              opt.value ?? opt.id ?? opt.key ?? opt.option ?? opt.code ?? ""
            );
            const optLabel =
              opt.label ?? opt.name ?? opt.valueLabel ?? String(optVal);
            optionsMap.set(optVal, String(optLabel));
          });

          groupOptionsMap.set(gid, { name: gname, optionsMap });
        });

        // helper to resolve label and groupName from the lookup (fallbacks included)
        function resolvePartMeta(p) {
          const gid = String(p.groupId ?? p.group_id ?? p.group ?? "");
          const value = String(p.value ?? p.val ?? p.option ?? "");
          const groupMeta = groupOptionsMap.get(gid);
          const groupName =
            p.groupName ??
            p.group_name ??
            (groupMeta && groupMeta.name) ??
            null;
          let valueLabel =
            p.valueLabel ?? p.value_label ?? p.valueLabel ?? null;
          if (!valueLabel && groupMeta) {
            valueLabel =
              groupMeta.optionsMap.get(value) ??
              groupMeta.optionsMap.get(String(Number(value))) ??
              null;
          }
          if (!valueLabel) valueLabel = value; // fallback to raw value
          return { groupId: gid, groupName, value, valueLabel };
        }

        const vrows = (res.data.product.variations || []).map((v, vi) => {
          const parts = (v.parts || []).map((ppt) => {
            const resolved = resolvePartMeta(ppt);
            return {
              groupId: resolved.groupId,
              groupName: resolved.groupName,
              value: String(resolved.value ?? ""),
              valueLabel: resolved.valueLabel ?? String(resolved.value ?? ""),
            };
          });

          const priceExtra =
            (v.extra_price ?? v.extraPrice ?? v.extra ?? "") + "";
          const sku = v.sku ?? "";
          const qty = (v.qty ?? v.quantity ?? "") + "";

          return {
            key:
              v.key ??
              parts.map((pp) => `${String(pp.groupId)}:${pp.value}`).join("|"),
            parts,
            priceExtra,
            extra_price: priceExtra,
            sku,
            qty,
            quantity: qty,
            image: resolveVariantImage(v),
            // ensure image flags are clean
            imageChanged: false,
            imageRemoved: false,
            reuploadRemoteImage: false,
            variationId: v.id ?? v.variationId ?? null,
            id: v.id ?? v.variationId ?? null,
            clientIndex: v.client_index ?? v.clientIndex ?? vi,
          };
        });

        setVariantRows(vrows);
      }

      setRemovedVariantImages([]);
      setUploadProgress(null);
      alert("Variations saved.");
    } catch (err) {
      console.error("sendVariationsStep error:", err);
      const msg =
        err?.response?.data?.message || err.message || "Variations save failed";
      alert(msg);
      setUploadProgress(null);
    }
  };

  /* ---------- SEO and final submit (kept) ---------- */
  const saveSEO = async () => {
    if (!pid) return alert("No product id.");
    try {
      setUploadProgress(0);
      const form = new FormData();
      form.append("step", "seo");
      form.append(
        "seo",
        JSON.stringify({
          title: seoTitle || "",
          description: seoDescription || "",
          keywords: Array.isArray(seoKeywords) ? seoKeywords : [],
        })
      );
      const res = await api.post(UPDATE_URL(pid), form, {
        headers: { Accept: "application/json" },
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (res?.data?.product) {
        const updated = res.data.product;
        setSeoTitle(updated.seo_title ?? updated.seo?.title ?? seoTitle ?? "");
        setSeoDescription(
          updated.seo_description ??
            updated.seo?.description ??
            seoDescription ??
            ""
        );
        try {
          const kw =
            updated.seo_keywords && typeof updated.seo_keywords === "string"
              ? JSON.parse(updated.seo_keywords)
              : updated.seo?.keywords ?? seoKeywords;
          setSeoKeywords(Array.isArray(kw) ? kw : []);
        } catch {
          setSeoKeywords(seoKeywords || []);
        }
      }

      setUploadProgress(null);
      alert("SEO updated successfully.");
    } catch (err) {
      console.error("saveSEO error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err.message ||
        "SEO update failed";
      alert(msg);
      setUploadProgress(null);
    }
  };

  const handleSubmit = async () => {
    if (!pid) {
      alert("No product id available.");
      return;
    }
    try {
      setUploadProgress(0);
      const form = new FormData();
      form.append("step", "final");
      form.append("name", String(name ?? ""));
      form.append("price", String(price ?? 0));
      form.append("plainDesc", String(plainDesc ?? ""));
      form.append("richDesc", String(bigDesc ?? ""));

      const res = await api.post(UPDATE_URL(pid), form, {
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      console.log("=== update response ===", res?.data);
      setSubmittedPayload((prev) => ({ ...prev, uploadResponse: res.data }));
      setUploadProgress(null);
      alert("Product updated successfully.");

      if (res?.data?.product) {
        const updated = res.data.product;
        setPlainDesc(
          updated.plain_desc ?? updated.plainDesc ?? plainDesc ?? ""
        );
        setBigDesc(updated.rich_desc ?? updated.richDesc ?? bigDesc ?? "");
        setSeoTitle(updated.seo_title ?? updated.seo?.title ?? seoTitle ?? "");
        setSeoDescription(
          updated.seo_description ??
            updated.seo?.description ??
            seoDescription ??
            ""
        );
        try {
          const kw =
            updated.seo_keywords && typeof updated.seo_keywords === "string"
              ? JSON.parse(updated.seo_keywords)
              : updated.seo?.keywords ?? seoKeywords;
          setSeoKeywords(
            Array.isArray(kw)
              ? kw
              : Array.isArray(seoKeywords)
              ? seoKeywords
              : []
          );
        } catch {
          setSeoKeywords(seoKeywords || []);
        }
      }
    } catch (err) {
      console.error("final update failed:", err);
      const msg =
        err?.response?.data?.message || err.message || "Update failed";
      setSubmittedPayload((prev) => ({ ...prev, uploadError: msg }));
      setUploadProgress(null);
      alert("Update failed: " + msg);
    }
  };

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (mainImage?.url?.startsWith?.("blob:"))
        URL.revokeObjectURL(mainImage.url);
      additionalImages.forEach((a) => {
        if (a?.url?.startsWith?.("blob:")) URL.revokeObjectURL(a.url);
      });
      variantRows.forEach((v) => {
        if (v?.image?.url?.startsWith?.("blob:"))
          URL.revokeObjectURL(v.image.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- small helpers for UI ---------- */
  function colorLabelFor(value, colors = []) {
    if (value === null || value === undefined) return "";
    const v = String(value);
    const found = (colors || []).find((c) => String(c.id) === v);
    return found ? found.name ?? v : String(value);
  }

  if (!pid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Product — Wizard</h2>
              <div className="text-sm text-gray-500">Product ID: —</div>
            </div>
          </div>
          <div className="bg-white rounded p-6 shadow">
            No product id provided. Open via /product-edit/:id or pass productId
            prop.
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Render UI (keeps structure you had) ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6 p-2 bg-white border rounded-lg shadow-sm">
            {[
              { id: 0, label: "1. Basic" },
              { id: 1, label: "2. Media" },
              { id: 2, label: "3. Variations" },
              { id: 3, label: "4. SEO" },
              { id: 4, label: "5. Review" },
            ].map((s, idx) => {
              const active = idx === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`flex items-center gap-3 px-2 py-1 rounded-lg transition-all ${
                    active
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-medium transition-all ${
                      active
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {idx + 1}
                  </div>
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
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Edit Product — Wizard</h2>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => e.preventDefault()}>
                {loading ? (
                  <div>Loading product...</div>
                ) : step === 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Product Name *
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price
                        </label>
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Offer Price
                        </label>
                        <input
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Short Description
                      </label>
                      <textarea
                        rows={3}
                        value={plainDesc}
                        onChange={(e) => setPlainDesc(e.target.value)}
                        className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Long Description
                      </label>
                      <textarea
                        rows={4}
                        value={bigDesc}
                        onChange={(e) => setBigDesc(e.target.value)}
                        className="mt-1 w-full border rounded p-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
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
                        onClick={() => setStep((s) => Math.min(4, s + 1))}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : step === 1 ? (
                  /* Media step */ <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Main Image
                            </div>
                            <div className="text-xs text-gray-400">
                              Recommended 800×600
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">PNG/JPEG</div>
                        </div>

                        <div className="flex flex-col items-start gap-3">
                          <div className="w-full h-56 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
                            {mainImage ? (
                              <img
                                src={mainImage.url}
                                alt="main"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-gray-300">No main image</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleMainImage(e.target.files?.[0])
                                }
                              />
                              <span className="text-sm">Upload Main</span>
                            </label>

                            {mainImage && (
                              <button
                                type="button"
                                onClick={removeMainImage}
                                className="px-3 py-2 bg-red-50 text-red-600 border rounded"
                              >
                                Remove
                              </button>
                            )}
                            <div className="text-xs text-gray-400">
                              Or drag & drop (coming soon)
                            </div>
                          </div>

                          <div className="w-full mt-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Video URL (YouTube / Vimeo)
                            </label>
                            <div className="mt-2 flex gap-2">
                              <input
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="flex-1 border rounded-lg p-3"
                              />
                              <button
                                type="button"
                                onClick={() => setVideoUrl("")}
                                className="px-3 py-2 bg-white border rounded"
                              >
                                Clear
                              </button>
                            </div>
                            {videoUrl ? (
                              <div className="mt-3 border rounded overflow-hidden">
                                {videoUrl.includes("youtube") ||
                                videoUrl.includes("youtu.be") ? (
                                  <iframe
                                    title="video-preview"
                                    src={
                                      videoUrl.includes("embed")
                                        ? videoUrl
                                        : videoUrl.replace("watch?v=", "embed/")
                                    }
                                    className="w-full h-48"
                                    frameBorder="0"
                                    allowFullScreen
                                  />
                                ) : (
                                  <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-3 text-sm text-indigo-600"
                                  >
                                    Open video
                                  </a>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Gallery
                            </div>
                            <div className="text-xs text-gray-400">
                              Multiple images — first is shown as thumbnail
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Drag to reorder
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleAddImages(e.target.files)}
                            />
                            <span className="text-sm">Add Images</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {additionalImages.filter(
                            (img) => img.remotePath !== mainImage?.remotePath
                          ).length === 0 ? (
                            <div className="col-span-3 text-xs text-gray-400">
                              No gallery images
                            </div>
                          ) : (
                            additionalImages
                              .filter(
                                (img) =>
                                  img.remotePath !== mainImage?.remotePath
                              )
                              .map((a, i) => (
                                <div
                                  key={(a.remotePath ?? a.url ?? "") + "-" + i}
                                  className="relative w-28 h-28 border rounded-full overflow-hidden flex items-center justify-center"
                                >
                                  <img
                                    src={a.url}
                                    alt={`g-${i}`}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                  />

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
                          <button
                            type="button"
                            onClick={sendMediaStep}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                          >
                            Save Media
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.min(4, s - 1))}
                            className="px-4 py-2 bg-white border rounded"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.min(4, s + 1))}
                            className="px-4 py-2 bg-white border rounded"
                          >
                            Next
                          </button>
                        </div>

                        {uploadProgress !== null && (
                          <div className="mt-3 text-sm">
                            Upload progress: {uploadProgress}%{" "}
                            <div className="w-full bg-gray-100 rounded h-2 mt-1">
                              <div
                                style={{ width: `${uploadProgress}%` }}
                                className="h-2 rounded bg-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : step === 2 ? (
                  /* Variations step */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold">
                        Variations (multi-select dropdowns)
                      </h3>
                      <div className="text-xs text-gray-400">
                        Pick options in each group — combinations appear below.
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {variations.map((v) => (
                        <div
                          key={v.id}
                          className="p-4 border rounded-lg bg-white shadow-sm"
                        >
                          <MultiSelect
                            label={v.name}
                            options={
                              String(v.id).toLowerCase() === "color"
                                ? (color || []).map((c) => ({
                                    label:
                                      c.name ?? c.colorname ?? String(c.id),
                                    value: String(c.id),
                                    hex: c.hex ?? null,
                                  }))
                                : (v.options || []).map((o) =>
                                    typeof o === "object"
                                      ? {
                                          label: o.label ?? String(o.value),
                                          value: String(o.value ?? o.id ?? o),
                                          hex: o.hex ?? null,
                                        }
                                      : {
                                          label: String(o),
                                          value: String(o),
                                          hex: null,
                                        }
                                  )
                            }
                            selected={(selectedPerGroup[v.id] || []).map(
                              String
                            )}
                            onChange={(arr) =>
                              onChangeGroupSelected(
                                v.id,
                                (arr || []).map(String)
                              )
                            }
                            placeholder={`Select ${v.name}`}
                          />
                        </div>
                      ))}

                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold mb-3">
                          Generated Variants
                        </h4>
                        <div className="text-xs text-gray-500 mb-3">
                          Configure per-variant price, SKU, stock and image.
                        </div>

                        {tooManyVariants && (
                          <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-sm text-yellow-800">
                            Too many combinations to generate locally. Please
                            reduce selections (or update variants server-side).
                          </div>
                        )}

                        {/* <VariantsTable
                      key={variantRows.map(r => r.key).join("|")}
                      rows={variantRows}
                      color={color}
                      onChangeRow={updateVariantRow}
                      onUploadImageForRow={onUploadImageForRow}
                      onRemoveVariantImage={(key) => removeVariantImage(key)}
                    /> */}

                        <VariantsTable
                          rows={variantRows}
                          color={color}
                          onChangeRow={updateVariantRow}
                          onUploadImageForRow={onUploadImageForRow}
                          onRemoveVariantImage={(key) =>
                            removeVariantImage(key)
                          }
                        />

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="px-4 py-2 bg-gray-200 rounded"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={sendVariationsStep}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                          >
                            Save Variations
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.min(4, s + 1))}
                            className="px-4 py-2 bg-white border rounded"
                          >
                            Next
                          </button>
                        </div>

                        {uploadProgress !== null && (
                          <div className="mt-3 text-sm">
                            Upload progress: {uploadProgress}%{" "}
                            <div className="w-full bg-gray-100 rounded h-2 mt-1">
                              <div
                                style={{ width: `${uploadProgress}%` }}
                                className="h-2 rounded bg-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : step === 3 ? (
                  /* SEO step */
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">SEO Tags</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Meta title
                      </label>
                      <input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="mt-2 block w-full border rounded-lg p-3"
                        placeholder="Meta title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Meta description
                      </label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        rows={3}
                        className="mt-2 block w-full border rounded-lg p-3"
                        placeholder="Meta description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Meta Keywords
                      </label>
                      <div className="mt-2 border rounded p-2 flex flex-wrap gap-2">
                        {seoKeywords.map((tag, index) => (
                          <span
                            key={index}
                            className="flex items-center px-2 py-1 bg-gray-100 rounded text-sm gap-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                setSeoKeywords(
                                  seoKeywords.filter((_, i) => i !== index)
                                )
                              }
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
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val) setSeoKeywords([...seoKeywords, val]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => setStep((s) => Math.max(0, s - 1))}
                          className="px-4 py-2 bg-gray-200 rounded-lg mr-2"
                        >
                          Back
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={saveSEO}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                          Save SEO
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Review step (4) */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Review & Update
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Check everything below. Edit quick fields or expand
                          steps to change media / variants.
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3 bg-white border rounded-lg p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                  <svg
                                    className="w-10 h-10 mb-2"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden
                                  >
                                    <path
                                      d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M8 11l2 2 3-3 5 5"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <div className="text-sm">No main image</div>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                              <div>Main image</div>
                            </div>
                          </div>

                          <div
                            style={{
                              width: "500px",
                              margin: "0 auto",
                              boxSizing: "border-box",
                            }}
                          >
                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                              <div className="grid grid-cols-12 gap-6 items-start">
                                {/* IMAGE COLUMN (4/12) */}
                                {/* <div className="col-span-4">
                                  <div className="w-full bg-gray-50 rounded overflow-hidden">
                                    <img
                                      src={mainImage}
                                      alt="Main"
                                      className="w-full h-auto object-cover"
                                    />
                                  </div>
                                  <div className="text-xs text-gray-400 mt-2">
                                    Main image
                                  </div>
                                </div> */}

                                {/* DETAILS COLUMN (8/12) */}
                                <div className="col-span-8">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <input
                                        value={name}
                                        onChange={(e) =>
                                          setName(e.target.value)
                                        }
                                        className="w-full text-xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none border-b border-transparent pb-1"
                                        placeholder="Product name"
                                        aria-label="Product name"
                                      />
                                      <div className="mt-2 flex items-center gap-3 flex-wrap text-sm">
                                        <div className="text-sm text-gray-500">
                                          Category:
                                          <span className="ml-1 text-gray-800 font-medium">
                                            {categories.find(
                                              (c) =>
                                                String(c.id) ===
                                                String(category)
                                            )?.name ??
                                              category ??
                                              "—"}
                                          </span>
                                        </div>

                                        <div className="ml-2 inline-flex items-center gap-2">
                                          <div className="px-2 py-1 text-base font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                            {price ? `₹${price}` : "₹0"}
                                          </div>
                                          {offerPrice ? (
                                            <div className="px-2 py-0.5 text-xs rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                              Offer ₹{offerPrice}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right text-xs">
                                      <div className="text-xs text-gray-400">
                                        Last updated
                                      </div>
                                      <div className="text-sm text-gray-700" />
                                    </div>
                                  </div>

                                  <div className="my-3 border-t border-gray-100" />

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-500 mb-1 block">
                                          Short description
                                        </label>
                                        <div className="text-xs text-gray-400">
                                          Preview
                                        </div>
                                      </div>

                                      <textarea
                                        rows={4}
                                        value={plainDesc}
                                        onChange={(e) =>
                                          setPlainDesc(e.target.value)
                                        }
                                        className="resize-y w-full border rounded-lg p-2 bg-gray-50 focus:outline-none h-28 overflow-auto"
                                        placeholder="Detailed product description..."
                                        aria-label="Long description"
                                      />
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-500 mb-1 block">
                                          Long description
                                        </label>
                                        <div className="text-xs text-gray-400">
                                          Detailed
                                        </div>
                                      </div>

                                      <textarea
                                        rows={4}
                                        value={bigDesc}
                                        onChange={(e) =>
                                          setBigDesc(e.target.value)
                                        }
                                        className="resize-y w-full border rounded-lg p-2 bg-gray-50 focus:outline-none h-28 overflow-auto"
                                        placeholder="Detailed product description..."
                                        aria-label="Long description"
                                      />

                                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <div>
                                          {bigDesc
                                            ? `${bigDesc.length} characters`
                                            : "0 characters"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Gallery</div>
                            <div className="text-xs text-gray-400">
                              Manage images in Media step
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {additionalImages.length === 0 ? (
                              <div className="text-xs text-gray-400">
                                No gallery images
                              </div>
                            ) : (
                              additionalImages.map((a, i) => (
                                <div
                                  key={(a.remotePath ?? a.url ?? "") + "-" + i}
                                  className="relative w-28 h-28 border rounded-full overflow-hidden flex items-center justify-center"
                                >
                                  <img
                                    src={a.url}
                                    alt={`g-${i}`}
                                    className="w-full h-full object-cover rounded-full"
                                    loading="lazy"
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Variants</div>
                            <div className="text-xs text-gray-400">
                              Edit in Variations step
                            </div>
                          </div>

                          <div className="mt-2 space-y-2">
                            {variantRows.length === 0 ? (
                              <div className="text-xs text-gray-400">
                                No variants
                              </div>
                            ) : (
                              variantRows.map((r) => (
                                <div
                                  key={r.key}
                                  className="p-2 border rounded flex items-center justify-between"
                                >
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">
                                      {r.parts
                                        .map((p) =>
                                          String(p.groupId).toLowerCase() ===
                                          "color"
                                            ? colorLabelFor(p.value, color)
                                            : String(p.value)
                                        )
                                        .join(" — ")}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Extra: ₹{r.priceExtra || 0} — SKU:{" "}
                                      {r.sku || "—"} — Qty: {r.qty || "—"}
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
                                      <div className="text-xs text-gray-400">
                                        No photo
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="text-sm font-medium">SEO</div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              value={seoTitle}
                              readOnly
                              className="border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed w-full"
                              placeholder="Meta title"
                              aria-label="SEO title (read only)"
                            />
                            <input
                              value={seoDescription}
                              readOnly
                              className="border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed w-full"
                              placeholder="Meta description"
                              aria-label="SEO description (read only)"
                            />
                            <div className="md:col-span-2">
                              <label className="text-xs text-gray-500">
                                Keywords
                              </label>
                              <div className="mt-1 flex flex-wrap gap-2 bg-gray-50 p-2 rounded border min-h-[42px]">
                                {seoKeywords.length === 0 ? (
                                  <div className="text-xs text-gray-400">
                                    No keywords
                                  </div>
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
                )}
              </form>
            </div>
          </div>

          <aside className="bg-white shadow-md rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border flex items-center justify-center">
                {mainImage ? (
                  <img
                    src={mainImage.url}
                    alt="preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-300">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {name || "Untitled product"}
                </div>
                <div className="text-sm text-gray-500">{category || "—"}</div>
                <div className="mt-2 text-xl font-bold">
                  {price ? `₹${price}` : "—"}{" "}
                  {offerPrice ? (
                    <span className="text-sm text-gray-500">
                      (Offer: ₹{offerPrice})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              {plainDesc || "No short description"}
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Selected combinations</div>
              <div className="mt-2 text-sm text-gray-700">
                {variantRows.length === 0 ? (
                  <span className="text-gray-400 text-xs">No variants</span>
                ) : (
                  variantRows.map((r) => (
                    <div key={r.key} className="text-sm">
                      {r.parts
                        .map((p) =>
                          String(p.groupId).toLowerCase() === "color"
                            ? colorLabelFor(p.value, color)
                            : String(p.value)
                        )
                        .join(" — ")}{" "}
                      {" — "}{" "}
                      <span className="text-xs text-gray-500">
                        {r.qty || "no qty"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-3">
              <div className="text-xs text-gray-500">Payload preview</div>
              {submittedPayload ? (
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                  {JSON.stringify(submittedPayload, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-gray-400 mt-2">
                  Use step save buttons to update parts (media/variations) or
                  final Submit.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
