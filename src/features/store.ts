import { configureStore } from '@reduxjs/toolkit'

import { patientApi } from './patient/patient-api'

export const store = configureStore({
  reducer: {
    [patientApi.reducerPath]: patientApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(patientApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
