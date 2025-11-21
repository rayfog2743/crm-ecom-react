// src/contexts/VariantContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../../api/axios"; // adjust path if needed
import toast from "react-hot-toast";
const VariantContext = createContext(null);

export function VariantProvider({ children }) {
  const [loading, setLoading] = useState(false);

  const fetchVariations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/variation");
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      return list;
    } catch (err) {
      console.error("fetchVariations error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to fetch variations";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttributes = useCallback(async (opts = {}) => {
    // opts can include variation_id if caller wants filtered fetch
    setLoading(true);
    try {
      const q = opts.variation_id ? `?variation_id=${String(opts.variation_id)}` : "";
      const res = await api.get(`/admin/attributes${q}`);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      return list;
    } catch (err) {
      console.error("fetchAttributes error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to load attributes";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVariation = useCallback(async ({ name }) => {
    const n = String(name || "").trim();
    if (!n) {
      toast.error("Name required");
      throw new Error("Name required");
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", n);
      const res = await api.post("/admin/variation/add", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Variation created");
      return res?.data ?? res;
    } catch (err) {
      console.error("createVariation error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to create variation";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariation = useCallback(async ({ id, name }) => {
    const n = String(name || "").trim();
    if (!n) {
      toast.error("Name required");
      throw new Error("Name required");
    }
    if (!id) {
      toast.error("No variation selected to update");
      throw new Error("No variation id");
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", n);
      const res = await api.post(`/admin/variation/update/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Variation updated");
      return res?.data ?? res;
    } catch (err) {
      console.error("updateVariation error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to update variation";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVariation = useCallback(async (id) => {
    if (!id) {
      throw new Error("id required");
    }
    setLoading(true);
    try {
      const res = await api.delete(`/admin/variation/delete/${id}`);
      toast.success("Variation deleted");
      return res?.data ?? res;
    } catch (err) {
      console.error("deleteVariation error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to delete variation";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Attributes (create/update) — preserve FormData + multipart behavior
  const createAttribute = useCallback(async ({ variation_id, attribute_name, price, imageFile = null }) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("variation_id", String(variation_id));
      fd.append("attribute_name", String(attribute_name));
      fd.append("price", String(price ?? ""));
      if (imageFile) fd.append("image", imageFile);
      const res = await api.post("/admin/attributes/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Attribute created");
      return res?.data ?? res;
    } catch (err) {
      console.error("createAttribute error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to create attribute";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAttribute = useCallback(async (id, { variation_id, attribute_name, price, imageFile = null }) => {
    if (!id) throw new Error("id required");
    setLoading(true);
    try {
      const fd = new FormData();
      if (variation_id != null) fd.append("variation_id", String(variation_id));
      if (attribute_name != null) fd.append("attribute_name", String(attribute_name));
      if (price != null) fd.append("price", String(price));
      if (imageFile) fd.append("image", imageFile);
      const res = await api.post(`/admin/attributes/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Attribute updated");
      return res?.data ?? res;
    } catch (err) {
      console.error("updateAttribute error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to update attribute";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Variants create/update (same FormData + endpoint behaviour)
  const createVariants = useCallback(async (variantsJson, variantFiles = []) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("variants", JSON.stringify(variantsJson));
      (variantFiles || []).forEach((f) => fd.append("variant_images[]", f));
      const res = await api.post("/admin/variants/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Variants created");
      return res?.data ?? res;
    } catch (err) {
      console.error("createVariants error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to create variants";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariants = useCallback(async (productId, variantsJson, variantFiles = []) => {
    if (!productId) throw new Error("productId required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("variants", JSON.stringify(variantsJson));
      (variantFiles || []).forEach((f) => fd.append("variant_images[]", f));
      const res = await api.post(`/admin/products/${productId}/variants`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Variants updated");
      return res?.data ?? res;
    } catch (err) {
      console.error("updateVariants error", err);
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to update variants";
      toast.error(String(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const ctx = {
    loading,
    fetchVariations,
    fetchAttributes,
    createVariation,
    updateVariation,
    deleteVariation,
    createAttribute,
    updateAttribute,
    createVariants,
    updateVariants,
  };

  return <VariantContext.Provider value={ctx}>{children}</VariantContext.Provider>;
}

export function useVariantContext() {
  const ctx = useContext(VariantContext);
  if (!ctx) {
    throw new Error("useVariantContext must be used within VariantProvider");
  }
  return ctx;
}
