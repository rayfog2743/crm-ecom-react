// import React, { useEffect, useMemo, useState } from "react";
// import { X, Plus, Check, Moon, Sun } from "lucide-react";

// import api from "../api/axios";

// const DEFAULT_SUGGESTIONS = [
//   "grocery",
//   "organic",
//   "delivery",
//   "fresh",
//   "discount",
//   "snacks",
//   "dairy",
//   "bakery",
// ];

// const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// function extractTagsFromText(text, max = 8) {
//   if (!text) return [];
//   const stop = new Set([
//     "the","and","for","with","that","this","from","your","are","you","our","is","in","on","of","to","a","an","it","as","by","be"
//   ]);
//   const cleaned = text
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
//   const words = cleaned.split(" ").filter((w) => w && !stop.has(w) && w.length > 2);
//   const freq = {};
//   for (let i = 0; i < words.length; i++) {
//     freq[words[i]] = (freq[words[i]] || 0) + 1;
//     if (i + 1 < words.length) {
//       const ph = words[i] + " " + words[i + 1];
//       freq[ph] = (freq[ph] || 0) + 1;
//     }
//   }
//   const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
//   return entries.slice(0, max).map((e) => e[0]);
// }

// export default function SeoSettingsPro({
//   initialTitle = "",
//   initialDescription = "",
//   initialTags = [],
//   siteUrl = window?.location?.origin || "https://example.com",
//   onSave = null,
// }) {
//   const [dark, setDark] = useState(false);
//   const [title, setTitle] = useState(initialTitle);
//   const [description, setDescription] = useState(initialDescription);
//   const [tags, setTags] = useState(initialTags || []);
//   const [tagInput, setTagInput] = useState("");
//   const [showSchema, setShowSchema] = useState(false);
//   const [tagSuggestions, setTagSuggestions] = useState([]); // store suggestions here
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     // dedupe initial tags
//     setTags((t) => Array.from(new Set(t || [])));
//     // load data
//     fetchInitialSeo();
//     getTagsFromApi();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Fetch tag suggestions (keeps suggestions separate from current tags)
//   const getTagsFromApi = async () => {
//     try {
//       const res = await api.get("/admin/home-seo-settings");
//       const body = res?.data;
//       // try to extract any array found in response as suggestions
//       let extracted = [];

//       if (Array.isArray(body)) {
//         extracted = body;
//       } else if (Array.isArray(body?.data)) {
//         extracted = body.data;
//       } else if (Array.isArray(body?.tags)) {
//         extracted = body.tags;
//       } else if (Array.isArray(body?.data?.tags)) {
//         extracted = body.data.tags;
//       } else if (body && typeof body === "object") {
//         // find first array-valued property (common fallback)
//         const maybe = Object.values(body).find((v) => Array.isArray(v));
//         if (Array.isArray(maybe)) extracted = maybe;
//       }

//       if (!extracted || extracted.length === 0) {
//         extracted = DEFAULT_SUGGESTIONS;
//       }

//       const normalized = Array.from(new Set(extracted.map((x) => String(x).trim()).filter(Boolean))).slice(0, 20);
//       setTagSuggestions(normalized);
//     } catch (err) {
//       console.error("Error fetching tag suggestions:", err);
//       setTagSuggestions(DEFAULT_SUGGESTIONS);
//     }
//   };

//   // Fetch the actual SEO record (title/description/tags) and populate form
//   const fetchInitialSeo = async () => {
//     try {
//       const res = await api.get("/admin/home-seo-settings");
//       const body = res?.data?.data[0];

//       console.log("Fetched initial SEO settings:", body);
//       // console.log("Initial SEO raw response:", body);

//       // Normalize possible shapes:
//       // - { data: { title, description, tags } }
//       // - { seo: { ... } }
//       // - { settings: { ... } }
//       // - { title, description, tags }
//       // - [{ page, title, ... }] (array)
//       let item = null;

