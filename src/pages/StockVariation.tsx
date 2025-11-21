
import React, { useMemo, useState } from "react";
import { Edit3, PlusCircleIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExpenseRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  mode: "Cash" | "UPI" | "Card" | "Bank";
  vendor?: string;
  note?: string;
};

const SAMPLE_EXPENSES: ExpenseRecord[] = [
  { id: "e1", date: "2025-09-08", category: "Fuel", amount: 3200, mode: "Cash", vendor: "HPCL", note: "Van #2" },
  { id: "e2", date: "2025-09-08", category: "Snacks", amount: 450, mode: "UPI", vendor: "Local Store" },
  { id: "e3", date: "2025-09-09", category: "Maintenance", amount: 5200, mode: "Bank", vendor: "Garage" },
  { id: "e4", date: "2025-09-09", category: "Fuel", amount: 2800, mode: "Card", vendor: "BPCL" },
  { id: "e5", date: "2025-09-10", category: "Rent", amount: 25000, mode: "Bank", vendor: "Landlord" },
  { id: "e6", date: "2025-09-10", category: "Utilities", amount: 3800, mode: "UPI", vendor: "TSNPDCL" },
  { id: "e7", date: "2025-09-10", category: "Fuel", amount: 3100, mode: "Cash", vendor: "HPCL" },
  { id: "e8", date: "2025-09-11", category: "Salaries", amount: 72000, mode: "Bank", vendor: "Payroll" },
  { id: "e9", date: "2025-09-11", category: "Misc", amount: 900, mode: "UPI", note: "Office supplies" },
];

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function StockVariation({ data }: { data?: ExpenseRecord[] }) {
  // data source (mutable local state so added expenses reflect immediately)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(data ?? SAMPLE_EXPENSES);

  // drawer / form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    date: string;
    category: string;
    newCategory?: string;
    amount: string;
    mode: string;
    vendor: string;
    note: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    newCategory: "",
    amount: "",
    mode: "Cash",
    vendor: "",
    note: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

  // helper to update form fields
  const updateForm = (k: string, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
    setFormErrors((e) => ({ ...e, [k]: undefined }));
  };

  // open drawer for add
  const openAdd = () => {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: "",
      newCategory: "",
      amount: "",
      mode: "Cash",
      vendor: "",
      note: "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // open drawer for edit
  const openEdit = (id: string) => {
    const item = expenses.find((x) => x.id === id);
    if (!item) return;
    setEditingId(id);
    setForm({
      date: item.date,
      category: item.category,
      newCategory: "",
      amount: String(item.amount),
      mode: item.mode,
      vendor: item.vendor ?? "",
      note: item.note ?? "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  // add/update expense handler
  const handleSaveExpense = (e?: React.FormEvent) => {
    e?.preventDefault();
    const errors: Partial<Record<string, string>> = {};

    const date = form.date?.trim();
    const category = form.category === "___NEW___" ? (form.newCategory || "").trim() : form.category.trim();
    const amountNum = Number(form.amount);

    if (!date) errors.date = "Date required";
    if (!category) errors.category = "Category required";
    if (!form.amount) errors.amount = "Amount required";
    else if (Number.isNaN(amountNum) || amountNum <= 0) errors.amount = "Enter positive number";

    if (!form.mode) errors.mode = "Mode required";

    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    if (editingId) {
      // update
      setExpenses((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                date,
                category,
                amount: amountNum,
                mode: form.mode as ExpenseRecord["mode"],
                vendor: form.vendor?.trim() || undefined,
                note: form.note?.trim() || undefined,
              }
            : it
        )
      );
    } else {
      // new
      const newItem: ExpenseRecord = {
        id: `x${Date.now()}`,
        date,
        category,
        amount: amountNum,
        mode: form.mode as ExpenseRecord["mode"],
        vendor: form.vendor?.trim() || undefined,
        note: form.note?.trim() || undefined,
      };
      setExpenses((prev) => [newItem, ...prev]);
    }

    // close drawer and reset
    setDrawerOpen(false);
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: "",
      newCategory: "",
      amount: "",
      mode: "Cash",
      vendor: "",
      note: "",
    });
  };

  // delete handler
  const handleDelete = (id: string) => {
    const item = expenses.find((x) => x.id === id);
    if (!item) return;
    const ok = window.confirm(`Delete expense ${item.category} • ${formatINR(item.amount)} on ${item.date}?`);
    if (!ok) return;
    setExpenses((prev) => prev.filter((p) => p.id !== id));
  };

  // flat filtered view (no filters shown per request)
  const filtered = useMemo(() => expenses, [expenses]);

  const grandTotal = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Expenses</h3>
          <p className="text-xs text-slate-500">Showing <span className="font-medium">{filtered.length}</span> items</p>
        </div>
        <div>
          {/* <button onClick={openAdd} className="bg-amber-500 text-white px-4 py-2 rounded shadow">
            + Add Expense
          </button> */}

           <Button onClick={openAdd} className="flex items-center gap-2 ml-0 sm:ml-2 mt-2 sm:mt-0" aria-haspopup="dialog">
              <PlusCircleIcon className="w-4 h-4" />
              Add Expenses
            </Button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y table-fixed">
          <thead className="bg-white">
            <tr className="text-left text-xs text-slate-500">
              <th className="p-3 w-12">S.no</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category (id)</th>
              <th className="p-3">Grams</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Discount</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((r, idx) => {
              // create placeholders to mimic the product table columns in image
              const grams = Math.floor(Math.random() * 600) + 20; // placeholder
              const price = r.amount;
              const discount = Math.round(price * 0.1); // placeholder discount
              const stock = Math.max(0, Math.floor(Math.random() * 600)); // placeholder

              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 align-middle">{idx + 1}</td>
                  {/* Name */}
                  <td className="p-3 align-middle font-medium">
                    {r.category}_TESTING
                    <div className="text-xs text-slate-500">{r.vendor ?? ""}</div>
                  </td>

                  {/* Category (id) */}
                  <td className="p-3 align-middle text-slate-600">Grains (32)</td>

                  {/* Grams */}
                  <td className="p-3 align-middle">{grams}</td>

                  {/* Price */}
                  <td className="p-3 text-right align-middle font-medium">{formatINR(price)}</td>

                  {/* Discount */}
                  <td className="p-3 text-right align-middle">
                    <div className="font-medium">{formatINR(discount)}</div>
                    <div className="text-xs text-slate-400">Saved {formatINR(price - discount)}</div>
                  </td>

                  {/* Stock */}
                  <td className="p-3 text-right align-middle">{stock}</td>

                  {/* Actions */}
                  <td className="p-3 text-center align-middle">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => openEdit(r.id)}
                        title="Edit"
                        className="p-2 rounded hover:bg-slate-100"
                        aria-label={`Edit ${r.id}`}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Delete"
                        className="p-2 rounded hover:bg-red-50 text-red-600"
                        aria-label={`Delete ${r.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand total footer */}
          <tfoot>
            <tr className="bg-slate-50">
              <td className="p-3" colSpan={5} />
              <td className="p-3 text-right font-semibold">Grand total</td>
              <td className="p-3 text-right font-semibold">{formatINR(grandTotal)}</td>
              <td className="p-3" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* RIGHT-SIDE DRAWER */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">{editingId ? "Edit Expense" : "Add Expense"}</h4>
            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      date: new Date().toISOString().slice(0, 10),
                      category: "",
                      newCategory: "",
                      amount: "",
                      mode: "Cash",
                      vendor: "",
                      note: "",
                    });
                    setFormErrors({});
                  }}
                  className="text-sm px-2 py-1 border rounded"
                >
                  New
                </button>
              )}
              <button onClick={() => setDrawerOpen(false)} className="px-2 py-1 rounded text-slate-600">
                Close
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-3 overflow-auto pb-6">
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">Date</label>
              <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="border rounded p-2" />
              {formErrors.date && <p className="text-xs text-red-600 mt-1">{formErrors.date}</p>}
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600">Category</label>
              <div className="flex gap-2">
                <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} className="border rounded p-2 flex-1">
                  <option value="">Select category</option>
                  {Array.from(new Set(expenses.map((c) => c.category)))
                    .sort()
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  <option value="___NEW___">-- Add new category --</option>
                </select>
                {form.category === "___NEW___" && (
                  <input
                    placeholder="New category"
                    value={form.newCategory}
                    onChange={(e) => updateForm("newCategory", e.target.value)}
                    className="border rounded p-2 w-48"
                  />
                )}
              </div>
              {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col">
                <label className="text-xs text-slate-600">Amount</label>
                <input placeholder="0" value={form.amount} onChange={(e) => updateForm("amount", e.target.value)} className="border rounded p-2" inputMode="decimal" />
                {formErrors.amount && <p className="text-xs text-red-600 mt-1">{formErrors.amount}</p>}
              </div>

              <div className="w-40 flex flex-col">
                <label className="text-xs text-slate-600">Mode</label>
                <select value={form.mode} onChange={(e) => updateForm("mode", e.target.value)} className="border rounded p-2">
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank">Bank</option>
                </select>
                {formErrors.mode && <p className="text-xs text-red-600 mt-1">{formErrors.mode}</p>}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600">Vendor</label>
              <input value={form.vendor} onChange={(e) => updateForm("vendor", e.target.value)} className="border rounded p-2" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600">Note</label>
              <input value={form.note} onChange={(e) => updateForm("note", e.target.value)} className="border rounded p-2" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button type="submit" className="bg-amber-500 text-white px-4 py-2 rounded">
                {editingId ? "Save changes" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    date: new Date().toISOString().slice(0, 10),
                    category: "",
                    newCategory: "",
                    amount: "",
                    mode: "Cash",
                    vendor: "",
                    note: "",
                  })
                }
                className="border px-3 py-2 rounded"
              >
                Reset
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!editingId) return;
                    const ok = window.confirm("Delete this expense?");
                    if (!ok) return;
                    handleDelete(editingId);
                    setDrawerOpen(false);
                  }}
                  className="border px-3 py-2 rounded text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}



