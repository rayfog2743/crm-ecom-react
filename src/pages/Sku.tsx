
// import React, { useEffect, useRef, useState } from "react";
// import { Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import api from "@/api/axios";
// import type { AxiosError } from "axios";
// type Inventory = {
//   id: string | number;
//   product_id: string | number;
//   quantity: number;
//   type: "in" | "out" | string;
//   vendor_id?: string | number | null;
//   note?: string | null;
//   created_at?: string | null;
//   updated_at?: string | null;
// };

// type FormState = {
//   product_id: string;
//   quantity: string; // keep as string for input and convert when sending
//   type: string;
//   vendor_id: string;
//   note: string;
// };

// const defaultForm: FormState = { product_id: "", quantity: "0", type: "in", vendor_id: "", note: "" };

// /* ----------------------
//    Error helpers (robust)
//    ---------------------- */
// function formatAxiosError(err: unknown) {
//   const fallback = { message: "An unknown error occurred", details: null as any, status: undefined as number | undefined };
//   try {
//     if (!err) return fallback;
//     const ae = err as AxiosError & { response?: any; request?: any };
//     if (ae && (ae.isAxiosError || ae.response || ae.request)) {
//       const status = ae.response?.status;
//       const data = ae.response?.data;
//       let message = ae.message || "Request failed";
//       if (data) {
//         if (typeof data === "string") message = data;
//         else if (data.message) message = data.message;
//         else if (data.error) message = data.error;
//         else if (data.errors && typeof data.errors === "string") message = data.errors;
//       }
//       return { message: String(message), details: data ?? ae.response ?? ae.request ?? ae.stack, status };
//     }
//     if (err instanceof Error) return { message: err.message, details: err.stack, status: undefined };
//     if (typeof err === "string") return { message: err, details: null, status: undefined };
//     return { message: "Unknown error", details: JSON.stringify(err), status: undefined };
//   } catch (e) {
//     return { message: "Error while parsing error", details: e, status: undefined };
//   }
// }

// /** Heuristic mapping from server field key to our form field name */
// function mapServerFieldToFormField(key: string): string | null {
//   if (!key) return null;
//   const k = key.toLowerCase();
//   if (k.includes("product")) return "product_id";
//   if (k.includes("qty") || k.includes("quantity")) return "quantity";
//   if (k.includes("type")) return "type";
//   if (k.includes("vendor")) return "vendor_id";
//   if (k.includes("note")) return "note";
//   const simple = ["product_id", "quantity", "type", "vendor_id", "note"];
//   if (simple.includes(k)) return k;
//   return null;
// }

// /** Extracts field-level errors and general messages from many shapes */
// function extractServerErrors(payload: any): { fieldErrors: Record<string, string>; general: string[] } {
//   const fieldErrors: Record<string, string> = {};
//   const general: string[] = [];
//   if (!payload) return { fieldErrors, general };

//   const pushGeneral = (m: any) => {
//     if (m == null) return;
//     if (Array.isArray(m)) m.forEach((x) => pushGeneral(x));
//     else general.push(String(m));
//   };

//   if (payload.message) {
//     pushGeneral(payload.message);
//   }
//   if (Array.isArray(payload.messages)) pushGeneral(payload.messages);

//   if (payload.errors && typeof payload.errors === "object") {
//     Object.keys(payload.errors).forEach((k) => {
//       const v = payload.errors[k];
//       const mapped = mapServerFieldToFormField(k) ?? k;
//       if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
//       else if (typeof v === "object") {
//         try {
//           const arr = Array.isArray(v) ? v : Object.values(v);
//           if (arr.length) fieldErrors[mapped] = String(arr[0]);
//           else fieldErrors[mapped] = String(JSON.stringify(v));
//         } catch {
//           fieldErrors[mapped] = String(v);
//         }
//       } else fieldErrors[mapped] = String(v);
//     });
//   }

//   const maybe = payload.data ?? payload.error ?? null;
//   if (maybe && typeof maybe === "object") {
//     if (maybe.errors && typeof maybe.errors === "object") {
//       Object.keys(maybe.errors).forEach((k) => {
//         const v = maybe.errors[k];
//         const mapped = mapServerFieldToFormField(k) ?? k;
//         if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
//         else fieldErrors[mapped] = String(v);
//       });
//     }
//     if (maybe.validation && typeof maybe.validation === "object") {
//       Object.keys(maybe.validation).forEach((k) => {
//         const v = maybe.validation[k];
//         const mapped = mapServerFieldToFormField(k) ?? k;
//         if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
//         else fieldErrors[mapped] = String(v);
//       });
//     }
//     if (maybe.message) pushGeneral(maybe.message);
//     if (Array.isArray(maybe.messages)) pushGeneral(maybe.messages);
//   }

//   const possible = ["product_id", "product", "quantity", "qty", "type", "vendor", "vendor_id", "note"];
//   for (const f of possible) {
//     if (payload[f]) {
//       const mapped = mapServerFieldToFormField(f) ?? f;
//       if (!fieldErrors[mapped]) {
//         if (Array.isArray(payload[f])) fieldErrors[mapped] = String(payload[f].join(", "));
//         else fieldErrors[mapped] = String(payload[f]);
//       }
//     }
//   }

//   if (payload.status === false && general.length === 0 && Object.keys(fieldErrors).length === 0) {
//     if (payload.error) pushGeneral(payload.error);
//     else if (payload.message) pushGeneral(payload.message);
//     else pushGeneral("Request failed");
//   }

//   const dedupGen = Array.from(new Set(general.map((s) => String(s).trim()).filter(Boolean)));
//   return { fieldErrors, general: dedupGen };
// }

// /* -------------------------
//    Inventory component
//    ------------------------- */
// const InventoryManager: React.FC = () => {
//   const [items, setItems] = useState<Inventory[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const [modalOpen, setModalOpen] = useState(false);
//   const [editing, setEditing] = useState<Inventory | null>(null);
//   const [form, setForm] = useState<FormState>(defaultForm);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//   const [generalErrors, setGeneralErrors] = useState<string[]>([]);
//   const [saving, setSaving] = useState(false);

//   const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   // products & vendors for dropdown + name lookup
//   const [products, setProducts] = useState<any[]>([]);
//   const [productsLoading, setProductsLoading] = useState(false);
//   const [vendors, setVendors] = useState<any[]>([]);
//   const [vendorsLoading, setVendorsLoading] = useState(false);

//   // refs for focusing
//   const productRef = useRef<HTMLSelectElement | null>(null);
//   const quantityRef = useRef<HTMLInputElement | null>(null);
//   const typeRef = useRef<HTMLSelectElement | null>(null);
//   const vendorRef = useRef<HTMLSelectElement | null>(null);
//   const noteRef = useRef<HTMLTextAreaElement | null>(null);
//   const FIELD_ORDER = ["product_id", "quantity", "type", "vendor_id", "note"];

//   // --- PRODUCT & VENDOR ENDPOINTS --- //
//   async function fetchProductsList() {
//     setProductsLoading(true);
//     try {
//       const res = await api.get("/admin/products/show");
//       const body = res.data;
//       if (body && body.status === false) {
//         const { general } = extractServerErrors(body);
//         if (general.length) general.forEach((m) => toast.error(m));
//         else toast.error(body.message ?? "Failed to load products");
//         setProducts([]);
//         return;
//       }
//       const rows: any[] = Array.isArray(body)
//         ? body
//         : Array.isArray(body?.data)
//         ? body.data
//         : Array.isArray(body?.products)
//         ? body.products
//         : Array.isArray(body?.rows)
//         ? body.rows
//         : [];
//       setProducts(rows);
//     } catch (err: unknown) {
//       const { message, status } = formatAxiosError(err);
//       console.error("Failed to load products for dropdown:", err);
//       if (status === 401) toast.error("Unauthorized while fetching products");
//       else toast.error(message || "Failed to load products");
//       setProducts([]);
//     } finally {
//       setProductsLoading(false);
//     }
//   }

