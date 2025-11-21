
// import React, { useEffect, useMemo, useState } from "react";
// import { Phone, MapPin, ShoppingCart, Clock } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchOnlineOrders,
//   selectSalesByChannel,
//   selectSalesLoadingOnline,
//   selectSalesErrorOnline,
// } from "../redux/slices/SalesSlice"; // adjust path if needed

// // small inline avatar generator (data URI)
// function avatarDataUri(name, bg = "#6b7280", fg = "#fff", size = 96) {
//   const initials = (name || "")
//     .split(" ")
//     .map((s) => s[0] ?? "")
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();
//   const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
//     <rect width='100%' height='100%' fill='${bg}' rx='14' />
//     <text x='50%' y='50%' dy='.06em' text-anchor='middle' font-family='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
//       font-weight='600' font-size='${Math.floor(size / 3.8)}' fill='${fg}'>${initials}</text>
//   </svg>`;
//   return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
// }

// // product thumbnail small data-uri
// function productThumbDataUri(text, bg = "#eef2ff", fg = "#111", size = 48) {
//   const label = String(text || "").slice(0, 2).toUpperCase();
//   const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
//     <rect width='100%' height='100%' fill='${bg}' rx='8' />
//     <text x='50%' y='50%' dy='.04em' text-anchor='middle' font-family='Inter, sans-serif' font-weight='700' font-size='${Math.floor(size/3.5)}' fill='${fg}'>${label}</text>
//   </svg>`;
//   return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
// }

// // Small dummy set (used only when there are no online orders)
// const FALLBACK_CUSTOMERS = [
//   {
//     id: "c_1",
//     name: "Ravi Kumar",
//     phone: "+91 98765 43210",
//     email: "ravi.kumar@example.com",
//     address: "22B, MG Road, Bengaluru, Karnataka",
//     avatarColor: "#0ea5a4",
//     lastOrders: [
//       { id: "o1", product: "9Nutz Sweet Pack", productThumb: productThumbDataUri("9N"), date: "2025-10-22", total: 499 },
//       { id: "o2", product: "Almond Crunch", productThumb: productThumbDataUri("AC"), date: "2025-09-02", total: 299 },
//     ],
//   },
//   {
//     id: "c_2",
//     name: "Priya Sharma",
//     phone: "+91 91234 56789",
//     email: "priya.sharma@example.com",
//     address: "Flat 5, Lotus Apartments, Pune, Maharashtra",
//     avatarColor: "#7c3aed",
//     lastOrders: [
//       { id: "o3", product: "Fashion Tee (M)", productThumb: productThumbDataUri("FT"), date: "2025-11-01", total: 799 },
//     ],
//   },
// ];

// const CustomerCard = ({ c }) => {
//   return (
//     <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-150 p-3 flex flex-col">
//       <div className="flex items-start gap-3">
//         <img
//           src={avatarDataUri(c.name, c.avatarColor ?? "#6b7280")}
//           alt={c.name}
//           className="w-10 h-10 rounded-md object-cover flex-shrink-0"
//         />
//         <div className="min-w-0">
//           <div className="flex items-center gap-2">
//             <h4 className="text-sm font-medium truncate">{c.name}</h4>
//             <span className="text-[11px] text-slate-400">•</span>
//             <span className="text-[11px] text-slate-400 truncate">{c.email}</span>
//           </div>
//           <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
//             <Phone className="w-3 h-3 text-slate-400" />
//             <span className="truncate">{c.phone}</span>
//           </div>
//           <div className="text-xs text-slate-500 mt-1 flex items-start gap-2">
//             <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
//             <span className="truncate">{c.address}</span>
//           </div>
//         </div>
//       </div>

//       <div className="mt-3 border-t pt-2">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2 text-xs font-medium">
//             <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
//             <span>Recent</span>
//           </div>
//           <div className="text-[11px] text-slate-400">{c.lastOrders?.length ?? 0}</div>
//         </div>

