import React, { useEffect, useRef, useState } from "react";

import { IMAGES } from "../assets/images";

export default function ImageWithFallback({ src, alt = "", className = "", fallback = IMAGES.DummyImage, style = {}, ...rest }) {
  const [visible, setVisible] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const ref = useRef(null);

  // compute resolved src once (supports string or object with common fields)
  const compute = (s) => {
    if (!s) return fallback;
    if (typeof s === "string") return s.trim() || fallback;
    const raw = s.image_url ?? s.image ?? s.imageUrl ?? s.photo ?? s.thumbnail ?? s.url ?? "";
    const str = String(raw ?? "").trim();
    if (!str) return fallback;
    if (/^https?:\/\//i.test(str)) return str;
    // relative -> origin
    return `${window.location.origin}/${str.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    setImgSrc(null);
    setVisible(false);
    const el = ref.current;
    if (!el) return undefined;

    // IntersectionObserver to lazy load images
    let obs;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      }, { rootMargin: "200px" });
      obs.observe(el);
    } else {
      // fallback if IO not supported
      setVisible(true);
    }
    return () => obs && obs.disconnect();
  }, [src]);

  useEffect(() => {
    if (!visible) return;
    const resolved = compute(src);
    setImgSrc(resolved);
  }, [visible, src]);

  const onError = (e) => {
    // prevent infinite loop
    if (imgSrc === fallback) return;
    e.currentTarget.onerror = null;
    setImgSrc(fallback);
  };

  // Use decoding async and loading lazy (nice/simple)
  return (
    <div ref={ref} className={className} style={style}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          decoding="async"
          loading="lazy"
          onError={onError}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          {...rest}
        />
      ) : (
        // lightweight placeholder — keeps layout stable
        <div style={{ width: "100%", height: "100%", backgroundColor: "#f6f7f9" }} />
      )}
    </div>
  );
}