//   async function fetchVendorsList() {
//     setVendorsLoading(true);
//     try {
//       const res = await api.get("/admin/settings/vendors/show");
//       const body = res.data;
//       if (body && body.status === false) {
//         const { general } = extractServerErrors(body);
//         if (general.length) general.forEach((m) => toast.error(m));
//         else toast.error(body.message ?? "Failed to load vendors");
//         setVendors([]);
//         return;
//       }
//       const rows: any[] = Array.isArray(body)
//         ? body
//         : Array.isArray(body?.data)
//         ? body.data
//         : Array.isArray(body?.vendors)
//         ? body.vendors
//         : Array.isArray(body?.rows)
//         ? body.rows
//         : [];
//       setVendors(rows);
//     } catch (err: unknown) {
//       const { message, status } = formatAxiosError(err);
//       console.error("Failed to load vendors for dropdown:", err);
//       if (status === 401) toast.error("Unauthorized while fetching vendors");
//       else toast.error(message || "Failed to load vendors");
//       setVendors([]);
//     } finally {
//       setVendorsLoading(false);
//     }
//   }

//   // normalized options used in dropdowns
//   const productOptions = products
//     .map((p) => {
//       const id = p?.id ?? p?._id ?? p?.product_id ?? p?.productId ?? "";
//       const name = p?.name ?? p?.title ?? "";
//       if (id === null || id === undefined || id === "") return null;
//       return { id: String(id), label: name ? `${id} — ${name}` : String(id), raw: p };
//     })
//     .filter(Boolean) as { id: string; label: string; raw: any }[];

//   const vendorOptions = vendors
//     .map((v) => {
//       const id = v?.id ?? v?._id ?? v?.vendor_id ?? v?.vendorId ?? "";
//       const name = v?.name ?? v?.title ?? v?.company ?? "";
//       if (id === null || id === undefined || id === "") return null;
//       return { id: String(id), label: name ? `${id} — ${name}` : String(id), raw: v };
//     })
//     .filter(Boolean) as { id: string; label: string; raw: any }[];

//   function getProductName(productId: string | number | undefined | null) {
//     if (productId === null || productId === undefined || productId === "") return "-";
//     const pid = String(productId);
//     const found = productOptions.find((p) => p.id === pid);
//     if (found) return found.raw?.name ?? found.raw?.title ?? String(pid);
//     const fallback = products.find((p) => String(p?.id ?? p?._id ?? p?.product_id ?? p?.productId) === pid);
//     if (fallback) return fallback?.name ?? fallback?.title ?? pid;
//     return String(pid);
//   }

//   function getVendorName(vendorId: string | number | undefined | null) {
//     if (vendorId === null || vendorId === undefined || vendorId === "") return "-";
//     const vid = String(vendorId);
//     const found = vendorOptions.find((v) => v.id === vid);
//     if (found) return found.raw?.name ?? found.raw?.title ?? found.raw?.company ?? String(vid);
//     const fallback = vendors.find((v) => String(v?.id ?? v?._id ?? v?.vendor_id ?? v?.vendorId) === vid);
//     if (fallback) return fallback?.name ?? fallback?.title ?? fallback?.company ?? vid;
//     return String(vid);
//   }

//   // --- Inventory API helpers --- //
//   async function fetchItems() {
//     setLoading(true);
//     try {
//       const res = await api.get("/admin/settings/stock-inventory/show");
//       const body = res.data;
//       if (body && body.status === false) {
//         const { general } = extractServerErrors(body);
//         if (general.length) general.forEach((m) => toast.error(m));
//         else toast.error(body.message ?? "Failed to load inventory");
//         setItems([]);
//         return;
//       }
//       const rows: any[] = Array.isArray(body)
//         ? body
//         : Array.isArray(body?.data)
//         ? body.data
//         : Array.isArray(body?.inventory)
//         ? body.inventory
//         : Array.isArray(body?.items)
//         ? body.items
//         : [];
//       setItems(rows.map((r: any) => normalizeInventory(r)));
//     } catch (err: unknown) {
//       const { message, status } = formatAxiosError(err);
//       console.error("Failed to load inventory:", err);
//       if (status === 401) toast.error("Unauthorized — please login.");
//       else toast.error(message || "Failed to load inventory");
//       setItems([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function normalizeInventory(raw: any): Inventory {
//     return {
//       id: raw.id ?? raw._id ?? raw.inventory_id ?? raw.inventoryId ?? String(Date.now()) + Math.random(),
//       product_id: raw.product_id ?? raw.productId ?? raw.product ?? raw?.item_id ?? raw?.sku ?? "",
//       quantity: Number(raw.quantity ?? raw.qty ?? 0),
//       type: raw.type ?? "in",
//       vendor_id: raw.vendor_id ?? raw.vendorId ?? raw.vendor ?? null,
//       note: raw.note ?? raw.notes ?? null,
//       created_at: raw.created_at ?? raw.createdAt ?? null,
//       updated_at: raw.updated_at ?? raw.updatedAt ?? null,
//     };
//   }

//   useEffect(() => {
//     void fetchProductsList();
//     void fetchVendorsList();
//     void fetchItems();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function openAdd() {
//     setEditing(null);
//     setForm(defaultForm);
//     setFormErrors({});
//     setGeneralErrors([]);
//     setModalOpen(true);
//     if (!products.length) void fetchProductsList();
//     if (!vendors.length) void fetchVendorsList();
//     setTimeout(() => productRef.current?.focus(), 80);
//   }

//   function openEdit(it: Inventory) {
//     setEditing(it);
//     setForm({
//       product_id: String(it.product_id ?? ""),
//       quantity: String(it.quantity ?? 0),
//       type: String(it.type ?? "in"),
//       vendor_id: String(it.vendor_id ?? ""),
//       note: String(it.note ?? ""),
//     });
//     setFormErrors({});
//     setGeneralErrors([]);
//     setModalOpen(true);
//     setTimeout(() => productRef.current?.focus(), 80);
//   }

//   function validateForm(): boolean {
//     const e: Record<string, string> = {};
//     if (!form.product_id.trim()) e.product_id = "Product is required";
//     if (form.quantity === "" || Number.isNaN(Number(form.quantity))) e.quantity = "Quantity is required and must be a number";
//     else if (Number(form.quantity) <= 0) e.quantity = "Quantity must be > 0";
//     if (!form.type.trim()) e.type = "Type is required";
//     setFormErrors(e);
//     return Object.keys(e).length === 0;
//   }

//   function focusFirstInvalidField(fieldErrs: Record<string, string>) {
//     for (const f of FIELD_ORDER) {
//       if (fieldErrs[f]) {
//         if (f === "product_id") productRef.current?.focus();
//         else if (f === "quantity") quantityRef.current?.focus();
//         else if (f === "type") typeRef.current?.focus();
//         else if (f === "vendor_id") vendorRef.current?.focus();
//         else if (f === "note") noteRef.current?.focus();
//         break;
//       }
//     }
//   }

//   async function saveItem(e?: React.FormEvent) {
//     e?.preventDefault();
//     setFormErrors({});
//     setGeneralErrors([]);

//     if (!validateForm()) {
//       toast.error("Fix validation errors");
//       focusFirstInvalidField(formErrors);
//       return;
//     }
//     setSaving(true);

//     try {
//       const payload = {
//         product_id: form.product_id,
//         quantity: Number(form.quantity),
//         type: form.type,
//         vendor_id: form.vendor_id || null,
//         note: form.note || null,
//       };

//       if (editing) {
//         const updatedCandidate: Inventory = { ...editing, ...payload, quantity: Number(payload.quantity) };
//         setItems((p) => p.map((it) => (String(it.id) === String(editing.id) ? updatedCandidate : it)));
//         setModalOpen(false);

//         const res = await api.post(`/admin/settings/stock-inventory/update/${editing.id}`, payload);
//         const body = res.data ?? res;
//         if (body && body.status === false) {
//           const { fieldErrors, general } = extractServerErrors(body);
//           if (Object.keys(fieldErrors).length) {
//             setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
//             focusFirstInvalidField(fieldErrors);
//             toast.error("Validation errors received from server");
//           }
//           if (general.length) {
//             setGeneralErrors(general);
//             general.forEach((m) => toast.error(m));
//           }
//           await fetchItems();
//           setSaving(false);
//           return;
//         }

