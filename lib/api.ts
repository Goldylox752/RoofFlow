const API = process.env.NEXT_PUBLIC_API_URL;

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  return res.json();
}