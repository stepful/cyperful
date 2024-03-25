import { useState } from "react";
import { useStepsData } from "~/lib/data";
import { createProvider } from "~/lib/utils/providers";
import { useConfig } from "./config";

export const [HoverProvider, useHover] = createProvider(() => {
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const { steps, test_status } = useStepsData() || {};

  const hoveredStep =
    steps && test_status !== "running" && stepIndex != null
      ? steps[stepIndex]
      : null;

  const shouldRecord = useConfig()?.history_recording ?? false;

  const isRunning = test_status === "running";

  const canHover =
    shouldRecord &&
    (test_status === "passed" ||
      test_status === "failed" ||
      test_status === "paused");

  return {
    shouldRecord,
    hoveredStep,
    setStepIndex,
    canHover,
    isRunning,
  };
});
