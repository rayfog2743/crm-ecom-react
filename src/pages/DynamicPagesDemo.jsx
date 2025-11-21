// DynamicPagesDemo.jsx
import React, { useEffect, useState } from "react";

/**
 * Dynamic Pages Demo
 * - Manage pages (About, Privacy, Terms, etc)
 * - Add / Edit / Delete / Publish
 * - Preview page
 * - Export / Import JSON
 *
 * Uses local state for demo. Replace save/load functions with API calls to persist.
 *
 * Reference image (demo header image): /mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png
 */

const SAMPLE_PAGES = [
  {
    id: 1,
    title: "About Us",
    slug: "about-us",
    short: "Who we are and what we do.",
    content:
      "<p><strong>Welcome to Gil's Lab —</strong> we are a certification authority focused on quality control and excellence. Our mission is to provide reliable testing and certified results to our clients worldwide.</p><p>Founded in 2010, we have grown into a recognized lab with multiple accreditations.</p>",
    published: true,
    hero: "/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png",
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Privacy Policy",
    slug: "privacy-policy",
    short: "How we handle your data and privacy.",
    content:
      "<h3>Privacy</h3><p>We store user information only to improve service quality. We do not sell your personal information.</p><ul><li>Data collection</li><li>Cookies</li><li>User rights</li></ul>",
    published: true,
    hero: "/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png",
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Terms & Conditions",
    slug: "terms-conditions",
    short: "Rules for using our services.",
    content:
      "<p>By using our services you agree to the terms described here. Please read carefully.</p><ol><li>Service use</li><li>Payment & refunds</li><li>Liability</li></ol>",
    published: false,
    hero: "/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png",
    updated_at: new Date().toISOString(),
  },
];

