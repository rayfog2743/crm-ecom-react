
// import React, { useEffect, useRef, useState } from "react";
// import { Plus, X, Edit2, Trash2, Search as SearchIcon } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import api from "../../src/api/axios";

// const SAMPLE_IMG = "/mnt/data/54197a23-6bd1-4ec0-9e69-8d2be56a0782.png";
// const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// type CategoryItem = {
//   id: string | number;
//   category: string;
//   image_url?: string; // absolute URL to show in UI (preferred)
//   image?: string; // raw/relative if present
//   createdAt?: string | null;
//   productCount?: number;
// };

// function unsplashForCategory(cat?: string, size = "600x400") {
//   const keyword = (cat || "grocery").split(" ").slice(0, 3).join(",");
//   return `https://source.unsplash.com/featured/${size}/?${encodeURIComponent(keyword)}`;
// }

// function readPagination(metaLike: any) {
//   const out = {
//     total: Number(metaLike?.total ?? metaLike?.count ?? metaLike?.records ?? metaLike?.totalRecords ?? 0),
//     per_page: Number(metaLike?.per_page ?? metaLike?.perPage ?? metaLike?.limit ?? metaLike?.pageSize ?? 10),
//     current_page: Number(metaLike?.current_page ?? metaLike?.page ?? metaLike?.currentPage ?? 1),
//     last_page: Number(metaLike?.last_page ?? metaLike?.total_pages ?? Math.ceil((metaLike?.total ?? 0) / (metaLike?.per_page ?? 10))),
//   };
//   out.per_page = out.per_page > 0 ? out.per_page : 10;
//   out.current_page = out.current_page >= 1 ? out.current_page : 1;
//   out.last_page = out.last_page >= 1 ? out.last_page : 1;
//   return out;
// }

// export default function CategoriesShowcase(): JSX.Element {
//   const [categories, setCategories] = useState<CategoryItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [catForm, setCatForm] = useState<{ category: string; imagePreview?: string }>({ category: "", imagePreview: "" });
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [editingId, setEditingId] = useState<string | number | null>(null);

//   const [query, setQuery] = useState("");
//   const [page, setPage] = useState<number>(1);
//   const [perPage, setPerPage] = useState<number>(12);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [totalItems, setTotalItems] = useState<number>(0);

//   const normalizeRow = (r: any, i = 0): CategoryItem => {
//     const rawCount = r.products_count ?? r.count ?? r.productsCount ?? 0;
//     const parsedCount = typeof rawCount === "string" ? Number(rawCount || 0) : Number(rawCount ?? 0);

//     let resolvedImage: string | undefined = undefined;
//     if (r.image_url && String(r.image_url).trim()) {
//       resolvedImage = String(r.image_url).trim();
//     } else if (r.imageUrl && String(r.imageUrl).trim()) {
//       resolvedImage = String(r.imageUrl).trim();
//     } else if (r.image && String(r.image).trim()) {
//       const raw = String(r.image).trim();
//       if (/^https?:\/\//i.test(raw)) {
//         resolvedImage = raw;
//       } else {
//         try {
//           const baseCandidate = String((api && (api as any).defaults && (api as any).defaults.baseURL) || window.location.origin);
//           const base = baseCandidate.endsWith("/") ? baseCandidate : baseCandidate + "/";
//           resolvedImage = new URL(raw.replace(/^\/+/, ""), base).toString();
//         } catch {
//           try {
//             resolvedImage = `${window.location.origin}/storage/${raw.replace(/^\/+/, "")}`;
//           } catch {
//             resolvedImage = undefined;
//           }
//         }
//       }
//     }

//     const finalImage = resolvedImage ?? (r.name ? unsplashForCategory(r.name) : undefined) ?? SAMPLE_IMG;

//     return {
//       id: r.id ?? r._id ?? r.categoryId ?? `srv-${i}`,
//       category: (r.name ?? r.category ?? r.title ?? `Category ${i + 1}`).toString(),
//       image_url: finalImage,
//       image: r.image ?? undefined,
//       createdAt: r.created_at ?? r.createdAt ?? null,
//       productCount: Number.isFinite(parsedCount) ? parsedCount : 0,
//     };
//   };

