import {
  CheckIcon,
  CloseIcon,
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
      <span className="rounded-md bg-gray-100 px-3 py-1 font-mono text-lg text-gray-500 shadow-inner">
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
              "text-md flex items-center rounded-full px-3 py-1 capitalize",
              status === "passed"
                ? "border-2 border-green-700 bg-green-600 text-green-100"
                : "border-2 border-red-600 bg-red-500 text-red-100",
            )}
          >
            Test {status}
            {status === "passed" ? (
              <CheckIcon className="ml-1 inline-block h-5 w-5" />
            ) : (
              <CloseIcon className="ml-1 inline-block h-5 w-5" />
            )}
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

      <Button colorScheme="outline" onClick={() => sendCommand("exit")}>
        Exit
      </Button>
    </>
  );
};