//         const raw = body?.data ?? body?.inventory ?? body ?? null;
//         const updated = raw ? normalizeInventory(raw) : updatedCandidate;
//         setItems((p) => p.map((it) => (String(it.id) === String(editing.id) ? updated : it)));
//         toast.success("Inventory updated");
//       } else {
//         const tmpId = `tmp-${Date.now()}`;
//         const optimistic: Inventory = {
//           id: tmpId,
//           product_id: payload.product_id,
//           quantity: Number(payload.quantity),
//           type: payload.type,
//           vendor_id: payload.vendor_id,
//           note: payload.note,
//         };
//         setItems((p) => [optimistic, ...p]);
//         setModalOpen(false);

//         const res = await api.post("/admin/settings/stock-inventory/add", payload);
//         const body = res.data ?? res;
//         if (body && body.status === false) {
//           const { fieldErrors, general } = extractServerErrors(body);
//           if (Object.keys(fieldErrors).length) {
//             setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
//             focusFirstInvalidField(fieldErrors);
//             toast.error("Validation errors received from server");
//           }
//           if (general.length) {
//             setGeneralErrors(general);
//             general.forEach((m) => toast.error(m));
//           }
//           await fetchItems();
//           setSaving(false);
//           return;
//         }

//         const raw = body?.data ?? body?.inventory ?? body ?? null;
//         const created = raw ? normalizeInventory(raw) : { ...optimistic, id: body?.id ?? tmpId };
//         setItems((p) => [created, ...p.filter((x) => x.id !== tmpId)]);
//         toast.success("Inventory added");
//       }

//       setEditing(null);
//       setForm(defaultForm);
//       setFormErrors({});
//       setGeneralErrors([]);
//     } catch (err: unknown) {
//       const { message, details, status } = formatAxiosError(err);
//       console.error("Save inventory error:", { message, status, details, raw: err });

//       const ae = err as AxiosError & { response?: any };
//       const payload = ae?.response?.data ?? null;
//       if (payload) {
//         const { fieldErrors, general } = extractServerErrors(payload);
//         if (Object.keys(fieldErrors).length) {
//           setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
//           focusFirstInvalidField(fieldErrors);
//           toast.error("Validation error — check fields");
//         }
//         if (general.length) {
//           setGeneralErrors(general);
//           general.forEach((g) => toast.error(g));
//         }
//       } else {
//         toast.error(message ?? "Failed to save inventory");
//       }

//       await fetchItems();
//     } finally {
//       setSaving(false);
//     }
//   }

//   function confirmDelete(item: Inventory) {
//     setDeleteTarget(item);
//   }

//   async function doDelete() {
//     if (!deleteTarget) return;
//     setDeleteLoading(true);
//     const id = deleteTarget.id;
//     const prev = items;
//     setItems((p) => p.filter((x) => String(x.id) !== String(id)));
//     try {
//       const res = await api.delete(`/admin/settings/stock-inventory/delete/${id}`);
//       const body = res.data ?? res;
//       if (body && body.status === false) {
//         const { general } = extractServerErrors(body);
//         if (general.length) general.forEach((g) => toast.error(g));
//         else toast.error(body.message ?? "Delete failed");
//         setItems(prev);
//       } else {
//         toast.success("Inventory deleted");
//       }
//     } catch (err: unknown) {
//       const { message } = formatAxiosError(err);
//       console.error("Delete inventory error:", { message, raw: err });
//       toast.error(message ?? "Failed to delete");
//       setItems(prev);
//     } finally {
//       setDeleteLoading(false);
//       setDeleteTarget(null);
//     }
//   }

//   async function handleRefresh() {
//     setRefreshing(true);
//     try {
//       await fetchItems();
//       await fetchProductsList();
//       await fetchVendorsList();
//       toast.success("Inventory, products & vendors refreshed");
//     } catch {
//       // inner functions already show toasts
//     } finally {
//       setRefreshing(false);
//     }
//   }

//   function updateField<K extends keyof FormState>(k: K, v: string) {
//     setForm((s) => ({ ...s, [k]: v }));
//     setFormErrors((fe) => ({ ...fe, [k]: undefined }));
//   }

//   return (
//     <div className="p-2 w-full mx-auto">
//       <Toaster position="top-right" />
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//         {/* <h2 className="text-2xl font-semibold text-slate-800">Inventory Management</h2> */}

//         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
//           <button
//             onClick={openAdd}
//             className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700 transition w-full sm:w-auto justify-center"
//             aria-label="Add inventory"
//           >
//             <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Inventory</span>
//             <span className="sm:hidden">Add</span>
//           </button>

//           <button
//             onClick={() => void handleRefresh()}
//             className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 transition w-full sm:w-auto justify-center"
//             aria-label="Refresh inventory"
//           >
//             <RefreshCw className="w-4 h-4" />
//             <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
//             <span className="sm:hidden">{refreshing ? "..." : "Ref"}</span>
//           </button>
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//         <div className="w-full overflow-x-auto hidden md:block">
//           <table className="w-full text-sm text-left min-w-[720px]">
//             <thead className="bg-slate-50">
//               <tr>
//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Product</th>
//                 <th className="px-4 py-3">Quantity</th>
//                 <th className="px-4 py-3">Type</th>
//                 <th className="px-4 py-3">Vendor</th>
//                 <th className="px-4 py-3">Note</th>
//                 <th className="px-4 py-3">When</th>
//                 <th className="px-4 py-3 w-44">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
//                     Loading…
//                   </td>
//                 </tr>
//               ) : items.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
//                     No inventory records.
//                   </td>
//                 </tr>
//               ) : (
//                 items.map((it) => (
//                   <tr key={String(it.id)} className="border-t hover:bg-slate-50 transition">
//                     <td className="px-4 py-3 align-top">
//                       <div className="text-xs text-slate-600 truncate" title={String(it.id)}>{String(it.id)}</div>
//                     </td>

//                     <td className="px-4 py-3 align-top">
//                       <div className="font-medium truncate max-w-xs" title={getProductName(it.product_id)}>{getProductName(it.product_id)}</div>
//                     </td>

//                     <td className="px-4 py-3 align-top">
//                       <div className="font-semibold">{it.quantity}</div>
//                     </td>

//                     <td className="px-4 py-3 align-top">
//                       <span className={`inline-block px-2 py-0.5 text-xs rounded ${it.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
//                         {it.type}
//                       </span>
//                     </td>

//                     <td className="px-4 py-3 align-top text-sm text-slate-600 truncate">{getVendorName(it.vendor_id)}</td>

//                     <td className="px-4 py-3 align-top text-sm text-slate-600 truncate max-w-[200px]" title={it.note ?? "-"}>{it.note ?? "-"}</td>

//                     <td className="px-4 py-3 align-top text-sm text-slate-600">
//                       {it.created_at ? new Date(String(it.created_at)).toLocaleString() : "-"}
//                     </td>

//                     <td className="px-4 py-3 align-top">
//                       <div className="flex flex-wrap gap-2">
//                         <button
//                           onClick={() => openEdit(it)}
//                           className="px-3 py-1 rounded border inline-flex items-center gap-2 hover:bg-slate-100 transition text-sm"
//                         >
//                           <Edit3 className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => confirmDelete(it)}
//                           className="px-3 py-1 rounded bg-red-600 text-white inline-flex items-center gap-2 hover:bg-red-700 transition text-sm"
//                         >
//                           <Trash2 className="w-4 h-4" /> 
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Mobile cards: visible on md and below */}
//         <div className="md:hidden p-4 grid gap-3">
//           {loading ? (
//             <div className="text-center text-slate-500">Loading…</div>
//           ) : items.length === 0 ? (
//             <div className="text-center text-slate-500">No inventory records.</div>
//           ) : (
//             items.map((it) => (
//               <div key={String(it.id)} className="border rounded-lg p-3 hover:bg-slate-50 transition">
//                 <div className="flex justify-between items-start gap-3">
//                   <div className="min-w-0">
//                     <div className="font-medium truncate" title={getProductName(it.product_id)}>Product: {getProductName(it.product_id)}</div>
//                     <div className="text-sm text-slate-600 mt-1 truncate">Type: {it.type}</div>
//                     <div className="text-sm text-slate-600 mt-1 truncate">Vendor: {getVendorName(it.vendor_id)}</div>
//                     <div className="text-sm text-slate-600 mt-1 truncate">Note: {it.note ?? "-"}</div>
//                   </div>