//         <div className="mt-2 space-y-2">
//           {(c.lastOrders || []).map((o) => (
//             <div key={o.id} className="flex items-center gap-2">
//               <img src={o.productThumb ?? productThumbDataUri(o.product)} alt={o.product} className="w-8 h-8 rounded-sm object-cover flex-shrink-0" />
//               <div className="min-w-0 w-full">
//                 <div className="flex items-center justify-between gap-2">
//                   <div className="text-sm text-[13px] font-medium truncate">{o.product}</div>
//                   <div className="text-sm text-[13px] font-semibold">₹ {Number(o.total || o.amount || 0).toLocaleString("en-IN")}</div>
//                 </div>
//                 <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
//                   <Clock className="w-3 h-3 text-slate-400" />
//                   <span>{o.date ? new Date(o.date).toLocaleDateString("en-IN") : ""}</span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function CustomerList() {
//   const dispatch = useDispatch();

//   // select online orders from redux (channel = "online")
//   const onlineRows = useSelector((state) => selectSalesByChannel(state, "online"));
//   const loadingOnline = useSelector(selectSalesLoadingOnline);
//   const errorOnline = useSelector(selectSalesErrorOnline);

//   // console the data as requested
//   useEffect(() => {
//     console.log("ONLINE ORDERS (redux) ->", onlineRows);
//   }, [onlineRows]);
//   useEffect(() => {
//     dispatch(fetchOnlineOrders());
//   }, []);
//   const customersFromOrders = useMemo(() => {
//     if (!Array.isArray(onlineRows) || onlineRows.length === 0) return [];

//     const map = new Map();
//     for (const o of onlineRows) {
//       // choose a stable key: prefer customer phone/email/id
//       const raw = o.raw ?? {};
//       const custName = o.customerName ?? raw.customer_name ?? raw.customer?.name ?? raw.customer_name_full ?? o.customerName ?? "Unknown";
//       const custPhone = o.customerPhone ?? raw.customer_phone ?? raw.customer?.phone ?? raw.customer_mobile ?? "-";
//       const custEmail = raw.customer?.email ?? raw.customer_email ?? "-";
//       const key = String(raw.customer?.id ?? raw.customer_id ?? custEmail ?? custPhone ?? custName).trim() || Math.random().toString(36).slice(2, 9);

//       if (!map.has(key)) {
//         map.set(key, {
//           id: key,
//           name: custName,
//           phone: custPhone,
//           email: custEmail || "-",
//           address: String(o.address ?? raw.address ?? raw.shipping_address ?? "-"),
//           avatarColor: "#6b7280",
//           lastOrders: [],
//         });
//       }

//       const entry = map.get(key);
//       const firstItem = Array.isArray(o.items) && o.items.length ? o.items[0] : null;
//       const productLabel = firstItem ? `${firstItem.name}${firstItem.qty ? ` (${firstItem.qty})` : ""}` : (raw.product_name ?? raw.title ?? "Product");
//       entry.lastOrders.push({
//         id: o.id,
//         product: productLabel,
//         productThumb: productThumbDataUri(firstItem?.name ?? productLabel),
//         total: o.amount ?? o.total ?? 0,
//         date: o.date ?? o.created_at ?? o.order_time ?? "",
//       });
//     }
//     const customers = Array.from(map.values()).map((c) => {
//       c.lastOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
//       c.lastOrders = c.lastOrders.slice(0, 4);
//       return c;
//     });

//     return customers;
//   }, [onlineRows]);
//   const customers = customersFromOrders.length ? customersFromOrders : FALLBACK_CUSTOMERS;
//   const [q, setQ] = useState("");
//   const [productFilter, setProductFilter] = useState("");
//   const productOptions = useMemo(() => {
//     const opts = new Set();
//     customers.forEach((c) => c.lastOrders.forEach((o) => opts.add(o.product)));
//     return Array.from(opts);
//   }, [customers]);
//   const filtered = useMemo(() => {
//     const term = String(q || "").trim().toLowerCase();
//     return customers.filter((c) => {
//       if (productFilter) {
//         const has = c.lastOrders.some((o) => o.product === productFilter);
//         if (!has) return false;
//       }
//       if (!term) return true;
//       return (
//         String(c.name || "").toLowerCase().includes(term) ||
//         String(c.phone || "").toLowerCase().includes(term) ||
//         String(c.address || "").toLowerCase().includes(term) ||
//         String(c.email || "").toLowerCase().includes(term)
//       );
//     });
//   }, [customers, q, productFilter]);
//   return (
//     <div className="p-4">
//       <div className="flex items-center justify-between gap-3 mb-4">
//         <div>
//           <h2 className="text-xl font-semibold">Customers</h2>
//           <div className="text-xs text-slate-500">Showing customers derived from <strong>online orders</strong>.</div>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="flex items-center bg-white border rounded-md px-2 py-1 gap-2 shadow-sm">
//             <input
//               placeholder="Search name, phone, address..."
//               className="px-2 py-1 text-sm outline-none w-56"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <button
//               onClick={() => setQ("")}
//               className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
//             >
//               Clear
//             </button>
//           </div>

