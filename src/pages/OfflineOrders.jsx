import React, { useEffect, useState, useRef } from "react";
import OrdersTable from "../components/OrdersTable";
import api from "../api/axios";
import PaginationControls from "./PaginationControls"; // adjust path if needed

export default function OfflineOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // filters / search
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // used to debounce requests
  const [fromDate, setFromDate] = useState(""); // format: YYYY-MM-DD (input type date)
  const [toDate, setToDate] = useState("");

  // selected order for modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // tiny ref used to cancel debounce timer between renders (no TypeScript here)
  const searchTimer = useRef(null);

  // debounce searchTerm -> debouncedSearch
  useEffect(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    // wait 500ms after user stops typing
    searchTimer.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1); // when search changes reset to first page
    }, 500);

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  // fetch function uses page, perPage, debouncedSearch, fromDate, toDate
  const fetchOrders = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum, per_page: perPage };

      if (debouncedSearch) params.search = debouncedSearch;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get("/admin/pos-orders", { params });
      const outer = res?.data;
      const payload = outer?.data ?? outer;

      const arr = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = arr.map((r) => {
        let items = [];
        try {
          if (r.items)
            items = Array.isArray(r.items) ? r.items : JSON.parse(r.items);
        } catch {
          items = [];
        }
        return { ...r, items };
      });

      setOrders(normalized);
      setLastPage(Number(payload?.last_page ?? outer?.last_page ?? 1));
      setTotal(Number(payload?.total ?? outer?.total ?? normalized.length));

      const current = payload?.current_page ?? outer?.current_page;
      if (typeof current === "number") setPage(current);
    } catch (err) {
      console.error("Error fetching POS orders:", err);
      setOrders([]);
      setLastPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // refetch when page, perPage, debouncedSearch, fromDate or toDate change
  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, fromDate, toDate]);

  const columns = [
    { key: "id", label: "Order ID" },
    { key: "customer_name", label: "Customer" },
    { key: "total", label: "Amount", render: (v) => `₹ ${v}` },
    { key: "payment", label: "Payment" },
    { key: "order_time_formatted", label: "Date" },
  ];

  // local optimistic update for accept/reject (replace with API call if needed)
  const updateStatusLocal = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selectedOrder && selectedOrder.id === id)
      setSelectedOrder({ ...selectedOrder, status });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="p-4 bg-white rounded-xl border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Offline POS Orders</h2>

      {/* Filters row */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        {/* Search */}
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-600 mb-1">
            Search (customer / order id)
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type and wait 0.5s to search"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Date range */}
        <div className="flex gap-2 items-center md:col-span-1">
          <div className="w-1/2">
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 md:col-span-1 justify-end">
          <button
            onClick={() => {
              setPage(1);
              fetchOrders(1);
            }}
            className="px-4 py-2 border rounded bg-gray-50"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border rounded bg-red-50 text-red-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table / empty state */}
      {loading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          <div className="text-lg font-medium mb-2">No orders found.</div>
          <div className="text-sm">
            Try clearing filters or adjusting the date range.
          </div>
        </div>
      ) : (
        <>
          <OrdersTable
            columns={columns}
            data={Array.isArray(orders) ? orders : []}
            onView={(row) => setSelectedOrder(row)}
          />

          <div className="mt-4">
            <PaginationControls
              page={page}
              perPage={perPage}
              total={total}
              lastPage={lastPage}
              onPageChange={(p) => setPage(p)}
              onPerPageChange={(pp) => {
                setPerPage(pp);
                setPage(1);
              }}
            />
          </div>
        </>
      )}

      {/* Details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-5 z-10">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Payment ID</div>
                <div className="text-sm font-medium mb-2">
                  {selectedOrder.id}
                </div>

                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm font-medium mb-2">
                  {selectedOrder.order_time_formatted}
                </div>

                <div className="text-xs text-gray-500">Payment Method</div>
                <div className="text-sm font-medium mb-2 capitalize">
                  {selectedOrder.payment || "-"}
                </div>

                <div className="text-xs text-gray-500">Customer Name</div>
                <div className="text-sm font-semibold mb-2">
                  {selectedOrder.customer_name || "-"}
                </div>

                <div className="text-xs text-gray-500">Address</div>
                <div className="text-sm mb-2">
                  {selectedOrder.address ||
                    `${selectedOrder.customer_name || ""}, Phone: ${
                      selectedOrder.customer_phone || "-"
                    }`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Channel</div>
                <div className="text-sm font-medium mb-2 capitalize">
                  {selectedOrder.orderType || "pos"}
                </div>

                <div className="text-xs text-gray-500">Total Payment</div>
                <div className="text-xl font-semibold mb-4">
                  ₹{selectedOrder.total}
                </div>

                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm font-medium">
                  {selectedOrder.customer_phone || "-"}
                </div>
              </div>
            </div>

            {/* items table */}
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Items</div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Qty</th>
                      <th className="text-right px-4 py-3">Price (₹)</th>
                      <th className="text-right px-4 py-3">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, idx) => {
                      const qty = Number(it.qty || 0);
                      const price = Number(it.price || 0);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3">{it.name}</td>
                          <td className="px-4 py-3">{qty}</td>
                          <td className="px-4 py-3 text-right">₹{price}</td>
                          <td className="px-4 py-3 text-right">
                            ₹{(qty * price).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {(selectedOrder.items || []).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* totals */}
            <div className="mt-4 max-w-sm ml-auto text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal ?? "0"}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>GST</span>
                <span>₹{selectedOrder.gst_amount ?? "0"}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Discount</span>
                <span>- ₹{selectedOrder.discount_value ?? "0"}</span>
              </div>
              <div className="flex justify-between font-semibold mt-2 border-t pt-2">
                <span>Total</span>
                <span>₹{selectedOrder.total ?? "0"}</span>
              </div>
            </div>

            {/* actions */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  updateStatusLocal(selectedOrder.id, "Rejected");
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  updateStatusLocal(selectedOrder.id, "Accepted");
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
