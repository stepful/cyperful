import { createContext, memo, useContext } from "react";
// React RFC https://github.com/reactjs/rfcs/pull/119 in userland:
// import * as UCS from 'use-context-selector';

const emptyCtx = Symbol("empty ctx");

/**
 * Create a context provider and a hook to access it. Useful if you need:
 * - to avoid prop drilling
 * - to hold a state that is shared across multiple components
 * - to avoid re-rendering components that don't need to re-render
 * - to only run expensive calculations in one place (e.g. in a `useMemo`)
 *
 * @example
 * const [StuffProvider, useStuff] = createProvider((props: { xs: number[] }) => {
 *  const [y, setY] = useState(0);
 *  return { xs: props.xs, y, setY };
 * });
 *
 * // fetch the whole context:
 * const { x, y } = useStuff();
 */
export const createProvider = <
  CtxValue,
  // optional provider props
  ProviderProps extends Record<string, any> | void,
>(
  /** Called once when provider mounts. `args` are props passed the this provider (optional). */
  useInitProvider: (args: ProviderProps) => CtxValue,
  /** Just used for error messages and React displayName. Use PascalCase. */
  label = "Unknown",
) => {
  const Context = createContext<CtxValue | typeof emptyCtx>(emptyCtx);

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

  const useCtx = (): CtxValue => {
    const ctx = useContext(Context);
    if (ctx === emptyCtx)
      throw new Error(`${label} context missing a provider`);
    return ctx;
  };

  return [Provider, useCtx] as const;
};
