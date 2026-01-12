import { useMemo, useState } from "react";
import type { Layout } from "react-grid-layout";
import type { WorkspaceView } from "./InstrumentWorkspace";
import { CANVAS_PX, GRID_PX, getCanvasGrid } from "./constants";
import { colorClassForInstrumentId, getInstrumentColorMap } from "./instrumentColors";
import type { InstrumentInstance } from "./types";

export function WorkspaceMinimapOverlay({
  layout,
  instruments,
  view,
  viewportSize,
  onCenterInstrument,
}: {
  layout: Layout[];
  instruments: InstrumentInstance[];
  view: WorkspaceView;
  viewportSize: { width: number; height: number };
  onCenterInstrument?: (id: string) => void;
}) {
  const { originX, originY } = getCanvasGrid();

  const instrumentTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of instruments) map.set(inst.id, inst.title);
    return map;
  }, [instruments]);

  const instrumentColorMap = useMemo(
    () => getInstrumentColorMap(instruments),
    [instruments],
  );

  const [tooltip, setTooltip] = useState<
    | null
    | {
        id: string;
        title: string;
        left: number;
        top: number;
        width: number;
        height: number;
      }
  >(null);

  const viewWorld = useMemo(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) return null;
    const left = (-view.x) / view.scale;
    const top = (-view.y) / view.scale;
    const right = (viewportSize.width - view.x) / view.scale;
    const bottom = (viewportSize.height - view.y) / view.scale;
    return { left, top, right, bottom };
  }, [view, viewportSize]);

  const sizePx = 220;
  const mapScale = sizePx / CANVAS_PX;

  return (
    <div className="absolute bottom-3 right-3 z-50 pointer-events-auto">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-2 backdrop-blur-md">
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
          style={{ width: sizePx, height: sizePx }}
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Workspace extent */}
          <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/10" />

          {/* Instruments */}
          {layout.map((l) => {
            const id = String(l.i);
            const title = instrumentTitleById.get(id) ?? id;
            const worldX = (l.x + originX) * GRID_PX;
            const worldY = (l.y + originY) * GRID_PX;
            const worldW = l.w * GRID_PX;
            const worldH = l.h * GRID_PX;

            const left = worldX * mapScale;
            const top = worldY * mapScale;
            const width = Math.max(2, worldW * mapScale);
            const height = Math.max(2, worldH * mapScale);

            const colorClass = colorClassForInstrumentId(instrumentColorMap, id);

            return (
              <button
                key={id}
                type="button"
                className={`absolute z-[2] ${colorClass} opacity-80 transition-opacity hover:opacity-100`}
                style={{
                  left,
                  top,
                  width,
                  height,
                  borderRadius: 2,
                  padding: 0,
                  border: 0,
                  boxShadow: "none",
                  backgroundImage: "none",
                }}
                onMouseEnter={() =>
                  setTooltip({ id, title, left, top, width, height })
                }
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onCenterInstrument?.(id)}
                aria-label={title}
                tabIndex={-1}
              />
            );
          })}

          {/* Tooltip */}
          {tooltip ? (
            <div
              className="pointer-events-none absolute z-[20] rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-semibold text-white/90 backdrop-blur-md"
              style={{
                left: Math.min(
                  sizePx - 8,
                  Math.max(8, tooltip.left + tooltip.width / 2),
                ),
                top: Math.max(8, tooltip.top - 8),
                transform: "translate(-50%, -100%)",
                whiteSpace: "nowrap",
              }}
            >
              {tooltip.title}
            </div>
          ) : null}

          {/* Viewport */}
          {viewWorld ? (
            (() => {
              const left = Math.max(0, Math.min(CANVAS_PX, viewWorld.left)) * mapScale;
              const top = Math.max(0, Math.min(CANVAS_PX, viewWorld.top)) * mapScale;
              const right = Math.max(0, Math.min(CANVAS_PX, viewWorld.right)) * mapScale;
              const bottom = Math.max(0, Math.min(CANVAS_PX, viewWorld.bottom)) * mapScale;
              const width = Math.max(2, right - left);
              const height = Math.max(2, bottom - top);
              return (
                <div
                  className="pointer-events-none absolute z-[5] rounded-sm border border-white/70"
                  style={{ left, top, width, height }}
                />
              );
            })()
          ) : null}
        </div>
      </div>
    </div>
  );
}
