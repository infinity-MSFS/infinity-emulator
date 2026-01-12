import { useMemo, useState } from "react";
import { Terminal, Boxes, Plus, Pin, PinOff } from "lucide-react";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { Dropdown, type DropdownOption } from "../ui/Dropdown";
import type { InstrumentInstance } from "../workspace/types";
import { colorClassForInstrumentId, getInstrumentColorMap } from "../workspace/instrumentColors";

type SimVarInputType = "slider" | "text" | "checkbox";

type SimVarUi = {
  id: string;
  name: string;
  unit: string;
  pinned: boolean;
  inputType: SimVarInputType;
  valueText: string;
  valueBool: boolean;
  valueNum: number;
};

const inputTypeOptions: DropdownOption[] = [
  { value: "slider", label: "Slider" },
  { value: "text", label: "Text" },
  { value: "checkbox", label: "Checkbox" },
];

const updateRateOptions: DropdownOption[] = [
  { value: "10", label: "10 Hz" },
  { value: "20", label: "20 Hz" },
  { value: "30", label: "30 Hz" },
  { value: "60", label: "60 Hz" },
];

export function ControlSidebar({
  instruments,
  onCenterInstrument,
  onAddInstrument,
  onAddTestGauge,
}: {
  instruments: InstrumentInstance[];
  onCenterInstrument: (id: string) => void;
  onAddInstrument: () => void;
  onAddTestGauge: () => void;
}) {
  const [updateRate, setUpdateRate] = useState("30");
  const [paused, setPaused] = useState(false);

  const [simvarSearch, setSimvarSearch] = useState("");

  const [simvars, setSimvars] = useState<SimVarUi[]>(() => [
    {
      id: "airspeed",
      name: "AIRSPEED INDICATED",
      unit: "knots",
      pinned: true,
      inputType: "slider",
      valueText: "120",
      valueBool: false,
      valueNum: 120,
    },
    {
      id: "altitude",
      name: "PLANE ALTITUDE",
      unit: "feet",
      pinned: false,
      inputType: "text",
      valueText: "3500",
      valueBool: false,
      valueNum: 3500,
    },
    {
      id: "pitch",
      name: "PLANE PITCH DEGREES",
      unit: "deg",
      pinned: false,
      inputType: "slider",
      valueText: "1.5",
      valueBool: false,
      valueNum: 2,
    },
    {
      id: "gear",
      name: "GEAR HANDLE POSITION",
      unit: "bool",
      pinned: false,
      inputType: "checkbox",
      valueText: "0",
      valueBool: false,
      valueNum: 0,
    },
  ]);

  const filteredSimvars = useMemo(() => {
    const q = simvarSearch.trim().toLowerCase();
    const list = q
      ? simvars.filter((s) => s.name.toLowerCase().includes(q))
      : simvars;

    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [simvars, simvarSearch]);

  const setSimvar = (id: string, patch: Partial<SimVarUi>) => {
    setSimvars((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };


  const instrumentColorMap = useMemo(
    () => getInstrumentColorMap(instruments),
    [instruments],
  );

  return (
    <aside className="h-full w-full border-r border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-wide text-white/90">
            Control Panel
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
          {instruments.length} instruments
        </div>
      </div>

      <div className="flex h-[calc(100%-56px)] flex-col gap-3 overflow-auto p-3">
        <CollapsibleSection
          title="Instruments"
          subtitle="Manage workspace instruments"
          defaultOpen
        >
          <button
            type="button"
            onClick={onAddInstrument}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            Add instrument
          </button>

          <button
            type="button"
            onClick={onAddTestGauge}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            title="Add a built-in attitude test gauge"
          >
            <Plus className="h-4 w-4" />
            Add test gauge
          </button>

          <div className="mt-3 space-y-2">
            {instruments.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate text-sm font-semibold text-white/85">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${colorClassForInstrumentId(instrumentColorMap, inst.id)}`}
                    />
                    <span className="truncate">{inst.title}</span>
                  </div>
                  <div className="truncate text-xs text-white/50">{inst.kind}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onCenterInstrument(inst.id)}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                  Center in view
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Communication Bus" subtitle="View Comm Bus Calls" defaultOpen={false}>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Boxes className="h-4 w-4" />
            No Comm Bus registration.
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 opacity-60 focus-visible:outline-none"
            >
              Send
            </button>
            <button
              type="button"
              disabled
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 opacity-60 focus-visible:outline-none"
            >
              Reload
            </button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Native Console" subtitle="stdout / stdin" defaultOpen={false}>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Terminal className="h-4 w-4" />
            Console bridge to native module.
          </div>

          <div className="mt-3 min-h-[110px] w-full resize-y overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/70">
            <div className="opacity-70">[femboybussy.wasm] ready</div>
            <div className="opacity-40">(output will appear here)</div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="SimVars" subtitle="View / Edit SimVars used by instruments" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <div className="text-xs text-white/50">Connection</div>
              <div className="text-sm font-semibold text-white/80">Disconnected</div>
            </div>

            <div className="col-span-2">
              <Dropdown
                value={updateRate}
                onChange={setUpdateRate}
                options={updateRateOptions}
                className="w-full"
                hint="Update rate"
              />
            </div>

            <label className="col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm text-white/70">Paused</span>
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
                className="h-4 w-4 accent-blue-400"
              />
            </label>
          </div>

          <div className="mt-3">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Search simvars"
              value={simvarSearch}
              onChange={(e) => setSimvarSearch(e.target.value)}
            />
          </div>

          <div className="mt-3 space-y-2">
            {filteredSimvars.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/90">
                      {s.name}
                    </div>
                    <div className="text-xs text-white/50">{s.unit}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSimvar(s.id, { pinned: !s.pinned })}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                  >
                    {s.pinned ? (
                      <>
                        <Pin className="h-3.5 w-3.5" /> Pinned
                      </>
                    ) : (
                      <>
                        <PinOff className="h-3.5 w-3.5" /> Pin
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <Dropdown
                    value={s.inputType}
                    onChange={(v) => setSimvar(s.id, { inputType: v as SimVarInputType })}
                    options={inputTypeOptions}
                    hint="Input type"
                  />
                </div>

                <div className="mt-3">
                  {s.inputType === "slider" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={s.valueNum}
                        onChange={(e) => setSimvar(s.id, { valueNum: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="w-12 text-right text-xs text-white/60">
                        {s.valueNum}
                      </div>
                    </div>
                  ) : s.inputType === "checkbox" ? (
                    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm text-white/70">Value</span>
                      <input
                        type="checkbox"
                        checked={s.valueBool}
                        onChange={(e) => setSimvar(s.id, { valueBool: e.target.checked })}
                        className="h-4 w-4 accent-blue-400"
                      />
                    </label>
                  ) : (
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                      value={s.valueText}
                      onChange={(e) => setSimvar(s.id, { valueText: e.target.value })}
                      placeholder="Enter value"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
}