//                   <div className="text-right flex-shrink-0">
//                     <div className="text-lg font-semibold">{it.quantity}</div>
//                     <div className="text-xs text-slate-500 mt-1">{it.created_at ? new Date(String(it.created_at)).toLocaleString() : "-"}</div>
//                     <div className={`mt-2 inline-block px-2 py-0.5 text-xs rounded ${it.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
//                       {it.type}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-3 grid grid-cols-2 gap-2">
//                   <button onClick={() => openEdit(it)} className="flex-1 p-2 border rounded hover:bg-slate-100 inline-flex items-center justify-center gap-2 text-sm">
//                     <Edit3 className="w-4 h-4" /> Edit
//                   </button>
//                   <button onClick={() => confirmDelete(it)} className="flex-1 p-2 rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center justify-center gap-2 text-sm">
//                     <Trash2 className="w-4 h-4" /> Delete
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
//           <div className="relative bg-white w-full max-w-lg rounded-lg shadow-lg z-10">
//             <div className="flex items-center justify-between p-4 border-b">
//               <h3 className="text-lg font-medium">{editing ? "Edit Inventory" : "Add Inventory"}</h3>
//               <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100" aria-label="Close modal">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <form onSubmit={saveItem} className="p-4 space-y-4">
//               {generalErrors.length > 0 && (
//                 <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3">
//                   <div className="font-medium">Server returned errors:</div>
//                   <ul className="list-disc list-inside mt-1 text-sm">
//                     {generalErrors.map((g, idx) => (
//                       <li key={idx}>{g}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               <div>
//                 <label className="block text-sm font-medium mb-1">Product</label>
//                 <select
//                   ref={productRef}
//                   name="product_id"
//                   value={form.product_id}
//                   onChange={(e) => updateField("product_id", e.target.value)}
//                   className={`w-full p-2 border rounded ${formErrors.product_id ? "border-red-400" : ""}`}
//                 >
//                   <option value="">-- select product --</option>
//                        {productOptions.map((v, index) => {
//   return (
//     <option key={v.id} value={v.id}>
//       {v.raw?.name || "Unnamed Vendor"}
//     </option>
//   );
// })}

//                 </select>
//                 {productOptions.length === 0 ? (
//                   <div className="text-xs text-slate-500 mt-1">{productsLoading ? "Loading products…" : "No products available."}</div>
//                 ) : (
//                   <div className="text-xs text-slate-400 mt-1">Choose product by id (label shows id — name)</div>
//                 )}
//                 {formErrors.product_id && <div className="text-xs text-red-500 mt-1">{formErrors.product_id}</div>}
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Quantity</label>
//                   <input
//                     ref={quantityRef}
//                     name="quantity"
//                     value={form.quantity}
//                     onChange={(e) => updateField("quantity", e.target.value)}
//                     type="number"
//                     min="0"
//                     className={`w-full p-2 border rounded ${formErrors.quantity ? "border-red-400" : ""}`}
//                   />
//                   {formErrors.quantity && <div className="text-xs text-red-500 mt-1">{formErrors.quantity}</div>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Type</label>
//                   <select
//                     ref={typeRef}
//                     name="type"
//                     value={form.type}
//                     onChange={(e) => updateField("type", e.target.value)}
//                     className={`w-full p-2 border rounded ${formErrors.type ? "border-red-400" : ""}`}
//                   >
//                     <option value="in">In (stock in)</option>
//                     <option value="out">Out (stock out)</option>
//                   </select>
//                   {formErrors.type && <div className="text-xs text-red-500 mt-1">{formErrors.type}</div>}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Vendor</label>
//                 <select
//                   ref={vendorRef}
//                   name="vendor_id"
//                   value={form.vendor_id}
//                   onChange={(e) => updateField("vendor_id", e.target.value)}
//                   className="w-full p-2 border rounded"
//                 >
//                   <option value="">-- select vendor (optional) --</option>
//                     {vendorOptions.map((v, index) => {
//   return (
//     <option key={v.id} value={v.id}>
//       {v.raw?.name || "Unnamed Vendor"}
//     </option>
//   );
// })}


//                 </select>
//                 {vendorOptions.length === 0 ? (
//                   <div className="text-xs text-slate-500 mt-1">{vendorsLoading ? "Loading vendors…" : "No vendors available."}</div>
//                 ) : (
//                   <div className="text-xs text-slate-400 mt-1">Choose vendor by id (label shows id — name)</div>
//                 )}
//                 {formErrors.vendor_id && <div className="text-xs text-red-500 mt-1">{formErrors.vendor_id}</div>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Note</label>
//                 <textarea
//                   ref={noteRef}
//                   name="note"
//                   value={form.note}
//                   onChange={(e) => updateField("note", e.target.value)}
//                   className="w-full p-2 border rounded"
//                   rows={3}
//                 />
//                 {formErrors.note && <div className="text-xs text-red-500 mt-1">{formErrors.note}</div>}
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="px-4 py-2 rounded border hover:bg-slate-100">
//                   Cancel
//                 </button>
//                 <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
//                   {saving ? (editing ? "Saving…" : "Adding…") : editing ? "Save Changes" : "Add Inventory"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Delete confirm */}
//       {deleteTarget && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
//           <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10 p-5">
//             <h3 className="text-lg font-medium">Confirm delete</h3>
//             <p className="text-sm text-slate-600 mt-2">
//               Are you sure you want to delete this inventory record (product {getProductName(deleteTarget.product_id)})?
//             </p>
//             <div className="mt-4 flex justify-end gap-2">
//               <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="px-3 py-1 rounded border hover:bg-slate-100">Cancel</button>
//               <button onClick={() => void doDelete()} disabled={deleteLoading} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
//                 {deleteLoading ? "Deleting…" : "Yes, delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default InventoryManager;



// import React, { useEffect, useRef, useState } from "react";
// import { Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import api from "@/api/axios";
// import type { AxiosError } from "axios";

// type Inventory = {
//   id: string | number;
//   product_id: string | number;
//   quantity: number;
//   type: "in" | "out" | string;
//   vendor_id?: string | number | null;
//   note?: string | null;
//   created_at?: string | null;
//   updated_at?: string | null;
// };

// type FormState = {
//   product_id: string;
//   quantity: string;
//   type: string;
//   vendor_id: string;
//   note: string;
// };

// const defaultForm: FormState = { product_id: "", quantity: "0", type: "in", vendor_id: "", note: "" };

// /* ---------------------- Error helpers ---------------------- */
// function formatAxiosError(err: unknown) {
//   const fallback = { message: "An unknown error occurred", details: null as any, status: undefined as number | undefined };
//   try {
//     if (!err) return fallback;
//     const ae = err as AxiosError & { response?: any; request?: any };
//     if (ae && (ae.isAxiosError || ae.response || ae.request)) {
//       const status = ae.response?.status;
//       const data = ae.response?.data;
//       let message = ae.message || "Request failed";
//       if (data) {
//         if (typeof data === "string") message = data;
//         else if (data.message) message = data.message;
//         else if (data.error) message = data.error;
//         else if (data.errors && typeof data.errors === "string") message = data.errors;
//       }
//       return { message: String(message), details: data ?? ae.response ?? ae.request ?? ae.stack, status };
//     }
//     if (err instanceof Error) return { message: err.message, details: err.stack, status: undefined };
//     if (typeof err === "string") return { message: err, details: null, status: undefined };
//     return { message: "Unknown error", details: JSON.stringify(err), status: undefined };
//   } catch (e) {
//     return { message: "Error while parsing error", details: e, status: undefined };
//   }
// }

