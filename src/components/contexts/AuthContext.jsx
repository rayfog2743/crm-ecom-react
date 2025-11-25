// src/contexts/AuthProvider.jsx
import * as React from "react";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import { fetchSiteSettings } from "../../redux/slices/sitesettings";
import { fetchOnlineOrders } from "../../redux/slices/SalesSlice";

const AuthContext = React.createContext(undefined);
const TOKEN_KEY = "token";

function extractTokenFromLoginResponse(data) {
  if (!data) return null;
  const tryString = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const candidates = [
    data?.access_token,
    data?.accessToken,
    data?.token,
    data?.data?.access_token,
    data?.data?.token,
  ];
  for (const c of candidates) { const s = tryString(c); if (s) return s; }
  const nested = [data?.token, data?.data?.token, data?.token_data, data?.data?.token_data];
  for (const obj of nested) {
    if (obj && typeof obj === "object") {
      const s = tryString(obj.token) ?? tryString(obj.access_token);
      if (s) return s;
    }
  }
  return null;
}

function extractUserFromResponse(data) {
  if (!data) return null;
  const maybeUser = data?.user ?? data?.admin ?? data?.data ?? null;
  const pick = (u) => {
    if (!u || typeof u !== "object") return null;
    return {
      id: u.id ?? u.user_id ?? u._id ?? null,
      username: u.username ?? u.email ?? null,
      name: u.name ?? u.fullName ?? u.username ?? u.email ?? null,
      role: u.role ?? null,
    };
  };
  return pick(maybeUser) ?? {
    id: data?.id ?? null,
    username: data?.username ?? data?.email ?? null,
    name: data?.name ?? null,
    role: data?.role ?? null,
  };
}

function setAxiosTokenHeader(token) {
  try {
    if (!api.defaults) api.defaults = {};
    if (!api.defaults.headers) api.defaults.headers = {};
    if (!api.defaults.headers.common) api.defaults.headers.common = {};
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else if (api.defaults.headers.common.Authorization) delete api.defaults.headers.common.Authorization;
  } catch {}
}

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const lastTokenRef = React.useRef(null);

  const saveToken = (token) => {
    try {
      if (!token) localStorage.removeItem(TOKEN_KEY);
      else localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    lastTokenRef.current = token;
    setAxiosTokenHeader(token);
  };

  const logout = () => { saveToken(null); setUser(null); };

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await api.post("/admin-login", { username, password }, { headers: { Accept: "application/json" }});
      const token = extractTokenFromLoginResponse(res?.data);
      if (!token) throw new Error(res?.data?.message || "No token returned from server");
      saveToken(token);
      setAxiosTokenHeader(token);
      try { await dispatch(fetchSiteSettings()); } catch {}
      try { await dispatch(fetchOnlineOrders()); } catch {}
      const u = extractUserFromResponse(res?.data) ?? { username };
      setUser(u);
      return u;
    } catch (err) {
      saveToken(null);
      const serverPayload = err?.response?.data ?? err?.data ?? null;
      const message = serverPayload?.message ?? err?.message ?? "Login failed";
      throw new Error(String(message));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserFromToken = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      setAxiosTokenHeader(token);
      const res = await api.get("/admin-login", { headers: { Accept: "application/json" }});
      const u = extractUserFromResponse(res?.data ?? null);
      setUser(u);
      return u;
    } catch { return null; } finally { setIsLoading(false); }
  };

  React.useEffect(() => {
    (async () => {
      setIsLoading(true);
      let token = null;
      try { token = localStorage.getItem(TOKEN_KEY); } catch {}
      lastTokenRef.current = token;
      setAxiosTokenHeader(token);
      if (token) {
        try { await dispatch(fetchSiteSettings()); } catch {}
      } else {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    })();
  }, [dispatch]);

  const value = { user, isLoading, isAuthenticated: !!user, login, logout, refreshUserFromToken };
  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => React.useContext(AuthContext);
