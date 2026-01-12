import React, { type FC, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type DropdownOption = { value: string; label: string; disabled?: boolean };

type T_DropdownProps = {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
  hint?: string;
};

export const Dropdown: FC<T_DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
  invalid = false,
  hint,
}) => {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
  } | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );
  const selectedLabel = selected?.label ?? placeholder;

  const enabledOptions = useMemo(
    () => options.filter((o) => !o.disabled),
    [options],
  );

  const selectValue = (v: string) => {
    if (disabled) return;
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;

      const t = e.target as HTMLElement;
      if (root.contains(t)) return;
      if (t.closest?.("[data-dropdown-portal]")) return;

      setOpen(false);
    }

    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;

      const r = btn.getBoundingClientRect();
      const viewportH = window.innerHeight;

      const approxMenuH = Math.min(16 * 4 * 10, 256);
      const spaceBelow = viewportH - r.bottom;
      const placeAbove = spaceBelow < approxMenuH && r.top > spaceBelow;

      setMenuPos({
        top: placeAbove ? r.top : r.bottom,
        left: r.left,
        width: r.width,
        placeAbove,
      });
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }

    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();

    if (enabledOptions.length === 0) return;

    const currentIdx = enabledOptions.findIndex((o) => o.value === value);
    const idx = currentIdx === -1 ? 0 : currentIdx;

    const nextIdx =
      e.key === "ArrowDown"
        ? Math.min(enabledOptions.length - 1, idx + 1)
        : Math.max(0, idx - 1);

    const next = enabledOptions[nextIdx];
    if (next) selectValue(next.value);
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className={cx(
          "w-full rounded-lg border px-3 py-2 text-sm outline-none transition",
          "inline-flex items-center justify-between gap-3",
          invalid
            ? "border-red-500/40 bg-red-500/10 focus:border-red-500/70"
            : "border-white/15 bg-white/5 hover:bg-white/10 focus:border-blue-500/50 focus:bg-white/10",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white/5",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={cx(
            "min-w-0 truncate",
            selected ? "text-white" : "text-white/50",
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={cx(
            "h-4 w-4 shrink-0 transition-transform text-white/70",
            open && "rotate-180",
          )}
        />
      </button>

      {hint ? <div className="mt-1 text-xs text-white/50">{hint}</div> : null}

      {open && menuPos
        ? createPortal(
            <div
              data-dropdown-portal
              className="fixed z-[9999]"
              style={{
                left: menuPos.left,
                width: menuPos.width,
                top: menuPos.top,
                transform: menuPos.placeAbove
                  ? "translateY(-8px) translateY(-100%)"
                  : "translateY(8px)",
              }}
            >
              <div
                className={cx(
                  "overflow-hidden rounded-xl border",
                  "border-white/10 bg-transparent backdrop-blur-lg",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                )}
              >
                <div className={cx("max-h-64 overflow-y-auto outline-none")}>
                  {options.map((opt) => {
                    const isSelected = opt.value === value;
                    const isDisabled = !!opt.disabled;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && selectValue(opt.value)}
                        className={cx(
                          "w-full px-3 py-2.5 text-left text-sm transition",
                          "flex items-center justify-between gap-3",
                          "border-b border-white/5 last:border-b-0",
                          isDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-white/10 active:bg-white/15",
                          isSelected ? "bg-white/10" : "bg-transparent",
                        )}
                      >
                        <span className="min-w-0 truncate text-white/90">
                          {opt.label}
                        </span>
                        {isSelected ? <Check className="h-4 w-4 text-blue-300" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
