import React, { useState } from "react";

/* ---------- Toggle (works reliably) ---------- */

function Toggle({ value = false, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!value);
      }}
      aria-pressed={!!value}
      className={`relative w-12 h-6 rounded-full flex items-center transition-colors duration-200
        ${value ? "bg-green-600" : "bg-[#176bf3ff]"}`}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-md transition-all duration-200`}
        style={{
          transform: value ? "translateX(24px)" : "translateX(0px)",
          backgroundColor: value ? "#ffffff" : "#176bf3ff", // white when ON, dark gray when OFF
        }}
      />
    </button>
  );
}

/* ---------- Card wrapper ---------- */
function Card({ children }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-5 flex flex-col justify-between min-h-[170px]">
      {children}
    </div>
  );
}

/* ---------- Reusable Method Card ---------- */
function MethodCard({ method, cfg = {}, onUpdate, onSave, saving }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md grid place-items-center text-white font-semibold ${method.color || "bg-indigo-600"}`}>
            {method.initials}
          </div>
          <div>
            <div className="font-medium">{method.label}</div>
            <div className="text-xs text-slate-500">{method.subtitle}</div>
          </div>
        </div>

        <Toggle value={Boolean(cfg.enabled)} onChange={(v) => onUpdate(method.id, { enabled: v })} />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {method.fields.map((f) => (
          <div key={f.key}>
            <label className="text-sm text-slate-600">{f.label}</label>
            <input
              value={cfg[f.key] ?? ""}
              onChange={(e) => onUpdate(method.id, { [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full mt-2 p-2 border rounded"
              type={f.type ?? "text"}
            />
          </div>
        ))}

        {/* optional numeric toggles like min order or days */}
       
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => onSave(method.id)}
          disabled={!!saving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}

/* ---------- Main ShippingSettings component ---------- */
export default function ShippingSettings() {
  const [config, setConfig] = useState({
    flatrate: { enabled: false, cost: "50", min_order: "", estimated_days: "3" },
    freeshipping: { enabled: false, min_order: "1000" },
    localpickup: { enabled: false, pickup_note: "Pickup at store", estimated_days: "0" },
    shiprocket: { enabled: false, api_key: "", api_secret: "", estimator_url: "" },
  });

  const [saving, setSaving] = useState({});

  const methods = [
    {
      id: "flatrate",
      label: "Flat Rate",
      subtitle: "Fixed shipping cost per order",
      initials: "FR",
      color: "bg-indigo-600",
      hasToggle: false,
      fields: [
        { key: "cost", label: "Cost (₹)", placeholder: "e.g. 50", type: "number" },
        { key: "min_order", label: "Min Order (optional)", placeholder: "e.g. 500", type: "number" },
        { key: "estimated_days", label: "Estimated Days", placeholder: "e.g. 3", type: "number" },
      ],
    },
    {
      id: "freeshipping",
      label: "Free Shipping",
      subtitle: "Free above minimum order value",
      initials: "FS",
      color: "bg-indigo-600",
      hasToggle: false,
      fields: [
        { key: "min_order", label: "Min Order for Free Shipping (₹)", placeholder: "e.g. 1000", type: "number" },
      ],
    },
    {
      id: "localpickup",
      label: "Local Pickup",
      subtitle: "Customer picks up from store",
      initials: "LP",
      color: "bg-indigo-600",
      hasToggle: true,
      fields: [
        { key: "pickup_note", label: "Pickup Note", placeholder: "e.g. Pickup at store", type: "text" },
        { key: "estimated_days", label: "Ready In (days)", placeholder: "e.g. 0", type: "number" },
      ],
    },
    {
      id: "shiprocket",
      label: "Shiprocket (API)",
      subtitle: "Use Shiprocket rates (API keys)",
      initials: "SR",
      color: "bg-indigo-600",
      hasToggle: false,
      fields: [
        { key: "api_key", label: "API Key", placeholder: "Shiprocket API Key" },
        { key: "api_secret", label: "API Secret", placeholder: "Shiprocket API Secret" },
        { key: "estimator_url", label: "Estimator URL (optional)", placeholder: "Rate estimator endpoint" },
      ],
    },
    {
      id: "Delhivery",
      label: "Delhivery (API)",
      subtitle: "Use Delhivery rates (API keys)",
      initials: "DE",
      color: "bg-indigo-600",
      hasToggle: false,
      fields: [
        { key: "api_key", label: "API Key", placeholder: "Delhivery API Key" },
        { key: "api_secret", label: "API Secret", placeholder: "Delhivery API Secret" },
        { key: "estimator_url", label: "Estimator URL (optional)", placeholder: "Rate estimator endpoint" },
      ],
    },
  ];

  const onUpdate = (id, patch) => {
    setConfig((prev) => {
      const prevCfg = prev[id] || {};
      return { ...prev, [id]: { ...prevCfg, ...patch } };
    });
  };

  const onSave = async (id) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      // TODO: replace with actual API call to save the settings for 'id'
      // e.g. await axios.post('/admin/settings/shipping', { method: id, settings: config[id] })
      await new Promise((r) => setTimeout(r, 700)); // simulate
      alert(`${id} saved`);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Shipping Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((m) => (
          <MethodCard
            key={m.id}
            method={m}
            cfg={config[m.id] ?? {}}
            onUpdate={onUpdate}
            onSave={onSave}
            saving={saving[m.id]}
          />
        ))}
      </div>
    </div>
  );
}
