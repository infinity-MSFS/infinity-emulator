function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const instrumentColors = [
  "bg-sky-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-fuchsia-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-lime-400",
  "bg-cyan-400",
  "bg-teal-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-pink-400",
  "bg-purple-400",
  "bg-indigo-400",
  "bg-blue-400",
] as const;

export type InstrumentColorClass = (typeof instrumentColors)[number];

export function getInstrumentColorMap(instruments: Array<{ id: string }>) {
  const used = new Set<InstrumentColorClass>();
  const map = new Map<string, InstrumentColorClass>();

  for (const inst of instruments) {
    if (map.has(inst.id)) continue;

    const start = hashString(inst.id) % instrumentColors.length;
    let chosen: InstrumentColorClass | undefined;
    for (let step = 0; step < instrumentColors.length; step++) {
      const c = instrumentColors[(start + step) % instrumentColors.length];
      if (!used.has(c)) {
        chosen = c;
        break;
      }
    }

    chosen ??= instrumentColors[start];
    used.add(chosen);
    map.set(inst.id, chosen);
  }

  return map;
}

export function colorClassForInstrumentId(
  colorMap: Map<string, InstrumentColorClass>,
  id: string,
) {
  return (
    colorMap.get(id) ?? instrumentColors[hashString(id) % instrumentColors.length]
  );
}