// function mapServerFieldToFormField(key: string): string | null {
//   if (!key) return null;
//   const k = key.toLowerCase();
//   if (k.includes("product")) return "product_id";
//   if (k.includes("qty") || k.includes("quantity")) return "quantity";
//   if (k.includes("type")) return "type";
//   if (k.includes("vendor")) return "vendor_id";
//   if (k.includes("note")) return "note";
//   const simple = ["product_id", "quantity", "type", "vendor_id", "note"];
//   if (simple.includes(k)) return k;
//   return null;
// }

// function extractServerErrors(payload: any): { fieldErrors: Record<string, string>; general: string[] } {
//   const fieldErrors: Record<string, string> = {};
//   const general: string[] = [];
//   if (!payload) return { fieldErrors, general };

//   const pushGeneral = (m: any) => {
//     if (m == null) return;
//     if (Array.isArray(m)) m.forEach((x) => pushGeneral(x));
//     else general.push(String(m));
//   };

//   if (payload.message) pushGeneral(payload.message);
//   if (Array.isArray(payload.messages)) pushGeneral(payload.messages);

//   if (payload.errors && typeof payload.errors === "object") {
//     Object.keys(payload.errors).forEach((k) => {
//       const v = payload.errors[k];
//       const mapped = mapServerFieldToFormField(k) ?? k;
//       if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
//       else fieldErrors[mapped] = String(v);
//     });
//   }

//   return { fieldErrors, general };
// }

// /* ------------------------- Inventory Component ------------------------- */
// const InventoryManager: React.FC = () => {
//   const [items, setItems] = useState<Inventory[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editing, setEditing] = useState<Inventory | null>(null);
//   const [form, setForm] = useState<FormState>(defaultForm);
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//   const [generalErrors, setGeneralErrors] = useState<string[]>([]);
//   const [saving, setSaving] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   const [products, setProducts] = useState<any[]>([]);
//   const [vendors, setVendors] = useState<any[]>([]);
//   const [productsLoading, setProductsLoading] = useState(false);
//   const [vendorsLoading, setVendorsLoading] = useState(false);

//   const productRef = useRef<HTMLSelectElement | null>(null);
//   const quantityRef = useRef<HTMLInputElement | null>(null);
//   const typeRef = useRef<HTMLSelectElement | null>(null);
//   const vendorRef = useRef<HTMLSelectElement | null>(null);
//   const noteRef = useRef<HTMLTextAreaElement | null>(null);

//   /* -------------------- Pagination -------------------- */
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10); // <-- default changed to 10

//   const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
//   const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
//   const goToPage = (p: number) => {
//     if (p < 1 || p > totalPages) return;
//     setCurrentPage(p);
//   };

//   /* -------------------- API helpers -------------------- */
//   async function fetchItems() {
//     setLoading(true);
//     try {
//       const res = await api.get("/admin/settings/stock-inventory/show");
//       const body = res.data;
//       const rows: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
//       setItems(rows);
//     } catch (err) {
//       const { message } = formatAxiosError(err);
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     void fetchItems();
//   }, []);

//   /* -------------------- UI Functions -------------------- */
//   function openAdd() {
//     setEditing(null);
//     setForm(defaultForm);
//     setModalOpen(true);
//   }

//   function confirmDelete(item: Inventory) {
//     setDeleteTarget(item);
//   }

//   async function doDelete() {
//     if (!deleteTarget) return;
//     setDeleteLoading(true);
//     try {
//       await api.delete(`/admin/settings/stock-inventory/delete/${deleteTarget.id}`);
//       setItems((p) => p.filter((x) => x.id !== deleteTarget.id));
//       toast.success("Deleted successfully");
//     } catch {
//       toast.error("Failed to delete");
//     } finally {
//       setDeleteTarget(null);
//       setDeleteLoading(false);
//     }
//   }

//   async function handleRefresh() {
//     setRefreshing(true);
//     await fetchItems();
//     toast.success("Refreshed");
//     setRefreshing(false);
//   }

//   /* -------------------- Render -------------------- */
//   return (
//     <div className="p-2 w-full mx-auto">
//       <Toaster position="top-right" />
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
//           <button
//             onClick={openAdd}
//             className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700 transition w-full sm:w-auto justify-center"
//           >
//             <Plus className="w-4 h-4" /> Add Inventory
//           </button>
//           <button
//             onClick={() => void handleRefresh()}
//             className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 transition w-full sm:w-auto justify-center"
//           >
//             <RefreshCw className="w-4 h-4" />
//             {refreshing ? "Refreshing..." : "Refresh"}
//           </button>
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//         <div className="w-full overflow-x-auto hidden md:block">
//           <table className="w-full text-sm text-left min-w-[720px]">
//             <thead className="bg-slate-50">
//               <tr>
//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Product</th>
//                 <th className="px-4 py-3">Quantity</th>
//                 <th className="px-4 py-3">Type</th>
//                 <th className="px-4 py-3">Vendor</th>
//                 <th className="px-4 py-3">Note</th>
//                 <th className="px-4 py-3">When</th>
//                 <th className="px-4 py-3 w-44">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Loading…</td></tr>
//               ) : paginatedItems.length === 0 ? (
//                 <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No inventory records.</td></tr>
//               ) : (
//                 paginatedItems.map((it) => (
//                   <tr key={String(it.id)} className="border-t hover:bg-slate-50 transition">
//                     <td className="px-4 py-3 text-xs text-slate-600">{it.id}</td>
//                     <td className="px-4 py-3">{it.product_id}</td>
//                     <td className="px-4 py-3 font-semibold">{it.quantity}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-0.5 text-xs rounded ${it.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{it.type}</span>
//                     </td>
//                     <td className="px-4 py-3">{it.vendor_id ?? "-"}</td>
//                     <td className="px-4 py-3">{it.note ?? "-"}</td>
//                     <td className="px-4 py-3 text-xs">{it.created_at ? new Date(it.created_at).toLocaleString() : "-"}</td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-2">
//                         <button onClick={() => setEditing(it)} className="px-3 py-1 rounded border hover:bg-slate-100">
//                           <Edit3 className="w-4 h-4" />
//                         </button>
//                         <button onClick={() => confirmDelete(it)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Controls */}
//         {items.length > 0 && (
//           <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-white">
//             <div className="text-sm text-slate-600">
//               Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>–
//               <span className="font-medium">{Math.min(currentPage * pageSize, items.length)}</span> of{" "}
//               <span className="font-medium">{items.length}</span>
//             </div>

//             <div className="flex items-center gap-2">
//               <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Prev</button>
//               <div className="flex items-center gap-1">
//                 {Array.from({ length: totalPages }).map((_, i) => (
//                   <button
//                     key={i}
//                     onClick={() => goToPage(i + 1)}
//                     className={`px-3 py-1 rounded border text-sm ${
//                       currentPage === i + 1 ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50"
//                     }`}
//                   >
//                     {i + 1}
//                   </button>
//                 ))}
//               </div>
//               <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Next</button>

//               <select
//                 value={pageSize}
//                 onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
//                 className="ml-2 border rounded px-2 py-1 text-sm"
//               >
//                 <option value={5}>5 / page</option>
//                 <option value={10}>10 / page</option>
//                 <option value={20}>20 / page</option>
//               </select>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Delete confirm */}
//       {deleteTarget && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
//           <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10 p-5">
//             <h3 className="text-lg font-medium">Confirm delete</h3>
//             <p className="text-sm text-slate-600 mt-2">
//               Are you sure you want to delete this record?
//             </p>
//             <div className="mt-4 flex justify-end gap-2">
//               <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="px-3 py-1 rounded border hover:bg-slate-100">Cancel</button>
//               <button onClick={() => void doDelete()} disabled={deleteLoading} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
//                 {deleteLoading ? "Deleting…" : "Yes, delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default InventoryManager;





