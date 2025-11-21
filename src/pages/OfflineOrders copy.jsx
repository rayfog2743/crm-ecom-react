import React, { useEffect, useState } from "react";
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

  // selected order for modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // fetch and normalize
  const fetchOrders = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/pos-orders", { params: { page: pageNum, per_page: perPage } });
      const outer = res?.data;
      const payload = outer?.data ?? outer;
      const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

      const normalized = arr.map((r) => {
        let items = [];
        try {
          if (r.items) items = Array.isArray(r.items) ? r.items : JSON.parse(r.items);
        } catch {
          items = [];
        }
        return { ...r, items };
      });

      setOrders(normalized);
      setLastPage(Number(payload?.last_page ?? outer?.last_page ?? 1));
      setTotal(Number(payload?.total ?? outer?.total ?? normalized.length));
      // keep page in sync if API returns current_page
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

  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const columns = [
    { key: "id", label: "Order ID" },
    { key: "customer_name", label: "Customer" },
    { key: "total", label: "Amount", render: (v) => `₹ ${v}` },
    { key: "payment", label: "Payment" },
    { key: "order_time_formatted", label: "Date" },
  ];

  // local status update (optimistic) — replace with API call if needed
  const updateStatusLocal = (id, status) => {
    setOrders((prev) => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Offline POS Orders</h2>

      {loading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          No orders found.
        </div>
      ) : (
        <>
          <OrdersTable
            columns={columns}
            data={Array.isArray(orders) ? orders : []}
            onView={(row) => setSelectedOrder(row)} // <-- opens modal
          />

          <div className="mt-4">
            <PaginationControls
              page={page}
              perPage={perPage}
              total={total}
              lastPage={lastPage}
              onPageChange={(p) => setPage(p)}
              onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
            />
          </div>
        </>
      )}

      {/* ---------- DETAILS MODAL (compact, like your screenshot) ---------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-5 z-10">
            {/* header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* top info two-column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Payment ID</div>
                <div className="text-sm font-medium mb-2">{selectedOrder.id}</div>

                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm font-medium mb-2">{selectedOrder.order_time_formatted}</div>

                <div className="text-xs text-gray-500">Payment Method</div>
                <div className="text-sm font-medium mb-2 capitalize">{selectedOrder.payment || "-"}</div>

                <div className="text-xs text-gray-500">Customer Name</div>
                <div className="text-sm font-semibold mb-2">{selectedOrder.customer_name || "-"}</div>

                <div className="text-xs text-gray-500">Address</div>
                <div className="text-sm mb-2">
                  {selectedOrder.address || `${selectedOrder.customer_name || ""}, Phone: ${selectedOrder.customer_phone || "-"}`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Channel</div>
                <div className="text-sm font-medium mb-2 capitalize">{selectedOrder.orderType || "pos"}</div>

                <div className="text-xs text-gray-500">Total Payment</div>
                <div className="text-xl font-semibold mb-4">₹{selectedOrder.total}</div>

                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm font-medium">{selectedOrder.customer_phone || "-"}</div>
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
                          <td className="px-4 py-3 text-right">₹{(qty * price).toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {(selectedOrder.items || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
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
              <div className="flex justify-between text-gray-700"><span>Subtotal</span><span>₹{selectedOrder.subtotal ?? "0"}</span></div>
              <div className="flex justify-between text-gray-700"><span>GST</span><span>₹{selectedOrder.gst_amount ?? "0"}</span></div>
              <div className="flex justify-between text-gray-700"><span>Discount</span><span>- ₹{selectedOrder.discount_value ?? "0"}</span></div>
              <div className="flex justify-between font-semibold mt-2 border-t pt-2"><span>Total</span><span>₹{selectedOrder.total ?? "0"}</span></div>
            </div>

            {/* actions */}
         
          </div>
        </div>
      )}
    </div>
  );
}
