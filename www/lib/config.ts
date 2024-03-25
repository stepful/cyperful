import { createProvider } from "~/lib/utils/providers";
import { request } from "./request";
import { useQuery } from "./utils/useQuery";

export type AppConfig = {
  history_recording: boolean;
};

export const [ConfigProvider, useConfig] = createProvider(() => {
  const { data: config } = useQuery({
    // queryKey: ["config"],
    queryFn: () => request<AppConfig>("/api/config"),
  });

  return config;
});
