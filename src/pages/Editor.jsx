
import React, { useRef, useEffect, useState } from "react";

/**
 * Toolbar button
 */
function ToolbarButton({ onClick, title, children, active = false }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={
        "inline-flex items-center justify-center px-2 py-1 rounded-sm text-sm border " +
        (active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
      }
    >
      {children}
    </button>
  );
}

/**
 * Editor component
 */
export default function Editor({
  open,
  initialHtml = "",
  onClose = () => {},
  onSave = (html) => {},
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [localHtml, setLocalHtml] = useState(initialHtml ?? "");
  const lastProgrammaticHtmlRef = useRef(null);

  // When initialHtml prop changes, update internal html and write to DOM once
  useEffect(() => {
    setLocalHtml(initialHtml ?? "");
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml ?? "<p></p>";
      lastProgrammaticHtmlRef.current = initialHtml ?? "<p></p>";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  // When open becomes true, ensure DOM contains the right HTML and focus
  useEffect(() => {
    if (open && editorRef.current) {
      const desired = localHtml || "<p></p>";
      if (lastProgrammaticHtmlRef.current !== desired) {
        editorRef.current.innerHTML = desired;
        lastProgrammaticHtmlRef.current = desired;
      }
      // focus slightly later so modal open animation (if any) finishes
      setTimeout(() => editorRef.current.focus(), 40);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const saveSelection = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    } catch {
      savedRangeRef.current = null;
    }
  };

  const restoreSelection = () => {
    try {
      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      if (savedRangeRef.current) {
        sel.addRange(savedRangeRef.current);
      } else if (editorRef.current) {
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.addRange(range);
      }
    } catch {
      // ignore
    }
  };

  const syncStateFromDOM = () => {
    const html = editorRef.current?.innerHTML ?? "";
    lastProgrammaticHtmlRef.current = html;
    setLocalHtml(html);
  };

  const exec = (cmd, value = null) => {
    restoreSelection();
    try {
      if (cmd === "formatBlock" && typeof value === "string") {
        const tag = value.replace(/<\/?|>/g, "").toLowerCase();
        document.execCommand(cmd, false, `<${tag}>`);
      } else {
        document.execCommand(cmd, false, value);
      }
    } catch (err) {
      try {
        document.execCommand(cmd, false, value);
      } catch (e) {
        console.error("exec error", e);
      }
    } finally {
      // read DOM and keep state in sync (we don't re-write DOM here)
      syncStateFromDOM();
      editorRef.current && editorRef.current.focus();
      saveSelection();
    }
  };

  const insertLink = () => {
    saveSelection();
    const url = window.prompt("Enter URL (https://...):", "https://");
    if (!url) return;
    exec("createLink", url);
  };

  const pickImage = () => {
    saveSelection();
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type || !f.type.startsWith("image/")) {
      alert("Please select an image file");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        exec("insertImage", reader.result);
      } catch {
        // fallback manual insert
        try {
          restoreSelection();
          const img = document.createElement("img");
          img.src = String(reader.result);
          img.style.maxWidth = "100%";
          const sel = window.getSelection();
          const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
          if (range) {
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          } else if (editorRef.current) {
            editorRef.current.appendChild(img);
          }
          syncStateFromDOM();
        } catch (err2) {
          console.error("image insert failed", err2);
        }
      } finally {
        try {
          e.target.value = "";
        } catch {}
      }
    };
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    const html = editorRef.current?.innerHTML ?? localHtml;
    onSave(html);
    onClose();
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p></p>";
      lastProgrammaticHtmlRef.current = "<p></p>";
      setLocalHtml("<p></p>");
      editorRef.current.focus();
    }
  };

  // Optional: intercept paste to avoid weird formatting (keeps things simple)
  const handlePaste = (e) => {
    // paste as plain text to avoid unexpected structure
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
    // update stored html
    setTimeout(syncStateFromDOM, 0);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="relative z-60 w-[92%] md:w-3/4 lg:w-2/3 max-h-[90%] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div style={{ fontWeight: 700 }}>Rich Text Editor</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Simple WYSIWYG (client-side). Save to write HTML back.</div>
          </div>

          <div className="flex items-center gap-2">
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className="px-3 py-1 rounded border text-sm bg-white hover:bg-slate-50">Clear</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={onClose} className="px-3 py-1 rounded border text-sm bg-white hover:bg-slate-50">Close</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Save</button>
          </div>
        </div>

        <div className="px-3 py-2 border-b" style={{ background: "#fbfdff" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <ToolbarButton onClick={() => { saveSelection(); exec("bold"); }} title="Bold"><b>B</b></ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("italic"); }} title="Italic"><i>I</i></ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("underline"); }} title="Underline"><u>U</u></ToolbarButton>

            <ToolbarButton onClick={() => { saveSelection(); exec("insertUnorderedList"); }} title="Bulleted list">• List</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("insertOrderedList"); }} title="Numbered list">1. List</ToolbarButton>

            <ToolbarButton onClick={() => { saveSelection(); exec("formatBlock", "<h2>"); }} title="H2">H2</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("formatBlock", "<p>"); }} title="Paragraph">P</ToolbarButton>

            <ToolbarButton onClick={() => { saveSelection(); exec("justifyLeft"); }} title="Align left">L</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("justifyCenter"); }} title="Align center">C</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("justifyRight"); }} title="Align right">R</ToolbarButton>

            <ToolbarButton onClick={() => { saveSelection(); insertLink(); }} title="Insert link">🔗</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); pickImage(); }} title="Insert image">🖼️</ToolbarButton>

            <input ref={fileInputRef} id="hidden-image-input" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <ToolbarButton onClick={() => { saveSelection(); exec("undo"); }} title="Undo">↶</ToolbarButton>
            <ToolbarButton onClick={() => { saveSelection(); exec("redo"); }} title="Redo">↷</ToolbarButton>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, padding: 16, overflow: "hidden" }}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => {
              // update state on user typing
              const html = editorRef.current?.innerHTML ?? "";
              lastProgrammaticHtmlRef.current = html;
              setLocalHtml(html);
              saveSelection();
            }}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onPaste={handlePaste}
            style={{
              flex: 1,
              minHeight: 320,
              border: "1px solid #E6E9EE",
              padding: 14,
              borderRadius: 8,
              outline: "none",
              overflowY: "auto",
              // critical: force left-to-right and normal unicode-bidi to avoid RTL/bi-di reversing
              direction: "ltr",
              unicodeBidi: "normal",
            }}
            className="prose"
            // NOTE: we *do not* use dangerouslySetInnerHTML on every render.
            // ensure initial DOM content is present when component mounts:
            // if editorRef.current is null right now, the useEffect above will populate it when available.
          >
            {/* React won't render children into a contentEditable reliably,
                so we set innerHTML imperatively in useEffect. For the very first mount,
                if editorRef.current is available now, populate it: */}
            {typeof window !== "undefined" && editorRef.current && editorRef.current.innerHTML === "" ? (
              // The element's innerHTML will be set by useEffect, but this guard prevents React from
              // printing content inside the element. This JSX branch is inert — the DOM is managed imperatively.
              null
            ) : null}
          </div>

          <div style={{ width: 300, maxHeight: 420, overflow: "auto", borderLeft: "1px solid #eee", paddingLeft: 12 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Live HTML preview</div>
            <div style={{ fontSize: 12, background: "#fbfbfb", padding: 8, borderRadius: 6 }}>
              <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{localHtml || "<p></p>"}</pre>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div style={{ fontSize: 13, color: "#6b7280" }}>Supports basic formatting and client-side images</div>
          <div className="flex items-center gap-2">
            <button onMouseDown={(e) => e.preventDefault()} onClick={onClose} className="px-3 py-1 rounded border hover:bg-slate-50">Close</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Save & Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
