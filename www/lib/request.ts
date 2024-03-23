export const request = async <T>(
  url: string,
  method = 'GET',
  data?: Record<string, unknown>,
) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data != null ? JSON.stringify(data) : undefined,
  });
  const json = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : undefined;
  if (!res.ok)
    throw new Error(
      `Request error: ${method} ${url} - ${res.status} ${res.statusText}`,
    );
  return json as T;
};
