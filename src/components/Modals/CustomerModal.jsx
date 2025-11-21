import React, { useEffect, useState } from "react";

export default function CustomerModal({
  open,
  onClose,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  paymentMethod,
  setPaymentMethod,
  onSave,
}) {
  const [localName, setLocalName] = useState(customerName);
  const [localPhone, setLocalPhone] = useState(customerPhone);
  const [localPayment, setLocalPayment] = useState(paymentMethod || "");
  const [error, setError] = useState("");

  // sync when open / parent changes
  useEffect(() => {
    if (open) {
      setLocalName(customerName || "");
      setLocalPhone(customerPhone || "");
      setLocalPayment(paymentMethod || "");
      setError("");
    }
  }, [open, customerName, customerPhone, paymentMethod]);

  const validPhone = (p) => p.replace(/\D/g, "").length >= 10;
  const validName = (n) => n.trim().length > 0;

  function handleSave() {
    if (!validName(localName)) {
      setError("Enter customer name");
      return;
    }
    if (!validPhone(localPhone)) {
      setError("Enter valid phone (min 10 digits)");
      return;
    }
    if (!localPayment) {
      setError("Select payment method");
      return;
    }

    // push to parent controlled state
    setCustomerName(localName.trim());
    setCustomerPhone(localPhone.trim());
    setPaymentMethod(localPayment);

    // parent callback (if any)
    if (typeof onSave === "function") onSave();

    onClose();
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 mr-25">
      <div   className="absolute inset-0 bg-white/50 border border-black" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-5 z-10">
        <div className="flex items-start justify-between gap-4" >
          <h3 className="text-lg font-semibold">Customer details</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Customer name</label>
            <input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Customer name"
              className="w-full p-2 border rounded"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-1">WhatsApp Number</label>
            <input
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              placeholder="9866******"
              className="w-full p-2 border rounded"
              inputMode="tel"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-1">Payment</label>
            <select
              value={localPayment}
              onChange={(e) => setLocalPayment(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="">Select payment</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-emerald-600 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
