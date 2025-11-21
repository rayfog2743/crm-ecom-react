import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2, Edit3, Eye, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import { IMAGES } from "../assets/images";
import Editor from "./Editor";
import { useVariantContext } from "../components/contexts/VariantContext";

import ImageWithFallback from "./ImageWithFallback";
import CategoryDrawer from "./CategoryDrawer";

const defaultForm = {
  name: "",
  grams: "",
  category: "",
  price: "",
  discount_amount: "",
  discount_price: "",
  sku: "",
  image: "",
  description: "",
  descriptionTxt: "",
  video_url: "",
};

export default function TestProducts() {
  const basePath = "/admin/products";
  const variantCtx = useVariantContext();
  const {
    loading: ctxLoading,
    fetchVariations,
    fetchAttributes,
    createVariation,
    updateVariation,
    deleteVariation,
    createAttribute,
    updateAttribute,
    createVariants,
    updateVariants,
    deleteAttribute,
  } = variantCtx || {};

  // products, categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // drawers & view
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // attributes raw and loading
  const [attributesRaw, setAttributesRaw] = useState(null);
  const [attrsLoading, setAttrsLoading] = useState(false);

  // form
  const [form, setForm] = useState({ ...defaultForm });
  const [imageFile, setImageFile] = useState(null); // main image
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // variants (readonly in drawer)
  const [formVariants, setFormVariants] = useState([]); // preserves server-provided variants

  // extra images
  const [existingExtraImages, setExistingExtraImages] = useState([]);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState([]);
  const [newExtraFiles, setNewExtraFiles] = useState([]);
  const [newExtraPreviews, setNewExtraPreviews] = useState([]);

  // shop attributes (local mirror of context attributes; toggles active/inactive)
  const [shopAttributes, setShopAttributes] = useState([]);

  // editor modal for description
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const descriptionTxtRef = useRef(null);
  const descInputRef = useRef(null);
  const firstInputRef = useRef(null);
  const drawerRef = useRef(null);
  const viewDrawerRef = useRef(null);
  const catFileRef = useRef(null);

  // category drawer
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", imagePreview: "" });
  const [catEditingId, setCatEditingId] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [catFile, setCatFile] = useState(null);

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

  /* -------------------- helpers & stable functions -------------------- */

  function makeLocalId() {
    return `local-attr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const safeTrim = (v) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
  };

  const resolveImage = (p) => {
    if (!p) return IMAGES.DummyImage;
    if (typeof p === "string") {
      const str = p.trim();
      return str ? str : IMAGES.DummyImage;
    }
    const raw = p.image_url ?? p.image ?? p.imageUrl ?? p.photo ?? p.thumbnail ?? "";
    const str = String(raw ?? "").trim();
    if (!str) return IMAGES.DummyImage;
    if (/^https?:\/\//i.test(str)) return str;
    try {
      const base = api?.defaults?.baseURL ?? window.location.origin;
      const baseClean = base.endsWith("/") ? base : base + "/";
      return new URL(str.replace(/^\/+/, ""), baseClean).toString();
    } catch {
      return IMAGES.Nutz;
    }
  };

  function normalizeProduct(raw) {
    if (!raw) return { id: `local-${Date.now()}`, name: "Untitled", price: "0" };
    const id = raw.id ?? raw._id ?? raw.product_id ?? raw.slug ?? `local-${Date.now()}`;
    let catRaw = raw.category ?? raw.cat ?? raw.category_id ?? null;
    if (catRaw === "" || catRaw === 0) catRaw = null;
    const category =
      catRaw && typeof catRaw === "object" ? { id: catRaw.id ?? catRaw._id, name: catRaw.name ?? catRaw.title ?? "" } : catRaw ?? null;
    let imagesArr = [];
    if (Array.isArray(raw.images)) imagesArr = raw.images;
    else if (Array.isArray(raw.extra_images)) imagesArr = raw.extra_images;
    const normalizedImages = imagesArr
      .map((it) => {
        if (!it) return null;
        if (typeof it === "string") return { url: String(it) };
        if (typeof it === "object") {
          const url = it.url ?? it.path ?? it.image ?? it.image_url ?? "";
          const idVal = it.id ?? it.image_id ?? it._id ?? undefined;
          return url ? { id: idVal, url: String(url) } : null;
        }
        return null;
      })
      .filter(Boolean);
    const variantsRaw = raw.variants ?? raw.options ?? raw.product_variants ?? undefined;
    let finalVariants = undefined;
    if (variantsRaw && typeof variantsRaw === "object") finalVariants = variantsRaw;
    return {
      id,
      name: String(raw.name ?? raw.title ?? "Untitled"),
      price: String(raw.price ?? raw.amount ?? raw.cost ?? "0"),
      grams: raw.grams ?? raw.gram ?? raw.weight ?? "",
      discount_amount: safeTrim(raw.discount_amount ?? raw.discountAmount) ?? "",
      discount_price: safeTrim(raw.discount_price ?? raw.discountPrice) ?? "",
      sku: safeTrim(raw.sku ?? raw.SKU ?? "") ?? "",
      image: raw.image ?? raw.image_url ?? undefined,
      image_url: raw.image_url ?? raw.image ?? undefined,
      images: normalizedImages.length ? normalizedImages : undefined,
      category,
      stock: raw.stock ?? raw.qty ?? null,
      slug: raw.slug ?? "",
      video_url: raw.video_url ?? raw.videoUrl ?? null,
      variants: finalVariants ?? raw.variants ?? raw.formVariants ?? undefined,
      product_type: raw.product_type ?? "",
      shop_attributes: raw.shop_attributes ?? raw.shopAttributes ?? raw.selected_shop_attributes ?? undefined,
      ...raw,
    };
  }

  // ---------- robust description extractor ----------
function findDescRecursive(obj, depth = 0) {
  if (!obj || depth > 4) return null;
  if (typeof obj === "string") return null;
  if (typeof obj !== "object") return null;

  const tokens = [
    "description",
    "description_html",
    "descriptionHtml",
    "description_text",
    "short_description",
    "long_description",
    "content",
    "body",
    "desc",
    "details"
  ];

  // first try exact or case-insensitive
  for (const t of tokens) {
    const key = Object.keys(obj).find(k => k === t || k.toLowerCase() === t.toLowerCase());
    if (key) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v;
      if (v && typeof v === "object") {
        const sub = v.value ?? v.rendered ?? v.html ?? v.content ?? v.text ?? null;
        if (typeof sub === "string" && sub.trim()) return sub;
      }
    }
  }

  // second pass: keys that contain token
  for (const k of Object.keys(obj)) {
    const low = String(k).toLowerCase();
    if (tokens.some(tok => low.includes(tok.replace(/_/g, "").toLowerCase()))) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v;
      if (v && typeof v === "object") {
        const sub = v.value ?? v.rendered ?? v.html ?? v.content ?? v.text ?? null;
        if (typeof sub === "string" && sub.trim()) return sub;
      }
    }
  }

  // recursive descent
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object") {
      const found = findDescRecursive(v, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

  const closeCatDrawer = () => {
    setIsCatDrawerOpen(false);
    setCatEditingId(null);
    setCatForm({ name: "", imagePreview: "" });
    setCatFile(null);
    if (catFileRef.current) {
      try {
        catFileRef.current.value = "";
      } catch {}
    }
  };

  /* -------------------- API wrappers (POST/GET/DELETE) -------------------- */

  const createProductApi = async (payload, file, extraFiles, selectedShopAttrs = []) => {
    const fd = new FormData();
    if (payload.name !== undefined) fd.append("name", String(payload.name));
    if (payload.price !== undefined) fd.append("price", String(payload.price));
    if (payload.discount_price !== undefined) fd.append("discount_price", String(payload.discount_price));
    if (payload.discount_amount !== undefined) fd.append("discount_amount", String(payload.discount_amount));
    if (payload.grams !== undefined) fd.append("grams", String(payload.grams));
    if (payload.category !== undefined && payload.category !== null) fd.append("category", String(payload.category));
    if (payload.description !== undefined) fd.append("description", String(payload.description));
    if (payload.descriptionTxt !== undefined && String(payload.descriptionTxt).trim() !== "") {
      fd.append("descriptionTxt", String(payload.descriptionTxt));
    }
    if (payload.video_url !== undefined && String(payload.video_url).trim() !== "") fd.append("video_url", String(payload.video_url));
    if (payload.sku !== undefined && String(payload.sku).trim() !== "") fd.append("sku", String(payload.sku));
    if (Array.isArray(selectedShopAttrs) && selectedShopAttrs.length) {
      fd.append("shop_attributes", JSON.stringify(selectedShopAttrs));
    }
    if (file) fd.append("image", file);
    if (Array.isArray(extraFiles)) extraFiles.forEach((f) => fd.append("images[]", f));
    // console.debug to inspect FormData in devtools (won't print contents directly)
    // console.debug("createProductApi fd keys:", Array.from(fd.keys()));
    const res = await api.post(`${basePath}/add`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data ?? res;
  };

  const updateProductApi = async (id, payload, file, extraFiles, removeImageIds, selectedShopAttrs = []) => {
    const fd = new FormData();
    if (payload.name !== undefined) fd.append("name", String(payload.name));
    if (payload.price !== undefined) fd.append("price", String(payload.price));
    if (payload.discount_price !== undefined) fd.append("discount_price", String(payload.discount_price));
    if (payload.discount_amount !== undefined) fd.append("discount_amount", String(payload.discount_amount));
    if (payload.grams !== undefined) fd.append("grams", String(payload.grams));
    if (payload.category !== undefined && payload.category !== null) fd.append("category", String(payload.category));
    if (payload.description !== undefined) fd.append("description", String(payload.description));
    if (payload.descriptionTxt !== undefined && String(payload.descriptionTxt).trim() !== "") {
      fd.append("descriptionTxt", String(payload.descriptionTxt));
    }
    if (payload.video_url !== undefined && String(payload.video_url).trim() !== "") fd.append("video_url", String(payload.video_url));
    if (payload.sku !== undefined && String(payload.sku).trim() !== "") fd.append("sku", String(payload.sku));
    if (Array.isArray(selectedShopAttrs) && selectedShopAttrs.length) {
      fd.append("shop_attributes", JSON.stringify(selectedShopAttrs));
    }
    if (file) fd.append("image", file);
    if (Array.isArray(extraFiles)) extraFiles.forEach((f) => fd.append("images[]", f));
    // if (Array.isArray(removeImageIds) && removeImageIds.length) fd.append("remove_image_ids", removeImageIds.join(","));
   if (Array.isArray(removeImageIds) && removeImageIds.length) {
  removeImageIds.forEach(id => fd.append("remove_image_ids[]", String(id)));
}
    const res = await api.post(`${basePath}/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data ?? res;
  };

  const deleteProductApi = async (id) => {
    const res = await api.delete(`${basePath}/delete/${id}`);
    return res.data ?? res;
  };

  /* -------------------- fetch categories & products -------------------- */

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await api.get("/admin/categories/show");
      const body = res.data ?? res;
      let rows = [];
      if (Array.isArray(body)) rows = body;
      else if (Array.isArray(body.data)) rows = body.data;
      else {
        const arr = Object.values(body || {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) rows = arr;
      }
      const normalizedCats = rows
        .map((r) => {
          const id = String(r.id ?? r._id ?? r.category_id ?? "").trim();
          const name = String(r.name ?? r.title ?? r.label ?? "");
          const image_url = r.image_url ?? r.image ?? null;
          return id ? { id, name, image_url } : null;
        })
        .filter(Boolean);
      const dedup = {};
      normalizedCats.forEach((c) => (dedup[c.id] = c));
      setCategories(Object.values(dedup));
    } catch (err) {
      console.error("fetchCategories failed:", err, err?.response?.data);
      toast.error("Failed to load categories (dropdown may be incomplete)");
    } finally {
      setCatLoading(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`${basePath}/show`);
      const body = res.data ?? res;
      if (!body || typeof body !== "object") throw new Error("Unexpected response from server");
      let rows = [];
      const payload = body.data ?? body;
      if (Array.isArray(payload)) rows = payload;
      else if (Array.isArray(payload.data)) rows = payload.data;
      else {
        const arr = Object.values(payload || {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) rows = arr;
      }
      const normalized = rows.map((r) => normalizeProduct(r));
      setProducts(normalized);
    } catch (err) {
      console.error("fetchProducts failed:", err, err?.response?.data);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to load products";
      toast.error(message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- fetch attributes (from VariantContext) -------------------- */

  const fetchAttributesRaw = async (opts = {}) => {
    setAttrsLoading(true);
    try {
      const list = await fetchAttributes?.(opts);
      const arr = Array.isArray(list) ? list : (list && list.data && Array.isArray(list.data) ? list.data : []);
      setAttributesRaw(arr);
    } catch (err) {
      console.error("fetchAttributes error", err);
      toast.error("Failed to load attributes");
      setAttributesRaw([]);
    } finally {
      setAttrsLoading(false);
    }
  };

  /* -------------------- lifecycle: initial fetches -------------------- */
  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof fetchAttributes === "function") {
      void fetchAttributesRaw();
    } else {
      const maybeAttrs = variantCtx?.attributes ?? variantCtx?.attributesRaw ?? variantCtx?.shopAttributes ?? [];
      if (Array.isArray(maybeAttrs) && maybeAttrs.length) {
        setAttributesRaw(maybeAttrs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- sync shopAttributes local state from attributesRaw / variantCtx -------------------- */
  useEffect(() => {
    const src =
      Array.isArray(attributesRaw) && attributesRaw.length
        ? attributesRaw
        : Array.isArray(variantCtx?.attributes)
        ? variantCtx.attributes
        : Array.isArray(variantCtx?.attributesRaw)
        ? variantCtx.attributesRaw
        : Array.isArray(variantCtx?.shopAttributes)
        ? variantCtx.shopAttributes
        : Array.isArray(variantCtx?.shopsettings)
        ? variantCtx.shopsettings
        : [];
    const normalized = Array.isArray(src) && src.length
      ? src.map((a) => {
          const id = a.id ?? a.ID ?? a.attribute_id ?? a.attributeId ?? a.key ?? a.name ?? null;
          const name = a.attribute_name ?? a.name ?? a.label ?? a.value ?? "";
          return { id: id ?? makeLocalId(), name: String(name), raw: a, active: false };
        })
      : [];
    setShopAttributes(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributesRaw, variantCtx]);

  /* -------------------- UI handlers & helpers -------------------- */

  // open add drawer
  const openAddDrawer = () => {
    setForm({ ...defaultForm });
    setFormVariants([]); // reset variants
    setImageFile(null);
    setNewExtraFiles([]);
    setNewExtraPreviews([]);
    setExistingExtraImages([]);
    setRemovedExistingImageIds([]);
    setErrors({});
    setIsEditMode(false);
    setEditingId(null);
    setShopAttributes((prev) => prev.map((a) => ({ ...a, active: false })));
    setIsDrawerOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const openEditDrawer = async (p) => {
  try {
    setIsEditMode(true);
    setEditingId(p.id ?? p._id ?? p.product_id ?? p);

    // fetch full product from API (robustly handle various shapes)
    const res = await api.get(`${basePath}/show/${p.id ?? p._id ?? p.product_id ?? p}`);
    const body = res.data ?? res;

    let prodRaw = null;
    if (!body) prodRaw = null;
    else if (Array.isArray(body)) prodRaw = body[0] ?? null;
    else if (Array.isArray(body.data)) prodRaw = body.data.length === 1 ? body.data[0] : body.data;
    else if (body.data && typeof body.data === "object") prodRaw = body.data;
    else if (body.product && typeof body.product === "object") prodRaw = body.product;
    else prodRaw = body;

    console.debug("openEditDrawer: fetched product raw:", prodRaw);

    // sometimes API returns array of objects; try to pick correct one
    if (Array.isArray(prodRaw)) {
      const idToFind = String(p.id ?? p._id ?? p.product_id ?? "");
      const found = prodRaw.find((x) => String(x.id ?? x._id ?? x.product_id ?? "") === idToFind);
      prodRaw = found ?? prodRaw[0] ?? null;
    }

    if (!prodRaw) {
      console.warn("openEditDrawer: no server data, falling back to passed object");
      prodRaw = p;
    }

    const prod = normalizeProduct(prodRaw);

    // ---------- helper: pick raw content from common shapes (string | { text, plain, rendered, html, value } ) ----------
    function pickRawContent(obj) {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      if (typeof obj === "object") {
        if (typeof obj.text === "string" && obj.text.trim()) return obj.text;
        if (typeof obj.plain === "string" && obj.plain.trim()) return obj.plain;
        if (typeof obj.rendered === "string" && obj.rendered.trim()) return obj.rendered;
        if (typeof obj.html === "string" && obj.html.trim()) return obj.html;
        if (typeof obj.value === "string" && obj.value.trim()) return obj.value;
        // nested fallback keys
        for (const k of ["content", "description", "body"]) {
          if (obj[k]) {
            if (typeof obj[k] === "string" && obj[k].trim()) return obj[k];
            if (typeof obj[k] === "object") {
              const nested = obj[k].rendered ?? obj[k].html ?? obj[k].text ?? obj[k].value ?? "";
              if (typeof nested === "string" && nested.trim()) return nested;
            }
          }
        }
      }
      return "";
    }

    // ---------- explicit mapping:
    // description (rich HTML) should come from prodRaw.description / prod.description (prefer),
    // otherwise fall back to content if necessary.
    const richFromServer =
      (prodRaw && typeof prodRaw.description === "string" && prodRaw.description.trim() ? prodRaw.description : "") ||
      (prod && typeof prod.description === "string" && prod.description.trim() ? prod.description : "");

    // descriptionTxt (plain/raw) should come from prodRaw.content / prod.content (exact raw, do not strip HTML)
    const contentRawFromServer =
      (prodRaw && (typeof prodRaw.content === "string" ? prodRaw.content : pickRawContent(prodRaw.content))) ||
      (prod && (typeof prod.content === "string" ? prod.content : pickRawContent(prod.content))) ||
      "";

    const finalRich = String(richFromServer || contentRawFromServer || "");
    const finalPlain = String(contentRawFromServer || richFromServer || "");

    console.debug("openEditDrawer: finalRich length:", finalRich.length, "finalPlain length:", finalPlain.length);

    // set form values — description (rich) and descriptionTxt (raw content)
    setForm({
      name: safeTrim(prod.name) ?? "",
      grams: safeTrim(prod.grams) ?? "",
      category:
        prod.category && typeof prod.category === "object"
          ? String(prod.category.id ?? prod.category._id ?? prod.category.name ?? "")
          : String(prod.category ?? ""),
      price: safeTrim(prod.price) ?? "",
      discount_amount: safeTrim(prod.discount_amount) ?? "",
      discount_price: safeTrim(prod.discount_price) ?? "",
      sku: safeTrim(prod.sku) ?? "",
      image: prod.image_url ?? prod.image ?? "",
      // rich HTML for editor:
      description: finalRich,
      // plain/raw content exactly as returned by DB:
      descriptionTxt: finalPlain,
      video_url: safeTrim(prod.video_url) ?? "",
    });

    // build extra images list (robust)
    const extrasRaw = prodRaw.images ?? prodRaw.extra_images ?? prod.images ?? prodRaw.images_list ?? [];
    const extras = Array.isArray(extrasRaw)
      ? extrasRaw
          .map((it) => {
            if (!it) return null;
            if (typeof it === "string") return { url: String(it) };
            if (typeof it === "object") {
              const url = it.image_url ?? it.image ?? it.path ?? it.url ?? it.src ?? "";
              const idVal = it.id ?? it.image_id ?? it._id ?? undefined;
              return url ? { id: idVal, url: String(url) } : null;
            }
            return null;
          })
          .filter(Boolean)
      : [];

    setExistingExtraImages(extras);
    setRemovedExistingImageIds([]);
    setNewExtraFiles([]);
    setNewExtraPreviews([]);
    setIsDrawerOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 120);
  } catch (err) {
    console.error("openEditDrawer error:", err, err?.response?.data);
    toast.error("Failed to load product, opening fallback");

    // fallback: populate from passed object p (keep raw content if available)
    function fallbackPickRawContent(obj) {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      try {
        if (typeof obj.content === "string") return obj.content;
        if (obj.content && typeof obj.content === "object") {
          return obj.content.rendered ?? obj.content.html ?? obj.content.text ?? obj.content.value ?? "";
        }
      } catch {}
      return obj.descriptionTxt ?? obj.description ?? "";
    }

    setForm({
      name: safeTrim(p.name) ?? "",
      grams: safeTrim(p.grams) ?? "",
      category:
        p.category && typeof p.category === "object" ? String(p.category.id ?? p.category.name ?? "") : String(p.category ?? ""),
      price: safeTrim(p.price) ?? "",
      discount_amount: safeTrim(p.discount_amount) ?? "",
      discount_price: safeTrim(p.discount_price) ?? "",
      sku: safeTrim(p.sku) ?? "",
      image: p.image_url ?? p.image ?? "",
      // prefer description column if present, otherwise fallback to raw content
      description: p.description ?? fallbackPickRawContent(p) ?? "",
      // keep raw content in descriptionTxt (no stripping)
      descriptionTxt: p.content ?? p.descriptionTxt ?? (typeof p.description === "string" ? p.description : fallbackPickRawContent(p)) ?? "",
      video_url: safeTrim(p.video_url ?? "") ?? "",
    });

    setExistingExtraImages([]);
    setRemovedExistingImageIds([]);
    setNewExtraFiles([]);
    setNewExtraPreviews([]);
    setIsDrawerOpen(true);
  }
};

/* ---------------- replace / remove helpers for extra images ---------------- */

/**
 * Replace an existing extra image at `index` with a newly picked file.
 * - marks original id for removal (if present)
 * - appends the new file to newExtraFiles/newExtraPreviews
 * - writes _replaced and _newFileIndex on the existing slot so removal keeps queue consistent
 */
const triggerReplaceExistingExtra = (index) => {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  inp.style.display = "none";
  document.body.appendChild(inp);

  inp.addEventListener("change", (ev) => {
    const f = ev.target.files?.[0] ?? null;
    if (!f) {
      try { document.body.removeChild(inp); } catch {}
      return;
    }
    if (!f.type?.startsWith?.("image/")) {
      toast.error("Selected file is not an image.");
      try { document.body.removeChild(inp); } catch {}
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 2MB).");
      try { document.body.removeChild(inp); } catch {}
      return;
    }

    // mark old image id for removal (if any)
    setExistingExtraImages((prev) => {
      const old = prev[index];
      if (old && old.id != null) {
        setRemovedExistingImageIds((rprev) => (rprev.includes(old.id) ? rprev : [...rprev, old.id]));
      }
      return prev;
    });

    // add file to newExtraFiles and newExtraPreviews, capture its index
    setNewExtraFiles((nf) => {
      const newIndex = nf.length; // will be index after push
      const next = [...nf, f];

      const reader = new FileReader();
      reader.onload = () => {
        const preview = String(reader.result ?? "");
        setNewExtraPreviews((np) => [...np, preview]);

        // update the existing slot to point to this new preview and record mapping
        setExistingExtraImages((cur) => {
          const copy = [...cur];
          copy[index] = {
            id: undefined,
            url: preview,
            _replaced: true,
            _newFileIndex: newIndex,
          };
          return copy;
        });
      };
      reader.readAsDataURL(f);

      return next;
    });

    try { document.body.removeChild(inp); } catch {}
  });

  inp.click();
};

/**
 * Remove an existing extra image slot (server image OR replaced slot).
 * - if the slot was originally a server image, its id is added to removedExistingImageIds
 * - if the slot was a replaced slot (points to new file index), the queued new file & preview are removed and other mappings are shifted
 * - asks user confirmation before removal
 */
const removeExistingExtraByIndex = (index) => {
  const toRemove = existingExtraImages[index];
  if (!toRemove) return;

  if (!window.confirm("Remove this additional image? This will be removed when saving.")) return;

  // If this slot references a queued new file (from replace), must remove that queued file too
  const newFileIndex = toRemove._newFileIndex;
  if (typeof newFileIndex === "number") {
    // Remove queued file & preview
    setNewExtraFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    setNewExtraPreviews((prev) => prev.filter((_, i) => i !== newFileIndex));

    // Remove the slot itself and also shift any other _newFileIndex values > newFileIndex
    setExistingExtraImages((cur) =>
      cur
        .map((slot) => {
          if (!slot) return slot;
          // remove the slot that referenced this newFileIndex
          if (slot._newFileIndex === newFileIndex) return null;
          // shift indices greater than removed index
          if (typeof slot._newFileIndex === "number" && slot._newFileIndex > newFileIndex) {
            return { ...slot, _newFileIndex: slot._newFileIndex - 1 };
          }
          return slot;
        })
        .filter(Boolean)
    );

    // Also, if original server id existed, ensure it's marked for removal
    if (toRemove.id != null) {
      setRemovedExistingImageIds((prev) => (prev.includes(toRemove.id) ? prev : [...prev, toRemove.id]));
    }
    return;
  }

  // Normal server image slot (not replaced) — mark id for removal if exists, then remove slot
  if (toRemove.id != null) {
    setRemovedExistingImageIds((prev) => (prev.includes(toRemove.id) ? prev : [...prev, toRemove.id]));
  }
  setExistingExtraImages((prev) => prev.filter((_, i) => i !== index));
};

/**
 * Remove a newly-selected extra image (from newExtraPreviews/newExtraFiles).
 * - confirms with user
 * - removes file & preview
 * - shifts any _newFileIndex mappings on existingExtraImages accordingly
 */
const removeNewExtraAt = (index) => {
  if (!window.confirm("Remove this new image?")) return;

  setNewExtraFiles((prev) => prev.filter((_, i) => i !== index));
  setNewExtraPreviews((prev) => prev.filter((_, i) => i !== index));

  // shift or remove any existing slots that referenced new-file indices
  setExistingExtraImages((cur) =>
    cur
      .map((slot) => {
        if (!slot) return slot;
        if (typeof slot._newFileIndex !== "number") return slot;
        if (slot._newFileIndex === index) {
          // this slot was replaced by the same new file — remove the slot
          return null;
        }
        if (slot._newFileIndex > index) {
          return { ...slot, _newFileIndex: slot._newFileIndex - 1 };
        }
        return slot;
      })
      .filter(Boolean)
  );
};

  const openView = (p) => {
    setSelectedProduct(p);
    setIsViewOpen(true);
    setTimeout(() => viewDrawerRef.current?.focus(), 120);
  };

  const resetForm = () => {
    setForm({ ...defaultForm });
    setFormVariants([]);
    setImageFile(null);
    setErrors({});
    setIsEditMode(false);
    setEditingId(null);
    setExistingExtraImages([]);
    setRemovedExistingImageIds([]);
    setNewExtraFiles([]);
    setNewExtraPreviews([]);
    setShopAttributes((prev) => prev.map((a) => ({ ...a, active: false })));
  };

  const validateForm = () => {
    const e = {};
    if (!String(form.name ?? "").trim()) e.name = "Name is required";
    if (!String(form.price ?? "").trim()) e.price = "Price is required";
    if (!String(form.category ?? "").trim()) e.category = "Category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = (ev) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 2MB)");
      try {
        ev.currentTarget.value = "";
      } catch {}
      return;
    }
    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: undefined }));
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleAdditionalImagesChange = (ev) => {
    const files = Array.from(ev.target.files ?? []);
    if (!files.length) return;
    const accepted = [];
    for (const f of files) {
      if (!f.type || !f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image. Skipping.`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is too large (max 2MB). Skipping.`);
        continue;
      }
      accepted.push(f);
    }
    if (!accepted.length) {
      try {
        ev.currentTarget.value = "";
      } catch {}
      return;
    }
    const mergedFiles = [...newExtraFiles, ...accepted].slice(0, 10);
    const readers = accepted.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result ?? ""));
          r.readAsDataURL(f);
        })
    );
    Promise.all(readers)
      .then((resArr) => {
        const mergedPreviews = [...newExtraPreviews, ...resArr].slice(0, 10);
        setNewExtraFiles(mergedFiles);
        setNewExtraPreviews(mergedPreviews);
      })
      .catch(() => {
        setNewExtraFiles(mergedFiles);
      });
    try {
      ev.currentTarget.value = "";
    } catch {}
  };

  /* -------------------- submit (create/update) -------------------- */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrors((prev) => ({ ...prev, image: undefined }));

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    const nameTrimmed = safeTrim(form.name) ?? "";
    const priceTrimmed = safeTrim(form.price) ?? "";
    const discount_price_trimmed = safeTrim(form.discount_price);
    const discount_amount_trimmed = safeTrim(form.discount_amount);
    const grams_trimmed = safeTrim(form.grams);
    const descriptionTrimmed = safeTrim(form.description) ?? "";
    const descriptionTxtVal = safeTrim(form.descriptionTxt) ?? "";
    const videoUrlTrimmed = safeTrim(form.video_url) ?? "";
    const skuTrimmed = safeTrim(form.sku) ?? "";

    let categoryToSend;
    if (form.category !== "" && form.category != null) {
      const trimmed = String(form.category).trim();
      const asNum = Number(trimmed);
      categoryToSend = !Number.isNaN(asNum) && /^\d+$/.test(trimmed) ? asNum : trimmed;
    }

    const selectedShopAttrs = shopAttributes.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }));

    const payload = {
      name: nameTrimmed,
      price: priceTrimmed,
      discount_price: discount_price_trimmed,
      discount_amount: discount_amount_trimmed,
      grams: grams_trimmed,
      category: categoryToSend,
      ...(descriptionTxtVal ? { descriptionTxt: descriptionTxtVal } : {}),
      ...(descriptionTrimmed ? { description: descriptionTrimmed } : {}),
      ...(videoUrlTrimmed ? { video_url: videoUrlTrimmed } : {}),
      ...(skuTrimmed ? { sku: skuTrimmed } : {}),
    };

    setIsSubmitting(true);
    setErrors({});

    if (isEditMode && editingId != null) {
      const prev = products;
      const updatedLocal = normalizeProduct({ ...payload, id: editingId, formVariants });
      setProducts((cur) => cur.map((p) => (String(p.id) === String(editingId) ? { ...p, ...updatedLocal } : p)));
      try {
        const res = await updateProductApi(editingId, payload, imageFile, newExtraFiles, removedExistingImageIds, selectedShopAttrs);
        const body = res.data ?? res;
        if (body && body.status === false) {
          const msg = body.message ?? "Update failed";
          toast.error(String(msg));
          setProducts(prev);
          setIsSubmitting(false);
          return;
        }
        const updatedRaw = body?.data ?? body?.product ?? body;
        const updated = normalizeProduct(updatedRaw);
        if (!updated.variants && formVariants.length) updated.variants = formVariants;
        setProducts((cur) => {
          const without = cur.filter((x) => String(x.id) !== String(updated.id));
          return [updated, ...without];
        });
        await fetchCategories();
        toast.success("Product updated");
        setIsDrawerOpen(false);
        resetForm();
      } catch (err) {
        console.error("handleSubmit (update) error:", err, err?.response?.data);
        setProducts(prev);
        const rdata = err?.response?.data;
        if (rdata && typeof rdata === "object") {
          if (rdata.errors && typeof rdata.errors === "object") {
            const mapped = {};
            Object.keys(rdata.errors).forEach((k) => {
              const val = rdata.errors[k];
              mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
            });
            setErrors((p) => ({ ...p, ...mapped }));
            toast.error("Fix validation errors");
          } else {
            toast.error(rdata.message ?? rdata.error ?? err?.message ?? "Update failed");
          }
        } else {
          toast.error(err?.message ?? "Update failed");
        }
      } finally {
        setIsSubmitting(false);
        setImageFile(null);
        setNewExtraFiles([]);
        setNewExtraPreviews([]);
        setRemovedExistingImageIds([]);
      }
    } else {
      const tempId = `local-${Date.now()}`;
      const tempProd = normalizeProduct({
        id: tempId,
        ...payload,
        image: form.image ?? undefined,
        images: newExtraPreviews,
        video_url: payload.video_url ?? undefined,
        sku: payload.sku ?? undefined,
        formVariants,
        shop_attributes: selectedShopAttrs,
      });
      setProducts((prev) => [tempProd, ...prev]);
      try {
        const res = await createProductApi(payload, imageFile, newExtraFiles, selectedShopAttrs);
        const body = res.data ?? res;
        if (body && body.status === false) {
          const msg = body.message ?? "Add failed";
          toast.error(String(msg));
          setProducts((cur) => cur.filter((p) => String(p.id) !== String(tempId)));
          setIsSubmitting(false);
          return;
        }
        const createdRaw = body?.data ?? body?.product ?? body;
        const created = normalizeProduct(createdRaw);
        if (!created.variants && formVariants.length) created.variants = formVariants;
        if (!created.shop_attributes && selectedShopAttrs.length) created.shop_attributes = selectedShopAttrs;
        setProducts((cur) => {
          const withoutTemp = cur.filter((p) => String(p.id) !== String(tempId));
          return [created, ...withoutTemp];
        });
        await fetchCategories();
        toast.success("Product added");
        setIsDrawerOpen(false);
        resetForm();
        setFormVariants([]);
      } catch (err) {
        console.error("handleSubmit (create) error:", err, err?.response?.data);
        setProducts((cur) => cur.filter((p) => String(p.id) !== String(tempId)));
        const rdata = err?.response?.data;
        if (rdata && typeof rdata === "object") {
          if (rdata.errors && typeof rdata.errors === "object") {
            const mapped = {};
            Object.keys(rdata.errors).forEach((k) => {
              const val = rdata.errors[k];
              mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
            });
            setErrors((p) => ({ ...p, ...mapped }));
            toast.error("Fix validation errors");
          } else {
            toast.error(rdata.message ?? err?.message ?? "Add failed");
          }
        } else {
          toast.error(err?.message ?? "Add failed");
        }
      } finally {
        setIsSubmitting(false);
        setImageFile(null);
        setNewExtraFiles([]);
        setNewExtraPreviews([]);
      }
    }
  };

  const askDelete = (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    confirmDelete(id);
  };

  const confirmDelete = async (id) => {
    if (id == null) return;
    const prev = products;
    setProducts((cur) => cur.filter((p) => String(p.id) !== String(id)));
    try {
      const res = await deleteProductApi(id);
      const body = res.data ?? res;
      if (body && body.status === false) {
        toast.error(body.message ?? "Delete failed");
        setProducts(prev);
      } else {
        toast.success("Product deleted");
        setSelectedProduct((s) => (s && String(s.id) === String(id) ? null : s));
      }
    } catch (err) {
      console.error("Delete error:", err, err?.response?.data);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to delete product";
      toast.error(message);
      setProducts(prev);
    }
  };

  const handleRefresh = async () => {
    await fetchProducts();
    await fetchCategories();
    toast.success("Refreshed");
  };

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        if (isDrawerOpen) setIsDrawerOpen(false);
        if (isViewOpen) setIsViewOpen(false);
        if (isCatDrawerOpen) setIsCatDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, isViewOpen, isCatDrawerOpen]);

  // Category handlers
  const openCatDrawer = () => {
    setCatForm({ name: "", imagePreview: "" });
    setCatEditingId(null);
    setCatFile(null);
    if (catFileRef.current) catFileRef.current.value = "";
    setIsCatDrawerOpen(true);
  };

  const openCatEdit = (c) => {
    setCatEditingId(c.id);
    setCatForm({ name: c.name ?? "", imagePreview: c.image_url ?? "" });
    setCatFile(null);
    if (catFileRef.current) catFileRef.current.value = "";
    setIsCatDrawerOpen(true);
  };

  const handleCatImageChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setCatFile(null);
      setCatForm((s) => ({ ...s, imagePreview: "" }));
      return;
    }
    if (!f.type || !f.type.startsWith("image/")) {
      toast.error("Selected file is not an image. Please choose a valid image file.");
      if (catFileRef.current) catFileRef.current.value = "";
      setCatFile(null);
      setCatForm((s) => ({ ...s, imagePreview: "" }));
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 2MB). Please select a smaller file.");
      if (catFileRef.current) catFileRef.current.value = "";
      setCatFile(null);
      setCatForm((s) => ({ ...s, imagePreview: "" }));
      return;
    }
    setCatFile(f);
    const r = new FileReader();
    r.onload = () => setCatForm((s) => ({ ...s, imagePreview: String(r.result ?? "") }));
    r.readAsDataURL(f);
  };

  const submitCategory = async (ev) => {
    ev?.preventDefault();
    const name = String(catForm.name ?? "").trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    setCatSubmitting(true);
    try {
      if (catEditingId) {
        const fd = new FormData();
        fd.append("name", name);
        if (catFile) fd.append("image", catFile);
        const res = await api.post(`/admin/categories/update/${catEditingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        const body = res.data ?? res;
        if (body && body.status === false) throw new Error(String(body.message ?? "Update failed"));
        toast.success("Category updated");
      } else {
        const fd = new FormData();
        fd.append("name", name);
        if (catFile) fd.append("image", catFile);
        const res = await api.post("/admin/categories/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
        const body = res.data ?? res;
        if (body && body.status === false) throw new Error(String(body.message ?? "Create failed"));
        toast.success("Category created");
      }
      await fetchCategories();
      setCatForm({ name: "", imagePreview: "" });
      setCatEditingId(null);
      setCatFile(null);
      if (catFileRef.current) catFileRef.current.value = "";
    } catch (err) {
      console.error("category CRUD error:", err, err?.response?.data);
      const msg = err?.response?.data?.message ?? err?.message ?? "Category save failed";
      toast.error(String(msg));
    } finally {
      setCatSubmitting(false);
    }
  };

  /* -------------------- client-side search + pagination UI wiring -------------------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProducts = products.filter((p) => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return true;
    return String(p.name || "").toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const toggleShopAttr = (id) => {
    setShopAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  /* -------------------- render -------------------- */
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 w-full">
          <div></div>
          <div className="flex items-center gap-2 w-full sm:w-auto p-2">
            <Button variant="ghost" onClick={() => void handleRefresh()} aria-label="Refresh products" className="ml-2">
              <RefreshCw className="h-4 w-4" />
            </Button>

            <div className="ml-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="px-3 py-2 border rounded-md w-52 focus:outline-none"
                aria-label="Search products"
              />
            </div>

            <Button onClick={() => openCatDrawer()} className="ml-2 ">
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
            <Button onClick={() => openAddDrawer()} className="ml-2">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        <Card className="shadow-sm w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] md:min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium w-12">S.no</th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-20">Image</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Category (id)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Grams</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center">
                      Loading products…
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p, i) => (
                    <tr key={String(p.id)}>
                      <td className="px-4 py-3 text-sm align-middle">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border">
                          <ImageWithFallback src={p} alt={p.name ?? "product"} className="w-12 h-12" />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="text-sm font-medium truncate max-w-[220px] sm:max-w-none">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{p.slug ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 align-middle hidden sm:table-cell">
                        {p.category && typeof p.category === "object" ? p.category.name ?? "-" : p.category ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm align-middle hidden md:table-cell">{p.grams ?? "-"}</td>
                      <td className="px-4 py-3 text-sm align-middle">₹ {p.price}</td>
                      <td className="px-4 py-3 text-sm align-middle hidden lg:table-cell">{p.discount_price ? `₹ ${p.discount_price}` : "-"}</td>
                      <td className="px-4 py-3 text-sm align-middle hidden lg:table-cell">{p.stock ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditDrawer(p)} title="Edit" className="inline-flex items-center justify-center p-2 rounded border hover:bg-slate-50">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => askDelete(p.id)} title="Delete" className="inline-flex items-center justify-center p-2 rounded border hover:bg-slate-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => openView(p)} title="View" className="inline-flex items-center justify-center p-2 rounded border hover:bg-slate-50 md:hidden">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination UI */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Showing <strong>{filteredProducts.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> -{" "}
            <strong>{Math.min(filteredProducts.length, page * pageSize)}</strong> of <strong>{filteredProducts.length}</strong>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border rounded-md"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>

            <div className="inline-flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded-md" disabled={page === 1}>
                Prev
              </button>

              <div className="inline-flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const total = totalPages;
                  const maxButtons = 7;
                  let start = Math.max(1, page - Math.floor(maxButtons / 2));
                  let end = start + maxButtons - 1;
                  if (end > total) {
                    end = total;
                    start = Math.max(1, end - maxButtons + 1);
                  }
                  for (let p = start; p <= end; p++) {
                    pages.push(
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded-md border ${p === page ? "bg-indigo-600 text-white" : "bg-white"}`}
                      >
                        {p}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded-md" disabled={page === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Drawer: Add / Edit */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsDrawerOpen(false); resetForm(); }} aria-hidden="true" />

            <aside ref={drawerRef} className="fixed top-0 right-0 h-screen bg-white shadow-2xl overflow-auto rounded-l-2xl transform transition-transform duration-300 ease-in-out w-[50%]">
              <div className="flex items-start justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold">{isEditMode ? "Edit Product" : "Add Product"}</h3>
                </div>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    resetForm();
                  }}
                  aria-label="Close drawer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                  <div className="flex flex-wrap gap-4">
                    <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input ref={firstInputRef} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`block w-full border rounded-md p-2 focus:outline-none ${errors.name ? "border-red-400" : "border-slate-200"}`} placeholder="e.g. Shimla Apple" />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={`block w-full border rounded-md p-2 ${errors.price ? "border-red-400" : "border-slate-200"}`} placeholder="1000.00" />
                      {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                    </div>

                    <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={`block w-full border rounded-md p-2 ${errors.category ? "border-red-400" : "border-slate-200"}`}>
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
                      <input value={form.discount_price} onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))} className="block w-full border rounded-md p-2" placeholder="800.00" />
                    </div>
                     <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">Grams</label>
                      <input
                        value={form.grams}
                        onChange={(e) => setForm((f) => ({ ...f, grams: e.target.value }))}
                        className="block w-full border rounded-md p-2"
                        placeholder="e.g. 500"
                      />
                    </div>   
                  <div className="w-full">
                  <label className="block text-sm font-medium mb-1">
                    Description (plain) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={descriptionTxtRef}
                    value={form.descriptionTxt}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionTxt: e.target.value }))}
                    placeholder="Enter short/plain description"
                    rows={4}
                    className={`block w-full border rounded-md p-2 focus:outline-none resize-none ${errors.descriptionTxt ? "border-red-400" : "border-slate-200"}`}
                  />
                  {errors.descriptionTxt && <p className="text-xs text-red-500">{errors.descriptionTxt}</p>}
                </div>

                {/* Rich HTML content (read-only, opens Editor) */}
                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">
                    Content (rich HTML) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    key={isEditMode ? `desc-${String(editingId ?? "")}` : "desc-new"}
                    ref={descInputRef}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    onFocus={() => setIsEditorOpen(true)}
                    placeholder="Click to edit description (rich text)"
                    readOnly
                    rows={6}
                    className={`block w-full border rounded-md p-2 focus:outline-none resize-none ${errors.description ? "border-red-400" : "border-slate-200"}`}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                    <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">Video URL</label>
                      <input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} className="block w-full border rounded-md p-2" placeholder="https://www.youtube.com/watch?v=" />
                    </div>

                    <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">Upload Image</label>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm" />
                      {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                    </div>

                    {/* main image preview + variants (readonly) */}
                    <div className="w-full mt-2">
                      {(form.image || imageFile) && (
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "8px" }}>
                          <div className="w-full lg:w-1/2 flex flex-col">
                            <div className="mt-1 flex-1">
                              
                            </div>
                          </div>

                          <div className="w-24 h-24 rounded-md overflow-hidden border">
                            <img
                              src={String(form.image)}
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

                      <div className="w-[30%] min-w-[220px]">
                      <label className="block text-sm font-medium mb-1">Additional images</label>
                      <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} className="block w-full text-sm" />
                    </div>
                      {/* Additional images preview — paste this where your grid currently is */}
                    <div className="w-full flex flex-col lg:flex-row items-stretch gap-6 mt-4">
                      <div className="w-full lg:w-1/2 flex flex-col">
                        <div className="border rounded-md p-3 bg-gray-50 flex-1">
                          <div>
                            <div className="text-xs text-slate-600 mb-1">Additional images Preview</div>

                            <div className="grid grid-cols-3 gap-2">
                              {/* Existing images from server (or replaced slots) */}
                                          {existingExtraImages.map((img, idx) => (
                      <div
                        key={String(img.id ?? img.url ?? idx)}
                        className="relative w-full h-20 rounded-md overflow-hidden border bg-white"
                        style={{ position: "relative" }}
                      >
                        <img
                          src={String(img.url)}
                          alt={`extra-${idx}`}
                          className="w-full h-full object-cover"
                        />

                        {/* DELETE BUTTON FIXED */}
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "22px",
                            height: "22px",
                            background: "rgba(0,0,0,0.6)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 9999,
                          }}
                          onClick={() => removeExistingExtraByIndex(idx)}
                        >
                          <X className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}

                              {/* Newly added images in this session */}
                              {newExtraPreviews.map((p, idx) => (
                                <div key={`new-${idx}`} className="relative w-full h-20 rounded-md overflow-hidden border bg-white">
                                  <img src={String(p)} alt={`new-extra-${idx}`} className="w-full h-full object-cover" />
                                  <div className="absolute top-1 right-1 z-30 flex flex-col items-end gap-1 pointer-events-auto">
                                    <button
                                      type="button"
                                      onClick={() => removeNewExtraAt(idx)}
                                      className="p-1 rounded-full bg-red-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-red-300"
                                      aria-label={`Remove newly added image ${idx + 1}`}
                                      title="Remove"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* empty state */}
                              {existingExtraImages.length === 0 && newExtraPreviews.length === 0 && (
                                <div className="col-span-3 text-xs text-slate-400">No additional images</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => { resetForm(); setIsDrawerOpen(false); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : isEditMode ? "Save" : "Add Product"}
                    </Button>
                  </div>
                </form>
              </div>
            </aside>
          </div>
        )}

        <CategoryDrawer
          isOpen={isCatDrawerOpen}
          close={closeCatDrawer}
          catForm={catForm}
          setCatForm={setCatForm}
          catFileRef={catFileRef}
          handleCatImageChange={handleCatImageChange}
          submitCategory={submitCategory}
          catSubmitting={catSubmitting}
          catEditingId={catEditingId}
          setCatEditingId={setCatEditingId}
          catFile={catFile}
          setCatFile={setCatFile}
          catLoading={catLoading}
          categories={categories}
          openCatEdit={openCatEdit}
          fetchCategories={fetchCategories}
        />

        {/* Product View Drawer */}
        {isViewOpen && selectedProduct && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewOpen(false)} />
            <aside ref={viewDrawerRef} tabIndex={-1} className="fixed top-0 right-0 h-screen bg-white shadow-2xl overflow-auto rounded-l-2xl md:w-96 w-full p-6">
              <div className="flex items-start justify-between border-b pb-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Product details</h3>
                </div>
                <button onClick={() => setIsViewOpen(false)} className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <img src={resolveImage(selectedProduct)} alt={selectedProduct?.name ?? "product"} className="w-full h-44 object-cover rounded-md mb-4" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGES.DummyImage; }} />
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-slate-500">Name</div>
                    <div className="mt-1 rounded-md border p-2 bg-gray-50">{selectedProduct.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Price</div>
                    <div className="mt-1 rounded-md border p-2 bg-gray-50">₹ {selectedProduct.price}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Grams</div>
                    <div className="mt-1 rounded-md border p-2 bg-gray-50">{selectedProduct.grams ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Category</div>
                    <div className="mt-1 rounded-md border p-2 bg-gray-50">
                      {selectedProduct.category && typeof selectedProduct.category === "object" ? (selectedProduct.category.name ?? selectedProduct.category.id) : (selectedProduct.category ?? "-")}
                    </div>
                  </div>

                  {selectedProduct.variants && Array.isArray(selectedProduct.variants) && (
                    <div>
                      <div className="text-sm font-medium text-slate-500">Variants</div>
                      <div className="mt-2 space-y-2">
                        {selectedProduct.variants.map((v, idx) => (
                          <div key={v.id ?? idx} className="rounded-md border p-2 bg-white">
                            <div className="text-sm text-slate-700">
                              {v.label && `${v.label} — ₹ ${v.price ?? "-"}`}
                              {v.color && `${v.color} ${v.size ? `(${v.size})` : ""} — ₹ ${v.price ?? "-"}`}
                              {v.grams && `${v.grams} — ₹ ${v.price ?? "-"} ${v.purity ? `(${v.purity})` : ""}`}
                              {!v.label && !v.color && !v.grams && JSON.stringify(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.shop_attributes && Array.isArray(selectedProduct.shop_attributes) && (
                    <div>
                      <div className="text-sm font-medium text-slate-500">Shop attributes</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedProduct.shop_attributes.map((sa, i) => (
                          <div key={String(sa.id ?? i)} className="text-xs px-2 py-1 rounded bg-slate-50 border text-slate-700">
                            {sa.name ?? sa.attribute_name ?? String(sa)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.video_url && (
                    <div>
                      <div className="text-sm font-medium text-slate-500">Video URL</div>
                      <div className="mt-1 rounded-md border p-2 bg-gray-50 break-all">
                        <a href={selectedProduct.video_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                          {selectedProduct.video_url}
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-slate-500">Description</div>
                    <div className="mt-1 rounded-md border p-2 bg-gray-50" dangerouslySetInnerHTML={{ __html: selectedProduct.description ?? "<em>No description</em>" }} />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <Button variant="ghost" onClick={() => setIsViewOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}

        <Editor open={isEditorOpen} initialHtml={form.description || ""} onClose={() => setIsEditorOpen(false)} onSave={(html) => setForm((f) => ({ ...f, description: html }))} />
      </div>
    </>
  );
}
