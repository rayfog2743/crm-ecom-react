
// import React, { useEffect, useRef, useState } from "react";
// import { useCategories } from "../components/contexts/categoriesContext"; // adjust path if needed

// export default function CategoryCarousel({
//   items, // optional override (keeps backwards compatibility)
//   autoplay = true,
//   interval = 2500,
//   onSelect, // optional callback: (item) => {}
// }) {
//   const scrollerRef = useRef(null);
//   const autoRef = useRef(null);
//   const isHoverRef = useRef(false);

//   // drag state refs
//   const isDraggingRef = useRef(false);
//   const startXRef = useRef(0);
//   const scrollStartRef = useRef(0);
//   const dragMovedRef = useRef(false);

//   const [selectedId, setSelectedId] = useState(null);
//   const {
//     categories, // from context
//     loading,
//     totalItems,
//     page,
//     perPage,
//     totalPages,
//     fetchCategories,
//     createCategory,
//     updateCategory,
//     deleteCategory,
//     fetchSingle,
//   } = useCategories();

//   // If caller passed `items` prop, prefer it; otherwise use categories from context.
//   const itemsToRender =
//     Array.isArray(items) && items.length > 0
//       ? items
//       : (Array.isArray(categories) ? categories.map((c) => ({
//           id: String(c.id),
//           title: c.category,
//           subtitle: `${c.productCount ?? 0} Products`,
//           image: c.image_url ?? c.image ?? "",
//         })) : []);

//   // helper to scroll programmatically
//   const scrollBy = (offset) => {
//     const el = scrollerRef.current;
//     if (!el) return;
//     el.scrollBy({ left: offset, behavior: "smooth" });
//   };

//   // autoplay (pauses on hover/drag)
//   useEffect(() => {
//     if (!autoplay) return;
//     const el = scrollerRef.current;
//     if (!el) return;

//     const startAuto = () => {
//       if (autoRef.current) clearInterval(autoRef.current);
//       autoRef.current = setInterval(() => {
//         // if user is interacting, skip
//         if (isHoverRef.current || isDraggingRef.current) return;
//         // scroll by one card width (approx)
//         const step = Math.max(200, Math.floor(el.clientWidth * 0.25));
//         if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
//           el.scrollTo({ left: 0, behavior: "smooth" }); // loop
//         } else {
//           el.scrollBy({ left: step, behavior: "smooth" });
//         }
//       }, interval);
//     };

//     startAuto();
//     return () => {
//       if (autoRef.current) clearInterval(autoRef.current);
//     };
//   }, [autoplay, interval, itemsToRender.length]);

//   // mouse drag handlers
//   useEffect(() => {
//     const el = scrollerRef.current;
//     if (!el) return;

//     const onMouseDown = (e) => {
//       isDraggingRef.current = true;
//       dragMovedRef.current = false;
//       startXRef.current = e.clientX;
//       scrollStartRef.current = el.scrollLeft;
//       el.classList.add("cursor-grabbing");
//     };

//     const onMouseMove = (e) => {
//       if (!isDraggingRef.current) return;
//       const dx = e.clientX - startXRef.current;
//       if (Math.abs(dx) > 5) dragMovedRef.current = true;
//       el.scrollLeft = scrollStartRef.current - dx;
//     };

//     const endDrag = () => {
//       if (!isDraggingRef.current) return;
//       isDraggingRef.current = false;
//       el.classList.remove("cursor-grabbing");
//       const child = el.querySelector("[role='listitem']");
//       if (child) {
//         const itemWidth = child.getBoundingClientRect().width + parseFloat(getComputedStyle(child).marginRight || 0);
//         const targetIndex = Math.round(el.scrollLeft / itemWidth);
//         const targetLeft = targetIndex * itemWidth;
//         el.scrollTo({ left: targetLeft, behavior: "smooth" });
//       }
//     };

//     const onMouseUp = () => endDrag();
//     const onMouseLeave = () => endDrag();

//     el.addEventListener("mousedown", onMouseDown);
//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("mouseup", onMouseUp);
//     el.addEventListener("mouseleave", onMouseLeave);

//     return () => {
//       el.removeEventListener("mousedown", onMouseDown);
//       window.removeEventListener("mousemove", onMouseMove);
//       window.removeEventListener("mouseup", onMouseUp);
//       el.removeEventListener("mouseleave", onMouseLeave);
//     };
//   }, [itemsToRender.length]);

//   // touch drag handlers (mobile)
//   useEffect(() => {
//     const el = scrollerRef.current;
//     if (!el) return;

//     let startX = 0;
//     let startScroll = 0;

