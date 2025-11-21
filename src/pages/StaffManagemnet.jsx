import React, { useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "sales", label: "Sales" },
];

const STORAGE_KEY = "staff_management_v1";

function uid(prefix = "s") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}
function validatePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function downloadCSV(filename, rows) {
  const header = Object.keys(rows[0] || {}).join(",");
  const csv = [
    header,
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => {
          if (v === null || v === undefined) return "";
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const INITIAL_DUMMY = [
  {
    id: uid(),
    name: "Arun Patel",
    email: "arun.patel@example.com",
    phone: "+91 98765 43210",
    role: "admin",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: uid(),
    name: "Maya Singh",
    email: "maya.singh@example.com",
    phone: "+91 91234 56789",
    role: "super_admin",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: uid(),
    name: "Ravi Kumar",
    email: "ravi.kumar@example.com",
    phone: "+91 99887 66554",
    role: "receptionist",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: uid(),
    name: "Pooja Sharma",
    email: "pooja.sharma@example.com",
    phone: "+91 90000 11122",
    role: "sales",
    active: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

export default function StaffManagemnet() {
  // load from localStorage or dummy
  const [staff, setStaff] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_DUMMY;
  });

  // UI / controls
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, name, role
  const [sortDir, setSortDir] = useState("desc"); // asc/desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // modal state for add/edit
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin",
    active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // persist to localStorage whenever staff changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    } catch (e) {
      // ignore
    }
  }, [staff]);

  // derived filtered & sorted
  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return staff
      .filter((s) => {
        if (roleFilter) {
          if (s.role !== roleFilter) return false;
        }
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          (s.role && s.role.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let val = 0;
        if (sortBy === "name") val = a.name.localeCompare(b.name);
        else if (sortBy === "role") val = (a.role || "").localeCompare(b.role || "");
        else val = (a.createdAt || 0) - (b.createdAt || 0);
        if (sortDir === "desc") val = -val;
        return val;
      });
  }, [staff, query, roleFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const currentPageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // open add modal
  function openAdd() {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      role: ROLE_OPTIONS[1].value, // default Admin
      active: true,
    });
    setFormErrors({});
    setModalOpen(true);
  }

  // open edit modal
  function openEdit(id) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setForm({
      name: s.name || "",
      email: s.email || "",
      phone: s.phone || "",
      role: s.role || ROLE_OPTIONS[1].value,
      active: !!s.active,
    });
    setFormErrors({});
    setModalOpen(true);
  }

  // validate form
  function validateForm() {
    const err = {};
    if (!String(form.name || "").trim()) err.name = "Name is required";
    if (!String(form.email || "").trim()) err.email = "Email is required";
    else if (!validateEmail(form.email)) err.email = "Email is invalid";
    if (!String(form.phone || "").trim()) err.phone = "Phone is required";
    else if (!validatePhone(form.phone)) err.phone = "Phone number invalid";
    if (!form.role) err.role = "Role required";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  }

  function saveForm() {
    if (!validateForm()) return;
    if (editingId) {
      setStaff((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                role: form.role,
                active: !!form.active,
              }
            : r
        )
      );
    } else {
      const newStaff = {
        id: uid(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        active: !!form.active,
        createdAt: Date.now(),
      };
      setStaff((prev) => [newStaff, ...prev]);
    }
    setModalOpen(false);
  }

  function confirmDelete(id) {
    setConfirmDeleteId(id);
  }
  function doDelete() {
    if (!confirmDeleteId) return;
    setStaff((prev) => prev.filter((s) => s.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }

  function toggleActive(id) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function exportCSV() {
    if (staff.length === 0) return;
    const rows = staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: (ROLE_OPTIONS.find((r) => r.value === s.role) || { label: s.role }).label,
      active: s.active ? "Active" : "Inactive",
      createdAt: formatDate(s.createdAt),
    }));
    downloadCSV("staff_export.csv", rows);
  }

  // small UI helpers
  function roleLabel(value) {
    return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value ?? "";
  }

  function initials(name) {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // main render
  return (
    <div className="p-6 max-w-10xl mx-auto">
      {/* Controls */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm" >
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone or role..."
            className="flex-1 w-[50%] px-3 py-2 border rounded-md"
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>            
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-2 py-1 border rounded-md">
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="role">Role</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title="Toggle direction"
              className="px-2 py-1 border rounded-md"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
           <div className="flex items-center justify-between ">
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border text-sm hover:shadow-sm"
            title="Export CSV"
          >
            Export CSV
          </button>

          <button onClick={openAdd} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            Add Staff
          </button>
        </div>
      </div>
        </div>
      </div>

      {/* List */}
      <div>
        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3 w-12">S.no</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {currentPageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                    No staff found.
                  </td>
                </tr>
              ) : (
                currentPageRows.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                          {initials(s.name)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{s.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">{s.email}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">{s.phone}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">{roleLabel(s.role)}</td>
                    <td className="px-4 py-4 align-top text-sm">
                      <button
                        onClick={() => toggleActive(s.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-4 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEdit(s.id)} className="px-3 py-1 rounded-md border text-sm hover:bg-slate-50">
                          Edit
                        </button>
                        <button onClick={() => confirmDelete(s.id)} className="px-3 py-1 rounded-md border text-sm hover:bg-red-50">
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
        <div className="md:hidden grid grid-cols-1 gap-3">
          {currentPageRows.length === 0 ? (
            <div className="p-4 bg-white text-center rounded-lg text-sm text-slate-500">No staff found.</div>
          ) : (
            currentPageRows.map((s) => (
              <div key={s.id} className="p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                      {initials(s.name)}
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-slate-500">{roleLabel(s.role)}</div>
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(s.id)} className="px-2 py-1 rounded border text-xs">
                        Edit
                      </button>
                      <button onClick={() => confirmDelete(s.id)} className="px-2 py-1 rounded border text-xs">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
                  <div>{s.phone}</div>
                  <div>
                    <button
                      onClick={() => toggleActive(s.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> -{" "}
          <strong>{Math.min(filtered.length, page * pageSize)}</strong> of <strong>{filtered.length}</strong>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 border rounded-md"
          >
            <option value={4}>4 / page</option>
            <option value={6}>6 / page</option>
            <option value={12}>12 / page</option>
          </select>

          <div className="inline-flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded-md" disabled={page === 1}>
              Prev
            </button>
            <div className="px-3 py-1 border rounded-md bg-white">
              {page} / {totalPages}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded-md" disabled={page === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{editingId ? "Edit Staff" : "Add Staff"}</h3>
              <div className="text-sm text-slate-500">{editingId ? "Edit details" : "Enter new staff details"}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Full name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                {formErrors.name && <div className="text-xs text-red-600 mt-1">{formErrors.name}</div>}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Email</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                {formErrors.email && <div className="text-xs text-red-600 mt-1">{formErrors.email}</div>}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                {formErrors.phone && <div className="text-xs text-red-600 mt-1">{formErrors.phone}</div>}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {formErrors.role && <div className="text-xs text-red-600 mt-1">{formErrors.role}</div>}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">Active</label>
                <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border">
                Cancel
              </button>
              <button onClick={saveForm} className="px-4 py-2 rounded bg-emerald-600 text-white">
                {editingId ? "Save Changes" : "Create Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-lg shadow-lg p-6 z-10">
            <h4 className="text-lg font-medium">Confirm delete</h4>
            <p className="text-sm text-slate-600 mt-2">Are you sure you want to remove this staff member? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={doDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
