// ProductView.jsx
import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ProductView() {
     const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const getProduct = async () => {
    try {
      const res = await api.get(`/admin/products/product/${id}`);
      console.log("Fetched Product:", res.data.data);
      setProduct(res.data.data);
    } catch (err) {
      console.error("Error fetching product", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
  }, [id]);

if (loading) {
  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-3 text-gray-500">
      {/* Spinner */}
      <svg
        className="animate-spin h-10 w-10 text-indigo-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>

      {/* Loading text */}
      <p className="text-lg font-medium">Loading product...</p>
      <p className="text-sm text-gray-400">Please wait while we fetch the details.</p>
    </div>
  );
}

  if (!product) {
    return (
      <div className="p-6 text-center text-red-500">Product not found</div>
    );
  }

  // Safe SEO keywords handling
//   const seoKeywords = Array.isArray(product.seo_keywords)
//     ? product.seo_keywords
//     : typeof product.seo_keywords === "string"
//     ? product.seo_keywords.split(",").map((k) => k.trim())
//     : [];

    let seoKeywords = [];

try {
  seoKeywords = Array.isArray(product.seo_keywords)
    ? product.seo_keywords
    : JSON.parse(product.seo_keywords || "[]");
} catch (e) {
  console.warn("Invalid SEO keywords format");
  seoKeywords = [];
}

  // Safe fallback arrays
  const images = Array.isArray(product.images) ? product.images : [];
  const variations = Array.isArray(product.variations) ? product.variations : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

  // Stock
  const totalStock = variations.reduce(
    (s, v) => s + Number(v.stock || 0),
    0
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="text-xs text-gray-500 mb-1">
            <span className="hover:underline cursor-pointer">Dashboard</span>
            <span className="px-2">/</span>
           
            <span
                className="hover:underline cursor-pointer"
                onClick={() => navigate("/ProductList")}
                >
                Products
                </span>
            <span className="px-2">/</span>
            <span className="font-medium text-indigo-700">View</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {product.name}
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Product ID <span className="font-medium">#{product.id}</span> • SKU{" "}
            <span className="font-medium">{product.sku}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Price</div>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold text-emerald-700">
                ₹{product.price}
              </div>
              <div className="text-sm line-through text-gray-400">
                ₹{product.discount_price}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              You save{" "}
              <span className="font-medium">
                ₹
                {(Number(product.price) - Number(product.discount_price)).toFixed(
                  2
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (Images) */}
        <div className="bg-white rounded-xl shadow p-4">
          <div
            className="w-full h-72 rounded-lg overflow-hidden border relative cursor-pointer"
            onClick={() => setLightboxSrc(product.image_url)}
          >
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition"
            />
            <div className="absolute top-3 left-3 bg-black/40 text-white px-2 py-1 rounded text-xs">
              Primary
            </div>
            <div className="absolute top-3 right-3 bg-white/80 text-xs px-2 py-1 rounded">
              Click to view
            </div>
          </div>

          {/* GALLERY */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Gallery</h4>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  className="w-full h-20 rounded-md overflow-hidden border hover:scale-105 transition"
                  onClick={() => setLightboxSrc(img.image_url)}
                >
                  <img
                    src={img.image_url}
                    alt={`g-${img.id}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Category</h4>
            <div className="flex items-center gap-3 mt-2">
              <img
                src={product.category?.image_url}
                alt="cat"
                className="w-12 h-12 rounded-md object-cover border"
              />
              <div>
                <div className="font-medium">{product.category?.name}</div>
                <div className="text-xs text-gray-400">
                  ID: {product.category?.id}
                </div>
              </div>
            </div>
          </div>

          {/* TOTAL STOCK */}
          <div className="mt-4 flex gap-2 items-center">
            <div className="text-xs text-gray-500">Total stock</div>
            <div className="ml-auto font-semibold text-gray-700">
              {totalStock}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500">Short description</div>
              <p className="text-gray-700 mt-2">{product.plain_desc}</p>
            </div>

            {/* SEO META */}
            <div>
              <div className="text-xs text-gray-500">Meta</div>
              <div className="flex gap-2 items-center mt-2">
                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                  SEO
                </span>
                <div className="text-sm">
                  <div className="font-medium">{product.seo_title}</div>
                  <div className="text-xs text-gray-400">
                    {product.seo_description}
                  </div>
                </div>
              </div>

              {/* SEO KEYWORDS */}
              <div className="mt-3">
                <div className="text-xs text-gray-500">Keywords</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {seoKeywords.map((k) => (
                    <span
                      key={k}
                      className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RICH DESCRIPTION */}
          <div className="mt-6">
            <h4 className="text-lg font-medium">Details</h4>
            <div
              className="prose mt-3 max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.rich_desc }}
            />
          </div>

          {/* VARIATIONS & COLORS */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Variations</h4>
              <div className="space-y-3">
                {variations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{v.option}</div>
                      <div className="text-xs text-gray-400">SKU: {v.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Extra: <span className="font-semibold">₹{v.extra_price}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Stock: <span className="font-semibold">{v.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLORS */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Colors</h4>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg"
                  >
                    <span
                      className="w-6 h-6 rounded-sm border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* <div className="mt-6">
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700">
                  Publish
                </button>
                <button className="ml-3 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
                  Save draft
                </button>
              </div> */}
            </div>
          </div>

          {/* FOOTER META */}
          <div className="mt-6 border-t pt-4 text-sm text-gray-500 flex items-center justify-between">
            <div>Created: {new Date(product.created_at).toLocaleString()}</div>
            <div>
              Discounted from ₹{product.price} to ₹{product.discount_price}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-4xl w-full mx-4">
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute right-2 top-2 bg-white rounded-full p-1 shadow z-10"
            >
              ✕
            </button>
            <img
              src={lightboxSrc}
              alt="preview"
              className="w-full h-[70vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