//       if (!body) {
//         item = null;
//       } else if (Array.isArray(body) && body.length > 0 && typeof body[0] === "object") {
//         // pick first object
//         item = body[0];
//       } else if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
//         item = body.data;
//       } else if (body?.seo && typeof body.seo === "object") {
//         item = body.seo;
//       } else if (body?.settings && typeof body.settings === "object") {
//         item = body.settings;
//       } else if (typeof body === "object" && (body.title || body.description || body.tags)) {
//         item = body;
//       } else {
//         // fallback: try to find nested object with title/description
//         const values = Object.values(body).filter((v) => v && typeof v === "object");
//         item = values.find((v) => v.title || v.description || v.tags) || null;
//       }

//       if (!item) return;

//       // Safe setters
//       if (typeof item.title === "string") setTitle(item.title);
//       if (typeof item.description === "string") setDescription(item.description);

//       // Tags extraction (support tags, tag_list, keywords)
//       const tCandidate =
//         (Array.isArray(item.tags) && item.tags) ||
//         (Array.isArray(item.tag_list) && item.tag_list) ||
//         (Array.isArray(item.keywords) && item.keywords) ||
//         item.tags ||
//         item.tag_list ||
//         item.keywords ||
//         [];

//       let finalTags = [];
//       if (Array.isArray(tCandidate)) {
//         finalTags = tCandidate;
//       } else if (typeof tCandidate === "string") {
//         try {
//           // try parse JSON string (["a","b"]) or comma-separated
//           const parsed = JSON.parse(tCandidate);
//           if (Array.isArray(parsed)) finalTags = parsed;
//           else finalTags = tCandidate.split(",").map((s) => s.trim()).filter(Boolean);
//         } catch {
//           finalTags = tCandidate.split(",").map((s) => s.trim()).filter(Boolean);
//         }
//       }

//       if (finalTags.length > 0) setTags(Array.from(new Set(finalTags)));
//     } catch (err) {
//       console.error("Failed to load initial SEO:", err);
//     }
//   };

//   const addTag = (t) => {
//     const v = (t ?? tagInput ?? "").trim();
//     if (!v) return;
//     if (tags.includes(v)) {
//       setTagInput("");
//       return;
//     }
//     setTags((s) => [...s, v]);
//     setTagInput("");
//   };
//   const removeTag = (i) => setTags((s) => s.filter((_, idx) => idx !== i));
//   const onTagKey = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       addTag();
//     }
//   };

//   const autoGenerateTags = () => {
//     const candidates = extractTagsFromText(`${title || ""} ${description || ""}`, 8);
//     setTags((prev) => {
//       const merged = Array.from(new Set([...(prev || []), ...candidates])).slice(0, 12);
//       return merged;
//     });
//   };

//   const autoGenerateDescription = (maxLen = 155) => {
//     const src = (description || "").trim() || (title || "").trim();
//     if (!src) return;
//     if (src.length > maxLen) {
//       const t = src.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
//       setDescription(t);
//       return;
//     }
//     const composed = (title || "") + ((description && description.length) ? " — " + description.split(".")[0] + "." : "");
//     setDescription(composed.slice(0, maxLen));
//   };

//   const titleLen = (title || "").trim().length;
//   const descLen = (description || "").trim().length;
//   const scoreTitle = clamp(Math.round((Math.min(titleLen, 70) / 70) * 100), 0, 100);
//   const scoreDesc = clamp(Math.round((Math.min(descLen, 160) / 160) * 100), 0, 100);
//   const scoreTags = clamp(Math.round((Math.min(tags.length, 10) / 10) * 100), 0, 100);
//   const score = Math.round(scoreTitle * 0.35 + scoreDesc * 0.45 + scoreTags * 0.2);

//   const schema = useMemo(() => {
//     return JSON.stringify(
//       {
//         "@context": "https://schema.org",
//         "@type": "WebPage",
//         name: title || undefined,
//         description: description || undefined,
//         keywords: tags.length ? tags.join(", ") : undefined,
//       },
//       null,
//       2
//     );
//   }, [title, description, tags]);

//   const searchPreviewUrl = useMemo(() => {
//     const slug = (title || "page")
//       .toLowerCase()
//       .replace(/[^a-z0-9\s-]/g, "")
//       .trim()
//       .replace(/\s+/g, "-")
//       .slice(0, 60);
//     return `${siteUrl.replace(/\/$/, "")}/${slug}`;
//   }, [title, siteUrl]);