//     const onTouchStart = (e) => {
//       isDraggingRef.current = true;
//       startX = e.touches[0].clientX;
//       startScroll = el.scrollLeft;
//     };
//     const onTouchMove = (e) => {
//       const dx = e.touches[0].clientX - startX;
//       el.scrollLeft = startScroll - dx;
//     };
//     const onTouchEnd = () => {
//       isDraggingRef.current = false;
//       const child = el.querySelector("[role='listitem']");
//       if (child) {
//         const itemWidth = child.getBoundingClientRect().width + parseFloat(getComputedStyle(child).marginRight || 0);
//         const targetIndex = Math.round(el.scrollLeft / itemWidth);
//         const targetLeft = targetIndex * itemWidth;
//         el.scrollTo({ left: targetLeft, behavior: "smooth" });
//       }
//     };

//     el.addEventListener("touchstart", onTouchStart, { passive: true });
//     el.addEventListener("touchmove", onTouchMove, { passive: true });
//     el.addEventListener("touchend", onTouchEnd);

//     return () => {
//       el.removeEventListener("touchstart", onTouchStart);
//       el.removeEventListener("touchmove", onTouchMove);
//       el.removeEventListener("touchend", onTouchEnd);
//     };
//   }, [itemsToRender.length]);

//   // hover pause
//   const onMouseEnter = () => {
//     isHoverRef.current = true;
//   };
//   const onMouseLeave = () => {
//     isHoverRef.current = false;
//   };

//   // click handler that ignores clicks triggered by dragging
//   const handleClickItem = (item, e) => {
//     // if drag moved, ignore click
//     if (isDraggingRef.current || dragMovedRef.current) {
//       dragMovedRef.current = false;
//       return;
//     }
//     setSelectedId(item.id);
//     if (typeof onSelect === "function") onSelect(item);
//   };

//   return (
//     <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
//       {/* Left Button */}
//       <button
//         type="button"
//         onClick={() => {
//           const el = scrollerRef.current;
//           if (!el) return;
//           el.scrollBy({ left: -220, behavior: "smooth" });
//         }}
//         aria-label="Scroll left"
//         className="hidden sm:inline-flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md border"
//       >
//         ‹
//       </button>

//       {/* Scroll Container */}
//       <div
//         ref={scrollerRef}
//         className="flex gap-2 overflow-x-auto scrollbar-none scroll-pl-3 snap-x snap-mandatory px-1 py-1"
//         role="list"
//         aria-label="Product categories"
//       >
//         {itemsToRender.map((it) => {
//           const active = selectedId === it.id;
//           return (
//             <button
//   key={it.id}
//   type="button"
//   role="listitem"
//   onClick={(e) => handleClickItem(it, e)}
//   className={`snap-start shrink-0 w-32 sm:w-36 md:w-40 lg:w-20 rounded-lg overflow-hidden bg-white border shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 ${
//     active ? "ring-2 ring-indigo-500" : ""
//   }`}
// >
//   <div className="relative h-10 sm:h-24 md:h-20">
//     <img
//       src={it.image}
//       alt={it.title}
//       loading="lazy"
//       className="w-full h-full object-cover object-center mt-2" 
//       onError={(e) => {
//         e.currentTarget.src = `https://source.unsplash.com/600x400/?${encodeURIComponent(it.title)}`;
//       }}
//     />
//     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
//     <div className="absolute left-2 bottom-2 text-white">
//     </div>
//   </div>

//   <div className="px-2 py-1 text-left">
//     <div className="text-xs font-medium text-slate-800 truncate">
//       {it.title}
//     </div>
//   </div>
// </button>

//           );
//         })}
//       </div>

//       {/* Right Button */}
//       <button
//         type="button"
//         onClick={() => {
//           const el = scrollerRef.current;
//           if (!el) return;
//           el.scrollBy({ left: 220, behavior: "smooth" });
//         }}
//         aria-label="Scroll right"
//         className="hidden sm:inline-flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md border"
//       >
//         ›
//       </button>

//       {/* Hide scrollbar on all browsers */}
//       <style>{`
//         .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
//         .scrollbar-none::-webkit-scrollbar { display: none; }
//       `}</style>
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from "react";
import { useCategories } from "../components/contexts/categoriesContext"; // adjust path if needed

