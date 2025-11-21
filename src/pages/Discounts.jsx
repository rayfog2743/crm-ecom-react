
// import { useState, useMemo } from "react";
// export default function Discounts() {
//   // Sample product to preview discount
//   const sampleProduct = {
//     id: 1,
//     title: "Vintage Leather Jacket",
//     price: 249.99,
//     image:
//       "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60",
//   };

//   // Form state
//   const [title, setTitle] = useState("Spring Sale");
//   const [type, setType] = useState("percentage"); // 'percentage' or 'fixed'
//   const [amount, setAmount] = useState(20); // percent or fixed amount
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [applyTo, setApplyTo] = useState("all"); // 'all' | 'product' | 'category'
//   const [couponCode, setCouponCode] = useState("");
//   const [stackable, setStackable] = useState(false);
//   const [active, setActive] = useState(true);

//   // Small helpers
//   const formatCurrency = (n) => {
//     return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
//   };

//   const discountedPrice = useMemo(() => {
//     if (type === "percentage") {
//       const pct = Math.max(0, Math.min(100, Number(amount) || 0));
//       return +(sampleProduct.price * (1 - pct / 100)).toFixed(2);
//     }
//     // fixed
//     const fixed = Number(amount) || 0;
//     return Math.max(0, +(sampleProduct.price - fixed).toFixed(2));
//   }, [type, amount, sampleProduct.price]);

//   const generateCoupon = () => {
//     const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoid ambiguous characters
//     let code = "";
//     for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
//     setCouponCode(code);
//   };

//   const isValid = () => {
//     // basic validation: amount > 0 and title present
//     return title.trim().length > 0 && Number(amount) > 0;
//   };

//   const handleApply = (e) => {
//     e.preventDefault();
//     if (!isValid()) return alert("Please provide a discount title and valid amount.");
//     // In a real app you'd call your API here. We'll just show a toast-like alert.
//     alert(`Discount "${title}" saved. ${active ? "(Active)" : "(Inactive)"}`);
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <div style={{display:"flex",flexDirection:"row",gap:20}} >
//         {/* Form */}
//         <form onSubmit={handleApply} className="bg-white rounded-2xl shadow p-6">
//           <div className="flex items-start justify-between mb-4">
//             <div>
//               <h2 className="text-2xl font-semibold">Create Discount</h2>
//               <p className="text-sm text-gray-500">Set up discounts, coupon codes and preview the result.</p>
//             </div>
//             <div className="flex items-center gap-3">
//               <label className="flex items-center gap-2 text-sm">Active
//                 <input
//                   type="checkbox"
//                   checked={active}
//                   onChange={() => setActive((s) => !s)}
//                   className="ml-2 h-4 w-4 rounded"
//                 />
//               </label>
//               <label className="flex items-center gap-2 text-sm">Stackable
//                 <input
//                   type="checkbox"
//                   checked={stackable}
//                   onChange={() => setStackable((s) => !s)}
//                   className="ml-2 h-4 w-4 rounded"
//                 />
//               </label>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Discount Title</label>
//               <input
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 placeholder="e.g. Spring Sale"
//                 className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 p-2"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Apply to</label>
//               <select
//                 value={applyTo}
//                 onChange={(e) => setApplyTo(e.target.value)}
//                 className="mt-1 block w-full rounded-md border-gray-200 p-2"
//               >
//                 <option value="all">All products</option>
//                 <option value="product">Specific product</option>
//                 <option value="category">Category</option>
//               </select>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Type</label>
//                 <div className="mt-1 flex items-center gap-3">
//                   <label className={`px-3 py-2 rounded-md border ${type === "percentage" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
//                     <input
//                       type="radio"
//                       name="dtype"
//                       checked={type === "percentage"}
//                       onChange={() => setType("percentage")}
//                       className="mr-2"
//                     />
//                     Percentage
//                   </label>

