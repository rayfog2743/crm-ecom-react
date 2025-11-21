// AddVariationModal.jsx (or VariationModal.jsx — same idea)
import React, { useState, useEffect } from "react";

export default function AddVariationModal({
  open,
  onClose,
  onSave,
  editingId = null,
  defaultName = ""
}) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName || "");
  }, [defaultName, open]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return;

    // --- send only the string (not an object) ---
    console.log("Modal — sending name:", JSON.stringify(trimmed));
    onSave(trimmed);

    setName("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Variation" : "Add Variation"}
        </h2>

        <input
          type="text"
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Variation name (e.g. Size, Color)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setName("");
              onClose();
            }}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
