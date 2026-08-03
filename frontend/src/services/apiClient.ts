const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!configuredApiBaseUrl) return normalizedPath

  return `${configuredApiBaseUrl.replace(/\/+$/, '')}${normalizedPath}`
}

export class ApiNotFoundError extends Error {
  constructor(message = 'Requested API resource was not found.') {
    super(message)
    this.name = 'ApiNotFoundError'
  }
}

export function isApiNotFoundError(error: unknown): error is ApiNotFoundError {
  return error instanceof ApiNotFoundError
}

export async function fetchApiJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const optionHeaders =
    options.headers &&
    !Array.isArray(options.headers) &&
    !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {}
  const headers = {
    Accept: 'application/json',
    ...optionHeaders,
  }
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  })

  if (response.status === 404) {
    throw new ApiNotFoundError()
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}
