
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_BASE = "https://api-rayfog.nearbydoctors.in/public/api/";

/**
 * Shapes
 */
export interface NormalizedSettings {
  site_name: string;
  email: string;
  phone: string;
  altphone: string;
  whatappnumber: string;
  address: string;
  logo_url: string;
  favicon_url: string;
  raw: any;
}

export interface SiteSettingsState extends NormalizedSettings {
  loadedAt: number | null;
  loading: boolean;
  error: any;
}

/**
 * Rejection payload shape used with rejectWithValue
 */
interface FetchRejected {
  message?: string;
  status?: number;
  raw?: any;
}

/**
 * Async thunk - fetch settings from server and normalize them.
 * Return type = NormalizedSettings
 * Rejection value = FetchRejected
 */
export const fetchSiteSettings = createAsyncThunk<
  NormalizedSettings,
  void,
  { rejectValue: FetchRejected }
>("sitesettings/fetch", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token") || "";

    const res = await fetch(`${API_BASE}settings`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return rejectWithValue({
        message: data?.message || `Failed to fetch settings (${res.status})`,
        status: res.status,
        raw: data,
      });
    }

    const settingsObj =
      data?.data?.settings ??
      data?.data ??
      data?.settings ??
      (data?.status && typeof data === "object" && !Array.isArray(data) ? data : null);

    let normalizedSettings: NormalizedSettings = {
      site_name: "",
      email: "",
      phone: "",
      altphone: "",
      whatappnumber: "",
      address: "",
      logo_url: "",
      favicon_url: "",
      raw: data,
    };

    if (settingsObj && typeof settingsObj === "object") {
      normalizedSettings = {
        ...normalizedSettings,
        site_name:
          settingsObj.site_name ?? settingsObj.siteName ?? settingsObj.name ?? normalizedSettings.site_name,
        email: settingsObj.email ?? normalizedSettings.email,
        phone: settingsObj.phone ?? normalizedSettings.phone,
        altphone: settingsObj.altphone ?? settingsObj.alt_phone ?? normalizedSettings.altphone,
        whatappnumber:
          settingsObj.whatappnumber ?? settingsObj.whatsapp ?? settingsObj.whatsapp_number ?? normalizedSettings.whatappnumber,
        address: settingsObj.address ?? settingsObj.addr ?? normalizedSettings.address,
        logo_url:
          settingsObj.logo_url ??
          settingsObj.logo ??
          settingsObj.logoUrl ??
          settingsObj.site_logo ??
          normalizedSettings.logo_url,
        favicon_url:
          settingsObj.favicon_url ??
          settingsObj.favicon ??
          settingsObj.faviconUrl ??
          settingsObj.site_favicon ??
          normalizedSettings.favicon_url,
        raw: data,
      };
    } else if (Array.isArray(data?.profile) && data.profile.length > 0) {
      const p = data.profile[0];
      normalizedSettings = {
        ...normalizedSettings,
        site_name: p.site_name ?? p.name ?? normalizedSettings.site_name,
        logo_url: p.logo ?? normalizedSettings.logo_url,
        raw: data,
      };
    } else {
      normalizedSettings.raw = data;
    }

    return normalizedSettings;
  } catch (err: any) {
    return rejectWithValue({ message: err?.message ?? "Network error", raw: null });
  }
});

/**
 * initial state
 */
const initialState: SiteSettingsState = {
  site_name: "",
  email: "",
  phone: "",
  altphone: "",
  whatappnumber: "",
  address: "",
  logo_url: "",
  favicon_url: "",
  raw: null,
  loadedAt: null,
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "sitesettings",
  initialState,
  reducers: {
    setSiteSettings(state, action: PayloadAction<Partial<NormalizedSettings>>) {
      const payload = action.payload || {};
      Object.assign(state, payload);
      state.loadedAt = Date.now();
      state.error = null;
    },
    resetSiteSettings(state) {
      Object.keys(initialState).forEach((k) => {
        state[k] = (initialState as any)[k];
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteSettings.fulfilled, (state, action: PayloadAction<NormalizedSettings>) => {
        // replace normalized fields
        Object.assign(state, action.payload);
        state.loading = false;
        state.loadedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchSiteSettings.rejected, (state, action) => {
        state.loading = false;
        // action.payload may be undefined (if thrown), so guard
        if (action.payload) {
          state.error = action.payload;
          state.raw = action.payload.raw ?? state.raw;
        } else {
          state.error = action.error?.message ?? "Failed";
        }
      });
  },
});

export const { setSiteSettings, resetSiteSettings } = slice.actions;
export default slice.reducer;
