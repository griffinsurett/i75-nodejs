// src/components/Modal.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  isOpen,
  onClose,
  children,
  closeButton = true,
  closeButtonClass = "absolute top-0 right-0 m-2",
  overlayClass = "bg-text/50 bg-opacity-50",
  className = "bg-bg shadow-xl p-4 rounded-md",
  allowScroll = false,
  // NEW: centered (default) or anchored (renders children directly; no transforms)
  variant = "centered",
}) {
  const [mounted, setMounted] = useState(isOpen);
  const modalRef = useRef(null);

  useEffect(() => { if (isOpen) setMounted(true); }, [isOpen]);

  useEffect(() => {
    if (mounted && !allowScroll) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = orig; };
    }
  }, [mounted, allowScroll]);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    if (mounted) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const handleAnimationEnd = () => { if (!isOpen) setMounted(false); };
  if (!mounted) return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[250]
        ${overlayClass}
        transition-opacity duration-200
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={onClose}
      onTransitionEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
    >
      {variant === "centered" ? (
        <div
          ref={modalRef}
          className={`
            relative ${className}
            mx-auto my-auto flex items-center justify-center
            transform-gpu transition-transform duration-200 origin-top
            ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {closeButton && (
            <button onClick={onClose} className={closeButtonClass} aria-label="Close modal">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {children}
        </div>
      ) : (
        // ANCHORED: render children directly; no wrapper transforms
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      )}
    </div>,
    document.body
  );
}