//                   <label className={`px-3 py-2 rounded-md border ${type === "fixed" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
//                     <input
//                       type="radio"
//                       name="dtype"
//                       checked={type === "fixed"}
//                       onChange={() => setType("fixed")}
//                       className="mr-2"
//                     />
//                     Fixed amount
//                   </label>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Amount</label>
//                 <input
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   type="number"
//                   min="0"
//                   step="any"
//                   className="mt-1 block w-full rounded-md border-gray-200 p-2"
//                 />
//                 <p className="text-xs text-gray-400 mt-1">{type === "percentage" ? "Enter a percentage (0-100)" : "Enter fixed amount in USD"}</p>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Start date</label>
//                 <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="mt-1 block w-full rounded-md border-gray-200 p-2" />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">End date</label>
//                 <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="mt-1 block w-full rounded-md border-gray-200 p-2" />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Coupon code (optional)</label>
//               <div className="mt-1 flex gap-2">
//                 <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="MANUALCODE or generate" className="flex-1 rounded-md border-gray-200 p-2" />
//                 <button
//                   type="button"
//                   onClick={generateCoupon}
//                   className="shrink-0 px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100"
//                 >
//                   Generate
//                 </button>
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 pt-2">
//               <button type="button" onClick={() => {
//                 // reset to defaults
//                 setTitle("Spring Sale"); setType("percentage"); setAmount(20); setStartDate(""); setEndDate(""); setCouponCode(""); setStackable(false); setActive(true);
//               }} className="px-4 py-2 rounded-md border">Reset</button>

//               <button disabled={!isValid()} type="submit" className={`px-4 py-2 rounded-md text-white ${isValid() ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"}`}>
//                 Save Discount
//               </button>
//             </div>
//           </div>
//         </form>

//         {/* Preview */}
//         <div className="bg-gray-50 rounded-2xl shadow p-6 flex flex-col gap-6">
//           <div>
//             <h3 className="text-lg font-semibold">Preview</h3>
//             <p className="text-sm text-gray-500">See how the discount will look on a product card.</p>
//           </div>

//           <div className="flex flex-col md:flex-row gap-6 items-stretch">
//             {/* Product Card */}
//             <div className="w-full md:w-1/2 bg-white rounded-xl shadow-sm overflow-hidden">
//               <img src={sampleProduct.image} alt="product" className="w-full h-48 object-cover" />
//               <div className="p-4">
//                 <h4 className="font-semibold">{sampleProduct.title}</h4>
//                 <div className="mt-2 flex items-baseline gap-3">
//                   <div className="text-sm text-gray-500 line-through">{formatCurrency(sampleProduct.price)}</div>
//                   <div className="text-xl font-bold">{formatCurrency(discountedPrice)}</div>
//                 </div>
//                 <div className="mt-3 text-xs text-gray-600">{type === "percentage" ? `${amount}% off` : `${formatCurrency(amount)} off`} {couponCode ? `(code: ${couponCode})` : ""}</div>
//               </div>
//             </div>

//             {/* Summary Card */}
//             <div className="flex-1 bg-white rounded-xl p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-sm text-gray-500">Discount</div>
//                   <div className="text-lg font-semibold">{title}</div>
//                 </div>
//                 <div className={`text-sm px-3 py-1 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{active ? "Active" : "Inactive"}</div>
//               </div>

//               <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
//                 <div>
//                   <div className="font-medium">Type</div>
//                   <div className="mt-1">{type === "percentage" ? "Percentage" : "Fixed"}</div>
//                 </div>
//                 <div>
//                   <div className="font-medium">Apply to</div>
//                   <div className="mt-1">{applyTo === "all" ? "All products" : applyTo === "product" ? "Product" : "Category"}</div>
//                 </div>
//                 <div>
//                   <div className="font-medium">Dates</div>
//                   <div className="mt-1 text-gray-500 text-xs">{startDate || "—"} → {endDate || "—"}</div>
//                 </div>
//                 <div>
//                   <div className="font-medium">Stackable</div>
//                   <div className="mt-1">{stackable ? "Yes" : "No"}</div>
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <div className="text-sm font-medium">Coupon</div>
//                 <div className="mt-1 text-gray-700">{couponCode || "No coupon"}</div>
//               </div>

