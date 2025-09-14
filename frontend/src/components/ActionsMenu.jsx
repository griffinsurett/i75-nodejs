import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

/**
 * Generic overflow actions menu ("...") with optional Link or Button items.
 *
 * items: Array<{
 *   label: string,
 *   icon?: React.ComponentType<any>,
 *   to?: string,            // if provided -> renders as <Link>
 *   onClick?: () => void,   // if provided -> renders as <button>
 *   danger?: boolean        // styles item in red
 * }>
 */
export default function ActionsMenu({
  items = [],
  className = '',
  buttonClassName = 'w-9 h-9',
  menuClassName = 'w-48',
  align = 'right',
  ariaLabel = 'Actions',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center justify-center rounded-md hover:bg-bg border border-border-primary ${buttonClassName}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${menuClassName} bg-bg rounded-md shadow-lg border border-border-primary z-50`}
          role="menu"
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            const inner = (
              <div
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-bg2'
                }`}
              >
                {Icon ? <Icon className="w-4 h-4" /> : null}
                <span>{item.label}</span>
              </div>
            );

            if (item.to) {
              return (
                <Link
                  key={idx}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                role="menuitem"
                className="w-full text-left"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