//   const fetchCategories = async (opts?: { q?: string; page?: number; per_page?: number }) => {
//     setLoading(true);
//     try {
//       const params: any = {};
//       if (opts?.q) params.q = opts.q;
//       if (opts?.page) params.page = opts.page;
//       if (opts?.per_page) params.per_page = opts.per_page;

//       const res = await api.get("/admin/categories/show", { params });
//       const body = res?.data ?? null;

//       let rows: any[] = [];
//       if (Array.isArray(body)) rows = body;
//       else if (Array.isArray(body.data)) rows = body.data;
//       else if (Array.isArray(body.rows)) rows = body.rows;
//       else if (Array.isArray(body.categories)) rows = body.categories;
//       else {
//         const arr = Object.values(body || {}).find((v) => Array.isArray(v));
//         if (Array.isArray(arr)) rows = arr as any[];
//       }

//       const normalized = rows.map((r, i) => normalizeRow(r, i));
//       setCategories(normalized);

//       const metaCandidate = body?.meta ?? body?.pagination ?? body?.pagination_data ?? body;
//       const { total, per_page, current_page, last_page } = readPagination(metaCandidate ?? {});
//       setTotalItems(Number.isFinite(total) ? total : normalized.length);
//       setPerPage(per_page > 0 ? per_page : opts?.per_page ?? perPage);
//       setPage(current_page >= 1 ? current_page : opts?.page ?? 1);
//       setTotalPages(last_page >= 1 ? last_page : Math.max(1, Math.ceil((total || normalized.length) / (per_page || perPage))));
//     } catch (err: any) {
//       console.error("fetchCategories error:", err);
//       const serverMsg = err?.response?.data?.message ?? err?.message ?? "Network error while loading categories.";
//       toast.error(serverMsg);
//       setCategories([]);
//       setTotalItems(0);
//       setTotalPages(1);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void fetchCategories({ q: "", page: 1, per_page: perPage });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] ?? null;
//     if (!file) {
//       setSelectedFile(null);
//       setCatForm((p) => ({ ...p, imagePreview: "" }));
//       return;
//     }
//     if (!file.type || !file.type.startsWith("image/")) {
//       toast.error("Selected file is not an image. Please choose a valid image file.");
//       if (fileRef.current) fileRef.current.value = "";
//       setSelectedFile(null);
//       setCatForm((p) => ({ ...p, imagePreview: "" }));
//       return;
//     }
//     if (file.size > MAX_IMAGE_BYTES) {
//       toast.error("Image too large (max 5MB). Please select a smaller file.");
//       if (fileRef.current) fileRef.current.value = "";
//       setSelectedFile(null);
//       setCatForm((p) => ({ ...p, imagePreview: "" }));
//       return;
//     }
//     setSelectedFile(file);
//     const reader = new FileReader();
//     reader.onload = () => setCatForm((p) => ({ ...p, imagePreview: String(reader.result) }));
//     reader.readAsDataURL(file);
//   };

//   const fetchSingle = async (id: string | number) => {
//     try {
//       const res = await api.get(`/admin/categories/show/${id}`);
//       const body = res?.data ?? null;
//       const item = body?.data ?? body?.category ?? body ?? null;
//       return item ? normalizeRow(item) : null;
//     } catch (err: any) {
//       const msg = err?.response?.data?.message ?? err?.message ?? `Failed to fetch item`;
//       throw new Error(msg);
//     }
//   };

//   const createCategory = async (payload: { name: string; file?: File | null }) => {
//     try {
//       const fd = new FormData();
//       fd.append("name", payload.name);
//       if (payload.file) fd.append("image", payload.file, payload.file.name);
//       const res = await api.post("/admin/categories/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
//       const body = res?.data ?? null;
//       const serverItem = body?.data ?? body?.category ?? body ?? null;
//       return serverItem ? normalizeRow(serverItem) : null;
//     } catch (err: any) {
//       const msg = err?.response?.data?.message ?? err?.message ?? "Create failed";
//       throw new Error(msg);
//     }
//   };

