import React from "react";

/**
 * Props:
 * - page (number) current page
 * - perPage (number) items per page
 * - total (number) total items
 * - lastPage (number)
 * - onPageChange(pageNumber)
 * - onPerPageChange(perPage)
 *
 * Simple pagination UI with page buttons and per-page select.
 */
export default function PaginationControls({
  page = 1,
  perPage = 10,
  total = 0,
  lastPage = 1,
  onPageChange = () => {},
  onPerPageChange = () => {},
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Build page numbers to show: if many pages, show a compact set with ellipsis
  const buildPages = () => {
    const pages = [];
    const maxButtons = 7; // max visible page buttons
    if (lastPage <= maxButtons) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      // show first, maybe left ellipsis, some mid pages, right ellipsis, last
      pages.push(1);
      const left = Math.max(2, page - 1);
      const right = Math.min(lastPage - 1, page + 1);

      if (left > 2) pages.push("left-ellipsis");
      for (let p = left; p <= right; p++) pages.push(p);
      if (right < lastPage - 1) pages.push("right-ellipsis");
      pages.push(lastPage);
    }
    return pages;
  };

  const pages = buildPages();

  return (
    <div className="mt-4 p-4 border rounded-lg bg-white flex items-center justify-between gap-4">
      {/* Left: Showing x-y of z */}
      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-medium text-gray-800">
          {start}-{end}
        </span>{" "}
        of <span className="font-medium text-gray-800">{total}</span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Prev */}
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50"
        >
          Prev
        </button>

        {/* Page buttons */}
        <div className="inline-flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "left-ellipsis" || p === "right-ellipsis" ? (
              <span key={String(p) + idx} className="px-2 text-sm text-gray-500">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-3 py-1 rounded text-sm ${
                  p === page
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-gray-700 border"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50"
        >
          Next
        </button>

        {/* Per page */}
       
      </div>
    </div>
  );
}
