import { useLayoutEffect, useState } from "react";

export type ElementSize = {
  width: number;
  height: number;
};

export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!node) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);

  return { ref: setNode, node, size };
}