//   const updateCategory = async (id: string | number, payload: { name: string; file?: File | null }) => {
//     try {
//       const fd = new FormData();
//       fd.append("name", payload.name);
//       fd.append("_method", "POST");
//       if (payload.file) fd.append("image", payload.file, payload.file.name);
//       const res = await api.post(`/admin/categories/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
//       const body = res?.data ?? null;
//       const serverItem = body?.data ?? body?.category ?? body ?? null;
//       return serverItem ? normalizeRow(serverItem) : null;
//     } catch (err: any) {
//       const msg = err?.response?.data?.message ?? err?.message ?? "Update failed";
//       throw new Error(msg);
//     }
//   };

//   const deleteCategoryReq = async (id: string | number) => {
//     try {
//       await api.delete(`/admin/categories/delete/${id}`);
//       return true;
//     } catch (err: any) {
//       const msg = err?.response?.data?.message ?? err?.message ?? "Delete failed";
//       throw new Error(msg);
//     }
//   };

//   const openCreate = () => {
//     setEditingId(null);
//     setCatForm({ category: "", imagePreview: "" });
//     setSelectedFile(null);
//     if (fileRef.current) fileRef.current.value = "";
//     setDrawerOpen(true);
//   };

//   const openEdit = async (item: CategoryItem) => {
//     setEditingId(item.id);
//     setSelectedFile(null);
//     if (fileRef.current) fileRef.current.value = "";
//     try {
//       const server = await fetchSingle(item.id);
//       setCatForm({ category: server?.category ?? item.category, imagePreview: server?.image_url ?? item.image_url ?? "" });
//     } catch {
//       setCatForm({ category: item.category, imagePreview: item.image_url ?? item.image ?? "" });
//     }
//     setDrawerOpen(true);
//   };

//   const prettyDate = (iso?: string | null) => {
//     if (!iso) return "";
//     try {
//       const d = new Date(iso);
//       if (Number.isNaN(d.getTime())) return iso;
//       return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(d);
//     } catch {
//       return iso;
//     }
//   };

//   const handleSubmit = async (ev?: React.FormEvent) => {
//     ev?.preventDefault();
//     if (!catForm.category.trim()) {
//       toast.error("Please enter a category name.");
//       return;
//     }
//     if (!editingId && !selectedFile) {
//       toast.error("Please select an image for the new category (max 5MB).");
//       return;
//     }
//     setSubmitting(true);
//     const payload = { name: catForm.category.trim(), file: selectedFile };
//     try {
//       if (editingId) {
//         await updateCategory(editingId, payload);
//         toast.success("Category updated");
//       } else {
//         await createCategory(payload);
//         toast.success("Category created");
//       }
//       await fetchCategories({ q: query, page: 1, per_page: perPage });
//       setDrawerOpen(false);
//       setCatForm({ category: "", imagePreview: "" });
//       setSelectedFile(null);
//       if (fileRef.current) fileRef.current.value = "";
//     } catch (err: any) {
//       console.error("submit error:", err);
//       const serverMsg = err?.message ?? "Failed to save category";
//       toast.error(serverMsg);
//     } finally {
//       setSubmitting(false);
//       setEditingId(null);
//     }
//   };

//   const handleDelete = async (id: string | number) => {
//     const confirmed = window.confirm("Delete this category? This action cannot be undone.");
//     if (!confirmed) return;
//     const prev = categories;
//     setCategories((p) => p.filter((c) => String(c.id) !== String(id)));
//     try {
//       await deleteCategoryReq(id);
//       toast.success("Category deleted");
//       await fetchCategories({ q: query, page, per_page: perPage });
//     } catch (err: any) {
//       console.error("delete error:", err);
//       setCategories(prev);
//       const serverMsg = err?.message ?? "Failed to delete category";
//       toast.error(serverMsg);
//     }
//   };

//   const doSearch = async () => {
//     setPage(1);
//     await fetchCategories({ q: query, page: 1, per_page: perPage });
//   };

//   const goToPage = async (p: number) => {
//     const newPage = Math.max(1, Math.min(p, totalPages));
//     setPage(newPage);
//     await fetchCategories({ q: query, page: newPage, per_page: perPage });
//   };