function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Preview({ page }) {
  if (!page) return <div className="text-gray-500">Select a page to preview</div>;
  return (
    <div className="border rounded overflow-hidden bg-white">
      {page.hero && (
        <div className="h-40 w-full overflow-hidden">
          <img src={page.hero} alt="hero" className="object-cover w-full h-full" />
        </div>
      )}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
        <p className="text-sm text-gray-500 mb-4">{page.short}</p>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        <div className="mt-4 text-xs text-gray-400">Updated: {new Date(page.updated_at).toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function DynamicPagesDemo() {
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editor form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [short, setShort] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [hero, setHero] = useState("/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png");

  // search & UI
  const [query, setQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    // simulate load
    setLoading(true);
    setTimeout(() => {
      setPages(SAMPLE_PAGES);
      setLoading(false);
      setSelectedId(SAMPLE_PAGES[0].id);
    }, 400);
  }, []);

  useEffect(() => {
    const p = pages.find((x) => x.id === selectedId);
    if (p) {
      setTitle(p.title);
      setSlug(p.slug);
      setShort(p.short);
      setContent(p.content);
      setPublished(Boolean(p.published));
      setHero(p.hero || "/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png");
    } else {
      // reset editor
      setTitle("");
      setSlug("");
      setShort("");
      setContent("");
      setPublished(false);
      setHero("/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png");
    }
  }, [selectedId, pages]);

  // Filtering
  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.slug.toLowerCase().includes(query.toLowerCase())
  );

  const selectPage = (id) => {
    setSelectedId(id);
  };

  const handleNew = () => {
    const newPage = {
      id: uid(),
      title: "New Page",
      slug: "new-page-" + uid(),
      short: "",
      content: "<p>Write content here...</p>",
      published: false,
      hero: "/mnt/data/3d6c7a3b-a660-457d-8a0d-c5182d51f92c.png",
      updated_at: new Date().toISOString(),
    };
    setPages((p) => [newPage, ...p]);
    setSelectedId(newPage.id);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    const updated = {
      id: selectedId || uid(),
      title: title.trim(),
      slug: slug ? slugify(slug) : slugify(title),
      short,
      content,
      published,
      hero,
      updated_at: new Date().toISOString(),
    };

    setPages((prev) => {
      const exists = prev.find((x) => x.id === updated.id);
      if (exists) {
        return prev.map((x) => (x.id === updated.id ? updated : x));
      }
      return [updated, ...prev];
    });

    setSelectedId(updated.id);
    alert("Saved locally (demo). Replace with API call to persist.");
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this page?")) return;
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleExport = () => {
    const exportJSON = JSON.stringify(pages, null, 2);
    // copy to clipboard
    navigator.clipboard?.writeText(exportJSON).then(() => {
      alert("Pages JSON copied to clipboard");
    }, () => {
      // fallback: open in new window
      const w = window.open();
      w.document.write(`<pre>${exportJSON}</pre>`);
    });
  };

  const handleImport = async () => {
    const raw = prompt("Paste pages JSON here (overwrite current pages):");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Invalid JSON");
      setPages(parsed);
      alert("Imported pages (demo).");
    } catch (err) {
      alert("Invalid JSON: " + err.message);
    }
  };

  const move = (id, dir) => {
    // dir = -1 (up) or 1 (down)
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return copy;
    });
  };

  const handleUploadHero = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    // demo: create objectURL (in real use upload to server and save URL)
    const url = URL.createObjectURL(f);
    setHero(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: pages list */}
        <div className="lg:col-span-1 bg-white border rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Pages</h3>
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">New</button>
            </div>
          </div>

          <div className="mb-3">
            <input
              placeholder="Search title or slug..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading pages…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No pages</div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 border rounded cursor-pointer ${selectedId === p.id ? "bg-blue-50 border-blue-200" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div onClick={() => selectPage(p.id)} className="flex-1">
                      <div className="font-medium">{p.title} {p.published ? <span className="text-xs text-green-600 ml-2">●</span> : <span className="text-xs text-gray-400 ml-2">draft</span>}</div>
                      <div className="text-xs text-gray-500">{p.slug}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button title="Up" onClick={() => move(p.id, -1)} className="text-xs px-2 py-1 bg-gray-100 rounded">▲</button>
                      <button title="Down" onClick={() => move(p.id, 1)} className="text-xs px-2 py-1 bg-gray-100 rounded">▼</button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => { setSelectedId(p.id); setPreviewOpen(true); }} className="text-xs px-2 py-1 bg-gray-100 rounded">Preview</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleExport} className="px-3 py-1 bg-gray-200 rounded text-sm">Export JSON</button>
            <button onClick={handleImport} className="px-3 py-1 bg-gray-200 rounded text-sm">Import JSON</button>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 bg-white border rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedId ? "Edit Page" : "Create Page"}</h2>
              <p className="text-sm text-gray-500">Manage dynamic pages that can be served by your frontend or CMS endpoint.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <span>Published</span>
              </label>
              <button onClick={() => { setPreviewOpen(true); }} className="px-3 py-1 bg-blue-600 text-white rounded">Preview</button>
              <button onClick={handleSave} className="px-3 py-1 bg-emerald-600 text-white rounded">Save</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-sm">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm">Slug</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="auto generated from title" />
                </div>
                <div>
                  <label className="block text-sm">Short description</label>
                  <input value={short} onChange={(e) => setShort(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm">Content (HTML)</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full px-3 py-2 border rounded" />
                <div className="text-xs text-gray-400 mt-1">You can paste HTML here for demo preview. For production use a WYSIWYG editor.</div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-3">
              <div>
                <label className="block text-sm">Hero image</label>
                <input type="file" accept="image/*" onChange={handleUploadHero} className="mt-2" />
                <div className="mt-2 border rounded overflow-hidden">
                  <img src={hero} alt="hero preview" className="w-full h-28 object-cover" />
                </div>
              </div>

              <div>
                <label className="block text-sm">Meta preview</label>
                <div className="p-3 border rounded">
                  <div className="font-medium">{title || "Page title"}</div>
                  <div className="text-xs text-gray-500">{slug ? `/pages/${slug}` : "/pages/slug"}</div>
                  <div className="text-sm text-gray-700 mt-2">{short || "Short description preview"}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm">Status</label>
                <div className="mt-2 text-sm">{published ? <span className="text-green-600">Published</span> : <span className="text-gray-500">Draft</span>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview / Live output column */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded shadow p-4 mb-4">
            <h3 className="font-medium mb-2">Live Preview</h3>
            <Preview page={pages.find((p) => p.id === selectedId)} />
          </div>

          <div className="bg-white border rounded shadow p-4">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setPages(SAMPLE_PAGES); alert("Reset to sample pages."); }} className="px-3 py-2 bg-gray-100 rounded">Reset samples</button>
              <button onClick={() => { setPages([]); setSelectedId(null); }} className="px-3 py-2 bg-red-50 text-red-600 rounded">Clear all</button>
              <button onClick={() => { setPreviewOpen(true); }} className="px-3 py-2 bg-blue-50 rounded">Open preview modal</button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen modal preview */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4">
          <div className="bg-white rounded max-w-4xl w-full shadow-lg overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium">Preview — {pages.find((p) => p.id === selectedId)?.title || "Untitled"}</h4>
              <div>
                <button onClick={() => setPreviewOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
              </div>
            </div>
            <div className="p-4">
              <Preview page={pages.find((p) => p.id === selectedId)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
