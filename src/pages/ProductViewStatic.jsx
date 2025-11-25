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

        console.log("Loaded product", res.data);
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

  // Build a color lookup: id/string -> { name, hex }
  // const colorLookup = useMemo(() => {
  //   const map = new Map();
  //   if (!product?.colors) return map;
  //   product.colors.forEach((c) => {
  //     // support either color_id or id as key depending on your backend
  //     const key = String(c.color_id ?? c.id ?? c.value ?? c.value);
  //     const name = c.colorname ?? c.name ?? c.label ?? key;
  //     const hex = c.hex ?? c.hexcode ?? null;
  //     map.set(key, { name, hex });
  //   });
  //   return map;
  // }, [product?.colors]);

// maps color id (string) -> { name, hex }
// maps color id (string) -> { name, hex }
// supports shapes: { id, colorname, hex }, { id, name, hex }, { label, value, hex }
// maps color id (string) -> { name, hex }
const colorLookup = useMemo(() => {
  const map = new Map();
  if (!Array.isArray(product?.colors)) return map;
 console.log("Processing color entry", product);
  // Normalize every color into the map under several possible keys.
  product.colors.forEach((c) => {

    console.log("Processing color entry", c);
    const name = c.colorname ?? c.name ?? c.label ?? null;
    const hex = c.hex ?? c.hexcode ?? null;

    // possible key fields in backend
    const possibleKeys = [
      c.color_id ?? null,
      c.id ?? null,
      c.value ?? null,
      c.label ?? null
    ].filter(Boolean);

    // ensure we also add the string form of the id
    possibleKeys.forEach((k) => {
      map.set(String(k), { name: name ?? String(k), hex });
    });

    // also add a fallback using the index-derived string if nothing else available
    if (possibleKeys.length === 0 && (c.colorname || c.name)) {
      map.set(String(c.colorname ?? c.name), { name: c.colorname ?? c.name, hex });
    }
  });

  // DEBUG: show the map in dev console (remove in production)
  // console.log('colorLookup keys:', Array.from(map.keys()), map);
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

  const gallery = useMemo(() => {
    if (!product) return [];
    return (product.images || []).map((i) => i.image_url || urlFor(i.path) || null).filter(Boolean);
  }, [product]);

const groups = useMemo(() => {
  if (!product?.variations) return [];
  const map = new Map();

  product.variations.forEach((v) => {
    (v.parts || []).forEach((p) => {
      const gid = String(p.groupId);
      const val = String(p.value);
      if (!map.has(gid)) map.set(gid, new Set());
      map.get(gid).add(val);
    });
  });

  return Array.from(map.entries()).map(([gid, set]) => {
    const options = Array.from(set).map((val) => {
      const key = String(val);
      console.log("Processing group option", gid, key, val);
      if (String(gid).toLowerCase() === "color") {
        const colorEntry = colorLookup.get(key); // <- use a local name, not `entry`
        console.log("Color entry for", key, "is", colorEntry);
        return {
          value: key,
          label: colorEntry?.name ?? key,
          hex: colorEntry?.hex ?? null,
        };
      }
      return { value: key, label: String(val), hex: null };
    });

    return {
      id: gid,
      name: gid === "color" ? "Color" : `Option ${gid}`,
      options,
    };
  });
}, [product, colorLookup]);

  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const defaults = {};
    groups.forEach((g) => { defaults[g.id] = g.options[0] ?? null; });
    setSelected(defaults);
  }, [groups.length]);

  useEffect(() => {
    if (!product) return;
    const main = product.image_url || product.main_image || gallery[0] || null;
    setHero(urlFor(main));
  }, [product, gallery]);

  const currentVariant = useMemo(() => {
    if (!product?.variations) return null;
    return product.variations.find((v) => {
      const map = new Map((v.parts || []).map((p) => [String(p.groupId), String(p.value)]));
      for (const [gid, val] of Object.entries(selected)) {
        if (val === null || val === undefined) continue;
        if (String(map.get(String(gid))) !== String(val)) return false;
      }
      return true;
    }) ?? null;
  }, [product?.variations, selected]);

  if (loading) return <div className="p-6 text-center">Loading product…</div>;
  if (!product) return <div className="p-6 text-center">No product loaded.</div>;

  const { name, price, discount_price, plain_desc, rich_desc, category, variations = [] } = product;
  const heroSrc = currentVariant?.image_url ? urlFor(currentVariant.image_url) : hero;

  // Back behavior: prefer history, fallback to product list
  const onBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/products");
  };

  // render a parts array to a readable string (uses colorLabelFor for color group)
  // const partsToText = (parts = []) =>
  //   parts
  //     .map((p) => (String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value) : String(p.value)))
  //     .join(" — ");
const partsToText = (parts = []) =>
  parts.map((p) => (String(p.groupId).toLowerCase() === "color" ? colorLabelFor(p.value) : String(p.value))).join(" — ");

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* --- BEAUTIFUL, COMPACT BREADCRUMB (Back / Products / ProductName) --- */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Back button */}
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

          {/* Breadcrumb trail */}
          <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <div
              onClick={() => navigate("/products")}
              className="cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 hover:text-gray-800 transition"
            >
              Products
            </div>

            <span className="mx-2">
              <BreadcrumbSeparator />
            </span>

            {/* Product name pill (truncate if long) */}
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

        {/* small utility (optional): product id or small actions — kept compact */}
        <div className="text-xs text-gray-400">#{product.id}</div>
    
      </div>

      {/* --- MAIN GRID (content left, images right) --- */}
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
              console.log("Rendering group", g.id),
                <div key={g.id}>
                  <div className="text-xs text-gray-600 mb-1">{g.name}  </div>
                  <div className="flex gap-2 flex-wrap">
                   
                       {g.options.map((opt) => {
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
              {variations.length === 0 && (
                <tr><td colSpan={5} className="p-3 text-xs text-gray-400">No variants</td></tr>
              )}
              {variations.map((v) => (
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
