// src/redux/slices/SalesSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios"; // adjust if your axios instance path differs

/* ---------- Types ---------- */
export type SaleItem = {
  product_id?: number | string;
  name: string;
  qty: number;
  price: number;
};

export type SaleRow = {
  id: string;
  date?: string;
  amount: number;
  status?: string;
  channel: "online" | "offline";
  customerName?: string;
  customerPhone?: string;
  payment?: string;
  address?: string | null;
  items?: SaleItem[];
  subtotal?: number;
  gst_percent?: number;
  gst_amount?: number;
  discount_type?: string;
  discount_value?: number;
  [k: string]: any;
};

type SalesState = {
  rows: SaleRow[];
  loadingOnline: boolean;
  loadingOffline: boolean;
  errorOnline: string | null;
  errorOffline: string | null;
};

/* ---------- Initial ---------- */
const initialState: SalesState = {
  rows: [],
  loadingOnline: false,
  loadingOffline: false,
  errorOnline: null,
  errorOffline: null,
};

/* ---------- Helpers: resilient parsing (same logic as earlier) ---------- */
const toNumber = (v: any): number => {
  const n = Number(typeof v === "string" ? v.replace?.(/[,₹\s]/g, "") : v);
  return Number.isFinite(n) ? n : 0;
};

const ensureArray = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return Object.values(parsed);
    } catch {
      return [];
    }
  }
  if (val && typeof val === "object") return Object.values(val);
  return [];
};

const normalizeItem = (raw: any): SaleItem => {
  const name =
    raw?.name ?? raw?.product_name ?? raw?.title ?? raw?.product ?? "Item";

  const qty = toNumber(
    raw?.qty ?? raw?.quantity ?? raw?.qty_count ?? raw?.count ?? 1
  );

  let price = toNumber(
    raw?.price ??
      raw?.unit_price ??
      raw?.rate ??
      raw?.price_per_unit ??
      undefined
  );
  if (!price) {
    const totalLike = toNumber(raw?.total ?? raw?.amount ?? raw?.line_total);
    price = qty ? totalLike / qty : totalLike;
  }

  return {
    product_id: raw?.product_id ?? raw?.id,
    name: String(name),
    qty: qty || 1,
    price: price || 0,
  };
};

const extractItems = (o: any): SaleItem[] => {
  const candidates = [
    o?.items,
    o?.order_items,
    o?.products,
    o?.lines,
    o?.details,
    o?.cart,
  ];

  for (const c of candidates) {
    const arr = ensureArray(c);
    if (arr.length) return arr.map(normalizeItem);
  }
  return [];
};

const normalizeRow = (o: any, channel: "online" | "offline"): SaleRow => {
  const items = extractItems(o);
  return {
    id: String(o.id ?? o.order_id ?? o._id ?? o.payment_id ?? Math.random().toString(36).slice(2, 9)),
    date: o.order_time_formatted || o.order_time || o.date || o.created_at || o.createdAt || "",
    amount: toNumber(o.total ?? o.amount ?? o.order_total ?? o.grand_total ?? 0),
    status: o.status ?? (channel === "online" ? "Pending" : "Completed"),
    channel,
    customerName: o.customer_name ?? o.customer_name_full ?? o.customer ?? "-",
    customerPhone: o.customer_phone ?? o.customer_mobile ?? "-",
    payment: o.payment ?? o.payment_method ?? "-",
    address: o.address ?? o.shipping_address ?? "-",
    items,
    subtotal: toNumber(o.subtotal ?? 0),
    gst_percent: toNumber(o.gst_percent ?? 0),
    gst_amount: toNumber(o.gst_amount ?? 0),
    discount_type: o.discount_type ?? undefined,
    discount_value: toNumber(o.discount_value ?? 0),
    // preserve raw payload for debugging if needed
    raw: o,
  };
};

/* ---------- Async thunks ---------- */

/**
 * Fetch online orders from API and return normalized SaleRow[]
 */
export const fetchOnlineOrders = createAsyncThunk<SaleRow[]>(
  "sales/fetchOnline",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/online-orders");
      // backend may nest data differently — try common paths
      const apiRows: any[] = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      const rows = (Array.isArray(apiRows) ? apiRows : []).map((r) => normalizeRow(r, "online"));
      return rows;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Failed to fetch online orders");
    }
  }
);

/**
 * Fetch offline (POS) orders from API and return normalized SaleRow[]
 */
