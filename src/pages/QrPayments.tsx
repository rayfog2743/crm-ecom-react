import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOfflineOrders,
  fetchOnlineOrders,
  selectSalesByChannel,
  updateSaleStatus,
} from "../redux/slices/SalesSlice";
import api from "../api/axios";
import { toast, Toaster } from "react-hot-toast";

// helpers
const formatCurrency = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "-";

const toNumber = (v) => {
  const n = Number(typeof v === "string" ? v.replace?.(/[,₹\s]/g, "") : v);
  return Number.isFinite(n) ? n : 0;
};

export default function QrPayments() {
  const dispatch = useDispatch();

  // Redux data
  const onlineRows = useSelector((state) => selectSalesByChannel(state, "online") || []);
  const offlineRows = useSelector((state) => selectSalesByChannel(state, "offline") || []);

  // local UI state
  const [activeTab, setActiveTab] = useState("online");
  const [selected, setSelected] = useState(null);

  // shipment modal state
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [shipmentNote, setShipmentNote] = useState("");
  const [shipmentUrl, setShipmentUrl] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("Order Confirmed");
  const [shipmentOrder, setShipmentOrder] = useState(null);

  // fetch on mount
  useEffect(() => {
    dispatch(fetchOnlineOrders());
    dispatch(fetchOfflineOrders());
  }, [dispatch]);

  const rows = useMemo(() => (activeTab === "online" ? onlineRows : offlineRows), [activeTab, onlineRows, offlineRows]);

  const onlineCount = onlineRows.length;
  const offlineCount = offlineRows.length;

  // optimistic local + redux update
  function updateStatusLocal(id, nextStatus) {
    if (selected && String(selected.id) === String(id)) {
      setSelected({ ...selected, status: nextStatus });
    }
    dispatch(updateSaleStatus({ id: String(id), status: nextStatus }));
  }

  // shipment submit (multipart form)
  const handleShipmentSubmit = useCallback(async () => {
    const loadingId = toast.loading("Updating order status...");

    const order = shipmentOrder || selected;
    if (!order?.id) {
      toast.dismiss(loadingId);
      toast.error("No order selected for shipment");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("status", shipmentStatus);

      if (shipmentStatus === "Shipping") {
        if (!shipmentNote?.trim()) {
          toast.dismiss(loadingId);
          toast.error("Please enter AWB / Tracking ID");
          return;
        }
        fd.append("awb_number", shipmentNote.trim());
        if (shipmentUrl?.trim()) fd.append("shipping_url", shipmentUrl.trim());
      } else {
        if (shipmentNote?.trim()) fd.append("awb_number", shipmentNote.trim());
        if (shipmentUrl?.trim()) fd.append("shipping_url", shipmentUrl.trim());
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.dismiss(loadingId);
        toast.error("Missing auth token");
        return;
      }

      const orderId = order.id;
      const url = `/admin/online-orders/update-status/${orderId}`;

      const res = await api.post(url, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = res?.data;
      if (data && typeof data === "object") {
        const serverMsg = data?.message ?? (data?.status ? "OK" : "Request failed");
        const isSuccess =
          data?.status === true ||
          String(serverMsg || "").toLowerCase().includes("success") ||
          String(serverMsg || "").toLowerCase().includes("updated");

        if (isSuccess) {
          toast.dismiss(loadingId);
          toast.success(String(serverMsg));
        } else if (data?.errors) {
          const flat = Object.values(data.errors)
            .flat()
            .map((v) => (Array.isArray(v) ? v.join(" ") : String(v)))
            .join(" ");
          toast.dismiss(loadingId);
          toast.error(flat || String(serverMsg));
        } else {
          toast.dismiss(loadingId);
          toast.error(String(serverMsg));
        }
      } else {
        toast.dismiss(loadingId);
        toast.success("Shipment update response received");
      }

      // refresh list (best-effort)
      try {
        await dispatch(fetchOnlineOrders());
      } catch {
        // ignore refresh errors
      }
    } catch (err) {
      toast.dismiss(loadingId);
      const serverData = err?.response?.data;
      if (serverData) {
        const msg = serverData.message ?? (() => {
          try { return JSON.stringify(serverData); } catch { return String(serverData); }
        })();
        toast.error(String(msg));
      } else {
        toast.error(err?.message ?? "Error updating shipment status");
      }
    } finally {
      setShipmentOpen(false);
      setShipmentNote("");
      setShipmentUrl("");
      setShipmentStatus("Order Confirmed");
      setShipmentOrder(null);
    }
  }, [shipmentOrder, selected, shipmentNote, shipmentUrl, shipmentStatus, dispatch]);

  // small renderer helpers
  const totalAmount = (rows || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="w-full mx-auto">
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
            <div className="inline-flex w-full sm:w-auto rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setActiveTab("online")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-r ${
                  activeTab === "online" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                Online ({onlineCount})
              </button>
              <button
                onClick={() => setActiveTab("offline")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium ${
                  activeTab === "offline" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          <div className="hidden md:block p-4 overflow-x-auto">
            <table className="min-w-[960px] w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  {activeTab === "online" ? (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  ) : (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-sm text-gray-700">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium break-all">{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.customerName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{r.payment || "-"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">₹{formatCurrency(r.amount)}</td>

                    {r.channel === "online" ? (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="inline-flex items-center px-3 py-1 border border-gray-200 rounded text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShipmentOrder(r);
                              setShipmentStatus("Shipping");
                              setShipmentNote("");
                              setShipmentUrl("");
                              setShipmentOpen(true);
                            }}
                            className={`inline-flex items-center px-3 py-1 rounded text-sm border focus:outline-none ${
                              r.status === "Accepted"
                                ? "bg-green-100 text-green-500 border-green-200 cursor-not-allowed"
                                : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                            }`}
                            title="Create Shipment"
                          >
                            Shipment
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-sm">
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="inline-flex items-center px-3 py-1 border border-gray-200 rounded text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                      No {activeTab} payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden p-3 space-y-3">
            {rows.map((r, i) => (
              <div key={r.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">#{i + 1} • {r.payment || "-"}</div>
                    <div className="text-sm font-semibold text-gray-900 break-all">{r.id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.date}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">{r.customerName || "-"}</span> • {r.customerPhone || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">₹{formatCurrency(r.amount)}</div>
                  </div>
                </div>

                {r.channel === "offline" ? (
                  <div className="mt-3">
                    <div className="text-xs font-semibold mb-1">Items</div>
                    <div className="rounded border p-2 space-y-1 max-h-28 overflow-auto">
                      {(r.items ?? []).length === 0 && <div className="text-[11px] text-gray-400">No items</div>}
                      {(r.items ?? []).map((it, idx) => (
                        <div key={`${r.id}-m-${idx}`} className="text-[11px] flex justify-between gap-2">
                          <span className="truncate">
                            {it.name} × {it.qty}
                          </span>
                          <span className="whitespace-nowrap">₹{formatCurrency(toNumber(it.price) * toNumber(it.qty))}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-200 rounded text-xs text-indigo-600 hover:bg-indigo-50 focus:outline-none w-full"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="col-span-1 inline-flex items-center justify-center px-2 py-2 border border-gray-200 rounded text-xs text-indigo-600 hover:bg-indigo-50 focus:outline-none"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusLocal(r.id, "Accepted")}
                      disabled={r.status === "Accepted"}
                      className={`col-span-1 inline-flex items-center justify-center px-2 py-2 rounded text-xs border focus:outline-none ${
                        r.status === "Accepted" ? "bg-green-100 text-green-500 border-green-200 cursor-not-allowed" : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      }`}
                      title="Mark as Accepted"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusLocal(r.id, "Rejected")}
                      disabled={r.status === "Rejected"}
                      className={`col-span-1 inline-flex items-center justify-center px-2 py-2 rounded text-xs border focus:outline-none ${
                        r.status === "Rejected" ? "bg-red-100 text-red-500 border-red-200 cursor-not-allowed" : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                      }`}
                      title="Mark as Rejected"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {rows.length === 0 && <div className="text-center text-sm text-gray-500 py-8">No {activeTab} payments yet.</div>}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-gray-600">
              Channel: <span className="font-medium capitalize">{activeTab}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Total Amount: <span className="font-semibold">₹{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md sm:max-w-lg md:max-w-2xl p-4 sm:p-6 z-10">
            <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold">Payment Details</h2>
              <button onClick={() => setSelected(null)} className="px-3 py-1 rounded border text-xs sm:text-sm hover:bg-gray-50">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Payment ID</div>
                <div className="text-sm sm:text-base font-medium break-all">{selected.id}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Channel</div>
                <div className="text-sm sm:text-base font-medium capitalize">{selected.channel}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Date</div>
                <div className="text-sm sm:text-base font-medium">{selected.date}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Total Payment</div>
                <div className="text-sm sm:text-base font-semibold">₹{formatCurrency(selected.amount)}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Payment Method</div>
                <div className="text-sm sm:text-base font-medium capitalize">{selected.payment || "-"}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] sm:text-xs text-gray-500">Customer Name</div>
                <div className="text-sm sm:text-base font-medium">{selected.customerName || "-"}</div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-medium">{selected.customerPhone || "-"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[11px] sm:text-xs text-gray-500">Address</div>
                <div className="text-sm sm:text-base">{selected.address || "-"}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm sm:text-base font-semibold mb-2">Items</div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Price (₹)</th>
                      <th className="text-right px-3 py-2">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items ?? []).map((it, idx) => (
                      <tr key={`${selected.id}-it-${idx}`} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2">{toNumber(it.qty)}</td>
                        <td className="px-3 py-2 text-right">₹{formatCurrency(toNumber(it.price))}</td>
                        <td className="px-3 py-2 text-right">₹{formatCurrency(toNumber(it.price) * toNumber(it.qty))}</td>
                      </tr>
                    ))}
                    {(selected.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(typeof selected.subtotal === "number" || typeof selected.gst_amount === "number" || typeof selected.discount_value === "number") && (
                <div className="mt-3 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>₹{formatCurrency(toNumber(selected.subtotal || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST {selected.gst_percent ? `(${selected.gst_percent}%)` : ""}</span>
                    <span>₹{formatCurrency(toNumber(selected.gst_amount || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount {selected.discount_type ? `(${selected.discount_type})` : ""}</span>
                    <span>- ₹{formatCurrency(toNumber(selected.discount_value || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold mt-1">
                    <span>Total</span>
                    <span>₹{formatCurrency(toNumber(selected.amount || 0))}</span>
                  </div>
                </div>
              )}
            </div>

            {selected.channel === "online" && (
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => updateStatusLocal(selected.id, "Rejected")}
                  disabled={selected.status === "Rejected"}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded text-sm border focus:outline-none ${
                    selected.status === "Rejected" ? "bg-red-100 text-red-500 border-red-200 cursor-not-allowed" : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  }`}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => updateStatusLocal(selected.id, "Accepted")}
                  disabled={selected.status === "Accepted"}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded text-sm border focus:outline-none ${
                    selected.status === "Accepted" ? "bg-green-100 text-green-500 border-green-200 cursor-not-allowed" : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                  }`}
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipment Modal */}
      {shipmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShipmentOpen(false); setShipmentOrder(null); }} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Update Order Status</h3>
              <button
                onClick={() => { setShipmentOpen(false); setShipmentOrder(null); }}
                className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm">
                <div className="text-xs text-gray-600 mb-1">Order Status</div>
                <select value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)} className="w-full p-2 border rounded bg-slate-50">
                  <option value="Confirmed">Order Confirmed</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </label>

              {shipmentStatus === "Shipping" && (
                <>
                  <label className="block text-sm">
                    <div className="text-xs text-gray-600 mb-1">AWB / Tracking ID</div>
                    <input
                      type="text"
                      value={shipmentNote}
                      onChange={(e) => setShipmentNote(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter AWB / Tracking ID"
                    />
                  </label>

                  <label className="block text-sm">
                    <div className="text-xs text-gray-600 mb-1">Shipping URL</div>
                    <input
                      type="text"
                      value={shipmentUrl}
                      onChange={(e) => setShipmentUrl(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter shipping URL (optional)"
                    />
                  </label>
                </>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleShipmentSubmit}
                  className="px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