//           <select
//             value={productFilter}
//             onChange={(e) => setProductFilter(e.target.value)}
//             className="text-sm border rounded-md px-2 py-1 bg-white"
//           >
//             <option value="">All products</option>
//             {productOptions.map((p) => (
//               <option key={p} value={p}>
//                 {p}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {loadingOnline ? (
//         <div className="p-6 text-center text-slate-500">Loading online customers…</div>
//       ) : errorOnline ? (
//         <div className="p-6 text-center text-red-600">Error: {String(errorOnline)}</div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//           {filtered.map((c) => (
//             <CustomerCard key={c.id} c={c} />
//           ))}

//           {filtered.length === 0 && (
//             <div className="col-span-full p-4 text-center text-slate-500 rounded-md border bg-white shadow-sm">
//               No customers match your filter.
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


// src/components/CustomerList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Eye, Phone, X, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOnlineOrders,
  selectSalesByChannel,
  selectSalesLoadingOnline,
  selectSalesErrorOnline,
} from "../redux/slices/SalesSlice";
function avatarDataUri(name, bg = "#6b7280", fg = "#fff", size = 96) {
  const initials = (name || "")
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${bg}' rx='14' />
    <text x='50%' y='50%' dy='.06em' text-anchor='middle' font-family='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
      font-weight='600' font-size='${Math.floor(size / 3.8)}' fill='${fg}'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// small product label helper (for drawer)
function formatOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((it) => `${it.name}${it.qty ? ` x${it.qty}` : ""}`).join(", ");
}

