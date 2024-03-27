import {
  CheckIcon,
  CloseIcon,
  GoToHereIcon,
  LoaderIcon,
  PauseIcon,
} from "~/components/icons";
import type { Step } from "~/lib/data";
import { useHover } from "~/lib/hover";
import { cn } from "~/lib/utils";

export const StepRow: React.FC<{
  step: Step;
  actions?: React.ReactNode;
  pauseAtStep?: boolean;
}> = ({ step, actions, pauseAtStep }) => {
  const ms = step.start_at && step.end_at ? step.end_at - step.start_at : null;

  let icon: React.ReactNode = null;
  let textClass = "text-gray-600";

  const iconShared = "inline-block w-5 h-5 ml-1";
  if (step.status === "passed") {
    icon = <CheckIcon className={`${iconShared} text-green-500`} />;
    textClass = "text-green-500";
  } else if (step.status === "failed") {
    icon = <CloseIcon className={`${iconShared} text-red-500`} />;
    textClass = "text-red-400";
  } else if (step.status === "running") {
    icon = (
      <LoaderIcon className={`${iconShared} text-gray-500 animate-spin`} />
    );
    textClass = "text-blue-500";
  } else if (step.status === "paused") {
    icon = <PauseIcon className={`${iconShared} text-yellow-500`} />;
    textClass = "text-yellow-500";
  }

  const setHover = useHover((s) => s.setHover);

  return (
    <li
      data-step-index={step.index}
      className="group relative p-2 text-sm border-b border-gray-200 flex items-start hover:bg-gray-100 cursor-pointer"
      onMouseEnter={() => setHover(step.index)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientY - rect.top) / rect.height;
        setHover(step.index, ratio);
      }}
      onMouseLeave={() => setHover(null)}
    >
      <p className="flex-1">
        <span className="text-gray-400 w-6 inline-block">
          {step.index + 1}.
        </span>
        {Array.from({ length: step.block_depth }).map((_, i) => (
          <span key={i} className="text-gray-400">
            ↳
          </span>
        ))}
        <span className={cn("font-mono", textClass)}>{step.as_string}</span>
        {icon}
        {pauseAtStep ? (
          <GoToHereIcon className="inline-block w-5 h-5 text-yellow-500 ml-1" />
        ) : null}
        {ms != null ? (
          <span className="text-gray-400 ml-1">({ms}ms)</span>
        ) : null}
      </p>

      <div className="hidden group-hover:block absolute top-1 right-4">
        {actions}
      </div>

      {step.permalink ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={step.permalink}
          className="text-gray-600 text-xs hover:underline"
          title={`Open in ${step.permalink.match(/^(\w+):/)?.[1] ?? "editor"}`}
        >
          🔗
        </a>
      ) : null}
    </li>
  );
};
