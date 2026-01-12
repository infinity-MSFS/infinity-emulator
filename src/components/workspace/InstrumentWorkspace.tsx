import { useEffect, useMemo, useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import { InstrumentPanel } from "./InstrumentPanel";
import type { InstrumentInstance } from "./types";
import { useElementSize } from "../../ui/useElementSize";
import { CANVAS_PX, GRID_PX, getCanvasGrid } from "./constants";
import { WorkspaceMinimapOverlay } from "./WorkspaceMinimapOverlay";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export type WorkspaceView = { x: number; y: number; scale: number };

export function InstrumentWorkspace({
  instruments,
  layout,
  onLayoutChange,
  onRemoveInstrument,
  onContextMenu,
  view,
  setView,
  onViewportSizeChange,
  onCenterInstrument,
}: {
  instruments: InstrumentInstance[];
  layout: Layout[];
  onLayoutChange: (next: Layout[]) => void;
  onRemoveInstrument: (id: string) => void;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  view: WorkspaceView;
  setView: React.Dispatch<React.SetStateAction<WorkspaceView>>;
  onViewportSizeChange?: (size: { width: number; height: number }) => void;
  onCenterInstrument?: (id: string) => void;
}) {
  const { ref, node, size } = useElementSize<HTMLDivElement>();

  const gridPx = GRID_PX;
  const canvasPx = CANVAS_PX;
  const { cols, originX, originY } = getCanvasGrid();

  const scaledGridPx = Math.max(1, gridPx * view.scale);
  const scaledCanvasPx = Math.max(1, canvasPx * view.scale);

  const layoutForGrid = useMemo<Layout[]>(
    () =>
      layout.map((l) => ({
        ...l,
        x: l.x + originX,
        y: l.y + originY,
      })),
    [layout, originX, originY],
  );

  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  useEffect(() => {
    onViewportSizeChange?.(size);
  }, [size, onViewportSizeChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceDown(false);
        setPanning(false);
        panStart.current = null;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!node) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = node.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      setView((prev) => {
        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
        const nextScale = clamp(prev.scale * zoomFactor, 0.35, 2.5);

        const worldX = (cx - prev.x) / prev.scale;
        const worldY = (cy - prev.y) / prev.scale;
        const nextX = cx - worldX * nextScale;
        const nextY = cy - worldY * nextScale;
        return { x: nextX, y: nextY, scale: nextScale };
      });
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [node, setView]);

  const instrumentById = useMemo(() => {
    const map = new Map<string, InstrumentInstance>();
    for (const inst of instruments) map.set(inst.id, inst);
    return map;
  }, [instruments]);

  return (
    <div
      ref={ref}
      className="workspaceGridWrap bg-dot-white/10 focus:outline-none"
      role="application"
      aria-label="Instrument workspace"
      tabIndex={-1}
      onContextMenu={onContextMenu}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest?.("button, input, select, textarea, .noDrag")) return;

        const shouldPan = e.button === 1 || (spaceDown && e.button === 0);
        if (!shouldPan) return;

        e.preventDefault();
        setPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      }}
      onMouseMove={(e) => {
        if (!panning || !panStart.current) return;
        e.preventDefault();
        const start = panStart.current;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        setView((prev) => ({ ...prev, x: start.vx + dx, y: start.vy + dy }));
      }}
      onMouseUp={() => {
        setPanning(false);
        panStart.current = null;
      }}
      onMouseLeave={() => {
        setPanning(false);
        panStart.current = null;
      }}
      style={{
        cursor: panning ? "grabbing" : spaceDown ? "grab" : "default",
        backgroundSize: `${gridPx * view.scale}px ${gridPx * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <WorkspaceMinimapOverlay
        layout={layout}
        instruments={instruments}
        view={view}
        viewportSize={size}
        onCenterInstrument={onCenterInstrument}
      />

      <div
        style={{
          width: `${canvasPx}px`,
          height: `${canvasPx}px`,
          backgroundSize: `${gridPx}px ${gridPx}px`,
          transform: `translate(${view.x}px, ${view.y}px)`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <GridLayout
          className="workspaceGrid"
          width={scaledCanvasPx}
          cols={cols}
          rowHeight={scaledGridPx}
          margin={[0, 0]}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={false}
          isBounded={false}
          transformScale={1}
          draggableHandle=".instrumentPanelHeader"
          draggableCancel="button, input, select, textarea, .noDrag"
          layout={layoutForGrid}
          onLayoutChange={(next) =>
            onLayoutChange(
              next.map((l) => ({
                ...l,
                x: l.x - originX,
                y: l.y - originY,
              })),
            )
          }
        >
          {layoutForGrid.map((l) => {
            const inst = instrumentById.get(String(l.i));
            if (!inst) return <div key={l.i} />;
            return (
              <div key={l.i} className="workspaceGridItem">
                <InstrumentPanel instrument={inst} onRemove={onRemoveInstrument} />
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