export const fetchOfflineOrders = createAsyncThunk<SaleRow[]>(
  "sales/fetchOffline",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/pos-orders");
      const apiRows: any[] = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      const rows = (Array.isArray(apiRows) ? apiRows : []).map((r) => normalizeRow(r, "offline"));
      return rows;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Failed to fetch offline orders");
    }
  }
);

/* ---------- Slice ---------- */
const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setSales(state, action: PayloadAction<SaleRow[]>) {
      state.rows = action.payload;
      state.errorOnline = null;
      state.errorOffline = null;
    },
    addSales(state, action: PayloadAction<SaleRow[]>) {
      // prepend new rows (preserve existing unless duplicates)
      const ids = new Set(state.rows.map((r) => String(r.id)));
      const toAdd = action.payload.filter((r) => !ids.has(String(r.id)));
      state.rows = [...toAdd, ...state.rows];
    },
    addSale(state, action: PayloadAction<SaleRow>) {
      const id = String(action.payload.id);
      const exists = state.rows.find((r) => String(r.id) === id);
      if (!exists) state.rows.unshift(action.payload);
      else {
        state.rows = state.rows.map((r) => (String(r.id) === id ? { ...r, ...action.payload } : r));
      }
    },
    updateSaleStatus(state, action: PayloadAction<{ id: string; status: string }>) {
      const { id, status } = action.payload;
      state.rows = state.rows.map((r) => (String(r.id) === String(id) ? { ...r, status } : r));
    },
    removeSale(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.rows = state.rows.filter((r) => String(r.id) !== String(id));
    },
    clearSales(state) {
      state.rows = [];
      state.errorOnline = null;
      state.errorOffline = null;
      state.loadingOnline = false;
      state.loadingOffline = false;
    },
  },
  extraReducers: (builder) => {
    // online
    builder.addCase(fetchOnlineOrders.pending, (state) => {
      state.loadingOnline = true;
      state.errorOnline = null;
    });
    builder.addCase(fetchOnlineOrders.fulfilled, (state, action) => {
      state.loadingOnline = false;
      // merge without duplicates - prepend fetched online rows
      const ids = new Set(state.rows.map((r) => String(r.id)));
      const toAdd = action.payload.filter((r) => !ids.has(String(r.id)));
      state.rows = [...toAdd, ...state.rows];
    });
    builder.addCase(fetchOnlineOrders.rejected, (state, action) => {
      state.loadingOnline = false;
      state.errorOnline = (action.payload as string) || action.error.message || "Failed to load online orders";
    });

    // offline
    builder.addCase(fetchOfflineOrders.pending, (state) => {
      state.loadingOffline = true;
      state.errorOffline = null;
    });
    builder.addCase(fetchOfflineOrders.fulfilled, (state, action) => {
      state.loadingOffline = false;
      const ids = new Set(state.rows.map((r) => String(r.id)));
      const toAdd = action.payload.filter((r) => !ids.has(String(r.id)));
      state.rows = [...toAdd, ...state.rows];
    });
    builder.addCase(fetchOfflineOrders.rejected, (state, action) => {
      state.loadingOffline = false;
      state.errorOffline = (action.payload as string) || action.error.message || "Failed to load offline orders";
    });
  },
});

/* ---------- Exports ---------- */
export const {
  setSales,
  addSales,
  addSale,
  updateSaleStatus,
  removeSale,
  clearSales,
} = salesSlice.actions;

export default salesSlice.reducer;

/* ---------- Selectors: use these in components ---------- */
export const selectSalesRows = (state: any) => state?.sales?.rows ?? [];
export const selectSalesLoadingOnline = (state: any) => state?.sales?.loadingOnline ?? false;
export const selectSalesLoadingOffline = (state: any) => state?.sales?.loadingOffline ?? false;
export const selectSalesErrorOnline = (state: any) => state?.sales?.errorOnline ?? null;
export const selectSalesErrorOffline = (state: any) => state?.sales?.errorOffline ?? null;

export const selectSalesByChannel = (state: any, channel: "online" | "offline") =>
  (selectSalesRows(state) as SaleRow[]).filter((r) => r.channel === channel);

export const selectCountsAndRevenue = (state: any) => {
  const rows = selectSalesRows(state) as SaleRow[];
  const online = rows.filter((r) => r.channel === "online");
  const offline = rows.filter((r) => r.channel === "offline");
  const onlineRevenue = online.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const offlineRevenue = offline.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return {
    onlineCount: online.length,
    offlineCount: offline.length,
    onlineRevenue,
    offlineRevenue,
  };
};