//               <div className="mt-6 flex gap-3">
//                 <button onClick={() => navigator.clipboard?.writeText(JSON.stringify({ title, type, amount, couponCode }))} className="px-3 py-2 rounded-md border">Copy JSON</button>
//                 <button onClick={() => alert('Preview: discount applied to sample product. In your app call your API to persist.') } className="px-3 py-2 rounded-md bg-indigo-600 text-white">Apply to product</button>
//               </div>
//             </div>
//           </div>

//           <div className="text-xs text-gray-400">Tip: integrate the Save Discount handler with your server/API. This component is UI-only and meant for quick iteration.</div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react";

const initialCoupons = [
  { code: "WELCOME10", percent: 10 },
  { code: "SPRING20", percent: 20 },
  { code: "FESTIVE30", percent: 30 },
];

export default function Discounts() {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingIndex, setEditingIndex] = useState(null);

  const resetForm = () => {
    setCouponCode("");
    setDiscountPercent("");
    setEditingIndex(null);
  };

  const handleAddOrSave = () => {
    const code = (couponCode || "").trim().toUpperCase();
    const percent = Number(discountPercent);

    if (!code || discountPercent === "" || discountPercent === null) {
      alert("Please enter both fields!");
      return;
    }
    if (Number.isNaN(percent) || percent <= 0 || percent > 100) {
      alert("Please enter a valid percent (1-100).");
      return;
    }

    // Editing branch
    if (editingIndex !== null) {
      setCoupons((prev) => {
        // duplicate check except the current editing index
        const duplicate = prev.find((c, i) => c.code === code && i !== editingIndex);
        if (duplicate) {
          alert("Coupon code already exists.");
          return prev;
        }
        const copy = prev.slice();
        copy[editingIndex] = { code, percent };
        return copy;
      });
      alert(`Coupon "${code}" updated.`);
      resetForm();
      return;
    }

    // Add new coupon (check duplicate)
    if (coupons.some((c) => c.code === code)) {
      alert("Coupon code already exists.");
      return;
    }

    setCoupons((prev) => [{ code, percent }, ...prev]);
    alert(`Coupon "${code}" with ${percent}% discount added successfully.`);
    resetForm();
  };

  const handleEdit = (idx) => {
    const c = coupons[idx];
    if (!c) return;
    setCouponCode(c.code);
    setDiscountPercent(String(c.percent));
    setEditingIndex(idx);
  };

  const handleDelete = (idx) => {
    const c = coupons[idx];
    if (!c) return;
    const confirmed = window.confirm(`Delete coupon "${c.code}"? This action cannot be undone.`);
    if (!confirmed) return;
    setCoupons((prev) => prev.filter((_, i) => i !== idx));
    // if we were editing this coupon, reset form
    if (editingIndex === idx) resetForm();
  };

  const handleCancelEdit = () => resetForm();
  return (
    <div className="p-6">
   <div className="w-1/2 md:w-1/2 mx-auto bg-white p-7 rounded-xl shadow-md mt-20 m-5">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Coupons</h2>
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: Form */}
        <div className="flex-1 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-medium mb-3">{editingIndex !== null ? "Edit Coupon" : "Add Coupon"}</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. NEWUSER10"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g. 10"
                min="1"
                max="100"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddOrSave}
                className="flex-1 mt-1 bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 transition"
              >
                {editingIndex !== null ? "Save Coupon" : "Add Coupon"}
              </button>

              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-32 mt-1 px-3 py-2 rounded-md border bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
        <aside className="w-full md:w-96 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-medium mb-3">Available Coupons</h3>

          {coupons.length === 0 ? (
            <div className="text-sm text-gray-500">No coupons available.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {coupons.map((coupon, idx) => (
                <li
                  key={`${coupon.code}-${idx}`}
                  className="py-3 flex items-center justify-between text-sm text-gray-700"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{coupon.code}</div>
                    <div className="text-slate-500 text-xs">• {coupon.percent}% off</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(idx)}
                      className="px-2 py-1 rounded border text-sm hover:bg-slate-50"
                      title={`Edit ${coupon.code}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="px-2 py-1 rounded border text-sm hover:bg-slate-50"
                      title={`Delete ${coupon.code}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
    </div>
  );
}

