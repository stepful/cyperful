import { useEffect, useState } from "react";

// TODO: just use `react-query`?
export const useQuery = <T>({
  // queryKey,
  queryFn,
}: {
  // queryKey: unknown[];
  queryFn: () => Promise<T>;
}) => {
  const [state, setState] = useState<{
    data?: T;
    error?: Error;
    isLoading: boolean;
  }>({
    data: undefined,
    error: undefined,
    isLoading: false,
  });

  const fetch = async () => {
    setState({ isLoading: true });
    try {
      const data = await queryFn();
      setState({ data, isLoading: false });
    } catch (error) {
      setState({ error: error as Error, isLoading: false });
    }
  };

  useEffect(() => {
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};
