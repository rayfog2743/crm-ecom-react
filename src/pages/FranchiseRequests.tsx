import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type RequestItem = {
  sku?: string;
  name: string;
  qty: number;
  unit?: string;
  price?: number;
};

type FranchiseRequest = {
  id: string | number;
  requestNo?: string;
  franchiseName?: string;
  contact?: string;
  address?: string;
  city?: string;
  postal?: string;
  createdAt?: string;
  status?: "pending" | "dispatched" | "cancelled" | string;
  items: RequestItem[];
  totalAmount?: number;
};

function fmtAmt(n = 0) {
  return `₹ ${Number(n || 0).toFixed(2)}`;
}

// ✅ Static sample data
const SAMPLE_REQUESTS: FranchiseRequest[] = [
  {
    id: "r-1001",
    requestNo: "REQ-1001",
    franchiseName: "Green Grocers - Warangal",
    contact: "9876543210",
    address: "12 Market Road",
    city: "Warangal",
    postal: "506002",
    createdAt: new Date().toISOString(),
    status: "pending",
    items: [
      { sku: "MIR-500", name: "Millet Idly Ravvas", qty: 10, unit: "500g", price: 120 },
      { sku: "MUR-500", name: "Millet Upma Ravva", qty: 5, unit: "500g", price: 95 },
    ],
    totalAmount: 100* 120 + 5 * 95,
  },
  {
    id: "r-1002",
    requestNo: "REQ-1002",
    franchiseName: "Healthy Foods - Hyderabad",
    contact: "9123456780",
    address: "34 Ring Road",
    city: "Hyderabad",
    postal: "500012",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "dispatched",
    items: [
      { sku: "SDF-500", name: "Special Dry Fruits Pack", qty: 3, unit: "500g", price: 480 },
    ],
    totalAmount:100* 480,
  },
];

export default function FranchiseRequests(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FranchiseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dispatchingIds, setDispatchingIds] = useState<Record<string, boolean>>({});

  // Simulate fetching from server
  async function fetchRequests() {
    setLoading(true);
    setError(null);
    try {
      // simulate delay
      await new Promise((res) => setTimeout(res, 500));
      setRequests(SAMPLE_REQUESTS);
    } catch (err: any) {
      setError("Failed to load requests");
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  async function dispatchRequest(id: string | number) {
    if (!confirm("Are you sure you want to dispatch this request?")) return;
    setDispatchingIds((s) => ({ ...s, [id]: true }));
    try {
      // simulate delay
      await new Promise((res) => setTimeout(res, 800));
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "dispatched" } : r))
      );
      toast.success("Request dispatched");
    } catch (err: any) {
      toast.error("Failed to dispatch");
    } finally {
      setDispatchingIds((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Franchise Requests-in-Progress</h1>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full table-auto min-w-[800px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Request No</th>
              <th className="p-3 text-left">Franchise</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-rose-600">
                  {error}
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">
                  No requests found
                </td>
              </tr>
            ) : (
              requests.map((r, i) => (
                <tr key={String(r.id)} className="border-b hover:bg-slate-50">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 font-medium">{r.requestNo}</td>
                  <td className="p-3">{r.franchiseName}</td>
                  <td className="p-3">{r.contact}</td>
                  <td className="p-3">
                    {new Date(r.createdAt || "").toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        r.status === "dispatched"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {fmtAmt(r.totalAmount)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      disabled={r.status === "dispatched" || dispatchingIds[r.id]}
                      onClick={() => dispatchRequest(r.id)}
                      className={`px-4 py-2 rounded text-white ${
                        r.status === "dispatched"
                          ? "bg-emerald-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {dispatchingIds[r.id]
                        ? "Dispatching..."
                        : r.status === "dispatched"
                        ? "Dispatched"
                        : "Dispatch"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
