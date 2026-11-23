import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import { api } from './axios'

export interface SessionRequestConfig extends AxiosRequestConfig {
  skipSessionRefresh?: boolean
  sessionRetry?: boolean
}

const SESSION_EXPIRED_EVENT = 'agendamentos-smart:session-expired'

let refreshPromise: Promise<void> | null = null
let expirationEventEmitted = false

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', undefined, { withCredentials: true })
      .then(() => {
        expirationEventEmitted = false
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function requestWithSession<T = unknown>(
  config: SessionRequestConfig,
): Promise<AxiosResponse<T>> {
  const { skipSessionRefresh, sessionRetry, ...axiosConfig } = config

  try {
    return await api.request<T>(axiosConfig)
  } catch (error) {
    const status = getResponseStatus(error)
    const canRefresh =
      status === 401 && !skipSessionRefresh && !sessionRetry

    if (!canRefresh) {
      throw error
    }

    try {
      await refreshSession()
      return await api.request<T>(axiosConfig)
    } catch (refreshError) {
      emitSessionExpired()
      throw refreshError
    }
  }
}

export function clearSessionExpirationSignal() {
  expirationEventEmitted = false
}

function emitSessionExpired() {
  if (expirationEventEmitted || typeof window === 'undefined') {
    return
  }

  expirationEventEmitted = true
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export function addSessionExpiredListener(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handler = () => listener()
  window.addEventListener(SESSION_EXPIRED_EVENT, handler)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
}

function getResponseStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined
  }

  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return undefined
  }

  return typeof response.status === 'number' ? response.status : undefined
}
