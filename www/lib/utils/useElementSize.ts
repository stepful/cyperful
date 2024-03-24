import { useEffect, useRef, useState } from "react";

export const useElementSize = () => {
  const ref = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      if (!ref.current) return;
      setSize({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
    });

    observer.observe(ref.current);

    setSize({
      width: ref.current.offsetWidth,
      height: ref.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  return [size, ref] as const;
};