//   const renderPageNumbers = () => {
//     const pages = [];
//     const maxButtons = 7;
//     let start = Math.max(1, page - Math.floor(maxButtons / 2));
//     let end = start + maxButtons - 1;
//     if (end > totalPages) {
//       end = totalPages;
//       start = Math.max(1, end - maxButtons + 1);
//     }
//     for (let p = start; p <= end; p++) pages.push(p);
//     return pages;
//   };

//   useEffect(() => {
//     setTotalPages(Math.max(1, Math.ceil(totalItems / perPage)));
//   }, [totalItems, perPage]);

//   return (
//     <div className="p-6">
//       <Toaster position="top-right" />

//       {/* header: three columns layout so search sits centered */}
//       <div className="grid grid-cols-3 items-center gap-4 mb-6">
//         {/* left: title */}
//         <div className="col-span-1">
//           <h1 className="text-2xl font-semibold text-slate-800">Categories</h1>
//         </div>

//         {/* center: search - centered */}
//         {/* <div className="col-span-1 flex justify-center">
//           <div className="flex items-center gap-2">
//             <div className="relative">
//               <input
//                 type="search"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search categories..."
//                 className="pl-9 pr-3 py-2 rounded border w-80"
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     e.preventDefault();
//                     void doSearch();
//                   }
//                 }}
//               />
//               <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//             </div>
//             <button onClick={() => void doSearch()} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
//               Search
//             </button>
//           </div>
//         </div> */}

//         {/* right: actions */}
//         <div className="col-span-1 flex justify-end items-center gap-3">
//           <button onClick={openCreate} className="bg-chart-primary hover:bg-chart-primary/90 flex items-center py-2 px-4 rounded-md shadow-sm" title="Add Category">
//             Add Category
//           </button>
//         </div>
//       </div>

//       {/* Grid */}
//       <div className="mb-6">
//         {loading ? (
//           <div className="flex flex-wrap gap-6">
//             {[1, 2, 3, 4, 5].map((n) => (
//               <div key={n} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 animate-pulse">
//                 <div className="w-full h-40 rounded-full bg-slate-200 mb-3" />
//                 <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
//                 <div className="h-3 w-1/3 bg-slate-200 rounded" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <div className="text-sm text-slate-500">No categories yet.</div>
//         ) : (
//           <>
//             <div className="flex flex-wrap gap-8">
//               {categories.map((c) => (
//                 <div key={String(c.id)} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex flex-col items-center text-center">
//                   <div className="w-36 h-36 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center" style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
//                     {c.image_url ? (
//                       <img
//                         src={c.image_url}
//                         alt={c.category}
//                         className="w-full h-full object-cover"
//                         loading="lazy"
//                         onError={(e) => {
//                           const img = e.currentTarget as HTMLImageElement;
//                           if (img.dataset.fallback) return;
//                           img.dataset.fallback = "true";
//                           img.src = unsplashForCategory(c.category, "600x400");
//                         }}
//                       />
//                     ) : (
//                       <img src={unsplashForCategory(c.category, "600x400")} alt={c.category} className="w-full h-full object-cover" loading="lazy" />
//                     )}
//                   </div>

//                   <div className="mt-4 px-2 w-full">
//                     <div className="text-green-800 font-semibold text-lg leading-tight">{c.category}</div>
//                     <div className="text-sm text-slate-500 mt-1">
//                       {(typeof c.productCount === "number" ? c.productCount : 0) + (c.productCount === 1 ? " Product" : " Products")}
//                     </div>
//                     {c.createdAt ? <div className="text-xs text-slate-400 mt-1">Created {prettyDate(c.createdAt)}</div> : null}

//                     <div className="mt-3 flex items-center justify-center gap-3">
//                       <button onClick={() => openEdit(c)} aria-label={`Edit ${c.category}`} title="Edit" className="flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
//                         <Edit2 className="w-4 h-4" />
//                         <span className="text-sm">Edit</span>
//                       </button>

//                       <button onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.category}`} title="Delete" className="flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 transition">
//                         <Trash2 className="w-4 h-4" />
//                         <span className="text-sm">Delete</span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pagination controls */}
//             <div className="mt-6 flex items-center justify-between">
//               <div className="text-sm text-slate-600">
//                 Showing page {page} of {totalPages} • {totalItems} items
//               </div>