//   const suggestionMatches = useMemo(() => {
//     const q = tagInput.trim().toLowerCase();
//     return tagSuggestions.filter((s) => !tags.includes(s) && (!q || s.includes(q))).slice(0, 6);
//   }, [tagInput, tags, tagSuggestions]);

//   const save = async () => {
//     setSubmitting(true);

//     const payload = {
//       page: "home",
//       title: title || "",
//       description: description || "",
//       tags: Array.from(new Set(tags || [])),
//     };

//     try {
//       const res = await api.post("/admin/home-seo-settings/upsert", payload);
//       const returned = res?.data ?? null;
//       if (returned && (returned.error || returned.message === "error")) {
//         throw new Error(returned.message || "Save failed");
//       }
//       if (typeof onSave === "function") onSave(returned?.data ?? payload);
//       alert("Saved successfully!");
//     } catch (err) {
//       console.error("Error saving SEO settings:", err);
//       alert("Failed to save: " + (err?.message ?? "Unknown error"));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const scoreColor = (s) => (s >= 85 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500");

//   return (
//     <div className={`${dark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"} max-w-3xl mx-auto p-6 rounded-2xl shadow-sm border`}>
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold">SEO Settings</h3>
//         <div className="flex items-center gap-3 hidden">
//           <button
//             onClick={() => setDark((d) => !d)}
//             className="flex items-center gap-2 px-3 py-1 rounded-md border"
//             title="Toggle dark mode"
//           >
//             {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? "Light" : "Dark"}
//           </button>
//         </div>
//       </div>

//       {/* score + search preview */}
//       <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <div className="text-xs text-slate-500">SEO Score</div>
//           <div className="mt-2 flex items-center gap-3">
//             <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
//               <div className={`${scoreColor(score)} h-3 rounded-full`} style={{ width: `${score}%` }} />
//             </div>
//             <div className="text-sm font-medium w-12 text-right">{score}%</div>
//           </div>
//           <div className="text-xs text-slate-400 mt-2">Title · Description · Tags</div>
//         </div>

//       {/* ... rest of UI unchanged (title/description/tags inputs, save button, schema preview) ... */}

//       </div>

//       {/* Form fields */}
//       <div className="mb-4">
//         <label className="text-sm font-medium">SEO Title</label>
//         <input value={title || ""} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter SEO title..." />
//         <div className="text-xs text-slate-400 mt-1">Characters: {(title || "").trim().length} (ideal 50–70)</div>
//       </div>

//       <div className="mb-4">
//         <label className="text-sm font-medium">SEO Description</label>
//         <textarea value={description || ""} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[96px]" placeholder="Write SEO description..." />
//         <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
//           <div>Characters: {(description || "").trim().length} (ideal 50–160)</div>
//           <div className="flex items-center gap-2">
//             <button onClick={() => autoGenerateDescription()} className="px-2 py-1 text-xs border rounded hidden">Auto-generate</button>
//             <button onClick={() => autoGenerateTags()} className="px-2 py-1 text-xs border rounded">Auto-tags</button>
//           </div>
//         </div>
//       </div>

//       <div className="mb-6">
//         <label className="text-sm font-medium">SEO Tags (array)</label>
//         <div className="flex items-center gap-2 mt-2">
//           <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKey} className="flex-1 border rounded-md px-3 py-2 text-sm" placeholder="Add tag..." />
//           <button onClick={() => addTag()} className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
//         </div>

//         {suggestionMatches.length > 0 && tagInput.trim() && (
//           <div className="mt-2 flex flex-wrap gap-2">
//             {suggestionMatches.map((s) => (
//               <button key={s} onClick={() => addTag(s)} className="text-xs px-2 py-1 border rounded-full hover:bg-gray-100">{s}</button>
//             ))}
//           </div>
//         )}

//         <div className="flex flex-wrap gap-2 mt-3">
//           {tags.map((t, i) => (
//             <div key={t + i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
//               <span>{t}</span>
//               <button onClick={() => removeTag(i)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* actions & toggles */}
//       <div className="flex items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <button onClick={save} disabled={submitting} className="px-4 py-2 bg-green-600 disabled:opacity-50 text-white rounded-md flex items-center gap-2">
//             <Check className="w-4 h-4" /> {submitting ? "Saving..." : "Save"}
//           </button>
//           <button onClick={() => { setTitle(initialTitle); setDescription(initialDescription); setTags(initialTags || []); }} className="px-3 py-2 border rounded-md text-sm">Reset</button>
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="text-xs text-slate-500 flex items-center gap-2"><input type="checkbox" checked={showSchema} onChange={(e) => setShowSchema(e.target.checked)} /> Show Schema</label>
//         </div>
//       </div>

