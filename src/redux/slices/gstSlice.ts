// src/store/slices/gstSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";

export type GstItem = {
  id: string | number;
  name: string;
  percentage: number;
};

type GstState = {
  items: GstItem[];
  loading: boolean;
  saving: boolean;
  deletingId: string | number | null;
  error?: string | null;
};

const initialState: GstState = {
  items: [],
  loading: false,
  saving: false,
  deletingId: null,
  error: null,
};

/**
 * Helper to normalize possible response shapes to an array of GstItem
 */
const normalizeRows = (rows: any[]): GstItem[] =>
  rows.map((r: any, i: number) => ({
    id: r.id ?? r._id ?? r.gst_id ?? r.gstId ?? `srv-${i}`,
    name: r.name ?? "",
    percentage: Number(r.percentage ?? r.percentage_percent ?? r.per ?? 0),
  }));

// Thunks
export const fetchGsts = createAsyncThunk("gst/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/admin/settings/gst/show");
    const body = res.data ?? res;
    let rows: any[] = [];
    if (Array.isArray(body)) rows = body;
    else if (Array.isArray(body.data)) rows = body.data;
    else if (Array.isArray(body.rows)) rows = body.rows;
    else if (Array.isArray(body.gsts)) rows = body.gsts;
    else if (body && typeof body === "object") rows = body.data ?? [];
    const normalized = normalizeRows(rows);
    return normalized;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data ?? err?.message ?? "Failed to load GSTs");
  }
});

export const createGst = createAsyncThunk(
  "gst/create",
  async (payload: { name: string; percentage: number }, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/settings/gst/add", payload);
      const body = res.data ?? res;
      if (body && body.status === false) return rejectWithValue(body);
      const createdRaw = body?.data ?? body?.gst ?? body ?? null;
      const created: GstItem = {
        id: createdRaw?.id ?? createdRaw?._id ?? `tmp-${Date.now()}`,
        name: createdRaw?.name ?? payload.name,
        percentage: Number(createdRaw?.percentage ?? payload.percentage),
      };
      return created;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data ?? err?.message ?? "Create failed");
    }
  }
);

export const updateGst = createAsyncThunk(
  "gst/update",
  async ({ id, name, percentage }: { id: string | number; name: string; percentage: number }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/settings/gst/update/${id}`, { name, percentage });
      const body = res.data ?? res;
      if (body && body.status === false) return rejectWithValue(body);
      const updatedRaw = body?.data ?? body?.gst ?? body ?? null;
      const updated: GstItem = {
        id: updatedRaw?.id ?? id,
        name: updatedRaw?.name ?? name,
        percentage: Number(updatedRaw?.percentage ?? percentage),
      };
      return updated;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data ?? err?.message ?? "Update failed");
    }
  }
);

export const deleteGst = createAsyncThunk(
  "gst/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/settings/gst/delete/${id}`);
      const body = res.data ?? res;
      if (body && body.status === false) return rejectWithValue(body);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data ?? err?.message ?? "Delete failed");
    }
  }
);

const gstSlice = createSlice({
  name: "gst",
  initialState,
  reducers: {
    // optional local-only helpers
    clearGstError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchGsts.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchGsts.fulfilled, (s, action: PayloadAction<GstItem[]>) => {
        s.loading = false;
        s.items = action.payload;
      })
      .addCase(fetchGsts.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload as any ?? String(action.error?.message ?? "Failed to load");
      })

      // create
      .addCase(createGst.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createGst.fulfilled, (s, action: PayloadAction<GstItem>) => {
        s.saving = false;
        s.items = [action.payload, ...s.items];
      })
      .addCase(createGst.rejected, (s, action) => {
        s.saving = false;
        s.error = action.payload as any ?? String(action.error?.message ?? "Create failed");
      })

      // update
      .addCase(updateGst.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(updateGst.fulfilled, (s, action: PayloadAction<GstItem>) => {
        s.saving = false;
        s.items = s.items.map((it) => (String(it.id) === String(action.payload.id) ? action.payload : it));
      })
      .addCase(updateGst.rejected, (s, action) => {
        s.saving = false;
        s.error = action.payload as any ?? String(action.error?.message ?? "Update failed");
      })

      // delete
      .addCase(deleteGst.pending, (s, action) => {
        s.deletingId = action.meta.arg;
        s.error = null;
      })
      .addCase(deleteGst.fulfilled, (s, action: PayloadAction<string | number>) => {
        s.deletingId = null;
        s.items = s.items.filter((it) => String(it.id) !== String(action.payload));
      })
      .addCase(deleteGst.rejected, (s, action) => {
        s.deletingId = null;
        s.error = action.payload as any ?? String(action.error?.message ?? "Delete failed");
      });
  },
});

export const { clearGstError } = gstSlice.actions;
export default gstSlice.reducer;
