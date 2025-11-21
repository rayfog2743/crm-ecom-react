

import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  X,
  Edit3 as EditIcon,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { setSiteSettings } from "../redux/slices/sitesettings";
import GstManagement from "../pages/SkuList";
import Bannerspage from "../pages/BannersPage";
import SalesBanner from "../pages/SalesBanner";
import Socialmedia from "../pages/SocialMedia";
import ShopSettings from "../pages/ShopSettings"
import PaymentSettings from "../pages/PaymentSettings"
import ShippingSettings from "../pages/ShippingSettings"
import HomeSettings from "../pages/HomeSettings"
import Discounts from "../pages/Discounts"
import { Button } from "@/components/ui/button";
import api from "../api/axios"

const LOCAL_API_BASE = api.defaults.baseURL;
const TOKEN_KEY = "token"; // adjust if your app uses a different key

export default function ProfilePage({ initialUser = null, initialOrders = [] }) {
  const dispatch = useDispatch();

  // --- helpers to hydrate from localStorage ---
  const getSavedUser = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id ?? null,
        name: parsed.name ?? parsed.fullName ?? parsed.username ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? parsed.contact ?? parsed.mobile ?? "",
        address: parsed.address ?? "",
        createdAt: parsed.createdAt ?? parsed.created_at ?? new Date().toISOString(),
      };
    } catch (err) {
      console.warn("parse local user failed:", err);
      return null;
    }
  };

  const getSavedSettings = () => {
    try {
      const raw = localStorage.getItem("settings");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("parse local settings failed:", err);
      return null;
    }
  };

  const savedUser = getSavedUser();
  const savedSettings = getSavedSettings();

  // --- state ---
  const [user, setUser] = useState(
    initialUser ||
      savedUser || {
        id: null,
        name: "",
        email: "",
        phone: "",
        address: "",
        createdAt: new Date().toISOString(),
      }
  );

  const [settings, setSettings] = useState(
    savedSettings || {
      site_name: "",
      logo_url: "",
      favicon_url: "",
      phone: "",
      altphone: "",
      whatappnumber: "",
      address: "",
      email: "",
    }
  );

  const [userOrders] = useState(initialOrders);

  // modal / form state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    site_name: "",
    altphone: "",
    whatappnumber: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [formError, setFormError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // NEW: tab state (added as requested)
  const [activeTab, setActiveTab] = useState("settings"); // default tab

  // refs
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  // token helper
  const getToken = () => localStorage.getItem("token") || "";

  // validators
  const validators = {
    name: (v) => {
      if (!v || !v.trim()) return "Name is required.";
      if (v.trim().length < 2) return "Please enter at least 2 characters for name.";
      return "";
    },
    email: (v) => {
      if (!v || !v.trim()) return "Email is required.";
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v.trim())) return "Enter a valid email address.";
      return "";
    },
    phone: (v) => {
      if (!v || !String(v).trim()) return "Phone is required.";
      const digits = String(v).replace(/\D/g, "");
      if (digits.length < 10) return "Phone must be at least 10 digits.";
      if (digits.length > 15) return "Phone must not exceed 15 digits.";
      return "";
    },
    address: (v) => {
      if (!v || !v.trim()) return "Address is required.";
      if (v.trim().length < 5) return "Address looks too short.";
      return "";
    },
    password: (v) => {
      if (!v) return ""; // optional
      if (v.length < 8) return "Password must be at least 8 characters.";
      if (!/[0-9]/.test(v)) return "Password must contain at least one digit.";
      return "";
    },
    site_name: (v) => {
      if (!v || !v.trim()) return "Site name is required.";
      return "";
    },
    altphone: (v) => {
      return "";
    },
    whatappnumber: (v) => {
      return "";
    },
  };

  const validateForm = () => {
    const required = ["name", "email", "phone", "address", "site_name"];
    for (const f of required) {
      const err = validators[f](form[f]);
      if (err) return err;
    }
    const pwErr = validators.password(form.password);
    if (pwErr) return pwErr;
    return "";
  };

  useEffect(() => {
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not logged in — token missing.");
      return;
    }

    setIsFetching(true);
    const loadingId = toast.loading("Loading settings...");
    try {
      const res = await fetch(`${LOCAL_API_BASE}/settings`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || `Failed to fetch settings (${res.status})`;
        toast.error(msg);
        toast.dismiss(loadingId);
        setIsFetching(false);
        return;
      }
      // 1) Profile-like response (array)
      if (data?.status && Array.isArray(data.profile) && data.profile.length > 0) {
        const p = data.profile[0];
        const normalizedUser = {
          id: p.id ?? null,
          name: p.name ?? "",
          email: p.email ?? "",
          phone: p.contact ? String(p.contact) : p.contact ?? "",
          address: p.address ?? "",
          createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
        };
        setUser((prev) => ({ ...prev, ...normalizedUser }));
        // update localStorage user safely
        try {
          const raw = localStorage.getItem("user");
          if (raw) {
            const u = JSON.parse(raw);
            localStorage.setItem("user", JSON.stringify({ ...u, ...normalizedUser }));
          } else {
            localStorage.setItem("user", JSON.stringify(normalizedUser));
          }
        } catch (e) {
          console.warn("localStorage update user failed:", e);
        }
        // NOTE: do not dispatch settings here (no normalizedSettings available)
      }

      // 2) Settings-like response (object)
      const settingsObj =
        data?.data?.settings ??
        data?.data ??
        data?.settings ??
        (data?.status && typeof data === "object" && !Array.isArray(data) ? data : null);

      if (settingsObj && typeof settingsObj === "object") {
        const normalizedSettings = {
          site_name:
            settingsObj.site_name ?? settingsObj.siteName ?? settingsObj.name ?? settings.site_name ?? "",
          email: settingsObj.email ?? settings.email ?? "",
          phone: settingsObj.phone ?? settings.phone ?? "",
          altphone: settingsObj.altphone ?? settingsObj.alt_phone ?? settings.altphone ?? "",
          whatappnumber:
            settingsObj.whatappnumber ?? settingsObj.whatsapp ?? settingsObj.whatsapp_number ?? settings.whatappnumber ?? "",
          address: settingsObj.address ?? settingsObj.addr ?? settings.address ?? "",
          logo_url:
            settingsObj.logo_url ??
            settingsObj.logo ??
            settingsObj.logoUrl ??
            settings.logo_url ??
            settings.logo ??
            "",
          favicon_url:
            settingsObj.favicon_url ??
            settingsObj.favicon ??
            settingsObj.faviconUrl ??
            settings.favicon_url ??
            settings.favicon ??
            "",
        };

        setSettings((prev) => ({ ...prev, ...normalizedSettings }));

        // persist settings to localStorage
        try {
          const existing = localStorage.getItem("settings");
          if (existing) {
            const s = JSON.parse(existing);
            localStorage.setItem("settings", JSON.stringify({ ...s, ...normalizedSettings }));
          } else {
            localStorage.setItem("settings", JSON.stringify(normalizedSettings));
          }
        } catch (e) {
          console.warn("localStorage update settings failed:", e);
        }

        // optionally: update redux slice if you want app-wide settings
        try {
          dispatch(setSiteSettings(normalizedSettings));
        } catch (e) {
          // ignore
        }
      }

      toast.dismiss(loadingId);
      toast.success("Settings loaded");
    } catch (err) {
      console.error("fetchSettings error:", err);
      toast.dismiss();
      toast.error("Network error while loading settings. Using cached values.");
    } finally {
      setIsFetching(false);
    }
  };

  // keep background locked when modal open
  useEffect(() => {
    if (showDetailsModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [showDetailsModal]);
  useEffect(() => {
    if (showDetailsModal) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        password: "",
        site_name: settings.site_name ?? "",
        altphone: settings.altphone ?? "",
        whatappnumber: settings.whatappnumber ?? "",
      });
      setLogoFile(null);
      setFaviconFile(null);
      setShowPassword(false);

      const t = setTimeout(() => {
        const input = modalRef.current?.querySelector("input[name='name']");
        input?.focus?.();
        input?.select?.();
      }, 0);

      const onKey = (e) => {
        if (e.key === "Escape") setShowDetailsModal(false);
      };
      document.addEventListener("keydown", onKey);
      return () => {
        clearTimeout(t);
        document.removeEventListener("keydown", onKey);
      };
    } else {
      triggerRef.current?.focus?.();
    }
  }, [showDetailsModal, user, settings]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formError) setFormError("");
  };
  const handleLogoChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setLogoFile(f);
  };
  const handleFaviconChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFaviconFile(f);
  };

  // submit handler -> POST /admin/settings/update (FormData)
  const handleSubmitDetails = async (ev) => {
    ev?.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      toast.error(err);
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Session expired — please login again.");
      return;
    }

    setIsUpdating(true);
    const loadingId = toast.loading("Updating settings...");
    try {
      const fd = new FormData();
      // user fields
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("contact", String(form.phone).trim()); // server might expect contact
      fd.append("phone", String(form.phone).trim());
      fd.append("address", form.address.trim());
      if (form.password && form.password.trim().length > 0) {
        fd.append("password", String(form.password));
      }

      // settings fields
      fd.append("site_name", form.site_name.trim());
      fd.append("email", form.email.trim()); // sometimes settings want email too
      fd.append("phone", form.phone.trim());
      if (form.altphone && form.altphone.trim() !== "") fd.append("altphone", form.altphone.trim());
      if (form.whatappnumber && form.whatappnumber.trim() !== "") fd.append("whatappnumber", form.whatappnumber.trim());
      fd.append("address", form.address.trim());

      // files
      if (logoFile) fd.append("logo", logoFile);
      if (faviconFile) fd.append("favicon", faviconFile);

      const res = await fetch(`${LOCAL_API_BASE}/admin/settings/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json().catch(() => null);
      console.log("TEST",data)
      if (data) {
        window.location.reload();
      }
      if (!res.ok) {
        const serverMsg = data?.message || data?.error || `Update failed (${res.status})`;
        toast.error(serverMsg);
        throw new Error(serverMsg);
      }

      if (data && data.status === false) {
        const serverMsg = data.message || "Update failed.";
        toast.error(serverMsg);
        throw new Error(serverMsg);
      }
      const updatedSettings = {
        site_name: data?.site_name ?? data?.settings?.site_name ?? data?.data?.site_name ?? form.site_name,
        email: data?.email ?? data?.settings?.email ?? form.email,
        phone: data?.phone ?? data?.settings?.phone ?? form.phone,
        altphone: data?.altphone ?? data?.settings?.altphone ?? form.altphone ?? "",
        whatappnumber: data?.whatappnumber ?? data?.settings?.whatappnumber ?? form.whatappnumber ?? "",
        address: data?.address ?? data?.settings?.address ?? form.address,
        logo_url:
          data?.logo ??
          data?.settings?.logo ??
          (data?.data && (data.data.logo || data.data.logo_url)) ??
          settings.logo_url ??
          "",
        favicon_url:
          data?.favicon ??
          data?.settings?.favicon ??
          (data?.data && (data.data.favicon || data.data.favicon_url)) ??
          settings.favicon_url ??
          "",
      };

      // user updates (if server returned profile/user)
      let updatedUser = { ...user };
      if (Array.isArray(data?.profile) && data.profile.length > 0) {
        const p = data.profile[0];
        updatedUser = {
          ...updatedUser,
          id: p.id ?? updatedUser.id,
          name: p.name ?? updatedUser.name,
          email: p.email ?? updatedUser.email,
          phone: p.contact ? String(p.contact) : p.contact ?? updatedUser.phone,
          address: p.address ?? updatedUser.address,
          createdAt: p.created_at ?? p.createdAt ?? updatedUser.createdAt,
        };
      } else if (data?.user && typeof data.user === "object") {
        const p = data.user;
        updatedUser = {
          ...updatedUser,
          id: p.id ?? updatedUser.id,
          name: p.name ?? updatedUser.name,
          email: p.email ?? updatedUser.email,
          phone: p.contact ? String(p.contact) : p.contact ?? updatedUser.phone,
          address: p.address ?? updatedUser.address,
          createdAt: p.created_at ?? p.createdAt ?? updatedUser.createdAt,
        };
      } else {
        // fallback to our form
        updatedUser = {
          ...updatedUser,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: String(form.phone).trim(),
          address: form.address.trim(),
        };
      }
      // update local state and localStorage
      setSettings((prev) => ({ ...prev, ...updatedSettings }));
      setUser(updatedUser);

      try {
        const rawU = localStorage.getItem("user");
        if (rawU) {
          const u = JSON.parse(rawU);
          localStorage.setItem("user", JSON.stringify({ ...u, ...updatedUser }));
        } else {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.warn("update localStorage user failed:", e);
      }
      try {
        const rawS = localStorage.getItem("settings");
        if (rawS) {
          const s = JSON.parse(rawS);
          localStorage.setItem("settings", JSON.stringify({ ...s, ...updatedSettings }));
        } else {
          localStorage.setItem("settings", JSON.stringify(updatedSettings));
        }
      } catch (e) {
        console.warn("update localStorage settings failed:", e);
      }

      // update redux slice with new settings (optional)
      try {
        dispatch(setSiteSettings(updatedSettings));
      } catch (e) {
        // ignore
      }

      toast.dismiss(loadingId);
      toast.success("Updated successfully");
      setShowDetailsModal(false);
    } catch (err) {
      console.error("update error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to update settings");
      setFormError(err?.message || "Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = user?.name || user?.fullName || user?.username || "User";
  const buildMapsEmbedUrl = (address) => {
    const addr = String(address ?? "").trim();
    if (!addr) return null;
    const q = encodeURIComponent(addr);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  };

  const mapsUrl = buildMapsEmbedUrl(settings?.address);

  return (
    <div className="space-y-8 p-5">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "settings", label: "Site Settings" },
            // { key: "gst", label: "GST Management" },
            // { key: "banners", label: "Banners" },
              { key: "shop", label: "Shop Settings" },
              { key: "home", label: "Home Page" },
              { key: "sales", label: "Sales Banner" },
              { key: "payment", label: "Payment Gate Ways" },
              { key: "shipping", label: "Shipping Settings" },
           
            { key: "social", label: "Social Media" },
         
            // { key: "discounts", label: "Discounts" },
          ].map((t) => (
            <Button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === t.key
                  ? ""
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
              // type="button"
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {activeTab === "settings" && (
            <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Personal Info */}
  <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-6">
    <div className="mb-4">
  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
    <SettingsIcon className="h-5 w-5" /> Site Settings
  </h3>

  {settings?.logo_url ? (
    <div className="flex justify-start">
      <img
        src={settings.logo_url}
        alt="logo"
        className="h-20 w-20 object-contain rounded"
      />
    </div>
  ) : (
    <div className="text-sm text-gray-400 flex items-center gap-2">
      <ImageIcon className="h-5 w-5" /> No logo
    </div>
  )}
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-xs uppercase text-gray-500">Name</div>
          <div className="mt-1 font-medium text-gray-900">{settings?.site_name || "—"}</div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-xs uppercase text-gray-500">Email</div>
          <div className="mt-1 font-medium text-gray-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{settings?.email || "—"}</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-xs uppercase text-gray-500">Phone</div>
          <div className="mt-1 font-medium text-gray-900 flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="truncate">{settings?.phone || "—"}</span>
          </div>
        </div>
      </div>
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" /> Edit Setting Details
          </h3>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Site: <span className="font-medium text-gray-800">{settings?.site_name || "—"}</span>
            </div>
            <div className="text-sm text-gray-600">
              Site Email: <span className="font-medium text-gray-800">{settings?.email || "—"}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors border"
              >
                <EditIcon className="h-4 w-4" />
                Edit Details
              </button>
              {isFetching && <div className="text-sm text-gray-500">Refreshing…</div>}
            </div>
            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <div>Phone: {settings?.phone || "—"}</div>
              <div>Alt Phone: {settings?.altphone || "—"}</div>
              <div>WhatsApp: {settings?.whatappnumber || "—"}</div>
              <div>Address: {settings?.address || "—"}</div>
              <div>
                Favicon:{" "}
                {settings?.favicon_url ? <img src={settings.favicon_url} alt="favicon" className="inline-block h-5 w-5" /> : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="lg:col-span-1 space-y-4">
    <div>
      <GstManagement />
    </div>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b">
        <h4 className="text-sm font-semibold">Location (Map)</h4>
      </div>
      <div className="p-3">
        {mapsUrl ? (
          <div className="w-full h-64 rounded-md overflow-hidden border">
            <iframe
              title="Site location map"
              src={mapsUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Address not available. Please update the site address in Edit Details to display the map.
          </div>
        )}
      </div>
    </div>
  </div>
</div>
            </div>
          )}
           {activeTab === "home" && (
            <div className="mt-3">
              <HomeSettings />
            </div>
          )}
          {activeTab === "gst" && (
            <div className="mt-3">
              <GstManagement />
            </div>
          )}
          {activeTab === "banners" && (
            <div className="mt-3">
              <Bannerspage />
            </div>
          )}
          {activeTab === "sales" && (
            <div className="mt-3">
              <SalesBanner />
            </div>
          )}
           {activeTab === "payment" && (
            <div className="mt-3">
              <PaymentSettings />
            </div>
          )}
           {activeTab === "shipping" && (
            <div className="mt-3">
              <ShippingSettings />
            </div>
          )}

          {activeTab === "social" && (
            <div className="mt-3">
              <Socialmedia />
            </div>
          )}
          {activeTab === "shop" && (
            <div className="mt-3">
              <ShopSettings />
            </div>
          )}
          {activeTab === "discounts" && (
            <div className="mt-3">
              <Discounts />
            </div>
          )}
        </div>
      </div>
      {showDetailsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" aria-hidden={!showDetailsModal}>
          <div className="fixed inset-0 bg-black/40 z-[9998]" aria-hidden="true" onClick={() => setShowDetailsModal(false)} />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-details-title"
            className="relative z-[9999] w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 id="edit-details-title" className="text-lg font-semibold">
                Edit Setting Details
              </h4>
              <button type="button" aria-label="Close" onClick={() => setShowDetailsModal(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* User fields */}
                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Full name</div>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Full name" required />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Email</div>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full p-2 border rounded" placeholder="you@example.com" required />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Phone</div>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full p-2 border rounded" placeholder="10-15 digits" required />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Address</div>
                  <input name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Address line" required />
                </label>

                {/* Settings fields */}
                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Site name</div>
                  <input name="site_name" value={form.site_name} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Site name (required)" required />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">Alt phone</div>
                  <input name="altphone" value={form.altphone} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Alternate contact (optional)" />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-600">WhatsApp number</div>
                  <input name="whatappnumber" value={form.whatappnumber} onChange={handleChange} className="w-full p-2 border rounded" placeholder="WhatsApp number (optional)" />
                </label>

                {/* Logo + Favicon file inputs (optional) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <div className="text-sm text-gray-600">Logo (optional)</div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full p-2 border rounded" />
                    {settings.logo_url ? <img src={settings.logo_url} alt="logo preview" className="h-12 mt-2 object-contain" /> : null}
                  </label>

                  <label className="space-y-1">
                    <div className="text-sm text-gray-600">Favicon (optional)</div>
                    <input type="file" accept="image/*" onChange={handleFaviconChange} className="w-full p-2 border rounded" />
                    {settings.favicon_url ? <img src={settings.favicon_url} alt="favicon preview" className="h-8 mt-2 object-contain" /> : null}
                  </label>
                </div>
              </div>

              {formError && <div className="text-sm text-red-600">{formError}</div>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDetailsModal(false)} className="px-4 py-2 rounded border">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 rounded bg-blue-600 text-white">
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