//       {showSchema && (
//         <div className="mt-4 border rounded-md p-3 bg-gray-50">
//           <div className="flex items-center justify-between mb-2">
//             <div className="text-xs text-gray-600">JSON-LD Schema Preview</div>
//             <div className="text-xs text-slate-400">Copy into &lt;head&gt;</div>
//           </div>
//           <pre className="text-xs overflow-auto p-2 bg-white border rounded">{schema}</pre>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Check } from "lucide-react";

import api from "../api/axios";

const DEFAULT_SUGGESTIONS = [
  "grocery",
  "organic",
  "delivery",
  "fresh",
  "discount",
  "snacks",
  "dairy",
  "bakery",
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function extractTagsFromText(text, max = 8) {
  if (!text) return [];
  const stop = new Set([
    "the","and","for","with","that","this","from","your","are","you","our","is","in","on","of","to","a","an","it","as","by","be"
  ]);
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter((w) => w && !stop.has(w) && w.length > 2);
  const freq = {};
  for (let i = 0; i < words.length; i++) {
    freq[words[i]] = (freq[words[i]] || 0) + 1;
    if (i + 1 < words.length) {
      const ph = words[i] + " " + words[i + 1];
      freq[ph] = (freq[ph] || 0) + 1;
    }
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, max).map((e) => e[0]);
}

export default function SeoSettingsPro({
  initialTitle = "",
  initialDescription = "",
  initialTags = [],
  siteUrl = window?.location?.origin || "https://example.com",
  onSave = null,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState(initialTags || []);
  const [tagInput, setTagInput] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // NEW: google verification token state
  const [googleVerificationToken, setGoogleVerificationToken] = useState("");

  useEffect(() => {
    setTags((t) => Array.from(new Set(t || [])));
    fetchInitialSeo();
    getTagsFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTagsFromApi = async () => {
    try {
      const res = await api.get("/admin/home-seo-settings");
      const body = res?.data;
      let extracted = [];

      if (Array.isArray(body)) extracted = body;
      else if (Array.isArray(body?.data)) extracted = body.data;
      else if (Array.isArray(body?.tags)) extracted = body.tags;
      else if (Array.isArray(body?.data?.tags)) extracted = body.data.tags;
      else if (body && typeof body === "object") {
        const maybe = Object.values(body).find((v) => Array.isArray(v));
        if (Array.isArray(maybe)) extracted = maybe;
      }

      if (!extracted || extracted.length === 0) extracted = DEFAULT_SUGGESTIONS;

      const normalized = Array.from(new Set(extracted.map((x) => String(x).trim()).filter(Boolean))).slice(0, 20);
      setTagSuggestions(normalized);
    } catch (err) {
      console.error("Error fetching tag suggestions:", err);
      setTagSuggestions(DEFAULT_SUGGESTIONS);
    }
  };

  // Fetch SEO record and google token
  const fetchInitialSeo = async () => {
    try {
      const res = await api.get("/admin/home-seo-settings");
      const body = res?.data;

      // Body could be { data: [...] } or { data: {...} } or direct object
      // Normalize to an item object
      let item = null;

      if (!body) {
        item = null;
      } else if (Array.isArray(body) && body.length > 0 && typeof body[0] === "object") {
        item = body[0];
      } else if (Array.isArray(body?.data) && body.data.length > 0 && typeof body.data[0] === "object") {
        item = body.data[0];
      } else if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
        item = body.data;
      } else if (body?.seo && typeof body.seo === "object") {
        item = body.seo;
      } else if (body?.settings && typeof body.settings === "object") {
        item = body.settings;
      } else if (typeof body === "object" && (body.title || body.description || body.tags || body.google_site_verification || body.googleVerificationToken)) {
        item = body;
      } else {
        const values = Object.values(body || {}).filter((v) => v && typeof v === "object");
        item = values.find((v) => v.title || v.description || v.tags || v.google_site_verification || v.googleVerificationToken) || null;
      }

      if (!item) return;

      if (typeof item.title === "string") setTitle(item.title);
      if (typeof item.description === "string") setDescription(item.description);

      // extract tags
      const tCandidate =
        (Array.isArray(item.tags) && item.tags) ||
        (Array.isArray(item.tag_list) && item.tag_list) ||
        (Array.isArray(item.keywords) && item.keywords) ||
        item.tags ||
        item.tag_list ||
        item.keywords ||
        [];

      let finalTags = [];
      if (Array.isArray(tCandidate)) finalTags = tCandidate;
      else if (typeof tCandidate === "string") {
        try {
          const parsed = JSON.parse(tCandidate);
          if (Array.isArray(parsed)) finalTags = parsed;
          else finalTags = tCandidate.split(",").map((s) => s.trim()).filter(Boolean);
        } catch {
          finalTags = tCandidate.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      if (finalTags.length > 0) setTags(Array.from(new Set(finalTags)));

      // NEW: extract google verification token from common keys
      const token =
        item.google_site_verification ||
        item.googleVerificationToken ||
        item.google_verification ||
        item.google_verification_token ||
        item.googleSiteVerification ||
        null;

      if (token && typeof token === "string") setGoogleVerificationToken(token);
    } catch (err) {
      console.error("Failed to load initial SEO:", err);
    }
  };

  const addTag = (t) => {
    const v = (t ?? tagInput ?? "").trim();
    if (!v) return;
    if (tags.includes(v)) {
      setTagInput("");
      return;
    }
    setTags((s) => [...s, v]);
    setTagInput("");
  };
  const removeTag = (i) => setTags((s) => s.filter((_, idx) => idx !== i));
  const onTagKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const autoGenerateTags = () => {
    const candidates = extractTagsFromText(`${title || ""} ${description || ""}`, 8);
    setTags((prev) => {
      const merged = Array.from(new Set([...(prev || []), ...candidates])).slice(0, 12);
      return merged;
    });
  };

  const autoGenerateDescription = (maxLen = 155) => {
    const src = (description || "").trim() || (title || "").trim();
    if (!src) return;
    if (src.length > maxLen) {
      const t = src.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
      setDescription(t);
      return;
    }
    const composed = (title || "") + ((description && description.length) ? " — " + description.split(".")[0] + "." : "");
    setDescription(composed.slice(0, maxLen));
  };

  const titleLen = (title || "").trim().length;
  const descLen = (description || "").trim().length;
  const scoreTitle = clamp(Math.round((Math.min(titleLen, 70) / 70) * 100), 0, 100);
  const scoreDesc = clamp(Math.round((Math.min(descLen, 160) / 160) * 100), 0, 100);
  const scoreTags = clamp(Math.round((Math.min(tags.length, 10) / 10) * 100), 0, 100);
  const score = Math.round(scoreTitle * 0.35 + scoreDesc * 0.45 + scoreTags * 0.2);

  const schema = useMemo(() => {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title || undefined,
        description: description || undefined,
        keywords: tags.length ? tags.join(", ") : undefined,
      },
      null,
      2
    );
  }, [title, description, tags]);

  const searchPreviewUrl = useMemo(() => {
    const slug = (title || "page")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `${siteUrl.replace(/\/$/, "")}/${slug}`;
  }, [title, siteUrl]);

  const suggestionMatches = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    return tagSuggestions.filter((s) => !tags.includes(s) && (!q || s.includes(q))).slice(0, 6);
  }, [tagInput, tags, tagSuggestions]);

  const save = async () => {
    setSubmitting(true);

    const payload = {
      page: "home",
      title: title || "",
      description: description || "",
      tags: Array.from(new Set(tags || [])),
      // include token (backend field name: google_site_verification)
      google_site_verification: googleVerificationToken || "",
    };

    try {
      const res = await api.post("/admin/home-seo-settings/upsert", payload);
      const returned = res?.data ?? null;
      if (returned && (returned.error || returned.message === "error")) {
        throw new Error(returned.message || "Save failed");
      }
      if (typeof onSave === "function") onSave(returned?.data ?? payload);
      alert("Saved successfully!");
    } catch (err) {
      console.error("Error saving SEO settings:", err);
      alert("Failed to save: " + (err?.message ?? "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (s) => (s >= 85 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500");

  return (
    <div className={`max-w-3xl mx-auto p-6 rounded-2xl shadow-sm border ${showSchema ? "bg-white" : "bg-white"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">SEO Settings</h3>
      </div>

      {/* score + search preview */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500">SEO Score</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`${scoreColor(score)} h-3 rounded-full`} style={{ width: `${score}%` }} />
            </div>
            <div className="text-sm font-medium w-12 text-right">{score}%</div>
          </div>
          <div className="text-xs text-slate-400 mt-2">Title · Description · Tags</div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Google Search Preview</div>
          <div className="mt-2 border rounded p-3 bg-white">
            <div className="text-blue-700 font-medium text-sm truncate">{title || "Page title"}</div>
            <div className="text-xs text-green-600 truncate mt-1">{searchPreviewUrl}</div>
            <div className="text-sm text-slate-500 mt-2 line-clamp-2">{description || "Meta description preview..."}</div>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="mb-4">
        <label className="text-sm font-medium">SEO Title</label>
        <input value={title || ""} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter SEO title..." />
        <div className="text-xs text-slate-400 mt-1">Characters: {(title || "").trim().length} (ideal 50–70)</div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">SEO Description</label>
        <textarea value={description || ""} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[96px]" placeholder="Write SEO description..." />
        <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
          <div>Characters: {(description || "").trim().length} (ideal 50–160)</div>
          <div className="flex items-center gap-2">
            <button onClick={() => autoGenerateDescription()} className="px-2 py-1 text-xs border rounded hidden">Auto-generate</button>
            <button onClick={() => autoGenerateTags()} className="px-2 py-1 text-xs border rounded">Auto-tags</button>
          </div>
        </div>
      </div>

      {/* Google verification input */}
      <div className="mb-4">
        <label className="text-sm font-medium">Google Site Verification Token</label>
        <input
          value={googleVerificationToken}
          onChange={(e) => setGoogleVerificationToken(e.target.value)}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Paste google-site-verification token from Search Console"
        />
        <div className="text-xs text-slate-400 mt-1">
          Example: <code>abc123DEF456ghi789</code>. This will render a meta tag: <code>&lt;meta name="google-site-verification" content="..." /&gt;</code>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium">SEO Tags (array)</label>
        <div className="flex items-center gap-2 mt-2">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKey} className="flex-1 border rounded-md px-3 py-2 text-sm" placeholder="Add tag..." />
          <button onClick={() => addTag()} className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
        </div>

        {suggestionMatches.length > 0 && tagInput.trim() && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestionMatches.map((s) => (
              <button key={s} onClick={() => addTag(s)} className="text-xs px-2 py-1 border rounded-full hover:bg-gray-100">{s}</button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t, i) => (
            <div key={t + i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
              <span>{t}</span>
              <button onClick={() => removeTag(i)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* actions & toggles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={submitting} className="px-4 py-2 bg-green-600 disabled:opacity-50 text-white rounded-md flex items-center gap-2">
            <Check className="w-4 h-4" /> {submitting ? "Saving..." : "Save"}
          </button>
          <button onClick={() => { setTitle(initialTitle); setDescription(initialDescription); setTags(initialTags || []); setGoogleVerificationToken(""); }} className="px-3 py-2 border rounded-md text-sm">Reset</button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs text-slate-500 flex items-center gap-2"><input type="checkbox" checked={showSchema} onChange={(e) => setShowSchema(e.target.checked)} /> Show Schema</label>
        </div>
      </div>

      {/* Schema / meta preview */}
      {showSchema && (
        <div className="mt-4 border rounded-md p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600">JSON-LD Schema Preview</div>
            <div className="text-xs text-slate-400">Copy into &lt;head&gt;</div>
          </div>
          <pre className="text-xs overflow-auto p-2 bg-white border rounded">{schema}</pre>

          {googleVerificationToken ? (
            <div className="mt-3 text-xs">
              <div className="font-medium mb-1">Google verification meta tag</div>
              <pre className="bg-white border p-2 rounded text-xs">{`<meta name="google-site-verification" content="${googleVerificationToken}" />`}</pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
