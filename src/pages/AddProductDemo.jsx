import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";

/*
  AddProductPreview — Full component with real file uploads (FormData)
  - Sends: main_image, gallery[] (multiple), variations (JSON), variant_image_<idx> files
  - Backend must accept multipart/form-data and map variant_image_<idx> to variations[idx]
*/

const SAMPLE_CATEGORIES = [
  { id: 1, name: "Fruits" },
  { id: 2, name: "Vegetables" },
  { id: 3, name: "Dairy" },
];

const SAMPLE_VARIATIONS = [
  { id: 1, name: "Weight", options: ["250g", "500g", "750g", "1000g"] },
  { id: 2, name: "Size", options: ["36", "37", "38", "39", "40"] },
  { id: 3, name: "Style", options: ["Regular", "Slim"] },
];

const SAMPLE_COLORS = [
  {
    id: 1,
    name: "Red",
    hex: "#FF0000",
    image: "/mnt/data/e5ef9766-71d3-400b-ac61-2e346bc31dc7.png",
  },
  {
    id: 2,
    name: "Blue",
    hex: "#0000FF",
    image: "/mnt/data/e5ef9766-71d3-400b-ac61-2e346bc31dc7.png",
  },
  {
    id: 3,
    name: "Green",
    hex: "#00FF00",
    image: "/mnt/data/e5ef9766-71d3-400b-ac61-2e346bc31dc7.png",
  },
];

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

function MultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = "Select...",
}) {
  console.log("options", options);
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
          {/* {options.map((opt) => (
            <label key={String(opt.value ?? opt)} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.includes(opt.value ?? opt)} onChange={() => toggle(opt.value ?? opt)} />
              <div className="text-sm">{opt.label ?? opt}</div>
            </label>
          ))} */}

          {options.map((opt, idx) => {
            // Accept: primitive or { label, value, hex, ... }
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

function StepBadge({ i, active, label }) {
  return (
    <div
      className={`flex items-center gap-3 ${
        active ? "text-indigo-600" : "text-gray-400"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border ${
          active ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"
        }`}
      >
        {i}
      </div>
      <div className="text-sm hidden md:block">{label}</div>
    </div>
  );
}

export default function AddProductPreview() {
  const [step, setStep] = useState(0);

  // Basic
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [barcodemain, setBarcodemain] = useState("");
  const [lowstock, setLowstock] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [plainDesc, setPlainDesc] = useState("");
  const [bigDesc, setBigDesc] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // SEO (ensure defined)
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState([]);
  const [apivariations, setApivariations] = useState([]);
  const [color, setColor] = useState([]);

  const variations = React.useMemo(() => {
    // Normalize API groups to { id, name, options: [{ label, value, hex? }] }
    const fromApi = (apivariations || []).map((v) => {
      const rawOptions =
        Array.isArray(v.options) && v.options.length
          ? v.options
          : Array.isArray(v.attributes) && v.attributes.length
          ? v.attributes.map((a) => a.value ?? a.name ?? String(a))
          : [];

      const options = rawOptions.map((opt, idx) => {
        if (opt && typeof opt === "object") {
          return {
            label: opt.label ?? opt.name ?? String(opt.value ?? opt.id ?? idx),
            value: String(opt.value ?? opt.id ?? opt.name ?? idx),
          };
        }
        return { label: String(opt), value: String(opt) };
      });

      return {
        id: v.id ?? v.variation_id ?? String(v.name ?? idx),
        name: v.name ?? v.label ?? `Group ${v.id ?? idx}`,
        options,
      };
    });

    // Build color group from color state — value MUST be id (string)
    const colorGroup = {
      id: "color", // use a stable non-numeric id so groupId isn't null
      name: "Color",
      options: (color || []).map((c) => ({
        label: c.colorname ?? c.name ?? `Color ${c.id}`,
        value: String(c.id), // <-- IMPORTANT: primitive id-string
        hex: c.hexcode ?? null,
      })),
    };

    const hasColor = fromApi.some(
      (g) =>
        String(g.name).toLowerCase() === "color" ||
        String(g.name).toLowerCase() === "colour"
    );
    return hasColor ? fromApi : [...fromApi, colorGroup];
  }, [apivariations, color]);

  const [selectedPerGroup, setSelectedPerGroup] = useState({});
  const [variantRows, setVariantRows] = useState([]);

  // Media
  const [mainImage, setMainImage] = useState(null); // {file, url}
  const [additionalImages, setAdditionalImages] = useState([]); // [{file,url}]
  const [videoUrl, setVideoUrl] = useState("");

  // Preview/upload state
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fetchvariations = async () => {
    try {
      const res = await api.get("/admin/variation");
      const raw = res.data?.variations ?? [];
      // keep raw so memo can normalize
      setApivariations(raw);
    } catch (err) {
      console.error("failed to fetch variations", err);
      setApivariations([]);
    }
  };

  const fetchcolors = async () => {
    try {
      const res = await api.get("/admin/colors");
      console.log("fetched colors", res);
      const raw = res.data?.colors ?? [];

      // NORMALIZE color objects to consistent shape: { id: string, name: string, hex: string|null }
      const normalized = (raw || []).map((c) => {
        const id = String(c.id ?? c.color_id ?? c.value ?? c.label ?? "");
        const name = c.colorname ?? c.name ?? c.label ?? id;
        const hex = c.hex ?? c.hexcode ?? null;
        return { id, name, hex, __raw: c }; // keep raw optionally for debugging
      });

      setColor(normalized);
    } catch (err) {
      console.error("failed to fetch colors", err);
      setColor([]);
    }
  };

  const fetchallcategories = async () => {
    const category = await api.get("/admin/categories/show");
    console.log("categories", category.data.data);
    setCategories(category.data.data);
  };

  const fetchallbrands = async () => {
    const brands = await api.get("/admin/brands/show");
    console.log("brands", brands.data.data);
    setBrands(brands.data.data);
  };

  useEffect(() => {
    fetchallcategories();
    fetchallbrands();
    fetchvariations();
    fetchcolors();
  }, []);
  // Build variantRows whenever group selections change

  useEffect(() => {
    const groups = Object.keys(selectedPerGroup).filter(
      (k) => (selectedPerGroup[k] || []).length > 0
    );

    // Build a map of groupId -> groupName from `variations` (the normalized groups list)
    const groupNameMap = new Map();
    (variations || []).forEach((g) => groupNameMap.set(String(g.id), g.name));

    const arraysForProduct = groups.map((vid) => {
      const safeGroupId = (() => {
        const n = Number(vid);
        return Number.isFinite(n) ? n : String(vid);
      })();

      const groupName = groupNameMap.get(String(vid)) ?? String(vid);

      return (selectedPerGroup[vid] || []).map((opt) => ({
        groupId: safeGroupId,
        groupName, // <-- add group name here
        value: String(opt),
      }));
    });

    if (arraysForProduct.length === 0) {
      setVariantRows([]);
      return;
    }

    const raw = cartesianProduct(arraysForProduct);
    const newRows = raw.map((combo) => {
      const parts = combo.map((entry) => ({
        groupId: entry.groupId,
        groupName: entry.groupName,
        value: entry.value,
      }));
      const key = parts.map((p) => `${String(p.groupId)}:${p.value}`).join("|");

      return { key, parts, priceExtra: "0", sku: "", qty: "", image: null };
    });

    setVariantRows((prev) => {
      const mapPrev = new Map(prev.map((r) => [r.key, r]));
      return newRows.map((r) =>
        mapPrev.has(r.key) ? { ...mapPrev.get(r.key), ...r } : r
      );
    });
  }, [selectedPerGroup, variations]);

  const onChangeGroupSelected = (variationId, arr) =>
    setSelectedPerGroup((prev) => ({ ...prev, [variationId]: arr }));
  const updateVariantRow = (key, patch) =>
    setVariantRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  const handleVariantImage = (key, ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateVariantRow(key, { image: { file, url } });
  };

  const canNext = () => {
    if (step === 0) return name.trim() !== "" && price.toString().trim() !== "";
    return true;
  };
  const next = () => {
    if (!canNext()) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleMainImage = (file) => {
    if (!file) return;
    setMainImage({ file, url: URL.createObjectURL(file) });
  };
  const handleAddImages = (files) => {
    const mapped = Array.from(files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setAdditionalImages((prev) => [...prev, ...mapped]);
  };
  const removeAdditionalImage = (idx) =>
    setAdditionalImages((prev) => prev.filter((_, i) => i !== idx));
  const removeMainImage = () => setMainImage(null);

  // Full handleSubmit that uploads files + JSON

  // Helper: convert a blob/data URL (or any same-origin URL) to a File
  async function urlToFile(
    url,
    filename = `file_${Date.now()}.jpg`,
    mime = "image/jpeg"
  ) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mime });
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    try {
      // ---------- quick state debug ----------
      console.log("additionalImages BEFORE submit:", additionalImages);
      additionalImages.forEach((a, i) => console.log(i, a.file?.name, a.url));
      console.log("variantRows raw:", variantRows);
      console.log("mainImage state:", mainImage);

      // ---------- build variations payload ----------
      // const variationsPayload = variantRows.map((r, idx) => ({
      //   variationId: r.variationId ?? r.id ?? idx,
      //   key: r.key,
      //   parts: r.parts,
      //   extraPrice: r.priceExtra || "0",
      //   sku: r.sku || "",
      //   qty: r.qty || "",
      //   clientIndex: idx,
      //   hasImage: !!r.image?.file || !!r.image?.url,
      // }));

      // Build a map for group names in case some rows lost them
      const groupNameMapForSubmit = new Map();
      (variations || []).forEach((g) =>
        groupNameMapForSubmit.set(String(g.id), g.name)
      );

      // ensure payload has groupName alongside groupId/value
      const variationsPayload = variantRows.map((r, idx) => {
        const parts = (r.parts || []).map((p) => ({
          groupId: String(p.groupId ?? p.groupId),
          groupName:
            p.groupName ?? groupNameMapForSubmit.get(String(p.groupId)) ?? null,
          value: String(p.value ?? ""),
        }));

        return {
          variationId: r.variationId ?? r.id ?? idx,
          key: r.key,
          parts,
          extraPrice: r.priceExtra || "0",
          sku: r.sku || "",
          qty: r.qty || "",
          Lqty: r.Lqty || "",
          barcode: r.barcode || "",
          clientIndex: idx,
          hasImage: !!r.image?.file || !!r.image?.url,
        };
      });
      console.log("variationsPayload prepared:", variationsPayload);
      // preview payload for UI (optional)
      const previewPayload = {
        name,
        price,
        offerPrice,
        category,
        brand,
        barcodemain,
        lowstock,
        plainDesc,
        bigDesc,
        videoUrl,
        seo: {
          title: seoTitle,
          description: seoDescription,
          keywords: seoKeywords,
        },
        mainImageUrl: mainImage?.url || null,
        gallery: additionalImages.map((a) => a.url),
        variations: variationsPayload.map((v, i) => ({
          ...v,
          imageUrl: variantRows[i]?.image?.url ?? null,
        })),
      };
      setSubmittedPayload(previewPayload);

      // ---------- prepare FormData ----------
      const formData = new FormData();
      formData.append("name", name || "");
      formData.append("price", price || "");
      formData.append("discountPrice", offerPrice || "");
      formData.append("category", category || "");
      formData.append("brand", brand || "");
      formData.append("lowstock", lowstock || "");
      formData.append("barcodemain", barcodemain || "");
      formData.append("plainDesc", plainDesc || "");
      formData.append("richDesc", bigDesc || "");
      formData.append("videoUrl", videoUrl || "");
      formData.append(
        "seo",
        JSON.stringify({
          title: seoTitle,
          description: seoDescription,
          keywords: seoKeywords,
        })
      );

      // ---------- ensure main image File appended (convert blob -> File if necessary) ----------
      if (mainImage) {
        if (mainImage.file instanceof File) {
          formData.append("mainImage", mainImage.file, mainImage.file.name);
        } else if (
          typeof mainImage.url === "string" &&
          mainImage.url.startsWith("blob:")
        ) {
          // convert blob URL to File
          const ext = "jpg";
          const fname = `main_${Date.now()}.${ext}`;
          const file = await urlToFile(
            mainImage.url,
            fname,
            mainImage.file?.type || "image/jpeg"
          );
          formData.append("mainImage", file, file.name);
        }
      }

      // ---------- append gallery files (gallery[]) ----------
      for (let i = 0; i < additionalImages.length; i++) {
        const a = additionalImages[i];
        if (a?.file instanceof File) {
          formData.append("gallery[]", a.file, a.file.name);
        } else if (
          a?.url &&
          typeof a.url === "string" &&
          a.url.startsWith("blob:")
        ) {
          const fname = `gallery_${i}_${Date.now()}.jpg`;
          const file = await urlToFile(a.url, fname, "image/jpeg");
          formData.append("gallery[]", file, file.name);
        } else if (typeof a === "string") {
          // optional: if you store plain URLs in additionalImages, include them as additionalImages[] (backend supports URL strings)
          formData.append("additionalImages[]", a);
        }
      }

      // ---------- append variations JSON ----------
      formData.append("variations", JSON.stringify(variationsPayload));

      // ---------- append variant images variant_image_{idx} (convert blob if needed) ----------
      for (let idx = 0; idx < variantRows.length; idx++) {
        const r = variantRows[idx];
        if (!r?.image) continue;

        if (r.image.file instanceof File) {
          formData.append(
            `variant_image_${idx}`,
            r.image.file,
            r.image.file.name
          );
        } else if (
          typeof r.image.url === "string" &&
          r.image.url.startsWith("blob:")
        ) {
          const fname = `variant_${idx}_${Date.now()}.jpg`;
          const file = await urlToFile(r.image.url, fname, "image/jpeg");
          formData.append(`variant_image_${idx}`, file, file.name);
        } else if (typeof r.image === "string") {
          // optional: if you have a remote url string, you could append as part of variations JSON (already included as imageUrl)
          // do nothing here (server-side code handles imageUrl/base64 strings)
        }
      }

      const selectedColorIds = (selectedPerGroup?.["color"] || []).map(String);

      // Build colorsPayload using your fetched `color` array (state name `color`)
      const colorsPayload = selectedColorIds.map((cid) => {
        const found = (color || []).find(
          (c) =>
            String(c.id ?? c.color_id ?? c.value ?? "") === String(cid) ||
            String(c.colorname ?? c.name ?? c.label ?? "") === String(cid)
        );
        return {
          id: found?.id ?? cid,
          name: found?.colorname ?? found?.name ?? found?.label ?? String(cid),
          hex: found?.hex ?? found?.hexcode ?? null,
        };
      });

      // append JSON string (backend expects $inputs['colors'])
      formData.append("colors", JSON.stringify(colorsPayload));

      // ---------- debug FormData AFTER building it ----------
      console.log("variationsPayload (to send):", variationsPayload);
      console.log('formData.get("variations"):', formData.get("variations"));
      try {
        console.log(
          'formData.getAll("gallery[]"):',
          formData.getAll("gallery[]").map((f) => f.name)
        );
      } catch (err) {
        console.log(
          "formData.getAll gallery[] not supported in this environment"
        );
      }
      console.log("formData keys:");
      for (const k of formData.keys()) console.log(k);
      for (const pair of formData.entries()) {
        console.log(
          "formdata:",
          pair[0],
          pair[1] instanceof File ? pair[1].name : pair[1]
        );
      }

      setUploadProgress(0);

      // ---------- send request (do NOT set Content-Type header) ----------
      const token = localStorage.getItem("token"); // if you use auth
      const res = await api.post("/admin/products/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      console.log("upload response", res.data);
      setSubmittedPayload((prev) => ({ ...prev, uploadResponse: res.data }));
      alert("Product uploaded successfully.");
    } catch (err) {
      console.error("submit error:", err);
      const msg =
        err?.response?.data?.message || err.message || "Upload failed";
      setSubmittedPayload((prev) => ({ ...prev, uploadError: msg }));
      alert("Upload failed: " + msg);
    } finally {
      setUploadProgress(null);
    }
  };

  // returns label/name for a color id/value; falls back to raw value
  // helper to lookup color name by id from normalized color state
  function colorLabelFor(value, colors = []) {
    if (value === null || value === undefined) return "";
    const v = String(value);
    const found = (colors || []).find((c) => String(c.id) === v);
    return found ? found.name ?? v : String(value);
  }

  // ---------- UI rendering (same as your original, plus minor upload progress UI) ----------
  function renderMediaStep() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Main Image
                </div>
                <div className="text-xs text-gray-400">Recommended 800×600</div>
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
                    onChange={(e) => handleMainImage(e.target.files?.[0])}
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
                <div className="text-sm font-medium text-gray-700">Gallery</div>
                <div className="text-xs text-gray-400">
                  Multiple images — first is shown as thumbnail
                </div>
              </div>
              <div className="text-xs text-gray-500">Drag to reorder</div>
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
              {additionalImages.length === 0 ? (
                <div className="col-span-3 text-xs text-gray-400">
                  No gallery images
                </div>
              ) : (
                additionalImages.map((a, i) => (
                  <div
                    key={a.url + i}
                    className="relative border rounded overflow-hidden"
                  >
                    <img
                      src={a.url}
                      alt={`gallery-${i}`}
                      className="w-full h-24 object-cover"
                      draggable={false}
                    />
                    <button
                      onClick={() => removeAdditionalImage(i)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-600 border shadow-sm"
                    >
                      ×
                    </button>
                    <div className="absolute left-2 bottom-2 bg-black bg-opacity-30 text-white text-xs px-2 py-0.5 rounded">
                      {i === 0 ? "Primary" : `#${i + 1}`}
                    </div>
                  </div>
                ))
              )}
            </div>
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
            {/* Basic step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                  placeholder="e.g. Shimla Apple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                  placeholder="1000.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Brand
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                >
                  <option value="">Select Brand</option>
                  {brands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Offer Price (₹)
                </label>
                <input
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                  placeholder="Offer price (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bar Code
                </label>
                <input
                  value={barcodemain}
                  onChange={(e) => setBarcodemain(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                  placeholder="# Bar Code For Main Product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Low Stock
                </label>
                <input
                  value={lowstock}
                  onChange={(e) => setLowstock(e.target.value)}
                  className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                  placeholder="# Bar Code For Main Product"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mt-4">
                Plain Description
              </label>
              <textarea
                rows={3}
                value={plainDesc}
                onChange={(e) => setPlainDesc(e.target.value)}
                className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                placeholder="Short/plain description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mt-4">
                Big Description
              </label>
              <textarea
                rows={6}
                value={bigDesc}
                onChange={(e) => setBigDesc(e.target.value)}
                className="mt-2 block w-full border rounded-lg p-3 shadow-sm"
                placeholder="Enter detailed/full product description"
              />
            </div>
          </div>
        );

      case 1:
        return renderMediaStep();

      case 2:
        return (
          <div className="space-y-4">
            {/* Variations */}
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
                  {/* <MultiSelect label={v.name} options={v.options.map((o) => ({ label: o, value: o }))} selected={selectedPerGroup[v.id] || []} onChange={(arr) => onChangeGroupSelected(v.id, arr)} placeholder={`Select ${v.name}`} /> */}
                  {/* old: options={v.options.map((o) => ({ label: o, value: o }))} */}
                  {/* <MultiSelect
                    label={v.name}
                    options={v.options}                    // pass normalized options directly
                    selected={selectedPerGroup[v.id] || []}
                    onChange={(arr) => onChangeGroupSelected(v.id, arr)}
                    placeholder={`Select ${v.name}`}
                  /> */}

                  <MultiSelect
                    label={v.name}
                    options={
                      // if this group is "color" use the fetched/normalized `color` state
                      String(v.id).toLowerCase() === "color"
                        ? (color || []).map((c) => ({
                            label: c.name ?? c.colorname ?? String(c.id),
                            value: String(c.id), // IMPORTANT: use id as string
                            hex: c.hex ?? null,
                          }))
                        : // otherwise pass the group's options (already normalized earlier)
                          (v.options || []).map((o) =>
                            // ensure every option has { label, value, hex? } shape
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
                    // selectedPerGroup should hold strings; when user toggles we store strings
                    selected={(selectedPerGroup[v.id] || []).map(String)}
                    onChange={(arr) => {
                      // make sure stored values are strings (consistency)
                      onChangeGroupSelected(v.id, (arr || []).map(String));
                    }}
                    placeholder={`Select ${v.name}`}
                  />
                </div>
              ))}

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-3">Generated Variants</h4>
                <div className="text-xs text-gray-500 mb-3">
                  Configure per-variant price, SKU, stock and image. Inputs are
                  responsive to available space.
                </div>

                <div className="overflow-x-auto">
                  <table
                    className="min-w-full divide-y divide-gray-200 text-sm"
                    style={{ tableLayout: "auto" }}
                  >
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Extra Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Low Quantity
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bar Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Photo
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-100">
                      {variantRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-xs text-gray-400"
                          >
                            No combinations yet (select options)
                          </td>
                        </tr>
                      )}

                      {variantRows.map((r, idx) => (
                        <tr key={r.key} className="hover:bg-gray-50">
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded overflow-hidden border bg-gray-50 flex items-center justify-center flex-shrink-0">
                                {r.image ? (
                                  <img
                                    src={r.image.url}
                                    alt="v"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-xs text-gray-400">
                                    No photo
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* <div className="font-medium truncate">{r.parts.map((p) => p.value).join(' — ')}</div> */}

                                <div className="font-medium truncate">
                                  {r.parts
                                    .map((p) => {
                                      // show color name when groupId is color
                                      if (
                                        String(p.groupId).toLowerCase() ===
                                        "color"
                                      ) {
                                        return colorLabelFor(p.value, color);
                                      }
                                      return String(p.value);
                                    })
                                    .join(" — ")}
                                </div>

                                <div className="text-xs text-gray-400">
                                  Combination
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top w-36">
                            <input
                              type="number"
                              value={r.priceExtra}
                              onChange={(e) =>
                                updateVariantRow(r.key, {
                                  priceExtra: e.target.value,
                                })
                              }
                              className="px-2 py-2 border rounded w-full"
                              placeholder="Extra"
                            />
                          </td>

                          <td className="px-4 py-4 align-top w-40">
                            <input
                              type="text"
                              value={r.sku}
                              onChange={(e) =>
                                updateVariantRow(r.key, { sku: e.target.value })
                              }
                              className="px-2 py-2 border rounded w-full truncate"
                              placeholder="SKU"
                            />
                          </td>

                          <td className="px-4 py-4 align-top w-32">
                            <input
                              type="number"
                              value={r.qty}
                              onChange={(e) =>
                                updateVariantRow(r.key, { qty: e.target.value })
                              }
                              className="px-2 py-2 border rounded w-full"
                              placeholder="Qty"
                            />
                          </td>

                          <td className="px-4 py-4 align-top w-32">
                            <input
                              type="number"
                              value={r.Lqty}
                              onChange={(e) =>
                                updateVariantRow(r.key, {
                                  Lqty: e.target.value,
                                })
                              }
                              className="px-2 py-2 border rounded w-full"
                              placeholder="Low Qty"
                            />
                          </td>

                          <td className="px-4 py-4 align-top w-32">
                            <input
                              type="text"
                              value={r.barcode}
                              onChange={(e) =>
                                updateVariantRow(r.key, {
                                  barcode: e.target.value,
                                })
                              }
                              className="px-2 py-2 border rounded w-full"
                              placeholder="Low Qty"
                            />
                          </td>

                          <td className="px-4 py-4 align-top w-36">
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer px-2 py-1 bg-white border rounded text-xs">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleVariantImage(r.key, e)}
                                />
                                Upload
                              </label>
                              <div className="text-xs text-gray-500 truncate">
                                {r.image ? (
                                  <span className="text-green-600">
                                    Uploaded
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No file</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-md font-semibold">SEO Tags</h3>

            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="mt-2 block w-full border rounded-lg p-3"
              placeholder="Meta title"
            />

            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className="mt-2 block w-full border rounded-lg p-3"
              placeholder="Meta description"
            />

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
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Review & Submit</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review generated combinations below.
                </p>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold mb-3">Variants Preview</h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border text-left">Variant</th>
                      <th className="p-2 border text-right">Price</th>
                      <th className="p-2 border text-left">SKU</th>
                      <th className="p-2 border text-right">Qty</th>
                      <th className="p-2 border text-right">Low Qty</th>
                      <th className="p-2 border text-right">Bar Code</th>
                      <th className="p-2 border text-center">Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-3 text-xs text-gray-400">
                          No variants configured
                        </td>
                      </tr>
                    )}
                    {variantRows.map((r) => (
                      <tr key={r.key} className="align-top">
                        <td className="p-2 border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden border bg-gray-50 flex items-center justify-center">
                              <img
                                src={
                                  r.image?.url ||
                                  "/mnt/data/e5ef9766-71d3-400b-ac61-2e346bc31dc7.png"
                                }
                                alt="v"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              {/* <div className="font-medium">{r.parts.map((p) => p.value).join(' — ')}</div> */}
                              <div className="font-medium">
                                {
                                  // r.parts.map((p) => (String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value, color) : String(p.value))).join(' — ')
                                  r.parts
                                    .map((p) =>
                                      String(p.groupName).toLowerCase() ===
                                        "color" ||
                                      String(p.groupName).toLowerCase() ===
                                        "colour"
                                        ? colorLabelFor(p.value, color)
                                        : String(p.value)
                                    )
                                    .join(" — ")
                                }
                              </div>
                              <div className="text-xs text-gray-500">
                                Combination
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-2 border text-right">
                          ₹{Number(price || 0) + Number(r.priceExtra || 0)}
                        </td>

                        <td className="p-2 border">{r.sku || "—"}</td>

                        <td className="p-2 border text-right">
                          {r.qty || "—"}
                        </td>

                        <td className="p-2 border text-right">
                          {r.Lqty || "—"}
                        </td>

                        <td className="p-2 border text-right">
                          {r.barcode || "—"}
                        </td>

                        <td className="p-2 border text-center">
                          {r.image ? (
                            <img
                              src={r.image.url}
                              alt="v"
                              className="w-16 h-10 object-cover rounded border"
                            />
                          ) : (
                            <div className="text-xs text-gray-400">
                              No photo
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Submit product
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
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { id: 0, label: "1. Basic" },
              { id: 1, label: "2. Media" },
              { id: 2, label: "3. Variations" },
              { id: 3, label: "4. SEO" },
              { id: 4, label: "5. Review" },
            ].map((s, idx) => (
              <StepBadge
                key={s.id}
                i={idx + 1}
                active={idx === step}
                label={s.label}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">Step {step + 1} of 5</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-md rounded-2xl overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add Product — Wizard</h2>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => e.preventDefault()}>
                {renderStep()}

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={back}
                        className="px-4 py-2 bg-gray-200 rounded-lg mr-2"
                      >
                        Back
                      </button>
                    )}
                    {step < 4 && (
                      <button
                        type="button"
                        onClick={next}
                        disabled={!canNext()}
                        className={`px-4 py-2 rounded-lg ${
                          canNext()
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedPayload(null);
                        setName("");
                        setPrice("");
                        setOfferPrice("");
                        setPlainDesc("");
                        setSelectedPerGroup({});
                        setMainImage(null);
                        setAdditionalImages([]);
                        setVariantRows([]);
                        setCategory("");
                        setBigDesc("");
                        setVideoUrl("");
                        setSeoTitle("");
                        setSeoDescription("");
                        setSeoKeywords([]);
                        setStep(0);
                      }}
                      className="px-4 py-2 bg-gray-100 rounded-lg mr-2"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-4 py-2 bg-white border rounded-lg"
                    >
                      Go to Review
                    </button>
                  </div>
                </div>
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
                        .join(" — ")}
                      {" — "}
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
                  Submit the form to see produced payload here.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div
        id="notif"
        className="fixed right-6 bottom-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity"
      >
        Product prepared
      </div>
    </div>
  );
}
