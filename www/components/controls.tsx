import {
  PlayIcon,
  ResetIcon,
  StepThroughIcon,
  StopIcon,
} from "~/components/icons";
import { Button, IconButton, Timer } from "~/components/shared";
import { sendCommand, useStepsData } from "~/lib/data";
import { cn } from "~/lib/utils";

export const Controls: React.FC = () => {
  const {
    test_status: status,
    test_duration_ms,
    current_step_index,
  } = useStepsData() || {};

  return (
    <>
      <span className="font-mono text-gray-500 text-lg bg-gray-100 rounded-md py-1 px-3 shadow-inner">
        <Timer
          givenElapsedMs={test_duration_ms ?? null}
          paused={status !== "running"}
        />
      </span>

      {(status === "pending" || status === "paused") && (
        <IconButton
          onClick={() => sendCommand("start")}
          colorScheme="green"
          aria-label={status === "pending" ? "Start" : "Resume"}
          icon={<PlayIcon />}
        />
      )}
      {(status === "pending" || status === "paused") && (
        <IconButton
          onClick={() =>
            sendCommand("start", {
              pause_at_step: (current_step_index ?? -1) + 1,
            })
          }
          colorScheme="blue"
          icon={<StepThroughIcon />}
          aria-label="Step Through"
        />
      )}
      {status === "running" && (
        <IconButton
          onClick={() => sendCommand("stop")}
          colorScheme="red"
          icon={<StopIcon />}
          aria-label="Stop"
        />
      )}
      {(status === "passed" || status === "failed") && (
        <>
          <span
            className={cn(
              "text-md capitalize rounded-full text-white px-3 py-1",
              status === "passed" ? "bg-green-500" : "bg-red-500",
            )}
          >
            Test {status}
          </span>
        </>
      )}

      {status !== "pending" && status !== "running" ? (
        <IconButton
          onClick={() => sendCommand("reset")}
          colorScheme="red"
          icon={<ResetIcon />}
          aria-label="Reset"
        />
      ) : null}

      <div className="flex-1" />

      <Button onClick={() => sendCommand("exit")}>Exit</Button>
    </>
  );
};
