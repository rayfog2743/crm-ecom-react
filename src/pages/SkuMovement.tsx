
// import React, { useEffect, useRef, useState } from "react";
// import { Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import api from "@/api/axios";
// import type { AxiosError } from "axios";

// type Vendor = {
//   id: string | number;
//   name: string;
//   email: string;
//   phone: string;
//   address: string;
// };

// const FIELD_ORDER = ["name", "email", "phone", "address"];

// const SkuMovement: React.FC = () => {
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [editing, setEditing] = useState<Vendor | null>(null);
//   const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
//   const [errors, setErrors] = useState<{ [k: string]: string }>({});
//   const [generalErrors, setGeneralErrors] = useState<string[]>([]);
//   const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   // refs so we can focus first invalid
//   const nameRef = useRef<HTMLInputElement | null>(null);
//   const emailRef = useRef<HTMLInputElement | null>(null);
//   const phoneRef = useRef<HTMLInputElement | null>(null);
//   const addressRef = useRef<HTMLInputElement | null>(null);
//   const inputRefs: Record<string, React.RefObject<HTMLInputElement>> = {
//     name: nameRef,
//     email: emailRef,
//     phone: phoneRef,
//     address: addressRef,
//   };

//   useEffect(() => {
//     void fetchVendors();
//   }, []);

//   // Helper: robust error formatter for Axios/pure errors
//   function formatAxiosError(err: unknown) {
//     const fallback = { message: "An unknown error occurred", details: null as any, status: undefined as number | undefined };
//     try {
//       if (!err) return fallback;

//       const ae = err as AxiosError & { response?: any; request?: any };
//       if (ae && (ae.isAxiosError || ae.response || ae.request)) {
//         const status = ae.response?.status;
//         const data = ae.response?.data;
//         let message = ae.message || "Request failed";

//         if (data) {
//           if (typeof data === "string") message = data;
//           else if (data.message) message = data.message;
//           else if (data.error) message = data.error;
//           else if (data.errors && typeof data.errors === "string") message = data.errors;
//         }
//         return { message: String(message), details: data ?? ae.response ?? ae.request ?? ae.stack, status };
//       }

//       if (err instanceof Error) {
//         return { message: err.message, details: err.stack, status: undefined };
//       }

//       if (typeof err === "string") return { message: err, details: null, status: undefined };
//       return { message: "Unknown error", details: JSON.stringify(err), status: undefined };
//     } catch (parseErr) {
//       return { message: "Error while parsing error", details: parseErr, status: undefined };
//     }
//   }

//   // Extract both field-level errors and general messages from many API shapes
//   function extractServerErrors(payload: any): { fieldErrors: { [k: string]: string }; general: string[] } {
//     const fieldErrors: { [k: string]: string } = {};
//     const general: string[] = [];

//     if (!payload) return { fieldErrors, general };

//     const pushGeneral = (m: any) => {
//       if (m == null) return;
//       if (Array.isArray(m)) m.forEach((x) => pushGeneral(x));
//       else general.push(String(m));
//     };

//     // Top-level 'message' or 'messages'
//     if (payload.message) {
//       pushGeneral(payload.message);
//     }
//     if (payload.messages && Array.isArray(payload.messages)) {
//       pushGeneral(payload.messages);
//     }

//     // Laravel-style errors: { errors: { field: [msg,...] } }
//     if (payload.errors && typeof payload.errors === "object") {
//       Object.keys(payload.errors).forEach((k) => {
//         const val = payload.errors[k];
//         if (Array.isArray(val)) fieldErrors[k] = String(val.join(", "));
//         else fieldErrors[k] = String(val);
//       });
//     }

//     // Common nested shapes: payload.data.errors / payload.data.message
//     const maybe = payload.data ?? payload.error ?? null;
//     if (maybe) {
//       if (maybe.errors && typeof maybe.errors === "object") {
//         Object.keys(maybe.errors).forEach((k) => {
//           const val = maybe.errors[k];
//           if (Array.isArray(val)) fieldErrors[k] = String(val.join(", "));
//           else fieldErrors[k] = String(val);
//         });
//       }
//       if (maybe.message) pushGeneral(maybe.message);
//       if (maybe.messages && Array.isArray(maybe.messages)) pushGeneral(maybe.messages);
//     }

