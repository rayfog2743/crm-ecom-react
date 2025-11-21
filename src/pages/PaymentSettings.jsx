import React, { useState } from "react";

/* ---------- Robust Toggle: button-based, stops propagation ---------- */
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
        ${value ? "bg-green-600" : "bg-[#ccc]"}`}
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

/* ---------- Reusable Gateway Card ---------- */
function GatewayCard({ gateway, cfg = {}, onUpdate, onSave, saving }) {
  // cfg is defaulted to {} to avoid undefined errors
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md grid place-items-center text-white font-semibold ${gateway.color || "bg-indigo-600"}`}>
            {gateway.initials}
          </div>

          <div>
            <div className="font-medium">{gateway.label}</div>
            <div className="text-xs text-slate-500">{gateway.subtitle}</div>
          </div>
        </div>

        {/* use safe boolean for value */}
        <Toggle
          value={Boolean(cfg.enabled)}
          onChange={(v) => onUpdate(gateway.id, { enabled: v })}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {gateway.fields.map((f) => (
          <div key={f.key}>
            <label className="text-sm text-slate-600">{f.label}</label>
            <input
              value={cfg[f.key] ?? ""}
              onChange={(e) => onUpdate(gateway.id, { [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full mt-2 p-2 border rounded"
              type={f.type ?? "text"}
            />
          </div>
        ))}

        {gateway.hasSandbox ? (
          <div className="flex items-center gap-3 mt-2">
            <label className="text-sm text-slate-600">Sandbox</label>
            <div
              onClick={() => onUpdate(gateway.id, { sandbox: !Boolean(cfg.sandbox) })}
              className={`ml-3 w-10 h-5 rounded-full p-0.5 cursor-pointer ${cfg.sandbox ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition ${cfg.sandbox ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => onSave(gateway.id)}
          disabled={!!saving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}

/* ---------- Main PaymentGateways component (maps cards) ---------- */
export default function PaymentGateways() {
  // initial config state for each gateway:
  const [config, setConfig] = useState({
    cashfree: { enabled: false, appId: "", appSecret: "", sandbox: false },
    phonepe: { enabled: false, merchantId: "", merchantSecret: "", sandbox: false },
    paypal: { enabled: false, clientId: "", clientSecret: "", sandbox: false },
    stripe: { enabled: false, key: "", secret: "" },
  });

  const [saving, setSaving] = useState({});

  // gateways meta array
  const gateways = [
    {
      id: "paypal",
      label: "PayPal",
      subtitle: "Paypal Client Id & Secret",
      initials: "PP",
      color: "bg-indigo-600",
      hasSandbox: false,
      fields: [
        { key: "clientId", label: "Client Id", placeholder: "Paypal Client Id" },
        { key: "clientSecret", label: "Client Secret", placeholder: "Paypal Client Secret" },
      ],
    },
    {
      id: "phonepe",
      label: "PhonePe",
      subtitle: "Merchant Id & Secret",
      initials: "PP",
      color: "bg-indigo-600",
      hasSandbox: false,
      fields: [
        { key: "merchantId", label: "Merchant Id", placeholder: "Merchant Id" },
        { key: "merchantSecret", label: "Merchant Secret", placeholder: "Merchant Secret" },
      ],
    },
    {
      id: "cashfree",
      label: "Cashfree",
      subtitle: "App Id & Secret",
      initials: "CF",
      color: "bg-indigo-600",
      hasSandbox: false,
      fields: [
        { key: "appId", label: "App Id", placeholder: "App Id" },
        { key: "appSecret", label: "App Secret", placeholder: "App Secret" },
      ],
    },
    {
      id: "stripe",
      label: "Stripe",
      subtitle: "Stripe Key & Secret",
      initials: "St",
      color: "bg-indigo-600",
      hasSandbox: false,
      fields: [
        { key: "key", label: "Key", placeholder: "Stripe Key" },
        { key: "secret", label: "Secret", placeholder: "Stripe Secret" },
      ],
    },
  ];

  // safe update handler for any gateway
  const onUpdate = (id, patch) => {
    setConfig((prev) => {
      const prevCfg = prev[id] || {};
      return { ...prev, [id]: { ...prevCfg, ...patch } };
    });
  };

  // save handler: replace with your API
  const onSave = async (id) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await new Promise((r) => setTimeout(r, 700));
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
      <h2 className="text-lg font-semibold mb-6">Payment Gateways</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gateways.map((g) => (
          <GatewayCard
            key={g.id}
            gateway={g}
            cfg={config[g.id] ?? {}}
            onUpdate={onUpdate}
            onSave={onSave}
            saving={saving[g.id]}
          />
        ))}
      </div>
    </div>
  );
}
