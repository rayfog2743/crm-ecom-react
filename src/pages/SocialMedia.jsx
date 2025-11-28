``

import React, { useState, useRef, useEffect } from "react";
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Loader2,
  Plus,
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://192.168.29.8:8004/api/admin/social-links";
const TOKEN =
  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vMTkyLjE2OC4yOS44OjgwMDQvYXBpL2FkbWluLWxvZ2luIiwiaWF0IjoxNzYyMjQzMjM3LCJleHAiOjE3NjMxMDcyMzcsIm5iZiI6MTc2MjI0MzIzNywianRpIjoiVTJUeDJqVFdpR25qS0N3RCIsInN1YiI6IjEiLCJwcnYiOiIyM2JkNWM4OTQ5ZjYwMGFkYjM5ZTcwMWM0MDA4NzJkYjdhNTk3NmY3In0.ketEj32-D8JriWFtao2ok3ZV5cB1L0T8CAl_-aT6UQA";

const SocialMedia = () => {
  const [activeTab, setActiveTab] = useState("facebook");
  const [loading, setLoading] = useState(true);
  const [embedSize, setEmbedSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);

  // Modal & form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formLinks, setFormLinks] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Existing saved links
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
  });
  const tabs = [
    {
      id: "facebook",
      label: "Facebook",
      icon: <Facebook className="w-5 h-5 text-blue-600" />,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: <Instagram className="w-5 h-5 text-pink-500" />,
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: <Youtube className="w-5 h-5 text-red-600" />,
    },
  ];

  // -------------------------------
  // 🧭 Embed Helpers
  // -------------------------------
  const fbEmbedUrl = (pageUrl, w, h) => {
    const href = encodeURIComponent(pageUrl);
    return `https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=${w}&height=${h}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    try {
      const fixed = url.replace(/^hhttps?:\/\//, "https://");
      const u = new URL(fixed);
      let id = "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.split("/")[1];
      else if (u.searchParams.get("v")) id = u.searchParams.get("v");
      else if (u.pathname.includes("/shorts/"))
        id = u.pathname.split("/shorts/")[1];
      else if (u.pathname.includes("/embed/"))
        id = u.pathname.split("/embed/")[1];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    } catch {
      return null;
    }
  };

  // -------------------------------
  // ⚙️ Resize Embed Dynamically
  // -------------------------------
  useEffect(() => {
    const resize = () => {
      const width = Math.min(
        containerRef.current?.offsetWidth || window.innerWidth - 200,
        1000
      );
      const height = Math.min(window.innerHeight - 200, 700);
      setEmbedSize({ width, height });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // -------------------------------
  // 📥 Fetch Social Links (GET)
  // -------------------------------
  const fetchSocialLinks = async () => {
    try {
      const { data } = await axios.get(API_BASE, {
        headers: { Authorization: TOKEN },
      });
      if (data?.data) {
        const links = data.data;
        setSocialLinks({
          facebook: links.facebook || "",
          instagram: links.insta || "",
          youtube: links.youtube || "",
        });
      }
    } catch (err) {
      console.error("Error fetching social links:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  // -------------------------------
  // 🔄 Reload animation per tab
  // -------------------------------
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Instagram embed script
  useEffect(() => {
    if (activeTab !== "instagram") return;
    const processInstagram = () => {
      if (window.instgrm && window.instgrm.Embeds)
        window.instgrm.Embeds.process();
    };
    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = processInstagram;
      document.body.appendChild(script);
    } else processInstagram();
  }, [activeTab]);

  // -------------------------------
  // 🧾 Modal Handlers
  // -------------------------------
  const openAddModal = () => {
    setFormLinks({
      facebook: socialLinks.facebook || "",
      instagram: socialLinks.instagram || "",
      youtube: socialLinks.youtube || "",
    });
    setSubmitError("");
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSubmitting(false);
    setSubmitError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormLinks((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------------
  // 🚀 POST/UPSERT Social Links
  // -------------------------------
  const handleSubmitLinks = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("facebook", formLinks.facebook);
      formData.append("insta", formLinks.instagram);
      formData.append("youtube", formLinks.youtube);

      await axios.post(`${API_BASE}/upsert`, formData, {
        headers: { Authorization: TOKEN },
      });

      closeAddModal();
      fetchSocialLinks(); // refresh UI
    } catch (err) {
      console.error("Failed to upsert social links:", err);
      setSubmitError("Failed to save social links. Check your network or token.");
      setSubmitting(false);
    }
  };

  // -------------------------------
  // 🧩 Render
  // -------------------------------
  const ytEmbed = getYoutubeEmbed(socialLinks.youtube);

  return (
    <div ref={containerRef} className="w-full">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-6 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-50 text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* Add Links Button */}
          <button
            onClick={openAddModal}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add / Edit Links
          </button>
        </div>

        {/* FACEBOOK */}
        {activeTab === "facebook" && socialLinks.facebook && (
          <iframe
            title="Facebook Page"
            src={fbEmbedUrl(socialLinks.facebook, embedSize.width, embedSize.height)}
            loading="lazy"
            className="w-full"
            style={{ height: embedSize.height, border: 0 }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        )}

        {/* INSTAGRAM */}
        {activeTab === "instagram" && (
          <div className="mt-3 rounded-lg overflow-hidden border bg-white p-3">
            {socialLinks.instagram ? (
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={socialLinks.instagram}
                data-instgrm-version="14"
                style={{ width: "100%", margin: 0 }}
              />
            ) : (
              <p className="text-sm text-gray-500">No Instagram link set.</p>
            )}
          </div>
        )}

        {/* YOUTUBE */}
        {activeTab === "youtube" && (
          <div className="mt-3 rounded-lg overflow-hidden border bg-white">
            {ytEmbed ? (
              <iframe
                title="YouTube Video"
                src={ytEmbed}
                loading="lazy"
                className="w-full"
                style={{ height: Math.max(360, embedSize.height), border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <p className="p-6 text-sm text-gray-600">No YouTube link set.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal for Add Links */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeAddModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Add / Update Social Links</h2>

            <form onSubmit={handleSubmitLinks} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Facebook Link
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formLinks.facebook}
                  onChange={handleFormChange}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Instagram Link
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formLinks.instagram}
                  onChange={handleFormChange}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="https://instagram.com/p/POST_ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  YouTube Link
                </label>
                <input
                  type="url"
                  name="youtube"
                  value={formLinks.youtube}
                  onChange={handleFormChange}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMedia;