//     // If payload has plain fields with messages, capture them (e.g. { name: "required" })
//     const possibleFields = ["name", "email", "phone", "address"];
//     possibleFields.forEach((f) => {
//       if (payload[f] && typeof payload[f] === "string") {
//         // don't overwrite existing fieldErrors
//         if (!fieldErrors[f]) fieldErrors[f] = payload[f];
//       }
//       // sometimes payload.field = [..]
//       if (payload[f] && Array.isArray(payload[f]) && payload[f].length) {
//         if (!fieldErrors[f]) fieldErrors[f] = String(payload[f].join(", "));
//       }
//     });

//     // If status === false and no messages yet, use payload.message or generic
//     if (payload.status === false && general.length === 0 && Object.keys(fieldErrors).length === 0) {
//       if (payload.message) pushGeneral(payload.message);
//       else if (payload.error) pushGeneral(payload.error);
//       else pushGeneral("Request failed");
//     }

//     // Deduplicate and trim general messages
//     const dedupGen = Array.from(new Set(general.map((s) => String(s).trim()).filter(Boolean)));

//     return { fieldErrors, general: dedupGen };
//   }

//   const fetchVendors = async () => {
//     setLoading(true);
//     try {
//       const res = await api.get("/admin/settings/vendors/show");
//       const body = res.data;
//       const rows: Vendor[] = Array.isArray(body) ? body : body?.data ?? body?.vendors ?? [];
//       setVendors(rows);
//     } catch (err: unknown) {
//       const { message, details, status } = formatAxiosError(err);
//       console.error("Failed to load vendors:", { message, status, details, raw: err });

//       // try to show server messages if present
//       const maybe = (err as AxiosError)?.response?.data ?? null;
//       if (maybe) {
//         const { general } = extractServerErrors(maybe);
//         if (general.length) general.forEach((g) => toast.error(g));
//         else toast.error(message || "Failed to load vendor list");
//       } else {
//         toast.error(message || "Failed to load vendor list");
//       }
//       setVendors([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openAdd = () => {
//     setEditing(null);
//     setForm({ name: "", email: "", phone: "", address: "" });
//     setErrors({});
//     setGeneralErrors([]);
//     setModalOpen(true);
//     // focus name after modal opens
//     setTimeout(() => nameRef.current?.focus(), 80);
//   };

//   const openEdit = (it: Vendor) => {
//     setEditing(it);
//     setForm({
//       name: it.name ?? "",
//       email: it.email ?? "",
//       phone: it.phone ?? "",
//       address: it.address ?? "",
//     });
//     setErrors({});
//     setGeneralErrors([]);
//     setModalOpen(true);
//     setTimeout(() => nameRef.current?.focus(), 80);
//   };

//   const validate = () => {
//     const e: { [k: string]: string } = {};
//     if (!form.name.trim()) e.name = "Name is required";
//     if (!form.email.trim()) e.email = "Email is required";
//     if (!form.phone.trim()) e.phone = "Phone is required";
//     if (!form.address.trim()) e.address = "Address is required";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   // Focus first invalid field (helper)
//   function focusFirstInvalidField(fieldErrs: { [k: string]: string }) {
//     for (const f of FIELD_ORDER) {
//       if (fieldErrs[f]) {
//         const ref = inputRefs[f];
//         try {
//           ref?.current?.focus();
//         } catch {
//           const el = document.querySelector<HTMLInputElement>(`input[name="${f}"]`);
//           el?.focus();
//         }
//         break;
//       }
//     }
//   }

//   const handleSave = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     setErrors({});
//     setGeneralErrors([]);

//     if (!validate()) {
//       toast.error("Fix validation errors");
//       focusFirstInvalidField(errors);
//       return;
//     }

//     setSaving(true);
//     try {
//       const payload = {
//         name: form.name.trim(),
//         email: form.email.trim(),
//         phone: form.phone.trim(),
//         address: form.address.trim(),
//       };

//       if (editing) {
//         const res = await api.post(`/admin/settings/vendors/update/${editing.id}`, payload);
//         const body = res.data ?? res;

