


import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../../api/axios"; // adjust path if necessary
import { useDispatch } from "react-redux";
import { fetchSiteSettings } from "../../redux/slices/sitesettings"; // named import - adjust path if needed
import { fetchOnlineOrders } from "../../redux/slices/SalesSlice";

type User = {
  id?: number | string;
  username?: string;
  name?: string;
  role?: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUserFromToken: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = "token";

/** Try many places where token might hide inside response */
function extractTokenFromLoginResponse(data: any): string | null {
  if (!data) return null;

  const tryString = (v: any) => (typeof v === "string" && v.trim() ? v.trim() : null);

  // candidate paths
  const candidates: any[] = [
    data?.access_token,
    data?.accessToken,
    data?.token,
    data?.data?.access_token,
    data?.data?.token,
    data?.token_data?.access_token,
    data?.token_data?.token,
    data?.data?.token_data?.access_token,
    data?.data?.token_data?.token,
  ];

  for (const c of candidates) {
    const s = tryString(c);
    if (s) return s;
  }

  // sometimes the token sits inside object like { token: { token: "x" } } or { token: { access_token: "x" } }
  const nestedCandidates = [
    data?.token,
    data?.data?.token,
    data?.token_data,
    data?.data?.token_data,
    data?.access_token,
    data?.data?.access_token,
  ];
  for (const obj of nestedCandidates) {
    if (obj && typeof obj === "object") {
      const s = tryString(obj.token) ?? tryString(obj.access_token);
      if (s) return s;
    }
  }

  return null;
}

/** Pull user object from many possible shapes */
function extractUserFromResponse(data: any): User {
  if (!data) return null;

  const maybeUser =
    data?.user ?? data?.admin ?? data?.data?.user ?? data?.data?.admin ?? data?.data ?? null;

  const pick = (u: any) => {
    if (!u || typeof u !== "object") return null;
    return {
      id: u.id ?? u.user_id ?? u._id ?? null,
      username: u.username ?? u.email ?? null,
      name: u.name ?? u.fullName ?? u.username ?? u.email ?? null,
      role: u.role ?? null,
    } as User;
  };

  const u = pick(maybeUser);
  if (u) return u;

  // fallback to top-level fields
  return {
    id: data?.id ?? null,
    username: data?.username ?? data?.email ?? null,
    name: data?.name ?? null,
    role: data?.role ?? null,
  } as User;
}

/** Helper to set Authorization header safely on your axios instance */
function setAxiosTokenHeader(token: string | null) {
  try {
    // ensure defaults and common exist
    if (!(api.defaults as any)) (api.defaults as any) = {};
    if (!(api.defaults.headers as any)) (api.defaults.headers as any) = {};
    if (!(api.defaults.headers as any).common) (api.defaults.headers as any).common = {};

    if (token) {
      (api.defaults.headers as any).common.Authorization = `Bearer ${token}`;
    } else {
      // remove header if exists
      if ((api.defaults.headers as any).common && (api.defaults.headers as any).common.Authorization) {
        delete (api.defaults.headers as any).common.Authorization;
      }
    }
  } catch (e) {
    // silently ignore header set errors
    // console.warn("setAxiosTokenHeader failed", e);
  }
}

/** stringify helper for server responses so user sees full payload */
function stringifyServerPayload(payload: any): string {
  try {
    if (typeof payload === "string") return payload;
    if (payload === null || payload === undefined) return String(payload);
    // pretty-print, but concise
    return JSON.stringify(payload, (_k, v) => (v === undefined ? null : v), 2);
  } catch {
    return String(payload);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<any>(); // inside component — safe to use hooks
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastTokenRef = useRef<string | null>(null);

  // Save token + sync axios
  const saveToken = (token: string | null) => {
    try {
      if (!token) {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch (e) {
      // ignore localStorage errors
    }
    lastTokenRef.current = token;
    setAxiosTokenHeader(token);
  };

  const logout = () => {
    saveToken(null);
    setUser(null);
  };

  const login = async (username: string, password: string): Promise<User> => {
  setIsLoading(true);
  try {
    const res = await api.post(
      "/admin-login",
      { username, password },
      { headers: { Accept: "application/json" } }
    );

    const token = extractTokenFromLoginResponse(res?.data);

    // If no token, prefer the server's plain message if available
    if (!token) {
      const serverMsg = res?.data?.message ?? res?.data ?? null;
      const msgToThrow = typeof serverMsg === "string" ? serverMsg : stringifyServerPayload(serverMsg);
      // Throw the server message (or a safe string) so callers / toast show a clean message.
      throw new Error(msgToThrow || "No token returned from server");
    }

    // persist token BEFORE calling fetchSiteSettings (thunk may read localStorage)
    saveToken(token);
    setAxiosTokenHeader(token);

    // Dispatch fetchSiteSettings to populate redux with site settings.
    try {
      await dispatch(fetchSiteSettings());
    } catch (settingsErr) {
      // don't fail login if settings fetch fails
      // console.warn("Failed to fetch site settings after login:", settingsErr);
    }

    try {
      await dispatch(fetchOnlineOrders());
    } catch (ordersErr) {
      // console.warn("Failed to fetch online orders after login:", ordersErr);
    }

    const u = extractUserFromResponse(res?.data) ?? { username } ?? null;
    setUser(u);
    return u;
  } catch (err: any) {
    // Clear any token we might have saved earlier
    saveToken(null);

    // Prefer server-provided message if present
    const serverPayload = err?.response?.data ?? err?.data ?? null;
    const message =
      serverPayload?.message ??
      (typeof serverPayload === "string" ? serverPayload : null) ??
      err?.message ??
      "Login failed";

    // Throw a plain message so UI toasts show just the message text
    throw new Error(String(message));
  } finally {
    setIsLoading(false);
  }
};


  const refreshUserFromToken = async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      setAxiosTokenHeader(token);
      const res = await api.get("/admin-login", { headers: { Accept: "application/json" } });
      const u = extractUserFromResponse(res?.data ?? null);
      setUser(u);
      return u;
    } catch (err) {
      // Do not logout automatically; just return null
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let token: string | null = null;
      try {
        token = localStorage.getItem(TOKEN_KEY);
      } catch {}
      lastTokenRef.current = token;
      setAxiosTokenHeader(token);
      if (token) {
        try {
          dispatch(fetchSiteSettings());
        } catch (err) {
        }
      }

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dispatch]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUserFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  // We don't throw here to give callers a chance to check undefined.
  return ctx;
};
