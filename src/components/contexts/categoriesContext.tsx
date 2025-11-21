import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

/** Types */
export type CategoryItem = {
  id: string | number;
  category: string;
  image_url?: string;
  image?: string;
  createdAt?: string | null;
  productCount?: number;
};

type FetchOpts = { q?: string; page?: number; per_page?: number };

type CategoriesContextValue = {
  categories: CategoryItem[];
  loading: boolean;
  totalItems: number;
  page: number;
  perPage: number;
  totalPages: number;
  fetchCategories: (opts?: FetchOpts) => Promise<void>;
  fetchSingle: (id: string | number) => Promise<CategoryItem | null>;
  createCategory: (payload: { name: string; file?: File | null }) => Promise<CategoryItem | null>;
  updateCategory: (id: string | number, payload: { name: string; file?: File | null }) => Promise<CategoryItem | null>;
  deleteCategory: (id: string | number) => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

/** Helpers (mirrors your normalization logic) */
const SAMPLE_IMG = "/placeholder.png";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function unsplashForCategory(cat?: string, size = "600x400") {
  const keyword = (cat || "grocery").split(" ").slice(0, 3).join(",");
  return `https://source.unsplash.com/featured/${size}/?${encodeURIComponent(keyword)}`;
}

function normalizeRow(r: any, i = 0): CategoryItem {
  const rawCount = r.products_count ?? r.count ?? r.productsCount ?? 0;
  const parsedCount = typeof rawCount === "string" ? Number(rawCount || 0) : Number(rawCount ?? 0);

  let resolvedImage: string | undefined;
  if (r.image_url && String(r.image_url).trim()) resolvedImage = String(r.image_url).trim();
  else if (r.imageUrl && String(r.imageUrl).trim()) resolvedImage = String(r.imageUrl).trim();
  else if (r.image && String(r.image).trim()) {
    const raw = String(r.image).trim();
    if (/^https?:\/\//i.test(raw)) resolvedImage = raw;
    else {
      try {
        const base = (api as any).defaults?.baseURL ?? window.location.origin;
        resolvedImage = new URL(raw.replace(/^\/+/, ""), base).toString();
      } catch {
        try { resolvedImage = `${window.location.origin}/storage/${raw.replace(/^\/+/, "")}`; } catch {}
      }
    }
  }

  const finalImage = resolvedImage ?? (r.name ? unsplashForCategory(r.name) : undefined) ?? SAMPLE_IMG;

  return {
    id: r.id ?? r._id ?? r.categoryId ?? `srv-${i}`,
    category: (r.name ?? r.category ?? r.title ?? `Category ${i + 1}`).toString(),
    image_url: finalImage,
    image: r.image ?? undefined,
    createdAt: r.created_at ?? r.createdAt ?? null,
    productCount: Number.isFinite(parsedCount) ? parsedCount : 0,
  };
}

/** Pagination reader (copied from your code) */
function readPagination(metaLike: any) {
  const out = {
    total: Number(metaLike?.total ?? metaLike?.count ?? metaLike?.records ?? metaLike?.totalRecords ?? 0),
    per_page: Number(metaLike?.per_page ?? metaLike?.perPage ?? metaLike?.limit ?? metaLike?.pageSize ?? 10),
    current_page: Number(metaLike?.current_page ?? metaLike?.page ?? metaLike?.currentPage ?? 1),
    last_page: Number(metaLike?.last_page ?? metaLike?.total_pages ?? Math.ceil((metaLike?.total ?? 0) / (metaLike?.per_page ?? 10))),
  };
  out.per_page = out.per_page > 0 ? out.per_page : 10;
  out.current_page = out.current_page >= 1 ? out.current_page : 1;
  out.last_page = out.last_page >= 1 ? out.last_page : 1;
  return out;
}

/** Provider */
export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = useCallback(async (opts?: FetchOpts) => {
    setLoading(true);
    try {
      const params: any = {};
      if (opts?.q) params.q = opts.q;
      if (opts?.page) params.page = opts.page;
      if (opts?.per_page) params.per_page = opts.per_page;

      const res = await api.get("/admin/categories/show", { params });
      const body = res?.data ?? null;

      let rows: any[] = [];
      if (Array.isArray(body)) rows = body;
      else if (Array.isArray(body.data)) rows = body.data;
      else if (Array.isArray(body.rows)) rows = body.rows;
      else if (Array.isArray(body.categories)) rows = body.categories;
      else {
        const arr = Object.values(body || {}).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) rows = arr as any[];
      }

      const normalized = rows.map((r, i) => normalizeRow(r, i));
      setCategories(normalized);

      const metaCandidate = body?.meta ?? body?.pagination ?? body?.pagination_data ?? body;
      const { total, per_page, current_page, last_page } = readPagination(metaCandidate ?? {});
      setTotalItems(Number.isFinite(total) ? total : normalized.length);
      setPerPage(per_page > 0 ? per_page : opts?.per_page ?? perPage);
      setPage(current_page >= 1 ? current_page : opts?.page ?? 1);
      setTotalPages(last_page >= 1 ? last_page : Math.max(1, Math.ceil((total || normalized.length) / (per_page || perPage))));
    } catch (err: any) {
      console.error("fetchCategories error:", err);
      const serverMsg = err?.response?.data?.message ?? err?.message ?? "Network error while loading categories.";
      toast.error(serverMsg);
      setCategories([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  const fetchSingle = useCallback(async (id: string | number) => {
    try {
      const res = await api.get(`/admin/categories/show/${id}`);
      const body = res?.data ?? null;
      const item = body?.data ?? body?.category ?? body ?? null;
      return item ? normalizeRow(item) : null;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? `Failed to fetch item`;
      throw new Error(msg);
    }
  }, []);

  const createCategory = useCallback(async (payload: { name: string; file?: File | null }) => {
    try {
      const fd = new FormData();
      fd.append("name", payload.name);
      if (payload.file) fd.append("image", payload.file, payload.file.name);
      const res = await api.post("/admin/categories/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const body = res?.data ?? null;
      const serverItem = body?.data ?? body?.category ?? body ?? null;
      const normalized = serverItem ? normalizeRow(serverItem) : null;
      if (normalized) setCategories((p) => [normalized, ...p]);
      return normalized;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Create failed";
      throw new Error(msg);
    }
  }, []);

  const updateCategory = useCallback(async (id: string | number, payload: { name: string; file?: File | null }) => {
    try {
      const fd = new FormData();
      fd.append("name", payload.name);
      fd.append("_method", "POST");
      if (payload.file) fd.append("image", payload.file, payload.file.name);
      const res = await api.post(`/admin/categories/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const body = res?.data ?? null;
      const serverItem = body?.data ?? body?.category ?? body ?? null;
      const normalized = serverItem ? normalizeRow(serverItem) : null;
      if (normalized) setCategories((p) => p.map((x) => (String(x.id) === String(id) ? normalized : x)));
      return normalized;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Update failed";
      throw new Error(msg);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string | number) => {
    try {
      await api.delete(`/admin/categories/delete/${id}`);
      setCategories((p) => p.filter((x) => String(x.id) !== String(id)));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Delete failed";
      throw new Error(msg);
    }
  }, []);

  // initial load
  useEffect(() => {
    void fetchCategories({ q: "", page: 1, per_page: perPage });
  }, [fetchCategories, perPage]);

  const ctx: CategoriesContextValue = {
    categories,
    loading,
    totalItems,
    page,
    perPage,
    totalPages,
    fetchCategories,
    fetchSingle,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return <CategoriesContext.Provider value={ctx}>{children}</CategoriesContext.Provider>;
};

/** Hook */
export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