//         // treat status:false as error even on 200
//         if (body && body.status === false) {
//           const { fieldErrors, general } = extractServerErrors(body);
//           if (Object.keys(fieldErrors).length) {
//             setErrors((prev) => ({ ...prev, ...fieldErrors }));
//             focusFirstInvalidField(fieldErrors);
//             toast.error("Validation errors received from server");
//           }
//           if (general.length) {
//             setGeneralErrors(general);
//             general.forEach((m) => toast.error(m));
//           }
//           setSaving(false);
//           return;
//         }

//         const updated = body?.data ?? body?.vendor ?? body ?? payload;
//         setVendors((prev) => prev.map((v) => (String(v.id) === String(editing.id) ? { ...v, ...updated } : v)));
//         toast.success("Vendor updated");
//       } else {
//         const res = await api.post("/admin/settings/vendors/add", payload);
//         const body = res.data ?? res;

//         if (body && body.status === false) {
//           const { fieldErrors, general } = extractServerErrors(body);
//           if (Object.keys(fieldErrors).length) {
//             setErrors((prev) => ({ ...prev, ...fieldErrors }));
//             focusFirstInvalidField(fieldErrors);
//             toast.error("Validation errors received from server");
//           }
//           if (general.length) {
//             setGeneralErrors(general);
//             general.forEach((m) => toast.error(m));
//           }
//           setSaving(false);
//           return;
//         }

//         const created = body?.data ?? body?.vendor ?? body ?? payload;
//         setVendors((prev) => [created, ...prev]);
//         toast.success("Vendor added");
//       }

//       // success -> reset modal & errors
//       setModalOpen(false);
//       setEditing(null);
//       setForm({ name: "", email: "", phone: "", address: "" });
//       setErrors({});
//       setGeneralErrors([]);
//     } catch (err: unknown) {
//       const { message, details, status } = formatAxiosError(err);
//       console.error("Save vendor error:", { message, status, details, raw: err });

//       // try to extract server payload
//       const ae = err as AxiosError & { response?: any };
//       const payload = ae?.response?.data ?? null;
//       if (payload) {
//         const { fieldErrors, general } = extractServerErrors(payload);
//         if (Object.keys(fieldErrors).length) {
//           setErrors((prev) => ({ ...prev, ...fieldErrors }));
//           focusFirstInvalidField(fieldErrors);
//           toast.error("Validation errors received from server");
//         }
//         if (general.length) {
//           setGeneralErrors(general);
//           general.forEach((g) => toast.error(g));
//         }
//       } else {
//         toast.error(message ?? "Failed to save vendor");
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   const confirmDelete = (it: Vendor) => setDeleteTarget(it);

//   const doDelete = async () => {
//     if (!deleteTarget) return;
//     setDeleteLoading(true);
//     try {
//       const res = await api.delete(`/admin/settings/vendors/delete/${deleteTarget.id}`);
//       const body = res.data ?? res;
//       if (body && body.status === false) {
//         const { general } = extractServerErrors(body);
//         if (general.length) general.forEach((g) => toast.error(g));
//         else toast.error(body.message ?? "Failed to delete");
//         setDeleteLoading(false);
//         return;
//       }
//       setVendors((prev) => prev.filter((v) => String(v.id) !== String(deleteTarget.id)));
//       toast.success("Vendor deleted");
//     } catch (err: unknown) {
//       const { message, details, status } = formatAxiosError(err);
//       console.error("Delete vendor error:", { message, status, details, raw: err });
//       const ae = err as AxiosError & { response?: any };
//       const payload = ae?.response?.data ?? null;
//       if (payload) {
//         const { general } = extractServerErrors(payload);
//         if (general.length) general.forEach((g) => toast.error(g));
//         else toast.error(message ?? "Failed to delete");
//       } else {
//         toast.error(message ?? "Failed to delete");
//       }
//     } finally {
//       setDeleteLoading(false);
//       setDeleteTarget(null);
//     }
//   };

