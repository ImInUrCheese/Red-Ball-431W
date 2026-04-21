export async function request<T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
