import React, { useState } from "react";

/* -------------------- Toggle -------------------- */
/* grey off + dark thumb when off, green on + white thumb when on */
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
        ${value ? "bg-emerald-600" : "bg-gray-400"}`}
    >
      <span
        className="absolute left-1 top-1 w-4 h-4 rounded-full shadow-md transition-all duration-200"
        style={{
          transform: value ? "translateX(24px)" : "translateX(0px)",
          backgroundColor: value ? "#ffffff" : "#374151",
        }}
      />
    </button>
  );
}

/* -------------------- Card wrapper -------------------- */
function Card({ children }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col">
      {children}
    </div>
  );
}

/* -------------------- Main Component -------------------- */
/**
 * HomePageImagePicker
 * - singleSelect: when true only one card can be active at a time (default true)
 */
export default function HomePageImagePicker({ singleSelect = true }) {
  // sample items — replace imageUrl with your real images
  const items = [
    {
      id: "hero_1",
      label: "Theme 1",
      subtitle: "Top large banner",
      previewUrl: "https://9nutzs.nearbydoctors.in/",
      initials: "H1",
      imageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=60&auto=format&fit=crop",
    },
    {
      id: "hero_2",
      label: "Theme 2",
      subtitle: "Seasonal promo",
        previewUrl: "https://www.worldofneon.in/",
      initials: "H2",
      imageUrl:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=60&auto=format&fit=crop",
    },
    {
      id: "hero_3",
      label: "Theme 3",
      subtitle: "Product grid hero",
      initials: "H3",
        previewUrl: "https://bmtes.com/",
      imageUrl:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=60&auto=format&fit=crop",
    },
    {
      id: "hero_4",
      label: "Theme 4",
      subtitle: "Minimal promo",
        previewUrl: "https://www.worldofneon.in/",
      initials: "H4",
      imageUrl:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1200&q=60&auto=format&fit=crop",
    },
  ];

  // initial state (all disabled)
  const initialConfig = items.reduce((acc, it) => {
    acc[it.id] = { enabled: false };
    return acc;
  }, {});
  const [config, setConfig] = useState(initialConfig);

  // toggle handler
  const handleToggle = (id, v) => {
    if (singleSelect && v) {
      const next = {};
      Object.keys(config).forEach((k) => {
        next[k] = { enabled: k === id };
      });
      setConfig(next);
    } else {
      setConfig((prev) => ({ ...prev, [id]: { ...prev[id], enabled: v } }));
    }
  };

  const selectedId =
    Object.entries(config).find(([_, val]) => val.enabled)?.[0] ?? null;

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Homepage Image Picker</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => {
          const enabled = Boolean(config[item.id]?.enabled);
          return (
            <Card key={item.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md grid place-items-center text-white font-semibold bg-indigo-600">
                    {item.initials}
                  </div>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.subtitle}</div>
                  </div>
                </div>

                {enabled ? (
                  <div className="text-xs text-emerald-600 font-semibold">Selected</div>
                ) : (
                  <div className="text-xs text-slate-400">Not selected</div>
                )}
              </div>

              <div className="mb-3">
                <div
                  className={`relative rounded-lg overflow-hidden border transition-shadow duration-200
                    ${enabled ? "border-emerald-400 shadow-md" : "border-slate-100"}`}
                  style={{ minHeight: 160 }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/1200x400?text=Preview";
                    }}
                  />

                  {enabled && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white w-8 h-8 rounded-full grid place-items-center shadow">
                      ✓
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Use this image as homepage banner</div>

                <div className="flex items-center gap-3">
                  <Toggle value={enabled} onChange={(v) => handleToggle(item.id, v)} />

                  <a
                    href={item.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Preview
                  </a>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                {selectedId === item.id ? "This is the active homepage image." : ""}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
