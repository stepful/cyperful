import { clamp } from "lodash-es";
import { useCallback, useState } from "react";
import { createProvider } from "~/lib/utils/providers";

export const [HoverProvider, useHover] = createProvider(() => {
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const [hoverRatio, setHoverRatio] = useState(0.0);

  const setHover = useCallback((index: number | null, ratio = 0.0) => {
    setStepIndex(index);
    setHoverRatio(clamp(ratio, 0.0, 1.0));
  }, []);

  return {
    stepIndex,
    hoverRatio,
    setHover,
  };
});
