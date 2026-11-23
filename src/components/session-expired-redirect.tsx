import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  addSessionExpiredListener,
  clearSessionExpirationSignal,
} from '@/lib/session-client'
import { baseApi } from '@/lib/base-api'
import type { AppDispatch } from '@/lib/store'

export function SessionExpiredRedirect() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  useEffect(() => {
    return addSessionExpiredListener(() => {
      dispatch(baseApi.util.resetApiState())
      clearSessionExpirationSignal()
      navigate('/sign-in', { replace: true })
      toast.error('Sua sessão expirou. Entre novamente.')
    })
  }, [dispatch, navigate])

  return null
}
