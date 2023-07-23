import React, { Component, useEffect, useState } from 'react';

import { cn } from './utils';

/**
 * This file contains general-purpose UI components.
 */

const BUTTON_COLORS = {
  gray: 'text-black bg-gray-200 hover:bg-gray-300',
  green: 'text-white bg-green-500 hover:bg-green-600',
  blue: 'text-white bg-blue-500 hover:bg-blue-600',
  red: 'text-white bg-red-500 hover:bg-red-600',
  orange: 'text-white bg-orange-400 hover:bg-orange-500',
  yellow: 'text-white bg-yellow-500 hover:bg-yellow-600',
};

const BUTTON_SIZES = {
  sm: 'text-sm h-7',
  md: 'text-base h-8',
  lg: 'text-lg h-10',
};

type ButtonProps = {
  onClick: () => any;
  className?: string;
  children: React.ReactNode;
  colorScheme?: keyof typeof BUTTON_COLORS;
  'aria-label'?: string;
  size?: keyof typeof BUTTON_SIZES;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  colorScheme = 'gray',
  size = 'md',
  ...rest
}) => {
  return (
    <button
      type="button"
      className={cn(
        'font-semibold py-1 px-3 rounded whitespace-nowrap inline-flex items-center',
        BUTTON_COLORS[colorScheme],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export const IconButton: React.FC<
  Omit<ButtonProps, 'children'> & {
    icon: React.ReactNode;
    'aria-label': string;
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
  if (seconds.length < 5) seconds = '0' + seconds;

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