//               {/* <div className="flex items-center gap-2">
//                 <button onClick={() => void goToPage(1)} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">
//                   First
//                 </button>
//                 <button onClick={() => void goToPage(page - 1)} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">
//                   Prev
//                 </button>

//                 {renderPageNumbers().map((p) => (
//                   <button key={p} onClick={() => void goToPage(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-indigo-600 text-white" : ""}`}>
//                     {p}
//                   </button>
//                 ))}

//                 <button onClick={() => void goToPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">
//                   Next
//                 </button>
//                 <button onClick={() => void goToPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">
//                   Last
//                 </button>
//               </div> */}
//             </div>
//           </>
//         )}
//       </div>

//       {/* Drawer */}
//       <div className={`fixed inset-0 z-40 transition-opacity ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
//         <div onClick={() => setDrawerOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`} />
//       </div>

//       <aside role="dialog" aria-modal="true" className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] transform transition-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
//         <div className="h-full flex flex-col bg-white shadow-xl">
//           <div className="flex items-center justify-between p-4 border-b">
//             <div className="flex items-center gap-3">
//               <div>
//                 <h2 className="text-lg font-medium">{editingId ? "Edit Category" : "Add Category"}</h2>
//               </div>
//             </div>
//             <button onClick={() => setDrawerOpen(false)} aria-label="Close drawer" className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
//           </div>

//           <form className="flex-1 overflow-auto p-4 sm:p-6" onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 gap-4">
//               <div>
//                 <label htmlFor="category" className="block text-sm font-medium text-gray-700">Name (Category)</label>
//                 <input id="category" value={catForm.category} onChange={(e) => setCatForm((s) => ({ ...s, category: e.target.value }))} className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Beverages" />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">{`Image ${editingId ? "(optional)" : "(required)"}`}</label>

//                 <div className="mt-1 flex items-center gap-3">
//                   <div className="w-28 h-28 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border">
//                     {catForm.imagePreview ? <img src={catForm.imagePreview} alt={catForm.category || "preview"} className="w-full h-full object-cover" /> : <div className="text-xs text-slate-400">No image</div>}
//                   </div>

//                   <div className="flex-1">
//                     <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm text-gray-500" />
//                     <p className="text-xs text-slate-400 mt-2">Max 5MB. Square images work best. {editingId ? "Leave empty to keep existing image." : ""}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t flex items-center justify-end gap-3">
//               <button type="button" className="px-4 py-2 rounded-md border" onClick={() => { setCatForm({ category: "", imagePreview: "" }); setDrawerOpen(false); setSelectedFile(null); setEditingId(null); if (fileRef.current) fileRef.current.value = ""; }}>
//                 Cancel
//               </button>
//               <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
//                 {submitting ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update" : "Add"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </aside>
//     </div>
//   );
// }


