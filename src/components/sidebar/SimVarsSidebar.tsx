import { useMemo, useState } from "react";

type SimVarRow = {
  name: string;
  unit: string;
  value: string;
};

export function SimVarsSidebar() {
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);

  const rows = useMemo<SimVarRow[]>(
    () => [
      { name: "AIRSPEED INDICATED", unit: "knots", value: "120" },
      { name: "PLANE ALTITUDE", unit: "feet", value: "3500" },
      { name: "PLANE PITCH DEGREES", unit: "deg", value: "1.5" },
      { name: "PLANE BANK DEGREES", unit: "deg", value: "-0.2" },
      { name: "GENERAL ENG THROTTLE LEVER POSITION:1", unit: "%", value: "55" },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="sidebarTitle">SimVars</div>
        <div className="sidebarSub">UI only (not wired)</div>
      </div>

      <div className="sidebarSection">
        <div className="sidebarSectionTitle">Session</div>
        <div className="sidebarRow">
          <label className="sidebarLabel">Connection</label>
          <div className="sidebarValue">Disconnected</div>
        </div>
        <div className="sidebarRow">
          <label className="sidebarLabel">Update rate</label>
          <select className="sidebarInput" defaultValue="30">
            <option value="10">10 Hz</option>
            <option value="20">20 Hz</option>
            <option value="30">30 Hz</option>
            <option value="60">60 Hz</option>
          </select>
        </div>
        <div className="sidebarRow">
          <label className="sidebarLabel">Paused</label>
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
          />
        </div>
      </div>

      <div className="sidebarSection">
        <div className="sidebarSectionTitle">Browse</div>
        <input
          className="sidebarInput"
          placeholder="Search simvars"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="sidebarTable">
          {filtered.map((r) => (
            <div className="sidebarTableRow" key={r.name}>
              <div className="sidebarTableName" title={r.name}>
                {r.name}
              </div>
              <div className="sidebarTableMeta">
                <span className="sidebarTableUnit">{r.unit}</span>
                <input className="sidebarInlineInput" value={r.value} readOnly />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebarSection">
        <div className="sidebarSectionTitle">Override (mock)</div>
        <div className="sidebarRow">
          <label className="sidebarLabel">Selected SimVar</label>
          <select className="sidebarInput" defaultValue="PLANE PITCH DEGREES">
            <option>PLANE PITCH DEGREES</option>
            <option>PLANE BANK DEGREES</option>
            <option>AIRSPEED INDICATED</option>
          </select>
        </div>
        <div className="sidebarRow">
          <label className="sidebarLabel">Value</label>
          <input className="sidebarInput" placeholder="Enter value" />
        </div>
        <div className="sidebarRow">
          <button className="sidebarButton" disabled>
            Apply (disabled)
          </button>
        </div>
      </div>
    </aside>
  );
}
