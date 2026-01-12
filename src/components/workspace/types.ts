export type InstrumentKind = "attitude" | "external";

export type InstrumentInstance = {
  id: string;
  title: string;
  kind: InstrumentKind;
  sourceFileName?: string;
};
