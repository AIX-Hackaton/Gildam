const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!configuredApiBaseUrl) return normalizedPath

  return `${configuredApiBaseUrl.replace(/\/+$/, '')}${normalizedPath}`
}

export class ApiNotFoundError extends Error {
  constructor(message = '요청한 코스를 찾을 수 없습니다.') {
    super(message)
    this.name = 'ApiNotFoundError'
  }
}

/** 서버가 내려준 오류 코드를 보존해 화면에서 분기할 수 있게 합니다. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function isApiNotFoundError(error: unknown): error is ApiNotFoundError {
  return error instanceof ApiNotFoundError
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

async function readErrorBody(response: Response) {
  try {
    const body: unknown = await response.json()

    if (body && typeof body === 'object') {
      const parsed = body as { code?: string; message?: string; detail?: string }
      return {
        code: parsed.code ?? 'REQUEST_FAILED',
        message:
          parsed.message ??
          parsed.detail ??
          '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      }
    }
  } catch {
    // 오류 본문이 JSON이 아니어도 화면은 계속 동작해야 합니다.
  }

  return {
    code: 'REQUEST_FAILED',
    message: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  }
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

  let response: Response

  try {
    response = await fetch(buildApiUrl(path), { ...options, headers })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      '네트워크에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
    )
  }

  if (response.status === 404) {
    const { message } = await readErrorBody(response)
    throw new ApiNotFoundError(message)
  }

  if (!response.ok) {
    const { code, message } = await readErrorBody(response)
    throw new ApiError(response.status, code, message)
  }

  return response.json() as Promise<T>
}
