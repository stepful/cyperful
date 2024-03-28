import { Component, useEffect, useState } from "react";
import { Button, type ButtonProps } from "./ui/button";

export { Button };

/**
 * This file contains general-purpose UI components.
 */

export const IconButton: React.FC<
  Omit<ButtonProps, "children"> & {
    icon: React.ReactNode;
    "aria-label": string;
  }
> = ({ icon, ...props }) => {
  return (
    <Button {...props}>
      <span className="text-[1.25em]">{icon}</span>
    </Button>
  );
};

export const Timer: React.FC<{
  paused: boolean;
  givenElapsedMs: number | null;
}> = ({ paused, givenElapsedMs = 0 }) => {
  const [elapsed, setElapsed] = useState<number | null>(null);
  useEffect(() => {
    if (givenElapsedMs == null) return setElapsed(null);

    if (paused) return setElapsed(givenElapsedMs);

    const startAt = Date.now();

    const interval = setInterval(() => {
      setElapsed(givenElapsedMs + (Date.now() - startAt));
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [paused, givenElapsedMs]);

  // const elapsedMs = elapsed ?? overrideElapsed;
  if (elapsed == null) return <>00.00</>;

  let seconds = (elapsed / 1000).toFixed(2);
  if (seconds.length < 5) seconds = "0" + seconds;

  return <>{seconds}</>;
};

export class ErrorBoundary extends Component<{
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (error != null) {
      return this.props.fallback?.(error) ?? null;
    }
    return this.props.children;
  }
}

export const withErrorBoundary =
  (Comp: React.FC, Fallback: React.FC): React.FC =>
  (props) => (
    <ErrorBoundary fallback={() => <Fallback />}>
      <Comp {...props} />
    </ErrorBoundary>
  );
