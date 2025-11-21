

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingCart, X, Plus, Minus, Trash2, Edit3 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import { useGst } from "@/components/contexts/gstContext";
import Categorycarosel from "./Categorycarosel"; // keeps your existing carousel component
import CustomerModal from "@/components/Modals/CustomerModal"; // <-- new import (JSX modal file)

/* ---------- sample data (kept from your code) ---------- */
const SAMPLE_PRODUCTS = [
  { id: "p-1", name: "Millet Idly Ravvas (500g)", price: 120, unit: "500g", image: "https://source.unsplash.com/featured/600x600/?millet,idli,grain&sig=101", sku: "MIR-500", stock: 50, category: "Millets" },
  { id: "p-2", name: "Millet Upma Ravva (500g)", price: 95, unit: "500g", image: "https://source.unsplash.com/featured/600x600/?millet,upma,coarse-grain&sig=102", sku: "MUR-500", stock: 40, category: "Millets" },
  { id: "p-3", name: "Organic Grains Mix (1kg)", price: 240, unit: "1kg", image: "https://source.unsplash.com/featured/600x600/?organic,grains,mix&sig=103", sku: "GRA-1KG", stock: 30, category: "Grains" },
  { id: "p-4", name: "Special Dry Fruits Pack", price: 480, unit: "500g", image: "https://source.unsplash.com/featured/600x600/?dry-fruits,nuts,mix&sig=104", sku: "SDF-500", stock: 20, category: "Dry Fruits" },
  { id: "p-5", name: "Premium Flour (2kg)", price: 180, unit: "2kg", image: "https://source.unsplash.com/featured/600x600/?flour,wheat,bread-ingredients&sig=105", sku: "FLO-2KG", stock: 60, category: "Flour" },
  { id: "p-6", name: "Healthy Snack Mix (250g)", price: 150, unit: "250g", image: "https://source.unsplash.com/featured/600x600/?healthy-snack,nuts,seeds&sig=106", sku: "SNK-250", stock: 80, category: "Snacks" },
  { id: "p-7", name: "Ragi Flour (1kg)", price: 59, unit: "1kg", image: "https://source.unsplash.com/featured/600x600/?ragi,flour&sig=107", sku: "RAG-1KG", stock: 0, category: "Flour" },
  { id: "p-8", name: "Little Idly / Upma Rawa", price: 79, unit: "100g", image: "https://source.unsplash.com/featured/600x600/?upma,rawa&sig=108", sku: "LIT-100", stock: 100, category: "Ready" },
];

