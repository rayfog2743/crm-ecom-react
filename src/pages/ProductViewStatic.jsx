// ProductView.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";

function Thumb({ src, alt, onClick }) {
  return (
    <button onClick={onClick} className="w-16 h-16 rounded overflow-hidden border p-0.5 focus:outline-none">
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </button>
  );
}

function BreadcrumbSeparator() {
  return (
    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [hero, setHero] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/products/product/${id}`);
        const data = res.data?.data ?? res.data;
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const urlFor = (path) => {
    if (!path) return null;
    if (String(path).startsWith("http")) return path;
    try {
      if (product?.image_url) {
        const origin = new URL(product.image_url).origin;
        return `${origin}/${String(path).replace(/^\/+/, "")}`;
      }
    } catch { /* ignore */ }
    return path;
  };

  // --- normalize colors into lookup map ---
  const colorLookup = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(product?.colors)) return map;

    (product.colors || []).forEach((c) => {
      const name = c.colorname ?? c.name ?? c.label ?? null;
      const hex = c.hex ?? c.hexcode ?? null;
      const possibleKeys = [c.color_id ?? null, c.id ?? null, c.value ?? null, c.label ?? null].filter(Boolean);

      possibleKeys.forEach((k) => map.set(String(k), { name: name ?? String(k), hex }));
      if (possibleKeys.length === 0 && (c.colorname || c.name)) {
        map.set(String(c.colorname ?? c.name), { name: c.colorname ?? c.name, hex });
      }
    });

    return map;
  }, [product?.colors]);

  const colorLabelFor = (val) => {
    if (val === null || val === undefined) return "";
    const entry = colorLookup.get(String(val));
    return entry ? entry.name : String(val);
  };

  const colorHexFor = (value) => {
    if (value === null || value === undefined) return null;
    const key = String(value);
    if (colorLookup.has(key)) return colorLookup.get(key).hex ?? null;
    return null;
  };

  // gallery urls
  const gallery = useMemo(() => {
    if (!product) return [];
    return (product.images || []).map((i) => i.image_url || urlFor(i.path) || null).filter(Boolean);
  }, [product]);

  // --- Normalize variations array from backend into consistent shape ---
  const normalizedVariations = useMemo(() => {
    if (!Array.isArray(product?.variations)) return [];
    return product.variations.map((v) => {
      const extra_price = v.extra_price ?? v.extraPrice ?? v.price_extra ?? v.priceExtra ?? 0;
      const qty = v.qty ?? v.quantity ?? v.stock ?? 0;
      const image_url = v.image_url ?? (v.image && typeof v.image === "string" ? v.image : (v.image?.url ?? null)) ?? null;
      const parts = (v.parts || []).map((p) => ({
        groupId: String(p.groupId ?? p.group_id ?? p.groupId),
        groupName: p.groupName ?? p.group_name ?? p.groupname ?? null,
        value: String(p.value ?? ""),
      }));
      return {
        ...v,
        parts,
        extra_price,
        qty,
        image_url,
        key: v.key ?? parts.map(pp => `${String(pp.groupId)}:${pp.value}`).join("|"),
        sku: v.sku ?? v.SKU ?? "",
        variationId: v.id ?? v.variationId ?? null,
        clientIndex: v.client_index ?? v.clientIndex ?? null,
      };
    });
  }, [product?.variations]);

  // --- build groups (options) from normalizedVariations, using colorLookup for color group ---
  const groups = useMemo(() => {
    if (!normalizedVariations || normalizedVariations.length === 0) return [];

    const map = new Map();
    normalizedVariations.forEach((v) => {

      console.log("v", v);
      (v.parts || []).forEach((p) => {
        const gid = String(p.groupId);
        const val = String(p.value);
        const groupNameFallback = p.groupName || gid;
        if (!map.has(gid)) map.set(gid, { groupId: gid, groupName: groupNameFallback, values: new Set() });
        const entry = map.get(gid);
        if ((!entry.groupName || entry.groupName === gid) && p.groupName && p.groupName !== gid) entry.groupName = p.groupName;
        entry.values.add(val);
      });
    });

    return Array.from(map.values()).map((g) => {
      const gid = g.groupId;
      const valuesArr = Array.from(g.values);
      const options = valuesArr.map((val) => {
        const key = String(val);
        if (String(gid).toLowerCase() === "color") {
          const colorEntry = colorLookup.get(key);
          return { value: key, label: colorEntry?.name ?? key, hex: colorEntry?.hex ?? null };
        }
        return { value: key, label: String(val), hex: null };
      });
      return {
        id: gid,
        name: String(g.groupName) || (gid === "color" ? "Color" : `Option ${gid}`),
        options,
      };
    });
  }, [normalizedVariations, colorLookup]);

  // --- normalized SEO fields ---
  const { seoTitle, seoDescription, seoKeywords } = useMemo(() => {
    if (!product) return { seoTitle: "", seoDescription: "", seoKeywords: [] };

    const rawTitle =
      product.seo_title ??
      product.meta_title ??
      (product.seo && (product.seo.title ?? product.seo_title)) ??
      "";

    const rawDesc =
      product.seo_description ??
      product.meta_description ??
      (product.seo && (product.seo.description ?? product.seo_description)) ??
      "";

    let rawKeywords = product.seo_keywords ?? product.keywords ?? (product.seo && product.seo.keywords) ?? [];
    if (typeof rawKeywords === "string") {
      try {
        const parsed = JSON.parse(rawKeywords);
        rawKeywords = Array.isArray(parsed) ? parsed : rawKeywords.split(",").map(s => s.trim()).filter(Boolean);
      } catch {
        rawKeywords = rawKeywords.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(rawKeywords)) rawKeywords = [];

    return { seoTitle: String(rawTitle || ""), seoDescription: String(rawDesc || ""), seoKeywords: rawKeywords };
  }, [product]);

  // set sensible default selected options when groups change
  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const defaults = {};
    groups.forEach((g) => { defaults[g.id] = g.options[0]?.value ?? null; });
    setSelected(defaults);
  }, [groups.length]);

  useEffect(() => {
    if (!product) return;
    const main = product.image_url || product.main_image || gallery[0] || null;
    setHero(urlFor(main));
  }, [product, gallery]);

  // find currentVariant using normalizedVariations and selected map
  const currentVariant = useMemo(() => {
    if (!normalizedVariations || normalizedVariations.length === 0) return null;
    return normalizedVariations.find((v) => {
      const map = new Map((v.parts || []).map((p) => [String(p.groupId), String(p.value)]));
      for (const [gid, val] of Object.entries(selected)) {
        if (val === null || val === undefined) continue;
        if (String(map.get(String(gid))) !== String(val)) return false;
      }
      return true;
    }) ?? null;
  }, [normalizedVariations, selected]);

  if (loading) return <div className="p-6 text-center">Loading product…</div>;
  if (!product) return <div className="p-6 text-center">No product loaded.</div>;

  const { name, price, discount_price, plain_desc, rich_desc, category = {}, variations = [] } = product;
  const heroSrc = currentVariant?.image_url ? urlFor(currentVariant.image_url) : hero;

  const onBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/products");
  };

  const partsToText = (parts = []) =>
    parts.map((p) => (String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value) : String(p.value))).join(" — ");

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* --- Breadcrumb / Back --- */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Back</span>
          </button>

          <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <div
              onClick={() => navigate("/products")}
              className="cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 hover:text-gray-800 transition"
            >
              Products
            </div>

            <span className="mx-2"><BreadcrumbSeparator /></span>

            <div className="max-w-xs">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V8.414A2 2 0 0016.414 7L12 2.586A2 2 0 0010.586 2H4z" />
                </svg>
                <span className="truncate" title={name}>{name}</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="text-xs text-gray-400">#{product.id}</div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT - product info */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{name}</h1>

          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold">₹{price}</div>
            {discount_price && <div className="text-sm text-gray-500">Offer: ₹{discount_price}</div>}
          </div>

          <div className="text-sm text-gray-500">Category: {category?.name ?? "—"}</div>

          <p className="text-sm text-gray-700 mt-2">{plain_desc}</p>

          <div className="pt-3 border-t">
            <div className="text-sm font-medium mb-2">Choose Options</div>

            <div className="flex flex-col gap-4">
              {groups.map((g) => (
                console.log(g),
                <div key={g.id}>
                  <div className="text-xs text-gray-600 mb-1">{g.name} fgfgfg</div>
                  <div className="flex gap-2 flex-wrap">
                    {g.options.map((opt) => {
                       console.log(opt)
                      const active = String(selected[g.id]) === String(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSelected((s) => ({ ...s, [g.id]: String(opt.value) }))}
                          className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-2 ${active ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200"}`}
                        >
                          {opt.hex && <span style={{ width: 14, height: 14, background: opt.hex, borderRadius: 6 }} />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-gray-50 p-3 rounded text-sm">
              {currentVariant ? (
                <>
                  <div className="font-medium">Selected</div>
                  <div className="text-xs mt-1">{partsToText(currentVariant.parts)}</div>
                  <div className="flex gap-4 text-xs text-gray-600 mt-2">
                    <div>Extra: <b>₹{currentVariant.extra_price ?? 0}</b></div>
                    <div>SKU: <b>{currentVariant.sku ?? "—"}</b></div>
                    <div>Stock: <b>{currentVariant.qty ?? 0}</b></div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">No variant for selected options</div>
              )}
            </div>
          </div>

          {/* --- SEO Preview section --- */}
          <div className="mt-4 bg-white border rounded p-3 text-sm">
            <div className="text-xs text-gray-500 mb-2">SEO Preview</div>
            <div className="font-medium text-sm line-clamp-1">
              {seoTitle || (name ? `${name} — Product` : "Untitled")}
            </div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {seoDescription || "No meta description set."}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {seoKeywords.length === 0 ? (
                <div className="text-xs text-gray-400">No keywords</div>
              ) : (
                seoKeywords.map((k, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {k}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT - images */}
        <div>
          <div className="w-full h-80 bg-gray-100 rounded overflow-hidden border">
            <img src={heroSrc || "/placeholder.png"} className="w-full h-full object-cover" alt={name} />
          </div>

          <div className="mt-3 flex gap-2">
            {gallery.map((g, i) => (
              <button key={i} onClick={() => setHero(g)} className="w-16 h-16 rounded overflow-hidden border p-0.5">
                <img src={g} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All variants table */}
      <div className="mt-6 bg-white border rounded p-3 text-sm">
        <div className="font-medium mb-3">All Variants</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Variant</th>
                <th className="p-2 text-left">Extra</th>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Image</th>
              </tr>
            </thead>
            <tbody>
              {normalizedVariations.length === 0 && (
                <tr><td colSpan={5} className="p-3 text-xs text-gray-400">No variants</td></tr>
              )}
              {normalizedVariations.map((v) => (
                <tr key={v.key} className="border-t">
                  <td className="p-2 align-top">{partsToText(v.parts)}</td>
                  <td className="p-2">₹{v.extra_price ?? 0}</td>
                  <td className="p-2">{v.sku || "—"}</td>
                  <td className="p-2">{v.qty ?? 0}</td>
                  <td className="p-2">
                    <img src={urlFor(v.image_url || v.image) || "/placeholder.png"} alt="" className="w-20 h-12 object-cover rounded border" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full description */}
      <div className="mt-6 p-3 bg-white border rounded text-sm">
        <div className="font-medium mb-2">Full description</div>
        <div className="text-gray-700 whitespace-pre-line">{rich_desc}</div>
      </div>
    </div>
  );
}
