declare global {
  let __CYPERFUL_CONFIG__: {
    CYPERFUL_ORIGIN: string;
  };
}

// injected using string-replacement by the server
const config = __CYPERFUL_CONFIG__;

export function getConfig() {
  if (!config) {
    throw new Error("Cyperful Agent config not initialized");
  }
  return config;
}
