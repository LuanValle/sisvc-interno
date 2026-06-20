const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${configuredBaseUrl}${normalizedPath}`
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    credentials: configuredBaseUrl ? 'include' : 'same-origin',
    ...options,
  })
}
