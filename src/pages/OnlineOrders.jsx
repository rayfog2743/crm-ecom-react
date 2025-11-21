import React, { useEffect, useState, useCallback } from "react";
import OrdersTable from "../components/OrdersTable";

/**
 * Update API URL if needed
 * Example API expected response:
 * { data: [...], meta: { total, page, per_page } }
 */
const ONLINE_API_URL = "https://api-rayfog.nearbydoctors.in/public/api/admin/online-orders";

function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\r\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function OnlineOrders() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useMock] = useState(false); // set true for mock data locally

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (useMock) {
        const mock = Array.from({ length: 7 }).map((_, i) => ({
          id: i + 1 + (page - 1) * perPage,
          customer: `Online Customer ${i + 1}`,
          amount: (Math.random() * 1000).toFixed(2),
          status: i % 2 === 0 ? "paid" : "pending",
          date: new Date().toISOString().slice(0, 10),
        }));
        setData(mock);
        setTotal(7);
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search) params.set("search", search);

      // token / auth
      const token = localStorage.getItem("token") || ""; // change if you store token elsewhere
      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const url = `${ONLINE_API_URL}?${params.toString()}`;
      const res = await fetch(url, { headers, credentials: "include" });

      const contentType = res.headers.get("content-type") || "";
      const bodyText = await res.text();
      console.log("ONLINE fetch:", { url, status: res.status, contentType, snippet: bodyText.slice(0, 400) });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}. See console for response snippet.`);
      }

      if (!contentType.includes("application/json")) {
        console.warn("Expected JSON but got:", contentType, bodyText.slice(0, 800));
        throw new Error("Server returned non-JSON. Check console for HTML or error page.");
      }

      const json = JSON.parse(bodyText);
      setData(json.data || []);
      setTotal(json.meta?.total ?? json.total ?? 0);
    } catch (err) {
      console.error("OnlineOrders.fetchData error:", err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, useMock]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { key: "id", label: "Order ID" },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount", render: (v) => `₹ ${v}` },
    { key: "status", label: "Status", render: (v) => <span className="capitalize">{v}</span> },
    { key: "date", label: "Date" },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or order id"
            className="px-3 py-2 border rounded-lg text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(); } }}
          />
          <button onClick={() => { setPage(1); fetchData(); }} className="px-3 py-2 rounded-lg bg-gray-100 border text-sm">
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => exportToCsv("online-orders.csv", data)} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-red-500">Error: {error}</div>
        ) : (
          <>
            <OrdersTable columns={columns} data={data} onView={(row) => alert(`Open online order ${row.id}`)} />

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">Showing {data.length} of {total} orders</div>

              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                  Prev
                </button>
                <span className="px-2 text-sm">Page {page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={data.length === 0 || data.length < perPage} className="px-3 py-1 border rounded disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
