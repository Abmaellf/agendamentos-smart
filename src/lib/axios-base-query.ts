import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'

import { requestWithSession } from './session-client'

export interface AxiosBaseQueryArgs {
  url: string
  method?: AxiosRequestConfig['method']
  data?: unknown
  params?: AxiosRequestConfig['params']
  headers?: AxiosRequestConfig['headers']
  skipSessionRefresh?: boolean
}

export interface AxiosBaseQueryError {
  status: number | 'FETCH_ERROR'
  data: unknown
}

export const axiosBaseQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> = async ({ url, method, data, params, headers, skipSessionRefresh }) => {
  try {
    const response = await requestWithSession({
      url,
      method,
      data,
      params,
      headers,
      skipSessionRefresh,
    })

    return { data: response.data }
  } catch (error) {
    const axiosError = error as AxiosError

    return {
      error: {
        status: axiosError.response?.status ?? 'FETCH_ERROR',
        data: axiosError.response?.data ?? axiosError.message,
      },
    }
  }
}
