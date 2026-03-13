export type ApiStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ApiError {
  message: string
  code?: string
}

export interface ApiState<T> {
  status: ApiStatus
  data: T | null
  error: ApiError | null
}