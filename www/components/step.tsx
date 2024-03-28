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
  let textClass = "text-current";

  const iconShared = "inline-block w-5 h-5 ml-1";
  if (step.status === "passed") {
    icon = <CheckIcon className={`${iconShared} text-green-500`} />;
    textClass = "text-green-500";
  } else if (step.status === "failed") {
    icon = <CloseIcon className={`${iconShared} text-red-500`} />;
    textClass = "text-red-400";
  } else if (step.status === "running") {
    icon = (
      <LoaderIcon className={`${iconShared} animate-spin text-gray-500`} />
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
      className="group relative flex cursor-pointer items-start p-2 text-sm hover:bg-slate-600"
      onMouseEnter={() => setHover(step.index)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientY - rect.top) / rect.height;
        setHover(step.index, ratio);
      }}
      onMouseLeave={() => setHover(null)}
    >
      <p className="flex-1">
        <span className="inline-block w-6 text-slate-500">
          {step.index + 1}.
        </span>
        {Array.from({ length: step.block_depth }).map((_, i) => (
          <span key={i} className="text-slate-400">
            ↳
          </span>
        ))}
        <span className={cn("font-mono", textClass)}>{step.as_string}</span>
        {icon}
        {pauseAtStep ? (
          <GoToHereIcon className="ml-1 inline-block h-5 w-5 text-yellow-500" />
        ) : null}
        {ms != null ? (
          <span className="ml-1 text-slate-400">({ms}ms)</span>
        ) : null}
      </p>

      <div className="absolute right-4 top-1 hidden group-hover:block">
        {actions}
      </div>

      {step.permalink ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={step.permalink}
          className="text-xs hover:underline"
          title={`Open in ${step.permalink.match(/^(\w+):/)?.[1] ?? "editor"}`}
        >
          🔗
        </a>
      ) : null}
    </li>
  );
};
