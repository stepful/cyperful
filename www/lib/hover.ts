import { useState } from "react";
import { useStepsData } from "~/lib/data";
import { createProvider } from "~/lib/utils/providers";

export const [HoverProvider, useHover] = createProvider(() => {
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const { steps, test_status } = useStepsData() || {};

  const step =
    steps && test_status !== "running" && stepIndex != null
      ? steps[stepIndex]
      : null;

  return { step, setStepIndex };
});