//   return (
//  <div className="p-2 w-full">
//       <Toaster position="top-right" />
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//         <h2 className="text-2xl font-semibold text-slate-800"></h2>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={openAdd}
//             className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
//           >
//             <Plus className="w-4 h-4" />
//             Add Vendor
//           </button>
//           <button
//             onClick={() => void fetchVendors()}
//             className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 transition"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Table (desktop) */}
//       <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//         <div className="hidden md:block">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-slate-50">
//               <tr>
//                 <th className="px-4 py-3">Name</th>
//                 <th className="px-4 py-3">Email</th>
//                 <th className="px-4 py-3">Phone</th>
//                 <th className="px-4 py-3">Address</th>
//                 <th className="px-4 py-3 w-40">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
//                     Loading…
//                   </td>
//                 </tr>
//               ) : vendors.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
//                     No vendors found.
//                   </td>
//                 </tr>
//               ) : (
//                 vendors.map((it) => (
//                   <tr key={String(it.id)} className="border-t hover:bg-slate-50 transition">
//                     <td className="px-4 py-3">{it.name}</td>
//                     <td className="px-4 py-3">{it.email}</td>
//                     <td className="px-4 py-3">{it.phone}</td>
//                     <td className="px-4 py-3">{it.address}</td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => openEdit(it)}
//                           className="px-3 py-1 rounded border inline-flex items-center gap-2 hover:bg-slate-100 transition"
//                         >
//                           <Edit3 className="w-4 h-4" />
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => confirmDelete(it)}
//                           className="px-3 py-1 rounded bg-red-600 text-white inline-flex items-center gap-2 hover:bg-red-700 transition"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Cards (mobile) */}
//         <div className="md:hidden p-4 grid gap-3">
//           {loading ? (
//             <div className="text-center text-slate-500">Loading…</div>
//           ) : vendors.length === 0 ? (
//             <div className="text-center text-slate-500">No vendors found.</div>
//           ) : (
//             vendors.map((it) => (
//               <div
//                 key={String(it.id)}
//                 className="border rounded-lg p-3 flex flex-col gap-2 hover:bg-slate-50 transition"
//               >
//                 <div className="font-medium">{it.name}</div>
//                 <div className="text-sm text-slate-600">{it.email}</div>
//                 <div className="text-sm text-slate-600">{it.phone}</div>
//                 <div className="text-sm text-slate-600">{it.address}</div>
//                 <div className="flex gap-2 mt-2">
//                   <button onClick={() => openEdit(it)} className="flex-1 p-2 border rounded hover:bg-slate-100">
//                     <Edit3 className="w-4 h-4 inline" /> Edit
//                   </button>
//                   <button
//                     onClick={() => confirmDelete(it)}
//                     className="flex-1 p-2 rounded bg-red-600 text-white hover:bg-red-700"
//                   >
//                     <Trash2 className="w-4 h-4 inline" /> Delete
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Modal Add/Edit */}
//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
//           <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10">
//             <div className="flex items-center justify-between p-4 border-b">
//               <h3 className="text-lg font-medium">{editing ? "Edit Vendor" : "Add Vendor"}</h3>
//               <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <form onSubmit={handleSave} className="p-4 space-y-4">
//               {/* General server errors (list) */}
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
//                 <label className="block text-sm font-medium mb-1">Name</label>
//                 <input
//                   name="name"
//                   ref={nameRef}
//                   value={form.name}
//                   onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
//                   className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.name ? "border-red-400" : ""}`}
//                   placeholder="Enter name"
//                 />
//                 {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   name="email"
//                   ref={emailRef}
//                   value={form.email}
//                   onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
//                   className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.email ? "border-red-400" : ""}`}
//                   placeholder="Enter email"
//                 />
//                 {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone</label>
//                 <input
//                   name="phone"
//                   ref={phoneRef}
//                   value={form.phone}
//                   onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
//                   className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.phone ? "border-red-400" : ""}`}
//                   placeholder="Enter phone"
//                 />
//                 {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Address</label>
//                 <input
//                   name="address"
//                   ref={addressRef}
//                   value={form.address}
//                   onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
//                   className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.address ? "border-red-400" : ""}`}
//                   placeholder="Enter address"
//                 />
//                 {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setModalOpen(false);
//                     setEditing(null);
//                   }}
//                   className="px-4 py-2 rounded border hover:bg-slate-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
//                 >
//                   {saving ? "Saving…" : editing ? "Update" : "Add"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Delete confirmation */}
//       {deleteTarget && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
//           <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10 p-5">
//             <h3 className="text-lg font-medium">Confirm delete</h3>
//             <p className="text-sm text-slate-600 mt-2">
//               Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
//             </p>
//             <div className="mt-4 flex justify-end gap-2">
//               <button
//                 onClick={() => setDeleteTarget(null)}
//                 disabled={deleteLoading}
//                 className="px-3 py-1 rounded border hover:bg-slate-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => void doDelete()}
//                 disabled={deleteLoading}
//                 className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
//               >
//                 {deleteLoading ? "Deleting…" : "Yes, delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default SkuMovement;



