import React, { useEffect, useState } from "react";
import api from "../api/axios"; // adjust path if needed
import { useNavigate } from "react-router-dom";

// fallback image from your uploaded file (developer-provided path)
const FALLBACK_IMG = "/mnt/data/e21e7375-bfd1-4312-b889-76e4473f673e.png";

export default function ProductList() {
  const [items, setItems] = useState([]); // products array
   const navigate = useNavigate();
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    next_page_url: null,
    prev_page_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const fetchProducts = async (page = 1, per = perPage) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?page=${page}&per_page=${per}&search=${search}`);
      // your API returns { data: [...], settings: { current_page, per_page, total, ... } }
      const payload = res.data ?? {};

      const list = Array.isArray(payload.data) ? payload.data : [];
      const settings = payload.settings ?? {};

      // Compute last_page (if API doesn't supply)
      const lastPage = settings.per_page ? Math.ceil((settings.total || list.length) / settings.per_page) : 1;

      setItems(list);
      setMeta({
        current_page: settings.current_page ?? 1,
        per_page: settings.per_page ?? per,
        total: settings.total ?? list.length,
        from: settings.from ?? (list.length ? 1 : 0),
        to: settings.to ?? (list.length ? list.length : 0),
        next_page_url: settings.next_page_url ?? null,
        prev_page_url: settings.prev_page_url ?? null,
        last_page: lastPage,
      });
    } catch (err) {
      console.error("fetchProducts error:", err.response?.data ?? err);
      // friendly alert
      alert("Failed to fetch products. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // navigate to page
  const goPage = (target) => {
    if (!meta) return;
    if (target < 1 || target > (meta.last_page || 1)) return;
    fetchProducts(target, meta.per_page);
  };

  // small helper to show a compact page list (windowed)
  const renderPageButtons = () => {
    const current = meta.current_page || 1;
    const last = meta.last_page || 1;
    const windowSize = 5; // how many page numbers to show
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > last) {
      end = last;
      start = Math.max(1, end - windowSize + 1);
    }
    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);

    return (
      <>
        {start > 1 && (
          <button onClick={() => goPage(1)} className="px-2 py-1 border rounded">1</button>
        )}
        {start > 2 && <span className="px-2">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goPage(p)}
            className={`px-3 py-1 border rounded ${p === current ? "bg-indigo-600 text-white" : ""}`}
          >
            {p}
          </button>
        ))}
        {end < last - 1 && <span className="px-2">...</span>}
        {end < last && (
          <button onClick={() => goPage(last)} className="px-2 py-1 border rounded">{last}</button>
        )}
      </>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Products</h1>

        <div className="flex items-center gap-2">
                <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded px-3 py-1"
                />

                <button
                onClick={() => fetchProducts(1, perPage)}
                className="bg-indigo-600 text-white px-3 py-1 rounded"
                >
                Search
                </button>
            </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              const p = Number(e.target.value) || 10;
              setPerPage(p);
              fetchProducts(1, p);
            }}
            className="border rounded px-2 py-1"
          >
            {[2, 5, 6, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

         <button
     onClick={() => navigate("/add-products")}
      className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
    >
      + Add Product
    </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Discount</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-center">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center">No products found</td>
              </tr>
            ) : (
              items.map((prod, idx) => {
                const index = (meta.from ?? 0) + idx;
                // pick safe image url (use image_url or main_image or images[0].path)
                const imageUrl =
                  prod.image_url ??
                  (prod.main_image ? (prod.main_image.startsWith("http") ? prod.main_image : `http://localhost:8000${prod.main_image}`) : null) ??
                  (Array.isArray(prod.images) && prod.images[0]?.path ? (prod.images[0].path.startsWith("http") ? prod.images[0].path : `http://localhost:8000${prod.images[0].path}`) : null) ??
                  FALLBACK_IMG;

                return (
                  <tr key={prod.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 align-middle">{index}</td>

                    <td className="p-2">
                      <img
                        src={imageUrl}
                        alt={prod.name ?? "product"}
                        className="w-14 h-14 object-cover rounded-full"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                      />
                    </td>

                    <td className="p-2 align-middle">{prod.name ?? "—"}</td>

                    <td className="p-2 align-middle">
                      {prod.category ? (
                        <div>
                          <div className="font-medium">{prod.category.name ?? "—"}</div>
                          <div className="text-xs text-gray-400">id: {prod.category.id ?? "-"}</div>
                        </div>
                      ) : "—"}
                    </td>

                    <td className="p-2 align-middle">₹{prod.price ?? "—"}</td>
                    <td className="p-2 align-middle">₹{prod.discount_price ?? "—"}</td>

                    <td className="p-2 align-middle">
  <div className="flex gap-2">

    {/* VIEW BUTTON */}
    <button
   onClick={() => navigate(`/product-view/${prod.id}`)}
      className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      View
    </button>

    {/* EDIT BUTTON */}
    <button
     
      onClick={() => 
        
           alert("Working on Progress")
    }
      className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
    >
      Edit
    </button>

    {/* DELETE BUTTON */}
    <button
      onClick={() => {
        if (window.confirm("Do you really want to delete this product?")) {
          console.log("DELETE product", prod.id);
            alert("Working on Progress")
          // You can call delete API here
        }
      }}
      className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
    >
      Delete
    </button>

  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {meta ? `Showing ${meta.from ?? 0} to ${meta.to ?? 0} of ${meta.total ?? 0}` : ""}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goPage((meta.current_page ?? 1) - 1)}
            disabled={!meta.prev_page_url}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {renderPageButtons()}
          </div>

          <button
            onClick={() => goPage((meta.current_page ?? 1) + 1)}
            disabled={!meta.next_page_url}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
