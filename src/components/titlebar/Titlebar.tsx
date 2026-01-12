import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Square, X } from "lucide-react";

function isProbablyTauri() {
  const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__);
}

export function Titlebar() {
  const [maximized, setMaximized] = useState(false);

  const enabled = useMemo(() => isProbablyTauri(), []);

  const refreshState = useCallback(async () => {
    if (!enabled) return;
    try {
      const mod = await import("@tauri-apps/api/window");
      const win = mod.getCurrentWindow();
      setMaximized(await win.isMaximized());
    } catch {
      // ignore
    }
  }, [enabled]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const onMinimize = useCallback(async () => {
    if (!enabled) return;
    const mod = await import("@tauri-apps/api/window");
    await mod.getCurrentWindow().minimize();
  }, [enabled]);

  const onToggleMaximize = useCallback(async () => {
    if (!enabled) return;
    const mod = await import("@tauri-apps/api/window");
    const win = mod.getCurrentWindow();
    const isMax = await win.isMaximized();
    if (isMax) await win.unmaximize();
    else await win.maximize();
    setMaximized(!isMax);
  }, [enabled]);

  const onClose = useCallback(async () => {
    if (!enabled) return;
    const mod = await import("@tauri-apps/api/window");
    await mod.getCurrentWindow().close();
  }, [enabled]);

  return (
    <div
      data-tauri-drag-region
      style={{ userSelect: "none", zIndex: 10000 }}
      className="flex h-9 w-full items-center justify-between border-b border-slate-400/30 bg-black/90 px-2 text-slate-300"
    >
      <span className="truncate text-xs font-semibold tracking-wide" data-tauri-drag-region>
        Infinity WASM Emulator
      </span>

      <div className="no-drag flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onMinimize}
          disabled={!enabled}
          className="no-drag p-1 text-slate-400 transition duration-200 hover:text-gray-300 disabled:opacity-40"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleMaximize}
          disabled={!enabled}
          className="no-drag p-1 bg-transparent text-slate-400 transition duration-200 hover:text-gray-300 disabled:opacity-40"
          aria-label={maximized ? "Restore" : "Maximize"}
        >
          <Square className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={!enabled}
          className="no-drag p-1 text-slate-400 transition duration-200 hover:text-red-500 disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
