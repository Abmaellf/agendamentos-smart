import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'

import { api } from './axios'

export interface AxiosBaseQueryArgs {
  url: string
  method?: AxiosRequestConfig['method']
  data?: unknown
  params?: AxiosRequestConfig['params']
  headers?: AxiosRequestConfig['headers']
}

export interface AxiosBaseQueryError {
  status: number | 'FETCH_ERROR'
  data: unknown
}

export const axiosBaseQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> = async ({ url, method, data, params, headers }) => {
  try {
    const response = await api.request({
      url,
      method,
      data,
      params,
      headers,
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
