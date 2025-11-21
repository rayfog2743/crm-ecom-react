// src/context/GstContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/api/axios";

export type GstItem = {
  id: string | number;
  name: string;
  percentage: number;
};

type GstContextValue = {
  items: GstItem[];
  loading: boolean;
  error: string | null;
  fetchGsts: () => Promise<void>;
  addGst: (payload: { name: string; percentage: number }) => Promise<GstItem | null>;
  updateGst: (id: string | number, payload: { name: string; percentage: number }) => Promise<GstItem | null>;
  deleteGst: (id: string | number) => Promise<boolean>;
};

const GstContext = createContext<GstContextValue | undefined>(undefined);

const normalizeRows = (rows: any[]): GstItem[] =>
  rows.map((r, i) => ({
    id: r.id ?? r._id ?? r.gst_id ?? r.gstId ?? `srv-${i}`,
    name: r.name ?? "",
    percentage: Number(r.percentage ?? r.percentage_percent ?? r.per ?? 0),
  }));

export const GstProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GstItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGsts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/settings/gst/show");
      const body = res.data;
      let rows: any[] = [];
      if (Array.isArray(body)) rows = body;
      else if (Array.isArray(body.data)) rows = body.data;
      else if (Array.isArray(body.rows)) rows = body.rows;
      else if (Array.isArray(body.gsts)) rows = body.gsts;
      else if (body && typeof body === "object" && Array.isArray(Object.values(body))) {
        rows = body.data ?? [];
      }
      setItems(normalizeRows(rows));
    } catch (err: any) {
      console.error("GstProvider: fetchGsts failed", err);
      setItems([]);
      setError(err?.message ?? "Failed to load GSTs");
    } finally {
      setLoading(false);
    }
  }, []);

  const addGst = useCallback(async (payload: { name: string; percentage: number }) => {
    try {
      const res = await api.post("/admin/settings/gst/add", payload);
      const body = res.data;
      if (body && body.status === false) {
        // pass through error to caller
        throw new Error(body.message || "Failed to add GST");
      }
      const createdRaw = body?.data ?? body?.gst ?? body ?? null;
      const created: GstItem = {
        id: createdRaw?.id ?? createdRaw?._id ?? `tmp-${Date.now()}`,
        name: createdRaw?.name ?? payload.name,
        percentage: Number(createdRaw?.percentage ?? payload.percentage),
      };
      setItems((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      console.error("GstProvider: addGst failed", err);
      throw err;
    }
  }, []);

  const updateGst = useCallback(async (id: string | number, payload: { name: string; percentage: number }) => {
    try {
      const res = await api.post(`/admin/settings/gst/update/${id}`, payload);
      const body = res.data;
      if (body && body.status === false) {
        throw new Error(body.message || "Failed to update GST");
      }
      const updatedRaw = body?.data ?? body?.gst ?? body ?? null;
      const updated: GstItem = {
        id: updatedRaw?.id ?? id,
        name: updatedRaw?.name ?? payload.name,
        percentage: Number(updatedRaw?.percentage ?? payload.percentage),
      };
      setItems((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
      return updated;
    } catch (err: any) {
      console.error("GstProvider: updateGst failed", err);
      throw err;
    }
  }, []);

  const deleteGst = useCallback(async (id: string | number) => {
    try {
      const res = await api.delete(`/admin/settings/gst/delete/${id}`);
      const body = res.data ?? res;
      if (body && body.status === false) {
        throw new Error(body.message || "Failed to delete GST");
      }
      setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
      return true;
    } catch (err: any) {
      console.error("GstProvider: deleteGst failed", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    void fetchGsts();
  }, [fetchGsts]);

  return (
    <GstContext.Provider value={{ items, loading, error, fetchGsts, addGst, updateGst, deleteGst }}>
      {children}
    </GstContext.Provider>
  );
};

export const useGst = (): GstContextValue => {
  const ctx = useContext(GstContext);
  if (!ctx) throw new Error("useGst must be used within a GstProvider");
  return ctx;
};

