
import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  PlusCircle,
  Search,
  Download,
  ChevronDown,
  X,
  Edit2,
  Trash2,
  Check,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/api/axios";

// console.log("aaaa",api.defaults.baseURL);

const API_BASE = api.defaults.baseURL;
const TOKEN_KEY = localStorage.getItem("token")
const FILE_BASE = API_BASE.replace(/\/api\/?$/, "");

type RawExpense = Record<string, any>;

export type Expense = {
  raw: RawExpense;
  id: number | string | null;
  date: string | null;
  category_id: number | string | null;
  category_name: string | null;
  amount: number;
  mode: string | null;
  vendor_name: string;
  description: string;
  proof: string | null;
  proof_raw: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Category = {
  id: number | string;
  name: string;
};

type FormState = {
  date: string;
  category_id: string | number;
  amount: string;
  mode: string;
  vendor_name: string;
  description: string;
  proofFile: File | null;
};

const getTokenHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatCurrency = (n?: number) =>
  n === null || n === undefined ? "-" : `₹ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpenseSummary(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const perPage = 10;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().slice(0, 10),
    category_id: "",
    amount: "",
    mode: "cash",
    vendor_name: "",
    description: "",
    proofFile: null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [catModalOpen, setCatModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [creatingCategory, setCreatingCategory] = useState<boolean>(false);

  // category edit mode state
  const [editingCategoryId, setEditingCategoryId] = useState<number | string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    void fetchExpenses();
    void fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Expenses -------------------- */
  const fetchExpenses = async (): Promise<void> => {
    setLoading(true);
    const tId = toast.loading("Loading expenses...");
    try {
      const res = await fetch(`${API_BASE}/admin/expanses`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...getTokenHeader(),
        },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = json?.message ?? json?.error ?? `Failed to load (${res.status})`;
        toast.error(message);
        throw new Error(message);
      }

      let list: unknown[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json?.data)) list = json.data;
      else {
        const arr = Object.values(json ?? {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) list = arr as unknown[];
      }

      const normalized: Expense[] = (list as RawExpense[]).map((r) => {
        const proofRaw: string | null = r.proof_url ?? r.proof ?? null;
        let proof: string | null = null;
        if (proofRaw) {
          if (/^https?:\/\//.test(proofRaw)) proof = proofRaw;
          else {
            const clean = proofRaw.replace(/^\/+/, "");
            proof = `${FILE_BASE}/${clean}`;
          }
        }

        return {
          raw: r,
          id: r.id ?? r._id ?? null,
          date: r.date ?? r.spent_on ?? null,
          category_id: r.category_id ?? r.category?.id ?? null,
          category_name: r.category?.name ?? (r.category ? String(r.category) : null),
          amount: Number(r.amount ?? r.amt ?? 0),
          mode: r.mode ?? r.payment ?? null,
          vendor_name: String(r.vendor_name ?? r.requestedBy ?? r.bill ?? r.vendor ?? ""),
          description: String(r.description ?? r.note ?? r.remarks ?? ""),
          proof,
          proof_raw: proofRaw,
          created_at: r.created_at ?? r.createdAt ?? null,
          updated_at: r.updated_at ?? r.updatedAt ?? null,
        } as Expense;
      });

      setExpenses(normalized);
      toast.dismiss(tId);
      toast.success("Expenses loaded");
    } catch (err: any) {
      console.error("fetchExpenses error:", err);
      toast.dismiss();
      toast.error(err?.message ?? "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Categories (use provided APIs) -------------------- */
  const fetchCategories = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/admin/expanses-category`, {
        method: "GET",
        headers: { Accept: "application/json", ...getTokenHeader() },
      });
      const json = await res.json().catch(() => null);
      let list: any[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json?.data)) list = json.data;
      else {
        const arr = Object.values(json ?? {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) list = arr as any[];
      }

      if (Array.isArray(list)) {
        setCategories(list.map((c) => ({ id: c.id ?? c._id, name: c.name ?? c.title ?? String(c) })));
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("fetchCategories error:", err);
      setCategories([]);
    }
  };

  const createCategory = async (name: string): Promise<{ id?: any; name?: string } | null> => {
    if (!name || !name.trim()) {
      toast.error("Category name required");
      return null;
    }
    setCreatingCategory(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      const res = await fetch(`${API_BASE}/admin/expanses-category/add`, {
        method: "POST",
        headers: { ...getTokenHeader() },
        body: fd,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Create category failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      if (json && json.status === false) {
        const msg = json.message ?? "Failed creating category";
        toast.error(msg);
        throw new Error(msg);
      }

      const created = json?.data ?? json?.category ?? json ?? null;
      let createdId = created?.id ?? created?.ID ?? created?.category_id ?? null;
      let createdName = created?.name ?? (typeof created === "string" ? created : null);

      if (!createdId && Array.isArray(json?.data) && json.data.length === 1) {
        createdId = json.data[0]?.id ?? json.data[0]?._id;
        createdName = json.data[0]?.name ?? createdName;
      }

      await fetchCategories();
      setCatModalOpen(false);
      toast.success("Category created");

      if (createdId != null) {
        setForm((f) => ({ ...f, category_id: String(createdId) }));
      } else if (createdName) {
        const found = categories.find((c) => String(c.name).toLowerCase() === String(createdName).toLowerCase());
        if (found) setForm((f) => ({ ...f, category_id: String(found.id) }));
      }

      return { id: createdId, name: createdName };
    } catch (err: any) {
      console.error("createCategory error:", err);
      toast.error(err?.message ?? "Failed to create category");
      return null;
    } finally {
      setCreatingCategory(false);
    }
  };

  /* -------------------- Update category -------------------- */
  const updateCategory = async (id: number | string, name: string): Promise<boolean> => {
    if (!id) {
      toast.error("Invalid category id");
      return false;
    }
    if (!name || !name.trim()) {
      toast.error("Category name required");
      return false;
    }
    const tokenHeader = getTokenHeader();
    if (!tokenHeader.Authorization) {
      toast.error("Not logged in — token missing.");
      return false;
    }
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      const res = await fetch(`${API_BASE}/admin/expanses-category/update/${id}`, {
        method: "POST",
        headers: { ...tokenHeader },
        body: fd,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Update failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      if (json && json.status === false) {
        const msg = json.message ?? "Update failed";
        toast.error(msg);
        throw new Error(msg);
      }

      await fetchCategories();
      toast.success("Category updated");
      // if updated category is selected in expense form, update its name in UI by refetch (done above)
      return true;
    } catch (err: any) {
      console.error("updateCategory error:", err);
      toast.error(err?.message ?? "Failed to update category");
      return false;
    }
  };

  /* -------------------- Delete category -------------------- */
  const deleteCategory = async (id: number | string): Promise<boolean> => {
    if (!id) {
      toast.error("Invalid category id");
      return false;
    }
    if (!confirm("Delete this category? This action cannot be undone.")) return false;
    const tokenHeader = getTokenHeader();
    if (!tokenHeader.Authorization) {
      toast.error("Not logged in — token missing.");
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/expanses-category/delete/${id}`, {
        method: "DELETE",
        headers: { ...tokenHeader },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Delete failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      if (json && json.status === false) {
        const msg = json.message ?? "Delete failed";
        toast.error(msg);
        throw new Error(msg);
      }

      // refresh categories
      await fetchCategories();
      toast.success("Category deleted");

      // if deleted category was selected in the expense form, clear selection
      setForm((f) => {
        if (String(f.category_id) === String(id)) {
          return { ...f, category_id: "" };
        }
        return f;
      });

      return true;
    } catch (err: any) {
      console.error("deleteCategory error:", err);
      toast.error(err?.message ?? "Failed to delete category");
      return false;
    }
  };

  /* -------------------- Form validation & handlers -------------------- */
  const validateForm = (values: FormState): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!values.date) errs.date = "Date is required";
    if (!values.category_id) errs.category_id = "Category required";
    if (!values.amount || Number(values.amount) <= 0) errs.amount = "Amount must be greater than 0";
    if (!values.mode) errs.mode = "Mode required";
    if (!values.vendor_name || !values.vendor_name.trim()) errs.vendor_name = "Bill is required";
    return errs;
  };

  const openCreateModal = (): void => {
    setEditing(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category_id: categories.length ? categories[0].id : "",
      amount: "",
      mode: "cash",
      vendor_name: "",
      description: "",
      proofFile: null,
    });
    setPreviewUrl("");
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (row: Expense): void => {
    setEditing(row);
    setForm({
      date: row.date ? row.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      category_id: row.category_id ?? "",
      amount: String(row.amount ?? ""),
      mode: row.mode ?? "cash",
      vendor_name: row.vendor_name ?? "",
      description: row.description ?? "",
      proofFile: null,
    });
    setPreviewUrl(row.proof ?? "");
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value } as FormState));
    setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0] ?? null;
    setForm((p) => ({ ...p, proofFile: f }));
    if (f) {
      try {
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
      } catch {
        setPreviewUrl("");
      }
    } else {
      setPreviewUrl(editing?.proof ?? "");
    }
  };

  const handleSubmit = async (ev?: FormEvent<HTMLFormElement>): Promise<void> => {
    ev?.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      toast.error("Please fix the form errors");
      return;
    }

    const tokenHeader = getTokenHeader();
    if (!tokenHeader.Authorization) {
      toast.error("Not logged in — token missing.");
      return;
    }

    setBusy(true);
    const toastId = toast.loading(editing ? "Updating expense..." : "Creating expense...");

    try {
      const fd = new FormData();
      fd.append("date", form.date);
      fd.append("category_id", String(form.category_id ?? ""));
      fd.append("amount", String(form.amount ?? ""));
      fd.append("mode", String(form.mode ?? "cash"));
      fd.append("vendor_name", String(form.vendor_name ?? ""));
      fd.append("description", String(form.description ?? ""));
      if (form.proofFile) fd.append("proof", form.proofFile);

      let res: Response;
      if (editing) {
        res = await fetch(`${API_BASE}/admin/expanses/update/${editing.id}`, {
          method: "POST",
          headers: { ...tokenHeader },
          body: fd,
        });
      } else {
        res = await fetch(`${API_BASE}/admin/expanses/add`, {
          method: "POST",
          headers: { ...tokenHeader },
          body: fd,
        });
      }

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      if (json && json.status === false) {
        const msg = json.message ?? "Operation failed";
        toast.error(msg);
        throw new Error(msg);
      }

      toast.dismiss(toastId);
      toast.success(editing ? "Expense updated" : "Expense created");
      await fetchExpenses();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      toast.dismiss();
      toast.error(err?.message ?? "Failed to save expense");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Expense): Promise<void> => {
    if (!row?.id) {
      toast.error("Invalid expense selected");
      return;
    }
    if (!confirm("Delete this expense? This action cannot be undone.")) return;
    const tokenHeader = getTokenHeader();
    if (!tokenHeader.Authorization) {
      toast.error("Not logged in — token missing.");
      return;
    }
    setBusy(true);
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`${API_BASE}/admin/expanses/delete/${row.id}`, {
        method: "DELETE",
        headers: { ...tokenHeader },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Delete failed (${res.status})`;
        toast.error(msg);
        throw new Error(msg);
      }
      toast.dismiss(toastId);
      toast.success("Deleted");
      await fetchExpenses();
    } catch (err: any) {
      console.error("handleDelete error:", err);
      toast.dismiss();
      toast.error(err?.message ?? "Failed to delete expense");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------- Filter / Pagination / Export -------------------- */
  const filtered = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    const sDate = startDate ? new Date(startDate) : null;
    const eDate = endDate ? new Date(endDate) : null;
    return expenses.filter((r) => {
      if (q) {
        const matchesQuery =
          String(r.vendor_name ?? "").toLowerCase().includes(q) ||
          String(r.description ?? "").toLowerCase().includes(q) ||
          String(r.amount ?? "").toLowerCase().includes(q) ||
          String(r.id ?? "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (sDate || eDate) {
        const itemDate = r.date ? new Date(r.date) : null;
        if (!itemDate) return false;
        if (sDate && itemDate < new Date(sDate.setHours(0, 0, 0, 0))) return false;
        if (eDate && itemDate > new Date(eDate.setHours(23, 59, 59, 999))) return false;
      }
      return true;
    });
  }, [expenses, search, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const exportCsv = (): void => {
    const cols = ["#", "Date", "Category", "Category ID", "Amount", "Mode", "Bill", "Description", "Proof", "Created At", "Updated At"];
    const lines = [cols.join(",")];
    filtered.forEach((r, i) => {
      const row = [
        i + 1,
        `"${r.date ?? ""}"`,
        `"${(r.category_name ?? "").replace(/"/g, '""')}"`,
        `"${String(r.category_id ?? "")}"`,
        r.amount ?? 0,
        `"${String(r.mode ?? "").replace(/"/g, '""')}"`,
        `"${(r.vendor_name ?? "").replace(/"/g, '""')}"`,
        `"${(r.description ?? "").replace(/"/g, '""')}"`,
        `"${String(r.proof_raw ?? "").replace(/"/g, '""')}"`,
        `"${r.created_at ?? ""}"`,
        `"${r.updated_at ?? ""}"`,
      ];
      lines.push(row.join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative hidden md:flex items-space-evenly gap-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by bill, description, amount..."
                className="pl-10 pr-3 py-2 border rounded-lg w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
            </div>

            <button onClick={() => { setPage(1); void fetchExpenses(); }} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Apply
            </button>
          </div>

          <button onClick={exportCsv} className="px-3 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>

          <button onClick={openCreateModal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Expenses
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-700">
              <tr>
                <th className="px-4 py-3">S.no</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                {/* <th className="px-4 py-3">Category ID</th> */}
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline-block mr-2" /> Loading...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                pageRows.map((r, idx) => (
                  <tr key={String(r.id ?? idx)} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-3">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-4 py-3">{r.date ? new Date(r.date).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{r.category_name ?? "—"}</td>
                    {/* <td className="px-4 py-3">{r.category_id ?? "—"}</td> */}
                    <td className="px-4 py-3">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3">{r.mode ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{r.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3">{r.description ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.proof ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.proof} alt="proof" className="h-12 w-20 object-cover rounded border" />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400"><ImageIcon className="w-4 h-4" /> No proof</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(r)} disabled={busy} className="p-2 rounded hover:bg-gray-100" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => void handleDelete(r)} disabled={busy} className="p-2 rounded hover:bg-gray-100 text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {r.raw?.verified && (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filtered.length} records — page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Expense" : "Add Expense"}</h3>
              <div className="flex items-center gap-2">
                {busy && <div className="text-sm text-gray-500">Processing…</div>}
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-sm text-gray-600">Date</div>
                <input name="date" type="date" value={form.date} onChange={handleInputChange} className="w-full p-2 border rounded" />
                {formErrors.date && <p className="text-xs text-red-600">{formErrors.date}</p>}
              </label>

              <label className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Category</div>
                  <button type="button" onClick={() => { setCatModalOpen(true); setEditingCategoryId(null); setEditingCategoryName(""); setNewCategoryName(""); }} className="text-xs text-indigo-600 hover:underline">+ Add Category</button>
                </div>
                <div className="relative">
                  <select name="category_id" value={String(form.category_id ?? "")} onChange={handleInputChange} className="w-full p-2 border rounded bg-white">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                {formErrors.category_id && <p className="text-xs text-red-600">{formErrors.category_id}</p>}
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-600">Amount</div>
                <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleInputChange} className="w-full p-2 border rounded" />
                {formErrors.amount && <p className="text-xs text-red-600">{formErrors.amount}</p>}
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-600">Mode</div>
                <select name="mode" value={form.mode} onChange={handleInputChange} className="w-full p-2 border rounded">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
                {formErrors.mode && <p className="text-xs text-red-600">{formErrors.mode}</p>}
              </label>

              <label className="md:col-span-2 space-y-1">
                <div className="text-sm text-gray-600">Bill (vendor name)</div>
                <input name="vendor_name" value={form.vendor_name} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="Bill / vendor name" />
                {formErrors.vendor_name && <p className="text-xs text-red-600">{formErrors.vendor_name}</p>}
              </label>

              <label className="md:col-span-2 space-y-1">
                <div className="text-sm text-gray-600">Description</div>
                <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full p-2 border rounded" rows={3} />
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-600">Proof (image / receipt)</div>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full" />
                {previewUrl ? (
                  <div className="mt-2 flex items-center gap-3">
                    {String(previewUrl).toLowerCase().endsWith(".pdf") ? (
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Open file</a>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="preview" className="h-24 w-36 object-cover rounded border" />
                    )}
                    <button type="button" onClick={() => { setPreviewUrl(""); setForm((p) => ({ ...p, proofFile: null })); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-sm text-red-600">Clear</button>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> No proof chosen</div>
                )}
              </label>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 border-t mt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button disabled={busy} type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">{busy ? "Saving…" : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {catModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingCategoryId ? "Edit Category" : "Add Category"}</h3>
              <button onClick={() => { setCatModalOpen(false); setEditingCategoryId(null); setEditingCategoryName(""); setNewCategoryName(""); }} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4">
              <label className="block text-sm text-gray-600 mb-2">Category name</label>

              {/* If editingCategoryId is set, we are in edit mode; else create */}
              {!editingCategoryId ? (
                <>
                  <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full p-2 border rounded mb-4" placeholder="e.g. Fuel, Toll" />

                  <div className="flex justify-between items-center">
                    <div>
                      <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const created = await createCategory(newCategoryName);
                          if (created && created.id != null) {
                            setForm((f) => ({ ...f, category_id: String(created.id) }));
                          } else if (created?.name) {
                            const found = categories.find((c) => String(c.name).toLowerCase() === String(created.name).toLowerCase());
                            if (found) setForm((f) => ({ ...f, category_id: String(found.id) }));
                          }
                          setNewCategoryName("");
                        }}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        className="px-4 py-2 rounded bg-indigo-600 text-white"
                      >
                        {creatingCategory ? "Creating…" : "Create"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="w-full p-2 border rounded mb-4" />

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }} className="px-4 py-2 rounded border">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!editingCategoryId) return;
                          const ok = await updateCategory(editingCategoryId, editingCategoryName);
                          if (ok) {
                            setEditingCategoryId(null);
                            setEditingCategoryName("");
                            setCatModalOpen(false);
                          }
                        }}
                        className="px-4 py-2 rounded bg-indigo-600 text-white"
                      >
                        Update
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={async () => {
                          if (!editingCategoryId) return;
                          const ok = await deleteCategory(editingCategoryId);
                          if (ok) {
                            setEditingCategoryId(null);
                            setEditingCategoryName("");
                            setCatModalOpen(false);
                          }
                        }}
                        className="px-3 py-2 rounded bg-red-600 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Quick list of categories with small edit buttons */}
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Existing categories</div>
                <div className="max-h-40 overflow-auto border rounded p-2">
                  {categories.length === 0 ? (
                    <div className="text-sm text-gray-500">No categories</div>
                  ) : (
                    categories.map((c) => (
                      <div key={String(c.id)} className="flex items-center justify-between gap-2 py-1">
                        <div className="text-sm">{c.name}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategoryId(c.id);
                              setEditingCategoryName(String(c.name));
                            }}
                            className="px-2 py-1 rounded hover:bg-gray-100"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await deleteCategory(c.id);
                              if (ok) {
                                // if deleted category was selected in the expense form, clear selection
                                setForm((f) => (String(f.category_id) === String(c.id) ? { ...f, category_id: "" } : f));
                              }
                            }}
                            className="px-2 py-1 rounded hover:bg-gray-100 text-red-600"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