import React, { useEffect, useRef, useState, useMemo } from "react";
import { Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/api/axios";
import type { AxiosError } from "axios";
type Inventory = {
  id: string | number;
  product_id: string | number;
  quantity: number;
  type: "in" | "out" | string;
  vendor_id?: string | number | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FormState = {
  product_id: string;
  quantity: string; // keep as string for input and convert when sending
  type: string;
  vendor_id: string;
  note: string;
};

const defaultForm: FormState = { product_id: "", quantity: "0", type: "in", vendor_id: "", note: "" };

/* ----------------------
   Error helpers (robust)
   ---------------------- */
function formatAxiosError(err: unknown) {
  const fallback = { message: "An unknown error occurred", details: null as any, status: undefined as number | undefined };
  try {
    if (!err) return fallback;
    const ae = err as AxiosError & { response?: any; request?: any };
    if (ae && (ae.isAxiosError || ae.response || ae.request)) {
      const status = ae.response?.status;
      const data = ae.response?.data;
      let message = ae.message || "Request failed";
      if (data) {
        if (typeof data === "string") message = data;
        else if (data.message) message = data.message;
        else if (data.error) message = data.error;
        else if (data.errors && typeof data.errors === "string") message = data.errors;
      }
      return { message: String(message), details: data ?? ae.response ?? ae.request ?? ae.stack, status };
    }
    if (err instanceof Error) return { message: err.message, details: err.stack, status: undefined };
    if (typeof err === "string") return { message: err, details: null, status: undefined };
    return { message: "Unknown error", details: JSON.stringify(err), status: undefined };
  } catch (e) {
    return { message: "Error while parsing error", details: e, status: undefined };
  }
}

/** Heuristic mapping from server field key to our form field name */
function mapServerFieldToFormField(key: string): string | null {
  if (!key) return null;
  const k = key.toLowerCase();
  if (k.includes("product")) return "product_id";
  if (k.includes("qty") || k.includes("quantity")) return "quantity";
  if (k.includes("type")) return "type";
  if (k.includes("vendor")) return "vendor_id";
  if (k.includes("note")) return "note";
  const simple = ["product_id", "quantity", "type", "vendor_id", "note"];
  if (simple.includes(k)) return k;
  return null;
}

/** Extracts field-level errors and general messages from many shapes */
function extractServerErrors(payload: any): { fieldErrors: Record<string, string>; general: string[] } {
  const fieldErrors: Record<string, string> = {};
  const general: string[] = [];
  if (!payload) return { fieldErrors, general };

  const pushGeneral = (m: any) => {
    if (m == null) return;
    if (Array.isArray(m)) m.forEach((x) => pushGeneral(x));
    else general.push(String(m));
  };

  if (payload.message) {
    pushGeneral(payload.message);
  }
  if (Array.isArray(payload.messages)) pushGeneral(payload.messages);

  if (payload.errors && typeof payload.errors === "object") {
    Object.keys(payload.errors).forEach((k) => {
      const v = payload.errors[k];
      const mapped = mapServerFieldToFormField(k) ?? k;
      if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
      else if (typeof v === "object") {
        try {
          const arr = Array.isArray(v) ? v : Object.values(v);
          if (arr.length) fieldErrors[mapped] = String(arr[0]);
          else fieldErrors[mapped] = String(JSON.stringify(v));
        } catch {
          fieldErrors[mapped] = String(v);
        }
      } else fieldErrors[mapped] = String(v);
    });
  }

  const maybe = payload.data ?? payload.error ?? null;
  if (maybe && typeof maybe === "object") {
    if (maybe.errors && typeof maybe.errors === "object") {
      Object.keys(maybe.errors).forEach((k) => {
        const v = maybe.errors[k];
        const mapped = mapServerFieldToFormField(k) ?? k;
        if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
        else fieldErrors[mapped] = String(v);
      });
    }
    if (maybe.validation && typeof maybe.validation === "object") {
      Object.keys(maybe.validation).forEach((k) => {
        const v = maybe.validation[k];
        const mapped = mapServerFieldToFormField(k) ?? k;
        if (Array.isArray(v)) fieldErrors[mapped] = String(v.join(", "));
        else fieldErrors[mapped] = String(v);
      });
    }
    if (maybe.message) pushGeneral(maybe.message);
    if (Array.isArray(maybe.messages)) pushGeneral(maybe.messages);
  }

  const possible = ["product_id", "product", "quantity", "qty", "type", "vendor", "vendor_id", "note"];
  for (const f of possible) {
    if (payload[f]) {
      const mapped = mapServerFieldToFormField(f) ?? f;
      if (!fieldErrors[mapped]) {
        if (Array.isArray(payload[f])) fieldErrors[mapped] = String(payload[f].join(", "));
        else fieldErrors[mapped] = String(payload[f]);
      }
    }
  }

  if (payload.status === false && general.length === 0 && Object.keys(fieldErrors).length === 0) {
    if (payload.error) pushGeneral(payload.error);
    else if (payload.message) pushGeneral(payload.message);
    else pushGeneral("Request failed");
  }

  const dedupGen = Array.from(new Set(general.map((s) => String(s).trim()).filter(Boolean)));
  return { fieldErrors, general: dedupGen };
}

/* -------------------------
   Inventory component
   ------------------------- */
const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // products & vendors for dropdown + name lookup
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // refs for focusing
  const productRef = useRef<HTMLSelectElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);
  const typeRef = useRef<HTMLSelectElement | null>(null);
  const vendorRef = useRef<HTMLSelectElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const FIELD_ORDER = ["product_id", "quantity", "type", "vendor_id", "note"];

  // --- PRODUCT & VENDOR ENDPOINTS --- //
  async function fetchProductsList() {
    setProductsLoading(true);
    try {
      const res = await api.get("/admin/products/show");
      const body = res.data;
      if (body && body.status === false) {
        const { general } = extractServerErrors(body);
        if (general.length) general.forEach((m) => toast.error(m));
        else toast.error(body.message ?? "Failed to load products");
        setProducts([]);
        return;
      }
      const rows: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.products)
        ? body.products
        : Array.isArray(body?.rows)
        ? body.rows
        : [];
      setProducts(rows);
    } catch (err: unknown) {
      const { message, status } = formatAxiosError(err);
      console.error("Failed to load products for dropdown:", err);
      if (status === 401) toast.error("Unauthorized while fetching products");
      else toast.error(message || "Failed to load products");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  async function fetchVendorsList() {
    setVendorsLoading(true);
    try {
      const res = await api.get("/admin/settings/vendors/show");
      const body = res.data;
      if (body && body.status === false) {
        const { general } = extractServerErrors(body);
        if (general.length) general.forEach((m) => toast.error(m));
        else toast.error(body.message ?? "Failed to load vendors");
        setVendors([]);
        return;
      }
      const rows: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.vendors)
        ? body.vendors
        : Array.isArray(body?.rows)
        ? body.rows
        : [];
      setVendors(rows);
    } catch (err: unknown) {
      const { message, status } = formatAxiosError(err);
      console.error("Failed to load vendors for dropdown:", err);
      if (status === 401) toast.error("Unauthorized while fetching vendors");
      else toast.error(message || "Failed to load vendors");
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }

  // normalized options used in dropdowns
  const productOptions = products
    .map((p) => {
      const id = p?.id ?? p?._id ?? p?.product_id ?? p?.productId ?? "";
      const name = p?.name ?? p?.title ?? "";
      if (id === null || id === undefined || id === "") return null;
      return { id: String(id), label: name ? `${id} — ${name}` : String(id), raw: p };
    })
    .filter(Boolean) as { id: string; label: string; raw: any }[];

  const vendorOptions = vendors
    .map((v) => {
      const id = v?.id ?? v?._id ?? v?.vendor_id ?? v?.vendorId ?? "";
      const name = v?.name ?? v?.title ?? v?.company ?? "";
      if (id === null || id === undefined || id === "") return null;
      return { id: String(id), label: name ? `${id} — ${name}` : String(id), raw: v };
    })
    .filter(Boolean) as { id: string; label: string; raw: any }[];

  function getProductName(productId: string | number | undefined | null) {
    if (productId === null || productId === undefined || productId === "") return "-";
    const pid = String(productId);
    const found = productOptions.find((p) => p.id === pid);
    if (found) return found.raw?.name ?? found.raw?.title ?? String(pid);
    const fallback = products.find((p) => String(p?.id ?? p?._id ?? p?.product_id ?? p?.productId) === pid);
    if (fallback) return fallback?.name ?? fallback?.title ?? pid;
    return String(pid);
  }

  function getVendorName(vendorId: string | number | undefined | null) {
    if (vendorId === null || vendorId === undefined || vendorId === "") return "-";
    const vid = String(vendorId);
    const found = vendorOptions.find((v) => v.id === vid);
    if (found) return found.raw?.name ?? found.raw?.title ?? found.raw?.company ?? String(vid);
    const fallback = vendors.find((v) => String(v?.id ?? v?._id ?? v?.vendor_id ?? v?.vendorId) === vid);
    if (fallback) return fallback?.name ?? fallback?.title ?? fallback?.company ?? vid;
    return String(vid);
  }

  // --- Inventory API helpers --- //
  async function fetchItems() {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings/stock-inventory/show");
      const body = res.data;
      if (body && body.status === false) {
        const { general } = extractServerErrors(body);
        if (general.length) general.forEach((m) => toast.error(m));
        else toast.error(body.message ?? "Failed to load inventory");
        setItems([]);
        return;
      }
      const rows: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.inventory)
        ? body.inventory
        : Array.isArray(body?.items)
        ? body.items
        : [];
      setItems(rows.map((r: any) => normalizeInventory(r)));
    } catch (err: unknown) {
      const { message, status } = formatAxiosError(err);
      console.error("Failed to load inventory:", err);
      if (status === 401) toast.error("Unauthorized — please login.");
      else toast.error(message || "Failed to load inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function normalizeInventory(raw: any): Inventory {
    return {
      id: raw.id ?? raw._id ?? raw.inventory_id ?? raw.inventoryId ?? String(Date.now()) + Math.random(),
      product_id: raw.product_id ?? raw.productId ?? raw.product ?? raw?.item_id ?? raw?.sku ?? "",
      quantity: Number(raw.quantity ?? raw.qty ?? 0),
      type: raw.type ?? "in",
      vendor_id: raw.vendor_id ?? raw.vendorId ?? raw.vendor ?? null,
      note: raw.note ?? raw.notes ?? null,
      created_at: raw.created_at ?? raw.createdAt ?? null,
      updated_at: raw.updated_at ?? raw.updatedAt ?? null,
    };
  }

  useEffect(() => {
    void fetchProductsList();
    void fetchVendorsList();
    void fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setGeneralErrors([]);
    setModalOpen(true);
    if (!products.length) void fetchProductsList();
    if (!vendors.length) void fetchVendorsList();
    setTimeout(() => productRef.current?.focus(), 80);
  }

  function openEdit(it: Inventory) {
    setEditing(it);
    setForm({
      product_id: String(it.product_id ?? ""),
      quantity: String(it.quantity ?? 0),
      type: String(it.type ?? "in"),
      vendor_id: String(it.vendor_id ?? ""),
      note: String(it.note ?? ""),
    });
    setFormErrors({});
    setGeneralErrors([]);
    setModalOpen(true);
    setTimeout(() => productRef.current?.focus(), 80);
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!form.product_id.trim()) e.product_id = "Product is required";
    if (form.quantity === "" || Number.isNaN(Number(form.quantity))) e.quantity = "Quantity is required and must be a number";
    else if (Number(form.quantity) <= 0) e.quantity = "Quantity must be > 0";
    if (!form.type.trim()) e.type = "Type is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function focusFirstInvalidField(fieldErrs: Record<string, string>) {
    for (const f of FIELD_ORDER) {
      if (fieldErrs[f]) {
        if (f === "product_id") productRef.current?.focus();
        else if (f === "quantity") quantityRef.current?.focus();
        else if (f === "type") typeRef.current?.focus();
        else if (f === "vendor_id") vendorRef.current?.focus();
        else if (f === "note") noteRef.current?.focus();
        break;
      }
    }
  }

  async function saveItem(e?: React.FormEvent) {
    e?.preventDefault();
    setFormErrors({});
    setGeneralErrors([]);

    if (!validateForm()) {
      toast.error("Fix validation errors");
      focusFirstInvalidField(formErrors);
      return;
    }
    setSaving(true);

    try {
      const payload = {
        product_id: form.product_id,
        quantity: Number(form.quantity),
        type: form.type,
        vendor_id: form.vendor_id || null,
        note: form.note || null,
      };

      if (editing) {
        const updatedCandidate: Inventory = { ...editing, ...payload, quantity: Number(payload.quantity) };
        setItems((p) => p.map((it) => (String(it.id) === String(editing.id) ? updatedCandidate : it)));
        setModalOpen(false);

        const res = await api.post(`/admin/settings/stock-inventory/update/${editing.id}`, payload);
        const body = res.data ?? res;
        if (body && body.status === false) {
          const { fieldErrors, general } = extractServerErrors(body);
          if (Object.keys(fieldErrors).length) {
            setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
            focusFirstInvalidField(fieldErrors);
            toast.error("Validation errors received from server");
          }
          if (general.length) {
            setGeneralErrors(general);
            general.forEach((m) => toast.error(m));
          }
          await fetchItems();
          setSaving(false);
          return;
        }

        const raw = body?.data ?? body?.inventory ?? body ?? null;
        const updated = raw ? normalizeInventory(raw) : updatedCandidate;
        setItems((p) => p.map((it) => (String(it.id) === String(editing.id) ? updated : it)));
        toast.success("Inventory updated");
      } else {
        const tmpId = `tmp-${Date.now()}`;
        const optimistic: Inventory = {
          id: tmpId,
          product_id: payload.product_id,
          quantity: Number(payload.quantity),
          type: payload.type,
          vendor_id: payload.vendor_id,
          note: payload.note,
        };
        setItems((p) => [optimistic, ...p]);
        setModalOpen(false);

        const res = await api.post("/admin/settings/stock-inventory/add", payload);
        const body = res.data ?? res;
        if (body && body.status === false) {
          const { fieldErrors, general } = extractServerErrors(body);
          if (Object.keys(fieldErrors).length) {
            setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
            focusFirstInvalidField(fieldErrors);
            toast.error("Validation errors received from server");
          }
          if (general.length) {
            setGeneralErrors(general);
            general.forEach((m) => toast.error(m));
          }
          await fetchItems();
          setSaving(false);
          return;
        }

        const raw = body?.data ?? body?.inventory ?? body ?? null;
        const created = raw ? normalizeInventory(raw) : { ...optimistic, id: body?.id ?? tmpId };
        setItems((p) => [created, ...p.filter((x) => x.id !== tmpId)]);
        toast.success("Inventory added");
      }

      setEditing(null);
      setForm(defaultForm);
      setFormErrors({});
      setGeneralErrors([]);
    } catch (err: unknown) {
      const { message, details, status } = formatAxiosError(err);
      console.error("Save inventory error:", { message, status, details, raw: err });

      const ae = err as AxiosError & { response?: any };
      const payload = ae?.response?.data ?? null;
      if (payload) {
        const { fieldErrors, general } = extractServerErrors(payload);
        if (Object.keys(fieldErrors).length) {
          setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
          focusFirstInvalidField(fieldErrors);
          toast.error("Validation error — check fields");
        }
        if (general.length) {
          setGeneralErrors(general);
          general.forEach((g) => toast.error(g));
        }
      } else {
        toast.error(message ?? "Failed to save inventory");
      }

      await fetchItems();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: Inventory) {
    setDeleteTarget(item);
  }

  async function doDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const id = deleteTarget.id;
    const prev = items;
    setItems((p) => p.filter((x) => String(x.id) !== String(id)));
    try {
      const res = await api.delete(`/admin/settings/stock-inventory/delete/${id}`);
      const body = res.data ?? res;
      if (body && body.status === false) {
        const { general } = extractServerErrors(body);
        if (general.length) general.forEach((g) => toast.error(g));
        else toast.error(body.message ?? "Delete failed");
        setItems(prev);
      } else {
        toast.success("Inventory deleted");
      }
    } catch (err: unknown) {
      const { message } = formatAxiosError(err);
      console.error("Delete inventory error:", { message, raw: err });
      toast.error(message ?? "Failed to delete");
      setItems(prev);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchItems();
      await fetchProductsList();
      await fetchVendorsList();
      toast.success("Inventory, products & vendors refreshed");
    } catch {
      // inner functions already show toasts
    } finally {
      setRefreshing(false);
    }
  }

  function updateField<K extends keyof FormState>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
    setFormErrors((fe) => ({ ...fe, [k]: undefined }));
  }

  /* ---------------------------
       PAGINATION (added)
     --------------------------- */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // total pages derived from items length
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // ensure currentPage within bounds when items/pageSize change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  // memoized paginated slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // helper: returns an array of page numbers with smart ellipsis
  function getPageRange(page: number, total: number, delta = 2) {
    const range: (number | "...")[] = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(total, page + delta);
    if (left > 1) range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("...");
    if (right < total) range.push(total);
    return range;
  }

  return (
    <div className="p-2 w-full mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* <h2 className="text-2xl font-semibold text-slate-800">Inventory Management</h2> */}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700 transition w-full sm:w-auto justify-center"
            aria-label="Add inventory"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Inventory</span>
            <span className="sm:hidden">Add</span>
          </button>

          <button
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 transition w-full sm:w-auto justify-center"
            aria-label="Refresh inventory"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            <span className="sm:hidden">{refreshing ? "..." : "Ref"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="w-full overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3 w-44">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No inventory records.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((it) => (
                  <tr key={String(it.id)} className="border-t hover:bg-slate-50 transition">
                    <td className="px-4 py-3 align-top">
                      <div className="text-xs text-slate-600 truncate" title={String(it.id)}>{String(it.id)}</div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="font-medium truncate max-w-xs" title={getProductName(it.product_id)}>{getProductName(it.product_id)}</div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold">{it.quantity}</div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${it.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {it.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top text-sm text-slate-600 truncate">{getVendorName(it.vendor_id)}</td>

                    <td className="px-4 py-3 align-top text-sm text-slate-600 truncate max-w-[200px]" title={it.note ?? "-"}>{it.note ?? "-"}</td>

                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {it.created_at ? new Date(String(it.created_at)).toLocaleString() : "-"}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEdit(it)}
                          className="px-3 py-1 rounded border inline-flex items-center gap-2 hover:bg-slate-100 transition text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(it)}
                          className="px-3 py-1 rounded bg-red-600 text-white inline-flex items-center gap-2 hover:bg-red-700 transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" /> 
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards: visible on md and below */}
        <div className="md:hidden p-4 grid gap-3">
          {loading ? (
            <div className="text-center text-slate-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-center text-slate-500">No inventory records.</div>
          ) : (
            // use paginatedItems here as well for consistent paging on mobile
            paginatedItems.map((it) => (
              <div key={String(it.id)} className="border rounded-lg p-3 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={getProductName(it.product_id)}>Product: {getProductName(it.product_id)}</div>
                    <div className="text-sm text-slate-600 mt-1 truncate">Type: {it.type}</div>
                    <div className="text-sm text-slate-600 mt-1 truncate">Vendor: {getVendorName(it.vendor_id)}</div>
                    <div className="text-sm text-slate-600 mt-1 truncate">Note: {it.note ?? "-"}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-semibold">{it.quantity}</div>
                    <div className="text-xs text-slate-500 mt-1">{it.created_at ? new Date(String(it.created_at)).toLocaleString() : "-"}</div>
                    <div className={`mt-2 inline-block px-2 py-0.5 text-xs rounded ${it.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {it.type}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => openEdit(it)} className="flex-1 p-2 border rounded hover:bg-slate-100 inline-flex items-center justify-center gap-2 text-sm">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => confirmDelete(it)} className="flex-1 p-2 rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center justify-center gap-2 text-sm">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ------- Pagination Controls (Tailwind styled) ------- */}
        <div className="px-4 py-3 border-t bg-white flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium">{items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>–
            <span className="font-medium">{Math.min(currentPage * pageSize, items.length)}</span> of{" "}
            <span className="font-medium">{items.length}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                aria-label="Previous page"
              >
                Prev
              </button>

              {/* page numbers with ellipsis */}
              <nav aria-label="Pagination" className="flex items-center gap-1">
                {getPageRange(currentPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-3 py-1 text-sm text-slate-500">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(Number(p))}
                      className={`px-3 py-1 rounded border text-sm ${currentPage === p ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50"}`}
                      aria-current={currentPage === p ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </nav>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>

            {/* page size selector (always visible) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Per page</label>
              <select
                className="border px-2 py-1 rounded text-sm"
                value={pageSize}
                onChange={(e) => {
                  const v = Number(e.target.value) || 10;
                  setPageSize(v);
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">{editing ? "Edit Inventory" : "Add Inventory"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100" aria-label="Close modal">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveItem} className="p-4 space-y-4">
              {generalErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3">
                  <div className="font-medium">Server returned errors:</div>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {generalErrors.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select
                  ref={productRef}
                  name="product_id"
                  value={form.product_id}
                  onChange={(e) => updateField("product_id", e.target.value)}
                  className={`w-full p-2 border rounded ${formErrors.product_id ? "border-red-400" : ""}`}
                >
                  <option value="">-- select product --</option>
                  {productOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.raw?.name || v.label}
                    </option>
                  ))}
                </select>
                {productOptions.length === 0 ? (
                  <div className="text-xs text-slate-500 mt-1">{productsLoading ? "Loading products…" : "No products available."}</div>
                ) : (
                  <div className="text-xs text-slate-400 mt-1">Choose product by id (label shows id — name)</div>
                )}
                {formErrors.product_id && <div className="text-xs text-red-500 mt-1">{formErrors.product_id}</div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    ref={quantityRef}
                    name="quantity"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    type="number"
                    min="0"
                    className={`w-full p-2 border rounded ${formErrors.quantity ? "border-red-400" : ""}`}
                  />
                  {formErrors.quantity && <div className="text-xs text-red-500 mt-1">{formErrors.quantity}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    ref={typeRef}
                    name="type"
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className={`w-full p-2 border rounded ${formErrors.type ? "border-red-400" : ""}`}
                  >
                    <option value="in">In (stock in)</option>
                    <option value="out">Out (stock out)</option>
                  </select>
                  {formErrors.type && <div className="text-xs text-red-500 mt-1">{formErrors.type}</div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <select
                  ref={vendorRef}
                  name="vendor_id"
                  value={form.vendor_id}
                  onChange={(e) => updateField("vendor_id", e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- select vendor (optional) --</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.raw?.name || v.label}
                    </option>
                  ))}
                </select>
                {vendorOptions.length === 0 ? (
                  <div className="text-xs text-slate-500 mt-1">{vendorsLoading ? "Loading vendors…" : "No vendors available."}</div>
                ) : (
                  <div className="text-xs text-slate-400 mt-1">Choose vendor by id (label shows id — name)</div>
                )}
                {formErrors.vendor_id && <div className="text-xs text-red-500 mt-1">{formErrors.vendor_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  ref={noteRef}
                  name="note"
                  value={form.note}
                  onChange={(e) => updateField("note", e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                {formErrors.note && <div className="text-xs text-red-500 mt-1">{formErrors.note}</div>}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="px-4 py-2 rounded border hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
                  {saving ? (editing ? "Saving…" : "Adding…") : editing ? "Save Changes" : "Add Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10 p-5">
            <h3 className="text-lg font-medium">Confirm delete</h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to delete this inventory record (product {getProductName(deleteTarget.product_id)})?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="px-3 py-1 rounded border hover:bg-slate-100">Cancel</button>
              <button onClick={() => void doDelete()} disabled={deleteLoading} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