import React, { useEffect, useRef, useState } from "react";
import { Plus, X, Edit2, Trash2, Search as SearchIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../../src/api/axios";

const SAMPLE_IMG = "/mnt/data/54197a23-6bd1-4ec0-9e69-8d2be56a0782.png";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

type CategoryItem = {
  id: string | number;
  category: string;
  image_url?: string; // absolute URL to show in UI (preferred)
  image?: string; // raw/relative if present
  createdAt?: string | null;
  productCount?: number;
};

function unsplashForCategory(cat?: string, size = "600x400") {
  const keyword = (cat || "grocery").split(" ").slice(0, 3).join(",");
  return `https://source.unsplash.com/featured/${size}/?${encodeURIComponent(keyword)}`;
}

function readPagination(metaLike: any) {
  const out = {
    total: Number(metaLike?.total ?? metaLike?.count ?? metaLike?.records ?? metaLike?.totalRecords ?? 0),
    per_page: Number(metaLike?.per_page ?? metaLike?.perPage ?? metaLike?.limit ?? metaLike?.pageSize ?? 10),
    current_page: Number(metaLike?.current_page ?? metaLike?.page ?? metaLike?.currentPage ?? 1),
    last_page: Number(metaLike?.last_page ?? metaLike?.total_pages ?? Math.ceil((metaLike?.total ?? 0) / (metaLike?.per_page ?? 10))),
  };
  out.per_page = out.per_page > 0 ? out.per_page : 10;
  out.current_page = out.current_page >= 1 ? out.current_page : 1;
  out.last_page = out.last_page >= 1 ? out.last_page : 1;
  return out;
}

export default function CategoriesShowcase(): JSX.Element {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ category: string; imagePreview?: string }>({ category: "", imagePreview: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const normalizeRow = (r: any, i = 0): CategoryItem => {
    const rawCount = r.products_count ?? r.count ?? r.productsCount ?? 0;
    const parsedCount = typeof rawCount === "string" ? Number(rawCount || 0) : Number(rawCount ?? 0);

    let resolvedImage: string | undefined = undefined;
    if (r.image_url && String(r.image_url).trim()) {
      resolvedImage = String(r.image_url).trim();
    } else if (r.imageUrl && String(r.imageUrl).trim()) {
      resolvedImage = String(r.imageUrl).trim();
    } else if (r.image && String(r.image).trim()) {
      const raw = String(r.image).trim();
      if (/^https?:\/\//i.test(raw)) {
        resolvedImage = raw;
      } else {
        try {
          const baseCandidate = String((api && (api as any).defaults && (api as any).defaults.baseURL) || window.location.origin);
          const base = baseCandidate.endsWith("/") ? baseCandidate : baseCandidate + "/";
          resolvedImage = new URL(raw.replace(/^\/+/, ""), base).toString();
        } catch {
          try {
            resolvedImage = `${window.location.origin}/storage/${raw.replace(/^\/+/, "")}`;
          } catch {
            resolvedImage = undefined;
          }
        }
      }
    }

    const finalImage = resolvedImage ?? (r.name ? unsplashForCategory(r.name) : undefined) ?? SAMPLE_IMG;

    return {
      id: r.id ?? r._id ?? r.categoryId ?? `srv-${i}`,
      category: (r.name ?? r.category ?? r.title ?? `Category ${i + 1}`).toString(),
      image_url: finalImage,
      image: r.image ?? undefined,
      createdAt: r.created_at ?? r.createdAt ?? null,
      productCount: Number.isFinite(parsedCount) ? parsedCount : 0,
    };
  };

  const fetchCategories = async (opts?: { q?: string; page?: number; per_page?: number }) => {
    setLoading(true);
    try {
      const params: any = {};
      if (opts?.q) params.q = opts.q;
      if (opts?.page) params.page = opts.page;
      if (opts?.per_page) params.per_page = opts.per_page;

      const res = await api.get("/admin/categories/show", { params });
      const body = res?.data ?? null;

      let rows: any[] = [];
      if (Array.isArray(body)) rows = body;
      else if (Array.isArray(body.data)) rows = body.data;
      else if (Array.isArray(body.rows)) rows = body.rows;
      else if (Array.isArray(body.categories)) rows = body.categories;
      else {
        const arr = Object.values(body || {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) rows = arr as any[];
      }

      const normalized = rows.map((r, i) => normalizeRow(r, i));
      setCategories(normalized);

      const metaCandidate = body?.meta ?? body?.pagination ?? body?.pagination_data ?? body;
      const { total, per_page, current_page, last_page } = readPagination(metaCandidate ?? {});
      setTotalItems(Number.isFinite(total) ? total : normalized.length);
      setPerPage(per_page > 0 ? per_page : opts?.per_page ?? perPage);
      setPage(current_page >= 1 ? current_page : opts?.page ?? 1);
      setTotalPages(last_page >= 1 ? last_page : Math.max(1, Math.ceil((total || normalized.length) / (per_page || perPage))));
    } catch (err: any) {
      console.error("fetchCategories error:", err);
      const serverMsg = err?.response?.data?.message ?? err?.message ?? "Network error while loading categories.";
      toast.error(serverMsg);
      setCategories([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories({ q: "", page: 1, per_page: perPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      setCatForm((p) => ({ ...p, imagePreview: "" }));
      return;
    }
    if (!file.type || !file.type.startsWith("image/")) {
      toast.error("Selected file is not an image. Please choose a valid image file.");
      if (fileRef.current) fileRef.current.value = "";
      setSelectedFile(null);
      setCatForm((p) => ({ ...p, imagePreview: "" }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 5MB). Please select a smaller file.");
      if (fileRef.current) fileRef.current.value = "";
      setSelectedFile(null);
      setCatForm((p) => ({ ...p, imagePreview: "" }));
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setCatForm((p) => ({ ...p, imagePreview: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const fetchSingle = async (id: string | number) => {
    try {
      const res = await api.get(`/admin/categories/show/${id}`);
      const body = res?.data ?? null;
      const item = body?.data ?? body?.category ?? body ?? null;
      return item ? normalizeRow(item) : null;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? `Failed to fetch item`;
      throw new Error(msg);
    }
  };

  const createCategory = async (payload: { name: string; file?: File | null }) => {
    try {
      const fd = new FormData();
      fd.append("name", payload.name);
      if (payload.file) fd.append("image", payload.file, payload.file.name);
      const res = await api.post("/admin/categories/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const body = res?.data ?? null;
      const serverItem = body?.data ?? body?.category ?? body ?? null;
      return serverItem ? normalizeRow(serverItem) : null;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Create failed";
      throw new Error(msg);
    }
  };

  const updateCategory = async (id: string | number, payload: { name: string; file?: File | null }) => {
    try {
      const fd = new FormData();
      fd.append("name", payload.name);
      fd.append("_method", "POST");
      if (payload.file) fd.append("image", payload.file, payload.file.name);
      const res = await api.post(`/admin/categories/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const body = res?.data ?? null;
      const serverItem = body?.data ?? body?.category ?? body ?? null;
      return serverItem ? normalizeRow(serverItem) : null;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Update failed";
      throw new Error(msg);
    }
  };

  const deleteCategoryReq = async (id: string | number) => {
    try {
      await api.delete(`/admin/categories/delete/${id}`);
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Delete failed";
      throw new Error(msg);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setCatForm({ category: "", imagePreview: "" });
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setDrawerOpen(true);
  };

  const openEdit = async (item: CategoryItem) => {
    setEditingId(item.id);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    try {
      const server = await fetchSingle(item.id);
      setCatForm({ category: server?.category ?? item.category, imagePreview: server?.image_url ?? item.image_url ?? "" });
    } catch {
      setCatForm({ category: item.category, imagePreview: item.image_url ?? item.image ?? "" });
    }
    setDrawerOpen(true);
  };

  const prettyDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(d);
    } catch {
      return iso;
    }
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!catForm.category.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    if (!editingId && !selectedFile) {
      toast.error("Please select an image for the new category (max 5MB).");
      return;
    }
    setSubmitting(true);
    const payload = { name: catForm.category.trim(), file: selectedFile };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Category updated");
      } else {
        await createCategory(payload);
        toast.success("Category created");
      }
      await fetchCategories({ q: query, page: 1, per_page: perPage });
      setDrawerOpen(false);
      setCatForm({ category: "", imagePreview: "" });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      console.error("submit error:", err);
      const serverMsg = err?.message ?? "Failed to save category";
      toast.error(serverMsg);
    } finally {
      setSubmitting(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string | number) => {
    const confirmed = window.confirm("Delete this category? This action cannot be undone.");
    if (!confirmed) return;
    const prev = categories;
    setCategories((p) => p.filter((c) => String(c.id) !== String(id)));
    try {
      await deleteCategoryReq(id);
      toast.success("Category deleted");
      await fetchCategories({ q: query, page, per_page: perPage });
    } catch (err: any) {
      console.error("delete error:", err);
      setCategories(prev);
      const serverMsg = err?.message ?? "Failed to delete category";
      toast.error(serverMsg);
    }
  };

  const doSearch = async () => {
    setPage(1);
    await fetchCategories({ q: query, page: 1, per_page: perPage });
  };

  const goToPage = async (p: number) => {
    const newPage = Math.max(1, Math.min(p, totalPages));
    setPage(newPage);
    await fetchCategories({ q: query, page: newPage, per_page: perPage });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 7;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(totalItems / perPage)));
  }, [totalItems, perPage]);

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      {/* header: three columns layout so search sits centered */}
      <div className="grid grid-cols-3 items-center gap-4 mb-6">
        {/* left: title */}
        <div className="col-span-1">
          {/* <h1 className="text-2xl font-semibold text-slate-800">Categories</h1> */}
        </div>

        {/* center: search - centered (commented out) */}
        <div className="col-span-1" />

        {/* right: actions */}
        <div className="col-span-1 flex justify-end items-center gap-3">
          <button onClick={openCreate} className="bg-chart-primary hover:bg-chart-primary/90 flex items-center py-2 px-4 rounded-md shadow-sm" title="Add Category">
            Add Category
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mb-6">
        {loading ? (
          // Loading skeleton uses the same responsive grid so placeholders match final layout
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div key={n} className="flex flex-col items-center text-center animate-pulse">
                <div className="w-36 sm:w-40 md:w-44 lg:w-44 xl:w-48 h-36 sm:h-40 md:h-44 lg:h-44 xl:h-48 rounded-full bg-slate-200 mb-3" />
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-sm text-slate-500">No categories yet.</div>
        ) : (
          <>
            {/* Responsive grid:
                - 1 col on xs
                - 2 cols on sm
                - 3 cols on md
                - 5 cols on lg and above (so laptops and larger show 5 items per row)
             */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-start">
              {categories.map((c) => (
                <div key={String(c.id)} className="flex flex-col items-center text-center">
                  <div
                    className="w-36 sm:w-40 md:w-44 lg:w-44 xl:w-48 h-36 sm:h-40 md:h-44 lg:h-44 xl:h-48 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center"
                    style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}
                  >
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.category}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.dataset.fallback) return;
                          img.dataset.fallback = "true";
                          img.src = unsplashForCategory(c.category, "600x400");
                        }}
                      />
                    ) : (
                      <img src={unsplashForCategory(c.category, "600x400")} alt={c.category} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>

                  <div className="mt-4 px-2 w-full">
                    <div className="text-green-800 font-semibold text-lg leading-tight">{c.category}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {(typeof c.productCount === "number" ? c.productCount : 0) + (c.productCount === 1 ? " Product" : " Products")}
                    </div>
                    {c.createdAt ? <div className="text-xs text-slate-400 mt-1">Created {prettyDate(c.createdAt)}</div> : null}

                    <div className="mt-3 flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(c)} aria-label={`Edit ${c.category}`} title="Edit" className="flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>

                      <button onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.category}`} title="Delete" className="flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing page {page} of {totalPages} • {totalItems} items
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <div className={`fixed inset-0 z-40 transition-opacity ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
        <div onClick={() => setDrawerOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`} />
      </div>

      <aside role="dialog" aria-modal="true" className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] transform transition-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-medium">{editingId ? "Edit Category" : "Add Category"}</h2>
              </div>
            </div>
            <button onClick={() => setDrawerOpen(false)} aria-label="Close drawer" className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>

          <form className="flex-1 overflow-auto p-4 sm:p-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Name (Category)</label>
                <input id="category" value={catForm.category} onChange={(e) => setCatForm((s) => ({ ...s, category: e.target.value }))} className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Beverages" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{`Image ${editingId ? "(optional)" : "(required)"}`}</label>

                <div className="mt-1 flex items-center gap-3">
                  <div className="w-28 h-28 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border">
                    {catForm.imagePreview ? <img src={catForm.imagePreview} alt={catForm.category || "preview"} className="w-full h-full object-cover" /> : <div className="text-xs text-slate-400">No image</div>}
                  </div>

                  <div className="flex-1">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm text-gray-500" />
                    <p className="text-xs text-slate-400 mt-2">Max 5MB. Square images work best. {editingId ? "Leave empty to keep existing image." : ""}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t flex items-center justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-md border" onClick={() => { setCatForm({ category: "", imagePreview: "" }); setDrawerOpen(false); setSelectedFile(null); setEditingId(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                {submitting ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}