export default function CategoryCarousel({
  items, // optional override
  autoplay = true,
  interval = 2500,
  onSelect, // optional callback: (item) => {}
}) {
  const scrollerRef = useRef(null);
  const autoRef = useRef(null);
  const isHoverRef = useRef(false);

  // drag state refs
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const dragMovedRef = useRef(false);

  const [selectedId, setSelectedId] = useState(null);
  const {
    categories,
    loading,
    fetchCategories,
    // other methods left unused here but kept for compatibility
  } = useCategories();

  // prefer prop items if provided
  const itemsToRender =
    Array.isArray(items) && items.length > 0
      ? items
      : (Array.isArray(categories)
          ? categories.map((c) => ({
              id: String(c.id ?? c._id ?? c.category_id ?? c.name ?? c.title),
              title: c.category ?? c.name ?? c.title ?? "Category",
              subtitle: `${c.productCount ?? 0} Products`,
              image: c.image_url ?? c.image ?? "",
            }))
          : []);

  // programmatic scroll helper
  const scrollBy = (offset) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  // autoplay with pause on hover/drag
  useEffect(() => {
    if (!autoplay) return;
    const el = scrollerRef.current;
    if (!el) return;

    const startAuto = () => {
      if (autoRef.current) clearInterval(autoRef.current);
      autoRef.current = setInterval(() => {
        if (isHoverRef.current || isDraggingRef.current) return;
        const step = Math.max(200, Math.floor(el.clientWidth * 0.25));
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: step, behavior: "smooth" });
        }
      }, interval);
    };

    startAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [autoplay, interval, itemsToRender.length]);

  // mouse drag handlers
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      dragMovedRef.current = false;
      startXRef.current = e.clientX;
      scrollStartRef.current = el.scrollLeft;
      el.classList.add("cursor-grabbing");
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startXRef.current;
      if (Math.abs(dx) > 5) dragMovedRef.current = true;
      el.scrollLeft = scrollStartRef.current - dx;
    };

    const endDrag = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      el.classList.remove("cursor-grabbing");
      const child = el.querySelector("[role='listitem']");
      if (child) {
        const itemWidth =
          child.getBoundingClientRect().width +
          parseFloat(getComputedStyle(child).marginRight || 0);
        const targetIndex = Math.round(el.scrollLeft / itemWidth);
        const targetLeft = targetIndex * itemWidth;
        el.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    };

    const onMouseUp = () => endDrag();
    const onMouseLeave = () => endDrag();

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [itemsToRender.length]);

  // touch drag handlers (mobile)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let startX = 0;
    let startScroll = 0;

    const onTouchStart = (e) => {
      isDraggingRef.current = true;
      startX = e.touches[0].clientX;
      startScroll = el.scrollLeft;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      el.scrollLeft = startScroll - dx;
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
      const child = el.querySelector("[role='listitem']");
      if (child) {
        const itemWidth =
          child.getBoundingClientRect().width +
          parseFloat(getComputedStyle(child).marginRight || 0);
        const targetIndex = Math.round(el.scrollLeft / itemWidth);
        const targetLeft = targetIndex * itemWidth;
        el.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [itemsToRender.length]);

  // hover pause
  const onMouseEnter = () => {
    isHoverRef.current = true;
  };
  const onMouseLeave = () => {
    isHoverRef.current = false;
  };

  // click handler that ignores clicks triggered by dragging
  const handleClickItem = (item, e) => {
    if (isDraggingRef.current || dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setSelectedId(item.id);
    if (typeof onSelect === "function") onSelect(item);
  };

  // small fallback image generator
  const fallbackSrc = (title) =>
    `https://source.unsplash.com/600x400/?${encodeURIComponent(title || "food")}`;

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* left nav */}
      <button
        type="button"
        onClick={() => {
          const el = scrollerRef.current;
          if (!el) return;
          el.scrollBy({ left: -220, behavior: "smooth" });
        }}
        aria-label="Scroll left"
        className="hidden sm:inline-flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md border"
      >
        ‹
      </button>

      {/* scroll area */}
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scrollbar-none scroll-pl-3 snap-x snap-mandatory px-2 py-2"
        role="list"
        aria-label="Product categories"
      >
        {itemsToRender.map((it) => {
          const active = selectedId === it.id;
          return (
            <button
              key={it.id}
              type="button"
              role="listitem"
              onClick={(e) => handleClickItem(it, e)}
              className={`snap-start shrink-0 w-28 sm:w-28 md:w-32 lg:w-28 rounded-lg overflow-hidden bg-white  transition-shadow duration-150 focus:outline-none ${
                active ? "ring-2 ring-rose-300" : "border-gray-100"
              }`}
              style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
              title={it.title}
            >
              {/* image box */}
              <div className="flex items-center justify-center ">
                <div
                  className="w-20 h-20 rounded-lg overflow-hidden bg-white grid place-items-center"
                  style={{
                    // border: "1px solid rgba(249, 226, 226, 0.6)",
                    padding: 6,
                  }}
                >
                  <img
                    src={it.image || fallbackSrc(it.title)}
                    alt={it.title}
                    loading="lazy"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = fallbackSrc(it.title);
                    }}
                  />
                </div>
              </div>
              <div className="px-2 pb-2 pt-0 text-left">
  <div className="text-xs text-centre font-medium text-slate-800 truncate">
    {it.title}
  </div>
</div>      
            </button>
          );
        })}
      </div>

      {/* right nav */}
      <button
        type="button"
        onClick={() => {
          const el = scrollerRef.current;
          if (!el) return;
          el.scrollBy({ left: 220, behavior: "smooth" });
        }}
        aria-label="Scroll right"
        className="hidden sm:inline-flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md border"
      >
        ›
      </button>

      {/* hide scrollbars */}
      <style>{`
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