import React, { useEffect, useRef, useState } from "react";
import { Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/api/axios";
import type { AxiosError } from "axios";

type Vendor = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  address: string;
};

const FIELD_ORDER = ["name", "email", "phone", "address"];

const SkuMovement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // refs so we can focus first invalid
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const inputRefs: Record<string, React.RefObject<HTMLInputElement>> = {
    name: nameRef,
    email: emailRef,
    phone: phoneRef,
    address: addressRef,
  };

  useEffect(() => {
    void fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: robust error formatter for Axios/pure errors
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

      if (err instanceof Error) {
        return { message: err.message, details: err.stack, status: undefined };
      }

      if (typeof err === "string") return { message: err, details: null, status: undefined };
      return { message: "Unknown error", details: JSON.stringify(err), status: undefined };
    } catch (parseErr) {
      return { message: "Error while parsing error", details: parseErr, status: undefined };
    }
  }

  // Extract both field-level errors and general messages from many API shapes
  function extractServerErrors(payload: any): { fieldErrors: { [k: string]: string }; general: string[] } {
    const fieldErrors: { [k: string]: string } = {};
    const general: string[] = [];

    if (!payload) return { fieldErrors, general };

    const pushGeneral = (m: any) => {
      if (m == null) return;
      if (Array.isArray(m)) m.forEach((x) => pushGeneral(x));
      else general.push(String(m));
    };

    // Top-level 'message' or 'messages'
    if (payload.message) {
      pushGeneral(payload.message);
    }
    if (payload.messages && Array.isArray(payload.messages)) {
      pushGeneral(payload.messages);
    }

    // Laravel-style errors: { errors: { field: [msg,...] } }
    if (payload.errors && typeof payload.errors === "object") {
      Object.keys(payload.errors).forEach((k) => {
        const val = payload.errors[k];
        if (Array.isArray(val)) fieldErrors[k] = String(val.join(", "));
        else fieldErrors[k] = String(val);
      });
    }

    // Common nested shapes: payload.data.errors / payload.data.message
    const maybe = payload.data ?? payload.error ?? null;
    if (maybe) {
      if (maybe.errors && typeof maybe.errors === "object") {
        Object.keys(maybe.errors).forEach((k) => {
          const val = maybe.errors[k];
          if (Array.isArray(val)) fieldErrors[k] = String(val.join(", "));
          else fieldErrors[k] = String(val);
        });
      }
      if (maybe.message) pushGeneral(maybe.message);
      if (maybe.messages && Array.isArray(maybe.messages)) pushGeneral(maybe.messages);
    }

    // If payload has plain fields with messages, capture them (e.g. { name: "required" })
    const possibleFields = ["name", "email", "phone", "address"];
    possibleFields.forEach((f) => {
      if (payload[f] && typeof payload[f] === "string") {
        // don't overwrite existing fieldErrors
        if (!fieldErrors[f]) fieldErrors[f] = payload[f];
      }
      // sometimes payload.field = [..]
      if (payload[f] && Array.isArray(payload[f]) && payload[f].length) {
        if (!fieldErrors[f]) fieldErrors[f] = String(payload[f].join(", "));
      }
    });

    // If status === false and no messages yet, use payload.message or generic
    if (payload.status === false && general.length === 0 && Object.keys(fieldErrors).length === 0) {
      if (payload.message) pushGeneral(payload.message);
      else if (payload.error) pushGeneral(payload.error);
      else pushGeneral("Request failed");
    }

    // Deduplicate and trim general messages
    const dedupGen = Array.from(new Set(general.map((s) => String(s).trim()).filter(Boolean)));

    return { fieldErrors, general: dedupGen };
  }

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings/vendors/show");
      const body = res.data;
      const rows: Vendor[] = Array.isArray(body) ? body : body?.data ?? body?.vendors ?? [];
      setVendors(rows);
    } catch (err: unknown) {
      const { message, details, status } = formatAxiosError(err);
      console.error("Failed to load vendors:", { message, status, details, raw: err });

      // try to show server messages if present
      const maybe = (err as AxiosError)?.response?.data ?? null;
      if (maybe) {
        const { general } = extractServerErrors(maybe);
        if (general.length) general.forEach((g) => toast.error(g));
        else toast.error(message || "Failed to load vendor list");
      } else {
        toast.error(message || "Failed to load vendor list");
      }
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", address: "" });
    setErrors({});
    setGeneralErrors([]);
    setModalOpen(true);
    // focus name after modal opens
    setTimeout(() => nameRef.current?.focus(), 80);
  };

  const openEdit = (it: Vendor) => {
    setEditing(it);
    setForm({
      name: it.name ?? "",
      email: it.email ?? "",
      phone: it.phone ?? "",
      address: it.address ?? "",
    });
    setErrors({});
    setGeneralErrors([]);
    setModalOpen(true);
    setTimeout(() => nameRef.current?.focus(), 80);
  };

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Focus first invalid field (helper)
  function focusFirstInvalidField(fieldErrs: { [k: string]: string }) {
    for (const f of FIELD_ORDER) {
      if (fieldErrs[f]) {
        const ref = inputRefs[f];
        try {
          ref?.current?.focus();
        } catch {
          const el = document.querySelector<HTMLInputElement>(`input[name="${f}"]`);
          el?.focus();
        }
        break;
      }
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrors({});
    setGeneralErrors([]);

    if (!validate()) {
      toast.error("Fix validation errors");
      focusFirstInvalidField(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (editing) {
        const res = await api.post(`/admin/settings/vendors/update/${editing.id}`, payload);
        const body = res.data ?? res;

        // treat status:false as error even on 200
        if (body && body.status === false) {
          const { fieldErrors, general } = extractServerErrors(body);
          if (Object.keys(fieldErrors).length) {
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
            focusFirstInvalidField(fieldErrors);
            toast.error("Validation errors received from server");
          }
          if (general.length) {
            setGeneralErrors(general);
            general.forEach((m) => toast.error(m));
          }
          setSaving(false);
          return;
        }

        const updated = body?.data ?? body?.vendor ?? body ?? payload;
        setVendors((prev) => prev.map((v) => (String(v.id) === String(editing.id) ? { ...v, ...updated } : v)));
        toast.success("Vendor updated");
      } else {
        const res = await api.post("/admin/settings/vendors/add", payload);
        const body = res.data ?? res;

        if (body && body.status === false) {
          const { fieldErrors, general } = extractServerErrors(body);
          if (Object.keys(fieldErrors).length) {
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
            focusFirstInvalidField(fieldErrors);
            toast.error("Validation errors received from server");
          }
          if (general.length) {
            setGeneralErrors(general);
            general.forEach((m) => toast.error(m));
          }
          setSaving(false);
          return;
        }

        const created = body?.data ?? body?.vendor ?? body ?? payload;
        setVendors((prev) => [created, ...prev]);
        toast.success("Vendor added");
      }

      // success -> reset modal & errors
      setModalOpen(false);
      setEditing(null);
      setForm({ name: "", email: "", phone: "", address: "" });
      setErrors({});
      setGeneralErrors([]);
    } catch (err: unknown) {
      const { message, details, status } = formatAxiosError(err);
      console.error("Save vendor error:", { message, status, details, raw: err });

      // try to extract server payload
      const ae = err as AxiosError & { response?: any };
      const payload = ae?.response?.data ?? null;
      if (payload) {
        const { fieldErrors, general } = extractServerErrors(payload);
        if (Object.keys(fieldErrors).length) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          focusFirstInvalidField(fieldErrors);
          toast.error("Validation errors received from server");
        }
        if (general.length) {
          setGeneralErrors(general);
          general.forEach((g) => toast.error(g));
        }
      } else {
        toast.error(message ?? "Failed to save vendor");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (it: Vendor) => setDeleteTarget(it);

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/admin/settings/vendors/delete/${deleteTarget.id}`);
      const body = res.data ?? res;
      if (body && body.status === false) {
        const { general } = extractServerErrors(body);
        if (general.length) general.forEach((g) => toast.error(g));
        else toast.error(body.message ?? "Failed to delete");
        setDeleteLoading(false);
        return;
      }
      setVendors((prev) => prev.filter((v) => String(v.id) !== String(deleteTarget.id)));
      toast.success("Vendor deleted");
    } catch (err: unknown) {
      const { message, details, status } = formatAxiosError(err);
      console.error("Delete vendor error:", { message, status, details, raw: err });
      const ae = err as AxiosError & { response?: any };
      const payload = ae?.response?.data ?? null;
      if (payload) {
        const { general } = extractServerErrors(payload);
        if (general.length) general.forEach((g) => toast.error(g));
        else toast.error(message ?? "Failed to delete");
      } else {
        toast.error(message ?? "Failed to delete");
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  /* --------------------- Pagination (10 per page) --------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10; // show only 10 vendors per page

  const totalPages = Math.max(1, Math.ceil(vendors.length / PAGE_SIZE));
  // clamp current page if vendors change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (vendors.length === 0) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors.length, totalPages]);

  const paginatedVendors = vendors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  /* --------------------- UI --------------------- */
  return (
    <div className="p-2 w-full">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-slate-800"></h2>
        <div className="flex items-center gap-2">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
          <button
            onClick={() => void fetchVendors()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : paginatedVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((it) => (
                  <tr key={String(it.id)} className="border-t hover:bg-slate-50 transition">
                    <td className="px-4 py-3">{it.name}</td>
                    <td className="px-4 py-3">{it.email}</td>
                    <td className="px-4 py-3">{it.phone}</td>
                    <td className="px-4 py-3">{it.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(it)}
                          className="px-3 py-1 rounded border inline-flex items-center gap-2 hover:bg-slate-100 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(it)}
                          className="px-3 py-1 rounded bg-red-600 text-white inline-flex items-center gap-2 hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 grid gap-3">
          {loading ? (
            <div className="text-center text-slate-500">Loading…</div>
          ) : paginatedVendors.length === 0 ? (
            <div className="text-center text-slate-500">No vendors found.</div>
          ) : (
            paginatedVendors.map((it) => (
              <div
                key={String(it.id)}
                className="border rounded-lg p-3 flex flex-col gap-2 hover:bg-slate-50 transition"
              >
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-slate-600">{it.email}</div>
                <div className="text-sm text-slate-600">{it.phone}</div>
                <div className="text-sm text-slate-600">{it.address}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(it)} className="flex-1 p-2 border rounded hover:bg-slate-100">
                    <Edit3 className="w-4 h-4 inline" /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(it)}
                    className="flex-1 p-2 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 inline" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination controls (show only when vendors exist) */}
        {vendors.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t bg-white">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span>–
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, vendors.length)}</span> of{" "}
              <span className="font-medium">{vendors.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">{editing ? "Edit Vendor" : "Add Vendor"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              {/* General server errors (list) */}
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
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  ref={nameRef}
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.name ? "border-red-400" : ""}`}
                  placeholder="Enter name"
                />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  ref={emailRef}
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.email ? "border-red-400" : ""}`}
                  placeholder="Enter email"
                />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  name="phone"
                  ref={phoneRef}
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.phone ? "border-red-400" : ""}`}
                  placeholder="Enter phone"
                />
                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  name="address"
                  ref={addressRef}
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 focus:ring focus:ring-indigo-200 ${errors.address ? "border-red-400" : ""}`}
                  placeholder="Enter address"
                />
                {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 rounded border hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {saving ? "Saving…" : editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg z-10 p-5">
            <h3 className="text-lg font-medium">Confirm delete</h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-3 py-1 rounded border hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void doDelete()}
                disabled={deleteLoading}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SkuMovement;
