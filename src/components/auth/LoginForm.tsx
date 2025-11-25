

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { IMAGES } from "../../assets/IMAGES";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

// Redux typed imports
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchSiteSettings } from "@/redux/slices/sitesettings";

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  // Typed dispatch
  const dispatch = useDispatch<AppDispatch>();

  const { login } = useAuth();

  // Typed selector for settings slice
  const settings = useSelector((state: RootState) => state.sitesettings);

  // Fetch site settings on mount (only once)
  useEffect(() => {
    // fire-and-forget — fetch latest settings once when component mounts
    dispatch(fetchSiteSettings());
  }, [dispatch]);

  // prefer settings.logo_url (from API / slice). fallback to IMAGES.Nutz
  const rawLogo = (settings && (settings.logo_url ?? settings.logo_url ?? "")) || "";
  // Build a safe image source - accept absolute http(s) or protocol-relative URLs; otherwise fallback to local image
  const isRemoteLogo = /^(https?:\/\/|\/\/)/i.test(rawLogo.trim());
  const logoSrc = isRemoteLogo ? rawLogo.trim() : rawLogo.trim()|| "/images/default-logo.png";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    // prevent infinite loop if fallback is broken
    if (img.src !== IMAGES.Nutz && IMAGES.Nutz) {
      img.src = IMAGES.Nutz;
    } else {
      img.src = "/images/default-logo.png";
    }
    img.style.objectFit = "contain";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // login may throw or return user - keep generic typing
      const user = await login(username.trim(), password);
      toast.success("Login successful");
      // navigate immediately after success
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        // fallback route if login returns falsy for whatever reason
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div
        className="min-h-screen flex items-center justify-end bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${IMAGES.Bg_Image || "/images/retail-bg.jpg"})`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-lg h-screen flex items-center p-6">
          <Card className="w-full h-[650px] backdrop-blur-md bg-white flex flex-col justify-center">
            <CardHeader className="text-center space-y-6">
              {/* <img
                src={logoSrc}
                alt="Retail Logo"
                onError={handleImageError}
                className="mx-auto w-32 h-20 object-contain"
                // Add loading attribute for better UX
                loading="lazy"
              /> */}
                 <div className="flex items-center justify-center w-full h-full">
  <img
    src={
      isRemoteLogo && rawLogo.trim()
        ? rawLogo.trim()
        : "https://via.placeholder.com/120x120.png?text=Logo"
    }
    alt="Site Logo"
    className="h-20 w-25 object-contain rounded-lg shadow-lg border border-gray-200"
  />
</div>

            </CardHeader>

            <h1 className="text-2xl font-semibold text-center">Login</h1>
             <h1 ></h1>
            <CardContent className="flex-grow flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username input */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="default" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-sm text-center">
                  {/* <Link to="/forgot-password" className="text-primary underline">
                    Forgot password?
                  </Link> */}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
