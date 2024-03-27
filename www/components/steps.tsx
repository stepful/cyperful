import { findLastIndex } from "lodash-es";
import { Fragment, memo, useEffect } from "react";

import { EventRow } from "~/components/event";
import { GoToHereIcon } from "~/components/icons";
import { Button } from "~/components/shared";
import { StepRow } from "~/components/step";
import { sendCommand, useBrowserEvents, useStepsData } from "~/lib/data";
import { EMPTY_ARRAY } from "~/lib/utils";

const Steps_: React.FC = () => {
  const {
    steps,
    current_step_index,
    test_status,
    test_suite,
    test_name,
    test_error,
    pause_at_step,
  } = useStepsData() || {};

  const events = useBrowserEvents();

  // scroll to last updated step
  useEffect(() => {
    if (!steps?.[0]) return;
    if (steps[0].status === "pending") return; // tests haven't started yet

    let lastNonPendingStepIndex = findLastIndex(
      steps,
      (s) => s.status !== "pending",
    );
    if (lastNonPendingStepIndex === -1)
      lastNonPendingStepIndex = steps.length - 1;

    const element = document.querySelector(
      `[data-step-index="${lastNonPendingStepIndex}"]`,
    );
    if (!element) return;

    element.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, [steps]);

  if (!steps) return <p className="p-4 text-gray-600">Loading...</p>;

  const failedStepI = steps.findIndex((s) => s.status === "failed");

  return (
    <div className="bg-gray-50 flex-1">
      <p className="bg-gray-100 p-2 text-gray-600 text-sm font-mono">
        {test_suite}:
        <br />
        &nbsp;&nbsp;{test_name}
      </p>
      <ol className="border-t border-gray-200">
        {steps?.map((step, i) => {
          const showError =
            test_error != null &&
            step.index === (failedStepI === -1 ? 0 : failedStepI) ? (
              <pre className="font-mono text-sm p-2 border-b border-gray-200 whitespace-pre-wrap text-red-500">
                <strong>Test failure:</strong>
                <br />
                {test_error}
              </pre>
            ) : null;

          const thisStepStartAt = step.start_at;
          const nextStepStartAt = steps[i + 1]?.start_at;
          const showEvents =
            thisStepStartAt != null
              ? events.filter((e) => {
                  return (
                    e.timestamp > thisStepStartAt &&
                    (nextStepStartAt == null || e.timestamp < nextStepStartAt)
                  );
                })
              : EMPTY_ARRAY;

          return (
            <Fragment key={step.index}>
              {failedStepI === -1 ? showError : null}
              <StepRow
                step={step}
                pauseAtStep={pause_at_step === step.index}
                actions={
                  <>
                    {(test_status === "paused" || test_status === "pending") &&
                    (current_step_index == null ||
                      step.index > current_step_index) ? (
                      <Button
                        onClick={() => {
                          void sendCommand("start", {
                            pause_at_step: step.index,
                          });
                        }}
                        className="mr-2"
                        size="sm"
                      >
                        <GoToHereIcon className="mr-2 text-[1.25em]" />
                        Run to here
                      </Button>
                    ) : null}
                  </>
                }
              />
              {failedStepI !== -1 ? showError : null}

              {showEvents.map((evt) => {
                return <EventRow key={evt.id} event={evt} />;
              })}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
};
export const Steps = memo(Steps_);