const CompactCustomerCard = ({ customer, onView }) => {
  return (
<div className="bg-white w-[260px] rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-150 p-3 flex items-center gap-3">
      <img
        src={avatarDataUri(customer.name, customer.avatarColor ?? "#6b7280")}
        alt={customer.name}
        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight truncate">{customer.name}</div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
          <Phone className="w-3 h-3 text-slate-400" />
          <span className="truncate">{customer.phone}</span>
        </div>
      </div>

      <button
        onClick={() => onView(customer)}
        title="View orders"
        className="ml-auto inline-flex items-center gap-2 px-2 py-1 rounded-md border hover:bg-slate-50 text-sm"
        aria-label={`View ${customer.name}`}
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function CustomerList() {
  const dispatch = useDispatch();
  const onlineRows = useSelector((s) => selectSalesByChannel(s, "online"));
  const loading = useSelector(selectSalesLoadingOnline);
  const error = useSelector(selectSalesErrorOnline);

  // log the data to console as requested
  useEffect(() => {
    console.log("ONLINE ROWS ->", onlineRows);
  }, [onlineRows]);

  // fetch on mount
  useEffect(() => {
    dispatch(fetchOnlineOrders());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive unique customers by phone (fallback to name+id)
  const customers = useMemo(() => {
    const map = new Map();
    (onlineRows || []).forEach((row) => {
      // prefer normalized fields shipped by your slice
      const raw = row.raw ?? {};
      const phone = String(row.customerPhone ?? raw.customer_phone ?? raw.customer_phone ?? "").trim();
      const name = String(row.customerName ?? raw.customer_name ?? raw.customer?.name ?? "Unknown").trim();
      const key = phone || String(raw.user_id ?? raw.customer_id ?? row.customerPhone ?? name) || Math.random().toString(36).slice(2, 9);

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          phone: phone || "-",
          email: raw.customer?.email ?? raw.customer_email ?? "-",
          address: String(row.address ?? raw.address ?? raw.shipping_address ?? "-"),
          avatarColor: "#6b7280",
          orders: [],
        });
      }

      const c = map.get(key);
      c.orders.push({
        id: row.id,
        date: row.date ?? row.order_time ?? raw.order_time_formatted ?? raw.order_time,
        amount: row.amount ?? row.total ?? Number(raw.total ?? 0),
        items: Array.isArray(row.items) ? row.items : (() => {
          // sometimes backend sends items as JSON string inside raw.items
          try {
            const parsed = typeof raw.items === "string" ? JSON.parse(raw.items) : raw.items;
            return Array.isArray(parsed) ? parsed.map(it => ({ name: it.name ?? it.product_name ?? "Item", qty: Number(it.quantity ?? it.qty ?? 1), price: Number(it.price_rupees ?? it.price ?? it.price_paise ? Number(it.price_paise) / 100 : 0) })) : [];
          } catch {
            return [];
          }
        })(),
        raw: row.raw ?? raw,
        address: row.address ?? raw.address ?? "-",
        status: row.status ?? "Unknown",
      });
    });

    // sort orders descending by date
    const out = Array.from(map.values()).map((c) => {
      c.orders.sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return db - da;
      });
      return c;
    });

    return out;
  }, [onlineRows]);

  // search/filter small UI
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = (q || "").toLowerCase().trim();
    if (!term) return customers;
    return customers.filter((c) => {
      return (
        String(c.name || "").toLowerCase().includes(term) ||
        String(c.phone || "").toLowerCase().includes(term)
      );
    });
  }, [customers, q]);

  // drawer state
  const [openCustomer, setOpenCustomer] = useState(null);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          {/* <h2 className="text-xl font-semibold">Customers</h2>
          <div className="text-xs text-slate-500">Click eye to view full order history in the sidebar.</div> */}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border rounded-md px-2 py-1 gap-2 shadow-sm">
            <input
              placeholder="Search name or phone..."
              className="px-2 py-1 text-sm outline-none w-48"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button onClick={() => setQ("")} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="p-6 text-center text-slate-500">Loading customers...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">Error loading orders: {String(error)}</div>
      ) : (
  <div style={{display:"flex",alignItems:"center",gap:10}}>
          {filtered.length === 0 ? (
            <div className="col-span-full p-4 text-center text-slate-500 rounded-md border bg-white shadow-sm">
              No customers found.
            </div>
          ) : (
            filtered.map((c) => (
              <CompactCustomerCard
                key={c.id}
                customer={{
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  avatarColor: c.avatarColor,
                }}
                onView={() => setOpenCustomer(c)}
              />
            ))
          )}
        </div>
      )}

      {/* Drawer / Sidebar */}
      {openCustomer && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpenCustomer(null)}
            aria-hidden
          />
          <aside className="fixed top-0 right-0 z-50 h-full w-[420px] max-w-full bg-white shadow-2xl overflow-auto">
            <div className="p-4 border-b flex items-center gap-3">
              <img
                src={avatarDataUri(openCustomer.name, openCustomer.avatarColor)}
                alt={openCustomer.name}
                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{openCustomer.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{openCustomer.phone}</div>
              </div>
              <button onClick={() => setOpenCustomer(null)} className="ml-auto inline-flex items-center justify-center p-2 rounded border hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-slate-600 font-medium">Address</div>
                <div className="mt-1 text-sm text-slate-700">{openCustomer.address ?? "—"}</div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 font-medium">Orders ({openCustomer.orders.length})</div>
                  <div className="text-xs text-slate-400">Most recent first</div>
                </div>

                <div className="mt-3 space-y-3">
                  {openCustomer.orders.map((o) => (
                    <div key={o.id} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Order #{o.id}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{o.date ? new Date(o.date).toLocaleString("en-IN") : "—"}</span>
                          </div>
                        </div>
                        <div className="text-sm font-semibold">₹ {Number(o.amount || 0).toLocaleString("en-IN")}</div>
                      </div>

                      <div className="mt-2 text-sm text-slate-700">
                        <div className="text-xs text-slate-500">Items</div>
                        <div className="mt-1">{formatOrderItems(o.items)}</div>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        <div><strong>Address:</strong> {o.address ?? openCustomer.address ?? "—"}</div>
                        <div className="mt-1"><strong>Status:</strong> {o.status ?? "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
