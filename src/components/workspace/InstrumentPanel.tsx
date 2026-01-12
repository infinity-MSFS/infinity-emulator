import { useState } from "react";
import { AttitudeCanvas } from "../gauge";
import { useElementSize } from "../../ui/useElementSize";
import type { InstrumentInstance } from "./types";

export function InstrumentPanel({
  instrument,
  onRemove,
}: {
  instrument: InstrumentInstance;
  onRemove: (id: string) => void;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hotReload, setHotReload] = useState(true);

  return (
    <div className="instrumentPanel">
      <div className="instrumentPanelHeader">
        <div className="instrumentPanelTitle" title={instrument.title}>
          {instrument.title}
        </div>

        <div className="instrumentPanelHeaderActions noDrag">
          <button
            type="button"
            className="hotReloadToggle"
            onClick={() => setHotReload((v) => !v)}
            aria-pressed={hotReload}
            title="Hot reload (UI only)"
          >
            <span className={`hotReloadTrack ${hotReload ? "isOn" : ""}`}>
              <span className={`hotReloadThumb ${hotReload ? "isOn" : ""}`} />
            </span>
          </button>

          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            onClick={() => onRemove(instrument.id)}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="instrumentPanelBody" ref={ref}>
        {instrument.kind === "attitude" ? (
          <AttitudeCanvas
            containerWidth={Math.max(1, Math.floor(size.width))}
            containerHeight={Math.max(1, Math.floor(size.height))}
            fps={30}
          />
        ) : (
          <div className="instrumentPlaceholder">
            <div>
              External instrument placeholder
              {instrument.sourceFileName ? `: ${instrument.sourceFileName}` : ""}
            </div>
            <div className="instrumentPlaceholderHint">(File loading not wired yet)</div>
          </div>
        )}
      </div>
    </div>
  );
}