const Spinner = ({ size = 16 }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function POS() {
  /* ---------- state ---------- */
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [query, setQuery] = useState("");
  const [cartMap, setCartMap] = useState({});
  const [discount, setDiscount] = useState({ type: "fixed", value: 0 });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [gstPercent, setGstPercent] = useState(18);
  const [adminEditProduct, setAdminEditProduct] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPrice, setAdminPrice] = useState("");
  const [adminImageFile, setAdminImageFile] = useState(null);
  const [adminPreview, setAdminPreview] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const imageInputRef = useRef(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("cards");

  // New: selected category state (id and name)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);

  const { items: gstOptions, loading: gstLoading } = useGst();

  // NEW: modal visibility & persistent bill number & drawer state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const billNoRef = useRef(Math.floor(Math.random() * 10000));
  const [cartOpen, setCartOpen] = useState(true); // controls drawer on small screens
  const [isLg, setIsLg] = useState(true); // track whether viewport is large (desktop)
  const [billno, setBillno] = useState(1);
  // Sync initial viewport size and listen for resize to update isLg
  useEffect(() => {
    function update() {
      const lg = typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
      setIsLg(lg);
      // default closed on small screens
      setCartOpen(lg);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ---------- load server products (kept from your code) ---------- */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.get("/admin/products/show");
        const body = res.data;
        let rows = [];
        if (Array.isArray(body)) rows = body;
        else if (Array.isArray(body.data)) rows = body.data;
        else if (Array.isArray(body.products)) rows = body.products;
        else rows = [];

        if (mounted && rows.length) {
          const normalized = rows.map((r, i) => {
            // try to extract category id if category is an object
            const catObj = r.category && typeof r.category === "object" ? r.category : null;
            const categoryId = catObj ? (catObj.id ?? catObj._id ?? catObj.categoryId ?? null) : (r.category_id ?? r.categoryId ?? null);
            const categoryName = catObj ? (catObj.name ?? catObj.title ?? String(catObj)) : (r.category ?? undefined);

            return {
              id: r.id ?? r._id ?? r.product_id ?? `srv-${i}`,
              name: r.name ?? r.title ?? `Product ${i + 1}`,
              price: Number(r.price ?? r.amount ?? 0),
              unit: r.grams ?? r.unit ?? r.size ?? undefined,
              image: r.image ?? r.image_url ?? undefined,
              image_url: r.image_url ?? undefined,
              sku: r.sku ?? r.code ?? undefined,
              stock: r.stock !== undefined ? Number(r.stock) : undefined,
              category: categoryName,
              category_id: categoryId ?? null, // NEW: keep id when available
            };
          });
          setProducts(normalized);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, products, viewMode, selectedCategoryId, selectedCategoryName]);

  /* ---------- cart calculations ---------- */
  const cartLines = useMemo(() => {
    const arr = [];
    for (const pid of Object.keys(cartMap)) {
      const qty = cartMap[pid];
      const prod = products.find((p) => String(p.id) === pid);
      if (!prod) continue;
      const lineTotal = Math.round((prod.price * qty + Number.EPSILON) * 100) / 100;
      arr.push({ product: prod, qty, lineTotal });
    }
    return arr;
  }, [cartMap, products]);

  const itemsCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const subTotal = cartLines.reduce((s, l) => s + l.lineTotal, 0);
  const gstAmount = Math.round((subTotal * (gstPercent / 100) + Number.EPSILON) * 100) / 100;
  const discountAmount = discount.type === "fixed" ? discount.value : Math.round((subTotal * (discount.value / 100) + Number.EPSILON) * 100) / 100;
  const total = Math.max(0, Math.round((subTotal + gstAmount - discountAmount + Number.EPSILON) * 100) / 100);

  /* ---------- filtering & (no) pagination; pageSize depends on viewMode (kept for possible future use) ---------- */
  const pageSize = viewMode === "table" ? 7 : 12;
  const visibleProducts = products.filter((p) => {
    // filter by query first
    if (query) {
      const q = query.toLowerCase();
      if (!(p.name.toLowerCase().includes(q) || String(p.sku || "").toLowerCase().includes(q) || String(p.category || "").toLowerCase().includes(q))) {
        return false;
      }
    }

    // If a category is selected, filter by category id first, fall back to category name
    if (selectedCategoryId !== null && selectedCategoryId !== undefined && selectedCategoryId !== "") {
      // match by category_id if available
      if (p.category_id !== null && p.category_id !== undefined) {
        return String(p.category_id) === String(selectedCategoryId);
      }
      // otherwise match by name (case-insensitive) using selectedCategoryName
      if (selectedCategoryName) {
        return String(p.category || "").toLowerCase() === String(selectedCategoryName).toLowerCase();
      }
      // if no category id and no selectedCategoryName, keep the product (defensive)
      return true;
    }

    // no category filter active => keep
    return true;
  });

  // show all products initially (no pagination)
  const displayProducts = visibleProducts;

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  // const paginatedProducts = visibleProducts.slice((page - 1) * pageSize, page * pageSize); // not used now

  /* ---------- helpers (add, inc, dec, remove) ---------- */
  function addToCart(product, qty = 1) {
    setCartMap((m) => {
      const key = String(product.id);
      const nextQty = (m[key] ?? 0) + qty;
      return { ...m, [key]: nextQty };
    });
    toast.success(`${product.name} added to cart`);
  }

  function setQty(productId, qty) {
    const key = String(productId);
    setCartMap((m) => {
      if (qty <= 0) {
        const copy = { ...m };
        delete copy[key];
        return copy;
      }
      return { ...m, [key]: qty };
    });
  }
  function inc(productId) {
    const key = String(productId);
    setCartMap((m) => ({ ...m, [key]: (m[key] ?? 0) + 1 }));
  }
  function dec(productId) {
    const key = String(productId);
    setCartMap((m) => {
      const next = (m[key] ?? 0) - 1;
      if (next <= 0) {
        const copy = { ...m };
        delete copy[key];
        return copy;
      }
      return { ...m, [key]: next };
    });
  }

  function removeLine(productId) {
    const key = String(productId);
    setCartMap((m) => {
      const copy = { ...m };
      delete copy[key];
      return copy;
    });
  }

  /* ---------- validation & checkout ---------- */
  const validPhone = (p) => {
    const cleaned = p.replace(/\D/g, "");
    return cleaned.length >= 10;
  };
  const validName = (n) => n.trim().length > 0;

  async function handleCheckout() {
    if (cartLines.length === 0) { toast.error("Cart is empty"); return; }
    if (!validName(customerName)) { toast.error("Enter customer name"); return; }
    if (!validPhone(customerPhone)) { toast.error("Enter valid phone number (min 10 digits)"); return; }
    if (!paymentMethod) { toast.error("Select payment method"); return; }

    setIsCheckingOut(true);

    const payload = {
      name: customerName.trim(),
      phone: customerPhone.replace(/\D/g, ""),
      payment: paymentMethod,
      items: cartLines.map(l => ({
        product_id: typeof l.product.id === "string" && /^\d+$/.test(String(l.product.id)) ? Number(l.product.id) : l.product.id,
        name: l.product.name,
        qty: l.qty,
        price: l.product.price
      })),
      subtotal: subTotal,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      discount_type: discount.type,
      discount_value: discount.value,
      total,
    };
    try {
      const res = await api.post("admin/pos-orders/create", payload, { headers: { "Content-Type": "application/json" } });
      const body = res.data;
      toast.success("Purchase successful");
      if(body){
        setBillno(billno + 1);
      }
      setCartMap({});
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("");
      if (body?.order_id) toast.success(`Order ${body.order_id} created`);
    } catch (err) {
      console.error("Checkout error", err);
      toast.error("Network/server error while creating order");
    } finally {
      setIsCheckingOut(false);
    }
  }

  /* ---------- product create/update/delete (unchanged) ---------- */
  async function apiCreateProduct(name, price, file) {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("price", String(price));
    if (file) fd.append("image", file);
    const res = await api.post("/admin/products/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
    const body = res.data;
    const raw = body?.data ?? body?.product ?? body ?? null;
    return {
      id: raw?.id ?? raw?._id ?? `srv-${Date.now()}`,
      name: raw?.name ?? name,
      price: Number(raw?.price ?? price ?? 0),
      image: raw?.image ?? raw?.image_url ?? raw?.imageUrl ?? undefined,
      image_url: raw?.image_url ?? undefined,
      category: raw?.category ?? raw?.category?.name ?? undefined,
    };
  }

  async function apiUpdateProduct(id, name, price, file) {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("price", String(price));
    if (file) fd.append("image", file);
    const res = await api.post(`/admin/products/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    const body = res.data;
    const raw = body?.data ?? body?.product ?? body ?? null;
    return {
      id: raw?.id ?? id,
      name: raw?.name ?? name,
      price: Number(raw?.price ?? price ?? 0),
      image: raw?.image ?? raw?.image_url ?? raw?.imageUrl ?? undefined,
      image_url: raw?.image_url ?? undefined,
      category: raw?.category ?? raw?.category?.name ?? undefined,
    };
  }

  async function apiDeleteProduct(id) {
    const res = await api.delete(`/admin/products/delete/${id}`);
    return res.status >= 200 && res.status < 300;
  }

  function openAdminCreate() {
    setAdminEditProduct(null);
    setAdminName("");
    setAdminPrice("");
    setAdminImageFile(null);
    setAdminPreview("");
    setAdminModalOpen(true);
  }

  function openAdminEdit(p) {
    setAdminEditProduct(p);
    setAdminName(p.name ?? "");
    setAdminPrice(String(p.price ?? ""));
    setAdminImageFile(null);
    setAdminPreview(p.image_url ?? p.image ?? "");
    setAdminModalOpen(true);
  }

  function onAdminImageChange(e) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setAdminImageFile(f);
    const r = new FileReader();
    r.onload = () => setAdminPreview(String(r.result ?? ""));
    r.readAsDataURL(f);
  }

  async function submitAdminForm(e) {
    e?.preventDefault();
    const name = adminName.trim();
    const price = Number(adminPrice || 0);
    if (!name) { toast.error("Name required"); return; }
    if (Number.isNaN(price)) { toast.error("Price invalid"); return; }
    try {
      if (adminEditProduct) {
        const optimistic = products.map((p) => (String(p.id) === String(adminEditProduct.id) ? { ...p, name, price, image: adminPreview || p.image, image_url: adminPreview || p.image_url } : p));
        setProducts(optimistic);
        setAdminModalOpen(false);
        const updated = await apiUpdateProduct(adminEditProduct.id, name, price, adminImageFile);
        setProducts((prev) => prev.map((p) => (String(p.id) === String(updated.id) ? updated : p)));
        toast.success("Product updated");
      } else {
        const tmpId = `tmp-${Date.now()}`;
        const optimistic = { id: tmpId, name, price, image: adminPreview || undefined, image_url: adminPreview || undefined };
        setProducts((prev) => [optimistic, ...prev]);
        setAdminModalOpen(false);
        const created = await apiCreateProduct(name, price, adminImageFile);
        setProducts((prev) => [created, ...prev.filter((p) => p.id !== tmpId)]);
        toast.success("Product created");
      }
    } catch (err) {
      console.error("Save product failed", err);
      toast.error(err?.message || "Save failed");
    } finally {
      setAdminImageFile(null);
      setAdminPreview("");
    }
  }

  function requestDelete(id, name) {
    setDeleteTarget({ id, name });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const id = deleteTarget.id;
    const prev = products;
    setProducts((p) => p.filter((x) => String(x.id) !== String(id)));
    try {
      await apiDeleteProduct(id);
      toast.success("Product deleted");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error(err?.message || "Delete failed");
      setProducts(prev);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  /* ---------- small utility ---------- */
  const fallbackFor11 = (p) => {
    const seed = encodeURIComponent(p.category || (p.name?.split(" ")[0] ?? "product"));
    return `https://source.unsplash.com/featured/400x400/?${seed}`;
  };

  const fallbackFor = () => "/no-image-preview.png";

  /* ---------- Category selection handler ---------- */
  const handleCategorySelect = (cat) => {
    if (!cat) {
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
      return;
    }
    const id = cat.id ?? cat.category_id ?? cat.categoryId ?? null;
    const name = cat.title ?? cat.name ?? cat.category ?? null;
    setSelectedCategoryId(id);
    setSelectedCategoryName(name ? String(name) : null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-full mx-auto p-4 lg:px-8" >
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: "59%"}}>
              <Categorycarosel onSelect={handleCategorySelect} />
            </div>
            {/* <div className="flex-shrink-0">
              <button
                onClick={() => setViewMode((v) => (v === "table" ? "cards" : "table"))}
                className="px-4 py-2 rounded-md border bg-white hover:bg-slate-50 text-sm"
                title="Toggle view"
              >
                {viewMode === "table" ? "Show as Cards" : "Show as Table"}
              </button>
            </div> */}
          </div>

          {/* Info line */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">{visibleProducts.length} products</div>
            <div className="text-sm text-slate-500">
              Showing 1 - {visibleProducts.length} of {visibleProducts.length}
            </div>
          </div>
          <div className={`relative ${viewMode === "table" ? "w-[100%]" : "w-full"}`}>
            <div className={`transition-all ${viewMode === "table" ? "" : "mr-0"}`}>
              {viewMode === "table" ? (
                <div className="hidden md:block overflow-hidden rounded-lg border bg-white w-[75%]">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-white">
                      <tr className="text-left text-sm text-slate-600">
                        <th className="px-4 py-3 w-12">S.no</th>
                        <th className="px-4 py-3 w-20">Image</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Grams</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-slate-100">
                      {loadingProducts
                        ? Array.from({ length: pageSize }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-6" /></td>
                            <td className="px-4 py-4"><div className="h-12 w-12 rounded-full bg-slate-200" /></td>
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-48" /></td>
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                            <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-8" /></td>
                            <td className="px-4 py-4 text-right"><div className="h-8 bg-slate-200 rounded w-24 inline-block" /></td>
                          </tr>
                        ))
                        : displayProducts.map((p, idx) => {
                          const globalIndex = idx + 1;
                          const inCartQty = cartMap[String(p.id)] ?? 0;
                          const imageSrc = p.image_url ?? p.image ?? fallbackFor(p);
                          return (
                            <tr key={p.id}>
                              <td className="px-4 py-4 align-top text-sm text-slate-700">{globalIndex}</td>
                              <td className="px-4 py-4 align-top">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border">
                                  <img src={imageSrc} alt={p.name} className="object-cover w-10 h-10" onError={(e) => { e.currentTarget.src = fallbackFor(p); }} />
                                </div>
                              </td>
                              <td className="px-4 align-top">
                                <div className="font-medium text-slate-800">{p.name}</div>
                                <div className="text-sm text-slate-500 mt-1">{p.sku ?? p.unit}</div>
                              </td>
                              <td className="px-4 py-4 align-top text-sm text-slate-600">{p.category ?? "-"}</td>
                              <td className="px-4 py-4 align-top text-sm text-slate-600">{p.unit ?? "-"}</td>
                              <td className="px-4 py-4 align-top text-sm font-semibold">₹ {Number(p.price || 0).toFixed(2)}</td>
                              <td className="px-4 py-4 align-top text-sm text-slate-700">
                                {p.stock === 0 ? (<span className="text-red-600 font-medium">Out of Stock</span>) : (p.stock ?? "-")}
                              </td>
                              <td className="px-4 py-4 align-top text-right">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  {inCartQty === 0 ? (
                                    (p.stock === 0) ? (
                                      <div className="w-full text-center text-sm text-red-600 font-medium py-2"></div>
                                    ) : (
                                      <button onClick={() => addToCart(p, 1)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm">
                                        <Plus className="w-4 h-4" /> Add
                                      </button>
                                    )
                                  ) : (
                                    <div className="inline-flex items-center gap-1 border rounded px-1">
                                      <button onClick={() => dec(p.id)} className="px-2 py-1 rounded"><Minus className="w-4 h-4" /></button>
                                      <div className="px-3 py-1 text-sm">{inCartQty}</div>
                                      <button onClick={() => inc(p.id)} className="px-2 py-1 rounded"><Plus className="w-4 h-4" /></button>
                                    </div>
                                  )}
                                  <button onClick={() => requestDelete(p.id, p.name)} title="Delete" className="p-2 rounded border hover:bg-slate-50"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-1" style={{width:"60%"}}>
                  {loadingProducts
                    ? Array.from({ length: pageSize }).map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-xl bg-white" />
                    ))
                    : displayProducts.map((p) => {
                      const inCartQty = cartMap[String(p.id)] ?? 0;
                      const imageSrc = p.image_url ?? p.image ?? fallbackFor(p);
                      return (
                          <article
  key={p.id}
  onClick={() => addToCart(p, 1)}
  className="bg-white border rounded-md p-2 text-center select-none hover:shadow-md transition-all"
  style={{
    border: "1px solid rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: 150, 
    cursor: "pointer",
     marginTop:"10px"
  }}
>
  {/* Larger image area */}
  <div
    className="mx-auto rounded-md overflow-hidden bg-slate-50 grid place-items-center"
    style={{ width: 100, height: 100 }} // increased size: more square and balanced
  >
    <img
      src={imageSrc}
      alt={p.name}
      className="w-full h-full object-contain"
      onError={(e) => {
        e.currentTarget.src = fallbackFor(p);
      }}
    />
  </div>

  {/* Product name */}
  <div className="mt-2 px-1">
    <div
      className="text-[11px] font-semibold text-slate-800 leading-tight truncate"
      title={p.name}
    >
      {p.name}
    </div>
  </div>
</article>

                      );
                    })}
                </div>
              )}

              <div className="md:hidden mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loadingProducts
                    ? Array.from({ length: pageSize }).map((_, i) => (<div key={i} className="animate-pulse p-4 border rounded-xl bg-white" />))
                    : displayProducts.map((p) => {
                      const inCartQty = cartMap[String(p.id)] ?? 0;
                      const imageSrc = p.image_url ?? p.image ?? fallbackFor(p);
                      return (
                        <article key={p.id} className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md">
                          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-50">
                            <img src={imageSrc} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = fallbackFor(p); }} />
                          </div>

                          <div className="mt-3">
                            <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                            {p.unit || p.sku ? <div className="text-xs text-slate-500 mt-0.5">{p.sku ?? p.unit}</div> : null}

                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-base font-semibold">₹ {Number(p.price).toFixed(2)}</div>
                              <div className="text-xs text-slate-600">Stock: {p.stock ?? "-"}</div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {inCartQty === 0 ? (
                                <button onClick={() => addToCart(p, 1)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm">
                                  <Plus className="w-4 h-4" /> Add
                                </button>
                              ) : (
                                <div className="w-full inline-flex items-center justify-between gap-2 border rounded-md px-2 py-1.5">
                                  <button onClick={() => dec(p.id)} className="p-1.5 rounded"><Minus className="w-4 h-4" /></button>
                                  <div className="text-sm font-medium">{inCartQty}</div>
                                  <button onClick={() => inc(p.id)} className="p-1.5 rounded"><Plus className="w-4 h-4" /></button>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2"></div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>

              {/* PAGINATION removed (showing all products) */}

            </div>
          </div>
        </div>
      </div>

      {/* Floating menu button for small/medium screens -> opens drawer */}
      <button
        aria-label="Open cart"
        onClick={() => setCartOpen(true)}
        className="fixed right-4 top-24 z-50 flex items-center gap-2 rounded-full bg-white border shadow-lg px-3 py-2 lg:hidden"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="text-sm font-medium">{itemsCount}</span>
      </button>

      {/* Backdrop for cart drawer on small screens */}
      {cartOpen && !isLg && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

        <aside
  id="cart-sidebar"
  className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl border-l transform transition-transform duration-300
    ${cartOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}
  style={{ width: "39%", maxWidth: 820,}}
  role="region"
  aria-label="Cart"
>
  <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col items-start w-full border border-black p-4 rounded-md mb-2">
  {/* First Row: Cart title, Bill No, Search */}
  <div className="flex flex-wrap items-center justify-between w-full gap-4 mb-3">
   
    <div className="flex items-center gap-2 whitespace-nowrap">
      <label className="text-xl font-semibold whitespace-nowrap">Bill No:{billno}</label>
    </div>
    <div className="flex flex-col">
      <label className="text-xs text-slate-600 mb-1">Search</label>
      <input
        type="text"
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
        className="px-2 py-1.5 border rounded text-sm w-48"
      />
    </div>
  </div>

  {/* Second Row: Customer Name and WhatsApp Number */}
  <div className="flex flex-wrap items-center justify-start w-full gap-4">
    <div className="flex flex-col w-48">
      <label className="text-xs text-slate-600 mb-1">Customer Name</label>
      <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Enter name"
        className="px-2 py-1.5 border rounded text-sm w-full"
      />
    </div>

    <div className="flex flex-col w-48">
      <label className="text-xs text-slate-600 mb-1">WhatsApp Number</label>
      <input
        type="tel"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        placeholder="+91 9XXXXXXXXX"
        className="px-2 py-1.5 border rounded text-sm w-full"
      />
    </div>
  </div>
</div>

    <div className="flex-1 overflow-hidden">
      {cartLines.length === 0 ? (
        <div className="h-full grid place-items-center text-slate-400">
          <div className="text-center">
            <div className="w-28 h-28 rounded-full bg-slate-100 grid place-items-center mb-4">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>No items in cart</div>
            <div className="text-sm text-slate-400">Add items from the product list</div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col overflow-hidden rounded-md border">
          <div className="overflow-auto" style={{ maxHeight: "56vh", margin: "10px" }}>
            <table className="min-w-full table-fixed text-[12px] border-collapse">
              {/* sticky header */}
              <thead className="sticky top-0 z-10 bg-gray-100 border border-gray-300">
                <tr className="bg-blue-900 text-black text-sm">
                  {/* <th className="p-2 w-8 text-left">No.</th> */}
                  <th className="p-2 w-28 text-center text-sm">Item No.</th>
                  <th className="p-2 text-left  text-sm">Item Name</th>
                  {/* <th className="p-2 w-24 text-left">Lot No.</th> */}
                  <th className="p-2 w-14 text-center  text-sm">Qty.</th>
                  <th className="p-2 w-24 text-right  text-sm">Price</th>
                  {/* <th className="p-2 w-20 text-">Disc.</th> */}
                  {/* <th className="p-2 w-20 text-right">Tax</th> */}
                  <th className="p-2 w-28 text-right  text-sm">Amount</th>
                  {/* <th className="p-2 w-20 text-left">UOM</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white border-gray-300">
                {cartLines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No items added
                    </td>
                  </tr>
                ) : (
                  cartLines.map((ln, i) => {
                    const prod = ln.product;
                    const tax = (ln.lineTotal * gstPercent) / 100;
                    return (
                      <tr key={String(prod.id)} className="hover:bg-slate-50" style={{ border: "1px solid black" }}>
                        {/* Item No */}
                        <td className="p-2 w-25 align-top text-xs text-slate-600 text-center">
                          {String(prod.id).slice(0, 12)}
                        </td>
                        {/* Item Name + small image */}
                        <td className="p-2 align-top" style={{ border: "1px solid black" }}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded overflow-hidden bg-slate-50 flex-shrink-0 border">
                              <img
                                src={prod.image_url ?? prod.image ?? fallbackFor(prod)}
                                alt={prod.name}
                                className="object-contain w-full h-full"
                                onError={(e) => {
                                  e.currentTarget.src = fallbackFor(prod);
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 text-sm truncate leading-tight">
                                {prod.name}
                              </div>
                              {/* <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                                {prod.unit ?? prod.sku}
                              </div> */}
                            </div>
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="p-2 w-14 align-top text-center" style={{ border: "1px solid black" }}>
                          <div className="inline-flex items-center justify-center border rounded px-1">
                            <button onClick={() => dec(prod.id)} className="px-1 py-0.5" aria-label="decrease">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-[11px]">{ln.qty}</span>
                            <button onClick={() => inc(prod.id)} className="px-1 py-0.5" aria-label="increase">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Sales Price */}
                        <td className="p-2 w-24 align-top text-right text-[11px]" style={{ border: "1px solid black" }}>
                          ₹ {Number(prod.price || 0).toFixed(2)}
                        </td>

                        {/* Amount (you kept Tax hidden in header; I compute tax below but show amount column only) */}
                        <td className="p-2 w-28 align-top text-right font-semibold text-[11px]">
                          ₹ {ln.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-2 text-sm">
        <div className="flex items-center gap-1 text-slate-600">
          <span className="font-medium text-black">Subtotal:</span>
          <span className="font-medium text-black">₹ {subTotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-1 text-slate-600">
          <span className="font-medium text-black">GST ({gstPercent}%):</span>
          <span className="font-medium text-black">₹ {gstAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-1 text-slate-600">
          <span className="font-medium text-black">Discount:</span>
          <span className="font-medium text-black">- ₹ {discountAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">{/* gst select hidden by you */}</div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={discount.type}
            onChange={(e) => setDiscount((d) => ({ ...d, type: e.target.value }))}
            className="px-2 py-1 text-sm border rounded bg-slate-50 h-8"
            aria-label="Discount type"
          >
            <option value="fixed">Fixed</option>
            <option value="percent">Percent</option>
          </select>
          <input
            type="number"
            min={0}
            value={discount.value}
            onChange={(e) => setDiscount((d) => ({ ...d, value: Number(e.target.value || 0) }))}
            className="px-2 py-1 text-sm border rounded w-24 h-8"
            placeholder={discount.type === "fixed" ? "₹ amount" : "%"}
            aria-label="Discount value"
          />
        </div>
        <div className="text-lg font-medium">Total</div>
        <div className="text-2xl font-extrabold">₹ {total.toFixed(2)}</div>
      </div>

      <div className="flex items-center justify-end gap-4">
  {/* Payment Method */}
  <div className="flex flex-col w-1/3">
    <label className="text-xs text-slate-600 mb-1">Payment</label>
    <select
      value={paymentMethod}
      onChange={(e) => setPaymentMethod(e.target.value)}
      className="w-full px-2 py-1.5 border rounded text-sm"
    >
      <option value="">Select</option>
      <option value="card">Card</option>
      <option value="upi">UPI</option>
      <option value="cash">Cash</option>
    </select>
  </div>

  {/* Checkout Button */}
  <button
    onClick={() => void handleCheckout()}
    disabled={
      isCheckingOut ||
      cartLines.length === 0 ||
      !validName(customerName) ||
      !validPhone(customerPhone) ||
      !paymentMethod
    }
    className="px-6 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 h-[42px] mt-5"
  >
    {isCheckingOut ? "Processing…" : `Purchase ₹ ${total.toFixed(2)}`}
  </button>
</div>

    </div>
  </div>
</aside>

      {/* Customer modal (new) */}
      <CustomerModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onSave={() => {
          // optional: show a toast when saved
          toast.success("Customer details saved");
        }}
      />

      {/* admin modal (unchanged) */}
      {adminModalOpen && (
        <aside
          className="fixed top-0 right-[38%] lg:right-[38%] h-full z-45 bg-white shadow-2xl border-l"
          style={{ width: "28%", maxWidth: 680 }}
          role="region"
          aria-label="Admin Panel"
        >
          <div className="p-4 md:p-6 h-full flex flex-col overflow-auto">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{adminEditProduct ? "Edit Product" : "Add Product"}</h3>
              <div className="text-sm text-slate-500 mt-1">{adminEditProduct ? "Editing product details" : "Add a new product"}</div>
            </div>
            <form onSubmit={submitAdminForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input value={adminPrice} onChange={(e) => setAdminPrice(e.target.value)} className="w-full p-2 border rounded" type="number" step="0.01" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={onAdminImageChange} className="w-full text-sm" />
                {adminPreview && <div className="mt-2 w-full h-40 rounded overflow-hidden"><img src={adminPreview} alt="preview" className="w-full h-full object-cover" /></div>}
              </div>

              <div className="flex justify-between gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEditProduct(null);
                    setAdminName("");
                    setAdminPrice("");
                    setAdminImageFile(null);
                    setAdminPreview("");
                  }}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Reset
                </button>

                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded text-sm">{adminEditProduct ? "Save" : "Add"}</button>
              </div>
            </form>
          </div>
        </aside>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm p-5 z-10">
            <h3 className="text-lg font-medium">Confirm deletion</h3>
            <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete <strong>{deleteTarget.name ?? "this product"}</strong>? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={confirmDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
