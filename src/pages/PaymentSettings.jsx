import React, { useState } from "react";
import api from "../api/axios"; // <-- axios instance

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
          backgroundColor: value ? "#ffffff" : "#176bf3ff",
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

  const [saving, setSaving] = useState({}); // per-gateway saving state

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

  // helper: build credentials object from gateway.fields based on config
  const buildCredentials = (gatewayMeta, cfg) => {
    const creds = {};
    gatewayMeta.fields.forEach((f) => {
      // map field key to a credential key (use same key)
      if (cfg[f.key] !== undefined) creds[f.key] = cfg[f.key];
    });
    // include sandbox flag if present
    if (cfg?.sandbox !== undefined) creds.sandbox = !!cfg.sandbox;
    return creds;
  };

  // save handler for single gateway
  const onSave = async (id) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const gatewayMeta = gateways.find((g) => g.id === id);
    try {
      const payload = {
        gateway: id,
        label: gatewayMeta?.label || id,
        enabled: Boolean(config[id]?.enabled),
        credentials: buildCredentials(gatewayMeta, config[id] || {}),
      };
      // post to backend - adjust endpoint if needed
      await api.post("/payment-gateways/upsert", payload);
      alert(`${gatewayMeta?.label || id} saved`);
    } catch (err) {
      console.error("Save error", err);
      alert(`Failed to save ${id}`);
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  // ---------- NEW: Save All ----------
  const onSaveAll = async () => {
    // mark all gateways as saving
    const savingAllInitial = gateways.reduce((acc, g) => ({ ...acc, [g.id]: true }), {});
    setSaving(savingAllInitial);

    const promises = gateways.map(async (g) => {
      const id = g.id;
      const payload = {
        gateway: id,
        label: g.label,
        enabled: Boolean(config[id]?.enabled),
        credentials: buildCredentials(g, config[id] || {}),
      };
      try {
        const res = await api.post("/payment-gateways/upsert", payload);
        return { id, ok: true, res: res.data ?? null };
      } catch (err) {
        console.error(`SaveAll error for ${id}`, err);
        return { id, ok: false, err };
      }
    });

    const results = await Promise.all(promises);

    // update saving flags and show summary
    const newSavingState = {};
    results.forEach((r) => {
      newSavingState[r.id] = false;
    });
    setSaving((s) => ({ ...s, ...newSavingState }));

    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      alert("All gateways saved successfully.");
    } else {
      alert(`Saved with ${failed.length} failures. Check console for details.`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Payment Gateways</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={onSaveAll}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Save All
          </button>
        </div>
      </div>

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
