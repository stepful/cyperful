import { memo, useRef } from "react";
// React RFC https://github.com/reactjs/rfcs/pull/119 in userland:
import * as UCS from "use-context-selector";

const emptyCtx = Symbol("empty ctx");

/**
 * @example
 * const [StuffProvider, useStuff] = createSelectorProvider((props: { xs: number[] }) => {
 *  const [y, setY] = useState(0);
 *  return { xs: props.xs, y, setY };
 * });
 *
 * // fetch the whole context:
 * const { x, y } = useStuff();
 *
 * // just subscribe to a specific value. This hook will only re-render when that value's reference changes.
 * const xs = useStuffSelector((ctx) => ctx.xs);
 *
 * // optionally provide an equality function for `useContextSelector` if
 * // you want to compare e.g. an array's values instead of it's reference
 * // (the default equality function is `Object.is(a, b)`)
 * const xs = useStuffSelector((ctx) => ctx.xs, (a, b) => _.isEqual(a, b));
 */
export const createProvider = <
  CtxValue,
  // optional provider props
  ProviderProps extends Record<string, unknown> | void,
>(
  /** Called once when provider mounts. `args` are props passed the this provider (optional). */
  useInitProvider: (args: ProviderProps) => CtxValue,
  /** Just used for error messages and React displayName. Use PascalCase. */
  label = "Unknown",
) => {
  const Context = UCS.createContext<CtxValue | typeof emptyCtx>(emptyCtx);

  const { Provider: ProviderCtx } = Context;

  const Provider: React.FC<
    {
      children: React.ReactNode;
    } & (ProviderProps extends void ? Record<string, never> : ProviderProps)
  > = memo(({ children, ...args }) => {
    const value = useInitProvider(args as unknown as ProviderProps);
    return <ProviderCtx value={value}>{children}</ProviderCtx>;
  });

  Provider.displayName = `${label}Provider`;

  function useCtx(): CtxValue;
  function useCtx<T>(
    selector: (base: CtxValue) => T,
    equalityFn?: (a: T | null, b: T) => boolean,
  ): T;
  function useCtx<T>(
    selector?: (base: CtxValue) => T,
    equalityFn?: (a: T | null, b: T) => boolean,
  ) {
    const prevVal = useRef<T | null>(null);

    return UCS.useContextSelector(Context, (ctx) => {
      if (ctx === emptyCtx)
        throw new Error(`${label} context missing a provider`);

      if (equalityFn) {
        const newVal = selector!(ctx);
        if (equalityFn(prevVal.current, newVal)) {
          return prevVal.current;
        } else {
          return (prevVal.current = newVal);
        }
      } else {
        return selector ? selector(ctx) : ctx;
      }
    });
  }

  return [Provider, useCtx] as const;
};
