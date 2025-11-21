// src/redux/slices/productsSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";

export type Product = {
  id: string | number;
  name: string;
  price?: string;
  grams?: string;
  discount_amount?: string;
  discount_price?: string;
  image_url?: string;
  category?: string | { id?: number; name?: string } ;
  [k: string]: any;
};

type ProductsState = {
  items: Product[];
  ids: string[]; // String IDs for quick access
  loading: boolean;
  error?: string | null;
};

const initialState: ProductsState = {
  items: [],
  ids: [],
  loading: false,
  error: null,
};

function normalizeProduct(raw: any): Product {
  const id =
    raw.id ??
    raw._id ??
    raw.product_id ??
    raw.productId ??
    raw.uid ??
    raw.uuid ??
    String(Math.random()).slice(2);

  return {
    ...raw,
    id,
    name: raw.name ?? raw.title ?? "",
    price: raw.price ?? raw.amount ?? raw.price ?? "",
    image_url: raw.image_url ?? raw.imageUrl ?? raw.image ?? "",
    grams: raw.grams ?? raw.gram ?? "",
    discount_amount: raw.discount_amount ?? raw.discountAmount ?? undefined,
    discount_price: raw.discount_price ?? raw.discountPrice ?? undefined,
    category: raw.category ?? raw.cat ?? raw.type ?? undefined,
  };
}

export const fetchProducts = createAsyncThunk("products/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/admin/products/show");
    const body = res.data;
    let rows: any[] = [];
    if (Array.isArray(body)) rows = body;
    else if (Array.isArray(body.data)) rows = body.data;
    else if (Array.isArray(body.products)) rows = body.products;
    else if (Array.isArray(body.rows)) rows = body.rows;
    else if (Array.isArray(body.items)) rows = body.items;
    else if (body && typeof body === "object" && (body.id || body._id || body.name)) rows = [body];
    // else rows stays empty

    const normalized = rows.map(normalizeProduct);
    return normalized;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data ?? err?.message ?? "Network error");
  }
});
const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
      state.ids = action.payload.map((p) => String(p.id));
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.items.unshift(action.payload);
      state.ids = state.items.map((p) => String(p.id));
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const idx = state.items.findIndex((p) => String(p.id) === String(action.payload.id));
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...action.payload };
      state.ids = state.items.map((p) => String(p.id));
    },
    removeProduct(state, action: PayloadAction<string | number>) {
      state.items = state.items.filter((p) => String(p.id) !== String(action.payload));
      state.ids = state.items.map((p) => String(p.id));
    },
    clearProducts(state) {
      state.items = [];
      state.ids = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
        s.ids = a.payload.map((p) => String(p.id));
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        s.loading = false;
        s.error = String(a.payload ?? "Failed to fetch");
      });
  },
});

export const { setProducts, addProduct, updateProduct, removeProduct, clearProducts } = productsSlice.actions;
export default productsSlice.reducer;
